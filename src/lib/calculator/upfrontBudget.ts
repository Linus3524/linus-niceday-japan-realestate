import { districtStations } from '../../data/housingMarket.js';
import { toJapaneseStationName } from '../transit.js';
import type { RentEstimateInput, createRentEstimator } from './rentEstimate.js';
import type { RentSearchFilter } from './types.js';
export interface RentUpfrontBudgetInput extends RentEstimateInput {
  getCalculatedRent: ReturnType<typeof createRentEstimator>['getCalculatedRent'];
  getSelectedDistrictData: ReturnType<typeof createRentEstimator>['getSelectedDistrictData'];
  rentSearchFilters: RentSearchFilter[];
  rentUpfrontCash: number;
  districtDisplayName: string;
}

export function calculateRentUpfrontBudget({ getCalculatedRent, getSelectedDistrictData, calcDistrict, calcStation, calcModifiers, rentSearchFilters, rentUpfrontCash, districtDisplayName }: RentUpfrontBudgetInput) {
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
  return { monthlyRent, recommendedMultiplier, recommendedCash, cashGap, reasons };
}
