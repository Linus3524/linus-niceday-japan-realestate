import {
AlertTriangle,
ChevronDown,
LoaderCircle,
Sparkles
} from "lucide-react";
import type { CalculatorViewModel } from '../../hooks/useCalculatorController';
import {
RENT_VISA_OPTIONS
} from '../../lib/calculator/options';
import {
ROOM_TYPE_LABEL
} from "../../lib/rentAnalysis";
import { RequirementAssessment } from "../RequirementAssessment";
import { guidedSelectChevronClass } from './fieldStyles';
import { GuidedApplicationFields } from './GuidedApplicationFields';
import { GuidedBudgetFields } from './GuidedBudgetFields';
import { GuidedBuildingFields } from './GuidedBuildingFields';
import { GuidedCommuteFields } from './GuidedCommuteFields';
import { GuidedDistrictFields } from './GuidedDistrictFields';
import { GuidedEquipmentFields } from './GuidedEquipmentFields';
import { GuidedNaturalLanguageFields } from './GuidedNaturalLanguageFields';
import { GuidedTransitFields } from './GuidedTransitFields';

interface GuidedRentFormProps {
  model: Pick<
    CalculatorViewModel,
    | "rentInputMode"
    | "setRentInputMode"
    | "rentMonthlyBudgetMin"
    | "setRentMonthlyBudgetMin"
    | "rentMonthlyBudget"
    | "setRentMonthlyBudget"
    | "guidedVisaType"
    | "setGuidedVisaType"
    | "setGuidedApplicationChannel"
    | "guidedApplicationChannel"
    | "addGuidedDistrict"
    | "guidedDistrictSelections"
    | "removeGuidedDistrict"
    | "addGuidedLine"
    | "guidedLineOptions"
    | "guidedLineSelections"
    | "removeGuidedLine"
    | "guidedStationDraft"
    | "setGuidedStationDraft"
    | "addGuidedStation"
    | "guidedLocationStationOptions"
    | "guidedStationSelections"
    | "removeGuidedStation"
    | "locationGuardNotice"
    | "guidedCommuteStation"
    | "setGuidedCommuteStation"
    | "setLocationGuardNotice"
    | "validateCommuteCompatibility"
    | "commuteStationOptions"
    | "guidedCommuteMinutes"
    | "setGuidedCommuteMinutes"
    | "selectGuidedRoomType"
    | "calcRoomType"
    | "guidedMinArea"
    | "selectGuidedArea"
    | "areaOptions"
    | "guidedWalkMinutes"
    | "selectGuidedWalk"
    | "guidedAgeMax"
    | "selectGuidedAge"
    | "guidedStructure"
    | "selectGuidedStructure"
    | "guidedFloorMin"
    | "selectGuidedFloor"
    | "rentSearchFilters"
    | "toggleRentSearchFilter"
    | "washbasinSelected"
    | "toggleBathroomFacility"
    | "bidetSelected"
    | "guidedAutoLock"
    | "toggleBuildingSecurity"
    | "guidedElevator"
    | "calcModifiers"
    | "toggleModifier"
    | "analyzeStructuredRent"
    | "analysisLoading"
    | "aiResult"
    | "analysisNotice"
    | "aiPrompt"
    | "setAiPrompt"
    | "analyzeNaturalLanguageRent"
    | "aiInputLoading"
    | "aiInputError"
  >;
}

export function GuidedRentForm({ model }: GuidedRentFormProps) {
  const {
    rentInputMode,
    setRentInputMode,
    rentMonthlyBudgetMin,
    setRentMonthlyBudgetMin,
    rentMonthlyBudget,
    setRentMonthlyBudget,
    guidedVisaType,
    setGuidedVisaType,
    setGuidedApplicationChannel,
    guidedApplicationChannel,
    addGuidedDistrict,
    guidedDistrictSelections,
    removeGuidedDistrict,
    addGuidedLine,
    guidedLineOptions,
    guidedLineSelections,
    removeGuidedLine,
    guidedStationDraft,
    setGuidedStationDraft,
    addGuidedStation,
    guidedLocationStationOptions,
    guidedStationSelections,
    removeGuidedStation,
    locationGuardNotice,
    guidedCommuteStation,
    setGuidedCommuteStation,
    setLocationGuardNotice,
    validateCommuteCompatibility,
    commuteStationOptions,
    guidedCommuteMinutes,
    setGuidedCommuteMinutes,
    selectGuidedRoomType,
    calcRoomType,
    guidedMinArea,
    selectGuidedArea,
    areaOptions,
    guidedWalkMinutes,
    selectGuidedWalk,
    guidedAgeMax,
    selectGuidedAge,
    guidedStructure,
    selectGuidedStructure,
    guidedFloorMin,
    selectGuidedFloor,
    rentSearchFilters,
    toggleRentSearchFilter,
    washbasinSelected,
    toggleBathroomFacility,
    bidetSelected,
    guidedAutoLock,
    toggleBuildingSecurity,
    guidedElevator,
    calcModifiers,
    toggleModifier,
    analyzeStructuredRent,
    analysisLoading,
    aiResult,
    analysisNotice,
    aiPrompt,
    setAiPrompt,
    analyzeNaturalLanguageRent,
    aiInputLoading,
    aiInputError,
  } = model;
  return (<div className="space-y-5 border-b border-[#1A2A22] bg-[#e6f6f1] p-6 font-sans lg:col-span-5 lg:border-b-0 lg:border-r md:p-8">
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
        <GuidedBudgetFields rentMonthlyBudgetMin={rentMonthlyBudgetMin} setRentMonthlyBudgetMin={setRentMonthlyBudgetMin} rentMonthlyBudget={rentMonthlyBudget} setRentMonthlyBudget={setRentMonthlyBudget} />

        <fieldset>
          <div className="flex items-end justify-between gap-3">
            <legend className="text-xs font-bold text-zinc-700">在日身分／簽證種類</legend>
            <span className="text-[9px] text-[#66736C]">影響房東審查與可承租房源</span>
          </div>
          <div className="relative mt-1.5 flex h-12 min-w-0 items-center border border-[#1A2A22] bg-white focus-within:ring-1 focus-within:ring-[#00a174]">
            <select
              aria-label="在日身分／簽證種類"
              value={guidedVisaType}
              onChange={event => setGuidedVisaType(event.target.value)}
              className="peer h-full w-full appearance-none bg-transparent px-3 pr-10 text-sm font-bold text-[#1A2A22] outline-none"
            >
              {RENT_VISA_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className={guidedSelectChevronClass} />
          </div>
        </fieldset>

        <GuidedApplicationFields setGuidedApplicationChannel={setGuidedApplicationChannel} guidedApplicationChannel={guidedApplicationChannel} guidedVisaType={guidedVisaType} />

        <GuidedDistrictFields addGuidedDistrict={addGuidedDistrict} guidedDistrictSelections={guidedDistrictSelections} removeGuidedDistrict={removeGuidedDistrict} />

        <GuidedTransitFields addGuidedLine={addGuidedLine} guidedDistrictSelections={guidedDistrictSelections} guidedLineOptions={guidedLineOptions} guidedLineSelections={guidedLineSelections} removeGuidedLine={removeGuidedLine} guidedStationDraft={guidedStationDraft} setGuidedStationDraft={setGuidedStationDraft} addGuidedStation={addGuidedStation} guidedLocationStationOptions={guidedLocationStationOptions} guidedStationSelections={guidedStationSelections} removeGuidedStation={removeGuidedStation} />

        {locationGuardNotice && (
          <div className="flex items-start gap-2 border-l-4 border-[#D98A28] bg-[#FFF8E9] px-3 py-2 text-[10px] leading-relaxed text-[#76511F]" role="status">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {locationGuardNotice}
          </div>
        )}

        <GuidedCommuteFields guidedCommuteStation={guidedCommuteStation} setGuidedCommuteStation={setGuidedCommuteStation} setLocationGuardNotice={setLocationGuardNotice} validateCommuteCompatibility={validateCommuteCompatibility} commuteStationOptions={commuteStationOptions} guidedCommuteMinutes={guidedCommuteMinutes} setGuidedCommuteMinutes={setGuidedCommuteMinutes} />

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

        <GuidedBuildingFields guidedMinArea={guidedMinArea} selectGuidedArea={selectGuidedArea} areaOptions={areaOptions} guidedWalkMinutes={guidedWalkMinutes} selectGuidedWalk={selectGuidedWalk} guidedAgeMax={guidedAgeMax} selectGuidedAge={selectGuidedAge} />

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

        <GuidedEquipmentFields guidedFloorMin={guidedFloorMin} selectGuidedFloor={selectGuidedFloor} rentSearchFilters={rentSearchFilters} toggleRentSearchFilter={toggleRentSearchFilter} washbasinSelected={washbasinSelected} toggleBathroomFacility={toggleBathroomFacility} bidetSelected={bidetSelected} guidedAutoLock={guidedAutoLock} toggleBuildingSecurity={toggleBuildingSecurity} guidedElevator={guidedElevator} calcModifiers={calcModifiers} toggleModifier={toggleModifier} />

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
      <GuidedNaturalLanguageFields aiPrompt={aiPrompt} setAiPrompt={setAiPrompt} analyzeNaturalLanguageRent={analyzeNaturalLanguageRent} aiInputLoading={aiInputLoading} aiResult={aiResult} aiInputError={aiInputError} />
    )}
  </div>);
}
