import {
TrendingUp
} from "lucide-react";
import type { ListingHealthCheckModel } from '../../hooks/useListingHealthCheckController';
import type { buildSaleMarketPresentation } from "../../lib/listing/saleMarketPresentation";
import {
layoutSalePriceMarks
} from '../../lib/listing/saleMarketPresentation';

interface Props {
  isSpecialSale: boolean;
  specialComparison: ListingHealthCheckModel["specialComparison"];
  c: NonNullable<ListingHealthCheckModel["effectiveMlitComparison"]>;
  specialSale: ListingHealthCheckModel["specialSale"];
  priceMan: ReturnType<typeof buildSaleMarketPresentation>["priceMan"];
  saleAnalysis: ListingHealthCheckModel["saleAnalysis"];
  benchmarks: { key: string; label: string; shortLabel: string; badge?: string; value: number; lowMan?: number | null; highMan?: number | null; rangeText?: string | null; tone: string; diff: number | null | undefined; note: string; }[];
  sqmOf: ReturnType<typeof buildSaleMarketPresentation>["sqmOf"];
  hasFairRange: boolean;
  man: ReturnType<typeof buildSaleMarketPresentation>["man"];
  fairLow: ReturnType<typeof buildSaleMarketPresentation>["fairLow"];
  fairHigh: ReturnType<typeof buildSaleMarketPresentation>["fairHigh"];
  pos: ReturnType<typeof buildSaleMarketPresentation>["pos"];
  fairState: { text: string; box: string; dot: string; short: string | null; accent: string; };
  officialDiffPercent: ReturnType<typeof buildSaleMarketPresentation>["officialDiffPercent"];
}
export function SalePricePosition({ isSpecialSale, specialComparison, c, specialSale, priceMan, saleAnalysis, benchmarks, sqmOf, hasFairRange, man, fairLow, fairHigh, pos, fairState, officialDiffPercent }: Props) {
  return (<><div className="space-y-3">
          {/* 區塊頂部標題列：與租賃圖紙各模組同一層級（卡片外 eyebrow，無圖示方塊） */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#007D5A]">
              <TrendingUp className="h-4 w-4 text-[#007D5A]" />
              <span>{isSpecialSale ? "同類物件價格定位" : "價格定位"}</span>
            </div>
            <span className="text-[10px] text-[#66736C]">
              {isSpecialSale
                ? `${specialComparison?.market || c.district}・${c.layout}・${specialSale.kindLabel}`
                : `${c.district}・${c.layout}・中古公寓`}
            </span>
          </div>

          {/* 兩張子卡直接當網格項目，不再多包一層外框（避免框中框） */}
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            {/* ── 左：本案開價 ＋ 三方對照 ＋ 價格區間軸 ── */}
            <div className="flex flex-col justify-between border border-[#DDE3DF] bg-white p-4 sm:p-5">
              {/* 三欄等高並排：本案開價 ＋ 兩個行情基準，各自帶色線。 */}
              <div className="grid items-stretch gap-4 sm:grid-cols-3">
                <div className="min-w-0 self-stretch border-l-[3px] border-[#007D5A] pl-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-bold text-[#1A2A22]">本案開價</p>
                    <span className="border border-[#9EE2CF] bg-[#E6F6F1] px-2 py-0.5 text-[11px] font-bold text-[#007D5A]">
                      {isSpecialSale ? specialSale.kindLabel : "中古公寓"}
                    </span>
                  </div>
                  <p className="mt-1 flex flex-wrap items-baseline gap-x-1">
                    <span className="text-[34px] font-black leading-[1.05] tracking-tight text-[#1A2A22] tabular-nums lg:text-[40px]">
                      {priceMan.toLocaleString()}
                    </span>
                    <span className="text-base font-bold text-[#3F5147]">萬円</span>
                  </p>
                  <div className="mt-2 space-y-0.5 text-xs text-[#66736C]">
                    {saleAnalysis?.tsuboAndSqm?.sqmPriceMan != null && !isNaN(saleAnalysis.tsuboAndSqm.sqmPriceMan) && (
                      <p className="tabular-nums">每㎡ {(saleAnalysis.tsuboAndSqm.sqmPriceMan ?? 0).toFixed(1)} 萬円</p>
                    )}
                    {saleAnalysis.areaSqm && (
                      <p className="tabular-nums">
                        {specialSale.kind === "land" ? "土地面積" : isSpecialSale ? "建物總面積" : "專有面積"} {saleAnalysis.areaSqm} ㎡
                      </p>
                    )}
                  </div>
                </div>

                {benchmarks.map(item => (
                  <div
                    key={item.key}
                    className="min-w-0 self-stretch border-l-[3px] pl-3"
                    style={{ borderColor: item.tone }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <p className="text-sm font-bold" style={{ color: item.tone }}>
                        {item.label}
                      </p>
                      {item.badge && (
                        <span
                          className={`border px-1.5 py-0.5 text-[10px] font-bold ${item.key === "official"
                              ? "border-[#BAE6FD] bg-[#F0F9FF] text-[#0284C7]"
                              : "border-[#FED7AA] bg-[#FFF7ED] text-[#D97706]"
                            }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 flex flex-wrap items-baseline gap-x-1">
                      <span className="text-[26px] font-black leading-[1.05] tracking-tight text-[#1A2A22] tabular-nums lg:text-[30px]">
                        {item.value.toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-[#3F5147]">萬円</span>
                    </p>
                    {item.rangeText && (
                      <p className="mt-1.5 text-xs text-[#66736C]">
                        區間 <span className="font-semibold text-[#1A2A22] tabular-nums">{item.rangeText}</span>
                      </p>
                    )}
                    {sqmOf(item.value) && (
                      <p className={`${item.rangeText ? "mt-0.5 text-[11px]" : "mt-2 text-xs"} tabular-nums text-[#66736C]`}>
                        每㎡ {item.rangeText ? "約 " : ""}{sqmOf(item.value)} 萬円
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* 價格區間軸 ＋ 基準備註（共同構成底部區塊，高度飽滿無大塊死白） */}
              {hasFairRange && (
                <div className="mt-5 border-t border-[#E8ECE9] pt-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className="text-sm font-black text-[#1A2A22]">該區域同類物件合理價格區間</p>
                    <p className="border border-[#DDE3DF] bg-[#F5F8F6] px-2.5 py-1 text-xs font-black tabular-nums text-[#1A2A22]">
                      {man(fairLow)} 〜 {man(fairHigh)} 萬円
                    </p>
                  </div>

                  <div className="mt-4 px-4 pt-12 sm:px-6">
                    <div className="relative h-3 w-full bg-[#E1E7E4]">
                      <div
                        className="absolute inset-y-0 bg-[#CFEFE5]"
                        style={{ left: `${pos(fairLow as number)}%`, width: `${pos(fairHigh as number) - pos(fairLow as number)}%` }}
                      />
                      {/* 上下限刻度、數字標籤與本案指標全部共用同一個 X 座標。 */}
                      {[fairLow as number, fairHigh as number].map(v => (
                        <div key={v} className="absolute -top-2 h-7 w-[3px] -translate-x-1/2 bg-[#9AA69F]" style={{ left: `${pos(v)}%` }} />
                      ))}
                      {benchmarks.map(b => (
                        <div
                          key={b.key}
                          className="absolute -top-2 h-7 w-[3px] -translate-x-1/2"
                          style={{ left: `${pos(b.value)}%`, backgroundColor: b.tone }}
                        />
                      ))}
                      <div
                        className="absolute -top-12 z-10 flex -translate-x-1/2 flex-col items-center"
                        style={{ left: `${pos(priceMan)}%` }}
                      >
                        <span
                          className="whitespace-nowrap px-3 py-1.5 text-center text-[11px] font-black leading-tight text-white shadow-sm"
                          style={{ backgroundColor: fairState.accent }}
                        >
                          本案 <span className="tabular-nums">{priceMan.toLocaleString()}</span>
                        </span>
                        <span
                          className="h-0 w-0 border-x-[6px] border-t-[6px] border-x-transparent"
                          style={{ borderTopColor: fairState.accent }}
                        />
                      </div>
                      <div
                        className="absolute -top-2 h-7 w-[3px] -translate-x-1/2"
                        style={{ left: `${pos(priceMan)}%`, backgroundColor: fairState.accent }}
                      />
                    </div>

                    {/* 標籤全部共用刻度座標，並具備智慧水平避讓（Spring Relaxation）與連貫導引線 */}
                    {(() => {
                      const { marksWithLayout, rowOf, rows, ROW_HEIGHT } = layoutSalePriceMarks(pos, fairLow, fairHigh, benchmarks);

                      return (
                        <div className="relative mt-2" style={{ height: `${rows * ROW_HEIGHT + 6}px` }}>
                          {marksWithLayout.map((m, i) => (
                            <div key={m.key}>
                              {/* 當必須分至第 2 列時，從上方刻度線底部平滑延伸導引線直達標籤頂部 */}
                              {rowOf[i] > 0 && (
                                <div
                                  className="absolute -translate-x-1/2"
                                  style={{
                                    left: `${m.p}%`,
                                    top: "-8px",
                                    height: `${rowOf[i] * ROW_HEIGHT + 6}px`,
                                    width: "1.5px",
                                    backgroundColor: m.tone,
                                    opacity: 0.75,
                                  }}
                                />
                              )}
                              {/* 標籤一律置中的話，最左與最右那兩個會各突出半個標籤寬，
                                            在手機的窄容器上直接被切掉；貼邊時改成靠左／靠右對齊。 */}
                              <div
                                className={`absolute leading-tight whitespace-nowrap ${m.displayP <= 10 ? "text-left" : m.displayP >= 90 ? "text-right" : "text-center"
                                  }`}
                                style={{
                                  left: `${m.displayP}%`,
                                  top: `${rowOf[i] * ROW_HEIGHT}px`,
                                  color: m.tone,
                                  transform: m.displayP <= 10
                                    ? "translateX(0)"
                                    : m.displayP >= 90 ? "translateX(-100%)" : "translateX(-50%)",
                                }}
                              >
                                <span className={`block font-mono text-xs font-black tabular-nums ${m.strong ? "text-[#1A2A22]" : ""}`}>
                                  {man(m.value)}
                                </span>
                                <span className="block text-[10px] font-semibold opacity-90">
                                  {m.label}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* 行情區間軸說明備註（置於左卡底部寬版空間，充實留白並消除死白大塊） */}
                  {(hasFairRange || c.baselineNote) && (
                    <div className="mt-4 border-l-2 border-[#007D5A] bg-[#F5F8F6] px-3.5 py-2 text-[11px] leading-relaxed text-[#3F5147]">
                      {hasFairRange && (
                        <span className="font-semibold text-[#1A2A22]">
                          以同區、同規模同條件換算本案專有面積後，價格落點{fairState.short}。
                        </span>
                      )}
                      {c.baselineNote && (
                        <span className="block text-[#66736C]">
                          {c.baselineNote}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── 右：相對位置 ── */}
            <div className="flex flex-col justify-between border border-[#DDE3DF] bg-white p-4 sm:p-5">
              <div>
                <p className="text-xs font-bold text-[#1A2A22]">相對位置</p>

                <div className="mt-3 space-y-3">
                  {benchmarks.map(b => {
                    const d = b.diff;
                    return (
                      <div key={b.key}>
                        <p className="text-[10px] leading-relaxed text-[#66736C]">
                          與{b.label} <span className="tabular-nums font-bold text-[#1A2A22]">{b.value.toLocaleString()}</span> 萬円相比
                          {b.rangeText && <span className="block text-[10px] text-[#8A9590]">（區間 {b.rangeText}）</span>}
                        </p>
                        {d == null ? (
                          <p className="mt-1 border border-[#DDE3DF] bg-[#F5F8F6] p-2 text-[11px] text-[#8A9590]">
                            缺少可比對的數值
                          </p>
                        ) : (
                          <div className={`mt-1 flex items-center justify-between border px-3 py-2.5 ${(d ?? 0) > 0 ? "border-[#FECDD3] bg-[#FFF1F0]" : (d ?? 0) < 0 ? "border-[#9EE2CF] bg-[#E6F6F1]" : "border-[#DDE3DF] bg-[#F5F8F6]"
                            }`}>
                            <span
                              className="text-2xl font-black leading-none tabular-nums flex items-baseline gap-1.5"
                              style={{ color: (d ?? 0) > 0 ? "#B13818" : (d ?? 0) < 0 ? "#007D5A" : "#8A9590" }}
                            >
                              <span className="text-base font-bold">{(d ?? 0) > 0 ? "▲" : (d ?? 0) < 0 ? "▼" : ""}</span>
                              <span>{Math.abs(d ?? 0).toFixed(1)}%</span>
                            </span>
                            <span className="text-[11px] leading-tight text-right text-[#3F5147]">
                              {(d ?? 0) > 0 ? "溢價高於" : (d ?? 0) < 0 ? "折讓低於" : "等同"}
                              <br />
                              <span className="font-bold text-[#1A2A22]">{b.shortLabel}</span>
                            </span>
                          </div>
                        )}
                        {b.key === "listing" && b.highMan && priceMan > b.highMan && (
                          <p className="mt-1 text-[10px] text-[#66736C]">
                            高於區間上限（{b.highMan.toLocaleString()}萬）約 <strong className="font-bold text-[#B13818]">▲ {Math.round(((priceMan - b.highMan) / b.highMan) * 1000) / 10}%</strong>
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 開價落點簡評 */}
              <div className="mt-3 border-l-2 border-[#007D5A] bg-[#F5F8F6] p-2.5 text-[11px] leading-snug text-[#1A2A22]">
                <p className="font-bold text-[#1A2A22]">開價相對落點判定：</p>
                <p className="mt-1 text-[#3F5147]">
                  {officialDiffPercent != null && (
                    <>{officialDiffPercent >= 0 ? "溢價高於" : "折讓低於"}{isSpecialSale ? "國交省基準" : "實價登錄"} <strong className={`font-bold ${officialDiffPercent > 0 ? "text-[#B13818]" : officialDiffPercent < 0 ? "text-[#007D5A]" : "text-[#1A2A22]"}`}>{Math.abs(officialDiffPercent).toFixed(1)}%</strong></>
                  )}
                  {c.listingDiffPercent != null && (
                    <>，{c.listingDiffPercent >= 0 ? "高於" : "低於"}在售中位 <strong className={`font-bold ${c.listingDiffPercent > 0 ? "text-[#B13818]" : c.listingDiffPercent < 0 ? "text-[#007D5A]" : "text-[#1A2A22]"}`}>{Math.abs(c.listingDiffPercent).toFixed(1)}%</strong></>
                  )}
                  。
                </p>
              </div>
            </div>
          </div>
        </div></>);
}
