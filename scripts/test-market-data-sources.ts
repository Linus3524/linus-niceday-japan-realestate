import assert from "node:assert/strict";
import { MLIT_API_CREDIT, marketDataSources } from "../src/data/marketDataSources.js";
import { mlitBuySnapshotMeta, mlitBuySnapshots } from "../src/data/mlitBuySnapshot.js";
import { atHomeSaleSnapshotMeta, atHomeSaleSnapshots } from "../src/data/atHomeSaleSnapshot.js";
import { atHomeSpecialSaleSnapshotMeta, atHomeSpecialSaleSnapshots } from "../src/data/atHomeSpecialSaleSnapshot.js";
import { mlitSpecialSaleSnapshotMeta, mlitSpecialSaleSnapshots } from "../src/data/mlitSpecialSaleSnapshot.js";

const byId = new Map(marketDataSources.map(source => [source.id, source]));
assert.equal(byId.get("athome-public")?.automatedIngestionAllowed, true);
assert.equal(byId.get("athome-public")?.ingestionStatus, "enabled");
for (const id of ["suumo-public", "homes-public"] as const) {
  assert.equal(byId.get(id)?.automatedIngestionAllowed, false, `${id} is manual comparison only`);
  assert.equal(byId.get(id)?.ingestionStatus, "manual_only");
}

assert.equal(byId.get("reins-market-watch")?.automatedIngestionAllowed, false);
assert.equal(byId.get("reins-market-watch")?.ingestionStatus, "manual_only");
assert.deepEqual(byId.get("reins-market-watch")?.kinds, ["transaction", "sale_listing"]);

assert.equal(byId.get("mlit-reinfolib")?.automatedIngestionAllowed, true);
assert.equal(byId.get("mlit-reinfolib")?.ingestionStatus, "enabled");
assert.match(MLIT_API_CREDIT, /最新性、正確性、完全性等が保証されたものではありません/);
assert.equal(mlitBuySnapshotMeta.status, "ready");
assert.ok(mlitBuySnapshots.length > 0);
assert.equal(mlitBuySnapshotMeta.prefectureCount, 47);
assert.equal(atHomeSaleSnapshotMeta.targetMarketCount, mlitBuySnapshotMeta.municipalityCount);
assert.ok(atHomeSaleSnapshotMeta.coveredMarketCount / atHomeSaleSnapshotMeta.targetMarketCount > 0.95);
assert.equal(atHomeSaleSnapshots.length, atHomeSaleSnapshotMeta.coveredMarketCount);
assert.ok(atHomeSaleSnapshotMeta.layoutValueCount > 1_500);
assert.ok(atHomeSpecialSaleSnapshotMeta.detachedMarketCount >= 1_400);
assert.ok(atHomeSpecialSaleSnapshotMeta.landMarketCount >= 1_400);
assert.equal(atHomeSpecialSaleSnapshots.length, atHomeSpecialSaleSnapshotMeta.detachedMarketCount + atHomeSpecialSaleSnapshotMeta.landMarketCount);
assert.ok(mlitSpecialSaleSnapshotMeta.detachedBucketCount >= 4_000);
assert.ok(mlitSpecialSaleSnapshotMeta.landBucketCount >= 4_000);
assert.equal(mlitSpecialSaleSnapshots.length, mlitSpecialSaleSnapshotMeta.detachedBucketCount + mlitSpecialSaleSnapshotMeta.landBucketCount);

console.log(`Market source policy: ${marketDataSources.length} sources; condo MLIT: ${mlitBuySnapshots.length} rows; detached/land MLIT: ${mlitSpecialSaleSnapshots.length} rows; At Home condo: ${atHomeSaleSnapshotMeta.coveredMarketCount} markets; detached/land: ${atHomeSpecialSaleSnapshots.length} markets`);
