import React from "react";
import type { CommuteRouteDetails, CommuteRouteSegment, RentRecommendation, RentSearchCriteria } from "../lib/rentAnalysis";
import { getLineColors, getStationCodeForLine, toJapaneseLineName, toJapaneseStationName } from "../lib/transit";
import { graphStationCode } from "../lib/localTransitRoute";

/**
 * 「自宅」「目的地」「候車」「轉乘候車」是介面自己加的角色標籤，不是日本鐵道的專有名詞。
 * 它們被 buildDoorToDoorRoute 寫進 segment 的 departureStop / lineName 欄位只是為了共用同一種
 * 節點結構，若一併送進 toJapaneseLineName／toJapaneseStationName，OpenCC 的「中文→日文新字體」
 * 轉換會把「轉乘候車」變成日文漢字「転乗候車」——那既不是中文也不是日文，畫面上就出現混用。
 * 這裡先攔下這些標籤，讓它們維持繁體中文且不標 lang="ja"。
 */
const UI_LABELS = new Set(["自宅", "目的地", "候車", "轉乘候車", "公司", "巴士站", "轉乘"]);
const isUiLabel = (value: string) => UI_LABELS.has(value.trim());

/**
 * 只有真的被 CSS 截斷（出現 …）的文字才掛提示。
 * 沒截斷還彈一個內容一模一樣的小框，只會擋住旁邊的路線圖。
 */
function useTruncationHint<T extends HTMLElement>(text: string) {
  const ref = React.useRef<T | null>(null);
  const [truncated, setTruncated] = React.useState(false);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;
    // 字型載入（Noto Sans JP 有幾百 KB）會改變文字寬度，要等字型就緒再量一次，
    // 否則以系統字型量到的寬度可能剛好沒溢出，提示就永遠不會出現。
    const measure = () => setTruncated(element.scrollWidth > element.clientWidth + 1);
    measure();
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    fonts?.ready.then(measure).catch(() => {});
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [text]);

  return { ref, truncated };
}

/**
 * 被截斷的文字（線路名、站名）的完整內容。
 * hover 與鍵盤 focus 都會顯示，觸控裝置沒有 hover，因此也接受點擊切換。
 *
 * 提示用 position: fixed 依實際螢幕座標繪製，不是相對節點的 absolute：
 * 路線圖的軌道是 overflow-x-auto，而 CSS 規定 overflow-x 一旦不是 visible，
 * overflow-y 的 visible 就會被計算成 auto——往上彈的提示會被容器上緣裁掉。
 */
const TruncatedText: React.FC<{
  text: string;
  japanese: boolean;
  className: string;
}> = ({ text, japanese, className }) => {
  const { ref, truncated } = useTruncationHint<HTMLSpanElement>(text);
  const [tip, setTip] = React.useState<{ left: number; top: number } | null>(null);
  const langProps = japanese ? ({ lang: "ja" } as const) : {};

  const show = React.useCallback(() => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) setTip({ left: rect.left + rect.width / 2, top: rect.top });
  }, [ref]);
  const hide = React.useCallback(() => setTip(null), []);

  // 固定定位的提示不會跟著頁面捲動，捲動時直接收起比讓它飄在錯的位置好。
  React.useEffect(() => {
    if (!tip) return;
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, [tip, hide]);

  if (!truncated) {
    return <span {...langProps} ref={ref} className={className}>{text}</span>;
  }

  return (
    <span
      className="inline-flex max-w-full cursor-help"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onClick={event => {
        // 節點位在可橫向捲動的軌道裡，點擊只切換提示，不讓外層誤判成拖曳或選取。
        event.stopPropagation();
        if (tip) hide();
        else show();
      }}
      onKeyDown={event => {
        if (event.key === "Escape") hide();
      }}
      tabIndex={0}
      role="button"
      aria-label={text}
    >
      <span {...langProps} ref={ref} className={className}>{text}</span>
      {tip && (
        <span
          {...langProps}
          role="tooltip"
          className="pointer-events-none fixed z-50 w-max max-w-[12rem] -translate-x-1/2 -translate-y-full whitespace-normal break-words border border-[#3F5147] bg-[#1A2A22] px-2 py-1 text-[11px] font-medium leading-snug text-white shadow-colored-soft"
          style={{ left: tip.left, top: tip.top - 6 }}
        >
          {text}
        </span>
      )}
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
  const [tip, setTip] = React.useState<{ left: number; top: number } | null>(null);
  const ref = React.useRef<HTMLDivElement | null>(null);

  const show = React.useCallback(() => {
    if (!badge.detailTooltip) return;
    const rect = ref.current?.getBoundingClientRect();
    if (rect) setTip({ left: rect.left + rect.width / 2, top: rect.top });
  }, [badge.detailTooltip]);

  const hide = React.useCallback(() => setTip(null), []);

  React.useEffect(() => {
    if (!tip) return;
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, [tip, hide]);

  return (
    <div
      ref={ref}
      data-commute-badge
      className={`flex shrink-0 flex-col items-center ${badge.detailTooltip ? "cursor-help group" : ""}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onClick={event => {
        if (!badge.detailTooltip) return;
        event.stopPropagation();
        const rect = ref.current?.getBoundingClientRect();
        if (rect) {
          setTip(prev => prev ? null : { left: rect.left + rect.width / 2, top: rect.top });
        }
      }}
      onKeyDown={event => {
        if (event.key === "Escape") hide();
      }}
      tabIndex={badge.detailTooltip ? 0 : undefined}
      role={badge.detailTooltip ? "button" : undefined}
      aria-label={badge.detailTooltip || `${badge.label} ${badge.durationMinutes}分鐘`}
    >
      <div className="flex h-10 items-center justify-center">
        <div
          className={`flex max-w-full items-center px-2 py-0.5 text-[11px] font-bold shadow-2xs ${badge.detailTooltip ? "group-hover:opacity-90 transition-opacity" : ""}`}
          style={{ backgroundColor: badge.bgColor, color: badge.textColor }}
        >
          <TruncatedText
            text={badge.label}
            japanese={!badge.isUiLabel}
            className={`${badge.isUiLabel ? "" : "font-jp "}block max-w-full truncate whitespace-nowrap`}
          />
        </div>
      </div>
      <div className="mt-1 text-xs font-mono font-medium text-[#66736C] text-center whitespace-nowrap">
        {badge.durationMinutes}分
      </div>
      {tip && badge.detailTooltip && (
        <span
          role="tooltip"
          className="pointer-events-none fixed z-50 w-max max-w-[14rem] -translate-x-1/2 -translate-y-full whitespace-normal break-words border border-[#3F5147] bg-[#1A2A22] px-2.5 py-1 text-[11px] font-medium leading-snug text-white shadow-colored-soft"
          style={{ left: tip.left, top: tip.top - 6 }}
        >
          {badge.detailTooltip}
        </span>
      )}
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
  detailTooltip?: string;
  bgColor: string;
  textColor: string;
}

interface CommuteLegItem {
  fromStation: CommuteStationNode;
  toStation: CommuteStationNode;
  badges: CommuteBadgeNode[];
  lineStyles: string[];
}

function isSameStation(stopA: string, stopB: string): boolean {
  if (!stopA || !stopB) return false;
  if (stopA.trim() === stopB.trim()) return true;
  const normA = toJapaneseStationName(stopA.replace(/\(.*\)/, "").trim());
  const normB = toJapaneseStationName(stopB.replace(/\(.*\)/, "").trim());
  return normA === normB;
}

function resolveStationCode(lineName: string, stationName: string, fallbackNumber?: string | null): string {
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
 * 選取兩段行程交界處的站牌節點：
 * 1. 若當前段為鐵道到達站，下一段為徒步前往目的地，必須保留鐵道車站圖標與代表色（如早稲田站 T 04 東西線藍），
 *    絕不被徒步段的灰色小方塊覆蓋。
 * 2. 若前一段為徒步（如自宅出發），下一段為鐵道出發站，採用鐵道車站圖標（如都立大學 TY 06）。
 * 3. 若為轉乘（東急 → JR 山手線），優先採用將搭乘路線之車站資訊（JY 20 渋谷），若無站號則退回到達站。
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
 * 1. 同站站內活動（如同站轉乘步行、候車段）均作為出發站的前置標籤，直接接在轉乘站之後，
 *    絕不在同一個轉乘車站重複出現「沒有任何線路記號的灰色方塊車站」。
 * 2. 區間內的所有線條（前置活動虛線、搭乘實線）均設定為等比例 flex-1，確保所有卡片與標籤間線段完全等長。
 */
export function buildCommuteLegs(segments: CommuteRouteSegment[]): CommuteLegItem[] {
  const legs: CommuteLegItem[] = [];
  let pendingPreActivities: CommuteRouteSegment[] = [];
  let i = 0;

  while (i < segments.length) {
    const seg = segments[i];
    const isSameStationActivity =
      seg.type === "wait" ||
      (seg.type === "walk" && isSameStation(seg.departureStop, seg.arrivalStop));

    // 站內活動（同站轉乘徒步、月台候車）暫存為下一段出發行程的前置標籤
    if (isSameStationActivity) {
      pendingPreActivities.push(seg);
      i++;
      continue;
    }

    // 地點間實質移動段（A -> B）
    const isWalk = seg.type === "walk";
    const lineColors = isWalk
      ? { color: "#8A9590", textColor: "#FFFFFF" }
      : getLineColors(seg.lineName, seg.lineColor);

    const fromStationCode = resolveStationCode(seg.lineName, seg.departureStop, seg.startStationNumber);
    const toStationCode = resolveStationCode(seg.lineName, seg.arrivalStop, seg.endStationNumber);

    const badges: CommuteBadgeNode[] = [];
    const lineStyles: string[] = [];

    // 1. 合併站內轉乘活動：若有站內轉乘徒步與候車，化繁為簡整合成單一「轉乘」標籤，分鐘數合併
    if (pendingPreActivities.length > 0) {
      const totalMinutes = pendingPreActivities.reduce((sum, p) => sum + p.durationMinutes, 0);
      const walkMinutes = pendingPreActivities
        .filter(p => p.type === "walk")
        .reduce((sum, p) => sum + p.durationMinutes, 0);
      const waitMinutes = pendingPreActivities
        .filter(p => p.type === "wait")
        .reduce((sum, p) => sum + p.durationMinutes, 0);

      const isInitialBoarding = legs.length === 0;
      const label = isInitialBoarding ? "候車" : "轉乘";

      let detailTooltip = "";
      if (walkMinutes > 0 && waitMinutes > 0) {
        detailTooltip = `站內步行 ${walkMinutes} 分 ＋ 月台候車 ${waitMinutes} 分`;
      } else if (walkMinutes > 0) {
        detailTooltip = `站內轉乘步行 ${walkMinutes} 分`;
      } else if (waitMinutes > 0) {
        detailTooltip = isInitialBoarding ? `起站月台候車 ${waitMinutes} 分` : `月台候車 ${waitMinutes} 分`;
      }

      badges.push({
        label,
        isUiLabel: true,
        durationMinutes: totalMinutes,
        detailTooltip: detailTooltip || undefined,
        bgColor: "#8A9590",
        textColor: "#FFFFFF",
      });
      lineStyles.push(DASHED_LINE_GRADIENT);
      pendingPreActivities = [];
    }

    // 2. 注入該段移動之主標籤
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
      fromStation: {
        name: seg.departureStop,
        number: fromStationCode,
        color: lineColors.color,
        type: seg.type,
      },
      toStation: {
        name: seg.arrivalStop,
        number: toStationCode,
        color: lineColors.color,
        type: seg.type,
      },
      badges,
      lineStyles,
    });

    i++;
  }

  // 防禦性處理末尾殘留之站內活動
  if (pendingPreActivities.length > 0 && legs.length > 0) {
    const lastLeg = legs[legs.length - 1];
    const totalMinutes = pendingPreActivities.reduce((sum, p) => sum + p.durationMinutes, 0);
    lastLeg.badges.push({
      label: "轉乘",
      isUiLabel: true,
      durationMinutes: totalMinutes,
      bgColor: "#8A9590",
      textColor: "#FFFFFF",
    });
    lastLeg.lineStyles.push(DASHED_LINE_GRADIENT);
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

      // 目標車站：若非最後終點，依交界規則優先保留鐵道車站圖標與登車線路編號
      const stationNode = isLastLeg ? leg.toStation : pickStationNode(leg.toStation, nextLeg?.fromStation);

      items.push({
        key: `station-${legIdx + 1}`,
        type: "station",
        station: stationNode,
      });
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
  if (!item.station || !criteria.commuteStation) return null;
  return (
    <div className="border border-[#DDE3DF] bg-[#FAFCFB] px-4 py-3 font-sans">
      <p lang="ja" className="font-jp text-xs font-bold text-[#3F5147]">
        {toJapaneseStationName(item.station)} → {toJapaneseStationName(criteria.commuteStation)}
      </p>
      <p className="mt-1 text-[11px] text-[#66736C]">目前未取得可引用的路線資料，因此不顯示推測時間與轉乘資訊。</p>
    </div>
  );
}
