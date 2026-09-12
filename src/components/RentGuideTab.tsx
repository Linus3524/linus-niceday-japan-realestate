import { ArrowRight, Search, X } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { InitialFeeItem, ProcessStep, QAItem, SpecialTermItem } from "../data/rentGuideData";
import {
applicationRoutes,
domesticSop,
hasMinimumKnowledgeSearchLength,
overseasSop,
processReminders,
type RentStaticSectionId
} from "../data/rentStaticSearchData";
import { searchThreads } from "../lib/threadSearch";
import type { AppTab, RentGuideCategory, SelectTerm, SendMessage } from "../lib/uiTypes";
import { SpecialTermCard, VisaDocumentMatrix } from './guides/rentGuideCards';
import { RentProcessSection } from './guides/RentProcessSection';
import { RentSearchResults } from './guides/RentSearchResults';
import { JapaneseRuby } from "./JapaneseRuby";
import { PageIntroCard } from "./PageIntroCard";
import { QACard } from "./QACard";

interface RentGuideTabProps {
  kbCategory: string;
  setKbCategory: (c: RentGuideCategory) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filtered: { fees: InitialFeeItem[]; terms: SpecialTermItem[]; steps: ProcessStep[]; qa: QAItem[] };
  staticMatches: RentStaticSectionId[];
  hasNoResults: boolean;
  setSelectedFee: SelectTerm;
  handleTabChange: (tab: AppTab) => void;
  handleSendMessage: SendMessage;
}

export function RentGuideTab(props: RentGuideTabProps) {
  const { kbCategory, setKbCategory, searchQuery, setSearchQuery, filtered, staticMatches, hasNoResults, setSelectedFee, handleTabChange, handleSendMessage } = props;
  const [documentsExpanded, setDocumentsExpanded] = useState(false);
  const isSearchActive = hasMinimumKnowledgeSearchLength(searchQuery);
  const staticMatchSet = new Set(staticMatches);
  const isStepsCategory = kbCategory === "all" || kbCategory === "steps";
  const showSop = isStepsCategory && (!isSearchActive || staticMatchSet.has("sop"));
  const showDocuments = isStepsCategory && (!isSearchActive || staticMatchSet.has("documents"));
  const showRoutes = isStepsCategory && (!isSearchActive || staticMatchSet.has("routes"));
  const showReminders = isStepsCategory && (!isSearchActive || staticMatchSet.has("reminders"));
  const isDocumentSearchResult = isSearchActive && staticMatchSet.has("documents");
  const isDocumentsOpen = documentsExpanded || isDocumentSearchResult;
  const showProcessSection =
    filtered.steps.length > 0 || showSop || showDocuments || showRoutes || showReminders;
  const staticRentSearchItems = [
    {
      id: "sop" as const,
      category: "申請流程",
      title: "海外與日本境內申請流程",
      text: `${overseasSop.description} ${domesticSop.description}`
    },
    {
      id: "documents" as const,
      category: "審査文件",
      title: "審査所需資料與準備文件",
      text: "依海外或日本境內申請、簽證與工作狀況，整理送審前應準備的身分、收入、就職及財力文件。"
    },
    {
      id: "routes" as const,
      category: "申請方式",
      title: "一般申請、先行申請與先行契約",
      text: applicationRoutes.map(route => `${route.title}：${route.condition}，${route.body}`).join(" ")
    },
    {
      id: "reminders" as const,
      category: "實務提醒",
      title: "申請、付款與入住注意事項",
      text: processReminders.join(" ")
    }
  ].filter(item => staticMatchSet.has(item.id));
  const rentSearchResultCount =
    filtered.fees.length +
    filtered.terms.length +
    filtered.steps.length +
    filtered.qa.length +
    staticRentSearchItems.length;
  const threadMatches = isSearchActive
    ? searchThreads(searchQuery, { context: "rent", limit: 3 })
    : { results: [], total: 0 };

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
              <PageIntroCard
                id="cards-preface"
                icon="key"
                title="致所有來日本打拼的人"
                actions={
                  <>
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
                  </>
                }
              >
                <p>
                  大家好，我是 Linus，目前在日本東京從事不動產仲介工作。來到日本留學、打工度假或就職，找一個能安心落腳的家，往往是最先面對的大事。為了協助大家在初來乍到時，用較短時間看懂日本租屋的制度與常見費用、少走冤枉路，我整理了這份「日本租屋知識大補帖」。
                </p>
                <p>
                  日本租屋有許多和台灣不同的一次性費用，例如禮金、保證公司費用與鑰匙更換費；契約條款也會因物件與管理公司而不同。希望這份租屋知識整理、租金預算計算機與 AI 顧問，能幫您在申請前看懂條件、做好預算。祝您在日本的生活一切順利！❀
                </p>
              </PageIntroCard>

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
                      onClick={() => setKbCategory(cat.id as RentGuideCategory)}
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
                    placeholder="搜尋租屋知識（如：敷金）..."
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
              <RentSearchResults isSearchActive={isSearchActive} searchQuery={searchQuery} rentSearchResultCount={rentSearchResultCount} threadMatches={threadMatches} setSearchQuery={setSearchQuery} hasNoResults={hasNoResults} filtered={filtered} setSelectedFee={setSelectedFee} staticRentSearchItems={staticRentSearchItems} />

              {/* CARD SECTOR: INITIAL FEES */}
              {!isSearchActive && filtered.fees.length > 0 && (
                <section className="space-y-4">
                  <h3 className="text-lg font-bold border-l-4 border-[#00a174] pl-3 flex items-center justify-between">
                    <span>初期費用與契約術語</span>
                    <span className="text-xs text-zinc-500 font-normal font-sans">共 {filtered.fees.length} 項</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.fees.map((fee, idx) => (
                      <div
                        key={idx}
                        className="border border-[#DDE3DF] bg-white p-5 flex flex-col justify-between transition-all duration-300 relative"
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
                          <button
                            type="button"
                            onClick={() => setSelectedFee(fee)}
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

              {/* CARD SECTOR: SPECIAL TERMS */}
              {!isSearchActive && filtered.terms.length > 0 && (
                <section className="space-y-4 pt-4">
                  <h3 className="text-lg font-bold border-l-4 border-[#00a174] pl-3 flex items-center justify-between">
                    <span>房屋與設備術語</span>
                    <span className="text-xs text-zinc-500 font-normal font-sans">共 {filtered.terms.length} 項</span>
                  </h3>
                  <div className="space-y-4">
                    {filtered.terms.map((term, idx) => (
                      <SpecialTermCard
                        key={idx}
                        term={term}
                        onAskAI={() => {
                          handleTabChange("chat");
                          handleSendMessage(undefined, `想深入了解關於「${term.name}」的內容與實務細節`);
                        }}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* CARD SECTOR: PROCESS STEPS */}
              <RentProcessSection isSearchActive={isSearchActive} showProcessSection={showProcessSection} showSop={showSop} showDocuments={showDocuments} setDocumentsExpanded={setDocumentsExpanded} isDocumentSearchResult={isDocumentSearchResult} isDocumentsOpen={isDocumentsOpen} searchQuery={searchQuery} showRoutes={showRoutes} filtered={filtered} showReminders={showReminders} VisaDocumentMatrix={VisaDocumentMatrix} />

              {/* CARD SECTOR: Q&A */}
              {!isSearchActive && filtered.qa.length > 0 && (
                <section className="space-y-4 pt-4">
                  <h3 className="text-lg font-bold border-l-4 border-[#00a174] pl-3 flex items-center justify-between">
                    <span>常見租屋問題 Q&A</span>
                    <span className="text-xs text-zinc-500 font-normal font-sans">共 {filtered.qa.length} 問</span>
                  </h3>
                  <div className="space-y-4">
                    {filtered.qa.map((qa, idx) => <QACard key={qa.id} question={qa.question} summary={qa.summary} answer={qa.answer} number={idx + 1} />)}
                  </div>
                </section>
              )}
            </motion.div>
  );
}
