/**
 * Vercel Web Analytics 代理。
 *
 * 瀏覽器不能直接打 Vercel API——VERCEL_API_TOKEN 是帳號層級憑證，
 * 送到前端就等於公開整個 Vercel 帳號。所以由伺服器代打，前端只拿彙總後的數字。
 *
 * 存取權沿用 ANALYTICS_TOKEN（與 /api/usage-stats 同一把鑰匙），
 * 後台頁面只要驗一次就能同時取兩邊的資料。
 *
 * 用法：GET /api/vercel-analytics?token=xxx&month=2026-08
 */

const VERCEL_API = "https://api.vercel.com";

// 專案與團隊 ID 不是機密（只是識別碼），但仍允許用環境變數覆寫，方便換專案。
const PROJECT_ID = process.env.VERCEL_ANALYTICS_PROJECT_ID || "prj_rRZZtCDuCQkC17BP2len7AHsVFUb";
const TEAM_ID = process.env.VERCEL_ANALYTICS_TEAM_ID || "team_7LrckGnOnypHIUqpKCFlDMxz";

interface AggregateRow {
  label: string;
  count: number;
  visitors: number;
}

/** 月份字串換算成查詢區間；未來的月份會被截到今天，避免白查。 */
function monthRange(month: string) {
  const [year, mon] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, mon - 1, 1));
  const end = new Date(Date.UTC(year, mon, 1));
  const now = new Date();
  return {
    since: start.toISOString().slice(0, 10),
    until: (end > now ? now : end).toISOString().slice(0, 10),
  };
}

async function vercelQuery(path: string, params: Record<string, string>, apiToken: string) {
  const query = new URLSearchParams({ projectId: PROJECT_ID, teamId: TEAM_ID, ...params });
  const response = await fetch(`${VERCEL_API}${path}?${query}`, {
    headers: { Authorization: `Bearer ${apiToken}` },
  });
  if (!response.ok) {
    throw new Error(`Vercel API ${path} 回應 ${response.status}`);
  }
  return response.json();
}

/**
 * aggregate 回傳的維度欄位名稱就是 by 的值（by=country → { country: "TW", count, visitors }）。
 * 這裡不寫死欄位名，改成取「不是 count/visitors 的第一個鍵」，
 * 之後換維度或 Vercel 調整欄位命名都不會壞。
 */
function toRows(payload: any): AggregateRow[] {
  return (payload?.data ?? []).map((row: any) => {
    const labelKey = Object.keys(row).find(key => key !== "count" && key !== "visitors");
    return {
      label: String(row[labelKey ?? ""] ?? "unknown"),
      count: Number(row.count) || 0,
      visitors: Number(row.visitors) || 0,
    };
  });
}

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed. Use GET." });
  }

  const expected = process.env.ANALYTICS_TOKEN;
  if (!expected) {
    return res.status(503).json({ error: "ANALYTICS_TOKEN is not configured." });
  }
  const provided = String(req.query?.token || req.headers?.["x-analytics-token"] || "");
  if (provided !== expected) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const apiToken = process.env.VERCEL_API_TOKEN;
  if (!apiToken) {
    // 刻意用專屬狀態碼與訊息：後台頁面要能分辨「還沒設定」與「查詢失敗」，
    // 前者是待辦事項，後者才是故障。
    return res.status(501).json({ error: "尚未設定 VERCEL_API_TOKEN，流量數據無法顯示。" });
  }

  const month = typeof req.query?.month === "string" && /^\d{4}-\d{2}$/.test(req.query.month)
    ? req.query.month
    : new Date().toISOString().slice(0, 7);
  const { since, until } = monthRange(month);

  try {
    const aggregate = (by: string, limit = 5) =>
      vercelQuery("/v1/query/web-analytics/visits/aggregate", { since, until, by, limit: String(limit) }, apiToken);

    const [count, countries, pages, referrers, events] = await Promise.all([
      vercelQuery("/v1/query/web-analytics/visits/count", { since, until }, apiToken),
      aggregate("country"),
      aggregate("requestPath"),
      aggregate("referrerHostname"),
      vercelQuery("/v1/query/web-analytics/events/aggregate", { since, until, by: "eventName", limit: "10" }, apiToken),
    ]);

    return res.json({
      month,
      since,
      until,
      visitors: Number(count?.data?.visitors) || 0,
      pageviews: Number(count?.data?.pageviews) || 0,
      countries: toRows(countries),
      pages: toRows(pages),
      referrers: toRows(referrers),
      events: toRows(events),
    });
  } catch (error: any) {
    console.error("vercel-analytics error:", error);
    return res.status(502).json({ error: error?.message || "無法取得 Vercel 流量數據。" });
  }
}
