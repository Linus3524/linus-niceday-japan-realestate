import { randomBytes } from "crypto";
import { sharedLeadBackend } from "../leadStore.js";
import { DRIVE_AUTH_KEY, DRIVE_STATE } from "./store.js";

/**
 * 申請文件存進 Linus 自己的 Google Drive。
 *
 * Linus 的 Google 帳號是個人帳號，服務帳號（service account）沒有自己的雲端硬碟空間，
 * 不能把檔案放進個人帳號的資料夾；所以改用 Linus 本人授權一次（OAuth），
 * 權限只開 drive.file：網站只能碰「自己建立的檔案」，看不到 Drive 裡其他東西。
 *
 * 授權後的 refresh token 存在資料庫 app:drive:auth（不寫進環境變數，重新授權也不用改設定）。
 * 環境變數：GOOGLE_DRIVE_CLIENT_ID、GOOGLE_DRIVE_CLIENT_SECRET（Google Cloud 建立的 OAuth 用戶端）。
 *
 * 沒設定用戶端時：本機開發改用記憶體假 Drive（重開就消失），正式環境回報未設定。
 */

export const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const ROOT_FOLDER_NAME = "LINUS 住好日｜租屋申請資料";
const FOLDER_MIME = "application/vnd.google-apps.folder";

interface DriveAuth { refreshToken: string; rootFolderId: string; connectedAt: string; account?: string }

export interface DriveApi {
  createFolder(name: string, parentId?: string): Promise<{ id: string; url: string }>;
  upload(folderId: string, name: string, mime: string, data: Buffer): Promise<{ id: string }>;
  rename(id: string, name: string): Promise<void>;
  remove(id: string): Promise<void>;
}

export type DriveStatus = { mode: "google"; connected: boolean; account?: string } | { mode: "memory" } | { mode: "unconfigured" };

const clientId = () => process.env.GOOGLE_DRIVE_CLIENT_ID || "";
const clientSecret = () => process.env.GOOGLE_DRIVE_CLIENT_SECRET || "";
const googleConfigured = () => Boolean(clientId() && clientSecret());

// ── 本機假 Drive ──────────────────────────────────────────────
export class MemoryDrive implements DriveApi {
  folders = new Map<string, { name: string; parent?: string }>();
  files = new Map<string, { folderId: string; name: string; mime: string; size: number }>();
  private seq = 0;
  async createFolder(name: string, parentId?: string) {
    const id = `memfolder${++this.seq}`;
    this.folders.set(id, { name, parent: parentId });
    return { id, url: `about:blank#${id}` };
  }
  async upload(folderId: string, name: string, mime: string, data: Buffer) {
    if (!this.folders.has(folderId)) throw new Error("Folder not found");
    const id = `memfile${++this.seq}`;
    this.files.set(id, { folderId, name, mime, size: data.length });
    return { id };
  }
  async rename(id: string, name: string) { const f = this.folders.get(id); if (f) f.name = name; }
  async remove(id: string) {
    this.folders.delete(id);
    for (const [fileId, file] of this.files) if (file.folderId === id || fileId === id) this.files.delete(fileId);
  }
}
let testDrive: DriveApi | null = null;
const devDrive = new MemoryDrive();
/** 測試用：換成指定的假 Drive。 */
export function setDriveForTests(next: DriveApi | null) { testDrive = next; }

// ── Google Drive ─────────────────────────────────────────────
let cachedToken: { value: string; expiresAt: number } | null = null;

async function accessToken(refreshToken: string): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId(), client_secret: clientSecret(), refresh_token: refreshToken, grant_type: "refresh_token" }),
    signal: AbortSignal.timeout(10_000),
  });
  const body: any = await response.json().catch(() => ({}));
  if (!response.ok || !body.access_token) {
    // invalid_grant：授權被取消或過期，需要在後台重新連結。
    throw new DriveError(body.error === "invalid_grant" ? "Google Drive 授權已失效，請到後台重新連結。" : `Google 授權失敗（${body.error || response.status}）`, body.error === "invalid_grant");
  }
  cachedToken = { value: body.access_token, expiresAt: Date.now() + Number(body.expires_in || 3000) * 1000 };
  return cachedToken.value;
}

export class DriveError extends Error { constructor(message: string, public reauth = false) { super(message); } }

class GoogleDrive implements DriveApi {
  constructor(private refreshToken: string) {}
  private async call(url: string, init: RequestInit = {}) {
    const token = await accessToken(this.refreshToken);
    const response = await fetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init.headers || {}) }, signal: AbortSignal.timeout(25_000) });
    if (!response.ok && response.status !== 404) {
      const text = await response.text().catch(() => "");
      throw new DriveError(`Google Drive HTTP ${response.status} ${text.slice(0, 160)}`);
    }
    return response;
  }
  async createFolder(name: string, parentId?: string) {
    const response = await this.call("https://www.googleapis.com/drive/v3/files?fields=id,webViewLink", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, mimeType: FOLDER_MIME, ...(parentId ? { parents: [parentId] } : {}) }),
    });
    const body: any = await response.json();
    return { id: body.id as string, url: (body.webViewLink as string) || `https://drive.google.com/drive/folders/${body.id}` };
  }
  async upload(folderId: string, name: string, mime: string, data: Buffer) {
    const boundary = `linus${randomBytes(12).toString("hex")}`;
    const meta = JSON.stringify({ name, parents: [folderId] });
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${boundary}\r\nContent-Type: ${mime}\r\n\r\n`),
      data,
      Buffer.from(`\r\n--${boundary}--`),
    ]);
    const response = await this.call("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id", {
      method: "POST",
      headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    });
    const json: any = await response.json();
    return { id: json.id as string };
  }
  async rename(id: string, name: string) {
    await this.call(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }),
    });
  }
  async remove(id: string) {
    // 永久刪除（不進垃圾桶）：資料夾連同裡面網站建立的檔案一起刪掉；已經不存在（404）視為成功。
    await this.call(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}`, { method: "DELETE" });
  }
}

async function readAuth(): Promise<DriveAuth | null> {
  return sharedLeadBackend().get<DriveAuth>(DRIVE_AUTH_KEY);
}

/** 取得可用的 Drive 與申請資料的根資料夾；沒有就回 null。 */
export async function getDrive(): Promise<{ api: DriveApi; rootFolderId?: string } | null> {
  if (testDrive) return { api: testDrive };
  if (googleConfigured()) {
    const auth = await readAuth();
    return auth ? { api: new GoogleDrive(auth.refreshToken), rootFolderId: auth.rootFolderId } : null;
  }
  return process.env.NODE_ENV === "production" ? null : { api: devDrive };
}

export async function driveStatus(): Promise<DriveStatus> {
  if (testDrive) return { mode: "memory" };
  if (googleConfigured()) {
    const auth = await readAuth();
    return { mode: "google", connected: Boolean(auth), account: auth?.account };
  }
  return process.env.NODE_ENV === "production" ? { mode: "unconfigured" } : { mode: "memory" };
}

// ── 授權流程 ─────────────────────────────────────────────────
export function redirectUri(origin: string) { return `${origin}/api/moushikomi-drive`; }

/** 後台按「連結 Google Drive」：產生一次性驗證碼，回傳 Google 授權網址。 */
export async function beginAuth(origin: string): Promise<string> {
  if (!googleConfigured()) throw new DriveError("尚未設定 Google 用戶端（GOOGLE_DRIVE_CLIENT_ID／SECRET）。");
  const state = randomBytes(18).toString("base64url");
  await sharedLeadBackend().set(DRIVE_STATE + state, origin, { ex: 600 });
  const params = new URLSearchParams({
    client_id: clientId(), redirect_uri: redirectUri(origin), response_type: "code", scope: `${DRIVE_SCOPE} email`,
    access_type: "offline", prompt: "consent", include_granted_scopes: "true", state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

/** Google 授權完成後導回：用 code 換 refresh token，建立根資料夾並存起來。 */
export async function completeAuth(code: string, state: string): Promise<void> {
  const store = sharedLeadBackend();
  const origin = await store.get<string>(DRIVE_STATE + state);
  if (!origin) throw new DriveError("授權連結已過期，請回後台重新按一次「連結 Google Drive」。");
  await store.del(DRIVE_STATE + state);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: clientId(), client_secret: clientSecret(), redirect_uri: redirectUri(String(origin)), grant_type: "authorization_code" }),
    signal: AbortSignal.timeout(10_000),
  });
  const body: any = await response.json().catch(() => ({}));
  if (!response.ok || !body.refresh_token) throw new DriveError(`Google 沒有回傳授權（${body.error || response.status}），請重新連結一次。`);
  if (!String(body.scope || "").includes(DRIVE_SCOPE)) throw new DriveError("授權時沒有勾選 Google Drive 權限，請重新連結並勾選。");
  cachedToken = { value: body.access_token, expiresAt: Date.now() + Number(body.expires_in || 3000) * 1000 };
  const drive = new GoogleDrive(body.refresh_token);
  const previous = await readAuth();
  const root = previous?.rootFolderId ? { id: previous.rootFolderId } : await drive.createFolder(ROOT_FOLDER_NAME);
  let account: string | undefined;
  try {
    const payload = JSON.parse(Buffer.from(String(body.id_token || "").split(".")[1] || "", "base64url").toString("utf8"));
    account = typeof payload.email === "string" ? payload.email : undefined;
  } catch { /* 沒有 email 也不影響使用 */ }
  await store.set(DRIVE_AUTH_KEY, { refreshToken: body.refresh_token, rootFolderId: root.id, connectedAt: new Date().toISOString(), account } satisfies DriveAuth);
}
