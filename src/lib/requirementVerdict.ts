import { rentRates, districtStations } from "../data/housingMarket.js";
import {
  computeStackedEstimate,
  getRentModifierIndexes,
  resolveVisaCategory,
  ROOM_TYPE_LABEL,
  type RentRecommendation,
  type RentSearchCriteria,
  type VisaCategory
} from "./rentAnalysis.js";

/**
 * 需求可行性判斷。
 *
 * 這裡刻意「不看推薦車站的預算落點」來決定可行性——推薦清單本身就以貼近預算排序，
 * 拿它回頭證明預算合理是循環論證。改為針對使用者自己指定的範圍重新估價。
 */

export type AxisStatus = "符合" | "部分符合" | "需調整" | "待確認" | "難度高";

export interface AxisVerdict {
  key: string;
  label: string;
  /** 使用者這次實際輸入的條件；沒輸入就是 null，整列不顯示。 */
  detail: string | null;
  status: AxisStatus;
  /** 一句結論，先講答案。 */
  headline: string;
  /** 造成這個結論的主因，最多兩條。 */
  drivers: string[];
  /** 具體下一步；沒有明確動作時留空。 */
  nextStep?: string;
  /** 對房源數量的壓縮程度 0～3，用於疊加判斷整體可行性。 */
  supplyImpact: number;
}

export type OverallLevel = "可行" | "需調整" | "難度高" | "資料不足";

export interface OverallVerdict {
  level: OverallLevel;
  headline: string;
  reasons: string[];
  loosenFirst?: string;
}

const yen = (value: number) => `¥${(Math.round(value / 1000) * 1000).toLocaleString("en-US")}`;
const man = (value: number) => `${(value / 10000).toFixed(1).replace(/\.0$/, "")} 萬円`;

const normalize = (value?: string | null) => (value || "")
  .toLowerCase()
  .replace(/涉谷|渋谷/g, "澀谷")
  .replace(/[\s・･（）()\-]/g, "");

/** 路線名比對用：去掉營運商前綴與車種後綴，「西武池袋線」與「池袋線」才對得上。 */
const normalizeLine = (value?: string | null) => (value || "")
  .toLowerCase()
  .replace(/[\s・･（）()\-]/g, "")
  .replace(/各停|急行|快速|特急|準急|通勤/g, "");

/** 針對「使用者指定的範圍」重新估價，完全不參考推薦清單。 */
export interface RequestedRentRange {
  low: number;
  median: number;
  high: number;
  sampleCount: number;
  /** 估價基準的說法，用於文案。 */
  basis: string;
}

/**
 * 使用者實際指定的搜尋範圍（行政區集合＋人看得懂的說法）。
 *
 * 左側可行性評估與右側推薦車站必須用同一組地理範圍，否則會出現
 * 「左邊說要 11 萬、右邊給 7 萬車站」這種互相矛盾的結果。
 * 之後要新增地點類條件（例如指定區域帶、學區）只要改這裡，兩側一起生效。
 */
export function resolveSearchScope(criteria: RentSearchCriteria): { districts: Set<string>; label: string } {
  const districts = new Set<string>();
  const sources: string[] = [];

  const districtQueries = [...(criteria.districts || []), criteria.district].filter(Boolean).map(v => normalize(v));
  if (districtQueries.length) {
    for (const rate of rentRates) {
      if (districtQueries.some(q => normalize(rate.district).includes(q) || q.includes(normalize(rate.district)))) {
        districts.add(normalize(rate.district));
      }
    }
    if (districts.size) sources.push("指定行政區");
  }

  // 車站：只取該站會讓樣本剩 1 筆、區間退化成單一數字，因此連同所屬行政區一起納入。
  const stationQueries = [...(criteria.stations || []), criteria.station].filter(Boolean).map(v => normalize(v));
  if (stationQueries.length) {
    let hit = false;
    for (const [district, stations] of Object.entries(districtStations)) {
      if (stations.some(station => stationQueries.some(q => normalize(station.name) === q))) {
        districts.add(normalize(district));
        hit = true;
      }
    }
    if (hit) sources.push("指定車站所在行政區");
  }

  // 路線：一條線橫跨的行政區行情差距很大（西武池袋線從豐島區到所澤市），
  // 少了這段就會只用線上最貴的那一站當基準。
  const lineQuery = normalizeLine(criteria.line);
  if (lineQuery.length >= 3) {
    let hit = false;
    for (const [district, stations] of Object.entries(districtStations)) {
      if (stations.some(station => station.lines.some(line => {
        const candidate = normalizeLine(line);
        return candidate.includes(lineQuery) || lineQuery.includes(candidate);
      }))) {
        districts.add(normalize(district));
        hit = true;
      }
    }
    if (hit) sources.push(`${criteria.line}沿線`);
  }

  // 只給通勤目的地時，可住範圍就是「與該站有共同線路的行政區」——
  // 這正是推薦清單挑候選的規則，用同一條規則兩側才會一致。
  // 刻意不看預算，避免用預算挑出範圍再回頭證明預算可行的循環論證。
  if (!districts.size && criteria.commuteStation) {
    const targets = [...(criteria.commuteStations || []), ...(criteria.commuteStation.split(/[、,，/／或|・]/))]
      .map(v => normalize(v)).filter(Boolean);
    const targetLines = new Set<string>();
    for (const stations of Object.values(districtStations)) {
      for (const station of stations) {
        if (targets.some(t => normalize(station.name).includes(t) || t.includes(normalize(station.name)))) {
          station.lines.forEach(line => targetLines.add(normalizeLine(line)));
        }
      }
    }
    if (targetLines.size) {
      let hit = false;
      for (const [district, stations] of Object.entries(districtStations)) {
        if (stations.some(station => station.lines.some(line => targetLines.has(normalizeLine(line))))) {
          districts.add(normalize(district));
          hit = true;
        }
      }
      if (hit) sources.push(`可通往 ${criteria.commuteStation} 的沿線`);
    }
  }

  return {
    districts,
    label: sources.length ? sources.join("＋") : "東京都與近郊整體行情"
  };
}

export function estimateRequestedRent(criteria: RentSearchCriteria): RequestedRentRange | null {
  const mods = getRentModifierIndexes(criteria);
  const scope = resolveSearchScope(criteria);
  const hasScope = scope.districts.size > 0;

  const pool: number[] = [];
  for (const rate of rentRates) {
    if (hasScope && !scope.districts.has(normalize(rate.district))) continue;
    const stations = districtStations[rate.district] || [];
    for (const station of stations.length ? stations : [null]) {
      pool.push(computeStackedEstimate(rate, station, mods, criteria.roomType));
    }
  }
  const basis = scope.label;

  if (!pool.length) return null;
  const sorted = pool.sort((a, b) => a - b);
  const at = (ratio: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))];
  return { low: at(0.15), median: at(0.5), high: at(0.85), sampleCount: sorted.length, basis };
}

/* ── 各軸判斷 ───────────────────────────────────────────── */

function budgetAxis(criteria: RentSearchCriteria, range: RequestedRentRange | null): AxisVerdict {
  const budget = criteria.maxBudget;
  const feeState = criteria.budgetIncludesFees;
  const detail = budget
    ? `${criteria.minBudget ? `${man(criteria.minBudget)}～` : "上限 "}${man(budget)}${feeState === true ? "（含管理費）" : feeState === false ? "（不含管理費）" : ""}`
    : null;

  if (!budget) {
    return {
      key: "budget", label: "預算", detail: null, status: "待確認",
      headline: "還沒有月租上限，無法判斷這組條件找不找得到。",
      drivers: [], nextStep: "補上每月可負擔的租金上限。", supplyImpact: 0
    };
  }
  if (!range) {
    return {
      key: "budget", label: "預算", detail, status: "待確認",
      headline: "指定範圍內沒有可用的行情資料。",
      drivers: [], nextStep: "放寬地區或改指定車站。", supplyImpact: 0
    };
  }

  const drivers = [`${range.basis}套用你的條件後，行情約 ${yen(range.low)}～${yen(range.high)}，中位約 ${yen(range.median)}`];
  if (feeState === false) drivers.push("管理費另計，實付會再高一些");
  const feeStep = feeState === null || feeState === undefined ? "順帶確認預算含不含管理費，這會直接影響可選範圍。" : undefined;

  // 只建議放寬使用者真的設過的條件，不能叫人放寬他沒提過的東西。
  const loosenable = [
    criteria.areaMin ? "面積" : null,
    criteria.buildingAgeMax ? "屋齡" : null,
    criteria.walkMinutes ? "徒步距離" : null
  ].filter(Boolean) as string[];

  if (range.median <= budget) {
    return {
      key: "budget", label: "預算", detail, status: "符合",
      headline: `預算落在行情中位以上，這個價位在指定範圍內找得到。`,
      drivers, nextStep: feeStep, supplyImpact: 0
    };
  }
  if (range.low <= budget) {
    const span = Math.max(1, range.high - range.low);
    const share = Math.round(((budget - range.low) / span) * 100);
    return {
      key: "budget", label: "預算", detail, status: "部分符合",
      headline: `預算落在行情偏低端，約 ${Math.min(95, Math.max(10, share))}% 的物件在範圍內。`,
      drivers,
      nextStep: loosenable.length
        ? `鎖定行情較低的車站，或放寬${loosenable.join("、")}。`
        : "往行情較低的車站找，可選數量會明顯增加。",
      supplyImpact: 1
    };
  }
  const gapRatio = (range.low - budget) / budget;
  const gapPercent = Math.max(1, Math.round(gapRatio * 100));
  return {
    key: "budget", label: "預算", detail,
    status: gapRatio <= 0.15 ? "需調整" : "難度高",
    headline: `預算比指定範圍的行情低端還少約 ${gapPercent}%。`,
    drivers,
    nextStep: gapRatio <= 0.15
      ? `月租上限提高到約 ${man(range.low)}，或改找行情較低的區域。`
      : `維持這個預算就要換區域；指定範圍的最低行情約 ${man(range.low)}。`,
    supplyImpact: gapRatio <= 0.15 ? 2 : 3
  };
}

function commuteAxis(criteria: RentSearchCriteria, recommendations: RentRecommendation[]): AxisVerdict {
  const target = criteria.commuteStation;
  const detail = [
    target ? `通勤至 ${target}` : null,
    criteria.commutePreferredMinutes ? `希望 ${criteria.commutePreferredMinutes} 分鐘內` : null,
    criteria.commuteMinutes ? `最長 ${criteria.commuteMinutes} 分鐘` : null,
    criteria.commuteDirectRequired ? "不換乘" : null,
    criteria.walkMinutes ? `車站徒步 ${criteria.walkMinutes} 分內` : null
  ].filter(Boolean).join("・") || null;

  if (!target) {
    return {
      key: "commute", label: "通勤", detail, status: "待確認",
      headline: "還沒有通勤目的地，無法排出可行的地點。",
      drivers: [], nextStep: "補上主要通勤地點（公司或學校車站）。", supplyImpact: 0
    };
  }

  const routed = recommendations.filter(item => item.commuteRoute);
  const limit = criteria.commuteMinutes;

  if (!routed.length) {
    // 使用者已經給了通勤地，只是路線服務沒回時間。這是系統端的缺口，
    // 不能因此把整份評估降級成「資料不足」而蓋掉其他真正的結論。
    const direct = recommendations.filter(item => item.commuteFit === "直達線路").length;
    return {
      key: "commute", label: "通勤", detail, status: "部分符合",
      headline: `${direct} 個方向與 ${target} 有共同線路，實際車程時間待取得。`,
      drivers: [], supplyImpact: criteria.commuteDirectRequired ? 1 : 0
    };
  }

  const times = routed.map(item => item.commuteRoute!.totalDurationMinutes);
  const shortest = Math.min(...times);
  const longest = Math.max(...times);
  const directCount = routed.filter(item => item.commuteRoute!.transfers === 0).length;
  const passing = limit ? routed.filter(item => item.commuteRoute!.totalDurationMinutes <= limit) : routed;
  const failing = routed.filter(item => !passing.includes(item));

  const drivers = [`最短 ${shortest} 分、最長 ${longest} 分，${directCount} 個直達`];
  if (failing.length) {
    drivers.push(`${failing.map(item => item.station || item.district).slice(0, 3).join("、")} 超過設定時間`);
  }

  if (!limit) {
    return {
      key: "commute", label: "通勤", detail, status: "符合",
      headline: `${routed.length} 個方向已算出實際車程，${directCount} 個直達。`,
      drivers, supplyImpact: 0
    };
  }
  if (passing.length === routed.length) {
    return {
      key: "commute", label: "通勤", detail, status: "符合",
      headline: `${routed.length} 個方向都在 ${limit} 分鐘內。`,
      drivers, supplyImpact: 0
    };
  }
  if (passing.length > 0) {
    const directFail = criteria.commuteDirectRequired && directCount === 0;
    return {
      key: "commute", label: "通勤", detail,
      status: directFail ? "需調整" : "部分符合",
      headline: `${passing.length} 個方向符合 ${limit} 分鐘，${failing.length} 個不符合。`,
      drivers,
      nextStep: directFail ? "目前沒有直達方向；放寬「不換乘」會多出可選車站。" : undefined,
      supplyImpact: directFail ? 2 : 1
    };
  }
  return {
    key: "commute", label: "通勤", detail, status: "難度高",
    headline: `沒有方向能在 ${limit} 分鐘內到 ${target}，最短是 ${shortest} 分。`,
    drivers,
    nextStep: `通勤上限放寬到約 ${shortest + 5} 分鐘，可選範圍會明顯增加。`,
    supplyImpact: 3
  };
}

function layoutAxis(criteria: RentSearchCriteria): AxisVerdict {
  const roomLabel = ROOM_TYPE_LABEL[criteria.roomType];
  const detail = `${roomLabel}${criteria.areaMin ? `・${criteria.areaMin}㎡以上` : ""}`;
  // 原文列出多套方案時要講清楚只分析了哪一套，否則使用者會以為另一套也被評估過。
  const planNote = criteria.multiPlanNote?.trim();
  if (planNote) {
    return {
      key: "layout", label: "格局與面積", detail, status: "部分符合",
      headline: `原文有多套方案，目前以 ${roomLabel} 為分析基準。`,
      drivers: [planNote],
      nextStep: "想比較另一套方案，請分開送出各自的房型與預算。",
      supplyImpact: 1
    };
  }
  if (!criteria.areaMin) {
    return {
      key: "layout", label: "格局與面積", detail, status: "符合",
      headline: `以 ${roomLabel} 的常見面積估價，沒有額外限制。`,
      drivers: [], supplyImpact: 0
    };
  }
  const tight = { r1: 28, k1: 28, ldk1: 40, ldk2: 60 }[criteria.roomType];
  const roomy = { r1: 22, k1: 22, ldk1: 33, ldk2: 50 }[criteria.roomType];
  if (criteria.areaMin >= tight) {
    return {
      key: "layout", label: "格局與面積", detail, status: "需調整",
      headline: `${criteria.areaMin}㎡ 對 ${roomLabel} 偏大，會明顯減少房源。`,
      drivers: [`同預算下，面積每多 5㎡ 通常要往外一到兩站`],
      nextStep: `降到約 ${roomy}㎡ 可選範圍會大幅增加。`,
      supplyImpact: 2
    };
  }
  if (criteria.areaMin >= roomy) {
    return {
      key: "layout", label: "格局與面積", detail, status: "部分符合",
      headline: `${criteria.areaMin}㎡ 屬於 ${roomLabel} 的中上區間，供給還算充足。`,
      drivers: [], supplyImpact: 1
    };
  }
  return {
    key: "layout", label: "格局與面積", detail, status: "符合",
    headline: `${criteria.areaMin}㎡ 是 ${roomLabel} 的常見面積。`,
    drivers: [], supplyImpact: 0
  };
}

function buildingAxis(criteria: RentSearchCriteria): AxisVerdict | null {
  const parts = [
    criteria.structure,
    criteria.buildingAgeMax ? `屋齡 ${criteria.buildingAgeMax} 年內${criteria.buildingAgePriority === "preferred" ? "（希望）" : ""}` : null,
    criteria.floorMin ? `${criteria.floorMin} 樓以上` : null
  ].filter(Boolean);
  if (!parts.length) return null;

  const age = criteria.buildingAgeMax;
  // 用 != null 而非 truthy：屋齡 0 年（全新）是最嚴格的條件，不能被當成未指定。
  if (age != null && age <= 5) {
    const soft = criteria.buildingAgePriority === "preferred";
    return {
      key: "building", label: "建物條件", detail: parts.join("・"),
      status: soft ? "需調整" : "難度高",
      headline: `屋齡 ${age} 年內是這組條件中最限制房源的一項。`,
      drivers: ["築淺物件租金通常高出同區行情一到兩成"],
      nextStep: soft
        ? "已列為希望條件；放到 15 年內並看翻新狀況，可選數量會差很多。"
        : "改成 15 年內並比較翻新物件，是最有效的放寬方式。",
      supplyImpact: soft ? 2 : 3
    };
  }
  if (age != null && age <= 10) {
    return {
      key: "building", label: "建物條件", detail: parts.join("・"), status: "部分符合",
      headline: `屋齡 ${age} 年內會篩掉部分房源，但仍有選擇。`,
      drivers: [], supplyImpact: 1
    };
  }
  return {
    key: "building", label: "建物條件", detail: parts.join("・"), status: "符合",
    headline: "建物條件不會明顯限制房源。",
    drivers: [], supplyImpact: 0
  };
}

function equipmentAxis(criteria: RentSearchCriteria): AxisVerdict | null {
  const equipment = [
    criteria.washbasin ? "獨立洗面台" : null,
    criteria.bidet ? "免治馬桶" : null,
    criteria.elevator ? "電梯" : null,
    criteria.autoLock ? "自動門" : null,
    criteria.balcony ? "陽台" : null,
    criteria.gasBurnersMin ? `瓦斯爐 ${criteria.gasBurnersMin} 口以上` : null,
    criteria.freeInternet ? "免費網路" : null,
    criteria.cityGasRequired ? "都市瓦斯" : null
  ].filter(Boolean) as string[];

  const wantsFurnished = criteria.furnished === true;
  if (!equipment.length && !wantsFurnished) return null;

  if (wantsFurnished) {
    const priority = criteria.furnishedPriority;
    const uncertain = priority === "uncertain";
    // 使用者說「沒有也沒關係」時，這是加分項而非門檻：不該壓低整體可行性，
    // 也不該叫他去比較家具租借的成本——他已經表明可以接受空屋。
    const optional = priority === "preferred";
    const priorityLabel = uncertain ? "尚未確定是否必要" : optional ? "有更好" : "必要";
    return {
      key: "equipment",
      label: "設備與家具家電",
      detail: [...equipment, `家具家電（${priorityLabel}）`].join("・"),
      status: uncertain ? "待確認" : optional ? "符合" : "需調整",
      headline: optional
        ? "附家具家電的房源較少，但你已表明沒有也可以，不會因此縮小搜尋範圍。"
        : "日本長期租賃以空屋為主，附家具家電的房源相對少。",
      drivers: [
        optional
          ? "搜尋時把附家具家電的物件排在前面，空屋一併保留為選項"
          : "多集中在外國人向、短租或套裝管理物件，租金與初期費用通常較高",
        equipment.length ? `另有 ${equipment.join("、")} 需求` : ""
      ].filter(Boolean),
      nextStep: uncertain
        ? "先確認家具家電是必要還是加分；若只是希望，可選範圍會大很多。"
        : optional
          ? undefined
          : "可比較「空屋＋家具租借」或「空屋＋二手購入」的總成本。",
      supplyImpact: uncertain ? 1 : optional ? 0 : 2
    };
  }

  return {
    key: "equipment", label: "設備條件", detail: equipment.join("・"),
    status: equipment.length >= 4 ? "部分符合" : "符合",
    headline: equipment.length >= 4
      ? `${equipment.length} 項設備同時要求，會篩掉一部分房源。`
      : "這些設備在市場上算常見，不會明顯限制範圍。",
    drivers: [], supplyImpact: equipment.length >= 4 ? 1 : 0
  };
}

/**
 * 入住時間。日本物件多在入住前 1～2 個月才釋出募集，太早看只會看到不會留到那時的物件，
 * 太晚看則選擇已被挑過。這是模板文案給不出、但仲介一定會提醒的事。
 */
function timingAxis(criteria: RentSearchCriteria): AxisVerdict | null {
  const timing = criteria.moveInTiming?.trim();
  const size = criteria.householdSize;
  const residence = criteria.currentResidence?.trim();
  const employment = criteria.employmentStartTiming?.trim();
  if (!timing && !size && !residence && !employment) return null;

  const detail = [timing ? `預計 ${timing} 入住` : null, size ? (size === 1 ? "獨居" : `${size} 人同住`) : null, residence ? `現居 ${residence}` : null].filter(Boolean).join("・");
  if (!timing) {
    return {
      key: "timing", label: "入住條件", detail, status: "符合",
      headline: `${size} 人同住，格局與審查資料會以此為準。`,
      drivers: size && size >= 2 ? ["兩人以上需確認物件是否接受複數入居，並提供各自的續柄與收入資料"] : [],
      supplyImpact: 0
    };
  }
  return {
    key: "timing", label: "入住條件", detail, status: "符合",
    headline: `${timing} 入住，建議在入住前約一個半月開始集中找房。`,
    drivers: [
      "日本物件多在入住前 1～2 個月才釋出募集，太早看到的多半留不到入住日",
      residence ? "目前已在日本居住，可走境內審查並安排實際看房" : "",
      employment ? `${employment}，申請時準備雇用契約或內定資料` : "",
      size && size >= 2 ? `${size} 人同住需確認物件是否接受複數入居` : ""
    ].filter(Boolean),
    supplyImpact: 0
  };
}

function initialCostAxis(criteria: RentSearchCriteria): AxisVerdict | null {
  const cap = criteria.initialCostBudget;
  if (!cap) return null;
  const monthly = criteria.maxBudget || 0;
  const multiple = monthly ? cap / monthly : null;
  const tight = multiple !== null && multiple < 4.5;
  return {
    key: "initialCost", label: "初期費用", detail: `上限 ${yen(cap)}`,
    status: tight ? "需調整" : "部分符合",
    headline: tight
      ? `${yen(cap)} 約是月租上限的 ${multiple!.toFixed(1)} 倍，預算偏緊但仍有機會。`
      : "初期費用上限有機會達成，但要避開高禮金與高保證費物件。",
    drivers: ["優先找零禮金、低仲介費及保證費較低的物件"],
    nextStep: tight ? "把零禮金列為優先條件，申請前先取得完整初期費用明細。" : undefined,
    supplyImpact: tight ? 1 : 0
  };
}

function petAxis(criteria: RentSearchCriteria): AxisVerdict | null {
  if (criteria.petsAllowed !== true) return null;
  const petLabel = `可養${criteria.petType || "寵物"}`;
  return {
    key: "pet", label: "特殊條件", detail: petLabel, status: "難度高",
    headline: `${petLabel}會直接縮小可申請的房源範圍。`,
    drivers: [`${petLabel}物件供給較少，常增加敷金或退房清潔費`],
    nextStep: "從一開始就以可養寵物物件篩選，避免找到後才被管理規約排除。",
    supplyImpact: 3
  };
}

/**
 * 各條件在日本租屋市場的實際難度。
 * impact：0＝一般物件本來就滿足、1＝要靠圖面或現場篩選、2＝會明顯減少可選物件。
 * 沒有對應知識的條件不給樣板句——四行一樣的「待確認：逐項核對」等於沒講。
 */
const CONDITION_KNOWLEDGE: Array<{ pattern: RegExp; advice: string; impact: 0 | 1 | 2 }> = [
  {
    pattern: /獨立出入口|单独出入口|單獨出入口|房中房|必經通道|必经通道|各室獨立|完全獨立房間/,
    advice: "看間取り図確認每個房間是否各自對走廊開門。2K／2DK／2LDK 有不少是「続き間（二間続き）」，房間相連、要穿過其中一間才能進另一間，這類要直接排除。",
    impact: 2
  },
  {
    pattern: /私人衛浴|獨立衛浴|专用卫浴|專用衛浴|自己的衛浴/,
    advice: "一般賃貸物件本來就是專用衛浴，排除シェアハウス後這項不會再縮小範圍。",
    impact: 0
  },
  {
    pattern: /非合租|不合租|不考慮合租|sharehouse|シェアハウス|share\s*house|ルームシェア/i,
    advice: "搜尋時排除シェアハウス與ルームシェア類物件即可，一般賃貸都符合。",
    impact: 0
  },
  { pattern: /隔音|噪音|安靜|安静/, advice: "優先 RC／SRC、角部屋及遠離鐵道或幹道的物件，內見時確認牆面與環境聲音。", impact: 1 },
  { pattern: /採光|采光|明亮/, advice: "先看朝向、前方遮蔽物與窗戶尺寸，再於實際時段看採光。", impact: 1 },
  { pattern: /治安|暗巷|偏僻|夜間/, advice: "比較車站至物件的夜間動線、街燈、商店與人流。", impact: 1 },
  { pattern: /事故屋|心理瑕疵|凶宅/, advice: "搜尋與申請前確認告知事項及管理公司回覆。", impact: 1 },
  { pattern: /對外窗|窗戶|窗户/, advice: "先看募集圖面與室內照片，內見時確認窗外遮蔽物。", impact: 1 },
  { pattern: /樑壓床|梁压床|橫樑|横梁/, advice: "用格局圖與內見確認床位上方結構。", impact: 1 },
  { pattern: /廚房|厨房|煮食/, advice: "確認爐具形式、料理空間與排煙設備。", impact: 1 }
];

function otherCoreNeedsAxis(criteria: RentSearchCriteria): AxisVerdict | null {
  // 家具家電已由設備軸處理，這裡不重複列出。
  const unverified = [...new Set([...(criteria.unverifiedConditions || []), ...(criteria.otherNeeds || [])])]
    .filter(condition => !(criteria.furnished && /家具|家電|家电/.test(condition)));
  if (!unverified.length) return null;

  const priorityOf = (condition: string) => criteria.otherNeedPriorities?.[condition] || "required";
  const priorityLabel = { required: "必要", preferred: "希望", uncertain: "尚未確定" } as const;

  // 常見條件一律以程式端知識表為準（品質穩定、不會每次跑出不同說法）；
  // 知識表沒有的長尾條件才用模型補的判讀，避免整個交給模型導致品質浮動。
  const DIFFICULTY_IMPACT = { easy: 0, normal: 1, hard: 2 } as const;
  const BANNED_TONE = /不代表|不能只以|尚未確認|仍需逐屋確認|不得視為|建議再核對|視情況而定/;
  const noteOf = (condition: string) => criteria.otherNeedNotes?.find(note => note.condition === condition);
  const knowledgeOf = (condition: string): { advice: string; impact: number } | null => {
    const table = CONDITION_KNOWLEDGE.find(entry => entry.pattern.test(condition));
    if (table) return { advice: table.advice, impact: table.impact };
    const note = noteOf(condition);
    // 模型若仍寫出免責語氣就整句捨棄，寧可不顯示也不要污染文案。
    if (note?.marketImpact && !BANNED_TONE.test(note.marketImpact)) {
      return { advice: note.marketImpact.trim(), impact: DIFFICULTY_IMPACT[note.difficulty] ?? 1 };
    }
    return null;
  };

  const detail = unverified.map(condition => `${condition}（${priorityLabel[priorityOf(condition)]}）`).join("・");

  // 只對「有東西可講」的條件產出說明，其餘不填樣板句。
  const drivers = unverified
    .map(condition => {
      const knowledge = knowledgeOf(condition);
      return knowledge ? `${condition}｜${knowledge.advice}` : null;
    })
    .filter(Boolean) as string[];

  const required = unverified.filter(condition => priorityOf(condition) === "required");
  const uncertain = unverified.filter(condition => priorityOf(condition) === "uncertain");
  const hardest = unverified
    .filter(condition => priorityOf(condition) !== "preferred")
    .map(condition => ({ condition, impact: knowledgeOf(condition)?.impact ?? 1 }))
    .sort((a, b) => b.impact - a.impact)[0];
  const freeConditions = required.filter(condition => knowledgeOf(condition)?.impact === 0);

  // 供給壓縮取「最難的那一項」，而不是條件數量——三個一般物件都符合的條件疊起來仍然不難。
  const supplyImpact = hardest?.impact ?? 0;

  const headline = hardest && hardest.impact >= 2
    ? `${hardest.condition}是這組條件裡最難找的一項，會明顯減少可選物件。`
    : uncertain.length
      ? `${uncertain.join("、")}是否為必要條件還沒確定，先不作硬性排除。`
      : freeConditions.length === required.length && required.length
        ? `${required.join("、")}在一般賃貸物件多半已經滿足，不會縮小搜尋範圍。`
        : required.length
          // 不寫死確認方式：有的條件下方計算機就能勾、有的只能看圖面、有的要到現場，
          // 各自的做法留給下面每一條說明，標題只講「這些是必要篩選」。
          ? `${required.join("、")}會作為必要篩選。`
          : `這些只作排序加分，不會縮小基本搜尋範圍。`;

  return {
    key: "otherCoreNeeds", label: "其他核心條件", detail,
    status: hardest && hardest.impact >= 2 ? "需調整" : uncertain.length ? "待確認" : supplyImpact === 0 ? "符合" : "部分符合",
    headline,
    drivers,
    nextStep: hardest && hardest.impact >= 2
      ? "搜尋時先用間取り図篩掉房間相連的物件，可以省下大量無效帶看。"
      : undefined,
    supplyImpact
  };
}

/* ── 在留資格文案（依分類分流，不再把留學生文案套給所有外國人） ── */

const VISA_COPY: Record<VisaCategory, { headline: string; drivers: string[] }> = {
  work: {
    headline: "工作簽證可正常申請一般長期租賃。",
    drivers: ["審查看的是任職公司、雇用狀態與年收入", "需要一位日本國內的緊急聯絡人"]
  },
  student: {
    headline: "留學身分可正常申請，但要挑選接受留學生的物件。",
    drivers: ["常備資料是入學證明、在留卡與財力證明", "多數需要日本國內的緊急聯絡人或連帶保證人"]
  },
  workingHoliday: {
    headline: "打工度假可申請長期租賃，但需篩選接受該簽證的管理公司。",
    drivers: [
      "若尚未在日找到工作，審查通常需準備存款餘額證明（財力證明）",
      "市場上接受的長期物件較少，需提前由仲介鎖定可申請的物件"
    ]
  },
  family: {
    headline: "家族滯在可申請一般租賃，審查會一併看扶養者。",
    drivers: ["通常需要扶養者的在職與收入證明", "契約人可能被要求為扶養者本人"]
  },
  longTerm: {
    headline: "永住或定住資格在審查上與日本人幾乎相同。",
    drivers: ["房源不受在留期間限制"]
  },
  other: {
    headline: "這個在留資格可申請租賃，實際文件依管理公司要求。",
    drivers: ["審查通常會看在留期間、收入與緊急聯絡人"]
  },
  unknown: {
    headline: "還沒有在留資格資料，無法判斷可申請的房源範圍。",
    drivers: []
  }
};

function visaAxis(criteria: RentSearchCriteria): AxisVerdict {
  const category = resolveVisaCategory(criteria.visaType);
  const copy = VISA_COPY[category];
  const detail = criteria.visaType
    ? `${criteria.visaType}${criteria.visaYears ? `・在留 ${criteria.visaYears} 年` : ""}`
    : null;
  return {
    key: "visa", label: "在留資格", detail,
    status: category === "unknown" ? "待確認" : category === "workingHoliday" ? "部分符合" : "符合",
    headline: copy.headline,
    drivers: copy.drivers,
    nextStep: category === "unknown"
      ? "補上在留資格與剩餘期間。"
      : category === "workingHoliday"
        ? "提前準備存款證明（預金殘高證明），方便仲介快速鎖定可申請的長期物件。"
        : undefined,
    supplyImpact: category === "workingHoliday" ? 2 : 0
  };
}

/* ── 對外 API ─────────────────────────────────────────── */

export function buildAxisVerdicts(criteria: RentSearchCriteria, recommendations: RentRecommendation[]): AxisVerdict[] {
  const range = estimateRequestedRent(criteria);
  return [
    visaAxis(criteria),
    budgetAxis(criteria, range),
    commuteAxis(criteria, recommendations),
    layoutAxis(criteria),
    buildingAxis(criteria),
    equipmentAxis(criteria),
    petAxis(criteria),
    otherCoreNeedsAxis(criteria),
    timingAxis(criteria),
    initialCostAxis(criteria)
  ].filter(Boolean) as AxisVerdict[];
}

export function buildOverallVerdict(axes: AxisVerdict[]): OverallVerdict {
  const totalImpact = axes.reduce((sum, axis) => sum + axis.supplyImpact, 0);
  const blocking = axes.filter(axis => axis.status === "難度高");
  const adjusting = axes.filter(axis => axis.status === "需調整");
  // 只有預算缺席才真的無法判斷。沒有通勤目的地仍可評預算、格局、建物等軸，
  // 不該讓整份評估降級成「資料不足」而蓋掉其他結論。
  const pendingKeys = axes.filter(axis => axis.status === "待確認" && axis.key === "budget");

  // 最該先放寬的：壓縮供給最多、且有具體下一步的那一項。
  const loosenFirst = [...axes]
    .filter(axis => axis.nextStep && axis.supplyImpact >= 2)
    .sort((a, b) => b.supplyImpact - a.supplyImpact)[0];

  if (pendingKeys.length) {
    return {
      level: "資料不足",
      headline: `補上${pendingKeys.map(axis => axis.label).join("與")}後才能判斷這組需求找不找得到。`,
      reasons: pendingKeys.map(axis => axis.headline)
    };
  }

  const explicitReasons = [...blocking, ...adjusting];
  const impactfulReasons = axes
    .filter(axis => axis.supplyImpact > 0 && !explicitReasons.includes(axis))
    .sort((a, b) => b.supplyImpact - a.supplyImpact);
  const reasons = [...explicitReasons, ...impactfulReasons].slice(0, 3).map(axis => axis.headline);

  if (blocking.length || totalImpact >= 6) {
    return {
      level: "難度高",
      headline: blocking.length
        ? `${blocking.map(axis => axis.label).join("、")}會讓符合的房源變得很少。`
        : "條件疊加後，同時滿足全部要求的房源會很少。",
      reasons: reasons.length ? reasons : ["多項條件同時限制供給"],
      loosenFirst: loosenFirst ? `${loosenFirst.label}：${loosenFirst.nextStep}` : undefined
    };
  }
  if (adjusting.length || totalImpact >= 4) {
    return {
      level: "需調整",
      headline: "整體方向可行，但有幾項需要取捨才找得順。",
      reasons,
      loosenFirst: loosenFirst ? `${loosenFirst.label}：${loosenFirst.nextStep}` : undefined
    };
  }
  return {
    level: "可行",
    headline: "這組條件在市場上找得到，可以直接開始看物件。",
    reasons: []
  };
}
