import { districtStations as dsHousing } from "../data/housingMarket.js";
import { districtStations as dsStation } from "../data/stationData.js";
import graphJson from "../data/tokyoTransitGraph.json" with { type: "json" };
import { toJapaneseStationName, toJapanesePlaceName } from "./transit.js";
import { stripStationOperatorPrefix } from "./listingExtraction.js";
import {
  BULLET,
  LINE_STATION_WALK,
  STATION_WALK,
  isPlausibleStationToken,
  normalizeLineKey,
} from "./transitPatterns.js";

/**
 * 一條獨立的交通動線：路線 × 車站 × 步行時間，三者綁在一起不可分離。
 *
 * 這是交通資訊的唯一事實來源。歷史上交通資訊靠 `station` / `walkTime`
 * 兩個逗號分隔字串「以 index 對齊」傳遞，有三個結構性問題：
 *   1. 路線維度無處可放（`lineName` 解析完就丟失）。
 *   2. 任何一層對其中一個陣列去重，就會與另一個錯位，而且完全靜默。
 *   3. 無法表達「同站不同線」——`"両国,両国"` 這種寫法本身就在誘導別人去重。
 *
 * 2026-09 的同站多路線漏失 bug 正是問題 2 造成的。
 */
export interface TransitLeg {
  /** 原文路線名，顯示用（如「中央・総武線各停」）。 */
  lineName: string;
  /** 正規化站名，不含「駅」。 */
  stationName: string;
  /** 圖紙刊載的步行分鐘；未刊載時為 null。 */
  walkMin: number | null;
  /** 原文子句，供稽核與人工比對。 */
  rawText?: string;
  /**
   * 巴士接駁：圖紙寫「三鷹駅 バス15分 バス停「野崎」徒歩3分」時，
   * walkMin 是走到巴士站的時間、busMin 是車程、busStop 是巴士站名。
   * 沒有 busMin 就是一般徒步可達的站。
   */
  busMin?: number | null;
  busStop?: string;
}

/** 到車站的總分鐘（巴士接駁＝走到巴士站＋車程），行情判斷與序列化都用這個口徑。 */
export function transitLegTotalMinutes(leg: Pick<TransitLeg, "walkMin" | "busMin">): number | null {
  if (leg.walkMin === null) return null;
  return leg.walkMin + (leg.busMin ?? 0);
}

/**
 * @deprecated 改用 `TransitLeg`。保留別名讓既有引用不必一次全改。
 */
export type ParsedStationItem = TransitLeg;

/**
 * 把 legs 序列化回 `station` / `walkTime` 兩個對外相容欄位。
 *
 * 分享連結與既有 baseline fixture 仍讀這兩個欄位，因此 legs 成為事實來源後，
 * 這兩個欄位降級為「由 legs 產生的結果」而非各自維護的狀態。
 * 兩個陣列**必定等長**，這是此函式存在的主要理由。
 */
/**
 * 把圖紙「交通」欄的原文拆成 TransitLeg 清單，是 transitLegs 的事實來源。
 * 同名站的不同路線（両国的都営 vs JR）是兩條獨立動線，刻意不依站名去重。
 */
/**
 * 拆開沒有分隔符的「路線名＋站名」黏連寫法。
 *
 * 圖紙很常把兩者直接連寫：「総武本線馬喰町駅」「都営新宿線馬喰横山駅」「日比谷線小伝馬町駅」。
 * 原本依賴空白或「／」切分，這種寫法會整串被當成站名、`lineName` 留空，
 * 前端「最近車站」卡片於是只剩站名與分鐘，路線資訊全部消失。
 *
 * 切點取**最後一個**路線名後綴：「線」在日本路線名中可能出現多次
 * （「都営新宿線」「東急東横線」），取最後一個才不會把「新宿」留給站名。
 * 找不到後綴時回傳 null，由呼叫端維持「路線名留空」的既有行為——
 * 不猜測，空字串代表「圖紙沒寫或無法判讀」。
 */
function splitGluedLineAndStation(value: string): { line: string; station: string } | null {
  // ライン／エクスプレス／モノレール／新交通 等外來語與特殊路線名也要涵蓋，
  // 它們不以「線」結尾（「ゆりかもめ」無後綴，屬於找不到切點的情況）。
  const suffix = /(?:線|ライン|エクスプレス|モノレール|新交通|地下鉄)/gu;
  let cut = -1;
  for (const match of value.matchAll(suffix)) cut = (match.index ?? 0) + match[0].length;
  if (cut <= 0 || cut >= value.length) return null;

  const line = value.slice(0, cut);
  const station = value.slice(cut);
  // 站名至少要有一個字，且不能整段都是路線後綴殘留。
  if (!station.replace(/[駅「」『』【】\[\]［］]/gu, "").trim()) return null;
  return { line, station };
}

export function parseTransitAccessLegs(transitAccess: string | null | undefined): TransitLeg[] {
  const raw = (transitAccess || "").normalize("NFKC");
  if (!raw.trim()) return [];
  const legs: TransitLeg[] = [];
  const lines = raw.split(/[\r\n；;]+/).map(s => s.trim()).filter(Boolean);
  // 必須用 g flag 逐行掃出「所有」符合項：同一車站的多條路線常被排版在同一行
  // （如「東急目黒線／不動前駅 徒歩7分 / JR山手線／五反田駅 徒歩14分」），
  // 每行只取第一筆會讓第二站之後全部消失。
  // 只用「徒歩 N 分」當錨點，站名與路線名從「上一個錨點結束 → 這個錨點」之間的描述取。
  // 先前用一個不含空白的 capture group 去抓站名，「都営大江戸線 両国 徒歩1分」這種
  // 以空白分隔線名與站名的寫法（圖紙最常見）會只抓到「両国」、路線名整個丟掉，
  // 於是同名站的兩條路線（都営 vs JR 両国）在下游被當成同一條動線去重，JR 那條就消失。
  // 「停歩」是「バス停から徒歩」、「駅歩」是「駅から徒歩」的慣用縮寫；
  // レオパレス系圖紙更只寫「歩4分」，所以錨點收到單一個「歩」。
  const anchor = /(?:徒歩|停歩|駅歩|歩)\s*(\d{1,3})\s*分/gu;

  for (const line of lines) {
    let cursor = 0;
    for (const match of line.matchAll(anchor)) {
      let descriptor = line
        .slice(cursor, match.index)
        .replace(/^[\s／/・、,，;；:：]+/u, "")
        .replace(/\s*(?:より|から|まで)\s*$/u, "")
        .trim();
      cursor = (match.index ?? 0) + match[0].length;
      const minutes = Number(match[1]);
      if (!descriptor || !Number.isInteger(minutes) || minutes < 1 || minutes > 120) continue;

      // 巴士接駁：「JR中央線 三鷹駅 バス15分 バス停「野崎」徒歩3分」
      // 「バス N 分」之前是路線＋車站，之後是巴士站；徒歩分鐘是走到巴士站的時間。
      let busMin: number | null = null;
      let busStop = "";
      // 「駅バス11分」＝從該站搭巴士 11 分
      const bus = descriptor.match(/バス\s*(?:乗車\s*)?(\d{1,3})\s*分/u);
      if (bus) {
        busMin = Number(bus[1]);
        const after = descriptor.slice((bus.index ?? 0) + bus[0].length);
        const stopBracket = after.match(/[「『【\[［]([^」』】\]］]+)[」』】\]］]/u);
        busStop = (stopBracket ? stopBracket[1] : after.replace(/バス停|停留所|バスのりば|バス乗り場|[\s／/・、,，]/gu, ""))
          .replace(/(?:バス停|停留所)$/u, "").trim();
        descriptor = descriptor.slice(0, bus.index).replace(/[\s／/・、,，]+$/u, "").trim();
        if (!descriptor) continue;
      }

      // 「バス停「目黒車庫」まで徒歩2分」這種只有巴士站沒有車程的句子不是車站動線；
      // 括號站名會繞過 isPlausibleStationToken，所以要先擋整句。
      if (!bus && /バス停|停留所|バスのりば|バス乗り場|コンビニ|スーパー|薬局|学校|公園/u.test(descriptor)) continue;

      // 「都営大江戸線「両国」駅」：括號內是站名、括號前是路線。
      // 「東急目黒線／不動前駅」「都営大江戸線 両国」：最後一段是站名、其餘是路線。
      const bracket = descriptor.match(/[「『【\[［]([^」』】\]］]+)[」』】\]］]/u);
      let stationPart: string;
      let linePart: string;
      if (bracket) {
        stationPart = bracket[1];
        linePart = descriptor.slice(0, bracket.index);
      } else {
        const segments = descriptor.split(/[／/\s]+/u).filter(Boolean);
        stationPart = segments.at(-1) || "";
        linePart = segments.slice(0, -1).join(" ");
        // 無分隔符的黏連寫法（「総武本線馬喰町駅」「日比谷線小伝馬町駅」）在上面
        // 只會切出一段，於是整串被當成站名、路線名整個丟失。改用路線名後綴當切點：
        // 日文路線名幾乎都以 線／ライン／エクスプレス／モノレール 等字樣收尾，
        // 其後到「駅」為止的部分才是站名。
        if (!linePart) {
          const glued = splitGluedLineAndStation(stationPart);
          if (glued) {
            linePart = glued.line;
            stationPart = glued.station;
          }
        }
      }
      const station = (stripStationOperatorPrefix(stationPart) || "").replace(/[「」『』【】\[\]［］駅]/gu, "").trim();
      if (!station) continue;
      // 「駅」字改為可選後，バス停・コンビニ・学校等距離描述也會命中，必須擋掉，
      // 否則 station 欄位會混入非車站文字並破壞後續行情與地圖定位。
      if (!isPlausibleStationToken(station)) continue;
      // 路線名取不到時留空字串，不可猜測——空字串代表「圖紙沒寫」，與「寫了但解析失敗」
      // 在下游是不同處理。
      const lineName = linePart.replace(/[「」『』【】\[\]［］]/gu, "").replace(/[／/\s]+$/u, "").trim();
      // 刻意不依站名去重：同名站的不同路線（両国的都営 vs JR）是兩條獨立動線，
      // 必須保留成兩個 leg。但「路線＋站名＋分鐘」全等屬重複刊載，應收斂。
      if (legs.some(leg =>
        leg.stationName === station && leg.walkMin === minutes && leg.lineName === lineName && (leg.busMin ?? null) === busMin)) continue;
      legs.push({
        lineName, stationName: station, walkMin: minutes, rawText: `${descriptor} ${bus ? bus[0] + " " : ""}${match[0]}`,
        ...(busMin !== null ? { busMin, busStop: busStop || undefined } : {}),
      });
    }
  }

  return legs;
}

export function serializeTransitLegs(legs: TransitLeg[]): { station: string; walkTime: string } {
  // 巴士接駁的站用「走到巴士站＋車程」的總分鐘序列化：下游把 walkTime 當成到站時間
  // 在算車站距離加減分，只給走到巴士站的 3 分會被誤判成「極近站 +10%」。
  return {
    station: legs.map(leg => leg.stationName).join(","),
    walkTime: legs.map(leg => { const total = transitLegTotalMinutes(leg); return total === null ? "" : String(total); }).join(","),
  };
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

      // 統一以日文正規站名作為標準名稱
      const normKey = toJapaneseStationName(station);
      const officialLines = lookupStationLines(station);

      // 整合路線名稱：優先使用圖紙抓到的路線名，若圖紙未寫或簡略，以官方/資料庫路線補足
      const cleanLinePart = linePart ? linePart.replace(/^[◎●◆■※・\s]+|[／/「」『』《》〈〉【】\[\]［］〔〕〖〗〘〙]/gu, "").trim() : "";
      const mergedLine = cleanLinePart || officialLines;

      const walkValue = walk !== null && walk !== undefined && !isNaN(walk) ? walk : null;

      // 若有明確路線名稱，以「正規化路線_站名」作為唯一鍵，避免將同一車站不同路線
      // （如都営大江戸線 vs 中央・総武線各停）誤判為重複。
      // 路線名必須先正規化，否則同一條線的不同寫法（「JR中央・総武線各停」／「中央・総武線各停」
      // ／「総武線各停」）會產生三張內容相同的重複卡片。
      const routeKey = cleanLinePart ? `${normalizeLineKey(cleanLinePart)}_${normKey}` : null;

      if (routeKey && seenMap.has(routeKey)) {
        const existing = seenMap.get(routeKey)!;
        if (walkValue !== null && (existing.walkMin === null || walkValue < existing.walkMin)) {
          existing.walkMin = walkValue;
        }
        return;
      }

      // 無路線名稱時（step 2 由 station/walkTime 補位），僅在「步行時間相同或未知」時才合併。
      // 圖紙寫 station="両国,両国" walkTime="1,6" 代表兩條不同動線（地鐵 1 分、JR 6 分），
      // 若無條件依站名折疊，會把第二條動線連同它的步行時間一起吞掉。
      if (!cleanLinePart) {
        const sameStation = items.filter(it => toJapaneseStationName(it.stationName) === normKey);
        if (sameStation.length) {
          // walkValue 為 null 只能併進「同樣沒有時間」的既有項。
          // 併進已有時間的項會讓那條動線消失：station="両国,両国,錦糸町"
          // walkTime="1,,8" 的第二個両国是未刊載時間的獨立動線，
          // 若併進第一個両国（1 分），錦糸町 就會往前位移吃到錯誤的時間。
          const mergeable = walkValue === null
            ? sameStation.find(it => it.walkMin === null)
            : sameStation.find(it => it.walkMin === null || it.walkMin === walkValue);
          if (mergeable) {
            if (walkValue !== null && (mergeable.walkMin === null || walkValue < mergeable.walkMin)) {
              mergeable.walkMin = walkValue;
            }
            return;
          }
          // 同站名但步行時間不同 → 視為另一條動線，繼續往下新增卡片。
        }
      }

      const newItem: ParsedStationItem = {
        stationName: station,
        lineName: mergedLine || officialLines,
        walkMin: walkValue,
        rawText: rawClause,
      };
      if (routeKey) {
        seenMap.set(routeKey, newItem);
      } else {
        seenMap.set(normKey, newItem);
      }
      items.push(newItem);
    };

    // 1. 若圖紙有抓出完整交通欄文字（transitAccess），優先精準切分行與子句
    if (transitAccess && transitAccess.trim()) {
      const normalized = transitAccess.normalize("NFKC");
      // 切分各車站條目：支援換行、分號、逗號，以及條目間的斜線或空格隔開的後續路線，支援項目符號
      const splitRegex = /(?:[\r\n；;]+|(?:、|(?<!\d)[,，](?!\d))|(?<=[分秒歩])\s*[／/]\s*|\s+[／/]\s*|(?<=[分秒])\s+(?=(?:[◎●◆■※・\s]*(?:JR|東京メトロ|都営|東急|京王|小田急|西武|東武|京急|京成|相鉄|つくば|ゆりかもめ|りんかい|[^\s／/「」駅]+(?:線|駅))))|[／/](?=\s*(?:JR|東京メトロ|都営|東急|京王|小田急|西武|東武|京急|京成|相鉄|つくば|ゆりかもめ|りんかい))|(?<=[分秒])\s*(?=[◎●◆■※]))/gu;
      const clauses = normalized
        .split(splitRegex)
        .map(s => s.trim())
        .filter(Boolean);

      // 路線／站名樣式一律取自 transitPatterns.ts，與 rentalListingReconciliation.ts 共用同一份定義。
      const lineRegex = new RegExp(`^${BULLET}${LINE_STATION_WALK}`, "u");
      const stationOnlyRegex = new RegExp(`^${BULLET}${STATION_WALK}`, "u");

      for (const clause of clauses) {
        // 句型 A：[路線名] [車站名] 徒歩[分鐘]分
        // 例："中央・総武線各停 両国 徒歩6分"、"都営大江戸線「両国」駅徒歩1分"、"西武池袋線 桜台(東京)駅 徒歩3分"
        const matchWithLine = clause.match(lineRegex);
        if (matchWithLine) {
          const linePart = matchWithLine[1];
          const station = matchWithLine[2];
          const walk = Number(matchWithLine[3]);
          registerStation(station, linePart, isNaN(walk) ? null : walk, clause);
          continue;
        }

        // 句型 B：[車站名] 徒歩[分鐘]分（無前置路線名）
        // 例："大塚駅 徒歩6分"、"両国 徒歩1分"、"[大山] 徒歩17分"
        const matchStationOnly = clause.match(stationOnlyRegex);
        if (matchStationOnly) {
          const station = matchStationOnly[1];
          const walk = Number(matchStationOnly[2]);
          // 「駅」字可選，因此必須擋掉バス停・コンビニ・小学校等非車站文字，
          // 否則生活機能距離會被誤登錄成交通動線。
          if (!isPlausibleStationToken(station)) continue;
          registerStation(station, null, isNaN(walk) ? null : walk, clause);
          continue;
        }
      }
    }

    // 2. 若缺少 transitAccess 或未完整，補足 station 與 walkTime
    if (stationStr) {
      const stations = stationStr.split(/[,，、]/).map(s => cleanStationName(s)).filter(Boolean);
      // walkTimes 刻意不 filter：空格代表「這條動線未刊載步行時間」，
      // 必須保留佔位才能與 stations 以 index 對齊。
      // 過濾掉空值會讓後續全部往前位移——實測 station="両国,両国,錦糸町"
      // walkTime="1,,8" 會把錦糸町的 8 分錯配給第二個両国。
      const walkTimes = (walkTimeStr || "").split(/[,，、]/).map(s => s.trim());

      for (let i = 0; i < stations.length; i++) {
        const station = stations[i];
        if (!station) continue;

        // 只刊一個時間卻有多站時（「両国,錦糸町 徒歩5分」），該時間套用到全部站；
        // 但若刊了多個時間，缺漏的那格就是「未刊載」，不可拿別站的時間頂替。
        const rawWalk = walkTimes[i] || (walkTimes.filter(Boolean).length === 1 ? walkTimes.find(Boolean) : null);
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
  const uniqueStationCount = new Set(validWalkStations.map(p => p.jp)).size || new Set(parsed.map(p => p.jp)).size;
  const totalStations = uniqueStationCount;
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
  } else if (allLines.length >= 2 && validWalkStations.some(p => p.walkMin !== null && p.walkMin <= 10)) {
    return {
      hasMajorTerminal: false,
      majorStation: null,
      majorWalkMinutes: null,
      totalStations,
      totalLinesCount: allLines.length,
      ratePercent: 2,
      note: `徒步圈可利用 ${allLines.join("・")} 等 ${allLines.length} 條鐵道路線，具備雙鐵路通勤動線優勢`,
    };
  }

  return null;
}
