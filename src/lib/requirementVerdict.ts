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

/** 針對「使用者指定的範圍」重新估價，完全不參考推薦清單。 */
export interface RequestedRentRange {
  low: number;
  median: number;
  high: number;
  sampleCount: number;
  /** 估價基準的說法，用於文案。 */
  basis: string;
}

export function estimateRequestedRent(criteria: RentSearchCriteria): RequestedRentRange | null {
  const mods = getRentModifierIndexes(criteria);
  const districtQueries = [...(criteria.districts || []), criteria.district].filter(Boolean).map(v => normalize(v));
  const stationQueries = [...(criteria.stations || []), criteria.station].filter(Boolean).map(v => normalize(v));

  // 只比對到單一車站時樣本只有 1 筆，區間會退化成同一個數字（「行情約 ¥119,000～¥119,000」），
  // 拿來判斷預算也失去意義。因此車站命中時連同它所屬的行政區一起納入，取得有寬度的區間。
  const stationDistricts = new Set<string>();
  if (stationQueries.length) {
    for (const [district, stations] of Object.entries(districtStations)) {
      if (stations.some(station => stationQueries.some(q => normalize(station.name) === q))) {
        stationDistricts.add(normalize(district));
      }
    }
  }

  const pool: number[] = [];
  let basis = "東京都與近郊整體行情";
  const hasScope = districtQueries.length > 0 || stationDistricts.size > 0;

  for (const rate of rentRates) {
    const stations = districtStations[rate.district] || [];
    const districtHit = districtQueries.some(q => normalize(rate.district).includes(q) || q.includes(normalize(rate.district)))
      || stationDistricts.has(normalize(rate.district));
    for (const station of stations.length ? stations : [null]) {
      if (hasScope && !districtHit) continue;
      pool.push(computeStackedEstimate(rate, station, mods, criteria.roomType));
    }
  }

  if (hasScope) {
    basis = districtQueries.length ? "指定行政區" : "指定車站所在行政區";
  }

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
    const uncertain = criteria.furnishedPriority === "uncertain";
    return {
      key: "equipment",
      label: "設備與家具家電",
      detail: [...equipment, `家具家電（${uncertain ? "尚未確定是否必要" : criteria.furnishedPriority === "preferred" ? "希望" : "必要"}）`].join("・"),
      status: uncertain ? "待確認" : "需調整",
      headline: "日本長期租賃以空屋為主，附家具家電的房源相對少。",
      drivers: [
        "多集中在外國人向、短租或套裝管理物件，租金與初期費用通常較高",
        equipment.length ? `另有 ${equipment.join("、")} 需求` : ""
      ].filter(Boolean),
      nextStep: uncertain
        ? "先確認家具家電是必要還是加分；若只是希望，可選範圍會大很多。"
        : "可比較「空屋＋家具租借」或「空屋＋二手購入」的總成本。",
      supplyImpact: uncertain ? 1 : 2
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

function otherCoreNeedsAxis(criteria: RentSearchCriteria): AxisVerdict | null {
  const unverified = [...new Set([...(criteria.unverifiedConditions || []), ...(criteria.otherNeeds || [])])];
  if (!unverified.length) return null;

  const priorityOf = (condition: string) => criteria.otherNeedPriorities?.[condition] || "required";
  const priorityLabel = { required: "必要", preferred: "希望", uncertain: "尚未確定" } as const;
  const detail = unverified.map(condition => `${condition}（${priorityLabel[priorityOf(condition)]}）`).join("・");
  const conditionAdvice = (condition: string) => {
    const prefix = `${condition}｜${priorityLabel[priorityOf(condition)]}`;
    if (/隔音|噪音|安靜|安静/.test(condition)) return `${prefix}・現場確認：優先 RC／SRC、角部屋及遠離鐵道或幹道的物件，內見時確認牆面與環境聲音。`;
    if (/採光|采光|明亮/.test(condition)) return `${prefix}・圖面＋現場：先看朝向、前方遮蔽物與窗戶尺寸，再於實際時段看採光。`;
    if (/治安|暗巷|偏僻|夜間/.test(condition)) return `${prefix}・現場確認：比較車站至物件的夜間動線、街燈、商店與人流。`;
    if (/事故屋|心理瑕疵|凶宅/.test(condition)) return `${prefix}・文件確認：搜尋與申請前確認告知事項及管理公司回覆。`;
    if (/對外窗|窗戶|窗户/.test(condition)) return `${prefix}・可篩選：先看募集圖面與室內照片，內見時確認窗外遮蔽物。`;
    if (/樑壓床|梁压床|橫樑|横梁/.test(condition)) return `${prefix}・可篩選：用格局圖與內見確認床位上方結構。`;
    if (/廚房|厨房|煮食/.test(condition)) return `${prefix}・可篩選：確認爐具形式、料理空間與排煙設備。`;
    return `${prefix}・待確認：推薦與內見時逐項核對。`;
  };
  const drivers = unverified.map(conditionAdvice);
  const required = unverified.filter(condition => priorityOf(condition) === "required");
  const preferred = unverified.filter(condition => priorityOf(condition) === "preferred");
  const uncertain = unverified.filter(condition => priorityOf(condition) === "uncertain");
  const needsOnSite = required.some(condition => /隔音|噪音|安靜|安静|治安|暗巷|偏僻|夜間/.test(condition));
  const status: AxisStatus = uncertain.length ? "待確認" : required.length ? (needsOnSite ? "待確認" : "部分符合") : "符合";
  const singlePriority = unverified.length === 1 ? priorityOf(unverified[0]) : null;
  const headline = unverified.length === 1 && /隔音|噪音|安靜|安静/.test(unverified[0])
    ? singlePriority === "preferred"
      ? "隔音是加分條件，會優先排序，但不會因此排除其他合適物件。"
      : singlePriority === "uncertain" ? "隔音是否為必要條件還沒確定，目前先作排序參考。" : "隔音是必要條件，房間位置、鄰接牆與周邊道路都要一起確認。"
    : unverified.length === 1 && /採光|采光|明亮/.test(unverified[0])
      ? singlePriority === "preferred" ? "採光是加分條件，會優先比較朝向、窗戶與遮蔽物。" : singlePriority === "uncertain" ? "採光是否為必要條件還沒確定，目前先作排序參考。" : "採光是必要條件，要用圖面與實際時段一起確認。"
      : unverified.length === 1 && /治安|暗巷|偏僻|夜間/.test(unverified[0])
        ? "安全感要看車站到物件的夜間步行路線，不只看行政區名稱。"
        : required.length
          ? `${required.join("、")}會作為必要篩選。${preferred.length ? `${preferred.join("、")}只作排序加分。` : ""}${uncertain.length ? `${uncertain.join("、")}是否必要仍待確認。` : ""}`
          : uncertain.length
            ? `${uncertain.join("、")}是否為必要條件還沒確定，先不作硬性排除。`
            : `${preferred.join("、")}只作排序加分，不會縮小基本搜尋範圍。`;

  return {
    key: "otherCoreNeeds", label: "其他核心條件", detail,
    status,
    headline,
    drivers,
    nextStep: "推薦與看房時按這份清單逐項確認。",
    supplyImpact: required.length >= 4 ? 2 : required.length ? 1 : 0
  };
}

/* ── 在留資格文案（依分類分流，不再把留學生文案套給所有外國人） ── */

const VISA_COPY: Record<VisaCategory, { headline: string; drivers: string[] }> = {
  work: {
    headline: "工作簽證可正常申請一般長期租賃。",
    drivers: ["審查看的是任職公司、雇用狀態與年收入", "需要一位日本國內的緊急聯絡人"]
  },
  student: {
    headline: "留學身分可正常申請，但要挑接受留學生的物件。",
    drivers: ["常備資料是入學證明、在留卡與財力證明", "多數需要日本國內的緊急聯絡人或連帶保證人"]
  },
  workingHoliday: {
    headline: "打工度假的在留期間較短，長期租約選擇會受限。",
    drivers: ["部分管理公司要求在留期間長於契約期間", "短租、シェアハウス與マンスリー通常較容易通過"]
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
    nextStep: category === "unknown" ? "補上在留資格與剩餘期間。" : undefined,
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
