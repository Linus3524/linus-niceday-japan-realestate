import { motion } from "motion/react";
import { Search, Calculator, ArrowRight, Sparkles, FileText, X, HelpCircle } from "lucide-react";
import { InitialFeeItem, SpecialTermItem, ProcessStep, QAItem } from "../data/rentGuideData";
import { renderFormattedText } from "../lib/format";

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
              <div className="border border-[#1A2A22] bg-white p-6 md:p-8 relative" id="cards-preface">
                {/* Traditional Japanese Ribbon Flag decoration */}
                <div className="absolute top-0 right-8 bg-[#0F8F6D] text-white px-3 py-1 text-xs select-none uppercase tracking-widest font-sans">
                  前言 ❀
                </div>
                <h3 className="text-xl font-bold border-b border-[#1A2A22] pb-3 mb-4 flex items-center gap-2">
                  <span>致所有來日本打拼的人</span>
                  <span className="text-[#0F8F6D] text-sm font-normal">By Linus</span>
                </h3>
                <p className="text-zinc-800 leading-relaxed text-justify first-letter:text-2xl first-letter:font-bold first-letter:text-[#0F8F6D] first-letter:mr-1">
                  大家好，我是 Linus，目前在日本東京從事不動產仲介工作。隨著疫情結束，加上日圓匯率的優勢，越來越多台灣與華人朋友選擇來到日本留學、打工度假或就職。為了協助大家在初來乍到之際，能用最短時間掌握日本租房市場的特殊潛規則與避開昂貴收費的陷阱，我精心整理了這份「日本租房買賣知識大補帖」。
                </p>
                <p className="text-zinc-800 leading-relaxed text-justify mt-4">
                  日本的租房制度有許多與台灣非常不同的一次性費用（如禮金、保證會社費用、換鑰匙費等），稍有不慎可能在初期就要支付大筆冤枉錢。希望本站的分類卡片、即時算命預算計算機與 AI 智能諮詢能幫到您。祝您在日本的生活一切順利，順利成家！❀
                </p>
                
                {/* Visual Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-dashed border-zinc-300 font-sans">
                  <div className="bg-[#F5F8F6] p-4 border border-zinc-200">
                    <h4 className="font-bold text-[#0F8F6D] flex items-center gap-2 text-sm">
                      <Calculator className="w-4 h-4" />
                      <span>需要估算理想房租預算嗎？</span>
                    </h4>
                    <p className="text-xs text-zinc-600 mt-1">
                      根據東京 23 區實務數據，自動套用免治馬桶、步行時間、屋齡等增減價公式。
                    </p>
                    <button 
                      onClick={() => handleTabChange("calculator")}
                      className="mt-3 text-xs font-bold text-[#1A2A22] hover:text-[#0F8F6D] flex items-center gap-1 cursor-pointer"
                    >
                      <span>前往預算計算機</span> <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="bg-[#F5F8F6] p-4 border border-zinc-200">
                    <h4 className="font-bold text-[#0F8F6D] flex items-center gap-2 text-sm">
                      <Sparkles className="w-4 h-4" />
                      <span>有特定的疑難雜症想直接問 AI 嗎？</span>
                    </h4>
                    <p className="text-xs text-zinc-600 mt-1">
                      本系統已將完整大補帖融入 AI 智能助手，支援多輪對話，能快速精準解答。
                    </p>
                    <button 
                      onClick={() => handleTabChange("chat")}
                      className="mt-3 text-xs font-bold text-[#1A2A22] hover:text-[#0F8F6D] flex items-center gap-1 cursor-pointer"
                    >
                      <span>開始 AI 智能對話</span> <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid Control & Search Block */}
              <div className="border border-[#1A2A22] bg-white p-4 flex flex-col md:flex-row gap-4 justify-between items-center" id="kb-filter-bar">
                {/* Horizontal Category selectors */}
                <div className="flex flex-wrap gap-2 w-full md:w-auto font-sans">
                  {[
                    { id: "all", label: "全部內容" },
                    { id: "initial", label: "初期費用名詞" },
                    { id: "terms", label: "其他專有名詞" },
                    { id: "steps", label: "房屋申請步驟" },
                    { id: "qa", label: "常見問答集" }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setKbCategory(cat.id as any)}
                      className={`px-3 py-1.5 text-xs font-medium cursor-pointer border transition-colors ${
                        kbCategory === cat.id 
                          ? "bg-[#1A2A22] text-white border-[#1A2A22]" 
                          : "bg-white text-zinc-700 border-zinc-300 hover:border-[#1A2A22]"
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
                    className="w-full pl-9 pr-4 py-1.5 text-sm bg-white border border-[#1A2A22] focus:outline-none focus:ring-1 focus:ring-[#0F8F6D]"
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
                    <p className="text-sm text-zinc-500 font-sans">請嘗試換一個詞，或者直接點擊右側 AI 智能解答諮詢 Linus！</p>
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
                    <span>【初期費用名詞介紹】</span>
                    <span className="text-xs text-zinc-500 font-normal font-sans">共 {filtered.fees.length} 項</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.fees.map((fee, idx) => (
                      <div 
                        key={idx} 
                        className="border border-[#1A2A22] bg-white p-5 flex flex-col justify-between hover:shadow-[4px_4px_0px_0px_rgba(26, 42, 34,1)] transition-all cursor-pointer relative"
                        onClick={() => setSelectedFee(fee)}
                      >
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <h4 className="font-bold text-base text-[#1A2A22]">{fee.name}</h4>
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
                          <span>租屋核心術語</span>
                          <span className="text-zinc-600 flex items-center gap-0.5 hover:text-[#0F8F6D]">點擊深入 ➔</span>
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
                    <span>【其他重要專有名詞與房屋資訊】</span>
                    <span className="text-xs text-zinc-500 font-normal font-sans">共 {filtered.terms.length} 項</span>
                  </h3>
                  <div className="space-y-4">
                    {filtered.terms.map((term, idx) => (
                      <div key={idx} className="border border-[#1A2A22] bg-white p-6">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-base font-bold text-[#0F8F6D] flex items-center gap-2">
                            <span>{term.name}</span>
                            {term.jpName && (
                              <span className="text-xs bg-zinc-100 text-zinc-600 px-1.5 py-0.5 font-normal font-sans">{term.jpName}</span>
                            )}
                          </h4>
                          <span className="text-xs text-zinc-400 font-sans">專有名詞</span>
                        </div>
                        <div className="text-sm text-zinc-700 leading-relaxed mb-4">{renderFormattedText(term.description)}</div>
                        
                        {term.details && term.details.length > 0 && (
                          <div className="bg-[#F5F8F6] p-4 border border-zinc-200 space-y-2.5">
                            {term.details.map((detail, dIdx) => (
                              <div key={dIdx} className="text-xs text-zinc-800 leading-relaxed flex items-start gap-2 font-sans">
                                <span className="text-[#0F8F6D] font-bold shrink-0">✦</span>
                                <span className="text-justify">{detail}</span>
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
                    <span>【日本租屋正式申請與引渡流程 SOP】</span>
                  </h3>
                  
                  {/* General / Overseas SOP highlight banner */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-xs">
                    <div className="bg-white p-5 border border-[#1A2A22] relative">
                      <div className="absolute top-0 right-0 bg-[#1A2A22] text-white px-2 py-0.5 font-bold">海外審查</div>
                      <h4 className="font-bold text-sm text-[#0F8F6D] mb-2 flex items-center gap-1.5">
                        <span>✈ 飛日前提前申請流程</span>
                      </h4>
                      <p className="text-zinc-600 leading-relaxed text-justify mb-3">
                        適合已取得《在留資格認定證明書》(COE) 或打工度假貼紙，人尚未入境日本的人。能省去入境後的租房等待期，好處是落地即入住！
                      </p>
                      <div className="bg-[#F5F8F6] p-4 border border-zinc-200">
                        <span className="font-bold text-[#1A2A22] block border-b border-zinc-300 pb-1.5 mb-2.5 font-sans">📋 海外審查 SOP 完整步驟：</span>
                        <div className="space-y-2 text-xs text-zinc-700 font-sans leading-relaxed">
                          {[
                            "領取在留資格認定書／打工渡假簽證貼紙",
                            "開始找房",
                            "遞交個人資料",
                            "申請房子",
                            "審查",
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

                    <div className="bg-white p-5 border border-[#1A2A22] relative">
                      <div className="absolute top-0 right-0 bg-[#0F8F6D] text-white px-2 py-0.5 font-bold">入境審查</div>
                      <h4 className="font-bold text-sm text-[#0F8F6D] mb-2 flex items-center gap-1.5">
                        <span>🇯🇵 抵達日本境內申請流程</span>
                      </h4>
                      <p className="text-zinc-600 leading-relaxed text-justify mb-3">
                        適合人已在日本，擁有登記過原臨時地址在留卡、日本電話與個人印章的人。可安排實體內見看房，能挑選的房源物件範圍是最多的。
                      </p>
                      <div className="bg-[#F5F8F6] p-4 border border-zinc-200">
                        <span className="font-bold text-[#1A2A22] block border-b border-zinc-300 pb-1.5 mb-2.5 font-sans">📋 入境審查 SOP 完整步驟：</span>
                        <div className="space-y-2 text-xs text-zinc-700 font-sans leading-relaxed">
                          {[
                            "入境領取在留卡",
                            "區役所登錄地址並申請住民票＆辦保險證",
                            "辦日本門號",
                            "開始找房",
                            "遞交個人資料",
                            "申請房子",
                            "審查",
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
                  <div className="border border-[#1A2A22] bg-[#F5F8F6] p-6 relative">
                    <h4 className="text-sm md:text-base font-bold text-[#1A2A22] border-b border-zinc-300 pb-3 mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#0F8F6D]" />
                      <span>【審查所需資料與準備文件對照】</span>
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-5 border border-zinc-300 space-y-3">
                        <h5 className="font-bold text-[#0F8F6D] text-xs uppercase tracking-wider border-b border-zinc-100 pb-1 flex items-center gap-1.5">
                          <span>✈ 海外審查需要資料</span>
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
                            <span><strong>存款餘額證明：</strong>打工度假或預算有限者，保證公司通常要求提供等值 12 至 15 個月房租的個人存款證明（台幣或日幣均可）。</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-[#0F8F6D] font-bold">•</span>
                            <span><strong>緊急聯絡人：</strong>通常需要兩位，一位為母國二親等內家長（能提供戶籍謄本佐證親屬關係較佳），另一位為日本在留者（部分保證會社要求，若無可向仲介諮詢協助）。</span>
                          </li>
                        </ul>
                      </div>

                      <div className="bg-white p-5 border border-zinc-300 space-y-3">
                        <h5 className="font-bold text-[#0F8F6D] text-xs uppercase tracking-wider border-b border-zinc-100 pb-1 flex items-center gap-1.5">
                          <span>🇯🇵 境內審查需要資料</span>
                        </h5>
                        <ul className="space-y-2 text-xs text-zinc-700 leading-normal font-sans">
                          <li className="flex items-start gap-1.5">
                            <span className="text-[#0F8F6D] font-bold">•</span>
                            <span><strong>護照影本：</strong>個人照片頁、日本入境章戳頁。</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-[#0F8F6D] font-bold">•</span>
                            <span><strong>在留卡 (正反面)：</strong>背面必須蓋有向日本區役所登錄地址的章。若剛入境可借用親友、飯店或短租地址登錄。</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-[#0F8F6D] font-bold">•</span>
                            <span><strong>日本手機門號：</strong>保證會社審查時會撥打電話照會，必須能正常通話與接聽。</span>
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
                  <div className="border border-[#1A2A22] bg-white p-6 relative">
                    <div className="absolute top-0 right-6 bg-[#0F8F6D] text-white px-2.5 py-0.5 text-xs tracking-widest font-sans font-medium uppercase">
                      9個核心步驟
                    </div>
                    <h4 className="text-base font-bold text-[#1A2A22] border-b border-zinc-200 pb-3 mb-6">
                      日本房屋審查、付款與交屋步驟分解：
                    </h4>
                    
                    <div className="relative border-l-2 border-[#1A2A22] ml-3 pl-6 space-y-8 py-2">
                      {filtered.steps.map((step, idx) => (
                        <div key={idx} className="relative group">
                          {/* Circle node indicator */}
                          <div className="absolute -left-[31px] top-1.5 w-4 h-4 bg-white border-2 border-[#0F8F6D] group-hover:bg-[#0F8F6D] transition-colors" />
                          
                          <div className="flex flex-col md:flex-row justify-between items-start gap-2 mb-1.5">
                            <h5 className="font-bold text-sm text-[#0F8F6D]">{step.name}</h5>
                            <span className="text-xs bg-[#F5F8F6] border border-zinc-300 text-zinc-600 px-2 py-0.5 font-sans shrink-0">
                              時程估計: {step.duration}
                            </span>
                          </div>
                          <div className="text-xs text-zinc-700 leading-relaxed text-justify font-sans">{renderFormattedText(step.description)}</div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-[#F5F8F6] p-4 border border-zinc-200 text-xs text-zinc-600 leading-relaxed mt-6 font-sans">
                      <span className="font-bold text-[#0F8F6D]">★ Linus 實務小提醒：</span>
                      在日本不看房直接找房，建議至少在預計入住日前 1.5 個月前著手挑選；如果要安排親自到場看房，則建議在預計入居日前 1 個月內開始，因為日本房源基本上是無法付訂金保留的，一上架便會迅速成交。
                    </div>
                  </div>
                </section>
              )}

              {/* CARD SECTOR: Q&A */}
              {filtered.qa.length > 0 && (
                <section className="space-y-4 pt-4">
                  <h3 className="text-lg font-bold border-l-4 border-[#0F8F6D] pl-3 flex items-center justify-between">
                    <span>【常見租屋問題 Q&A 集錦】</span>
                    <span className="text-xs text-zinc-500 font-normal font-sans">共 {filtered.qa.length} 問</span>
                  </h3>
                  <div className="space-y-4">
                    {filtered.qa.map((qa, idx) => (
                      <div key={idx} className="border border-[#1A2A22] bg-white p-6">
                        <div className="flex items-start gap-3 mb-3">
                          <span className="bg-[#0F8F6D] text-white font-sans text-xs font-bold w-5 h-5 flex items-center justify-center shrink-0">Q</span>
                          <h4 className="text-sm md:text-base font-bold text-[#1A2A22]">
                            {qa.question}
                          </h4>
                        </div>
                        <div className="flex items-start gap-3 pl-8">
                          <div className="bg-zinc-800 text-white font-sans text-xs font-bold w-5 h-5 flex items-center justify-center shrink-0">A</div>
                          <div className="text-xs md:text-sm text-zinc-700 leading-relaxed text-justify whitespace-pre-line font-sans">{renderFormattedText(qa.answer)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </motion.div>
  );
}
