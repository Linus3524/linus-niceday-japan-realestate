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
import { LAYOUT_AREA_BANDS, mlitAgeBandForAge, type MlitBuyAgeBand } from "../src/data/buyMarket.js";

interface MlitTransaction {
  Type?: string;
  Prefecture?: string;
  Municipality?: string;
  TradePrice?: string;
  FloorPlan?: string;
  Area?: string;
  Period?: string;
  BuildingYear?: string;
  TimeToNearestStation?: string;
  UnitPrice?: string;
  Structure?: string;
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
const allowShrink = process.argv.includes("--allow-shrink");

// 既有快照的筆數，用來判斷這次抓取是否異常縮水（見下方 RETENTION_FLOOR）。
// 讀不到檔（第一次建立）時為 0，代表沒有可比對的基準，不做這項檢查。
const existingRowCount = await (async () => {
  if (allowShrink) return 0;
  try {
    const { mlitBuySnapshots } = await import("../src/data/mlitBuySnapshot.js");
    return mlitBuySnapshots.length;
  } catch {
    return 0;
  }
})();
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

const preferredRegionNames = new Map<string, string>();
const preferredDistrictNames = new Map<string, string>();
for (const rate of rentRates) {
  const prefecture = normalizePrefecture(rate.region);
  preferredRegionNames.set(prefecture, rate.region);
  const japaneseDistrict = toJapanese(rate.district).replace("（市平均）", "");
  preferredDistrictNames.set(`${prefecture}|${japaneseDistrict}`, rate.district);
}

const canonicalMarket = (prefecture: string, municipality: string) => {
  const normalizedPrefecture = normalizePrefecture(prefecture);
  const japaneseDistrict = toJapanese(municipality).trim();
  if (!normalizedPrefecture || !japaneseDistrict) return null;
  return {
    region: preferredRegionNames.get(normalizedPrefecture) || normalizedPrefecture,
    district: preferredDistrictNames.get(`${normalizedPrefecture}|${japaneseDistrict}`) || japaneseDistrict,
  };
};

const aggregateMarkets = rentRates.flatMap(rate => {
  const prefecture = normalizePrefecture(rate.region);
  const japaneseDistrict = toJapanese(rate.district).replace("（市平均）", "");
  const designatedCityAverages = new Set([
    "相模原市", "新潟市", "静岡市", "浜松市", "岡山市", "北九州市", "熊本市"
  ]);
  const cityPrefix = rate.district.includes("（市平均）")
    ? japaneseDistrict
    : ["横浜", "川崎"].includes(japaneseDistrict)
      ? `${japaneseDistrict}市`
      : designatedCityAverages.has(japaneseDistrict) ? japaneseDistrict : null;
  return cityPrefix ? [{ region: rate.region, district: rate.district, prefecture, cityPrefix }] : [];
});

// 面積帶定義集中在 src/data/buyMarket.ts，與行情比對邏輯共用同一份，
// 避免這裡改了篩選條件、比對端卻還用舊的面積帶而口徑不一致。
const layoutAreaBands = LAYOUT_AREA_BANDS;

const parsePeriod = (period: string) => {
  const match = /(\d{4})年第(\d)四半期/.exec(period);
  if (!match) return null;
  const year = Number(match[1]);
  const quarter = Number(match[2]);
  return { key: `${year}-Q${quarter}`, ordinal: year * 4 + quarter - 1 };
};

const formatPeriodOrdinal = (ordinal: number) =>
  `${Math.floor(ordinal / 4)}-Q${ordinal % 4 + 1}`;

function transactionAgeBand(row: MlitTransaction, periodKey: string): MlitBuyAgeBand | null {
  const buildingYear = Number(String(row.BuildingYear || "").match(/\d{4}/)?.[0]);
  const tradeYear = Number(periodKey.slice(0, 4));
  if (!Number.isInteger(buildingYear) || !Number.isInteger(tradeYear)) return null;
  return mlitAgeBandForAge(Math.max(0, tradeYear - buildingYear));
}

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

interface BuyObservation {
  price: number;
  area: number;
  sqmPrice: number;
  period: string;
  ordinal: number;
  ageBand: MlitBuyAgeBand | null;
  structure: string | null;
}

const buckets = new Map<string, { observations: BuyObservation[] }>();
const addObservation = (key: string, observation: BuyObservation) => {
  const bucket = buckets.get(key) || { observations: [] };
  bucket.observations.push(observation);
  buckets.set(key, bucket);
};
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
  const market = canonicalMarket(transaction.Prefecture || "", municipality);
  if (!market) continue;
  const sourceUnitPrice = Number(transaction.UnitPrice);
  const sqmPrice = Number.isFinite(sourceUnitPrice) && sourceUnitPrice > 0
    ? sourceUnitPrice
    : price / area;
  const observation: BuyObservation = {
    price,
    area,
    sqmPrice,
    period: period.key,
    ordinal: period.ordinal,
    ageBand: transactionAgeBand(transaction, period.key),
    structure: transaction.Structure?.trim() || null,
  };
  addObservation(`${market.region}|${market.district}|${layout}`, observation);

  const normalizedPrefecture = normalizePrefecture(transaction.Prefecture || "");
  const japaneseMunicipality = toJapanese(municipality);
  for (const aggregate of aggregateMarkets) {
    if (aggregate.prefecture !== normalizedPrefecture || !japaneseMunicipality.startsWith(aggregate.cityPrefix)) continue;
    addObservation(`${aggregate.region}|${aggregate.district}|${layout}`, observation);
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
  const sqmPrices = observations.map(observation => observation.sqmPrice);
  const areas = observations.map(observation => observation.area);
  const ordinals = observations.map(observation => observation.ordinal).sort((a, b) => a - b);
  const ageBands = Object.fromEntries(
    (["age_0_10", "age_11_20", "age_21_30", "age_31_40", "age_41_plus"] as MlitBuyAgeBand[])
      .map(ageBand => {
        const matches = observations.filter(observation => observation.ageBand === ageBand);
        return matches.length >= MIN_SAMPLE_COUNT
          ? [ageBand, {
              medianSqmPriceYen: Math.round(median(matches.map(observation => observation.sqmPrice)) / 1000) * 1000,
              sampleCount: matches.length,
            }]
          : null;
      })
      .filter((entry): entry is [MlitBuyAgeBand, { medianSqmPriceYen: number; sampleCount: number }] => entry !== null)
  );
  const structureCounts = Object.fromEntries(
    [...new Set(observations.map(observation => observation.structure).filter((value): value is string => Boolean(value)))]
      .map(structure => [structure, observations.filter(observation => observation.structure === structure).length])
  );
  return [{
    region,
    district,
    layout,
    medianTradePriceYen: Math.round(median(prices) / 100_000) * 100_000,
    medianSqmPriceYen: Math.round(median(sqmPrices) / 1000) * 1000,
    medianAreaSqm: Math.round(median(areas) * 10) / 10,
    ageBands,
    buildingYearSampleCount: observations.filter(observation => observation.ageBand !== null).length,
    structureCounts,
    sampleCount: observations.length,
    windowQuarters: selectedWindow,
    periodStart: formatPeriodOrdinal(ordinals[0]),
    periodEnd: formatPeriodOrdinal(ordinals.at(-1)!),
    sourceUrl: SOURCE_URL
  }];
}).sort((a, b) => `${a.region}|${a.district}|${a.layout}`.localeCompare(`${b.region}|${b.district}|${b.layout}`, "ja"));

if (!snapshotRows.length) throw new Error("API 回傳資料中沒有足夠樣本，未覆寫既有快照。");

// 只擋「完全沒資料」不夠。API 可能回 200 但內容殘缺（額度用盡、上游暫時性問題），
// 這時筆數會從數百掉到數十卻照樣覆寫，把整份行情資料悄悄弄壞——而且因為檔案有更新、
// 看起來還像成功了。行政區與房型的組合短期內不會大幅減少，所以筆數明顯縮水
// 一定是抓取出問題，寧可中止讓排程失敗、留著舊快照，也不要寫進壞資料。
const RETENTION_FLOOR = 0.8;
if (existingRowCount > 0 && snapshotRows.length < existingRowCount * RETENTION_FLOOR) {
  throw new Error(
    `新資料僅 ${snapshotRows.length} 筆，較既有快照的 ${existingRowCount} 筆減少超過 ${Math.round((1 - RETENTION_FLOOR) * 100)}%，` +
    `判定為抓取異常，已中止並保留原快照。若確認是資料來源本身的正常變動，請加上 --allow-shrink 重跑。`
  );
}

const generatedAt = new Date().toISOString().slice(0, 10);
const prefectureCount = new Set(snapshotRows.map(row => row.region)).size;
const municipalityCount = new Set(snapshotRows.map(row => `${row.region}|${row.district}`)).size;
const body = `import type { LayoutCode } from "./housingMarket.js";\nimport type { MlitBuyAgeBand } from "./buyMarket.js";\n\nexport interface MlitBuyAgeBandSnapshot {\n  medianSqmPriceYen: number;\n  sampleCount: number;\n}\n\nexport interface MlitBuySnapshotRow {\n  region: string;\n  district: string;\n  layout: LayoutCode;\n  medianTradePriceYen: number;\n  medianSqmPriceYen: number;\n  medianAreaSqm: number;\n  ageBands: Partial<Record<MlitBuyAgeBand, MlitBuyAgeBandSnapshot>>;\n  buildingYearSampleCount: number;\n  structureCounts: Record<string, number>;\n  sampleCount: number;\n  windowQuarters: 4 | 8;\n  periodStart: string;\n  periodEnd: string;\n  sourceUrl: string;\n}\n\nexport const mlitBuySnapshotMeta = {\n  generatedAt: "${generatedAt}" as string | null,\n  latestPeriod: "${formatPeriodOrdinal(latestAvailableOrdinal)}",\n  sourceId: "mlit-reinfolib" as const,\n  status: "ready" as "pending_api_approval" | "ready",\n  methodology: "中古マンション等の取引価格を行政区・間取り別に集計。面積がある場合は㎡単価、築年が5件以上ある場合は同築年帯㎡単価を優先し、不足時は同区同間取りへ回退。近4四半期優先・不足時近8四半期",\n  sourceFieldCoverage: { buildingYear: true, structure: true, timeToNearestStation: false, unitPriceDerivedWhenMissing: true },\n  sourceUrl: "${SOURCE_URL}"\n};\n\nexport const mlitBuySnapshots: MlitBuySnapshotRow[] = ${JSON.stringify(snapshotRows, null, 2)};\n`;

const finalBody = body.replace(
  '  methodology: "中古マンション等の取引価格を行政区・間取り別に集計。面積がある場合は㎡単価、築年が5件以上ある場合は同築年帯㎡単価を優先し、不足時は同区同間取りへ回退。近4四半期優先・不足時近8四半期",',
  `  methodology: "全47都道府県の中古マンション等を市区町村・間取り別に集計。面積がある場合は㎡単価、築年が5件以上ある場合は同築年帯㎡単価を優先し、不足時は同区同間取りへ回退。近4四半期優先・不足時近8四半期",\n  prefectureCount: ${prefectureCount},\n  municipalityCount: ${municipalityCount},`
);
await writeFile(OUTPUT_PATH, finalBody, "utf8");
console.log(`Wrote ${snapshotRows.length} MLIT buy-price rows to ${OUTPUT_PATH}`);
