import assert from "node:assert/strict";
import { analyzeNeighborhood, type ActivityElement } from "../src/lib/neighborhoodActivity.js";
const origin = { lat: 35.6, lon: 140.1 };
const items = (n: number, tags: Record<string, string>, offset = 0): ActivityElement[] =>
  Array.from({ length: n }, (_, i) => ({ type: "node", id: i + offset, ...origin, tags }));
const analyze = (rows: ActivityElement[] | null, precise = true) => analyzeNeighborhood(rows, origin, precise);
assert.equal(analyze(null).status, "unavailable");
assert.equal(analyze([]).level, null, "empty data is not quiet");
assert.equal(analyze(items(60, { shop: "convenience" }), false).status, "imprecise");
assert.equal(analyze(items(40, { shop: "convenience" })).level, 4);
assert.equal(analyze(items(40, { shop: "convenience" })).entertainment, 0, "convenience stores are not nightlife");
assert.equal(analyze(items(20, { amenity: "bar" })).level, 5);
assert.equal(analyze(items(20, { building: "house" })).level, 2, "positive residential evidence can establish residential character, not quietness");
assert.equal(analyze([...items(5, { building: "apartments" }), ...items(8, { amenity: "cafe" }, 100)]).level, 3);
// 日本 OSM 建物幾乎都是國土地理院匯入的 building=yes（川口市中青木 250m 內 705 棟有 699 棟），
// 必須算進住宅建物，否則全國大部分地址都會變「待確認」；明確非住宅用途則不算。
assert.equal(analyze(items(30, { building: "yes" })).level, 2, "building=yes 要視為住宅建物密度的證據");
assert.equal(analyze([...items(30, { building: "yes" }), ...items(10, { shop: "convenience" }, 100)]).level, 3);
assert.equal(analyze(items(30, { building: "retail" })).residential, 0, "明確非住宅用途不算住宅");
const duplicate = items(1, { shop: "supermarket", name: "同一店" });
assert.equal(analyze([...duplicate, ...duplicate, { ...duplicate[0], type: "way", id: 9 }]).commercial, 1);
assert.equal(analyze(items(50, { shop: "vacant" })).level, null);
assert.equal(analyze(items(50, { shop: "supermarket", disused: "yes" })).commercial, 0);
assert.equal(analyze(items(50, { shop: "supermarket" }).map(i => ({ ...i, lat: 36 }))).commercial, 0);
assert.equal(analyze(items(1, { amenity: "bar" })).aroundTheClock, 0, "venue category cannot establish hours");
assert.equal(analyze(items(1, { shop: "convenience", opening_hours: "24/7" })).aroundTheClock, 1);
assert.equal(analyze(items(1, { shop: "convenience", opening_hours: "24/7; PH off" })).aroundTheClock, 0);
console.log("Neighborhood activity: sparse data, precision, category, deduplication, radius and hours checks passed.");
