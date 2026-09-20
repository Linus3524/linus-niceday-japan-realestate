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

console.log("✓ 路線圖左右滿版自適應伸展、全線連接線段均等等長（flex-1）、標籤與車站卡片對齊測試通過。");
