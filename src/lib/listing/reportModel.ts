import { getSpecialSaleMarketComparison } from "../../data/specialSaleMarket";
import { consumerListingFields } from "../consumerListingText";
import {
  parseEquipmentList
} from "../equipmentParser";
import { buildListingAudit } from "../listingAudit";
import {
  assessRealEstateAcquisitionTax,
  calculateSaleInitialCosts,
  formatShikibiki,
  normalizeStructure,
  parseAgeYears,
  parseArea,
  parseNonNegativeYenAmount
} from "../listingExtraction";
import { buildSpecialSaleDetails, statedCombinedAnnualPropertyTax } from "../specialSaleAnalysis";
import { parseTransitStations } from "../transitParser";
import { buildClientInitialCost } from './clientInitialCost';
import { buildClientSaleAnalysis } from './clientSaleAnalysis';
import { summarizeTaxEstimationBasis } from './formatters';
import type { AnalyzeListingResult, SaleAnalysisVerdict } from './types';

/** Derived report values; preserves API-first values and client fallback order. */
export function buildListingReportModel(result: AnalyzeListingResult | null, file: Pick<File, 'name' | 'type'> | null) {

  const extracted = result ? consumerListingFields(result.extracted) : undefined;
  const parsed = result?.parsed;
  const rent = parsed?.rent ?? null;
  const managementFee = parsed?.managementFee ?? 0;
  const totalMonthlyCost = rent !== null ? rent + managementFee : null;
  const initialCost = result?.initialCostEstimate || (result ? buildClientInitialCost(result) : null);
  const initialCostTips = (() => {
    if (!initialCost) return [];
    const missingLabels = initialCost.items.flatMap((item) => {
      if (!item.isUnknown) return [];
      if (item.id === "deposit") return ["押金"];
      if (item.id === "keyMoney") return ["禮金"];
      if (item.id === "managementFee") return ["共益費"];
      return [];
    });
    const currentTips = initialCost.tips.filter((tip) => !tip.startsWith("【費用待確認】"));
    return missingLabels.length > 0
      ? [`【費用待確認】${missingLabels.join("、")}未載明，目前只列已知及暫估小計；未載明項目不代表免收。`, ...currentTips]
      : currentTips;
  })();

  const stationSummary = extracted?.station
    ? extracted.station.split(/[,，]/).map(s => s.trim()).filter(Boolean).join("、")
    : null;

  const parsedArea = buildSpecialSaleDetails(extracted || {}).kind === "land" ? parseArea(extracted?.landArea) : parsed?.area ?? parseArea(extracted?.area);
  const displayArea = parsedArea
    ? `${parsedArea} ㎡（約 ${(parsedArea / 3.30578).toFixed(1)} 坪）` : extracted?.area || null;

  const displayStructure =
    parsed?.structure ||
    normalizeStructure(extracted?.structure) ||
    extracted?.structure ||
    null;

  const rawShikibiki =
    extracted?.shikibiki ||
    extracted?.deposit?.match(/(?:解約時)?(?:敷金)?(?:償却|敷引)\s*(\d+(?:\.\d+)?(?:ヶ月|ヵ月|カ月|個月)?)/)?.[0] ||
    extracted?.specialNotes?.match(/(?:解約時)?(?:敷金)?(?:償却|敷引)\s*(\d+(?:\.\d+)?(?:ヶ月|ヵ月|カ月|個月)?)/)?.[0] ||
    "";
  const formattedShikibiki = formatShikibiki(rawShikibiki);
  const hasPenalty = Boolean(
    extracted?.cancellationPenalty &&
    !/^(?:なし|無|0|-|ー|―)$/i.test(extracted.cancellationPenalty.trim())
  );

  const isSRCBuilding = /src|鉄骨[・･\s]*鉄筋|鋼骨[・･\s]*鋼筋/i.test(
    `${displayStructure || parsed?.structure || extracted?.structure || ""}`
      .replace(/[Ａ-Ｚａ-ｚ]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
  );

  const cleanVerdictHeadline = (result?.verdict?.headline || "")
    .replace(/建議評估議價空間/g, "建議評估個人每月承擔能力")
    .replace(/強烈建議積極議價或多比較周邊同級房源/g, "建議謹慎評估自身負擔能力，並多比較周邊同級房源");

  const cleanVerdictDetail = (() => {
    if (!result?.verdict?.detail) return "";
    let d = result.verdict.detail
      .replace(/^這個地區與房型的行情約[^\u3002]*\u3002\s*/, "")
      .replace(/^同車站同房型成約[^\u3002]*\u3002\s*/, "")
      .trim();

    if (isSRCBuilding) {
      d = d.replace(/RC\s*(?:鋼筋混凝土造?|造（鋼筋混凝土）)/g, "SRC造（鋼骨鋼筋混凝土）");
    } else {
      d = d.replace(/RC\s*鋼筋混凝土造(?!（)/g, "RC造（鋼筋混凝土）");
    }

    d = d
      .replace(/建議向仲介確認加價原因，或嘗試爭取免租期（Free Rent）與禮金減免以平衡負擔。?/g, "由於日本租屋月租多為固定定價、幾無議價談判空間，建議承租前務必衡量個人每月預算與承擔能力，亦可同步比較周邊其他同級房源。")
      .replace(/強烈建議積極議價或多比較周邊同級房源。?/g, "考量日本租屋習慣無談判議價空間，建議謹慎衡量個人每月承受力，並優先多比較周邊同級房源。");

    return d;
  })();

  const isSaleListing =
    result?.dealType === "sale" ||
    Boolean(result?.saleAnalysis) ||
    Boolean(result?.parsed?.salePrice && result.parsed.salePrice >= 10000000);
  const listingAudit = result ? result.audit || buildListingAudit(result.extracted, isSaleListing ? "sale" : "rent") : null;
  const rawSaleAnalysis = result?.saleAnalysis || (result ? buildClientSaleAnalysis(result) : null);
  const saleAnalysis = listingAudit?.blocksComparison && rawSaleAnalysis ? { ...rawSaleAnalysis, mlitComparison: null } : rawSaleAnalysis;
  const specialSale = buildSpecialSaleDetails(extracted || {});
  const isSpecialSale = specialSale.excludeCondoComparison;
  const specialComparison = (isSpecialSale && (specialSale.kind === "detached" || specialSale.kind === "land") && saleAnalysis?.salePriceYen)
    ? getSpecialSaleMarketComparison({
      kind: specialSale.kind,
      address: extracted?.address,
      salePriceYen: saleAnalysis.salePriceYen,
      areaSqm: specialSale.kind === "land" ? specialSale.landAreaSqm : specialSale.buildingAreaSqm,
      ageYears: parseAgeYears(extracted?.age || extracted?.buildingCondition),
    })
    : null;

  const effectiveMlitComparison = saleAnalysis?.mlitComparison || (isSpecialSale && specialComparison ? {
    region: "",
    district: specialComparison.market,
    layout: specialComparison.areaBand,
    // 與 saleAnalysis.mlitComparison 對齊欄位形狀，否則兩者 union 之後
    // UI 讀 marketAgeBand／priceCautions 會取不到值（土地・一棟報告的注意事項整段不會顯示）。
    marketAgeBand: undefined as string | undefined,
    priceCautions: [] as string[],
    ageBandComparison: undefined as SaleAnalysisVerdict["mlitComparison"]["ageBandComparison"],
    medianPriceYen: specialComparison.officialPriceYen,
    medianPriceMan: Math.round(specialComparison.officialPriceYen / 10000),
    medianSqmPriceYen: specialComparison.officialSqmPriceYen,
    sampleCount: specialComparison.officialSampleCount,
    diffPercent: specialComparison.saleVsOfficialPercent,
    rawDiffPercent: specialComparison.saleVsOfficialPercent,
    expectedPriceMan: Math.round(specialComparison.officialPriceYen / 10000),
    areaBaselineMan: Math.round(specialComparison.officialPriceYen / 10000),
    fairLowMan: Math.round(specialComparison.fairLowYen / 10000),
    fairHighMan: Math.round(specialComparison.fairHighYen / 10000),
    typicalListingPriceMan: specialComparison.listingPriceYen ? Math.round(specialComparison.listingPriceYen / 10000) : null,
    typicalListingPriceLowMan: specialComparison.listingPriceYen ? Math.round(specialComparison.listingPriceYen / 10000 * 0.95) : null,
    typicalListingPriceHighMan: specialComparison.listingPriceYen ? Math.round(specialComparison.listingPriceYen / 10000 * 1.05) : null,
    listingRangeLabel: specialComparison.listingPriceYen ? `${Math.round(specialComparison.listingPriceYen / 10000 * 0.95)}～${Math.round(specialComparison.listingPriceYen / 10000 * 1.05)}` : null,
    listingDiffPercent: specialComparison.saleVsListingPercent,
    listingVerdict: specialComparison.verdict,
    listingBenchmarkPeriod: specialComparison.listingPeriod,
    listingBenchmarkSourceUrl: specialComparison.listingSourceUrl,
    listingBenchmarkSourceLabel: specialComparison.listingPriceYen
      ? `At Home ${specialComparison.market}・${specialComparison.areaBand} 刊登相場`
      : null,
    periodStart: specialComparison.officialPeriod ? specialComparison.officialPeriod.split("～")[0] : "",
    periodEnd: specialComparison.officialPeriod ? specialComparison.officialPeriod.split("～")[1] : "",
    verdict: (specialComparison.verdict === "above" ? "premium" : specialComparison.verdict === "below" ? "bargain" : "fair") as "bargain" | "fair" | "premium",
    positiveFactorsSumPercent: undefined as number | undefined,
    netFactorsSumPercent: undefined as number | undefined,
    baselineNote: specialSale.kind === "land" ? "土地以每㎡成交單價校準本案面積。" : "戶建以土地建物合計成交價按建物面積正規化；仍須另核對土地形狀、接道及建物狀況。",
    priceFactors: [
      ...(specialSale.kind === "detached" ? [
        { label: "物件型態", ratePercent: 0, note: "透天住宅（獨棟戶建／非集合公寓）", applied: true, basis: "data" as const },
      ] : []),
      ...(extracted?.age ? [
        { label: "屋齡", ratePercent: 0, note: `${extracted.age}（${specialComparison.ageControlled ? "已比對同屋齡帶基準" : "同區行情平均"}）`, applied: true, basis: "data" as const },
      ] : []),
      ...(extracted?.station ? [
        { label: "交通", ratePercent: 0, note: `${extracted.station}${extracted.walkTime ? ` 徒步${extracted.walkTime}分` : ""}`, applied: false, basis: "estimate" as const },
      ] : []),
    ],
  } : null);
  const taxEstimationSummary = summarizeTaxEstimationBasis(extracted?.taxEstimationBasis);
  const acquisitionTaxAssessment = saleAnalysis ? assessRealEstateAcquisitionTax({
    propertyCategory: specialSale.kind,
    buildingAssessedValueYen: parseNonNegativeYenAmount(extracted?.buildingAssessedValue),
    landTaxAfterReliefYen: parseNonNegativeYenAmount(extracted?.landAcquisitionTaxAfterRelief),
    fallbackTaxYen: parseNonNegativeYenAmount(extracted?.realEstateAcquisitionTax),
    areaSqm: saleAnalysis.areaSqm,
    ageYears: saleAnalysis.buildingHealth.ageYears,
    occupancyStatus: `${specialSale.hospitality ? "民泊" : ""} ${extracted?.occupancyStatus || ""} ${extracted?.currentRent || extracted?.annualIncome || extracted?.grossYield ? "賃貸中" : ""
      }`,
  }) : null;
  const saleInitialCosts = saleAnalysis ? calculateSaleInitialCosts(saleAnalysis.salePriceYen, {
    prepaidMonths: isSpecialSale ? 0 : 3,
    insuranceFeeYen: specialSale.kind === "land" ? 0 : undefined,
    monthlyManagementFeeYen: saleAnalysis.monthlyHoldingCosts.managementFee,
    monthlyRepairReserveYen:
      saleAnalysis.monthlyHoldingCosts.repairReserve + saleAnalysis.monthlyHoldingCosts.repairFund,
    combinedAnnualPropertyTaxYen: statedCombinedAnnualPropertyTax(extracted?.taxDetails),
    fixedAssetTaxYen: parseNonNegativeYenAmount(extracted?.fixedAssetTax),
    cityPlanningTaxYen: parseNonNegativeYenAmount(extracted?.cityPlanningTax),
    acquisitionTaxYen: acquisitionTaxAssessment?.amount,
    acquisitionTaxNote: acquisitionTaxAssessment?.note,
    registrationFeeYen: parseNonNegativeYenAmount(extracted?.registrationFee),
  }) : null;
  const buildingName = (extracted?.buildingName || "").trim();
  // 買賣図面的房號常不在獨立欄位，而是混在「所在階／部屋番号」「物件名」或備註列裡，
  // 因此除了 roomNumber 之外，再依序掃描這幾個欄位，讓買賣報告標題也能帶出房號。
  const roomNumberFallbackSources = [
    extracted?.floor,
    extracted?.buildingName,
    extracted?.otherConditions,
    extracted?.specialNotes,
  ];
  // 販売図面實測多半只寫到「○階」而不印房號（レグノ・セレーノ803 的圖面內文即無 803），
  // 但仲介寄檔時幾乎都會把房號接在物件名後面。因此圖面本身找不到時，最後才退回檔名，
  // 且僅接受「緊接在物件名之後」的數字，避免把日期、管理編號或「12F」誤判成房號。
  const roomNumberFromFileName = (() => {
    const name = (file?.name || "").replace(/\.[^.]+$/, "").replace(/[０-９Ａ-Ｚａ-ｚ]/g, ch =>
      String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)
    );
    if (!name || !buildingName || !name.includes(buildingName)) return "";
    const tail = name.slice(name.indexOf(buildingName) + buildingName.length);
    const hit = tail.match(/^[\s_＿\-‗・]*([A-Za-z]?\d{2,4})(?:号室|號室|号|室)?(?=$|[\s_＿\-‗・.（(])/);
    const value = hit?.[1] || "";
    // 4 位數的 19xx／20xx 幾乎都是年份或日期批號，不是房號。
    return /^(?:19|20)\d{2}$/.test(value) ? "" : value;
  })();
  const rawRoomNumber = (
    extracted?.roomNumber ||
    roomNumberFallbackSources
      .map(src => src?.match(/(?:^|[^\d番地丁])([A-Za-z]?\d{2,4}\s*(?:号室|號室|室))(?!\d)/)?.[1])
      .find(Boolean) ||
    roomNumberFromFileName ||
    ""
  ).trim().replace(/\s+/g, "");
  const formattedRoom = rawRoomNumber
    ? /^[A-Za-z]?\d{2,4}$/.test(rawRoomNumber)
      ? `${rawRoomNumber}号室`
      : rawRoomNumber.replace(/號室$/, "号室").replace(/(?<!号)室$/, "号室")
    : "";
  const roomAlreadyInName = Boolean(
    formattedRoom && (
      buildingName.includes(formattedRoom) ||
      (rawRoomNumber && buildingName.includes(rawRoomNumber))
    )
  );
  // 販売図面常常不印号室（デュオ・スカーラ新宿即是），這時退而寫出圖紙標示的所在階，
  // 讓標題至少能對上「是哪一戶」的層別資訊，而不是只有一個大樓名。
  const floorLabel = (() => {
    if (formattedRoom) return "";
    const raw = (extracted?.floor || "").replace(/[０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0));
    const hit = raw.match(/(地下\s*\d+|\d+)\s*階/);
    if (!hit) return "";
    const floor = `${hit[1].replace(/\s+/g, "")}階`;
    // 「4階建」是建物總樓層，不是這一戶的所在階，不能拿來當標題。
    return new RegExp(`${floor}建`).test(raw) && !/所在階|部分/.test(raw) ? "" : floor;
  })();
  const displayBuildingWithRoom = [
    buildingName,
    !roomAlreadyInName ? (formattedRoom || (buildingName ? floorLabel : "")) : null,
  ].filter(Boolean).join(" ");
  const reportHeading =
    displayBuildingWithRoom ||
    (stationSummary
      ? formattedRoom
        ? `${stationSummary}駅周邊 ${formattedRoom}`
        : `${stationSummary}駅周邊`
      : isSaleListing
        ? (specialSale.kind === "land" ? "日本土地"
          : specialSale.kind === "detached" ? "日本透天住宅"
            : specialSale.kind ? `日本${specialSale.kindLabel}`
              : "日本買賣公寓")
        : "日本租賃物件");
  const isPdfPreview = file?.type === "application/pdf";
  const equipmentList = parseEquipmentList(
    extracted?.facilities || extracted?.specialNotes,
    extracted?.facilityTranslations,
  );
  const stationItems = parseTransitStations(extracted?.transitAccess, extracted?.station, extracted?.walkTime);
  return {
    extracted,
    parsed,
    rent,
    managementFee,
    totalMonthlyCost,
    initialCost,
    initialCostTips,
    parsedArea,
    displayArea,
    displayStructure,
    formattedShikibiki,
    hasPenalty,
    cleanVerdictHeadline,
    cleanVerdictDetail,
    isSaleListing,
    listingAudit,
    saleAnalysis,
    specialSale,
    isSpecialSale,
    specialComparison,
    effectiveMlitComparison,
    taxEstimationSummary,
    acquisitionTaxAssessment,
    saleInitialCosts,
    reportHeading,
    isPdfPreview,
    equipmentList,
    stationItems,
  };
}
export type ListingReportModel = ReturnType<typeof buildListingReportModel>;
