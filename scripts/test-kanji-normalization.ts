import assert from "node:assert/strict";
import { matchesAllTokens, tokenizeQuery, normalizeSearchText } from "../src/lib/search.js";
import { searchThreads } from "../src/lib/threadSearch.js";

// 1. 基礎字元正規化測試
assert.equal(normalizeSearchText("海外審査"), "海外審查");
assert.equal(normalizeSearchText("印紙税"), "印紙稅");
assert.equal(normalizeSearchText("一戸建"), "一戶建");
assert.equal(normalizeSearchText("保証会社"), "保證会社");
assert.equal(normalizeSearchText("重要事項説明"), "重要事項說明");
assert.equal(normalizeSearchText("渋谷駅"), "澀谷駅");
assert.equal(normalizeSearchText("横浜市"), "橫濱市");

// 2. Tokenize 切詞與正規化測試
assert.deepEqual(tokenizeQuery("海外審査"), ["海外審查"]);
assert.deepEqual(tokenizeQuery("海外審查"), ["海外審查"]);
assert.deepEqual(tokenizeQuery("印紙税 試算"), ["印紙稅", "試算"]);

// 3. 跨編碼比對測試（matchesAllTokens）
// 使用者輸入中文「海外審查」，內文為日文「海外審査」
assert.equal(
  matchesAllTokens("海外審査所需資料與準備文件對照", tokenizeQuery("海外審查")),
  true,
  "中文『海外審查』應能命中日文『海外審査』"
);

// 使用者輸入日文「海外審査」，內文為中文「海外審查」
assert.equal(
  matchesAllTokens("海外審查所需資料與準備文件對照", tokenizeQuery("海外審査")),
  true,
  "日文『海外審査』應能命中中文『海外審查』"
);

// 複合詞：貸款審查
assert.equal(
  matchesAllTokens("本審査通過後，借款人與銀行簽署金錢消費貸借契約", tokenizeQuery("本審查")),
  true,
  "『本審查』應能命中『本審査』"
);

// 稅費：印紙稅
assert.equal(
  matchesAllTokens("不動產買賣契約需貼印紙税", tokenizeQuery("印紙稅")),
  true,
  "『印紙稅』應能命中『印紙税』"
);

// 建物：一戶建
assert.equal(
  matchesAllTokens("東京都內一戸建交易行情", tokenizeQuery("一戶建")),
  true,
  "『一戶建』應能命中『一戸建』"
);

// 4. Threads 搜尋跨字體匹配測試
const threadsRent = searchThreads("審查", { context: "rent", limit: 3 });
assert.ok(threadsRent.total > 0, "搜尋『審查』應能找到相關文章");

const threadsRentJp = searchThreads("審査", { context: "rent", limit: 3 });
assert.ok(threadsRentJp.total > 0, "搜尋『審査』應能找到相關文章");
assert.equal(threadsRent.total, threadsRentJp.total, "搜尋『審查』與『審査』結果筆數應一致");

// 5. 統一用語與放寬同義詞相容性測試
// 首付 -> 自備款
assert.equal(
  matchesAllTokens("購屋自備款需準備兩成以上", tokenizeQuery("首付")),
  true,
  "搜尋『首付』應能命中『自備款』"
);

// 退房 -> 退租
assert.equal(
  matchesAllTokens("解約退租前需提前一個月通知", tokenizeQuery("退房")),
  true,
  "搜尋『退房』應能命中『退租』"
);

// 入居 -> 入住
assert.equal(
  matchesAllTokens("等入住日簽收鑰匙並點交屋況", tokenizeQuery("入居")),
  true,
  "搜尋『入居』應能命中『入住』"
);

// 渡假 -> 度假
assert.equal(
  matchesAllTokens("打工度假簽證專屬找房指南", tokenizeQuery("渡假")),
  true,
  "搜尋『渡假』應能命中『度假』"
);

// 回報率 / 收益率 -> 投報率
assert.equal(
  matchesAllTokens("當前表面投報率約 4.5%", tokenizeQuery("回報率")),
  true,
  "搜尋『回報率』應能命中『投報率』"
);
assert.equal(
  matchesAllTokens("當前表面投報率約 4.5%", tokenizeQuery("收益率")),
  true,
  "搜尋『收益率』應能命中『投報率』"
);

// 合約 -> 契約
assert.equal(
  matchesAllTokens("核對重要事項說明書與契約特約", tokenizeQuery("合約")),
  true,
  "搜尋『合約』應能命中『契約』"
);

// 換鎖費 / 鑰匙費 -> 更換鎖芯費
assert.equal(
  matchesAllTokens("更換鎖芯費（換鎖費）約兩萬日圓", tokenizeQuery("鑰匙費")),
  true,
  "搜尋『鑰匙費』應能命中『更換鎖芯費』"
);

// 乾溼分離 -> 衛浴分離
assert.equal(
  matchesAllTokens("衛浴分離（乾濕分離・BT別）房源篩選", tokenizeQuery("乾溼分離")),
  true,
  "搜尋『乾溼分離』應能命中『衛浴分離』"
);

// 續柄 -> 親屬關係
assert.equal(
  matchesAllTokens("提供各自的親屬關係（續柄）與收入資料", tokenizeQuery("續柄")),
  true,
  "搜尋『續柄』應能命中『親屬關係』"
);

console.log("All kanji normalization and vocabulary expansion search tests passed successfully!");
