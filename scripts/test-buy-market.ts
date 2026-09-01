import assert from "node:assert/strict";
import { getBuyMarketEstimate, getModeledBuyYieldRate } from "../src/data/buyMarket.js";
import { rentRates, type LayoutCode } from "../src/data/housingMarket.js";
import { mlitBuySnapshotMeta, mlitBuySnapshots } from "../src/data/mlitBuySnapshot.js";

const layouts: LayoutCode[] = ["r1", "k1", "ldk1", "ldk2", "ldk3"];

assert.equal(mlitBuySnapshotMeta.status, "ready");
assert.ok(mlitBuySnapshots.length > 0, "MLIT snapshot must contain official transaction aggregates");
assert.ok(mlitBuySnapshotMeta.generatedAt, "MLIT snapshot must record its generation date");
assert.match(mlitBuySnapshotMeta.latestPeriod, /^\d{4}-Q[1-4]$/);

const periodOrdinal = (period: string) => {
  const match = /^(\d{4})-Q([1-4])$/.exec(period)!;
  return Number(match[1]) * 4 + Number(match[2]) - 1;
};
const latestPeriodOrdinal = periodOrdinal(mlitBuySnapshotMeta.latestPeriod);

for (const row of mlitBuySnapshots) {
  assert.ok(row.sampleCount >= 5, `${row.district}/${row.layout} must meet the minimum sample threshold`);
  assert.ok(row.medianTradePriceYen > 0, `${row.district}/${row.layout} median must be positive`);
  assert.match(row.periodStart, /^\d{4}-Q[1-4]$/);
  assert.match(row.periodEnd, /^\d{4}-Q[1-4]$/);
  assert.ok(row.windowQuarters === 4 || row.windowQuarters === 8);
  assert.ok(
    periodOrdinal(row.periodStart) >= latestPeriodOrdinal - row.windowQuarters + 1,
    `${row.district}/${row.layout} must stay inside its rolling window`
  );
}

for (const layout of layouts) {
  assert.ok(mlitBuySnapshots.some(row => row.layout === layout), `${layout} must have official coverage`);
}

const official = mlitBuySnapshots.find(row =>
  rentRates.some(rate => rate.region === row.region && rate.district === row.district)
)!;
const officialRent = rentRates.find(rate =>
  rate.region === official.region && rate.district === official.district
)!;
const officialEstimate = getBuyMarketEstimate({
  region: official.region,
  district: official.district,
  layout: official.layout,
  monthlyRentYen: parseFloat((officialRent[official.layout] || officialRent.ldk2) as string) * 10000
});
assert.equal(officialEstimate.source, "official_transaction");
assert.equal(officialEstimate.basePriceYen, official.medianTradePriceYen);
assert.equal(officialEstimate.sampleCount, official.sampleCount);

const keys = new Set(mlitBuySnapshots.map(row => `${row.region}|${row.district}|${row.layout}`));
for (const rate of rentRates) {
  assert.ok(
    layouts.some(layout => keys.has(`${rate.region}|${rate.district}|${layout}`)),
    `${rate.region}/${rate.district} must have official coverage for at least one layout`
  );
}
const fallback = rentRates.flatMap(rate => layouts.map(layout => ({ rate, layout })))
  .find(({ rate, layout }) => !keys.has(`${rate.region}|${rate.district}|${layout}`));
assert.ok(fallback, "At least one low-sample district/layout should retain a modeled fallback");
const monthlyRentYen = parseFloat((fallback.rate[fallback.layout] || fallback.rate.ldk2) as string) * 10000;
const fallbackEstimate = getBuyMarketEstimate({
  region: fallback.rate.region,
  district: fallback.rate.district,
  layout: fallback.layout,
  monthlyRentYen
});
assert.equal(fallbackEstimate.source, "rent_yield_model");
assert.equal(fallbackEstimate.sampleCount, 0);
assert.equal(fallbackEstimate.windowQuarters, 0);
assert.equal(
  fallbackEstimate.basePriceYen,
  monthlyRentYen * 12 / getModeledBuyYieldRate(fallback.rate.region, fallback.rate.district, fallback.layout)
);

const recentFourCount = mlitBuySnapshots.filter(row => row.windowQuarters === 4).length;
const recentEightCount = mlitBuySnapshots.filter(row => row.windowQuarters === 8).length;
console.log(`Buy market: ${mlitBuySnapshots.length} official aggregates cover all ${rentRates.length} districts (${recentFourCount} recent-4Q, ${recentEightCount} recent-8Q), with modeled fallback for insufficient samples`);
