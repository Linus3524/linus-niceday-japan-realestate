import assert from "node:assert/strict";
import { stripStationOperatorPrefix } from "../src/lib/listingExtraction.js";
import { parseTransitStations } from "../src/lib/transitParser.js";
import { distanceMeters, getListingLocationContext, nearestStationForAddress } from "../src/lib/listingLocation.js";
import listingLocationHandler from "../api/listing-location.js";
import { originWalkIssue } from "../src/lib/commuteValidation.js";

assert.ok(originWalkIssue(62, 6), "圖紙6分但計算62分必須攔截");
assert.ok(originWalkIssue(2, 30), "異常偏短也必須核對");
for (const invalid of [undefined, null, 0, -1, NaN, Infinity, "9"]) assert.ok(originWalkIssue(invalid));
assert.ok(originWalkIssue(62), "沒有圖紙依據的長步行必須核對");
assert.equal(originWalkIssue(9, 6), null, "正常步速差異不攔截");
assert.equal(originWalkIssue(32, 28), null);
assert.equal(originWalkIssue(62, 60), null, "圖紙確實記載長步行，不可硬改數字");

// 東武練馬などの正式駅名を、別の実在駅へ短縮してはいけない。
for (const name of ["東武練馬", "西武新宿", "京成高砂", "京急蒲田", "小田急相模原", "京王八王子"]) {
  assert.equal(stripStationOperatorPrefix(`${name}駅`), name);
}
for (const [input, expected] of [
  ["東武東上線 東武練馬駅", "東武練馬"],
  ["東武東上線東武練馬駅", "東武練馬"],
  ["東武 東武練馬駅", "東武練馬"],
  ["ＪＲ総武線 『大久保』駅", "大久保"],
  ["JR新宿駅", "新宿"],
  ["東京メトロ新宿駅", "新宿"],
]) assert.equal(stripStationOperatorPrefix(input), expected);

const parsed = parseTransitStations("東武東上線 東武練馬駅 徒歩6分\n都営三田線 西台 徒歩28分\n東京メトロ副都心線 平和台 徒歩30分");
assert.deepEqual(parsed.map(item => [stripStationOperatorPrefix(item.stationName), item.walkMin]), [
  ["東武練馬", 6], ["西台", 28], ["平和台", 30],
]);

// 固定の座標・プロバイダー応答で、同じ図磚を再利用した場合も住所ごとに距離を再計算する。
const originalFetch = globalThis.fetch;
const originalKey = process.env.MLIT_REINFOLIB_API_KEY;
process.env.MLIT_REINFOLIB_API_KEY = "test-only";
const coordinates: Record<string, [number, number]> = {
  "東京都千代田区東神田2-6-2": [139.783, 35.697],
  "東京都千代田区神田多町2-8-20": [139.770, 35.694],
  "東京都板橋区徳丸2-18-36": [139.663, 35.772],
};
let mlitRequests = 0;
const features = () => [
  { properties: { S12_001_ja: "浅草橋" }, geometry: { coordinates: [[139.784, 35.697], [139.785, 35.697]] } },
  { properties: { S12_001_ja: "小川町" }, geometry: { coordinates: [[139.767, 35.696], [139.770, 35.695]] } },
  { properties: { S12_001_ja: "東武練馬" }, geometry: { coordinates: [[139.663, 35.769]] } },
];
globalThis.fetch = async (input) => {
  const url = new URL(String(input));
  if (url.hostname === "msearch.gsi.go.jp") {
    const point = coordinates[url.searchParams.get("q") || ""];
    assert.ok(point, `Unexpected geocoding query: ${url}`);
    return Response.json([{ geometry: { coordinates: point }, properties: { title: url.searchParams.get("q") } }]);
  }
  if (url.pathname.endsWith("/XKT015")) {
    mlitRequests++;
    return Response.json({ features: features() });
  }
  if (url.hostname === "www.reinfolib.mlit.go.jp") return Response.json({ features: [] });
  if (url.pathname.endsWith("/interpreter")) {
    // OSMが「練馬」しか返さなくても、図紙の「東武練馬」に部分一致させない。
    return Response.json({ elements: [{ lat: 35.738, lon: 139.654, tags: { railway: "station", name: "練馬" } }] });
  }
  if (url.pathname.includes("/route/v1/")) {
    const [from, to] = url.pathname.split("/").at(-1)!.split(";").map(pair => {
      const [lon, lat] = pair.split(",").map(Number);
      return { lat, lon };
    });
    return Response.json({ routes: [{ distance: Math.round(distanceMeters(from, to) * 1.2) }] });
  }
  throw new Error(`Unexpected network request: ${url}`);
};

try {
  const first = await nearestStationForAddress("東京都千代田区東神田2-6-2");
  const second = await nearestStationForAddress("東京都千代田区神田多町2-8-20");
  assert.equal(first?.station, "浅草橋");
  assert.equal(second?.station, "小川町", "換地址後不能沿用上一個地址的最近站");
  assert.equal(mlitRequests, 1, "兩個地址應共用同一圖磚的原始資料快取");
  assert.ok(second!.normalMinutes < 10, "站點線段的最近座標也必須按新地址重算");

  const context = await getListingLocationContext("東京都板橋区徳丸2-18-36", ["東武練馬"], [6]);
  const origin = context?.stationWalks[0];
  assert.equal(origin?.station, "東武練馬");
  assert.equal(origin?.source, "flyer");
  assert.equal(origin?.advertisedMinutes, 6);
  assert.ok(origin!.normalMinutes < 15, "東武練馬不可錯用練馬的座標算成步行一小時");
  assert.equal(origin?.lat, 35.769);

  // 同一個 API 請求實際接上本地路線引擎，確認前端收到的站名、步行與總時間一致。
  let responseBody: any;
  let statusCode = 200;
  const res = {
    setHeader() {},
    status(code: number) { statusCode = code; return this; },
    json(body: unknown) { responseBody = body; return this; },
  };
  await listingLocationHandler({ method: "POST", headers: {}, body: {
    mode: "commute", originStation: origin!.station, originWalkMinutes: origin!.normalMinutes,
    addressContext: "東京都板橋区徳丸2-18-36", destination: "東京都千代田区神田多町2-8-20",
  } }, res);
  assert.equal(statusCode, 200);
  assert.equal(responseBody.found, true);
  const commute = responseBody.commute;
  assert.equal(commute.route.originStation, "東武練馬");
  assert.equal(commute.route.destinationStation, "小川町");
  assert.match(commute.route.segments[0].lineName, /東上線/);
  assert.equal(commute.totalMinutes, commute.originWalkMinutes + commute.transitMinutes + commute.destinationWalkMinutes);
  for (const originWalkMinutes of [undefined, 0, 62]) {
    await listingLocationHandler({ method: "POST", headers: {}, body: {
      mode: "commute", originStation: "東武練馬", originWalkMinutes, originAdvertisedMinutes: 6,
      destination: "小川町駅",
    } }, res);
    assert.equal(statusCode, 422, "API也必須拒絕異常或缺漏步行時間");
    assert.ok(responseBody.error);
    assert.equal(responseBody.commute, undefined, "不可回傳可疑總時間");
  }
  console.log("Listing commute regression passed: station names, exact coordinates, address cache and API route.");
} finally {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.MLIT_REINFOLIB_API_KEY;
  else process.env.MLIT_REINFOLIB_API_KEY = originalKey;
}
