import React from "react";
import type { CommuteRouteDetails, CommuteRouteSegment, RentRecommendation, RentSearchCriteria } from "../lib/rentAnalysis";
import { getStationCodeForLine, toJapaneseLineName, toJapaneseStationName } from "../lib/transit";

const StationSign: React.FC<{ name: string; number: string; color: string; type: CommuteRouteSegment["type"] }> = ({ name, number, color, type }) => {
  const cleanedName = toJapaneseStationName(name.replace(/\(.*\)/, "").trim());

  if (type === "walk") {
    return (
      <div className="flex flex-col items-center shrink-0 text-center w-14 font-sans">
        <div className="w-10 h-10 flex items-center justify-center shrink-0">
          <div className="relative w-5 h-5 bg-white border-2 border-slate-500 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-slate-500" />
          </div>
        </div>
        <p lang="ja" className="font-jp mt-1 text-xs font-medium text-slate-700 max-w-[60px] truncate">{cleanedName}</p>
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
          <span className="block font-bold text-slate-800 text-[0.65rem]">
            {lineCode || ""}
          </span>
          <span className="block font-bold text-slate-800 text-[0.95rem] tracking-[-0.05em]">
            {stationCode || number || ""}
          </span>
        </div>
      </div>
      <p lang="ja" className="font-jp mt-1 text-xs font-bold text-slate-700 max-w-[64px] truncate">{cleanedName}</p>
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
    <div className="bg-slate-50 p-3.5 sm:p-5 border border-slate-200 font-sans">
      <div className="mb-1 flex items-start justify-between gap-3">
        <h3 lang="ja" className="font-jp text-sm sm:text-base font-bold text-slate-800">
          {toJapaneseStationName(route.originStation)} → {toJapaneseStationName(route.destinationStation)}
        </h3>
        <span className="shrink-0 border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">{sourceBadge}</span>
      </div>
      <div className="mb-4 flex items-center space-x-5 text-xs text-slate-600">
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
            let stationName = segment.departureStop;
            let stationNumber = segment.startStationNumber || getStationCodeForLine(segment.lineName, segment.departureStop);
            let stationColor = segment.lineColor;
            let stationType = segment.type;

            if (segment.type === "walk" && index > 0) {
              const prevSegment = route.segments[index - 1];
              stationNumber = prevSegment.endStationNumber || getStationCodeForLine(prevSegment.lineName, prevSegment.arrivalStop);
              stationColor = prevSegment.lineColor;
              stationType = prevSegment.type;
            }

            return (
              <React.Fragment key={index}>
                <StationSign
                  name={stationName}
                  number={stationNumber || ""}
                  color={stationColor}
                  type={stationType}
                />

                {/* Overlapped Centered Line & Line Name Badge, aligned in height with station box */}
                <div className="flex flex-col flex-1 min-w-[3.5rem] sm:min-w-[5rem] px-1">
                  <div className="relative w-full h-10 flex items-center justify-center">
                    {/* Thinner horizontal line bar passing through center */}
                    <div
                      className="absolute -left-3 -right-3 h-[2px] my-auto"
                      style={{
                        background: segment.type === "walk"
                          ? "repeating-linear-gradient(90deg, #94a3b8, #94a3b8 4px, transparent 4px, transparent 8px)"
                          : segment.lineColor
                      }}
                    />
                    {/* Line Name Badge superimposed on line */}
                    <div
                      className="relative z-10 px-2 py-0.5 text-[11px] font-bold text-white whitespace-nowrap shadow-2xs max-w-[130px] truncate"
                      style={{ backgroundColor: segment.lineColor }}
                    >
                      <span lang="ja" className="font-jp truncate">{toJapaneseLineName(segment.lineName)}</span>
                    </div>
                  </div>
                  {/* Duration Text below without label box */}
                  <div className="mt-1 text-xs font-mono font-medium text-slate-500 text-center">
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

      <div className="mt-4 bg-white p-3 border-l-4 border-blue-500 border border-slate-200">
        <p className="text-xs text-slate-700">
          {route.transfers === 0
            ? "最快且最方便的直達路線，無需求乘。"
            : `建議路線需轉乘 ${route.transfers} 次。`}
        </p>
        <p className="mt-1.5 text-[10px] text-slate-500">{route.referenceLabel}</p>
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
    <div className="border border-slate-200 bg-slate-50 px-4 py-3 font-sans">
      <p lang="ja" className="font-jp text-xs font-bold text-slate-700">
        {toJapaneseStationName(item.station)} → {toJapaneseStationName(criteria.commuteStation)}
      </p>
      <p className="mt-1 text-[11px] text-slate-500">目前未取得可引用的路線資料，因此不顯示推測時間與轉乘資訊。</p>
    </div>
  );
}
