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

// 驗證東急東橫線 Leg 的起訖站牌資訊
assert.equal(legs[1].fromStation.name, "都立大学");
assert.equal(legs[1].fromStation.number, "TY06", "都立大學站號為 TY06");
assert.equal(legs[1].toStation.name, "渋谷");
assert.equal(legs[1].toStation.number, "TY01", "東急東橫線到達澀谷站號應為 TY01");
assert.equal(legs[1].toStation.color, "#DA0442", "東急東橫線到達澀谷站牌顏色應為東橫線桃紅色");

// 驗證東急東橫線到達澀谷後之轉乘過渡 (transferAfter)
assert.ok(legs[1].transferAfter, "東急東橫線到澀谷後應掛載轉乘過渡 (transferAfter)");
assert.equal(legs[1].transferAfter.badge.label, "轉乘");
assert.equal(legs[1].transferAfter.badge.durationMinutes, 3, "澀谷轉乘總時間應為 3 分鐘");
assert.equal(legs[1].transferAfter.badge.waitMinutes, 1, "澀谷轉乘候車時間應為 1 分鐘");
assert.equal(legs[1].transferAfter.badge.detailTooltip, "站內步行 2 分 ＋ 月台候車 1 分");

// 驗證 JR 山手線 Leg 的起訖站牌資訊
assert.equal(legs[2].fromStation.name, "渋谷");
assert.equal(legs[2].fromStation.number, "JY20", "JR 山手線出發澀谷站號應為 JY20");
assert.equal(legs[2].fromStation.color, "#9ACD32", "JR 山手線出發澀谷站牌顏色應為山手線嫩綠色");
assert.equal(legs[2].toStation.name, "高田馬場");
assert.equal(legs[2].toStation.number, "JY15", "JR 山手線到達高田馬場站號應為 JY15");
assert.equal(legs[2].toStation.color, "#9ACD32", "JR 山手線到達高田馬場站牌顏色應為山手線嫩綠色");

// 驗證 JR 山手線到達高田馬場後之轉乘過渡 (transferAfter)
assert.ok(legs[2].transferAfter, "JR 山手線到高田馬場後應掛載轉乘過渡 (transferAfter)");
assert.equal(legs[2].transferAfter.badge.label, "轉乘");
assert.equal(legs[2].transferAfter.badge.durationMinutes, 4, "高田馬場轉乘總時間應為 4 分鐘");
assert.equal(legs[2].transferAfter.badge.waitMinutes, 2, "高田馬場轉乘候車時間應為 2 分鐘");
assert.equal(legs[2].transferAfter.badge.detailTooltip, "站內步行 2 分 ＋ 月台候車 2 分");

// 驗證東京メトロ東西線 Leg 的起訖站牌資訊
assert.equal(legs[3].fromStation.name, "高田馬場");
assert.equal(legs[3].fromStation.number, "T03", "東京メトロ東西線出發高田馬場站號應為 T03");
assert.equal(legs[3].fromStation.color, "#00A7DB", "東西線出發高田馬場站牌顏色應為東西線天藍色");
assert.equal(legs[3].toStation.name, "早稲田");
assert.equal(legs[3].toStation.number, "T04", "東京メトロ東西線到達早稻田站號應為 T04");
assert.equal(legs[3].toStation.color, "#00A7DB", "東西線到達早稻田站牌顏色應為東西線天藍色");

// 驗證早稲田站出站步行至目的地，不掛載轉乘過渡
assert.equal(legs[3].transferAfter, undefined, "東西線早稻田出站徒步不應有轉乘過渡");

// 還原時間軸中的完整站牌與轉乘順序
type RenderedItem =
  | { type: "station"; name: string; number: string; color: string }
  | { type: "badge"; label: string; duration: number };

const timelineSeq: RenderedItem[] = [];
timelineSeq.push({
  type: "station",
  name: legs[0].fromStation.name,
  number: legs[0].fromStation.number,
  color: legs[0].fromStation.color,
});

legs.forEach((leg, idx) => {
  const isLastLeg = idx === legs.length - 1;
  const nextLeg = legs[idx + 1];

  leg.badges.forEach((b) => {
    timelineSeq.push({ type: "badge", label: b.label, duration: b.durationMinutes });
  });

  if (leg.transferAfter && nextLeg) {
    // 1. 前線到達站牌 (東橫線 渋谷 TY01)
    timelineSeq.push({
      type: "station",
      name: leg.toStation.name,
      number: leg.toStation.number,
      color: leg.toStation.color,
    });
    // 2. 轉乘標籤 (轉乘 3分)
    timelineSeq.push({
      type: "badge",
      label: leg.transferAfter.badge.label,
      duration: leg.transferAfter.badge.durationMinutes,
    });
    // 3. 後線出發站牌 (山手線 渋谷 JY20)
    timelineSeq.push({
      type: "station",
      name: nextLeg.fromStation.name,
      number: nextLeg.fromStation.number,
      color: nextLeg.fromStation.color,
    });
  } else {
    const st = isLastLeg ? leg.toStation : pickStationNode(leg.toStation, nextLeg?.fromStation);
    timelineSeq.push({
      type: "station",
      name: st.name,
      number: st.number,
      color: st.color,
    });
  }
});

// 驗證時間軸中的重要順序：
// 東急東橫線 ── [渋谷 TY01 (桃紅色)] ── [轉乘 3分] ── [渋谷 JY20 (綠色)] ── JR 山手線
const ty01Idx = timelineSeq.findIndex(item => item.type === "station" && item.number === "TY01");
const transfer1Idx = timelineSeq.findIndex((item, i) => i > ty01Idx && item.type === "badge" && item.label === "轉乘");
const jy20Idx = timelineSeq.findIndex((item, i) => i > transfer1Idx && item.type === "station" && item.number === "JY20");

assert.ok(ty01Idx !== -1, "時間軸應包含東橫線到達站 渋谷 TY01");
assert.ok(transfer1Idx !== -1, "時間軸應包含 渋谷 轉乘標籤");
assert.ok(jy20Idx !== -1, "時間軸應包含山手線出發站 渋谷 JY20");
assert.ok(
  ty01Idx < transfer1Idx && transfer1Idx < jy20Idx,
  "轉乘順序必須為：東橫線到澀谷 (TY01) ── 轉乘 ── 變山手線顏色的澀谷 (JY20)"
);

// 驗證高田馬場的轉乘順序：
// JR 山手線 ── [高田馬場 JY15 (綠色)] ── [轉乘 4分] ── [高田馬場 T03 (藍色)] ── 東京メトロ東西線
const jy15Idx = timelineSeq.findIndex(item => item.type === "station" && item.number === "JY15");
const transfer2Idx = timelineSeq.findIndex((item, i) => i > jy15Idx && item.type === "badge" && item.label === "轉乘");
const t03Idx = timelineSeq.findIndex((item, i) => i > transfer2Idx && item.type === "station" && item.number === "T03");

assert.ok(jy15Idx !== -1, "時間軸應包含山手線到達站 高田馬場 JY15");
assert.ok(transfer2Idx !== -1, "時間軸應包含 高田馬場 轉乘標籤");
assert.ok(t03Idx !== -1, "時間軸應包含東西線出發站 高田馬場 T03");
assert.ok(
  jy15Idx < transfer2Idx && transfer2Idx < t03Idx,
  "高田馬場轉乘順序必須為：山手線到高田馬場 (JY15) ── 轉乘 ── 變東西線顏色的高田馬場 (T03)"
);

// 驗證早稲田終點鐵道站保留 T04
const t04Item = timelineSeq.find(item => item.type === "station" && item.number === "T04");
assert.ok(t04Item, "早稲田鐵道到達站必須保留東西線 T04 標誌");

console.log("✓ 轉乘順序（東橫線到澀谷 TY01 ── 轉乘 ── 山手線澀谷 JY20）與雙站號顏色對齊、轉乘標籤合併 (候車X分) 測試全部通過！");

// ---------------------------------------------------------------------------
// 6. 出門第一段的候車不得畫成「轉乘」
//
// 迴歸案例：自宅徒步 4 分到都立大學、再等 4 分上車，畫面卻變成
// 「都立大学（灰方塊）── 轉乘 4分 ── TY06 都立大学」，同一個車站出現兩次，
// 看起來像要在都立大學轉乘到都立大學。徒步或巴士接到車站都只是上車前候車。
// ---------------------------------------------------------------------------
import { buildDoorToDoorRoute } from "../src/lib/commuteRouteDisplay.js";
import { countThroughConnections } from "../src/lib/throughService.js";
import type { CommuteRouteDetails } from "../src/lib/rentAnalysis.js";

const railSeg = (
  lineName: string, from: string, to: string, minutes: number,
  startCode: string | null, endCode: string | null,
  departureTime: string | null = null, arrivalTime: string | null = null,
  type: CommuteRouteSegment["type"] = "rail"
): CommuteRouteSegment => ({
  type, lineName, lineShortName: null, lineColor: "#DA0442", lineTextColor: "#FFFFFF",
  operator: null, departureStop: from, arrivalStop: to,
  startStationNumber: startCode, endStationNumber: endCode,
  departureTime, arrivalTime, durationMinutes: minutes, stopCount: null, headsign: null,
});

const walkThenBoard = buildDoorToDoorRoute(
  {
    source: "local_gtfs", originStation: "都立大学", destinationStation: "渋谷",
    totalDurationMinutes: 13, transfers: 0, departureTime: "08:00", arrivalTime: "08:09",
    referenceLabel: "", segments: [railSeg("東急東横線", "都立大学", "渋谷", 9, "TY06", "TY01", "08:00", "08:09")],
  } satisfies CommuteRouteDetails,
  { originWalkMinutes: 4 }
);

const boardLegs = buildCommuteLegs(walkThenBoard.segments);
assert.equal(boardLegs.length, 2, "自宅徒步 ＋ 一段電車應重組為 2 個路段");
assert.equal(
  boardLegs[0].transferAfter, undefined,
  "自宅徒步到車站後的等待是上車前候車，不得掛成轉乘（否則車站會重複出現兩次）"
);
const boardBadges = boardLegs[1].badges.map(b => b.label);
assert.deepEqual(boardBadges, ["候車", "東急東横線"], "上車前的等待應標為「候車」並併入電車路段");

// 同一個車站不得在時間軸上連續出現兩次
const boardStations: string[] = [boardLegs[0].fromStation.name];
boardLegs.forEach((leg, idx) => {
  const next = boardLegs[idx + 1];
  if (leg.transferAfter && next) {
    boardStations.push(leg.toStation.name, next.fromStation.name);
  } else {
    boardStations.push(pickStationNode(leg.toStation, next?.fromStation).name);
  }
});
assert.deepEqual(
  boardStations, ["自宅", "都立大学", "渋谷"],
  "時間軸應為 自宅 → 都立大学 → 渋谷，都立大学只能出現一次"
);

console.log("✓ 出門第一段候車不再誤判為轉乘、車站不重複顯示。");

// ---------------------------------------------------------------------------
// 7. 同一條線在同站換車（各停換急行）必須標示出來
// ---------------------------------------------------------------------------
const sameLineLegs = buildCommuteLegs(
  buildDoorToDoorRoute({
    source: "local_gtfs", originStation: "都立大学", destinationStation: "渋谷",
    totalDurationMinutes: 12, transfers: 1, departureTime: "08:00", arrivalTime: "08:11",
    referenceLabel: "",
    segments: [
      railSeg("東急東横線", "都立大学", "学芸大学", 1, "TY06", "TY05", "08:00", "08:01"),
      railSeg("東急東横線", "学芸大学", "渋谷", 8, "TY05", "TY01", "08:03", "08:11"),
    ],
  } satisfies CommuteRouteDetails, {}).segments
);

const sameLineTransfer = sameLineLegs[0].transferAfter;
assert.ok(sameLineTransfer, "同一條線在学芸大学換車應掛載轉乘過渡");
assert.equal(sameLineTransfer.badge.label, "轉乘", "同線換車仍是一次換車動作");
assert.equal(
  sameLineTransfer.badge.note, "同線換車",
  "同一條線換車必須在分鐘數下方標示，否則看起來像「学芸大学轉乘学芸大学」"
);
assert.match(
  sameLineTransfer.badge.detailTooltip ?? "",
  /同一條路線（東急東横線）在本站換車/,
  "同線換車的提示應說明是同一條路線換車"
);

console.log("✓ 同一條線在同站換車已標示「同線換車」。");

// ---------------------------------------------------------------------------
// 8. 直通運轉（同一台車跨線）應標為「直通」而非「轉乘」
// ---------------------------------------------------------------------------
const throughLegs = buildCommuteLegs(
  buildDoorToDoorRoute({
    source: "local_gtfs", originStation: "都立大学", destinationStation: "新宿三丁目",
    totalDurationMinutes: 18, transfers: 1, departureTime: "08:34", arrivalTime: "08:52",
    referenceLabel: "",
    segments: [
      railSeg("東急東横線", "都立大学", "渋谷", 9, "TY06", "TY01", "08:34", "08:43"),
      railSeg("東京メトロ副都心線", "渋谷", "新宿三丁目", 6, "F16", "F13", "08:46", "08:52", "subway"),
    ],
  } satisfies CommuteRouteDetails, {}).segments
);

const throughBadge = throughLegs[0].transferAfter?.badge;
assert.ok(throughBadge, "東橫線接副都心線應掛載過渡節點");
assert.equal(throughBadge.label, "直通", "東急東横線直通東京メトロ副都心線不該顯示為「轉乘」");
assert.equal(
  throughBadge.note, "不需下車",
  "直通要用使用者在意的說法標示（不需下車），而不是只寫日文味的「同車直通」"
);
assert.equal(throughBadge.bgColor, "#00A174", "直通用主題綠與轉乘的灰色區隔");
assert.equal(throughBadge.waitMinutes, undefined, "直通不必下車，不應再拆出候車分鐘");

// 對照組：真正需要換車的池袋（湘南新宿線 → 東武東上線）必須維持「轉乘」
const realTransferLegs = buildCommuteLegs(
  buildDoorToDoorRoute({
    source: "local_gtfs", originStation: "武蔵小杉", destinationStation: "和光市",
    totalDurationMinutes: 42, transfers: 1, departureTime: "08:31", arrivalTime: "09:13",
    referenceLabel: "",
    segments: [
      railSeg("JR 湘南新宿ライン", "武蔵小杉", "池袋", 25, null, null, "08:31", "08:56"),
      railSeg("東武東上線", "池袋", "和光市", 13, null, null, "09:00", "09:13"),
    ],
  } satisfies CommuteRouteDetails, {}).segments
);
assert.equal(
  realTransferLegs[0].transferAfter?.badge.label, "轉乘",
  "沒有直通關係的線對（湘南新宿線／東武東上線）必須維持轉乘，不得誤標為直通"
);

console.log("✓ 直通運轉標示正確，且未直通的線對仍正確顯示為轉乘。");

// ---------------------------------------------------------------------------
// 9. 推薦卡的直通標記必須與路線圖上的徽章一致
//
// 卡片上寫「含 1 次直通」、展開後圖上卻畫成灰色轉乘（或反過來），
// 比完全不標示更傷害信任。兩邊都必須走 countThroughConnections()。
// ---------------------------------------------------------------------------
const throughRoute = {
  source: "local_gtfs", originStation: "都立大学", destinationStation: "新宿三丁目",
  totalDurationMinutes: 18, transfers: 1, departureTime: "08:34", arrivalTime: "08:52",
  referenceLabel: "",
  segments: [
    railSeg("東急東横線", "都立大学", "渋谷", 9, "TY06", "TY01", "08:34", "08:43"),
    railSeg("東京メトロ副都心線", "渋谷", "新宿三丁目", 6, "F16", "F13", "08:46", "08:52", "subway"),
  ],
} satisfies CommuteRouteDetails;

assert.equal(
  countThroughConnections(throughRoute), 1,
  "東橫線直通副都心線：推薦卡應計為 1 次直通"
);

// 對照組：真正的轉乘不得被計入
assert.equal(
  countThroughConnections({
    segments: [
      railSeg("JR 湘南新宿ライン", "武蔵小杉", "池袋", 25, null, null, "08:31", "08:56"),
      railSeg("東武東上線", "池袋", "和光市", 13, null, null, "09:00", "09:13"),
    ],
  }), 0,
  "沒有直通關係的線對不得被計為直通"
);

// 一致性：兩層對同一條路線必須得到相同結論
const doorToDoorSegments = buildDoorToDoorRoute(throughRoute, {
  originWalkMinutes: 4, destinationWalkMinutes: 3, originLabel: "自宅",
}).segments;
const badgeThroughCount = buildCommuteLegs(doorToDoorSegments)
  .filter(leg => leg.transferAfter?.badge.label === "直通").length;
assert.equal(
  badgeThroughCount, countThroughConnections({ segments: doorToDoorSegments }),
  "推薦卡的直通次數必須與路線圖上的直通徽章數一致，否則同一畫面會自相矛盾"
);

// 門到門包裝（頭尾徒步）不得影響直通判斷
assert.equal(
  countThroughConnections({ segments: doorToDoorSegments }), 1,
  "加上自宅徒步與目的地徒步後，直通次數不應改變"
);

console.log("✓ 推薦卡與路線圖的直通標示一致，且不受頭尾徒步影響。");

