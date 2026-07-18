import { GoogleGenAI, Type } from "@google/genai";
import { buildMarketReality, buildRentRecommendations, enrichRentCriteriaFromPrompt, RentSearchCriteria } from "../src/lib/rentAnalysis.js";

const MAX_PROMPT_CHARS = 1000;
const ANALYSIS_RATE_LIMIT = 5;
const ANALYSIS_RATE_WINDOW_MS = 180_000;
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

function shouldRetryRentAnalysis(error: any) {
  const message = String(error?.message || error || "");
  if (/spending cap|billing|API key|permission|unauthenticated/i.test(message)) return false;
  const status = Number(error?.status || error?.code || error?.response?.status);
  return error instanceof SyntaxError ||
    /empty rent-analysis response|timeout|temporar|overload|unavailable|resource exhausted/i.test(message) ||
    status === 429 ||
    status >= 500;
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
      return res.status(429).json({ error: "AI 分析每 3 分鐘最多使用 5 次，請稍候再試。", retryAfter: limit.retryAfter });
    }
    const generateCriteria = async () => {
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
            commuteStations: { type: Type.ARRAY, items: { type: Type.STRING } },
            commuteMinutes: { type: Type.NUMBER, nullable: true },
            locationPreference: { type: Type.STRING, nullable: true },
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
            ,analysisNotes: {
              type: Type.OBJECT,
              nullable: true,
              properties: {
                visa: { type: Type.STRING, nullable: true },
                location: { type: Type.STRING, nullable: true },
                amenity: { type: Type.STRING, nullable: true },
                layout: { type: Type.STRING, nullable: true },
                building: { type: Type.STRING, nullable: true },
                walking: { type: Type.STRING, nullable: true },
                equipment: { type: Type.STRING, nullable: true },
                special: { type: Type.STRING, nullable: true }
              },
              required: ["visa", "location", "amenity", "layout", "building", "walking", "equipment", "special"]
            }
          },
          required: ["roomType", "areaMin", "maxBudget", "budgetIncludesFees", "district", "districts", "station", "stations", "line", "walkMinutes", "commuteStation", "commuteStations", "commuteMinutes", "locationPreference", "nearbyAmenity", "amenityWalkMinutes", "buildingAgeMax", "visaType", "visaYears", "structure", "autoLock", "floorMin", "balcony", "gasBurnersMin", "freeInternet", "lpGasAccepted", "cityGasRequired", "petsAllowed", "petType", "washbasin", "bidet", "elevator", "furnished", "tower", "analysisNotes"]
        },
        systemInstruction: "你是日本租屋需求理解器。使用者會用自由、模糊或口語的方式描述生活圈與通勤需求；請保留原意並合理結構化，不要要求固定句型，也不可自行捏造條件。未指定格局時以 k1 作為搜尋基準。多個通勤目的地全部放入 commuteStations，主要摘要放入 commuteStation；通勤時間放入 commuteMinutes；無法化成單一車站但仍有意義的描述保留在 locationPreference，絕不可因此判定為未指定地點。analysisNotes 要依本次原文逐項寫給租客看的個人化分析，每項一至兩句，必須連結使用者實際提出的入住時間、人數、簽證、通勤、格局或設備；不要出現『本站』『模型』『已辨識』『需逐間確認』等開發者口吻，也不可自行編造租金數字。未提到的項目可回傳 null。辨識簽證、生活機能、建物結構、自動門、樓層、陽台、爐具、免費網路、瓦斯與寵物條件。只輸出符合 schema 的 JSON。"
        }
      });
      const responseText = response.text?.trim();
      if (!responseText) throw new Error("Gemini returned an empty rent-analysis response.");
      return JSON.parse(responseText) as RentSearchCriteria;
    };
    let parsedCriteria: RentSearchCriteria;
    try {
      parsedCriteria = await generateCriteria();
    } catch (firstError) {
      if (!shouldRetryRentAnalysis(firstError)) throw firstError;
      console.warn("Gemini rent analysis first attempt failed; retrying once:", firstError);
      await new Promise(resolve => setTimeout(resolve, 300));
      parsedCriteria = await generateCriteria();
    }

    const criteria = enrichRentCriteriaFromPrompt(parsedCriteria, prompt);
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
