import { Brain, Share2, Target } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import type { QuizSummary } from "../lib/quizMetrics";

/**
 * 後台「心理測驗」區塊（你是哪種東京區民？，網址 /quiz/）。
 *
 * 地區名稱與「系」不寫死在網站裡：測驗是另一個專案，增減地區時網站不必跟著改。
 * 讀測驗 API 的公開資料 /quiz/api/quiz?op=public（經 rewrite 轉接，與後台同源）；讀不到就顯示地區代號。
 */

interface AreaInfo { name: string; family: string }
interface OptionInfo { id: string; label: string }
interface QuestionInfo { id: string; prompt: string; options: OptionInfo[]; variants?: { id: string; prompt: string; options: OptionInfo[] }[] }

const RATING_LABEL: Record<string, string> = { "2": "超準", "1": "有點像", "0": "不太像" };
const REASON_LABEL: Record<string, string> = {
  rent: "房租感覺不對", vibe: "氣氛不像我", commute: "通勤不對", stereo: "偏見太重了",
};
const SHARE_LABEL: Record<string, string> = { native: "手機分享選單", copy: "複製連結", image: "分享卡圖片" };
const CTA_LABEL: Record<string, string> = {
  line: "加 LINE 諮詢", wechat: "複製 WeChat", threads: "Threads", instagram: "Instagram",
  facebook: "Facebook", email: "Email", site: "分享頁 → 前往網站",
};

const sum = (record: Record<string, number> | undefined) =>
  Object.values(record ?? {}).reduce((total, value) => total + (Number(value) || 0), 0);
const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0);
const BRANCH_LABEL: Record<string, string> = { direction: "電車方向", street: "街區日常", evening: "下班夜晚", weekend: "週末生活", hub: "都會大站", shitamachi: "下町日常" };

/** 一題（或追問題的一個版本）的 A–D 選項比例色條；滑鼠移上去看選項內容。 */
function OptionBar({ counts, options }: { counts: Record<string, number>; options: OptionInfo[] }) {
  const total = sum(counts);
  return (
    <div className="flex h-5 w-full overflow-hidden bg-[#EEF2F0]">
      {["a", "b", "c", "d"].map((option, k) => {
        const share = pct(counts[option] ?? 0, total);
        if (!share) return null;
        const label = options.find(o => o.id === option)?.label;
        return (
          <span
            key={option}
            title={`${option.toUpperCase()}${label ? `　${label}` : ""}：${counts[option]} 次`}
            className="flex items-center justify-center font-jost text-xs font-bold text-white"
            style={{ width: `${share}%`, backgroundColor: ["#00A174", "#0284C7", "#9333EA", "#E94E2B"][k] }}
          >
            {share >= 8 ? `${option.toUpperCase()} ${share}%` : ""}
          </span>
        );
      })}
    </div>
  );
}

function useQuizMeta() {
  const [areas, setAreas] = useState<Record<string, AreaInfo>>({});
  const [questions, setQuestions] = useState<QuestionInfo[]>([]);
  useEffect(() => {
    let alive = true;
    // 測驗的公開資料（地名、系、題目文字）：計分與結果文案不公開後，data/*.json 已不在網站上，改讀測驗 API
    fetch("/quiz/api/quiz?op=public&lang=zh").then(r => r.json()).then(pub => {
      if (!alive) return;
      const familyOf = (id: string) =>
        (pub.families as { name: string; members: string[] }[]).find(f => f.members.includes(id))?.name ?? "";
      const map: Record<string, AreaInfo> = { secret: { name: "隱藏結果", family: "" } };
      for (const area of pub.areas) map[area.id] = { name: area.name_zh, family: familyOf(area.id) };
      setAreas(map);
      setQuestions((pub.questions as any[]).map(q => ({
        id: q.id,
        prompt: q.type === "followup" ? "（追問題：依前面答案分成不同版本）" : q.prompt,
        options: q.type === "followup" ? [] : q.options.map((o: any) => ({ id: o.id, label: String(o.label).split("\n")[0] })),
        variants: q.type === "followup"
          ? q.variants.map((v: any) => ({ id: v.variant_id, prompt: v.prompt, options: v.options.map((o: any) => ({ id: o.id, label: String(o.label).split("\n")[0] })) }))
          : undefined,
      })));
    }).catch(() => {});
    return () => { alive = false; };
  }, []);
  return { areas, questions };
}

const LANG_TABS = [["all", "全部"], ["zh", "中文介面"], ["ja", "日文介面"]] as const;
type LangTab = (typeof LANG_TABS)[number][0];

/**
 * 外層：語言切換＋中日對照。語言是玩家「開始作答時」選的介面語言；
 * 2026-10-05 之前的資料沒有分語言，只會出現在「全部」。
 */
export function QuizStatsSection({ quiz }: { quiz: QuizSummary | null | undefined }) {
  const [tab, setTab] = useState<LangTab>("all");
  const [period, setPeriod] = useState<"day" | "month" | "cumulative">("month");
  const [date, setDate] = useState("");
  if (!quiz) {
    return (
      <section className="mb-8">
        <Heading month="" />
        <div className="border border-[#DDE3DF] bg-white p-5 text-xs text-[#66736C] shadow-sm">心理測驗統計讀取失敗。</div>
      </section>
    );
  }
  const monthly = tab === "all" ? quiz : quiz.byLang?.[tab] ?? null;
  const dates = Object.keys(monthly?.daily ?? {}).sort();
  const selectedDate = dates.includes(date) ? date : dates.at(-1) ?? "";
  const view = period === "day" ? monthly?.daily?.[selectedDate] : period === "cumulative" ? monthly?.cumulative : monthly;
  const periodLabel = period === "day" ? `${selectedDate || "每日"} · 日本時間`
    : period === "month" ? `${quiz.month} · 本月`
    : `${monthly?.cumulativeFrom ?? "—"} 至 ${monthly?.cumulativeThrough ?? "—"} · 跨月累計`;
  const heading = (
    <>
      <Heading month={quiz.month} />
      <div className="mb-5 rounded-none border border-[#DDE3DF] bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1 rounded-none bg-[#F0F4F1] p-1" aria-label="統計期間">
            {([["day", "每日"], ["month", "本月"], ["cumulative", "跨月累計"]] as const).map(([id, label]) => (
              <button key={id} type="button" aria-pressed={period === id} onClick={() => setPeriod(id)}
                className={`rounded-none px-4 py-2 text-sm font-semibold ${period === id ? "bg-[#1A2A22] text-white" : "text-[#526359] hover:bg-white"}`}>{label}</button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="quiz-language">作答語言</label>
            <select id="quiz-language" value={tab} onChange={e => setTab(e.target.value as LangTab)} className="rounded-none border border-[#DDE3DF] bg-white px-3 py-2 text-sm">
              {LANG_TABS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
            {period === "day" && dates.length > 0 && <>
              <label className="sr-only" htmlFor="quiz-date">測驗日期</label>
              <select id="quiz-date" value={selectedDate} onChange={e => setDate(e.target.value)} className="rounded-none border border-[#DDE3DF] bg-white px-3 py-2 text-sm">
                {[...dates].reverse().map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </>}
          </div>
        </div>
        <p className="mt-3 text-sm font-semibold text-[#1A2A22]">正在查看：{periodLabel} · {LANG_TABS.find(([id]) => id === tab)?.[1]}</p>
        <p className="mt-1 text-xs leading-relaxed text-[#66736C]">開始、完成皆為人次，包含重測；不是去重人數。跨月累計為保留月份的合計，語言以開始作答時為準。</p>
      </div>
      <div className="mb-5 grid grid-cols-2 gap-3">
        {([[`${quiz.month} 完成人次`, monthly], ["跨月累計完成人次", monthly?.cumulative]] as const).map(([label, summary]) => (
          <div key={String(label)} className="rounded-none border border-[#DDE3DF] bg-[#F7FAF8] p-4">
            <div className="text-sm text-[#526359]">{label}</div>
            <div className="mt-1 font-jost text-3xl font-bold tabular-nums text-[#1A2A22]">{summary ? Number(summary.funnel.finish ?? 0).toLocaleString() : "—"}</div>
          </div>
        ))}
      </div>
      <DailyQuizTrend quiz={monthly} selectedDate={selectedDate} onDate={d => { setDate(d); setPeriod("day"); }} />
    </>
  );
  return view
    ? <QuizStatsBody quiz={view} monthly={monthly!} heading={heading} periodLabel={periodLabel} languageCompare={<LangCompare quiz={quiz} tab={tab} onTab={setTab} />} />
    : <section className="mb-8">{heading}<p className="rounded-none border border-[#DDE3DF] bg-white p-5 text-sm text-[#66736C]">{period === "day" ? "這個月份沒有可用的逐日紀錄；可切換本月或跨月累計查看既有統計。" : "此期間的資料尚未提供。"}</p></section>;
}

function DailyQuizTrend({ quiz, selectedDate, onDate }: { quiz: QuizSummary | null; selectedDate: string; onDate: (date: string) => void }) {
  const days = Object.entries(quiz?.daily ?? {}).sort(([a], [b]) => b.localeCompare(a));
  const max = Math.max(1, ...days.map(([, q]) => q.funnel.finish ?? 0));
  return <div className="mb-5 rounded-none border border-[#DDE3DF] bg-white p-4 sm:p-5">
    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
      <h3 className="font-serif text-base font-bold text-[#1A2A22]">每日測驗人次</h3>
      <span className="text-xs text-[#66736C]">{quiz?.month} · 日本時間（UTC+9）</span>
    </div>
    <p className="mb-3 text-xs leading-relaxed text-[#66736C]">{quiz?.dailySince ? `逐日紀錄自 ${quiz.dailySince} 起；首日可能不完整，較早日期沒有逐日資料。點日期可查看當天各區比例。` : "逐日紀錄將從新版上線後第一筆測驗事件開始；既有月統計無法還原到每日。"}</p>
    {days.length ? <div className="max-h-64 overflow-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-[#F7FAF8] text-xs text-[#66736C]"><tr><th className="px-3 py-2 text-left">日期</th><th className="px-3 py-2 text-right">開始人次</th><th className="px-3 py-2 text-right">完成人次</th><th className="hidden whitespace-nowrap px-3 py-2 text-right sm:table-cell">完成／開始</th><th className="hidden w-24 px-3 py-2 text-left sm:table-cell">完成趨勢</th></tr></thead>
        <tbody className="divide-y divide-[#EEF2F0]">{days.map(([d, q]) => <tr key={d} className={selectedDate === d ? "bg-[#EAF6F0]" : "hover:bg-[#FAFCFB]"}>
          <td className="whitespace-nowrap px-3 py-2"><button className="font-jost font-semibold text-[#007B58] underline underline-offset-4" onClick={() => onDate(d)}>{d}</button></td>
          <td className="px-3 py-2 text-right font-jost tabular-nums">{q.funnel.start ?? 0}</td><td className="px-3 py-2 text-right font-jost font-bold tabular-nums">{q.funnel.finish ?? 0}</td>
          <td className="hidden px-3 py-2 text-right font-jost tabular-nums sm:table-cell">{q.funnel.start ? `${pct(q.funnel.finish ?? 0, q.funnel.start)}%` : "—"}</td>
          <td className="hidden px-3 py-2 sm:table-cell"><div className="h-2 rounded-none bg-[#EEF2F0]"><div className="h-full rounded-none bg-[#00A174]" style={{ width: `${100 * (q.funnel.finish ?? 0) / max}%` }} /></div></td>
        </tr>)}</tbody>
      </table>
    </div> : <p className="py-3 text-sm text-[#8A9590]">此月份尚無可用的逐日紀錄。</p>}
  </div>;
}

function LangCompare({ quiz, tab, onTab }: { quiz: QuizSummary; tab: LangTab; onTab: (t: LangTab) => void }) {
  const stat = (q: QuizSummary | undefined) => {
    const f = q?.funnel ?? {};
    const ratings = Object.values(q?.ratings ?? {});
    const rated = ratings.reduce((t, r) => t + sum(r), 0);
    const good = ratings.reduce((t, r) => t + (r["2"] ?? 0) + (r["1"] ?? 0), 0);
    return { start: f.start ?? 0, finish: f.finish ?? 0, rated, good, share: sum(q?.share), line: q?.cta?.line ?? 0 };
  };
  const rows = [["中文介面", stat(quiz.byLang?.zh)], ["日文介面", stat(quiz.byLang?.ja)]] as const;
  return (
    <div className="mb-4 border border-[#DDE3DF] bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-[#1A2A22]">作答語言</span>
        <div className="inline-flex border border-[#1A2A22]">
          {LANG_TABS.map(([id, label]) => (
            <button key={id} type="button" onClick={() => onTab(id)}
              className={`px-3 py-1 text-sm ${tab === id ? "bg-[#1A2A22] text-white" : "bg-white text-[#1A2A22]"}`}>
              {label}
            </button>
          ))}
        </div>
        <span className="text-xs text-[#8A9590]">以開始作答時的介面語言計；切換後，下方所有數字都只看該語言</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-xs">
          <thead>
            <tr className="border-b border-[#ECEFEC] text-left font-semibold text-[#66736C]">
              <th className="px-3 py-1.5">語言</th>
              <th className="px-3 py-1.5 text-right">開始</th>
              <th className="px-3 py-1.5 text-right">完成</th>
              <th className="px-3 py-1.5 text-right">完成率</th>
              <th className="px-3 py-1.5 text-right">覺得準</th>
              <th className="px-3 py-1.5 text-right">分享率</th>
              <th className="px-3 py-1.5 text-right">加 LINE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F8F6]">
            {rows.map(([label, r]) => (
              <tr key={label}>
                <td className="px-3 py-1.5 font-medium text-[#1A2A22]">{label}</td>
                <td className="px-3 py-1.5 text-right font-jost tabular-nums">{r.start.toLocaleString()}</td>
                <td className="px-3 py-1.5 text-right font-jost tabular-nums">{r.finish.toLocaleString()}</td>
                <td className="px-3 py-1.5 text-right font-jost tabular-nums">{r.start ? `${pct(r.finish, r.start)}%` : "—"}</td>
                <td className="px-3 py-1.5 text-right font-jost tabular-nums">{r.rated ? `${pct(r.good, r.rated)}%（${r.rated}）` : "—"}</td>
                <td className="px-3 py-1.5 text-right font-jost tabular-nums">{r.finish ? `${pct(r.share, r.finish)}%` : "—"}</td>
                <td className="px-3 py-1.5 text-right font-jost tabular-nums">{r.line.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function QuizStatsBody({ quiz, monthly, heading, periodLabel, languageCompare }: { quiz: QuizSummary; monthly: QuizSummary; heading: ReactNode; periodLabel: string; languageCompare: ReactNode }) {
  const { areas, questions } = useQuizMeta();
  const nameOf = (id: string) => areas[id]?.name ?? id;
  const [search, setSearch] = useState("");
  const distribution = [...new Set([...Object.keys(areas), ...Object.keys(quiz.results), ...Object.keys(monthly.results), ...Object.keys(monthly.cumulative?.results ?? {})])]
    .filter(id => nameOf(id).toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => (quiz.results[b] ?? 0) - (quiz.results[a] ?? 0) || nameOf(a).localeCompare(nameOf(b), "zh-Hant"));
  const shareOf = (id: string, q: QuizSummary | undefined) => {
    const total = sum(q?.results);
    return total ? `${pct(q?.results[id] ?? 0, total)}%` : "—";
  };

  const rows = useMemo(() => {
    if (!quiz) return [];
    const ids = new Set([...Object.keys(quiz.results), ...Object.keys(quiz.ratings)]);
    const finished = sum(quiz.results);
    return [...ids].map(id => {
      const rating = quiz.ratings[id] ?? {};
      const rated = sum(rating);
      const topClaim = Object.entries(quiz.claims[id] ?? {}).sort((a, b) => b[1] - a[1])[0];
      const topReason = Object.entries(quiz.reasons[id] ?? {}).sort((a, b) => b[1] - a[1])[0];
      const topPrefer = Object.entries(quiz.prefers?.[id] ?? {}).sort((a, b) => b[1] - a[1])[0];
      return {
        id,
        count: quiz.results[id] ?? 0,
        share: pct(quiz.results[id] ?? 0, finished),
        rated,
        great: rating["2"] ?? 0,
        ok: rating["1"] ?? 0,
        bad: rating["0"] ?? 0,
        hit: pct((rating["2"] ?? 0) + (rating["1"] ?? 0), rated),
        topClaim,
        topReason,
        topPrefer,
      };
    }).sort((a, b) => b.count - a.count || b.rated - a.rated);
  }, [quiz]);

  const f = quiz.funnel;
  const start = f.start ?? 0;
  const finish = f.finish ?? 0;
  const ratedTotal = rows.reduce((t, r) => t + r.rated, 0);
  const goodTotal = rows.reduce((t, r) => t + r.great + r.ok, 0);
  const funnelCards = [
    ["開始作答", start, ""],
    ["做到一半", f.mid ?? 0, start ? `${pct(f.mid ?? 0, start)}% 的開始者` : ""],
    ["完成測驗", finish, start ? `完成／開始 ${pct(finish, start)}%` : ""],
    ["回饋覺得準", goodTotal, ratedTotal ? `${pct(goodTotal, ratedTotal)}%（${ratedTotal} 次回饋）` : "還沒有回饋"],
    ["分享", sum(quiz.share), finish ? `${pct(sum(quiz.share), finish)}% 的完成者` : ""],
    ["點加 LINE", quiz.cta.line ?? 0, finish ? `${pct(quiz.cta.line ?? 0, finish)}% 的完成者` : ""],
  ] as const;

  return (
    <section className="mb-8">
      {heading}

      <h3 className="mb-3 text-sm font-bold text-[#1A2A22]">{periodLabel} · 作答與回饋</h3>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {funnelCards.map(([label, value, note]) => (
          <div key={label} className="border border-[#DDE3DF] bg-white p-3.5 shadow-sm">
            <div className="text-sm text-[#66736C]">{label}</div>
            <div className="mt-1 font-jost text-2xl font-bold tabular-nums text-[#1A2A22]">{value.toLocaleString()}</div>
            {note && <div className="mt-0.5 text-xs text-[#8A9590]">{note}</div>}
          </div>
        ))}
      </div>

      <div className="mb-5 rounded-none border border-[#DDE3DF] bg-white p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 font-serif text-base font-bold text-[#1A2A22]"><Target className="h-4 w-4 text-[#00A174]" />各區結果比例</h3>
          <input aria-label="搜尋地區結果" placeholder="搜尋地區" value={search} onChange={e => setSearch(e.target.value)} className="w-40 rounded-none border border-[#DDE3DF] px-3 py-2 text-sm" />
        </div>
        <p className="mb-3 text-xs leading-relaxed text-[#66736C]">所選期間：{periodLabel}。各欄比例分母為該期間有地區結果的完成次數；本月與累計分開計算。</p>
        <div className="max-h-[440px] overflow-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="sticky top-0 z-10 bg-[#F7FAF8] text-xs text-[#66736C]"><tr><th className="sticky left-0 z-20 bg-[#F7FAF8] px-3 py-3 text-left">結果</th><th className="px-3 py-3 text-right">所選期間次數</th><th className="px-3 py-3 text-right">所選期間比例</th><th className="px-3 py-3 text-right">本月比例</th><th className="px-3 py-3 text-right">累計比例</th></tr></thead>
            <tbody className="divide-y divide-[#EEF2F0]">{distribution.map(id => <tr key={id} className="hover:bg-[#FAFCFB]">
              <td className="sticky left-0 whitespace-nowrap bg-white px-3 py-3 font-medium text-[#1A2A22]">{nameOf(id)}{areas[id]?.family && <small className="block text-xs font-normal text-[#8A9590]">{areas[id].family}</small>}</td>
              <td className="px-3 py-3 text-right font-jost font-bold tabular-nums">{(quiz.results[id] ?? 0).toLocaleString()}</td>
              <td className="px-3 py-3 text-right font-jost font-bold tabular-nums text-[#007B58]">{shareOf(id, quiz)}</td>
              <td className="px-3 py-3 text-right font-jost tabular-nums">{shareOf(id, monthly)}</td>
              <td className="px-3 py-3 text-right font-jost tabular-nums">{shareOf(id, monthly.cumulative)}</td>
            </tr>)}</tbody>
          </table>
          {!distribution.length && <p className="py-6 text-center text-sm text-[#8A9590]">{search ? "沒有符合的地區" : "此期間尚無地區結果"}</p>}
        </div>
      </div>

      <details className="mb-5 rounded-none border border-[#DDE3DF] bg-[#F7FAF8] p-4 sm:p-5">
        <summary className="cursor-pointer text-sm font-semibold text-[#1A2A22]">詳細回饋與計分診斷 <span className="font-normal text-[#66736C]">· 展開查看各區回饋、來源、追問與版本</span></summary>
        <div className="mt-4">
      <details className="mb-4"><summary className="mb-3 cursor-pointer text-sm font-semibold">本月中文／日文對照</summary>{languageCompare}</details>

      {/* 各區結果與準確度 */}
      <div className="mb-4 border border-[#DDE3DF] bg-white p-5 shadow-sm">
        <h3 className="mb-3 flex items-center gap-1.5 border-b border-[#ECEFEC] pb-2.5 font-serif text-sm font-bold text-[#1A2A22]">
          <Target className="h-4 w-4 text-[#00A174]" /> 各區結果與準確度
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-xs">
            <thead>
              <tr className="border-b border-[#ECEFEC] text-left font-semibold text-[#66736C]">
                <th className="px-3 py-2">結果</th>
                <th className="px-3 py-2 text-right">次數</th>
                <th className="px-3 py-2">佔比</th>
                <th className="px-3 py-2 text-center">超準／有點像／不太像</th>
                <th className="px-3 py-2 text-right">覺得準</th>
                <th className="px-3 py-2">不準時自認像</th>
                <th className="px-3 py-2">最常見原因</th>
                <th className="px-3 py-2">看了第 2、3 名改選</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F8F6]">
              {rows.map(row => (
                <tr key={row.id} className="hover:bg-[#FAFCFB]">
                  <td className="px-3 py-2 font-medium text-[#1A2A22]">
                    {nameOf(row.id)}
                    {areas[row.id]?.family && <span className="ml-1.5 text-xs font-normal text-[#8A9590]">{areas[row.id].family}</span>}
                  </td>
                  <td className="px-3 py-2 text-right font-jost font-bold tabular-nums">{row.count.toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-24 overflow-hidden bg-[#EEF2F0]"><span className="block h-full bg-[#00A174]" style={{ width: `${Math.min(100, row.share)}%` }} /></span>
                      <span className="font-jost tabular-nums text-[#3F5147]">{row.share}%</span>
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center font-jost tabular-nums text-[#3F5147]">
                    {row.rated ? `${row.great}／${row.ok}／${row.bad}` : <span className="text-[#8A9590]">—</span>}
                  </td>
                  <td className={`px-3 py-2 text-right font-jost font-bold tabular-nums ${row.rated && row.hit < 50 ? "text-[#E94E2B]" : "text-[#1A2A22]"}`}>
                    {row.rated ? `${row.hit}%` : <span className="font-normal text-[#8A9590]">—</span>}
                  </td>
                  <td className="px-3 py-2 text-[#3F5147]">
                    {row.topClaim ? `${nameOf(row.topClaim[0])}（${row.topClaim[1]}）` : <span className="text-[#8A9590]">—</span>}
                  </td>
                  <td className="px-3 py-2 text-[#3F5147]">
                    {row.topReason ? `${REASON_LABEL[row.topReason[0]] ?? row.topReason[0]}（${row.topReason[1]}）` : <span className="text-[#8A9590]">—</span>}
                  </td>
                  <td className="px-3 py-2 text-[#3F5147]">
                    {row.topPrefer ? `${nameOf(row.topPrefer[0])}（${row.topPrefer[1]}）` : <span className="text-[#8A9590]">—</span>}
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr><td colSpan={8} className="px-3 py-8 text-center text-[#8A9590]">此期間尚無測驗結果</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-[#8A9590]">
          「覺得準」＝超準＋有點像。紅字代表回饋裡覺得準的不到一半；「不準時自認像」是玩家覺得自己其實比較像的地方，是調整計分最直接的依據；「看了第 2、3 名改選」是玩家點開另外兩個推薦後，按「我覺得這個更像我」最多的地方。
        </p>
      </div>

      <SourceTable quiz={quiz} />
      <ResidencyTable quiz={quiz} nameOf={nameOf} />
      <ScoringCompare quiz={quiz} nameOf={nameOf} />

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        {/* 每題選項分布 */}
        <div className="border border-[#DDE3DF] bg-white p-5 shadow-sm">
          <h3 className="mb-3 flex items-center gap-1.5 border-b border-[#ECEFEC] pb-2.5 font-serif text-sm font-bold text-[#1A2A22]">
            <Brain className="h-4 w-4 text-[#7E22CE]" /> 每題選項分布（完成者）
          </h3>
          <ul className="space-y-3">
            {Array.from({ length: Math.max(12, questions.length) }, (_, index) => {
              const counts = quiz.options[String(index + 1)] ?? {};
              const q = questions[index];
              return (
                <li key={index} className="text-xs">
                  <div className="mb-1 flex gap-2 text-[#3F5147]">
                    <span className="shrink-0 font-jost font-bold text-[#1A2A22]">Q{index + 1}</span>
                    <span className="truncate" title={q?.prompt}>{q?.prompt ?? ""}</span>
                  </div>
                  {q?.variants ? (
                    <>
                      <OptionBar counts={counts} options={[]} />
                      <p className="mt-1 text-xs text-[#8A9590]">↑ 各版本合計（字母在不同版本代表不同內容，僅供參考）；題庫 0.9.0 起依版本分開：</p>
                      <ul className="mt-1 space-y-1.5 border-l-2 border-[#ECEFEC] pl-2">
                        {q.variants.map(v => {
                          const vc = quiz.branches?.[String(index + 1)]?.[v.id] ?? {};
                          return (
                            <li key={v.id}>
                              <div className="mb-0.5 flex gap-2 text-sm text-[#3F5147]">
                                <span className="shrink-0 font-bold">{BRANCH_LABEL[v.id] ?? v.id}</span>
                                <span className="truncate" title={v.prompt}>{v.prompt}</span>
                                <span className="ml-auto shrink-0 font-jost text-[#8A9590]">{sum(vc)} 人次</span>
                              </div>
                              <OptionBar counts={vc} options={v.options} />
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  ) : (
                    <OptionBar counts={counts} options={q?.options ?? []} />
                  )}
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-[#8A9590]">選項比例偏低時，先確認樣本量、追問分支及題庫版本，再評估文案是否需要調整。歷史選項顯示目前題庫文字，跨版本字母不一定代表同一內容。</p>
        </div>

        {/* 分享與聯絡 */}
        <div className="border border-[#DDE3DF] bg-white p-5 shadow-sm">
          <h3 className="mb-3 flex items-center gap-1.5 border-b border-[#ECEFEC] pb-2.5 font-serif text-sm font-bold text-[#1A2A22]">
            <Share2 className="h-4 w-4 text-[#0284C7]" /> 分享與聯絡
          </h3>
          <List title="分享方式" record={quiz.share} labels={SHARE_LABEL} />
          <List title="結果頁按鈕" record={quiz.cta} labels={CTA_LABEL} />
          <List
            title="其他"
            record={{
              "朋友打開分享頁": f.shared_view ?? 0,
              "重新測驗": f.retake ?? 0,
              "出現隱藏結果入口": f.secret_offer ?? 0,
              "翻開隱藏結果": f.secret_open ?? 0,
              ...(quiz.distinctCodes != null ? { "不同答案組合": quiz.distinctCodes } : {}),
            }}
            labels={{}}
          />
          {Object.keys(quiz.versions).length > 1 && (
            <List title="題目版本（完成數）" record={quiz.versions} labels={{}} />
          )}
        </div>
      </div>
        </div>
      </details>
    </section>
  );
}

const SOURCE_LABEL: Record<string, string> = {
  threads: "Threads", instagram: "Instagram", facebook: "Facebook", line: "LINE", x: "X（Twitter）", google: "Google 搜尋",
  share: "朋友分享的結果連結", site: "住好日官網", direct: "直接進入（無來源）", other: "其他網站", ig: "Instagram（?from=ig）",
};

const LIVE_GROUPS = [["jp", "住在日本"], ["tokyo", "住在東京（日文版）"], ["plan", "打算搬去日本"], ["none", "沒有計畫"]] as const;

/** 玩家居住狀況：各族群人數、整體覺得準，以及各區在不同族群的「覺得準」。2026-10-11 起才有資料。 */
function ResidencyTable({ quiz, nameOf }: { quiz: QuizSummary; nameOf: (id: string) => string }) {
  const res = quiz.residency ?? {};
  const answered = LIVE_GROUPS.reduce((t, [k]) => t + (res[k]?.count ?? 0), 0);
  if (!answered) return null;
  const MIN = 5;
  const hit = (r: Record<string, number> | undefined) => {
    const rated = sum(r), good = (r?.["2"] ?? 0) + (r?.["1"] ?? 0);
    return { rated, good, text: rated >= MIN ? `${pct(good, rated)}%` : rated ? `${rated} 筆` : "—", ok: rated >= MIN, low: rated >= MIN && pct(good, rated) < 50 };
  };
  const groupAll = (k: string) => {
    const merged: Record<string, number> = {};
    for (const r of Object.values(res[k]?.ratings ?? {})) for (const [v, n] of Object.entries(r)) merged[v] = (merged[v] ?? 0) + n;
    return merged;
  };
  // 各區：至少一個族群有 5 筆以上回饋才列出，依回饋總數排序
  const areaIds = [...new Set(LIVE_GROUPS.flatMap(([k]) => Object.keys(res[k]?.ratings ?? {})))]
    .filter(id => LIVE_GROUPS.some(([k]) => sum(res[k]?.ratings?.[id]) >= MIN))
    .sort((a, b) => LIVE_GROUPS.reduce((t, [k]) => t + sum(res[k]?.ratings?.[b]), 0) - LIVE_GROUPS.reduce((t, [k]) => t + sum(res[k]?.ratings?.[a]), 0));
  const cellCls = (h: ReturnType<typeof hit>) => `px-3 py-1.5 text-right tabular-nums ${!h.ok ? "text-[#B5BFBA]" : h.low ? "font-bold text-[#E94E2B]" : "text-[#1A2A22]"}`;
  return (
    <div className="mb-4 border border-[#DDE3DF] bg-white p-5 shadow-sm">
      <h3 className="mb-3 flex items-center gap-1.5 border-b border-[#ECEFEC] pb-2.5 font-serif text-sm font-bold text-[#1A2A22]">
        <Target className="h-4 w-4 text-[#9333EA]" /> 玩家居住狀況
      </h3>
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {LIVE_GROUPS.map(([k, label]) => {
          const n = res[k]?.count ?? 0, h = hit(groupAll(k));
          return (
            <div key={k} className="border border-[#ECEFEC] p-3">
              <div className="text-sm text-[#66736C]">{label}</div>
              <div className="mt-0.5 font-jost text-xl font-bold tabular-nums text-[#1A2A22]">{n.toLocaleString()}<span className="ml-1 text-sm font-normal text-[#8A9590]">{pct(n, answered)}%</span></div>
              <div className="text-xs text-[#8A9590]">覺得準 {h.ok ? `${pct(h.good, h.rated)}%（${h.rated}）` : h.rated ? `回饋 ${h.rated} 筆` : "—"}</div>
            </div>
          );
        })}
      </div>
      {areaIds.length > 0 && (
        <div className="max-h-[360px] overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-[#ECEFEC] text-left font-semibold text-[#66736C]">
                <th className="whitespace-nowrap px-3 py-1.5">各區覺得準</th>
                {LIVE_GROUPS.map(([k, label]) => <th key={k} className="whitespace-nowrap px-3 py-1.5 text-right">{label}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F8F6]">
              {areaIds.map(id => (
                <tr key={id}>
                  <td className="whitespace-nowrap px-3 py-1.5 text-[#3F5147]">{nameOf(id)}</td>
                  {LIVE_GROUPS.map(([k]) => { const h = hit(res[k]?.ratings?.[id]); return <td key={k} className={cellCls(h)}>{h.text}</td>; })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs leading-relaxed text-[#8A9590]">
        玩家在結果頁評分後、或分享前的小視窗裡自選（每台裝置問一次，可略過），所以只代表有回答的人。住在日本的人比較懂各區實際樣子：他們覺得不準的區，是計分最該調整的地方。
        各區只列出某個族群有 5 筆以上回饋的；少於 5 筆只顯示筆數、紅字是覺得準不到一半。2026-10-11 起才有這項資料。
      </p>
    </div>
  );
}

/** 作答從哪裡進來：開始、完成與完成率。2026-10-11 之後才有資料。 */
function SourceTable({ quiz }: { quiz: QuizSummary }) {
  const rows = Object.entries(quiz.sources ?? {}).sort((a, b) => b[1].start - a[1].start || b[1].finish - a[1].finish);
  if (!rows.length) return null;
  const totalStart = rows.reduce((t, [, r]) => t + r.start, 0);
  const max = Math.max(...rows.map(([, r]) => r.start), 1);
  return (
    <div className="mb-4 border border-[#DDE3DF] bg-white p-5 shadow-sm">
      <h3 className="mb-3 flex items-center gap-1.5 border-b border-[#ECEFEC] pb-2.5 font-serif text-sm font-bold text-[#1A2A22]">
        <Share2 className="h-4 w-4 text-[#E94E2B]" /> 作答從哪裡進來
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#ECEFEC] text-left font-semibold text-[#66736C]">
              <th className="px-3 py-1.5">來源</th>
              <th className="px-3 py-1.5">開始作答</th>
              <th className="whitespace-nowrap px-3 py-1.5 text-right">完成</th>
              <th className="whitespace-nowrap px-3 py-1.5 text-right">完成率</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F8F6]">
            {rows.map(([id, r]) => (
              <tr key={id}>
                <td className="whitespace-nowrap px-3 py-1.5 text-[#3F5147]">{SOURCE_LABEL[id] ?? `?from=${id}`}</td>
                <td className="px-3 py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="hidden h-2 shrink-0 bg-[#E94E2B]/70 sm:block" style={{ width: `max(2px, calc(min(140px, 18vw) * ${r.start / max}))` }} />
                    <span className="font-jost font-bold tabular-nums text-[#1A2A22]">{r.start.toLocaleString()}</span>
                    <span className="text-xs text-[#8A9590]">{pct(r.start, totalStart)}%</span>
                  </div>
                </td>
                <td className="px-3 py-1.5 text-right font-jost tabular-nums text-[#1A2A22]">{r.finish.toLocaleString()}</td>
                <td className="px-3 py-1.5 text-right font-jost tabular-nums text-[#3F5147]">{r.start ? `${pct(r.finish, r.start)}%` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-[#8A9590]">
        每次造訪第一次打開測驗時判斷一次：先看網址上的 ?from= 標記（例如 /quiz/?from=threads_post），再看是不是朋友分享的結果連結、是否在 Threads／IG／FB／LINE 的內建瀏覽器，最後看來源網址。
        沒有任何線索的歸「直接進入」。2026-10-11 起才有這項資料。
      </p>
    </div>
  );
}

/**
 * 計分版本比較：測驗每次調整各區判定方式會換一個日期代號，這裡並排看各版本的出現比例與「覺得準」。
 * 「未標記」＝當月總數扣掉有版本的部分（2026-10-11 之前的事件沒有帶版本）。
 */
function ScoringCompare({ quiz, nameOf }: { quiz: QuizSummary; nameOf: (id: string) => string }) {
  const revs = Object.keys(quiz.scoring ?? {}).sort();
  if (!revs.length) return null;
  const minus = (a: Record<string, number>, bs: Record<string, number>[]) =>
    Object.fromEntries(Object.entries(a).map(([k, v]) => [k, Math.max(0, v - bs.reduce((t, b) => t + (b[k] ?? 0), 0))]));
  const tagged = revs.map(r => quiz.scoring[r]);
  const untaggedResults = minus(quiz.results, tagged.map(t => t.results));
  const ratingKeys = new Set(Object.keys(quiz.ratings));
  const untaggedRatings = Object.fromEntries([...ratingKeys].map(id =>
    [id, minus(quiz.ratings[id] ?? {}, tagged.map(t => t.ratings[id] ?? {}))]));
  const cols = [
    ...(sum(untaggedResults) > 0 ? [{ key: "untagged", label: "未標記（10/11 前）", results: untaggedResults, ratings: untaggedRatings }] : []),
    ...revs.map(r => ({ key: r, label: r, results: quiz.scoring[r].results, ratings: quiz.scoring[r].ratings })),
  ];
  const latest = cols[cols.length - 1];
  const ids = [...new Set(cols.flatMap(c => Object.keys(c.results)))]
    .sort((a, b) => (latest.results[b] ?? 0) - (latest.results[a] ?? 0) || (cols[0].results[b] ?? 0) - (cols[0].results[a] ?? 0));
  const share = (c: (typeof cols)[number], id: string) => { const total = sum(c.results); return total ? ((c.results[id] ?? 0) / total) * 100 : 0; };
  const prev = cols.length > 1 ? cols[cols.length - 2] : null;
  const shown = [...cols].reverse(); // 最新版本放最左邊
  const MIN_RATED = 5; // 回饋太少時「準」沒有參考價值，不顯示百分比
  const cell = (c: (typeof cols)[number], id: string) => {
    const n = c.results[id] ?? 0, r = c.ratings[id] ?? {}, rated = sum(r);
    const good = (r["2"] ?? 0) + (r["1"] ?? 0);
    return (
      <td key={c.key} className="px-3 py-1.5 text-right tabular-nums">
        <div><span className="font-jost font-bold text-[#1A2A22]">{share(c, id).toFixed(1)}%</span><span className="ml-1 text-xs text-[#8A9590]">{n}</span></div>
        <div className="text-xs">
          {rated >= MIN_RATED
            ? <span className={pct(good, rated) < 50 ? "text-[#E94E2B]" : "text-[#00A174]"}>準 {pct(good, rated)}%（{rated}）</span>
            : <span className="text-[#B5BFBA]">{rated ? `回饋 ${rated} 筆` : "—"}</span>}
        </div>
      </td>
    );
  };
  const diff = (id: string) => {
    if (!prev) return null;
    const d = share(latest, id) - share(prev, id);
    const big = Math.abs(d) >= 1;
    return (
      <td className={`px-3 py-1.5 text-right font-jost tabular-nums ${!big ? "text-[#B5BFBA]" : d > 0 ? "text-[#0284C7]" : "text-[#E94E2B]"}`}>
        {d > 0 ? "▲" : d < 0 ? "▼" : ""}{Math.abs(d).toFixed(1)}
      </td>
    );
  };
  return (
    <div className="mb-4 border border-[#DDE3DF] bg-white p-5 shadow-sm">
      <h3 className="mb-3 flex items-center gap-1.5 border-b border-[#ECEFEC] pb-2.5 font-serif text-sm font-bold text-[#1A2A22]">
        <Target className="h-4 w-4 text-[#0284C7]" /> 計分版本比較（各區出現比例）
      </h3>
      <div className="max-h-[560px] overflow-auto">
        <table className="w-full min-w-[480px] text-xs">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="border-b border-[#ECEFEC] text-left font-semibold text-[#66736C]">
              <th className="px-3 py-1.5 align-bottom">結果</th>
              {shown.map((c, k) => [(
                <th key={c.key} className="px-3 py-1.5 text-right align-bottom">
                  <div className="whitespace-nowrap">{c.label}</div>
                  <div className="font-normal text-xs text-[#8A9590]">{sum(c.results).toLocaleString()} 人次</div>
                </th>
              ), k === 0 && prev ? <th key="diff" className="whitespace-nowrap px-3 py-1.5 text-right align-bottom">變化<div className="font-normal text-xs text-[#8A9590]">比前一版</div></th> : null])}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F8F6]">
            {ids.map(id => (
              <tr key={id}>
                <td className="w-[28%] whitespace-nowrap px-3 py-1.5 text-[#3F5147]">{nameOf(id)}</td>
                {shown.map((c, k) => [cell(c, id), k === 0 ? diff(id) : null])}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-[#8A9590]">
        測驗每次調整各區判定方式會換一個版本代號（日期）。比較同一區在不同版本的出現比例，看調整有沒有達到效果；最新版本在最左邊；「變化」是最新版本減前一版的百分點，▲變多、▼變少（差 1 以上才上色）。「準」是該版本玩家回饋覺得準的比例，括號是回饋次數，少於 5 筆不算百分比。依最新版本的出現比例排序。
      </p>
    </div>
  );
}

function Heading({ month }: { month: string }) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <Brain className="h-4.5 w-4.5 shrink-0 text-[#00A174]" />
      <h2 className="font-serif text-base font-bold text-[#1A2A22]">心理測驗：你是哪種東京區民？</h2>
      <span className="whitespace-nowrap text-xs text-[#8A9590]">{month}</span>
      <a href="/quiz/" target="_blank" rel="noopener" className="ml-auto whitespace-nowrap text-sm text-[#00A174] underline">開啟測驗</a>
    </div>
  );
}

function List({ title, record, labels }: { title: string; record: Record<string, number>; labels: Record<string, string> }) {
  const entries = Object.entries(record).sort((a, b) => b[1] - a[1]);
  return (
    <div className="mb-4 last:mb-0">
      <h4 className="mb-1 text-sm font-bold text-[#66736C]">{title}</h4>
      {entries.length ? (
        <ul className="divide-y divide-[#F5F8F6]">
          {entries.map(([key, value]) => (
            <li key={key} className="flex items-center justify-between py-1.5 text-xs">
              <span className="text-[#3F5147]">{labels[key] ?? key}</span>
              <span className="font-jost font-bold tabular-nums text-[#1A2A22]">{Number(value).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-2 text-xs text-[#8A9590]">尚無資料</p>
      )}
    </div>
  );
}
