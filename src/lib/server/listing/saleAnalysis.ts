import {
  getAgeBandComparison,
  getConditionPremium,
  getOfficialBuyEstimate,
  getTownPremium,
} from "../../../data/buyMarket.js";
import type { LayoutCode } from "../../../data/housingMarket.js";
import { mlitBuySnapshotMeta } from "../../../data/mlitBuySnapshot.js";
import { getNationwideRentBenchmark } from "../../../data/nationwideRentMarket.js";
import { getSaleListingBenchmark } from "../../../data/saleListingMarket.js";
import { buildListingAudit } from "../../listingAudit.js";
import {
  assessMortgageTaxDeduction,
  assessRealEstateAcquisitionTax,
  assessRepairReserve,
  calculateNetYieldBreakdown,
  calculateSaleInitialCosts,
  computeTsuboAndSqmPrice,
  detectBuildingSpecialNotes,
  detectUnitFeatures,
  normalizeRoomType,
  parseAgeYears,
  parseEffectiveRepairReserve,
  parseFloorInfo,
  parseMandatoryMonthlyFees,
  parseNonNegativeYenAmount,
  parseUnitsCount,
  parseYenAmount,
  parseYieldRate
} from "../../listingExtraction.js";
import { ROOM_TYPE_DETAIL_LABEL } from "../../rentAnalysis.js";
import { buildSalePriceVerdict } from "../../requirementVerdict.js";
import { buildSpecialSaleDetails, saleOccupancy, statedCombinedAnnualPropertyTax } from "../../specialSaleAnalysis.js";
import { evaluateTransitHub } from "../../transitParser.js";
import { resolveDistrictAndRegion } from './marketLocation.js';
import type { ExtractedListingFields } from './types.js';
export function buildSaleAnalysis(params: {
  extracted: ExtractedListingFields;
  salePriceYen: number;
  areaSqm: number | null;
  stations: string[];
  walkTimes: string[];
  layout: string;
}) {
  const { extracted, salePriceYen, stations, walkTimes, layout } = params;
  const propertyDetails = buildSpecialSaleDetails(extracted);
  const audit = buildListingAudit(extracted, "sale");
  const areaSqm = propertyDetails.kind === "land" ? propertyDetails.landAreaSqm : propertyDetails.buildingAreaSqm ?? params.areaSqm;

  // 1. Tsubo and Sqm
  const tsuboAndSqm = computeTsuboAndSqmPrice(salePriceYen, areaSqm);

  // 2. Monthly holding costs
  const managementFee = parseYenAmount(extracted.managementFee) ?? 0;
  const repairReserve = parseEffectiveRepairReserve(extracted.repairReserve, extracted.specialNotes) ?? 0;
  const originalRepairReserve = parseYenAmount(extracted.repairReserve) ?? 0;
  const repairFund = parseYenAmount(extracted.repairFund) ?? 0;
  const otherMonthlyFees = parseMandatoryMonthlyFees(extracted.otherMonthlyFees) ?? 0;
  const totalMonthlyHoldingCost = managementFee + repairReserve + repairFund + otherMonthlyFees;

  const holdingCostItems = [
    {
      name: "管理費",
      amount: managementFee,
      note: extracted.managementCompany
        ? `委託 ${extracted.managementCompany} 管理（${extracted.managementStyle || "常態維護"}）`
        : "共用部水電、日常打掃與設施常態維護",
    },
    {
      name: "修繕積立金",
      amount: repairReserve,
      note: repairReserve !== originalRepairReserve
        ? `已依圖紙備註採改定後月額（原主欄 ${originalRepairReserve.toLocaleString("ja-JP")} 円）`
        : "管委會大樓長期重大修繕儲備基金",
    },
  ];
  if (repairFund > 0) {
    holdingCostItems.push({
      name: "修繕積立基金（月額）",
      amount: repairFund,
      note: "大樓額外設立之修繕準備基金（如東急社區等常見）",
    });
  }
  if (otherMonthlyFees > 0) {
    holdingCostItems.push({
      name: "其他月額費用（町會費／協力金等）",
      amount: otherMonthlyFees,
      note: extracted.otherMonthlyFees || "社區自治會費、外部業主協力金等",
    });
  }

  // 3. Building health & repair reserve adequacy
  const floorInfo = parseFloorInfo(
    extracted.floor,
    `${extracted.buildingFloors ? `${extracted.buildingFloors}階建` : ""} ${extracted.structure || ""} ${extracted.specialNotes || ""}`
  );
  const totalUnits = parseUnitsCount(extracted.totalUnits);
  const ageYears = parseAgeYears(extracted.age);

  const reserveAssessment = assessRepairReserve({
    monthlyRepairCostYen: repairReserve + repairFund,
    areaSqm,
    totalUnits,
    ageYears,
    monthlyManagementFeeYen: managementFee,
    totalFloors: floorInfo.totalFloors,
  });

  const unitFeatures = detectUnitFeatures({
    specialNotes: extracted.specialNotes,
    renovationDetails: extracted.renovationDetails,
    otherConditions: extracted.otherConditions,
    facilities: extracted.facilities,
    balconyArea: extracted.balconyArea,
    landRights: extracted.landRights,
  });

  // Special building strengths and cautions
  const { specialStrengths, specialCautions } = detectBuildingSpecialNotes({
    specialNotes: extracted.specialNotes,
    renovationDetails: extracted.renovationDetails,
    structure: extracted.structure,
    ageYears,
    totalUnits,
    managementStyle: extracted.managementStyle,
    managementCompany: extracted.managementCompany,
    facilities: extracted.facilities,
    floor: floorInfo.floor,
    totalFloors: floorInfo.totalFloors,
    unitFeatures,
  });

  // 4. MLIT comparison
  const primaryStation = stations[0] ?? "";
  const locationInfo = resolveDistrictAndRegion(extracted.address, primaryStation);
  let mlitComparison = null;
  // 不能在辨識不到房型時預設任何一桶。實價快照是「總價中位數」，
  // 房型分桶就是它唯一的規模控制；套錯桶不是誤差、是拿完全不同規模的物件在比。
  // 例：4LDK 在 normalizeRoomType 依設計回傳 null（行情資料本身不收錄 4LDK 以上），
  // 舊版 fallback 成 ldk1 後，新宿一間 4LDK 85㎡ 開價 1.28 億會被拿去比 1LDK 的
  // 5,800 萬中位數，判成「高於行情 +120%」；比對正確的 ldk3（中位 1.5 億）
  // 其實是低於行情約 15%。結論剛好相反，寧可不給結論也不能給反的。
  const layoutCode = normalizeRoomType(layout) as LayoutCode | null;

  if (locationInfo && layoutCode && !propertyDetails.excludeCondoComparison) {
    const officialEstimate = getOfficialBuyEstimate(locationInfo.region, locationInfo.district, layoutCode, ageYears);
    const medianPriceYen = officialEstimate?.medianTradePriceYen ?? null;
    if (medianPriceYen && medianPriceYen > 0) {
      // 取「最近的那一站」，不是圖紙上列的第一站。實測ナビウス高円寺南
      // 第一站是中野 11 分、第二站東高円寺才 5 分，用第一站會低估近站優勢。
      const walkCandidates = walkTimes
        .map(w => parseInt(String(w).match(/\d+/)?.[0] || "", 10))
        .filter(n => Number.isFinite(n) && n > 0);
      const minWalkMinutes = walkCandidates.length ? Math.min(...walkCandidates) : null;
      const transitHub = evaluateTransitHub(stations, walkTimes);

      // 帶租約物件要拿現行租金跟同區同房型的市場租金比，才能做收益還原。
      // 租金優先取圖紙明列的現行月租，其次由年收入換算，最後才用表面利回×開價回推。
      const flyerAnnualIncomeYen = parseYenAmount(extracted.annualIncome);
      const flyerYieldRate = parseYieldRate(extracted.grossYield);
      const flyerMonthlyRentYen = parseYenAmount(extracted.currentRent)
        ?? (flyerAnnualIncomeYen ? Math.round(flyerAnnualIncomeYen / 12) : null)
        ?? (flyerYieldRate ? Math.round((flyerYieldRate * salePriceYen) / 12) : null);
      const rentBenchmark = getNationwideRentBenchmark(locationInfo.region, locationInfo.district, layoutCode);
      // 市場表面利回り＝同區同房型的 At Home 租金 ÷ 同區同房型的 At Home 在售價。
      // 兩個數字必須同來源同口徑；跨來源相除（刊登租金 ÷ 實價登錄成交價）
      // 會把「較新較大的出租物件」除以「較舊較小的成交物件」，系統性高估利回。
      const saleListingBenchmark = getSaleListingBenchmark(locationInfo.region, locationInfo.district, layoutCode);
      const marketGrossYieldRate = rentBenchmark && saleListingBenchmark?.kind === "public_listing_average"
        && saleListingBenchmark.averageListingPriceYen > 0
        ? (rentBenchmark.medianRentYen * 12) / saleListingBenchmark.averageListingPriceYen
        : null;

      const priceVerdict = buildSalePriceVerdict({
        salePriceYen,
        medianPriceYen,
        medianSqmPriceYen: officialEstimate?.medianSqmPriceYen ?? null,
        medianAreaSqm: officialEstimate?.medianAreaSqm ?? null,
        ageControlledByMarket: officialEstimate?.ageBand !== null,
        ageBandScope: officialEstimate?.ageBandScope ?? null,
        layout: layoutCode,
        areaSqm,
        ageYears,
        walkMinutes: minWalkMinutes,
        transitHub,
        floor: floorInfo.floor,
        totalFloors: floorInfo.totalFloors,
        renovationNotes: `${extracted.renovationDetails || ""} ${extracted.specialNotes || ""}`,
        // 現況欄常只寫「集金代行」「賃貸中」；有現行租金／年收入／表面利回的圖紙
        // 本質上就是帶租約出售，一併視為オーナーチェンジ。備註欄不納入，
        // 避免「賃貸管理契約は引継ぎ」這類字樣造成誤判。
        structureText: extracted.structure,
        conditionPremium: getConditionPremium(locationInfo.region, ageYears),
        townPremium: getTownPremium(locationInfo.region, locationInfo.district, extracted.address),
        tenantedIncome: flyerMonthlyRentYen && flyerMonthlyRentYen > 0 ? {
          monthlyRentYen: flyerMonthlyRentYen,
          marketGrossYieldRate: marketGrossYieldRate,
          rentSourceLabel: rentBenchmark?.sourceLabel ?? null,
        } : null,
        occupancyStatus: `${extracted.occupancyStatus || ""} ${extracted.currentRent || extracted.annualIncome || extracted.grossYield ? "賃貸中" : ""
          }`,
        sampleCount: officialEstimate?.ageBandSampleCount ?? officialEstimate?.sampleCount ?? null,
        listingBenchmark: saleListingBenchmark,
        unitFeatures,
        totalUnits,
        managementStyle: extracted.managementStyle,
        managementCompany: extracted.managementCompany,
        buildingNotes: `${extracted.specialNotes || ""} ${extracted.facilities || ""} ${extracted.otherConditions || ""}`,
      });

      // 冷門地區的分桶會因為近 4 季樣本不足而把統計視窗往前滑，
      // 資料期間就落後於最新季。這件事必須講出來，否則使用者無從判斷
      // 這個結論用的是上季的市況、還是一年多前的市況。
      if (officialEstimate?.periodEnd && officialEstimate.periodEnd !== mlitBuySnapshotMeta.latestPeriod) {
        priceVerdict.cautions.push(
          `這個地區與房型的成交資料只涵蓋到 ${officialEstimate.periodEnd}（最新可得為 ${mlitBuySnapshotMeta.latestPeriod}），代表近期成交量少。若期間內行情有明顯變動，這個基準會偏離現況。`
        );
      }

      const walkNum = minWalkMinutes ?? 7;
      const stationWalkFactor = walkNum <= 5
        ? { walkMinutes: walkNum, level: "prime_close" as const, note: "徒步 5 分鐘內黃金地段：資產保值性與抗跌力最高，享市場溢價支撐。" }
        : walkNum <= 10
          ? { walkMinutes: walkNum, level: "standard" as const, note: "徒步 6~10 分鐘：日本自住與租賃最主流成交區間，轉手流動性良好。" }
          : { walkMinutes: walkNum, level: "far" as const, note: "徒步 11 分鐘以上：距離車站稍遠，議價空間通常較具彈性。" };

      mlitComparison = {
        region: locationInfo.region,
        district: locationInfo.district,
        // 顯示「實際比對用的分桶」而不是圖紙原文房型。畫面上寫的是
        // 「○○中古公寓成約基準」，用原文會讓它宣稱比對了一個其實沒比的房型。
        layout: ROOM_TYPE_DETAIL_LABEL[layoutCode],
        listingLayout: layout,
        medianPriceYen,
        medianPriceMan: Math.round(medianPriceYen / 10000),
        medianSqmPriceYen: officialEstimate?.medianSqmPriceYen ?? null,
        marketAgeBand: officialEstimate?.ageBand ?? null,
        marketAgeBandSampleCount: officialEstimate?.ageBandSampleCount ?? null,
        marketAgeBandScope: officialEstimate?.ageBandScope ?? null,
        // diffPercent 改為「相對條件校準後預期價」的價差，這才是使用者要的
        // 「這個開價合不合理」；未校準的中位數價差另存 rawDiffPercent 供對照。
        diffPercent: priceVerdict.diffPercent,
        rawDiffPercent: priceVerdict.rawDiffPercent,
        verdict: priceVerdict.verdict,
        verdictText: priceVerdict.verdictText,
        explanation: priceVerdict.explanation,
        insightPoints: priceVerdict.insightPoints,
        expectedPriceMan: priceVerdict.expectedPriceMan,
        areaBaselineMan: priceVerdict.areaBaselineMan,
        ageBandComparison: getAgeBandComparison(locationInfo.region, locationInfo.district, layoutCode, ageYears),
        fairLowMan: priceVerdict.fairLowMan,
        fairHighMan: priceVerdict.fairHighMan,
        typicalListingPriceMan: priceVerdict.typicalListingPriceMan,
        typicalListingPriceLowMan: priceVerdict.typicalListingPriceLowMan ?? null,
        typicalListingPriceHighMan: priceVerdict.typicalListingPriceHighMan ?? null,
        listingRangeLabel: priceVerdict.listingRangeLabel ?? null,
        listingDiffPercent: priceVerdict.listingDiffPercent,
        listingVerdict: priceVerdict.listingVerdict,
        listingVerdictText: priceVerdict.listingVerdictText,
        listingPremiumRatePercent: priceVerdict.listingPremiumRatePercent,
        impliedDiscountFromListingPercent: priceVerdict.impliedDiscountFromListingPercent,
        listingBenchmarkPeriod: priceVerdict.listingBenchmarkPeriod,
        listingBenchmarkSourceUrl: priceVerdict.listingBenchmarkSourceUrl,
        listingBenchmarkSourceLabel: priceVerdict.listingBenchmarkSourceLabel,
        listingBenchmarkKind: priceVerdict.listingBenchmarkKind,
        listingBenchmarkScopeLabel: priceVerdict.listingBenchmarkScopeLabel,
        areaAdjusted: priceVerdict.areaAdjusted,
        areaBasisNote: priceVerdict.areaBasisNote,
        baselineNote: priceVerdict.baselineNote,
        ageHandledInBaseline: priceVerdict.ageHandledInBaseline,
        priceFactors: priceVerdict.factors,
        positiveFactorsSumPercent: priceVerdict.positiveFactorsSumPercent,
        netFactorsSumPercent: priceVerdict.netFactorsSumPercent,
        priceCautions: [...priceVerdict.cautions, ...specialCautions.filter(c => !priceVerdict.cautions.includes(c))],
        // 顯示「實際比對用的那一層」的樣本數。用了築 0～10 年的分層卻標粗分桶的
        // 89 筆，會讓證據看起來比實際強——這一區塊的價值就在於可被檢驗，不能灌水。
        sampleCount: officialEstimate?.ageBand
          ? (officialEstimate?.ageBandSampleCount ?? officialEstimate?.sampleCount)
          : officialEstimate?.sampleCount,
        bucketSampleCount: officialEstimate?.sampleCount,
        periodStart: officialEstimate?.periodStart,
        periodEnd: officialEstimate?.periodEnd,
        latestPeriod: mlitBuySnapshotMeta.latestPeriod,
        snapshotGeneratedAt: mlitBuySnapshotMeta.generatedAt,
        stationWalkFactor,
      };
    }
  }

  // 5. Occupancy assessment
  const statusRaw = (extracted.occupancyStatus || "").trim();
  const isTenanted = !propertyDetails.hospitality && /賃貸中|オーナーチェンジ|出租中|帶租約/i.test(statusRaw);
  const isOwnerOccupied = /居住中|所有者居住/i.test(statusRaw);
  const occupancy = saleOccupancy(extracted);
  const isVacant = occupancy.vacant;

  const currentRentYen = parseYenAmount(extracted.currentRent);
  const annualIncomeYen = parseYenAmount(extracted.annualIncome) ?? (currentRentYen ? currentRentYen * 12 : null);
  const grossYield = parseYieldRate(extracted.grossYield) ?? (annualIncomeYen ? Math.round((annualIncomeYen / salePriceYen) * 1000) / 1000 : null);
  const effectiveMonthlyRentYen = currentRentYen
    ?? (annualIncomeYen ? Math.round(annualIncomeYen / 12) : null)
    ?? (grossYield && salePriceYen ? Math.round((grossYield * salePriceYen) / 12) : null);
  const effectiveAnnualIncomeYen = annualIncomeYen ?? (effectiveMonthlyRentYen ? effectiveMonthlyRentYen * 12 : null);

  const netYieldBreakdown = isTenanted && effectiveMonthlyRentYen && effectiveMonthlyRentYen > 0 && salePriceYen > 0
    ? calculateNetYieldBreakdown({
      salePriceYen,
      monthlyRentYen: effectiveMonthlyRentYen,
      monthlyManagementFeeYen: managementFee,
      monthlyRepairReserveYen: repairReserve + repairFund,
      otherMonthlyFeesYen: otherMonthlyFees,
      statedPropertyTaxYen: statedCombinedAnnualPropertyTax(extracted.taxDetails) ?? (
        (parseNonNegativeYenAmount(extracted.fixedAssetTax) ?? 0) + (parseNonNegativeYenAmount(extracted.cityPlanningTax) ?? 0) || null
      ),
    })
    : null;

  const netYieldEstimated = netYieldBreakdown
    ? netYieldBreakdown.netYieldPercent
    : (effectiveAnnualIncomeYen && salePriceYen > 0
      ? Math.round(((effectiveAnnualIncomeYen - totalMonthlyHoldingCost * 12) / salePriceYen) * 1000) / 10
      : null);

  const mortgageAssessment = assessMortgageTaxDeduction(areaSqm);
  let mortgageTaxEligible = mortgageAssessment.eligible;
  let mortgageTaxNote = mortgageAssessment.note;
  if (propertyDetails.hospitality || propertyDetails.excludeCondoComparison) {
    mortgageTaxEligible = null;
    mortgageTaxNote = "須核對買方自住用途、登記面積與其他適用條件；民泊／旅館營運收益不能作為自住減稅資格依據。";
  }

  // 6. Initial Costs
  const acquisitionTaxAssessment = assessRealEstateAcquisitionTax({
    propertyCategory: propertyDetails.kind,
    buildingAssessedValueYen: parseNonNegativeYenAmount(extracted.buildingAssessedValue),
    landTaxAfterReliefYen: parseNonNegativeYenAmount(extracted.landAcquisitionTaxAfterRelief),
    fallbackTaxYen: parseNonNegativeYenAmount(extracted.realEstateAcquisitionTax),
    areaSqm,
    ageYears,
    occupancyStatus: `${extracted.occupancyStatus || ""} ${propertyDetails.hospitality ? "民泊" : isTenanted ? "投資" : ""}`,
  });

  const initialCosts = calculateSaleInitialCosts(salePriceYen, {
    monthlyManagementFeeYen: managementFee,
    monthlyRepairReserveYen: repairReserve + repairFund,
    combinedAnnualPropertyTaxYen: statedCombinedAnnualPropertyTax(extracted.taxDetails),
    fixedAssetTaxYen: parseNonNegativeYenAmount(extracted.fixedAssetTax),
    cityPlanningTaxYen: parseNonNegativeYenAmount(extracted.cityPlanningTax),
    acquisitionTaxYen: acquisitionTaxAssessment.amount,
    acquisitionTaxNote: acquisitionTaxAssessment.note,
    registrationFeeYen: parseNonNegativeYenAmount(extracted.registrationFee) || null,
    prepaidMonths: propertyDetails.excludeCondoComparison ? 0 : 3,
    insuranceFeeYen: propertyDetails.kind === "land" ? 0 : undefined,
  });

  return {
    propertyDetails,
    salePriceYen,
    salePriceMan: Math.round(salePriceYen / 10000),
    areaSqm,
    tsuboAndSqm,
    monthlyHoldingCosts: {
      managementFee,
      repairReserve,
      repairFund,
      otherMonthlyFees,
      totalMonthlyHoldingCost,
      items: holdingCostItems,
    },
    buildingHealth: {
      totalUnits,
      ageYears,
      ...reserveAssessment,
      specialStrengths,
      specialCautions,
      applicable: !propertyDetails.excludeCondoComparison,
      ...(propertyDetails.excludeCondoComparison ? {
        reservePerSqm: null,
        reserveHealthText: "不適用公寓修繕積立金標準",
        reserveHealthNote: "透天及整棟須自行編列建物維護預算；未刊載月額不代表維護費為零。",
        scaleRiskText: "不適用公寓社區戶數判定",
        scaleRiskNote: "以整棟建物與營運範圍個別評估。",
      } : {}),
    },
    mlitComparison: audit.blocksComparison ? null : mlitComparison,
    occupancyAssessment: {
      status: propertyDetails.hospitality ? "hospitality" : isTenanted ? "tenanted_investment" : isOwnerOccupied ? "occupied_owner" : isVacant ? "vacant" : "unknown",
      statusText: propertyDetails.hospitality ? (extracted.occupancyStatus || "住宿營業物件，現況待核對") : isTenanted ? "出租中（帶租約買賣／投資型）" : isOwnerOccupied ? "現有屋主居住中（交屋期需協商）" : isVacant ? (occupancy.renovating ? "現況空室／裝修中" : "現況空室，交屋條件待核對") : (statusRaw || "現況未載明，待確認"),
      investmentYield: isTenanted && grossYield ? {
        monthlyRentYen: effectiveMonthlyRentYen ?? currentRentYen ?? Math.round((annualIncomeYen ?? 0) / 12),
        annualIncomeYen: effectiveAnnualIncomeYen ?? annualIncomeYen ?? 0,
        grossYield: Math.round(grossYield * 1000) / 10,
        netYieldEstimated: typeof netYieldEstimated === "number" ? Math.round(netYieldEstimated * 10) / 10 : null,
        breakdown: netYieldBreakdown ?? undefined,
      } : undefined,
      mortgageTaxEligible,
      mortgageTaxNote,
      renovationNote: extracted.renovationDetails || undefined,
    },
    initialCosts,
  };
}
