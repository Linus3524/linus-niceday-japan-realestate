

/* ───────────── 格式化 ───────────── */
export const yen = (v: number | null | undefined) =>
  typeof v === "number" && Number.isFinite(v) ? `¥${Math.round(v).toLocaleString("ja-JP")}` : "—";
export const man = (v: number | null | undefined) =>
  typeof v === "number" && Number.isFinite(v) ? `${Math.round(v).toLocaleString("ja-JP")} 萬円` : "—";
export const pct = (v: number | null | undefined, digits = 1) =>
  typeof v === "number" && Number.isFinite(v) ? `${v >= 0 ? "+" : ""}${v.toFixed(digits)}%` : "—";
export const splitList = (s: unknown) => String(s || "").split(/[,，]/).map(v => v.trim()).filter(Boolean);

export function ageBandLabel(band: string): string {
  const m = band.match(/^age_(\d+)_(\d+|plus)$/);
  if (!m) return band;
  return m[2] === "plus" ? `築 ${m[1]} 年以上` : `築 ${m[1]}～${m[2]} 年`;
}
