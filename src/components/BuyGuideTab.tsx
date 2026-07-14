import { motion } from "motion/react";
import { Search, MapPin, ArrowRight, Bot, Smile, FileText, X, Building, Landmark, Percent, Map } from "lucide-react";
import {
  buyHouseCashSteps, buyHouseLoanSteps, signingDocuments, taiwaneseBanks,
  japaneseBanks, minpakuRules, ryokanRules, BuyHouseTermItem, BuyHouseQAItem
} from "../data/buyHouseData";
import { renderFormattedText } from "../lib/format";

interface BuyGuideTabProps {
  buyCategory: string;
  setBuyCategory: (c: any) => void;
  buySearchQuery: string;
  setBuySearchQuery: (q: string) => void;
  buyFiltered: { drawing: BuyHouseTermItem[]; fee: BuyHouseTermItem[]; qa: BuyHouseQAItem[] };
  selectedFlowType: "cash" | "loan";
  setSelectedFlowType: (t: "cash" | "loan") => void;
  setSelectedFee: (fee: any) => void;
  handleTabChange: (tab: any) => void;
}

export function BuyGuideTab(props: BuyGuideTabProps) {
  const { buyCategory, setBuyCategory, buySearchQuery, setBuySearchQuery, buyFiltered, selectedFlowType, setSelectedFlowType, setSelectedFee, handleTabChange } = props;

  return (
            <motion.div
              key="buyHouse"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-8"
              id="pane-buy-house"
            >
              {/* Preface Section */}
              <div className="border border-[#1A2A22] bg-white p-6 md:p-8 relative" id="buy-house-preface">
                {/* Traditional Japanese Ribbon Flag decoration */}
                <div className="absolute top-0 right-8 bg-[#0F8F6D] text-white px-3 py-1 text-xs select-none uppercase tracking-widest font-sans">
                  置產 ❀
                </div>
                <h3 className="text-xl font-bold border-b border-[#1A2A22] pb-3 mb-4 flex items-center gap-2">
                  <span>日本買房置產</span>
                  <span className="text-[#0F8F6D] text-sm font-normal">By Linus</span>
                </h3>
                <p className="text-zinc-800 leading-relaxed text-justify first-letter:text-2xl first-letter:font-bold first-letter:text-[#0F8F6D] first-letter:mr-1">
                  近年來隨著日本經濟回溫與日圓匯率相對低點，許多華人朋友除了在日租屋，也開始規劃「買房自住」或「置產投資民宿與出租套房」。在日本買房雖然不限國籍與簽證，但其產權登記事項、銀行貸款條件、以及東京都各區對民泊民宿（Airbnb）的嚴格規範，實務上細節繁瑣，稍有不慎就會踩到高利息或無法營業的法規地雷。
                </p>
                <p className="text-zinc-800 leading-relaxed text-justify mt-4">
                  為了協助您精準掌握日本房市脈絡，我特別整理了這份包含「圖紙/規費術語」、「現金與貸款買房完整步驟」、「2026最新台系與日系銀行放款標準」，以及「東京都 23 區最詳盡的民泊民宿新法與旅館業法要求」。歡迎直接查閱或透過 AI 問答隨時向我諮詢！❀
                </p>

                {/* Visual Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-dashed border-zinc-300 font-sans">
                  <div className="bg-[#F5F8F6] p-4 border border-zinc-200">
                    <h4 className="font-bold text-[#0F8F6D] flex items-center gap-2 text-sm">
                      <Bot className="w-4 h-4" />
                      <span>需要為您評估買房方案或試算嗎？</span>
                    </h4>
                    <p className="text-xs text-zinc-600 mt-1">
                      本系統已將完整買房大補帖與 2026 各家銀行放款、民泊新法規則整合至 AI 找房顧問，支援直接提問。
                    </p>
                    <button 
                      onClick={() => handleTabChange("chat")}
                      className="mt-3 text-xs font-bold text-[#1A2A22] hover:text-[#0F8F6D] flex items-center gap-1 cursor-pointer"
                    >
                      <span>開始 AI 買房諮詢</span> <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="bg-[#F5F8F6] p-4 border border-zinc-200">
                    <h4 className="font-bold text-[#0F8F6D] flex items-center gap-2 text-sm">
                      <Smile className="w-4 h-4" />
                      <span>需要直接進行日本物件配對？</span>
                    </h4>
                    <p className="text-xs text-zinc-600 mt-1">
                      直接聯絡 Linus，我們將為您在尋找在網上公開或未公開的獨家優質房源。
                    </p>
                    <button 
                      onClick={() => handleTabChange("contact")}
                      className="mt-3 text-xs font-bold text-[#1A2A22] hover:text-[#0F8F6D] flex items-center gap-1 cursor-pointer"
                    >
                      <span>取得 Linus 聯繫管道</span> <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid Control & Search Block */}
              <div className="border border-[#1A2A22] bg-white p-4 flex flex-col md:flex-row gap-4 justify-between items-center" id="buy-filter-bar">
                {/* Horizontal Category selectors */}
                <div className="flex flex-wrap gap-2 w-full md:w-auto font-sans">
                  {[
                    { id: "all", label: "全部內容" },
                    { id: "terms", label: "圖紙/規費名詞" },
                    { id: "steps", label: "買房流程與文件" },
                    { id: "loans", label: "在日貸款條件" },
                    { id: "minpaku", label: "民宿與旅館法規" },
                    { id: "qa", label: "買房問答集" }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setBuyCategory(cat.id as any)}
                      className={`px-3 py-1.5 text-xs font-medium cursor-pointer border transition-colors ${
                        buyCategory === cat.id 
                          ? "bg-[#1A2A22] text-white border-[#1A2A22]" 
                          : "bg-white text-zinc-700 border-zinc-300 hover:border-[#1A2A22]"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Filter Search Field */}
                {(buyCategory === "all" || buyCategory === "terms" || buyCategory === "qa") && (
                  <div className="relative w-full md:w-72 font-sans">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="搜尋買房指南 (如：表面利回り)..."
                      value={buySearchQuery}
                      onChange={(e) => setBuySearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-1.5 text-sm bg-white border border-[#1A2A22] focus:outline-none focus:ring-1 focus:ring-[#0F8F6D]"
                    />
                    {buySearchQuery && (
                      <button 
                        onClick={() => setBuySearchQuery("")}
                        className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* SECTION: TERMS */}
              {(buyCategory === "all" || buyCategory === "terms") && (
                <div className="space-y-8">
                  {/* Drawing terms */}
                  {buyFiltered.drawing.length > 0 && (
                    <section className="space-y-4">
                      <h3 className="text-lg font-bold border-l-4 border-[#0F8F6D] pl-3 flex items-center justify-between">
                        <span>【買賣圖紙專有名詞】</span>
                        <span className="text-xs text-zinc-500 font-normal font-sans">共 {buyFiltered.drawing.length} 項</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {buyFiltered.drawing.map((term, idx) => (
                          <div 
                            key={idx} 
                            className="border border-[#1A2A22] bg-white p-5 flex flex-col justify-between hover:shadow-[4px_4px_0px_0px_rgba(26, 42, 34,1)] transition-all cursor-pointer relative"
                            onClick={() => setSelectedFee(term)}
                          >
                            <div>
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <h4 className="font-bold text-sm md:text-base text-[#1A2A22]">{term.name}</h4>
                                {term.jpName && (
                                  <span className="text-[10px] md:text-xs bg-[#F5F8F6] px-1.5 py-0.5 border border-zinc-200 text-zinc-600 font-sans font-medium">{term.jpName}</span>
                                )}
                              </div>
                              <p className="text-xs md:text-sm text-zinc-700 leading-relaxed line-clamp-3">
                                {term.description}
                              </p>
                            </div>
                            <div className="mt-4 flex items-center justify-between text-[10px] text-zinc-400 font-sans border-t border-zinc-100 pt-2">
                              <span>圖紙專有名詞</span>
                              <span className="text-zinc-600 flex items-center gap-0.5 hover:text-[#0F8F6D]">點擊深入 ➔</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Fee terms */}
                  {buyFiltered.fee.length > 0 && (
                    <section className="space-y-4">
                      <h3 className="text-lg font-bold border-l-4 border-[#0F8F6D] pl-3 flex items-center justify-between">
                        <span>【買賣交易與規費名詞】</span>
                        <span className="text-xs text-zinc-500 font-normal font-sans">共 {buyFiltered.fee.length} 項</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {buyFiltered.fee.map((term, idx) => (
                          <div 
                            key={idx} 
                            className="border border-[#1A2A22] bg-white p-5 flex flex-col justify-between hover:shadow-[4px_4px_0px_0px_rgba(26, 42, 34,1)] transition-all cursor-pointer relative"
                            onClick={() => setSelectedFee(term)}
                          >
                            <div>
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <h4 className="font-bold text-sm md:text-base text-[#1A2A22]">{term.name}</h4>
                                {term.jpName && (
                                  <span className="text-[10px] md:text-xs bg-[#F5F8F6] px-1.5 py-0.5 border border-zinc-200 text-zinc-600 font-sans font-medium">{term.jpName}</span>
                                )}
                              </div>
                              <p className="text-xs md:text-sm text-zinc-700 leading-relaxed line-clamp-3">
                                {term.description}
                              </p>
                            </div>
                            <div className="mt-4 flex items-center justify-between text-[10px] text-zinc-400 font-sans border-t border-zinc-100 pt-2">
                              <span>規費與交易術語</span>
                              <span className="text-zinc-600 flex items-center gap-0.5 hover:text-[#0F8F6D]">點擊深入 ➔</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              )}

              {/* SECTION: STEPS & FLOWS */}
              {(buyCategory === "all" || buyCategory === "steps") && (
                <div className="space-y-8">
                  <section className="border border-[#1A2A22] bg-white p-6 md:p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#1A2A22] pb-4 mb-6 gap-4">
                      <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-[#0F8F6D]" />
                          <span>日本買房交易完整流程</span>
                        </h3>
                        <p className="text-xs text-zinc-500 font-sans mt-0.5">
                          在日本購置房地產，依照付款方式不同，交易與審查步驟大相徑庭
                        </p>
                      </div>
                      
                      {/* Flow Type Switcher */}
                      <div className="flex border border-[#1A2A22] font-sans text-xs">
                        <button
                          onClick={() => setSelectedFlowType("cash")}
                          className={`px-4 py-2 font-bold cursor-pointer transition-colors ${
                            selectedFlowType === "cash" 
                              ? "bg-[#1A2A22] text-white" 
                              : "bg-white text-zinc-700 hover:bg-[#F5F8F6]"
                          }`}
                        >
                          現金全款交易流程
                        </button>
                        <button
                          onClick={() => setSelectedFlowType("loan")}
                          className={`px-4 py-2 font-bold cursor-pointer transition-colors ${
                            selectedFlowType === "loan" 
                              ? "bg-[#1A2A22] text-white" 
                              : "bg-white text-zinc-700 hover:bg-[#F5F8F6]"
                          }`}
                        >
                          銀行貸款交易流程
                        </button>
                      </div>
                    </div>

                    {/* Render Stepper */}
                    <div className="space-y-6">
                      {selectedFlowType === "cash" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                          {buyHouseCashSteps.map((step, sIdx) => (
                            <div key={sIdx} className="border border-zinc-200 bg-[#F5F8F6] p-5 relative hover:border-[#1A2A22] transition-colors">
                              <span className="absolute top-4 right-4 text-3xl font-bold text-[#0F8F6D]/15 select-none font-sans">
                                {step.step}
                              </span>
                              <h4 className="font-bold text-sm md:text-base text-[#1A2A22] mb-2 flex items-center gap-1.5 font-serif">
                                <span className="text-[#0F8F6D] font-sans font-bold">{step.step}</span>
                                <span>{step.title}</span>
                              </h4>
                              <p className="text-xs md:text-sm text-zinc-600 leading-relaxed text-justify font-sans">
                                {step.description}
                              </p>
                              {step.warning && (
                                <p className="mt-2 text-[11px] text-[#0F8F6D] bg-red-50 p-2 border-l-2 border-[#0F8F6D] leading-normal font-sans">
                                  {step.warning}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {buyHouseLoanSteps.map((step, sIdx) => (
                              <div key={sIdx} className="border border-zinc-200 bg-[#F5F8F6] p-5 relative hover:border-[#1A2A22] transition-colors">
                                <span className="absolute top-4 right-4 text-3xl font-bold text-[#0F8F6D]/15 select-none font-sans">
                                  {step.step}
                                </span>
                                <h4 className="font-bold text-sm md:text-base text-[#1A2A22] mb-2 flex items-center gap-1.5 font-serif">
                                  <span className="text-[#0F8F6D] font-sans font-bold">{step.step}</span>
                                  <span>{step.title}</span>
                                </h4>
                                <p className="text-xs md:text-sm text-zinc-600 leading-relaxed text-justify font-sans">
                                  {step.description}
                                </p>
                                {step.points && step.points.map((pt, pIdx) => (
                                  <p key={pIdx} className="mt-1.5 text-xs text-zinc-500 font-sans flex items-start gap-1">
                                    <span className="text-[#0F8F6D] font-bold">•</span>
                                    <span>{pt}</span>
                                  </p>
                                ))}
                                {step.warning && (
                                  <p className="mt-2 text-[11px] text-[#0F8F6D] bg-red-50 p-2 border-l-2 border-[#0F8F6D] leading-normal font-sans">
                                    {step.warning}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Signing documents requirements */}
                  <section className="border border-[#1A2A22] bg-white p-6 md:p-8">
                    <h3 className="text-lg font-bold border-b border-[#1A2A22] pb-3 mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#0F8F6D]" />
                      <span>{signingDocuments.title}</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-sans">
                      <div className="bg-[#F5F8F6] p-5 border border-zinc-200">
                        <h4 className="font-bold text-sm text-[#0F8F6D] border-b border-zinc-300 pb-2 mb-3 flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-[#0F8F6D]"></span>
                          <span>{signingDocuments.residenceGroup.title}</span>
                        </h4>
                        <ul className="space-y-2 text-xs text-zinc-700">
                          {signingDocuments.residenceGroup.items.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 leading-relaxed">
                              <span className="text-[#0F8F6D] font-bold">✓</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-[#F5F8F6] p-5 border border-zinc-200">
                        <h4 className="font-bold text-sm text-[#1A2A22] border-b border-zinc-300 pb-2 mb-3 flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-[#1A2A22]"></span>
                          <span>{signingDocuments.nonResidenceGroup.title}</span>
                        </h4>
                        <ul className="space-y-2 text-xs text-zinc-700">
                          {signingDocuments.nonResidenceGroup.items.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 leading-relaxed">
                              <span className="text-[#0F8F6D] font-bold">✓</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {/* SECTION: LOAN COMPARISON */}
              {(buyCategory === "all" || buyCategory === "loans") && (
                <div className="space-y-8">
                  <section className="border border-[#1A2A22] bg-white p-6 md:p-8 space-y-6">
                    <div>
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <Landmark className="w-5 h-5 text-[#0F8F6D]" />
                        <span>2026 最新在日台系銀行放款條件比較（非日本居民專用）</span>
                      </h3>
                      <p className="text-xs text-zinc-500 font-sans mt-1">
                        如果您不持有日本長期居留簽證（例如居住在台灣的投資買方），則需要透過以下 5 家台系銀行進行購屋貸款申請：
                      </p>
                    </div>

                    <div className="space-y-6">
                      {taiwaneseBanks.map((bank, bIdx) => (
                        <div key={bIdx} className="border border-[#1A2A22] bg-white hover:shadow-[4px_4px_0px_0px_rgba(26, 42, 34,1)] transition-all overflow-hidden">
                          {/* Card Header */}
                          <div className="bg-[#1A2A22] text-[#F5F8F6] px-4 py-3 flex justify-between items-center flex-wrap gap-2">
                            <h4 className="font-bold text-sm md:text-base font-serif">{bank.name}</h4>
                            <span className="text-[10px] bg-[#0F8F6D] text-white px-2 py-0.5 uppercase tracking-wide font-sans">
                              利率約 {bank.interestRate}
                            </span>
                          </div>
                          
                          {/* Card Body */}
                          <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 font-sans text-xs text-zinc-700">
                            <div className="space-y-3">
                              <p><strong>◉ 申貸資格對象：</strong> {bank.object}</p>
                              <p><strong>◉ 年齡限制條件：</strong> {bank.ageLimit}</p>
                              <p><strong>◉ 財力收入與淨資產門檻：</strong> <span className="text-[#0F8F6D] font-semibold">{bank.incomeAsset}</span></p>
                              <p><strong>◉ 對保與開戶要求：</strong> {bank.signingReq}</p>
                              <p><strong>◉ 償還與租金專戶：</strong> {bank.rentAccount}</p>
                              <p><strong>◉ 抵押物件與屋齡要求：</strong> {bank.propertyReq}</p>
                            </div>
                            <div className="space-y-3">
                              <p><strong>◉ 承作範圍限制：</strong> {bank.areaLimit}</p>
                              <p><strong>◉ 起貸金額與最高成數：</strong> {bank.amountLimit}</p>
                              <p><strong>◉ 最長貸款期限：</strong> {bank.termLimit}</p>
                              <p><strong>◉ 清償還款方式：</strong> {bank.repayment}</p>
                              <p><strong>◉ 提前還款違約手續費：</strong> {bank.prepayFee}</p>
                            </div>
                          </div>

                          {/* Bank Pro/Con Notes */}
                          <div className="bg-[#F5F8F6] p-4 border-t border-zinc-200 font-sans text-xs space-y-1.5">
                            <span className="font-bold text-[#0F8F6D] block">★ Linus 實務分析與點評：</span>
                            {bank.others.map((other, oIdx) => (
                              <div key={oIdx} className="flex items-start gap-1.5 text-zinc-600 leading-relaxed text-justify">
                                <span className="text-[#0F8F6D] font-bold">•</span>
                                <span>{other}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Japanese Banks */}
                  <section className="border border-[#1A2A22] bg-white p-6 md:p-8 space-y-6">
                    <div>
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <Percent className="w-5 h-5 text-[#0F8F6D]" />
                        <span>2026 最新日系銀行放款條件比較（非永住長期工作簽證者）</span>
                      </h3>
                      <p className="text-xs text-zinc-500 font-sans mt-1">
                        如果您持有日本長期工作簽證（如技術人文知識國際業務、高度人才），在日本有穩定正社員工作與繳稅紀錄：
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
                      {japaneseBanks.map((bank, idx) => (
                        <div key={idx} className="border border-zinc-200 bg-[#F5F8F6] p-5 flex flex-col justify-between hover:border-[#1A2A22] transition-colors">
                          <div className="space-y-4">
                            <div className="border-b border-zinc-300 pb-2">
                              <h4 className="font-bold text-sm text-[#0F8F6D] leading-normal">{bank.name}</h4>
                              <div className="text-lg font-extrabold text-[#1A2A22] mt-1">{bank.rate}</div>
                            </div>
                            
                            <div className="space-y-2 text-xs text-zinc-600">
                              <p><strong>在留簽證：</strong>{bank.visaReq}</p>
                              <p><strong>工作年資：</strong>{bank.workYears}</p>
                              <p><strong>年收入門檻：</strong>{bank.incomeReq}</p>
                              <p><strong>放貸成數：</strong>{bank.downPayment}</p>
                              <p><strong>放貸額度：</strong>{bank.amountLimit}</p>
                              <p><strong>年齡限制：</strong>{bank.ageLimit}</p>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-dashed border-zinc-300 text-[11px] text-zinc-500 leading-relaxed text-justify">
                            {bank.note}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {/* SECTION: MINPAKU & RYOKAN */}
              {(buyCategory === "all" || buyCategory === "minpaku") && (
                <div className="space-y-8">
                  {/* Minpaku District Table */}
                  <section className="border border-[#1A2A22] bg-white p-6 md:p-8 space-y-6">
                    <div>
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <Map className="w-5 h-5 text-[#0F8F6D]" />
                        <span>2026 最新東京都 23 區民泊新法營運規範一覽（非旅館業法經營）</span>
                      </h3>
                      <p className="text-xs text-zinc-500 font-sans mt-1">
                        在日本經營 Airbnb/民宿，主要依照《住宅宿泊事業法（民泊新法）》。日本中央法規限制一年最多只能營業 180 天。然而，東京都各特別區為了維護居住安寧與治安，紛紛設立了極為嚴厲的「區條例（上乗せ条例）」，實質上讓某些區域的平日完全禁業：
                      </p>
                    </div>

                    <div className="overflow-x-auto border border-zinc-300 font-sans">
                      <table className="w-full text-xs text-left text-zinc-700 border-collapse">
                        <thead className="bg-[#1A2A22] text-[#F5F8F6] uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="py-3 px-4 border-r border-zinc-700">行政區</th>
                            <th className="py-3 px-4 border-r border-zinc-700">實質限制營業天數 / 年</th>
                            <th className="py-3 px-4 border-r border-zinc-700">區域條例禁令（營業時間規範）</th>
                            <th className="py-3 px-4 border-r border-zinc-700">受限制區域</th>
                            <th className="py-3 px-4">業主不在型管理要求</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                          {minpakuRules.map((item, idx) => (
                            <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                              <td className="py-3 px-4 font-bold text-zinc-900 border-r border-zinc-200 bg-[#F5F8F6]">{item.district}</td>
                              <td className="py-3 px-4 font-semibold text-[#0F8F6D] border-r border-zinc-200">{item.daysLimit}</td>
                              <td className="py-3 px-4 border-r border-zinc-200 leading-relaxed text-justify">{item.rules}</td>
                              <td className="py-3 px-4 border-r border-zinc-200 text-zinc-600">{item.areaLimit}</td>
                              <td className="py-3 px-4 text-zinc-500 leading-normal">{item.managerReq}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-red-50 p-4 border-l-4 border-[#0F8F6D] text-xs text-[#0F8F6D] leading-relaxed font-sans">
                      <strong>⚠️ Linus 關鍵買房叮嚀：</strong>
                      <br />
                      若您的目標是「100% 靠民宿投資回收成本」，千萬不要購入位於「平日禁止民泊」的住居專用區（如中央區、目黑區等只能營業104天的地區）！在買房前務必委託專業房仲為您查詢物件所屬的「土地用途地域分區（用途地域）」以避開法規雷區。
                    </div>
                  </section>

                  {/* Ryokan requirements */}
                  <section className="border border-[#1A2A22] bg-white p-6 md:p-8 space-y-6">
                    <div className="border-b border-zinc-200 pb-3">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <Building className="w-5 h-5 text-[#0F8F6D]" />
                        <span>{ryokanRules.title}</span>
                      </h3>
                      <p className="text-xs text-zinc-500 font-sans mt-1">
                        如果您希望「全年 365 天不受天數限制」合法經營民宿，則必須向保健所申請難度極高的「簡易宿所（或旅館業營業許可）」：
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 font-sans">
                      {/* Left side Steps */}
                      <div className="md:col-span-7 space-y-4">
                        <span className="font-bold text-sm text-[#1A2A22] block">◎ 旅館業許可申請 5 個核心階段：</span>
                        <div className="space-y-3 text-xs">
                          {ryokanRules.steps.map((step, sIdx) => (
                            <div key={sIdx} className="bg-[#F5F8F6] p-3 border border-zinc-200 flex gap-3">
                              <span className="font-bold text-[#0F8F6D] shrink-0 text-sm font-sans">0{sIdx+1}</span>
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
                              <span className="text-[#0F8F6D] font-bold">✓</span>
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
                  </section>
                </div>
              )}

              {/* SECTION: QA */}
              {(buyCategory === "all" || buyCategory === "qa") && (
                <section className="space-y-4 pt-4">
                  <h3 className="text-lg font-bold border-l-4 border-[#0F8F6D] pl-3 flex items-center justify-between">
                    <span>【常見日本買房與投資問題 Q&A 集錦】</span>
                    <span className="text-xs text-zinc-500 font-normal font-sans">共 {buyFiltered.qa.length} 問</span>
                  </h3>
                  
                  {buyFiltered.qa.length === 0 ? (
                    <div className="border border-dashed border-zinc-300 bg-white py-12 text-center text-zinc-500 text-xs font-sans">
                      找不到符合「{buySearchQuery}」的 Q&A 內容。請更換關鍵字重新搜尋。
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {buyFiltered.qa.map((qa, idx) => (
                        <div key={idx} className="border border-[#1A2A22] bg-white p-6">
                          <div className="flex items-start gap-3 mb-3">
                            <span className="bg-[#0F8F6D] text-white font-sans text-xs font-bold w-5 h-5 flex items-center justify-center shrink-0">Q</span>
                            <h4 className="text-sm md:text-base font-bold text-[#1A2A22] font-serif">
                              {qa.question}
                            </h4>
                          </div>
                          <div className="flex items-start gap-3 pl-8">
                            <span className="bg-zinc-800 text-white font-sans text-xs font-bold w-5 h-5 flex items-center justify-center shrink-0">A</span>
                            <div className="text-xs md:text-sm text-zinc-700 leading-relaxed text-justify whitespace-pre-line font-sans">{renderFormattedText(qa.answer)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </motion.div>
  );
}
