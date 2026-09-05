import type { LayoutCode } from "./housingMarket.js";
import { atHomeSaleSnapshotMeta, atHomeSaleSnapshots } from "./atHomeSaleSnapshot.js";
import { getReinsSaleListingBenchmark, type ReinsSaleListingBenchmark } from "./reinsSaleMarket.js";

export interface PublicSaleListingBenchmark {
  kind: "public_listing_average";
  market: string;
  period: string;
  averageListingPriceYen: number;
  sourceUrl: string;
  sourceLabel: string;
  scopeLabel: string;
}

export type SaleListingBenchmark = PublicSaleListingBenchmark | ReinsSaleListingBenchmark;

export const publicSaleMarketCrossChecks = [
  { label: "At Home", url: "https://www.athome.co.jp/mansion/chuko/souba/", role: "numeric_snapshot" as const },
  { label: "SUUMO", url: "https://suumo.jp/ms/chuko/soba/", role: "manual_cross_check" as const },
  { label: "LIFULL HOME'S", url: "https://www.homes.co.jp/mansion/chuko/price/", role: "manual_cross_check" as const },
];

export function getSaleListingBenchmark(region: string, district: string, layout: LayoutCode): SaleListingBenchmark | null {
  const row = atHomeSaleSnapshots.find(item => item.region === region && item.district === district);
  const averageListingPriceYen = row?.askingPrices[layout] ?? null;
  if (averageListingPriceYen && averageListingPriceYen > 0 && row) {
    return {
      kind: "public_listing_average",
      market: `${district}・同房型群中古公寓`,
      period: atHomeSaleSnapshotMeta.capturedAt,
      averageListingPriceYen,
      sourceUrl: row.sourceUrl,
      sourceLabel: atHomeSaleSnapshotMeta.sourceLabel,
      scopeLabel: `${district}・格局別`,
    };
  }
  return getReinsSaleListingBenchmark(region);
}
