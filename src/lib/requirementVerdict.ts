import { rentRates, districtStations, type LayoutCode } from "../data/housingMarket.js";
import { LAYOUT_AREA_BANDS, layoutBandMidArea } from "../data/buyMarket.js";
import {
  reinsImpliedDiscountFromListingRate,
  reinsNewListingPremiumRate,
} from "../data/reinsSaleMarket.js";
import type { SaleListingBenchmark } from "../data/saleListingMarket.js";
import { stationsWithinHops } from "./localTransitRoute.js";
import { toJapaneseStationName } from "./transit.js";
import type { UnitFeatureEvaluation } from "./listingExtraction.js";
import {
  computeStackedEstimate,
  getRentModifierIds,
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
  /**
   * status 為「待確認」時，說明是哪一種待確認。
   *
   * 同一個軸可能因為不同原因無法判斷，而整體結論要給對應的下一步：
   * 「沒填預算」要叫使用者補預算，「地區查無行情」叫他補預算沒有意義——
   * 他明明填了，只會反覆重填一個已經填好的欄位。
   */
  pendingReason?: "missing-input" | "no-market-data";
}

export type AxisImpactLevel = "容易達成" | "需要取捨" | "較難兼顧" | "待補資料";

export type OverallLevel = "可行" | "有條件可行" | "難度高" | "資料不足";

export interface OverallVerdict {
  level: OverallLevel;
  headline: string;
  reasons: string[];
  loosenFirst?: string;
  /** 尚未補齊的評估面向。與難度分開顯示，避免把未知誤當成容易。 */
  pendingLabels?: string[];
}

/**
 * 個別列只表達「這項條件在整體需求中的達成難度」，不再顯示符合／不符合。
 * 符合是整組需求的結論；單項使用取捨程度，才不會讓人誤讀成逐項驗收。
 */
export function axisImpactLevel(axis: AxisVerdict): AxisImpactLevel {
  if (axis.status === "待確認") return "待補資料";
  if (axis.supplyImpact >= 2) return "較難兼顧";
  if (axis.supplyImpact >= 1) return "需要取捨";
  return "容易達成";
}

const yen = (value: number) => `¥${(Math.round(value / 1000) * 1000).toLocaleString("en-US")}`;
const man = (value: number) => {
  const num = Math.round(value / 1000) / 10;
  return Number.isInteger(num)
    ? `${num.toLocaleString("en-US")} 萬円`
    : `${num.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} 萬円`;
};

/**
 * 預算專用：無條件捨去到 0.1 萬，不四捨五入。
 *
 * 使用者說「6萬多」時，擷取會取區間上緣 69,999；man() 再四捨五入就變成「7 萬円」，
 * 兩層向上偏移疊起來，畫面顯示的預算比使用者實際講的多了近 15%，
 * 後續所有判斷與報價都被這個虛高的數字錨定。行情數字維持四捨五入即可，
 * 但使用者自己的預算只能少報、不能多報。
 */
const manBudget = (value: number) => `${(Math.floor(value / 1000) / 10).toFixed(1).replace(/\.0$/, "")} 萬円`;

const normalize = (value?: string | null) => (value || "")
  .toLowerCase()
  .replace(/涉谷|渋谷/g, "澀谷")
  .replace(/[\s・･（）()\-]/g, "");

const normalizeStation = (value?: string | null) => normalize(toJapaneseStationName(value || ""));

/** 通勤路線查詢前先確認站名在本站交通資料中，避免無效站名觸發多輪外部查詢。 */
export function hasKnownCommuteStations(value?: string | null, alternatives: string[] = []): boolean {
  const targets = [...alternatives, ...((value || "").split(/[、,，/／或|・]/))]
    .map(item => normalizeStation(item))
    .filter(Boolean);
  if (!targets.length) return false;
  return targets.every(query => Object.values(districtStations).some(stations =>
    stations.some(station => normalizeStation(station.name) === query)
  ));
}

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
  /** 各行政區各自的估價，依中位由低到高排序。 */
  segments: RentSegment[];
  /**
   * 樣本橫跨互不重疊的價位帶時為 true。
   *
   * 這種情況下 low／median／high 這組百分位是「假精確」——把 4 個行情差一倍的
   * 行政區混在一起取百分位，得到的中間值對應不到任何真實地點：中位可能是練馬的
   * 價，低端卻是所澤的價。使用者看到「只差 1%」會以為加一點錢就有，實際上那個
   * 低端在他不想住的地方。所以 true 時文案要改成分段講，不要給單一區間。
   */
  spread: boolean;
  sourceUrl?: string;
  sourceLabel?: string;
  sourceDate?: string;
}

export interface RentSegment {
  district: string;
  low: number;
  median: number;
  high: number;
}

/**
 * 使用者實際指定的搜尋範圍（行政區集合＋人看得懂的說法）。
 *
 * 左側可行性評估與右側推薦車站必須用同一組地理範圍，否則會出現
 * 「左邊說要 11 萬、右邊給 7 萬車站」這種互相矛盾的結果。
 * 之後要新增地點類條件（例如指定區域帶、學區）只要改這裡，兩側一起生效。
 */
export function resolveSearchScope(criteria: RentSearchCriteria): {
  districts: Set<string>;
  label: string;
  useMetroDefault: boolean;
  unresolvedLocations: string[];
} {
  const districts = new Set<string>();
  const sources: string[] = [];
  const unresolvedLocations: string[] = [];

  const districtInputs = [...(criteria.districts || []), criteria.district]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0);
  if (districtInputs.length) {
    let hit = false;
    for (const input of districtInputs) {
      const query = normalize(input);
      const matches = rentRates.filter(rate => normalize(rate.district).includes(query) || query.includes(normalize(rate.district)));
      if (matches.length) {
        matches.forEach(rate => districts.add(normalize(rate.district)));
        hit = true;
      } else if (!unresolvedLocations.includes(input.trim())) {
        unresolvedLocations.push(input.trim());
      }
    }
    if (hit) sources.push("指定行政區");
  }

  // 車站：只取該站會讓樣本剩 1 筆、區間退化成單一數字，因此連同所屬行政區一起納入。
  const stationInputs = [...(criteria.stations || []), criteria.station]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0);
  if (stationInputs.length) {
    let hit = false;
    for (const input of stationInputs) {
      const query = normalizeStation(input);
      let inputHit = false;
      for (const [district, stations] of Object.entries(districtStations)) {
        if (stations.some(station => normalizeStation(station.name) === query)) {
          districts.add(normalize(district));
          hit = true;
          inputHit = true;
        }
      }
      if (!inputHit && !unresolvedLocations.includes(input.trim())) {
        unresolvedLocations.push(input.trim());
      }
    }
    if (hit) sources.push("指定車站所在行政區");
  }

  // 路線：一條線橫跨的行政區行情差距很大（西武池袋線從豐島區到所澤市），
  // 少了這段就會只用線上最貴的那一站當基準。
  const lineInputs = [...(criteria.lines || []), criteria.line]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0);
  let matchedAnyLine = false;
  for (const lineInput of lineInputs) {
    const lineQuery = normalizeLine(lineInput);
    let hit = false;
    if (lineQuery.length >= 3) {
      for (const [district, stations] of Object.entries(districtStations)) {
        if (stations.some(station => station.lines.some(line => {
          const candidate = normalizeLine(line);
          return candidate.includes(lineQuery) || lineQuery.includes(candidate);
        }))) {
          districts.add(normalize(district));
          hit = true;
          matchedAnyLine = true;
        }
      }
    }
    if (!hit && !unresolvedLocations.includes(lineInput.trim())) unresolvedLocations.push(lineInput.trim());
  }
  if (matchedAnyLine) sources.push("指定沿線");

  // 只給通勤目的地時，可住範圍就是「與該站有共同線路的行政區」——
  // 這正是推薦清單挑候選的規則，用同一條規則兩側才會一致。
  // 刻意不看預算，避免用預算挑出範圍再回頭證明預算可行的循環論證。
  if (!districts.size && criteria.commuteStation) {
    const targets = [...(criteria.commuteStations || []), ...(criteria.commuteStation.split(/[、,，/／或|・]/))]
      .map(v => normalizeStation(v)).filter(Boolean);
    const targetLines = new Set<string>();
    for (const stations of Object.values(districtStations)) {
      for (const station of stations) {
        const stationName = normalizeStation(station.name);
        if (targets.some(t => stationName.includes(t) || t.includes(stationName))) {
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

  // 站數上限：「池袋五六站就能到」。這是唯一能把「同一條線但貴到離譜的起點區」
  // 與「太遠的郊區」同時修掉的條件，所以放在最後當收斂用——先讓上面的規則決定
  // 候選範圍，再用站數把不符合的行政區剔除。
  const maxStations = criteria.commuteMaxStations;
  const hopOrigin = criteria.commuteStation || criteria.station || null;
  if (maxStations && maxStations > 0 && hopOrigin) {
    const reachable = stationsWithinHops(hopOrigin, maxStations);
    if (reachable.size) {
      const withinHops = new Set<string>();
      for (const [district, stations] of Object.entries(districtStations)) {
        if (stations.some(s => reachable.has(toJapaneseStationName(s.name)))) {
          withinHops.add(normalize(district));
        }
      }
      if (withinHops.size) {
        // 已有範圍就取交集（兩個條件都要滿足）；還沒有範圍就直接採用。
        if (districts.size) {
          for (const district of [...districts]) {
            if (!withinHops.has(district)) districts.delete(district);
          }
          // 交集為空代表使用者的條件互相矛盾，此時保留站數範圍比留下空集合有用。
          if (!districts.size) withinHops.forEach(d => districts.add(d));
        } else {
          withinHops.forEach(d => districts.add(d));
        }
        sources.push(`${hopOrigin} ${maxStations} 站內`);
      }
    }
  }

  // 有填地點卻完全比對不到，和「沒有指定地點」是兩件不同的事。
  // 前者應交給外部行情查詢並在左側顯示資料待確認，不能偷偷退回一都三縣後判可行。
  const hasExplicitLocation = [
    ...(criteria.districts || []),
    criteria.district,
    ...(criteria.stations || []),
    criteria.station,
    ...(criteria.lines || []),
    criteria.line,
    criteria.locationPreference,
    ...(criteria.commuteStations || []),
    criteria.commuteStation
  ].some(value => typeof value === "string" && value.trim().length > 0);

  return {
    districts,
    label: unresolvedLocations.length
      ? `指定地點「${unresolvedLocations.slice(0, 2).join("、")}」行情待確認`
      : sources.length
      ? sources.join("＋")
      : hasExplicitLocation
        ? "指定地點（行情待確認）"
        : "東京都與近郊整體行情",
    // 使用者沒指定任何地點時，districts 是空的，取樣就會涵蓋資料庫全部 210 筆——
    // 包含札幌、廣島、那霸等與本站客層無關的地區，行情從 3.7 萬拉到 14 萬，
    // 算出來的中位數對「在東京找房」的人沒有意義，標籤也名不副實。
    // 因此預設收斂到一都三縣（東京都・神奈川・埼玉・千葉），
    // 與上面那句「東京都與近郊」的標籤講的是同一個範圍。
    // 不用整個關東是因為茨城／栃木／群馬（水戶、宇都宮、前橋）通勤上構不到都心。
    useMetroDefault: !hasExplicitLocation,
    unresolvedLocations
  };
}

export function estimateRequestedRent(criteria: RentSearchCriteria): RequestedRentRange | null {
  const mods = getRentModifierIds(criteria);
  const scope = resolveSearchScope(criteria);
  const hasScope = scope.districts.size > 0;

  // 使用者有指定地點但站內資料辨識不到時，不可拿預設區域行情代替。
  // API 會另外查外部市場參考；在那之前左側應維持「資料不足」。
  if (scope.unresolvedLocations.length || (!hasScope && !scope.useMetroDefault)) return null;

  const pool: number[] = [];
  const byDistrict = new Map<string, number[]>();
  for (const rate of rentRates) {
    if (hasScope && !scope.districts.has(normalize(rate.district))) continue;
    // 沒指定地點時只取一都三縣，理由見 resolveSearchScope 的 useMetroDefault 註解。
    if (!hasScope && scope.useMetroDefault && !METRO_REGIONS.has(rate.region)) continue;
    const stations = districtStations[rate.district] || [];
    const values: number[] = [];
    for (const station of stations.length ? stations : [null]) {
      const estimate = computeStackedEstimate(rate, station, mods, criteria.roomType);
      values.push(estimate);
      pool.push(estimate);
    }
    if (values.length) byDistrict.set(rate.district, values);
  }
  const basis = scope.label;

  if (!pool.length) return null;
  const percentiles = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b);
    const at = (ratio: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))];
    return { low: at(0.15), median: at(0.5), high: at(0.85) };
  };

  const segments: RentSegment[] = [...byDistrict.entries()]
    .map(([district, values]) => ({ district, ...percentiles(values) }))
    .sort((a, b) => a.median - b.median);

  // 最便宜與最貴的行政區中位差超過 15%，就當作橫跨不同價位帶。
  // 這個門檻對應的是「換一個區就換一個價格級距」的實務感受：以練馬區 8.6 萬
  // 對豐島區 10.1 萬（差 17%）來說，兩者確實是不同的預算級距，不能混為一談。
  const cheapest = segments[0];
  const priciest = segments[segments.length - 1];
  const spread = segments.length > 1 && cheapest.median > 0 &&
    (priciest.median - cheapest.median) / cheapest.median > 0.15;

  return { ...percentiles(pool), sampleCount: pool.length, basis, segments, spread };
}

/** 沒指定地點時的預設取樣範圍：一都三縣，也就是通勤得到都心的範圍。 */
const METRO_REGIONS = new Set(["東京都", "神奈川", "埼玉", "千葉"]);

/** 價差大時，行情說明最多列幾個區。列太多會變成一長串清單，反而看不到重點。 */
const SEGMENT_SHOWCASE = 5;

/* ── 各軸判斷 ───────────────────────────────────────────── */

function budgetAxis(criteria: RentSearchCriteria, range: RequestedRentRange | null, outOfRange = false): AxisVerdict {
  const budget = criteria.maxBudget;
  const feeState = criteria.budgetIncludesFees;
  const detail = budget
    ? `${criteria.minBudget ? `${manBudget(criteria.minBudget)}～` : "上限 "}${manBudget(budget)}${feeState === true ? "（含管理費）" : feeState === false ? "（不含管理費）" : ""}`
    : null;

  if (!budget) {
    return {
      key: "budget", label: "預算", detail: null, status: "待確認",
      headline: outOfRange
        ? "月租上限超出合理範圍，這個數字沒有被採用。"
        : "還沒有月租上限，無法判斷這組條件找不找得到。",
      drivers: [],
      nextStep: outOfRange
        ? `請確認金額：月租上限最高只接受到 ${man(MAX_MONTHLY_BUDGET)}，是不是多打了幾個零？`
        : "補上每月可負擔的租金上限。",
      supplyImpact: 0,
      pendingReason: "missing-input"
    };
  }
  if (!range) {
    return {
      key: "budget", label: "預算", detail, status: "待確認",
      headline: "指定範圍內沒有可用的行情資料，無法比對這個預算。",
      drivers: [], nextStep: "換一個地區或改指定車站，這一區目前沒有收錄行情。",
      supplyImpact: 0,
      pendingReason: "no-market-data"
    };
  }

  // 分布橫跨不同價位帶時，單一區間會產生對應不到任何地點的中間值，改成分段講。
  //
  // 只挑「與這個預算有關」的區來講，不是把所有區倒出來：
  // 未指定地點時關東就有 78 個區，全部串成一句話會變成幾百字的清單，
  // 讀的人反而找不到自己要的資訊。
  const describe = (seg: RentSegment) =>
    seg.low === seg.median ? `${seg.district}約 ${man(seg.median)}` : `${seg.district}約 ${man(seg.low)}～${man(seg.median)}`;
  const inBudget = budget ? range.segments.filter(seg => seg.low <= budget) : [];
  const spotlight = inBudget.length
    // 預算搆得到的區：取最貴的幾個——同樣付得起，當然先看條件較好的。
    ? inBudget.slice(-SEGMENT_SHOWCASE).reverse()
    // 都搆不到：取最便宜的幾個，讓使用者知道最低要抓多少。
    : range.segments.slice(0, SEGMENT_SHOWCASE);
  const omitted = (inBudget.length || range.segments.length) - spotlight.length;
  const segmentText = spotlight.map(describe).join("、") +
    (omitted > 0 ? `，另有 ${omitted} 個區在範圍內` : "");
  const drivers = range.spread
    ? [`${range.basis}在此條件下各區價差不小，${inBudget.length ? "預算內例如" : "行情較低的例如"}：${segmentText}`]
    : [`${range.basis}在此條件下，行情約 ${yen(range.low)}～${yen(range.high)}，中位約 ${yen(range.median)}`];
  if (feeState === false) drivers.push("管理費另計，實付會再高一些");
  const feeStep = feeState === null || feeState === undefined ? "順帶確認預算含不含管理費，這會直接影響可選範圍。" : undefined;

  // 只建議放寬使用者真的設過的條件，不能叫人放寬他沒提過的東西。
  const loosenable = [
    criteria.areaMin ? "面積" : null,
    criteria.buildingAgeMax ? "屋齡" : null,
    criteria.walkMinutes ? "徒步距離" : null
  ].filter(Boolean) as string[];

  // 預算構不到行情時，先看看是不是「某幾個區其實買得起」——
  // 只講一句「提高到 X 萬」而不說 X 萬對應哪裡，使用者照做仍然找不到房子。
  const affordable = range.segments.filter(seg => seg.low <= budget);
  // 這兩句先前直接把 affordable 全部串起來，未指定地點時會吐出五十個地名。
  // 與 drivers 用同一個上限，取最貴的幾個——同樣付得起就先看條件較好的。
  const affordableNames = (() => {
    const top = affordable.slice(-SEGMENT_SHOWCASE).reverse().map(seg => seg.district);
    const rest = affordable.length - top.length;
    return top.join("、") + (rest > 0 ? `等 ${affordable.length} 個區` : "");
  })();
  const cheapest = range.segments[0];

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
      headline: range.spread && affordable.length
        ? `這個預算在${affordableNames}找得到，其他區要再往上加。`
        : `預算落在行情偏低端，約 ${Math.min(95, Math.max(10, share))}% 的物件在範圍內。`,
      drivers,
      nextStep: range.spread && affordable.length
        ? `把搜尋集中在${affordableNames}，其他區同條件約 ${man(range.median)}。`
        : loosenable.length
          ? `鎖定行情較低的車站，或放寬${loosenable.join("、")}。`
          : "往行情較低的車站找，可選數量會明顯增加。",
      supplyImpact: 1
    };
  }

  // 容差帶：行情本來就是估算，差幾個百分點屬於雜訊。
  // 沒有這段的話 ¥70,000 對上低端 ¥71,000 會被判「需調整」，還建議使用者
  // 「提高到 7.1 萬」——為了 1,000 円叫人改預算，只會讓整份評估看起來不可信。
  // 同時這也消掉 range.low 上的斷崖（¥71,000 部分符合 / ¥70,999 需調整）。
  const gapRatio = (range.low - budget) / budget;
  if (gapRatio <= 0.05) {
    return {
      key: "budget", label: "預算", detail, status: "部分符合",
      headline: `預算幾乎貼齊行情低端，能找但選擇不多。`,
      drivers,
      nextStep: loosenable.length
        ? `優先找行情較低的車站，或放寬${loosenable.join("、")}就會鬆一些。`
        : "優先找行情較低的車站，可選數量會明顯增加。",
      supplyImpact: 1
    };
  }

  const gapPercent = Math.round(gapRatio * 100);
  const withinReach = gapRatio <= 0.15;
  return {
    key: "budget", label: "預算", detail,
    status: withinReach ? "需調整" : "難度高",
    headline: range.spread
      ? `這個預算低於指定區域的起跳行情，目前最接近預算的是 ${cheapest.district}（約 ${man(cheapest.low)}～${man(cheapest.median)}）。`
      : `這個預算低於指定區域的起跳行情約 ${gapPercent}%。`,
    drivers,
    // 低端來自哪個區要講清楚。只說「提高到 X 萬」而不說那是哪裡的價位，
    // 使用者會以為加錢就能留在原本想住的地方。
    nextStep: withinReach
      ? `建議將月租上限微調至約 ${man(range.low)}${range.spread ? `（${cheapest.district}一帶的起跳價）` : ""}，或是考量周邊行情更親民的區域。`
      : `若希望維持目前的預算，建議考慮調整搜尋區域；指定範圍內相對親民的起跳行情約為 ${man(range.low)}${range.spread ? `（${cheapest.district}）` : ""}。`,
    supplyImpact: withinReach ? 2 : 3
  };
}

export type ListingVerdictStatus =
  | "合理"
  | "超值"
  | "條件反映"
  | "偏高"
  | "明顯偏高"
  | "待確認"
  | AxisStatus;

export interface ListingPriceVerdictContext {
  ageYears?: number | null;
  walkMinutes?: number | null;
  areaSqm?: number | null;
  roomType?: string | null;
  structure?: string | null;
  floor?: number | null;
  totalFloors?: number | null;
  specialNotes?: string;
  otherConditions?: string;
  freeRent?: string;
  facilities?: string;
}

export interface RentalPriceFactor {
  label: string;
  ratePercent: number;
  monthlyYen?: number;
  note: string;
  level: number;
  category: "space" | "amenity" | "location" | "age" | "structure" | "floor" | "internet";
}

export interface ListingPriceVerdict {
  status: ListingVerdictStatus;
  headline: string;
  detail: string;
  factors?: RentalPriceFactor[];
  positiveFactorsSumPercent?: number;
  negativeFactorsSumPercent?: number;
  netFactorsSumPercent?: number;
  nominalDiffPercent?: number;
}

/**
 * 判斷「這個物件的租金＋管理費」相對所在地區行情是高是低，供圖紙健檢功能使用。
 *
 * 採用綜合多因子校準模型（Multi-Factor Real Estate Appraisal）：
 * 不盲目以名目租金硬套區域均價，而是綜合考量：
 * 1. 屋齡（築年數／新築・淺築・中古溢折價）
 * 2. 車站距離（徒步分鐘數溢折價）
 * 3. 專有面積（單身套房大坪數空間優勢）
 * 4. 高價值設備（免費高速網路每月實質節省、衛浴分離、獨立洗面台、自動鎖防犯、RC構造等）
 *
 * 診斷狀態使用不動產實務自然詞彙：
 * 「合理」「超值」「條件反映（合理品質溢價）」「偏高」「明顯偏高」「待確認」
 */
export interface SalePriceFactor {
  label: string;
  ratePercent: number;
  note: string;
  /**
   * 這一項有沒有真的乘進預期價。
   *
   * 只有「修正比較口徑」的項目才會套用（例如帶租約物件與實價登錄的自住成交
   * 根本不是同一種買賣）。徒步、樓層、翻新這類「品質溢價」一律不套用——
   * 它們的百分比是業界經驗值不是回歸結果，而且比較基準（同區同房型同屋齡帶的
   * 成交中位數）本身就已經混合了各種徒步距離與樓層，再乘一次等於重複計算。
   * 這些項目改成純參考資訊呈現。
   */
  applied: boolean;
  /** data＝來自實際成交資料；estimate＝業界經驗值，無法用現有資料驗證 */
  basis: "data" | "estimate";
}

export interface SalePriceInsightPoint {
  id: string;
  tag: string;
  title: string;
  content: string;
  type: "verdict" | "factor" | "market" | "advice";
}

export interface SalePriceVerdict {
  verdict: "bargain" | "fair" | "premium";
  verdictText: string;
  explanation: string;
  insightPoints: SalePriceInsightPoint[];
  /** 相對「經條件校準後的預期價」的價差 */
  diffPercent: number;
  /** 相對「未校準的分桶中位總價」的價差，保留舊口徑供對照 */
  rawDiffPercent: number;
  expectedPriceMan: number;
  /** 面積校準後、尚未套入本案條件係數的市場基準（＝成交㎡單價 × 本案面積）。 */
  areaBaselineMan: number;
  fairLowMan: number;
  fairHighMan: number;
  /** 公開刊登平均，或 REINS 新規登録口徑換算的市場典型開價。 */
  typicalListingPriceMan: number | null;
  /** 同規模在售行情區間下限 */
  typicalListingPriceLowMan?: number | null;
  /** 同規模在售行情區間上限 */
  typicalListingPriceHighMan?: number | null;
  /** 同規模在售行情區間文字標籤，例如 "5,300～5,645 萬円" */
  listingRangeLabel?: string | null;
  listingDiffPercent: number | null;
  listingVerdict: "below" | "typical" | "above" | null;
  listingVerdictText: string | null;
  listingPremiumRatePercent: number | null;
  impliedDiscountFromListingPercent: number | null;
  listingBenchmarkPeriod: string | null;
  listingBenchmarkSourceUrl: string | null;
  listingBenchmarkSourceLabel: string | null;
  listingBenchmarkKind: SaleListingBenchmark["kind"] | null;
  listingBenchmarkScopeLabel: string | null;
  areaAdjusted: boolean;
  areaBasisNote: string;
  /** 比較基準是怎麼挑的（屋齡是否已由基準控制） */
  baselineNote: string;
  ageHandledInBaseline: boolean;
  factors: SalePriceFactor[];
  /** 所有正向優勢條件（如翻新、近站、頂樓、角部屋、南向等）加總幅度（%） */
  positiveFactorsSumPercent: number;
  /** 所有條件（含折價與溢價）加總淨幅度（%） */
  netFactorsSumPercent: number;
  cautions: string[];
}

/**
 * 買賣開價合理度：把實價分桶中位數校準成「這一戶的預期價」再比較。
 *
 * 為什麼不能直接拿開價比中位數：
 * 分桶中位數是「該區、該房型、該面積帶」的成交中位「總價」，一個 ldk2 分桶
 * 涵蓋 45～75㎡，同分桶內最小與最大戶的合理總價可以差到六成以上。不先把面積
 * 拉齊就比，等於拿不同大小的房子互比；屋齡（日本中古折價極陡）與徒步分鐘
 * 同理，中位數把各種屋齡與距離全部混在一起。
 *
 * 校準兩步：
 * 1. 面積：用建立快照時的同一組面積帶中點當分桶代表面積，把中位總價換算成
 *    這一戶實際面積對應的價格（等同於改用單價比較，只是講法更直觀）。
 * 2. 條件：屋齡、徒步、樓層各自給一個相對基準的溢價／折價率再乘上去。
 *
 * 得到預期價後給一個容許區間，落在區間內才算合理——中位數本身是點估計，
 * 個別成交本來就會上下浮動，硬要求貼齊單一數字會把正常的物件判成異常。
 */
export function buildSalePriceVerdict(input: {
  salePriceYen: number;
  medianPriceYen: number;
  /** MLIT 成交紀錄直接算出的㎡單價；有同屋齡帶樣本時應傳該分層中位數。 */
  medianSqmPriceYen?: number | null;
  /** 該房型在該行政區的成交中位面積（㎡），用於將刊登在售開價校準至每㎡單價 */
  medianAreaSqm?: number | null;
  /** true 代表 medianSqmPriceYen 已控制本案屋齡，不再疊加手估屋齡係數。 */
  ageControlledByMarket?: boolean;
  /**
   * 同屋齡帶單價的取得範圍：
   * "layout" = 同區＋同房型＋同屋齡帶（最嚴謹）
   * "district" = 該房型的同屋齡帶樣本不足，改用同區同屋齡帶但「跨房型」合併
   * 兩者都會讓 ageControlledByMarket 為 true，但可信度不同，文案必須分開講。
   */
  ageBandScope?: "layout" | "area" | "adjacent_age" | "district" | null;
  layout: LayoutCode;
  areaSqm: number | null;
  ageYears: number | null;
  walkMinutes: number | null;
  floor: number | null;
  totalFloors: number | null;
  renovationNotes?: string;
  /** 圖紙上的現況欄（賃貸中／オーナーチェンジ／空室／居住中等），用來判斷是否為帶租約物件 */
  occupancyStatus?: string;
  /** 圖紙上的構造欄（RC／SRC），用來套用成交資料的構造溢價 */
  structureText?: string;
  /**
   * 來自國交省成交資料、已控制屋齡的條件溢價（%）。
   * 有值時優先於寫死的經驗值，並把 basis 標成 "data"。
   */
  conditionPremium?: {
    renovationPremiumPercent: number | null;
    structurePremiumPercent: number | null;
  } | null;
  /**
   * 本案所在町名相對同區行情的地段溢價（已控制屋齡）。
   * 行政區層級的比較會把一個區裡的好地段與差地段混在一起，這一項把差異挑出來。
   */
  townPremium?: {
    town: string;
    premiumPercent: number;
    sampleCount: number;
    rank: number;
    townCount: number;
  } | null;
  /**
   * 交通樞紐度與多站利用（如可徒步至中野、新宿等核心大站，或 2 站 3 路線利用可能）。
   */
  transitHub?: {
    hasMajorTerminal: boolean;
    majorStation: string | null;
    majorWalkMinutes: number | null;
    totalStations: number;
    totalLinesCount: number;
    ratePercent: number;
    note: string;
  } | null;
  /**
   * 帶租約物件的收益資訊：圖紙上的現行租金，以及同區同房型的市場租金行情。
   * 帶租約的成交價實質上由收益還原（年租金 ÷ 期待利回り）決定，
   * 所以租金比行情低多少，價格就該同幅往下調整。
   */
  tenantedIncome?: {
    /** 圖紙上的現行月租（或由年收入／表面利回換算） */
    monthlyRentYen: number;
    /**
     * 同區同房型的市場表面利回り。必須由「同一來源的租金 ÷ 同一來源的在售價」求得，
     * 跨來源相除（例如刊登租金 ÷ 實價登錄成交價）母體對不起來，會系統性高估。
     */
    marketGrossYieldRate: number | null;
    rentSourceLabel?: string | null;
  } | null;
  /** 該分桶的成交樣本數，用來決定結論該給多寬的容許區間 */
  sampleCount?: number | null;
  /** 同區公開刊登平均優先；缺值時才使用同區域 REINS 成約／新規登録比。 */
  listingBenchmark?: SaleListingBenchmark | null;
  /** 圖紙解析之單元格局與權利特徵（角部屋、朝向、露台、借地權等） */
  unitFeatures?: UnitFeatureEvaluation | null;
  /** 社區總戶數（用於評估規模效應：100戶以上大規模保值 vs 20戶以下小規模修繕風險） */
  totalUnits?: number | null;
  /** 大樓管理形態（全部委託／日勤／常駐 vs 自主管理） */
  managementStyle?: string | null;
  managementCompany?: string | null;
  /** 大樓設備或特記文字（用於辨識無電梯、可飼育寵物等） */
  buildingNotes?: string | null;
}): SalePriceVerdict {
  const { salePriceYen, medianPriceYen, layout, areaSqm, ageYears, walkMinutes, floor, totalFloors } = input;

  const factors: SalePriceFactor[] = [];
  const cautions: string[] = [];

  // ── 1. 面積校準 ──
  const bandMid = layoutBandMidArea(layout);
  const [bandMin, bandMax] = LAYOUT_AREA_BANDS[layout];
  // 面積落在分桶帶之外代表房型分桶本身就不太適用，這時不做線性外推，
  // 硬換算會把誤差放大；改用未校準中位數並在說明裡講清楚。
  const areaUsable = areaSqm !== null && areaSqm >= bandMin * 0.7 && areaSqm <= bandMax * 1.3;
  const areaAdjusted = areaUsable && areaSqm !== null;
  const areaBaseline = areaAdjusted && areaSqm !== null
    ? input.medianSqmPriceYen && input.medianSqmPriceYen > 0
      ? input.medianSqmPriceYen * areaSqm
      : medianPriceYen * (areaSqm / bandMid)
    : medianPriceYen;
  const areaBasisNote = areaAdjusted && areaSqm !== null
    ? input.medianSqmPriceYen && input.medianSqmPriceYen > 0
      ? `已用國交省成交㎡單價中位數直接換算本案 ${areaSqm}㎡，不再以房型面積帶中點近似。`
      : `已按專有面積校準：分桶代表面積約 ${bandMid}㎡，本案 ${areaSqm}㎡。`
    : areaSqm === null
      ? "圖紙未讀到專有面積，僅能比對分桶中位總價，精度較低。"
      : `本案 ${areaSqm}㎡ 落在 ${layout} 分桶採計範圍（${bandMin}～${bandMax}㎡）之外，未做面積換算。`;

  // ── 2. 屋齡（日本中古住宅價格對屋齡最敏感；基準為市場庫存主力 20～25 年）──
  let ageRate = 0;
  let ageHandledInBaseline = false;
  if (ageYears !== null) {
    if (input.ageControlledByMarket) {
      // 屋齡由基準本身控制，不是一個「調整」。列成 +0% 的因子會讓使用者
      // 以為系統沒考慮屋齡，但實際上它處理得比其他項都嚴謹（直接用同屋齡帶的
      // 實際成交單價）。改由 baselineNote 說明，不放進因子清單。
      ageHandledInBaseline = true;
    }
    else if (ageYears <= 3) { ageRate = 0.25; factors.push({ label: "屋齡", ratePercent: 25, note: `築 ${ageYears} 年（新築／準新築）`, applied: false, basis: "estimate" }); }
    else if (ageYears <= 5) { ageRate = 0.20; factors.push({ label: "屋齡", ratePercent: 20, note: `築 ${ageYears} 年（淺築新古屋）`, applied: false, basis: "estimate" }); }
    else if (ageYears <= 10) { ageRate = 0.12; factors.push({ label: "屋齡", ratePercent: 12, note: `築 ${ageYears} 年（10 年內）`, applied: false, basis: "estimate" }); }
    else if (ageYears <= 15) { ageRate = 0.06; factors.push({ label: "屋齡", ratePercent: 6, note: `築 ${ageYears} 年`, applied: false, basis: "estimate" }); }
    else if (ageYears <= 25) { ageRate = 0; factors.push({ label: "屋齡", ratePercent: 0, note: `築 ${ageYears} 年（中古主力屋齡，等同基準）`, applied: false, basis: "estimate" }); }
    else if (ageYears <= 30) { ageRate = -0.08; factors.push({ label: "屋齡", ratePercent: -8, note: `築 ${ageYears} 年`, applied: false, basis: "estimate" }); }
    else if (ageYears <= 40) { ageRate = -0.18; factors.push({ label: "屋齡", ratePercent: -18, note: `築 ${ageYears} 年（築古）`, applied: false, basis: "estimate" }); }
    else { ageRate = -0.28; factors.push({ label: "屋齡", ratePercent: -28, note: `築 ${ageYears} 年（高齡物件）`, applied: false, basis: "estimate" }); }

    // 1981 年 6 月前確認申請的舊耐震，除了折價還牽涉貸款與減稅資格。
    const oldQuakeStandardAge = new Date().getFullYear() - 1981;
    if (ageYears >= oldQuakeStandardAge) {
      cautions.push("屋齡推算可能屬於「舊耐震基準」（1981年6月以前）。舊耐震會影響銀行承貸成數與年限，也不能直接適用住宅ローン控除，需取得耐震基準適合証明。請向仲介確認確切的建築確認日期。");
    }
  }

  // ── 3. 車站徒步 ──
  //
  // 國交省成交資料的 TimeToNearestStation 欄位對中古マンション是 0% 有值
  // （實測東京 2025 年 16,353 筆全部空白），所以這裡無法用成交資料回歸，
  // 只能採用市場調查值。依東日本不動産流通機構／不動産流通業界的統計，
  // 以徒歩 1〜5 分為基準時，6〜10 分約 -7%、11〜15 分約 -20%、16 分以上約 -35%。
  // 本系統的比較基準是分桶中位數（混合各種站距，重心約在 6〜10 分），
  // 因此把上述級距整體平移，令 6〜10 分為 0。
  let walkRate = 0;
  if (walkMinutes !== null) {
    if (walkMinutes <= 3) { walkRate = 0.10; factors.push({ label: "車站距離", ratePercent: 10, note: `最近站徒步 ${walkMinutes} 分（極近站）`, applied: false, basis: "estimate" }); }
    else if (walkMinutes <= 5) { walkRate = 0.07; factors.push({ label: "車站距離", ratePercent: 7, note: `最近站徒步 ${walkMinutes} 分（近站）`, applied: false, basis: "estimate" }); }
    else if (walkMinutes <= 10) { walkRate = 0; factors.push({ label: "車站距離", ratePercent: 0, note: `最近站徒步 ${walkMinutes} 分（等同基準）`, applied: false, basis: "estimate" }); }
    else if (walkMinutes <= 15) { walkRate = -0.14; factors.push({ label: "車站距離", ratePercent: -14, note: `最近站徒步 ${walkMinutes} 分（略遠）`, applied: false, basis: "estimate" }); }
    else { walkRate = -0.30; factors.push({ label: "車站距離", ratePercent: -30, note: `最近站徒步 ${walkMinutes} 分（缺乏近站優勢）`, applied: false, basis: "estimate" }); }
  }

  // ── 3.5 交通樞紐與多線共構 ──
  // 除了最近站的步行時間，若本案在「熱門核心大站（如中野、新宿、澀谷等）」的步行圈內，
  // 或享有 2 站 3 路線以上的跨站選擇，具備顯著的通勤彈性與資產抗跌溢價。
  if (input.transitHub) {
    factors.push({
      label: "交通樞紐",
      ratePercent: input.transitHub.ratePercent,
      note: input.transitHub.note,
      applied: false,
      basis: "estimate",
    });
  }

  // ── 4. 樓層 ──
  //
  // 成交資料沒有階數欄位，改用市場調查值：一般公寓「每上升一層約 +0.5〜1.0%」，
  // 這裡取中間值 0.7%／層，並以該棟的中間樓層為基準（分桶中位數混合各樓層，
  // 重心接近中間樓層）。上下限各夾在 ±10%，避免超高層被單一係數放大。
  // 1 樓與地下另計固定折價（防犯、濕氣、採光），最上階另加稀少性溢價。
  let floorRate = 0;
  if (floor !== null) {
    if (floor <= 0) {
      floorRate = -0.08;
      factors.push({ label: "樓層", ratePercent: -8, note: "地下樓層（採光與濕氣條件受限）", applied: false, basis: "estimate" });
    } else if (floor === 1) {
      floorRate = -0.05;
      factors.push({ label: "樓層", ratePercent: -5, note: "1 樓（防犯與濕氣考量，日本市場普遍折價）", applied: false, basis: "estimate" });
    } else if (totalFloors !== null && totalFloors > 1) {
      const midFloor = (totalFloors + 1) / 2;
      const perFloor = 0.007;
      let rate = Math.max(-0.10, Math.min(0.10, (floor - midFloor) * perFloor));
      const isTop = floor >= totalFloors;
      if (isTop) rate = Math.min(0.13, rate + 0.03);
      floorRate = rate;
      const pct = Math.round(rate * 1000) / 10;
      factors.push({
        label: "樓層",
        ratePercent: pct,
        note: isTop
          ? `${floor} 樓／共 ${totalFloors} 樓（最上階，無樓上噪音與稀少性溢價）`
          : `${floor} 樓／共 ${totalFloors} 樓（以中間樓層為基準，每層約 0.7%）`,
        applied: false,
        basis: "estimate",
      });
    } else {
      // 沒有總樓層就無法判斷相對位置，只能確認「不是 1 樓或地下」。
      factors.push({ label: "樓層", ratePercent: 0, note: `${floor} 樓（缺總樓層，無法判斷相對高度）`, applied: false, basis: "estimate" });
    }
  }

  // ── 4.5 建物規模（塔樓）──
  // 樓層因素只反映「這一戶在樓內的位置」，但タワーマンション本身就是一個建物層級的
  // 溢價來源：結構規格、共用設施（門廳／健身房／管家）、地標性與稀少性。
  // 國交省分桶的中位單價把塔樓與一般低層公寓混在一起，不另外校準的話，
  // 塔樓一律會被判成「高於行情」。實測ファーストリアルタワー新宿（32 階建）
  // 只因 11F／32F 的位置比不高，就只拿到樓層 +2%，完全沒反映塔樓本身的價值。
  let towerRate = 0;
  if (totalFloors !== null && totalFloors >= 20) {
    towerRate = 0.08;
    factors.push({
      label: "建物規模",
      ratePercent: 8,
      note: `共 ${totalFloors} 層的塔式住宅（タワーマンション，設備規格與稀少性溢價）`,
      applied: false,
      basis: "estimate",
    });
  } else if (totalFloors !== null && totalFloors >= 15) {
    towerRate = 0.04;
    factors.push({
      label: "建物規模",
      ratePercent: 4,
      note: `共 ${totalFloors} 層的高層住宅`,
      applied: false,
      basis: "estimate",
    });
  }

  // ── 4.55 地段（町名）──
  // 同一個行政區裡，町與町的成交單價可以差到兩成以上（新宿区西新宿 vs 北新宿）。
  // 這個百分比在建快照時已控制屋齡與房型，代表的是地段本身而不是屋齡組成。
  if (input.townPremium) {
    const t = input.townPremium;
    const pct = Math.round(t.premiumPercent * 10) / 10;
    const isNeutral = Math.abs(pct) < 2;
    factors.push({
      label: "地段（町名）",
      ratePercent: pct,
      note: isNeutral
        ? `${t.town}在同區 ${t.townCount} 個町名中排第 ${t.rank} 名，成交單價等同全區平均水準（${pct >= 0 ? "+" : ""}${pct}%，${t.sampleCount} 筆成交）`
        : `${t.town}在同區 ${t.townCount} 個町名中排第 ${t.rank} 名，成交單價相對同區行情${pct >= 0 ? "高" : "低"} ${Math.abs(pct)}%（${t.sampleCount} 筆成交）`,
      applied: false,
      basis: "data",
    });
  }

  // ── 4.6 構造（SRC vs RC）──
  // 成交資料沒有階數，但有構造欄位。SRC 造與高層／塔式建物高度相關，
  // 是目前唯一能用實際成交資料反映「建物等級」的維度。
  // 這裡的百分比同樣已控制屋齡（未控制會得到 SRC 比較便宜的反向結果）。
  let structureRate = 0;
  const measuredStructure = input.conditionPremium?.structurePremiumPercent ?? null;
  if (measuredStructure !== null && /ＳＲＣ|SRC|鉄骨鉄筋|鉄骨[・･\s]*鉄筋|鋼骨鋼筋/i.test(input.structureText || "")) {
    const pct = Math.round(measuredStructure * 10) / 10;
    structureRate = pct / 100;
    factors.push({
      label: "建物構造",
      ratePercent: pct,
      note: `SRC造（鋼骨鋼筋混凝土）：同區同屋齡帶的 SRC 成交單價相對 RC ${pct >= 0 ? "高" : "低"} ${Math.abs(pct)}%`,
      applied: false,
      basis: "data",
    });
  }

  // ── 5. 翻新 ──
  let renoRate = 0;
  const reno = `${input.renovationNotes || ""}`.toLowerCase();
  // 這些樣式必須同時涵蓋日文與繁體中文：prompt 要求 renovationDetails
  // 「請翻譯為繁體中文」，所以這裡拿到的通常已經不是日文原文了。
  // 先前只寫日文關鍵字，實測ビューネ吉祥寺（整頁 RENOVATION PLAN、廚房浴室廁所
  // 洗面地板壁紙全換）只命中「浴室」「洗面」兩個中日共通詞，2 < 4 沒達門檻，
  // 翻新加成完全沒生效——而且畫面上不會顯示任何異常，是沉默失效。
  const renovationComponentCount = [
    /キッチン|廚房|厨房/,
    /浴室|ユニットバス/,
    /トイレ|廁所|洗手間/,
    /洗面/,
    /フローリング|フロアタイル|床.*貼替|木質地板|地板.*(?:重鋪|鋪設|更換|翻新)/,
    /クロス.*貼替|壁.*天井.*クロス|壁紙.*(?:重貼|更新|張替|重新)/,
    /給湯器|熱水器/,
    /建具|室內門|室内門/,
  ].filter(pattern => pattern.test(reno)).length;
  if (
    /リノベーション|リフォーム済|full renovation|フルリノベ|全面改装|内装(?:工事)?完成済/.test(reno)
    || /全面翻新|整體翻新|全室翻新|翻新完成|[內内]裝工事完成|裝修完成/.test(reno)
    || renovationComponentCount >= 4
  ) {
    // 翻新溢價與屋齡高度相關，固定 +5% 嚴重低估老屋翻新的價值。
    // 下列級距來自國交省成交資料的 Renovation 欄位（改装済み vs 未改装），
    // 東京 2025 年 15,978 筆、控制面積帶與屋齡帶後的實測中位數差：
    //   築 11-20 年：-0.9% ～ +7.7%（幾乎無差）
    //   築 21-30 年：+15.6% ～ +23.6%
    //   築 31-40 年：+37.5% ～ +41.3%
    // 取各屋齡帶的保守中間值。
    const measuredReno = input.conditionPremium?.renovationPremiumPercent ?? null;
    const renoPct = measuredReno !== null
      ? Math.round(measuredReno)
      : ageYears === null ? 8
        : ageYears <= 20 ? 4
        : ageYears <= 30 ? 18
        : 30;
    renoRate = renoPct / 100;
    factors.push({
      label: "翻新",
      ratePercent: renoPct,
      note: measuredReno !== null
        ? `圖紙標示已整體翻新／改裝（同區同屋齡帶的改裝済成交單價高出 ${renoPct}%）`
        : ageYears === null
          ? "圖紙標示已整體翻新／改裝"
          : `圖紙標示已整體翻新／改裝（築 ${ageYears} 年，屋齡越高翻新溢價越大）`,
      applied: false,
      basis: measuredReno !== null ? "data" : "estimate",
    });
  }

  // ── 5.1 角部屋（邊間住戶）──
  // 不動產流通推進中心（RETPC）《中古マンション価格査定マニュアル》手冊基準：角住戶 +3%～+5%；
  // 東京カンテイ百萬筆大數據實證：同棟大樓角部屋成交單價平均高出 +4.2%。
  if (input.unitFeatures?.isCornerUnit) {
    factors.push({
      label: "角部屋",
      ratePercent: 4,
      note: "角部屋（邊間住戶）：雙面採光通風佳、少一面鄰戶噪音干擾（不動產流通推進中心査定手冊基準 +3%～+5%，東京カンテイ實證溢價 +4.2%）",
      applied: false,
      basis: "estimate",
    });
  }

  // ── 5.2 陽台朝向（開口部方位）──
  // RETPC 査定手冊：南向/東南向 +3%～+5%，北向 -3%～-5%；
  // 東京カンテイ大數據：首都圈南北向公寓平均成交單價差 7%～9%。
  if (input.unitFeatures?.facingDirection) {
    const dir = input.unitFeatures.facingDirection;
    const zh = input.unitFeatures.facingDirectionZh || "南向";
    if (dir === "south" || dir === "southeast" || dir === "southwest") {
      factors.push({
        label: "陽台朝向",
        ratePercent: 3,
        note: `採光面朝向（${zh}）：日照時間長、冬暖夏涼受市場青睞（不動產流通推進中心査定手冊基準 +3%～+5%，東京カンテイ實證南北向價差 7%～9%）`,
        applied: false,
        basis: "estimate",
      });
    } else if (dir === "north" || dir === "northeast" || dir === "northwest") {
      factors.push({
        label: "陽台朝向",
        ratePercent: -3,
        note: `採光面朝向（${zh}）：冬季日照較短、採光受限（不動產流通推進中心査定手冊基準 -3%～-5%）`,
        applied: false,
        basis: "estimate",
      });
    }
  }

  // ── 5.3 專用露台 / 私人庭院 ──
  if (input.unitFeatures?.hasRoofBalcony) {
    factors.push({
      label: "專用露台",
      ratePercent: 5,
      note: "附設景觀露台（ルーフバルコニー）：具備私人戶外活動與開闊眺望空間，屬稀少性溢價配備（査定手冊基準 +3%～+5%）",
      applied: false,
      basis: "estimate",
    });
  } else if (input.unitFeatures?.hasPrivateGarden) {
    factors.push({
      label: "專用庭院",
      ratePercent: 3,
      note: "1 樓附設私人專用庭院（專用使用權加成，平衡低樓層之隱私考量）",
      applied: false,
      basis: "estimate",
    });
  }

  // ── 5.4 土地權利（借地權 vs 所有權）──
  // RETPC 査定手冊與市場慣例：借地權無土地所有權，折價約 -20%～-35%。
  if (input.unitFeatures?.isLeasehold) {
    const typeLabel = input.unitFeatures.leaseholdType || "借地權";
    factors.push({
      label: "土地權利",
      ratePercent: -25,
      note: `土地權利為${typeLabel}（非所有權）：每月需繳交地代、重建或讓渡需地主承諾名義書換料，市場折價約 -20%～-35%`,
      applied: false,
      basis: "estimate",
    });
    cautions.push(`本案土地權利為「${typeLabel}」，非完全所有權。買方須每月負擔地代，未來轉手承貸成數通常較所有權低 1～2 成，且借地期限屆滿或改建時需地主承諾，請務必詳閱重要事項說明書。`);
  }

  // ── 5.42 大樓管理體制（自主管理 vs 專業委託）──
  // 不動產流通推進中心査定手冊：「管理の良否」項目，全部委託日勤為基準，自主管理減點 -5%～-8%。
  const mgmtText = `${input.managementStyle || ""} ${input.managementCompany || ""} ${input.buildingNotes || ""}`;
  if (/自主管理/.test(mgmtText)) {
    factors.push({
      label: "管理體制",
      ratePercent: -5,
      note: "大樓為「自主管理」（無委託專業物業公司，住戶自行運作，銀行承貸嚴格且長期維護風險高，査定手冊折價約 -5%～-8%）",
      applied: false,
      basis: "estimate",
    });
  }

  // ── 5.44 電梯配置（3 樓以上無電梯）──
  // 不動產流通推進中心査定手冊：3 階以上エレベーター無住戶需逐層扣減使用效用比率。
  const isElevatorNone = /エレベーター無|EV無|無EV|エレベータ無/.test(input.buildingNotes || "");
  if (isElevatorNone && floor !== null && floor >= 3) {
    factors.push({
      label: "電梯配置",
      ratePercent: -6,
      note: `${floor} 樓且大樓未配置電梯（日常進出需爬梯，對長輩、重物不便，査定手冊折價約 -5%～-8%）`,
      applied: false,
      basis: "estimate",
    });
  }

  // ── 5.46 社區戶數規模（規模效應）──
  // 東京カンテイ實證統計：100 戶以上大規模社區公設與基金規模佳，保值溢價約 +3%；
  // 20 戶以下小規模社區每戶分攤修繕費沉重，市場折價約 -3%。
  if (input.totalUnits !== null && input.totalUnits !== undefined && input.totalUnits > 0) {
    if (input.totalUnits >= 100) {
      factors.push({
        label: "社區規模",
        ratePercent: 3,
        note: `總戶數 ${input.totalUnits} 戶之大規模社區（公設完備與長期修繕具規模經濟，東京カンテイ實證保值溢價約 +3%）`,
        applied: false,
        basis: "estimate",
      });
    } else if (input.totalUnits < 20) {
      factors.push({
        label: "社區規模",
        ratePercent: -3,
        note: `總戶數僅 ${input.totalUnits} 戶之小規模社區（每戶分攤外牆拉皮等重大修繕費用較沉重，市場折價約 -3%）`,
        applied: false,
        basis: "estimate",
      });
    }
  }

  // ── 5.48 寵物飼育（規約許可）──
  // 日本都會區約僅 35% 社區可飼養寵物，具流通稀少性優勢。
  if (/ペット飼育可|ペット可|ペット相談|小型犬/i.test(input.buildingNotes || "")) {
    factors.push({
      label: "寵物飼育",
      ratePercent: 2,
      note: "規約允許飼育寵物（都會區流通稀缺加分，轉手買盤與租客吸引力廣，市場溢價約 +2%）",
      applied: false,
      basis: "estimate",
    });
  }

  // ── 5.5 現況（帶租約 vs 空室）──
  // 國交省成交資料沒有「是否帶租約」這個欄位（實測 2024–2025 年東京 3 萬餘筆，
  // 只有 Use／Purpose 兩個用途欄位；以 Purpose≠住宅 當投資型買方的代理變數，
  // 控制行政區×面積帶×屋齡帶後價差中位數是 0.0%，證實它不是可用的代理）。
  // 所以這一項無法用成交資料回歸，幅度取業界慣例值。
  // 實價登錄的成交母體以「空室交屋、自住買方」為主，帶租約（オーナーチェンジ）物件
  // 本來就該比同一戶的空屋價低：買方無法自己入居、必須沿用現行租約與租金，
  // 融資多半只能走利率較高的投資用貸款，也不適用住宅ローン控除。
  // 反過來說，空室即入居可與翻新後販售的空屋，賣的正是自住買方的溢價。
  //
  // 折價幅度依房型分級，不用單一的 10%：
  // 業界慣例值是「約折 10%」（chiyodaku-mansion.net、musashi-corporation.com），
  // 但多個實務來源同時指出實際落差可到 20〜30%，且明講「ファミリータイプ比
  // ワンルーム 更難賣、折得更兇」（landnet.co.jp／fgh.co.jp）。
  // 理由在買方結構：1R・1K 的成交母體本來就以投資客為主，帶不帶租約的買方是同一群人，
  // 我們的比較基準（同區同房型的實價登錄中位數）本身就已經是投資盤的價格，
  // 再折 10% 等於重複扣一次；反之 2LDK 以上的母體以自住買方為主，
  // 帶租約會把買方限縮成投資客，折價才會拉到兩成上下。
  const occupancyDiscountByLayout: Record<LayoutCode, number> = {
    r1: -0.03, k1: -0.03, ldk1: -0.10, ldk2: -0.18, ldk3: -0.20,
  };
  let occupancyRate = 0;
  let incomeRate = 0;
  const occupancy = `${input.occupancyStatus || ""}`;
  const isTenanted = /賃貸中|オーナーチェンジ|賃借人|入居中|集金代行|サブリース/.test(occupancy);
  const isVacant = /空室|空家|空き|即入居|即引渡/.test(occupancy);
  if (isTenanted) {
    // 收益還原優先：帶租約的買方是投資客，出價來自「年租金 ÷ 市場表面利回り」。
    // 圖紙有現行租金時直接算得出來，比任何固定折價成數都貼近實情——
    // 租金比行情低一成，收益還原價就低一成，而固定成數看不出這件事。
    //
    // 市場表面利回り 一律用「At Home 同區同房型租金 ÷ At Home 同區同房型在售價」。
    // 兩邊同一個來源、同一套房型定義、都是刊登側資料，母體才對得起來。
    // （試過用「At Home 租金 ÷ 實價登錄成交價」，新宿區 1K 會算出 5.35%：
    //  租金中位描述的是較新較大的物件、成交中位卻是 20㎡ 的老投資盤，兩者不是同一批東西。
    //  同樣地也不能拿租金中位除以成交面積中位去比每㎡租金，會高估三成以上。）
    const income = input.tenantedIncome;
    const marketYield = income?.marketGrossYieldRate ?? null;
    const yieldUsable = marketYield !== null && marketYield >= 0.025 && marketYield <= 0.12;
    let incomeApplied = false;
    if (income && yieldUsable && income.monthlyRentYen > 0 && areaBaseline > 0) {
      const capitalizedYen = (income.monthlyRentYen * 12) / marketYield!;
      const raw = capitalizedYen / areaBaseline - 1;
      // 圖紙的租金欄偶爾會把年額寫進月租欄；夾在 ±25% 讓單一筆誤讀不會毀掉結論。
      incomeRate = Math.max(-0.25, Math.min(0.25, raw));
      incomeApplied = true;
      const subjectYield = (income.monthlyRentYen * 12) / salePriceYen;
      factors.push({
        label: "租約收益",
        ratePercent: Math.round(incomeRate * 1000) / 10,
        note: `現行租金 ${Math.round(income.monthlyRentYen).toLocaleString("ja-JP")} 円／月（本案開價的表面利回 ${
          (subjectYield * 100).toFixed(2)
        }%）。以同區同房型市場表面利回 ${(marketYield! * 100).toFixed(2)}% 收益還原，價值約 ${
          Math.round(capitalizedYen / 10000).toLocaleString()
        } 萬円`,
        applied: true,
        basis: "data",
      });
      if (Math.abs(raw) > 0.25) {
        cautions.push(
          `以現行租金收益還原的價值與成交基準相差 ${Math.round(Math.abs(raw) * 100)}%，已在估價中以 25% 為上限計入。` +
          `租金明顯${raw > 0 ? "高於" : "低於"}行情時，退租後的收益會${raw > 0 ? "下降" : "回升"}，請確認租約剩餘期間與退租後的預估租金。`
        );
      }
    }

    // 沒有租金可算時才退回依房型分級的固定折價：
    // 業界慣例值是「約折 10%」（chiyodaku-mansion.net、musashi-corporation.com），
    // 但多個實務來源同時指出實際落差可到 20〜30%，且明講「ファミリータイプ比
    // ワンルーム 更難賣、折得更兇」（landnet.co.jp／fgh.co.jp）。
    // 理由在買方結構：1R・1K 的成交母體本來就以投資客為主，帶不帶租約的買方是同一群人，
    // 比較基準（同區同房型的實價登錄中位數）本身就已經是投資盤的價格，再折 10% 是重複扣；
    // 2LDK 以上的母體以自住買方為主，帶租約把買方限縮成投資客，折價才會拉到兩成上下。
    occupancyRate = incomeApplied ? 0 : (occupancyDiscountByLayout[layout] ?? -0.10);
    const familyType = layout === "ldk2" || layout === "ldk3";
    const investorType = layout === "r1" || layout === "k1";
    factors.push({
      label: "現況",
      ratePercent: incomeApplied ? 0 : Math.round(occupancyRate * 1000) / 10,
      note: incomeApplied
        ? "帶租約（オーナーチェンジ）：買方無法自住入居、須承接現行租約，且多需投資用貸款、不適用住宅ローン控除。本案有現行租金，已改用上方的收益還原直接估算，不再另外套用固定折價成數"
        : `帶租約（オーナーチェンジ）：買方無法自住入居、須承接現行租約，且多需投資用貸款、不適用住宅ローン控除${
            familyType
              ? "。此房型的成交母體以自住買方為主，帶租約會把買方限縮成投資客，折價幅度明顯較大"
              : investorType
                ? "。此房型的成交母體本來就以投資買方為主，與比較基準的買方結構接近，折價幅度較小"
                : ""
          }`,
      applied: !incomeApplied,
      basis: "estimate",
    });
    cautions.push("帶租約物件的價格主要由現行租金與收益率決定，與空屋自住行情不同口徑。除了本頁的成交比對，請一併確認現行租約的租金水準、剩餘期間與退租後的預估租金。");
  } else if (isVacant) {
    factors.push({ label: "現況", ratePercent: 0, note: "空室即引渡（與實價登錄成交母體的主流口徑相同，不另外加減）", applied: true, basis: "estimate" });
  }

  // 預期價只用「資料算得出來的部分」：同區同房型同屋齡帶的成交㎡單價 × 本案面積，
  // 再乘上會改變比較口徑的修正（目前只有帶租約）。
  //
  // 徒步、樓層、翻新這些不乘進去：它們的百分比是業界經驗值不是回歸結果，
  // 而且比較基準本身就混合了各種徒步距離與樓層，再乘一次是重複計算。
  // 實測日本橋横山町一案，加了係數後預期價 10,196 萬（開價低 21.5%），
  // 只用資料是 8,790 萬（開價低 9%），而 At Home 同區同房型的公開開價平均
  // 8,320 萬（開價低 3.8%）——兩條獨立的資料路徑彼此接近，加了係數的版本明顯偏離。
  // 兩項相乘而不是相加：買方結構的折價與租金水準的折價作用在不同的基準上。
  const appliedRate = Math.max(-0.4, Math.min(0.5, (1 + occupancyRate) * (1 + incomeRate) - 1));
  const expectedPriceYen = areaBaseline * (1 + appliedRate);

  // 面積校準過的預期價較可信，容許區間可以收窄；沒校準時放寬，
  // 否則等於用一個本來就不精準的基準去做精準的指控。
  // 樣本少的分桶，中位數本身就不穩定（快照的採計下限只有 5 筆）。
  // 這種情況要放寬容許區間——否則等於拿一個抖動很大的基準去做精確的指控，
  // 讓使用者誤以為結論的可信度跟樣本充足的地區一樣高。
  const sampleCount = input.sampleCount ?? null;
  const samplePenalty = sampleCount === null ? 0.03 : sampleCount >= 30 ? 0 : sampleCount >= 15 ? 0.03 : 0.06;
  if (sampleCount !== null && sampleCount < 15) {
    cautions.push(`同條件成交樣本僅 ${sampleCount} 筆，中位數易受個別物件影響，建議對照實際在售物件。`);
  }
  const tolerance = (areaAdjusted ? 0.15 : 0.22) + samplePenalty;
  const fairLow = expectedPriceYen * (1 - tolerance);
  const fairHigh = expectedPriceYen * (1 + tolerance);

  const diffPercent = Math.round(((salePriceYen - expectedPriceYen) / expectedPriceYen) * 1000) / 10;
  const rawDiffPercent = Math.round(((salePriceYen - medianPriceYen) / medianPriceYen) * 1000) / 10;

  // ── 6. 公開販售市場第二基準（同規模在售行情） ──
  const listingBenchmark = input.listingBenchmark ?? null;
  const listingPremiumRate = listingBenchmark?.kind === "reins_ratio"
    ? reinsNewListingPremiumRate(listingBenchmark)
    : null;

  let typicalListingPriceYen: number | null = null;
  let typicalListingPriceLowYen: number | null = null;
  let typicalListingPriceHighYen: number | null = null;
  let listingRangeLabel: string | null = null;

  if (listingBenchmark?.kind === "public_listing_average") {
    const rawAvgYen = listingBenchmark.averageListingPriceYen;
    if (areaAdjusted && areaSqm !== null && areaSqm > 0) {
      // 依本案專有面積與屋齡校準在售開價行情：
      // 1. 取得該房型在該區的代表面積（優先採用國交省成交中位面積，無則採用房型面積帶中點）
      const refAreaSqm = (input.medianAreaSqm && input.medianAreaSqm > 0)
        ? input.medianAreaSqm
        : layoutBandMidArea(layout);

      // 2. 換算 At Home 每㎡刊登開價，並依本案實際面積換算總價
      const askingSqmPrice = rawAvgYen / refAreaSqm;
      let calibratedAskYen = askingSqmPrice * areaSqm;

      // 3. 若有同屋齡帶成交單價，按屋齡相對大盤的價格比率微調
      if (input.ageControlledByMarket && input.medianSqmPriceYen && input.medianSqmPriceYen > 0) {
        const overallSqmPrice = (input.medianPriceYen && refAreaSqm > 0)
          ? (input.medianPriceYen / refAreaSqm)
          : null;
        if (overallSqmPrice && overallSqmPrice > 0) {
          const ageRatio = Math.max(0.7, Math.min(1.4, input.medianSqmPriceYen / overallSqmPrice));
          calibratedAskYen *= ageRatio;
        }
      }

      // 4. 上限：都會區新規開價常態溢價率（賣方開價通常較成交基準高出約 18% 作為議價與利潤空間）
      const askCeilingYen = expectedPriceYen * 1.18;

      typicalListingPriceLowYen = Math.round(Math.min(calibratedAskYen, askCeilingYen));
      typicalListingPriceHighYen = Math.round(Math.max(calibratedAskYen, askCeilingYen));
      typicalListingPriceYen = Math.round((typicalListingPriceLowYen + typicalListingPriceHighYen) / 2);
      listingRangeLabel = `${man(typicalListingPriceLowYen)}～${man(typicalListingPriceHighYen)}`;
    } else {
      typicalListingPriceYen = rawAvgYen;
      typicalListingPriceLowYen = Math.round(rawAvgYen * 0.95);
      typicalListingPriceHighYen = Math.round(rawAvgYen * 1.05);
      listingRangeLabel = `${man(typicalListingPriceLowYen)}～${man(typicalListingPriceHighYen)}`;
    }
  } else if (listingBenchmark?.kind === "reins_ratio" && listingPremiumRate !== null) {
    typicalListingPriceYen = expectedPriceYen * (1 + listingPremiumRate);
    typicalListingPriceLowYen = Math.round(expectedPriceYen * (1 + listingPremiumRate * 0.85));
    typicalListingPriceHighYen = Math.round(expectedPriceYen * (1 + listingPremiumRate * 1.15));
    listingRangeLabel = `${man(typicalListingPriceLowYen)}～${man(typicalListingPriceHighYen)}`;
  }

  const listingDiffPercent = typicalListingPriceYen === null
    ? null
    : Math.round(((salePriceYen - typicalListingPriceYen) / typicalListingPriceYen) * 1000) / 10;
  const listingVerdict = listingDiffPercent === null
    ? null
    : listingDiffPercent < -10
      ? "below" as const
      : listingDiffPercent > 10
        ? "above" as const
        : "typical" as const;
  const listingVerdictText = listingVerdict === "below"
    ? "低於市場在售行情"
    : listingVerdict === "above"
      ? "高於市場在售行情"
      : listingVerdict === "typical"
        ? "落在市場在售區間"
        : null;

  const toMan = (v: number) => Math.round(v / 10000);
  const factorSummary = factors.length
    ? factors.map(f => `${f.label} ${f.ratePercent >= 0 ? "+" : ""}${f.ratePercent}%`).join("、")
    : "圖紙未讀到可校準的條件";

  let verdict: "bargain" | "fair" | "premium";
  let verdictText: string;
  let explanation: string;

  const points: string[] = [];
  const insightPoints: SalePriceInsightPoint[] = [];

  // 1. 行情落點與合理區間
  const areaCalcPhrase = areaAdjusted && areaSqm !== null
    ? `按本案實際面積（${areaSqm}㎡）換算`
    : "以該房型中位數為基準";

  if (salePriceYen < fairLow) {
    verdict = "bargain";
    verdictText = "低於市場客觀試算區間";
    const content = `同區同房型的合理成交區間 ${man(fairLow)}～${man(fairHigh)}（基準 ${man(expectedPriceYen)}）。本案開價 ${man(salePriceYen)}，低於區間 ${Math.abs(diffPercent)}%。`;
    insightPoints.push({
      id: "verdict",
            tag: "行情落點",
      title: "開價低於市場客觀試算區間",
      content,
      type: "verdict",
    });
    points.push(`• 【實價行情落點】：${content}`);
  } else if (salePriceYen <= fairHigh) {
    verdict = "fair";
    verdictText = "落在市場客觀試算區間";
    const content = `同區同房型的合理成交區間 ${man(fairLow)}～${man(fairHigh)}（基準 ${man(expectedPriceYen)}）。本案開價 ${man(salePriceYen)}，落在區間內。`;
    insightPoints.push({
      id: "verdict",
            tag: "行情落點",
      title: "開價落在市場客觀試算區間",
      content,
      type: "verdict",
    });
    points.push(`• 【實價行情落點】：${content}`);
  } else {
    verdict = "premium";
    verdictText = "高於市場客觀試算區間";
    const content = `同區同房型的合理成交區間 ${man(fairLow)}～${man(fairHigh)}（基準 ${man(expectedPriceYen)}）。本案開價 ${man(salePriceYen)}，高出 ${diffPercent}%。此差距已扣除屋齡、車站與樓層的合理溢價。`;
    insightPoints.push({
      id: "verdict",
            tag: "行情落點",
      title: "開價高於市場客觀試算區間",
      content,
      type: "verdict",
    });
    points.push(`• 【實價行情落點】：${content}`);
  }

  // 2. 條件加權與溢價拆解
  if (factors.length > 0) {
    const factorContent = `已計入：${factorSummary}。${diffPercent > 0 ? "上述價差是扣除這些條件後的結果。" : ""}`.trim();
    insightPoints.push({
      id: "factor",
            tag: "條件加權",
      title: "",
      content: factorContent,
      type: "factor",
    });
    points.push(
      diffPercent > 0
        ? `• 【條件溢價拆解】：${factorContent}`
        : `• 【條件優勢對應】：${factorContent}`
    );
  }

  // 3. 市面公開刊登對照
  if (listingBenchmark?.kind === "public_listing_average" && typicalListingPriceYen !== null && listingDiffPercent !== null) {
    const rangeText = (typicalListingPriceLowYen && typicalListingPriceHighYen && typicalListingPriceLowYen !== typicalListingPriceHighYen)
      ? `（區間約 ${man(typicalListingPriceLowYen)}～${man(typicalListingPriceHighYen)}）`
      : "";
    const ceilingDiff = typicalListingPriceHighYen && salePriceYen > typicalListingPriceHighYen
      ? `，高於區間上限約 ${Math.round(((salePriceYen - typicalListingPriceHighYen) / typicalListingPriceHighYen) * 1000) / 10}%`
      : "";
    const content = `${listingBenchmark.scopeLabel}在售同規模行情約 ${man(typicalListingPriceYen)}${rangeText}，本案相對中位${listingDiffPercent >= 0 ? "高" : "低"} ${Math.abs(listingDiffPercent)}%${ceilingDiff}。基準已按本案面積與條件校準，刊登價非成交價，僅供參考。`;
    insightPoints.push({
      id: "market",
      tag: "在售對照",
      title: `在售同規模行情：約 ${man(typicalListingPriceYen)}${rangeText}`,
      content,
      type: "market",
    });
    points.push(`• 【市面刊登對照】：${content}`);
  } else if (listingBenchmark?.kind === "reins_ratio" && typicalListingPriceYen !== null && listingDiffPercent !== null) {
    const premiumPercent = Math.round(listingPremiumRate! * 1000) / 10;
    const discountPercent = Math.round(reinsImpliedDiscountFromListingRate(listingBenchmark) * 1000) / 10;
    const rangeText = (typicalListingPriceLowYen && typicalListingPriceHighYen)
      ? `（區間約 ${man(typicalListingPriceLowYen)}～${man(typicalListingPriceHighYen)}）`
      : "";
    const content = `${listingBenchmark.market}新規開價㎡單價高於成約 ${premiumPercent}%，換算典型開價約 ${man(typicalListingPriceYen)}${rangeText}，本案${listingDiffPercent >= 0 ? "高" : "低"} ${Math.abs(listingDiffPercent)}%。此為市場平均差距，不代表本案可議相同幅度。`;
    insightPoints.push({
      id: "market",
      tag: "在售對照",
      title: `REINS 市場新規開價基準：約 ${man(typicalListingPriceYen)}${rangeText}`,
      content,
      type: "market",
    });
    points.push(`• 【市面刊登對照】：${content}`);
  } else {
    const content = "此地區沒有同口徑的在售統計，僅呈現官方成交行情。";
    insightPoints.push({
      id: "market",
      tag: "在售對照",
      title: "在售對照",
      content,
      type: "market",
    });
    points.push(`• 【市面刊登對照】：${content}`);
  }

  const positiveFactorsSumPercent = Math.round(
    factors.filter(f => f.ratePercent > 0).reduce((sum, f) => sum + f.ratePercent, 0) * 10
  ) / 10;
  const netFactorsSumPercent = Math.round(
    factors.reduce((sum, f) => sum + f.ratePercent, 0) * 10
  ) / 10;

  if (factors.length > 0 && positiveFactorsSumPercent > 0) {
    let factorsEvaluationText = "";
    if (diffPercent > 0) {
      if (Math.abs(diffPercent - positiveFactorsSumPercent) <= 10) {
        factorsEvaluationText = `本案個別優勢條件（如翻新、站距、樓層、角部屋、朝向等）加總影響幅度達 +${positiveFactorsSumPercent}%，與賣方開價相對同區同屋齡基準的溢價幅度（高於基準 ${diffPercent}%）高度吻合。這代表賣方開價具備客觀條件支撐，非隨意開高。`;
      } else if (diffPercent > positiveFactorsSumPercent + 15) {
        factorsEvaluationText = `本案各項優勢條件加總幅度為 +${positiveFactorsSumPercent}%，但賣方開價高於同區同屋齡基準 ${diffPercent}%（超出客觀優勢支撐約 ${Math.round((diffPercent - positiveFactorsSumPercent) * 10) / 10}%）。開價有測試市場水溫傾向，建議保留議價空間。`;
      } else {
        factorsEvaluationText = `本案優勢條件加總幅度為 +${positiveFactorsSumPercent}%，賣方開價高於同區同屋齡基準 ${diffPercent}%，各項優勢可充分支撐開價落點。`;
      }
    } else {
      factorsEvaluationText = `本案開價低於同區同屋齡基準 ${Math.abs(diffPercent)}%（本案條件加總淨值為 ${netFactorsSumPercent >= 0 ? "+" : ""}${netFactorsSumPercent}%），${
        renoRate > 0
          ? "且已包含室內翻新加成，開價具備讓利優勢與性價比。"
          : ageYears && ageYears >= 30
            ? "主要反映未整體翻新之屋況折讓，留出預算空間供買方自行裝修。"
            : "開價具備價格優勢。"
      }`;
    }

    insightPoints.push({
      id: "factors_sum",
      tag: "條件累計分析",
      title: `優勢條件累計 +${positiveFactorsSumPercent}% vs 開價落點（${diffPercent >= 0 ? `高於基準 ${diffPercent}%` : `低於基準 ${Math.abs(diffPercent)}%`}）`,
      content: factorsEvaluationText,
      type: "advice",
    });
    points.push(`• 【條件累計與開價分析】：${factorsEvaluationText}`);
  }

  explanation = points.join("\n\n");

  return {
    verdict,
    verdictText,
    explanation,
    insightPoints,
    diffPercent,
    rawDiffPercent,
    expectedPriceMan: toMan(expectedPriceYen),
    areaBaselineMan: toMan(areaBaseline),
    fairLowMan: toMan(fairLow),
    fairHighMan: toMan(fairHigh),
    typicalListingPriceMan: typicalListingPriceYen === null ? null : toMan(typicalListingPriceYen),
    typicalListingPriceLowMan: typicalListingPriceLowYen === null ? null : toMan(typicalListingPriceLowYen),
    typicalListingPriceHighMan: typicalListingPriceHighYen === null ? null : toMan(typicalListingPriceHighYen),
    listingRangeLabel,
    listingDiffPercent,
    listingVerdict,
    listingVerdictText,
    listingPremiumRatePercent: listingPremiumRate === null ? null : Math.round(listingPremiumRate * 1000) / 10,
    impliedDiscountFromListingPercent: listingBenchmark?.kind === "reins_ratio"
      ? Math.round(reinsImpliedDiscountFromListingRate(listingBenchmark) * 1000) / 10
      : null,
    listingBenchmarkPeriod: listingBenchmark?.period ?? null,
    listingBenchmarkSourceUrl: listingBenchmark?.sourceUrl ?? null,
    listingBenchmarkSourceLabel: listingBenchmark?.sourceLabel ?? null,
    listingBenchmarkKind: listingBenchmark?.kind ?? null,
    listingBenchmarkScopeLabel: listingBenchmark?.scopeLabel ?? null,
    areaAdjusted,
    areaBasisNote,
    baselineNote: ageHandledInBaseline && ageYears !== null
      ? input.ageBandScope === "area"
        ? `比較基準已鎖定同屋齡帶：本案築 ${ageYears} 年。該房型的同屋齡帶成交樣本不足，改採同區、同屋齡帶中「面積相近」房型的成交㎡單價，屋齡不再另外加權。`
        : input.ageBandScope === "adjacent_age"
          ? `本案築 ${ageYears} 年，該屋齡帶成交樣本不足，改採同區、同房型的相鄰屋齡帶成交㎡單價，屋齡不再另外加權。`
          : input.ageBandScope === "district"
            ? `比較基準已鎖定同屋齡帶：本案築 ${ageYears} 年。該房型的同屋齡帶成交樣本不足，改採同區、同屋齡帶但合併各房型的成交㎡單價，屋齡不再另外加權；房型差異未另外校準。`
            : `比較基準已鎖定同屋齡帶：本案築 ${ageYears} 年，採用同區、同房型、同屋齡帶的實際成交㎡單價，屋齡不再另外加權。`
      : ageYears !== null
        ? `該區該房型缺少同屋齡帶的足量成交樣本，屋齡改以市場行情推估，僅供參考。`
        : "圖紙未讀到築年，無法就屋齡調整比較基準。",
    ageHandledInBaseline,
    factors,
    positiveFactorsSumPercent,
    netFactorsSumPercent,
    cautions,
  };
}

export function buildListingPriceVerdict(
  totalMonthlyCost: number,
  range: RequestedRentRange | null,
  context?: ListingPriceVerdictContext
): ListingPriceVerdict {
  if (!range) {
    return {
      status: "待確認",
      headline: "查無這個地區與房型的行情資料，無法判斷這個價格合不合理。",
      detail: "可能是圖紙上的車站無法辨識，或這個房型在行情資料庫中樣本不足。",
    };
  }

  const allNotes = `${context?.specialNotes || ""} ${context?.otherConditions || ""} ${context?.freeRent || ""} ${context?.facilities || ""}`.toLowerCase();
  const hasFreeInternet = /インターネット無料|ネット無料|wifi無料|シーファイブ|高速ネット無料|光ネット無料/.test(allNotes);
  const hasAutoLock = /オートロック|自動ロック/.test(allNotes);
  const hasSeparateBathToilet = /バス・トイレ別|バストイレ別|ｂｔ別|風呂トイレ別/.test(allNotes);
  const hasIndependentWashbasin = /独立洗面|洗面化粧台|洗面所独立/.test(allNotes);
  const hasBathroomDryer = /浴室乾燥|浴室暖房/.test(allNotes);
  const hasDeliveryBox = /宅配box|宅配ボックス|宅配ロッカー|宅配ｂｏｘ/.test(allNotes);
  const rawStructure = `${context?.structure || ""}`
    .replace(/[Ａ-Ｚａ-ｚ]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
    .toLowerCase();
  const isSRC = /src|鉄骨鉄筋|鋼骨鋼筋/.test(rawStructure);
  const isRC = !isSRC && /rc|鉄筋コンクリート|鋼筋/.test(rawStructure);
  const isWooden = /木造|軽量鉄骨|軽鉄|木造アパート/.test(rawStructure);

  // 1. 網路實質價值折抵（日本申辦個人光纖網路每月通常約 ¥4,000 ~ ¥5,000 円）
  const internetMonthlyValue = hasFreeInternet ? 4500 : 0;
  const effectiveMonthlyCost = Math.max(0, totalMonthlyCost - internetMonthlyValue);

  // 2. 屋齡優勢／折價量化（基準為市場平均庫存 20~25 年中古水準）
  let agePremiumRate = 0;
  let ageText: string | null = null;
  const ageYears = context?.ageYears;
  if (ageYears !== null && ageYears !== undefined) {
    if (ageYears <= 3) {
      agePremiumRate = 0.18;
      ageText = `屋齡 ${ageYears} 年（新築）`;
    } else if (ageYears <= 5) {
      agePremiumRate = 0.12;
      ageText = `屋齡 ${ageYears} 年（淺築新古屋）`;
    } else if (ageYears <= 10) {
      agePremiumRate = 0.06;
      ageText = `屋齡 ${ageYears} 年（淺築）`;
    } else if (ageYears <= 20) {
      agePremiumRate = 0;
      ageText = `屋齡 ${ageYears} 年（標準中古水準）`;
    } else if (ageYears <= 30) {
      agePremiumRate = -0.06;
      ageText = `屋齡 ${ageYears} 年（略為陳舊）`;
    } else {
      agePremiumRate = -0.15;
      ageText = `屋齡 ${ageYears} 年（築古）`;
    }
  }

  // 3. 徒步距離優勢／折價量化（基準為徒歩 8~10 分）
  let walkPremiumRate = 0;
  let walkText: string | null = null;
  const walkMinutes = context?.walkMinutes;
  if (walkMinutes !== null && walkMinutes !== undefined) {
    if (walkMinutes <= 3) {
      walkPremiumRate = 0.10;
      walkText = `車站徒步 ${walkMinutes} 分（超近站）`;
    } else if (walkMinutes <= 7) {
      walkPremiumRate = 0.05;
      walkText = `車站徒步 ${walkMinutes} 分`;
    } else if (walkMinutes <= 10) {
      walkPremiumRate = 0;
      walkText = `車站徒步 ${walkMinutes} 分`;
    } else if (walkMinutes <= 15) {
      walkPremiumRate = -0.05;
      walkText = `車站徒步 ${walkMinutes} 分（步行稍遠）`;
    } else {
      walkPremiumRate = -0.12;
      walkText = `車站徒步 ${walkMinutes} 分（步行較遠）`;
    }
  }

  // 4. 專有面積空間加成（依房型基準判定）
  let areaPremiumRate = 0;
  let areaText: string | null = null;
  const areaSqm = context?.areaSqm;
  const roomType = context?.roomType;
  if (areaSqm !== null && areaSqm !== undefined) {
    if (roomType === "ldk1") {
      if (areaSqm >= 45) {
        areaPremiumRate = 0.10;
        areaText = `專有面積 ${areaSqm}㎡（超大 1LDK，兼具起居與大收納空間）`;
      } else if (areaSqm >= 40) {
        areaPremiumRate = 0.06;
        areaText = `專有面積 ${areaSqm}㎡（寬敞 1LDK，高於平均 32㎡）`;
      } else if (areaSqm >= 35) {
        areaPremiumRate = 0.035;
        areaText = `專有面積 ${areaSqm}㎡（空間充裕，起居動線舒暢）`;
      } else if (areaSqm < 28) {
        areaPremiumRate = -0.05;
        areaText = `專有面積 ${areaSqm}㎡（緊湊型 1LDK/1DK）`;
      }
    } else if (roomType === "ldk2") {
      if (areaSqm >= 60) {
        areaPremiumRate = 0.10;
        areaText = `專有面積 ${areaSqm}㎡（寬敞 2LDK，遠高於家庭型平均 48㎡）`;
      } else if (areaSqm >= 50) {
        areaPremiumRate = 0.05;
        areaText = `專有面積 ${areaSqm}㎡（空間充裕，雙臥室與客餐廳動線獨立）`;
      } else if (areaSqm < 42) {
        areaPremiumRate = -0.06;
        areaText = `專有面積 ${areaSqm}㎡（緊湊型 2LDK/2DK）`;
      }
    } else if (roomType === "ldk3") {
      if (areaSqm >= 80) {
        areaPremiumRate = 0.10;
        areaText = `專有面積 ${areaSqm}㎡（大坪數三房家庭宅，高於平均 68㎡）`;
      } else if (areaSqm >= 70) {
        areaPremiumRate = 0.04;
        areaText = `專有面積 ${areaSqm}㎡（空間充裕，家庭生活動線舒適）`;
      } else if (areaSqm < 60) {
        areaPremiumRate = -0.06;
        areaText = `專有面積 ${areaSqm}㎡（緊湊型 3LDK）`;
      }
    } else {
      // 1R, 1K 或通用單身基準（平均約 18~20㎡）
      if (areaSqm >= 30) {
        areaPremiumRate = 0.10;
        areaText = `專有面積 ${areaSqm}㎡（超寬敞套房，遠高於單身平均 18㎡）`;
      } else if (areaSqm >= 25) {
        areaPremiumRate = 0.06;
        areaText = `專有面積 ${areaSqm}㎡（寬敞大套房，高於單身平均 18㎡）`;
      } else if (areaSqm >= 20) {
        areaPremiumRate = 0.03;
        areaText = `專有面積 ${areaSqm}㎡（空間充裕，居住動線寬敞）`;
      } else if (areaSqm < 16) {
        areaPremiumRate = -0.06;
        areaText = `專有面積 ${areaSqm}㎡（空間緊湊，精簡型套房）`;
      }
    }
  }

  // 5. 樓層高低與景觀防盜折溢價
  let floorPremiumRate = 0;
  const floor = context?.floor;
  const totalFloors = context?.totalFloors;
  const isTopFloor = floor !== null && floor !== undefined && totalFloors !== null && totalFloors !== undefined && floor >= totalFloors && totalFloors >= 3;
  const isFirstFloor = floor === 1;
  const isUpperFloor = floor !== null && floor !== undefined && floor >= 2 && !isTopFloor;
  const noElevatorHighFloor = floor !== null && floor !== undefined && floor >= 4 && /エレベーター無|ev無|階段のみ/.test(allNotes);

  if (isTopFloor) {
    floorPremiumRate += 0.04;
  } else if (isUpperFloor) {
    floorPremiumRate += 0.02;
  } else if (isFirstFloor) {
    floorPremiumRate -= 0.035;
  }
  if (noElevatorHighFloor) {
    floorPremiumRate -= 0.05;
  }

  // 6. 裝潢翻新
  const hasRenovation = /リノベ|リノベーション|改装済み|全面改装|リフォーム済/.test(allNotes);
  const renovationRate = hasRenovation ? 0.06 : 0;

  // 7. 結構與設備附加價值
  const structureRate = isSRC ? 0.025 : isRC ? 0.02 : isWooden ? -0.10 : 0;

  let amenitiesRate = 0;
  const amenitiesList: string[] = [];
  if (hasSeparateBathToilet) {
    amenitiesRate += 0.035;
    amenitiesList.push("乾濕分離");
  }
  if (hasIndependentWashbasin) {
    amenitiesRate += 0.03;
    amenitiesList.push("獨立洗面台");
  }
  if (hasAutoLock) {
    amenitiesRate += 0.025;
    amenitiesList.push("防盜自動門鎖");
  }
  if (hasDeliveryBox) {
    amenitiesList.push("宅配箱");
  }
  if (hasBathroomDryer) {
    amenitiesList.push("浴室暖風乾燥機");
  }
  const internetText = hasFreeInternet ? "附免費光纖網路" : null;

  // 綜合調整後的合理上限
  const totalJustifiedPremiumRate = agePremiumRate + walkPremiumRate + areaPremiumRate + floorPremiumRate + structureRate + renovationRate + amenitiesRate;
  const adjustedHigh = Math.round(range.high * (1 + Math.max(0, totalJustifiedPremiumRate)));

  // 整理租賃規格加減因子清單（供前端對照拆解卡使用）
  const factors: RentalPriceFactor[] = [];

  // 專有面積
  if (areaPremiumRate !== 0 && areaSqm) {
    factors.push({
      label: areaPremiumRate > 0 ? "專有空間加成" : "室內空間緊湊",
      ratePercent: Number((areaPremiumRate * 100).toFixed(1)),
      note: areaText || (areaPremiumRate > 0
        ? `專有面積 ${areaSqm}㎡（高於同房型平均規格）`
        : `專有面積 ${areaSqm}㎡（空間緊湊精簡，居住動線精緻）`),
      level: Math.abs(areaPremiumRate) >= 0.08 ? 4 : 2,
      category: "space",
    });
  }

  // 車站徒步距離
  if (walkPremiumRate !== 0 && walkMinutes) {
    factors.push({
      label: walkPremiumRate > 0 ? "近站交通優勢" : "車站徒步腳程稍長",
      ratePercent: Number((walkPremiumRate * 100).toFixed(1)),
      note: walkPremiumRate > 0
        ? `車站徒步 ${walkMinutes} 分，日常通勤時間與負擔大幅降低`
        : `車站徒步 ${walkMinutes} 分，腳程稍長，租金反映折讓換取生活空間`,
      level: Math.abs(walkPremiumRate) >= 0.10 ? 5 : 3,
      category: "location",
    });
  }

  // 屋齡新舊
  if (agePremiumRate !== 0 && ageYears !== null && ageYears !== undefined) {
    factors.push({
      label: agePremiumRate > 0 ? (ageYears <= 3 ? "新築完工成屋" : "淺築新古屋") : "屋齡築古折讓",
      ratePercent: Number((agePremiumRate * 100).toFixed(1)),
      note: agePremiumRate > 0
        ? `屋齡僅 ${ageYears} 年，建築外觀與設備維持頂尖健康水準`
        : `屋齡 ${ageYears} 年（築古中古），管線與公設具歲月痕跡，租金具讓利優勢`,
      level: Math.abs(agePremiumRate) >= 0.12 ? 5 : 3,
      category: "age",
    });
  }

  // 樓層條件
  if (isTopFloor && floor && totalFloors) {
    factors.push({
      label: "最上階景觀視野",
      ratePercent: 4.0,
      note: `位於頂樓（${floor}F/${totalFloors}F），無樓上腳步噪音且通風採光佳`,
      level: 3,
      category: "floor",
    });
  } else if (isUpperFloor && floor) {
    factors.push({
      label: "位於 2 樓以上",
      ratePercent: 2.0,
      note: `房間位於 ${floor} 樓，排除一樓潮濕與防盜顧慮之主流樓層`,
      level: 1,
      category: "floor",
    });
  } else if (isFirstFloor) {
    factors.push({
      label: "房間位於一樓",
      ratePercent: -3.5,
      note: "一樓多有隱私與防盜考量，市場租金普遍折讓約 3,000 円/月",
      level: 2,
      category: "floor",
    });
  }

  if (noElevatorHighFloor && floor) {
    factors.push({
      label: "高樓層無電梯",
      ratePercent: -5.0,
      note: `位於 ${floor} 樓且無電梯，出入攀爬負擔較大，享有實質租金補償`,
      level: 3,
      category: "floor",
    });
  }

  // 建築結構
  if (isSRC) {
    factors.push({
      label: "SRC 鋼骨鋼筋造",
      ratePercent: 2.5,
      note: "頂級耐震與高隔音建材，居住私密安靜度絕佳",
      level: 2,
      category: "structure",
    });
  } else if (isRC) {
    factors.push({
      label: "RC 鋼筋混凝土造",
      ratePercent: 2.0,
      note: "耐火耐震與優良隔音結構，居住品質遠優於木造鐵骨",
      level: 1,
      category: "structure",
    });
  } else if (isWooden) {
    factors.push({
      label: "木造／輕鋼構結構",
      ratePercent: -10.0,
      note: "隔音耐震保溫次於 RC 鋼筋混凝土，但總體租金極具親民優勢",
      level: 4,
      category: "structure",
    });
  }

  // 裝潢翻新
  if (hasRenovation) {
    factors.push({
      label: "室內現代化翻新",
      ratePercent: 6.0,
      note: "リノベーション 重新翻修，水電管線、地板廚衛全面更新",
      level: 3,
      category: "amenity",
    });
  }

  // 核心設備
  if (hasSeparateBathToilet) {
    factors.push({
      label: "乾濕分離（BT別）",
      ratePercent: 3.5,
      note: "浴室廁所獨立分開，日本租屋必備剛需配置",
      level: 2,
      category: "amenity",
    });
  }

  if (hasIndependentWashbasin) {
    factors.push({
      label: "獨立洗面台",
      ratePercent: 3.0,
      note: "獨立梳洗與收納動線，單身承租熱門加分設備",
      level: 2,
      category: "amenity",
    });
  }

  if (hasAutoLock) {
    factors.push({
      label: "防盜自動門鎖",
      ratePercent: 2.5,
      note: "オートロック 門禁門卡管制，提升獨居防犯安全性",
      level: 2,
      category: "amenity",
    });
  }

  if (hasFreeInternet) {
    factors.push({
      label: "附免費光纖網路",
      ratePercent: 3.5,
      monthlyYen: 4500,
      note: "入居即享高速 Wi-Fi，免自行簽約每月現省約 4,500 円",
      level: 2,
      category: "internet",
    });
  }

  if (hasDeliveryBox) {
    factors.push({
      label: "宅配箱",
      ratePercent: 1.5,
      note: "不在家也能安全收取包裹，現代都會網購必備配備",
      level: 1,
      category: "amenity",
    });
  }

  if (hasBathroomDryer) {
    factors.push({
      label: "浴室暖風乾燥機",
      ratePercent: 1.5,
      note: "雨天花粉季可室內乾衣，冬季預先暖房並防止浴室發霉",
      level: 1,
      category: "amenity",
    });
  }

  const positiveFactorsSumPercent = Number(
    factors.filter(f => f.ratePercent > 0).reduce((s, f) => s + f.ratePercent, 0).toFixed(1)
  );
  const negativeFactorsSumPercent = Number(
    factors.filter(f => f.ratePercent < 0).reduce((s, f) => s + f.ratePercent, 0).toFixed(1)
  );
  const netFactorsSumPercent = Number(
    factors.reduce((s, f) => s + f.ratePercent, 0).toFixed(1)
  );
  const nominalDiffPercent = range
    ? Number((((totalMonthlyCost - range.median) / Math.max(1, range.median)) * 100).toFixed(1))
    : 0;

  // 低於行情低端
  if (effectiveMonthlyCost < range.low) {
    const gapPercent = Math.round(((range.low - effectiveMonthlyCost) / range.low) * 100);
    return {
      status: "超值",
      headline: `每月總負擔 ${man(totalMonthlyCost)} 低於同區行情約 ${gapPercent}%，價格優勢顯著。`,
      detail: `同區同房型行情約 ${man(range.low)}～${man(range.high)}（中位 ${man(range.median)}）。價格明顯親民實惠，建議留意確認是否有特殊解約約定、朝向日照限制或周邊環境等取捨。`,
      factors,
      positiveFactorsSumPercent,
      negativeFactorsSumPercent,
      netFactorsSumPercent,
      nominalDiffPercent,
    };
  }

  // 落在基準行情內
  if (totalMonthlyCost <= range.high) {
    const nearMedian = Math.abs(totalMonthlyCost - range.median) / Math.max(1, range.median) <= 0.05;
    const belowMedian = totalMonthlyCost < range.median;
    return {
      status: "合理",
      headline: nearMedian
        ? `每月總負擔 ${man(totalMonthlyCost)} 貼近同區行情中位數，定價合宜健康。`
        : `每月總負擔 ${man(totalMonthlyCost)} 落在周邊市場正常行情區間（偏${belowMedian ? "實惠" : "高端"}），符合行情。`,
      detail: `同區同房型行情約 ${man(range.low)}～${man(range.high)}（中位 ${man(range.median)}）。當前月額負擔與區域行情相符。`,
      factors,
      positiveFactorsSumPercent,
      negativeFactorsSumPercent,
      netFactorsSumPercent,
      nominalDiffPercent,
    };
  }

  // 名目租金高於基準高端，但綜合條件（屋齡、距離、面積、設備）足以支撐
  if (effectiveMonthlyCost <= adjustedHigh) {
    const positiveReasons: string[] = [];
    if (walkText && walkPremiumRate > 0) positiveReasons.push(walkText);
    if (areaText && areaPremiumRate > 0) positiveReasons.push(areaText);
    if (ageText && agePremiumRate > 0) positiveReasons.push(ageText);
    if (internetText) positiveReasons.push(internetText);
    amenitiesList.forEach(a => positiveReasons.push(a));

    const areaNote = areaSqm && areaSqm >= 20 ? `（專有面積 ${areaSqm}㎡ 高於單身平均 17㎡）` : "";
    const diffYen = totalMonthlyCost - range.median;
    const netYen = Math.round(range.median * (netFactorsSumPercent / 100));
    const comparisonText = netFactorsSumPercent >= nominalDiffPercent
      ? `本案條件累計淨加成（+${netFactorsSumPercent.toFixed(1)}%，約 +${man(netYen)}）充分涵蓋當前月額相對中位數之溢價（+${nominalDiffPercent.toFixed(1)}%，+${man(diffYen)}）。考量硬體規格與生活便利性${areaNote}，當前租金溢價反映更好的居住品質，定價具備充分條件支撐與合理性。`
      : `考量硬體規格與生活便利性${areaNote}，當前價格反映的是更好的居住品質，定價具合理性。`;

    return {
      status: "條件反映",
      headline: `每月總負擔 ${man(totalMonthlyCost)} 雖略高於同區行情均值，但綜合屋齡、站距與規格，屬於符合品質的「合理溢價」。`,
      detail: `同區同房型基礎行情約 ${man(range.low)}～${man(range.high)}（中位 ${man(range.median)}）。但此物件具備明顯優勢：${positiveReasons.join("；") || "建物規格較佳"}。${comparisonText}`,
      factors,
      positiveFactorsSumPercent,
      negativeFactorsSumPercent,
      netFactorsSumPercent,
      nominalDiffPercent,
    };
  }

  // 真的偏高
  const gapPercent = Math.round(((effectiveMonthlyCost - adjustedHigh) / adjustedHigh) * 100);
  if (gapPercent <= 10) {
    return {
      status: "偏高",
      headline: `每月總負擔 ${man(totalMonthlyCost)} 略高於同條件市場行情約 ${gapPercent}%，建議評估個人每月承擔能力。`,
      detail: `考量屋齡、車站距離與空間大小後，推估同條件行情上限約為 ${man(adjustedHigh)}。目前月額負擔稍顯偏高，由於日本租屋月租多為固定定價、幾無議價談判空間，建議承租前務必衡量個人每月預算與承擔能力，亦可同步比較周邊其他同級房源。`,
      factors,
      positiveFactorsSumPercent,
      negativeFactorsSumPercent,
      netFactorsSumPercent,
      nominalDiffPercent,
    };
  }

  return {
    status: "明顯偏高",
    headline: `每月總負擔 ${man(totalMonthlyCost)} 明顯高於周邊同條件行情約 ${gapPercent}%，建議審慎評估自身承擔能力。`,
    detail: `此物件月額負擔超出周邊同等屋齡與距離之行情上限甚多。除非有特定不可替代之偏好（如特殊景觀或高品質裝潢），否則性價比偏低；考量日本租屋習慣無談判議價空間，建議謹慎衡量個人每月承受力，並優先多比較周邊同級房源。`,
    factors,
    positiveFactorsSumPercent,
    negativeFactorsSumPercent,
    netFactorsSumPercent,
    nominalDiffPercent,
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
    if (!hasKnownCommuteStations(target, criteria.commuteStations || [])) {
      return {
        key: "commute", label: "通勤", detail, status: "待確認",
        headline: `無法辨識通勤地點「${target}」，目前不能判斷通勤範圍。`,
        drivers: [], nextStep: "請確認車站名稱，並盡量使用正式站名。", supplyImpact: 0
      };
    }
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
  const tight = { r1: 28, k1: 28, ldk1: 40, ldk2: 60, ldk3: 85 }[criteria.roomType];
  const roomy = { r1: 22, k1: 22, ldk1: 33, ldk2: 50, ldk3: 70 }[criteria.roomType];
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
  // 這一段是「低於該房型的常見下限」，代表條件寬鬆、幾乎不篩掉房源。
  // 先前寫成「是常見面積」會誤導：1LDK 指定 25㎡ 其實偏小（常見落在 33㎡ 以上），
  // 說它是常見面積等於告訴使用者這個數字很標準，實際上他只是把門檻設得很低。
  return {
    key: "layout", label: "格局與面積", detail, status: "符合",
    headline: `${criteria.areaMin}㎡ 低於 ${roomLabel} 的常見下限，面積這一項不會限制選擇。`,
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
    // 乾濕分離現在是獨立欄位（先前只會以自由文字落在 otherNeeds）。
    // 沒有列進來的話，它變成只影響估價、卻不影響「設備要求會篩掉多少房源」的判斷。
    criteria.separateBath ? "乾濕分離" : null,
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
        ? "附家具家電的房源較少，但已標記為無此需求亦可，不會因此縮小搜尋範圍。"
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

function initialFeePreferenceAxis(criteria: RentSearchCriteria): AxisVerdict | null {
  const conditions = [criteria.noKeyMoney ? "免禮金" : null, criteria.noDeposit ? "免押金" : null]
    .filter(Boolean) as string[];
  if (!conditions.length) return null;
  const both = conditions.length === 2;
  return {
    key: "initialFeePreference",
    label: "初期費用條件",
    detail: conditions.join("・"),
    status: "部分符合",
    headline: both
      ? "同時指定免禮金與免押金可降低初期費用，但會明顯縮小可選房源。"
      : `${conditions[0]}能降低初期費用，但不是所有物件都有此募集條件。`,
    drivers: [
      criteria.noDeposit ? "免押金物件仍可能預收退房清潔費或定額償卻費" : "",
      criteria.noKeyMoney ? "熱門地區與熱門車站附近的免禮金物件通常更少" : ""
    ].filter(Boolean),
    nextStep: both ? "若結果太少，建議先保留免禮金，押金則確認可退還條件後再比較。" : undefined,
    supplyImpact: both ? 2 : 1
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
  // 已有專屬評估軸的結構化條件不能再落入「其他核心條件」。
  // AI 常會同時回傳 petsAllowed / petType 與 otherNeeds: ["可養貓"]；
  // 若不排除，同一條需求會在「特殊條件」與此處各顯示一次。
  const handledByDedicatedAxis = (condition: string) =>
    (criteria.petsAllowed === true && /可養|能養|寵物|宠物|貓|猫|狗|犬/.test(condition)) ||
    (criteria.furnished === true && /家具|家電|家电/.test(condition));

  const unverified = [...new Set([...(criteria.unverifiedConditions || []), ...(criteria.otherNeeds || [])])]
    .filter(condition => !handledByDedicatedAxis(condition));
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
      if (!knowledge) return null;
      const advice = knowledge.advice.trim();
      return advice.startsWith(condition) ? advice : `${condition}｜${advice}`;
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
  const isOverseas = criteria.applicationChannel === "overseas";
  const channelLabel = isOverseas ? "海外跨國審查" : criteria.applicationChannel === "domestic" ? "境內審查" : null;
  const detailParts = [
    criteria.visaType ? `${criteria.visaType}${criteria.visaYears ? `・在留 ${criteria.visaYears} 年` : ""}` : null,
    channelLabel
  ].filter(Boolean);
  const detail = detailParts.length ? detailParts.join("・") : null;

  const drivers = [...copy.drivers];
  if (isOverseas) {
    if (category === "workingHoliday") {
      drivers.push("打工度假＋海外審查為高難度組合：需挑選少數接受 1 年短簽且支援跨國送審之物業");
      drivers.push("審查通常嚴格要求租金 12～15 個月以上之存款餘額證明");
    } else if (category === "student") {
      drivers.push("留學生海外跨國審查：需挑選接受未入境留學生之管理公司，必備入學許可與 COE");
    } else if (category === "longTerm") {
      drivers.push("具日本籍或永住資格，審查不受在留資格限制，主要需配合跨國線上契約手續");
    } else {
      drivers.push("海外跨國審查：需挑選支援線上 IT 重說與 COE 審查之管理公司，可申請之房源相對受限");
    }
  }

  let nextStep: string | undefined;
  if (category === "unknown") {
    nextStep = isOverseas
      ? "人在海外申請需先確認簽證類別，管理公司才能判定審查通道；請補上在留資格。"
      : "補上在留資格與剩餘期間。";
  } else if (category === "workingHoliday") {
    nextStep = isOverseas
      ? "提前準備 15 個月租金以上的存款餘額證明，並務必在房子審查通過後再購買赴日機票。"
      : "提前準備存款證明（預金殘高證明），方便仲介快速鎖定可申請的長期物件。";
  } else if (category === "student" && isOverseas) {
    nextStep = "提早取得入學許可書與 COE，由顧問鎖定留學生友善之海外審查房源。";
  } else if (isOverseas) {
    nextStep = "建議提早由顧問直接鎖定支援海外審查之物件，並備妥護照、在留資格認定書（COE）與財力文件。";
  }

  const overseasImpact = !isOverseas ? 0 : category === "longTerm" ? 1 : category === "workingHoliday" ? 3 : 2;
  const baseImpact = category === "workingHoliday" ? 2 : 0;
  const supplyImpact = baseImpact + overseasImpact;

  let headline = copy.headline;
  if (isOverseas) {
    if (category === "unknown") {
      headline = "人在海外申請需先釐清在留資格，以便挑選對應的審查通道。";
    } else if (category === "workingHoliday") {
      headline = "打工度假海外審查門檻較高，需嚴格篩選接受 1 年短簽與海外送件之管理公司。";
    } else {
      headline = `${copy.headline}（海外跨國審查通道）`;
    }
  }

  return {
    key: "visa",
    label: "在留與審查",
    detail,
    status: category === "unknown" ? "待確認" : (category === "workingHoliday" && isOverseas) ? "需調整" : category === "workingHoliday" ? "部分符合" : "符合",
    headline,
    drivers,
    nextStep,
    supplyImpact
  };
}

/* ── 對外 API ─────────────────────────────────────────── */

/**
 * 把不合理的數值清成「沒填」。
 *
 * 數字可能來自模型抽取、正則補抓或使用者直接輸入，三個來源都可能給出負數、
 * NaN、Infinity 或字串。先前沒有這一層，於是畫面上會出現「上限 -5 萬円」、
 * 「屋齡 -5 年內」、「上限 NaN 萬円」這種輸出；負預算還會讓 gapRatio 的分母
 * 變號，把不可能的條件判成「幾乎貼齊行情低端」。
 *
 * 清成 null 而不是夾到邊界值：使用者填了離譜的數字，正確的回應是當作沒填、
 * 請他補一個合理值，而不是幫他假設一個他沒說過的數字。
 */
/** 月租上限的合理天花板；超過這個數多半是打錯零，不是真的預算。 */
const MAX_MONTHLY_BUDGET = 5_000_000;

function positive(value: unknown, max: number): number | null {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num) || num <= 0 || num > max) return null;
  return num;
}

/**
 * 預算被清洗掉時要能分辨「本來就沒填」與「填了但超出合理範圍」。
 *
 * 使用者把 10 萬打成 1000 萬（多按兩個零）時，數值會被 positive() 丟掉，
 * 畫面接著說「還沒有月租上限」——他明明填了，只會一頭霧水。
 */
function budgetOutOfRange(criteria: RentSearchCriteria): boolean {
  const raw = criteria.maxBudget;
  if (raw == null || raw === undefined) return false;
  const num = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(num) && num > 0 && num > MAX_MONTHLY_BUDGET;
}

function sanitizeCriteria(criteria: RentSearchCriteria): RentSearchCriteria {
  const roomType = Object.prototype.hasOwnProperty.call(ROOM_TYPE_LABEL, criteria.roomType)
    ? criteria.roomType
    : "k1";
  const maxBudget = positive(criteria.maxBudget, MAX_MONTHLY_BUDGET);
  let minBudget = positive(criteria.minBudget, MAX_MONTHLY_BUDGET);
  // 下限高於上限時捨棄下限：上限是使用者真正的天花板，
  // 留著會顯示成「15 萬円～8 萬円」這種反過來的區間。
  if (minBudget != null && maxBudget != null && minBudget > maxBudget) minBudget = null;

  return {
    ...criteria,
    roomType,
    maxBudget,
    minBudget,
    buildingAgeMax: positive(criteria.buildingAgeMax, 100),
    walkMinutes: positive(criteria.walkMinutes, 60),
    commuteMinutes: positive(criteria.commuteMinutes, 180),
    commutePreferredMinutes: positive(criteria.commutePreferredMinutes, 180),
    commuteMaxStations: positive(criteria.commuteMaxStations, 50),
    amenityWalkMinutes: positive(criteria.amenityWalkMinutes, 180),
    floorMin: positive(criteria.floorMin, 60),
    householdSize: positive(criteria.householdSize, 10),
    areaMin: positive(criteria.areaMin, 500),
    initialCostBudget: positive(criteria.initialCostBudget, 20_000_000),
    visaYears: positive(criteria.visaYears, 20),
    gasBurnersMin: positive(criteria.gasBurnersMin, 10)
  };
}

export function buildAxisVerdicts(rawCriteria: RentSearchCriteria, recommendations: RentRecommendation[]): AxisVerdict[] {
  const criteria = sanitizeCriteria(rawCriteria);
  const range = estimateRequestedRent(criteria);
  return [
    visaAxis(criteria),
    budgetAxis(criteria, range, budgetOutOfRange(rawCriteria)),
    commuteAxis(criteria, recommendations),
    layoutAxis(criteria),
    buildingAxis(criteria),
    equipmentAxis(criteria),
    petAxis(criteria),
    otherCoreNeedsAxis(criteria),
    timingAxis(criteria),
    initialFeePreferenceAxis(criteria),
    initialCostAxis(criteria)
  ].filter(Boolean) as AxisVerdict[];
}

export function buildOverallVerdict(axes: AxisVerdict[]): OverallVerdict {
  // 待補資料只影響判斷完整度，不先當成市場阻力加分。
  const totalImpact = axes.reduce((sum, axis) => sum + (axis.status === "待確認" ? 0 : axis.supplyImpact), 0);
  const highImpact = axes.filter(axis => axis.status !== "待確認" && axis.supplyImpact >= 2);
  const adjusting = axes.filter(axis => axis.status === "需調整");
  const stillPending = axes.filter(axis => axis.status === "待確認");
  const pendingLabels = [...new Set(stillPending.map(axis => axis.label))];

  // 只有「整組需求本身無法成立」的軸才是一票否決：預算搆不到指定行情、
  // 或所有推薦方向都超過通勤上限。寵物、築淺、家具等雖然很壓縮供給，
  // 仍應與預算、地區彈性及其他條件一起做整體判斷，不能單項直接判死刑。
  const hardConflicts = axes.filter(axis =>
    axis.status === "難度高" && (axis.key === "budget" || axis.key === "commute")
  );
  // 只有預算缺席才真的無法判斷。沒有通勤目的地仍可評預算、格局、建物等軸，
  // 不該讓整份評估降級成「資料不足」而蓋掉其他結論。
  const pendingKeys = axes.filter(axis => axis.status === "待確認" && axis.key === "budget");
  // 預算軸有兩種待確認，下一步完全不同：真的沒填要叫他補預算；
  // 地區查無行情時他明明填了預算，再叫他「補上預算」只會讓人反覆重填
  // 一個已經填好的欄位，真正該換的是地區。
  const noMarketData = pendingKeys.some(axis => axis.pendingReason === "no-market-data");

  // 最該先放寬的：壓縮供給最多、且有具體下一步的那一項。
  const loosenFirst = [...axes]
    .filter(axis => axis.nextStep && axis.supplyImpact >= 2)
    .sort((a, b) => b.supplyImpact - a.supplyImpact)[0];

  if (pendingKeys.length) {
    return {
      level: "資料不足",
      headline: noMarketData
        ? "這個地區目前沒有收錄行情，無法比對預算。換一個地區或指定車站再試一次。"
        : `補上${pendingKeys.map(axis => axis.label).join("與")}後才能判斷這組需求找不找得到。`,
      reasons: pendingKeys.map(axis => axis.headline),
      pendingLabels
    };
  }

  const explicitReasons = [...hardConflicts, ...adjusting];
  const impactfulReasons = axes
    .filter(axis => axis.supplyImpact > 0 && !explicitReasons.includes(axis))
    .sort((a, b) => b.supplyImpact - a.supplyImpact);
  const reasons = [...explicitReasons, ...impactfulReasons].slice(0, 3).map(axis => axis.headline);

  if (hardConflicts.length || totalImpact >= 6) {
    return {
      level: "難度高",
      headline: hardConflicts.length
        ? `${hardConflicts.map(axis => axis.label).join("、")}與目前設定有明顯落差，整組需求需要大幅調整。`
        : "多項條件疊加後，同時滿足全部要求的房源相對較少。",
      reasons: reasons.length ? reasons : ["多項條件同時限制供給"],
      loosenFirst: loosenFirst ? `${loosenFirst.label}：${loosenFirst.nextStep}` : undefined,
      pendingLabels: pendingLabels.length ? pendingLabels : undefined
    };
  }
  // 多項條件同時壓縮供給時，線性加總撐不到門檻：預算勉強、屋齡勉強各記 1 分，
  // 合計 2 分仍判「可行」，使用者照著去找卻處處碰壁。
  //
  // 只計「部分符合且真的壓縮供給（impact ≥ 1）」的軸——單看狀態會誤判：
  // 通勤 40 分鐘會顯示部分符合但 impact 0，那不是限制，只是提醒。
  const squeezing = axes.filter(axis => axis.status === "部分符合" && axis.supplyImpact >= 1);

  if (highImpact.length || adjusting.length || totalImpact >= 4 || squeezing.length >= 2) {
    const pressureLabels = [...highImpact, ...adjusting, ...impactfulReasons]
      .sort((a, b) => b.supplyImpact - a.supplyImpact)
      .filter((axis, index, list) => list.findIndex(item => item.key === axis.key) === index)
      .slice(0, 3)
      .map(axis => axis.label);
    return {
      level: "有條件可行",
      headline: pressureLabels.length
        ? pressureLabels.length === 1
          ? `整體仍有機會，但${pressureLabels[0]}會明顯縮小可選房源。`
          : `整體仍有機會，但${pressureLabels.join("、")}疊加後會明顯縮小可選房源。`
        : "整體仍有機會，但有幾項條件需要排列優先順序。",
      reasons,
      loosenFirst: loosenFirst ? `${loosenFirst.label}：${loosenFirst.nextStep}` : undefined,
      pendingLabels: pendingLabels.length ? pendingLabels : undefined
    };
  }
  if (stillPending.length) {
    return {
      level: "資料不足",
      headline: `已填的條件在市場上找得到，補上${stillPending.map(axis => axis.label).join("與")}後就能確認整組需求。`,
      reasons: stillPending.map(axis => axis.headline),
      loosenFirst: undefined,
      pendingLabels
    };
  }
  return {
    level: "可行",
    headline: "這組條件在市場上找得到，可以直接開始看物件。",
    reasons: []
  };
}
