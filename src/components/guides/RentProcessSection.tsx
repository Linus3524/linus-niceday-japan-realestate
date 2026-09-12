import { ChevronDown, FileText } from "lucide-react";
import type * as React from 'react';
import {
applicationRoutes,
domesticSop,
overseasSop,
processReminders
} from "../../data/rentStaticSearchData";
import { renderFormattedText } from "../../lib/format";

interface Props {
  isSearchActive: boolean;
  showProcessSection: boolean;
  showSop: boolean;
  showDocuments: boolean;
  setDocumentsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  isDocumentSearchResult: boolean;
  isDocumentsOpen: boolean;
  searchQuery: string;
  showRoutes: boolean;
  filtered: { fees: import("../../data/rentGuideData").InitialFeeItem[]; terms: import("../../data/rentGuideData").SpecialTermItem[]; steps: import("../../data/rentGuideData").ProcessStep[]; qa: import("../../data/rentGuideData").QAItem[]; };
  showReminders: boolean;
  VisaDocumentMatrix: ({ searchQuery }: { searchQuery?: string; }) => React.JSX.Element;
}
export function RentProcessSection({ isSearchActive, showProcessSection, showSop, showDocuments, setDocumentsExpanded, isDocumentSearchResult, isDocumentsOpen, searchQuery, showRoutes, filtered, showReminders, VisaDocumentMatrix }: Props) {
  return (<>{!isSearchActive && showProcessSection && (
                <section className="space-y-4 pt-4">
                  <h3 className="text-lg font-bold border-l-4 border-[#00a174] pl-3">
                    <span>日本租屋正式申請與引渡流程 SOP</span>
                  </h3>

                  {/* General / Overseas SOP highlight banner */}
                  {showSop && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-xs">
                    <div className="bg-white p-5 border border-[#DDE3DF] hover:border-[#00a174] transition-all duration-300 hover:shadow-colored-soft relative">
                      <div className="absolute top-0 right-0 bg-[#00a174] text-white px-2 py-0.5 font-bold font-jost text-[10px] tracking-wide">{overseasSop.badge}</div>
                      <h4 className="font-bold text-sm text-[#00a174] mb-2 flex items-center gap-1.5">
                        <span>✈ {overseasSop.title}</span>
                      </h4>
                      <p className="text-zinc-600 leading-relaxed text-justify mb-3">
                        {overseasSop.description}
                      </p>
                      <div className="bg-[#F5F8F6] p-4 border border-zinc-200">
                        <span className="font-bold text-[#1A2A22] block border-b border-zinc-300 pb-1.5 mb-2.5 font-sans">📋 海外審査 SOP 完整步驟：</span>
                        <div className="space-y-2 text-xs text-zinc-700 font-sans leading-relaxed">
                          {overseasSop.steps.map((step, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className="bg-[#1A2A22] text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold font-mono shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-5 border border-[#DDE3DF] hover:border-[#00a174] transition-all duration-300 hover:shadow-colored-soft relative">
                      <div className="absolute top-0 right-0 bg-[#00a174] text-white px-2 py-0.5 font-bold font-jost text-[10px] tracking-wide">{domesticSop.badge}</div>
                      <h4 className="font-bold text-sm text-[#00a174] mb-2 flex items-center gap-1.5">
                        <span>🇯🇵 {domesticSop.title}</span>
                      </h4>
                      <p className="text-zinc-600 leading-relaxed text-justify mb-3">
                        {domesticSop.description}
                      </p>
                      <div className="bg-[#F5F8F6] p-4 border border-zinc-200">
                        <span className="font-bold text-[#1A2A22] block border-b border-zinc-300 pb-1.5 mb-2.5 font-sans">📋 入境審査 SOP 完整步驟：</span>
                        <div className="space-y-2 text-xs text-zinc-700 font-sans leading-relaxed">
                          {domesticSop.steps.map((step, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className="bg-[#00a174] text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold font-mono shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  )}

                  {/* Required Documents Section for Overseas vs Domestic Screenings */}
                  {showDocuments && (
                  <div className="border border-[#DDE3DF] hover:border-[#00a174] bg-[#F5F8F6] p-6 relative transition-all duration-300 hover:shadow-colored-soft">
                    <button
                      type="button"
                      onClick={() => setDocumentsExpanded(current => !current)}
                      disabled={isDocumentSearchResult}
                      aria-expanded={isDocumentsOpen}
                      aria-controls="screening-document-matrix"
                      className={`flex w-full items-center justify-between gap-4 text-left ${isDocumentsOpen ? "border-b border-zinc-300 pb-3 mb-4" : ""}`}
                    >
                      <span className="flex min-w-0 items-start gap-3">
                        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#00a174]" />
                        <span>
                          <span className="block text-sm font-bold text-[#1A2A22] md:text-base">審査所需資料與準備文件對照</span>
                          <span className="mt-1 block text-xs font-normal leading-relaxed text-[#66736C]">依海外／日本境內審査與目前身份，查看建議先準備的文件</span>
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2 text-xs font-bold text-[#00a174]">
                        {isDocumentSearchResult ? "符合搜尋" : isDocumentsOpen ? "收合" : "展開查看"}
                        {!isDocumentSearchResult && (
                          <ChevronDown className={`h-4 w-4 transition-transform ${isDocumentsOpen ? "rotate-180" : ""}`} />
                        )}
                      </span>
                    </button>

                    {isDocumentsOpen && (
                      <div id="screening-document-matrix">
                        <VisaDocumentMatrix searchQuery={searchQuery} />
                      </div>
                    )}
                    <div className="hidden" aria-hidden="true">
                      <div className="bg-white p-5 border border-zinc-300 space-y-3">
                        <h5 className="font-bold text-[#00a174] text-xs uppercase tracking-wider border-b border-zinc-100 pb-1 flex items-center gap-1.5">
                          <span>✈ 海外審査需要資料</span>
                        </h5>
                        <ul className="space-y-2 text-xs text-zinc-700 leading-normal font-sans">
                          <li className="flex items-start gap-1.5">
                            <span className="text-[#00a174] font-bold">•</span>
                            <span><strong>護照影本：</strong>個人照片頁、簽證貼紙頁（若已核發）。</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-[#00a174] font-bold">•</span>
                            <span><strong>在留資格認定證明書 (COE)：</strong>或打工度假簽證證明。</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-[#00a174] font-bold">•</span>
                            <span><strong>入學許可書 / 內定通知書：</strong>學生提供學校錄取書；就職者提供公司給予的內定通知/薪資證明。</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-[#00a174] font-bold">•</span>
                            <span><strong>存款餘額證明：</strong>打工度假或預算有限者，保證公司通常要求提供等值 12 至 15 個月房租的個人存款證明（台幣或日幣均可）。提供海外帳戶的「網路銀行餘額截圖（含帳號）」加「存摺封面」即可，正式的銀行餘額證明也可以，不需要英文版本。</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-[#00a174] font-bold">•</span>
                            <span><strong>緊急聯絡人：</strong>通常需要兩位，一位為母國二親等內家長（能提供戶籍謄本佐證親屬關係較佳），另一位為日本在留者（部分保證會社要求，若無可向仲介諮詢協助）。</span>
                          </li>
                        </ul>
                      </div>

                      <div className="bg-white p-5 border border-zinc-300 space-y-3">
                        <h5 className="font-bold text-[#00a174] text-xs uppercase tracking-wider border-b border-zinc-100 pb-1 flex items-center gap-1.5">
                          <span>🇯🇵 境內審査需要資料</span>
                        </h5>
                        <ul className="space-y-2 text-xs text-zinc-700 leading-normal font-sans">
                          <li className="flex items-start gap-1.5">
                            <span className="text-[#00a174] font-bold">•</span>
                            <span><strong>護照影本：</strong>個人照片頁、日本入境章戳頁。</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-[#00a174] font-bold">•</span>
                            <span><strong>在留卡（正反面）：</strong>住居地欄位及申報狀態依個案確認；不得把沒有實際居住的親友、飯店或短租地址當成自己的住址申報。</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-[#00a174] font-bold">•</span>
                            <span><strong>日本手機門號：</strong>保證會社審査時會撥打電話照會，必須能正常通話與接聽。</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-[#00a174] font-bold">•</span>
                            <span><strong>日本銀行帳戶 & 提款卡/存摺：</strong>合約通過後綁定每個月房租自動扣款使用。</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-[#00a174] font-bold">•</span>
                            <span><strong>所得證明 / 學生證：</strong>在日就職者需提供近期的源泉徵收票、課稅證明書或薪資單；學生需提供在學證明或學生證影本。</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-[#00a174] font-bold">•</span>
                            <span><strong>在日緊急聯絡人：</strong>通常要求必須是居住在日本境內、且能用日文進行基本電話溝通的朋友或長輩。</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  )}

                  {/* Application route comparison */}
                  {showRoutes && (
                  <div className="border border-[#DDE3DF] bg-white p-6 transition-all duration-300 hover:shadow-colored-soft">
                    <div className="mb-4 flex flex-col gap-1 border-b border-zinc-200 pb-3 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h4 className="text-base font-bold text-[#1A2A22]">申請前，先確認是哪一種流程</h4>
                        <p className="mt-1 text-xs leading-relaxed text-zinc-600 font-sans">是否已退房、能否內見，會直接影響申請後還有沒有改變決定的空間。</p>
                      </div>
                      <span className="text-xs font-bold text-[#00a174] font-sans">三種申請方式</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3 font-sans">
                      {applicationRoutes.map((route, index) => (
                        <div key={route.title} className="border border-[#DDE3DF] p-4">
                          <div className="mb-3 flex items-start justify-between gap-2">
                            <h5 className="text-sm font-bold text-[#1A2A22]">{route.title}</h5>
                            <span className={`shrink-0 px-1.5 py-0.5 text-[10px] font-bold ${index === 2 ? "bg-[#FBDFD2] text-[#B13818]" : "bg-[#e6f6f1] text-[#007d5a]"}`}>{route.condition}</span>
                          </div>
                          <p className="text-xs leading-relaxed text-zinc-700">{route.body}</p>
                          <p className={`mt-3 border-t border-zinc-100 pt-2 text-[11px] font-bold ${index === 2 ? "text-[#B13818]" : "text-[#00a174]"}`}>{route.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  )}

                  {/* Vertical Linear Steps Timeline */}
                  {filtered.steps.length > 0 && (
                  <div className="border border-[#DDE3DF] bg-white p-6 relative transition-all duration-300 hover:shadow-colored-soft">
                    <div className="absolute top-0 right-6 bg-[#00a174] text-white px-2.5 py-0.5 text-xs tracking-widest font-sans font-medium uppercase">
                      租屋申請9步驟
                    </div>
                    <h4 className="text-base font-bold text-[#1A2A22] border-b border-zinc-200 pb-3 mb-6">
                      租屋審查、付款與入住步驟全解析
                      <span className="mt-1 block text-xs font-normal leading-relaxed text-zinc-500 font-sans">從送件到入住後屋況確認：每一步該確認什麼、通常要等多久，都整理在這裡。</span>
                    </h4>

                    <div className="relative border-l border-[#DDE3DF] ml-3 pl-6 space-y-8 py-2">
                      {filtered.steps.map((step, idx) => (
                        <div key={idx} className="relative group">
                          {/* Single numbered timeline node: the title itself no longer repeats the step number. */}
                          <div className="absolute -left-[38px] top-0.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#00a174] bg-white text-xs font-bold text-[#00a174] font-sans transition-colors group-hover:bg-[#00a174] group-hover:text-white">
                            {step.id}
                          </div>

                          <div className="flex flex-col md:flex-row justify-between items-start gap-2 mb-1.5">
                            <h5 className="font-bold text-sm text-[#1A2A22]">
                              {step.name.replace(/^[①②③④⑤⑥⑦⑧⑨]\s*/, "")}
                            </h5>
                            <span className="text-xs bg-[#F5F8F6] border border-zinc-300 text-zinc-600 px-2 py-0.5 font-sans shrink-0">
                              作業天數：{step.duration}
                            </span>
                          </div>
                          <div className="border-l-2 border-[#9ee2cf] pl-3 text-xs text-zinc-700 leading-relaxed text-justify font-sans">
                            <span className="mr-2 text-[10px] font-bold tracking-wide text-[#00a174]">作業重點</span>
                            {renderFormattedText(step.description)}
                          </div>
                          {step.details && step.details.length > 0 && (
                            <ul className="mt-3 space-y-1.5 pl-3 text-xs leading-relaxed text-zinc-600 font-sans">
                              {step.details.map((detail, detailIndex) => (
                                <li key={detailIndex} className="flex gap-2">
                                  <span className="shrink-0 text-[#00a174]">•</span>
                                  <span>{detail}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  )}

                  {showReminders && (
                    <div className="bg-[#F5F8F6] p-4 border border-zinc-200 text-xs text-zinc-600 leading-relaxed font-sans space-y-2">
                      <span className="font-bold text-[#00a174] block">★ Linus 實務小提醒：</span>
                      <ul className="space-y-1.5">
                        {processReminders.map(reminder => (
                          <li key={reminder} className="flex gap-2">
                            <span className="shrink-0 text-[#00a174]">•</span>
                            <span>{reminder}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              )}</>);
}
