import { districtStations, rentRates } from "../data/housingMarket";
import {
  hasTowerMansionSupport
} from "../lib/calcRules";
import { districtAreaGroup, stationAreaGroups } from '../lib/calculator/locationSelection';
import {
  normalizeGuidedLineName,
  normalizeRentBudgetSelection,
  normalizeStructureOption,
  sameGuidedLine
} from '../lib/calculator/options';
import type { RentSearchFilter } from '../lib/calculator/types';
import {
  RentRecommendation,
  RentSearchCriteria,
  getRentModifierIds
} from "../lib/rentAnalysis";
import { toJapanesePlaceName, toJapaneseStationName } from "../lib/transit";
import type { CalculatorFormContext } from './calculatorFormContext';
type Context = Pick<CalculatorFormContext,
  "setCalcMode"
  | "setCalcDistrict"
  | "setGuidedDistrictSelections"
  | "setGuidedStationSelections"
  | "setCalcRoomType"
  | "setGuidedMinArea"
  | "setGuidedAgeMax"
  | "setGuidedCommuteStation"
  | "setGuidedCommuteMinutes"
  | "setGuidedAutoLock"
  | "setGuidedElevator"
  | "setGuidedStructure"
  | "setCalcStation"
  | "setGuidedLine"
  | "setGuidedLineSelections"
  | "setCalcModifiers"
  | "setRentMonthlyBudgetMin"
  | "setRentMonthlyBudget"
  | "setRentUpfrontCash"
  | "setRentSearchFilters"
  | "setAppliedNotice"
  | "setShowAdvancedTools"
  | "calcDistrict"
  | "setLocationGuardNotice"
  | "setGuidedStationDraft"
  | "setGuidedVisaType"
  | "setGuidedApplicationChannel">;
/** AI 條件回填及推薦套用；保留原正規化、上限與互斥規則。 */
export function createCalculatorCriteriaSync(context: Context) {
  const {
    setCalcMode,
    setCalcDistrict,
    setGuidedDistrictSelections,
    setGuidedStationSelections,
    setCalcRoomType,
    setGuidedMinArea,
    setGuidedAgeMax,
    setGuidedCommuteStation,
    setGuidedCommuteMinutes,
    setGuidedAutoLock,
    setGuidedElevator,
    setGuidedStructure,
    setCalcStation,
    setGuidedLine,
    setGuidedLineSelections,
    setCalcModifiers,
    setRentMonthlyBudgetMin,
    setRentMonthlyBudget,
    setRentUpfrontCash,
    setRentSearchFilters,
    setAppliedNotice,
    setShowAdvancedTools,
    calcDistrict,
    setLocationGuardNotice,
    setGuidedStationDraft,
    setGuidedVisaType,
    setGuidedApplicationChannel,
  } = context;

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
    setAppliedNotice(`已將「${toJapanesePlaceName(item.district)}${selectedStation !== "none" ? `・${toJapaneseStationName(selectedStation)}駅` : ""}」及需求條件同步帶入上方表單與下方租金條件。`);
    setShowAdvancedTools(true);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.getElementById("calc-engine-container")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  };

  const syncCriteriaToForm = (criteria: RentSearchCriteria) => {
    const requestedDistricts = Array.from(new Set([...(criteria.districts || []), criteria.district].filter(Boolean) as string[]))
      .filter(district => rentRates.some(rate => rate.district === district));
    const rawRequestedStations = Array.from(new Set([...(criteria.stations || []), criteria.station].filter(Boolean) as string[]));
    const seenReqNorms = new Set<string>();
    const requestedStations = rawRequestedStations.filter(st => {
      const norm = toJapaneseStationName(st.replace(/[\(（].*?[\)）]/g, "").replace(/[駅站]$/, "").trim());
      if (seenReqNorms.has(norm)) return false;
      seenReqNorms.add(norm);
      return true;
    });
    const stationDistricts = requestedStations.flatMap(stationName => {
      const targetNorm = toJapaneseStationName(stationName.replace(/[\(（].*?[\)）]/g, "").replace(/[駅站]$/, "").trim());
      return Object.entries(districtStations)
        .filter(([, stations]) => stations.some(station => toJapaneseStationName(station.name) === targetNorm))
        .map(([district]) => district);
    });
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
    const allowedStationNormMap = new Map<string, string>();
    nextDistrictSelections.forEach(district => {
      (districtStations[district] || []).forEach(station => {
        allowedStationNormMap.set(toJapaneseStationName(station.name), station.name);
      });
    });
    const nextStationSelections = requestedStations
      .map(station => {
        const norm = toJapaneseStationName(station.replace(/[\(（].*?[\)）]/g, "").replace(/[駅站]$/, "").trim());
        return allowedStationNormMap.get(norm);
      })
      .filter((st): st is string => Boolean(st))
      .filter((st, idx, arr) => arr.indexOf(st) === idx)
      .slice(0, 6);
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
    if (criteria.visaType) setGuidedVisaType(criteria.visaType);
    if (criteria.applicationChannel) setGuidedApplicationChannel(criteria.applicationChannel);
    setCalcModifiers(modifiers);
    const syncNotices = [
      allCandidateDistricts.length > compatibleDistricts.length
        ? `AI 解析到跨生活圈或超出上限的地點，已保留 ${preferredGroup || "同一"}生活圈內最優先的 4 個地區。`
        : null,
      requestedStations.filter(station => {
        const norm = toJapaneseStationName(station.replace(/[\(（].*?[\)）]/g, "").replace(/[駅站]$/, "").trim());
        return allowedStationNormMap.has(norm);
      }).length > nextStationSelections.length
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
  return {
    applyRecommendationToCalculator,
    syncCriteriaToForm,
  };
}
