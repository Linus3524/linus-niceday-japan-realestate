import {
ROOM_TYPE_LABEL,
type RentSearchCriteria
} from "../rentAnalysis.js";


/* ── 對外 API ─────────────────────────────────────────── */

/**
 * 把不合理的數值清成「沒填」。
 *
 * 數字可能來自模型抽取、正則補抓或使用者直接輸入，三個來源都可能給出負數、
 * NaN、Infinity 或字串。先前沒有這一層，於是畫面上會出現「上限 -5 萬円」、
 * 「屋齡 -5 年內」、「上限 NaN 萬円」這種輸出；負預算還會讓 gapRatio 的分母
 * 變號，把不可能的條件判成「幾乎貼齊行情低端」。
 *
 * 清成 null 而不是夾到邊界值：使用者填了離譜的數字，正確的回應是當作沒填、
 * 請他補一個合理值，而不是幫他假設一個他沒說過的數字。
 */
/** 月租上限的合理天花板；超過這個數多半是打錯零，不是真的預算。 */
export const MAX_MONTHLY_BUDGET = 5_000_000;

export function positive(value: unknown, max: number): number | null {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num) || num <= 0 || num > max) return null;
  return num;
}

/**
 * 預算被清洗掉時要能分辨「本來就沒填」與「填了但超出合理範圍」。
 *
 * 使用者把 10 萬打成 1000 萬（多按兩個零）時，數值會被 positive() 丟掉，
 * 畫面接著說「還沒有月租上限」——他明明填了，只會一頭霧水。
 */
export function budgetOutOfRange(criteria: RentSearchCriteria): boolean {
  const raw = criteria.maxBudget;
  if (raw == null || raw === undefined) return false;
  const num = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(num) && num > 0 && num > MAX_MONTHLY_BUDGET;
}

export function sanitizeCriteria(criteria: RentSearchCriteria): RentSearchCriteria {
  const roomType = Object.prototype.hasOwnProperty.call(ROOM_TYPE_LABEL, criteria.roomType)
    ? criteria.roomType
    : "k1";
  const maxBudget = positive(criteria.maxBudget, MAX_MONTHLY_BUDGET);
  let minBudget = positive(criteria.minBudget, MAX_MONTHLY_BUDGET);
  // 下限高於上限時捨棄下限：上限是使用者真正的天花板，
  // 留著會顯示成「15 萬円～8 萬円」這種反過來的區間。
  if (minBudget != null && maxBudget != null && minBudget > maxBudget) minBudget = null;

  return {
    ...criteria,
    roomType,
    maxBudget,
    minBudget,
    buildingAgeMax: positive(criteria.buildingAgeMax, 100),
    walkMinutes: positive(criteria.walkMinutes, 60),
    commuteMinutes: positive(criteria.commuteMinutes, 180),
    commutePreferredMinutes: positive(criteria.commutePreferredMinutes, 180),
    commuteMaxStations: positive(criteria.commuteMaxStations, 50),
    amenityWalkMinutes: positive(criteria.amenityWalkMinutes, 180),
    floorMin: positive(criteria.floorMin, 60),
    householdSize: positive(criteria.householdSize, 10),
    areaMin: positive(criteria.areaMin, 500),
    initialCostBudget: positive(criteria.initialCostBudget, 20_000_000),
    visaYears: positive(criteria.visaYears, 20),
    gasBurnersMin: positive(criteria.gasBurnersMin, 10)
  };
}
