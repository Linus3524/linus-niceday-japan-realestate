import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { recordQuizEvent } from "../src/lib/quizMetrics.js";
import { isTrackableAction, isTrackableView, normalizeSource, recordAction, recordSource, recordView } from "../src/lib/usageMetrics.js";

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
 *
 * 心理測驗（quiz.linusniceday.com，見 src/lib/quizMetrics.ts）也共用這支端點：帶 quiz 欄位的請求
 * 只記測驗計數。共用而不另開一支，是為了不多佔一個 Serverless Function 名額。
 * 測驗在子網域，事件是跨網域送來的：用 text/plain（sendBeacon 不觸發預檢），這裡自己解析 JSON。
 */

const VIEW_RATE_LIMIT = 40;

// 只回 CORS 標頭給自家測驗；Preview 部署的測驗網域會變動，所以放行 tokyo-living-persona 的 vercel.app 網域。
function allowedQuizOrigin(origin: string | undefined): string | null {
  if (!origin) return null;
  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== "https:") return null;
    if (hostname === "quiz.linusniceday.com") return origin;
    if (hostname.startsWith("tokyo-living-persona") && hostname.endsWith(".vercel.app")) return origin;
  } catch {
    return null;
  }
  return null;
}

function parseBody(body: unknown): any {
  if (typeof body !== "string") return body;
  try { return JSON.parse(body); } catch { return null; }
}

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
  const quizOrigin = allowedQuizOrigin(req.headers?.origin);
  if (quizOrigin) {
    res.setHeader("Access-Control-Allow-Origin", quizOrigin);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Vary", "Origin");
  }

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const body = parseBody(req.body);
  // 兩種回報各自獨立：切分頁時送 view，進站帶標記時送 source。
  // 來源必須能單獨送——手機停在首頁不算任何分頁，夾在 view 裡會整筆漏掉。
  const view = body?.view;
  const source = normalizeSource(body?.source);
  const action = body?.action;
  const hasView = isTrackableView(view);
  const hasAction = isTrackableAction(action);
  const quiz = body?.quiz;
  const hasQuiz = Boolean(quiz && typeof quiz === "object");
  if (!hasView && !source && !hasAction && !hasQuiz) {
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
    if (hasAction) await recordAction(action);
    if (hasQuiz) await recordQuizEvent(quiz);
  } catch (error) {
    console.error("track-view failed (ignored):", error);
  }

  return res.status(204).end();
}
