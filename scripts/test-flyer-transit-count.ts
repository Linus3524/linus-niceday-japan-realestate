import assert from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { extractFlyerTransitStops, isStopCovered } from "../api/analyze-listing";
import type { TransitLeg } from "../src/lib/transitParser";

/**
 * 圖紙文字層交通動線校驗的回歸測試。
 *
 * ⚠️ 這道校驗的輸出**只寫伺服器日誌，不顯示給使用者**（見 analyze-listing
 * 對應段落的完整理由）。它與模型之間存在無法消除的資訊落差：模型讀得到版面
 * 位置與欄位角色，這裡只讀得到抽平後的字串，因此無法可靠分辨「標題橫幅的
 * 重述」與「交通欄的條列」。實績是誤報兩次、真陽性零次；三起真實漏失的肇因
 * 都在 transitParser 而非模型判讀。
 *
 * 保留測試的目的因此不是「守住使用者可見的警報」，而是確保這個觀測指標
 * 在日誌裡仍具參考價值——訊號太髒的話，log 也會沒人看。
 *
 * 曾兩度因「比數量」而誤報真實圖紙（trias magome 2→3、excelan 3→4）：
 * 數量比較要求重複刊載能被精準去重，而那是純 regex 做不到的語意判斷。
 * 現行做法改為集合涵蓋——問「圖紙上的每個站是否都在解析結果裡」，
 * 重複刊載自然無害。以下用例一律以「未涵蓋的站」為斷言對象。
 */

/**
 * 未被解析結果涵蓋的站名清單，直接沿用正式程式碼的判斷函式。
 * 不在測試裡另寫一份等價邏輯——那會變成拿複製品驗證自己。
 */
function missingStations(layoutText: string, legs: TransitLeg[]): string[] {
  const uncovered = extractFlyerTransitStops(layoutText).filter(stop => !isStopCovered(stop, legs));
  return [...new Set(uncovered.map(stop => stop.station))];
}

const leg = (lineName: string, stationName: string, walkMin: number): TransitLeg =>
  ({ lineName, stationName, walkMin } as TransitLeg);

const tests: Array<{ name: string; run: () => void }> = [
  {
    name: "純交通欄：兩條動線都讀到就不出聲",
    run: () => {
      const layout = [
        "交通  都営浅草線「馬込」駅 徒歩5分",
        "      JR京浜東北線「大森」駅 徒歩15分"
      ].join("\n");
      assert.deepEqual(missingStations(layout, [
        leg("都営浅草線", "馬込", 5),
        leg("JR京浜東北線", "大森", 15),
      ]), []);
    }
  },
  {
    name: "周邊設施的徒歩不參與校驗",
    run: () => {
      const layout = [
        "交通  都営浅草線「馬込」駅 徒歩5分",
        "周辺環境  スーパーマルエツ 徒歩3分"
      ].join("\n");
      assert.deepEqual(missingStations(layout, [leg("都営浅草線", "馬込", 5)]), []);
    }
  },
  {
    name: "生活環境欄的小学校・商店街不參與校驗",
    run: () => {
      const layout = [
        "交通  都営浅草線「馬込」駅 徒歩5分",
        "馬込第三小学校 徒歩8分",
        "馬込銀座商店街 徒歩4分"
      ].join("\n");
      assert.deepEqual(missingStations(layout, [leg("都営浅草線", "馬込", 5)]), []);
    }
  },
  {
    name: "備考欄重述「最寄駅まで徒歩7分」不誤報",
    run: () => {
      const layout = [
        "交通  東急東横線「都立大学」駅 徒歩7分",
        "備考  最寄駅まで徒歩7分の好立地"
      ].join("\n");
      assert.deepEqual(missingStations(layout, [leg("東急東横線", "都立大学", 7)]), []);
    }
  },
  {
    name: "頁首標題橫幅重述動線不誤報（the trias magome 實際文字層）",
    run: () => {
      // 實測案例：物件名橫幅把最強的那條動線再印一次。
      // 數量比較會判成 3 條而誤報；涵蓋比較則因同站同分鐘而無害。
      const layout = [
        "the trias magome　　都営浅草線「西馬込」徒歩 4 分",
        "都営浅草線 「西馬込」駅　　徒歩4分 落ち着いた住宅街が広がる南馬込エリア。",
        "都営浅草線 「馬込」駅　　徒歩20分駅周辺にはスーパーや飲食店も揃い、"
      ].join("\n");
      assert.deepEqual(missingStations(layout, [
        leg("都営浅草線", "西馬込", 4),
        leg("都営浅草線", "馬込", 20),
      ]), []);
    }
  },
  {
    name: "標語行省略路線名也不誤報（excelan 東武練馬 實際文字層）",
    run: () => {
      // 標語「築浅アパート 東武練馬駅徒歩6分」未寫路線名，
      // 以路線名去重會失效；涵蓋比較只看站名與分鐘，不受影響。
      const layout = [
        "エクセラン東武練馬                    東武東上線 東武練馬駅 徒歩6分",
        "                                      都営三田線 西台 徒歩28分",
        "                                      東京メトロ副都心線 平和台 徒歩30分",
        "築浅アパート 東武練馬駅徒歩6分        ■ＯＵＴＬＩＮＥ"
      ].join("\n");
      assert.deepEqual(missingStations(layout, [
        leg("東武東上線", "東武練馬", 6),
        leg("都営三田線", "西台", 28),
        leg("東京メトロ副都心線", "平和台", 30),
      ]), []);
    }
  },
  {
    name: "真的漏抄整條路線時必須報出站名（防線不可失效）",
    run: () => {
      const layout = [
        "交通  JR総武線「馬喰町」駅 徒歩4分",
        "      都営新宿線「馬喰横山」駅 徒歩6分",
        "      日比谷線「小伝馬町」駅 徒歩9分"
      ].join("\n");
      // AI 只讀出第一條，另兩站必須被指名。
      assert.deepEqual(missingStations(layout, [leg("JR総武線", "馬喰町", 4)]),
        ["馬喰横山", "小伝馬町"]);
    }
  },
  {
    name: "同站不同路線：只讀到一條時仍要報（同站不可矇混過關）",
    run: () => {
      const layout = [
        "交通  都営大江戸線「両国」駅 徒歩1分",
        "      JR中央・総武線「両国」駅 徒歩6分"
      ].join("\n");
      // 站名相同但分鐘數不同，徒歩6分那條沒讀到就必須出聲。
      assert.deepEqual(missingStations(layout, [leg("都営大江戸線", "両国", 1)]), ["両国"]);
    }
  },
  {
    name: "部首字元「⻄」(U+2EC4) 須折回「西」才能比對（trias magome 誤報主因）",
    run: () => {
      // PDF 文字層把「西」存成部首「⻄」，NFKC 與 NFKD 都不轉換。
      const layout = "都営浅草線 「\u2EC4馬込」駅　徒歩4分";
      assert.deepEqual(missingStations(layout, [leg("都営浅草線", "西馬込", 4)]), []);
    }
  },
  {
    name: "站名本身以營運商名開頭時不可被剝除（東武練馬 ≠ 練馬）",
    run: () => {
      // 曾因剝除「東武」前綴而把東武練馬誤判為練馬，導致漏抄完全不報。
      const layout = "交通  東武東上線 東武練馬駅 徒歩6分";
      assert.deepEqual(missingStations(layout, [leg("西武池袋線", "練馬", 6)]), ["東武練馬"]);
    }
  },
  {
    name: "站名未加「駅」也要取得出（excelan 第 2、3 條動線寫法）",
    run: () => {
      const layout = [
        "エクセラン東武練馬      東武東上線 東武練馬駅 徒歩6分",
        "                        都営三田線 西台 徒歩28分",
        "                        東京メトロ副都心線 平和台 徒歩30分"
      ].join("\n");
      // 只讀出第一條時，另兩站必須被指名——不支援無「駅」寫法就會靜默。
      assert.deepEqual(missingStations(layout, [leg("東武東上線", "東武練馬", 6)]),
        ["西台", "平和台"]);
    }
  },
  {
    name: "站名帶營運商前綴仍視為同一站",
    run: () => {
      const layout = "交通  JR山手線「新宿」駅 徒歩8分";
      assert.deepEqual(missingStations(layout, [leg("JR山手線", "JR新宿駅", 8)]), []);
    }
  },
  {
    name: "徒歩分鐘差 1 分仍視為涵蓋（排版誤差容忍）",
    run: () => {
      const layout = "交通  都営浅草線「馬込」駅 徒歩5分";
      assert.deepEqual(missingStations(layout, [leg("都営浅草線", "馬込", 6)]), []);
    }
  },
  {
    name: "全形數字與空白（NFKC 正規化）",
    run: () => {
      const layout = "交通　都営浅草線「馬込」駅　徒歩５分";
      assert.deepEqual(missingStations(layout, [leg("都営浅草線", "馬込", 5)]), []);
    }
  },
  {
    name: "沒有交通資訊時不產生任何校驗對象",
    run: () => {
      assert.deepEqual(extractFlyerTransitStops("周辺環境  コンビニ 徒歩2分"), []);
      assert.deepEqual(extractFlyerTransitStops(""), []);
    }
  },
  {
    name: "此判斷不得再接回使用者可見路徑（降級守護）",
    run: () => {
      // 這個結果只能進 console.warn。若日後有人重新引入 transitShortfallNotice
      // 之類的欄位把它顯示出來，誤報就會再次傷害所有提醒的可信度——
      // 降級的完整理由見 analyze-listing.ts 對應段落。
      const root = new URL("..", import.meta.url).pathname;
      const sources = [
        "api/analyze-listing.ts",
        "src/lib/listing/types.ts",
        "src/lib/server/listing/types.ts",
        "src/components/listing/ListingLocationSection.tsx",
      ];
      for (const relative of sources) {
        const text = readFileSync(join(root, relative), "utf8");
        // 只允許出現在註解裡的歷史說明，不可再有實際的欄位賦值或讀取。
        const offending = text.split("\n").filter(line =>
          /transitShortfallNotice/.test(line) && !/^\s*(?:\/\/|\*|\{\s*\/\*)/.test(line.trim()));
        assert.deepEqual(offending, [],
          `${relative} 不可再把交通動線校驗結果接回使用者可見路徑`);
      }
    }
  }
];


let passed = 0;
for (const test of tests) {
  try {
    test.run();
    console.log(`✓ ${test.name}`);
    passed += 1;
  } catch (error) {
    console.error(`✗ ${test.name}\n  ${(error as Error).message}`);
  }
}

console.log(`\n圖紙交通動線校驗：${passed}/${tests.length} 通過`);
if (passed !== tests.length) process.exit(1);
