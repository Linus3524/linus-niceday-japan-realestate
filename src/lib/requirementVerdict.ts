import { rentRates, districtStations } from "../data/housingMarket.js";
import {
  computeStackedEstimate,
  getRentModifierIndexes,
  resolveVisaCategory,
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

  const pool: number[] = [];
  let basis = "東京都與近郊整體行情";

  for (const rate of rentRates) {
    const stations = districtStations[rate.district] || [];
    const districtHit = districtQueries.length
      ? districtQueries.some(q => normalize(rate.district).includes(q) || q.includes(normalize(rate.district)))
      : false;
    for (const station of stations.length ? stations : [null]) {
      const stationHit = stationQueries.length && station
        ? stationQueries.some(q => normalize(station.name) === q)
        : false;
      if (districtQueries.length || stationQueries.length) {
        if (!districtHit && !stationHit) continue;
      }
      pool.push(computeStackedEstimate(rate, station, mods, criteria.roomType));
    }
  }

  if (districtQueries.length || stationQueries.length) {
    basis = [
      districtQueries.length ? `指定行政區` : null,
      stationQueries.length ? `指定車站` : null
    ].filter(Boolean).join("與");
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
    criteria.commuteMinutes ? `${criteria.commuteMinutes} 分鐘內` : null,
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
  const roomLabel = { r1: "1R", k1: "1K／1DK", ldk1: "1LDK／2K／2DK", ldk2: "2LDK" }[criteria.roomType];
  const detail = `${roomLabel}${criteria.areaMin ? `・${criteria.areaMin}㎡以上` : ""}`;
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
  if (!timing && !size) return null;

  const detail = [timing ? `預計 ${timing} 入住` : null, size ? `${size} 人同住` : null].filter(Boolean).join("・");
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
    headline: `${timing} 入住的話，開始看房的時機大約是前一個半月。`,
    drivers: [
      "日本物件多在入住前 1～2 個月才釋出募集，太早看到的多半留不到入住日",
      size && size >= 2 ? `${size} 人同住需確認物件是否接受複數入居` : ""
    ].filter(Boolean),
    supplyImpact: 0
  };
}

function specialAxis(criteria: RentSearchCriteria): AxisVerdict | null {
  const pets = criteria.petsAllowed === true;
  const unverified = [...(criteria.unverifiedConditions || []), ...(criteria.otherNeeds || [])];
  if (!pets && !unverified.length) return null;

  const detail = [pets ? `可養${criteria.petType || "寵物"}` : null, ...unverified].filter(Boolean).join("・");
  if (pets) {
    return {
      key: "special", label: "特殊條件", detail, status: "難度高",
      headline: `可養${criteria.petType || "寵物"}的物件約佔市場少數，這是硬性篩選。`,
      drivers: [
        "多數會另收敷金或清潔費",
        unverified.length ? `另有 ${unverified.length} 項需看現場或告知事項確認` : ""
      ].filter(Boolean),
      supplyImpact: 3
    };
  }
  return {
    key: "special", label: "居住環境條件", detail, status: "部分符合",
    headline: `${unverified.length} 項條件要看物件圖面與現場才能確認。`,
    drivers: [`包含 ${unverified.slice(0, 3).join("、")}${unverified.length > 3 ? " 等" : ""}`],
    nextStep: "看房時一次確認這幾項，可以省下重複帶看。",
    supplyImpact: unverified.length >= 5 ? 1 : 0
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
    specialAxis(criteria),
    timingAxis(criteria)
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

  const reasons = [...blocking, ...adjusting].slice(0, 3).map(axis => axis.headline);

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
