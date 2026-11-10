import { LEAD_SOURCE_LABEL, MOVE_IN_OPTIONS, labelOf } from "./findHome/schema.js";
import { requirementText, type Lead } from "./findHome/lead.js";

/**
 * 新客通知信（Resend）。
 *
 * 信裡只放參考碼、來源、入住、地區、預算與後台連結，**不放稱呼與聯絡方式**：
 * 信箱會長期保留信件，而聯絡方式在網站上聯絡上就會刪除，信裡留副本就破功了。
 *
 * 寄件人用 Resend 的測試寄件位址 onboarding@resend.dev，它只能寄給 Resend 帳號本人的信箱，
 * 剛好符合「只通知 Linus 自己」的用途，不需要設定網域 DNS。
 *
 * 環境變數：RESEND_API_KEY、LEADS_NOTIFY_TO（收件信箱）、LEADS_NOTIFY_FROM（選填）。
 */

const SITE_URL = "https://linusniceday.com";

export function leadNotifyConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.LEADS_NOTIFY_TO);
}

export function buildLeadEmail(lead: Lead, kind: "new" | "updated") {
  const req = lead.requirement;
  const moveIn = req.moveIn === "date" ? `指定 ${req.moveInDate}` : labelOf(MOVE_IN_OPTIONS, req.moveIn);
  const subject = kind === "new"
    ? `【住好日】新的找房需求 ${lead.refCode}｜${moveIn}・${req.areas.slice(0, 20)}`
    : `【住好日】找房需求更新 ${lead.refCode}`;
  const link = `${SITE_URL}/#admin/leads/${lead.id}`;
  const submittedAt = new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Tokyo", year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date(lead.updatedAt || lead.createdAt));
  const latest = kind === "updated" ? lead.revisions[0] : undefined;
  const text = [
    kind === "new" ? "有新的找房需求。" : "同一位客人重新填寫了問卷。",
    `來源：${LEAD_SOURCE_LABEL[lead.source] ?? lead.source}　送出：${submittedAt}（東京時間）`,
    "",
    ...(latest?.changes.length
      ? ["這次改了：", ...latest.changes.map(change => `・${change.label}：${change.before} → ${change.after}`), ""]
      : []),
    "下面這段可以直接複製到 LINE 跟客人確認：",
    "────────",
    requirementText(lead.refCode, req, lead.decision),
    "────────",
    "",
    `後台（看聯絡方式、標記進度）：${link}`,
    "（信中不含客人的稱呼與聯絡方式）",
  ].join("\n");
  return { subject, text };
}

export async function sendLeadEmail(lead: Lead, kind: "new" | "updated"): Promise<{ ok: boolean; error?: string }> {
  if (!leadNotifyConfigured()) return { ok: false, error: "尚未設定通知信（RESEND_API_KEY／LEADS_NOTIFY_TO）" };
  const { subject, text } = buildLeadEmail(lead, kind);
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.LEADS_NOTIFY_FROM || "LINUS 住好日 <onboarding@resend.dev>",
        to: [process.env.LEADS_NOTIFY_TO],
        subject,
        text,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return { ok: false, error: `Resend HTTP ${response.status} ${body.slice(0, 120)}` };
    }
    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: String(error?.message || error).slice(0, 160) };
  }
}
