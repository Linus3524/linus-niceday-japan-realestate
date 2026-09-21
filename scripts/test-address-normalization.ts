import { normalizeJapaneseAddress, hasFullStreetNumber, kanjiToNumber } from "../src/lib/addressNormalization.js";

function assertEqual(actual: any, expected: any, message: string) {
  if (actual !== expected) {
    console.error(`FAIL: ${message}\n  Expected: ${expected}\n  Actual:   ${actual}`);
    process.exit(1);
  }
  console.log(`✓ ${message}`);
}

console.log("Starting address normalization tests...");

// 1. 全形數字轉半形
assertEqual(
  normalizeJapaneseAddress("千葉県千葉市稲毛区長沼町３２番地"),
  "千葉県千葉市稲毛区長沼町32番地",
  "全形數字轉換為半形"
);

// 2. 中文「之」轉為連字號
assertEqual(
  normalizeJapaneseAddress("千葉県千葉市稲毛区長沼町32之2"),
  "千葉県千葉市稲毛区長沼町32-2",
  "中文「之」轉換為連字號"
);

// 3. 日文「の」轉為連字號
assertEqual(
  normalizeJapaneseAddress("千葉県千葉市稲毛区長沼町32の2"),
  "千葉県千葉市稲毛区長沼町32-2",
  "日文「の」轉換為連字號"
);

// 4. 「番地之」轉為連字號
assertEqual(
  normalizeJapaneseAddress("千葉県千葉市稲毛区長沼町32番地之2"),
  "千葉県千葉市稲毛区長沼町32-2",
  "「番地之」轉換為連字號"
);

// 5. 各種長音、破折號、波浪號轉為半形減號
assertEqual(
  normalizeJapaneseAddress("千葉県千葉市稲毛区長沼町３２ー２"),
  "千葉県千葉市稲毛区長沼町32-2",
  "日文長音符（ー）與全形數字轉換"
);
assertEqual(
  normalizeJapaneseAddress("千葉県千葉市稲毛区長沼町32―2"),
  "千葉県千葉市稲毛区長沼町32-2",
  "全形破折號（―）轉換"
);
assertEqual(
  normalizeJapaneseAddress("千葉県千葉市稲毛区長沼町32～2"),
  "千葉県千葉市稲毛区長沼町32-2",
  "波浪號（～）轉換"
);

// 6. 漢字數字轉換
assertEqual(
  normalizeJapaneseAddress("千葉県千葉市稲毛区長沼町三丁目二番地一号"),
  "千葉県千葉市稲毛区長沼町3丁目2番地1号",
  "漢字數字（三丁目二番地一号）轉換"
);
assertEqual(
  normalizeJapaneseAddress("東京都渋谷区神宮前五丁目十二番三号"),
  "東京都渋谷区神宮前5丁目12番3号",
  "兩位數漢字數字（十二番）轉換"
);

// 7. 保護專有地名不被誤轉
assertEqual(
  normalizeJapaneseAddress("東京都世田谷区三軒茶屋二丁目1-1"),
  "東京都世田谷区三軒茶屋2丁目1-1",
  "保護「三軒茶屋」不被轉成「3軒茶屋」"
);
assertEqual(
  normalizeJapaneseAddress("東京都千代田区四ツ谷一丁目"),
  "東京都千代田区四ツ谷1丁目",
  "保護「四ツ谷」不被轉成「4ツ谷」"
);
assertEqual(
  normalizeJapaneseAddress("東京都中央区八丁堀二丁目"),
  "東京都中央区八丁堀2丁目",
  "保護「八丁堀」不被轉成「8丁堀」"
);
assertEqual(
  normalizeJapaneseAddress("東京都港区六本木四丁目1-2"),
  "東京都港区六本木4丁目1-2",
  "保護「六本木」不被轉成「6本木」"
);

// 8. 繁體中文常用字與部首相容
assertEqual(
  normalizeJapaneseAddress("東京都澀谷區神宮前5-12-3"),
  "東京都渋谷区神宮前5-12-3",
  "繁體「澀谷區」轉換為日文「渋谷区」"
);
assertEqual(
  normalizeJapaneseAddress("千葉縣千葉市稲毛區⻑沼町32-2"),
  "千葉県千葉市稲毛区長沼町32-2",
  "繁體「縣」、「區」與康熙部首「⻑」轉換"
);

// 9. 郵遞區號自動移除
assertEqual(
  normalizeJapaneseAddress("〒263-0005 千葉県千葉市稲毛区長沼町 32-2"),
  "千葉県千葉市稲毛区長沼町 32-2",
  "開頭郵遞區號自動移除"
);

// 10. hasFullStreetNumber 驗證
assertEqual(hasFullStreetNumber("千葉県千葉市稲毛区長沼町32-2"), true, "包含枝番 (-2) 視為完整門牌");
assertEqual(hasFullStreetNumber("千葉県千葉市稲毛区長沼町32番地2号"), true, "包含番地+号視為完整門牌");
assertEqual(hasFullStreetNumber("千葉県千葉市稲毛区長沼町32番地"), false, "僅有番地視為缺少枝番");
assertEqual(hasFullStreetNumber("千葉県千葉市稲毛区長沼町"), false, "僅有町名視為缺少門牌");

console.log("\nAll address normalization tests passed successfully! ✓");
