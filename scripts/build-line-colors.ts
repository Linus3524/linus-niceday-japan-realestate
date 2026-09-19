/**
 * 由 Wikidata 建立「全日本鐵道路線 → 官方路線色」對照表。
 *
 * 為什麼需要這支腳本：
 *   tokyoTransitGraph.json 的顏色來自 GTFS，而 GTFS 的 route_text_color 幾乎
 *   全部被上游填成 #FFFFFF（實測 171 條路線全部如此）。山手線 #9ACD32、
 *   総武線 #FFD400、銀座線 #F39700 這種淺底色配白字，在畫面上等於看不見，
 *   使用者會以為「路線名稱不見了」。route_color 本身也會偏離官方色
 *   （山手線 GTFS #80C747 vs 官方 #9ACD32）。
 *
 *   transit.ts 的 TRANSIT_LINES 是人工維護的正確色表，但只涵蓋 40 條左右的
 *   首都圈主要路線；圖資裡有 171 條，全日本更多。人工補完不可行也不可維護。
 *
 * 資料來源：Wikidata SPARQL endpoint，屬性 P465 (sRGB color hex triplet)，
 *   以 P31/P279* = Q728937 (railway line) 且 P17 = Q17 (日本) 篩選。
 *   Wikidata 內容為 CC0，可自由使用。同時取 rdfs:label 與 skos:altLabel，
 *   因為圖資用的是通稱（都営三田線）而 Wikidata 主標籤常是正式名稱（三田線）。
 *
 * 文字色一律由背景色亮度計算（WCAG 相對亮度），不採用上游的 text_color，
 *   理由同上：上游資料不可信，而對比度是可以算出來的。
 *
 * 用法：npm run data:build:line-colors
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { normalizeLineKey, readableTextColor } from "../src/lib/transit.js";

const here = dirname(fileURLToPath(import.meta.url));
const graphPath = join(here, "../src/data/tokyoTransitGraph.json");
const outPath = join(here, "../src/data/railLineColors.json");

const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";
const USER_AGENT = "LINUS-NiceDay/1.0 (https://github.com/Linus3524/linus-niceday-japan-realestate)";

/** P31/P279* 涵蓋 railway line 的各種子類（地下鉄路線・軌道線・モノレール等）。 */
const QUERY = `
SELECT ?line ?label ?color WHERE {
  ?line wdt:P31/wdt:P279* wd:Q728937 .
  ?line wdt:P17 wd:Q17 .
  ?line wdt:P465 ?color .
  { ?line rdfs:label ?label . FILTER(lang(?label) = "ja") }
  UNION
  { ?line skos:altLabel ?label . FILTER(lang(?label) = "ja") }
}
LIMIT 20000
`;

/**
 * Wikidata 查無官方色的路線，直接指定業者公開的識別色。
 *
 * 這些多半是地方鐵道／路面電車，Wikidata 上沒有 P465。留白會讓它們掉回
 * GTFS 的 #3F626D 灰，整條路線在畫面上分不出來，所以這幾條值得手寫。
 * 顏色取自各業者官方網站的路線圖識別色。
 */
const MANUAL_COLORS: Record<string, string> = {
  "とさでん路面電車": "#E60012",   // とさでん交通
  "市内軌道線": "#00A0E9",         // 富山地方鉄道 市内電車
  "わたらせ渓谷線": "#00A650",     // わたらせ渓谷鐵道
  "伊豆急行線": "#0068B7",         // 伊豆急行
  "小湊鉄道線": "#E8380D",         // 小湊鐵道
  "芝山鉄道線": "#0097DB",         // 芝山鉄道
  "真岡線": "#E5006E",             // 真岡鐵道
  "上毛線": "#00A0E9",             // 上毛電気鉄道
  "上熊本線": "#F66013",           // 熊本電鉄（GTFS 既有色即官方色）
  "本線": "#BC312C",               // 熊本電鉄本線
  "湘南モノレール江の島線": "#004097",
  "多摩モノレール": "#0068B7",     // 多摩都市モノレール
  "富山港線（南富山）": "#00A0E9",
  "富山港線（富山大学前）": "#00A0E9",
  "富山港線（環状線）": "#00A0E9",
};

/**
 * 圖資路線名無法用規則對到 Wikidata 標籤的殘餘個案。
 * 能用規則解的一律走規則，否則這張表會膨脹成第二個 TRANSIT_LINES。
 */
const MANUAL_ALIASES: Record<string, string> = {
  "千葉モノレール1号線": "千葉都市モノレール1号線",
  "千葉モノレール2号線": "千葉都市モノレール2号線",
  "伊豆箱根大雄山線": "大雄山線",
  "伊豆箱根駿豆線": "駿豆線",
  "京成スカイライナー": "成田空港線",
  "JR相鉄直通線": "相鉄新横浜線",
  "都営東京さくらトラム（都電荒川線）": "東京さくらトラム",
  "東京メトロ丸ノ内線支線": "丸ノ内線",
};

/** 服務種別／支線後綴：這些不是獨立路線，色彩沿用母線。 */
const SERVICE_SUFFIX = /(各駅停車|各停|快速|普通|急行|特急|支線)$/;

type Edge = { lineName?: string | null; operator?: string | null };

async function fetchWikidataColors() {
  const url = new URL(SPARQL_ENDPOINT);
  url.searchParams.set("query", QUERY);
  const response = await fetch(url, {
    headers: { Accept: "application/sparql-results+json", "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok) throw new Error(`Wikidata SPARQL ${response.status}`);
  const payload = await response.json() as {
    results: { bindings: Array<{ label: { value: string }; color: { value: string } }> };
  };

  const catalog = new Map<string, { color: string; label: string }>();
  for (const row of payload.results.bindings) {
    const label = row.label.value;
    const hex = row.color.value.replace(/^#/, "").toUpperCase();
    if (!/^[0-9A-F]{6}$/.test(hex)) continue;
    const key = normalizeLineKey(label);
    if (!key || catalog.has(key)) continue;
    catalog.set(key, { color: `#${hex}`, label });
  }
  return catalog;
}

/** 由具體到寬鬆依序產生查表鍵，第一個命中的就採用。 */
function candidateKeys(lineName: string) {
  const keys: string[] = [];
  const push = (value: string) => {
    const key = normalizeLineKey(value);
    if (key && !keys.includes(key)) keys.push(key);
  };

  const alias = MANUAL_ALIASES[lineName];
  if (alias) push(alias);
  push(lineName);

  // 圖資有「東武東武スカイツリーライン」這種業者名被重複串接的資料，去掉重複前綴。
  push(lineName.replace(/^(.{2,4})\1/, "$1"));

  // 「東武小泉線(館林-西小泉)」→「東武小泉線」
  const withoutParen = lineName.replace(/\s*[（(].*$/, "");
  push(withoutParen);

  // 「JR常磐線各駅停車」→「JR常磐線」；「JR成田線我孫子支線」→「JR成田線」
  push(withoutParen.replace(/線?[^線]*支線$/, "線"));
  push(withoutParen.replace(SERVICE_SUFFIX, ""));

  // 「JR埼京線・川越線」→「JR埼京線」「川越線」
  for (const part of lineName.split(/[・･]/)) push(part);

  // 「秩父本線」↔「秩父線」：Wikidata 有些用本線、有些不用。
  push(withoutParen.replace(/本線$/, "線"));
  push(withoutParen.replace(/線$/, "本線"));

  return keys;
}

const graph = JSON.parse(await readFile(graphPath, "utf8")) as {
  sourceUpdatedAt?: unknown;
  stations: Record<string, Edge[]>;
};

const graphLines = new Map<string, string>();
for (const edges of Object.values(graph.stations)) {
  for (const edge of edges) {
    if (edge.lineName) graphLines.set(edge.lineName, edge.operator || "");
  }
}

const catalog = await fetchWikidataColors();

const lines: Record<string, { color: string; textColor: string; source: string }> = {};
const unresolved: string[] = [];
for (const lineName of [...graphLines.keys()].sort((a, b) => a.localeCompare(b, "ja"))) {
  const manual = MANUAL_COLORS[lineName];
  if (manual) {
    lines[lineName] = { color: manual, textColor: readableTextColor(manual), source: "operator" };
    continue;
  }
  const hit = candidateKeys(lineName).map(key => catalog.get(key)).find(Boolean);
  if (!hit) {
    unresolved.push(lineName);
    continue;
  }
  lines[lineName] = { color: hit.color, textColor: readableTextColor(hit.color), source: hit.label };
}

// catalog 也一併輸出：AI 路線與 Transitous 會回傳圖資以外的路線名，
// 執行期用 normalizeLineKey 查這張表就能涵蓋全日本，而不只是圖資這 171 條。
const catalogOut: Record<string, { color: string; textColor: string }> = {};
for (const [key, value] of [...catalog].sort((a, b) => a[0].localeCompare(b[0], "ja"))) {
  catalogOut[key] = { color: value.color, textColor: readableTextColor(value.color) };
}

await writeFile(outPath, JSON.stringify({
  generatedAt: new Date().toISOString().slice(0, 10),
  note: "由 scripts/build-line-colors.ts 從 Wikidata (P465) 產生，請勿手改。",
  attribution: "Line colors from Wikidata (CC0). https://www.wikidata.org/",
  sourceUpdatedAt: graph.sourceUpdatedAt ?? null,
  lines,
  catalog: catalogOut,
}, null, 2) + "\n", "utf8");

console.log(`railLineColors.json written: graphLines=${graphLines.size} resolved=${Object.keys(lines).length} catalog=${Object.keys(catalogOut).length}`);
if (unresolved.length) console.log(`unresolved (${unresolved.length}):\n  ${unresolved.join("\n  ")}`);
