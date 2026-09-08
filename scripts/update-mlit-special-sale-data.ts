/** Build detached-house and land transaction snapshots from MLIT XIT001. */
import dotenv from "dotenv";
dotenv.config({ path: [".env.local", ".env"], quiet: true });
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

type Kind = "detached" | "land";
type AgeBand = "age_0_10" | "age_11_20" | "age_21_30" | "age_31_40" | "age_41_plus";
interface Row {
  Type?: string; Use?: string; Prefecture?: string; Municipality?: string;
  TradePrice?: string; Area?: string; TotalFloorArea?: string; Period?: string;
  BuildingYear?: string; Structure?: string; UnitPrice?: string;
}
interface Observation { price: number; area: number; sqmPrice: number; ordinal: number; period: string; ageBand: AgeBand | null; structure: string | null }

const API_KEY = process.env.MLIT_REINFOLIB_API_KEY;
if (!API_KEY) throw new Error("缺少 MLIT_REINFOLIB_API_KEY");
const API_BASE = "https://www.reinfolib.mlit.go.jp/ex-api/external/XIT001";
const SOURCE_URL = "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/";
const OUTPUT_PATH = resolve("src/data/mlitSpecialSaleSnapshot.ts");
const MIN_SAMPLES = 5;
const currentYear = new Date().getFullYear();
const argValue = (name: string) => process.argv.find(value => value.startsWith(`--${name}=`))?.split("=")[1];
const years = (argValue("years") || `${currentYear - 2},${currentYear - 1},${currentYear}`).split(",").map(Number);
const areas = (argValue("areas") || Array.from({ length: 47 }, (_, index) => String(index + 1).padStart(2, "0")).join(",")).split(",");

const traditionalCharacters: Record<string, string> = {
  "区": "區", "横": "橫", "渋": "澀", "黒": "黑", "戸": "戶", "沢": "澤",
  "豊": "豐", "広": "廣", "静": "靜", "徳": "德", "児": "兒", "縄": "繩",
  "浜": "濱", "稲": "稻", "芸": "藝", "桜": "櫻", "辺": "邊", "竜": "龍",
  "塩": "鹽", "蔵": "藏", "郷": "鄉", "穂": "穗", "緑": "綠"
};
const translate = (value: string) => [...value].map(character => traditionalCharacters[character] || character).join("");
const normalizeRegion = (value: string) => {
  const normalized = translate(value);
  return normalized === "東京都" || normalized === "北海道" ? normalized : normalized.replace(/[府県]$/, "");
};
const normalizeDistrict = (value: string) => translate(value)
  .replace("さいたま市", "埼玉市").replace("つくば市", "筑波市").replace("いわき市", "磐城市");

const parsePeriod = (value: string) => {
  const match = /(\d{4})年第(\d)四半期/.exec(value);
  if (!match) return null;
  const year = Number(match[1]); const quarter = Number(match[2]);
  return { key: `${year}-Q${quarter}`, ordinal: year * 4 + quarter - 1 };
};
const formatPeriod = (ordinal: number) => `${Math.floor(ordinal / 4)}-Q${ordinal % 4 + 1}`;
const ageBand = (row: Row, period: string): AgeBand | null => {
  const built = Number(String(row.BuildingYear || "").match(/\d{4}/)?.[0]);
  const sold = Number(period.slice(0, 4));
  if (!Number.isInteger(built) || !Number.isInteger(sold)) return null;
  const age = Math.max(0, sold - built);
  return age <= 10 ? "age_0_10" : age <= 20 ? "age_11_20" : age <= 30 ? "age_21_30" : age <= 40 ? "age_31_40" : "age_41_plus";
};
const bandFor = (kind: Kind, area: number) => kind === "land"
  ? area < 50 ? "under_50" : area < 100 ? "50_100" : area < 150 ? "100_150" : area < 200 ? "150_200" : area < 250 ? "200_250" : "250_plus"
  : area < 60 ? "under_60" : area < 80 ? "60_80" : area < 100 ? "80_100" : area < 120 ? "100_120" : area < 150 ? "120_150" : "150_plus";
const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b); const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
};

async function fetchRows(area: string, year: number): Promise<Row[]> {
  const url = new URL(API_BASE);
  url.searchParams.set("year", String(year)); url.searchParams.set("area", area);
  url.searchParams.set("priceClassification", "01"); url.searchParams.set("language", "ja");
  const response = await fetch(url, { headers: { "Ocp-Apim-Subscription-Key": API_KEY! } });
  if (response.status === 404) return [];
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${year}/${area}`);
  return ((await response.json()) as { data?: Row[] }).data || [];
}

const jobs = years.flatMap(year => areas.map(area => ({ year, area })));
const transactions: Row[] = [];
let cursor = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (cursor < jobs.length) {
    const job = jobs[cursor++];
    const rows = await fetchRows(job.area, job.year);
    transactions.push(...rows);
    console.log(`MLIT special ${job.year}/${job.area}: ${rows.length}`);
  }
}));

const latestOrdinal = transactions.reduce((latest, row) =>
  Math.max(latest, parsePeriod(row.Period || "")?.ordinal ?? -1), -1);
if (latestOrdinal < 0) throw new Error("MLIT 沒有可辨識季度");
const buckets = new Map<string, Observation[]>();
const push = (key: string, observation: Observation) => buckets.set(key, [...(buckets.get(key) || []), observation]);

for (const row of transactions) {
  const kind: Kind | null = row.Type === "宅地(土地)" ? "land"
    : row.Type === "宅地(土地と建物)" && row.Use === "住宅" ? "detached" : null;
  if (!kind) continue;
  const period = parsePeriod(row.Period || ""); if (!period) continue;
  const area = Number(kind === "land" ? row.Area : row.TotalFloorArea);
  const price = Number(row.TradePrice);
  if (!Number.isFinite(area) || area < 10 || area > 2000 || !Number.isFinite(price) || price < 500_000 || price > 2_000_000_000) continue;
  const region = normalizeRegion(row.Prefecture || ""); const district = normalizeDistrict(row.Municipality || "");
  if (!region || !district) continue;
  const sourceUnit = kind === "land" ? Number(row.UnitPrice) : NaN;
  const sqmPrice = Number.isFinite(sourceUnit) && sourceUnit > 0 ? sourceUnit : price / area;
  const observation = { price, area, sqmPrice, ordinal: period.ordinal, period: period.key, ageBand: kind === "detached" ? ageBand(row, period.key) : null, structure: row.Structure?.trim() || null };
  push(`${kind}|${region}|${district}|${bandFor(kind, area)}`, observation);
}

const snapshotRows = [...buckets.entries()].flatMap(([key, observations]) => {
  const windowQuarters = ([4, 8] as const).find(window => observations.filter(item => item.ordinal >= latestOrdinal - window + 1).length >= MIN_SAMPLES);
  if (!windowQuarters) return [];
  const selected = observations.filter(item => item.ordinal >= latestOrdinal - windowQuarters + 1);
  const [kind, region, district, areaBand] = key.split("|") as [Kind, string, string, string];
  const ageBands = kind === "detached" ? Object.fromEntries(
    (["age_0_10", "age_11_20", "age_21_30", "age_31_40", "age_41_plus"] as AgeBand[]).flatMap(band => {
      const matches = selected.filter(item => item.ageBand === band);
      return matches.length >= MIN_SAMPLES ? [[band, { medianTradePriceYen: Math.round(median(matches.map(item => item.price)) / 100_000) * 100_000, medianSqmPriceYen: Math.round(median(matches.map(item => item.sqmPrice)) / 1000) * 1000, sampleCount: matches.length }]] : [];
    })
  ) : {};
  const ordinals = selected.map(item => item.ordinal).sort((a, b) => a - b);
  return [{
    kind, region, district, areaBand,
    medianTradePriceYen: Math.round(median(selected.map(item => item.price)) / 100_000) * 100_000,
    medianSqmPriceYen: Math.round(median(selected.map(item => item.sqmPrice)) / 1000) * 1000,
    medianAreaSqm: Math.round(median(selected.map(item => item.area)) * 10) / 10,
    ageBands, sampleCount: selected.length, windowQuarters,
    periodStart: formatPeriod(ordinals[0]), periodEnd: formatPeriod(ordinals.at(-1)!), sourceUrl: SOURCE_URL,
  }];
}).sort((a, b) => `${a.kind}|${a.region}|${a.district}|${a.areaBand}`.localeCompare(`${b.kind}|${b.region}|${b.district}|${b.areaBand}`, "ja"));

const detachedCount = snapshotRows.filter(row => row.kind === "detached").length;
const landCount = snapshotRows.filter(row => row.kind === "land").length;
if (detachedCount < 100 || landCount < 100) throw new Error(`MLIT special coverage too small: detached=${detachedCount}, land=${landCount}`);

const body = `// @ts-nocheck -- generated data is intentionally not expanded into a 9,000+ member literal union
/** Generated by scripts/update-mlit-special-sale-data.ts. */
export type MlitSpecialMarketKind = "detached" | "land";
export type MlitSpecialAgeBand = "age_0_10" | "age_11_20" | "age_21_30" | "age_31_40" | "age_41_plus";
export interface MlitSpecialAgeSnapshot { medianTradePriceYen: number; medianSqmPriceYen: number; sampleCount: number }
export interface MlitSpecialSaleSnapshotRow {
  kind: MlitSpecialMarketKind; region: string; district: string; areaBand: string;
  medianTradePriceYen: number; medianSqmPriceYen: number; medianAreaSqm: number;
  ageBands: Partial<Record<MlitSpecialAgeBand, MlitSpecialAgeSnapshot>>;
  sampleCount: number; windowQuarters: 4 | 8; periodStart: string; periodEnd: string; sourceUrl: string;
}
export const mlitSpecialSaleSnapshotMeta = {
  generatedAt: "${new Date().toISOString().slice(0, 10)}",
  latestPeriod: "${formatPeriod(latestOrdinal)}",
  sourceId: "mlit-reinfolib" as const,
  methodology: "戶建限宅地（土地と建物）且用途為住宅，土地限宅地（土地）；依市區町村與面積帶彙整，近4季至少5筆、不足擴至近8季。戶建另保存至少5筆的屋齡帶成交中位數。",
  detachedBucketCount: ${detachedCount}, landBucketCount: ${landCount}, sourceUrl: "${SOURCE_URL}"
};
export const mlitSpecialSaleSnapshots: MlitSpecialSaleSnapshotRow[] = ${JSON.stringify(snapshotRows, null, 2)};
`;
await writeFile(OUTPUT_PATH, body, "utf8");
console.log(`Wrote MLIT special-sale snapshot: detached=${detachedCount}, land=${landCount}`);
