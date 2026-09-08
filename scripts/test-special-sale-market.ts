import assert from "node:assert/strict";
import { atHomeSpecialSaleSnapshotMeta } from "../src/data/atHomeSpecialSaleSnapshot.js";
import { mlitSpecialSaleSnapshotMeta } from "../src/data/mlitSpecialSaleSnapshot.js";
import { getSpecialSaleMarketComparison } from "../src/data/specialSaleMarket.js";

assert.ok(atHomeSpecialSaleSnapshotMeta.detachedMarketCount >= 1_400);
assert.ok(atHomeSpecialSaleSnapshotMeta.landMarketCount >= 1_400);
assert.ok(mlitSpecialSaleSnapshotMeta.detachedBucketCount >= 4_000);
assert.ok(mlitSpecialSaleSnapshotMeta.landBucketCount >= 4_000);

const house = getSpecialSaleMarketComparison({
  kind: "detached",
  address: "東京都豊島区長崎三丁目",
  salePriceYen: 75_800_000,
  areaSqm: 91.08,
  ageYears: 5,
});
assert.ok(house);
assert.equal(house.market, "東京都豐島區");
assert.equal(house.areaBand, "80～100㎡");
assert.ok(house.officialSampleCount >= 5);
assert.ok(house.officialPriceYen > 0);
assert.ok(house.listingPriceYen && house.listingPriceYen > 0);
assert.equal(house.ageControlled, true);

const land = getSpecialSaleMarketComparison({
  kind: "land",
  address: "東京都練馬区豊玉北",
  salePriceYen: 65_000_000,
  areaSqm: 100,
});
assert.ok(land);
assert.equal(land.market, "東京都練馬區");
assert.equal(land.areaBand, "100～150㎡");
assert.ok(land.officialPriceYen > 0);
assert.ok(land.listingPriceYen && land.listingPriceYen > 0);

assert.equal(getSpecialSaleMarketComparison({
  kind: "land", address: "地址不明", salePriceYen: 10_000_000, areaSqm: 100,
}), null);

console.log("Special-sale market: detached and land MLIT + At Home comparisons passed");
