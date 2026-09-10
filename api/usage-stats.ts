import { getUsageSummary, usageMetricsConfigured } from "../src/lib/usageMetrics.js";
import { getMonthlyVisitorCount, getVisitorCount, visitorCounterConfigured } from "../src/lib/visitorCounter.js";

/**
 * 後台使用量查詢。
 *
 * 需要 ANALYTICS_TOKEN 環境變數；沒設定就一律拒絕，而不是預設開放——
 * 忘記設定的後果應該是「查不到」，不是「全世界都查得到」。
 *
 * 用法：GET /api/usage-stats?month=2026-08，權杖放 x-analytics-token 標頭。
 */
export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed. Use GET." });
  }

  const expected = process.env.ANALYTICS_TOKEN;
  if (!expected) {
    return res.status(503).json({ error: "ANALYTICS_TOKEN is not configured." });
  }

  // 只認 header，不再接受 ?token=：查詢字串會被寫進 Vercel 的請求日誌、
  // 瀏覽器歷史與 Referer 標頭，等於在多個地方留下權杖副本。
  const provided = String(req.headers?.["x-analytics-token"] || "");
  if (provided !== expected) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  if (!usageMetricsConfigured()) {
    return res.status(503).json({ error: "Usage metrics storage is not configured." });
  }

  try {
    const month = typeof req.query?.month === "string" ? req.query.month : undefined;
    const summary = await getUsageSummary(month);

    // 訪客計數與其餘統計是兩個獨立的 Redis 模組（見 visitorCounter.ts 開頭的
    // 說明），這裡在 API 層合併成一份回應，前端不用分開打兩支 API、也不必
    // 自己處理「其中一個沒設定」的情況。monthlyVisitors 與前台首頁的累計
    // 訪客數共用同一個 visitorId、同一套去重邏輯，兩者才能互相對照。
    let monthlyVisitors: number | null = null;
    let cumulativeVisitors: number | null = null;
    if (visitorCounterConfigured()) {
      try {
        [monthlyVisitors, cumulativeVisitors] = await Promise.all([
          getMonthlyVisitorCount(summary.month),
          getVisitorCount(),
        ]);
      } catch (error) {
        console.error("visitor counter merge failed (ignored):", error);
      }
    }

    return res.json({ ...summary, monthlyVisitors, cumulativeVisitors });
  } catch (error) {
    console.error("usage-stats error:", error);
    return res.status(500).json({ error: "Unable to read usage metrics." });
  }
}
