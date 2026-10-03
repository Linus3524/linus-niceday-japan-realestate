import { Brain, Share2, Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { QuizSummary } from "../lib/quizMetrics";

/**
 * 後台「心理測驗」區塊（你是哪種東京區民？，網址 /quiz/）。
 *
 * 地區名稱與「系」不寫死在網站裡：測驗是另一個專案，增減地區時網站不必跟著改。
 * 直接讀 /quiz/data/*.json（經 rewrite 轉接，與後台同源）；讀不到就顯示地區代號。
 */

interface AreaInfo { name: string; family: string }
interface QuestionInfo { id: string; prompt: string; options: { id: string; label: string }[] }

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
const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

function useQuizMeta() {
  const [areas, setAreas] = useState<Record<string, AreaInfo>>({});
  const [questions, setQuestions] = useState<QuestionInfo[]>([]);
  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch("/quiz/data/areas.json").then(r => r.json()),
      fetch("/quiz/data/families.json").then(r => r.json()),
      fetch("/quiz/data/questions.json").then(r => r.json()),
    ]).then(([areaDoc, famDoc, qDoc]) => {
      if (!alive) return;
      const familyOf = (id: string) =>
        (famDoc.families as { name: string; members: string[] }[]).find(f => f.members.includes(id))?.name ?? "";
      const map: Record<string, AreaInfo> = { secret: { name: "隱藏結果", family: "" } };
      for (const area of areaDoc.areas ?? areaDoc) map[area.id] = { name: area.name_zh, family: familyOf(area.id) };
      setAreas(map);
      setQuestions((qDoc.questions as any[]).map(q => ({
        id: q.id,
        prompt: q.type === "followup" ? "（追問題：依前面答案分成不同版本）" : q.prompt,
        options: q.type === "followup" ? [] : q.options.map((o: any) => ({ id: o.id, label: String(o.label).split("\n")[0] })),
      })));
    }).catch(() => {});
    return () => { alive = false; };
  }, []);
  return { areas, questions };
}

export function QuizStatsSection({ quiz }: { quiz: QuizSummary | null | undefined }) {
  const { areas, questions } = useQuizMeta();
  const nameOf = (id: string) => areas[id]?.name ?? id;

  const rows = useMemo(() => {
    if (!quiz) return [];
    const ids = new Set([...Object.keys(quiz.results), ...Object.keys(quiz.ratings)]);
    const finished = sum(quiz.results);
    return [...ids].map(id => {
      const rating = quiz.ratings[id] ?? {};
      const rated = sum(rating);
      const topClaim = Object.entries(quiz.claims[id] ?? {}).sort((a, b) => b[1] - a[1])[0];
      const topReason = Object.entries(quiz.reasons[id] ?? {}).sort((a, b) => b[1] - a[1])[0];
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
      };
    }).sort((a, b) => b.count - a.count || b.rated - a.rated);
  }, [quiz]);

  if (!quiz) {
    return (
      <section className="mb-8">
        <Heading month="" />
        <div className="border border-[#DDE3DF] bg-white p-5 text-xs text-[#66736C] shadow-sm">心理測驗統計讀取失敗。</div>
      </section>
    );
  }

  const f = quiz.funnel;
  const start = f.start ?? 0;
  const finish = f.finish ?? 0;
  const ratedTotal = rows.reduce((t, r) => t + r.rated, 0);
  const goodTotal = rows.reduce((t, r) => t + r.great + r.ok, 0);
  const funnelCards = [
    ["開始作答", start, ""],
    ["做到一半", f.mid ?? 0, start ? `${pct(f.mid ?? 0, start)}% 的開始者` : ""],
    ["完成測驗", finish, start ? `完成率 ${pct(finish, start)}%` : ""],
    ["回饋覺得準", goodTotal, ratedTotal ? `${pct(goodTotal, ratedTotal)}%（${ratedTotal} 人回饋）` : "還沒有回饋"],
    ["分享", sum(quiz.share), finish ? `${pct(sum(quiz.share), finish)}% 的完成者` : ""],
    ["點加 LINE", quiz.cta.line ?? 0, finish ? `${pct(quiz.cta.line ?? 0, finish)}% 的完成者` : ""],
  ] as const;

  return (
    <section className="mb-8">
      <Heading month={quiz.month} />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {funnelCards.map(([label, value, note]) => (
          <div key={label} className="border border-[#DDE3DF] bg-white p-3.5 shadow-sm">
            <div className="text-[11px] text-[#66736C]">{label}</div>
            <div className="mt-1 font-jost text-2xl font-bold tabular-nums text-[#1A2A22]">{value.toLocaleString()}</div>
            {note && <div className="mt-0.5 text-[10px] text-[#8A9590]">{note}</div>}
          </div>
        ))}
      </div>

      {/* 各區結果與準確度 */}
      <div className="mb-4 border border-[#DDE3DF] bg-white p-5 shadow-sm">
        <h3 className="mb-3 flex items-center gap-1.5 border-b border-[#ECEFEC] pb-2.5 font-serif text-sm font-bold text-[#1A2A22]">
          <Target className="h-4 w-4 text-[#00A174]" /> 各區結果與準確度
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-xs">
            <thead>
              <tr className="border-b border-[#ECEFEC] text-left font-semibold text-[#66736C]">
                <th className="px-3 py-2">結果</th>
                <th className="px-3 py-2 text-right">次數</th>
                <th className="px-3 py-2">佔比</th>
                <th className="px-3 py-2 text-center">超準／有點像／不太像</th>
                <th className="px-3 py-2 text-right">覺得準</th>
                <th className="px-3 py-2">不準時自認像</th>
                <th className="px-3 py-2">最常見原因</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F8F6]">
              {rows.map(row => (
                <tr key={row.id} className="hover:bg-[#FAFCFB]">
                  <td className="px-3 py-2 font-medium text-[#1A2A22]">
                    {nameOf(row.id)}
                    {areas[row.id]?.family && <span className="ml-1.5 text-[10px] font-normal text-[#8A9590]">{areas[row.id].family}</span>}
                  </td>
                  <td className="px-3 py-2 text-right font-jost font-bold tabular-nums">{row.count.toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-24 overflow-hidden bg-[#EEF2F0]"><span className="block h-full bg-[#00A174]" style={{ width: `${Math.min(100, row.share * 4)}%` }} /></span>
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
                </tr>
              ))}
              {!rows.length && (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-[#8A9590]">這個月還沒有人完成測驗</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[10px] leading-relaxed text-[#8A9590]">
          「覺得準」＝超準＋有點像。紅字代表回饋裡覺得準的不到一半；「不準時自認像」是玩家覺得自己其實比較像的地方，是調整計分最直接的依據。
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        {/* 每題選項分布 */}
        <div className="border border-[#DDE3DF] bg-white p-5 shadow-sm">
          <h3 className="mb-3 flex items-center gap-1.5 border-b border-[#ECEFEC] pb-2.5 font-serif text-sm font-bold text-[#1A2A22]">
            <Brain className="h-4 w-4 text-[#7E22CE]" /> 每題選項分布（完成者）
          </h3>
          <ul className="space-y-3">
            {Array.from({ length: Math.max(12, questions.length) }, (_, index) => {
              const counts = quiz.options[String(index + 1)] ?? {};
              const total = sum(counts);
              const q = questions[index];
              return (
                <li key={index} className="text-xs">
                  <div className="mb-1 flex gap-2 text-[#3F5147]">
                    <span className="shrink-0 font-jost font-bold text-[#1A2A22]">Q{index + 1}</span>
                    <span className="truncate" title={q?.prompt}>{q?.prompt ?? ""}</span>
                  </div>
                  <div className="flex h-5 w-full overflow-hidden bg-[#EEF2F0]">
                    {["a", "b", "c", "d"].map((option, k) => {
                      const share = pct(counts[option] ?? 0, total);
                      if (!share) return null;
                      const label = q?.options.find(o => o.id === option)?.label;
                      return (
                        <span
                          key={option}
                          title={`${option.toUpperCase()}${label ? `　${label}` : ""}：${counts[option]} 次`}
                          className="flex items-center justify-center font-jost text-[10px] font-bold text-white"
                          style={{ width: `${share}%`, backgroundColor: ["#00A174", "#0284C7", "#9333EA", "#E94E2B"][k] }}
                        >
                          {share >= 8 ? `${option.toUpperCase()} ${share}%` : ""}
                        </span>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-[10px] text-[#8A9590]">滑鼠移到色塊上可看選項內容。某一題有選項長期低於 10%，代表那個選項不吸引人或寫得太極端。</p>
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
              "不同答案組合": quiz.distinctCodes,
            }}
            labels={{}}
          />
          {Object.keys(quiz.versions).length > 1 && (
            <List title="題目版本（完成數）" record={quiz.versions} labels={{}} />
          )}
        </div>
      </div>
    </section>
  );
}

function Heading({ month }: { month: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Brain className="h-4.5 w-4.5 text-[#00A174]" />
      <h2 className="font-serif text-base font-bold text-[#1A2A22]">心理測驗：你是哪種東京區民？</h2>
      <span className="text-xs text-[#8A9590]">{month}</span>
      <a href="/quiz/" target="_blank" rel="noopener" className="ml-auto text-[11px] text-[#00A174] underline">開啟測驗</a>
    </div>
  );
}

function List({ title, record, labels }: { title: string; record: Record<string, number>; labels: Record<string, string> }) {
  const entries = Object.entries(record).sort((a, b) => b[1] - a[1]);
  return (
    <div className="mb-4 last:mb-0">
      <h4 className="mb-1 text-[11px] font-bold text-[#66736C]">{title}</h4>
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
