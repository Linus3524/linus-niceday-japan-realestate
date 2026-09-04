import { rentRates, districtStations } from "../data/housingMarket.js";
import { stationsWithinHops } from "./localTransitRoute.js";
import { toJapaneseStationName } from "./transit.js";
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
const man = (value: number) => `${(value / 10000).toFixed(1).replace(/\.0$/, "")} 萬円`;

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

export interface ListingPriceVerdict {
  status: AxisStatus;
  headline: string;
  detail: string;
}

/**
 * 判斷「這個物件的租金＋管理費」相對所在地區行情是高是低，供圖紙健檢功能使用。
 *
 * 刻意不重用 budgetAxis：那個函式回答的是「使用者的預算該不該調整」，措辭是
 * 「建議將月租上限提高到...」「建議考慮調整搜尋區域」；這裡要回答的是相反的
 * 問題——「這個已經選定的物件，價格合不合理」，直接借用會講出文不對題的建議
 * （對著一個已經確定要看的物件叫使用者「調整搜尋區域」沒有意義）。
 */
export function buildListingPriceVerdict(
  totalMonthlyCost: number,
  range: RequestedRentRange | null
): ListingPriceVerdict {
  if (!range) {
    return {
      status: "待確認",
      headline: "查無這個地區與房型的行情資料，無法判斷這個價格合不合理。",
      detail: "可能是圖紙上的車站無法辨識，或這個房型在行情資料庫中樣本不足。",
    };
  }

  if (totalMonthlyCost < range.low) {
    const gapPercent = Math.round(((range.low - totalMonthlyCost) / range.low) * 100);
    return {
      status: "部分符合",
      headline: `租金＋管理費 ${man(totalMonthlyCost)} 低於行情低端約 ${gapPercent}%。`,
      detail: "價格明顯偏低不一定是壞事，但建議留意是否有圖紙上未列出的額外成本，或屋齡、樓層、周邊環境等條件上的取捨。",
    };
  }

  if (totalMonthlyCost <= range.high) {
    const nearMedian = Math.abs(totalMonthlyCost - range.median) / Math.max(1, range.median) <= 0.05;
    const belowMedian = totalMonthlyCost < range.median;
    return {
      status: nearMedian ? "符合" : "部分符合",
      headline: nearMedian
        ? `租金＋管理費 ${man(totalMonthlyCost)} 落在行情中位附近，屬合理範圍。`
        : `租金＋管理費 ${man(totalMonthlyCost)} 落在行情偏${belowMedian ? "低" : "高"}端，仍屬合理範圍。`,
      detail: `這個地區與房型的行情約 ${man(range.low)}～${man(range.high)}（中位 ${man(range.median)}）。`,
    };
  }

  const gapPercent = Math.round(((totalMonthlyCost - range.high) / range.high) * 100);
  return {
    status: gapPercent <= 15 ? "需調整" : "難度高",
    headline: `租金＋管理費 ${man(totalMonthlyCost)} 高於行情高端約 ${gapPercent}%。`,
    detail: "建議向仲介確認加價的具體原因（例如新裝潢、高樓層、免費網路、自動鎖等額外條件），而非單純接受「比較貴」。",
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
