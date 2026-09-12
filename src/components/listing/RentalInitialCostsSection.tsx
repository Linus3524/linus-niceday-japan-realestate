import {
ChevronDown,
ChevronUp,
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
        <span className="text-[10px] text-[#66736C]">
          依圖紙費用表、租約特約與常態行情精算
        </span>
      </div>

      {/* 總額預估 Banner */}
      <div className="flex flex-col justify-between gap-5 border border-[#DDE3DF] bg-[#F5F8F6] p-4 sm:flex-row sm:items-center sm:gap-8">
        <div className="min-w-0 sm:w-[78%]">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-bold text-[#007D5A]">簽約入住預估總費用</p>
            <span className={`inline-flex items-center border px-2 py-0.5 text-[11px] font-bold ${initialCost.level === "low" ? "border-[#9EE2CF] bg-[#E6F6F1] text-[#007D5A]" : initialCost.level === "high" ? "border-[#E94E2B] bg-[#FBDFD2] text-[#B13818]" : "border-[#DDE3DF] bg-white text-[#3F5147]"}`}>
              行情對照：{initialCost.levelText}
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-[#1A2A22] md:text-3xl">
            {formatYen(initialCost.totalMin)} ～ {formatYen(initialCost.totalMax)}
          </p>
          <p className="mt-2.5 text-xs leading-relaxed text-[#3F5147]">
            約相當於月總租金的 <strong className="font-bold text-[#007D5A]">{initialCost.monthsMultipleMin} ～ {initialCost.monthsMultipleMax} 倍</strong>（取決於實際起租日與保證會社方案）
          </p>
        </div>

        <button
          type="button" aria-expanded={showInitialCostDetails} onClick={() => setShowInitialCostDetails(!showInitialCostDetails)}
          className="flex w-28 shrink-0 self-start items-center justify-center gap-1.5 whitespace-nowrap border border-[#007D5A] bg-white px-4 py-2 text-xs font-bold text-[#007D5A] transition-colors hover:bg-[#E6F6F1] cursor-pointer sm:self-center">
          {showInitialCostDetails ? (
            <>
              <span>收合明細</span>
              <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              <span>展開明細</span>
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </button>
      </div>

      {/* 項目逐筆拆解明細表格 */}
      {showInitialCostDetails && (
        <div className="space-y-2">
          {/* 備註原本在窄螢幕整欄隱藏、改成表格下方的條列，結果金額與說明被拆到兩個地方看。
                          改成永遠留在同一列，表格給最小寬度讓手機用左右滑的看完整。 */}
          <div className="overflow-x-auto border border-[#DDE3DF]">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="border-b border-[#DDE3DF] bg-[#F5F8F6] text-[#66736C]">
                <tr>
                  <th className="p-2.5 font-bold whitespace-nowrap shrink-0">費用項目</th>
                  <th className="p-2.5 text-center font-bold whitespace-nowrap w-[76px]">依據來源</th>
                  <th className="p-2.5 text-right font-bold whitespace-nowrap w-[96px]">預估金額</th>
                  <th className="p-2.5 font-bold min-w-[320px]">備註說明</th>
                </tr>
              </thead>
              <tbody className="divide-y border-[#DDE3DF]">
                {initialCost.items.map(item => (
                  <tr key={item.id} className="hover:bg-[#F5F8F6]">
                    <td className="p-2.5 font-bold text-[#1A2A22] whitespace-nowrap">{item.name}</td>
                    <td className="p-2.5 text-center whitespace-nowrap">
                      {item.isFromFlyer ? (
                        <span className="inline-block whitespace-nowrap border border-[#9EE2CF] bg-[#E6F6F1] px-2 py-0.5 text-[10px] font-bold text-[#007D5A]">
                          圖紙載明
                        </span>
                      ) : (
                        <span className="inline-block whitespace-nowrap border border-[#DDE3DF] bg-[#F5F8F6] px-2 py-0.5 text-[10px] font-medium text-[#66736C]">
                          常態預估
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 text-right font-bold text-[#1A2A22] whitespace-nowrap tabular-nums">
                      {item.isUnknown ? "待確認，未計入" : formatYen(item.amount)}
                    </td>
                    <td className="p-2.5 text-[11px] leading-relaxed text-[#66736C]">
                      {item.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-[10px] text-[#8A9590] md:hidden">※ 表格可左右滑動，查看預估金額與備註說明。</p>
        </div>
      )}

      {/* 簽約與初期費用提醒 */}
      {initialCostTips.length > 0 && (
        <div className="border border-[#EAB879] bg-[#FEF3C7] p-4 text-xs leading-relaxed">
          <div className="mb-1.5 flex items-center gap-1.5 font-bold text-[#D97706]">
            <Info className="h-4 w-4 text-[#D97706]" />
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
