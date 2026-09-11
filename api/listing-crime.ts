import { getCrimeSafety } from "../src/lib/crimeSafety.js";

const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 300_000;
const buckets = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string) {
  if (!ip || ip === "unknown" || ip === "127.0.0.1" || ip === "::1" || process.env.NODE_ENV !== "production") {
    return { limited: false, retryAfter: 0 };
  }
  const now = Date.now();
  const current = buckets.get(ip);
  if (!current || current.resetAt <= now) {
    buckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { limited: false, retryAfter: 0 };
  }
  current.count++;
  return { limited: current.count > RATE_LIMIT, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  // 治安統計資料不常變動，允許 CDN 快取 1 小時
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed. Use POST." });

  const ip = String(req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown").split(",")[0].trim();
  const limit = rateLimit(ip);
  if (limit.limited) {
    res.setHeader("Retry-After", String(limit.retryAfter));
    return res.status(429).json({ error: "治安查詢每 5 分鐘最多使用 20 次，請稍候再試。", retryAfter: limit.retryAfter });
  }

  try {
    const address = typeof req.body?.address === "string" ? req.body.address.trim().slice(0, 200) : "";
    if (!address) return res.status(400).json({ error: "請提供物件地址。" });

    // 簡易判斷是否為東京都地址
    if (!address.includes("東京都") && !address.match(/[区]/) && !address.match(/(武蔵野|三鷹|府中|調布|町田|小金井|小平|日野|東村山|国分寺|国立|狛江|東大和|清瀬|東久留米|多摩|稲城|西東京|八王子|立川|青梅|昭島|福生|羽村|あきる野)/)) {
      return res.status(200).json({ found: false, message: "治安資料目前僅支援東京都內物件。" });
    }

    const result = await getCrimeSafety(address);
    if (!result) {
      return res.status(200).json({ found: false, message: "此地址未能在東京都犯罪統計中找到對應資料，可能為非東京都物件或地址定位精度不足。" });
    }

    return res.status(200).json({ found: true, crime: result });
  } catch (error) {
    console.error("Listing crime error:", error);
    return res.status(503).json({ error: "治安資料暫時無法取得，請稍後再試。" });
  }
}
