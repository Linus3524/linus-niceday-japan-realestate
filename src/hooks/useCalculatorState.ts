import { useState } from "react";
import type { CalculatorTabProps, RentSearchFilter } from '../lib/calculator/types';
import {
  RentRecommendation,
  RentSearchCriteria
} from "../lib/rentAnalysis";

/** 計算器共用 state；保留原初始值與 hook 呼叫順序。 */
export function useCalculatorState(calcDistrict: CalculatorTabProps["calcDistrict"]) {

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
  const [guidedVisaType, setGuidedVisaType] = useState("");
  const [guidedApplicationChannel, setGuidedApplicationChannel] = useState<"domestic" | "overseas">("domestic");
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
  return {
    loanRatio,
    setLoanRatio,
    annualRate,
    setAnnualRate,
    loanYears,
    setLoanYears,
    showBuyFeeDetails,
    setShowBuyFeeDetails,
    showInitialFeeDetails,
    setShowInitialFeeDetails,
    showAdvancedTools,
    setShowAdvancedTools,
    rentInputMode,
    setRentInputMode,
    rentMonthlyBudgetMin,
    setRentMonthlyBudgetMin,
    rentMonthlyBudget,
    setRentMonthlyBudget,
    rentUpfrontCash,
    setRentUpfrontCash,
    guidedLine,
    setGuidedLine,
    guidedDistrictSelections,
    setGuidedDistrictSelections,
    guidedLineSelections,
    setGuidedLineSelections,
    guidedStationSelections,
    setGuidedStationSelections,
    guidedStationDraft,
    setGuidedStationDraft,
    locationGuardNotice,
    setLocationGuardNotice,
    guidedCommuteStation,
    setGuidedCommuteStation,
    guidedCommuteMinutes,
    setGuidedCommuteMinutes,
    guidedAutoLock,
    setGuidedAutoLock,
    guidedElevator,
    setGuidedElevator,
    guidedStructure,
    setGuidedStructure,
    guidedMinArea,
    setGuidedMinArea,
    guidedAgeMax,
    setGuidedAgeMax,
    guidedVisaType,
    setGuidedVisaType,
    guidedApplicationChannel,
    setGuidedApplicationChannel,
    buyAvailableCash,
    setBuyAvailableCash,
    buyMonthlyPaymentBudget,
    setBuyMonthlyPaymentBudget,
    aiPrompt,
    setAiPrompt,
    aiInputLoading,
    setAiInputLoading,
    aiInputError,
    setAiInputError,
    aiResult,
    setAiResult,
    analysisLoading,
    setAnalysisLoading,
    analysisNotice,
    setAnalysisNotice,
    appliedNotice,
    setAppliedNotice,
    rentSearchFilters,
    setRentSearchFilters,
  };
}
export type CalculatorState = ReturnType<typeof useCalculatorState>;
