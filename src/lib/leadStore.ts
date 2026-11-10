import { isBuyRequirement, type AnyFindHomeSubmission, type AnyRequirement } from "./findHome/buySchema.js";
import { Redis } from "@upstash/redis";
import { createHash, randomBytes } from "crypto";
import {
  CONTACT_RETENTION_DAYS, LEAD_STATUSES, computeDimensions, diffRequirement, toSummary,
  type ContactEvent, type Feasibility, type Lead, type LeadStatus, type LeadSummary, type LeadTag, type Level,
} from "./findHome/lead.js";
import { PRIVACY_POLICY_VERSION, type Decision, type LeadSource } from "./findHome/schema.js";

/**
 * 客戶需求（找房問卷）的儲存。
 *
 * 連線用獨立的環境變數（LEADS_REDIS_REST_URL / LEADS_REDIS_REST_TOKEN）。
 * Upstash 免費版只能有一個資料庫，目前填的是和統計同一個資料庫（鍵名 lead: 與 linus: 不衝突）；
 * 之後升級付費方案，只要把這兩個值換成新資料庫就能分開，程式不用改。
 * 沒設定 LEADS_REDIS_* 時：線上自動沿用 UPSTASH_REDIS_REST_*；本機不沿用（.env.local 有那組值，沿用會把測試資料寫進正式資料庫）。
 *
 * 結構（每筆客戶一份完整 JSON，量小，列表一次讀完在前端篩選即可）：
 *   lead:doc:{id}        → Lead JSON
 *   lead:ver:{id}        → 版本號（寫入時比對，避免兩邊同時改互相覆蓋）
 *   lead:index           → ZSET，score = 建立時間
 *   lead:ref:{refCode}   → id（參考碼不重複）
 *   lead:contact:{hash}  → id；同一聯絡方式 30 天內再填，併進同一筆而不是新開一筆。
 *                          只在聯絡方式還保留時存在，聯絡方式刪除時一起刪。
 *   lead:idem:{key}      → refCode（1 天）；同一次填寫重送不會產生兩筆
 *
 * 沒設定資料庫時：本機開發用記憶體（重開就消失）；正式環境直接回報未設定。
 */

const DOC = "lead:doc:";
const VER = "lead:ver:";
const INDEX = "lead:index";
const REF = "lead:ref:";
const CONTACT = "lead:contact:";
const IDEM = "lead:idem:";
const CONTACT_TTL_SECONDS = CONTACT_RETENTION_DAYS * 86_400;
const MAX_LIST = 500;

export interface LeadBackend {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, opts?: { nx?: boolean; ex?: number }): Promise<boolean>;
  del(...keys: string[]): Promise<void>;
  zadd(key: string, score: number, member: string): Promise<void>;
  zrevrange(key: string, count: number): Promise<string[]>;
  zrem(key: string, member: string): Promise<void>;
  mget<T>(keys: string[]): Promise<(T | null)[]>;
  /** 版本相符才寫入（Lua 腳本，原子操作）。 */
  casWrite(docKey: string, verKey: string, expectedVer: number, doc: unknown, newVer: number): Promise<boolean>;
}

class RedisBackend implements LeadBackend {
  constructor(private redis: Redis) {}
  async get<T>(key: string) { return (await this.redis.get<T>(key)) ?? null; }
  async set(key: string, value: unknown, opts: { nx?: boolean; ex?: number } = {}) {
    const result = opts.nx
      ? await this.redis.set(key, value, opts.ex ? { nx: true, ex: opts.ex } : { nx: true })
      : await this.redis.set(key, value, opts.ex ? { ex: opts.ex } : undefined);
    return result === "OK" || result === (true as any);
  }
  async del(...keys: string[]) { if (keys.length) await this.redis.del(...keys); }
  async zadd(key: string, score: number, member: string) { await this.redis.zadd(key, { score, member }); }
  async zrevrange(key: string, count: number) { return (await this.redis.zrange<string[]>(key, 0, count - 1, { rev: true })).map(String); }
  async zrem(key: string, member: string) { await this.redis.zrem(key, member); }
  async mget<T>(keys: string[]) { return keys.length ? ((await this.redis.mget<T[]>(...keys)) as (T | null)[]) : []; }
  async casWrite(docKey: string, verKey: string, expectedVer: number, doc: unknown, newVer: number) {
    const script = `
      local current = redis.call('GET', KEYS[2])
      if (current or '0') ~= ARGV[1] then return 0 end
      redis.call('SET', KEYS[1], ARGV[2])
      redis.call('SET', KEYS[2], ARGV[3])
      return 1`;
    const result = await this.redis.eval(script, [docKey, verKey], [String(expectedVer), JSON.stringify(doc), String(newVer)]);
    return Number(result) === 1;
  }
}

/** 記憶體版：本機開發與測試用，行為與 Redis 版一致（含 TTL 與版本比對）。 */
export class MemoryBackend implements LeadBackend {
  private data = new Map<string, { value: string; expiresAt: number | null }>();
  private zsets = new Map<string, Map<string, number>>();
  private alive(key: string) {
    const entry = this.data.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) { this.data.delete(key); return null; }
    return entry;
  }
  async get<T>(key: string) { const entry = this.alive(key); return entry ? (JSON.parse(entry.value) as T) : null; }
  async set(key: string, value: unknown, opts: { nx?: boolean; ex?: number } = {}) {
    if (opts.nx && this.alive(key)) return false;
    this.data.set(key, { value: JSON.stringify(value), expiresAt: opts.ex ? Date.now() + opts.ex * 1000 : null });
    return true;
  }
  async del(...keys: string[]) { keys.forEach(key => this.data.delete(key)); }
  async zadd(key: string, score: number, member: string) {
    if (!this.zsets.has(key)) this.zsets.set(key, new Map());
    this.zsets.get(key)!.set(member, score);
  }
  async zrevrange(key: string, count: number) {
    return [...(this.zsets.get(key) ?? new Map()).entries()].sort((a, b) => b[1] - a[1]).slice(0, count).map(([member]) => member);
  }
  async zrem(key: string, member: string) { this.zsets.get(key)?.delete(member); }
  async mget<T>(keys: string[]) { return Promise.all(keys.map(key => this.get<T>(key))); }
  async casWrite(docKey: string, verKey: string, expectedVer: number, doc: unknown, newVer: number) {
    const current = (await this.get<number>(verKey)) ?? 0;
    if (Number(current) !== expectedVer) return false;
    await this.set(docKey, doc);
    await this.set(verKey, newVer);
    return true;
  }
}

let backend: LeadBackend | null | undefined;
const devMemory = new MemoryBackend();

function resolveBackend(): LeadBackend | null {
  if (backend !== undefined) return backend;
  // 沒另外設定時，線上（NODE_ENV=production）沿用統計那組 Upstash；本機開發不沿用，避免測試資料寫進正式資料庫。
  const shareStats = process.env.NODE_ENV === "production";
  const url = process.env.LEADS_REDIS_REST_URL || (shareStats ? process.env.UPSTASH_REDIS_REST_URL : undefined);
  const token = process.env.LEADS_REDIS_REST_TOKEN || (shareStats ? process.env.UPSTASH_REDIS_REST_TOKEN : undefined);
  if (url && token) backend = new RedisBackend(new Redis({ url, token }));
  else backend = process.env.NODE_ENV === "production" ? null : devMemory;
  return backend;
}

/** 測試用：換成指定的儲存（例如新的 MemoryBackend）。 */
export function setLeadBackendForTests(next: LeadBackend | null) { backend = next; }

export function leadStoreConfigured() { return resolveBackend() !== null; }

function store(): LeadBackend {
  const resolved = resolveBackend();
  if (!resolved) throw new Error("Lead storage is not configured.");
  return resolved;
}

// 去掉容易看錯的 0/O、1/I/L：參考碼會被客人手打進 LINE。
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function randomCode(length: number): string {
  const bytes = randomBytes(length * 2);
  let out = "";
  for (let i = 0; i < bytes.length && out.length < length; i++) {
    if (bytes[i] < 256 - (256 % ALPHABET.length)) out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out.length === length ? out : randomCode(length);
}

export const REF_CODE_PATTERN = /^FH-[A-HJ-NP-Z2-9]{4}$/;
const ID_PATTERN = /^[A-HJ-NP-Z2-9]{16}$/;
export const isValidLeadId = (value: unknown): value is string => typeof value === "string" && ID_PATTERN.test(value);

function contactKey(channel: string, value: string, dealType: "rent" | "buy" = "rent") {
  const normalized = `${channel}:${value.toLowerCase()}`;
  return CONTACT + (dealType === "buy" ? "buy:" : "") + createHash("sha256").update(normalized).digest("hex");
}

const nowIso = (now = new Date()) => now.toISOString();

export type SubmitResult = { refCode: string; leadId: string; merged: boolean; duplicate: boolean; lead: Lead };

/**
 * 建立（或併入）一筆客戶需求。
 * - 同一個 idempotencyKey 一天內重送：直接回同一個參考碼，什麼都不寫。
 * - 同一組聯絡方式 30 天內再填：更新需求並記一筆變更紀錄，參考碼不變。
 */
export async function submitLead(
  input: AnyFindHomeSubmission,
  meta: { source: LeadSource; idempotencyKey: string },
  now = new Date(),
): Promise<SubmitResult> {
  const db = store();
  const dealType = isBuyRequirement(input.requirement) ? "buy" : "rent";
  const idemKey = `${IDEM}${dealType === "buy" ? "buy:" : ""}${meta.idempotencyKey}`;
  const seen = await db.get<{ refCode: string; leadId: string }>(idemKey);
  if (seen) {
    const lead = await db.get<Lead>(`${DOC}${seen.leadId}`);
    if (lead) return { ...seen, merged: false, duplicate: true, lead };
  }

  const dedupeKey = contactKey(input.contact.channel, input.contact.value, dealType);
  const existingId = await db.get<string>(dedupeKey);
  if (existingId) {
    const merged = await mergeResubmission(existingId, input, now);
    if (merged) {
      await db.set(idemKey, { refCode: merged.refCode, leadId: merged.id }, { ex: 86_400 });
      return { refCode: merged.refCode, leadId: merged.id, merged: true, duplicate: false, lead: merged };
    }
  }

  const id = randomCode(16);
  let refCode = "";
  for (let attempt = 0; attempt < 8 && !refCode; attempt++) {
    const candidate = `FH-${randomCode(4)}`;
    if (await db.set(`${REF}${candidate}`, id, { nx: true })) refCode = candidate;
  }
  if (!refCode) throw new Error("Unable to allocate a reference code.");

  const at = nowIso(now);
  const lead: Lead = {
    id,
    refCode,
    ver: 1,
    createdAt: at,
    updatedAt: at,
    source: meta.source,
    dealType,
    nickname: input.nickname,
    contact: { ...input.contact },
    contactTimes: input.contactTimes,
    requirement: input.requirement,
    decision: input.decision,
    admin: { status: "new", feasibility: "unknown", tags: [], notes: "" },
    dims: computeDimensions(input.requirement, input.decision, now),
    notify: { status: "pending" },
    revisions: [],
    events: [],
    consents: [{ at, policyVersion: PRIVACY_POLICY_VERSION, privacyAck: true, channel: "form" }],
  };

  await db.set(`${DOC}${id}`, lead);
  await db.set(`${VER}${id}`, 1);
  await db.zadd(INDEX, now.getTime(), id);
  await db.set(dedupeKey, id, { ex: CONTACT_TTL_SECONDS });
  await db.set(idemKey, { refCode, leadId: id }, { ex: 86_400 });
  return { refCode, leadId: id, merged: false, duplicate: false, lead };
}

async function mergeResubmission(id: string, input: AnyFindHomeSubmission, now: Date): Promise<Lead | null> {
  const current = await store().get<Lead>(`${DOC}${id}`);
  if (!current?.contact || isBuyRequirement(current.requirement) !== isBuyRequirement(input.requirement)) return null; // 找不到或聯絡方式已刪：當成新客人，另開一筆
  return updateLead(id, null, lead => {
    const changes = diffRequirement(lead.requirement, input.requirement, lead.decision, input.decision);
    const at = nowIso(now);
    lead.requirement = input.requirement;
    lead.decision = input.decision;
    lead.nickname = input.nickname;
    lead.contactTimes = input.contactTimes;
    lead.dims = computeDimensions(input.requirement, input.decision, now);
    if (changes.length) lead.revisions.unshift({ at, by: "client", changes });
    lead.events.unshift({ at, type: "resubmitted", text: changes.length ? `客人重新填寫問卷，${changes.length} 項有變` : "客人重新填寫問卷，內容沒有變" });
    lead.consents.unshift({ at, policyVersion: PRIVACY_POLICY_VERSION, privacyAck: true, channel: "form" });
    lead.notify = { status: "pending" };
    return lead;
  }, now);
}

/**
 * 讀→改→比對版本寫回。expectedVer 為 null 時用目前版本（系統內部操作）；
 * 後台傳入畫面上的版本，版本不符代表別處已經改過，回傳 "conflict"。
 */
async function updateLead(
  id: string,
  expectedVer: number | null,
  mutate: (lead: Lead) => Lead | null,
  now = new Date(),
): Promise<Lead | null> {
  const result = await updateLeadChecked(id, expectedVer, mutate, now);
  return result === "conflict" || result === "not-found" ? null : result;
}

export async function updateLeadChecked(
  id: string,
  expectedVer: number | null,
  mutate: (lead: Lead) => Lead | null,
  now = new Date(),
): Promise<Lead | "conflict" | "not-found"> {
  const db = store();
  for (let attempt = 0; attempt < 3; attempt++) {
    const lead = await db.get<Lead>(`${DOC}${id}`);
    if (!lead) return "not-found";
    if (expectedVer !== null && lead.ver !== expectedVer) return "conflict";
    const draft: Lead = structuredClone(lead);
    const next = mutate(draft);
    if (!next) return lead;
    next.ver = lead.ver + 1;
    next.updatedAt = nowIso(now);
    if (await db.casWrite(`${DOC}${id}`, `${VER}${id}`, lead.ver, next, next.ver)) return next;
    if (expectedVer !== null) return "conflict";
  }
  return "conflict";
}

export async function getLead(id: string): Promise<Lead | null> {
  if (!isValidLeadId(id)) return null;
  return store().get<Lead>(`${DOC}${id}`);
}

export async function listLeads(now = new Date()): Promise<LeadSummary[]> {
  const db = store();
  await purgeExpiredContacts(now);
  const ids = await db.zrevrange(INDEX, MAX_LIST);
  const docs = await db.mget<Lead>(ids.map(id => `${DOC}${id}`));
  return docs.filter((doc): doc is Lead => Boolean(doc)).map(toSummary);
}

/** 刪除聯絡方式（「已聯絡上」或送出滿 30 天）。稱呼與需求保留。 */
export async function removeContact(id: string, reason: "contacted" | "expired", expectedVer: number | null, now = new Date()) {
  let removedKey: string | null = null;
  const result = await updateLeadChecked(id, expectedVer, lead => {
    if (!lead.contact) return null;
    removedKey = contactKey(lead.contact.channel, lead.contact.value, lead.dealType);
    const at = nowIso(now);
    lead.contact = null;
    lead.contactRemovedAt = at;
    lead.contactRemovedReason = reason;
    if (reason === "contacted") {
      lead.admin.lastContactAt = at;
      if (lead.admin.status === "new" || lead.admin.status === "to-contact") lead.admin.status = "clarifying";
    }
    lead.events.unshift({
      at,
      type: "contact-removed",
      text: reason === "contacted" ? "已聯絡上，聯絡方式已刪除" : `送出滿 ${CONTACT_RETENTION_DAYS} 天，聯絡方式已自動刪除`,
    });
    return lead;
  }, now);
  if (removedKey && typeof result === "object") await store().del(removedKey);
  return result;
}

/** 把送出超過 30 天、還留著聯絡方式的資料刪掉聯絡方式。後台列表讀取時與每日排程都會跑。 */
export async function purgeExpiredContacts(now = new Date()): Promise<number> {
  const db = store();
  const ids = await db.zrevrange(INDEX, MAX_LIST);
  const docs = await db.mget<Lead>(ids.map(id => `${DOC}${id}`));
  const cutoff = now.getTime() - CONTACT_TTL_SECONDS * 1000;
  let purged = 0;
  for (const doc of docs) {
    if (doc?.contact && Date.parse(doc.createdAt) <= cutoff) {
      const result = await removeContact(doc.id, "expired", null, now);
      if (typeof result === "object") purged++;
    }
  }
  return purged;
}

export interface AdminPatch {
  status?: LeadStatus;
  feasibility?: Feasibility;
  nextFollowUpAt?: string | null;
  tags?: LeadTag[];
  notes?: string;
  dimsOverride?: Partial<Record<"urgency" | "readiness" | "flexibility", Level | null>>;
  requirement?: AnyRequirement;
  decision?: Decision;
  nickname?: string;
}

/** 後台修改。需求欄位有變時自動寫一筆變更紀錄（修改者：admin）。 */
export async function patchLead(id: string, expectedVer: number, patch: AdminPatch, now = new Date()) {
  return updateLeadChecked(id, expectedVer, lead => {
    if (patch.requirement && isBuyRequirement(patch.requirement) !== isBuyRequirement(lead.requirement)) throw new Error("需求類型不能在修改時變更。");
    const at = nowIso(now);
    if (patch.status && patch.status !== lead.admin.status) {
      const label = LEAD_STATUSES.find(item => item.id === patch.status)?.label ?? patch.status;
      lead.events.unshift({ at, type: "status", text: `狀態改為「${label}」` });
      lead.admin.status = patch.status;
    }
    if (patch.feasibility) lead.admin.feasibility = patch.feasibility;
    if (patch.nextFollowUpAt !== undefined) {
      if (patch.nextFollowUpAt) lead.admin.nextFollowUpAt = patch.nextFollowUpAt;
      else delete lead.admin.nextFollowUpAt;
    }
    if (patch.tags) lead.admin.tags = patch.tags;
    if (patch.notes !== undefined) lead.admin.notes = patch.notes;
    if (patch.nickname) lead.nickname = patch.nickname;
    if (patch.dimsOverride) {
      const next = { ...(lead.admin.dimsOverride || {}) };
      for (const [key, value] of Object.entries(patch.dimsOverride)) {
        if (value) (next as any)[key] = value;
        else delete (next as any)[key];
      }
      lead.admin.dimsOverride = next;
    }
    if (patch.requirement || patch.decision) {
      const requirement = patch.requirement ?? lead.requirement;
      const decision = patch.decision ?? lead.decision;
      const changes = diffRequirement(lead.requirement, requirement, lead.decision, decision);
      if (changes.length) lead.revisions.unshift({ at, by: "admin", changes });
      lead.requirement = requirement;
      lead.decision = decision;
      lead.dims = computeDimensions(requirement, decision, now);
    }
    return lead;
  }, now);
}

export async function addEvent(id: string, event: Pick<ContactEvent, "type" | "text">, now = new Date()) {
  return updateLeadChecked(id, null, lead => {
    lead.events.unshift({ at: nowIso(now), ...event });
    return lead;
  }, now);
}

export async function setNotifyStatus(id: string, status: Lead["notify"], now = new Date()) {
  return updateLeadChecked(id, null, lead => {
    lead.notify = { ...status, at: nowIso(now) };
    return lead;
  }, now);
}

/** 每日排程的節流鎖：同一段時間只跑一次，避免沒有 CRON_SECRET 時被外部反覆觸發。 */
export async function tryAcquirePurgeLock(seconds = 3600): Promise<boolean> {
  return store().set("lead:purge-lock", Date.now(), { nx: true, ex: seconds });
}

/** 客人要求刪除時用：整筆資料（含索引、參考碼、聯絡方式比對鍵）全部刪除。 */
export async function deleteLead(id: string): Promise<boolean> {
  const db = store();
  const lead = await db.get<Lead>(`${DOC}${id}`);
  if (!lead) return false;
  const keys = [`${DOC}${id}`, `${VER}${id}`, `${REF}${lead.refCode}`];
  if (lead.contact) keys.push(contactKey(lead.contact.channel, lead.contact.value, lead.dealType));
  await db.del(...keys);
  await db.zrem(INDEX, id);
  return true;
}
