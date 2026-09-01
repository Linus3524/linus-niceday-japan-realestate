/**
 * Vercel Web Analytics 代理。
 *
 * 瀏覽器不能直接打 Vercel API——VERCEL_API_TOKEN 是帳號層級憑證，
 * 送到前端就等於公開整個 Vercel 帳號。所以由伺服器代打，前端只拿彙總後的數字。
 *
 * 存取權沿用 ANALYTICS_TOKEN（與 /api/usage-stats 同一把鑰匙），
 * 後台頁面只要驗一次就能同時取兩邊的資料。
 *
 * 用法：GET /api/vercel-analytics?month=2026-08，權杖放 x-analytics-token 標頭。
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

/**
 * 月份字串換算成查詢區間。
 *
 * until 是「不含」的邊界，日期字串會被當成該日 00:00。所以查本月時不能截到
 * 「今天」——那等於把今天整天的資料排除掉，畫面上會出現有訪客數卻沒有任何
 * 國家與頁面的怪狀態。要截就截到「明天」，今天的資料才進得來。
 */
export function monthRange(month: string, now = new Date()) {
  const [year, mon] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, mon - 1, 1));
  const monthEnd = new Date(Date.UTC(year, mon, 1));
  // 月份選單與站內統計都以東京時間切月，這裡也必須一致。若在日本 9/1 凌晨
  // 仍用 UTC 算「明天」，會得到 since=9/1、until=9/1 的空查詢區間。
  const tokyo = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const tomorrow = new Date(Date.UTC(
    tokyo.getUTCFullYear(),
    tokyo.getUTCMonth(),
    tokyo.getUTCDate() + 1,
  ));
  return {
    since: start.toISOString().slice(0, 10),
    until: (monthEnd > tomorrow ? tomorrow : monthEnd).toISOString().slice(0, 10),
  };
}

function currentTokyoMonth(now = new Date()) {
  const tokyo = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return `${tokyo.getUTCFullYear()}-${String(tokyo.getUTCMonth() + 1).padStart(2, "0")}`;
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

// 兩種資料集的數量欄位名稱不同：visits 用 pageviews，events 用 count。
// 這幾個都是量值，不能被誤認成維度標籤。
const METRIC_KEYS = new Set(["count", "visitors", "pageviews"]);

/**
 * aggregate 回傳的維度欄位名稱就是 by 的值（by=country → { country: "TW", pageviews, visitors }）。
 * 這裡不寫死欄位名，改成取「第一個不是量值的鍵」，之後換維度或 Vercel 調整
 * 欄位命名都不會壞。
 */
function toRows(payload: any): AggregateRow[] {
  return (payload?.data ?? []).map((row: any) => {
    const labelKey = Object.keys(row).find(key => !METRIC_KEYS.has(key));
    return {
      label: String(row[labelKey ?? ""] ?? "unknown"),
      count: Number(row.count ?? row.pageviews) || 0,
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
  // 只認 header，不再接受 ?token=：查詢字串會被寫進 Vercel 的請求日誌、
  // 瀏覽器歷史與 Referer 標頭，等於在多個地方留下權杖副本。
  const provided = String(req.headers?.["x-analytics-token"] || "");
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
    : currentTokyoMonth();
  const { since, until } = monthRange(month);

  try {
    const aggregate = (by: string, limit = 5) =>
      vercelQuery("/v1/query/web-analytics/visits/aggregate", { since, until, by, limit: String(limit) }, apiToken);

    // 自訂事件查詢在 Hobby 方案會回 402（Vercel 把它列為 Pro 以上功能）。
    // 它只是加分項，不能讓它拖垮整個流量區——先前用 Promise.all 一起等，
    // 結果這一個 402 就讓訪客數、國家、頁面全部消失，畫面只剩一行錯誤訊息。
    const eventsOrEmpty = vercelQuery(
      "/v1/query/web-analytics/events/aggregate",
      { since, until, by: "eventName", limit: "10" },
      apiToken,
    ).catch(error => {
      console.warn("custom events unavailable (ignored):", error?.message);
      return null;
    });

    const [count, countries, pages, referrers, events] = await Promise.all([
      vercelQuery("/v1/query/web-analytics/visits/count", { since, until }, apiToken),
      aggregate("country"),
      aggregate("requestPath"),
      aggregate("referrerHostname"),
      eventsOrEmpty,
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
      // 前端據此顯示「此方案無法查詢自訂事件」，而不是把空陣列誤解成「沒有人操作」。
      eventsAvailable: events !== null,
    });
  } catch (error: any) {
    console.error("vercel-analytics error:", error);
    return res.status(502).json({ error: error?.message || "無法取得 Vercel 流量數據。" });
  }
}
