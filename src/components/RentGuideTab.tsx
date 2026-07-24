import { motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { Search, ArrowRight, FileText, X, HelpCircle, ChevronDown } from "lucide-react";
import { InitialFeeItem, SpecialTermItem, ProcessStep, QAItem } from "../data/rentGuideData";
import {
  applicationRoutes,
  domesticScreeningDocuments,
  domesticScreeningNotice,
  domesticSop,
  getRentStaticMatches,
  hasMinimumKnowledgeSearchLength,
  overseasScreeningDocuments,
  overseasSop,
  processReminders,
  screeningDocumentDisclaimer,
  type RentStaticSectionId
} from "../data/rentStaticSearchData";
import { renderFormattedText } from "../lib/format";
import { QACard } from "./QACard";
import { JapaneseRuby } from "./JapaneseRuby";

const availabilityStyle = {
  "多": "bg-[#e6f6f1] text-[#007d5a] border-[#9ee2cf]",
  "一般": "bg-[#FFF9ED] text-[#7A5A1F] border-[#DCC8A1]",
  "最少": "bg-[#FBDFD2] text-[#B13818] border-[#E94E2B]",
  "不一定": "bg-[#F2F8FA] text-[#3F626D] border-[#D6EAF0]"
};

function VisaDocumentMatrix({ searchQuery = "" }: { searchQuery?: string }) {
  const [screeningMode, setScreeningMode] = useState<"overseas" | "domestic">("overseas");
  useEffect(() => {
    if (!hasMinimumKnowledgeSearchLength(searchQuery)) return;
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
    const overseasText = overseasScreeningDocuments.flatMap(profile => [profile.profile, ...profile.documents]).join(" ").toLocaleLowerCase();
    const domesticText = [domesticScreeningNotice, ...domesticScreeningDocuments.flatMap(profile => [profile.profile, ...profile.documents])].join(" ").toLocaleLowerCase();
    if (domesticText.includes(normalizedQuery) && !overseasText.includes(normalizedQuery)) {
      setScreeningMode("domestic");
    } else if (overseasText.includes(normalizedQuery)) {
      setScreeningMode("overseas");
    }
  }, [searchQuery]);
  const profiles = screeningMode === "overseas" ? overseasScreeningDocuments : domesticScreeningDocuments;
  return (
    <div className="space-y-5 font-sans">
      <div className="grid grid-cols-2 border border-[#1A2A22] bg-white p-1">
        <button onClick={() => setScreeningMode("overseas")} className={`min-h-12 px-4 py-3 text-sm font-bold ${screeningMode === "overseas" ? "bg-[#1A2A22] text-white" : "text-[#3F5147] hover:bg-[#F5F8F6]"}`}>✈ 海外審査</button>
        <button onClick={() => setScreeningMode("domestic")} className={`min-h-12 px-4 py-3 text-sm font-bold ${screeningMode === "domestic" ? "bg-[#00a174] text-white" : "text-[#3F5147] hover:bg-[#F5F8F6]"}`}>🇯🇵 日本境內審査</button>
      </div>
      {screeningMode === "domestic" && (
        <div className="border-l-4 border-[#00a174] bg-[#e6f6f1] p-4 text-sm leading-7 text-[#3F5147]">{domesticScreeningNotice}</div>
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {profiles.map(profile => (
          <article key={profile.profile} className="flex h-full flex-col border border-[#DDE3DF] bg-white p-5 md:p-6">
            <div className="flex items-start justify-between gap-3 border-b border-[#DDE3DF] pb-3">
              <h6 className="text-base font-bold leading-6 text-[#1A2A22]">{profile.profile}</h6>
              <span className={`shrink-0 border px-2.5 py-1 text-[11px] font-bold ${availabilityStyle[profile.availability]}`}>房源量：{profile.availability}</span>
            </div>
            <p className="mt-4 text-xs font-bold tracking-wider text-[#66736C]">申請時建議先準備</p>
            <ul className="mt-3 space-y-2.5">
              {profile.documents.map(document => <li key={document} className="flex gap-3 text-sm leading-6 text-[#3F5147]"><span className="mt-0.5 font-bold text-[#00a174]">✓</span><span>{document}</span></li>)}
            </ul>
          </article>
        ))}
      </div>
      <div className="border border-[#DCC8A1] bg-[#FFF9ED] p-4 text-xs leading-6 text-[#66583D] md:text-sm">{screeningDocumentDisclaimer}</div>
    </div>
  );
}

function renderTermDetail(detail: string) {
  const nodes: ReactNode[] = [];
  const labelPattern = /(^|\|\s*)([^|：:]+[：:])/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = labelPattern.exec(detail)) !== null) {
    if (match.index > lastIndex) nodes.push(detail.slice(lastIndex, match.index));
    nodes.push(match[1]);
    nodes.push(<strong key={`${match[2]}-${index++}`} className="font-semibold text-[#1A2A22]">{match[2]}</strong>);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < detail.length) nodes.push(detail.slice(lastIndex));
  return nodes;
}

interface RentGuideTabProps {
  kbCategory: string;
  setKbCategory: (c: any) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filtered: { fees: InitialFeeItem[]; terms: SpecialTermItem[]; steps: ProcessStep[]; qa: QAItem[] };
  staticMatches: RentStaticSectionId[];
  hasNoResults: boolean;
  setSelectedFee: (fee: any) => void;
  handleTabChange: (tab: any) => void;
}

export function RentGuideTab(props: RentGuideTabProps) {
  const { kbCategory, setKbCategory, searchQuery, setSearchQuery, filtered, staticMatches, hasNoResults, setSelectedFee, handleTabChange } = props;
  const [documentsExpanded, setDocumentsExpanded] = useState(false);
  const isSearchActive = hasMinimumKnowledgeSearchLength(searchQuery);
  const staticMatchSet = new Set(staticMatches);
  const showSop = !isSearchActive || staticMatchSet.has("sop");
  const showDocuments = !isSearchActive || staticMatchSet.has("documents");
  const showRoutes = !isSearchActive || staticMatchSet.has("routes");
  const showReminders = !isSearchActive || staticMatchSet.has("reminders");
  const isDocumentSearchResult = isSearchActive && staticMatchSet.has("documents");
  const isDocumentsOpen = documentsExpanded || isDocumentSearchResult;
  const showProcessSection =
    filtered.steps.length > 0 || showSop || showDocuments || showRoutes || showReminders;

  return (
            <motion.div
              key="cards"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-8"
              id="pane-cards"
            >
              {/* Preface Section */}
              <div className="border border-[#DDE3DF] hover:border-[#00a174] bg-white p-6 md:p-8 relative transition-all duration-300 hover:shadow-colored-soft" id="cards-preface">
                {/* Traditional Japanese Ribbon Flag decoration */}
                <div className="absolute top-0 right-8 bg-[#00a174] text-white px-3 py-1 text-xs select-none uppercase tracking-widest font-sans">
                  前言 ❀
                </div>
                <h3 className="text-xl font-bold border-b border-[#DDE3DF] pb-3 mb-4 flex items-center gap-2">
                  <span className="material-symbols-rounded shrink-0 select-none text-[22px] leading-none text-[#00a174]" aria-hidden="true">key</span>
                  <span>致所有來日本打拼的人</span>
                  <span className="text-[#00a174] text-sm font-normal">By Linus</span>
                </h3>
                <p className="text-zinc-800 leading-relaxed text-justify first-letter:text-2xl first-letter:font-bold first-letter:text-[#00a174] first-letter:mr-1">
                  大家好，我是 Linus，目前在日本東京從事不動產仲介工作。來到日本留學、打工度假或就職，找一個能安心落腳的家，往往是最先面對的大事。為了協助大家在初來乍到時，用較短時間看懂日本租屋的制度與常見費用、少走冤枉路，我整理了這份「日本租屋知識大補帖」。
                </p>
                <p className="text-zinc-800 leading-relaxed text-justify mt-4">
                  日本租屋有許多和台灣不同的一次性費用，例如禮金、保證公司費用與鑰匙更換費；契約條款也會因物件與管理公司而不同。希望這份租屋知識整理、租金預算計算機與 AI 顧問，能幫您在申請前看懂條件、做好預算。祝您在日本的生活一切順利！❀
                </p>
                
                {/* Visual Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-dashed border-zinc-300 font-sans">
                  <div className="bg-[#F5F8F6] p-4 border border-[#DDE3DF] hover:border-[#00a174] transition-colors">
                    <h4 className="font-bold text-[#00a174] flex items-center gap-2 text-sm">
                      <span className="material-symbols-rounded shrink-0 select-none text-[18px] leading-none" aria-hidden="true">calculate</span>
                      <span>需要估算理想房租預算嗎？</span>
                    </h4>
                    <p className="text-xs text-zinc-600 mt-1">
                      根據東京 23 區實務數據，自動套用免治馬桶、步行時間、屋齡等增減價公式。
                    </p>
                    <button 
                      onClick={() => handleTabChange("calculator")}
                      className="mt-3 text-xs font-bold text-[#00a174] hover:text-[#007d5a] flex items-center gap-1 cursor-pointer"
                    >
                      <span>前往預算計算機</span> <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="bg-[#F5F8F6] p-4 border border-[#DDE3DF] hover:border-[#00a174] transition-colors">
                    <h4 className="font-bold text-[#00a174] flex items-center gap-2 text-sm">
                      <span className="material-symbols-rounded shrink-0 select-none text-[18px] leading-none" aria-hidden="true">smart_toy</span>
                      <span>有特定的疑難雜症想直接問 AI 嗎？</span>
                    </h4>
                    <p className="text-xs text-zinc-600 mt-1">
                      本系統已將完整大補帖融入 AI 顧問，支援多輪對話，能快速精準解答。
                    </p>
                    <button 
                      onClick={() => handleTabChange("chat")}
                      className="mt-3 text-xs font-bold text-[#00a174] hover:text-[#007d5a] flex items-center gap-1 cursor-pointer"
                    >
                      <span>開始 AI 找房諮詢</span> <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid Control & Search Block */}
              <div className="border border-[#DDE3DF] hover:border-[#00a174] bg-white p-4 flex flex-col md:flex-row gap-4 justify-between items-center transition-all duration-300 hover:shadow-colored-soft" id="kb-filter-bar">
                {/* Horizontal Category selectors */}
                <div className="flex flex-wrap gap-2 w-full md:w-auto font-sans">
                  {[
                    { id: "all", label: "全部內容" },
                    { id: "initial", label: "初期費用與契約" },
                    { id: "terms", label: "房屋與設備" },
                    { id: "steps", label: "房屋申請步驟" },
                    { id: "qa", label: "租屋問答集" }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setKbCategory(cat.id as any)}
                      className={`px-3 py-1.5 text-xs font-medium cursor-pointer border transition-colors ${
                        kbCategory === cat.id 
                          ? "bg-[#00a174] text-white border-[#00a174]" 
                          : "bg-white text-zinc-700 border-zinc-300 hover:border-[#00a174]"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Filter Search Field */}
                <div className="relative w-full md:w-72 font-sans">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="在知識庫中搜尋 (如：敷金)..."
                    minLength={2}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 text-sm bg-white border border-[#DDE3DF] focus:outline-none focus:border-[#00a174]"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Search results message */}
              {searchQuery.trim() && !isSearchActive && (
                <div className="border-l-4 border-[#DCC8A1] bg-[#FFF9ED] px-4 py-3 text-sm text-[#66583D] font-sans">
                  請輸入至少 2 個字的完整詞，例如「先行契約」或「保證公司」。
                </div>
              )}
              {isSearchActive && (
                <div className="text-sm text-zinc-600 px-1 font-sans">
                  關鍵字「{searchQuery.trim()}」搜尋結果：
                </div>
              )}

              {/* NO RESULTS VIEW */}
              {hasNoResults && (
                <div className="border border-dashed border-zinc-300 bg-white py-12 text-center space-y-4">
                  <HelpCircle className="w-12 h-12 text-[#00a174] mx-auto opacity-75" />
                  <div className="space-y-1">
                    <p className="text-base font-bold">找不到符合「{searchQuery}」的項目</p>
                    <p className="text-sm text-zinc-500 font-sans">請嘗試換一個詞，或者直接點擊 AI 顧問諮詢 Linus！</p>
                  </div>
                  <button 
                    onClick={() => {
                      setSearchQuery("");
                      handleTabChange("chat");
                    }}
                    className="px-4 py-2 bg-[#1A2A22] text-white text-xs tracking-wider uppercase font-sans font-bold hover:bg-[#00a174] cursor-pointer"
                  >
                    開啟 AI 對話諮詢
                  </button>
                </div>
              )}

              {/* CARD SECTOR: INITIAL FEES */}
              {filtered.fees.length > 0 && (
                <section className="space-y-4">
                  <h3 className="text-lg font-bold border-l-4 border-[#00a174] pl-3 flex items-center justify-between">
                    <span>初期費用與契約術語</span>
                    <span className="text-xs text-zinc-500 font-normal font-sans">共 {filtered.fees.length} 項</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.fees.map((fee, idx) => (
                      <div 
                        key={idx} 
                        className="border border-[#DDE3DF] hover:border-[#00a174] bg-white p-5 flex flex-col justify-between hover:shadow-colored-soft hover:-translate-y-0.5 transition-all duration-300 cursor-pointer relative"
                        onClick={() => setSelectedFee(fee)}
                      >
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <h4 className="font-bold text-base leading-[1.8] text-[#1A2A22]"><JapaneseRuby text={fee.name} /></h4>
                            {fee.jpName && (
                              <span className="text-xs bg-[#F5F8F6] px-1.5 py-0.5 border border-zinc-200 text-zinc-600 font-sans font-medium">{fee.jpName}</span>
                            )}
                          </div>
                          <p className="text-sm text-zinc-700 leading-relaxed line-clamp-3">
                            {fee.description}
                          </p>
                        </div>
                        
                        {fee.warning && (
                          <div className="mt-3 pt-2.5 border-t border-dashed border-zinc-200 text-xs text-[#00a174] line-clamp-1 font-sans">
                            {fee.warning}
                          </div>
                        )}
                        <div className="mt-4 flex items-center justify-between text-xs text-zinc-400 font-sans">
                          <span>初期費用／契約</span>
                          <span className="text-zinc-600 flex items-center gap-0.5 hover:text-[#00a174]">查看說明 →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* CARD SECTOR: SPECIAL TERMS */}
              {filtered.terms.length > 0 && (
                <section className="space-y-4 pt-4">
                  <h3 className="text-lg font-bold border-l-4 border-[#00a174] pl-3 flex items-center justify-between">
                    <span>房屋與設備術語</span>
                    <span className="text-xs text-zinc-500 font-normal font-sans">共 {filtered.terms.length} 項</span>
                  </h3>
                  <div className="space-y-4">
                    {filtered.terms.map((term, idx) => (
                      <div key={idx} className="border border-[#DDE3DF] hover:border-[#00a174] bg-white p-6 transition-all duration-300 hover:shadow-colored-soft">
                        <div className="flex justify-between items-start gap-3 mb-3">
                          <h4 className="min-w-0 text-base font-bold text-[#1A2A22] flex flex-wrap items-center gap-2">
                            <span className="leading-[1.8]"><JapaneseRuby text={term.name} /></span>
                            {term.jpName && (
                              <span className="text-xs bg-zinc-100 text-zinc-600 px-1.5 py-0.5 font-normal font-sans">{term.jpName}</span>
                            )}
                          </h4>
                          <span className="shrink-0 text-xs text-zinc-400 font-sans">房屋／設備</span>
                        </div>
                        <div className="text-sm text-zinc-700 leading-relaxed mb-4">{renderFormattedText(term.description)}</div>
                        
                        {term.details && term.details.length > 0 && (
                          <div className="bg-[#F5F8F6] p-4 border border-zinc-200 space-y-2.5">
                            {term.details.map((detail, dIdx) => (
                              <div key={dIdx} className="text-xs text-zinc-800 leading-relaxed flex items-start gap-2 font-sans">
                                <span className="text-[#00a174] font-bold shrink-0">✦</span>
                                <span className="text-justify">{renderTermDetail(detail)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* CARD SECTOR: PROCESS STEPS */}
              {showProcessSection && (
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
                      9個核心步驟
                    </div>
                    <h4 className="text-base font-bold text-[#1A2A22] border-b border-zinc-200 pb-3 mb-6">
                      日本租屋審查、付款與交屋步驟分解
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
              )}

              {/* CARD SECTOR: Q&A */}
              {filtered.qa.length > 0 && (
                <section className="space-y-4 pt-4">
                  <h3 className="text-lg font-bold border-l-4 border-[#00a174] pl-3 flex items-center justify-between">
                    <span>常見租屋問題 Q&A</span>
                    <span className="text-xs text-zinc-500 font-normal font-sans">共 {filtered.qa.length} 問</span>
                  </h3>
                  <div className="space-y-4">
                    {filtered.qa.map((qa, idx) => <QACard key={qa.id} question={qa.question} answer={qa.answer} number={idx + 1} />)}
                  </div>
                </section>
              )}
            </motion.div>
  );
}
