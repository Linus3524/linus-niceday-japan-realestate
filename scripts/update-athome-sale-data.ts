/**
 * Capture At Home's public used-condominium asking-price averages.
 *
 * The result is a reviewed, dated build-time snapshot. Production requests never
 * fetch a portal page. Missing districts/layouts stay missing: this script never
 * substitutes a modeled value for a public asking-price observation.
 *
 *   npm run data:update:athome-sale
 */
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { mlitBuySnapshots } from "../src/data/mlitBuySnapshot.js";
import { atHomeSaleSnapshotMeta as currentSnapshotMeta } from "../src/data/atHomeSaleSnapshot.js";

type Layout = "r1" | "k1" | "ldk1" | "ldk2" | "ldk3";

interface CityIndexRow {
  syzRoman: string;
  shikugunNm: string;
  isExist: boolean;
}

interface AtHomeCityIndexPage {
  prefecture: { kenNm: string; kenRoman: string };
  cityMdrSoubaListInfo: { citySoubaList: CityIndexRow[] };
}

interface AtHomeDetailPage {
  initSoubaDetailInfo: {
    mdrSoubaList: Array<{ mdrRangeNm: string; kakaku?: string | null }>;
  };
}

const BASE_URL = "https://www.athome.co.jp";
const CAPTURED_AT = new Date().toISOString().slice(0, 10);
const OUTPUT_PATH = resolve("src/data/atHomeSaleSnapshot.ts");
const CONCURRENCY = 6;

const prefectureSlugs = [
  "aichi", "akita", "aomori", "chiba", "ehime", "fukui", "fukuoka", "fukushima",
  "gifu", "gunma", "hiroshima", "hokkaido", "hyogo", "ibaraki", "ishikawa", "iwate",
  "kagawa", "kagoshima", "kanagawa", "kochi", "kumamoto", "kyoto", "mie", "miyagi",
  "miyazaki", "nagano", "nagasaki", "nara", "niigata", "oita", "okayama", "okinawa",
  "osaka", "saga", "saitama", "shiga", "shimane", "shizuoka", "tochigi", "tokushima",
  "tokyo", "tottori", "toyama", "wakayama", "yamagata", "yamaguchi", "yamanashi"
] as const;

const nameCharacters: Record<string, string> = {
  "区": "區", "横": "橫", "渋": "澀", "黒": "黑", "戸": "戶", "沢": "澤",
  "豊": "豐", "広": "廣", "静": "靜", "徳": "德", "児": "兒", "縄": "繩",
  "浜": "濱", "稲": "稻", "芸": "藝", "桜": "櫻", "辺": "邊", "竜": "龍",
  "塩": "鹽", "蔵": "藏", "郷": "鄉", "穂": "穗", "緑": "綠"
};

function translateCharacters(value: string) {
  return [...value].map(character => nameCharacters[character] || character).join("");
}

function normalizeDistrict(value: string) {
  let normalized = translateCharacters(value).replace("（市平均）", "");
  const replacements: Record<string, string> = {
    "さいたま市": "埼玉市", "つくば市": "筑波市", "いわき市": "磐城市",
    "那覇市": "那霸市", "姫路市": "姬路市"
  };
  for (const [from, to] of Object.entries(replacements)) normalized = normalized.replace(from, to);
  return normalized;
}

function normalizePrefecture(value: string) {
  const normalized = translateCharacters(value);
  return normalized === "東京都" || normalized === "北海道"
    ? normalized
    : normalized.replace(/[府県]$/, "");
}

async function fetchText(url: string) {
  const response = await fetch(url, { headers: { "user-agent": "LINUS-sale-market-review/1.0" } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.text();
}

async function fetchNextPageProps<T>(url: string): Promise<T> {
  const html = await fetchText(url);
  const marker = '<script id="__NEXT_DATA__" type="application/json">';
  const start = html.indexOf(marker);
  if (start < 0) throw new Error(`At Home __NEXT_DATA__ not found: ${url}`);
  const jsonStart = start + marker.length;
  const jsonEnd = html.indexOf("</script>", jsonStart);
  if (jsonEnd < 0) throw new Error(`At Home __NEXT_DATA__ is incomplete: ${url}`);
  return JSON.parse(html.slice(jsonStart, jsonEnd)).props.pageProps as T;
}

async function mapConcurrent<T, R>(items: T[], worker: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index]);
    }
  }));
  return results;
}

const indexPages = await mapConcurrent([...prefectureSlugs], async slug => ({
  slug,
  page: await fetchNextPageProps<AtHomeCityIndexPage>(`${BASE_URL}/mansion/chuko/souba/${slug}/city/`)
}));

const detailUrlByDistrict = new Map<string, string>();
for (const { slug, page } of indexPages) {
  const region = normalizePrefecture(page.prefecture.kenNm);
  for (const city of page.cityMdrSoubaListInfo.citySoubaList) {
    if (!city.isExist) continue;
    detailUrlByDistrict.set(
      `${region}|${normalizeDistrict(city.shikugunNm)}`,
      `${BASE_URL}/mansion/chuko/souba/${slug}/${city.syzRoman}-city/`
    );
  }
}

const targetMarkets = [...new Map(
  mlitBuySnapshots.map(row => [`${row.region}|${row.district}`, { region: row.region, district: row.district }])
).values()];

const detailedGroups: Record<Layout, string[]> = {
  r1: ["ワンルーム"],
  k1: ["1K", "1DK"],
  ldk1: ["1LDK", "2K", "2DK"],
  ldk2: ["2LDK", "3K", "3DK"],
  ldk3: ["3LDK", "4K", "4DK"]
};

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
};

const matchedTargets = targetMarkets.flatMap(target => {
  const sourceUrl = detailUrlByDistrict.get(`${target.region}|${normalizeDistrict(target.district)}`);
  return sourceUrl ? [{ ...target, sourceUrl }] : [];
});

const capturedRows = await mapConcurrent(matchedTargets, async target => {
  const page = await fetchNextPageProps<AtHomeDetailPage>(target.sourceUrl);
  const byName = new Map(page.initSoubaDetailInfo.mdrSoubaList.map(row => [row.mdrRangeNm, row.kakaku]));
  const askingPrices = Object.fromEntries((Object.keys(detailedGroups) as Layout[]).map(layout => {
    const values = detailedGroups[layout]
      .map(name => Number.parseInt(byName.get(name) || "", 10))
      .filter(value => Number.isFinite(value) && value > 0);
    return [layout, values.length ? median(values) : null];
  })) as Record<Layout, number | null>;
  return { ...target, askingPrices };
});

const coverageRatio = capturedRows.length / targetMarkets.length;
if (coverageRatio < 0.7) {
  throw new Error(`At Home geography matched only ${capturedRows.length}/${targetMarkets.length} MLIT markets; snapshot not written.`);
}

const nonNullValues = capturedRows.reduce(
  (count, row) => count + Object.values(row.askingPrices).filter(value => value !== null).length,
  0
);
if (
  currentSnapshotMeta.layoutValueCount > 0 &&
  nonNullValues < currentSnapshotMeta.layoutValueCount * 0.8
) {
  throw new Error(
    `At Home layout values fell from ${currentSnapshotMeta.layoutValueCount} to ${nonNullValues} (>20%); snapshot not written.`
  );
}
const body = `/**
 * Generated by scripts/update-athome-sale-data.ts.
 * Source: At Home public used-condominium asking-price pages.
 * Captured: ${CAPTURED_AT}
 * Values are portal listing averages, not contract prices and not valuations.
 */
import type { LayoutCode } from "./housingMarket.js";

export interface AtHomeSaleSnapshotRow {
  region: string;
  district: string;
  askingPrices: Record<LayoutCode, number | null>;
  sourceUrl: string;
}

export const atHomeSaleSnapshotMeta = {
  capturedAt: "${CAPTURED_AT}",
  sourceId: "athome-public" as const,
  sourceLabel: "At Home 中古公寓公開刊登平均",
  methodology: "市區町村別・格局別的 At Home 刊登平均；相近格局群有多個值時取其中位數，不以模型填補缺值。",
  targetMarketCount: ${targetMarkets.length},
  coveredMarketCount: ${capturedRows.length},
  layoutValueCount: ${nonNullValues}
};

export const atHomeSaleSnapshots: AtHomeSaleSnapshotRow[] = ${JSON.stringify(capturedRows, null, 2)};
`;

await writeFile(OUTPUT_PATH, body, "utf8");
console.log(`Wrote ${capturedRows.length}/${targetMarkets.length} At Home sale markets (${nonNullValues} layout values) to ${OUTPUT_PATH}`);
const missing = targetMarkets.filter(target => !detailUrlByDistrict.has(`${target.region}|${normalizeDistrict(target.district)}`));
if (missing.length) console.log(`Unmatched MLIT markets: ${missing.map(row => `${row.region} ${row.district}`).join(", ")}`);
