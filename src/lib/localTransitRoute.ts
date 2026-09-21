import tokyoGraphJson from "../data/tokyoTransitGraph.json" with { type: "json" };
import regionalGraphJson from "../data/japanRegionalTransitGraph.json" with { type: "json" };
import type { CommuteRouteDetails, CommuteRouteSegment } from "./rentAnalysis.js";
import { getLineColors, getTransitLineIdentity, toJapaneseLineName, toJapaneseStationName } from "./transit.js";

type Edge = { to: string; lineName: string; lineShortName: string | null; lineColor: string; lineTextColor: string; operator: string; sourceId: string; region?: string; durationMinutes: number; schedule?: Array<[number, number]>; fromCode: string | null; toCode: string | null; headsign: string | null };
type GraphSource = { id: string; label: string; sourceUrl: string; downloadUrl: string };
type Graph = { generatedAt: string; sourceUpdatedAt: string | null; attribution: string; sourceUrl: string; sources?: GraphSource[]; stations: Record<string, Edge[]> };

const tokyoGraph = tokyoGraphJson as unknown as Graph;
const regionalGraph = regionalGraphJson as unknown as Graph;

const stationKey = (value: string) => value.normalize("NFKC")
  .replace(/[ヶケが]/g, "か").replace(/[ノ之の]/g, "の")
  .replace(/[塚塚]/g, "塚").replace(/[麹麴]/g, "麹")
  .replace(/[ヶケ]/g, "か");

function buildAliases(graph: Graph) {
  const aliases = new Map<string, string>();
  for (const name of Object.keys(graph.stations)) {
    const shortName = name.replace(/[〈（(].*$/, "");
    aliases.set(shortName, name);
    aliases.set(stationKey(shortName), name);
  }
  return aliases;
}

const tokyoStationAliases = buildAliases(tokyoGraph);
const regionalStationAliases = buildAliases(regionalGraph);

const REFERENCE_MINUTE = 8 * 60 + 30;
const INTERCHANGE_WALK_MINUTES = 3;
const MAX_VISITED_STATES = 12_000;

function resolveStation(value: string, graph: Graph, aliases: Map<string, string>) {
  const rawExact = value.replace(/\s*[（(].*?[）)]\s*$/, "").trim();
  const exact = toJapaneseStationName(value).replace(/\s*[（(].*?[）)]\s*$/, "").trim();
  const cleaned = exact.replace(/駅$/, "");
  return graph.stations[rawExact] ? rawExact
    : graph.stations[exact] ? exact
    : graph.stations[cleaned] ? cleaned
    : aliases.get(exact) || aliases.get(stationKey(exact))
      || aliases.get(cleaned) || aliases.get(stationKey(cleaned)) || cleaned;
}

export function isRegionalLocation(originValue: string, destinationValue = "", context = ""): boolean {
  const text = `${originValue} ${destinationValue} ${context}`;
  if (/大阪|京都|兵庫|神戸|神戶|奈良|和歌山|滋賀|吹田|豊中|豐中|堺|高槻|枚方|箕面|八尾|東大阪|尼崎|西宮|芦屋|三宮|三ノ宮|愛知|名古屋|岐阜|静岡|靜岡|三重|福岡|博多|天神|北九州|小倉|佐賀|長崎|熊本|大分|宮崎|鹿児島|鹿兒島|沖縄|沖繩|那覇|那霸|北海道|札幌|さっぽろ|琴似|大通|宮城|仙台|あおば通|長町|泉中央|福島|郡山|岩手|盛岡|青森|山形|秋田|広島|廣島|岡山|倉敷|鳥取|島根|山口|香川|高松|徳島|德島|愛媛|松山|高知/.test(text)) {
    return true;
  }
  const oNorm = toJapaneseStationName(originValue);
  const dNorm = toJapaneseStationName(destinationValue);
  const oReg = regionalGraph.stations[resolveStation(oNorm, regionalGraph, regionalStationAliases)];
  const dReg = destinationValue ? regionalGraph.stations[resolveStation(dNorm, regionalGraph, regionalStationAliases)] : null;
  const oTokyo = tokyoGraph.stations[resolveStation(oNorm, tokyoGraph, tokyoStationAliases)];
  const dTokyo = destinationValue ? tokyoGraph.stations[resolveStation(dNorm, tokyoGraph, tokyoStationAliases)] : null;

  if (oReg && !oTokyo) return true;
  if (dReg && !dTokyo) return true;
  if (oReg && dReg) return true;
  return false;
}

export function isKansaiLocation(originValue: string, destinationValue = "", context = ""): boolean {
  return isRegionalLocation(originValue, destinationValue, context);
}

type State = {
  id: number;
  station: string;
  line: string;
  operator: string;
  sourceId: string;
  cost: number;
  transfers: number;
  lastTransitLine: string;
  /**
   * 上一站站名，用來擋掉「甲→乙→甲」的立即折返。
   *
   * 候車時間只在首次上車與轉乘時計算（同線直通各站不必重新等車），
   * 這使得同一條線上的折返邊變成零候車成本，搜尋會誤判「先往反方向坐一站再折返」
   * 比直接搭乘更便宜，路徑還原階段才被迴圈偵測整條丟棄（例如馬喰町→浅草橋
   * 會漏掉錦糸町轉乘這條最少轉乘的正解）。在展開邊時就擋住，成本比事後偵測低。
   */
  prevStation: string;
};

type StepRecord = {
  parentId: number;
  edge: Edge;
  elapsedMinutes: number;
  departureMinute: number;
  arrivalMinute: number;
};

function searchGraph(
  graph: Graph,
  aliases: Map<string, string>,
  originValue: string,
  destinationValue: string,
  maxRoutes = 3
): CommuteRouteDetails[] {
  const origin = resolveStation(originValue, graph, aliases);
  const destination = resolveStation(destinationValue, graph, aliases);
  if (!graph.stations[origin] || (!graph.stations[destination] && origin !== destination)) return [];
  if (origin === destination) {
    return [{
      source: "local_gtfs", originStation: origin, destinationStation: destination,
      totalDurationMinutes: 0, transfers: 0, departureTime: "08:30", arrivalTime: "08:30",
      referenceLabel: "起訖站相同", segments: []
    }];
  }

  let nextStateId = 1;
  const queue: State[] = [{ id: 0, station: origin, line: "", operator: "", sourceId: "", cost: 0, transfers: 0, lastTransitLine: "", prevStation: "" }];
  const minCost = new Map<string, number>();
  minCost.set(`${origin}::0`, 0);
  const stateData = new Map<number, StepRecord>();

  const rawCandidates: State[] = [];
  let visited = 0;

  while (queue.length && visited++ < MAX_VISITED_STATES) {
    queue.sort((left, right) => {
      const leftEffective = left.cost + left.transfers * 8;
      const rightEffective = right.cost + right.transfers * 8;
      return leftEffective - rightEffective || left.transfers - right.transfers || left.cost - right.cost;
    });
    const curr = queue.shift()!;
    if (curr.station === destination) {
      rawCandidates.push(curr);
      if (rawCandidates.length >= 15) break;
      continue;
    }

    for (const edge of graph.stations[curr.station] || []) {
      if (curr.sourceId && curr.sourceId !== edge.sourceId) continue;
      // 擋掉立即折返（甲→乙→甲）：同線折返不需重新候車，成本為零，
      // 會讓搜尋偏好繞反方向的假路徑，並在還原階段連帶丟失整條正解。
      if (edge.to === curr.prevStation) continue;
      if (edge.to === origin) continue;
      const isWalkEdge = edge.operator === "徒歩" || /連絡通路|地下道/.test(edge.lineName);

      let isTransfer = false;
      if (!isWalkEdge) {
        if (curr.lastTransitLine && curr.lastTransitLine !== edge.lineName) {
          isTransfer = true;
        }
      }

      const newTransfers = curr.transfers + (isTransfer ? 1 : 0);
      if (newTransfers > 3) continue;

      const newLastTransitLine = isWalkEdge ? curr.lastTransitLine : edge.lineName;

      const needsInterchangeWalk = isTransfer && !(/連絡通路|地下道/.test(curr.line) || curr.operator === "徒歩");
      const readyMinute = REFERENCE_MINUTE + curr.cost + (needsInterchangeWalk ? INTERCHANGE_WALK_MINUTES : 0);
      let departureMinute = readyMinute;
      let rideMinutes = edge.durationMinutes;

      // 只有在起點上車或換線轉乘時才需要候車；同線直通各站只計行車時間
      const isFirstBoarding = !curr.lastTransitLine && !isWalkEdge;
      if (isFirstBoarding || isTransfer) {
        if (edge.schedule?.length) {
          const scheduled = edge.schedule.find(([dep]) => dep >= readyMinute);
          if (!scheduled) continue;
          departureMinute = scheduled[0];
          rideMinutes = scheduled[1];
        }
      }

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
        operator: edge.operator,
        sourceId: edge.sourceId,
        cost: newCost,
        transfers: newTransfers,
        lastTransitLine: newLastTransitLine,
        prevStation: curr.station,
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
        last.stopCount = (last.stopCount || 1) + 1;
        last.headsign = step.edge.headsign || last.headsign;
      } else {
        const isWalk = step.edge.operator === "徒歩" || /連絡通路|地下道/.test(step.edge.lineName);
        const type = isWalk ? "walk" : (/メトロ|地下鉄|都営|Osaka Metro|市営地下鉄|市地下鉄/.test(step.edge.lineName) ? "subway" : "rail");
        // 必須走 getLineColors()：它會做對比度保護（enforceContrast）。
        // 直接取 identity.textColor 會繞過保護——官方標示色是給大型月台看板用的，
        // 縮到畫面上的小徽章就不夠看（如東京メトロ東西線 #00A7DB 配白字只有 2.78:1）。
        // 圖資也把 171 條路線的 lineTextColor 全填成 #FFFFFF，同樣不能直接沿用。
        const colors = isWalk
          ? { color: "#8A9590", textColor: "#FFFFFF" as const }
          : getLineColors(step.edge.lineName, step.edge.lineColor);

        segments.push({
          type,
          lineName: isWalk ? "徒歩" : canonicalLineName,
          lineShortName: isWalk ? null : (identity?.shortCode || step.edge.lineShortName),
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

    const isRegional = graph === regionalGraph;
    const transitLegs = segments.filter(s => s.type !== "walk" && s.type !== "wait");
    const actualTransfers = Math.max(0, transitLegs.length - 1);
    routes.push({
      source: "local_gtfs",
      originStation: origin,
      destinationStation: destination,
      totalDurationMinutes: target.cost,
      transfers: actualTransfers,
      departureTime: segments[0]?.departureTime || null,
      arrivalTime: segments.at(-1)?.arrivalTime || null,
      referenceLabel: isRegional
        ? `全國主要都會路網・平日 08:30 時刻相依（換線預留 ${INTERCHANGE_WALK_MINUTES} 分鐘站內移動）`
        : `首都圈 GTFS・平日 08:30 時刻相依路線（換線預留 ${INTERCHANGE_WALK_MINUTES} 分鐘站內移動）`,
      sourceLinks: [
        ...(graph.sources || []).filter(source => usedSourceIds.has(source.id)).map(source => ({ title: source.label, url: source.sourceUrl })),
        { title: isRegional ? "日本主要都會地下鐵與JR各社公開路網" : "Transitous 公開資料目錄", url: graph.sourceUrl }
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
      // 轉乘次數最少（最便利）的路線，在合理時限內皆保留
      if (r.transfers === bestTransfers) return true;
      // 轉乘次數較多的路線，不能比最快路線慢太多（最多 +5 分鐘內，避免荒謬繞遠路）
      return r.transfers <= bestTransfers + 1 && r.totalDurationMinutes <= minMinutes + 5;
    });

    viable.sort((a, b) => a.transfers - b.transfers || a.totalDurationMinutes - b.totalDurationMinutes);
    return viable.slice(0, Math.max(1, maxRoutes));
  }
  return [];
}

/**
 * 依「實際停靠站序列」回查路線名。
 */
export function identifyGraphLine(stops: string[], operator?: string | null): string | null {
  const identifiedRegional = identifyLineInGraph(regionalGraph, regionalStationAliases, stops, operator);
  if (identifiedRegional) return identifiedRegional;
  return identifyLineInGraph(tokyoGraph, tokyoStationAliases, stops, operator);
}

function identifyLineInGraph(graph: Graph, aliases: Map<string, string>, stops: string[], operator?: string | null): string | null {
  const resolved = stops.map(value => resolveStation(value, graph, aliases)).filter(Boolean);
  if (resolved.length < 2) return null;

  const matchesOperator = (lineOperator: string) => {
    if (!operator) return false;
    const left = lineOperator.replace(/\s/g, "");
    const right = String(operator).replace(/\s/g, "");
    return Boolean(left && right) && (left.includes(right) || right.includes(left));
  };

  const pick = (candidates: Map<string, string>) => {
    if (candidates.size === 1) return [...candidates.keys()][0];
    const byOperator = [...candidates].filter(([, lineOperator]) => matchesOperator(lineOperator));
    return byOperator.length === 1 ? byOperator[0][0] : null;
  };

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

  const endpoints = new Map<string, string>();
  const firstStop = new Map((graph.stations[resolved[0]] || []).map(edge => [edge.lineName, edge.operator]));
  const lastStop = new Set((graph.stations[resolved[resolved.length - 1]] || []).map(edge => edge.lineName));
  for (const [lineName, lineOperator] of firstStop) {
    if (lastStop.has(lineName)) endpoints.set(lineName, lineOperator);
  }
  return pick(endpoints);
}

let stationCodeIndex: Map<string, string> | null = null;

function graphStationCodes() {
  if (stationCodeIndex) return stationCodeIndex;
  const index = new Map<string, string>();
  for (const g of [tokyoGraph, regionalGraph]) {
    for (const [name, edges] of Object.entries(g.stations)) {
      for (const edge of edges) {
        if (edge.fromCode) index.set(`${edge.lineName}\u0000${name}`, edge.fromCode);
        if (edge.toCode) index.set(`${edge.lineName}\u0000${edge.to}`, edge.toCode);
      }
    }
  }
  stationCodeIndex = index;
  return index;
}

export function graphStationCode(lineName: string, stationName: string): string | null {
  if (!lineName || !stationName) return null;
  const norm = toJapaneseStationName(stationName);
  const codes = graphStationCodes();
  return codes.get(`${lineName}\u0000${norm}`)
    || codes.get(`${lineName}\u0000${resolveStation(norm, tokyoGraph, tokyoStationAliases)}`)
    || codes.get(`${lineName}\u0000${resolveStation(norm, regionalGraph, regionalStationAliases)}`)
    || null;
}

export function isTokyoGraphStation(stationName: string): boolean {
  if (!stationName) return false;
  return Boolean(tokyoGraph.stations[resolveStation(stationName, tokyoGraph, tokyoStationAliases)]);
}

export function isRegionalGraphStation(stationName: string): boolean {
  if (!stationName) return false;
  return Boolean(regionalGraph.stations[resolveStation(stationName, regionalGraph, regionalStationAliases)]);
}

export function isKansaiGraphStation(stationName: string): boolean {
  return isRegionalGraphStation(stationName);
}

export function isGraphStation(stationName: string): boolean {
  return isTokyoGraphStation(stationName) || isRegionalGraphStation(stationName);
}

export function findLocalTransitRoutes(
  originValue: string,
  destinationValue: string,
  maxRoutes = 3,
  context = ""
): CommuteRouteDetails[] {
  const preferRegional = isRegionalLocation(originValue, destinationValue, context);

  if (preferRegional) {
    const regionalRoutes = searchGraph(regionalGraph, regionalStationAliases, originValue, destinationValue, maxRoutes);
    if (regionalRoutes.length) return regionalRoutes;
  }

  const tokyoRoutes = searchGraph(tokyoGraph, tokyoStationAliases, originValue, destinationValue, maxRoutes);
  if (tokyoRoutes.length) return tokyoRoutes;

  if (!preferRegional) {
    const regionalRoutes = searchGraph(regionalGraph, regionalStationAliases, originValue, destinationValue, maxRoutes);
    if (regionalRoutes.length) return regionalRoutes;
  }

  return [];
}

export function findLocalTransitRoute(originValue: string, destinationValue: string, context = ""): CommuteRouteDetails | null {
  const routes = findLocalTransitRoutes(originValue, destinationValue, 1, context);
  return routes[0] || null;
}

const LOCAL_SERVICE_PATTERN = /各駅停車|各停|普通|local/i;

export function stationsWithinHops(originValue: string, maxStations: number): Set<string> {
  const isRegional = isRegionalLocation(originValue);
  const graph = isRegional ? regionalGraph : tokyoGraph;
  const aliases = isRegional ? regionalStationAliases : tokyoStationAliases;
  const origin = resolveStation(originValue, graph, aliases);
  const reached = new Set<string>();
  if (!graph.stations[origin] || maxStations <= 0) return reached;

  const localEdges = (from: string, line?: string) => {
    const edges = (graph.stations[from] || []).filter(e => !line || e.lineName === line);
    const locals = edges.filter(e => LOCAL_SERVICE_PATTERN.test(e.headsign || ""));
    if (locals.length) return locals;
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
