import { districtStations } from "../data/housingMarket.js";
import { toJapaneseStationName } from "./transit.js";

export interface ParsedStationItem {
  stationName: string;
  lineName: string;
  walkMin: number | null;
  rawText?: string;
}

const allStations = Object.values(districtStations).flat();

/**
 * 日本車站名稱標準化：去除括號後綴（如 (東京)、（東京都））、引號與「駅」結尾
 */
function cleanStationName(raw: string): string {
  let cleaned = raw
    .replace(/[／/「」]/g, " ")
    .replace(/[\(（].*?[\)）]/g, "") // 移除 (東京)、（東京都）等括號後綴
    .replace(/駅$/, "")
    .trim();

  // 若站名開頭黏著路線名稱（如 "西武池袋線桜台"、"東急東横線中目黒"），精準剝離路線前綴
  const linePrefixMatch = cleaned.match(/^(?:JR|東京メトロ|都営|東急|京王|小田急|西武|東武|京急|京成|相鉄|つくば|ゆりかもめ|りんかい)?.+?線\s*/);
  if (linePrefixMatch && linePrefixMatch[0].length < cleaned.length) {
    cleaned = cleaned.slice(linePrefixMatch[0].length).trim();
  }

  return cleaned.replace(/駅$/, "").trim();
}

/**
 * 依車站名稱自動查詢所屬日本鐵道線路
 */
export function lookupStationLines(stationName: string): string {
  const clean = cleanStationName(stationName);
  const targetJp = toJapaneseStationName(clean);
  const found = allStations.find(s => {
    const sJp = toJapaneseStationName(cleanStationName(s.name));
    return sJp === targetJp || sJp.includes(targetJp) || targetJp.includes(sJp);
  });
  return found ? found.lines.join("・") : "";
}

/**
 * 解析圖紙之最寄り駅、所屬鐵道路線與各自之徒步時間
 * 依序從 transitAccess（完整交通欄）、station 與 walkTime 解析，分開獨立列點
 */
export function parseTransitStations(
  transitAccess?: string | null,
  stationStr?: string | null,
  walkTimeStr?: string | null
): ParsedStationItem[] {
  const items: ParsedStationItem[] = [];
  const seenMap = new Map<string, ParsedStationItem>();

  const registerStation = (
    rawStation: string,
    linePart?: string | null,
    walk?: number | null,
    rawClause?: string
  ) => {
    const station = cleanStationName(rawStation);
    if (!station) return;

    // 統一以日文正規站名作為去重鍵（防止「桜台(東京)」與「桜台」、或中日漢字差異導致重複）
    const normKey = toJapaneseStationName(station);
    const officialLines = lookupStationLines(station);

    // 整合路線名稱
    const cleanLinePart = linePart ? linePart.replace(/[／/「」]/g, "").trim() : "";
    const mergedLine = cleanLinePart || officialLines;

    const existing = seenMap.get(normKey);
    if (existing) {
      // 既有車站：進行智慧合併，不重複生成卡片
      if (walk !== null && !isNaN(walk as number) && (existing.walkMin === null || (walk as number) < existing.walkMin)) {
        existing.walkMin = walk as number;
      }
      if (cleanLinePart && !existing.lineName.includes(cleanLinePart)) {
        existing.lineName = existing.lineName ? `${existing.lineName}・${cleanLinePart}` : cleanLinePart;
      }
      return;
    }

    const newItem: ParsedStationItem = {
      stationName: station,
      lineName: mergedLine,
      walkMin: walk !== null && !isNaN(walk as number) ? walk : null,
      rawText: rawClause,
    };
    seenMap.set(normKey, newItem);
    items.push(newItem);
  };

  // 1. 若圖紙有抓出完整交通欄文字（transitAccess），優先精準切分行與子句
  if (transitAccess && transitAccess.trim()) {
    const normalized = transitAccess.normalize("NFKC");
    const clauses = normalized
      .split(/[\r\n；;]+/g)
      .flatMap(line => line.split(/(?:、|(?<!\d),(?!\d))/g))
      .map(s => s.trim())
      .filter(Boolean);

    for (const clause of clauses) {
      // 句型 A：[路線名] [車站名] 徒歩[分鐘]分
      // 例："西武池袋線 桜台(東京)駅 徒歩3分"、"西武池袋線／桜台駅 徒歩3分"、"西武池袋線「桜台」駅徒歩3分"
      const matchWithLine = clause.match(
        /^(.+?)(?:[／/「\s]+)([^\s／/「」駅]+)(?:」)?(?:駅)?\s*(?:より)?\s*徒歩\s*(\d{1,3})\s*分/
      );
      if (matchWithLine) {
        const linePart = matchWithLine[1];
        const station = matchWithLine[2];
        const walk = Number(matchWithLine[3]);
        registerStation(station, linePart, isNaN(walk) ? null : walk, clause);
        continue;
      }

      // 句型 B：[車站名] 徒歩[分鐘]分（無前置路線名）
      // 例："桜台駅 徒歩3分"、"練馬 徒歩7分"
      const matchStationOnly = clause.match(
        /^([^\s／/「」駅]+)(?:」)?(?:駅)?\s*(?:より)?\s*徒歩\s*(\d{1,3})\s*分/
      );
      if (matchStationOnly) {
        const station = matchStationOnly[1];
        const walk = Number(matchStationOnly[2]);
        registerStation(station, null, isNaN(walk) ? null : walk, clause);
        continue;
      }
    }
  }

  // 2. 若缺少 transitAccess 或未完整，補足 station 與 walkTime
  if (stationStr) {
    const stations = stationStr.split(/[,，、]/).map(s => cleanStationName(s)).filter(Boolean);
    const walkTimes = (walkTimeStr || "").split(/[,，、]/).map(s => s.trim()).filter(Boolean);

    for (let i = 0; i < stations.length; i++) {
      const station = stations[i];
      if (!station) continue;

      const rawWalk = walkTimes[i] || (walkTimes.length === 1 ? walkTimes[0] : null);
      const walkNum = rawWalk ? Number(rawWalk.replace(/\D/g, "")) : null;

      registerStation(station, null, isNaN(walkNum as number) ? null : walkNum);
    }
  }

  return items;
}
