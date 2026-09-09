import type { LayoutCode } from "./housingMarket.js";
import { mlitConditionPremiums, mlitBuySnapshots, mlitTownPremiums } from "./mlitBuySnapshot.js";

export interface OfficialBuyEstimate {
  medianTradePriceYen: number;
  /** 優先為同屋齡帶、否則同區同房型的成交㎡單價中位數。 */
  medianSqmPriceYen: number | null;
  medianAreaSqm: number | null;
  ageBand: MlitBuyAgeBand | null;
  ageBandSampleCount: number | null;
  /**
   * 屋齡單價的取得範圍，可信度由高到低：
   * "layout"       同區＋同房型＋同屋齡帶（最嚴謹）
   * "area"         同區＋同屋齡帶，改用「面積相近」的房型（房型不同但面積帶接近）
   * "adjacent_age" 同區＋同房型，改用相鄰屋齡帶（房型固定，屋齡放寬一階）
   * "district"     同區＋同屋齡帶，跨全部房型合併（最後手段）
   */
  ageBandScope: "layout" | "area" | "adjacent_age" | "district" | null;
  sampleCount: number;
  windowQuarters: 4 | 8 | 0;
  periodStart: string;
  periodEnd: string;
  sourceUrl: string;
}

export interface BuyMarketEstimate extends OfficialBuyEstimate {
  source: "official_transaction" | "rent_yield_model";
  basePriceYen: number;
}

/**
 * 建立實價快照時，各房型分桶採計的專有面積範圍（㎡）。
 *
 * 這是 scripts/update-mlit-buy-data.ts 篩選成交紀錄的條件，也就是說
 * 每個分桶的中位總價，就是「這個面積帶之內」的成交中位數。要把總價中位數
 * 還原成可比較的單價，必須用同一組面積帶，否則兩邊的口徑會對不上——
 * 所以定義放在這裡由雙方共用，不讓腳本自己留一份會各自飄移的複本。
 */
export const LAYOUT_AREA_BANDS: Record<LayoutCode, [number, number]> = {
  r1: [12, 24], k1: [18, 35], ldk1: [30, 52], ldk2: [45, 75], ldk3: [65, 130]
};

export type MlitBuyAgeBand = "age_0_10" | "age_11_20" | "age_21_30" | "age_31_40" | "age_41_plus";

export function mlitAgeBandForAge(ageYears: number | null | undefined): MlitBuyAgeBand | null {
  if (ageYears === null || ageYears === undefined || !Number.isFinite(ageYears) || ageYears < 0) return null;
  if (ageYears <= 10) return "age_0_10";
  if (ageYears <= 20) return "age_11_20";
  if (ageYears <= 30) return "age_21_30";
  if (ageYears <= 40) return "age_31_40";
  return "age_41_plus";
}

/** 面積帶中點，作為該分桶「代表面積」的估計值。 */
export function layoutBandMidArea(layout: LayoutCode): number {
  const [min, max] = LAYOUT_AREA_BANDS[layout];
  return (min + max) / 2;
}

const tamaCities = new Set([
  "武藏野市", "三鷹市", "立川市", "八王子市", "日野市", "府中市",
  "調布市", "町田市", "西東京市", "小平市", "多摩市", "狛江市"
]);

export function getModeledBuyYieldRate(region: string, district: string, layout: LayoutCode) {
  const isTokyo23 = region === "東京都" && !tamaCities.has(district);
  let rate = isTokyo23 ? 0.040
    : region === "東京都" ? 0.054
      : region === "神奈川" ? 0.048
        : region === "大阪" ? 0.052
          : region === "埼玉" || region === "千葉" ? 0.058
            : 0.05;
  if (layout === "ldk1") rate -= 0.002;
  else if (layout === "ldk2") rate -= 0.004;
  else if (layout === "ldk3") rate -= 0.005;
  else if (layout === "r1") rate += 0.002;
  return rate;
}

export function getOfficialBuyEstimate(
  region: string,
  district: string,
  layout: LayoutCode,
  ageYears?: number | null
): OfficialBuyEstimate | null {
  const row = mlitBuySnapshots.find(item =>
    item.region === region && item.district === district && item.layout === layout
  );
  if (!row) return null;
  const requestedAgeBand = mlitAgeBandForAge(ageYears);
  const ageEntry = requestedAgeBand ? row.ageBands?.[requestedAgeBand] : null;

  // 同房型同屋齡帶的樣本不足時，舊版直接跳到「同區跨全部房型合併」。
  // 但 ㎡ 單價同時受面積與屋齡影響，把 1R 和 3LDK 混在一起算，
  // 面積差異帶來的誤差比屋齡本身還大。改成先找「面積相近」的房型，
  // 面積帶中點距離越近越優先；仍不足才放寬屋齡，最後才是全房型合併。
  const districtRows = mlitBuySnapshots.filter(
    item => item.region === region && item.district === district
  );
  const midOf = (code: LayoutCode) => {
    const [min, max] = LAYOUT_AREA_BANDS[code];
    return (min + max) / 2;
  };
  const selfMid = midOf(layout);

  const weightedMedian = (entries: Array<{ medianSqmPriceYen: number; sampleCount: number }>) => {
    if (!entries.length) return null;
    const sorted = [...entries].sort((a, b) => a.medianSqmPriceYen - b.medianSqmPriceYen);
    const total = sorted.reduce((sum, e) => sum + e.sampleCount, 0);
    if (total <= 0) return null;
    let cumulative = 0;
    for (const entry of sorted) {
      cumulative += entry.sampleCount;
      if (cumulative >= total / 2) return { medianSqmPriceYen: entry.medianSqmPriceYen, sampleCount: total };
    }
    return null;
  };

  // (a) 同屋齡帶 × 面積相近的房型（面積帶中點差距 ≤ 40%）
  let areaFallback: { medianSqmPriceYen: number; sampleCount: number } | null = null;
  if (requestedAgeBand && !ageEntry) {
    const near = districtRows
      .filter(item => item.layout !== layout)
      .filter(item => Math.abs(midOf(item.layout) - selfMid) / selfMid <= 0.4)
      .flatMap(item => {
        const entry = item.ageBands?.[requestedAgeBand];
        return entry ? [{ medianSqmPriceYen: entry.medianSqmPriceYen, sampleCount: entry.sampleCount }] : [];
      });
    areaFallback = weightedMedian(near);
  }

  // (b) 同房型 × 相鄰屋齡帶（屋齡只放寬一階，房型維持不變）
  let adjacentFallback: { medianSqmPriceYen: number; sampleCount: number } | null = null;
  if (requestedAgeBand && !ageEntry && !areaFallback) {
    const order: MlitBuyAgeBand[] = ["age_0_10", "age_11_20", "age_21_30", "age_31_40", "age_41_plus"];
    const index = order.indexOf(requestedAgeBand);
    const neighbours = [order[index - 1], order[index + 1]].filter(Boolean) as MlitBuyAgeBand[];
    const entries = neighbours.flatMap(band => {
      const entry = row.ageBands?.[band];
      return entry ? [{ medianSqmPriceYen: entry.medianSqmPriceYen, sampleCount: entry.sampleCount }] : [];
    });
    adjacentFallback = weightedMedian(entries);
  }

  // (c) 最後手段：同屋齡帶但跨全部房型
  let districtFallback: { medianSqmPriceYen: number; sampleCount: number } | null = null;
  if (requestedAgeBand && !ageEntry && !areaFallback && !adjacentFallback) {
    const all = districtRows.flatMap(item => {
      const entry = item.ageBands?.[requestedAgeBand];
      return entry ? [{ medianSqmPriceYen: entry.medianSqmPriceYen, sampleCount: entry.sampleCount }] : [];
    });
    districtFallback = weightedMedian(all);
  }

  const chosenFallback = areaFallback || adjacentFallback || districtFallback;
  const chosenScope: OfficialBuyEstimate["ageBandScope"] = ageEntry
    ? "layout"
    : areaFallback ? "area"
    : adjacentFallback ? "adjacent_age"
    : districtFallback ? "district"
    : null;
  const districtAgeMedianSqmPriceYen = chosenFallback?.medianSqmPriceYen ?? null;
  const districtAgeSampleCount = chosenFallback?.sampleCount ?? 0;

  const hasDistrictAgeFallback = !ageEntry && districtAgeMedianSqmPriceYen !== null;
  return {
    medianTradePriceYen: row.medianTradePriceYen,
    medianSqmPriceYen: ageEntry?.medianSqmPriceYen ?? districtAgeMedianSqmPriceYen ?? row.medianSqmPriceYen ?? null,
    medianAreaSqm: row.medianAreaSqm ?? null,
    ageBand: ageEntry || hasDistrictAgeFallback ? requestedAgeBand : null,
    ageBandSampleCount: ageEntry?.sampleCount ?? (hasDistrictAgeFallback ? districtAgeSampleCount : null),
    ageBandScope: chosenScope,
    sampleCount: row.sampleCount,
    windowQuarters: row.windowQuarters,
    periodStart: row.periodStart,
    periodEnd: row.periodEnd,
    sourceUrl: row.sourceUrl
  };
}

export function getBuyMarketEstimate(input: {
  region: string;
  district: string;
  layout: LayoutCode;
  monthlyRentYen: number;
  ageYears?: number | null;
}): BuyMarketEstimate {
  const official = getOfficialBuyEstimate(input.region, input.district, input.layout, input.ageYears);
  if (official) return {
    ...official,
    source: "official_transaction",
    basePriceYen: official.medianTradePriceYen
  };
  const basePriceYen = input.monthlyRentYen * 12 /
    getModeledBuyYieldRate(input.region, input.district, input.layout);
  return {
    source: "rent_yield_model",
    basePriceYen,
    medianTradePriceYen: basePriceYen,
    medianSqmPriceYen: null,
    medianAreaSqm: null,
    ageBand: null,
    ageBandSampleCount: null,
    ageBandScope: null,
    sampleCount: 0,
    windowQuarters: 0,
    periodStart: "",
    periodEnd: "",
    sourceUrl: ""
  };
}


/**
 * 取得「已控制屋齡」的條件溢價（翻新、構造）。
 *
 * 為什麼一定要帶 ageBand：在分桶內直接比「改装済み vs 未改装」會得到
 * 「翻新反而更便宜」的反向結果，因為會翻新的多半是老屋、老屋單價本來就低。
 * 這裡的數字是在「同區域 × 同房型 × 同屋齡帶」內比較後彙總，沒有這個混淆。
 */
export function getConditionPremium(region: string, ageYears: number | null | undefined) {
  const ageBand = mlitAgeBandForAge(ageYears);
  if (!ageBand) return null;
  return mlitConditionPremiums.find(row => row.region === region && row.ageBand === ageBand) ?? null;
}


/** 屋齡帶對照的單列：該屋齡帶的成交㎡單價，以及相對本案屋齡帶的價差。 */
export interface AgeBandComparisonRow {
  ageBand: MlitBuyAgeBand;
  medianSqmPriceYen: number;
  sampleCount: number;
  /** 相對本案所屬屋齡帶的百分比差；本案該列為 0。 */
  diffPercent: number;
  isCurrent: boolean;
}

/**
 * 取出同區同房型各屋齡帶的成交㎡單價，供「換一個屋齡帶差多少」的對照表使用。
 * 這是同一個分桶內的實際成交資料，不含任何估算係數。
 */
export function getAgeBandComparison(
  region: string,
  district: string,
  layout: LayoutCode,
  ageYears: number | null | undefined
): AgeBandComparisonRow[] {
  const row = mlitBuySnapshots.find(
    item => item.region === region && item.district === district && item.layout === layout
  );
  if (!row?.ageBands) return [];
  const currentBand = mlitAgeBandForAge(ageYears);
  const order: MlitBuyAgeBand[] = ["age_0_10", "age_11_20", "age_21_30", "age_31_40", "age_41_plus"];
  const entries = order
    .map(band => ({ band, entry: row.ageBands?.[band] }))
    .filter((item): item is { band: MlitBuyAgeBand; entry: { medianSqmPriceYen: number; sampleCount: number } } =>
      Boolean(item.entry)
    );
  if (entries.length < 2) return [];
  // 沒讀到屋齡時以樣本數最多的屋齡帶當基準，至少讓對照表有一個參照點。
  const baseBand = currentBand && entries.some(e => e.band === currentBand)
    ? currentBand
    : entries.reduce((a, b) => (b.entry.sampleCount > a.entry.sampleCount ? b : a)).band;
  const base = entries.find(e => e.band === baseBand)!.entry.medianSqmPriceYen;
  return entries.map(({ band, entry }) => ({
    ageBand: band,
    medianSqmPriceYen: entry.medianSqmPriceYen,
    sampleCount: entry.sampleCount,
    diffPercent: Math.round((entry.medianSqmPriceYen / base - 1) * 1000) / 10,
    isCurrent: band === baseBand,
  }));
}


/** 本案所在町名相對同區行情的地段溢價。 */
export interface TownPremium {
  town: string;
  /** 該町成交㎡單價相對同區同條件中位數的百分比差。 */
  premiumPercent: number;
  sampleCount: number;
  /** "layout_age" 同房型同屋齡帶內比較；"age" 跨房型只控屋齡。 */
  grain: "layout_age" | "age";
  /** 在同一個行政區的所有町名中由貴到便宜的名次。 */
  rank: number;
  townCount: number;
}

const normalizeAddressForTown = (value: string) =>
  value.normalize("NFKC").replace(/[\s　]/g, "");

/**
 * 從地址比對出所在町名，回傳該町相對同區行情的地段溢價。
 *
 * 溢價本身在建快照時就已控制屋齡（見 scripts/update-mlit-buy-data.ts），
 * 否則「某町全是新塔樓」會被誤讀成地段好。
 */
export function getTownPremium(
  region: string,
  district: string,
  address: string | null | undefined
): TownPremium | null {
  if (!address) return null;
  // 只有一個細胞、樣本又只有個位數的町名，百分比會跳到 ±30% 以上，那是噪音不是地段。
  const rows = mlitTownPremiums.filter(row =>
    row.region === region && row.district === district &&
    (row.cellCount >= 2 || row.sampleCount >= 12)
  );
  if (rows.length < 2) return null;
  const normalized = normalizeAddressForTown(address);
  // 町名可能互為前綴（「新宿」與「西新宿」），取最長的相符者才不會比錯地段。
  const matched = rows
    .filter(row => normalized.includes(normalizeAddressForTown(row.town)))
    .sort((a, b) => b.town.length - a.town.length)[0];
  if (!matched) return null;
  const ranked = [...rows].sort((a, b) => b.premiumPercent - a.premiumPercent);
  return {
    town: matched.town,
    premiumPercent: Math.max(-25, Math.min(25, matched.premiumPercent)),
    sampleCount: matched.sampleCount,
    grain: matched.grain,
    rank: ranked.findIndex(row => row.town === matched.town) + 1,
    townCount: rows.length,
  };
}
