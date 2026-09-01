/**
 * Build a static buy-price snapshot from MLIT's official XIT001 API.
 *
 * The API key is never shipped to the browser. Put it in .env.local and run:
 *
 *   MLIT_REINFOLIB_API_KEY=... npm run data:update:mlit-buy
 *
 * Optional: --years=2024,2025,2026 --areas=13,14
 */
import dotenv from "dotenv";
dotenv.config({ path: [".env.local", ".env"] });
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { rentRates, type LayoutCode } from "../src/data/housingMarket.js";

interface MlitTransaction {
  Type?: string;
  Municipality?: string;
  TradePrice?: string;
  FloorPlan?: string;
  Area?: string;
  Period?: string;
}

interface MlitResponse { status?: string; data?: MlitTransaction[] }

const API_BASE = "https://www.reinfolib.mlit.go.jp/ex-api/external/XIT001";
const API_KEY = process.env.MLIT_REINFOLIB_API_KEY;
const OUTPUT_PATH = resolve("src/data/mlitBuySnapshot.ts");
const SOURCE_URL = "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/";
const MIN_SAMPLE_COUNT = 5;
const ROLLING_WINDOWS = [4, 8] as const;

if (!API_KEY) {
  throw new Error("缺少 MLIT_REINFOLIB_API_KEY。請把金鑰放在 .env.local；不要放進 VITE_ 開頭的前端環境變數。");
}

const argValue = (name: string) => process.argv.find(arg => arg.startsWith(`--${name}=`))?.split("=")[1];
const currentYear = new Date().getFullYear();
const years = (argValue("years") || `${currentYear - 2},${currentYear - 1},${currentYear}`)
  .split(",").map(Number).filter(Number.isInteger);
const allAreas = Array.from({ length: 47 }, (_, index) => String(index + 1).padStart(2, "0"));
const areas = (argValue("areas") || allAreas.join(",")).split(",").map(value => value.padStart(2, "0"));

const japaneseCharacters: Record<string, string> = {
  "區": "区", "橫": "横", "澀": "渋", "黑": "黒", "戶": "戸", "澤": "沢",
  "豐": "豊", "廣": "広", "靜": "静", "德": "徳", "兒": "児", "繩": "縄",
  "濱": "浜", "稻": "稲", "藝": "芸", "櫻": "桜", "邊": "辺", "龍": "竜",
  "鹽": "塩", "藏": "蔵", "鄉": "郷", "穗": "穂", "姬": "姫", "霸": "覇",
  "綠": "緑"
};

const toJapanese = (value: string) => [...value]
  .map(character => japaneseCharacters[character] || character).join("")
  .replace("筑波市", "つくば市")
  .replace("磐城市", "いわき市")
  .replace("埼玉市", "さいたま市");

const normalizePrefecture = (value: string) => {
  const normalized = toJapanese(value);
  return normalized === "東京都" || normalized === "北海道"
    ? normalized
    : normalized.replace(/[府県]$/, "");
};

const targetMarkets = rentRates.map(rate => {
  const japaneseDistrict = toJapanese(rate.district).replace("（市平均）", "");
  const isCityAggregate = rate.district.includes("（市平均）") || (!japaneseDistrict.endsWith("区") && japaneseDistrict.endsWith("市"));
  return { region: rate.region, district: rate.district, japaneseDistrict, isCityAggregate };
});

const layoutAreaBands: Record<LayoutCode, [number, number]> = {
  r1: [12, 24], k1: [18, 35], ldk1: [30, 52], ldk2: [45, 75], ldk3: [65, 130]
};

const parsePeriod = (period: string) => {
  const match = /(\d{4})年第(\d)四半期/.exec(period);
  if (!match) return null;
  const year = Number(match[1]);
  const quarter = Number(match[2]);
  return { key: `${year}-Q${quarter}`, ordinal: year * 4 + quarter - 1 };
};

const formatPeriodOrdinal = (ordinal: number) =>
  `${Math.floor(ordinal / 4)}-Q${ordinal % 4 + 1}`;

function transactionLayout(row: MlitTransaction): LayoutCode | null {
  const plan = String(row.FloorPlan || "").normalize("NFKC").toUpperCase().replace(/[\s+]/g, "");
  if (/^(ワンルーム|1R)$/.test(plan)) return "r1";
  if (/^(1K|1DK)$/.test(plan)) return "k1";
  if (/^(1LDK|2K|2DK)$/.test(plan)) return "ldk1";
  if (/^(2LDK|3K|3DK)$/.test(plan)) return "ldk2";
  if (/^(3LDK|4K|4DK|4LDK|5K|5DK|5LDK)/.test(plan)) return "ldk3";

  // Some transaction records omit the floor plan. Area bands provide a
  // documented fallback, but an individual record is assigned only when it
  // falls into one non-overlapping core range.
  const area = Number(row.Area);
  if (!Number.isFinite(area)) return null;
  const coreBands: Record<LayoutCode, [number, number]> = {
    r1: [12, 19.99], k1: [20, 29.99], ldk1: [30, 49.99], ldk2: [50, 69.99], ldk3: [70, 130]
  };
  return (Object.entries(coreBands) as Array<[LayoutCode, [number, number]]>)
    .find(([, [min, max]]) => area >= min && area <= max)?.[0] || null;
}

function targetMatches(target: typeof targetMarkets[number], prefecture: string, municipality: string) {
  if (normalizePrefecture(prefecture) !== normalizePrefecture(target.region)) return false;
  const normalizedMunicipality = toJapanese(municipality);
  return target.isCityAggregate
    ? normalizedMunicipality === target.japaneseDistrict || normalizedMunicipality.startsWith(target.japaneseDistrict)
    : normalizedMunicipality === target.japaneseDistrict;
}

async function fetchTransactions(area: string, year: number) {
  const url = new URL(API_BASE);
  url.searchParams.set("year", String(year));
  url.searchParams.set("area", area);
  url.searchParams.set("priceClassification", "01");
  url.searchParams.set("language", "ja");
  const response = await fetch(url, { headers: { "Ocp-Apim-Subscription-Key": API_KEY! } });
  if (response.status === 404) return [];
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: area=${area}, year=${year}`);
  const payload = await response.json() as MlitResponse;
  return payload.data || [];
}

const transactions: MlitTransaction[] = [];
for (const year of years) {
  for (const area of areas) {
    const rows = await fetchTransactions(area, year);
    transactions.push(...rows);
    console.log(`MLIT ${year} area ${area}: ${rows.length} records`);
  }
}

const availablePeriodOrdinals = transactions
  .map(transaction => parsePeriod(transaction.Period || "")?.ordinal)
  .filter((ordinal): ordinal is number => ordinal !== undefined);
if (!availablePeriodOrdinals.length) throw new Error("API 回傳資料中沒有可辨識的季度。");
const latestAvailableOrdinal = availablePeriodOrdinals.reduce((latest, ordinal) =>
  Math.max(latest, ordinal), Number.NEGATIVE_INFINITY);

const buckets = new Map<string, { observations: Array<{ price: number; period: string; ordinal: number }> }>();
for (const transaction of transactions) {
  if (!/マンション/.test(transaction.Type || "")) continue;
  const period = parsePeriod(transaction.Period || "");
  if (!period) continue;
  const layout = transactionLayout(transaction);
  if (!layout) continue;
  const area = Number(transaction.Area);
  const [minArea, maxArea] = layoutAreaBands[layout];
  if (!Number.isFinite(area) || area < minArea || area > maxArea) continue;
  const price = Number(transaction.TradePrice);
  if (!Number.isFinite(price) || price < 1_000_000 || price > 1_000_000_000) continue;
  const municipality = transaction.Municipality || "";
  const prefecture = String((transaction as MlitTransaction & { Prefecture?: string }).Prefecture || "");
  for (const target of targetMarkets) {
    if (!targetMatches(target, prefecture, municipality)) continue;
    const key = `${target.region}|${target.district}|${layout}`;
    const bucket = buckets.get(key) || { observations: [] };
    bucket.observations.push({ price, period: period.key, ordinal: period.ordinal });
    buckets.set(key, bucket);
  }
}

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
};

const snapshotRows = Array.from(buckets.entries()).flatMap(([key, bucket]) => {
  const selectedWindow = ROLLING_WINDOWS.find(windowQuarters =>
    bucket.observations.filter(observation =>
      observation.ordinal >= latestAvailableOrdinal - windowQuarters + 1 &&
      observation.ordinal <= latestAvailableOrdinal
    ).length >= MIN_SAMPLE_COUNT
  );
  if (!selectedWindow) return [];
  const observations = bucket.observations.filter(observation =>
    observation.ordinal >= latestAvailableOrdinal - selectedWindow + 1 &&
    observation.ordinal <= latestAvailableOrdinal
  );
  const [region, district, layout] = key.split("|") as [string, string, LayoutCode];
  const prices = observations.map(observation => observation.price);
  const ordinals = observations.map(observation => observation.ordinal).sort((a, b) => a - b);
  return [{
    region,
    district,
    layout,
    medianTradePriceYen: Math.round(median(prices) / 100_000) * 100_000,
    sampleCount: observations.length,
    windowQuarters: selectedWindow,
    periodStart: formatPeriodOrdinal(ordinals[0]),
    periodEnd: formatPeriodOrdinal(ordinals.at(-1)!),
    sourceUrl: SOURCE_URL
  }];
}).sort((a, b) => `${a.region}|${a.district}|${a.layout}`.localeCompare(`${b.region}|${b.district}|${b.layout}`, "ja"));

if (!snapshotRows.length) throw new Error("API 回傳資料中沒有足夠樣本，未覆寫既有快照。");

const generatedAt = new Date().toISOString().slice(0, 10);
const body = `import type { LayoutCode } from "./housingMarket.js";\n\nexport interface MlitBuySnapshotRow {\n  region: string;\n  district: string;\n  layout: LayoutCode;\n  medianTradePriceYen: number;\n  sampleCount: number;\n  windowQuarters: 4 | 8;\n  periodStart: string;\n  periodEnd: string;\n  sourceUrl: string;\n}\n\nexport const mlitBuySnapshotMeta = {\n  generatedAt: "${generatedAt}" as string | null,\n  latestPeriod: "${formatPeriodOrdinal(latestAvailableOrdinal)}",\n  sourceId: "mlit-reinfolib" as const,\n  status: "ready" as "pending_api_approval" | "ready",\n  methodology: "中古マンション等の取引価格を行政区・間取り別に集計した近4四半期優先・不足時近8四半期の中央値（間取り欠損時は面積帯）",\n  sourceUrl: "${SOURCE_URL}"\n};\n\nexport const mlitBuySnapshots: MlitBuySnapshotRow[] = ${JSON.stringify(snapshotRows, null, 2)};\n`;

await writeFile(OUTPUT_PATH, body, "utf8");
console.log(`Wrote ${snapshotRows.length} MLIT buy-price rows to ${OUTPUT_PATH}`);
