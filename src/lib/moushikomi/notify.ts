import { docsFor, identitySummary, stepsFor, displayValue, RETENTION_DAYS } from "./schema.js";
import { expiresAt, type Application } from "./store.js";

/**
 * 申請資料通知信（Resend，和找房問卷同一組設定）。
 *
 * Linus 決定信裡要有完整申請資料與 Google Drive 資料夾連結（不夾檔案）。
 * 提醒：信件會一直留在信箱，結案時記得一起刪信，才符合「結案就刪、最長 90 天」。
 */

const SITE_URL = "https://linusniceday.com";

export function notifyConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.LEADS_NOTIFY_TO);
}

const fmt = (iso: string) => new Intl.DateTimeFormat("zh-TW", {
  timeZone: "Asia/Tokyo", year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
}).format(new Date(iso));

export function missingDocs(app: Application) {
  if (!app.form) return [];
  return docsFor(app.form.values).filter(doc => doc.required && !app.files.some(file => file.docId === doc.id));
}

export function buildSubmittedEmail(app: Application) {
  const form = app.form!;
  const name = form.values.NameEn || app.label;
  const later = form.values.docTiming === "later";
  const missing = missingDocs(app);
  const subject = `【住好日】申請資料 ${app.refCode}｜${name}｜${identitySummary(form.values)}`;
  const lines = [
    `${app.label} 送出了租屋申請資料。`,
    `參考碼：${app.refCode}　送出：${fmt(app.submittedAt!)}（東京時間）`,
    "",
    later ? "文件：客人選擇「先準備，之後再給」，傳好時會再寄一封通知。" : `文件：已上傳 ${app.files.length} 個檔案${missing.length ? `，還缺 ${missing.map(doc => doc.label).join("、")}` : "，必交文件都齊了"}。`,
    ...(app.driveFolderUrl ? [`Google Drive 資料夾：${app.driveFolderUrl}`] : []),
    "",
  ];
  for (const step of stepsFor(form.values)) {
    lines.push(`■ ${step.title}`);
    if (step.skip) { lines.push("（不用填）", ""); continue; }
    for (const field of step.fields) {
      if (field.type === "check" && !form.values[field.id]) continue;
      lines.push(`${field.label}：${displayValue(field, form)}`);
    }
    lines.push("");
  }
  lines.push(
    `後台（複製日文申込書、結案刪除）：${SITE_URL}/#admin/apply/${app.id}`,
    `資料保存到 ${fmt(expiresAt(app))}（${RETENTION_DAYS} 天），結案時請一併刪除這封信。`,
  );
  return { subject, text: lines.join("\n") };
}

export function buildDocsEmail(app: Application, newFiles: Application["files"]) {
  const missing = missingDocs(app);
  const subject = `【住好日】${app.refCode} 補交文件｜${app.form?.values.NameEn || app.label}`;
  const text = [
    `${app.label} 補交了 ${newFiles.length} 個檔案：`,
    ...newFiles.map(file => `・${docsFor(app.form?.values || {}).find(doc => doc.id === file.docId)?.label || file.docId}：${file.name}`),
    "",
    missing.length ? `還缺：${missing.map(doc => doc.label).join("、")}` : "必交文件都齊了。",
    ...(app.driveFolderUrl ? ["", `Google Drive 資料夾：${app.driveFolderUrl}`] : []),
    "",
    `後台：${SITE_URL}/#admin/apply/${app.id}`,
  ].join("\n");
  return { subject, text };
}

export async function sendEmail(mail: { subject: string; text: string }): Promise<{ ok: boolean; error?: string }> {
  if (!notifyConfigured()) return { ok: false, error: "尚未設定通知信（RESEND_API_KEY／LEADS_NOTIFY_TO）" };
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.LEADS_NOTIFY_FROM || "LINUS 住好日 <onboarding@resend.dev>",
        to: [process.env.LEADS_NOTIFY_TO],
        subject: mail.subject,
        text: mail.text,
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
