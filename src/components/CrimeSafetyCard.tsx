import {
  ShieldCheck,
  ChevronDown,
  Home,
  Footprints,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  MapPin,
  Bike,
  Car,
  ShoppingBag,
  ShieldAlert,
  Layers,
  Info,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useState, useMemo } from "react";
import type { CrimeSafetyResult, CrimeBreakdownItem, SafetyGrade } from "../lib/crimeSafety";

interface CrimeSafetyCardProps {
  crime: CrimeSafetyResult;
}

interface GradeStyle {
  bg: string;
  text: string;
  border: string;
  accent: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  label: string;
  description: string;
  level: number; // 1 ~ 5 格指示器
}

const GRADE_CONFIG: Record<SafetyGrade, GradeStyle> = {
  "A+": {
    bg: "#E6F6F1",
    text: "#007D5A",
    border: "#9EE2CF",
    accent: "#007D5A",
    badgeBg: "#FFFFFF",
    badgeText: "#007D5A",
    badgeBorder: "#9EE2CF",
    label: "極安全",
    description: "全年無相關犯罪紀錄，防護安全性極高",
    level: 5,
  },
  A: {
    bg: "#E6F6F1",
    text: "#007D5A",
    border: "#9EE2CF",
    accent: "#007D5A",
    badgeBg: "#FFFFFF",
    badgeText: "#007D5A",
    badgeBorder: "#9EE2CF",
    label: "安全",
    description: "治安狀態優良，未見侵入性或威脅性案件",
    level: 4,
  },
  "B+": {
    bg: "#EBF5FF",
    text: "#1E65B8",
    border: "#B9DCFF",
    accent: "#1E65B8",
    badgeBg: "#FFFFFF",
    badgeText: "#1E65B8",
    badgeBorder: "#B9DCFF",
    label: "良好",
    description: "治安平穩，僅零星輕微案件，生活環境正常",
    level: 3,
  },
  B: {
    bg: "#FFF4E5",
    text: "#B76E00",
    border: "#FFD599",
    accent: "#B76E00",
    badgeBg: "#FFFFFF",
    badgeText: "#B76E00",
    badgeBorder: "#FFD599",
    label: "普通",
    description: "周邊偶有輕微案件，平時建議隨手防盜上鎖",
    level: 2,
  },
  C: {
    bg: "#FDE8E8",
    text: "#C81E1E",
    border: "#F8B4B4",
    accent: "#C81E1E",
    badgeBg: "#FFFFFF",
    badgeText: "#C81E1E",
    badgeBorder: "#F8B4B4",
    label: "留意",
    description: "統計案件偏多，建議留意出入門禁與隨身財物",
    level: 1,
  },
  D: {
    bg: "#FDE8E8",
    text: "#9B1C1C",
    border: "#F8B4B4",
    accent: "#9B1C1C",
    badgeBg: "#FFFFFF",
    badgeText: "#9B1C1C",
    badgeBorder: "#F8B4B4",
    label: "注意",
    description: "案件頻率較高，夜間行走與居家電梯防護需加強注意",
    level: 1,
  },
};

const GROUP_META: Record<
  CrimeBreakdownItem["group"],
  { label: string; icon: LucideIcon; color: string; desc: string }
> = {
  residential: {
    label: "住宅安全相關",
    icon: Home,
    color: "#007D5A",
    desc: "空屋破門、私闖民宅等侵入性竊盜",
  },
  street: {
    label: "街區人身安全",
    icon: Footprints,
    color: "#1E65B8",
    desc: "暴行、傷害、搶奪等街頭人身危安事件",
  },
  property: {
    label: "財產竊盜輕罪",
    icon: Bike,
    color: "#B76E00",
    desc: "自行車盜、車內物品盜、隨身順手牽羊等",
  },
  other: {
    label: "其他刑法罪種",
    icon: Layers,
    color: "#66736C",
    desc: "詐欺、侵占與其他非暴力刑法犯",
  },
};

function getCrimeIcon(label: string): LucideIcon {
  if (label.includes("自行車")) return Bike;
  if (label.includes("空き巣") || label.includes("忍込み") || label.includes("居空き") || label.includes("侵入") || label.includes("住宅")) return Home;
  if (label.includes("自動車") || label.includes("オートバイ") || label.includes("車上") || label.includes("車輛") || label.includes("機車")) return Car;
  if (label.includes("凶惡") || label.includes("強盜") || label.includes("重罪")) return AlertTriangle;
  if (label.includes("粗暴") || label.includes("暴行") || label.includes("傷害") || label.includes("脅迫") || label.includes("恐喝")) return Footprints;
  if (label.includes("萬引き") || label.includes("置引き") || label.includes("すり") || label.includes("ひったくり") || label.includes("竊盜")) return ShoppingBag;
  if (label.includes("詐欺") || label.includes("知能")) return ShieldAlert;
  return Layers;
}

export function CrimeSafetyCard({ crime }: CrimeSafetyCardProps) {
  const [expanded, setExpanded] = useState(false);

  // 分組統計
  const { residentialCount, streetCount, propertyCount, otherCount, felonyCount, bikeCount } = useMemo(() => {
    let res = 0;
    let str = 0;
    let prop = 0;
    let oth = 0;
    let fel = 0;
    let bike = 0;

    for (const item of crime.breakdown) {
      if (item.group === "residential") res += item.count;
      else if (item.group === "street") str += item.count;
      else if (item.group === "property") prop += item.count;
      else if (item.group === "other") oth += item.count;

      if (item.label.includes("凶惡") || item.label.includes("強盜")) fel += item.count;
      if (item.label.includes("自行車")) bike += item.count;
    }

    return {
      residentialCount: res,
      streetCount: str,
      propertyCount: prop,
      otherCount: oth,
      felonyCount: fel,
      bikeCount: bike,
    };
  }, [crime.breakdown]);

  const groups: CrimeBreakdownItem["group"][] = ["residential", "street", "property", "other"];

  const residentialStyle = GRADE_CONFIG[crime.residentialGrade] || GRADE_CONFIG.A;
  const streetStyle = GRADE_CONFIG[crime.streetGrade] || GRADE_CONFIG["A+"];

  // 犯罪構成百分比
  const total = crime.totalCrimes;
  const segments = useMemo(() => {
    if (total <= 0) return [];
    return [
      { key: "property", label: "自行車/財產輕罪", count: propertyCount, color: "#007D5A" },
      { key: "other", label: "其他刑法", count: otherCount, color: "#8A9590" },
      { key: "street", label: "街區粗暴", count: streetCount, color: "#B76E00" },
      { key: "residential", label: "住宅侵入", count: residentialCount, color: "#C81E1E" },
    ].filter((s) => s.count > 0);
  }, [total, propertyCount, otherCount, streetCount, residentialCount]);

  return (
    <div className="space-y-3 font-sans [font-family:var(--font-sans)]">
      {/* 模組統一標題列 (與全站各模組一致：純文字圖示＋副標，無外框無襯線) */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#007D5A]">
          <ShieldCheck className="h-4 w-4 text-[#007D5A]" />
          <span>周邊治安資料分析</span>
        </div>
        <span className="text-[10px] text-[#66736C]">
          東京都町丁目別・警視廳官方犯罪認知統計
        </span>
      </div>

      {/* 卡片本體：純直角、標準 1px 灰色邊框、全站統一色彩 */}
      <div className="border border-[#DDE3DF] bg-white p-4 sm:p-5 space-y-4">
        {/* 範圍與件數資訊列 */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DDE3DF] pb-3 text-xs">
          <div className="flex items-center gap-1.5 text-[#66736C]">
            <MapPin className="h-3.5 w-3.5 text-[#007D5A] shrink-0" />
            <span className="font-bold text-[#66736C]">統計範圍：</span>
            <span className="font-bold text-[#1A2A22]">{crime.chocho}</span>
            <span className="border border-[#DDE3DF] bg-[#F5F8F6] px-1.5 py-0.5 text-[10px] font-medium text-[#66736C]">
              東京都町丁目別
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="border border-[#9EE2CF] bg-[#E6F6F1] px-2 py-0.5 text-[10px] font-bold text-[#007D5A]">
              {crime.periodLabel}
            </span>
            <span className="border border-[#DDE3DF] bg-[#F5F8F6] px-2.5 py-0.5 font-mono text-xs font-bold tabular-nums text-[#1A2A22]">
              該區全罪種 {crime.totalCrimes} 件
            </span>
          </div>
        </div>

        {/* 雙評級核心儀表盤卡片 (純直角・標準格線) */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* 左卡：住宅防盜安全 */}
          <div
            className="border p-3.5 space-y-2.5 transition-colors"
            style={{
              backgroundColor: residentialStyle.bg,
              borderColor: residentialStyle.border,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Home className="h-3.5 w-3.5" style={{ color: residentialStyle.accent }} />
                <span className="text-xs font-bold text-[#1A2A22]">住宅防盜評級</span>
              </div>
              <span
                className="border px-2 py-0.5 text-[10px] font-bold"
                style={{
                  backgroundColor: residentialStyle.badgeBg,
                  color: residentialStyle.badgeText,
                  borderColor: residentialStyle.badgeBorder,
                }}
              >
                {residentialStyle.label}
              </span>
            </div>

            <div className="flex items-baseline gap-2.5">
              <span
                className="text-3xl font-black tracking-tight leading-none tabular-nums"
                style={{ color: residentialStyle.text }}
              >
                {crime.residentialGrade}
              </span>
              <span className="text-xs font-bold text-[#1A2A22]">
                {residentialCount === 0 ? "全年 0 件住宅侵入盜" : `全年侵入竊盜 ${residentialCount} 件`}
              </span>
            </div>

            {/* 純直角 5 段式安全指示器 */}
            <div className="flex gap-1 h-1.5 w-full">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <div
                  key={lvl}
                  className="flex-1 h-1.5"
                  style={{
                    backgroundColor:
                      lvl <= residentialStyle.level ? residentialStyle.accent : `${residentialStyle.border}90`,
                  }}
                />
              ))}
            </div>

            <p className="text-[11px] leading-snug text-[#3F5147]">
              {residentialStyle.description}
            </p>
          </div>

          {/* 右卡：街區人身環境 */}
          <div
            className="border p-3.5 space-y-2.5 transition-colors"
            style={{
              backgroundColor: streetStyle.bg,
              borderColor: streetStyle.border,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Footprints className="h-3.5 w-3.5" style={{ color: streetStyle.accent }} />
                <span className="text-xs font-bold text-[#1A2A22]">街區人身環境</span>
              </div>
              <span
                className="border px-2 py-0.5 text-[10px] font-bold"
                style={{
                  backgroundColor: streetStyle.badgeBg,
                  color: streetStyle.badgeText,
                  borderColor: streetStyle.badgeBorder,
                }}
              >
                {streetStyle.label}
              </span>
            </div>

            <div className="flex items-baseline gap-2.5">
              <span
                className="text-3xl font-black tracking-tight leading-none tabular-nums"
                style={{ color: streetStyle.text }}
              >
                {crime.streetGrade}
              </span>
              <span className="text-xs font-bold text-[#1A2A22]">
                {streetCount === 0 ? "全年 0 件街頭粗暴犯" : `全年街區粗暴事件 ${streetCount} 件`}
              </span>
            </div>

            {/* 純直角 5 段式安全指示器 */}
            <div className="flex gap-1 h-1.5 w-full">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <div
                  key={lvl}
                  className="flex-1 h-1.5"
                  style={{
                    backgroundColor:
                      lvl <= streetStyle.level ? streetStyle.accent : `${streetStyle.border}90`,
                  }}
                />
              ))}
            </div>

            <p className="text-[11px] leading-snug text-[#3F5147]">
              {streetStyle.description}
            </p>
          </div>
        </div>

        {/* 全東京對照與今年至今趨勢：只有評級數字會看不出「這算好還是壞」，這一列給比較基準 */}
        {(crime.tokyoContext || crime.ytd) && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {crime.tokyoContext && (
              <div className="flex flex-col justify-between border border-[#DDE3DF] bg-[#F5F8F6] px-3 py-2.5">
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#1A2A22]">
                    <Layers className="h-3.5 w-3.5 text-[#007D5A]" />
                    <span>對照全東京 {crime.tokyoContext.chomeCount.toLocaleString()} 個町丁目</span>
                  </div>
                  <dl className="mt-1.5 grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: "住宅侵入", value: crime.tokyoContext.residentialSaferThanPercent },
                      { label: "街區粗暴", value: crime.tokyoContext.streetSaferThanPercent },
                      { label: "全罪種", value: crime.tokyoContext.totalSaferThanPercent },
                    ].map((item) => (
                      <div key={item.label}>
                        <dt className="text-[10px] text-[#66736C]">{item.label}</dt>
                        <dd className={`text-sm font-black tabular-nums ${item.value >= 60 ? "text-[#007D5A]" : item.value >= 40 ? "text-[#1E65B8]" : "text-[#B76E00]"}`}>
                          {item.value}%
                        </dd>
                        {/* 與右側「去年全年」維持同等高度佔位，確保下方小字備註基準線完全對齊 */}
                        <dd className="text-[10px] tabular-nums text-transparent select-none" aria-hidden="true">
                          基準對照
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <p className="mt-auto pt-1.5 text-[10px] leading-snug text-[#66736C]">數字＝比全東京多少比例的町丁目更安全（件數更少）；愈高愈好。</p>
              </div>
            )}
            {crime.ytd && (
              <div className="flex flex-col justify-between border border-[#DDE3DF] bg-[#F5F8F6] px-3 py-2.5">
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#1A2A22]">
                    <TrendingUp className="h-3.5 w-3.5 text-[#007D5A]" />
                    <span>今年至今趨勢（{crime.ytd.label}）</span>
                  </div>
                  <dl className="mt-1.5 grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: "住宅侵入", ytd: crime.ytd.residentialCount, annual: residentialCount },
                      { label: "街區粗暴", ytd: crime.ytd.streetCount, annual: streetCount },
                      { label: "全罪種", ytd: crime.ytd.totalCrimes, annual: crime.totalCrimes },
                    ].map((item) => {
                      // 用「去年同期步調」比：至今件數 ÷ 月數 vs 去年全年 ÷ 12。超過 1.2 倍才標橘，避免小數字誤判。
                      const pace = item.annual > 0 ? (item.ytd / crime.ytd!.throughMonth) / (item.annual / 12) : (item.ytd > 0 ? 2 : 1);
                      const tone = pace > 1.2 ? "text-[#B76E00]" : pace < 0.8 ? "text-[#007D5A]" : "text-[#1A2A22]";
                      return (
                        <div key={item.label}>
                          <dt className="text-[10px] text-[#66736C]">{item.label}</dt>
                          <dd className={`text-sm font-black tabular-nums ${tone}`}>{item.ytd} 件</dd>
                          <dd className="text-[10px] tabular-nums text-[#8A9590]">去年全年 {item.annual}</dd>
                        </div>
                      );
                    })}
                  </dl>
                </div>
                <p className="mt-auto pt-1.5 text-[10px] leading-snug text-[#66736C]">橘色＝今年步調明顯高於去年；綠色＝明顯低於去年。</p>
              </div>
            )}
          </div>
        )}

        {/* 房產決策「安心三大核心指標」（純直角、標準 1px 邊框） */}
        <div className="grid grid-cols-3 gap-2">
          {/* 指標 1：住宅侵入竊盜 */}
          <div
            className={`flex flex-col items-center justify-center border px-2 py-2 text-center ${
              residentialCount === 0
                ? "border-[#9EE2CF] bg-[#E6F6F1]"
                : "border-[#F8B4B4] bg-[#FDE8E8]"
            }`}
          >
            <div className="flex items-center gap-1">
              {residentialCount === 0 ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-[#007D5A]" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 text-[#C81E1E]" />
              )}
              <span className="text-[11px] font-bold text-[#1A2A22]">住宅侵入盜</span>
            </div>
            <span
              className={`mt-0.5 text-xs font-black tabular-nums ${
                residentialCount === 0 ? "text-[#007D5A]" : "text-[#C81E1E]"
              }`}
            >
              {residentialCount === 0 ? "0 件・極安全" : `${residentialCount} 件`}
            </span>
          </div>

          {/* 指標 2：人身暴力粗暴犯 */}
          <div
            className={`flex flex-col items-center justify-center border px-2 py-2 text-center ${
              streetCount === 0
                ? "border-[#9EE2CF] bg-[#E6F6F1]"
                : "border-[#F8B4B4] bg-[#FDE8E8]"
            }`}
          >
            <div className="flex items-center gap-1">
              {streetCount === 0 ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-[#007D5A]" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 text-[#C81E1E]" />
              )}
              <span className="text-[11px] font-bold text-[#1A2A22]">街頭粗暴犯</span>
            </div>
            <span
              className={`mt-0.5 text-xs font-black tabular-nums ${
                streetCount === 0 ? "text-[#007D5A]" : "text-[#C81E1E]"
              }`}
            >
              {streetCount === 0 ? "0 件・無紀錄" : `${streetCount} 件`}
            </span>
          </div>

          {/* 指標 3：凶惡重罪 (強盜・殺人・放火) */}
          <div
            className={`flex flex-col items-center justify-center border px-2 py-2 text-center ${
              felonyCount === 0
                ? "border-[#9EE2CF] bg-[#E6F6F1]"
                : "border-[#F8B4B4] bg-[#FDE8E8]"
            }`}
          >
            <div className="flex items-center gap-1">
              {felonyCount === 0 ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-[#007D5A]" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 text-[#C81E1E]" />
              )}
              <span className="text-[11px] font-bold text-[#1A2A22]">凶惡重罪</span>
            </div>
            <span
              className={`mt-0.5 text-xs font-black tabular-nums ${
                felonyCount === 0 ? "text-[#007D5A]" : "text-[#C81E1E]"
              }`}
            >
              {felonyCount === 0 ? "0 件・安心" : `${felonyCount} 件`}
            </span>
          </div>
        </div>

        {/* 治安專業診斷結論（純 1px 邊框，去除過粗側邊線，全站統一規格） */}
        <div className="border border-[#DDE3DF] bg-[#F5F8F6] p-3.5">
          <div className="flex items-start gap-2.5">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#007D5A]" />
            <div className="space-y-1">
              <div className="text-xs font-bold text-[#007D5A]">治安專業診斷結論</div>
              <p className="text-xs leading-relaxed font-medium text-[#1A2A22]">
                {crime.summary}
              </p>
            </div>
          </div>
        </div>

        {/* 犯罪構成佔比分析 (純直角矩形長條，無 emoji) */}
        {total > 0 && (
          <div className="border border-[#DDE3DF] bg-[#FAFCFB] p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-[#1A2A22]">案件結構佔比分析</span>
              {bikeCount > 0 && (
                <span className="flex items-center gap-1 font-bold text-[#007D5A]">
                  <Bike className="h-3.5 w-3.5 text-[#007D5A]" />
                  <span>自行車竊盜佔 {Math.round((bikeCount / total) * 100)}%（{bikeCount} 件）</span>
                </span>
              )}
            </div>

            {/* 純直角比例條 */}
            <div className="h-2 w-full bg-[#DDE3DF] flex">
              {segments.map((seg) => (
                <div
                  key={seg.key}
                  style={{
                    width: `${(seg.count / total) * 100}%`,
                    backgroundColor: seg.color,
                  }}
                  title={`${seg.label}: ${seg.count} 件 (${Math.round((seg.count / total) * 100)}%)`}
                  className="h-full"
                />
              ))}
            </div>

            {/* 純直角圖例說明 */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#66736C]">
              {segments.map((seg) => (
                <div key={seg.key} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 shrink-0" style={{ backgroundColor: seg.color }} />
                  <span>{seg.label}</span>
                  <span className="font-bold tabular-nums text-[#1A2A22]">
                    {seg.count} 件 ({Math.round((seg.count / total) * 100)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 犯罪種類明細（四格分開・純直角・無 emoji・全站統一圖示與字體） */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex w-full items-center justify-between border border-[#DDE3DF] bg-[#F5F8F6] px-3.5 py-2.5 text-xs font-bold text-[#1A2A22] transition-colors hover:bg-[#EBF0ED]"
          >
            <div className="flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-[#007D5A]" />
              <span>查看詳細犯罪種類明細</span>
              <span className="border border-[#DDE3DF] bg-white px-2 py-0.5 text-[10px] font-bold tabular-nums text-[#66736C]">
                共 {crime.totalCrimes} 件
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[#007D5A]">
              <span>{expanded ? "收起明細" : "展開查看"}</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
              />
            </div>
          </button>

          {expanded && (
            <div className="border border-[#DDE3DF] bg-[#FAFCFB] p-3.5 space-y-3.5">
              <p className="text-[11px] leading-relaxed text-[#66736C]">
                以下數據為警視廳公佈之該町丁目<strong>月度累積認知件數</strong>，各分類小計加總即為上方總計 {crime.totalCrimes} 件。
              </p>

              {/* 四格分開佈局 (住宅安全、街區人身、財產輕罪、其他刑法) */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {groups.map((groupKey) => {
                  const meta = GROUP_META[groupKey];
                  const items = crime.breakdown.filter((b) => b.group === groupKey);
                  if (items.length === 0) return null;
                  const groupTotalCount = items.reduce((sum, b) => sum + b.count, 0);
                  const isZero = groupTotalCount === 0;

                  return (
                    <div
                      key={groupKey}
                      className="border border-[#DDE3DF] bg-white p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between pb-1.5 border-b border-[#DDE3DF]">
                        <div className="flex items-center gap-1.5">
                          <meta.icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
                          <span className="text-xs font-bold text-[#1A2A22]">{meta.label}</span>
                        </div>
                        <span
                          className={`border px-2 py-0.5 text-[10px] font-bold tabular-nums ${
                            isZero
                              ? "border-[#9EE2CF] bg-[#E6F6F1] text-[#007D5A]"
                              : "border-[#DDE3DF] bg-[#F5F8F6] text-[#1A2A22]"
                          }`}
                        >
                          {isZero ? "0 件 (安全)" : `${groupTotalCount} 件`}
                        </span>
                      </div>

                      <div className="divide-y divide-[#EBF0ED]">
                        {items.map((item) => {
                          const Icon = getCrimeIcon(item.label);
                          return (
                            <div
                              key={item.label}
                              className={`flex items-center justify-between py-1.5 px-1 ${
                                item.count > 0 ? "bg-[#FFFDF5]" : ""
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <Icon className="h-3.5 w-3.5 text-[#3F5147] shrink-0" />
                                <span
                                  className={`text-[11px] ${
                                    item.count > 0 ? "font-bold text-[#1A2A22]" : "text-[#8A9590]"
                                  }`}
                                >
                                  {item.label}
                                </span>
                              </div>
                              <span
                                className={`font-mono text-[11px] font-bold tabular-nums ${
                                  item.count === 0
                                    ? "text-[#8A9590]"
                                    : groupKey === "residential" || groupKey === "street"
                                    ? item.count >= 3
                                      ? "text-[#C81E1E]"
                                      : "text-[#B76E00]"
                                    : "text-[#1A2A22]"
                                }`}
                              >
                                {item.count} 件
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {groupKey === "residential" && isZero && (
                        <div className="border border-[#9EE2CF] bg-[#E6F6F1] px-2 py-1 text-[10px] font-medium text-[#007D5A] flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-[#007D5A] shrink-0" />
                          <span>此町丁目 {crime.periodYear} 年全年無任何空屋破門或侵入性竊盜報案</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 資料來源與免責聲明：與周邊生活機能地圖卡片統一樣式 */}
        <div className="pt-3 border-t border-[#DDE3DF] flex items-start gap-2 text-[11px] leading-relaxed text-[#8A9590]">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8A9590]" />
          <div className="min-w-0 flex-1 space-y-1">
            <div>
              <span className="font-semibold text-[#66736C]">資料來源：</span>
              <a
                className="underline hover:text-[#1A2A22]"
                href="https://www.keishicho.metro.tokyo.lg.jp/about_mpd/jokyo_tokei/jokyo/ninchikensu.html"
                target="_blank"
                rel="noreferrer"
              >
                警視廳「区市町村の町丁別、罪種別及び手口別認知件数」
              </a>
              <span>（CC BY 4.0）｜評級採 {crime.periodLabel}{crime.ytd ? `，趨勢對照 ${crime.ytd.label}` : ""}</span>
            </div>
            <p className="text-[10px] leading-relaxed text-[#8A9590]">
              評級以上一個完整年度（12 個月）為準：町丁目層級件數很小，半年以下的期間容易因一兩件事件讓等級跳動。統計數字可能依警方偵查進度微調，實際街區治安狀況仍建議綜合現地夜間照明與人流評估。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
