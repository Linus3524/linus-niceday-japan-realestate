import {
  ArrowLeft,
  BarChart3,
  Bot,
  Building,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  Globe,
  Info,
  KeyRound,
  Layers,
  LoaderCircle,
  MessageSquare,
  RefreshCw,
  Share2,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { dailyRows, monthlyFeatureTotals, monthOptions, type UsageSummary } from '../lib/analytics/usageSummary';
export { ADMIN_METRICS_START_MONTH, monthlyFeatureTotals, monthOptions } from '../lib/analytics/usageSummary';

/**
 * 後台使用量數據儀表板（#admin）。
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

const FEATURE_COLORS: Record<string, { bg: string; text: string; bar: string; border: string }> = {
  "listing-check": { bg: "#EBF8F4", text: "#007D5A", bar: "#00a174", border: "#B4E6D5" },
  "chat": { bg: "#EEF2FF", text: "#4338CA", bar: "#6366F1", border: "#C7D2FE" },
  "rent-analysis": { bg: "#FFF9ED", text: "#B45309", bar: "#D7A64A", border: "#FDE68A" },
};

const COUNTRY_LABEL: Record<string, string> = {
  TW: "台灣", JP: "日本", HK: "香港", CN: "中國", US: "美國",
  SG: "新加坡", MY: "馬來西亞", KR: "韓國", UK: "英國", GB: "英國",
  CA: "加拿大", AU: "澳洲", unknown: "未知國家",
};

const COUNTRY_FLAGS: Record<string, string> = {
  TW: "🇹🇼", JP: "🇯🇵", HK: "🇭🇰", CN: "🇨🇳", US: "🇺🇸",
  SG: "🇸🇬", MY: "🇲🇾", KR: "🇰🇷", UK: "🇬🇧", GB: "🇬🇧",
  CA: "🇨🇦", AU: "🇦🇺", unknown: "🌐",
};

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

const SOURCE_LABEL: Record<string, string> = {
  line: "LINE",
  ig: "Instagram",
  instagram: "Instagram",
  fb: "Facebook",
  facebook: "Facebook",
  threads: "Threads",
  qr: "實體 QR Code",
  card: "名片／宣傳卡",
  other: "其他來源",
};

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

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const dailyChartData = useMemo(() => {
    if (!data?.daily) return { days: [], maxTotal: 1 };
    const [yearStr, monthStr] = month.split("-");
    const year = parseInt(yearStr, 10) || 2026;
    const m = parseInt(monthStr, 10) || 9;
    const daysInMonth = new Date(year, m, 0).getDate();

    const days = [];
    let maxTotal = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dayKey = String(d).padStart(2, "0");
      const counts = data.daily[dayKey] || {};
      const listingCheck = counts["listing-check"] || 0;
      const chat = counts["chat"] || 0;
      const rentAnalysis = counts["rent-analysis"] || 0;
      const total = Object.values(counts).reduce((a, b) => a + (Number(b) || 0), 0);
      if (total > maxTotal) maxTotal = total;
      days.push({
        day: dayKey,
        listingCheck,
        chat,
        rentAnalysis,
        total,
      });
    }
    return { days, maxTotal: Math.max(maxTotal, 1) };
  }, [data?.daily, month]);

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F8F6] px-4 py-16 font-sans">
        <div className="w-full max-w-md border border-[#DDE3DF] bg-white p-8 shadow-sm">
          <div className="flex items-center gap-2 text-[#007D5A]">
            <Layers className="h-5 w-5" />
            <span className="font-jost text-xs font-bold tracking-wider">LINUS NICEDAY · ADMIN</span>
          </div>
          <h1 className="mt-3 font-serif text-2xl font-bold text-[#1A2A22]">後台使用量儀表板</h1>
          <p className="mt-1.5 text-xs text-[#526159]">請輸入管理權杖密碼以查閱即時數據分析。</p>
          <input
            type="password"
            value={tokenInput}
            onChange={e => setTokenInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && tokenInput.trim()) { sessionStorage.setItem(TOKEN_STORAGE_KEY, tokenInput.trim()); setToken(tokenInput.trim()); } }}
            placeholder="貼上管理密碼後按 Enter"
            className="mt-6 h-11 w-full border border-[#C9D8D1] bg-[#FAFCFB] px-3.5 text-sm focus:border-[#007D5A] focus:bg-white focus:outline-none"
          />
          <button
            type="button"
            disabled={!tokenInput.trim()}
            onClick={() => { sessionStorage.setItem(TOKEN_STORAGE_KEY, tokenInput.trim()); setToken(tokenInput.trim()); }}
            className="mt-3 h-11 w-full bg-[#1A2A22] text-sm font-bold text-white transition-colors hover:bg-[#007D5A] disabled:opacity-40 cursor-pointer"
          >
            驗證進入
          </button>
          <button
            type="button"
            onClick={onBack}
            className="mt-4 flex w-full items-center justify-center gap-1 text-xs text-[#68756E] hover:text-[#007D5A] cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> 回到公開網站
          </button>
        </div>
      </div>
    );
  }

  const grandTotal = Object.values(data?.total ?? {}).reduce<number>((sum, value) => sum + Number(value || 0), 0);
  const totalFeaturesThisMonth = Object.values(monthlyTotals).reduce<number>((sum, value) => sum + Number(value || 0), 0);

  return (
    <div className="min-h-screen bg-[#F5F8F6] px-4 py-8 font-sans sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1080px]">
        {/* 頂部導航與控制器 */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#DDE3DF] pb-5">
          <div>
            <button
              type="button"
              onClick={onBack}
              className="mb-1.5 inline-flex items-center gap-1 text-xs font-semibold text-[#526159] transition-colors hover:text-[#007D5A] cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> 返回 LINUS 住好日
            </button>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-2xl font-bold tracking-tight text-[#1A2A22] sm:text-3xl">
                後台數據儀表板
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#B4E6D5] bg-[#EBF8F4] px-2.5 py-0.5 text-[11px] font-semibold text-[#007D5A]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00a174] animate-pulse" />
                即時在線
              </span>
            </div>
          </div>

          {/* 月份選擇與操作 */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={month}
                onChange={e => { setMonth(e.target.value); setSelectedDay(null); }}
                className="h-9.5 appearance-none border border-[#C9D8D1] bg-white pl-3.5 pr-8 text-xs font-bold text-[#1A2A22] shadow-sm focus:border-[#007D5A] focus:outline-none cursor-pointer"
              >
                {monthOptions().map(m => (
                  <option key={m} value={m}>
                    {m} 統計數據
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            </div>

            <button
              type="button"
              onClick={() => load(token, month)}
              disabled={loading}
              className="flex h-9.5 items-center gap-1.5 border border-[#C9D8D1] bg-white px-3 text-xs font-semibold text-[#1A2A22] shadow-sm hover:border-[#007D5A] hover:text-[#007D5A] cursor-pointer disabled:opacity-50"
              title="重新整理數據"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-[#007D5A]" : ""}`} />
              <span className="hidden sm:inline">重新整理</span>
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
              className="h-9.5 border border-[#DDE3DF] bg-white px-3 text-xs text-[#68756E] hover:border-red-300 hover:text-red-600 cursor-pointer"
            >
              登出
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 border border-[#E4C9A8] bg-[#FBF6EF] p-4 text-xs font-medium text-[#7A5B36]">
            <Info className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 核心 KPI 總覽卡片（Bento Grid） */}
        {data && (
          <section className="mb-8">
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
              {/* 卡片 1: 本月不重複訪客 */}
              <div className="relative overflow-hidden border border-[#B4E6D5] bg-gradient-to-br from-white to-[#F2FAF6] p-4.5 shadow-sm">
                <div className="flex items-center justify-between text-xs font-semibold text-[#007D5A]">
                  <span>本月不重複訪客</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#EBF8F4] text-[#007D5A]">
                    <Users className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2 font-jost text-3xl font-bold tabular-nums text-[#1A2A22]">
                  {data.monthlyVisitors === null ? "—" : data.monthlyVisitors.toLocaleString()}
                </div>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-[#526159]">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#00a174]" />
                  <span>第一方 Cookie 匿名去重</span>
                </div>
              </div>

              {/* 卡片 2: 本月總瀏覽量 */}
              <div className="border border-[#DDE3DF] bg-white p-4.5 shadow-sm">
                <div className="flex items-center justify-between text-xs font-semibold text-[#526159]">
                  <span>本月全站瀏覽量</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#F0F3F1] text-[#526159]">
                    <Eye className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2 font-jost text-3xl font-bold tabular-nums text-[#1A2A22]">
                  {totalPageviews.toLocaleString()}
                </div>
                <div className="mt-1 text-[11px] text-zinc-400">
                  各分頁與手機首頁累計
                </div>
              </div>

              {/* 卡片 3: 核心功能調用完成 */}
              <div className="border border-[#C7D2FE] bg-gradient-to-br from-white to-[#F5F7FF] p-4.5 shadow-sm">
                <div className="flex items-center justify-between text-xs font-semibold text-[#4338CA]">
                  <span>核心功能完成次數</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#EEF2FF] text-[#4338CA]">
                    <Sparkles className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2 font-jost text-3xl font-bold tabular-nums text-[#1A2A22]">
                  {totalFeaturesThisMonth.toLocaleString()}
                </div>
                <div className="mt-1 text-[11px] text-[#6366F1]">
                  圖紙健檢 + AI 顧問 + 需求分析
                </div>
              </div>

              {/* 卡片 4: 潛在客戶轉化意圖 */}
              <div className="border border-[#A3E9C1] bg-gradient-to-br from-white to-[#F0FAF4] p-4.5 shadow-sm">
                <div className="flex items-center justify-between text-xs font-semibold text-[#06C755]">
                  <span>客源轉化動作</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#E8F9F0] text-[#06C755]">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2 font-jost text-3xl font-bold tabular-nums text-[#1A2A22]">
                  {contactTotals.total.toLocaleString()}
                </div>
                <div className="mt-1 text-[11px] text-[#007D5A]">
                  加好友／掃碼／複製聯絡
                </div>
              </div>

              {/* 卡片 5: 全站累計訪客 */}
              <div className="border border-[#E4C9A8] bg-gradient-to-br from-white to-[#FBF8F2] p-4.5 shadow-sm">
                <div className="flex items-center justify-between text-xs font-semibold text-[#B45309]">
                  <span>全站累計總訪客</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#FFF9ED] text-[#B45309]">
                    <Globe className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2 font-jost text-3xl font-bold tabular-nums text-[#1A2A22]">
                  {data.cumulativeVisitors === null ? "—" : data.cumulativeVisitors.toLocaleString()}
                </div>
                <div className="mt-1 text-[11px] text-[#B45309]">
                  首頁 VISITORS 同步計數
                </div>
              </div>
            </div>
            {data.monthlyVisitors === null && (
              <p className="mt-3 text-[11px] leading-5 text-zinc-400">
                訪客計數器沒有設定（缺少 Upstash 環境變數），以上訪客數顯示「—」不代表沒有流量。
              </p>
            )}
          </section>
        )}

        {/* 每日使用量視覺化趨勢圖 (Daily Trend Activity Sparkline/Chart) */}
        {data && dailyChartData.days.length > 0 && (
          <section className="mb-8 border border-[#DDE3DF] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 font-serif text-base font-bold text-[#1A2A22]">
                  <BarChart3 className="h-4 w-4 text-[#007D5A]" />
                  {month} 每日功能呼叫趨勢
                </h2>
                <p className="mt-0.5 text-xs text-[#68756E]">
                  當月每日功能呼叫分佈，點選長條可快速篩選下方明細。
                </p>
              </div>

              {/* 圖例 */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#00a174]" />
                  <span className="text-[#526159]">圖紙健檢</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#6366F1]" />
                  <span className="text-[#526159]">AI 顧問</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#D7A64A]" />
                  <span className="text-[#526159]">需求分析</span>
                </span>
                {selectedDay && (
                  <button
                    type="button"
                    onClick={() => setSelectedDay(null)}
                    className="ml-2 rounded border border-[#C9D8D1] bg-[#F5F8F6] px-2 py-0.5 text-[11px] font-semibold text-[#007D5A] hover:bg-white cursor-pointer"
                  >
                    清除篩選 ({selectedDay} 號)
                  </button>
                )}
              </div>
            </div>

            {/* 互動長條圖區域 */}
            <div className="mt-6">
              <div className="relative flex h-36 items-end gap-1 border-b border-[#EEF2F0] pb-1 sm:gap-1.5">
                {dailyChartData.days.map(d => {
                  const isSelected = selectedDay === d.day;
                  const isHovered = hoveredDay === d.day;
                  const heightPercent = d.total > 0 ? Math.max((d.total / dailyChartData.maxTotal) * 100, 6) : 2;

                  const listingHeight = d.total > 0 ? (d.listingCheck / d.total) * 100 : 0;
                  const chatHeight = d.total > 0 ? (d.chat / d.total) * 100 : 0;
                  const rentHeight = d.total > 0 ? (d.rentAnalysis / d.total) * 100 : 0;

                  return (
                    <div
                      key={d.day}
                      className="group relative flex flex-1 flex-col items-center justify-end h-full"
                      onMouseEnter={() => setHoveredDay(d.day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      onClick={() => setSelectedDay(prev => prev === d.day ? null : d.day)}
                    >
                      {/* Tooltip */}
                      {(isHovered || isSelected) && (
                        <div className="absolute -top-14 z-20 whitespace-nowrap rounded border border-[#DDE3DF] bg-[#1A2A22] px-2.5 py-1.5 text-[11px] text-white shadow-lg pointer-events-none">
                          <div className="font-bold font-jost">{month}-{d.day}：{d.total} 次</div>
                          <div className="flex gap-2 text-[10px] text-zinc-300">
                            <span>健檢: {d.listingCheck}</span>
                            <span>顧問: {d.chat}</span>
                            <span>需求: {d.rentAnalysis}</span>
                          </div>
                        </div>
                      )}

                      {/* Bar Column */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full overflow-hidden transition-all cursor-pointer ${
                          isSelected
                            ? "ring-2 ring-[#007D5A] ring-offset-1"
                            : isHovered
                            ? "opacity-100"
                            : "opacity-90 hover:opacity-100"
                        } ${d.total === 0 ? "bg-[#EEF2F0]" : "flex flex-col-reverse"}`}
                      >
                        {d.total > 0 && (
                          <>
                            <div style={{ height: `${listingHeight}%` }} className="w-full bg-[#00a174]" title={`健檢: ${d.listingCheck}`} />
                            <div style={{ height: `${chatHeight}%` }} className="w-full bg-[#6366F1]" title={`顧問: ${d.chat}`} />
                            <div style={{ height: `${rentHeight}%` }} className="w-full bg-[#D7A64A]" title={`需求: ${d.rentAnalysis}`} />
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 日期刻度 */}
              <div className="flex justify-between pt-1.5 text-[10px] font-jost tabular-nums text-zinc-400">
                <span>01 日</span>
                <span>10 日</span>
                <span>20 日</span>
                <span>{dailyChartData.days[dailyChartData.days.length - 1]?.day} 日</span>
              </div>
            </div>
          </section>
        )}

        {/* 1. 物件圖紙健檢深度診斷與轉化漏斗 */}
        {data && (
          <section className="mb-8 border border-[#DDE3DF] bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#EEF2F0] pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-[#007D5A]" />
                <h2 className="font-serif text-base font-bold text-[#1A2A22]">物件圖紙健檢深度漏斗</h2>
                <span className="text-xs text-zinc-400">{data.month}</span>
              </div>
              <button
                type="button"
                onClick={() => setOpenListingSection(v => !v)}
                className="flex items-center gap-1 text-xs font-semibold text-[#007D5A] hover:underline cursor-pointer"
              >
                {openListingSection ? "收合" : "展開"}
                {openListingSection ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            </div>

            {openListingSection && (
              <div className="space-y-4">
                <div className="rounded-md border border-[#DDE3DF] bg-[#FAFCFB] p-4">
                  <div className="flex items-center justify-between text-xs font-bold text-[#1A2A22] mb-2">
                    <span>圖紙類型分佈（買賣 vs 租賃）</span>
                    <span className="font-jost tabular-nums text-zinc-500">共 {listingMetrics.total.toLocaleString()} 份健檢</span>
                  </div>
                  <div className="flex h-3 w-full overflow-hidden rounded-full bg-[#EEF2F0]">
                    <div style={{ width: `${listingMetrics.total > 0 ? (listingMetrics.sale / listingMetrics.total) * 100 : 50}%`, backgroundColor: "#007D5A" }} title={`買賣: ${listingMetrics.sale} 份`} />
                    <div style={{ width: `${listingMetrics.total > 0 ? (listingMetrics.rent / listingMetrics.total) * 100 : 50}%`, backgroundColor: "#0284C7" }} title={`租賃: ${listingMetrics.rent} 份`} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-[#526159]">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="h-2 w-2 rounded-full bg-[#007D5A]" />
                      🏠 買賣：{listingMetrics.sale.toLocaleString()} 份
                      {listingMetrics.total > 0 && <span className="font-jost font-bold text-[#1A2A22]"> ({Math.round((listingMetrics.sale / listingMetrics.total) * 100)}%)</span>}
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="h-2 w-2 rounded-full bg-[#0284C7]" />
                      🔑 租賃：{listingMetrics.rent.toLocaleString()} 份
                      {listingMetrics.total > 0 && <span className="font-jost font-bold text-[#1A2A22]"> ({Math.round((listingMetrics.rent / listingMetrics.total) * 100)}%)</span>}
                    </span>
                  </div>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-4">
                  <div className="border border-[#DDE3DF] bg-white p-3.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500">
                      <span>1. 產生健檢</span>
                      <FileCheck2 className="h-3.5 w-3.5 text-[#007D5A]" />
                    </div>
                    <div className="mt-1 font-jost text-2xl font-bold text-[#1A2A22]">{listingMetrics.total.toLocaleString()}</div>
                    <div className="mt-0.5 text-[10px] text-zinc-400">基準 100%</div>
                  </div>
                  <div className="border border-[#DDE3DF] bg-white p-3.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500">
                      <span>2. 建立分享</span>
                      <Share2 className="h-3.5 w-3.5 text-[#6366F1]" />
                    </div>
                    <div className="mt-1 font-jost text-2xl font-bold text-[#1A2A22]">{listingMetrics.shareCreate.toLocaleString()}</div>
                    <div className="mt-0.5 text-[10px] text-[#6366F1]">轉化率 {listingMetrics.total > 0 ? Math.round((listingMetrics.shareCreate / listingMetrics.total) * 100) : 0}%</div>
                  </div>
                  <div className="border border-[#DDE3DF] bg-white p-3.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500">
                      <span>3. 分享頁瀏覽</span>
                      <Eye className="h-3.5 w-3.5 text-[#0284C7]" />
                    </div>
                    <div className="mt-1 font-jost text-2xl font-bold text-[#1A2A22]">{listingMetrics.shareView.toLocaleString()}</div>
                    <div className="mt-0.5 text-[10px] text-[#0284C7]">開啟 {listingMetrics.shareView.toLocaleString()} 次</div>
                  </div>
                  <div className="border border-[#DDE3DF] bg-white p-3.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500">
                      <span>4. 下載 PDF</span>
                      <Download className="h-3.5 w-3.5 text-[#D7A64A]" />
                    </div>
                    <div className="mt-1 font-jost text-2xl font-bold text-[#1A2A22]">{listingMetrics.pdfDownload.toLocaleString()}</div>
                    <div className="mt-0.5 text-[10px] text-[#D7A64A]">存檔率 {listingMetrics.total > 0 ? Math.round((listingMetrics.pdfDownload / listingMetrics.total) * 100) : 0}%</div>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
        {/* 2. 聯絡意圖與轉化分析 */}
        {data && (
          <>

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



            {/* 3. AI 需求分析偏好 */}
            <section className="mb-8 border border-[#DDE3DF] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between border-b border-[#EEF2F0] pb-3">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-[#6366F1]" />
                  <h2 className="font-serif text-base font-bold text-[#1A2A22]">
                    AI 需求分析偏好
                  </h2>
                  <span className="text-xs text-zinc-400">{data.month}・租屋分析模式</span>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenAiSection(v => !v)}
                  className="flex items-center gap-1 text-xs font-semibold text-[#007D5A] hover:underline cursor-pointer"
                >
                  {openAiSection ? "收合" : "展開"}
                  {openAiSection ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              </div>

              {openAiSection && (
                <div className="rounded-md border border-[#DDE3DF] bg-[#FAFCFB] p-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-2">
                    <div className="text-xs font-bold text-[#1A2A22]">
                      快速條件選單 vs 自然語言文字描述
                    </div>
                    <div className="text-xs font-jost text-zinc-500">
                      合計 {aiAnalysisMetrics.total.toLocaleString()} 次送出
                    </div>
                  </div>
                  <div className="flex h-3 w-full overflow-hidden rounded-full bg-[#EEF2F0]">
                    <div
                      style={{ width: `${aiAnalysisMetrics.total > 0 ? (aiAnalysisMetrics.structured / aiAnalysisMetrics.total) * 100 : 50}%`, backgroundColor: "#00a174" }}
                      title={`快速條件選單: ${aiAnalysisMetrics.structured} 次`}
                    />
                    <div
                      style={{ width: `${aiAnalysisMetrics.total > 0 ? (aiAnalysisMetrics.natural / aiAnalysisMetrics.total) * 100 : 50}%`, backgroundColor: "#6366F1" }}
                      title={`自然語言描述: ${aiAnalysisMetrics.natural} 次`}
                    />
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-xs text-[#526159]">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="h-2 w-2 rounded-full bg-[#00a174]" />
                      快速選單勾選：{aiAnalysisMetrics.structured.toLocaleString()} 次
                      {aiAnalysisMetrics.total > 0 && <span className="font-jost font-bold text-[#1A2A22]"> ({Math.round((aiAnalysisMetrics.structured / aiAnalysisMetrics.total) * 100)}%)</span>}
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="h-2 w-2 rounded-full bg-[#6366F1]" />
                      自然語言描述：{aiAnalysisMetrics.natural.toLocaleString()} 次
                      {aiAnalysisMetrics.total > 0 && <span className="font-jost font-bold text-[#1A2A22]"> ({Math.round((aiAnalysisMetrics.natural / aiAnalysisMetrics.total) * 100)}%)</span>}
                    </span>
                  </div>
                </div>
              )}
            </section>
            {/* 4. 分頁熱門度 & 引流來源 (2-Col Grid) */}
            <section className="mb-8 grid gap-4 lg:grid-cols-2">
              {/* 各分頁瀏覽次數 */}
              <div className="border border-[#DDE3DF] bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between border-b border-[#EEF2F0] pb-2.5">
                  <h3 className="flex items-center gap-1.5 font-serif text-sm font-bold text-[#1A2A22]">
                    <Eye className="h-4 w-4 text-[#007D5A]" /> 各分頁瀏覽排行
                  </h3>
                  <span className="text-[11px] font-jost text-zinc-400">{data.month}</span>
                </div>
                {viewRows.length ? (
                  <ul className="divide-y divide-[#F5F8F6]">
                    {viewRows.map((row, idx) => (
                      <li key={row.view} className="flex items-center gap-3 py-2 text-xs">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#F0F3F1] font-jost text-[10px] font-bold text-[#526159]">
                          #{idx + 1}
                        </span>
                        <span className="w-28 shrink-0 font-medium text-[#1A2A22]">
                          {VIEW_LABEL[row.view] ?? row.view}
                        </span>
                        <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#EEF2F0]">
                          <span
                            className="block h-full bg-[#00a174]"
                            style={{ width: `${row.share}%` }}
                          />
                        </span>
                        <span className="w-20 shrink-0 text-right font-jost font-bold tabular-nums text-[#1A2A22]">
                          {row.count.toLocaleString()}
                          <span className="ml-1 font-sans text-[10px] font-normal text-zinc-400">{row.share}%</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="py-8 text-center text-xs text-zinc-400">這個月還沒有分頁瀏覽資料</p>
                )}
              </div>

              {/* 自訂宣傳來源 */}
              <div className="border border-[#DDE3DF] bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between border-b border-[#EEF2F0] pb-2.5">
                  <h3 className="flex items-center gap-1.5 font-serif text-sm font-bold text-[#1A2A22]">
                    <TrendingUp className="h-4 w-4 text-[#D7A64A]" /> 自訂推廣來源標記
                  </h3>
                  <span className="text-[11px] font-jost text-zinc-400">?from=...</span>
                </div>
                {sourceRows.length ? (
                  <ul className="divide-y divide-[#F5F8F6]">
                    {sourceRows.map(row => (
                      <li key={row.source} className="flex items-center justify-between gap-3 py-2 text-xs">
                        <span className="font-medium text-[#3F5147]">
                          {SOURCE_LABEL[row.source] ?? row.source}
                          <span className="ml-1.5 font-mono text-[10px] text-zinc-400">?from={row.source}</span>
                        </span>
                        <span className="font-jost font-bold tabular-nums text-[#1A2A22]">
                          {row.count.toLocaleString()} <span className="font-sans font-normal text-[10px] text-zinc-400">次點擊</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="py-8 text-center text-xs text-zinc-400">這個月還沒有自訂推廣來源標記點擊</p>
                )}
                <p className="mt-3 text-[10px] leading-relaxed text-zinc-400">
                  可於行銷連結加上 <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[10px] text-zinc-600">?from=threads</code> 或 <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[10px] text-zinc-600">?from=ig</code> 以追蹤各社群引流。
                </p>
              </div>
            </section>


            {/* 5. 核心功能完成次數 */}
            <section className="mb-8">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-1.5 font-serif text-sm font-bold text-[#1A2A22]">
                  <Sparkles className="h-4 w-4 text-[#007D5A]" />
                  核心功能完成次數
                </h2>
                <span className="text-xs text-zinc-400">{data.month}・伺服器端完成呼叫</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {features.map(feature => {
                  const style = FEATURE_COLORS[feature] || { bg: "#FAFCFB", text: "#1A2A22", bar: "#00a174", border: "#DDE3DF" };
                  const count = monthlyTotals[feature] ?? 0;
                  const grandFeatureTotal = Object.values(monthlyTotals).reduce((a, b) => a + b, 0);
                  const share = grandFeatureTotal > 0 ? Math.round((count / grandFeatureTotal) * 100) : 0;
                  return (
                    <div
                      key={feature}
                      className="border bg-white p-4.5 shadow-sm transition-all hover:shadow"
                      style={{ borderColor: style.border }}
                    >
                      <div className="flex items-center justify-between text-xs font-semibold" style={{ color: style.text }}>
                        <span>{FEATURE_LABEL[feature] ?? feature}</span>
                        <span className="font-jost text-[11px] opacity-75">{share}% 佔比</span>
                      </div>
                      <div className="mt-2 font-jost text-3xl font-bold tabular-nums text-[#1A2A22]">
                        {count.toLocaleString()}
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#EEF2F0]">
                        <div style={{ width: `${share}%`, backgroundColor: style.bar }} className="h-full" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <p className="mb-6 text-xs text-zinc-500">
              上方卡片與下方兩張表皆為 {data.month} 這個月的資料。
              這一區只計算真的送出並得到回覆的次數。
            </p>

            {/* 7. 每日功能明細次數表 */}
            <section className="mb-8 border border-[#DDE3DF] bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between border-b border-[#EEF2F0] pb-2.5">
                <h3 className="flex items-center gap-1.5 font-serif text-sm font-bold text-[#1A2A22]">
                  <SlidersHorizontal className="h-4 w-4 text-[#007D5A]" /> 每日功能完成明細表
                </h3>
                <span className="text-[11px] font-jost text-zinc-400">{data.month}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] table-fixed text-xs">
                  <colgroup>
                    <col className="w-[34%]" />
                    {features.map(feature => <col key={feature} />)}
                    <col className="w-[14%]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-[#EEF2F0] text-left text-xs font-semibold text-zinc-500">
                      <th className="px-4 py-2">日期</th>
                      {features.map(f => <th key={f} className="px-3 py-2 text-center">{FEATURE_LABEL[f] ?? f}</th>)}
                      <th className="px-4 py-2 text-right">當日合計</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5F8F6]">
                    {dailyRows(data.daily, features).map(row => {
                      const isHighlighted = selectedDay === row.day;
                      return (
                        <tr
                          key={row.day}
                          onClick={() => setSelectedDay(prev => prev === row.day ? null : row.day)}
                          className={`transition-colors cursor-pointer ${
                            isHighlighted ? "bg-[#EBF8F4] font-medium" : "hover:bg-[#FAFCFB]"
                          }`}
                        >
                          <td className="px-4 py-2.5 font-jost tabular-nums text-[#1A2A22]">
                            <span className="inline-flex items-center gap-1.5">
                              {isHighlighted && <span className="h-1.5 w-1.5 rounded-full bg-[#007D5A]" />}
                              {data.month}-{row.day}
                            </span>
                          </td>
                          {row.counts.map((count, index) => (
                            <td key={index} className="px-3 py-2.5 text-center font-jost tabular-nums text-[#3F5147]">
                              {count > 0 ? count.toLocaleString() : <span className="text-zinc-300">—</span>}
                            </td>
                          ))}
                          <td className="px-4 py-2.5 text-right font-jost tabular-nums font-bold text-[#1A2A22]">
                            {row.sum.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                    {!Object.keys(data.daily).length && (
                      <tr><td colSpan={features.length + 2} className="px-5 py-8 text-center text-xs text-zinc-400">這個月還沒有每日紀錄</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 6. 來源國家分佈 */}
            <section className="mb-8 border border-[#DDE3DF] bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between border-b border-[#EEF2F0] pb-2.5">
                <h3 className="flex items-center gap-1.5 font-serif text-sm font-bold text-[#1A2A22]">
                  <Globe className="h-4 w-4 text-[#007D5A]" /> 使用者地理來源國家分佈
                </h3>
                <span className="text-[11px] font-jost text-zinc-400">{data.month}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] table-fixed text-xs">
                  <colgroup>
                    <col className="w-[34%]" />
                    {features.map(feature => <col key={feature} />)}
                    <col className="w-[14%]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-[#EEF2F0] text-left text-xs font-semibold text-zinc-500">
                      <th className="px-4 py-2">國家／地區</th>
                      {features.map(f => <th key={f} className="px-3 py-2 text-center">{FEATURE_LABEL[f] ?? f}</th>)}
                      <th className="px-4 py-2 text-right">合計次數</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5F8F6]">
                    {geoRows.map(row => {
                      const flag = COUNTRY_FLAGS[row.country] || "🌐";
                      return (
                        <tr key={row.country} className="transition-colors hover:bg-[#FAFCFB]">
                          <td className="px-4 py-2.5 text-[#1A2A22] font-medium">
                            <span className="mr-1.5 text-base leading-none">{flag}</span>
                            <span>{COUNTRY_LABEL[row.country] ?? row.country}</span>
                            {row.country !== "unknown" && (
                              <span className="ml-1.5 font-jost text-[11px] text-zinc-400 font-normal">({row.country})</span>
                            )}
                          </td>
                          {row.counts.map((count, index) => (
                            <td key={index} className="px-3 py-2.5 text-center font-jost tabular-nums text-[#3F5147]">
                              {count > 0 ? count.toLocaleString() : <span className="text-zinc-300">—</span>}
                            </td>
                          ))}
                          <td className="px-4 py-2.5 text-right font-jost tabular-nums font-bold text-[#1A2A22]">
                            {row.sum.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                    {!geoRows.length && (
                      <tr><td colSpan={features.length + 2} className="px-5 py-8 text-center text-xs text-zinc-400">這個月還沒有國家來源資料</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 8. 次要外部對照：Vercel Web Analytics */}
            {traffic && (
              <section className="mb-8 border border-[#DDE3DF] bg-white p-5 shadow-sm">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#EEF2F0] pb-2.5">
                  <h3 className="flex items-center gap-1.5 font-serif text-sm font-bold text-[#1A2A22]">
                    <Globe className="h-4 w-4 text-zinc-500" /> 次要外部對照（Vercel Web Analytics）
                  </h3>
                  <span className="text-[11px] font-normal text-zinc-400">
                    {traffic.month}・前端腳本統計（易受廣告封鎖器影響，供交叉參考）
                  </span>
                </div>
                <div className="mb-4 grid gap-3 sm:grid-cols-2">
                  <div className="border border-[#EEF2F0] bg-[#FAFCFB] p-3.5">
                    <div className="text-[11px] text-zinc-500">每日不重複訪客合計</div>
                    <div className="mt-1 font-jost text-2xl font-bold text-[#1A2A22]">{traffic.visitors.toLocaleString()}</div>
                  </div>
                  <div className="border border-[#EEF2F0] bg-[#FAFCFB] p-3.5">
                    <div className="text-[11px] text-zinc-500">總瀏覽次數</div>
                    <div className="mt-1 font-jost text-2xl font-bold text-[#1A2A22]">{traffic.pageviews.toLocaleString()}</div>
                  </div>
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  {([
                    ["來源國家", traffic.countries, (l: string) => COUNTRY_LABEL[l] ?? l],
                    ["外部連結來源", traffic.referrers, (l: string) => l || "直接進入"],
                  ] as [string, AggregateRow[], (l: string) => string][]).map(([title, rows, format]) => (
                    <div key={title} className="border border-[#EEF2F0] bg-white">
                      <h4 className="border-b border-[#EEF2F0] px-3.5 py-2 text-xs font-bold text-[#1A2A22]">{title}</h4>
                      <ul className="divide-y divide-[#F5F8F6]">
                        {rows.length ? rows.map(row => (
                          <li key={row.label} className="flex items-center justify-between gap-3 px-3.5 py-2 text-xs">
                            <span className="truncate text-[#3F5147]" title={row.label}>{format(row.label)}</span>
                            <span className="shrink-0 font-jost font-bold text-[#1A2A22]">
                              {row.visitors.toLocaleString()}
                              <span className="ml-1 font-sans text-[10px] font-normal text-zinc-400">
                                人／{row.count.toLocaleString()} 次
                              </span>
                            </span>
                          </li>
                        )) : (
                          <li className="px-3.5 py-4 text-center text-xs text-zinc-400">尚無資料</li>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {trafficNote && (
              <div className="mb-8 border border-[#DDE3DF] bg-white p-4 text-xs text-zinc-500">
                外部對照（Vercel Analytics）：{trafficNote}
              </div>
            )}

            <div className="border-t border-[#DDE3DF] pt-4 text-right">
              <p className="text-[11px] leading-relaxed text-zinc-400">
                全站歷史累計呼叫 {grandTotal.toLocaleString()} 次 · 伺服器端 IP 匿名國碼解析 · LINUS 住好日
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
