import type { SelectTerm } from "../../lib/uiTypes";
import { JapaneseRuby } from "../JapaneseRuby";

interface Props {
  isBuySearchActive: boolean;
  buyCategory: string;
  buyFiltered: { drawing: import("../../data/buyHouseData").BuyHouseTermItem[]; fee: import("../../data/buyHouseData").BuyHouseTermItem[]; qa: import("../../data/buyHouseData").BuyHouseQAItem[]; };
  setSelectedFee: SelectTerm;
}
export function BuyTermsSection({ isBuySearchActive, buyCategory, buyFiltered, setSelectedFee }: Props) {
  return (<>{!isBuySearchActive && (buyCategory === "all" || buyCategory === "drawing" || buyCategory === "fee") && (
                <div className="space-y-6">
                  {/* Drawing terms */}
                  {buyFiltered.drawing.length > 0 && (
                    <section className="space-y-4">
                      <h3 className="text-lg font-bold border-l-4 border-[#00a174] pl-3 flex items-center justify-between">
                        <span>圖紙與物件術語</span>
                        <span className="text-xs text-zinc-500 font-normal font-sans">共 {buyFiltered.drawing.length} 項</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {buyFiltered.drawing.map((term, idx) => (
                          <div
                            key={idx}
                            className="border border-[#DDE3DF] bg-white p-5 flex flex-col justify-between transition-all duration-300 relative"
                          >
                            <div>
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <h4 className="font-bold text-sm md:text-base leading-[1.8] text-[#1A2A22]"><JapaneseRuby text={term.name} /></h4>
                                {term.jpName && (
                                  <span className="text-[10px] md:text-xs bg-[#F5F8F6] px-1.5 py-0.5 border border-zinc-200 text-zinc-600 font-sans font-medium">{term.jpName}</span>
                                )}
                              </div>
                              <p className="text-xs md:text-sm text-zinc-700 leading-relaxed line-clamp-3">
                                {term.description}
                              </p>
                            </div>
                            <div className="mt-4 flex items-center justify-between text-[10px] text-zinc-400 font-sans border-t border-zinc-100 pt-2">
                              <span>圖紙／物件</span>
                              <button
                                type="button"
                                onClick={() => setSelectedFee(term)}
                                className="text-zinc-600 flex items-center gap-0.5 hover:text-[#00a174] cursor-pointer"
                              >
                                查看說明 →
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Fee terms */}
                  {buyFiltered.fee.length > 0 && (
                    <section className="space-y-4">
                      <h3 className="text-lg font-bold border-l-4 border-[#00a174] pl-3 flex items-center justify-between">
                        <span>交易與費用術語</span>
                        <span className="text-xs text-zinc-500 font-normal font-sans">共 {buyFiltered.fee.length} 項</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {buyFiltered.fee.map((term, idx) => (
                          <div
                            key={idx}
                            className="border border-[#DDE3DF] bg-white p-5 flex flex-col justify-between transition-all duration-300 relative"
                          >
                            <div>
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <h4 className="font-bold text-sm md:text-base leading-[1.8] text-[#1A2A22]"><JapaneseRuby text={term.name} /></h4>
                                {term.jpName && (
                                  <span className="text-[10px] md:text-xs bg-[#F5F8F6] px-1.5 py-0.5 border border-zinc-200 text-zinc-600 font-sans font-medium">{term.jpName}</span>
                                )}
                              </div>
                              <p className="text-xs md:text-sm text-zinc-700 leading-relaxed line-clamp-3">
                                {term.description}
                              </p>
                            </div>
                            <div className="mt-4 flex items-center justify-between text-[10px] text-zinc-400 font-sans border-t border-zinc-100 pt-2">
                              <span>交易／費用</span>
                              <button
                                type="button"
                                onClick={() => setSelectedFee(term)}
                                className="text-zinc-600 flex items-center gap-0.5 hover:text-[#00a174] cursor-pointer"
                              >
                                查看說明 →
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              )}</>);
}
