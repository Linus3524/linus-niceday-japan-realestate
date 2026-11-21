import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { timingSafeEqual } from "crypto";

/**
 * 後台密碼檢查（和客戶需求後台同一組：LEADS_ADMIN_TOKEN，沒設時沿用 ANALYTICS_TOKEN）。
 * 錯誤 10 次鎖 15 分鐘；限流用統計那個 Redis。
 */

const FAIL_LIMIT = 10;
const statsRedis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN ? Redis.fromEnv() : null;
const failLimiter = statsRedis
  ? new Ratelimit({ redis: statsRedis, limiter: Ratelimit.fixedWindow(FAIL_LIMIT, "900 s"), prefix: "linus-apply-auth-fail" })
  : null;

export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function clientIp(req: any) {
  return String(req.headers?.["x-forwarded-for"] || req.headers?.["x-real-ip"] || "unknown").split(",")[0].trim();
}

/** 通過回 true；沒通過時已經寫好回應。 */
export async function requireAdmin(req: any, res: any): Promise<boolean> {
  const expected = process.env.LEADS_ADMIN_TOKEN || process.env.ANALYTICS_TOKEN;
  if (!expected) { res.status(503).json({ error: "LEADS_ADMIN_TOKEN is not configured." }); return false; }
  const ip = clientIp(req);
  if (failLimiter) {
    const { remaining } = await failLimiter.getRemaining(ip).catch(() => ({ remaining: FAIL_LIMIT }));
    if (remaining <= 0) { res.status(429).json({ error: "密碼錯誤次數太多，請 15 分鐘後再試。" }); return false; }
  }
  if (!safeEqual(String(req.headers?.["x-admin-token"] || ""), expected)) {
    await failLimiter?.limit(ip).catch(() => undefined);
    res.status(401).json({ error: "Unauthorized." });
    return false;
  }
  return true;
}
