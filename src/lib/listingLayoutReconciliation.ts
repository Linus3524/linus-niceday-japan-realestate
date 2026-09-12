/**
 * Only reconcile a stated nDK against a complete, explicitly labelled room breakdown.
 * LDK alone, floor area, furniture, or an incomplete breakdown cannot establish room count.
 */
export function reconcileListingLayout<T extends { layout?: string; specialNotes?: string }>(fields: T, layoutText: string): T {
  const stated = fields.layout?.normalize("NFKC").replace(/\s+/g, "").toUpperCase();
  const dk = stated?.match(/^([1-9])DK$/);
  if (!dk) return fields;
  const lines = layoutText.normalize("NFKC").split(/\r?\n/);
  const candidates = new Set<string>();
  for (let i = 0; i < lines.length; i++) {
    if (!/間取(?:り)?詳細/.test(lines[i])) continue;
    // In vertically centred PDF table cells the value can be one row above the label.
    for (const line of lines.slice(Math.max(0, i - 1), i + 2)) {
      const detail = line.replace(/^\s*間取(?:り)?詳細\s*[:：]?\s*/, "").trim().toUpperCase();
      const roomPattern = /(?:LDK|洋室|和室)\s*\(\s*\d+(?:\.\d+)?\s*(?:畳|帖)\s*\)/g;
      const rooms = detail.match(roomPattern);
      if (!rooms || !rooms.some(room => room.startsWith("LDK"))) continue;
      // Reject extra rooms, storage annotations, prose or truncated/OCR-ambiguous text.
      if (detail.replace(roomPattern, "").replace(/[\s、,・+＋/]/g, "")) continue;
      if (rooms.filter(room => room.startsWith("LDK")).length !== 1) continue;
      const bedrooms = rooms.filter(room => /^(?:洋室|和室)/.test(room)).length;
      if (bedrooms !== Number(dk[1])) continue;
      candidates.add(detail);
    }
  }
  if (candidates.size !== 1) return fields;
  const detail = [...candidates][0];
  const layout = `${dk[1]}LDK`;
  const note = `【格局標示差異】圖紙總格局為 ${stated}，間取詳細為 ${detail}；行情比較依詳細格局採 ${layout}，正式格局請向管理方確認。`;
  return { ...fields, layout, specialNotes: [fields.specialNotes, note].filter(Boolean).join("\n") };
}
