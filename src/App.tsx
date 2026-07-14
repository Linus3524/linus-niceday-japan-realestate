import { useState, useEffect, FormEvent } from "react";
import { 
  Search, Send, Copy, Check, ExternalLink, Calculator, 
  Calendar, MapPin, Info, Phone, ArrowRight, Clock, 
  Sparkles, Smile, FileText, ChevronRight, X, HelpCircle,
  Instagram, Facebook, AtSign, Building, Landmark, Percent, Map, ArrowUp, HelpCircle as QIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  initialFees, specialTerms, processSteps, rentRates, 
  budgetModifiers, otherQA, linusContact, QAItem, InitialFeeItem 
} from "./data/rentGuideData";
import { districtStations } from "./data/stationData";
import {
  buyHouseDrawingTerms, buyHouseFeeTerms, buyHouseCashSteps, buyHouseLoanSteps,
  signingDocuments, taiwaneseBanks, japaneseBanks, minpakuRules, ryokanRules, buyHouseQAs,
  BuyHouseTermItem, BuyHouseQAItem, buyBudgetModifiers, BuyBudgetModifier
} from "./data/buyHouseData";
import { RentMap } from "./components/RentMap";

const rentConflictGroups = [
  [0, 1, 2], // Washbasin & Toilet combos
  [3, 4, 22], // Room sizes (Large 1K/1R vs Super Compact 1R/1K)
  [5, 6],    // 1LDK sizes
  [7, 8],    // 2LDK sizes
  [10, 11, 18, 19], // Building Age
  [12, 13],  // Station size
  [14, 16, 17], // Walk distance
  [9, 20],   // Elevator vs 4F+ without elevator
  [20, 21],  // 4F+ without elevator vs 1st floor
  [9, 23],   // Auto-lock elevator building vs Wood construction
  [10, 24],  // 5 years age vs Japanese-style room (Japanese-style room is rare/impossible in brand new buildings)
  [11, 24],  // 5~10 years age vs Japanese-style room
  [23, 25],  // Wood construction vs Tower Mansion
  [20, 25],  // 4F+ without elevator vs Tower Mansion
];

const buyConflictGroups = [
  [0, 1, 2, 3], // Condition/Renovation
  [4, 5],       // Occupancy
  [8, 9],       // Building structure (Tower vs Apartment)
  [10, 11],     // Distance (Walk <5m vs >15m)
  [0, 6],       // New build vs Old earthquake standard
  [6, 8],       // Old earthquake standard vs Tower mansion
  [0, 6, 12, 13, 14, 15, 16, 17, 18], // Building Age & New build & Old earthquake standard mutual exclusion
];

const hasTowerMansionSupport = (district: string) => {
  if (["橫濱市西區", "橫濱市中區", "橫濱市港北區", "橫濱市神奈川區", "川崎市中原區"].includes(district)) return true;
  if (["埼玉市大宮區", "埼玉市浦和區"].includes(district)) return true;
  if (["浦安市", "市川市", "船橋市"].includes(district)) return true;
  if (["大阪市北區", "大阪市中央區", "大阪市西區", "大阪市浪速區", "大阪市天王寺區", "大阪市福島區", "大阪市淀川區"].includes(district)) return true;
  
  // Exclude Tokyo Tama cities, but allow Tokyo 23 Wards
  const isTama = ["武藏野市", "三鷹市", "立川市", "八王子市", "日野市", "府中市", "調布市", "町田市", "西東京市", "小平市", "多摩市", "狛江市"].includes(district);
  if (isTama) return false;
  
  // Since we checked other outer prefectures and Tama, any other district with Tokyo region has tower mansions
  const tokyo23Wards = [
    "千代田區", "港區", "中央區", "澀谷區", "目黑區", "新宿區", "台東區", "江東區", "品川區", 
    "文京區", "墨田區", "大田區", "世田谷區", "中野區", "豐島區", "北區", "荒川區", "杉並區", 
    "板橋區", "練馬區", "足立區", "葛飾區", "江戶川區"
  ];
  return tokyo23Wards.includes(district);
};

const getDynamicBuyModifierMultiplier = (index: number, district: string) => {
  const dData = rentRates.find(d => d.district === district) || rentRates[0];
  const isTama = ["武藏野市", "三鷹市", "立川市", "八王子市", "日野市", "府中市", "調布市", "町田市", "西東京市", "小平市", "多摩市", "狛江市"].includes(dData.district);
  const isTokyo23 = dData.region === "東京都" && !isTama;
  const region = dData.region;

  // Default fallback multiplier from buyBudgetModifiers
  const baseMod = buyBudgetModifiers[index];
  if (!baseMod) return 0;
  const base = baseMod.multiplier;

  switch (index) {
    case 0: // 全新完工成屋 (新築/未入居)
      if (isTokyo23) return 0.45;
      if (region === "大阪") return 0.35;
      if (region === "東京都" || region === "神奈川") return 0.30;
      return 0.25; // 埼玉、千葉
    case 1: // 全面現代化翻新 (リノベーション済み)
      if (isTokyo23) return 0.22;
      if (region === "神奈川" || region === "大阪") return 0.20;
      return 0.15; // 埼玉、千葉、多摩
    case 2: // 局部基礎翻修 (リフォーム済み)
      if (isTokyo23) return 0.10;
      if (region === "神奈川" || region === "大阪") return 0.08;
      return 0.06;
    case 3: // 現況不翻修直接過戶 (現状渡し)
      if (isTokyo23) return -0.12;
      if (region === "神奈川" || region === "大阪") return -0.15;
      return -0.20;
    case 4: // 空室 (即時點交，自住首選)
      if (isTokyo23) return 0.10;
      if (region === "神奈川" || region === "大阪") return 0.10;
      if (isTama) return 0.06;
      return 0.08; // 埼玉、千葉
    case 5: // 帶租約出售 (オーナーチェンジ - 投資房)
      if (isTokyo23) return -0.08;
      if (region === "神奈川" || region === "大阪") return -0.10;
      return -0.14; // 埼玉、千葉、多摩
    case 6: // 舊耐震基準建物 (1981年5月以前建)
      if (isTokyo23) return -0.20; // 土地持分高，折價稍小
      if (region === "神奈川" || region === "大阪") return -0.25;
      return -0.32; // 埼玉、千葉、多摩折價大
    case 7: // 借地權 (非所有權 - 僅擁有地上物權利)
      if (isTokyo23) return -0.28;
      if (region === "神奈川" || region === "大阪") return -0.32;
      return -0.38;
    case 8: // 高級塔樓公寓 (タワーマンション)
      if (isTokyo23) return 0.35;
      if (region === "大阪") return 0.25;
      if (region === "神奈川") return 0.20;
      if (region === "埼玉" || region === "千葉") return 0.15;
      return 0.25;
    case 9: // 低層木造/輕鋼構公寓 (アパート)
      if (isTokyo23) return -0.15;
      if (region === "神奈川" || region === "大阪") return -0.20;
      return -0.26;
    case 10: // 步行 5 分鐘內超精華地段
      if (isTokyo23 || region === "大阪") return 0.15;
      if (region === "神奈川") return 0.12;
      return 0.10; // 埼玉、千葉、多摩
    case 11: // 步行 15 分鐘以上較遠地段
      if (isTokyo23) return -0.08;
      if (region === "神奈川" || region === "大阪") return -0.12;
      return -0.16; // 埼玉、千葉、多摩
    case 12: // 屋齡 5 年內 (築5年以內)
      if (isTokyo23) return 0.22;
      if (region === "大阪") return 0.18;
      if (region === "神奈川") return 0.16;
      return 0.12; // 埼玉、千葉、多摩
    case 13: // 屋齡 10 年內 (築10年以內)
      if (isTokyo23) return 0.12;
      if (region === "大阪") return 0.10;
      if (region === "神奈川") return 0.09;
      return 0.07;
    case 14: // 屋齡 15 年內 (築15年以內)
      if (isTokyo23) return 0.05;
      if (region === "大阪") return 0.04;
      if (region === "神奈川") return 0.04;
      return 0.02;
    case 15: // 屋齡 20 年內 (築20年以內)
      if (isTokyo23) return -0.06;
      if (region === "大阪") return -0.08;
      if (region === "神奈川") return -0.10;
      return -0.12;
    case 16: // 屋齡 25 年內 (築25年以內)
      if (isTokyo23) return -0.12;
      if (region === "大阪") return -0.15;
      if (region === "神奈川") return -0.18;
      return -0.22;
    case 17: // 屋齡 30 年內 (築30年以內)
      if (isTokyo23) return -0.18;
      if (region === "大阪") return -0.22;
      if (region === "神奈川") return -0.25;
      return -0.30;
    case 18: // 屋齡 40 年內 (築40年以內)
      if (isTokyo23) return -0.25;
      if (region === "大阪") return -0.30;
      if (region === "神奈川") return -0.34;
      return -0.38;
    default:
      return base;
  }
};

const isRentModifierDisabled = (index: number, selected: number[], district: string) => {
  if (index === 25 && !hasTowerMansionSupport(district)) {
    return true;
  }
  if (index === 9 && selected.includes(25)) {
    return true;
  }
  if (index === 21 && selected.includes(25)) {
    return true;
  }
  if (selected.includes(index)) return false;
  return rentConflictGroups.some(group => 
    group.includes(index) && group.some(otherIndex => otherIndex !== index && selected.includes(otherIndex))
  );
};

const isBuyModifierDisabled = (index: number, selected: number[], district: string) => {
  if (index === 8 && !hasTowerMansionSupport(district)) {
    return true;
  }
  if (selected.includes(index)) return false;
  return buyConflictGroups.some(group => 
    group.includes(index) && group.some(otherIndex => otherIndex !== index && selected.includes(otherIndex))
  );
};

const renderFormattedText = (text: string) => {
  if (!text) return null;
  const lines = text.split("\n");
  return lines.map((line, index) => {
    const trimmed = line.trim();
    // Match bullet points like •, -, *, or numbered lists like 1., 2.
    const match = trimmed.match(/^(\d+\.|[•\-\*])\s+(.*)/);
    if (match) {
      const bullet = match[1];
      const content = match[2];
      return (
        <div key={index} className="flex items-start gap-1.5 pl-4 mt-1">
          <span className="shrink-0 font-bold text-[#0F8F6D] font-sans">{bullet}</span>
          <span className="flex-grow">{content}</span>
        </div>
      );
    }
    return (
      <div key={index} className={line === "" ? "h-3" : (index > 0 ? "mt-1.5" : "")}>
        {line}
      </div>
    );
  });
};

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

  // Calculator Logic
  const getSelectedDistrictData = () => {
    return rentRates.find(d => d.district === calcDistrict) || rentRates.find(d => d.district === "新宿區") || rentRates[0];
  };

  const getDistrictScale = () => {
    const rate = getSelectedDistrictData();
    const isTama = ["武藏野市", "三鷹市", "立川市", "八王子市", "日野市", "府中市", "調布市", "町田市", "西東京市", "小平市", "多摩市", "狛江市"].includes(rate.district);
    const isTokyo23 = rate.region === "東京都" && !isTama;
    
    const baseScale = parseFloat(rate.k1) / 10.0;
    
    if (isTokyo23) {
      // Tokyo 23 wards: modifiers have high premium
      return Math.max(0.75, Math.min(1.4, baseScale));
    } else if (rate.region === "東京都") {
      // Tokyo Tama/outer area
      return Math.max(0.4, Math.min(0.8, baseScale * 0.7));
    } else if (rate.region === "神奈川") {
      // Kanagawa is somewhat expensive but still cheaper than Tokyo center
      return Math.max(0.45, Math.min(0.85, baseScale * 0.75));
    } else {
      // Osaka, Saitama, Chiba: much cheaper modifiers in real life
      return Math.max(0.3, Math.min(0.7, baseScale * 0.5));
    }
  };
  
  const getModifierPrice = (modPrice: number, index?: number) => {
    const scale = getDistrictScale();
    let price = modPrice;
    
    // Custom dynamic adjustment for Tower Mansion based on RoomType
    if (index === 25) { // Tower Mansion index
      if (calcRoomType === "ldk1") {
        price = 30000;
      } else if (calcRoomType === "ldk2") {
        price = 50000;
      } else {
        price = 15000;
      }
    }
    
    // Round to nearest 1000
    return Math.round((price * scale) / 1000) * 1000;
  };

  const getCalculatedRent = () => {
    const dData = getSelectedDistrictData();
    const rateString = dData[calcRoomType as keyof typeof dData] as string;
    let rent = parseFloat(rateString) * 10000; // in Yen
    
    calcModifiers.forEach(idx => {
      const mod = budgetModifiers[idx];
      rent += getModifierPrice(mod.price, idx);
    });

    if (calcStation !== "none") {
      const stationList = districtStations[calcDistrict] || [];
      const currentStation = stationList.find(s => s.name === calcStation);
      if (currentStation) {
        if (currentStation.type === "major") {
          rent += getModifierPrice(10000);
        } else if (currentStation.type === "regular") {
          rent += getModifierPrice(5000);
        } else if (currentStation.type === "minor") {
          rent += getModifierPrice(-5000);
        }
      }
    }

    return Math.max(rent, 20000); // Ensure rent doesn't go below 20,000 yen
  };

  const toggleModifier = (index: number) => {
    if (calcModifiers.includes(index)) {
      setCalcModifiers(calcModifiers.filter(i => i !== index));
    } else {
      let nextModifiers = [...calcModifiers, index];
      if (index === 25) {
        nextModifiers = nextModifiers.filter(i => i !== 9 && i !== 21);
      }
      setCalcModifiers(nextModifiers);
    }
  };

  const getBuyYieldRate = () => {
    const dData = getSelectedDistrictData();
    const isTama = ["武藏野市", "三鷹市", "立川市", "八王子市", "日野市", "府中市", "調布市", "町田市", "西東京市", "小平市", "多摩市", "狛江市"].includes(dData.district);
    const isTokyo23 = dData.region === "東京都" && !isTama;
    
    let baseYield = 0.05;
    if (isTokyo23) {
      baseYield = 0.040;
    } else if (dData.region === "東京都") {
      baseYield = 0.054;
    } else if (dData.region === "神奈川") {
      baseYield = 0.048;
    } else if (dData.region === "大阪") {
      baseYield = 0.052;
    } else if (dData.region === "埼玉" || dData.region === "千葉") {
      baseYield = 0.058;
    }
    
    if (calcRoomType === "ldk1") {
      baseYield -= 0.002;
    } else if (calcRoomType === "ldk2") {
      baseYield -= 0.004;
    } else if (calcRoomType === "r1") {
      baseYield += 0.002;
    }
    
    return baseYield;
  };

  const getCalculatedBuyPrice = () => {
    const dData = getSelectedDistrictData();
    const rateString = dData[calcRoomType as keyof typeof dData] as string;
    const rentYen = parseFloat(rateString) * 10000;
    const annualRent = rentYen * 12;
    
    const yieldRate = getBuyYieldRate();
    const basePrice = annualRent / yieldRate;
    
    let multiplierSum = 1.0;
    calcBuyModifiers.forEach(idx => {
      multiplierSum += getDynamicBuyModifierMultiplier(idx, calcDistrict);
    });
    
    const finalPrice = basePrice * multiplierSum;
    return Math.max(Math.round(finalPrice / 100000) * 100000, 3000000);
  };

  const toggleBuyModifier = (index: number) => {
    if (calcBuyModifiers.includes(index)) {
      setCalcBuyModifiers(calcBuyModifiers.filter(i => i !== index));
    } else {
      setCalcBuyModifiers([...calcBuyModifiers, index]);
    }
  };

  const getMonthlyPayment = (price: number) => {
    const loanRatio = 0.7;
    const loanAmount = price * loanRatio;
    const annualRate = 2.2;
    const years = 20;
    const n = years * 12;
    const r = (annualRate / 100) / 12;
    if (r === 0) return loanAmount / n;
    const monthly = loanAmount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return Math.max(Math.round(monthly), 0);
  };

  const getDistrictBuyPrice = (district: string, roomType: "r1" | "k1" | "ldk1" | "ldk2") => {
    const rate = rentRates.find(d => d.district === district) || rentRates[0];
    const rateString = rate[roomType] as string;
    const rentYen = parseFloat(rateString) * 10000;
    const annualRent = rentYen * 12;
    
    const isTama = ["武藏野市", "三鷹市", "立川市", "八王子市", "日野市", "府中市", "調布市", "町田市", "西東京市", "小平市", "多摩市", "狛江市"].includes(rate.district);
    const isTokyo23 = rate.region === "東京都" && !isTama;
    
    let baseYield = 0.05;
    if (isTokyo23) {
      baseYield = 0.040;
    } else if (rate.region === "東京都") {
      baseYield = 0.054;
    } else if (rate.region === "神奈川") {
      baseYield = 0.048;
    } else if (rate.region === "大阪") {
      baseYield = 0.052;
    } else if (rate.region === "埼玉" || rate.region === "千葉") {
      baseYield = 0.058;
    }
    
    if (roomType === "ldk1") {
      baseYield -= 0.002;
    } else if (roomType === "ldk2") {
      baseYield -= 0.004;
    } else if (roomType === "r1") {
      baseYield += 0.002;
    }
    
    const basePrice = annualRent / baseYield;
    return Math.max(Math.round(basePrice / 100000) * 10, 300);
  };

  const formatMessageText = (text: string) => {
    if (!text) return "";
    
    // First, if there's *「text」*, replace it with 「text」 (remove the single asterisks around quotes)
    let cleaned = text.replace(/\*「(.*?)」\*/g, "「$1」");
    
    // Replace **text** with 「text」
    cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, "「$1」");
    
    // Replace *text* with 「text」
    cleaned = cleaned.replace(/\*(.*?)\*/g, "「$1」");
    
    // Also clean any stray double or single asterisks that couldn't be paired
    cleaned = cleaned.replace(/\*\*/g, "");
    cleaned = cleaned.replace(/\*/g, "");
    
    // Clean up markdown headers
    cleaned = cleaned.replace(/###\s*(.*)/g, "$1");
    cleaned = cleaned.replace(/##\s*(.*)/g, "$1");
    cleaned = cleaned.replace(/#\s*(.*)/g, "$1");
    return cleaned;
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
        <div className={`max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6 transition-all duration-300 ${scrolled ? "py-2" : "py-6"}`}>
          <div className="flex items-start gap-4">
            {/* Hanko Stamp Style Logo */}
            <div className={`border-2 border-[#E94E2B] text-[#E94E2B] font-bold text-center leading-tight tracking-widest bg-white select-none shrink-0 transition-all duration-300 ${scrolled ? "px-1.5 py-1 text-xs" : "px-2 py-3 text-lg"}`} id="hanko-logo">
              東京
              <br />
              日和
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-[#1A2A22] text-[#F5F8F6] px-1.5 py-0.5 font-sans uppercase tracking-widest select-none">Linus 住好日</span>
                <span className="text-xs border border-[#0F8F6D] text-[#0F8F6D] px-1.5 py-0.5 select-none font-sans">東京2026新版</span>
              </div>
              <h1 className={`font-bold tracking-tight text-[#1A2A22] transition-all duration-300 ${scrolled ? "text-xl mt-0.5" : "text-3xl mt-1"}`}>日本租房知識大補帖</h1>
              <p className={`text-xs text-zinc-600 mt-1 font-sans transition-all duration-300 ${scrolled ? "hidden md:block opacity-75" : "text-sm block"}`}>
                第一次來日本者的最佳指南 ╳ 實務預算精算 ╳ AI 智能問答
              </p>
            </div>
          </div>
          
          {/* Quick Line contact top bar */}
          <div className={`flex items-center gap-4 border-l-0 md:border-l border-zinc-200 md:pl-6 py-1 w-full md:w-auto transition-all duration-300 ${scrolled ? "hidden md:flex" : "flex flex-col items-end gap-1.5 text-right font-sans"}`}>
            {!scrolled && <div className="text-xs text-zinc-500 uppercase tracking-wider">Linus 線上諮詢</div>}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold bg-[#f4f2ee] px-2.5 py-1 text-zinc-800 border border-zinc-300">LINE ID: {linusContact.lineId}</span>
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
                className={`py-3 md:py-4 text-xs md:text-sm font-medium tracking-wide border-r border-[#1A2A22] first:border-l hover:bg-[#F5F8F6] transition-colors relative cursor-pointer group overflow-visible ${
                  activeTab === "cards" ? "bg-white font-bold text-[#1F5A8F]" : "text-zinc-700"
                }`}
                id="nav-tab-cards"
              >
                <div className="flex flex-col md:flex-row items-center justify-center gap-1.5">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>租屋知識圖卡</span>
                </div>
                {/* Tooltip */}
                <span className="absolute bottom-[-24px] left-1/2 transform -translate-x-1/2 translate-y-[-4px] opacity-0 group-hover:opacity-100 group-hover:translate-y-0 bg-[#1A2A22] text-[#F5F8F6] text-[8px] font-sans px-1.5 py-0.5 rounded transition-all duration-200 pointer-events-none select-none z-30 uppercase shadow-sm">
                  CARDS
                </span>
                {activeTab === "cards" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1F5A8F]" />}
              </button>

              <button 
                onClick={() => handleTabChange("buyHouse")}
                className={`py-3 md:py-4 text-xs md:text-sm font-medium tracking-wide border-r border-[#1A2A22] hover:bg-[#F5F8F6] transition-colors relative cursor-pointer group overflow-visible ${
                  activeTab === "buyHouse" ? "bg-white font-bold text-[#0F8F6D]" : "text-zinc-700"
                }`}
                id="nav-tab-buyhouse"
              >
                <div className="flex flex-col md:flex-row items-center justify-center gap-1.5">
                  <Building className="w-4 h-4 shrink-0" />
                  <span>買房知識大補帖</span>
                </div>
                {/* Tooltip */}
                <span className="absolute bottom-[-24px] left-1/2 transform -translate-x-1/2 translate-y-[-4px] opacity-0 group-hover:opacity-100 group-hover:translate-y-0 bg-[#1A2A22] text-[#F5F8F6] text-[8px] font-sans px-1.5 py-0.5 rounded transition-all duration-200 pointer-events-none select-none z-30 uppercase shadow-sm">
                  BUY
                </span>
                {activeTab === "buyHouse" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0F8F6D]" />}
              </button>

              <button 
                onClick={() => handleTabChange("calculator")}
                className={`py-3 md:py-4 text-xs md:text-sm font-medium tracking-wide border-r border-[#1A2A22] hover:bg-[#F5F8F6] transition-colors relative cursor-pointer group overflow-visible ${
                  activeTab === "calculator" ? "bg-white font-bold text-[#8A6B2F]" : "text-zinc-700"
                }`}
                id="nav-tab-calc"
              >
                <div className="flex flex-col md:flex-row items-center justify-center gap-1.5">
                  <Calculator className="w-4 h-4 shrink-0" />
                  <span>預算加減計算</span>
                </div>
                {/* Tooltip */}
                <span className="absolute bottom-[-24px] left-1/2 transform -translate-x-1/2 translate-y-[-4px] opacity-0 group-hover:opacity-100 group-hover:translate-y-0 bg-[#1A2A22] text-[#F5F8F6] text-[8px] font-sans px-1.5 py-0.5 rounded transition-all duration-200 pointer-events-none select-none z-30 uppercase shadow-sm">
                  CALC
                </span>
                {activeTab === "calculator" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8A6B2F]" />}
              </button>

              <button 
                onClick={() => handleTabChange("chat")}
                className={`py-3 md:py-4 text-xs md:text-sm font-medium tracking-wide border-r border-[#1A2A22] hover:bg-[#F5F8F6] transition-colors relative cursor-pointer group overflow-visible ${
                  activeTab === "chat" ? "bg-white font-bold text-[#5E3B9C]" : "text-zinc-700"
                }`}
                id="nav-tab-chat"
              >
                <div className="flex flex-col md:flex-row items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4 shrink-0 text-[#5E3B9C]" />
                  <span>AI 智能問答</span>
                </div>
                {/* Tooltip */}
                <span className="absolute bottom-[-24px] left-1/2 transform -translate-x-1/2 translate-y-[-4px] opacity-0 group-hover:opacity-100 group-hover:translate-y-0 bg-[#1A2A22] text-[#F5F8F6] text-[8px] font-sans px-1.5 py-0.5 rounded transition-all duration-200 pointer-events-none select-none z-30 uppercase shadow-sm">
                  CHAT
                </span>
                {activeTab === "chat" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5E3B9C]" />}
              </button>

              <button 
                onClick={() => handleTabChange("contact")}
                className={`py-3 md:py-4 text-xs md:text-sm font-medium tracking-wide border-r border-[#1A2A22] hover:bg-[#F5F8F6] transition-colors relative cursor-pointer group overflow-visible ${
                  activeTab === "contact" ? "bg-white font-bold text-[#B13818]" : "text-zinc-700"
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
                {activeTab === "contact" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B13818]" />}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 py-8" id="main-content">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: KNOWLEDGE CARDS */}
          {activeTab === "cards" && (
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
                <div className="absolute top-0 right-8 bg-[#E94E2B] text-white px-3 py-1 text-xs select-none uppercase tracking-widest font-sans">
                  前言 ❀
                </div>
                <h3 className="text-xl font-bold border-b border-[#1A2A22] pb-3 mb-4 flex items-center gap-2">
                  <span>致所有來日本打拼的人</span>
                  <span className="text-[#0F8F6D] text-sm font-normal">By Linus</span>
                </h3>
                <p className="text-zinc-800 leading-relaxed text-justify first-letter:text-2xl first-letter:font-bold first-letter:text-[#0F8F6D] first-letter:mr-1">
                  大家好，我是 Linus，目前在日本東京從事不動產仲介工作。隨著疫情結束，加上日圓匯率的優勢，越來越多台灣與華人朋友選擇來到日本留學、打工度假或就職。為了協助大家在初來乍到之際，能用最短時間掌握日本租房市場的特殊潛規則與避開昂貴收費的陷阱，我精心整理了這份「日本租房知識大補帖」。
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
                              <span className="text-xs bg-[#D6EAF0] text-[#1F5A8F] px-1.5 py-0.5 border border-[#a3d4e5] font-sans font-medium">{fee.jpName}</span>
                            )}
                          </div>
                          <p className="text-sm text-zinc-700 leading-relaxed line-clamp-3">
                            {fee.description}
                          </p>
                        </div>
                        
                        {fee.warning && (
                          <div className="mt-3 pt-2.5 border-t border-dashed border-[#FBDFD2] bg-[#fffaf8] px-2 py-1 text-xs text-[#E94E2B] line-clamp-1 font-sans">
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
                      <h4 className="font-bold text-sm text-[#0A6D52] mb-2 flex items-center gap-1.5">
                        <span>✈ 飛日前提前申請流程</span>
                      </h4>
                      <p className="text-zinc-600 leading-relaxed text-justify mb-2">
                        適合已取得《在留資格認定證明書》(COE) 或打工度假貼紙，人尚未入境日本的人。能省去入境後的租房等待期，好處是落地即入住！
                      </p>
                      <div className="bg-[#F5F8F6] p-3 border border-zinc-200">
                        <span className="font-bold text-[#1A2A22]">流程順序：</span>
                        取得簽證貼紙/COE ➔ 線上挑房 ➔ 提交資料 ➔ 保證公司電話照會 ➔ 審查核准 ➔ 海外匯款初期費用 ➔ 入境領在留卡 ➔ 領鑰匙 ➔ 登記住址。
                      </div>
                    </div>

                    <div className="bg-white p-5 border border-[#1A2A22] relative">
                      <div className="absolute top-0 right-0 bg-[#FBDFD2] text-[#B13818] px-2 py-0.5 font-bold">境內審查</div>
                      <h4 className="font-bold text-sm text-[#0A6D52] mb-2 flex items-center gap-1.5">
                        <span>🇯🇵 抵達日本境內申請流程</span>
                      </h4>
                      <p className="text-zinc-600 leading-relaxed text-justify mb-2">
                        適合人已在日本，擁有登記過原臨時地址在留卡、日本電話與個人印章的人。可安排實體內見看房，能挑選的房源物件範圍是最多的。
                      </p>
                      <div className="bg-[#F5F8F6] p-3 border border-zinc-200">
                        <span className="font-bold text-[#1A2A22]">流程順序：</span>
                        在留卡登錄臨時地址 ➔ 辦日本手機號 ➔ 找房與預約看房 ➔ 遞交申請 ➔ 審查 ➔ 境內匯款 ➔ 簽約重要事項說明 ➔ 領鑰匙。
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
                          <div className="absolute -left-[31px] top-1.5 w-4 h-4 bg-white border-2 border-[#1F5A8F] group-hover:bg-[#1F5A8F] transition-colors" />
                          
                          <div className="flex flex-col md:flex-row justify-between items-start gap-2 mb-1.5">
                            <h5 className="font-bold text-sm text-[#1F5A8F]">{step.name}</h5>
                            <span className="text-xs bg-[#D6EAF0] text-[#1F5A8F] border border-[#b8dfeb] px-2 py-0.5 font-sans shrink-0">
                              時程估計: {step.duration}
                            </span>
                          </div>
                          <div className="text-xs text-zinc-700 leading-relaxed text-justify font-sans">{renderFormattedText(step.description)}</div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-[#EAF3EE] p-4 border border-[#A8D5C2] text-xs text-[#3F5147] leading-relaxed mt-6 font-sans">
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
                          <span className="bg-[#D6EAF0] text-[#1F5A8F] font-sans text-xs font-bold w-5 h-5 flex items-center justify-center shrink-0">Q</span>
                          <h4 className="text-sm md:text-base font-bold text-[#1A2A22]">
                            {qa.question}
                          </h4>
                        </div>
                        <div className="flex items-start gap-3 pl-8">
                          <div className="bg-[#EAF3EE] text-[#0A6D52] font-sans text-xs font-bold w-5 h-5 flex items-center justify-center shrink-0">A</div>
                          <div className="text-xs md:text-sm text-zinc-700 leading-relaxed text-justify whitespace-pre-line font-sans">{renderFormattedText(qa.answer)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </motion.div>
          )}

          {/* TAB 1.5: BUYING HOUSE KNOWLEDGE GUIDE */}
          {activeTab === "buyHouse" && (
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
                  <span>日本買房置產大補帖</span>
                  <span className="text-[#0F8F6D] text-sm font-normal">By Linus</span>
                </h3>
                <p className="text-zinc-800 leading-relaxed text-justify first-letter:text-2xl first-letter:font-bold first-letter:text-[#0F8F6D] first-letter:mr-1 font-serif">
                  您好，我是 Linus。近年來隨著日本經濟回溫與日圓匯率相對低檔，許多華人朋友除了在日租屋，也開始規劃「買房自住」或「置產投資民宿與出租套房」。在日本買房雖然不限國籍與簽證，但其產權登記事項、銀行貸款條件、以及東京都各區對民泊民宿（Airbnb）的嚴格規範，實務上細節繁瑣，稍有不慎就會踩到高利息或無法營業的法規地雷。
                </p>
                <p className="text-zinc-800 leading-relaxed text-justify mt-4">
                  為了協助您精準掌握日本房市脈絡，我特別整理了這份包含「圖紙/規費術語」、「現金與貸款買房完整步驟」、「2026最新台系與日系銀行放款標準」，以及「東京都 23 區最詳盡的民泊民宿新法與旅館業法要求」。歡迎直接查閱或透過 AI 問答隨時向我諮詢！❀
                </p>

                {/* Visual Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-dashed border-zinc-300 font-sans">
                  <div className="bg-[#F5F8F6] p-4 border border-zinc-200">
                    <h4 className="font-bold text-[#0F8F6D] flex items-center gap-2 text-sm">
                      <Sparkles className="w-4 h-4" />
                      <span>需要為您評估買房方案或試算嗎？</span>
                    </h4>
                    <p className="text-xs text-zinc-600 mt-1">
                      本系統已將完整買房大補帖與 2026 各家銀行放款、民泊新法規則整合至 AI 智能助手，支援直接提問。
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
                      直接聯絡 Linus 團隊，我們將為您在東京日和內部篩選未公開的優質房源。
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
                                  <span className="text-[10px] md:text-xs bg-[#FBDFD2] text-[#B13818] px-1.5 py-0.5 border border-[#f7c8b2] font-sans font-medium">{term.jpName}</span>
                                )}
                              </div>
                              <p className="text-xs md:text-sm text-zinc-700 leading-relaxed line-clamp-3">
                                {term.description}
                              </p>
                            </div>
                            <div className="mt-4 flex items-center justify-between text-[10px] text-zinc-400 font-sans border-t border-zinc-100 pt-2">
                              <span>圖紙專有名詞</span>
                              <span className="text-[#1F5A8F] hover:underline flex items-center gap-0.5">點擊詳情 ❀</span>
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
                                  <span className="text-[10px] md:text-xs bg-[#FBDFD2] text-[#B13818] px-1.5 py-0.5 border border-[#f7c8b2] font-sans font-medium">{term.jpName}</span>
                                )}
                              </div>
                              <p className="text-xs md:text-sm text-zinc-700 leading-relaxed line-clamp-3">
                                {term.description}
                              </p>
                            </div>
                            <div className="mt-4 flex items-center justify-between text-[10px] text-zinc-400 font-sans border-t border-zinc-100 pt-2">
                              <span>規費與交易術語</span>
                              <span className="text-[#1F5A8F] hover:underline flex items-center gap-0.5">點擊詳情 ❀</span>
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
                        <h4 className="font-bold text-sm text-[#0A6D52] border-b border-zinc-300 pb-2 mb-3 flex items-center gap-1.5">
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
                              <h4 className="font-bold text-sm text-[#0A6D52] leading-normal">{bank.name}</h4>
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
                            <span className="bg-[#D6EAF0] text-[#1F5A8F] font-sans text-xs font-bold w-5 h-5 flex items-center justify-center shrink-0">Q</span>
                            <h4 className="text-sm md:text-base font-bold text-[#1A2A22] font-serif">
                              {qa.question}
                            </h4>
                          </div>
                          <div className="flex items-start gap-3 pl-8">
                            <span className="bg-[#EAF3EE] text-[#0A6D52] font-sans text-xs font-bold w-5 h-5 flex items-center justify-center shrink-0">A</span>
                            <div className="text-xs md:text-sm text-zinc-700 leading-relaxed text-justify whitespace-pre-line font-sans">{renderFormattedText(qa.answer)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </motion.div>
          )}

          {/* TAB 2: BUDGET ESTIMATOR CALCULATOR */}
          {activeTab === "calculator" && (
            <motion.div
              key="calculator"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-8"
              id="pane-calculator"
            >
              {/* Rent vs Buy switcher */}
              <div className="flex border border-[#1A2A22] bg-[#F5F8F6] p-1 gap-1" id="calc-mode-switcher font-sans">
                <button
                  onClick={() => setCalcMode("rent")}
                  className={`flex-1 py-3 text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer font-sans ${
                    calcMode === "rent"
                      ? "bg-[#1A2A22] text-white"
                      : "bg-transparent text-zinc-700 hover:bg-zinc-200"
                  }`}
                >
                  <Building className="w-4 h-4 shrink-0" />
                  租房行情加減價估算
                </button>
                <button
                  onClick={() => setCalcMode("buy")}
                  className={`flex-1 py-3 text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer font-sans ${
                    calcMode === "buy"
                      ? "bg-[#0F8F6D] text-white"
                      : "bg-transparent text-zinc-700 hover:bg-zinc-200"
                  }`}
                >
                  <Landmark className="w-4 h-4 shrink-0" />
                  買房總價與貸款試算
                </button>
              </div>

              {/* Preface Intro for Calc */}
              <div className="border border-[#1A2A22] bg-white p-6" id="calc-intro">
                <h3 className="text-lg font-bold border-b border-[#1A2A22] pb-3 mb-4 text-[#1A2A22] flex items-center gap-2 font-sans">
                  <Calculator className="w-5 h-5 text-[#0F8F6D]" />
                  {calcMode === "rent" ? (
                    <span>2026 關東/關西地區 租屋行情估算 ╳ 條件增減 (SUUMO/HOME'S 最新行情)</span>
                  ) : (
                    <span>2026 關東/關西地區 買房行情大數據 ╳ 條件折溢價估算 (SUUMO/HOME'S 實價參考)</span>
                  )}
                </h3>
                <p className="text-sm text-zinc-700 leading-relaxed text-justify font-sans">
                  {calcMode === "rent" ? (
                    "不知道自己的預算能租到什麼樣的房子嗎？Linus 根據 2026 最新市場行情，特別整理了「加減價估算系統」。您只需在下方選擇「希望區域、格局大小」，並勾選希望的房間「增減價條件（如獨立洗面台、屋齡新舊等）」，即可算出適合您的租屋建議預算。"
                  ) : (
                    "想要在日本置產買房，但不清楚各個地區與不同格局的行情嗎？Linus 結合 2026 日本中古公寓（中古マンション）實價登錄與 SUUMO/HOME'S 買賣交易大數據，開發了這款「購屋預算加減價與貸款試算系統」。您只需在下方選擇希望區域、格局大小，並勾選希望的房屋條件（如是否全新、有無現代化翻修、空室或帶租約），即可立刻算出合理預估總價、過戶初期諸費用與每月貸款本息負擔額！"
                  )}
                </p>
              </div>

              {/* Multi-grid calculator interface */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start" id="calc-engine-container">
                {/* Inputs area (Left 7 Columns) */}
                <div className="xl:col-span-7 space-y-6">
                  {/* Step 1: Select District & Size */}
                  <div className="border border-[#1A2A22] bg-white p-6 space-y-4">
                    <h4 className="font-bold text-[#0F8F6D] text-sm border-b border-zinc-200 pb-2 font-sans">
                      步驟一：選擇地區與格局
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* District Picker */}
                      <div className="space-y-1.5 font-sans">
                        <label className="text-xs font-bold text-zinc-700">選擇希望區域：</label>
                        <select 
                          value={calcDistrict}
                          onChange={(e) => {
                            setCalcDistrict(e.target.value);
                            setCalcModifiers([]); // reset rent modifiers
                            setCalcBuyModifiers([]); // reset buy modifiers
                          }}
                          className="w-full bg-white border border-[#1A2A22] py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F8F6D] rounded-none cursor-pointer font-sans"
                        >
                          {Array.from(new Set(rentRates.map(r => r.region))).map(region => (
                            <optgroup key={region} label={region} className="font-sans font-bold">
                              {rentRates.filter(r => r.region === region).map(item => (
                                <option key={item.district} value={item.district} className="font-sans">
                                  {calcMode === "rent" ? (
                                    `${item.district} (1K均價: ${item.k1} 萬円/月)`
                                  ) : (
                                    `${item.district} (1K估計: ${getDistrictBuyPrice(item.district, "k1").toLocaleString()} 萬円)`
                                  )}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>

                      {/* Room Type Picker */}
                      <div className="space-y-1.5 font-sans">
                        <label className="text-xs font-bold text-zinc-700">選擇格局大小 (套房/1LDK/2LDK)：</label>
                        <div className="grid grid-cols-4 border border-[#1A2A22]">
                          {[
                            { id: "r1", label: "1R" },
                            { id: "k1", label: "1K" },
                            { id: "ldk1", label: "1LDK" },
                            { id: "ldk2", label: "2LDK" }
                          ].map(type => (
                            <button
                              key={type.id}
                              onClick={() => setCalcRoomType(type.id as any)}
                              className={`py-2 text-xs font-bold cursor-pointer transition-colors ${
                                calcRoomType === type.id 
                                  ? "bg-[#1A2A22] text-white" 
                                  : "bg-white text-zinc-700 hover:bg-[#F5F8F6]"
                              }`}
                            >
                              {type.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {calcMode === "rent" && (() => {
                      const stationsForDistrict = districtStations[calcDistrict] || [];
                      const majorStations = stationsForDistrict.filter(s => s.type === "major");
                      const regularStations = stationsForDistrict.filter(s => s.type === "regular");
                      const minorStations = stationsForDistrict.filter(s => s.type === "minor");
                      return (
                        <div className="space-y-1.5 font-sans pt-3 border-t border-dashed border-zinc-200">
                          <label className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#0F8F6D]" />
                            選擇物件周邊特定車站（鐵路、地下鐵或路面電車）：
                          </label>
                          <select
                            value={calcStation}
                            onChange={(e) => setCalcStation(e.target.value)}
                            className="w-full bg-white border border-[#1A2A22] py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F8F6D] rounded-none cursor-pointer font-sans"
                          >
                            <option value="none">基準 (行政區平均行情基礎 — 適合廣域搜房)</option>
                            {majorStations.length > 0 && (
                              <optgroup label="🚇 熱門大站 / 多線共構 / 快速急行停靠 (行情溢價約 +1.0 萬円/月)">
                                {majorStations.map(s => (
                                  <option key={s.name} value={s.name}>
                                    {s.name}站 ({s.lines.join(", ")})
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            {regularStations.length > 0 && (
                              <optgroup label="🚉 常規站點 / 人氣常規站 (行情溢價約 +0.5 萬円/月)">
                                {regularStations.map(s => (
                                  <option key={s.name} value={s.name}>
                                    {s.name}站 ({s.lines.join(", ")})
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            {minorStations.length > 0 && (
                              <optgroup label="🛤 各停小站 / 二線各停 / 偏遠小站 (行情調減約 -0.5 萬円/月)">
                                {minorStations.map(s => (
                                  <option key={s.name} value={s.name}>
                                    {s.name}站 ({s.lines.join(", ")}) — 行情相對親民
                                  </option>
                                ))}
                              </optgroup>
                            )}
                          </select>
                          <p className="text-[10px] text-zinc-500 leading-normal">
                            * 站點溢折價由關東與關西鐵路路網特徵自動計算（不含巴士）。偏遠或各停小站因通勤便利度關係，周邊租金通常相對實惠，系統會自動套用調減；熱門多線大站則會套用溢價修正。
                          </p>
                        </div>
                      );
                    })()}

                    <div className="text-xs text-zinc-500 flex items-center gap-1.5 bg-[#F5F8F6] p-3 border border-zinc-200 leading-normal font-sans">
                      <Info className="w-4 h-4 text-[#0F8F6D] shrink-0" />
                      {calcMode === "rent" ? (
                        <span>
                          當前選定：<strong>{calcDistrict}</strong> 區域，該格局規格下的合理市場平均月租金約為 <strong>
                            {calcRoomType === "r1" ? getSelectedDistrictData().r1 : calcRoomType === "k1" ? getSelectedDistrictData().k1 : calcRoomType === "ldk1" ? getSelectedDistrictData().ldk1 : getSelectedDistrictData().ldk2}
                          </strong> 萬日圓。
                        </span>
                      ) : (
                        <span>
                          當前選定：<strong>{calcDistrict}</strong> 區域，該格局規格下的合理市場中古公寓估計基本總價約為 <strong>
                            {getDistrictBuyPrice(calcDistrict, calcRoomType).toLocaleString()}
                          </strong> 萬日圓（估計投資年收益率約 <strong>{(getBuyYieldRate() * 100).toFixed(2)}%</strong>）。
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Interactive Rent Map heatmap */}
                  <RentMap 
                    selectedDistrict={calcDistrict} 
                    onSelectDistrict={setCalcDistrict} 
                    roomType={calcRoomType} 
                    onSelectRoomType={setCalcRoomType} 
                    mode={calcMode}
                  />

                  {/* Step 2: Modifiers checklist */}
                  <div className="border border-[#1A2A22] bg-white p-6 space-y-4">
                    <h4 className="font-bold text-[#0F8F6D] text-sm border-b border-zinc-200 pb-2 font-sans">
                      {calcMode === "rent" ? "步驟二：勾選想要的附加條件 (租房增減價項目)" : "步驟二：勾選想要的附加條件 (買房折溢價項目)"}
                    </h4>
                    
                    {calcMode === "rent" ? (
                      <div className="space-y-4 font-sans text-xs">
                        {/* Plus Modifiers */}
                        <div className="space-y-2.5">
                          <span className="font-bold text-zinc-800 block text-xs tracking-wider">★ 加價升級條件 (配備新穎或位置佳)：</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {budgetModifiers.filter(m => m.type === "plus" && m.text !== "熱門大站 (2條線路以上)" && m.text !== "熱門小站 (1條線路)" && (!m.applicableLayouts || m.applicableLayouts.includes(calcRoomType))).map((mod) => {
                              const originalIdx = budgetModifiers.findIndex(m => m.text === mod.text);
                              const isSelected = calcModifiers.includes(originalIdx);
                              const isDisabled = isRentModifierDisabled(originalIdx, calcModifiers, calcDistrict);
                              const isNoTower = originalIdx === 25 && !hasTowerMansionSupport(calcDistrict);
                              return (
                                <label 
                                  key={originalIdx} 
                                  className={`p-2.5 border flex items-start gap-2.5 transition-all ${
                                    isDisabled
                                      ? "opacity-45 bg-zinc-50 border-zinc-150 text-zinc-400 pointer-events-none cursor-not-allowed select-none"
                                      : isSelected 
                                        ? "bg-[#fffdfb] border-[#0F8F6D] text-zinc-900 cursor-pointer" 
                                        : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400 cursor-pointer"
                                  }`}
                                  title={isDisabled ? (isNoTower ? "該地區目前查無超高層塔樓住宅 (タワーマンション)，不開放勾選" : "此條件與您已勾選的其他條件有衝突，已自動鎖定防呆") : undefined}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    disabled={isDisabled}
                                    onChange={() => !isDisabled && toggleModifier(originalIdx)}
                                    className="mt-0.5 accent-[#0F8F6D]"
                                  />
                                  <div className="flex-grow">
                                    <div className="font-semibold leading-tight font-sans flex items-center justify-between gap-1">
                                      <span className={isDisabled ? "text-zinc-400 line-through decoration-zinc-300" : "text-zinc-900"}>{mod.text}</span>
                                      {isDisabled && (
                                        <span className="text-[9px] bg-zinc-200 text-zinc-500 font-bold font-sans px-1 rounded-sm flex-shrink-0 scale-90">
                                          {isNoTower ? "此區無塔樓" : "衝突鎖定"}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-zinc-500 mt-0.5 font-mono">+ {getModifierPrice(mod.price, originalIdx).toLocaleString()} 円 / 月</div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        {/* Minus Modifiers */}
                        <div className="space-y-2.5 pt-2">
                          <span className="font-bold text-zinc-800 block text-xs tracking-wider">★ 扣減價妥協條件 (可接受較舊或步行較遠)：</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {budgetModifiers.filter(m => m.type === "minus" && (!m.applicableLayouts || m.applicableLayouts.includes(calcRoomType))).map((mod) => {
                              const originalIdx = budgetModifiers.findIndex(m => m.text === mod.text);
                              const isSelected = calcModifiers.includes(originalIdx);
                              const isDisabled = isRentModifierDisabled(originalIdx, calcModifiers, calcDistrict);
                              const isTowerFirstFloorConflict = originalIdx === 21 && calcModifiers.includes(25);
                              return (
                                <label 
                                  key={originalIdx} 
                                  className={`p-2.5 border flex items-start gap-2.5 transition-all ${
                                    isDisabled
                                      ? "opacity-45 bg-zinc-50 border-zinc-150 text-zinc-400 pointer-events-none cursor-not-allowed select-none"
                                      : isSelected 
                                        ? "bg-[#fcfdfa] border-zinc-800 text-zinc-900 cursor-pointer" 
                                        : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400 cursor-pointer"
                                  }`}
                                  title={isDisabled ? (isTowerFirstFloorConflict ? "超高層塔樓住宅 (タワーマンション) 基本上不會有第一樓住宅，已自動防呆鎖定" : "此條件與您已勾選的其他條件有衝突，已自動鎖定防呆") : undefined}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    disabled={isDisabled}
                                    onChange={() => !isDisabled && toggleModifier(originalIdx)}
                                    className="mt-0.5 accent-zinc-800"
                                  />
                                  <div className="flex-grow">
                                    <div className="font-semibold leading-tight font-sans flex items-center justify-between gap-1">
                                      <span className={isDisabled ? "text-zinc-400 line-through decoration-zinc-300" : "text-zinc-900"}>{mod.text}</span>
                                      {isDisabled && (
                                        <span className="text-[9px] bg-zinc-200 text-zinc-500 font-bold font-sans px-1 rounded-sm flex-shrink-0 scale-90">
                                          {isTowerFirstFloorConflict ? "塔樓無一樓" : "衝突鎖定"}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-green-700 mt-0.5 font-mono">− {Math.abs(getModifierPrice(mod.price)).toLocaleString()} 円 / 月</div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 font-sans text-xs">
                        {/* Buy Plus Modifiers */}
                        <div className="space-y-2.5">
                          <span className="font-bold text-zinc-800 block text-xs tracking-wider">★ 溢價提升條件 (屋況優越、位置頂級或自住優勢)：</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {buyBudgetModifiers.filter(m => m.type === "plus").map((mod) => {
                              const originalIdx = buyBudgetModifiers.findIndex(m => m.text === mod.text);
                              const isSelected = calcBuyModifiers.includes(originalIdx);
                              const isDisabled = isBuyModifierDisabled(originalIdx, calcBuyModifiers, calcDistrict);
                              const isNoTower = originalIdx === 8 && !hasTowerMansionSupport(calcDistrict);
                              const dynamicMult = getDynamicBuyModifierMultiplier(originalIdx, calcDistrict);
                              return (
                                <label 
                                  key={originalIdx} 
                                  className={`p-3 border flex items-start gap-2.5 transition-all h-full ${
                                    isDisabled
                                      ? "opacity-45 bg-zinc-50 border-zinc-150 text-zinc-400 pointer-events-none cursor-not-allowed select-none"
                                      : isSelected 
                                        ? "bg-[#fffdfb] border-[#0F8F6D] text-zinc-900 cursor-pointer" 
                                        : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400 cursor-pointer"
                                  }`}
                                  title={isDisabled ? (isNoTower ? "該地區目前查無超高層塔樓住宅 (タワーマンション)，不開放勾選" : "此條件與您已勾選的其他條件有衝突，已自動鎖定防呆") : undefined}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    disabled={isDisabled}
                                    onChange={() => !isDisabled && toggleBuyModifier(originalIdx)}
                                    className="mt-1 accent-[#0F8F6D]"
                                  />
                                  <div className="flex-grow">
                                    <div className="font-semibold leading-tight font-sans flex items-center justify-between gap-1">
                                      <span className={isDisabled ? "text-zinc-400 line-through decoration-zinc-300" : "text-zinc-900"}>{mod.text}</span>
                                      {isDisabled && (
                                        <span className="text-[9px] bg-zinc-200 text-zinc-500 font-bold font-sans px-1 rounded-sm flex-shrink-0 scale-90">
                                          {isNoTower ? "此區無塔樓" : "衝突鎖定"}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-zinc-500 mt-1 leading-normal font-sans">{mod.description}</div>
                                    <div className="text-[10px] text-[#0F8F6D] font-bold mt-1 font-mono">
                                      +{(dynamicMult * 100).toFixed(0)}% 估值溢價
                                    </div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        {/* Buy Minus Modifiers */}
                        <div className="space-y-2.5 pt-2">
                          <span className="font-bold text-zinc-800 block text-xs tracking-wider">★ 折價讓利條件 (帶租約、舊耐震或土地權利受限)：</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {buyBudgetModifiers.filter(m => m.type === "minus").map((mod) => {
                              const originalIdx = buyBudgetModifiers.findIndex(m => m.text === mod.text);
                              const isSelected = calcBuyModifiers.includes(originalIdx);
                              const isDisabled = isBuyModifierDisabled(originalIdx, calcBuyModifiers, calcDistrict);
                              const dynamicMult = getDynamicBuyModifierMultiplier(originalIdx, calcDistrict);
                              return (
                                <label 
                                  key={originalIdx} 
                                  className={`p-3 border flex items-start gap-2.5 transition-all h-full ${
                                    isDisabled
                                      ? "opacity-45 bg-zinc-50 border-zinc-150 text-zinc-400 pointer-events-none cursor-not-allowed select-none"
                                      : isSelected 
                                        ? "bg-[#fcfdfa] border-zinc-800 text-zinc-900 cursor-pointer" 
                                        : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400 cursor-pointer"
                                  }`}
                                  title={isDisabled ? "此條件與您已勾選的其他條件有衝突，已自動鎖定防呆" : undefined}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    disabled={isDisabled}
                                    onChange={() => !isDisabled && toggleBuyModifier(originalIdx)}
                                    className="mt-1 accent-zinc-800"
                                  />
                                  <div className="flex-grow font-sans">
                                    <div className="font-semibold leading-tight font-sans flex items-center justify-between gap-1">
                                      <span className={isDisabled ? "text-zinc-400 line-through decoration-zinc-300" : "text-zinc-900"}>{mod.text}</span>
                                      {isDisabled && <span className="text-[9px] bg-zinc-200 text-zinc-500 font-bold font-sans px-1 rounded-sm flex-shrink-0 scale-90">衝突鎖定</span>}
                                    </div>
                                    <div className="text-[10px] text-zinc-500 mt-1 leading-normal font-sans">{mod.description}</div>
                                    <div className="text-[10px] text-green-700 font-bold mt-1 font-mono">
                                      {Math.abs(dynamicMult * 100).toFixed(0)}% 估值折價
                                    </div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Calculation Output (Right 5 Columns) - Sticky visual layout */}
                <div className="xl:col-span-5 xl:sticky xl:top-8 space-y-6">
                  {/* Results Display */}
                  <div className="border border-[#1A2A22] bg-white p-6 relative">
                    <div className="absolute top-0 right-4 bg-[#0F8F6D] text-white px-2 py-0.5 text-xs select-none font-sans">
                      精算結果 ❀
                    </div>
                    
                    {calcMode === "rent" ? (
                      <>
                        <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2 font-sans">
                          LINUS 獨家估計房租預算：
                        </h4>
                        
                        {/* The Big Number */}
                        <div className="border-b border-[#1A2A22] pb-4 mb-4">
                          <div className="flex items-baseline gap-1 font-sans">
                            <span className="text-3xl md:text-4xl font-extrabold text-[#0F8F6D] tracking-tight font-mono">
                              {getCalculatedRent().toLocaleString()}
                            </span>
                            <span className="text-base font-bold text-[#1A2A22]">日圓 / 月</span>
                          </div>
                          <div className="text-xs text-zinc-500 mt-1.5 font-sans leading-relaxed">
                            (約合 <strong>{(getCalculatedRent() / 10000).toFixed(2)}</strong> 萬日圓/月。本估值對應東京該條件的合理市場中位數行情。)
                          </div>
                        </div>

                        {/* Breakdown details */}
                        <div className="space-y-3.5 text-xs font-sans">
                          <div>
                            <span className="text-zinc-500 block">所選基本平均租金 ({calcDistrict})：</span>
                            <span className="font-bold text-zinc-800 font-mono">
                              {(parseFloat(getSelectedDistrictData()[calcRoomType as keyof typeof getSelectedDistrictData] as string) * 10000).toLocaleString()} 円
                            </span>
                          </div>

                          {calcStation !== "none" && (
                            <div className="flex justify-between items-baseline font-sans border-t border-dashed border-zinc-100 pt-3">
                              <span className="text-zinc-500">周邊站點溢折價 ({calcStation}站)：</span>
                              {(() => {
                                const currentStation = (districtStations[calcDistrict] || []).find(s => s.name === calcStation);
                                if (!currentStation) return null;
                                let price = 0;
                                if (currentStation.type === "major") price = 10000;
                                else if (currentStation.type === "regular") price = 5000;
                                else if (currentStation.type === "minor") price = -5000;
                                
                                const adjustedPrice = getModifierPrice(price);
                                return (
                                  <span className={`font-bold font-mono ${adjustedPrice >= 0 ? "text-[#0F8F6D]" : "text-green-700"}`}>
                                    {adjustedPrice >= 0 ? "+" : ""}
                                    {adjustedPrice.toLocaleString()} 円
                                  </span>
                                );
                              })()}
                            </div>
                          )}

                          {calcModifiers.length > 0 && (
                            <div className="space-y-1.5 border-t border-dashed border-zinc-100 pt-3">
                              <div className="flex justify-between items-baseline font-sans">
                                <span className="text-zinc-500">條件調整小計：</span>
                                <span className={`font-bold font-mono ${
                                  calcModifiers.reduce((acc, cur) => acc + getModifierPrice(budgetModifiers[cur].price), 0) >= 0 
                                    ? "text-[#0F8F6D]" 
                                    : "text-green-700"
                                }`}>
                                  {calcModifiers.reduce((acc, cur) => acc + getModifierPrice(budgetModifiers[cur].price), 0) >= 0 ? "+" : ""}
                                  {calcModifiers.reduce((acc, cur) => acc + getModifierPrice(budgetModifiers[cur].price), 0).toLocaleString()} 円
                                </span>
                              </div>
                              <div className="pl-2 border-l border-dashed border-zinc-200 space-y-1 mt-1 text-[11px] leading-relaxed">
                                {calcModifiers.map((idx) => {
                                  const mod = budgetModifiers[idx];
                                  const adjustedPrice = getModifierPrice(mod.price);
                                  const isPlus = mod.type === "plus";
                                  return (
                                    <div key={idx} className="flex justify-between items-start text-zinc-600 gap-2">
                                      <span className="break-all">
                                        {isPlus ? "＋" : "－"} {mod.text}
                                      </span>
                                      <span className={`font-mono shrink-0 ${isPlus ? "text-[#0F8F6D]" : "text-green-700"}`}>
                                        {isPlus ? "+" : ""}
                                        {adjustedPrice.toLocaleString()} 円
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Estimation of Initial Fees */}
                          <div className="pt-4 border-t border-dashed border-zinc-300">
                            <span className="text-[#0F8F6D] font-bold block mb-1">🗂 估算初期費用區間：</span>
                            <div className="bg-[#F5F8F6] p-3 border border-zinc-200 space-y-1.5">
                              <div className="flex justify-between font-bold text-zinc-800 font-sans text-[11px] md:text-xs">
                                <span>4 倍租金 (0禮金 0押金):</span>
                                <span className="font-mono text-xs text-zinc-900">{(getCalculatedRent() * 4).toLocaleString()} 円</span>
                              </div>
                              <div className="flex justify-between font-bold text-[#0F8F6D] font-sans text-[11px] md:text-xs">
                                <span>正常 5 倍平均 (0禮金或0押金之一):</span>
                                <span className="font-mono text-xs text-[#0F8F6D]">{(getCalculatedRent() * 5).toLocaleString()} 円</span>
                              </div>
                              <div className="flex justify-between font-bold text-zinc-800 font-sans text-[11px] md:text-xs">
                                <span>6 倍頂格上限 (完整禮金押金等):</span>
                                <span className="font-mono text-xs text-zinc-900">{(getCalculatedRent() * 6).toLocaleString()} 円</span>
                              </div>
                              <p className="text-[10px] text-zinc-500 mt-2.5 text-justify leading-relaxed border-t border-zinc-200/60 pt-2 font-sans">
                                💡 說明：日本租房通常會要求預付不足月日割租金、翌月房租、保證會社費用、禮金押金與換鑰匙等。建議攜帶預算抓在「5倍房租」的金額（約 {(getCalculatedRent() * 5).toLocaleString()} 円）會最為安全踏實！
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* CTA */}
                        <div className="mt-6 pt-2 font-sans">
                          <button 
                            onClick={() => {
                              const stationPart = calcStation !== "none" ? `（靠近 ${calcStation}站）` : "";
                              const messageText = `您好，我剛才使用了您的預算計算機，想在 ${calcDistrict}${stationPart} 租房。預估的月租預算大約在 ${getCalculatedRent().toLocaleString()} 日圓左右。請問有推薦的外國人可用房源嗎？`;
                              handleTabChange("chat");
                              handleSendMessage(undefined, messageText);
                            }}
                            className="w-full bg-[#1A2A22] text-white py-3 px-4 font-bold tracking-wider hover:bg-[#0F8F6D] cursor-pointer text-xs uppercase transition-colors"
                            id="calc-send-to-ai"
                          >
                            帶入此預算諮詢 AI 房仲 ➔
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2 font-sans">
                          LINUS 獨家估計物件總價：
                        </h4>
                        
                        {/* The Big Number */}
                        <div className="border-b border-[#1A2A22] pb-4 mb-4">
                          <div className="flex items-baseline gap-1 font-sans">
                            <span className="text-3xl md:text-4xl font-extrabold text-[#0F8F6D] tracking-tight font-mono">
                              {(getCalculatedBuyPrice() / 10000).toLocaleString()}
                            </span>
                            <span className="text-base font-bold text-[#1A2A22]">萬日圓</span>
                          </div>
                          <div className="text-xs text-zinc-500 mt-1.5 font-sans leading-relaxed">
                            (約合日幣 <strong>{getCalculatedBuyPrice().toLocaleString()}</strong> 円 / 折合台幣約 <strong>{(getCalculatedBuyPrice() / 10000 * 0.215).toFixed(0)}</strong> 萬元。本估值對應 2026 實價登錄合理中古大樓成交中位數。)
                          </div>
                        </div>

                        {/* Breakdown buy details */}
                        <div className="space-y-4 text-xs font-sans">
                          <div>
                            <span className="text-zinc-500 block">所選規格基本總價 ({calcDistrict})：</span>
                            <span className="font-bold text-zinc-800 font-mono">
                              {(getDistrictBuyPrice(calcDistrict, calcRoomType) * 10000).toLocaleString()} 円 ({getDistrictBuyPrice(calcDistrict, calcRoomType)} 萬日圓)
                            </span>
                          </div>

                          {calcBuyModifiers.length > 0 && (
                            <div className="space-y-1.5 border-t border-dashed border-zinc-100 pt-3">
                              <span className="text-zinc-500 block">條件調整清單：</span>
                              <div className="pl-2 border-l border-dashed border-zinc-200 space-y-1 mt-1 text-[11px] leading-relaxed">
                                {calcBuyModifiers.map((idx) => {
                                  const mod = buyBudgetModifiers[idx];
                                  const isPlus = mod.type === "plus";
                                  const dynamicMult = getDynamicBuyModifierMultiplier(idx, calcDistrict);
                                  return (
                                    <div key={idx} className="flex justify-between items-start text-zinc-600 gap-2">
                                      <span className="break-all font-sans">
                                        {isPlus ? "＋" : "－"} {mod.text}
                                      </span>
                                      <span className={`font-mono shrink-0 ${isPlus ? "text-[#0F8F6D]" : "text-green-700"}`}>
                                        {isPlus ? "+" : "-"}{Math.abs(dynamicMult * 100).toFixed(0)}%
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Initial purchase fees section */}
                          <div className="pt-3 border-t border-dashed border-zinc-200">
                            <span className="text-[#0F8F6D] font-bold block mb-1">🗂 估算初期過戶費用 (諸費用 - 一次性)：</span>
                            <div className="bg-[#F5F8F6] p-3 border border-zinc-200 space-y-1.5">
                              <div className="flex justify-between font-bold text-zinc-800 text-[11px] md:text-xs">
                                <span>現金一括買 (房價約 7%):</span>
                                <span className="font-mono text-zinc-900">{(getCalculatedBuyPrice() * 0.07 / 10000).toFixed(0)} 萬日圓</span>
                              </div>
                              <div className="flex justify-between font-bold text-zinc-800 text-[11px] md:text-xs">
                                <span>融資貸款買 (房價約 9%):</span>
                                <span className="font-mono text-zinc-900">{(getCalculatedBuyPrice() * 0.09 / 10000).toFixed(0)} 萬日圓</span>
                              </div>
                              <p className="text-[10px] text-zinc-500 mt-1 pt-1.5 border-t border-dashed border-zinc-200 text-justify">
                                說明：諸費用包含司法書士過戶規費、登錄免許稅、不動產取得稅、印花稅與仲介服務費，如利用銀行貸款，會額外產生銀行手續費及保證料。
                              </p>
                            </div>
                          </div>

                          {/* Loan payments section */}
                          <div className="pt-3 border-t border-dashed border-zinc-200">
                            <span className="text-[#0F8F6D] font-bold block mb-1">🏦 銀行貸款與月還款額試算：</span>
                            <div className="bg-zinc-50 p-3 border border-zinc-200 space-y-1.5">
                              <div className="flex justify-between font-medium text-zinc-600 text-[11px]">
                                <span>首期自備款 (30%):</span>
                                <span className="font-mono font-bold text-zinc-800">{(getCalculatedBuyPrice() * 0.3 / 10000).toFixed(0)} 萬日圓</span>
                              </div>
                              <div className="flex justify-between font-medium text-zinc-600 text-[11px]">
                                <span>銀行貸款金額 (70%):</span>
                                <span className="font-mono font-bold text-zinc-800">{(getCalculatedBuyPrice() * 0.7 / 10000).toFixed(0)} 萬日圓</span>
                              </div>
                              <div className="flex justify-between font-bold text-[#0F8F6D] text-[11px] md:text-xs border-t border-dashed border-zinc-200 pt-1.5 mt-1">
                                <span>估計每月還款 (利率2.2% 20年):</span>
                                <span className="font-mono text-[#0F8F6D]">{getMonthlyPayment(getCalculatedBuyPrice()).toLocaleString()} 円 / 月</span>
                              </div>
                              <p className="text-[10px] text-zinc-500 mt-1 text-justify">
                                說明：以台資銀行日本分行常規貸款規格試算：年息 2.2%、貸款成數 7 成、分 20 年（240 期）本息均攤，無寬限期。
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* CTA */}
                        <div className="mt-6 pt-2 font-sans">
                          <button 
                            onClick={() => {
                              const messageText = `您好，我剛才使用了您的預算計算機，預估 ${calcDistrict} 買房。物件估計總價 ${(getCalculatedBuyPrice() / 10000).toFixed(0)} 萬日圓左右。我想諮詢關於該區中古大樓與申請房貸的相關流程，請問現在有推薦的合規物件嗎？`;
                              handleTabChange("chat");
                              handleSendMessage(undefined, messageText);
                            }}
                            className="w-full bg-[#1A2A22] text-white py-3 px-4 font-bold tracking-wider hover:bg-[#0F8F6D] cursor-pointer text-xs uppercase transition-colors"
                            id="calc-send-to-ai"
                          >
                            帶入此預算諮詢 AI 房仲 ➔
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Calculator Guide Card */}
                  <div className="bg-white border border-[#1A2A22] p-5 space-y-3 font-sans">
                    <h5 className="font-bold text-sm text-[#1A2A22] flex items-center gap-1.5">
                      <Smile className="w-4.5 h-4.5 text-[#0F8F6D]" />
                      {calcMode === "rent" ? (
                        <span>Linus 實務租房提示</span>
                      ) : (
                        <span>Linus 實務置產提示</span>
                      )}
                    </h5>
                    <div className="text-xs text-zinc-600 space-y-2.5 font-sans leading-relaxed">
                      {calcMode === "rent" ? (
                        <>
                          <p>
                            <strong>案例：</strong> 準備在新宿區（新宿區 1K 均價 10.8 萬）上班。希望步行 5 分鐘內、5年內新房、有獨立洗面台與免治馬桶，使用這台計算機勾選：
                          </p>
                          <ul className="list-disc pl-4 space-y-1 text-zinc-800 font-bold">
                            <li>108,000 円 (新宿區均價)</li>
                            <li>+5,000 円 (步行5分鐘內)</li>
                            <li>+10,000 円 (屋齡5年新房)</li>
                            <li>+10,000 円 (獨洗+免治馬桶)</li>
                          </ul>
                          <p className="border-t border-zinc-200 pt-2 text-[#0F8F6D] font-bold">
                            精算預算 = 133,000 日圓 / 月
                          </p>
                          <p className="text-[10px]">
                            實務上，東京新成屋與核心大站的溢價極高。如果您預算吃緊，強烈建議可妥協「步行時間至 12 分鐘」或「一樓房間」，能一舉幫您省下近 15,000 円的租金喔！
                          </p>
                        </>
                      ) : (
                        <>
                          <p>
                            <strong>關於買房折溢價與實務：</strong>
                          </p>
                          <p className="text-justify leading-relaxed">
                            在日本置產，<strong>「全新 (新築)」</strong>建案存在極高造價與品牌溢價，若一購入往往會立刻產生折舊。相比之下，屋齡在 15~25 年且進行過<strong>「全面現代化翻新 (リノベーション済み)」</strong>的中古公寓 (中古マンション)，內部裝潢、廚衛設備更與新成屋無異，具備最高的性價比與投資回報率！
                          </p>
                          <p className="text-justify leading-relaxed">
                            此外，如果選擇買<strong>「帶租約出售 (オーナーチェンジ)」</strong>的投資房，通常可以獲得約 10% 的價格讓利，但缺點是無法入內看房，且過戶後無法收回自住，購入前請務必做長長遠的純收租規劃。
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: AI INTELLIGENT QA */}
          {activeTab === "chat" && (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
              id="pane-chat"
            >
              <div className="border border-[#1A2A22] bg-white p-6 relative" id="chat-header-card">
                <div className="absolute top-0 right-8 bg-[#0F8F6D] text-white px-3 py-1 text-xs tracking-widest font-sans">
                  智能 AI
                </div>
                <h3 className="text-lg font-bold border-b border-[#1A2A22] pb-3 mb-3 text-[#1A2A22] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#0F8F6D]" />
                  <span>Linus ╳ 24小時 AI 智能租屋助手</span>
                </h3>
                <p className="text-xs md:text-sm text-zinc-600 leading-relaxed font-sans">
                  本系統已將日本租房大補帖（敷金、禮金、保證更新料、審查步驟、東京23區行情增減等規則）完整整合至 AI 智能房仲。歡迎直接向他提問！您可以請他幫您評估打工度假所需的存款餘額、或是解釋退租回復原狀的爭議、甚至是介紹東京合租的限制。
                </p>
              </div>

              {/* Chat Dialog Grid Container */}
              <div className="border border-[#1A2A22] bg-white h-[600px] flex flex-col justify-between overflow-hidden" id="chat-box-interface">
                {/* Message list area */}
                <div className="flex-grow overflow-y-auto p-4 md:p-6 bg-[#fafcfb] space-y-6" id="chat-messages-scroll-area">
                  {chatMessages.map((msg, index) => (
                    <div 
                      key={index} 
                      className={`flex gap-3.5 max-w-[85%] ${
                        msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                      }`}
                    >
                      {/* Avatar placeholder */}
                      <div className={`w-8 h-8 flex items-center justify-center shrink-0 font-sans text-xs border ${
                        msg.role === "user" 
                          ? "bg-zinc-800 text-[#F5F8F6] border-zinc-800" 
                          : "bg-[#0F8F6D] text-white border-[#0F8F6D]"
                      }`}>
                        {msg.role === "user" ? "客" : "林"}
                      </div>
                      
                      <div className="space-y-1.5">
                        {/* Meta sender info */}
                        <div className={`text-[10px] text-zinc-400 font-sans ${
                          msg.role === "user" ? "text-right" : "text-left"
                        }`}>
                          {msg.role === "user" ? "您的提問" : "Linus"}
                        </div>
                        
                        {/* Message content text */}
                        <div className={`p-4 text-xs md:text-sm leading-relaxed text-justify whitespace-pre-wrap border ${
                          msg.role === "user" 
                            ? "bg-white border-zinc-400 text-zinc-800" 
                            : "bg-[#fffdfa] border-[#1A2A22] text-zinc-900 shadow-[2px_2px_0px_0px_rgba(26, 42, 34,1)]"
                        }`}>
                          {formatMessageText(msg.text)}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* AI Loading indicator */}
                  {chatLoading && (
                    <div className="flex gap-3.5 max-w-[80%] mr-auto">
                      <div className="w-8 h-8 flex items-center justify-center bg-[#0F8F6D] text-white border border-[#0F8F6D] font-sans text-xs shrink-0 animate-pulse">
                        林
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] text-zinc-400 font-sans">Linus 正在調閱日本不動產知識庫...</div>
                        <div className="p-3 bg-[#fffdfa] border border-[#1A2A22] text-xs text-zinc-500 font-sans italic animate-pulse">
                          正在整理租賃規則中，請稍候片刻...
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error Notification */}
                  {chatError && (
                    <div className="p-4 border border-red-200 bg-red-50 text-red-700 text-xs font-sans leading-relaxed">
                      <strong>發生錯誤：</strong> {chatError}
                    </div>
                  )}
                </div>

                {/* Quick Recommended Prompt Suggests */}
                <div className="bg-[#F5F8F6] border-t border-zinc-200 p-3 flex flex-wrap gap-1.5 overflow-x-auto select-none" id="chat-quick-suggestions">
                  <span className="text-[10px] text-zinc-500 font-bold self-center mr-1 font-sans">熱門諮詢：</span>
                  {[
                    "打工度假存款需要準備多少？",
                    "什麼是敷金跟禮金？",
                    "租房如何預約開通水電瓦斯？",
                    "可以跟朋友一起合租公寓嗎？",
                    "海外審查需要哪些文件？"
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(undefined, p)}
                      className="bg-white hover:bg-[#fffdfb] border border-zinc-300 hover:border-[#0F8F6D] text-[11px] text-zinc-700 hover:text-[#0F8F6D] px-2.5 py-1 transition-colors cursor-pointer font-sans"
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {/* Input box form panel */}
                <form 
                  onSubmit={handleSendMessage}
                  className="border-t border-[#1A2A22] bg-white p-3 flex gap-2 font-sans"
                  id="chat-send-form"
                >
                  <input
                    type="text"
                    placeholder="向 Linus 提問日本租屋知識 (例如：打工度假租房、退租清潔費等)..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={chatLoading}
                    className="flex-grow px-4 py-2 text-sm bg-white border border-[#1A2A22] focus:outline-none focus:ring-1 focus:ring-[#0F8F6D] disabled:bg-zinc-100 disabled:text-zinc-400"
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="bg-[#1A2A22] hover:bg-[#0F8F6D] text-white px-5 py-2 text-xs font-bold uppercase tracking-wider transition-colors disabled:bg-zinc-300 disabled:text-zinc-500 flex items-center gap-1 cursor-pointer shrink-0"
                    id="chat-submit-btn"
                  >
                    <span>發送</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* TAB 4: CONTACT INFO */}
          {activeTab === "contact" && (
            <motion.div
              key="contact"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-8"
              id="pane-contact"
            >
              {/* Preface section */}
              <div className="border border-[#1A2A22] bg-white p-6" id="contact-intro">
                <h3 className="text-lg font-bold border-b border-[#1A2A22] pb-3 mb-3 text-[#1A2A22] flex items-center gap-2">
                  <Smile className="w-5 h-5 text-[#0F8F6D]" />
                  <span>東京日和 精英華人房仲團隊為您服務</span>
                </h3>
                <p className="text-xs md:text-sm text-zinc-700 leading-relaxed text-justify font-sans">
                  租屋知識只是起點。若您已經準備好來日本大展身手，或者對特定的東京都房源感到好奇、想進行詳細內見(看房)，歡迎直接聯繫 Linus 團隊。我們擁有第一手未公開物件、不問國籍審查物件，並提供「全中文、台籍仲介」一對一完整服務。
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start" id="contact-business-layout">
                {/* Business Card (Left 5 Columns) */}
                <div className="md:col-span-5 space-y-4">
                  {/* Elegant Business Card Front */}
                  <div className="border-2 border-[#1A2A22] bg-white p-6 relative shadow-[6px_6px_0px_0px_rgba(26, 42, 34,1)]" id="meishi-card">
                    {/* Double linear inner accent border */}
                    <div className="absolute inset-1.5 border border-dashed border-zinc-200 pointer-events-none" />

                    <div className="space-y-5 mt-2 relative z-10">
                      <div className="space-y-1">
                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-sans">株式会社世嘉 Seika</div>
                        <h4 className="text-xl font-bold tracking-tight text-[#1A2A22]">{linusContact.name}</h4>
                        <div className="text-xs font-bold text-[#0F8F6D] font-sans">{linusContact.title}</div>
                      </div>

                      <div className="space-y-3.5 text-xs text-zinc-700 font-sans border-t border-zinc-200 pt-4">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#1A2A22] w-20 shrink-0 tracking-wider">LINE ID</span>
                          <span className="font-mono bg-zinc-100 px-2 py-0.5 border border-zinc-200 font-semibold">{linusContact.lineId}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#1A2A22] w-20 shrink-0 tracking-wider">WECHAT</span>
                          <span className="font-mono bg-zinc-100 px-2 py-0.5 border border-zinc-200 font-semibold">{linusContact.wechatId}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#1A2A22] w-20 shrink-0 tracking-wider">EMAIL</span>
                          <span className="font-mono text-zinc-600">{linusContact.email}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#1A2A22] w-20 shrink-0 tracking-wider">PHONE</span>
                          <span className="font-mono text-zinc-600">{linusContact.phone}</span>
                        </div>
                        
                        {/* Wireframe Social Icons */}
                        <div className="flex items-center gap-3 pt-3.5 border-t border-dashed border-zinc-300">
                          <span className="font-bold text-[#1A2A22] w-20 shrink-0 tracking-wider">SOCIALS</span>
                          <div className="flex items-center gap-4">
                            <a 
                              href="https://www.facebook.com/r352410/" 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-zinc-600 hover:text-[#0F8F6D] hover:scale-110 transition-transform p-1"
                              title="Facebook"
                            >
                              <Facebook className="w-5 h-5" />
                            </a>
                            <a 
                              href="https://www.instagram.com/linus3524?igsh=ODVuNjRwMmtpdjJq&utm_source=qr" 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-zinc-600 hover:text-[#0F8F6D] hover:scale-110 transition-transform p-1"
                              title="Instagram"
                            >
                              <Instagram className="w-5 h-5" />
                            </a>
                            <a 
                              href="https://www.threads.net/@linus3524" 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-zinc-600 hover:text-[#0F8F6D] hover:scale-110 transition-transform p-1"
                              title="Threads"
                            >
                              <AtSign className="w-5 h-5" />
                            </a>
                          </div>
                        </div>
                      </div>

                      <div className="text-[10px] text-zinc-400 font-sans pt-3 border-t border-dashed border-zinc-300 leading-relaxed mt-4">
                        執照號碼：{linusContact.licenseNo}
                        <br />
                        地址：{linusContact.address}
                      </div>
                    </div>
                  </div>

                  {/* Copy Line block */}
                  <div className="border border-[#1A2A22] bg-white p-4 space-y-3 font-sans text-xs">
                    <span className="font-bold text-[#1A2A22] block">直接添加 LINE 諮詢：</span>
                    <div className="flex gap-2">
                      <div className="bg-zinc-100 flex-grow px-3 py-2 border border-zinc-300 font-mono font-bold text-center select-all">
                        {linusContact.lineId}
                      </div>
                      <button
                        onClick={handleCopyLine}
                        className="bg-[#0F8F6D] hover:bg-[#0A6D52] text-white px-4 py-2 font-bold cursor-pointer transition-colors shrink-0"
                        id="copy-line-btn-contact"
                      >
                        {copiedLine ? "已複製" : "複製 ID"}
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-relaxed text-justify">
                      💡 複製 Line ID 之後，可以在您的手機 Line 軟體中直接貼上並添加 Linus 為好友。
                    </p>
                  </div>

                  {/* Copy WeChat block */}
                  <div className="border border-[#1A2A22] bg-white p-4 space-y-3 font-sans text-xs">
                    <span className="font-bold text-[#1A2A22] block">直接添加 WeChat 諮詢：</span>
                    <div className="flex gap-2">
                      <div className="bg-zinc-100 flex-grow px-3 py-2 border border-zinc-300 font-mono font-bold text-center select-all">
                        {linusContact.wechatId}
                      </div>
                      <button
                        onClick={handleCopyWechat}
                        className="bg-[#0F8F6D] hover:bg-[#0A6D52] text-white px-4 py-2 font-bold cursor-pointer transition-colors shrink-0"
                        id="copy-wechat-btn-contact"
                      >
                        {copiedWechat ? "已複製" : "複製 ID"}
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-relaxed text-justify">
                      💡 複製 WeChat ID 之後，可以在您的手機 微信 軟體中搜尋並添加 Linus 為好友。
                    </p>
                  </div>

                  {/* Submission Info Checklist Table with Toggle Switch */}
                  <div className="border border-[#1A2A22] bg-white p-4 font-sans text-xs space-y-4">
                    {/* Toggle Selector */}
                    <div className="flex border border-[#1A2A22] text-[11px] font-bold">
                      <button
                        onClick={() => setContactFormType("rent")}
                        className={`flex-1 py-2 cursor-pointer transition-colors text-center ${
                          contactFormType === "rent"
                            ? "bg-[#1A2A22] text-white"
                            : "bg-white text-zinc-700 hover:bg-[#F5F8F6]"
                        }`}
                      >
                        🏠 租房諮詢問卷
                      </button>
                      <button
                        onClick={() => setContactFormType("buy")}
                        className={`flex-1 py-2 cursor-pointer transition-colors text-center ${
                          contactFormType === "buy"
                            ? "bg-[#1A2A22] text-white"
                            : "bg-white text-zinc-700 hover:bg-[#F5F8F6]"
                        }`}
                      >
                        🏢 買房諮詢問卷
                      </button>
                    </div>

                    {contactFormType === "rent" ? (
                      <div className="space-y-2">
                        <span className="font-bold text-[#0F8F6D] block">📋 諮詢租房時建議先準備好以下資料：</span>
                        <p className="text-zinc-600 leading-normal text-justify">
                          為了讓 Linus 能更快速地幫您向管理公司卡位優質好房，歡迎直接複製並填寫以下諮詢表傳送給 Linus 喔！
                        </p>
                        
                        <div className="bg-[#1A2A22] text-white p-4 text-[11px] leading-relaxed select-all border border-[#1A2A22] font-mono whitespace-pre-line">
                          {`1. 期望入住日期：
2. 入境日期（機票時間）或目前在日本何處：
3. 在留資格種類（是否已領工作/留學COE、打工簽證貼紙，或預計何時）：
4. 每月租房預算範圍：
5. 通勤目的地和可接受交通時間（學校或公司名稱、靠近的車站）：
6. 是否為自己住／有無同居人：
7. 其他對房子的核心條件（如：獨立洗面台、屋齡限制等）：`}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <span className="font-bold text-[#0F8F6D] block">📋 諮詢買房時建議先準備好以下資料：</span>
                        <p className="text-zinc-600 leading-normal text-justify">
                          很高興為您服務，為了讓 Linus 協助匹配合適的房產物件與試算貸款，歡迎填寫以下買房條件傳送給 Linus 喔！
                        </p>
                        
                        <div className="bg-[#1A2A22] text-white p-4 text-[11px] leading-relaxed select-all border border-[#1A2A22] font-mono whitespace-pre-line">
                          {`【買房條件問卷】
1. 全款現金或貸款：
2. 在日本有簽證／無簽證在台灣（有預計什麼時候來日本看房，或是線上看直接決定）：
3. 目標什麼時候買房：
4. 預算範圍：
5. 投資或自住：
6. 地區／車站距離：
7. 其他房子的要求（屋齡／大小／樓層）：`}
                        </div>

                        <div className="bg-red-50 p-3 border-l-2 border-[#0F8F6D] space-y-1.5 text-[11px] leading-relaxed">
                          <span className="font-bold text-[#0F8F6D] block">貸款注意事項⚠️</span>
                          <p className="text-zinc-700 text-justify">
                            在日本貸款實務上條件比較嚴格，請先幫我確認您的條件是否有達到以下其一：
                          </p>
                          <ul className="list-disc pl-4 space-y-1.5 text-zinc-600">
                            <li><strong>在日居民：</strong>在日本是否有工作簽證，且同一份工作超過 3 年且年薪 300 萬日圓以上？或來日一年以上年收 400 萬以上，且任職公司在日本登記超過 5 年。</li>
                            <li><strong>非在日居民 (純海外買方)：</strong>若無簽證在台灣，在台灣現在有沒有任何貸款？淨資產有無 3000 萬日圓（約新台幣 640 萬元）以上？且年收入有無達 1000 萬日圓（約新台幣 215 萬元）以上？</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Company Details (Right 7 Columns) */}
                <div className="md:col-span-7 border border-[#1A2A22] bg-white p-6 space-y-6">
                  <div>
                    <h4 className="font-bold text-base text-[#1A2A22] border-b border-[#1A2A22] pb-2 mb-4">
                      🎌 不動產會社基本資料
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-xs leading-relaxed text-zinc-700">
                      <div className="space-y-1">
                        <span className="text-zinc-400 block uppercase">公司名稱</span>
                        <strong className="text-zinc-900">{linusContact.companyName}</strong>
                      </div>
                      <div className="space-y-1">
                        <span className="text-zinc-400 block uppercase">東京都知事免許編號</span>
                        <strong className="text-zinc-900">{linusContact.licenseNo}</strong>
                      </div>
                      <div className="space-y-1">
                        <span className="text-zinc-400 block uppercase">營業時間與定休日</span>
                        <strong className="text-zinc-900">{linusContact.workingHours}</strong>
                      </div>
                      <div className="space-y-1">
                        <span className="text-zinc-400 block uppercase">公司官方電話</span>
                        <strong className="text-zinc-900">{linusContact.phone}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-zinc-200 pt-4 space-y-4">
                    <div>
                      <h4 className="font-bold text-sm text-[#1A2A22] mb-2 font-sans uppercase tracking-wider">
                        📍 公司所在地及交涉站點：
                      </h4>
                      <p className="text-xs text-zinc-600 mb-3 font-sans">
                        {linusContact.address}
                      </p>
                    </div>

                    {/* Google Maps Embed Iframe */}
                    <div className="border border-[#1A2A22] bg-[#F5F8F6] p-2 relative">
                      <iframe 
                        title="Seika Office Google Map"
                        src="https://maps.google.com/maps?q=東京都千代田区東神田2-6-2&t=&z=15&ie=UTF8&iwloc=&output=embed"
                        width="100%" 
                        height="260" 
                        style={{ border: 0 }} 
                        allowFullScreen={true} 
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        className="grayscale-20 brightness-95 contrast-100 border border-zinc-200"
                        id="office-google-map"
                      ></iframe>
                      <div className="mt-2 flex justify-between items-center text-xs font-sans">
                        <span className="text-[10px] text-zinc-500">📍 株式會社世嘉 Seika 本部大樓 9 樓</span>
                        <a 
                          href="https://maps.app.goo.gl/g8nHrYEdikTvvCLWA" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[#0F8F6D] hover:text-[#1A2A22] font-bold flex items-center gap-1 hover:underline transition-colors py-1 px-2 border border-zinc-200 bg-white"
                          id="open-google-map-btn"
                        >
                          <span>在 Google Maps 開啟</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                    
                    <div className="bg-[#F5F8F6] p-4 border border-zinc-200 space-y-2">
                      <span className="font-bold text-xs text-zinc-800 block font-sans">🚇 步行前往地鐵站時程：</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5 font-sans text-[11px] text-zinc-600">
                        {linusContact.stations.map((station, sIdx) => (
                          <div key={sIdx} className="flex items-center gap-1.5">
                            <span className="text-[#0F8F6D] font-bold">●</span>
                            <span>{station}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* FOOTER TERMS DEEP DIVE MODAL DIALOG */}
      <AnimatePresence>
        {selectedFee && (
          <div 
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs select-text font-serif"
            id="term-modal-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedFee(null);
            }}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border-2 border-[#1A2A22] w-full max-w-lg p-6 relative rounded-none shadow-[8px_8px_0px_0px_rgba(26, 42, 34,1)]"
              id="term-modal-content"
            >
              <button 
                onClick={() => setSelectedFee(null)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-[#1A2A22] cursor-pointer"
                id="term-modal-close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-200 pb-2.5">
                  <h4 className="text-xl font-bold text-[#1A2A22]">{selectedFee.name}</h4>
                  {selectedFee.jpName && (
                    <span className="text-xs bg-[#0F8F6D] text-white px-1.5 py-0.5 font-sans">{selectedFee.jpName}</span>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="text-sm text-zinc-800 leading-relaxed text-justify">{renderFormattedText(selectedFee.description)}</div>

                  {selectedFee.warning && (
                    <div className="bg-red-50 border-l-4 border-[#0F8F6D] p-3 text-xs text-[#0F8F6D] leading-relaxed font-sans">
                      <strong>⚠️ 注意及風險提醒：</strong>
                      <br />
                      renderFormattedText(selectedFee.warning)
                    </div>
                  )}

                  {selectedFee.keyPoints && selectedFee.keyPoints.length > 0 && (
                    <div className="bg-[#F5F8F6] p-4 border border-zinc-200 space-y-2">
                      <span className="font-bold text-xs text-zinc-800 block font-sans">🔍 實務精要細節：</span>
                      {selectedFee.keyPoints.map((point, pIdx) => (
                        <div key={pIdx} className="text-xs text-zinc-700 leading-relaxed flex items-start gap-1.5 font-sans">
                          <span className="text-[#0F8F6D] font-bold">•</span>
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-zinc-100 flex justify-end gap-3 font-sans">
                  <button
                    onClick={() => {
                      const textToAsk = `想深入了解關於 ${selectedFee.name} 的內容與實務細節`;
                      setSelectedFee(null);
                      handleTabChange("chat");
                      handleSendMessage(undefined, textToAsk);
                    }}
                    className="px-4 py-2 border border-[#1A2A22] text-zinc-800 hover:bg-[#F5F8F6] text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
                  >
                    向 AI 問答助理諮詢此費用
                  </button>
                  <button
                    onClick={() => setSelectedFee(null)}
                    className="px-4 py-2 bg-[#1A2A22] text-white hover:bg-[#0F8F6D] text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
                  >
                    關閉視窗
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer copyright block */}
      <footer className="border-t border-[#1A2A22] bg-white mt-12 py-12 px-4" id="app-footer">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <div className="space-y-1">
              <strong className="text-sm text-[#1A2A22]">LINUS住好日 ╳ 日本租房知識大補帖</strong>
              <p className="text-xs text-zinc-500 font-sans">
                版權所有 © 2026 LINUS Nice Day Japan All Rights Reserved. 株式会社世嘉 Seika (東京都知事免許第111940号)
              </p>
            </div>
            
            <div className="flex gap-4 text-xs font-sans">
              <a href="https://www.threads.net" target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-[#0F8F6D] flex items-center gap-0.5">
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
