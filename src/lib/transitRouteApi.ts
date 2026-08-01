import type { CommuteRouteDetails, CommuteRouteSegment, RentRecommendation, RentSearchCriteria } from "./rentAnalysis";
import { getStationCodeForLine, getTransitLineIdentity, toJapaneseStationName } from "./transit";

const ROUTES_ENDPOINT = "https://routes.googleapis.com/directions/v2:computeRoutes";
const FIELD_MASK = [
  "routes.duration",
  "routes.legs.steps.travelMode",
  "routes.legs.steps.staticDuration",
  "routes.legs.steps.transitDetails"
].join(",");

const routeCache = new Map<string, { expiresAt: number; value: CommuteRouteDetails }>();

function durationMinutes(value?: string) {
  const seconds = Number(String(value || "").replace(/s$/, ""));
  return Number.isFinite(seconds) ? Math.max(0, Math.round(seconds / 60)) : 0;
}

function nextWeekdayMorning() {
  const candidate = new Date(Date.now() + 24 * 60 * 60 * 1000);
  while (["Sat", "Sun"].includes(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tokyo", weekday: "short" }).format(candidate))) {
    candidate.setUTCDate(candidate.getUTCDate() + 1);
  }
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(candidate).filter(part => part.type !== "literal").map(part => [part.type, part.value]));
  return {
    timestamp: `${parts.year}-${parts.month}-${parts.day}T08:30:00+09:00`,
    label: `${parts.year}/${parts.month}/${parts.day} 平日 08:30 出發基準`
  };
}

function timeText(value?: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
}

function segmentType(travelMode: string, vehicleType?: string): CommuteRouteSegment["type"] {
  if (travelMode === "WALK") return "walk";
  if (vehicleType === "SUBWAY") return "subway";
  if (vehicleType === "BUS") return "bus";
  if (vehicleType === "HEAVY_RAIL" || vehicleType === "COMMUTER_TRAIN" || vehicleType === "HIGH_SPEED_TRAIN") return "rail";
  return "train";
}

function parseRoute(route: any, originStation: string, destinationStation: string, referenceLabel: string): CommuteRouteDetails | null {
  const steps = (route?.legs || []).flatMap((leg: any) => leg?.steps || []);
  const segments: CommuteRouteSegment[] = steps.map((step: any) => {
    const details = step.transitDetails;
    if (!details) {
      return {
        type: "walk" as const,
        lineName: "徒歩",
        lineShortName: null,
        lineColor: "#8A9590",
        lineTextColor: "#FFFFFF",
        operator: null,
        departureStop: "徒歩移動",
        arrivalStop: "預計到達車站",
        startStationNumber: null,
        endStationNumber: null,
        departureTime: null,
        arrivalTime: null,
        durationMinutes: durationMinutes(step.staticDuration),
        stopCount: null,
        headsign: null
      };
    }
    const transitLine = details.transitLine || {};
    const identity = getTransitLineIdentity(`${transitLine.name || ""} ${transitLine.nameShort || ""}`);
    const lineName = identity?.name || transitLine.name || transitLine.nameShort || "公共交通";
    const departureStop = toJapaneseStationName(details.stopDetails?.departureStop?.name || originStation);
    const arrivalStop = toJapaneseStationName(details.stopDetails?.arrivalStop?.name || destinationStation);

    return {
      type: segmentType(step.travelMode, transitLine.vehicle?.type),
      lineName,
      lineShortName: transitLine.nameShort || identity?.shortCode || null,
      lineColor: identity?.color || transitLine.color || "#3F626D",
      lineTextColor: identity?.textColor || transitLine.textColor || "#FFFFFF",
      operator: transitLine.agencies?.[0]?.name || identity?.operator || null,
      departureStop,
      arrivalStop,
      startStationNumber: getStationCodeForLine(lineName, departureStop),
      endStationNumber: getStationCodeForLine(lineName, arrivalStop),
      departureTime: timeText(details.stopDetails?.departureTime),
      arrivalTime: timeText(details.stopDetails?.arrivalTime),
      durationMinutes: durationMinutes(step.staticDuration),
      stopCount: Number.isFinite(details.stopCount) ? details.stopCount : null,
      headsign: details.headsign || null
    };
  }).filter((segment: CommuteRouteSegment) => segment.durationMinutes > 0 || segment.type !== "walk");

  const transitSegments = segments.filter(segment => segment.type !== "walk");
  if (!transitSegments.length) return null;
  return {
    source: "google_routes",
    originStation: toJapaneseStationName(originStation),
    destinationStation: toJapaneseStationName(destinationStation),
    totalDurationMinutes: durationMinutes(route.duration) || segments.reduce((sum, segment) => sum + segment.durationMinutes, 0),
    transfers: Math.max(0, transitSegments.length - 1),
    departureTime: transitSegments[0]?.departureTime || null,
    arrivalTime: transitSegments[transitSegments.length - 1]?.arrivalTime || null,
    referenceLabel,
    segments
  };
}

async function fetchOneRoute(apiKey: string, originStation: string, destinationStation: string) {
  const departure = nextWeekdayMorning();
  const cacheKey = `${originStation}|${destinationStation}|${departure.timestamp}`;
  const cached = routeCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const response = await fetch(ROUTES_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK
    },
    body: JSON.stringify({
      origin: { address: `${toJapaneseStationName(originStation)}駅, 日本` },
      destination: { address: `${toJapaneseStationName(destinationStation)}駅, 日本` },
      travelMode: "TRANSIT",
      departureTime: departure.timestamp,
      computeAlternativeRoutes: true,
      languageCode: "ja",
      units: "METRIC",
      transitPreferences: {
        allowedTravelModes: ["TRAIN", "SUBWAY", "RAIL"],
        routingPreference: "FEWER_TRANSFERS"
      }
    })
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as any;
    throw new Error(`Google Routes ${response.status}: ${error?.error?.message || "request failed"}`);
  }
  const data = await response.json() as any;
  const parsed = parseRoute(data.routes?.[0], originStation, destinationStation, departure.label);
  if (!parsed) throw new Error("Google Routes did not return a usable transit route.");
  routeCache.set(cacheKey, { expiresAt: Date.now() + 30 * 60 * 1000, value: parsed });
  return parsed;
}

export async function attachCommuteRoutes(criteria: RentSearchCriteria, recommendations: RentRecommendation[]) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.MAPS_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey || !criteria.commuteStation) return recommendations;
  const destination = criteria.commuteStation.split(/[、,，/／或|・]/).map(value => value.trim()).find(Boolean);
  if (!destination) return recommendations;

  const results = await Promise.all(recommendations.map(async recommendation => {
    if (!recommendation.station) return recommendation;
    try {
      const commuteRoute = await fetchOneRoute(apiKey, recommendation.station, destination);
      return {
        ...recommendation,
        commuteRoute,
        commuteTimeFit: "路線已查詢" as const,
        cautions: recommendation.cautions.filter(caution => !caution.includes("分鐘上限尚未"))
      };
    } catch (error) {
      console.warn(`Transit route unavailable for ${recommendation.station} → ${destination}:`, String(error));
      return { ...recommendation, commuteRoute: null };
    }
  }));
  return results;
}
