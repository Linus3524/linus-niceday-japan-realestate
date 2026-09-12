import type { BudgetModifierId } from '../../data/rentGuideData.js';
import type { RentSearchCriteria, RoomType } from '../rentAnalysis.js';
import type { RentSearchFilter } from './types.js';
export interface StructuredRentForm {
  calcRoomType: RoomType;
  guidedMinArea: number;
  rentMonthlyBudgetMin: number;
  rentMonthlyBudget: number;
  guidedDistrictSelections: string[];
  guidedLineSelections: string[];
  guidedStationSelections: string[];
  guidedWalkMinutes: number;
  guidedCommuteStation: string;
  guidedCommuteMinutes: number;
  guidedVisaType: string;
  guidedApplicationChannel: "domestic" | "overseas";
  guidedAgeMax: number;
  guidedFloorMin: number;
  calcModifiers: BudgetModifierId[];
  guidedAutoLock: boolean;
  guidedElevator: boolean;
  guidedStructure: string;
  rentSearchFilters: RentSearchFilter[];
}
export function buildStructuredRentCriteria({ calcRoomType, guidedMinArea, rentMonthlyBudgetMin, rentMonthlyBudget, guidedDistrictSelections, guidedLineSelections, guidedStationSelections, guidedWalkMinutes, guidedCommuteStation, guidedCommuteMinutes, guidedVisaType, guidedApplicationChannel, guidedAgeMax, guidedFloorMin, calcModifiers, guidedAutoLock, guidedElevator, guidedStructure, rentSearchFilters }: StructuredRentForm): RentSearchCriteria {
  return ({
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
    visaType: guidedVisaType || null,
    applicationChannel: guidedApplicationChannel,
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
}
