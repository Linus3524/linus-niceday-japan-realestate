import { Text, View } from "@react-pdf/renderer";
import { Card } from './primitives.js';
import { AMBER_DEEP, INK_MUTE, INK_SOFT, styles } from './styles.js';
import type { ListingReportPdfProps } from './types.js';


export function nearestByCategory(list: Array<{ category: string; label: string; distanceMeters: number }>) {
  const order = ["convenience", "supermarket", "pharmacy", "medical", "school", "park"];
  const nearest = new Map<string, { label: string; distanceMeters: number }>();
  for (const a of list) {
    const cur = nearest.get(a.category);
    if (!cur || a.distanceMeters < cur.distanceMeters) nearest.set(a.category, a);
  }
  return order.filter(k => nearest.has(k)).map(k => nearest.get(k)!);
}

export function LocationCard({ locationContext, commute }: Pick<ListingReportPdfProps, "locationContext" | "commute">) {
  const walks = locationContext?.stationWalks ?? [];
  const amenities = locationContext?.amenities ?? [];
  if (!walks.length && !amenities.length && !commute) return null;
  return (
    <Card title="位置與生活機能" tag="依圖紙地址即時查詢">
      {locationContext?.matchedAddress ? (
        <Text style={{ fontSize: 7, color: INK_MUTE, marginBottom: 4 }}>定位地址：{locationContext.matchedAddress}</Text>
      ) : null}
      {walks.length ? (
        <View style={styles.subBlock}>
          <Text style={styles.sectionLabel}>步行時間比對（圖紙 80m＝1 分 vs 實際路徑）</Text>
          {walks.map((w, i) => (
            <View key={i} style={[styles.tableRow, i === walks.length - 1 ? styles.tableRowLast : {}]}>
              <Text style={[styles.tdName, { width: "26%" }]}>{w.station}駅</Text>
              <Text style={[styles.tdAmount, { width: "18%" }]}>{w.advertisedMinutes != null ? `圖紙 ${w.advertisedMinutes} 分` : "—"}</Text>
              <Text style={[styles.tdNote, { width: "56%" }, w.needsAttention ? { color: AMBER_DEEP } : {}]}>
                快走 {w.fastMinutes} 分・一般 {w.normalMinutes} 分・慢走／行李 {w.slowMinutes} 分
                {w.needsAttention ? "（比圖紙標示明顯更遠）" : ""}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      {amenities.length ? (
        <View style={[styles.subBlock, commute ? {} : styles.subBlockLast]}>
          <Text style={styles.sectionLabel}>1.2 公里內最近的生活機能（共檢索到 {amenities.length} 處）</Text>
          <Text style={{ fontSize: 7.5, lineHeight: 1.4 }}>
            {nearestByCategory(amenities).map(a => `${a.label} ${Math.round(a.distanceMeters)}m`).join("　・　")}
          </Text>
        </View>
      ) : null}
      {commute ? (
        <View style={[styles.subBlock, styles.subBlockLast]}>
          <Text style={styles.sectionLabel}>我的實際通勤試算</Text>
          <Text style={{ fontSize: 7.5 }}>
            {commute.destination ? `到「${commute.destination}」` : ""}
            {typeof commute.totalMinutes === "number" ? `約 ${commute.totalMinutes} 分鐘` : ""}
            {typeof commute.transfers === "number" ? `・轉乘 ${commute.transfers} 次` : ""}
          </Text>
          {commute.summary ? <Text style={{ fontSize: 7, color: INK_SOFT, marginTop: 1.5, lineHeight: 1.3 }}>{commute.summary}</Text> : null}
        </View>
      ) : null}
    </Card>
  );
}
