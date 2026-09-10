import { districtStations as dsHousing } from "../data/housingMarket.js";
import { districtStations as dsStation } from "../data/stationData.js";
import graphJson from "../data/tokyoTransitGraph.json" with { type: "json" };
import { toJapaneseStationName, toJapanesePlaceName } from "./transit.js";

export interface ParsedStationItem {
  stationName: string;
  lineName: string;
  walkMin: number | null;
  rawText?: string;
}

const allCuratedStations = [...Object.values(dsHousing).flat(), ...Object.values(dsStation).flat()];
const transitGraph = graphJson as { stations: Record<string, Array<{ lineName: string }>> };

const stationKey = (value: string) => value.normalize("NFKC")
  .replace(/[ヶケが]/g, "か").replace(/[ノ之の]/g, "の")
  .replace(/[塚塚]/g, "塚").replace(/[麹麴]/g, "麹")
  .replace(/[ヶケ]/g, "か");

const stationAliases = new Map<string, string>();
for (const name of Object.keys(transitGraph.stations || {})) {
  const shortName = name.replace(/[〈（(].*$/, "");
  stationAliases.set(shortName, name);
  stationAliases.set(stationKey(shortName), name);
}

function simplifyLineName(line: string): string {
  if (!line) return "";
  if (line.includes("都電荒川線") || line.includes("さくらトラム")) return "都電荒川線";
  return line.replace(/支線各停$/, "支線").trim();
}

/**
 * 日本車站名稱標準化：去除括號後綴（如 (東京)、（東京都））、引號與「駅」結尾
 */
function cleanStationName(raw?: string | null): string {
  if (!raw || typeof raw !== "string") return "";
  let cleaned = raw
    .replace(/^[◎●◆■※・\s]+/u, "")
    .replace(/[／/「」『』《》〈〉【】\[\]［］〔〕〖〗〘〙]/gu, " ")
    .replace(/[\(（].*?[\)）]/gu, "") // 移除 (東京)、（東京都）等括號後綴
    .replace(/駅$/u, "")
    .trim();

  // 若站名開頭黏著路線名稱（如 "西武池袋線桜台"、"東急東横線中目黒"、"都電荒川線向原"），精準剝離路線前綴
  const linePrefixMatch = cleaned.match(/^(?:JR|東京メトロ|都営|東急|京王|小田急|西武|東武|京急|京成|相鉄|つくば|ゆりかもめ|りんかい)?.+?(?:線|トラム|ライン)\s*/u);
  if (linePrefixMatch && linePrefixMatch[0].length < cleaned.length) {
    cleaned = cleaned.slice(linePrefixMatch[0].length).trim();
  }

  return cleaned.replace(/[／/「」『』《》〈〉【】\[\]［］〔〕〖〗〘〙]/gu, "").replace(/駅$/u, "").trim();
}

/**
 * 依車站名稱自動查詢所屬日本鐵道線路
 * 整合精選大站清單與涵蓋全首都圈 2,100+ 站的完整鐵道路網圖資，確保全站所有車站都能查出路線
 */
export function lookupStationLines(stationName?: string | null): string {
  const clean = cleanStationName(stationName);
  if (!clean) return "";
  const targetJp = toJapaneseStationName(clean);

  // 1. 優先比對精選車站資料（具備經過編輯的核心主流路線）
  const found = allCuratedStations.find(s => toJapaneseStationName(cleanStationName(s?.name)) === targetJp);
  if (found && found.lines?.length) {
    return found.lines.join("・");
  }

  // 2. 比對全首都圈完整鐵道圖資（2,116 站，支援別名、平假名/片假名異體字與括號後綴）
  const graphKey = transitGraph.stations[targetJp] ? targetJp
    : transitGraph.stations[clean] ? clean
    : stationAliases.get(targetJp) || stationAliases.get(stationKey(targetJp))
    || stationAliases.get(clean) || stationAliases.get(stationKey(clean));

  if (graphKey && transitGraph.stations[graphKey]) {
    const lines = Array.from(new Set(
      transitGraph.stations[graphKey].map(e => simplifyLineName(e.lineName)).filter(Boolean)
    ));
    if (lines.length) return lines.join("・");
  }

  return "";
}

/**
 * 解析圖紙之最寄り駅、所屬鐵道路線與各自之徒步時間
 * 依序從 transitAccess（完整交通欄）、station 與 walkTime 解析，分開獨立列點，並保證所有車站均標示路線
 */
export function parseTransitStations(
  transitAccess?: string | null,
  stationStr?: string | null,
  walkTimeStr?: string | null
): ParsedStationItem[] {
  const items: ParsedStationItem[] = [];
  try {
    const seenMap = new Map<string, ParsedStationItem>();

    const registerStation = (
      rawStation?: string | null,
      linePart?: string | null,
      walk?: number | null,
      rawClause?: string
    ) => {
      const station = cleanStationName(rawStation);
      if (!station) return;

      // 統一以日文正規站名作為去重鍵（防止「桜台(東京)」與「桜台」、或中日漢字差異導致重複）
      const normKey = toJapaneseStationName(station);
      const officialLines = lookupStationLines(station);

      // 整合路線名稱：優先使用圖紙抓到的路線名，若圖紙未寫或簡略，以官方/資料庫路線補足
      const cleanLinePart = linePart ? linePart.replace(/^[◎●◆■※・\s]+|[／/「」『』《》〈〉【】\[\]［］〔〕〖〗〘〙]/gu, "").trim() : "";
      const mergedLine = cleanLinePart || officialLines;

      const existing = seenMap.get(normKey);
      if (existing) {
        // 既有車站：進行智慧合併，不重複生成卡片
        if (walk !== null && walk !== undefined && !isNaN(walk) && (existing.walkMin === null || walk < existing.walkMin)) {
          existing.walkMin = walk;
        }
        if (!existing.lineName && (cleanLinePart || officialLines)) {
          existing.lineName = cleanLinePart || officialLines;
        } else if (cleanLinePart && !existing.lineName.includes(cleanLinePart)) {
          existing.lineName = existing.lineName ? `${existing.lineName}・${cleanLinePart}` : cleanLinePart;
        }
        return;
      }

      const newItem: ParsedStationItem = {
        stationName: station,
        lineName: mergedLine || officialLines,
        walkMin: walk !== null && walk !== undefined && !isNaN(walk) ? walk : null,
        rawText: rawClause,
      };
      seenMap.set(normKey, newItem);
      items.push(newItem);
    };

    // 1. 若圖紙有抓出完整交通欄文字（transitAccess），優先精準切分行與子句
    if (transitAccess && transitAccess.trim()) {
      const normalized = transitAccess.normalize("NFKC");
      // 切分各車站條目：支援換行、分號、逗號，以及條目間的斜線（如 '徒歩6分 / 東京メトロ...'）或以空格隔開的後續路線，支援項目符號
      const splitRegex = /(?:[\r\n；;]+|(?:、|(?<!\d)[,，](?!\d))|(?<=[分秒歩])\s*[／/]\s*|\s+[／/]\s*|(?<=[分秒])\s+(?=(?:[◎●◆■※・\s]*(?:JR|東京メトロ|都営|東急|京王|小田急|西武|東武|京急|京成|相鉄|つくば|ゆりかもめ|りんかい|[^\s／/「」駅]+(?:線|駅))))|[／/](?=\s*(?:JR|東京メトロ|都営|東急|京王|小田急|西武|東武|京急|京成|相鉄|つくば|ゆりかもめ|りんかい))|(?<=[分秒])\s*(?=[◎●◆■※]))/gu;
      const clauses = normalized
        .split(splitRegex)
        .map(s => s.trim())
        .filter(Boolean);

      for (const clause of clauses) {
        // 句型 A：[路線名] [車站名] 徒歩[分鐘]分
        // 例："西武池袋線 桜台(東京)駅 徒歩3分"、"西武池袋線／桜台駅 徒歩3分"、"◎東京メトロ有楽町線[要町] 徒歩9分"
        const matchWithLine = clause.match(
          /^([◎●◆■※・\s]*.+?(?:線|ライン|トラム|電車|地下鉄|メトロ|JR|[A-Za-z0-9]+))[\s／/「『【\[［]+([^\s／/「」『』【】\[\]［］駅徒歩]+)[」』】\]］]?(?:駅)?\s*(?:より)?\s*(?:徒歩|歩)\s*(\d{1,3})\s*分/u
        );
        if (matchWithLine) {
          const linePart = matchWithLine[1];
          const station = matchWithLine[2];
          const walk = Number(matchWithLine[3]);
          registerStation(station, linePart, isNaN(walk) ? null : walk, clause);
          continue;
        }

        // 句型 B：[車站名] 徒歩[分鐘]分（無前置路線名）
        // 例："大塚駅 徒歩6分"、"練馬 徒歩7分"、"[大山] 徒歩17分"
        const matchStationOnly = clause.match(
          /^[◎●◆■※・\s]*[「『【\[［]?([^\s／/「」『』【】\[\]［］駅徒歩]+)[」』】\]］]?(?:駅)?\s*(?:より)?\s*(?:徒歩|歩)\s*(\d{1,3})\s*分/u
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

        registerStation(station, null, walkNum !== null && !isNaN(walkNum) ? walkNum : null);
      }
    }
  } catch (error) {
    console.warn("parseTransitStations safe fallback:", error);
  }

  return items;
}

export interface TransitHubEvaluation {
  hasMajorTerminal: boolean;
  majorStation: string | null;
  majorWalkMinutes: number | null;
  totalStations: number;
  totalLinesCount: number;
  ratePercent: number;
  note: string;
}

/**
 * 評估物件的交通樞紐度與多線利用優勢。
 *
 * 買賣實務上，即使地址屬於相鄰行政區，若在「熱門大站／主要轉運樞紐（如中野、新宿、澀谷、吉祥寺）」
 * 的徒步圈內（15分內），或具備 2 站 3 路線以上可利用，通常享有顯著的抗跌與流動性溢價。
 */
export function evaluateTransitHub(
  stations: string[],
  walkTimes?: (string | number | null | undefined)[]
): TransitHubEvaluation | null {
  if (!stations || !stations.length) return null;

  const parsed = stations.map((st, i) => {
    const rawWalk = walkTimes?.[i];
    const walkMin = rawWalk !== undefined && rawWalk !== null
      ? parseInt(String(rawWalk).match(/\d+/)?.[0] || "", 10)
      : null;
    const clean = String(st).replace(/[駅站]/g, "").trim();
    const jp = toJapaneseStationName(clean);
    const curated = allCuratedStations.find(
      s => s.name === clean || s.name === toJapanesePlaceName(clean) || toJapaneseStationName(s.name) === jp
    );
    const linesStr = lookupStationLines(jp);
    const lines = linesStr ? linesStr.split(/[・、]/).map(l => l.trim()).filter(Boolean) : (curated?.lines || []);
    const isMajor = curated?.type === "major";
    return { name: clean, jp, walkMin, isMajor, lines, linesStr };
  }).filter(p => p.name.length > 0);

  const majorCandidates = parsed.filter(p => p.isMajor && p.walkMin !== null && p.walkMin <= 15);
  majorCandidates.sort((a, b) => (a.walkMin ?? 99) - (b.walkMin ?? 99));
  const primaryMajor = majorCandidates[0] || null;

  const validWalkStations = parsed.filter(p => p.walkMin !== null && p.walkMin <= 20);
  const totalStations = validWalkStations.length > 0 ? validWalkStations.length : parsed.length;
  const allLines = Array.from(new Set(parsed.flatMap(p => p.lines)));

  if (primaryMajor) {
    const linesDesc = primaryMajor.lines.length > 0 ? primaryMajor.lines.join("・") : primaryMajor.linesStr || "多線共構";
    const multiNote = totalStations >= 2 ? `，合計 ${totalStations} 站${allLines.length >= 2 ? ` ${allLines.length} 路線` : ""}利用可能` : "";
    const walk = primaryMajor.walkMin ?? 10;
    const ratePercent = walk <= 5 ? 8 : walk <= 10 ? 6 : 4;
    return {
      hasMajorTerminal: true,
      majorStation: primaryMajor.name,
      majorWalkMinutes: primaryMajor.walkMin,
      totalStations,
      totalLinesCount: allLines.length,
      ratePercent,
      note: `可徒步至「${primaryMajor.name}」駅（${linesDesc}・熱門核心大站，徒步 ${primaryMajor.walkMin} 分）${multiNote}`,
    };
  }

  if (totalStations >= 2 && allLines.length >= 2) {
    return {
      hasMajorTerminal: false,
      majorStation: null,
      majorWalkMinutes: null,
      totalStations,
      totalLinesCount: allLines.length,
      ratePercent: 3,
      note: `可利用 ${totalStations} 座車站（${allLines.length} 條路線），具備多路線通勤彈性與替代動線優勢`,
    };
  }

  return null;
}
