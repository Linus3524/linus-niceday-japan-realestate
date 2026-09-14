/**
 * 交通解析格式迴歸測試。
 *
 * 背景：曾發生「都営大江戸線『両国』徒歩1分」與「中央・総武線各停『両国』徒歩6分」
 * 同時刊載時，JR 総武線整條在 5 個層級被連鎖排除而完全消失。
 * 修復時又因把「徒」「歩」放進站名排除集，讓御徒町／新御徒町／仲御徒町整列解析不出來。
 *
 * 這兩類 bug 都是「靜默漏失」——不會拋錯、不會少欄位，只會少一條路線，
 * 因此必須用 golden fixture 把所有真實排版格式固定下來。
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseTransitStations } from "../src/lib/transitParser.js";
import { reconcileRentalListingText } from "../src/lib/rentalListingReconciliation.js";
import { normalizeLineKey, isPlausibleStationToken } from "../src/lib/transitPatterns.js";
import { osmStationPoints, nearestOfficialStation } from "../src/lib/listingLocation.js";

type ExpectedLeg = { lineName?: string | null; stationName: string; walkMin: number | null };
type FormatCase = { label: string; transitAccess: string; expect: ExpectedLeg[] };
type FallbackCase = { label: string; station: string; walkTime: string; expect: ExpectedLeg[] };

const here = dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(readFileSync(join(here, "fixtures/transit-formats.json"), "utf8")) as {
  cases: FormatCase[];
  fallbackCases: FallbackCase[];
};

let checked = 0;

// ── 1. transitAccess 逐格式解析 ──
for (const testCase of fixture.cases) {
  const parsed = parseTransitStations(testCase.transitAccess, null, null);
  assert.equal(
    parsed.length,
    testCase.expect.length,
    `[${testCase.label}] 動線數應為 ${testCase.expect.length}，實際 ${parsed.length}：`
      + JSON.stringify(parsed.map(p => `${p.lineName}|${p.stationName}|${p.walkMin}`))
  );

  testCase.expect.forEach((expected, index) => {
    const actual = parsed[index];
    assert.equal(actual.stationName, expected.stationName, `[${testCase.label}] 第 ${index + 1} 條動線站名不符`);
    assert.equal(actual.walkMin, expected.walkMin, `[${testCase.label}] 第 ${index + 1} 條動線徒步時間不符`);
    if (expected.lineName === null) {
      // 圖紙未載明路線時，仍必須由圖資補足非空路線名。
      assert.ok(
        actual.lineName && actual.lineName.trim().length > 0,
        `[${testCase.label}] 第 ${index + 1} 條動線應由圖資補足路線名`
      );
    } else {
      assert.equal(actual.lineName, expected.lineName, `[${testCase.label}] 第 ${index + 1} 條動線路線名不符`);
    }
  });
  checked++;
}

// ── 2. station/walkTime fallback 路徑 ──
for (const testCase of fixture.fallbackCases) {
  const parsed = parseTransitStations(null, testCase.station, testCase.walkTime);
  assert.equal(
    parsed.length,
    testCase.expect.length,
    `[${testCase.label}] 動線數應為 ${testCase.expect.length}，實際 ${parsed.length}`
  );
  testCase.expect.forEach((expected, index) => {
    assert.equal(parsed[index].stationName, expected.stationName, `[${testCase.label}] 站名不符`);
    assert.equal(parsed[index].walkMin, expected.walkMin, `[${testCase.label}] 徒步時間不符`);
  });
  checked++;
}

console.log(`Transit format fixture: ${checked} 個排版格式全部通過。`);

// ── 3. 路線名正規化鍵 ──
// 同一條服務的不同寫法必須同鍵；不同月台的服務必須不同鍵。
assert.equal(normalizeLineKey("JR中央・総武線各停"), normalizeLineKey("総武線各停"));
assert.equal(normalizeLineKey("中央・総武線各停"), normalizeLineKey("中央線各停"));
assert.equal(normalizeLineKey("JR山手線"), normalizeLineKey("山手線"));
assert.equal(normalizeLineKey("東武スカイツリーライン"), normalizeLineKey("東武伊勢崎線"));
assert.notEqual(normalizeLineKey("中央・総武線各停"), normalizeLineKey("総武快速線"),
  "各停與快速是不同月台與不同所要時間，不可視為同一條動線");
assert.notEqual(normalizeLineKey("都営大江戸線"), normalizeLineKey("都営新宿線"));

// ── 4. 非車站 token 過濾 ──
// 含設施字樣的正式站名不可被誤擋（這是實測踩過的坑）。
for (const station of [
  "御徒町", "新御徒町", "仲御徒町", "両国",
  "お台場海浜公園", "戸田公園", "葛西臨海公園",
  "鎌倉高校前", "都立大学", "学芸大学", "羽沢横浜国大",
]) {
  assert.ok(isPlausibleStationToken(station), `${station} 應被判定為合法站名`);
}
for (const token of ["バス停", "コンビニまで", "123", "スーパー", "薬局"]) {
  assert.ok(!isPlausibleStationToken(token), `${token} 不應被判定為車站`);
}

console.log("Line-key normalization and station-token guards passed.");

// ── 5. PDF 文字層對位（rentalListingReconciliation）──
const multiRoute = reconcileRentalListingText(
  { dealType: "rent" },
  "交通 都営大江戸線 両国 徒歩1分\n中央・総武線各停 両国 徒歩6分\n賃料 172,000円"
);
assert.equal(multiRoute.station, "両国,両国", "同站兩條路線都必須保留");
assert.equal(multiRoute.walkTime, "1,6");

// 含「徒」字站名在 PDF 文字層同樣不可漏。
const okachimachi = reconcileRentalListingText(
  { dealType: "rent" },
  "交通 JR山手線 御徒町 徒歩3分\n都営大江戸線 新御徒町 徒歩8分\n賃料 150,000円"
);
assert.equal(okachimachi.station, "御徒町,新御徒町", "含「徒」字的站名不可被字元類別排除");
assert.equal(okachimachi.walkTime, "3,8");

console.log("Rental PDF layout transit reconciliation passed.");

// ── 6. 地圖節點對位（站體聚類與路線判定）──
// 舊版用 `hasSubway ? "subway" : "surface"` 當 key，key 空間上限只有 2，
// 導致三條以上路線的共構站必然碰撞。改為依實體距離聚類後須驗證兩個方向都正確。
const origin = { lat: 35.6960, lon: 139.7930 };
const osmNode = (name: string, lat: number, lon: number, subway: boolean) => ({
  tags: subway
    ? { railway: "station", "name:ja": name, station: "subway", subway: "yes" }
    : { railway: "station", "name:ja": name, train: "yes" },
  lat,
  lon,
});

// 両国：都営地下鐵與 JR 站體相距約 450m，必須保留為兩個獨立節點。
const ryogoku = osmStationPoints(
  [osmNode("両国", 35.6935, 139.7935, true), osmNode("両国", 35.6960, 139.7985, false)],
  origin
);
assert.equal(ryogoku.length, 2, "実體分離的同名站（都営 vs JR 両国）必須保留為兩個節點");
assert.ok(
  nearestOfficialStation(ryogoku, "両国", "都営大江戸線")?.hasSubway,
  "都営大江戸線應對位到地下鐵站體"
);
assert.ok(
  nearestOfficialStation(ryogoku, "両国", "中央・総武線各停")?.hasSurfaceRail,
  "総武線應對位到地面站體"
);

// 永田町：有楽町線與半蔵門線同一改札內，應合併為單一節點且旗標取聯集。
const nagatacho = osmStationPoints(
  [osmNode("永田町", 35.6800, 139.7400, true), osmNode("永田町", 35.68005, 139.74015, true)],
  origin
);
assert.equal(nagatacho.length, 1, "同一改札內的多條地下鐵應合併為單一站體");

// 御徒町：山手線與京浜東北線共用月台，應合併。
const okachimachiNodes = osmStationPoints(
  [osmNode("御徒町", 35.7075, 139.7745, false), osmNode("御徒町", 35.70755, 139.77455, false)],
  origin
);
assert.equal(okachimachiNodes.length, 1, "共用月台的兩條地面路線應合併為單一站體");

// 路線關鍵字：省略「東京メトロ」前綴的地下鐵線名也必須正確判定。
const meguro = osmStationPoints(
  [osmNode("目黒", 35.6330, 139.7150, true), osmNode("目黒", 35.6345, 139.7175, false)],
  origin
);
assert.ok(nearestOfficialStation(meguro, "目黒", "日比谷線")?.hasSubway,
  "省略「東京メトロ」的地下鐵線名（日比谷線）仍須對位到地下鐵站體");
assert.ok(nearestOfficialStation(meguro, "目黒", "東急目黒線")?.hasSurfaceRail,
  "私鐵（東急目黒線）須對位到地面站體");

// MLIT 官方資料集不帶運輸型態旗標；「無法判斷」不可被當成衝突而排除。
const mlitOnly = [{ name: "両国", point: { lat: 35.6935, lon: 139.7935 }, distance: 300 }];
assert.ok(
  nearestOfficialStation(mlitOnly, "両国", "都営大江戸線"),
  "官方資料集缺旗標時仍須能對位，不可因無法判斷而回 null"
);

console.log("Geospatial station-body clustering and line matching passed.");
console.log("All transit format regression tests passed successfully! ✓");
