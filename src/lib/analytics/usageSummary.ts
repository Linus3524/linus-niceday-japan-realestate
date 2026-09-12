
export interface UsageSummary {
  month: string;
  total: Record<string, number>;
  daily: Record<string, Record<string, number>>;
  geo: Record<string, Record<string, number>>;
  views: Record<string, number>;
  sources: Record<string, number>;
  actions: Record<string, number>;
  /**
   * 與前台首頁「VISITORS」共用同一個 visitorId、同一套去重邏輯算出來的
   * 本月／累計訪客數（見 src/lib/visitorCounter.ts）。null 代表訪客計數器
   * 沒有設定（缺 Upstash 環境變數），不是「這個月是 0 人」。
   */
  monthlyVisitors: number | null;
  cumulativeVisitors: number | null;
}


export const ADMIN_METRICS_START_MONTH = "2026-08";


export function monthOptions(now = new Date()) {
  const options: string[] = [];
  const tokyo = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const currentOrdinal = tokyo.getUTCFullYear() * 12 + tokyo.getUTCMonth();
  const [startYear, startMonth] = ADMIN_METRICS_START_MONTH.split("-").map(Number);
  const startOrdinal = startYear * 12 + startMonth - 1;
  for (let ordinal = currentOrdinal; ordinal >= startOrdinal; ordinal -= 1) {
    const year = Math.floor(ordinal / 12);
    const month = ordinal % 12 + 1;
    options.push(`${year}-${String(month).padStart(2, "0")}`);
  }
  return options.length ? options : [ADMIN_METRICS_START_MONTH];
}


/** 把 { "17": { chat: 3 } } 轉成依日期排序、且補齊功能欄位的表格列。 */
export function dailyRows(daily: UsageSummary["daily"], features: string[]) {
  return Object.keys(daily)
    .sort((a, b) => Number(b) - Number(a))
    .map(day => ({
      day,
      counts: features.map(feature => daily[day]?.[feature] ?? 0),
      sum: features.reduce((acc, feature) => acc + (daily[day]?.[feature] ?? 0), 0),
    }));
}


/** 功能卡片必須跟月份選單同步；跨月累計只留在頁尾作為補充資訊。 */
export function monthlyFeatureTotals(daily: UsageSummary["daily"]) {
  const totals: Record<string, number> = {};
  for (const counts of Object.values(daily)) {
    for (const [feature, count] of Object.entries(counts)) {
      totals[feature] = (totals[feature] ?? 0) + (Number(count) || 0);
    }
  }
  return totals;
}
