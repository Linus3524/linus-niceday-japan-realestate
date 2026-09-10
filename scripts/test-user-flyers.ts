import { buildSaleAnalysis, resolveDistrictAndRegion } from "../api/analyze-listing.js";
import { formatYen } from "../src/lib/listingExtraction.js";

const flyers = [
  {
    id: "1_kichijoji",
    name: "ビューネ吉祥寺 203号室",
    extracted: {
      propertyType: "区分マンション",
      buildingName: "ビューネ吉祥寺",
      roomNumber: "203",
      address: "東京都武蔵野市吉祥寺東町2-6-5",
      station: "吉祥寺",
      walkTime: "12",
      price: "7,298万円",
      salePrice: "7,298万円",
      area: "54.47㎡",
      buildingArea: "54.47㎡",
      layout: "2LDK",
      structure: "RC造陸屋根地下1階付6階建",
      floor: "2",
      buildingFloors: "6",
      age: "1996年6月",
      totalUnits: "19戸",
      managementFee: "14,800円",
      repairReserve: "14,650円",
      repairFund: "",
      otherMonthlyFees: "",
      fixedAssetTax: 108900,
      cityPlanningTax: 0,
      realEstateAcquisitionTax: 0,
      buildingAssessedValue: 0,
      landAcquisitionTaxAfterRelief: 0,
      registrationFee: 0,
      landRights: "所有権",
      occupancyStatus: "空部屋",
      currentRent: "",
      annualIncome: "",
      grossYield: "",
      zoning: "近隣商業",
      managementCompany: "㈱ライフポート西洋",
      managementStyle: "全部委託（清掃員のみ）",
      taxEstimationBasis: "固定資産税等 年額108,900円",
      specialNotes: "大規模修繕工事実施検討中(詳細未定)。給排水管・ガス管10年保証、長期修繕計画表あり",
      renovationDetails: "2026年8月21日内装工事完了 キッチン交換／浴室交換／洗面交換／トイレ交換／水廻り床張替／フローリング新規（張替）／建具交換／照明交換／給湯器（追焚機能）交換／全クロス貼替／食洗機／浴室乾燥機／WIC新設",
      guaranteeFee: "", lockReplacementFee: "", cleaningFee: "", insuranceFee: "",
      shikibiki: "", cancellationPenalty: "", renewalFee: "", supportFee: "", freeRent: "",
      landRightsRatio: "",
    },
    salePriceYen: 72_980_000,
    areaSqm: 54.47,
    stations: ["吉祥寺"],
    walkTimes: ["12"],
    layout: "2LDK",
  },
  {
    id: "2_nakano",
    name: "ランドール中野 304号室",
    extracted: {
      propertyType: "区分マンション",
      buildingName: "ランドール中野",
      roomNumber: "304",
      address: "東京都中野区新井2丁目49-2",
      station: "中野, 沼袋",
      walkTime: "10, 15",
      price: "6,380万円",
      salePrice: "6,380万円",
      area: "40.04㎡",
      buildingArea: "40.04㎡",
      layout: "2LDK",
      structure: "鉄筋コンクリート造4階建",
      floor: "3",
      buildingFloors: "4",
      age: "平成9年2月", // 1997年2月
      totalUnits: "22戸",
      managementFee: "20,300円",
      repairReserve: "15,220円",
      repairFund: "",
      otherMonthlyFees: "CATV使用料 月額216円",
      fixedAssetTax: 0,
      cityPlanningTax: 0,
      realEstateAcquisitionTax: 0,
      buildingAssessedValue: 0,
      landAcquisitionTaxAfterRelief: 0,
      registrationFee: 0,
      landRights: "所有権",
      occupancyStatus: "現況空家",
      currentRent: "",
      annualIncome: "",
      grossYield: "",
      zoning: "第一種中高層住居專用地域",
      managementCompany: "大成有楽不動産株式会社",
      managementStyle: "全部委託（巡回）",
      taxEstimationBasis: "",
      specialNotes: "南向きバルコニー、角住戸。2011年大規模修繕工事実施済、2018年インターホン設備交換工事、2022年屋上防水改修工事",
      renovationDetails: "2026年9月中旬完成予定新規内装リフォーム中 間接照明設置、ユニットバス交換、トイレ内カウンター造作、建具交換、クロス貼替、フローリング貼替、フロアタイル貼替",
      guaranteeFee: "", lockReplacementFee: "", cleaningFee: "", insuranceFee: "",
      shikibiki: "", cancellationPenalty: "", renewalFee: "", supportFee: "", freeRent: "",
      landRightsRatio: "",
    },
    salePriceYen: 63_800_000,
    areaSqm: 40.04,
    stations: ["中野", "沼袋"],
    walkTimes: ["10", "15"],
    layout: "2LDK",
  },
  {
    id: "3_nihonbashi",
    name: "オープンレジデンシア日本橋横山町 7階部分",
    extracted: {
      propertyType: "区分マンション",
      buildingName: "オープンレジデンシア日本橋横山町",
      roomNumber: "7階部分",
      address: "東京都中央区日本橋横山町10-4",
      station: "馬喰町, 東日本橋, 馬喰横山, 浅草橋, 小伝馬町",
      walkTime: "1, 3, 4, 5, 9",
      price: "8,000万円",
      salePrice: "8,000万円",
      area: "41.46㎡",
      buildingArea: "41.46㎡",
      layout: "1LDK",
      structure: "鉄筋コンクリート造 地上14階・地下1階建",
      floor: "7",
      buildingFloors: "14",
      age: "2017年11月",
      totalUnits: "77戸",
      managementFee: "12,424円",
      repairReserve: "6,220円",
      repairFund: "",
      otherMonthlyFees: "インターネット使用料 1,430円、CATV設備使用料 550円、コミュニティ活動費 200円 (その他合計 2,180円)",
      fixedAssetTax: 0,
      cityPlanningTax: 0,
      realEstateAcquisitionTax: 0,
      buildingAssessedValue: 0,
      landAcquisitionTaxAfterRelief: 0,
      registrationFee: 0,
      landRights: "所有権",
      occupancyStatus: "現況空室",
      currentRent: "",
      annualIncome: "",
      grossYield: "",
      zoning: "商業地域",
      managementCompany: "メイトーサービス株式会社",
      managementStyle: "全部委託（日勤）",
      taxEstimationBasis: "",
      specialNotes: "床暖房、SIC、角住戸、日勤管理",
      renovationDetails: "",
      guaranteeFee: "", lockReplacementFee: "", cleaningFee: "", insuranceFee: "",
      shikibiki: "", cancellationPenalty: "", renewalFee: "", supportFee: "", freeRent: "",
      landRightsRatio: "",
    },
    salePriceYen: 80_000_000,
    areaSqm: 41.46,
    stations: ["馬喰町", "東日本橋", "馬喰横山", "浅草橋", "小伝馬町"],
    walkTimes: ["1", "3", "4", "5", "9"],
    layout: "1LDK",
  },
  {
    id: "4_ochanomizu",
    name: "セジョリ御茶ノ水Ⅱ 802号室",
    extracted: {
      propertyType: "区分マンション",
      buildingName: "セジョリ御茶ノ水Ⅱ",
      roomNumber: "802",
      address: "東京都文京区湯島2-15-11",
      station: "湯島, 御茶ノ水, 本郷三丁目, 御徒町",
      walkTime: "4, 8, 10, 11",
      price: "7,798万円",
      salePrice: "7,798万円",
      area: "40.71㎡",
      buildingArea: "40.71㎡",
      layout: "1LDK",
      structure: "RC造陸屋根12階建",
      floor: "8",
      buildingFloors: "12",
      age: "2011年3月",
      totalUnits: "47戸",
      managementFee: "12,200円",
      repairReserve: "9,940円",
      repairFund: "",
      otherMonthlyFees: "",
      fixedAssetTax: 108023,
      cityPlanningTax: 0,
      realEstateAcquisitionTax: 0,
      buildingAssessedValue: 0,
      landAcquisitionTaxAfterRelief: 0,
      registrationFee: 0,
      landRights: "所有権",
      occupancyStatus: "空室",
      currentRent: "",
      annualIncome: "",
      grossYield: "",
      zoning: "商業・近隣商業",
      managementCompany: "Jコミュニティ㈱",
      managementStyle: "全部委託（巡回）",
      taxEstimationBasis: "固定資産税等 年額108,023円",
      specialNotes: "12階建8階部分、オートロック、宅配BOX、防犯カメラ",
      renovationDetails: "2026年8月28日内装工事完了 キッチン交換／浴室交換／洗面交換／トイレ交換／水廻り床張替／フローリング新規（張替）／建具交換／照明交換／給湯器（追焚機能）交換／全クロス貼替／食洗機／浴室乾燥機",
      guaranteeFee: "", lockReplacementFee: "", cleaningFee: "", insuranceFee: "",
      shikibiki: "", cancellationPenalty: "", renewalFee: "", supportFee: "", freeRent: "",
      landRightsRatio: "",
    },
    salePriceYen: 77_980_000,
    areaSqm: 40.71,
    stations: ["湯島", "御茶ノ水", "本郷三丁目", "御徒町"],
    walkTimes: ["4", "8", "10", "11"],
    layout: "1LDK",
  },
  {
    id: "5_nishiogikubo",
    name: "グロース西荻窪 301号室",
    extracted: {
      propertyType: "区分マンション",
      buildingName: "グロース西荻窪",
      roomNumber: "301",
      address: "東京都杉並区松庵2-2-14",
      station: "西荻窪",
      walkTime: "9",
      price: "6,490万円",
      salePrice: "6,490万円",
      area: "44.50㎡",
      buildingArea: "44.50㎡",
      layout: "1LDK",
      structure: "鉄筋コンクリート造8階建",
      floor: "3",
      buildingFloors: "8",
      age: "2014年2月",
      totalUnits: "39戸",
      managementFee: "9,700円",
      repairReserve: "9,030円",
      repairFund: "",
      otherMonthlyFees: "インターネット使用料 月額660円",
      fixedAssetTax: 0,
      cityPlanningTax: 0,
      realEstateAcquisitionTax: 0,
      buildingAssessedValue: 0,
      landAcquisitionTaxAfterRelief: 0,
      registrationFee: 0,
      landRights: "所有権",
      occupancyStatus: "空室",
      currentRent: "",
      annualIncome: "",
      grossYield: "",
      zoning: "第1種低層住居専用地域・近隣商業地域",
      managementCompany: "株式会社メイプルリビングサービス",
      managementStyle: "全部委託（巡回）",
      taxEstimationBasis: "",
      specialNotes: "ルーフバルコニー7.89㎡、角部屋、ペット飼育可（犬猫1匹まで）",
      renovationDetails: "2026年8月完了 給湯器交換／システムキッチン交換／ユニットバス交換／洗面台交換／トイレ交換／全室クロス張替／全フローリング張替／建具一部交換／CF張替／防水パン交換",
      guaranteeFee: "", lockReplacementFee: "", cleaningFee: "", insuranceFee: "",
      shikibiki: "", cancellationPenalty: "", renewalFee: "", supportFee: "", freeRent: "",
      landRightsRatio: "",
    },
    salePriceYen: 64_900_000,
    areaSqm: 44.50,
    stations: ["西荻窪"],
    walkTimes: ["9"],
    layout: "1LDK",
  },
];

console.log("==================================================");
console.log("🔍 開始測試 5 張買賣圖紙在系統中的診斷結果");
console.log("==================================================\n");

for (const item of flyers) {
  console.log(`\n--------------------------------------------------`);
  console.log(`【物件 ${item.name}】`);
  console.log(`售價: ¥${item.salePriceYen.toLocaleString()} (${Math.round(item.salePriceYen / 10000)}萬円) | 面積: ${item.areaSqm}㎡ | 格局: ${item.layout}`);
  console.log(`地址: ${item.extracted.address} | 車站: ${item.extracted.station} 徒步 ${item.extracted.walkTime}分`);
  
  try {
    const analysis = buildSaleAnalysis(item as any);
    
    // 1. 地點與行情
    const loc = resolveDistrictAndRegion(item.extracted.address, item.stations[0]);
    console.log(`\n📍 [地點判定] 區域: ${loc?.region || "未識別"} | 市區町村: ${loc?.district || "未識別"}`);
    
    if (analysis.mlitComparison) {
      const m = analysis.mlitComparison;
      console.log(`📊 [實價登錄成約基準]`);
      console.log(`   - 基準分桶: ${m.district}・${m.layout} (${m.sampleCount || 0} 筆成交樣本)`);
      console.log(`   - 成交中位總價: ${m.medianPriceMan} 萬円 (單價: ¥${m.medianSqmPriceYen?.toLocaleString() || "—"}/㎡)`);
      console.log(`   - 條件校準預期價: ${m.expectedPriceMan} 萬円`);
      console.log(`   - 合理成交區間: ${m.fairLowMan} 萬円 ～ ${m.fairHighMan} 萬円`);
      console.log(`   - 開價價差: 本案開價相對校準預期價 ${m.diffPercent >= 0 ? "+" : ""}${m.diffPercent}%`);
      console.log(`   - 結論定調: ${m.verdictText} (${m.verdict})`);
      if (m.typicalListingPriceMan) {
        const rangeText = (m as any).typicalListingPriceLowMan && (m as any).typicalListingPriceHighMan
          ? ` (同級在售區間: ${(m as any).typicalListingPriceLowMan}萬 ～ ${(m as any).typicalListingPriceHighMan}萬)`
          : "";
        console.log(`   - 市場在售對照: ${m.listingBenchmarkScopeLabel || "在售"}約 ${m.typicalListingPriceMan} 萬円${rangeText} (本案相對 ${m.listingDiffPercent! >= 0 ? "+" : ""}${m.listingDiffPercent}%)`);
      }
      if (m.priceCautions && m.priceCautions.length > 0) {
        console.log(`   - 價格注意事項:`);
        m.priceCautions.forEach(c => console.log(`     ⚠️ ${c}`));
      }
    } else {
      console.log(`⚠️ [行情比對] 無法建立實價登錄比對 (可能是行政區未收錄或房型未匹配)`);
    }

    // 2. 大樓體質與修繕積立金
    const b = analysis.buildingHealth;
    console.log(`\n🏢 [大樓體質與維持費]`);
    console.log(`   - 屋齡: ${b.ageYears} 年 | 總戶數: ${b.totalUnits || "未載明"} 戶`);
    console.log(`   - 戶數規模判定: [${b.scaleRiskText}] - ${b.scaleRiskNote}`);
    console.log(`   - 每㎡月修繕積立金: ¥${b.reservePerSqm || "—"}/㎡/月 (指針建議: ${b.guidelineRange || "200~350"})`);
    console.log(`   - 修繕金水準: [${b.reserveHealthText}] - ${b.reserveHealthNote}`);
    if (b.feeRatioNote) {
      console.log(`   - 費用配比觀察: ${b.feeRatioNote}`);
    }
    if (b.specialStrengths && b.specialStrengths.length > 0) {
      console.log(`   - 大樓優勢認證: ${b.specialStrengths.join("、")}`);
    }
    if (b.specialCautions && b.specialCautions.length > 0) {
      console.log(`   - 大樓體質留意事項:`);
      b.specialCautions.forEach(c => console.log(`     ⚠️ ${c}`));
    }

    // 3. 現況與住宅貸款減稅
    const occ = analysis.occupancyAssessment;
    console.log(`\n📋 [現況與自住法務]`);
    console.log(`   - 現況判定: ${occ.statusText} (${occ.status})`);
    console.log(`   - 住宅貸款減稅資格: ${occ.mortgageTaxEligible === true ? "符合 (50㎡以上)" : occ.mortgageTaxEligible === false ? (item.areaSqm >= 40 && item.areaSqm < 43 ? "壁芯臨限 40㎡ (內法極高機率未滿 40㎡)" : "不符 (未滿40㎡)") : "需查驗謄本內法面積 (43~50㎡區間)"}`);
    console.log(`     說明: ${occ.mortgageTaxNote}`);

    // 4. 初期諸費用
    const init = analysis.initialCosts;
    console.log(`\n💰 [交屋諸費用預估]`);
    console.log(`   - 概算諸費用合計: ¥${init.total.toLocaleString()} (約 ${Math.round(init.total / 10000)} 萬円，佔房價 ${init.percentageOfPrice}%)`);
    init.items.forEach(it => {
      console.log(`     • ${it.name}: ¥${it.amount.toLocaleString()} (${it.note})`);
    });

  } catch (err: any) {
    console.error(`❌ 測試物件 ${item.name} 發生錯誤:`, err);
  }
}

// ==================== 4 大核心修正自動化斷言檢驗 ====================
import assert from "node:assert/strict";

console.log("\n==================== 執行 4 大問題修正自動斷言驗證 ====================");

// 1. Bug 1: registrationFee 預設為 0 時能正確回退至 1% 概算，不再造成諸費用嚴重低估
{
  const flyer1 = buildSaleAnalysis(flyers[0] as any);
  const regItem = flyer1.initialCosts.items.find(i => i.id === "registration");
  assert.ok(regItem, "應包含登記免許稅項目");
  assert.equal(regItem.amount, 729800, "登記免許稅在圖紙未載明時應以總價 1.0% 回退估算");
  assert.ok(flyer1.initialCosts.percentageOfPrice >= 4.5, "總費用比例應回升至正常的 4.5%~6.0% 區間");
  console.log("✓ Bug 1 通過: registrationFee 自動以 1.0% 回退，不再歸零。");
}

// 2. Bug 2: 當 propertyType 為空或非區分時，若具備集合住宅特徵，自動判定為 condominium，不再阻斷行情比較
{
  const flyerNoType = {
    ...flyers[1],
    extracted: {
      ...flyers[1].extracted,
      propertyType: "", // 模擬 Gemini 辨識為空白或一般住居
      buildingName: "ランドール中野", // 沒有「マンション」字眼
    },
  };
  const analysis = buildSaleAnalysis(flyerNoType as any);
  assert.equal(analysis.propertyDetails.kind, "condominium", "具備房號與修繕金特徵應推定為區分公寓");
  assert.ok(analysis.mlitComparison !== null, "不應阻斷 MLIT 實價登錄行情比對");
  assert.equal(analysis.mlitComparison.district, "中野區");
  console.log("✓ Bug 2 通過: 建物名稱無「マンション」但具集合住宅特徵時，自動推定為 condominium，順利產出實價登錄行情。");
}

// 3. 盲點 3: 40㎡ 壁芯臨界值防呆檢核
{
  // 3A: ランドール中野 (40.04㎡) -> 壁芯臨限 40㎡，登記簿內法極可能跌破 40㎡
  const nakano = buildSaleAnalysis(flyers[1] as any);
  assert.equal(nakano.occupancyAssessment.mortgageTaxEligible, false, "40.04㎡ 壁芯在扣除牆厚後極可能未滿 40㎡，應判定 false 並提示風險");
  assert.ok(nakano.occupancyAssessment.mortgageTaxNote.includes("37～38㎡"), "說明應清楚提示縮減至 37~38㎡ 之風險");

  // 3B: セジョリ御茶ノ水Ⅱ (40.71㎡) -> 壁芯臨限 40㎡
  const ochanomizu = buildSaleAnalysis(flyers[3] as any);
  assert.equal(ochanomizu.occupancyAssessment.mortgageTaxEligible, false);

  // 3C: グロース西荻窪 (44.5㎡) -> 43~50㎡ 需調閱謄本確認
  const nishiogi = buildSaleAnalysis(flyers[4] as any);
  assert.equal(nishiogi.occupancyAssessment.mortgageTaxEligible, null);
  assert.ok(nishiogi.occupancyAssessment.mortgageTaxNote.includes("壁芯 43～50㎡"));

  // 3D: ビューネ吉祥寺 (54.47㎡) -> 50㎡ 以上達標
  const kichijoji = buildSaleAnalysis(flyers[0] as any);
  assert.equal(kichijoji.occupancyAssessment.mortgageTaxEligible, true);
  console.log("✓ 盲點 3 通過: 40㎡ 壁芯臨限值精準判定，防範買方誤認自住減稅要件。");
}

// 4. 盲點 4: 「大規模修繕工事実施検討中」關鍵字偵測與大樓體質警示
{
  const kichijoji = buildSaleAnalysis(flyers[0] as any);
  assert.ok(kichijoji.buildingHealth.specialCautions && kichijoji.buildingHealth.specialCautions.length > 0, "應產生大樓體質注意事項");
  const caution = kichijoji.buildingHealth.specialCautions[0];
  assert.ok(caution.includes("大規模修繕工事實施檢討中"));
  assert.ok(caution.includes("19 戶")); // 總戶數少警示
  assert.ok(caution.includes("修繕一時金"));
  assert.ok(kichijoji.mlitComparison?.priceCautions?.some(c => c.includes("大規模修繕工事實施檢討中")), "行情分析注意事項亦應同步收錄");
  console.log("✓ 盲點 4 通過: 大規模修繕檢討中與小社區分攤風險成功提取並標註警示。");
}

console.log("\n🎉 所有測試與回歸斷言全數通過！\n");
