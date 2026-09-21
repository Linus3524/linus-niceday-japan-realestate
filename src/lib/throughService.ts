import { toJapaneseLineName, toJapaneseStationName } from "./transit.js";
import type { CommuteRouteDetails, CommuteRouteSegment } from "./rentAnalysis.js";

/**
 * 直通運轉（相互直通運転）。
 *
 * 日本首都圈大量路線在事業者邊界不換車：東急東横線的電車開到渋谷之後，
 * 直接變成東京メトロ副都心線繼續往北，乘客全程坐在同一台車上。
 *
 * 路線搜尋是在「車站圖」上找路徑，它只看得到「渋谷這一站同時有東横線與副都心線」，
 * 於是把這種銜接算成一次轉乘，畫面上就出現「渋谷下車 ── 轉乘 3 分 ── 渋谷上車」。
 * 對使用者而言那是不存在的轉乘，看到會以為要扛行李換月台。
 *
 * ## 為什麼用清單，而不是從圖資判斷
 *
 * 最理想的做法是看 GTFS 的 trip_id：同一班車必然同一個 trip。但建圖階段
 * （scripts/build-tokyo-transit.mjs）是以 `(from, to, route)` 聚合邊、把整個平日時刻
 * 壓成 schedule 陣列的，trip_id 在那一步就被丟掉了，圖資裡沒有任何欄位能還原
 * 「這兩段是不是同一班車」。headsign 也不行——它是聚合後的代表值，
 * 東横線各停與 Fライナー 共用同一條邊時只會留下其中一個。
 *
 * 因此這裡採用「已知直通線對」的白名單。直通關係是鐵道公司的長期營運協議，
 * 變動以年為單位（且每次變動都是新聞），用靜態表描述是合適的；
 * 而且白名單只會「少標」不會「錯標」——沒收錄的線對維持現狀顯示為轉乘，
 * 不會無中生有地把真的要換車的地方畫成直通。
 *
 * ## 界線：標示直通 ≠ 一定不用換車
 *
 * 即使兩條線有直通關係，也不是每一班車都直通（例如東横線有大量電車在渋谷折返）。
 * 所以 UI 只在「同一站、且銜接等待很短」時標示「可直通」，並且仍然把它算成一次
 * 路線變更；我們聲稱的是「這裡通常有直通車，不必出站」，而不是「你這班一定不用下車」。
 */

/** 直通線對。以日文正規化後的線名比對，順序無關（雙向直通）。 */
const THROUGH_SERVICE_PAIRS: ReadonlyArray<readonly [string, string]> = [
  // 東急東横線・みなとみらい線 ←→ 東京メトロ副都心線 ←→ 東武東上線／西武有楽町線
  ["東急東横線", "東京メトロ副都心線"],
  ["東京メトロ副都心線", "東武東上線"],
  ["東京メトロ副都心線", "西武有楽町線"],
  ["東京メトロ有楽町線", "東武東上線"],
  ["東京メトロ有楽町線", "西武有楽町線"],
  // 東急目黒線 ←→ 東京メトロ南北線／都営三田線 ←→ 埼玉高速鉄道線
  ["東急目黒線", "東京メトロ南北線"],
  ["東急目黒線", "都営三田線"],
  ["東京メトロ南北線", "埼玉高速鉄道線"],
  // 東急田園都市線 ←→ 東京メトロ半蔵門線 ←→ 東武伊勢崎線
  ["東急田園都市線", "東京メトロ半蔵門線"],
  ["東京メトロ半蔵門線", "東武伊勢崎線"],
  // 東京メトロ日比谷線 ←→ 東武伊勢崎線
  ["東京メトロ日比谷線", "東武伊勢崎線"],
  // 東京メトロ千代田線 ←→ 小田急小田原線／JR常磐緩行線
  ["東京メトロ千代田線", "小田急小田原線"],
  ["東京メトロ千代田線", "小田急多摩線"],
  ["東京メトロ千代田線", "JR常磐線"],
  // 東京メトロ東西線 ←→ 東葉高速線／JR中央・総武線
  ["東京メトロ東西線", "東葉高速線"],
  ["東京メトロ東西線", "JR中央・総武線"],
  // 都営浅草線 ←→ 京急本線／京成線
  ["都営浅草線", "京急本線"],
  ["都営浅草線", "京成押上線"],
  ["都営浅草線", "京成本線"],
  ["京急本線", "京急空港線"],
  ["京成押上線", "京成本線"],
  ["京成本線", "京成成田スカイアクセス線"],
  // 都営新宿線 ←→ 京王線／京王新線
  ["都営新宿線", "京王新線"],
  ["都営新宿線", "京王線"],
  ["京王線", "京王相模原線"],
  // 相鉄・東急／JR直通
  ["相鉄本線", "相鉄新横浜線"],
  ["相鉄新横浜線", "東急新横浜線"],
  ["東急新横浜線", "東急目黒線"],
  ["東急新横浜線", "東急東横線"],
  ["相鉄新横浜線", "JR相鉄直通線"],
  ["相鉄いずみ野線", "相鉄新横浜線"],
];

const normalizeLine = (value: string) =>
  toJapaneseLineName((value || "").trim()).replace(/[\s　]/g, "");

const THROUGH_SERVICE_KEYS: ReadonlySet<string> = new Set(
  THROUGH_SERVICE_PAIRS.flatMap(([a, b]) => {
    const left = normalizeLine(a);
    const right = normalizeLine(b);
    // 雙向都收，查詢時就不必再排序
    return [`${left}\u0000${right}`, `${right}\u0000${left}`];
  })
);

/**
 * 兩條路線之間是否存在相互直通運轉。
 *
 * 同一條線傳兩次會回傳 false：那是「同線換車」，由呼叫端另行處理，
 * 語意上不該和跨線直通混為一談。
 */
export function hasThroughService(lineA: string, lineB: string): boolean {
  const left = normalizeLine(lineA);
  const right = normalizeLine(lineB);
  if (!left || !right || left === right) return false;
  return THROUGH_SERVICE_KEYS.has(`${left}\u0000${right}`);
}

/**
 * 銜接等待多久以內，才願意在畫面上標示「可直通」。
 *
 * 直通車不需要下車，所以理想值是 0；但圖資的時刻是各邊獨立聚合的平均值，
 * 同一班車的前後兩段仍可能算出 1～3 分鐘的假空檔。放寬到 4 分鐘可以涵蓋這種
 * 誤差，又不至於把「等下一班直通車」的真實等待誤標成無縫直通。
 */
export const THROUGH_SERVICE_MAX_GAP_MINUTES = 4;

/** 軌道運具。只有「軌道→軌道」的銜接才可能是直通，徒步或巴士接上車站都不是。 */
const RAIL_SEGMENT_TYPES = new Set<CommuteRouteSegment["type"]>(["train", "subway", "rail"]);

const isRailSegment = (type: CommuteRouteSegment["type"]) => RAIL_SEGMENT_TYPES.has(type);

const isSameStationName = (stopA: string, stopB: string): boolean => {
  if (!stopA || !stopB) return false;
  if (stopA.trim() === stopB.trim()) return true;
  return (
    toJapaneseStationName(stopA.replace(/\(.*\)/, "").trim()) ===
    toJapaneseStationName(stopB.replace(/\(.*\)/, "").trim())
  );
};

/**
 * 一條路線裡有幾處銜接「通常不必下車」（直通運轉）。
 *
 * 這個函式是直通判斷的單一真相來源：路線圖上的「直通」徽章與推薦卡上的
 * 「含 N 次直通」標記都呼叫它。兩邊若各自實作，遲早會出現卡片說有直通、
 * 圖上卻畫成轉乘的矛盾——那比完全不標示更傷害信任。
 *
 * 判斷條件與路線圖一致：前後都是軌道、在同一站、兩線之間有直通關係，
 * 且銜接等待不超過 THROUGH_SERVICE_MAX_GAP_MINUTES。
 */
export function countThroughConnections(route: Pick<CommuteRouteDetails, "segments">): number {
  const segments = route?.segments;
  if (!Array.isArray(segments) || segments.length === 0) return 0;

  let count = 0;
  let prevRail: CommuteRouteSegment | null = null;
  // 前一段軌道之後累積的站內活動（候車、站內徒步）時間
  let gapMinutes = 0;

  for (const seg of segments) {
    if (isRailSegment(seg.type)) {
      if (
        prevRail &&
        isSameStationName(prevRail.arrivalStop, seg.departureStop) &&
        hasThroughService(prevRail.lineName, seg.lineName) &&
        gapMinutes <= THROUGH_SERVICE_MAX_GAP_MINUTES
      ) {
        count += 1;
      }
      prevRail = seg;
      gapMinutes = 0;
      continue;
    }

    if (seg.type === "wait" || (seg.type === "walk" && isSameStationName(seg.departureStop, seg.arrivalStop))) {
      // 站內活動：仍在同一個車站裡，直通的可能性還在，只是要累計等待時間
      gapMinutes += Math.max(0, Number(seg.durationMinutes) || 0);
      continue;
    }

    // 真正離開車站（徒步到別處、搭巴士）就不可能是直通了
    prevRail = null;
    gapMinutes = 0;
  }

  return count;
}
