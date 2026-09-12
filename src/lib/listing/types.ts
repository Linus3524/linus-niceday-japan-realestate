import type { AuditFields, ListingAudit } from '../listingAudit.js';
import type { NetYieldBreakdown, calculateSaleInitialCosts } from '../listingExtraction.js';
import type { RentalConditionFields } from '../rentalConditions.js';
import type { CommuteRouteDetails } from '../rentAnalysis.js';
import type { SpecialSaleFields } from '../specialSaleAnalysis.js';
export interface SaleAnalysisVerdict {
  salePriceYen: number;
  salePriceMan: number;
  areaSqm: number | null;
  tsuboAndSqm: {
    tsubo: number | null;
    tsuboPriceYen: number | null;
    tsuboPriceMan: number | null;
    sqmPriceYen: number | null;
    sqmPriceMan: number | null;
  };
  monthlyHoldingCosts: {
    managementFee: number;
    repairReserve: number;
    repairFund: number;
    otherMonthlyFees: number;
    totalMonthlyHoldingCost: number;
    items: Array<{ name: string; amount: number; note: string }>;
  };
  buildingHealth: {
    totalUnits: number | null;
    ageYears: number | null;
    reservePerSqm: number | null;
    reserveHealthLevel: "inadequate" | "healthy" | "heavy";
    reserveHealthText: string;
    reserveHealthNote: string;
    guidelineRange?: string;
    reserveRatio?: number | null;
    feeRatioNote?: string | null;
    scaleRiskLevel: "high_risk" | "medium" | "safe";
    scaleRiskText: string;
    scaleRiskNote: string;
    specialStrengths: string[];
    specialCautions?: string[];
  };
  mlitComparison: {
    region: string;
    district: string;
    /** 實際比對用的行情分桶標籤（非圖紙原文房型） */
    layout: string;
    /** 圖紙上寫的原文房型 */
    listingLayout?: string;
    medianPriceYen: number | null;
    medianPriceMan: number | null;
    medianSqmPriceYen?: number | null;
    marketAgeBand?: string | null;
    marketAgeBandSampleCount?: number | null;
    bucketSampleCount?: number | null;
    marketAgeBandScope?: "layout" | "area" | "adjacent_age" | "district" | null;
    /** 相對「條件校準後預期價」的價差 */
    diffPercent: number | null;
    /** 相對「未校準分桶中位數」的價差，供對照 */
    rawDiffPercent?: number | null;
    expectedPriceMan?: number | null;
    areaBaselineMan?: number | null;
    ageBandComparison?: Array<{
      ageBand: string; medianSqmPriceYen: number; sampleCount: number;
      diffPercent: number; isCurrent: boolean;
    }>;
    fairLowMan?: number | null;
    fairHighMan?: number | null;
    typicalListingPriceMan?: number | null;
    typicalListingPriceLowMan?: number | null;
    typicalListingPriceHighMan?: number | null;
    listingRangeLabel?: string | null;
    listingDiffPercent?: number | null;
    listingVerdict?: "below" | "typical" | "above" | null;
    listingVerdictText?: string | null;
    listingPremiumRatePercent?: number | null;
    impliedDiscountFromListingPercent?: number | null;
    listingBenchmarkPeriod?: string | null;
    listingBenchmarkSourceUrl?: string | null;
    listingBenchmarkSourceLabel?: string | null;
    listingBenchmarkKind?: "public_listing_average" | "reins_ratio" | null;
    listingBenchmarkScopeLabel?: string | null;
    areaAdjusted?: boolean;
    areaBasisNote?: string;
    priceFactors?: Array<{ label: string; ratePercent: number; note: string; applied?: boolean; basis?: "data" | "estimate" }>;
    positiveFactorsSumPercent?: number;
    netFactorsSumPercent?: number;
    baselineNote?: string;
    ageHandledInBaseline?: boolean;
    priceCautions?: string[];
    verdict: "bargain" | "fair" | "premium";
    verdictText: string;
    explanation: string;
    insightPoints?: Array<{
      id: string;
      icon: string;
      tag: string;
      title: string;
      content: string;
      type?: "verdict" | "factor" | "market" | "advice";
    }>;
    sampleCount?: number;
    periodStart?: string;
    periodEnd?: string;
    latestPeriod?: string;
    snapshotGeneratedAt?: string | null;
    stationWalkFactor: {
      walkMinutes: number;
      level: "prime_close" | "standard" | "far";
      note: string;
    };
  } | null;
  occupancyAssessment: {
    status: "vacant" | "tenanted_investment" | "occupied_owner" | "unknown" | "hospitality";
    statusText: string;
    investmentYield?: {
      monthlyRentYen: number;
      annualIncomeYen: number;
      grossYield: number;
      netYieldEstimated: number | null;
      breakdown?: NetYieldBreakdown;
    };
    mortgageTaxEligible: boolean | null;
    mortgageTaxNote: string;
    renovationNote?: string;
  };
  initialCosts: ReturnType<typeof calculateSaleInitialCosts>;
}


export interface ExtractedFields extends SpecialSaleFields, RentalConditionFields, AuditFields {
  /** Legacy report payload alias for orientation. */
  direction?: string;
  otherConditions?: string;
  buildingCoverageRatio?: string;
  floorAreaRatio?: string;
  dealType?: string;
  buildingName?: string;
  roomNumber?: string;
  station: string;
  walkTime: string;
  transitAccess?: string;
  layout: string;
  rent: string;
  managementFee: string;
  keyMoney: string;
  deposit: string;
  age: string;
  floor: string;
  address: string;
  area?: string;
  structure?: string;
  guaranteeFee?: string;
  lockReplacementFee?: string;
  cleaningFee?: string;
  insuranceFee?: string;
  shikibiki?: string;
  cancellationPenalty?: string;
  renewalFee?: string;
  supportFee?: string;
  freeRent?: string;
  salePrice?: string;
  totalUnits?: string;
  repairReserve?: string;
  repairFund?: string;
  otherMonthlyFees?: string;
  occupancyStatus?: string;
  currentRent?: string;
  annualIncome?: string;
  grossYield?: string;
  landRights?: string;
  zoning?: string;
  renovationDetails?: string;
  managementCompany?: string;
  managementStyle?: string;
  fixedAssetTax?: number | string;
  cityPlanningTax?: number | string;
  realEstateAcquisitionTax?: number | string;
  buildingAssessedValue?: number | string;
  landAcquisitionTaxAfterRelief?: number | string;
  registrationFee?: number | string;
  landRightsRatio?: string;
  taxEstimationBasis?: string;
  specialNotes?: string;
  facilities?: string;
  facilityTranslations?: Array<{ ja: string; zh: string }>;
  balconyArea?: string;
}


export interface InitialCostBreakdownItem {
  isUnknown?: boolean;
  id: string;
  name: string;
  amount: number;
  isFromFlyer: boolean;
  note: string;
}


export interface InitialCostEstimate {
  totalMin: number;
  totalMax: number;
  monthsMultipleMin: number;
  monthsMultipleMax: number;
  level: "low" | "standard" | "high";
  levelText: string;
  items: InitialCostBreakdownItem[];
  tips: string[];
}


export interface AnalyzeListingResult {
  audit?: ListingAudit;
  dealType?: "sale" | "rent";
  extracted: ExtractedFields;
  parsed: {
    rent: number | null;
    managementFee: number | null;
    salePrice?: number | null;
    keyMoney: number | null;
    deposit: number | null;
    roomType: string | null;
    area?: number | null;
    structure?: string | null;
    totalUnits?: number | null;
    repairReserve?: number | null;
    repairFund?: number | null;
    otherMonthlyFees?: number | null;
  };
  range: {
    low: number;
    median: number;
    high: number;
    sourceUrl?: string;
    sourceLabel?: string;
    sourceDate?: string;
  } | null;
  verdict: {
    status: string;
    headline: string;
    detail: string;
    factors?: Array<{ label: string; ratePercent: number; monthlyYen?: number; note: string; level: number; category: string }>;
    positiveFactorsSumPercent?: number;
    negativeFactorsSumPercent?: number;
    netFactorsSumPercent?: number;
    nominalDiffPercent?: number;
  } | null;
  initialCostMonths: number | null;
  initialCostEstimate?: InitialCostEstimate | null;
  saleAnalysis?: SaleAnalysisVerdict | null;
}


export interface ListingCommuteResult {
  route?: CommuteRouteDetails | null;
  destinationInput: string;
  destinationAddress: string;
  destinationResolutionNote?: string | null;
  destinationStation: string;
  destinationWalkMinutes: number;
  originWalkMinutes: number;
  transitMinutes: number;
  totalMinutes: number;
  transfers: number;
}

export interface ListingHealthCheckProps {
  /**
   * 分享頁模式：帶入分享連結的 ID，元件會自行讀取已存的分析結果並以唯讀方式呈現，
   * 不顯示上傳區。步行與周邊機能不存在分享資料裡，用結果中的地址重新查一次。
   */
  sharedId?: string;
}
