import { useState } from "react";
import { motion } from "motion/react";
import { MapPin, Info, Smile, Building, Landmark, ChevronDown, Sparkles, LoaderCircle, AlertTriangle } from "lucide-react";
import { budgetModifiers } from "../data/rentGuideData";
import { buyBudgetModifiers } from "../data/buyHouseData";
import { rentRates, districtStations } from "../data/housingMarket";
import { RentMap } from "./RentMap";
import {
  TAMA_CITIES, hasTowerMansionSupport, getDynamicBuyModifierMultiplier,
  isRentModifierDisabled, isBuyModifierDisabled
} from "../lib/calcRules";
import { RentRecommendation, RentSearchCriteria, criteriaSummary, getRentModifierIndexes } from "../lib/rentAnalysis";
import { RentMarketReports } from "./RentMarketReports";
import { RequirementAssessment } from "./RequirementAssessment";

interface CalculatorTabProps {
  calcMode: "rent" | "buy";
  setCalcMode: (m: "rent" | "buy") => void;
  calcDistrict: string;
  setCalcDistrict: (d: string) => void;
  calcRoomType: "r1" | "k1" | "ldk1" | "ldk2";
  setCalcRoomType: (t: any) => void;
  calcModifiers: number[];
  setCalcModifiers: (m: number[]) => void;
  calcBuyModifiers: number[];
  setCalcBuyModifiers: (m: number[]) => void;
  calcStation: string;
  setCalcStation: (s: string) => void;
  handleTabChange: (tab: any) => void;
  handleSendMessage: (e?: any, customMsg?: string) => void;
}

type RentSearchFilter = "pets" | "freeInternet" | "balcony" | "secondFloor" | "twoBurners" | "cityGas";

const rentSearchFilterOptions: Array<{ key: RentSearchFilter; label: string; note: string; pressure: number }> = [
  { key: "pets", label: "可養寵物／貓", note: "物件規約與追加敷金須逐間確認", pressure: 3 },
  { key: "freeInternet", label: "免費網路／網路費包含", note: "確認速度、線路、初裝費與另簽約要求", pressure: 1.5 },
  { key: "balcony", label: "附陽台", note: "只篩選房源，不直接推定租金溢價", pressure: 1 },
  { key: "secondFloor", label: "房間位於 2 樓以上", note: "排除一樓房源，不直接增加租金", pressure: 1.5 },
  { key: "twoBurners", label: "瓦斯爐 2 口以上", note: "確認爐具類型、是否附設及廚房空間", pressure: 1.5 },
  { key: "cityGas", label: "都市瓦斯指定", note: "排除 LP 瓦斯物件；實際費率仍依供應商與契約確認", pressure: 2 }
];

const modifierAvailabilityImpact: Record<number, { supply: number; competition: number }> = {
  0: { supply: 1.5, competition: 0.5 }, 1: { supply: 0.6, competition: 0.2 }, 2: { supply: 0.6, competition: 0.2 },
  3: { supply: 1, competition: 0.3 }, 4: { supply: 1.8, competition: 0.5 }, 5: { supply: 1, competition: 0.3 },
  6: { supply: 1.8, competition: 0.5 }, 7: { supply: 1.2, competition: 0.4 }, 8: { supply: 2, competition: 0.7 },
  9: { supply: 1.2, competition: 0.5 }, 10: { supply: 1.8, competition: 1.5 }, 11: { supply: 1, competition: 0.8 },
  12: { supply: 0.8, competition: 2 }, 13: { supply: 0.4, competition: 1 }, 14: { supply: 1.3, competition: 1.6 },
  15: { supply: 2, competition: 0.5 }, 16: { supply: -1, competition: -0.2 }, 17: { supply: -1.6, competition: -0.4 },
  18: { supply: -1.2, competition: -0.2 }, 19: { supply: -1.8, competition: -0.3 }, 20: { supply: -0.8, competition: -0.2 },
  21: { supply: -0.8, competition: -0.1 }, 22: { supply: -1.5, competition: -0.2 }, 23: { supply: -1.2, competition: -0.2 },
  24: { supply: -0.7, competition: -0.1 }, 25: { supply: 2.8, competition: 2.5 }, 26: { supply: -0.7, competition: -0.2 }
};

const AI_ANALYSIS_LIMIT = 3;
const AI_ANALYSIS_WINDOW_MS = 5 * 60 * 1000;
const AI_ANALYSIS_STORAGE_KEY = "rent-ai-analysis-attempts";

function reserveClientAnalysisAttempt() {
  try {
    const now = Date.now();
    const attempts = (JSON.parse(localStorage.getItem(AI_ANALYSIS_STORAGE_KEY) || "[]") as number[])
      .filter(timestamp => now - timestamp < AI_ANALYSIS_WINDOW_MS);
    if (attempts.length >= AI_ANALYSIS_LIMIT) {
      return Math.max(1, Math.ceil((AI_ANALYSIS_WINDOW_MS - (now - attempts[0])) / 60000));
    }
    localStorage.setItem(AI_ANALYSIS_STORAGE_KEY, JSON.stringify([...attempts, now]));
    return 0;
  } catch {
    return 0;
  }
}

export function CalculatorTab(props: CalculatorTabProps) {
  const { calcMode, setCalcMode, calcDistrict, setCalcDistrict, calcRoomType, setCalcRoomType, calcModifiers, setCalcModifiers, calcBuyModifiers, setCalcBuyModifiers, calcStation, setCalcStation, handleTabChange, handleSendMessage } = props;
  const [loanRatio, setLoanRatio] = useState(70);
  const [annualRate, setAnnualRate] = useState(2.2);
  const [loanYears, setLoanYears] = useState(20);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<{ criteria: RentSearchCriteria; recommendations: RentRecommendation[]; reality: string } | null>(null);
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);
  const [rentSearchFilters, setRentSearchFilters] = useState<RentSearchFilter[]>([]);

  const analyzeRentBrief = async () => {
    if (!aiPrompt.trim() || aiLoading) return;
    const waitMinutes = reserveClientAnalysisAttempt();
    if (waitMinutes > 0) {
      setAiError(`AI 分析每 5 分鐘最多使用 3 次，請約 ${waitMinutes} 分鐘後再試。`);
      return;
    }
    setAiLoading(true);
    setAiError(null);
    setAppliedNotice(null);
    try {
      const response = await fetch("/api/rent-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      const responseText = await response.text();
      let data: any = null;
      if (responseText.trim()) {
        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error(response.ok
            ? "分析服務回傳格式異常，請重新整理頁面後再試。"
            : `分析服務暫時無法使用（HTTP ${response.status}）。`);
        }
      }
      if (!response.ok) throw new Error(data?.error || `分析服務暫時無法使用（HTTP ${response.status}）。`);
      if (!data?.criteria || !Array.isArray(data?.recommendations)) {
        throw new Error("分析服務沒有回傳完整結果，請重新整理頁面後再試。");
      }
      setAiResult(data);
    } catch (error: any) {
      setAiError(error.message || "AI 暫時無法分析，請稍後再試。");
    } finally {
      setAiLoading(false);
    }
  };

  const applyRecommendationToCalculator = (item: RentRecommendation, criteria: RentSearchCriteria) => {
    const availableStations = districtStations[item.district] || [];
    const selectedStation = item.station && availableStations.some(station => station.name === item.station)
      ? item.station
      : "none";
    const modifiers = getRentModifierIndexes(criteria).filter(index =>
      (index !== 25 || hasTowerMansionSupport(item.district)) &&
      !(index === 26 && criteria.cityGasRequired)
    );

    setCalcMode("rent");
    setCalcDistrict(item.district);
    setCalcRoomType(criteria.roomType);
    setCalcStation(selectedStation);
    setCalcModifiers(modifiers);
    setRentSearchFilters([
      criteria.petsAllowed ? "pets" : null,
      criteria.freeInternet ? "freeInternet" : null,
      criteria.balcony ? "balcony" : null,
      criteria.floorMin && criteria.floorMin >= 2 ? "secondFloor" : null,
      criteria.gasBurnersMin && criteria.gasBurnersMin >= 2 ? "twoBurners" : null,
      criteria.cityGasRequired ? "cityGas" : null
    ].filter(Boolean) as RentSearchFilter[]);
    setAppliedNotice(`已將「${item.district}${selectedStation !== "none" ? `・${selectedStation}站` : ""}」與 ${modifiers.length} 項需求帶入下方計算器。`);

    window.requestAnimationFrame(() => {
      document.getElementById("calc-engine-container")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const toggleRentSearchFilter = (filter: RentSearchFilter) => {
    if (filter === "cityGas" && !rentSearchFilters.includes("cityGas")) {
      setCalcModifiers(calcModifiers.filter(index => index !== 26));
    }
    setRentSearchFilters(current => current.includes(filter) ? current.filter(item => item !== filter) : [...current, filter]);
  };

  // Calculator Logic
  const getSelectedDistrictData = () => {
    return rentRates.find(d => d.district === calcDistrict) || rentRates.find(d => d.district === "新宿區") || rentRates[0];
  };

  const getDistrictScale = () => {
    const rate = getSelectedDistrictData();
    const isTama = TAMA_CITIES.includes(rate.district);
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

  const getAvailabilityAssessment = () => {
    const selectedFilters = rentSearchFilterOptions.filter(option => rentSearchFilters.includes(option.key));
    const filterPressure = selectedFilters.reduce((total, option) => total + option.pressure, 0);
    const modifierPressure = calcModifiers.reduce((total, index) => total + (modifierAvailabilityImpact[index]?.supply || 0), 0);
    const modifierCompetition = calcModifiers.reduce((total, index) => total + (modifierAvailabilityImpact[index]?.competition || 0), 0);
    const roomPressure = calcRoomType === "ldk2" ? 2 : calcRoomType === "ldk1" ? 1 : 0;
    const hardFilterFloor = rentSearchFilters.includes("pets") ? 3 : rentSearchFilters.includes("cityGas") ? 2 : 0;
    const supplyPressure = Math.max(hardFilterFloor, filterPressure + modifierPressure + roomPressure, 0);
    const supply = supplyPressure >= 8
      ? { label: "房源稀少", tone: "text-[#B13818]", width: "w-[18%]" }
      : supplyPressure >= 5
        ? { label: "房源偏少", tone: "text-[#B13818]", width: "w-[35%]" }
        : supplyPressure >= 2.5
          ? { label: "房源一般", tone: "text-[#7A5A1F]", width: "w-[60%]" }
          : { label: "選擇較多", tone: "text-[#0A6D52]", width: "w-[88%]" };

    const station = calcStation === "none" ? null : (districtStations[calcDistrict] || []).find(item => item.name === calcStation);
    const districtRent = parseFloat(getSelectedDistrictData().k1);
    const locationPressure = districtRent >= 11 ? 2.5 : districtRent >= 8 ? 1.5 : 0.5;
    const stationPressure = station?.type === "major" ? 2.5 : station?.type === "regular" ? 1.25 : station ? 0.5 : 0;
    const competitionScore = Math.max(0, locationPressure + stationPressure + modifierCompetition + Math.min(3, supplyPressure * 0.35));
    const competition = competitionScore >= 6
      ? { label: "競爭激烈", tone: "text-[#B13818]", width: "w-[92%]" }
      : competitionScore >= 4
        ? { label: "競爭偏高", tone: "text-[#B13818]", width: "w-[70%]" }
        : competitionScore >= 2.5
          ? { label: "競爭一般", tone: "text-[#7A5A1F]", width: "w-[48%]" }
          : { label: "競爭較低", tone: "text-[#0A6D52]", width: "w-[25%]" };

    const restrictiveModifiers = calcModifiers
      .filter(index => (modifierAvailabilityImpact[index]?.supply || 0) > 0)
      .map(index => ({ label: budgetModifiers[index].text, pressure: modifierAvailabilityImpact[index].supply }));
    const expandingConditions = calcModifiers
      .filter(index => (modifierAvailabilityImpact[index]?.supply || 0) < 0)
      .sort((a, b) => modifierAvailabilityImpact[a].supply - modifierAvailabilityImpact[b].supply)
      .slice(0, 3)
      .map(index => budgetModifiers[index].text);
    const limitingConditions = [
      ...selectedFilters.map(option => ({ label: option.label, pressure: option.pressure })),
      ...restrictiveModifiers
    ]
      .sort((a, b) => b.pressure - a.pressure)
      .slice(0, 3)
      .map(option => option.label);
    const advice = supplyPressure >= 5
      ? `目前條件疊加後會大幅縮小選擇。建議將「${limitingConditions[0] || "設備條件"}」以外的項目分成必要與可妥協兩組，並同步擴大車站、屋齡或步行範圍。`
      : supplyPressure >= 2.5
        ? "目前仍有搜尋空間，但符合全部條件的物件不會平均出現在每個車站；建議預先排好條件優先順序。"
        : "目前篩選條件保有彈性，較容易比較租金、通勤與屋況後再做取捨。";

    return { supply, competition, limitingConditions, expandingConditions, advice, selectedCount: selectedFilters.length, modifierCount: calcModifiers.length };
  };

  const toggleModifier = (index: number) => {
    if (calcModifiers.includes(index)) {
      setCalcModifiers(calcModifiers.filter(i => i !== index));
    } else {
      if (index === 26) setRentSearchFilters(current => current.filter(filter => filter !== "cityGas"));
      let nextModifiers = [...calcModifiers, index];
      if (index === 25) {
        nextModifiers = nextModifiers.filter(i => i !== 9 && i !== 21);
      }
      setCalcModifiers(nextModifiers);
    }
  };

  const getBuyYieldRate = () => {
    const dData = getSelectedDistrictData();
    const isTama = TAMA_CITIES.includes(dData.district);
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
    const loanAmount = price * (loanRatio / 100);
    const n = loanYears * 12;
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
    
    const isTama = TAMA_CITIES.includes(rate.district);
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

  return (
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
                <h3 className="text-base font-bold border-b border-[#1A2A22] pb-2.5 mb-3 text-[#1A2A22] flex items-center gap-2 font-sans">
                  <span className="material-symbols-rounded shrink-0 select-none text-[19px] leading-none text-[#0F8F6D]" aria-hidden="true">calculate</span>
                  {calcMode === "rent" ? (
                    <span>日本租屋預算與條件可行性評估</span>
                  ) : (
                    <span>日本購屋總價與貸款情境評估</span>
                  )}
                </h3>
                <p className="text-xs md:text-[13px] text-zinc-600 leading-6 text-justify font-sans">
                  {calcMode === "rent" ? (
                    "在日本找房前，先了解自己的預算能換到什麼樣的生活。這套工具參考 SUUMO、LIFULL HOME’S、At Home 等主要租屋平台的公開募集資訊與市場報告，並結合 Linus 的實務經驗，協助您整理地區、格局與設備之間的取捨。選好條件後，我們會估算月租、初期費用、房源供給與競爭程度，讓您更有方向地找到真正負擔得起的房子。樣本較少的城市會標示為模型參考；實際租金與空室狀況仍以當期募集內容為準。"
                  ) : (
                    "準備在日本購屋，我們會依您選擇的地區、格局與物件條件，整理總價概算、初期資金及不同貸款情境下的每月還款，協助您在看房前先掌握負擔範圍。實際成交價與核貸條件仍以個別物件及金融機構審查為準。"
                  )}
                </p>
              </div>

              {calcMode === "rent" && (
                <section className="border border-[#1A2A22] bg-white" aria-labelledby="ai-rent-title">
                  <div className="grid grid-cols-1 lg:grid-cols-12">
                    <div className="lg:col-span-5 bg-[#EAF3EE] p-6 md:p-8 border-b lg:border-b-0 lg:border-r border-[#1A2A22]">
                      <div className="flex items-center gap-2 text-[#0F8F6D] text-xs font-bold tracking-[0.16em] uppercase mb-3 font-sans">
                        <Sparkles className="w-4 h-4" /> AI Market Reality Check
                      </div>
                      <h3 id="ai-rent-title" className="text-xl md:text-2xl font-bold text-[#1A2A22] leading-snug mb-3">
                        說出理想生活，找到真正住得起的選擇
                      </h3>
                      <p className="text-sm text-[#3F5147] leading-relaxed mb-5 font-sans">
                        告訴我們您的預算、通勤地點與理想條件，我們會整理合適的地區與車站，並估算合理租金區間。若條件與預算有落差，也會清楚說明如何調整，讓找房更接近理想生活。
                      </p>
                      <textarea
                        value={aiPrompt}
                        onChange={event => setAiPrompt(event.target.value)}
                        maxLength={1000}
                        rows={6}
                        placeholder="例如：預算含管理費 10 萬円，想住東急東橫線，1K 25㎡以上，要獨立洗面台、電梯，走路 10 分鐘內。"
                        className="w-full resize-y border border-[#1A2A22] bg-white p-4 text-sm text-[#1A2A22] placeholder:text-[#8A9590] focus:outline-none focus:ring-2 focus:ring-[#0F8F6D]/30 font-sans"
                      />
                      <div className="mt-3 flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={analyzeRentBrief}
                          disabled={!aiPrompt.trim() || aiLoading}
                          className="flex-1 min-h-12 bg-[#1A2A22] text-white px-5 text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#0F8F6D] disabled:opacity-45 disabled:cursor-not-allowed transition-colors font-sans"
                        >
                          {aiLoading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                          {aiLoading ? "正在對標市場…" : "AI 分析適合地區與預算"}
                        </button>
                        <button
                          onClick={() => setAiPrompt("預算含管理費 10 萬円，想住東急東橫線沿線，1K、25㎡以上，需要獨立洗面台和電梯，車站步行 10 分鐘內。")}
                          className="min-h-12 border border-[#1A2A22] bg-white px-4 text-xs font-bold text-[#1A2A22] hover:bg-[#F5F8F6] font-sans"
                        >
                          套用範例
                        </button>
                      </div>
                      <p className="mt-2 text-[9px] text-[#66736C] font-sans">為保護分析服務額度，同一使用者每 5 分鐘最多分析 3 次。</p>
                      {aiError && <p className="mt-3 text-xs text-[#B13818] bg-[#FBDFD2] p-3 font-sans">{aiError}</p>}
                      {aiResult && (
                        <RequirementAssessment criteria={aiResult.criteria} recommendations={aiResult.recommendations} />
                      )}
                    </div>

                    <div className="lg:col-span-7 p-6 md:p-8 min-h-[360px] flex flex-col">
                      {!aiResult ? (
                        <div className="h-full flex-1 flex items-center justify-center text-center py-10">
                          <div className="max-w-sm">
                            <div className="w-12 h-12 mx-auto mb-4 border border-[#A8D5C2] bg-[#F5F8F6] flex items-center justify-center">
                              <MapPin className="w-5 h-5 text-[#0F8F6D]" />
                            </div>
                            <p className="font-bold text-[#1A2A22] mb-2">分析後會列出 6 個搜尋方向</p>
                            <p className="text-xs text-[#8A9590] leading-relaxed font-sans">包含地區／車站、估算中心值、合理波動區間，以及與預算的落差。</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {criteriaSummary(aiResult.criteria).map(label => (
                              <span key={label} className="bg-[#EAF3EE] border border-[#A8D5C2] px-2.5 py-1 text-[11px] font-bold text-[#0A6D52] font-sans">{label}</span>
                            ))}
                          </div>
                          <div className={`mb-5 p-3 border flex gap-2 text-xs leading-relaxed font-sans ${aiResult.recommendations.some(item => item.fit === "預算內") ? "border-[#A8D5C2] bg-[#F5F8F6] text-[#3F5147]" : "border-[#E94E2B] bg-[#FBDFD2] text-[#B13818]"}`}>
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{aiResult.reality}</span>
                          </div>
                          <RentMarketReports
                            recommendations={aiResult.recommendations}
                            criteria={aiResult.criteria}
                            onApply={(item) => applyRecommendationToCalculator(item, aiResult.criteria)}
                          />
                          {appliedNotice && (
                            <p className="mt-3 border border-[#A8D5C2] bg-[#EAF3EE] px-3 py-2 text-xs font-bold text-[#0A6D52] font-sans" role="status">
                              {appliedNotice}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </section>
              )}

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
                        <div className="relative">
                          <select
                            value={calcDistrict}
                            onChange={(e) => {
                              setCalcDistrict(e.target.value);
                              setCalcModifiers([]); // reset rent modifiers
                              setCalcBuyModifiers([]); // reset buy modifiers
                            }}
                            className="h-12 w-full appearance-none bg-white border border-[#1A2A22] px-3 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F8F6D] rounded-none cursor-pointer font-sans"
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
                          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1A2A22]" aria-hidden="true" />
                        </div>
                      </div>

                      {/* Room Type Picker */}
                      <div className="space-y-1.5 font-sans">
                        <label className="text-xs font-bold text-zinc-700">選擇格局大小 (套房/1LDK/2LDK)：</label>
                        <div className="grid h-12 grid-cols-4 border border-[#1A2A22]">
                          {[
                            { id: "r1", label: "1R" },
                            { id: "k1", label: "1K" },
                            { id: "ldk1", label: "1LDK" },
                            { id: "ldk2", label: "2LDK" }
                          ].map(type => (
                            <button
                              key={type.id}
                              onClick={() => setCalcRoomType(type.id as any)}
                              className={`h-full border-r border-[#1A2A22] last:border-r-0 text-xs font-bold cursor-pointer transition-colors ${
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
                          <div className="relative">
                            <select
                              value={calcStation}
                              onChange={(e) => setCalcStation(e.target.value)}
                              className="h-12 w-full appearance-none bg-white border border-[#1A2A22] px-3 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F8F6D] rounded-none cursor-pointer font-sans"
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
                            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1A2A22]" aria-hidden="true" />
                          </div>
                          <p className="text-[10px] text-zinc-500 leading-normal">
                            * 車站分類是本站的簡化估算標籤，部分為行政區邊界周邊常用車站，不代表車站地址一定位於該行政區；實際租金仍受步行距離、路線、急行停靠與街區差異影響。
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
                    {getSelectedDistrictData().verificationStatus === "modeled_unverified" && (
                      <div className="border-l-4 border-[#E94E2B] bg-[#FFF9ED] px-3 py-2.5 text-xs leading-relaxed text-[#66583D] font-sans">
                        <strong className="text-[#B13818]">待查證參考：</strong>此城市尚未完成當地募集行情的逐項查證，目前僅以鄰近主要城市建立模型參考，不應視為當地實際平均租金。
                      </div>
                    )}
                    {getSelectedDistrictData().verificationStatus === "researched_limited" && (
                      <div className="border-l-4 border-[#E94E2B] bg-[#FFF9ED] px-3 py-2.5 text-xs leading-relaxed text-[#66583D] font-sans">
                        <strong className="text-[#B13818]">樣本有限：</strong>此區域已查找當地行情來源，但可用招租樣本仍不足，目前改以鄰近主要城市行情提供參考。
                      </div>
                    )}
                    {getSelectedDistrictData().sourceDate && getSelectedDistrictData().verificationStatus === "verified_source" && (
                      <div className="text-[10px] text-[#3F5147] bg-[#EAF3EE] border border-[#A8D5C2] px-3 py-2 font-sans flex flex-wrap justify-between gap-2">
                        <span>資料基準：{getSelectedDistrictData().sourceNote}</span>
                        <span className="font-mono">{getSelectedDistrictData().sourceDate} · 含管理費／共益費</span>
                      </div>
                    )}
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
                      {calcMode === "rent" ? "步驟二：租金加減價與房源篩選" : "步驟二：勾選想要的附加條件 (買房折溢價項目)"}
                    </h4>
                    
                    {calcMode === "rent" ? (
                      <div className="space-y-4 font-sans text-xs">
                        <div className="bg-[#F5F8F6] border-l-4 border-[#0F8F6D] px-3 py-2.5">
                          <span className="font-bold text-[#1A2A22]">A. 會影響租金的加減價條件</span>
                          <p className="mt-1 text-[10px] text-[#66736C]">依地區行情尺度換算後，直接反映在下方月租估算。</p>
                        </div>
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
                                    {originalIdx === 26 && (
                                      <div className="mt-1 text-[9px] leading-relaxed text-[#B13818]">租金折讓情境估算；LP 瓦斯使用費可能較高，總居住成本不一定下降。</div>
                                    )}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-2.5 border-t border-dashed border-[#DDE3DF] pt-5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-bold text-[#1A2A22] text-xs tracking-wider">B. 只影響房源數量的篩選條件</span>
                            <span className="bg-[#F2F8FA] border border-[#D6EAF0] px-2 py-1 text-[9px] font-bold text-[#3F626D]">不直接計入租金</span>
                          </div>
                          <p className="text-[10px] leading-relaxed text-[#66736C]">這些條件不直接加入月租，但會即時反映在右側「房源供給與競爭評估」，讓您看見條件疊加後的找房難度。</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {rentSearchFilterOptions.map(option => {
                              const isSelected = rentSearchFilters.includes(option.key);
                              return (
                                <label key={option.key} className={`p-2.5 border flex items-start gap-2.5 cursor-pointer transition-colors ${isSelected ? "border-[#0F8F6D] bg-[#EAF3EE]" : "border-[#DDE3DF] bg-white hover:border-[#A8D5C2]"}`}>
                                  <input type="checkbox" checked={isSelected} onChange={() => toggleRentSearchFilter(option.key)} className="mt-0.5 accent-[#0F8F6D]" />
                                  <span>
                                    <span className="block font-semibold text-[#1A2A22]">{option.label}</span>
                                    <span className="mt-0.5 block text-[9px] leading-relaxed text-[#66736C]">{option.note}</span>
                                  </span>
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
                          2026市場推估房租預算：
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
                            （約合 <strong>{(getCalculatedRent() / 10000).toFixed(2)}</strong> 萬日圓／月；此為固定係數概算，不是即時市場中位數。）
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

                          {/* Relative listing supply and competition assessment */}
                          {(() => {
                            const assessment = getAvailabilityAssessment();
                            return (
                              <div className="border-t border-dashed border-zinc-300 pt-4">
                                <div className="mb-3 flex items-end justify-between gap-3">
                                  <div>
                                    <span className="block font-bold text-[#0F8F6D]">房源供給與競爭評估</span>
                                    <span className="mt-0.5 block text-[10px] leading-relaxed text-[#66736C]">依地區熱度、房型與已勾選條件推估相對找房難度</span>
                                  </div>
                                  <span className="shrink-0 border border-[#DDE3DF] bg-[#F5F8F6] px-2 py-1 text-[9px] font-bold text-[#3F5147]">篩選 {assessment.selectedCount}・租金條件 {assessment.modifierCount}</span>
                                </div>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                  <div className="border border-[#DDE3DF] bg-white p-3">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[10px] font-bold text-[#66736C]">符合條件的房源量</span>
                                      <span className={`text-xs font-bold ${assessment.supply.tone}`}>{assessment.supply.label}</span>
                                    </div>
                                    <div className="mt-2 h-2 overflow-hidden bg-[#EDF1EE]">
                                      <div className={`h-full bg-[#0F8F6D] ${assessment.supply.width}`} />
                                    </div>
                                    <p className="mt-1.5 text-[9px] text-[#8A9590]">長條越長，代表可選房源相對較多</p>
                                  </div>
                                  <div className="border border-[#DDE3DF] bg-white p-3">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[10px] font-bold text-[#66736C]">熱門物件競爭程度</span>
                                      <span className={`text-xs font-bold ${assessment.competition.tone}`}>{assessment.competition.label}</span>
                                    </div>
                                    <div className="mt-2 h-2 overflow-hidden bg-[#EDF1EE]">
                                      <div className={`h-full bg-[#E94E2B] ${assessment.competition.width}`} />
                                    </div>
                                    <p className="mt-1.5 text-[9px] text-[#8A9590]">綜合地區租金、站點熱度與條件稀缺性</p>
                                  </div>
                                </div>
                                {assessment.limitingConditions.length > 0 && (
                                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                                    <span className="mr-1 text-[10px] font-bold text-[#3F5147]">主要限縮條件</span>
                                    {assessment.limitingConditions.map(condition => (
                                      <span key={condition} className="border border-[#DCC8A1] bg-[#FFF9ED] px-2 py-1 text-[9px] font-bold text-[#7A5A1F]">{condition}</span>
                                    ))}
                                  </div>
                                )}
                                {assessment.expandingConditions.length > 0 && (
                                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                    <span className="mr-1 text-[10px] font-bold text-[#3F5147]">擴大供給條件</span>
                                    {assessment.expandingConditions.map(condition => (
                                      <span key={condition} className="border border-[#A8D5C2] bg-[#EAF3EE] px-2 py-1 text-[9px] font-bold text-[#0A6D52]">{condition}</span>
                                    ))}
                                  </div>
                                )}
                                <p className="mt-3 border-l-2 border-[#0F8F6D] bg-[#F5F8F6] px-3 py-2.5 text-[10px] leading-relaxed text-[#3F5147]">{assessment.advice}</p>
                                <p className="mt-2 text-[9px] leading-relaxed text-[#8A9590]">此為條件組合的相對難度評估，不是即時空室數量或成交速度保證。</p>
                              </div>
                            );
                          })()}

                          {/* Estimation of Initial Fees */}
                          <div className="pt-4 border-t border-dashed border-zinc-300">
                            <span className="text-[#0F8F6D] font-bold block mb-1">🗂 估算初期費用區間：</span>
                            <div className="bg-[#F5F8F6] p-3 border border-zinc-200 space-y-1.5">
                              <div className="flex justify-between font-bold text-zinc-800 font-sans text-[11px] md:text-xs">
                                <span>較精簡情境（租金 × 4）：</span>
                                <span className="font-mono text-xs text-zinc-900">{(getCalculatedRent() * 4).toLocaleString()} 円</span>
                              </div>
                              <div className="flex justify-between font-bold text-[#0F8F6D] font-sans text-[11px] md:text-xs">
                                <span>一般預算情境（租金 × 5）：</span>
                                <span className="font-mono text-xs text-[#0F8F6D]">{(getCalculatedRent() * 5).toLocaleString()} 円</span>
                              </div>
                              <div className="flex justify-between font-bold text-zinc-800 font-sans text-[11px] md:text-xs">
                                <span>費用較多情境（租金 × 6）：</span>
                                <span className="font-mono text-xs text-zinc-900">{(getCalculatedRent() * 6).toLocaleString()} 円</span>
                              </div>
                              <p className="text-[10px] text-zinc-500 mt-2.5 text-justify leading-relaxed border-t border-zinc-200/60 pt-2 font-sans">
                                💡 這是快速準備預算的倍數概算，不是費用報價。是否有禮金、押金、預付租金、保證費、保險與鑰匙費，均以特定物件精算書為準。
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* CTA */}
                        <div className="mt-6 pt-2 font-sans">
                          <button 
                            onClick={() => {
                              const roomTypeLabel = ({ r1: "1R", k1: "1K／1DK", ldk1: "1LDK／2K／2DK", ldk2: "2LDK" } as const)[calcRoomType];
                              const stationPart = calcStation !== "none" ? `${calcStation}站附近` : "尚未指定車站";
                              const upgradeConditions = calcModifiers.filter(index => budgetModifiers[index]?.type === "plus").map(index => budgetModifiers[index].text).join("、");
                              const compromiseConditions = calcModifiers.filter(index => budgetModifiers[index]?.type === "minus").map(index => budgetModifiers[index].text).join("、");
                              const searchFilters = rentSearchFilterOptions.filter(option => rentSearchFilters.includes(option.key)).map(option => option.label).join("、");
                              const messageText = `您好，我剛才使用租金預算計算器，請依以下完整條件協助我找房：\n- 地區：${calcDistrict}\n- 車站：${stationPart}\n- 格局：${roomTypeLabel}\n- 推估月租：¥${getCalculatedRent().toLocaleString()}\n${upgradeConditions ? `- 希望條件：${upgradeConditions}\n` : ""}${compromiseConditions ? `- 可接受的妥協：${compromiseConditions}\n` : ""}${searchFilters ? `- 房源篩選條件：${searchFilters}\n` : ""}請分析這組條件的找房難度、應優先保留與可放寬的項目，並告訴我還需要補充哪些資料。若要推薦即時房源，請先確認我的簽證、工作、收入、入住日期與居住人數，不要自行假設。`;
                              handleTabChange("chat");
                              handleSendMessage(undefined, messageText);
                            }}
                            className="w-full bg-[#1A2A22] text-white py-3 px-4 font-bold tracking-wider hover:bg-[#0F8F6D] cursor-pointer text-xs uppercase transition-colors"
                            id="calc-send-to-ai"
                          >
                            帶入此條件找 AI 找房顧問 ➔
                          </button>
                        </div>

                        {/* Rent Disclaimer */}
                        <div className="mt-4 pt-3 border-t border-zinc-100 text-[10px] text-zinc-400 font-sans leading-relaxed text-justify">
                          * 方法與限制：租金概算採網站整理的行政區／格局基準值，再套用固定條件係數；並非逐筆募集資料的即時中位數。結果不含共益費時應另行加計，實際金額受面積、樓層、屋況、座向、契約條件與供需影響。
                        </div>
                      </>
                    ) : (
                      <>
                        <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2 font-sans">
                          條件式預算概算中心值：
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
                            （概算區間約 <strong>{(getCalculatedBuyPrice() * 0.85 / 10000).toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>～<strong>{(getCalculatedBuyPrice() * 1.15 / 10000).toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong> 萬日圓；中心值不是鑑價或成交保證。）
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
                              <div className="grid grid-cols-3 gap-2 pb-2 mb-2 border-b border-dashed border-zinc-200">
                                <label className="text-[10px] text-zinc-600">貸款成數 (%)
                                  <input type="number" min="0" max="100" step="5" value={loanRatio} onChange={e => setLoanRatio(Math.min(100, Math.max(0, Number(e.target.value))))} className="mt-1 w-full border border-zinc-300 bg-white px-2 py-1 text-xs" />
                                </label>
                                <label className="text-[10px] text-zinc-600">年利率 (%)
                                  <input type="number" min="0" max="20" step="0.1" value={annualRate} onChange={e => setAnnualRate(Math.min(20, Math.max(0, Number(e.target.value))))} className="mt-1 w-full border border-zinc-300 bg-white px-2 py-1 text-xs" />
                                </label>
                                <label className="text-[10px] text-zinc-600">貸款年限
                                  <input type="number" min="1" max="50" step="1" value={loanYears} onChange={e => setLoanYears(Math.min(50, Math.max(1, Number(e.target.value))))} className="mt-1 w-full border border-zinc-300 bg-white px-2 py-1 text-xs" />
                                </label>
                              </div>
                              <div className="flex justify-between font-medium text-zinc-600 text-[11px]">
                                <span>首期自備款 ({100 - loanRatio}%):</span>
                                <span className="font-mono font-bold text-zinc-800">{(getCalculatedBuyPrice() * (1 - loanRatio / 100) / 10000).toFixed(0)} 萬日圓</span>
                              </div>
                              <div className="flex justify-between font-medium text-zinc-600 text-[11px]">
                                <span>銀行貸款金額 ({loanRatio}%):</span>
                                <span className="font-mono font-bold text-zinc-800">{(getCalculatedBuyPrice() * loanRatio / 100 / 10000).toFixed(0)} 萬日圓</span>
                              </div>
                              <div className="flex justify-between font-bold text-[#0F8F6D] text-[11px] md:text-xs border-t border-dashed border-zinc-200 pt-1.5 mt-1">
                                <span>每月本息試算 ({annualRate}%／{loanYears}年):</span>
                                <span className="font-mono text-[#0F8F6D]">{getMonthlyPayment(getCalculatedBuyPrice()).toLocaleString()} 円 / 月</span>
                              </div>
                              <p className="text-[10px] text-zinc-500 mt-1 text-justify">
                                本試算採本息平均攤還，不含寬限期、銀行手續費、保證費、提前清償費或利率變動。可自行調整參數；是否核貸與實際條件由金融機構個案審查。
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* CTA */}
                        <div className="mt-6 pt-2 font-sans">
                          <button 
                            onClick={() => {
                              const buyConditions = calcBuyModifiers.map(index => buyBudgetModifiers[index]?.text).filter(Boolean).join("、");
                              const messageText = `您好，我剛才使用購屋預算計算器，請依以下完整條件協助我評估：\n- 地區：${calcDistrict}\n- 估計物件總價：${(getCalculatedBuyPrice() / 10000).toFixed(0)} 萬日圓\n- 預計貸款比例：${loanRatio}%\n- 試算利率與年期：${annualRate}%／${loanYears} 年\n${buyConditions ? `- 已選條件：${buyConditions}\n` : ""}請分析這組條件的購屋可行性、貸款與初期費用風險，以及我還需要補充哪些個人與物件資料。`;
                              handleTabChange("chat");
                              handleSendMessage(undefined, messageText);
                            }}
                            className="w-full bg-[#1A2A22] text-white py-3 px-4 font-bold tracking-wider hover:bg-[#0F8F6D] cursor-pointer text-xs uppercase transition-colors"
                            id="calc-send-to-ai"
                          >
                            帶入此條件找 AI 找房顧問 ➔
                          </button>
                        </div>

                        {/* Buy Disclaimer */}
                        <div className="mt-4 pt-3 border-t border-zinc-100 text-[10px] text-zinc-400 font-sans leading-relaxed text-justify">
                          * 方法與限制：總價以區域租金基準 ÷ 假設表面投報率，再套用實務折溢價係數估算，並非直接對實價登錄逐筆統計或銀行鑑價。±15% 僅為閱讀概算的波動帶；實際價格還會受面積、樓層、座向、權利、管理、修繕、災害風險及交易背景影響。
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
  );
}
