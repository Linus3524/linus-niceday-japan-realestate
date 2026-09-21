import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const component = readFileSync(
  new URL("../src/components/CommuteRouteCard.tsx", import.meta.url),
  "utf8"
);

// 1. 驗證左右滿版容器
const timelineRow = component.match(
  /className="flex items-start w-full min-w-max sm:min-w-0 justify-between py-2"/
);
assert.ok(timelineRow, "路線圖應具備滿版寬度（w-full）與兩端貼齊分佈（justify-between）");

// 2. 驗證全線連接線段均等伸展機制（flex-1 確保所有方形卡片與標籤之間線段長度完全一致、無長短不均）
const lineSegment = component.match(
  /data-commute-line\s+className="([^"]+)"/
);
assert.ok(lineSegment, "通勤圖的每一段連接線應有可驗證的 data-commute-line 容器");

const lineClasses = lineSegment[1].split(/\s+/);
assert.ok(lineClasses.includes("flex-1"), "每一段連接線段應具備 flex-1，確保所有卡片標籤間的線段完全等長");
assert.ok(!component.includes("w-20"), "不得使用固定 w-20 窄寬度將路線圖擠死在中間");

// 3. 驗證標籤與站牌節點結構
assert.ok(
  component.includes("data-commute-badge"),
  "路線圖應具備可驗證的 data-commute-badge 標籤節點"
);

// 4. 驗證水平滑動與觸控支援
const scrollContainer = component.match(
  /data-commute-scroll\s+className="([^"]+)"/
);
assert.ok(scrollContainer, "路線圖應有可驗證的水平捲動容器");
const scrollClasses = scrollContainer[1].split(/\s+/);
assert.ok(scrollClasses.includes("overflow-x-auto"), "路線超出卡片時應可水平捲動");
assert.ok(scrollClasses.includes("touch-pan-x"), "觸控裝置應可左右滑動路線圖");
assert.ok(scrollClasses.includes("overscroll-x-contain"), "水平滑動不應帶動外層頁面");

console.log("✓ 路線圖左右滿版自適應伸展、全線連接線段均等等長（flex-1）、標籤與車站卡片對齊靜態測試通過。");

// 5. 驗證轉乘站不重複出現灰色無路線站牌、且到達站早稻田保留東京メトロ東西線 (T04) 車站圖標
import { buildCommuteLegs, pickStationNode } from "../src/components/CommuteRouteCard.js";
import type { CommuteRouteSegment } from "../src/lib/rentAnalysis.js";

const segments: CommuteRouteSegment[] = [
  { type: "walk", lineName: "徒歩", departureStop: "自宅", arrivalStop: "都立大学", durationMinutes: 4, lineColor: "#8A9590", lineTextColor: "#FFFFFF", lineShortName: null, operator: null, startStationNumber: null, endStationNumber: null, departureTime: null, arrivalTime: null, stopCount: null, headsign: null },
  { type: "rail", lineName: "東急東横線", departureStop: "都立大学", arrivalStop: "渋谷", durationMinutes: 10, lineColor: "#DA0442", lineTextColor: "#FFFFFF", lineShortName: null, operator: "東急電鉄", startStationNumber: "TY06", endStationNumber: "TY01", departureTime: null, arrivalTime: null, stopCount: null, headsign: null },
  { type: "walk", lineName: "徒歩", departureStop: "渋谷", arrivalStop: "渋谷", durationMinutes: 2, lineColor: "#8A9590", lineTextColor: "#FFFFFF", lineShortName: null, operator: null, startStationNumber: null, endStationNumber: null, departureTime: null, arrivalTime: null, stopCount: null, headsign: null },
  { type: "wait", lineName: "候車", departureStop: "渋谷", arrivalStop: "渋谷", durationMinutes: 1, lineColor: "#8A9590", lineTextColor: "#FFFFFF", lineShortName: null, operator: null, startStationNumber: null, endStationNumber: null, departureTime: null, arrivalTime: null, stopCount: null, headsign: null },
  { type: "rail", lineName: "JR 山手線", departureStop: "渋谷", arrivalStop: "高田馬場", durationMinutes: 11, lineColor: "#9ACD32", lineTextColor: "#1A2A22", lineShortName: null, operator: "JR 東日本", startStationNumber: "JY20", endStationNumber: "JY15", departureTime: null, arrivalTime: null, stopCount: null, headsign: null },
  { type: "walk", lineName: "徒歩", departureStop: "高田馬場", arrivalStop: "高田馬場", durationMinutes: 2, lineColor: "#8A9590", lineTextColor: "#FFFFFF", lineShortName: null, operator: null, startStationNumber: null, endStationNumber: null, departureTime: null, arrivalTime: null, stopCount: null, headsign: null },
  { type: "wait", lineName: "候車", departureStop: "高田馬場", arrivalStop: "高田馬場", durationMinutes: 2, lineColor: "#8A9590", lineTextColor: "#FFFFFF", lineShortName: null, operator: null, startStationNumber: null, endStationNumber: null, departureTime: null, arrivalTime: null, stopCount: null, headsign: null },
  { type: "rail", lineName: "東京メトロ東西線", departureStop: "高田馬場", arrivalStop: "早稲田", durationMinutes: 2, lineColor: "#00A7DB", lineTextColor: "#FFFFFF", lineShortName: null, operator: "東京メトロ", startStationNumber: null, endStationNumber: null, departureTime: null, arrivalTime: null, stopCount: null, headsign: null },
  { type: "walk", lineName: "徒歩", departureStop: "早稲田", arrivalStop: "目的地", durationMinutes: 7, lineColor: "#8A9590", lineTextColor: "#FFFFFF", lineShortName: null, operator: null, startStationNumber: null, endStationNumber: null, departureTime: null, arrivalTime: null, stopCount: null, headsign: null }
];

const legs = buildCommuteLegs(segments);
assert.equal(legs.length, 5, "全行程應重組為 5 個跨站實質移動路段");

// 還原 timeline 中的站牌節點列表
const renderedStations = [legs[0].fromStation];
legs.forEach((leg, idx) => {
  const isLastLeg = idx === legs.length - 1;
  const nextLeg = legs[idx + 1];
  const stationNode = isLastLeg ? leg.toStation : pickStationNode(leg.toStation, nextLeg?.fromStation);
  renderedStations.push(stationNode);
});

assert.equal(renderedStations.length, 6, "整條路線圖應恰好有 6 個車站節點：自宅、都立大学、渋谷、高田馬場、早稲田、目的地");

const stationNames = renderedStations.map(s => s.name);
assert.deepEqual(
  stationNames,
  ["自宅", "都立大学", "渋谷", "高田馬場", "早稲田", "目的地"],
  "轉乘站（渋谷、高田馬場）不得重複出現兩次"
);

// 驗證 渋谷 節點
const shibuya = renderedStations.find(s => s.name === "渋谷");
assert.ok(shibuya);
assert.equal(shibuya.number, "JY20", "渋谷站牌應顯示 JR 山手線 JY20");
assert.notEqual(shibuya.type, "walk", "渋谷轉乘站不得為灰色小方塊 (type !== walk)");

// 驗證 高田馬場 節點
const takadanobaba = renderedStations.find(s => s.name === "高田馬場");
assert.ok(takadanobaba);
assert.equal(takadanobaba.number, "T03", "高田馬場站牌應顯示東西線 T03");
assert.notEqual(takadanobaba.type, "walk", "高田馬場轉乘站不得為灰色小方塊 (type !== walk)");

// 驗證 早稲田 節點：到達站必須保留東京メトロ東西線圖標與站號 T04
const waseda = renderedStations.find(s => s.name === "早稲田");
assert.ok(waseda);
assert.equal(waseda.number, "T04", "早稲田終點鐵道站牌必須維持東西線車站編號 T04");
assert.notEqual(waseda.type, "walk", "早稲田到達站牌不得被後續步行段覆蓋為灰色小方格");
assert.equal(waseda.color, "#00A7DB", "早稲田站牌應具備東西線代表色 #00A7DB");

// 驗證 目的地 節點
const dest = renderedStations[renderedStations.length - 1];
assert.equal(dest.name, "目的地");
assert.equal(dest.type, "walk", "最終目的地節點應為灰色角色小方格");

console.log("✓ 轉乘站無重複灰色方塊、早稲田站保持東京メトロ東西線 (T04) 車站圖標與線路色測試通過！");
