import { useState, useEffect, FormEvent } from "react";
import {
  ExternalLink, ArrowUp, Copy, Check, Smile
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import {
  initialFees, specialTerms, processSteps, otherQA, linusContact, QAItem, InitialFeeItem
} from "./data/rentGuideData";
import {
  buyHouseDrawingTerms, buyHouseFeeTerms, buyHouseQAs, BuyHouseTermItem
} from "./data/buyHouseData";
import { budgetModifiers } from "./data/rentGuideData";
import { hasTowerMansionSupport } from "./lib/calcRules";
import { RentGuideTab } from "./components/RentGuideTab";
import { BuyGuideTab } from "./components/BuyGuideTab";
import { CalculatorTab } from "./components/CalculatorTab";
import { ChatTab } from "./components/ChatTab";
import { ContactTab } from "./components/ContactTab";
import { TermModal } from "./components/TermModal";
import HeaderInfoBar from "./components/HeaderInfoBar";

export default function App() {
  // Navigation tabs: 'cards' (租屋知識圖卡), 'buyHouse' (買房知識大補帖), 'calculator' (預算估算), 'chat' (AI問答), 'contact' (聯絡Linus)
  const [activeTab, setActiveTab] = useState<"cards" | "buyHouse" | "calculator" | "chat" | "contact">("cards");
  
  // UI Scroll States for Japanese Editorial Specs
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showToTop, setShowToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Use hysteresis so the header's own height transition cannot repeatedly
      // cross the same scroll threshold and toggle compact mode back and forth.
      setScrolled(current => current ? window.scrollY > 20 : window.scrollY > 120);
      setShowToTop(window.scrollY > 600);
      
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(progress);
      } else {
        setScrollProgress(0);
      }
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  // Knowledge Base (圖卡) States
  const [kbCategory, setKbCategory] = useState<"all" | "initial" | "terms" | "steps" | "qa">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFee, setSelectedFee] = useState<InitialFeeItem | BuyHouseTermItem | any | null>(null);

  // Buy House Tab States
  const [buyCategory, setBuyCategory] = useState<"all" | "drawing" | "fee" | "steps" | "loans" | "minpaku" | "qa">("all");
  const [buySearchQuery, setBuySearchQuery] = useState("");
  const [selectedFlowType, setSelectedFlowType] = useState<"cash" | "loan">("cash");

  // Budget Calculator States
  const [calcMode, setCalcMode] = useState<"rent" | "buy">("rent");
  const [calcDistrict, setCalcDistrict] = useState("新宿區");
  const [calcRoomType, setCalcRoomType] = useState<"r1" | "k1" | "ldk1" | "ldk2">("k1");
  const [calcModifiers, setCalcModifiers] = useState<number[]>([]); // Selected index array from budgetModifiers
  const [calcBuyModifiers, setCalcBuyModifiers] = useState<number[]>([]); // Selected index array from buyBudgetModifiers
  const [calcStation, setCalcStation] = useState<string>("none");

  useEffect(() => {
    setCalcStation("none");
    if (!hasTowerMansionSupport(calcDistrict)) {
      setCalcModifiers(prev => prev.filter(idx => idx !== 25));
      setCalcBuyModifiers(prev => prev.filter(idx => idx !== 8));
    }
  }, [calcDistrict]);

  useEffect(() => {
    setCalcModifiers(prev => {
      const filtered = prev.filter(idx => {
        const mod = budgetModifiers[idx];
        return !mod.applicableLayouts || mod.applicableLayouts.includes(calcRoomType);
      });
      if (filtered.length !== prev.length) {
        return filtered;
      }
      return prev;
    });
  }, [calcRoomType, budgetModifiers]);

  useEffect(() => {
    const hasNewAge = calcModifiers.includes(10) || calcModifiers.includes(11);
    const isLargeSize = (calcRoomType === "ldk1" || calcRoomType === "ldk2") || 
                        ((calcRoomType === "r1" || calcRoomType === "k1") && (calcModifiers.includes(3) || calcModifiers.includes(4)));
    
    if (hasNewAge && isLargeSize && !calcModifiers.includes(0)) {
      setCalcModifiers(prev => {
        if (!prev.includes(0)) {
          return [...prev.filter(idx => idx !== 1 && idx !== 2), 0];
        }
        return prev;
      });
    }
  }, [calcModifiers, calcRoomType]);

  // AI Chat States
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "model"; text: string }>>([
    {
      role: "model",
      text: "您好！我是 Linus ❀ \n\n歡迎來到日本租屋與買房知識大補帖！不論您是想在東京租下第一個溫馨小窩，還是看好日本房地產想在東京置產投資、申請房貸或經營民宿，我都能為您提供最專業的解答喔！\n\n您可以在下方輸入任何問題，例如：\n- 「海外人士可以在日本貸款買房嗎？」\n- 「民泊新法在東京都 23 區有哪些營業限制？」\n- 「租屋初期費用大概要準備多少？」\n\n我會隨時線上為您解答！"
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Contact Form Toggle State ('rent' or 'buy')
  const [contactFormType, setContactFormType] = useState<"rent" | "buy">("rent");

  // Line ID Copy State
  const [copiedLine, setCopiedLine] = useState(false);
  const [copiedWechat, setCopiedWechat] = useState(false);

  // Keep the tab navigation visible and move to the selected content, not the site header.
  const handleTabChange = (tab: "cards" | "buyHouse" | "calculator" | "chat" | "contact") => {
    setActiveTab(tab);
    requestAnimationFrame(() => {
      document.getElementById("main-content")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  // Copy Line ID
  const handleCopyLine = () => {
    navigator.clipboard.writeText(linusContact.lineId);
    setCopiedLine(true);
    setTimeout(() => setCopiedLine(false), 2000);
  };

  // Copy WeChat ID
  const handleCopyWechat = () => {
    if (linusContact.wechatId) {
      navigator.clipboard.writeText(linusContact.wechatId);
      setCopiedWechat(true);
      setTimeout(() => setCopiedWechat(false), 2000);
    }
  };

  // Chat Submission
  const handleSendMessage = async (e?: FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const textToSend = customMsg || chatInput;
    if (!textToSend.trim() || chatLoading) return;

    const newMessages = [...chatMessages, { role: "user" as const, text: textToSend }];
    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);
    setChatError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: chatMessages.map(msg => ({
            role: msg.role,
            text: msg.text
          }))
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "請求伺服器失敗");
      }

      setChatMessages(prev => [...prev, { role: "model" as const, text: data.reply }]);
    } catch (err: any) {
      console.error(err);
      setChatError("AI 顧問目前暫時無法回覆，請稍後再試，或透過 LINE 聯絡 Linus。");
    } finally {
      setChatLoading(false);
    }
  };

  // Filter Knowledge Base items
  const getFilteredItems = () => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    
    // Step 1: Filter by category
    let matchedInitialFees: InitialFeeItem[] = [];
    let matchedSpecialTerms = [];
    let matchedSteps = [];
    let matchedQA: QAItem[] = [];

    if (kbCategory === "all" || kbCategory === "initial") {
      matchedInitialFees = initialFees;
    }
    if (kbCategory === "all" || kbCategory === "terms") {
      matchedSpecialTerms = specialTerms;
    }
    if (kbCategory === "all" || kbCategory === "steps") {
      matchedSteps = processSteps;
    }
    if (kbCategory === "all" || kbCategory === "qa") {
      matchedQA = otherQA;
    }

    // Step 2: Filter by search query
    if (normalizedQuery) {
      matchedInitialFees = matchedInitialFees.filter(
        f => f.name.toLowerCase().includes(normalizedQuery) || 
             (f.jpName && f.jpName.toLowerCase().includes(normalizedQuery)) ||
             f.description.toLowerCase().includes(normalizedQuery)
      );
      matchedSpecialTerms = matchedSpecialTerms.filter(
        t => t.name.toLowerCase().includes(normalizedQuery) ||
             (t.jpName && t.jpName.toLowerCase().includes(normalizedQuery)) ||
             t.description.toLowerCase().includes(normalizedQuery) ||
             (t.details && t.details.some(d => d.toLowerCase().includes(normalizedQuery)))
      );
      matchedSteps = matchedSteps.filter(
        s => s.name.toLowerCase().includes(normalizedQuery) ||
             s.description.toLowerCase().includes(normalizedQuery)
      );
      matchedQA = matchedQA.filter(
        q => q.question.toLowerCase().includes(normalizedQuery) ||
             q.answer.toLowerCase().includes(normalizedQuery)
      );
    }

    return {
      fees: matchedInitialFees,
      terms: matchedSpecialTerms,
      steps: matchedSteps,
      qa: matchedQA
    };
  };

  const filtered = getFilteredItems();
  const hasNoResults = 
    filtered.fees.length === 0 && 
    filtered.terms.length === 0 && 
    filtered.steps.length === 0 && 
    filtered.qa.length === 0;

  // Filter Buy House items
  const getFilteredBuyItems = () => {
    const q = buySearchQuery.trim().toLowerCase();
    
    let matchedDrawing = buyHouseDrawingTerms;
    let matchedFee = buyHouseFeeTerms;
    let matchedQA = buyHouseQAs;
    
    if (buyCategory === "drawing") {
      matchedFee = [];
      matchedQA = [];
    } else if (buyCategory === "fee") {
      matchedDrawing = [];
      matchedQA = [];
    } else if (buyCategory === "qa") {
      matchedDrawing = [];
      matchedFee = [];
    } else if (buyCategory !== "all") {
      matchedDrawing = [];
      matchedFee = [];
      matchedQA = [];
    }
    
    if (q) {
      if (buyCategory === "all" || buyCategory === "drawing" || buyCategory === "fee") {
        matchedDrawing = matchedDrawing.filter(
          t => t.name.toLowerCase().includes(q) || 
               (t.jpName && t.jpName.toLowerCase().includes(q)) || 
               t.description.toLowerCase().includes(q)
        );
        matchedFee = matchedFee.filter(
          t => t.name.toLowerCase().includes(q) || 
               (t.jpName && t.jpName.toLowerCase().includes(q)) || 
               t.description.toLowerCase().includes(q)
        );
      }
      if (buyCategory === "all" || buyCategory === "qa") {
        matchedQA = matchedQA.filter(
          qa => qa.question.toLowerCase().includes(q) || 
                qa.answer.toLowerCase().includes(q)
        );
      }
    }
    
    return {
      drawing: matchedDrawing,
      fee: matchedFee,
      qa: matchedQA
    };
  };

  const buyFiltered = getFilteredBuyItems();

  return (
    <div className="min-h-screen flex flex-col font-serif select-text">
      {/* Reading Progress Bar */}
      <div 
        className="fixed top-0 left-0 right-0 h-[3px] z-[100] transition-all duration-75"
        style={{
          background: 'linear-gradient(90deg, var(--color-primary, #0F8F6D), var(--color-orange, #E94E2B))',
          width: `${scrollProgress}%`
        }}
      />

      {/* Top sticky header */}
      <header className="sticky top-0 z-50 border-b border-[#DDE3DF] bg-white py-3 px-6 select-none" id="app-header">
        <div className="max-w-[1280px] mx-auto flex justify-between items-center">
          {/* Left: L square box and name */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#0F8F6D] text-white flex items-center justify-center font-jost font-bold text-base leading-none select-none">
              L
            </div>
            <span className="font-serif font-extrabold text-[17px] tracking-[1.5px] text-[#1A2A22]">LINUS 住好日</span>
            <span className="inline-block shrink-0 text-[9px] border border-[#0F8F6D] bg-[#EAF3EE] text-[#0F8F6D] px-1.5 py-0.5 font-sans font-bold tracking-wider select-none">日本租屋買房知識大補帖</span>
          </div>
          {/* Right: 令和日期時間 & 東京天氣 */}
          <HeaderInfoBar />
        </div>
      </header>

      {/* Hero Banner Section */}
      <section className="hero-banner bg-white py-12 border-b border-[#DDE3DF] relative" id="hero-banner">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left side: Heading */}
          <div className="lg:col-span-8 space-y-4 pr-0 lg:pr-10">
            <div className="flex items-center gap-2 text-[11px] text-[#0F8F6D] font-jost font-semibold tracking-wider uppercase select-none">
              <span className="w-6 h-[1px] bg-[#0F8F6D] inline-block"></span>
              <span>VOL.001 · 2026 EDITION</span>
            </div>
            
            <h1 className="font-serif font-extrabold text-4xl md:text-5xl leading-tight text-[#1A2A22] mt-2">
              日本で、<span className="relative inline-block px-1 z-10 after:content-[''] after:absolute after:left-0 after:bottom-1 after:w-full after:h-3.5 after:bg-[#DDF3EA]/90 after:-z-10">住まいを</span>
              <br />
              <span className="text-[#0F8F6D]">探す日々。</span>
            </h1>

            <h2 className="font-serif text-lg md:text-xl text-[#3F5147] tracking-wide pt-4 font-bold leading-normal">
              台灣人仲介帶你看懂日本租屋、買房與置產。
            </h2>

            <div className="text-xs md:text-sm text-zinc-500 font-sans tracking-wide leading-relaxed space-y-1 mt-4">
              <p>我是 Linus，在東京從事不動產仲介。</p>
              <p>分享日本租屋、買房、貸款規劃與在日生活的第一線實務，並提供 24 小時 AI 顧問與線上諮詢。</p>
              <p>從找房到安居，希望成為你在日本最值得信賴的指南。</p>
            </div>

            <div className="border-t border-[#DDE3DF] my-6"></div>

            <div className="flex items-center gap-x-4 flex-wrap gap-y-1 text-[10px] text-zinc-400 font-jost tracking-wider uppercase font-semibold">
              <span>SINCE 2021</span>
              <span>•</span>
              <span>REAL ESTATE GUIDE</span>
              <span>•</span>
              <span>TOKYO</span>
            </div>
          </div>

          {/* Right side: Contact Card */}
          <div className="lg:col-span-4 mx-auto w-full bg-white border border-[#DDE3DF] p-5 hover:border-[#0F8F6D] hover:shadow-colored-soft transition-all duration-300 grid grid-cols-[112px_minmax(0,1fr)] gap-4 items-center lg:w-fit lg:ml-auto lg:grid-cols-[auto_1fr] lg:gap-3 lg:p-4">
            {/* Left: Logo alone */}
            <div className="shrink-0">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="h-28 w-28 object-contain lg:h-20 lg:w-20"
              />
            </div>
            
            {/* Right: Text & Actions */}
            <div className="w-full space-y-2.5">
              <div>
                <span className="block text-[9px] text-[#0F8F6D] font-jost tracking-wider uppercase font-semibold">Contact Linus</span>
                <span className="block text-xs font-bold text-[#1A2A22] font-serif">立即聯絡線上諮詢</span>
              </div>

              <div className="w-full space-y-1.5 lg:w-[160px]">
                <a
                  href={`https://line.me/ti/p/~${linusContact.lineId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#0F8F6D] hover:bg-[#0A6D52] text-white py-2 text-xs font-bold font-sans flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-none text-center"
                  id="add-line-btn-hero"
                >
                  ＋ 加 LINE 好友
                </a>

                <div className="flex items-stretch font-sans text-xs w-full">
                  <input
                    type="text"
                    readOnly
                    value={linusContact.lineId}
                    className="flex-1 bg-white border border-[#DDE3DF] px-2 py-1 font-mono text-zinc-700 focus:outline-none text-[10px] min-w-0"
                    aria-label="LINE ID"
                  />
                  <button
                    onClick={handleCopyLine}
                    className="bg-[#F5F8F6] border border-l-0 border-[#DDE3DF] hover:bg-[#EAF3EE] text-zinc-700 text-[10px] px-2.5 py-1 cursor-pointer font-bold transition-colors select-none shrink-0"
                  >
                    {copiedLine ? "已複製" : "複製"}
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Elegant Sticky Navigation Tabs Bar (Blog-styled) */}
      <nav className="sticky top-[53px] z-40 bg-white border-b border-[#DDE3DF] select-none" id="primary-nav">
        <div className="max-w-[1280px] mx-auto flex items-center justify-start px-2 sm:justify-center sm:px-6 overflow-x-auto overscroll-x-contain touch-pan-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="flex min-w-max items-center gap-0 py-2 sm:min-w-0 sm:gap-1 md:gap-2">
            {[
              { id: "cards" as const, label: "租屋指南", en: "RENT" },
              { id: "buyHouse" as const, label: "買房置產", en: "BUY" },
              { id: "calculator" as const, label: "費用試算", en: "CALC" },
              { id: "chat" as const, label: "AI 顧問", en: "CHAT" },
              { id: "contact" as const, label: "聯絡諮詢", en: "CONTACT" }
            ].map((tab, idx) => (
              <button 
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`relative py-2 px-3 sm:px-4 md:px-5.5 flex items-baseline gap-1 sm:gap-1.5 md:gap-2 font-serif text-[13px] sm:text-sm md:text-[15px] tracking-[0.08em] sm:tracking-[0.14em] whitespace-nowrap cursor-pointer transition-colors duration-200 select-none group border-none bg-transparent shrink-0 ${
                  activeTab === tab.id ? "text-[#0a6d52] font-bold" : "text-[#1a2a22] hover:text-[#0a6d52]"
                }`}
                id={`nav-tab-${tab.id.toLowerCase()}`}
              >
                <span className="font-jost text-[8px] sm:text-[9px] md:text-[10px] text-zinc-400 group-hover:text-[#0F8F6D] transition-colors">{String(idx + 1).padStart(2, '0')}</span>
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-[-10px] left-3 right-3 sm:left-4 sm:right-4 md:left-5.5 md:right-5.5 h-[2px] bg-[#0F8F6D]" />
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="scroll-mt-[108px] flex-grow max-w-6xl w-full mx-auto px-4 py-8" id="main-content">
        <AnimatePresence mode="wait">
          
          {activeTab === "cards" && (
            <RentGuideTab
              kbCategory={kbCategory}
              setKbCategory={setKbCategory}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filtered={filtered}
              hasNoResults={hasNoResults}
              setSelectedFee={setSelectedFee}
              handleTabChange={handleTabChange}
            />
          )}

          {activeTab === "buyHouse" && (
            <BuyGuideTab
              buyCategory={buyCategory}
              setBuyCategory={setBuyCategory}
              buySearchQuery={buySearchQuery}
              setBuySearchQuery={setBuySearchQuery}
              buyFiltered={buyFiltered}
              selectedFlowType={selectedFlowType}
              setSelectedFlowType={setSelectedFlowType}
              setSelectedFee={setSelectedFee}
              handleTabChange={handleTabChange}
            />
          )}

          {activeTab === "calculator" && (
            <CalculatorTab
              calcMode={calcMode}
              setCalcMode={setCalcMode}
              calcDistrict={calcDistrict}
              setCalcDistrict={setCalcDistrict}
              calcRoomType={calcRoomType}
              setCalcRoomType={setCalcRoomType}
              calcModifiers={calcModifiers}
              setCalcModifiers={setCalcModifiers}
              calcBuyModifiers={calcBuyModifiers}
              setCalcBuyModifiers={setCalcBuyModifiers}
              calcStation={calcStation}
              setCalcStation={setCalcStation}
              handleTabChange={handleTabChange}
              handleSendMessage={handleSendMessage}
            />
          )}

          {activeTab === "chat" && (
            <ChatTab
              chatMessages={chatMessages}
              chatInput={chatInput}
              setChatInput={setChatInput}
              chatLoading={chatLoading}
              chatError={chatError}
              handleSendMessage={handleSendMessage}
            />
          )}

          {activeTab === "contact" && (
            <ContactTab
              contactFormType={contactFormType}
              setContactFormType={setContactFormType}
              copiedLine={copiedLine}
              handleCopyLine={handleCopyLine}
              copiedWechat={copiedWechat}
              handleCopyWechat={handleCopyWechat}
            />
          )}

        </AnimatePresence>
      </main>
      <TermModal
        selectedFee={selectedFee}
        setSelectedFee={setSelectedFee}
        handleTabChange={handleTabChange}
        handleSendMessage={handleSendMessage}
      />

      {/* Footer copyright block */}
      <footer className="border-t border-[#1A2A22] bg-white mt-12 py-12" id="app-footer">
        <div className="max-w-6xl mx-auto px-4 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <div className="space-y-1">
              <strong className="text-sm text-[#1A2A22]">LINUS住好日 ╳ 日本租屋買房知識大補帖</strong>
              <p className="text-xs text-zinc-500 font-sans">
                版權所有 © 2026 LINUS Nice Day Japan (CHANG CHIN WEI) @linus3524 All Rights Reserved.
              </p>
            </div>
            
            <div className="flex gap-4 text-xs font-sans">
              <a href="https://www.threads.com/@linus3524" target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-[#0F8F6D] flex items-center gap-0.5">
                <span>Threads 專頁</span> <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-zinc-300">|</span>
              <a href={`mailto:${linusContact.email}`} className="text-zinc-600 hover:text-[#0F8F6D]">
                電子信箱
              </a>
            </div>
          </div>

          <div className="bg-[#F5F8F6] border border-zinc-200 p-4 text-[10px] text-zinc-500 leading-relaxed text-justify font-sans">
            <p>
              本站內容由 <strong>株式会社世嘉 Seika Linus Chang</strong> 依公開資料與仲介實務整理，供一般資訊與預算規劃參考，不構成法律、稅務、金融、簽證或投資建議。法令、契約與金融方案可能更新，請以主管機關及服務提供者的最新書面資料為準。未經授權請勿作商業轉載；若發現錯誤或授權疑慮，請聯絡 r352410@gmail.com。
            </p>
          </div>
        </div>
      </footer>

      {showToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 w-10 h-10 rounded-full bg-[#0F8F6D] hover:bg-[#0A6D52] text-white flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300 transform scale-100 opacity-100 hover:scale-110 z-50 cursor-pointer"
          aria-label="Back to Top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
