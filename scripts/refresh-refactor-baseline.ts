/**
 * 行情資料更新時，重新產生試算基準裡的價格欄位，並輸出給 PR 用的變動報告。
 *
 * 只給資料更新流程用。平常改程式時不能跑：基準就是用來擋程式算錯的。
 * 所以這裡會先確認這次只動到行情資料，也只接受價格相關欄位變動，其他情況一律失敗。
 *
 * 用法：tsx scripts/refresh-refactor-baseline.ts --base <git ref> --report <輸出路徑>
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mock } from "node:test";
import { pathToFileURL } from "node:url";
import {
  applyPriceOnlyUpdate,
  assertOnlySnapshotsChanged,
  BASELINE_FILE,
  buildDataChangeReport,
  computeCalculatorContract,
  type BaselineChange,
  type CalculatorInput,
  type LayoutRow,
  type MlitRow,
  type SnapshotSet
} from "./lib/refactorBaseline.js";

const argument = (name: string, fallback: string) => {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
};
const base = argument("base", "HEAD");
const reportPath = argument("report", "data-change-report.md");
const git = (...args: string[]) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });

assertOnlySnapshotsChanged(git("diff", "--name-only", base).split("\n").filter(Boolean));

// 舊資料從 git 取出，放到暫存檔再載入。這些檔案只有型別 import，可以單獨執行。
const tempDir = mkdtempSync(join(tmpdir(), "baseline-snapshots-"));
const loadSnapshots = async (read: (file: string) => string, prefix: string): Promise<SnapshotSet> => {
  const load = async (file: string) => {
    const path = join(tempDir, `${prefix}-${file.split("/").pop()}`);
    writeFileSync(path, read(file));
    return await import(pathToFileURL(path).href);
  };
  const mlit = await load("src/data/mlitBuySnapshot.ts");
  const sale = await load("src/data/atHomeSaleSnapshot.ts");
  const rent = await load("src/data/atHomeNationwideRentSnapshot.ts");
  const toLayoutRows = (rows: any[], field: string): LayoutRow[] =>
    rows.map(row => ({ region: row.region, district: row.district, values: row[field] }));
  return {
    mlit: mlit.mlitBuySnapshots as MlitRow[],
    sale: toLayoutRows(sale.atHomeSaleSnapshots, "askingPrices"),
    rent: toLayoutRows(rent.atHomeNationwideRentSnapshots, "rents")
  };
};

const fixtures = JSON.parse(readFileSync(BASELINE_FILE, "utf8")) as {
  clock: string;
  calculator: Array<{ name: string; input: CalculatorInput; expected: Record<string, unknown> }>;
};

mock.timers.enable({ apis: ["Date"], now: Date.parse(fixtures.clock) });
const changes: BaselineChange[] = [];
for (const entry of fixtures.calculator) {
  const actual = computeCalculatorContract(entry.input);
  const { updated, changed } = applyPriceOnlyUpdate(entry.name, entry.expected, actual);
  if (changed.length) {
    changes.push({
      name: entry.name,
      district: String(entry.input.calcDistrict),
      layout: String(entry.input.calcRoomType),
      before: Number(entry.expected.price),
      after: Number(updated.price)
    });
    entry.expected = updated;
  }
}
mock.timers.reset();

writeFileSync(BASELINE_FILE, `${JSON.stringify(fixtures, null, 2)}\n`);

const report = buildDataChangeReport(
  await loadSnapshots(file => git("show", `${base}:${file}`), "before"),
  await loadSnapshots(file => readFileSync(file, "utf8"), "after"),
  changes
);
writeFileSync(reportPath, report);
console.log(`基準已更新 ${changes.length} 組，變動報告：${reportPath}`);
