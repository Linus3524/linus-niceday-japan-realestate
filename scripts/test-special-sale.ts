import assert from "node:assert/strict";
import { buildSaleAnalysis, type ExtractedListingFields } from "../api/analyze-listing.js";
import { parseSalePrice, parseArea, parseAgeYears, assessRealEstateAcquisitionTax, calculateSaleInitialCosts } from "../src/lib/listingExtraction.js";
import { buildSpecialSaleDetails, parseRevenueCalculationBasis, reconcileSpecialSaleFields, saleOccupancy, statedAnnualPropertyTax, statedCombinedAnnualPropertyTax } from "../src/lib/specialSaleAnalysis.js";

// 六份使用者提供的圖紙，僅保存回歸所需的原文欄位，不含影像或仲介聯絡資料。
const cases = [
  { name: "長崎戸建", propertyType: "戸建", salePrice: "7,580万円", area: "91.08㎡", landArea: "58.19㎡(17.60坪) 私道負担8.74㎡", hospitalityDetails: "民泊免許申請済 民泊運営中", annualIncome: "6,810,000円", grossYield: "9%", expectedPrice: 75800000, expectedPermit: "pending" },
  { name: "池袋本町3丁目", propertyType: "戸建", salePrice: "1億1800万円", area: "102.45㎡", landArea: "64.53㎡", hospitalityDetails: "旅館業営業許可書あり", annualIncome: "10,800,000円", grossYield: "9.15%", expectedPrice: 118000000, expectedPermit: "approved_claim" },
  { name: "池袋本町2丁目", propertyType: "戸建", salePrice: "8,990万円", area: "64.69㎡", landArea: "45.41㎡/セットバック部分1.13㎡/正味44.28㎡", hospitalityDetails: "民泊免許申請中", annualIncome: "7,350,000円", grossYield: "8.17%", expectedPrice: 89900000, expectedPermit: "pending" },
  { name: "高松・申請版", propertyType: "戸建", salePrice: "8,190万円", area: "71.19㎡", landArea: "45.07㎡(13.63坪)", hospitalityDetails: "民泊運営申請中", annualIncome: "7,350,000円", grossYield: "8.97%", expectedPrice: 81900000, expectedPermit: "pending" },
  { name: "高松・許可版", propertyType: "戸建", salePrice: "8,190万円", area: "71.19㎡", landArea: "45.07㎡(13.63坪)", hospitalityDetails: "民泊運営可 許可取得済", annualIncome: "7,350,000円", grossYield: "8.97%", expectedPrice: 81900000, expectedPermit: "approved_claim" },
  { name: "大谷口上町1棟", propertyType: "1棟", salePrice: "8,980万円", area: "136.17㎡", landArea: "", hospitalityDetails: "1F旅館業運営許可取得済み", annualIncome: "3,780,000円", grossYield: "", revenueScope: "101号室", expectedPrice: 89800000, expectedPermit: "approved_claim" },
];
let baseFields!: ExtractedListingFields;
for (const item of cases) {
  const extracted: ExtractedListingFields = {
    dealType: "sale", station: "要町", walkTime: "9", transitAccess: "", rent: "", floor: "", buildingFloors: "3",
    keyMoney: "", deposit: "", leaseTerms: "", guaranteeFee: "", lockReplacementFee: "", cleaningFee: "", insuranceFee: "",
    shikibiki: "", cancellationPenalty: "", renewalFee: "", supportFee: "", freeRent: "", landRights: "", zoning: "",
    managementCompany: "", managementStyle: "", landRightsRatio: "", taxEstimationBasis: "",
    buildingName: item.name, structure: "木造3階建", age: "2005年5月", address: "東京都豊島区高松2丁目43-9", layout: "3LDK",
    managementFee: "", repairReserve: "", repairFund: "", otherMonthlyFees: "", totalUnits: "", specialNotes: "", renovationDetails: "",
    occupancyStatus: "空室", currentRent: "", buildingAssessedValue: 5000000, landAcquisitionTaxAfterRelief: 0,
    realEstateAcquisitionTax: 0, fixedAssetTax: 0, cityPlanningTax: 0, registrationFee: 800000,
    ...item,
  };
  baseFields = extracted;
  const price = parseSalePrice(extracted.salePrice)!;
  assert.equal(price, item.expectedPrice);
  const result = buildSaleAnalysis({ extracted, salePriceYen: price, areaSqm: parseArea(extracted.area), stations: ["要町"], walkTimes: ["9"], layout: extracted.layout });
  assert.equal(result.mlitComparison, null, `${item.name}: 不套用公寓行情`);
  assert.equal(result.propertyDetails.permitStatus, item.expectedPermit);
  assert.equal(result.occupancyAssessment.status, "hospitality");
  assert.equal(result.occupancyAssessment.investmentYield, undefined, "營業收益不能變成帶租約淨投報");
  assert.equal(result.occupancyAssessment.mortgageTaxEligible, null);
  assert.equal(result.buildingHealth.applicable, false);
  assert.doesNotMatch(result.buildingHealth.reserveHealthText, /偏低/);
  assert.match(result.initialCosts.items.find(i => i.id === "acquisitionTax")!.note, /未計入/);
  assert.equal(result.initialCosts.items.find(i => i.id === "managementPrepayment")!.amount, 0);
  console.log(`✓ ${item.name}：${price / 10000} 萬円／${result.propertyDetails.permitLabel}`);
}
assert.equal(parseArea("58.19㎡(17.60坪)"), 58.19);
assert.equal(parseArea("13.63坪(45.07㎡)"), 45.07);
assert.equal(parseArea("1F:18.21㎡/2F:26.49㎡/3F:26.49㎡/合計71.19㎡(壁芯)"), 71.19);
assert.equal(parseArea("17.60坪"), 58.2);
assert.equal(parseSalePrice("１億１，８００万円（税込）"), 118000000);
assert.equal(parseSalePrice("2.5億円"), 250000000);
assert.equal(statedAnnualPropertyTax("令和6年度固定資産税 土地37,169円 家屋60,424円"), 97593);
assert.equal(statedAnnualPropertyTax("令和6年度固定資産税 土地56,270円 家屋66,064円"), 122334);
assert.equal(statedAnnualPropertyTax("土地45.07㎡"), null);
assert.equal(buildSpecialSaleDetails(cases[5]).partialIncome, true);
assert.equal(buildSpecialSaleDetails(cases[5]).statedYieldPercent, null);
assert.equal(buildSpecialSaleDetails(cases[5]).calculatedYieldPercent, 4.21);
assert.equal(buildSpecialSaleDetails({ propertyType: "区分マンション", specialNotes: "ペット可。民泊禁止。" }).excludeCondoComparison, false);
assert.equal(buildSpecialSaleDetails({ hospitalityDetails: "民泊申請中 許可取得済" }).permitStatus, "conflicting");
assert.equal(buildSpecialSaleDetails({ ...cases[1], salePrice: "1800万円" }).yieldMismatch, true);
assert.equal(assessRealEstateAcquisitionTax({ buildingAssessedValueYen: 5000000, areaSqm: 71.19, ageYears: 21, occupancyStatus: "民泊投資" }).amount, null);
// 第二批五張：普通區分公寓為對照，避免特殊物件防呆破壞原有費用分析。
function analyzeSample(fields: Partial<ExtractedListingFields>) {
  const extracted = reconcileSpecialSaleFields({ ...baseFields, propertyType: "", buildingName: "", area: "", buildingArea: "", landArea: "", hospitalityDetails: "", revenueScope: "", revenueDetails: "", annualIncome: "", currentRent: "", grossYield: "", ...fields });
  return buildSaleAnalysis({ extracted, salePriceYen: parseSalePrice(extracted.salePrice)!, areaSqm: parseArea(extracted.area), stations: ["川口"], walkTimes: ["14"], layout: extracted.layout });
}
const house = analyzeSample({ propertyType: "戸建", salePrice: "25,800万円", buildingArea: "延床145.00㎡", landArea: "151.71㎡", age: "令和8年6月完成", occupancyStatus: "即可交屋" });
assert.equal(house.salePriceYen, 258000000);
assert.equal(house.areaSqm, 145);
assert.equal(house.buildingHealth.ageYears, new Date().getFullYear() - 2026);
assert.equal(house.occupancyAssessment.status, "unknown", "可交屋不等於明示空室");
assert.match(house.initialCosts.items.find(i => i.id === "acquisitionTax")!.note, /未計入/);
assert.equal(reconcileSpecialSaleFields({ roomNumber: "1号地" }).roomNumber, "");
assert.equal(reconcileSpecialSaleFields({ roomNumber: "405号室" }).roomNumber, "405号室");

const hotel = analyzeSample({ propertyType: "一棟ホテル", salePrice: "420,000,000￥", landArea: "130.94㎡", buildingArea: "320.62㎡", hospitalityDetails: "旅館業取得済み", revenueDetails: "想定年間収入3684万円、想定利回り8.77%", annualIncome: "3684万円", grossYield: "8.77%" });
assert.equal(hotel.salePriceYen, 420000000);
assert.equal(hotel.areaSqm, 320.62);
assert.equal(hotel.propertyDetails.landAreaSqm, 130.94);
assert.equal(hotel.propertyDetails.revenueBasis, "forecast");
assert.equal(hotel.propertyDetails.calculatedYieldPercent, 8.77);
assert.equal(buildSpecialSaleDetails({ revenueDetails: "旅館実績 月額/90万円", salePrice: "1億1800万円" }).annualRevenueYen, 10800000);
assert.equal(buildSpecialSaleDetails({ revenueDetails: "想定利回り8.4%", salePrice: "22000万円" }).annualRevenueYen, null);

const land = analyzeSample({ propertyType: "土地（古屋付戸建）", salePrice: "28,000万円", landArea: "公簿95.50㎡（28.88坪）", area: "95.50㎡", handoverDetails: "建物あり（更地渡し）、古屋付・現況渡し（解体については要相談）" });
assert.equal(land.propertyDetails.kind, "land");
assert.equal(land.areaSqm, 95.5);
assert.equal(land.propertyDetails.buildingAreaSqm, null, "土地面積不可回填現存建物面積");
assert.equal(land.propertyDetails.handoverConflict, true);
assert.equal(land.mlitComparison, null);
assert.equal(land.occupancyAssessment.mortgageTaxEligible, null);
assert.match(land.initialCosts.items.find(i => i.id === "acquisitionTax")!.note, /未計入/);
assert.equal(land.initialCosts.items.find(i => i.id === "insurance")!.amount, 0, "土地不自動套用住宅保險概算");
assert.equal(buildSpecialSaleDetails({ propertyType: "土地", handoverDetails: "現況渡し" }).handoverConflict, false);

const condoFields = { propertyType: "区分マンション", salePrice: "3,680万円", buildingArea: "専有66.30㎡", age: "1987年11月築", managementFee: "13,090円", repairReserve: "19,990円", occupancyStatus: "現況空室", renovationDetails: "リフォーム中", optionalFacilities: "駐車場 空き無し 月額9,000円", totalUnits: "28戸" };
const condo = analyzeSample(condoFields);
assert.equal(condo.propertyDetails.excludeCondoComparison, false);
assert.equal(condo.buildingHealth.applicable, true);
assert.equal(condo.monthlyHoldingCosts.totalMonthlyHoldingCost, 33080, "不加入選配停車費");
assert.match(condo.occupancyAssessment.statusText, /裝修中/);
assert.equal(saleOccupancy(condoFields).renovating, true);
assert.equal(saleOccupancy({ renovationDetails: "翻新完成" }).renovating, false);

const mixed = analyzeSample({ propertyType: "一棟（店舗・共同住宅）", buildingName: "エレガントマンション", salePrice: "22,000万円", landArea: "133.81㎡", buildingArea: "293.43㎡", unitBreakdown: "店舗3戸+寮26戸 総戸数29戸", revenueDetails: "想定利回り：8.4%", annualIncome: "1,848万円（想定）", grossYield: "8.4%", occupancyStatus: "全空室", renovationDetails: "全体リフォーム中" });
assert.equal(mixed.propertyDetails.kind, "whole_building");
assert.equal(mixed.propertyDetails.mixedUse, true);
assert.equal(mixed.propertyDetails.annualRevenueYen, null, "不能把售價乘投報率變成圖紙刊載收入");
assert.equal(mixed.propertyDetails.calculatedYieldPercent, null);
assert.equal(mixed.propertyDetails.statedYieldPercent, 8.4);
assert.equal(mixed.occupancyAssessment.status, "vacant");
assert.equal(mixed.occupancyAssessment.investmentYield, undefined);
assert.equal(mixed.mlitComparison, null);
assert.equal(parseAgeYears("1964年3月（築61年）"), new Date().getFullYear() - 1964);
assert.equal(parseAgeYears("昭和39年3月（築61年）"), new Date().getFullYear() - 1964);
assert.equal(parseAgeYears("築15年"), 15);
const iriya = analyzeSample({ propertyType: "一棟", salePrice: "1億3,800万円", landArea: "61.44㎡", buildingArea: "192.78㎡", hospitalityDetails: "旅館業取得サポート可", grossYield: "13.04%", revenueDetails: "旅館業想定利回り13.04%", renovationDetails: "室内写真はリフォーム後イメージ", priceDetails: "リフォーム前現況価格、弊社想定リフォーム価格2000万円", taxDetails: "固都税 約15万円(2026年)" });
assert.equal(iriya.salePriceYen, 138000000);
assert.equal(iriya.propertyDetails.permitStatus, "support_only");
assert.equal(iriya.propertyDetails.illustrativePhotos, true);
assert.equal(iriya.propertyDetails.renovationExtra, true);
assert.equal(iriya.propertyDetails.annualRevenueYen, null);
assert.equal(statedCombinedAnnualPropertyTax("固都税 約15万円(2026年)"), 150000);
assert.equal(statedCombinedAnnualPropertyTax("固都税 調査中"), null);
const costs = calculateSaleInitialCosts(138000000, { handoverDate: "2026-01-01", combinedAnnualPropertyTaxYen: 150000, fixedAssetTaxYen: 150000, cityPlanningTaxYen: 30000 });
assert.match(costs.items.find(i => i.id === "propertyTaxProration")!.note, /150,000/);
assert.doesNotMatch(costs.items.find(i => i.id === "propertyTaxProration")!.note, /180,000/);
const nippori = analyzeSample({ propertyType: "戸建", salePrice: "旧価格8,180万円 新価格6,980万円", landArea: "宅地47.11㎡ 公簿59.03㎡ 現況SB済11.92㎡", buildingArea: "合計103.5㎡ 1階37.26㎡ 2階37.26㎡ 3階28.98㎡", hospitalityDetails: "民泊 全て可能", renovationDetails: "2026年6月フルリフォーム完工済" });
assert.equal(nippori.salePriceYen, 69800000);
assert.equal(reconcileSpecialSaleFields({ salePrice: "8,180万円", priceDetails: "旧価格8,180万円 新価格6,980万円" }).salePrice, "69800000円");
assert.equal(nippori.areaSqm, 103.5);
assert.equal(nippori.propertyDetails.landAreaSqm, 47.11);
assert.equal(nippori.propertyDetails.permitStatus, "possibility_only");
assert.equal(nippori.propertyDetails.illustrativePhotos, false);
assert.equal(buildSpecialSaleDetails({ hospitalityDetails: "旅館業 許可取得サポート可" }).permitStatus, "support_only");
assert.equal(buildSpecialSaleDetails({ hospitalityDetails: "旅館業 許可取得予定" }).permitStatus, "unconfirmed");

const nagasakiRevenue = parseRevenueCalculationBasis("◆売上：6,810,000円 180日*32,000円+350,000円*3ヶ月 ◆利回り 9%");
assert.deepEqual(nagasakiRevenue, [
  { label: "民泊收入", formula: "32,000 円 × 180 日", value: "5,760,000 円" },
  { label: "月租收入", formula: "350,000 円 × 3 個月", value: "1,050,000 円" },
  { label: "圖紙刊載年營收", formula: "5,760,000 円 ＋ 1,050,000 円", value: "6,810,000 円" },
  { label: "圖紙刊載投報率", value: "9.00%" },
]);
console.log("Special sale regression: 13 flyers and boundary checks passed.");
