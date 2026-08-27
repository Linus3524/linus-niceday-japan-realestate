import { GoogleGenAI } from "@google/genai";

/**
 * 市場行情即時查詢（獨立於可行性評估）。
 *
 * 刻意與 rentRates 分開：站內判斷一律以自家基準值為準，兩側才會一致且可預測。
 * 這裡的搜尋結果只作「參考」，不回饋到預算軸或推薦排序——一旦讓浮動的即時數字
 * 參與判斷，同一組條件在不同時間會得到不同結論，左右對齊會再次失效。
 *
 * 取得方式是 Gemini 的 Google Search grounding：由搜尋引擎的公開索引取得資料並
 * 回傳來源網址，不是繞過網站直接擷取內容。
 */

const RATE_LIMIT = 8;
const RATE_WINDOW_MS = 300_000;
const buckets = new Map<string, { count: number; resetAt: number }>();

function getRateLimit(ip: string) {
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { limited: false, retryAfter: 0 };
  }
  bucket.count++;
  return { limited: bucket.count > RATE_LIMIT, retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
}

let client: GoogleGenAI | null = null;
function getAiClient() {
  if (!client) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is missing.");
    client = new GoogleGenAI({ apiKey: key });
  }
  return client;
}

const ROOM_LABEL: Record<string, string> = { r1: "1R", k1: "1K", ldk1: "1LDK", ldk2: "2LDK" };
/** 只接受站內既有的房型代碼，避免把任意字串拼進搜尋語句。 */
const ALLOWED_ROOM_TYPES = new Set(Object.keys(ROOM_LABEL));
const MARKET_LOOKUP_TIMEOUT_MS = 10_000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeout = setTimeout(() => reject(new Error("Market lookup timeout")), timeoutMs);
      })
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

/**
 * 從搜尋結果的敘述中抽出租金區間。
 *
 * 優先抓「X萬至Y萬」這種明確成對的寫法；模型談到不同車站或屋況時會列出多組數字，
 * 直接取全文最小與最大值會把區間拉得過寬（例如把塔樓頂規也算進來）。
 */
function extractYenRange(text: string) {
  const toYen = (value: string) => Math.round(Number(value) * 10000);
  const inRange = (value: number) => value >= 20000 && value <= 1000000;

  const pair = text.match(/(\d+(?:\.\d+)?)\s*[萬万][^\d]{0,6}?(?:至|到|~|～|〜|-|－)\s*(\d+(?:\.\d+)?)\s*[萬万]/);
  if (pair) {
    const low = toYen(pair[1]);
    const high = toYen(pair[2]);
    if (inRange(low) && inRange(high) && low <= high) return { low, high };
  }

  const values = [...text.matchAll(/(\d+(?:\.\d+)?)\s*[萬万]/g)].map(match => toYen(match[1])).filter(inRange);
  if (!values.length) return null;
  return { low: Math.min(...values), high: Math.max(...values) };
}

export interface MarketLookupResult {
  area: string;
  roomType: string;
  roomLabel: string;
  low: number;
  high: number;
  sources: string[];
  queriedAt: string;
}

/**
 * 查詢公開市場行情。查不到或發生錯誤一律回傳 null——
 * 這是「參考資訊」，不能因為它失敗就讓整份需求分析壞掉。
 */
export async function lookupMarketRate(area: string, roomType: string): Promise<MarketLookupResult | null> {
  const trimmed = (area || "").trim().slice(0, 40);
  if (!trimmed || !ALLOWED_ROOM_TYPES.has(roomType)) return null;
  const label = ROOM_LABEL[roomType];

  try {
    // 兩個關鍵：
    // 1. 必須明講「請搜尋」，否則模型會憑記憶回答，groundingMetadata 完全不存在；
    //    那種數字沒有來源也無從查核，不能當成市場行情呈現。
    // 2. 不可把輸出格式限制得太死（例如「只輸出兩行」），一旦這樣寫模型會直接作答
    //    而跳過搜尋。所以讓它自然敘述，數字由程式端擷取。
    const response = await withTimeout(getAiClient().models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [{
        role: "user",
        parts: [{ text: `請搜尋 SUUMO 或 LIFULL HOME'S，「${trimmed}」的 ${label} 平均家賃相場是多少日圓？` }]
      }],
      config: { tools: [{ googleSearch: {} }], temperature: 0 }
    }), MARKET_LOOKUP_TIMEOUT_MS);

    const text = (response.text || "").trim();
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    // 沒有實際搜尋到來源就不回傳數字：無來源的金額與模型憑空回答無異。
    if (!chunks.length) return null;

    const range = extractYenRange(text);
    if (!range) return null;

    const sources = [...new Set(
      chunks
        .map((chunk: any) => chunk.web?.domain || chunk.web?.title || "")
        .map((value: string) => value.replace(/^www\./, ""))
        .filter(Boolean)
    )].slice(0, 5);

    return {
      area: trimmed,
      roomType,
      roomLabel: label,
      low: range.low,
      high: range.high,
      sources,
      queriedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("Market lookup failed:", error);
    return null;
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed. Use POST." });

  try {
    const area = typeof req.body?.area === "string" ? req.body.area.trim().slice(0, 40) : "";
    const roomType = typeof req.body?.roomType === "string" ? req.body.roomType : "k1";
    if (!area) return res.status(400).json({ error: "請提供要查詢的地區或車站。" });
    if (!ALLOWED_ROOM_TYPES.has(roomType)) return res.status(400).json({ error: "房型代碼不正確。" });

    const ip = String(req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown").split(",")[0].trim();
    const limit = getRateLimit(ip);
    if (limit.limited) {
      res.setHeader("Retry-After", String(limit.retryAfter));
      return res.status(429).json({ error: "行情查詢每 5 分鐘最多 8 次，請稍候再試。", retryAfter: limit.retryAfter });
    }

    const result = await lookupMarketRate(area, roomType);
    if (!result) {
      return res.status(200).json({ found: false, message: "目前查不到這個地區的公開行情資料。" });
    }
    return res.status(200).json({ found: true, ...result });
  } catch (error: any) {
    console.error("Market lookup error:", error);
    return res.status(500).json({ error: "行情查詢暫時無法使用，請稍後再試。" });
  }
}
