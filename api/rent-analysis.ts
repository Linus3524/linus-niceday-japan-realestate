import { GoogleGenAI, Type } from "@google/genai";
import { buildMarketReality, buildRentRecommendations, enrichRentCriteriaFromPrompt, RentSearchCriteria } from "../src/lib/rentAnalysis.js";

const MAX_PROMPT_CHARS = 1000;
const ANALYSIS_RATE_LIMIT = 3;
const ANALYSIS_RATE_WINDOW_MS = 300_000;
const analysisRateBuckets = new Map<string, { count: number; resetAt: number }>();

let aiClient: GoogleGenAI | null = null;

function getAiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is missing from Vercel environment variables.");
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

function getRateLimit(ip: string) {
  const now = Date.now();
  const bucket = analysisRateBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    analysisRateBuckets.set(ip, { count: 1, resetAt: now + ANALYSIS_RATE_WINDOW_MS });
    return { limited: false, remaining: ANALYSIS_RATE_LIMIT - 1, retryAfter: 0 };
  }
  bucket.count++;
  return { limited: bucket.count > ANALYSIS_RATE_LIMIT, remaining: Math.max(0, ANALYSIS_RATE_LIMIT - bucket.count), retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed. Use POST." });

  try {
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
    if (!prompt || prompt.length > MAX_PROMPT_CHARS) {
      return res.status(400).json({ error: "請輸入 1～1000 字的租屋需求。" });
    }
    const ip = String(req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown").split(",")[0].trim();
    const limit = getRateLimit(ip);
    res.setHeader("X-RateLimit-Limit", String(ANALYSIS_RATE_LIMIT));
    res.setHeader("X-RateLimit-Remaining", String(limit.remaining));
    if (limit.limited) {
      res.setHeader("Retry-After", String(limit.retryAfter));
      return res.status(429).json({ error: "AI 分析每 5 分鐘最多使用 3 次，請稍候再試。", retryAfter: limit.retryAfter });
    }
    const response = await getAiClient().models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            roomType: { type: Type.STRING, enum: ["r1", "k1", "ldk1", "ldk2"] },
            areaMin: { type: Type.NUMBER, nullable: true },
            maxBudget: { type: Type.NUMBER, nullable: true, description: "每月預算，單位為日圓；萬円須換算為日圓。" },
            budgetIncludesFees: { type: Type.BOOLEAN, nullable: true },
            district: { type: Type.STRING, nullable: true },
            districts: { type: Type.ARRAY, items: { type: Type.STRING } },
            station: { type: Type.STRING, nullable: true, description: "移除站或駅字尾的車站名稱。" },
            stations: { type: Type.ARRAY, items: { type: Type.STRING } },
            line: { type: Type.STRING, nullable: true },
            walkMinutes: { type: Type.NUMBER, nullable: true },
            commuteStation: { type: Type.STRING, nullable: true },
            nearbyAmenity: { type: Type.STRING, nullable: true },
            amenityWalkMinutes: { type: Type.NUMBER, nullable: true },
            buildingAgeMax: { type: Type.NUMBER, nullable: true },
            visaType: { type: Type.STRING, nullable: true },
            visaYears: { type: Type.NUMBER, nullable: true },
            structure: { type: Type.STRING, nullable: true },
            autoLock: { type: Type.BOOLEAN },
            floorMin: { type: Type.NUMBER, nullable: true },
            balcony: { type: Type.BOOLEAN },
            gasBurnersMin: { type: Type.NUMBER, nullable: true },
            freeInternet: { type: Type.BOOLEAN },
            lpGasAccepted: { type: Type.BOOLEAN },
            cityGasRequired: { type: Type.BOOLEAN },
            petsAllowed: { type: Type.BOOLEAN },
            petType: { type: Type.STRING, nullable: true },
            washbasin: { type: Type.BOOLEAN },
            bidet: { type: Type.BOOLEAN },
            elevator: { type: Type.BOOLEAN },
            furnished: { type: Type.BOOLEAN },
            tower: { type: Type.BOOLEAN }
          },
          required: ["roomType", "areaMin", "maxBudget", "budgetIncludesFees", "district", "districts", "station", "stations", "line", "walkMinutes", "commuteStation", "nearbyAmenity", "amenityWalkMinutes", "buildingAgeMax", "visaType", "visaYears", "structure", "autoLock", "floorMin", "balcony", "gasBurnersMin", "freeInternet", "lpGasAccepted", "cityGasRequired", "petsAllowed", "petType", "washbasin", "bidet", "elevator", "furnished", "tower"]
        },
        systemInstruction: "你是日本租屋條件解析器。只擷取使用者明確說出的條件，不可自行補充；未指定格局時以 k1 作為搜尋基準。完整保留多個行政區與車站；辨識簽證、通勤地、生活機能、建物結構、自動門（オートロック）、樓層、陽台、爐具、免費網路（インターネット無料／網路費包含）、瓦斯與寵物條件。只有使用者明確表示可接受 LP 瓦斯時 lpGasAccepted 才可為 true；表示希望都市瓦斯、都市ガス限定、不要或不接受 LP 瓦斯時 cityGasRequired 為 true。兩者不可同時為 true。辨識繁體中文、簡體中文、日文漢字、平假名、片假名與常見設備同義詞。只輸出符合 schema 的 JSON。"
      }
    });

    const criteria = enrichRentCriteriaFromPrompt(JSON.parse(response.text || "{}") as RentSearchCriteria, prompt);
    const recommendations = buildRentRecommendations(criteria);
    const reality = buildMarketReality(criteria, recommendations);

    return res.status(200).json({ criteria, recommendations, reality, model: "gemini-3.1-flash-lite" });
  } catch (error: any) {
    console.error("Gemini rent analysis error:", error);
    const missingKey = String(error?.message || "").includes("GEMINI_API_KEY");
    return res.status(500).json({
      error: missingKey
        ? "AI 分析服務尚未設定 Gemini API 金鑰。"
        : "AI 暫時無法解析需求，請稍後再試或改用下方手動估算。"
    });
  }
}
