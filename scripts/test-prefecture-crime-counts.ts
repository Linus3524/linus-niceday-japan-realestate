import assert from "node:assert/strict";
import { getPrefectureCrimeBreakdown } from "../src/lib/prefectureCrimeBreakdown.js";
import { crimePrefectureRows, crimePrefectureMeta } from "../src/data/crimePrefectureSnapshot.js";

let national = 0;
for (const prefecture of crimePrefectureRows) {
  const data = getPrefectureCrimeBreakdown(prefecture.prefecture, crimePrefectureMeta.fiscalYear);
  assert.ok(data, prefecture.prefecture);
  assert.equal(data.groups.length, 6);
  assert.equal(data.groups.reduce((sum, group) => sum + group.count, 0), data.total);
  for (const group of data.groups) {
    assert.equal(group.items.reduce((sum, item) => sum + item.count, 0), group.count, `${prefecture.prefecture}/${group.code}`);
    for (const item of group.items) assert.ok(Number.isInteger(item.count) && item.count >= 0);
    const previous = group.code === "C" ? prefecture.theftSharePercent : group.code === "B" ? prefecture.violentSharePercent : group.code === "A" ? prefecture.felonySharePercent : null;
    if (previous !== null) assert.ok(Math.abs(group.percent - previous) <= 0.006, `${prefecture.prefecture}/${group.code} matches e-Stat share`);
  }
  assert.ok(Math.abs(data.groups.reduce((sum, group) => sum + group.percent, 0) - 100) < 1e-8);
  national += data.total;
}
assert.equal(national, 703351, "NPA 2023 national total");
assert.equal(getPrefectureCrimeBreakdown("千葉県", "2023年度")?.total, 37538);
assert.equal(getPrefectureCrimeBreakdown("千葉県", "2024年度"), null, "do not mix years");
assert.equal(getPrefectureCrimeBreakdown("不存在県", "2023年度"), null);
console.log("47 prefectures: detail/category/national totals and existing e-Stat proportions reconciled; year fallback passed.");
