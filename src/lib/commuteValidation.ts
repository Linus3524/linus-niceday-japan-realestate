/** 異常值只要求核對，不把長距離硬改成較短的步行時間。 */
export function originWalkIssue(minutes: unknown, advertisedMinutes?: unknown): string | null {
  if (typeof minutes !== "number" || !Number.isFinite(minutes) || minutes <= 0 || minutes > 120) {
    return "尚未取得可靠的出門步行時間，請先重新取得物件位置與車站資料。";
  }
  const advertised = typeof advertisedMinutes === "number" && Number.isFinite(advertisedMinutes)
    && advertisedMinutes > 0 && advertisedMinutes <= 120 ? advertisedMinutes : null;
  if (advertised !== null) {
    const ratio = Math.max(minutes, advertised) / Math.min(minutes, advertised);
    if (Math.abs(minutes - advertised) >= 10 && ratio >= 3) {
      return `出門步行估算 ${minutes} 分鐘，與圖紙標示 ${advertised} 分鐘差距過大。請核對圖紙站名與物件定位後重新分析，暫不計算門到門總時間。`;
    }
  } else if (minutes > 45) {
    return `出門步行估算 ${minutes} 分鐘，且沒有圖紙步行時間可核對。請確認物件位置與起站後重新分析。`;
  }
  return null;
}
