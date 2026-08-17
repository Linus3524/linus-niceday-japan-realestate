import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, LoaderCircle, RefreshCw } from "lucide-react";

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
  "market-lookup": "市場行情查詢",
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
}

interface AggregateRow { label: string; count: number; visitors: number }

interface TrafficSummary {
  month: string;
  visitors: number;
  pageviews: number;
  countries: AggregateRow[];
  pages: AggregateRow[];
  referrers: AggregateRow[];
  events: AggregateRow[];
}

const EVENT_LABEL: Record<string, string> = {
  "calculator-applied": "把需求帶入計算機",
  "rent-analysis-submitted": "送出 AI 需求分析",
};

function monthOptions() {
  const options: string[] = [];
  const now = new Date();
  for (let back = 0; back < 12; back += 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - back, 1));
    options.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return options;
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

  const load = async (activeToken: string, targetMonth: string) => {
    if (!activeToken) return;
    setLoading(true);
    setError(null);
    setTrafficNote(null);

    const usage = fetch(`/api/usage-stats?token=${encodeURIComponent(activeToken)}&month=${targetMonth}`);
    const flow = fetch(`/api/vercel-analytics?token=${encodeURIComponent(activeToken)}&month=${targetMonth}`);

    try {
      const response = await usage;
      if (response.status === 401) throw new Error("Token 不正確。");
      if (response.status === 503) throw new Error("伺服器尚未設定 ANALYTICS_TOKEN 或 Upstash，請確認環境變數。");
      if (!response.ok) throw new Error(`讀取失敗（HTTP ${response.status}）。`);
      setData(await response.json());
    } catch (err: any) {
      setError(err?.message || "讀取失敗。");
      setData(null);
    }

    try {
      const response = await flow;
      if (response.ok) {
        setTraffic(await response.json());
      } else {
        const body = await response.json().catch(() => null);
        // 501 = 還沒設定 token（待辦），其餘才是真的故障。
        setTrafficNote(body?.error || `流量數據讀取失敗（HTTP ${response.status}）。`);
        setTraffic(null);
      }
    } catch {
      setTrafficNote("流量數據讀取失敗。");
      setTraffic(null);
    }

    setLoading(false);
  };

  useEffect(() => { load(token, month); }, [token, month]);

  const features = useMemo(() => {
    if (!data) return [];
    // 有出現在任何一個維度裡的功能都要顯示，才不會漏掉這個月剛新增的項目。
    const found = new Set<string>([
      ...Object.keys(data.total),
      ...Object.values(data.daily).flatMap(v => Object.keys(v)),
      ...Object.values(data.geo).flatMap(v => Object.keys(v)),
    ]);
    return [...found].sort();
  }, [data]);

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

  if (!token) {
    return (
      <div className="min-h-screen bg-[#F5F8F6] px-4 py-16 font-sans">
        <div className="mx-auto max-w-md border border-[#DDE3DF] bg-white p-8">
          <h1 className="font-serif text-2xl font-bold text-[#1A2A22]">後台使用量</h1>
          <p className="mt-2 text-sm text-zinc-500">請輸入管理權杖（ANALYTICS_TOKEN）。</p>
          <input
            type="password"
            value={tokenInput}
            onChange={e => setTokenInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && tokenInput.trim()) { sessionStorage.setItem(TOKEN_STORAGE_KEY, tokenInput.trim()); setToken(tokenInput.trim()); } }}
            placeholder="貼上 token 後按 Enter"
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
              onClick={() => { sessionStorage.removeItem(TOKEN_STORAGE_KEY); setToken(""); }}
              className="h-9 border border-[#C9D8D1] bg-white px-3 text-xs text-zinc-500 hover:border-[#00a174]"
            >
              登出
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 border border-[#E4C9A8] bg-[#FBF6EF] p-4 text-sm text-[#7A5B36]">{error}</div>
        )}

        {/* 流量區：訪客與瀏覽數來自 Vercel Web Analytics */}
        {traffic && (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-bold text-[#1A2A22]">
              網站流量
              <span className="ml-2 font-normal text-xs text-zinc-400">{traffic.month}・來自 Vercel</span>
            </h2>
            <div className="mb-3 grid gap-3 sm:grid-cols-2">
              <div className="border border-[#DDE3DF] bg-white p-5">
                <div className="text-xs text-zinc-500">不重複訪客</div>
                <div className="mt-1 font-jost text-3xl font-bold text-[#1A2A22]">{traffic.visitors.toLocaleString()}</div>
              </div>
              <div className="border border-[#DDE3DF] bg-white p-5">
                <div className="text-xs text-zinc-500">總瀏覽次數</div>
                <div className="mt-1 font-jost text-3xl font-bold text-[#1A2A22]">{traffic.pageviews.toLocaleString()}</div>
              </div>
            </div>
            <div className="grid gap-3 lg:grid-cols-3">
              {([
                ["來源國家", traffic.countries, (l: string) => COUNTRY_LABEL[l] ?? l],
                ["熱門頁面", traffic.pages, (l: string) => l],
                ["連結來源", traffic.referrers, (l: string) => l || "直接進入"],
              ] as [string, AggregateRow[], (l: string) => string][]).map(([title, rows, format]) => (
                <div key={title} className="border border-[#DDE3DF] bg-white">
                  <h3 className="border-b border-[#DDE3DF] px-4 py-2.5 text-xs font-bold text-[#1A2A22]">{title}</h3>
                  <ul className="divide-y divide-[#F5F8F6]">
                    {rows.length ? rows.map(row => (
                      <li key={row.label} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
                        <span className="truncate text-[#3F5147]" title={row.label}>{format(row.label)}</span>
                        <span className="shrink-0 font-jost font-bold text-[#1A2A22]">{row.count.toLocaleString()}</span>
                      </li>
                    )) : (
                      <li className="px-4 py-6 text-center text-xs text-zinc-400">還沒有資料</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
            {traffic.events.length > 0 && (
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
            網站流量：{trafficNote}
          </div>
        )}

        {data && (
          <>
            <h2 className="mb-3 text-sm font-bold text-[#1A2A22]">
              功能使用次數
              <span className="ml-2 font-normal text-xs text-zinc-400">伺服器端實際呼叫</span>
            </h2>
            <div className="mb-6 grid gap-3 sm:grid-cols-3">
              {features.map(feature => (
                <div key={feature} className="border border-[#DDE3DF] bg-white p-5">
                  <div className="text-xs text-zinc-500">{FEATURE_LABEL[feature] ?? feature}</div>
                  <div className="mt-1 font-jost text-3xl font-bold text-[#1A2A22]">
                    {(data.total[feature] ?? 0).toLocaleString()}
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-400">累計總次數（所有月份）</div>
                </div>
              ))}
            </div>

            <p className="mb-6 text-xs text-zinc-500">
              上方卡片為累計總數；下方兩張表是 {data.month} 這個月的明細。
              這一區只算伺服器端真正被呼叫的次數，擋廣告的外掛擋不掉，數字比前端事件可靠。
            </p>

            <section className="mb-6 border border-[#DDE3DF] bg-white">
              <h2 className="border-b border-[#DDE3DF] px-5 py-3 text-sm font-bold text-[#1A2A22]">每日次數</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#EEF2F0] text-left text-xs text-zinc-500">
                      <th className="px-5 py-2 font-medium">日期</th>
                      {features.map(f => <th key={f} className="px-5 py-2 text-right font-medium">{FEATURE_LABEL[f] ?? f}</th>)}
                      <th className="px-5 py-2 text-right font-medium">合計</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyRows(data.daily, features).map(row => (
                      <tr key={row.day} className="border-b border-[#F5F8F6] last:border-0">
                        <td className="px-5 py-2 text-[#1A2A22]">{data.month}-{row.day}</td>
                        {row.counts.map((count, index) => (
                          <td key={index} className="px-5 py-2 text-right font-jost text-[#3F5147]">{count || "—"}</td>
                        ))}
                        <td className="px-5 py-2 text-right font-jost font-bold text-[#1A2A22]">{row.sum}</td>
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
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#EEF2F0] text-left text-xs text-zinc-500">
                      <th className="px-5 py-2 font-medium">國家</th>
                      {features.map(f => <th key={f} className="px-5 py-2 text-right font-medium">{FEATURE_LABEL[f] ?? f}</th>)}
                      <th className="px-5 py-2 text-right font-medium">合計</th>
                    </tr>
                  </thead>
                  <tbody>
                    {geoRows.map(row => (
                      <tr key={row.country} className="border-b border-[#F5F8F6] last:border-0">
                        <td className="px-5 py-2 text-[#1A2A22]">
                          {COUNTRY_LABEL[row.country] ?? row.country}
                          {COUNTRY_LABEL[row.country] && row.country !== "unknown" && (
                            <span className="ml-1.5 font-jost text-[11px] text-zinc-400">{row.country}</span>
                          )}
                        </td>
                        {row.counts.map((count, index) => (
                          <td key={index} className="px-5 py-2 text-right font-jost text-[#3F5147]">{count || "—"}</td>
                        ))}
                        <td className="px-5 py-2 text-right font-jost font-bold text-[#1A2A22]">{row.sum}</td>
                      </tr>
                    ))}
                    {!geoRows.length && (
                      <tr><td colSpan={features.length + 2} className="px-5 py-8 text-center text-sm text-zinc-400">這個月還沒有資料</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <p className="mt-4 text-[11px] leading-relaxed text-zinc-400">
              全站累計 {grandTotal.toLocaleString()} 次。國家來自 Vercel 的 IP 國碼標頭，
              本站不儲存 IP 位址與使用者輸入的內容。
            </p>
          </>
        )}
      </div>
    </div>
  );
}
