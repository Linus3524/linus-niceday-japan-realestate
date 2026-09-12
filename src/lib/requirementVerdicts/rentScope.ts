import { districtStations, rentRates } from "../../data/housingMarket.js";
import { stationsWithinHops } from "../localTransitRoute.js";
import {
computeStackedEstimate,
getRentModifierIds,
type RentSearchCriteria
} from "../rentAnalysis.js";
import { toJapaneseStationName } from "../transit.js";
import { METRO_REGIONS, normalize, normalizeLine, normalizeStation } from './shared.js';
import type { RentSegment, RequestedRentRange } from './types.js';


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
