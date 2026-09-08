/**
 * Capture At Home's public used-detached-house and land asking-price averages.
 * Production never fetches At Home directly; this writes a dated static snapshot.
 */
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

type SpecialMarketKind = "detached" | "land";

interface CityIndexRow {
  syzRoman: string;
  shikugunNm: string;
  isExist: boolean;
  rangeKakaku: Record<string, number>;
}

interface CityIndexPage {
  prefecture: { kenNm: string; kenRoman: string };
  cityMsSoubaListInfo: { citySoubaList: CityIndexRow[] } | null;
}

const BASE_URL = "https://www.athome.co.jp";
const OUTPUT_PATH = resolve("src/data/atHomeSpecialSaleSnapshot.ts");
const CAPTURED_AT = new Date().toISOString().slice(0, 10);
const CONCURRENCY = 6;
const prefectureSlugs = [
  "aichi", "akita", "aomori", "chiba", "ehime", "fukui", "fukuoka", "fukushima",
  "gifu", "gunma", "hiroshima", "hokkaido", "hyogo", "ibaraki", "ishikawa", "iwate",
  "kagawa", "kagoshima", "kanagawa", "kochi", "kumamoto", "kyoto", "mie", "miyagi",
  "miyazaki", "nagano", "nagasaki", "nara", "niigata", "oita", "okayama", "okinawa",
  "osaka", "saga", "saitama", "shiga", "shimane", "shizuoka", "tochigi", "tokushima",
  "tokyo", "tottori", "toyama", "wakayama", "yamagata", "yamaguchi", "yamanashi"
] as const;

const traditionalCharacters: Record<string, string> = {
  "区": "區", "横": "橫", "渋": "澀", "黒": "黑", "戸": "戶", "沢": "澤",
  "豊": "豐", "広": "廣", "静": "靜", "徳": "德", "児": "兒", "縄": "繩",
  "浜": "濱", "稲": "稻", "芸": "藝", "桜": "櫻", "辺": "邊", "竜": "龍",
  "塩": "鹽", "蔵": "藏", "郷": "鄉", "穂": "穗", "緑": "綠"
};

const translateCharacters = (value: string) => [...value]
  .map(character => traditionalCharacters[character] || character).join("");

function normalizeDistrict(value: string) {
  let normalized = translateCharacters(value);
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

async function fetchPage<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { "user-agent": "LINUS-special-sale-market/1.0" } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  const html = await response.text();
  const marker = '<script id="__NEXT_DATA__" type="application/json">';
  const start = html.indexOf(marker);
  const end = html.indexOf("</script>", start + marker.length);
  if (start < 0 || end < 0) throw new Error(`At Home __NEXT_DATA__ missing: ${url}`);
  return JSON.parse(html.slice(start + marker.length, end)).props.pageProps as T;
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

const configurations = [
  {
    kind: "detached" as const,
    path: "kodate/chuko",
    unit: "total" as const,
    bands: { "001": "all", "902": "under_60", "002": "60_80", "003": "80_100", "004": "100_120", "005": "120_150", "006": "150_plus" }
  },
  {
    kind: "land" as const,
    path: "tochi",
    unit: "sqm" as const,
    bands: { "001": "all", "902": "under_50", "002": "50_100", "003": "100_150", "004": "150_200", "005": "200_250", "006": "250_plus" }
  }
] as const;

const rows = (await mapConcurrent(configurations.flatMap(configuration =>
  prefectureSlugs.map(slug => ({ configuration, slug }))
), async ({ configuration, slug }) => {
  const sourceUrl = `${BASE_URL}/${configuration.path}/souba/${slug}/city/`;
  const page = await fetchPage<CityIndexPage>(sourceUrl);
  const region = normalizePrefecture(page.prefecture.kenNm);
  return (page.cityMsSoubaListInfo?.citySoubaList || []).flatMap(city => {
    if (!city.isExist) return [];
    const values = Object.fromEntries(Object.entries(configuration.bands).map(([code, band]) => {
      const raw = Number(city.rangeKakaku[code]);
      const yen = raw > 0 ? Math.round(raw * 10_000) : null;
      return [band, yen];
    }));
    return [{
      kind: configuration.kind,
      region,
      district: normalizeDistrict(city.shikugunNm),
      valueUnit: configuration.unit,
      values,
      sourceUrl: `${BASE_URL}/${configuration.path}/souba/${slug}/${city.syzRoman}-city/`,
    }];
  });
})).flat();

const detachedCount = rows.filter(row => row.kind === "detached").length;
const landCount = rows.filter(row => row.kind === "land").length;
if (detachedCount < 500 || landCount < 500) {
  throw new Error(`At Home coverage unexpectedly small: detached=${detachedCount}, land=${landCount}`);
}

const body = `// @ts-nocheck -- generated data is intentionally not expanded into a 1,000+ member literal union
/** Generated by scripts/update-athome-special-sale-data.ts. */
export type AtHomeSpecialMarketKind = "detached" | "land";
export type AtHomeSpecialAreaBand = "all" | "under_50" | "50_100" | "100_150" | "150_200" | "200_250" | "250_plus" | "under_60" | "60_80" | "80_100" | "100_120" | "120_150" | "150_plus";

export interface AtHomeSpecialSaleSnapshotRow {
  kind: AtHomeSpecialMarketKind;
  region: string;
  district: string;
  valueUnit: "total" | "sqm";
  values: Partial<Record<AtHomeSpecialAreaBand, number | null>>;
  sourceUrl: string;
}

export const atHomeSpecialSaleSnapshotMeta = {
  capturedAt: "${CAPTURED_AT}",
  sourceId: "athome-public" as const,
  sourceLabel: "At Home 公開刊登相場",
  methodology: "中古戶建依建物面積帶保存刊登平均總價；土地依土地面積帶保存每㎡刊登平均。數值來自公開相場頁最近刊登資料，並非成交價。",
  detachedMarketCount: ${detachedCount},
  landMarketCount: ${landCount}
};

export const atHomeSpecialSaleSnapshots: AtHomeSpecialSaleSnapshotRow[] = ${JSON.stringify(rows, null, 2)};
`;

await writeFile(OUTPUT_PATH, body, "utf8");
console.log(`Wrote At Home special-sale snapshot: detached=${detachedCount}, land=${landCount}`);
