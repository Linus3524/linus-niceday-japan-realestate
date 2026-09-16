import type { ListingLocationContext } from "../../lib/listingLocation";
import type { TransitLeg } from "../../lib/transitParser";
import { lookupStationLines } from "../../lib/transitParser";

interface TransitStationChipsProps {
  /** 圖紙刊載的交通動線（transitLegs） */
  stationItems: TransitLeg[];
  /** 定位完成後的步行比對；其中 source="nearby" 的是圖紙沒寫、依座標補的附近站 */
  locationContext?: ListingLocationContext | null;
}

/**
 * 「最近車站與各路線徒步時間」：圖紙刊載站在前，圖紙沒寫但實際走得到的附近站接在後面。
 * 圖紙只寫兩個両国、實際上森下也在步行圈內，這種情況使用者在這一格就要看得到，
 * 不用捲到下面的步行比對才發現。補充站標示明確，分鐘數是實際路徑不是圖紙 80m 換算。
 */
export function TransitStationChips({ stationItems, locationContext }: TransitStationChipsProps) {
  const nearby = (locationContext?.stationWalks ?? []).filter(walk => walk.source === "nearby");
  if (!stationItems.length && !nearby.length) return null;
  const countText = [
    stationItems.length ? `圖紙刊載 ${stationItems.length} 站` : "",
    nearby.length ? `附近補充 ${nearby.length} 站` : "",
  ].filter(Boolean).join("・");
  return (
    <div className="mt-3.5 border-t border-[#DDE3DF] pt-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold text-[#1A2A22]">最近車站與各路線徒步時間</span>
        <span className="text-[10px] text-[#66736C]">{countText}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {stationItems.map((item, idx) => (
          <div
            key={`flyer-${idx}`}
            className="inline-flex flex-wrap items-center gap-2 border border-[#DDE3DF] bg-white px-3 py-1.5 text-xs shadow-2xs"
          >
            {item.lineName && (
              <span className="border border-[#DDE3DF] bg-[#F5F8F6] px-1.5 py-0.5 text-[10px] font-bold text-[#1A2A22]">
                {item.lineName}
              </span>
            )}
            <span className="font-bold text-[#1A2A22]">{item.stationName} 駅</span>
            {item.busMin ? (
              // 巴士接駁：「バス 15 分＋徒歩 3 分」，總時間另外標，免得只看到 3 分以為是近站
              <span className="text-xs text-[#3F5147]" title={item.busStop ? `巴士站：${item.busStop}` : undefined}>
                バス <span className="font-bold text-[#1A2A22]">{item.busMin}</span> 分
                {item.walkMin !== null ? <>＋徒歩 <span className="font-bold text-[#1A2A22]">{item.walkMin}</span> 分</> : null}
                <span className="ml-1 text-[#66736C]">（合計約 {item.busMin + (item.walkMin ?? 0)} 分）</span>
                {item.busStop ? <span className="ml-1 border border-[#DDE3DF] bg-[#F5F8F6] px-1 py-0.5 text-[10px] text-[#66736C]">巴士站 {item.busStop}</span> : null}
              </span>
            ) : item.walkMin !== null ? (
              <span className="text-xs text-[#3F5147]">
                徒歩 <span className="font-bold text-[#00A174]">{item.walkMin}</span> 分
              </span>
            ) : (
              <span className="text-xs text-[#66736C]">徒步時間未標註</span>
            )}
          </div>
        ))}
        {nearby.map((walk, idx) => {
          const line = walk.lineName || lookupStationLines(walk.station);
          return (
            <div
              key={`nearby-${idx}`}
              className="inline-flex flex-wrap items-center gap-2 border border-dashed border-[#C9D2CD] bg-[#F5F8F6] px-3 py-1.5 text-xs"
              title="圖紙未刊載，依物件座標補充；分鐘數為實際道路路徑，不是圖紙的 80m／分換算"
            >
              {line && (
                <span className="border border-[#DDE3DF] bg-white px-1.5 py-0.5 text-[10px] font-bold text-[#1A2A22]">
                  {line}
                </span>
              )}
              <span className="font-bold text-[#1A2A22]">{walk.station} 駅</span>
              <span className="text-xs text-[#3F5147]">
                實際步行約 <span className="font-bold text-[#00A174]">{walk.normalMinutes}</span> 分
              </span>
              <span className="border border-[#C9D2CD] bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#66736C]">
                附近補充
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
