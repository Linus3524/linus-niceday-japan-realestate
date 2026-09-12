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
  level: number; // 1 ~ 5 格指示器
}

/**
 * 等級文案。住宅與街區是兩種完全不同的指標，共用一組敘述會寫出錯位的建議
 * （例如住宅卡出現「夜間行走」、街區卡出現「門鎖」），因此拆成兩套。
 *
 * 撰寫原則：每一句都要讓讀者知道「範圍＝整個町丁目、期間＝全年、單位＝報案件數」。
 * 町丁目通常涵蓋數千住戶，不點明範圍的話，個位數件數很容易被讀成「這間房子會被偷」。
 */
interface GradeCopy {
  label: string;
  description: string;
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
    level: 2,
  },
  // C 與 D 原本共用同一組紅色且 level 都是 1，視覺上完全分不出來。
  // C 改為琥珀色（與 B 同色系但更深），紅色只保留給 D，避免「件數略高」被讀成「危險」。
  C: {
    bg: "#FFF4E5",
    text: "#B76E00",
    border: "#FFD599",
    accent: "#B76E00",
    badgeBg: "#FFFFFF",
    badgeText: "#B76E00",
    badgeBorder: "#FFD599",
    level: 2,
  },
  D: {
    bg: "#FDE8E8",
    text: "#C81E1E",
    border: "#F8B4B4",
    accent: "#C81E1E",
    badgeBg: "#FFFFFF",
    badgeText: "#C81E1E",
    badgeBorder: "#F8B4B4",
    level: 1,
  },
};

/**
 * 住宅防盜文案。對應 residentialGrade（住家三手口 ÷ 世帯數）。
 * 刻意不使用「危險／治安差」這類形容詞：侵入竊盜的可控因素是門禁設備與住戶習慣，
 * 導向「看屋時確認什麼」比貼標籤對使用者更有用。
 */
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

/**
 * 無法換算成發生率時的說明。
 * 這種町丁目多半是商辦、工業或埋立地：登記住戶極少，
 * 任何一件都會讓「每千戶」變成極端值，硬算反而誤導。
 */
const RATE_UNAVAILABLE_COPY: Record<RateUnavailableReason, string> = {
  "no-population-data": "本町丁目查無住戶數資料，以下僅顯示原始件數，未換算成每千戶發生率。",
  "too-few-households": "本町丁目登記住戶極少（多為商辦、工業或填海區），換算成每千戶發生率不具參考意義，以下僅顯示原始件數。",
};

/**
 * 街區活動強度文案。對應 streetActivity。
 *
 * 這裡刻意不是「好壞」而是「安靜↔熱鬧」：
 * 原本的 A+~D 等級隱含價值判斷，但該分數與総合計的相關性 0.613、
 * 與人口僅 0.327，它測的是人流量不是治安。實測有 302 個町丁目（6.5%）
 * 會出現「住宅 A ／街區 D」的矛盾組合，全是銀座、赤坂這類住家侵入 0 件的地方。
 *
 * 改成描述後，繁華街是事實陳述而非扣分，使用者自行判斷要熱鬧還是安靜。
 */
const ACTIVITY_COPY: Record<
  StreetActivityLevel,
  { label: string; description: string; accent: string; bg: string; border: string; level: number }
> = {
  quiet: {
    label: "安靜住宅區",
    description: "全年無街頭案件報案紀錄，屬人流量低的純住宅環境。",
    accent: "#007D5A", bg: "#F2FAF7", border: "#CDEBE0", level: 1,
  },
  residential: {
    label: "一般生活街區",
    description: "街頭案件僅零星紀錄，屬多數東京住宅區的常見水準。",
    accent: "#007D5A", bg: "#F2FAF7", border: "#CDEBE0", level: 2,
  },
  mixed: {
    label: "住商混合",
    description: "有一定的店舖與通勤人流，街頭案件數屬東京中段水準。",
    accent: "#1E65B8", bg: "#F4F8FD", border: "#CFE0F4", level: 3,
  },
  busy: {
    label: "人流密集商圈",
    description: "車站、商店街或飲食店密集，日間與夜間人流量大，街頭案件數隨之偏高。",
    accent: "#1E65B8", bg: "#F4F8FD", border: "#CFE0F4", level: 4,
  },
  entertainment: {
    label: "繁華街／轉運站",
    description: "屬大型繁華街或轉運站周邊，案件多集中於飲食店街與深夜時段，與住宅區的居住環境是兩回事。",
    accent: "#7C5CBF", bg: "#F7F5FC", border: "#DED4F2", level: 5,
  },
};

/** 趨勢方向的呈現。刻意不把「上升」染紅：町丁目件數小，波動未必是趨勢。 */
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
    // 這一組同時含住家與商辦，標題不能只說「住宅」，
    // 否則商圈型町丁目的事務所遭竊會被誤讀成住家風險。
    desc: "空巢、忍込み等住家侵入，以及事務所、店舖等非住家侵入",
  },
  street: {
    // 不叫「人身安全」：這組 4,157/7,617 件是暴行，且與商業密度相關 0.351，
    // 多半發生在飲食店街的深夜衝突，不是住戶在自家附近遇襲。
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

  /**
   * 商圈脈絡提示。
   *
   * 街區強度高但住家侵入低的組合，實測有 302 個町丁目（6.5%）——
   * 銀座、神保町、赤坂、勝どき等，住家侵入全是 0 件。
   * 這群最容易被誤讀成「住起來危險」，主動說明兩者是不同的事。
   */
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
      // 這裡要引用住家三手口而非「侵入窃盗計」：後者有 58.5% 是事務所・店舖遭竊，
      // 在商圈型街區尤其嚴重（銀座 8 丁目計 50 件，但住家 0 件），
      // 講錯數字會讓這段「請放心」的說明反而變成扣分。
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

  /**
   * 同級內的程度區分。只在住宅 C／D 這種開放區間顯示名次。
   * 街區名次刻意不顯示——活動強度不是排名概念，「全東京第 23 熱鬧」沒有意義。
   */
  const severityRanks = useMemo(() => {
    const ctx = crime.tokyoContext;
    if (!ctx) return [] as Array<{ label: string; rank: number }>;
    const out: Array<{ label: string; rank: number }> = [];
    if (crime.residentialGrade === "C" || crime.residentialGrade === "D") {
      out.push({ label: "住家侵入", rank: ctx.residentialRankFromWorst });
    }
    return out;
  }, [crime.tokyoContext, crime.residentialGrade]);

  /**
   * 三項摘要的配色。門檻對齊上方評級，避免同一張卡對同一個數字給出不同訊號：
   * 0 件＝綠、零星（住家 1~3／街區 1~6／凶惡 1）＝琥珀、再高才轉紅。
   * 凶惡犯件數少但性質重大，門檻另外抓在 2 件。
   */
  const summaryStats = useMemo(() => {
    const tone = (count: number, amberMax: number) =>
      count === 0
        ? { box: "border-[#9EE2CF] bg-[#E6F6F1]", icon: "text-[#007D5A]", text: "text-[#007D5A]" }
        : count <= amberMax
        ? { box: "border-[#FFD599] bg-[#FFF4E5]", icon: "text-[#B76E00]", text: "text-[#B76E00]" }
        : { box: "border-[#F8B4B4] bg-[#FDE8E8]", icon: "text-[#C81E1E]", text: "text-[#C81E1E]" };

    // 這一格只能算住家三手口。若沿用含事務所荒し的合計，
    // 銀座 8 丁目會出現「等級 A」旁邊紅底「侵入竊盜 50 件」的自相矛盾。
    const homeCount =
      typeof crime.burglaryRate === "string" ? residentialCount : crime.burglaryRate.count;

    // 街頭案件刻意用中性灰：它主要反映人流量，
    // 染成紅色等於把「這裡很熱鬧」講成「這裡很危險」。
    const neutral = { box: "border-[#DDE3DF] bg-[#F5F8F6]", icon: "text-[#66736C]", text: "text-[#3F5147]" };

    return [
      { label: "住家侵入", count: homeCount, tone: tone(homeCount, 3) },
      { label: "街頭案件", count: streetCount, tone: neutral },
      { label: "凶惡案件", count: felonyCount, tone: tone(felonyCount, 1) },
    ];
  }, [crime.burglaryRate, residentialCount, streetCount, felonyCount]);

  // 犯罪構成百分比
  const total = crime.totalCrimes;
  const segments = useMemo(() => {
    if (total <= 0) return [];
    return [
      { key: "property", label: "自行車/財產輕罪", count: propertyCount, color: "#007D5A" },
      { key: "other", label: "其他刑法", count: otherCount, color: "#8A9590" },
      { key: "street", label: "街頭案件", count: streetCount, color: "#B76E00" },
      { key: "residential", label: "侵入竊盜", count: residentialCount, color: "#C81E1E" },
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
          {/* 左卡：町丁目侵入竊盜統計 */}
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
                {/* 標題明講「町丁目」與「住家侵入竊盜」：原本的「住宅防盜評級」
                    容易被誤讀成在評這間房子的防盜設備等級。 */}
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

            <div className="flex items-baseline gap-2.5">
              <span
                className="text-3xl font-black tracking-tight leading-none tabular-nums"
                style={{ color: residentialStyle.text }}
              >
                {crime.residentialGrade}
              </span>
              {/* 主數字給「每千戶發生率」，因為等級是照它判的；
                  原始件數與戶數放在下一行，讓使用者能自行驗算。 */}
              <span className="text-xs font-bold text-[#1A2A22]">
                {typeof crime.burglaryRate === "string"
                  ? residentialCount === 0
                    ? "全町丁目全年 0 件"
                    : `全町丁目全年 ${residentialCount} 件`
                  : crime.burglaryRate.count === 0
                    ? "住家侵入全年 0 件"
                    : `每千戶 ${crime.burglaryRate.per1000} 件／年`}
              </span>
            </div>

            {typeof crime.burglaryRate !== "string" && crime.burglaryRate.count > 0 && (
              <p className="text-[10px] leading-snug text-[#66736C] tabular-nums">
                住家侵入 {crime.burglaryRate.count} 件 ÷{" "}
                {crime.burglaryRate.households.toLocaleString()} 戶
              </p>
            )}

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
              {residentialCopy.description}
            </p>

            {/* 退回件數時必須講清楚，否則使用者無從得知這張卡的精度與其他物件不同。 */}
            {typeof crime.burglaryRate === "string" && (
              <p className="border-t border-dashed pt-2 text-[10px] leading-snug text-[#66736C]"
                style={{ borderColor: residentialStyle.border }}
              >
                {RATE_UNAVAILABLE_COPY[crime.burglaryRate]}
              </p>
            )}
          </div>

          {/* 右卡：街區活動強度。
              刻意不給 A~D 等級——這個指標測的是人流量不是治安，
              給等級會讓「繁華街」被讀成「不及格」。 */}
          <div
            className="border p-3.5 space-y-2.5 transition-colors"
            style={{
              backgroundColor: activity.bg,
              borderColor: activity.border,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Footprints className="h-3.5 w-3.5" style={{ color: activity.accent }} />
                <span className="text-xs font-bold text-[#1A2A22]">街區活動強度</span>
              </div>
              <span className="text-[10px] font-medium text-[#66736C]">非治安評級</span>
            </div>

            <div className="flex items-baseline gap-2.5">
              <span
                className="text-xl font-black tracking-tight leading-none"
                style={{ color: activity.accent }}
              >
                {activity.label}
              </span>
              <span className="text-[11px] font-bold text-[#1A2A22]">
                街頭案件 {streetCount} 件／年
              </span>
            </div>

            {/* 5 段式強度指示器：由左至右 = 由安靜到熱鬧，不是由好到壞 */}
            <div className="flex gap-1 h-1.5 w-full">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <div
                  key={lvl}
                  className="flex-1 h-1.5"
                  style={{
                    backgroundColor:
                      lvl <= activity.level ? activity.accent : `${activity.border}90`,
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between text-[9px] text-[#66736C]">
              <span>安靜</span>
              <span>繁華</span>
            </div>

            <p className="text-[11px] leading-snug text-[#3F5147]">
              {activity.description}
            </p>

            {/* 對行人的直接危害單獨列出。
                這類事件與商業活動的相關性遠低於暴行（0.088 vs 0.351），
                混在總分裡會被人流量淹沒，但對行人是真正該知道的資訊。 */}
            {crime.pedestrianRisks.length > 0 && (
              <div
                className="space-y-1 border-t border-dashed pt-2"
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

        {/* 商圈脈絡：街區偏高但住宅良好時，主動解釋兩者差異，
            避免使用者把「車站周邊人流大」讀成「住起來危險」。 */}
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

        {/* 全東京對照與今年至今趨勢：只有評級數字會看不出「這算好還是壞」，這一列給比較基準 */}
        {(crime.tokyoContext || crime.burglaryTrend || crime.streetTrend) && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {crime.tokyoContext && (
              <div className="flex flex-col justify-between border border-[#DDE3DF] bg-[#F5F8F6] px-3 py-2.5">
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#1A2A22]">
                    <Layers className="h-3.5 w-3.5 text-[#007D5A]" />
                    <span>對照全東京 {crime.tokyoContext.chomeCount.toLocaleString()} 個町丁目</span>
                  </div>
                  {/* 刻意只留這兩項。原本還有「街區粗暴」百分位，但那個分數已改為
                      活動強度（熱鬧程度），放進「愈高愈安全」的列會自相矛盾：
                      銀座住家侵入 0 件卻在這裡拿到低分，等於自己打自己臉。 */}
                  <dl className="mt-1.5 grid grid-cols-2 gap-2 text-center">
                    {[
                      { label: "住家侵入", value: crime.tokyoContext.residentialSaferThanPercent },
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
                {/* C／D 是開放區間，內部差距可達數十倍（歌舞伎町 vs 千住2丁目同為 D）。
                    落在這兩級時補上實際名次，讓「偏高」的程度可被判讀。 */}
                {severityRanks.length > 0 && (
                  <p className="pt-1 text-[10px] leading-snug text-[#66736C]">
                    件數由高到低排名：
                    {severityRanks.map((r, i) => (
                      <span key={r.label}>
                        {i > 0 && "、"}
                        {r.label}第{" "}
                        <span className="font-bold tabular-nums text-[#3F5147]">{r.rank.toLocaleString()}</span> 名
                      </span>
                    ))}
                    （共 {crime.tokyoContext.chomeCount.toLocaleString()} 個）
                  </p>
                )}
              </div>
            )}
            {/* 年對年趨勢。
                刻意用「兩個完整年度」而非「今年至今 vs 去年全年」：
                警視庁只發布今年的月累計，沒有去年同期檔，
                拿 7 個月對 12 個月會讓每個地區都假性下降約 4 成。 */}
            {(crime.burglaryTrend || crime.streetTrend) && (
              <div className="flex flex-col justify-between border border-[#DDE3DF] bg-[#F5F8F6] px-3 py-2.5">
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#1A2A22]">
                    <TrendingUp className="h-3.5 w-3.5 text-[#007D5A]" />
                    <span>
                      年對年變化（
                      {(crime.burglaryTrend ?? crime.streetTrend)!.previousLabel.replace(/（.*/, "")}
                      →
                      {(crime.burglaryTrend ?? crime.streetTrend)!.currentLabel.replace(/（.*/, "")}
                      ）
                    </span>
                  </div>
                  <dl className="mt-1.5 grid grid-cols-2 gap-2 text-center">
                    {[
                      { label: "住家侵入", trend: crime.burglaryTrend },
                      { label: "街頭案件", trend: crime.streetTrend },
                    ].map(({ label, trend }) => {
                      const meta = trend ? TREND_META[trend.direction] : null;
                      return (
                        <div key={label}>
                          <dt className="text-[10px] text-[#66736C]">{label}</dt>
                          <dd className="text-sm font-black tabular-nums text-[#1A2A22]">
                            {trend ? `${trend.previous} → ${trend.current} 件` : "—"}
                          </dd>
                          <dd
                            className="text-[10px] tabular-nums"
                            style={{ color: meta?.color ?? "#8A9590" }}
                          >
                            {trend && meta
                              ? `${meta.icon} ${
                                  trend.direction === "flat"
                                    ? "持平"
                                    : trend.changePercent !== null
                                      ? `${Math.abs(trend.changePercent)}%`
                                      : `${Math.abs(trend.current - trend.previous)} 件`
                                }`
                              : "無對照資料"}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </div>
                <p className="mt-auto pt-1.5 text-[10px] leading-snug text-[#66736C]">
                  町丁目件數基數小，±1 件視為持平；單一年度的增減未必代表長期趨勢。
                </p>
              </div>
            )}
          </div>
        )}

        {/* 町丁目全年案件數三項摘要。
            原本只要件數 !== 0 就整格紅底＋警告圖示，會出現「評級 B+ 卻配紅色警示」的矛盾；
            改為跟上方評級同一套色階（0 件綠／零星琥珀／偏高才紅）。 */}
        <div className="grid grid-cols-3 gap-2">
          {summaryStats.map((stat) => (
            <div
              key={stat.label}
              className={`flex flex-col items-center justify-center border px-2 py-2 text-center ${stat.tone.box}`}
            >
              <div className="flex items-center gap-1">
                {stat.count === 0 ? (
                  <CheckCircle2 className={`h-3.5 w-3.5 ${stat.tone.icon}`} />
                ) : (
                  <AlertCircle className={`h-3.5 w-3.5 ${stat.tone.icon}`} />
                )}
                <span className="text-[11px] font-bold text-[#1A2A22]">{stat.label}</span>
              </div>
              <span className={`mt-0.5 text-xs font-black tabular-nums ${stat.tone.text}`}>
                {stat.count} 件
              </span>
              <span className="text-[9px] leading-tight text-[#66736C]">全年・全町丁目</span>
            </div>
          ))}
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
