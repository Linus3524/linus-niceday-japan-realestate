import { GoogleGenAI, PartMediaResolutionLevel as MediaResolutionLevel, Type } from "@google/genai";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { districtStations, rentRates } from "../src/data/housingMarket.js";
import { getNationwideRentBenchmark } from "../src/data/nationwideRentMarket.js";
import { auditKeys, buildListingAudit } from "../src/lib/listingAudit.js";
import {
  normalizeMonthUnit,
  normalizeRoomType,
  normalizeStructure,
  parseAgeYears,
  parseArea,
  parseEffectiveRepairReserve,
  parseFloorInfo,
  parseMandatoryMonthlyFees,
  parseMonthsOrYen,
  parseSalePrice,
  parseUnitsCount,
  parseYenAmount,
  stripStationOperatorPrefix
} from "../src/lib/listingExtraction.js";
import { reconcileRentalListingText } from "../src/lib/rentalListingReconciliation.js";
import { isPlausibleStationToken } from "../src/lib/transitPatterns.js";
import { parseTransitAccessLegs, parseTransitStations, serializeTransitLegs, transitLegTotalMinutes, type TransitLeg } from "../src/lib/transitParser.js";
import { type RentSearchCriteria } from "../src/lib/rentAnalysis.js";
import { buildListingPriceVerdict, estimateRequestedRent, type RequestedRentRange } from "../src/lib/requirementVerdict.js";
import {
  normalizeAddressText,
  normalizeStation,
  resolveDistrictAndRegion,
} from '../src/lib/server/listing/marketLocation.js';
import { calculateInitialCostBreakdown } from '../src/lib/server/listing/rentalInitialCost.js';
import { buildSaleAnalysis } from '../src/lib/server/listing/saleAnalysis.js';
import type { ExtractedListingFields } from '../src/lib/server/listing/types.js';
import {
  reconcileSpecialSaleFields,
  statedAnnualPropertyTax,
  statedCombinedAnnualPropertyTax,
} from "../src/lib/specialSaleAnalysis.js";
import { recordUsage, requestCountry } from "../src/lib/usageMetrics.js";
export { resolveDistrictAndRegion } from '../src/lib/server/listing/marketLocation.js';
export { calculateInitialCostBreakdown } from '../src/lib/server/listing/rentalInitialCost.js';
export { buildSaleAnalysis } from '../src/lib/server/listing/saleAnalysis.js';
export type { ExtractedListingFields, InitialCostBreakdownItem, InitialCostEstimate } from '../src/lib/server/listing/types.js';

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
const LISTING_CHECK_RATE_LIMIT = 3;
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
const GLOBAL_HOURLY_CAP = Number(process.env.LISTING_CHECK_GLOBAL_HOURLY_CAP || 120);
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

function leaseTermValue(row: string, labels: string[]) {
  // normalizeMonthUnit：圖紙常把月數寫成「1ケ月」（正常大小的ケ），
  // 統一成「ヶ月」後下面的比對只需要認一種寫法。
  const normalized = normalizeMonthUnit(row.normalize("NFKC"));
  const labelPattern = labels.join("|");
  return normalized.match(new RegExp(`(?:${labelPattern})\\s*[:：]?\\s*((?:\\d+(?:\\.\\d+)?\\s*(?:ヶ月|ヵ月|カ月|個月|万円|円))|なし|無し|無|不要)`, "i"))?.[1]?.trim() || null;
}

export interface LeaseChargeFields {
  deposit: string;
  keyMoney: string;
  renewalFee: string;
  guaranteeFee: string;
}

/**
 * 決定二次確認的回答要不要採用。抽成獨立純函式以便回歸測試——
 * 這裡的採納規則每一條都對應一種實際看過的錯法，不能只靠人工複查。
 *
 * 一律「不確定就沿用第一次結果」：二次確認的職責是修正明確的誤讀，
 * 不是在沒有把握時另外製造一個新的錯誤答案。
 */
export function applyLeaseChargeVerification(parsed: unknown, current: LeaseChargeFields): LeaseChargeFields {
  const raw = (parsed ?? {}) as Record<string, unknown>;
  const text = (value: unknown) => typeof value === "string" ? value.trim() : "";

  // 敷金／礼金：讀到「新賃料」「更新」就是抓到隔壁的更新料格，不採用。
  const pick = (fresh: unknown, fallback: string) => {
    const value = text(fresh);
    if (!value || /新賃料|更新/.test(value)) return fallback;
    return value;
  };
  // 保証料不套用上面的過濾：它的值常含「月額賃料の30%」等字樣，
  // 與敷金礼金的串格特徵無關，只檢查空值即可（可用性另由 guaranteeUsable 判斷）。
  const pickRaw = (fresh: unknown, fallback: string) => text(fresh) || fallback;

  const guarantee = text(raw.guaranteeFee);
  // 只有保證公司名稱而沒有費用數字時不採用：「GTN」是公司名不是金額，
  // 填進去會讓初期費用試算多出一筆無法計算的待確認費用。
  const guaranteeUsable = /[0-9０-９]/.test(guarantee) || /^(なし|無|無し|不要)$/.test(guarantee);

  // 更新料的串格防線。
  //
  // 刻意「不」比對「值是否與敷金／礼金相同」：敷1・礼1・更新1 是日本賃貸最常見的
  // 組合之一，用值相同判定串格會把大量正確資料誤殺。改為與上面 pick 對稱的作法——
  // 只擋帶有其他格子專屬標記、在更新料格內不可能出現的值。
  const renewalFresh = text(raw.renewalFee);
  const renewalUsable = (() => {
    if (!renewalFresh) return false;
    // 自己標了「更新」就是更新料格本身的內容（如「更新料1ヶ月」），一律採用。
    // 「再契約料」是定期借家版的同一筆費用（XEBEC大手町 等圖紙寫「再契約料 新賃料の1ヶ月」），
    // 同樣視為這一格自己的內容；不先放行的話，它會落到下面的標籤檢查，
    // 一旦寫成「再契約料（礼金1ヶ月相当）」這種對照說明就會被整筆擋掉。
    if (/更新|再契約/.test(renewalFresh)) return true;
    // 讀到敷金／礼金／保証金／敷引／償却／保証料等其他費用項目的標籤，
    // 代表抓到隔壁那一格，不是更新料。
    if (/敷金|礼金|保証金|敷引|償却|保証会社|保証料/.test(renewalFresh)) return false;
    // 與同一次回答的保証料完全相同且帶百分比：更新料慣例以月數或金額計，
    // 比例是保証料的寫法，兩格同值幾乎必然是保証料那格污染過來的。
    // （「家賃の50%」這種以租金為基準的更新料寫法不受影響——
    //   它與保証料值不會剛好一字不差。）
    if (/[%％]/.test(renewalFresh) && renewalFresh === guarantee) return false;
    return true;
  })();

  return {
    deposit: pick(raw.deposit, current.deposit),
    keyMoney: pick(raw.keyMoney, current.keyMoney),
    renewalFee: renewalUsable ? renewalFresh : current.renewalFee,
    guaranteeFee: guaranteeUsable ? pickRaw(raw.guaranteeFee, current.guaranteeFee) : current.guaranteeFee,
  };
}

/**
 * 敷金／礼金／更新料／保証会社費用的聚焦二次確認。
 *
 * 40 個欄位的大表格抽取，在密集的日文費用表格上很容易對位錯——實測アクアリガーレ
 * 西日暮里（純掃描 PDF，沒有文字層可以靠座標對位）的「敷金｜無｜礼金｜無」這一列，
 * 五次抽取裡四次專屬格子回空字串、一次把下一格「更新料 1.5ヶ月(新賃料)」錯抓成礼金，
 * 對客人來說前者顯示「待確認」、後者憑空多算十幾萬円初期費用，都不能接受。
 *
 * 單獨只問「這幾格印什麼字」的窄問題，準確率遠高於一次抽 40 個欄位。租賃圖紙一律
 * 執行，不做「可疑才確認」：最常見的錯法是把「無」幻覺成「1ヶ月」，和真實值無法
 * 區分。多一次小呼叫，換到的是初期費用試算最關鍵的幾個數字。
 *
 * 更新料與保証会社費用一併在同一次呼叫確認，不另外發請求：
 * - 兩者與敷金礼金同在一張費用表、彼此相鄰，是同一個對位錯高風險區。上面那起
 *   「更新料被錯抓成礼金」的案例，反過來說明更新料自己那一格同樣可能被鄰格污染，
 *   而目前只在礼金側用 `/新賃料|更新/` 擋，更新料本身抓錯沒有任何防線。
 * - 更新料是租期內的未來支出、保証会社費用是簽約當下就要付的初期費用，
 *   兩者都直接進試算；錯一格就是幾萬到十幾萬円的差距。
 * - 保証会社費用另有「外国人プラン」比例更高的常見陷阱，窄問題才問得清楚。
 */
async function verifyLeaseCharges(
  files: UploadedFile[],
  current: { deposit: string; keyMoney: string; renewalFee: string; guaranteeFee: string },
): Promise<{ deposit: string; keyMoney: string; renewalFee: string; guaranteeFee: string }> {
  const prompt = `
    這是一張日本賃貸物件的図面。只需要回答四個問題，其他內容一律不要管：

    1. 費用表格裡標示「敷金」的那一格，實際印的是什麼字？
    2. 費用表格裡標示「礼金」的那一格，實際印的是什麼字？
    3. 圖紙上標示「更新料」（或「更新費」「契約更新料」「再契約料」「再契約手数料」）
       的那一格，實際印的是什麼字？
    4. 圖紙上標示保證公司費用（「保証会社」「保証料」「初回保証料」「保証委託料」
       「家賃保証」等）的那一格，實際印的是什麼字？

    先判斷這張圖紙的表格是哪一種排版，再依該排版去找值：
    (A) 橫向並排：「敷金｜值｜礼金｜值」，值在標籤的正右方。
    (B) 直向欄位：標題列橫排（例如「号室｜家具｜家賃/共益費｜礼金｜専有面積」），
        各筆資料排在標題的下方。此時值在標籤的正下方，而且與標籤左右對齊。
        レオパレス 等連鎖品牌的図面常屬這種，標題與值可能相隔頗遠，中間還夾著其他文字。
    兩種都要嘗試。找不到正右方的值時，務必再看正下方；不可因為右方沒有值就回空字串。

    判讀規則（敷金・礼金）：
    - 緊鄰的「敷引」「償却金」「保証金」「更新料」是不同項目；它們的值
      （常是「-」或「1.5ヶ月(新賃料)」之類）絕對不能填進敷金或礼金。
    - 格子印「無」「無し」「なし」「0」「0円」「-」→ 回答「無」。
    - 格子印月數或金額（如「1ヶ月」「115,000円」）→ 原樣回答。
    - 格子只印一個沒有單位的數字（例如「1」「2」「1.5」）→ 回答「○ヶ月」。
      日本賃貸図面的費用表常把「ヶ月」單位印在表頭或省略，格子內僅留數字；
      這種數字是月數，不是日圓金額。例如礼金格印「1」就回答「1ヶ月」。
      但若該數字明顯是金額（有位數分隔逗號或四位數以上，如「45,000」「10000」），
      則照原文當金額回答。
    - 格子真的空白、或整份圖紙找不到這一格 → 回答空字串。不要猜。

    判讀規則（更新料 renewalFee）：
    - 更新料是「契約更新時」才發生的費用，與簽約當下支付的敷金・礼金是不同項目，
      絕對不可互相填入。敷金或礼金格子的值不得當成更新料。
    - 定期借家的圖紙寫的是「再契約料」「再契約手数料」而不是「更新料」。
      這是同一種「想繼續住就要付」的費用，一樣填進這一格，並保留原本的標籤
      （例如「再契約料 新賃料の1ヶ月」）。不可因為欄名不同就回答「なし」。
    - 常見寫法：「新賃料1ヶ月」「1ヶ月(新賃料)」「賃料1ヶ月分」「55,000円」「なし」。
      括號內的「新賃料」「新家賃」是計算基準的說明，屬於這一格的內容，請連同抄下。
    - 更新料常不在費用表格內，而寫在「契約期間」「取引条件」「備考」欄位裡
      （例如「普通賃貸借2年　更新料 新賃料1ヶ月」）。表格找不到時務必到這些欄位找。
    - 印「無」「なし」「0円」「不要」→ 回答「なし」。
    - 只抄更新料那一格的值，不要把「敷金」「礼金」「保証金」「敷引」「償却」
      或保證公司費用的值填進來；也不要把這些項目的標籤一起抄進答案。
      敷金1ヶ月・礼金1ヶ月・更新料1ヶ月 這種三格同值是常見情形，
      確實讀到 1ヶ月 就照實回答，不必因為與敷金相同而改答。
    - 整份圖紙完全沒提到更新料 → 回答空字串。不可因為「一般慣例是1個月」就填 1ヶ月。

    判讀規則（保証会社費用 guaranteeFee）：
    - 這一格的值可能是「比例」也可能是「金額」，兩種都要照原文回答：
      比例例如「50%」「総賃料50%」「月額賃料の30%」；金額例如「4.5万円」「45,000円」。
    - 保證公司有三種收費結構，圖紙常同時列出兩種以上，**全部都要抄下並保留原本的
      「初回」「月額」「年間」標記**，用「、」分隔。這些標記決定費用算在簽約當下
      還是每月／每年，絕對不可省略：
        初回保証料（簽約時一次性）→ 例如「初回50%」
        月額保証料・月額利用料（按月與租金一起付）→ 例如「月額1%」「月額賃料の1%」
        年間保証料・継続保証委託料（每年或每兩年）→ 例如「年間10,000円」
      GTN、Casa、日本セーフティー 等常見「初回100%＋月額1%」這種組合，
      正確寫法是「GTN 初回100%、月額1%」，不可只寫「100%」或只寫「1%」。
    - 若圖紙只有月額而沒有初回，就只回答月額並保留標記（例如「月額1%」），
      不可把月額的數字當成初回填上去。
    - ⚠️「月額」有兩種相反用法，一律照圖紙原文抄寫，不要自行改寫：
      「月額総賃料の30%」「月額賃料の50%」的「月額」是在講計算基準（以月租總額為基數）
      的一次性初回保證料；「月額1%」「月額保証料」的「月額」才是每月支付。
      原文怎麼寫就怎麼抄，不可把前者改寫成「月額30%」或替後者補上「初回」。
    - 若圖紙另列「外国人プラン」「外国籍の方」等專用方案且比例不同，
      優先回答外國人方案的值（例如「外国人プラン80%」），並連同方案名稱一起抄下。
    - 保證公司名稱（如「GTN」「日本セーフティー」「Casa」）若與比例印在一起，
      可一併抄下（例如「GTN100%」）；但只有公司名稱、沒有任何費用數字時，
      回答空字串——公司名稱不是費用。
    - 印「無」「なし」「不要」→ 回答「なし」。
    - 整份圖紙找不到保證公司費用 → 回答空字串。不要用行情慣例推算。
  `;

  // 有圖就只送圖、不送 PDF。實測純掃描 PDF 跟 JPEG 一起送時，Gemini 對 PDF 內部
  // 點陣化的解析度不夠，會把清楚的 JPEG 一起拖下水（五次四錯）；只送 2200px JPEG
  // 則五次全對。沒有圖的情況（前端轉圖失敗）才退回送原檔。
  const imageFiles = files.filter(file => file.mimeType.startsWith("image/"));
  const inputs = imageFiles.length ? imageFiles : files;

  try {
    const response = await getAiClient().models.generateContent({
      model: "gemini-3.8-flash",
      contents: { parts: [...inputs.map(toInlinePart), { text: prompt }] },
      config: {
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            deposit: { type: Type.STRING, description: "敷金格子內實際印的字；免收回「無」；空白回空字串" },
            keyMoney: { type: Type.STRING, description: "礼金格子內實際印的字；免收回「無」；空白回空字串" },
            renewalFee: { type: Type.STRING, description: "更新料實際印的字，例如 新賃料1ヶ月；定期借家寫「再契約料」時亦填此欄並保留該標籤；免收回「なし」；未記載回空字串" },
            guaranteeFee: { type: Type.STRING, description: "保證料實際印的字，保留初回／月額／年間標記並用「、」分隔（如 初回50%、月額1%）；免收回「なし」；未記載回空字串" },
          },
          required: ["deposit", "keyMoney", "renewalFee", "guaranteeFee"],
        },
      },
    });
    const parsed = JSON.parse(response.text || "{}");
    return applyLeaseChargeVerification(parsed, current);
  } catch (error) {
    console.warn("analyze-listing: 敷金／礼金／更新料／保証料二次確認失敗，沿用第一次結果", error);
    return current;
  }
}

/**
 * 買賣圖紙售價、管理費、修繕積立金與土地權利之聚焦二次確認。
 *
 * 買賣圖紙（販売図面／マイソク）上的「販売価格」、「管理費」、「修繕積立金」、「土地権利」、「現況」
 * 是買賣行情評估、持有成本計算、大樓健康度診斷與自住/投資收益判斷的最核心數字。
 *
 * 在密集的數值表格中，AI 有時會發生數字錯位（如把修繕積立金抓成管理費、漏讀價格改定、
 * 漏掉億或萬字元、或將借地權誤判為所有權）。
 *
 * 針對買賣圖紙一律執行專注二次確認，確保關鍵財務與權利欄位的精確度。
 */
async function verifySaleCoreCharges(
  files: UploadedFile[],
  current: {
    salePrice: string;
    managementFee: string;
    repairReserve: string;
    landRights: string;
    occupancyStatus: string;
  },
): Promise<{
  salePrice: string;
  managementFee: string;
  repairReserve: string;
  landRights: string;
  occupancyStatus: string;
}> {
  const prompt = `
    這是一份日本不動產買賣販売図面（マイソク／物件概要書／中古マンション図面）。
    請專注於確認以下 5 個最關鍵的買賣核心欄位，逐字核對圖面上實際印出的字，不要猜測或推算：

    1. salePrice（販売価格）：
       - 請精準讀出總售價（例如 "7,280万円"、"3,480万円(税込)"、"1億2,800万円"、"4,990万" 等）。
       - 特別注意：若有「新価格」「価格改定」等標籤，請以改定後的最新售價為準。
       - 逐位核對數字的每一位，不可更動數字。
    2. managementFee（管理費）：
       - 大樓月額管理費（例如 "14,200円"、"14200"、"1.42万円"）。
       - 若整棟透天/土地無管理費，填 "なし" 或 "0円"。若圖面未記載填空字串。
    3. repairReserve（修繕積立金）：
       - 大樓月額修繕積立金（例如 "8,500円"、"8500"、"8,500円(2026年改定後)"）。
       - 若圖面同時列出目前與改定後金額，請優先保留改定後金額或完整原文。
       - 若未記載或透天/土地無此項填空字串。
    4. landRights（土地権利）：
       - 土地權利種類（例如 "所有権"、"借地権"、"定期借地権"、"旧法賃借権"、"地上権" 等）。
    5. occupancyStatus（現況／引渡）：
       - 目前使用狀態（例如 "空室"、"賃貸中"、"オーナーチェンジ"、"居住中"、"即時引渡可" 等）。
  `;

  const imageFiles = files.filter(file => file.mimeType.startsWith("image/"));
  const inputs = imageFiles.length ? imageFiles : files;

  try {
    const response = await getAiClient().models.generateContent({
      model: "gemini-3.8-flash",
      contents: { parts: [...inputs.map(toInlinePart), { text: prompt }] },
      config: {
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            salePrice: { type: Type.STRING, description: "販売価格實際印的字（含萬/億/税込/税抜），改定以新價格為準" },
            managementFee: { type: Type.STRING, description: "月額管理費實際印的字" },
            repairReserve: { type: Type.STRING, description: "月額修繕積立金實際印的字" },
            landRights: { type: Type.STRING, description: "土地權利（所有権/借地権等）" },
            occupancyStatus: { type: Type.STRING, description: "現況（空室/賃貸中/オーナーチェンジ/居住中等）" },
          },
          required: ["salePrice", "managementFee", "repairReserve", "landRights", "occupancyStatus"],
        },
      },
    });
    const parsed = JSON.parse(response.text || "{}");
    const pick = (fresh: unknown, fallback: string) => {
      const value = typeof fresh === "string" ? fresh.trim() : "";
      if (!value) return fallback;
      return value;
    };
    return {
      salePrice: pick(parsed.salePrice, current.salePrice),
      managementFee: pick(parsed.managementFee, current.managementFee),
      repairReserve: pick(parsed.repairReserve, current.repairReserve),
      landRights: pick(parsed.landRights, current.landRights),
      occupancyStatus: pick(parsed.occupancyStatus, current.occupancyStatus),
    };
  } catch (error) {
    console.warn("analyze-listing: 買賣核心欄位二次確認失敗，沿用第一次結果", error);
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
  let legs: TransitLeg[] = [];
  if (Array.isArray(extracted.transitLegs) && extracted.transitLegs.length > 0) {
    legs = extracted.transitLegs
      .filter((leg: any) => leg && typeof leg.stationName === "string" && leg.stationName.trim())
      .map((leg: any) => ({
        lineName: String(leg.lineName || "").trim(),
        stationName: stripStationOperatorPrefix(String(leg.stationName).replace(/[「」『』【】\[\]［］駅]/gu, "").trim()),
        walkMin: typeof leg.walkMin === "number" && Number.isFinite(leg.walkMin) ? leg.walkMin : null,
        busMin: typeof leg.busMin === "number" && Number.isFinite(leg.busMin) ? leg.busMin : undefined,
        busStop: typeof leg.busStop === "string" && leg.busStop.trim() ? leg.busStop.trim() : undefined,
      }))
      .filter(leg => Boolean(leg.stationName) && isPlausibleStationToken(leg.stationName));
  }
  if (!legs.length) {
    legs = parseTransitAccessLegs(extracted.transitAccess);
  }
  if (!legs.length) return extracted;
  // legs 是事實來源；station／walkTime 由它序列化而來，因此兩者必定等長。
  // 先前這兩個欄位各自維護，某一層對其中一個去重就會靜默錯位（2026-09 的漏失 bug）。
  return { ...extracted, transitLegs: legs, ...serializeTransitLegs(legs) };
}

/**
 * 圖紙一律以 medium 解析度送出。
 *
 * 官方對 PDF 的建議值即為 medium（「quality typically saturates at medium，
 * 提高到 high 對標準文件的 OCR 結果幾乎沒有改善」），實測也支持：
 * 以レオパレス図面（2200px JPEG 與原始 PDF）各跑 5 次，預設／medium／high
 * 在礼金、家賃、専有面積、鍵交換費、退去清掃費、保証委託料、火災保険、
 * 住所、築年數等欄位全部 5/5 相同，但 medium 的 prompt token 比預設少
 * 約 43～47%（圖片 1307→747、1197→637）。
 *
 * 也就是說預設值對這類單頁図面等同 high，多付的 token 換不到準確度。
 * 小格子判讀的瓶頸從來不是解析度，而是提示詞有沒有講清楚要去哪裡找值。
 */
function toInlinePart(file: UploadedFile) {
  return {
    inlineData: file,
    mediaResolution: { level: MediaResolutionLevel.MEDIA_RESOLUTION_MEDIUM },
  };
}

/**
 * 從圖紙文字層取出「站名＋徒歩分鐘」的集合，作為 AI 漏抄的校驗基準。
 *
 * ⚠️ 這個函式刻意**不做去重、也不回傳數量**，理由見下。
 *
 * 不能直接數「徒歩X分」的出現次數——販売図面在交通欄以外還有很多地方寫徒歩：
 * 周辺環境（スーパー 徒歩3分）、備考（最寄駅まで徒歩7分）、生活環境
 * （小学校 徒歩8分、商店街 徒歩4分）。全部算進去會讓一份只有 2 條動線的
 * 圖紙被判成 3～4 條，前端於是跳出「可能有路線未被完整讀取」的假警報，
 * 反而讓使用者不信任真正的漏抄提醒。
 *
 * 行過濾（必須同時有車站標記與徒歩時間）能擋掉生活設施，但擋不掉重複刊載：
 * 販売図面很常把最強的那條動線印兩次，頁首標題橫幅一次、交通欄一次
 * （「the trias magome　都営浅草線「西馬込」徒歩4分」）。兩行條件全符合。
 *
 * 曾經試圖用「路線＋站名＋分鐘」去重再比數量，但那個方向本身是錯的：
 * 數量比較要求去重 100% 精準，而去重恰恰是純 regex 最不擅長的語意判斷——
 * 重複行常省略路線名（標語只寫「東武練馬駅徒歩6分」），識別碼就對不上。
 * 實測兩份真實圖紙連錯兩次（trias magome 2→3、excelan 3→4）。
 *
 * 改為集合涵蓋比較後，去重精度變得完全不重要：
 * 問的是「圖紙上有沒有哪個『站名＋分鐘』完全不在解析結果裡」，
 * 同一條動線重複出現 N 次也只是同一個 key，只要被涵蓋就不觸發。
 * 真正的漏抄（整條路線沒讀到）則必然留下一個未涵蓋的 key，照樣抓得到。
 *
 * 站名以「正規化後包含」比對，寬鬆一階：圖紙寫法與 AI 輸出常有
 * 「駅」「ケ/ヶ」「全半形」等差異，寧可放過也不要誤報。
 */
export interface FlyerTransitStop {
  /** 正規化後的站名，用於與解析結果比對。 */
  station: string;
  /** 徒歩分鐘數。 */
  walkMin: number;
  /** 原始行文字，供 console.warn 診斷用。 */
  sourceLine: string;
}

export function extractFlyerTransitStops(layoutText: string): FlyerTransitStop[] {
  const STATION_MARK = /(?:駅|站|線|ライン|エクスプレス|モノレール|新交通)/;
  const WALK_MARK = /徒歩\s*\d+\s*分/;

  /**
   * 備考／宣傳文案行：雖然帶「駅」字，但講的是同一條動線而非新增動線。
   * 例：「備考 最寄駅まで徒歩7分の好立地」「駅近徒歩5分の物件です」。
   * 交通欄的動線是「站名＋時間」的條列，不會有這些敘述性語彙。
   */
  const PROSE_MARK = /(?:備考|特記|コメント|セールス|ポイント|最寄駅まで|まで徒歩|好立地|物件です|閑静)/;

  const stops: FlyerTransitStop[] = [];

  // 先做 NFKC 再折疊部首字元：PDF 文字層的「⻄」「⻝」等與一般漢字外觀相同
  // 但碼位不同，不折疊的話站名永遠比不相等（見 normalizeStationKey）。
  for (const rawLine of foldCjkRadicals(layoutText.normalize("NFKC")).split(/\r?\n/)) {
    if (!WALK_MARK.test(rawLine)) continue;
    if (!STATION_MARK.test(rawLine)) continue;
    // 「バス停」「バス」屬接駁動線，仍算一條；但純設施行（小学校・スーパー）
    // 沒有車站標記，上一個條件已擋掉。
    if (PROSE_MARK.test(rawLine)) continue;

    // 同一行可能寫了兩條動線（「A駅 徒歩5分／B駅 徒歩8分」），逐一取出。
    for (const match of rawLine.matchAll(/徒歩\s*(\d+)\s*分/g)) {
      const station = normalizeStationKey(identifyStation(rawLine.slice(0, match.index)));
      // 取不出站名就不能拿來校驗——沒有比對依據時一律放過，不猜。
      if (!station) continue;
      stops.push({ station, walkMin: Number(match[1]), sourceLine: rawLine.trim() });
    }
  }

  return stops;
}

/**
 * 站名比對用的正規化。
 *
 * ⚠️ 絕不可在這裡剝除「東武」「京王」等營運商前綴：站名本身就可能以營運商名
 * 開頭（東武練馬、京王八王子、東急多摩川），剝掉會把「東武練馬」變成「練馬」，
 * 那是另一個真實存在的車站。實測 excelan 圖紙因此讓漏抄 2 條完全不報。
 * 前綴差異改由 isStopCovered 的雙向包含比對吸收。
 *
 * 另需處理 PDF 文字層混入的部首字元：日文圖紙嵌入字型時，
 * 「西」偶爾會被存成部首「⻄」(U+2EC4)。兩者外觀相同、碼位不同，
 * 且 CJK Radicals Supplement 這一段 **NFKC 與 NFKD 都不會轉換**，
 * 必須明確對照（實測 the trias magome 就是栽在這個字上而誤報）。
 */
function normalizeStationKey(station: string): string {
  return foldCjkRadicals(station.normalize("NFKC"))
    .replace(/[駅站]$/u, "")
    .replace(/ヶ/gu, "ケ")
    .replace(/\s/gu, "")
    .toLowerCase();
}

/**
 * 把 CJK 部首補充區（U+2E80–U+2EFF）的字元折回一般漢字。
 *
 * Kangxi Radicals（U+2F00–U+2FDF）NFKC 已能處理，這裡補的是 NFKC 覆蓋不到、
 * 但在日文 PDF 文字層實際出現過的常見站名用字。
 */
const CJK_RADICAL_FOLD: Record<string, string> = {
  "⻄": "西", "⺟": "母", "⻑": "長", "⻘": "青", "⻩": "黄",
  "⻢": "馬", "⻱": "亀", "⺠": "民", "⻝": "食", "⻤": "鬼",
};
function foldCjkRadicals(text: string): string {
  return text.replace(/[\u2E80-\u2EFF]/gu, char => CJK_RADICAL_FOLD[char] ?? char);
}

/**
 * 圖紙上的某個「站名＋分鐘」是否已被解析結果涵蓋。
 *
 * 站名比對是**單向**包含：只容許 leg 比圖紙長（AI 輸出殘留「JR」前綴時
 * 「JR両国」仍能對上圖紙的「両国」），但不容許 leg 比圖紙短。
 * 雙向包含會讓「練馬」被判定為涵蓋了圖紙上的「東武練馬」——那是兩個不同車站，
 * 真的抓錯站時反而靜默。分鐘數則允許 ±1 的排版誤差。
 * 這裡的目標是「整條路線完全沒讀到」這種大事故，不是逐字校對。
 */
export function isStopCovered(stop: FlyerTransitStop, legs: TransitLeg[]): boolean {
  return legs.some(leg => {
    const legStation = normalizeStationKey(leg.stationName || "");
    if (!legStation) return false;
    if (!legStation.includes(stop.station)) return false;
    const legMin = transitLegTotalMinutes(leg);
    // 解析不出分鐘數時只認站名，避免因缺值誤報。
    if (legMin === null) return true;
    return Math.abs(legMin - stop.walkMin) <= 1;
  });
}

/** 從「徒歩X分」左側文字取最靠近的站名，作為動線識別的一部分。 */
function identifyStation(prefix: string): string {
  // 圖紙站名幾乎都寫在括號內（「西馬込」）；取最後一個即為本段動線的站。
  const quoted = [...prefix.matchAll(/[「『]([^」』]{1,12})[」』]/g)];
  if (quoted.length) return quoted[quoted.length - 1][1].replace(/\s/gu, "");

  // 無括號版型（「馬込駅 徒歩5分」）退而求其次，取「駅」前的連續字串。
  const bare = [...prefix.matchAll(/([^\s、,／/｜|（(]{1,12})[駅站]/g)];
  if (bare.length) return bare[bare.length - 1][1].replace(/\s/gu, "");

  // 連「駅」都省略的版型（「都営三田線 西台 徒歩28分」）：
  // 取路線名之後、徒歩之前的那一段文字當站名。excelan 圖紙的第 2、3 條動線
  // 就是這種寫法，不支援的話整條漏抄都偵測不到。
  const afterLine = prefix.match(
    /(?:線|ライン|エクスプレス|モノレール|新交通)\s*([^\s、,／/｜|（(]{1,12})\s*$/u
  );
  if (afterLine) return afterLine[1].replace(/\s/gu, "");

  return "";
}

/**
 * 圖片圖紙的費用表轉寫（PDF 以外的路徑專用）。
 *
 * layoutText 只有 PDF 有——它來自文字層座標還原。單張圖片（拍照、截圖、掃描）
 * 沒有文字層，等於完全少掉「欄位對位」這層保護，而圖片上傳佔比並不低。
 *
 * 這裡先用一次窄呼叫把費用表逐列轉寫出來，當作後續抽取的對位提示。
 *
 * ⚠️ 轉寫結果**不可**併入 layoutText。layoutText 在 reconcileRentalListingText
 * 與交通動線漏抄校驗中被當成「不受 AI 判讀影響的基準」使用；把 AI 轉寫的內容
 * 灌進去，等於拿 AI 的輸出去校驗 AI 自己，幻覺會被當成事實回補進欄位。
 * 因此它只以提示形式參與抽取，絕不進入任何校驗或回補路徑。
 */
async function transcribeImageLayout(files: UploadedFile[]): Promise<string> {
  const imageFiles = files.filter(file => file.mimeType.startsWith("image/"));
  if (!imageFiles.length) return "";

  const prompt = `
    這是一張日本不動產図面。請把圖上「費用・条件表格」的內容逐列轉寫成純文字，
    保留表格的列結構，其他區域（照片、間取り図、公司資訊、廣告標語）一律略過。

    轉寫規則：
    - 一列輸出一行，同一列的欄位用全形空格分隔，例如：敷金　無　礼金　1ヶ月
    - 直向表格（標題列在上、資料在下）請把標題與其正下方對齊的值配成一組輸出，
      例如標題列是「号室　家具　家賃　礼金　専有面積」、資料列是「105　有　45,000円　1　20.28㎡」，
      就輸出「号室 105」「家具 有」「家賃 45,000円」「礼金 1」「専有面積 20.28㎡」各一行。
    - 只轉寫你在圖上**實際看得到**的字。看不清楚就寫「?」，絕對不要推測或補齊。
    - 不要翻譯、不要換算單位、不要補上圖上沒印的「ヶ月」「円」。
  `;

  try {
    const response = await getAiClient().models.generateContent({
      model: "gemini-3.8-flash",
      contents: { parts: [...imageFiles.map(toInlinePart), { text: prompt }] },
      config: { temperature: 0 },
    });
    return (response.text || "").slice(0, MAX_LAYOUT_TEXT_CHARS);
  } catch (error) {
    console.warn("analyze-listing: 圖片費用表轉寫失敗，略過對位提示", error);
    return "";
  }
}

async function extractListingFields(
  files: UploadedFile[],
  layoutText = "",
  visualLayoutText = "",
): Promise<ExtractedListingFields> {
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
    - transitLegs：把每一條交通動線結構化輸出為物件清單，包含：
      * lineName：所屬鐵道路線名（如「JR山手線」「都営大江戸線」「中央・総武線各停」；若圖紙未載明路線則填空字串）。
      * stationName：車站名稱本身，不含「JR」「東京メトロ」「都営」等前綴與結尾「駅」字（例如「新宿」「両国」）。
      * walkMin：徒步分鐘數（純數字，例如 7；若未載明填 null）。
      * busMin：若為巴士接駁，填巴士車程分鐘數（純數字，例如 15；無巴士填 null）。
      * busStop：巴士站名（例如「野崎」；無巴士填空字串）。
      * 每一條動線必須獨立為一個物件，同站不同線（例如都営両国 vs JR両国）必須分開列出，絕不可合併！
    - station 只填車站名稱本身，不要包含「JR」「東京メトロ」「都営」「東急」這類營運商前綴，
      也不要包含路線名稱或結尾的「駅」字，例如文件寫「JR新宿駅」時 station 只填「新宿」。
    - 多個車站或多條路線時，station 與 walkTime 用逗號分隔，且順序要對應
      （例如 station="新宿,代々木上原" walkTime="8,12"）。
    - 若同一車站載有多條不同鐵道路線（例如「都営大江戸線 両国 徒歩1分」與「中央・総武線各停 両国 徒歩6分」），
      此為不同交通動線，station 與 walkTime 必須每一列都分別列出（例如 station="両国,両国" walkTime="1,6"），
      絕不可因站名相同而只填一列！
    - 不要對不同車站填同一個徒步時間，除非文件上真的寫的是同一個數字。
    - transitAccess：把「交通」欄的每一列連同路線名、車站名、徒歩分鐘逐字抄下；即使第二列字較小也不可省略。例如 "東急目黒線／不動前駅 徒歩7分\nJR山手線／五反田駅 徒歩14分"。若圖紙載有多個利用車站或多條路線，每個車站均須連同其所屬鐵道路線名（如「JR山手線」、「東京メトロ丸ノ内線」、「都電荒川線」）完整抄錄，絕不可省略路線。巴士接駁也要照抄，含「バス○分」與巴士站名，例如 "JR中央線 三鷹駅 バス15分 バス停「野崎」徒歩3分"。
    - 只採計「交通」欄（或同等的アクセス／最寄駅欄）裡條列的動線。図面常把最強的那條動線
      重複印在頁首標題橫幅或宣傳標語上（例如標題寫「○○マンション 都営浅草線「西馬込」徒歩4分」，
      下方交通欄又正式列一次），那是同一條動線的重述，**不可**因此多輸出一條。
      判斷依據是它在版面上的位置與角色：條列在交通欄內的才算，標題、標語、備考裡的不算。
    - 反過來說，交通欄裡確實條列的每一列都必須輸出，即使字級較小、排在最下面、
      或與前一列站名相同（同站不同路線是不同動線）。寧可完整也不要漏列。
    - 輸出前逐列點算交通欄：transitAccess 的路線數、transitLegs 的物件數、station 的車站數、walkTime 的數字數量必須一致。
      點算的對象是交通欄的實際列數，不含標題與標語的重述。

    租金與各項租約費用（若為租賃圖紙）：
    - rent（賃料／家賃）：照原文抓取，格式如 "○○.○万円" 或 "○○,○○○円"。
    - managementFee（管理費／共益費）：照原文抓取，格式如 "○,○○○円"，若寫込み或無則寫 "0円"。
    - keyMoney（礼金）與 deposit（敷金／保証金）：只抄「礼金」「敷金」那一格裡實際印的字，
      一個字都不要改。這兩格最常見的內容有四類，請依格子上實際看到的輸出：
        (a) 格子印的是「無」「無し」「なし」「0」「0円」→ 原樣輸出那幾個字，代表免收。
        (b) 格子印的是月數或金額（格式如 "○ヶ月"、"○○,○○○円"）→ 原樣輸出。
        (c) 格子只印一個沒有單位的數字（如 "1"、"2"、"1.5"）→ 輸出 "○ヶ月"。
            日本賃貸図面常把「ヶ月」印在表頭或省略，格子僅留數字，這是月數不是日圓。
            但有千分位逗號或四位數以上（如 "45,000"、"10000"）則屬金額，照原文輸出。
        (d) 格子空白或整份圖紙沒有這一格 → 輸出空字串。
      費用表可能是橫向（值在標籤右方）或直向（標題列在上、值在下方且左右對齊，
      常見於レオパレス 等連鎖品牌図面）。右方找不到值時務必再找正下方對齊的值。
      嚴禁在格子印「無」時輸出任何月數：實測曾把「礼金 無」誤輸出成月數，讓客人多算出
      數十萬円的初期費用。免收（a）和未載明（c）也不能混用——前者是圖紙明確寫了不收，
      後者是圖紙沒說。
    - rentalConditionItems：把 rentalConditions 與特約條款裡的每一條約定拆分成獨立子句，輸出繁體中文翻譯與分類：
      * category 限制為下列之一（請務必精準歸類，不可錯置）：
        - lease：僅限契約種類、租期、更新條件、更新料、更新手續費、調租約定（如「普通賃貸借2年契約」「更新料：新賃料1.5ヶ月」「更新事務手数料1.1万円」）。注意：不可將辦公室禁止、樂器禁止、單身限定或高齡者守護服務填入 lease！
        - moveIn：起租入住日、免租期、促銷活動、敷禮減免優惠、寵物飼養許可或禁止（如「入居時期：即時」「ペット不可」「敷礼0キャンペーン」）。
        - pet：寵物飼養許可、限制與加收押金約定（如「ペット不可」「ペット可：小型犬1匹迄、敷金1ヶ月増」）。
        - guarantee：保證公司方案、初回保證料、月額/年次保證費、火災保險（如「指定保証会社必須：初回70% 月次1%」「火災保険21,500円/2年」）。
        - fees：簽約一次性或月次附加費用，如換鎖費、室內消毒費、抗菌費、簽約事務手續費、生活支援費（Concierge24、24Hサポート）、會員費、扣款手續費（如「鍵交換費29,700円」「契約事務手数料11,000円」「Concierge24：990円/月」）。
        - moveOut：退租清潔費、退租結算手續費、短期解約違約金、退租預告期、清潔費支付時點變更（如「ハウスクリーニング代62,700円」「短期解約違約金：6ヶ月未満1ヶ月」「敷金なし時退去時払い可」）。
        - optional：選配設施，如停車場、機車位、自行車位費用與空位狀態（如「駐車場要問合せ、駐輪場、バイク置場」）。
      * ja：該條款的日文原文子句（例如 "退去時精算手数料5,500円"）。
      * zh：繁體中文翻譯（台灣用語，金額、月數與條件完整保留，例如 "退租結算手續費：5,500 円（隨最後一期帳單請款）"、"退租鍍膜清潔費：55,000 円"）。常見日文租約名詞請翻為自然的台灣租屋用語：クリーンコート代 請翻為「退租鍍膜清潔費」或「室內鍍膜清潔費」（勿直譯為「被覆費」），エアコン内部洗浄代 請翻為「冷氣內部清洗費」。
    - rentalConditions：逐字保留租賃完整特殊條件：契約種類與期間、更新費次數及金額是否未載、調租百分比與第幾次、入居日、敷禮優惠期限、養寵物額外押金、年次保證費及適用公司、生活支援費週期、抗菌處理費、事務費、另計保險與退去清掃費。不得把更新型一年租約套為兩年，不得把AD業者獎勵當租客費用；地平面以下是部分住居警語，未指明本室時不得推定本室地下。
    - leaseTerms：把包含敷金、礼金、保証金、償却金或敷引的整列文字連同每個標籤逐字抄下
      （格式如 "敷金 ○　礼金 ○　償却金 ○"，○ 為格子上實際印的字：可能是月數、金額、「無」或「-」）。
      不可只抄數值，也不可自行補上圖紙沒印的月數。
    - 「敷金／保証金」與「償却金／敷引」是不同欄位：deposit 只能讀取緊接敷金或保証金標籤的值，絕對不可把償却金或敷引的 0円 填入 deposit。
    - guaranteeFee（保証会社費用）：照原文，例如 "50%"、"総賃料50%"、"4.5万円"、"外国人プラン80%"。
      **必須保留「初回」「月額」「年間」標記並全部抄下**（用「、」分隔），因為這決定費用算在簽約當下還是每月／每年：
      初回保証料（簽約時一次性，如 "初回50%"）、月額保証料／月額利用料（按月支付，如 "月額1%"）、
      年間保証料／継続保証委託料（每年或每兩年，如 "年間10,000円"）。
      GTN、Casa、日本セーフティー 常見「初回100%＋月額1%」組合，須寫成 "GTN 初回100%、月額1%"，不可只寫 "100%"。
      若只有月額沒有初回，只寫 "月額1%"，不可把月額數字當成初回。
      若圖紙載有「外国人プラン」或外國籍專用保證料，請優先提取外國人方案之比例。
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
      必須交叉核對「間取り」總表與「間取詳細」。若總表寫 1DK，但間取詳細明確列出 LDK(10.3畳)＋洋室(6.4畳)，應輸出 1LDK，並在 specialNotes 記錄總表與詳細不一致及採用依據。只有 LDK 字樣、總面積或家具配置時，不可自行推定房間數或升級格局；看不清楚或證據不足時保留原標示。
    - floorPlanDetails（間取り・配置図分析）：只要圖紙包含完整或部分格局圖，就不可留空。請逐項整理圖上明確可讀的房間種類與大小（㎡／畳／帖）、キッチン、浴室／シャワールーム、トイレ、洗面、洗濯機置場（洗置）、収納／クローゼット、ロフト、バルコニー、玄関及樓層配置等；以精簡日文原文摘要輸出（呈現層會另行翻譯成中文，這裡保持圖面原文即可，不要自行翻譯）。
      格式要求：以日文頓號「、」分隔的條列，每項為「空間名＋尺寸」，例如「洋室 9.37㎡／5.7J、ロフト、収納」；不要寫成整句敘述。
      若圖面區分樓層，請在該樓層第一項前加上「1F：」「2F：」標記，樓層內各項仍以頓號分隔、不同樓層以換行分隔。
      只寫圖上看得到的文字標註，不可由家具圖示猜設備，也不可把整棟配置誤當本戶室內格局。
      ⚠️ 水區辨識關鍵限制（請格外小心，嚴禁自行推定）：
      1. 「洗置」「室内洗置」是「洗濯機置場（洗衣機放置處）」，絕非洗面台！圖面標「洗置」時，請輸出「洗濯機置場」或「洗置」，切勿誤寫成「洗面」。
      2. 嚴禁無中生有自行腦補「洗面／洗面台」：日本 1R／1K 或附設シャワールーム的小套房，許多完全沒有獨立洗面台（洗漱在廚房或淋浴間）。若圖紙未印有「洗面」「洗面台」「洗面所」等字樣，絕對不可自行加入「洗面」。
    - area（専有面積／平米數／坪數）：
      * 請仔細在表格、間取り圖旁或建物概要搜尋「専有面積」「専有」「面積」「床面積」「建物面積」等標記。
      * 常見格式如 "40.17㎡"、"30.21㎡"、"40.66㎡"、"50.55㎡"、"12.29坪"、"15.29坪"。
      * 圖紙上有任何面積標示，務必抓出，格式如 "40.17㎡"，不可遺漏！
    - structure（建物構造／構造・規模）：
      * 請仔細在「構造」「建物構造」「構造・規模」搜尋。
      * 常見寫法：英文簡稱如 RC、SRC、S、ALC、PC、W；日文漢字如 鉄筋コンクリート造、鉄骨鉄筋コンクリート造、鉄骨造、木造等。
    - direction（主要採光面／朝向／向き）：
      * 【優先一・文字載明】：請先在表格、間取り圖旁或建物概要中尋找「向き」「方角」「主要採光面」「バルコニー方向」等文字（例如 "南"、"南東"、"東南"、"南西"、"西南"、"東"、"西"、"北"、"南向き" 等）。若圖紙文字明確標示「-」或「無」等，請填 "-"。
      * 【優先二・備援視覺幾何推算（平面圖＋方位記號）】：若表格文字未載明朝向，請務必檢視間取り圖（平面圖）：
        1. 【定位方位記號】：在平面圖範圍內或其四周（常見於角落、圖面邊緣、玄関或水回り附近）尋找方位記號。
           ⚠️ 方位記號【不一定會有 N 字母】，實務上很多日本圖紙只畫圖形、完全不標字。常見樣式包括：
           - 圓圈內一支箭頭（箭頭可能是紅色、黑色或空心），圓圈內外【沒有任何文字】← 這種最常見，極易被漏看
           - 箭頭旁標有「N」「北」字樣
           - 半邊塗黑（或塗紅）的圓形指針、羅盤星形（八角星）
           - 單獨一支細長箭頭，尾端帶羽翼或分叉
           【只要看到這類圖形，它就是方位記號。絕不可因為「沒有 N 字」就判定圖紙無方位資訊】。
        2. 【箭頭尖端即正北】：無論有無標字，方位記號的【箭頭尖端所指方向就是正北 0°】。
           （若標有「北」或「N」，以該字所在側為北；若圓形只有半邊塗色，塗色的那一端為北。）
        3. 【建立方位座標】：以箭頭尖端方向為正北，在紙面上依順時針排出其餘方位：
           正北(0°) → 東北(45°) → 正東(90°) → 東南(135°) → 正南(180°) → 西南(225°) → 正西(270°) → 西北(315°)。
           ⚠️ 【紙面上方不一定是北】！務必以箭頭實際指向為準，不可預設「北在上方」。
           - 例：箭頭指向【畫面右方】→ 正北＝右、正東＝下、正南＝左、正西＝上。
           - 例：箭頭指向【畫面上方】→ 才是常見的北上、東右、南下、西左。
        4. 【定位採光開口】：找出居室（洋室／和室／LDK／DK）對外的主要採光開口，
           即標有「バルコニー」「テラス」「ベランダ」「Balcony」的區塊，或居室外牆上的大片落地窗／掃出窗。
           判斷該開口自居室【向外推出】的紙面方向（上／下／左／右）。
        5. 【幾何換算】：把步驟 4 的「紙面方向」代入步驟 3 的座標，換算成真實方位。
           - 例：箭頭指向畫面右方（北＝右），テラス位於居室下方、開口朝下 → 朝下＝正東 → 答案為「東」。
           - 例：箭頭指向畫面右下方（北＝右下 135°），開口朝畫面正下方(180°) → 順時針相差 45° → 答案為「北東」。
        6. 推算出的朝向請附上來源備註，例如："東（依間取り圖方位記號推算）"、"北東（依間取り圖方位記號推算）"。
      * 只有在「表格確無文字記載」且「平面圖確實找不到任何方位記號圖形」時，才填 "-" 或留空字串。
    - age（築年數／建築年月，例如 "築4年"、"平成11年2月"、"2002年5月"、"2013年2月"）。
    - address（所在地／住所／物件所在地）：
      * 必須逐字完整提取圖紙所載之完整地址，一字不漏！
      * 【極重要・嚴禁截斷枝番／號碼】：務必完整提取至最後的「番地」與「枝番／号」（例如圖紙載明「千葉県千葉市稲毛区長沼町32-2」或「長沼町３２−２」，絕對不可只提取「長沼町32」而丟失「-2」；載明「太子堂4-30-31」不可只提取「太子堂4-30」；載明「1-2-3」或「32番2号」必須一字不漏完整提取至最後一個號碼「32-2」或「32番2号」）！
      * 全形數字與全形連字號（如 ３２−２、３２ー２、３２番地２）請正規化為標準半形（32-2），但絕不可擅自截斷任何號碼！
      * 完整地址直接影響精確經緯度定位、防犯數據查證與門到門通勤精算，丟失枝番（之二、-2 等）屬於重大漏失，務必逐字核對！

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
        - 通訊網路：インターネット無料、Wi-Fi無料、無料Wi-Fi、無料wifi、ネット無料、高速ネット無料、光ファイバー、インターネット使い放題、Wi-Fi完備、BBM-NET、UCOM光、BS/CS、CATV。若圖紙包含這些網路項目，務必完整收錄！
        - 寵物條件：若為「ペット相談」「ペット飼育可」「ペット可」可填入 facilities 作為加分特色；但若為「ペット不可」「ペット飼育不可」，屬於生活限制，絕對不可填入 facilities（請填入 rentalConditions / rentalConditionItems 中的 pet 類別）。
      * 特別注意日本圖紙常見的「表格打圈／勾選矩陣」（如 ■EQUIPMENT 表格）：務必仔細比對各項目旁是否有圈印（○、◯、●、レ、✔、有）；只有打了圈或明確標為有的項目才算具備，留空（空白）、槓號（-、／）或打叉（×、無）的項目代表無該設備，絕對不可填入！
      * 設備文字清單（如「設備：エレベーター,２４時間ゴミ出し可,風除室,敷地内ゴミ置き場,宅配ＢＯＸ...」）中列出的所有具備項目，請逐一完整收錄，不可隨意遺漏！
      * 請將確認具備的所有設備名稱整理為逗號分隔字串。

    特約條款與注意事項（租賃與買賣共通）：
    - shikibiki（敷引／償却／敷金償却）：表格或特約中是否有敷引或償却？照原文填入，例如 "1ヶ月"、"0円"；只有圖紙完全沒寫此欄時才填 "なし"。
    - cancellationPenalty（短期解約違約金）：違約金規定，無則寫 "なし"。
    - renewalFee（更新料）：契約更新費用，無則寫 "なし"。
      * 定期借家（定期賃貸借）的圖紙不會寫「更新料」，而是寫「再契約料」「再契約手数料」
        ——法律上期滿是重新簽約而非更新，但對租客是同一筆「想繼續住就要付」的錢。
        看到這兩個標籤請填入本欄並保留原文標籤（例如 "再契約料 新賃料の1ヶ月"），
        不可因為欄名不叫「更新料」就當成沒有而填 "なし"。
    - specialNoteItems：把 specialNotes 備考欄、特約事項、生活規約等條目拆分成獨立項目，輸出分類、繁體中文標題、詳細說明與原文：
      * 重要去重防呆原則：若某特約事項已經在 rentalConditionItems、supportFee、cleaningFee 或 guaranteeFee 等專屬欄位中完整表達（例如 Concierge24 990円、みまもりS 3000円、鍵交換代、ハウスクリーニング代），切勿在 specialNoteItems 中重複輸出相同條目！
      * category 限制為下列之一：
        - 契約特約：解約通知期、違約責任、免責條款、契約型態約定
        - 費用約定：額外加收費用、押金扣抵、保證費、特定名目費用
        - 生活規範：禁止吸菸、禁止樂器、垃圾處理、生活秩序
        - 使用限制：禁止轉租、禁止民泊、限純住家、禁止辦公室/SOHO
        - 入住條件：單身限定、禁止合租、外國籍條件、長者守護服務
        - 設施設備：設備維護責任、專用附屬設施、冷氣殘留物說明
        - 買賣特約：現況交付、瑕疵擔保免責、境界非明示、公簿交易
        - 其他備考：其他一般備註事項
      * title：簡短繁體中文標題（10 字以內，例如「全面禁止飼養寵物」「限純住宅用途」「退租清潔費約定」）。
      * zh：繁體中文詳細說明（包含金額、條件與提醒，台灣用語，如「退租時須支付室內鍍膜清潔費 55,000 円」；「クリーンコート代」請翻為「室內鍍膜清潔費」，切勿直譯為「被覆費」）。
      * ja：日文原文子句。
      * tone：amber（限制/禁止/加收費用/違約金）、emerald（允許/優惠/可兩人住）、blue（可商量/需洽詢）、neutral（一般記載）。
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

  // 圖片沒有文字層，改用先前轉寫的費用表當對位參考。
  // 語氣刻意弱於 layoutHint：轉寫本身也是 AI 判讀的結果，與圖片牴觸時以圖片為準。
  const visualHint = !layoutText && visualLayoutText
    ? `\n\n以下是先前針對這張圖紙費用表格的逐列轉寫，可作為欄位對位的參考。\n若與你在圖上實際看到的內容不一致，一律以圖片為準：\n---\n${visualLayoutText}\n---`
    : "";

  const response = await getAiClient().models.generateContent({
    model: "gemini-3.8-flash",
    contents: {
      parts: [
        ...files.map(toInlinePart),
        { text: prompt + layoutHint + visualHint },
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
          transitAccess: { type: Type.STRING, description: "交通欄全部列的原文，每列保留路線、車站、徒歩分鐘；有巴士接駁時連バス分鐘與巴士站名一起保留" },
          transitLegs: {
            type: Type.ARRAY,
            description: "交通動線結構化清單：每一條動線拆為路線名、車站名、徒步分鐘數（有巴士時另填巴士分鐘與巴士站）",
            items: {
              type: Type.OBJECT,
              properties: {
                lineName: { type: Type.STRING, description: "鐵道路線名，例如「JR山手線」「都営大江戸線」「中央・総武線各停」；未載明路線時填空字串" },
                stationName: { type: Type.STRING, description: "車站名稱，不含營運商前綴（JR/東京メトロ等）與結尾「駅」，例如「新宿」「両国」" },
                walkMin: { type: Type.NUMBER, description: "徒步分鐘數（純數字，例如 7）；未刊載時填 0 或留空" },
                busMin: { type: Type.NUMBER, description: "巴士接駁時的車程分鐘數（純數字，例如 15）；無巴士時填 0" },
                busStop: { type: Type.STRING, description: "巴士站名（例如「野崎」）；無巴士時填空字串" },
              },
              required: ["lineName", "stationName", "walkMin"],
            },
          },
          layout: { type: Type.STRING, description: "間取り，例如 1LDK、2DK、1K" },
          floorPlanDetails: { type: Type.STRING, description: "間取り・配置図中明確可讀的房間大小、キッチン、浴室、トイレ、収納、ロフト等配置摘要；有格局圖時不可只填房型而留空" },
          rent: { type: Type.STRING, description: "賃料／家賃，原文格式" },
          managementFee: { type: Type.STRING, description: "管理費／共益費，原文格式" },
          keyMoney: { type: Type.STRING, description: "礼金，原文格式" },
          deposit: { type: Type.STRING, description: "敷金／保証金，原文格式" },
          rentalConditions: { type: Type.STRING },
          rentalConditionItems: {
            type: Type.ARRAY,
            description: "租賃條件條目結構化與繁體中文翻譯清單。逐條拆分子句，分類並翻譯為繁體中文（台灣用語）",
            items: {
              type: Type.OBJECT,
              properties: {
                category: {
                  type: Type.STRING,
                  description: "分類：lease（租期/契約/更新/定借）、moveIn（入住日/優惠/活動）、pet（寵物相關）、guarantee（保證公司/保險）、fees（一次性或月次附加費用如換鎖/清潔/支援費）、moveOut（退租清潔/違約金/房屋提醒）、optional（選配設施如停車/駐輪）",
                },
                ja: { type: Type.STRING, description: "該條款的日文原文子句" },
                zh: { type: Type.STRING, description: "繁體中文翻譯說明，金額、月數與條件完整保留" },
              },
              required: ["category", "ja", "zh"],
            },
          },
          leaseTerms: { type: Type.STRING, description: "敷金、礼金、保証金、償却金、敷引所在整列的原文，必須保留各標籤" },
          age: { type: Type.STRING, description: "築年數／建築年月" },
          floor: { type: Type.STRING, description: "所在階" },
          address: { type: Type.STRING, description: "地址／所在地。必須完整提取至最後的番地與枝番/號碼（例如 32-2 必須包含 -2，絕不可只提取至番地而截斷枝番）" },
          area: { type: Type.STRING, description: "専有面積，例如 40.17㎡" },
          structure: { type: Type.STRING, description: "建物構造，例如 RC造" },
          direction: { type: Type.STRING, description: "主要採光面／朝向／向き。優先抓取表格文字（如 南、東南、南向き、北）。若表格未載明，務必檢查間取り圖上的方位記號——它常常只是「圓圈內一支箭頭」而沒有任何 N 字，不可因無 N 字就當作沒有方位。以箭頭尖端為正北，依順時針（北→東北→東→東南→南…）換算陽台／テラス／採光窗開口的紙面方向；例如箭頭指向畫面右方時，紙面朝下即為正東。推算結果請註明來源，例如「東（依間取り圖方位記號推算）」。唯有表格無文字且圖上確實找不到任何方位記號時才填 -，未標示則留空" },
          guaranteeFee: { type: Type.STRING, description: "保證公司費用，照原文並保留初回／月額／年間標記，例如 初回50%、月額1%" },
          lockReplacementFee: { type: Type.STRING, description: "鍵交換費用，照原文" },
          cleaningFee: { type: Type.STRING, description: "退去清掃費／室内クリーニング代／エアコン清掃代，照原文；不可填入敷引或償却金" },
          insuranceFee: { type: Type.STRING, description: "火災保險費用，照原文" },
          supportFee: { type: Type.STRING, description: "入居者サポート／24小時生活支援費用" },
          freeRent: { type: Type.STRING, description: "免租期優惠，例如 フリーレント30日 或 なし" },
          shikibiki: { type: Type.STRING, description: "敷引／償却約定，例如 敷引1ヶ月 或 なし" },
          cancellationPenalty: { type: Type.STRING, description: "短期解約違約金，例如 1年未満解約時1ヶ月 或 なし" },
          renewalFee: { type: Type.STRING, description: "更新料，例如 新賃料1ヶ月 或 なし；定期借家的「再契約料」「再契約手数料」亦填此欄並保留原標籤" },
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
          specialNoteItems: {
            type: Type.ARRAY,
            description: "備考欄、特約事項、生活規約等條目的結構化與繁體中文翻譯清單",
            items: {
              type: Type.OBJECT,
              properties: {
                category: {
                  type: Type.STRING,
                  description: "分類：契約特約、費用約定、生活規範、使用限制、入住條件、設施設備、買賣特約、其他備考",
                },
                title: { type: Type.STRING, description: "簡短繁體中文標題，10 字以內" },
                zh: { type: Type.STRING, description: "繁體中文詳細說明，包含金額、條件與提醒" },
                ja: { type: Type.STRING, description: "日文原文子句" },
                tone: { type: Type.STRING, description: "警示等級：amber、emerald、blue、neutral" },
              },
              required: ["category", "title", "zh", "ja"],
            },
          },
        },
        required: [
          "propertyType", "priceDetails", "handoverDetails", "unitBreakdown", "optionalFacilities", "buildingCondition", "landArea", "buildingArea", "roadDetails", "hospitalityDetails", "revenueDetails", "revenueScope", "taxDetails",
          "dealType", "buildingName", "roomNumber", "station", "walkTime", "transitAccess", "transitLegs", "layout", "floorPlanDetails", "rent", "managementFee",
          "keyMoney", "deposit", "leaseTerms", "rentalConditions", "rentalConditionItems", "age", "floor", "address",
          "area", "structure", "direction", "guaranteeFee", "lockReplacementFee",
          "cleaningFee", "insuranceFee", "supportFee", "freeRent", "shikibiki", "cancellationPenalty",
          "renewalFee", "facilities", "balconyArea", "salePrice", "totalUnits", "buildingFloors", "repairReserve", "repairFund",
          "otherMonthlyFees", "occupancyStatus", "currentRent", "annualIncome",
          "grossYield", "landRights", "zoning", "renovationDetails",
          "managementCompany", "managementStyle", "fixedAssetTax", "cityPlanningTax",
          "realEstateAcquisitionTax", "buildingAssessedValue", "landAcquisitionTaxAfterRelief",
          "registrationFee", "landRightsRatio", "taxEstimationBasis", "specialNotes", "specialNoteItems"
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

    // 圖片沒有文字層可還原，改先轉寫費用表補上對位資訊；PDF 已有 layoutText 就不必多付這次呼叫。
    const visualLayoutText = layoutText ? "" : await transcribeImageLayout(files);

    let extracted = await extractListingFields(files, layoutText, visualLayoutText);
    if (!hasCoreFields(extracted)) {
      // 部分圖紙（常見於特定不動產軟體輸出、內嵌字型有問題的 PDF）偶爾會讓 Gemini
      // 這次抽取剛好四個核心欄位都槓龜；同一份檔案重試一次，實測能救回相當比例，
      // 成本只是多一次呼叫，比讓使用者重新上傳划算。
      console.warn("analyze-listing: 核心欄位皆為空，重試一次", {
        fileCount: files.length,
        mimeTypes: files.map(file => file.mimeType),
      });
      extracted = await extractListingFields(files, layoutText, visualLayoutText);
    }

    // 租賃與買賣核心欄位檢查
    if (!hasCoreFields(extracted)) {
      console.error("analyze-listing: 重試後仍無法讀出核心欄位", {
        fileCount: files.length,
        mimeTypes: files.map(file => file.mimeType),
      });
      return res.status(422).json({ error: "無法從這張圖片讀出物件資訊，請確認上傳的是物件概要書或図面。" });
    }

    // 聚焦二次確認：
    // - 租賃圖紙：一律對敷金／礼金／更新料／保証会社費用做聚焦二次確認（見 verifyLeaseCharges），
    //   防止無幻覺成1個月，以及相鄰費用格互相串格。
    // - 買賣圖紙：一律對售價、管理費、修繕積立金、土地權利與現況做聚焦二次確認（見 verifySaleCoreCharges），
    //   防止表格數字串格、漏讀改定價格、或權利性質誤判。
    if (extracted.dealType !== "sale") {
      const before = {
        deposit: extracted.deposit,
        keyMoney: extracted.keyMoney,
        renewalFee: extracted.renewalFee,
        guaranteeFee: extracted.guaranteeFee,
      };
      const verified = await verifyLeaseCharges(files, before);
      if ((Object.keys(before) as Array<keyof typeof before>).some(key => verified[key] !== before[key])) {
        console.info("analyze-listing: 租賃費用欄位經二次確認修正", { before, after: verified });
      }
      extracted = { ...extracted, ...verified };
    } else {
      const verified = await verifySaleCoreCharges(files, {
        salePrice: extracted.salePrice,
        managementFee: extracted.managementFee,
        repairReserve: extracted.repairReserve,
        landRights: extracted.landRights,
        occupancyStatus: extracted.occupancyStatus,
      });
      if (
        verified.salePrice !== extracted.salePrice ||
        verified.managementFee !== extracted.managementFee ||
        verified.repairReserve !== extracted.repairReserve ||
        verified.landRights !== extracted.landRights ||
        verified.occupancyStatus !== extracted.occupancyStatus
      ) {
        console.info("analyze-listing: 買賣核心欄位經二次確認修正", {
          before: {
            salePrice: extracted.salePrice,
            managementFee: extracted.managementFee,
            repairReserve: extracted.repairReserve,
            landRights: extracted.landRights,
            occupancyStatus: extracted.occupancyStatus,
          },
          after: verified,
        });
      }
      extracted = { ...extracted, ...verified };
    }

    const rent = parseYenAmount(extracted.rent);
    const managementFee = parseYenAmount(extracted.managementFee);
    const salePrice = parseSalePrice(extracted.salePrice);
    const roomType = normalizeRoomType(extracted.layout);
    // 交通動線以 transitLegs 為事實來源，避免 station 與 walkTime 各自
    // 過濾後 index 錯位（未刊載步行時間的動線會讓 walkTime 少一格）。
    const transitLegs = extracted.transitLegs?.length
      ? extracted.transitLegs
      : parseTransitStations(extracted.transitAccess, extracted.station, extracted.walkTime);
    const stations = transitLegs
      .map(leg => stripStationOperatorPrefix(leg.stationName))
      .filter((s): s is string => Boolean(s));
    // 巴士接駁的站用「車程＋走到巴士站」的總分鐘，否則行情校準會把走到巴士站的 4 分當近站加分。
    const walkTimes = transitLegs.map(leg => { const total = transitLegTotalMinutes(leg); return total === null ? "" : String(total); });

    // 交通動線漏抄的最後一道防線。
    //
    // listingAudit 的 transit-legs-shortfall 比對的是 station 欄位數與 legs 數，
    // 抓得到「解析階段漏條」；但如果是 Gemini 自己只抄了第一列，station 與 legs
    // 會同時是 1、看起來一致，那條稽核完全靜默——2026-09 的漏失就是這樣潛伏的。
    //
    // 交通動線漏抄的觀測指標——**只寫伺服器日誌，不對使用者顯示**。
    //
    // 這道校驗曾經會寫入 transitShortfallNotice 直接顯示在畫面上，後來降級，
    // 原因值得完整記錄，避免日後又被「補強」回去：
    //
    // 1) 它和模型之間有無法消除的資訊落差。Gemini 讀的是圖——版面位置、字級、
    //    框線、欄位角色都看得到；這裡讀的是 extractPdfLayoutText 抽平後的字串。
    //    標題橫幅與交通欄在視覺上截然不同，在文字層裡卻長得一模一樣。
    //    丟掉模型賴以判斷的全部資訊，卻要求判得比它準，本來就做不到。
    //
    // 2) 實績是誤報兩次、真陽性零次。trias magome（實際 2 條判成 3 條）與
    //    excelan 東武練馬（實際 3 條判成 4 條）都是重複刊載造成的假警報。
    //    而歷史上三起真實的動線漏失（2026-09 同名站漏失 d61dd61、
    //    walkTime index 錯位 3daa5c1）肇因都在 transitParser，不是模型判讀；
    //    那兩處都已在各自的 commit 修好，解析器才是第一道也是真正的防線。
    //
    // 3) 誤報與漏報的代價不對等。假警報會連帶稀釋價格異常、契約風險這些
    //    真正要命的提醒的可信度；而漏報只是回到「沒有這層保險」的狀態。
    //
    // 判斷重複刊載需要版面語意，那是模型的守備範圍，已寫進 extractListingFields
    // 的提示詞（交通欄以外的重述不得計入）。同一解讀者的內部一致性則由
    // listingAudit 的 transit-legs-shortfall 比對 station 數與 legs 數負責。
    // 這裡保留日誌是為了讓新版型浮現在 log 上，據以回頭修 transitParser 或提示詞。
    //
    // 比對方式是「集合涵蓋」而非「數量相等」：只問圖紙上的每個「站名＋徒歩分鐘」
    // 有沒有落在解析結果裡。重複刊載因此自然無害，不需要精準去重。
    if (layoutText) {
      const uncovered = extractFlyerTransitStops(layoutText)
        .filter(stop => !isStopCovered(stop, transitLegs));
      const missing = [...new Map(uncovered.map(stop => [stop.station, stop])).values()];
      if (missing.length) {
        console.warn("analyze-listing: 交通動線疑似漏抄（僅記錄，不顯示給使用者）", {
          missing: missing.map(stop => ({ station: stop.station, walkMin: stop.walkMin, line: stop.sourceLine })),
          parsedLegCount: transitLegs.length,
          transitAccess: extracted.transitAccess,
          station: extracted.station,
        });
      }
    }

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
    const isQuotaExceeded =
      error?.status === 429 ||
      String(error?.message || "").includes("RESOURCE_EXHAUSTED") ||
      String(error?.message || "").includes("spending cap") ||
      String(error?.message || "").includes("Quota exceeded");

    return res.status(isQuotaExceeded ? 429 : 500).json({
      error: missingKey
        ? "圖紙健檢服務尚未設定 Gemini API 金鑰。"
        : isQuotaExceeded
        ? "Gemini API 呼叫配額或每月支出上限已達上限（429），請至 Google AI Studio (ai.studio/spend) 調整專案額度或更換金鑰。"
        : "AI 暫時無法讀取這張圖片，請稍後再試。",
    });
  }
}
