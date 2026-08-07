import graphJson from "../data/tokyoTransitGraph.json" with { type: "json" };
import type { CommuteRouteDetails, CommuteRouteSegment } from "./rentAnalysis.js";
import { toJapaneseStationName } from "./transit.js";

type Edge = { to: string; lineName: string; lineShortName: string | null; lineColor: string; lineTextColor: string; operator: string; sourceId: string; durationMinutes: number; schedule?: Array<[number, number]>; fromCode: string | null; toCode: string | null; headsign: string | null };
type GraphSource = { id: string; label: string; sourceUrl: string; downloadUrl: string };
type Graph = { generatedAt: string; sourceUpdatedAt: string | null; attribution: string; sourceUrl: string; sources?: GraphSource[]; stations: Record<string, Edge[]> };
const graph = graphJson as unknown as Graph;
const stationKey = (value: string) => value.normalize("NFKC")
  .replace(/[ヶケが]/g, "か").replace(/[ノ之の]/g, "の")
  .replace(/[塚塚]/g, "塚").replace(/[麹麴]/g, "麹")
  .replace(/[ヶケ]/g, "か");
const stationAliases = new Map<string, string>();
for (const name of Object.keys(graph.stations)) {
  const shortName = name.replace(/[〈（(].*$/, "");
  stationAliases.set(shortName, name);
  stationAliases.set(stationKey(shortName), name);
}
const REFERENCE_MINUTE = 8 * 60 + 30;
const INTERCHANGE_WALK_MINUTES = 3;
const MAX_VISITED_STATES = 12_000;

function station(value: string) {
  const rawExact = value.replace(/\s*[（(].*?[）)]\s*$/, "").trim();
  const exact = toJapaneseStationName(value).replace(/\s*[（(].*?[）)]\s*$/, "").trim();
  const cleaned = exact.replace(/駅$/, "");
  return graph.stations[rawExact] ? rawExact
    : graph.stations[exact] ? exact
    : graph.stations[cleaned] ? cleaned
    : stationAliases.get(exact) || stationAliases.get(stationKey(exact))
      || stationAliases.get(cleaned) || stationAliases.get(stationKey(cleaned)) || cleaned;
}

type State = { key: string; station: string; line: string; sourceId: string; cost: number; transfers: number };

export function findLocalTransitRoute(originValue: string, destinationValue: string): CommuteRouteDetails | null {
  const origin = station(originValue); const destination = station(destinationValue);
  if (!graph.stations[origin] || (!graph.stations[destination] && origin !== destination)) return null;
  const startKey = `${origin}\u0000`;
  const distances = new Map<string, number>([[startKey, 0]]);
  const queue: State[] = [{ key: startKey, station: origin, line: "", sourceId: "", cost: 0, transfers: 0 }];
  const previous = new Map<string, { key: string; edge: Edge; elapsedMinutes: number; departureMinute: number; arrivalMinute: number }>();
  let target: State | null = null; let visited = 0;

  while (queue.length && visited++ < MAX_VISITED_STATES) {
    queue.sort((left, right) => left.cost - right.cost || left.transfers - right.transfers);
    const current = queue.shift()!;
    if (current.cost !== distances.get(current.key)) continue;
    if (current.station === destination) { target = current; break; }
    for (const edge of graph.stations[current.station] || []) {
      // Identically named stations in different cities must never become a
      // zero-minute nationwide interchange when several feeds are merged.
      if (current.sourceId && current.sourceId !== edge.sourceId) continue;
      const changed = Boolean(current.line && current.line !== edge.lineName);
      const readyMinute = REFERENCE_MINUTE + current.cost + (changed ? INTERCHANGE_WALK_MINUTES : 0);
      const scheduled = edge.schedule?.find(([departureMinute]) => departureMinute >= readyMinute);
      if (edge.schedule?.length && !scheduled) continue;
      const departureMinute = scheduled?.[0] ?? readyMinute;
      const rideMinutes = scheduled?.[1] ?? edge.durationMinutes;
      const arrivalMinute = departureMinute + rideMinutes;
      const elapsedMinutes = arrivalMinute - (REFERENCE_MINUTE + current.cost);
      const cost = current.cost + elapsedMinutes;
      const key = `${edge.to}\u0000${edge.sourceId}:${edge.lineName}`;
      if (cost >= (distances.get(key) ?? Infinity)) continue;
      distances.set(key, cost);
      previous.set(key, { key: current.key, edge, elapsedMinutes, departureMinute, arrivalMinute });
      queue.push({ key, station: edge.to, line: edge.lineName, sourceId: edge.sourceId, cost, transfers: current.transfers + (changed ? 1 : 0) });
    }
  }
  if (!target) return null;

  const path: Array<{ edge: Edge; elapsedMinutes: number; departureMinute: number; arrivalMinute: number }> = [];
  let cursor = target.key;
  while (cursor !== startKey) {
    const step = previous.get(cursor); if (!step) return null;
    path.unshift({ edge: step.edge, elapsedMinutes: step.elapsedMinutes, departureMinute: step.departureMinute, arrivalMinute: step.arrivalMinute }); cursor = step.key;
  }
  const segments: CommuteRouteSegment[] = [];
  const usedSourceIds = new Set(path.map(step => step.edge.sourceId));
  let from = origin;
  for (const step of path) {
    const last = segments.at(-1);
    if (last && last.lineName === step.edge.lineName) {
      last.arrivalStop = step.edge.to; last.endStationNumber = step.edge.toCode;
      last.arrivalTime = `${String(Math.floor(step.arrivalMinute / 60) % 24).padStart(2, "0")}:${String(step.arrivalMinute % 60).padStart(2, "0")}`;
      last.durationMinutes += step.arrivalMinute - step.departureMinute; last.stopCount = (last.stopCount || 0) + 1;
    } else {
      segments.push({
        type: /メトロ|地下鉄|都営/.test(step.edge.lineName) ? "subway" : "rail",
        lineName: step.edge.lineName, lineShortName: step.edge.lineShortName,
        lineColor: step.edge.lineColor, lineTextColor: step.edge.lineTextColor, operator: step.edge.operator,
        departureStop: from, arrivalStop: step.edge.to, startStationNumber: step.edge.fromCode, endStationNumber: step.edge.toCode,
        departureTime: `${String(Math.floor(step.departureMinute / 60) % 24).padStart(2, "0")}:${String(step.departureMinute % 60).padStart(2, "0")}`,
        arrivalTime: `${String(Math.floor(step.arrivalMinute / 60) % 24).padStart(2, "0")}:${String(step.arrivalMinute % 60).padStart(2, "0")}`,
        durationMinutes: step.arrivalMinute - step.departureMinute,
        stopCount: 1, headsign: step.edge.headsign
      });
    }
    from = step.edge.to;
  }
  return {
    source: "local_gtfs", originStation: origin, destinationStation: destination,
    totalDurationMinutes: target.cost, transfers: target.transfers,
    departureTime: segments[0]?.departureTime || null, arrivalTime: segments.at(-1)?.arrivalTime || null,
    referenceLabel: `本地 GTFS・平日 08:30 時刻相依路線（換線預留 ${INTERCHANGE_WALK_MINUTES} 分鐘站內移動）`,
    sourceLinks: [
      ...(graph.sources || []).filter(source => usedSourceIds.has(source.id)).map(source => ({ title: source.label, url: source.sourceUrl })),
      { title: "Transitous 公開資料目錄", url: graph.sourceUrl }
    ],
    segments
  };
}

/** 各停（每站都停）的班次。急行與特急跳站，數起來的「站數」會失真。 */
const LOCAL_SERVICE_PATTERN = /各駅停車|各停|普通|local/i;

/**
 * 從指定車站出發，「搭同一條線的各停」坐 maxStations 站以內可到達的所有車站。
 *
 * 「池袋五六站就能到」是使用者很常寫、但用通勤時間或行政區都表達不出來的條件。
 * 少了它，「西武池袋線沿線」會把 0 站的池袋本身與 20 站外的所澤一起當成同一個
 * 行情範圍，估出來的區間對應不到任何真實地點。
 *
 * 兩個限制缺一不可，實測都是必要的：
 *
 * 【不允許轉乘】使用者說「幾站」指的是搭一班車坐幾站。放開轉乘後池袋 6 站可達
 * 1019 站，等於整個關東，完全失去篩選意義。
 *
 * 【只跟各停】圖上一條邊是「該班次的一次停靠」，所以特急從池袋到所沢只算 1 站。
 * 照這樣算，連「池袋 1 站內」都會включ所澤市。使用者說「五六站」時看的是路線圖上
 * 的站數，對應的是各停，因此跳站的班次要排除。若某站在該線上沒有標示各停的邊，
 * 就退而取最短車程的邊（相鄰站），避免資料標示不全時整條線斷掉。
 */
export function stationsWithinHops(originValue: string, maxStations: number): Set<string> {
  const origin = station(originValue);
  const reached = new Set<string>();
  if (!graph.stations[origin] || maxStations <= 0) return reached;

  const localEdges = (from: string, line?: string) => {
    const edges = (graph.stations[from] || []).filter(e => !line || e.lineName === line);
    const locals = edges.filter(e => LOCAL_SERVICE_PATTERN.test(e.headsign || ""));
    if (locals.length) return locals;
    // 沒有各停標示時，用最短車程當作相鄰站，逐線各取一組。
    const byLine = new Map<string, Edge>();
    for (const edge of edges) {
      const best = byLine.get(edge.lineName);
      if (!best || edge.durationMinutes < best.durationMinutes) byLine.set(edge.lineName, edge);
    }
    return [...byLine.values()];
  };

  reached.add(origin);
  let frontier: Array<{ at: string; line: string }> = [];
  for (const edge of localEdges(origin)) {
    reached.add(edge.to);
    frontier.push({ at: edge.to, line: edge.lineName });
  }

  for (let hop = 1; hop < maxStations; hop += 1) {
    const next: Array<{ at: string; line: string }> = [];
    for (const current of frontier) {
      for (const edge of localEdges(current.at, current.line)) {
        if (!reached.has(edge.to)) reached.add(edge.to);
        next.push({ at: edge.to, line: edge.lineName });
      }
    }
    if (!next.length) break;
    frontier = next;
  }
  return reached;
}
