/**
 * 由 tokyoTransitGraph.json 推導「路線名 → 運輸型態」對照表。
 *
 * 取代 listingLocation.ts 裡手寫的 SUBWAY_LINE_KEYWORDS／SURFACE_LINE_KEYWORDS：
 * 手寫清單漏列新路線時會落到「無法判斷」，少一層站體對位驗證。
 *
 * 判定順序（路線名優先於業者名，順序不可調換）：
 *   1. 路面電車／新交通／モノレール 等關鍵字 → surface
 *      都電荒川線與日暮里・舎人ライナー 的 operator 是「都営地下鉄」，
 *      純看業者會誤判成地下鐵。
 *   2. 業者名含 地下鉄／メトロ，或路線名含 地下鉄 → subway
 *   3. 其餘 → surface（JR・私鐵在來線）
 *
 * 用法：npx tsx scripts/build-line-modes.ts
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const graphPath = join(here, "../src/data/tokyoTransitGraph.json");
const outPath = join(here, "../src/data/railLineModes.json");

/** 非地下鐵的軌道系統：路面電車、新交通、單軌。必須先判定。 */
const NON_SUBWAY_RAIL = /ライトレール|トラム|荒川線|ライナー|モノレール|新交通|舎人/;
const SUBWAY_OPERATOR = /地下鉄|メトロ/;

type Edge = { lineName?: string | null; operator?: string | null };

const graph = JSON.parse(await readFile(graphPath, "utf8")) as {
  sourceUpdatedAt?: unknown;
  stations: Record<string, Edge[]>;
};

const operatorByLine = new Map<string, string>();
for (const edges of Object.values(graph.stations)) {
  for (const edge of edges) {
    if (edge.lineName) operatorByLine.set(edge.lineName, edge.operator || "");
  }
}

const subway: string[] = [];
const surface: string[] = [];
for (const [lineName, operator] of [...operatorByLine].sort((a, b) => a[0].localeCompare(b[0], "ja"))) {
  if (NON_SUBWAY_RAIL.test(lineName)) surface.push(lineName);
  else if (SUBWAY_OPERATOR.test(operator) || /地下鉄/.test(lineName)) subway.push(lineName);
  else surface.push(lineName);
}

await writeFile(outPath, JSON.stringify({
  generatedAt: new Date().toISOString().slice(0, 10),
  note: "由 scripts/build-line-modes.ts 從 tokyoTransitGraph.json 推導，請勿手改。",
  sourceUpdatedAt: graph.sourceUpdatedAt ?? null,
  subway,
  surface,
}, null, 2) + "\n", "utf8");

console.log(`railLineModes.json written: subway=${subway.length} surface=${surface.length} total=${operatorByLine.size}`);
