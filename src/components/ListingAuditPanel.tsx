import type { ListingAudit } from "../lib/listingAudit";

/** 前台只解釋受影響的結果；完整核對紀錄留在分析資料，不作一般使用者報表。 */
export function ListingAuditPanel({ audit }: { audit: ListingAudit }) {
  if (!audit.blocksComparison) return null;
  const reasons: Record<string, string> = {
    "missing-price": "圖紙價格未能確認，暫不比較行情。",
    "price-version-conflict": "圖紙的新舊價格記載不一致，確認有效價格後才能比較行情。",
    "missing-area": "圖紙面積未能確認，暫不計算面積單價與比較行情。",
    "floor-area-conflict": "各樓層面積與總面積不一致，確認面積後才能比較行情。",
    "buildingArea-unit-conflict": "建物的平方米與坪數記載不一致，確認面積後才能比較行情。",
    "landArea-unit-conflict": "土地的平方米與坪數記載不一致，確認面積後才能比較行情。",
    "missing-managementFee": "共益費尚未確認，目前費用試算未包含這筆費用，暫不比較行情。",
    "missing-kind": "物件類型尚未確認，暫不套用公寓行情。",
  };
  const messages = [...new Set(audit.issues.map(i => reasons[i.code]).filter(Boolean))];
  return <section aria-label="影響試算的事項" className="border border-[#EAB879] bg-[#FFF8E9] px-4 py-3 text-xs leading-relaxed text-[#76511F]">
    {messages.length ? messages.map(message => <p key={message}>{message}</p>) : <p>關鍵資料尚未確認，暫不比較行情。</p>}
  </section>;
}
