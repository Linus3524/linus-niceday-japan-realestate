/** Public REINS monthly benchmarks, manually verified against rendered reports. */
export interface ReinsSaleListingBenchmark {
  kind: "reins_ratio";
  market: string;
  period: string;
  contractSqmPriceMan: number;
  newListingSqmPriceMan: number;
  sourceUrl: string;
  sourceLabel: string;
  scopeLabel: string;
}

export const REINS_METRO_SALE_LISTING_BENCHMARK: ReinsSaleListingBenchmark = {
  kind: "reins_ratio",
  market: "首都圈中古公寓",
  period: "2026-07",
  contractSqmPriceMan: 84.17,
  newListingSqmPriceMan: 117.86,
  sourceUrl: "https://www.reins.or.jp/pdf/trend/mw/mw_202607_summary.pdf",
  sourceLabel: "東日本 REINS 月例 Market Watch",
  scopeLabel: "首都圈",
};

export const REINS_CHUBU_SALE_LISTING_BENCHMARK: ReinsSaleListingBenchmark = {
  kind: "reins_ratio",
  market: "中部圈中古公寓",
  period: "2026-07",
  contractSqmPriceMan: 32.22,
  newListingSqmPriceMan: 36.18,
  sourceUrl: "https://www.chubu-reins.or.jp/reinspdf/data/mw200.pdf",
  sourceLabel: "中部 REINS 月例市況",
  scopeLabel: "中部圈",
};

export const REINS_KINKI_SALE_LISTING_BENCHMARK: ReinsSaleListingBenchmark = {
  kind: "reins_ratio",
  market: "近畿圈中古公寓",
  period: "2026-07",
  contractSqmPriceMan: 47.94,
  newListingSqmPriceMan: 55.27,
  sourceUrl: "https://www.kinkireins.or.jp/webkanri/kanri/wp-content/uploads/2026/08/monthlyreport_164.pdf",
  sourceLabel: "近畿 REINS 月例市況",
  scopeLabel: "近畿圈",
};

const BENCHMARK_BY_REGION = new Map<string, ReinsSaleListingBenchmark>([
  ...["東京都", "神奈川", "埼玉", "千葉"].map(region => [region, REINS_METRO_SALE_LISTING_BENCHMARK] as const),
  ...["富山", "石川", "福井", "岐阜", "靜岡", "静岡", "愛知", "三重"]
    .map(region => [region, REINS_CHUBU_SALE_LISTING_BENCHMARK] as const),
  ...["滋賀", "京都", "大阪", "兵庫", "奈良", "和歌山"]
    .map(region => [region, REINS_KINKI_SALE_LISTING_BENCHMARK] as const),
]);

export function getReinsSaleListingBenchmark(region: string): ReinsSaleListingBenchmark | null {
  return BENCHMARK_BY_REGION.get(region) ?? null;
}

export function reinsNewListingPremiumRate(benchmark: ReinsSaleListingBenchmark): number {
  return benchmark.newListingSqmPriceMan / benchmark.contractSqmPriceMan - 1;
}

export function reinsImpliedDiscountFromListingRate(benchmark: ReinsSaleListingBenchmark): number {
  return 1 - benchmark.contractSqmPriceMan / benchmark.newListingSqmPriceMan;
}
