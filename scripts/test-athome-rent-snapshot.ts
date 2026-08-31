import assert from "node:assert/strict";
import { atHomeRentSnapshotMeta, atHomeRentSnapshots } from "../src/data/atHomeRentSnapshot.js";
import { rentRates } from "../src/data/housingMarket.js";

const groupedLayouts = {
  r1: ["oneRoom"],
  k1: ["k1", "dk1"],
  ldk1: ["ldk1", "k2", "dk2"],
  ldk2: ["ldk2", "k3", "dk3"],
  ldk3: ["ldk3", "k4", "dk4"]
} as const;

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
};

assert.equal(atHomeRentSnapshots.length, 210, "At Home snapshot must cover every site district");
assert.equal(new Set(atHomeRentSnapshots.map(row => `${row.region}|${row.district}`)).size, 210, "district keys must be unique");

for (const row of atHomeRentSnapshots) {
  assert.match(row.sourceUrl, /^https:\/\/www\.athome\.co\.jp\/chintai\/souba\//);
  for (const layout of ["r1", "k1", "ldk1", "ldk2", "ldk3"] as const) {
    assert.ok(Number.isInteger(row[layout]) && row[layout] > 0, `${row.district} ${layout} must be a positive monthly rent`);
  }
  assert.equal(Object.keys(row.detailedRents).length, 13, `${row.district} must preserve all detailed layout slots`);
  for (const [layout, detailedLayouts] of Object.entries(groupedLayouts) as Array<[
    keyof typeof groupedLayouts,
    (typeof groupedLayouts)[keyof typeof groupedLayouts]
  ]>) {
    if (row.fallbackLayouts?.includes(layout)) continue;
    const available = detailedLayouts
      .map(detail => row.detailedRents[detail])
      .filter((value): value is number => value !== null);
    assert.ok(available.length > 0, `${row.district} ${layout} must have a detailed source value`);
    assert.equal(row[layout], median(available), `${row.district} ${layout} must equal the detailed-layout median`);
  }
}

const fallbacks = atHomeRentSnapshots.flatMap(row => (row.fallbackLayouts || []).map(layout => `${row.district}|${layout}`));
assert.deepEqual(fallbacks, ["札幌市清田區|r1"], "unexpected At Home layout fallback");
assert.equal(rentRates.length, 210);
assert.equal(rentRates.filter(row => row.verificationStatus === "verified_source").length, 209);
assert.equal(rentRates.filter(row => row.verificationStatus === "researched_limited").length, 1);
assert.ok(rentRates.every(row => row.sourceDate === atHomeRentSnapshotMeta.capturedAt));
assert.ok(rentRates.every(row => [row.r1, row.k1, row.ldk1, row.ldk2, row.ldk3]
  .every(value => /^\d+(?:\.\d)?$/.test(value || ""))), "display rent values must use at most one decimal place");
assert.equal(atHomeRentSnapshots.filter(row => row.detailedRents.ldk3 !== null).length, 210, "3LDK must cover all districts");

console.log(`At Home rent snapshot: ${atHomeRentSnapshots.length} districts, ${atHomeRentSnapshots.length * 5 - fallbacks.length} sourced layout groups, ${fallbacks.length} fallback`);
