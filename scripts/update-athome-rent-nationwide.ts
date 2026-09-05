/**
 * Capture nationwide At Home public rent averages for uploaded rental sheets.
 * This dataset is deliberately separate from the curated map/station market.
 */
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { atHomeNationwideRentSnapshotMeta as currentSnapshotMeta } from "../src/data/atHomeNationwideRentSnapshot.js";

type Layout = "r1" | "k1" | "ldk1" | "ldk2" | "ldk3";
type DetailedLayout =
  | "oneRoom" | "k1" | "dk1" | "ldk1" | "k2" | "dk2"
  | "ldk2" | "k3" | "dk3" | "ldk3" | "k4" | "dk4" | "ldk4Plus";

interface CityIndexRow { syzRoman: string; shikugunNm: string; isExist: boolean }
interface IndexPage {
  prefecture: { kenNm: string };
  cityMdrSoubaListInfo: { citySoubaList: CityIndexRow[] };
}
interface DetailPage {
  initSoubaDetailInfo: { mdrSoubaList: Array<{ mdrRangeNm: string; kakaku?: string | null }> };
}

const BASE_URL = "https://www.athome.co.jp";
const OUTPUT_PATH = resolve("src/data/atHomeNationwideRentSnapshot.ts");
const CAPTURED_AT = new Date().toISOString().slice(0, 10);
const CONCURRENCY = 4;
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
const translate = (value: string) => [...value].map(char => nameCharacters[char] || char).join("");
const normalizeDistrict = (value: string) => {
  let normalized = translate(value);
  const replacements: Record<string, string> = {
    "さいたま市": "埼玉市", "つくば市": "筑波市", "いわき市": "磐城市",
    "那覇市": "那霸市", "姫路市": "姬路市"
  };
  for (const [from, to] of Object.entries(replacements)) normalized = normalized.replace(from, to);
  return normalized;
};
const normalizePrefecture = (value: string) => {
  const normalized = translate(value);
  return normalized === "東京都" || normalized === "北海道" ? normalized : normalized.replace(/[府県]$/, "");
};

async function fetchProps<T>(url: string): Promise<T> {
  for (let attempt = 1; attempt <= 4; attempt++) {
    const response = await fetch(url, { headers: { "user-agent": "LINUS-rent-market-review/1.0" } });
    if (response.ok) {
      const html = await response.text();
      const marker = '<script id="__NEXT_DATA__" type="application/json">';
      const start = html.indexOf(marker);
      const end = html.indexOf("</script>", start + marker.length);
      if (start < 0 || end < 0) throw new Error(`At Home __NEXT_DATA__ missing: ${url}`);
      return JSON.parse(html.slice(start + marker.length, end)).props.pageProps as T;
    }
    if (![405, 429, 500, 502, 503, 504].includes(response.status) || attempt === 4) {
      throw new Error(`${response.status} ${response.statusText}: ${url}`);
    }
    await new Promise(resolveWait => setTimeout(resolveWait, attempt * 750));
  }
  throw new Error(`At Home request failed: ${url}`);
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

const indexes = await mapConcurrent([...prefectureSlugs], async slug => ({
  slug,
  page: await fetchProps<IndexPage>(`${BASE_URL}/chintai/souba/${slug}/city/`)
}));
const targets = indexes.flatMap(({ slug, page }) => page.cityMdrSoubaListInfo.citySoubaList
  .filter(city => city.isExist)
  .map(city => ({
    region: normalizePrefecture(page.prefecture.kenNm),
    district: normalizeDistrict(city.shikugunNm),
    sourceUrl: `${BASE_URL}/chintai/souba/${slug}/${city.syzRoman}-city/`
  })));

const detailedNames: Record<DetailedLayout, string> = {
  oneRoom: "ワンルーム", k1: "1K", dk1: "1DK", ldk1: "1LDK", k2: "2K", dk2: "2DK",
  ldk2: "2LDK", k3: "3K", dk3: "3DK", ldk3: "3LDK", k4: "4K", dk4: "4DK", ldk4Plus: "4LDK以上"
};
const groupedLayouts: Record<Layout, DetailedLayout[]> = {
  r1: ["oneRoom"], k1: ["k1", "dk1"], ldk1: ["ldk1", "k2", "dk2"],
  ldk2: ["ldk2", "k3", "dk3"], ldk3: ["ldk3", "k4", "dk4"]
};
const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
};

const rows = await mapConcurrent(targets, async target => {
  const page = await fetchProps<DetailPage>(target.sourceUrl);
  const byName = new Map(page.initSoubaDetailInfo.mdrSoubaList.map(row => [row.mdrRangeNm, row.kakaku]));
  const detailedRents = Object.fromEntries((Object.keys(detailedNames) as DetailedLayout[]).map(layout => {
    const value = Number.parseInt(byName.get(detailedNames[layout]) || "", 10);
    return [layout, Number.isFinite(value) && value > 0 ? value : null];
  })) as Record<DetailedLayout, number | null>;
  const rents = Object.fromEntries((Object.keys(groupedLayouts) as Layout[]).map(layout => {
    const values = groupedLayouts[layout].map(detail => detailedRents[detail]).filter((value): value is number => value !== null);
    return [layout, values.length ? median(values) : null];
  })) as Record<Layout, number | null>;
  return { ...target, rents, detailedRents };
});

const uniqueRows = [...new Map(
  rows
    .filter(row => Object.values(row.rents).some(value => value !== null))
    .map(row => [`${row.region}|${row.district}`, row])
).values()];
const layoutValueCount = uniqueRows.reduce((count, row) => count + Object.values(row.rents).filter(Boolean).length, 0);
if (uniqueRows.length < 1_150 || layoutValueCount < 3_000) {
  throw new Error(`Nationwide At Home rent capture is unexpectedly small: ${uniqueRows.length} rows / ${layoutValueCount} layout values`);
}
if (
  uniqueRows.length < currentSnapshotMeta.municipalityCount * 0.8 ||
  layoutValueCount < currentSnapshotMeta.layoutValueCount * 0.8
) {
  throw new Error(
    `Nationwide rent snapshot shrank too far from ${currentSnapshotMeta.municipalityCount}/${currentSnapshotMeta.layoutValueCount} ` +
    `to ${uniqueRows.length}/${layoutValueCount}; existing snapshot preserved.`
  );
}

const body = `/** Generated by scripts/update-athome-rent-nationwide.ts. */
import type { LayoutCode } from "./housingMarket.js";

export interface AtHomeNationwideRentSnapshotRow {
  region: string;
  district: string;
  rents: Record<LayoutCode, number | null>;
  sourceUrl: string;
}

export const atHomeNationwideRentSnapshotMeta = {
  capturedAt: "${CAPTURED_AT}",
  sourceId: "athome-public" as const,
  sourceLabel: "At Home 刊登物件直近 3 個月租金平均",
  municipalityCount: ${uniqueRows.length},
  layoutValueCount: ${layoutValueCount},
  includesManagementFee: null as boolean | null
};

export const atHomeNationwideRentSnapshots: AtHomeNationwideRentSnapshotRow[] = ${JSON.stringify(uniqueRows.map(({ detailedRents: _details, ...row }) => row), null, 2)};
`;
await writeFile(OUTPUT_PATH, body, "utf8");
console.log(`Wrote ${uniqueRows.length} nationwide At Home rent markets / ${layoutValueCount} layout values to ${OUTPUT_PATH}`);
