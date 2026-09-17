import assert from "node:assert/strict";
import { formatPrefectureMunicipalityShortName, isMatchMunicipality } from "../src/components/PrefectureMunicipalitiesBarChart.js";
import { getMunicipalCrimeResult } from "../src/lib/municipalCrimeBreakdown.js";
import { lookupCrimeSafety } from "../src/lib/crimeSafety.js";

console.log("Testing Prefecture Municipalities Bar Chart Data & Logic...");

// 1. 簡稱轉換函式驗證
assert.equal(formatPrefectureMunicipalityShortName("横浜市鶴見区"), "鶴見");
assert.equal(formatPrefectureMunicipalityShortName("大阪市北区"), "北区");
assert.equal(formatPrefectureMunicipalityShortName("さいたま市大宮区"), "大宮");
assert.equal(formatPrefectureMunicipalityShortName("千葉市中央区"), "中央");
assert.equal(formatPrefectureMunicipalityShortName("柏市"), "柏市");
assert.equal(formatPrefectureMunicipalityShortName("足柄下郡箱根町"), "箱根");
assert.equal(formatPrefectureMunicipalityShortName("名古屋市中区"), "中区");
assert.equal(formatPrefectureMunicipalityShortName("福岡市博多区"), "博多");
assert.equal(formatPrefectureMunicipalityShortName("札幌市中央区"), "中央");

// 1.5 測試區市町村名稱精確比對（防範「四街道市」因名稱有「道」被誤配為「中央區」）
assert.equal(isMatchMunicipality("四街道市", "千葉市中央区"), false, "四街道市絕不可配到千葉市中央區");
assert.equal(isMatchMunicipality("千葉市中央区", "千葉市中央区"), true, "千葉市中央區應正確比對");
assert.equal(isMatchMunicipality("千葉市中央区", "千葉市中央區"), true, "繁體區字應正確比對");
assert.equal(isMatchMunicipality("四街道市", "四街道市"), true, "四街道市應能正確比對自己");

// 2. 測試各大府縣市區町村資料回傳完整性與 items
const cases = [
  { addr: "神奈川県横浜市鶴見区豊岡町", pref: "神奈川県", muni: "横浜市鶴見区", expectedTotal: 58 },
  { addr: "大阪府大阪市北区梅田一丁目", pref: "大阪府", muni: "大阪市北区", expectedTotal: 72 },
  { addr: "埼玉県さいたま市大宮区桜木町一丁目", pref: "埼玉県", muni: "さいたま市大宮区", expectedTotal: 72 },
  { addr: "千葉県柏市中新宿二丁目", pref: "千葉県", muni: "柏市", expectedTotal: 59 },
  { addr: "京都府京都市中京区河原町通", pref: "京都府", muni: "京都市中京区", expectedTotal: 36 },
  { addr: "福岡県福岡市博多区博多駅前", pref: "福岡県", muni: "福岡市博多区", expectedTotal: 72 },
  { addr: "北海道札幌市中央区大通西", pref: "北海道", muni: "札幌市中央区", expectedTotal: 188 },
];

for (const c of cases) {
  const result = getMunicipalCrimeResult(c.addr, c.pref);
  assert.ok(result, `${c.pref} 應能成功解析市區町村`);
  assert.equal(result.municipality, c.muni, `市區町村名稱應為 ${c.muni}`);
  assert.equal(result.totalAreas, c.expectedTotal, `${c.pref} 應有 ${c.expectedTotal} 個行政區`);
  assert.equal(result.items.length, c.expectedTotal, `${c.pref} items 陣列應有 ${c.expectedTotal} 筆`);
  assert.ok(result.prefectureAverageRate > 0, `${c.pref} 應有大於 0 的平均每千人刑法犯比率`);

  // 驗證每個 item 的必要欄位
  for (const item of result.items) {
    assert.ok(item.area, "每個項目應有行政區名稱");
    assert.ok(typeof item.count === "number" && item.count >= 0, "案件數應為非負整數");
    assert.ok(typeof item.ratePerThousand === "number" && item.ratePerThousand >= 0, "比率應為非負數");
    assert.ok(item.rank >= 1 && item.rank <= c.expectedTotal, `排名應在 1 到 ${c.expectedTotal} 之間`);
  }

  // 驗證當前行政區出現在 items 中且數值吻合
  const currentItem = result.items.find((i) => i.area === c.muni);
  assert.ok(currentItem, `items 中應包含當前行政區 ${c.muni}`);
  assert.equal(currentItem.count, result.total, "案件總數應一致");
  assert.equal(currentItem.ratePerThousand, result.crimeRatePerThousand, "每千人比率應一致");
  assert.equal(currentItem.rank, result.rank, "排名應一致");
}

// 3. 測試 lookupCrimeSafety 整合路由
async function testLookupIntegration() {
  const lookupKanagawa = await lookupCrimeSafety("神奈川県横浜市鶴見区豊岡町");
  assert.ok(lookupKanagawa && lookupKanagawa.precision === "prefecture");
  if (lookupKanagawa?.precision === "prefecture") {
    assert.ok(lookupKanagawa.prefecture.municipal);
    assert.equal(lookupKanagawa.prefecture.municipal.municipality, "横浜市鶴見区");
    assert.equal(lookupKanagawa.prefecture.municipal.items.length, 58);
  }

  const lookupOsaka = await lookupCrimeSafety("大阪府大阪市北区梅田一丁目");
  assert.ok(lookupOsaka && lookupOsaka.precision === "prefecture");
  if (lookupOsaka?.precision === "prefecture") {
    assert.ok(lookupOsaka.prefecture.municipal);
    assert.equal(lookupOsaka.prefecture.municipal.municipality, "大阪市北区");
    assert.equal(lookupOsaka.prefecture.municipal.items.length, 72);
  }
}

await testLookupIntegration();

console.log("prefecture municipalities bar chart tests: ok!");
