import type { CommuteRouteDetails, CommuteRouteSegment } from "./rentAnalysis.js";

/**
 * 把「站到站」的路線補成「門到門」的路線圖。
 *
 * 路線資料原本只描述在車上的時間，但 totalDurationMinutes 量的是牆鐘時間
 * （含候車與轉乘等待）。兩個數字並排在同一張卡片上，徽章加總永遠小於總時間，
 * 看起來就像系統算錯。這裡把中間「人在車站、不在車上」的時間顯性化成節點，
 * 再把出門與抵達的步行接到頭尾，使徽章加總等於卡片總時間。
 */

const WAIT_COLOR = "#8A9590";

function toMinutes(value: string | null): number | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** 跨午夜的班次會讓 22:50 → 00:10 算出負值，補一天份再回傳。 */
function gapMinutes(from: string | null, to: string | null): number {
  const start = toMinutes(from);
  const end = toMinutes(to);
  if (start === null || end === null) return 0;
  const raw = end - start;
  return raw >= 0 ? raw : raw + 24 * 60;
}

function waitSegment(station: string, minutes: number, label: string, stationNumber?: string | null): CommuteRouteSegment {
  return {
    type: "wait",
    lineName: label,
    lineShortName: null,
    lineColor: WAIT_COLOR,
    lineTextColor: "#FFFFFF",
    operator: null,
    departureStop: station,
    arrivalStop: station,
    startStationNumber: stationNumber ?? null,
    endStationNumber: stationNumber ?? null,
    departureTime: null,
    arrivalTime: null,
    durationMinutes: minutes,
    stopCount: null,
    headsign: null,
  };
}

function walkSegment(from: string, to: string, minutes: number, endStationNumber: string | null): CommuteRouteSegment {
  return {
    type: "walk",
    lineName: "徒歩",
    lineShortName: null,
    lineColor: WAIT_COLOR,
    lineTextColor: "#FFFFFF",
    operator: null,
    departureStop: from,
    arrivalStop: to,
    startStationNumber: null,
    endStationNumber,
    departureTime: null,
    arrivalTime: null,
    durationMinutes: minutes,
    stopCount: null,
    headsign: null,
  };
}

function busSegment(from: string, to: string, minutes: number, endStationNumber: string | null): CommuteRouteSegment {
  return {
    type: "bus",
    lineName: "バス",
    lineShortName: null,
    lineColor: "#2563EB",
    lineTextColor: "#FFFFFF",
    operator: null,
    departureStop: from,
    arrivalStop: to,
    startStationNumber: null,
    endStationNumber,
    departureTime: null,
    arrivalTime: null,
    durationMinutes: minutes,
    stopCount: null,
    headsign: null,
  };
}

export interface DoorToDoorOptions {
  originWalkMinutes?: number | null;
  /** 圖紙刊載的起站巴士接駁；有值時，originWalkMinutes 代表走到巴士站。 */
  originBusMinutes?: number | null;
  originBusStop?: string | null;
  destinationWalkMinutes?: number | null;
  originLabel?: string;
  destinationLabel?: string;
}

/**
 * 依相鄰班次的時刻差補上轉乘等候節點。
 *
 * 回傳的 accounted 是「補完之後所有節點的分鐘總和」，呼叫端用它算出還沒交代的
 * 殘差（通常是在起站等第一班車的時間）。
 */
function withTransferWaits(segments: CommuteRouteSegment[]) {
  const result: CommuteRouteSegment[] = [];
  for (const [index, segment] of segments.entries()) {
    const previous = segments[index - 1];
    if (previous) {
      const wait = gapMinutes(previous.arrivalTime, segment.departureTime);
      // 只補 1 分鐘以上的空檔：秒級的時刻差補成「0 分」節點只會讓圖變長。
      if (wait > 0) {
        const label = previous.type === "walk" ? "候車" : "轉乘候車";
        result.push(waitSegment(segment.departureStop, wait, label, segment.startStationNumber));
      }
    }
    result.push(segment);
  }
  return result;
}

/**
 * 產生可直接畫成路線圖的門到門路線。
 *
 * 不修改傳入的 route：站到站的耗時（transitMinutes）與轉乘次數仍由原始資料負責，
 * 這裡只負責「呈現」。
 */
export function buildDoorToDoorRoute(route: CommuteRouteDetails, options: DoorToDoorOptions = {}): CommuteRouteDetails {
  const originWalk = Math.max(0, Math.round(Number(options.originWalkMinutes) || 0));
  const originBus = Math.max(0, Math.round(Number(options.originBusMinutes) || 0));
  const originBusStop = options.originBusStop?.trim() || "巴士站";
  const destinationWalk = Math.max(0, Math.round(Number(options.destinationWalkMinutes) || 0));
  const originLabel = options.originLabel || "自宅";
  const destinationLabel = options.destinationLabel || "目的地";

  const withWaits = withTransferWaits(route.segments);
  const ridingAndWaiting = withWaits.reduce((sum, segment) => sum + segment.durationMinutes, 0);

  // 起站候車時間沒有任何欄位記載它，只能由「總時間減去已交代的部分」回推。
  // 用殘差而不是自己重算，才能保證徽章加總與卡片總時間一定相等。
  const residual = route.totalDurationMinutes - ridingAndWaiting;
  const first = withWaits[0];
  const boarding = residual > 0 && first
    ? [waitSegment(first.departureStop, residual, "候車", first.startStationNumber)]
    : [];

  const transitSegments = [...boarding, ...withWaits];
  const firstTransit = transitSegments[0];
  const lastTransit = transitSegments[transitSegments.length - 1];

  const leading: CommuteRouteSegment[] = [];
  if (firstTransit && originBus > 0) {
    if (originWalk > 0) leading.push(walkSegment(originLabel, originBusStop, originWalk, null));
    leading.push(busSegment(originBusStop, firstTransit.departureStop, originBus, firstTransit.startStationNumber ?? null));
  } else if (originWalk > 0 && firstTransit) {
    leading.push(walkSegment(originLabel, firstTransit.departureStop, originWalk, firstTransit.startStationNumber ?? null));
  }
  const trailing = destinationWalk > 0 && lastTransit
    ? [walkSegment(lastTransit.arrivalStop, destinationLabel, destinationWalk, null)]
    : [];

  const segments = [...leading, ...transitSegments, ...trailing];
  return {
    ...route,
    totalDurationMinutes: segments.reduce((sum, segment) => sum + segment.durationMinutes, 0),
    segments,
  };
}

/** 路線圖上代表「實際搭乘」的段落；候車與步行不算一段車程。 */
export function isRidingSegment(segment: CommuteRouteSegment) {
  return segment.type !== "walk" && segment.type !== "wait";
}
