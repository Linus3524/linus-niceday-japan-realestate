import { getBuyMarketEstimate } from '../../data/buyMarket.js';
import { rentRates } from '../../data/housingMarket.js';
import { getDynamicBuyModifierMultiplier } from '../calcRules.js';
import type { RoomType } from '../rentAnalysis.js';
import type { createRentEstimator } from './rentEstimate.js';
import type { CalculatorTabProps } from './types.js';
export interface LoanSettings { loanRatio: number; annualRate: number; loanYears: number; }
export interface BuyEstimateInput extends Pick<CalculatorTabProps, 'calcDistrict' | 'calcRoomType' | 'calcBuyModifiers'>, LoanSettings {
  getSelectedDistrictData: ReturnType<typeof createRentEstimator>['getSelectedDistrictData'];
}
export function createBuyEstimator({ calcDistrict, calcRoomType, calcBuyModifiers, loanRatio, annualRate, loanYears, getSelectedDistrictData }: BuyEstimateInput) {
  const getCalculatedBuyPrice = () => {
    const dData = getSelectedDistrictData();
    const rateString = dData[calcRoomType as keyof typeof dData] as string;
    const rentYen = parseFloat(rateString) * 10000;
    const basePrice = getBuyMarketEstimate({
      region: dData.region,
      district: dData.district,
      layout: calcRoomType,
      monthlyRentYen: rentYen
    }).basePriceYen;

    let multiplierSum = 1.0;
    calcBuyModifiers.forEach(id => {
      multiplierSum += getDynamicBuyModifierMultiplier(id, calcDistrict);
    });

    const finalPrice = basePrice * multiplierSum;
    return Math.max(Math.round(finalPrice / 100000) * 100000, 3000000);
  };


  const getMonthlyPayment = (price: number) => {
    const loanAmount = price * (loanRatio / 100);
    const n = loanYears * 12;
    const r = (annualRate / 100) / 12;
    if (r === 0) return loanAmount / n;
    const monthly = loanAmount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return Math.max(Math.round(monthly), 0);
  };


  const getDistrictBuyPrice = (district: string, roomType: RoomType) => {
    const rate = rentRates.find(d => d.district === district) || rentRates[0];
    const rateString = (rate[roomType] || rate.ldk2) as string;
    const rentYen = parseFloat(rateString) * 10000;
    const estimate = getBuyMarketEstimate({
      region: rate.region,
      district: rate.district,
      layout: roomType,
      monthlyRentYen: rentYen
    });
    return Math.max(Math.round(estimate.basePriceYen / 100000) * 10, 300);
  };


  const getSelectedBuyMarketEstimate = () => {
    const rate = getSelectedDistrictData();
    const monthlyRentYen = parseFloat((rate[calcRoomType] || rate.ldk2) as string) * 10000;
    return getBuyMarketEstimate({
      region: rate.region,
      district: rate.district,
      layout: calcRoomType,
      monthlyRentYen
    });
  };
  return { getCalculatedBuyPrice, getMonthlyPayment, getDistrictBuyPrice, getSelectedBuyMarketEstimate };
}


export interface BuyAffordabilityInput extends LoanSettings { buyMonthlyPaymentBudget: number; buyAvailableCash: number; }
export function calculateBuyAffordability({ loanRatio, annualRate, loanYears, buyMonthlyPaymentBudget, buyAvailableCash }: BuyAffordabilityInput) {
  const quickLoanRatio = Math.max(0, Math.min(1, loanRatio / 100));

  const quickLoanMonths = Math.max(1, loanYears * 12);

  const quickMonthlyRate = Math.max(0, annualRate / 100 / 12);

  const maxLoanByPayment = quickMonthlyRate === 0
    ? buyMonthlyPaymentBudget * quickLoanMonths
    : buyMonthlyPaymentBudget * (Math.pow(1 + quickMonthlyRate, quickLoanMonths) - 1)
    / (quickMonthlyRate * Math.pow(1 + quickMonthlyRate, quickLoanMonths));

  const buyFeeRate = quickLoanRatio > 0 ? 0.09 : 0.07;

  const maxPriceByCash = buyAvailableCash / Math.max(0.01, 1 - quickLoanRatio + buyFeeRate);

  const maxPriceByPayment = quickLoanRatio > 0 ? maxLoanByPayment / quickLoanRatio : Number.POSITIVE_INFINITY;

  const affordableBuyPrice = Math.max(0, Math.floor(Math.min(maxPriceByCash, maxPriceByPayment) / 100000) * 100000);

  const affordableBuyLow = Math.floor((affordableBuyPrice * 0.9) / 100000) * 100000;

  const affordableBuyFees = affordableBuyPrice * buyFeeRate;

  const affordableDownPayment = affordableBuyPrice * (1 - quickLoanRatio);
  return { quickLoanRatio, quickLoanMonths, quickMonthlyRate, maxLoanByPayment, buyFeeRate, maxPriceByCash, maxPriceByPayment, affordableBuyPrice, affordableBuyLow, affordableBuyFees, affordableDownPayment };
}
