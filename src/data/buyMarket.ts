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
