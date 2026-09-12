import type { LucideIcon } from "lucide-react";
import type { ListingHealthCheckModel } from '../../hooks/useListingHealthCheckController';
import type { buildSaleMarketPresentation } from "../../lib/listing/saleMarketPresentation";

interface Props {
  FACTOR_SCALE: 15;
  c: NonNullable<ListingHealthCheckModel["effectiveMlitComparison"]>;
  factorIcon: (label: string) => LucideIcon;
  priceMan: ReturnType<typeof buildSaleMarketPresentation>["priceMan"];
}
export function SalePriceFactors({ FACTOR_SCALE, c, factorIcon, priceMan }: Props) {
  return (<><div className="border border-[#DDE3DF] bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pb-2.5">
                <span className="text-xs font-bold text-[#1A2A22]">本案條件個別影響幅度</span>
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-[#8A9590]">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 bg-[#0284C7]" />成交資料統計
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 bg-[#8A9590]" />市場推估
                  </span>
                  <span>·　影響強度以 ±{FACTOR_SCALE}% 為五格滿格</span>
                </span>
              </div>
              {/* 土地・戸建是以「同面積帶的成交㎡單價」直接換算本案面積，
                              條件本身已含在基準價裡，所以每一項都會是 0%。
                              整排灰色又沒有說明，看起來像壞掉，這裡明講原因。 */}
              {c.priceFactors.every(f => f.ratePercent === 0) && (
                <p className="border-t border-[#DDE3DF] py-2.5 text-[11px] leading-relaxed text-[#66736C]">
                  以下條件<strong className="font-bold text-[#3F5147]">均標示為「等同基準」</strong>：本案已直接採用同區同條件的實際成交單價換算基準，各項條件已充分反映於基準行情中，故不另行重複加權。
                </p>
              )}
              {/* 表頭只在寬螢幕出現；窄螢幕改成一列多行的堆疊排法，
                              欄位靠 col-start／row-start 明確指定，不依賴自動流向。 */}
              <div className="hidden border-y border-[#DDE3DF] bg-[#F5F8F6] px-2 py-2 text-[10px] font-bold text-[#8A9590] sm:grid sm:grid-cols-[1.5rem_8.5rem_4.75rem_1fr_5rem_5.5rem] sm:items-center sm:gap-x-3">
                <span>#</span>
                <span>因素</span>
                <span>依據來源</span>
                <span>說明</span>
                <span className="text-right">價格影響幅度</span>
                <span className="text-center">影響強度</span>
              </div>
              <dl className="divide-y divide-[#DDE3DF] border-b border-[#DDE3DF]">
                {[...c.priceFactors]
                  .sort((a, b) => Math.abs(b.ratePercent) - Math.abs(a.ratePercent))
                  .map((f, i) => {
                    const Icon = factorIcon(f.label);
                    const up = f.ratePercent > 0;
                    const down = f.ratePercent < 0;
                    const tone = up ? "#007D5A" : down ? "#B13818" : "#8A9590";
                    // 每格 = FACTOR_SCALE / 5；有幅度就至少點亮一格，滿格封頂。
                    const level = f.ratePercent === 0
                      ? 0
                      : Math.min(5, Math.max(1, Math.ceil(Math.abs(f.ratePercent) / (FACTOR_SCALE / 5))));
                    return (
                      <div
                        key={i}
                        className="grid grid-cols-[1.5rem_1fr_auto] items-center gap-x-3 gap-y-1.5 px-2 py-3 sm:grid-cols-[1.5rem_8.5rem_4.75rem_1fr_5rem_5.5rem] sm:gap-y-0"
                      >
                        <span className="col-start-1 row-start-1 font-mono text-[11px] tabular-nums text-[#8A9590]">
                          {i + 1}
                        </span>
                        <dt className="col-start-2 row-start-1 flex min-w-0 items-center gap-2">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#DDE3DF] bg-[#F5F8F6] text-[#3F5147]">
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="min-w-0 text-xs font-bold text-[#1A2A22]">{f.label}</span>
                        </dt>
                        {/* 使用者要能分辨哪些數字有成交資料撐、哪些只是推估 */}
                        <span
                          className={`col-start-2 row-start-3 justify-self-start border px-1.5 py-0.5 text-[9px] font-bold sm:col-start-3 sm:row-start-1 ${f.basis === "data"
                              ? "border-[#7DD3FC] bg-[#E0F2FE] text-[#0284C7]"
                              : "border-[#DDE3DF] bg-[#F5F8F6] text-[#8A9590]"
                            }`}
                          title={f.basis === "data"
                            ? "此幅度由國土交通省實際成交資料統計得出"
                            : "成交資料沒有這個欄位，此幅度依市場行情推估，僅供參考"}
                        >
                          {f.basis === "data" ? "成交資料" : "市場推估"}
                        </span>
                        <dd className="col-start-2 col-span-2 row-start-2 min-w-0 text-[11px] leading-relaxed text-[#66736C] sm:col-start-4 sm:col-span-1 sm:row-start-1">
                          {f.note}
                        </dd>
                        <span
                          className="col-start-3 row-start-3 flex items-center gap-1 justify-self-end sm:col-start-6 sm:row-start-1 sm:justify-self-center"
                          title={`影響強度 ${level} / 5（滿格為 ±${FACTOR_SCALE}%）`}
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
                        </span>
                        <span
                          className="col-start-3 row-start-1 justify-self-end font-mono text-xs font-bold tabular-nums sm:col-start-5 sm:row-start-1 sm:text-right"
                          style={{ color: tone }}
                        >
                          {f.ratePercent === 0 ? "等同基準" : `${up ? "+" : "−"}${Math.abs(f.ratePercent).toFixed(1)}%`}
                        </span>
                      </div>
                    );
                  })}
              </dl>

              {/* ①-a 優勢條件合計與賣方開價對照 */}
              {(() => {
                let calculatedPos = 0;
                let calculatedNet = 0;
                for (const f of c.priceFactors) {
                  if (f.ratePercent > 0) calculatedPos += f.ratePercent;
                  calculatedNet += f.ratePercent;
                }
                const posSum = c.positiveFactorsSumPercent ?? Math.round(calculatedPos * 10) / 10;
                const netSum = c.netFactorsSumPercent ?? Math.round(calculatedNet * 10) / 10;
                const askDiff = c.diffPercent;
                const baselineMan = c.areaBaselineMan ?? c.medianPriceMan;
                const diffAmountMan = baselineMan && priceMan ? priceMan - baselineMan : null;
                const isOverpriced = askDiff > posSum + 15;
                const isWellSupported = askDiff > 0 && askDiff <= posSum + 5;
                const isDiscounted = askDiff < 0;
                const hasReno = c.priceFactors.some(
                  f => (f.label === "翻新" || f.label.includes("翻新") || f.label.includes("改裝")) && f.ratePercent > 0
                );
                const factorsSumInsight = "insightPoints" in c && Array.isArray(c.insightPoints)
                  ? c.insightPoints.find(p => p.id === "factors_sum")
                  : undefined;

                return (
                  <div className="mt-3 border-t border-[#DDE3DF] pt-3.5 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#1A2A22]">優勢條件累計與開價合理性對照</span>
                        <span className="border border-[#9EE2CF] bg-[#E6F6F1] px-1.5 py-0.5 text-[9px] font-bold text-[#007D5A]">
                          加總驗證
                        </span>
                      </div>
                      <span className="text-[10px] text-[#66736C]">
                        官方査定教科書 ＋ 東京カンテイ大數據統計
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="border border-[#DDE3DF] bg-[#F5F8F6] p-2.5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] text-[#66736C]">本案優勢條件加總</span>
                            <span className="border border-[#9EE2CF] bg-[#E6F6F1] px-1.5 py-0.5 text-[9px] font-bold text-[#007D5A]">
                              規格加成
                            </span>
                          </div>
                          <span className="block font-mono text-base font-black text-[#007D5A] mt-1">
                            {posSum > 0 ? `+${posSum.toFixed(1)}%` : "0.0%"}
                          </span>
                        </div>
                        <span className="block text-[9px] text-[#8A9590] mt-0.5">
                          {c.priceFactors.filter(f => f.ratePercent > 0).length} 項正向規格加成
                        </span>
                      </div>
                      <div className="border border-[#DDE3DF] bg-[#F5F8F6] p-2.5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] text-[#66736C]">賣方開價落點</span>
                            <span className={`px-1.5 py-0.5 border text-[9px] font-bold ${askDiff > 0
                                ? "border-[#FECDD3] bg-[#FFF1F0] text-[#B13818]"
                                : askDiff < 0
                                  ? "border-[#9EE2CF] bg-[#E6F6F1] text-[#007D5A]"
                                  : "border-[#DDE3DF] bg-white text-[#8A9590]"
                              }`}>
                              {askDiff > 0 ? "溢價開盤" : askDiff < 0 ? "讓利開盤" : "符合市價"}
                            </span>
                          </div>
                          <span className={`block font-mono text-base font-black mt-1 ${askDiff > 0 ? "text-[#B13818]" : askDiff < 0 ? "text-[#007D5A]" : "text-[#8A9590]"}`}>
                            {askDiff > 0 ? `▲ 溢價 ${askDiff.toFixed(1)}%` : askDiff < 0 ? `▼ 折讓 ${Math.abs(askDiff).toFixed(1)}%` : "符合市場基準"}
                          </span>
                        </div>
                        <span className="block text-[9px] text-[#8A9590] mt-0.5">
                          相對同區同屋齡成交基準{diffAmountMan !== null ? `（${diffAmountMan > 0 ? "高出約 " : "折讓約 "}${Math.abs(diffAmountMan).toLocaleString()} 萬円）` : ""}
                        </span>
                      </div>
                      <div className={`border p-2.5 flex flex-col justify-between ${isWellSupported
                          ? "border-[#9EE2CF] bg-[#E6F6F1]"
                          : isOverpriced
                            ? "border-[#FED7AA] bg-[#FFF7ED]"
                            : isDiscounted
                              ? "border-[#BAE6FD] bg-[#F0F9FF]"
                              : "border-[#DDE3DF] bg-[#F5F8F6]"
                        }`}>
                        <div>
                          <span className="block text-[10px] font-bold text-[#1A2A22]">開價合理性剖析</span>
                          <span className={`block text-xs font-bold mt-0.5 ${isWellSupported ? "text-[#007D5A]" : isOverpriced ? "text-[#B13818]" : "text-[#0284C7]"
                            }`}>
                            {isWellSupported
                              ? "✓ 開價有充分條件支撐"
                              : isOverpriced
                                ? "⚠ 超出條件支撐（超額溢價）"
                                : isDiscounted
                                  ? (hasReno ? "↓ 翻新讓利／具價格優勢" : "↓ 屋況折讓／保留翻新預算")
                                  : "開價落在合理範圍"}
                          </span>
                        </div>
                        <span className="block text-[9px] text-[#66736C] mt-0.5 leading-relaxed">
                          {isWellSupported
                            ? `各項規格累計（+${posSum}%）充分支撐賣方開價（溢價 ${askDiff}%），屬高規格正常開盤。`
                            : isOverpriced
                              ? `即使計入各項優勢，開價仍高於客觀支撐約 ${(askDiff - posSum).toFixed(1)}%，建議保留議價空間。`
                              : isDiscounted
                                ? (hasReno
                                  ? `開價低於基準 ${Math.abs(askDiff)}%，且已完成室內翻新（規格加成 +${posSum}%），具價格競爭力與讓利優勢。`
                                  : `開價低於基準 ${Math.abs(askDiff)}%，主要反映未整體翻新之屋況折讓，留出預算空間供買方自行裝修。`)
                                : "開價與條件加權後之行情落點相符。"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[10px] text-[#8A9590] pt-1">
                      <span>
                        ※ 査定依據來源：公益財團法人 不動產流通推進中心《中古マンション価格査定マニュアル》官方標準，以及日本東京カンテイ（Tokyo Kantei）實證大數據統計。
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div></>);
}
