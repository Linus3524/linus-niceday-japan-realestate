/**
 * Capture the public At Home rolling three-month rent averages used by the site.
 *
 * The generated file is a dated snapshot, not a runtime dependency: production
 * never scrapes At Home during a user request. Run this command deliberately,
 * review the diff, then deploy the new snapshot.
 *
 *   npm run data:update:athome
 */
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { rentRates as currentRentRates } from "../src/data/housingMarket.js";

type Layout = "r1" | "k1" | "ldk1" | "ldk2" | "ldk3";
type DetailedLayout =
  | "oneRoom" | "k1" | "dk1" | "ldk1" | "k2" | "dk2"
  | "ldk2" | "k3" | "dk3" | "ldk3" | "k4" | "dk4" | "ldk4Plus";

interface CityIndexRow {
  syzRoman: string;
  shikugunNm: string;
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
const OUTPUT_PATH = resolve("src/data/atHomeRentSnapshot.ts");
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
    "さいたま市": "埼玉市",
    "つくば市": "筑波市",
    "いわき市": "磐城市",
    "那覇市": "那霸市",
    "姫路市": "姬路市"
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
  const response = await fetch(url, {
    headers: { "user-agent": "LINUS-rent-source-review/1.0" }
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.text();
}

async function fetchNextPageProps<T>(url: string): Promise<T> {
  const html = await fetchText(url);
  const match = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
  if (!match) throw new Error(`At Home __NEXT_DATA__ not found: ${url}`);
  return JSON.parse(match[1]).props.pageProps as T;
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
  page: await fetchNextPageProps<AtHomeCityIndexPage>(`${BASE_URL}/chintai/souba/${slug}/city/`)
}));

const detailUrlByDistrict = new Map<string, string>();
for (const { slug, page } of indexPages) {
  const prefecture = normalizePrefecture(page.prefecture.kenNm);
  for (const city of page.cityMdrSoubaListInfo.citySoubaList) {
    const district = normalizeDistrict(city.shikugunNm);
    detailUrlByDistrict.set(
      `${prefecture}|${district}`,
      `${BASE_URL}/chintai/souba/${slug}/${city.syzRoman}-city/`
    );
  }
}

const detailedLayoutNames: Record<DetailedLayout, string> = {
  oneRoom: "ワンルーム",
  k1: "1K",
  dk1: "1DK",
  ldk1: "1LDK",
  k2: "2K",
  dk2: "2DK",
  ldk2: "2LDK",
  k3: "3K",
  dk3: "3DK",
  ldk3: "3LDK",
  k4: "4K",
  dk4: "4DK",
  ldk4Plus: "4LDK以上"
};

const groupedLayouts: Record<Layout, DetailedLayout[]> = {
  r1: ["oneRoom"],
  k1: ["k1", "dk1"],
  ldk1: ["ldk1", "k2", "dk2"],
  ldk2: ["ldk2", "k3", "dk3"],
  // 4LDK以上會混入都心超大型豪宅，價格級距與一般 3LDK 家庭房不同；
  // 仍保存細項，但不納入主地圖的 3LDK 群組代表值。
  ldk3: ["ldk3", "k4", "dk4"]
};

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
};

const capturedRows = await mapConcurrent(currentRentRates, async current => {
  const key = `${current.region}|${normalizeDistrict(current.district)}`;
  const sourceUrl = detailUrlByDistrict.get(key);
  if (!sourceUrl) throw new Error(`At Home geography is missing: ${current.region} ${current.district}`);

  const page = await fetchNextPageProps<AtHomeDetailPage>(sourceUrl);
  const byName = new Map(page.initSoubaDetailInfo.mdrSoubaList.map(row => [row.mdrRangeNm, row.kakaku]));
  const detailedRents = Object.fromEntries((Object.keys(detailedLayoutNames) as DetailedLayout[]).map(layout => {
    const rawValue = byName.get(detailedLayoutNames[layout]);
    const parsed = rawValue ? Number.parseInt(rawValue, 10) : Number.NaN;
    return [layout, Number.isFinite(parsed) && parsed > 0 ? parsed : null];
  })) as Record<DetailedLayout, number | null>;
  const fallbackLayouts: Layout[] = [];
  const rents = Object.fromEntries((Object.keys(groupedLayouts) as Layout[]).map(layout => {
    const groupValues = groupedLayouts[layout]
      .map(detail => detailedRents[detail])
      .filter((value): value is number => value !== null);
    if (groupValues.length) return [layout, median(groupValues)];
    fallbackLayouts.push(layout);
    const fallback = layout === "ldk3"
      ? Number.parseFloat(current.ldk2) * 1.25
      : Number.parseFloat(current[layout]);
    return [layout, Math.round(fallback * 10_000)];
  })) as Record<Layout, number>;

  return {
    region: current.region,
    district: current.district,
    ...rents,
    detailedRents,
    sourceUrl,
    ...(fallbackLayouts.length ? { fallbackLayouts } : {})
  };
});

if (capturedRows.length !== currentRentRates.length) {
  throw new Error(`Expected ${currentRentRates.length} rows, captured ${capturedRows.length}`);
}

const layoutCount = Object.keys(groupedLayouts).length;
const fallbackCount = capturedRows.reduce((count, row) => count + (row.fallbackLayouts?.length || 0), 0);
const body = `/**
 * Generated by scripts/update-athome-rent-data.ts.
 * Source: At Home public rent-market pages, rolling latest-three-month listing averages.
 * Captured: ${CAPTURED_AT}
 * Do not edit individual values by hand; rerun npm run data:update:athome.
 */
export type AtHomeRentLayout = "r1" | "k1" | "ldk1" | "ldk2" | "ldk3";
export type AtHomeDetailedRentLayout = "oneRoom" | "k1" | "dk1" | "ldk1" | "k2" | "dk2" | "ldk2" | "k3" | "dk3" | "ldk3" | "k4" | "dk4" | "ldk4Plus";

export interface AtHomeRentSnapshotRow {
  region: string;
  district: string;
  r1: number;
  k1: number;
  ldk1: number;
  ldk2: number;
  ldk3: number;
  detailedRents: Record<AtHomeDetailedRentLayout, number | null>;
  sourceUrl: string;
  fallbackLayouts?: AtHomeRentLayout[];
}

export const atHomeRentSnapshotMeta = {
  capturedAt: "${CAPTURED_AT}",
  sourceId: "athome-public" as const,
  coverageWindow: "rolling_latest_3_months",
  includesManagementFee: null as boolean | null,
  sourceLabel: "At Home 刊登物件直近 3 個月格局群組代表值"
};

export const atHomeRentSnapshots: AtHomeRentSnapshotRow[] = ${JSON.stringify(capturedRows, null, 2)};
`;

await writeFile(OUTPUT_PATH, body, "utf8");
console.log(`Wrote ${capturedRows.length} At Home district rows to ${OUTPUT_PATH}`);
console.log(`Layout values: ${capturedRows.length * layoutCount - fallbackCount} At Home, ${fallbackCount} fallback`);
for (const row of capturedRows.filter(row => row.fallbackLayouts?.length)) {
  console.log(`Fallback: ${row.region} ${row.district} ${row.fallbackLayouts!.join(", ")}`);
}
