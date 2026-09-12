import type { SaleListingBenchmark } from "../../data/saleListingMarket.js";


/**
 * 需求可行性判斷。
 *
 * 這裡刻意「不看推薦車站的預算落點」來決定可行性——推薦清單本身就以貼近預算排序，
 * 拿它回頭證明預算合理是循環論證。改為針對使用者自己指定的範圍重新估價。
 */

export type AxisStatus = "符合" | "部分符合" | "需調整" | "待確認" | "難度高";

export interface AxisVerdict {
  key: string;
  label: string;
  /** 使用者這次實際輸入的條件；沒輸入就是 null，整列不顯示。 */
  detail: string | null;
  status: AxisStatus;
  /** 一句結論，先講答案。 */
  headline: string;
  /** 造成這個結論的主因，最多兩條。 */
  drivers: string[];
  /** 具體下一步；沒有明確動作時留空。 */
  nextStep?: string;
  /** 對房源數量的壓縮程度 0～3，用於疊加判斷整體可行性。 */
  supplyImpact: number;
  /**
   * status 為「待確認」時，說明是哪一種待確認。
   *
   * 同一個軸可能因為不同原因無法判斷，而整體結論要給對應的下一步：
   * 「沒填預算」要叫使用者補預算，「地區查無行情」叫他補預算沒有意義——
   * 他明明填了，只會反覆重填一個已經填好的欄位。
   */
  pendingReason?: "missing-input" | "no-market-data";
}

export type AxisImpactLevel = "容易達成" | "需要取捨" | "較難兼顧" | "待補資料";

export type OverallLevel = "可行" | "有條件可行" | "難度高" | "資料不足";

export interface OverallVerdict {
  level: OverallLevel;
  headline: string;
  reasons: string[];
  loosenFirst?: string;
  /** 尚未補齊的評估面向。與難度分開顯示，避免把未知誤當成容易。 */
  pendingLabels?: string[];
}

/** 針對「使用者指定的範圍」重新估價，完全不參考推薦清單。 */
export interface RequestedRentRange {
  low: number;
  median: number;
  high: number;
  sampleCount: number;
  /** 估價基準的說法，用於文案。 */
  basis: string;
  /** 各行政區各自的估價，依中位由低到高排序。 */
  segments: RentSegment[];
  /**
   * 樣本橫跨互不重疊的價位帶時為 true。
   *
   * 這種情況下 low／median／high 這組百分位是「假精確」——把 4 個行情差一倍的
   * 行政區混在一起取百分位，得到的中間值對應不到任何真實地點：中位可能是練馬的
   * 價，低端卻是所澤的價。使用者看到「只差 1%」會以為加一點錢就有，實際上那個
   * 低端在他不想住的地方。所以 true 時文案要改成分段講，不要給單一區間。
   */
  spread: boolean;
  sourceUrl?: string;
  sourceLabel?: string;
  sourceDate?: string;
}

export interface RentSegment {
  district: string;
  low: number;
  median: number;
  high: number;
}

export type ListingVerdictStatus =
  | "合理"
  | "超值"
  | "條件反映"
  | "偏高"
  | "明顯偏高"
  | "待確認"
  | AxisStatus;

export interface ListingPriceVerdictContext {
  ageYears?: number | null;
  walkMinutes?: number | null;
  areaSqm?: number | null;
  roomType?: string | null;
  structure?: string | null;
  floor?: number | null;
  totalFloors?: number | null;
  specialNotes?: string;
  otherConditions?: string;
  freeRent?: string;
  facilities?: string;
}

export interface RentalPriceFactor {
  label: string;
  ratePercent: number;
  monthlyYen?: number;
  note: string;
  level: number;
  category: "space" | "amenity" | "location" | "age" | "structure" | "floor" | "internet";
}

export interface ListingPriceVerdict {
  status: ListingVerdictStatus;
  headline: string;
  detail: string;
  factors?: RentalPriceFactor[];
  positiveFactorsSumPercent?: number;
  negativeFactorsSumPercent?: number;
  netFactorsSumPercent?: number;
  nominalDiffPercent?: number;
}

/**
 * 判斷「這個物件的租金＋管理費」相對所在地區行情是高是低，供圖紙健檢功能使用。
 *
 * 採用綜合多因子校準模型（Multi-Factor Real Estate Appraisal）：
 * 不盲目以名目租金硬套區域均價，而是綜合考量：
 * 1. 屋齡（築年數／新築・淺築・中古溢折價）
 * 2. 車站距離（徒步分鐘數溢折價）
 * 3. 專有面積（單身套房大坪數空間優勢）
 * 4. 高價值設備（免費高速網路每月實質節省、衛浴分離、獨立洗面台、自動鎖防犯、RC構造等）
 *
 * 診斷狀態使用不動產實務自然詞彙：
 * 「合理」「超值」「條件反映（合理品質溢價）」「偏高」「明顯偏高」「待確認」
 */
export interface SalePriceFactor {
  label: string;
  ratePercent: number;
  note: string;
  /**
   * 這一項有沒有真的乘進預期價。
   *
   * 只有「修正比較口徑」的項目才會套用（例如帶租約物件與實價登錄的自住成交
   * 根本不是同一種買賣）。徒步、樓層、翻新這類「品質溢價」一律不套用——
   * 它們的百分比是業界經驗值不是回歸結果，而且比較基準（同區同房型同屋齡帶的
   * 成交中位數）本身就已經混合了各種徒步距離與樓層，再乘一次等於重複計算。
   * 這些項目改成純參考資訊呈現。
   */
  applied: boolean;
  /** data＝來自實際成交資料；estimate＝業界經驗值，無法用現有資料驗證 */
  basis: "data" | "estimate";
}

export interface SalePriceInsightPoint {
  id: string;
  tag: string;
  title: string;
  content: string;
  type: "verdict" | "factor" | "market" | "advice";
}

export interface SalePriceVerdict {
  verdict: "bargain" | "fair" | "premium";
  verdictText: string;
  explanation: string;
  insightPoints: SalePriceInsightPoint[];
  /** 相對「經條件校準後的預期價」的價差 */
  diffPercent: number;
  /** 相對「未校準的分桶中位總價」的價差，保留舊口徑供對照 */
  rawDiffPercent: number;
  expectedPriceMan: number;
  /** 面積校準後、尚未套入本案條件係數的市場基準（＝成交㎡單價 × 本案面積）。 */
  areaBaselineMan: number;
  fairLowMan: number;
  fairHighMan: number;
  /** 公開刊登平均，或 REINS 新規登録口徑換算的市場典型開價。 */
  typicalListingPriceMan: number | null;
  /** 同規模在售行情區間下限 */
  typicalListingPriceLowMan?: number | null;
  /** 同規模在售行情區間上限 */
  typicalListingPriceHighMan?: number | null;
  /** 同規模在售行情區間文字標籤，例如 "5,300～5,645 萬円" */
  listingRangeLabel?: string | null;
  listingDiffPercent: number | null;
  listingVerdict: "below" | "typical" | "above" | null;
  listingVerdictText: string | null;
  listingPremiumRatePercent: number | null;
  impliedDiscountFromListingPercent: number | null;
  listingBenchmarkPeriod: string | null;
  listingBenchmarkSourceUrl: string | null;
  listingBenchmarkSourceLabel: string | null;
  listingBenchmarkKind: SaleListingBenchmark["kind"] | null;
  listingBenchmarkScopeLabel: string | null;
  areaAdjusted: boolean;
  areaBasisNote: string;
  /** 比較基準是怎麼挑的（屋齡是否已由基準控制） */
  baselineNote: string;
  ageHandledInBaseline: boolean;
  factors: SalePriceFactor[];
  /** 所有正向優勢條件（如翻新、近站、頂樓、角部屋、南向等）加總幅度（%） */
  positiveFactorsSumPercent: number;
  /** 所有條件（含折價與溢價）加總淨幅度（%） */
  netFactorsSumPercent: number;
  cautions: string[];
}
