import assert from "node:assert/strict";
import { buildDoorToDoorRoute, isRidingSegment } from "../src/lib/commuteRouteDisplay.js";
import { findLocalTransitRoutes } from "../src/lib/localTransitRoute.js";
import type { CommuteRouteDetails, CommuteRouteSegment } from "../src/lib/rentAnalysis.js";

console.log("Starting door-to-door route display test...");

const sum = (segments: CommuteRouteSegment[]) =>
  segments.reduce((total, segment) => total + segment.durationMinutes, 0);

// 1. 真實圖資路線：徽章加總必須等於卡片標示的總時間。
//    這正是使用者回報的症狀——上面寫 16 分，下面兩個徽章只加得出 10 分。
{
  const [route] = findLocalTransitRoutes("大山", "高田馬場", 1);
  assert.ok(route, "大山 → 高田馬場 應取得本地圖資路線");

  const ridingOnly = sum(route.segments);
  assert.ok(
    ridingOnly < route.totalDurationMinutes,
    `這個測試假設原始路線有未交代的候車時間，否則它保護不到任何東西（乘車 ${ridingOnly} 分 vs 總計 ${route.totalDurationMinutes} 分）`
  );

  const doorToDoor = buildDoorToDoorRoute(route, { originWalkMinutes: 9, destinationWalkMinutes: 0 });
  assert.equal(
    sum(doorToDoor.segments),
    doorToDoor.totalDurationMinutes,
    "門到門路線的各段加總必須等於卡片總時間"
  );
  assert.equal(
    doorToDoor.totalDurationMinutes,
    route.totalDurationMinutes + 9,
    "門到門總時間應為站到站時間加上出門步行"
  );

  // 搭乘段不能被改動：補等待節點只是呈現，不得竄改班次資料。
  const riding = doorToDoor.segments.filter(isRidingSegment);
  assert.deepEqual(
    riding.map(s => `${s.lineName}:${s.departureStop}->${s.arrivalStop}:${s.durationMinutes}`),
    route.segments.map(s => `${s.lineName}:${s.departureStop}->${s.arrivalStop}:${s.durationMinutes}`),
    "搭乘段的路線、起訖站與乘車分鐘不得被改寫"
  );

  const walks = doorToDoor.segments.filter(s => s.type === "walk");
  assert.equal(walks.length, 1, "只給了出門步行，應只補一段步行");
  assert.equal(walks[0].departureStop, "自宅");
  assert.equal(walks[0].arrivalStop, route.segments[0].departureStop);

  assert.ok(
    doorToDoor.segments.some(s => s.type === "wait"),
    "轉乘路線應補出候車節點"
  );
  console.log("✓ 大山 → 高田馬場 門到門加總自洽。");
}

// 2. 頭尾步行都給定時的完整門到門。
{
  const [route] = findLocalTransitRoutes("中野", "新宿", 1);
  assert.ok(route, "中野 → 新宿 應取得本地圖資路線");

  const doorToDoor = buildDoorToDoorRoute(route, {
    originWalkMinutes: 7,
    destinationWalkMinutes: 4,
    originLabel: "自宅",
    destinationLabel: "公司",
  });

  assert.equal(sum(doorToDoor.segments), doorToDoor.totalDurationMinutes);
  assert.equal(doorToDoor.totalDurationMinutes, route.totalDurationMinutes + 11);

  const first = doorToDoor.segments[0];
  const last = doorToDoor.segments[doorToDoor.segments.length - 1];
  assert.equal(first.type, "walk");
  assert.equal(first.departureStop, "自宅");
  assert.equal(last.type, "walk");
  assert.equal(last.arrivalStop, "公司");
  console.log("✓ 頭尾步行段正確接上。");
}

// 3. 步行為 0 時不得插入 0 分鐘的空節點。
{
  const [route] = findLocalTransitRoutes("中野", "新宿", 1);
  const doorToDoor = buildDoorToDoorRoute(route, { originWalkMinutes: 0, destinationWalkMinutes: 0 });
  assert.equal(
    doorToDoor.segments.filter(s => s.type === "walk").length,
    0,
    "步行 0 分時不應產生步行節點"
  );
  assert.equal(sum(doorToDoor.segments), doorToDoor.totalDurationMinutes);
  console.log("✓ 零步行不產生空節點。");
}

// 4. 跨午夜的轉乘：23:50 到站、00:05 發車是等 15 分，不是負 1425 分。
{
  const midnight: CommuteRouteDetails = {
    source: "local_gtfs",
    originStation: "A",
    destinationStation: "C",
    totalDurationMinutes: 35,
    transfers: 1,
    departureTime: "23:40",
    arrivalTime: "00:15",
    referenceLabel: "測試用",
    segments: [
      {
        type: "rail", lineName: "L1", lineShortName: null, lineColor: "#000000", lineTextColor: "#FFFFFF",
        operator: null, departureStop: "A", arrivalStop: "B",
        startStationNumber: null, endStationNumber: null,
        departureTime: "23:40", arrivalTime: "23:50",
        durationMinutes: 10, stopCount: 1, headsign: null,
      },
      {
        type: "rail", lineName: "L2", lineShortName: null, lineColor: "#000000", lineTextColor: "#FFFFFF",
        operator: null, departureStop: "B", arrivalStop: "C",
        startStationNumber: null, endStationNumber: null,
        departureTime: "00:05", arrivalTime: "00:15",
        durationMinutes: 10, stopCount: 1, headsign: null,
      },
    ],
  };

  const doorToDoor = buildDoorToDoorRoute(midnight, {});
  const waits = doorToDoor.segments.filter(s => s.type === "wait");
  const transferWait = waits.find(s => s.departureStop === "B");
  assert.ok(transferWait, "跨午夜的轉乘仍應產生候車節點");
  assert.equal(transferWait.durationMinutes, 15, "23:50 → 00:05 應為 15 分鐘");
  assert.ok(waits.every(s => s.durationMinutes > 0), "不得產生負值或零的等待節點");
  assert.equal(sum(doorToDoor.segments), doorToDoor.totalDurationMinutes);
  console.log("✓ 跨午夜轉乘等待計算正確。");
}

// 5. 直達且無候車：不得憑空生出節點。
{
  const direct: CommuteRouteDetails = {
    source: "local_gtfs",
    originStation: "A",
    destinationStation: "B",
    totalDurationMinutes: 10,
    transfers: 0,
    departureTime: "08:00",
    arrivalTime: "08:10",
    referenceLabel: "測試用",
    segments: [
      {
        type: "rail", lineName: "L1", lineShortName: null, lineColor: "#000000", lineTextColor: "#FFFFFF",
        operator: null, departureStop: "A", arrivalStop: "B",
        startStationNumber: null, endStationNumber: null,
        departureTime: "08:00", arrivalTime: "08:10",
        durationMinutes: 10, stopCount: 1, headsign: null,
      },
    ],
  };

  const doorToDoor = buildDoorToDoorRoute(direct, {});
  assert.equal(doorToDoor.segments.length, 1, "直達且時間已完全交代時不應補任何節點");
  assert.equal(sum(doorToDoor.segments), doorToDoor.totalDurationMinutes);
  console.log("✓ 直達路線不產生多餘節點。");
}

console.log("All door-to-door route display tests passed.");
