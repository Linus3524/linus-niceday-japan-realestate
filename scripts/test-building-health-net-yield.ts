import assert from "node:assert/strict";
import {
  assessRepairReserve,
  calculateNetYieldBreakdown,
} from "../src/lib/listingExtraction.js";

console.log("=== Testing Building Health & Net Yield Diagnosis ===");

// 1. 修繕積立金指針與屋齡分層測試
{
  // 案例 1A: 屋齡 25 年、低提撥（100円/㎡） -> 標記偏低且提醒成熟期注意赤字與一次金
  const matureLow = assessRepairReserve({
    monthlyRepairCostYen: 5000,
    areaSqm: 50,
    totalUnits: 30,
    ageYears: 25,
    monthlyManagementFeeYen: 15000,
  });
  assert.equal(matureLow.reservePerSqm, 100);
  assert.equal(matureLow.reserveHealthLevel, "inadequate");
  assert.equal(matureLow.reserveHealthText, "積立金提撥偏低");
  assert.ok(matureLow.reserveHealthNote.includes("成熟期"));
  assert.ok(matureLow.reserveHealthNote.includes("修繕一時金"));
  assert.ok(matureLow.feeRatioNote?.includes("25%")); // 5000 / 20000 = 25%

  // 案例 1B: 屋齡 5 年、低提撥（120円/㎡） -> 標記偏低但溫和說明為初期階段增額
  const youngLow = assessRepairReserve({
    monthlyRepairCostYen: 6000,
    areaSqm: 50,
    totalUnits: 40,
    ageYears: 5,
    monthlyManagementFeeYen: 10000,
  });
  assert.equal(youngLow.reserveHealthLevel, "inadequate");
  assert.ok(youngLow.reserveHealthNote.includes("初期費率偏低"));
  assert.ok(youngLow.reserveHealthNote.includes("段階増額"));

  // 案例 1C: 正常指針標準（250円/㎡） -> 標記適中健康
  const standardHealthy = assessRepairReserve({
    monthlyRepairCostYen: 15000,
    areaSqm: 60,
    totalUnits: 60,
    ageYears: 18,
    monthlyManagementFeeYen: 12000,
  });
  assert.equal(standardHealthy.reservePerSqm, 250);
  assert.equal(standardHealthy.reserveHealthLevel, "healthy");
  assert.equal(standardHealthy.reserveHealthText, "積立金水準適中");
  assert.ok(standardHealthy.reserveHealthNote.includes("指針建議水準"));

  // 案例 1D: 超高層塔樓（35層建，指針範圍 250~450 円/㎡）
  const tower = assessRepairReserve({
    monthlyRepairCostYen: 21000,
    areaSqm: 70,
    totalUnits: 250,
    ageYears: 12,
    totalFloors: 35,
  });
  assert.equal(tower.reservePerSqm, 300);
  assert.equal(tower.guidelineRange, "250 〜 450 円/㎡/月");
  assert.equal(tower.reserveHealthLevel, "healthy");

  console.log("✓ 1. 修繕積立金國交省指針與屋齡判定測試通過");
}

// 2. 社區總戶數規模效應四級測試
{
  // <20 戶
  const micro = assessRepairReserve({
    monthlyRepairCostYen: 10000,
    areaSqm: 40,
    totalUnits: 16,
  });
  assert.equal(micro.scaleRiskLevel, "high_risk");
  assert.ok(micro.scaleRiskText.includes("<20戶"));
  assert.ok(micro.scaleRiskNote.includes("16 戶"));

  // 20-49 戶
  const small = assessRepairReserve({
    monthlyRepairCostYen: 10000,
    areaSqm: 40,
    totalUnits: 32,
  });
  assert.equal(small.scaleRiskLevel, "medium");
  assert.ok(small.scaleRiskText.includes("20-49戶"));

  // 50-99 戶
  const mid = assessRepairReserve({
    monthlyRepairCostYen: 10000,
    areaSqm: 40,
    totalUnits: 75,
  });
  assert.equal(mid.scaleRiskLevel, "safe");
  assert.ok(mid.scaleRiskText.includes("50-99戶"));

  // 100+ 戶
  const large = assessRepairReserve({
    monthlyRepairCostYen: 10000,
    areaSqm: 40,
    totalUnits: 180,
  });
  assert.equal(large.scaleRiskLevel, "safe");
  assert.ok(large.scaleRiskText.includes("100戶以上"));

  // null 戶數
  const unknownUnits = assessRepairReserve({
    monthlyRepairCostYen: 10000,
    areaSqm: 40,
    totalUnits: null,
  });
  assert.equal(unknownUnits.scaleRiskText, "總戶數待確認");

  console.log("✓ 2. 社區總戶數規模效應四級測試通過");
}

// 3. 投資客實質淨回報（NOI / Net Yield）營運收支速算測試
{
  // 售價 3,000 萬、現況月租 12 萬（年租 144 萬，表面利回 4.8%）
  // 管理費 8,000、修繕金 7,000（月維持費 15,000，年維持 18 萬）
  // 代管費 5%（年 7.2 萬）
  // 概算固都稅（3,000萬 × 0.25% = 7.5 萬）
  // 預期 NOI = 144萬 - 18萬 - 7.2萬 - 7.5萬 = 111.3 萬
  // 預期實質淨投報 = 111.3 / 3000 = 3.71% -> 3.7%
  const result = calculateNetYieldBreakdown({
    salePriceYen: 30_000_000,
    monthlyRentYen: 120_000,
    monthlyManagementFeeYen: 8_000,
    monthlyRepairReserveYen: 7_000,
  });

  assert.equal(result.annualIncomeYen, 1_440_000);
  assert.equal(result.grossYield, 4.8);
  assert.equal(result.annualHoldingCostsYen, 180_000);
  assert.equal(result.annualPmFeeYen, 72_000);
  assert.equal(result.annualEstimatedPropertyTaxYen, 75_000);
  assert.equal(result.annualNetOperatingIncomeYen, 1_113_000);
  assert.equal(result.netYieldPercent, 3.7);
  assert.equal(result.items.length, 5);

  // 測試帶有圖紙明定固都稅的情況
  const statedResult = calculateNetYieldBreakdown({
    salePriceYen: 40_000_000,
    monthlyRentYen: 160_000,
    monthlyManagementFeeYen: 10_000,
    monthlyRepairReserveYen: 10_000,
    statedPropertyTaxYen: 98_000,
  });
  assert.equal(statedResult.annualEstimatedPropertyTaxYen, 98_000);
  assert.ok(statedResult.propertyTaxNote.includes("依圖紙記載"));

  console.log("✓ 3. 投資客實質淨回報（NOI / Net Yield）速算測試通過");
}

console.log("All building health and net yield tests PASSED successfully!");
