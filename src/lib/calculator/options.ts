import { toJapaneseLineName } from '../transit.js';
import type { RentSearchFilter } from './types.js';
import { VISA_TYPES } from '../visaOptions.js';
export const rentSearchFilterOptions: Array<{ key: RentSearchFilter; label: string; note: string; pressure: number }> = [
  { key: "pets", label: "可養寵物", note: "物件規約與追加敷金須逐間確認", pressure: 3 },
  { key: "freeInternet", label: "免費網路／網路費包含", note: "確認速度、線路、初裝費與另簽約要求", pressure: 1.5 },
  { key: "noKeyMoney", label: "免禮金", note: "可降低初期費用；熱門地區符合物件通常較少", pressure: 2 },
  { key: "noDeposit", label: "免押金／免敷金", note: "仍可能另收退租清潔費或定額償卻費", pressure: 1.5 },
  { key: "balcony", label: "附陽台", note: "只篩選房源，不直接推定租金溢價", pressure: 1 },
  { key: "secondFloor", label: "房間位於 2 樓以上", note: "排除一樓房源，不直接增加租金", pressure: 1.5 },
  { key: "twoBurners", label: "瓦斯爐 2 口以上", note: "確認爐具類型、是否附設及廚房空間", pressure: 1.5 },
  { key: "cityGas", label: "都市瓦斯指定", note: "排除 LP 瓦斯物件；實際費率仍依供應商與契約確認", pressure: 2 }
];


export const normalizeStructureOption = (value?: string | null) =>
  /木造/i.test(value || "") ? "木造"
    : /SRC/i.test(value || "") ? "SRC造"
      : /RC/i.test(value || "") ? "RC造"
        : /(?:鉄骨|鐵骨|S造)/i.test(value || "") ? "鐵骨造"
          : "";


// 資料來源會把同一路線的特急、急行、各停拆成不同字串；表單層級只選路線，
// 因此一律轉成畫面上的正式路線名稱後再比對與去重。
export const normalizeGuidedLineName = (line: string) => toJapaneseLineName(line)
  .replace(/[\s・･（）()\-]/g, "")
  .replace(/各停|急行|快速|特急/g, "")
  .toLowerCase();


export const sameGuidedLine = (left: string, right: string) =>
  normalizeGuidedLineName(left) === normalizeGuidedLineName(right);


// 月租預算以 0.5 萬円為一級，涵蓋一般租屋到高價物件，最高 100 萬円。
export const RENT_BUDGET_OPTIONS = Array.from({ length: 197 }, (_, index) => 20000 + index * 5000);

export const RENT_BUDGET_MAX = RENT_BUDGET_OPTIONS[RENT_BUDGET_OPTIONS.length - 1];

export const normalizeRentBudgetSelection = (value: number) =>
  Math.min(RENT_BUDGET_MAX, Math.max(RENT_BUDGET_OPTIONS[0], Math.round(value / 5000) * 5000));


// 簽證清單與找房問卷共用（src/lib/visaOptions.ts），這裡只加上「不指定」。
export const RENT_VISA_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "不指定 / 尚未確認" },
  ...VISA_TYPES.map(({ value, label }) => ({ value, label })),
];
