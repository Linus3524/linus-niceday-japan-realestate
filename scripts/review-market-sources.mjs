import { execFileSync } from "node:child_process";

const sources = JSON.parse(execFileSync("npx", ["tsx", "-e", `
  import { marketDataSources } from "./src/data/marketDataSources.ts";
  process.stdout.write(JSON.stringify(marketDataSources));
`], { cwd: process.cwd(), encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }));

console.log("\n市場資料來源與更新節奏\n" + "=".repeat(60));
for (const source of sources) {
  const status = source.ingestionStatus === "enabled"
    ? "✓ 已啟用"
    : source.ingestionStatus === "pending_credentials"
      ? "◷ 等待 API／憑證"
      : "－ 僅人工對照";
  console.log(`\n${status}  ${source.label}`);
  console.log(`  資料：${source.statistic}`);
  console.log(`  更新：${source.publicationCadence}`);
  console.log(`  自動匯入：${source.ingestionStatus === "enabled" ? "已啟用" : source.automatedIngestionAllowed ? "取得憑證後可用" : "目前未啟用"}`);
  console.log(`  備註：${source.note}`);
}
