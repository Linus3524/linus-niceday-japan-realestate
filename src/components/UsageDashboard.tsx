import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, LoaderCircle, RefreshCw } from "lucide-react";

/**
 * 後台使用量頁面（#admin）。
 *
 * 權限完全由伺服器端的 ANALYTICS_TOKEN 把關，這個頁面本身公開也沒關係——
 * 沒有 token 就什麼都拿不到。token 存在 sessionStorage 而不是 localStorage：
 * 關掉分頁就失效，共用電腦上比較安全。
 */

const TOKEN_STORAGE_KEY = "linus-analytics-token";

const FEATURE_LABEL: Record<string, string> = {
  "chat": "AI 顧問對話",
  "rent-analysis": "AI 需求分析",
  "listing-check": "物件圖紙健檢",
};

const COUNTRY_LABEL: Record<string, string> = {
  TW: "台灣", JP: "日本", HK: "香港", CN: "中國", US: "美國",
  SG: "新加坡", MY: "馬來西亞", KR: "韓國", unknown: "未知",
};

interface UsageSummary {
  month: string;
  total: Record<string, number>;
  daily: Record<string, Record<string, number>>;
  geo: Record<string, Record<string, number>>;
  views: Record<string, number>;
  sources: Record<string, number>;
  actions: Record<string, number>;
  /**
   * 與前台首頁「VISITORS」共用同一個 visitorId、同一套去重邏輯算出來的
   * 本月／累計訪客數（見 src/lib/visitorCounter.ts）。null 代表訪客計數器
   * 沒有設定（缺 Upstash 環境變數），不是「這個月是 0 人」。
   */
  monthlyVisitors: number | null;
  cumulativeVisitors: number | null;
}

interface ContactChannelGroup {
  id: string;
  name: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  actions: Array<{
    key: string;
    label: string;
    note: string;
  }>;
}

const CONTACT_CHANNELS: ContactChannelGroup[] = [
  {
    id: "line",
    name: "LINE 管道",
    badgeBg: "#E8F9F0",
    badgeText: "#06C755",
    badgeBorder: "#A3E9C1",
    actions: [
      { key: "line-add", label: "點擊加 LINE 好友", note: "首頁卡片 ＋ 聯絡分頁 ＋ 物件分析 CTA ＋ AI 顧問回覆" },
      { key: "line-copy", label: "複製 LINE ID", note: "首頁卡片 ＋ 聯絡分頁" },
      { key: "line-qr", label: "開啟 LINE QR 掃碼", note: "首頁頭像翻卡 ＋ 聯絡分頁展開" },
    ],
  },
  {
    id: "wechat",
    name: "WeChat 管道",
    badgeBg: "#E6F7ED",
    badgeText: "#07C160",
    badgeBorder: "#9DE4B8",
    actions: [
      { key: "wechat-copy", label: "複製 WeChat ID", note: "聯絡分頁 ＋ 物件分析 CTA" },
      { key: "wechat-qr", label: "展開 WeChat QR 掃碼", note: "聯絡分頁展開 ＋ 物件分析 CTA" },
    ],
  },
  {
    id: "email",
    name: "Email 管道",
    badgeBg: "#F0F3F1",
    badgeText: "#526159",
    badgeBorder: "#D4DDD8",
    actions: [
      { key: "email-copy", label: "點擊複製 Email", note: "物件分析 CTA 聯絡區" },
    ],
  },
];

// 常用管道的中文名。沒收錄的標記會直接顯示原字，不影響統計，
// 想讓它顯示中文就在這裡加一行。
const SOURCE_LABEL: Record<string, string> = {
  line: "LINE",
  ig: "Instagram",
  instagram: "Instagram",
  fb: "Facebook",
  facebook: "Facebook",
  threads: "Threads",
  qr: "QR Code",
  card: "名片／宣傳卡",
  other: "其他來源",
};

// 名稱必須與前端分頁列一致（App.tsx 的分頁 label），
// 後台叫「預算計算機」而網站上寫「費用試算」的話，看報表時要自己在腦中換算。
const VIEW_LABEL: Record<string, string> = {
  "rent-guide": "租屋指南",
  "buy-guide": "買房置產",
  "calculator": "費用試算",
  "ai-advisor": "AI 顧問",
  "contact": "聯絡諮詢",
  "threads": "精選 Threads 文",
  "policy": "條款與隱私",
  "home": "手機首頁（未切分頁）",
};

interface AggregateRow { label: string; count: number; visitors: number }

interface TrafficSummary {
  month: string;
  visitors: number;
  pageviews: number;
  countries: AggregateRow[];
  pages: AggregateRow[];
  referrers: AggregateRow[];
  events: AggregateRow[];
  /** Hobby 方案查不到自訂事件（Vercel 回 402），此時為 false。 */
  eventsAvailable: boolean;
}

const EVENT_LABEL: Record<string, string> = {
  "calculator-applied": "把需求帶入計算機",
  "rent-analysis-submitted": "送出 AI 需求分析",
};

export const ADMIN_METRICS_START_MONTH = "2026-08";

export function monthOptions(now = new Date()) {
  const options: string[] = [];
  const tokyo = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const currentOrdinal = tokyo.getUTCFullYear() * 12 + tokyo.getUTCMonth();
  const [startYear, startMonth] = ADMIN_METRICS_START_MONTH.split("-").map(Number);
  const startOrdinal = startYear * 12 + startMonth - 1;
  for (let ordinal = currentOrdinal; ordinal >= startOrdinal; ordinal -= 1) {
    const year = Math.floor(ordinal / 12);
    const month = ordinal % 12 + 1;
    options.push(`${year}-${String(month).padStart(2, "0")}`);
  }
  return options.length ? options : [ADMIN_METRICS_START_MONTH];
}

/** 把 { "17": { chat: 3 } } 轉成依日期排序、且補齊功能欄位的表格列。 */
function dailyRows(daily: UsageSummary["daily"], features: string[]) {
  return Object.keys(daily)
    .sort((a, b) => Number(b) - Number(a))
    .map(day => ({
      day,
      counts: features.map(feature => daily[day]?.[feature] ?? 0),
      sum: features.reduce((acc, feature) => acc + (daily[day]?.[feature] ?? 0), 0),
    }));
}

/** 功能卡片必須跟月份選單同步；跨月累計只留在頁尾作為補充資訊。 */
export function monthlyFeatureTotals(daily: UsageSummary["daily"]) {
  const totals: Record<string, number> = {};
  for (const counts of Object.values(daily)) {
    for (const [feature, count] of Object.entries(counts)) {
      totals[feature] = (totals[feature] ?? 0) + (Number(count) || 0);
    }
  }
  return totals;
}

export function UsageDashboard({ onBack }: { onBack: () => void }) {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_STORAGE_KEY) || "");
  const [tokenInput, setTokenInput] = useState("");
  const [month, setMonth] = useState(() => monthOptions()[0]);
  const [data, setData] = useState<UsageSummary | null>(null);
  const [traffic, setTraffic] = useState<TrafficSummary | null>(null);
  // 流量區塊的狀態獨立於功能次數：Vercel token 沒設或查詢失敗時，
  // 功能次數仍然要正常顯示，不能因為半邊壞掉就整頁空白。
  const [trafficNote, setTrafficNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 月份快速切換時，只允許最後一次請求更新畫面，避免較慢的舊月份回應覆蓋新月份。
  const loadRequestId = useRef(0);

  const load = async (activeToken: string, targetMonth: string) => {
    const requestId = ++loadRequestId.current;
    if (!activeToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setTrafficNote(null);
    setData(null);
    setTraffic(null);

    // token 走 header 不走查詢字串：網址會被寫進伺服器日誌、瀏覽器歷史與
    // Referer 標頭，把權杖放在那裡等於到處留下副本。
    const auth = { headers: { "x-analytics-token": activeToken } };
    const usage = fetch(`/api/usage-stats?month=${targetMonth}`, auth);
    const flow = fetch(`/api/vercel-analytics?month=${targetMonth}`, auth);

    try {
      const response = await usage;
      if (response.status === 401) throw new Error("密碼不正確。");
      if (response.status === 503) throw new Error("伺服器設定不完整（缺少後台密碼或資料庫連線），需要工程協助。");
      if (!response.ok) throw new Error(`讀取失敗（HTTP ${response.status}）。`);
      const body = await response.json();
      if (requestId === loadRequestId.current) setData(body);
    } catch (err: any) {
      if (requestId === loadRequestId.current) {
        setError(err?.message || "讀取失敗。");
        setData(null);
      }
    }

    try {
      const response = await flow;
      if (response.ok) {
        const body = await response.json();
        if (requestId === loadRequestId.current) setTraffic(body);
      } else {
        const body = await response.json().catch(() => null);
        // 501 = 還沒設定 token（待辦），其餘才是真的故障。
        if (requestId === loadRequestId.current) {
          setTrafficNote(body?.error || `流量數據讀取失敗（HTTP ${response.status}）。`);
          setTraffic(null);
        }
      }
    } catch {
      if (requestId === loadRequestId.current) {
        setTrafficNote("流量數據讀取失敗。");
        setTraffic(null);
      }
    }

    if (requestId === loadRequestId.current) setLoading(false);
  };

  useEffect(() => { load(token, month); }, [token, month]);

  const features = useMemo(() => {
    if (!data) return [];
    // 已知的功能一律顯示（沒人用就是 0）。只從資料反推的話，次數為 0 的功能
    // 連卡片都不會出現，看的人分不出是「還沒有人用」還是「這個功能壞了」。
    // 另外把資料裡出現、但清單上沒有的鍵也帶進來，才不會漏掉之後新增的項目。
    const found = new Set<string>([
      ...Object.keys(FEATURE_LABEL),
      ...Object.keys(data.total),
      ...Object.values(data.daily).flatMap(v => Object.keys(v)),
      ...Object.values(data.geo).flatMap(v => Object.keys(v)),
    ]);
    return [...found].sort();
  }, [data]);

  const viewRows = useMemo(() => {
    if (!data) return [];
    const counts = data.views ?? {};
    // 與功能卡片同理：所有分頁都列出來，沒人看的顯示 0。
    // 只列有資料的分頁會讓人以為那一頁不存在，也看不出「都沒人點」這件事本身。
    const names = new Set<string>([...Object.keys(VIEW_LABEL), ...Object.keys(counts)]);
    const entries = [...names].map(view => ({ view, count: Number(counts[view]) || 0 }));
    // 長條以「最多的那一頁」為滿格，比例差距才看得出來。
    const max = Math.max(1, ...entries.map(entry => entry.count));
    return entries
      .map(entry => ({ ...entry, share: Math.round((entry.count / max) * 100) }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  // 這個月的總瀏覽次數：views 這個 hash 本身就是「各分頁被看了幾次」，
  // 加總起來就是總瀏覽次數，不需要另外開一個計數器重複記一次。
  const totalPageviews = useMemo(
    () => Object.values(data?.views ?? {}).reduce((sum, value) => sum + (Number(value) || 0), 0),
    [data],
  );

  const geoRows = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.geo)
      .map(([country, counts]) => ({
        country,
        counts: features.map(f => counts[f] ?? 0),
        sum: Object.values(counts).reduce((a, b) => a + b, 0),
      }))
      .sort((a, b) => b.sum - a.sum);
  }, [data, features]);

  const monthlyTotals = useMemo(
    () => monthlyFeatureTotals(data?.daily ?? {}),
    [data],
  );

  const sourceRows = useMemo(
    () => Object.entries(data?.sources ?? {})
      .map(([source, count]) => ({ source, count: Number(count) || 0 }))
      .sort((a, b) => b.count - a.count),
    [data],
  );

  const [openChannels, setOpenChannels] = useState<Record<string, boolean>>({
    line: true,
    wechat: true,
    email: true,
  });
  const [openListingSection, setOpenListingSection] = useState(true);
  const [openAiSection, setOpenAiSection] = useState(true);

  const toggleChannel = (id: string) => {
    setOpenChannels(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAllChannels = () => {
    const allOpen = Object.values(openChannels).every(Boolean);
    setOpenChannels({
      line: !allOpen,
      wechat: !allOpen,
      email: !allOpen,
    });
  };

  const contactTotals = useMemo(() => {
    if (!data?.actions) return { total: 0, byChannel: {} as Record<string, number> };
    const byChannel: Record<string, number> = {};
    let total = 0;
    for (const group of CONTACT_CHANNELS) {
      let groupSum = 0;
      for (const act of group.actions) {
        groupSum += data.actions[act.key] ?? 0;
      }
      byChannel[group.id] = groupSum;
      total += groupSum;
    }
    return { total, byChannel };
  }, [data?.actions]);

  const listingMetrics = useMemo(() => {
    if (!data?.actions) return { sale: 0, rent: 0, shareCreate: 0, shareView: 0, pdfDownload: 0, total: 0 };
    const sale = data.actions["listing-check-sale"] ?? 0;
    const rent = data.actions["listing-check-rent"] ?? 0;
    const shareCreate = data.actions["listing-share-create"] ?? 0;
    const shareView = data.actions["listing-share-view"] ?? 0;
    const pdfDownload = data.actions["listing-pdf-download"] ?? 0;
    return {
      sale,
      rent,
      shareCreate,
      shareView,
      pdfDownload,
      total: sale + rent,
    };
  }, [data?.actions]);

  const aiAnalysisMetrics = useMemo(() => {
    if (!data?.actions) return { structured: 0, natural: 0, total: 0 };
    const structured = data.actions["rent-analysis-submitted-structured-form"] ?? 0;
    const natural = data.actions["rent-analysis-submitted-natural-language"] ?? 0;
    return {
      structured,
      natural,
      total: structured + natural,
    };
  }, [data?.actions]);

  if (!token) {
    return (
      <div className="min-h-screen bg-[#F5F8F6] px-4 py-16 font-sans">
        <div className="mx-auto max-w-md border border-[#DDE3DF] bg-white p-8">
          <h1 className="font-serif text-2xl font-bold text-[#1A2A22]">後台使用量</h1>
          <p className="mt-2 text-sm text-zinc-500">請輸入後台密碼。</p>
          <input
            type="password"
            value={tokenInput}
            onChange={e => setTokenInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && tokenInput.trim()) { sessionStorage.setItem(TOKEN_STORAGE_KEY, tokenInput.trim()); setToken(tokenInput.trim()); } }}
            placeholder="貼上密碼後按 Enter"
            className="mt-5 h-11 w-full border border-[#C9D8D1] px-3 text-sm focus:border-[#00a174] focus:outline-none"
          />
          <button
            type="button"
            disabled={!tokenInput.trim()}
            onClick={() => { sessionStorage.setItem(TOKEN_STORAGE_KEY, tokenInput.trim()); setToken(tokenInput.trim()); }}
            className="mt-3 h-11 w-full bg-[#1A2A22] text-sm font-bold text-white transition-colors hover:bg-[#00a174] disabled:opacity-40"
          >
            進入
          </button>
          <button type="button" onClick={onBack} className="mt-4 w-full text-xs text-zinc-500 underline underline-offset-2">
            回到網站
          </button>
        </div>
      </div>
    );
  }

  const grandTotal = Object.values(data?.total ?? {}).reduce<number>((sum, value) => sum + Number(value || 0), 0);

  return (
    <div className="min-h-screen bg-[#F5F8F6] px-4 py-10 font-sans sm:px-6">
      <div className="mx-auto max-w-[1000px]">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <button type="button" onClick={onBack} className="mb-2 inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-[#00a174]">
              <ArrowLeft className="h-3.5 w-3.5" /> 回到網站
            </button>
            <h1 className="font-serif text-2xl font-bold text-[#1A2A22]">後台使用量</h1>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="h-9 border border-[#C9D8D1] bg-white px-2 text-sm focus:border-[#00a174] focus:outline-none"
            >
              {monthOptions().map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <button
              type="button"
              onClick={() => load(token, month)}
              className="flex h-9 w-9 items-center justify-center border border-[#C9D8D1] bg-white hover:border-[#00a174] hover:text-[#00a174]"
              aria-label="重新整理"
            >
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => {
                loadRequestId.current += 1;
                sessionStorage.removeItem(TOKEN_STORAGE_KEY);
                setToken("");
                setData(null);
                setTraffic(null);
              }}
              className="h-9 border border-[#C9D8D1] bg-white px-3 text-xs text-zinc-500 hover:border-[#00a174]"
            >
              登出
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 border border-[#E4C9A8] bg-[#FBF6EF] p-4 text-sm text-[#7A5B36]">{error}</div>
        )}

        {/* 本站流量：與前台首頁「VISITORS」同一套 Redis 統計、同一個 visitorId
            去重邏輯算出來的數字，是這個網站唯一「前後台保證同源」的流量數字。
            放在 Vercel 那組之前，作為主要參考；Vercel 那組因為是前端腳本、
            會被封鎖器擋掉，改列為次要對照。 */}
        {data && (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-bold text-[#1A2A22]">
              本站流量
              <span className="ml-2 font-normal text-xs text-zinc-400">
                {data.month}・伺服器端記錄，與首頁 VISITORS 同源
              </span>
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="border border-[#DDE3DF] bg-white p-5">
                <div className="text-xs text-zinc-500">本月不重複訪客</div>
                <div className="mt-1 font-jost text-3xl font-bold text-[#1A2A22]">
                  {data.monthlyVisitors === null ? "—" : data.monthlyVisitors.toLocaleString()}
                </div>
                <div className="mt-1 text-[11px] leading-5 text-zinc-400">以造訪者的瀏覽器 cookie 去重</div>
              </div>
              <div className="border border-[#DDE3DF] bg-white p-5">
                <div className="text-xs text-zinc-500">本月瀏覽次數</div>
                <div className="mt-1 font-jost text-3xl font-bold text-[#1A2A22]">{totalPageviews.toLocaleString()}</div>
                <div className="mt-1 text-[11px] leading-5 text-zinc-400">各分頁瀏覽次數加總（含手機首頁）</div>
              </div>
              <div className="border border-[#DDE3DF] bg-white p-5">
                <div className="text-xs text-zinc-500">累計訪客（全站，不分月）</div>
                <div className="mt-1 font-jost text-3xl font-bold text-[#1A2A22]">
                  {data.cumulativeVisitors === null ? "—" : data.cumulativeVisitors.toLocaleString()}
                </div>
                <div className="mt-1 text-[11px] leading-5 text-zinc-400">首頁 VISITORS 顯示的就是這個數字</div>
              </div>
            </div>
            {data.monthlyVisitors === null && (
              <p className="mt-3 text-[11px] leading-5 text-zinc-400">
                訪客計數器沒有設定（缺少 Upstash 環境變數），以上三格顯示「—」不代表沒有流量。
              </p>
            )}
          </section>
        )}

        {/* 次要對照：Vercel Web Analytics。前端腳本統計，會被廣告封鎖器與
            部分隱私瀏覽模式擋掉，數字通常會比實際流量低，僅供交叉參考——
            與上方「本站流量」出現落差是正常現象，不代表哪一邊算錯。 */}
        {traffic && (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-bold text-[#1A2A22]">
              外部對照（Vercel Analytics）
              <span className="ml-2 font-normal text-xs text-zinc-400">
                {traffic.month}・前端腳本統計，會被封鎖器擋掉
              </span>
            </h2>
            <div className="mb-3 grid gap-3 sm:grid-cols-2">
              <div className="border border-[#DDE3DF] bg-white p-5">
                <div className="text-xs text-zinc-500">每日不重複訪客合計</div>
                <div className="mt-1 font-jost text-3xl font-bold text-[#1A2A22]">{traffic.visitors.toLocaleString()}</div>
              </div>
              <div className="border border-[#DDE3DF] bg-white p-5">
                <div className="text-xs text-zinc-500">總瀏覽次數</div>
                <div className="mt-1 font-jost text-3xl font-bold text-[#1A2A22]">{traffic.pageviews.toLocaleString()}</div>
              </div>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {([
                ["來源國家", traffic.countries, (l: string) => COUNTRY_LABEL[l] ?? l],
                ["連結來源", traffic.referrers, (l: string) => l || "直接進入"],
              ] as [string, AggregateRow[], (l: string) => string][]).map(([title, rows, format]) => (
                <div key={title} className="border border-[#DDE3DF] bg-white">
                  <h3 className="border-b border-[#DDE3DF] px-4 py-2.5 text-xs font-bold text-[#1A2A22]">{title}</h3>
                  <ul className="divide-y divide-[#F5F8F6]">
                    {rows.length ? rows.map(row => (
                      <li key={row.label} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
                        <span className="truncate text-[#3F5147]" title={row.label}>{format(row.label)}</span>
                        <span className="shrink-0 font-jost font-bold text-[#1A2A22]">
                          {row.visitors.toLocaleString()}
                          {/* 這裡原本寫「人次」，但 row.visitors 是去重後的訪客數（同一人不論
                              造訪幾次只算一個），「人次」在中文裡指的是累計造訪次數、允許重複——
                              兩個詞義相反，容易讓人誤解這欄和旁邊的「次」算的是同一種東西。 */}
                          <span className="ml-1 font-sans text-[11px] font-normal text-zinc-400">
                            人／{row.count.toLocaleString()} 次
                          </span>
                        </span>
                      </li>
                    )) : (
                      <li className="px-4 py-6 text-center text-xs text-zinc-400">還沒有資料</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
            {!traffic.eventsAvailable && (
              <p className="mt-3 text-[11px] leading-5 text-zinc-400">
                前端操作事件（把需求帶入計算機、送出 AI 需求分析）需要 Vercel Pro 方案才能查詢。
                這兩個動作的實際次數，請看下方「功能使用次數」。
              </p>
            )}
            {traffic.eventsAvailable && traffic.events.length > 0 && (
              <div className="mt-3 border border-[#DDE3DF] bg-white">
                <h3 className="border-b border-[#DDE3DF] px-4 py-2.5 text-xs font-bold text-[#1A2A22]">前端操作事件</h3>
                <ul className="divide-y divide-[#F5F8F6]">
                  {traffic.events.map(row => (
                    <li key={row.label} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
                      <span className="text-[#3F5147]">{EVENT_LABEL[row.label] ?? row.label}</span>
                      <span className="font-jost font-bold text-[#1A2A22]">{row.count.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {trafficNote && (
          <div className="mb-8 border border-[#DDE3DF] bg-white p-4 text-xs text-zinc-500">
            外部對照（Vercel Analytics）：{trafficNote}
          </div>
        )}

        {data && (
          <>
            <section className="mb-8">
              <h2 className="mb-3 text-sm font-bold text-[#1A2A22]">
                自訂連結來源
                <span className="ml-2 font-normal text-xs text-zinc-400">{data.month}・from／utm_source</span>
              </h2>
              <div className="border border-[#DDE3DF] bg-white">
                {sourceRows.length ? (
                  <ul className="divide-y divide-[#F5F8F6]">
                    {sourceRows.map(row => (
                      <li key={row.source} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                        {/* 每一列都用同樣的樣式：中文名（沒有對照就用標記本身）
                            加上完整的 ?from= 寫法。先前有中文名的才顯示原標記，
                            結果一行有兩個字、一行只有一個，看起來像壞掉。 */}
                        <span className="text-[#3F5147]">
                          {SOURCE_LABEL[row.source] ?? row.source}
                          <span className="ml-2 font-jost text-[11px] text-zinc-400">?from={row.source}</span>
                        </span>
                        <span className="font-jost font-bold text-[#1A2A22]">{row.count.toLocaleString()} 次</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-4 py-8 text-center text-sm text-zinc-400">這個月還沒有人從帶標記的連結進來</p>
                )}
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-zinc-400">
                僅統計帶有自訂標記（如 <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[11px] text-zinc-600">?from=ig</code>）的推廣連結點擊，以追蹤各管道或留言的引流成效；未標記的一般造訪請參考上方「連結來源」。
              </p>
            </section>

            {/* 分頁瀏覽：自己記的，因為整站只有一個路徑，Vercel 分不出各分頁 */}
            <section className="mb-8">
              <h2 className="mb-3 text-sm font-bold text-[#1A2A22]">
                各分頁瀏覽次數
                <span className="ml-2 font-normal text-xs text-zinc-400">{data.month}</span>
              </h2>
              <div className="border border-[#DDE3DF] bg-white">
                {viewRows.length ? (
                  <ul className="divide-y divide-[#F5F8F6]">
                    {viewRows.map(row => (
                      <li key={row.view} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                        <span className="w-28 shrink-0 text-[#1A2A22]">{VIEW_LABEL[row.view] ?? row.view}</span>
                        {/* 長條讓比例一眼可見，不必自己心算百分比 */}
                        <span className="h-2 flex-1 overflow-hidden bg-[#EEF2F0]">
                          <span
                            className="block h-full bg-[#00a174]"
                            style={{ width: `${row.share}%` }}
                          />
                        </span>
                        <span className="w-20 shrink-0 text-right font-jost font-bold text-[#1A2A22]">
                          {row.count.toLocaleString()}
                          <span className="ml-1 font-sans text-[11px] font-normal text-zinc-400">{row.share}%</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-4 py-8 text-center text-sm text-zinc-400">這個月還沒有資料</p>
                )}
              </div>
            </section>

            {/* 聯絡意圖與轉化分析：站上核心成交入口，分組收納式閱讀 */}
            <section className="mb-8">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-[#1A2A22]">
                    聯絡意圖與轉化
                  </h2>
                  <span className="font-normal text-xs text-zinc-400">{data.month}</span>
                </div>
                <button
                  type="button"
                  onClick={toggleAllChannels}
                  className="text-xs font-semibold text-[#007D5A] hover:underline cursor-pointer"
                >
                  {Object.values(openChannels).every(Boolean) ? "全部收合" : "全部展開"}
                </button>
              </div>

              {/* 頂部總覽橫幅 */}
              <div className="mb-3 border border-[#DDE3DF] bg-white p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-xs text-zinc-500">本月潛在客戶聯絡總意圖</div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="font-jost text-3xl font-bold text-[#1A2A22]">
                        {contactTotals.total.toLocaleString()}
                      </span>
                      <span className="text-xs font-medium text-zinc-400">次動作</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {CONTACT_CHANNELS.map(ch => {
                      const count = contactTotals.byChannel[ch.id] ?? 0;
                      const share = contactTotals.total > 0 ? Math.round((count / contactTotals.total) * 100) : 0;
                      return (
                        <div
                          key={ch.id}
                          className="flex items-center gap-1.5 border px-2.5 py-1 text-xs"
                          style={{ borderColor: ch.badgeBorder, backgroundColor: ch.badgeBg, color: ch.badgeText }}
                        >
                          <span className="font-bold">{ch.name.replace(" 管道", "")}</span>
                          <span className="font-jost font-bold tabular-nums">{count.toLocaleString()}</span>
                          <span className="text-[10px] opacity-80">({share}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {contactTotals.total > 0 && (
                  <div className="mt-3.5 flex h-2 w-full overflow-hidden bg-[#F0F3F1]">
                    {CONTACT_CHANNELS.map(ch => {
                      const count = contactTotals.byChannel[ch.id] ?? 0;
                      const widthPercent = (count / contactTotals.total) * 100;
                      return (
                        <div
                          key={ch.id}
                          style={{ width: `${widthPercent}%`, backgroundColor: ch.badgeText }}
                          title={`${ch.name}: ${count} 次 (${widthPercent.toFixed(1)}%)`}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 管道分組可折疊清單 */}
              <div className="space-y-3">
                {CONTACT_CHANNELS.map(channel => {
                  const isOpen = openChannels[channel.id];
                  const channelCount = contactTotals.byChannel[channel.id] ?? 0;
                  const channelShare = contactTotals.total > 0 ? Math.round((channelCount / contactTotals.total) * 100) : 0;

                  return (
                    <div key={channel.id} className="border border-[#DDE3DF] bg-white transition-all">
                      {/* 分組摺疊標題列 */}
                      <button
                        type="button"
                        onClick={() => toggleChannel(channel.id)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-[#F8FAF9] cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="border px-2 py-0.5 text-xs font-bold"
                            style={{ borderColor: channel.badgeBorder, backgroundColor: channel.badgeBg, color: channel.badgeText }}
                          >
                            {channel.name}
                          </span>
                          <span className="text-xs text-zinc-400">
                            共 {channel.actions.length} 項動作入口
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-jost font-bold text-sm text-[#1A2A22]">
                            {channelCount.toLocaleString()}
                            <span className="ml-1 text-[11px] font-normal text-zinc-400">次 ({channelShare}%)</span>
                          </span>
                          {isOpen ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
                        </div>
                      </button>

                      {/* 展開之細項動作進度列表 */}
                      {isOpen && (
                        <div className="border-t border-[#EEF2F0] px-4 py-2 bg-[#FBFDFB]">
                          <ul className="divide-y divide-[#F0F3F1]">
                            {channel.actions.map(action => {
                              const count = data.actions?.[action.key] ?? 0;
                              const shareOfChannel = channelCount > 0 ? Math.round((count / channelCount) * 100) : 0;
                              return (
                                <li key={action.key} className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="min-w-0 flex-1 pr-4">
                                    <div className="text-xs font-bold text-[#1A2A22]">{action.label}</div>
                                    <div className="text-[11px] text-zinc-400">{action.note}</div>
                                  </div>
                                  <div className="flex items-center gap-3 shrink-0 pt-1 sm:pt-0">
                                    <span className="h-1.5 w-24 overflow-hidden bg-[#EEF2F0]">
                                      <span
                                        className="block h-full"
                                        style={{ width: `${shareOfChannel}%`, backgroundColor: channel.badgeText }}
                                      />
                                    </span>
                                    <span className="w-20 text-right font-jost font-bold text-sm text-[#1A2A22]">
                                      {count.toLocaleString()}
                                      <span className="ml-1 font-sans text-[11px] font-normal text-zinc-400">
                                        {shareOfChannel}%
                                      </span>
                                    </span>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="mt-2 text-[11px] leading-5 text-zinc-400">
                以按下的次數計算，同一個人按兩次算兩次。手機上多數人習慣複製 ID 直接搜尋，建議加好友與複製數字一起評估。
              </p>
            </section>

            {/* 物件圖紙健檢與報告互動：新功能深度分析 */}
            <section className="mb-8">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-[#1A2A22]">
                    物件圖紙健檢與報告互動
                  </h2>
                  <span className="font-normal text-xs text-zinc-400">{data.month}・新功能統計</span>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenListingSection(v => !v)}
                  className="text-xs font-semibold text-[#007D5A] hover:underline cursor-pointer flex items-center gap-1"
                >
                  {openListingSection ? "收合" : "展開"}
                  {openListingSection ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              </div>

              {openListingSection && (
                <div className="space-y-3">
                  {/* 四個核心 KPI 卡片 */}
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div className="border border-[#DDE3DF] bg-white p-4">
                      <div className="text-xs text-zinc-500">買賣物件分析</div>
                      <div className="mt-1 font-jost text-2xl font-bold text-[#007D5A]">
                        {listingMetrics.sale.toLocaleString()}
                      </div>
                      <div className="mt-0.5 text-[11px] text-zinc-400">
                        {listingMetrics.total > 0 ? `佔 ${Math.round((listingMetrics.sale / listingMetrics.total) * 100)}%` : "本月分析"}
                      </div>
                    </div>
                    <div className="border border-[#DDE3DF] bg-white p-4">
                      <div className="text-xs text-zinc-500">租賃物件分析</div>
                      <div className="mt-1 font-jost text-2xl font-bold text-[#0284C7]">
                        {listingMetrics.rent.toLocaleString()}
                      </div>
                      <div className="mt-0.5 text-[11px] text-zinc-400">
                        {listingMetrics.total > 0 ? `佔 ${Math.round((listingMetrics.rent / listingMetrics.total) * 100)}%` : "本月分析"}
                      </div>
                    </div>
                    <div className="border border-[#DDE3DF] bg-white p-4">
                      <div className="text-xs text-zinc-500">分享連結建立 / 瀏覽</div>
                      <div className="mt-1 font-jost text-2xl font-bold text-[#D97706]">
                        {listingMetrics.shareCreate.toLocaleString()}
                        <span className="text-sm font-normal text-zinc-400 ml-1">/ {listingMetrics.shareView.toLocaleString()} 閱</span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-zinc-400">專屬 #listing 傳播</div>
                    </div>
                    <div className="border border-[#DDE3DF] bg-white p-4">
                      <div className="text-xs text-zinc-500">完整 PDF 下載</div>
                      <div className="mt-1 font-jost text-2xl font-bold text-[#1A2A22]">
                        {listingMetrics.pdfDownload.toLocaleString()}
                      </div>
                      <div className="mt-0.5 text-[11px] text-zinc-400">A4 印刷診斷書</div>
                    </div>
                  </div>

                  {/* 健檢比重長條 */}
                  <div className="border border-[#DDE3DF] bg-white p-4">
                    <div className="text-xs font-bold text-[#1A2A22] mb-2.5">買賣 vs 租賃健檢佔比</div>
                    <div className="flex h-2.5 w-full overflow-hidden bg-[#EEF2F0]">
                      <div
                        style={{ width: `${listingMetrics.total > 0 ? (listingMetrics.sale / listingMetrics.total) * 100 : 50}%`, backgroundColor: "#007D5A" }}
                        title={`買賣: ${listingMetrics.sale} 次`}
                      />
                      <div
                        style={{ width: `${listingMetrics.total > 0 ? (listingMetrics.rent / listingMetrics.total) * 100 : 50}%`, backgroundColor: "#0284C7" }}
                        title={`租賃: ${listingMetrics.rent} 次`}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-[#007D5A]" />
                        買賣分析 {listingMetrics.sale.toLocaleString()} 次
                        {listingMetrics.total > 0 && <span className="font-jost"> ({Math.round((listingMetrics.sale / listingMetrics.total) * 100)}%)</span>}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-[#0284C7]" />
                        租賃分析 {listingMetrics.rent.toLocaleString()} 次
                        {listingMetrics.total > 0 && <span className="font-jost"> ({Math.round((listingMetrics.rent / listingMetrics.total) * 100)}%)</span>}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* AI 需求分析偏好 */}
            <section className="mb-8">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-[#1A2A22]">
                    AI 需求分析偏好
                  </h2>
                  <span className="font-normal text-xs text-zinc-400">{data.month}・租屋分析模式</span>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenAiSection(v => !v)}
                  className="text-xs font-semibold text-[#007D5A] hover:underline cursor-pointer flex items-center gap-1"
                >
                  {openAiSection ? "收合" : "展開"}
                  {openAiSection ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              </div>

              {openAiSection && (
                <div className="border border-[#DDE3DF] bg-white p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
                    <div className="text-xs text-zinc-500">
                      快速條件選單 vs 自然語言文字描述
                    </div>
                    <div className="text-xs font-jost text-zinc-400">
                      合計 {aiAnalysisMetrics.total.toLocaleString()} 次
                    </div>
                  </div>
                  <div className="flex h-2 w-full overflow-hidden bg-[#EEF2F0]">
                    <div
                      style={{ width: `${aiAnalysisMetrics.total > 0 ? (aiAnalysisMetrics.structured / aiAnalysisMetrics.total) * 100 : 50}%`, backgroundColor: "#00a174" }}
                      title={`快速條件選單: ${aiAnalysisMetrics.structured} 次`}
                    />
                    <div
                      style={{ width: `${aiAnalysisMetrics.total > 0 ? (aiAnalysisMetrics.natural / aiAnalysisMetrics.total) * 100 : 50}%`, backgroundColor: "#6366F1" }}
                      title={`自然語言描述: ${aiAnalysisMetrics.natural} 次`}
                    />
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-xs text-zinc-600">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#00a174]" />
                      快速選單勾選：{aiAnalysisMetrics.structured.toLocaleString()} 次
                      {aiAnalysisMetrics.total > 0 && <span className="font-jost text-zinc-400"> ({Math.round((aiAnalysisMetrics.structured / aiAnalysisMetrics.total) * 100)}%)</span>}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#6366F1]" />
                      自然語言描述：{aiAnalysisMetrics.natural.toLocaleString()} 次
                      {aiAnalysisMetrics.total > 0 && <span className="font-jost text-zinc-400"> ({Math.round((aiAnalysisMetrics.natural / aiAnalysisMetrics.total) * 100)}%)</span>}
                    </span>
                  </div>
                </div>
              )}
            </section>

            <h2 className="mb-3 text-sm font-bold text-[#1A2A22]">
              功能使用次數
              <span className="ml-2 font-normal text-xs text-zinc-400">{data.month}・伺服器端實際呼叫</span>
            </h2>
            <div className="mb-6 grid gap-3 sm:grid-cols-2">
              {features.map(feature => (
                <div key={feature} className="border border-[#DDE3DF] bg-white p-5">
                  <div className="text-xs text-zinc-500">{FEATURE_LABEL[feature] ?? feature}</div>
                  <div className="mt-1 font-jost text-3xl font-bold text-[#1A2A22]">
                    {(monthlyTotals[feature] ?? 0).toLocaleString()}
                  </div>
                  <div className="mt-1 text-[11px] leading-5 text-zinc-400">本月完成次數</div>
                </div>
              ))}
            </div>

            <p className="mb-6 text-xs text-zinc-500">
              上方卡片與下方兩張表皆為 {data.month} 這個月的資料。
              這一區只計算真的送出並得到回覆的次數。
            </p>

            <section className="mb-6 border border-[#DDE3DF] bg-white">
              <h2 className="border-b border-[#DDE3DF] px-5 py-3 text-sm font-bold text-[#1A2A22]">每日次數</h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] table-fixed text-sm">
                  <colgroup>
                    <col className="w-[38%]" />
                    {features.map(feature => <col key={feature} />)}
                    <col className="w-[12%]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-[#EEF2F0] text-left text-xs text-zinc-500">
                      <th className="px-5 py-2 font-medium">日期</th>
                      {features.map(f => <th key={f} className="px-5 py-2 text-center font-medium">{FEATURE_LABEL[f] ?? f}</th>)}
                      <th className="px-5 py-2 text-right font-medium">合計</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyRows(data.daily, features).map(row => (
                      <tr key={row.day} className="border-b border-[#F5F8F6] last:border-0">
                        <td className="px-5 py-2 font-jost tabular-nums text-[#1A2A22]">{data.month}-{row.day}</td>
                        {row.counts.map((count, index) => (
                          <td key={index} className="px-5 py-2 text-center font-jost tabular-nums text-[#3F5147]">{count || "—"}</td>
                        ))}
                        <td className="px-5 py-2 text-right font-jost tabular-nums font-bold text-[#1A2A22]">{row.sum}</td>
                      </tr>
                    ))}
                    {!Object.keys(data.daily).length && (
                      <tr><td colSpan={features.length + 2} className="px-5 py-8 text-center text-sm text-zinc-400">這個月還沒有資料</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="border border-[#DDE3DF] bg-white">
              <h2 className="border-b border-[#DDE3DF] px-5 py-3 text-sm font-bold text-[#1A2A22]">來源國家</h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] table-fixed text-sm">
                  <colgroup>
                    <col className="w-[38%]" />
                    {features.map(feature => <col key={feature} />)}
                    <col className="w-[12%]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-[#EEF2F0] text-left text-xs text-zinc-500">
                      <th className="px-5 py-2 font-medium">國家</th>
                      {features.map(f => <th key={f} className="px-5 py-2 text-center font-medium">{FEATURE_LABEL[f] ?? f}</th>)}
                      <th className="px-5 py-2 text-right font-medium">合計</th>
                    </tr>
                  </thead>
                  <tbody>
                    {geoRows.map(row => (
                      <tr key={row.country} className="border-b border-[#F5F8F6] last:border-0">
                        <td className="px-5 py-2 text-[#1A2A22]">
                          {COUNTRY_LABEL[row.country] ?? row.country}
                          {COUNTRY_LABEL[row.country] && row.country !== "unknown" && (
                            <span className="ml-1.5 font-jost tabular-nums text-[11px] text-zinc-400">{row.country}</span>
                          )}
                        </td>
                        {row.counts.map((count, index) => (
                          <td key={index} className="px-5 py-2 text-center font-jost tabular-nums text-[#3F5147]">{count || "—"}</td>
                        ))}
                        <td className="px-5 py-2 text-right font-jost tabular-nums font-bold text-[#1A2A22]">{row.sum}</td>
                      </tr>
                    ))}
                    {!geoRows.length && (
                      <tr><td colSpan={features.length + 2} className="px-5 py-8 text-center text-sm text-zinc-400">這個月還沒有資料</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <p className="mt-4 text-[11px] leading-5 text-zinc-400">
              全站累計 {grandTotal.toLocaleString()} 次。國家依 Vercel 的 IP 國碼標頭判斷，
              系統只保留國碼這一項資料。
            </p>
          </>
        )}
      </div>
    </div>
  );
}
