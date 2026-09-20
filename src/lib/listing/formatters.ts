
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


/** 採光面朝向（向き）標準化繁體中文 */
export function formatDirection(direction?: string | null): string {
  if (!direction) return "";
  const trimmed = direction.trim();
  if (!trimmed) return "";
  if (/^[-ー—－／/]+$/.test(trimmed) || /^(?:無|なし|未定)$/.test(trimmed)) {
    return "圖紙標示 -（未載明）";
  }
  if (/^(?:未載明|未於圖[紙面]載明|不明)$/.test(trimmed)) {
    return "未於圖紙載明";
  }
  const normalized = trimmed.normalize("NFKC");
  const isEstimated = /平面圖|平面図|間取|間取り|推算|推定|推測|方位記號|方位記号|指北針|指南針/i.test(normalized);
  const noteSuffix = isEstimated ? "（依平面圖方位記號推算）" : "";

  if (/東南|南東/i.test(normalized)) return `東南向${noteSuffix}`;
  if (/西南|南西/i.test(normalized)) return `西南向${noteSuffix}`;
  if (/東北|北東/i.test(normalized)) return `東北向${noteSuffix}`;
  if (/西北|北西/i.test(normalized)) return `西北向${noteSuffix}`;
  if (/南/i.test(normalized)) return `南向${noteSuffix}`;
  if (/東/i.test(normalized)) return `東向${noteSuffix}`;
  if (/西/i.test(normalized)) return `西向${noteSuffix}`;
  if (/北/i.test(normalized)) return `北向${noteSuffix}`;
  return trimmed;
}

