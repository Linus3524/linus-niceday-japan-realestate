import assert from "node:assert/strict";
import { describeMlitSample, getBuyMarketEstimate, getModeledBuyYieldRate, getOfficialBuyEstimate, MLIT_ROLLING_WINDOWS, selectMlitWindow } from "../src/data/buyMarket.js";
import { rentRates, type LayoutCode } from "../src/data/housingMarket.js";
import { mlitBuySnapshotMeta, mlitBuySnapshots } from "../src/data/mlitBuySnapshot.js";

const layouts: LayoutCode[] = ["r1", "k1", "ldk1", "ldk2", "ldk3"];

assert.equal(mlitBuySnapshotMeta.status, "ready");
assert.ok(mlitBuySnapshots.length > 0, "MLIT snapshot must contain official transaction aggregates");
assert.ok(mlitBuySnapshotMeta.generatedAt, "MLIT snapshot must record its generation date");
assert.match(mlitBuySnapshotMeta.latestPeriod, /^\d{4}-Q[1-4]$/);
assert.equal(mlitBuySnapshotMeta.prefectureCount, 47, "official snapshot must cover all prefectures");
assert.ok(mlitBuySnapshotMeta.municipalityCount >= 490, "official snapshot must cover nationwide municipalities with sufficient samples");

const periodOrdinal = (period: string) => {
  const match = /^(\d{4})-Q([1-4])$/.exec(period)!;
  return Number(match[1]) * 4 + Number(match[2]) - 1;
};
const latestPeriodOrdinal = periodOrdinal(mlitBuySnapshotMeta.latestPeriod);

for (const row of mlitBuySnapshots) {
  assert.ok(row.sampleCount >= 5, `${row.district}/${row.layout} must meet the minimum sample threshold`);
  assert.ok(row.medianTradePriceYen > 0, `${row.district}/${row.layout} median must be positive`);
  assert.ok(row.medianSqmPriceYen > 0, `${row.district}/${row.layout} sqm median must be positive`);
  assert.ok(row.medianAreaSqm > 0, `${row.district}/${row.layout} median area must be positive`);
  assert.ok(row.buildingYearSampleCount >= 0 && row.buildingYearSampleCount <= row.sampleCount);
  for (const ageEntry of Object.values(row.ageBands)) {
    assert.ok(ageEntry.sampleCount >= 5, `${row.district}/${row.layout} age band must meet sample threshold`);
    assert.ok(ageEntry.medianSqmPriceYen > 0);
  }
  assert.match(row.periodStart, /^\d{4}-Q[1-4]$/);
  assert.match(row.periodEnd, /^\d{4}-Q[1-4]$/);
  assert.ok(MLIT_ROLLING_WINDOWS.includes(row.windowQuarters));
  // 統計期間規則：除了已經用到最長期間的格子，每一格都要達到目標筆數。
  assert.ok(row.windowQuarters === 16 || row.sampleCount >= 20, `${row.district}/${row.layout} 未達 20 筆卻沒有拉長統計期間`);
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
assert.equal(officialEstimate.medianSqmPriceYen, official.medianSqmPriceYen);

const ageControlledRow = mlitBuySnapshots.find(row => Object.keys(row.ageBands).length > 0)!;
const [ageBand, ageEntry] = Object.entries(ageControlledRow.ageBands)[0];
const representativeAge = ageBand === "age_0_10" ? 5
  : ageBand === "age_11_20" ? 15
    : ageBand === "age_21_30" ? 25
      : ageBand === "age_31_40" ? 35
        : 45;
const ageControlledEstimate = getBuyMarketEstimate({
  region: ageControlledRow.region,
  district: ageControlledRow.district,
  layout: ageControlledRow.layout,
  monthlyRentYen: 100_000,
  ageYears: representativeAge,
});
assert.equal(ageControlledEstimate.ageBand, ageBand);
assert.equal(ageControlledEstimate.medianSqmPriceYen, ageEntry!.medianSqmPriceYen);

const districtAgeFallback = getOfficialBuyEstimate("千葉", "市川市", "ldk1", 5);
assert.equal(districtAgeFallback?.ageBand, "age_0_10");
assert.equal(districtAgeFallback?.ageBandScope, "district");
assert.ok((districtAgeFallback?.ageBandSampleCount ?? 0) >= 5);
assert.ok((districtAgeFallback?.medianSqmPriceYen ?? 0) > 600_000);

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

// 統計期間選擇：樣本夠就用短期間，不夠才拉長。
const counts = (values: Record<number, number>) => (window: number) => values[window] ?? 0;
assert.equal(selectMlitWindow(counts({ 4: 20, 8: 40, 12: 60, 16: 80 })), 4);
assert.equal(selectMlitWindow(counts({ 4: 7, 8: 20, 12: 30, 16: 40 })), 8, "足立區 1R 這類 7 筆的格子要拉長");
assert.equal(selectMlitWindow(counts({ 4: 7, 8: 9, 12: 12, 16: 19 })), 16, "到最長仍不足 20 筆就用最長期間");
assert.equal(selectMlitWindow(counts({ 4: 1, 8: 2, 12: 3, 16: 4 })), null, "4 年仍不到 5 筆就不提供行情");
assert.deepEqual(describeMlitSample(8, 20), { period: "近 2 年", label: "近 2 年・20 筆", lowSample: false });
assert.equal(describeMlitSample(16, 9).lowSample, true);

const recentFourCount = mlitBuySnapshots.filter(row => row.windowQuarters === 4).length;
const recentEightCount = mlitBuySnapshots.filter(row => row.windowQuarters === 8).length;
console.log(`Buy market: ${mlitBuySnapshots.length} official aggregates cover ${mlitBuySnapshotMeta.prefectureCount} prefectures / ${mlitBuySnapshotMeta.municipalityCount} municipalities and all ${rentRates.length} legacy districts (${recentFourCount} recent-4Q, ${recentEightCount} recent-8Q)`);
