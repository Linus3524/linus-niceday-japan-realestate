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

// 市區町村名的正規化必須跟 resolveDistrictAndRegion 用同一套字元對照表。
// 先前這裡自己維護一份、少了「稲／稻」等字，resolveDistrictAndRegion 回傳的
// 「千葉市稲毛区」（來自國交省快照）對不上 At Home 快照的「千葉市稻毛區」，
// 稲毛區的租金明明有資料卻判成「查無行情」。
import { normalizeAddressText } from "../lib/server/listing/marketLocation.js";
const normalizeMarketName = (value: string) => normalizeAddressText(value.replace("（市平均）", ""));

export function getNationwideRentBenchmark(
  region: string,
  district: string,
  layout: LayoutCode,
): NationwideRentBenchmark | null {
  const normalizedRegion = normalizeMarketName(region);
  const normalizedDistrict = normalizeMarketName(district);
  const sameRegion = atHomeNationwideRentSnapshots.filter(item => normalizeMarketName(item.region) === normalizedRegion);
  // 完整同名優先；國交省快照的町村帶郡名（「川辺郡猪名川町」）而 At Home 只寫「猪名川町」，
  // 找不到時退回「以町村名結尾」的比對。
  const row = sameRegion.find(item => normalizeMarketName(item.district) === normalizedDistrict)
    ?? sameRegion.find(item => {
      const name = normalizeMarketName(item.district);
      return name.length >= 3 && normalizedDistrict.endsWith(name) && /[郡]/.test(normalizedDistrict);
    })
    ?? null;
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
