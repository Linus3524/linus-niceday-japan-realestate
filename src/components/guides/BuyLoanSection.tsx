import { ChevronDown, Landmark, Percent } from "lucide-react";
import {
japaneseBanks,
taiwaneseBanks
} from "../../data/buyHouseData";
import { SectionHeading } from "../SectionHeading";

interface Props {
  isBuySearchActive: boolean;
  buyCategory: string;
  toggleBank: (key: string) => void;
  expandedBanks: Set<string>;
}
export function BuyLoanSection({ isBuySearchActive, buyCategory, toggleBank, expandedBanks }: Props) {
  return (<>{!isBuySearchActive && (buyCategory === "all" || buyCategory === "loans") && (
                <div className="space-y-6">
                  <section className="border border-[#DDE3DF] hover:border-[#00a174] bg-white p-4 md:p-6 space-y-3 transition-all duration-300 hover:shadow-colored-soft">
                    <SectionHeading
                      icon={Landmark}
                      title="海外買方融資方案整理"
                      description="非在日居住也能貸！精選台系銀行日本分行融資條件，掌握成數、利率與門檻。"
                    />

                    <div className="space-y-5">
                      {taiwaneseBanks.map((bank, bIdx) => (
                        <div key={bIdx} className="border border-[#DDE3DF] hover:border-[#00a174] bg-white transition-all duration-300 hover:shadow-colored-soft overflow-hidden">
                          <button
                            type="button"
                            onClick={() => toggleBank(`overseas-${bIdx}`)}
                            aria-expanded={expandedBanks.has(`overseas-${bIdx}`)}
                            className="w-full bg-[#F5F8F6] hover:bg-[#e6f6f1] text-[#1A2A22] px-5 py-4 flex justify-between items-center flex-wrap gap-3 text-left border-none cursor-pointer transition-colors"
                          >
                            <h4 className="font-extrabold text-base md:text-lg leading-tight font-serif text-[#1A2A22]">{bank.name}</h4>
                            <span className="flex items-center gap-3">
                              <span className="bg-[#00a174] text-white px-2.5 py-1 text-xs font-bold font-sans">利率約 {bank.interestRate}</span>
                              <span className="text-xs font-bold font-sans text-zinc-500">{expandedBanks.has(`overseas-${bIdx}`) ? "收合" : "查看條件"}</span>
                              <ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform ${expandedBanks.has(`overseas-${bIdx}`) ? "rotate-180" : ""}`} />
                            </span>
                          </button>

                          {expandedBanks.has(`overseas-${bIdx}`) && (<>
                          <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-zinc-200 font-sans">
                            <div className="p-4 bg-[#F5F8F6] border-b sm:border-b-0 sm:border-r border-zinc-200">
                              <p className="text-[10px] font-bold tracking-wide text-zinc-500">申貸對象</p>
                              <p className="mt-1 text-xs font-semibold leading-relaxed text-[#1A2A22]">{bank.object}</p>
                            </div>
                            <div className="p-4 border-b sm:border-b-0 sm:border-r border-zinc-200">
                              <p className="text-[10px] font-bold tracking-wide text-zinc-500">起貸金額／最高成數</p>
                              <p className="mt-1 text-xs font-semibold leading-relaxed text-[#00a174]">{bank.amountLimit}</p>
                            </div>
                            <div className="p-4 bg-[#F5F8F6]">
                              <p className="text-[10px] font-bold tracking-wide text-zinc-500">最長貸款期限</p>
                              <p className="mt-1 text-xs font-semibold leading-relaxed text-[#1A2A22]">{bank.termLimit}</p>
                            </div>
                          </div>

                          <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5 font-sans text-xs">
                            <div className="border border-zinc-200">
                              <p className="bg-[#F5F8F6] px-3 py-2 font-bold text-[#1A2A22]">申請人條件</p>
                              <dl className="divide-y divide-zinc-100">
                                <div className="px-3 py-2.5"><dt className="font-bold text-[#00a174]">年齡</dt><dd className="mt-1 leading-relaxed text-zinc-600">{bank.ageLimit}</dd></div>
                                <div className="px-3 py-2.5"><dt className="font-bold text-[#00a174]">收入／資產</dt><dd className="mt-1 leading-relaxed text-zinc-600">{bank.incomeAsset}</dd></div>
                                <div className="px-3 py-2.5"><dt className="font-bold text-[#00a174]">對保／開戶</dt><dd className="mt-1 leading-relaxed text-zinc-600">{bank.signingReq}</dd></div>
                                <div className="px-3 py-2.5"><dt className="font-bold text-[#00a174]">還款／租金帳戶</dt><dd className="mt-1 leading-relaxed text-zinc-600">{bank.rentAccount}</dd></div>
                              </dl>
                            </div>
                            <div className="border border-zinc-200">
                              <p className="bg-[#F5F8F6] px-3 py-2 font-bold text-[#1A2A22]">物件與貸款條件</p>
                              <dl className="divide-y divide-zinc-100">
                                <div className="px-3 py-2.5"><dt className="font-bold text-[#00a174]">物件／屋齡</dt><dd className="mt-1 leading-relaxed text-zinc-600">{bank.propertyReq}</dd></div>
                                <div className="px-3 py-2.5"><dt className="font-bold text-[#00a174]">承作區域</dt><dd className="mt-1 leading-relaxed text-zinc-600">{bank.areaLimit}</dd></div>
                                <div className="px-3 py-2.5"><dt className="font-bold text-[#00a174]">還款方式</dt><dd className="mt-1 leading-relaxed text-zinc-600">{bank.repayment}</dd></div>
                                <div className="px-3 py-2.5"><dt className="font-bold text-[#00a174]">提前清償費</dt><dd className="mt-1 leading-relaxed text-zinc-600">{bank.prepayFee}</dd></div>
                              </dl>
                            </div>
                          </div>

                          <div className="bg-amber-50 p-4 border-t border-amber-100 font-sans text-xs space-y-1.5">
                            <span className="font-bold text-amber-900 block">實務提醒</span>
                            {bank.others.map((other, oIdx) => (
                              <div key={oIdx} className="flex items-start gap-1.5 text-amber-950 leading-relaxed text-justify">
                                <span className="text-amber-700 font-bold">•</span>
                                <span>{other}</span>
                              </div>
                            ))}
                          </div>
                          </>)}
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Japanese Banks */}
                  <section className="border border-[#DDE3DF] hover:border-[#00a174] bg-white p-4 md:p-6 space-y-3 transition-all duration-300 hover:shadow-colored-soft">
                    <SectionHeading
                      icon={Percent}
                      title="在日工作者融資方案整理"
                      description="在日本就業的安心購屋指南：評估正社員年收門檻、在留資格與低利率住宅貸款。"
                    />

                    <div className="grid grid-cols-1 items-start gap-5 font-sans md:grid-cols-2 xl:grid-cols-3">
                      {japaneseBanks.map((bank, idx) => (
                        <article key={idx} className="w-full border border-[#DDE3DF] bg-[#F5F8F6] transition-all duration-300 hover:border-[#00a174] hover:shadow-colored-soft overflow-hidden">
                          <button
                            type="button"
                            onClick={() => toggleBank(`japan-${idx}`)}
                            aria-expanded={expandedBanks.has(`japan-${idx}`)}
                            className="grid min-h-[132px] w-full grid-cols-[1fr_auto] items-center gap-4 p-5 text-left border-none cursor-pointer bg-transparent"
                          >
                            <span className="min-w-0 self-center">
                              <h4 className="line-clamp-2 min-h-10 font-bold text-sm leading-5 text-[#1A2A22]">{bank.name}</h4>
                              <div className="mt-2 line-clamp-2 min-h-12 text-lg font-extrabold leading-6 text-[#00a174]">{bank.rate}</div>
                            </span>
                            <span className="flex shrink-0 flex-col items-center gap-1.5 text-[10px] font-bold text-[#3F5147]">
                              <span>{expandedBanks.has(`japan-${idx}`) ? "收合" : "詳情"}</span>
                              <ChevronDown className={`h-4 w-4 transition-transform ${expandedBanks.has(`japan-${idx}`) ? "rotate-180" : ""}`} />
                            </span>
                          </button>

                          {expandedBanks.has(`japan-${idx}`) && (
                          <div className="border-t border-zinc-300 p-5 pt-4 md:min-h-[420px] xl:min-h-[470px]">
                            <div className="space-y-2 text-xs text-zinc-600">
                              <p><strong>在留簽證：</strong>{bank.visaReq}</p>
                              <p><strong>工作年資：</strong>{bank.workYears}</p>
                              <p><strong>年收入門檻：</strong>{bank.incomeReq}</p>
                              <p><strong>放貸成數：</strong>{bank.downPayment}</p>
                              <p><strong>放貸額度：</strong>{bank.amountLimit}</p>
                              <p><strong>年齡限制：</strong>{bank.ageLimit}</p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-dashed border-zinc-300 text-[11px] text-zinc-500 leading-relaxed text-justify space-y-2">
                            {bank.note.split('\n').filter(line => line.trim()).map((line, lIdx) => {
                              const cleanedLine = line.replace(/^[•·\-\s\*\u2022\u00b7]+/, '').trim();
                              return (
                                <div key={lIdx} className="flex items-start gap-2">
                                  <span className="text-[#00a174] text-[7px] mt-[4.5px] shrink-0 select-none">●</span>
                                  <span className="flex-1">{cleanedLine}</span>
                                </div>
                              );
                            })}
                            </div>
                          </div>
                          )}
                        </article>
                      ))}
                    </div>
                  </section>
                </div>
              )}</>);
}
