import type { ListingLocationContext } from '../listingLocation.js';
import type { ListingReportModel } from './reportModel.js';

export function buildSaleMarketPresentation({ effectiveMlitComparison, saleAnalysis, locationContext, extracted }: Pick<ListingReportModel, 'saleAnalysis' | 'extracted'> & { effectiveMlitComparison: NonNullable<ListingReportModel['effectiveMlitComparison']>; locationContext: ListingLocationContext | null }) {
  const c = effectiveMlitComparison;
  const priceMan = typeof saleAnalysis?.salePriceMan === "number" ? saleAnalysis.salePriceMan : 0;
  const man = (v: number | null | undefined) =>
    v == null || isNaN(v) ? null : Math.round(v).toLocaleString();
  // 單位一律用日本慣用的 ㎡：這張卡的成交換算公式本來就是「萬/㎡ × ㎡」，
  // 上方三欄卻寫每坪，同一張卡出現兩種單位，讀者無法直接對照。
  const sqmOf = (totalMan: number | null) =>
    totalMan == null || !saleAnalysis?.areaSqm
      ? null
      : (totalMan / saleAnalysis.areaSqm).toFixed(1);

  // 車站熱門度／路線多寡屬於「同區內這一戶比區域平均好在哪」，
  // 區域層級的條件已內含在成交基準裡，不該再乘一次係數；
  // 但用具體事實（可利用幾站、各幾分）解釋價差，比一個估出來的百分比有說服力。
  // 周邊機能同樣屬於「同區內這一戶比區域平均好在哪」：
  // 區域層級已含在成交基準裡，但門口有沒有超商、醫院多遠，
  // 同一個行政區內差異很大，是解釋價差時的具體材料。
  // 這份資料由 /api/listing-location 非同步取得，可能還沒回來，要容許缺席。
  const amenityHighlights = (() => {
    const list = locationContext?.amenities ?? [];
    if (!list.length) return [];
    const order = ["convenience", "supermarket", "pharmacy", "medical", "school", "park"];
    const nearest = new Map<string, { label: string; distanceMeters: number }>();
    for (const a of list) {
      const cur = nearest.get(a.category);
      if (!cur || a.distanceMeters < cur.distanceMeters) {
        nearest.set(a.category, { label: a.label, distanceMeters: a.distanceMeters });
      }
    }
    return order
      .filter(k => nearest.has(k))
      .map(k => ({ category: k, ...nearest.get(k)! }));
  })();

  const stationFacts = (extracted?.station || "")
    .split(/[,，]/)
    .map(v => v.trim())
    .filter(Boolean);
  const walkFacts = (extracted?.walkTime || "")
    .split(/[,，]/)
    .map(v => v.trim())
    .filter(Boolean);

  const officialMan = typeof c.areaBaselineMan === "number" && c.areaBaselineMan > 0
    ? c.areaBaselineMan
    : typeof c.medianPriceMan === "number" && c.medianPriceMan > 0 ? c.medianPriceMan : null;
  // 差距一律相對同一個基準計算，避免上方寫 +89%、下方寫 +61.2%。
  const officialDiffPercent = officialMan
    ? Math.round(((priceMan - officialMan) / officialMan) * 1000) / 10
    : null;
  const listingMan = typeof c.typicalListingPriceMan === "number" && c.typicalListingPriceMan > 0
    ? c.typicalListingPriceMan : null;
  const listingLowMan = typeof c.typicalListingPriceLowMan === "number" && c.typicalListingPriceLowMan > 0
    ? c.typicalListingPriceLowMan : null;
  const listingHighMan = typeof c.typicalListingPriceHighMan === "number" && c.typicalListingPriceHighMan > 0
    ? c.typicalListingPriceHighMan : null;
  const listingRangeText = listingLowMan && listingHighMan && listingLowMan !== listingHighMan
    ? `${listingLowMan.toLocaleString()} 〜 ${listingHighMan.toLocaleString()} 萬円`
    : null;
  const fairLow = typeof c.fairLowMan === "number" && c.fairLowMan > 0 ? c.fairLowMan : null;
  const fairHigh = typeof c.fairHighMan === "number" && c.fairHighMan > 0 ? c.fairHighMan : null;
  const hasFairRange = fairLow !== null && fairHigh !== null;

  // 價格區間軸：涵蓋區間上下限、中位與本案，兩端各留 6% 餘裕。
  const axisPoints = [officialMan, fairLow, fairHigh, priceMan]
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v) && v > 0);
  const axisLo = axisPoints.length > 0 ? Math.min(...axisPoints) : 0;
  const axisHi = axisPoints.length > 0 ? Math.max(...axisPoints) : 100;
  const span = axisHi - axisLo;
  const axisPad = span > 0 ? span * 0.06 : (axisHi > 0 ? axisHi * 0.06 : 1);
  const minBound = axisLo - axisPad;
  const maxBound = axisHi + axisPad;
  const denom = maxBound - minBound;
  const pos = (v: number) => denom > 0 ? Math.max(0, Math.min(100, ((v - minBound) / denom) * 100)) : 50;
  return { c, priceMan, man, sqmOf, amenityHighlights, stationFacts, walkFacts, officialMan, officialDiffPercent, listingMan, listingLowMan, listingHighMan, listingRangeText, fairLow, fairHigh, hasFairRange, span, pos };
}

export function layoutSalePriceMarks(pos: (value: number) => number, fairLow: number | null, fairHigh: number | null, benchmarks: Array<{ key: string; value: number; shortLabel: string; tone: string }>) {
  const edgeLo = pos(fairLow as number);
  const edgeHi = pos(fairHigh as number);
  const rawMarks = [
    { key: "lo", p: edgeLo, value: fairLow as number, label: "下限", tone: "#66736C", strong: true },
    ...benchmarks.map(b => ({ key: b.key, p: pos(b.value), value: b.value, label: b.shortLabel, tone: b.tone, strong: false })),
    { key: "hi", p: edgeHi, value: fairHigh as number, label: "上限", tone: "#66736C", strong: true },
  ].sort((a, b) => a.p - b.p);

  // 水平彈性避讓微調：讓相鄰近點在同一基準線保持安全呼吸間隔
  const marksWithLayout = rawMarks.map((m, idx) => {
    let displayP = m.p;
    if (idx > 0) {
      const prev = rawMarks[idx - 1];
      const dist = m.p - prev.p;
      if (dist > 0 && dist < 8.0) {
        const push = (8.0 - dist) * 0.35;
        displayP = Math.min(98, m.p + push);
      }
    }
    if (idx < rawMarks.length - 1) {
      const next = rawMarks[idx + 1];
      const dist = next.p - m.p;
      if (dist > 0 && dist < 8.0) {
        const push = (8.0 - dist) * 0.35;
        displayP = Math.max(2, displayP - push);
      }
    }
    return { ...m, displayP };
  });

  // 只有在實際間距小於 5.2%（文字盒邊界確實重疊）時才分列
  const rowOf: number[] = [];
  const lastPosInRow: number[] = [];
  const MIN_COLLISION_GAP = 5.2;
  marksWithLayout.forEach(m => {
    let row = 0;
    while (lastPosInRow[row] !== undefined && m.displayP - lastPosInRow[row] < MIN_COLLISION_GAP) row++;
    lastPosInRow[row] = m.displayP;
    rowOf.push(row);
  });
  const rows = Math.max(...rowOf) + 1;
  const ROW_HEIGHT = 28;
  return { marksWithLayout, rowOf, rows, ROW_HEIGHT };
}

export function buildAgeBandPriceScale(c: NonNullable<ListingReportModel['effectiveMlitComparison']>) {
  const rows = c.ageBandComparison!;
  const prices = rows.map(r => r.medianSqmPriceYen);
  const peak = Math.max(...prices);
  const floorPrice = Math.min(...prices);
  // 價位等級：最便宜的一帶固定 1 格、最貴的一帶 5 格，中間線性分配。
  const priceLevel = (value: number) => peak === floorPrice
    ? 5
    : 1 + Math.round(((value - floorPrice) / (peak - floorPrice)) * 4);
  return { rows, priceLevel };
}
