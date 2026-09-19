/**
 * 路線配色回歸測試。
 *
 * 守的是一個實際發生過的線上問題：通勤卡片的路線名稱徽章在畫面上「消失」。
 * 原因不是路線查不到，而是 GTFS 圖資把全部 171 條路線的 lineTextColor 都填成
 * #FFFFFF，於是山手線（#9ACD32）、総武線（#FFD400）這類淺底色配白字，等於
 * 白底白字。使用者看到的是一排空白徽章，會誤判成「路線資料壞了」。
 *
 * 因此這裡驗的是「對比度」而不是「顏色等於某個值」——顏色會隨業者改版更新，
 * 可讀性不該隨之破功。
 */
import assert from "node:assert/strict";
import graphJson from "../src/data/tokyoTransitGraph.json" with { type: "json" };
import railLineColors from "../src/data/railLineColors.json" with { type: "json" };
import { getLineColors, normalizeLineKey, readableTextColor } from "../src/lib/transit.js";
import { findLocalTransitRoutes } from "../src/lib/localTransitRoute.js";

const graph = graphJson as unknown as {
  stations: Record<string, Array<{ lineName: string; lineColor: string }>>;
};

/** WCAG 2.1：粗體 ≥14pt 的文字對比下限。徽章是 11px 粗體，取這條線為底線。 */
const MIN_CONTRAST = 3;

function relativeLuminance(color: string) {
  const hex = color.replace(/^#/, "");
  const channel = (offset: number) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}

function contrastRatio(background: string, text: string) {
  const a = relativeLuminance(background);
  const b = relativeLuminance(text);
  const [lighter, darker] = a > b ? [a, b] : [b, a];
  return (lighter + 0.05) / (darker + 0.05);
}

const graphLines = new Map<string, string>();
for (const edges of Object.values(graph.stations)) {
  for (const edge of edges) graphLines.set(edge.lineName, edge.lineColor);
}

// 1. 圖資裡的每一條路線都要查得到顏色，且文字必須看得見。
{
  const failures: string[] = [];
  for (const [lineName, gtfsColor] of graphLines) {
    const { color, textColor } = getLineColors(lineName, gtfsColor);
    assert.match(color, /^#[0-9A-Fa-f]{6}$/, `${lineName} 的顏色格式不正確：${color}`);
    const ratio = contrastRatio(color, textColor);
    if (ratio < MIN_CONTRAST) failures.push(`${lineName} ${color}/${textColor} = ${ratio.toFixed(2)}:1`);
  }
  assert.equal(failures.length, 0, `以下路線的路線名徽章對比不足（會看不清楚）：\n  ${failures.join("\n  ")}`);
  console.log(`✓ 圖資 ${graphLines.size} 條路線全部具備可讀配色（≥ ${MIN_CONTRAST}:1）`);
}

// 2. 沒有一條路線掉回「無法辨識」的預設灰。灰色代表查表失敗，
//    畫面上會有好幾條路線長得一模一樣，使用者分不出轉乘。
{
  const unresolved = [...graphLines].filter(([lineName, gtfsColor]) =>
    getLineColors(lineName, gtfsColor).color === "#3F626D");
  assert.equal(unresolved.length, 0,
    `以下路線沒有對應顏色，會顯示成預設灰：\n  ${unresolved.map(([name]) => name).join("\n  ")}`);
  console.log("✓ 沒有路線掉回預設灰色");
}

// 3. 建表腳本與執行期必須共用同一套正規化規則，否則表建得出來卻查不到。
{
  const catalog = (railLineColors as { catalog?: Record<string, unknown> }).catalog || {};
  for (const key of Object.keys(catalog)) {
    assert.equal(normalizeLineKey(key), key, `catalog 鍵 ${key} 未經 normalizeLineKey 正規化`);
  }
  assert.ok(Object.keys(catalog).length > 1000, "全日本路線色表筆數異常偏低，資料可能沒建成功");
  console.log(`✓ 全日本路線色表 ${Object.keys(catalog).length} 筆，鍵值正規化一致`);
}

// 4. 業者前綴不影響查表：圖資寫「都営三田線」、Wikidata 寫「三田線」，
//    AI 可能回「東京都交通局三田線」，三者必須指向同一條線。
{
  const variants = ["都営三田線", "三田線", "東京都交通局三田線", "都営地下鉄三田線"];
  const colors = variants.map(name => getLineColors(name).color);
  assert.equal(new Set(colors).size, 1, `同一條線的不同寫法查到不同顏色：${JSON.stringify(variants.map((v, i) => [v, colors[i]]))}`);
  console.log("✓ 業者前綴不同寫法會查到同一條路線");
}

// 5. 已知的淺底色路線必須是深字。這幾條就是當初回報「看不見」的元凶，
//    直接釘住，避免日後改動又翻回白字。
{
  for (const lineName of ["JR山手線", "JR中央・総武緩行線", "東京メトロ銀座線", "東京メトロ有楽町線"]) {
    const { color, textColor } = getLineColors(lineName);
    assert.equal(textColor, "#1A2A22", `${lineName}（${color}）是淺底色，文字必須為深色才看得見`);
  }
  console.log("✓ 淺底色路線一律使用深色文字");
}

// 6. readableTextColor 的邊界行為。
{
  assert.equal(readableTextColor("#000000"), "#FFFFFF");
  assert.equal(readableTextColor("#FFFFFF"), "#1A2A22");
  assert.equal(readableTextColor("not-a-color"), "#FFFFFF", "格式錯誤時應安全退回白字而非丟例外");
  console.log("✓ readableTextColor 邊界行為正確");
}

// 7. 端到端：實際算出來的路線，每一段都要看得見。
{
  const pairs: Array<[string, string]> = [
    ["高田馬場", "東京"], ["大山", "新宿"], ["目黒", "秋葉原"], ["中野", "新宿"],
  ];
  let checked = 0;
  for (const [origin, destination] of pairs) {
    const routes = findLocalTransitRoutes(origin, destination, 3);
    assert.ok(routes.length > 0, `${origin} → ${destination} 應該要有路線`);
    for (const route of routes) {
      for (const segment of route.segments) {
        if (segment.type === "walk") continue;
        const ratio = contrastRatio(segment.lineColor, segment.lineTextColor);
        assert.ok(ratio >= MIN_CONTRAST,
          `${origin}→${destination} 的 ${segment.lineName} 對比僅 ${ratio.toFixed(2)}:1（${segment.lineColor}/${segment.lineTextColor}）`);
        checked += 1;
      }
    }
  }
  console.log(`✓ 端到端檢查 ${checked} 個路線區間，配色全部可讀`);
}

console.log("\n路線配色回歸測試全數通過！");
