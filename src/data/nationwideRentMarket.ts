import type { LayoutCode } from "./housingMarket.js";
import {
  atHomeNationwideRentSnapshotMeta,
  atHomeNationwideRentSnapshots,
} from "./atHomeNationwideRentSnapshot.js";

export interface NationwideRentBenchmark {
  region: string;
  district: string;
  layout: LayoutCode;
  medianRentYen: number;
  lowRentYen: number;
  highRentYen: number;
  sourceUrl: string;
  sourceLabel: string;
  capturedAt: string;
}

const normalizeMarketName = (value: string) => value
  .replace(/廣|広/g, "広").replace(/德|徳/g, "徳").replace(/靜|静/g, "静")
  .replace(/繩|縄/g, "縄").replace(/兒|児/g, "児").replace(/覇|霸/g, "霸")
  .replace(/姫|姬/g, "姬").replace(/浜|濱/g, "濱").replace(/区/g, "區")
  .replace(/沢/g, "澤").replace(/戸/g, "戶").replace(/島/g, "嶋")
  .replace(/[\s・･（）()\-]/g, "");

export function getNationwideRentBenchmark(
  region: string,
  district: string,
  layout: LayoutCode,
): NationwideRentBenchmark | null {
  const normalizedRegion = normalizeMarketName(region);
  const normalizedDistrict = normalizeMarketName(district);
  const row = atHomeNationwideRentSnapshots.find(item =>
    normalizeMarketName(item.region) === normalizedRegion && normalizeMarketName(item.district) === normalizedDistrict
  );
  const medianRentYen = row?.rents[layout] ?? null;
  if (!row || !medianRentYen || medianRentYen <= 0) return null;
  return {
    region,
    district,
    layout,
    medianRentYen,
    lowRentYen: Math.round(medianRentYen * 0.88 / 1_000) * 1_000,
    highRentYen: Math.round(medianRentYen * 1.12 / 1_000) * 1_000,
    sourceUrl: row.sourceUrl,
    sourceLabel: atHomeNationwideRentSnapshotMeta.sourceLabel,
    capturedAt: atHomeNationwideRentSnapshotMeta.capturedAt,
  };
}
