import snapshot from "../data/municipalCrimeCounts.json" with { type: "json" };
import type { SafetyGrade } from "./crimeSafety.js";
import type { PrefectureCrimeBreakdown } from "./prefectureCrimeBreakdown.js";

interface RawMunicipalRecord {
  municipality: string;
  population: number;
  total: number;
  groups: Array<{
    code: string;
    label: string;
    count: number;
    items: Array<{ code: string; label: string; original: string; count: number }>;
  }>;
}

interface RawPrefectureSnapshot {
  year: number;
  sourceUrl: string;
  records: RawMunicipalRecord[];
}

export interface MunicipalCrimeItem {
  area: string;
  count: number;
  ratePerThousand: number;
  population: number;
  rank: number;
}

export interface MunicipalCrimeResult {
  municipality: string;
  prefecture: string;
  year: number;
  sourceUrl: string;
  populationYear: number;
  population: number;
  total: number;
  crimeRatePerThousand: number;
  prefectureAverageRate: number;
  vsPrefecture: number;
  rank: number;
  totalAreas: number;
  tied: number;
  grade: SafetyGrade;
  breakdown: PrefectureCrimeBreakdown | null;
  items: MunicipalCrimeItem[];
}

function gradeFromRatio(ratio: number): SafetyGrade {
  if (ratio <= 0.6) return "A+";
  if (ratio <= 0.8) return "A";
  if (ratio <= 1.0) return "B+";
  if (ratio <= 1.2) return "B";
  if (ratio <= 1.5) return "C";
  return "D";
}

function normalizeForMatch(value: string): string {
  return value.normalize("NFKC").replace(/\s+/g, "").replaceAll("ヶ", "ケ");
}

/** Match the longest supported municipality name in the analyzed address. */
export function getMunicipalCrimeResult(address: string, prefecture: string): MunicipalCrimeResult | null {
  const prefectureSnapshot = (snapshot.prefectures as Record<string, RawPrefectureSnapshot>)[prefecture];
  if (!prefectureSnapshot) return null;

  const normalizedAddress = normalizeForMatch(address);
  const record = [...prefectureSnapshot.records]
    .sort((a, b) => b.municipality.length - a.municipality.length)
    .find(item => normalizedAddress.includes(normalizeForMatch(item.municipality)));
  if (!record) return null;

  const rateFor = (item: RawMunicipalRecord) => item.population ? item.total / item.population * 1000 : 0;
  const rate = rateFor(record);
  const totalPopulation = prefectureSnapshot.records.reduce((sum, item) => sum + item.population, 0);
  const totalCases = prefectureSnapshot.records.reduce((sum, item) => sum + item.total, 0);
  const averageRate = totalPopulation ? totalCases / totalPopulation * 1000 : 0;
  const rates = prefectureSnapshot.records.map(rateFor);
  const rank = rates.filter(value => value < rate).length + 1;
  const tied = rates.filter(value => Math.abs(value - rate) < 1e-10).length;
  const items: MunicipalCrimeItem[] = prefectureSnapshot.records.map((item) => {
    const itemRate = rateFor(item);
    const itemRank = rates.filter((value) => value < itemRate).length + 1;
    return {
      area: item.municipality,
      count: item.total,
      ratePerThousand: Math.round(itemRate * 100) / 100,
      population: item.population,
      rank: itemRank,
    };
  });

  return {
    municipality: record.municipality,
    prefecture,
    year: prefectureSnapshot.year,
    sourceUrl: prefectureSnapshot.sourceUrl,
    populationYear: snapshot.populationYear,
    population: record.population,
    total: record.total,
    crimeRatePerThousand: Math.round(rate * 100) / 100,
    prefectureAverageRate: Math.round(averageRate * 100) / 100,
    vsPrefecture: averageRate ? rate / averageRate : 1,
    rank,
    totalAreas: rates.length,
    tied,
    grade: gradeFromRatio(averageRate ? rate / averageRate : 1),
    items,
    breakdown: record.groups.length ? {
      year: prefectureSnapshot.year,
      total: record.total,
      sourceUrl: prefectureSnapshot.sourceUrl,
      scopeKind: "municipality",
      scopeLabel: record.municipality,
      sourceLabel: `${prefecture}警察「市區町村別、罪種別認知件數」`,
      groups: record.groups.map(group => ({
        ...group,
        percent: record.total ? group.count / record.total * 100 : 0,
      })),
    } : null,
  };
}

export const __testing = { gradeFromRatio, normalizeForMatch, snapshot };
