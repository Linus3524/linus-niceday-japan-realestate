import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, Check, Copy, Download, RefreshCw, Search } from "lucide-react";
import {
  DECISION_FIELDS, FEASIBILITY_OPTIONS, LEAD_STATUSES, LEAD_TAGS, LEVEL_LABEL, REQUIREMENT_FIELDS, effectiveDims, tokyoToday,
  type Lead, type LeadSummary, type Level,
} from "../../lib/findHome/lead";
import {
  CONTACT_TIME_OPTIONS, LAYOUT_OPTIONS, LEAD_SOURCE_LABEL, MOVE_IN_OPTIONS, labelsOf, type Requirement,
} from "../../lib/findHome/schema";

/**
 * 後台：客戶需求（#admin/leads、#admin/leads/{id}）。
 * 密碼預設和網站統計同一組（伺服器端沒設 LEADS_ADMIN_TOKEN 時沿用 ANALYTICS_TOKEN），存在 sessionStorage，關分頁就忘。
 */

const TOKEN_KEY = "linus-leads-admin-token";
const STATS_TOKEN_KEY = "linus-analytics-token";
const STATUS_LABEL = Object.fromEntries(LEAD_STATUSES.map(item => [item.id, item.label])) as Record<string, string>;
const FEAS_LABEL = Object.fromEntries(FEASIBILITY_OPTIONS.map(item => [item.id, item.label])) as Record<string, string>;
const CHANNEL_NAME: Record<string, string> = { line: "LINE", wechat: "WeChat", email: "Email", whatsapp: "WhatsApp" };
const DIM_NAMES = { urgency: "急迫", readiness: "準備", flexibility: "彈性" } as const;

const STATUS_STYLE: Record<string, string> = {
  new: "bg-[#E8F0FA] text-[#1D5FA8]",
  "to-contact": "bg-[#E8F0FA] text-[#1D5FA8]",
  clarifying: "bg-[#F0FAF6] text-[#00A174]",
  active: "bg-[#F0FAF6] text-[#00A174]",
  waiting: "bg-[#FEF9C3] text-[#854D0E]",
  applying: "bg-[#00A174] text-white",
  won: "bg-[#1A2A22] text-white",
  closed: "bg-[#EEF2F0] text-[#66736C]",
  unreachable: "bg-[#FDECEA] text-[#B42318]",
  paused: "bg-[#EEF2F0] text-[#66736C]",
};

type Filter = "all" | "new" | "follow-up" | "overseas" | "contact" | "notify";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "new", label: "新進" },
  { id: "follow-up", label: "今天要追蹤" },
  { id: "contact", label: "還沒聯絡上" },
  { id: "overseas", label: "海外" },
  { id: "notify", label: "通知未寄出" },
];

const fmtTime = (iso?: string) => {
  if (!iso) return "—";
  const date = new Date(iso);
  return new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
};

class ApiError extends Error { constructor(message: string, public status: number) { super(message); } }

function useApi(token: string, onUnauthorized: () => void) {
  return useCallback(async (path: string, init: RequestInit = {}) => {
    const response = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", "x-admin-token": token, ...(init.headers || {}) },
    });
    if (response.status === 401) { onUnauthorized(); throw new ApiError("密碼不正確。", 401); }
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = response.status === 503 ? "伺服器還沒設定好客戶資料庫或後台密碼，需要工程協助。" : body.error || `讀取失敗（HTTP ${response.status}）。`;
      throw new ApiError(message, response.status);
    }
    return body;
  }, [token, onUnauthorized]);
}

function Pill({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center px-1.5 py-0.5 text-[11px] font-bold ${className}`}>{children}</span>;
}

function DimBadges({ dims }: { dims: Record<"urgency" | "readiness" | "flexibility", Level> }) {
  return (
    <div className="flex flex-wrap gap-1">
      {(Object.keys(DIM_NAMES) as (keyof typeof DIM_NAMES)[]).map(key => (
        <span key={key} className={`border px-1.5 text-[11px] ${dims[key] === "high" ? "border-[#00A174] text-[#00A174]" : "border-[#DDE3DF] text-[#3F5147]"}`}>
          {DIM_NAMES[key]} {LEVEL_LABEL[dims[key]]}
        </span>
      ))}
    </div>
  );
}

export function LeadsAdmin({ leadId, onOpen, onBackToList }: { leadId: string | null; onOpen: (id: string) => void; onBackToList: () => void }) {
  // 和網站統計共用同一組密碼時，統計那邊登入過就不用再輸入一次。
  const [token, setToken] = useState(() => {
    try { return sessionStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(STATS_TOKEN_KEY) || ""; } catch { return ""; }
  });
  const [tokenInput, setTokenInput] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const logout = useCallback(() => {
    try { sessionStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
    setToken("");
  }, []);
  const onUnauthorized = useCallback(() => { setAuthError("密碼不正確。"); logout(); }, [logout]);
  const api = useApi(token, onUnauthorized);

  if (!token) {
    const submit = () => {
      const value = tokenInput.trim();
      if (!value) return;
      try { sessionStorage.setItem(TOKEN_KEY, value); } catch { /* ignore */ }
      setAuthError(null);
      setToken(value);
    };
    return (
      <div className="mx-auto max-w-md border border-[#DDE3DF] bg-white p-8">
        <h2 className="font-serif text-xl font-bold">客戶需求</h2>
        <p className="mt-1.5 text-xs text-[#3F5147]">輸入後台密碼（和網站統計同一組）。這裡看得到客人的聯絡方式，請勿在別人的電腦上登入。</p>
        <input
          type="password"
          value={tokenInput}
          onChange={e => setTokenInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") submit(); }}
          placeholder="貼上後台密碼後按 Enter"
          className="mt-5 h-11 w-full border border-[#C9D2CD] bg-[#FAFCFB] px-3.5 text-sm focus:border-[#00A174] focus:bg-white focus:outline-none"
          aria-label="客戶需求後台密碼"
        />
        {authError && <p className="mt-2 text-xs font-bold text-[#B42318]">{authError}</p>}
        <button type="button" disabled={!tokenInput.trim()} onClick={submit} className="mt-3 h-11 w-full bg-[#1A2A22] text-sm font-bold text-white hover:bg-[#00A174] disabled:opacity-40">驗證進入</button>
      </div>
    );
  }

  return leadId
    ? <LeadDetail key={leadId} id={leadId} api={api} onBack={onBackToList} />
    : <LeadList api={api} onOpen={onOpen} onLogout={logout} />;
}

type Api = ReturnType<typeof useApi>;

function LeadList({ api, onOpen, onLogout }: { api: Api; onOpen: (id: string) => void; onLogout: () => void }) {
  const [leads, setLeads] = useState<LeadSummary[] | null>(null);
  const [notifyConfigured, setNotifyConfigured] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const body = await api("/api/leads");
      setLeads(body.leads);
      setNotifyConfigured(body.notifyConfigured);
    } catch (err: any) {
      if (err?.status !== 401) setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [api]);
  useEffect(() => { load(); }, [load]);

  const today = tokyoToday();
  const counts = useMemo(() => {
    const list = leads ?? [];
    return {
      all: list.length,
      new: list.filter(lead => lead.status === "new").length,
      "follow-up": list.filter(lead => lead.nextFollowUpAt && lead.nextFollowUpAt <= today).length,
      contact: list.filter(lead => lead.hasContact).length,
      overseas: list.filter(lead => lead.residence === "overseas").length,
      notify: list.filter(lead => lead.notifyStatus === "failed" || lead.notifyStatus === "pending").length,
    } as Record<Filter, number>;
  }, [leads, today]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (leads ?? []).filter(lead => {
      if (filter === "new" && lead.status !== "new") return false;
      if (filter === "follow-up" && !(lead.nextFollowUpAt && lead.nextFollowUpAt <= today)) return false;
      if (filter === "contact" && !lead.hasContact) return false;
      if (filter === "overseas" && lead.residence !== "overseas") return false;
      if (filter === "notify" && !(lead.notifyStatus === "failed" || lead.notifyStatus === "pending")) return false;
      if (!q) return true;
      return [lead.refCode, lead.nickname, lead.areas].some(text => text.toLowerCase().includes(q));
    });
  }, [leads, filter, query, today]);

  const exportCsv = async () => {
    try {
      const token = sessionStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(STATS_TOKEN_KEY) || "";
      const response = await fetch("/api/leads?export=csv", { headers: { "x-admin-token": token } });
      if (!response.ok) throw new Error(`匯出失敗（HTTP ${response.status}）`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `find-home-leads-${today}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex h-10 min-w-0 flex-1 items-center gap-2 border border-[#C9D2CD] bg-white px-3 focus-within:border-[#00A174]">
          <Search className="h-4 w-4 shrink-0 text-[#8A9590]" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="搜尋參考碼、稱呼、地區" className="h-full min-w-0 flex-1 bg-transparent text-sm focus:outline-none" aria-label="搜尋客戶需求" />
        </label>
        <button type="button" onClick={load} disabled={loading} className="flex h-10 items-center gap-1.5 border border-[#C9D2CD] bg-white px-3 text-xs font-semibold hover:border-[#00A174] disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />重新整理
        </button>
        <button type="button" onClick={exportCsv} className="flex h-10 items-center gap-1.5 border border-[#C9D2CD] bg-white px-3 text-xs font-semibold hover:border-[#00A174]" title="匯出 CSV（不含聯絡方式）">
          <Download className="h-3.5 w-3.5" />匯出
        </button>
        <button type="button" onClick={onLogout} className="h-10 border border-[#DDE3DF] bg-white px-3 text-xs text-[#66736C] hover:text-[#B42318]">登出</button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map(item => (
          <button
            key={item.id}
            type="button"
            aria-pressed={filter === item.id}
            onClick={() => setFilter(item.id)}
            className={`min-h-9 border px-3 text-xs ${filter === item.id ? "border-[#00A174] bg-[#F0FAF6] font-bold text-[#00A174]" : "border-[#DDE3DF] bg-white text-[#3F5147]"}`}
          >
            {item.label} <span className="font-jost">{counts[item.id]}</span>
          </button>
        ))}
      </div>

      {!notifyConfigured && (
        <p className="border border-[#FDE047] bg-[#FEF9C3] p-3 text-xs text-[#854D0E]">通知信還沒設定（RESEND_API_KEY／LEADS_NOTIFY_TO），新客人不會寄信通知，請先到這裡查看。</p>
      )}
      {error && <p className="border border-[#FDE047] bg-[#FEF9C3] p-3 text-xs text-[#854D0E]">{error}</p>}
      {leads && visible.length === 0 && (
        <p className="border border-[#DDE3DF] bg-white p-6 text-center text-sm text-[#66736C]">
          {leads.length === 0 ? "還沒有人填問卷。分享 linusniceday.com/find-home?from=line 給客人，填完就會出現在這裡。" : "沒有符合條件的客人。"}
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {visible.map(lead => (
          <button key={lead.id} type="button" onClick={() => onOpen(lead.id)} className="space-y-2 border border-[#DDE3DF] bg-white p-4 text-left hover:border-[#00A174]">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 text-[15px]"><b className="font-jost tracking-wider">{lead.refCode}</b>　{lead.nickname}</p>
              <Pill className={STATUS_STYLE[lead.status]}>{STATUS_LABEL[lead.status]}</Pill>
            </div>
            <p className="text-[13px] leading-relaxed text-[#3F5147]">
              {lead.moveIn}・{lead.residence === "overseas" ? `海外${lead.entryDate ? ` ${lead.entryDate.slice(5).replace("-", "/")} 入境` : ""}` : "日本"}・{lead.areas}・{lead.layouts}・<span className="font-jost">≤{lead.rentMaxMan} 萬</span>
            </p>
            <div className="flex flex-wrap items-center gap-1">
              <DimBadges dims={lead.dims} />
              <span className="border border-[#DDE3DF] px-1.5 text-[11px] text-[#3F5147]">可行性 {FEAS_LABEL[lead.feasibility]}</span>
              {lead.tags.map(tag => <span key={tag} className="bg-[#1A2A22] px-1.5 text-[11px] font-bold text-white">{tag}</span>)}
            </div>
            <p className="flex flex-wrap gap-x-3 text-[12px] text-[#66736C]">
              <span>來源 {LEAD_SOURCE_LABEL[lead.source]}</span>
              <span>{fmtTime(lead.createdAt)}</span>
              {lead.nextFollowUpAt && <span className={lead.nextFollowUpAt <= today ? "font-bold text-[#B42318]" : ""}>追蹤 {lead.nextFollowUpAt.slice(5).replace("-", "/")}</span>}
              {lead.hasContact ? <span>聯絡方式保留中（{CHANNEL_NAME[lead.contactChannel || ""]}）</span> : <span>聯絡方式已刪除</span>}
              {(lead.notifyStatus === "failed" || lead.notifyStatus === "pending") && <span className="font-bold text-[#B42318]">通知未寄出</span>}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="space-y-3 border border-[#DDE3DF] bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[14px] font-bold">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

function LeadDetail({ id, api, onBack }: { id: string; api: Api; onBack: () => void }) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [notesDraft, setNotesDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [deleteCode, setDeleteCode] = useState("");
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const body = await api(`/api/leads?id=${id}`);
      setLead(body.lead);
      setNotesDraft(body.lead.admin.notes || "");
    } catch (err: any) {
      if (err?.status !== 401) setError(err.message);
    }
  }, [api, id]);
  useEffect(() => { load(); }, [load]);

  const run = async (action: () => Promise<any>, success?: string) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const body = await action();
      if (body?.lead) { setLead(body.lead); setNotesDraft(body.lead.admin.notes || ""); }
      if (success) setNotice(success);
      return body;
    } catch (err: any) {
      if (err?.status === 409) { setError(err.message); await load(); }
      else if (err?.status !== 401) setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const patch = (changes: Record<string, unknown>, success = "已儲存") =>
    lead && run(() => api("/api/leads", { method: "PATCH", body: JSON.stringify({ id, ver: lead.ver, patch: changes }) }), success);
  const post = (payload: Record<string, unknown>, success?: string) =>
    run(() => api("/api/leads", { method: "POST", body: JSON.stringify({ id, ...payload }) }), success);

  if (error && !lead) return <div className="space-y-3"><BackLink onBack={onBack} /><p className="border border-[#FDE047] bg-[#FEF9C3] p-3 text-xs text-[#854D0E]">{error}</p></div>;
  if (!lead) return <div className="space-y-3"><BackLink onBack={onBack} /><p className="text-sm text-[#66736C]">讀取中…</p></div>;

  const dims = effectiveDims(lead);
  const req = lead.requirement;

  return (
    <div className="space-y-4">
      <BackLink onBack={onBack} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-jost text-[13px] tracking-wider text-[#66736C]">{lead.refCode}・{LEAD_SOURCE_LABEL[lead.source]}・{fmtTime(lead.createdAt)}</p>
          <h2 className="font-serif text-2xl font-bold">{lead.nickname}</h2>
        </div>
        <label className="flex items-center gap-2 text-xs font-bold">
          狀態
          <select
            value={lead.admin.status}
            disabled={busy}
            onChange={e => patch({ status: e.target.value }, "狀態已更新")}
            className="h-10 border border-[#C9D2CD] bg-white px-2 text-sm focus:border-[#00A174] focus:outline-none"
          >
            {LEAD_STATUSES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
      </div>

      {error && <p className="border border-[#FDE047] bg-[#FEF9C3] p-3 text-xs text-[#854D0E]" role="alert">{error}</p>}
      {notice && <p className="border border-[#9EE2CF] bg-[#F0FAF6] p-3 text-xs text-[#00A174]" role="status">{notice}</p>}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="space-y-4">
          <Section title="聯絡方式">
            {lead.contact ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 border border-[#DDE3DF] px-3 py-2">
                  <span className="min-w-0 break-all text-sm"><span className="text-[#66736C]">{CHANNEL_NAME[lead.contact.channel]}</span>　<b className="font-jost">{lead.contact.value}</b></span>
                  <button
                    type="button"
                    onClick={async () => { try { await navigator.clipboard.writeText(lead.contact!.value); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ } }}
                    className="flex shrink-0 items-center gap-1 text-xs font-bold text-[#3F5147] hover:text-[#00A174]"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied ? "已複製" : "複製"}
                  </button>
                </div>
                <p className="text-xs text-[#66736C]">方便時間：{labelsOf(CONTACT_TIME_OPTIONS, lead.contactTimes)}</p>
                {!confirmRemove ? (
                  <button type="button" disabled={busy} onClick={() => setConfirmRemove(true)} className="min-h-11 w-full bg-[#00A174] text-sm font-bold text-white hover:bg-[#008F67] disabled:opacity-50">已聯絡上，刪除聯絡方式</button>
                ) : (
                  <div className="space-y-2 border border-[#00A174] p-3">
                    <p className="text-xs text-[#1A2A22]">刪除後無法復原，網站上就不會再有這位客人的聯絡方式。確定已經在 LINE 等管道聯絡上了嗎？</p>
                    <div className="flex gap-2">
                      <button type="button" disabled={busy} onClick={async () => { await post({ action: "remove-contact", ver: lead.ver }, "聯絡方式已刪除"); setConfirmRemove(false); }} className="min-h-10 flex-1 bg-[#00A174] text-sm font-bold text-white disabled:opacity-50">確定刪除</button>
                      <button type="button" onClick={() => setConfirmRemove(false)} className="min-h-10 border border-[#DDE3DF] px-4 text-sm">取消</button>
                    </div>
                  </div>
                )}
                <p className="text-[11px] text-[#66736C]">沒聯絡上的話，送出滿 30 天會自動刪除。</p>
              </div>
            ) : (
              <p className="text-sm text-[#66736C]">已於 {fmtTime(lead.contactRemovedAt)} 刪除（{lead.contactRemovedReason === "expired" ? "滿 30 天自動刪除" : "已聯絡上"}）。之後請用參考碼在 LINE 對話裡找這位客人。</p>
            )}
          </Section>

          <Section title="判斷與追蹤">
            <div className="space-y-2">
              <p className="text-xs font-bold">市場可行性（只能人工判斷）</p>
              <div className="flex flex-wrap gap-1.5">
                {FEASIBILITY_OPTIONS.map(item => (
                  <button key={item.id} type="button" disabled={busy} aria-pressed={lead.admin.feasibility === item.id} onClick={() => patch({ feasibility: item.id })}
                    className={`min-h-9 border px-3 text-xs ${lead.admin.feasibility === item.id ? "border-[#00A174] bg-[#F0FAF6] font-bold text-[#00A174]" : "border-[#DDE3DF] text-[#3F5147]"}`}>{item.label}</button>
                ))}
              </div>
            </div>
            <label className="flex items-center justify-between gap-2 text-xs font-bold">
              下次追蹤
              <span className="flex items-center gap-2">
                <input type="date" value={lead.admin.nextFollowUpAt || ""} disabled={busy} onChange={e => patch({ nextFollowUpAt: e.target.value || null }, "追蹤日已更新")} className="h-10 border border-[#C9D2CD] bg-white px-2 text-sm font-normal" />
                {lead.admin.nextFollowUpAt && <button type="button" onClick={() => patch({ nextFollowUpAt: null }, "已清除追蹤日")} className="text-[11px] font-normal text-[#66736C] underline">清除</button>}
              </span>
            </label>
            <div className="space-y-2">
              <p className="text-xs font-bold">系統建議（可以改）</p>
              {(Object.keys(DIM_NAMES) as (keyof typeof DIM_NAMES)[]).map(key => (
                <div key={key} className="flex items-center justify-between gap-2 text-xs">
                  <span>{DIM_NAMES[key]}</span>
                  <div className="flex">
                    {(["high", "mid", "low"] as Level[]).map((level, index) => {
                      const on = dims[key] === level;
                      const isOverride = lead.admin.dimsOverride?.[key] === level;
                      return (
                        <button key={level} type="button" disabled={busy} aria-pressed={on}
                          onClick={() => patch({ dimsOverride: { [key]: level === lead.dims[key] ? null : level } })}
                          className={`min-h-8 w-10 border text-xs ${index ? "-ml-px" : ""} ${on ? "border-[#00A174] bg-[#F0FAF6] font-bold text-[#00A174]" : "border-[#DDE3DF] text-[#3F5147]"}`}
                          title={isOverride ? "你手動設定的" : undefined}>
                          {LEVEL_LABEL[level]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <ul className="list-disc space-y-0.5 pl-4 text-[11px] text-[#66736C]">
                {lead.dims.reasons.map(reason => <li key={reason}>{reason}</li>)}
              </ul>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold">標籤</p>
              <div className="flex flex-wrap gap-1.5">
                {LEAD_TAGS.map(tag => {
                  const on = lead.admin.tags.includes(tag.id);
                  return (
                    <button key={tag.id} type="button" disabled={busy} aria-pressed={on}
                      onClick={() => patch({ tags: on ? lead.admin.tags.filter(item => item !== tag.id) : [...lead.admin.tags, tag.id] })}
                      className={`min-h-9 border px-3 text-xs ${on ? "border-[#1A2A22] bg-[#1A2A22] font-bold text-white" : "border-[#DDE3DF] text-[#3F5147]"}`}>{tag.label}</button>
                  );
                })}
              </div>
            </div>
          </Section>

          <Section title="內部備註">
            <textarea value={notesDraft} onChange={e => setNotesDraft(e.target.value)} rows={4} className="w-full border border-[#C9D2CD] p-2.5 text-sm focus:border-[#00A174] focus:outline-none" placeholder="只有你看得到" aria-label="內部備註" />
            <button type="button" disabled={busy || notesDraft === (lead.admin.notes || "")} onClick={() => patch({ notes: notesDraft }, "備註已儲存")} className="min-h-10 border border-[#00A174] px-4 text-sm font-bold text-[#00A174] disabled:opacity-40">儲存備註</button>
          </Section>
        </div>

        <div className="space-y-4">
          <Section title="找房需求" aside={!editing && <button type="button" onClick={() => setEditing(true)} className="text-xs font-bold text-[#00A174]">修改需求</button>}>
            {editing ? (
              <RequirementEditor
                requirement={req}
                busy={busy}
                onCancel={() => setEditing(false)}
                onSave={async next => { const body = await patch({ requirement: next }, "需求已更新，已記錄變更"); if (body) setEditing(false); }}
              />
            ) : (
              <dl className="divide-y divide-[#ECEFEC] text-[13px]">
                {[...REQUIREMENT_FIELDS.map(field => [field.label, field.format(req)]), ...DECISION_FIELDS.map(field => [field.label, field.format(lead.decision)])].map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[7.5em_minmax(0,1fr)] gap-2 py-1.5">
                    <dt className="text-[#66736C]">{label}</dt>
                    <dd className="whitespace-pre-wrap break-words">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </Section>

          <Section title="變更紀錄">
            {lead.revisions.length === 0 ? <p className="text-xs text-[#66736C]">需求還沒有改過。</p> : (
              <ul className="space-y-3">
                {lead.revisions.map(revision => (
                  <li key={revision.at} className="space-y-1 border-l-2 border-[#00A174] pl-3">
                    <p className="text-[11px] text-[#66736C]">{fmtTime(revision.at)}・{revision.by === "client" ? "客人重新填寫" : "你在後台修改"}</p>
                    {revision.changes.map(change => (
                      <p key={change.field} className="text-[13px]">{change.label}　<s className="text-[#8A9590]">{change.before}</s> → <b>{change.after}</b></p>
                    ))}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="聯絡紀錄">
            <div className="flex gap-2">
              <input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="例：11/11 LINE 已加好友，約週六看房" className="h-10 min-w-0 flex-1 border border-[#C9D2CD] px-2.5 text-sm focus:border-[#00A174] focus:outline-none" aria-label="新增聯絡紀錄" />
              <button type="button" disabled={busy || !noteText.trim()} onClick={async () => { const body = await post({ action: "note", text: noteText }); if (body) setNoteText(""); }} className="h-10 bg-[#1A2A22] px-4 text-sm font-bold text-white disabled:opacity-40">新增</button>
            </div>
            <ul className="space-y-1.5 text-[13px]">
              {lead.events.map((event, index) => (
                <li key={`${event.at}-${index}`} className="grid grid-cols-[6.5em_minmax(0,1fr)] gap-2">
                  <span className="text-[11px] text-[#66736C]">{fmtTime(event.at)}</span>
                  <span className="break-words">{event.text}</span>
                </li>
              ))}
              <li className="grid grid-cols-[6.5em_minmax(0,1fr)] gap-2">
                <span className="text-[11px] text-[#66736C]">{fmtTime(lead.createdAt)}</span>
                <span>客人送出問卷（同意隱私權政策 {lead.consents[lead.consents.length - 1]?.policyVersion}）</span>
              </li>
            </ul>
          </Section>

          <Section title="通知與刪除">
            <p className="text-xs text-[#3F5147]">
              通知信：{lead.notify.status === "sent" ? `已寄出（${fmtTime(lead.notify.at)}）` : lead.notify.status === "failed" ? `寄送失敗：${lead.notify.error || ""}` : "尚未寄出"}
            </p>
            {lead.notify.status !== "sent" && (
              <button type="button" disabled={busy} onClick={() => post({ action: "resend-notify" }, "通知信已重寄")} className="min-h-10 border border-[#00A174] px-4 text-sm font-bold text-[#00A174] disabled:opacity-40">重寄通知信</button>
            )}
            <div className="space-y-2 border-t border-[#ECEFEC] pt-3">
              <p className="text-xs text-[#66736C]">客人要求刪除全部資料時使用。輸入參考碼 <b className="font-jost">{lead.refCode}</b> 後才能刪除，無法復原。</p>
              <div className="flex gap-2">
                <input value={deleteCode} onChange={e => setDeleteCode(e.target.value.toUpperCase())} placeholder={lead.refCode} className="h-10 w-32 border border-[#C9D2CD] px-2.5 font-jost text-sm" aria-label="輸入參考碼確認刪除" />
                <button type="button" disabled={busy || deleteCode !== lead.refCode}
                  onClick={async () => { const body = await post({ action: "delete", confirm: deleteCode }); if (body?.deleted) onBack(); }}
                  className="h-10 border border-[#B42318] px-4 text-sm font-bold text-[#B42318] disabled:opacity-30">刪除整筆資料</button>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function BackLink({ onBack }: { onBack: () => void }) {
  return <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-xs font-semibold text-[#3F5147] hover:text-[#00A174]"><ArrowLeft className="h-3.5 w-3.5" />回到客戶列表</button>;
}

/** 後台修改需求：只開放最常變動的欄位，其他欄位沿用客人填的內容。 */
function RequirementEditor({ requirement, busy, onSave, onCancel }: { requirement: Requirement; busy: boolean; onSave: (next: Requirement) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<Requirement>(requirement);
  const set = (patch: Partial<Requirement>) => setDraft(prev => ({ ...prev, ...patch }));
  const input = "h-10 w-full border border-[#C9D2CD] px-2.5 text-sm focus:border-[#00A174] focus:outline-none";
  return (
    <div className="space-y-3 text-[13px]">
      <label className="block space-y-1">
        <span className="font-bold">入住時間</span>
        <select value={draft.moveIn} onChange={e => set({ moveIn: e.target.value as Requirement["moveIn"] })} className={input}>
          {MOVE_IN_OPTIONS.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
      </label>
      {draft.moveIn === "date" && (
        <label className="block space-y-1"><span className="font-bold">入住日期</span><input type="date" value={draft.moveInDate || ""} onChange={e => set({ moveInDate: e.target.value })} className={input} /></label>
      )}
      <label className="block space-y-1"><span className="font-bold">希望地區</span><input value={draft.areas} onChange={e => set({ areas: e.target.value })} className={input} /></label>
      <label className="block space-y-1"><span className="font-bold">每天要去</span><input value={draft.commuteTarget || ""} onChange={e => set({ commuteTarget: e.target.value })} className={input} /></label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block space-y-1"><span className="font-bold">理想月租（萬）</span><input inputMode="decimal" value={String(draft.rentIdealMan)} onChange={e => set({ rentIdealMan: e.target.value as any })} className={input} /></label>
        <label className="block space-y-1"><span className="font-bold">最高月租（萬）</span><input inputMode="decimal" value={String(draft.rentMaxMan)} onChange={e => set({ rentMaxMan: e.target.value as any })} className={input} /></label>
      </div>
      <div className="space-y-1">
        <span className="font-bold">房型</span>
        <div className="flex flex-wrap gap-1.5">
          {LAYOUT_OPTIONS.map(option => {
            const on = draft.layouts.includes(option.id);
            return <button key={option.id} type="button" aria-pressed={on} onClick={() => set({ layouts: on ? draft.layouts.filter(id => id !== option.id) : [...draft.layouts, option.id] })}
              className={`min-h-9 border px-3 text-xs ${on ? "border-[#00A174] bg-[#F0FAF6] font-bold text-[#00A174]" : "border-[#DDE3DF]"}`}>{option.label}</button>;
          })}
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="button" disabled={busy} onClick={() => onSave(draft)} className="min-h-10 flex-1 bg-[#00A174] text-sm font-bold text-white disabled:opacity-50">儲存並記錄變更</button>
        <button type="button" onClick={onCancel} className="min-h-10 border border-[#DDE3DF] px-4 text-sm">取消</button>
      </div>
    </div>
  );
}
