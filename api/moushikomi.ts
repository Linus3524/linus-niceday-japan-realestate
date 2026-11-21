import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { clientIp, requireAdmin, safeEqual } from "../src/lib/adminAuth.js";
import { beginAuth, driveStatus, getDrive, DriveError } from "../src/lib/moushikomi/drive.js";
import { buildDocsEmail, buildSubmittedEmail, notifyConfigured, sendEmail } from "../src/lib/moushikomi/notify.js";
import {
  ACCEPTED_MIME, DOC_KEYS, MAX_FILE_BYTES, MAX_FILES_PER_DOC, MAX_FILES_TOTAL,
  cleanForm, docsFor, validateForm,
} from "../src/lib/moushikomi/schema.js";
import {
  applicationStoreConfigured, createApplication, deleteApplication, findByToken, getApplication, listApplications,
  listExpired, mutate, recordSubmission, tryAcquireLock, type Application,
} from "../src/lib/moushikomi/store.js";

/**
 * 租屋申請資料（/moushikomi）。
 *
 * 客人（x-apply-token 標頭帶專屬連結的隨機碼；不放網址，避免進日誌）：
 *   GET  /api/moushikomi                         → 狀態（不回傳已填的個資）
 *   POST /api/moushikomi  (octet-stream)         → 上傳一個檔案到 Google Drive
 *        標頭 x-doc-id、x-file-name（encodeURIComponent）、x-file-type
 *   POST /api/moushikomi  { action: "submit", values, unknown, docLater, privacyAck, shareConsent }
 *   POST /api/moushikomi  { action: "remove-file", driveFileId }
 *   POST /api/moushikomi  { action: "docs-done" }  → 補傳完，通知 Linus
 *
 * 後台（x-admin-token）：
 *   GET  /api/moushikomi?admin=list | ?admin=one&id=X
 *   POST /api/moushikomi  { admin: "create", label, property } | { admin: "close", id, confirm }
 *                         | { admin: "resend", id } | { admin: "drive-auth" }
 *
 * 排程：GET /api/moushikomi?task=purge（每日；刪除送出或建立滿 90 天的申請與 Drive 資料夾）
 */

const statsRedis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN ? Redis.fromEnv() : null;
const uploadLimiter = statsRedis
  ? new Ratelimit({ redis: statsRedis, limiter: Ratelimit.slidingWindow(80, "3600 s"), prefix: "linus-apply-upload" })
  : null;
const actionLimiter = statsRedis
  ? new Ratelimit({ redis: statsRedis, limiter: Ratelimit.slidingWindow(30, "3600 s"), prefix: "linus-apply-action" })
  : null;

const ALL_DOC_IDS = new Set([
  "visa", "zairyu", "passport", "insurance", "admission", "studentId", "bank", "offer", "terms", "gensen", "pay3", "pay", "oldPay",
  "visaDoc", "incomeDoc", "coId", "coIncomeDoc",
]);

function parseBody(body: unknown): any {
  if (typeof body !== "string") return body;
  try { return JSON.parse(body); } catch { return null; }
}

async function limited(limiter: Ratelimit | null, key: string) {
  if (!limiter || process.env.NODE_ENV !== "production") return false;
  try { return !(await limiter.limit(key)).success; } catch { return false; }
}

/** 讀取上傳的二進位內容：Vercel 會把 octet-stream 解析成 Buffer；本機 express 用 raw parser。 */
async function readBinary(req: any): Promise<Buffer | null> {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (req.body && typeof req.body === "object" && !Array.isArray(req.body) && Object.keys(req.body).length) return null;
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_FILE_BYTES + 1024) return null;
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/** 用檔頭判斷真正的檔案類型，不信任瀏覽器給的 Content-Type。 */
function sniff(data: Buffer): string | null {
  if (data.length < 12) return null;
  if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return "image/jpeg";
  if (data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (data.subarray(0, 5).toString("latin1") === "%PDF-") return "application/pdf";
  if (data.subarray(0, 4).toString("latin1") === "RIFF" && data.subarray(8, 12).toString("latin1") === "WEBP") return "image/webp";
  if (data.subarray(4, 8).toString("latin1") === "ftyp" && /^(heic|heix|hevc|mif1|msf1|heim|heis)$/.test(data.subarray(8, 12).toString("latin1"))) return "image/heic";
  return null;
}

const safeName = (raw: string) => raw.replace(/[\u0000-\u001F\u007F/\\]/g, "_").trim().slice(0, 120) || "file";

async function ensureFolder(app: Application): Promise<Application> {
  if (app.driveFolderId) return app;
  const drive = await getDrive();
  if (!drive) throw new DriveError("文件上傳暫時無法使用。");
  // 兩個檔案同時上傳時只建立一個資料夾：拿不到鎖的等一下再讀。
  if (!(await tryAcquireLock(`folder:${app.id}`, 60))) {
    for (let i = 0; i < 20; i++) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const fresh = await getApplication(app.id);
      if (fresh?.driveFolderId) return fresh;
    }
    throw new DriveError("建立資料夾逾時，請再傳一次。");
  }
  const folder = await drive.api.createFolder(`${app.refCode} ${app.label}`, drive.rootFolderId);
  const updated = await mutate(app.id, next => { next.driveFolderId = folder.id; next.driveFolderUrl = folder.url; });
  if (!updated) throw new Error("Application disappeared.");
  return updated;
}

async function closeApplication(app: Application) {
  if (app.driveFolderId) {
    const drive = await getDrive();
    if (!drive) throw new DriveError("Google Drive 尚未連結，無法刪除資料夾。");
    await drive.api.remove(app.driveFolderId);
  }
  await deleteApplication(app);
}

function publicState(app: Application) {
  const docKeys = Object.fromEntries(DOC_KEYS.map(key => [key, app.form?.values[key] ?? ""]));
  return {
    refCode: app.refCode,
    property: app.property ?? "",
    submitted: Boolean(app.submittedAt),
    docTiming: app.form?.values.docTiming ?? "",
    // 送出後只回傳決定文件清單需要的幾個欄位，其餘個資不回傳。
    docKeys: app.submittedAt ? docKeys : null,
    docLater: app.docLater,
    files: app.files.map(file => ({ docId: file.docId, name: file.name, driveFileId: file.driveFileId, size: file.size })),
  };
}

function requestOrigin(req: any) {
  const host = String(req.headers?.["x-forwarded-host"] || req.headers?.host || "");
  const proto = String(req.headers?.["x-forwarded-proto"] || (/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host) ? "http" : "https")).split(",")[0];
  return `${proto}://${host}`;
}

async function handleAdmin(req: any, res: any, body: any) {
  if (!(await requireAdmin(req, res))) return;
  if (req.method === "GET") {
    if (req.query?.admin === "one") {
      const app = await getApplication(String(req.query.id || ""));
      return app ? res.json({ application: app }) : res.status(404).json({ error: "找不到這筆申請。" });
    }
    return res.json({ applications: await listApplications(), drive: await driveStatus(), notifyConfigured: notifyConfigured() });
  }
  switch (body?.admin) {
    case "create": {
      const label = String(body.label || "").replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, 40);
      if (!label) return res.status(400).json({ error: "請填客人稱呼。" });
      const property = String(body.property || "").replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, 300);
      let app = await createApplication({ label, property });
      // Drive 已連結就先建好資料夾；失敗不影響建立連結，客人第一次上傳時會再建。
      try { app = await ensureFolder(app); } catch (error) { console.error("apply folder create failed:", (error as Error)?.message); }
      return res.status(201).json({ application: app });
    }
    case "close": {
      const app = await getApplication(String(body.id || ""));
      if (!app) return res.status(404).json({ error: "找不到這筆申請。" });
      if (body.confirm !== app.refCode) return res.status(400).json({ error: "請輸入參考碼確認刪除。" });
      await closeApplication(app);
      return res.json({ deleted: true });
    }
    case "resend": {
      const app = await getApplication(String(body.id || ""));
      if (!app?.submittedAt) return res.status(404).json({ error: "這筆申請還沒送出。" });
      const sent = await sendEmail(buildSubmittedEmail(app));
      const updated = await mutate(app.id, next => { next.notify = sent.ok ? { status: "sent", at: new Date().toISOString() } : { status: "failed", at: new Date().toISOString(), error: sent.error }; });
      return sent.ok ? res.json({ application: updated }) : res.status(502).json({ error: `通知信寄送失敗：${sent.error}` });
    }
    case "drive-auth": {
      try { return res.json({ url: await beginAuth(requestOrigin(req)) }); }
      catch (error) { return res.status(503).json({ error: (error as Error).message }); }
    }
    default:
      return res.status(400).json({ error: "不支援的操作。" });
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Robots-Tag", "noindex");

  if (req.method === "GET" && req.query?.task === "purge") {
    const secret = process.env.CRON_SECRET;
    if (secret ? !safeEqual(String(req.headers?.authorization || ""), `Bearer ${secret}`) : !/vercel-cron/i.test(String(req.headers?.["user-agent"] || ""))) {
      return res.status(401).json({ error: "Unauthorized." });
    }
    if (!applicationStoreConfigured()) return res.status(503).json({ error: "Storage is not configured." });
    if (!secret && !(await tryAcquireLock("purge", 3600))) return res.json({ purged: 0, skipped: true });
    let purged = 0;
    for (const app of await listExpired()) {
      try { await closeApplication(app); purged++; } catch (error) { console.error("apply purge failed:", app.refCode, (error as Error)?.message); }
    }
    return res.json({ purged });
  }

  if (!applicationStoreConfigured()) return res.status(503).json({ error: "系統暫時無法使用，請直接用 LINE 聯絡 Linus。" });

  const isBinary = /application\/octet-stream/i.test(String(req.headers?.["content-type"] || ""));
  const body = isBinary ? null : parseBody(req.body);
  if (req.query?.admin || body?.admin) {
    try { return await handleAdmin(req, res, body); }
    catch (error) {
      console.error("apply admin error:", (error as Error)?.message);
      return res.status(error instanceof DriveError ? 502 : 500).json({ error: error instanceof DriveError ? error.message : "讀取或寫入失敗，請稍後再試。" });
    }
  }

  const token = String(req.headers?.["x-apply-token"] || "");
  const app = await findByToken(token).catch(() => null);
  if (!app) return res.status(404).json({ error: "這個申請連結無效或已經結案，請向 Linus 索取新的連結。" });
  const ip = clientIp(req);

  try {
    if (req.method === "GET") return res.json(publicState(app));
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });

    if (isBinary) {
      if (await limited(uploadLimiter, ip)) return res.status(429).json({ error: "上傳太頻繁，請稍後再試。" });
      const docId = String(req.headers?.["x-doc-id"] || "");
      if (!ALL_DOC_IDS.has(docId)) return res.status(400).json({ error: "文件種類不正確。" });
      if (app.files.length >= MAX_FILES_TOTAL) return res.status(400).json({ error: `最多上傳 ${MAX_FILES_TOTAL} 個檔案，其餘請用 LINE 傳給 Linus。` });
      if (app.files.filter(file => file.docId === docId).length >= MAX_FILES_PER_DOC) return res.status(400).json({ error: `同一份文件最多 ${MAX_FILES_PER_DOC} 個檔案。` });
      const data = await readBinary(req);
      if (!data || !data.length) return res.status(400).json({ error: "沒有收到檔案，請再試一次。" });
      if (data.length > MAX_FILE_BYTES) return res.status(413).json({ error: "檔案太大（上限 4MB），請用手機拍照上傳，或傳給 Linus。" });
      const mime = sniff(data);
      if (!mime || !ACCEPTED_MIME.includes(mime)) return res.status(415).json({ error: "只能上傳照片或 PDF。" });
      let name = "file";
      try { name = safeName(decodeURIComponent(String(req.headers?.["x-file-name"] || "file"))); } catch { /* 用預設檔名 */ }
      const withFolder = await ensureFolder(app);
      const drive = await getDrive();
      if (!drive) throw new DriveError("文件上傳暫時無法使用。");
      const uploaded = await drive.api.upload(withFolder.driveFolderId!, `${docId}_${name}`, mime, data);
      const afterSubmit = Boolean(withFolder.submittedAt);
      const updated = await mutate(app.id, next => {
        next.files.push({ docId, name, size: data.length, mime, driveFileId: uploaded.id, uploadedAt: new Date().toISOString(), afterSubmit });
        delete next.docLater[docId];
      });
      return res.status(201).json(publicState(updated!));
    }

    if (await limited(actionLimiter, ip)) return res.status(429).json({ error: "操作太頻繁，請稍後再試。" });
    if (!body || typeof body !== "object") return res.status(400).json({ error: "請提供有效的 JSON 格式。" });

    switch (body.action) {
      case "remove-file": {
        const file = app.files.find(item => item.driveFileId === body.driveFileId);
        if (!file) return res.status(404).json({ error: "找不到這個檔案。" });
        const drive = await getDrive();
        await drive?.api.remove(file.driveFileId).catch(error => console.error("apply file remove failed:", (error as Error)?.message));
        const updated = await mutate(app.id, next => { next.files = next.files.filter(item => item.driveFileId !== file.driveFileId); });
        return res.json(publicState(updated!));
      }
      case "submit": {
        if (app.submittedAt) return res.status(409).json({ error: "已經送出過了；要修改請用 LINE 告訴 Linus。", ...publicState(app) });
        if (body.privacyAck !== true || body.shareConsent !== true) return res.status(400).json({ fieldErrors: { consent: "需要同意才能送出申請" } });
        const form = cleanForm(body.values, body.unknown);
        const errors = validateForm(form);
        const docs = docsFor(form.values);
        const docLater: Record<string, boolean> = {};
        if (form.values.docTiming === "now") {
          for (const doc of docs) {
            const has = app.files.some(file => file.docId === doc.id);
            if (body.docLater?.[doc.id] === true && !has) docLater[doc.id] = true;
            else if (doc.required && !has) errors[`doc:${doc.id}`] = "請上傳，或勾「之後再補」";
          }
        }
        if (Object.keys(errors).length) return res.status(400).json({ fieldErrors: errors });
        const submitted = await recordSubmission(app.id, form, docLater);
        if (!submitted) return res.status(404).json({ error: "這個申請連結已經結案。" });
        // 資料夾名稱換成護照拼音，方便在 Drive 裡找。
        if (submitted.driveFolderId && form.values.NameEn) {
          const drive = await getDrive();
          await drive?.api.rename(submitted.driveFolderId, `${submitted.refCode} ${form.values.NameEn}`).catch(() => undefined);
        }
        const sent = await sendEmail(buildSubmittedEmail(submitted));
        if (!sent.ok) console.error("apply notify failed:", submitted.refCode, sent.error);
        const final = await mutate(app.id, next => {
          next.notify = sent.ok ? { status: "sent", at: new Date().toISOString() } : { status: "failed", at: new Date().toISOString(), error: sent.error };
          // 送出時已上傳的檔案都列在這封信裡；之後補傳的才算新的。
          next.files.forEach(file => { file.notified = true; });
        });
        return res.status(201).json(publicState(final!));
      }
      case "docs-done": {
        if (!app.submittedAt) return res.status(400).json({ error: "請先送出申請資料。" });
        const fresh = app.files.filter(file => !file.notified);
        if (!fresh.length) return res.json({ ...publicState(app), notified: false });
        const sent = await sendEmail(buildDocsEmail(app, fresh));
        if (!sent.ok) console.error("apply docs notify failed:", app.refCode, sent.error);
        const updated = await mutate(app.id, next => {
          // 寄失敗就先不標記，下次按「通知 Linus」會再寄一次。
          if (sent.ok) next.files.forEach(file => { if (fresh.some(item => item.driveFileId === file.driveFileId)) file.notified = true; });
          next.events.unshift({ at: new Date().toISOString(), text: `客人補交 ${fresh.length} 個檔案${sent.ok ? "" : "（通知信寄送失敗）"}` });
        });
        return res.json({ ...publicState(updated!), notified: sent.ok });
      }
      default:
        return res.status(400).json({ error: "不支援的操作。" });
    }
  } catch (error) {
    // 不記錄客人填的內容，只記錯誤類型。
    console.error("apply error:", (error as Error)?.message);
    if (error instanceof DriveError) return res.status(503).json({ error: "文件上傳暫時無法使用，可以先勾「之後再補」送出，或把文件用 LINE 傳給 Linus。" });
    return res.status(500).json({ error: "系統暫時無法處理，請稍後再試。" });
  }
}
