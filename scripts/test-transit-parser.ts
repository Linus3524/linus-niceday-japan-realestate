import assert from "node:assert/strict";
import { parseTransitStations, lookupStationLines } from "../src/lib/transitParser";

console.log("Running transit parser tests...");

// 測試 1：用戶提供之「グランドメゾン大塚台 6,480万.pdf」實際交通文字解析
const otsukadaiText = "ＪＲ山手線 大塚駅 徒歩6分 / 東京メトロ丸ノ内線 新大塚駅 徒歩7分 / 東京メトロ有楽町線 東池袋駅 徒歩10分 / 都電荒川線 向原駅 徒歩1分";
const otsukadaiParsed = parseTransitStations(otsukadaiText, "大塚,新大塚,東池袋,向原", "6,7,10,1");

assert.equal(otsukadaiParsed.length, 4, "應精準解析出 4 個車站");

const byStation = new Map(otsukadaiParsed.map(item => [item.stationName, item]));

assert.ok(byStation.has("大塚"), "需包含大塚站");
assert.equal(byStation.get("大塚")?.lineName, "JR山手線");
assert.equal(byStation.get("大塚")?.walkMin, 6);

assert.ok(byStation.has("新大塚"), "需包含新大塚站");
assert.equal(byStation.get("新大塚")?.lineName, "東京メトロ丸ノ内線");
assert.equal(byStation.get("新大塚")?.walkMin, 7);

assert.ok(byStation.has("東池袋"), "需包含東池袋站");
assert.equal(byStation.get("東池袋")?.lineName, "東京メトロ有楽町線");
assert.equal(byStation.get("東池袋")?.walkMin, 10);

assert.ok(byStation.has("向原"), "需包含向原站");
assert.equal(byStation.get("向原")?.lineName, "都電荒川線");
assert.equal(byStation.get("向原")?.walkMin, 1);

// 所有車站都必須有路線
for (const item of otsukadaiParsed) {
  assert.ok(item.lineName && item.lineName.trim().length > 0, `車站 ${item.stationName} 必須標示路線`);
}

// 測試 2：若圖紙原文「完全未載明路線」，僅寫「站名＋徒歩」，全線路圖資（2,100+站）自動補足線路
const noLineText = "大塚駅 徒歩6分 / 新大塚駅 徒歩7分 / 東池袋駅 徒歩10分 / 向原駅 徒歩1分";
const noLineParsed = parseTransitStations(noLineText, null, null);
assert.equal(noLineParsed.length, 4);
for (const item of noLineParsed) {
  assert.ok(item.lineName && item.lineName.trim().length > 0, `無路線文字時，車站 ${item.stationName} 仍必須由圖資補足路線`);
}
assert.ok(noLineParsed.find(i => i.stationName === "新大塚")?.lineName.includes("丸ノ内線") || noLineParsed.find(i => i.stationName === "新大塚")?.lineName.includes("丸之內線"));
assert.ok(noLineParsed.find(i => i.stationName === "向原")?.lineName.includes("都電荒川線"));

// 測試 3：單純由 stationStr + walkTimeStr 傳入（transitAccess 為空或缺漏）
const fallbackParsed = parseTransitStations(null, "新大塚,向原,雑司が谷,護国寺", "7,1,12,15");
assert.equal(fallbackParsed.length, 4);
for (const item of fallbackParsed) {
  assert.ok(item.lineName && item.lineName.trim().length > 0, `由 stationStr 補入之車站 ${item.stationName} 也必須查出路線`);
}

// 測試 4：lookupStationLines 覆蓋率測試
const testLookupStations = [
  "大塚", "新大塚", "向原", "東池袋", "東池袋四丁目",
  "新宿", "渋谷", "恵比寿", "中目黒", "武蔵小杉",
  "横浜", "川崎", "大宮", "浦和", "船橋", "吉祥寺",
  "茗荷谷", "千石", "白山", "落合南長崎", "中野富士見町"
];

for (const s of testLookupStations) {
  const line = lookupStationLines(s);
  assert.ok(line && line.trim().length > 0, `站名 ${s} 必須能查詢到路線`);
}

console.log("All transit parser tests passed successfully! ✓");
