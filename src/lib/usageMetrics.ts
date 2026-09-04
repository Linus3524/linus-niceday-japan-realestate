import { Redis } from "@upstash/redis";

/**
 * 業務事件計數。
 *
 * 只記「哪個功能、哪一天、哪個國家用了幾次」這種聚合數字，
 * 不儲存 IP、不儲存使用者輸入的內容——隱私權政策承諾的是
 * 「IP 位址用於防止濫用」，把它落地成長期紀錄會超出那個範圍。
 *
 * 國家來自 Vercel 在 request header 上直接給的 x-vercel-ip-country，
 * 不需要 IP 查詢服務，也就不需要把原始 IP 傳給第三方。
 *
 * 資料結構刻意用 hash 而不是一堆獨立 key：讀取時一次 HGETALL 就能拿到
 * 整個月，不必用 SCAN 掃描 keyspace（Upstash 上 SCAN 又慢又貴）。
 *   linus:usage:total          → { chat: 1234, "rent-analysis": 56 }
 *   linus:usage:daily:2026-08  → { "chat:17": 42, "rent-analysis:17": 3 }
 *   linus:usage:geo:2026-08    → { "chat:TW": 30, "chat:JP": 12 }
 */

export type UsageFeature = "chat" | "rent-analysis" | "listing-check";

/**
 * 分頁瀏覽。
 *
 * 網站是單一路徑加 hash 導覽（#threads、#privacy）、分頁切換則是 React 狀態，
 * 而 hash 不會送到伺服器——Vercel 眼中永遠只有一頁「/」，它的熱門頁面表格
 * 對這個站沒有任何資訊量。自己記才知道客人到底在看哪一區。
 *
 * 白名單寫死在這裡：這是公開可寫的端點，不限制的話任何人都能塞垃圾鍵值進來。
 */
export const TRACKABLE_VIEWS = [
  "rent-guide", "buy-guide", "calculator", "ai-advisor", "contact", "threads", "policy",
] as const;
export type TrackableView = (typeof TRACKABLE_VIEWS)[number];

export function isTrackableView(value: unknown): value is TrackableView {
  return typeof value === "string" && (TRACKABLE_VIEWS as readonly string[]).includes(value);
}

/**
 * 重要動作白名單。與分頁瀏覽分開記錄：瀏覽是「看了哪一區」，
 * 動作是「做了什麼」——加 LINE 是站上唯一的成交入口，值得單獨看。
 * 同樣是公開可寫的端點，所以一樣走白名單。
 */
export const TRACKABLE_ACTIONS = [
  "line-add", "line-copy", "line-qr", "wechat-copy", "wechat-qr",
  "threads-rent-view", "threads-rent-click",
  "threads-buy-view", "threads-buy-click",
  "threads-ai-view", "threads-ai-click",
] as const;
export type TrackableAction = (typeof TRACKABLE_ACTIONS)[number];

export function isTrackableAction(value: unknown): value is TrackableAction {
  return typeof value === "string" && (TRACKABLE_ACTIONS as readonly string[]).includes(value);
}

const TOTAL_KEY = "linus:usage:total";
const DAILY_PREFIX = "linus:usage:daily:";
const GEO_PREFIX = "linus:usage:geo:";
const VIEWS_PREFIX = "linus:usage:views:";
const SOURCES_PREFIX = "linus:usage:sources:";
const ACTIONS_PREFIX = "linus:usage:actions:";
// 來源標籤由網址參數決定，任何人都能亂填。限制不同標籤的數量，
// 避免有人用隨機字串把 Redis 塞滿；超過上限的新標籤一律歸到 other。
const MAX_DISTINCT_SOURCES = 50;
// 月度 hash 保留約兩年，足夠看年度趨勢又不會無限成長。
const MONTH_TTL_SECONDS = 60 * 60 * 24 * 760;

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

export function usageMetricsConfigured() {
  return redis !== null;
}

/** 以日本時間分日：這個網站的使用者與業務都在日本時區，用 UTC 分日會把晚上的流量切到隔天。 */
function tokyoParts(now = new Date()) {
  const tokyo = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const year = tokyo.getUTCFullYear();
  const month = String(tokyo.getUTCMonth() + 1).padStart(2, "0");
  const day = String(tokyo.getUTCDate()).padStart(2, "0");
  return { month: `${year}-${month}`, day };
}

/** Vercel 免費在 header 上提供國碼；本機或非 Vercel 環境會拿不到，記成 unknown。 */
export function requestCountry(req: any): string {
  const raw = req?.headers?.["x-vercel-ip-country"];
  const code = String(Array.isArray(raw) ? raw[0] : raw || "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : "unknown";
}

/**
 * 記一次使用。刻意吞掉所有錯誤：統計失敗絕不能讓使用者的請求失敗，
 * 少一筆數字的代價遠低於整個功能掛掉。
 */
export async function recordUsage(feature: UsageFeature, country = "unknown") {
  if (!redis) return;
  try {
    const { month, day } = tokyoParts();
    const dailyKey = `${DAILY_PREFIX}${month}`;
    const geoKey = `${GEO_PREFIX}${month}`;

    await Promise.all([
      redis.hincrby(TOTAL_KEY, feature, 1),
      redis.hincrby(dailyKey, `${feature}:${day}`, 1),
      redis.hincrby(geoKey, `${feature}:${country}`, 1),
    ]);
    // TTL 只需要設在月度 hash 上；重設成本極低，不必先查有沒有設過。
    await Promise.all([
      redis.expire(dailyKey, MONTH_TTL_SECONDS),
      redis.expire(geoKey, MONTH_TTL_SECONDS),
    ]);
  } catch (error) {
    console.error("recordUsage failed (ignored):", error);
  }
}

/**
 * 網址上的來源標記（?from=line、?utm_source=fb）。
 *
 * 瀏覽器只會在「從網頁點連結」時附上來源網域；從 LINE 對話、QR code、
 * 手打網址進來的一律是空白，全部混成「直接進入」分不開。自己加標記才知道
 * 哪個管道有效。Vercel 內建的 UTM 統計要 Enterprise 方案，所以自己記。
 *
 * 這是使用者可控的輸入，必須嚴格清洗：只留小寫英數與 - _，長度上限 20。
 */
export function normalizeSource(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const clean = value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 20);
  return clean.length ? clean : null;
}

/** 記一次來源。同一位訪客每次造訪只會呼叫一次（前端用 sessionStorage 控制）。 */
export async function recordSource(source: string) {
  if (!redis) return;
  try {
    const { month } = tokyoParts();
    const key = `${SOURCES_PREFIX}${month}`;
    let field = source;
    // 已存在的標籤直接累加；全新的標籤要先確認沒有超過數量上限。
    if ((await redis.hget(key, source)) === null) {
      if ((await redis.hlen(key)) >= MAX_DISTINCT_SOURCES) field = "other";
    }
    await redis.hincrby(key, field, 1);
    await redis.expire(key, MONTH_TTL_SECONDS);
  } catch (error) {
    console.error("recordSource failed (ignored):", error);
  }
}

/** 記一次分頁瀏覽。與 recordUsage 一樣，失敗一律吞掉。 */
export async function recordView(view: TrackableView) {
  if (!redis) return;
  try {
    const { month } = tokyoParts();
    const key = `${VIEWS_PREFIX}${month}`;
    await redis.hincrby(key, view, 1);
    await redis.expire(key, MONTH_TTL_SECONDS);
  } catch (error) {
    console.error("recordView failed (ignored):", error);
  }
}

export async function recordAction(action: TrackableAction) {
  if (!redis) return;
  try {
    const { month } = tokyoParts();
    const key = `${ACTIONS_PREFIX}${month}`;
    await redis.hincrby(key, action, 1);
    await redis.expire(key, MONTH_TTL_SECONDS);
  } catch (error) {
    console.error("recordAction failed (ignored):", error);
  }
}

export interface UsageSummary {
  month: string;
  total: Record<string, number>;
  /** 每天每個功能的次數：{ "17": { chat: 42 } } */
  daily: Record<string, Record<string, number>>;
  /** 每個國家每個功能的次數：{ TW: { chat: 30 } } */
  geo: Record<string, Record<string, number>>;
  /** 每個分頁被看了幾次：{ "rent-guide": 120 } */
  views: Record<string, number>;
  /** 網址帶了來源標記的造訪次數：{ line: 12, card: 3 } */
  sources: Record<string, number>;
  /** 重要動作被觸發幾次：{ "line-add": 8 } */
  actions: Record<string, number>;
}

/** 讀取指定月份（預設本月）的彙總。month 格式 YYYY-MM。 */
export async function getUsageSummary(month?: string): Promise<UsageSummary> {
  if (!redis) throw new Error("Usage metrics storage is not configured.");
  const target = month && /^\d{4}-\d{2}$/.test(month) ? month : tokyoParts().month;

  const [total, dailyRaw, geoRaw, viewsRaw, sourcesRaw, actionsRaw] = await Promise.all([
    redis.hgetall<Record<string, number>>(TOTAL_KEY),
    redis.hgetall<Record<string, number>>(`${DAILY_PREFIX}${target}`),
    redis.hgetall<Record<string, number>>(`${GEO_PREFIX}${target}`),
    redis.hgetall<Record<string, number>>(`${VIEWS_PREFIX}${target}`),
    redis.hgetall<Record<string, number>>(`${SOURCES_PREFIX}${target}`),
    redis.hgetall<Record<string, number>>(`${ACTIONS_PREFIX}${target}`),
  ]);

  // hash 的 field 是 "功能:維度"，這裡拆回巢狀結構讓呼叫端好讀。
  const nest = (raw: Record<string, number> | null, keyIsSecond = true) => {
    const out: Record<string, Record<string, number>> = {};
    for (const [field, value] of Object.entries(raw || {})) {
      const separator = field.lastIndexOf(":");
      if (separator < 0) continue;
      const feature = field.slice(0, separator);
      const dimension = field.slice(separator + 1);
      const [outer, inner] = keyIsSecond ? [dimension, feature] : [feature, dimension];
      (out[outer] ||= {})[inner] = Number(value) || 0;
    }
    return out;
  };

  return {
    month: target,
    total: Object.fromEntries(Object.entries(total || {}).map(([k, v]) => [k, Number(v) || 0])),
    daily: nest(dailyRaw),
    geo: nest(geoRaw),
    views: Object.fromEntries(Object.entries(viewsRaw || {}).map(([k, v]) => [k, Number(v) || 0])),
    sources: Object.fromEntries(Object.entries(sourcesRaw || {}).map(([k, v]) => [k, Number(v) || 0])),
    actions: Object.fromEntries(Object.entries(actionsRaw || {}).map(([k, v]) => [k, Number(v) || 0])),
  };
}
