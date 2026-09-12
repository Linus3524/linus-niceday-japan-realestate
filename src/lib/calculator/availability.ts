import { districtStations } from '../../data/housingMarket.js';
import { getBudgetModifier, type BudgetModifierId } from '../../data/rentGuideData.js';
import { rentSearchFilterOptions } from './options.js';
import type { RentEstimateInput, createRentEstimator } from './rentEstimate.js';
import type { RentSearchFilter } from './types.js';
/**
 * 每個加減價條件對「供給量」與「競爭度」的影響。
 * supply 為正代表會篩掉房源、縮小選擇；為負代表放寬條件、選擇變多。
 * 以 id 為索引，新增條件時在這裡補一筆即可，漏補只會少算壓力、不會錯位。
 */
export const modifierAvailabilityImpact: Partial<Record<BudgetModifierId, { supply: number; competition: number }>> = {
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
  floor_2f_plus: { supply: 0.6, competition: 0.4 },
  renovated: { supply: 1.2, competition: 1.2 }
};
export interface AvailabilityInput extends RentEstimateInput {
  guidedMinArea: number;
  guidedAgeMax: number;
  rentSearchFilters: RentSearchFilter[];
  getSelectedDistrictData: ReturnType<typeof createRentEstimator>['getSelectedDistrictData'];
}
export function createAvailabilityAssessment({ calcDistrict, calcRoomType, calcModifiers, calcStation, guidedMinArea, guidedAgeMax, rentSearchFilters, getSelectedDistrictData }: AvailabilityInput) {
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
  return getAvailabilityAssessment;
}
