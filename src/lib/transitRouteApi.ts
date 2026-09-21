import { GoogleGenAI, Type } from "@google/genai";
import type { CommuteRouteDetails, CommuteRouteSegment, RentRecommendation, RentSearchCriteria } from "./rentAnalysis.js";
import { getLineColors, getStationCodeForLine, getTransitLineIdentity, toJapaneseLineName, toJapaneseStationName } from "./transit.js";
import { readTransitRoute, writeTransitRoute } from "./transitRouteCache.js";
import { findLocalTransitRoute, findLocalTransitRoutes, graphStationCode, identifyGraphLine, isGraphStation, isTokyoGraphStation, isRegionalGraphStation, isKansaiGraphStation } from "./localTransitRoute.js";

type GroundedSegment = {
  type?: string;
  lineName?: string;
  operator?: string | null;
  departureStop?: string;
  arrivalStop?: string;
  durationMinutes?: number;
  stopCount?: number | null;
  headsign?: string | null;
};

type GroundedRoute = {
  originStation?: string;
  destinationStation?: string;
  totalDurationMinutes?: number;
  transfers?: number;
  segments?: GroundedSegment[];
};
type RouteOrigin = { station: string; context: string };

const routeCache = new Map<string, { expiresAt: number; value: CommuteRouteDetails[] }>();
const geocodeCache = new Map<string, { id: string; name: string } | null>();
const TRANSITOUS_API = "https://api.transitous.org/api";
const TRANSITOUS_USER_AGENT = process.env.TRANSITOUS_USER_AGENT || "LINUS-NiceDay/1.0 (https://github.com/Linus3524/linus-niceday-japan-realestate)";

const TRANSITOUS_LINE_NAMES: Array<[RegExp, string]> = [
  [/ShonanShinjuku/i, "JR湘南新宿ライン"], [/Yamanote/i, "JR山手線"], [/Yokosuka/i, "JR横須賀線"],
  [/KeihinTohoku/i, "JR京浜東北線"], [/ChuoSobu/i, "JR中央・総武線"], [/ChuoRapid/i, "JR中央線快速"],
  [/Hibiya/i, "東京メトロ日比谷線"], [/Tozai/i, "東京メトロ東西線"], [/Namboku/i, "東京メトロ南北線"],
  [/Hanzomon/i, "東京メトロ半蔵門線"], [/Fukutoshin/i, "東京メトロ副都心線"], [/Chiyoda/i, "東京メトロ千代田線"],
  [/Toyoko/i, "東急東横線"], [/Meguro/i, "東急目黒線"], [/Denentoshi/i, "東急田園都市線"]
];
const TRANSITOUS_STATION_NAMES: Record<string, string> = {
  "Naka-meguro": "中目黒", "Musashi-Kosugi": "武蔵小杉", "Ebisu": "恵比寿", "Meguro": "目黒",
  "Jiyūgaoka": "自由が丘", "Jiyugaoka": "自由が丘", "Ōsaki": "大崎", "Osaki": "大崎",
  "Nishi-Ōi": "西大井", "Nishi-Oi": "西大井", "Shibuya": "渋谷", "Shinjuku": "新宿",
  "Tokyo": "東京", "Akihabara": "秋葉原", "Kita-senju": "北千住"
};

function transitousStationName(value: string, fallback?: string) {
  return toJapaneseStationName(TRANSITOUS_STATION_NAMES[value] || fallback || value);
}

/** 班次編號，不是路線名。jp-japan-rail 圖資把它塞在 route_short_name／displayName，
 *  照著顯示畫面上就會出現「10650744」這種數字徽章。 */
const TRAIN_NUMBER_PATTERN = /^[0-9]{3,}[A-Za-z]?$/;

function isTrainNumber(value: unknown) {
  return typeof value === "string" && TRAIN_NUMBER_PATTERN.test(value.trim());
}

/**
 * Transitous leg → 路線名。
 */
function transitousLineName(leg: any): string | null {
  const identityText = `${leg.routeId || ""} ${leg.routeLongName || ""}`;
  const mapped = TRANSITOUS_LINE_NAMES.find(([pattern]) => pattern.test(identityText))?.[1];
  if (mapped) return mapped;

  const stops = [
    leg.from?.name,
    ...(Array.isArray(leg.intermediateStops) ? leg.intermediateStops.map((stop: any) => stop?.name) : []),
    leg.to?.name
  ].filter((name: unknown): name is string => typeof name === "string" && name.length > 0);
  const identified = identifyGraphLine(stops, leg.agencyName);
  if (identified) return identified;

  const label = [leg.routeLongName, leg.displayName, leg.routeShortName]
    .find(value => typeof value === "string" && value.trim() && !isTrainNumber(value));
  return label ? String(label).trim() : null;
}

async function transitousFetch(path: string, params: Record<string, string>) {
  const url = new URL(`${TRANSITOUS_API}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }
  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json", "User-Agent": TRANSITOUS_USER_AGENT }
  });
  if (!response.ok) throw new Error(`Transitous API error: ${response.status} ${response.statusText}`);
  return response.json();
}

const METRO_AREA_PREFECTURES = ["東京都", "神奈川県", "埼玉県", "千葉県"];
const REGIONAL_AREA_PREFECTURES = [
  "大阪府", "京都府", "兵庫県", "奈良県", "滋賀県", "和歌山県",
  "北海道", "宮城県", "愛知県", "岐阜県", "三重県", "広島県", "岡山県", "福岡県", "佐賀県", "沖縄県"
];
const KANSAI_AREA_PREFECTURES = REGIONAL_AREA_PREFECTURES;

/**
 * Transitous geocode 的行政區資訊分散在數個欄位，必須全部讀取。
 *
 * areas[] 是最完整的一層（含都道府県與市區町村），漏掉它，同名異地站的防護
 * 就整個失效——香川縣的白山會通過文京區白山的檢查，拿去規劃首都圈通勤。
 * state／countryOrState／regions 是同一份資訊在不同回應格式下的變體，一併納入。
 */
function stopAreaNames(item: any): string[] {
  return [
    item?.state,
    item?.countryOrState,
    ...(Array.isArray(item?.areas) ? item.areas.map((area: any) => area?.name) : []),
    ...(Array.isArray(item?.regions) ? item.regions.map((region: any) => region?.name) : [])
  ].filter((name: unknown): name is string => typeof name === "string" && name.length > 0);
}

/**
 * 日本各地常有同名站（如福島、日本橋、八幡、府中等），以行政區白名單防禦
 * geocode 的某筆結果能不能代表這個站。
 */
export function isAcceptableStopMatch(
  item: any,
  wanted: string,
  mustBeInMetroArea: boolean,
  mustBeInRegional = false
): boolean {
  if (normalizedStation(item?.name) !== wanted || item?.country !== "JP") return false;
  const areas = stopAreaNames(item);
  if (mustBeInMetroArea) {
    return METRO_AREA_PREFECTURES.some(prefecture => areas.includes(prefecture));
  }
  if (mustBeInRegional) {
    return REGIONAL_AREA_PREFECTURES.some(prefecture => areas.includes(prefecture));
  }
  return true;
}

async function transitousStop(station: string, context = "") {
  const wanted = normalizedStation(station);
  const cacheKey = `${normalizedStation(context)}:${wanted}`;
  if (geocodeCache.has(cacheKey)) return geocodeCache.get(cacheKey) || null;
  const results = await transitousFetch("/v1/geocode", { text: `${context} ${toJapaneseStationName(station)}駅`.trim(), language: "ja", type: "STOP", numResults: "8" });

  const mustBeInMetroArea = isTokyoGraphStation(station);
  const mustBeInRegional = !mustBeInMetroArea && isRegionalGraphStation(station);
  const exact = Array.isArray(results)
    ? results.find(item => isAcceptableStopMatch(item, wanted, mustBeInMetroArea, mustBeInRegional))
    : null;

  const stop = exact?.id ? { id: String(exact.id), name: toJapaneseStationName(station) } : null;
  geocodeCache.set(cacheKey, stop);
  return stop;
}

async function fetchTransitousRoutes(origin: string, destination: string, context = ""): Promise<CommuteRouteDetails[]> {
  const [from, to] = await Promise.all([transitousStop(origin, context), transitousStop(destination, context)]);
  if (!from || !to) return [];
  const reference = routeReference();
  let data: any;
  try {
    data = await transitousFetch("/v6/plan", { fromPlace: from.id, toPlace: to.id, time: reference.iso, numItineraries: "5" });
  } catch (error) {
    console.warn(`Transitous plan fetch error for ${origin} → ${destination}:`, String(error));
    return [];
  }
  const itineraries = Array.isArray(data?.itineraries) ? data.itineraries : [];
  const results: CommuteRouteDetails[] = [];
  const seenSignatures = new Set<string>();

  for (const itinerary of itineraries) {
    if (!Array.isArray(itinerary.legs)) continue;
    const rawLegs = itinerary.legs.filter((leg: any) => Number(leg.duration) >= 0);
    const transitLegs = rawLegs.filter((leg: any) => leg.mode !== "WALK");
    if (!transitLegs.length) continue;

    // 有任何一段查不出真實路線名就整條丟掉。缺一段路線名的路線圖，使用者看到的是
    // 一個數字或「公共交通」，既不知道該搭哪班車、也無從判斷這筆結果可不可信。
    // 本地 GTFS 與 AI 來源仍會補上路線，寧可少一條候選也不要送出假路線名。
    if (transitLegs.some((leg: any) => !transitousLineName(leg))) continue;

    const segments: CommuteRouteSegment[] = rawLegs.map((leg: any, index: number) => {
      const type = leg.mode === "WALK" ? "walk" : leg.mode === "SUBWAY" ? "subway" : leg.mode === "BUS" ? "bus" : "rail";
      const lineName = type === "walk" ? "徒歩" : transitousLineName(leg)!;
      const identity = getTransitLineIdentity(lineName);
      const departureStop = index === 0 ? toJapaneseStationName(origin) : transitousStationName(String(leg.from?.name || ""));
      const arrivalStop = index === rawLegs.length - 1 ? toJapaneseStationName(destination) : transitousStationName(String(leg.to?.name || ""));
      // Transitous 的 routeTextColor 與 GTFS 同源，同樣不可信（幾乎全是白字），
      // 一律由 getLineColors 依底色重算，避免淺色路線名整段看不見。
      const gtfsColor = leg.routeColor ? `#${String(leg.routeColor).replace(/^#/, "")}` : null;
      const colors = type === "walk"
        ? { color: "#8A9590", textColor: "#FFFFFF" as const }
        : getLineColors(lineName, gtfsColor);
      return {
        // routeShortName 在 jp-japan-rail 是班次編號，不能當路線代號（會變成 TJ 位置上的一串數字）。
        type, lineName: identity?.name || lineName,
        lineShortName: (!isTrainNumber(leg.routeShortName) && leg.routeShortName) || identity?.shortCode || null,
        lineColor: colors.color, lineTextColor: colors.textColor,
        operator: leg.agencyName || identity?.operator || null, departureStop, arrivalStop,
        // 站編號三層：Transitous 自帶 → 人工表（首都圈主線）→ 圖資 fromCode/toCode。
        // 少了第三層，經由停靠站序列還原出來的路線會查不到編號，站牌圖示就變空白。
        startStationNumber: leg.from?.stopCode || getStationCodeForLine(lineName, departureStop) || graphStationCode(lineName, departureStop),
        endStationNumber: leg.to?.stopCode || getStationCodeForLine(lineName, arrivalStop) || graphStationCode(lineName, arrivalStop),
        departureTime: leg.startTime ? String(leg.startTime).slice(11, 16) : null,
        arrivalTime: leg.endTime ? String(leg.endTime).slice(11, 16) : null,
        durationMinutes: Math.max(0, Math.round(Number(leg.duration) / 60)),
        stopCount: Array.isArray(leg.intermediateStops) ? leg.intermediateStops.length + 1 : null,
        headsign: leg.headsign || null
      };
    });

    if (segments.some(segment => !isOfficialJapaneseStationText(segment.departureStop) || !isOfficialJapaneseStationText(segment.arrivalStop))) continue;
    const total = Math.round(Number(itinerary.duration) / 60);
    if (!Number.isInteger(total) || total < 1 || total > 240) continue;

    const transfers = Number.isInteger(itinerary.transfers) ? itinerary.transfers : Math.max(0, transitLegs.length - 1);
    const signature = segments.filter(s => s.type !== "walk").map(s => `${s.lineName}:${s.departureStop}->${s.arrivalStop}`).join("|");
    if (seenSignatures.has(signature)) continue;
    seenSignatures.add(signature);

    results.push({
      source: "transitous", originStation: toJapaneseStationName(origin), destinationStation: toJapaneseStationName(destination),
      totalDurationMinutes: total, transfers,
      departureTime: segments[0]?.departureTime || null, arrivalTime: segments.at(-1)?.arrivalTime || null,
      referenceLabel: `Transitous 標準班表・${reference.label}`,
      sourceLinks: [{ title: "Transitous 路線資料", url: "https://transitous.org/" }, { title: "Transitous 資料來源", url: "https://transitous.org/sources/" }],
      segments
    });
  }

  return results;
}

async function fetchTransitousRoute(origin: string, destination: string, context = ""): Promise<CommuteRouteDetails | null> {
  const routes = await fetchTransitousRoutes(origin, destination, context);
  return routes[0] || null;
}

async function resolveRoutes(origins: RouteOrigin[], destination: string) {
  const routes: CommuteRouteDetails[] = [];
  for (const originInfo of origins) {
    const { station: origin, context } = originInfo;
    try {
      const localRoute = findLocalTransitRoute(origin, destination, context);
      if (localRoute) {
        routes.push(localRoute);
        continue;
      }
      const contextualOrigin = `${normalizedStation(context)}:${normalizedStation(origin)}`;
      const cached = await readTransitRoute(contextualOrigin, normalizedStation(destination));
      if (cached) {
        routes.push(cached);
        continue;
      }
      let route: CommuteRouteDetails | null = null;
      try {
        route = await fetchTransitousRoute(origin, destination, context);
      } catch (error) {
        console.warn(`Transitous unavailable for ${origin} → ${destination}:`, String(error));
      }
      if (!route) {
        route = (await searchRoutes([originInfo], destination))[0] || null;
        if (!route) route = (await searchRoutes([originInfo], destination))[0] || null;
      }
      if (!route) route = (await estimateRoutes([originInfo], destination))[0] || null;
      if (route) {
        if (route.source !== "ai_estimate") await writeTransitRoute(contextualOrigin, normalizedStation(destination), route);
        routes.push(route);
      }
    } catch (error) {
      console.warn(`All transit providers failed for ${origin} → ${destination}:`, String(error));
    }
  }
  return routes;
}

/**
 * 物件健檢的通勤查詢：推薦 1～3 條路線，並嚴格依「轉乘次數最少 → 轉乘次數多次」排序。
 */
export async function resolveListingCommuteRoutes(originStation: string, destinationStation: string, context = ""): Promise<CommuteRouteDetails[]> {
  const candidates: CommuteRouteDetails[] = [];

  // 1. 本地 GTFS 圖資探索候選
  try {
    const localRoutes = findLocalTransitRoutes(originStation, destinationStation, 5, context);
    if (localRoutes.length) {
      candidates.push(...localRoutes);
    }
  } catch (error) {
    console.warn(`Local transit routes error for ${originStation} → ${destinationStation}:`, String(error));
  }

  // 2. Transitous 班表候選
  try {
    const transitousRoutes = await fetchTransitousRoutes(originStation, destinationStation, context);
    if (transitousRoutes.length) {
      candidates.push(...transitousRoutes);
    }
  } catch (error) {
    console.warn(`Transitous unavailable for ${originStation} → ${destinationStation}:`, String(error));
  }

  // 3. 若本地與 Transitous 均無法辨識，退回 AI/Web Grounding
  if (!candidates.length) {
    const contextualOrigin = `${normalizedStation(context)}:${normalizedStation(originStation)}`;
    const cached = await readTransitRoute(contextualOrigin, normalizedStation(destinationStation));
    if (cached) {
      candidates.push(cached);
    } else {
      let aiRoutes = await searchRoutes([{ station: originStation, context }], destinationStation);
      if (!aiRoutes.length) aiRoutes = await searchRoutes([{ station: originStation, context }], destinationStation);
      if (!aiRoutes.length) aiRoutes = await estimateRoutes([{ station: originStation, context }], destinationStation);
      if (aiRoutes.length) {
        for (const r of aiRoutes) {
          if (r.source !== "ai_estimate") await writeTransitRoute(contextualOrigin, normalizedStation(destinationStation), r);
        }
        candidates.push(...aiRoutes);
      }
    }
  }

  if (!candidates.length) return [];

  // 4. 去重、排除過度繞路與依「轉乘最少到需要轉車多次」排序
  const minMinutes = Math.min(...candidates.map(c => c.totalDurationMinutes));

  // 合理性過濾：
  // 1. 車程不可過度繞路（直達車允許寬容時間，轉乘車限制在合理時間範圍內）
  const timeBounded = candidates.filter(r => {
    const maxAllowed = r.transfers === 0
      ? Math.max(Math.round(minMinutes * 1.7), minMinutes + 25)
      : Math.max(Math.round(minMinutes * 1.5), minMinutes + 15);
    return r.totalDurationMinutes <= maxAllowed;
  });

  if (!timeBounded.length) return [];

  const bestTransfers = Math.min(...timeBounded.map(r => r.transfers));
  // 2. 轉乘次數不得比合理最少轉乘多 2 次以上（但車程在最快範圍內的優選方案保留）
  const viable = timeBounded.filter(r => {
    if (r.totalDurationMinutes <= minMinutes + 8) return true;
    return r.transfers <= bestTransfers + 1;
  });

  // 先依轉乘次數由少到多排序；同轉乘次數則依總分鐘由短到長排序
  viable.sort((a, b) => a.transfers - b.transfers || a.totalDurationMinutes - b.totalDurationMinutes);

  const selected: CommuteRouteDetails[] = [];
  const seenSignatures = new Set<string>();
  const seenLineSequences = new Set<string>();

  for (const route of viable) {
    const transitSegments = route.segments.filter(s => s.type !== "walk" && s.type !== "wait");
    // 使用正規化線路名稱去除空格與格式差異（例如 "JR 山手線" vs "JR山手線"）
    const signature = transitSegments
      .map(s => `${toJapaneseLineName(s.lineName).replace(/\s+/g, "")}:${s.departureStop}->${s.arrivalStop}`)
      .join("|");
    const lineSequence = `${route.transfers}:${transitSegments
      .map(s => toJapaneseLineName(s.lineName).replace(/\s+/g, ""))
      .join(" > ")}`;

    if (seenSignatures.has(signature)) continue;
    seenSignatures.add(signature);

    if (seenLineSequences.has(lineSequence)) continue;
    seenLineSequences.add(lineSequence);

    selected.push(route);
  }

  // 若經過合理性過濾與去重後只有 1 條或 2 條，就回傳實際找到的有效路線，最多回傳 3 條（絕不硬湊多餘/荒謬路線）
  return selected.slice(0, 3);
}

export async function resolveListingCommuteRoute(originStation: string, destinationStation: string, context = "") {
  const routes = await resolveListingCommuteRoutes(originStation, destinationStation, context);
  return routes[0] || null;
}

function routeReference() {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const weekday = () => new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tokyo", weekday: "short" }).format(date);
  while (["Sat", "Sun"].includes(weekday())) {
    date.setUTCDate(date.getUTCDate() + 1);
  }
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date).filter(part => part.type !== "literal").map(part => [part.type, part.value]));
  const day = `${parts.year}-${parts.month}-${parts.day}`;
  return { iso: `${day}T08:30:00+09:00`, query: `${day} 08:30 出発`, label: `${day.replaceAll("-", "/")} 平日 08:30 出發基準（非即時運行資訊）` };
}

function stripCodeFence(text: string) {
  return text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
}

function normalizedStation(value?: string) {
  return toJapaneseStationName(value || "").replace(/駅$/, "").replace(/[〈（(].*$/, "").replace(/[\s・･]/g, "").toLowerCase();
}

function isOfficialJapaneseStationText(value: string) {
  const cleaned = value.replace(/[0-9０-９・･\s〈〉（）()ーヶ々]/g, "");
  return cleaned.length > 0 && !/[A-Za-zÀ-ž]/.test(cleaned) && /[一-龯ぁ-ゖァ-ヺ]/.test(cleaned);
}

function segmentType(value?: string): CommuteRouteSegment["type"] {
  if (value === "subway" || value === "rail" || value === "bus" || value === "walk") return value;
  return "train";
}

function sourceLinks(response: any) {
  const chunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const unique = new Map<string, { title: string; url: string }>();
  for (const chunk of chunks) {
    const url = chunk?.web?.uri;
    if (typeof url === "string" && /^https?:\/\//.test(url)) {
      unique.set(url, { title: String(chunk?.web?.title || "路線查證來源"), url });
    }
  }
  return [...unique.values()].slice(0, 6);
}

function parseGroundedRoute(raw: GroundedRoute, expectedOrigin: string, destination: string, links: Array<{ title: string; url: string }>, context = ""): CommuteRouteDetails | null {
  if (!links.length) return null;
  if (normalizedStation(raw.originStation) !== normalizedStation(expectedOrigin)) return null;
  if (normalizedStation(raw.destinationStation) !== normalizedStation(destination)) return null;
  const totalValue = Number(raw.totalDurationMinutes);
  const total = Math.round(totalValue);
  const transfers = Number(raw.transfers);
  if (!Number.isFinite(totalValue) || total < 1 || total > 240) return null;
  if (!Number.isInteger(transfers) || transfers < 0 || transfers > 5) return null;
  if (!Array.isArray(raw.segments) || !raw.segments.length || raw.segments.length > 12) return null;

  const segments = raw.segments.map((segment): CommuteRouteSegment | null => {
    let lineName = String(segment.lineName || "").trim();
    // A bare "南北線" is ambiguous across Japanese cities. Search results
    // occasionally omit the operator even when the researched route is local.
    if (/札幌/.test(context) && lineName === "南北線") lineName = "札幌市営地下鉄南北線";
    if (/仙台/.test(context) && lineName === "南北線") lineName = "仙台市地下鉄南北線";
    const departureStop = toJapaneseStationName(String(segment.departureStop || "").trim());
    const arrivalStop = toJapaneseStationName(String(segment.arrivalStop || "").trim());
    const durationValue = Number(segment.durationMinutes);
    const duration = Math.round(durationValue);
    if (!lineName || !departureStop || !arrivalStop || !Number.isFinite(durationValue) || duration < 0 || duration > 180) return null;
    const identity = getTransitLineIdentity(lineName);
    const type = segmentType(segment.type);
    const colors = type === "walk"
      ? { color: "#8A9590", textColor: "#FFFFFF" as const }
      : getLineColors(lineName);
    return {
      type,
      lineName: identity?.name || (type === "walk" ? "徒歩" : toJapaneseLineName(lineName)),
      lineShortName: identity?.shortCode || null,
      lineColor: colors.color,
      lineTextColor: colors.textColor,
      operator: identity?.operator || segment.operator || null,
      departureStop,
      arrivalStop,
      startStationNumber: getStationCodeForLine(lineName, departureStop),
      endStationNumber: getStationCodeForLine(lineName, arrivalStop),
      departureTime: null,
      arrivalTime: null,
      durationMinutes: duration,
      stopCount: Number.isInteger(segment.stopCount) ? Number(segment.stopCount) : null,
      headsign: segment.headsign ? String(segment.headsign) : null
    };
  });
  if (segments.some(segment => !segment)) return null;
  const validSegments = segments as CommuteRouteSegment[];
  if (validSegments.some(segment => !isOfficialJapaneseStationText(segment.departureStop) || !isOfficialJapaneseStationText(segment.arrivalStop))) return null;
  const transitCount = validSegments.filter(segment => segment.type !== "walk").length;
  if (!transitCount || Math.max(0, transitCount - 1) !== transfers) return null;

  return {
    source: "web_grounded",
    originStation: toJapaneseStationName(expectedOrigin),
    destinationStation: toJapaneseStationName(destination),
    totalDurationMinutes: total,
    transfers,
    departureTime: null,
    arrivalTime: null,
    referenceLabel: `Google Search 查證・${routeReference().label}`,
    sourceLinks: links,
    segments: validSegments
  };
}

async function searchRoutes(origins: RouteOrigin[], destination: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return [];
  const cacheKey = `${origins.map(origin => `${origin.context}:${origin.station}`).join("|")}>${destination}`;
  const cached = routeCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const ai = new GoogleGenAI({ apiKey });
  const reference = routeReference();
  const pairs = origins.map(origin => `${origin.context}的${toJapaneseStationName(origin.station)}駅 → ${toJapaneseStationName(destination)}駅`).join("\n");
  const searchResponse = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: [{ role: "user", parts: [{ text: `你必須實際使用 Google Search 工具逐組搜尋網頁，不可以只依內部知識回答。請搜尋並交叉核對下列日本鐵路通勤路線：\n${pairs}\n\n所有路線統一以日本時間 ${reference.query} 為查詢條件，不考慮當日延誤。每組至少查找 NAVITIME、駅探、Yahoo!路線情報或鐵路公司官方網站中的可靠資料。逐組明確列出：日本現行漢字站名、正式日文路線名稱、營運公司、每一段起訖站與分鐘、總分鐘、轉乘次數、停靠站數及行先。總時間須包含步行與轉乘等待。不可依記憶猜測；查不到的欄位明確標示查不到。回答必須保留 Google Search grounding 引用。` }] }],
    config: {
      temperature: 0,
      tools: [{ googleSearch: {} }]
    }
  });
  const links = sourceLinks(searchResponse);
  if (process.env.DEBUG_TRANSIT_ROUTES === "1") console.log("TRANSIT SEARCH", origins, destination, searchResponse.text, links.length);
  if (!links.length || !searchResponse.text) return [];

  const parseResponse = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: [{ role: "user", parts: [{ text: `以下是已使用 Google Search 查證過的路線研究。只能整理原文已有的資料，不可補充、推測或更改數字。缺少確切資料的路線不要輸出。\n\n${searchResponse.text}` }] }],
    config: {
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          routes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                originStation: { type: Type.STRING }, destinationStation: { type: Type.STRING },
                totalDurationMinutes: { type: Type.NUMBER }, transfers: { type: Type.NUMBER },
                segments: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
                  type: { type: Type.STRING, enum: ["train", "subway", "rail", "bus", "walk"] },
                  lineName: { type: Type.STRING }, operator: { type: Type.STRING, nullable: true },
                  departureStop: { type: Type.STRING }, arrivalStop: { type: Type.STRING },
                  durationMinutes: { type: Type.NUMBER }, stopCount: { type: Type.NUMBER, nullable: true },
                  headsign: { type: Type.STRING, nullable: true }
                }, required: ["type", "lineName", "operator", "departureStop", "arrivalStop", "durationMinutes", "stopCount", "headsign"] } }
              }, required: ["originStation", "destinationStation", "totalDurationMinutes", "transfers", "segments"]
            }
          }
        }, required: ["routes"]
      }
    }
  });
  if (!parseResponse.text) return [];
  if (process.env.DEBUG_TRANSIT_ROUTES === "1") console.log("TRANSIT PARSE", parseResponse.text);
  const parsed = JSON.parse(stripCodeFence(parseResponse.text)) as { routes?: GroundedRoute[] };
  const rawRoutes = Array.isArray(parsed.routes) ? parsed.routes : [];
  let routes = origins.map(origin => {
    const raw = rawRoutes.find(route => normalizedStation(route.originStation) === normalizedStation(origin.station));
    return raw ? parseGroundedRoute(raw, origin.station, destination, links, origin.context) : null;
  }).filter((route): route is CommuteRouteDetails => Boolean(route));
  if (origins.length > 1) {
    const missing = origins.filter(origin => !routes.some(route => normalizedStation(route.originStation) === normalizedStation(origin.station)));
    if (missing.length) {
      routes = [...routes, ...await resolveRoutes(missing, destination)];
    }
  }
  if (routes.length) routeCache.set(cacheKey, { expiresAt: Date.now() + 6 * 60 * 60 * 1000, value: routes });
  return routes;
}

async function estimateRoutes(origins: RouteOrigin[], destination: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return [];
  const ai = new GoogleGenAI({ apiKey });
  const pairs = origins.map(origin => `${origin.context}的${toJapaneseStationName(origin.station)}駅 → ${toJapaneseStationName(destination)}駅`).join("\n");
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: [{ role: "user", parts: [{ text: `以下路線已無法取得公開班表或網路查證結果。請依你的日本鐵路知識提供最可能、最實用的平日早上通勤路線估算：\n${pairs}\n\n使用正式日文站名與路線名；時間包含一般候車與轉乘步行。不要捏造不存在的車站或路線。這是概算，不必搜尋網路。` }] }],
    config: {
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: { routes: { type: Type.ARRAY, items: { type: Type.OBJECT,
          properties: {
            originStation: { type: Type.STRING }, destinationStation: { type: Type.STRING },
            totalDurationMinutes: { type: Type.NUMBER }, transfers: { type: Type.NUMBER },
            segments: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
              type: { type: Type.STRING, enum: ["train", "subway", "rail", "bus", "walk"] },
              lineName: { type: Type.STRING }, operator: { type: Type.STRING, nullable: true },
              departureStop: { type: Type.STRING }, arrivalStop: { type: Type.STRING },
              durationMinutes: { type: Type.NUMBER }, stopCount: { type: Type.NUMBER, nullable: true },
              headsign: { type: Type.STRING, nullable: true }
            }, required: ["type", "lineName", "operator", "departureStop", "arrivalStop", "durationMinutes", "stopCount", "headsign"] } }
          }, required: ["originStation", "destinationStation", "totalDurationMinutes", "transfers", "segments"]
        } } }, required: ["routes"]
      }
    }
  });
  if (!response.text) return [];
  const parsed = JSON.parse(stripCodeFence(response.text)) as { routes?: GroundedRoute[] };
  const estimated: Array<CommuteRouteDetails | null> = origins.map(origin => {
    const raw = (parsed.routes || []).find(route => normalizedStation(route.originStation) === normalizedStation(origin.station))
      || (origins.length === 1 ? (parsed.routes || [])[0] : undefined);
    if (!raw) return null;
    // For model-only estimates, aliases such as 梅田／大阪梅田 must not make
    // an otherwise usable route disappear. The requested pair remains the
    // authoritative card header while segment stops preserve Gemini's detail.
    const normalizedRaw = { ...raw, originStation: origin.station, destinationStation: destination };
    const route = parseGroundedRoute(normalizedRaw, origin.station, destination, [{ title: "Gemini 模型知識估算", url: "about:blank" }], origin.context)
      || parseLooseEstimate(normalizedRaw, origin, destination);
    return route ? { ...route, source: "ai_estimate" as const, referenceLabel: "Gemini 模型知識估算・非班表查證", sourceLinks: undefined } : null;
  });
  return estimated.filter((route): route is CommuteRouteDetails => Boolean(route));
}

function parseLooseEstimate(raw: GroundedRoute, origin: RouteOrigin, destination: string): CommuteRouteDetails | null {
  const total = Math.max(1, Math.min(240, Math.round(Number(raw.totalDurationMinutes) || 0)));
  if (!total || !Array.isArray(raw.segments) || !raw.segments.length) return null;
  const segments = raw.segments.map(segment => {
    let lineName = String(segment.lineName || "公共交通").trim();
    if (/札幌/.test(origin.context) && lineName === "南北線") lineName = "札幌市営地下鉄南北線";
    if (/仙台/.test(origin.context) && lineName === "南北線") lineName = "仙台市地下鉄南北線";
    const type = segmentType(segment.type);
    const identity = getTransitLineIdentity(lineName);
    const departureStop = toJapaneseStationName(String(segment.departureStop || origin.station));
    const arrivalStop = toJapaneseStationName(String(segment.arrivalStop || destination));
    const colors = type === "walk"
      ? { color: "#8A9590", textColor: "#FFFFFF" as const }
      : getLineColors(lineName);
    return {
      type, lineName: identity?.name || (type === "walk" ? "徒歩" : toJapaneseLineName(lineName)),
      lineShortName: identity?.shortCode || null, lineColor: colors.color,
      lineTextColor: colors.textColor, operator: identity?.operator || segment.operator || null,
      departureStop, arrivalStop, startStationNumber: getStationCodeForLine(lineName, departureStop), endStationNumber: getStationCodeForLine(lineName, arrivalStop),
      departureTime: null, arrivalTime: null, durationMinutes: Math.max(0, Math.min(total, Math.round(Number(segment.durationMinutes) || 0))),
      stopCount: Number.isInteger(segment.stopCount) ? Number(segment.stopCount) : null, headsign: segment.headsign ? String(segment.headsign) : null
    } as CommuteRouteSegment;
  });
  return {
    source: "ai_estimate", originStation: toJapaneseStationName(origin.station), destinationStation: toJapaneseStationName(destination),
    totalDurationMinutes: total, transfers: Math.max(0, Math.min(5, Math.round(Number(raw.transfers) || 0))),
    departureTime: null, arrivalTime: null, referenceLabel: "Gemini 模型知識估算・非班表查證", segments
  };
}

export function commuteFitForTransfers(transfers: number): RentRecommendation["commuteFit"] {
  return transfers === 0 ? "直達線路" : "需轉乘";
}

export async function attachCommuteRoutes(criteria: RentSearchCriteria, recommendations: RentRecommendation[]) {
  if (!criteria.commuteStation) return recommendations;
  const destination = criteria.commuteStation.split(/[、,，/／或|・]/).map(value => value.trim()).find(Boolean);
  const origins = recommendations
    .filter((item): item is RentRecommendation & { station: string } => Boolean(item.station))
    .map(item => ({ station: item.station, context: `${item.region} ${item.district}` }));
  if (!destination || !origins.length) return recommendations;

  try {
    // Each card is searched independently. A multi-origin prompt is faster, but Gemini can
    // omit otherwise valid routes from a long answer and then all omitted cards look broken.
    const routes = await resolveRoutes(origins, destination);
    return recommendations.map(recommendation => {
      const commuteRoute = routes.find(route => normalizedStation(route.originStation) === normalizedStation(recommendation.station || ""));
      if (!commuteRoute) return { ...recommendation, commuteRoute: null };
      const verifiedCommuteReason = commuteRoute.transfers === 0
        ? `實際班表為前往 ${commuteRoute.destinationStation} 的直達路線`
        : `實際班表前往 ${commuteRoute.destinationStation} 需轉乘 ${commuteRoute.transfers} 次`;
      return {
        ...recommendation,
        commuteRoute,
        // 初篩只用共同路線判斷「可能直達」；取得班表後必須由實際轉乘次數覆寫，
        // 否則卡片會同時顯示「直達線路」與「轉乘 1 次」。
        commuteFit: commuteFitForTransfers(commuteRoute.transfers),
        commuteTimeFit: "路線已查詢" as const,
        reasons: [
          ...recommendation.reasons.filter(reason => !/有共同線路|轉乘需另行確認/.test(reason)),
          verifiedCommuteReason
        ],
        cautions: recommendation.cautions.filter(caution => !caution.includes("分鐘上限尚未"))
      };
    });
  } catch (error) {
    console.warn("Grounded transit search unavailable; exact route times are omitted:", String(error));
    return recommendations.map(recommendation => ({ ...recommendation, commuteRoute: null }));
  }
}
