/**
 * 租金模型的資料健檢：把「哪些數字該重新校對」列出來。
 *
 * 行情會隨市場變動，但過期的資料不會自己舉手。這支腳本把每一批資料的
 * 來源、日期與可信度攤開來，並對超過保鮮期的批次發出提醒。
 *
 *   npm run data:review              # 檢視現況
 *   npm run data:review -- --ci      # 有資料過期時以非零狀態結束（可掛 CI）
 */
import { execFileSync } from "node:child_process";

// At Home is a rolling three-month listing window. Review it quarterly and
// flag a snapshot after a 100-day grace window.
const STALE_DAYS = { high: 100, medium: 365, limited: 365 };

const tsx = JSON.parse(execFileSync("npx", ["tsx", "-e", `
  // 讀 housingMarket 的表：那才是估價實際使用的完整清單（含由市平均推導出來的區級資料）。
  import { rentRates } from "./src/data/housingMarket.ts";
  import { budgetModifiers, budgetModifierMeta, rentKnowledgeMeta } from "./src/data/rentGuideData.ts";
  const batches = new Map();
  for (const rate of rentRates) {
    const key = [rate.sourceDate ?? "未標註", rate.confidence ?? "未標註"].join("|");
    const batch = batches.get(key) || { sourceDate: rate.sourceDate ?? null, confidence: rate.confidence ?? null, notes: [], districts: [] };
    batch.districts.push(rate.district);
    if (rate.sourceNote && !batch.notes.includes(rate.sourceNote)) batch.notes.push(rate.sourceNote);
    batches.set(key, batch);
  }
  process.stdout.write(JSON.stringify({
    batches: [...batches.values()],
    modifierMeta: budgetModifierMeta,
    modifierCount: budgetModifiers.length,
    modifiersWithBasis: budgetModifiers.filter(m => m.basis).length,
    knowledgeReviewedAt: rentKnowledgeMeta.reviewedAt
  }));
`], { cwd: process.cwd(), encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }));

const daysSince = value => {
  const match = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(value || "");
  if (!match) return null;
  const then = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3] || 1));
  const now = new Date();
  return Math.floor((now.getTime() - then.getTime()) / 86_400_000);
};

let stale = 0;
console.log("\n租金行情資料批次\n" + "=".repeat(60));
for (const batch of tsx.batches.sort((a, b) => (a.sourceDate || "").localeCompare(b.sourceDate || ""))) {
  const age = daysSince(batch.sourceDate);
  const limit = STALE_DAYS[batch.confidence] ?? 365;
  // limited／未標註的批次沒有可查證的來源，日期只代表「進到程式碼的時間」而不是調查時點，
  // 因此不論多新都持續提醒，不能因為看起來還新就當作已經校對過。
  const unverified = batch.confidence !== "high" && batch.confidence !== "medium";
  const isStale = unverified || age === null || age >= limit;
  if (isStale) stale++;
  const reason = unverified ? "來源未經查證" : age === null ? "沒有標註日期" : `已超過 ${limit} 天的建議校對週期`;
  console.log(`\n${isStale ? "⚠ 建議重新校對" : "✓ 仍在保鮮期"}  ${batch.sourceDate || "未標註日期"}  [${batch.confidence || "未標註可信度"}]`);
  console.log(`  ${batch.districts.length} 個行政區：${batch.districts.slice(0, 3).join("、")}${batch.districts.length > 3 ? ` 等 ${batch.districts.length} 區` : ""}`);
  console.log(`  來源：${batch.notes.length ? batch.notes[0] + (batch.notes.length > 1 ? ` 等 ${batch.notes.length} 種標註` : "") : "未標註"}`);
  if (age !== null) console.log(`  資料時點距今 ${age} 天`);
  if (isStale) console.log(`  原因：${reason}`);
}

const modifierAge = daysSince(tsx.modifierMeta.reviewedAt);
// 加減價係數同樣沒有對應公開統計，比照 limited 批次持續提醒。
const modifierStale = true;
if (modifierStale) stale++;
console.log("\n\n加減價係數\n" + "=".repeat(60));
console.log(`\n${modifierStale ? "⚠ 建議重新校對" : "✓ 仍在保鮮期"}  最後檢視 ${tsx.modifierMeta.reviewedAt}${modifierAge !== null ? `（已經過 ${modifierAge} 天）` : ""}`);
console.log(`  共 ${tsx.modifierCount} 項，其中 ${tsx.modifiersWithBasis} 項有寫明訂定依據`);
console.log(`  來源：${tsx.modifierMeta.sourceNote}`);
console.log(`  原因：來源未經查證${modifierAge !== null && modifierAge >= 365 ? "，且已超過 12 個月" : ""}`);

console.log(`\n\n總結：${stale ? `${stale} 批資料建議重新校對` : "所有資料都在保鮮期內"}\n`);
if (stale && process.argv.includes("--ci")) process.exit(1);
