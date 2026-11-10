import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { normalizeLeadSource, validateSubmission } from "../src/lib/findHome/schema.js";
import { leadStoreConfigured, setNotifyStatus, submitLead } from "../src/lib/leadStore.js";
import { sendLeadEmail } from "../src/lib/leadNotify.js";

/**
 * 找房問卷送出（公開、只能寫）。
 *
 * POST /api/find-home
 *   { idempotencyKey, source, startedAt, website(honeypot), nickname, contact:{channel,value},
 *     contactTimes, requirement:{...}, decision:{...}, privacyAck:true }
 *   → 201 { refCode }          成功（或同一次填寫重送）
 *   → 400 { fieldErrors }      欄位有誤
 *   → 429 { error }            太頻繁
 *   → 503 { error }            儲存失敗；前端保留草稿並提供改用 LINE 傳送
 *
 * 回應只有參考碼：系統判斷的維度、標籤、狀態一律不回傳給客人。
 *
 * 防灌水：honeypot 欄位、從開始填到送出少於 8 秒視為機器人、每個 IP 每小時 5 次、
 * 全站每小時 60 次（超過就先擋，避免被灌爆造成費用）。限流用統計那個 Redis（不放客戶資料）。
 */

const PER_IP_LIMIT = 5;
const GLOBAL_HOURLY_LIMIT = 60;
const MIN_FILL_MS = 8000;
const MAX_BODY_BYTES = 8 * 1024;

const statsRedis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN ? Redis.fromEnv() : null;
const ipLimiter = statsRedis
  ? new Ratelimit({ redis: statsRedis, limiter: Ratelimit.slidingWindow(PER_IP_LIMIT, "3600 s"), prefix: "linus-find-home-ip" })
  : null;
const globalLimiter = statsRedis
  ? new Ratelimit({ redis: statsRedis, limiter: Ratelimit.fixedWindow(GLOBAL_HOURLY_LIMIT, "3600 s"), prefix: "linus-find-home-all" })
  : null;

function parseBody(body: unknown): any {
  if (typeof body !== "string") return body;
  try { return JSON.parse(body); } catch { return null; }
}

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed. Use POST." });

  const body = parseBody(req.body);
  if (!body || typeof body !== "object") return res.status(400).json({ error: "請提供有效的 JSON 格式。" });
  if (Buffer.byteLength(JSON.stringify(body), "utf8") > MAX_BODY_BYTES) return res.status(413).json({ error: "內容過長，請精簡補充說明。" });

  const idempotencyKey = typeof body.idempotencyKey === "string" && /^[A-Za-z0-9_-]{16,64}$/.test(body.idempotencyKey) ? body.idempotencyKey : null;
  if (!idempotencyKey) return res.status(400).json({ error: "請重新整理頁面後再送出。" });

  // 機器人：honeypot 有值或填寫時間太短。回 201 假成功，不讓機器人知道被擋。
  const startedAt = Number(body.startedAt);
  const tooFast = Number.isFinite(startedAt) && Date.now() - startedAt < MIN_FILL_MS;
  if ((typeof body.website === "string" && body.website.trim()) || tooFast) {
    return res.status(201).json({ refCode: "FH-0000" });
  }

  const ip = String(req.headers?.["x-forwarded-for"] || req.headers?.["x-real-ip"] || "unknown").split(",")[0].trim();
  if (process.env.NODE_ENV === "production") {
    try {
      const [perIp, global] = await Promise.all([ipLimiter?.limit(ip), globalLimiter?.limit("all")]);
      if (perIp && !perIp.success) return res.status(429).json({ error: "送出太頻繁，請稍後再試，或直接加 LINE 聯絡 Linus。" });
      if (global && !global.success) return res.status(429).json({ error: "目前送出的人比較多，請稍後再試，或直接加 LINE 聯絡 Linus。" });
    } catch (error) {
      // 限流服務暫時故障時照常收件：寧可多收一筆，也不要讓客人送不出去。
      console.error("find-home rate limit failed (ignored):", (error as Error)?.message);
    }
  }

  const validated = validateSubmission(body);
  if (!validated.ok || !validated.value) return res.status(400).json({ fieldErrors: validated.errors });

  if (!leadStoreConfigured()) return res.status(503).json({ error: "系統暫時無法收件。" });

  try {
    const result = await submitLead(validated.value, { source: normalizeLeadSource(body.source), idempotencyKey });
    if (!result.duplicate) {
      // 先存好才寄信；寄信失敗只記狀態，後台會顯示「通知未寄出」並可重寄。
      const sent = await sendLeadEmail(result.lead, result.merged ? "updated" : "new");
      await setNotifyStatus(result.leadId, sent.ok ? { status: "sent" } : { status: "failed", error: sent.error }).catch(error => {
        console.error("find-home notify status failed:", result.leadId, (error as Error)?.message);
      });
      if (!sent.ok) console.error("find-home notify failed:", result.leadId, sent.error);
    }
    return res.status(201).json({ refCode: result.refCode });
  } catch (error) {
    // 只記錯誤類型，不記任何客人填的內容（Vercel 日誌會保留）。
    console.error("find-home store failed:", (error as Error)?.message);
    return res.status(503).json({ error: "系統暫時無法收件。" });
  }
}
