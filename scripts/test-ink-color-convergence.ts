import assert from "node:assert";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

/**
 * 黑／灰文字色收斂守護。
 *
 * 全站文字只能用墨色四階：#1A2A22 / #3F5147 / #66736C / #8A9590。
 * Tailwind 原生 zinc/slate 是偏紫的冷灰，與品牌帶綠的暖墨並排時會明顯打架，
 * 因此禁止再用於 text-* （border-/bg- 不在此限，另有邊框色系統）。
 */

const INK_SCALE = ["#1A2A22", "#3F5147", "#66736C", "#8A9590"];

/** 線條三階＋強調邊框／停用灰。 */
const LINE_SCALE = ["#ECEFEC", "#DDE3DF", "#C9D2CD", "#AEB8B2"];

/** 表面四階（白→下沉）。 */
const SURFACE_SCALE = ["#FFFFFF", "#FAFCFB", "#F5F8F6", "#EEF2F0"];

/** 深色實心表面。 */
const DARK_SURFACE = ["#1A2A22", "#3F5147"];

/** 結構屬性允許的全部中性值；語意色（有彩度者）由色相判斷另行放行。 */
const ALLOWED_NEUTRAL = new Set([
  ...INK_SCALE, ...LINE_SCALE, ...SURFACE_SCALE, ...DARK_SURFACE
]);

const hexToRgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)
];

/** 彩度：RGB 極差。用來區分「中性灰」與「語意色」。 */
const chromaOf = (rgb: [number, number, number]) => Math.max(...rgb) - Math.min(...rgb);

/** 色相角；品牌綠約落在 100–190 度。 */
const hueOf = ([r, g, b]: [number, number, number]) => {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d === 0) return -1;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
};

/**
 * 是否屬於「應該收斂的中性灰」。
 *
 * 判準是彩度：中性灰帶極輕微的綠調（品牌暖墨系），彩度約 ≤6；
 * 一旦彩度再高，就是刻意的品牌綠強調底（#E6F6F1、#EAF5F0、#F1FAF7…），
 * 那些底色都搭配綠色文字或綠色邊框傳達語義，併入灰階會抹掉意義。
 * 橘/紅/藍/黃等語意色由色相排除。
 */
const isManagedNeutral = (hex: string) => {
  const rgb = hexToRgb(hex);
  const c = chromaOf(rgb), h = hueOf(rgb);
  if (c <= 6) return true;       // 無彩或極輕微色偏 → 中性
  if (h < 0) return true;        // 純灰
  return false;                  // 其餘皆視為語意／品牌色
};

/** 深色底上的淺色字例外：這些位置用白字或停用灰是正確的，不該被規則誤判。 */
const DARK_SURFACE_ALLOWED = /text-white(\/\d+)?/;

const files = execSync("git ls-files src", { encoding: "utf8" })
  .split("\n")
  .filter(file => /\.(tsx|ts)$/.test(file));

const tests: Array<{ name: string; run: () => void }> = [
  {
    name: "src 內不得再出現 text-zinc-* / text-slate-*",
    run: () => {
      const offenders: string[] = [];
      for (const file of files) {
        readFileSync(file, "utf8").split("\n").forEach((line, index) => {
          const match = line.match(/\btext-(zinc|slate)-\d{3}\b/);
          if (match) offenders.push(`${file}:${index + 1} ${match[0]}`);
        });
      }
      assert.deepEqual(offenders, [], `發現原生灰階文字色：\n${offenders.join("\n")}`);
    }
  },
  {
    name: "text-[#hex] 只能使用墨色四階或白色",
    run: () => {
      const offenders: string[] = [];
      for (const file of files) {
        readFileSync(file, "utf8").split("\n").forEach((line, index) => {
          for (const raw of line.match(/\btext-\[#[0-9A-Fa-f]{6}\]/g) || []) {
            const hex = raw.slice(6, -1).toUpperCase();
            // 品牌綠、警示紅等語意色本來就允許；這裡只攔「灰階」。
            // 與結構色共用同一套中性判準，避免兩處標準分岔。
            if (!isManagedNeutral(hex)) continue;
            if (hex === "#FFFFFF" || INK_SCALE.includes(hex)) continue;
            if (DARK_SURFACE_ALLOWED.test(line)) continue;
            offenders.push(`${file}:${index + 1} ${raw}`);
          }
        });
      }
      assert.deepEqual(offenders, [], `發現非標準灰階文字色：\n${offenders.join("\n")}`);
    }
  },
  {
    name: "src 內不得再出現任何原生灰階（含 border/bg/divide 等）",
    run: () => {
      const offenders: string[] = [];
      for (const file of files) {
        readFileSync(file, "utf8").split("\n").forEach((line, index) => {
          const match = line.match(/\b[a-z-]+-(zinc|slate|gray|neutral|stone)-\d{2,3}\b/);
          if (match) offenders.push(`${file}:${index + 1} ${match[0]}`);
        });
      }
      assert.deepEqual(offenders, [], `發現原生灰階：\n${offenders.join("\n")}`);
    }
  },
  {
    name: "邊框／背景等結構中性色只能使用標準階",
    run: () => {
      const structural = /\b(bg|border|border-[trblxy]|divide|divide-[xy]|ring|outline|from|via|to|accent|decoration|fill|stroke)-\[(#[0-9A-Fa-f]{6})\]/g;
      const offenders: string[] = [];
      for (const file of files) {
        readFileSync(file, "utf8").split("\n").forEach((line, index) => {
          for (const match of line.matchAll(structural)) {
            const hex = match[2].toUpperCase();
            if (!isManagedNeutral(hex)) continue;   // 語意色／品牌色不納管
            if (ALLOWED_NEUTRAL.has(hex)) continue;
            offenders.push(`${file}:${index + 1} ${match[0]}`);
          }
        });
      }
      assert.deepEqual(offenders, [], `發現非標準中性色：\n${offenders.join("\n")}`);
    }
  },
  {
    name: "index.css 的墨色四階與 CIS 手冊一致",
    run: () => {
      const css = readFileSync("src/index.css", "utf8");
      const styles = readFileSync("scripts/cis/styles.ts", "utf8");
      const cssVars = ["--color-ink", "--color-ink-soft", "--color-ink-note", "--color-ink-mute"];
      const values = cssVars.map(name => {
        const match = css.match(new RegExp(`${name}:\\s*(#[0-9A-Fa-f]{6})`));
        assert.ok(match, `index.css 缺少 ${name}`);
        return match![1].toUpperCase();
      });
      assert.deepEqual(values, INK_SCALE);
      // 手冊端必須含有同樣四個值，否則兩邊會再度分岔。
      for (const hex of INK_SCALE) {
        assert.ok(styles.toUpperCase().includes(hex), `scripts/cis/styles.ts 缺少 ${hex}`);
      }
    }
  },
  {
    name: "index.css 宣告了線條三階與表面四階",
    run: () => {
      const css = readFileSync("src/index.css", "utf8").toUpperCase();
      const expected: Array<[string, string]> = [
        ["--COLOR-LINE-SOFT", "#ECEFEC"],
        ["--COLOR-LINE", "#DDE3DF"],
        ["--COLOR-LINE-STRONG", "#C9D2CD"],
        ["--COLOR-BG-SUBTLE", "#FAFCFB"],
        ["--COLOR-BG-OFF", "#F5F8F6"],
        ["--COLOR-BG-SUNKEN", "#EEF2F0"],
        ["--COLOR-SURFACE-DARK", "#1A2A22"],
        ["--COLOR-SURFACE-DISABLED", "#AEB8B2"]
      ];
      for (const [name, hex] of expected) {
        assert.ok(
          new RegExp(`${name}:\\s*${hex}`).test(css),
          `index.css 缺少 ${name}: ${hex}`
        );
      }
    }
  }
];

let passed = 0;
for (const test of tests) {
  try {
    test.run();
    console.log(`✓ ${test.name}`);
    passed += 1;
  } catch (error) {
    console.error(`✗ ${test.name}\n  ${(error as Error).message}`);
  }
}

console.log(`\n文字色收斂守護：${passed}/${tests.length} 通過`);
if (passed !== tests.length) process.exit(1);
