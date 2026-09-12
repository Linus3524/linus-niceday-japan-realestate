import {
ChevronDown,
MapPin
} from "lucide-react";
import { buyBudgetModifiers, type BuyModifierId } from "../../data/buyHouseData";
import { districtStations, rentRates } from "../../data/housingMarket";
import { budgetModifiers } from "../../data/rentGuideData";
import type { CalculatorViewModel } from '../../hooks/useCalculatorController';
import {
getDynamicBuyModifierMultiplier,
hasTowerMansionSupport,
isBuyModifierDisabled,
isRentModifierDisabled
} from "../../lib/calcRules";
import {
rentSearchFilterOptions
} from '../../lib/calculator/options';
import {
ROOM_TYPE_DETAIL_LABEL,
ROOM_TYPE_INCLUDES_LABEL,
ROOM_TYPE_LABEL
} from "../../lib/rentAnalysis";
import { toJapaneseLineName, toJapanesePlaceName, toJapanesePrefectureName, toJapaneseStationName } from "../../lib/transit";
import { OfficialMarketInsight } from "../OfficialMarketInsight";
import { RentMap } from "../RentMap";

interface AdvancedCalculatorInputsProps {
  model: Pick<
    CalculatorViewModel,
    | "calcDistrict"
    | "setCalcDistrict"
    | "setGuidedDistrictSelections"
    | "setGuidedLineSelections"
    | "setGuidedStationSelections"
    | "setGuidedLine"
    | "setCalcStation"
    | "setGuidedMinArea"
    | "setGuidedAgeMax"
    | "setCalcModifiers"
    | "setCalcBuyModifiers"
    | "calcMode"
    | "calcRoomType"
    | "getDistrictBuyPrice"
    | "selectGuidedRoomType"
    | "calcStation"
    | "selectGuidedStation"
    | "getSelectedDistrictData"
    | "setCalcRoomType"
    | "calcBuyModifiers"
    | "calcModifiers"
    | "toggleModifier"
    | "getModifierPrice"
    | "guidedMinArea"
    | "guidedAgeMax"
    | "guidedWalkMinutes"
    | "guidedFloorMin"
    | "guidedCommuteStation"
    | "guidedCommuteMinutes"
    | "rentSearchFilters"
    | "toggleRentSearchFilter"
    | "toggleBuyModifier"
  >;
}

export function AdvancedCalculatorInputs({ model }: AdvancedCalculatorInputsProps) {
  const {
    calcDistrict,
    setCalcDistrict,
    setGuidedDistrictSelections,
    setGuidedLineSelections,
    setGuidedStationSelections,
    setGuidedLine,
    setCalcStation,
    setGuidedMinArea,
    setGuidedAgeMax,
    setCalcModifiers,
    setCalcBuyModifiers,
    calcMode,
    calcRoomType,
    getDistrictBuyPrice,
    selectGuidedRoomType,
    calcStation,
    selectGuidedStation,
    getSelectedDistrictData,
    setCalcRoomType,
    calcBuyModifiers,
    calcModifiers,
    toggleModifier,
    getModifierPrice,
    guidedMinArea,
    guidedAgeMax,
    guidedWalkMinutes,
    guidedFloorMin,
    guidedCommuteStation,
    guidedCommuteMinutes,
    rentSearchFilters,
    toggleRentSearchFilter,
    toggleBuyModifier,
  } = model;
  return (<div className="xl:col-span-7 space-y-6">
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
                    className={`h-full w-full text-xs font-medium cursor-pointer transition-colors ${calcRoomType === id
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
                  <optgroup label="🛤 各停小站 / 二線各停 / 偏遠小站 (行情調減約 −0.5 萬円/月)">
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
        <OfficialMarketInsight
          region={getSelectedDistrictData().region}
          district={calcDistrict}
          currentLayout={calcRoomType}
          onSelectLayout={setCalcRoomType}
          selectedBuyModifiers={calcBuyModifiers}
          onSelectWalkTier={(modifierId) => {
            const walkIds: BuyModifierId[] = ["walk_within_5min", "walk_11_15min", "walk_over_15min"];
            const filtered = calcBuyModifiers.filter(id => !walkIds.includes(id));
            if (modifierId) {
              setCalcBuyModifiers([...filtered, modifierId]);
            } else {
              setCalcBuyModifiers(filtered);
            }
          }}
        />
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
      mode={calcMode === "buy" ? "buy" : "rent"}
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
                    className={`p-2.5 border flex items-start gap-2.5 transition-all ${isDisabled
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
                      <div className="mt-0.5 font-mono text-[10px] font-bold text-[#00a174]">+ {getModifierPrice(mod.price, mod.id).toLocaleString()} 円 / 月</div>
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
                    className={`p-2.5 border flex items-start gap-2.5 transition-all ${isDisabled
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
                      <div className="mt-0.5 font-mono text-[10px] font-bold text-[#B13818]">− {Math.abs(getModifierPrice(mod.price, mod.id)).toLocaleString()} 円 / 月</div>
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
                    className={`p-3 border flex items-start gap-2.5 transition-all h-full ${isDisabled
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
                      <div className="mt-1 font-mono text-[10px] font-bold text-[#00a174]">
                        + {(dynamicMult * 100).toFixed(0)}% 估值溢價
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
                    className={`p-3 border flex items-start gap-2.5 transition-all h-full ${isDisabled
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
                        − {Math.abs(dynamicMult * 100).toFixed(0)}% 估值折價
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
  </div>);
}
