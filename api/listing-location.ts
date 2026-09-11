import { getListingLocationContext, nearestStationForAddress } from "../src/lib/listingLocation.js";
import { resolveListingCommuteRoute } from "../src/lib/transitRouteApi.js";
import { toJapaneseStationName } from "../src/lib/transit.js";
import { originWalkIssue } from "../src/lib/commuteValidation.js";
import { lookupCrimeSafety } from "../src/lib/crimeSafety.js";

const RATE_LIMIT = 15;
const RATE_WINDOW_MS = 300_000;
const buckets = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string) {
  if (!ip || ip === "unknown" || ip === "127.0.0.1" || ip === "::1" || process.env.NODE_ENV !== "production") {
    return { limited: false, retryAfter: 0 };
  }
  const now = Date.now();
  const current = buckets.get(ip);
  if (!current || current.resetAt <= now) {
    buckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { limited: false, retryAfter: 0 };
  }
  current.count++;
  return { limited: current.count > RATE_LIMIT, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
}

function cleanString(value: unknown, max = 120) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function stationList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map(item => cleanString(item, 40)).filter(Boolean).slice(0, 5);
}

function walkMinutes(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 5).map(item => {
    const number = Number(item);
    return Number.isFinite(number) && number > 0 && number <= 120 ? Math.round(number) : null;
  });
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed. Use POST." });

  const ip = String(req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown").split(",")[0].trim();
  const limit = rateLimit(ip);
  if (limit.limited) {
    res.setHeader("Retry-After", String(limit.retryAfter));
    return res.status(429).json({ error: "位置分析每 5 分鐘最多使用 8 次，請稍候再試。", retryAfter: limit.retryAfter });
  }

  try {
    const mode = cleanString(req.body?.mode, 20) || "context";
    if (mode === "context") {
      const address = cleanString(req.body?.address);
      const stations = stationList(req.body?.stations);
      if (!address) return res.status(400).json({ error: "圖紙上沒有可定位的地址。" });
      const context = await getListingLocationContext(address, stations, walkMinutes(req.body?.advertisedWalkMinutes));
      if (!context) return res.status(200).json({ found: false, message: "目前無法把圖紙地址定位到地圖，第一階段價格分析不受影響。" });
      return res.status(200).json({ found: true, context });
    }

    // 治安查詢併在這支 handler 裡：Vercel Hobby 只給 12 個 Serverless Function，
    // 獨立成 api/listing-crime.ts 會讓總數變 13，整支在部署時被裁掉（線上實測 404）。
    if (mode === "crime") {
      const address = cleanString(req.body?.address, 200);
      if (!address) return res.status(400).json({ error: "請提供物件地址。" });
      const result = await lookupCrimeSafety(address);
      if (!result) {
        return res.status(200).json({ found: false, message: "此地址未能對應到可用的犯罪統計，可能是地址定位精度不足。" });
      }
      if (result.precision === "chome") {
        return res.status(200).json({ found: true, precision: "chome", crime: result.chome });
      }
      return res.status(200).json({ found: true, precision: "prefecture", prefecture: result.prefecture });
    }

    if (mode === "commute") {
      const originStation = cleanString(req.body?.originStation, 40);
      const addressContext = cleanString(req.body?.addressContext);
      const destination = cleanString(req.body?.destination);
      const originWalkMinutes = req.body?.originWalkMinutes;
      if (!originStation || !destination) return res.status(400).json({ error: "請提供物件車站與公司／學校地址。" });
      const walkIssue = originWalkIssue(originWalkMinutes, req.body?.originAdvertisedMinutes);
      if (walkIssue) return res.status(422).json({ error: walkIssue });

      const stationOnly = destination.match(/^(.+?)駅$/);
      const destinationInfo = stationOnly
        ? { station: toJapaneseStationName(stationOnly[1]), matchedAddress: destination, distanceMeters: 0, fastMinutes: 0, normalMinutes: 0, slowMinutes: 0 }
        : await nearestStationForAddress(destination);
      if (!destinationInfo) return res.status(200).json({ found: false, message: "找不到目的地附近的車站，請改填完整地址或最近車站（例如「新宿駅」）。" });
      if (destinationInfo.normalMinutes > 30) {
        return res.status(422).json({ error: "目的地附近車站的步行估算超過 30 分鐘，可能有定位偏差或車站資料缺漏。請核對目的地地址，或改填確定的目的車站（例如「新宿駅」）。" });
      }

      const route = await resolveListingCommuteRoute(originStation, destinationInfo.station, addressContext);
      if (!route) return res.status(200).json({ found: false, message: "目前查不到這兩站之間的通勤路線，請稍後再試。" });
      return res.status(200).json({
        found: true,
        commute: {
          destinationInput: destination,
          destinationAddress: destinationInfo.matchedAddress,
          destinationResolutionNote: "resolutionNote" in destinationInfo ? destinationInfo.resolutionNote : null,
          destinationStation: destinationInfo.station,
          destinationWalkMinutes: destinationInfo.normalMinutes,
          originWalkMinutes,
          transitMinutes: route.totalDurationMinutes,
          totalMinutes: originWalkMinutes + route.totalDurationMinutes + destinationInfo.normalMinutes,
          transfers: route.transfers,
          route,
        },
      });
    }

    return res.status(400).json({ error: "位置分析模式不正確。" });
  } catch (error) {
    console.error("Listing location error:", error);
    return res.status(503).json({ error: "位置與周邊資料暫時無法取得，請稍後再試；價格分析結果不受影響。" });
  }
}
