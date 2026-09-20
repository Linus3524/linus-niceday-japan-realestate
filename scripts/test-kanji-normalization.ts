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

console.log("All kanji normalization search tests passed successfully!");
