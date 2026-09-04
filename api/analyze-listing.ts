import { GoogleGenAI, Type } from "@google/genai";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { resolveSearchScope, estimateRequestedRent, buildListingPriceVerdict } from "../src/lib/requirementVerdict.js";
import {
  parseYenAmount,
  parseMonthsOrYen,
  normalizeRoomType,
  stripStationOperatorPrefix,
  parseArea,
  normalizeStructure,
  parseGuaranteeFee,
  formatShikibiki,
} from "../src/lib/listingExtraction.js";
import { recordUsage, requestCountry } from "../src/lib/usageMetrics.js";
import type { RentSearchCriteria } from "../src/lib/rentAnalysis.js";

/**
 * 物件圖紙健檢：上傳仲介提供的物件概要書／図面圖片，讀取結構化資訊，
 * 與所在地區行情比對租金＋管理費是否合理，並提供初期費用深度試算與分析。
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
  station: string;
  walkTime: string;
  layout: string;
  rent: string;
  managementFee: string;
  keyMoney: string;
  deposit: string;
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
  specialNotes: string;
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
    分析這份日本不動產物件概要書／図面圖片，精準抓出各欄位內容，原文照抄不要翻譯或換算單位。

    車站與徒步時間（重要）：
    - 掃描整份文件，找出所有標示的車站與各自的徒步分鐘數。
    - station 只填車站名稱本身，不要包含「JR」「東京メトロ」「都営」這類營運商前綴，
      也不要包含路線名稱或結尾的「駅」字，例如文件寫「JR新宿駅」時 station 只填「新宿」。
    - 多個車站時，station 與 walkTime 用逗號分隔，且順序要對應
      （例如 station="新宿,代々木上原" walkTime="8,12"）。
    - 不要對不同車站填同一個徒步時間，除非文件上真的寫的是同一個數字。

    租金與各項契約費用（重要）：
    - rent（賃料／家賃）：照原文抓取，例如 "10.5万円" 或 "98,000円"。
    - managementFee（管理費／共益費）：照原文抓取，例如 "8,000円"，若寫込み或無則寫 "0円"。
    - keyMoney（礼金）：照原文抓取，例如 "1ヶ月"、"なし" 或 "0"。
    - deposit（敷金／保証金）：照原文抓取，例如 "1ヶ月"、"なし" 或 "0"。
    - guaranteeFee（保証会社費用／初回保証料）：照原文，例如 "50%"、"総賃料50%"、"4.5万円"。
    - lockReplacementFee（鍵交換代／シリンダー交換代）：照原文，例如 "22,000円"。
    - cleaningFee（退去時清掃費／室内クリーニング代／敷引／償却）：照原文，例如 "44,000円"。
    - insuranceFee（火災保険／家財保険料）：照原文，例如 "20,000円"。

    物件規格欄位（請格外仔細，務必尋找提取）：
    - layout（間取り，例如 "1K"、"1LDK"、"2DK"）。
    - area（専有面積／平米數／坪數）：
      * 請仔細在表格、間取り圖旁或建物概要搜尋「専有面積」「専有」「面積」「床面積」「建物面積」等標記。
      * 常見格式如 "25.40㎡"、"25.40m2"、"25.40m²"、"25.4平米"、"7.68坪"、"15.5帖"。
      * 圖紙上有任何面積標示，務必抓出，格式如 "25.40㎡"，不可遺漏！
    - structure（建物構造／構造・規模）：
      * 請仔細在「構造」「建物構造」「構造・規模」搜尋。
      * 常見寫法：英文簡稱如 RC、SRC、S、ALC、PC、W；日文漢字如 鉄筋コンクリート造、鉄骨鉄筋コンクリート造、鉄骨造、軽量鉄骨造、重量鉄骨造、木造等。
      * 即使只有簡寫如 "RC"、"SRC"、"S"、"木造"，也務必提取！
    - age（築年數／建築年月，例如 "築8年"、"2016年3月"）。
    - floor（所在階／總階數，例如 "4階 / 10階建"）。
    - address（所在地／住所）。

    特約條款與注意事項（極重要，牽涉承租人權益）：
    - shikibiki（敷引／償却／敷金償却）：
      * 極重要！請務必仔細檢查圖紙右上角或右側的「費用／條件表格」：
        表格中除了「敷金」「礼金」外，通常有獨立並列的「敷引」「償却金」「償却」等欄位儲存格！
        例如圖紙表格中常見：
        「敷金」格為 1（或 1ヶ月）
        「礼金」格為 1（或 1ヶ月）
        「敷引」格為 1（或 1ヶ月）！
      * 只要表格中的「敷引」或「償却金」「償却」儲存格有填寫任何數字或文字（例如 "1"、"1ヶ月"、"100%"、"50%"、"実費"），就代表有敷引！
      * 或在備考、特約欄標記「敷引」「解約時敷金1ヶ月償却」「退去時敷金1ヶ月引」等。
      * 務必照實填入 shikibiki（例如填 "1ヶ月" 或 "1" 或 "敷引1ヶ月"），絕對不可以忽略表格中的「敷引」一欄而填寫 "なし" 或空白！若確認表格該欄為 "-"、"なし" 或無此欄位才填 "なし"。
    - cancellationPenalty（短期解約違約金）：備考或特約是否有違約金？例如 "6ヶ月未満解約時総賃料1ヶ月" 或 "1年未満解約時賃料1ヶ月"。無則寫 "なし"。
    - renewalFee（更新料）：契約更新費用，例如 "1.5ヶ月(新賃料)" 或 "新賃料1ヶ月"、"更新料なし"。
    - specialNotes（其他特約・注意事項・生活限制）：
      請完整掃描備考、特約欄、設備條件、その他費用，抓出所有重要規定與雜費，例如：
      保證公司加入要求（如 "初回保証料70% 月次保証料1%"）、鍵交換費（如 "29,700円"）、契約事務手續費（如 "11,000円"）、退去時清掃費（如 "ハウスクリーニング代62,700円"）、月次費用（如 "Concierge24: 990円"）、寵物規定（如 "ペット不可"）、樂器規定、二人入居規定、防犯或安心服務等。

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
          station: { type: Type.STRING, description: "所有車站名稱，逗號分隔" },
          walkTime: { type: Type.STRING, description: "對應車站的徒步分鐘數，逗號分隔，順序需與 station 一致" },
          layout: { type: Type.STRING, description: "間取り，例如 1LDK、2DK、1K" },
          rent: { type: Type.STRING, description: "賃料／家賃，原文格式" },
          managementFee: { type: Type.STRING, description: "管理費／共益費，原文格式" },
          keyMoney: { type: Type.STRING, description: "礼金，原文格式" },
          deposit: { type: Type.STRING, description: "敷金／保証金，原文格式" },
          age: { type: Type.STRING, description: "築年數／建築年月" },
          floor: { type: Type.STRING, description: "所在階" },
          address: { type: Type.STRING, description: "地址／所在地" },
          area: { type: Type.STRING, description: "専有面積，例如 25.4㎡" },
          structure: { type: Type.STRING, description: "建物構造，例如 RC造" },
          guaranteeFee: { type: Type.STRING, description: "保證公司費用，照原文" },
          lockReplacementFee: { type: Type.STRING, description: "鍵交換費用，照原文" },
          cleaningFee: { type: Type.STRING, description: "退去清掃費／敷引，照原文" },
          insuranceFee: { type: Type.STRING, description: "火災保險費用，照原文" },
          shikibiki: { type: Type.STRING, description: "敷引／償却約定，例如 敷引1ヶ月 或 なし" },
          cancellationPenalty: { type: Type.STRING, description: "短期解約違約金，例如 1年未満解約時1ヶ月 或 なし" },
          renewalFee: { type: Type.STRING, description: "更新料，例如 新賃料1ヶ月 或 なし" },
          specialNotes: { type: Type.STRING, description: "備考與特約注意事項，例如 保證公司利用必須、寵物不可、退去時清掃費等" },
        },
        required: [
          "station", "walkTime", "layout", "rent", "managementFee",
          "keyMoney", "deposit", "age", "floor", "address",
          "area", "structure", "guaranteeFee", "lockReplacementFee",
          "cleaningFee", "insuranceFee", "shikibiki", "cancellationPenalty",
          "renewalFee", "specialNotes"
        ],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("empty analyze-listing response");
  return JSON.parse(text) as ExtractedListingFields;
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
  extractedShikibiki?: string;
}): InitialCostEstimate {
  const { rent, managementFee, keyMoney, deposit } = params;
  const totalMonthlyCost = rent + (managementFee ?? 0);

  const items: InitialCostBreakdownItem[] = [];

  // 1. 敷金（押金）
  const depositAmount = deposit ?? 0;
  const formattedShikibiki = formatShikibiki(params.extractedShikibiki);
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
    isFromFlyer: Boolean(params.extractedInsuranceFee),
    note: params.extractedInsuranceFee
      ? `圖紙標示：${params.extractedInsuranceFee}`
      : "保障租客財物與租賃賠償責任（常態約 1.8 萬～2.2 萬円）",
  });

  // 8. 鑰匙更換費
  const customLock = parseYenAmount(params.extractedLockReplacementFee);
  const lockAmount = customLock ?? 22000;
  items.push({
    id: "lockReplacementFee",
    name: "鑰匙更換費（鍵交換代）",
    amount: lockAmount,
    isFromFlyer: Boolean(params.extractedLockReplacementFee),
    note: params.extractedLockReplacementFee
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
      isFromFlyer: Boolean(params.extractedCleaningFee),
      note: params.extractedCleaningFee
        ? `圖紙標示：${params.extractedCleaningFee}`
        : "免押金物件通常於簽約時預收退租清掃費",
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
  if (hasShikibiki) {
    tips.push(`【⚠️ 重要特約・敷引（押金不退還）】圖紙載有「${formattedShikibiki}」，此約定表示退租時該筆押金將直接扣除沒收、絕不退還，實質形同額外禮金，請務必納入預算考量。`);
  }
  if (keyMoneyAmount === 0 && depositAmount === 0) {
    tips.push("本物件為「零禮金、零押金」，初期現金壓力極小；但請特別注意退租時的清潔費與原狀恢復計費特約條款。");
  } else if (keyMoneyAmount === 0) {
    tips.push("本物件「免禮金」，為您省下致贈房東的謝禮（相當於省下約 1 個月租金）。");
  } else if (keyMoneyAmount >= rent * 1.5) {
    tips.push("本物件禮金高達 1.5 個月以上，屬於熱門物件或都心精華地段常見設定，初期成本相對較高。");
  }

  tips.push("【節費建議】協調起租日在每月 25 號以後，當月日割租金僅需支付數天，可顯著壓低第一筆需匯出的初期總金額。");
  tips.push("【海外審查提醒】海外租客簽約初期費用多需以日本國內銀行匯款，若由海外電匯請預留約 4,000 円日本端受金手續費與匯差。");

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

    // 三個欄位都空的話，這張圖大概不是物件概要書——誠實說看不懂
    if (!extracted.station.trim() && !extracted.layout.trim() && !extracted.rent.trim()) {
      return res.status(422).json({ error: "無法從這張圖片讀出物件資訊，請確認上傳的是物件概要書或図面。" });
    }

    const rent = parseYenAmount(extracted.rent);
    const managementFee = parseYenAmount(extracted.managementFee);
    const roomType = normalizeRoomType(extracted.layout);
    const stations = extracted.station
      .split(/[,，]/)
      .map(s => stripStationOperatorPrefix(s))
      .filter((s): s is string => Boolean(s));

    let verdict = null;
    let range = null;
    if (rent !== null) {
      const totalMonthlyCost = rent + (managementFee ?? 0);
      const criteria: Partial<RentSearchCriteria> = {
        roomType: roomType ?? "k1",
        station: stations[0] ?? null,
        stations,
      };
      range = roomType ? estimateRequestedRent(criteria as RentSearchCriteria) : null;
      verdict = buildListingPriceVerdict(totalMonthlyCost, range);
    }

    const keyMoney = parseMonthsOrYen(extracted.keyMoney, rent);
    const deposit = parseMonthsOrYen(extracted.deposit, rent);
    const initialCostMonths = rent && (keyMoney !== null || deposit !== null)
      ? ((keyMoney ?? 0) + (deposit ?? 0)) / rent
      : null;

    const initialCostEstimate = rent !== null ? calculateInitialCostBreakdown({
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
      extractedShikibiki: extracted.shikibiki,
    }) : null;

    await recordUsage("listing-check", requestCountry(req));

    return res.status(200).json({
      extracted,
      parsed: {
        rent,
        managementFee,
        keyMoney,
        deposit,
        roomType,
        area: parseArea(extracted.area),
        structure: normalizeStructure(extracted.structure),
      },
      range,
      verdict,
      initialCostMonths,
      initialCostEstimate,
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
