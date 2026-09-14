import { Text, View } from "@react-pdf/renderer";
import { Card } from './primitives.js';
import { AMBER_DEEP, INK, INK_MUTE, INK_SOFT, LINE_SOFT, SOFT_BG, styles } from './styles.js';
import type { ListingReportPdfProps } from './types.js';


/** 與網站地圖清單同一套分類順序與名稱（ListingLocationMap 的 CATEGORY_CONFIG） */
const CATEGORY_ORDER: Array<{ id: string; label: string }> = [
  { id: "convenience", label: "超商" },
  { id: "supermarket", label: "超市" },
  { id: "pharmacy", label: "藥妝" },
  { id: "medical", label: "醫療" },
  { id: "school", label: "學校" },
  { id: "park", label: "公園" },
  { id: "department_store", label: "百貨" },
  { id: "sports_centre", label: "運動中心" },
  { id: "fitness_centre", label: "健身房" },
  { id: "police", label: "警察局" },
  { id: "post_office", label: "郵局" },
];

export function nearestByCategory(list: Array<{ category: string; label: string; distanceMeters: number }>) {
  const order = ["convenience", "supermarket", "pharmacy", "medical", "school", "park"];
  const nearest = new Map<string, { label: string; distanceMeters: number }>();
  for (const a of list) {
    const cur = nearest.get(a.category);
    if (!cur || a.distanceMeters < cur.distanceMeters) nearest.set(a.category, a);
  }
  return order.filter(k => nearest.has(k)).map(k => nearest.get(k)!);
}

/** 網站每類只列最近 3 處，這裡照同一個口徑，不然 PDF 與畫面會對不上。 */
export function amenitiesByCategory(list: Array<{ category: string; label: string; name: string; distanceMeters: number }>) {
  const sorted = [...list].sort((a, b) => a.distanceMeters - b.distanceMeters);
  return CATEGORY_ORDER
    .map(cat => ({ ...cat, items: sorted.filter(a => a.category === cat.id).slice(0, 3) }))
    .filter(cat => cat.items.length > 0);
}

export function LocationCard({ locationContext, commute }: Pick<ListingReportPdfProps, "locationContext" | "commute">) {
  const walks = locationContext?.stationWalks ?? [];
  const amenities = locationContext?.amenities ?? [];
  if (!walks.length && !amenities.length && !commute) return null;
  const grouped = amenitiesByCategory(amenities);
  // 版面規則：每張卡 wrap={false}，塞不下就整張換到下一頁，絕不讓表格在頁面中間被切開。
  // 步行比對與生活機能清單各自成卡，兩張加起來會超過一頁，合在一張就一定會被切。
  return (
    <>
      {walks.length || commute ? (
        <Card title="位置與步行時間" tag="依圖紙地址即時查詢">
          {locationContext?.matchedAddress ? (
            <Text style={{ fontSize: 7, color: INK_MUTE, marginBottom: 4 }}>定位地址：{locationContext.matchedAddress}</Text>
          ) : null}
          {walks.length ? (
            <View style={[styles.subBlock, commute ? {} : styles.subBlockLast]}>
              <Text style={styles.sectionLabel}>步行時間比對（圖紙 80m＝1 分 vs 實際路徑）</Text>
              {walks.map((w, i) => (
                <View key={i} style={[styles.tableRow, i === walks.length - 1 ? styles.tableRowLast : {}]}>
                  <View style={{ width: "34%", paddingRight: 4 }}>
                    <Text style={{ fontSize: 7.5, fontWeight: 700 }}>
                      {w.station}駅
                      {w.source === "nearby" ? <Text style={{ fontSize: 6, fontWeight: 400, color: INK_MUTE }}>（附近補充）</Text> : null}
                    </Text>
                    {w.lineName ? <Text style={{ fontSize: 6, color: INK_MUTE, marginTop: 1 }}>{w.lineName}</Text> : null}
                  </View>
                  <Text style={[styles.tdAmount, { width: "18%" }]}>
                    {w.advertisedMinutes != null ? `圖紙 ${w.advertisedMinutes} 分` : "—"}
                  </Text>
                  <Text style={[styles.tdNote, { width: "48%" }, w.needsAttention ? { color: AMBER_DEEP } : {}]}>
                    {typeof w.distanceMeters === "number" ? `約 ${Math.round(w.distanceMeters).toLocaleString("zh-TW")}m・` : ""}
                    快走 {w.fastMinutes} 分・一般 {w.normalMinutes} 分・慢走／行李 {w.slowMinutes} 分
                    {w.needsAttention ? "（比圖紙標示明顯更遠）" : ""}
                  </Text>
                </View>
              ))}
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
      ) : null}
      {grouped.length ? (
        <Card title="1.2 公里生活機能" tag={`每類列最近 3 處・共檢索到 ${amenities.length} 處`}>
          {grouped.map((cat, ci) => (
            <View
              key={cat.id}
              style={{ flexDirection: "row", paddingVertical: 2.5, borderBottomWidth: ci === grouped.length - 1 ? 0 : 1, borderBottomColor: LINE_SOFT }}
            >
              <View style={{ width: "16%", paddingRight: 4 }}>
                <Text style={{ fontSize: 6.5, fontWeight: 700, color: INK, backgroundColor: SOFT_BG, paddingHorizontal: 3, paddingVertical: 1, alignSelf: "flex-start" }}>
                  {cat.label}
                </Text>
              </View>
              <View style={{ width: "84%" }}>
                {cat.items.map((a, ai) => (
                  <View key={ai} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: ai === cat.items.length - 1 ? 0 : 1.5 }}>
                    <Text style={{ fontSize: 7, color: INK, flex: 1, paddingRight: 6 }}>{a.name}</Text>
                    <Text style={{ fontSize: 6.5, color: INK_SOFT, width: 90, textAlign: "right" }}>
                      約 {Math.round(a.distanceMeters).toLocaleString("zh-TW")}m・步行約 {Math.ceil(a.distanceMeters / 75)} 分
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </Card>
      ) : null}
    </>
  );
}
