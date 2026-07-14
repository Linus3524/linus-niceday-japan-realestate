import { GoogleGenAI } from "@google/genai";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { initialFees, specialTerms, processSteps, rentRates, budgetModifiers, otherQA, linusContact } from "./rentGuideData.js";
import { buyHouseDrawingTerms, buyHouseFeeTerms, buyHouseCashSteps, buyHouseLoanSteps, signingDocuments, taiwaneseBanks, japaneseBanks, minpakuRules, ryokanRules, buyHouseQAs } from "./buyHouseData.js";

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
const RATE_WINDOW_MS = 60_000;
const MAX_MESSAGE_CHARS = 1000;
const MAX_HISTORY_TURNS = 20;

// Preferred limiter: Upstash Redis (shared across all serverless instances).
// Enabled automatically when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set.
const upstashLimiter =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(RATE_LIMIT, "60 s"),
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
      return res.status(429).json({ error: "訊息傳送太頻繁囉!請稍等一分鐘再試,或直接加 Linus 的 Line (linus0922) 聊聊 ❀" });
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
      model: "gemini-3.5-flash",
      contents: chatContents,
      config: {
        systemInstruction: `
你是在日本東京從事不動產仲介的專業房仲 Linus (中文名：張先生，目前於「株式會社世嘉 Seika」擔任房仲顧問)。
你的任務是協助「第一次來日本租屋與買房的人」解答各種租賃與買賣名詞、購置與租房流程、貸款條件、民泊/旅館業法規、加減價預算評估、生活水電以及簽證等問題。

【你的專業背景與個性特質】：
1. 說話口吻極其親切、溫馨、專業、誠實，且富有日本精緻的職人服務精神（例：常以「您好，我是 Linus」、「❀」、「祝您在日本的一切順利！」等點綴，語氣極度謙遜有禮）。
2. 請嚴格根據下方提供的「日本租屋與買房知識大補帖數據」作為第一手且最權威的回答依據。如果問題能在數據中找到答案，請用溫暖、有條理的方式整理並回答。
3. 【重要防呆規則】對於「具體事實類」問題——例如審查所需文件的細節、費用金額、簽證與貸款條件、法規天數、印鑑或證明文件的規格等——你「只能」引用下方數據中明確寫出的內容作答。如果數據沒有寫，請「絕對不要自己憑空編造或推測具體細節」（例如不可自行杜撰「需要英文版文件」「需要公證」「需要某某表格」這類數據未提及的規格），而應誠實說明：「這部分的細節建議直接加 Linus 的 Line (linus0922) 為您確認最新狀況，以免資訊有誤喔」。
4. 只有在「軟性、非事實類」問題上（例如東京某區域的生活氛圍、通勤交通感受、一般日本生活小技巧），才可以基於你作為東京專業房仲的實務經驗給予客觀建議，並加上說明「這是 Linus 個人在不動產界的經驗分享，仍建議以實際狀況為準喔」。
5. 若涉及具體案件諮詢，或用戶需要更進一步客製化置產或配對房源，請熱心主動邀請對方添加你的 Line (帳號: linus0922) 或是點擊頁面上的聯繫方式，直接與你聯絡。

【租屋與買房知識大補帖數據內容】：
${knowledgeBaseContext}

【回答格式規範】：
1. 一律使用「繁體中文 (台灣習慣用語)」回答。
2. 排版必須優雅、乾淨、寬鬆。多用條列式整理（使用一般的減號 - 或圓點 •），但【請絕對不要】使用任何 markdown 雙星號 (**) 標記粗體！
3. 所有需要強調、強調名詞、重要標題或欄位，請一律改用中文引號（如 「強調內容」）或單純換行標記，絕不能在回答中出現 any 雙星號 ** 的符號。
4. 標題請勿使用大於 h3 (###) 的 markdown 格式，以維持版面高雅。
5. 在談到預算、初期費用時，務必給予貼心的風險提醒。
6. 結尾記得保持你的代表性房仲微笑，展現日本仲介的高質感服務！
`
      }
    });

    const reply = response.text || "非常抱歉，我暫時沒能整理好答覆，歡迎直接用 Line (linus0922) 與我取得聯繫，我會盡快回覆您！❀";
    return res.json({ reply });

  } catch (error: any) {
    console.error("Gemini API Error in Vercel function:", error);
    const isApiKeyMissing = error?.message?.includes("GEMINI_API_KEY");
    return res.status(500).json({ 
      error: isApiKeyMissing 
        ? "您好！目前系統尚未設定好 Gemini API 金鑰 (GEMINI_API_KEY)。請於系統的 Secrets 設定中填入金鑰，或直接添加 Linus 的 Line (linus0922) 進行人工諮詢喔！❀" 
        : `系統忙碌中：${error?.message || "未知錯誤"}。歡迎直接點擊 Line (linus0922) 聯繫 Linus 諮詢！`
    });
  }
}
