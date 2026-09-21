import React from "react";
import type { CommuteRouteDetails, CommuteRouteSegment, RentRecommendation, RentSearchCriteria } from "../lib/rentAnalysis";
import { getLineColors, getStationCodeForLine, toJapaneseLineName, toJapanesePlaceName, toJapaneseStationName } from "../lib/transit";
import { graphStationCode } from "../lib/localTransitRoute";
import { hasThroughService, THROUGH_SERVICE_MAX_GAP_MINUTES } from "../lib/throughService";

/**
 * 「自宅」「目的地」「候車」「轉乘候車」是介面自己加的角色標籤，不是日本鐵道的專有名詞。
 * 它們被 buildDoorToDoorRoute 寫進 segment 的 departureStop / lineName 欄位只是為了共用同一種
 * 節點結構，若一併送進 toJapaneseLineName／toJapaneseStationName，OpenCC 的「中文→日文新字體」
 * 轉換會把「轉乘候車」變成日文漢字「転乗候車」——那既不是中文也不是日文，畫面上就出現混用。
 * 這裡先攔下這些標籤，讓它們維持繁體中文且不標 lang="ja"。
 */
const UI_LABELS = new Set(["自宅", "目的地", "候車", "轉乘候車", "公司", "巴士站", "轉乘", "直通"]);
const isUiLabel = (value: string) => UI_LABELS.has(value.trim());

/**
 * 文字被截斷時使用原生 HTML title 提示完整內容：
 * 1. 零 JS 開銷，絕不因滾動捕獲或子元素事件觸發閃現或消失。
 * 2. 游標維持標準指針，絕不出現困擾使用者的問號 cursor-help。
 */
const TruncatedText: React.FC<{
  text: string;
  japanese: boolean;
  className: string;
}> = ({ text, japanese, className }) => {
  const langProps = japanese ? ({ lang: "ja" } as const) : {};
  return (
    <span
      {...langProps}
      title={text}
      className={className}
    >
      {text}
    </span>
  );
};

const StationSign: React.FC<{
  name: string;
  number: string;
  color: string;
  type: CommuteRouteSegment["type"];
}> = ({ name, number, color, type }) => {
  const rawName = name.replace(/\(.*\)/, "").trim();
  // 角色標籤（自宅／目的地）維持中文，只有真正的車站名才做日文站名正規化。
  const uiLabel = isUiLabel(rawName);
  const cleanedName = uiLabel ? rawName : toJapaneseStationName(rawName);
  const isWalk = type === "walk" || uiLabel;

  return (
    <div className={`flex flex-col items-center shrink-0 text-center ${isWalk ? "w-5" : "w-10"} font-sans relative`}>
      <div className={`h-10 flex items-center justify-center shrink-0 ${isWalk ? "w-5" : "w-10"}`}>
        {isWalk ? (
          <div className="w-5 h-5 bg-white border-2 border-[#8A9590] flex items-center justify-center shrink-0">
            <div className="w-1.5 h-1.5 bg-[#8A9590]" />
          </div>
        ) : (
          <div
            className="w-10 h-10 p-0.5 border-2 bg-white flex items-center justify-center shrink-0"
            style={{ borderColor: color }}
          >
            {(() => {
              const [lineCode, stationCode] = (number || "").split(/(\d+)/).filter(Boolean);
              return (
                <div className="text-center leading-none">
                  <span className="block font-bold text-[#1A2A22] text-[0.65rem]">
                    {lineCode || ""}
                  </span>
                  <span className="block font-bold text-[#1A2A22] text-[0.95rem] tracking-[-0.05em]">
                    {stationCode || number || ""}
                  </span>
                </div>
              );
            })()}
          </div>
        )}
      </div>
      <div className="w-16 -mx-3 flex justify-center pointer-events-none">
        <TruncatedText
          text={cleanedName}
          japanese={!uiLabel}
          className={`${uiLabel ? "" : "font-jp "}mt-1 block max-w-[64px] truncate text-center text-xs ${isWalk ? "font-medium" : "font-bold"} text-[#3F5147] pointer-events-auto`}
        />
      </div>
    </div>
  );
};

const CommuteBadgeItem: React.FC<{
  badge: CommuteBadgeNode;
}> = ({ badge }) => {
  const hasWaitBreakdown =
    badge.waitMinutes != null &&
    badge.waitMinutes > 0 &&
    badge.waitMinutes < badge.durationMinutes;

  return (
    <div
      data-commute-badge
      className="flex shrink-0 flex-col items-center select-none"
      title={badge.detailTooltip || `${badge.label} ${badge.durationMinutes}分鐘`}
    >
      <div className="flex h-10 items-center justify-center">
        <div
          className="flex max-w-full items-center px-2 py-0.5 text-[11px] font-bold shadow-2xs"
          style={{ backgroundColor: badge.bgColor, color: badge.textColor }}
        >
          <TruncatedText
            text={badge.label}
            japanese={!badge.isUiLabel}
            className={`${badge.isUiLabel ? "" : "font-jp "}block max-w-full truncate whitespace-nowrap`}
          />
        </div>
      </div>
      <div className="mt-1 flex flex-col items-center text-center">
        <span className="text-xs font-mono font-medium text-[#66736C] whitespace-nowrap leading-tight">
          {badge.durationMinutes}分
        </span>
        {hasWaitBreakdown ? (
          <span className="mt-0.5 text-[10px] text-[#8A9590] whitespace-nowrap leading-tight">
            (候車{badge.waitMinutes}分)
          </span>
        ) : null}
        {/* 同線換車、直通等「看分鐘數看不出來」的資訊，貼在分鐘數正下方 */}
        {badge.note ? (
          <span
            data-commute-badge-note
            className="mt-0.5 text-[10px] text-[#8A9590] whitespace-nowrap leading-tight"
          >
            ({badge.note})
          </span>
        ) : null}
      </div>
    </div>
  );
};

/**
 * @param embedded 這張卡是否已經被外層區塊包住（物件健檢的通勤模組就是這種情形）。
 *   為 true 時做兩件事：
 *   1. 去掉自己的外框與底色，避免與外層形成框中框；
 *   2. 不再顯示「起訖站 ＋ 總時間 ＋ 轉乘次數」，因為外層摘要已經完整交代同一組數字。
 *   租屋行情列表是獨立卡片、沒有外層摘要，維持預設 false。
 *   資料來源徽章與出處連結不受影響——那是出處標示，任何情況都必須看得到。
 */
/**
 * 路線資料的出處分類。徽章要貼著它所修飾的那個數字，因此內嵌時由外層自行取用，
 * 不在路線圖上另外畫一顆。
 */
export function getCommuteSourceLabel(source: CommuteRouteDetails["source"]): string {
  return source === "local_gtfs"
    ? "本地標準班表"
    : source === "transitous"
    ? "標準班表"
    : source === "verified_cache"
      ? "已驗證快取"
      : source === "web_grounded"
        ? "網路交叉查證"
        : source === "ai_estimate"
          ? "AI 路線估算"
        : "標準路線參考";
}

const DASHED_LINE_GRADIENT = "repeating-linear-gradient(90deg, #94a3b8, #94a3b8 4px, transparent 4px, transparent 8px)";

interface CommuteStationNode {
  name: string;
  number: string;
  color: string;
  type: CommuteRouteSegment["type"];
}

interface CommuteBadgeNode {
  label: string;
  isUiLabel: boolean;
  durationMinutes: number;
  waitMinutes?: number;
  /**
   * 分鐘數下方括號裡的補充說明（例如同一條線換車時的「同線月台換車」）。
   * 只放判讀路線必要的一句話，長句請走 detailTooltip。
   */
  note?: string;
  detailTooltip?: string;
  bgColor: string;
  textColor: string;
}

export interface CommuteLegItem {
  /** 這一段的移動方式，用來判斷站間交界要畫成「轉乘」還是「候車」。 */
  type: CommuteRouteSegment["type"];
  /** 這一段的路線名（原始值），用來判斷同線換車。 */
  lineName: string;
  fromStation: CommuteStationNode;
  toStation: CommuteStationNode;
  badges: CommuteBadgeNode[];
  lineStyles: string[];
  transferAfter?: {
    badge: CommuteBadgeNode;
    lineStyle: string;
  };
}

/** 軌道運具。只有「軌道→軌道」才算轉乘，徒步或巴士接到車站都是上車前的候車。 */
const RAIL_TYPES = new Set<CommuteRouteSegment["type"]>(["train", "subway", "rail"]);
const isRailLeg = (type: CommuteRouteSegment["type"]) => RAIL_TYPES.has(type);

/**
 * 兩段行程是否屬於同一條路線。
 *
 * 圖資同一條線的名稱常有寫法差異（全半形空白、「JR 山手線」與「JR山手線」、
 * 中日漢字），先正規化再比，才不會把同線換車誤判成換線。
 */
function isSameLineName(lineA: string, lineB: string): boolean {
  if (!lineA || !lineB) return false;
  const normalize = (value: string) =>
    toJapaneseLineName(value.trim()).replace(/[\s　]/g, "");
  return normalize(lineA) === normalize(lineB);
}

function isSameStation(stopA: string, stopB: string): boolean {
  if (!stopA || !stopB) return false;
  if (stopA.trim() === stopB.trim()) return true;
  const normA = toJapaneseStationName(stopA.replace(/\(.*\)/, "").trim());
  const normB = toJapaneseStationName(stopB.replace(/\(.*\)/, "").trim());
  return normA === normB;
}

export function resolveStationCode(lineName: string, stationName: string, fallbackNumber?: string | null): string {
  if (fallbackNumber) return fallbackNumber;
  const direct = getStationCodeForLine(lineName, stationName);
  if (direct) return direct;
  const jpLine = toJapaneseLineName(lineName);
  const jpStation = toJapaneseStationName(stationName).replace(/駅$/, "");
  const compactJpLine = jpLine.replace(/\s+/g, "");
  const compactLine = lineName.replace(/\s+/g, "");

  return graphStationCode(jpLine, jpStation)
    || graphStationCode(compactJpLine, jpStation)
    || graphStationCode(lineName, jpStation)
    || graphStationCode(compactLine, jpStation)
    || graphStationCode(jpLine, stationName)
    || graphStationCode(compactJpLine, stationName)
    || graphStationCode(lineName, stationName)
    || graphStationCode(compactLine, stationName)
    || "";
}

/**
 * 選取兩段行程交界處的站牌節點（非同站鐵道轉乘時）：
 * 1. 若當前段為鐵道到達站，下一段為徒步前往目的地，必須保留鐵道車站圖標與代表色（如早稲田站 T 04 東西線藍），
 *    絕不被徒步段的灰色小方塊覆蓋。
 * 2. 若前一段為徒步（如自宅出發），下一段為鐵道出發站，採用鐵道車站圖標（如都立大學 TY 06）。
 */
export function pickStationNode(toStation: CommuteStationNode, nextFromStation?: CommuteStationNode): CommuteStationNode {
  if (!nextFromStation) return toStation;
  if (nextFromStation.type === "walk" && toStation.type !== "walk") {
    return toStation;
  }
  if (toStation.type === "walk" && nextFromStation.type !== "walk") {
    return nextFromStation;
  }
  if (nextFromStation.number) return nextFromStation;
  if (toStation.number) return toStation;
  return nextFromStation;
}

/**
 * 將原始 segments 依站到站的「路段 Leg」重組：
 * 1. 同站站內活動（轉乘徒步、候車）：
 *    - 當前線與次線在同站轉乘時（例如東急東橫線抵達澀谷，轉乘山手線）：
 *      打包為前線的 transferAfter 轉乘過渡（包含轉乘虛線與轉乘標籤）。
 *      渲染時呈現：【東橫線澀谷 TY01】── 虛線 ──【轉乘 3分 (候車1分)】── 虛線 ──【山手線澀谷 JY20】。
 *      轉乘標籤在山手線澀谷的前方，完美符合乘客轉乘心理模型與視覺邏輯。
 * 2. 區間內的所有線條（前置活動虛線、搭乘實線）均設定為等比例 flex-1，確保所有卡片與標籤間線段完全等長。
 */
export function buildCommuteLegs(segments: CommuteRouteSegment[]): CommuteLegItem[] {
  const legs: CommuteLegItem[] = [];
  let pendingPreActivities: CommuteRouteSegment[] = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const isSameStationActivity =
      seg.type === "wait" ||
      (seg.type === "walk" && isSameStation(seg.departureStop, seg.arrivalStop));

    // 站內活動（同站轉乘徒步、月台候車）暫存
    if (isSameStationActivity) {
      pendingPreActivities.push(seg);
      continue;
    }

    // 地點間實質移動段（A -> B）
    const isWalk = seg.type === "walk";
    const lineColors = isWalk
      ? { color: "#8A9590", textColor: "#FFFFFF" }
      : getLineColors(seg.lineName, seg.lineColor);

    const fromStationCode = resolveStationCode(seg.lineName, seg.departureStop, seg.startStationNumber);
    const toStationCode = resolveStationCode(seg.lineName, seg.arrivalStop, seg.endStationNumber);

    const currentLegFromStation: CommuteStationNode = {
      name: seg.departureStop,
      number: fromStationCode,
      color: lineColors.color,
      type: seg.type,
    };

    const currentLegToStation: CommuteStationNode = {
      name: seg.arrivalStop,
      number: toStationCode,
      color: lineColors.color,
      type: seg.type,
    };

    // 處理前一段與當前段之間的活動（pendingPreActivities）
    let initialWaitBadge: CommuteBadgeNode | null = null;

    if (pendingPreActivities.length > 0) {
      const totalMinutes = pendingPreActivities.reduce((sum, p) => sum + p.durationMinutes, 0);
      const walkMinutes = pendingPreActivities
        .filter(p => p.type === "walk")
        .reduce((sum, p) => sum + p.durationMinutes, 0);
      const waitMinutes = pendingPreActivities
        .filter(p => p.type === "wait")
        .reduce((sum, p) => sum + p.durationMinutes, 0);

      // 真正的「轉乘」必須是軌道換軌道：前一段是搭車、這一段也是搭車，且在同一個車站。
      // 從自宅徒步到車站之後的那段等待是「上車前候車」，不是轉乘——把它畫成轉乘會讓
      // 同一個車站在圖上出現兩次（灰色方塊的都立大学 ── 轉乘 ── TY06 都立大学）。
      const prevLeg = legs.length > 0 ? legs[legs.length - 1] : null;
      const isRailToRailTransfer =
        prevLeg != null &&
        isRailLeg(prevLeg.type) &&
        isRailLeg(seg.type) &&
        isSameStation(prevLeg.toStation.name, seg.departureStop);

      if (prevLeg && isRailToRailTransfer) {
        // 同一條路線在同一站換車（例如東橫線各停換同線急行）：對乘客而言是換月台／換車，
        // 不講清楚就會變成「都立大学轉乘都立大学」這種看不懂的呈現。
        const isSameLineChange = isSameLineName(prevLeg.lineName, seg.lineName);
        // 直通運轉（如東橫線直通副都心線）：同一台車繼續開，不必下車換月台。
        // 只有銜接等待夠短才這樣標，避免把「等下一班直通車」說成無縫直通。
        const isThrough =
          !isSameLineChange &&
          hasThroughService(prevLeg.lineName, seg.lineName) &&
          totalMinutes <= THROUGH_SERVICE_MAX_GAP_MINUTES;
        let detailTooltip = "";
        if (walkMinutes > 0 && waitMinutes > 0) {
          detailTooltip = `站內步行 ${walkMinutes} 分 ＋ 月台候車 ${waitMinutes} 分`;
        } else if (walkMinutes > 0) {
          detailTooltip = `站內轉乘步行 ${walkMinutes} 分`;
        } else if (waitMinutes > 0) {
          detailTooltip = `月台候車 ${waitMinutes} 分`;
        }
        if (isSameLineChange) {
          const lineLabel = isUiLabel(seg.lineName) ? seg.lineName.trim() : toJapaneseLineName(seg.lineName);
          detailTooltip = `同一條路線（${lineLabel}）在本站換車${detailTooltip ? `：${detailTooltip}` : ""}`;
        } else if (isThrough) {
          const fromLine = toJapaneseLineName(prevLeg.lineName);
          const toLine = toJapaneseLineName(seg.lineName);
          detailTooltip = `${fromLine} 直通 ${toLine}，通常不必下車換月台（實際是否直通仍以當班車種為準）`;
        }

        prevLeg.transferAfter = {
          badge: {
            label: isThrough ? "直通" : "轉乘",
            isUiLabel: true,
            durationMinutes: totalMinutes,
            waitMinutes: !isThrough && waitMinutes > 0 ? waitMinutes : undefined,
            // 「不需下車」講的是使用者真正在意的事（要不要扛行李換月台），
            // 比只寫「同車直通」這個日文味的詞更快被理解。
            note: isSameLineChange ? "同線換車" : isThrough ? "不需下車" : undefined,
            detailTooltip: detailTooltip || undefined,
            // 直通不是障礙，用主題綠與轉乘的灰色區隔，掃一眼就知道這裡不必換車
            bgColor: isThrough ? "#00A174" : "#8A9590",
            textColor: "#FFFFFF",
          },
          lineStyle: DASHED_LINE_GRADIENT,
        };
      } else {
        initialWaitBadge = {
          label: "候車",
          isUiLabel: true,
          durationMinutes: totalMinutes,
          waitMinutes: waitMinutes > 0 ? waitMinutes : undefined,
          detailTooltip: `起站月台候車 ${totalMinutes} 分`,
          bgColor: "#8A9590",
          textColor: "#FFFFFF",
        };
      }
      pendingPreActivities = [];
    }

    const badges: CommuteBadgeNode[] = [];
    const lineStyles: string[] = [];

    if (initialWaitBadge) {
      badges.push(initialWaitBadge);
      lineStyles.push(DASHED_LINE_GRADIENT);
    }

    const isUi = isUiLabel(seg.lineName);
    const mainLabel = isUi ? seg.lineName.trim() : toJapaneseLineName(seg.lineName);
    badges.push({
      label: mainLabel,
      isUiLabel: isUi,
      durationMinutes: seg.durationMinutes,
      bgColor: lineColors.color,
      textColor: lineColors.textColor,
    });

    if (isWalk) {
      lineStyles.push(DASHED_LINE_GRADIENT);
      lineStyles.push(DASHED_LINE_GRADIENT);
    } else {
      if (badges.length > 1) {
        lineStyles.push(DASHED_LINE_GRADIENT);
        lineStyles.push(lineColors.color);
      } else {
        lineStyles.push(lineColors.color);
        lineStyles.push(lineColors.color);
      }
    }

    legs.push({
      type: seg.type,
      lineName: seg.lineName,
      fromStation: currentLegFromStation,
      toStation: currentLegToStation,
      badges,
      lineStyles,
    });
  }

  // 防禦性處理末尾殘留之站內活動
  if (pendingPreActivities.length > 0 && legs.length > 0) {
    const lastLeg = legs[legs.length - 1];
    const totalMinutes = pendingPreActivities.reduce((sum, p) => sum + p.durationMinutes, 0);
    lastLeg.transferAfter = {
      badge: {
        label: "轉乘",
        isUiLabel: true,
        durationMinutes: totalMinutes,
        bgColor: "#8A9590",
        textColor: "#FFFFFF",
      },
      lineStyle: DASHED_LINE_GRADIENT,
    };
  }

  return legs;
}

export function CommuteRouteCard({ route, embedded = false }: { route: CommuteRouteDetails; embedded?: boolean }) {
  const sourceBadge = getCommuteSourceLabel(route.source);
  const legs = React.useMemo(() => buildCommuteLegs(route.segments), [route.segments]);

  // 將全路線的所有站牌節點、連接線段與標籤節點扁平化為同一層 flex 項目，
  // 讓全路線的所有線段共用完全相同的 flex-1 伸展權重，
  // 達成「方形卡片與標籤之間的線段完全平均等長、左右長度一致、無長短不均」之要求。
  const timelineItems = React.useMemo(() => {
    type TimelineItem =
      | {
          key: string;
          type: "station";
          station: CommuteStationNode;
        }
      | {
          key: string;
          type: "badge";
          badge: CommuteBadgeNode;
        }
      | {
          key: string;
          type: "line";
          lineStyle: string;
        };

    const items: TimelineItem[] = [];
    if (legs.length === 0) return items;

    // 起始車站
    items.push({
      key: "station-0",
      type: "station",
      station: legs[0].fromStation,
    });

    legs.forEach((leg, legIdx) => {
      const isLastLeg = legIdx === legs.length - 1;
      const nextLeg = legs[legIdx + 1];

      leg.badges.forEach((badge, badgeIdx) => {
        // 標籤前方連接線
        items.push({
          key: `line-${legIdx}-${badgeIdx}-before`,
          type: "line",
          lineStyle: leg.lineStyles[badgeIdx],
        });
        // 標籤本體
        items.push({
          key: `badge-${legIdx}-${badgeIdx}`,
          type: "badge",
          badge,
        });
      });

      // 該 Leg 最後一段通往目標車站之連接線
      items.push({
        key: `line-${legIdx}-final`,
        type: "line",
        lineStyle: leg.lineStyles[leg.badges.length],
      });

      // 如果有轉乘過渡（Transfer Transition）：
      // 依序呈現：前線到達站 (TY01 渋谷) ── 轉乘標籤 (轉乘 3分) ── 後線起發站 (JY20 渋谷)
      if (leg.transferAfter && nextLeg) {
        items.push({
          key: `station-${legIdx}-arrival`,
          type: "station",
          station: leg.toStation,
        });
        items.push({
          key: `line-${legIdx}-transfer-before`,
          type: "line",
          lineStyle: leg.transferAfter.lineStyle,
        });
        items.push({
          key: `badge-${legIdx}-transfer`,
          type: "badge",
          badge: leg.transferAfter.badge,
        });
        items.push({
          key: `line-${legIdx}-transfer-after`,
          type: "line",
          lineStyle: leg.transferAfter.lineStyle,
        });
        items.push({
          key: `station-${legIdx + 1}-departure`,
          type: "station",
          station: nextLeg.fromStation,
        });
      } else {
        const stationNode = isLastLeg ? leg.toStation : pickStationNode(leg.toStation, nextLeg?.fromStation);
        items.push({
          key: `station-${legIdx + 1}`,
          type: "station",
          station: stationNode,
        });
      }
    });

    return items;
  }, [legs]);

  return (
    <div className={embedded ? "w-full font-sans" : "w-full bg-[#FAFCFB] p-3.5 sm:p-5 border border-[#DDE3DF] font-sans"}>
      {/* 標題用 p 而非 h3：index.css 的 h1-h6[lang="ja"] 是無層規則，
          特異性高於 Tailwind utilities 層的 .font-jp，會把這行強制拉成思源明體 JP。
          這裡是介面數據不是閱讀標題，應維持全站內文黑體。 */}
      {/* 內嵌時整個標題列都不畫：起訖站由外層顯示，資料來源徽章則交給外層貼在總時間旁邊，
          徽章要緊鄰它所修飾的那個數字才有意義。 */}
      {!embedded && (
        <div className="mb-1 flex items-start justify-between gap-3">
          <p lang="ja" className="font-jp text-sm sm:text-base font-bold text-[#1A2A22]">
            {toJapaneseStationName(route.originStation)} → {toJapaneseStationName(route.destinationStation)}
          </p>
          <span className="shrink-0 border border-[#9EE2CF] bg-[#E6F6F1] px-2 py-0.5 text-[10px] font-bold text-[#00A174]">{sourceBadge}</span>
        </div>
      )}
      {!embedded && (
        <div className="mb-4 flex items-center space-x-5 text-xs text-[#3F5147]">
          <span>
            總時間：<strong className="text-sm text-[#00A174]">{route.totalDurationMinutes} 分鐘</strong>
          </span>
          <span>
            轉乘次數：<strong className="text-sm text-[#00A174]">{route.transfers} 次</strong>
          </span>
        </div>
      )}

      {/* Track visual container without visible scrollbar & responsive layout.
          支援水平滑動，維持左右滿版（w-full + justify-between），
          全線所有連接線段皆設為同等 flex-1，確保所有方格卡片與標籤之間線段長度完全一致、無長短不均。 */}
      <div
        data-commute-scroll
        className="w-full overflow-x-auto overscroll-x-contain touch-pan-x pb-1 [scrollbar-color:#C9D2CD_transparent] [scrollbar-width:thin]"
        aria-label="通勤路線圖，可左右滑動查看完整路線"
        tabIndex={0}
      >
        <div className="flex items-start w-full min-w-max sm:min-w-0 justify-between py-2">
          {timelineItems.map((item) => {
            if (item.type === "station") {
              return (
                <StationSign
                  key={item.key}
                  name={item.station.name}
                  number={item.station.number}
                  color={item.station.color}
                  type={item.station.type}
                />
              );
            }

            if (item.type === "badge") {
              return (
                <CommuteBadgeItem key={item.key} badge={item.badge} />
              );
            }

            // item.type === "line": 全線每一段線條均等伸展
            return (
              <div
                key={item.key}
                data-commute-line
                className="flex flex-1 min-w-[16px] sm:min-w-[20px] flex-col items-center"
              >
                <div className="flex h-10 w-full items-center justify-center">
                  <div
                    className="w-full h-[2px] pointer-events-none"
                    style={{ background: item.lineStyle }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 註腳：內嵌時只用一條上分隔線收尾，不再加第三層外框。
          內嵌又沒有出處連結時整塊都不畫，免得留下一條沒有內容的分隔線。 */}
      {(!embedded || route.sourceLinks?.length) ? (
        <div className={embedded
          ? "mt-3 border-t border-[#DDE3DF] pt-2.5"
          : "mt-4 border border-[#DDE3DF] border-l-4 border-l-[#00A174] bg-white p-3"}>
          {/* 這句也是在覆述轉乘次數，上層已有摘要時一併收掉，只留資料來源與出處連結。 */}
          {!embedded && (
            <p className="text-xs text-[#3F5147]">
              {route.transfers === 0
                ? "最快且最方便的直達路線，無需轉乘。"
                : `建議路線需轉乘 ${route.transfers} 次。`}
            </p>
          )}
          {/* 內嵌時資料來源已由外層貼在總時間旁，這裡不再覆述一次。 */}
          {!embedded && <p className="mt-1.5 text-[10px] text-[#66736C]">{route.referenceLabel}</p>}
          {route.sourceLinks?.length ? (
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
              {route.sourceLinks.slice(0, 3).map(source => (
                <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="text-[10px] text-[#00A174] underline underline-offset-2">
                  {source.title}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function CommuteRouteSkeleton({ item, criteria }: { item: RentRecommendation; criteria: RentSearchCriteria }) {
  if (!criteria.commuteStation) return null;

  // 情況 A：無指定車站（全區平均行情推薦）
  if (!item.station) {
    return (
      <section className="border border-[#DDE3DF] bg-white p-4 font-sans">
        <div className="flex items-center justify-between border-b border-[#ECEFEC] pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center border border-[#9EE2CF] bg-[#E6F6F1] text-[10px] font-bold text-[#00A174]">
              区
            </div>
            <span className="text-xs font-bold text-[#1A2A22]">
              {toJapanesePlaceName(item.district)}・全區平均行情總覽
            </span>
          </div>
          <span className="border border-[#D6EAF0] bg-[#F2F8FA] px-2 py-0.5 text-[10px] font-bold text-[#3F626D]">
            全區參考
          </span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-[#66736C]">
          本推薦為【{toJapanesePlaceName(item.district)}】行政區整體租金與條件評估。確定物件鄰近之具體車站生活圈後，系統即可為您規劃前往【{toJapaneseStationName(criteria.commuteStation)}】之詳細電車乘車班表與轉乘路徑。
        </p>
      </section>
    );
  }

  // 情況 B：有車站但暫未取得班表快取
  return (
    <section className="border border-[#DDE3DF] bg-white p-4 font-sans">
      <div className="flex items-center justify-between border-b border-[#ECEFEC] pb-2">
        <p lang="ja" className="font-jp text-xs font-bold text-[#1A2A22]">
          {toJapaneseStationName(item.station)}站 → {toJapaneseStationName(criteria.commuteStation)}站
        </p>
        <span className="border border-[#DDE3DF] bg-[#F5F8F6] px-2 py-0.5 text-[10px] font-bold text-[#8A9590]">
          路線待確認
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-[#66736C]">
        目前未取得可引用的標準大眾運輸班表資料。建議可至乘換案內查詢【{toJapaneseStationName(item.station)}】前往【{toJapaneseStationName(criteria.commuteStation)}】之即時車次，或嘗試調整至鄰近的主要樞紐車站。
      </p>
    </section>
  );
}
