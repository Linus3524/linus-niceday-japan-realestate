import { buildSaleAnalysis } from "../api/analyze-listing.js";
import { formatYen } from "../src/lib/listingExtraction.js";

const flyers = [
  {
    name: "1. ランドール中野 304号室",
    description: "中野區・角住戶・南向陽台・2026年9月新規翻修",
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
      age: "平成9年2月", // 1997年2月 (築29年)
      totalUnits: "22戸",
      managementFee: "20,300円",
      repairReserve: "15,220円",
      managementStyle: "全部委託（巡回）",
      specialNotes: "南向きバルコニー、角住戸、陽当たり良好",
      renovationDetails: "2026年9月中旬完成予定新規内装リフォーム中 間接照明設置、ユニットバス交換、トイレ内カウンター造作、建具交換、クロス貼替、フローリング貼替、フロアタイル貼替",
      occupancyStatus: "現況空家",
    },
    salePriceYen: 63_800_000,
    areaSqm: 40.04,
    stations: ["中野", "沼袋"],
    walkTimes: ["10", "15"],
    layout: "2LDK",
  },
  {
    name: "2. グローリオ錦糸町 11階部分",
    description: "墨田區・東南角住戶・スカイツリー展望・東×西2面陽台・ペット可・未翻新原裝",
    extracted: {
      propertyType: "区分マンション",
      buildingName: "グローリオ錦糸町",
      roomNumber: "11階部分",
      address: "東京都墨田区太平1丁目16-5",
      station: "錦糸町",
      walkTime: "11",
      price: "7,480万円",
      salePrice: "7,480万円",
      area: "58.67㎡",
      buildingArea: "58.67㎡",
      layout: "2LDK",
      structure: "鉄筋コンクリート造14階建",
      floor: "11",
      buildingFloors: "14",
      age: "2006年2月", // 築20年
      totalUnits: "55戸",
      managementFee: "14,600円",
      repairReserve: "13,200円",
      managementStyle: "全部委託（日勤）",
      specialNotes: "南東角住戸、東京スカイツリーを望む、東×西2面バルコニー、床暖房、食洗機、ペット飼育可",
      renovationDetails: "", // 未翻新，原裝
      occupancyStatus: "居住中",
    },
    salePriceYen: 74_800_000,
    areaSqm: 58.67,
    stations: ["錦糸町"],
    walkTimes: ["11"],
    layout: "2LDK",
  },
  {
    name: "3. Lavilio 錦糸町 Bellgrade 705号室",
    description: "墨田區・高樓層・2026年新規大翻新・ペット不可",
    extracted: {
      propertyType: "区分マンション",
      buildingName: "Lavilio 錦糸町 Bellgrade",
      roomNumber: "705",
      address: "東京都墨田区太平1-3-8",
      station: "錦糸町",
      walkTime: "8",
      price: "7,998万円",
      salePrice: "7,998万円",
      area: "45.74㎡",
      buildingArea: "45.74㎡",
      layout: "1SLDK", // 1LDK+S -> ldk1
      structure: "鉄筋コンクリート造10階建",
      floor: "7",
      buildingFloors: "10",
      age: "2009年2月", // 築17年
      totalUnits: "49戸",
      managementFee: "12,800円",
      repairReserve: "11,500円",
      renovationDetails: "システムキッチン新規交換、ユニットバス新規交換、建具新規交換、エアコン新規設置、クロス貼り替え、フローリング貼り替え、洗面化粧台新規交換、温水洗浄機能付トイレ新規交換、給湯器新規交換",
      specialNotes: "オートロック、宅配BOX、ペット飼育不可",
      occupancyStatus: "空室",
    },
    salePriceYen: 79_980_000,
    areaSqm: 45.74,
    stations: ["錦糸町"],
    walkTimes: ["8"],
    layout: "1SLDK",
  },
  {
    name: "4. ビューネ吉祥寺 203号室",
    description: "武藏野市・吉祥寺名牌地段・2026年新規翻新・總戶數19戶小規模",
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
      age: "1996年6月", // 築30年
      totalUnits: "19戸", // 小於20戶規模風險
      managementFee: "14,800円",
      repairReserve: "14,650円",
      renovationDetails: "2026年8月21日内装工事完了 キッチン交換／浴室交換／洗面交換／トイレ交換／水廻り床張替／フローリング新規（張替）／建具交換／照明交換／給湯器（追焚機能）交換／全クロス貼替",
      specialNotes: "大規模修繕工事実施検討中(詳細未定)。長期修繕計画表あり",
      occupancyStatus: "空部屋",
    },
    salePriceYen: 72_980_000,
    areaSqm: 54.47,
    stations: ["吉祥寺"],
    walkTimes: ["12"],
    layout: "2LDK",
  },
  {
    name: "5. シティコーポ柏木 2階部分",
    description: "新宿區・築40年老屋・近70㎡ 3LDK・角住戶・南向・未翻新原裝",
    extracted: {
      propertyType: "区分マンション",
      buildingName: "シティコーポ柏木",
      roomNumber: "2階部分",
      address: "東京都新宿区北新宿2丁目5-25",
      station: "大久保, 西新宿, 新大久保, 東中野, 中野坂上",
      walkTime: "9, 14, 14, 14, 14",
      price: "6,980万円",
      salePrice: "6,980万円",
      area: "69.19㎡",
      buildingArea: "69.19㎡",
      layout: "3LDK",
      structure: "鉄筋コンクリート造地上5階建",
      floor: "2",
      buildingFloors: "5",
      age: "1986年5月", // 築40年
      totalUnits: "23戸",
      renovationDetails: "", // 未翻新原裝交屋
      specialNotes: "角住戸、南向き、敷地約452坪",
      occupancyStatus: "空家",
    },
    salePriceYen: 69_800_000,
    areaSqm: 69.19,
    stations: ["大久保", "西新宿", "新大久保", "東中野", "中野坂上"],
    walkTimes: ["9", "14", "14", "14", "14"],
    layout: "3LDK",
  },
  {
    name: "6. グロース西荻窪 301号室",
    description: "杉並區・角房間・專用景觀露台 7.89㎡・ペット可・2026年新規翻新",
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
      age: "2014年2月", // 築12年
      totalUnits: "39戸",
      managementFee: "9,700円",
      repairReserve: "9,030円",
      specialNotes: "ルーフバルコニー7.89㎡、角部屋、ペット飼育可（犬猫1匹まで）",
      renovationDetails: "2026年8月完了 給湯器交換／システムキッチン交換／ユニットバス交換／洗面台交換／トイレ交換／全室クロス張替／全フローリング張替",
      occupancyStatus: "空室",
    },
    salePriceYen: 64_900_000,
    areaSqm: 44.50,
    stations: ["西荻窪"],
    walkTimes: ["9"],
    layout: "1LDK",
  },
];

console.log("================================================================================");
console.log("📊 驗證：官方査定教科書（RETPC）與大數據（Tokyo Kantei）對真實圖紙之定價支持度");
console.log("================================================================================\n");

for (const flyer of flyers) {
  console.log("--------------------------------------------------------------------------------");
  console.log(`【${flyer.name}】`);
  console.log(`特色定位：${flyer.description}`);
  console.log(`賣方開價：${flyer.salePriceYen / 10000} 萬円 | 面積：${flyer.areaSqm}㎡ | 格局：${flyer.layout}`);
  
  const analysis = buildSaleAnalysis(flyer as any);
  const m = analysis.mlitComparison;
  
  if (!m) {
    console.log("⚠️ 無法取得實價成約基準");
    continue;
  }
  
  console.log(`\n1. 基準與市場行情：`);
  console.log(`   - 國交省成交基準（同區同房型同屋齡帶・換算專有面積）：${m.areaBaselineMan} 萬円 (單價 ¥${m.medianSqmPriceYen?.toLocaleString()}/㎡)`);
  console.log(`   - 賣方開價相對成約基準溢價 (diffPercent)：${m.diffPercent >= 0 ? "+" : ""}${m.diffPercent}%`);
  console.log(`   - 市場同規模典型在售：${m.typicalListingPriceMan || "—"} 萬円 (區間: ${m.typicalListingPriceLowMan || "—"} ～ ${m.typicalListingPriceHighMan || "—"} 萬円)`);
  if (m.listingDiffPercent !== null && m.listingDiffPercent !== undefined) {
    console.log(`   - 賣方開價相對市場在售中位：${m.listingDiffPercent >= 0 ? "+" : ""}${m.listingDiffPercent}%`);
  }
  
  console.log(`\n2. 識別之官方加減價因子（共 ${m.priceFactors?.length || 0} 項）：`);
  (m.priceFactors || []).forEach(f => {
    const sign = f.ratePercent > 0 ? "+" : "";
    console.log(`   • [${f.label}] ${sign}${f.ratePercent}% (${f.basis === "data" ? "成約大數據" : "官方估價手冊"}) -> ${f.note}`);
  });
  
  const posSum = m.positiveFactorsSumPercent ?? 0;
  const netSum = m.netFactorsSumPercent ?? 0;
  console.log(`\n3. 優勢條件累計與開價溢價比對：`);
  console.log(`   - 正向優勢條件累計加成：+${posSum}%`);
  console.log(`   - 綜合條件淨加減幅率：${netSum >= 0 ? "+" : ""}${netSum}%`);
  console.log(`   - 賣方實際開價溢價率：${m.diffPercent >= 0 ? "+" : ""}${m.diffPercent}%`);
  
  const gap = Math.round((m.diffPercent - posSum) * 10) / 10;
  console.log(`   - 開價溢價與優勢加成落差：${gap >= 0 ? "+" : ""}${gap}%`);

  const factorsSumInsight = m.insightPoints?.find(p => p.id === "factors_sum");
  if (factorsSumInsight) {
    console.log(`\n4. 系統【條件累計分析】診斷評語：`);
    console.log(`   📢 [${factorsSumInsight.title}]`);
    console.log(`      ${factorsSumInsight.content}`);
  }
  console.log("");
}
