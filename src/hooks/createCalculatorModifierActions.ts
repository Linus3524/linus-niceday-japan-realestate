import { type BuyModifierId } from "../data/buyHouseData";
import { type BudgetModifierId } from "../data/rentGuideData";
import type { RentSearchFilter } from '../lib/calculator/types';
import {
  type RoomType
} from "../lib/rentAnalysis";
import type { CalculatorFormContext } from './calculatorFormContext';
type Context = Pick<CalculatorFormContext,
  "setCalcRoomType"
  | "setGuidedMinArea"
  | "setGuidedAgeMax"
  | "setGuidedAutoLock"
  | "setGuidedElevator"
  | "setGuidedStructure"
  | "setCalcModifiers"
  | "setRentSearchFilters"
  | "rentSearchFilters"
  | "calcModifiers"
  | "guidedStructure"
  | "guidedAutoLock"
  | "guidedElevator"
  | "calcBuyModifiers"
  | "setCalcBuyModifiers"
  | "calcRoomType">;
/** 設備、面積、屋齡與樓層的表單／計算條件同步。 */
export function createCalculatorModifierActions(context: Context) {
  const {
    setCalcRoomType,
    setGuidedMinArea,
    setGuidedAgeMax,
    setGuidedAutoLock,
    setGuidedElevator,
    setGuidedStructure,
    setCalcModifiers,
    setRentSearchFilters,
    rentSearchFilters,
    calcModifiers,
    guidedStructure,
    guidedAutoLock,
    guidedElevator,
    calcBuyModifiers,
    setCalcBuyModifiers,
    calcRoomType,
  } = context;

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

  const toggleBuyModifier = (id: BuyModifierId) => {
    if (calcBuyModifiers.includes(id)) {
      setCalcBuyModifiers(calcBuyModifiers.filter(other => other !== id));
    } else {
      setCalcBuyModifiers([...calcBuyModifiers, id]);
    }
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
  return {
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
  };
}
