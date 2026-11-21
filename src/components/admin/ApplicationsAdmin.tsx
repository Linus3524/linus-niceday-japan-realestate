import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, Copy, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { copyToClipboard } from "../../lib/clipboard";
import { displayValue, docsFor, identitySummary, stepsFor, toJapaneseSheet, RETENTION_DAYS } from "../../lib/moushikomi/schema";
import type { Application, ApplicationSummary } from "../../lib/moushikomi/store";
import type { DriveStatus } from "../../lib/moushikomi/drive";

/**
 * 後台：租屋申請資料（#admin/apply、#admin/apply/{id}）。
 * 密碼和客戶需求同一組（sessionStorage 共用）。文件本身在 Google Drive，這裡只放文字資料與資料夾連結。
 */

const TOKEN_KEY = "linus-leads-admin-token";
const STATS_TOKEN_KEY = "linus-analytics-token";

const fmt = (iso?: string) => iso
  ? new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso))
  : "—";
const fmtDate = (iso: string) => new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Tokyo", year: "numeric", month: "numeric", day: "numeric" }).format(new Date(iso));
const applyLink = (token: string) => `${window.location.origin}/moushikomi#${token}`;

function readToken() {
  try { return sessionStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(STATS_TOKEN_KEY) || ""; } catch { return ""; }
}

function Btn({ children, onClick, disabled, primary, danger }: { children: ReactNode; onClick: () => void; disabled?: boolean; primary?: boolean; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className={`inline-flex min-h-10 items-center gap-1.5 px-3.5 text-[13px] font-bold disabled:opacity-40 ${primary ? "bg-[#1A2A22] text-white hover:bg-[#00A174]" : danger ? "border border-[#B42318] text-[#B42318] hover:bg-[#FEF3F2]" : "border border-[#DDE3DF] bg-white text-[#1A2A22] hover:border-[#00A174]"}`}>
      {children}
    </button>
  );
}

function CopyBtn({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return <Btn onClick={async () => { if (await copyToClipboard(text)) { setDone(true); setTimeout(() => setDone(false), 1800); } }}><Copy className="h-3.5 w-3.5" />{done ? "已複製" : label}</Btn>;
}

export function ApplicationsAdmin({ appId, notice, onOpen, onBackToList }: { appId: string | null; notice: string | null; onOpen: (id: string) => void; onBackToList: () => void }) {
  const [token, setToken] = useState(readToken);
  const [tokenInput, setTokenInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const call = useCallback(async (init: RequestInit & { query?: string } = {}) => {
    const response = await fetch(`/api/moushikomi${init.query || ""}`, { ...init, headers: { "Content-Type": "application/json", "x-admin-token": token } });
    if (response.status === 401) { try { sessionStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } setToken(""); throw new Error("密碼不正確。"); }
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(response.status === 503 && !body.error ? "伺服器還沒設定好，需要工程協助。" : body.error || `讀取失敗（HTTP ${response.status}）`);
    return body;
  }, [token]);

  if (!token) {
    const submit = () => { const value = tokenInput.trim(); if (!value) return; try { sessionStorage.setItem(TOKEN_KEY, value); } catch { /* ignore */ } setToken(value); };
    return (
      <div className="mx-auto max-w-md border border-[#DDE3DF] bg-white p-8">
        <h2 className="font-serif text-xl font-bold">申請資料</h2>
        <p className="mt-1.5 text-xs text-[#3F5147]">輸入後台密碼（和網站統計同一組）。這裡有客人的真實姓名與聯絡資料，請勿在別人的電腦上登入。</p>
        <input type="password" value={tokenInput} onChange={e => setTokenInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") submit(); }}
          placeholder="貼上後台密碼後按 Enter" aria-label="後台密碼"
          className="mt-5 h-11 w-full border border-[#C9D2CD] bg-[#FAFCFB] px-3.5 text-sm focus:border-[#00A174] focus:bg-white focus:outline-none" />
        <button type="button" disabled={!tokenInput.trim()} onClick={submit} className="mt-3 h-11 w-full bg-[#1A2A22] text-sm font-bold text-white hover:bg-[#00A174] disabled:opacity-40">驗證進入</button>
      </div>
    );
  }

  return appId
    ? <Detail id={appId} call={call} onBack={onBackToList} />
    : <List call={call} onOpen={onOpen} notice={notice} error={error} setError={setError} />;
}

type Call = (init?: RequestInit & { query?: string }) => Promise<any>;

function DriveBanner({ drive, call }: { drive: DriveStatus | null; call: Call }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  if (!drive) return null;
  if (drive.mode === "google" && drive.connected) return <p className="border border-[#DDE3DF] bg-white px-4 py-2.5 text-[13px] text-[#3F5147]">Google Drive 已連結{drive.account ? `（${drive.account}）` : ""}，文件會存進「LINUS 住好日｜租屋申請資料」資料夾。</p>;
  if (drive.mode === "memory") return <p className="border border-[#DDE3DF] bg-[#FFF8E6] px-4 py-2.5 text-[13px]">本機測試模式：文件存在記憶體，重開伺服器就消失，不會進你的 Google Drive。</p>;
  if (drive.mode === "unconfigured") return <p className="border border-[#B42318] bg-[#FEF3F2] px-4 py-2.5 text-[13px]">還沒設定 Google 用戶端，客人暫時不能上傳文件（仍可填資料、勾之後再補）。需要工程協助設定。</p>;
  return (
    <div className="flex flex-wrap items-center gap-3 border border-[#B42318] bg-[#FEF3F2] px-4 py-3 text-[13px]">
      <span className="flex-1">還沒連結 Google Drive，客人上傳的文件沒有地方存。請用你自己的 Google 帳號授權一次。</span>
      <Btn primary disabled={busy} onClick={async () => {
        setBusy(true); setErr(null);
        try { const { url } = await call({ method: "POST", body: JSON.stringify({ admin: "drive-auth" }) }); window.location.href = url; }
        catch (e: any) { setErr(e.message); setBusy(false); }
      }}>{busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}連結 Google Drive</Btn>
      {err && <p className="w-full font-bold text-[#B42318]">{err}</p>}
    </div>
  );
}

function List({ call, onOpen, notice, error, setError }: { call: Call; onOpen: (id: string) => void; notice: string | null; error: string | null; setError: (e: string | null) => void }) {
  const [items, setItems] = useState<ApplicationSummary[] | null>(null);
  const [drive, setDrive] = useState<DriveStatus | null>(null);
  const [notifyOk, setNotifyOk] = useState(true);
  const [label, setLabel] = useState("");
  const [property, setProperty] = useState("");
  const [created, setCreated] = useState<Application | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try { const body = await call({ query: "?admin=list" }); setItems(body.applications); setDrive(body.drive); setNotifyOk(body.notifyConfigured); }
    catch (e: any) { setError(e.message); }
  }, [call, setError]);
  useEffect(() => { load(); }, [load]);

  async function create() {
    if (!label.trim()) return;
    setBusy(true); setError(null);
    try {
      const body = await call({ method: "POST", body: JSON.stringify({ admin: "create", label, property }) });
      setCreated(body.application); setLabel(""); setProperty(""); load();
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }

  return (
    <div className="space-y-5">
      {notice && <p className="border border-[#00A174] bg-[#F0FAF6] px-4 py-2.5 text-[13px] font-bold" role="status">{notice}</p>}
      <DriveBanner drive={drive} call={call} />
      {!notifyOk && <p className="border border-[#DDE3DF] bg-[#FFF8E6] px-4 py-2.5 text-[13px]">通知信還沒設定（RESEND_API_KEY／LEADS_NOTIFY_TO），客人送出後不會寄信，只能在這裡看。</p>}

      <section className="space-y-3 border border-[#DDE3DF] bg-white p-5">
        <h2 className="font-serif text-lg font-bold">產生申請連結</h2>
        <p className="text-[12px] text-[#66736C]">每位客人一條連結，用 LINE 傳給他。連結只有拿到的人能打開；結案或滿 {RETENTION_DAYS} 天後自動失效並刪除資料。</p>
        <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr_auto]">
          <input value={label} onChange={e => setLabel(e.target.value)} maxLength={40} placeholder="客人稱呼（例：小明）" aria-label="客人稱呼"
            className="h-11 border border-[#C9D2CD] px-3 text-sm focus:border-[#00A174] focus:outline-none" />
          <input value={property} onChange={e => setProperty(e.target.value)} maxLength={300} placeholder="要申請的房子（選填，會帶進表單）" aria-label="要申請的房子"
            className="h-11 border border-[#C9D2CD] px-3 text-sm focus:border-[#00A174] focus:outline-none" />
          <Btn primary onClick={create} disabled={busy || !label.trim()}>{busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}產生連結</Btn>
        </div>
        {created && (
          <div className="space-y-2 border-t border-[#DDE3DF] pt-3">
            <p className="text-[13px]"><b>{created.refCode}</b>（{created.label}）的申請連結：</p>
            <p className="break-all border border-[#DDE3DF] bg-[#F5F8F6] px-3 py-2 font-mono text-[12px]">{applyLink(created.token)}</p>
            <CopyBtn text={applyLink(created.token)} label="複製連結" />
          </div>
        )}
      </section>

      {error && <p className="text-[13px] font-bold text-[#B42318]" role="alert">{error}</p>}
      <section className="border border-[#DDE3DF] bg-white">
        <div className="flex items-center justify-between border-b border-[#DDE3DF] px-4 py-3">
          <h2 className="font-serif text-lg font-bold">申請資料 {items ? `（${items.length}）` : ""}</h2>
          <button type="button" onClick={load} className="inline-flex items-center gap-1 text-[12px] text-[#66736C] hover:text-[#00A174]"><RefreshCw className="h-3.5 w-3.5" />重新整理</button>
        </div>
        {!items ? <p className="flex items-center gap-2 px-4 py-6 text-[13px] text-[#66736C]"><Loader2 className="h-4 w-4 animate-spin" />載入中…</p>
          : !items.length ? <p className="px-4 py-6 text-[13px] text-[#66736C]">還沒有申請資料。先在上面產生連結傳給客人。</p>
          : (
            <ul>
              {items.map(item => (
                <li key={item.id} className="border-b border-[#DDE3DF] last:border-b-0">
                  <button type="button" onClick={() => onOpen(item.id)} className="grid w-full grid-cols-[6.5em_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-left hover:bg-[#F5F8F6]">
                    <span className="font-jost text-[14px] font-bold">{item.refCode}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-bold">{item.label}{item.property ? <span className="font-normal text-[#66736C]">｜{item.property}</span> : null}</span>
                      <span className="block text-[12px] text-[#66736C]">建立 {fmt(item.createdAt)}・{item.submittedAt ? `送出 ${fmt(item.submittedAt)}・${item.fileCount} 個檔案` : "客人還沒送出"}{item.docTiming === "later" ? "・文件之後再給" : ""}</span>
                    </span>
                    <span className={`px-1.5 py-0.5 text-[11px] font-bold ${item.notifyFailed ? "bg-[#FEF3F2] text-[#B42318]" : item.submittedAt ? "bg-[#F0FAF6] text-[#00A174]" : "bg-[#F5F8F6] text-[#66736C]"}`}>
                      {item.notifyFailed ? "通知未寄出" : item.submittedAt ? "已送出" : "未填寫"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
      </section>
    </div>
  );
}

function Detail({ id, call, onBack }: { id: string; call: Call; onBack: () => void }) {
  const [app, setApp] = useState<Application | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    call({ query: `?admin=one&id=${encodeURIComponent(id)}` }).then(body => setApp(body.application)).catch((e: any) => setError(e.message));
  }, [call, id]);

  const back = <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-xs font-semibold text-[#3F5147] hover:text-[#00A174]"><ArrowLeft className="h-3.5 w-3.5" />回申請資料列表</button>;
  if (error) return <div className="space-y-3">{back}<p className="text-[13px] font-bold text-[#B42318]">{error}</p></div>;
  if (!app) return <div className="space-y-3">{back}<p className="flex items-center gap-2 text-[13px] text-[#66736C]"><Loader2 className="h-4 w-4 animate-spin" />載入中…</p></div>;

  const form = app.form;
  const docs = form ? docsFor(form.values) : [];
  const expiry = new Date(Date.parse(app.submittedAt || app.createdAt) + RETENTION_DAYS * 86_400_000).toISOString();

  async function close() {
    setBusy(true); setError(null);
    try { await call({ method: "POST", body: JSON.stringify({ admin: "close", id: app!.id, confirm }) }); onBack(); }
    catch (e: any) { setError(e.message); setBusy(false); }
  }
  async function resend() {
    setBusy(true); setError(null);
    try { const body = await call({ method: "POST", body: JSON.stringify({ admin: "resend", id: app!.id }) }); setApp(body.application); }
    catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }

  return (
    <div className="space-y-5">
      {back}
      <div className="space-y-3 border border-[#DDE3DF] bg-white p-5">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="font-jost text-2xl font-bold">{app.refCode}</h1>
          <span className="text-[15px] font-bold">{form?.values.NameEn || app.label}</span>
          <span className="text-[13px] text-[#66736C]">{form ? identitySummary(form.values) : "客人還沒送出"}</span>
        </div>
        <p className="text-[12px] text-[#66736C]">建立 {fmt(app.createdAt)}・{app.submittedAt ? `送出 ${fmt(app.submittedAt)}` : "未送出"}・資料保存到 {fmtDate(expiry)}（之後自動刪除）</p>
        <div className="flex flex-wrap gap-2">
          <CopyBtn text={applyLink(app.token)} label="複製客人的申請連結" />
          {form && <CopyBtn text={toJapaneseSheet(form, app.refCode)} label="複製日文申込書格式" />}
          {app.driveFolderUrl && <a href={app.driveFolderUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1.5 border border-[#DDE3DF] bg-white px-3.5 text-[13px] font-bold hover:border-[#00A174]"><ExternalLink className="h-3.5 w-3.5" />打開 Drive 資料夾</a>}
          {app.submittedAt && <Btn onClick={resend} disabled={busy}>重寄通知信</Btn>}
        </div>
        {app.notify?.status === "failed" && <p className="text-[12px] font-bold text-[#B42318]">通知信沒寄出：{app.notify.error}</p>}
        {error && <p className="text-[13px] font-bold text-[#B42318]" role="alert">{error}</p>}
      </div>

      <section className="border border-[#DDE3DF] bg-white">
        <h2 className="border-b border-[#DDE3DF] px-4 py-3 font-serif text-lg font-bold">文件</h2>
        <div className="px-4 py-3 text-[13px]">
          {!form ? <p className="text-[#66736C]">客人還沒送出；已上傳 {app.files.length} 個檔案。</p>
            : form.values.docTiming === "later" && !app.files.length ? <p>客人選擇「先準備，之後再給」，傳好時會收到通知信。</p>
            : (
              <dl className="grid grid-cols-[12em_minmax(0,1fr)] gap-x-3 gap-y-1.5">
                {docs.map(doc => {
                  const files = app.files.filter(file => file.docId === doc.id);
                  return (
                    <div key={doc.id} className="contents">
                      <dt className="text-[#66736C]">{doc.label}{doc.required ? "" : "（選交）"}</dt>
                      <dd className={!files.length && doc.required ? "font-bold text-[#B42318]" : ""}>
                        {files.length ? files.map(file => file.name).join("、") : app.docLater[doc.id] ? "之後再補" : doc.required ? "未上傳" : "—"}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            )}
        </div>
      </section>

      {form && stepsFor(form.values).map(step => (
        <section key={step.id} className="border border-[#DDE3DF] bg-white">
          <h2 className="border-b border-[#DDE3DF] px-4 py-3 font-serif text-lg font-bold">{step.title}</h2>
          <dl className="grid grid-cols-[12em_minmax(0,1fr)] gap-x-3 gap-y-1.5 px-4 py-3 text-[13px]">
            {step.skip ? <><dt className="text-[#66736C]">—</dt><dd>不用填</dd></> : step.fields.filter(f => f.type !== "check" || form.values[f.id]).map(f => (
              <div key={f.id} className="contents">
                <dt className="text-[#66736C]">{f.type === "check" ? "備註" : f.label}</dt>
                <dd className={`break-words ${f.req === "unk" && form.unknown[f.id] ? "font-bold text-[#8A5A00]" : ""}`}>{f.type === "check" ? f.label : displayValue(f, form)}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      <section className="space-y-3 border border-[#B42318] bg-white p-5">
        <h2 className="font-serif text-lg font-bold">結案並刪除</h2>
        <p className="text-[13px] text-[#3F5147]">入住、審查沒過或取消後按這裡：刪除這筆資料與 Google Drive 資料夾（含所有文件），客人的連結也會失效，無法復原。通知信請到信箱另外刪除。</p>
        <div className="flex flex-wrap gap-2">
          <input value={confirm} onChange={e => setConfirm(e.target.value.toUpperCase())} placeholder={`輸入 ${app.refCode} 確認`} aria-label="輸入參考碼確認刪除"
            className="h-10 w-44 border border-[#C9D2CD] px-3 font-jost text-sm focus:border-[#B42318] focus:outline-none" />
          <Btn danger onClick={close} disabled={busy || confirm !== app.refCode}>{busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}結案並刪除</Btn>
        </div>
      </section>

      {app.events.length > 0 && (
        <section className="border border-[#DDE3DF] bg-white px-4 py-3 text-[12px] text-[#66736C]">
          {app.events.map((event, i) => <p key={i}>{fmt(event.at)}　{event.text}</p>)}
        </section>
      )}
    </div>
  );
}
