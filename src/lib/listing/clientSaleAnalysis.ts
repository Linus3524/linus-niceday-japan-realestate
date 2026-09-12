import {
  assessMortgageTaxDeduction,
  assessRealEstateAcquisitionTax,
  assessRepairReserve,
  calculateNetYieldBreakdown,
  calculateSaleInitialCosts,
  computeTsuboAndSqmPrice,
  detectBuildingSpecialNotes,
  detectUnitFeatures,
  parseAgeYears,
  parseArea,
  parseFloorInfo,
  parseNonNegativeYenAmount,
  parseSalePrice,
  parseUnitsCount,
  parseYenAmount,
  parseYieldRate,
} from '../listingExtraction.js';
import { buildSpecialSaleDetails, statedCombinedAnnualPropertyTax } from '../specialSaleAnalysis.js';
import type { AnalyzeListingResult, SaleAnalysisVerdict } from './types.js';
/**
 * 前端 fallback 買賣圖紙分析：確保即使後端特定結構缺漏，前端亦能正常算妥數值
 */
export function buildClientSaleAnalysis(result: AnalyzeListingResult): SaleAnalysisVerdict | null {
  const salePriceYen = result.parsed.salePrice ?? parseSalePrice(result.extracted.salePrice);
  if (!salePriceYen) return null;
  const propertyDetails = buildSpecialSaleDetails(result.extracted);
  const areaSqm = propertyDetails.kind === "land" ? propertyDetails.landAreaSqm : propertyDetails.buildingAreaSqm ?? result.parsed.area ?? parseArea(result.extracted.area);
  const tsuboAndSqm = computeTsuboAndSqmPrice(salePriceYen, areaSqm);
  const managementFee = result.parsed.managementFee ?? parseYenAmount(result.extracted.managementFee) ?? 0;
  const repairReserve = result.parsed.repairReserve ?? parseYenAmount(result.extracted.repairReserve) ?? 0;
  const repairFund = result.parsed.repairFund ?? parseYenAmount(result.extracted.repairFund) ?? 0;
  const otherMonthlyFees = result.parsed.otherMonthlyFees ?? parseYenAmount(result.extracted.otherMonthlyFees) ?? 0;
  const totalMonthlyCost = managementFee + repairReserve + repairFund + otherMonthlyFees;

  const totalUnits = result.parsed.totalUnits ?? parseUnitsCount(result.extracted.totalUnits);
  const ageYears = parseAgeYears(result.extracted.age);
  const reserveAssessment = assessRepairReserve({
    monthlyRepairCostYen: repairReserve + repairFund,
    areaSqm,
    totalUnits,
    ageYears,
    monthlyManagementFeeYen: managementFee,
  });

  const acquisitionTaxAssessment = assessRealEstateAcquisitionTax({
    propertyCategory: propertyDetails.kind,
    buildingAssessedValueYen: parseNonNegativeYenAmount(result.extracted.buildingAssessedValue),
    landTaxAfterReliefYen: parseNonNegativeYenAmount(result.extracted.landAcquisitionTaxAfterRelief),
    fallbackTaxYen: parseNonNegativeYenAmount(result.extracted.realEstateAcquisitionTax),
    areaSqm,
    ageYears,
    occupancyStatus: `${result.extracted.occupancyStatus || ""} ${result.extracted.currentRent || result.extracted.annualIncome || result.extracted.grossYield ? "賃貸中" : ""
      }`,
  });

  const initialCosts = calculateSaleInitialCosts(salePriceYen, {
    monthlyManagementFeeYen: managementFee,
    monthlyRepairReserveYen: repairReserve + repairFund,
    combinedAnnualPropertyTaxYen: statedCombinedAnnualPropertyTax(result.extracted.taxDetails),
    fixedAssetTaxYen: parseNonNegativeYenAmount(result.extracted.fixedAssetTax),
    cityPlanningTaxYen: parseNonNegativeYenAmount(result.extracted.cityPlanningTax),
    acquisitionTaxYen: acquisitionTaxAssessment.amount,
    acquisitionTaxNote: acquisitionTaxAssessment.note,
    registrationFeeYen: parseNonNegativeYenAmount(result.extracted.registrationFee) || null,
    prepaidMonths: propertyDetails.excludeCondoComparison ? 0 : 3,
    insuranceFeeYen: propertyDetails.kind === "land" ? 0 : undefined,
  });

  const localCurrentRentYen = parseYenAmount(result.extracted.currentRent);
  const localAnnualIncomeYen = parseYenAmount(result.extracted.annualIncome) ?? (localCurrentRentYen ? localCurrentRentYen * 12 : null);
  const localGrossYield = parseYieldRate(result.extracted.grossYield);
  const localEffectiveRent = localCurrentRentYen ?? (localAnnualIncomeYen ? Math.round(localAnnualIncomeYen / 12) : null);
  const isTenantedLocal = /賃貸中|オーナーチェンジ|投資/i.test(result.extracted.occupancyStatus || "") || !!(localCurrentRentYen || localAnnualIncomeYen);

  const localNetYieldBreakdown = isTenantedLocal && localEffectiveRent && localEffectiveRent > 0 && salePriceYen > 0
    ? calculateNetYieldBreakdown({
      salePriceYen,
      monthlyRentYen: localEffectiveRent,
      monthlyManagementFeeYen: managementFee,
      monthlyRepairReserveYen: repairReserve + repairFund,
      otherMonthlyFeesYen: otherMonthlyFees,
      statedPropertyTaxYen: statedCombinedAnnualPropertyTax(result.extracted.taxDetails),
    })
    : null;

  const floorInfo = parseFloorInfo(
    result.extracted.floor,
    `${result.extracted.buildingFloors ? `${result.extracted.buildingFloors}階建` : ""} ${result.extracted.structure || ""} ${result.extracted.specialNotes || ""}`
  );

  const unitFeatures = detectUnitFeatures({
    specialNotes: result.extracted.specialNotes,
    renovationDetails: result.extracted.renovationDetails,
    otherConditions: result.extracted.otherConditions,
    facilities: result.extracted.facilities,
    balconyArea: result.extracted.balconyArea,
    landRights: result.extracted.landRights,
  });

  const { specialStrengths, specialCautions } = detectBuildingSpecialNotes({
    specialNotes: result.extracted.specialNotes,
    renovationDetails: result.extracted.renovationDetails,
    structure: result.extracted.structure,
    ageYears,
    totalUnits,
    managementStyle: result.extracted.managementStyle,
    managementCompany: result.extracted.managementCompany,
    facilities: result.extracted.facilities,
    floor: floorInfo.floor,
    totalFloors: floorInfo.totalFloors,
    unitFeatures,
  });

  const localMortgage = assessMortgageTaxDeduction(areaSqm);
  const mortgageTaxEligible = propertyDetails.hospitality || propertyDetails.excludeCondoComparison ? null : localMortgage.eligible;
  const mortgageTaxNote = propertyDetails.hospitality || propertyDetails.excludeCondoComparison
    ? "須核對買方自住用途、登記面積與其他適用條件；民泊／旅館營運收益不能作為自住減稅資格依據。"
    : localMortgage.note;

  return {
    salePriceYen,
    salePriceMan: Math.round(salePriceYen / 10000),
    areaSqm,
    tsuboAndSqm,
    monthlyHoldingCosts: {
      managementFee,
      repairReserve,
      repairFund,
      otherMonthlyFees,
      totalMonthlyHoldingCost: totalMonthlyCost,
      items: [
        { name: "管理費", amount: managementFee, note: result.extracted.managementCompany || "大樓日常維護與共用部費用" },
        { name: "修繕積立金", amount: repairReserve, note: "管委會大樓長期修繕儲備基金" },
        ...(repairFund > 0 ? [{ name: "修繕積立基金（月額）", amount: repairFund, note: "定期追加修繕準備金" }] : []),
        ...(otherMonthlyFees > 0 ? [{ name: "其他月額雜費", amount: otherMonthlyFees, note: result.extracted.otherMonthlyFees || "町會費或自治費用" }] : []),
      ],
    },
    buildingHealth: {
      totalUnits,
      ageYears,
      ...reserveAssessment,
      specialStrengths,
      specialCautions,
    },
    mlitComparison: null,
    occupancyAssessment: {
      status: isTenantedLocal ? "tenanted_investment" : "unknown",
      statusText: result.extracted.occupancyStatus || (isTenantedLocal ? "賃貸中" : "一般買賣物件"),
      investmentYield: isTenantedLocal && (localGrossYield || localNetYieldBreakdown) ? {
        monthlyRentYen: localEffectiveRent ?? 0,
        annualIncomeYen: localAnnualIncomeYen ?? (localEffectiveRent ? localEffectiveRent * 12 : 0),
        grossYield: localGrossYield ? Math.round(localGrossYield * 1000) / 10 : (localNetYieldBreakdown ? localNetYieldBreakdown.grossYield : 0),
        netYieldEstimated: localNetYieldBreakdown ? localNetYieldBreakdown.netYieldPercent : null,
        breakdown: localNetYieldBreakdown ?? undefined,
      } : undefined,
      mortgageTaxEligible,
      mortgageTaxNote,
    },
    initialCosts,
  };
}
