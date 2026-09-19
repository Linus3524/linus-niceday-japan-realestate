import assert from "node:assert/strict";
import { findLocalTransitRoutes } from "../src/lib/localTransitRoute.js";
import { resolveListingCommuteRoutes, resolveListingCommuteRoute } from "../src/lib/transitRouteApi.js";
import listingLocationHandler from "../api/listing-location.js";

console.log("Starting multi-commute routes test...");

// 1. 驗證 findLocalTransitRoutes 能找到 2~3 條路線，並嚴格依轉乘次數升冪排序
{
  const pairs = [
    { from: "中野", to: "新宿", minRoutes: 2, maxRoutes: 3 },
    { from: "練馬", to: "渋谷", minRoutes: 2, maxRoutes: 3 },
    { from: "目黒", to: "秋葉原", minRoutes: 2, maxRoutes: 3 },
  ];

  for (const { from, to, minRoutes, maxRoutes } of pairs) {
    const routes = findLocalTransitRoutes(from, to, 3);
    assert.ok(routes.length >= minRoutes, `${from} → ${to} 應至少推薦 ${minRoutes} 條路線，實際取得 ${routes.length} 條`);
    assert.ok(routes.length <= maxRoutes, `${from} → ${to} 最多推薦 ${maxRoutes} 條路線，實際取得 ${routes.length} 條`);

    // 驗證排序：轉乘次數最少到多次（transfers 升冪）
    for (let i = 0; i < routes.length - 1; i++) {
      const curr = routes[i];
      const next = routes[i + 1];
      assert.ok(
        curr.transfers <= next.transfers,
        `路線排序錯誤：第 ${i + 1} 條轉乘 ${curr.transfers} 次不應大於第 ${i + 2} 條轉乘 ${next.transfers} 次`
      );
      if (curr.transfers === next.transfers) {
        assert.ok(
          curr.totalDurationMinutes <= next.totalDurationMinutes,
          `同轉乘次數下時間排序錯誤：第 ${i + 1} 條 ${curr.totalDurationMinutes} 分不應大於第 ${i + 2} 條 ${next.totalDurationMinutes} 分`
        );
      }
    }
  }
  console.log("✓ findLocalTransitRoutes multi-route generation & transfer-asc sorting passed.");
}

// 2. 驗證 resolveListingCommuteRoutes 整合邏輯
{
  const routes = await resolveListingCommuteRoutes("中野", "新宿");
  assert.ok(routes.length >= 2 && routes.length <= 3, `中野 → 新宿 應回傳 2~3 條路線，實際回傳 ${routes.length} 條`);
  assert.equal(routes[0].transfers, 0, "中野 → 新宿 第一條首選應為直達（0 次轉乘）");
  assert.ok(routes[0].totalDurationMinutes <= 10, "中央線快速/總武線直達時間應在 10 分鐘以內");

  // 驗證大山 → 高田馬場（只有 1 條合理路線，不應硬湊重複或荒謬路線）
  const oyamaRoutes = await resolveListingCommuteRoutes("大山", "高田馬場", "東京都板橋区大山西町 55-3");
  assert.equal(oyamaRoutes.length, 1, `大山 → 高田馬場 應只有 1 條優質路線，實際回傳 ${oyamaRoutes.length} 條`);
  assert.equal(oyamaRoutes[0].transfers, 1, "大山 → 高田馬場 應轉乘 1 次（東武東上線換山手線）");

  // 驗證相容函數 resolveListingCommuteRoute 回傳第一條最優路線
  const singleRoute = await resolveListingCommuteRoute("中野", "新宿");
  assert.ok(singleRoute);
  assert.equal(singleRoute.originStation, routes[0].originStation);
  assert.equal(singleRoute.destinationStation, routes[0].destinationStation);
  assert.equal(singleRoute.transfers, routes[0].transfers);
  assert.equal(singleRoute.totalDurationMinutes, routes[0].totalDurationMinutes);

  console.log("✓ resolveListingCommuteRoutes & resolveListingCommuteRoute integration passed.");
}

// 3. 驗證 API handler 回傳格式：包含 routes 陣列與向後相容欄位
{
  let responseBody: any;
  let statusCode = 200;
  const res = {
    setHeader() {},
    status(code: number) { statusCode = code; return this; },
    json(body: unknown) { responseBody = body; return this; },
  };

  await listingLocationHandler({
    method: "POST",
    headers: {},
    body: {
      mode: "commute",
      originStation: "中野",
      originWalkMinutes: 6,
      addressContext: "東京都中野区",
      destination: "新宿站",
    },
  }, res);

  assert.equal(statusCode, 200);
  assert.equal(responseBody.found, true);
  const commute = responseBody.commute;
  assert.ok(commute, "API 應回傳 commute 物件");
  assert.ok(Array.isArray(commute.routes), "commute 物件應包含 routes 陣列");
  assert.ok(commute.routes.length >= 2 && commute.routes.length <= 3, `API 應推薦 2~3 條路線，實際回傳 ${commute.routes.length} 條`);

  // 驗證 routes[0] 與最外層向後相容欄位一致
  assert.equal(commute.route.originStation, commute.routes[0].route.originStation);
  assert.equal(commute.transitMinutes, commute.routes[0].transitMinutes);
  assert.equal(commute.totalMinutes, commute.routes[0].totalMinutes);
  assert.equal(commute.transfers, commute.routes[0].transfers);

  // 驗證 routes 陣列中的各條路線資訊完整，且排序正確
  for (let i = 0; i < commute.routes.length; i++) {
    const opt = commute.routes[i];
    assert.ok(opt.id, `route #${i + 1} 應有 id`);
    assert.ok(opt.route, `route #${i + 1} 應有詳細 route 物件`);
    assert.equal(typeof opt.transitMinutes, "number");
    assert.equal(typeof opt.totalMinutes, "number");
    assert.equal(typeof opt.transfers, "number");
    assert.equal(opt.totalMinutes, commute.originWalkMinutes + opt.transitMinutes + commute.destinationWalkMinutes);

    if (i > 0) {
      const prev = commute.routes[i - 1];
      assert.ok(
        prev.transfers <= opt.transfers,
        `API 路線轉乘排序應為由少到多：#${i} (${prev.transfers}次) vs #${i + 1} (${opt.transfers}次)`
      );
    }
  }

  console.log("✓ API handler commute.routes response structure & backward compatibility passed.");
}

console.log("All multi-commute routes tests passed successfully!");
