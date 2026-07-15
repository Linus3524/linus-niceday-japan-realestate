import { useState } from "react";
import { BarChart3, Building2, ChevronDown, Footprints, Home, SlidersHorizontal } from "lucide-react";
import { rentRates } from "../data/housingMarket";
import type { RentRecommendation, RentSearchCriteria } from "../lib/rentAnalysis";

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
              <span className={`px-1.5 py-0.5 text-[9px] font-bold ${difference > 0 ? "bg-[#EAF3EE] text-[#0A6D52]" : difference < 0 ? "bg-[#FBDFD2] text-[#B13818]" : "bg-[#F5F8F6] text-[#3F5147]"}`}>{difference > 0 ? "+" : ""}{difference}%</span>
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
              <span className={`text-right text-[9px] font-bold ${difference >= 0 ? "text-[#B13818]" : "text-[#0A6D52]"}`}>{difference > 0 ? "+" : ""}{difference}%</span>
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
        <span className="bg-[#EAF3EE] px-2 py-1 text-[#0A6D52]">遠站折讓 −8%</span>
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
    <article className={`border ${expanded ? "border-[#0F8F6D]" : "border-[#DDE3DF]"} bg-white`}>
      <button onClick={onToggle} className="w-full text-left p-4 hover:bg-[#F5F8F6] transition-colors font-sans" aria-expanded={expanded}>
        <div className="flex justify-between items-start gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono text-[#8A9590]">AREA {String(index + 1).padStart(2, "0")}</span>
              <span className="border border-[#D6EAF0] bg-[#F2F8FA] px-2 py-0.5 text-[10px] font-bold text-[#3F626D]">{item.recommendationType || "市場推薦"}</span>
              <span className={`text-[10px] px-2 py-0.5 font-bold ${item.fit === "預算內" ? "bg-[#EAF3EE] text-[#0A6D52]" : item.fit === "接近預算" ? "bg-[#D6EAF0]" : "bg-[#FBDFD2] text-[#B13818]"}`}>{item.fit}</span>
            </div>
            <h4 className="font-bold text-base text-[#1A2A22] mt-1">{item.district}{item.station ? ` · ${item.station}站` : ""}</h4>
            <p className="text-[10px] text-[#8A9590] mt-0.5">{item.lines.join("・") || `${item.region}行政區行情`}</p>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
              {(item.reasons || []).slice(0, 3).map(reason => <span key={reason} className="text-[9px] text-[#3F5147] before:mr-1 before:text-[#0F8F6D] before:content-['✓']">{reason}</span>)}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right"><div className="font-mono font-bold text-lg text-[#0F8F6D]">{yen(item.estimate)}</div><div className="text-[10px] text-[#8A9590]">月租中心值</div></div>
            <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </div>
        </div>
      </button>
      {expanded && (
        <div className="border-t border-[#DDE3DF] p-4 md:p-5 bg-[#FAFCFB] space-y-5">
          <section className="border border-[#DDE3DF] bg-white p-4">
            <div className="flex items-center gap-2 font-bold text-xs mb-5"><BarChart3 className="w-4 h-4 text-[#0F8F6D]" /> 客戶預算 vs. 市場合理區間</div>
            <div className="relative h-12 mx-3">
              <div className="absolute left-0 right-0 top-5 h-2 bg-[#ECEFEC]" />
              <div className="absolute top-5 h-2 bg-[#A8D5C2]" style={{ left: `${pos(item.rangeLow)}%`, width: `${pos(item.rangeHigh) - pos(item.rangeLow)}%` }} />
              <div className="absolute top-1 bottom-1 w-0.5 bg-[#E94E2B]" style={{ left: `${pos(budget)}%` }}><span className="absolute -top-1 -translate-x-1/2 -translate-y-full whitespace-nowrap text-[9px] text-[#B13818] font-bold">預算 {yen(budget)}</span></div>
              <span className="absolute top-8 -translate-x-1/2 text-[9px] text-[#3F5147]" style={{ left: `${pos(item.rangeLow)}%` }}>{yen(item.rangeLow)}</span>
              <span className="absolute top-8 -translate-x-1/2 text-[9px] text-[#3F5147]" style={{ left: `${pos(item.rangeHigh)}%` }}>{yen(item.rangeHigh)}</span>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="border border-[#DDE3DF] bg-white p-4"><div className="flex items-center gap-2 font-bold text-xs mb-4"><Home className="w-4 h-4 text-[#0F8F6D]" /> 格局行情卡</div><LayoutTiles items={layouts} /></section>
            <section className="border border-[#DDE3DF] bg-white p-4"><div className="flex items-center gap-2 font-bold text-xs mb-4"><Building2 className="w-4 h-4 text-[#0F8F6D]" /> 屋齡租金時間軸</div><AgeTimeline items={ages} baseline={item.estimate} /></section>
            <section className="border border-[#DDE3DF] bg-white p-4">
              <div className="flex items-center gap-2 font-bold text-xs mb-3"><Footprints className="w-4 h-4 text-[#0F8F6D]" /> 步行距離租金階梯</div>
              <WalkDistanceSteps items={walks} baseline={item.estimate} />
              <p className="mt-1 text-[9px] leading-relaxed text-[#66736C] font-sans">以本站固定距離係數呈現近站溢價的方向性趨勢，不是實際物件分佈或統計迴歸曲線。</p>
            </section>
            <section className="border border-[#DDE3DF] bg-white p-4">
              <div className="flex items-center gap-2 font-bold text-xs mb-4"><SlidersHorizontal className="w-4 h-4 text-[#0F8F6D]" /> 建物規格租金級距</div>
              <BuildingRange items={equipment} baseline={item.estimate} />
              <p className="mt-3 border-t border-dashed border-[#DDE3DF] pt-2 text-[9px] leading-relaxed text-[#66736C] font-sans">上圖為常見規格組合的租金情境，不代表同結構物件一定具備相同設備。木造／輕量鐵骨也包含新築物件，本圖不以結構推定屋齡。</p>
            </section>
          </div>

          <div className="bg-[#EAF3EE] border-l-4 border-[#0F8F6D] p-4 text-xs text-[#3F5147] leading-relaxed font-sans">
            <strong className="text-[#1A2A22]">市場判讀：</strong> 此區條件中心值約 {yen(item.estimate)}。若希望降低預算，優先比較屋齡 20 年以上、步行 11-15 分鐘或非熱門大站；若保留電梯、獨立洗面台與面積要求，需以區間上緣準備較穩妥。
          </div>
          <div className="flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center">
            <div className="max-w-xl">
              <p className="text-[9px] text-[#8A9590] leading-relaxed">圖表為本站行政區／格局基準與固定條件係數的情境比較，不是即時空室統計、標準差或實際成交分佈。</p>
              <p className="mt-1 text-[10px] text-[#3F5147] leading-relaxed font-sans">套用後會把這個地區、車站、格局及 AI 讀到的設備／面積等需求帶入下方計算器，讓你繼續增減條件並查看月租明細。</p>
            </div>
            <button onClick={onApply} className="bg-[#1A2A22] text-white px-4 py-2.5 text-xs font-bold hover:bg-[#0F8F6D] whitespace-nowrap">套用此方案到下方計算器</button>
          </div>
        </div>
      )}
    </article>
  );
}

export function RentMarketReports({ recommendations, criteria, onApply }: Props) {
  const [expanded, setExpanded] = useState<number | null>(0);
  return <div className="space-y-3">{recommendations.map((item, index) => <Report key={`${item.district}-${item.station || index}`} item={item} criteria={criteria} index={index} expanded={expanded === index} onToggle={() => setExpanded(expanded === index ? null : index)} onApply={() => onApply(item)} />)}</div>;
}
