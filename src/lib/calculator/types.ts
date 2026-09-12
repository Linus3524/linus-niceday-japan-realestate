import type { BuyModifierId } from '../../data/buyHouseData.js';
import type { BudgetModifierId } from '../../data/rentGuideData.js';
import type { RoomType } from '../rentAnalysis.js';
import type { AppTab, SendMessage } from "../uiTypes";
export interface CalculatorTabProps {
  calcMode: "rent" | "buy" | "listing";
  setCalcMode: (m: "rent" | "buy" | "listing") => void;
  calcDistrict: string;
  setCalcDistrict: (d: string) => void;
  calcRoomType: RoomType;
  setCalcRoomType: (t: RoomType) => void;
  calcModifiers: BudgetModifierId[];
  setCalcModifiers: (m: BudgetModifierId[]) => void;
  calcBuyModifiers: BuyModifierId[];
  setCalcBuyModifiers: (m: BuyModifierId[]) => void;
  calcStation: string;
  setCalcStation: (s: string) => void;
  handleTabChange: (tab: AppTab) => void;
  handleSendMessage: SendMessage;
}


export type RentSearchFilter = "pets" | "freeInternet" | "noKeyMoney" | "noDeposit" | "balcony" | "secondFloor" | "twoBurners" | "cityGas";
