import { GoogleGenAI, Type } from "@google/genai";
import { buildRentRecommendations, enrichRentCriteriaFromPrompt, RentRecommendation, RentSearchCriteria } from "../src/lib/rentAnalysis.js";
import { attachCommuteRoutes } from "../src/lib/transitRouteApi.js";
import { hasKnownCommuteStations, resolveSearchScope } from "../src/lib/requirementVerdict.js";
import { lookupMarketRate } from "./market-lookup.js";
import { SYSTEM_INSTRUCTION } from "./chat.js";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { recordUsage, requestCountry } from "../src/lib/usageMetrics.js";

const MAX_PROMPT_CHARS = 1000;
const ANALYSIS_RATE_LIMIT = 3;
const ANALYSIS_RATE_WINDOW_MS = 180_000;
const analysisRateBuckets = new Map<string, { count: number; resetAt: number }>();

// 與 /api/chat 一致：優先用 Upstash，所有 serverless instance 共用同一組計數。
// 先前只有下面的記憶體版，而 Vercel 每個 instance 各自一份 bucket，
// 併發時實際上限會變成 3 × instance 數，等於沒有限流。
const upstashAnalysisLimiter =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(ANALYSIS_RATE_LIMIT, "180 s"),
        prefix: "linus-rent-analysis",
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
  if (upstashAnalysisLimiter) {
    try {
      const { success, remaining, reset } = await upstashAnalysisLimiter.limit(ip);
      return {
        limited: !success,
        remaining: Math.max(0, remaining),
        retryAfter: Math.max(1, Math.ceil((reset - Date.now()) / 1000)),
      };
    } catch (error) {
      // Redis 不通時退回記憶體版，而不是把使用者擋在門外。
      console.error("Upstash rent-analysis rate limit error, falling back to in-memory:", error);
    }
  }
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

async function generateAdvisorAdvice(criteria: RentSearchCriteria, recommendations: RentRecommendation[]) {
  const recommendationSummary = recommendations.slice(0, 3).map(item => ({
    district: item.district,
    station: item.station,
    estimate: item.estimate,
    budgetGap: item.budgetGap,
    fit: item.fit,
    commuteFit: item.commuteFit,
    commuteTimeFit: item.commuteTimeFit,
    commuteMinutes: item.commuteRoute?.totalDurationMinutes ?? null,
    transfers: item.commuteRoute?.transfers ?? null,
    cautions: item.cautions
  }));
  const response = await getAiClient().models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: [{
      role: "user",
      parts: [{ text: `這是租屋條件分析器已完成的結構化結果。請依照 AI 不動產顧問的既有專業規則，提供真正針對本次條件的實務意見。\n\n租屋條件：${JSON.stringify(criteria)}\n前三個搜尋方向：${JSON.stringify(recommendationSummary)}` }]
    }],
    config: {
      temperature: 0.2,
      maxOutputTokens: 500,
      systemInstruction: `${SYSTEM_INSTRUCTION}\n\n【計算器內嵌租屋意見】\n這不是一般聊天回覆，而是顯示在試算結果下方的短評。只寫 100～180 字，不要開場、自我介紹、結尾祝福、表情符號、LINE 或聯絡邀請。不得重複月租總額、基準租金、加價明細或推薦車站清單，因為畫面上方已經顯示。請只整理三個有差異化的重點：「整體判斷」、「優先保留」、「可先放寬」。每項一行，以「- 」開頭；如果資料不足，直接指出最影響判斷的缺漏，不要推測。不得聲稱有即時空房。`
    }
  });
  return response.text?.trim() || null;
}

/**
 * 判斷 AI 有沒有從這段文字擷取到任何實質的租屋條件。
 *
 * roomType 不能拿來判斷——schema 規定它一定要有值，沒提到就填 k1，
 * 所以連「今天天氣真好」都會有房型。真正代表「這是一則租屋需求」的，
 * 是預算、地點、通勤、面積這些使用者主動說出來的東西。
 *
 * 全部落空時硬給推薦沒有意義：使用者會拿到一組與他無關的車站清單，
 * 卻不知道系統其實沒看懂他在說什麼。
 */
function hasMeaningfulCriteria(criteria: RentSearchCriteria): boolean {
  const values: unknown[] = [
    criteria.maxBudget, criteria.minBudget, criteria.initialCostBudget,
    criteria.district, criteria.station, criteria.line, criteria.commuteStation,
    criteria.locationPreference, criteria.nearbyAmenity,
    criteria.areaMin, criteria.buildingAgeMax, criteria.walkMinutes,
    criteria.commuteMinutes, criteria.floorMin, criteria.visaType,
    criteria.moveInTiming, criteria.householdSize, criteria.currentResidence,
  ];
  if (values.some(value => value !== null && value !== undefined && value !== "")) return true;
  const lists = [criteria.districts, criteria.stations, criteria.lines, criteria.commuteStations, criteria.otherNeeds];
  return lists.some(list => Array.isArray(list) && list.length > 0);
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed. Use POST." });

  try {
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
    const submittedCriteria = req.body?.criteria && typeof req.body.criteria === "object"
      ? req.body.criteria as RentSearchCriteria
      : null;
    const hasValidStructuredCriteria = Boolean(
      submittedCriteria &&
      ["r1", "k1", "ldk1", "ldk2", "ldk3"].includes(submittedCriteria.roomType) &&
      Number.isFinite(Number(submittedCriteria.maxBudget)) &&
      Number(submittedCriteria.maxBudget) > 0
    );
    if (!hasValidStructuredCriteria && (!prompt || prompt.length > MAX_PROMPT_CHARS)) {
      return res.status(400).json({ error: "請輸入 1～1000 字的租屋需求。" });
    }
    const ip = String(req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown").split(",")[0].trim();
    const limit = await getRateLimit(ip);
    res.setHeader("X-RateLimit-Limit", String(ANALYSIS_RATE_LIMIT));
    res.setHeader("X-RateLimit-Remaining", String(limit.remaining));
    if (limit.limited) {
      res.setHeader("Retry-After", String(limit.retryAfter));
      return res.status(429).json({ error: "AI 分析每 3 分鐘最多使用 3 次，請稍候再試。", retryAfter: limit.retryAfter });
    }
    let criteria: RentSearchCriteria;
    if (hasValidStructuredCriteria && submittedCriteria) {
      criteria = {
        ...submittedCriteria,
        maxBudget: Number(submittedCriteria.maxBudget),
        initialCostBudget: submittedCriteria.initialCostBudget ? Number(submittedCriteria.initialCostBudget) : null,
        commuteMinutes: submittedCriteria.commuteMinutes ? Number(submittedCriteria.commuteMinutes) : null
      };
    } else {
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
            roomType: { type: Type.STRING, enum: ["r1", "k1", "ldk1", "ldk2", "ldk3"] },
            areaMin: { type: Type.NUMBER, nullable: true },
            maxBudget: { type: Type.NUMBER, nullable: true, description: "每月預算上限，單位為日圓；萬円須換算為日圓。" },
            minBudget: { type: Type.NUMBER, nullable: true, description: "使用者給預算區間時的下限，單位為日圓，例如「5萬多到6萬多」填 50000。只給單一數字或上限時填 null。" },
            budgetIncludesFees: { type: Type.BOOLEAN, nullable: true },
            district: { type: Type.STRING, nullable: true },
            districts: { type: Type.ARRAY, items: { type: Type.STRING } },
            station: { type: Type.STRING, nullable: true, description: "移除站或駅字尾的車站名稱。" },
            stations: { type: Type.ARRAY, items: { type: Type.STRING } },
            line: { type: Type.STRING, nullable: true },
            lines: { type: Type.ARRAY, items: { type: Type.STRING } },
            walkMinutes: { type: Type.NUMBER, nullable: true },
            commuteStation: { type: Type.STRING, nullable: true },
            commuteStations: { type: Type.ARRAY, items: { type: Type.STRING } },
            commuteMinutes: { type: Type.NUMBER, nullable: true },
            commutePreferredMinutes: { type: Type.NUMBER, nullable: true, description: "理想通勤時間；最長可接受時間放 commuteMinutes。" },
            commuteMaxStations: { type: Type.NUMBER, nullable: true, description: "距通勤目的地最多幾站，例如「池袋五六站就能到」填 6、「三站內」填 3。給範圍時取較寬鬆的那個數字。沒提到站數就填 null，不要用通勤時間換算。" },
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
            noKeyMoney: { type: Type.BOOLEAN, nullable: true, description: "使用者明確要求禮金 0／免禮金。" },
            noDeposit: { type: Type.BOOLEAN, nullable: true, description: "使用者明確要求敷金或押金 0。" },
            lpGasAccepted: { type: Type.BOOLEAN, nullable: true },
            cityGasRequired: { type: Type.BOOLEAN, nullable: true },
            petsAllowed: { type: Type.BOOLEAN, nullable: true },
            petType: { type: Type.STRING, nullable: true },
            separateBath: { type: Type.BOOLEAN, nullable: true },
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
          required: ["roomType", "areaMin", "maxBudget", "minBudget", "budgetIncludesFees", "district", "districts", "station", "stations", "line", "lines", "walkMinutes", "commuteStation", "commuteStations", "commuteMinutes", "commutePreferredMinutes", "commuteMaxStations", "locationPreference", "nearbyAmenity", "amenityWalkMinutes", "buildingAgeMax", "visaType", "visaYears", "structure", "autoLock", "floorMin", "balcony", "gasBurnersMin", "freeInternet", "noKeyMoney", "noDeposit", "lpGasAccepted", "cityGasRequired", "petsAllowed", "petType", "separateBath", "washbasin", "bidet", "elevator", "furnished", "tower", "moveInTiming", "householdSize", "currentResidence", "employmentStartTiming", "initialCostBudget", "otherNeeds", "otherNeedNotes"]
        },
        systemInstruction: `你是日本租屋需求理解器。使用者會用自由、模糊、跳號或口語的方式描述需求（例如「2.未定」「5.不知道」「可能需要含家具？」），請保留原意並合理結構化。

最重要的規則：只能萃取使用者真的說過的條件。
- 使用者沒有提到的欄位一律回傳 null，不可猜測、不可補完、不可因為常見就填。
- 布林欄位沒提到時必須回傳 null，不要回傳 false 充數；使用者明確說不需要才回傳 false。
- 「不知道」「未定」「還沒想好」「再看看」代表未指定，對應欄位回傳 null，不要轉成任何條件。
- 帶問號或「可能」「也許」的條件仍要萃取，但那是不確定的偏好，不是硬性條件。

未指定格局時以 k1 作為搜尋基準。多個希望地區全部放入 districts、主要摘要放入 district；多個希望車站全部放入 stations、主要摘要放入 station；多個希望路線全部放入 lines、主要摘要放入 line。多個通勤目的地全部放入 commuteStations，主要摘要放入 commuteStation；同時有理想與最長通勤時間時，理想值放 commutePreferredMinutes，最長值放 commuteMinutes；提到「幾站以內」「五六站就能到」時把站數放 commuteMaxStations（有範圍取寬鬆值），這與通勤時間是不同條件，不要互相換算；無法化成單一車站但仍有意義的描述保留在 locationPreference。

入住時間、目前居住地、入社時間、同住人數與初期費用上限要分別放入 moveInTiming、currentResidence、employmentStartTiming、householdSize、initialCostBudget；「獨居」等於 householdSize 1。

visaType 請照原文的在留資格填寫（留學、技人國、打工度假、家族滯在、永住等），不要把留學生和工作簽混用。

otherNeeds 只收「其他欄位真的裝不下」的需求，且必須是短詞。不要把已經有欄位的東西（預算、通勤、格局、屋齡、設備、寵物）重複塞進來，也不要寫成句子或加上任何說明、理由與免責語氣。

otherNeedNotes 要為 otherNeeds 的每一項補上實務判讀，寫給要去找房的租客看：
- 這是「需求可行性評估」，要回答的是這個條件讓找房變難還是變簡單、以及它跟使用者
  其他條件（預算、屋齡、地點、通勤、格局）有沒有互相衝突。
- marketImpact 只寫一句話（25～50 字），講供給現實與衝突點。
  例（樂器可）：「樂器可物件供給集中在特定管理公司，數量少且租金普遍高於同區行情。」
- 【衝突只在真的存在時才寫】要先對照使用者這次填的其他條件再判斷，不要套用通則。
  例如「乾濕分離多見於屋齡較新的物件」是通則，但如果使用者已經指定屋齡 10 年內、
  預算也在行情之上，兩者是一致的，這時要寫供給現況（例如集中在哪類物件），
  不可以寫成「與壓低預算或接受高屋齡衝突」——使用者根本沒有提出那些條件。
- 不要寫成操作指示。不要叫使用者去任何網站勾選條件、也不要叫他用本站計算機——
  他已經把條件告訴我們了，這裡要給的是判斷，不是導覽。
- 只有當該條件真的無法從資料判斷（例如現場聲音、夜間治安、告知事項），才說明需在
  內見或申請階段確認，並直接講要確認什麼。
- 絕對禁止使用「你」「你的」「您」「您的」等第二人稱稱呼，必須一律採用中立客觀的第三人稱描述（如「此條件」、「此價位」）。
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

      criteria = enrichRentCriteriaFromPrompt(parsedCriteria, prompt);

      // 只在文字擷取這條路徑檢查：結構化 criteria 進來時預算已經驗過了。
      if (!hasMeaningfulCriteria(criteria)) {
        return res.status(400).json({
          error: "看不太懂這段需求。請描述你的預算、想住的地區或車站，例如「預算 10 萬円，想住新宿區的 1K」。"
        });
      }
    }

    // 只有站內資料涵蓋不到時才外部查詢：resolveSearchScope 回傳空集合就代表
    // 使用者指定的地區不在 rentRates 裡（例如名古屋、福岡）。已經有基準值的地區
    // 再查一次只是多花時間與費用，數字也不會比自家基準更適合用來判斷。
    // 與通勤路線並行，避免延遲疊加。
    const scope = resolveSearchScope(criteria);
    const requestedArea = scope.unresolvedLocations[0] || (scope.districts.size
      ? null
      : [
          criteria.district,
          ...(criteria.districts || []),
          criteria.station,
          ...(criteria.stations || []),
          ...(criteria.lines || []),
          criteria.line,
          criteria.locationPreference
        ].find(value => typeof value === "string" && value.trim().length >= 2) || null);

    const baseRecommendations = buildRentRecommendations(criteria);
    const canResolveCommute = !criteria.commuteStation || hasKnownCommuteStations(criteria.commuteStation, criteria.commuteStations || []);
    const [recommendations, marketReference] = await Promise.all([
      canResolveCommute ? attachCommuteRoutes(criteria, baseRecommendations) : Promise.resolve(baseRecommendations),
      requestedArea ? lookupMarketRate(requestedArea, criteria.roomType) : Promise.resolve(null)
    ]);

    let advisorAdvice: string | null = null;
    try {
      advisorAdvice = await generateAdvisorAdvice(criteria, recommendations);
    } catch (error) {
      // 顧問短評是加值內容，失敗時仍保留可行性與車站推薦，不以固定文案冒充 AI 回覆。
      console.error("Rent advisor advice generation error:", error);
    }

    await recordUsage("rent-analysis", requestCountry(req));

    return res.status(200).json({ criteria, recommendations, marketReference, advisorAdvice, model: hasValidStructuredCriteria ? "structured-form" : "gemini-3.1-flash-lite" });
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
