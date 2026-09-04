import { GoogleGenAI, Type } from "@google/genai";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { resolveSearchScope, estimateRequestedRent, buildListingPriceVerdict } from "../src/lib/requirementVerdict.js";
import { parseYenAmount, parseMonthsOrYen, normalizeRoomType, stripStationOperatorPrefix } from "../src/lib/listingExtraction.js";
import { recordUsage, requestCountry } from "../src/lib/usageMetrics.js";
import type { RentSearchCriteria } from "../src/lib/rentAnalysis.js";

/**
 * 物件圖紙健檢：上傳仲介提供的物件概要書／図面圖片，讀取結構化資訊，
 * 與所在地區行情比對租金＋管理費是否合理。
 *
 * 不做的事（見對話討論與 plan）：不接受物件網址（SUUMO／At Home／LIFULL HOME'S
 * 這類平台的自動化存取通常違反其使用條款，且頁面結構不受控）；不算步行時間與
 * 周邊設施（需要精確座標，留待後續有 geocoding 的階段）；只做租賃側，不判斷
 * 買賣物件。
 */

// Vercel Function 的請求 body 上限是 4.5MB（硬限制，無法調整）。base64 編碼會讓
// 原始位元組膨脹約 1.37 倍，所以原始圖片位元組必須抓得比 4.5MB 保守很多，
// 才留得出 JSON 包裝與其他欄位的空間。3 張圖、合計 3MB 原始位元組是留了
// 安全邊際後的上限，客戶端與伺服器端都要擋，不能只靠前端擋（前端檢查可被繞過）。
const MAX_FILES = 3;
const MAX_TOTAL_IMAGE_BYTES = 3 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "application/pdf"]);

// 獨立於 /api/rent-analysis 的限流：vision 呼叫成本較高，兩個功能共用額度會讓
// 使用者在用其中一個功能時意外卡住另一個，彼此互不相干比較合理。
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
  data: string; // base64，不含 data URL 前綴
}

/** base64 字串還原成原始位元組數的估算：每 4 個 base64 字元代表 3 個位元組。 */
function estimateBytesFromBase64(base64: string): number {
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

/**
 * 用拋例外表示驗證失敗，不用 discriminated union 回傳值。
 *
 * 這個專案的 tsconfig 沒開 strictNullChecks（未設定 strict），該設定關閉時
 * `if (!result.ok) return result.error` 這種寫法的型別窄化不會生效
 * （`result.error` 在兩個分支合併後的型別上找不到），tsc 會報錯。
 * instanceof 窄化不受這個設定影響，且與此檔案其餘 try/catch 錯誤處理風格一致。
 */
class ListingUploadError extends Error {}

function validateFiles(files: unknown): UploadedFile[] {
  if (!Array.isArray(files) || files.length === 0) {
    throw new ListingUploadError("請上傳至少一張物件概要書或図面的圖片。");
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
      throw new ListingUploadError("只接受 JPG、PNG、WEBP、HEIC 或 PDF 檔案。");
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

interface ExtractedListingFields {
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
}

async function extractListingFields(files: UploadedFile[]): Promise<ExtractedListingFields> {
  const prompt = `
    分析這份日本不動產物件概要書／図面圖片，抓出欄位內容，原文照抄不要翻譯或換算單位。

    車站與徒步時間（重要）：
    - 掃描整份文件，找出所有標示的車站與各自的徒步分鐘數。
    - station 只填車站名稱本身，不要包含「JR」「東京メトロ」「都営」這類營運商前綴，
      也不要包含路線名稱或結尾的「駅」字，例如文件寫「JR新宿駅」時 station 只填「新宿」。
    - 多個車站時，station 與 walkTime 用逗號分隔，且順序要對應
      （例如 station="新宿,代々木上原" walkTime="8,12"）。
    - 不要對不同車站填同一個徒步時間，除非文件上真的寫的是同一個數字。

    金額欄位：
    - rent（賃料／家賃）、managementFee（管理費／共益費）、keyMoney（礼金）、deposit（敷金）
      照文件上寫的原文格式抓取，例如 "10.5万円" 或 "1ヶ月"，不要自己換算成數字。
    - 找不到的欄位留空字串，不要猜測或用 0 代替。

    其他欄位：layout（間取り，例如 "1LDK"）、age（築年數）、floor（所在階）、address（地址／所在地）。
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
          layout: { type: Type.STRING, description: "間取り，例如 1LDK、2DK" },
          rent: { type: Type.STRING, description: "賃料／家賃，原文格式" },
          managementFee: { type: Type.STRING, description: "管理費／共益費，原文格式" },
          keyMoney: { type: Type.STRING, description: "礼金，原文格式" },
          deposit: { type: Type.STRING, description: "敷金，原文格式" },
          age: { type: Type.STRING },
          floor: { type: Type.STRING },
          address: { type: Type.STRING },
        },
        required: ["station", "walkTime", "layout", "rent", "managementFee", "keyMoney", "deposit", "age", "floor", "address"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("empty analyze-listing response");
  return JSON.parse(text) as ExtractedListingFields;
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

    // 三個欄位都空的話，這張圖大概不是物件概要書——誠實說看不懂，
    // 不要硬湊一份幾乎全空的「分析結果」出來。
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

    await recordUsage("listing-check", requestCountry(req));

    return res.status(200).json({
      extracted,
      parsed: { rent, managementFee, keyMoney, deposit, roomType },
      range,
      verdict,
      initialCostMonths,
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
