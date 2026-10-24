import assert from "node:assert";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

/**
 * 字體用途守護（規則見 docs/FONTS.md「字體使用時機」）。
 *
 * - 宋體只給標題、大型導覽與上排大切換鈕；小按鈕、品牌綠實心按鈕一律黑體。
 * - Cormorant（--font-display）只給大標題前的 01 02 編號與英文裝飾小標，不給資料數字。
 *   新增使用處必須先確認用途，再加進下面的白名單。
 */

const files = execSync("git ls-files src", { encoding: "utf8" })
  .split("\n")
  .filter(file => /\.(tsx|ts)$/.test(file));

/** 首頁選單、時鐘與上排大切換鈕：使用者認可的宋體按鈕，不受小字規則限制。 */
const SERIF_BUTTON_ALLOW = /\b(ui-switch-large|stage-menu|primary-nav-tab|chapter-rail)/;
const SMALL_TEXT = /(^|\s)(text-xs|text-sm|text-\[(9|1[0-4])(\.\d+)?px\])(\s|$)/;
const SOLID_BRAND = /(^|\s)bg-\[#00[aA]174\](\s|$)/;

/** 目前使用 --font-display 的選擇器（全部都是裝飾性英文或大標題編號）。 */
const DISPLAY_FONT_ALLOW = new Set([
  ".stage-eyebrow", ".stage-menu-en", ".stage-md", ".stage-weather-place", ".stage-date-month",
  ".chapter-rail-en", ".chapter-ghost", ".chapter-kicker", ".chapter-en", ".chapter-overview-en", ".chapter-overview-num",
  ".about-section-en", ".about-card-no", ".about-card-head", ".about-step-no", ".preface-feature-en",
  ".section-tab-num", ".rent-route-number", ".rent-reminder-number", ".buy-tax-no",
  // 印章「済」：漢字，不是數字
  ".rent-stamp-mini", ".rent-stampbook-seal b", ".rent-stamp",
  // 字體用途 class 本身
  ".type-eyebrow",
]);

const tests: Array<{ name: string; run: () => void }> = [
  {
    name: "小按鈕與品牌綠實心按鈕不使用宋體",
    run: () => {
      const offenders: string[] = [];
      // 逐一找 className，往回找最近的開頭標籤，確認是 <button> 或 <a>（屬性裡的 => 會干擾正規式，不能用單一 regex 抓整個標籤）
      const attr = /className=(?:"([^"]*)"|\{`([^`]*)`\})/g;
      for (const file of files) {
        const source = readFileSync(file, "utf8");
        for (const match of source.matchAll(attr)) {
          const className = match[1] ?? match[2] ?? "";
          if (!/(^|\s)font-serif(\s|$)/.test(className) || SERIF_BUTTON_ALLOW.test(className)) continue;
          const before = source.slice(Math.max(0, match.index! - 600), match.index);
          const openTag = [...before.matchAll(/<([A-Za-z][\w.]*)\b/g)].pop()?.[1];
          if (openTag !== "button" && openTag !== "a") continue;
          if (SMALL_TEXT.test(className) || SOLID_BRAND.test(className)) {
            const line = source.slice(0, match.index).split("\n").length;
            offenders.push(`${file}:${line}`);
          }
        }
      }
      assert.deepEqual(offenders, [], `小按鈕／品牌綠按鈕請用黑體（拿掉 font-serif）：\n${offenders.join("\n")}`);
    },
  },
  {
    name: "Cormorant 只用在大標題編號與英文裝飾",
    run: () => {
      const css = readFileSync("src/index.css", "utf8");
      const offenders: string[] = [];
      const rule = /([^{}]+)\{[^{}]*var\(--font-display\)[^{}]*\}/g;
      for (const match of css.matchAll(rule)) {
        const selectors = match[1].split(",").map(s => s.replace(/\/\*[\s\S]*?\*\//g, "").trim()).filter(Boolean);
        for (const selector of selectors) {
          if (!DISPLAY_FONT_ALLOW.has(selector)) offenders.push(selector);
        }
      }
      assert.deepEqual(offenders, [], `新的 Cormorant 使用處（確認是裝飾或大標題編號後再加入白名單）：\n${offenders.join("\n")}`);
    },
  },
  {
    name: "電腦版明體不再掛 Cormorant 數字別名",
    run: () => {
      const css = readFileSync("src/index.css", "utf8");
      assert.ok(!/--font-serif:\s*"Linus Numerals Serif"/.test(css), "--font-serif 又掛回了 Cormorant 數字別名");
    },
  },
];

let passed = 0;
for (const test of tests) {
  try {
    test.run();
    console.log(`✓ ${test.name}`);
    passed++;
  } catch (error) {
    console.error(`✗ ${test.name}\n${(error as Error).message}`);
  }
}
console.log(`\n字體用途守護：${passed}/${tests.length} 通過`);
if (passed !== tests.length) process.exit(1);
