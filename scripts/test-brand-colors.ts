import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory()
    ? sources(join(dir, entry.name))
    : /\.(css|tsx|ts)$/.test(entry.name) ? [join(dir, entry.name)] : []);
}

// 禁用舊的裝飾性深綠，不攔截圖表、試算結果、交通與人物的語意色。
const retired = new Set(["#007D5A", "#00895D", "#008761", "#009670", "#315E50", "#087154", "#075E46", "#006B4E", "#16634D"]);
const offenders: string[] = [];
for (const file of sources("src")) {
  readFileSync(file, "utf8").split("\n").forEach((line, index) => {
    for (const match of line.matchAll(/#[0-9a-f]{6}\b/ig)) {
      if (retired.has(match[0].toUpperCase())) offenders.push(`${file}:${index + 1} ${match[0]}`);
    }
  });
}
assert.deepEqual(offenders, [], `舊裝飾性灰綠／深綠不可回流：\n${offenders.join("\n")}`);

const css = readFileSync("src/index.css", "utf8");
assert.match(css, /--color-primary:\s*#00a174;/i);
assert.match(css, /\.advice-note\s*\{[^}]*border-radius:\s*0;[^}]*background:\s*#F2FBF7;/s);
const adviceBlock = css.match(/\.advice-note\s*\{([^}]+)\}/s)![1];
assert.doesNotMatch(adviceBlock, /border-(top|left):/, "提醒卡不可再出現頂部或側邊粗色線");
assert.match(css, /--color-advice-accent:\s*var\(--color-primary\);/);
assert.match(css, /--color-advice-line:\s*var\(--color-primary\);/);
assert.match(css, /\.advice-note-body li \+ li\s*\{[^}]*border-top:\s*1px solid var\(--color-advice-line\);/);
assert.match(readFileSync("src/components/AdviceNote.tsx", "utf8"), /<Lightbulb\b/);
assert.match(css, /--color-control-hover:\s*#F4F5F5;/);
assert.match(css, /background:\s*linear-gradient\(to top, #E6F6F1 0%, transparent 68%\);/);
for (const file of ["desktop/SectionTabs.tsx", "guides/BuyDeskViews.tsx", "guides/BuyFinanceDesk.tsx", "guides/BuyJourneyDesk.tsx"]) {
  assert.match(readFileSync(join("src/components", file), "utf8"), /ui-switch-large\b/, `${file} 的大型切換鈕須使用指定樣式`);
}
for (const file of ["desktop/ChapterPager.tsx", "desktop/DesktopStage.tsx", "BuyGuideTab.tsx", "RentGuideTab.tsx"]) {
  assert.doesNotMatch(readFileSync(join("src/components", file), "utf8"), /ui-switch-large|ui-choice\b/, `${file} 不套用大型切換鈕樣式`);
}
for (const file of ["BuyGuideTab.tsx", "guides/BuyDeskViews.tsx", "guides/BuyFinanceDesk.tsx", "guides/BuyLoanSection.tsx", "calculator/GuidedApplicationFields.tsx"]) {
  assert.match(readFileSync(join("src/components", file), "utf8"), /<AdviceNote\b/, `${file} 必須共用實務提醒元件`);
}
const rentReminders = readFileSync("src/components/guides/RentProcessSection.tsx", "utf8");
assert.match(rentReminders, /rent-reminder-number/);
assert.doesNotMatch(rentReminders, /<AdviceNote\b/, "租屋實務提醒頁保留獨立編號卡片，不強制套用共用提醒樣式");
console.log("✓ 品牌亮綠、跨裝置共用提醒元件與無頂部色線的方角淡綠提醒卡檢查通過");
