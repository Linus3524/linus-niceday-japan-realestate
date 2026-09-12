import {
  ShieldCheck,
  ChevronDown,
  Home,
  Footprints,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  MapPin,
  Bike,
  Car,
  ShoppingBag,
  ShieldAlert,
  Layers,
  Info,
  TrendingUp,
  Users,
  FileText,
  PieChart,
  ListOrdered,
  type LucideIcon,
} from "lucide-react";
import { useState, useMemo } from "react";
import type {
  CrimeSafetyResult,
  CrimeBreakdownItem,
  SafetyGrade,
  RateUnavailableReason,
  StreetActivityLevel,
} from "../lib/crimeSafety";

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
  level: number;
}

interface GradeCopy {
  label: string;
  description: string;
}

const GRADE_CONFIG: Record<SafetyGrade, GradeStyle> = {
  "A+": {
    bg: "#F2FAF7",
    text: "#007D5A",
    border: "#CDEBE0",
    accent: "#007D5A",
    badgeBg: "#FFFFFF",
    badgeText: "#007D5A",
    badgeBorder: "#9EE2CF",
    level: 5,
  },
  A: {
    bg: "#F2FAF7",
    text: "#007D5A",
    border: "#CDEBE0",
    accent: "#007D5A",
    badgeBg: "#FFFFFF",
    badgeText: "#007D5A",
    badgeBorder: "#9EE2CF",
    level: 5,
  },
  "B+": {
    bg: "#F4F8FD",
    text: "#1E65B8",
    border: "#CFE0F4",
    accent: "#1E65B8",
    badgeBg: "#FFFFFF",
    badgeText: "#1E65B8",
    badgeBorder: "#B9DCFF",
    level: 4,
  },
  B: {
    bg: "#FFF9F0",
    text: "#B76E00",
    border: "#FFE2B8",
    accent: "#B76E00",
    badgeBg: "#FFFFFF",
    badgeText: "#B76E00",
    badgeBorder: "#FFD599",
    level: 3,
  },
  C: {
    bg: "#FFF9F0",
    text: "#B76E00",
    border: "#FFE2B8",
    accent: "#B76E00",
    badgeBg: "#FFFFFF",
    badgeText: "#B76E00",
    badgeBorder: "#FFD599",
    level: 2,
  },
  D: {
    bg: "#FDF2F2",
    text: "#C81E1E",
    border: "#F9C8C8",
    accent: "#C81E1E",
    badgeBg: "#FFFFFF",
    badgeText: "#C81E1E",
    badgeBorder: "#F8B4B4",
    level: 1,
  },
};

const RESIDENTIAL_COPY: Record<SafetyGrade, GradeCopy> = {
  "A+": {
    label: "全年無紀錄",
    description: "本町丁目全年無住家侵入竊盜報案紀錄。",
  },
  A: {
    label: "全年無紀錄",
    description: "本町丁目全年無住家侵入竊盜報案紀錄，在東京屬最常見的情形（約 84% 町丁目為 0 件）。",
  },
  "B+": {
    label: "低於平均",
    description: "以住戶數換算後，住家侵入竊盜發生率低於東京約九成的町丁目，屬零星個案。",
  },
  B: {
    label: "接近平均",
    description: "以住戶數換算後，住家侵入竊盜發生率接近東京一般水準，未形成集中趨勢。",
  },
  C: {
    label: "高於平均",
    description: "以住戶數換算後，住家侵入竊盜發生率高於東京多數町丁目。看屋時可留意自動門鎖、監視器與門鎖種類。",
  },
  D: {
    label: "明顯偏高",
    description: "以住戶數換算後，住家侵入竊盜發生率明顯高於東京多數町丁目。建議優先考慮有自動門鎖與監視器的物件，並確認門鎖形式。",
  },
};

const RATE_UNAVAILABLE_COPY: Record<RateUnavailableReason, string> = {
  "no-population-data": "本町丁目查無住戶數資料，以下僅顯示原始件數，未換算成每千戶發生率。",
  "too-few-households": "本町丁目登記住戶極少（多為商辦、工業或填海區），換算成每千戶發生率不具參考意義，以下僅顯示原始件數。",
};

const ACTIVITY_COPY: Record<
  StreetActivityLevel,
  { label: string; description: string; accent: string; bg: string; border: string; level: number }
> = {
  quiet: {
    label: "安靜住宅區",
    description: "全年無街頭案件報案紀錄，屬人流量低的純住宅環境。",
    accent: "#007D5A",
    bg: "#F2FAF7",
    border: "#CDEBE0",
    level: 1,
  },
  residential: {
    label: "一般生活街區",
    description: "街頭案件僅零星紀錄，屬多數東京住宅區的常見水準。",
    accent: "#007D5A",
    bg: "#F2FAF7",
    border: "#CDEBE0",
    level: 2,
  },
  mixed: {
    label: "住商混合",
    description: "有一定的店舖與通勤人流，街頭案件數屬東京中段水準。",
    accent: "#1E65B8",
    bg: "#F4F8FD",
    border: "#CFE0F4",
    level: 3,
  },
  busy: {
    label: "人流密集商圈",
    description: "車站、商店街或飲食店密集，日間與夜間人流量大，街頭案件數隨之偏高。",
    accent: "#1E65B8",
    bg: "#F4F8FD",
    border: "#CFE0F4",
    level: 4,
  },
  entertainment: {
    label: "繁華街／轉運站",
    description: "屬大型繁華街或轉運站周邊，案件多集中於飲食店街與深夜時段，與住宅區的居住環境是兩回事。",
    accent: "#7C5CBF",
    bg: "#F7F5FC",
    border: "#DED4F2",
    level: 5,
  },
};

const TREND_META = {
  up: { icon: "▲", color: "#B76E00", label: "較前年增加" },
  down: { icon: "▼", color: "#007D5A", label: "較前年減少" },
  flat: { icon: "＝", color: "#66736C", label: "與前年持平" },
} as const;

const GROUP_META: Record<
  CrimeBreakdownItem["group"],
  { label: string; icon: LucideIcon; color: string; desc: string }
> = {
  residential: {
    label: "侵入竊盜類",
    icon: Home,
    color: "#007D5A",
    desc: "空巢、忍込み等住家侵入，以及事務所、店舖等非住家侵入",
  },
  street: {
    label: "街頭案件",
    icon: Footprints,
    color: "#1E65B8",
    desc: "暴行、傷害、搶奪等發生於街頭的案件，多集中於商圈與深夜時段",
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
  const residentialCopy = RESIDENTIAL_COPY[crime.residentialGrade] || RESIDENTIAL_COPY.A;
  const activity = ACTIVITY_COPY[crime.streetActivity] || ACTIVITY_COPY.quiet;

  const homeCount =
    typeof crime.burglaryRate === "string" ? residentialCount : crime.burglaryRate.count;

  // 商圈脈絡提示
  const districtContext = useMemo(() => {
    const streetIsHigh =
      crime.streetActivity === "busy" || crime.streetActivity === "entertainment";
    const residentialIsLow =
      crime.residentialGrade === "A+" ||
      crime.residentialGrade === "A" ||
      crime.residentialGrade === "B+";
    if (!streetIsHigh || !residentialIsLow) return null;

    return {
      headline:
        crime.streetActivity === "entertainment"
          ? "本區屬繁華街／大型轉運站型街區"
          : "本區屬人流密集的商圈型街區",
      body:
        `街頭案件數偏高主要反映白天與夜間的人流量，案件多集中於車站周邊、` +
        `飲食店街與深夜時段，並非住宅區治安問題。` +
        (typeof crime.burglaryRate === "string"
          ? ""
          : `本町丁目全年住家侵入竊盜 ${crime.burglaryRate.count} 件` +
            `（${crime.burglaryRate.households.toLocaleString()} 戶），`) +
        `居住環境指標在東京屬${
          crime.residentialGrade === "B+" ? "良好" : "優良"
        }水準。`,
    };
  }, [crime.streetActivity, crime.residentialGrade, crime.burglaryRate]);

  // 三項核心指標資料（住家侵入／街頭案件／凶惡案件）
  const summaryStats = useMemo(() => {
    const tone = (count: number, amberMax: number) =>
      count === 0
        ? { bg: "#E6F6F1", border: "#9EE2CF", text: "#007D5A" }
        : count <= amberMax
          ? { bg: "#FFF9F0", border: "#FFE2B8", text: "#B76E00" }
          : { bg: "#FDF2F2", border: "#F9C8C8", text: "#C81E1E" };

    return [
      { label: "住家侵入", count: homeCount, tone: tone(homeCount, 3) },
      { label: "街頭案件", count: streetCount, tone: tone(streetCount, 5) },
      { label: "凶惡案件", count: felonyCount, tone: tone(felonyCount, 1) },
    ];
  }, [homeCount, streetCount, felonyCount]);

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

  // 年對年標題文字提取
  const trendLabels = useMemo(() => {
    const t = crime.burglaryTrend ?? crime.streetTrend;
    if (!t) return null;
    return {
      prev: t.previousLabel.replace(/（.*/, "").trim(),
      curr: t.currentLabel.replace(/（.*/, "").trim(),
    };
  }, [crime.burglaryTrend, crime.streetTrend]);

  return (
    <div className="space-y-3 font-sans [font-family:var(--font-sans)]">
      {/* 模組統一標題列 (與全站模組一致) */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#007D5A]">
          <ShieldCheck className="h-4 w-4 text-[#007D5A]" />
          <span>周邊治安資料分析</span>
        </div>
        <span className="text-[10px] text-[#66736C]">
          東京都町丁目別・警視廳官方犯罪認知統計
        </span>
      </div>

      {/* 卡片本體：純直角、標準 1px 細灰框 */}
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

        {/* 1. 頂部雙核心卡（參考圖一：左卡雙欄數據對稱展示，右卡活動強度） */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* 左卡：町丁目住家侵入竊盜（圖一雙欄大字版式） */}
          <div
            className="flex flex-col justify-between border p-3.5 transition-colors"
            style={{
              backgroundColor: residentialStyle.bg,
              borderColor: residentialStyle.border,
            }}
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Home className="h-4 w-4" style={{ color: residentialStyle.accent }} />
                  <span className="text-xs font-bold text-[#1A2A22]">町丁目住家侵入竊盜</span>
                </div>
                <span
                  className="border px-2 py-0.5 text-[10px] font-bold"
                  style={{
                    backgroundColor: residentialStyle.badgeBg,
                    color: residentialStyle.badgeText,
                    borderColor: residentialStyle.badgeBorder,
                  }}
                >
                  {residentialCopy.label}
                </span>
              </div>

              {/* 雙欄核心數據展示 */}
              <div className="grid grid-cols-2 gap-4 pt-3 pb-2">
                <div>
                  <div className="text-[11px] font-medium text-[#66736C]">治安等級</div>
                  <div
                    className="h-9 flex items-baseline text-4xl font-black tracking-tight leading-none tabular-nums mt-1"
                    style={{ color: residentialStyle.text }}
                  >
                    {crime.residentialGrade}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-medium text-[#66736C]">住家侵入全年</div>
                  <div className="h-9 flex items-baseline text-4xl font-black tracking-tight leading-none tabular-nums text-[#1A2A22] mt-1">
                    {homeCount} <span className="text-base font-bold text-[#1A2A22] ml-1">件</span>
                  </div>
                </div>
              </div>

              {/* 5 段式治安等級指示器色塊線 */}
              <div className="flex gap-1 w-full mt-1 mb-1.5">
                {([
                  { lvl: 1, label: "注意" },
                  { lvl: 2, label: "留意" },
                  { lvl: 3, label: "接近平均" },
                  { lvl: 4, label: "良好" },
                  { lvl: 5, label: "極安全" },
                ] as const).map(({ lvl, label }) => {
                  const isActive = lvl <= residentialStyle.level;
                  const isCurrent = lvl === residentialStyle.level;
                  return (
                    <div key={lvl} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="h-2 w-full"
                        style={{
                          backgroundColor: isActive ? residentialStyle.accent : `${residentialStyle.border}90`,
                        }}
                      />
                      <span
                        className="text-[9px] leading-tight text-center"
                        style={{
                          color: isCurrent ? residentialStyle.accent : "#8A9590",
                          fontWeight: isCurrent ? 700 : 400,
                        }}
                      >
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <p className="text-[11px] leading-relaxed text-[#55635B]">
                {residentialCopy.description}
              </p>
              {typeof crime.burglaryRate === "string" && (
                <p
                  className="border-t border-dashed pt-2 mt-1.5 text-[10px] leading-snug text-[#66736C]"
                  style={{ borderColor: residentialStyle.border }}
                >
                  {RATE_UNAVAILABLE_COPY[crime.burglaryRate]}
                </p>
              )}
            </div>
          </div>

          {/* 右卡：街區活動強度（與左卡高度與網格完全對齊） */}
          <div
            className="flex flex-col justify-between border p-3.5 transition-colors"
            style={{
              backgroundColor: activity.bg,
              borderColor: activity.border,
            }}
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Footprints className="h-4 w-4" style={{ color: activity.accent }} />
                  <span className="text-xs font-bold text-[#1A2A22]">街區活動強度</span>
                </div>
                <span className="border border-[#DDE3DF] bg-white px-2 py-0.5 text-[10px] font-bold text-[#66736C]">
                  非治安評級
                </span>
              </div>

              {/* 雙欄核心數據展示（高度與左卡完全相同） */}
              <div className="grid grid-cols-2 gap-4 pt-3 pb-2">
                <div>
                  <div className="text-[11px] font-medium text-[#66736C]">活動等級</div>
                  <div
                    className="h-9 flex items-baseline text-xl sm:text-2xl font-black tracking-tight leading-none mt-1 truncate"
                    style={{ color: activity.accent }}
                    title={activity.label}
                  >
                    {activity.label}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-medium text-[#66736C]">街頭案件全年</div>
                  <div className="h-9 flex items-baseline text-4xl font-black tracking-tight leading-none tabular-nums text-[#1A2A22] mt-1">
                    {streetCount} <span className="text-base font-bold text-[#1A2A22] ml-1">件</span>
                  </div>
                </div>
              </div>

              {/* 5 段式強度指示器色塊線（與左卡高度完全一致） */}
              <div className="flex gap-1 w-full mt-1 mb-1.5">
                {([
                  { lvl: 1, label: "安靜" },
                  { lvl: 2, label: "較為寧靜" },
                  { lvl: 3, label: "普通" },
                  { lvl: 4, label: "稍微熱絡" },
                  { lvl: 5, label: "熱絡繁華" },
                ] as const).map(({ lvl, label }) => {
                  const isActive = lvl <= activity.level;
                  const isCurrent = lvl === activity.level;
                  return (
                    <div key={lvl} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="h-2 w-full"
                        style={{
                          backgroundColor: isActive ? activity.accent : `${activity.border}90`,
                        }}
                      />
                      <span
                        className="text-[9px] leading-tight text-center"
                        style={{
                          color: isCurrent ? activity.accent : "#8A9590",
                          fontWeight: isCurrent ? 700 : 400,
                        }}
                      >
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <p className="text-[11px] leading-relaxed text-[#55635B]">
                {activity.description}
              </p>
              {crime.pedestrianRisks.length > 0 && (
                <div
                  className="space-y-1 border-t border-dashed pt-2 mt-1.5"
                  style={{ borderColor: activity.border }}
                >
                  <div className="text-[10px] font-bold text-[#1A2A22]">對行人的直接危害</div>
                  {crime.pedestrianRisks.map((risk) => (
                    <div key={risk.label} className="flex items-baseline justify-between gap-2">
                      <span className="text-[10px] text-[#3F5147]">{risk.label}</span>
                      <span className="text-[10px] font-bold tabular-nums text-[#1A2A22]">
                        {risk.count} 件
                        <span className="ml-1 font-normal text-[#66736C]">
                          （全東京 {risk.chomeWithAny.toLocaleString()} 個町丁目有紀錄）
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 商圈脈絡提示 */}
        {districtContext && (
          <div className="border border-[#B9DCFF] bg-[#EBF5FF] p-3">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#1E65B8]" />
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-[#1E65B8]">
                  {districtContext.headline}
                </div>
                <p className="text-[11px] leading-relaxed text-[#3F5147]">
                  {districtContext.body}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. 中層雙卡（參考圖一：對照全東京雙欄並排，年對年變化） */}
        {(crime.tokyoContext || crime.burglaryTrend || crime.streetTrend) && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* 左卡：對照全東京（方案 A + B 結合：梯隊位階＋精確 PR 與母體客觀分布） */}
            {crime.tokyoContext && (
              <div className="flex flex-col justify-between border border-[#DDE3DF] bg-[#F5F8F6] p-3.5">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-[#DDE3DF]/60">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#1A2A22]">
                      <Layers className="h-4 w-4 text-[#007D5A]" />
                      <span>對照全東京 {crime.tokyoContext.chomeCount.toLocaleString()} 個町丁目</span>
                    </div>
                    <span className="border border-[#DDE3DF] bg-white px-1.5 py-0.5 text-[9px] font-medium text-[#66736C]">
                      全東京橫向 PR 對照
                    </span>
                  </div>

                  <div className="grid grid-cols-2 divide-x divide-[#DDE3DF] py-3 text-center">
                    {/* 住家侵入 */}
                    <div className="px-2">
                      <div className="text-[11px] font-medium text-[#66736C]">住宅侵入防護</div>
                      <div className="mt-1">
                        <div
                          className="text-xl font-black tracking-tight"
                          style={{
                            color: homeCount === 0 ? "#007D5A" : homeCount <= 2 ? "#B76E00" : "#C81E1E",
                          }}
                        >
                          {homeCount === 0 ? "全東京最優梯隊" : homeCount <= 2 ? "僅零星個案" : "案件稍多留意"}
                        </div>
                        <div className="inline-flex items-center gap-1 my-1 px-1.5 py-0.5 border border-[#DDE3DF] bg-white text-[10px] font-bold tabular-nums text-[#1A2A22]">
                          <span>安全 PR {crime.tokyoContext.residentialSaferThanPercent}</span>
                          <span className="text-[9px] font-normal text-[#66736C]">
                            {homeCount === 0 ? "（並列頂標）" : "（東京 95% 在 2 件內）"}
                          </span>
                        </div>
                        <p className="text-[10px] leading-tight text-[#66736C]">
                          {homeCount === 0
                            ? "全東京 84% 區域同為 0 件，並列第 1 級"
                            : homeCount <= 2
                            ? `全年僅 ${homeCount} 件，未見集中趨勢`
                            : "件數偏多，出入門禁宜加強留意"}
                        </p>
                      </div>
                    </div>

                    {/* 全罪種 */}
                    <div className="px-2">
                      <div className="text-[11px] font-medium text-[#66736C]">周邊街區型態</div>
                      <div className="mt-1">
                        <div
                          className="text-xl font-black tracking-tight"
                          style={{
                            color:
                              crime.totalCrimes <= 20
                                ? "#007D5A"
                                : crime.totalCrimes <= 60
                                ? "#1E65B8"
                                : "#B76E00",
                          }}
                        >
                          {crime.totalCrimes <= 20
                            ? "寧靜純住宅"
                            : crime.totalCrimes <= 60
                            ? "一般生活街區"
                            : "熱鬧商圈型"}
                        </div>
                        <div className="inline-flex items-center gap-1 my-1 px-1.5 py-0.5 border border-[#DDE3DF] bg-white text-[10px] font-bold tabular-nums text-[#1A2A22]">
                          <span>全罪種 PR {crime.tokyoContext.totalSaferThanPercent}</span>
                          <span className="text-[9px] font-normal text-[#66736C]">
                            （共 {crime.totalCrimes} 件）
                          </span>
                        </div>
                        <p className="text-[10px] leading-tight text-[#66736C]">
                          {crime.totalCrimes <= 20
                            ? "全罪種總量極低，環境單純安全"
                            : crime.totalCrimes <= 60
                            ? "生活機能便利，案件量屬中段"
                            : "商業活動密集，多屬自行車輕罪"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] leading-snug text-[#8A9590] pt-1.5 border-t border-[#DDE3DF]/60 text-center">
                  註：PR 代表勝過全東京多少比例區域。因全東京 84% 區域全年無住家侵入，有些微件數即會使 PR 偏後，實際仍屬低散發。
                </p>
              </div>
            )}

            {/* 右卡：年對年變化（圖一對齊版式） */}
            {(crime.burglaryTrend || crime.streetTrend) && (
              <div className="flex flex-col justify-between border border-[#DDE3DF] bg-[#F5F8F6] p-3.5">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#1A2A22] pb-2 border-b border-[#DDE3DF]/60">
                    <TrendingUp className="h-4 w-4 text-[#007D5A]" />
                    <span>
                      年對年變化（
                      {trendLabels ? `${trendLabels.prev}→${trendLabels.curr}` : "前後年度對比"}
                      ）
                    </span>
                  </div>

                  <div className="grid grid-cols-2 divide-x divide-[#DDE3DF] py-3 text-center">
                    {/* 住家侵入 */}
                    <div className="pr-2">
                      <div className="text-[11px] font-medium text-[#66736C]">住家侵入</div>
                      <div className="text-lg font-black tabular-nums text-[#1A2A22] mt-1">
                        {crime.burglaryTrend
                          ? `${crime.burglaryTrend.previous} → ${crime.burglaryTrend.current} 件`
                          : "—"}
                      </div>
                      <div className="text-[11px] font-bold text-[#66736C] mt-0.5">
                        {crime.burglaryTrend
                          ? `= ${TREND_META[crime.burglaryTrend.direction].label.replace("較前年", "").replace("與前年", "")}`
                          : ""}
                      </div>
                    </div>

                    {/* 街頭案件 */}
                    <div className="pl-2">
                      <div className="text-[11px] font-medium text-[#66736C]">街頭案件</div>
                      <div className="text-lg font-black tabular-nums text-[#1A2A22] mt-1">
                        {crime.streetTrend
                          ? `${crime.streetTrend.previous} → ${crime.streetTrend.current} 件`
                          : "—"}
                      </div>
                      <div className="text-[11px] font-bold text-[#66736C] mt-0.5">
                        {crime.streetTrend
                          ? `= ${TREND_META[crime.streetTrend.direction].label.replace("較前年", "").replace("與前年", "")}`
                          : ""}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] leading-snug text-[#8A9590] pt-1.5 border-t border-[#DDE3DF]/60">
                  町丁目件數基數小，±1 件視為持平；單一年度的增減未必代表長期趨勢。
                </p>
              </div>
            )}
          </div>
        )}

        {/* 3. 三大核心關鍵治安數字（平鋪卡片・改回原版居中樣式） */}
        <div className="grid grid-cols-3 gap-2 text-center">
          {summaryStats.map((stat) => (
            <div
              key={stat.label}
              className="border p-2.5 space-y-1 transition-colors"
              style={{
                backgroundColor: stat.tone.bg,
                borderColor: stat.tone.border,
              }}
            >
              <div className="flex items-center justify-center gap-1">
                {stat.count === 0 ? (
                  <CheckCircle2 className="h-3.5 w-3.5" style={{ color: stat.tone.text }} />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5" style={{ color: stat.tone.text }} />
                )}
                <span className="text-xs font-bold text-[#1A2A22]">{stat.label}</span>
              </div>
              <div
                className="font-mono text-lg font-black tracking-tight leading-tight tabular-nums"
                style={{ color: stat.tone.text }}
              >
                {stat.count} 件
              </div>
              <div className="text-[10px] text-[#8A9590]">全年・全町丁目</div>
            </div>
          ))}
        </div>

        {/* 4. 治安專業診斷結論（改回原版橫向簡潔樣式） */}
        <div className="border border-[#DDE3DF] bg-[#F5F8F6] p-3">
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#007D5A]" />
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-[#1A2A22]">治安專業診斷結論</span>
              <p className="text-xs leading-relaxed text-[#3F5147]">
                {crime.summary}
              </p>
            </div>
          </div>
        </div>

        {/* 5. 案件結構佔比分析（改回原版比例條條狀展示） */}
        {total > 0 && (
          <div className="border border-[#DDE3DF] bg-white p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
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

        {/* 6. 查看詳細犯罪種類明細（四格分開・純直角・無 emoji） */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex w-full items-center justify-between border border-[#DDE3DF] bg-[#FAFCFB] px-4 py-3 text-xs font-bold text-[#1A2A22] transition-colors hover:bg-[#F2F5F3]"
          >
            <div className="flex items-center gap-2">
              <ListOrdered className="h-4 w-4 text-[#007D5A]" />
              <span>查看詳細犯罪種類明細</span>
              <span className="border border-[#DDE3DF] bg-white px-2 py-0.5 text-[10px] font-bold tabular-nums text-[#66736C]">
                共 {crime.totalCrimes} 件
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-[#007D5A]">
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

              {/* 四格分開佈局 (侵入竊盜、街頭案件、財產輕罪、其他刑法) */}
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
                          <span>此町丁目 {crime.periodYear} 年全年無任何侵入竊盜報案紀錄</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 7. 資料來源與免責聲明：與周邊生活機能地圖卡片統一樣式 */}
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
              <span>
                （CC BY 4.0）｜評級採 {crime.periodLabel}
                {crime.burglaryTrend ? `，趨勢對照 ${crime.burglaryTrend.previousLabel}` : ""}
              </span>
            </div>
            <p className="text-[10px] leading-relaxed text-[#8A9590]">
              評級以上一個完整年度（12 個月）為準：町丁目層級件數很小，半年以下的期間容易因一兩件事件讓等級跳動。統計數字可能依警方偵查進度微調，實際街區治安狀況仍建議綜合現地夜間照明與人流評估。
            </p>
            <p className="text-[10px] leading-relaxed text-[#8A9590]">
              等級代表「本町丁目全年報案件數在東京 5,000 多個町丁目中的相對位置」，並非個別物件的風險預測。一個町丁目通常涵蓋數千住戶，且街頭案件數未扣除人流與商業密度，車站與商圈周邊會自然偏高。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
