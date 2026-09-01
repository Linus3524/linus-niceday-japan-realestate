import assert from "node:assert/strict";
import { MLIT_API_CREDIT, marketDataSources } from "../src/data/marketDataSources.js";
import { mlitBuySnapshotMeta, mlitBuySnapshots } from "../src/data/mlitBuySnapshot.js";

const byId = new Map(marketDataSources.map(source => [source.id, source]));
assert.equal(byId.get("athome-public")?.automatedIngestionAllowed, true);
assert.equal(byId.get("athome-public")?.ingestionStatus, "enabled");
for (const id of ["suumo-public", "homes-public"] as const) {
  assert.equal(byId.get(id)?.automatedIngestionAllowed, false, `${id} is manual comparison only`);
  assert.equal(byId.get(id)?.ingestionStatus, "manual_only");
}

assert.equal(byId.get("mlit-reinfolib")?.automatedIngestionAllowed, true);
assert.equal(byId.get("mlit-reinfolib")?.ingestionStatus, "enabled");
assert.match(MLIT_API_CREDIT, /最新性、正確性、完全性等が保証されたものではありません/);
assert.equal(mlitBuySnapshotMeta.status, "ready");
assert.ok(mlitBuySnapshots.length > 0);

console.log(`Market source policy: ${marketDataSources.length} sources; MLIT buy rows: ${mlitBuySnapshots.length}`);
