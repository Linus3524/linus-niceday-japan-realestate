import snapshot from "../data/prefectureCrimeCounts.json" with { type: "json" };

export interface PrefectureCrimeBreakdown {
  year: number;
  total: number;
  sourceUrl: string;
  groups: Array<{
    code: string;
    label: string;
    count: number;
    percent: number;
    items: Array<{ code: string; label: string; original: string; count: number }>;
  }>;
}

export function getPrefectureCrimeBreakdown(prefecture: string, fiscalYear: string): PrefectureCrimeBreakdown | null {
  // Never pair a newly refreshed rate snapshot with counts from a different year.
  if (Number(fiscalYear.match(/\d{4}/)?.[0]) !== snapshot.year) return null;
  const row = (snapshot.prefectures as Record<string, { total: number; counts: Record<string, number> }>)[prefecture];
  if (!row) return null;
  return {
    year: snapshot.year,
    total: row.total,
    sourceUrl: snapshot.sourceUrl,
    groups: snapshot.groups.map(group => ({
      code: group.code, label: group.label, count: row.counts[group.code],
      percent: row.total ? row.counts[group.code] / row.total * 100 : 0,
      items: group.items.map(item => ({ ...item, count: row.counts[item.code] })),
    })),
  };
}
