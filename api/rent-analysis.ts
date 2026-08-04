import { GoogleGenAI, Type } from "@google/genai";
import { buildRentRecommendations, enrichRentCriteriaFromPrompt, RentSearchCriteria } from "../src/lib/rentAnalysis.js";
import { attachCommuteRoutes } from "../src/lib/transitRouteApi.js";
import { resolveSearchScope } from "../src/lib/requirementVerdict.js";
import { lookupMarketRate } from "./market-lookup.js";

const MAX_PROMPT_CHARS = 1000;
const ANALYSIS_RATE_LIMIT = 3;
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
      return res.status(429).json({ error: "AI 分析每 3 分鐘最多使用 3 次，請稍候再試。", retryAfter: limit.retryAfter });
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
            commutePreferredMinutes: { type: Type.NUMBER, nullable: true, description: "理想通勤時間；最長可接受時間放 commuteMinutes。" },
            locationPreference: { type: Type.STRING, nullable: true },
            nearbyAmenity: { type: Type.STRING, nullable: true },
            amenityWalkMinutes: { type: Type.NUMBER, nullable: true },
            buildingAgeMax: { type: Type.NUMBER, nullable: true },
            visaType: { type: Type.STRING, nullable: true },
            visaYears: { type: Type.NUMBER, nullable: true },
            structure: { type: Type.STRING, nullable: true },
            autoLock: { type: Type.BOOLEAN, nullable: true },
            floorMin: { type: Type.NUMBER, nullable: true },
            balcony: { type: Type.BOOLEAN, nullable: true },
            gasBurnersMin: { type: Type.NUMBER, nullable: true },
            freeInternet: { type: Type.BOOLEAN, nullable: true },
            lpGasAccepted: { type: Type.BOOLEAN, nullable: true },
            cityGasRequired: { type: Type.BOOLEAN, nullable: true },
            petsAllowed: { type: Type.BOOLEAN, nullable: true },
            petType: { type: Type.STRING, nullable: true },
            washbasin: { type: Type.BOOLEAN, nullable: true },
            bidet: { type: Type.BOOLEAN, nullable: true },
            elevator: { type: Type.BOOLEAN, nullable: true },
            furnished: { type: Type.BOOLEAN, nullable: true },
            tower: { type: Type.BOOLEAN, nullable: true }
            ,moveInTiming: { type: Type.STRING, nullable: true, description: "希望入住的時間，例如「9月底」「明年3月」。沒提到回傳 null。" },
            householdSize: { type: Type.NUMBER, nullable: true, description: "同住人數。沒提到回傳 null。" },
            currentResidence: { type: Type.STRING, nullable: true, description: "目前在日本的居住地或住宿狀態。" },
            employmentStartTiming: { type: Type.STRING, nullable: true, description: "入社或到職時間。" },
            initialCostBudget: { type: Type.NUMBER, nullable: true, description: "初期費用上限，單位日圓。" },
            otherNeeds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "使用者提到、但其他欄位裝不下的需求。每項務必是 12 字以內的短詞（例如「離超市近」「安靜」），不可寫成句子或加上任何說明與免責語氣。沒有就回傳空陣列。"
            },
            otherNeedNotes: {
              type: Type.ARRAY,
              description: "為 otherNeeds 的每一項補上實務判讀。沒有 otherNeeds 就回傳空陣列。",
              items: {
                type: Type.OBJECT,
                properties: {
                  condition: { type: Type.STRING, description: "對應 otherNeeds 中的同一個短詞，必須完全一致。" },
                  marketImpact: { type: Type.STRING, description: "一句話說明這個條件在日本租屋市場的供給現實，以及它與使用者其他條件（預算、屋齡、地點、通勤）的衝突點，25～50 字。" },
                  difficulty: { type: Type.STRING, enum: ["easy", "normal", "hard"], description: "此條件對可選物件數量的壓縮程度。" }
                },
                required: ["condition", "marketImpact", "difficulty"]
              }
            }
          },
          required: ["roomType", "areaMin", "maxBudget", "budgetIncludesFees", "district", "districts", "station", "stations", "line", "walkMinutes", "commuteStation", "commuteStations", "commuteMinutes", "commutePreferredMinutes", "locationPreference", "nearbyAmenity", "amenityWalkMinutes", "buildingAgeMax", "visaType", "visaYears", "structure", "autoLock", "floorMin", "balcony", "gasBurnersMin", "freeInternet", "lpGasAccepted", "cityGasRequired", "petsAllowed", "petType", "washbasin", "bidet", "elevator", "furnished", "tower", "moveInTiming", "householdSize", "currentResidence", "employmentStartTiming", "initialCostBudget", "otherNeeds", "otherNeedNotes"]
        },
        systemInstruction: `你是日本租屋需求理解器。使用者會用自由、模糊、跳號或口語的方式描述需求（例如「2.未定」「5.不知道」「可能需要含家具？」），請保留原意並合理結構化。

最重要的規則：只能萃取使用者真的說過的條件。
- 使用者沒有提到的欄位一律回傳 null，不可猜測、不可補完、不可因為常見就填。
- 布林欄位沒提到時必須回傳 null，不要回傳 false 充數；使用者明確說不需要才回傳 false。
- 「不知道」「未定」「還沒想好」「再看看」代表未指定，對應欄位回傳 null，不要轉成任何條件。
- 帶問號或「可能」「也許」的條件仍要萃取，但那是不確定的偏好，不是硬性條件。

未指定格局時以 k1 作為搜尋基準。多個通勤目的地全部放入 commuteStations，主要摘要放入 commuteStation；同時有理想與最長通勤時間時，理想值放 commutePreferredMinutes，最長值放 commuteMinutes；無法化成單一車站但仍有意義的描述保留在 locationPreference。

入住時間、目前居住地、入社時間、同住人數與初期費用上限要分別放入 moveInTiming、currentResidence、employmentStartTiming、householdSize、initialCostBudget；「獨居」等於 householdSize 1。

visaType 請照原文的在留資格填寫（留學、技人國、打工度假、家族滯在、永住等），不要把留學生和工作簽混用。

otherNeeds 只收「其他欄位真的裝不下」的需求，且必須是短詞。不要把已經有欄位的東西（預算、通勤、格局、屋齡、設備、寵物）重複塞進來，也不要寫成句子或加上任何說明、理由與免責語氣。

otherNeedNotes 要為 otherNeeds 的每一項補上實務判讀，寫給要去找房的租客看：
- 這是「需求可行性評估」，要回答的是這個條件讓找房變難還是變簡單、以及它跟使用者
  其他條件（預算、屋齡、地點、通勤、格局）有沒有互相衝突。
- marketImpact 只寫一句話（25～50 字），講供給現實與衝突點。
  例（樂器可）：「樂器可物件供給集中在特定管理公司，數量少且租金普遍高於同區行情。」
  例（乾濕分離）：「乾濕分離多見於屋齡較新的物件，與壓低預算或接受高屋齡的方向相衝突。」
- 不要寫成操作指示。不要叫使用者去任何網站勾選條件、也不要叫他用本站計算機——
  他已經把條件告訴我們了，這裡要給的是判斷，不是導覽。
- 只有當該條件真的無法從資料判斷（例如現場聲音、夜間治安、告知事項），才說明需在
  內見或申請階段確認，並直接講要確認什麼。
- 絕對禁止這些寫法：不代表、不能只以、尚未確認、仍需逐屋確認、不得視為、建議再核對、可能需要、或許、視情況而定。
  要用肯定句直接給做法，不要加免責。
- 不可捏造任何數字（租金、比例、物件數、坪數都不行）。不知道具體數字就不要提數字。
- difficulty 依日本租屋市場的實際供給判斷：
  easy＝一般物件本來就滿足（例如專用衛浴）；
  normal＝要靠圖面或現場逐件確認；
  hard＝供給明顯偏少、會大幅限縮可選物件（例如樂器可、事務所可、無保証人）。
- condition 必須與 otherNeeds 裡的短詞完全一致。

只輸出符合 schema 的 JSON。`
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

    // 只有站內資料涵蓋不到時才外部查詢：resolveSearchScope 回傳空集合就代表
    // 使用者指定的地區不在 rentRates 裡（例如名古屋、福岡）。已經有基準值的地區
    // 再查一次只是多花時間與費用，數字也不會比自家基準更適合用來判斷。
    // 與通勤路線並行，避免延遲疊加。
    const scope = resolveSearchScope(criteria);
    const requestedArea = scope.districts.size
      ? null
      : [
          criteria.district,
          ...(criteria.districts || []),
          criteria.station,
          ...(criteria.stations || []),
          criteria.line,
          criteria.locationPreference
        ].find(value => typeof value === "string" && value.trim().length >= 2) || null;

    const [recommendations, marketReference] = await Promise.all([
      attachCommuteRoutes(criteria, buildRentRecommendations(criteria)),
      requestedArea ? lookupMarketRate(requestedArea, criteria.roomType) : Promise.resolve(null)
    ]);

    return res.status(200).json({ criteria, recommendations, marketReference, model: "gemini-3.1-flash-lite" });
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
