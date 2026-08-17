// .env.local 優先、.env 墊底（與 Vite／Next 慣例一致）。
// 舊版的 `import "dotenv/config"` 只讀 .env，用 `vercel env pull` 拉下來的
// .env.local 不會生效，導致本機拿不到 GEMINI_API_KEY 而只能靠正則 fallback，
// 出現「本機與線上結果不一致」的假象。
import dotenv from "dotenv";
dotenv.config({ path: [".env.local", ".env"] });
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { randomUUID } from "crypto";
import chatHandler from "./api/chat";
import rentAnalysisHandler from "./api/rent-analysis";
import marketLookupHandler from "./api/market-lookup";
import usageStatsHandler from "./api/usage-stats";
import { getVisitorCount, recordUniqueVisitor, visitorCounterConfigured } from "./src/lib/visitorCounter";

// Initialize express app
const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

// Body parser
app.use(express.json());

// /api/chat 與 /api/rent-analysis 的速率限制都在各自的 api/ handler 內，
// 本機不需要再攔一層（重複計數會讓本機比線上更早被擋）。
const ANALYSIS_RATE_LIMIT = 3;
const ANALYSIS_RATE_WINDOW_MS = 180_000;
const analysisRateBuckets = new Map<string, { count: number; resetAt: number }>();

function getAnalysisRateLimit(ip: string) {
  const now = Date.now();
  const bucket = analysisRateBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    analysisRateBuckets.set(ip, { count: 1, resetAt: now + ANALYSIS_RATE_WINDOW_MS });
    return { limited: false, remaining: ANALYSIS_RATE_LIMIT - 1, retryAfter: 0 };
  }
  bucket.count++;
  return {
    limited: bucket.count > ANALYSIS_RATE_LIMIT,
    remaining: Math.max(0, ANALYSIS_RATE_LIMIT - bucket.count),
    retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
  };
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

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

const VISITOR_COOKIE = "linus_visitor_id";
const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const VISITOR_BOT_USER_AGENT = /bot|crawler|spider|slurp|facebookexternalhit|preview/i;

function visitorCookie(req: express.Request) {
  const entry = String(req.headers.cookie || "").split(";").map((part) => part.trim()).find((part) => part.startsWith(`${VISITOR_COOKIE}=`));
  return entry ? decodeURIComponent(entry.slice(VISITOR_COOKIE.length + 1)) : null;
}

app.get("/api/visitor-count", async (req, res) => {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  if (!visitorCounterConfigured()) {
    return res.status(503).json({ error: "Visitor counter storage is not configured." });
  }

  try {
    if (VISITOR_BOT_USER_AGENT.test(String(req.headers["user-agent"] || ""))) {
      return res.json({ count: await getVisitorCount(), counted: false });
    }

    let visitorId = visitorCookie(req);
    if (!visitorId || !/^[a-f0-9-]{36}$/i.test(visitorId)) {
      visitorId = randomUUID();
      res.cookie(VISITOR_COOKIE, visitorId, {
        maxAge: VISITOR_COOKIE_MAX_AGE * 1000,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
    }

    const result = await recordUniqueVisitor(visitorId);
    return res.json({ count: result.count, counted: result.isNewVisitor });
  } catch (error) {
    console.error("Visitor counter error:", error);
    return res.status(500).json({ error: "Unable to record visitor count." });
  }
});

// Natural-language rent brief: Gemini extracts intent; the site's fixed rent model calculates prices.
// 直接複用 api/rent-analysis 的 handler。
// 先前這裡另外維護了一份 106 行的重複實作，schema 已與 api/ 版本嚴重脫節
// （仍保留早已刪除的 analysisNotes 欄位，也沒有 otherNeedNotes），
// 造成本機測到的結果與線上不同。單一來源才不會再次分岔。
app.post("/api/rent-analysis", async (req, res) => {
  await rentAnalysisHandler(req, res);
});

// 後台使用量查詢（需要 ANALYTICS_TOKEN）。express 的 req.query 與 Vercel 相容。
app.get("/api/usage-stats", async (req, res) => {
  await usageStatsHandler(req, res);
});

// 市場行情即時查詢。與可行性判斷分離，只作參考顯示。
app.post("/api/market-lookup", async (req, res) => {
  await marketLookupHandler(req, res);
});

// Q&A and Chat endpoint
// 直接複用 api/chat 的 handler（與 rent-analysis 同樣做法）。
// 先前這裡另外維護了一份完整實作，persona 規則、離題攔截與財力證明防呆
// 只改在這一份，線上 Vercel 跑的卻是 api/chat.ts 的舊人格，本機測到的結果
// 與使用者實際看到的不同。單一來源才不會再次分岔。
app.post("/api/chat", async (req, res) => {
  await chatHandler(req, res);
});

// Boot server and set up Vite middleware in development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LINUS住好日 Server is running on http://localhost:${PORT}`);
  });
}

startServer();
