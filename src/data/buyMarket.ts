import type { LayoutCode } from "./housingMarket.js";
import { mlitBuySnapshots } from "./mlitBuySnapshot.js";

export interface OfficialBuyEstimate {
  medianTradePriceYen: number;
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
  layout: LayoutCode
): OfficialBuyEstimate | null {
  const row = mlitBuySnapshots.find(item =>
    item.region === region && item.district === district && item.layout === layout
  );
  return row ? {
    medianTradePriceYen: row.medianTradePriceYen,
    sampleCount: row.sampleCount,
    windowQuarters: row.windowQuarters,
    periodStart: row.periodStart,
    periodEnd: row.periodEnd,
    sourceUrl: row.sourceUrl
  } : null;
}

export function getBuyMarketEstimate(input: {
  region: string;
  district: string;
  layout: LayoutCode;
  monthlyRentYen: number;
}): BuyMarketEstimate {
  const official = getOfficialBuyEstimate(input.region, input.district, input.layout);
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
    sampleCount: 0,
    windowQuarters: 0,
    periodStart: "",
    periodEnd: "",
    sourceUrl: ""
  };
}
