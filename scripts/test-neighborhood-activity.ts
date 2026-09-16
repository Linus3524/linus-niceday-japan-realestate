import assert from "node:assert/strict";
import {
  analyzeNeighborhood,
  classifyLandUse,
  type ActivityElement,
  type LandUseZone,
  type OfficialContext,
} from "../src/lib/neighborhoodActivity.js";
const origin = { lat: 35.6, lon: 140.1 };
const items = (n: number, tags: Record<string, string>, offset = 0): ActivityElement[] =>
  Array.from({ length: n }, (_, i) => ({ type: "node", id: i + offset, ...origin, tags }));
const analyze = (rows: ActivityElement[] | null, precise = true, official: OfficialContext = {}) =>
  analyzeNeighborhood(rows, origin, precise, new Date().toISOString(), official);
const zone = (name: string): LandUseZone => ({
  zone: name, zoneId: null, floorAreaRatio: "200%", buildingCoverageRatio: "60%",
  city: "川口市", ...classifyLandUse(name),
});
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

// 用途地域系別分類：名稱同時含「住居」與其他關鍵字時，一律以住居系為準。
assert.deepEqual(classifyLandUse("第一種低層住居専用地域"), { residentialZone: true, commercialZone: false, industrialZone: false });
assert.deepEqual(classifyLandUse("近隣商業地域"), { residentialZone: false, commercialZone: true, industrialZone: false });
assert.deepEqual(classifyLandUse("準工業地域"), { residentialZone: false, commercialZone: false, industrialZone: true });
assert.deepEqual(classifyLandUse("準住居地域"), { residentialZone: true, commercialZone: false, industrialZone: false }, "準住居地域屬住居系，不可因『準』字誤判為工業");

// 官方資料後援：OSM 收錄不足（零建物零店家）時，法定用途地域＋國勢調查人口仍可支撐判定。
const densePopulation = { denselyInhabited: true, densityPerSquareKm: 10750, meshPopulation: 1545 };
assert.equal(analyze([], true, { landUse: zone("第一種住居地域"), population: densePopulation }).level, 2,
  "住居系用途地域＋人口集中地區可支撐住宅為主");
assert.equal(analyze([], true, { landUse: zone("第一種住居地域"), population: { denselyInhabited: false, densityPerSquareKm: null, meshPopulation: 1545 } }).level, 2,
  "非 DID 但網格人口足夠也算住宅為主");
assert.equal(analyze([], true, { landUse: zone("第一種住居地域"), population: { denselyInhabited: false, densityPerSquareKm: null, meshPopulation: 20 } }).level, null,
  "住居系地域但幾乎無人居住時不推估");
assert.equal(analyze(items(10, { shop: "convenience" }), true, { landUse: zone("第一種住居地域"), population: densePopulation }).level, 3,
  "住居系地域已收錄足量店家時如實呈現住商混合");
// 川口市中青木實測案例：準工業地域、DID 10,750 人/km²、250m 網格 1,545 人。
assert.equal(analyze(items(5, { shop: "convenience" }), true, { landUse: zone("準工業地域"), population: densePopulation }).level, 3,
  "準工業地域＋人口集中地區＋有店家＝住商混合的既成市街地");
assert.equal(analyze([], true, { landUse: zone("準工業地域"), population: densePopulation }).level, null,
  "工業系地域沒有任何商業場所佐證時不推估");
assert.equal(analyze(items(40, { shop: "convenience" }), true, { landUse: zone("第一種低層住居専用地域"), population: densePopulation }).level, 4,
  "官方後援不得覆蓋地圖實證的熱鬧商圈");

// 官方欄位一律回傳，供 UI 顯示；粗定位時仍附帶但不推估等級。
const withOfficial = analyze([], true, { landUse: zone("準工業地域"), population: densePopulation, careFacilities: 28 });
assert.equal(withOfficial.landUse?.zone, "準工業地域");
assert.equal(withOfficial.population?.densityPerSquareKm, 10750);
assert.equal(withOfficial.careFacilities, 28);
const imprecise = analyze([], false, { landUse: zone("第一種住居地域"), population: densePopulation });
assert.equal(imprecise.status, "imprecise");
assert.equal(imprecise.level, null, "粗定位不因官方資料而推估等級");
assert.equal(imprecise.landUse?.zone, "第一種住居地域", "粗定位仍應提供官方用途地域供閱讀");

console.log("Neighborhood activity: sparse data, precision, category, deduplication, radius, hours, land-use and population checks passed.");
