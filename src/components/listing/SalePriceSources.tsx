import { SourceBadge } from "../ui/SourceBadge";
import { informationStyle } from "../../lib/ui/informationStyles";
import type { ListingHealthCheckModel } from '../../hooks/useListingHealthCheckController';
import { ageBandLabel } from '../../lib/listing/formatters';
import type { buildSaleMarketPresentation } from "../../lib/listing/saleMarketPresentation";

interface Props {
  c: NonNullable<ListingHealthCheckModel["effectiveMlitComparison"]>;
  parsedArea: ListingHealthCheckModel["parsedArea"];
  man: ReturnType<typeof buildSaleMarketPresentation>["man"];
  officialMan: ReturnType<typeof buildSaleMarketPresentation>["officialMan"];
  officialDiffPercent: ReturnType<typeof buildSaleMarketPresentation>["officialDiffPercent"];
  isSpecialSale: boolean;
  listingRangeText: ReturnType<typeof buildSaleMarketPresentation>["listingRangeText"];
  listingMan: ReturnType<typeof buildSaleMarketPresentation>["listingMan"];
}
export function SalePriceSources({ c, parsedArea, man, officialMan, officialDiffPercent, isSpecialSale, listingRangeText, listingMan }: Props) {
  return (<><div className="grid gap-3 sm:grid-cols-2">
              {/* 左卡：國土交通省 實價成交換算基準 */}
              <div className="flex flex-col justify-between border border-[#DDE3DF] bg-[#F5F8F6] p-4">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DDE3DF] pb-2">
                    <span className="text-xs font-bold text-[#007D5A]">國土交通省 實價成交換算基準</span>
                    <SourceBadge>
                      {typeof c.sampleCount === "number" ? `${c.sampleCount.toLocaleString()} 筆成約` : "實際成交"}
                    </SourceBadge>
                  </div>
                  {typeof c.medianSqmPriceYen === "number" && !isNaN(c.medianSqmPriceYen) && c.medianSqmPriceYen > 0 && parsedArea ? (
                    <div className="mt-3">
                      <p className="text-[11px] text-[#66736C]">成交換算公式：</p>
                      <p className="mt-0.5 font-mono text-xs font-bold text-[#1A2A22]">
                        {(c.medianSqmPriceYen / 10000).toFixed(1)} 萬/㎡ × {parsedArea}㎡ = {man(officialMan)} 萬円
                      </p>
                    </div>
                  ) : null}
                  <p className={`mt-2 ${informationStyle.source}`}>
                    比較基準：{c.region}{c.district}・{c.layout}
                    {c.marketAgeBand ? `・${ageBandLabel(c.marketAgeBand)}` : ""}
                    {c.periodStart && c.periodEnd ? `（${c.periodStart}～${c.periodEnd}）` : ""}
                  </p>
                </div>
                <div className="mt-3.5 border-t border-[#DDE3DF] pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-[#66736C]">本案開價 vs 成交基準</span>
                  <span className={`border px-2 py-0.5 text-xs font-bold tabular-nums ${typeof officialDiffPercent !== "number" || isNaN(officialDiffPercent)
                      ? "border-[#DDE3DF] bg-white text-[#1A2A22]"
                      : officialDiffPercent > 0
                        ? "border-[#FECDD3] bg-[#FFF1F0] text-[#B13818]"
                        : officialDiffPercent < 0
                          ? "border-[#9EE2CF] bg-[#E6F6F1] text-[#007D5A]"
                          : "border-[#DDE3DF] bg-[#F5F8F6] text-[#8A9590]"
                    }`}>
                    {typeof officialDiffPercent === "number" && !isNaN(officialDiffPercent)
                      ? officialDiffPercent > 0
                        ? `▲ 溢價 ${officialDiffPercent.toFixed(1)}%`
                        : officialDiffPercent < 0
                          ? `▼ 折讓 ${Math.abs(officialDiffPercent).toFixed(1)}%`
                          : "等同基準"
                      : "—"}
                  </span>
                </div>
              </div>

              {/* 右卡：在售競品交叉驗證 */}
              <div className="flex flex-col justify-between border border-[#DDE3DF] bg-[#F5F8F6] p-4">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DDE3DF] pb-2">
                    <span className="text-xs font-bold text-[#1A2A22]">{isSpecialSale ? "At Home 在售競品交叉驗證" : "市場同規模在售行情比對"}</span>
                    <SourceBadge>
                      {listingRangeText ? "校準開價" : "公開牌價"}
                    </SourceBadge>
                  </div>
                  {listingMan !== null ? (
                    <div className="mt-3">
                      <p className="text-[11px] text-[#66736C]">{isSpecialSale ? "同區同格局在售牌價平均：" : "同規模在售行情中位（已按本案條件校準）："}</p>
                      <p className="mt-0.5 font-mono text-sm font-bold text-[#1A2A22]">
                        {man(listingMan)} 萬円
                      </p>
                      {listingRangeText && (
                        <p className="mt-1 text-[11px] font-semibold text-[#3F5147]">
                          同級在售區間：{listingRangeText}
                        </p>
                      )}
                    </div>
                  ) : null}
                  <p className={`mt-2 ${informationStyle.source}`}>
                    {c.listingBenchmarkSourceLabel || "刊登價為賣方開價，非實際成交價，通常保留議價空間"}
                  </p>
                </div>
                <div className="mt-3.5 border-t border-[#DDE3DF] pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-[#66736C]">本案開價 vs 在售行情</span>
                  <span className={`border px-2 py-0.5 text-xs font-bold tabular-nums ${typeof c.listingDiffPercent !== "number" || isNaN(c.listingDiffPercent)
                      ? "border-[#DDE3DF] bg-white text-[#1A2A22]"
                      : c.listingDiffPercent > 0
                        ? "border-[#FECDD3] bg-[#FFF1F0] text-[#B13818]"
                        : c.listingDiffPercent < 0
                          ? "border-[#9EE2CF] bg-[#E6F6F1] text-[#007D5A]"
                          : "border-[#DDE3DF] bg-[#F5F8F6] text-[#8A9590]"
                    }`}>
                    {typeof c.listingDiffPercent === "number" && !isNaN(c.listingDiffPercent)
                      ? c.listingDiffPercent > 0
                        ? `▲ 溢價 ${c.listingDiffPercent.toFixed(1)}%`
                        : c.listingDiffPercent < 0
                          ? `▼ 折讓 ${Math.abs(c.listingDiffPercent).toFixed(1)}%`
                          : "等同在售中位"
                      : "—"}
                  </span>
                </div>
              </div>
            </div></>);
}
