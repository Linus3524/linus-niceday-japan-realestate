import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Camera, Check, Clock, FileUp, Loader2, Plus, X } from "lucide-react";
import { inputClass, LINE_URL } from "../findHome/FormFields";
import { prepareUpload, uploadName } from "../lib/moushikomi/compress";
import { AddressInput, DobInput } from "./AddressDobInputs";
import { PREVIEW_FILES, PREVIEW_PRESETS, PREVIEW_TOKEN } from "./preview";
import {
  DOC_TIMING_OPTIONS, MAX_FILE_BYTES, cleanForm, displayValue, docsFor, isBlank, stepsFor, validateStep,
  type DocDef, type FieldDef, type FieldErrors, type FormValues, type Option,
} from "../lib/moushikomi/schema";

/**
 * 租屋申請資料（/moushikomi#專屬隨機碼）。
 * 步驟：6 段資料 → 上傳文件（可選之後再給）→ 確認送出。文字草稿存在客人手機，檔案選了就直接上傳。
 */

type ServerFile = { docId: string; name: string; driveFileId: string; size: number };
type ServerState = {
  refCode: string; property: string; submitted: boolean; docTiming: string;
  docKeys: FormValues | null; docLater: Record<string, boolean>; files: ServerFile[];
};
type Draft = { values: FormValues; unknown: Record<string, boolean>; docLater: Record<string, boolean>; step: number };

const draftKey = (refCode: string) => `linus-moushikomi-draft:${refCode}`;
const readToken = () => window.location.hash.replace(/^#/, "").trim();

function loadDraft(refCode: string): Draft | null {
  try { const raw = localStorage.getItem(draftKey(refCode)); return raw ? (JSON.parse(raw) as Draft) : null; } catch { return null; }
}
function saveDraft(refCode: string, draft: Draft) {
  try { localStorage.setItem(draftKey(refCode), JSON.stringify(draft)); } catch { /* 無痕模式存不了草稿，照常填寫 */ }
}
function clearDraft(refCode: string) {
  try { localStorage.removeItem(draftKey(refCode)); } catch { /* ignore */ }
}

async function api(token: string, init: RequestInit = {}) {
  const response = await fetch("/api/moushikomi", { ...init, headers: { "x-apply-token": token, ...(init.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(body.error || `連線失敗（HTTP ${response.status}）`), { status: response.status, body });
  return body;
}

/** 欄位標題：每一格都標「必填」或「選填」（灰色小字），客人一眼看得出哪些可以空著。 */
function Field({ id, label, required, hint, error, children }: { id: string; label: string; required?: boolean; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div className="space-y-2" id={`field-${id}`} data-error={error ? "true" : undefined}>
      <p className="flex flex-wrap items-baseline gap-x-2 text-[14px] font-bold text-[#1A2A22]">
        {label}
        <span className={`border px-1 text-[11px] font-normal leading-[1.5] ${required ? "border-[#B7C0BB] text-[#66736C]" : "border-transparent text-[#8A9590]"}`}>{required ? "必填" : "選填"}</span>
      </p>
      {children}
      {hint && !error && <p className="text-[12px] leading-relaxed text-[#66736C]">{hint}</p>}
      {error && <p className="text-[12px] font-bold text-[#B42318]" role="alert">{error}</p>}
    </div>
  );
}

function Box({ on }: { on: boolean }) {
  return (
    <span className={`flex h-4 w-4 shrink-0 items-center justify-center border ${on ? "border-[#00A174] bg-[#00A174]" : "border-[#B7C0BB] bg-white"}`} aria-hidden="true">
      {on && <Check className="h-3 w-3 text-white" />}
    </span>
  );
}

/** 勾選框：隱藏的 input 放在 label 裡面（relative），點了畫面不會被拉到別處。 */
function CheckRow({ checked, onChange, children, id }: { checked: boolean; onChange: (next: boolean) => void; children: ReactNode; id: string }) {
  return (
    <label htmlFor={id} className="relative flex cursor-pointer items-start gap-2.5 py-1 text-[13px] leading-relaxed text-[#3F5147]">
      <input id={id} type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0" />
      <span className="mt-0.5 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-[#00A174]"><Box on={checked} /></span>
      <span>{children}</span>
    </label>
  );
}

function ChoiceChips({ options, value, onPick, stack, label }: { options: Option[]; value: string; onPick: (id: string) => void; stack?: boolean; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className={stack ? "grid gap-2" : "flex flex-wrap gap-2"}>
      {options.map(option => {
        const on = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onPick(option.id)}
            className={`min-h-11 border px-3.5 py-2 text-left text-[14px] ${on ? "border-[#00A174] bg-[#F0FAF6] font-bold text-[#1A2A22]" : "border-[#DDE3DF] bg-white text-[#3F5147]"}`}
          >
            {option.label}
            {option.note && <span className="block text-[12px] font-normal text-[#66736C]">{option.note}</span>}
          </button>
        );
      })}
    </div>
  );
}

function FieldInput({ field, values, unknown, error, onValue, onUnknown }: {
  field: FieldDef; values: FormValues; unknown: Record<string, boolean>; error?: string;
  onValue: (id: string, value: string) => void; onUnknown: (id: string, on: boolean) => void;
}) {
  const value = values[field.id] ?? "";
  if (field.type === "check") {
    return (
      <div id={`field-${field.id}`} className="space-y-1.5">
        <CheckRow id={`in-${field.id}`} checked={value === "1"} onChange={on => onValue(field.id, on ? "1" : "")}><b className="text-[14px] text-[#1A2A22]">{field.label}</b></CheckRow>
        {field.hint && <p className="text-[12px] leading-relaxed text-[#66736C]">{field.hint}</p>}
      </div>
    );
  }
  const unk = field.req === "unk" && Boolean(unknown[field.id]);
  let control: ReactNode;
  if (field.type === "dob") control = <DobInput id={field.id} value={value} onChange={v => onValue(field.id, v)} invalid={Boolean(error)} />;
  else if (field.type === "address") control = <AddressInput field={field} values={values} disabled={unk} onValue={onValue} invalid={Boolean(error)} />;
  else if (field.type === "chips") control = <ChoiceChips options={field.options || []} value={value} onPick={id => onValue(field.id, id)} stack={field.stack} label={field.label} />;
  else if (field.type === "textarea") control = (
    <textarea id={`in-${field.id}`} value={value} disabled={unk} rows={2} maxLength={300} placeholder={field.placeholder}
      onChange={e => onValue(field.id, e.target.value)}
      className="w-full border border-[#C9D2CD] bg-white px-3 py-2.5 text-[15px] placeholder:text-[#9AA59F] focus:border-[#00A174] focus:outline-none disabled:bg-[#F5F8F6] disabled:text-[#9AA59F]" />
  );
  else control = (
    <input id={`in-${field.id}`} value={value} disabled={unk} placeholder={field.placeholder} maxLength={field.max ?? 120}
      type={field.type === "date" ? "date" : field.type === "email" ? "email" : field.type === "tel" ? "tel" : "text"}
      inputMode={field.type === "tel" ? "tel" : field.type === "email" ? "email" : undefined}
      autoCapitalize={field.upper ? "characters" : undefined}
      onChange={e => onValue(field.id, field.upper ? e.target.value.toUpperCase() : e.target.value)}
      className={`${inputClass} disabled:bg-[#F5F8F6] disabled:text-[#9AA59F] ${error ? "border-[#B42318] bg-[#FEF3F2]" : ""}`} />
  );
  return (
    <Field id={field.id} label={field.label} required={field.req !== "opt"} hint={field.hint} error={error}>
      {control}
      {field.req === "unk" && (
        <CheckRow id={`unk-${field.id}`} checked={unk} onChange={on => onUnknown(field.id, on)}>{field.unkLabel || "不知道"}</CheckRow>
      )}
    </Field>
  );
}

function DocCard({ doc, files, later, uploading, error, onUpload, onRemove, onLater, readOnly, hideLater }: {
  doc: DocDef; files: ServerFile[]; later: boolean; uploading: number; error?: string; readOnly?: boolean; hideLater?: boolean;
  onUpload: (list: FileList) => void; onRemove: (file: ServerFile) => void; onLater: (on: boolean) => void;
}) {
  const inputId = `file-${doc.id}`;
  // 正反面的文件提醒兩面都要傳，避免客人傳了正面就以為沒地方傳背面。
  const twoSided = /正反面|與護照/.test(doc.label);
  const multiHint = twoSided ? "正面、背面各上傳一張。" : "";
  return (
    <div id={`field-doc:${doc.id}`} className={`border ${error ? "border-[#B42318]" : "border-[#DDE3DF]"} ${later ? "bg-[#F5F8F6]" : "bg-white"}`}>
      <div className="space-y-1 p-3">
        <p className="flex flex-wrap items-baseline gap-2 text-[14px] font-bold text-[#1A2A22]">
          {doc.label}
          <span className={`border px-1.5 text-[11px] ${doc.required ? "border-[#00A174] text-[#00A174]" : "border-[#B7C0BB] text-[#66736C]"}`}>{doc.required ? "必交" : "選交"}</span>
          {files.length > 0 && <span className="text-[11px] text-[#00A174]">已上傳 {files.length} 張</span>}
        </p>
        <DocHint doc={doc} />
        {!readOnly && multiHint && <p className="text-[12px] leading-relaxed text-[#3F5147]">{multiHint}</p>}
        {error && <p className="text-[12px] font-bold text-[#B42318]" role="alert">{error}</p>}
      </div>
      {files.length > 0 && (
        <ul className="grid gap-1.5 px-3 pb-2.5">
          {files.map((file, index) => (
            <li key={file.driveFileId} className="flex max-w-full items-center gap-2 border border-[#00A174] bg-[#F0FAF6] px-2 py-1 text-[12px]">
              <span className="font-jost font-bold text-[#00A174]">{index + 1}</span>
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              {!readOnly && <button type="button" onClick={() => onRemove(file)} aria-label={`移除 ${file.name}`} className="text-[#66736C] hover:text-[#B42318]"><X className="h-3.5 w-3.5" /></button>}
            </li>
          ))}
        </ul>
      )}
      {!readOnly && (
        <div className="flex border-t border-[#DDE3DF]">
          <label htmlFor={inputId} className={`relative flex flex-1 cursor-pointer items-center justify-center gap-1.5 py-2.5 text-[13px] font-bold text-[#00A174] ${hideLater ? "" : "border-r border-[#DDE3DF]"}`}>
            <input id={inputId} type="file" multiple accept="image/*,application/pdf" className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              onChange={e => { if (e.target.files?.length) onUpload(e.target.files); e.target.value = ""; }} />
            {uploading > 0 ? <><Loader2 className="h-4 w-4 animate-spin" />上傳中…</> : files.length ? <><Plus className="h-4 w-4" />再加一張</> : <><FileUp className="h-4 w-4" />拍照或選檔案（可多張）</>}
          </label>
          {!hideLater && <div className="flex flex-1 items-center justify-center px-2"><CheckRow id={`later-${doc.id}`} checked={later} onChange={onLater}>之後再補</CheckRow></div>}
        </div>
      )}
    </div>
  );
}

function Shell({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F5F8F6] font-sans text-[#1A2A22]">
      <header className="sticky top-0 z-10 border-b border-[#DDE3DF] bg-white" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="mx-auto flex h-12 max-w-[560px] items-center justify-between px-4">
          <img src="/logo-text.svg" alt="LINUS 住好日" width={144} height={22} className="h-auto w-36 shrink-0" />
          <a href={LINE_URL} target="_blank" rel="noopener noreferrer" className="text-[13px] font-bold text-[#00A174]">LINE 問 Linus</a>
        </div>
      </header>
      <main className={`mx-auto max-w-[560px] px-4 pt-5 ${footer ? "pb-32" : "pb-12"}`}>{children}</main>
      {footer && (
        <footer className="fixed inset-x-0 bottom-0 z-10 border-t border-[#DDE3DF] bg-white" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
          <div className="mx-auto flex max-w-[560px] gap-2 px-4 py-3">{footer}</div>
        </footer>
      )}
    </div>
  );
}

function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Shell>
      <div className="space-y-3 border border-[#DDE3DF] bg-white p-6">
        <h1 className="font-serif text-[20px] font-bold">{title}</h1>
        <div className="space-y-2 text-[14px] leading-relaxed text-[#3F5147]">{children}</div>
        <a href={LINE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center bg-[#00A174] px-4 text-[14px] font-bold text-white">用 LINE 聯絡 Linus</a>
      </div>
    </Shell>
  );
}

export function MoushikomiApp() {
  const [token] = useState(readToken);
  const [server, setServer] = useState<ServerState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [values, setValues] = useState<FormValues>({});
  const [unknown, setUnknown] = useState<Record<string, boolean>>({});
  const [docLater, setDocLater] = useState<Record<string, boolean>>({});
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [uploading, setUploading] = useState<Record<string, number>>({});
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [privacyAck, setPrivacyAck] = useState(false);
  const [shareConsent, setShareConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [docsNotice, setDocsNotice] = useState<string | null>(null);
  const restored = useRef(false);
  const preview = token === PREVIEW_TOKEN;
  const [presetId, setPresetId] = useState(PREVIEW_PRESETS[0].id);

  function applyPreset(id: string) {
    const preset = PREVIEW_PRESETS.find(item => item.id === id) || PREVIEW_PRESETS[0];
    setPresetId(preset.id);
    setValues({ ...preset.values, docTiming: "now" });
    setUnknown(preset.unknown || {});
    setDocLater({});
    setErrors({});
  }

  useEffect(() => {
    if (!token) { setLoadError("missing"); return; }
    if (token === PREVIEW_TOKEN) {
      // 預覽：不連伺服器，直接放假資料；草稿也不存。
      setServer({ refCode: "AP-DEMO", property: "", submitted: false, docTiming: "", docKeys: null, docLater: {}, files: PREVIEW_FILES });
      applyPreset(PREVIEW_PRESETS[0].id);
      return;
    }
    // 隨機碼不要留在瀏覽紀錄的網址列以外的地方：不送 referrer（見 HTML），也不帶進分析。
    api(token).then((state: ServerState) => {
      setServer(state);
      const draft = loadDraft(state.refCode);
      if (draft && !state.submitted) {
        setValues(draft.values || {}); setUnknown(draft.unknown || {}); setDocLater(draft.docLater || {}); setStep(Math.max(0, Math.min(draft.step || 0, 7)));
      } else if (state.property) setValues(prev => ({ ...prev, property: state.property }));
      restored.current = true;
    }).catch((error: any) => setLoadError(error.status === 404 ? "invalid" : error.message));
  }, [token]);

  useEffect(() => {
    if (server && restored.current && !server.submitted) saveDraft(server.refCode, { values, unknown, docLater, step });
  }, [server, values, unknown, docLater, step]);

  const steps = useMemo(() => stepsFor(values), [values]);
  const docs = useMemo(() => docsFor(server?.submitted && server.docKeys ? server.docKeys : values), [values, server]);
  const DOCS_STEP = steps.length;
  const CONFIRM_STEP = steps.length + 1;
  const total = steps.length + 2;
  const docTiming = server?.submitted ? server.docTiming : values.docTiming || "";

  const goTo = (next: number) => { setErrors({}); setStep(next); window.scrollTo({ top: 0 }); };
  const setValue = useCallback((id: string, value: string) => {
    setValues(prev => ({ ...prev, [id]: value }));
    // 填了就把那一格的紅字拿掉，不用等下一次按「下一步」。
    // 地址的子欄位（例如 AddressTown）填了，也把整格地址的紅字拿掉。
    const parent = id.replace(/(Region|Zip|Pref|City|Town|Bldg|Overseas)$/, "");
    if (value.trim()) setErrors(prev => {
      if (!prev[id] && !prev[parent]) return prev;
      const next = { ...prev }; delete next[id]; delete next[parent]; return next;
    });
  }, []);
  const setUnknownFlag = useCallback((id: string, on: boolean) => {
    setUnknown(prev => ({ ...prev, [id]: on }));
    if (on) { setValues(prev => { const next = { ...prev, [id]: "" }; for (const key of ["Zip", "Pref", "City", "Town", "Bldg", "Overseas"]) delete next[`${id}${key}`]; return next; }); setErrors(prev => { const next = { ...prev }; delete next[id]; return next; }); }
  }, []);

  const filesFor = (docId: string) => (server?.files || []).filter(file => file.docId === docId);

  async function upload(doc: DocDef, list: FileList) {
    if (!server) return;
    if (preview) {
      const added = Array.from(list).map((file, i) => ({ docId: doc.id, name: file.name, driveFileId: `preview-${Date.now()}-${i}`, size: file.size }));
      setServer({ ...server, files: [...server.files, ...added] });
      setDocLater(prev => { const next = { ...prev }; delete next[doc.id]; return next; });
      return;
    }
    setUploadError(null);
    setErrors(prev => { const next = { ...prev }; delete next[`doc:${doc.id}`]; return next; });
    setDocLater(prev => { const next = { ...prev }; delete next[doc.id]; return next; });
    for (const file of Array.from(list)) {
      setUploading(prev => ({ ...prev, [doc.id]: (prev[doc.id] || 0) + 1 }));
      try {
        const prepared = await prepareUpload(file);
        if (prepared.size > MAX_FILE_BYTES) throw new Error(`「${file.name}」太大（上限 4MB），請改用手機拍照，或用 LINE 傳給 Linus。`);
        const state: ServerState = await api(token, {
          method: "POST",
          headers: { "Content-Type": "application/octet-stream", "x-doc-id": doc.id, "x-file-name": encodeURIComponent(uploadName(file, prepared)) },
          body: prepared,
        });
        setServer(state);
      } catch (error: any) {
        setUploadError(error.message || "上傳失敗，請再試一次。");
      } finally {
        setUploading(prev => ({ ...prev, [doc.id]: Math.max(0, (prev[doc.id] || 1) - 1) }));
      }
    }
  }

  async function removeFile(file: ServerFile) {
    if (preview && server) { setServer({ ...server, files: server.files.filter(item => item.driveFileId !== file.driveFileId) }); return; }
    try {
      const state: ServerState = await api(token, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "remove-file", driveFileId: file.driveFileId }) });
      setServer(state);
    } catch (error: any) { setUploadError(error.message); }
  }

  function scrollToFirstError(found: FieldErrors) {
    const first = Object.keys(found)[0];
    requestAnimationFrame(() => {
      const el = document.getElementById(`field-${first}`);
      el?.scrollIntoView({ block: "center" });
      const input = el?.querySelector("input:not([type=checkbox]):not([type=file]),textarea") as HTMLElement | null;
      input?.focus({ preventScroll: true });
    });
  }

  function checkStep(index: number): FieldErrors {
    if (index < steps.length) return validateStep(steps[index], values, unknown);
    if (index === DOCS_STEP) {
      const found: FieldErrors = {};
      if (!values.docTiming) found.docTiming = "請選一個";
      else if (values.docTiming === "now") {
        for (const doc of docs) if (doc.required && !filesFor(doc.id).length && !docLater[doc.id]) found[`doc:${doc.id}`] = "請上傳，或勾「之後再補」";
      }
      return found;
    }
    const found: FieldErrors = {};
    if (!shareConsent || !privacyAck) found.consent = "兩個都要勾選才能送出";
    return found;
  }

  async function next() {
    const found = checkStep(step);
    if (Object.keys(found).length) { setErrors(found); scrollToFirstError(found); return; }
    if (step < CONFIRM_STEP) { goTo(step + 1); return; }
    // 送出前再整份檢查一次（例如中途切換身份，前面的步驟多出新的必填欄位）。
    for (let i = 0; i < steps.length; i++) {
      const stepErrors = validateStep(steps[i], values, unknown);
      if (Object.keys(stepErrors).length) { setStep(i); setErrors(stepErrors); scrollToFirstError(stepErrors); return; }
    }
    if (preview && server) {
      setServer({ ...server, submitted: true, docTiming: values.docTiming || "", docKeys: values });
      setJustSubmitted(true); window.scrollTo({ top: 0 }); return;
    }
    setSubmitting(true); setSubmitError(null);
    try {
      const form = cleanForm(values, unknown);
      const state: ServerState = await api(token, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit", values: form.values, unknown: form.unknown, docLater, privacyAck, shareConsent }),
      });
      clearDraft(state.refCode);
      setServer(state);
      setJustSubmitted(true);
      window.scrollTo({ top: 0 });
    } catch (error: any) {
      const fieldErrors: FieldErrors | undefined = error.body?.fieldErrors;
      if (fieldErrors && Object.keys(fieldErrors).length) {
        const index = steps.findIndex(s => s.fields.some(f => fieldErrors[f.id]));
        const target = index >= 0 ? index : Object.keys(fieldErrors).some(k => k.startsWith("doc") ) ? DOCS_STEP : CONFIRM_STEP;
        setStep(target); setErrors(fieldErrors); scrollToFirstError(fieldErrors);
      } else setSubmitError(error.message || "送出失敗，請再試一次。");
    } finally { setSubmitting(false); }
  }

  async function notifyDocsDone() {
    if (preview) { setDocsNotice("（預覽）實際使用時，這裡會寄信通知 Linus。"); return; }
    try {
      const state = await api(token, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "docs-done" }) });
      setServer(state);
      setDocsNotice(state.notified ? "已經通知 Linus，謝謝！" : "目前沒有新上傳的檔案。");
    } catch (error: any) { setDocsNotice(error.message); }
  }

  if (loadError === "missing") return <Notice title="這是專屬的申請連結">請打開 Linus 用 LINE 傳給你的完整連結（網址最後面有一串英數字）。</Notice>;
  if (loadError === "invalid") return <Notice title="這個連結已經失效">可能已經結案或超過保存期限。需要重新填寫的話，請向 Linus 索取新的連結。</Notice>;
  if (loadError) return <Notice title="暫時連不上">{loadError}<br />請稍後重新整理，或直接用 LINE 聯絡 Linus。</Notice>;
  if (!server) return <Shell><div className="flex items-center gap-2 py-16 text-[14px] text-[#66736C]"><Loader2 className="h-4 w-4 animate-spin" />載入中…</div></Shell>;

  const previewBar = preview ? (
    <PreviewBar presetId={presetId} onPreset={id => { applyPreset(id); if (server.submitted) setServer({ ...server, submitted: false }); }}
      steps={[...steps.map(s => s.title), "上傳文件", "確認並送出"]} step={server.submitted ? -1 : step}
      onStep={i => { setServer({ ...server, submitted: false }); goTo(i); }}
      onDone={() => { setServer({ ...server, submitted: true, docTiming: values.docTiming || "", docKeys: values }); setJustSubmitted(true); window.scrollTo({ top: 0 }); }} />
  ) : null;

  // ── 已送出：顯示參考碼；文件還沒給的，可以在這裡補傳 ──────────
  if (server.submitted) {
    const missing = docs.filter(doc => doc.required && !filesFor(doc.id).length);
    return (
      <Shell>
        {previewBar}
        <div className="space-y-5">
          <div className="space-y-2 border border-[#DDE3DF] bg-white p-5">
            <p className="text-[12px] font-bold tracking-[0.12em] text-[#00A174]">{justSubmitted ? "已收到你的申請資料" : "申請資料已送出"}</p>
            <p className="font-jost text-[28px] tracking-[0.08em]">{server.refCode}</p>
            <p className="text-[14px] leading-relaxed text-[#3F5147]">請把這組參考碼用 LINE 傳給 Linus，Linus 會照這份資料幫你送審。資料要修改的話，也請直接在 LINE 告訴 Linus。</p>
          </div>
          <div className="space-y-3">
            <h2 className="font-serif text-[18px] font-bold">{missing.length ? "文件準備好了就從這裡上傳" : "已上傳的文件"}</h2>
            <p className="text-[13px] leading-relaxed text-[#3F5147]">
              {missing.length ? `還有 ${missing.length} 份必交文件。之後隨時用同一個連結回來上傳，傳好按最下面的按鈕通知 Linus。` : "必交文件都齊了。要補其他檔案也可以在這裡上傳。"}
            </p>
            <UploadTips />
            {uploadError && <p className="text-[13px] font-bold text-[#B42318]" role="alert">{uploadError}</p>}
            {docs.map(doc => (
              <DocCard key={doc.id} doc={doc} files={filesFor(doc.id)} later={false} uploading={uploading[doc.id] || 0}
                onUpload={list => upload(doc, list)} onRemove={removeFile} onLater={() => undefined} hideLater />
            ))}
            <button type="button" onClick={notifyDocsDone} className="min-h-12 w-full bg-[#00A174] text-[15px] font-bold text-white">上傳好了，通知 Linus</button>
            {docsNotice && <p className="text-[13px] text-[#3F5147]" role="status">{docsNotice}</p>}
          </div>
        </div>
      </Shell>
    );
  }

  const current = step < steps.length ? steps[step] : null;
  const title = current ? current.title : step === DOCS_STEP ? "上傳文件" : "確認並送出";
  const footer = (
    <>
      {step > 0 && (
        <button type="button" onClick={() => goTo(step - 1)} className="flex min-h-12 items-center gap-1 border border-[#DDE3DF] px-4 text-[14px] text-[#3F5147]"><ArrowLeft className="h-4 w-4" />上一步</button>
      )}
      <button type="button" onClick={next} disabled={submitting} className="flex min-h-12 flex-1 items-center justify-center gap-2 bg-[#00A174] text-[15px] font-bold text-white disabled:opacity-60">
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}{step === CONFIRM_STEP ? "送出申請資料" : "下一步"}
      </button>
    </>
  );

  return (
    <Shell footer={footer}>
      {previewBar}
      {step === 0 && (
        <div className="mb-5 space-y-2">
          <h1 className="font-serif text-[22px] font-bold leading-snug">租屋申請資料</h1>
          <p className="text-[13px] leading-relaxed text-[#3F5147]">照順序一格一格填，大約 10 分鐘。填到一半關掉也沒關係，用同一個連結回來會接著填。</p>
        </div>
      )}
      <div className="mb-4 space-y-1.5" aria-label={`第 ${step + 1} 步，共 ${total} 步`}>
        <div className="flex gap-[3px]">{Array.from({ length: total }, (_, i) => <span key={i} className={`h-[3px] flex-1 ${i <= step ? "bg-[#00A174]" : "bg-[#DDE3DF]"}`} />)}</div>
        <div className="flex justify-between text-[12px] text-[#66736C]"><span>{title}</span><span className="font-jost">{step + 1} / {total}</span></div>
      </div>

      <div className="space-y-6 border border-[#DDE3DF] bg-white p-4 sm:p-5">
        <div className="space-y-1">
          <h2 className="font-serif text-[20px] font-bold">{title}</h2>
          {current?.intro && <p className="text-[13px] leading-relaxed text-[#3F5147]">{current.intro}</p>}
        </div>

        {current && (current.skip
          ? <p className="border-l-[3px] border-[#00A174] bg-[#F0FAF6] px-3 py-2.5 text-[13px]">{current.skip}</p>
          : current.fields.map(field => (
            <FieldInput key={field.id} field={field} values={values} unknown={unknown} error={errors[field.id]} onValue={setValue} onUnknown={setUnknownFlag} />
          )))}

        {step === DOCS_STEP && (
          <div className="space-y-4">
            <Field id="docTiming" label="文件什麼時候給 Linus？" required error={errors.docTiming}>
              <ChoiceChips options={DOC_TIMING_OPTIONS} value={values.docTiming || ""} stack label="文件什麼時候給 Linus" onPick={id => setValue("docTiming", id)} />
            </Field>
            {docTiming === "later" && (
              <>
                <p className="border-l-[3px] border-[#00A174] bg-[#F0FAF6] px-3 py-2.5 text-[13px] leading-relaxed">好的，文件先不用給。下面是要準備的清單；決定申請時，打開同一個連結就能回來上傳。</p>
                {docs.map(doc => (
                  <div key={doc.id} className="border border-[#DDE3DF] p-3">
                    <p className="flex flex-wrap items-baseline gap-2 text-[14px] font-bold">{doc.label}<span className={`border px-1.5 text-[11px] ${doc.required ? "border-[#00A174] text-[#00A174]" : "border-[#B7C0BB] text-[#66736C]"}`}>{doc.required ? "必交" : "選交"}</span></p>
                    <div className="mt-1"><DocHint doc={doc} /></div>
                  </div>
                ))}
              </>
            )}
            {docTiming === "now" && (
              <>
                <UploadTips showLater />
                {uploadError && <p className="text-[13px] font-bold text-[#B42318]" role="alert">{uploadError}</p>}
                {docs.map(doc => (
                  <DocCard key={doc.id} doc={doc} files={filesFor(doc.id)} later={Boolean(docLater[doc.id])} uploading={uploading[doc.id] || 0} error={errors[`doc:${doc.id}`]}
                    onUpload={list => upload(doc, list)} onRemove={removeFile}
                    onLater={on => { setDocLater(prev => ({ ...prev, [doc.id]: on })); if (on) setErrors(prev => { const n = { ...prev }; delete n[`doc:${doc.id}`]; return n; }); }} />
                ))}
              </>
            )}
          </div>
        )}

        {step === CONFIRM_STEP && (
          <Summary steps={steps} values={values} unknown={unknown} docs={docs} docTiming={docTiming} filesFor={filesFor} docLater={docLater} onEdit={goTo} docsStep={DOCS_STEP}>
            <div id="field-consent" className="space-y-2 border-t border-[#DDE3DF] pt-4">
              <CheckRow id="share-consent" checked={shareConsent} onChange={on => { setShareConsent(on); if (on && privacyAck) setErrors({}); }}>
                我同意 Linus 把以上資料和文件，提供給這間房子的房東、管理公司、租金保證公司與委託方不動產業者，用於入居審查與租約手續。
              </CheckRow>
              <CheckRow id="privacy-ack" checked={privacyAck} onChange={on => { setPrivacyAck(on); if (on && shareConsent) setErrors({}); }}>
                我已閱讀<a href="/#privacy" target="_blank" rel="noopener noreferrer" className="font-bold text-[#00A174] underline">隱私權政策</a>；緊急聯絡人與同居人的資料，我已經告知對方並取得同意。
              </CheckRow>
              {errors.consent && <p className="text-[12px] font-bold text-[#B42318]" role="alert">{errors.consent}</p>}
              {submitError && <p className="text-[13px] font-bold text-[#B42318]" role="alert">{submitError}</p>}
            </div>
          </Summary>
        )}
      </div>
    </Shell>
  );
}

function PreviewBar({ presetId, onPreset, steps, step, onStep, onDone }: {
  presetId: string; onPreset: (id: string) => void; steps: string[]; step: number; onStep: (i: number) => void; onDone: () => void;
}) {
  const chip = (on: boolean) => `border px-2 py-1 text-[12px] ${on ? "border-[#1A2A22] bg-[#1A2A22] text-white" : "border-[#DDE3DF] bg-white text-[#3F5147]"}`;
  return (
    <div className="mb-4 space-y-2 border border-dashed border-[#B7C0BB] bg-white p-3">
      <p className="text-[12px] font-bold text-[#8A5A00]">預覽模式：資料都是假的，不會送出。這個灰框客人看不到。</p>
      <div className="flex flex-wrap gap-1.5">{PREVIEW_PRESETS.map(p => <button key={p.id} type="button" onClick={() => onPreset(p.id)} className={chip(p.id === presetId)}>{p.label}</button>)}</div>
      <div className="flex flex-wrap gap-1.5">
        {steps.map((title, i) => <button key={i} type="button" onClick={() => onStep(i)} className={chip(i === step)}>{i + 1} {title}</button>)}
        <button type="button" onClick={onDone} className={chip(step === -1)}>送出後畫面</button>
      </div>
    </div>
  );
}

function DocHint({ doc }: { doc: DocDef }) {
  if (!doc.hint && !doc.points) return null;
  return (
    <div className="space-y-1 text-[12px] leading-relaxed text-[#66736C]">
      {doc.hint && <p>{doc.hint}</p>}
      {doc.points && (
        <ul className="space-y-0.5">
          {doc.points.map(point => <li key={point} className="flex gap-1.5"><span aria-hidden="true">・</span><span>{point}</span></li>)}
        </ul>
      )}
      {doc.footnote && <p>{doc.footnote}</p>}
    </div>
  );
}

/** 上傳前的提醒：一個區塊、條列；用網站提醒的黃色（同租屋指南、圖紙分析的提醒框）。 */
function UploadTips({ showLater }: { showLater?: boolean }) {
  return (
    <div className="border border-[#FDE047] bg-[#FEF9C3] px-3 py-2.5 text-[#854D0E]">
      <p className="mb-1.5 text-[13px] font-bold">上傳前注意</p>
      <ul className="space-y-1.5 text-[12.5px] leading-relaxed">
        <li className="flex gap-2"><Camera className="mt-[3px] h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span>四邊四角都要入鏡，不要有手指、不要反光。沒有掃描機，在光線充足的地方用手機拍就可以。</span></li>
        {showLater && <li className="flex gap-2"><Clock className="mt-[3px] h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span>缺一兩份沒關係，先勾「之後再補」送出；等資料齊了才申請，房子很容易被別人搶走。</span></li>}
      </ul>
    </div>
  );
}

function Summary({ steps, values, unknown, docs, docTiming, filesFor, docLater, onEdit, docsStep, children }: {
  steps: ReturnType<typeof stepsFor>; values: FormValues; unknown: Record<string, boolean>; docs: DocDef[]; docTiming: string;
  filesFor: (id: string) => ServerFile[]; docLater: Record<string, boolean>; onEdit: (step: number) => void; docsStep: number; children: ReactNode;
}) {
  const form = { values, unknown };
  return (
    <div className="space-y-3">
      <p className="text-[13px] text-[#3F5147]">送出前請再看一次，有錯可以按「修改」回去改。</p>
      {steps.map((step, index) => (
        <section key={step.id} className="border border-[#DDE3DF]">
          <h3 className="flex items-center justify-between bg-[#F5F8F6] px-3 py-2 text-[13px] font-bold">
            {step.title}<button type="button" onClick={() => onEdit(index)} className="text-[12px] font-bold text-[#00A174]">修改</button>
          </h3>
          <dl className="grid grid-cols-[8.5em_minmax(0,1fr)] gap-x-3 gap-y-1 px-3 py-2 text-[12.5px]">
            {step.skip ? <><dt className="text-[#66736C]">—</dt><dd>不用填</dd></> : step.fields.filter(f => f.type !== "check" || values[f.id]).map(f => {
              const empty = isBlank(f, values) && !(f.req === "unk" && unknown[f.id]);
              return (
                <div key={f.id} className="contents">
                  <dt className="text-[#66736C]">{f.type === "check" ? "備註" : f.label}</dt>
                  <dd className={`break-words ${(f.req === "unk" && unknown[f.id]) || (empty && f.req !== "opt") ? "text-[#B42318]" : ""}`}>
                    {f.type === "check" ? f.label : empty && f.req !== "opt" ? "未填" : displayValue(f, form)}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>
      ))}
      <section className="border border-[#DDE3DF]">
        <h3 className="flex items-center justify-between bg-[#F5F8F6] px-3 py-2 text-[13px] font-bold">文件<button type="button" onClick={() => onEdit(docsStep)} className="text-[12px] font-bold text-[#00A174]">修改</button></h3>
        <dl className="grid grid-cols-[8.5em_minmax(0,1fr)] gap-x-3 gap-y-1 px-3 py-2 text-[12.5px]">
          {docTiming === "later" ? <><dt className="text-[#66736C]">交件方式</dt><dd>先準備，之後再給</dd></> : docs.map(doc => {
            const count = filesFor(doc.id).length;
            return (
              <div key={doc.id} className="contents">
                <dt className="text-[#66736C]">{doc.label}</dt>
                <dd className={!count && (doc.required || docLater[doc.id]) ? "text-[#B42318]" : ""}>{count ? `${count} 個檔案` : docLater[doc.id] ? "之後再補" : doc.required ? "未上傳" : "—"}</dd>
              </div>
            );
          })}
        </dl>
      </section>
      {children}
    </div>
  );
}
