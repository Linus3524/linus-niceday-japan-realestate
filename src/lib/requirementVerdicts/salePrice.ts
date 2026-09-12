import { LAYOUT_AREA_BANDS, layoutBandMidArea } from "../../data/buyMarket.js";
import { type LayoutCode } from "../../data/housingMarket.js";
import {
reinsImpliedDiscountFromListingRate,
reinsNewListingPremiumRate,
} from "../../data/reinsSaleMarket.js";
import type { SaleListingBenchmark } from "../../data/saleListingMarket.js";
import type { UnitFeatureEvaluation } from "../listingExtraction.js";
import { man } from './shared.js';
import type { SalePriceFactor, SalePriceInsightPoint, SalePriceVerdict } from './types.js';


/**
 * 買賣開價合理度：把實價分桶中位數校準成「這一戶的預期價」再比較。
 *
 * 為什麼不能直接拿開價比中位數：
 * 分桶中位數是「該區、該房型、該面積帶」的成交中位「總價」，一個 ldk2 分桶
 * 涵蓋 45～75㎡，同分桶內最小與最大戶的合理總價可以差到六成以上。不先把面積
 * 拉齊就比，等於拿不同大小的房子互比；屋齡（日本中古折價極陡）與徒步分鐘
 * 同理，中位數把各種屋齡與距離全部混在一起。
 *
 * 校準兩步：
 * 1. 面積：用建立快照時的同一組面積帶中點當分桶代表面積，把中位總價換算成
 *    這一戶實際面積對應的價格（等同於改用單價比較，只是講法更直觀）。
 * 2. 條件：屋齡、徒步、樓層各自給一個相對基準的溢價／折價率再乘上去。
 *
 * 得到預期價後給一個容許區間，落在區間內才算合理——中位數本身是點估計，
 * 個別成交本來就會上下浮動，硬要求貼齊單一數字會把正常的物件判成異常。
 */
export function buildSalePriceVerdict(input: {
  salePriceYen: number;
  medianPriceYen: number;
  /** MLIT 成交紀錄直接算出的㎡單價；有同屋齡帶樣本時應傳該分層中位數。 */
  medianSqmPriceYen?: number | null;
  /** 該房型在該行政區的成交中位面積（㎡），用於將刊登在售開價校準至每㎡單價 */
  medianAreaSqm?: number | null;
  /** true 代表 medianSqmPriceYen 已控制本案屋齡，不再疊加手估屋齡係數。 */
  ageControlledByMarket?: boolean;
  /**
   * 同屋齡帶單價的取得範圍：
   * "layout" = 同區＋同房型＋同屋齡帶（最嚴謹）
   * "district" = 該房型的同屋齡帶樣本不足，改用同區同屋齡帶但「跨房型」合併
   * 兩者都會讓 ageControlledByMarket 為 true，但可信度不同，文案必須分開講。
   */
  ageBandScope?: "layout" | "area" | "adjacent_age" | "district" | null;
  layout: LayoutCode;
  areaSqm: number | null;
  ageYears: number | null;
  walkMinutes: number | null;
  floor: number | null;
  totalFloors: number | null;
  renovationNotes?: string;
  /** 圖紙上的現況欄（賃貸中／オーナーチェンジ／空室／居住中等），用來判斷是否為帶租約物件 */
  occupancyStatus?: string;
  /** 圖紙上的構造欄（RC／SRC），用來套用成交資料的構造溢價 */
  structureText?: string;
  /**
   * 來自國交省成交資料、已控制屋齡的條件溢價（%）。
   * 有值時優先於寫死的經驗值，並把 basis 標成 "data"。
   */
  conditionPremium?: {
    renovationPremiumPercent: number | null;
    structurePremiumPercent: number | null;
  } | null;
  /**
   * 本案所在町名相對同區行情的地段溢價（已控制屋齡）。
   * 行政區層級的比較會把一個區裡的好地段與差地段混在一起，這一項把差異挑出來。
   */
  townPremium?: {
    town: string;
    premiumPercent: number;
    sampleCount: number;
    rank: number;
    townCount: number;
  } | null;
  /**
   * 交通樞紐度與多站利用（如可徒步至中野、新宿等核心大站，或 2 站 3 路線利用可能）。
   */
  transitHub?: {
    hasMajorTerminal: boolean;
    majorStation: string | null;
    majorWalkMinutes: number | null;
    totalStations: number;
    totalLinesCount: number;
    ratePercent: number;
    note: string;
  } | null;
  /**
   * 帶租約物件的收益資訊：圖紙上的現行租金，以及同區同房型的市場租金行情。
   * 帶租約的成交價實質上由收益還原（年租金 ÷ 期待利回り）決定，
   * 所以租金比行情低多少，價格就該同幅往下調整。
   */
  tenantedIncome?: {
    /** 圖紙上的現行月租（或由年收入／表面利回換算） */
    monthlyRentYen: number;
    /**
     * 同區同房型的市場表面利回り。必須由「同一來源的租金 ÷ 同一來源的在售價」求得，
     * 跨來源相除（例如刊登租金 ÷ 實價登錄成交價）母體對不起來，會系統性高估。
     */
    marketGrossYieldRate: number | null;
    rentSourceLabel?: string | null;
  } | null;
  /** 該分桶的成交樣本數，用來決定結論該給多寬的容許區間 */
  sampleCount?: number | null;
  /** 同區公開刊登平均優先；缺值時才使用同區域 REINS 成約／新規登録比。 */
  listingBenchmark?: SaleListingBenchmark | null;
  /** 圖紙解析之單元格局與權利特徵（角部屋、朝向、露台、借地權等） */
  unitFeatures?: UnitFeatureEvaluation | null;
  /** 社區總戶數（用於評估規模效應：100戶以上大規模保值 vs 20戶以下小規模修繕風險） */
  totalUnits?: number | null;
  /** 大樓管理形態（全部委託／日勤／常駐 vs 自主管理） */
  managementStyle?: string | null;
  managementCompany?: string | null;
  /** 大樓設備或特記文字（用於辨識無電梯、可飼育寵物等） */
  buildingNotes?: string | null;
}): SalePriceVerdict {
  const { salePriceYen, medianPriceYen, layout, areaSqm, ageYears, walkMinutes, floor, totalFloors } = input;

  const factors: SalePriceFactor[] = [];
  const cautions: string[] = [];

  // ── 1. 面積校準 ──
  const bandMid = layoutBandMidArea(layout);
  const [bandMin, bandMax] = LAYOUT_AREA_BANDS[layout];
  // 面積落在分桶帶之外代表房型分桶本身就不太適用，這時不做線性外推，
  // 硬換算會把誤差放大；改用未校準中位數並在說明裡講清楚。
  const areaUsable = areaSqm !== null && areaSqm >= bandMin * 0.7 && areaSqm <= bandMax * 1.3;
  const areaAdjusted = areaUsable && areaSqm !== null;
  const areaBaseline = areaAdjusted && areaSqm !== null
    ? input.medianSqmPriceYen && input.medianSqmPriceYen > 0
      ? input.medianSqmPriceYen * areaSqm
      : medianPriceYen * (areaSqm / bandMid)
    : medianPriceYen;
  const areaBasisNote = areaAdjusted && areaSqm !== null
    ? input.medianSqmPriceYen && input.medianSqmPriceYen > 0
      ? `已用國交省成交㎡單價中位數直接換算本案 ${areaSqm}㎡，不再以房型面積帶中點近似。`
      : `已按專有面積校準：分桶代表面積約 ${bandMid}㎡，本案 ${areaSqm}㎡。`
    : areaSqm === null
      ? "圖紙未讀到專有面積，僅能比對分桶中位總價，精度較低。"
      : `本案 ${areaSqm}㎡ 落在 ${layout} 分桶採計範圍（${bandMin}～${bandMax}㎡）之外，未做面積換算。`;

  // ── 2. 屋齡（日本中古住宅價格對屋齡最敏感；基準為市場庫存主力 20～25 年）──
  let ageRate = 0;
  let ageHandledInBaseline = false;
  if (ageYears !== null) {
    if (input.ageControlledByMarket) {
      // 屋齡由基準本身控制，不是一個「調整」。列成 +0% 的因子會讓使用者
      // 以為系統沒考慮屋齡，但實際上它處理得比其他項都嚴謹（直接用同屋齡帶的
      // 實際成交單價）。改由 baselineNote 說明，不放進因子清單。
      ageHandledInBaseline = true;
    }
    else if (ageYears <= 3) { ageRate = 0.25; factors.push({ label: "屋齡", ratePercent: 25, note: `築 ${ageYears} 年（新築／準新築）`, applied: false, basis: "estimate" }); }
    else if (ageYears <= 5) { ageRate = 0.20; factors.push({ label: "屋齡", ratePercent: 20, note: `築 ${ageYears} 年（淺築新古屋）`, applied: false, basis: "estimate" }); }
    else if (ageYears <= 10) { ageRate = 0.12; factors.push({ label: "屋齡", ratePercent: 12, note: `築 ${ageYears} 年（10 年內）`, applied: false, basis: "estimate" }); }
    else if (ageYears <= 15) { ageRate = 0.06; factors.push({ label: "屋齡", ratePercent: 6, note: `築 ${ageYears} 年`, applied: false, basis: "estimate" }); }
    else if (ageYears <= 25) { ageRate = 0; factors.push({ label: "屋齡", ratePercent: 0, note: `築 ${ageYears} 年（中古主力屋齡，等同基準）`, applied: false, basis: "estimate" }); }
    else if (ageYears <= 30) { ageRate = -0.08; factors.push({ label: "屋齡", ratePercent: -8, note: `築 ${ageYears} 年`, applied: false, basis: "estimate" }); }
    else if (ageYears <= 40) { ageRate = -0.18; factors.push({ label: "屋齡", ratePercent: -18, note: `築 ${ageYears} 年（築古）`, applied: false, basis: "estimate" }); }
    else { ageRate = -0.28; factors.push({ label: "屋齡", ratePercent: -28, note: `築 ${ageYears} 年（高齡物件）`, applied: false, basis: "estimate" }); }

    // 1981 年 6 月前確認申請的舊耐震，除了折價還牽涉貸款與減稅資格。
    const oldQuakeStandardAge = new Date().getFullYear() - 1981;
    if (ageYears >= oldQuakeStandardAge) {
      cautions.push("屋齡推算可能屬於「舊耐震基準」（1981年6月以前）。舊耐震會影響銀行承貸成數與年限，也不能直接適用住宅ローン控除，需取得耐震基準適合証明。請向仲介確認確切的建築確認日期。");
    }
  }

  // ── 3. 車站徒步 ──
  //
  // 國交省成交資料的 TimeToNearestStation 欄位對中古マンション是 0% 有值
  // （實測東京 2025 年 16,353 筆全部空白），所以這裡無法用成交資料回歸，
  // 只能採用市場調查值。依東日本不動産流通機構／不動産流通業界的統計，
  // 以徒歩 1〜5 分為基準時，6〜10 分約 -7%、11〜15 分約 -20%、16 分以上約 -35%。
  // 本系統的比較基準是分桶中位數（混合各種站距，重心約在 6〜10 分），
  // 因此把上述級距整體平移，令 6〜10 分為 0。
  let walkRate = 0;
  if (walkMinutes !== null) {
    if (walkMinutes <= 3) { walkRate = 0.10; factors.push({ label: "車站距離", ratePercent: 10, note: `最近站徒步 ${walkMinutes} 分（極近站）`, applied: false, basis: "estimate" }); }
    else if (walkMinutes <= 5) { walkRate = 0.07; factors.push({ label: "車站距離", ratePercent: 7, note: `最近站徒步 ${walkMinutes} 分（近站）`, applied: false, basis: "estimate" }); }
    else if (walkMinutes <= 10) { walkRate = 0; factors.push({ label: "車站距離", ratePercent: 0, note: `最近站徒步 ${walkMinutes} 分（等同基準）`, applied: false, basis: "estimate" }); }
    else if (walkMinutes <= 15) { walkRate = -0.14; factors.push({ label: "車站距離", ratePercent: -14, note: `最近站徒步 ${walkMinutes} 分（略遠）`, applied: false, basis: "estimate" }); }
    else { walkRate = -0.30; factors.push({ label: "車站距離", ratePercent: -30, note: `最近站徒步 ${walkMinutes} 分（缺乏近站優勢）`, applied: false, basis: "estimate" }); }
  }

  // ── 3.5 交通樞紐與多線共構 ──
  // 除了最近站的步行時間，若本案在「熱門核心大站（如中野、新宿、澀谷等）」的步行圈內，
  // 或享有 2 站 3 路線以上的跨站選擇，具備顯著的通勤彈性與資產抗跌溢價。
  if (input.transitHub) {
    factors.push({
      label: "交通樞紐",
      ratePercent: input.transitHub.ratePercent,
      note: input.transitHub.note,
      applied: false,
      basis: "estimate",
    });
  }

  // ── 4. 樓層 ──
  //
  // 成交資料沒有階數欄位，改用市場調查值：一般公寓「每上升一層約 +0.5〜1.0%」，
  // 這裡取中間值 0.7%／層，並以該棟的中間樓層為基準（分桶中位數混合各樓層，
  // 重心接近中間樓層）。上下限各夾在 ±10%，避免超高層被單一係數放大。
  // 1 樓與地下另計固定折價（防犯、濕氣、採光），最上階另加稀少性溢價。
  let floorRate = 0;
  if (floor !== null) {
    if (floor <= 0) {
      floorRate = -0.08;
      factors.push({ label: "樓層", ratePercent: -8, note: "地下樓層（採光與濕氣條件受限）", applied: false, basis: "estimate" });
    } else if (floor === 1) {
      floorRate = -0.05;
      factors.push({ label: "樓層", ratePercent: -5, note: "1 樓（防犯與濕氣考量，日本市場普遍折價）", applied: false, basis: "estimate" });
    } else if (totalFloors !== null && totalFloors > 1) {
      const midFloor = (totalFloors + 1) / 2;
      const perFloor = 0.007;
      let rate = Math.max(-0.10, Math.min(0.10, (floor - midFloor) * perFloor));
      const isTop = floor >= totalFloors;
      if (isTop) rate = Math.min(0.13, rate + 0.03);
      floorRate = rate;
      const pct = Math.round(rate * 1000) / 10;
      factors.push({
        label: "樓層",
        ratePercent: pct,
        note: isTop
          ? `${floor} 樓／共 ${totalFloors} 樓（最上階，無樓上噪音與稀少性溢價）`
          : `${floor} 樓／共 ${totalFloors} 樓（以中間樓層為基準，每層約 0.7%）`,
        applied: false,
        basis: "estimate",
      });
    } else {
      // 沒有總樓層就無法判斷相對位置，只能確認「不是 1 樓或地下」。
      factors.push({ label: "樓層", ratePercent: 0, note: `${floor} 樓（缺總樓層，無法判斷相對高度）`, applied: false, basis: "estimate" });
    }
  }

  // ── 4.5 建物規模（塔樓）──
  // 樓層因素只反映「這一戶在樓內的位置」，但タワーマンション本身就是一個建物層級的
  // 溢價來源：結構規格、共用設施（門廳／健身房／管家）、地標性與稀少性。
  // 國交省分桶的中位單價把塔樓與一般低層公寓混在一起，不另外校準的話，
  // 塔樓一律會被判成「高於行情」。實測ファーストリアルタワー新宿（32 階建）
  // 只因 11F／32F 的位置比不高，就只拿到樓層 +2%，完全沒反映塔樓本身的價值。
  let towerRate = 0;
  if (totalFloors !== null && totalFloors >= 20) {
    towerRate = 0.08;
    factors.push({
      label: "建物規模",
      ratePercent: 8,
      note: `共 ${totalFloors} 層的塔式住宅（タワーマンション，設備規格與稀少性溢價）`,
      applied: false,
      basis: "estimate",
    });
  } else if (totalFloors !== null && totalFloors >= 15) {
    towerRate = 0.04;
    factors.push({
      label: "建物規模",
      ratePercent: 4,
      note: `共 ${totalFloors} 層的高層住宅`,
      applied: false,
      basis: "estimate",
    });
  }

  // ── 4.55 地段（町名）──
  // 同一個行政區裡，町與町的成交單價可以差到兩成以上（新宿区西新宿 vs 北新宿）。
  // 這個百分比在建快照時已控制屋齡與房型，代表的是地段本身而不是屋齡組成。
  if (input.townPremium) {
    const t = input.townPremium;
    const pct = Math.round(t.premiumPercent * 10) / 10;
    const isNeutral = Math.abs(pct) < 2;
    factors.push({
      label: "地段（町名）",
      ratePercent: pct,
      note: isNeutral
        ? `${t.town}在同區 ${t.townCount} 個町名中排第 ${t.rank} 名，成交單價等同全區平均水準（${pct >= 0 ? "+" : ""}${pct}%，${t.sampleCount} 筆成交）`
        : `${t.town}在同區 ${t.townCount} 個町名中排第 ${t.rank} 名，成交單價相對同區行情${pct >= 0 ? "高" : "低"} ${Math.abs(pct)}%（${t.sampleCount} 筆成交）`,
      applied: false,
      basis: "data",
    });
  }

  // ── 4.6 構造（SRC vs RC）──
  // 成交資料沒有階數，但有構造欄位。SRC 造與高層／塔式建物高度相關，
  // 是目前唯一能用實際成交資料反映「建物等級」的維度。
  // 這裡的百分比同樣已控制屋齡（未控制會得到 SRC 比較便宜的反向結果）。
  let structureRate = 0;
  const measuredStructure = input.conditionPremium?.structurePremiumPercent ?? null;
  if (measuredStructure !== null && /ＳＲＣ|SRC|鉄骨鉄筋|鉄骨[・･\s]*鉄筋|鋼骨鋼筋/i.test(input.structureText || "")) {
    const pct = Math.round(measuredStructure * 10) / 10;
    structureRate = pct / 100;
    factors.push({
      label: "建物構造",
      ratePercent: pct,
      note: `SRC造（鋼骨鋼筋混凝土）：同區同屋齡帶的 SRC 成交單價相對 RC ${pct >= 0 ? "高" : "低"} ${Math.abs(pct)}%`,
      applied: false,
      basis: "data",
    });
  }

  // ── 5. 翻新 ──
  let renoRate = 0;
  const reno = `${input.renovationNotes || ""}`.toLowerCase();
  // 這些樣式必須同時涵蓋日文與繁體中文：prompt 要求 renovationDetails
  // 「請翻譯為繁體中文」，所以這裡拿到的通常已經不是日文原文了。
  // 先前只寫日文關鍵字，實測ビューネ吉祥寺（整頁 RENOVATION PLAN、廚房浴室廁所
  // 洗面地板壁紙全換）只命中「浴室」「洗面」兩個中日共通詞，2 < 4 沒達門檻，
  // 翻新加成完全沒生效——而且畫面上不會顯示任何異常，是沉默失效。
  const renovationComponentCount = [
    /キッチン|廚房|厨房/,
    /浴室|ユニットバス/,
    /トイレ|廁所|洗手間/,
    /洗面/,
    /フローリング|フロアタイル|床.*貼替|木質地板|地板.*(?:重鋪|鋪設|更換|翻新)/,
    /クロス.*貼替|壁.*天井.*クロス|壁紙.*(?:重貼|更新|張替|重新)/,
    /給湯器|熱水器/,
    /建具|室內門|室内門/,
  ].filter(pattern => pattern.test(reno)).length;
  if (
    /リノベーション|リフォーム済|full renovation|フルリノベ|全面改装|内装(?:工事)?完成済/.test(reno)
    || /全面翻新|整體翻新|全室翻新|翻新完成|[內内]裝工事完成|裝修完成/.test(reno)
    || renovationComponentCount >= 4
  ) {
    // 翻新溢價與屋齡高度相關，固定 +5% 嚴重低估老屋翻新的價值。
    // 下列級距來自國交省成交資料的 Renovation 欄位（改装済み vs 未改装），
    // 東京 2025 年 15,978 筆、控制面積帶與屋齡帶後的實測中位數差：
    //   築 11-20 年：-0.9% ～ +7.7%（幾乎無差）
    //   築 21-30 年：+15.6% ～ +23.6%
    //   築 31-40 年：+37.5% ～ +41.3%
    // 取各屋齡帶的保守中間值。
    const measuredReno = input.conditionPremium?.renovationPremiumPercent ?? null;
    const renoPct = measuredReno !== null
      ? Math.round(measuredReno)
      : ageYears === null ? 8
        : ageYears <= 20 ? 4
        : ageYears <= 30 ? 18
        : 30;
    renoRate = renoPct / 100;
    factors.push({
      label: "翻新",
      ratePercent: renoPct,
      note: measuredReno !== null
        ? `圖紙標示已整體翻新／改裝（同區同屋齡帶的改裝済成交單價高出 ${renoPct}%）`
        : ageYears === null
          ? "圖紙標示已整體翻新／改裝"
          : `圖紙標示已整體翻新／改裝（築 ${ageYears} 年，屋齡越高翻新溢價越大）`,
      applied: false,
      basis: measuredReno !== null ? "data" : "estimate",
    });
  }

  // ── 5.1 角部屋（邊間住戶）──
  // 不動產流通推進中心（RETPC）《中古マンション価格査定マニュアル》手冊基準：角住戶 +3%～+5%；
  // 東京カンテイ百萬筆大數據實證：同棟大樓角部屋成交單價平均高出 +4.2%。
  if (input.unitFeatures?.isCornerUnit) {
    factors.push({
      label: "角部屋",
      ratePercent: 4,
      note: "角部屋（邊間住戶）：雙面採光通風佳、少一面鄰戶噪音干擾（不動產流通推進中心査定手冊基準 +3%～+5%，東京カンテイ實證溢價 +4.2%）",
      applied: false,
      basis: "estimate",
    });
  }

  // ── 5.2 陽台朝向（開口部方位）──
  // RETPC 査定手冊：南向/東南向 +3%～+5%，北向 -3%～-5%；
  // 東京カンテイ大數據：首都圈南北向公寓平均成交單價差 7%～9%。
  if (input.unitFeatures?.facingDirection) {
    const dir = input.unitFeatures.facingDirection;
    const zh = input.unitFeatures.facingDirectionZh || "南向";
    if (dir === "south" || dir === "southeast" || dir === "southwest") {
      factors.push({
        label: "陽台朝向",
        ratePercent: 3,
        note: `採光面朝向（${zh}）：日照時間長、冬暖夏涼受市場青睞（不動產流通推進中心査定手冊基準 +3%～+5%，東京カンテイ實證南北向價差 7%～9%）`,
        applied: false,
        basis: "estimate",
      });
    } else if (dir === "north" || dir === "northeast" || dir === "northwest") {
      factors.push({
        label: "陽台朝向",
        ratePercent: -3,
        note: `採光面朝向（${zh}）：冬季日照較短、採光受限（不動產流通推進中心査定手冊基準 -3%～-5%）`,
        applied: false,
        basis: "estimate",
      });
    }
  }

  // ── 5.3 專用露台 / 私人庭院 ──
  if (input.unitFeatures?.hasRoofBalcony) {
    factors.push({
      label: "專用露台",
      ratePercent: 5,
      note: "附設景觀露台（ルーフバルコニー）：具備私人戶外活動與開闊眺望空間，屬稀少性溢價配備（査定手冊基準 +3%～+5%）",
      applied: false,
      basis: "estimate",
    });
  } else if (input.unitFeatures?.hasPrivateGarden) {
    factors.push({
      label: "專用庭院",
      ratePercent: 3,
      note: "1 樓附設私人專用庭院（專用使用權加成，平衡低樓層之隱私考量）",
      applied: false,
      basis: "estimate",
    });
  }

  // ── 5.4 土地權利（借地權 vs 所有權）──
  // RETPC 査定手冊與市場慣例：借地權無土地所有權，折價約 -20%～-35%。
  if (input.unitFeatures?.isLeasehold) {
    const typeLabel = input.unitFeatures.leaseholdType || "借地權";
    factors.push({
      label: "土地權利",
      ratePercent: -25,
      note: `土地權利為${typeLabel}（非所有權）：每月需繳交地代、重建或讓渡需地主承諾名義書換料，市場折價約 -20%～-35%`,
      applied: false,
      basis: "estimate",
    });
    cautions.push(`本案土地權利為「${typeLabel}」，非完全所有權。買方須每月負擔地代，未來轉手承貸成數通常較所有權低 1～2 成，且借地期限屆滿或改建時需地主承諾，請務必詳閱重要事項說明書。`);
  }

  // ── 5.42 大樓管理體制（自主管理 vs 專業委託）──
  // 不動產流通推進中心査定手冊：「管理の良否」項目，全部委託日勤為基準，自主管理減點 -5%～-8%。
  const mgmtText = `${input.managementStyle || ""} ${input.managementCompany || ""} ${input.buildingNotes || ""}`;
  if (/自主管理/.test(mgmtText)) {
    factors.push({
      label: "管理體制",
      ratePercent: -5,
      note: "大樓為「自主管理」（無委託專業物業公司，住戶自行運作，銀行承貸嚴格且長期維護風險高，査定手冊折價約 -5%～-8%）",
      applied: false,
      basis: "estimate",
    });
  }

  // ── 5.44 電梯配置（3 樓以上無電梯）──
  // 不動產流通推進中心査定手冊：3 階以上エレベーター無住戶需逐層扣減使用效用比率。
  const isElevatorNone = /エレベーター無|EV無|無EV|エレベータ無/.test(input.buildingNotes || "");
  if (isElevatorNone && floor !== null && floor >= 3) {
    factors.push({
      label: "電梯配置",
      ratePercent: -6,
      note: `${floor} 樓且大樓未配置電梯（日常進出需爬梯，對長輩、重物不便，査定手冊折價約 -5%～-8%）`,
      applied: false,
      basis: "estimate",
    });
  }

  // ── 5.46 社區戶數規模（規模效應）──
  // 東京カンテイ實證統計：100 戶以上大規模社區公設與基金規模佳，保值溢價約 +3%；
  // 20 戶以下小規模社區每戶分攤修繕費沉重，市場折價約 -3%。
  if (input.totalUnits !== null && input.totalUnits !== undefined && input.totalUnits > 0) {
    if (input.totalUnits >= 100) {
      factors.push({
        label: "社區規模",
        ratePercent: 3,
        note: `總戶數 ${input.totalUnits} 戶之大規模社區（公設完備與長期修繕具規模經濟，東京カンテイ實證保值溢價約 +3%）`,
        applied: false,
        basis: "estimate",
      });
    } else if (input.totalUnits < 20) {
      factors.push({
        label: "社區規模",
        ratePercent: -3,
        note: `總戶數僅 ${input.totalUnits} 戶之小規模社區（每戶分攤外牆拉皮等重大修繕費用較沉重，市場折價約 -3%）`,
        applied: false,
        basis: "estimate",
      });
    }
  }

  // ── 5.48 寵物飼育（規約許可）──
  // 日本都會區約僅 35% 社區可飼養寵物，具流通稀少性優勢。
  if (/ペット飼育可|ペット可|ペット相談|小型犬/i.test(input.buildingNotes || "")) {
    factors.push({
      label: "寵物飼育",
      ratePercent: 2,
      note: "規約允許飼育寵物（都會區流通稀缺加分，轉手買盤與租客吸引力廣，市場溢價約 +2%）",
      applied: false,
      basis: "estimate",
    });
  }

  // ── 5.5 現況（帶租約 vs 空室）──
  // 國交省成交資料沒有「是否帶租約」這個欄位（實測 2024–2025 年東京 3 萬餘筆，
  // 只有 Use／Purpose 兩個用途欄位；以 Purpose≠住宅 當投資型買方的代理變數，
  // 控制行政區×面積帶×屋齡帶後價差中位數是 0.0%，證實它不是可用的代理）。
  // 所以這一項無法用成交資料回歸，幅度取業界慣例值。
  // 實價登錄的成交母體以「空室交屋、自住買方」為主，帶租約（オーナーチェンジ）物件
  // 本來就該比同一戶的空屋價低：買方無法自己入居、必須沿用現行租約與租金，
  // 融資多半只能走利率較高的投資用貸款，也不適用住宅ローン控除。
  // 反過來說，空室即入居可與翻新後販售的空屋，賣的正是自住買方的溢價。
  //
  // 折價幅度依房型分級，不用單一的 10%：
  // 業界慣例值是「約折 10%」（chiyodaku-mansion.net、musashi-corporation.com），
  // 但多個實務來源同時指出實際落差可到 20〜30%，且明講「ファミリータイプ比
  // ワンルーム 更難賣、折得更兇」（landnet.co.jp／fgh.co.jp）。
  // 理由在買方結構：1R・1K 的成交母體本來就以投資客為主，帶不帶租約的買方是同一群人，
  // 我們的比較基準（同區同房型的實價登錄中位數）本身就已經是投資盤的價格，
  // 再折 10% 等於重複扣一次；反之 2LDK 以上的母體以自住買方為主，
  // 帶租約會把買方限縮成投資客，折價才會拉到兩成上下。
  const occupancyDiscountByLayout: Record<LayoutCode, number> = {
    r1: -0.03, k1: -0.03, ldk1: -0.10, ldk2: -0.18, ldk3: -0.20,
  };
  let occupancyRate = 0;
  let incomeRate = 0;
  const occupancy = `${input.occupancyStatus || ""}`;
  const isTenanted = /賃貸中|オーナーチェンジ|賃借人|入居中|集金代行|サブリース/.test(occupancy);
  const isVacant = /空室|空家|空き|即入居|即引渡/.test(occupancy);
  if (isTenanted) {
    // 收益還原優先：帶租約的買方是投資客，出價來自「年租金 ÷ 市場表面利回り」。
    // 圖紙有現行租金時直接算得出來，比任何固定折價成數都貼近實情——
    // 租金比行情低一成，收益還原價就低一成，而固定成數看不出這件事。
    //
    // 市場表面利回り 一律用「At Home 同區同房型租金 ÷ At Home 同區同房型在售價」。
    // 兩邊同一個來源、同一套房型定義、都是刊登側資料，母體才對得起來。
    // （試過用「At Home 租金 ÷ 實價登錄成交價」，新宿區 1K 會算出 5.35%：
    //  租金中位描述的是較新較大的物件、成交中位卻是 20㎡ 的老投資盤，兩者不是同一批東西。
    //  同樣地也不能拿租金中位除以成交面積中位去比每㎡租金，會高估三成以上。）
    const income = input.tenantedIncome;
    const marketYield = income?.marketGrossYieldRate ?? null;
    const yieldUsable = marketYield !== null && marketYield >= 0.025 && marketYield <= 0.12;
    let incomeApplied = false;
    if (income && yieldUsable && income.monthlyRentYen > 0 && areaBaseline > 0) {
      const capitalizedYen = (income.monthlyRentYen * 12) / marketYield!;
      const raw = capitalizedYen / areaBaseline - 1;
      // 圖紙的租金欄偶爾會把年額寫進月租欄；夾在 ±25% 讓單一筆誤讀不會毀掉結論。
      incomeRate = Math.max(-0.25, Math.min(0.25, raw));
      incomeApplied = true;
      const subjectYield = (income.monthlyRentYen * 12) / salePriceYen;
      factors.push({
        label: "租約收益",
        ratePercent: Math.round(incomeRate * 1000) / 10,
        note: `現行租金 ${Math.round(income.monthlyRentYen).toLocaleString("ja-JP")} 円／月（本案開價的表面利回 ${
          (subjectYield * 100).toFixed(2)
        }%）。以同區同房型市場表面利回 ${(marketYield! * 100).toFixed(2)}% 收益還原，價值約 ${
          Math.round(capitalizedYen / 10000).toLocaleString()
        } 萬円`,
        applied: true,
        basis: "data",
      });
      if (Math.abs(raw) > 0.25) {
        cautions.push(
          `以現行租金收益還原的價值與成交基準相差 ${Math.round(Math.abs(raw) * 100)}%，已在估價中以 25% 為上限計入。` +
          `租金明顯${raw > 0 ? "高於" : "低於"}行情時，退租後的收益會${raw > 0 ? "下降" : "回升"}，請確認租約剩餘期間與退租後的預估租金。`
        );
      }
    }

    // 沒有租金可算時才退回依房型分級的固定折價：
    // 業界慣例值是「約折 10%」（chiyodaku-mansion.net、musashi-corporation.com），
    // 但多個實務來源同時指出實際落差可到 20〜30%，且明講「ファミリータイプ比
    // ワンルーム 更難賣、折得更兇」（landnet.co.jp／fgh.co.jp）。
    // 理由在買方結構：1R・1K 的成交母體本來就以投資客為主，帶不帶租約的買方是同一群人，
    // 比較基準（同區同房型的實價登錄中位數）本身就已經是投資盤的價格，再折 10% 是重複扣；
    // 2LDK 以上的母體以自住買方為主，帶租約把買方限縮成投資客，折價才會拉到兩成上下。
    occupancyRate = incomeApplied ? 0 : (occupancyDiscountByLayout[layout] ?? -0.10);
    const familyType = layout === "ldk2" || layout === "ldk3";
    const investorType = layout === "r1" || layout === "k1";
    factors.push({
      label: "現況",
      ratePercent: incomeApplied ? 0 : Math.round(occupancyRate * 1000) / 10,
      note: incomeApplied
        ? "帶租約（オーナーチェンジ）：買方無法自住入居、須承接現行租約，且多需投資用貸款、不適用住宅ローン控除。本案有現行租金，已改用上方的收益還原直接估算，不再另外套用固定折價成數"
        : `帶租約（オーナーチェンジ）：買方無法自住入居、須承接現行租約，且多需投資用貸款、不適用住宅ローン控除${
            familyType
              ? "。此房型的成交母體以自住買方為主，帶租約會把買方限縮成投資客，折價幅度明顯較大"
              : investorType
                ? "。此房型的成交母體本來就以投資買方為主，與比較基準的買方結構接近，折價幅度較小"
                : ""
          }`,
      applied: !incomeApplied,
      basis: "estimate",
    });
    cautions.push("帶租約物件的價格主要由現行租金與收益率決定，與空屋自住行情不同口徑。除了本頁的成交比對，請一併確認現行租約的租金水準、剩餘期間與退租後的預估租金。");
  } else if (isVacant) {
    factors.push({ label: "現況", ratePercent: 0, note: "空室即引渡（與實價登錄成交母體的主流口徑相同，不另外加減）", applied: true, basis: "estimate" });
  }

  // 預期價只用「資料算得出來的部分」：同區同房型同屋齡帶的成交㎡單價 × 本案面積，
  // 再乘上會改變比較口徑的修正（目前只有帶租約）。
  //
  // 徒步、樓層、翻新這些不乘進去：它們的百分比是業界經驗值不是回歸結果，
  // 而且比較基準本身就混合了各種徒步距離與樓層，再乘一次是重複計算。
  // 實測日本橋横山町一案，加了係數後預期價 10,196 萬（開價低 21.5%），
  // 只用資料是 8,790 萬（開價低 9%），而 At Home 同區同房型的公開開價平均
  // 8,320 萬（開價低 3.8%）——兩條獨立的資料路徑彼此接近，加了係數的版本明顯偏離。
  // 兩項相乘而不是相加：買方結構的折價與租金水準的折價作用在不同的基準上。
  const appliedRate = Math.max(-0.4, Math.min(0.5, (1 + occupancyRate) * (1 + incomeRate) - 1));
  const expectedPriceYen = areaBaseline * (1 + appliedRate);

  // 面積校準過的預期價較可信，容許區間可以收窄；沒校準時放寬，
  // 否則等於用一個本來就不精準的基準去做精準的指控。
  // 樣本少的分桶，中位數本身就不穩定（快照的採計下限只有 5 筆）。
  // 這種情況要放寬容許區間——否則等於拿一個抖動很大的基準去做精確的指控，
  // 讓使用者誤以為結論的可信度跟樣本充足的地區一樣高。
  const sampleCount = input.sampleCount ?? null;
  const samplePenalty = sampleCount === null ? 0.03 : sampleCount >= 30 ? 0 : sampleCount >= 15 ? 0.03 : 0.06;
  if (sampleCount !== null && sampleCount < 15) {
    cautions.push(`同條件成交樣本僅 ${sampleCount} 筆，中位數易受個別物件影響，建議對照實際在售物件。`);
  }
  const tolerance = (areaAdjusted ? 0.15 : 0.22) + samplePenalty;
  const fairLow = expectedPriceYen * (1 - tolerance);
  const fairHigh = expectedPriceYen * (1 + tolerance);

  const diffPercent = Math.round(((salePriceYen - expectedPriceYen) / expectedPriceYen) * 1000) / 10;
  const rawDiffPercent = Math.round(((salePriceYen - medianPriceYen) / medianPriceYen) * 1000) / 10;

  // ── 6. 公開販售市場第二基準（同規模在售行情） ──
  const listingBenchmark = input.listingBenchmark ?? null;
  const listingPremiumRate = listingBenchmark?.kind === "reins_ratio"
    ? reinsNewListingPremiumRate(listingBenchmark)
    : null;

  let typicalListingPriceYen: number | null = null;
  let typicalListingPriceLowYen: number | null = null;
  let typicalListingPriceHighYen: number | null = null;
  let listingRangeLabel: string | null = null;

  if (listingBenchmark?.kind === "public_listing_average") {
    const rawAvgYen = listingBenchmark.averageListingPriceYen;
    if (areaAdjusted && areaSqm !== null && areaSqm > 0) {
      // 依本案專有面積與屋齡校準在售開價行情：
      // 1. 取得該房型在該區的代表面積（優先採用國交省成交中位面積，無則採用房型面積帶中點）
      const refAreaSqm = (input.medianAreaSqm && input.medianAreaSqm > 0)
        ? input.medianAreaSqm
        : layoutBandMidArea(layout);

      // 2. 換算 At Home 每㎡刊登開價，並依本案實際面積換算總價
      const askingSqmPrice = rawAvgYen / refAreaSqm;
      let calibratedAskYen = askingSqmPrice * areaSqm;

      // 3. 若有同屋齡帶成交單價，按屋齡相對大盤的價格比率微調
      if (input.ageControlledByMarket && input.medianSqmPriceYen && input.medianSqmPriceYen > 0) {
        const overallSqmPrice = (input.medianPriceYen && refAreaSqm > 0)
          ? (input.medianPriceYen / refAreaSqm)
          : null;
        if (overallSqmPrice && overallSqmPrice > 0) {
          const ageRatio = Math.max(0.7, Math.min(1.4, input.medianSqmPriceYen / overallSqmPrice));
          calibratedAskYen *= ageRatio;
        }
      }

      // 4. 上限：都會區新規開價常態溢價率（賣方開價通常較成交基準高出約 18% 作為議價與利潤空間）
      const askCeilingYen = expectedPriceYen * 1.18;

      typicalListingPriceLowYen = Math.round(Math.min(calibratedAskYen, askCeilingYen));
      typicalListingPriceHighYen = Math.round(Math.max(calibratedAskYen, askCeilingYen));
      typicalListingPriceYen = Math.round((typicalListingPriceLowYen + typicalListingPriceHighYen) / 2);
      listingRangeLabel = `${man(typicalListingPriceLowYen)}～${man(typicalListingPriceHighYen)}`;
    } else {
      typicalListingPriceYen = rawAvgYen;
      typicalListingPriceLowYen = Math.round(rawAvgYen * 0.95);
      typicalListingPriceHighYen = Math.round(rawAvgYen * 1.05);
      listingRangeLabel = `${man(typicalListingPriceLowYen)}～${man(typicalListingPriceHighYen)}`;
    }
  } else if (listingBenchmark?.kind === "reins_ratio" && listingPremiumRate !== null) {
    typicalListingPriceYen = expectedPriceYen * (1 + listingPremiumRate);
    typicalListingPriceLowYen = Math.round(expectedPriceYen * (1 + listingPremiumRate * 0.85));
    typicalListingPriceHighYen = Math.round(expectedPriceYen * (1 + listingPremiumRate * 1.15));
    listingRangeLabel = `${man(typicalListingPriceLowYen)}～${man(typicalListingPriceHighYen)}`;
  }

  const listingDiffPercent = typicalListingPriceYen === null
    ? null
    : Math.round(((salePriceYen - typicalListingPriceYen) / typicalListingPriceYen) * 1000) / 10;
  const listingVerdict = listingDiffPercent === null
    ? null
    : listingDiffPercent < -10
      ? "below" as const
      : listingDiffPercent > 10
        ? "above" as const
        : "typical" as const;
  const listingVerdictText = listingVerdict === "below"
    ? "低於市場在售行情"
    : listingVerdict === "above"
      ? "高於市場在售行情"
      : listingVerdict === "typical"
        ? "落在市場在售區間"
        : null;

  const toMan = (v: number) => Math.round(v / 10000);
  const factorSummary = factors.length
    ? factors.map(f => `${f.label} ${f.ratePercent >= 0 ? "+" : ""}${f.ratePercent}%`).join("、")
    : "圖紙未讀到可校準的條件";

  let verdict: "bargain" | "fair" | "premium";
  let verdictText: string;
  let explanation: string;

  const points: string[] = [];
  const insightPoints: SalePriceInsightPoint[] = [];

  // 1. 行情落點與合理區間
  const areaCalcPhrase = areaAdjusted && areaSqm !== null
    ? `按本案實際面積（${areaSqm}㎡）換算`
    : "以該房型中位數為基準";

  if (salePriceYen < fairLow) {
    verdict = "bargain";
    verdictText = "低於市場客觀試算區間";
    const content = `同區同房型的合理成交區間 ${man(fairLow)}～${man(fairHigh)}（基準 ${man(expectedPriceYen)}）。本案開價 ${man(salePriceYen)}，低於區間 ${Math.abs(diffPercent)}%。`;
    insightPoints.push({
      id: "verdict",
            tag: "行情落點",
      title: "開價低於市場客觀試算區間",
      content,
      type: "verdict",
    });
    points.push(`• 【實價行情落點】：${content}`);
  } else if (salePriceYen <= fairHigh) {
    verdict = "fair";
    verdictText = "落在市場客觀試算區間";
    const content = `同區同房型的合理成交區間 ${man(fairLow)}～${man(fairHigh)}（基準 ${man(expectedPriceYen)}）。本案開價 ${man(salePriceYen)}，落在區間內。`;
    insightPoints.push({
      id: "verdict",
            tag: "行情落點",
      title: "開價落在市場客觀試算區間",
      content,
      type: "verdict",
    });
    points.push(`• 【實價行情落點】：${content}`);
  } else {
    verdict = "premium";
    verdictText = "高於市場客觀試算區間";
    const content = `同區同房型的合理成交區間 ${man(fairLow)}～${man(fairHigh)}（基準 ${man(expectedPriceYen)}）。本案開價 ${man(salePriceYen)}，高出 ${diffPercent}%。此差距已扣除屋齡、車站與樓層的合理溢價。`;
    insightPoints.push({
      id: "verdict",
            tag: "行情落點",
      title: "開價高於市場客觀試算區間",
      content,
      type: "verdict",
    });
    points.push(`• 【實價行情落點】：${content}`);
  }

  // 2. 條件加權與溢價拆解
  if (factors.length > 0) {
    const factorContent = `已計入：${factorSummary}。${diffPercent > 0 ? "上述價差是扣除這些條件後的結果。" : ""}`.trim();
    insightPoints.push({
      id: "factor",
            tag: "條件加權",
      title: "",
      content: factorContent,
      type: "factor",
    });
    points.push(
      diffPercent > 0
        ? `• 【條件溢價拆解】：${factorContent}`
        : `• 【條件優勢對應】：${factorContent}`
    );
  }

  // 3. 市面公開刊登對照
  if (listingBenchmark?.kind === "public_listing_average" && typicalListingPriceYen !== null && listingDiffPercent !== null) {
    const rangeText = (typicalListingPriceLowYen && typicalListingPriceHighYen && typicalListingPriceLowYen !== typicalListingPriceHighYen)
      ? `（區間約 ${man(typicalListingPriceLowYen)}～${man(typicalListingPriceHighYen)}）`
      : "";
    const ceilingDiff = typicalListingPriceHighYen && salePriceYen > typicalListingPriceHighYen
      ? `，高於區間上限約 ${Math.round(((salePriceYen - typicalListingPriceHighYen) / typicalListingPriceHighYen) * 1000) / 10}%`
      : "";
    const content = `${listingBenchmark.scopeLabel}在售同規模行情約 ${man(typicalListingPriceYen)}${rangeText}，本案相對中位${listingDiffPercent >= 0 ? "高" : "低"} ${Math.abs(listingDiffPercent)}%${ceilingDiff}。基準已按本案面積與條件校準，刊登價非成交價，僅供參考。`;
    insightPoints.push({
      id: "market",
      tag: "在售對照",
      title: `在售同規模行情：約 ${man(typicalListingPriceYen)}${rangeText}`,
      content,
      type: "market",
    });
    points.push(`• 【市面刊登對照】：${content}`);
  } else if (listingBenchmark?.kind === "reins_ratio" && typicalListingPriceYen !== null && listingDiffPercent !== null) {
    const premiumPercent = Math.round(listingPremiumRate! * 1000) / 10;
    const discountPercent = Math.round(reinsImpliedDiscountFromListingRate(listingBenchmark) * 1000) / 10;
    const rangeText = (typicalListingPriceLowYen && typicalListingPriceHighYen)
      ? `（區間約 ${man(typicalListingPriceLowYen)}～${man(typicalListingPriceHighYen)}）`
      : "";
    const content = `${listingBenchmark.market}新規開價㎡單價高於成約 ${premiumPercent}%，換算典型開價約 ${man(typicalListingPriceYen)}${rangeText}，本案${listingDiffPercent >= 0 ? "高" : "低"} ${Math.abs(listingDiffPercent)}%。此為市場平均差距，不代表本案可議相同幅度。`;
    insightPoints.push({
      id: "market",
      tag: "在售對照",
      title: `REINS 市場新規開價基準：約 ${man(typicalListingPriceYen)}${rangeText}`,
      content,
      type: "market",
    });
    points.push(`• 【市面刊登對照】：${content}`);
  } else {
    const content = "此地區沒有同口徑的在售統計，僅呈現官方成交行情。";
    insightPoints.push({
      id: "market",
      tag: "在售對照",
      title: "在售對照",
      content,
      type: "market",
    });
    points.push(`• 【市面刊登對照】：${content}`);
  }

  const positiveFactorsSumPercent = Math.round(
    factors.filter(f => f.ratePercent > 0).reduce((sum, f) => sum + f.ratePercent, 0) * 10
  ) / 10;
  const netFactorsSumPercent = Math.round(
    factors.reduce((sum, f) => sum + f.ratePercent, 0) * 10
  ) / 10;

  if (factors.length > 0 && positiveFactorsSumPercent > 0) {
    let factorsEvaluationText = "";
    if (diffPercent > 0) {
      if (Math.abs(diffPercent - positiveFactorsSumPercent) <= 10) {
        factorsEvaluationText = `本案個別優勢條件（如翻新、站距、樓層、角部屋、朝向等）加總影響幅度達 +${positiveFactorsSumPercent}%，與賣方開價相對同區同屋齡基準的溢價幅度（高於基準 ${diffPercent}%）高度吻合。這代表賣方開價具備客觀條件支撐，非隨意開高。`;
      } else if (diffPercent > positiveFactorsSumPercent + 15) {
        factorsEvaluationText = `本案各項優勢條件加總幅度為 +${positiveFactorsSumPercent}%，但賣方開價高於同區同屋齡基準 ${diffPercent}%（超出客觀優勢支撐約 ${Math.round((diffPercent - positiveFactorsSumPercent) * 10) / 10}%）。開價有測試市場水溫傾向，建議保留議價空間。`;
      } else {
        factorsEvaluationText = `本案優勢條件加總幅度為 +${positiveFactorsSumPercent}%，賣方開價高於同區同屋齡基準 ${diffPercent}%，各項優勢可充分支撐開價落點。`;
      }
    } else {
      factorsEvaluationText = `本案開價低於同區同屋齡基準 ${Math.abs(diffPercent)}%（本案條件加總淨值為 ${netFactorsSumPercent >= 0 ? "+" : ""}${netFactorsSumPercent}%），${
        renoRate > 0
          ? "且已包含室內翻新加成，開價具備讓利優勢與性價比。"
          : ageYears && ageYears >= 30
            ? "主要反映未整體翻新之屋況折讓，留出預算空間供買方自行裝修。"
            : "開價具備價格優勢。"
      }`;
    }

    insightPoints.push({
      id: "factors_sum",
      tag: "條件累計分析",
      title: `優勢條件累計 +${positiveFactorsSumPercent}% vs 開價落點（${diffPercent >= 0 ? `高於基準 ${diffPercent}%` : `低於基準 ${Math.abs(diffPercent)}%`}）`,
      content: factorsEvaluationText,
      type: "advice",
    });
    points.push(`• 【條件累計與開價分析】：${factorsEvaluationText}`);
  }

  explanation = points.join("\n\n");

  return {
    verdict,
    verdictText,
    explanation,
    insightPoints,
    diffPercent,
    rawDiffPercent,
    expectedPriceMan: toMan(expectedPriceYen),
    areaBaselineMan: toMan(areaBaseline),
    fairLowMan: toMan(fairLow),
    fairHighMan: toMan(fairHigh),
    typicalListingPriceMan: typicalListingPriceYen === null ? null : toMan(typicalListingPriceYen),
    typicalListingPriceLowMan: typicalListingPriceLowYen === null ? null : toMan(typicalListingPriceLowYen),
    typicalListingPriceHighMan: typicalListingPriceHighYen === null ? null : toMan(typicalListingPriceHighYen),
    listingRangeLabel,
    listingDiffPercent,
    listingVerdict,
    listingVerdictText,
    listingPremiumRatePercent: listingPremiumRate === null ? null : Math.round(listingPremiumRate * 1000) / 10,
    impliedDiscountFromListingPercent: listingBenchmark?.kind === "reins_ratio"
      ? Math.round(reinsImpliedDiscountFromListingRate(listingBenchmark) * 1000) / 10
      : null,
    listingBenchmarkPeriod: listingBenchmark?.period ?? null,
    listingBenchmarkSourceUrl: listingBenchmark?.sourceUrl ?? null,
    listingBenchmarkSourceLabel: listingBenchmark?.sourceLabel ?? null,
    listingBenchmarkKind: listingBenchmark?.kind ?? null,
    listingBenchmarkScopeLabel: listingBenchmark?.scopeLabel ?? null,
    areaAdjusted,
    areaBasisNote,
    baselineNote: ageHandledInBaseline && ageYears !== null
      ? input.ageBandScope === "area"
        ? `比較基準已鎖定同屋齡帶：本案築 ${ageYears} 年。該房型的同屋齡帶成交樣本不足，改採同區、同屋齡帶中「面積相近」房型的成交㎡單價，屋齡不再另外加權。`
        : input.ageBandScope === "adjacent_age"
          ? `本案築 ${ageYears} 年，該屋齡帶成交樣本不足，改採同區、同房型的相鄰屋齡帶成交㎡單價，屋齡不再另外加權。`
          : input.ageBandScope === "district"
            ? `比較基準已鎖定同屋齡帶：本案築 ${ageYears} 年。該房型的同屋齡帶成交樣本不足，改採同區、同屋齡帶但合併各房型的成交㎡單價，屋齡不再另外加權；房型差異未另外校準。`
            : `比較基準已鎖定同屋齡帶：本案築 ${ageYears} 年，採用同區、同房型、同屋齡帶的實際成交㎡單價，屋齡不再另外加權。`
      : ageYears !== null
        ? `該區該房型缺少同屋齡帶的足量成交樣本，屋齡改以市場行情推估，僅供參考。`
        : "圖紙未讀到築年，無法就屋齡調整比較基準。",
    ageHandledInBaseline,
    factors,
    positiveFactorsSumPercent,
    netFactorsSumPercent,
    cautions,
  };
}
