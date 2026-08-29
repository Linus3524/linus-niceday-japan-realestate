import { useEffect, useState } from "react";
import { BarChart3, Building2, ChevronDown, Footprints, Home, SlidersHorizontal, TrainFront } from "lucide-react";
import { rentRates } from "../data/housingMarket";
import type { CommuteRouteDetails, CommuteRouteSegment, RentRecommendation, RentSearchCriteria } from "../lib/rentAnalysis";
import { buildCommuteDiagram, getStationCodeForLine, toJapaneseLineName, toJapanesePlaceName, toJapaneseStationName } from "../lib/transit";
import { CommuteRouteCard, CommuteRouteSkeleton } from "./CommuteRouteCard";

interface Props {
  recommendations: RentRecommendation[];
  criteria: RentSearchCriteria;
  onApply: (item: RentRecommendation) => void;
}

const yen = (value: number) => `¥${Math.round(value / 1000) * 1000}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

function LayoutTiles({ items }: { items: Array<{ label: string; value: number }> }) {
  // Unify with map colors & hovers:
  // 1R (cheapest) -> Green (#dcfce7 -> #bbf7d0)
  // 1K -> Yellow (#fef9c3 -> #fef08a)
  // 1LDK -> Orange (#ffedd5 -> #fed7aa)
  // 2LDK (most expensive) -> Red (#fee2e2 -> #fca5a5)
  const colors = [
    "bg-[#dcfce7] hover:bg-[#bbf7d0]",
    "bg-[#fef9c3] hover:bg-[#fef08a]",
    "bg-[#ffedd5] hover:bg-[#fed7aa]",
    "bg-[#fee2e2] hover:bg-[#fca5a5]"
  ];
  const baseline = items[0]?.value || 1;
  return (
    <div className="grid min-h-[230px] grid-cols-2 gap-2 font-sans">
      {items.map((item, index) => (
        <div key={item.label} className={`flex min-h-[108px] flex-col justify-between border border-[#DDE3DF] p-3 transition-colors duration-200 cursor-pointer ${colors[index]}`}>
          <div className="flex items-start justify-between gap-2">
            <span className="text-base font-black text-[#1A2A22]">{item.label}</span>
            <span className="text-[9px] font-bold text-[#3F5147]">{index === 0 ? "基準" : `+${Math.round((item.value / baseline - 1) * 100)}%`}</span>
          </div>
          <span className="font-mono text-base font-bold text-[#1A2A22]">{yen(item.value)}</span>
          <span className="text-[9px] text-[#3F5147]">行政區平均月租</span>
        </div>
      ))}
    </div>
  );
}

function AgeTimeline({ items, baseline }: { items: Array<{ label: string; value: number }>; baseline: number }) {
  // Unify with map colors & hovers:
  // 築 5 年內 (+12%, highest price) -> Red (#fee2e2 -> #fca5a5)
  // 築 6-10 年 (+6%) -> Orange (#ffedd5 -> #fed7aa)
  // 築 11-20 年 (0%) -> Yellow (#fef9c3 -> #fef08a)
  // 築 21-30 年 (-6%) -> Green (#dcfce7 -> #bbf7d0)
  // 築 30 年+ (-12%) -> Blue/Light grey (#F2F8FA -> #D6EAF0)
  const colors = [
    "bg-[#fee2e2] hover:bg-[#fca5a5]",
    "bg-[#ffedd5] hover:bg-[#fed7aa]",
    "bg-[#fef9c3] hover:bg-[#fef08a]",
    "bg-[#dcfce7] hover:bg-[#bbf7d0]",
    "bg-[#F2F8FA] hover:bg-[#D6EAF0]"
  ];
  return (
    <div className="relative flex min-h-[230px] flex-col justify-between py-1 font-sans">
      <div className="absolute bottom-3 left-[92px] top-3 w-px bg-[#DDE3DF]" />
      {items.map((entry, index) => {
        const difference = Math.round((entry.value / baseline - 1) * 100);
        return (
          <div key={entry.label} className="relative grid grid-cols-[76px_20px_1fr] items-center gap-2">
            <span className="text-right text-[10px] font-bold text-[#3F5147]">{entry.label}</span>
            <span className={`z-10 h-4 w-4 rotate-45 border-2 border-white transition-colors duration-200 cursor-pointer ${colors[index]}`} />
            <div className="flex items-center justify-between gap-2 border-b border-dashed border-[#ECEFEC] py-2">
              <span className="font-mono text-xs font-bold text-[#1A2A22]">{yen(entry.value)}</span>
              <span className={`px-1.5 py-0.5 text-[9px] font-bold ${difference > 0 ? "bg-[#e6f6f1] text-[#007d5a]" : difference < 0 ? "bg-[#FBDFD2] text-[#B13818]" : "bg-[#F5F8F6] text-[#3F5147]"}`}>{difference > 0 ? "+" : ""}{difference}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BuildingRange({ items, baseline }: { items: Array<{ label: string; value: number }>; baseline: number }) {
  // Unify with map colors & hovers:
  // 01 (木造/最便宜) -> Blue/Light grey (#F2F8FA -> #D6EAF0)
  // 02 (鐵骨/RC) -> Green (#dcfce7 -> #bbf7d0)
  // 03 (RC/SRC/電梯) -> Yellow (#fef9c3 -> #fef08a)
  // 04 (RC/SRC/新築) -> Orange (#ffedd5 -> #fed7aa)
  // 05 (塔樓/最貴) -> Red (#fee2e2 -> #fca5a5)
  const colors = [
    "bg-[#F2F8FA] hover:bg-[#D6EAF0]",
    "bg-[#dcfce7] hover:bg-[#bbf7d0]",
    "bg-[#fef9c3] hover:bg-[#fef08a]",
    "bg-[#ffedd5] hover:bg-[#fed7aa]",
    "bg-[#fee2e2] hover:bg-[#fca5a5]"
  ];
  const textColors = ["text-[#3F626D]", "text-[#15803d]", "text-[#854d0e]", "text-[#c2410c]", "text-[#991b1b]"];
  const min = Math.min(...items.map(item => item.value));
  const max = Math.max(...items.map(item => item.value));
  return (
    <div className="min-h-[230px] font-sans">
      <div className="mb-3 border border-[#DDE3DF] bg-[#FAFCFB] px-3 pb-2 pt-3">
        <div className="relative h-5">
          <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2" style={{ background: "linear-gradient(90deg, #dcfce7 0%, #fef9c3 30%, #ffedd5 65%, #fee2e2 100%)" }} />
          {items.map((entry, index) => {
            const position = 4 + (entry.value - min) / Math.max(max - min, 1) * 92;
            return <span key={entry.label} className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_#8A9590] transition-colors duration-200 cursor-pointer ${colors[index]}`} style={{ left: `${position}%` }} />;
          })}
        </div>
        <div className="mt-1 flex justify-between text-[8px] font-mono font-bold text-[#66736C]"><span>{yen(min)}</span><span>租金級距</span><span>{yen(max)}</span></div>
      </div>
      <div className="divide-y divide-[#ECEFEC] border-y border-[#DDE3DF]">
        {items.map((entry, index) => {
          const difference = Math.round((entry.value / baseline - 1) * 100);
          return (
            <div key={entry.label} className={`grid min-h-[34px] grid-cols-[26px_1fr_66px_40px] items-center gap-2 px-2 py-1.5 ${index % 2 ? "bg-[#FAFCFB]" : "bg-white"}`}>
              <span className={`flex h-5 w-5 items-center justify-center text-[8px] font-mono font-bold transition-colors duration-200 cursor-pointer ${textColors[index]} ${colors[index]}`}>0{index + 1}</span>
              <span className="text-[9px] font-bold leading-tight text-[#3F5147]">{entry.label}</span>
              <span className="text-right font-mono text-[10px] font-bold text-[#1A2A22]">{yen(entry.value)}</span>
              <span className={`text-right text-[9px] font-bold ${difference >= 0 ? "text-[#B13818]" : "text-[#007d5a]"}`}>{difference > 0 ? "+" : ""}{difference}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WalkDistanceSteps({ items, baseline }: { items: Array<{ label: string; value: number }>; baseline: number }) {
  // Unify with map colors & hovers:
  // 5分內 (+8%, highest price) -> Red (#fee2e2 -> #fca5a5)
  // 6-10分 (+3%) -> Orange (#ffedd5 -> #fed7aa)
  // 11-15分 (-3%) -> Yellow (#fef9c3 -> #fef08a)
  // 16分+ (-8%) -> Green (#dcfce7 -> #bbf7d0)
  const colors = [
    "bg-[#fee2e2] hover:bg-[#fca5a5]",
    "bg-[#ffedd5] hover:bg-[#fed7aa]",
    "bg-[#fef9c3] hover:bg-[#fef08a]",
    "bg-[#dcfce7] hover:bg-[#bbf7d0]"
  ];
  const textColors = ["text-[#991b1b]", "text-[#c2410c]", "text-[#854d0e]", "text-[#15803d]"];
  return (
    <div className="font-sans">
      <div className="mb-3 flex items-center justify-between gap-2 text-[9px] font-bold">
        <span className="bg-[#FBDFD2] px-2 py-1 text-[#B13818]">近站溢價 +8%</span>
        <span className="text-[#8A9590]">距離增加，租金逐階下降 →</span>
        <span className="bg-[#e6f6f1] px-2 py-1 text-[#007d5a]">遠站折讓 −8%</span>
      </div>
      <div className="grid h-[210px] grid-cols-4 items-end gap-2 border-b border-[#DDE3DF] px-1" role="img" aria-label="不同車站步行距離的租金階梯比較">
        {items.map((entry, index) => {
          const difference = Math.round((entry.value / baseline - 1) * 100);
          const blockHeight = 172 - index * 24;
          return (
            <div key={entry.label} className="flex h-full flex-col justify-end text-center">
              <span className="mb-1 text-[9px] font-mono font-bold text-[#1A2A22]">{yen(entry.value)}</span>
              <div className={`flex flex-col justify-between border border-[#DDE3DF] px-1 py-2 transition-colors duration-200 cursor-pointer ${colors[index]}`} style={{ height: blockHeight }}>
                <span className={`text-xs font-mono font-bold ${textColors[index]}`}>{difference > 0 ? "+" : ""}{difference}%</span>
                <span className={`text-[9px] font-bold leading-tight ${textColors[index]}`}>{entry.label.replace("步行 ", "")}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Report({ item, criteria, index, expanded, onToggle, onApply }: {
  key?: string; item: RentRecommendation; criteria: RentSearchCriteria; index: number; expanded: boolean; onToggle: () => void; onApply: () => void;
}) {
  const rate = rentRates.find(entry => entry.district === item.district);
  const layouts = rate ? [
    { label: "1R", value: parseFloat(rate.r1) * 10000 }, { label: "1K", value: parseFloat(rate.k1) * 10000 },
    { label: "1LDK", value: parseFloat(rate.ldk1) * 10000 }, { label: "2LDK", value: parseFloat(rate.ldk2) * 10000 }
  ] : [];
  const ages = [
    { label: "築 5 年內", value: item.estimate * 1.12 }, { label: "築 6-10 年", value: item.estimate * 1.06 },
    { label: "築 11-20 年", value: item.estimate }, { label: "築 21-30 年", value: item.estimate * .94 },
    { label: "築 30 年+", value: item.estimate * .88 }
  ];
  const walks = [
    { label: "步行 5 分內", value: item.estimate * 1.08 }, { label: "步行 6-10 分", value: item.estimate * 1.03 },
    { label: "步行 11-15 分", value: item.estimate * .97 }, { label: "步行 16 分+", value: item.estimate * .92 }
  ];
  const equipment = [
    { label: "木造／輕量鐵骨・低層無電梯", value: item.estimate * .82 },
    { label: "鐵骨／RC・一般設備", value: item.estimate * .92 },
    { label: "RC／SRC・電梯＋自動門", value: item.estimate * 1.04 },
    { label: "RC／SRC・新築／築淺", value: item.estimate * 1.16 },
    { label: "塔樓型住宅", value: item.estimate * 1.28 }
  ];
  const budget = criteria.maxBudget || item.estimate;
  const scaleMin = Math.min(item.rangeLow, budget) * .9;
  const scaleMax = Math.max(item.rangeHigh, budget) * 1.1;
  const pos = (value: number) => Math.max(0, Math.min(100, (value - scaleMin) / (scaleMax - scaleMin) * 100));

  return (
    <article className={`border ${expanded ? "border-[#00a174]" : "border-[#DDE3DF]"} bg-white`}>
      <button onClick={onToggle} className="w-full text-left p-4 hover:bg-[#F5F8F6] transition-colors font-sans" aria-expanded={expanded}>
        <div className="flex justify-between items-start gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono text-[#8A9590]">AREA {String(index + 1).padStart(2, "0")}</span>
              <span className="border border-[#D6EAF0] bg-[#F2F8FA] px-2 py-0.5 text-[10px] font-bold text-[#3F626D]">{item.recommendationType || "市場推薦"}</span>
              <span className={`text-[10px] px-2 py-0.5 font-bold ${item.fit === "預算內" ? "bg-[#e6f6f1] text-[#007d5a]" : item.fit === "接近預算" ? "bg-[#D6EAF0]" : "bg-[#FBDFD2] text-[#B13818]"}`}>{item.fit}</span>
              {criteria.commuteStation && <span className={`text-[10px] px-2 py-0.5 font-bold ${item.commuteFit === "直達線路" ? "bg-[#e6f6f1] text-[#007d5a]" : "bg-[#FFF9ED] text-[#7A5A1F]"}`}>{item.commuteFit}</span>}
              {item.commuteRoute ? (
                <span className={`px-2 py-0.5 text-[10px] font-bold ${criteria.commuteMinutes && item.commuteRoute.totalDurationMinutes <= criteria.commuteMinutes ? "bg-[#e6f6f1] text-[#007d5a]" : "bg-[#F2F8FA] text-[#3F626D]"}`}>
                  {item.commuteRoute.totalDurationMinutes} 分・轉乘 {item.commuteRoute.transfers} 次
                </span>
              ) : null}
            </div>
            <h4 lang="ja" className="font-jp font-bold text-base text-[#1A2A22] mt-1">{toJapanesePlaceName(item.district)}{item.station ? ` · ${toJapaneseStationName(item.station)}駅` : ""}</h4>
            <p lang="ja" className="font-jp font-medium text-[10px] text-[#8A9590] mt-0.5">{item.lines.map(toJapaneseLineName).join("・") || `${toJapanesePlaceName(item.region)}行政区行情`}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right"><div className="font-mono font-bold text-lg text-[#00a174]">{yen(item.estimate)}</div><div className="text-[10px] text-[#8A9590]">月租中心值</div></div>
            <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </div>
        </div>
      </button>
      {expanded && (
        <div className="border-t border-[#DDE3DF] p-4 md:p-5 bg-[#FAFCFB] space-y-5">
          {item.commuteRoute ? <CommuteRouteCard route={item.commuteRoute} /> : <CommuteRouteSkeleton item={item} criteria={criteria} />}
          <section className="border border-[#DDE3DF] bg-white p-4">
            <div className="flex items-center gap-2 font-bold text-xs mb-5"><BarChart3 className="w-4 h-4 text-[#00a174]" /> 預算 vs. 推估租金區間</div>
            <div className="relative h-12 mx-3">
              <div className="absolute left-0 right-0 top-5 h-2 bg-[#ECEFEC]" />
              <div className="absolute top-5 h-2 bg-[#9ee2cf]" style={{ left: `${pos(item.rangeLow)}%`, width: `${pos(item.rangeHigh) - pos(item.rangeLow)}%` }} />
              <div className="absolute top-1 bottom-1 w-0.5 bg-[#E94E2B]" style={{ left: `${pos(budget)}%` }}><span className="absolute -top-1 -translate-x-1/2 -translate-y-full whitespace-nowrap text-[9px] text-[#B13818] font-bold">預算 {yen(budget)}</span></div>
              <span className="absolute top-8 -translate-x-1/2 text-[9px] text-[#3F5147]" style={{ left: `${pos(item.rangeLow)}%` }}>{yen(item.rangeLow)}</span>
              <span className="absolute top-8 -translate-x-1/2 text-[9px] text-[#3F5147]" style={{ left: `${pos(item.rangeHigh)}%` }}>{yen(item.rangeHigh)}</span>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="border border-[#DDE3DF] bg-white p-4"><div className="flex items-center gap-2 font-bold text-xs mb-4"><Home className="w-4 h-4 text-[#00a174]" /> 格局行情卡</div><LayoutTiles items={layouts} /></section>
            <section className="border border-[#DDE3DF] bg-white p-4"><div className="flex items-center gap-2 font-bold text-xs mb-4"><Building2 className="w-4 h-4 text-[#00a174]" /> 屋齡租金時間軸</div><AgeTimeline items={ages} baseline={item.estimate} /></section>
            <section className="border border-[#DDE3DF] bg-white p-4">
              <div className="flex items-center gap-2 font-bold text-xs mb-3"><Footprints className="w-4 h-4 text-[#00a174]" /> 步行距離租金階梯</div>
              <WalkDistanceSteps items={walks} baseline={item.estimate} />
            </section>
            <section className="border border-[#DDE3DF] bg-white p-4">
              <div className="flex items-center gap-2 font-bold text-xs mb-4"><SlidersHorizontal className="w-4 h-4 text-[#00a174]" /> 建物規格租金級距</div>
              <BuildingRange items={equipment} baseline={item.estimate} />
            </section>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center">
            <div className="max-w-xl">
              <p className="text-[10px] text-[#3F5147] leading-relaxed font-sans">套用後會把地區、車站、格局與需求帶入下方計算器，繼續調整月租明細。</p>
            </div>
            <button onClick={onApply} className="bg-[#1A2A22] text-white px-4 py-2.5 text-xs font-bold hover:bg-[#00a174] whitespace-nowrap">套用此方案到下方計算器</button>
          </div>
        </div>
      )}
    </article>
  );
}

/**
 * 清單排序方式。
 *
 * 預設「推薦度」＝後端算出的綜合分數（指定車站、指定行政區、路線、通勤直達、
 * 預算貼近度加總），也就是陣列原本的順序，所以不做任何重排。
 *
 * 另外兩種是使用者挑房時最常用的兩個角度：先看便宜的、先看通勤方便的。
 * 排序只重排這次分析挑出的結果，不會重新向後端要資料。
 */
type SortMode = "recommended" | "rent" | "commute";

const SORT_LABEL: Record<SortMode, string> = {
  recommended: "推薦度",
  rent: "租金",
  commute: "通勤"
};

/** 查不到路線的卡片沒有分鐘數，一律排在有時間的後面。 */
const commuteMinutes = (item: RentRecommendation) =>
  item.commuteRoute?.totalDurationMinutes ?? Infinity;

/** 沒有分鐘數時的次序：直達 → 需轉乘 → 未指定通勤地。 */
function commuteFallbackRank(item: RentRecommendation) {
  if (item.commuteFit === "直達線路") return 0;
  if (item.commuteFit === "需確認轉乘") return 1;
  return 2;
}

function sortRecommendations(items: RentRecommendation[], mode: SortMode) {
  if (mode === "recommended") return items;
  const sorted = [...items];
  if (mode === "rent") return sorted.sort((a, b) => a.estimate - b.estimate);
  // 通勤：直接比實際查到的分鐘數，短的在前。
  return sorted.sort((a, b) => {
    const left = commuteMinutes(a);
    const right = commuteMinutes(b);
    if (left !== right) {
      // 查不到時間的一律殿後。不能寫成 left - right：
      // Infinity 減有限數仍是 Infinity（不是有限值），
      // Infinity 減 Infinity 更會得到 NaN，比較器拿到 NaN 順序就沒有定義，
      // 沒有時間的卡片會插進有時間的卡片之間。
      if (left === Infinity) return 1;
      if (right === Infinity) return -1;
      return left - right;
    }
    // 兩邊都查不到時間時（通勤查詢失敗或沒填通勤地）才退回直達與否，
    // 再以租金收尾，確保順序穩定、不會每次渲染都跳動。
    const rank = commuteFallbackRank(a) - commuteFallbackRank(b);
    if (rank !== 0) return rank;
    return a.estimate - b.estimate;
  });
}

export function RentMarketReports({ recommendations, criteria, onApply }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedDistricts, setExpandedDistricts] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("recommended");
  const sorted = sortRecommendations(recommendations, sortMode);
  const groups = Array.from(sorted.reduce((grouped, item) => {
    const current = grouped.get(item.district) || [];
    current.push(item);
    grouped.set(item.district, current);
    return grouped;
  }, new Map<string, RentRecommendation[]>()));

  useEffect(() => {
    setExpanded(null);
    setExpandedDistricts([]);
  }, [recommendations]);

  const toggleDistrict = (district: string) => {
    setExpandedDistricts(current => current.includes(district)
      ? current.filter(item => item !== district)
      : [...current, district]);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 font-sans">
        <p className="text-[10px] font-bold text-[#66736C]">
          找到 {recommendations.length} 個合適車站・分布於 {groups.length} 個行政區
        </p>
        <div className="inline-flex items-center border border-[#DDE3DF] bg-[#F5F8F6] p-1">
          <span className="px-2 text-[9px] font-bold text-[#7A8580]">排序</span>
          {(Object.keys(SORT_LABEL) as SortMode[]).map(mode => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                setSortMode(mode);
                setExpanded(null);
              }}
              aria-pressed={sortMode === mode}
              aria-label={mode === "rent" ? "依租金由低至高排序" : mode === "commute" ? "依通勤時間排序" : "依推薦度排序"}
              className={`cursor-pointer px-3 py-1.5 text-[10px] font-bold transition-colors ${
                sortMode === mode ? "bg-[#18181B] text-white" : "bg-white text-zinc-700 hover:text-[#007D5A]"
              }`}
            >
              {SORT_LABEL[mode]}
            </button>
          ))}
        </div>
      </div>
      {groups.map(([district, items]) => {
        const districtExpanded = expandedDistricts.includes(district);
        const low = Math.min(...items.map(item => item.estimate));
        const high = Math.max(...items.map(item => item.estimate));
        return (
          <section key={district}>
            <button
              type="button"
              onClick={() => toggleDistrict(district)}
              className="flex w-full items-center justify-between gap-4 border-l-4 border-[#00A174] bg-[#F3F8F5] px-4 py-3 text-left transition-colors hover:bg-[#EAF4EF]"
              aria-expanded={districtExpanded}
            >
              <span>
                <span lang="ja" className="block font-jp text-sm font-bold text-[#1A2A22]">{toJapanesePlaceName(district)}</span>
                <span className="mt-0.5 block font-sans text-[9px] text-[#66736C]">{items.length} 個車站</span>
              </span>
              <span className="flex items-center gap-3">
                <span className="font-mono text-[10px] font-bold text-[#3F5147]">
                  {low === high ? yen(low) : `${yen(low)}～${yen(high)}`}
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${districtExpanded ? "rotate-180" : ""}`} />
              </span>
            </button>
            {districtExpanded && (
              <div className="mt-2 space-y-2">
                {items.map(item => {
                  const reportKey = `${item.district}-${item.station || "district"}`;
                  return (
                    <Report
                      key={reportKey}
                      item={item}
                      criteria={criteria}
                      index={sorted.indexOf(item)}
                      expanded={expanded === reportKey}
                      onToggle={() => setExpanded(expanded === reportKey ? null : reportKey)}
                      onApply={() => onApply(item)}
                    />
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
      {/* 共通說明全站只出現這一次；卡片內不再重複同樣的免責文字。 */}
      <p className="border-t border-[#DDE3DF] pt-3 font-sans text-[9px] leading-relaxed text-[#8A9590]">
        以上為行政區／車站層級的租金推估與趨勢，非即時空室資料。圖表呈現的是規格差異的方向性，實際物件仍依募集條件為準。
      </p>
    </div>
  );
}
