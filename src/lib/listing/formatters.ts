
/** 快照的屋齡帶鍵（age_0_10 等）轉成畫面用的中文標籤 */
export function ageBandLabel(band: string): string {
  const m = band.match(/^age_(\d+)_(\d+|plus)$/);
  if (!m) return band;
  return m[2] === "plus" ? `築 ${m[1]} 年以上` : `築 ${m[1]}～${m[2]} 年`;
}


export function formatYen(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "—";
  return `¥${amount.toLocaleString("ja-JP")}`;
}


export function formatManagementSummary(company?: string, style?: string): string {
  const rawCompany = company?.trim() || "";
  const cleanCompany = rawCompany.replace(/[（(].*$/, "").trim();
  const inferredStyle = style?.trim() || rawCompany.match(/[（(](.*)[）)]$/)?.[1] || "";
  const cleanStyle = inferredStyle
    .replace(/[（(]\s*/g, "／")
    .replace(/\s*[）)]/g, "")
    .replace(/[\/／]+/g, "／")
    .replace(/^／|／$/g, "")
    .trim();

  return [cleanCompany, cleanStyle].filter(Boolean).join("・") || "委託管理／日勤・巡迴";
}


export function summarizeTaxEstimationBasis(basis?: string | null): string | null {
  if (!basis?.trim()) return null;
  if (/圖紙|圖面/.test(basis) && /未載明|未記載|沒有/.test(basis)) {
    return "圖紙未載明稅額，已依土地持分、面積、結構及屋齡概算。";
  }
  if (/圖紙|圖面/.test(basis) && /載明|記載|採用/.test(basis)) {
    return "稅額優先採用圖紙記載，未載項目由 AI 概算。";
  }
  return "AI 已依圖紙資訊概算稅費，實際金額以正式文件為準。";
}


export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
