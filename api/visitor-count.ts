import { randomUUID } from "crypto";
import {
  getVisitorCount,
  recordUniqueVisitor,
  visitorCounterConfigured,
} from "../src/lib/visitorCounter.js";

const COOKIE_NAME = "linus_visitor_id";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;
const BOT_USER_AGENT = /bot|crawler|spider|slurp|facebookexternalhit|preview/i;

function readCookie(cookieHeader: string | undefined, name: string) {
  if (!cookieHeader) return null;
  const entry = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : null;
}

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  if (!visitorCounterConfigured()) {
    return res.status(503).json({ error: "Visitor counter storage is not configured." });
  }

  try {
    const userAgent = String(req.headers["user-agent"] || "");
    if (BOT_USER_AGENT.test(userAgent)) {
      return res.status(200).json({ count: await getVisitorCount(), counted: false });
    }

    let visitorId = readCookie(req.headers.cookie, COOKIE_NAME);
    if (!visitorId || !/^[a-f0-9-]{36}$/i.test(visitorId)) {
      visitorId = randomUUID();
      const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
      res.setHeader(
        "Set-Cookie",
        `${COOKIE_NAME}=${encodeURIComponent(visitorId)}; Max-Age=${ONE_YEAR_SECONDS}; Path=/; SameSite=Lax${secure}`,
      );
    }

    const result = await recordUniqueVisitor(visitorId);
    return res.status(200).json({ count: result.count, counted: result.isNewVisitor });
  } catch (error) {
    console.error("Visitor counter error:", error);
    return res.status(500).json({ error: "Unable to record visitor count." });
  }
}
