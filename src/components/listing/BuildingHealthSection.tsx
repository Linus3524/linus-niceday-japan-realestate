import {
Building,
Calculator,
Coins,
ShieldAlert,
ShieldCheck,
Users,
Wallet,
Wrench
} from "lucide-react";
import type { ListingHealthCheckModel } from '../../hooks/useListingHealthCheckController';
import { formatYen } from '../../lib/listing/formatters';

interface BuildingHealthSectionProps {
  model: Pick<ListingHealthCheckModel, "saleAnalysis">;
}

export function BuildingHealthSection({ model }: BuildingHealthSectionProps) {
  const { saleAnalysis } = model;
  return (<div className="space-y-3">
    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#007D5A]">
      <Wallet className="h-4 w-4 text-[#007D5A]" />
      <span>持有成本與建物狀態</span>
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      {/* 左側：每月固定持有負擔逐筆拆解 */}
      <div className="flex flex-col border border-[#DDE3DF] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DDE3DF] p-4">
          <p className="flex items-center gap-1.5 text-xs font-bold text-[#1A2A22]">
            <Coins className="h-3.5 w-3.5 text-[#1A2A22]" />
            每月持有成本明細
          </p>
          <span className="border border-[#DDE3DF] bg-[#F5F8F6] px-2 py-1 text-[11px] font-bold text-[#1A2A22]">
            月支出合計 {formatYen(saleAnalysis.monthlyHoldingCosts.totalMonthlyHoldingCost)}
          </span>
        </div>

        <div className="flex-1 p-4">
          <div className="divide-y divide-[#DDE3DF] border border-[#DDE3DF] bg-[#F5F8F6]">
            {saleAnalysis.monthlyHoldingCosts.items.map((item, idx) => (
              <div key={idx} className="flex items-start justify-between gap-3 p-3">
                <div className="flex min-w-0 items-start gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#DDE3DF] bg-white text-[#3F5147]">
                    {/^修繕/.test(item.name) ? <Wrench className="h-3.5 w-3.5" /> : <Building className="h-3.5 w-3.5" />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#1A2A22]">{item.name}</p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-[#66736C]">{item.note}</p>
                  </div>
                </div>
                <span className="shrink-0 text-sm font-black tabular-nums text-[#1A2A22]">
                  {formatYen(item.amount)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 border border-[#DDE3DF] bg-[#F5F8F6] p-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-[#1A2A22] text-white">
                <Calculator className="h-3.5 w-3.5" />
              </span>
              <div>
                <p className="text-xs font-bold text-[#1A2A22]">全年支出成本（12 個月）</p>
                <p className="mt-0.5 text-[10px] text-[#66736C]">管理費與修繕積立金等固定支出</p>
              </div>
            </div>
            <div className="text-right">
              <span className="shrink-0 text-base font-black tabular-nums text-[#1A2A22]">
                {formatYen(saleAnalysis.monthlyHoldingCosts.totalMonthlyHoldingCost * 12)}
              </span>
              <span className="text-xs font-bold text-[#66736C]"> / 年</span>
            </div>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-[#8A9590]">
            ※ 不含每年 5〜6 月由地方政府課徵之固定資產稅・都市計畫稅（固都稅）。
          </p>
        </div>
      </div>

      {/* 右側：大樓修繕積立金水位與戶數規模風險診斷 */}
      <div className="flex flex-col border border-[#DDE3DF] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DDE3DF] p-4">
          <p className="flex items-center gap-1.5 text-xs font-bold text-[#1A2A22]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#1A2A22]" />
            修繕積立金與大樓體質
          </p>
          <span
            className={`border px-2 py-1 text-[11px] font-bold ${saleAnalysis.buildingHealth.reserveHealthLevel === "healthy"
                ? "border-[#9EE2CF] bg-[#E6F6F1] text-[#007D5A]"
                : saleAnalysis.buildingHealth.reserveHealthLevel === "inadequate"
                  ? "border-[#EAB879] bg-[#FEF3C7] text-[#D97706]"
                  : "border-[#DDE3DF] bg-[#F5F8F6] text-[#3F5147]"}`}
          >
            {saleAnalysis.buildingHealth.reserveHealthText}
          </span>
        </div>

        <div className="flex-1 space-y-3 p-4">
          {/* 每平米修繕金比率 */}
          <div className="border border-[#DDE3DF] bg-[#F5F8F6] p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#DDE3DF] bg-white text-[#3F5147]">
                  <Wrench className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#1A2A22]">每平米每月修繕積立金</p>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-[#007D5A]">
                    國土交通省長期修繕計畫提撥基準：{saleAnalysis.buildingHealth.guidelineRange || "200 〜 350 円/㎡/月"}
                  </p>
                </div>
              </div>
              <span className="shrink-0 text-base font-black tabular-nums text-[#1A2A22]">
                {saleAnalysis.buildingHealth.reservePerSqm
                  ? `¥${saleAnalysis.buildingHealth.reservePerSqm.toLocaleString()} / ㎡` : "—"}
              </span>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-[#3F5147]">
              {saleAnalysis.buildingHealth.reserveHealthNote}
            </p>
            {saleAnalysis.buildingHealth.feeRatioNote && (
              <p className="mt-2 border-t border-[#DDE3DF] pt-2 text-[11px] leading-relaxed text-[#66736C]">
                {saleAnalysis.buildingHealth.feeRatioNote}
              </p>
            )}
          </div>

          {/* 戶數規模分析 */}
          <div className="border border-[#DDE3DF] bg-[#F5F8F6] p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#DDE3DF] bg-white text-[#3F5147]">
                  <Users className="h-3.5 w-3.5" />
                </span>
                <p className="text-xs font-bold text-[#1A2A22]">社區總戶數規模效應</p>
              </div>
              <span className="shrink-0 text-xs font-bold text-[#1A2A22]">
                {saleAnalysis.buildingHealth.scaleRiskText}
              </span>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-[#3F5147]">
              {saleAnalysis.buildingHealth.scaleRiskNote}
            </p>
          </div>

          {/* 維護亮點與優勢認證 */}
          {saleAnalysis.buildingHealth.specialStrengths.length > 0 && (
            <div className="space-y-1.5 border border-[#9EE2CF] bg-[#E6F6F1] p-3">
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#007D5A]">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                大樓優勢認證
              </span>
              {saleAnalysis.buildingHealth.specialStrengths.map((str, i) => (
                <p key={i} className="text-[11px] leading-relaxed text-[#1A2A22]">
                  • {str}
                </p>
              ))}
            </div>
          )}

          {/* 體質未爆彈與注意事項 */}
          {saleAnalysis.buildingHealth.specialCautions && saleAnalysis.buildingHealth.specialCautions.length > 0 && (
            <div className="space-y-1.5 border border-[#EAB879] bg-[#FEF3C7] p-3">
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#D97706]">
                <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                大樓體質留意事項
              </span>
              {saleAnalysis.buildingHealth.specialCautions.map((caution, i) => (
                <p key={i} className="text-[11px] leading-relaxed text-[#78350F]">
                  {caution}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  </div>);
}
