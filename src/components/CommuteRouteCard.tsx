import React from "react";
import type { CommuteRouteDetails, CommuteRouteSegment, RentRecommendation, RentSearchCriteria } from "../lib/rentAnalysis";
import { getLineColors, getStationCodeForLine, toJapaneseLineName, toJapaneseStationName } from "../lib/transit";

const StationSign: React.FC<{ name: string; number: string; color: string; type: CommuteRouteSegment["type"] }> = ({ name, number, color, type }) => {
  const cleanedName = toJapaneseStationName(name.replace(/\(.*\)/, "").trim());

  if (type === "walk") {
    return (
      <div className="flex flex-col items-center shrink-0 text-center w-14 font-sans">
        <div className="w-10 h-10 flex items-center justify-center shrink-0">
          <div className="relative w-5 h-5 bg-white border-2 border-[#8A9590] flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-[#8A9590]" />
          </div>
        </div>
        <p lang="ja" className="font-jp mt-1 text-xs font-medium text-[#3F5147] max-w-[60px] truncate">{cleanedName}</p>
      </div>
    );
  }

  const [lineCode, stationCode] = (number || "").split(/(\d+)/).filter(Boolean);

  return (
    <div className="flex flex-col items-center shrink-0 text-center w-14 font-sans">
      <div
        className="w-10 h-10 p-0.5 border-2 bg-white flex items-center justify-center shrink-0"
        style={{ borderColor: color }}
      >
        <div className="text-center leading-none">
          <span className="block font-bold text-[#1A2A22] text-[0.65rem]">
            {lineCode || ""}
          </span>
          <span className="block font-bold text-[#1A2A22] text-[0.95rem] tracking-[-0.05em]">
            {stationCode || number || ""}
          </span>
        </div>
      </div>
      <p lang="ja" className="font-jp mt-1 text-xs font-bold text-[#3F5147] max-w-[64px] truncate">{cleanedName}</p>
    </div>
  );
};

export function CommuteRouteCard({ route }: { route: CommuteRouteDetails }) {
  const lastSegment = route.segments[route.segments.length - 1];
  const sourceBadge = route.source === "local_gtfs"
    ? "本地標準班表"
    : route.source === "transitous"
    ? "標準班表"
    : route.source === "verified_cache"
      ? "已驗證快取"
      : route.source === "web_grounded"
        ? "網路交叉查證"
        : route.source === "ai_estimate"
          ? "AI 路線估算"
        : "標準路線參考";

  return (
    <div className="bg-[#FAFCFB] p-3.5 sm:p-5 border border-[#DDE3DF] font-sans">
      <div className="mb-1 flex items-start justify-between gap-3">
        <h3 lang="ja" className="font-jp text-sm sm:text-base font-bold text-[#1A2A22]">
          {toJapaneseStationName(route.originStation)} → {toJapaneseStationName(route.destinationStation)}
        </h3>
        <span className="shrink-0 border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">{sourceBadge}</span>
      </div>
      <div className="mb-4 flex items-center space-x-5 text-xs text-[#3F5147]">
        <span>
          總時間：<strong className="text-blue-600 text-sm">{route.totalDurationMinutes} 分鐘</strong>
        </span>
        <span>
          轉乘次數：<strong className="text-blue-600 text-sm">{route.transfers} 次</strong>
        </span>
      </div>

      {/* Track visual container without visible scrollbar & responsive layout */}
      <div className="w-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-1">
        <div className="flex items-start w-full min-w-max sm:min-w-0 justify-between py-2">
          {route.segments.map((segment, index) => {
            const prevSegment = index > 0 ? route.segments[index - 1] : null;
            const nextSegment = route.segments[index + 1];

            // 候車節點已經畫過自己所在的車站，接在它後面的乘車段不能再畫一次，
            // 否則同一個站名會連續出現兩格。
            const skipStationSign = prevSegment?.type === "wait";

            let stationName = segment.departureStop;
            let stationNumber = segment.startStationNumber || getStationCodeForLine(segment.lineName, segment.departureStop);
            let stationColor = getLineColors(segment.lineName, segment.lineColor).color;
            let stationType = segment.type;

            if (segment.type === "wait") {
              // 候車發生在「即將搭乘的那條線」的月台，站牌顏色沿用下一段路線。
              const boarding = nextSegment;
              stationNumber = segment.startStationNumber
                || (boarding ? getStationCodeForLine(boarding.lineName, segment.departureStop) : null);
              stationColor = boarding ? getLineColors(boarding.lineName, boarding.lineColor).color : segment.lineColor;
              stationType = boarding ? boarding.type : "rail";
            } else if (segment.type === "walk" && prevSegment) {
              stationNumber = prevSegment.endStationNumber || getStationCodeForLine(prevSegment.lineName, prevSegment.arrivalStop);
              stationColor = getLineColors(prevSegment.lineName, prevSegment.lineColor).color;
              stationType = prevSegment.type;
            }

            // 最後一道防線：路線快取（transitRouteCache）裡還躺著舊版寫入的
            // lineTextColor: "#FFFFFF"，那些路線在淺底色上依然會是白字看不見。
            // 這裡不信任 segment 帶來的文字色，一律依底色重算。
            const badgeColors = segment.type === "walk" || segment.type === "wait"
              ? { color: segment.lineColor, textColor: "#FFFFFF" }
              : getLineColors(segment.lineName, segment.lineColor);

            return (
              <React.Fragment key={index}>
                {!skipStationSign && (
                  <StationSign
                    name={stationName}
                    number={stationNumber || ""}
                    color={stationColor}
                    type={stationType}
                  />
                )}

                {/* Overlapped Centered Line & Line Name Badge, aligned in height with station box */}
                <div className="flex flex-col flex-1 min-w-[3.5rem] sm:min-w-[5rem] px-1">
                  <div className="relative w-full h-10 flex items-center justify-center">
                    {/* Thinner horizontal line bar passing through center */}
                    <div
                      className="absolute -left-3 -right-3 h-[2px] my-auto"
                      style={{
                        background: segment.type === "walk" || segment.type === "wait"
                          ? "repeating-linear-gradient(90deg, #94a3b8, #94a3b8 4px, transparent 4px, transparent 8px)"
                          : segment.lineColor
                      }}
                    />
                    {/* Line Name Badge superimposed on line */}
                    <div
                      className="relative z-10 px-2 py-0.5 text-[11px] font-bold whitespace-nowrap shadow-2xs max-w-[130px] truncate"
                      style={{ backgroundColor: badgeColors.color, color: badgeColors.textColor }}
                    >
                      <span lang="ja" className="font-jp truncate">{toJapaneseLineName(segment.lineName)}</span>
                    </div>
                  </div>
                  {/* Duration Text below without label box */}
                  <div className="mt-1 text-xs font-mono font-medium text-[#66736C] text-center">
                    {segment.durationMinutes}分
                  </div>
                </div>
              </React.Fragment>
            );
          })}

          {/* Final Station */}
          {lastSegment && (
            <StationSign
              name={lastSegment.arrivalStop}
              number={lastSegment.endStationNumber || getStationCodeForLine(lastSegment.lineName, lastSegment.arrivalStop) || ""}
              color={lastSegment.lineColor}
              type={lastSegment.type}
            />
          )}
        </div>
      </div>

      <div className="mt-4 bg-white p-3 border-l-4 border-blue-500 border border-[#DDE3DF]">
        <p className="text-xs text-[#3F5147]">
          {route.transfers === 0
            ? "最快且最方便的直達路線，無需求乘。"
            : `建議路線需轉乘 ${route.transfers} 次。`}
        </p>
        <p className="mt-1.5 text-[10px] text-[#66736C]">{route.referenceLabel}</p>
        {route.sourceLinks?.length ? (
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {route.sourceLinks.slice(0, 3).map(source => (
              <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-700 underline underline-offset-2">
                {source.title}
              </a>
            ))}
          </div>
        ) : null}
      </div>
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
