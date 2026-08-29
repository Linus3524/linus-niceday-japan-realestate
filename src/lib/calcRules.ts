import { rentRates } from "../data/housingMarket.js";
import { buyBudgetModifiers } from "../data/buyHouseData.js";
import type { BudgetModifierId } from "../data/rentGuideData.js";

// 東京都下（多摩地區）城市清單 — 全站共用，判斷是否屬於東京 23 區以外的都下區域
export const TAMA_CITIES = ["武藏野市", "三鷹市", "立川市", "八王子市", "日野市", "府中市", "調布市", "町田市", "西東京市", "小平市", "多摩市", "狛江市"];

/**
 * 互斥的加減價組合：同一組內只能選一個。
 * 以 id 表示，因此 budgetModifiers 的排列順序改變時這裡不需要跟著改。
 */
export const rentConflictGroups: BudgetModifierId[][] = [
  ["washbasin_and_bidet", "washbasin_only", "bidet_only"], // 洗面台／免治馬桶的組合
  ["compact_25sqm", "compact_30sqm", "compact_15_18sqm"],  // 1R/1K 坪數（大坪數 vs 極小坪數）
  ["ldk1_35sqm", "ldk1_40sqm"],                            // 1LDK 坪數
  ["ldk2_50sqm", "ldk2_60sqm"],                            // 2LDK 坪數
  ["age_within_5y", "age_within_10y", "age_over_30y", "age_over_40y"], // 屋齡
  ["major_station", "minor_station"],                      // 車站等級
  ["walk_within_5min", "walk_11_15min", "walk_15_20min"],  // 徒步距離
  ["autolock_elevator", "no_elevator_4f"],                 // 有電梯 vs 4 樓以上無電梯
  ["no_elevator_4f", "first_floor"],                       // 4 樓以上無電梯 vs 一樓
  ["autolock_elevator", "wooden"],                         // 自動門電梯大樓 vs 木造
  ["age_within_5y", "washitsu"],                           // 5 年內新房幾乎不會有和室
  ["age_within_10y", "washitsu"],                          // 5〜10 年次新房同理
  ["wooden", "tower"],                                     // 木造 vs 塔樓
  ["no_elevator_4f", "tower"],                             // 4 樓以上無電梯 vs 塔樓
];

export const buyConflictGroups = [
  [0, 1, 2, 3], // Condition/Renovation
  [4, 5],       // Occupancy
  [8, 9],       // Building structure (Tower vs Apartment)
  [10, 11],     // Distance (Walk <5m vs >15m)
  [0, 6],       // New build vs Old earthquake standard
  [6, 8],       // Old earthquake standard vs Tower mansion
  [0, 6, 12, 13, 14, 15, 16, 17, 18], // Building Age & New build & Old earthquake standard mutual exclusion
];

export const hasTowerMansionSupport = (district: string) => {
  if (["橫濱市西區", "橫濱市中區", "橫濱市港北區", "橫濱市神奈川區", "川崎市中原區"].includes(district)) return true;
  if (["埼玉市大宮區", "埼玉市浦和區"].includes(district)) return true;
  if (["浦安市", "市川市", "船橋市"].includes(district)) return true;
  if (["大阪市北區", "大阪市中央區", "大阪市西區", "大阪市浪速區", "大阪市天王寺區", "大阪市福島區", "大阪市淀川區"].includes(district)) return true;
  
  // Exclude Tokyo Tama cities, but allow Tokyo 23 Wards
  const isTama = TAMA_CITIES.includes(district);
  if (isTama) return false;
  
  // Since we checked other outer prefectures and Tama, any other district with Tokyo region has tower mansions
  const tokyo23Wards = [
    "千代田區", "港區", "中央區", "澀谷區", "目黑區", "新宿區", "台東區", "江東區", "品川區", 
    "文京區", "墨田區", "大田區", "世田谷區", "中野區", "豐島區", "北區", "荒川區", "杉並區", 
    "板橋區", "練馬區", "足立區", "葛飾區", "江戶川區"
  ];
  return tokyo23Wards.includes(district);
};

export const getDynamicBuyModifierMultiplier = (index: number, district: string) => {
  const dData = rentRates.find(d => d.district === district) || rentRates[0];
  const isTama = TAMA_CITIES.includes(dData.district);
  const isTokyo23 = dData.region === "東京都" && !isTama;
  const region = dData.region;

  // Default fallback multiplier from buyBudgetModifiers
  const baseMod = buyBudgetModifiers[index];
  if (!baseMod) return 0;
  const base = baseMod.multiplier;

  switch (index) {
    case 0: // 全新完工成屋 (新築/未入居)
      if (isTokyo23) return 0.45;
      if (region === "大阪") return 0.35;
      if (region === "東京都" || region === "神奈川") return 0.30;
      return 0.25; // 埼玉、千葉
    case 1: // 全面現代化翻新 (リノベーション済み)
      if (isTokyo23) return 0.22;
      if (region === "神奈川" || region === "大阪") return 0.20;
      return 0.15; // 埼玉、千葉、多摩
    case 2: // 局部基礎翻修 (リフォーム済み)
      if (isTokyo23) return 0.10;
      if (region === "神奈川" || region === "大阪") return 0.08;
      return 0.06;
    case 3: // 現況不翻修直接過戶 (現状渡し)
      if (isTokyo23) return -0.12;
      if (region === "神奈川" || region === "大阪") return -0.15;
      return -0.20;
    case 4: // 空室 (即時點交，自住首選)
      if (isTokyo23) return 0.10;
      if (region === "神奈川" || region === "大阪") return 0.10;
      if (isTama) return 0.06;
      return 0.08; // 埼玉、千葉
    case 5: // 帶租約出售 (オーナーチェンジ - 投資房)
      if (isTokyo23) return -0.08;
      if (region === "神奈川" || region === "大阪") return -0.10;
      return -0.14; // 埼玉、千葉、多摩
    case 6: // 舊耐震基準建物 (1981年5月以前建)
      if (isTokyo23) return -0.20; // 土地持分高，折價稍小
      if (region === "神奈川" || region === "大阪") return -0.25;
      return -0.32; // 埼玉、千葉、多摩折價大
    case 7: // 借地權 (非所有權 - 僅擁有地上物權利)
      if (isTokyo23) return -0.28;
      if (region === "神奈川" || region === "大阪") return -0.32;
      return -0.38;
    case 8: // 高級塔樓公寓 (タワーマンション)
      if (isTokyo23) return 0.35;
      if (region === "大阪") return 0.25;
      if (region === "神奈川") return 0.20;
      if (region === "埼玉" || region === "千葉") return 0.15;
      return 0.25;
    case 9: // 低層木造/輕鋼構公寓 (アパート)
      if (isTokyo23) return -0.15;
      if (region === "神奈川" || region === "大阪") return -0.20;
      return -0.26;
    case 10: // 步行 5 分鐘內超精華地段
      if (isTokyo23 || region === "大阪") return 0.15;
      if (region === "神奈川") return 0.12;
      return 0.10; // 埼玉、千葉、多摩
    case 11: // 步行 15 分鐘以上較遠地段
      if (isTokyo23) return -0.08;
      if (region === "神奈川" || region === "大阪") return -0.12;
      return -0.16; // 埼玉、千葉、多摩
    case 12: // 屋齡 5 年內 (築5年以內)
      if (isTokyo23) return 0.22;
      if (region === "大阪") return 0.18;
      if (region === "神奈川") return 0.16;
      return 0.12; // 埼玉、千葉、多摩
    case 13: // 屋齡 10 年內 (築10年以內)
      if (isTokyo23) return 0.12;
      if (region === "大阪") return 0.10;
      if (region === "神奈川") return 0.09;
      return 0.07;
    case 14: // 屋齡 15 年內 (築15年以內)
      if (isTokyo23) return 0.05;
      if (region === "大阪") return 0.04;
      if (region === "神奈川") return 0.04;
      return 0.02;
    case 15: // 屋齡 20 年內 (築20年以內)
      if (isTokyo23) return -0.06;
      if (region === "大阪") return -0.08;
      if (region === "神奈川") return -0.10;
      return -0.12;
    case 16: // 屋齡 25 年內 (築25年以內)
      if (isTokyo23) return -0.12;
      if (region === "大阪") return -0.15;
      if (region === "神奈川") return -0.18;
      return -0.22;
    case 17: // 屋齡 30 年內 (築30年以內)
      if (isTokyo23) return -0.18;
      if (region === "大阪") return -0.22;
      if (region === "神奈川") return -0.25;
      return -0.30;
    case 18: // 屋齡 40 年內 (築40年以內)
      if (isTokyo23) return -0.25;
      if (region === "大阪") return -0.30;
      if (region === "神奈川") return -0.34;
      return -0.38;
    default:
      return base;
  }
};

export const isRentModifierDisabled = (id: BudgetModifierId, selected: BudgetModifierId[], district: string) => {
  // 該地區查無塔樓建案時不開放勾選。
  if (id === "tower" && !hasTowerMansionSupport(district)) return true;
  // 塔樓本來就含自動門電梯、也不會有一樓住戶，這兩項不該重複加減價。
  if (id === "autolock_elevator" && selected.includes("tower")) return true;
  if (id === "first_floor" && selected.includes("tower")) return true;
  if (selected.includes(id)) return false;
  return rentConflictGroups.some(group =>
    group.includes(id) && group.some(other => other !== id && selected.includes(other))
  );
};

export const isBuyModifierDisabled = (index: number, selected: number[], district: string) => {
  if (index === 8 && !hasTowerMansionSupport(district)) {
    return true;
  }
  if (selected.includes(index)) return false;
  return buyConflictGroups.some(group => 
    group.includes(index) && group.some(otherIndex => otherIndex !== index && selected.includes(otherIndex))
  );
};
