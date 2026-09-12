import type { SelectTerm } from "../../lib/uiTypes";
import { QACard } from "../QACard";
import { RelatedThreads } from "../RelatedThreads";

interface Props {
  isSearchActive: boolean;
  searchQuery: string;
  rentSearchResultCount: number;
  threadMatches: import("../../lib/threadSearch").ThreadSearchResults;
  setSearchQuery: (q: string) => void;
  hasNoResults: boolean;
  filtered: { fees: import("../../data/rentGuideData").InitialFeeItem[]; terms: import("../../data/rentGuideData").SpecialTermItem[]; steps: import("../../data/rentGuideData").ProcessStep[]; qa: import("../../data/rentGuideData").QAItem[]; };
  setSelectedFee: SelectTerm;
  staticRentSearchItems: ({ id: "sop"; category: string; title: string; text: string; } | { id: "documents"; category: string; title: string; text: string; } | { id: "routes"; category: string; title: string; text: string; } | { id: "reminders"; category: string; title: string; text: string; })[];
}
export function RentSearchResults({ isSearchActive, searchQuery, rentSearchResultCount, threadMatches, setSearchQuery, hasNoResults, filtered, setSelectedFee, staticRentSearchItems }: Props) {
  return (<>{isSearchActive && (
                <section className="border border-[#DDE3DF] bg-white p-5 md:p-8">
                  <div className="mb-6 flex items-end justify-between gap-4 border-b border-[#DDE3DF] pb-4">
                    <div>
                      <h3 className="border-l-4 border-[#00a174] pl-3 text-xl font-bold text-[#1A2A22]">租屋知識搜尋結果</h3>
                      <p className="mt-2 pl-4 font-sans text-xs text-zinc-500">
                        「{searchQuery.trim()}」找到 {rentSearchResultCount} 筆站內知識
                        {threadMatches.total > 0 && `，另有 ${threadMatches.total} 篇實務分享`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="shrink-0 font-sans text-xs font-bold text-[#007D5A] hover:text-[#00a174]"
                    >
                      清除搜尋
                    </button>
                  </div>

                  {hasNoResults && threadMatches.total === 0 ? (
                    <div className="bg-[#F5F8F6] px-5 py-10 text-center font-sans">
                      <p className="text-sm font-bold text-[#1A2A22]">找不到符合的內容</p>
                      <p className="mt-2 text-xs text-zinc-500">可改用較短的關鍵字，例如「敷金」、「先行契約」、「保證公司」或「審査」。</p>
                    </div>
                  ) : (
                    <div className="space-y-7">
                      <RelatedThreads
                        threads={threadMatches.results}
                        total={threadMatches.total}
                        query={searchQuery}
                        source="rent"
                      />

                      {(filtered.fees.length > 0 || filtered.terms.length > 0) && (
                        <div>
                          <h4 className="mb-3 font-sans text-xs font-bold tracking-wider text-[#007D5A]">相關術語</h4>
                          <div className="grid gap-3 md:grid-cols-2">
                            {[...filtered.fees, ...filtered.terms].map(term => (
                              <button
                                key={`${term.name}-${term.jpName || ""}`}
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

                      {(filtered.steps.length > 0 || staticRentSearchItems.length > 0) && (
                        <div>
                          <h4 className="mb-3 font-sans text-xs font-bold tracking-wider text-[#007D5A]">指南與流程</h4>
                          <div className="grid gap-3 md:grid-cols-2">
                            {filtered.steps.map(step => (
                              <article key={step.id} className="border border-[#DDE3DF] bg-white p-4">
                                <span className="font-sans text-[10px] font-bold text-[#007d5a]">租屋申請流程</span>
                                <h5 className="mt-1 font-serif text-base font-bold text-[#1A2A22]">{step.name}</h5>
                                <p className="mt-2 line-clamp-5 font-sans text-xs leading-6 text-zinc-600">{step.description}</p>
                              </article>
                            ))}
                            {staticRentSearchItems.map(item => (
                              <article key={item.id} className="border border-[#DDE3DF] bg-white p-4">
                                <span className="font-sans text-[10px] font-bold text-[#007d5a]">{item.category}</span>
                                <h5 className="mt-1 font-serif text-base font-bold text-[#1A2A22]">{item.title}</h5>
                                <p className="mt-2 line-clamp-5 font-sans text-xs leading-6 text-zinc-600">{item.text}</p>
                              </article>
                            ))}
                          </div>
                        </div>
                      )}

                      {filtered.qa.length > 0 && (
                        <div>
                          <h4 className="mb-3 font-sans text-xs font-bold tracking-wider text-[#007D5A]">相關租屋問答</h4>
                          <div className="space-y-3">
                            {filtered.qa.map((qa, idx) => (
                              <QACard key={qa.id} question={qa.question} summary={qa.summary} answer={qa.answer} number={idx + 1} />
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </section>
              )}</>);
}
