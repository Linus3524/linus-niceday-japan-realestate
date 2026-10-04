import { Redis } from "@upstash/redis";
import { MONTH_TTL_SECONDS, tokyoParts } from "./usageMetrics.js";

/**
 * 心理測驗「你是哪種東京區民？」的計數。
 *
 * 測驗本身是另一個專案（tokyo-living-persona），網站用 Vercel rewrite 把 /quiz/ 轉接過去，
 * 所以測驗的事件與網站同源，直接打 /api/track-view（帶 quiz 欄位）就會進來這裡。
 *
 * 跟網站其他統計一樣只記聚合數字：哪一區出現幾次、準不準、每題選項分布。
 * 不存 IP、不存暱稱；答案碼只是 12 個 a–d 字母，對應的是選項，不是個人資料。
 *
 * 每月一個 hash，欄位用前綴區分，後台一次 HGETALL 就能拿到整個月：
 *   linus:quiz:2026-10        → { "f:start": 120, "r:sumida": 9, "rate:sumida:2": 4,
 *                                 "claim:sumida>taito": 1, "why:sumida:rent": 1, "o:3:b": 40, ... }
 *   linus:quiz:codes:2026-10  → { "abcdabcbabcd": 2 }   （完整答案碼，之後可離線重算）
 */

const QUIZ_PREFIX = "linus:quiz:";
const CODES_PREFIX = "linus:quiz:codes:";
// 地區代號只用格式檢查（測驗增減地區時網站不必跟著改），
// 所以要限制欄位總數，避免有人亂填代號把 hash 撐大。
const MAX_FIELDS = 4000;
const MAX_CODES = 5000;

const AREA_ID = /^[a-z]{2,16}$/;
const ANSWER_CODE = /^[a-d]{8,16}$/;
const VERSION = /^\d+\.\d+\.\d+$/;
const VARIANT_ID = /^[a-z_]{2,20}$/;
const RATE_REASONS = ["rent", "vibe", "commute", "stereo"] as const;
const SHARE_METHODS = ["native", "copy", "image"] as const;
const CTA_KINDS = ["line", "wechat", "threads", "instagram", "facebook", "email", "site"] as const;
const FUNNEL_EVENTS = ["start", "mid", "finish", "secret_open", "shared_view", "retake"] as const;

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

const oneOf = <T extends readonly string[]>(list: T, value: unknown): value is T[number] =>
  typeof value === "string" && (list as readonly string[]).includes(value);

/** 把前端送來的事件轉成要加一的欄位；格式不對的一律丟掉，回傳空陣列。 */
export function quizFields(raw: unknown): { fields: string[]; code: string | null } {
  const e = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null;
  if (!e || typeof e.e !== "string") return { fields: [], code: null };
  const fields: string[] = [];
  let code: string | null = null;
  const top1 = typeof e.top1 === "string" && (AREA_ID.test(e.top1)) ? e.top1 : null;

  if (oneOf(FUNNEL_EVENTS, e.e)) {
    fields.push(`f:${e.e}`);
    if (e.e === "finish") {
      if (top1) fields.push(`r:${top1}`);
      if (e.secret_offer === true) fields.push("f:secret_offer");
      if (typeof e.ver === "string" && VERSION.test(e.ver)) fields.push(`v:${e.ver}`);
      if (typeof e.code === "string" && ANSWER_CODE.test(e.code)) {
        code = e.code;
        [...e.code].forEach((option, index) => fields.push(`o:${index + 1}:${option}`));
        // 追問題：同一個選項字母在不同版本代表不同內容，另外依版本記一份
        const fq = Number(e.fq);
        if (Number.isInteger(fq) && fq >= 1 && fq <= e.code.length && typeof e.fv === "string" && VARIANT_ID.test(e.fv)) {
          fields.push(`ob:${fq}:${e.fv}:${e.code[fq - 1]}`);
        }
      }
    }
    if (e.e === "shared_view" && top1) fields.push(`sv:${top1}`);
  } else if (e.e === "rate" && top1 && (e.v === 0 || e.v === 1 || e.v === 2)) {
    fields.push(`rate:${top1}:${e.v}`);
    if (e.v === 0) {
      if (typeof e.claimed === "string" && AREA_ID.test(e.claimed) && e.claimed !== top1) {
        fields.push(`claim:${top1}>${e.claimed}`);
      }
      const why = Array.isArray(e.why) ? e.why : [];
      for (const reason of new Set(why)) if (oneOf(RATE_REASONS, reason)) fields.push(`why:${top1}:${reason}`);
    }
  } else if (e.e === "share" && oneOf(SHARE_METHODS, e.method)) {
    fields.push(`share:${e.method}`);
  } else if (e.e === "cta" && oneOf(CTA_KINDS, e.kind)) {
    fields.push(`cta:${e.kind}`);
  }
  return { fields, code };
}

/** 記一筆測驗事件。與其他統計一樣，失敗一律吞掉。 */
export async function recordQuizEvent(raw: unknown) {
  if (!redis) return;
  const { fields, code } = quizFields(raw);
  if (!fields.length) return;
  try {
    const { month } = tokyoParts();
    const key = `${QUIZ_PREFIX}${month}`;
    const codesKey = `${CODES_PREFIX}${month}`;
    const [fieldCount, codeCount] = await Promise.all([
      redis.hlen(key),
      code ? redis.hlen(codesKey) : Promise.resolve(0),
    ]);
    const pipe = redis.pipeline();
    // 超過上限時只累加既有欄位不再新增：用 HINCRBY 前先確認欄位存在太貴，
    // 所以直接整筆略過——到這個量級代表被灌水，少記幾筆可以接受。
    if (fieldCount < MAX_FIELDS) {
      for (const field of fields) pipe.hincrby(key, field, 1);
      pipe.expire(key, MONTH_TTL_SECONDS);
    }
    if (code && codeCount < MAX_CODES) {
      pipe.hincrby(codesKey, code, 1);
      pipe.expire(codesKey, MONTH_TTL_SECONDS);
    }
    await pipe.exec();
  } catch (error) {
    console.error("recordQuizEvent failed (ignored):", error);
  }
}

export interface QuizSummary {
  month: string;
  /** 漏斗：start / mid / finish / secret_offer / secret_open / shared_view / retake */
  funnel: Record<string, number>;
  /** 各區被判定的次數 */
  results: Record<string, number>;
  /** 各區評分：{ sumida: { "2": 超準, "1": 有點像, "0": 不太像 } } */
  ratings: Record<string, Record<string, number>>;
  /** 判成 A 但自認 B：{ sumida: { taito: 2 } } */
  claims: Record<string, Record<string, number>>;
  /** 不太像的原因：{ sumida: { rent: 1 } } */
  reasons: Record<string, Record<string, number>>;
  /** 每題選項分布：{ "3": { a: 10, b: 4 } } */
  options: Record<string, Record<string, number>>;
  /** 追問題依版本的選項分布：{ "11": { weekend: { a: 3 } } }（題庫 0.9.0 起才有） */
  branches: Record<string, Record<string, Record<string, number>>>;
  share: Record<string, number>;
  cta: Record<string, number>;
  sharedViews: Record<string, number>;
  versions: Record<string, number>;
  /** 本月不同答案組合的數量 */
  distinctCodes: number;
}

export async function getQuizSummary(month: string): Promise<QuizSummary> {
  if (!redis) throw new Error("Usage metrics storage is not configured.");
  const [raw, distinctCodes] = await Promise.all([
    redis.hgetall<Record<string, number>>(`${QUIZ_PREFIX}${month}`),
    redis.hlen(`${CODES_PREFIX}${month}`),
  ]);
  const summary: QuizSummary = {
    month, funnel: {}, results: {}, ratings: {}, claims: {}, reasons: {}, options: {}, branches: {},
    share: {}, cta: {}, sharedViews: {}, versions: {}, distinctCodes,
  };
  const nested = (target: Record<string, Record<string, number>>, outer: string, inner: string, n: number) => {
    (target[outer] ||= {})[inner] = n;
  };
  for (const [field, value] of Object.entries(raw || {})) {
    const n = Number(value) || 0;
    const [kind, ...rest] = field.split(":");
    const tail = rest.join(":");
    if (kind === "f") summary.funnel[tail] = n;
    else if (kind === "r") summary.results[tail] = n;
    else if (kind === "rate") nested(summary.ratings, rest[0], rest[1], n);
    else if (kind === "claim") { const [from, to] = tail.split(">"); nested(summary.claims, from, to, n); }
    else if (kind === "why") nested(summary.reasons, rest[0], rest[1], n);
    else if (kind === "o") nested(summary.options, rest[0], rest[1], n);
    else if (kind === "ob") nested((summary.branches[rest[0]] ||= {}), rest[1], rest[2], n);
    else if (kind === "share") summary.share[tail] = n;
    else if (kind === "cta") summary.cta[tail] = n;
    else if (kind === "sv") summary.sharedViews[tail] = n;
    else if (kind === "v") summary.versions[tail] = n;
  }
  return summary;
}
