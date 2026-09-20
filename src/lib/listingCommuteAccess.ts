import type { ListingStationWalk } from "./listingLocation.js";
import type { TransitLeg } from "./transitParser.js";

export interface ListingOriginAccess {
  station: string;
  walkMinutes: number;
  advertisedWalkMinutes: number | null;
  busMinutes: number;
  busStop: string | null;
}

/**
 * 決定從物件出門到鐵路起站的實際接駁方式。
 *
 * 圖紙若刊載巴士接駁，地圖算出的「直接走到鐵路站」只供比較，不可拿來當通勤
 * 起始段；應採圖紙明載的「走到巴士站＋巴士車程」。一般徒歩物件才使用道路路徑
 * 算出的 normalMinutes，並保留圖紙分鐘供異常值核對。
 */
export function resolveListingOriginAccess(
  stationWalks: ListingStationWalk[] | undefined,
  transitLegs: TransitLeg[] | undefined,
  fallbackStation?: string | null,
): ListingOriginAccess | null {
  const busLeg = transitLegs?.find(leg =>
    typeof leg.busMin === "number" && leg.busMin > 0
    && typeof leg.walkMin === "number" && leg.walkMin > 0
    && Boolean(leg.stationName?.trim()));
  if (busLeg) {
    return {
      station: busLeg.stationName.trim(),
      walkMinutes: Math.round(busLeg.walkMin!),
      advertisedWalkMinutes: Math.round(busLeg.walkMin!),
      busMinutes: Math.round(busLeg.busMin!),
      busStop: busLeg.busStop?.trim() || null,
    };
  }

  const firstWalk = stationWalks?.[0];
  const station = firstWalk?.station?.trim() || fallbackStation?.trim();
  if (!station) return null;
  return {
    station,
    walkMinutes: firstWalk?.normalMinutes ?? 0,
    advertisedWalkMinutes: firstWalk?.advertisedMinutes ?? null,
    busMinutes: 0,
    busStop: null,
  };
}
