import assert from "node:assert/strict";
import { getListingLocationContext } from "../src/lib/listingLocation.js";

// Overpass 全部端點失敗時要重試一輪；兩輪都失敗要明說，不能讓畫面看起來像「附近沒有超商」。

const LAT = 35.739849;
const LON = 139.767441;
const ENDPOINT_COUNT = 5;
const NOTICE = "地圖資料服務暫時沒有回應";

const osmElements = [
  { type: "node", lat: LAT + 0.001, lon: LON, tags: { shop: "convenience", name: "テストコンビニ" } },
  { type: "node", lat: LAT, lon: LON + 0.001, tags: { shop: "supermarket", name: "テストスーパー" } },
  { type: "node", lat: LAT - 0.001, lon: LON, tags: { leisure: "fitness_centre", name: "テストジム" } },
];

const originalFetch = globalThis.fetch;
const originalWarn = console.warn;
const originalKey = process.env.MLIT_REINFOLIB_API_KEY;
delete process.env.MLIT_REINFOLIB_API_KEY;

let overpassCalls = 0;
let failFirstCalls = 0;
let responseElements: unknown[] = osmElements;

globalThis.fetch = (async (input: RequestInfo | URL) => {
  const url = new URL(String(input));
  if (url.hostname === "msearch.gsi.go.jp") {
    const title = url.searchParams.get("q") || "";
    // 每個地址給不同座標，避免共用 Overpass 快取。
    const offset = title.includes("2-10-11") ? 0.002 : 0;
    const latOffset = title.endsWith(" 2") ? 0 : 0.0001;
    return Response.json([{ geometry: { coordinates: [LON + offset, LAT + latOffset] }, properties: { title } }]);
  }
  if (url.pathname.endsWith("/interpreter")) {
    overpassCalls++;
    if (overpassCalls <= failFirstCalls) throw new DOMException("timed out", "TimeoutError");
    return Response.json({ elements: responseElements });
  }
  throw new Error(`Unexpected request: ${url}`);
}) as typeof fetch;
console.warn = () => {};

try {
  // 第一輪全部逾時、第二輪成功：要拿到生活機能，也不該出現錯誤提示。
  failFirstCalls = ENDPOINT_COUNT;
  const recovered = await getListingLocationContext("東京都北区田端新町2-10-10", [], []);
  assert.ok(recovered, "地址應可定位");
  assert.ok(overpassCalls > ENDPOINT_COUNT, "第一輪失敗後必須再試一輪");
  const categories = new Set(recovered.amenities.map(item => item.category));
  for (const category of ["convenience", "supermarket", "fitness_centre"] as const) {
    assert.ok(categories.has(category), `重試成功後應有 ${category}`);
  }
  assert.ok(!recovered.notices.some(notice => notice.includes(NOTICE)), "重試成功不該顯示失敗提示");

  // 兩輪都失敗：其他結果照常回傳，並明確告知生活機能沒查到。
  overpassCalls = 0;
  failFirstCalls = Infinity;
  const failed = await getListingLocationContext("東京都北区田端新町2-10-11", [], []);
  assert.ok(failed, "Overpass 失敗不該讓整個位置分析失敗");
  assert.equal(overpassCalls, ENDPOINT_COUNT * 2, "只重試一輪，不可無限重試");
  assert.equal(failed.amenities.length, 0);
  assert.ok(failed.notices.some(notice => notice.includes(NOTICE)), "兩輪都失敗必須提示使用者");

  // 同名連鎖店：回傳順序遠的在前，也必須留下最近的分店。
  overpassCalls = 0;
  failFirstCalls = 0;
  responseElements = [
    { type: "node", lat: LAT + 0.0054, lon: LON + 0.002, tags: { shop: "convenience", name: "ファミリーマート" } },
    { type: "node", lat: LAT + 0.0055, lon: LON + 0.002, tags: { shop: "convenience", name: "セブン-イレブン" } },
    { type: "node", lat: LAT + 0.0009, lon: LON + 0.002, tags: { shop: "convenience", name: "ファミリーマート" } },
  ];
  const chains = await getListingLocationContext("東京都北区田端新町2-10-11 2", [], []);
  assert.ok(chains, "地址應可定位");
  const stores = chains.amenities.filter(item => item.category === "convenience");
  assert.equal(stores[0]?.name, "ファミリーマート", "最近的超商必須排第一");
  assert.ok(stores[0].distanceMeters < 150, `應保留約 100m 的分店，實際 ${stores[0]?.distanceMeters}m`);
  assert.equal(stores.length, 2, "同名分店只列最近一間");

  console.log("Overpass regression passed: retries once, reports unavailable amenities, keeps the nearest chain store.");
} finally {
  globalThis.fetch = originalFetch;
  console.warn = originalWarn;
  if (originalKey !== undefined) process.env.MLIT_REINFOLIB_API_KEY = originalKey;
}
