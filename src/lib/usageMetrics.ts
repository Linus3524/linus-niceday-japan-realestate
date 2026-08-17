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

export type UsageFeature = "chat" | "rent-analysis" | "market-lookup";

const TOTAL_KEY = "linus:usage:total";
const DAILY_PREFIX = "linus:usage:daily:";
const GEO_PREFIX = "linus:usage:geo:";
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

export interface UsageSummary {
  month: string;
  total: Record<string, number>;
  /** 每天每個功能的次數：{ "17": { chat: 42 } } */
  daily: Record<string, Record<string, number>>;
  /** 每個國家每個功能的次數：{ TW: { chat: 30 } } */
  geo: Record<string, Record<string, number>>;
}

/** 讀取指定月份（預設本月）的彙總。month 格式 YYYY-MM。 */
export async function getUsageSummary(month?: string): Promise<UsageSummary> {
  if (!redis) throw new Error("Usage metrics storage is not configured.");
  const target = month && /^\d{4}-\d{2}$/.test(month) ? month : tokyoParts().month;

  const [total, dailyRaw, geoRaw] = await Promise.all([
    redis.hgetall<Record<string, number>>(TOTAL_KEY),
    redis.hgetall<Record<string, number>>(`${DAILY_PREFIX}${target}`),
    redis.hgetall<Record<string, number>>(`${GEO_PREFIX}${target}`),
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
  };
}
