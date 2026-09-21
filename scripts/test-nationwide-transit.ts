import assert from "node:assert/strict";
import { findLocalTransitRoutes, isRegionalLocation, isRegionalGraphStation, isTokyoGraphStation } from "../src/lib/localTransitRoute.js";
import { getTransitLineIdentity } from "../src/lib/transit.js";

interface TestCase {
  name: string;
  region: string;
  origin: string;
  destination: string;
  context?: string;
  expectedLinePatterns?: RegExp[];
  maxExpectedDuration?: number;
  expectedTransfers?: number;
}

const testCases: TestCase[] = [
  // 1. 北海道生活圈
  {
    name: "北海道札幌地下鐵南北線: 麻生 → すすきの",
    region: "hokkaido",
    origin: "麻生",
    destination: "すすきの",
    context: "北海道札幌市",
    expectedLinePatterns: [/南北線/i],
    maxExpectedDuration: 20,
    expectedTransfers: 0
  },
  {
    name: "北海道札幌地下鐵東西線: 大通 → 新さっぽろ",
    region: "hokkaido",
    origin: "大通",
    destination: "新札幌",
    context: "北海道札幌市厚別区",
    expectedLinePatterns: [/東西線/i],
    maxExpectedDuration: 28,
    expectedTransfers: 0
  },
  {
    name: "北海道JR函館本線: 琴似 → 札幌",
    region: "hokkaido",
    origin: "琴似",
    destination: "札幌",
    context: "北海道札幌市西区",
    expectedLinePatterns: [/函館本線|東西線/i],
    maxExpectedDuration: 25,
    expectedTransfers: 0
  },

  // 2. 東北生活圈
  {
    name: "東北仙台地下鐵南北線: 八乙女 → 仙台",
    region: "tohoku",
    origin: "八乙女",
    destination: "仙台",
    context: "宮城県仙台市泉区",
    expectedLinePatterns: [/南北線/i],
    maxExpectedDuration: 22,
    expectedTransfers: 0
  },
  {
    name: "東北仙台地下鐵東西線: 荒井 → 仙台",
    region: "tohoku",
    origin: "荒井",
    destination: "仙台",
    context: "宮城県仙台市若林区",
    expectedLinePatterns: [/東西線/i],
    maxExpectedDuration: 20,
    expectedTransfers: 0
  },
  {
    name: "東北JR/地鐵雙通: 長町 → 仙台",
    region: "tohoku",
    origin: "長町",
    destination: "仙台",
    context: "宮城県仙台市太白区",
    expectedLinePatterns: [/南北線|東北本線/i],
    maxExpectedDuration: 15,
    expectedTransfers: 0
  },

  // 3. 關東生活圈 (首都圈)
  {
    name: "關東JR中央快速線: 中野 → 新宿",
    region: "kanto",
    origin: "中野",
    destination: "新宿",
    context: "東京都中野区",
    expectedLinePatterns: [/中央/i],
    maxExpectedDuration: 10,
    expectedTransfers: 0
  },
  {
    name: "關東千葉縣內: 船橋 → 西船橋",
    region: "kanto",
    origin: "船橋",
    destination: "西船橋",
    context: "千葉県船橋市",
    expectedLinePatterns: [/総武/i],
    maxExpectedDuration: 10,
    expectedTransfers: 0
  },

  // 4. 中部生活圈
  {
    name: "中部名古屋地下鐵東山線: 栄 → 名古屋",
    region: "chubu",
    origin: "栄",
    destination: "名古屋",
    context: "愛知県名古屋市中区",
    expectedLinePatterns: [/東山線/i],
    maxExpectedDuration: 12,
    expectedTransfers: 0
  },
  {
    name: "中部名古屋地下鐵鶴舞線: 大須観音 → 伏見",
    region: "chubu",
    origin: "大須観音",
    destination: "伏見",
    context: "愛知県名古屋市中区",
    expectedLinePatterns: [/鶴舞線/i],
    maxExpectedDuration: 8,
    expectedTransfers: 0
  },
  {
    name: "中部名鐵/JR核心: 金山 → 名古屋",
    region: "chubu",
    origin: "金山",
    destination: "名古屋",
    context: "愛知県名古屋市熱田区",
    expectedLinePatterns: [/東海道本線|中央本線|中央線|名鉄|名城線/i],
    maxExpectedDuration: 12,
    expectedTransfers: 0
  },

  // 5. 關西生活圈
  {
    name: "關西御堂筋線/北急直通: 江坂 → 梅田",
    region: "kansai",
    origin: "江坂",
    destination: "梅田",
    context: "大阪府吹田市",
    expectedLinePatterns: [/御堂筋線/i],
    maxExpectedDuration: 18,
    expectedTransfers: 0
  },
  {
    name: "關西京都市營地下鐵烏丸線: 烏丸御池 → 京都",
    region: "kansai",
    origin: "烏丸御池",
    destination: "京都",
    context: "京都府京都市中京区",
    expectedLinePatterns: [/烏丸線/i],
    maxExpectedDuration: 12,
    expectedTransfers: 0
  },
  {
    name: "關西神戶市營地下鐵西神山手線: 三宮 → 新長田",
    region: "kansai",
    origin: "三宮",
    destination: "新長田",
    context: "兵庫県神戸市中央区",
    expectedLinePatterns: [/西神・山手線|神戸線|JR/i],
    maxExpectedDuration: 16,
    expectedTransfers: 0
  },

  // 6. 中國/四國生活圈
  {
    name: "中國JR山陽本線: 横川 → 広島",
    region: "chugoku",
    origin: "横川",
    destination: "広島",
    context: "広島県広島市西区",
    expectedLinePatterns: [/山陽本線|可部線/i],
    maxExpectedDuration: 12,
    expectedTransfers: 0
  },
  {
    name: "中國廣島Astram Line: 県庁前 → 本通",
    region: "chugoku",
    origin: "県庁前",
    destination: "本通",
    context: "広島県広島市中区",
    expectedLinePatterns: [/アストラムライン|広島新交通|Astram/i],
    maxExpectedDuration: 8,
    expectedTransfers: 0
  },
  {
    name: "中國岡山-倉敷生活圈: 岡山 → 倉敷",
    region: "chugoku",
    origin: "岡山",
    destination: "倉敷",
    context: "岡山県岡山市北区",
    expectedLinePatterns: [/山陽本線|伯備線/i],
    maxExpectedDuration: 25,
    expectedTransfers: 0
  },

  // 7. 九州/沖繩生活圈
  {
    name: "九州福岡市地下鐵空港線: 西新 → 博多",
    region: "kyushu",
    origin: "西新",
    destination: "博多",
    context: "福岡県福岡市早良区",
    expectedLinePatterns: [/空港線/i],
    maxExpectedDuration: 18,
    expectedTransfers: 0
  },
  {
    name: "九州西鐵天神大牟田線: 薬院 → 西鉄福岡",
    region: "kyushu",
    origin: "薬院",
    destination: "西鉄福岡（天神）",
    context: "福岡県福岡市中央区",
    expectedLinePatterns: [/天神大牟田線|七隈線/i],
    maxExpectedDuration: 10,
    expectedTransfers: 0
  },
  {
    name: "沖繩都市單軌電車ゆいレール: 首里 → 県庁前",
    region: "okinawa",
    origin: "首里",
    destination: "県庁前",
    context: "沖縄県那覇市",
    expectedLinePatterns: [/沖縄都市モノレール|ゆいレール/i],
    maxExpectedDuration: 22,
    expectedTransfers: 0
  },

  // 8. 隔離驗證: 大阪日本橋 vs 東京日本橋
  {
    name: "隔離驗證: 大阪難波 → 大阪日本橋 (關西路網)",
    region: "kansai",
    origin: "難波",
    destination: "日本橋",
    context: "大阪府大阪市中央区",
    expectedLinePatterns: [/千日前線|近鉄難波線/i],
    maxExpectedDuration: 8,
    expectedTransfers: 0
  },
  {
    name: "隔離驗證: 茅場町 → 東京日本橋 (東京路網)",
    region: "kanto",
    origin: "茅場町",
    destination: "日本橋",
    context: "東京都中央区",
    expectedLinePatterns: [/東西線/i],
    maxExpectedDuration: 6,
    expectedTransfers: 0
  }
];

async function runNationwideTransitTests() {
  console.log("=== 全日本主要生活圈通勤路線本地圖資全面測試 ===");
  let passedCount = 0;
  const totalStartTime = performance.now();

  for (const tc of testCases) {
    const t0 = performance.now();
    const routes = findLocalTransitRoutes(tc.origin, tc.destination, 3, tc.context || "");
    const elapsed = performance.now() - t0;

    assert.ok(routes.length > 0, `[${tc.name}] 應找到至少一條路線，但查無結果`);
    const bestRoute = routes[0];

    // 驗證轉乘次數
    if (tc.expectedTransfers !== undefined) {
      assert.equal(
        bestRoute.transfers,
        tc.expectedTransfers,
        `[${tc.name}] 轉乘次數預期 ${tc.expectedTransfers}，實際為 ${bestRoute.transfers}`
      );
    }

    // 驗證乘車時間
    if (tc.maxExpectedDuration !== undefined) {
      assert.ok(
        bestRoute.totalDurationMinutes <= tc.maxExpectedDuration,
        `[${tc.name}] 通勤時間 ${bestRoute.totalDurationMinutes} 分鐘超出上限 ${tc.maxExpectedDuration} 分鐘`
      );
    }

    // 驗證路線匹配
    if (tc.expectedLinePatterns && tc.expectedLinePatterns.length > 0) {
      const allLines = bestRoute.segments.map(s => `${s.lineName || ""} ${s.operator || ""}`).join(" ");
      const matchesPattern = tc.expectedLinePatterns.some(p => p.test(allLines));
      assert.ok(
        matchesPattern,
        `[${tc.name}] 路線段 [${allLines}] 未命中預期的任何路線模式 [${tc.expectedLinePatterns.map(p => p.source).join(", ")}]`
      );
    }

    // 驗證路線段色彩與線路識別
    for (const segment of bestRoute.segments) {
      if (segment.type !== "walk" && segment.type !== "wait" && segment.lineName) {
        const id = getTransitLineIdentity(segment.lineName);
        assert.ok(id.color, `[${tc.name}] 路線 ${segment.lineName} 應具有官方色彩`);
      }
    }

    // 驗證毫秒級查詢效能 (東京大型圖資初次查詢允許 150ms，平均均在 10ms 以內)
    assert.ok(
      elapsed < 150,
      `[${tc.name}] 本地路網查詢耗時 ${elapsed.toFixed(2)}ms 超過 150ms 門檻`
    );

    console.log(
      `✓ [${tc.region.toUpperCase()}] ${tc.name} -> ${bestRoute.totalDurationMinutes}分 (${bestRoute.transfers}轉乘, 查詢耗時 ${elapsed.toFixed(2)}ms)`
    );
    passedCount += 1;
  }

  const totalElapsed = performance.now() - totalStartTime;
  console.log(`\n==================================================`);
  console.log(`全日本 7 大生活圈主要核心城市測試全部通過！(${passedCount}/${testCases.length})`);
  console.log(`總測試耗時: ${totalElapsed.toFixed(2)}ms，平均每筆查詢 ${(totalElapsed / testCases.length).toFixed(2)}ms`);
  console.log(`==================================================`);

  // -------------------------------------------------------------------------
  // 跨地區穿越防護
  //
  // 全國圖把各都會圈放在同一份資料、共用 sourceId="regional"，因此同名車站
  // （奈良與札幌都有「学園前」、神戶與札幌都有「元町」）在圖上會塌成同一個節點。
  // 修復前 近鉄奈良 → 三宮 會被規劃成「近鉄奈良線 → 札幌市営地下鉄東豊線 → JR神戸線」，
  // 從奈良一步瞬移到札幌。路線搜尋必須鎖住地區。
  // -------------------------------------------------------------------------
  const OTHER_REGION_LINES = /札幌市営|仙台市地下鉄|福岡市地下鉄|名古屋市営|アストラムライン|ゆいレール|西鉄/;
  // 圖資中確認存在的 5 組跨地區同名站：元町、県庁前、学園前、金山、国際センター
  const crossRegionCases: Array<{ origin: string; destination: string; note: string }> = [
    { origin: "近鉄奈良", destination: "三宮", note: "奈良→神戶（「学園前」同名站）" },
    { origin: "三宮", destination: "梅田", note: "神戶→大阪（「元町」同名站）" },
    { origin: "学園前", destination: "難波", note: "直接由同名站「学園前」出發（奈良）" },
    { origin: "元町", destination: "神戸", note: "直接由同名站「元町」出發（神戶）" },
  ];

  for (const { origin, destination, note } of crossRegionCases) {
    const routes = findLocalTransitRoutes(origin, destination, 3);
    assert.ok(routes.length > 0, `[跨地區] ${origin} → ${destination} 應找到路線`);
    for (const route of routes) {
      const lines = route.segments
        .filter(s => s.type !== "walk" && s.type !== "wait")
        .map(s => s.lineName);
      const intruder = lines.find(line => OTHER_REGION_LINES.test(line));
      assert.ok(
        !intruder,
        `[跨地區] ${note}：關西路線不得經過其他都會圈的「${intruder}」（同名車站造成的瞬移）`
      );
    }
    console.log(`✓ [跨地區] ${note}：未穿越到其他都會圈`);
  }
  console.log("✓ 同名車站不再導致跨地區瞬移。");

  // -------------------------------------------------------------------------
  // 線名不得跨地區誤對應
  //
  // 「東海道本線」橫跨東京～神戶，JR西日本叫它「JR京都線・神戸線」、
  // JR東海叫它「JR東海道本線(名古屋)」。線路識別表若無條件吃下「東海道本線」，
  // 名古屋的路線就會在畫面上顯示成關西線名（實測 金山 → 名古屋 曾被標成
  // 「JR京都線・神戸線」）。另外「神戸」是兩個字，寫成字元類 [神戸] 會匹配不到
  // 「阪急神戸線」，導致該線失去識別與官方色。
  // -------------------------------------------------------------------------
  const lineIdentityCases: Array<{ input: string; expectId: string; note: string }> = [
    { input: "JR東海道本線(名古屋)", expectId: "jr-tokaido-chubu", note: "名古屋的東海道本線不得顯示為關西線名" },
    { input: "JR東海道本線", expectId: "jr-kyoto-kobe", note: "未指明地區的東海道本線維持關西通稱" },
    { input: "阪急神戸線", expectId: "hankyu-kobe", note: "「神戸」是兩個字，不可寫成字元類" },
    { input: "阪急神戶線", expectId: "hankyu-kobe", note: "繁體「神戶」也要能識別" },
    { input: "JR中央本線(名古屋)", expectId: "jr-chuo-chubu", note: "名古屋中央本線" },
  ];

  for (const { input, expectId, note } of lineIdentityCases) {
    const identity = getTransitLineIdentity(input);
    assert.ok(identity, `[線名識別] 「${input}」應可解析出線路識別（${note}）`);
    assert.equal(identity.id, expectId, `[線名識別] 「${input}」應對應 ${expectId}：${note}`);
    assert.ok(identity.color, `[線名識別] 「${input}」應具有官方色彩`);
  }
  console.log("✓ 線名未跨地區誤對應，多字線名（阪急神戸線）可正確識別。");
}

runNationwideTransitTests();
