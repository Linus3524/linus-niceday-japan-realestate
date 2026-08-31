import assert from "node:assert/strict";
import { getBuyMarketEstimate, getModeledBuyYieldRate } from "../src/data/buyMarket.js";
import { rentRates, type LayoutCode } from "../src/data/housingMarket.js";
import { mlitBuySnapshots } from "../src/data/mlitBuySnapshot.js";

const sample = rentRates.find(row => row.district === "新宿區") || rentRates[0];
const layouts: LayoutCode[] = ["r1", "k1", "ldk1", "ldk2", "ldk3"];

assert.equal(mlitBuySnapshots.length, 0, "MLIT snapshot should remain empty until the API is available");

for (const layout of layouts) {
  const monthlyRentYen = parseFloat((sample[layout] || sample.ldk2) as string) * 10000;
  const estimate = getBuyMarketEstimate({
    region: sample.region,
    district: sample.district,
    layout,
    monthlyRentYen
  });
  assert.equal(estimate.source, "rent_yield_model");
  assert.equal(estimate.sampleCount, 0);
  assert.equal(
    estimate.basePriceYen,
    monthlyRentYen * 12 / getModeledBuyYieldRate(sample.region, sample.district, layout)
  );
  assert.ok(estimate.basePriceYen > 0, `${layout} modeled buy price must be positive`);
}

console.log(`Buy market fallback: ${layouts.length} layouts use the shared rent-yield model while MLIT is unavailable`);
