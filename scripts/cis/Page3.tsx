import React from "react";
import { Page, Text, View } from "@react-pdf/renderer";
import { COLOR, s } from "./styles";

export const Page3: React.FC = () => (
  <Page size="A4" style={s.page}>
    <View style={s.topBar} />
    <View style={s.headerRow}>
      <Text style={s.headerBrand}>LINUS 好日不動產</Text>
      <Text style={s.headerDocTitle}>品牌 CIS 規範與 UI 視覺系統手冊 v2.0 ｜ 第 3 頁 / 共 6 頁</Text>
    </View>

    <Text style={s.heroTitle}>三、前端專案全色票體系 (Frontend Palettes)</Text>
    <Text style={s.heroSubtitle}>
      東京行情熱力地圖 5 級色階＋AI 需求計算機評估結果完整收斂規範
    </Text>

    {/* 熱力地圖 5 級色階 */}
    <Text style={s.sectionHeading}>1. 行情熱力地圖五級色階 (Rent / Buy Heatmap)</Text>
    <Text style={{ fontSize: 6.2, color: COLOR.INK_SECONDARY, marginBottom: 2 }}>
      用於：RentMap.tsx 地圖瓦片、LayoutTiles 房型瓦片、AgeTimeline 屋齡遞減軸
    </Text>
    
    <View style={s.table}>
      <View style={[s.tableRow, s.tableRowHeader]}>
        <Text style={[s.tableHeaderText, { width: "15%" }]}>階梯等級</Text>
        <Text style={[s.tableHeaderText, { width: "26%" }]}>50底色 / 200邊框 / 800文字</Text>
        <Text style={[s.tableHeaderText, { width: "17%" }]}>房型 / 屋齡對應</Text>
        <Text style={[s.tableHeaderText, { width: "42%" }]}>行情區間與視覺濃淡意義</Text>
      </View>

      <View style={s.tableRow}>
        <Text style={[s.tableCell, { width: "15%", fontWeight: 700, color: COLOR.HEAT_TIER1_TEXT }]}>Tier 1 (實惠)</Text>
        <Text style={[s.tableCellMuted, { width: "26%" }]}>#DCFCE7 / #86EFAC / #15803D</Text>
        <Text style={[s.tableCell, { width: "17%" }]}>1R / 築 21-30年</Text>
        <Text style={[s.tableCell, { width: "42%" }]}>租金低於基準（柔和薄荷綠，Hover: #BBF7D0）</Text>
      </View>

      <View style={s.tableRow}>
        <Text style={[s.tableCell, { width: "15%", fontWeight: 700, color: COLOR.HEAT_TIER2_TEXT }]}>Tier 2 (中低)</Text>
        <Text style={[s.tableCellMuted, { width: "26%" }]}>#FEF9C3 / #FDE047 / #854D0E</Text>
        <Text style={[s.tableCell, { width: "17%" }]}>1K / 築 11-20年</Text>
        <Text style={[s.tableCell, { width: "42%" }]}>行情基準中位帶（明朗金黃，Hover: #FEF08A）</Text>
      </View>

      <View style={s.tableRow}>
        <Text style={[s.tableCell, { width: "15%", fontWeight: 700, color: COLOR.HEAT_TIER3_TEXT }]}>Tier 3 (中高)</Text>
        <Text style={[s.tableCellMuted, { width: "26%" }]}>#FFF7ED / #FDBA74 / #D97706</Text>
        <Text style={[s.tableCell, { width: "17%" }]}>1LDK / 築 6-10年</Text>
        <Text style={[s.tableCell, { width: "42%" }]}>適度溢價帶（清透暖橘，Hover: #FED7AA）</Text>
      </View>

      <View style={s.tableRow}>
        <Text style={[s.tableCell, { width: "15%", fontWeight: 700, color: COLOR.HEAT_TIER4_TEXT }]}>Tier 4 (高價)</Text>
        <Text style={[s.tableCellMuted, { width: "26%" }]}>#FEF2F2 / #FCA5A5 / #B13818</Text>
        <Text style={[s.tableCell, { width: "17%" }]}>2LDK / 築 5年內</Text>
        <Text style={[s.tableCell, { width: "42%" }]}>高單價熱門區（典雅赤紅，Hover: #FECACA）</Text>
      </View>

      <View style={s.tableRow}>
        <Text style={[s.tableCell, { width: "15%", fontWeight: 700, color: COLOR.NEG_TEXT }]}>Tier 5 (頂級)</Text>
        <Text style={[s.tableCellMuted, { width: "26%" }]}>#FEF2F2 / #FCA5A5 / #B13818</Text>
        <Text style={[s.tableCell, { width: "17%" }]}>3LDK+ / 都心旗艦</Text>
        <Text style={[s.tableCell, { width: "42%" }]}>最高租金帶（深層警戒赤紅，Hover: #FECACA）</Text>
      </View>
    </View>

    {/* AI 需求計算機評估結果色票 */}
    <Text style={s.sectionHeading}>2. AI 需求計算機評估結果 (Requirement Assessment)</Text>
    <View style={s.grid2}>
      <View style={[s.col, s.card]}>
        <Text style={{ fontSize: 7, fontWeight: 700, color: COLOR.INK, marginBottom: 1.5 }}>
          ✦ 總體可行性 (Overall Level)
        </Text>
        <View style={{ flexDirection: "row", gap: 2.5, marginBottom: 1.5 }}>
          <View style={[s.badge, { backgroundColor: COLOR.POS_BG, borderColor: COLOR.POS_BORDER }]}>
            <Text style={[s.badgeText, { color: COLOR.POS_TEXT }]}>可行</Text>
          </View>
          <View style={[s.badge, { backgroundColor: COLOR.CAUT_BG, borderColor: COLOR.CAUT_BORDER }]}>
            <Text style={[s.badgeText, { color: COLOR.CAUT_TEXT }]}>有條件可行</Text>
          </View>
          <View style={[s.badge, { backgroundColor: COLOR.NEG_BG, borderColor: COLOR.NEG_BORDER }]}>
            <Text style={[s.badgeText, { color: COLOR.NEG_TEXT }]}>難度高</Text>
          </View>
        </View>
        <Text style={{ fontSize: 5.5, color: COLOR.INK_MUTED }}>
          對齊 statusStyles 規範，綠・橘・紅三色清晰。
        </Text>
      </View>

      <View style={[s.col, s.card]}>
        <Text style={{ fontSize: 7, fontWeight: 700, color: COLOR.INK, marginBottom: 1.5 }}>
          ✦ 各軸向影響度 (Axis Impact)
        </Text>
        <View style={{ flexDirection: "row", gap: 2.5, marginBottom: 1.5 }}>
          <View style={[s.badge, { backgroundColor: COLOR.POS_BG, borderColor: COLOR.POS_BORDER }]}>
            <Text style={[s.badgeText, { color: COLOR.POS_TEXT }]}>容易達成</Text>
          </View>
          <View style={[s.badge, { backgroundColor: COLOR.CAUT_BG, borderColor: COLOR.CAUT_BORDER }]}>
            <Text style={[s.badgeText, { color: COLOR.CAUT_TEXT }]}>需要取捨</Text>
          </View>
          <View style={[s.badge, { backgroundColor: COLOR.NEG_BG, borderColor: COLOR.NEG_BORDER }]}>
            <Text style={[s.badgeText, { color: COLOR.NEG_TEXT }]}>較難兼顧</Text>
          </View>
        </View>
        <Text style={{ fontSize: 5.5, color: COLOR.INK_MUTED }}>
          「需要取捨」採用清爽飽滿亮琥珀橘色系。
        </Text>
      </View>
    </View>

    {/* 推薦卡片與通勤評估標籤體系 */}
    <Text style={s.sectionHeading}>3. 推薦卡片與通勤評估標籤 (Recommendation / Transit Badges)</Text>
    <View style={s.cardDarkBorder}>
      <Text style={{ fontSize: 7, fontWeight: 700, color: COLOR.BRAND_GREEN, marginBottom: 2 }}>
        ✦ 計算機推薦清單標籤規範（對齊實例卡片）
      </Text>
      <View style={s.grid4}>
        <View style={[s.col, { padding: 3, backgroundColor: COLOR.BG_MUTED, borderWidth: 1, borderColor: COLOR.BORDER_LINE }]}>
          <Text style={{ fontSize: 6.2, fontWeight: 700, color: COLOR.TAG_RECOMMEND_TEXT }}>範圍與指定</Text>
          <Text style={{ fontSize: 5.2, color: COLOR.INK, marginTop: 1 }}>指定車站／指定範圍</Text>
          <Text style={{ fontSize: 4.8, color: COLOR.INK_MUTED }}>底 #F2F8FA 框 #D6EAF0 字 #3F626D</Text>
        </View>
        <View style={[s.col, { padding: 3, backgroundColor: COLOR.BG_MUTED, borderWidth: 1, borderColor: COLOR.BORDER_LINE }]}>
          <Text style={{ fontSize: 6.2, fontWeight: 700, color: COLOR.POS_TEXT }}>預算符合度</Text>
          <Text style={{ fontSize: 5.2, color: COLOR.INK, marginTop: 1 }}>預算內(綠)／接近預算(藍)／需調整(紅)</Text>
          <Text style={{ fontSize: 4.8, color: COLOR.INK_MUTED }}>綠 #E6F6F1 / 藍 #F2F8FA / 紅 #FEF2F2</Text>
        </View>
        <View style={[s.col, { padding: 3, backgroundColor: COLOR.BG_MUTED, borderWidth: 1, borderColor: COLOR.BORDER_LINE }]}>
          <Text style={{ fontSize: 6.2, fontWeight: 700, color: COLOR.NOTICE_TEXT }}>通勤直達度</Text>
          <Text style={{ fontSize: 5.2, color: COLOR.INK, marginTop: 1 }}>直達線路(綠)／需轉乘(黃)</Text>
          <Text style={{ fontSize: 4.8, color: COLOR.INK_MUTED }}>直達 #E6F6F1 / 轉乘 #FEF9C3</Text>
        </View>
        <View style={[s.col, { padding: 3, backgroundColor: COLOR.BG_MUTED, borderWidth: 1, borderColor: COLOR.BORDER_LINE }]}>
          <Text style={{ fontSize: 6.2, fontWeight: 700, color: COLOR.INFO_TEXT }}>耗時與轉乘</Text>
          <Text style={{ fontSize: 5.2, color: COLOR.INK, marginTop: 1 }}>5分・轉乘0次 / 11分・轉乘1次</Text>
          <Text style={{ fontSize: 4.8, color: COLOR.INK_MUTED }}>達標 #E6F6F1 / 灰藍 #F2F8FA</Text>
        </View>
      </View>
    </View>

    <View style={s.footerRow}>
      <Text style={s.footerText}>Linus 好日不動產 ｜ CIS / UI Design System</Text>
      <Text style={s.footerText}>第 3 頁 / 共 6 頁</Text>
    </View>
  </Page>
);
