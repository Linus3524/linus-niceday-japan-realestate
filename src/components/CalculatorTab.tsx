import { useState } from "react";
import { motion } from "motion/react";
import { track } from "@vercel/analytics";
import { MapPin, Info, Smile, Building, Landmark, ChevronDown, Sparkles, LoaderCircle, Receipt, Lightbulb, Calculator, Plus, X, AlertTriangle } from "lucide-react";
import { budgetModifiers, getBudgetModifier, getBudgetModifierPrice, type BudgetModifierId } from "../data/rentGuideData";
import { buyBudgetModifiers, getBuyModifier, type BuyModifierId } from "../data/buyHouseData";
import { rentRates, districtStations } from "../data/housingMarket";
import { getBuyMarketEstimate, getModeledBuyYieldRate, getOfficialBuyEstimate } from "../data/buyMarket";
import { MLIT_API_CREDIT } from "../data/marketDataSources";
import type { StationInfo } from "../data/stationData";
import { RentMap } from "./RentMap";
import {
  TAMA_CITIES, hasTowerMansionSupport, getDynamicBuyModifierMultiplier,
  isRentModifierDisabled, isBuyModifierDisabled
} from "../lib/calcRules";
import { RentRecommendation, RentSearchCriteria, buildRentRecommendations, getRentModifierIds, ROOM_TYPE_LABEL, ROOM_TYPE_DETAIL_LABEL, ROOM_TYPE_INCLUDES_LABEL, type RoomType } from "../lib/rentAnalysis";
import { RentMarketReports } from "./RentMarketReports";
import { RequirementAssessment } from "./RequirementAssessment";
import { toJapaneseLineName, toJapanesePlaceName, toJapanesePrefectureName, toJapaneseStationName } from "../lib/transit";
import { renderFormattedText } from "../lib/format";
import { RentCriteriaSummary } from "./RentCriteriaSummary";

interface CalculatorTabProps {
  calcMode: "rent" | "buy";
  setCalcMode: (m: "rent" | "buy") => void;
  calcDistrict: string;
  setCalcDistrict: (d: string) => void;
  calcRoomType: RoomType;
  setCalcRoomType: (t: RoomType) => void;
  calcModifiers: BudgetModifierId[];
  setCalcModifiers: (m: BudgetModifierId[]) => void;
  calcBuyModifiers: BuyModifierId[];
  setCalcBuyModifiers: (m: BuyModifierId[]) => void;
  calcStation: string;
  setCalcStation: (s: string) => void;
  handleTabChange: (tab: any) => void;
  handleSendMessage: (e?: any, customMsg?: string) => void;
}

type RentSearchFilter = "pets" | "freeInternet" | "noKeyMoney" | "noDeposit" | "balcony" | "secondFloor" | "twoBurners" | "cityGas";

const rentSearchFilterOptions: Array<{ key: RentSearchFilter; label: string; note: string; pressure: number }> = [
  { key: "pets", label: "可養寵物", note: "物件規約與追加敷金須逐間確認", pressure: 3 },
  { key: "freeInternet", label: "免費網路／網路費包含", note: "確認速度、線路、初裝費與另簽約要求", pressure: 1.5 },
  { key: "noKeyMoney", label: "免禮金", note: "可降低初期費用；熱門地區符合物件通常較少", pressure: 2 },
  { key: "noDeposit", label: "免押金／免敷金", note: "仍可能另收退房清潔費或定額償卻費", pressure: 1.5 },
  { key: "balcony", label: "附陽台", note: "只篩選房源，不直接推定租金溢價", pressure: 1 },
  { key: "secondFloor", label: "房間位於 2 樓以上", note: "排除一樓房源，不直接增加租金", pressure: 1.5 },
  { key: "twoBurners", label: "瓦斯爐 2 口以上", note: "確認爐具類型、是否附設及廚房空間", pressure: 1.5 },
  { key: "cityGas", label: "都市瓦斯指定", note: "排除 LP 瓦斯物件；實際費率仍依供應商與契約確認", pressure: 2 }
];

const normalizeStructureOption = (value?: string | null) =>
  /木造/i.test(value || "") ? "木造"
    : /SRC/i.test(value || "") ? "SRC造"
      : /RC/i.test(value || "") ? "RC造"
        : /(?:鉄骨|鐵骨|S造)/i.test(value || "") ? "鐵骨造"
          : "";

// 資料來源會把同一路線的特急、急行、各停拆成不同字串；表單層級只選路線，
// 因此一律轉成畫面上的正式路線名稱後再比對與去重。
const normalizeGuidedLineName = (line: string) => toJapaneseLineName(line)
  .replace(/[\s・･（）()\-]/g, "")
  .replace(/各停|急行|快速|特急/g, "")
  .toLowerCase();

const sameGuidedLine = (left: string, right: string) =>
  normalizeGuidedLineName(left) === normalizeGuidedLineName(right);

// 月租預算以 0.5 萬円為一級，涵蓋一般租屋到高價物件，最高 100 萬円。
const RENT_BUDGET_OPTIONS = Array.from({ length: 197 }, (_, index) => 20000 + index * 5000);
const RENT_BUDGET_MAX = RENT_BUDGET_OPTIONS[RENT_BUDGET_OPTIONS.length - 1];
const normalizeRentBudgetSelection = (value: number) =>
  Math.min(RENT_BUDGET_MAX, Math.max(RENT_BUDGET_OPTIONS[0], Math.round(value / 5000) * 5000));

const guidedChoiceClass = (selected: boolean) =>
  `inline-flex items-center justify-center border px-3 py-2 text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00a174] focus-visible:ring-offset-2 ${
    selected
      ? "border-[#007D5A] bg-[#00A174] text-white shadow-[0_4px_10px_rgba(0,161,116,0.20)] hover:bg-[#008F67]"
      : "border-[#D4DDD8] bg-white text-zinc-600 hover:border-[#7DBEAA] hover:bg-[#F3FAF7] hover:text-[#007D5A]"
  }`;

const guidedSelectChevronClass =
  "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600 peer-disabled:text-zinc-400";

const districtAreaGroup = (district: string) =>
  rentRates.find(rate => rate.district === district)?.areaGroup || null;

const stationAreaGroups = (stationName: string) => {
  const normalized = stationName.trim().replace(/[駅站\s]/g, "").toLowerCase();
  if (!normalized) return new Set<string>();
  const groups = new Set<string>();
  for (const [district, stations] of Object.entries(districtStations)) {
    if (stations.some(station => station.name.trim().replace(/[駅站\s]/g, "").toLowerCase() === normalized)) {
      const group = districtAreaGroup(district);
      if (group) groups.add(group);
    }
  }
  return groups;
};

/**
 * 每個加減價條件對「供給量」與「競爭度」的影響。
 * supply 為正代表會篩掉房源、縮小選擇；為負代表放寬條件、選擇變多。
 * 以 id 為索引，新增條件時在這裡補一筆即可，漏補只會少算壓力、不會錯位。
 */
const modifierAvailabilityImpact: Partial<Record<BudgetModifierId, { supply: number; competition: number }>> = {
  washbasin_and_bidet: { supply: 1.5, competition: 0.5 },
  washbasin_only: { supply: 0.6, competition: 0.2 },
  bidet_only: { supply: 0.6, competition: 0.2 },
  compact_25sqm: { supply: 1, competition: 0.3 },
  compact_30sqm: { supply: 1.8, competition: 0.5 },
  ldk1_35sqm: { supply: 1, competition: 0.3 },
  ldk1_40sqm: { supply: 1.8, competition: 0.5 },
  ldk2_50sqm: { supply: 1.2, competition: 0.4 },
  ldk2_60sqm: { supply: 2, competition: 0.7 },
  autolock_elevator: { supply: 1.2, competition: 0.5 },
  age_within_5y: { supply: 1.8, competition: 1.5 },
  age_within_10y: { supply: 1, competition: 0.8 },
  major_station: { supply: 0.8, competition: 2 },
  minor_station: { supply: 0.4, competition: 1 },
  walk_within_5min: { supply: 1.3, competition: 1.6 },
  furnished: { supply: 2, competition: 0.5 },
  walk_11_15min: { supply: -1, competition: -0.2 },
  walk_15_20min: { supply: -1.6, competition: -0.4 },
  age_over_30y: { supply: -1.2, competition: -0.2 },
  age_over_40y: { supply: -1.8, competition: -0.3 },
  no_elevator_4f: { supply: -0.8, competition: -0.2 },
  first_floor: { supply: -0.8, competition: -0.1 },
  compact_15_18sqm: { supply: -1.5, competition: -0.2 },
  wooden: { supply: -1.2, competition: -0.2 },
  washitsu: { supply: -0.7, competition: -0.1 },
  tower: { supply: 2.8, competition: 2.5 },
  lp_gas: { supply: -0.7, competition: -0.2 },
  // 乾濕分離：市場上仍以 3 點式ユニットバス為大宗，指定分離會篩掉相當比例的房源，
  // 而且是外國人與年輕租客都想要的條件，競爭也高。
  separate_bath: { supply: 1.6, competition: 1.2 },
  // 指定 2 樓以上：只排除 1 樓，壓縮幅度小；治安與採光考量讓它略微搶手。
  floor_2f_plus: { supply: 0.6, competition: 0.4 }
};

export function CalculatorTab(props: CalculatorTabProps) {
  const { calcMode, setCalcMode, calcDistrict, setCalcDistrict, calcRoomType, setCalcRoomType, calcModifiers, setCalcModifiers, calcBuyModifiers, setCalcBuyModifiers, calcStation, setCalcStation, handleTabChange, handleSendMessage } = props;
  const districtDisplayName = toJapanesePlaceName(calcDistrict);
  const stationDisplayName = calcStation !== "none" ? toJapaneseStationName(calcStation) : null;
  const [loanRatio, setLoanRatio] = useState(70);
  const [annualRate, setAnnualRate] = useState(2.2);
  const [loanYears, setLoanYears] = useState(20);
  const [showBuyFeeDetails, setShowBuyFeeDetails] = useState(false);
  const [showInitialFeeDetails, setShowInitialFeeDetails] = useState(false);
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);
  const [rentInputMode, setRentInputMode] = useState<"ai" | "structured">("ai");
  const [rentMonthlyBudgetMin, setRentMonthlyBudgetMin] = useState(80000);
  const [rentMonthlyBudget, setRentMonthlyBudget] = useState(120000);
  const [rentUpfrontCash, setRentUpfrontCash] = useState(0);
  const [guidedLine, setGuidedLine] = useState("");
  const [guidedDistrictSelections, setGuidedDistrictSelections] = useState<string[]>([calcDistrict]);
  const [guidedLineSelections, setGuidedLineSelections] = useState<string[]>([]);
  const [guidedStationSelections, setGuidedStationSelections] = useState<string[]>([]);
  const [guidedStationDraft, setGuidedStationDraft] = useState("");
  const [locationGuardNotice, setLocationGuardNotice] = useState<string | null>(null);
  const [guidedCommuteStation, setGuidedCommuteStation] = useState("");
  const [guidedCommuteMinutes, setGuidedCommuteMinutes] = useState(45);
  const [guidedAutoLock, setGuidedAutoLock] = useState(false);
  const [guidedElevator, setGuidedElevator] = useState(false);
  const [guidedStructure, setGuidedStructure] = useState("");
  const [guidedMinArea, setGuidedMinArea] = useState(0);
  const [guidedAgeMax, setGuidedAgeMax] = useState(0);
  const [buyAvailableCash, setBuyAvailableCash] = useState(15000000);
  const [buyMonthlyPaymentBudget, setBuyMonthlyPaymentBudget] = useState(180000);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiInputLoading, setAiInputLoading] = useState(false);
  const [aiInputError, setAiInputError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<{ criteria: RentSearchCriteria; recommendations: RentRecommendation[]; advisorAdvice?: string | null } | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisNotice, setAnalysisNotice] = useState<string | null>(null);
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);
  const [rentSearchFilters, setRentSearchFilters] = useState<RentSearchFilter[]>([]);

  const applyRecommendationToCalculator = (item: RentRecommendation, criteria: RentSearchCriteria) => {
    const availableStations = districtStations[item.district] || [];
    const selectedStation = item.station && availableStations.some(station => station.name === item.station)
      ? item.station
      : "none";
    const selectedStationInfo = selectedStation === "none"
      ? null
      : availableStations.find(station => station.name === selectedStation) || null;
    const modifiers = getRentModifierIds(criteria).filter(id =>
      (id !== "tower" || hasTowerMansionSupport(item.district)) &&
      !(id === "lp_gas" && criteria.cityGasRequired)
    );

    setCalcMode("rent");
    setCalcDistrict(item.district);
    setGuidedDistrictSelections([item.district]);
    setGuidedStationSelections(selectedStation === "none" ? [] : [selectedStation]);
    setCalcRoomType(criteria.roomType);
    setGuidedMinArea(criteria.areaMin || 0);
    setGuidedAgeMax(criteria.buildingAgeMax || 0);
    setGuidedCommuteStation(criteria.commuteStation || "");
    setGuidedCommuteMinutes(criteria.commuteMinutes || 45);
    setGuidedAutoLock(Boolean(criteria.autoLock));
    setGuidedElevator(Boolean(criteria.elevator));
    setGuidedStructure(normalizeStructureOption(criteria.structure));
    setCalcStation(selectedStation);
    const appliedLine = [...(criteria.lines || []), criteria.line]
      .find(line => line && selectedStationInfo?.lines.some(stationLine => sameGuidedLine(stationLine, line)))
      || selectedStationInfo?.lines[0] || "";
    setGuidedLine(appliedLine);
    setGuidedLineSelections(appliedLine ? [appliedLine] : []);
    setCalcModifiers(modifiers);
    setRentMonthlyBudgetMin(criteria.minBudget ? normalizeRentBudgetSelection(criteria.minBudget) : 0);
    if (criteria.maxBudget) setRentMonthlyBudget(normalizeRentBudgetSelection(criteria.maxBudget));
    setRentUpfrontCash(criteria.initialCostBudget || 0);
    setRentSearchFilters([
      criteria.petsAllowed ? "pets" : null,
      criteria.freeInternet ? "freeInternet" : null,
      criteria.noKeyMoney ? "noKeyMoney" : null,
      criteria.noDeposit ? "noDeposit" : null,
      criteria.balcony ? "balcony" : null,
      criteria.floorMin && criteria.floorMin >= 2 ? "secondFloor" : null,
      criteria.gasBurnersMin && criteria.gasBurnersMin >= 2 ? "twoBurners" : null,
      criteria.cityGasRequired ? "cityGas" : null
    ].filter(Boolean) as RentSearchFilter[]);
    track("calculator-applied", { mode: calcMode, roomType: criteria.roomType });
    setAppliedNotice(`已將「${toJapanesePlaceName(item.district)}${selectedStation !== "none" ? `・${toJapaneseStationName(selectedStation)}駅` : ""}」及需求條件同步帶入上方表單與下方租金條件。`);
    setShowAdvancedTools(true);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.getElementById("calc-engine-container")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  };

  const toggleRentSearchFilter = (filter: RentSearchFilter) => {
    if (filter === "cityGas" && !rentSearchFilters.includes("cityGas")) {
      setCalcModifiers(calcModifiers.filter(id => id !== "lp_gas"));
    }
    if (filter === "secondFloor") {
      if (rentSearchFilters.includes("secondFloor")) {
        setCalcModifiers(calcModifiers.filter(id => id !== "floor_2f_plus"));
      } else {
        setCalcModifiers([...calcModifiers.filter(id => id !== "first_floor" && id !== "floor_2f_plus"), "floor_2f_plus"]);
      }
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
  
  // 傳入 id 時一律以共用取價函式解析金額，房型相關的溢價（例如塔樓）才會與推薦引擎一致。
  // 車站等級那類不屬於 budgetModifiers 的調整，直接傳金額、不帶 id。
  const getModifierPrice = (modPrice: number, id?: BudgetModifierId) => {
    const scale = getDistrictScale();
    const modifier = id ? getBudgetModifier(id) : undefined;
    const price = modifier ? getBudgetModifierPrice(modifier, calcRoomType) : modPrice;
    // Round to nearest 1000
    return Math.round((price * scale) / 1000) * 1000;
  };

  const getCalculatedRent = () => {
    const dData = getSelectedDistrictData();
    const rateString = dData[calcRoomType as keyof typeof dData] as string;
    let rent = parseFloat(rateString) * 10000; // in Yen
    
    calcModifiers.forEach(id => {
      const mod = getBudgetModifier(id);
      if (mod) rent += getModifierPrice(mod.price, id);
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
    const modifierPressure = calcModifiers.reduce((total, id) => total + (modifierAvailabilityImpact[id]?.supply || 0), 0);
    const modifierCompetition = calcModifiers.reduce((total, id) => total + (modifierAvailabilityImpact[id]?.competition || 0), 0);
    const modeledAreaCeiling = calcRoomType === "ldk3" ? 85 : calcRoomType === "ldk2" ? 60 : calcRoomType === "ldk1" ? 40 : 30;
    const extraAreaPressure = guidedMinArea > modeledAreaCeiling
      ? Math.min(2.5, (guidedMinArea - modeledAreaCeiling) / 5 * 0.45)
      : 0;
    const extraAgePressure = guidedAgeMax === 3 ? 0.6
      : guidedAgeMax === 7 ? 0.4
        : guidedAgeMax === 15 ? 0.6
          : guidedAgeMax === 20 ? 0.4
            : guidedAgeMax === 25 ? 0.25
              : guidedAgeMax === 30 ? 0.15
                : 0;
    const structuredPressure = extraAreaPressure + extraAgePressure;
    const roomPressure = calcRoomType === "ldk3" ? 3 : calcRoomType === "ldk2" ? 2 : calcRoomType === "ldk1" ? 1 : 0;
    const hardFilterFloor = rentSearchFilters.includes("pets") ? 3 : rentSearchFilters.includes("cityGas") ? 2 : 0;
    const supplyPressure = Math.max(hardFilterFloor, filterPressure + modifierPressure + structuredPressure + roomPressure, 0);
    const supply = supplyPressure >= 8
      ? { label: "房源稀少", tone: "text-[#B13818]", width: "w-[18%]" }
      : supplyPressure >= 5
        ? { label: "房源偏少", tone: "text-[#B13818]", width: "w-[35%]" }
        : supplyPressure >= 2.5
          ? { label: "房源一般", tone: "text-[#7A5A1F]", width: "w-[60%]" }
          : { label: "選擇較多", tone: "text-[#007d5a]", width: "w-[88%]" };

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
          : { label: "競爭較低", tone: "text-[#007d5a]", width: "w-[25%]" };

    const restrictiveModifiers = calcModifiers
      .filter(id => (modifierAvailabilityImpact[id]?.supply || 0) > 0)
      .map(id => ({ label: getBudgetModifier(id)?.text || id, pressure: modifierAvailabilityImpact[id]!.supply }));
    const structuredLimits = [
      extraAreaPressure > 0 ? { label: `${guidedMinArea}㎡以上`, pressure: extraAreaPressure } : null,
      extraAgePressure > 0 ? { label: `屋齡 ${guidedAgeMax} 年內`, pressure: extraAgePressure } : null,
    ].filter(Boolean) as Array<{ label: string; pressure: number }>;
    const expandingConditions = calcModifiers
      .filter(id => (modifierAvailabilityImpact[id]?.supply || 0) < 0)
      .sort((a, b) => (modifierAvailabilityImpact[a]?.supply || 0) - (modifierAvailabilityImpact[b]?.supply || 0))
      .slice(0, 3)
      .map(id => getBudgetModifier(id)?.text || id);
    const limitingConditions = [
      ...selectedFilters.map(option => ({ label: option.label, pressure: option.pressure })),
      ...restrictiveModifiers,
      ...structuredLimits
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

  const toggleModifier = (id: BudgetModifierId) => {
    const nextArea = areaValueByModifier[id];
    const nextAge = ageValueByModifier[id];
    if (calcModifiers.includes(id)) {
      setCalcModifiers(calcModifiers.filter(other => other !== id));
      if (id === "autolock_elevator") {
        setGuidedAutoLock(false);
        setGuidedElevator(false);
      }
      if (id === "wooden" && guidedStructure === "木造") setGuidedStructure("");
      if (nextArea !== undefined) setGuidedMinArea(0);
      if (nextAge !== undefined) setGuidedAgeMax(0);
      if (id === "floor_2f_plus") setRentSearchFilters(current => current.filter(filter => filter !== "secondFloor"));
    } else {
      if (id === "lp_gas") setRentSearchFilters(current => current.filter(filter => filter !== "cityGas"));
      if (id === "autolock_elevator") {
        setGuidedAutoLock(true);
        setGuidedElevator(true);
      }
      if (id === "wooden") {
        setGuidedStructure("木造");
        setGuidedAutoLock(false);
        setGuidedElevator(false);
      }
      let nextModifiers = [...calcModifiers, id];
      // 塔樓本來就含自動門電梯、也不會有一樓住戶，選了塔樓就把這兩項取消。
      if (id === "tower") {
        nextModifiers = nextModifiers.filter(other => other !== "autolock_elevator" && other !== "first_floor");
      }
      if (id === "floor_2f_plus") {
        nextModifiers = nextModifiers.filter(other => other !== "first_floor");
        setRentSearchFilters(current => current.includes("secondFloor") ? current : [...current, "secondFloor"]);
      }
      if (id === "first_floor") {
        nextModifiers = nextModifiers.filter(other => other !== "floor_2f_plus");
        setRentSearchFilters(current => current.filter(filter => filter !== "secondFloor"));
      }
      if (nextArea !== undefined) setGuidedMinArea(nextArea);
      if (nextAge !== undefined) setGuidedAgeMax(nextAge);
      setCalcModifiers(nextModifiers);
    }
  };

  const washbasinSelected = calcModifiers.some(id => id === "washbasin_and_bidet" || id === "washbasin_only");
  const bidetSelected = calcModifiers.some(id => id === "washbasin_and_bidet" || id === "bidet_only");
  const toggleBathroomFacility = (facility: "washbasin" | "bidet") => {
    const nextWashbasin = facility === "washbasin" ? !washbasinSelected : washbasinSelected;
    const nextBidet = facility === "bidet" ? !bidetSelected : bidetSelected;
    const withoutBathroomFacilities = calcModifiers.filter(id =>
      id !== "washbasin_and_bidet" && id !== "washbasin_only" && id !== "bidet_only"
    );
    const nextId: BudgetModifierId | null = nextWashbasin && nextBidet
      ? "washbasin_and_bidet"
      : nextWashbasin
        ? "washbasin_only"
        : nextBidet
          ? "bidet_only"
          : null;
    setCalcModifiers(nextId ? [...withoutBathroomFacilities, nextId] : withoutBathroomFacilities);
  };

  const toggleBuildingSecurity = (feature: "autoLock" | "elevator") => {
    const nextAutoLock = feature === "autoLock" ? !guidedAutoLock : guidedAutoLock;
    const nextElevator = feature === "elevator" ? !guidedElevator : guidedElevator;
    setGuidedAutoLock(nextAutoLock);
    setGuidedElevator(nextElevator);
    const withoutCombinedModifier = calcModifiers.filter(id => id !== "autolock_elevator");
    const shouldApplyCombinedPrice = (nextAutoLock || nextElevator) && !calcModifiers.includes("tower");
    setCalcModifiers(shouldApplyCombinedPrice ? [...withoutCombinedModifier, "autolock_elevator"] : withoutCombinedModifier);
  };

  const selectGuidedStructure = (structure: string) => {
    setGuidedStructure(structure);
    const withoutWooden = calcModifiers.filter(id => id !== "wooden");
    if (structure === "木造") {
      setGuidedAutoLock(false);
      setGuidedElevator(false);
      setCalcModifiers([...withoutWooden.filter(id => id !== "autolock_elevator" && id !== "tower"), "wooden"]);
      return;
    }
    setCalcModifiers(withoutWooden);
  };

  const getCalculatedBuyPrice = () => {
    const dData = getSelectedDistrictData();
    const rateString = dData[calcRoomType as keyof typeof dData] as string;
    const rentYen = parseFloat(rateString) * 10000;
    const basePrice = getBuyMarketEstimate({
      region: dData.region,
      district: dData.district,
      layout: calcRoomType,
      monthlyRentYen: rentYen
    }).basePriceYen;
    
    let multiplierSum = 1.0;
    calcBuyModifiers.forEach(id => {
      multiplierSum += getDynamicBuyModifierMultiplier(id, calcDistrict);
    });
    
    const finalPrice = basePrice * multiplierSum;
    return Math.max(Math.round(finalPrice / 100000) * 100000, 3000000);
  };

  const toggleBuyModifier = (id: BuyModifierId) => {
    if (calcBuyModifiers.includes(id)) {
      setCalcBuyModifiers(calcBuyModifiers.filter(other => other !== id));
    } else {
      setCalcBuyModifiers([...calcBuyModifiers, id]);
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

  const getDistrictBuyPrice = (district: string, roomType: RoomType) => {
    const rate = rentRates.find(d => d.district === district) || rentRates[0];
    const rateString = (rate[roomType] || rate.ldk2) as string;
    const rentYen = parseFloat(rateString) * 10000;
    const estimate = getBuyMarketEstimate({
      region: rate.region,
      district: rate.district,
      layout: roomType,
      monthlyRentYen: rentYen
    });
    return Math.max(Math.round(estimate.basePriceYen / 100000) * 10, 300);
  };

  const getSelectedBuyMarketEstimate = () => {
    const rate = getSelectedDistrictData();
    const monthlyRentYen = parseFloat((rate[calcRoomType] || rate.ldk2) as string) * 10000;
    return getBuyMarketEstimate({
      region: rate.region,
      district: rate.district,
      layout: calcRoomType,
      monthlyRentYen
    });
  };

  const replaceRentModifierGroup = (group: BudgetModifierId[], nextId?: BudgetModifierId) => {
    const next = calcModifiers.filter(id => !group.includes(id));
    if (nextId) next.push(nextId);
    setCalcModifiers(next);
  };

  const areaModifierGroup: BudgetModifierId[] = [
    "compact_25sqm", "compact_30sqm", "ldk1_35sqm", "ldk1_40sqm", "ldk2_50sqm", "ldk2_60sqm"
  ];
  const areaValueByModifier: Partial<Record<BudgetModifierId, number>> = {
    compact_25sqm: 25, compact_30sqm: 30,
    ldk1_35sqm: 35, ldk1_40sqm: 40,
    ldk2_50sqm: 50, ldk2_60sqm: 60,
  };
  const ageValueByModifier: Partial<Record<BudgetModifierId, number>> = {
    age_within_5y: 5,
    age_within_10y: 10,
  };
  const areaOptions = calcRoomType === "r1" || calcRoomType === "k1"
    ? [15, 20, 25, 30, 35, 40]
    : calcRoomType === "ldk1"
      ? [25, 30, 35, 40, 45, 50, 55, 60]
      : calcRoomType === "ldk2"
        ? [35, 40, 45, 50, 55, 60, 65, 70, 75, 80]
        : [50, 60, 70, 80, 90, 100, 110, 120];
  const guidedWalkMinutes = calcModifiers.includes("walk_within_5min") ? 5
    : calcModifiers.includes("walk_15_20min") ? 20
      : calcModifiers.includes("walk_11_15min") ? 15
        : 0;
  const guidedFloorMin = calcModifiers.includes("floor_2f_plus") ? 2 : 0;
  const areaModifierFor = (area: number): BudgetModifierId | undefined => {
    if ((calcRoomType === "r1" || calcRoomType === "k1") && area >= 30) return "compact_30sqm";
    if ((calcRoomType === "r1" || calcRoomType === "k1") && area >= 25) return "compact_25sqm";
    if (calcRoomType === "ldk1" && area >= 40) return "ldk1_40sqm";
    if (calcRoomType === "ldk1" && area >= 35) return "ldk1_35sqm";
    if (calcRoomType === "ldk2" && area >= 60) return "ldk2_60sqm";
    if (calcRoomType === "ldk2" && area >= 50) return "ldk2_50sqm";
    return undefined;
  };

  const selectGuidedRoomType = (type: RoomType) => {
    setCalcRoomType(type);
    setGuidedMinArea(0);
    replaceRentModifierGroup(areaModifierGroup);
  };

  const selectGuidedArea = (area: number) => {
    setGuidedMinArea(area);
    replaceRentModifierGroup(areaModifierGroup, areaModifierFor(area));
  };

  const selectGuidedWalk = (minutes: number) => {
    const id: BudgetModifierId | undefined = minutes <= 5
      ? "walk_within_5min"
      : minutes >= 20
        ? "walk_15_20min"
        : minutes >= 15
          ? "walk_11_15min"
          : undefined;
    replaceRentModifierGroup(["walk_within_5min", "walk_11_15min", "walk_15_20min"], id);
  };

  const selectGuidedAge = (years: number) => {
    setGuidedAgeMax(years);
    const id: BudgetModifierId | undefined = years > 0 && years <= 5
      ? "age_within_5y"
      : years > 0 && years <= 10
        ? "age_within_10y"
        : undefined;
    replaceRentModifierGroup(["age_within_5y", "age_within_10y", "age_over_30y", "age_over_40y"], id);
  };

  const selectGuidedFloor = (floor: number) => {
    replaceRentModifierGroup(["floor_2f_plus", "first_floor"], floor >= 2 ? "floor_2f_plus" : undefined);
    setRentSearchFilters(current => floor >= 2
      ? current.includes("secondFloor") ? current : [...current, "secondFloor"]
      : current.filter(filter => filter !== "secondFloor"));
  };

  const selectGuidedStation = (stationName: string) => {
    setCalcStation(stationName);
    setGuidedStationSelections(stationName === "none" ? [] : [stationName]);
    if (stationName === "none") return;
    const station = (districtStations[calcDistrict] || []).find(item => item.name === stationName);
    if (!station) return;
    const nextLine = station.lines.some(line => sameGuidedLine(line, guidedLine)) ? guidedLine : station.lines[0] || "";
    setGuidedLine(nextLine);
    setGuidedLineSelections(nextLine ? [nextLine] : []);
  };

  const districtSelectionGroup = guidedDistrictSelections.length
    ? districtAreaGroup(guidedDistrictSelections[0])
    : null;

  const validateCommuteCompatibility = (commuteStation = guidedCommuteStation) => {
    if (!commuteStation.trim() || !guidedDistrictSelections.length) return null;
    const commuteGroups = stationAreaGroups(commuteStation);
    if (!commuteGroups.size || !districtSelectionGroup || commuteGroups.has(districtSelectionGroup)) return null;
    return `通勤地點「${toJapaneseStationName(commuteStation)}」與目前選擇的 ${districtSelectionGroup} 地區不在同一生活圈，請調整希望地區或通勤地點。`;
  };

  const addGuidedDistrict = (district: string) => {
    if (!district || guidedDistrictSelections.includes(district)) return;
    if (guidedDistrictSelections.length >= 4) {
      setLocationGuardNotice("希望地區最多選 4 個，避免搜尋範圍過度分散。");
      return;
    }
    const nextGroup = districtAreaGroup(district);
    if (districtSelectionGroup && nextGroup && districtSelectionGroup !== nextGroup) {
      setLocationGuardNotice(`目前已選 ${districtSelectionGroup} 地區，不能再加入 ${nextGroup}；請先移除原地區再切換生活圈。`);
      return;
    }
    const commuteGroups = stationAreaGroups(guidedCommuteStation);
    if (commuteGroups.size && nextGroup && !commuteGroups.has(nextGroup)) {
      setLocationGuardNotice(`「${toJapanesePlaceName(district)}」與通勤地點不在同一生活圈，已阻止加入。`);
      return;
    }
    const next = [...guidedDistrictSelections, district];
    setGuidedDistrictSelections(next);
    if (next.length === 1) setCalcDistrict(district);
    setLocationGuardNotice(null);
  };

  const removeGuidedDistrict = (district: string) => {
    const nextDistricts = guidedDistrictSelections.filter(item => item !== district);
    const allowedStations = new Set(nextDistricts.flatMap(item => (districtStations[item] || []).map(station => station.name)));
    const allowedLines = nextDistricts.flatMap(item => (districtStations[item] || []).flatMap(station => station.lines));
    const nextStations = guidedStationSelections.filter(station => allowedStations.has(station));
    const nextLines = guidedLineSelections.filter(line => allowedLines.some(allowed => sameGuidedLine(allowed, line)));
    setGuidedDistrictSelections(nextDistricts);
    setGuidedStationSelections(nextStations);
    setGuidedLineSelections(nextLines);
    if (nextDistricts.length) setCalcDistrict(nextDistricts[0]);
    setCalcStation(nextStations.find(station => (districtStations[nextDistricts[0]] || []).some(item => item.name === station)) || "none");
    setGuidedLine(nextLines[0] || "");
    setLocationGuardNotice(null);
  };

  const addGuidedLine = (line: string) => {
    if (!line || guidedLineSelections.some(selected => sameGuidedLine(selected, line))) return;
    if (guidedLineSelections.length >= 4) {
      setLocationGuardNotice("希望線路最多選 4 條，請保留最優先的路線。");
      return;
    }
    const next = [...guidedLineSelections, line];
    setGuidedLineSelections(next);
    setGuidedLine(next[0]);
    setLocationGuardNotice(null);
  };

  const removeGuidedLine = (line: string) => {
    const next = guidedLineSelections.filter(item => item !== line);
    setGuidedLineSelections(next);
    setGuidedLine(next[0] || "");
  };

  const addGuidedStation = () => {
    const stationName = guidedStationDraft.trim().replace(/[駅站]$/, "");
    const matchedStation = guidedLocationStationOptions.find(station =>
      station.name === stationName || toJapaneseStationName(station.name) === stationName
    );
    if (!matchedStation) {
      setLocationGuardNotice("請從目前地區與線路提供的車站清單中選擇，避免加入不相干的車站。");
      return;
    }
    if (guidedStationSelections.includes(matchedStation.name)) {
      setGuidedStationDraft("");
      return;
    }
    if (guidedStationSelections.length >= 6) {
      setLocationGuardNotice("希望車站最多選 6 個，請保留最想住的車站。");
      return;
    }
    const next = [...guidedStationSelections, matchedStation.name];
    const stationDistrict = guidedDistrictSelections.find(district =>
      (districtStations[district] || []).some(station => station.name === matchedStation.name)
    );
    setGuidedStationSelections(next);
    setGuidedStationDraft("");
    if (stationDistrict) {
      setCalcDistrict(stationDistrict);
      setCalcStation(matchedStation.name);
    }
    if (!guidedLineSelections.length && matchedStation.lines[0]) {
      setGuidedLine(matchedStation.lines[0]);
    }
    setLocationGuardNotice(null);
  };

  const removeGuidedStation = (stationName: string) => {
    const next = guidedStationSelections.filter(item => item !== stationName);
    setGuidedStationSelections(next);
    const nextPrimary = next.find(station => (districtStations[calcDistrict] || []).some(item => item.name === station));
    setCalcStation(nextPrimary || "none");
  };

  const quickLoanRatio = Math.max(0, Math.min(1, loanRatio / 100));
  const quickLoanMonths = Math.max(1, loanYears * 12);
  const quickMonthlyRate = Math.max(0, annualRate / 100 / 12);
  const maxLoanByPayment = quickMonthlyRate === 0
    ? buyMonthlyPaymentBudget * quickLoanMonths
    : buyMonthlyPaymentBudget * (Math.pow(1 + quickMonthlyRate, quickLoanMonths) - 1)
      / (quickMonthlyRate * Math.pow(1 + quickMonthlyRate, quickLoanMonths));
  const buyFeeRate = quickLoanRatio > 0 ? 0.09 : 0.07;
  const maxPriceByCash = buyAvailableCash / Math.max(0.01, 1 - quickLoanRatio + buyFeeRate);
  const maxPriceByPayment = quickLoanRatio > 0 ? maxLoanByPayment / quickLoanRatio : Number.POSITIVE_INFINITY;
  const affordableBuyPrice = Math.max(0, Math.floor(Math.min(maxPriceByCash, maxPriceByPayment) / 100000) * 100000);
  const affordableBuyLow = Math.floor((affordableBuyPrice * 0.9) / 100000) * 100000;
  const affordableBuyFees = affordableBuyPrice * buyFeeRate;
  const affordableDownPayment = affordableBuyPrice * (1 - quickLoanRatio);
  const roomTypeLabel = ROOM_TYPE_DETAIL_LABEL[calcRoomType];
  const formatManYenNumber = (value: number, maximumFractionDigits = 1) =>
    (value / 10000).toLocaleString("zh-TW", { maximumFractionDigits });
  const formatManYen = (value: number, maximumFractionDigits = 1) =>
    `${formatManYenNumber(value, maximumFractionDigits)} 萬円`;
  const guidedLocationStations: StationInfo[] = guidedDistrictSelections.flatMap(district => districtStations[district] || []);
  const guidedLineOptions: string[] = Array.from(
    new Map(guidedLocationStations.flatMap(station => station.lines)
      .map(line => [normalizeGuidedLineName(line), line] as const)).values()
  )
    .sort((a, b) => a.localeCompare(b, "ja"));
  const guidedLocationStationOptions: StationInfo[] = Array.from(
    new Map<string, StationInfo>(guidedLocationStations
      .filter(station => !guidedLineSelections.length || station.lines.some(line =>
        guidedLineSelections.some(selected => sameGuidedLine(line, selected))))
      .map(station => [station.name, station] as [string, StationInfo])).values()
  ).sort((a, b) => toJapaneseStationName(a.name).localeCompare(toJapaneseStationName(b.name), "ja"));
  const commuteStationOptions = Array.from(new Set(
    Object.values(districtStations).flatMap(stations => stations.map(station => station.name))
  )).sort((a, b) => toJapaneseStationName(a).localeCompare(toJapaneseStationName(b), "ja"));
  const buildStructuredRentCriteria = (): RentSearchCriteria => ({
    roomType: calcRoomType,
    areaMin: guidedMinArea || null,
    minBudget: rentMonthlyBudgetMin > 0
      ? Math.min(rentMonthlyBudgetMin, rentMonthlyBudget)
      : null,
    maxBudget: rentMonthlyBudget,
    budgetIncludesFees: true,
    // 逐項選擇不再要求客人先猜初期費用上限；自由文字有主動提到時仍由 AI 解析。
    initialCostBudget: null,
    district: guidedDistrictSelections[0] || null,
    districts: guidedDistrictSelections,
    line: guidedLineSelections[0] || null,
    lines: guidedLineSelections,
    station: guidedStationSelections[0] || null,
    stations: guidedStationSelections,
    walkMinutes: guidedWalkMinutes || null,
    commuteStation: guidedCommuteStation || null,
    commuteMinutes: guidedCommuteStation && guidedCommuteMinutes ? guidedCommuteMinutes : null,
    buildingAgeMax: guidedAgeMax || null,
    floorMin: guidedFloorMin || null,
    separateBath: calcModifiers.includes("separate_bath"),
    washbasin: calcModifiers.some(id => id === "washbasin_and_bidet" || id === "washbasin_only"),
    bidet: calcModifiers.some(id => id === "washbasin_and_bidet" || id === "bidet_only"),
    autoLock: guidedAutoLock,
    elevator: guidedElevator,
    structure: guidedStructure || null,
    furnished: calcModifiers.includes("furnished"),
    furnishedPriority: calcModifiers.includes("furnished") ? "required" : null,
    tower: calcModifiers.includes("tower"),
    lpGasAccepted: calcModifiers.includes("lp_gas"),
    petsAllowed: rentSearchFilters.includes("pets"),
    freeInternet: rentSearchFilters.includes("freeInternet"),
    noKeyMoney: rentSearchFilters.includes("noKeyMoney"),
    noDeposit: rentSearchFilters.includes("noDeposit"),
    balcony: rentSearchFilters.includes("balcony"),
    gasBurnersMin: rentSearchFilters.includes("twoBurners") ? 2 : null,
    cityGasRequired: rentSearchFilters.includes("cityGas")
  });

  const analyzeStructuredRent = async () => {
    if (analysisLoading) return;
    const compatibilityNotice = validateCommuteCompatibility();
    if (compatibilityNotice) {
      setLocationGuardNotice(compatibilityNotice);
      return;
    }
    const criteria = buildStructuredRentCriteria();
    const baseRecommendations = buildRentRecommendations(criteria);
    setAppliedNotice(null);
    setAnalysisNotice(null);
    setAiResult(current => current ? { ...current, advisorAdvice: null } : current);
    setAnalysisLoading(true);
    track("rent-analysis-submitted", { source: "structured-form", recommendationCount: baseRecommendations.length, hasCommuteStation: Boolean(criteria.commuteStation) });
    try {
      const response = await fetch("/api/rent-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ criteria })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.criteria || !Array.isArray(data?.recommendations)) {
        throw new Error(data?.error || "AI 顧問暫時無法完成分析");
      }
      setAiResult({ criteria: data.criteria, recommendations: data.recommendations, advisorAdvice: data.advisorAdvice || null });
    } catch (error: any) {
      setAiResult({ criteria, recommendations: baseRecommendations, advisorAdvice: null });
      setAnalysisNotice(`${error?.message || "AI 顧問暫時無法完成分析"}；已先保留可行性與車站推薦，不顯示固定文字冒充 AI 意見。`);
    } finally {
      setAnalysisLoading(false);
    }
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.getElementById("guided-rent-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  };

  const syncCriteriaToForm = (criteria: RentSearchCriteria) => {
    const requestedDistricts = Array.from(new Set([...(criteria.districts || []), criteria.district].filter(Boolean) as string[]))
      .filter(district => rentRates.some(rate => rate.district === district));
    const requestedStations = Array.from(new Set([...(criteria.stations || []), criteria.station].filter(Boolean) as string[]));
    const stationDistricts = requestedStations.flatMap(stationName =>
      Object.entries(districtStations)
        .filter(([, stations]) => stations.some(station => station.name === stationName))
        .map(([district]) => district)
    );
    const allCandidateDistricts = Array.from(new Set([...requestedDistricts, ...stationDistricts]));
    const parsedCommuteStation = criteria.commuteStation || criteria.commuteStations?.[0] || "";
    const parsedCommuteGroups = stationAreaGroups(parsedCommuteStation);
    const candidateGroups = allCandidateDistricts.map(districtAreaGroup).filter(Boolean) as string[];
    const preferredGroup = candidateGroups.find(group => parsedCommuteGroups.has(group)) || candidateGroups[0] || null;
    const compatibleDistricts = allCandidateDistricts
      .filter(district => !preferredGroup || districtAreaGroup(district) === preferredGroup)
      .slice(0, 4);
    const nextDistrictSelections = compatibleDistricts.length ? compatibleDistricts : [calcDistrict];
    const nextDistrict = nextDistrictSelections[0];
    const allowedStationNames = new Set(nextDistrictSelections.flatMap(district =>
      (districtStations[district] || []).map(station => station.name)
    ));
    const nextStationSelections = requestedStations.filter(station => allowedStationNames.has(station)).slice(0, 6);
    const nextStation = nextStationSelections.find(station =>
      (districtStations[nextDistrict] || []).some(item => item.name === station)
    ) || "none";
    const availableLines = Array.from(new Map(nextDistrictSelections.flatMap(district =>
      (districtStations[district] || []).flatMap(station => station.lines)
    ).map(line => [normalizeGuidedLineName(line), line] as const)).values());
    const requestedLines = Array.from(new Set([...(criteria.lines || []), criteria.line].filter(Boolean) as string[]));
    const nextLineSelections = requestedLines.flatMap(requestedLine => {
      const key = normalizeGuidedLineName(requestedLine);
      return availableLines.filter(line => {
        const candidate = normalizeGuidedLineName(line);
        return candidate === key || candidate.includes(key) || key.includes(candidate);
      });
    }).filter((line, index, lines) => lines.findIndex(candidate => sameGuidedLine(candidate, line)) === index).slice(0, 4);
    const modifiers = getRentModifierIds(criteria).filter(id =>
      (id !== "tower" || hasTowerMansionSupport(nextDistrict)) &&
      !(id === "lp_gas" && criteria.cityGasRequired)
    );

    setCalcDistrict(nextDistrict);
    setGuidedDistrictSelections(nextDistrictSelections);
    setCalcRoomType(criteria.roomType);
    setCalcStation(nextStation);
    setGuidedStationSelections(nextStationSelections);
    setGuidedStationDraft("");
    setGuidedLineSelections(nextLineSelections);
    setGuidedLine(nextLineSelections[0] || "");
    setGuidedCommuteStation(criteria.commuteStation || criteria.commuteStations?.[0] || "");
    setGuidedCommuteMinutes(criteria.commuteMinutes || 45);
    setGuidedAutoLock(Boolean(criteria.autoLock));
    setGuidedElevator(Boolean(criteria.elevator));
    setGuidedStructure(normalizeStructureOption(criteria.structure));
    setGuidedMinArea(criteria.areaMin || 0);
    setGuidedAgeMax(criteria.buildingAgeMax || 0);
    setCalcModifiers(modifiers);
    const syncNotices = [
      allCandidateDistricts.length > compatibleDistricts.length
        ? `AI 解析到跨生活圈或超出上限的地點，已保留 ${preferredGroup || "同一"}生活圈內最優先的 4 個地區。`
        : null,
      requestedStations.filter(station => allowedStationNames.has(station)).length > nextStationSelections.length
        ? "AI 解析到超過 6 個車站，已先保留前 6 個；其餘條件仍保留在原始描述中。"
        : null,
      requestedLines.length > nextLineSelections.length && nextLineSelections.length >= 4
        ? "AI 解析到超過 4 條不同路線，已先保留前 4 條；其餘條件仍保留在原始描述中。"
        : null
    ].filter(Boolean);
    setLocationGuardNotice(syncNotices.length ? syncNotices.join(" ") : null);
    setRentMonthlyBudgetMin(criteria.minBudget ? normalizeRentBudgetSelection(criteria.minBudget) : 0);
    if (criteria.maxBudget) setRentMonthlyBudget(normalizeRentBudgetSelection(criteria.maxBudget));
    setRentUpfrontCash(criteria.initialCostBudget || 0);
    setRentSearchFilters([
      criteria.petsAllowed ? "pets" : null,
      criteria.freeInternet ? "freeInternet" : null,
      criteria.noKeyMoney ? "noKeyMoney" : null,
      criteria.noDeposit ? "noDeposit" : null,
      criteria.balcony ? "balcony" : null,
      criteria.floorMin && criteria.floorMin >= 2 ? "secondFloor" : null,
      criteria.gasBurnersMin && criteria.gasBurnersMin >= 2 ? "twoBurners" : null,
      criteria.cityGasRequired ? "cityGas" : null
    ].filter(Boolean) as RentSearchFilter[]);
  };

  const analyzeNaturalLanguageRent = async () => {
    if (!aiPrompt.trim() || aiInputLoading) return;
    setAiInputLoading(true);
    setAiInputError(null);
    setAnalysisNotice(null);
    setAppliedNotice(null);
    setAiResult(current => current ? { ...current, advisorAdvice: null } : current);
    track("rent-analysis-submitted", { source: "natural-language" });
    try {
      const response = await fetch("/api/rent-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.criteria || !Array.isArray(data?.recommendations)) {
        throw new Error(data?.error || "AI 暫時無法整理需求，請稍後再試。");
      }
      syncCriteriaToForm(data.criteria);
      setAiResult({ criteria: data.criteria, recommendations: data.recommendations, advisorAdvice: data.advisorAdvice || null });
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          document.getElementById("guided-rent-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });
    } catch (error: any) {
      setAiInputError(error?.message || "AI 暫時無法整理需求，請稍後再試。");
    } finally {
      setAiInputLoading(false);
    }
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
              <div className="flex border border-[#DDE3DF] bg-[#F5F8F6] p-1 gap-1" id="calc-mode-switcher font-sans">
                <button
                  onClick={() => setCalcMode("rent")}
                  className={`flex-1 py-3 text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer font-sans ${
                    calcMode === "rent"
                      ? "bg-[#00a174] text-white"
                      : "bg-transparent text-zinc-700 hover:bg-zinc-200"
                  }`}
                >
                  <Building className="w-4 h-4 shrink-0" />
                  租屋預算健檢
                </button>
                <button
                  onClick={() => setCalcMode("buy")}
                  className={`flex-1 py-3 text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer font-sans ${
                    calcMode === "buy"
                      ? "bg-[#00a174] text-white"
                      : "bg-transparent text-zinc-700 hover:bg-zinc-200"
                  }`}
                >
                  <Landmark className="w-4 h-4 shrink-0" />
                  買房資金試算
                </button>
              </div>

              {/* Preface Intro for Calc */}
              <div className="border border-[#DDE3DF] hover:border-[#00a174] bg-white p-6 transition-all duration-300 hover:shadow-colored-soft" id="calc-intro">
                <h3 className="text-base font-bold border-b border-[#DDE3DF] pb-2.5 mb-3 text-[#007d5a] flex items-center gap-2 font-sans">
                  <span className="material-symbols-rounded shrink-0 select-none text-[19px] leading-none text-[#00a174]" aria-hidden="true">calculate</span>
                  {calcMode === "rent" ? (
                    <span>日本租屋預算與條件評估</span>
                  ) : (
                    <span>日本買房總價與貸款評估</span>
                  )}
                </h3>
                {calcMode === "rent" ? (
                  <div className="text-xs md:text-[13px] text-zinc-600 leading-relaxed text-justify font-sans space-y-2">
                    <p>找房最怕看了一圈才發現超出預算。這個工具能陪您將月租、格局與生活需求整合評估，找出真正容易租到的理想方向。</p>
                    <p>估算結合了 At Home 公開刊登行情與第一線實務經驗（包含屋齡、設備、車站距離等細節），不只呈現合理月租與初期費用，還會提醒哪些條件可能讓可選房源變少，讓您在正式找房前就能心中有數、做好取捨。</p>
                    <p className="pt-1 text-[11px] text-zinc-400">資料來源：At Home 公開租金行情、第一線租賃實務數據</p>
                  </div>
                ) : (
                  <div className="text-xs md:text-[13px] text-zinc-600 leading-relaxed text-justify font-sans space-y-2">
                    <p>買房除了看總價，更要算清楚手頭的現金、各項交易費用與每月還款壓力，才不會讓生活負擔過重。</p>
                    <p>這裡能快速幫您整理出適合的購屋預算區間，並直接對照日本國土交通省的中古公寓實際成交行情。讓您不只清楚「能買多少」，也知道「心儀地區近期大概買在哪裡」，提早規劃自備款與格局，買得踏實又安心。</p>
                    <p className="pt-1 text-[11px] text-zinc-400">資料來源：日本國土交通省 不動產資訊資料庫（不動産情報ライブラリ）中古公寓成交實價</p>
                  </div>
                )}
              </div>

              {/* Quick budget health check */}
              <section className="border border-[#1A2A22] bg-white" aria-label={calcMode === "rent" ? "租屋需求與市場分析" : "購屋預算快速試算"}>
                {calcMode === "buy" && (
                  <div className="border-b border-[#9ee2cf] bg-[#e6f6f1] px-5 py-4 text-[#1A2A22] md:px-6">
                    <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.18em] text-[#00a174] uppercase">
                      <Calculator className="h-4 w-4" /> Quick Budget Check
                    </div>
                    <h3 className="mt-1 text-lg font-bold md:text-xl">先確認自備現金與每月還款</h3>
                  </div>
                )}

                {calcMode === "rent" ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12">
                    <div className="space-y-5 border-b border-[#1A2A22] bg-[#e6f6f1] p-6 font-sans lg:col-span-5 lg:border-b-0 lg:border-r md:p-8">
                      <div className="grid grid-cols-2 border border-[#9ee2cf] bg-white" role="tablist" aria-label="租屋需求輸入方式">
                        <button
                          type="button"
                          role="tab"
                          aria-selected={rentInputMode === "ai"}
                          onClick={() => setRentInputMode("ai")}
                          className={`min-h-11 border-r border-[#9ee2cf] px-3 text-xs font-bold transition-colors ${rentInputMode === "ai" ? "bg-[#00a174] text-white" : "text-[#3F5147] hover:bg-[#F5F8F6]"}`}
                        >
                          描述需求
                        </button>
                        <button
                          type="button"
                          role="tab"
                          aria-selected={rentInputMode === "structured"}
                          onClick={() => setRentInputMode("structured")}
                          className={`min-h-11 px-3 text-xs font-bold transition-colors ${rentInputMode === "structured" ? "bg-[#00a174] text-white" : "text-[#3F5147] hover:bg-[#F5F8F6]"}`}
                        >
                          選擇條件
                        </button>
                      </div>

                      {rentInputMode === "structured" ? (
                        <>
                      <fieldset>
                        <legend className="text-xs font-bold text-zinc-700">每月總預算（含管理費）</legend>
                        <div className="mt-1.5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                          <div className="relative flex h-12 min-w-0 items-center border border-[#1A2A22] bg-white focus-within:ring-1 focus-within:ring-[#00a174]">
                            <select
                              aria-label="每月最低預算"
                              value={rentMonthlyBudgetMin}
                              onChange={event => {
                                const nextMinimum = Number(event.target.value);
                                setRentMonthlyBudgetMin(nextMinimum);
                                if (nextMinimum > rentMonthlyBudget) setRentMonthlyBudget(nextMinimum);
                              }}
                              className="peer h-full min-w-0 flex-1 appearance-none bg-transparent px-3 pr-16 font-mono text-base font-bold outline-none"
                            >
                              <option value={0}>不限</option>
                              {RENT_BUDGET_OPTIONS.map(value => (
                                <option key={`minimum-${value}`} value={value}>{value / 10000}</option>
                              ))}
                            </select>
                            <span className="pointer-events-none absolute right-10 text-xs font-bold text-zinc-500">萬円</span>
                            <ChevronDown className={guidedSelectChevronClass} />
                          </div>
                          <span aria-hidden="true" className="font-mono text-base font-bold text-[#66736C]">～</span>
                          <div className="relative flex h-12 min-w-0 items-center border border-[#1A2A22] bg-white focus-within:ring-1 focus-within:ring-[#00a174]">
                            <select
                              aria-label="每月最高預算"
                              value={rentMonthlyBudget}
                              onChange={event => {
                                const nextMaximum = Number(event.target.value);
                                setRentMonthlyBudget(nextMaximum);
                                if (rentMonthlyBudgetMin > nextMaximum) setRentMonthlyBudgetMin(nextMaximum);
                              }}
                              className="peer h-full min-w-0 flex-1 appearance-none bg-transparent px-3 pr-16 font-mono text-base font-bold outline-none"
                            >
                              {RENT_BUDGET_OPTIONS.map(value => (
                                <option key={`maximum-${value}`} value={value}>{value / 10000}</option>
                              ))}
                            </select>
                            <span className="pointer-events-none absolute right-10 text-xs font-bold text-zinc-500">萬円</span>
                            <ChevronDown className={guidedSelectChevronClass} />
                          </div>
                        </div>
                      </fieldset>

                      <div className="space-y-2">
                        <div className="flex items-end justify-between gap-3">
                          <label className="text-xs font-bold text-zinc-700" htmlFor="guided-district-add">希望地區</label>
                          <span className="text-[9px] text-[#66736C]">可複選，最多 4 個同生活圈地區</span>
                        </div>
                        <div className="relative">
                          <select
                            id="guided-district-add"
                            value=""
                            onChange={event => addGuidedDistrict(event.target.value)}
                            className="peer h-12 w-full appearance-none border border-[#1A2A22] bg-white px-3 pr-10 text-sm outline-none focus:ring-1 focus:ring-[#00a174]"
                          >
                            <option value="">＋ 新增希望地區</option>
                            {Array.from(new Set(rentRates.map(rate => rate.region))).map(region => (
                              <optgroup key={region} label={toJapanesePrefectureName(region)}>
                                {rentRates.filter(rate => rate.region === region).map(rate => (
                                  <option key={rate.district} value={rate.district} disabled={guidedDistrictSelections.includes(rate.district)}>
                                    {toJapanesePlaceName(rate.district)}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                          <ChevronDown className={guidedSelectChevronClass} />
                        </div>
                        {guidedDistrictSelections.length > 0 && (
                          <div className="flex flex-wrap gap-1.5" aria-label="已選希望地區">
                            {guidedDistrictSelections.map(district => (
                              <span key={district} className="inline-flex items-center gap-1 bg-[#008C68] px-2.5 py-1.5 text-[10px] font-bold text-white">
                                {toJapanesePlaceName(district)}
                                <button type="button" onClick={() => removeGuidedDistrict(district)} className="ml-0.5 text-white/75 hover:text-white" aria-label={`移除${toJapanesePlaceName(district)}`}>
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <div className="flex items-end justify-between gap-2">
                            <label className="text-xs font-bold text-zinc-700" htmlFor="guided-line-add">希望線路</label>
                            <span className="text-[9px] text-[#66736C]">最多 4 條</span>
                          </div>
                          <div className="relative">
                            <select
                              id="guided-line-add"
                              value=""
                              onChange={event => addGuidedLine(event.target.value)}
                              disabled={!guidedDistrictSelections.length}
                              className="peer h-11 w-full appearance-none border border-[#1A2A22] bg-white px-3 pr-10 text-xs outline-none focus:ring-1 focus:ring-[#00a174] disabled:border-[#C9D2CD] disabled:bg-[#F1F4F2] disabled:text-zinc-400"
                            >
                              <option value="">＋ 新增希望線路</option>
                              {guidedLineOptions.map(line => <option key={line} value={line} disabled={guidedLineSelections.some(selected => sameGuidedLine(selected, line))}>{toJapaneseLineName(line)}</option>)}
                            </select>
                            <ChevronDown className={guidedSelectChevronClass} />
                          </div>
                          {guidedLineSelections.length > 0 && (
                            <div className="flex flex-wrap gap-1.5" aria-label="已選希望線路">
                              {guidedLineSelections.map(line => (
                                <span key={line} className="inline-flex items-center gap-1 border border-[#8BCDB8] bg-[#E6F6F1] px-2 py-1 text-[9px] font-bold text-[#007D5A]">
                                  {toJapaneseLineName(line)}
                                  <button type="button" onClick={() => removeGuidedLine(line)} className="text-[#007D5A]/70 hover:text-[#007D5A]" aria-label={`移除${toJapaneseLineName(line)}`}>
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-end justify-between gap-2">
                            <label className="text-xs font-bold text-zinc-700" htmlFor="guided-station-add">希望車站</label>
                            <span className="text-[9px] text-[#66736C]">可搜尋，最多 6 個</span>
                          </div>
                          <div className="flex">
                            <div className="relative min-w-0 flex-1">
                              <input
                                id="guided-station-add"
                                list="guided-station-options"
                                value={guidedStationDraft}
                                onChange={event => setGuidedStationDraft(event.target.value)}
                                onKeyDown={event => {
                                  if (event.key === "Enter") {
                                    event.preventDefault();
                                    addGuidedStation();
                                  }
                                }}
                                disabled={!guidedDistrictSelections.length}
                                placeholder="輸入站名"
                                className="h-11 w-full border border-r-0 border-[#1A2A22] bg-white px-3 text-xs outline-none focus:ring-1 focus:ring-inset focus:ring-[#00a174] disabled:border-[#C9D2CD] disabled:bg-[#F1F4F2]"
                              />
                              <datalist id="guided-station-options">
                                {guidedLocationStationOptions.map(station => <option key={station.name} value={station.name}>{toJapaneseStationName(station.name)}駅</option>)}
                              </datalist>
                            </div>
                            <button type="button" onClick={addGuidedStation} disabled={!guidedStationDraft.trim()} className="flex h-11 w-11 shrink-0 items-center justify-center border border-[#1A2A22] bg-[#1A2A22] text-white hover:bg-[#008C68] disabled:cursor-not-allowed disabled:border-[#AEB8B2] disabled:bg-[#AEB8B2]" aria-label="加入希望車站">
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          {guidedStationSelections.length > 0 && (
                            <div className="flex flex-wrap gap-1.5" aria-label="已選希望車站">
                              {guidedStationSelections.map(station => (
                                <span key={station} className="inline-flex items-center gap-1 border border-[#CBD7D1] bg-white px-2 py-1 text-[9px] font-bold text-[#35483E]">
                                  <MapPin className="h-3 w-3 text-[#00A174]" />
                                  {toJapaneseStationName(station)}駅
                                  <button type="button" onClick={() => removeGuidedStation(station)} className="text-[#66736C] hover:text-[#1A2A22]" aria-label={`移除${toJapaneseStationName(station)}駅`}>
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {locationGuardNotice && (
                        <div className="flex items-start gap-2 border-l-4 border-[#D98A28] bg-[#FFF8E9] px-3 py-2 text-[10px] leading-relaxed text-[#76511F]" role="status">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          {locationGuardNotice}
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(120px,1fr)]">
                        <label className="block text-[11px] font-bold text-zinc-700">
                          通勤目的車站（可輸入搜尋）
                          <input
                            list="commute-station-options"
                            value={guidedCommuteStation}
                            onChange={event => {
                              setGuidedCommuteStation(event.target.value);
                              if (!event.target.value) setLocationGuardNotice(null);
                            }}
                            onBlur={event => setLocationGuardNotice(validateCommuteCompatibility(event.target.value))}
                            placeholder="例如：渋谷、新宿、東京"
                            className="mt-1.5 h-11 w-full border border-[#1A2A22] bg-white px-3 text-xs outline-none focus:ring-1 focus:ring-[#00a174]"
                          />
                          <datalist id="commute-station-options">
                            {commuteStationOptions.map(station => <option key={station} value={station}>{toJapaneseStationName(station)}駅</option>)}
                          </datalist>
                        </label>
                        <label className="block text-[11px] font-bold text-zinc-700">
                          最長通勤時間
                          <div className="relative mt-1.5">
                            <select
                              value={guidedCommuteMinutes}
                              onChange={event => setGuidedCommuteMinutes(Number(event.target.value))}
                              disabled={!guidedCommuteStation}
                              className="peer h-11 w-full appearance-none border border-[#1A2A22] bg-white px-3 pr-10 text-xs outline-none focus:ring-1 focus:ring-[#00a174] disabled:cursor-not-allowed disabled:border-[#C9D2CD] disabled:bg-[#F1F4F2] disabled:text-zinc-400"
                            >
                              <option value={15}>15 分內</option>
                              <option value={20}>20 分內</option>
                              <option value={30}>30 分內</option>
                              <option value={45}>45 分內</option>
                              <option value={60}>60 分內</option>
                              <option value={75}>75 分內</option>
                              <option value={90}>90 分內</option>
                            </select>
                            <ChevronDown className={guidedSelectChevronClass} />
                          </div>
                        </label>
                      </div>

                      <fieldset>
                        <legend className="text-xs font-bold text-zinc-700">希望格局</legend>
                        <div className="mt-1.5 grid h-11 grid-cols-5 border border-[#1A2A22] bg-white">
                          {(["r1", "k1", "ldk1", "ldk2", "ldk3"] as const).map((type, index) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => selectGuidedRoomType(type)}
                              className={`${index > 0 ? "border-l border-[#1A2A22]" : ""} text-[11px] font-bold ${calcRoomType === type ? "bg-[#18181B] text-white" : "hover:bg-[#F5F8F6]"}`}
                            >
                              {ROOM_TYPE_LABEL[type]}
                            </button>
                          ))}
                        </div>
                      </fieldset>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <label className="text-[11px] font-bold text-zinc-700">
                          最低面積
                          <div className="relative mt-1.5">
                            <select value={guidedMinArea} onChange={event => selectGuidedArea(Number(event.target.value))} className="peer h-10 w-full appearance-none border border-[#1A2A22] bg-white px-3 pr-10 text-xs outline-none focus:ring-1 focus:ring-[#00a174]">
                              <option value={0}>不限</option>
                              {areaOptions.map(area => <option key={area} value={area}>{area}㎡以上</option>)}
                            </select>
                            <ChevronDown className={guidedSelectChevronClass} />
                          </div>
                        </label>
                        <label className="text-[11px] font-bold text-zinc-700">
                          徒步到車站
                          <div className="relative mt-1.5">
                            <select value={guidedWalkMinutes} onChange={event => selectGuidedWalk(Number(event.target.value))} className="peer h-10 w-full appearance-none border border-[#1A2A22] bg-white px-3 pr-10 text-xs outline-none focus:ring-1 focus:ring-[#00a174]">
                              <option value={0}>6～10 分／不限</option>
                              <option value={5}>5 分內</option>
                              <option value={15}>11～15 分</option>
                              <option value={20}>16～20 分</option>
                            </select>
                            <ChevronDown className={guidedSelectChevronClass} />
                          </div>
                        </label>
                        <label className="text-[11px] font-bold text-zinc-700">
                          屋齡上限
                          <div className="relative mt-1.5">
                            <select value={guidedAgeMax} onChange={event => selectGuidedAge(Number(event.target.value))} className="peer h-10 w-full appearance-none border border-[#1A2A22] bg-white px-3 pr-10 text-xs outline-none focus:ring-1 focus:ring-[#00a174]">
                              <option value={0}>不限</option>
                              <option value={3}>3 年內</option>
                              <option value={5}>5 年內</option>
                              <option value={7}>7 年內</option>
                              <option value={10}>10 年內</option>
                              <option value={15}>15 年內</option>
                              <option value={20}>20 年內</option>
                              <option value={25}>25 年內</option>
                              <option value={30}>30 年內</option>
                              <option value={40}>40 年內</option>
                              <option value={50}>50 年內</option>
                            </select>
                            <ChevronDown className={guidedSelectChevronClass} />
                          </div>
                        </label>
                      </div>

                      <label className="block text-[11px] font-bold text-zinc-700">
                        建築結構
                        <div className="relative mt-1.5">
                          <select value={guidedStructure} onChange={event => selectGuidedStructure(event.target.value)} className="peer h-10 w-full appearance-none border border-[#1A2A22] bg-white px-3 pr-10 text-xs outline-none focus:ring-1 focus:ring-[#00a174]">
                            <option value="">不限結構</option>
                            <option value="木造">木造</option>
                            <option value="鐵骨造">鐵骨造（S 造）</option>
                            <option value="RC造">鋼筋混凝土（RC 造）</option>
                            <option value="SRC造">鋼骨鋼筋混凝土（SRC 造）</option>
                          </select>
                          <ChevronDown className={guidedSelectChevronClass} />
                        </div>
                      </label>

                      <fieldset className="border-t border-dashed border-[#C9D2CD] pt-4">
                        <legend className="px-1 text-xs font-bold text-zinc-700">樓層與常用設備</legend>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button
                            type="button"
                            aria-pressed={guidedFloorMin >= 2}
                            onClick={() => selectGuidedFloor(guidedFloorMin >= 2 ? 0 : 2)}
                            className={guidedChoiceClass(guidedFloorMin >= 2)}
                          >
                            2 樓以上
                          </button>
                          <button
                            type="button"
                            aria-pressed={rentSearchFilters.includes("pets")}
                            onClick={() => toggleRentSearchFilter("pets")}
                            className={guidedChoiceClass(rentSearchFilters.includes("pets"))}
                          >
                            可養寵物
                          </button>
                          <button
                            type="button"
                            aria-pressed={washbasinSelected}
                            onClick={() => toggleBathroomFacility("washbasin")}
                            className={guidedChoiceClass(washbasinSelected)}
                          >
                            獨立洗面台
                          </button>
                          <button
                            type="button"
                            aria-pressed={bidetSelected}
                            onClick={() => toggleBathroomFacility("bidet")}
                            className={guidedChoiceClass(bidetSelected)}
                          >
                            免治馬桶
                          </button>
                          <button
                            type="button"
                            aria-pressed={guidedAutoLock}
                            onClick={() => toggleBuildingSecurity("autoLock")}
                            className={guidedChoiceClass(guidedAutoLock)}
                          >
                            自動門
                          </button>
                          <button
                            type="button"
                            aria-pressed={guidedElevator}
                            onClick={() => toggleBuildingSecurity("elevator")}
                            className={guidedChoiceClass(guidedElevator)}
                          >
                            電梯
                          </button>
                          {([
                            ["separate_bath", "衛浴分離"],
                            ["furnished", "家具家電"],
                          ] as Array<[BudgetModifierId, string]>).map(([id, label]) => {
                            const selected = calcModifiers.includes(id);
                            return (
                              <button key={id} type="button" aria-pressed={selected} onClick={() => toggleModifier(id)} className={guidedChoiceClass(selected)}>
                                {label}
                              </button>
                            );
                          })}
                          {([
                            ["noKeyMoney", "免禮金"],
                            ["noDeposit", "免押金"],
                            ["freeInternet", "免費網路"],
                            ["balcony", "附陽台"],
                            ["twoBurners", "爐具 2 口以上"],
                            ["cityGas", "都市瓦斯"],
                          ] as Array<[RentSearchFilter, string]>).map(([id, label]) => {
                            const selected = rentSearchFilters.includes(id);
                            return (
                              <button key={id} type="button" aria-pressed={selected} onClick={() => toggleRentSearchFilter(id)} className={guidedChoiceClass(selected)}>
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </fieldset>

                      <button
                        type="button"
                        onClick={analyzeStructuredRent}
                        disabled={analysisLoading}
                        className="flex min-h-12 w-full items-center justify-center gap-2 bg-[#18181B] px-5 text-sm font-bold text-white transition-colors hover:bg-[#303033] disabled:bg-[#9AA9A2] font-sans"
                      >
                        {analysisLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        {analysisLoading ? "正在對標市場與計算路線…" : aiResult ? "依目前條件重新分析" : "AI 分析可行性與推薦車站"}
                      </button>
                      <p className="text-[10px] leading-relaxed text-[#66736C]">
                        不必另外輸入需求；以上選項會直接用來判斷預算落差、供給難度與適合搜尋的車站。
                      </p>
                      {analysisNotice && (
                        <p className="border border-[#F1D59B] bg-[#FFF9ED] px-3 py-2 text-[10px] leading-relaxed text-[#7A5A1F]" role="status">{analysisNotice}</p>
                      )}
                      {aiResult && <RequirementAssessment criteria={aiResult.criteria} recommendations={aiResult.recommendations} />}
                        </>
                      ) : (
                        <div role="tabpanel">
                          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#00a174] font-sans">
                            <Sparkles className="h-4 w-4" /> AI Market Reality Check
                          </div>
                          <h3 className="mb-3 text-xl font-bold leading-snug text-[#1A2A22] md:text-2xl">
                            說出理想生活，找到真住得起的選擇
                          </h3>
                          <div className="mb-5 space-y-3 text-sm leading-relaxed text-[#3F5147] font-sans">
                            <p>告訴我們您的預算、通勤地點與理想條件，我們會整理適合的地區與車站，並估算合理的租金範圍。</p>
                            <p>當條件與預算出現落差，也會清楚指出可以調整的方向，協助您在理想、通勤與負擔能力之間，找到最適合自己的平衡。</p>
                          </div>
                          <textarea
                            value={aiPrompt}
                            onChange={event => setAiPrompt(event.target.value)}
                            maxLength={1000}
                            rows={6}
                            placeholder="例如：預算含管理費 10 萬円，想住東急東橫線，1K 25㎡以上，要獨立洗面台、電梯，走路 10 分鐘內。"
                            className="w-full resize-y border border-[#1A2A22] bg-white p-4 text-sm text-[#1A2A22] placeholder:text-[#8A9590] focus:outline-none focus:ring-2 focus:ring-[#00a174]/30 font-sans"
                          />
                          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                            <button
                              type="button"
                              onClick={analyzeNaturalLanguageRent}
                              disabled={!aiPrompt.trim() || aiInputLoading}
                              className="flex min-h-12 flex-1 items-center justify-center gap-2 bg-[#18181B] px-5 text-sm font-bold text-white transition-colors hover:bg-[#303033] disabled:cursor-not-allowed disabled:opacity-45 font-sans"
                            >
                              {aiInputLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                              {aiInputLoading ? "正在對標市場與計算路線…" : aiResult ? "依目前條件重新分析" : "AI 分析可行性與推薦車站"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setAiPrompt("簽證種類：技人國簽證，5年\n期望預算：¥20萬以下（含管理費）\n期望地區：目黑區／世田谷區、超市 10 分鐘內\n期望車站：東急東橫線沿線 (武蔵小杉、元住吉、日吉)、車站徒步 10 分鐘內\n房型設備：1LDK，RC/SRC造、25平米以上、一樓自動門、獨立洗面台、溫水清淨便器\n通勤地點：惠比壽車站\n其他條件：2 樓以上、陽台、瓦斯爐2個以上、可養貓")}
                              className="min-h-12 border border-[#1A2A22] bg-white px-4 text-xs font-bold text-[#1A2A22] hover:bg-[#F5F8F6] font-sans"
                            >
                              套用範例
                            </button>
                          </div>
                          <p className="mt-2 text-[9px] text-[#66736C] font-sans">為保護分析服務額度，同一使用者每 3 分鐘最多分析 3 次。</p>
                          {aiInputError && <p className="mt-3 bg-[#FBDFD2] p-3 text-xs text-[#B13818] font-sans">{aiInputError}</p>}
                          {aiResult && <RequirementAssessment criteria={aiResult.criteria} recommendations={aiResult.recommendations} />}
                        </div>
                      )}
                    </div>

                    <div className="p-5 lg:col-span-7 md:p-8">
                      {rentInputMode === "ai" ? (
                        !aiResult ? (
                          <div className="flex min-h-[360px] h-full items-center justify-center py-10 text-center">
                            <div className="max-w-sm">
                              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-[#9ee2cf] bg-[#F5F8F6]">
                                <MapPin className="h-5 w-5 text-[#00a174]" />
                              </div>
                              <p className="mb-2 font-bold text-[#1A2A22]">分析後會依符合度列出合適車站</p>
                              <p className="text-xs leading-relaxed text-[#8A9590] font-sans">包含地區／車站、估算中心值、合理波動區間，以及與預算的落差。</p>
                            </div>
                          </div>
                        ) : (
                          <div id="guided-rent-results" className="scroll-mt-24">
                            <RentCriteriaSummary criteria={aiResult.criteria} />
                            <RentMarketReports
                              recommendations={aiResult.recommendations}
                              criteria={aiResult.criteria}
                              onApply={item => applyRecommendationToCalculator(item, aiResult.criteria)}
                            />
                            {appliedNotice && (
                              <p className="mt-3 border border-[#9ee2cf] bg-[#e6f6f1] px-3 py-2 text-xs font-bold text-[#007d5a] font-sans" role="status">
                                {appliedNotice}
                              </p>
                            )}
                          </div>
                        )
                      ) : (
                        <>
                          {!aiResult ? (
                            <div className="flex min-h-[360px] items-center justify-center py-10 text-center">
                              <div className="max-w-sm">
                                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-[#9ee2cf] bg-[#F5F8F6]">
                                  <MapPin className="h-5 w-5 text-[#00a174]" />
                                </div>
                                <p className="mb-2 font-bold text-[#1A2A22]">分析後會依符合度列出合適車站</p>
                                <p className="text-xs leading-relaxed text-[#8A9590]">先在左側完成條件；可行性判讀會顯示在表單下方，這裡專心呈現推薦車站。</p>
                              </div>
                            </div>
                          ) : (
                            <div id="guided-rent-results" className="scroll-mt-24">
                              <RentCriteriaSummary criteria={aiResult.criteria} />
                              <RentMarketReports
                                recommendations={aiResult.recommendations}
                                criteria={aiResult.criteria}
                                onApply={item => applyRecommendationToCalculator(item, aiResult.criteria)}
                              />
                              {appliedNotice && (
                                <p className="mt-3 border border-[#9ee2cf] bg-[#e6f6f1] px-3 py-2 text-xs font-bold text-[#007d5a]" role="status">{appliedNotice}</p>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12">
                    <div className="space-y-5 border-b border-[#DDE3DF] bg-[#F5F8F6] p-5 lg:col-span-5 lg:border-b-0 lg:border-r md:p-6">
                      <label className="block text-xs font-bold text-zinc-700">
                        可準備的購屋現金
                        <div className="mt-1.5 flex h-12 items-center border border-[#1A2A22] bg-white px-3">
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={buyAvailableCash / 10000}
                            onChange={event => setBuyAvailableCash(Math.max(0, (Number(event.target.value) || 0) * 10000))}
                            className="w-full bg-transparent font-mono text-base font-bold outline-none"
                          />
                          <span className="ml-2 shrink-0 text-sm font-bold text-zinc-500">萬円</span>
                        </div>
                        <span className="mt-1 block text-[9px] font-normal leading-relaxed text-zinc-400">包含頭期款與購屋初期諸費用</span>
                      </label>
                      <label className="block text-xs font-bold text-zinc-700">
                        每月可接受的本息還款
                        <div className="mt-1.5 flex h-12 items-center border border-[#1A2A22] bg-white px-3">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={buyMonthlyPaymentBudget / 10000}
                            onChange={event => setBuyMonthlyPaymentBudget(Math.max(0, (Number(event.target.value) || 0) * 10000))}
                            className="w-full bg-transparent font-mono text-base font-bold outline-none"
                          />
                          <span className="ml-2 shrink-0 text-sm font-bold text-zinc-500">萬円</span>
                        </div>
                      </label>

                      <details className="border border-[#DDE3DF] bg-white">
                        <summary className="cursor-pointer px-3 py-2.5 text-xs font-bold text-[#31443A]">調整貸款假設</summary>
                        <div className="grid grid-cols-3 gap-2 border-t border-[#DDE3DF] p-3">
                          <label className="text-[9px] text-zinc-500">貸款成數
                            <input type="number" min="0" max="100" step="5" value={loanRatio} onChange={event => setLoanRatio(Math.min(100, Math.max(0, Number(event.target.value))))} className="mt-1 w-full border border-zinc-300 px-2 py-1.5 font-mono text-xs" />
                          </label>
                          <label className="text-[9px] text-zinc-500">年利率
                            <input type="number" min="0" max="20" step="0.1" value={annualRate} onChange={event => setAnnualRate(Math.min(20, Math.max(0, Number(event.target.value))))} className="mt-1 w-full border border-zinc-300 px-2 py-1.5 font-mono text-xs" />
                          </label>
                          <label className="text-[9px] text-zinc-500">貸款年限
                            <input type="number" min="1" max="50" step="1" value={loanYears} onChange={event => setLoanYears(Math.min(50, Math.max(1, Number(event.target.value))))} className="mt-1 w-full border border-zinc-300 px-2 py-1.5 font-mono text-xs" />
                          </label>
                        </div>
                      </details>
                    </div>

                    <div className="p-5 lg:col-span-7 md:p-6">
                      <div className="border-b border-[#DDE3DF] pb-4">
                        <p className="text-[10px] font-bold tracking-[0.14em] text-[#66736C] uppercase">Affordable range</p>
                        <h4 className="mt-1 text-lg font-bold text-[#1A2A22]">建議購屋總價控制在</h4>
                        <p className="mt-2 font-mono text-2xl font-black text-[#00a174]">
                          {formatManYenNumber(affordableBuyLow, 0)}～{formatManYen(affordableBuyPrice, 0)}
                        </p>
                        <p className="mt-1 text-[10px] text-zinc-400">依現金與月付能力取較低上限，並保留約 10% 緩衝。</p>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-px border border-[#DDE3DF] bg-[#DDE3DF] sm:grid-cols-3">
                        <div className="bg-white p-4">
                          <p className="text-[10px] font-bold text-[#66736C]">頭期款概算</p>
                          <p className="mt-1 font-mono text-lg font-bold text-[#1A2A22]">{formatManYen(affordableDownPayment, 0)}</p>
                          <p className="mt-1 text-[9px] text-zinc-400">總價的 {100 - loanRatio}%</p>
                        </div>
                        <div className="bg-white p-4">
                          <p className="text-[10px] font-bold text-[#66736C]">初期諸費用概算</p>
                          <p className="mt-1 font-mono text-lg font-bold text-[#1A2A22]">{formatManYen(affordableBuyFees, 0)}</p>
                          <p className="mt-1 text-[9px] text-zinc-400">目前以總價約 {Math.round(buyFeeRate * 100)}% 準備</p>
                        </div>
                        <div className="bg-white p-4">
                          <p className="text-[10px] font-bold text-[#66736C]">貸款假設</p>
                          <p className="mt-1 font-mono text-lg font-bold text-[#1A2A22]">{annualRate}%／{loanYears} 年</p>
                          <p className="mt-1 text-[9px] text-zinc-400">貸款成數 {loanRatio}%</p>
                        </div>
                      </div>

                      <div className="mt-4 border-l-4 border-[#00a174] bg-[#e6f6f1] p-3 text-xs leading-relaxed text-[#245746]">
                        這個結果只回答「資金上大致負擔得起多少」，尚未計入管理費、修繕積立金、固定資產稅與個別銀行審査。地區行情與物件條件可在下方進階工具繼續比較。
                      </div>
                    </div>
                  </div>
                )}
              </section>

              <div className="flex flex-col gap-3 border border-[#DDE3DF] bg-[#FAFCFB] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold text-[#1A2A22]">
                    {calcMode === "rent" ? "查看租屋試算與詳細計算明細" : "查看買房試算與詳細計算明細"}
                  </p>
                  <p className="mt-1 text-[10px] text-[#66736C]">
                    {calcMode === "rent"
                      ? "上方選好的條件會同步到這裡，可再檢查租金加減價與初期費用。"
                      : "上方選好的條件會同步到這裡，可再檢查總價加減價、初期費用與貸款假設。"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAdvancedTools(current => !current)}
                  aria-expanded={showAdvancedTools}
                  className="flex min-h-10 items-center justify-center gap-2 border border-[#1A2A22] bg-white px-4 text-xs font-bold text-[#1A2A22] hover:border-[#00a174] hover:text-[#00a174]"
                >
                  {showAdvancedTools ? "收起計算明細" : "展開計算明細"}
                  <ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedTools ? "rotate-180" : ""}`} />
                </button>
              </div>

              {/* Multi-grid calculator interface */}
              {showAdvancedTools && <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start" id="calc-engine-container">
                {/* Inputs area (Left 7 Columns) */}
                <div className="xl:col-span-7 space-y-6">
                  {/* Step 1: Select District & Size */}
                  <div className="border border-[#1A2A22] bg-white p-6 space-y-4">
                    <h4 className="font-bold text-[#00a174] text-sm border-b border-zinc-200 pb-2 font-sans">
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
                              setGuidedDistrictSelections([e.target.value]);
                              setGuidedLineSelections([]);
                              setGuidedStationSelections([]);
                              setGuidedLine("");
                              setCalcStation("none");
                              setGuidedMinArea(0);
                              setGuidedAgeMax(0);
                              setCalcModifiers([]); // reset rent modifiers
                              setCalcBuyModifiers([]); // reset buy modifiers
                            }}
                            className="h-12 w-full appearance-none bg-white border border-[#1A2A22] px-3 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-[#00a174] rounded-none cursor-pointer font-sans"
                          >
                            {Array.from(new Set(rentRates.map(r => r.region))).map(region => (
                              <optgroup key={region} label={toJapanesePrefectureName(region)} className="font-sans font-bold">
                                {rentRates.filter(r => r.region === region).map(item => (
                                  <option key={item.district} value={item.district} className="font-sans">
                                    {calcMode === "rent" ? (
                                      `${toJapanesePlaceName(item.district)} (${ROOM_TYPE_LABEL[calcRoomType]}均價: ${Number(item[calcRoomType]).toFixed(1)} 萬円/月)`
                                    ) : (
                                      `${toJapanesePlaceName(item.district)} (${ROOM_TYPE_LABEL[calcRoomType]}估計: ${getDistrictBuyPrice(item.district, calcRoomType).toLocaleString()} 萬円)`
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
                        <label className="text-xs font-bold text-zinc-700">選擇格局大小：</label>
                        {/* Hover 時顯示每個格局群組的實際涵蓋範圍，維持按鈕視覺乾淨。 */}
                        <div className="grid h-12 grid-cols-5 border border-[#1A2A22]">
                          {(["r1", "k1", "ldk1", "ldk2", "ldk3"] as const).map((id, index) => {
                            const includesText = ROOM_TYPE_INCLUDES_LABEL[id];
                            return (
                              <div key={id} className={`group relative h-full ${index > 0 ? "border-l border-[#1A2A22]" : ""}`}>
                                <button
                                  type="button"
                                  onClick={() => selectGuidedRoomType(id)}
                                  title={ROOM_TYPE_DETAIL_LABEL[id]}
                                  className={`h-full w-full text-xs font-medium cursor-pointer transition-colors ${
                                    calcRoomType === id
                                      ? "bg-[#1A2A22] text-white font-semibold"
                                      : "bg-white text-zinc-700 hover:bg-[#F5F8F6]"
                                  }`}
                                >
                                  {ROOM_TYPE_LABEL[id]}
                                </button>
                                {includesText && (
                                  <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-150 z-30 whitespace-nowrap bg-zinc-900 text-white text-[10px] font-sans font-normal px-2 py-0.5 shadow-md rounded-xs">
                                    {includesText}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
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
                            <MapPin className="w-3.5 h-3.5 text-[#00a174]" />
                            選擇物件周邊特定車站（鐵路、地下鐵或路面電車）：
                          </label>
                          <div className="relative">
                            <select
                              value={calcStation}
                              onChange={(e) => selectGuidedStation(e.target.value)}
                              className="h-12 w-full appearance-none bg-white border border-[#1A2A22] px-3 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-[#00a174] rounded-none cursor-pointer font-sans"
                            >
                            <option value="none">基準 (行政區平均行情基礎 — 適合廣域搜房)</option>
                            {majorStations.length > 0 && (
                              <optgroup label="🚇 熱門大站 / 多線共構 / 快速急行停靠 (行情溢價約 +1.0 萬円/月)">
                                {majorStations.map(s => (
                                  <option key={s.name} value={s.name}>
                                    {toJapaneseStationName(s.name)}駅 ({s.lines.map(toJapaneseLineName).join(", ")})
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            {regularStations.length > 0 && (
                              <optgroup label="🚉 常規站點 / 人氣常規站 (行情溢價約 +0.5 萬円/月)">
                                {regularStations.map(s => (
                                  <option key={s.name} value={s.name}>
                                    {toJapaneseStationName(s.name)}駅 ({s.lines.map(toJapaneseLineName).join(", ")})
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            {minorStations.length > 0 && (
                              <optgroup label="🛤 各停小站 / 二線各停 / 偏遠小站 (行情調減約 -0.5 萬円/月)">
                                {minorStations.map(s => (
                                  <option key={s.name} value={s.name}>
                                    {toJapaneseStationName(s.name)}駅 ({s.lines.map(toJapaneseLineName).join(", ")}) — 行情相對親民
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1A2A22]" aria-hidden="true" />
                          </div>
                          <p className="text-[10px] text-zinc-500 leading-normal">
                            ※ 車站行情為區域估算，實際租金依物件位置與步行距離而異。
                          </p>
                        </div>
                      );
                    })()}

                    {calcMode === "buy" && (
                      <div className="flex items-start gap-2 border border-zinc-200 bg-[#F5F8F6] p-3 font-sans text-xs leading-normal text-zinc-500">
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#00a174]" />
                        {(() => {
                          const estimate = getSelectedBuyMarketEstimate();
                          return estimate.source === "official_transaction" ? (
                            <div className="min-w-0 space-y-1">
                              <div className="font-bold text-zinc-700">
                                <strong lang="ja" className="font-jp">{districtDisplayName}</strong>・{ROOM_TYPE_LABEL[calcRoomType]} 近{estimate.windowQuarters === 4 ? "四" : "八"}季中古公寓成交價中位數
                              </div>
                              <div className="font-mono text-base font-bold text-[#007D5A]">
                                {getDistrictBuyPrice(calcDistrict, calcRoomType).toLocaleString()} 萬日圓
                              </div>
                              <div className="text-[10px] leading-relaxed text-zinc-500">
                                資料來源：國土交通省 不動產資訊資料庫｜統計期間：{estimate.periodStart}～{estimate.periodEnd}｜樣本：{estimate.sampleCount.toLocaleString()} 筆
                              </div>
                            </div>
                          ) : (
                            <div className="min-w-0 space-y-1">
                              <div className="font-bold text-zinc-700">
                                <strong lang="ja" className="font-jp">{districtDisplayName}</strong>・{ROOM_TYPE_LABEL[calcRoomType]} 中古公寓總價模型
                              </div>
                              <div className="font-mono text-base font-bold text-zinc-700">
                                {getDistrictBuyPrice(calcDistrict, calcRoomType).toLocaleString()} 萬日圓
                              </div>
                              <div className="text-[10px] leading-relaxed text-zinc-500">
                                估算方式：租金收益率模型｜假設表面投報率：{(getModeledBuyYieldRate(getSelectedDistrictData().region, calcDistrict, calcRoomType) * 100).toFixed(1)}%｜此組合尚無足夠成交樣本
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                    {getSelectedDistrictData().verificationStatus === "modeled_unverified" && (
                      <div className="border-l-4 border-[#E94E2B] bg-[#FFF9ED] px-3 py-2 text-[11px] leading-relaxed text-[#66583D] font-sans">
                        <strong className="text-[#B13818]">推估資料：</strong>{getSelectedDistrictData().sourceNote || "當地樣本不足，暫以主要城市行情建立模型參考。"}
                      </div>
                    )}
                    {getSelectedDistrictData().verificationStatus === "researched_limited" && (
                      <div className="border-l-4 border-[#E94E2B] bg-[#FFF9ED] px-3 py-2 text-[11px] leading-relaxed text-[#66583D] font-sans">
                        <strong className="text-[#B13818]">資料待更新：</strong>{getSelectedDistrictData().sourceNote || "目前採用仲介實務行情基準，尚未對應單一公開統計來源。"}
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
                    <h4 className="font-bold text-[#00a174] text-sm border-b border-zinc-200 pb-2 font-sans">
                      {calcMode === "rent" ? "步驟二：租金加減價與房源篩選" : "步驟二：勾選想要的附加條件 (買房折溢價項目)"}
                    </h4>
                    
                    {calcMode === "rent" ? (
                      <div className="space-y-4 font-sans text-xs">
                        <div className="bg-[#F5F8F6] border-l-4 border-[#00a174] px-3 py-2.5">
                          <span className="font-bold text-[#1A2A22]">A. 會影響租金的加減價條件</span>
                          <p className="mt-1 text-[10px] text-[#66736C]">依地區行情尺度換算後，直接反映在下方月租估算。</p>
                        </div>
                        {/* Plus Modifiers */}
                        <div className="space-y-2.5">
                          <span className="font-bold text-zinc-800 block text-xs tracking-wider">★ 加價升級條件 (配備新穎或位置佳)：</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {budgetModifiers.filter(m => m.type === "plus" && m.id !== "major_station" && m.id !== "minor_station" && (!m.applicableLayouts || m.applicableLayouts.includes(calcRoomType))).map((mod) => {
                              const isSelected = calcModifiers.includes(mod.id);
                              const isDisabled = isRentModifierDisabled(mod.id, calcModifiers, calcDistrict);
                              const isNoTower = mod.id === "tower" && !hasTowerMansionSupport(calcDistrict);
                              return (
                                <label 
                                  key={mod.id} 
                                  className={`p-2.5 border flex items-start gap-2.5 transition-all ${
                                    isDisabled
                                      ? "opacity-45 bg-zinc-50 border-zinc-150 text-zinc-400 pointer-events-none cursor-not-allowed select-none"
                                      : isSelected 
                                        ? "bg-[#fffdfb] border-[#00a174] text-zinc-900 cursor-pointer" 
                                        : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400 cursor-pointer"
                                  }`}
                                  title={isDisabled ? (isNoTower ? "該地區目前查無超高層塔樓住宅 (タワーマンション)，不開放勾選" : "此條件與您已勾選的其他條件有衝突，已自動鎖定防呆") : undefined}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    disabled={isDisabled}
                                    onChange={() => !isDisabled && toggleModifier(mod.id)}
                                    className="mt-0.5 accent-[#00a174]"
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
                                    <div className="text-[10px] text-zinc-500 mt-0.5 font-mono">+ {getModifierPrice(mod.price, mod.id).toLocaleString()} 円 / 月</div>
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
                              const isSelected = calcModifiers.includes(mod.id);
                              const isDisabled = isRentModifierDisabled(mod.id, calcModifiers, calcDistrict);
                              const isTowerFirstFloorConflict = mod.id === "first_floor" && calcModifiers.includes("tower");
                              return (
                                <label 
                                  key={mod.id} 
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
                                    onChange={() => !isDisabled && toggleModifier(mod.id)}
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
                                    <div className="mt-0.5 font-mono text-[10px] text-[#B13818]">− {Math.abs(getModifierPrice(mod.price, mod.id)).toLocaleString()} 円 / 月</div>
                                    {mod.id === "lp_gas" && (
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
                          {(guidedMinArea > 0 || guidedAgeMax > 0 || guidedWalkMinutes > 0 || guidedFloorMin >= 2 || guidedCommuteStation) && (
                            <div className="flex flex-wrap gap-1.5 border border-[#DDE3DF] bg-[#FAFCFB] p-2.5">
                              <span className="mr-1 text-[9px] font-bold text-[#66736C]">上方條件同步：</span>
                              {guidedMinArea > 0 && <span className="border border-[#D6EAF0] bg-white px-2 py-0.5 text-[9px] font-bold text-[#3F626D]">{guidedMinArea}㎡以上</span>}
                              {guidedAgeMax > 0 && <span className="border border-[#D6EAF0] bg-white px-2 py-0.5 text-[9px] font-bold text-[#3F626D]">屋齡 {guidedAgeMax} 年內</span>}
                              {guidedWalkMinutes > 0 && <span className="border border-[#D6EAF0] bg-white px-2 py-0.5 text-[9px] font-bold text-[#3F626D]">車站徒步 {guidedWalkMinutes} 分內</span>}
                              {guidedFloorMin >= 2 && <span className="border border-[#D6EAF0] bg-white px-2 py-0.5 text-[9px] font-bold text-[#3F626D]">2 樓以上</span>}
                              {guidedCommuteStation && <span className="border border-[#9ee2cf] bg-[#e6f6f1] px-2 py-0.5 text-[9px] font-bold text-[#007d5a]">通勤至 {toJapaneseStationName(guidedCommuteStation)}駅・{guidedCommuteMinutes} 分內</span>}
                            </div>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {rentSearchFilterOptions.map(option => {
                              const isSelected = rentSearchFilters.includes(option.key);
                              return (
                                <label key={option.key} className={`p-2.5 border flex items-start gap-2.5 cursor-pointer transition-colors ${isSelected ? "border-[#00a174] bg-[#e6f6f1]" : "border-[#DDE3DF] bg-white hover:border-[#9ee2cf]"}`}>
                                  <input type="checkbox" checked={isSelected} onChange={() => toggleRentSearchFilter(option.key)} className="mt-0.5 accent-[#00a174]" />
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
                              const isSelected = calcBuyModifiers.includes(mod.id);
                              const isDisabled = isBuyModifierDisabled(mod.id, calcBuyModifiers, calcDistrict);
                              const isNoTower = mod.id === "tower" && !hasTowerMansionSupport(calcDistrict);
                              const dynamicMult = getDynamicBuyModifierMultiplier(mod.id, calcDistrict);
                              return (
                                <label 
                                  key={mod.id} 
                                  className={`p-3 border flex items-start gap-2.5 transition-all h-full ${
                                    isDisabled
                                      ? "opacity-45 bg-zinc-50 border-zinc-150 text-zinc-400 pointer-events-none cursor-not-allowed select-none"
                                      : isSelected 
                                        ? "bg-[#fffdfb] border-[#00a174] text-zinc-900 cursor-pointer" 
                                        : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400 cursor-pointer"
                                  }`}
                                  title={isDisabled ? (isNoTower ? "該地區目前查無超高層塔樓住宅 (タワーマンション)，不開放勾選" : "此條件與您已勾選的其他條件有衝突，已自動鎖定防呆") : undefined}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    disabled={isDisabled}
                                    onChange={() => !isDisabled && toggleBuyModifier(mod.id)}
                                    className="mt-1 accent-[#00a174]"
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
                                    <div className="text-[10px] text-[#00a174] font-bold mt-1 font-mono">
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
                          <span className="font-bold text-zinc-800 block text-xs tracking-wider">★ 可能壓低市場價格的條件（帶租約、舊耐震或土地權利受限）：</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {buyBudgetModifiers.filter(m => m.type === "minus").map((mod) => {
                              const isSelected = calcBuyModifiers.includes(mod.id);
                              const isDisabled = isBuyModifierDisabled(mod.id, calcBuyModifiers, calcDistrict);
                              const dynamicMult = getDynamicBuyModifierMultiplier(mod.id, calcDistrict);
                              return (
                                <label 
                                  key={mod.id} 
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
                                    onChange={() => !isDisabled && toggleBuyModifier(mod.id)}
                                    className="mt-1 accent-zinc-800"
                                  />
                                  <div className="flex-grow font-sans">
                                    <div className="font-semibold leading-tight font-sans flex items-center justify-between gap-1">
                                      <span className={isDisabled ? "text-zinc-400 line-through decoration-zinc-300" : "text-zinc-900"}>{mod.text}</span>
                                      {isDisabled && <span className="text-[9px] bg-zinc-200 text-zinc-500 font-bold font-sans px-1 rounded-sm flex-shrink-0 scale-90">衝突鎖定</span>}
                                    </div>
                                    <div className="text-[10px] text-zinc-500 mt-1 leading-normal font-sans">{mod.description}</div>
                                    <div className="mt-1 font-mono text-[10px] font-bold text-[#B13818]">
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
                    <div className="absolute top-0 right-4 bg-[#00a174] text-white px-2.5 py-0.5 text-xs select-none font-sans flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-white" />
                      <span>精算結果</span>
                    </div>
                    
                    {calcMode === "rent" ? (
                      <>
                        <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2 font-sans">
                          {getSelectedDistrictData().sourceDate || "最新"} 市場推估房租預算：
                        </h4>
                        
                        {/* The Big Number */}
                        <div className="border-b border-[#1A2A22] pb-4 mb-4">
                          <div className="flex items-baseline gap-1 font-sans">
                            <span className="text-3xl md:text-4xl font-extrabold text-[#00a174] tracking-tight font-mono">
                              {getCalculatedRent().toLocaleString()}
                            </span>
                            <span className="text-base font-bold text-[#1A2A22]">日圓 / 月</span>
                          </div>
                          <div className="text-xs text-zinc-500 mt-1.5 font-sans leading-relaxed">
                            約合 <strong>{(getCalculatedRent() / 10000).toFixed(1)}</strong> 萬日圓／月
                          </div>
                        </div>

                        {/* Breakdown details */}
                        <div className="space-y-3.5 text-xs font-sans">
                          <div>
                            <span className="text-zinc-500 block">所選基本平均租金 (<span lang="ja" className="font-jp">{districtDisplayName}</span>)：</span>
                            <span className="font-bold text-zinc-800 font-mono">
                              {(parseFloat(getSelectedDistrictData()[calcRoomType as keyof typeof getSelectedDistrictData] as string) * 10000).toLocaleString()} 円
                            </span>
                          </div>

                          {calcStation !== "none" && (
                            <div className="flex justify-between items-baseline border-t border-[#E1E6E3] pt-3 font-sans">
                              <span className="text-zinc-500">周邊站點溢折價 (<span lang="ja" className="font-jp">{stationDisplayName}駅</span>)：</span>
                              {(() => {
                                const currentStation = (districtStations[calcDistrict] || []).find(s => s.name === calcStation);
                                if (!currentStation) return null;
                                let price = 0;
                                if (currentStation.type === "major") price = 10000;
                                else if (currentStation.type === "regular") price = 5000;
                                else if (currentStation.type === "minor") price = -5000;
                                
                                const adjustedPrice = getModifierPrice(price);
                                return (
                                  <span className={`font-bold font-mono ${adjustedPrice >= 0 ? "text-[#00a174]" : "text-[#B13818]"}`}>
                                    {adjustedPrice >= 0 ? "+" : ""}
                                    {adjustedPrice.toLocaleString()} 円
                                  </span>
                                );
                              })()}
                            </div>
                          )}

                          {calcModifiers.length > 0 && (() => {
                            const modifierSubtotal = calcModifiers.reduce(
                              (total, id) => total + getModifierPrice(getBudgetModifier(id)?.price || 0, id),
                              0
                            );
                            return (
                            <div className="space-y-2 border-t border-[#E1E6E3] pt-3">
                              <div className="flex justify-between items-baseline font-sans">
                                <span className="text-zinc-500">條件調整小計：</span>
                                <span className={`font-bold font-mono ${
                                  modifierSubtotal >= 0
                                    ? "text-[#00a174]" 
                                    : "text-[#B13818]"
                                }`}>
                                  {modifierSubtotal >= 0 ? "+" : ""}
                                  {modifierSubtotal.toLocaleString()} 円
                                </span>
                              </div>
                              <div className="divide-y divide-[#E1E6E3] border-y border-[#E1E6E3] text-[11px] leading-relaxed">
                                {calcModifiers.map((id) => {
                                  const mod = getBudgetModifier(id);
                                  if (!mod) return null;
                                  const adjustedPrice = getModifierPrice(mod.price, mod.id);
                                  const isPlus = mod.type === "plus";
                                  return (
                                    <div key={id} className={`flex items-start justify-between gap-2 px-2 py-1.5 ${isPlus ? "bg-[#F1FAF7]" : "bg-[#FFF6F1]"}`}>
                                      <span className="flex min-w-0 items-start gap-1.5 break-all text-zinc-700">
                                        <span className={`mt-px inline-flex h-4 w-4 shrink-0 items-center justify-center text-[10px] font-bold ${isPlus ? "bg-[#DDF4EC] text-[#007D5A]" : "bg-[#FBE4D9] text-[#B13818]"}`}>
                                          {isPlus ? "+" : "−"}
                                        </span>
                                        <span>{mod.text}</span>
                                      </span>
                                      <span className={`shrink-0 font-mono font-medium ${isPlus ? "text-[#008C68]" : "text-[#B13818]"}`}>
                                        {isPlus ? "+" : ""}
                                        {adjustedPrice.toLocaleString()} 円
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            );
                          })()}

                          {/* Relative listing supply and competition assessment */}
                          {(() => {
                            const assessment = getAvailabilityAssessment();
                            return (
                              <div className="border-t border-[#D4DDD8] pt-4">
                                <div className="mb-3 flex items-end justify-between gap-3">
                                  <div>
                                    <span className="block font-bold text-[#00a174]">房源供給與競爭評估</span>
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
                                      <div className={`h-full bg-[#00a174] ${assessment.supply.width}`} />
                                    </div>
                                  </div>
                                  <div className="border border-[#DDE3DF] bg-white p-3">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[10px] font-bold text-[#66736C]">熱門物件競爭程度</span>
                                      <span className={`text-xs font-bold ${assessment.competition.tone}`}>{assessment.competition.label}</span>
                                    </div>
                                    <div className="mt-2 h-2 overflow-hidden bg-[#EDF1EE]">
                                      <div className={`h-full bg-[#E94E2B] ${assessment.competition.width}`} />
                                    </div>
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
                                      <span key={condition} className="border border-[#9ee2cf] bg-[#e6f6f1] px-2 py-1 text-[9px] font-bold text-[#007d5a]">{condition}</span>
                                    ))}
                                  </div>
                                )}
                                <p className="mt-3 border-l-2 border-[#00a174] bg-[#F5F8F6] px-3 py-2.5 text-[10px] leading-relaxed text-[#3F5147]">{assessment.advice}</p>
                              </div>
                            );
                          })()}

                          {/* Estimation of Initial Fees */}
                          <div className="border-t border-[#D4DDD8] pt-4">
                            <span className="text-[#00a174] font-bold flex items-center gap-1.5 mb-2">
                              <Receipt className="w-4 h-4 text-[#00a174] shrink-0" />
                              <span>建議準備的初期費用</span>
                            </span>
                            {(() => {
                              const monthlyRent = getCalculatedRent();
                              const rate = getSelectedDistrictData();
                              const station = calcStation === "none"
                                ? null
                                : (districtStations[calcDistrict] || []).find(item => item.name === calcStation) || null;
                              const highDemandLocation = parseFloat(rate.k1) >= 9.5 || station?.type === "major";
                              const hasPetRequirement = rentSearchFilters.includes("pets");
                              const hasTowerRequirement = calcModifiers.includes("tower");
                              const wantsNoKeyMoney = rentSearchFilters.includes("noKeyMoney");
                              const wantsNoDeposit = rentSearchFilters.includes("noDeposit");
                              const pressureCount = Number(highDemandLocation) + Number(hasPetRequirement) + Number(hasTowerRequirement);
                              const recommendedMultiplier = wantsNoKeyMoney && wantsNoDeposit && pressureCount === 0
                                ? 4
                                : pressureCount >= 2 ? 6 : 5;
                              const recommendedCash = monthlyRent * recommendedMultiplier;
                              const cashGap = recommendedCash - rentUpfrontCash;
                              const locationName = station ? `${toJapaneseStationName(station.name)}駅` : districtDisplayName;
                              const reasons = [
                                highDemandLocation
                                  ? wantsNoKeyMoney
                                    ? `${locationName}屬熱門地段，免禮金房源通常較少`
                                    : `${locationName}屬熱門地段，多數房源多有禮金條件`
                                  : null,
                                hasPetRequirement ? "可養寵物物件可能另有追加敷金或清潔條件" : null,
                                hasTowerRequirement ? "塔樓大廈常有較高的保證、保險或附帶費用" : null,
                                wantsNoDeposit ? "免押金仍可能改收退房清潔費或定額償卻費" : null,
                                wantsNoKeyMoney && !highDemandLocation ? "已把免禮金列為必要條件" : null
                              ].filter(Boolean) as string[];

                              return (
                                <div className="border border-zinc-200 bg-[#FAFCFB] p-3 font-sans">
                                  <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between">
                                    <div>
                                      <p className="text-[10px] font-bold text-[#66736C]">
                                      {recommendedMultiplier === 6 ? "目前條件較多，建議先抓" : recommendedMultiplier === 4 ? "免禮金／免押金優惠情境" : "一般準備基準"}
                                      </p>
                                      <p className="mt-1 text-[11px] font-bold text-[#1A2A22]">租金 × {recommendedMultiplier}</p>
                                    </div>
                                    <strong className="font-mono text-lg text-[#008C68]">¥{recommendedCash.toLocaleString()}</strong>
                                  </div>

                                  <p className="mt-2 border-t border-zinc-200 pt-2 text-[10px] leading-relaxed text-[#52635A]">
                                    {reasons.length
                                      ? reasons.join("；") + "。"
                                      : "目前沒有明顯增加初期費用的特殊條件，先以一般物件的 5 倍準備較穩妥。"}
                                  </p>

                                  {rentUpfrontCash > 0 && (
                                    <p className={`mt-2 text-[10px] font-bold ${cashGap > 0 ? "text-[#B13818]" : "text-[#007D5A]"}`}>
                                      {cashGap > 0
                                        ? `目前準備 ${formatManYen(rentUpfrontCash)}，距建議金額約差 ${formatManYen(cashGap)}。`
                                        : `目前準備 ${formatManYen(rentUpfrontCash)}，可涵蓋這個建議金額。`}
                                    </p>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => setShowInitialFeeDetails(current => !current)}
                                    aria-expanded={showInitialFeeDetails}
                                    className="mt-3 flex w-full items-center justify-between border-t border-zinc-200 pt-2 text-left text-[10px] font-bold text-[#3F5147] hover:text-[#007D5A]"
                                  >
                                    <span>4／5／6 倍分別代表什麼？</span>
                                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showInitialFeeDetails ? "rotate-180" : ""}`} />
                                  </button>

                                  {showInitialFeeDetails && (
                                    <div className="mt-2 divide-y divide-zinc-200 border-t border-zinc-200 text-[10px] leading-relaxed text-[#52635A]">
                                      <div className="grid grid-cols-[52px_1fr_auto] gap-2 py-2">
                                        <strong className="text-[#1A2A22]">4 倍</strong>
                                        <span>優惠情境：熱門地區通常要同時遇到免禮金，並搭配免租、仲介費優惠或較低附帶費用，才較有機會接近。</span>
                                        <span className="font-mono text-[#1A2A22]">¥{(monthlyRent * 4).toLocaleString()}</span>
                                      </div>
                                      <div className="grid grid-cols-[52px_1fr_auto] gap-2 py-2">
                                        <strong className="text-[#007D5A]">5 倍</strong>
                                        <span>一般情境：涵蓋起租租金、敷禮金、保證費、仲介費、保險與常見契約費用。</span>
                                        <span className="font-mono text-[#007D5A]">¥{(monthlyRent * 5).toLocaleString()}</span>
                                      </div>
                                      <div className="grid grid-cols-[52px_1fr_auto] gap-2 py-2">
                                        <strong className="text-[#7A5A1F]">6 倍</strong>
                                        <span>費用較多：熱門物件有禮金，或另有寵物敷金、清潔、換鎖及其他指定費用時較接近此範圍。</span>
                                        <span className="font-mono text-[#7A5A1F]">¥{(monthlyRent * 6).toLocaleString()}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        {/* CTA */}
                        <div className="mt-6 pt-2 font-sans">
                          <button 
                            onClick={() => {
                              const roomTypeLabel = ROOM_TYPE_LABEL[calcRoomType];
                              const stationPart = calcStation !== "none" ? `${calcStation}站附近` : "尚未指定車站";
                              const upgradeConditions = calcModifiers.map(id => getBudgetModifier(id)).filter(mod => mod?.type === "plus").map(mod => mod!.text).join("、");
                              const compromiseConditions = calcModifiers.map(id => getBudgetModifier(id)).filter(mod => mod?.type === "minus").map(mod => mod!.text).join("、");
                              const searchFilters = rentSearchFilterOptions.filter(option => rentSearchFilters.includes(option.key)).map(option => option.label).join("、");
                              const commuteCondition = guidedCommuteStation ? `${toJapaneseStationName(guidedCommuteStation)}駅，最長 ${guidedCommuteMinutes} 分鐘` : "尚未指定";
                              const messageText = `您好，我剛才使用租金預算計算器，請依以下完整條件協助我找房：\n- 地區：${calcDistrict}\n- 車站：${stationPart}\n- 通勤條件：${commuteCondition}\n- 格局：${roomTypeLabel}\n- 推估月租：¥${getCalculatedRent().toLocaleString()}\n${upgradeConditions ? `- 希望條件：${upgradeConditions}\n` : ""}${compromiseConditions ? `- 可接受的妥協：${compromiseConditions}\n` : ""}${searchFilters ? `- 房源篩選條件：${searchFilters}\n` : ""}請分析這組條件的找房難度、應優先保留與可放寬的項目，並告訴我還需要補充哪些資料。若要推薦即時房源，請先確認我的簽證、工作、收入、入住日期與居住人數，不要自行假設。`;
                              handleTabChange("chat");
                              handleSendMessage(undefined, messageText);
                            }}
                            className="w-full bg-[#1A2A22] text-white py-3 px-4 font-bold tracking-wider hover:bg-[#00a174] cursor-pointer text-xs uppercase transition-colors"
                            id="calc-send-to-ai"
                          >
                            帶入此條件諮詢 AI 顧問 ➔
                          </button>
                        </div>

                        {/* Rent Disclaimer：全卡只保留這一段，房源供給、初期費用等估算的方法論限制都收在這裡，不再逐段重複。 */}
                        <div className="mt-4 border-t border-[#E1E6E3] pt-3 text-justify font-sans text-[10px] leading-relaxed text-zinc-400">
                          ※ 行情模型估算；實際租金、供給與初期費用依當期募集物件為準。
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
                            <span className="text-3xl md:text-4xl font-extrabold text-[#00a174] tracking-tight font-mono">
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
                            <span className="text-zinc-500 block">
                              {getOfficialBuyEstimate(getSelectedDistrictData().region, calcDistrict, calcRoomType)
                                ? "國交省交易資料基本總價"
                                : "租金收益率模型基本總價"} (<span lang="ja" className="font-jp">{districtDisplayName}</span>)：
                            </span>
                            <span className="font-bold text-zinc-800 font-mono">
                              {(getDistrictBuyPrice(calcDistrict, calcRoomType) * 10000).toLocaleString()} 円 ({getDistrictBuyPrice(calcDistrict, calcRoomType)} 萬日圓)
                            </span>
                            {(() => {
                              const estimate = getOfficialBuyEstimate(getSelectedDistrictData().region, calcDistrict, calcRoomType);
                              return estimate ? (
                                <span className="mt-1 block text-[9px] leading-relaxed text-zinc-400">
                                  近{estimate.windowQuarters === 4 ? "四" : "八"}季樣本 {estimate.sampleCount} 筆，期間 {estimate.periodStart}～{estimate.periodEnd}；採中位數後再套用所選條件。
                                </span>
                              ) : (
                                <span className="mt-1 block text-[9px] leading-relaxed text-zinc-400">
                                  此地區目前採用租金 ÷ 假設表面投報率的概算，不代表實際成交價格。
                                </span>
                              );
                            })()}
                          </div>

                          {calcBuyModifiers.length > 0 && (
                            <div className="space-y-2 border-t border-[#E1E6E3] pt-3">
                              <span className="text-zinc-500 block">條件調整清單：</span>
                              <div className="divide-y divide-[#E1E6E3] border-y border-[#E1E6E3] text-[11px] leading-relaxed">
                                {calcBuyModifiers.map((id) => {
                                  const mod = getBuyModifier(id);
                                  if (!mod) return null;
                                  const isPlus = mod.type === "plus";
                                  const dynamicMult = getDynamicBuyModifierMultiplier(id, calcDistrict);
                                  return (
                                    <div key={id} className={`flex items-start justify-between gap-2 px-2 py-1.5 ${isPlus ? "bg-[#F1FAF7]" : "bg-[#FFF6F1]"}`}>
                                      <span className="flex min-w-0 items-start gap-1.5 break-all font-sans text-zinc-700">
                                        <span className={`mt-px inline-flex h-4 w-4 shrink-0 items-center justify-center text-[10px] font-bold ${isPlus ? "bg-[#DDF4EC] text-[#007D5A]" : "bg-[#FBE4D9] text-[#B13818]"}`}>
                                          {isPlus ? "+" : "−"}
                                        </span>
                                        <span>{mod.text}</span>
                                      </span>
                                      <span className={`shrink-0 font-mono font-medium ${isPlus ? "text-[#008C68]" : "text-[#B13818]"}`}>
                                        {isPlus ? "+" : "-"}{Math.abs(dynamicMult * 100).toFixed(0)}%
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Initial purchase fees section */}
                          <div className="border-t border-[#D4DDD8] pt-3">
                            <span className="text-[#00a174] font-bold flex items-center gap-1.5 mb-2">
                              <Receipt className="w-4 h-4 text-[#00a174] shrink-0" />
                              <span>購屋初期諸費用概算（一次性過戶費用）：</span>
                            </span>
                            <div className="bg-[#F5F8F6] border border-zinc-200">
                              <div className="space-y-1.5 p-3">
                              <div className="flex justify-between font-bold text-zinc-800 text-[11px] md:text-xs">
                                <span>現金全款購置 (約總價 7%):</span>
                                <span className="font-mono text-zinc-900">{(getCalculatedBuyPrice() * 0.07 / 10000).toFixed(0)} 萬日圓</span>
                              </div>
                              <div className="flex justify-between font-bold text-zinc-800 text-[11px] md:text-xs">
                                <span>申請貸款購置 (約總價 9%):</span>
                                <span className="font-mono text-zinc-900">{(getCalculatedBuyPrice() * 0.09 / 10000).toFixed(0)} 萬日圓</span>
                              </div>
                              <p className="mt-1 flex items-start gap-1 border-t border-zinc-200 pt-1.5 text-justify text-[10px] text-zinc-500">
                                <Lightbulb className="w-3.5 h-3.5 text-[#00a174] shrink-0 mt-0.5" />
                                <span>先以總價比例快速準備預算；展開後可查看費用組成與大致付款時間。</span>
                              </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setShowBuyFeeDetails(current => !current)}
                                aria-expanded={showBuyFeeDetails}
                                className="flex w-full items-center justify-between border-t border-zinc-200 bg-white px-3 py-2.5 text-left text-[11px] font-bold text-[#31443A] hover:text-[#00a174]"
                              >
                                <span>{showBuyFeeDetails ? "收合費用組成" : "展開費用組成"}</span>
                                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showBuyFeeDetails ? "rotate-180" : ""}`} />
                              </button>
                              {showBuyFeeDetails && (
                                <div className="grid gap-px border-t border-zinc-200 bg-zinc-200 sm:grid-cols-2">
                                  {[
                                    ["簽約時", "手付金、契約印紙稅；仲介費依媒介契約約定"],
                                    ["交屋時", "尾款、仲介費、司法書士報酬、登錄免許稅及各項清算款"],
                                    ["過戶後", "不動產取得稅通常於取得後另行收到通知"],
                                    ["貸款案件", "銀行手續費、保證費、抵押權設定登記及保險費"],
                                    ["大樓物件", "管理費、修繕積立金與固定資產稅等依交屋日清算"],
                                    ["保險與個案費用", "火災／地震保險、估價、翻譯、海外送金等依案件發生"]
                                  ].map(([label, description]) => (
                                    <div key={label} className="bg-white p-3">
                                      <strong className="block text-[10px] tracking-wide text-[#007d5a]">{label}</strong>
                                      <p className="mt-1 text-[10px] leading-relaxed text-zinc-600">{description}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <p className="mt-2 text-[9px] leading-relaxed text-zinc-400">
                              7%／9%是整體準備預算的概算，不代表每項費用固定按房價比例計算；實際金額會依成交型態、評價額、貸款方案與特例資格改變。
                            </p>
                          </div>

                          {/* Loan payments section */}
                          <div className="border-t border-[#D4DDD8] pt-3">
                            <span className="text-[#00a174] font-bold block mb-1">銀行貸款與月還款額試算：</span>
                            <div className="bg-zinc-50 p-3 border border-zinc-200 space-y-1.5">
                              <div className="mb-2 grid grid-cols-3 gap-2 border-b border-zinc-200 pb-2">
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
                              <div className="mt-1 flex justify-between border-t border-zinc-200 pt-1.5 text-[11px] font-bold text-[#00a174] md:text-xs">
                                <span>每月本息試算 ({annualRate}%／{loanYears}年):</span>
                                <span className="font-mono text-[#00a174]">{getMonthlyPayment(getCalculatedBuyPrice()).toLocaleString()} 円 / 月</span>
                              </div>
                              <p className="text-[10px] text-zinc-500 mt-1 text-justify">
                                本試算採本息平均攤還，不含寬限期、銀行手續費、保證費、提前清償費或利率變動。可自行調整參數；是否核貸與實際條件由金融機構個案審査。
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* CTA */}
                        <div className="mt-6 pt-2 font-sans">
                          <button 
                            onClick={() => {
                              const buyConditions = calcBuyModifiers.map(id => getBuyModifier(id)?.text).filter(Boolean).join("、");
                              const messageText = `您好，我剛才使用買房預算計算器，請依以下完整條件協助我評估：\n- 地區：${calcDistrict}\n- 估計物件總價：${(getCalculatedBuyPrice() / 10000).toFixed(0)} 萬日圓\n- 預計貸款比例：${loanRatio}%\n- 試算利率與年期：${annualRate}%／${loanYears} 年\n${buyConditions ? `- 已選條件：${buyConditions}\n` : ""}請分析這組條件的買房可行性、貸款與初期費用風險，以及我還需要補充哪些個人與物件資料。`;
                              handleTabChange("chat");
                              handleSendMessage(undefined, messageText);
                            }}
                            className="w-full bg-[#1A2A22] text-white py-3 px-4 font-bold tracking-wider hover:bg-[#00a174] cursor-pointer text-xs uppercase transition-colors"
                            id="calc-send-to-ai"
                          >
                            帶入此條件諮詢 AI 顧問 ➔
                          </button>
                        </div>

                        {/* Buy Disclaimer */}
                        <div className="mt-4 pt-3 border-t border-zinc-100 text-[10px] text-zinc-400 font-sans leading-relaxed text-justify">
                          {getOfficialBuyEstimate(getSelectedDistrictData().region, calcDistrict, calcRoomType) ? (
                            <>
                              * 方法與限制：中心值使用國交省交易資料的行政區／間取り中位數，再套用條件係數；不是銀行鑑價或成交保證。±15% 僅為閱讀概算的波動帶。<br />
                              <span lang="ja">{MLIT_API_CREDIT}</span>
                            </>
                          ) : (
                            <>* 方法與限制：總價以區域租金基準 ÷ 假設表面投報率，再套用實務折溢價係數估算；不是實際成交統計或銀行鑑價。±15% 僅為閱讀概算的波動帶；實際價格還會受面積、樓層、座向、權利、管理、修繕、災害風險及交易背景影響。</>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Calculator Guide Card */}
                  {(calcMode === "buy" || aiResult?.advisorAdvice) && <div className="bg-white border border-[#1A2A22] p-5 space-y-3 font-sans">
                    <h5 className="font-bold text-sm text-[#1A2A22] flex items-center gap-1.5">
                      <Smile className="w-4.5 h-4.5 text-[#00a174]" />
                      {calcMode === "rent" ? (
                        <span>Linus AI 顧問意見</span>
                      ) : (
                        <span>Linus 實務置產提示</span>
                      )}
                    </h5>
                    <div className="text-xs text-zinc-600 space-y-2.5 font-sans leading-relaxed">
                      {calcMode === "rent" ? (
                        <div className="space-y-1 text-[11px] leading-relaxed text-[#3F5147]">
                          {renderFormattedText(aiResult?.advisorAdvice || "")}
                        </div>
                      ) : (
                        <>
                          <p>
                            <strong>關於買房折溢價與實務：</strong>
                          </p>
                          <p className="text-justify leading-relaxed">
                            在日本置產，<strong>「全新 (新築)」</strong>建案存在極高造價與品牌溢價，若一購入往往會立刻產生折舊。相比之下，屋齡在 15~25 年且進行過<strong>「全面現代化翻新 (リノベーション済み)」</strong>的中古公寓 (中古マンション)，內部裝潢、廚衛設備更與新成屋無異，具備最高的性價比與投資回報率！
                          </p>
                          <p className="text-justify leading-relaxed">
                            此外，<strong>「帶租約出售（オーナーチェンジ）」</strong>的投資房，因承接既有租約、通常不能進入室內確認，且過戶後不能立即收回自住，市場價格往往會低於同條件的空屋。購入前應一併確認現行租金、租客與契約內容、修繕紀錄及未來空置風險，並以長期純收租的前提評估。
                          </p>
                        </>
                      )}
                    </div>
                  </div>}
                </div>
              </div>}
            </motion.div>
  );
}
