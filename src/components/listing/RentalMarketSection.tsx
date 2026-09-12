import {
CheckCircle2,
MinusCircle,
TrendingUp
} from "lucide-react";
import type { ListingHealthCheckModel } from '../../hooks/useListingHealthCheckController';
import { formatYen } from '../../lib/listing/formatters';
import {
buildRentalMarketConclusion,
buildRentalMarketFactors,
parseRentalVerdictDetail,
} from '../../lib/listing/rentalMarketPresentation';
import { getStatusStyle } from './statusTheme';

interface RentalMarketSectionProps {
  model: Pick<
    ListingHealthCheckModel,
    | "listingAudit"
    | "result"
    | "cleanVerdictDetail"
    | "cleanVerdictHeadline"
    | "totalMonthlyCost"
  >;
}

export function RentalMarketSection({ model }: RentalMarketSectionProps) {
  const { listingAudit, result, cleanVerdictDetail, cleanVerdictHeadline, totalMonthlyCost } = model;
  return (<>{!listingAudit?.blocksComparison && result.verdict && (() => {
    const style = getStatusStyle(result.verdict.status);
    const { tags, conclusionText } = parseRentalVerdictDetail(cleanVerdictDetail);

    return (
      <div className="space-y-3">
        {/* 區塊頂部標題列：與其他模組保持完全一致的層級 */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#007D5A]">
            <TrendingUp className="h-4 w-4 text-[#007D5A]" />
            <span>租金行情診斷</span>
          </div>
          <span className="text-[10px] text-[#66736C]">
            綜合總賃料、站距、屋齡與設備規格評定
          </span>
        </div>

        {/* 行情分析與評估內容卡片 */}
        <div className="border border-[#DDE3DF] bg-white p-4 sm:p-5">
          {/* 核心結論大字與評定標籤 */}
          <div className="flex items-start gap-2.5">
            <span className={`mt-0.5 inline-flex shrink-0 items-center gap-1.5 border px-2.5 py-0.5 text-xs font-bold ${style.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
              {result.verdict.status}
            </span>
            <h4 className="min-w-0 flex-1 text-sm font-bold leading-relaxed text-[#1A2A22] sm:text-base">
              {cleanVerdictHeadline}
            </h4>
          </div>

          {/* 中層：同區公開行情對照面板（獨立橫向 Data Strip） */}
          {result.range && (
            <div className="mt-3 flex flex-col gap-2.5 border border-[#DDE3DF] bg-[#F5F8F6] p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#66736C]">同區同房型公開行情：</span>
                  <span className="font-mono font-bold text-[#1A2A22]">
                    {formatYen(result.range.low)} ～ {formatYen(result.range.high)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#66736C]">區域中位數：</span>
                  <span className="border border-[#9EE2CF] bg-[#E6F6F1] px-2 py-0.5 text-[11px] font-mono font-bold text-[#007D5A]">
                    {formatYen(result.range.median)}
                  </span>
                </div>
              </div>

              {result.range?.sourceUrl && (
                <div className="text-[11px] text-[#66736C]">
                  來源：
                  <a
                    href={result.range.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-[#007D5A] underline underline-offset-2 hover:text-[#00A174]"
                  >
                    {result.range.sourceLabel || "At Home 刊登物件直近 3 個月租金平均"}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* 下層：Linus 顧問觀點（條件與規格折溢價對照清單與優勢解析，對齊買房體驗） */}
          {cleanVerdictDetail && (() => {
            const { rentalFactors, positiveFactorsSum, negativeFactorsSum, netFactorsSum, nominalDiff } = buildRentalMarketFactors(result, tags, totalMonthlyCost);

            return (
              <div className="mt-3.5 border-t border-[#DDE3DF] pt-3">
                <div className="mb-2.5 flex flex-wrap items-center justify-between gap-1">
                  <span className="text-xs font-bold text-[#1A2A22]">
                    條件與規格折溢價
                  </span>
                  <span className="text-[10px] text-[#66736C]">
                    綜合地點、屋齡、樓層、結構與設備因子拆解
                  </span>
                </div>

                <div className="space-y-3 text-xs text-[#3F5147]">
                  {/* 頂部對照條：規格條件加減 vs 實際租金差距 */}
                  {rentalFactors.length > 0 && (
                    <div className="flex flex-col gap-2 border border-[#DDE3DF] bg-[#F5F8F6] p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#66736C]">優勢加成合計：</span>
                          <span className="font-mono font-black text-[#007D5A]">
                            +{positiveFactorsSum.toFixed(1)}%
                          </span>
                          {result.range && (
                            <span className="text-[10px] text-[#66736C]">
                              （約 +{formatYen(Math.round(result.range.median * (positiveFactorsSum / 100)))} / 月）
                            </span>
                          )}
                        </div>
                        {negativeFactorsSum < 0 && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[#66736C]">折減讓利合計：</span>
                            <span className="font-mono font-black text-[#B13818]">
                              −{Math.abs(negativeFactorsSum).toFixed(1)}%
                            </span>
                            {result.range && (
                              <span className="text-[10px] text-[#66736C]">
                                （約 −{formatYen(Math.round(result.range.median * (Math.abs(negativeFactorsSum) / 100)))} / 月）
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#66736C]">條件調整淨值：</span>
                          <span className={`font-mono font-bold ${netFactorsSum >= 0 ? "text-[#007D5A]" : "text-[#B13818]"}`}>
                            {netFactorsSum >= 0 ? `+${netFactorsSum.toFixed(1)}%` : `−${Math.abs(netFactorsSum).toFixed(1)}%`}
                          </span>
                        </div>
                        {result.range && (
                          <div className="flex items-center gap-1.5 border-l border-zinc-300 pl-3">
                            <span className="text-[#66736C]">相對區域中位數：</span>
                            <span className="font-mono font-bold text-[#1A2A22]">
                              {nominalDiff > 0 ? `+${nominalDiff.toFixed(1)}%` : nominalDiff < 0 ? `−${Math.abs(nominalDiff).toFixed(1)}%` : "0.0%"}
                            </span>
                            {totalMonthlyCost && (
                              <span className="text-[10px] text-[#66736C]">
                                （約 {totalMonthlyCost >= result.range.median ? "+" : "−"}{formatYen(Math.abs(totalMonthlyCost - result.range.median))} / 月）
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <span className={`inline-flex shrink-0 items-center gap-1 border px-2 py-0.5 text-[11px] font-bold ${netFactorsSum >= nominalDiff
                          ? "border-[#9EE2CF] bg-[#E6F6F1] text-[#007D5A]"
                          : "border-[#E8C4A8] bg-[#FFF9ED] text-[#7A5A1F]"
                        }`}>
                        <CheckCircle2 className="h-3 w-3" />
                        <span>{netFactorsSum >= nominalDiff ? "條件與規格充分支撐" : "部分條件加成支撐"}</span>
                      </span>
                    </div>
                  )}

                  {/* 規格影響程度明細清單（對齊買房體驗） */}
                  {rentalFactors.length > 0 ? (
                    <div className="border border-[#DDE3DF] bg-white">
                      <div className="hidden sm:grid grid-cols-[1.5rem_8.5rem_1fr_4.5rem_5rem] items-center gap-3 border-b border-[#DDE3DF] bg-[#FAFCFB] px-3 py-2 text-[10px] font-bold text-[#66736C]">
                        <span>#</span>
                        <span>評估條件項目</span>
                        <span>實務效益與說明</span>
                        <span className="text-center">影響強度</span>
                        <span className="text-right">預估影響幅度</span>
                      </div>
                      <div className="divide-y divide-[#E8ECE9]">
                        {rentalFactors.map((f, i) => {
                          const isPlus = f.ratePercent >= 0;
                          return (
                            <div
                              key={i}
                              className="grid grid-cols-1 sm:grid-cols-[1.5rem_8.5rem_1fr_4.5rem_5rem] items-center gap-x-3 gap-y-1 p-2.5 sm:px-3 sm:py-2 text-xs hover:bg-[#F9FBFA] transition-colors"
                            >
                              <span className="hidden sm:inline font-mono text-[11px] tabular-nums text-[#8A9590]">
                                {i + 1}
                              </span>
                              <div className="flex items-center gap-1.5 font-bold text-[#1A2A22]">
                                {isPlus ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#007D5A]" />
                                ) : (
                                  <MinusCircle className="h-3.5 w-3.5 shrink-0 text-[#B13818]" />
                                )}
                                <span>{f.label}</span>
                              </div>
                              <div className="text-[11px] text-[#66736C] leading-relaxed">
                                {f.note}
                              </div>
                              <div className="flex items-center justify-start sm:justify-center gap-1" title={`影響強度 ${f.level} / 5`}>
                                {[0, 1, 2, 3, 4].map(n => (
                                  <span
                                    key={n}
                                    className="h-2 w-2 border"
                                    style={{
                                      borderColor: n < f.level ? (isPlus ? "#007D5A" : "#B13818") : "#DDE3DF",
                                      backgroundColor: n < f.level ? (isPlus ? "#007D5A" : "#B13818") : "transparent"
                                    }}
                                  />
                                ))}
                              </div>
                              <div className={`font-mono text-xs font-bold tabular-nums text-left sm:text-right ${isPlus ? "text-[#007D5A]" : "text-[#B13818]"}`}>
                                {isPlus ? `+${f.ratePercent.toFixed(1)}%` : `−${Math.abs(f.ratePercent).toFixed(1)}%`}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {/* 條件累計與租金合理性對照（完全對齊買房體驗） */}
                  {(() => {
                    const { posFactorsCount, negFactorsCount, nominalDiffYen, netDiffYen, isWellSupported, isOverpriced, isDiscounted, verdictConclusionText } = buildRentalMarketConclusion({
                      result,
                      rentalFactors,
                      totalMonthlyCost,
                      netFactorsSum,
                      nominalDiff,
                      conclusionText,
                      cleanVerdictDetail,
                    });

                    return (
                      <div className="mt-3.5 border-t border-[#DDE3DF] pt-3.5 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-[#1A2A22]">條件加總與租金對照</span>
                            <span className="border border-[#9EE2CF] bg-[#E6F6F1] px-1.5 py-0.5 text-[9px] font-bold text-[#007D5A]">
                              加總驗證
                            </span>
                          </div>
                          <span className="text-[10px] text-[#66736C]">
                            同區刊登中位數基準 ＋ 實務規格折溢價交叉驗算
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {/* 卡片 1：本案條件淨加成 */}
                          <div className="border border-[#DDE3DF] bg-[#F5F8F6] p-2.5 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] text-[#66736C]">本案條件加成淨值</span>
                                <span className="border border-[#9EE2CF] bg-[#E6F6F1] px-1.5 py-0.5 text-[9px] font-bold text-[#007D5A]">
                                  規格加成
                                </span>
                              </div>
                              <span className={`block font-mono text-base font-black mt-1 ${netFactorsSum >= 0 ? "text-[#007D5A]" : "text-[#B13818]"}`}>
                                {netFactorsSum >= 0 ? `+${netFactorsSum.toFixed(1)}%` : `−${Math.abs(netFactorsSum).toFixed(1)}%`}
                              </span>
                            </div>
                            <span className="block text-[9px] text-[#8A9590] mt-0.5">
                              {posFactorsCount} 項規格加成{negFactorsCount > 0 ? `・${negFactorsCount} 項讓利折減` : ""}
                              {result.range && `（約 ${netFactorsSum >= 0 ? "+" : "−"}${formatYen(Math.abs(netDiffYen))} / 月）`}
                            </span>
                          </div>

                          {/* 卡片 2：每月租金總額落點 */}
                          <div className="border border-[#DDE3DF] bg-[#F5F8F6] p-2.5 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] text-[#66736C]">每月租金總額落點</span>
                                <span className={`px-1.5 py-0.5 border text-[9px] font-bold ${nominalDiff > 0
                                    ? "border-[#FECDD3] bg-[#FFF1F0] text-[#B13818]"
                                    : nominalDiff < 0
                                      ? "border-[#9EE2CF] bg-[#E6F6F1] text-[#007D5A]"
                                      : "border-[#DDE3DF] bg-white text-[#8A9590]"
                                  }`}>
                                  {nominalDiff > 0 ? "溢價開盤" : nominalDiff < 0 ? "讓利開盤" : "符合市價"}
                                </span>
                              </div>
                              <span className={`block font-mono text-base font-black mt-1 ${nominalDiff > 0 ? "text-[#B13818]" : nominalDiff < 0 ? "text-[#007D5A]" : "text-[#8A9590]"
                                }`}>
                                {nominalDiff > 0 ? `▲ 溢價 ${nominalDiff.toFixed(1)}%` : nominalDiff < 0 ? `▼ 折讓 ${Math.abs(nominalDiff).toFixed(1)}%` : "符合市場基準"}
                              </span>
                            </div>
                            <span className="block text-[9px] text-[#8A9590] mt-0.5">
                              每月總負擔 {totalMonthlyCost ? formatYen(totalMonthlyCost) : "—"} / 月
                              {result.range && nominalDiffYen !== 0 && `（${nominalDiffYen > 0 ? "高出約 " : "折讓約 "}${formatYen(Math.abs(nominalDiffYen))}）`}
                            </span>
                          </div>

                          {/* 卡片 3：租金合理性剖析 */}
                          <div className={`border p-2.5 flex flex-col justify-between ${isWellSupported
                              ? "border-[#9EE2CF] bg-[#E6F6F1]"
                              : isOverpriced
                                ? "border-[#FED7AA] bg-[#FFF7ED]"
                                : isDiscounted
                                  ? "border-[#BAE6FD] bg-[#F0F9FF]"
                                  : "border-[#DDE3DF] bg-[#F5F8F6]"
                            }`}>
                            <div>
                              <span className="block text-[10px] font-bold text-[#1A2A22]">租金定價合理性剖析</span>
                              <span className={`block text-xs font-bold mt-0.5 ${isWellSupported ? "text-[#007D5A]" : isOverpriced ? "text-[#B13818]" : isDiscounted ? "text-[#0284C7]" : "text-[#007D5A]"
                                }`}>
                                {isWellSupported ? "✓ 租金有充分條件支撐" : isOverpriced ? "⚠ 超出條件支撐（超額溢價）" : isDiscounted ? "↓ 低於行情具性價比" : "✓ 租金落在合理區間"}
                              </span>
                            </div>
                            <span className="block text-[9px] text-[#66736C] mt-0.5 leading-relaxed">
                              {isWellSupported
                                ? `各項規格累計淨值（+${netFactorsSum.toFixed(1)}%）充分支撐開價差距（溢價 ${nominalDiff.toFixed(1)}%），屬高規格合理溢價。`
                                : isOverpriced
                                  ? `即使計入各項規格優勢，租金仍高於客觀支撐約 ${(nominalDiff - netFactorsSum).toFixed(1)}%，建議評估議價或爭取免禮金空間。`
                                  : isDiscounted
                                    ? `月額負擔低於同區中位數 ${Math.abs(nominalDiff).toFixed(1)}%，具備顯著性價比讓利優勢。`
                                    : "租金開價與條件規格加權後之行情落點相符。"}
                            </span>
                          </div>
                        </div>

                        {/* 評定解析（綜合加總與租金比對之結論） */}
                        <div className="border border-[#DDE3DF] border-l-4 border-l-[#007D5A] bg-[#F5F8F6] p-3 text-xs leading-relaxed text-[#1A2A22]">
                          <span className="font-bold text-[#007D5A]">評定解析：</span>
                          <span>{verdictConclusionText}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    );
  })()}</>);
}
