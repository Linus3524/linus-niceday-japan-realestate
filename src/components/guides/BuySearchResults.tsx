import type { SelectTerm } from "../../lib/uiTypes";
import { QACard } from "../QACard";
import { RelatedThreads } from "../RelatedThreads";

interface Props {
  isBuySearchActive: boolean;
  buySearchQuery: string;
  searchResultCount: number;
  threadMatches: import("../../lib/threadSearch").ThreadSearchResults;
  setBuySearchQuery: (q: string) => void;
  buyFiltered: { drawing: import("../../data/buyHouseData").BuyHouseTermItem[]; fee: import("../../data/buyHouseData").BuyHouseTermItem[]; qa: import("../../data/buyHouseData").BuyHouseQAItem[]; };
  setSelectedFee: SelectTerm;
  staticBuySearchItems: { category: string; title: string; text: string; }[];
}
export function BuySearchResults({ isBuySearchActive, buySearchQuery, searchResultCount, threadMatches, setBuySearchQuery, buyFiltered, setSelectedFee, staticBuySearchItems }: Props) {
  return (<>{isBuySearchActive && (
                <section className="border border-[#DDE3DF] bg-white p-5 md:p-8">
                  <div className="mb-6 flex items-end justify-between gap-4 border-b border-[#DDE3DF] pb-4">
                    <div>
                      <h3 className="border-l-4 border-[#00a174] pl-3 text-xl font-bold text-[#1A2A22]">買房知識搜尋結果</h3>
                      <p className="mt-2 pl-4 font-sans text-xs text-zinc-500">
                        「{buySearchQuery.trim()}」找到 {searchResultCount} 筆站內知識
                        {threadMatches.total > 0 && `，另有 ${threadMatches.total} 篇實務分享`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBuySearchQuery("")}
                      className="shrink-0 font-sans text-xs font-bold text-[#007D5A] hover:text-[#00a174]"
                    >
                      清除搜尋
                    </button>
                  </div>

                  {searchResultCount === 0 && threadMatches.total === 0 ? (
                    <div className="bg-[#F5F8F6] px-5 py-10 text-center font-sans">
                      <p className="text-sm font-bold text-[#1A2A22]">找不到符合的內容</p>
                      <p className="mt-2 text-xs text-zinc-500">可改用較短的關鍵字，例如「取得稅」、「貸款」、「非居住者」或「修繕」。</p>
                    </div>
                  ) : (
                    <div className="space-y-7">
                      <RelatedThreads
                        threads={threadMatches.results}
                        total={threadMatches.total}
                        query={buySearchQuery}
                        source="buy"
                      />

                      {(buyFiltered.drawing.length > 0 || buyFiltered.fee.length > 0) && (
                        <div>
                          <h4 className="mb-3 font-sans text-xs font-bold tracking-wider text-[#007D5A]">相關術語</h4>
                          <div className="grid gap-3 md:grid-cols-2">
                            {[...buyFiltered.drawing, ...buyFiltered.fee].map(term => (
                              <button
                                key={`${term.category}-${term.name}`}
                                type="button"
                                onClick={() => setSelectedFee(term)}
                                className="border border-[#DDE3DF] bg-[#F8FAF9] p-4 text-left transition-colors hover:border-[#00a174]"
                              >
                                <strong className="font-serif text-sm text-[#1A2A22]">{term.name}</strong>
                                {term.jpName && <span className="ml-2 font-sans text-[10px] text-zinc-500">{term.jpName}</span>}
                                <p className="mt-2 line-clamp-3 font-sans text-xs leading-6 text-zinc-600">{term.description}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {staticBuySearchItems.length > 0 && (
                        <div>
                          <h4 className="mb-3 font-sans text-xs font-bold tracking-wider text-[#007D5A]">指南與流程</h4>
                          <div className="grid gap-3 md:grid-cols-2">
                            {staticBuySearchItems.map((item, index) => (
                              <article key={`${item.category}-${item.title}-${index}`} className="border border-[#DDE3DF] bg-white p-4">
                                <span className="font-sans text-[10px] font-bold text-[#007d5a]">{item.category}</span>
                                <h5 className="mt-1 font-serif text-base font-bold text-[#1A2A22]">{item.title}</h5>
                                <p className="mt-2 line-clamp-5 font-sans text-xs leading-6 text-zinc-600">{item.text}</p>
                              </article>
                            ))}
                          </div>
                        </div>
                      )}

                      {buyFiltered.qa.length > 0 && (
                        <div>
                          <h4 className="mb-3 font-sans text-xs font-bold tracking-wider text-[#007D5A]">相關買房問答</h4>
                          <div className="space-y-3">
                            {buyFiltered.qa.map((qa, idx) => (
                              <QACard key={idx} question={qa.question} summary={qa.summary} answer={qa.answer} sources={qa.sources} table={qa.table} number={idx + 1} />
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </section>
              )}</>);
}
