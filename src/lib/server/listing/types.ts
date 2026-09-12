import { type AuditFields } from "../../listingAudit.js";
import { type RentalConditionFields } from "../../rentalConditions.js";
import { type SpecialSaleFields } from "../../specialSaleAnalysis.js";

export interface ExtractedListingFields extends SpecialSaleFields, RentalConditionFields, AuditFields {
  dealType: string; // "sale" 或 "rent"
  buildingName: string;
  roomNumber?: string;
  station: string;
  walkTime: string;
  transitAccess: string;
  layout: string;
  rent: string;
  managementFee: string;
  keyMoney: string;
  deposit: string;
  leaseTerms: string;
  age: string;
  floor: string;
  address: string;
  area: string;
  structure: string;
  guaranteeFee: string;
  lockReplacementFee: string;
  cleaningFee: string;
  insuranceFee: string;
  shikibiki: string;
  cancellationPenalty: string;
  renewalFee: string;
  supportFee: string;
  freeRent: string;
  balconyArea?: string;
  // 買賣專用欄位
  salePrice: string;
  totalUnits: string;
  buildingFloors: string;
  repairReserve: string;
  repairFund: string;
  otherMonthlyFees: string;
  occupancyStatus: string;
  currentRent: string;
  annualIncome: string;
  grossYield: string;
  landRights: string;
  zoning: string;
  renovationDetails: string;
  managementCompany: string;
  managementStyle: string;
  fixedAssetTax: number;
  cityPlanningTax: number;
  realEstateAcquisitionTax: number;
  buildingAssessedValue: number;
  landAcquisitionTaxAfterRelief: number;
  registrationFee: number;
  landRightsRatio: string;
  taxEstimationBasis: string;
  specialNotes: string;
  otherConditions?: string;
  facilities?: string;
  /** 設備原文 → 繁體中文的對照，供字典未收錄的寫法使用。 */
  facilityTranslations?: Array<{ ja: string; zh: string }>;
}


export interface InitialCostBreakdownItem {
  isUnknown?: boolean;
  id: string;
  name: string;
  amount: number;
  isFromFlyer: boolean;
  note: string;
}


export interface InitialCostEstimate {
  totalMin: number;
  totalMax: number;
  monthsMultipleMin: number;
  monthsMultipleMax: number;
  level: "low" | "standard" | "high";
  levelText: string;
  items: InitialCostBreakdownItem[];
  tips: string[];
}
