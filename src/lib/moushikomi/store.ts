import { createHash, randomBytes } from "crypto";
import { leadStoreConfigured, sharedLeadBackend } from "../leadStore.js";
import { PRIVACY_POLICY_VERSION, RETENTION_DAYS, type CleanForm } from "./schema.js";

/**
 * 租屋申請資料的儲存（和找房問卷同一個 Upstash 資料庫，鍵名 app: 開頭）。
 *
 *   app:doc:{id}      → Application JSON
 *   app:ver:{id}      → 版本號（同時上傳多個檔案時避免互相覆蓋）
 *   app:index         → ZSET，score = 建立時間
 *   app:tok:{sha256}  → id；專屬連結的隨機碼只存雜湊當索引
 *   app:drive:auth    → Google Drive 授權（refresh token 與根資料夾）
 *   app:drive:state:{nonce} → 授權流程的一次性驗證碼（10 分鐘）
 *
 * 保存期限：結案時刪除；沒結案的，送出（或建立連結）滿 90 天由每日排程刪除，連 Drive 資料夾一起。
 */

const DOC = "app:doc:";
const VER = "app:ver:";
const INDEX = "app:index";
const TOK = "app:tok:";
export const DRIVE_AUTH_KEY = "app:drive:auth";
export const DRIVE_STATE = "app:drive:state:";
/** Redis 備援過期（排程失效時資料也不會永久留著）；排程正常時會在 90 天先刪掉並清 Drive。 */
const BACKSTOP_SECONDS = (RETENTION_DAYS + 10) * 86_400;

export interface UploadedFile { docId: string; name: string; size: number; mime: string; driveFileId: string; uploadedAt: string; afterSubmit?: boolean; /** 已經寫進通知信。 */ notified?: boolean }

export interface Application {
  id: string;
  refCode: string;
  token: string;
  /** 你在後台建立連結時填的客人稱呼。 */
  label: string;
  /** 建立連結時填的物件（選填），客人表單會預先帶入。 */
  property?: string;
  createdAt: string;
  submittedAt?: string;
  form?: CleanForm;
  /** 客人勾「之後再補」的文件。 */
  docLater: Record<string, boolean>;
  files: UploadedFile[];
  driveFolderId?: string;
  driveFolderUrl?: string;
  consent?: { at: string; policyVersion: string };
  notify?: { status: "sent" | "failed"; at: string; error?: string };
  events: { at: string; text: string }[];
}

export type ApplicationSummary = Pick<Application, "id" | "refCode" | "label" | "property" | "createdAt" | "submittedAt" | "driveFolderUrl"> & {
  identity?: string; fileCount: number; expiresAt: string; notifyFailed: boolean;
  docTiming?: string;
};

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function randomCode(length: number): string {
  const bytes = randomBytes(length * 2);
  let out = "";
  for (let i = 0; i < bytes.length && out.length < length; i++) {
    if (bytes[i] < 256 - (256 % ALPHABET.length)) out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out.length === length ? out : randomCode(length);
}
const ID_PATTERN = /^[A-HJ-NP-Z2-9]{16}$/;
export const isValidApplicationId = (value: unknown): value is string => typeof value === "string" && ID_PATTERN.test(value);
export const TOKEN_PATTERN = /^[A-Za-z0-9_-]{32}$/;
const tokenKey = (token: string) => TOK + createHash("sha256").update(token).digest("hex");
const nowIso = (now = new Date()) => now.toISOString();

export const applicationStoreConfigured = leadStoreConfigured;
const db = () => sharedLeadBackend();

export function expiresAt(app: Pick<Application, "createdAt" | "submittedAt">) {
  const base = Date.parse(app.submittedAt || app.createdAt);
  return new Date(base + RETENTION_DAYS * 86_400_000).toISOString();
}

export function summarize(app: Application): ApplicationSummary {
  return {
    id: app.id, refCode: app.refCode, label: app.label, property: app.form?.values.property || app.property,
    createdAt: app.createdAt, submittedAt: app.submittedAt, driveFolderUrl: app.driveFolderUrl,
    identity: app.form?.values.identity, fileCount: app.files.length, expiresAt: expiresAt(app),
    notifyFailed: app.notify?.status === "failed", docTiming: app.form?.values.docTiming,
  };
}

export async function createApplication(input: { label: string; property?: string }, now = new Date()): Promise<Application> {
  const store = db();
  let refCode = "";
  for (let i = 0; i < 8 && !refCode; i++) {
    const candidate = `AP-${randomCode(4)}`;
    if (await store.set(`app:ref:${candidate}`, "1", { nx: true, ex: BACKSTOP_SECONDS })) refCode = candidate;
  }
  if (!refCode) throw new Error("Could not allocate a reference code.");
  const app: Application = {
    id: randomCode(16), refCode, token: randomBytes(24).toString("base64url"),
    label: input.label, property: input.property || undefined, createdAt: nowIso(now),
    docLater: {}, files: [], events: [{ at: nowIso(now), text: "建立申請連結" }],
  };
  await store.set(DOC + app.id, app, { ex: BACKSTOP_SECONDS });
  await store.set(VER + app.id, 1, { ex: BACKSTOP_SECONDS });
  await store.set(tokenKey(app.token), app.id, { ex: BACKSTOP_SECONDS });
  await store.zadd(INDEX, now.getTime(), app.id);
  return app;
}

export async function getApplication(id: string): Promise<Application | null> {
  return isValidApplicationId(id) ? db().get<Application>(DOC + id) : null;
}

export async function findByToken(token: string): Promise<Application | null> {
  if (!TOKEN_PATTERN.test(token)) return null;
  const id = await db().get<string>(tokenKey(token));
  if (!id) return null;
  const app = await getApplication(String(id));
  return app && app.token === token ? app : null;
}

export async function listApplications(): Promise<ApplicationSummary[]> {
  const store = db();
  const ids = await store.zrevrange(INDEX, 500);
  const docs = await store.mget<Application>(ids.map(id => DOC + id));
  const missing = ids.filter((_, i) => !docs[i]);
  await Promise.all(missing.map(id => store.zrem(INDEX, id)));
  return docs.filter((doc): doc is Application => Boolean(doc)).map(summarize);
}

/** 讀出、修改、版本相符才寫回；同時有人寫入就重試。 */
export async function mutate(id: string, change: (app: Application) => Application | void): Promise<Application | null> {
  const store = db();
  for (let attempt = 0; attempt < 6; attempt++) {
    const [app, ver] = await Promise.all([store.get<Application>(DOC + id), store.get<number>(VER + id)]);
    if (!app) return null;
    const current = Number(ver ?? 0);
    const draft = structuredClone(app);
    const next = change(draft) || draft;
    if (await store.casWrite(DOC + id, VER + id, current, next, current + 1)) return next;
    await new Promise(resolve => setTimeout(resolve, 40 * (attempt + 1)));
  }
  throw new Error("Application is being updated too often; please retry.");
}

export async function recordSubmission(id: string, form: CleanForm, docLater: Record<string, boolean>, now = new Date()) {
  return mutate(id, app => {
    if (app.submittedAt) return app;
    app.form = form;
    app.docLater = docLater;
    app.submittedAt = nowIso(now);
    app.consent = { at: nowIso(now), policyVersion: PRIVACY_POLICY_VERSION };
    app.events.unshift({ at: nowIso(now), text: "客人送出申請資料" });
  });
}

export async function deleteApplication(app: Application) {
  const store = db();
  await store.del(DOC + app.id, VER + app.id, tokenKey(app.token), `app:ref:${app.refCode}`);
  await store.zrem(INDEX, app.id);
}

/** 到期（送出或建立滿 90 天）的申請。 */
export async function listExpired(now = new Date()): Promise<Application[]> {
  const store = db();
  const ids = await store.zrevrange(INDEX, 500);
  const docs = await store.mget<Application>(ids.map(id => DOC + id));
  return docs.filter((doc): doc is Application => Boolean(doc) && Date.parse(expiresAt(doc!)) <= now.getTime());
}

export async function tryAcquireLock(name: string, seconds: number) {
  return db().set(`app:lock:${name}`, "1", { nx: true, ex: seconds });
}
