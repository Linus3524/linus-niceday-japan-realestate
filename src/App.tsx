import { useState, useEffect, FormEvent } from "react";
import {
  Calculator, Sparkles, Smile, FileText, Building, ExternalLink, ArrowUp
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

export default function App() {
  // Navigation tabs: 'cards' (租屋知識圖卡), 'buyHouse' (買房知識大補帖), 'calculator' (預算估算), 'chat' (AI問答), 'contact' (聯絡Linus)
  const [activeTab, setActiveTab] = useState<"cards" | "buyHouse" | "calculator" | "chat" | "contact">("cards");
  
  // UI Scroll States for Japanese Editorial Specs
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showToTop, setShowToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
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
  const [buyCategory, setBuyCategory] = useState<"all" | "terms" | "steps" | "loans" | "minpaku" | "qa">("all");
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
      text: "您好！我是東京日和的 Linus ❀ \n\n歡迎來到日本租屋與買房知識大補帖！不論您是想在東京租下第一個溫馨小窩，還是看好日本房地產想在東京置產投資、申請房貸或經營民宿，我都能為您提供最專業的解答喔！\n\n您可以在下方輸入任何問題，例如：\n- 「海外人士可以在日本貸款買房嗎？」\n- 「民泊新法在東京都 23 區有哪些營業限制？」\n- 「租房子初期費用大概要準備多少？」\n\n我會隨時線上為您解答！"
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Contact Form Toggle State ('rent' or 'buy')
  const [contactFormType, setContactFormType] = useState<"rent" | "buy">("rent");

  // Line ID Copy State
  const [copiedLine, setCopiedLine] = useState(false);
  const [copiedWechat, setCopiedWechat] = useState(false);

  // Scroll to top when changing tab
  const handleTabChange = (tab: "cards" | "buyHouse" | "calculator" | "chat" | "contact") => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      setChatError(err.message || "網路傳輸異常，請稍後再試。如果您急於找房，可以直接添加 Linus 的 Line: linus0922 進行即時諮詢！");
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
    
    if (buyCategory === "terms") {
      // Show terms only
    } else if (buyCategory === "qa") {
      matchedDrawing = [];
      matchedFee = [];
    } else if (buyCategory !== "all") {
      matchedDrawing = [];
      matchedFee = [];
      matchedQA = [];
    }
    
    if (q) {
      if (buyCategory === "all" || buyCategory === "terms") {
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

      {/* Top Banner Accent Line */}
      <div className="h-1.5 bg-[#0F8F6D] w-full" id="top-accent-line" />

      {/* Elegant Linear Header */}
      <header className={`sticky top-0 z-40 border-b border-[#DDE3DF] mini-header ${scrolled ? "compact shadow-sm" : "bg-white"}`} id="app-header">
        <div className={`max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-6 transition-all duration-300 ${scrolled ? "py-2" : "py-4 md:py-6"}`}>
          <div className="flex items-start gap-3 md:gap-4 w-full md:w-auto">
            {/* Hanko Stamp Style Logo */}
            <div className={`border-2 border-[#0F8F6D] text-[#0F8F6D] font-bold text-center leading-tight tracking-widest bg-white select-none shrink-0 transition-all duration-300 ${scrolled ? "px-1.5 py-1 text-xs" : "px-1.5 py-2 text-sm md:px-2 md:py-3 md:text-lg"}`} id="hanko-logo">
              東京
              <br />
              日和
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-[#1A2A22] text-[#F5F8F6] px-1.5 py-0.5 font-sans uppercase tracking-widest select-none">Linus 住好日</span>
                <span className="text-xs border border-[#0F8F6D] text-[#0F8F6D] px-1.5 py-0.5 select-none font-sans">東京2026新版</span>
              </div>
              <h1 className={`font-bold tracking-tight text-[#1A2A22] transition-all duration-300 ${scrolled ? "text-lg md:text-xl mt-0.5" : "text-xl md:text-3xl mt-1"}`}>日本租房買賣知識大補帖</h1>
              <p className={`text-xs text-zinc-600 mt-1 font-sans transition-all duration-300 ${scrolled ? "hidden md:block opacity-75" : "block md:text-sm"}`}>
                第一次來日本者的最佳指南 ╳ 實務預算精算 ╳ AI 智能問答
              </p>
            </div>
          </div>

          {/* Quick Line contact top bar */}
          <div className={`items-center gap-4 border-l-0 md:border-l border-zinc-200 md:pl-6 py-1 w-full md:w-auto transition-all duration-300 ${scrolled ? "hidden md:flex" : "flex flex-row justify-between md:flex-col md:items-end gap-1.5 md:text-right font-sans"}`}>
            {!scrolled && <div className="text-xs text-zinc-500 uppercase tracking-wider hidden md:block">Linus 線上諮詢</div>}
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={`https://line.me/ti/p/~${linusContact.lineId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#06C755] hover:bg-[#05A847] text-white px-3 py-1 text-xs font-bold cursor-pointer transition-colors"
                id="add-line-btn-top"
              >
                ＋ 加 LINE 好友
              </a>
              <span className="text-xs md:text-sm font-semibold bg-[#f4f2ee] px-2.5 py-1 text-zinc-800 border border-zinc-300">{linusContact.lineId}</span>
              <button
                onClick={handleCopyLine}
                className="bg-[#0F8F6D] hover:bg-[#0A6D52] text-white px-3 py-1 text-xs font-medium cursor-pointer transition-colors"
                id="copy-line-btn-top"
              >
                {copiedLine ? "已複製" : "複製 ID"}
              </button>
            </div>
          </div>
        </div>

        {/* Elegant Navigation Menu with sharp borders */}
        <nav className="border-t border-[#1A2A22] bg-[#FFFFFF] relative overflow-visible" id="primary-nav">
          <div className="max-w-6xl mx-auto px-4 overflow-visible">
            <div className="grid grid-cols-5 text-center overflow-visible">
              <button 
                onClick={() => handleTabChange("cards")}
                className={`py-3 md:py-4 px-0.5 text-[11px] md:text-sm font-medium md:tracking-wide border-r border-[#1A2A22] first:border-l hover:bg-[#F5F8F6] transition-colors relative cursor-pointer group overflow-visible ${
                  activeTab === "cards" ? "bg-white font-bold text-[#0F8F6D]" : "text-zinc-700"
                }`}
                id="nav-tab-cards"
              >
                <div className="flex flex-col md:flex-row items-center justify-center gap-1.5">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>租屋知識</span>
                </div>
                {/* Tooltip */}
                <span className="absolute bottom-[-24px] left-1/2 transform -translate-x-1/2 translate-y-[-4px] opacity-0 group-hover:opacity-100 group-hover:translate-y-0 bg-[#1A2A22] text-[#F5F8F6] text-[8px] font-sans px-1.5 py-0.5 rounded transition-all duration-200 pointer-events-none select-none z-30 uppercase shadow-sm">
                  CARDS
                </span>
                {activeTab === "cards" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0F8F6D]" />}
              </button>

              <button 
                onClick={() => handleTabChange("buyHouse")}
                className={`py-3 md:py-4 px-0.5 text-[11px] md:text-sm font-medium md:tracking-wide border-r border-[#1A2A22] hover:bg-[#F5F8F6] transition-colors relative cursor-pointer group overflow-visible ${
                  activeTab === "buyHouse" ? "bg-white font-bold text-[#0F8F6D]" : "text-zinc-700"
                }`}
                id="nav-tab-buyhouse"
              >
                <div className="flex flex-col md:flex-row items-center justify-center gap-1.5">
                  <Building className="w-4 h-4 shrink-0" />
                  <span>買房知識</span>
                </div>
                {/* Tooltip */}
                <span className="absolute bottom-[-24px] left-1/2 transform -translate-x-1/2 translate-y-[-4px] opacity-0 group-hover:opacity-100 group-hover:translate-y-0 bg-[#1A2A22] text-[#F5F8F6] text-[8px] font-sans px-1.5 py-0.5 rounded transition-all duration-200 pointer-events-none select-none z-30 uppercase shadow-sm">
                  BUY
                </span>
                {activeTab === "buyHouse" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0F8F6D]" />}
              </button>

              <button 
                onClick={() => handleTabChange("calculator")}
                className={`py-3 md:py-4 px-0.5 text-[11px] md:text-sm font-medium md:tracking-wide border-r border-[#1A2A22] hover:bg-[#F5F8F6] transition-colors relative cursor-pointer group overflow-visible ${
                  activeTab === "calculator" ? "bg-white font-bold text-[#0F8F6D]" : "text-zinc-700"
                }`}
                id="nav-tab-calc"
              >
                <div className="flex flex-col md:flex-row items-center justify-center gap-1.5">
                  <Calculator className="w-4 h-4 shrink-0" />
                  <span>預算加減算</span>
                </div>
                {/* Tooltip */}
                <span className="absolute bottom-[-24px] left-1/2 transform -translate-x-1/2 translate-y-[-4px] opacity-0 group-hover:opacity-100 group-hover:translate-y-0 bg-[#1A2A22] text-[#F5F8F6] text-[8px] font-sans px-1.5 py-0.5 rounded transition-all duration-200 pointer-events-none select-none z-30 uppercase shadow-sm">
                  CALC
                </span>
                {activeTab === "calculator" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0F8F6D]" />}
              </button>

              <button 
                onClick={() => handleTabChange("chat")}
                className={`py-3 md:py-4 px-0.5 text-[11px] md:text-sm font-medium md:tracking-wide border-r border-[#1A2A22] hover:bg-[#F5F8F6] transition-colors relative cursor-pointer group overflow-visible ${
                  activeTab === "chat" ? "bg-white font-bold text-[#0F8F6D]" : "text-zinc-700"
                }`}
                id="nav-tab-chat"
              >
                <div className="flex flex-col md:flex-row items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4 shrink-0 text-[#0F8F6D]" />
                  <span>AI 智能問答</span>
                </div>
                {/* Tooltip */}
                <span className="absolute bottom-[-24px] left-1/2 transform -translate-x-1/2 translate-y-[-4px] opacity-0 group-hover:opacity-100 group-hover:translate-y-0 bg-[#1A2A22] text-[#F5F8F6] text-[8px] font-sans px-1.5 py-0.5 rounded transition-all duration-200 pointer-events-none select-none z-30 uppercase shadow-sm">
                  CHAT
                </span>
                {activeTab === "chat" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0F8F6D]" />}
              </button>

              <button 
                onClick={() => handleTabChange("contact")}
                className={`py-3 md:py-4 px-0.5 text-[11px] md:text-sm font-medium md:tracking-wide border-r border-[#1A2A22] hover:bg-[#F5F8F6] transition-colors relative cursor-pointer group overflow-visible ${
                  activeTab === "contact" ? "bg-white font-bold text-[#0F8F6D]" : "text-zinc-700"
                }`}
                id="nav-tab-contact"
              >
                <div className="flex flex-col md:flex-row items-center justify-center gap-1.5">
                  <Smile className="w-4 h-4 shrink-0" />
                  <span>聯絡 Linus</span>
                </div>
                {/* Tooltip */}
                <span className="absolute bottom-[-24px] left-1/2 transform -translate-x-1/2 translate-y-[-4px] opacity-0 group-hover:opacity-100 group-hover:translate-y-0 bg-[#1A2A22] text-[#F5F8F6] text-[8px] font-sans px-1.5 py-0.5 rounded transition-all duration-200 pointer-events-none select-none z-30 uppercase shadow-sm">
                  CONTACT
                </span>
                {activeTab === "contact" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0F8F6D]" />}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 py-8" id="main-content">
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
      <footer className="border-t border-[#1A2A22] bg-white mt-12 py-12 px-4" id="app-footer">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <div className="space-y-1">
              <strong className="text-sm text-[#1A2A22]">LINUS住好日 ╳ 日本租房買賣知識大補帖</strong>
              <p className="text-xs text-zinc-500 font-sans">
                版權所有 © 2026 LINUS Nice Day Japan All Rights Reserved. 株式会社世嘉 Seika (東京都知事免許第111940号)
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
              以上網站及圖卡所有內容均為 <strong>株式会社世嘉 Seika Linus Chang</strong> 個人實務撰寫，未經授權許可請勿以任何形式轉載、拷貝或做其他商業用途。上述資訊會不定期根據日本國土交通省法規、東京租賃紛爭防止條例與保證會社最新制度更新。如有刊登、翻譯錯誤或有圖片授權疑慮，請致信聯絡至 r352410@gmail.com 將盡速於一個工作日內處理。
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
