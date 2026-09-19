/**
 * Transitous 路線識別回歸測試。
 *
 * 守的是一個實際回報的線上問題：通勤時間軸上的路線徽章顯示成「10650744」
 * 「10684124」這種數字。那不是路線代碼，是班次編號——Transitous 的
 * jp-japan-rail 圖資 route_long_name 是空字串，route_short_name 放班次編號，
 * 而程式的 fallback 鏈直接把它當路線名顯示。連帶影響：查不到路線身分，
 * 站編號（JY13）與路線色也一起失效，變成灰底無編號。
 *
 * 這裡驗的是「路線名必須是真實路線」與「站編號查得到」，不釘特定班次，
 * 因為班次編號每天都不一樣，但它永遠不該出現在畫面上。
 */
import assert from "node:assert/strict";
import { identifyGraphLine, graphStationCode, findLocalTransitRoutes, isGraphStation } from "../src/lib/localTransitRoute.js";
import { resolveListingCommuteRoutes, isAcceptableStopMatch } from "../src/lib/transitRouteApi.js";

/** 畫面上絕不該出現的東西：純數字的路線名。 */
const TRAIN_NUMBER = /^[0-9]{3,}[A-Za-z]?$/;

// 1. 停靠站序列 → 路線名。這是還原 jp-japan-rail 路線的唯一線索。
{
  assert.equal(
    identifyGraphLine(["大山(東京都)", "下板橋", "北池袋", "池袋"], "東武鉄道"),
    "東武東上線",
    "相鄰停靠站序列應該要能還原出東武東上線"
  );
  assert.equal(
    identifyGraphLine(["池袋", "目白", "高田馬場"], "JR"),
    "JR山手線",
    "Transitous 的業者名寫「JR」，圖資寫「JR東日本」，仍須對得起來"
  );
  // 圖資沒有的站（長野縣）不能硬湊一條線出來。
  assert.equal(identifyGraphLine(["大屋", "上田"], "JR"), null, "圖資外的區間應回 null 而不是亂猜");
  assert.equal(identifyGraphLine(["池袋"], "JR"), null, "只有一站無法判斷路線");
  console.log("✓ identifyGraphLine 能由停靠站序列還原路線，查不到時回 null");
}

// 2. 圖資站編號查表：經由停靠站序列還原的路線也要查得到編號。
{
  assert.equal(graphStationCode("JR山手線", "高田馬場"), "JY15");
  assert.equal(graphStationCode("JR山手線", "池袋"), "JY13");
  assert.equal(graphStationCode("東武東上線", "大山"), "TJ04");
  assert.equal(graphStationCode("東京メトロ東西線", "高田馬場"), "T03");
  assert.equal(graphStationCode("JR山手線", "存在しない駅"), null, "查不到應回 null");
  console.log("✓ graphStationCode 由圖資補上站編號");
}

// 3. 端到端：實際算出來的路線，每一段的路線名都必須是真實路線名。
{
  const pairs: Array<[string, string, string]> = [
    ["大山", "高田馬場", "東京都板橋区"],
    ["高田馬場", "東京", "東京都新宿区"],
    ["中野", "新宿", "東京都中野区"],
  ];

  let checked = 0;
  for (const [origin, destination, context] of pairs) {
    const routes = await resolveListingCommuteRoutes(origin, destination, context);
    assert.ok(routes.length > 0, `${origin} → ${destination} 應該要有路線`);

    for (const route of routes) {
      for (const segment of route.segments) {
        if (segment.type === "walk") continue;

        assert.ok(
          !TRAIN_NUMBER.test(segment.lineName),
          `${origin}→${destination}（${route.source}）的路線名是班次編號而非路線：「${segment.lineName}」`
        );
        assert.ok(
          !TRAIN_NUMBER.test(segment.lineShortName || ""),
          `${origin}→${destination} 的路線代號是班次編號：「${segment.lineShortName}」`
        );
        // 真實路線名一定含日文字；純羅馬字或空字串都代表沒還原成功。
        assert.match(
          segment.lineName,
          /[一-龯ぁ-ゖァ-ヺ]/,
          `${origin}→${destination} 的路線名不像日文路線：「${segment.lineName}」`
        );
        assert.notEqual(segment.lineColor, "#3F626D",
          `${origin}→${destination} 的 ${segment.lineName} 掉回預設灰，代表路線沒被識別`);
        checked += 1;
      }
    }
  }
  console.log(`✓ 端到端檢查 ${checked} 個區間，路線名全部為真實路線（無班次編號）`);
}

// 4. 本地圖資路線的站編號不可回歸成 null——時間軸上的站牌圖示靠它顯示。
{
  const routes = findLocalTransitRoutes("大山", "高田馬場", 1);
  const [segment] = routes[0].segments;
  assert.equal(segment.lineName, "東武東上線");
  assert.equal(segment.startStationNumber, "TJ04");
  assert.equal(segment.endStationNumber, "TJ01");
  console.log("✓ 本地圖資路線的站編號正常");
}

// 5. 同名異地：圖資上的站不該被外部地理編碼帶到別的縣市。
//    白山在都營三田線（文京區），但 Transitous geocode 的第一名是香川縣的白山，
//    名稱相等、country 同為 JP——舊版的比對條件一個都擋不住，
//    結果是拿香川的站去規劃首都圈通勤。
{
  for (const name of ["白山", "中野", "大久保", "府中", "高田馬場", "大山"]) {
    assert.ok(isGraphStation(name), `${name} 應該要在圖資裡`);
  }
  assert.ok(!isGraphStation("大屋"), "長野的大屋不該被當成圖資車站");
  assert.ok(!isGraphStation(""), "空字串不是車站");

  // 直接驗選站這一層。不從整條路線驗，是因為本地圖資會算出正確路線並排在前面，
  // 就算 Transitous 選錯站也看不出來——那種測試看起來會過，其實什麼都沒守住。
  const kagawaHakusan = { name: "白山(香川県)", country: "JP", areas: [{ name: "日本" }, { name: "香川県" }, { name: "木田郡" }] };
  const tokyoHakusan = { name: "白山(東京都)", country: "JP", areas: [{ name: "日本" }, { name: "東京都" }, { name: "文京区" }] };

  assert.equal(isAcceptableStopMatch(kagawaHakusan, "白山", true), false, "圖資上的白山不該接受香川縣的同名站");
  assert.equal(isAcceptableStopMatch(tokyoHakusan, "白山", true), true, "文京區的白山才是對的");
  // 圖資沒收的站（例：關西）不受首都圈限制，否則整個關西都查不到。
  assert.equal(isAcceptableStopMatch(kagawaHakusan, "白山", false), true, "非圖資站不應被首都圈條件卡住");
  // 神奈川的橋本、青葉台是真站，屬首都圈，必須保留。
  const kanagawa = { name: "橋本駅", country: "JP", areas: [{ name: "日本" }, { name: "神奈川県" }, { name: "相模原市" }] };
  assert.equal(isAcceptableStopMatch(kanagawa, "橋本", true), true, "神奈川屬首都圈，不可誤擋");
  assert.equal(isAcceptableStopMatch({ name: "白山", country: "TW", areas: [] }, "白山", false), false, "非日本結果一律排除");

  console.log("✓ 同名異地站受圖資約束（白山不會解析到香川，神奈川的站不誤擋）");
}

console.log("\nTransitous 路線識別回歸測試全數通過！");
