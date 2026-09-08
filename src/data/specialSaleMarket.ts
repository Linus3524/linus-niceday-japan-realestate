import { atHomeSpecialSaleSnapshotMeta, atHomeSpecialSaleSnapshots } from "./atHomeSpecialSaleSnapshot.js";
import { mlitSpecialSaleSnapshots, type MlitSpecialAgeBand, type MlitSpecialMarketKind } from "./mlitSpecialSaleSnapshot.js";

export interface SpecialSaleMarketComparison {
  kind: MlitSpecialMarketKind;
  market: string;
  areaBand: string;
  officialPriceYen: number;
  officialSqmPriceYen: number;
  officialSampleCount: number;
  officialPeriod: string;
  officialSourceUrl: string;
  ageControlled: boolean;
  listingPriceYen: number | null;
  listingPeriod: string | null;
  listingSourceUrl: string | null;
  saleVsOfficialPercent: number;
  saleVsListingPercent: number | null;
  fairLowYen: number;
  fairHighYen: number;
  verdict: "below" | "fair" | "above";
}

const traditionalCharacters: Record<string, string> = {
  "区": "區", "横": "橫", "渋": "澀", "黒": "黑", "戸": "戶", "沢": "澤",
  "豊": "豐", "広": "廣", "静": "靜", "徳": "德", "児": "兒", "縄": "繩",
  "浜": "濱", "稲": "稻", "芸": "藝", "桜": "櫻", "辺": "邊", "竜": "龍",
  "塩": "鹽", "蔵": "藏", "郷": "鄉", "穂": "穗", "緑": "綠"
};
const normalize = (value: string) => [...value.normalize("NFKC")]
  .map(character => traditionalCharacters[character] || character).join("")
  .replace(/\s+/g, "");

export function specialSaleAreaBand(kind: MlitSpecialMarketKind, area: number) {
  return kind === "land"
    ? area < 50 ? "under_50" : area < 100 ? "50_100" : area < 150 ? "100_150" : area < 200 ? "150_200" : area < 250 ? "200_250" : "250_plus"
    : area < 60 ? "under_60" : area < 80 ? "60_80" : area < 100 ? "80_100" : area < 120 ? "100_120" : area < 150 ? "120_150" : "150_plus";
}

const ageBandFor = (age: number | null): MlitSpecialAgeBand | null => age === null ? null
  : age <= 10 ? "age_0_10" : age <= 20 ? "age_11_20" : age <= 30 ? "age_21_30" : age <= 40 ? "age_31_40" : "age_41_plus";

const bandLabel: Record<string, string> = {
  under_50: "50㎡未滿", "50_100": "50～100㎡", "100_150": "100～150㎡",
  "150_200": "150～200㎡", "200_250": "200～250㎡", "250_plus": "250㎡以上",
  under_60: "60㎡未滿", "60_80": "60～80㎡", "80_100": "80～100㎡",
  "100_120": "100～120㎡", "120_150": "120～150㎡", "150_plus": "150㎡以上",
};

function weightedMedian(entries: Array<{ value: number; weight: number }>) {
  const sorted = [...entries].sort((a, b) => a.value - b.value);
  const midpoint = sorted.reduce((sum, entry) => sum + entry.weight, 0) / 2;
  let cumulative = 0;
  for (const entry of sorted) {
    cumulative += entry.weight;
    if (cumulative >= midpoint) return entry.value;
  }
  return sorted.at(-1)?.value ?? null;
}

function resolveMarket(kind: MlitSpecialMarketKind, address: string) {
  const input = normalize(address);
  const candidates = mlitSpecialSaleSnapshots
    .filter(row => row.kind === kind && input.includes(normalize(row.district)))
    .filter(row => input.includes(normalize(row.region)) || !/[都道府県]/.test(input))
    .sort((a, b) => normalize(b.district).length - normalize(a.district).length);
  if (!candidates.length) return null;
  return { region: candidates[0].region, district: candidates[0].district };
}

export function getSpecialSaleMarketComparison(input: {
  kind: MlitSpecialMarketKind;
  address?: string | null;
  salePriceYen: number;
  areaSqm: number | null;
  ageYears?: number | null;
}): SpecialSaleMarketComparison | null {
  if (!input.address || !input.areaSqm || input.areaSqm <= 0) return null;
  const market = resolveMarket(input.kind, input.address);
  if (!market) return null;
  const areaBand = specialSaleAreaBand(input.kind, input.areaSqm);
  const official = mlitSpecialSaleSnapshots.find(row =>
    row.kind === input.kind && row.region === market.region && row.district === market.district && row.areaBand === areaBand
  );
  if (!official) return null;
  const requestedAgeBand = input.kind === "detached" ? ageBandFor(input.ageYears ?? null) : null;
  const ageSnapshot = requestedAgeBand ? official.ageBands[requestedAgeBand] : null;
  const districtAgeEntries = requestedAgeBand && !ageSnapshot
    ? mlitSpecialSaleSnapshots.flatMap(row => {
        if (row.kind !== "detached" || row.region !== market.region || row.district !== market.district) return [];
        const entry = row.ageBands[requestedAgeBand];
        return entry ? [{ value: entry.medianSqmPriceYen, weight: entry.sampleCount }] : [];
      })
    : [];
  const districtAgeSqmPrice = weightedMedian(districtAgeEntries);
  const districtAgeSampleCount = districtAgeEntries.reduce((sum, entry) => sum + entry.weight, 0);
  const officialSqmPriceYen = ageSnapshot?.medianSqmPriceYen ?? districtAgeSqmPrice ?? official.medianSqmPriceYen;
  const officialPriceYen = Math.round(officialSqmPriceYen * input.areaSqm / 100_000) * 100_000;
  const listing = atHomeSpecialSaleSnapshots.find(row =>
    row.kind === input.kind && row.region === market.region && row.district === market.district
  );
  const listingValue = listing?.values[areaBand] ?? listing?.values.all ?? null;
  const listingPriceYen = listingValue && listingValue > 0
    ? input.kind === "land" ? Math.round(listingValue * input.areaSqm / 100_000) * 100_000 : listingValue
    : null;
  const tolerance = input.kind === "land" ? 0.15 : official.sampleCount >= 20 ? 0.18 : 0.22;
  const fairLowYen = Math.round(officialPriceYen * (1 - tolerance) / 100_000) * 100_000;
  const fairHighYen = Math.round(officialPriceYen * (1 + tolerance) / 100_000) * 100_000;
  return {
    kind: input.kind, market: `${market.region}${market.district}`, areaBand: bandLabel[areaBand] || areaBand,
    officialPriceYen, officialSqmPriceYen,
    officialSampleCount: ageSnapshot?.sampleCount ?? (districtAgeSqmPrice ? districtAgeSampleCount : official.sampleCount),
    officialPeriod: `${official.periodStart}～${official.periodEnd}`, officialSourceUrl: official.sourceUrl,
    ageControlled: Boolean(ageSnapshot || districtAgeSqmPrice), listingPriceYen,
    listingPeriod: listingPriceYen ? atHomeSpecialSaleSnapshotMeta.capturedAt : null,
    listingSourceUrl: listingPriceYen ? listing?.sourceUrl || null : null,
    saleVsOfficialPercent: Math.round((input.salePriceYen / officialPriceYen - 1) * 1000) / 10,
    saleVsListingPercent: listingPriceYen ? Math.round((input.salePriceYen / listingPriceYen - 1) * 1000) / 10 : null,
    fairLowYen, fairHighYen,
    verdict: input.salePriceYen < fairLowYen ? "below" : input.salePriceYen > fairHighYen ? "above" : "fair",
  };
}
