import { districtStations } from "../data/housingMarket";
import type { StationInfo } from "../data/stationData";
import { districtAreaGroup, stationAreaGroups } from '../lib/calculator/locationSelection';
import {
  normalizeGuidedLineName,
  sameGuidedLine
} from '../lib/calculator/options';
import { toJapanesePlaceName, toJapaneseStationName } from "../lib/transit";
import type { CalculatorFormContext } from './calculatorFormContext';
type Context = Pick<CalculatorFormContext,
  "setCalcDistrict"
  | "setGuidedDistrictSelections"
  | "setGuidedStationSelections"
  | "setCalcStation"
  | "setGuidedLine"
  | "setGuidedLineSelections"
  | "calcDistrict"
  | "guidedLine"
  | "guidedDistrictSelections"
  | "guidedCommuteStation"
  | "setLocationGuardNotice"
  | "guidedStationSelections"
  | "guidedLineSelections"
  | "guidedStationDraft"
  | "setGuidedStationDraft">;
/** 生活圈、行政區、線路與車站選擇及通勤相容性檢查。 */
export function createCalculatorLocationActions(context: Context) {
  const {
    setCalcDistrict,
    setGuidedDistrictSelections,
    setGuidedStationSelections,
    setCalcStation,
    setGuidedLine,
    setGuidedLineSelections,
    calcDistrict,
    guidedLine,
    guidedDistrictSelections,
    guidedCommuteStation,
    setLocationGuardNotice,
    guidedStationSelections,
    guidedLineSelections,
    guidedStationDraft,
    setGuidedStationDraft,
  } = context;

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
  return {
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
  };
}
