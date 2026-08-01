import { budgetModifiers } from "../data/rentGuideData.js";
import type { StationInfo } from "../data/stationData.js";
import { rentRates, districtStations } from "../data/housingMarket.js";
import { TAMA_CITIES } from "./calcRules.js";

export type RoomType = "r1" | "k1" | "ldk1" | "ldk2";

export interface RentSearchCriteria {
  roomType: RoomType;
  areaMin?: number | null;
  minBudget?: number | null;
  maxBudget?: number | null;
  budgetIncludesFees?: boolean | null;
  district?: string | null;
  districts?: string[];
  station?: string | null;
  stations?: string[];
  line?: string | null;
  walkMinutes?: number | null;
  commuteStation?: string | null;
  commuteStations?: string[];
  commuteMinutes?: number | null;
  locationPreference?: string | null;
  nearbyAmenity?: string | null;
  amenityWalkMinutes?: number | null;
  buildingAgeMax?: number | null;
  visaType?: string | null;
  visaYears?: number | null;
  structure?: string | null;
  autoLock?: boolean;
  floorMin?: number | null;
  balcony?: boolean;
  gasBurnersMin?: number | null;
  freeInternet?: boolean;
  lpGasAccepted?: boolean;
  cityGasRequired?: boolean;
  petsAllowed?: boolean;
  petType?: string | null;
  washbasin?: boolean;
  bidet?: boolean;
  elevator?: boolean;
  furnished?: boolean;
  furnishedPriority?: "required" | "preferred" | "uncertain" | null;
  buildingAgePriority?: "required" | "preferred" | "uncertain" | null;
  commuteDirectRequired?: boolean;
  unverifiedConditions?: string[];
  tower?: boolean;
  analysisNotes?: {
    visa?: string | null;
    location?: string | null;
    amenity?: string | null;
    layout?: string | null;
    building?: string | null;
    walking?: string | null;
    equipment?: string | null;
    special?: string | null;
  } | null;
}

export interface RentRecommendation {
  district: string;
  region: string;
  station: string | null;
  lines: string[];
  estimate: number;
  rangeLow: number;
  rangeHigh: number;
  budgetGap: number | null;
  fit: "預算內" | "接近預算" | "需調整";
  recommendationType: "指定車站" | "指定範圍" | "通勤優先" | "預算替代";
  reasons: string[];
  commuteFit: "直達線路" | "需確認轉乘" | "未指定通勤地";
  commuteTimeFit: "路線已查詢" | "時間未驗證" | "未指定時間";
  cautions: string[];
  commuteRoute?: CommuteRouteDetails | null;
}

export interface CommuteRouteSegment {
  type: "train" | "subway" | "rail" | "bus" | "walk";
  lineName: string;
  lineShortName: string | null;
  lineColor: string;
  lineTextColor: string;
  operator: string | null;
  departureStop: string;
  arrivalStop: string;
  startStationNumber?: string | null;
  endStationNumber?: string | null;
  departureTime: string | null;
  arrivalTime: string | null;
  durationMinutes: number;
  stopCount: number | null;
  headsign: string | null;
}

export interface CommuteRouteDetails {
  source: "google_routes";
  originStation: string;
  destinationStation: string;
  totalDurationMinutes: number;
  transfers: number;
  departureTime: string | null;
  arrivalTime: string | null;
  referenceLabel: string;
  segments: CommuteRouteSegment[];
}

export function buildMarketReality(criteria: RentSearchCriteria, recommendations: RentRecommendation[]) {
  const budget = criteria.maxBudget;
  if (!budget || budget <= 0) {
    return "尚未指定月租上限；以下先依條件列出市場區間，另請預留管理費、共益費與初期費用。";
  }

  if (!recommendations.length) {
    return "目前沒有足夠資料產生搜尋方向；請補充預算、格局或通勤目的地。";
  }

  const feeNotice = criteria.budgetIncludesFees === true
    ? "預算包含管理費；看實際物件時以租金加管理費不超過上限為準。"
    : criteria.budgetIncludesFees === false
      ? "管理費另計。"
      : "請確認預算是否包含管理費，這會直接影響可選房源。";
  const withinBudget = recommendations.filter(item => item.estimate <= budget).length;
  if (withinBudget > 0) {
    const pendingConditions = [
      criteria.commuteStation && recommendations.some(item => !item.commuteRoute) ? "通勤時間" : null,
      criteria.buildingAgeMax ? "屋齡" : null,
      criteria.furnished ? "家具家電" : null,
      criteria.petsAllowed ? "寵物條件" : null,
      criteria.unverifiedConditions?.length ? "逐屋條件" : null
    ].filter(Boolean);
    const pendingText = pendingConditions.length
      ? `接下來要確認的是${pendingConditions.join("、")}。`
      : "可直接進入實際物件搜尋。";
    return `有 ${withinBudget} 個搜尋方向落在預算內，預算設定可行。${pendingText}${feeNotice}`;
  }

  const closestEstimate = Math.min(...recommendations.map(item => item.estimate));
  const overBudgetRatio = recommendations.length > 0 ? (closestEstimate - budget) / budget : 1;
  const overBudgetPercent = Math.max(1, Math.round(overBudgetRatio * 100));
  const adjustments = [
    criteria.furnishedPriority === "uncertain" ? "先確認家具家電是否為必要條件（目前未把不確定偏好當成硬性加價）" : null,
    criteria.furnishedPriority === "required" ? "比較空屋加家具租借／二手購入，避免只搜尋供給較少的附家具物件" : null,
    criteria.buildingAgeMax && criteria.buildingAgeMax <= 5 && criteria.buildingAgePriority === "preferred" ? "把屋齡約 5 年改為希望條件，並比較屋齡較高但翻新良好的物件" : null,
    criteria.areaMin ? "適度放寬最低面積" : null,
    criteria.walkMinutes ? "比較較遠的車站步行距離" : null,
    criteria.commuteDirectRequired ? "保留直達需求時，擴大同線較外圍車站" : null
  ].filter(Boolean);
  const adjustmentText = adjustments.length ? ` 建議優先${adjustments.slice(0, 3).join("；")}。` : " 建議重新確認必要條件與可取捨項目。";

  if (overBudgetRatio <= 0.1) {
    return `最接近的搜尋方向推估中心值仍約高出預算 ${overBudgetPercent}%，屬於接近上限但需要取捨。${adjustmentText}${feeNotice}`;
  }
  if (overBudgetRatio <= 0.25) {
    return `目前最接近的搜尋方向推估中心值約高出預算 ${overBudgetPercent}%，預算與已量化條件有明顯落差。${adjustmentText}${feeNotice}`;
  }
  return `目前最接近的搜尋方向推估中心值約高出預算 ${overBudgetPercent}%，若維持現有預算，通常需要同時調整兩項以上的高影響條件。${adjustmentText}${feeNotice}`;
}

const normalize = (value?: string | null) => (value || "")
  .toLowerCase()
  .replace(/涉谷|渋谷/g, "澀谷")
  .replace(/蔵/g, "藏")
  .replace(/恵/g, "惠")
  .replace(/黒/g, "黑")
  .replace(/[\s・･（）()\-]/g, "")
  .replace(/jr|東京地下鐵|都營|東急|京王|小田急/g, "");

export function enrichRentCriteriaFromPrompt(criteria: RentSearchCriteria, prompt: string): RentSearchCriteria {
  const enriched = { ...criteria };
  if (enriched.commuteStation && /涉谷|澀谷|渋谷/.test(enriched.commuteStation)) enriched.commuteStation = enriched.commuteStation.replace(/涉谷|澀谷|渋谷/g, "渋谷");
  if (enriched.commuteStations?.length) enriched.commuteStations = enriched.commuteStations.map(station => station.replace(/涉谷|澀谷|渋谷/g, "渋谷"));
  const budgetRange = prompt.match(/(\d+(?:\.\d+)?)\s*[萬万]\s*(?:[~～〜－—-]|至|到)\s*(\d+(?:\.\d+)?)\s*[萬万]/i);
  if (budgetRange) {
    enriched.minBudget = Math.round(Number(budgetRange[1]) * 10000);
    enriched.maxBudget = Math.round(Number(budgetRange[2]) * 10000);
  }
  const visaLine = prompt.match(/(?:簽證種類|签证种类|在留資格|在留资格)\s*[:：]\s*([^\n，,；;]+)/i);
  const technicalVisa = /技人[國国]|技術[・·／/]?人文知識[・·／/]?(?:國際|国际|国際)業務/i.test(prompt);

  if (!enriched.visaType) {
    if (technicalVisa) enriched.visaType = "技術・人文知識・國際業務簽證（技人國）";
    else if (visaLine?.[1]?.trim()) enriched.visaType = visaLine[1].trim();
  }
  if (!enriched.visaYears) {
    const nearbyYears = prompt.match(/(?:簽證|签证|在留(?:期間|期限)?)[^\n]{0,12}?(\d+(?:\.\d+)?)\s*年/i)
      || prompt.match(/(?:技人[國国]|技術[・·／/]?人文知識[・·／/]?(?:國際|国际|国際)業務)[^\n]{0,12}?(\d+(?:\.\d+)?)\s*年/i);
    if (nearbyYears?.[1]) enriched.visaYears = Number(nearbyYears[1]);
  }
  const catRequested = /可養\s*(?:一隻|1隻)?\s*[貓猫]|(?:養|饲养|飼養)\s*[貓猫]|[貓猫]\s*(?:可|ok)|ペット可[^\n]{0,12}(?:猫|ネコ)/i.test(prompt);
  const petRequested = /可養\s*寵物|寵物可|宠物可|ペット可/i.test(prompt);
  if (catRequested) {
    enriched.petsAllowed = true;
    enriched.petType = "貓";
  } else if (petRequested) {
    enriched.petsAllowed = true;
    if (!enriched.petType) enriched.petType = "寵物";
  }
  const commuteLine = prompt.split(/\n/).find(line => /通勤|車程|上班|工作地點|目的地|希望.*(?:分鐘|分內)/i.test(line));
  if (commuteLine) {
    const normalizedLine = normalize(commuteLine);
    const inferredDestinations = [...new Map(
      Object.values(districtStations).flat()
        .filter(station => normalize(station.name).length >= 2 && normalizedLine.includes(normalize(station.name)))
        .map(station => [normalize(station.name), station.name] as const)
    ).values()];
    const displayDestinations = inferredDestinations.map(station => station.replace(/澀谷/g, "渋谷"));
    if (!(enriched.commuteStations || []).length && displayDestinations.length) enriched.commuteStations = displayDestinations;
    if (!enriched.commuteStation && displayDestinations.length) enriched.commuteStation = displayDestinations.join("／");
    if (!enriched.locationPreference) enriched.locationPreference = commuteLine.replace(/^\s*\d+[.、．]?\s*/, "").trim();
  }
  if (!enriched.commuteMinutes && commuteLine) {
    const commuteMinutes = commuteLine.match(/(\d{1,3})\s*分鐘/i);
    if (commuteMinutes?.[1]) enriched.commuteMinutes = Number(commuteMinutes[1]);
  }
  enriched.commuteDirectRequired = /(?:一條線|一条线|不用換乘|不用换乘|不換乘|不换乘|直達|直达)/i.test(prompt);

  if (enriched.furnished || /家具|家電|家电/i.test(prompt)) {
    enriched.furnished = true;
    enriched.furnishedPriority = /(?:可能|也許|也许|不確定|不确定|\?？)/i.test(prompt.match(/[^\n]*(?:家具|家電|家电)[^\n]*/i)?.[0] || "")
      ? "uncertain"
      : /(?:希望|最好|優先|优先)/i.test(prompt.match(/[^\n]*(?:家具|家電|家电)[^\n]*/i)?.[0] || "")
        ? "preferred"
        : "required";
  }

  if (enriched.buildingAgeMax) {
    const ageLine = prompt.split(/\n/).find(line => /屋齡|屋龄|築年|房齡|房龄/i.test(line)) || "";
    enriched.buildingAgePriority = /(?:大約|大概|左右|希望|最好)/i.test(ageLine) ? "preferred" : "required";
  }

  const verificationRules: Array<[RegExp, string]> = [
    [/(?:治安|安全)/i, "治安與夜間環境"],
    [/(?:暗巷|偏僻)/i, "避免偏僻地點與暗巷"],
    [/(?:房間|室內)[^\n]{0,12}(?:對外窗|对外窗|窗戶|窗户)/i, "房間對外窗"],
    [/(?:採光|采光|明亮|光線充足|光线充足)/i, "室內採光"],
    [/(?:廁所|厕所|浴室)[^\n]{0,12}(?:對外窗|对外窗|窗戶|窗户)/i, "廁所對外窗"],
    [/(?:樑壓床|梁压床|橫樑|横梁)/i, "避免樑壓床"],
    [/(?:凶宅|事故屋|出事宅|心理瑕疵)/i, "排除事故屋／心理瑕疵物件"],
    [/(?:煮熱食|煮食|廚房|厨房)/i, "可煮食的廚房配置"]
  ];
  enriched.unverifiedConditions = verificationRules.filter(([pattern]) => pattern.test(prompt)).map(([, label]) => label);
  return enriched;
}

function districtScale(district: string) {
  const rate = rentRates.find(item => item.district === district) || rentRates[0];
  const baseScale = parseFloat(rate.k1) / 10;
  const isTama = TAMA_CITIES.includes(rate.district);
  if (rate.region === "東京都" && !isTama) return Math.max(0.75, Math.min(1.4, baseScale));
  if (rate.region === "東京都") return Math.max(0.4, Math.min(0.8, baseScale * 0.7));
  if (rate.region === "神奈川") return Math.max(0.45, Math.min(0.85, baseScale * 0.75));
  return Math.max(0.3, Math.min(0.7, baseScale * 0.5));
}

const adjustedModifier = (district: string, price: number) =>
  Math.round((price * districtScale(district)) / 1000) * 1000;

export function getRentModifierIndexes(criteria: RentSearchCriteria) {
  const indexes = new Set<number>();
  if (criteria.washbasin && criteria.bidet) indexes.add(0);
  else if (criteria.washbasin) indexes.add(1);
  else if (criteria.bidet) indexes.add(2);
  if (criteria.areaMin) {
    if (["r1", "k1"].includes(criteria.roomType)) indexes.add(criteria.areaMin >= 30 ? 4 : criteria.areaMin >= 25 ? 3 : -1);
    if (criteria.roomType === "ldk1") indexes.add(criteria.areaMin >= 40 ? 6 : criteria.areaMin >= 35 ? 5 : -1);
    if (criteria.roomType === "ldk2") indexes.add(criteria.areaMin >= 60 ? 8 : criteria.areaMin >= 50 ? 7 : -1);
  }
  if (criteria.elevator || criteria.autoLock) indexes.add(9);
  if (criteria.buildingAgeMax && criteria.buildingAgeMax <= 5) indexes.add(10);
  else if (criteria.buildingAgeMax && criteria.buildingAgeMax <= 10) indexes.add(11);
  if (criteria.walkMinutes && criteria.walkMinutes <= 5) indexes.add(14);
  else if (criteria.walkMinutes && criteria.walkMinutes >= 15) indexes.add(17);
  else if (criteria.walkMinutes && criteria.walkMinutes >= 11) indexes.add(16);
  if (criteria.furnished && criteria.furnishedPriority !== "uncertain") indexes.add(15);
  if (criteria.tower) indexes.add(25);
  if (criteria.lpGasAccepted) indexes.add(26);
  indexes.delete(-1);
  return [...indexes];
}

const lineMatches = (left: string, right: string) => {
  const normalizeLine = (value: string) => value.toLowerCase()
    .replace(/[\s・･（）()\-]/g, "")
    .replace(/各停|急行|快速|特急/g, "");
  const a = normalizeLine(left);
  const b = normalizeLine(right);
  return Boolean(a.length >= 3 && b.length >= 3 && (a.includes(b) || b.includes(a)));
};

export function buildRentRecommendations(criteria: RentSearchCriteria): RentRecommendation[] {
  const mods = getRentModifierIndexes(criteria);
  const districtQueries = [...(criteria.districts || []), criteria.district].filter(Boolean).map(value => normalize(value));
  const wantedStations = [...(criteria.stations || []), criteria.station].filter(Boolean).map(value => normalize(value));
  const wantedLine = criteria.line || "";
  const commuteTargets = [...(criteria.commuteStations || []), ...(criteria.commuteStation?.split(/[、,，/／或|・]/) || [])]
    .map(value => normalize(value)).filter(Boolean);
  const commuteStations = commuteTargets.length
    ? Object.values(districtStations).flat().filter(station => commuteTargets.some(wanted =>
      normalize(station.name).includes(wanted) || wanted.includes(normalize(station.name))
    ))
    : [];

  const candidates = rentRates.flatMap(rate => {
    const stations = districtStations[rate.district] || [];
    return (stations.length ? stations : [null]).map(station => ({ rate, station }));
  });

  const ranked = candidates.map(({ rate, station }) => {
    let estimate = parseFloat(rate[criteria.roomType]) * 10000;
    for (const index of mods) {
      const mod = budgetModifiers[index];
      if (mod) estimate += adjustedModifier(rate.district, index === 25 ? 15000 : mod.price);
    }
    if (station) {
      estimate += adjustedModifier(rate.district, station.type === "major" ? 10000 : station.type === "regular" ? 5000 : -5000);
    }
    estimate = Math.max(20000, Math.round(estimate / 1000) * 1000);
    const gap = criteria.maxBudget ? estimate - criteria.maxBudget : null;
    const stationName = normalize(station?.name);
    const exactStation = Boolean(station && wantedStations.some(wanted => stationName === wanted));
    const districtMatch = districtQueries.some(query => normalize(rate.district).includes(query) || query.includes(normalize(rate.district)) || normalize(rate.region).includes(query));
    const requestedLineMatch = Boolean(station && wantedLine && station.lines.some(line => lineMatches(line, wantedLine)));
    const directCommute = Boolean(station && commuteStations.some(destination =>
      station.lines.some(line => destination.lines.some(destinationLine => lineMatches(line, destinationLine)))
    ));
    const budgetScore = criteria.maxBudget
      ? Math.max(0, 30 - Math.abs(estimate - criteria.maxBudget) / 10000 * 3)
      : Math.max(0, 20 - estimate / 20000);
    const score = (exactStation ? 120 : 0) + (districtMatch ? 60 : 0) + (requestedLineMatch ? 50 : 0) + (directCommute ? 35 : 0) + budgetScore;
    const recommendationType: RentRecommendation["recommendationType"] = exactStation
      ? "指定車站"
      : districtMatch || requestedLineMatch
        ? "指定範圍"
        : directCommute
          ? "通勤優先"
          : "預算替代";
    const reasons = [
      exactStation ? "使用者明確指定的車站" : null,
      districtMatch ? "位於指定行政區範圍" : null,
      requestedLineMatch ? `符合指定的 ${criteria.line}` : null,
      directCommute ? `與 ${criteria.commuteStation} 有共同線路` : criteria.commuteStation ? `前往 ${criteria.commuteStation} 的轉乘需另行確認` : null,
      gap !== null ? (gap <= 0 ? "估算中心值在預算內" : gap <= Math.max(10000, criteria.maxBudget! * .1) ? "估算接近預算上限" : "需要調整條件或預算") : "依條件估算市場租金"
    ].filter(Boolean) as string[];
    const fit: RentRecommendation["fit"] = gap === null || gap <= 0 ? "預算內" : gap <= Math.max(10000, criteria.maxBudget! * 0.1) ? "接近預算" : "需調整";
    const commuteFit: RentRecommendation["commuteFit"] = !criteria.commuteStation ? "未指定通勤地" : directCommute ? "直達線路" : "需確認轉乘";
    const commuteTimeFit: RentRecommendation["commuteTimeFit"] = criteria.commuteMinutes ? "時間未驗證" : "未指定時間";
    const cautions = [
      criteria.commuteMinutes ? `${criteria.commuteMinutes} 分鐘上限尚未以實際班次驗證` : null,
      criteria.furnished ? "附家具家電房源供給較少" : null,
      criteria.buildingAgeMax && criteria.buildingAgeMax <= 5 ? "屋齡 5 年內會明顯縮小範圍" : null,
      ...(criteria.unverifiedConditions || []).map(condition => `${condition}需逐屋確認`)
    ].filter(Boolean) as string[];
    return {
      district: rate.district,
      region: rate.region,
      station: station?.name || null,
      lines: station?.lines || [],
      estimate,
      rangeLow: Math.round((estimate * 0.9) / 1000) * 1000,
      rangeHigh: Math.round((estimate * 1.1) / 1000) * 1000,
      budgetGap: gap,
      fit,
      recommendationType,
      reasons,
      commuteFit,
      commuteTimeFit,
      cautions,
      score
    };
  });
  const directCandidates = criteria.commuteDirectRequired && criteria.commuteStation
    ? ranked.filter(item => item.commuteFit === "直達線路")
    : ranked;
  const pool = directCandidates.length ? directCandidates : ranked;
  return pool.sort((a, b) => b.score - a.score || a.estimate - b.estimate)
    .filter((item, index, all) => all.findIndex(candidate => candidate.station === item.station) === index)
    .slice(0, 6)
    .map(({ score: _score, ...item }) => item);
}

export type CriteriaSummaryCategory = "layout" | "equipment" | "transport" | "special" | "budget";

export interface CriteriaSummaryItem {
  label: string;
  category: CriteriaSummaryCategory;
}

export function criteriaSummary(criteria: RentSearchCriteria): CriteriaSummaryItem[] {
  const labels: CriteriaSummaryItem[] = [{ label: criteria.roomType.toUpperCase(), category: "layout" }];
  if (criteria.areaMin) labels.push({ label: `${criteria.areaMin}㎡以上`, category: "layout" });
  if (criteria.washbasin) labels.push({ label: "獨立洗面台", category: "equipment" });
  if (criteria.bidet) labels.push({ label: "免治馬桶", category: "equipment" });
  if (criteria.elevator) labels.push({ label: "電梯", category: "equipment" });
  if (criteria.furnished) labels.push({ label: "家具家電", category: "equipment" });
  if (criteria.walkMinutes) labels.push({ label: `步行${criteria.walkMinutes}分內`, category: "transport" });
  if (criteria.line) labels.push({ label: criteria.line, category: "transport" });
  if (criteria.station) labels.push({ label: `${criteria.station}站`, category: "transport" });
  if (criteria.stations?.length) labels.push({ label: criteria.stations.map(station => `${station}站`).join("・"), category: "transport" });
  if (criteria.commuteStation) labels.push({ label: `通勤至${criteria.commuteStation}`, category: "transport" });
  if (criteria.freeInternet) labels.push({ label: "免費網路", category: "equipment" });
  if (criteria.lpGasAccepted) labels.push({ label: "可接受LP瓦斯", category: "equipment" });
  if (criteria.cityGasRequired) labels.push({ label: "都市瓦斯指定", category: "equipment" });
  if (criteria.petsAllowed) labels.push({ label: criteria.petType ? `可養${criteria.petType}` : "可養寵物", category: "special" });
  if (criteria.maxBudget) labels.push({ label: `上限 ${(criteria.maxBudget / 10000).toFixed(1)}萬円`, category: "budget" });
  return labels;
}
