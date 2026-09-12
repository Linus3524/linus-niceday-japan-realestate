import { Building, ChevronDown, Map } from "lucide-react";
import type * as React from 'react';
import {
minpakuRules, ryokanRules
} from "../../data/buyHouseData";
import { renderFormattedText } from "../../lib/format";
import { SectionHeading } from "../SectionHeading";

interface Props {
  isBuySearchActive: boolean;
  buyCategory: string;
  toggleMinpakuWard: (district: string) => void;
  expandedMinpakuWards: Set<string>;
  setRyokanExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  ryokanExpanded: boolean;
  minpakuWardOrder: string[];
  getMinpakuLimitLabel: (daysLimit: string) => "週末為主" | "指定期間營業" | "依區域個別確認" | "180 天＋區域限制" | "最多 180 天／年";
  getMinpakuAreaLabel: (areaLimit: string) => "全區" | "商業區以外" | "住宅區／學校周邊" | "住宅區／文教區" | "住居專用區" | "文教區" | "依物件所在地確認";
}
export function BuyLodgingSection({ isBuySearchActive, buyCategory, toggleMinpakuWard, expandedMinpakuWards, setRyokanExpanded, ryokanExpanded, minpakuWardOrder, getMinpakuLimitLabel, getMinpakuAreaLabel }: Props) {
  return (<>{!isBuySearchActive && (buyCategory === "all" || buyCategory === "minpaku") && (
                <div className="space-y-6">
                  {/* Minpaku District Rules */}
                  <section className="border border-[#DDE3DF] hover:border-[#00a174] bg-white p-4 md:p-6 space-y-3 transition-all duration-300 hover:shadow-colored-soft">
                    <SectionHeading
                      icon={Map}
                      title="東京都 23 區住宅宿泊事業條例整理"
                      description="180 天營業上限與區域天條！看懂東京都 23 區民泊新法規範，避開限制地雷區。"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-3 border border-zinc-200 font-sans text-xs">
                      <div className="p-4 bg-[#F5F8F6] border-b sm:border-b-0 sm:border-r border-zinc-200">
                        <p className="text-zinc-500">全國共同上限</p>
                        <p className="mt-1 text-lg font-bold text-[#00a174]">180 天／年</p>
                      </div>
                      <div className="p-4 border-b sm:border-b-0 sm:border-r border-zinc-200">
                        <p className="text-zinc-500">本表怎麼看</p>
                        <p className="mt-1 font-medium text-zinc-800 leading-relaxed">先看「營業限制」，再確認受限區域與管理／周知要求。</p>
                      </div>
                      <div className="p-4 bg-amber-50">
                        <p className="text-amber-700">重要提醒</p>
                        <p className="mt-1 font-medium text-amber-900 leading-relaxed">家主居住型與不在型，適用規則可能不同。</p>
                      </div>
                    </div>

                    <div className="columns-1 gap-4 font-sans xl:columns-2">
                      {[...minpakuRules].sort((a, b) => minpakuWardOrder.indexOf(a.district) - minpakuWardOrder.indexOf(b.district)).map((item) => (
                        <article key={item.district} className="mb-4 inline-block w-full break-inside-avoid border border-[#DDE3DF] bg-white align-top overflow-hidden transition-all duration-300 hover:border-[#00a174] hover:shadow-colored-soft">
                          <button
                            type="button"
                            onClick={() => toggleMinpakuWard(item.district)}
                            aria-expanded={expandedMinpakuWards.has(item.district)}
                            className="grid min-h-[58px] w-full grid-cols-[minmax(72px,auto)_1fr_auto] items-center gap-3 bg-[#F5F8F6] hover:bg-[#e6f6f1] px-4 py-2.5 text-left border-none cursor-pointer transition-colors"
                          >
                            <h4 className="text-base font-bold text-[#1A2A22]">{item.district}</h4>
                            <span className="min-w-0 justify-self-end whitespace-nowrap bg-[#DDF3EA] px-2.5 py-1 text-[11px] font-bold leading-4 text-[#087154]">
                              {getMinpakuLimitLabel(item.daysLimit)}
                            </span>
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500">
                              <span>{expandedMinpakuWards.has(item.district) ? "收合" : "詳情"}</span>
                              <ChevronDown className={`h-4 w-4 shrink-0 transition-transform text-zinc-500 ${expandedMinpakuWards.has(item.district) ? "rotate-180" : ""}`} />
                            </span>
                          </button>
                          {expandedMinpakuWards.has(item.district) && (
                          <dl className="divide-y divide-zinc-200 border-t border-[#DDE3DF] text-xs leading-relaxed">
                            <div className="grid grid-cols-[76px_1fr] gap-3 bg-[#F2F8F5] px-4 py-3">
                              <dt className="font-bold text-[#087154]">營業天數</dt>
                              <dd className="font-medium text-zinc-700">{item.daysLimit}</dd>
                            </div>
                            <div className="grid grid-cols-[76px_1fr] gap-3 px-4 py-3">
                              <dt className="font-bold text-[#00a174]">營業限制</dt>
                              <dd className="text-zinc-700">{item.rules}</dd>
                            </div>
                            <div className="grid grid-cols-[76px_1fr] gap-3 px-4 py-3 bg-[#F9FBFA]">
                              <dt className="font-bold text-zinc-600">受限區域</dt>
                              <dd className="min-w-0 text-zinc-600">
                                <span className="inline-flex bg-[#E9F3EE] px-2 py-1 font-bold leading-none text-[#315E50]">
                                  {getMinpakuAreaLabel(item.areaLimit)}
                                </span>
                                <p className="mt-2 leading-relaxed">{item.areaLimit}</p>
                              </dd>
                            </div>
                            <div className="grid grid-cols-[76px_1fr] gap-3 px-4 py-3">
                              <dt className="font-bold text-zinc-600">管理／周知</dt>
                              <dd className="text-zinc-600">{item.managerReq}</dd>
                            </div>
                          </dl>
                          )}
                        </article>
                      ))}
                    </div>

                    <div className="bg-amber-50 p-4 border-l-4 border-amber-500 text-xs text-amber-950 leading-relaxed font-sans">
                      <strong>投資前必查：</strong>最新區條例、用途地域、建築與消防條件、管理規約及管理體制。上方內容是快速篩選用摘要，不能取代自治體就個別物件作出的確認。
                    </div>
                  </section>

                  {/* Ryokan requirements */}
                  <section className="border border-[#DDE3DF] bg-white p-4 md:p-6 space-y-3 transition-all duration-300 hover:border-[#00a174] hover:shadow-colored-soft">
                    <button
                      type="button"
                      onClick={() => setRyokanExpanded(current => !current)}
                      aria-expanded={ryokanExpanded}
                      className={`flex w-full items-start justify-between gap-4 text-left ${ryokanExpanded ? "border-b border-zinc-200 pb-3" : ""}`}
                    >
                      <span className="flex items-start gap-2">
                        <Building className="mt-0.5 h-5 w-5 shrink-0 text-[#00a174]" />
                        <span>
                          <span className="block text-xl font-bold text-[#1A2A22]">{ryokanRules.title}</span>
                          <span className="mt-1 block text-xs font-normal leading-relaxed text-zinc-500 font-sans">全年經營所需的用途、建築、消防與許可確認重點</span>
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2 text-xs font-bold text-[#00a174] font-sans">
                        {ryokanExpanded ? "收合" : "展開查看"}
                        <ChevronDown className={`h-4 w-4 transition-transform ${ryokanExpanded ? "rotate-180" : ""}`} />
                      </span>
                    </button>

                    {ryokanExpanded && (<>
                    <p className="text-xs text-zinc-500 font-sans leading-relaxed">
                      如果您希望合法全年經營、且不受住宅宿泊事業 180 天上限限制，可評估向保健所申請「簡易宿所」等旅館業營業許可；但須先完成用途、建築、消防與所在地自治體的個案確認：
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 font-sans">
                      {/* Left side Steps */}
                      <div className="md:col-span-7 space-y-4">
                        <span className="font-bold text-sm text-[#1A2A22] block">◎ 旅館業許可申請 5 個核心階段：</span>
                        <div className="space-y-3 text-xs">
                          {ryokanRules.steps.map((step, sIdx) => (
                            <div key={sIdx} className="bg-[#F5F8F6] p-3 border border-zinc-200 flex gap-3">
                              <span className="font-bold text-[#00a174] shrink-0 text-sm font-sans">0{sIdx+1}</span>
                              <div className="space-y-0.5">
                                <strong className="text-zinc-800 text-[13px]">{step.name}</strong>
                                <div className="text-zinc-500 leading-relaxed text-justify">{renderFormattedText(step.desc)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right side requirements */}
                      <div className="md:col-span-5 space-y-4">
                        <span className="font-bold text-sm text-[#1A2A22] block">◎ 簡易宿所硬體與消防規範：</span>
                        <div className="bg-[#F5F8F6] p-5 border border-zinc-200 space-y-4 text-xs">
                          {ryokanRules.requirements.map((req, rIdx) => (
                            <div key={rIdx} className="flex items-start gap-2 text-zinc-700 leading-relaxed text-justify">
                              <span className="text-[#00a174] font-bold">✓</span>
                              <span>{req}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      {ryokanRules.warnings.map((warn, wIdx) => (
                        <div key={wIdx} className="bg-yellow-50 border-l-4 border-yellow-600 p-3 text-xs text-yellow-800 font-sans leading-relaxed text-justify">
                          {warn}
                        </div>
                      ))}
                    </div>
                    </>)}
                  </section>
                </div>
              )}</>);
}
