import { createAvailabilityAssessment, type AvailabilityInput } from "../../src/lib/calculator/availability.js";
import { calculateBuyAffordability, createBuyEstimator, type BuyAffordabilityInput, type BuyEstimateInput } from "../../src/lib/calculator/buyBudget.js";
import { createRentEstimator } from "../../src/lib/calculator/rentEstimate.js";

export type CalculatorInput = Omit<AvailabilityInput, "getSelectedDistrictData">
  & Omit<BuyEstimateInput, "getSelectedDistrictData"> & BuyAffordabilityInput;

export const snapshot = (value: unknown): unknown => JSON.parse(JSON.stringify(value, (_key, item) =>
  typeof item === "number" && !Number.isFinite(item) ? String(item) : item));

/** 基準比對與機器人更新共用同一份算法，兩邊才不會各算各的。 */
export function computeCalculatorContract(input: CalculatorInput) {
  const rent = createRentEstimator(input);
  const buy = createBuyEstimator({ ...input, getSelectedDistrictData: rent.getSelectedDistrictData });
  const availability = createAvailabilityAssessment({ ...input, getSelectedDistrictData: rent.getSelectedDistrictData });
  const price = buy.getCalculatedBuyPrice();
  return snapshot({
    rent: rent.getCalculatedRent(),
    districtScale: rent.getDistrictScale(),
    modifierPrice: rent.getModifierPrice(10000),
    price,
    monthlyPayment: buy.getMonthlyPayment(price),
    districtPrice: buy.getDistrictBuyPrice(input.calcDistrict, input.calcRoomType),
    availability: availability(),
    affordable: calculateBuyAffordability(input),
  }) as Record<string, unknown>;
}

/** 行情更新只會合理地動到這幾個由成交資料算出的欄位。 */
export const DATA_DRIVEN_FIELDS = ["price", "monthlyPayment", "districtPrice"] as const;

/** 只有這些檔案變動時，才可以重新產生基準；只要動到程式就不行。 */
export const SNAPSHOT_FILES = [
  "src/data/mlitBuySnapshot.ts",
  "src/data/atHomeSaleSnapshot.ts",
  "src/data/atHomeNationwideRentSnapshot.ts",
];
export const BASELINE_FILE = "scripts/fixtures/refactor-baseline.json";

export function assertOnlySnapshotsChanged(changedFiles: string[]) {
  const allowed = new Set([...SNAPSHOT_FILES, BASELINE_FILE]);
  const others = changedFiles.filter(file => !allowed.has(file));
  if (others.length) throw new Error(`不是純資料更新，不可重新產生基準：${others.join("、")}`);
}

/** 回傳更新後的預期值與變動欄位；動到價格以外的欄位代表不只是行情變了，必須交給人看。 */
export function applyPriceOnlyUpdate(name: string, expected: Record<string, unknown>, actual: Record<string, unknown>) {
  const keys = new Set([...Object.keys(expected), ...Object.keys(actual)]);
  const changed = [...keys].filter(key => JSON.stringify(expected[key]) !== JSON.stringify(actual[key]));
  const unexpected = changed.filter(key => !(DATA_DRIVEN_FIELDS as readonly string[]).includes(key));
  if (unexpected.length) throw new Error(`${name} 有價格以外的欄位變動，不可自動更新：${unexpected.join("、")}`);
  return { updated: { ...expected, ...Object.fromEntries(changed.map(key => [key, actual[key]])) }, changed };
}

export interface MlitRow { region: string; district: string; layout: string; medianTradePriceYen: number; sampleCount: number }
export interface LayoutRow { region: string; district: string; values: Record<string, number | null> }
export interface SnapshotSet { mlit: MlitRow[]; sale: LayoutRow[]; rent: LayoutRow[] }
export interface BaselineChange { name: string; district: string; layout: string; before: number; after: number }

const LARGE_MOVE = 0.25;
const LOW_SAMPLE = 10;
const LIST_LIMIT = 10;
const LAYOUT_LABEL: Record<string, string> = { r1: "1R", k1: "1K", ldk1: "1LDK", ldk2: "2LDK", ldk3: "3LDK+" };
const label = (layout: string) => LAYOUT_LABEL[layout] ?? layout;
const pct = (ratio: number) => `${ratio > 0 ? "+" : ""}${Math.round(ratio * 100)}%`;
const man = (yen: number) => `${Math.round(yen / 10000).toLocaleString("en-US")} 萬`;

function layoutCounts(before: LayoutRow[], after: LayoutRow[]) {
  const key = (row: LayoutRow) => `${row.region}|${row.district}`;
  const afterKeys = new Set(after.map(key));
  const previous = new Map(before.map(row => [key(row), row]));
  const moves: number[] = [];
  let lost = 0;
  for (const row of after) {
    const old = previous.get(key(row));
    if (!old) continue;
    for (const [layout, value] of Object.entries(row.values)) {
      const oldValue = old.values[layout];
      if (oldValue && !value) lost++;
      if (oldValue && value && Math.abs(value / oldValue - 1) >= LARGE_MOVE) moves.push(value / oldValue - 1);
    }
  }
  return {
    rows: `${before.length} → ${after.length}`,
    removed: before.filter(row => !afterKeys.has(key(row))).length,
    lost,
    moved: moves.length
  };
}

/** 合併前要看的重點：變動大、樣本少、格局價格倒掛。只提醒，不擋更新。 */
export function buildDataChangeReport(before: SnapshotSet, after: SnapshotSet, baseline: BaselineChange[]) {
  const mlitKey = (row: MlitRow) => `${row.region}|${row.district}|${row.layout}`;
  const previous = new Map(before.mlit.map(row => [mlitKey(row), row]));
  const movers = after.mlit.flatMap(row => {
    const old = previous.get(mlitKey(row));
    if (!old?.medianTradePriceYen || !row.medianTradePriceYen) return [];
    const change = row.medianTradePriceYen / old.medianTradePriceYen - 1;
    return Math.abs(change) >= LARGE_MOVE ? [{ row, old, change }] : [];
  }).sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

  // 1K 比 1LDK 貴不合常理，也是使用者最容易看出來的異常。只列這次才新出現的。
  const priceOf = (rows: MlitRow[]) => new Map(rows.map(row => [mlitKey(row), row.medianTradePriceYen]));
  const oldPrices = priceOf(before.mlit);
  const inversions = after.mlit.filter(row => row.layout === "k1").flatMap(k1 => {
    const ldk1 = after.mlit.find(row => row.region === k1.region && row.district === k1.district && row.layout === "ldk1");
    if (!ldk1 || ldk1.medianTradePriceYen >= k1.medianTradePriceYen) return [];
    const oldK1 = oldPrices.get(mlitKey(k1));
    const oldLdk1 = oldPrices.get(mlitKey(ldk1));
    return oldK1 && oldLdk1 && oldLdk1 < oldK1 ? [] : [{ k1, ldk1 }];
  });

  const sale = layoutCounts(before.sale, after.sale);
  const rent = layoutCounts(before.rent, after.rent);
  const lines = [
    "## 資料變動報告",
    "",
    "只提醒、不擋更新。樣本少的地區，數字本來就容易跳動。",
    "",
    "| 資料 | 筆數 | 消失的地區 | 消失的格局數值 | 變動 ≥ 25% |",
    "|---|---|---|---|---|",
    `| 成交實價（分桶） | ${before.mlit.length} → ${after.mlit.length} | - | - | ${movers.length} |`,
    `| 公開開價 | ${sale.rows} | ${sale.removed} | ${sale.lost} | ${sale.moved} |`,
    `| 公開租金 | ${rent.rows} | ${rent.removed} | ${rent.lost} | ${rent.moved} |`,
    "",
    `### 成交價變動最大的項目（前 ${LIST_LIMIT} 名）`,
    "",
    ...(movers.length
      ? movers.slice(0, LIST_LIMIT).map(({ row, old, change }) =>
        `- ${row.district} ${label(row.layout)}：${man(old.medianTradePriceYen)} → ${man(row.medianTradePriceYen)}（${pct(change)}，樣本 ${row.sampleCount} 筆${row.sampleCount < LOW_SAMPLE ? "，樣本少" : ""}）`)
      : ["- 沒有"]),
    "",
    `### 這次新出現的價格倒掛：1LDK 比 1K 便宜（共 ${inversions.length} 區）`,
    "",
    ...(inversions.length
      ? inversions.slice(0, LIST_LIMIT).map(({ k1, ldk1 }) =>
        `- ${k1.district}：1K ${man(k1.medianTradePriceYen)}（${k1.sampleCount} 筆）、1LDK ${man(ldk1.medianTradePriceYen)}（${ldk1.sampleCount} 筆）`)
      : ["- 沒有"]),
    "",
    `### 自動更新的測試基準（${baseline.length} 組，只動價格相關欄位）`,
    "",
    ...(baseline.length
      ? baseline.slice(0, LIST_LIMIT).map(item =>
        `- ${item.name}（${item.district} ${label(item.layout)}）：${man(item.before)} → ${man(item.after)}`)
      : ["- 沒有"]),
    ...(baseline.length > LIST_LIMIT ? [`- 另有 ${baseline.length - LIST_LIMIT} 組`] : []),
    ""
  ];
  return lines.join("\n");
}
