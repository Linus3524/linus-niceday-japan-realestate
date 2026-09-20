import {
AlertCircle,
FileSpreadsheet
} from "lucide-react";
import type { ListingHealthCheckModel } from '../../hooks/useListingHealthCheckController';
import { TransitStationChips } from './TransitStationChips';
import {
translateOccupancyStatus
} from "../../lib/equipmentParser";

interface SalePropertyFactsProps {
  model: Pick<
    ListingHealthCheckModel,
    | "extracted"
    | "specialSale"
    | "isSpecialSale"
    | "displayArea"
    | "saleAnalysis"
    | "displayStructure"
    | "displayDirection"
    | "stationItems"
    | "locationContext"
    | "equipmentList"
  >;
}

export function SalePropertyFacts({ model }: SalePropertyFactsProps) {
  const {
    extracted,
    specialSale,
    isSpecialSale,
    displayArea,
    saleAnalysis,
    displayStructure,
    displayDirection,
    stationItems,
    locationContext,
    equipmentList,
  } = model;
  return (<div className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#00A174]">
        <FileSpreadsheet className="h-4 w-4 text-[#00A174]" />
        <span>物件基本規格・交通與設備</span>
      </div>
      <span className="text-[10px] text-[#66736C]">逐項對照圖紙載明內容</span>
    </div>

    <div className="border border-[#DDE3DF] bg-white p-4 sm:p-5">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs sm:grid-cols-4">
        <div>
          <dt className="text-[#66736C]">格局（間取り）</dt>
          <dd className="font-bold text-[#1A2A22]">{extracted?.layout || "—"}</dd>
        </div>
        <div>
          <dt className="text-[#66736C]">{specialSale.kind === "land" ? "土地面積" : isSpecialSale ? "建物總面積" : "專有面積"}</dt>
          <dd className="font-bold text-[#1A2A22]">{displayArea || extracted?.buildingArea || "未於圖紙載明"}</dd>
        </div>
        {isSpecialSale && specialSale.kind !== "land" && extracted?.landArea ? (
          <div>
            <dt className="text-[#66736C]">土地面積／私道負擔</dt>
            <dd className="font-bold text-[#1A2A22]">{extracted.landArea}</dd>
          </div>
        ) : (
          <div>
            <dt className="text-[#66736C]">陽台面積（バルコニー）</dt>
            <dd className="font-bold text-[#1A2A22]">{extracted?.balconyArea || "未於圖紙載明"}</dd>
          </div>
        )}
        <div>
          <dt className="text-[#66736C]">屋齡／建築年月</dt>
          <dd className="font-bold text-[#1A2A22]">{extracted?.age || "—"}</dd>
        </div>
        <div>
          <dt className="text-[#66736C]">樓層／總階數</dt>
          <dd className="font-bold text-[#1A2A22]">
            {[extracted?.floor, extracted?.buildingFloors ? `／共 ${extracted.buildingFloors} 階建` : ""]
              .filter(Boolean).join("") || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-[#66736C]">{isSpecialSale ? "建蔽率／容積率" : "總戶數（総戸数）"}</dt>
          <dd className="font-bold text-[#1A2A22]">
            {isSpecialSale
              ? [extracted?.buildingCoverageRatio ? `建蔽 ${extracted.buildingCoverageRatio}` : "", extracted?.floorAreaRatio ? `容積 ${extracted.floorAreaRatio}` : ""].filter(Boolean).join("、") || (extracted?.roadDetails?.match(/建ぺい率\d+%.*?容積率\d+%/)?.[0] ?? "依都市計畫")
              : (extracted?.totalUnits || "—")}
          </dd>
        </div>
        <div>
          <dt className="text-[#66736C]">土地權利形式</dt>
          <dd className="font-bold text-[#1A2A22]">{extracted?.landRights || "—"}</dd>
        </div>
        <div>
          <dt className="text-[#66736C]">用途地域</dt>
          <dd className="font-bold text-[#1A2A22]">{extracted?.zoning || "—"}</dd>
        </div>
        <div>
          <dt className="text-[#66736C]">現況（引渡條件）</dt>
          <dd className="font-bold text-[#1A2A22]">
            {translateOccupancyStatus(extracted?.occupancyStatus) || translateOccupancyStatus(saleAnalysis?.occupancyAssessment?.statusText) || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-[#66736C]">{isSpecialSale ? "停車／選配設施" : "管理形態"}</dt>
          <dd className="font-bold text-[#1A2A22]">
            {isSpecialSale ? (extracted?.optionalFacilities || "圖紙未註明") : (extracted?.managementStyle || "—")}
          </dd>
        </div>
        <div>
          <dt className="text-[#66736C]">建物構造</dt>
          <dd className="font-bold text-[#1A2A22]">{displayStructure || "未於圖紙載明"}</dd>
        </div>
        <div>
          <dt className="text-[#66736C]">主要採光面（朝向）</dt>
          <dd className="font-bold text-[#1A2A22]">
            {displayDirection ? (
              displayDirection.includes("（依平面圖") ? (
                <span>
                  <span>{displayDirection.split("（")[0]}</span>
                  <span className="ml-1 text-[11px] font-normal text-[#00A174]">
                    （依平面圖方位記號推算）
                  </span>
                </span>
              ) : (
                displayDirection
              )
            ) : (
              "未於圖紙載明"
            )}
          </dd>
        </div>
        {isSpecialSale && extracted?.buildingArea && (
          <div className="col-span-2 border-t border-[#DDE3DF] pt-2">
            <dt className="text-[#66736C]">各樓層面積明細</dt>
            <dd className="font-bold text-[#1A2A22]">{extracted.buildingArea}</dd>
          </div>
        )}
        {isSpecialSale && extracted?.roadDetails && (
          <div className="col-span-2 border-t border-[#DDE3DF] pt-2">
            <dt className="text-[#66736C]">接道與建築限制</dt>
            <dd className="font-bold text-[#1A2A22]">{extracted.roadDetails}</dd>
          </div>
        )}
        {isSpecialSale && extracted?.buildingCondition && (
          <div className="col-span-2 border-t border-[#DDE3DF] pt-2">
            <dt className="text-[#66736C]">建物完成／翻新進度</dt>
            <dd className="font-bold text-[#1A2A22]">{extracted.buildingCondition}</dd>
          </div>
        )}
      </dl>

      {extracted?.floorPlanDetails && (
        <div className="mt-3 border-t border-[#DDE3DF] pt-3 text-xs leading-relaxed">
          <p className="font-bold text-[#1A2A22]">格局圖分析（間取り・配置図）</p>
          <p className="mt-1 whitespace-pre-line break-words text-[#3F5147]">{extracted.floorPlanDetails}</p>
        </div>
      )}

      {/* 交通資訊・最寄り駅路線與徒步 */}
      {!isSpecialSale && extracted?.optionalFacilities && <div className="mt-3 border-t border-[#DDE3DF] pt-3 text-xs leading-relaxed">
        <p className="font-bold text-[#1A2A22]">停車／選配設施（非固定管修費）</p>
        <p className="mt-1 whitespace-pre-line break-words text-[#3F5147]">{extracted.optionalFacilities}</p>
        <p className="mt-1 text-[11px] text-[#66736C]">空位與月費依管理單位確認，未加計至每戶固定管修費。</p>
      </div>}

      {/* 特別買賣注意事項提醒 */}
      {isSpecialSale && (
        <div className="mt-3.5 border-t border-[#DDE3DF] pt-3">
          <div className="flex items-start gap-2.5 border border-[#DDE3DF] bg-[#F5F8F6] p-3 text-xs leading-relaxed text-[#1A2A22]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#00A174]" />
            <div className="space-y-1">
              <p className="font-bold text-[#00A174]">{specialSale.kindLabel}核對注意事項：</p>
              <ul className="list-disc space-y-0.5 pl-4 text-[11px] text-[#3F5147]">
                <li>售價按建物面積換算的單價不等於建物單獨估值，需核對土地權利與價款分配。</li>
                <li>修繕、保險與稅費需自行編列；未載管理費不代表持有成本為零。</li>
                <li>道路寬度、接道長度、私道與退縮面積須分別核對，不能僅憑圖紙判定可重建。</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      <TransitStationChips stationItems={stationItems} locationContext={locationContext} />

      {/* 圖紙確認設備與公設規格 */}
      {equipmentList.length > 0 && (
        <div className="mt-3.5 border-t border-[#DDE3DF] pt-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#1A2A22]">圖紙設備與建物規格</span>
              <span className="inline-flex items-center gap-1 border border-[#9EE2CF] bg-[#E6F6F1] px-1.5 py-0.5 text-[10px] font-medium text-[#00A174]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00A174]" />
                綠底：關鍵加分設備
              </span>
            </div>
            <span className="text-[10px] text-[#66736C]">
              共確認 {equipmentList.length} 項圖紙設備
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[...equipmentList]
              .sort((a, b) => Number(Boolean(b.highlight)) - Number(Boolean(a.highlight)))
              .map((item, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center gap-1 border px-2 py-1 text-[11px] transition-colors ${item.highlight
                      ? "border-[#9EE2CF] bg-[#E6F6F1] font-bold text-[#00A174]"
                      : "border-[#DDE3DF] bg-white text-[#3F5147]"
                    }`}
                  title={item.note ? `${item.nameZh}（${item.note}） 原文：${item.rawJa}` : `原文：${item.rawJa}`}
                >
                  <span className={item.highlight ? "font-bold text-[#00A174]" : "text-[#8A9590]"}>✓</span>
                  <span>{item.nameZh}</span>
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  </div>);
}
