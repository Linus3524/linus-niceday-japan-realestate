import {
Footprints,
Info,
LoaderCircle,
MapPin,
RefreshCw,
Store
} from "lucide-react";
import type { ListingHealthCheckModel } from '../../hooks/useListingHealthCheckController';
import { CrimeSafetyCard } from "../CrimeSafetyCard";
import { ErrorBoundary } from "../ErrorBoundary";
import { ListingLocationMap } from "../ListingLocationMap";
import { PrefectureSafetyCard } from "../PrefectureSafetyCard";

interface ListingLocationSectionProps {
  model: Pick<
    ListingHealthCheckModel,
    | "locationLoading"
    | "locationError"
    | "result"
    | "loadLocationContext"
    | "locationContext"
    | "crimeLoading"
    | "crimeData"
    | "prefectureSafety"
  >;
}

export function ListingLocationSection({ model }: ListingLocationSectionProps) {
  const {
    locationLoading,
    locationError,
    result,
    loadLocationContext,
    locationContext,
    crimeLoading,
    crimeData,
    prefectureSafety,
  } = model;
  return (<div className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#007D5A]">
        <MapPin className="h-4 w-4 text-[#007D5A]" />
        <span>位置與生活機能</span>
      </div>
      <span className="text-[10px] text-[#66736C]">
        門牌定位、步行時間比對與 1.2km 生活圈
      </span>
    </div>

    {locationLoading && (
      <div className="flex items-center justify-between border border-[#DDE3DF] bg-[#F5F8F6] p-3.5">
        <div className="flex items-center gap-2.5">
          <LoaderCircle className="h-4 w-4 animate-spin text-[#007D5A]" />
          <div>
            <p className="text-xs font-bold text-[#1A2A22]">正在定位門牌與檢索周邊生活機能設施…</p>
            <p className="mt-0.5 text-[11px] text-[#66736C]">比對真實道路步行時間，並搜尋周邊 1.2km 超商、超市、藥妝、公園等生活設施</p>
          </div>
        </div>
      </div>
    )}

    {locationError && !locationLoading && (
      <div className="flex flex-col gap-2 border border-[#E8C4A8] bg-[#FFF9ED] p-3.5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-[#7A5A1F]">{locationError}</p>
        {result && (
          <button
            type="button"
            onClick={() => void loadLocationContext(result)}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 border border-[#007D5A] bg-[#007D5A] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#006548]"
          >
            <RefreshCw className="h-3.5 w-3.5" /> 重新載入設施與地圖
          </button>
        )}
      </div>
    )}

    {locationContext && (
      <div className="space-y-4">
        {/* 定位地址標頭列 */}
        <div className="flex items-center justify-between bg-[#F5F8F6] p-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#66736C]">定位地址：</span>
            <span className="font-bold text-[#1A2A22]">{locationContext.matchedAddress}</span>
          </div>
          {result && (
            <button
              type="button"
              onClick={() => void loadLocationContext(result)}
              disabled={locationLoading}
              className="flex items-center gap-1 border border-[#DDE3DF] bg-white px-2 py-0.5 text-[10px] font-semibold text-[#66736C] hover:bg-[#E8ECE9] hover:text-[#1A2A22]"
              title="重新整理周邊生活機能設施"
            >
              <RefreshCw className={`h-3 w-3 ${locationLoading ? "animate-spin" : ""}`} /> 重新整理
            </button>
          )}
        </div>

        {locationContext.notices?.map(notice => (
          <p key={notice} className="bg-[#FFF9ED] p-3 text-xs leading-relaxed text-[#7A5A1F]">{notice}</p>
        ))}

        {/* 實際步行時間比對：改為緊湊俐落的水平卡片，不再鬆散佔位 */}
        {locationContext.stationWalks.length > 0 && (
          <div className="border border-[#DDE3DF] bg-white p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-1">
              <div className="flex items-center gap-2 text-xs font-bold text-[#007D5A]">
                <Footprints className="h-4 w-4 text-[#007D5A]" />
                <span>步行時間比對</span>
              </div>
              <span className="text-[10px] text-[#66736C]">
                依實際路徑計算（常態 75m/分含等紅綠燈；圖紙法定基準為 80m/分直線）
              </span>
            </div>

            <div className="space-y-2.5">
              {locationContext.stationWalks.map(walk => (
                <div
                  key={walk.station}
                  className="flex flex-col justify-between gap-3 border border-[#DDE3DF] bg-white p-3 transition-colors sm:flex-row sm:items-center"
                >
                  {/* 車站與距離 */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-[#1A2A22]">{walk.station}駅</span>
                      <span className={`border px-2 py-0.5 text-[10px] font-semibold ${walk.source === "nearby"
                          ? "border-[#C9D2CD] bg-[#F5F8F6] text-[#66736C]"
                          : "border-[#9EE2CF] bg-[#E6F6F1] text-[#007D5A]"
                        }`}>
                        {walk.source === "nearby" ? "附近補充" : "圖紙刊載"}
                      </span>
                      <span className="bg-white px-2 py-0.5 text-[10px] font-semibold text-[#66736C] border border-[#DDE3DF]">
                        約 {walk.distanceMeters.toLocaleString("zh-TW")}m
                      </span>
                    </div>
                    {walk.advertisedMinutes !== null && (
                      <p className="mt-1 text-[11px] text-[#66736C]">
                        圖紙標示徒步 <span className="tabular-nums font-bold text-[#1A2A22]">{walk.advertisedMinutes}</span> 分鐘
                        {walk.differenceMinutes && walk.differenceMinutes > 0 ? (
                          <>
                            ，實際步行約需 <span className="tabular-nums font-bold text-[#1A2A22]">{walk.normalMinutes}</span> 分鐘
                            <strong className="ml-1 font-bold text-[#B13818]">（比圖紙標示多約 {walk.differenceMinutes} 分鐘）</strong>
                          </>
                        ) : walk.differenceMinutes && walk.differenceMinutes < 0 ? (
                          <>
                            ，實際步行約需 <span className="tabular-nums font-bold text-[#1A2A22]">{walk.normalMinutes}</span> 分鐘
                            <strong className="ml-1 font-bold text-[#007D5A]">（比圖紙標示快約 {Math.abs(walk.differenceMinutes)} 分鐘）</strong>
                          </>
                        ) : (
                          <>
                            ，實際步行約需 <span className="tabular-nums font-bold text-[#1A2A22]">{walk.normalMinutes}</span> 分鐘（與圖紙標示相符）
                          </>
                        )}
                      </p>
                    )}
                    {walk.source === "nearby" && (
                      <p className="mt-1 text-[11px] text-[#66736C]">
                        圖紙未刊載，依物件座標補充之最近車站（實際步行約需 <span className="tabular-nums font-bold text-[#1A2A22]">{walk.normalMinutes}</span> 分鐘）
                      </p>
                    )}
                  </div>

                  {/* 3 段速度緊湊膠囊（含每分鐘公尺數標註） */}
                  <div className="flex shrink-0 items-center gap-1.5">
                    <div className="border border-[#DDE3DF] bg-white px-2 py-1 text-center min-w-[56px]" title="快步通勤步速：約 90m/分">
                      <span className="block text-[9px] text-[#66736C]">快步</span>
                      <span className="block font-mono text-[8px] text-[#8A9590]">90m/分</span>
                      <span className="mt-0.5 block font-mono text-xs font-bold text-[#1A2A22]">{walk.fastMinutes}分</span>
                    </div>
                    <div className="border border-[#00A174] bg-[#E6F6F1] px-2.5 py-1 text-center min-w-[62px]" title="日常常態步速：約 75m/分（含停等紅綠燈過路口餘裕）">
                      <span className="block text-[9px] font-bold text-[#007D5A]">一般常態</span>
                      <span className="block font-mono text-[8px] font-semibold text-[#007D5A]/80">75m/分</span>
                      <span className="mt-0.5 block font-mono text-sm font-black text-[#007D5A]">{walk.normalMinutes}分</span>
                    </div>
                    <div className="border border-[#DDE3DF] bg-white px-2 py-1 text-center min-w-[56px]" title="雨天傘步或攜帶行李推車：約 55m/分">
                      <span className="block text-[9px] text-[#66736C]">雨天/行李</span>
                      <span className="block font-mono text-[8px] text-[#8A9590]">55m/分</span>
                      <span className="mt-0.5 block font-mono text-xs font-bold text-[#1A2A22]">{walk.slowMinutes}分</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 互動地圖與周邊生活機能：將房屋與所有周邊設施直接標記在地圖上 */}
        <div className="border border-[#DDE3DF] bg-white p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold text-[#007D5A]">
            <Store className="h-4 w-4 text-[#007D5A]" />
            <span>周邊 1.2 公里生活機能與互動地圖</span>
          </div>

          {/* 核心組件：地圖視覺化標出本物件與所有周邊設施 */}
          <ErrorBoundary fallbackTitle="地圖模組暫時無法載入">
            <ListingLocationMap context={locationContext} />
          </ErrorBoundary>

          {/* 資料來源與免責聲明：放在地圖卡片內最下方 */}
          <div className="mt-4 border-t border-[#DDE3DF] pt-3 flex items-start gap-2 text-[11px] leading-relaxed text-[#8A9590]">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8A9590]" />
            <div className="min-w-0 flex-1 space-y-1">
              <div>
                <span className="font-semibold text-[#66736C]">資料來源：</span>
                <a className="underline hover:text-[#1A2A22]" href="https://maps.gsi.go.jp/" target="_blank" rel="noreferrer">國土地理院地址搜尋</a>、
                <a className="underline hover:text-[#1A2A22]" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>、
                <a className="underline hover:text-[#1A2A22]" href="https://www.reinfolib.mlit.go.jp/" target="_blank" rel="noreferrer">國土交通省 不動產資訊資料庫</a>。
              </div>
              <p className="text-[10px] leading-relaxed text-[#8A9590]">
                本服務使用日本國土交通省不動產資訊資料庫 API，但不保證所提供資訊之即時性、正確性與完整性；周邊設施資料亦可能存在缺漏，實際現況請以現場與官方公開資訊為準。
              </p>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* 周邊治安資料：東京都為町丁目級，其餘道府県為都道府県級。
                刻意放在 locationContext 判斷之外——定位失敗時仍可只靠地址顯示県級治安。 */}
    {crimeLoading && (
      <div className="flex items-center gap-2.5 border border-[#DDE3DF] bg-[#F5F8F6] p-3.5">
        <LoaderCircle className="h-4 w-4 animate-spin text-[#007D5A]" />
        <p className="text-xs text-[#66736C]">正在查詢周邊治安資料…</p>
      </div>
    )}
    {crimeData && !crimeLoading && (
      <ErrorBoundary fallbackTitle="治安資料模組暫時無法載入">
        <CrimeSafetyCard crime={crimeData} />
      </ErrorBoundary>
    )}
    {prefectureSafety && !crimeData && !crimeLoading && (
      <ErrorBoundary fallbackTitle="治安資料模組暫時無法載入">
        <PrefectureSafetyCard prefecture={prefectureSafety} />
      </ErrorBoundary>
    )}
  </div>);
}
