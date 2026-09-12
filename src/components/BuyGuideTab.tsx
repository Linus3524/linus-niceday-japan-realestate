import { ArrowRight, Lightbulb, ReceiptText, Search, Smile, X } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import {
buyHouseCashSteps, buyHouseLoanSteps,
BuyHouseQAItem,
BuyHouseTermItem,
japaneseBanks, minpakuRules, ryokanRules,
signingDocuments, taiwaneseBanks
} from "../data/buyHouseData";
import { hasMinimumKnowledgeSearchLength } from "../data/rentStaticSearchData";
import { getMinpakuAreaLabel, getMinpakuLimitLabel, minpakuWardOrder, taiwanJapanComparisons, taxLifecycle } from '../lib/guides/buyReference';
import { matchesAllTokens, tokenizeQuery } from "../lib/search";
import { searchThreads } from "../lib/threadSearch";
import type { AppTab, BuyGuideCategory, SelectTerm } from "../lib/uiTypes";
import { BuyLoanSection } from './guides/BuyLoanSection';
import { BuyLodgingSection } from './guides/BuyLodgingSection';
import { BuyProcessSection } from './guides/BuyProcessSection';
import { BuySearchResults } from './guides/BuySearchResults';
import { BuyTermsSection } from './guides/BuyTermsSection';
import { PageIntroCard } from "./PageIntroCard";
import { QACard } from "./QACard";
import { SectionHeading } from "./SectionHeading";

interface BuyGuideTabProps {
  buyCategory: string;
  setBuyCategory: (c: BuyGuideCategory) => void;
  buySearchQuery: string;
  setBuySearchQuery: (q: string) => void;
  buyFiltered: { drawing: BuyHouseTermItem[]; fee: BuyHouseTermItem[]; qa: BuyHouseQAItem[] };
  selectedFlowType: "cash" | "loan";
  setSelectedFlowType: (t: "cash" | "loan") => void;
  setSelectedFee: SelectTerm;
  handleTabChange: (tab: AppTab) => void;
}

export function BuyGuideTab(props: BuyGuideTabProps) {
  const { buyCategory, setBuyCategory, buySearchQuery, setBuySearchQuery, buyFiltered, selectedFlowType, setSelectedFlowType, setSelectedFee, handleTabChange } = props;
  // 多關鍵字查詢（例如「民泊 天數」）要全部命中才算，避免空白被當成比對字元
  const buyQueryTokens = tokenizeQuery(buySearchQuery);
  const isBuySearchActive = hasMinimumKnowledgeSearchLength(buySearchQuery);
  const [expandedBanks, setExpandedBanks] = useState<Set<string>>(new Set());
  const [expandedMinpakuWards, setExpandedMinpakuWards] = useState<Set<string>>(new Set());
  const [ryokanExpanded, setRyokanExpanded] = useState(false);
  // 「買房流程」底下四個大區塊做成可摺疊，整頁才不會過長。
  // 預設只展開第一塊（觀念），其餘收合，讓使用者一進來就看得到內容又能快速掃到標題。
  const [openSteps, setOpenSteps] = useState<Set<string>>(new Set(["concepts"]));
  const isStepOpen = (key: string) => openSteps.has(key);
  const toggleStep = (key: string) => setOpenSteps(current => {
    const next = new Set(current);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  });
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
  const staticBuySearchItems = [
    ...taiwanJapanComparisons.map(item => ({
      category: "台日買房差異",
      title: item.title,
      text: `台灣：${item.taiwan} 日本：${item.japan} Linus 實務提醒：${item.advice}`
    })),
    ...buyHouseCashSteps.map(step => ({
      category: "現金買房流程",
      title: step.title,
      text: [step.description, step.timing, step.payment, step.documents, ...(step.points || []), step.warning].filter(Boolean).join(" ")
    })),
    ...buyHouseLoanSteps.map(step => ({
      category: "貸款買房流程",
      title: step.title,
      text: [step.description, step.timing, step.payment, step.documents, ...(step.points || []), step.warning].filter(Boolean).join(" ")
    })),
    ...taxLifecycle.flatMap(stage => stage.details.map(detail => ({
      category: `稅務與持有・${stage.stage}`,
      title: detail.title,
      text: `${stage.summary} ${detail.points.join(" ")} 實務提醒：${stage.note}`
    }))),
    {
      category: "買房流程與文件",
      title: signingDocuments.residenceGroup.title,
      text: signingDocuments.residenceGroup.items.join(" ")
    },
    {
      category: "買房流程與文件",
      title: signingDocuments.nonResidenceGroup.title,
      text: signingDocuments.nonResidenceGroup.items.join(" ")
    },
    ...taiwaneseBanks.map(bank => ({
      category: "海外買方融資",
      title: bank.name,
      text: Object.values(bank).flat().join(" ")
    })),
    ...japaneseBanks.map(bank => ({
      category: "在日工作者融資",
      title: bank.name,
      text: Object.values(bank).flat().join(" ")
    })),
    ...minpakuRules.map(rule => ({
      category: "東京都民泊法規",
      title: rule.district,
      text: `${rule.rules} ${rule.daysLimit} ${rule.areaLimit} ${rule.managerReq}`
    })),
    {
      category: "旅館業／簡易宿所",
      title: "東京都特別區旅館業與簡易宿所確認重點",
      text: JSON.stringify(ryokanRules)
    }
  ].filter(item =>
    matchesAllTokens(`${item.category} ${item.title} ${item.text}`, buyQueryTokens)
  );
  const searchResultCount =
    buyFiltered.drawing.length +
    buyFiltered.fee.length +
    buyFiltered.qa.length +
    staticBuySearchItems.length;
  const threadMatches = isBuySearchActive
    ? searchThreads(buySearchQuery, { context: "buy", limit: 3 })
    : { results: [], total: 0 };

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
              <PageIntroCard
                id="buy-house-preface"
                icon="real_estate_agent"
                title="日本買房置產"
                actions={
                  <>
                    <div className="bg-[#F5F8F6] p-4 border border-[#DDE3DF] hover:border-[#00a174] transition-colors">
                      <h4 className="font-bold text-[#00a174] flex items-center gap-2 text-sm">
                        <span className="material-symbols-rounded shrink-0 select-none text-[18px] leading-none" aria-hidden="true">smart_toy</span>
                        <span>需要為您評估買房方案或試算嗎？</span>
                      </h4>
                      <p className="text-xs text-zinc-600 mt-1">
                        AI 會優先參考本站整理資料，並在貸款、稅務與住宿法規問題中提示適用條件及確認單位。
                      </p>
                      <button 
                        onClick={() => handleTabChange("chat")}
                        className="mt-3 text-xs font-bold text-[#00a174] hover:text-[#007d5a] flex items-center gap-1 cursor-pointer"
                      >
                        <span>開始 AI 買房諮詢</span> <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="bg-[#F5F8F6] p-4 border border-[#DDE3DF] hover:border-[#00a174] transition-colors">
                      <h4 className="font-bold text-[#00a174] flex items-center gap-2 text-sm">
                        <Smile className="w-4 h-4 text-[#00a174]" />
                        <span>需要直接進行日本物件配對？</span>
                      </h4>
                      <p className="text-xs text-zinc-600 mt-1">
                        直接聯絡 Linus，協助您尋找網上公開或未公開的優質房源。
                      </p>
                      <button 
                        onClick={() => handleTabChange("contact")}
                        className="mt-3 text-xs font-bold text-[#00a174] hover:text-[#007d5a] flex items-center gap-1 cursor-pointer"
                      >
                        <span>取得 Linus 聯繫管道</span> <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                }
              >
                <p>
                  許多台灣朋友在日本生活逐漸安定後，也開始規劃買房自住、長期出租，或研究住宿事業。外國人原則上可以取得日本不動產，但產權登記、匯款、融資、稅務與住宿營業各有不同程序；除了房價與表面投報率，還有不少細節需要先釐清。
                </p>
                <p>
                  為了協助您更有方向地了解日本房市，我整理了物件資料與費用術語、現金與貸款買房流程、金融機構方案示例，以及民宿與旅館業的確認重點。無論是想自住還是置產規劃，都歡迎直接查閱或透過 AI 顧問向我諮詢！❀
                </p>
              </PageIntroCard>
 
              {/* Grid Control & Search Block */}
              <div className="border border-[#DDE3DF] hover:border-[#00a174] bg-white p-4 flex flex-col md:flex-row gap-4 justify-between items-center transition-all duration-300 hover:shadow-colored-soft" id="buy-filter-bar">
                {/* Horizontal Category selectors */}
                <div className="flex flex-wrap gap-2 w-full md:w-auto font-sans">
                  {[
                    { id: "all", label: "全部內容" },
                    { id: "drawing", label: "圖紙與物件" },
                    { id: "fee", label: "交易與費用" },
                    { id: "steps", label: "買房流程與文件" },
                    { id: "loans", label: "在日貸款條件" },
                    { id: "minpaku", label: "民宿與旅館法規" },
                    { id: "qa", label: "買房問答集" }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setBuyCategory(cat.id as BuyGuideCategory);
                        setBuySearchQuery("");
                      }}
                      className={`px-3 py-1.5 text-xs font-medium cursor-pointer border transition-colors ${
                        buyCategory === cat.id 
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
                    placeholder="搜尋買房知識（如：貸款）..."
                    minLength={2}
                    value={buySearchQuery}
                    onChange={(e) => {
                      setBuySearchQuery(e.target.value);
                      if (!["all", "drawing", "fee", "qa"].includes(buyCategory) && hasMinimumKnowledgeSearchLength(e.target.value)) {
                        setBuyCategory("all");
                      }
                    }}
                    className="w-full pl-9 pr-4 py-1.5 text-sm bg-white border border-[#DDE3DF] hover:border-[#00a174] focus:outline-none focus:ring-1 focus:ring-[#00a174]"
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
              </div>

              {buySearchQuery.trim() && !isBuySearchActive && (
                <div className="border-l-4 border-[#DCC8A1] bg-[#FFF9ED] px-4 py-3 text-sm text-[#66583D] font-sans">
                  請輸入至少 2 個字的完整詞，例如「取得稅」或「住宅貸款」。
                </div>
              )}

              <BuySearchResults isBuySearchActive={isBuySearchActive} buySearchQuery={buySearchQuery} searchResultCount={searchResultCount} threadMatches={threadMatches} setBuySearchQuery={setBuySearchQuery} buyFiltered={buyFiltered} setSelectedFee={setSelectedFee} staticBuySearchItems={staticBuySearchItems} />

              {/* SECTION: TERMS */}
              <BuyTermsSection isBuySearchActive={isBuySearchActive} buyCategory={buyCategory} buyFiltered={buyFiltered} setSelectedFee={setSelectedFee} />

              {!isBuySearchActive && (buyCategory === "all" || buyCategory === "steps") && (
                <section className="border border-[#DDE3DF] bg-white p-4 transition-all duration-300 hover:border-[#00a174] hover:shadow-colored-soft md:p-6">
                  <SectionHeading
                    icon={Lightbulb}
                    title="台日買房5大差異"
                    description="從實坪計算到出價文化——看懂 5 個關鍵差異，切換日本置產思維。"
                    open={isStepOpen("concepts")}
                    onToggle={() => toggleStep("concepts")}
                  />

                  {/* 用站內既有的卡片語彙：灰底卡片 + 白色子欄位 + 小方塊綠標題 + 左側綠條提醒，
                      與「簽約文件」「流程步驟」等區塊同一套寫法。 */}
                  {isStepOpen("concepts") && (
                  <div className="space-y-4">
                    {taiwanJapanComparisons.map((item) => (
                      <article key={item.id} className="border border-zinc-200 bg-[#F5F8F6] p-5">
                        <h4 className="mb-4 flex items-center gap-2 border-b border-zinc-300 pb-3 font-serif text-base font-bold text-[#1A2A22] md:text-lg">
                          <span className="inline-flex h-[1.375rem] w-[1.375rem] shrink-0 items-center justify-center rounded-full bg-[#00a174] pb-px font-sans text-xs font-bold leading-none text-white">
                            {item.number.replace(/^0/, "")}
                          </span>
                          <span>{item.title}</span>
                        </h4>

                        <div className="grid grid-cols-1 gap-4 font-sans md:grid-cols-2">
                          <div className="border border-zinc-200 bg-white p-4">
                            <h5 className="mb-3 flex items-center gap-1.5 border-b border-zinc-300 pb-2 text-sm font-bold text-[#66736C]">
                              <span className="h-2 w-2 bg-[#8A9590]" />
                              <span>台灣常見理解</span>
                            </h5>
                            <p className="text-xs leading-relaxed text-zinc-700 md:text-sm">{item.taiwan}</p>
                          </div>
                          <div className="border border-zinc-200 bg-white p-4">
                            <h5 className="mb-3 flex items-center gap-1.5 border-b border-zinc-300 pb-2 text-sm font-bold text-[#00a174]">
                              <span className="h-2 w-2 bg-[#00a174]" />
                              <span>日本實務</span>
                            </h5>
                            <p className="text-xs leading-relaxed text-zinc-700 md:text-sm">{item.japan}</p>
                          </div>
                        </div>

                        <p className="mt-4 border-l-4 border-[#00a174] bg-[#e6f6f1] p-4 font-sans text-xs leading-relaxed text-[#3F5147] md:text-sm">
                          <strong className="mr-2 text-[#007d5a]">Linus 實務提醒</strong>
                          {item.advice}
                        </p>
                      </article>
                    ))}
                  </div>
                  )}
                </section>
              )}

              {/* SECTION: STEPS & FLOWS */}
              <BuyProcessSection isBuySearchActive={isBuySearchActive} buyCategory={buyCategory} isStepOpen={isStepOpen} toggleStep={toggleStep} setSelectedFlowType={setSelectedFlowType} selectedFlowType={selectedFlowType} />

              {!isBuySearchActive && (buyCategory === "all" || buyCategory === "steps") && (
                <section className="border border-[#DDE3DF] bg-white p-4 transition-all duration-300 hover:border-[#00a174] hover:shadow-colored-soft md:p-6">
                  <SectionHeading
                    icon={ReceiptText}
                    title="日本房產稅務與持有成本整理"
                    description="釐清評價額與市價差異：一手掌握購入規費、年度持稅與賣房資本利得稅。"
                    open={isStepOpen("tax")}
                    onToggle={() => toggleStep("tax")}
                  />

                  {isStepOpen("tax") && (
                  <>
                  {/* 與上面「五個觀念」比較表同一套卡片語彙 */}
                  <div className="space-y-4">
                    {taxLifecycle.map((item, index) => (
                      <article key={item.stage} className="border border-zinc-200 bg-[#F5F8F6] p-5">
                        <div className="mb-4 border-b border-zinc-300 pb-3">
                          <h4 className="flex items-center gap-2 font-serif text-base font-bold text-[#1A2A22] md:text-lg">
                            <span className="inline-flex h-[1.375rem] w-[1.375rem] shrink-0 items-center justify-center rounded-full bg-[#00a174] pb-px font-sans text-xs font-bold leading-none text-white">
                              {index + 1}
                            </span>
                            <span>{item.stage}</span>
                          </h4>
                          <p className="mt-2 font-sans text-xs leading-relaxed text-zinc-600 md:text-sm">{item.summary}</p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 font-sans md:grid-cols-3">
                          {item.details.map(detail => (
                            <div key={detail.title} className="border border-zinc-200 bg-white p-4">
                              <h5 className="mb-3 flex items-center gap-1.5 border-b border-zinc-300 pb-2 text-sm font-bold text-[#00a174]">
                                <span className="h-2 w-2 shrink-0 bg-[#00a174]" />
                                <span>{detail.title}</span>
                              </h5>
                              <ul className="space-y-2 text-xs leading-relaxed text-zinc-700 md:text-sm">
                                {detail.points.map(point => (
                                  <li key={point} className="flex items-start gap-2">
                                    <span className="font-bold text-[#00a174]">✓</span>
                                    <span>{point}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>

                        <p className="mt-4 border-l-4 border-[#00a174] bg-[#e6f6f1] p-4 font-sans text-xs leading-relaxed text-[#3F5147] md:text-sm">
                          <strong className="mr-2 text-[#007d5a]">Linus 實務提醒</strong>
                          {item.note}
                        </p>
                      </article>
                    ))}
                  </div>

                  <p className="mt-4 font-sans text-[10px] leading-relaxed text-zinc-400">
                    制度基準：2026年7月。上方先以現行一般稅率與常見住宅特例說明；正式精算時，再以物件的固定資產稅評價證明、用途、面積、屋齡及買方稅務身分計算。
                  </p>
                  </>
                  )}
                </section>
              )}

              {/* SECTION: LOAN COMPARISON */}
              <BuyLoanSection isBuySearchActive={isBuySearchActive} buyCategory={buyCategory} toggleBank={toggleBank} expandedBanks={expandedBanks} />

              {/* SECTION: MINPAKU & RYOKAN */}
              <BuyLodgingSection isBuySearchActive={isBuySearchActive} buyCategory={buyCategory} toggleMinpakuWard={toggleMinpakuWard} expandedMinpakuWards={expandedMinpakuWards} setRyokanExpanded={setRyokanExpanded} ryokanExpanded={ryokanExpanded} minpakuWardOrder={minpakuWardOrder} getMinpakuLimitLabel={getMinpakuLimitLabel} getMinpakuAreaLabel={getMinpakuAreaLabel} />

              {/* SECTION: QA */}
              {!isBuySearchActive && (buyCategory === "all" || buyCategory === "qa") && (
                <section className="space-y-4 pt-4">
                  <h3 className="text-lg font-bold border-l-4 border-[#00a174] pl-3 flex items-center justify-between">
                    <span>常見日本買房與投資問題 Q&A</span>
                    <span className="text-xs text-zinc-500 font-normal font-sans">共 {buyFiltered.qa.length} 問</span>
                  </h3>
                  
                  {buyFiltered.qa.length === 0 ? (
                    <div className="border border-dashed border-zinc-300 bg-white py-12 text-center text-zinc-500 text-xs font-sans">
                      找不到符合「{buySearchQuery}」的 Q&A 內容。請更換關鍵字重新搜尋。
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {buyFiltered.qa.map((qa, idx) => <QACard key={idx} question={qa.question} summary={qa.summary} answer={qa.answer} sources={qa.sources} table={qa.table} number={idx + 1} />)}
                    </div>
                  )}
                </section>
              )}
            </motion.div>
  );
}
