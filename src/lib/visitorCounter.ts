import { Redis } from "@upstash/redis";
import { tokyoParts, MONTH_TTL_SECONDS } from "./usageMetrics.js";

const VISITOR_COUNT_KEY = "linus:visitors:total";
const VISITOR_KEY_PREFIX = "linus:visitors:id:";
// Cookie 的 Max-Age 是 365 天（見 api/visitor-count.ts）；這裡故意設得比它長，
// 讓「同一個訪客 ID 的 Redis 紀錄」永遠不會比「瀏覽器還留著的 cookie」先過期。
// 兩者長度必須維持這個大小關係，否則第 366～400 天回訪的人會因為 Redis 端先
// 忘記他，被誤判成新訪客，累計數字虛增。
const VISITOR_TTL_SECONDS = 60 * 60 * 24 * 400;

// 「本月不重複訪客」改用 HyperLogLog（PFADD／PFCOUNT）而不是存一個逐年成長的
// Set：只要近似值（標準誤差約 0.81%），且不會隨流量無限占用 Redis 空間。
// 用同一個 visitorId 記錄，才能讓前台累計數字與後台月流量共用同一套去重邏輯。
// TTL 沿用 usageMetrics.ts 的月度統計設定，避免這個 key 比同月份的其他
// 統計（瀏覽次數、功能使用次數）先過期，讓後台舊月份的資料出現缺角。
const MONTHLY_VISITOR_PREFIX = "linus:visitors:monthly:";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

export function visitorCounterConfigured() {
  return redis !== null;
}

export async function getVisitorCount() {
  if (!redis) throw new Error("Visitor counter storage is not configured.");
  return (await redis.get<number>(VISITOR_COUNT_KEY)) ?? 0;
}

/** 讀取指定月份（預設本月）的不重複訪客數，供後台比對用。 */
export async function getMonthlyVisitorCount(month?: string) {
  if (!redis) throw new Error("Visitor counter storage is not configured.");
  const target = month && /^\d{4}-\d{2}$/.test(month) ? month : tokyoParts().month;
  return (await redis.pfcount(`${MONTHLY_VISITOR_PREFIX}${target}`)) ?? 0;
}

export async function recordUniqueVisitor(visitorId: string) {
  if (!redis) throw new Error("Visitor counter storage is not configured.");

  const added = await redis.set(`${VISITOR_KEY_PREFIX}${visitorId}`, "1", {
    nx: true,
    ex: VISITOR_TTL_SECONDS,
  });

  if (added) {
    await redis.incr(VISITOR_COUNT_KEY);
  }

  // 每次造訪都記進「本月」HyperLogLog，不只是新訪客——這裡要回答的是
  // 「這個月有多少不同的人來過」，回訪的人本月也該算進去，只是不會讓
  // PFCOUNT 的結果增加（同一個 visitorId 加第二次沒有效果）。
  const { month } = tokyoParts();
  const monthlyKey = `${MONTHLY_VISITOR_PREFIX}${month}`;
  await redis.pfadd(monthlyKey, visitorId);
  await redis.expire(monthlyKey, MONTH_TTL_SECONDS);

  return {
    count: await getVisitorCount(),
    isNewVisitor: Boolean(added),
  };
}
