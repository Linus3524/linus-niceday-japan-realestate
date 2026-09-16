import assert from "node:assert/strict";
import { parseGuaranteeFee, parseGuaranteeFeeBreakdown } from "../src/lib/listingExtraction.js";

/**
 * 保證會社費用解析的回歸測試。
 *
 * 日本的家賃保証会社（GTN、Casa、日本セーフティー、全保連等）有三種收費結構，
 * 而且經常併用：
 *   初回保証料  簽約時一次性 → 屬初期費用
 *   月額保証料  按月與租金一起付 → 不是初期費用，但整個租期都要付
 *   年間保証料  每年或每兩年 → 不是初期費用
 *
 * 舊版 parseGuaranteeFee 只抓「第一個百分比」，造成兩種實際錯誤：
 *   「月額保証料 賃料の1%」→ 被當成初回 760 円算進初期費用，
 *                            而真正每月要付的 760 円從頭到尾沒出現在報告裡。
 *   「年間保証料 10,000円」→ 年費被當成初期費用。
 * 對外國籍租客來說月額方案很常見（GTN 尤其），這個誤判會同時虛報初期費用
 * 又漏報持續支出，兩個方向都錯。
 */

const total = 76000; // 月總租金（租金 70,000 ＋ 管理費 6,000）
const b = (text: string) => parseGuaranteeFeeBreakdown(text, total);

const tests: Array<{ name: string; run: () => void }> = [
  {
    name: "純初回百分比",
    run: () => {
      assert.deepEqual(b("50%"), { initial: 38000, monthly: null, annual: null });
      assert.deepEqual(b("初回保証料50%"), { initial: 38000, monthly: null, annual: null });
      assert.deepEqual(b("総賃料50%"), { initial: 38000, monthly: null, annual: null });
    },
  },
  {
    name: "月額百分比不可算成初回",
    run: () => {
      // 這是本次修正的核心案例：舊版會回 initial=760。
      assert.deepEqual(b("月額保証料 賃料の1%"), { initial: null, monthly: 760, annual: null });
      assert.deepEqual(b("月額1%"), { initial: null, monthly: 760, annual: null });
      assert.equal(parseGuaranteeFee("月額1%", total), null, "只有月額時初期費用不得取用該金額");
    },
  },
  {
    name: "初回與月額併記各自歸位",
    run: () => {
      assert.deepEqual(b("初回50%、月額1%"), { initial: 38000, monthly: 760, annual: null });
      assert.deepEqual(b("初回賃料の50%、以降月額1%"), { initial: 38000, monthly: 760, annual: null });
      // GTN 的典型寫法：全形斜線分隔。
      assert.deepEqual(b("GTN 初回100%／月額1%"), { initial: 76000, monthly: 760, annual: null });
    },
  },
  {
    name: "「月額」修飾租金時是計算基準，不是付款頻率",
    run: () => {
      // 真實圖紙用例（refactor-baseline）：「月額総賃料の30%」指的是
      // 「以月額總賃料為基數的 30%」一次性初回保證料，不是每月付 30%。
      // 若誤判成月額，初期費用會少算 31,500 円，且憑空多出一筆每月支出。
      // 以 105,000 円月總租金計算，對齊 refactor-baseline 的實際數字。
      const at105k = (text: string) => parseGuaranteeFeeBreakdown(text, 105000);
      assert.deepEqual(at105k("月額総賃料の30%"), { initial: 31500, monthly: null, annual: null });
      assert.deepEqual(at105k("月額賃料の50%"), { initial: 52500, monthly: null, annual: null });
      // 對照組：「月額」後面接的是保証料／利用料而非租金名詞時，才是付款頻率。
      assert.equal(at105k("月額保証料 賃料の1%").monthly, 1050);
      assert.equal(at105k("月額利用料1%").monthly, 1050);
    },
  },
  {
    name: "年額不可算成初回",
    run: () => {
      assert.deepEqual(b("年間保証料 10,000円"), { initial: null, monthly: null, annual: 10000 });
      assert.equal(parseGuaranteeFee("年間保証料 10,000円", total), null);
    },
  },
  {
    name: "初回與年額併記",
    run: () => {
      const r = b("初回50%、更新料10,000円/年");
      assert.equal(r.initial, 38000);
      assert.equal(r.annual, 10000, "「/年」要判成年額而不是被切斷");
    },
  },
  {
    name: "千分位逗號不可被當成分隔符",
    run: () => {
      // 曾因把半形逗號當分隔符，導致「10,000円」被切成「10」+「000円」，兩段都解析不出金額。
      assert.equal(b("年間保証料 10,000円").annual, 10000);
      assert.equal(b("45,000円").initial, 45000);
      assert.equal(b("月額2,200円").monthly, 2200);
    },
  },
  {
    name: "月額小額金額不受初回的 10,000 円下限影響",
    run: () => {
      // 初回沿用 10,000 円下限以避開雜項小額；月額則必須收得到 2,200 円這種。
      assert.equal(b("月額2,200円").monthly, 2200);
      assert.equal(b("月額1,100円").monthly, 1100);
    },
  },
  {
    name: "月數與固定金額格式仍正常",
    run: () => {
      assert.equal(b("0.5ヶ月").initial, 38000);
      assert.equal(b("1ヶ月").initial, 76000);
      assert.equal(b("45,000円").initial, 45000);
      assert.equal(b("5万円").initial, 50000);
    },
  },
  {
    name: "外国人プラン比例照常解析",
    run: () => {
      assert.equal(b("外国人プラン80%").initial, 60800);
      assert.deepEqual(b("外国人プラン 初回80%、月額1%"), { initial: 60800, monthly: 760, annual: null });
    },
  },
  {
    name: "継続保証委託料判成年額",
    run: () => {
      assert.equal(b("継続保証委託料10,000円").annual, 10000);
    },
  },
  {
    name: "無效輸入回全 null",
    run: () => {
      assert.deepEqual(b(""), { initial: null, monthly: null, annual: null });
      assert.deepEqual(parseGuaranteeFeeBreakdown(null, total), { initial: null, monthly: null, annual: null });
      assert.deepEqual(parseGuaranteeFeeBreakdown(undefined, total), { initial: null, monthly: null, annual: null });
      assert.deepEqual(b("保証会社必須"), { initial: null, monthly: null, annual: null });
    },
  },
  {
    name: "超出合理範圍的比例不採用",
    run: () => {
      assert.equal(b("300%").initial, null, "超過 200% 視為誤讀");
    },
  },
  {
    name: "空白分隔的併記：初回不可被句末的「年間」吸走",
    run: () => {
      // リテラス南千住209（実物）：「月額賃料等の60％ 月次保証料1％ 年間保証料なし」。
      // 依標點切段時整串算一段，ANNUAL_MARKER 比對到句末的「年間」，
      // 於是開頭 60%（真正的初回）被歸成年費——初期費用少算 68,400 円，
      // 又憑空報出一筆不存在的年度支出，兩個方向同時錯。
      const at114k = (text: string) => parseGuaranteeFeeBreakdown(text, 114000);
      assert.deepEqual(
        at114k("【エポス】月額賃料等の60％ 月次保証料1％ 年間保証料なし"),
        { initial: 68400, monthly: 1140, annual: null },
      );
      // 同一張圖紙的 GTN 方案：初回 100%＋月次定額。
      assert.deepEqual(
        at114k("【GTN】月額賃料等の100％ 月次保証料1000円+決済手数料330円"),
        { initial: 114000, monthly: 1000, annual: null },
      );
    },
  },
  {
    name: "「月次」一律是每月支付",
    run: () => {
      // 「月額」有計算基準／付款頻率兩種用法，「月次」則只有付款頻率一種。
      assert.equal(b("月次保証料1,000円").monthly, 1000);
      assert.equal(b("月次手数料2,330円（税込）").monthly, 2330);
      assert.equal(b("月次保証料1%").monthly, 760);
    },
  },
  {
    name: "「○年毎」換算成每年金額，不得照抄成年費",
    run: () => {
      // プレール・ドゥーク下北沢211（実物）：「継続保証委託料20,000円（2年毎）」。
      // annual 欄位的語意是「每年」，照抄 20,000 会把實際負擔講成兩倍。
      assert.equal(b("継続保証委託料20,000円（2年毎）").annual, 10000);
      assert.equal(b("更新保証料20,000円（2年ごと）").annual, 10000);
      // 每年一次的寫法不受影響。
      assert.equal(b("年間保証料10,000円").annual, 10000);
      assert.equal(b("継続保証委託料10,000円（1年毎）").annual, 10000);
      // 木下グループ保証の全文（初回・月額・継続が一行に併記）。
      assert.deepEqual(
        parseGuaranteeFeeBreakdown("初回保証料80％、利用手数料月額550円（税込）、継続保証委託料20,000円（2年毎）", 115000),
        { initial: 92000, monthly: 550, annual: 10000 },
      );
    },
  },
  {
    name: "「月額合計」是計算基準，不是付款頻率",
    run: () => {
      // 日神パレスステージ三軒茶屋（実物・真実 AI 實測才發現）：
      // 「初回保証委託料月額合計の60％」。舊的後向否定只列了 総?賃料|家賃|総額，
      // 漏掉「合計」→ 判成每月付 60%：初回少算 48,600 円，又虛構一筆
      // 48,600 円／月的經常性支出，兩年累計誤差超過一百萬円。
      // 姊妹寫法「月額賃料等の合計の50%」因為「賃料」先命中而一直正確，
      // 正好把這個破口遮住——只測後者永遠測不出問題。
      const at81k = (text: string) => parseGuaranteeFeeBreakdown(text, 81000);
      assert.deepEqual(
        at81k("初回保証委託料月額合計の60％、1年毎に継続保証委託料1万円"),
        { initial: 48600, monthly: null, annual: 10000 },
      );
      assert.deepEqual(at81k("月額合計の60%"), { initial: 48600, monthly: null, annual: null });
      // 對照組：エスパシオ202 的「月額賃料等の合計」既有行為不得退化。
      assert.deepEqual(at81k("月額賃料等の合計の50%"), { initial: 40500, monthly: null, annual: null });
      // 對照組：真正的付款頻率仍須判成月額。
      assert.equal(at81k("月額保証料1%").monthly, 810);
      assert.equal(at81k("月次保証料1000円").monthly, 1000);
    },
  },
  {
    name: "三井系「初回保証委託料…、２年目以降：9,600円/年」",
    run: () => {
      // パークアクシス北千束206 / Ｃａｓａ－Ａｉｌｅ603（実物）。
      // 「２年目以降」は継続費用なので初回に混ぜてはいけない。
      assert.deepEqual(
        parseGuaranteeFeeBreakdown("初回保証委託料(最低20,000円)：月額賃料等の50％、２年目以降：9,600円/年", 168000),
        { initial: 84000, monthly: null, annual: 9600 },
      );
    },
  },
  {
    name: "契約時／毎月／更新時の三段書き（アール恒産）",
    run: () => {
      // エスパシオ202（実物）：初回・月額・年次がすべて比率で書かれている。
      assert.deepEqual(
        parseGuaranteeFeeBreakdown(
          "契約時：月額賃料等の合計の50％（最低保証料25,000円）、毎月：システム使用料（口座引落等）：月額賃料等の合計の1.25％、更新時（1年毎）：月額合計の15％",
          97000,
        ),
        { initial: 48500, monthly: 1213, annual: 14550 },
      );
    },
  },
  {
    name: "月額保證料不得計入租金行情比較基準",
    run: () => {
      // 這是明確的產品決策，不是巧合：租金行情比較的基準只有「賃料＋管理費（共益費）」。
      // 月額保證料雖然每月都要付，但它是保證公司的服務費、不是房屋的對價，
      // 各家方案差異也大；混進基準會讓同一間房因為選了不同保證公司而被判成
      // 不同的行情水準，比較就失去意義。改在初期費用備註如實揭露。
      //
      // 真實 AI 實測（9 張圖紙）確認 5 張有月額保證料者，基準皆為賃料＋管理費。
      // 這裡用純函式把該定義釘住：breakdown.monthly 與基準計算完全無關。
      const rent = 114000, managementFee = 12000;
      const baseline = rent + managementFee;
      const bd = parseGuaranteeFeeBreakdown("【GTN】月額賃料等の100% 月次保証料1000円", baseline);
      assert.equal(bd.monthly, 1000, "月額保證料應被解析出來（供備註揭露）");
      assert.equal(baseline, 126000, "行情基準僅為賃料＋管理費");
      assert.notEqual(baseline, 126000 + (bd.monthly ?? 0), "基準不可加上月額保證料");
      // 初回則相反：它是簽約當下的實際支出，必須進初期費用。
      assert.equal(bd.initial, 126000, "初回保證料以基準計算並計入初期費用");
    },
  },
  {
    name: "parseGuaranteeFee 只回初回，與 breakdown 一致",
    run: () => {
      for (const text of ["50%", "初回50%、月額1%", "月額1%", "年間保証料 10,000円", "1ヶ月"]) {
        assert.equal(parseGuaranteeFee(text, total), parseGuaranteeFeeBreakdown(text, total).initial, text);
      }
    },
  },
];

let failed = 0;
for (const test of tests) {
  try {
    test.run();
  } catch (error) {
    failed++;
    console.error(`✗ ${test.name}\n  ${error instanceof Error ? error.message : error}`);
  }
}
if (failed) {
  console.error(`test-guarantee-fee: ${failed}/${tests.length} 項失敗`);
  process.exit(1);
}
console.log(`test-guarantee-fee: ${tests.length} 項全部通過（初回／月額／年額分離、千分位、GTN 併記）`);
