/**
 * 格局圖標註中文化測試
 *
 * 背景：AI 擷取階段以日文原文輸出 floorPlanDetails（忠於圖面，正確），
 * 但畫面直接顯示那串原文，使用者看到的只是一列看不懂的日文。
 * parseFloorPlanDetails() 負責呈現層的翻譯與分組。
 */
import assert from "node:assert/strict";
import {
  parseFloorPlanDetails,
  groupFloorPlanItems,
  FLOOR_PLAN_CATEGORY_ORDER,
} from "../src/lib/floorPlanDetails.js";

// ---------------------------------------------------------------------------
// 1. 使用者回報的實例：整串日文必須全部翻成中文
// ---------------------------------------------------------------------------
{
  const raw = "洋室、キッチン、シャワールーム、トイレ、洗面、収納、ハンガーパイプ、棚、テラス、玄関";
  const items = parseFloorPlanDetails(raw);

  assert.equal(items.length, 10, "10 個標註應全部解析出來，不可遺漏");

  const zhNames = items.map(i => i.nameZh);
  for (const expected of [
    "西式房間", "廚房", "淋浴間", "廁所", "洗面台",
    "收納櫃", "吊衣桿", "置物層板", "露台", "玄關",
  ]) {
    assert.ok(zhNames.includes(expected), `應翻譯出「${expected}」，實際為 [${zhNames.join("、")}]`);
  }

  // 沒有任何一項殘留未翻譯的日文假名
  for (const item of items) {
    assert.ok(
      !/[ぁ-んァ-ヶ]/.test(item.nameZh),
      `「${item.rawJa}」的中文名「${item.nameZh}」仍含日文假名，等於沒翻譯`
    );
  }
  console.log("✓ 使用者回報的 10 項日文標註全部正確中文化。");
}

// ---------------------------------------------------------------------------
// 2. 尺寸必須跟著所屬空間，不可拆成獨立項目
//
//    「洋室 9.37㎡／5.7J」是一個房間的兩種尺寸寫法，不是三件事。
//    畳／帖／J 都指同一單位，統一顯示為「帖」。
// ---------------------------------------------------------------------------
{
  const items = parseFloorPlanDetails("洋室 9.37㎡／5.7J、ロフト、バルコニー 2.1㎡");
  assert.equal(items.length, 3, "應為 3 個空間，尺寸不可被當成獨立項目");

  const room = items.find(i => i.nameZh === "西式房間");
  assert.ok(room, "應解析出西式房間");
  assert.equal(room.size, "9.37㎡／5.7帖", "面積與畳數應合併，且 J 統一成「帖」");

  const balcony = items.find(i => i.nameZh === "陽台");
  assert.equal(balcony?.size, "2.1㎡", "陽台面積應保留");
  console.log("✓ 尺寸正確歸屬於所屬空間，畳／帖／J 單位已統一。");
}

// ---------------------------------------------------------------------------
// 3. 長詞優先：具體詞不可被較短或較泛的規則吃掉
// ---------------------------------------------------------------------------
{
  const cases: Array<[string, string]> = [
    ["シャワールーム", "淋浴間"],
    ["ウォークインクローゼット", "步入式衣帽間"],
    ["シューズインクローゼット", "步入式鞋物間"],
    ["ルーフバルコニー", "屋頂陽台"],
    ["玄関ホール", "玄關門廳"],
    ["洗面脱衣室", "盥洗更衣室"],
    ["ユニットバス", "整體衛浴"],
  ];
  for (const [ja, expectZh] of cases) {
    const [item] = parseFloorPlanDetails(ja);
    assert.ok(item, `「${ja}」應解析出項目`);
    assert.equal(item.nameZh, expectZh, `「${ja}」應譯為「${expectZh}」，而非被較泛的規則吃掉`);
  }
  console.log("✓ 長詞優先正確，具體空間名未被泛用規則覆蓋。");
}

// ---------------------------------------------------------------------------
// 4. 同型房間以尺寸區分，不可誤判為重複而被去重
// ---------------------------------------------------------------------------
{
  const items = parseFloorPlanDetails("洋室 6.0帖、洋室 4.5帖、和室 6.0帖");
  assert.equal(items.length, 3, "兩間不同大小的洋室與一間和室應各自保留");

  const westernRooms = items.filter(i => i.nameZh === "西式房間");
  assert.equal(westernRooms.length, 2, "兩間洋室大小不同，不可被去重");
  assert.deepEqual(
    westernRooms.map(r => r.size).sort(),
    ["4.5帖", "6.0帖"],
    "兩間洋室應分別保留各自的尺寸"
  );

  // 完全相同的重複標註才該去重
  const dup = parseFloorPlanDetails("収納、収納、収納");
  assert.equal(dup.length, 1, "完全相同的標註應去重");
  console.log("✓ 同型不同尺寸的房間各自保留，完全重複的標註才去重。");
}

// ---------------------------------------------------------------------------
// 5. 多樓層：樓層標記應由後續項目沿用，直到出現新樓層
// ---------------------------------------------------------------------------
{
  const items = parseFloorPlanDetails("1F：LDK 12.5帖、洋室 6.0帖、キッチン\n2F：洋室 5.2帖、ロフト");

  const ldk = items.find(i => i.nameZh === "客餐廳連廚房");
  assert.equal(ldk?.floor, "1F", "LDK 應標記為 1F");
  assert.equal(ldk?.size, "12.5帖");

  const kitchen = items.find(i => i.nameZh === "廚房");
  assert.equal(kitchen?.floor, "1F", "樓層標記應沿用至同樓層的後續項目");

  const loft = items.find(i => i.nameZh === "夾層閣樓");
  assert.equal(loft?.floor, "2F", "換行後的新樓層標記應生效");

  const rooms = items.filter(i => i.nameZh === "西式房間");
  assert.deepEqual(rooms.map(r => r.floor).sort(), ["1F", "2F"], "兩間洋室應分屬不同樓層");
  console.log("✓ 多樓層標記正確沿用與切換。");
}

// ---------------------------------------------------------------------------
// 6. 未收錄的詞必須保留原文，不可悄悄消失
//
//    格局圖是購屋判斷依據，寧可讓使用者看到看不懂的日文去對照圖面，
//    也不能因為字典沒收錄就無聲遺漏一項標註。
// ---------------------------------------------------------------------------
{
  const items = parseFloorPlanDetails("洋室、謎の記号、バルコニー");
  assert.equal(items.length, 3, "未收錄的標註也必須保留，不可被丟棄");

  const unknown = items.find(i => i.rawJa === "謎の記号");
  assert.ok(unknown, "未收錄詞應存在於結果中");
  assert.equal(unknown.category, "其他標註", "未收錄詞應歸入「其他標註」");
  assert.equal(unknown.nameZh, "謎の記号", "未收錄詞應原樣保留日文，不可憑空翻譯");
  console.log("✓ 未收錄的標註保留原文並歸入其他標註。");
}

// ---------------------------------------------------------------------------
// 7. 分類與分組
// ---------------------------------------------------------------------------
{
  const items = parseFloorPlanDetails("洋室、トイレ、収納、バルコニー、玄関");
  const groups = groupFloorPlanItems(items);

  assert.deepEqual(
    groups.map(g => g.category),
    ["居室空間", "水區設備", "收納空間", "戶外空間", "其他標註"],
    "分組順序應依 FLOOR_PLAN_CATEGORY_ORDER"
  );

  const onlyRooms = groupFloorPlanItems(parseFloorPlanDetails("洋室、和室"));
  assert.equal(onlyRooms.length, 1, "沒有項目的分類不應回傳");
  assert.equal(onlyRooms[0].category, "居室空間");

  for (const g of groups) {
    assert.ok(
      FLOOR_PLAN_CATEGORY_ORDER.includes(g.category),
      `分類「${g.category}」不在 FLOOR_PLAN_CATEGORY_ORDER 中`
    );
  }
  console.log("✓ 分類分組順序正確，空分類已略過。");
}

// ---------------------------------------------------------------------------
// 8. 邊界值：空值與無意義輸入不可產生雜訊項目
// ---------------------------------------------------------------------------
{
  for (const empty of ["", "   ", "なし", "無", "不明", "-"]) {
    assert.equal(
      parseFloorPlanDetails(empty).length, 0,
      `「${empty}」不應產生任何項目`
    );
  }
  assert.equal(parseFloorPlanDetails(null).length, 0, "null 應回傳空陣列");
  assert.equal(parseFloorPlanDetails(undefined).length, 0, "undefined 應回傳空陣列");

  // 只有尺寸、沒有空間名的標註無法命名，應略過而非產生空白項目
  assert.equal(parseFloorPlanDetails("約20㎡").length, 0, "只有面積而無空間名時不應產生項目");
  console.log("✓ 空值與無意義輸入未產生雜訊項目。");
}

// ---------------------------------------------------------------------------
// 9. 使用者真實圖紙（ラミアール都立大 204号室）：
//    圖面標記為「玄関、下駄箱、洗置、シャワールーム、トイレ、キッチン、洋室、収納、テラス、バルコニー」
//    - 「洗置」必須正確識別為洗衣機置放處，絕不可誤判為「洗面台」
//    - 「シャワールーム」必須識別為淋浴間
// ---------------------------------------------------------------------------
{
  const flyerRaw = "玄関、下駄箱、洗置、シャワールーム、トイレ、キッチン、洋室、収納、テラス、バルコニー";
  const items = parseFloorPlanDetails(flyerRaw);
  const names = items.map(i => i.nameZh);

  assert.ok(names.includes("洗衣機置放處"), `「洗置」應正確解析為洗衣機置放處，目前為 [${names.join("、")}]`);
  assert.ok(!names.includes("洗面台"), `圖紙無洗面台，絕對不可出現「洗面台」`);
  assert.ok(names.includes("淋浴間"), `應正確解析「淋浴間」`);
  console.log("✓ 真實圖紙核驗：洗置正確解析為洗衣機置放處，絕無洗面台誤判。");
}

// ---------------------------------------------------------------------------
// 10. 使用者真實圖紙（プレール・ドゥーク押上Ⅳ 401号室）：
//     圖面標記：「洋室 約7.6帖、浴室(1116)、洗面所、洗濯機置場、トイレ、バルコニー、K、CL、SC、玄関」
//     - 7.6帖不可在括號內重複出現（rawJa 應為「洋室」，而非「洋室 約7.6帖」）
//     - 浴室(1116) 模組代號應被過濾，不可帶出對使用者無意義的 (1116)
//     - 縮寫 K 應正確解析為廚房（水區設備），不得流入「其他標註」
//     - 縮寫 CL、SC 應正確解析為衣櫥、鞋物櫃（收納空間），不得流入「其他標註」
// ---------------------------------------------------------------------------
{
  const flyerRaw = "洋室 約7.6帖、浴室(1116)、洗面所、洗濯機置場、トイレ、バルコニー、K、CL、SC、玄関";
  const items = parseFloorPlanDetails(flyerRaw);

  const room = items.find(i => i.nameZh === "西式房間");
  assert.ok(room, "應解析出西式房間");
  assert.equal(room.size, "7.6帖", "尺寸應為 7.6帖");
  assert.equal(room.rawJa, "洋室", "rawJa 應為「洋室」，絕不可重複帶有「約7.6帖」");

  const bath = items.find(i => i.nameZh === "浴室");
  assert.ok(bath, "應解析出浴室");
  assert.equal(bath.rawJa, "浴室", "浴室模組代號 1116 應被過濾，rawJa 應為純淨「浴室」");

  const kitchen = items.find(i => i.nameZh === "廚房");
  assert.ok(kitchen, "縮寫 K 應對標為「廚房」");
  assert.equal(kitchen.category, "水區設備", "廚房 (K) 必須歸入水區設備，不可流入其他標註");
  assert.equal(kitchen.rawJa, "K / Kitchen");

  const closet = items.find(i => i.nameZh === "衣櫥");
  assert.ok(closet, "縮寫 CL 應對標為「衣櫥」");
  assert.equal(closet.category, "收納空間", "衣櫥 (CL) 必須歸入收納空間，不可流入其他標註");
  assert.equal(closet.rawJa, "CL / Closet");

  const shoes = items.find(i => i.nameZh === "鞋物櫃");
  assert.ok(shoes, "縮寫 SC 應對標為「鞋物櫃」");
  assert.equal(shoes.category, "收納空間", "鞋物櫃 (SC) 必須歸入收納空間，不可流入其他標註");
  assert.equal(shoes.rawJa, "SC / Shoes Cloak");

  const groups = groupFloorPlanItems(items);
  const otherGroup = groups.find(g => g.category === "其他標註");
  assert.equal(otherGroup?.items.length, 1, "其他標註應只剩玄關 (1 項)，K/CL/SC 不得留在其他標註中");
  assert.equal(otherGroup?.items[0].nameZh, "玄關");

  console.log("✓ 真實圖紙核驗（押上）：尺寸無重複、浴室無1116雜訊、K/CL/SC 正確歸類與對標。");
}

// ---------------------------------------------------------------------------
// 11. 多房間與多樓層物件（3LDK、4LDK 透天）：
//     - 3LDK 兩間同為 6帖 的洋室應完整保留，絕不可被誤當成重複標註
//     - 4LDK 獨棟跨樓層（1F/2F）之 LDK、和室、多間洋室與各樓層廁所皆應正確帶有樓層標記並完整保留
// ---------------------------------------------------------------------------
{
  // 3LDK 案例：LDK + 2 間 6帖洋室 + 1 間和室
  const raw3LDK = "LDK 16.5帖、洋室 6.0帖、洋室 6.0帖、和室 6.0帖、浴室、洗面所、トイレ、W、CL、CL、バルコニー、玄関";
  const items3LDK = parseFloorPlanDetails(raw3LDK);
  const rooms3LDK = items3LDK.filter(i => i.category === "居室空間");
  assert.equal(rooms3LDK.length, 4, "3LDK 應解析出 4 個居室（1 LDK + 2 洋室 + 1 和室），同為 6帖 的兩間洋室必須全部保留");
  const westernRooms = rooms3LDK.filter(i => i.nameZh === "西式房間");
  assert.equal(westernRooms.length, 2, "兩間 6帖 洋室皆應完整保留");

  // 4LDK 透天跨樓層案例：
  const raw4LDK = "1F：LDK 18帖、和室 6帖、浴室、トイレ、洗面所、2F：洋室 8帖、洋室 6帖、洋室 6帖、トイレ、バルコニー";
  const items4LDK = parseFloorPlanDetails(raw4LDK);
  const rooms4LDK = items4LDK.filter(i => i.category === "居室空間");
  assert.equal(rooms4LDK.length, 5, "4LDK 應解析出 5 個居室（1F 2間 + 2F 3間）");

  const rooms1F = rooms4LDK.filter(i => i.floor === "1F");
  const rooms2F = rooms4LDK.filter(i => i.floor === "2F");
  assert.equal(rooms1F.length, 2, "1F 應有 2 個居室");
  assert.equal(rooms2F.length, 3, "2F 應有 3 個居室（含兩間 6帖 洋室）");

  // 1F 與 2F 廁所皆應保留
  const toilets = items4LDK.filter(i => i.nameZh === "廁所");
  assert.equal(toilets.length, 2, "1F 與 2F 的兩間廁所因樓層不同應各自保留");
  assert.equal(toilets[0].floor, "1F");
  assert.equal(toilets[1].floor, "2F");

  console.log("✓ 多房間與多樓層物件核驗：同尺寸多臥室完整保留、跨樓層標記與設施獨立完整。");
}

console.log("\n格局圖標註中文化測試全部通過。");
