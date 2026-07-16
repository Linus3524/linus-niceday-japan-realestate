import { budgetModifiers } from "../data/rentGuideData";
import type { StationInfo } from "../data/stationData";
import { rentRates, districtStations } from "../data/housingMarket";
import { TAMA_CITIES } from "./calcRules";

export type RoomType = "r1" | "k1" | "ldk1" | "ldk2";

export interface RentSearchCriteria {
  roomType: RoomType;
  areaMin?: number | null;
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
}

export function buildMarketReality(criteria: RentSearchCriteria, recommendations: RentRecommendation[]) {
  const budget = criteria.maxBudget;
  if (!budget || budget <= 0) {
    return "尚未指定月租上限；以下先依條件列出市場區間，另請預留管理費、共益費與初期費用。";
  }

  const withinBudget = recommendations.filter(item => item.estimate <= budget).length;
  if (withinBudget > 0) {
    return `目前有 ${withinBudget} 個推薦方向的估算中心值落在預算內。整體條件具備可行性，但仍請預留管理費、旺季競爭與個別物件行情差異。`;
  }

  const closestEstimate = Math.min(...recommendations.map(item => item.estimate));
  const overBudgetRatio = recommendations.length > 0 ? (closestEstimate - budget) / budget : 1;
  const overBudgetPercent = Math.max(1, Math.round(overBudgetRatio * 100));

  if (overBudgetRatio <= 0.1) {
    return `目前最接近預算的推薦方向仍約高出 ${overBudgetPercent}%，屬於小幅落差。建議優先提高一些租金預算並適度精簡非必要設備；若預算固定，則需同步放寬車站範圍、步行距離與屋齡。`;
  }
  if (overBudgetRatio <= 0.25) {
    return `目前最接近預算的推薦方向約高出 ${overBudgetPercent}%，條件與預算已有明顯落差。需要提高租金預算並精簡設備需求，同時擴大地區與車站範圍、接受較遠步行距離及較高屋齡；只放寬單一條件通常不足。`;
  }
  return `目前最接近預算的推薦方向約高出 ${overBudgetPercent}%，需求已嚴重偏離目前市場行情。建議重新設定租金上限，或大幅調整設備、格局與面積需求；若必須維持原預算，則需全面擴大地區與車站範圍，並明顯放寬步行距離及屋齡。`;
}

const normalize = (value?: string | null) => (value || "")
  .toLowerCase()
  .replace(/蔵/g, "藏")
  .replace(/恵/g, "惠")
  .replace(/黒/g, "黑")
  .replace(/[\s・･（）()\-]/g, "")
  .replace(/jr|東京地下鐵|都營|東急|京王|小田急/g, "");

export function enrichRentCriteriaFromPrompt(criteria: RentSearchCriteria, prompt: string): RentSearchCriteria {
  const enriched = { ...criteria };
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
    if (!(enriched.commuteStations || []).length && inferredDestinations.length) enriched.commuteStations = inferredDestinations;
    if (!enriched.commuteStation && inferredDestinations.length) enriched.commuteStation = inferredDestinations.join("／");
    if (!enriched.locationPreference) enriched.locationPreference = commuteLine.replace(/^\s*\d+[.、．]?\s*/, "").trim();
  }
  if (!enriched.commuteMinutes && commuteLine) {
    const commuteMinutes = commuteLine.match(/(\d{1,3})\s*分鐘/i);
    if (commuteMinutes?.[1]) enriched.commuteMinutes = Number(commuteMinutes[1]);
  }
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
  if (criteria.furnished) indexes.add(15);
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

  return candidates.map(({ rate, station }) => {
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
      directCommute ? `與 ${criteria.commuteStation} 有共同直達線路` : criteria.commuteStation ? `前往 ${criteria.commuteStation} 的轉乘需另行確認` : null,
      gap !== null ? (gap <= 0 ? "估算中心值在預算內" : gap <= Math.max(10000, criteria.maxBudget! * .1) ? "估算接近預算上限" : "需要調整條件或預算") : "依條件估算市場租金"
    ].filter(Boolean) as string[];
    const fit: RentRecommendation["fit"] = gap === null || gap <= 0 ? "預算內" : gap <= Math.max(10000, criteria.maxBudget! * 0.1) ? "接近預算" : "需調整";
    const commuteFit: RentRecommendation["commuteFit"] = !criteria.commuteStation ? "未指定通勤地" : directCommute ? "直達線路" : "需確認轉乘";
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
      score
    };
  }).sort((a, b) => b.score - a.score || a.estimate - b.estimate)
    .filter((item, index, all) => all.findIndex(candidate => candidate.station === item.station && candidate.district === item.district) === index)
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
