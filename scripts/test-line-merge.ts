/**
 * 路線合併正確性回歸測試
 *
 * 驗證 findLocalTransitRoutes() 的段合併邏輯不會把不同路線錯誤地合併成一段。
 * Bug 原因：原本用 canonicalLineName（正規化後的顯示名）做合併判斷，
 * 會把 getTransitLineIdentity 收斂成同一個 id 的不同路線合併在一起。
 *
 * 修正後改用 GTFS 原始 lineName 判斷，canonical 只用於顯示。
 */
import assert from "node:assert/strict";
import { buildDoorToDoorRoute } from "../src/lib/commuteRouteDisplay.js";
import { findLocalTransitRoutes } from "../src/lib/localTransitRoute.js";
import type { CommuteRouteSegment } from "../src/lib/rentAnalysis.js";

console.log("Starting line-merge regression test...");

// Helper: 列舉路線段摘要
const describe = (segments: CommuteRouteSegment[]) =>
  segments.map(s => `${s.lineName}: ${s.departureStop} → ${s.arrivalStop} (${s.durationMinutes}分)`).join(" | ");

// 1. JR中央線快速 vs JR中央・総武緩行線 不得合併
//    三鷹 → 秋葉原 可能經由中央快速到新宿再轉總武緩行，或直接搭總武緩行
//    兩條在圖資裡是不同 lineName，不能合併。
{
  const routes = findLocalTransitRoutes("三鷹", "秋葉原", 3);
  assert.ok(routes.length > 0, "三鷹 → 秋葉原 應取得路線");
  for (const route of routes) {
    const riding = route.segments.filter(s => s.type === "rail" || s.type === "subway");
    for (const seg of riding) {
      // 確認沒有一段搭乘跨越不同系統的車站
      // 如果合併錯誤，可能出現「JR 中央線快速: 三鷹 → 秋葉原」但實際上中央快速不停秋葉原
      if (seg.lineName.includes("中央線快速")) {
        assert.ok(
          !["秋葉原", "浅草橋", "両国", "錦糸町"].includes(seg.arrivalStop),
          `中央線快速不應到達 ${seg.arrivalStop}（只有總武緩行線才停）: ${describe(route.segments)}`
        );
      }
    }
  }
  console.log("✓ 中央快速 vs 中央・総武緩行線 不合併。");
}

// 2. 實際漏失案例：JR総武快速線 vs JR中央・総武緩行線 不得在錦糸町錯併。
//    getTransitLineIdentity() 會把兩者顯示為同一 canonical 名稱，因此只能用 GTFS 原始名判斷。
{
  const [route] = findLocalTransitRoutes("馬喰町", "浅草橋", 1);
  assert.ok(route, "馬喰町 → 浅草橋 應取得路線");
  assert.equal(route.transfers, 1, "應在錦糸町由総武快速線轉乘中央・総武緩行線");
  assert.equal(route.segments.length, 2, `兩條不同原始路線不得錯併：${describe(route.segments)}`);

  const [rapid, local] = route.segments;
  assert.deepEqual(
    [rapid.departureStop, rapid.arrivalStop, rapid.startStationNumber, rapid.endStationNumber],
    ["馬喰町", "錦糸町", "JO21", "JO22"],
    "第一段應為総武快速線（JO）到錦糸町"
  );
  assert.deepEqual(
    [local.departureStop, local.arrivalStop, local.startStationNumber, local.endStationNumber],
    ["錦糸町", "浅草橋", "JB22", "JB20"],
    "第二段應為中央・総武緩行線（JB）由錦糸町出發"
  );

  const displayed = buildDoorToDoorRoute(route);
  const waits = displayed.segments.filter(segment => segment.type === "wait");
  assert.deepEqual(
    waits.map(segment => [segment.lineName, segment.departureStop, segment.durationMinutes]),
    [["候車", "馬喰町", 7], ["轉乘候車", "錦糸町", 3]],
    "起站候車殘差應為 7 分，且錦糸町應保留 3 分轉乘候車"
  );
  assert.equal(
    displayed.segments.reduce((sum, segment) => sum + segment.durationMinutes, 0),
    displayed.totalDurationMinutes,
    "補完候車後各段加總必須等於總時間"
  );
  console.log("✓ 馬喰町 → 錦糸町 → 浅草橋 保留快速/緩行轉乘，候車殘差為 7 分。");
}

// 3. 同名收斂的不同線不得合併——以不會在同一班次上連續出現的站為反例
//    特別注意：小田急 pattern /小田急(?:小田原線)?/ 會把 多摩線 和 江ノ島線 都收斂成 小田急小田原線。
//    驗證：新百合ヶ丘 → 唐木田（小田急多摩線）不應與 新宿 → 新百合ヶ丘（小田急小田原線）合併
{
  const routes = findLocalTransitRoutes("新宿", "唐木田", 3);
  assert.ok(routes.length > 0, "新宿 → 唐木田 應取得路線");
  for (const route of routes) {
    // 如果新宿→唐木田路線經新百合ヶ丘轉乘，應出現至少 2 段搭乘（小田原線 + 多摩線）
    // 而非被合併成 1 段小田急小田原線
    const riding = route.segments.filter(s => s.type === "rail" || s.type === "subway");
    if (riding.length === 1 && riding[0].departureStop === "新宿" && riding[0].arrivalStop === "唐木田") {
      // 如果是直通運轉（直接跑到唐木田不換車），GTFS 裡 lineName 會一直是同一條，
      // 那 1 段是對的。但如果 GTFS 把它分成兩條不同 lineName 的路線，就不該被合併。
      // 我們只確認：如果 transfers > 0，搭乘段必定 > 1
      assert.equal(route.transfers, 0,
        `新宿 → 唐木田：單段搭乘的路線轉乘次數應為 0，但實際為 ${route.transfers}。` +
        `如果 > 0 代表合併邏輯錯誤把兩條不同路線合成一段。`
      );
    }
  }
  console.log("✓ 小田急系列路線（小田原線/多摩線）不誤合併。");
}

// 4. 京王線 vs 京王新線 不得合併
//    京王線走「笹塚→明大前→...→調布」，京王新線走「笹塚→初台→幡ヶ谷→新線新宿」。
//    兩線在笹塚分歧，GTFS 是不同 lineName。
{
  const routes = findLocalTransitRoutes("初台", "調布", 3);
  assert.ok(routes.length > 0, "初台 → 調布 應取得路線");
  for (const route of routes) {
    const riding = route.segments.filter(s => s.type === "rail" || s.type === "subway");
    // 初台只有京王新線（不是京王線），到調布要在笹塚或新宿換京王線
    if (route.transfers > 0) {
      assert.ok(riding.length > 1,
        `初台 → 調布 有 ${route.transfers} 次轉乘但只有 ${riding.length} 段搭乘，可能合併錯誤: ${describe(route.segments)}`
      );
    }
  }
  console.log("✓ 京王新線 vs 京王線 不誤合併。");
}

// 5. 跨 JR、私鐵、地下鐵全面檢查：任何路線的 transfers 數必須等於搭乘段數 - 1。
//    合併判斷不含任何特定路線 regex，這個不變量用多業者實際路線防止同類錯誤復發。
{
  const pairs = [
    ["大山", "高田馬場"],
    ["新宿", "横浜"],
    ["池袋", "渋谷"],
    ["東京", "千葉"],
    ["中野", "秋葉原"],
    ["品川", "上野"],
    ["目黒", "浅草"],
    ["錦糸町", "新宿"],
    ["練馬", "銀座"],
    ["吉祥寺", "東京"],
  ];

  let total = 0;
  let violations = 0;
  for (const [from, to] of pairs) {
    const routes = findLocalTransitRoutes(from, to, 3);
    for (const route of routes) {
      total++;
      const riding = route.segments.filter(s => s.type === "rail" || s.type === "subway");
      if (riding.length !== route.transfers + 1) {
        console.error(
          `✗ ${from} → ${to}: 搭乘 ${riding.length} 段但標示轉乘 ${route.transfers} 次（應為 ${riding.length - 1} 次）` +
          `\n  ${describe(route.segments)}`
        );
        violations++;
      }
    }
  }
  assert.equal(violations, 0, `${violations} / ${total} 條路線搭乘段數與轉乘次數不一致`);
  console.log(`✓ ${total} 條路線全部通過 transfers = segments - 1 不變量檢查。`);
}

console.log("All line-merge regression tests passed!");
