import type { RequestedRentRange } from './types.js';

export type SizeRoomType = "r1" | "k1" | "ldk1" | "ldk2" | "ldk3";

const LADDER: SizeRoomType[] = ["r1", "k1", "ldk1", "ldk2", "ldk3"];

const LABEL: Record<SizeRoomType, string> = {
  r1: "1R",
  k1: "1K",
  ldk1: "1LDK",
  ldk2: "2LDK",
  ldk3: "3LDK",
};

/**
 * 各格局群組在東京圈刊登物件中常見的專有面積（㎡）。
 * At Home 的格局群組是合併分桶（ldk1 含 2K／2DK、ldk2 含 3K／3DK），
 * 所以這裡取的是整個群組的代表面積，不是單一格局的平均。
 */
export const TYPICAL_AREA_SQM: Record<SizeRoomType, number> = {
  r1: 18,
  k1: 24,
  ldk1: 38,
  ldk2: 52,
  ldk3: 68,
};

/**
 * 面積偏離同格局代表面積超過這個比例，就不再用格局行情當基準。
 * ±25% 以內交給 rentalPrice 原本的面積加成分級處理；超過時（例如 55㎡ 的 1LDK）
 * 格局行情已經對應不到這間房的實際規模，固定上限 +10% 的加成會系統性誤判成偏貴。
 */
const OVERSIZE_RATIO = 1.25;
const UNDERSIZE_RATIO = 0.8;

/**
 * 房間數比同面積的一般格局少（大 1LDK 對比 2LDK）時的格局折讓。
 * 少一間房對家庭較不好用，但大客廳對單身／雙人反而加分，所以只做小幅修正。
 */
const FEWER_ROOMS_DISCOUNT = 0.04;

/** 超出格局階梯兩端時，面積每多 1% 租金只跟著多這個比例（大坪數單價遞減）。 */
const EDGE_ELASTICITY = 0.6;

export interface RentSizeAdjustment {
  areaSqm: number;
  layoutLabel: string;
  layoutTypicalAreaSqm: number;
  layoutMedian: number;
  /** 依面積換算後最接近的格局規模，例如「約 2LDK 規模」 */
  equivalentLabel: string;
  layoutAdjustPercent: number;
  direction: "oversize" | "undersize";
}

function interpolate(areaSqm: number, ranges: Map<SizeRoomType, RequestedRentRange>) {
  const points = LADDER
    .filter(rt => ranges.has(rt))
    .map(rt => ({ rt, area: TYPICAL_AREA_SQM[rt], range: ranges.get(rt)! }));
  if (points.length < 2) return null;

  const pick = (key: "low" | "median" | "high") => {
    const first = points[0];
    const last = points[points.length - 1];
    if (areaSqm <= first.area) {
      return first.range[key] * (1 + EDGE_ELASTICITY * (areaSqm / first.area - 1));
    }
    if (areaSqm >= last.area) {
      return last.range[key] * (1 + EDGE_ELASTICITY * (areaSqm / last.area - 1));
    }
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      if (areaSqm >= a.area && areaSqm <= b.area) {
        const t = (areaSqm - a.area) / (b.area - a.area);
        return a.range[key] + t * (b.range[key] - a.range[key]);
      }
    }
    return last.range[key];
  };

  return { low: pick("low"), median: pick("median"), high: pick("high") };
}

function nearestLayout(areaSqm: number): SizeRoomType {
  return LADDER.reduce((best, rt) =>
    Math.abs(TYPICAL_AREA_SQM[rt] - areaSqm) < Math.abs(TYPICAL_AREA_SQM[best] - areaSqm) ? rt : best
  );
}

/**
 * 面積明顯偏離格局代表面積時，改用「面積相當的規模」換算行情。
 * 回傳 null 代表不需換算（面積在正常範圍、資料不足，或格局不在階梯上）。
 */
export function buildSizeEquivalentRange(
  roomType: string | null | undefined,
  areaSqm: number | null | undefined,
  layoutRange: RequestedRentRange | null,
  rangeFor: (roomType: SizeRoomType) => RequestedRentRange | null
): { range: RequestedRentRange; adjustment: RentSizeAdjustment } | null {
  if (!layoutRange || !roomType || !areaSqm || areaSqm <= 0) return null;
  if (!(LADDER as string[]).includes(roomType)) return null;
  const rt = roomType as SizeRoomType;
  const typical = TYPICAL_AREA_SQM[rt];
  const ratio = areaSqm / typical;
  const direction = ratio >= OVERSIZE_RATIO ? "oversize" : ratio <= UNDERSIZE_RATIO ? "undersize" : null;
  if (!direction) return null;

  const ranges = new Map<SizeRoomType, RequestedRentRange>([[rt, layoutRange]]);
  for (const other of LADDER) {
    if (other === rt) continue;
    const r = other === "r1" ? null : rangeFor(other); // 1R 與 1K 規模接近，只用 1K 當階梯起點較穩定
    if (r) ranges.set(other, r);
  }
  const raw = interpolate(areaSqm, ranges);
  if (!raw) return null;

  const factor = direction === "oversize" ? 1 - FEWER_ROOMS_DISCOUNT : 1;
  let low = raw.low * factor;
  let median = raw.median * factor;
  let high = raw.high * factor;

  // 行情資料偶有倒掛（大格局反而較便宜），換算結果不可與面積方向相反
  if (direction === "oversize" && median < layoutRange.median) {
    low = layoutRange.low; median = layoutRange.median; high = layoutRange.high;
  }
  if (direction === "undersize" && median > layoutRange.median) {
    low = layoutRange.low; median = layoutRange.median; high = layoutRange.high;
  }

  const round = (n: number) => Math.round(n / 1000) * 1000;
  const equivalent = nearestLayout(areaSqm);
  const adjustment: RentSizeAdjustment = {
    areaSqm,
    layoutLabel: LABEL[rt],
    layoutTypicalAreaSqm: typical,
    layoutMedian: layoutRange.median,
    equivalentLabel: equivalent === rt ? LABEL[rt] : `約 ${LABEL[equivalent]} 規模`,
    layoutAdjustPercent: direction === "oversize" ? -FEWER_ROOMS_DISCOUNT * 100 : 0,
    direction,
  };

  return {
    range: {
      ...layoutRange,
      low: round(low),
      median: round(median),
      high: round(high),
      basis: `${layoutRange.basis}・依 ${areaSqm}㎡ 面積換算`,
      segments: layoutRange.segments.length === 1
        ? [{ ...layoutRange.segments[0], low: round(low), median: round(median), high: round(high) }]
        : layoutRange.segments,
      sizeAdjustment: adjustment,
    },
    adjustment,
  };
}
