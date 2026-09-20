import { originWalkIssue } from "../lib/commuteValidation";
import type { CrimeSafetyResult, PrefectureSafetyResult } from "../lib/crimeSafety";
import {
  requestListingLocation
} from '../lib/listing/apiClient';
import type { AnalyzeListingResult, ListingCommuteResult } from '../lib/listing/types';
import type { ListingLocationContext } from "../lib/listingLocation";
import { resolveListingOriginAccess } from "../lib/listingCommuteAccess";
import { parseTransitStations } from "../lib/transitParser";
import type { ListingState } from './useListingState';

type Context = Pick<ListingState,
  "requests" |
  "setLocationError"
  | "setLocationLoading"
  | "setLocationContext"
  | "setCrimeLoading"
  | "setPrefectureSafety"
  | "setCrimeData"
  | "commuteDestination"
  | "locationContext"
  | "result"
  | "commuteLoading"
  | "setCommute"
  | "setCommuteError"
  | "setCommuteLoading">;

/** 定位、治安備援與通勤請求；保留原錯誤處理及非同步順序。 */
export function createListingLocationActions(context: Context) {
  const {
    requests,
    setLocationError,
    setLocationLoading,
    setLocationContext,
    setCrimeLoading,
    setPrefectureSafety,
    setCrimeData,
    commuteDestination,
    locationContext,
    result,
    commuteLoading,
    setCommute,
    setCommuteError,
    setCommuteLoading,
  } = context;

  const loadLocationContext = async (analysis: AnalyzeListingResult) => {
    const task = requests.begin("location");
    requests.invalidate("crime", "commute");
    setCrimeLoading(false);
    setCrimeData(null);
    setPrefectureSafety(null);
    setCommuteLoading(false);
    setLocationContext(null);
    setCommute(null);
    setCommuteError(null);
    const address = (analysis?.extracted?.address || "").trim();
    if (!address) {
      task.finish();
      setLocationLoading(false);
      setLocationError("圖紙上未載明完整地址，因此無法進行精確步行與生活機能定位。");
      return;
    }
    // transitLegs 是交通動線的事實來源；舊分享連結沒有它時才重新解析。
    const stationItems = analysis?.extracted?.transitLegs?.length
      ? analysis.extracted.transitLegs
      : parseTransitStations(
        analysis?.extracted?.transitAccess,
        analysis?.extracted?.station,
        analysis?.extracted?.walkTime
      );
    const stations = stationItems.length > 0
      ? stationItems.map(item => item.stationName)
      : (analysis?.extracted?.station || "").split(/[,，]/).map(v => v.trim()).filter(Boolean);
    // 巴士接駁的站：圖紙分鐘是「走到巴士站」，不能拿去跟走到車站的實際路徑比，送 null。
    const advertisedWalkMinutes = stationItems.length > 0
      ? stationItems.map(item => (item.busMin ? null : item.walkMin))
      : (analysis?.extracted?.walkTime || "")
          .split(/[,，]/)
          .map(v => Number(v.match(/\d+/)?.[0]))
          .map(v => Number.isFinite(v) ? v : null);
    const stationLines = stationItems.map(item => item.lineName);

    setLocationLoading(true);
    setLocationError(null);
    try {
      const response = await requestListingLocation({ mode: "context", address, stations, advertisedWalkMinutes, stationLines });
      const body = await response.json().catch(() => null);
      if (!task.current()) return;
      if (!response.ok) throw new Error(body?.error || "位置資料暫時無法取得。");
      if (!body?.found) throw new Error(body?.message || "目前無法定位此地址。");
      const ctx = body.context as ListingLocationContext;
      setLocationContext(ctx);
      void loadCrimeData(ctx.matchedAddress);
    } catch (err: any) {
      if (!task.current()) return;
      setLocationError(err?.message || "位置資料暫時無法取得。");
      // 定位失敗仍用圖紙原始地址查治安：県級資料只需要都道府県名即可命中。
      void loadCrimeData(address);
    } finally {
      if (task.current()) setLocationLoading(false);
      task.finish();
    }
  };

  const loadCrimeData = async (matchedAddress: string) => {
    if (!matchedAddress) return;
    const task = requests.begin("crime");
    setCrimeLoading(true);
    try {
      const response = await requestListingLocation({ mode: "crime", address: matchedAddress });
      const body = await response.json().catch(() => null);
      if (!task.current() || !body?.found) return;
      // 東京都回町丁目級，其餘道府県回都道府県級，兩者精度不同、分開存。
      if (body.precision === "prefecture" && body.prefecture) {
        setCrimeData(null);
        setPrefectureSafety(body.prefecture as PrefectureSafetyResult);
      } else if (body.crime) {
        setPrefectureSafety(null);
        setCrimeData(body.crime as CrimeSafetyResult);
      }
    } catch {
      // 治安資料查詢失敗不影響主流程，靜默處理
    } finally {
      if (task.current()) setCrimeLoading(false);
      task.finish();
    }
  };

  const analyzeCommute = async () => {
    const destination = commuteDestination.trim();
    const fallbackStation = result?.extracted.station.split(/[,，]/).map(v => v.trim()).find(Boolean);
    const transitLegs = result?.extracted.transitLegs?.length
      ? result.extracted.transitLegs
      : parseTransitStations(result?.extracted.transitAccess, result?.extracted.station, result?.extracted.walkTime);
    const originAccess = resolveListingOriginAccess(locationContext?.stationWalks, transitLegs, fallbackStation);
    if (!destination || !originAccess || commuteLoading || requests.pending("commute")) return;
    const walkIssue = originWalkIssue(originAccess.walkMinutes, originAccess.advertisedWalkMinutes);
    if (walkIssue) {
      setCommute(null);
      setCommuteError(walkIssue);
      return;
    }

    const task = requests.begin("commute");
    setCommuteLoading(true);
    setCommuteError(null);
    setCommute(null);

    try {
      const response = await requestListingLocation({
        mode: "commute",
        originStation: originAccess.station,
        originWalkMinutes: originAccess.walkMinutes,
        originAdvertisedMinutes: originAccess.advertisedWalkMinutes,
        originBusMinutes: originAccess.busMinutes,
        originBusStop: originAccess.busStop,
        addressContext: result?.extracted.address || "",
        destination,
      });
      const body = await response.json().catch(() => null);
      if (!task.current()) return;
      if (!response.ok) throw new Error(body?.error || "通勤路線暫時無法取得。");
      if (!body?.found) throw new Error(body?.message || "目前查不到這條通勤路線。");
      setCommute(body.commute as ListingCommuteResult);
    } catch (err: any) {
      if (!task.current()) return;
      setCommuteError(err?.message || "通勤路線暫時無法取得。");
    } finally {
      if (task.current()) setCommuteLoading(false);
      task.finish();
    }
  };
  return {
    loadLocationContext,
    analyzeCommute,
  };
}
