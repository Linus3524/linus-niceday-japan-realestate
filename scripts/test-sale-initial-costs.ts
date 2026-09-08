import assert from "node:assert/strict";
import {
  calculateSaleInitialCosts,
  assessRealEstateAcquisitionTax,
  getRealEstateStampDuty,
  parseNonNegativeYenAmount,
} from "../src/lib/listingExtraction";

assert.equal(getRealEstateStampDuty(500_000), 200);
assert.equal(getRealEstateStampDuty(10_000_000), 5_000);
assert.equal(getRealEstateStampDuty(50_000_000), 10_000);
assert.equal(getRealEstateStampDuty(54_800_000), 30_000);
assert.equal(getRealEstateStampDuty(100_000_001), 60_000);

const estimate = calculateSaleInitialCosts(54_800_000, {
  handoverDate: "2026-10-01",
  prepaidMonths: 3,
  monthlyManagementFeeYen: 15_000,
  monthlyRepairReserveYen: 10_000,
  fixedAssetTaxYen: 120_000,
  cityPlanningTaxYen: 30_000,
  acquisitionTaxYen: 0,
  registrationFeeYen: 548_000,
});

const amounts = Object.fromEntries(estimate.items.map(item => [item.id, item.amount]));
assert.equal(amounts.brokerage, 1_874_400);
assert.equal(amounts.registration, 548_000);
assert.equal(amounts.stamp, 30_000);
assert.equal(amounts.propertyTaxProration, 37_808);
assert.equal(amounts.acquisitionTax, 0);
assert.equal(amounts.managementPrepayment, 75_000);
assert.equal(estimate.settings.remainingDays, 92);
assert.equal(estimate.settings.daysInYear, 365);
assert.equal(estimate.total, 2_765_208);

assert.equal(parseNonNegativeYenAmount(0), 0);
assert.equal(parseNonNegativeYenAmount("0円"), 0);
assert.equal(parseNonNegativeYenAmount("548,000円"), 548_000);

const tenanted = assessRealEstateAcquisitionTax({
  buildingAssessedValueYen: 10_000_000,
  landTaxAfterReliefYen: 0,
  fallbackTaxYen: 0,
  areaSqm: 50,
  ageYears: 20,
  occupancyStatus: "賃貸中（オーナーチェンジ）",
});
assert.equal(tenanted.reliefApplied, false);
assert.equal(tenanted.amount, 300_000);
assert.match(tenanted.note, /不符合買方自住要件/);

const selfUseAtCurrentMinimum = assessRealEstateAcquisitionTax({
  buildingAssessedValueYen: 10_000_000,
  areaSqm: 40,
  ageYears: 20,
  occupancyStatus: "空室",
});
assert.equal(selfUseAtCurrentMinimum.reliefApplied, true);
assert.equal(selfUseAtCurrentMinimum.amount, 0);
assert.match(selfUseAtCurrentMinimum.note, /低於 1,200 萬円扣除額上限，全額折抵後稅額為 0 円/);

const undersized = assessRealEstateAcquisitionTax({
  buildingAssessedValueYen: 10_000_000,
  areaSqm: 39.9,
  ageYears: 20,
  occupancyStatus: "空室",
});
assert.equal(undersized.reliefApplied, false);
assert.equal(undersized.amount, 300_000);

const untrustedLegacyZero = assessRealEstateAcquisitionTax({
  buildingAssessedValueYen: null,
  fallbackTaxYen: 0,
  areaSqm: 50,
  ageYears: 20,
  occupancyStatus: "オーナーチェンジ",
});
assert.equal(untrustedLegacyZero.amount, null);

console.log("Sale initial costs: statutory formulas and acquisition-tax eligibility guards passed");
