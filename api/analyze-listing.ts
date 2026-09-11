import { additionalRentalFees, type RentalConditionFields } from "../src/lib/rentalConditions.js";
import { reconcileRentalListingText } from "../src/lib/rentalListingReconciliation.js";
import { auditKeys, buildListingAudit, type AuditFields } from "../src/lib/listingAudit.js";
import { GoogleGenAI, Type } from "@google/genai";
import { buildSpecialSaleDetails, reconcileSpecialSaleFields, saleOccupancy, statedCombinedAnnualPropertyTax, statedAnnualPropertyTax, type SpecialSaleFields } from "../src/lib/specialSaleAnalysis.js";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { resolveSearchScope, estimateRequestedRent, buildListingPriceVerdict, buildSalePriceVerdict, type RequestedRentRange } from "../src/lib/requirementVerdict.js";
import { evaluateTransitHub } from "../src/lib/transitParser.js";
import {
  parseYenAmount,
  parseNonNegativeYenAmount,
  parseMonthsOrYen,
  normalizeRoomType,
  stripStationOperatorPrefix,
  parseArea,
  normalizeStructure,
  parseGuaranteeFee,
  formatShikibiki,
  isFreeOrZero,
  hasExplicitZeroLeaseCharge,
  parseSalePrice,
  parseUnitsCount,
  parseYieldRate,
  computeTsuboAndSqmPrice,
  assessRepairReserve,
  calculateNetYieldBreakdown,
  calculateSaleInitialCosts,
  assessRealEstateAcquisitionTax,
  parseAgeYears,
  parseFloorInfo,
  parseMandatoryMonthlyFees,
  parseEffectiveRepairReserve,
  assessMortgageTaxDeduction,
  detectBuildingSpecialNotes,
  detectUnitFeatures,
} from "../src/lib/listingExtraction.js";
import { getAgeBandComparison, getConditionPremium, getOfficialBuyEstimate, getTownPremium } from "../src/data/buyMarket.js";
import { mlitBuySnapshotMeta, mlitBuySnapshots } from "../src/data/mlitBuySnapshot.js";
import { atHomeNationwideRentSnapshots } from "../src/data/atHomeNationwideRentSnapshot.js";
import { getNationwideRentBenchmark } from "../src/data/nationwideRentMarket.js";
import { getSaleListingBenchmark } from "../src/data/saleListingMarket.js";
import { districtStations, rentRates } from "../src/data/housingMarket.js";
import { toJapaneseStationName } from "../src/lib/transit.js";
import { recordUsage, requestCountry } from "../src/lib/usageMetrics.js";
import { ROOM_TYPE_DETAIL_LABEL, type RentSearchCriteria } from "../src/lib/rentAnalysis.js";
import type { LayoutCode } from "../src/data/housingMarket.js";

/**
 * 物件圖紙健檢：上傳仲介提供的物件概要書／図面圖片或 PDF，
 * 支援「租賃圖紙」與「買賣圖紙」，自動萃取結構化欄位並與行情、持有成本及法規健檢比對。
 */

const MAX_FILES = 3;
const MAX_TOTAL_IMAGE_BYTES = 3 * 1024 * 1024;
// 前端依座標還原的版面文字長度上限，需與 ListingHealthCheck 的設定一致。
const MAX_LAYOUT_TEXT_CHARS = 6000;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/gif",
  "image/bmp",
  "image/tiff",
  "image/avif",
  "application/pdf",
]);

// 頻率限制的唯一來源：改這兩個常數即可，視窗字串與錯誤訊息都由此推導，
// 避免像先前那樣改了視窗卻忘了改文案（訊息仍寫「每 5 分鐘」）。
const LISTING_CHECK_RATE_LIMIT = 5;
const LISTING_CHECK_RATE_WINDOW_MINUTES = 10;
const LISTING_CHECK_RATE_WINDOW_MS = LISTING_CHECK_RATE_WINDOW_MINUTES * 60_000;
const LISTING_CHECK_RATE_MESSAGE =
  `物件健檢每 ${LISTING_CHECK_RATE_WINDOW_MINUTES} 分鐘最多使用 ${LISTING_CHECK_RATE_LIMIT} 次，請稍候再試。`;
const listingCheckRateBuckets = new Map<string, { count: number; resetAt: number }>();

const upstashListingCheckLimiter =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(LISTING_CHECK_RATE_LIMIT, `${LISTING_CHECK_RATE_WINDOW_MINUTES * 60} s`),
        prefix: "linus-listing-check",
      })
    : null;

let aiClient: GoogleGenAI | null = null;

function getAiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is missing from Vercel environment variables.");
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

/**
 * 取得可信任的來源 IP。
 *
 * x-forwarded-for 的最左邊是「客戶端自己宣稱的」位址，任何人都能偽造；
 * 直接拿它當限流鍵，等於只要每次換一個假 IP 就能無限呼叫（實測可行）。
 * 代理層（Vercel）會把真實位址「附加在最後」，所以：
 *   1. 優先用 Vercel 自己算好的 x-vercel-forwarded-for / x-real-ip（客戶端蓋不掉）
 *   2. 退回 x-forwarded-for 時取最後一段，而不是第一段
 *   3. 都沒有才用 socket 位址
 */
function resolveClientIp(req: any): string {
  const pick = (value: unknown) => {
    const text = String(value ?? "").trim();
    return text ? text : null;
  };
  const trusted = pick(req?.headers?.["x-vercel-forwarded-for"]) || pick(req?.headers?.["x-real-ip"]);
  if (trusted) return trusted.split(",").pop()!.trim();

  const forwarded = pick(req?.headers?.["x-forwarded-for"]);
  if (forwarded) return forwarded.split(",").pop()!.trim();

  return pick(req?.socket?.remoteAddress) || "unknown";
}

/**
 * 全域用量上限。
 *
 * 逐 IP 限流擋得住單一使用者連打，但擋不住換 IP 的分散式呼叫；
 * 這個端點每次都會呼叫 Gemini，最壞情況是帳單被灌爆。
 * 這裡再加一道「所有人加總」的每小時上限當作費用保險絲。
 */
const GLOBAL_HOURLY_CAP = Number(process.env.LISTING_CHECK_GLOBAL_HOURLY_CAP || 300);
let globalWindow = { startedAt: 0, count: 0 };

function consumeGlobalQuota(): boolean {
  const now = Date.now();
  if (now - globalWindow.startedAt > 3_600_000) {
    globalWindow = { startedAt: now, count: 0 };
  }
  if (globalWindow.count >= GLOBAL_HOURLY_CAP) return false;
  globalWindow.count++;
  return true;
}

/** 本機／區網開發環境不套用頻率限制，方便連續測試多張圖紙。 */
function isLocalRequest(ip: string) {
  if (process.env.NODE_ENV === "production") return false;
  const addr = ip.replace(/^::ffff:/i, "");
  return addr === "unknown"
    || addr === "localhost"
    || addr === "::1"
    || addr.startsWith("127.")
    || addr.startsWith("192.168.")
    || addr.startsWith("10.");
}

async function getRateLimit(ip: string) {
  if (isLocalRequest(ip)) {
    return { limited: false, remaining: 999, retryAfter: 0 };
  }
  if (upstashListingCheckLimiter) {
    try {
      const { success, remaining, reset } = await upstashListingCheckLimiter.limit(ip);
      return {
        limited: !success,
        remaining: Math.max(0, remaining),
        retryAfter: Math.max(1, Math.ceil((reset - Date.now()) / 1000)),
      };
    } catch (error) {
      console.error("Upstash listing-check rate limit error, falling back to in-memory:", error);
    }
  }
  const now = Date.now();
  const bucket = listingCheckRateBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    listingCheckRateBuckets.set(ip, { count: 1, resetAt: now + LISTING_CHECK_RATE_WINDOW_MS });
    return { limited: false, remaining: LISTING_CHECK_RATE_LIMIT - 1, retryAfter: 0 };
  }
  bucket.count++;
  return {
    limited: bucket.count > LISTING_CHECK_RATE_LIMIT,
    remaining: Math.max(0, LISTING_CHECK_RATE_LIMIT - bucket.count),
    retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}

interface UploadedFile {
  mimeType: string;
  data: string;
}

function estimateBytesFromBase64(base64: string): number {
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

class ListingUploadError extends Error {}

function validateFiles(files: unknown): UploadedFile[] {
  if (!Array.isArray(files) || files.length === 0) {
    throw new ListingUploadError("請上傳物件概要書或図面的圖片或 PDF。");
  }
  if (files.length > MAX_FILES) {
    throw new ListingUploadError(`最多只能同時上傳 ${MAX_FILES} 張圖片。`);
  }

  let totalBytes = 0;
  const validated: UploadedFile[] = [];
  for (const file of files) {
    if (!file || typeof file !== "object") throw new ListingUploadError("圖片格式不正確。");
    const mimeType = (file as any).mimeType;
    const data = (file as any).data;
    if (typeof mimeType !== "string" || !ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new ListingUploadError("這個檔案格式無法讀取，請改用圖片檔（JPG、PNG、HEIC 等）或 PDF。");
    }
    if (typeof data !== "string" || !data) {
      throw new ListingUploadError("圖片內容讀取失敗，請重新上傳。");
    }
    totalBytes += estimateBytesFromBase64(data);
    if (totalBytes > MAX_TOTAL_IMAGE_BYTES) {
      throw new ListingUploadError(`圖片總大小超過 ${Math.round(MAX_TOTAL_IMAGE_BYTES / 1024 / 1024)}MB 上限，請壓縮後再試。`);
    }
    validated.push({ mimeType, data });
  }
  return validated;
}

export interface ExtractedListingFields extends SpecialSaleFields, RentalConditionFields, AuditFields {
  dealType: string; // "sale" 或 "rent"
  buildingName: string;
  roomNumber?: string;
  station: string;
  walkTime: string;
  transitAccess: string;
  layout: string;
  rent: string;
  managementFee: string;
  keyMoney: string;
  deposit: string;
  leaseTerms: string;
  age: string;
  floor: string;
  address: string;
  area: string;
  structure: string;
  guaranteeFee: string;
  lockReplacementFee: string;
  cleaningFee: string;
  insuranceFee: string;
  shikibiki: string;
  cancellationPenalty: string;
  renewalFee: string;
  supportFee: string;
  freeRent: string;
  balconyArea?: string;
  // 買賣專用欄位
  salePrice: string;
  totalUnits: string;
  buildingFloors: string;
  repairReserve: string;
  repairFund: string;
  otherMonthlyFees: string;
  occupancyStatus: string;
  currentRent: string;
  annualIncome: string;
  grossYield: string;
  landRights: string;
  zoning: string;
  renovationDetails: string;
  managementCompany: string;
  managementStyle: string;
  fixedAssetTax: number;
  cityPlanningTax: number;
  realEstateAcquisitionTax: number;
  buildingAssessedValue: number;
  landAcquisitionTaxAfterRelief: number;
  registrationFee: number;
  landRightsRatio: string;
  taxEstimationBasis: string;
  specialNotes: string;
  otherConditions?: string;
  facilities?: string;
  /** 設備原文 → 繁體中文的對照，供字典未收錄的寫法使用。 */
  facilityTranslations?: Array<{ ja: string; zh: string }>;
}

function leaseTermValue(row: string, labels: string[]) {
  const normalized = row.normalize("NFKC");
  const labelPattern = labels.join("|");
  return normalized.match(new RegExp(`(?:${labelPattern})\\s*[:：]?\\s*((?:\\d+(?:\\.\\d+)?\\s*(?:ヶ月|ヵ月|カ月|個月|万円|円))|なし|無し|無|不要)`, "i"))?.[1]?.trim() || null;
}

/**
 * 敷金／礼金的聚焦二次確認。
 *
 * 40 個欄位的大表格抽取，在密集的日文費用表格上很容易對位錯——實測アクアリガーレ
 * 西日暮里（純掃描 PDF，沒有文字層可以靠座標對位）的「敷金｜無｜礼金｜無」這一列，
 * 五次抽取裡四次專屬格子回空字串、一次把下一格「更新料 1.5ヶ月(新賃料)」錯抓成礼金，
 * 對客人來說前者顯示「待確認」、後者憑空多算十幾萬円初期費用，都不能接受。
 *
 * 單獨只問「這兩格印什麼字」的窄問題，準確率遠高於一次抽 40 個欄位。租賃圖紙一律
 * 執行，不做「可疑才確認」：最常見的錯法是把「無」幻覺成「1ヶ月」，和真實值無法
 * 區分。多一次小呼叫，換到的是初期費用試算最關鍵的兩個數字。
 */
async function verifyLeaseCharges(
  files: UploadedFile[],
  current: { deposit: string; keyMoney: string },
): Promise<{ deposit: string; keyMoney: string }> {
  const prompt = `
    這是一張日本賃貸物件的図面。只需要回答兩個問題，其他內容一律不要管：

    1. 費用表格裡標示「敷金」的那一格，實際印的是什麼字？
    2. 費用表格裡標示「礼金」的那一格，實際印的是什麼字？

    判讀規則：
    - 敷金與礼金通常在同一列並排：「敷金｜值｜礼金｜值」。請確認你讀的值就在該標籤的正右方。
    - 緊接的下一列常是「敷引」「償却金」「保証金」「更新料」，這些是不同的項目；
      它們的值（常是「-」或「1.5ヶ月(新賃料)」之類）絕對不能填進敷金或礼金。
    - 格子印「無」「無し」「なし」「0」「0円」→ 回答「無」。
    - 格子印月數或金額（如「1ヶ月」「115,000円」）→ 原樣回答。
    - 格子真的空白、或整份圖紙找不到這一格 → 回答空字串。不要猜。
  `;

  // 有圖就只送圖、不送 PDF。實測純掃描 PDF 跟 JPEG 一起送時，Gemini 對 PDF 內部
  // 點陣化的解析度不夠，會把清楚的 JPEG 一起拖下水（五次四錯）；只送 2200px JPEG
  // 則五次全對。沒有圖的情況（前端轉圖失敗）才退回送原檔。
  const imageFiles = files.filter(file => file.mimeType.startsWith("image/"));
  const inputs = imageFiles.length ? imageFiles : files;

  try {
    const response = await getAiClient().models.generateContent({
      model: "gemini-3.8-flash",
      contents: { parts: [...inputs.map(file => ({ inlineData: file })), { text: prompt }] },
      config: {
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            deposit: { type: Type.STRING, description: "敷金格子內實際印的字；免收回「無」；空白回空字串" },
            keyMoney: { type: Type.STRING, description: "礼金格子內實際印的字；免收回「無」；空白回空字串" },
          },
          required: ["deposit", "keyMoney"],
        },
      },
    });
    const parsed = JSON.parse(response.text || "{}");
    const pick = (fresh: unknown, fallback: string) => {
      const value = typeof fresh === "string" ? fresh.trim() : "";
      // 二次確認也讀到串格特徵就不採用，寧可留原值讓下游顯示待確認。
      if (!value || /新賃料|更新/.test(value)) return fallback;
      return value;
    };
    return {
      deposit: pick(parsed.deposit, current.deposit),
      keyMoney: pick(parsed.keyMoney, current.keyMoney),
    };
  } catch (error) {
    console.warn("analyze-listing: 敷金／礼金二次確認失敗，沿用第一次結果", error);
    return current;
  }
}

function reconcileLeaseTerms(extracted: ExtractedListingFields): ExtractedListingFields {
  const row = extracted.leaseTerms || "";
  if (!row.trim()) return extracted;
  const deposit = leaseTermValue(row, ["敷金", "保証金"]);
  const keyMoney = leaseTermValue(row, ["礼金"]);
  const shikibiki = leaseTermValue(row, ["償却金", "敷金償却", "償却", "敷引"]);
  // 專屬格子優先、整列只用來補漏。這個函式存在的目的是「圖紙漏填獨立欄位、
  // 卻在契約條件列寫了敷金0・礼金0」時把值補回來，不是拿整列去覆蓋格子。
  // 先前寫成 row 優先，結果 Gemini 把整列幻覺成「敷金 1ヶ月」時，會蓋掉專屬
  // 格子裡正確讀到的「無」，客人平白多算出兩個月租金的初期費用。
  return {
    ...extracted,
    deposit: extracted.deposit?.trim() ? extracted.deposit : (deposit || extracted.deposit),
    keyMoney: extracted.keyMoney?.trim() ? extracted.keyMoney : (keyMoney || extracted.keyMoney),
    shikibiki: extracted.shikibiki?.trim() ? extracted.shikibiki : (shikibiki || extracted.shikibiki),
  };
}

function reconcileTransitAccess(extracted: ExtractedListingFields): ExtractedListingFields {
  const raw = (extracted.transitAccess || "").normalize("NFKC");
  if (!raw.trim()) return extracted;
  const pairs: Array<{ station: string; minutes: string }> = [];
  const pattern = /([^\s、,，;；\n]{1,50}?)駅\s*(?:より)?\s*徒歩\s*(\d{1,3})\s*分/g;
  for (const match of raw.matchAll(pattern)) {
    const stationPart = match[1].split(/[／/]/).at(-1) || "";
    const station = stripStationOperatorPrefix(stationPart);
    const minutes = Number(match[2]);
    if (!station || !Number.isInteger(minutes) || minutes < 1 || minutes > 120) continue;
    if (!pairs.some(pair => pair.station === station)) pairs.push({ station, minutes: String(minutes) });
  }
  if (!pairs.length) return extracted;
  return {
    ...extracted,
    station: pairs.map(pair => pair.station).join(","),
    walkTime: pairs.map(pair => pair.minutes).join(","),
  };
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

async function extractListingFields(files: UploadedFile[], layoutText = ""): Promise<ExtractedListingFields> {
  const prompt = `
    分析這份日本不動產物件概要書／図面圖片或 PDF，精準抓出各欄位內容，原文照抄不要翻譯或換算單位。

    最重要的規則：本說明中出現的所有範例都只是在示範「格式」，不是候選答案。
    任何數字都必須逐位讀自這份圖紙本身。當圖紙上的數字與說明裡的範例相近時，
    一律以圖紙為準——實測曾發生把圖紙上的 7,298万円 輸出成範例值 7,299万円 的情況，
    這種一位數的差異會直接毀掉後續的行情判斷。輸出前請再核對一次每個金額的每一位數字。

    物件種類與建物名稱・房號（dealType，極重要）：
    - 判斷這份圖紙是「買賣物件（sale）」還是「租賃物件（rent）」。
    - buildingName：逐字提取物件名／建物名／マンション名（不含房號）；找不到時留空，不可拿地址或仲介公司名代替。
    - roomNumber：逐字提取房號／部屋番号／号室（例如 "602号室"、"1103号室"、"201"、"B102" 等；若圖紙有標註號室請務必抓出，無則留空）。
    - 買賣図面（中古マンション販売図面）同樣要抓房號，且房號常不在獨立欄位，請額外掃描這些位置：
      物件名／マンション名後方（例如「レグノ・セレーノ 803号室」）、「所在階／部屋番号」「階／号室」合併欄
      （例如「8階／803号室」時 roomNumber 填 "803号室"、floor 填 "8階"）、標題列、備考欄與圖面右上角的管理編號旁。
    - roomNumber 只填房號本身，不可把樓層（"8階"）、棟別以外的地址或坪數一起填入。
    - 若圖紙出現「売買」「売マンション」「中古マンション」「オーナーチェンジ」「販売価格」「価格(税込)」「専有面積」「修繕積立金」等買賣特徵，dealType 填 "sale"。
    - 若為一般租屋（「賃貸」「賃料」「家賃」「敷金」「礼金」「更新料」），dealType 填 "rent"。

    車站與徒步時間（重要）：
    - 掃描整份文件，找出所有標示的車站與各自的徒步分鐘數。
    - station 只填車站名稱本身，不要包含「JR」「東京メトロ」「都営」「東急」這類營運商前綴，
      也不要包含路線名稱或結尾的「駅」字，例如文件寫「JR新宿駅」時 station 只填「新宿」。
    - 多個車站時，station 與 walkTime 用逗號分隔，且順序要對應
      （例如 station="新宿,代々木上原" walkTime="8,12"）。
    - 不要對不同車站填同一個徒步時間，除非文件上真的寫的是同一個數字。
    - transitAccess：把「交通」欄的每一列連同路線名、車站名、徒歩分鐘逐字抄下；即使第二列字較小也不可省略。例如 "東急目黒線／不動前駅 徒歩7分\nJR山手線／五反田駅 徒歩14分"。若圖紙載有多個利用車站，每個車站均須連同其所屬鐵道路線名（如「JR山手線」、「東京メトロ丸ノ内線」、「都電荒川線」）完整抄錄，絕不可省略路線。
    - 輸出前逐列點算交通欄：transitAccess 的車站數、station 的車站數、walkTime 的數字數量必須一致。

    租金與各項租約費用（若為租賃圖紙）：
    - rent（賃料／家賃）：照原文抓取，格式如 "○○.○万円" 或 "○○,○○○円"。
    - managementFee（管理費／共益費）：照原文抓取，格式如 "○,○○○円"，若寫込み或無則寫 "0円"。
    - keyMoney（礼金）與 deposit（敷金／保証金）：只抄「礼金」「敷金」那一格裡實際印的字，
      一個字都不要改。這兩格最常見的內容有三類，請依格子上實際看到的輸出：
        (a) 格子印的是「無」「無し」「なし」「0」「0円」→ 原樣輸出那幾個字，代表免收。
        (b) 格子印的是月數或金額（格式如 "○ヶ月"、"○○,○○○円"）→ 原樣輸出。
        (c) 格子空白或整份圖紙沒有這一格 → 輸出空字串。
      嚴禁在格子印「無」時輸出任何月數：實測曾把「礼金 無」誤輸出成月數，讓客人多算出
      數十萬円的初期費用。免收（a）和未載明（c）也不能混用——前者是圖紙明確寫了不收，
      後者是圖紙沒說。
    - rentalConditions：逐字保留租賃完整特殊條件：契約種類與期間、更新費次數及金額是否未載、調租百分比與第幾次、入居日、敷禮優惠期限、養寵物額外押金、年次保證費及適用公司、生活支援費週期、抗菌處理費、事務費、另計保險與退去清掃費。不得把更新型一年租約套為兩年，不得把AD業者獎勵當租客費用；地平面以下是部分住居警語，未指明本室時不得推定本室地下。
    - leaseTerms：把包含敷金、礼金、保証金、償却金或敷引的整列文字連同每個標籤逐字抄下
      （格式如 "敷金 ○　礼金 ○　償却金 ○"，○ 為格子上實際印的字：可能是月數、金額、「無」或「-」）。
      不可只抄數值，也不可自行補上圖紙沒印的月數。
    - 「敷金／保証金」與「償却金／敷引」是不同欄位：deposit 只能讀取緊接敷金或保証金標籤的值，絕對不可把償却金或敷引的 0円 填入 deposit。
    - guaranteeFee（保証会社費用／初回保証料）：照原文，例如 "50%"、"総賃料50%"、"4.5万円"、"外国人プラン80%"、"GTN100%"。若圖紙載有「外国人プラン」或外國籍專用保證料，請優先提取外國人方案之比例。
    - lockReplacementFee（鍵交換代／シリンダー交換代）：照原文，格式如 "○○,○○○円"，或 "無償"、"なし"。
    - cleaningFee（退去時清掃費／室内クリーニング代／エアコン清掃代）：照原文，格式如 "○○,○○○円"。
    - insuranceFee（火災保険／家財保険料）：照原文，格式如 "○○,○○○円"。
    - supportFee（入居者サポート／安心サポート／クラブ費／駆けつけ）：照原文，例如 "22,000円"、"16,500円"、"リブクラブ2,200円/月"。
    - freeRent（フリーレント／免租期）：照原文，例如 "フリーレント30日"、"フリーレント1ヶ月"，無則寫 "なし"。

    買賣物件專屬欄位（若為買賣圖紙，請格外仔細精準提取）：
    - propertyType：逐字抄下「戸建」「一棟」「区分マンション」「土地」等類型；標題「1棟」優先於角落的「売マンション」，不得把整棟當單一公寓。未載明留空。
    - 名稱「マンション」不等於區分公寓：整棟出售且載有店鋪、客房／寮的組成與整棟面積時，propertyType 填「一棟（店舗・共同住宅）」或「一棟ホテル」。建物名稱只保留原名。單一房號「405号室」才填 roomNumber；「1号地」是基地編號，放 specialNotes，不能當房號。未載土地權利不得預設所有權。
    - handoverDetails：逐字保留交屋、拆屋、建築條件、現況渡し、契約不適合責任免責等條件。若同時寫「更地渡し」與「古屋付・現況渡し（解体については要相談）」必須兩段都保留，不得自行調和。建築条件なし不得擴寫成不受建築限制。
    - unitBreakdown：原文保留店舗、客室、寮、管理室、備品室等各自數量及総戸数，數字矛盾也照錄，不得當成單一住宅的格局。optionalFacilities：原文保留停車／駐輪等選配的空位與費用，空き無し不能翻成有空位，費用不得加入每戶固定管修费。
    - buildingCondition：只保留原文新築、中古、完成／予定日期；不要由照片或零年屋齡猜新築。age 優先完整建造年月，廣告括號的築年數可能過期。
    - landArea：只提取土地面積，保留公簿／實測、私道負擔、セットバック與正味面積各標籤和數字。
    - buildingArea：提取整棟延床／建物合計面積及各層面積；單一公寓則提取専有面積。合計在最前面，不得混入土地面積；area 填此建物合計數字。
    - roadDetails：逐字抄錄接道方位、道路種類／位置指定道路、道路寬度、接道長度、私道負擔、セットバック、建ぺい率及容積率，未載明留空。
    - hospitalityDetails：民泊／旅館許可、申請狀態、營運狀態、最大宿泊人數與許可範圍逐字照抄。申請中、申請済不等於許可取得済；不把民泊自營稱為「帶租約」。沒有住宿用途則留空。
    - revenueDetails：逐字抄下全部營業收入算式與前提，包含日價×天數、月租×月數、稼動率、年間營收，保留「実績／想定」。營收不是淨利，不得憑空補上未刊載投報率。
    - annualIncome 只能填圖紙明列的年收入，不得用售價×利回り反推。只有「想定利回り8.4%」時 annualIncome、currentRent 均留空。全空室保留「全空室」，不能因預估收益變成出租中；翻新中不能改為翻新完成。刊載月收入保留在 revenueDetails，非現有租約不能放 currentRent。
    - revenueScope：明列收益適用整棟或部分房號／樓層，例如「101号室／1Fのみ」。只列101號室收益時不得當全棟租金。未載明填「範囲未記載」。
    - taxDetails：逐字抄下已刊載年度與土地／家屋各項稅額；必須保留稅名與年度，例如「令和6年度固定資産税 土地37,169円 家屋60,424円」。未載明留空，禁止推算填入此欄。
    - 若是民泊／旅館：currentRent 留空（除非明確是現有長租合約），annualIncome 可填刊載年營收。禁止僅因有利回り或營收就填「出租中（帶租約）」。
    - 同一棟的建物面積與土地面積要分開。不得因存在任意面積而猜测缺漏的專有面積。不得把圖紙「売主」「手数料1%」等業者間報酬直接當成買方應付仲介費；保留原文待確認。
    - 固定資産税欄若分列土地與家屋，fixedAssetTax 必須是兩者合計，年度照taxDetails保留；不得漏掉其中一筆。未記載土地權利、建造年份、構造、車站或房號時不得依照片猜測補齊。
    - 改裝／引渡日期照抄原文，已過期的「予定」仍是圖紙記載的予定，不能因今天的日期而宣稱已完工。
    - priceDetails：逐字保留新價格、劃除舊價格、現況／翻新前價格、另估翻新預算及價款包含範圍。salePrice 只填有效新價格，不可填舊價格，也不可把另估翻新費加到售價。
    - 「旅館業取得サポート可」只是取得支援，「民泊可能」只是用途宣傳，均非許可已取得。室內照片若標「リフォーム後イメージ」要保留示意圖聲明，不視為已完工。不因照片看起來無人居住而填現況空室；未明載居住現況時留空。
    - 固都税為固定資產稅與都市計畫稅合計，保留約數及年度在 taxDetails，不能自行拆分兩個稅目。
    - salePrice（販売価格／価格）：照原文連同單位逐字抄下，格式如 "○,○○○万円" 或 "1億○,○○○万円"。
      這是整份分析最關鍵的數字，請逐位核對圖紙上的每一個數字後再輸出。
    - totalUnits（総戸数／戸数）：照原文，格式如 "○○戸"。
    - balconyArea（バルコニー面積／バルコニー）：照原文抓陽台面積，格式如 "○.○○㎡"、"○.○○㎡(約○.○○坪)"、"○.○○m2"。無標示則留空。
    - buildingFloors（建物總樓層）：只填地上總樓層的數字（純數字，不含「階建」）。
      常見於構造欄位（"鉄筋コンクリート造21階建"、"RC造・地上9階建"）或物件概要。
      這個欄位很重要：同樣是 7 樓，在 7 層建物是頂樓、在 21 層建物只是中低樓層，
      沒有總樓層就無法判斷樓層價值。找不到才留空字串。
    - repairReserve（修繕積立金）：若備註載有「月額○円に改定」，優先填改定後的新金額；否則照主欄原文，格式如 "○,○○○円"。
    - managementFee（管理費）：買賣圖紙同樣一定要抓。它幾乎都緊鄰「修繕積立金」出現，
      常見寫法是「管理費 9,300円/月」或表格中「管理費・修繕積立金」並排。
      只有在圖紙上真的找不到時才留空字串，不要因為這是買賣圖紙就略過這個欄位。
    - repairFund（修繕積立基金／積立基金）：照原文，格式如 "○,○○○円"（有些物件每月另有積立基金）。若無則填空字串。
    - otherMonthlyFees（町会費／協力金／自治会費／其他每戶固定月費）：照原文，例如 "町会費 300円"、"協力金 2,000円"。停車場、駐輪場、バイク置場等只有使用者才付的選配費用不得填入。
    - occupancyStatus（現況）：請翻譯為繁體中文，例如 "現況空室"、"出租中（帶租約）"、"現有屋主居住中（交屋期需協商）"、"可立即交屋"。
    - currentRent（現行家賃／月額収入，若為投資型／賃貸中）：照原文，格式如 "○○○,○○○円"。
    - annualIncome（年間収入／年額収入，若為投資型／賃貸中）：照原文，格式如 "○,○○○,○○○円"。
    - grossYield（利回り／表面利回り）：照原文，格式如 "○.○%" 或 "○%"。
    - landRights（土地権利）：例如 "所有権"、"借地権"、"定期借地権"。
    - zoning（用途地域）：例如 "商業地域"、"準工業地域"、"第一種住居地域"。
    - renovationDetails（裝修與翻新內容／工事履歷）：請翻譯為繁體中文，例如 "2022年1月全室翻新完成：更換木質地板、壁紙與天花板壁紙更新、整體衛浴設備更新、系統廚房更新、瓦斯熱水器更新、天花板嵌燈裝設、冷暖空調安裝。2013年大樓大規模修繕工程實施。"。
    - managementCompany（管理会社）：例如 "東急コミュニティー"、"伏見管理サービス"、"南海ビルサービス"。
    - managementStyle（管理形態／管理方式）：例如 "全部委託 (日勤)"、"全部委託 (巡回)"。

    買方稅費評價推算（只有買賣圖紙需要；金額一律輸出整數日圓）：
    - fixedAssetTax、cityPlanningTax：若圖紙載有年度稅額，優先逐字精確採用。若未載明，依下列方式推算年度稅額：
      1. 優先尋找「敷地権割合」（例如 1234/5678）並填入 landRightsRatio，據此換算土地持分面積。
      2. 土地依所在地路線價／合理地價推估固定資產評價額；小規模住宅用地的固定資產稅課稅標準採 1/6、都市計畫稅採 1/3。
      3. 建物以壁芯專有面積 × 1.1 公設分擔係數，依 RC／SRC 約 20 萬円/㎡、木造約 10 萬円/㎡為重建基準，再按屋齡經年減點折舊。
      4. 固定資產稅率採 1.4%，都市計畫稅率採 0.3%。只輸出全年稅額，不要自行做交屋日分攤。
    - buildingAssessedValue：輸出推算使用的建物固定資產評價額，讓程式端能獨立複核取得稅，不可只輸出扣除後稅額。
    - landAcquisitionTaxAfterRelief：輸出土地住宅減免後仍應繳的不動產取得稅；沒有可靠依據時可填 0，但不可把建物稅混入。
    - realEstateAcquisitionTax：依建物固定資產評價額推算。2026 年 4 月 1 日後，只有「買方本人取得後自住」、床面積 40～240㎡，且為 1982 年後興建或有新耐震證明時，才可將建物評價額扣除 1,200 萬円後乘 3%。
      圖紙若為「賃貸中」「オーナーチェンジ」或投資物件，絕對不可套用自住扣除，必須以建物評價額 × 3% 加上土地減免後稅額。扣除後為 0 也必須在 taxEstimationBasis 明示符合的三項條件。
    - registrationFee：合併推算登録免許税與司法書士報酬，依圖紙可得評價資訊及登記內容估算；缺乏明細時採成交總價約 0.8%～1.2% 的合理值，不得固定使用 1.8%。
    - taxEstimationBasis：使用繁體中文、最多 35 字，只說明稅額是圖紙載明或 AI 概算；不可列公式、數字、敷地權分數、折舊過程或重複減免判斷，不可輸出日文句子。

    物件規格欄位（請格外仔細，務必尋找提取）：
    - layout（間取り，例如 "1K"、"1LDK"、"2DK"、"2LDK"）。
    - area（専有面積／平米數／坪數）：
      * 請仔細在表格、間取り圖旁或建物概要搜尋「専有面積」「専有」「面積」「床面積」「建物面積」等標記。
      * 常見格式如 "40.17㎡"、"30.21㎡"、"40.66㎡"、"50.55㎡"、"12.29坪"、"15.29坪"。
      * 圖紙上有任何面積標示，務必抓出，格式如 "40.17㎡"，不可遺漏！
    - structure（建物構造／構造・規模）：
      * 請仔細在「構造」「建物構造」「構造・規模」搜尋。
      * 常見寫法：英文簡稱如 RC、SRC、S、ALC、PC、W；日文漢字如 鉄筋コンクリート造、鉄骨鉄筋コンクリート造、鉄骨造、木造等。
    - age（築年數／建築年月，例如 "築4年"、"平成11年2月"、"2002年5月"、"2013年2月"）。
    - floor（所在階／總階數，例如 "4階部分 / 8階建"、"6階部分"）。
    - address（所在地／住所，例如 "東京都世田谷区太子堂4-30-31"、"千葉県船橋市本町2-6-14"）。

    設備與公設規格（極重要，務必巨細靡遺全盤檢索）：
    - facilityTranslations：把 facilities 裡的**每一個項目**都翻成台灣用語的繁體中文，
      輸出 [{ "ja": 原文, "zh": 繁體中文 }, ...]。
      * ja 必須與 facilities 裡的寫法逐字相同（含括號與單位），否則無法對應。
      * zh 用簡短名詞，10 個字以內，例如 "オートロック"→"防盜自動門鎖"、
        "追焚機能"→"自動追焚保溫浴缸"、"ペアガラス"→"雙層隔音氣密窗"、
        "宅配ボックス"→"宅配箱"、"床暖房"→"地暖設備"。
      * 不要翻成解釋句，也不要加「有」「附」等贅字；純設備名稱即可。
      * 「有」「完備」「電動」這種單獨出現、本身不是設備的詞，直接略過不要列。
    - facilities（建物與室內設備清單）：
      * 請完整掃描整份圖紙中所有出現設備與建物特徵的區塊（包含「設備」、「設備・仕様」、「■EQUIPMENT」、間取り圖內部與周圍標註、建物特徵說明、大樓公設等）。
      * 必須全盤提取確認有的設施，常見包含：
        - 衛浴水洗：バストイレ別（乾濕分離）、独立洗面台（洗面化粧台）、温水洗浄便座（ウォシュレット）、浴室乾燥機、追い焚き、室内洗濯機置場、洗面所独立。
        - 廚房烹飪：システムキッチン、2口/3口コンロ、ガスコンロ、IH、グリル付、都市ガス、ディスポーザー。
        - 門禁安全：オートロック、モニタ付オートロック、TVモニター付インターホン、防犯カメラ、ディンプルキー、ダブルロック、24時間緊急通報システム。
        - 大樓公設：エレベーター、敷地内ゴミ置場／ゴミ置き場／24時間ゴミ出し可、宅配ボックス／宅配BOX、駐輪場、バイク置場、駐車場、風除室、外壁タイル張り、耐震構造／耐火構造、駅まで平坦。
        - 室內舒適：エアコン（若有標基數如2基請保留）、床暖房、フローリング、バルコニー、ウォークインクローゼット（WIC）、シューズボックス、分譲タイプ、インターネット無料／Wi-Fi無料、BS/CS、CATV。
      * 特別注意日本圖紙常見的「表格打圈／勾選矩陣」（如 ■EQUIPMENT 表格）：務必仔細比對各項目旁是否有圈印（○、◯、●、レ、✔、有）；只有打了圈或明確標為有的項目才算具備，留空（空白）、槓號（-、／）或打叉（×、無）的項目代表無該設備，絕對不可填入！
      * 設備文字清單（如「設備：エレベーター,２４時間ゴミ出し可,風除室,敷地内ゴミ置き場,宅配ＢＯＸ...」）中列出的所有具備項目，請逐一完整收錄，不可隨意遺漏！
      * 請將確認具備的所有設備名稱整理為逗號分隔字串。

    特約條款與注意事項（租賃與買賣共通）：
    - shikibiki（敷引／償却／敷金償却）：表格或特約中是否有敷引或償却？照原文填入，例如 "1ヶ月"、"0円"；只有圖紙完全沒寫此欄時才填 "なし"。
    - cancellationPenalty（短期解約違約金）：違約金規定，無則寫 "なし"。
    - renewalFee（更新料）：契約更新費用，無則寫 "なし"。
    - specialNotes（其他特約・注意事項・生活限制・交易條件）：
      請完整掃描備考、特約欄、設備條件、取引態様（売主、媒介、手数料3%）、司法書士売主指定、ペット飼育可否等。

    找不到的欄位留空字串，不要猜測或用 0 代替。
  `;

  // 圖紙的費用表在畫面上是整齊格線，但 PDF 內部文字順序是散的，模型只能猜
  // 哪個值屬於哪一列（實測會把敷引讀成「-」、礼金讀成「1ヶ月」）。前端依座標
  // 還原出的版面文字保有正確列序，作為對位依據能顯著提升準確度。
  const layoutHint = layoutText
    ? `\n\n以下是從這份圖紙的文字層依座標還原的版面文字，同一行代表圖紙上的同一列。\n欄位對位請以這份還原文字為準，它比自行判讀 PDF 內部順序可靠：\n---\n${layoutText}\n---`
    : "";

  const response = await getAiClient().models.generateContent({
    model: "gemini-3.8-flash",
    contents: {
      parts: [
        ...files.map(file => ({ inlineData: file })),
        { text: prompt + layoutHint },
      ],
    },
    config: {
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          propertyType: { type: Type.STRING },
          priceDetails: { type: Type.STRING },
          handoverDetails: { type: Type.STRING },
          unitBreakdown: { type: Type.STRING },
          optionalFacilities: { type: Type.STRING },
          buildingCondition: { type: Type.STRING },
          landArea: { type: Type.STRING },
          buildingArea: { type: Type.STRING },
          roadDetails: { type: Type.STRING },
          hospitalityDetails: { type: Type.STRING },
          revenueDetails: { type: Type.STRING },
          revenueScope: { type: Type.STRING },
          taxDetails: { type: Type.STRING },
          dealType: { type: Type.STRING, description: "sale 或 rent" },
          buildingName: { type: Type.STRING, description: "物件名／建物名／マンション名；不含房號，找不到留空" },
          roomNumber: { type: Type.STRING, description: "部屋番号／号室，例如 602号室 或 1103，找不到或未標示則留空" },
          station: { type: Type.STRING, description: "所有車站名稱，逗號分隔" },
          walkTime: { type: Type.STRING, description: "對應車站的徒步分鐘數，逗號分隔，順序需與 station 一致" },
          transitAccess: { type: Type.STRING, description: "交通欄全部列的原文，每列保留路線、車站及徒歩分鐘" },
          layout: { type: Type.STRING, description: "間取り，例如 1LDK、2DK、1K" },
          rent: { type: Type.STRING, description: "賃料／家賃，原文格式" },
          managementFee: { type: Type.STRING, description: "管理費／共益費，原文格式" },
          keyMoney: { type: Type.STRING, description: "礼金，原文格式" },
          deposit: { type: Type.STRING, description: "敷金／保証金，原文格式" },
          rentalConditions: { type: Type.STRING },
          leaseTerms: { type: Type.STRING, description: "敷金、礼金、保証金、償却金、敷引所在整列的原文，必須保留各標籤" },
          age: { type: Type.STRING, description: "築年數／建築年月" },
          floor: { type: Type.STRING, description: "所在階" },
          address: { type: Type.STRING, description: "地址／所在地" },
          area: { type: Type.STRING, description: "専有面積，例如 40.17㎡" },
          structure: { type: Type.STRING, description: "建物構造，例如 RC造" },
          guaranteeFee: { type: Type.STRING, description: "保證公司費用，照原文" },
          lockReplacementFee: { type: Type.STRING, description: "鍵交換費用，照原文" },
          cleaningFee: { type: Type.STRING, description: "退去清掃費／室内クリーニング代／エアコン清掃代，照原文；不可填入敷引或償却金" },
          insuranceFee: { type: Type.STRING, description: "火災保險費用，照原文" },
          supportFee: { type: Type.STRING, description: "入居者サポート／24小時生活支援費用" },
          freeRent: { type: Type.STRING, description: "免租期優惠，例如 フリーレント30日 或 なし" },
          shikibiki: { type: Type.STRING, description: "敷引／償却約定，例如 敷引1ヶ月 或 なし" },
          cancellationPenalty: { type: Type.STRING, description: "短期解約違約金，例如 1年未満解約時1ヶ月 或 なし" },
          renewalFee: { type: Type.STRING, description: "更新料，例如 新賃料1ヶ月 或 なし" },
          facilities: { type: Type.STRING, description: "室內與建物設備清單（逗號分隔）。注意表格打圈式只有打圈標記的才算具備，未打圈者切勿填入" },
          facilityTranslations: {
            type: Type.ARRAY,
            description: "facilities 每一項的繁體中文對照，ja 需與原文逐字相同",
            items: {
              type: Type.OBJECT,
              properties: {
                ja: { type: Type.STRING, description: "設備原文，與 facilities 內寫法完全一致" },
                zh: { type: Type.STRING, description: "繁體中文設備名稱，10 字以內" },
              },
              required: ["ja", "zh"],
            },
          },
          salePrice: { type: Type.STRING, description: "販売価格，例如 7,299万円" },
          balconyArea: { type: Type.STRING, description: "バルコニー面積，例如 5.42㎡，未標示則留空" },
          totalUnits: { type: Type.STRING, description: "総戸数，例如 39戸" },
          buildingFloors: { type: Type.STRING, description: "建物地上總樓層數字，例如 21" },
          repairReserve: { type: Type.STRING, description: "修繕積立金，例如 6,100円" },
          repairFund: { type: Type.STRING, description: "修繕積立基金，例如 2,180円" },
          otherMonthlyFees: { type: Type.STRING, description: "町会費、協力金等其他月額雜費" },
          occupancyStatus: { type: Type.STRING, description: "現況，例如 空室、賃貸中、居住中" },
          currentRent: { type: Type.STRING, description: "現行月租金收入" },
          annualIncome: { type: Type.STRING, description: "年間賃料收入" },
          grossYield: { type: Type.STRING, description: "表面利回り，例如 4.0%" },
          landRights: { type: Type.STRING, description: "土地権利，例如 所有権" },
          zoning: { type: Type.STRING, description: "用途地域" },
          renovationDetails: { type: Type.STRING, description: "翻修內容與工事履歷" },
          managementCompany: { type: Type.STRING, description: "管理會社" },
          managementStyle: { type: Type.STRING, description: "管理形態與方式" },
          fixedAssetTax: { type: Type.NUMBER, description: "全年固定資產稅（日圓整數；圖紙未載明時依評價邏輯推算）" },
          cityPlanningTax: { type: Type.NUMBER, description: "全年都市計畫稅（日圓整數；圖紙未載明時依評價邏輯推算）" },
          realEstateAcquisitionTax: { type: Type.NUMBER, description: "不動產取得稅（日圓整數；適用自用中古住宅扣除後可為 0）" },
          buildingAssessedValue: { type: Type.NUMBER, description: "推算使用的建物固定資產評價額（日圓整數、扣除前）" },
          landAcquisitionTaxAfterRelief: { type: Type.NUMBER, description: "土地住宅減免後的不動產取得稅（日圓整數）" },
          registrationFee: { type: Type.NUMBER, description: "登録免許税與司法書士報酬合計（日圓整數）" },
          landRightsRatio: { type: Type.STRING, description: "圖紙的敷地権割合，例如 1234/5678；無則留空" },
          taxEstimationBasis: { type: Type.STRING, description: "稅費辨識或推算所用依據摘要" },
          specialNotes: { type: Type.STRING, description: "備考與特約注意事項" },
        },
        required: [
          "propertyType", "priceDetails", "handoverDetails", "unitBreakdown", "optionalFacilities", "buildingCondition", "landArea", "buildingArea", "roadDetails", "hospitalityDetails", "revenueDetails", "revenueScope", "taxDetails",
          "dealType", "buildingName", "roomNumber", "station", "walkTime", "transitAccess", "layout", "rent", "managementFee",
          "keyMoney", "deposit", "leaseTerms", "rentalConditions", "age", "floor", "address",
          "area", "structure", "guaranteeFee", "lockReplacementFee",
          "cleaningFee", "insuranceFee", "supportFee", "freeRent", "shikibiki", "cancellationPenalty",
          "renewalFee", "facilities", "balconyArea", "salePrice", "totalUnits", "buildingFloors", "repairReserve", "repairFund",
          "otherMonthlyFees", "occupancyStatus", "currentRent", "annualIncome",
          "grossYield", "landRights", "zoning", "renovationDetails",
          "managementCompany", "managementStyle", "fixedAssetTax", "cityPlanningTax",
          "realEstateAcquisitionTax", "buildingAssessedValue", "landAcquisitionTaxAfterRelief",
          "registrationFee", "landRightsRatio", "taxEstimationBasis", "specialNotes"
        ],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("empty analyze-listing response");
  const original = JSON.parse(text) as ExtractedListingFields;
  const sourceValues = Object.fromEntries(auditKeys.flatMap(key => original[key] == null ? [] : [[key, String(original[key])]]));
  const extracted = reconcileSpecialSaleFields(reconcileTransitAccess(reconcileLeaseTerms(reconcileRentalListingText(original, layoutText))));
  extracted.sourceValues = sourceValues;
  const statedTax = statedAnnualPropertyTax(extracted.taxDetails);
  if (statedTax !== null) extracted.fixedAssetTax = statedTax;
  if (statedCombinedAnnualPropertyTax(extracted.taxDetails) !== null) {
    delete extracted.fixedAssetTax;
    delete extracted.cityPlanningTax;
    extracted.taxEstimationBasis = `固都稅採圖紙合計原值，未拆分稅目：${extracted.taxDetails}。其他費用依各列說明核對。`;
  }
  return extracted;
}

export function calculateInitialCostBreakdown(params: {
  rent: number;
  managementFee: number | null;
  keyMoney: number | null;
  deposit: number | null;
  extractedKeyMoney: string;
  extractedDeposit: string;
  extractedGuaranteeFee?: string;
  extractedLockReplacementFee?: string;
  extractedCleaningFee?: string;
  extractedInsuranceFee?: string;
  extractedSupportFee?: string;
  extractedFreeRent?: string;
  extractedShikibiki?: string;
  specialNotes?: string;
  rentalConditions?: string;
  marketVerdict?: { status: string; headline: string; detail: string } | null;
}): InitialCostEstimate {
  const { rent, managementFee, keyMoney, deposit } = params;
  const totalMonthlyCost = rent + (managementFee ?? 0);
  const leaseChargeSource = [
    params.extractedDeposit,
    params.extractedKeyMoney,
    params.rentalConditions,
    params.specialNotes,
  ].filter(Boolean).join(" ");
  const depositExplicitZero = isFreeOrZero(params.extractedDeposit) || hasExplicitZeroLeaseCharge(leaseChargeSource, "deposit");
  const keyMoneyExplicitZero = isFreeOrZero(params.extractedKeyMoney) || hasExplicitZeroLeaseCharge(leaseChargeSource, "keyMoney");
  const depositUnknown = deposit === null && !depositExplicitZero;
  const keyMoneyUnknown = keyMoney === null && !keyMoneyExplicitZero;

  const items: InitialCostBreakdownItem[] = [];

  // 1. 敷金（押金）與敷引／償却判定
  const depositAmount = depositExplicitZero ? 0 : deposit ?? 0;
  let rawShikibiki = params.extractedShikibiki || "";
  if (!rawShikibiki || isFreeOrZero(rawShikibiki)) {
    const fromDeposit = params.extractedDeposit?.match(/(?:解約時)?(?:敷金)?(?:償却|敷引)\s*(\d+(?:\.\d+)?(?:ヶ月|ヵ月|カ月|個月)?)/)?.[0];
    const fromNotes = params.specialNotes?.match(/(?:解約時)?(?:敷金)?(?:償却|敷引)\s*(\d+(?:\.\d+)?(?:ヶ月|ヵ月|カ月|個月)?)/)?.[0];
    if (fromDeposit) rawShikibiki = fromDeposit;
    else if (fromNotes) rawShikibiki = fromNotes;
  }
  const formattedShikibiki = formatShikibiki(rawShikibiki);
  const hasShikibiki = Boolean(formattedShikibiki);

  items.push({
    id: "deposit",
    name: "敷金（押金）",
    amount: depositAmount,
    isUnknown: depositUnknown,
    isFromFlyer: Boolean(params.extractedDeposit) || depositExplicitZero,
    note: depositUnknown ? "押金未載明，尚未計入小計；不代表免押金" : depositAmount === 0
      ? "免押金（需留意退租時是否有預收清掃費或特約條款）"
      : hasShikibiki
      ? `擔保性質費用（含「${formattedShikibiki}」扣除約定，退租時不退還）`
      : "擔保性質費用，退租扣除修繕後退還餘額",
  });

  // 2. 禮金（礼金）
  const keyMoneyAmount = keyMoneyExplicitZero ? 0 : keyMoney ?? 0;
  items.push({
    id: "keyMoney",
    name: "禮金（礼金）",
    amount: keyMoneyAmount,
    isUnknown: keyMoneyUnknown,
    isFromFlyer: Boolean(params.extractedKeyMoney) || keyMoneyExplicitZero,
    note: keyMoneyUnknown ? "禮金未載明，尚未計入小計；不代表免禮金" : keyMoneyAmount === 0 ? "免禮金（無須贈與房東謝禮，初期負擔大幅減輕）" : "贈與房東之謝禮，退租時不予退還",
  });

  // 3. 次月預付前家賃（1 個月完整租金與管理費）
  items.push({
    id: "advanceRent",
    name: "前家賃（次月完整租金與管理費）",
    amount: totalMonthlyCost,
    isFromFlyer: true,
    note: "簽約時預先支付入住次月之全額租金與管理費",
  });

  // 4. 起租月日割租金（預估半個月）
  const proratedRent = Math.round(totalMonthlyCost * 0.5);
  items.push({
    id: "proratedRent",
    name: "起租月日割租金（按日計租預估）",
    amount: proratedRent,
    isFromFlyer: false,
    note: "以月中 15 天起租試算；若起租日靠近月底（例如 25 號後）可降至更低",
  });

  // 5. 保證會社初回保證料
  const customGuarantee = parseGuaranteeFee(params.extractedGuaranteeFee, totalMonthlyCost);
  const guaranteeAmount = customGuarantee ?? Math.round(totalMonthlyCost * 0.5);
  items.push({
    id: "guaranteeFee",
    name: "保證會社初回保證料",
    amount: guaranteeAmount,
    isFromFlyer: Boolean(customGuarantee),
    note: customGuarantee
      ? `圖紙標示：${params.extractedGuaranteeFee}（以月總租金 ¥${totalMonthlyCost.toLocaleString()} 計）`
      : params.extractedGuaranteeFee
      ? `圖紙標示：${params.extractedGuaranteeFee}`
      : "外國籍租客多需加入保證公司，一般常態為總月租之 50%～100%",
  });

  // 6. 仲介手續費
  const brokerageFee = Math.round(rent * 1.1);
  items.push({
    id: "brokerageFee",
    name: "仲介手續費（仲介手数料）",
    amount: brokerageFee,
    isFromFlyer: false,
    note: "依日本租賃仲介費法定上限，以 1 個月租金加消費稅計。本試算先按此上限預留，實際是否收取及金額以申請管道、媒介契約與簽約前說明為準。",
  });

  // 7. 火災保險費
  const insuranceIncluded = /(?:含む|込み|含まれ|包含|已含)/u.test(params.extractedInsuranceFee || "");
  const customInsurance = insuranceIncluded ? 0 : parseYenAmount(params.extractedInsuranceFee);
  const insuranceAmount = customInsurance ?? 20000;
  items.push({
    id: "insuranceFee",
    name: "火災保險／家財保險（期間待核對）",
    amount: insuranceAmount,
    isFromFlyer: insuranceIncluded || Boolean(customInsurance),
    note: insuranceIncluded
      ? `已包含於圖紙指定的會員／支援費中：${params.extractedInsuranceFee}`
      : params.extractedInsuranceFee
      ? `圖紙標示：${params.extractedInsuranceFee}${customInsurance === null ? "；金額未載，暫估20,000円，期間待核對" : ""}`
      : "保障租客財物與租賃賠償責任（常態約 1.8 萬～2.2 萬円）",
  });

  // 8. 鑰匙更換費（精準判定無償／なし）
  const isLockFree = isFreeOrZero(params.extractedLockReplacementFee);
  const customLock = isLockFree ? 0 : parseYenAmount(params.extractedLockReplacementFee);
  const lockAmount = isLockFree ? 0 : (customLock ?? 22000);
  items.push({
    id: "lockReplacementFee",
    name: "鑰匙更換費（鍵交換代）",
    amount: lockAmount,
    isFromFlyer: isLockFree || Boolean(customLock),
    note: isLockFree
      ? `免換鎖費用（圖紙標示：${params.extractedLockReplacementFee || "無償"}）`
      : params.extractedLockReplacementFee
      ? `圖紙標示：${params.extractedLockReplacementFee}`
      : "交屋前換新鎖芯（一般鎖約 1.6 萬～2.2 萬円，電子防盜鎖約 3.3 萬円）",
  });

  // 9. 退去清掃費
  const customCleaning = parseYenAmount(params.extractedCleaningFee);
  const cleaningAmount = customCleaning ?? (depositAmount === 0 ? 44000 : 0);
  if (cleaningAmount > 0) {
    items.push({
      id: "cleaningFee",
      name: "退去清掃費／室內清潔費",
      amount: cleaningAmount,
      isFromFlyer: Boolean(customCleaning),
      note: params.extractedCleaningFee
        ? `圖紙標示：${params.extractedCleaningFee}`
        : "金額與收費時點未載，暫列44,000円預備金；不是已確認的簽約請款",
    });
  }

  // 10. 入居者生活支援／安心サポート
  const customSupport = parseYenAmount(params.extractedSupportFee);
  if (customSupport && customSupport > 0) {
    const isMembershipFee = /友の会|會員/u.test(params.extractedSupportFee || "");
    items.push({
      id: "supportFee",
      name: isMembershipFee ? "指定會員月費（含租客保障與緊急支援）" : "入居者サポート／24小時生活支援",
      amount: customSupport,
      isFromFlyer: true,
      note: isMembershipFee ? `圖紙標示：${params.extractedSupportFee}；此為每月費用` : `圖紙標示：${params.extractedSupportFee}（24 小時生活急修與支援服務）`,
    });
  }

  items.push(...additionalRentalFees([params.rentalConditions, params.specialNotes].filter(Boolean).join("\n")));

  // totalMin: 假設月底起租（不計入日割租金）
  const totalMin = items
    .filter(item => item.id !== "proratedRent")
    .reduce((sum, item) => sum + item.amount, 0);

  // totalMax: 包含半個月日割租金
  const totalMax = items.reduce((sum, item) => sum + item.amount, 0);

  const monthsMultipleMin = totalMonthlyCost > 0 ? Number((totalMin / totalMonthlyCost).toFixed(1)) : 0;
  const monthsMultipleMax = totalMonthlyCost > 0 ? Number((totalMax / totalMonthlyCost).toFixed(1)) : 0;

  let level: "low" | "standard" | "high" = "standard";
  let levelText = "符合市場常態（約 4 ～ 5 倍）";

  if (monthsMultipleMax <= 3.8) {
    level = "low";
    levelText = "低於市場常態（約 3 ～ 4 倍）";
  } else if (monthsMultipleMax >= 5.5) {
    level = "high";
    levelText = "高於市場常態（5.5 倍以上）";
  }

  const tips: string[] = [];
  const missingCosts = [
    depositUnknown ? "押金" : null,
    keyMoneyUnknown ? "禮金" : null,
    managementFee === null ? "共益費" : null,
  ].filter((item): item is string => Boolean(item));
  if (missingCosts.length > 0) {
    level = "standard";
    levelText = "必要費用未齊，暫不分級";
    tips.push(`【費用待確認】${missingCosts.join("、")}未載明，目前只列已知及暫估小計；未載明項目不代表免收。`);
  }

  // 1. 租金高性價比／超值物件
  if (params.marketVerdict?.status === "超值") {
    tips.push("【低於行情】租金＋管理費低於同區同房型行情。這類物件去化較快，審查通過後建議儘早決定。");
  }

  // 2. 免租期（Free Rent）特惠提示
  const hasFreeRent = Boolean(params.extractedFreeRent && !isFreeOrZero(params.extractedFreeRent));
  if (hasFreeRent) {
    tips.push(`【免租期】圖紙載明「${params.extractedFreeRent}」，首月可減免租金，約省 ¥${rent.toLocaleString()}。`);
  }

  // 3. 初期費用優惠（3.8 倍以下）
  if (monthsMultipleMax <= 3.8 && missingCosts.length === 0) {
    tips.push(`【初期費用划算】合計約 ${monthsMultipleMax} 個月租金，比市場常見的 4.5～5.0 個月省下不少，入住門檻明顯較低。`);
  }

  // 4. 禮金與押金動態解析
  if (formattedShikibiki) {
    tips.push(`【敷引／償却】圖紙載明「${formattedShikibiki}」，退租時不予退還，初期預算建議直接列為固定支出。`);
  }
  if (!keyMoneyUnknown && !depositUnknown && keyMoneyAmount === 0 && depositAmount === 0) {
    tips.push("【免禮金免押金】初期省約 2 個月租金。需確認退租時的清掃費與原狀恢復特約。");
  } else if (!keyMoneyUnknown && keyMoneyAmount === 0) {
    tips.push("【免禮金】省約 1 個月租金。");
  } else if (keyMoneyAmount >= rent * 1.5) {
    const kmMonths = (keyMoneyAmount / rent).toFixed(1).replace(/\.0$/, "");
    tips.push(`【禮金偏高】禮金 ${kmMonths} 個月，常見於熱門地段，初期成本較高。`);
  }

  // 5. 免換鎖費用優惠
  if (isLockFree) {
    tips.push("【免換鎖費】圖紙載明鍵交換代 0 円，省約 2～4 萬円。");
  }

  // 6. 附免費高速網路
  const allNotes = `${params.specialNotes || ""}`.toLowerCase();
  const hasFreeNet = /インターネット無料|ネット無料|wifi無料|シーファイブ|高速ネット無料|光ネット無料/.test(allNotes);
  if (hasFreeNet) {
    tips.push("【附免費網路】免自行申辦，年省約 5～6 萬円。");
  }

  // 7. 起租日與首期金額浮動說明
  tips.push("【起租日影響首期】首期預收「起租月日割租金＋次月完整租金與管理費」。起租日通常在審查通過後 10～20 天內，若落在下旬，日割天數少、首筆金額較低。");

  // 8. 海外匯款提醒
  tips.push("【海外匯款】初期費用多需由日本國內銀行匯款。海外電匯請預留約 4,000 円日本端手續費與匯差。");

  return {
    totalMin,
    totalMax,
    monthsMultipleMin,
    monthsMultipleMax,
    level,
    levelText,
    items,
    tips,
  };
}

const normalizeStation = (value?: string | null) =>
  (toJapaneseStationName(value || ""))
    .toLowerCase()
    .replace(/涉谷|渋谷/g, "澀谷")
    .replace(/[\s・･（）()\-]/g, "");

const normalizeAddressText = (value?: string | null) => (value || "")
  .toLowerCase()
  .replace(/涉谷|渋谷/g, "澀谷")
  .replace(/廣|広/g, "広")
  .replace(/德|徳/g, "徳")
  .replace(/靜|静/g, "静")
  .replace(/繩|縄/g, "縄")
  .replace(/兒|児/g, "児")
  .replace(/覇|霸/g, "霸")
  .replace(/姫|姬/g, "姬")
  .replace(/浜|濱/g, "濱")
  .replace(/稲|稻/g, "稻")
  .replace(/芸|藝/g, "藝")
  .replace(/桜|櫻/g, "櫻")
  .replace(/辺|邊/g, "邊")
  .replace(/竜|龍/g, "龍")
  .replace(/塩|鹽/g, "鹽")
  .replace(/蔵|藏/g, "藏")
  .replace(/郷|鄉/g, "鄉")
  .replace(/穂|穗/g, "穗")
  .replace(/緑|綠/g, "綠")
  .replace(/区/g, "區")
  .replace(/沢/g, "澤")
  .replace(/戸/g, "戶")
  .replace(/島/g, "嶋")
  .replace(/黒/g, "黑")
  .replace(/[\s・･（）()\-]/g, "");

const nationwideListingMarkets = [...new Map(
  [...mlitBuySnapshots, ...atHomeNationwideRentSnapshots]
    .map(row => [`${row.region}|${row.district}`, { district: row.district, region: row.region }])
).values()].sort((a, b) => b.district.length - a.district.length);

export function resolveDistrictAndRegion(address: string, station: string): { district: string; region: string } | null {
  const cleanAddr = (address || "").replace(/\s+/g, "");

  if (cleanAddr) {
    const normAddr = normalizeAddressText(cleanAddr);

    // 直接使用國交省全國成交快照中的市區町村，不再受租金頁原本 210 個地區限制。
    // 完整名稱優先，並用都道府縣消除「府中市」等跨縣同名市的歧義。
    const matches = nationwideListingMarkets.filter(market => {
      const district = normalizeAddressText(market.district.replace("（市平均）", ""));
      return district.length >= 2 && normAddr.includes(district);
    });
    if (matches.length) {
      const addressRegion = [...new Set(nationwideListingMarkets.map(market => market.region))].find(regionName => {
        const region = normalizeAddressText(regionName).replace(/[都道府県]$/, "");
        return region.length >= 2 && normAddr.includes(region);
      });
      if (addressRegion) {
        // 同名市が他県にしかない（例如広島県府中市但快照只有東京都府中市）時，
        // 寧可回傳無資料，也不能把它錯配到另一個都道府縣。
        return matches.find(market => market.region === addressRegion) ?? null;
      }
      const prefectureMatch = matches.find(market => {
        const region = normalizeAddressText(market.region).replace(/[都道府県]$/, "");
        return region.length >= 2 && normAddr.includes(region);
      });
      return prefectureMatch || matches[0];
    }
  }

  // Chiba
  if (cleanAddr.includes("船橋")) return { district: "船橋市", region: "千葉" };
  if (cleanAddr.includes("千葉")) return { district: "千葉市", region: "千葉" };
  if (cleanAddr.includes("市川")) return { district: "市川市", region: "千葉" };
  if (cleanAddr.includes("柏")) return { district: "柏市", region: "千葉" };

  // Kanagawa
  if (cleanAddr.includes("横浜") || cleanAddr.includes("橫濱")) return { district: "橫濱", region: "神奈川" };
  if (cleanAddr.includes("川崎")) return { district: "川崎", region: "神奈川" };

  // Tokyo 23 wards
  const tokyoWards = [
    "千代田", "中央", "港", "新宿", "文京", "台東", "墨田", "江東", "品川", "目黑", "目黒", "大田",
    "世田谷", "渋谷", "澁谷", "中野", "杉並", "豊島", "豐島", "北", "荒川", "板橋", "練馬", "足立", "葛飾", "江戸川", "江戶川"
  ];
  for (const ward of tokyoWards) {
    if (cleanAddr.includes(ward)) {
      const normalized = ward
        .replace("目黒", "目黑")
        .replace("澁谷", "澀谷")
        .replace("渋谷", "澀谷")
        .replace("豊島", "豐島")
        .replace("江戸川", "江戶川");
      return { district: `${normalized}區`, region: "東京都" };
    }
  }

  // Fallback to station
  const cleanStation = (station || "").trim();
  if (!cleanStation) return null;
  if (cleanStation.includes("船橋")) return { district: "船橋市", region: "千葉" };
  for (const [dist, stations] of Object.entries(districtStations)) {
    if (stations.some(s => {
      const sName = normalizeStation(s.name);
      const cName = normalizeStation(cleanStation);
      return sName === cName || cName.includes(sName) || sName.includes(cName);
    })) {
      const isTokyo23 = /區$/.test(dist);
      const reg = dist === "川崎" || dist === "橫濱" ? "神奈川" : isTokyo23 ? "東京都" : "東京都";
      return { district: dist, region: reg };
    }
  }

  return null;
}

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
        occupancyStatus: `${extracted.occupancyStatus || ""} ${
          extracted.currentRent || extracted.annualIncome || extracted.grossYield ? "賃貸中" : ""
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

/**
 * 只允許自家網域從瀏覽器呼叫。
 *
 * 原本回 Access-Control-Allow-Origin: *，等於任何網站都能掛我們的圖紙分析當後端，
 * 費用算在我們頭上。預覽部署網域會變動，所以放行 *.vercel.app 與本機。
 * 額外網域可用 ALLOWED_ORIGINS（逗號分隔）設定。
 */
function resolveAllowedOrigin(origin: string | undefined): string | null {
  if (!origin) return null;
  const extra = String(process.env.ALLOWED_ORIGINS || "")
    .split(",").map(v => v.trim()).filter(Boolean);
  if (extra.includes(origin)) return origin;
  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== "https:" && protocol !== "http:") return null;
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]") return origin;
    if (hostname.endsWith(".vercel.app")) return origin;
    if (hostname === "linus-niceday-japan-realestate.vercel.app") return origin;
  } catch {
    return null;
  }
  return null;
}

export default async function handler(req: any, res: any) {
  const origin = req.headers?.origin as string | undefined;
  const allowedOrigin = resolveAllowedOrigin(origin);
  if (allowedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  // 帶著 Origin 卻不在白名單 = 別的網站的瀏覽器前端，直接拒絕。
  // 同源請求與伺服器端呼叫不會帶 Origin，因此不受影響。
  if (origin && !allowedOrigin) {
    return res.status(403).json({ error: "此來源未獲授權使用圖紙分析。" });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed. Use POST." });

  try {
    const files = validateFiles(req.body?.files);

    const ip = resolveClientIp(req);
    const limit = await getRateLimit(ip);
    res.setHeader("X-RateLimit-Limit", String(LISTING_CHECK_RATE_LIMIT));
    res.setHeader("X-RateLimit-Remaining", String(limit.remaining));
    if (limit.limited) {
      res.setHeader("Retry-After", String(limit.retryAfter));
      return res.status(429).json({ error: LISTING_CHECK_RATE_MESSAGE, retryAfter: limit.retryAfter });
    }

    // 分散式濫用（大量不同 IP）逐 IP 限流擋不住，這裡用全站每小時總量當費用保險絲。
    if (!isLocalRequest(ip) && !consumeGlobalQuota()) {
      res.setHeader("Retry-After", "600");
      return res.status(503).json({
        error: "圖紙分析目前使用量偏高，請稍後再試。",
        retryAfter: 600,
      });
    }

    const hasCoreFields = (fields: ExtractedListingFields) =>
      Boolean(fields.station.trim() || fields.layout.trim() || fields.rent.trim() || fields.salePrice.trim());

    const layoutText = typeof req.body?.layoutText === "string"
      ? req.body.layoutText.slice(0, MAX_LAYOUT_TEXT_CHARS)
      : "";

    let extracted = await extractListingFields(files, layoutText);
    if (!hasCoreFields(extracted)) {
      // 部分圖紙（常見於特定不動產軟體輸出、內嵌字型有問題的 PDF）偶爾會讓 Gemini
      // 這次抽取剛好四個核心欄位都槓龜；同一份檔案重試一次，實測能救回相當比例，
      // 成本只是多一次呼叫，比讓使用者重新上傳划算。
      console.warn("analyze-listing: 核心欄位皆為空，重試一次", {
        fileCount: files.length,
        mimeTypes: files.map(file => file.mimeType),
      });
      extracted = await extractListingFields(files, layoutText);
    }

    // 租賃與買賣核心欄位檢查
    if (!hasCoreFields(extracted)) {
      console.error("analyze-listing: 重試後仍無法讀出核心欄位", {
        fileCount: files.length,
        mimeTypes: files.map(file => file.mimeType),
      });
      return res.status(422).json({ error: "無法從這張圖片讀出物件資訊，請確認上傳的是物件概要書或図面。" });
    }

    // 租賃圖紙一律對敷金／礼金做一次聚焦的二次確認（見 verifyLeaseCharges）。
    // 不能只在「看起來可疑」時才確認：第一次抽取最常見的錯法是把「無」幻覺成
    // 「1ヶ月」，這個值和真實的 1ヶ月 在字串上無法區分，事後判斷攔不到。
    // 這兩個數字直接決定初期費用試算的結果，多一次小呼叫值得。
    // 只看 dealType 而不看 salePrice：買賣圖紙沒有這兩格，問了也是白問。
    if (extracted.dealType !== "sale") {
      const verified = await verifyLeaseCharges(files, { deposit: extracted.deposit, keyMoney: extracted.keyMoney });
      if (verified.deposit !== extracted.deposit || verified.keyMoney !== extracted.keyMoney) {
        console.info("analyze-listing: 敷金／礼金經二次確認修正", {
          before: { deposit: extracted.deposit, keyMoney: extracted.keyMoney },
          after: verified,
        });
      }
      extracted = { ...extracted, ...verified };
    }

    const rent = parseYenAmount(extracted.rent);
    const managementFee = parseYenAmount(extracted.managementFee);
    const salePrice = parseSalePrice(extracted.salePrice);
    const roomType = normalizeRoomType(extracted.layout);
    const stations = extracted.station
      .split(/[,，]/)
      .map(s => stripStationOperatorPrefix(s))
      .filter((s): s is string => Boolean(s));
    const walkTimes = extracted.walkTime.split(/[,，]/).map(w => w.trim());
    const area = parseArea(extracted.area);

    // 判斷是買賣圖紙還是租屋圖紙。
    //
    // 販売図面偶爾整格「価格」是空白（漏印、或寫「応相談」），這種圖上又常印著
    // 現行租金（オーナーチェンジ／集金代行），Gemini 看到賃料就容易回 dealType="rent"，
    // 整份報告會跑成租賃版型。實測ミュージックジョイ神楽坂同一張圖前後兩次判定不同。
    //
    // 這裡用「只會出現在買賣図面」的欄位當硬證據來覆蓋：
    // 修繕積立金與土地権利是屋主才需要負擔／持有的項目，租賃図面不會列；
    // 表面利回り與年間収入則是收益物件專有。兩項以上同時成立才覆蓋，
    // 避免單一欄位誤抓就把正常租屋圖判成買賣。
    const hasValue = (v: unknown) =>
      typeof v === "string" && v.trim() !== "" && !/^(?:なし|無|0|-|ー|―)$/i.test(v.trim());
    const saleOnlySignals = [
      hasValue(extracted.repairReserve),
      hasValue(extracted.repairFund),
      hasValue(extracted.landRights),
      hasValue(extracted.grossYield),
      hasValue(extracted.annualIncome),
      /オーナーチェンジ|集金代行|サブリース/i.test(`${extracted.occupancyStatus || ""}`),
    ].filter(Boolean).length;

    const requestedMode = req.body?.mode;
    const isSale = requestedMode === "sale"
      ? true
      : requestedMode === "rent"
      ? false
      : (extracted.dealType === "sale"
        || Boolean(salePrice && salePrice >= 10000000)
        || saleOnlySignals >= 2);

    const dealType = isSale ? "sale" : "rent";
    const audit = buildListingAudit(extracted, dealType);

    // 租賃分析
    let verdict = null;
    let range: RequestedRentRange | null = null;
    let initialCostEstimate = null;
    let initialCostMonths = null;

    if (rent !== null) {
      const totalMonthlyCost = rent + (managementFee ?? 0);

      // 1. 解析所在地行政區與都道府縣（At Home 全國公開租金市場）
      const locationInfo = resolveDistrictAndRegion(extracted.address, stations[0] ?? "");
      const district = locationInfo?.district ?? null;

      // 2. 從圖紙上的車站清單中，挑選有收錄在站內資料庫的有效車站（避免地方私鐵小站讓全域估價被判定為 unresolvedLocation）
      const validStations = stations.filter(s => {
        const q = normalizeStation(s);
        return Object.values(districtStations).some(stList =>
          stList.some(st => normalizeStation(st.name) === q)
        );
      });

      const criteria: Partial<RentSearchCriteria> = {
        roomType: roomType ?? "k1",
        district: district || undefined,
        districts: district ? [district] : undefined,
        station: validStations[0] ?? null,
        stations: validStations.length > 0 ? validStations : undefined,
      };

      const nationwideRent = locationInfo && roomType
        ? getNationwideRentBenchmark(locationInfo.region, locationInfo.district, roomType)
        : null;
      range = nationwideRent
        ? {
            low: nationwideRent.lowRentYen,
            median: nationwideRent.medianRentYen,
            high: nationwideRent.highRentYen,
            sampleCount: 1,
            basis: `${nationwideRent.district}・At Home 公開刊登行情`,
            segments: [{
              district: nationwideRent.district,
              low: nationwideRent.lowRentYen,
              median: nationwideRent.medianRentYen,
              high: nationwideRent.highRentYen,
            }],
            spread: false,
            sourceUrl: nationwideRent.sourceUrl,
            sourceLabel: nationwideRent.sourceLabel,
            sourceDate: nationwideRent.capturedAt,
          }
        : roomType ? estimateRequestedRent(criteria as RentSearchCriteria) : null;

      // 3. Fallback 防護網：若 estimateRequestedRent 仍為 null，但我們已知行政區與房型，直接由 rentRates / At Home 快照推估
      if (!range && district && roomType) {
        const normDist = normalizeAddressText(district);
        const rate = rentRates.find(r => {
          const rDist = normalizeAddressText(r.district);
          return rDist.includes(normDist) || normDist.includes(rDist);
        });
        if (rate) {
          const rentValMan = parseFloat((rate as any)[roomType] || rate.k1 || "0");
          if (rentValMan > 0) {
            const median = Math.round(rentValMan * 10000);
            const low = Math.round(median * 0.88 / 1000) * 1000;
            const high = Math.round(median * 1.12 / 1000) * 1000;
            range = {
              low,
              median,
              high,
              sampleCount: 1,
              basis: `${rate.district} 行情基準`,
              segments: [{ district: rate.district, low, median, high }],
              spread: false,
            } as RequestedRentRange;
          }
        }
      }

      // 計算最短徒步分鐘數與建築屋齡（供多因子行情校準）
      const minWalkMinutes = (() => {
        const numbers = walkTimes
          .map(w => {
            const m = w.match(/(\d+)/);
            return m ? Number(m[1]) : null;
          })
          .filter((n): n is number => n !== null);
        return numbers.length > 0 ? Math.min(...numbers) : null;
      })();

      const ageYears = parseAgeYears(extracted.age);
      const floorInfo = parseFloorInfo(
        extracted.floor,
        `${extracted.buildingFloors ? `${extracted.buildingFloors}階建` : ""} ${extracted.structure || ""} ${extracted.specialNotes || ""}`
      );

      verdict = buildListingPriceVerdict(totalMonthlyCost, range, {
        ageYears,
        walkMinutes: minWalkMinutes,
        areaSqm: area,
        roomType,
        structure: extracted.structure,
        floor: floorInfo.floor,
        totalFloors: floorInfo.totalFloors,
        specialNotes: extracted.specialNotes,
        otherConditions: extracted.otherConditions,
        freeRent: extracted.freeRent,
        facilities: extracted.facilities,
      });

      const keyMoney = parseMonthsOrYen(extracted.keyMoney, rent);
      const deposit = parseMonthsOrYen(extracted.deposit, rent);
      initialCostMonths = (keyMoney !== null || deposit !== null)
        ? ((keyMoney ?? 0) + (deposit ?? 0)) / rent
        : null;

      initialCostEstimate = calculateInitialCostBreakdown({
        rent,
        managementFee,
        keyMoney,
        deposit,
        extractedKeyMoney: extracted.keyMoney,
        extractedDeposit: extracted.deposit,
        extractedGuaranteeFee: extracted.guaranteeFee,
        extractedLockReplacementFee: extracted.lockReplacementFee,
        extractedCleaningFee: extracted.cleaningFee,
        extractedInsuranceFee: extracted.insuranceFee,
        extractedSupportFee: extracted.supportFee,
        extractedFreeRent: extracted.freeRent,
        extractedShikibiki: extracted.shikibiki,
        specialNotes: extracted.specialNotes,
        rentalConditions: extracted.rentalConditions,
        marketVerdict: audit.blocksComparison ? null : verdict,
      });
    }

    // 買賣分析
    let saleAnalysis = null;
    if (salePrice !== null) {
      saleAnalysis = buildSaleAnalysis({
        extracted,
        salePriceYen: salePrice,
        areaSqm: area,
        stations,
        walkTimes,
        layout: extracted.layout,
      });
    }

    await recordUsage("listing-check", requestCountry(req));

    if (audit.blocksComparison) {
      range = null;
      verdict = { status: "待核對", headline: "關鍵資料待核對，暫停行情判定", detail: "請先查看資料核對清單中的價格、面積或必要欄位；暫估費用不代表已確認報價。" };
    }

    return res.status(200).json({
      dealType,
      extracted,
      audit,
      parsed: {
        rent,
        deposit: rent === null ? null : parseMonthsOrYen(extracted.deposit, rent),
        keyMoney: rent === null ? null : parseMonthsOrYen(extracted.keyMoney, rent),
        managementFee,
        salePrice,
        roomType,
        area,
        structure: normalizeStructure(extracted.structure),
        totalUnits: parseUnitsCount(extracted.totalUnits),
        repairReserve: parseEffectiveRepairReserve(extracted.repairReserve, extracted.specialNotes),
        repairFund: parseYenAmount(extracted.repairFund),
        otherMonthlyFees: parseMandatoryMonthlyFees(extracted.otherMonthlyFees),
      },
      range,
      verdict,
      initialCostMonths,
      initialCostEstimate,
      saleAnalysis,
      model: "gemini-3.8-flash",
    });
  } catch (error: any) {
    if (error instanceof ListingUploadError) {
      return res.status(400).json({ error: error.message });
    }
    console.error("Gemini analyze-listing error:", error);
    const missingKey = String(error?.message || "").includes("GEMINI_API_KEY");
    return res.status(500).json({
      error: missingKey
        ? "圖紙健檢服務尚未設定 Gemini API 金鑰。"
        : "AI 暫時無法讀取這張圖片，請稍後再試。",
    });
  }
}
