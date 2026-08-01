import { AlertTriangle, CheckCircle2, ClipboardCheck, HelpCircle } from "lucide-react";
import { buildMarketReality, type RentRecommendation, type RentSearchCriteria } from "../lib/rentAnalysis";

type AssessmentStatus = "資訊已提供" | "有預算內方向" | "接近預算" | "超出預算" | "部分符合" | "需要取捨" | "難度高" | "待確認" | "彈性較高";
type OverallLevel = "方向可行" | "需要取捨" | "難度高" | "資料不足";

interface AssessmentRow {
  category: string;
  detail: string;
  status: AssessmentStatus;
  explanation: string;
}

const roomLabel = (roomType: RentSearchCriteria["roomType"]) => ({
  r1: "1R",
  k1: "1K／1DK",
  ldk1: "1LDK／2K／2DK",
  ldk2: "2LDK"
}[roomType]);

const yen = (value: number) => `${Math.round(value / 1000) * 1000}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const badgeStyle: Record<AssessmentStatus, string> = {
  "資訊已提供": "border-[#D6EAF0] bg-[#F2F8FA] text-[#3F626D]",
  "有預算內方向": "border-[#9ee2cf] bg-[#e6f6f1] text-[#007d5a]",
  "接近預算": "border-[#DCC8A1] bg-[#FFF9ED] text-[#7A5A1F]",
  "超出預算": "border-[#E94E2B] bg-[#FBDFD2] text-[#B13818]",
  "部分符合": "border-[#DCC8A1] bg-[#FFF9ED] text-[#7A5A1F]",
  "需要取捨": "border-[#DCC8A1] bg-[#FFF9ED] text-[#7A5A1F]",
  "難度高": "border-[#E94E2B] bg-[#FBDFD2] text-[#B13818]",
  "待確認": "border-[#D6EAF0] bg-[#F2F8FA] text-[#3F626D]",
  "彈性較高": "border-[#9ee2cf] bg-[#e6f6f1] text-[#007d5a]"
};

const overallStyle: Record<OverallLevel, string> = {
  "方向可行": "border-[#9ee2cf] bg-[#e6f6f1] text-[#007d5a]",
  "需要取捨": "border-[#DCC8A1] bg-[#FFF9ED] text-[#7A5A1F]",
  "難度高": "border-[#E94E2B] bg-[#FBDFD2] text-[#B13818]",
  "資料不足": "border-[#D6EAF0] bg-[#F2F8FA] text-[#3F626D]"
};

function overallAssessment(criteria: RentSearchCriteria, recommendations: RentRecommendation[]) {
  if (!criteria.maxBudget || !recommendations.length) {
    return { level: "資料不足" as OverallLevel, summary: "補上月租上限與主要通勤地點，就能判斷哪些區域找得到。" };
  }
  const withinBudget = recommendations.filter(item => item.fit === "預算內").length;
  const restrictiveCount = [
    criteria.furnished,
    criteria.buildingAgeMax && criteria.buildingAgeMax <= 5,
    criteria.petsAllowed,
    criteria.tower
  ].filter(Boolean).length;
  const unresolvedCount = [
    criteria.budgetIncludesFees === null || criteria.budgetIncludesFees === undefined,
    Boolean(criteria.commuteMinutes && recommendations.some(item => !item.commuteRoute)),
    Boolean(criteria.unverifiedConditions?.length),
    criteria.furnishedPriority === "uncertain"
  ].filter(Boolean).length;
  const unresolvedLabels = [
    criteria.budgetIncludesFees === null || criteria.budgetIncludesFees === undefined ? "管理費" : null,
    criteria.commuteMinutes && recommendations.some(item => !item.commuteRoute) ? "通勤時間" : null,
    criteria.buildingAgeMax ? "屋齡" : null,
    criteria.furnished ? "家具家電" : null,
    criteria.petsAllowed ? "寵物條件" : null,
    criteria.unverifiedConditions?.length ? "逐屋條件" : null
  ].filter(Boolean) as string[];

  if (!withinBudget) {
    const closest = Math.min(...recommendations.map(item => item.estimate));
    const gapRatio = (closest - criteria.maxBudget) / criteria.maxBudget;
    return gapRatio <= 0.1
      ? { level: "需要取捨" as OverallLevel, summary: "六個方向都略高於預算。小幅提高預算，或放寬一項次要條件即可繼續找。" }
      : { level: "難度高" as OverallLevel, summary: "六個方向都超出預算。要維持地點與房型，就需要提高月租上限；否則應擴大搜尋範圍。" };
  }
  if (restrictiveCount >= 2 || unresolvedCount >= 2) {
    return {
      level: "需要取捨" as OverallLevel,
      summary: unresolvedLabels.length
        ? `有 ${withinBudget} 個方向符合預算；${unresolvedLabels.join("、")}會決定最後可選房源數，先按必要程度排序。`
        : `有 ${withinBudget} 個方向符合預算，但高影響條件較多，建議先排出必要條件與加分條件。`
    };
  }
  return {
    level: "方向可行" as OverallLevel,
    summary: `有 ${withinBudget} 個方向符合預算，可以開始找實際物件。`
  };
}

function buildRows(criteria: RentSearchCriteria, recommendations: RentRecommendation[]): AssessmentRow[] {
  const withinBudget = recommendations.filter(item => item.fit === "預算內").length;
  const lowest = recommendations.length ? Math.min(...recommendations.map(item => item.rangeLow)) : 0;
  const highest = recommendations.length ? Math.max(...recommendations.map(item => item.rangeHigh)) : 0;
  const closestEstimate = recommendations.length ? Math.min(...recommendations.map(item => item.estimate)) : null;
  const budgetGapRatio = criteria.maxBudget && closestEstimate ? (closestEstimate - criteria.maxBudget) / criteria.maxBudget : null;
  const directOptions = recommendations.filter(item => item.commuteFit === "直達線路").length;
  const routedOptions = recommendations.filter(item => item.commuteRoute);
  const commuteTimes = routedOptions.map(item => item.commuteRoute!.totalDurationMinutes);
  const withinCommuteLimit = criteria.commuteMinutes
    ? routedOptions.filter(item => item.commuteRoute!.totalDurationMinutes <= criteria.commuteMinutes).length
    : routedOptions.length;
  const location = [
    ...(criteria.districts || []), criteria.district,
    criteria.line,
    ...(criteria.stations || []).map(station => `${station}站`),
    criteria.station ? `${criteria.station}站` : null,
    criteria.commuteStation ? `通勤至 ${criteria.commuteStation}${criteria.commuteMinutes ? `・${criteria.commuteMinutes} 分鐘內` : ""}` : criteria.locationPreference
  ].filter(Boolean).join("・");
  const normalEquipment = [
    criteria.washbasin ? "獨立洗面台" : null,
    criteria.bidet ? "免治馬桶" : null,
    criteria.elevator ? "電梯" : null,
    criteria.autoLock ? "一樓自動門" : null,
    criteria.balcony ? "陽台" : null,
    criteria.gasBurnersMin ? `瓦斯爐 ${criteria.gasBurnersMin} 口以上` : null,
    criteria.freeInternet ? "免費網路" : null,
    criteria.cityGasRequired ? "都市瓦斯指定" : null
  ].filter(Boolean) as string[];
  const unverified = criteria.unverifiedConditions || [];

  const budgetStatus: AssessmentStatus = !criteria.maxBudget
    ? "待確認"
    : withinBudget > 0
      ? "有預算內方向"
      : budgetGapRatio !== null && budgetGapRatio <= 0.1
        ? "接近預算"
        : "超出預算";

  const furnishedLabel = criteria.furnished
    ? `家具家電（${criteria.furnishedPriority === "uncertain" ? "是否必要尚未確認" : criteria.furnishedPriority === "preferred" ? "希望條件" : "必要條件"}）`
    : null;
  const visaType = criteria.visaType?.trim() || "";
  const isStudentVisa = /留學|留学|學生|学生/.test(visaType);
  const isWorkVisa = /技人[國国]|技術|技术|人文|國際業務|国际业务|就勞|就劳|工作/.test(visaType);
  const visaExplanation = !visaType
    ? "請補上在留資格與期限，才能判斷可申請的房源及審查文件。"
    : isStudentVisa
      ? "留學身分可正常申請租屋。找房時優先確認物件是否接受外國籍學生，常用資料是入學證明、在留資料、財力資料與日本緊急聯絡人。"
      : isWorkVisa
        ? "工作簽證可正常申請一般長期租賃。審查重點通常是任職公司、雇用狀態、年收入與日本緊急聯絡人，不需要套用留學生條件。"
        : `${visaType}已納入審查條件；實際申請時依管理公司要求準備在留、工作或收入資料。`;

  return [
    {
      category: "身份與審查資料",
      detail: criteria.visaType ? `${criteria.visaType}${criteria.visaYears ? `・在留期間 ${criteria.visaYears} 年` : ""}` : "未提供簽證資料",
      status: criteria.visaType ? "資訊已提供" : "待確認",
      explanation: visaExplanation
    },
    {
      category: "預算與市場方向",
      detail: criteria.maxBudget
        ? `${criteria.minBudget ? `每月 ¥${yen(criteria.minBudget)}～` : "每月上限 "}¥${yen(criteria.maxBudget)}${criteria.budgetIncludesFees === true ? "（含管理費）" : criteria.budgetIncludesFees === false ? "（不含管理費）" : "（是否含管理費未確認）"}`
        : "未指定月租上限",
      status: budgetStatus,
      explanation: `${buildMarketReality(criteria, recommendations)}${recommendations.length ? ` 六個搜尋方向的整體推估區間約為 ¥${yen(lowest)}～¥${yen(highest)}；區間上緣可能超出預算。` : ""}`
    },
    {
      category: "地點與通勤",
      detail: location || "未指定線路、車站或行政區",
      status: !location ? "待確認" : routedOptions.length && withinCommuteLimit === routedOptions.length ? "資訊已提供" : routedOptions.length && withinCommuteLimit > 0 ? "部分符合" : routedOptions.length ? "需要取捨" : directOptions > 0 ? "部分符合" : "需要取捨",
      explanation: !location
        ? "請至少提供通勤目的地或偏好線路，才能建立有意義的搜尋方向。"
        : routedOptions.length
          ? `${routedOptions.length} 個方向已完成路線試算：通勤約 ${Math.min(...commuteTimes)}～${Math.max(...commuteTimes)} 分鐘，${withinCommuteLimit} 個符合${criteria.commuteMinutes ? ` ${criteria.commuteMinutes} 分鐘內` : "通勤條件"}，其中 ${routedOptions.filter(item => item.commuteRoute!.transfers === 0).length} 個直達。卡片內可直接比較班次、轉乘站與各段路線。`
        : criteria.commuteStation
          ? `${directOptions} 個方向可沿共同線路前往 ${criteria.commuteStation}。目前路線服務未回傳班次時間，所以先標為部分符合；恢復路線資料後會改用實際車程與轉乘數判定。`
          : "已依指定地區與線路排序；補上通勤目的地後，可進一步比較實際車程。"
    },
    {
      category: "格局與面積",
      detail: `${roomLabel(criteria.roomType)}${criteria.areaMin ? `・${criteria.areaMin}㎡以上` : "・面積未指定"}`,
      status: criteria.areaMin ? (criteria.areaMin >= (criteria.roomType === "ldk2" ? 50 : criteria.roomType === "ldk1" ? 35 : 25) ? "需要取捨" : "部分符合") : "待確認",
      explanation: criteria.areaMin
        ? `已按 ${roomLabel(criteria.roomType)}、${criteria.areaMin}㎡以上估價；面積越大，可選車站會越外圍。`
        : `目前先用 ${roomLabel(criteria.roomType)} 的常見面積估價。補上最低坪數後，價格與推薦車站會更準。`
    },
    {
      category: "建物條件",
      detail: [criteria.structure, criteria.buildingAgeMax ? `屋齡約 ${criteria.buildingAgeMax} 年內${criteria.buildingAgePriority === "preferred" ? "（希望）" : ""}` : null, criteria.floorMin ? `${criteria.floorMin} 樓以上` : null].filter(Boolean).join("・") || "未限制結構、屋齡或樓層",
      status: criteria.buildingAgeMax && criteria.buildingAgeMax <= 5 ? "難度高" : criteria.buildingAgeMax && criteria.buildingAgeMax <= 10 ? "需要取捨" : "彈性較高",
      explanation: criteria.buildingAgeMax && criteria.buildingAgeMax <= 5
        ? `屋齡 ${criteria.buildingAgeMax} 年內會大幅縮小房源。${criteria.buildingAgePriority === "preferred" ? "建議列為加分條件，並接受屋齡較高但翻新與管理良好的物件。" : "若不能放寬，就要提高預算或擴大車站範圍。"}`
        : criteria.buildingAgeMax
          ? `已把屋齡 ${criteria.buildingAgeMax} 年內列入搜尋。採光、隔音與管理狀況會在實際物件階段另外比較。`
          : "沒有設定屋齡上限，房源選擇較多；會優先比較翻新、管理與室內狀況。"
    },
    {
      category: criteria.furnished ? "設備與家具家電" : "設備條件",
      detail: [...normalEquipment, furnishedLabel].filter(Boolean).join("・") || "未指定特殊設備",
      status: criteria.furnishedPriority === "uncertain" ? "待確認" : criteria.furnished ? "需要取捨" : normalEquipment.length >= 3 ? "需要取捨" : normalEquipment.length ? "部分符合" : "彈性較高",
      explanation: criteria.furnished
        ? `日本一般長期租賃以空屋出租為主，附家具家電房源相對少，常見於外國人向、短租或特定管理公司的套裝物件，租金通常較高。${criteria.furnishedPriority === "uncertain" ? "原文是「可能需要」，應先確認是否為必要條件；若只是希望有，建議改列加分項目。" : "若預算固定，建議同步比較空屋搭配家具租借或二手購入的總成本。"}${normalEquipment.length ? ` 另有 ${normalEquipment.join("、")} 等設備需求，需逐間核對募集圖面。` : ""}`
        : normalEquipment.length
          ? `已把 ${normalEquipment.join("、")}列入篩選；搜尋實際物件時會逐項核對。`
          : "沒有指定必要設備，這項不會縮小搜尋範圍。"
    },
    {
      category: "逐屋與特殊條件",
      detail: [criteria.petsAllowed ? `可養${criteria.petType || "寵物"}` : null, ...unverified].filter(Boolean).join("・") || "未指定需逐屋確認的特殊條件",
      status: criteria.petsAllowed ? "難度高" : unverified.length ? "待確認" : "彈性較高",
      explanation: criteria.petsAllowed
        ? "寵物條件會明顯減少房源，且可能增加敷金或清潔費；應保留為必要篩選。"
        : unverified.length
          ? `${unverified.join("、")}已列入實際物件檢查清單，會用募集圖面、告知事項與現場環境逐項排除。`
          : "沒有額外特殊條件，搜尋範圍不受這項限制。"
    }
  ];
}

export function RequirementAssessment({ criteria, recommendations }: {
  criteria: RentSearchCriteria;
  recommendations: RentRecommendation[];
}) {
  const rows = buildRows(criteria, recommendations);
  const overall = overallAssessment(criteria, recommendations);
  const OverallIcon = overall.level === "方向可行" ? CheckCircle2 : overall.level === "資料不足" ? HelpCircle : AlertTriangle;

  return (
    <section className="mt-6 border border-[#1A2A22] bg-white" aria-labelledby="requirement-assessment-title">
      <div className="border-b border-[#1A2A22] bg-[#F5F8F6] p-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-[#00a174]" />
          <h4 id="requirement-assessment-title" className="text-base font-bold text-[#1A2A22]">需求可行性評估</h4>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-[#66736C] font-sans">先評估原始需求，再另外查看右側六個市場搜尋方向</p>
        <div className={`mt-3 border p-3 ${overallStyle[overall.level]}`}>
          <div className="flex items-center gap-2">
            <OverallIcon className="h-4 w-4 shrink-0" />
            <span className="text-xs font-bold">整體評估：{overall.level}</span>
          </div>
          <p className="mt-1 text-[10px] leading-relaxed font-sans">{overall.summary}</p>
        </div>
      </div>
      <div className="divide-y divide-[#DDE3DF]">
        {rows.map(row => (
          <div key={row.category} className="p-4 font-sans">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold text-[#1A2A22]">{row.category}</p>
                <p className="mt-1 text-xs leading-relaxed text-[#3F5147]">{row.detail}</p>
              </div>
              <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${badgeStyle[row.status]}`}>{row.status}</span>
            </div>
            <p className="mt-2 border-l-2 border-[#9ee2cf] pl-2 text-[10px] leading-relaxed text-[#66736C]">{row.explanation}</p>
          </div>
        ))}
      </div>
      <p className="border-t border-[#DDE3DF] bg-[#FAFCFB] p-3 text-[9px] leading-relaxed text-[#8A9590] font-sans">六個結果是行政區／車站層級的搜尋方向，不是即時空室，也不表示已同時滿足全部必要條件。通勤採指定時段的 Google Routes Transit 結果；管理費、審查與逐屋條件仍需依實際物件確認。</p>
    </section>
  );
}
