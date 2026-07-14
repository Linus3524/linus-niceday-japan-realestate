import { rentRates } from "../data/rentGuideData";
import { buyBudgetModifiers } from "../data/buyHouseData";

// 東京都下（多摩地區）城市清單 — 全站共用，判斷是否屬於東京 23 區以外的都下區域
export const TAMA_CITIES = ["武藏野市", "三鷹市", "立川市", "八王子市", "日野市", "府中市", "調布市", "町田市", "西東京市", "小平市", "多摩市", "狛江市"];

export const rentConflictGroups = [
  [0, 1, 2], // Washbasin & Toilet combos
  [3, 4, 22], // Room sizes (Large 1K/1R vs Super Compact 1R/1K)
  [5, 6],    // 1LDK sizes
  [7, 8],    // 2LDK sizes
  [10, 11, 18, 19], // Building Age
  [12, 13],  // Station size
  [14, 16, 17], // Walk distance
  [9, 20],   // Elevator vs 4F+ without elevator
  [20, 21],  // 4F+ without elevator vs 1st floor
  [9, 23],   // Auto-lock elevator building vs Wood construction
  [10, 24],  // 5 years age vs Japanese-style room (Japanese-style room is rare/impossible in brand new buildings)
  [11, 24],  // 5~10 years age vs Japanese-style room
  [23, 25],  // Wood construction vs Tower Mansion
  [20, 25],  // 4F+ without elevator vs Tower Mansion
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

export const isRentModifierDisabled = (index: number, selected: number[], district: string) => {
  if (index === 25 && !hasTowerMansionSupport(district)) {
    return true;
  }
  if (index === 9 && selected.includes(25)) {
    return true;
  }
  if (index === 21 && selected.includes(25)) {
    return true;
  }
  if (selected.includes(index)) return false;
  return rentConflictGroups.some(group => 
    group.includes(index) && group.some(otherIndex => otherIndex !== index && selected.includes(otherIndex))
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
