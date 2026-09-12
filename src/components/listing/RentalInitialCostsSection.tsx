import { SourceBadge } from "../ui/SourceBadge";
import { CostSummary } from "../ui/CostSummary";
import { informationStyle } from "../../lib/ui/informationStyles";
import { DetailsToggle } from "../ui/DetailsToggle";
import {
Info,
Wallet
} from "lucide-react";
import type { ListingHealthCheckModel } from '../../hooks/useListingHealthCheckController';
import { formatYen } from '../../lib/listing/formatters';

interface RentalInitialCostsSectionProps {
  model: Pick<
    ListingHealthCheckModel,
    | "initialCost"
    | "showInitialCostDetails"
    | "setShowInitialCostDetails"
    | "initialCostTips"
  >;
}

export function RentalInitialCostsSection({ model }: RentalInitialCostsSectionProps) {
  const { initialCost, showInitialCostDetails, setShowInitialCostDetails, initialCostTips } = model;
  return (<>{initialCost && (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#007D5A]">
          <Wallet className="h-4 w-4 text-[#007D5A]" />
          <span>初期費用試算與分析</span>
        </div>
        <span className={informationStyle.source}>
          依圖紙費用表、租約特約與常態行情精算
        </span>
      </div>

      {/* 總額預估 Banner */}
      <CostSummary action={<DetailsToggle expanded={showInitialCostDetails} onToggle={() => setShowInitialCostDetails(!showInitialCostDetails)} />}>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-bold text-[#007D5A]">簽約入住預估總費用</p>
            <span className={`inline-flex items-center border px-2 py-0.5 text-[11px] font-bold ${initialCost.level === "low" ? "border-[#9EE2CF] bg-[#E6F6F1] text-[#007D5A]" : initialCost.level === "high" ? "border-[#E94E2B] bg-[#FBDFD2] text-[#B13818]" : "border-[#DDE3DF] bg-white text-[#3F5147]"}`}>
              行情對照：{initialCost.levelText}
            </span>
          </div>
          <p className={`mt-2 ${informationStyle.amount}`}>
            {formatYen(initialCost.totalMin)} ～ {formatYen(initialCost.totalMax)}
          </p>
          <p className="mt-2.5 text-xs leading-relaxed text-[#3F5147]">
            約相當於月總租金的 <strong className="font-bold text-[#007D5A]">{initialCost.monthsMultipleMin} ～ {initialCost.monthsMultipleMax} 倍</strong>（取決於實際起租日與保證會社方案）
          </p>
      </CostSummary>

      {/* 項目逐筆拆解明細表格 */}
      {showInitialCostDetails && (
        <div className="space-y-2">
          {/* 備註原本在窄螢幕整欄隱藏、改成表格下方的條列，結果金額與說明被拆到兩個地方看。
                          改成永遠留在同一列，表格給最小寬度讓手機用左右滑的看完整。 */}
          <div className="overflow-x-auto border border-[#DDE3DF]">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className={informationStyle.tableHead}>
                <tr>
                  <th className="p-2.5 font-bold whitespace-nowrap shrink-0">費用項目</th>
                  <th className="p-2.5 text-center font-bold whitespace-nowrap w-[76px]">依據來源</th>
                  <th className="p-2.5 text-right font-bold whitespace-nowrap w-[96px]">預估金額</th>
                  <th className="p-2.5 font-bold min-w-[320px]">備註說明</th>
                </tr>
              </thead>
              <tbody className={informationStyle.tableBody}>
                {initialCost.items.map(item => (
                  <tr key={item.id} className="hover:bg-[#F5F8F6]">
                    <td className="p-2.5 font-bold text-[#1A2A22] whitespace-nowrap">{item.name}</td>
                    <td className="p-2.5 text-center whitespace-nowrap">
                      {item.isFromFlyer ? (
                        <SourceBadge>
                          圖紙載明
                        </SourceBadge>
                      ) : (
                        <SourceBadge estimated>
                          常態預估
                        </SourceBadge>
                      )}
                    </td>
                    <td className={informationStyle.detailAmount}>
                      {item.isUnknown ? "待確認，未計入" : formatYen(item.amount)}
                    </td>
                    <td className={`p-2.5 ${informationStyle.note}`}>
                      {item.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-[11px] leading-relaxed text-[#66736C] md:hidden">※ 表格可左右滑動，查看預估金額與備註說明。</p>
        </div>
      )}

      {/* 簽約與初期費用提醒 */}
      {initialCostTips.length > 0 && (
        <div className={informationStyle.caution}>
          <div className={`mb-1.5 ${informationStyle.cautionTitle}`}>
            <Info className="h-4 w-4 text-[#7A5A1F]" />
            <span>簽約與初期費用提醒：</span>
          </div>
          <ul className="space-y-1.5 pl-5 list-disc text-[#1A2A22]">
            {initialCostTips.map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )}</>);
}
