import {
CheckCircle2,
Info,
ShieldCheck
} from "lucide-react";
import type { ListingHealthCheckModel } from '../../hooks/useListingHealthCheckController';
import {
translateOccupancyStatus,
translateRenovationDetails
} from "../../lib/equipmentParser";
import { formatManagementSummary, formatYen } from '../../lib/listing/formatters';
import { saleOccupancy } from "../../lib/specialSaleAnalysis";

interface InvestmentSectionProps {
  model: Pick<ListingHealthCheckModel, "saleAnalysis" | "extracted">;
}

export function InvestmentSection({ model }: InvestmentSectionProps) {
  const { saleAnalysis, extracted } = model;
  return (<div className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#007D5A]">
        <ShieldCheck className="h-4 w-4 text-[#007D5A]" />
        <span>物件現況・投資回報率與自住法務要點</span>
      </div>
      <span className="text-[10px] text-[#66736C]">
        現況判定：{translateOccupancyStatus(saleAnalysis?.occupancyAssessment?.statusText)}
      </span>
    </div>
    {/* 兩張子卡直接當網格項目，不再多包一層外框（避免框中框） */}
    <div className="grid gap-4 lg:grid-cols-2">
      {/* 現況與收益性 */}
      <div className="border border-[#DDE3DF] bg-white p-4 sm:p-5">
        <p className="text-sm font-bold text-[#1A2A22]">現況使用與收益分析</p>

        {saleAnalysis?.occupancyAssessment?.status === "tenanted_investment" &&
          saleAnalysis?.occupancyAssessment?.investmentYield ? (
          <div className="mt-4 space-y-4 text-xs">
            <div className="border-l-[3px] border-[#00A174] bg-[#F5F8F6] px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-[#007D5A]">表面租金報酬率</span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-black leading-none text-[#007D5A] tabular-nums">
                      {typeof saleAnalysis.occupancyAssessment.investmentYield.grossYield === "number" && !isNaN(saleAnalysis.occupancyAssessment.investmentYield.grossYield)
                        ? `${saleAnalysis.occupancyAssessment.investmentYield.grossYield.toFixed(2)}%`
                        : "—"}
                    </span>
                  </div>
                </div>
                {typeof saleAnalysis.occupancyAssessment.investmentYield.netYieldEstimated === "number" && !isNaN(saleAnalysis.occupancyAssessment.investmentYield.netYieldEstimated) && (
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-[#1A2A22]">實質淨報酬率（預估 NOI）</span>
                    <div className="mt-1 flex items-baseline justify-end gap-1.5">
                      <span className="text-2xl font-black leading-none text-[#1A2A22] tabular-nums">
                        約 {saleAnalysis.occupancyAssessment.investmentYield.netYieldEstimated.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* NOI 營運收支速算拆解 */}
            {saleAnalysis.occupancyAssessment.investmentYield.breakdown && (
              <div className="border border-[#DDE3DF] bg-[#F5F8F6] p-3 space-y-2">
                <div className="flex items-center justify-between border-b border-[#DDE3DF] pb-1.5">
                  <span className="text-xs font-bold text-[#1A2A22]">年間常態營運收支試算（NOI 實質到手）</span>
                  <span className="text-[10px] text-[#66736C]">扣除持有維持費用</span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  {saleAnalysis.occupancyAssessment.investmentYield.breakdown.items.map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex items-baseline justify-between gap-2 py-0.5 ${item.type === "subtotal"
                          ? "border-t border-[#DDE3DF] pt-1.5 font-bold text-[#007D5A]"
                          : item.type === "deduction"
                            ? "text-[#3F5147]"
                            : "font-bold text-[#1A2A22]"
                        }`}
                    >
                      {/* 「固定資產稅・都市計畫稅（概算）」這種長標籤在手機上會撐出容器，
                                      允許在任意位置斷行才不會溢出。 */}
                      <div className="min-w-0 [overflow-wrap:anywhere]">
                        <span>{item.name}</span>
                        {item.note && (
                          <span className="ml-1 text-[10px] text-[#66736C]">（{item.note}）</span>
                        )}
                      </div>
                      <span className="shrink-0 tabular-nums font-medium">
                        {item.annualAmountYen >= 0 ? "" : "-"}
                        ¥{Math.abs(item.annualAmountYen).toLocaleString()} / 年
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-x-8 gap-y-3 px-1 text-xs">
              <div>
                <span className="text-[11px] text-[#66736C]">現況月租金收入</span>
                <p className="mt-1 font-bold text-[#1A2A22] tabular-nums">
                  {formatYen(saleAnalysis.occupancyAssessment.investmentYield.monthlyRentYen)} / 月
                </p>
              </div>
              <div>
                <span className="text-[11px] text-[#66736C]">現況年間租金總額</span>
                <p className="mt-1 font-bold text-[#1A2A22] tabular-nums">
                  {formatYen(saleAnalysis.occupancyAssessment.investmentYield.annualIncomeYen)} / 年
                </p>
              </div>
            </div>

            <p className="border-l-[3px] border-[#D95D39] bg-[#FBDFD2] px-4 py-3 text-[11px] leading-relaxed text-[#B13818]"><strong>帶租約物件注意事項：</strong>本物件為帶租約買賣（出租中），現有租客居住中，買方無法立即交屋自住。交屋時將全面承受現有普通賃貸借契約與押金返還義務。
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-2 text-xs">
            <div className=" border border-[#9EE2CF] bg-[#F5F8F6] p-3">
              <p className="font-bold text-[#007D5A]">
                {saleAnalysis?.occupancyAssessment?.status === "vacant"
                  ? (saleOccupancy(extracted || {}).renovating ? "現況空室／裝修中" : "現況空室，交屋條件待核對")
                  : saleAnalysis?.occupancyAssessment?.status === "occupied_owner" ? "現有屋主居住中（交屋期需協商）" : "現況未確認"}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#3F5147]">
                {saleAnalysis?.occupancyAssessment?.status === "vacant"
                  ? saleOccupancy(extracted || {}).note
                  : saleAnalysis?.occupancyAssessment?.status === "occupied_owner" ? "交屋時點需配合現屋主搬遷協商，請於簽約前確認賣方交屋寬限期（引渡猶予期日）。" : "圖紙未明確載明入住現況，請先確認是否有人居住與交屋條件。"}
              </p>
            </div>

            {extracted?.renovationDetails && (
              <div className=" border border-[#DDE3DF] bg-[#F5F8F6] p-2.5">
                <span className="font-bold text-[#1A2A22]">裝修與翻新內容（室內翻新履歷）：</span>
                <p className="mt-1 text-[11px] leading-relaxed text-[#3F5147]">
                  {translateRenovationDetails(extracted.renovationDetails)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 自住法務要點與住宅貸款減稅門檻 */}
      <div className="border border-[#DDE3DF] bg-white p-4 sm:p-5">
        <p className="text-sm font-bold text-[#1A2A22]">產權形式與住宅貸款減稅資格審查</p>

        <div className="mt-4 text-xs">
          {/* 住宅貸款減稅檢核 */}
          <div className={`px-4 py-3 ${saleAnalysis?.occupancyAssessment?.mortgageTaxEligible
              ? "border-l-[3px] border-[#00A174] bg-[#F5F8F6]"
              : "border border-[#EAB879] bg-[#FEF3C7]"
            }`}>
            <div className="flex items-start gap-2 font-bold">
              {saleAnalysis?.occupancyAssessment?.mortgageTaxEligible ? (
                <>
                  <CheckCircle2 className="mt-px h-4 w-4 shrink-0 text-[#007D5A]" />
                  <span className="text-[#007D5A]">符合住宅貸款減稅主要面積門檻（50㎡）</span>
                </>
              ) : (
                <>
                  <Info className="mt-px h-4 w-4 shrink-0 text-[#D97706]" />
                  <span className="text-[#D97706]">
                    {saleAnalysis?.occupancyAssessment?.mortgageTaxEligible === false
                      ? (saleAnalysis?.areaSqm && saleAnalysis.areaSqm >= 40 && saleAnalysis.areaSqm < 43
                        ? "壁芯臨限 40㎡（謄本內法極高機率未滿 40㎡ 不符減稅）"
                        : "專有面積未達 50㎡（自住節稅留意）")
                      : "自住住宅貸款減稅資格審查（待核對）"}
                  </span>
                </>
              )}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-[#3F5147]">
              {saleAnalysis?.occupancyAssessment?.mortgageTaxNote || "需核對買方自住用途、登記面積與其他適用條件。"}
            </p>
          </div>

          <dl className="mt-3 divide-y divide-[#E8ECE9]">
            {/* 土地權利 */}
            <div className="grid grid-cols-[120px_minmax(0,1fr)] items-start gap-4 py-2.5">
              <dt className="text-[#66736C]">土地權利形式</dt>
              <dd className="text-right font-bold text-[#1A2A22]">
                {extracted?.landRights || "所有權（所有権）"}
              </dd>
            </div>

            {/* 管理體制 */}
            <div className="grid grid-cols-[120px_minmax(0,1fr)] items-start gap-4 py-2.5">
              <dt className="text-[#66736C]">管理形態與公司</dt>
              <dd className="text-right font-bold leading-relaxed text-[#1A2A22]">
                {formatManagementSummary(extracted?.managementCompany, extracted?.managementStyle)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>

  </div>);
}
