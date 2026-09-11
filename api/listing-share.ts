import {
  createListingShare,
  getListingShare,
  isValidShareId,
  listingShareConfigured,
  SHARE_MAX_BYTES,
} from "../src/lib/listingShare.js";

/**
 * 圖紙分析結果的分享連結。
 *
 * POST /api/listing-share        { title, dealType, result } → { id, url, expiresAt }
 * GET  /api/listing-share?id=X   → { title, dealType, result, createdAt, expiresAt }
 *
 * 建立走限流：這是公開可寫的端點，不限制的話任何人都能把 Redis 塞滿。
 * 讀取不限流：分享出去就是要讓人打開的。
 */

const CREATE_RATE_LIMIT = 10;
const CREATE_RATE_WINDOW_MS = 600_000;
const buckets = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string) {
  if (!ip || ip === "unknown" || ip === "127.0.0.1" || ip === "::1" || process.env.NODE_ENV !== "production") {
    return { limited: false, retryAfter: 0 };
  }
  const now = Date.now();
  const current = buckets.get(ip);
  if (!current || current.resetAt <= now) {
    buckets.set(ip, { count: 1, resetAt: now + CREATE_RATE_WINDOW_MS });
    return { limited: false, retryAfter: 0 };
  }
  current.count++;
  return {
    limited: current.count > CREATE_RATE_LIMIT,
    retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}

function cleanTitle(value: unknown): string {
  if (typeof value !== "string") return "";
  // 標題會顯示在分享頁與 PDF 上，去掉控制字元、限制長度即可，不做其他改寫。
  return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, 60);
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (!listingShareConfigured()) {
    return res.status(503).json({ error: "分享功能目前未啟用。" });
  }

  if (req.method === "GET") {
    const id = typeof req.query?.id === "string" ? req.query.id.trim().toUpperCase() : "";
    if (!isValidShareId(id)) {
      return res.status(400).json({ error: "連結格式不正確。" });
    }
    try {
      const stored = await getListingShare(id);
      if (!stored) {
        return res.status(404).json({ error: "找不到這個分享連結，可能已過期（連結保存 14 天）。" });
      }
      return res.json({
        id,
        title: stored.title,
        dealType: stored.dealType,
        result: stored.result,
        createdAt: stored.createdAt,
        expiresAt: stored.expiresAt,
      });
    } catch (error) {
      console.error("listing-share GET error:", error);
      return res.status(500).json({ error: "讀取分享連結時發生錯誤，請稍後再試。" });
    }
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const ip = String(req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown").split(",")[0].trim();
  const limit = rateLimit(ip);
  if (limit.limited) {
    res.setHeader("Retry-After", String(limit.retryAfter));
    return res.status(429).json({ error: "建立連結每 10 分鐘最多 10 次，請稍候再試。", retryAfter: limit.retryAfter });
  }

  const title = cleanTitle(req.body?.title);
  if (!title) {
    return res.status(400).json({ error: "請先填寫標題。" });
  }

  const result = req.body?.result;
  if (!result || typeof result !== "object") {
    return res.status(400).json({ error: "沒有可分享的分析結果。" });
  }

  // 只收分析結果，不收圖紙：就算前端誤送了 base64 圖片，也在這裡擋下來，
  // 不落地儲存的承諾不能因為前端的一個 bug 就破功。
  const serialized = JSON.stringify(result);
  if (/"data":"[A-Za-z0-9+/]{2000,}/.test(serialized)) {
    return res.status(400).json({ error: "分享內容不可包含圖片檔。" });
  }
  if (Buffer.byteLength(serialized, "utf8") > SHARE_MAX_BYTES) {
    return res.status(413).json({ error: "分析結果過大，無法建立分享連結。" });
  }

  const dealType = result?.dealType === "sale" || result?.dealType === "rent" ? result.dealType : null;

  try {
    const { id, expiresAt } = await createListingShare({ title, dealType, result });
    return res.json({ id, expiresAt });
  } catch (error) {
    console.error("listing-share POST error:", error);
    return res.status(500).json({ error: "建立分享連結時發生錯誤，請稍後再試。" });
  }
}
