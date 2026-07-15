import { motion } from "motion/react";
import { useState, type ReactNode } from "react";
import { Search, ArrowRight, FileText, X, HelpCircle, ChevronDown } from "lucide-react";
import { InitialFeeItem, SpecialTermItem, ProcessStep, QAItem } from "../data/rentGuideData";
import { renderFormattedText } from "../lib/format";
import { QACard } from "./QACard";
import { JapaneseRuby } from "./JapaneseRuby";

interface ScreeningDocumentProfile {
  profile: string;
  documents: string[];
  availability: "多" | "一般" | "最少" | "不一定";
}

const overseasScreeningDocuments: ScreeningDocumentProfile[] = [
  { profile: "工作簽證", documents: ["護照照片頁", "在留資格認定書（COE）", "僱傭契約書"], availability: "一般" },
  { profile: "留學簽證", documents: ["護照照片頁", "在留資格認定書（COE）", "入學通知書"], availability: "一般" },
  { profile: "打工度假簽證", documents: ["護照照片頁", "日本簽證貼紙", "銀行財力或餘額證明"], availability: "最少" }
];

const domesticScreeningDocuments: ScreeningDocumentProfile[] = [
  { profile: "尚未入職", documents: ["護照照片頁", "在留卡正反面", "僱傭契約書"], availability: "多" },
  { profile: "入職未滿三個月", documents: ["在留卡正反面", "護照照片頁", "日本保險證正反面", "已有的薪資明細", "僱傭條件通知書"], availability: "多" },
  { profile: "入職三個月以上", documents: ["在留卡正反面", "護照照片頁", "日本保險證正反面", "現有公司源泉票", "三個月薪資明細", "僱傭條件通知書"], availability: "多" },
  { profile: "轉職中", documents: ["在留卡正反面", "護照照片頁", "新公司內定通知書", "新公司僱傭條件通知書", "舊公司三個月薪資明細（視個案）"], availability: "多" },
  { profile: "留學簽證", documents: ["護照照片頁", "在留卡正反面", "學生證", "銀行財力或餘額證明"], availability: "一般" },
  { profile: "打工度假簽證", documents: ["護照照片頁", "在留卡正反面", "銀行財力或餘額證明"], availability: "最少" },
  { profile: "法人契約（社員入住）", documents: ["公司登記簿謄本", "公司決算書影本", "公司印鑑證明書", "代表者印鑑證明書", "入住者在留卡與護照", "社員證或在職證明", "公司簡介或業務資料"], availability: "不一定" }
];

const availabilityStyle = {
  "多": "bg-[#EAF3EE] text-[#0A6D52] border-[#A8D5C2]",
  "一般": "bg-[#FFF9ED] text-[#7A5A1F] border-[#DCC8A1]",
  "最少": "bg-[#FBDFD2] text-[#B13818] border-[#E94E2B]",
  "不一定": "bg-[#F2F8FA] text-[#3F626D] border-[#D6EAF0]"
};

function VisaDocumentMatrix() {
  const [screeningMode, setScreeningMode] = useState<"overseas" | "domestic">("overseas");
  const profiles = screeningMode === "overseas" ? overseasScreeningDocuments : domesticScreeningDocuments;
  return (
    <div className="space-y-5 font-sans">
      <div className="grid grid-cols-2 border border-[#1A2A22] bg-white p-1">
        <button onClick={() => setScreeningMode("overseas")} className={`min-h-12 px-4 py-3 text-sm font-bold ${screeningMode === "overseas" ? "bg-[#1A2A22] text-white" : "text-[#3F5147] hover:bg-[#F5F8F6]"}`}>✈ 海外審査</button>
        <button onClick={() => setScreeningMode("domestic")} className={`min-h-12 px-4 py-3 text-sm font-bold ${screeningMode === "domestic" ? "bg-[#0F8F6D] text-white" : "text-[#3F5147] hover:bg-[#F5F8F6]"}`}>🇯🇵 日本境內審査</button>
      </div>
      {screeningMode === "domestic" && (
        <div className="border-l-4 border-[#0F8F6D] bg-[#EAF3EE] p-4 text-sm leading-7 text-[#3F5147]">境內申請前通常還需準備：已登錄地址的在留卡、日本保險證、本人日本電話、姓名一致的印章、母國及在日緊急聯絡人資料，以及不記載個人編號的住民票。</div>
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
              {profile.documents.map(document => <li key={document} className="flex gap-3 text-sm leading-6 text-[#3F5147]"><span className="mt-0.5 font-bold text-[#0F8F6D]">✓</span><span>{document}</span></li>)}
            </ul>
          </article>
        ))}
      </div>
      <div className="border border-[#DCC8A1] bg-[#FFF9ED] p-4 text-xs leading-6 text-[#66583D] md:text-sm">以上為 Linus 的申請準備對照，不是所有物件一律要求的固定清單。管理公司、保證公司、簽證狀態與個別案件可能追加、減少或改用其他文件，送件前請以該物件最新書面要求為準。</div>
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
  hasNoResults: boolean;
  setSelectedFee: (fee: any) => void;
  handleTabChange: (tab: any) => void;
}

export function RentGuideTab(props: RentGuideTabProps) {
  const { kbCategory, setKbCategory, searchQuery, setSearchQuery, filtered, hasNoResults, setSelectedFee, handleTabChange } = props;
  const [documentsExpanded, setDocumentsExpanded] = useState(false);

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
              <div className="border border-[#DDE3DF] hover:border-[#0F8F6D] bg-white p-6 md:p-8 relative transition-all duration-300 hover:shadow-colored-soft" id="cards-preface">
                {/* Traditional Japanese Ribbon Flag decoration */}
                <div className="absolute top-0 right-8 bg-[#0F8F6D] text-white px-3 py-1 text-xs select-none uppercase tracking-widest font-sans">
                  前言 ❀
                </div>
                <h3 className="text-xl font-bold border-b border-[#DDE3DF] pb-3 mb-4 flex items-center gap-2">
                  <span className="material-symbols-rounded shrink-0 select-none text-[22px] leading-none text-[#0F8F6D]" aria-hidden="true">key</span>
                  <span>致所有來日本打拼的人</span>
                  <span className="text-[#0F8F6D] text-sm font-normal">By Linus</span>
                </h3>
                <p className="text-zinc-800 leading-relaxed text-justify first-letter:text-2xl first-letter:font-bold first-letter:text-[#0F8F6D] first-letter:mr-1">
                  大家好，我是 Linus，目前在日本東京從事不動產仲介工作。來到日本留學、打工度假或就職，找一個能安心落腳的家，往往是最先面對的大事。為了協助大家在初來乍到時，用較短時間看懂日本租屋的制度與常見費用、少走冤枉路，我整理了這份「日本租屋知識大補帖」。
                </p>
                <p className="text-zinc-800 leading-relaxed text-justify mt-4">
                  日本租屋有許多和台灣不同的一次性費用，例如禮金、保證公司費用與鑰匙更換費；契約條款也會因物件與管理公司而不同。希望這份租屋知識整理、租金預算計算機與 AI 顧問，能幫您在申請前看懂條件、做好預算。祝您在日本的生活一切順利！❀
                </p>
                
                {/* Visual Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-dashed border-zinc-300 font-sans">
                  <div className="bg-[#F5F8F6] p-4 border border-[#DDE3DF] hover:border-[#0F8F6D] transition-colors">
                    <h4 className="font-bold text-[#0F8F6D] flex items-center gap-2 text-sm">
                      <span className="material-symbols-rounded shrink-0 select-none text-[18px] leading-none" aria-hidden="true">calculate</span>
                      <span>需要估算理想房租預算嗎？</span>
                    </h4>
                    <p className="text-xs text-zinc-600 mt-1">
                      根據東京 23 區實務數據，自動套用免治馬桶、步行時間、屋齡等增減價公式。
                    </p>
                    <button 
                      onClick={() => handleTabChange("calculator")}
                      className="mt-3 text-xs font-bold text-[#0F8F6D] hover:text-[#0A6D52] flex items-center gap-1 cursor-pointer"
                    >
                      <span>前往預算計算機</span> <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="bg-[#F5F8F6] p-4 border border-[#DDE3DF] hover:border-[#0F8F6D] transition-colors">
                    <h4 className="font-bold text-[#0F8F6D] flex items-center gap-2 text-sm">
                      <span className="material-symbols-rounded shrink-0 select-none text-[18px] leading-none" aria-hidden="true">smart_toy</span>
                      <span>有特定的疑難雜症想直接問 AI 嗎？</span>
                    </h4>
                    <p className="text-xs text-zinc-600 mt-1">
                      本系統已將完整大補帖融入 AI 顧問，支援多輪對話，能快速精準解答。
                    </p>
                    <button 
                      onClick={() => handleTabChange("chat")}
                      className="mt-3 text-xs font-bold text-[#0F8F6D] hover:text-[#0A6D52] flex items-center gap-1 cursor-pointer"
                    >
                      <span>開始 AI 找房諮詢</span> <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid Control & Search Block */}
              <div className="border border-[#DDE3DF] hover:border-[#0F8F6D] bg-white p-4 flex flex-col md:flex-row gap-4 justify-between items-center transition-all duration-300 hover:shadow-colored-soft" id="kb-filter-bar">
                {/* Horizontal Category selectors */}
                <div className="flex flex-wrap gap-2 w-full md:w-auto font-sans">
                  {[
                    { id: "all", label: "全部內容" },
                    { id: "initial", label: "初期費用與契約" },
                    { id: "terms", label: "房屋與設備" },
                    { id: "steps", label: "房屋申請步驟" },
                    { id: "qa", label: "常見問答集" }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setKbCategory(cat.id as any)}
                      className={`px-3 py-1.5 text-xs font-medium cursor-pointer border transition-colors ${
                        kbCategory === cat.id 
                          ? "bg-[#0F8F6D] text-white border-[#0F8F6D]" 
                          : "bg-white text-zinc-700 border-zinc-300 hover:border-[#0F8F6D]"
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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 text-sm bg-white border border-[#DDE3DF] focus:outline-none focus:border-[#0F8F6D]"
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
              {searchQuery && (
                <div className="text-sm text-zinc-600 px-1 font-sans">
                  關鍵字「{searchQuery}」搜尋結果：
                </div>
              )}

              {/* NO RESULTS VIEW */}
              {hasNoResults && (
                <div className="border border-dashed border-zinc-300 bg-white py-12 text-center space-y-4">
                  <HelpCircle className="w-12 h-12 text-[#0F8F6D] mx-auto opacity-75" />
                  <div className="space-y-1">
                    <p className="text-base font-bold">找不到符合「{searchQuery}」的項目</p>
                    <p className="text-sm text-zinc-500 font-sans">請嘗試換一個詞，或者直接點擊 AI 顧問諮詢 Linus！</p>
                  </div>
                  <button 
                    onClick={() => {
                      setSearchQuery("");
                      handleTabChange("chat");
                    }}
                    className="px-4 py-2 bg-[#1A2A22] text-white text-xs tracking-wider uppercase font-sans font-bold hover:bg-[#0F8F6D] cursor-pointer"
                  >
                    開啟 AI 對話諮詢
                  </button>
                </div>
              )}

              {/* CARD SECTOR: INITIAL FEES */}
              {filtered.fees.length > 0 && (
                <section className="space-y-4">
                  <h3 className="text-lg font-bold border-l-4 border-[#0F8F6D] pl-3 flex items-center justify-between">
                    <span>初期費用與契約術語</span>
                    <span className="text-xs text-zinc-500 font-normal font-sans">共 {filtered.fees.length} 項</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.fees.map((fee, idx) => (
                      <div 
                        key={idx} 
                        className="border border-[#DDE3DF] hover:border-[#0F8F6D] bg-white p-5 flex flex-col justify-between hover:shadow-colored-soft hover:-translate-y-0.5 transition-all duration-300 cursor-pointer relative"
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
                          <div className="mt-3 pt-2.5 border-t border-dashed border-zinc-200 text-xs text-[#0F8F6D] line-clamp-1 font-sans">
                            {fee.warning}
                          </div>
                        )}
                        <div className="mt-4 flex items-center justify-between text-xs text-zinc-400 font-sans">
                          <span>初期費用／契約</span>
                          <span className="text-zinc-600 flex items-center gap-0.5 hover:text-[#0F8F6D]">查看說明 →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* CARD SECTOR: SPECIAL TERMS */}
              {filtered.terms.length > 0 && (
                <section className="space-y-4 pt-4">
                  <h3 className="text-lg font-bold border-l-4 border-[#0F8F6D] pl-3 flex items-center justify-between">
                    <span>房屋與設備術語</span>
                    <span className="text-xs text-zinc-500 font-normal font-sans">共 {filtered.terms.length} 項</span>
                  </h3>
                  <div className="space-y-4">
                    {filtered.terms.map((term, idx) => (
                      <div key={idx} className="border border-[#DDE3DF] hover:border-[#0F8F6D] bg-white p-6 transition-all duration-300 hover:shadow-colored-soft">
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
                                <span className="text-[#0F8F6D] font-bold shrink-0">✦</span>
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
              {filtered.steps.length > 0 && (
                <section className="space-y-4 pt-4">
                  <h3 className="text-lg font-bold border-l-4 border-[#0F8F6D] pl-3">
                    <span>日本租屋正式申請與引渡流程 SOP</span>
                  </h3>
                  
                  {/* General / Overseas SOP highlight banner */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-xs">
                    <div className="bg-white p-5 border border-[#DDE3DF] hover:border-[#0F8F6D] transition-all duration-300 hover:shadow-colored-soft relative">
                      <div className="absolute top-0 right-0 bg-[#0F8F6D] text-white px-2 py-0.5 font-bold font-jost text-[10px] tracking-wide">海外審査</div>
                      <h4 className="font-bold text-sm text-[#0F8F6D] mb-2 flex items-center gap-1.5">
                        <span>✈ 飛日前提前申請流程</span>
                      </h4>
                      <p className="text-zinc-600 leading-relaxed text-justify mb-3">
                        適合已取得《在留資格認定證明書》(COE) 或打工度假貼紙，人尚未入境日本的人。能省去入境後的租屋等待期，好處是落地即入住！
                      </p>
                      <div className="bg-[#F5F8F6] p-4 border border-zinc-200">
                        <span className="font-bold text-[#1A2A22] block border-b border-zinc-300 pb-1.5 mb-2.5 font-sans">📋 海外審査 SOP 完整步驟：</span>
                        <div className="space-y-2 text-xs text-zinc-700 font-sans leading-relaxed">
                          {[
                            "領取在留資格認定書／打工渡假簽證貼紙",
                            "開始找房",
                            "遞交個人資料",
                            "申請房子",
                            "審査",
                            "繳交初期費用",
                            "入境日本（在海關那邊領取在留卡）",
                            "簽約",
                            "等入居日簽收鑰匙",
                            "區役所登入地址",
                            "辦日本門號",
                            "申請日本郵局銀行帳戶",
                            "綁定自動扣款"
                          ].map((step, idx) => (
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

                    <div className="bg-white p-5 border border-[#DDE3DF] hover:border-[#0F8F6D] transition-all duration-300 hover:shadow-colored-soft relative">
                      <div className="absolute top-0 right-0 bg-[#0F8F6D] text-white px-2 py-0.5 font-bold font-jost text-[10px] tracking-wide">入境審査</div>
                      <h4 className="font-bold text-sm text-[#0F8F6D] mb-2 flex items-center gap-1.5">
                        <span>🇯🇵 抵達日本境內申請流程</span>
                      </h4>
                      <p className="text-zinc-600 leading-relaxed text-justify mb-3">
                        適合人已在日本，擁有登記過原臨時地址在留卡、日本電話與個人印章的人。可安排實體內見看房，能挑選的房源物件範圍是最多的。
                      </p>
                      <div className="bg-[#F5F8F6] p-4 border border-zinc-200">
                        <span className="font-bold text-[#1A2A22] block border-b border-zinc-300 pb-1.5 mb-2.5 font-sans">📋 入境審査 SOP 完整步驟：</span>
                        <div className="space-y-2 text-xs text-zinc-700 font-sans leading-relaxed">
                          {[
                            "入境領取在留卡",
                            "區役所登錄地址並申請住民票＆辦保險證",
                            "辦日本門號",
                            "開始找房",
                            "遞交個人資料",
                            "申請房子",
                            "審査",
                            "繳交初期費用",
                            "簽約",
                            "等入居日簽收鑰匙",
                            "轉出轉入新地址",
                            "申請郵局銀行帳戶",
                            "綁定自動扣款"
                          ].map((step, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className="bg-[#0F8F6D] text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold font-mono shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Required Documents Section for Overseas vs Domestic Screenings */}
                  <div className="border border-[#DDE3DF] hover:border-[#0F8F6D] bg-[#F5F8F6] p-6 relative transition-all duration-300 hover:shadow-colored-soft">
                    <button
                      type="button"
                      onClick={() => setDocumentsExpanded(current => !current)}
                      aria-expanded={documentsExpanded}
                      aria-controls="screening-document-matrix"
                      className={`flex w-full items-center justify-between gap-4 text-left ${documentsExpanded ? "border-b border-zinc-300 pb-3 mb-4" : ""}`}
                    >
                      <span className="flex min-w-0 items-start gap-3">
                        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#0F8F6D]" />
                        <span>
                          <span className="block text-sm font-bold text-[#1A2A22] md:text-base">審査所需資料與準備文件對照</span>
                          <span className="mt-1 block text-xs font-normal leading-relaxed text-[#66736C]">依海外／日本境內審査與目前身份，查看建議先準備的文件</span>
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2 text-xs font-bold text-[#0F8F6D]">
                        {documentsExpanded ? "收合" : "展開查看"}
                        <ChevronDown className={`h-4 w-4 transition-transform ${documentsExpanded ? "rotate-180" : ""}`} />
                      </span>
                    </button>

                    {documentsExpanded && (
                      <div id="screening-document-matrix">
                        <VisaDocumentMatrix />
                      </div>
                    )}
                    <div className="hidden" aria-hidden="true">
                      <div className="bg-white p-5 border border-zinc-300 space-y-3">
                        <h5 className="font-bold text-[#0F8F6D] text-xs uppercase tracking-wider border-b border-zinc-100 pb-1 flex items-center gap-1.5">
                          <span>✈ 海外審査需要資料</span>
                        </h5>
                        <ul className="space-y-2 text-xs text-zinc-700 leading-normal font-sans">
                          <li className="flex items-start gap-1.5">
                            <span className="text-[#0F8F6D] font-bold">•</span>
                            <span><strong>護照影本：</strong>個人照片頁、簽證貼紙頁（若已核發）。</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-[#0F8F6D] font-bold">•</span>
                            <span><strong>在留資格認定證明書 (COE)：</strong>或打工度假簽證證明。</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-[#0F8F6D] font-bold">•</span>
                            <span><strong>入學許可書 / 內定通知書：</strong>學生提供學校錄取書；就職者提供公司給予的內定通知/薪資證明。</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-[#0F8F6D] font-bold">•</span>
                            <span><strong>存款餘額證明：</strong>打工度假或預算有限者，保證公司通常要求提供等值 12 至 15 個月房租的個人存款證明（台幣或日幣均可）。提供海外帳戶的「網路銀行餘額截圖（含帳號）」加「存摺封面」即可，正式的銀行餘額證明也可以，不需要英文版本。</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-[#0F8F6D] font-bold">•</span>
                            <span><strong>緊急聯絡人：</strong>通常需要兩位，一位為母國二親等內家長（能提供戶籍謄本佐證親屬關係較佳），另一位為日本在留者（部分保證會社要求，若無可向仲介諮詢協助）。</span>
                          </li>
                        </ul>
                      </div>

                      <div className="bg-white p-5 border border-zinc-300 space-y-3">
                        <h5 className="font-bold text-[#0F8F6D] text-xs uppercase tracking-wider border-b border-zinc-100 pb-1 flex items-center gap-1.5">
                          <span>🇯🇵 境內審査需要資料</span>
                        </h5>
                        <ul className="space-y-2 text-xs text-zinc-700 leading-normal font-sans">
                          <li className="flex items-start gap-1.5">
                            <span className="text-[#0F8F6D] font-bold">•</span>
                            <span><strong>護照影本：</strong>個人照片頁、日本入境章戳頁。</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-[#0F8F6D] font-bold">•</span>
                            <span><strong>在留卡（正反面）：</strong>住居地欄位及申報狀態依個案確認；不得把沒有實際居住的親友、飯店或短租地址當成自己的住址申報。</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-[#0F8F6D] font-bold">•</span>
                            <span><strong>日本手機門號：</strong>保證會社審査時會撥打電話照會，必須能正常通話與接聽。</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-[#0F8F6D] font-bold">•</span>
                            <span><strong>日本銀行帳戶 & 提款卡/存摺：</strong>合約通過後綁定每個月房租自動扣款使用。</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-[#0F8F6D] font-bold">•</span>
                            <span><strong>所得證明 / 學生證：</strong>在日就職者需提供近期的源泉徵收票、課稅證明書或薪資單；學生需提供在學證明或學生證影本。</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-[#0F8F6D] font-bold">•</span>
                            <span><strong>在日緊急聯絡人：</strong>通常要求必須是居住在日本境內、且能用日文進行基本電話溝通的朋友或長輩。</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Vertical Linear Steps Timeline */}
                  <div className="border border-[#DDE3DF] bg-white p-6 relative transition-all duration-300 hover:shadow-colored-soft">
                    <div className="absolute top-0 right-6 bg-[#0F8F6D] text-white px-2.5 py-0.5 text-xs tracking-widest font-sans font-medium uppercase">
                      9個核心步驟
                    </div>
                    <h4 className="text-base font-bold text-[#1A2A22] border-b border-zinc-200 pb-3 mb-6">
                      日本房屋審査、付款與交屋步驟分解：
                    </h4>
                    
                    <div className="relative border-l border-[#DDE3DF] ml-3 pl-6 space-y-8 py-2">
                      {filtered.steps.map((step, idx) => (
                        <div key={idx} className="relative group">
                          {/* Circle node indicator */}
                          <div className="absolute -left-[33px] top-1.5 w-4 h-4 bg-white border-2 border-[#0F8F6D] group-hover:bg-[#0F8F6D] transition-colors" />
                          
                          <div className="flex flex-col md:flex-row justify-between items-start gap-2 mb-1.5">
                            <h5 className="font-bold text-sm text-[#0F8F6D]">
                              <span>{step.name.charAt(0)}</span>
                              <span className="text-[#1A2A22]">{step.name.slice(1)}</span>
                            </h5>
                            <span className="text-xs bg-[#F5F8F6] border border-zinc-300 text-zinc-600 px-2 py-0.5 font-sans shrink-0">
                              時程估計: {step.duration}
                            </span>
                          </div>
                          <div className="text-xs text-zinc-700 leading-relaxed text-justify font-sans">{renderFormattedText(step.description)}</div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-[#F5F8F6] p-4 border border-zinc-200 text-xs text-zinc-600 leading-relaxed mt-6 font-sans space-y-2">
                      <span className="font-bold text-[#0F8F6D] block">★ Linus 實務小提醒：</span>
                      <ul className="space-y-1.5">
                        <li className="flex gap-2"><span className="shrink-0 text-[#0F8F6D]">•</span><span>不內見找房建議於預計入住日前約 1.5 個月開始；若需要內見，建議確定入住日期後，於入住前 1 個月內開始找房即可。因為日本房源基本上是無法付訂金保留的，熱門物件一上架便會很快被租走。</span></li>
                        <li className="flex gap-2"><span className="shrink-0 text-[#0F8F6D]">•</span><span>若在留卡首次登錄的地址只是暫時住所，建議等入住正式租屋處並完成住址變更後，再辦理郵局或銀行帳戶，可避免後續因地址變更而需重新辦理相關手續。</span></li>
                      </ul>
                    </div>
                  </div>
                </section>
              )}

              {/* CARD SECTOR: Q&A */}
              {filtered.qa.length > 0 && (
                <section className="space-y-4 pt-4">
                  <h3 className="text-lg font-bold border-l-4 border-[#0F8F6D] pl-3 flex items-center justify-between">
                    <span>常見租屋問題 Q&A 集錦</span>
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
