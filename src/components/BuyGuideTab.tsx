import { motion } from "motion/react";
import { useState } from "react";
import { Search, MapPin, ArrowRight, Smile, FileText, X, Building, Landmark, Percent, Map, ChevronDown } from "lucide-react";
import {
  buyHouseCashSteps, buyHouseLoanSteps, signingDocuments, taiwaneseBanks,
  japaneseBanks, minpakuRules, ryokanRules, BuyHouseTermItem, BuyHouseQAItem
} from "../data/buyHouseData";
import { renderFormattedText } from "../lib/format";
import { QACard } from "./QACard";
import { JapaneseRuby } from "./JapaneseRuby";

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

const minpakuWardOrder = [
  "千代田區", "中央區", "港區", "新宿區", "文京區", "台東區", "墨田區", "江東區", "品川區", "目黑區", "大田區", "世田谷區",
  "澀谷區", "中野區", "杉並區", "豐島區", "北區", "荒川區", "板橋區", "練馬區", "足立區", "葛飾區", "江戶川區"
];

const getMinpakuLimitLabel = (daysLimit: string) => {
  if (/週末|週五正午|週六正午|104 天/.test(daysLimit)) return "週末為主";
  if (/假期|指定期間/.test(daysLimit)) return "指定期間營業";
  if (/個案確認|依.*確認|需.*確認/.test(daysLimit)) return "依區域個別確認";
  if (/限制/.test(daysLimit)) return "180 天＋區域限制";
  return "最多 180 天／年";
};

const getMinpakuAreaLabel = (areaLimit: string) => {
  if (/^全區/.test(areaLimit)) return "全區";
  if (/商業地域除外/.test(areaLimit)) return "商業區以外";
  if (/學校/.test(areaLimit) && /住居|文教/.test(areaLimit)) return "住宅區／學校周邊";
  if (/文教/.test(areaLimit) && /住居/.test(areaLimit)) return "住宅區／文教區";
  if (/住居專用/.test(areaLimit)) return "住居專用區";
  if (/文教/.test(areaLimit)) return "文教區";
  return "依物件所在地確認";
};

export function BuyGuideTab(props: BuyGuideTabProps) {
  const { buyCategory, setBuyCategory, buySearchQuery, setBuySearchQuery, buyFiltered, selectedFlowType, setSelectedFlowType, setSelectedFee, handleTabChange } = props;
  const [expandedBanks, setExpandedBanks] = useState<Set<string>>(new Set());
  const [expandedMinpakuWards, setExpandedMinpakuWards] = useState<Set<string>>(new Set());
  const [ryokanExpanded, setRyokanExpanded] = useState(false);
  const toggleBank = (key: string) => setExpandedBanks(current => {
    const next = new Set(current);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  });
  const toggleMinpakuWard = (district: string) => setExpandedMinpakuWards(current => {
    const next = new Set(current);
    if (next.has(district)) next.delete(district);
    else next.add(district);
    return next;
  });

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
              <div className="border border-[#DDE3DF] hover:border-[#0F8F6D] bg-white p-6 md:p-8 relative transition-all duration-300 hover:shadow-colored-soft" id="buy-house-preface">
                {/* Traditional Japanese Ribbon Flag decoration */}
                <div className="absolute top-0 right-8 bg-[#0F8F6D] text-white px-3 py-1 text-xs select-none uppercase tracking-widest font-sans">
                  置產 ❀
                </div>
                <h3 className="text-xl font-bold border-b border-[#DDE3DF] pb-3 mb-4 flex items-center gap-2">
                  <span className="material-symbols-rounded shrink-0 select-none text-[22px] leading-none text-[#0F8F6D]" aria-hidden="true">real_estate_agent</span>
                  <span>日本買房置產</span>
                  <span className="text-[#0F8F6D] text-sm font-normal">By Linus</span>
                </h3>
                <p className="text-zinc-800 leading-relaxed text-justify first-letter:text-2xl first-letter:font-bold first-letter:text-[#0F8F6D] first-letter:mr-1">
                  許多華人朋友在日本生活逐漸安定後，也開始規劃買房自住、長期出租，或研究住宿事業。外國人原則上可以取得日本不動產，但產權登記、匯款、融資、稅務與住宿營業各有不同程序；除了房價與表面投報率，還有不少細節需要先釐清。
                </p>
                <p className="text-zinc-800 leading-relaxed text-justify mt-4">
                  為了協助您更有方向地了解日本房市，我整理了物件資料與費用術語、現金與貸款買房流程、金融機構方案示例，以及民宿與旅館業的確認重點。無論是想自住還是置產規劃，都歡迎直接査閱或透過 AI 顧問向我諮詢！❀
                </p>
 
                {/* Visual Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-dashed border-zinc-300 font-sans">
                  <div className="bg-[#F5F8F6] p-4 border border-zinc-200">
                    <h4 className="font-bold text-[#0F8F6D] flex items-center gap-2 text-sm">
                      <span className="material-symbols-rounded shrink-0 select-none text-[18px] leading-none" aria-hidden="true">smart_toy</span>
                      <span>需要為您評估買房方案或試算嗎？</span>
                    </h4>
                    <p className="text-xs text-zinc-600 mt-1">
                      AI 會優先參考本站整理資料，並在貸款、稅務與住宿法規問題中提示適用條件及確認單位。
                    </p>
                    <button 
                      onClick={() => handleTabChange("chat")}
                      className="mt-3 text-xs font-bold text-[#0F8F6D] hover:text-[#0A6D52] flex items-center gap-1 cursor-pointer"
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
                      className="mt-3 text-xs font-bold text-[#0F8F6D] hover:text-[#0A6D52] flex items-center gap-1 cursor-pointer"
                    >
                      <span>取得 Linus 聯繫管道</span> <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
 
              {/* Grid Control & Search Block */}
              <div className="border border-[#DDE3DF] bg-white p-4 flex flex-col md:flex-row gap-4 justify-between items-center" id="buy-filter-bar">
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
                          ? "bg-[#0F8F6D] text-white border-[#0F8F6D]" 
                          : "bg-white text-zinc-700 border-zinc-300 hover:border-[#0F8F6D]"
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
                      className="w-full pl-9 pr-4 py-1.5 text-sm bg-white border border-[#DDE3DF] hover:border-[#0F8F6D] focus:outline-none focus:ring-1 focus:ring-[#0F8F6D]"
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
                            className="border border-[#DDE3DF] hover:border-[#0F8F6D] bg-white p-5 flex flex-col justify-between hover:shadow-colored-soft hover:-translate-y-0.5 transition-all duration-300 cursor-pointer relative"
                            onClick={() => setSelectedFee(term)}
                          >
                            <div>
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <h4 className="font-bold text-sm md:text-base leading-[1.8] text-[#1A2A22]"><JapaneseRuby text={term.name} /></h4>
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
                            className="border border-[#DDE3DF] hover:border-[#0F8F6D] bg-white p-5 flex flex-col justify-between hover:shadow-colored-soft hover:-translate-y-0.5 transition-all duration-300 cursor-pointer relative"
                            onClick={() => setSelectedFee(term)}
                          >
                            <div>
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <h4 className="font-bold text-sm md:text-base leading-[1.8] text-[#1A2A22]"><JapaneseRuby text={term.name} /></h4>
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
                  <section className="border border-[#DDE3DF] hover:border-[#0F8F6D] bg-white p-6 md:p-8 transition-all duration-300 hover:shadow-colored-soft">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#DDE3DF] pb-4 mb-6 gap-4">
                      <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-[#0F8F6D]" />
                          <span>日本買房交易完整流程</span>
                        </h3>
                        <p className="text-xs text-zinc-500 font-sans mt-0.5">
                          在日本購置房地產，依照付款方式不同，交易與審査步驟大相徑庭
                        </p>
                      </div>
                      
                      {/* Flow Type Switcher */}
                      <div className="flex border border-[#DDE3DF] bg-[#F5F8F6] p-1 gap-1 font-sans text-xs">
                        <button
                          onClick={() => setSelectedFlowType("cash")}
                          className={`px-4 py-2 font-bold cursor-pointer transition-all ${
                            selectedFlowType === "cash" 
                              ? "bg-[#0F8F6D] text-white" 
                              : "bg-transparent text-zinc-700 hover:bg-zinc-200"
                          }`}
                        >
                          現金全款交易流程
                        </button>
                        <button
                          onClick={() => setSelectedFlowType("loan")}
                          className={`px-4 py-2 font-bold cursor-pointer transition-all ${
                            selectedFlowType === "loan" 
                              ? "bg-[#0F8F6D] text-white" 
                              : "bg-transparent text-zinc-700 hover:bg-zinc-200"
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
                  <section className="border border-[#DDE3DF] hover:border-[#0F8F6D] bg-white p-6 md:p-8 transition-all duration-300 hover:shadow-colored-soft">
                    <h3 className="text-lg font-bold border-b border-[#DDE3DF] pb-3 mb-4 flex items-center gap-2">
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
                        <h4 className="font-bold text-sm text-[#0F8F6D] border-b border-zinc-300 pb-2 mb-3 flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-[#0F8F6D]"></span>
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
                  <section className="border border-[#DDE3DF] hover:border-[#0F8F6D] bg-white p-6 md:p-8 space-y-6 transition-all duration-300 hover:shadow-colored-soft">
                    <div>
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <Landmark className="w-5 h-5 text-[#0F8F6D]" />
                        <span>海外買方融資方案整理</span>
                      </h3>
                      <p className="text-xs text-zinc-500 font-sans mt-1">
                        若不持有日本長期居留資格，可諮詢提供海外買方方案的金融機構。以下為本站蒐集的方案示例，不代表完整名單或目前一定受理：
                      </p>
                    </div>

                    <div className="space-y-5">
                      {taiwaneseBanks.map((bank, bIdx) => (
                        <div key={bIdx} className="border border-[#DDE3DF] hover:border-[#0F8F6D] bg-white transition-all duration-300 hover:shadow-colored-soft overflow-hidden">
                          <button
                            type="button"
                            onClick={() => toggleBank(`overseas-${bIdx}`)}
                            aria-expanded={expandedBanks.has(`overseas-${bIdx}`)}
                            className="w-full bg-[#F5F8F6] hover:bg-[#EAF3EE] text-[#1A2A22] px-5 py-4 flex justify-between items-center flex-wrap gap-3 text-left border-none cursor-pointer transition-colors"
                          >
                            <h4 className="font-extrabold text-base md:text-lg leading-tight font-serif text-[#1A2A22]">{bank.name}</h4>
                            <span className="flex items-center gap-3">
                              <span className="bg-[#0F8F6D] text-white px-2.5 py-1 text-xs font-bold font-sans">利率約 {bank.interestRate}</span>
                              <span className="text-xs font-bold font-sans text-zinc-500">{expandedBanks.has(`overseas-${bIdx}`) ? "收合" : "査看條件"}</span>
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
                              <p className="mt-1 text-xs font-semibold leading-relaxed text-[#0F8F6D]">{bank.amountLimit}</p>
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
                                <div className="px-3 py-2.5"><dt className="font-bold text-[#0F8F6D]">年齡</dt><dd className="mt-1 leading-relaxed text-zinc-600">{bank.ageLimit}</dd></div>
                                <div className="px-3 py-2.5"><dt className="font-bold text-[#0F8F6D]">收入／資產</dt><dd className="mt-1 leading-relaxed text-zinc-600">{bank.incomeAsset}</dd></div>
                                <div className="px-3 py-2.5"><dt className="font-bold text-[#0F8F6D]">對保／開戶</dt><dd className="mt-1 leading-relaxed text-zinc-600">{bank.signingReq}</dd></div>
                                <div className="px-3 py-2.5"><dt className="font-bold text-[#0F8F6D]">還款／租金帳戶</dt><dd className="mt-1 leading-relaxed text-zinc-600">{bank.rentAccount}</dd></div>
                              </dl>
                            </div>
                            <div className="border border-zinc-200">
                              <p className="bg-[#F5F8F6] px-3 py-2 font-bold text-[#1A2A22]">物件與貸款條件</p>
                              <dl className="divide-y divide-zinc-100">
                                <div className="px-3 py-2.5"><dt className="font-bold text-[#0F8F6D]">物件／屋齡</dt><dd className="mt-1 leading-relaxed text-zinc-600">{bank.propertyReq}</dd></div>
                                <div className="px-3 py-2.5"><dt className="font-bold text-[#0F8F6D]">承作區域</dt><dd className="mt-1 leading-relaxed text-zinc-600">{bank.areaLimit}</dd></div>
                                <div className="px-3 py-2.5"><dt className="font-bold text-[#0F8F6D]">還款方式</dt><dd className="mt-1 leading-relaxed text-zinc-600">{bank.repayment}</dd></div>
                                <div className="px-3 py-2.5"><dt className="font-bold text-[#0F8F6D]">提前清償費</dt><dd className="mt-1 leading-relaxed text-zinc-600">{bank.prepayFee}</dd></div>
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
                  <section className="border border-[#DDE3DF] hover:border-[#0F8F6D] bg-white p-6 md:p-8 space-y-6 transition-all duration-300 hover:shadow-colored-soft">
                    <div>
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <Percent className="w-5 h-5 text-[#0F8F6D]" />
                        <span>在日工作者融資方案整理</span>
                      </h3>
                      <p className="text-xs text-zinc-500 font-sans mt-1">
                        如果您持有日本長期工作簽證（如技術人文知識國際業務、高度人才），在日本有穩定正社員工作與繳稅紀錄：
                      </p>
                    </div>

                    <div className="grid grid-cols-1 items-start gap-5 font-sans md:grid-cols-2 xl:grid-cols-3">
                      {japaneseBanks.map((bank, idx) => (
                        <article key={idx} className="w-full border border-[#DDE3DF] bg-[#F5F8F6] transition-all duration-300 hover:border-[#0F8F6D] hover:shadow-colored-soft overflow-hidden">
                          <button
                            type="button"
                            onClick={() => toggleBank(`japan-${idx}`)}
                            aria-expanded={expandedBanks.has(`japan-${idx}`)}
                            className="grid min-h-[132px] w-full grid-cols-[1fr_auto] items-center gap-4 p-5 text-left border-none cursor-pointer bg-transparent"
                          >
                            <span className="min-w-0 self-center">
                              <h4 className="line-clamp-2 min-h-10 font-bold text-sm leading-5 text-[#0F8F6D]">{bank.name}</h4>
                              <div className="mt-2 line-clamp-2 min-h-12 text-lg font-extrabold leading-6 text-[#0a6d52]">{bank.rate}</div>
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
                                  <span className="text-[#0F8F6D] text-[7px] mt-[4.5px] shrink-0 select-none">●</span>
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
              )}

              {/* SECTION: MINPAKU & RYOKAN */}
              {(buyCategory === "all" || buyCategory === "minpaku") && (
                <div className="space-y-8">
                  {/* Minpaku District Rules */}
                  <section className="border border-[#DDE3DF] hover:border-[#0F8F6D] bg-white p-5 md:p-8 space-y-6 transition-all duration-300 hover:shadow-colored-soft">
                    <div className="border-b border-zinc-200 pb-5">
                      <h3 className="text-xl font-bold flex items-start gap-2">
                        <Map className="w-5 h-5 mt-0.5 shrink-0 text-[#0F8F6D]" />
                        <span>東京都 23 區住宅宿泊事業條例整理</span>
                      </h3>
                      <p className="text-xs text-zinc-500 font-sans mt-2 leading-relaxed">
                        適用《住宅宿泊事業法（民泊新法）》的物件，不是旅館業許可。中央法規上限為一年 180 天；各區可再加上區域、星期與管理限制。
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 border border-zinc-200 font-sans text-xs">
                      <div className="p-4 bg-[#F5F8F6] border-b sm:border-b-0 sm:border-r border-zinc-200">
                        <p className="text-zinc-500">全國共同上限</p>
                        <p className="mt-1 text-lg font-bold text-[#0F8F6D]">180 天／年</p>
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
                        <article key={item.district} className="mb-4 inline-block w-full break-inside-avoid border border-[#DDE3DF] bg-white align-top overflow-hidden transition-all duration-300 hover:border-[#0F8F6D] hover:shadow-colored-soft">
                          <button
                            type="button"
                            onClick={() => toggleMinpakuWard(item.district)}
                            aria-expanded={expandedMinpakuWards.has(item.district)}
                            className="grid min-h-[58px] w-full grid-cols-[minmax(72px,auto)_1fr_auto] items-center gap-3 bg-[#F5F8F6] hover:bg-[#EAF3EE] px-4 py-2.5 text-left border-none cursor-pointer transition-colors"
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
                              <dt className="font-bold text-[#0F8F6D]">營業限制</dt>
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
                      <strong>投資前必査：</strong>最新區條例、用途地域、建築與消防條件、管理規約及管理體制。上方內容是快速篩選用摘要，不能取代自治體就個別物件作出的確認。
                    </div>
                  </section>

                  {/* Ryokan requirements */}
                  <section className="border border-[#1A2A22] bg-white p-6 md:p-8 space-y-6">
                    <button
                      type="button"
                      onClick={() => setRyokanExpanded(current => !current)}
                      aria-expanded={ryokanExpanded}
                      className={`flex w-full items-start justify-between gap-4 text-left ${ryokanExpanded ? "border-b border-zinc-200 pb-3" : ""}`}
                    >
                      <span className="flex items-start gap-2">
                        <Building className="mt-0.5 h-5 w-5 shrink-0 text-[#0F8F6D]" />
                        <span>
                          <span className="block text-xl font-bold text-[#1A2A22]">{ryokanRules.title}</span>
                          <span className="mt-1 block text-xs font-normal leading-relaxed text-zinc-500 font-sans">全年經營所需的用途、建築、消防與許可確認重點</span>
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2 text-xs font-bold text-[#0F8F6D] font-sans">
                        {ryokanExpanded ? "收合" : "展開査看"}
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
                    </>)}
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
                      {buyFiltered.qa.map((qa, idx) => <QACard key={idx} question={qa.question} answer={qa.answer} sources={qa.sources} number={idx + 1} />)}
                    </div>
                  )}
                </section>
              )}
            </motion.div>
  );
}
