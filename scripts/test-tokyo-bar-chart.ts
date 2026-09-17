import assert from "node:assert/strict";
import {
  TOKYO_MUNICIPALITY_BURGLARY_DATA,
  formatMunicipalityShortName,
} from "../src/data/tokyoMunicipalityBurglaryData.js";
import { getCrimeSafety, __testing } from "../src/lib/crimeSafety.js";

console.log("Testing Tokyo 59 Municipalities Bar Chart Data & Logic...");

// 1. 驗證 59 區市町村資料完整性
assert.equal(
  TOKYO_MUNICIPALITY_BURGLARY_DATA.length,
  59,
  "必須涵蓋東京都全部 59 個區市町村"
);

const ota = TOKYO_MUNICIPALITY_BURGLARY_DATA.find((x) => x.area === "大田区");
assert.ok(ota, "必須包含大田區");
assert.equal(ota.count, 79, "大田區全年住宅侵入件數應為 79 件");

const totalCrimes = TOKYO_MUNICIPALITY_BURGLARY_DATA.reduce(
  (sum, item) => sum + item.count,
  0
);
const average = totalCrimes / TOKYO_MUNICIPALITY_BURGLARY_DATA.length;
assert.equal(
  average.toFixed(1),
  "17.5",
  "東京都各區平均值應為 17.5 件"
);

// 2. 驗證簡稱轉換函式
assert.equal(formatMunicipalityShortName("大田区"), "大田");
assert.equal(formatMunicipalityShortName("千代田区"), "千代田");
assert.equal(formatMunicipalityShortName("世田谷区"), "世田谷");
assert.equal(formatMunicipalityShortName("あきる野市"), "あきる野");
assert.equal(formatMunicipalityShortName("西多摩郡瑞穂町"), "瑞穂");
assert.equal(formatMunicipalityShortName("八丈島八丈町"), "八丈");
assert.equal(formatMunicipalityShortName("港区"), "港区");
assert.equal(formatMunicipalityShortName("北区"), "北区");

// 3. 驗證 getCrimeSafety 回傳的 tokyoContext.residentialRanking 包含 items
async function testCrimeSafetyIntegration() {
  const result = await getCrimeSafety("東京都大田区南馬込6丁目");
  assert.ok(result, "應成功解析東京都大田區地址");
  assert.ok(result.tokyoContext, "應有 tokyoContext");
  assert.ok(
    result.tokyoContext.residentialRanking,
    "應有 residentialRanking"
  );
  const ranking = result.tokyoContext.residentialRanking;
  assert.equal(ranking.area, "大田区");
  assert.equal(ranking.count, 79);
  assert.equal(ranking.total, 59);
  assert.equal(ranking.averageCount.toFixed(1), "17.5");
  assert.ok(ranking.items, "residentialRanking 應包含 items 陣列");
  assert.equal(ranking.items.length, 59, "items 應有 59 筆區市町村資料");

  const otaInItems = ranking.items.find((x) => x.area === "大田区");
  assert.ok(otaInItems, "items 內應有大田區");
  assert.equal(otaInItems.count, 79);

  console.log("All Tokyo Bar Chart tests passed successfully!");
}

testCrimeSafetyIntegration();
