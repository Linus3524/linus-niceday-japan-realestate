import { districtStations, rentRates } from '../../data/housingMarket.js';
import { getBudgetModifier, getBudgetModifierPrice, type BudgetModifierId } from '../../data/rentGuideData.js';
import { TAMA_CITIES } from '../calcRules.js';
import type { CalculatorTabProps } from './types.js';
export type RentEstimateInput = Pick<CalculatorTabProps, 'calcDistrict' | 'calcRoomType' | 'calcModifiers' | 'calcStation'>;
/** Each render supplies the same values previously captured by the component closures. */
export function createRentEstimator({ calcDistrict, calcRoomType, calcModifiers, calcStation }: RentEstimateInput) {
  // Calculator Logic
  const getSelectedDistrictData = () => {
    return rentRates.find(d => d.district === calcDistrict) || rentRates.find(d => d.district === "新宿區") || rentRates[0];
  };


  const getDistrictScale = () => {
    const rate = getSelectedDistrictData();
    const isTama = TAMA_CITIES.includes(rate.district);
    const isTokyo23 = rate.region === "東京都" && !isTama;

    const baseScale = parseFloat(rate.k1) / 10.0;

    if (isTokyo23) {
      // Tokyo 23 wards: modifiers have high premium
      return Math.max(0.75, Math.min(1.4, baseScale));
    } else if (rate.region === "東京都") {
      // Tokyo Tama/outer area
      return Math.max(0.4, Math.min(0.8, baseScale * 0.7));
    } else if (rate.region === "神奈川") {
      // Kanagawa is somewhat expensive but still cheaper than Tokyo center
      return Math.max(0.45, Math.min(0.85, baseScale * 0.75));
    } else {
      // Osaka, Saitama, Chiba: much cheaper modifiers in real life
      return Math.max(0.3, Math.min(0.7, baseScale * 0.5));
    }
  };


  // 傳入 id 時一律以共用取價函式解析金額，房型相關的溢價（例如塔樓）才會與推薦引擎一致。
  // 車站等級那類不屬於 budgetModifiers 的調整，直接傳金額、不帶 id。
  const getModifierPrice = (modPrice: number, id?: BudgetModifierId) => {
    const scale = getDistrictScale();
    const modifier = id ? getBudgetModifier(id) : undefined;
    const price = modifier ? getBudgetModifierPrice(modifier, calcRoomType) : modPrice;
    // Round to nearest 1000
    return Math.round((price * scale) / 1000) * 1000;
  };


  const getCalculatedRent = () => {
    const dData = getSelectedDistrictData();
    const rateString = dData[calcRoomType as keyof typeof dData] as string;
    let rent = parseFloat(rateString) * 10000; // in Yen

    calcModifiers.forEach(id => {
      const mod = getBudgetModifier(id);
      if (mod) rent += getModifierPrice(mod.price, id);
    });

    if (calcStation !== "none") {
      const stationList = districtStations[calcDistrict] || [];
      const currentStation = stationList.find(s => s.name === calcStation);
      if (currentStation) {
        if (currentStation.type === "major") {
          rent += getModifierPrice(10000);
        } else if (currentStation.type === "regular") {
          rent += getModifierPrice(5000);
        } else if (currentStation.type === "minor") {
          rent += getModifierPrice(-5000);
        }
      }
    }

    return Math.max(rent, 20000); // Ensure rent doesn't go below 20,000 yen
  };
  return { getSelectedDistrictData, getDistrictScale, getModifierPrice, getCalculatedRent };
}
