import { GoogleGenAI, Type } from "@google/genai";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { resolveSearchScope, estimateRequestedRent, buildListingPriceVerdict, buildSalePriceVerdict, type RequestedRentRange } from "../src/lib/requirementVerdict.js";
import {
  parseYenAmount,
  parseMonthsOrYen,
  normalizeRoomType,
  stripStationOperatorPrefix,
  parseArea,
  normalizeStructure,
  parseGuaranteeFee,
  formatShikibiki,
  isFreeOrZero,
  parseSalePrice,
  parseUnitsCount,
  parseYieldRate,
  computeTsuboAndSqmPrice,
  assessRepairReserve,
  calculateSaleInitialCosts,
  parseAgeYears,
  parseFloorInfo,
  parseMandatoryMonthlyFees,
  parseEffectiveRepairReserve,
} from "../src/lib/listingExtraction.js";
import { getOfficialBuyEstimate } from "../src/data/buyMarket.js";
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

const LISTING_CHECK_RATE_LIMIT = 3;
const LISTING_CHECK_RATE_WINDOW_MS = 300_000;
const listingCheckRateBuckets = new Map<string, { count: number; resetAt: number }>();

const upstashListingCheckLimiter =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(LISTING_CHECK_RATE_LIMIT, "300 s"),
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

async function getRateLimit(ip: string) {
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

export interface ExtractedListingFields {
  dealType: string; // "sale" 或 "rent"
  buildingName: string;
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
  specialNotes: string;
  otherConditions?: string;
}

function leaseTermValue(row: string, labels: string[]) {
  const normalized = row.normalize("NFKC");
  const labelPattern = labels.join("|");
  return normalized.match(new RegExp(`(?:${labelPattern})\\s*[:：]?\\s*((?:\\d+(?:\\.\\d+)?\\s*(?:ヶ月|ヵ月|カ月|個月|万円|円))|なし|無し|不要)`, "i"))?.[1]?.trim() || null;
}

function reconcileLeaseTerms(extracted: ExtractedListingFields): ExtractedListingFields {
  const row = extracted.leaseTerms || "";
  if (!row.trim()) return extracted;
  const deposit = leaseTermValue(row, ["敷金", "保証金"]);
  const keyMoney = leaseTermValue(row, ["礼金"]);
  const shikibiki = leaseTermValue(row, ["償却金", "敷金償却", "償却", "敷引"]);
  return {
    ...extracted,
    deposit: deposit || extracted.deposit,
    keyMoney: keyMoney || extracted.keyMoney,
    shikibiki: shikibiki || extracted.shikibiki,
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

async function extractListingFields(files: UploadedFile[]): Promise<ExtractedListingFields> {
  const prompt = `
    分析這份日本不動產物件概要書／図面圖片或 PDF，精準抓出各欄位內容，原文照抄不要翻譯或換算單位。

    物件種類判斷（dealType，極重要）：
    - 判斷這份圖紙是「買賣物件（sale）」還是「租賃物件（rent）」。
    - buildingName：逐字提取物件名／建物名／マンション名（不含房號）；找不到時留空，不可拿地址或仲介公司名代替。
    - 若圖紙出現「売買」「売マンション」「中古マンション」「オーナーチェンジ」「販売価格」「価格(税込)」「専有面積」「修繕積立金」等買賣特徵，dealType 填 "sale"。
    - 若為一般租屋（「賃貸」「賃料」「家賃」「敷金」「礼金」「更新料」），dealType 填 "rent"。

    車站與徒步時間（重要）：
    - 掃描整份文件，找出所有標示的車站與各自的徒步分鐘數。
    - station 只填車站名稱本身，不要包含「JR」「東京メトロ」「都営」「東急」這類營運商前綴，
      也不要包含路線名稱或結尾的「駅」字，例如文件寫「JR新宿駅」時 station 只填「新宿」。
    - 多個車站時，station 與 walkTime 用逗號分隔，且順序要對應
      （例如 station="新宿,代々木上原" walkTime="8,12"）。
    - 不要對不同車站填同一個徒步時間，除非文件上真的寫的是同一個數字。
    - transitAccess：把「交通」欄的每一列連同路線名、車站名、徒歩分鐘逐字抄下；即使第二列字較小也不可省略。例如 "東急目黒線／不動前駅 徒歩7分\nJR山手線／五反田駅 徒歩14分"。
    - 輸出前逐列點算交通欄：transitAccess 的車站數、station 的車站數、walkTime 的數字數量必須一致。

    租金與各項租約費用（若為租賃圖紙）：
    - rent（賃料／家賃）：照原文抓取，例如 "10.5万円" 或 "98,000円"。
    - managementFee（管理費／共益費）：照原文抓取，例如 "8,000円"，若寫込み或無則寫 "0円"。
    - keyMoney（礼金）：照原文抓取，例如 "1ヶ月"、"なし" 或 "0"。
    - deposit（敷金／保証金）：照原文抓取，例如 "1ヶ月"、"なし" 或 "0"。
    - leaseTerms：把包含敷金、礼金、保証金、償却金或敷引的整列文字連同每個標籤逐字抄下，例如 "敷金 1ヶ月　礼金 1ヶ月　償却金 0円"。不可只抄數值。
    - 「敷金／保証金」與「償却金／敷引」是不同欄位：deposit 只能讀取緊接敷金或保証金標籤的值，絕對不可把償却金或敷引的 0円 填入 deposit。
    - guaranteeFee（保証会社費用／初回保証料）：照原文，例如 "50%"、"総賃料50%"、"4.5万円"、"外国人プラン80%"、"GTN100%"。若圖紙載有「外国人プラン」或外國籍專用保證料，請優先提取外國人方案之比例。
    - lockReplacementFee（鍵交換代／シリンダー交換代）：照原文，例如 "22,000円"、"33,000円"、"無償"、"なし"。
    - cleaningFee（退去時清掃費／室内クリーニング代／エアコン清掃代）：照原文，例如 "49,500円"、"55,000円"、"44,000円"。
    - insuranceFee（火災保険／家財保険料）：照原文，例如 "20,000円"、"17,800円"。
    - supportFee（入居者サポート／安心サポート／クラブ費／駆けつけ）：照原文，例如 "22,000円"、"16,500円"、"リブクラブ2,200円/月"。
    - freeRent（フリーレント／免租期）：照原文，例如 "フリーレント30日"、"フリーレント1ヶ月"，無則寫 "なし"。

    買賣物件專屬欄位（若為買賣圖紙，請格外仔細精準提取）：
    - salePrice（販売価格／価格）：照原文，例如 "7,299万円"、"3,450万円"、"6,300万円"、"5,488万円"、"5,980万円"。
    - totalUnits（総戸数／戸数）：照原文，例如 "50戸"、"39戸"、"26戸"、"17戸"、"42戸"。
    - buildingFloors（建物總樓層）：只填地上總樓層的數字，例如 "7"、"21"、"9"。
      常見於構造欄位（"鉄筋コンクリート造21階建"、"RC造・地上9階建"）或物件概要。
      這個欄位很重要：同樣是 7 樓，在 7 層建物是頂樓、在 21 層建物只是中低樓層，
      沒有總樓層就無法判斷樓層價值。找不到才留空字串。
    - repairReserve（修繕積立金）：若備註載有「月額○円に改定」，優先填改定後的新金額；否則照主欄原文，例如 "6,100円"、"4,120円"、"14,230円"、"12,100円"。
    - managementFee（管理費）：買賣圖紙同樣一定要抓。它幾乎都緊鄰「修繕積立金」出現，
      常見寫法是「管理費 9,300円/月」或表格中「管理費・修繕積立金」並排。
      只有在圖紙上真的找不到時才留空字串，不要因為這是買賣圖紙就略過這個欄位。
    - repairFund（修繕積立基金／積立基金）：照原文，例如 "2,180円"（有些物件每月另有積立基金）。若無則填空字串。
    - otherMonthlyFees（町会費／協力金／自治会費／其他每戶固定月費）：照原文，例如 "町会費 300円"、"協力金 2,000円"。停車場、駐輪場、バイク置場等只有使用者才付的選配費用不得填入。
    - occupancyStatus（現況）：照原文，例如 "空室"、"賃貸中"、"居住中"、"オーナーチェンジ"。
    - currentRent（現行家賃／月額収入，若為投資型／賃貸中）：照原文，例如 "115,000円"。
    - annualIncome（年間収入／年額収入，若為投資型／賃貸中）：照原文，例如 "1,380,000円"。
    - grossYield（利回り／表面利回り）：照原文，例如 "4.0%"、"4%"。
    - landRights（土地権利）：例如 "所有権"、"借地権"、"定期借地権"。
    - zoning（用途地域）：例如 "商業地域"、"準工業地域"、"第一種住居地域"。
    - renovationDetails（リノベーション内容／工事履歴）：例如 "2026年6月完成、R1住宅適合、給排水管交換、2022年立駐解体"。
    - managementCompany（管理会社）：例如 "東急コミュニティー"、"伏見管理サービス"、"南海ビルサービス"。
    - managementStyle（管理形態／管理方式）：例如 "全部委託 (日勤)"、"全部委託 (巡回)"。

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

    特約條款與注意事項（租賃與買賣共通）：
    - shikibiki（敷引／償却／敷金償却）：表格或特約中是否有敷引或償却？照原文填入，例如 "1ヶ月"、"0円"；只有圖紙完全沒寫此欄時才填 "なし"。
    - cancellationPenalty（短期解約違約金）：違約金規定，無則寫 "なし"。
    - renewalFee（更新料）：契約更新費用，無則寫 "なし"。
    - specialNotes（其他特約・注意事項・生活限制・交易條件）：
      請完整掃描備考、特約欄、設備條件、取引態様（売主、媒介、手数料3%）、司法書士売主指定、ペット飼育可否等。

    找不到的欄位留空字串，不要猜測或用 0 代替。
  `;

  const response = await getAiClient().models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: {
      parts: [
        ...files.map(file => ({ inlineData: file })),
        { text: prompt },
      ],
    },
    config: {
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          dealType: { type: Type.STRING, description: "sale 或 rent" },
          buildingName: { type: Type.STRING, description: "物件名／建物名／マンション名；不含房號，找不到留空" },
          station: { type: Type.STRING, description: "所有車站名稱，逗號分隔" },
          walkTime: { type: Type.STRING, description: "對應車站的徒步分鐘數，逗號分隔，順序需與 station 一致" },
          transitAccess: { type: Type.STRING, description: "交通欄全部列的原文，每列保留路線、車站及徒歩分鐘" },
          layout: { type: Type.STRING, description: "間取り，例如 1LDK、2DK、1K" },
          rent: { type: Type.STRING, description: "賃料／家賃，原文格式" },
          managementFee: { type: Type.STRING, description: "管理費／共益費，原文格式" },
          keyMoney: { type: Type.STRING, description: "礼金，原文格式" },
          deposit: { type: Type.STRING, description: "敷金／保証金，原文格式" },
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
          salePrice: { type: Type.STRING, description: "販売価格，例如 7,299万円" },
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
          specialNotes: { type: Type.STRING, description: "備考與特約注意事項" },
        },
        required: [
          "dealType", "buildingName", "station", "walkTime", "transitAccess", "layout", "rent", "managementFee",
          "keyMoney", "deposit", "leaseTerms", "age", "floor", "address",
          "area", "structure", "guaranteeFee", "lockReplacementFee",
          "cleaningFee", "insuranceFee", "supportFee", "freeRent", "shikibiki", "cancellationPenalty",
          "renewalFee", "salePrice", "totalUnits", "buildingFloors", "repairReserve", "repairFund",
          "otherMonthlyFees", "occupancyStatus", "currentRent", "annualIncome",
          "grossYield", "landRights", "zoning", "renovationDetails",
          "managementCompany", "managementStyle", "specialNotes"
        ],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("empty analyze-listing response");
  return reconcileTransitAccess(reconcileLeaseTerms(JSON.parse(text) as ExtractedListingFields));
}

function calculateInitialCostBreakdown(params: {
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
  marketVerdict?: { status: string; headline: string; detail: string } | null;
}): InitialCostEstimate {
  const { rent, managementFee, keyMoney, deposit } = params;
  const totalMonthlyCost = rent + (managementFee ?? 0);

  const items: InitialCostBreakdownItem[] = [];

  // 1. 敷金（押金）與敷引／償却判定
  const depositAmount = deposit ?? 0;
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
    isFromFlyer: Boolean(params.extractedDeposit),
    note: depositAmount === 0
      ? "免押金（需留意退租時是否有預收清掃費或特約條款）"
      : hasShikibiki
      ? `擔保性質費用（⚠️ 含「${formattedShikibiki}」扣除約定，退租時不退還）`
      : "擔保性質費用，退租扣除修繕後退還餘額",
  });

  // 2. 禮金（礼金）
  const keyMoneyAmount = keyMoney ?? 0;
  items.push({
    id: "keyMoney",
    name: "禮金（礼金）",
    amount: keyMoneyAmount,
    isFromFlyer: Boolean(params.extractedKeyMoney),
    note: keyMoneyAmount === 0 ? "免禮金（無須贈與房東謝禮，初期負擔大幅減輕）" : "贈與房東之謝禮，退租時不予退還",
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
    note: "日本國土交通省法定上限為 1 個月租金 + 10% 消費稅",
  });

  // 7. 火災保險費
  const customInsurance = parseYenAmount(params.extractedInsuranceFee);
  const insuranceAmount = customInsurance ?? 20000;
  items.push({
    id: "insuranceFee",
    name: "火災保險／家財保險（2年）",
    amount: insuranceAmount,
    isFromFlyer: Boolean(customInsurance),
    note: params.extractedInsuranceFee
      ? `圖紙標示：${params.extractedInsuranceFee}`
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
        : "免押金物件通常於簽約時預收退租清掃費",
    });
  }

  // 10. 入居者生活支援／安心サポート
  const customSupport = parseYenAmount(params.extractedSupportFee);
  if (customSupport && customSupport > 0) {
    items.push({
      id: "supportFee",
      name: "入居者サポート／24小時生活支援",
      amount: customSupport,
      isFromFlyer: true,
      note: `圖紙標示：${params.extractedSupportFee}（24 小時生活急修與支援服務）`,
    });
  }

  // totalMin: 假設月底起租（不計入日割租金）
  const totalMin = items
    .filter(item => item.id !== "proratedRent")
    .reduce((sum, item) => sum + item.amount, 0);

  // totalMax: 包含半個月日割租金
  const totalMax = items.reduce((sum, item) => sum + item.amount, 0);

  const monthsMultipleMin = totalMonthlyCost > 0 ? Number((totalMin / totalMonthlyCost).toFixed(1)) : 0;
  const monthsMultipleMax = totalMonthlyCost > 0 ? Number((totalMax / totalMonthlyCost).toFixed(1)) : 0;

  let level: "low" | "standard" | "high" = "standard";
  let levelText = "市場標準常態（約 3.5 ～ 4.8 倍）";

  if (monthsMultipleMax <= 3.5) {
    level = "low";
    levelText = "極度優惠（3.5 倍以下）";
  } else if (monthsMultipleMax >= 5.0) {
    level = "high";
    levelText = "初期負擔偏高（5.0 倍以上）";
  }

  const tips: string[] = [];

  // 1. 租金高性價比／超值物件
  if (params.marketVerdict?.status === "超值") {
    tips.push("【💡 高性價比／超值物件】本物件租金＋管理費顯著低於同區同房型市場行情，價格極具競爭力！在東京租屋市場中，此類平價超值房源去化速度極快，若審查通過建議把握簽約時機，以免被其他申請者搶先。");
  }

  // 2. 免租期（Free Rent）特惠提示
  const hasFreeRent = Boolean(params.extractedFreeRent && !isFreeOrZero(params.extractedFreeRent));
  if (hasFreeRent) {
    tips.push(`【✨ 專屬禮遇・免租期（フリーレント）】圖紙載有「${params.extractedFreeRent}」優惠！起租首月可減免本體租金，實質大幅減輕簽約搬家現金壓力（約省下 ¥${rent.toLocaleString()}）。`);
  }

  // 3. 初期費用極度親民（3.5 倍以下）
  if (monthsMultipleMax <= 3.5) {
    tips.push(`【💰 初期費用極度親民】本物件總初期費用僅約 ${monthsMultipleMax} 個月租金（市場普遍約 4.0～4.8 倍），大幅壓低赴日搬遷的現金流門檻！`);
  }

  // 4. 禮金與押金動態解析
  if (hasShikibiki) {
    tips.push(`【⚠️ 重要特約・敷引（押金不退還）】圖紙載有「${formattedShikibiki}」，此約定表示退租時該筆押金將直接扣除沒收、絕不退還，實質形同額外禮金，請務必納入預算考量。`);
  }
  if (keyMoneyAmount === 0 && depositAmount === 0) {
    tips.push("【🎉 零禮金・零押金（雙零物件）】免付房東謝禮與押金，初期可直接省下約 2 個月租金負擔；但請特別留意退租時合約約定的基本清掃費與原狀恢復計費特約。");
  } else if (keyMoneyAmount === 0) {
    tips.push("【✨ 免禮金優勢】本物件「免禮金」，為您省下致贈房東的謝禮（相當於省下約 1 個月租金）；所繳押金於扣除退租清潔特約後仍有機會返還。");
  } else if (keyMoneyAmount >= rent * 1.5) {
    const kmMonths = (keyMoneyAmount / rent).toFixed(1).replace(/\.0$/, "");
    tips.push(`【⚠️ 初期負擔偏高】本物件禮金高達 ${kmMonths} 個月，屬於熱門物件或都心精華地段常見設定，初期成本相對較高。`);
  }

  // 5. 免換鎖費用優惠
  if (isLockFree) {
    tips.push("【🔑 免換鎖費優惠】圖紙載明免收換鎖費（鍵交換代 0 円），為您額外省下約 2～4 萬円的交屋雜費。");
  }

  // 6. 附免費高速網路
  const allNotes = `${params.specialNotes || ""}`.toLowerCase();
  const hasFreeNet = /インターネット無料|ネット無料|wifi無料|シーファイブ|高速ネット無料|光ネット無料/.test(allNotes);
  if (hasFreeNet) {
    tips.push("【📶 附免費高速網路】圖紙標示內建免費網路，入居後免自行申辦與綁約，每年實質再為您省下約 5 萬～6 萬円通信開銷。");
  }

  // 7. 起租日與首期金額浮動說明
  tips.push("【起租日與首期金額浮動】日本簽約多會預收「起租月剩餘日數之日割租金＋次月完整租金與管理費」。因起租日需配合管理會社規定之最晚起租期限（通常為審查核准後約 10～20 天內，無法隨意延後），若核准的起租日剛好落在下旬（如 25 號後），當月日割天數少，首筆需匯出的初期款項會相對有感降低；若落在月初則日割接近全額。");

  // 8. 海外匯款提醒
  tips.push("【海外匯款提醒】海外租客簽約初期費用多需以日本國內銀行匯款，若由海外電匯請預留約 4,000 円日本端中繼受金手續費與匯差緩衝。");

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

function buildSaleAnalysis(params: {
  extracted: ExtractedListingFields;
  salePriceYen: number;
  areaSqm: number | null;
  stations: string[];
  walkTimes: string[];
  layout: string;
}) {
  const { extracted, salePriceYen, areaSqm, stations, walkTimes, layout } = params;

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
  const totalUnits = parseUnitsCount(extracted.totalUnits);
  const ageYears = parseAgeYears(extracted.age);

  const reserveAssessment = assessRepairReserve({
    monthlyRepairCostYen: repairReserve + repairFund,
    areaSqm,
    totalUnits,
    ageYears,
  });

  // Special building strengths
  const specialStrengths: string[] = [];
  const allNotes = `${extracted.renovationDetails} ${extracted.specialNotes} ${extracted.structure}`.toLowerCase();
  if (/立駐解体|機械式駐車場解体|ピット式立駐解体/.test(allNotes)) {
    specialStrengths.push("已拆除高維護成本機械停車塔（大幅消除社區未來最大維修赤字隱患）");
  }
  if (/r1|リノベ協議会/.test(allNotes)) {
    specialStrengths.push("取得一般社團法人 R1 住宅認證（重要給排水管檢驗合格，附 2 年以上履歷保證）");
  }
  if (/給排水管交換|給排水管新規/.test(allNotes)) {
    specialStrengths.push("室內給排水管已更新（老屋翻新最關鍵之隱蔽工程，安心度大幅提升）");
  }
  if (/長期修繕計画/.test(allNotes)) {
    specialStrengths.push("大樓訂有長期修繕計畫，資金提撥與運用具前瞻性");
  }
  if (/新耐震/.test(allNotes) || (ageYears !== null && ageYears <= 44)) {
    specialStrengths.push("符合新耐震基準（耐震性高、銀行承貸與資產保值性佳）");
  }

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

  if (locationInfo && layoutCode) {
    const officialEstimate = getOfficialBuyEstimate(locationInfo.region, locationInfo.district, layoutCode, ageYears);
    const medianPriceYen = officialEstimate?.medianTradePriceYen ?? null;
    if (medianPriceYen && medianPriceYen > 0) {
      // 取「最近的那一站」，不是圖紙上列的第一站。實測ナビウス高円寺南
      // 第一站是中野 11 分、第二站東高円寺才 5 分，用第一站會低估近站優勢。
      const walkCandidates = walkTimes
        .map(w => parseInt(String(w).match(/\d+/)?.[0] || "", 10))
        .filter(n => Number.isFinite(n) && n > 0);
      const minWalkMinutes = walkCandidates.length ? Math.min(...walkCandidates) : null;

      // 總樓層（○階建）不一定出現在構造欄位，也可能落在物件備註裡，
      // 兩邊一起掃才不會漏。少了它就分不出「7階建的7樓」和「21階建的16樓」。
      const floorInfo = parseFloorInfo(
        extracted.floor,
        `${extracted.buildingFloors ? `${extracted.buildingFloors}階建` : ""} ${extracted.structure || ""} ${extracted.specialNotes || ""}`
      );
      const priceVerdict = buildSalePriceVerdict({
        salePriceYen,
        medianPriceYen,
        medianSqmPriceYen: officialEstimate?.medianSqmPriceYen ?? null,
        ageControlledByMarket: officialEstimate?.ageBand !== null,
        layout: layoutCode,
        areaSqm,
        ageYears,
        walkMinutes: minWalkMinutes,
        floor: floorInfo.floor,
        totalFloors: floorInfo.totalFloors,
        renovationNotes: `${extracted.renovationDetails || ""} ${extracted.specialNotes || ""}`,
        sampleCount: officialEstimate?.ageBandSampleCount ?? officialEstimate?.sampleCount ?? null,
        listingBenchmark: getSaleListingBenchmark(locationInfo.region, locationInfo.district, layoutCode),
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
        fairLowMan: priceVerdict.fairLowMan,
        fairHighMan: priceVerdict.fairHighMan,
        typicalListingPriceMan: priceVerdict.typicalListingPriceMan,
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
        priceFactors: priceVerdict.factors,
        priceCautions: priceVerdict.cautions,
        sampleCount: officialEstimate?.sampleCount,
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
  const isTenanted = /賃貸中|オーナーチェンジ/i.test(statusRaw) || Boolean(extracted.currentRent || extracted.grossYield);
  const isOwnerOccupied = /居住中|所有者居住/i.test(statusRaw);
  const isVacant = /空室|即引渡|空き/i.test(statusRaw) || (!isTenanted && !isOwnerOccupied);

  const currentRentYen = parseYenAmount(extracted.currentRent);
  const annualIncomeYen = parseYenAmount(extracted.annualIncome) ?? (currentRentYen ? currentRentYen * 12 : null);
  const grossYield = parseYieldRate(extracted.grossYield) ?? (annualIncomeYen ? Math.round((annualIncomeYen / salePriceYen) * 1000) / 1000 : null);
  const netYieldEstimated = annualIncomeYen && salePriceYen > 0
    ? Math.round(((annualIncomeYen - totalMonthlyHoldingCost * 12) / salePriceYen) * 1000) / 1000
    : null;

  let mortgageTaxEligible: boolean | null = null;
  let mortgageTaxNote = "需由專任司法書士查驗登記謄本。";
  if (areaSqm) {
    if (areaSqm >= 50) {
      mortgageTaxEligible = true;
      mortgageTaxNote = `專有面積約 ${areaSqm}㎡（壁芯達標 50㎡），符合日本「住宅貸款減稅（住宅ローン減税）」所得稅扣除之主要面積門檻！`;
    } else if (areaSqm >= 40) {
      mortgageTaxEligible = null;
      mortgageTaxNote = `專有面積約 ${areaSqm}㎡（壁芯）。日本住宅貸款減稅以「登記簿謄本內法面積 ≥ 40㎡」為特例判定標準，需確認謄本內法面積是否達標。`;
    } else {
      mortgageTaxEligible = false;
      mortgageTaxNote = `專有面積約 ${areaSqm}㎡，未達 40㎡ 減稅最低標準，無法申請住宅ローン減稅。`;
    }
  }

  // 6. Initial Costs
  const initialCosts = calculateSaleInitialCosts(salePriceYen);

  return {
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
    },
    mlitComparison,
    occupancyAssessment: {
      status: isTenanted ? "tenanted_investment" : isOwnerOccupied ? "occupied_owner" : "vacant",
      statusText: isTenanted ? "賃貸中（オーナーチェンジ／投資型）" : isOwnerOccupied ? "屋主自住中（居住中）" : "現況空室（可即刻裝修或入住）",
      investmentYield: isTenanted && grossYield ? {
        monthlyRentYen: currentRentYen ?? Math.round((annualIncomeYen ?? 0) / 12),
        annualIncomeYen: annualIncomeYen ?? 0,
        grossYield: Math.round(grossYield * 1000) / 10,
        netYieldEstimated: netYieldEstimated ? Math.round(netYieldEstimated * 1000) / 10 : null,
      } : undefined,
      mortgageTaxEligible,
      mortgageTaxNote,
      renovationNote: extracted.renovationDetails || undefined,
    },
    initialCosts,
  };
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed. Use POST." });

  try {
    const files = validateFiles(req.body?.files);

    const ip = String(req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown").split(",")[0].trim();
    const limit = await getRateLimit(ip);
    res.setHeader("X-RateLimit-Limit", String(LISTING_CHECK_RATE_LIMIT));
    res.setHeader("X-RateLimit-Remaining", String(limit.remaining));
    if (limit.limited) {
      res.setHeader("Retry-After", String(limit.retryAfter));
      return res.status(429).json({ error: "物件健檢每 5 分鐘最多使用 3 次，請稍候再試。", retryAfter: limit.retryAfter });
    }

    const extracted = await extractListingFields(files);

    // 租賃與買賣核心欄位檢查
    if (
      !extracted.station.trim() &&
      !extracted.layout.trim() &&
      !extracted.rent.trim() &&
      !extracted.salePrice.trim()
    ) {
      return res.status(422).json({ error: "無法從這張圖片讀出物件資訊，請確認上傳的是物件概要書或図面。" });
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

    // 判斷是買賣圖紙還是租屋圖紙
    const requestedMode = req.body?.mode;
    const isSale = requestedMode === "sale"
      ? true
      : requestedMode === "rent"
      ? false
      : (extracted.dealType === "sale" || Boolean(salePrice && salePrice >= 10000000));

    const dealType = isSale ? "sale" : "rent";

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

      verdict = buildListingPriceVerdict(totalMonthlyCost, range, {
        ageYears,
        walkMinutes: minWalkMinutes,
        areaSqm: area,
        roomType,
        structure: extracted.structure,
        specialNotes: extracted.specialNotes,
        otherConditions: extracted.otherConditions,
        freeRent: extracted.freeRent,
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
        marketVerdict: verdict,
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

    return res.status(200).json({
      dealType,
      extracted,
      parsed: {
        rent,
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
      model: "gemini-3.1-flash-lite",
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
