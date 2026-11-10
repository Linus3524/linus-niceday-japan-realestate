import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { timingSafeEqual } from "crypto";
import {
  FEASIBILITY_OPTIONS, LEAD_STATUSES, LEAD_TAGS, REQUIREMENT_FIELDS, DECISION_FIELDS, effectiveDims,
  type Lead, type Level,
} from "../src/lib/findHome/lead.js";
import { LEAD_SOURCE_LABEL, LIMITS, validateDecision, validateRequirement } from "../src/lib/findHome/schema.js";
import {
  addEvent, deleteLead, getLead, isValidLeadId, leadStoreConfigured, listLeads, patchLead, purgeExpiredContacts,
  removeContact, setNotifyStatus, type AdminPatch,
} from "../src/lib/leadStore.js";
import { leadNotifyConfigured, sendLeadEmail } from "../src/lib/leadNotify.js";

/**
 * 後台：客戶需求（需要 LEADS_ADMIN_TOKEN，放 x-admin-token 標頭）。
 *
 * 密碼刻意和統計後台的 ANALYTICS_TOKEN 分開：這裡看得到客人的聯絡方式，外洩的後果比統計數字大得多。
 *
 * GET    /api/leads                    → { leads, notifyConfigured }
 * GET    /api/leads?id=X               → { lead }
 * GET    /api/leads?export=csv         → CSV（不含聯絡方式）
 * PATCH  /api/leads  { id, ver, patch }→ { lead }；版本不符回 409
 * POST   /api/leads  { id, action: "remove-contact", ver } | { id, action: "note", text }
 *                    | { id, action: "resend-notify" } | { id, action: "delete", confirm: 參考碼 }
 * GET    /api/leads?task=purge         → Vercel Cron 每日呼叫（Authorization: Bearer CRON_SECRET），
 *                                         刪除送出滿 30 天仍未聯絡上的聯絡方式
 */

const FAIL_LIMIT = 10;
const statsRedis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN ? Redis.fromEnv() : null;
const failLimiter = statsRedis
  ? new Ratelimit({ redis: statsRedis, limiter: Ratelimit.fixedWindow(FAIL_LIMIT, "900 s"), prefix: "linus-leads-auth-fail" })
  : null;

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function parseBody(body: unknown): any {
  if (typeof body !== "string") return body;
  try { return JSON.parse(body); } catch { return null; }
}

const LEVELS: Level[] = ["high", "mid", "low"];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function readPatch(input: any): { patch: AdminPatch; error?: string } {
  const patch: AdminPatch = {};
  if (!input || typeof input !== "object") return { patch, error: "沒有要修改的內容。" };
  if (input.status !== undefined) {
    if (!LEAD_STATUSES.some(item => item.id === input.status)) return { patch, error: "狀態不正確。" };
    patch.status = input.status;
  }
  if (input.feasibility !== undefined) {
    if (!FEASIBILITY_OPTIONS.some(item => item.id === input.feasibility)) return { patch, error: "市場可行性不正確。" };
    patch.feasibility = input.feasibility;
  }
  if (input.nextFollowUpAt !== undefined) {
    if (input.nextFollowUpAt !== null && !(typeof input.nextFollowUpAt === "string" && DATE_PATTERN.test(input.nextFollowUpAt))) {
      return { patch, error: "追蹤日期格式不正確。" };
    }
    patch.nextFollowUpAt = input.nextFollowUpAt;
  }
  if (input.tags !== undefined) {
    if (!Array.isArray(input.tags)) return { patch, error: "標籤格式不正確。" };
    patch.tags = [...new Set(input.tags.filter((tag: unknown) => LEAD_TAGS.some(item => item.id === tag)))] as AdminPatch["tags"];
  }
  if (input.notes !== undefined) patch.notes = String(input.notes).slice(0, 4000);
  if (input.nickname !== undefined) {
    const nickname = String(input.nickname).replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, LIMITS.nickname);
    if (!nickname) return { patch, error: "稱呼不能空白。" };
    patch.nickname = nickname;
  }
  if (input.dimsOverride !== undefined) {
    const next: NonNullable<AdminPatch["dimsOverride"]> = {};
    for (const key of ["urgency", "readiness", "flexibility"] as const) {
      const value = input.dimsOverride?.[key];
      if (value === null) next[key] = null;
      else if (LEVELS.includes(value)) next[key] = value;
    }
    patch.dimsOverride = next;
  }
  if (input.requirement !== undefined) {
    const { value, errors } = validateRequirement(input.requirement);
    if (Object.keys(errors).length) return { patch, error: Object.values(errors)[0] };
    patch.requirement = value;
  }
  if (input.decision !== undefined) {
    const { value, errors } = validateDecision(input.decision);
    if (Object.keys(errors).length) return { patch, error: Object.values(errors)[0] };
    patch.decision = value;
  }
  return { patch };
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  // 開頭是 = + - @ 的儲存格在試算表裡會被當成公式執行，前面加單引號擋掉。
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

function toCsv(leads: Lead[]) {
  const header = ["參考碼", "建立時間", "來源", "稱呼", "狀態", "市場可行性", "急迫", "準備", "彈性", "下次追蹤",
    ...REQUIREMENT_FIELDS.map(field => field.label), ...DECISION_FIELDS.map(field => field.label), "聯絡方式狀態"];
  const rows = leads.map(lead => {
    const dims = effectiveDims(lead);
    return [
      lead.refCode, lead.createdAt, LEAD_SOURCE_LABEL[lead.source], lead.nickname,
      LEAD_STATUSES.find(item => item.id === lead.admin.status)?.label,
      FEASIBILITY_OPTIONS.find(item => item.id === lead.admin.feasibility)?.label,
      dims.urgency, dims.readiness, dims.flexibility, lead.admin.nextFollowUpAt,
      ...REQUIREMENT_FIELDS.map(field => field.format(lead.requirement)),
      ...DECISION_FIELDS.map(field => field.format(lead.decision)),
      // 匯出檔不放聯絡方式：檔案會被下載、轉傳，留副本就違反「聯絡上就刪除」的承諾。
      lead.contact ? "保留中（未匯出）" : "已刪除",
    ];
  });
  return "﻿" + [header, ...rows].map(row => row.map(csvCell).join(",")).join("\r\n");
}

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Robots-Tag", "noindex");

  // 每日排程：只做「刪除過期聯絡方式」，用 Vercel 的 CRON_SECRET 驗證。
  if (req.method === "GET" && req.query?.task === "purge") {
    const secret = process.env.CRON_SECRET;
    if (!secret || !safeEqual(String(req.headers?.authorization || ""), `Bearer ${secret}`)) {
      return res.status(401).json({ error: "Unauthorized." });
    }
    if (!leadStoreConfigured()) return res.status(503).json({ error: "Lead storage is not configured." });
    const purged = await purgeExpiredContacts();
    return res.json({ purged });
  }

  const expected = process.env.LEADS_ADMIN_TOKEN;
  if (!expected) return res.status(503).json({ error: "LEADS_ADMIN_TOKEN is not configured." });

  const ip = String(req.headers?.["x-forwarded-for"] || req.headers?.["x-real-ip"] || "unknown").split(",")[0].trim();
  if (failLimiter) {
    const { remaining } = await failLimiter.getRemaining(ip).catch(() => ({ remaining: FAIL_LIMIT }));
    if (remaining <= 0) return res.status(429).json({ error: "密碼錯誤次數太多，請 15 分鐘後再試。" });
  }
  const provided = String(req.headers?.["x-admin-token"] || "");
  if (!safeEqual(provided, expected)) {
    await failLimiter?.limit(ip).catch(() => undefined);
    return res.status(401).json({ error: "Unauthorized." });
  }

  if (!leadStoreConfigured()) return res.status(503).json({ error: "Lead storage is not configured." });

  try {
    if (req.method === "GET") {
      const id = typeof req.query?.id === "string" ? req.query.id : "";
      if (id) {
        const lead = await getLead(id);
        return lead ? res.json({ lead }) : res.status(404).json({ error: "找不到這筆資料。" });
      }
      const summaries = await listLeads();
      if (req.query?.export === "csv") {
        const full = (await Promise.all(summaries.map(summary => getLead(summary.id)))).filter((lead): lead is Lead => Boolean(lead));
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="find-home-leads.csv"`);
        return res.send(toCsv(full));
      }
      return res.json({ leads: summaries, notifyConfigured: leadNotifyConfigured() });
    }

    const body = parseBody(req.body);
    const id = body?.id;
    if (!isValidLeadId(id)) return res.status(400).json({ error: "資料編號不正確。" });

    if (req.method === "PATCH") {
      const ver = Number(body.ver);
      if (!Number.isInteger(ver)) return res.status(400).json({ error: "缺少版本號，請重新整理。" });
      const { patch, error } = readPatch(body.patch);
      if (error) return res.status(400).json({ error });
      const result = await patchLead(id, ver, patch);
      if (result === "not-found") return res.status(404).json({ error: "找不到這筆資料。" });
      if (result === "conflict") return res.status(409).json({ error: "這筆資料剛剛在別處被改過，請重新整理後再改。" });
      return res.json({ lead: result });
    }

    if (req.method === "POST") {
      switch (body.action) {
        case "remove-contact": {
          const ver = Number(body.ver);
          const result = await removeContact(id, "contacted", Number.isInteger(ver) ? ver : null);
          if (result === "not-found") return res.status(404).json({ error: "找不到這筆資料。" });
          if (result === "conflict") return res.status(409).json({ error: "這筆資料剛剛在別處被改過，請重新整理後再操作。" });
          return res.json({ lead: result });
        }
        case "note": {
          const text = String(body.text || "").trim().slice(0, 1000);
          if (!text) return res.status(400).json({ error: "請輸入內容。" });
          const result = await addEvent(id, { type: "note", text });
          return typeof result === "object" ? res.json({ lead: result }) : res.status(404).json({ error: "找不到這筆資料。" });
        }
        case "resend-notify": {
          const lead = await getLead(id);
          if (!lead) return res.status(404).json({ error: "找不到這筆資料。" });
          const sent = await sendLeadEmail(lead, "new");
          const result = await setNotifyStatus(id, sent.ok ? { status: "sent" } : { status: "failed", error: sent.error });
          if (!sent.ok) return res.status(502).json({ error: `通知信寄送失敗：${sent.error}` });
          return res.json({ lead: result });
        }
        case "delete": {
          const lead = await getLead(id);
          if (!lead) return res.status(404).json({ error: "找不到這筆資料。" });
          if (body.confirm !== lead.refCode) return res.status(400).json({ error: "請輸入參考碼確認刪除。" });
          await deleteLead(id);
          return res.json({ deleted: true });
        }
        default:
          return res.status(400).json({ error: "不支援的操作。" });
      }
    }

    return res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    console.error("leads admin error:", (error as Error)?.message);
    return res.status(500).json({ error: "讀取或寫入失敗，請稍後再試。" });
  }
}
