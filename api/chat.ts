import { GoogleGenAI } from "@google/genai";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { initialFees, specialTerms, processSteps, rentRates, budgetModifiers, otherQA, linusContact, rentKnowledgeMeta } from "./rentGuideData.js";
import { buyHouseDrawingTerms, buyHouseFeeTerms, buyHouseCashSteps, buyHouseLoanSteps, signingDocuments, taiwaneseBanks, japaneseBanks, minpakuRules, ryokanRules, buyHouseQAs, buyKnowledgeMeta } from "./buyHouseData.js";

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required but missing. Please add it via Vercel Project Environment Variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiClient;
}

// Generate context string for Gemini
const knowledgeBaseContext = `
這是日本不動產仲介 Linus 整理的「日本租屋與買房」知識大補帖：

資料治理說明：
租屋：${JSON.stringify(rentKnowledgeMeta, null, 2)}
買房：${JSON.stringify(buyKnowledgeMeta, null, 2)}

--- 租屋部分 ---
1. 初期費用名詞介紹：
${JSON.stringify(initialFees, null, 2)}

2. 其他專有名詞介紹：
${JSON.stringify(specialTerms, null, 2)}

3. 房屋申請與審查流程 (9個步驟)：
${JSON.stringify(processSteps, null, 2)}

4. 東京23區2026租金行情：
${JSON.stringify(rentRates, null, 2)}

5. 日本租房預算加減價公式：
${JSON.stringify(budgetModifiers, null, 2)}

6. 常見 Q&A 內容：
${JSON.stringify(otherQA, null, 2)}

--- 買房部分 ---
7. 日本買賣圖紙名詞介紹：
${JSON.stringify(buyHouseDrawingTerms, null, 2)}

8. 買賣規費專有名詞介紹：
${JSON.stringify(buyHouseFeeTerms, null, 2)}

9. 日本現金買房與貸款買房流程：
現金買房步驟：${JSON.stringify(buyHouseCashSteps, null, 2)}
貸款買房步驟：${JSON.stringify(buyHouseLoanSteps, null, 2)}

10. 簽約應備文件與印鑑要求：
${JSON.stringify(signingDocuments, null, 2)}

11. 2026最新台系/日系銀行貸款條件：
在日台系銀行（非在日居民適用）：${JSON.stringify(taiwaneseBanks, null, 2)}
日系銀行（非永住但持工作簽證者）：${JSON.stringify(japaneseBanks, null, 2)}

12. 2026最新東京都23區民泊新法與旅館業法規範：
民泊新法：${JSON.stringify(minpakuRules, null, 2)}
旅館業法/簡易宿所要求：${JSON.stringify(ryokanRules, null, 2)}

13. 買房常見 Q&A：
${JSON.stringify(buyHouseQAs, null, 2)}

--- 聯絡與公司資訊 ---
14. 聯絡仲介資訊 (Linus & 株式會社世嘉 Seika)：
${JSON.stringify(linusContact, null, 2)}
`;

const RATE_LIMIT = 10; // requests per window
const RATE_WINDOW_MS = 300_000;
const MAX_MESSAGE_CHARS = 1000;
const MAX_HISTORY_TURNS = 20;

// Preferred limiter: Upstash Redis (shared across all serverless instances).
// Enabled automatically when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set.
const upstashLimiter =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(RATE_LIMIT, "300 s"),
        prefix: "linus-chat",
      })
    : null;

// Fallback limiter: per-instance in-memory (used locally or if Upstash is not configured).
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function isRateLimitedInMemory(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    if (rateBuckets.size > 5000) {
      for (const [k, v] of rateBuckets) if (now > v.resetAt) rateBuckets.delete(k);
    }
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  bucket.count++;
  return bucket.count > RATE_LIMIT;
}

async function isRateLimited(ip: string): Promise<boolean> {
  if (upstashLimiter) {
    try {
      const { success } = await upstashLimiter.limit(ip);
      return !success;
    } catch (err) {
      // If Redis is unreachable, degrade gracefully to in-memory rather than blocking users.
      console.error("Upstash rate limit error, falling back to in-memory:", err);
      return isRateLimitedInMemory(ip);
    }
  }
  return isRateLimitedInMemory(ip);
}

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
    if (await isRateLimited(ip)) {
      return res.status(429).json({ error: "訊息傳送太頻繁囉!五分鐘內最多只能詢問 10 次，請稍候再試，或直接加 Linus 的 Line (linus0922) 聊聊 ❀" });
    }

    const { message, history } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required." });
    }
    if (message.length > MAX_MESSAGE_CHARS) {
      return res.status(400).json({ error: `訊息太長囉,請將問題精簡到 ${MAX_MESSAGE_CHARS} 字以內再送出 ❀` });
    }

    const ai = getAiClient();

    const chatContents = [];
    if (history && Array.isArray(history)) {
      for (const turn of history.slice(-MAX_HISTORY_TURNS)) {
        chatContents.push({
          role: turn.role === "model" ? "model" : "user",
          parts: [{ text: String(turn.text || turn.content || "").slice(0, MAX_MESSAGE_CHARS * 4) }]
        });
      }
    }
    chatContents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: chatContents,
      config: {
        temperature: 0.2,
        systemInstruction: `
你是 Linus 網站上的 AI 不動產資訊助理。你不是 Linus 本人，也不得假裝已替使用者、房東、銀行、管理公司或政府機關完成確認。
你的任務是協助「第一次來日本租屋與買房的人」解答各種租賃與買賣名詞、購置與租房流程、貸款條件、民泊/旅館業法規、加減價預算評估、生活水電以及簽證等問題。

【你的專業背景與個性特質】：
1. 語氣親切、專業、誠實，避免過度熱情、重複推銷或保證結果。開場可以說「您好，我是 Linus 網站的 AI 資訊助理」。
2. 下方知識是優先參考資料，不是法律、銀行、稅務、簽證或自治體的最終依據。回答時必須區分「法令／官方指引」、「契約條款」、「一般實務」、「市場概算」。
3. 【重要防呆規則】對審查文件、費用金額、簽證、貸款、稅務、民宿與旅館規則等會變動或個案化的資訊，只能使用資料中明確內容，並一併說明資料日期、適用條件與需向哪個單位確認。資料沒有寫就不得推測，也不得用「一定」、「全部」、「不可能」、「保證通過」等絕對語句。
4. 只有在「軟性、非事實類」問題上（例如東京某區域的生活氛圍、通勤交通感受、一般日本生活小技巧），才可以基於你作為東京專業房仲的實務經驗給予客觀建議，並加上說明「這是 Linus 個人在不動產界的經驗分享，仍建議以實際狀況為準喔」。
5. 若涉及具體案件或客製化媒合，可在回答完問題後，簡短建議使用者透過頁面聯絡 Linus；每次回答最多出現一次聯絡邀請，不得以聯絡邀請取代實質回答。
6. 不得提供規避租約、隱瞞同住人、倒填日期、規避申報或未經許可經營住宿等建議。
7. 若資料中的敘述互相衝突，採較保守的說法並明確指出需要最新書面確認，不得自行選擇較有利於成交的版本。

【租屋與買房知識大補帖數據內容】：
${knowledgeBaseContext}

【回答格式規範】：
1. 一律使用「繁體中文 (台灣習慣用語)」回答。
2. 排版必須優雅、乾淨、寬鬆。多用條列式整理（使用一般的減號 - 或圓點 •），但【請絕對不要】使用任何 markdown 雙星號 (**) 標記粗體！
3. 所有需要強調、強調名詞、重要標題或欄位，請一律改用中文引號（如 「強調內容」）或單純換行標記，絕不能在回答中出現 any 雙星號 ** 的符號。
4. 標題請勿使用大於 h3 (###) 的 markdown 格式，以維持版面高雅。
5. 在談到預算、初期費用時，務必給予貼心的風險提醒。
6. 回答必須精簡、重點突出，避免冗長或不必要的鋪陳。請盡量在 300-400 字內（或更短）清晰回答，降低使用者閱讀負擔。
7. 結尾記得保持你的代表性房仲微笑，展現日本仲介的高質感服務！
`
      }
    });

    const reply = response.text || "非常抱歉，我暫時沒能整理好答覆，歡迎直接用 Line (linus0922) 與我取得聯繫，我會盡快回覆您！❀";
    return res.json({ reply });

  } catch (error: any) {
    console.error("Gemini API Error in Vercel function:", error);
    return res.status(500).json({
      error: "AI 顧問目前暫時無法回覆，請稍後再試，或透過 LINE 聯絡 Linus。"
    });
  }
}
