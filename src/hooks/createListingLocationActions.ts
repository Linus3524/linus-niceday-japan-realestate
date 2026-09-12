import { originWalkIssue } from "../lib/commuteValidation";
import type { CrimeSafetyResult, PrefectureSafetyResult } from "../lib/crimeSafety";
import {
  requestListingLocation
} from '../lib/listing/apiClient';
import type { AnalyzeListingResult, ListingCommuteResult } from '../lib/listing/types';
import type { ListingLocationContext } from "../lib/listingLocation";
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
    const stations = (analysis?.extracted?.station || "").split(/[,，]/).map(v => v.trim()).filter(Boolean);
    const advertisedWalkMinutes = (analysis?.extracted?.walkTime || "")
      .split(/[,，]/)
      .map(v => Number(v.match(/\d+/)?.[0]))
      .map(v => Number.isFinite(v) ? v : null);

    setLocationLoading(true);
    setLocationError(null);
    try {
      const response = await requestListingLocation({ mode: "context", address, stations, advertisedWalkMinutes });
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
        setPrefectureSafety(body.prefecture as PrefectureSafetyResult);
      } else if (body.crime) {
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
    const firstWalk = locationContext?.stationWalks[0];
    const fallbackStation = result?.extracted.station.split(/[,，]/).map(v => v.trim()).find(Boolean);
    const originStation = firstWalk?.station || fallbackStation;
    if (!destination || !originStation || commuteLoading || requests.pending("commute")) return;
    const walkIssue = originWalkIssue(firstWalk?.normalMinutes, firstWalk?.advertisedMinutes);
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
        originStation,
        originWalkMinutes: firstWalk?.normalMinutes,
        originAdvertisedMinutes: firstWalk?.advertisedMinutes,
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
