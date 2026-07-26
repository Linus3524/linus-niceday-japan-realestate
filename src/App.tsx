import { useState, useEffect, FormEvent } from "react";
import {
  ExternalLink, ArrowUp, MousePointerClick
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
import { getRentStaticMatches, hasMinimumKnowledgeSearchLength } from "./data/rentStaticSearchData";
import { BuyGuideTab } from "./components/BuyGuideTab";
import { CalculatorTab } from "./components/CalculatorTab";
import { ChatTab } from "./components/ChatTab";
import { ContactTab } from "./components/ContactTab";
import { TermModal } from "./components/TermModal";
import { ThreadsCarousel } from "./components/ThreadsCarousel";
import HeaderInfoBar from "./components/HeaderInfoBar";

// 首圖四組場景，每約 15 秒輪換：背景淡入淡出、人物浮現切換。
const HERO_SETS = [
  {
    key: "orange",
    bg: "/hero-bg.webp",
    character: "/hero-character.webp",
    slogan: ["「東京の光と歩む、", "自分らしい心地よい日常。」"],
  },
  {
    key: "lemon",
    bg: "/hero-fuji.webp",
    character: "/hero-character-lemon.webp",
    slogan: ["「澄みわたる空の下、", "心地よい風と生きる。」"],
  },
  {
    key: "apple",
    bg: "/hero-showa.webp",
    character: "/hero-character-apple.webp",
    slogan: ["「愛おしい時間と、", "緑あふれる住まい。」"],
  },
  {
    key: "grape",
    bg: "/hero-roppongi.webp",
    character: "/hero-character-grape.webp",
    slogan: ["「都市の余韻に浸り、", "上質な時間を紡ぐ。」"],
  },
];
const HERO_ROTATE_MS = 15000;
const MOBILE_DOCK_BUTTON = new URL("../assets/hero/UI按鈕.png", import.meta.url).href;
type AppTab = "cards" | "buyHouse" | "calculator" | "chat" | "contact";

function MobileSceneHero({ heroSet, booting }: { heroSet: number; booting: boolean }) {
  return (
    <section className={`mobile-scene-shell mobile-scene--${HERO_SETS[heroSet].key}`} aria-label="LINUS 住好日手機版主視覺">
      <div className={`mobile-scene-stage ${booting ? "is-booting" : ""}`} aria-live="polite">
        <div className="mobile-scene-backgrounds" aria-hidden="true">
          {HERO_SETS.map((set, index) => (
            <img
              key={set.key}
              src={set.bg}
              alt=""
              className={`mobile-scene-bg ${index === heroSet ? "is-active" : ""}`}
              fetchPriority={index === 0 ? "high" : undefined}
              loading={index === 0 ? undefined : "lazy"}
              decoding="async"
            />
          ))}
        </div>
        <div className="mobile-scene-characters" aria-hidden="true">
          {HERO_SETS.map((set, index) => (
            <img
              key={set.key}
              src={set.character}
              alt=""
              className={`mobile-scene-character mobile-scene-character--${set.key} ${index === heroSet ? "is-active" : ""}`}
              loading={index === 0 ? undefined : "lazy"}
              decoding="async"
            />
          ))}
        </div>
        {HERO_SETS.map((set, index) => (
          <p
            key={set.key}
            className={`mobile-scene-slogan mobile-scene-slogan--${set.key} ${index === heroSet ? "is-active" : ""}`}
          >
            <span>{set.slogan[0]}</span>
            <br />
            <span className="mobile-scene-slogan-second">　　{set.slogan[1]}</span>
          </p>
        ))}
        <HeaderInfoBar variant="hero" />
        <div className="mobile-scene-count" aria-hidden="true">
          {HERO_SETS.map((set, index) => (
            <span key={set.key} className={index === heroSet ? "is-active" : ""} />
          ))}
        </div>
      </div>
    </section>
  );
}

function MobileDock({
  activeTab,
  isHome,
  onTabChange,
  onContact,
  onThreads,
}: {
  activeTab: AppTab;
  isHome: boolean;
  onTabChange: (tab: AppTab) => void;
  onContact: () => void;
  onThreads: () => void;
}) {
  const items: Array<{ id: AppTab; label: string; number: string }> = [
    { id: "cards", label: "租屋指南", number: "01" },
    { id: "buyHouse", label: "買房置產", number: "02" },
    { id: "calculator", label: "費用試算", number: "03" },
    { id: "chat", label: "AI 顧問", number: "04" },
  ];

  return (
    <>
      {/* 「精選 ⟨Threads⟩ 文」——台灣讀者看到 Threads 標誌就知道是脆文 */}
      <button type="button" className="mobile-threads-shortcut" onClick={onThreads} aria-label="開啟精選 Threads 貼文">
        <span>精選</span>
        <svg viewBox="0 0 976.98 1082" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
          <path
            fill="currentColor"
            d="M770.35,500.35c-1.35-156.85-86.39-251.37-230.02-251.37-95.87,0-176.5,43.36-218.85,112.47l92.82,64.71c24.05-37.94,57.25-69.45,118.23-69.45,68.77,0,104.34,38.28,114.5,109.42-33.2-5.08-66.4-7.79-100.61-7.79-185.65,0-273.05,84.02-273.05,195.13s87.4,179.55,216.14,179.55c141.27,0,225.62-95.19,260.18-213.09,35.91,16.26,60.64,54.2,60.64,111.12,0,152.45-175.82,235.45-324.88,235.45-219.86,0-363.5-144.32-363.5-379.08,0-287.62,190.05-471.91,445.48-471.91,171.42,0,256.11,75.21,313.7,176.16l94.86-66.4C913.31,94.5,773.4,1,563.36,1,228.65,1,1,238.48,1,583.01c0,315.06,222.91,497.99,488.51,497.99,219.52,0,441.42-128.05,441.42-347.24,0-114.5-65.72-190.39-160.58-233.41h0ZM485.44,718.85c-48.44,0-91.13-23.04-91.13-65.38,0-66.74,81.98-87.06,162.27-87.06,30.49,0,60.3,2.03,86.72,7.79-18.97,86.72-75.21,144.66-157.87,144.66h0Z"
          />
        </svg>
        <span>文</span>
      </button>
      <nav className="mobile-dock" aria-label="手機版主要導覽">
        <div className="mobile-dock-side">
          {items.slice(0, 2).map((item) => (
            <button
              key={item.id}
              type="button"
              className={!isHome && activeTab === item.id ? "is-active" : ""}
              onClick={() => onTabChange(item.id)}
            >
              <span>{item.number}</span>
              <strong>{item.label}</strong>
            </button>
          ))}
        </div>
        <button type="button" className="mobile-dock-logo" onClick={onContact} aria-label="前往聯絡諮詢">
          <img src={MOBILE_DOCK_BUTTON} alt="" />
        </button>
        <div className="mobile-dock-side">
          {items.slice(2).map((item) => (
            <button
              key={item.id}
              type="button"
              className={!isHome && activeTab === item.id ? "is-active" : ""}
              onClick={() => onTabChange(item.id)}
            >
              <span>{item.number}</span>
              <strong>{item.label}</strong>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}

export default function App() {
  // Navigation tabs: 'cards' (租屋知識圖卡), 'buyHouse' (買房知識大補帖), 'calculator' (預算估算), 'chat' (AI問答), 'contact' (聯絡Linus)
  const [activeTab, setActiveTab] = useState<AppTab>("cards");
  const [isMobileHome, setIsMobileHome] = useState(true);
  const [isThreadsPage, setIsThreadsPage] = useState(() => window.location.hash === "#threads");
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  
  // UI Scroll States for Japanese Editorial Specs
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showToTop, setShowToTop] = useState(false);

  // 首圖場景輪播索引
  const [heroSet, setHeroSet] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => {
      setHeroSet(prev => (prev + 1) % HERO_SETS.length);
    }, HERO_ROTATE_MS);
    return () => window.clearInterval(id);
  }, []);

  // 剛載入的第一張場景直接顯示，不跑 1.2 秒的淡入。
  // 背景圖其實在 30ms 就下載完了，慢的是我們自己的淡入動畫，
  // 首屏會看起來「文字先出現、背景才慢慢浮上來」。
  // 之後輪播切換仍然保留淡入（下一幀就把 boot 旗標關掉，
  // 此時沒有任何屬性變化，所以不會補跑一次動畫）。
  const [heroBooting, setHeroBooting] = useState(true);
  useEffect(() => {
    const id = requestAnimationFrame(() => setHeroBooting(false));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/visitor-count", { credentials: "same-origin" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load visitor count.");
        return response.json();
      })
      .then((data) => {
        if (!cancelled && typeof data?.count === "number") setVisitorCount(data.count);
      })
      .catch(() => {
        if (!cancelled) setVisitorCount(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      setIsThreadsPage(window.location.hash === "#threads");
      window.scrollTo({ top: 0, behavior: "auto" });
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

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
  const handleTabChange = (tab: AppTab) => {
    setIsMobileHome(false);
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
  const isKnowledgeSearchActive = hasMinimumKnowledgeSearchLength(searchQuery);

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
    if (isKnowledgeSearchActive) {
      matchedInitialFees = matchedInitialFees.filter(
        f => f.name.toLowerCase().includes(normalizedQuery) || 
             (f.jpName && f.jpName.toLowerCase().includes(normalizedQuery)) ||
             f.description.toLowerCase().includes(normalizedQuery) ||
             (f.warning && f.warning.toLowerCase().includes(normalizedQuery)) ||
             (f.keyPoints && f.keyPoints.some(point => point.toLowerCase().includes(normalizedQuery)))
      );
      matchedSpecialTerms = matchedSpecialTerms.filter(
        t => t.name.toLowerCase().includes(normalizedQuery) ||
             (t.jpName && t.jpName.toLowerCase().includes(normalizedQuery)) ||
             t.description.toLowerCase().includes(normalizedQuery) ||
             (t.details && t.details.some(d => d.toLowerCase().includes(normalizedQuery)))
      );
      matchedSteps = matchedSteps.filter(
        s => s.name.toLowerCase().includes(normalizedQuery) ||
             s.description.toLowerCase().includes(normalizedQuery) ||
             s.duration.toLowerCase().includes(normalizedQuery) ||
             (s.details && s.details.some(detail => detail.toLowerCase().includes(normalizedQuery))) ||
             (s.searchKeywords && s.searchKeywords.some(keyword => keyword.toLowerCase().includes(normalizedQuery)))
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
  const staticKnowledgeMatches = getRentStaticMatches(searchQuery, kbCategory);
  const hasNoResults = 
    isKnowledgeSearchActive &&
    filtered.fees.length === 0 && 
    filtered.terms.length === 0 && 
    filtered.steps.length === 0 && 
    filtered.qa.length === 0 &&
    staticKnowledgeMatches.length === 0;

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
  const visitorDisplay = visitorCount === null
    ? "—"
    : visitorCount.toLocaleString("en-US", { minimumIntegerDigits: 6, useGrouping: true });

  const openThreadsPage = () => {
    window.location.hash = "threads";
  };

  const returnHome = () => {
    if (window.location.hash) {
      window.history.pushState("", document.title, window.location.pathname + window.location.search);
    }
    setIsThreadsPage(false);
    setIsMobileHome(true);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const returnMobileHome = () => {
    setIsMobileHome(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isThreadsPage) {
    return (
      <div className="threads-mobile-page min-h-screen bg-[#F5F8F6]">
        <header className="threads-mobile-header">
          <button type="button" onClick={returnHome} aria-label="回到首頁">
            <span aria-hidden="true">←</span>
            回首頁
          </button>
          <img src="/logo-text.svg" alt="LINUS 住好日" />
          <span>精選 THREADS</span>
        </header>
        <ThreadsCarousel pageMode />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-serif select-text ${isMobileHome ? "mobile-home-active" : "mobile-subpage-active"}`}>
      {/* Reading Progress Bar */}
      <div 
        className="fixed top-0 left-0 right-0 h-[3px] z-[100] transition-all duration-75"
        style={{
          background: 'linear-gradient(90deg, var(--color-primary, #00a174), var(--color-orange, #E94E2B))',
          width: `${scrollProgress}%`
        }}
      />

      <MobileSceneHero heroSet={heroSet} booting={heroBooting} />

      {/* Top sticky header */}
      <header className="site-header sticky top-0 z-50 border-b border-[#DDE3DF] bg-white py-3 px-6 select-none" id="app-header">
        <div className="max-w-[1280px] mx-auto flex justify-between items-center">
          {/* Left: SVG logo */}
          <button type="button" className="site-home-button flex items-center gap-3" onClick={returnMobileHome} aria-label="回到首頁">
            <img 
              src="/logo-text.svg" 
              alt="LINUS 住好日" 
              className="h-6 w-auto select-none"
            />
            <span className="inline-block shrink-0 text-[9px] border border-[#00a174] bg-[#e6f6f1] text-[#00a174] px-1.5 py-0.5 font-sans font-bold tracking-wider select-none">日本租屋買房知識大補帖</span>
          </button>
          {/* Right: 令和日期時間 & 東京天氣 */}
          <HeaderInfoBar />
        </div>
      </header>

      {/* Hero Banner Section */}
      <section className={`hero-banner hero-scene--${HERO_SETS[heroSet].key} bg-white pt-12 pb-12 lg:pb-28 border-b border-[#DDE3DF] relative overflow-hidden`} id="hero-banner">
        {/* 背景與人物圖層：純裝飾，不進無障礙樹，也不攔截點擊。
            三組場景堆疊，靠 is-active 切換透明度做淡入淡出／浮現。 */}
        <div className={`hero-media ${heroBooting ? "is-booting" : ""}`} aria-hidden="true">
          <div className="hero-bg-layer">
            {HERO_SETS.map((set, i) => (
              <img
                key={set.key}
                src={set.bg}
                alt=""
                className={`hero-bg ${i === heroSet ? "is-active" : ""}`}
                fetchPriority={i === 0 ? "high" : undefined}
                loading={i === 0 ? undefined : "lazy"}
                decoding="async"
              />
            ))}
          </div>
          {/* 白色漸層必須夾在背景與人物之間：只淡化背景，人物維持原色 */}
          <div className="hero-veil" />
          <div className="hero-char-layer">
            {HERO_SETS.map((set, i) => (
              <img
                key={set.key}
                src={set.character}
                alt=""
                className={`hero-character hero-char--${set.key} ${i === heroSet ? "is-active" : ""}`}
                loading={i === 0 ? undefined : "lazy"}
                decoding="async"
              />
            ))}
          </div>
        </div>

        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left side: Heading */}
          <div className="lg:col-span-8 space-y-4 pr-0 lg:pr-10">
            <div className="hero-eyebrow flex items-center gap-2 text-[11px] font-jost font-semibold tracking-wider uppercase select-none">
              <span className="hero-eyebrow-dash w-6 h-[1px] inline-block"></span>
              <span>HAVE A NICE DAY IN JAPAN</span>
            </div>

            <h1 className="font-serif font-extrabold text-4xl md:text-5xl leading-tight text-[#1A2A22] mt-2">
              <span className="hero-title-first-line">
                日本での<span className="hero-marker relative inline-block px-1 z-10 after:content-[''] after:absolute after:left-0 after:bottom-1 after:w-full after:h-3.5 after:-z-10">暮らしを</span>、
              </span>
              <br />
              <span className="hero-accent-text">好日へ。</span>
            </h1>

            <h2 className="font-serif text-lg md:text-xl text-[#3F5147] tracking-wide pt-4 font-bold leading-normal">
              台灣人仲介帶你看懂日本租屋、買房與置產。
            </h2>

            {/* 限制寬度讓長句提早換行，避免文字延伸過去壓到人物 */}
            <div className="max-w-[30rem] text-xs md:text-sm text-zinc-500 font-sans tracking-wide leading-relaxed space-y-1 mt-4">
              <p>我是 Linus，在東京從事不動產仲介，也是一名來自台灣的平面設計師。</p>
              <p>分享日本租屋、買房、貸款規劃與在日生活的經驗實務，並提供 24 小時 AI 顧問與線上諮詢。</p>
              <p>從找房到安居，希望成為你在日本最值得信賴的指南。</p>
              <p>Linus 住好日，一起在日本住好日！</p>
            </div>

            {/* w-fit 讓分隔線寬度自動等於下方 SINCE…TOKYO 這一行，桌機與手機都會自動吻合 */}
            <div className="w-fit">
              <div className="border-t border-[#DDE3DF] my-6"></div>

              <div className="flex items-center gap-x-2 sm:gap-x-3 flex-wrap gap-y-1 text-[9px] sm:text-[10px] text-zinc-400 font-jost tracking-wider uppercase font-semibold">
                <span>SINCE 2024</span>
                <span>•</span>
                <span className="hidden min-[380px]:inline">REAL ESTATE GUIDE</span>
                <span className="hidden min-[380px]:inline">•</span>
                <span>TOKYO</span>
                <span>•</span>
                <span className="hero-visitors inline-flex items-center gap-1.5 whitespace-nowrap">
                  <span>VISITORS</span>
                  <span className="font-mono tracking-[0.12em]" aria-live="polite">{visitorDisplay}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right side: Contact Card */}
          <div className="lg:col-span-4 mx-auto w-full bg-white border border-[#DDE3DF] p-5 hover:border-[#00a174] hover:shadow-colored-soft transition-all duration-300 grid grid-cols-[128px_minmax(0,1fr)] gap-4 items-center lg:w-fit lg:ml-auto lg:grid-cols-[auto_1fr] lg:gap-3 lg:py-4 lg:pr-4 lg:pl-2.5">
            {/* Left: Logo alone */}
            <div className="shrink-0">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="h-32 w-32 object-contain lg:h-[110px] lg:w-[110px]"
              />
            </div>
            
            {/* Right: Text & Actions */}
            <div className="w-full space-y-2.5">
              <div>
                <span className="block text-[9px] text-[#00a174] font-jost tracking-wider uppercase font-semibold">Contact Linus</span>
                <span className="block text-xs font-bold text-[#1A2A22] font-serif">立即聯絡線上諮詢</span>
              </div>

              <div className="w-full space-y-1.5 lg:w-[160px]">
                <a
                  href={`https://line.me/ti/p/~${linusContact.lineId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#00a174] hover:bg-[#007d5a] text-white py-2 text-xs font-bold font-sans flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-none text-center"
                  id="add-line-btn-hero"
                >
                  點我加 LINE 好友
                  <MousePointerClick className="h-4 w-4 shrink-0" aria-hidden="true" />
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
                    className="bg-[#F5F8F6] border border-l-0 border-[#DDE3DF] hover:bg-[#e6f6f1] text-zinc-700 text-[10px] px-2.5 py-1 cursor-pointer font-bold transition-colors select-none shrink-0"
                  >
                    {copiedLine ? "已複製" : "複製"}
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Featured Threads posts carousel */}
      <div className="desktop-threads-section">
        <ThreadsCarousel />
      </div>

      {/* Elegant Sticky Navigation Tabs Bar (Blog-styled) */}
      <nav className="sticky top-[53px] z-40 select-none" id="primary-nav">
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
                className={`primary-nav-tab relative py-2 px-3 sm:px-4 md:px-5.5 flex items-center gap-1 sm:gap-1.5 md:gap-2 font-serif text-[13px] sm:text-sm md:text-[15px] tracking-[0.08em] sm:tracking-[0.14em] whitespace-nowrap cursor-pointer transition-colors duration-200 select-none group border-none bg-transparent shrink-0 ${
                  activeTab === tab.id ? "is-active text-[#007d5a]" : "text-[#1a2a22] hover:text-[#007d5a]"
                }`}
                id={`nav-tab-${tab.id.toLowerCase()}`}
              >
                <span className="primary-nav-num font-jost text-[8px] sm:text-[9px] md:text-[10px] group-hover:text-[#00a174] transition-colors">{String(idx + 1).padStart(2, '0')}</span>
                <span>{tab.label}</span>
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
              staticMatches={staticKnowledgeMatches}
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
      <footer className="mt-12 border-t border-[#1A2A22] bg-white py-9" id="app-footer">
        <div className="mx-auto max-w-6xl space-y-5 px-4">
          <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
            <div>
              <strong className="font-serif text-sm text-[#1A2A22]">LINUS 住好日</strong>
              <p className="mt-0.5 font-sans text-[11px] text-zinc-500">
                日本租屋・買房・生活指南
              </p>
            </div>
            
            <div className="flex items-center gap-3 font-sans text-xs">
              <a href="https://www.threads.com/@linus3524" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-zinc-600 hover:text-[#00a174]">
                <span>Threads</span> <ExternalLink className="h-3 w-3" />
              </a>
              <span className="text-zinc-300">|</span>
              <a href={`mailto:${linusContact.email}`} className="text-zinc-600 hover:text-[#00a174]">
                聯絡信箱
              </a>
            </div>
          </div>

          <div className="grid border border-[#DDE3DF] bg-[#F5F8F6] font-sans text-[10px] leading-relaxed text-zinc-500 md:grid-cols-2">
            <div className="p-4 md:border-r md:border-[#DDE3DF]">
              <strong className="mb-1 block font-jost text-[9px] tracking-[0.12em] text-[#007d5a]">INFORMATION</strong>
              本站內容僅供一般資訊與預算參考，不構成法律、稅務、金融、簽證或投資建議；來訪統計僅使用匿名裝置識別碼。
            </div>
            <div className="border-t border-[#DDE3DF] p-4 md:border-t-0">
              <strong className="mb-1 block font-jost text-[9px] tracking-[0.12em] text-[#007d5a]">ARTWORK COPYRIGHT</strong>
              人物、動物、場景及品牌插圖皆為 Linus 原創。未經書面授權，禁止重製、修改、轉載、商用或用於 AI 訓練。
            </div>
          </div>

          <p className="text-center font-jost text-[9px] tracking-[0.06em] text-zinc-400 md:text-left">
            © 2026 CHANG CHIN WEI · @linus3524 · ALL RIGHTS RESERVED
          </p>
        </div>
      </footer>

      {showToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 w-10 h-10 rounded-full bg-[#00a174] hover:bg-[#007d5a] text-white flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300 transform scale-100 opacity-100 hover:scale-110 z-50 cursor-pointer"
          aria-label="Back to Top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
      <MobileDock
        activeTab={activeTab}
        isHome={isMobileHome}
        onTabChange={handleTabChange}
        onContact={() => handleTabChange("contact")}
        onThreads={openThreadsPage}
      />
    </div>
  );
}
