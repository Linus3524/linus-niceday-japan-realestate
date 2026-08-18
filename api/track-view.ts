import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { isTrackableView, normalizeSource, recordSource, recordView } from "../src/lib/usageMetrics.js";

/**
 * 分頁瀏覽回報。
 *
 * 這是全站唯一一個「不需要權杖就能寫入」的端點，因為每個訪客都要能呼叫它。
 * 因此防線放在別的地方：
 *   1. 只接受白名單內的分頁代號，塞任何其他字串一律拒絕（不會長出垃圾鍵值）。
 *   2. 每個 IP 每分鐘上限 40 次——真人切分頁遠低於這個數，但灌水會被擋下。
 *   3. 一律回 204，不回傳任何資料，也不透露是否被限流；這支端點沒有讀取用途。
 *
 * 不做的事：不存 IP、不存 session、不做跨頁追蹤，只把某個分頁的計數加一。
 */

const VIEW_RATE_LIMIT = 40;

const limiter =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(VIEW_RATE_LIMIT, "60 s"),
        prefix: "linus-view",
      })
    : null;

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  // 兩種回報各自獨立：切分頁時送 view，進站帶標記時送 source。
  // 來源必須能單獨送——手機停在首頁不算任何分頁，夾在 view 裡會整筆漏掉。
  const view = req.body?.view;
  const source = normalizeSource(req.body?.source);
  const hasView = isTrackableView(view);
  if (!hasView && !source) {
    return res.status(400).json({ error: "Nothing to record." });
  }

  const ip = String(req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown")
    .split(",")[0].trim();

  try {
    if (limiter) {
      const { success } = await limiter.limit(ip);
      // 被限流也回 204：這支端點對前端來說是射後不理，回錯誤只會在使用者的
      // 主控台留下紅字，卻沒有任何可以補救的動作。
      if (!success) return res.status(204).end();
    }
    if (hasView) await recordView(view);
    if (source) await recordSource(source);
  } catch (error) {
    console.error("track-view failed (ignored):", error);
  }

  return res.status(204).end();
}
