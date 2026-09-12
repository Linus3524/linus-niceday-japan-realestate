import { buildStructuredRentCriteria as buildRentCriteria } from '../lib/calculator/criteriaMapping';
import {
  ROOM_TYPE_DETAIL_LABEL,
  RentSearchCriteria
} from "../lib/rentAnalysis";
import type { CalculatorFormContext } from './calculatorFormContext';
import { createCalculatorCriteriaSync } from './createCalculatorCriteriaSync';
import { createCalculatorLocationActions } from './createCalculatorLocationActions';
import { createCalculatorModifierActions } from './createCalculatorModifierActions';
/** 組合表單操作與 criteria 映射，供 controller 及分析流程共用。 */
export function createCalculatorFormActions(context: CalculatorFormContext) {

  const {
    rentSearchFilters,
    calcModifiers,
    guidedStructure,
    guidedAutoLock,
    guidedElevator,
    calcRoomType,
    guidedDistrictSelections,
    guidedCommuteStation,
    guidedStationSelections,
    guidedLineSelections,
    guidedMinArea,
    rentMonthlyBudgetMin,
    rentMonthlyBudget,
    guidedCommuteMinutes,
    guidedVisaType,
    guidedApplicationChannel,
    guidedAgeMax,
  } = context;
  const { applyRecommendationToCalculator, syncCriteriaToForm } = createCalculatorCriteriaSync(context);

  const {
    toggleRentSearchFilter,
    toggleModifier,
    washbasinSelected,
    bidetSelected,
    toggleBathroomFacility,
    toggleBuildingSecurity,
    selectGuidedStructure,
    toggleBuyModifier,
    areaOptions,
    guidedWalkMinutes,
    guidedFloorMin,
    selectGuidedRoomType,
    selectGuidedArea,
    selectGuidedWalk,
    selectGuidedAge,
    selectGuidedFloor,
  } = createCalculatorModifierActions(context);

  const {
    selectGuidedStation,
    validateCommuteCompatibility,
    addGuidedDistrict,
    removeGuidedDistrict,
    addGuidedLine,
    removeGuidedLine,
    addGuidedStation,
    removeGuidedStation,
    guidedLineOptions,
    guidedLocationStationOptions,
    commuteStationOptions,
  } = createCalculatorLocationActions(context);

  const roomTypeLabel = ROOM_TYPE_DETAIL_LABEL[calcRoomType];
  const buildStructuredRentCriteria = (): RentSearchCriteria => buildRentCriteria({
    calcRoomType,
    guidedMinArea,
    rentMonthlyBudgetMin,
    rentMonthlyBudget,
    guidedDistrictSelections,
    guidedLineSelections,
    guidedStationSelections,
    guidedWalkMinutes,
    guidedCommuteStation,
    guidedCommuteMinutes,
    guidedVisaType,
    guidedApplicationChannel,
    guidedAgeMax,
    guidedFloorMin,
    calcModifiers,
    guidedAutoLock,
    guidedElevator,
    guidedStructure,
    rentSearchFilters,
  });
  return {
    applyRecommendationToCalculator,
    toggleRentSearchFilter,
    toggleModifier,
    washbasinSelected,
    bidetSelected,
    toggleBathroomFacility,
    toggleBuildingSecurity,
    selectGuidedStructure,
    toggleBuyModifier,
    areaOptions,
    guidedWalkMinutes,
    guidedFloorMin,
    selectGuidedRoomType,
    selectGuidedArea,
    selectGuidedWalk,
    selectGuidedAge,
    selectGuidedFloor,
    selectGuidedStation,
    validateCommuteCompatibility,
    addGuidedDistrict,
    removeGuidedDistrict,
    addGuidedLine,
    removeGuidedLine,
    addGuidedStation,
    removeGuidedStation,
    guidedLineOptions,
    guidedLocationStationOptions,
    commuteStationOptions,
    buildStructuredRentCriteria,
    syncCriteriaToForm,
  };
}
