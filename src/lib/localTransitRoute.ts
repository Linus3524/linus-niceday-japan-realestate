import graphJson from "../data/tokyoTransitGraph.json" with { type: "json" };
import type { CommuteRouteDetails, CommuteRouteSegment } from "./rentAnalysis.js";
import { getLineColors, getTransitLineIdentity, toJapaneseLineName, toJapaneseStationName } from "./transit.js";

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

type State = {
  id: number;
  station: string;
  line: string;
  sourceId: string;
  cost: number;
  transfers: number;
};

type StepRecord = {
  parentId: number;
  edge: Edge;
  elapsedMinutes: number;
  departureMinute: number;
  arrivalMinute: number;
};

/**
 * 依「實際停靠站序列」回查路線名。
 *
 * Transitous 的 jp-japan-rail 圖資 route_long_name 是空字串，route_short_name 放的是
 * 班次編號（例如 12892924）。照著顯示，畫面上的路線徽章就會變成一排無意義的數字，
 * 而且因為查不到路線身分，連站編號（JY13）與路線色都一起失效。
 *
 * 班次編號查不出路線，但停靠站序列可以：一條路線就是「這些站照這個順序相鄰」。
 * 把每一段相鄰站拿去本地 GTFS 圖資取交集，剩下的那條就是該班次實際走的線。
 *
 * 查不到時回 null，不猜。寧可讓呼叫端丟掉這條路線改用其他來源，也不要把班次編號
 * 或猜錯的路線名送到畫面上——使用者沒辦法分辨哪個是真的。
 */
export function identifyGraphLine(stops: string[], operator?: string | null): string | null {
  const resolved = stops.map(value => station(value)).filter(Boolean);
  if (resolved.length < 2) return null;

  // Transitous 寫「JR」、圖資寫「JR東日本」，指的是同一家。兩邊互相包含就算命中。
  const matchesOperator = (lineOperator: string) => {
    if (!operator) return false;
    const left = lineOperator.replace(/\s/g, "");
    const right = String(operator).replace(/\s/g, "");
    return Boolean(left && right) && (left.includes(right) || right.includes(left));
  };

  // 只有唯一解才採用。兩條線都說得通時（並行區間）寧可回 null，猜錯比查不到更糟。
  const pick = (candidates: Map<string, string>) => {
    if (candidates.size === 1) return [...candidates.keys()][0];
    const byOperator = [...candidates].filter(([, lineOperator]) => matchesOperator(lineOperator));
    return byOperator.length === 1 ? byOperator[0][0] : null;
  };

  // 1. 相鄰站逐段取交集：最強的證據，只有真的整段走完的線才會留下。
  let intersection: Map<string, string> | null = null;
  for (let index = 0; index < resolved.length - 1; index += 1) {
    const between = new Map<string, string>();
    for (const edge of graph.stations[resolved[index]] || []) {
      if (edge.to === resolved[index + 1]) between.set(edge.lineName, edge.operator);
    }
    for (const edge of graph.stations[resolved[index + 1]] || []) {
      if (edge.to === resolved[index]) between.set(edge.lineName, edge.operator);
    }
    if (!between.size) { intersection = null; break; }
    intersection = intersection
      ? new Map([...intersection].filter(([lineName]) => between.has(lineName)))
      : between;
    if (!intersection.size) break;
  }
  const exact = intersection && pick(intersection);
  if (exact) return exact;

  // 2. 退一步只看首末站共通的線：快速／急行跳站時，中間站接不成相鄰邊，
  //    但起訖站仍然落在同一條線上。
  const endpoints = new Map<string, string>();
  const firstStop = new Map((graph.stations[resolved[0]] || []).map(edge => [edge.lineName, edge.operator]));
  const lastStop = new Set((graph.stations[resolved[resolved.length - 1]] || []).map(edge => edge.lineName));
  for (const [lineName, lineOperator] of firstStop) {
    if (lastStop.has(lineName)) endpoints.set(lineName, lineOperator);
  }
  return pick(endpoints);
}

/**
 * 圖資裡的站編號（JY15、TJ04…），以 `路線名\u0000站名` 為鍵。
 *
 * transit.ts 的 STATION_CODES 是人工表，只涵蓋首都圈主要路線的主要車站；
 * 圖資本身就帶 fromCode／toCode，涵蓋 2005/2758 組（72.7%）。本地路線用得到，
 * Transitous 路線同樣用得到——差別只在資料從哪來，站編號是同一個站編號。
 * 首次呼叫才建索引：沒用到這條路徑的頁面不必付這個成本。
 */
let stationCodeIndex: Map<string, string> | null = null;

function graphStationCodes() {
  if (stationCodeIndex) return stationCodeIndex;
  const index = new Map<string, string>();
  for (const [name, edges] of Object.entries(graph.stations)) {
    for (const edge of edges) {
      if (edge.fromCode) index.set(`${edge.lineName}\u0000${name}`, edge.fromCode);
      if (edge.toCode) index.set(`${edge.lineName}\u0000${edge.to}`, edge.toCode);
    }
  }
  stationCodeIndex = index;
  return index;
}

export function graphStationCode(lineName: string, stationName: string): string | null {
  if (!lineName || !stationName) return null;
  return graphStationCodes().get(`${lineName}\u0000${station(stationName)}`) || null;
}

/**
 * 這個站名是否存在於本地圖資。
 *
 * 圖資的 sourceId 只有 tokyo 與三個路面電車系統，也就是說「站在圖資裡」
 * 等同於「站在首都圈」。這個事實可以用來驗證外部地理編碼的回答：
 * 白山（都營三田線・文京區）送去 Transitous geocode 會拿到香川縣的白山，
 * 名稱完全相等、國家也都是日本，單看名稱擋不掉。
 */
export function isGraphStation(stationName: string): boolean {
  if (!stationName) return false;
  return Boolean(graph.stations[station(stationName)]);
}

export function findLocalTransitRoutes(originValue: string, destinationValue: string, maxRoutes = 3): CommuteRouteDetails[] {
  const origin = station(originValue);
  const destination = station(destinationValue);
  if (!graph.stations[origin] || (!graph.stations[destination] && origin !== destination)) return [];
  if (origin === destination) {
    return [{
      source: "local_gtfs", originStation: origin, destinationStation: destination,
      totalDurationMinutes: 0, transfers: 0, departureTime: "08:30", arrivalTime: "08:30",
      referenceLabel: "起訖站相同", segments: []
    }];
  }

  let nextStateId = 1;
  const queue: State[] = [{ id: 0, station: origin, line: "", sourceId: "", cost: 0, transfers: 0 }];
  const minCost = new Map<string, number>();
  minCost.set(`${origin}::0`, 0);
  const stateData = new Map<number, StepRecord>();

  const rawCandidates: State[] = [];
  let visited = 0;

  while (queue.length && visited++ < MAX_VISITED_STATES) {
    queue.sort((left, right) => left.cost - right.cost || left.transfers - right.transfers);
    const curr = queue.shift()!;
    if (curr.station === destination) {
      rawCandidates.push(curr);
      if (rawCandidates.length >= 15) break;
      continue;
    }

    for (const edge of graph.stations[curr.station] || []) {
      if (curr.sourceId && curr.sourceId !== edge.sourceId) continue;
      const changed = Boolean(curr.line && curr.line !== edge.lineName);
      const newTransfers = curr.transfers + (changed ? 1 : 0);
      if (newTransfers > 3) continue;

      const readyMinute = REFERENCE_MINUTE + curr.cost + (changed ? INTERCHANGE_WALK_MINUTES : 0);
      const scheduled = edge.schedule?.find(([dep]) => dep >= readyMinute);
      if (edge.schedule?.length && !scheduled) continue;
      const departureMinute = scheduled?.[0] ?? readyMinute;
      const rideMinutes = scheduled?.[1] ?? edge.durationMinutes;
      const arrivalMinute = departureMinute + rideMinutes;
      const elapsedMinutes = arrivalMinute - (REFERENCE_MINUTE + curr.cost);
      const newCost = curr.cost + elapsedMinutes;

      const memKey = `${edge.to}:${edge.lineName}:${newTransfers}`;
      const existing = minCost.get(memKey);
      if (existing !== undefined && newCost >= existing) continue;
      minCost.set(memKey, newCost);

      const stateId = nextStateId++;
      stateData.set(stateId, { parentId: curr.id, edge, elapsedMinutes, departureMinute, arrivalMinute });
      queue.push({
        id: stateId,
        station: edge.to,
        line: edge.lineName,
        sourceId: edge.sourceId,
        cost: newCost,
        transfers: newTransfers
      });
    }
  }

  const routes: CommuteRouteDetails[] = [];
  const seenSignatures = new Set<string>();
  const seenLineSequences = new Set<string>();

  for (const target of rawCandidates) {
    const path: StepRecord[] = [];
    let curId = target.id;
    let hasLoop = false;
    const visitedStations = new Set<string>([destination]);

    while (curId > 0) {
      const data = stateData.get(curId);
      if (!data) break;
      path.unshift(data);
      curId = data.parentId;
    }

    const segments: CommuteRouteSegment[] = [];
    const usedSourceIds = new Set(path.map(step => step.edge.sourceId));
    let from = origin;
    // 合併判斷必須用 GTFS 原始 lineName，不能用 canonicalLineName：
    // canonicalLineName 是經 getTransitLineIdentity 正規化後的顯示名稱，
    // 會把不同服務收斂成同一個 id（例如 小田急多摩線 → 小田急小田原線、
    // 京王新線 → 京王線、JR南武線浜川崎支線 → JR 南武線）。
    // 路線名一旦被正規化後再拿來做合併判斷，就會把兩段實際不同的列車併成一段，
    // 漏掉中間的轉乘站——典型案例：小田急小田原線→小田急多摩線 在新百合ヶ丘轉乘。
    let lastRawLineName = "";

    for (const step of path) {
      if (visitedStations.has(from)) {
        hasLoop = true;
        break;
      }
      visitedStations.add(from);

      const identity = getTransitLineIdentity(step.edge.lineName);
      const canonicalLineName = identity?.name || step.edge.lineName;
      const last = segments.at(-1);

      if (last && step.edge.lineName === lastRawLineName) {
        last.arrivalStop = step.edge.to;
        last.endStationNumber = step.edge.toCode;
        last.arrivalTime = `${String(Math.floor(step.arrivalMinute / 60) % 24).padStart(2, "0")}:${String(step.arrivalMinute % 60).padStart(2, "0")}`;
        last.durationMinutes += step.arrivalMinute - step.departureMinute;
        last.stopCount = (last.stopCount || 0) + 1;
      } else {
        // 不沿用 GTFS 的 lineTextColor：圖資把 171 條路線全部填成 #FFFFFF，
        // 淺底色（山手線 #9ACD32、総武線 #FFD400）配白字等於看不見。
        const colors = getLineColors(step.edge.lineName, step.edge.lineColor);
        segments.push({
          type: /メトロ|地下鉄|都営/.test(step.edge.lineName) ? "subway" : "rail",
          lineName: canonicalLineName,
          lineShortName: identity?.shortCode || step.edge.lineShortName,
          lineColor: colors.color,
          lineTextColor: colors.textColor,
          operator: step.edge.operator,
          departureStop: from,
          arrivalStop: step.edge.to,
          startStationNumber: step.edge.fromCode,
          endStationNumber: step.edge.toCode,
          departureTime: `${String(Math.floor(step.departureMinute / 60) % 24).padStart(2, "0")}:${String(step.departureMinute % 60).padStart(2, "0")}`,
          arrivalTime: `${String(Math.floor(step.arrivalMinute / 60) % 24).padStart(2, "0")}:${String(step.arrivalMinute % 60).padStart(2, "0")}`,
          durationMinutes: step.arrivalMinute - step.departureMinute,
          stopCount: 1,
          headsign: step.edge.headsign
        });
        lastRawLineName = step.edge.lineName;
      }
      from = step.edge.to;
    }

    if (hasLoop || !segments.length) continue;

    const signature = segments.map(s => `${toJapaneseLineName(s.lineName).replace(/\s+/g, "")}:${s.departureStop}->${s.arrivalStop}`).join("|");
    const lineSequence = segments.map(s => toJapaneseLineName(s.lineName).replace(/\s+/g, "")).join(" > ");
    if (seenSignatures.has(signature)) continue;
    seenSignatures.add(signature);
    if (seenLineSequences.has(lineSequence)) continue;
    seenLineSequences.add(lineSequence);

    routes.push({
      source: "local_gtfs",
      originStation: origin,
      destinationStation: destination,
      totalDurationMinutes: target.cost,
      transfers: target.transfers,
      departureTime: segments[0]?.departureTime || null,
      arrivalTime: segments.at(-1)?.arrivalTime || null,
      referenceLabel: `本地 GTFS・平日 08:30 時刻相依路線（換線預留 ${INTERCHANGE_WALK_MINUTES} 分鐘站內移動）`,
      sourceLinks: [
        ...(graph.sources || []).filter(source => usedSourceIds.has(source.id)).map(source => ({ title: source.label, url: source.sourceUrl })),
        { title: "Transitous 公開資料目錄", url: graph.sourceUrl }
      ],
      segments
    });
  }

  if (routes.length > 0) {
    const minMinutes = Math.min(...routes.map(r => r.totalDurationMinutes));
    const timeBounded = routes.filter(r => {
      const maxAllowed = r.transfers === 0
        ? Math.max(Math.round(minMinutes * 1.7), minMinutes + 25)
        : Math.max(Math.round(minMinutes * 1.5), minMinutes + 15);
      return r.totalDurationMinutes <= maxAllowed;
    });

    if (!timeBounded.length) return [];

    const bestTransfers = Math.min(...timeBounded.map(r => r.transfers));
    const viable = timeBounded.filter(r => {
      if (r.totalDurationMinutes <= minMinutes + 8) return true;
      return r.transfers <= bestTransfers + 1;
    });

    // 依使用者需求：轉乘次數最少到多次排序；同轉乘次數則耗時最短優先
    viable.sort((a, b) => a.transfers - b.transfers || a.totalDurationMinutes - b.totalDurationMinutes);
    return viable.slice(0, Math.max(1, maxRoutes));
  }
  return [];
}

export function findLocalTransitRoute(originValue: string, destinationValue: string): CommuteRouteDetails | null {
  const routes = findLocalTransitRoutes(originValue, destinationValue, 1);
  return routes[0] || null;
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
