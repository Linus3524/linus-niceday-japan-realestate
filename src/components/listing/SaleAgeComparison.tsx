import type { ListingHealthCheckModel } from '../../hooks/useListingHealthCheckController';
import { ageBandLabel } from '../../lib/listing/formatters';
import {
buildAgeBandPriceScale
} from '../../lib/listing/saleMarketPresentation';

interface Props {
  c: NonNullable<ListingHealthCheckModel["effectiveMlitComparison"]>;
}
export function SaleAgeComparison({ c }: Props) {
  return (<>{c.ageBandComparison && c.ageBandComparison.length >= 2 && (() => {
              const { rows, priceLevel } = buildAgeBandPriceScale(c);
              return (
                <div className="mt-4 border border-[#DDE3DF] bg-white p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pb-2.5">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-[#1A2A22]">
                      屋齡帶價格對照
                      <span className="border border-[#7DD3FC] bg-[#E0F2FE] px-1.5 py-0.5 text-[9px] font-bold text-[#0284C7]">成交資料</span>
                    </span>
                    <span className="text-[10px] text-[#8A9590]">
                      {c.district}・{c.layout}　同區同房型的實際成交㎡單價
                    </span>
                  </div>
                  <div className="hidden border-y border-[#DDE3DF] bg-[#F5F8F6] px-2 py-2 text-[10px] font-bold text-[#8A9590] sm:grid sm:grid-cols-[1fr_4.5rem_7rem_5rem_5.5rem] sm:items-center sm:gap-x-3">
                    <span>屋齡帶</span>
                    <span className="text-right">樣本數</span>
                    <span className="text-right">成交單價</span>
                    <span className="text-right">相對本案</span>
                    <span className="text-center">價位等級</span>
                  </div>
                  <dl className="divide-y divide-[#DDE3DF] border-b border-[#DDE3DF]">
                    {rows.map(r => {
                      const tone = r.isCurrent ? "#8A9590" : r.diffPercent > 0 ? "#007D5A" : "#B13818";
                      const level = priceLevel(r.medianSqmPriceYen);
                      return (
                        <div
                          key={r.ageBand}
                          className={`grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 px-2 py-3 sm:grid-cols-[1fr_4.5rem_7rem_5rem_5.5rem] sm:gap-y-0 ${r.isCurrent ? "bg-[#F5F8F6]" : ""
                            }`}
                        >
                          <dt className="col-start-1 row-start-1 flex min-w-0 items-center gap-2">
                            <span className={`text-xs ${r.isCurrent ? "font-black text-[#1A2A22]" : "font-bold text-[#3F5147]"}`}>
                              {ageBandLabel(r.ageBand)}
                            </span>
                            {r.isCurrent && (
                              <span className="shrink-0 border border-[#9EE2CF] bg-[#E6F6F1] px-1.5 py-0.5 text-[9px] font-bold text-[#007D5A]">
                                本案
                              </span>
                            )}
                          </dt>
                          <dd className="col-start-2 row-start-2 justify-self-end font-mono text-[10px] tabular-nums text-[#8A9590] sm:col-start-2 sm:row-start-1 sm:text-right">
                            {r.sampleCount} 筆
                          </dd>
                          <dd className="col-start-1 row-start-2 font-mono text-xs font-bold tabular-nums text-[#1A2A22] sm:col-start-3 sm:row-start-1 sm:text-right">
                            {(r.medianSqmPriceYen / 10000).toFixed(1)} 萬/㎡
                          </dd>
                          <dd
                            className="col-start-2 row-start-1 justify-self-end font-mono text-xs font-bold tabular-nums sm:col-start-4 sm:row-start-1 sm:text-right"
                            style={{ color: tone }}
                          >
                            {r.isCurrent ? "基準" : `${r.diffPercent > 0 ? "+" : "−"}${Math.abs(r.diffPercent).toFixed(1)}%`}
                          </dd>
                          <dd
                            className="col-start-1 row-start-3 flex items-center gap-1 sm:col-start-5 sm:row-start-1 sm:justify-self-center"
                            title={`價位等級 ${level} / 5`}
                          >
                            {[0, 1, 2, 3, 4].map(n => (
                              <span
                                key={n}
                                className="h-2.5 w-2.5 border"
                                style={{
                                  borderColor: n < level ? tone : "#DDE3DF",
                                  backgroundColor: n < level ? tone : "transparent",
                                }}
                              />
                            ))}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                  <p className="mt-2.5 text-[10px] leading-relaxed text-[#8A9590]">
                    ※ 同一時點、不同建物的橫向比較，反映本區屋齡造成的價差，不是本案未來的價格預測。
                  </p>
                </div>
              );
            })()}</>);
}
