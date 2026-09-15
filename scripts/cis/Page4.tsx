import React from "react";
import { Page, Text, View } from "@react-pdf/renderer";
import { COLOR, s } from "./styles";

export const Page4: React.FC = () => (
  <Page size="A4" style={s.page}>
    <View style={s.topBar} />
    <View style={s.headerRow}>
      <Text style={s.headerBrand}>LINUS 好日不動產</Text>
      <Text style={s.headerDocTitle}>品牌 CIS 規範與 UI 視覺系統手冊 v2.0 ｜ 第 4 頁 / 共 6 頁</Text>
    </View>

    <Text style={s.heroTitle}>四、後台儀表板、圖表與互動狀態階梯 (Admin Dashboard)</Text>
    <Text style={s.heroSubtitle}>
      UsageDashboard 業務通道・互動組件狀態階梯・聯絡管道標籤・轉化漏斗 4 階色票體系
    </Text>

    {/* 三大業務通道 */}
    <Text style={s.sectionHeading}>1. 三大核心功能業務通道 (Feature Channels)</Text>
    <View style={s.table}>
      <View style={[s.tableRow, s.tableRowHeader]}>
        <Text style={[s.tableHeaderText, { width: "24%" }]}>功能通道 (Feature)</Text>
        <Text style={[s.tableHeaderText, { width: "26%" }]}>50底 / 200框 / 400柱 / 600字</Text>
        <Text style={[s.tableHeaderText, { width: "50%" }]}>視覺定義與儀表板角色</Text>
      </View>

      <View style={s.tableRow}>
        <Text style={[s.tableCell, { width: "24%", fontWeight: 700, color: COLOR.BRAND_GREEN }]}>物件圖紙健檢 (listing-check)</Text>
        <Text style={[s.tableCellMuted, { width: "26%" }]}>#EBF8F4 / #B4E6D5 / #00A174 / #007D5A</Text>
        <Text style={[s.tableCell, { width: "50%" }]}>核心健檢業務量、每日趨勢長條圖、物件成功分析總數</Text>
      </View>

      <View style={s.tableRow}>
        <Text style={[s.tableCell, { width: "24%", fontWeight: 700, color: COLOR.AI_TEXT }]}>AI 顧問對話 (chat)</Text>
        <Text style={[s.tableCellMuted, { width: "26%" }]}>#FAF5FF / #D8B4FE / #9333EA / #7E22CE</Text>
        <Text style={[s.tableCell, { width: "50%" }]}>智慧問答互動次數、熱門提問類別、AI 回覆滿意度（魅紫羅蘭）</Text>
      </View>

      <View style={s.tableRow}>
        <Text style={[s.tableCell, { width: "24%", fontWeight: 700, color: COLOR.INFO_TEXT }]}>AI 需求分析 (requirement-analysis)</Text>
        <Text style={[s.tableCellMuted, { width: "26%" }]}>#F0F9FF / #7DD3FC / #0284C7 / #0284C7</Text>
        <Text style={[s.tableCell, { width: "50%" }]}>自然語言評估量、租買試算次數（澄澈晴空蔚藍）</Text>
      </View>
    </View>

    {/* 互動組件狀態階梯 */}
    <Text style={s.sectionHeading}>2. 開源標準互動組件狀態階梯 (Component Interactive States)</Text>
    <View style={s.grid4}>
      <View style={[s.col, s.card]}>
        <Text style={{ fontSize: 6.8, fontWeight: 700, color: COLOR.BRAND_GREEN }}>預設態 (Default)</Text>
        <Text style={{ fontSize: 5.5, color: COLOR.INK_MUTED, marginTop: 1 }}>實心主色 / 淺底深字</Text>
        <Text style={{ fontSize: 5.2, color: COLOR.INK, marginTop: 1 }}>按鈕 #007D5A、標籤 #E6F6F1</Text>
      </View>
      <View style={[s.col, s.card]}>
        <Text style={{ fontSize: 6.8, fontWeight: 700, color: COLOR.BRAND_GREEN }}>懸停態 (Hover)</Text>
        <Text style={{ fontSize: 5.5, color: COLOR.INK_MUTED, marginTop: 1 }}>加深 10~15% 色相</Text>
        <Text style={{ fontSize: 5.2, color: COLOR.INK, marginTop: 1 }}>按鈕 #006045、卡片淡灰底</Text>
      </View>
      <View style={[s.col, s.card]}>
        <Text style={{ fontSize: 6.8, fontWeight: 700, color: COLOR.INK }}>聚焦態 (Focus / Active)</Text>
        <Text style={{ fontSize: 5.5, color: COLOR.INK_MUTED, marginTop: 1 }}>2px 硬直角外框</Text>
        <Text style={{ fontSize: 5.2, color: COLOR.INK, marginTop: 1 }}>外框 border-2 #1A2A22</Text>
      </View>
      <View style={[s.col, s.card]}>
        <Text style={{ fontSize: 6.8, fontWeight: 700, color: COLOR.INK_MUTED }}>停用態 (Disabled)</Text>
        <Text style={{ fontSize: 5.5, color: COLOR.INK_MUTED, marginTop: 1 }}>低飽和度降階</Text>
        <Text style={{ fontSize: 5.2, color: COLOR.INK_MUTED, marginTop: 1 }}>底 #F5F8F6、字 #8A9590</Text>
      </View>
    </View>

    {/* 三大聯絡管道標籤 */}
    <Text style={s.sectionHeading}>3. 客戶諮詢管道標籤色票 (Consultation Channels)</Text>
    <View style={s.grid3}>
      <View style={[s.swatchBox, { backgroundColor: "#E8F9F0", borderColor: "#B4E6D5" }]}>
        <Text style={{ fontSize: 6.8, fontWeight: 700, color: COLOR.BRAND_GREEN, marginBottom: 1 }}>LINE 官方帳號</Text>
        <Text style={{ fontSize: 5.5, color: COLOR.INK_SECONDARY }}>底 #E8F9F0 框 #B4E6D5 字 #007D5A</Text>
        <Text style={{ fontSize: 5, color: COLOR.INK_MUTED, marginTop: 1 }}>台灣與海外華人主力即時諮詢通道</Text>
      </View>

      <View style={[s.swatchBox, { backgroundColor: COLOR.AI_BG, borderColor: COLOR.AI_BORDER }]}>
        <Text style={{ fontSize: 6.8, fontWeight: 700, color: COLOR.AI_TEXT, marginBottom: 1 }}>WeChat 微信客服</Text>
        <Text style={{ fontSize: 5.5, color: COLOR.INK_SECONDARY }}>底 #FAF5FF 框 #D8B4FE 字 #7E22CE</Text>
        <Text style={{ fontSize: 5, color: COLOR.INK_MUTED, marginTop: 1 }}>港澳與大陸客戶專業買房諮詢管道</Text>
      </View>

      <View style={[s.swatchBox, { backgroundColor: COLOR.INFO_BG, borderColor: COLOR.INFO_BORDER }]}>
        <Text style={{ fontSize: 6.8, fontWeight: 700, color: COLOR.INFO_TEXT, marginBottom: 1 }}>Email 專人預約</Text>
        <Text style={{ fontSize: 5.5, color: COLOR.INK_SECONDARY }}>底 #F0F9FF 框 #7DD3FC 字 #0284C7</Text>
        <Text style={{ fontSize: 5, color: COLOR.INK_MUTED, marginTop: 1 }}>法人機構與大額投資人正式文件往返</Text>
      </View>
    </View>

    {/* 健檢轉化漏斗 4 階色票 */}
    <Text style={s.sectionHeading}>4. 健檢轉化漏斗階梯色票 (Conversion Funnel)</Text>
    <View style={s.cardDarkBorder}>
      <View style={{ flexDirection: "row", gap: 3, marginBottom: 2 }}>
        <View style={{ flex: 1, backgroundColor: COLOR.INK, padding: 3 }}>
          <Text style={{ fontSize: 6.2, fontWeight: 700, color: "#FFFFFF" }}>1. 上傳圖紙</Text>
          <Text style={{ fontSize: 5.2, color: "#DDE3DF" }}>#1A2A22 墨黑</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: COLOR.BRAND_GREEN, padding: 3 }}>
          <Text style={{ fontSize: 6.2, fontWeight: 700, color: "#FFFFFF" }}>2. 預覽確認</Text>
          <Text style={{ fontSize: 5.2, color: "#E6F6F1" }}>#007D5A 深綠</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: COLOR.BRAND_GREEN_LIGHT, padding: 3 }}>
          <Text style={{ fontSize: 6.2, fontWeight: 700, color: "#FFFFFF" }}>3. 完成分析</Text>
          <Text style={{ fontSize: 5.2, color: "#E6F6F1" }}>#00A174 亮綠</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: COLOR.INFO_BAR, padding: 3 }}>
          <Text style={{ fontSize: 6.2, fontWeight: 700, color: "#FFFFFF" }}>4. 轉化諮詢</Text>
          <Text style={{ fontSize: 5.2, color: "#F0F9FF" }}>#0284C7 天藍</Text>
        </View>
      </View>
      <Text style={{ fontSize: 5.5, color: COLOR.INK_MUTED }}>
        漏斗邏輯：由墨黑沉穩進入翡翠綠核心健檢，最終引導至澄澈天藍諮詢轉換。
      </Text>
    </View>

    <View style={s.footerRow}>
      <Text style={s.footerText}>Linus 好日不動產 ｜ CIS / UI Design System</Text>
      <Text style={s.footerText}>第 4 頁 / 共 6 頁</Text>
    </View>
  </Page>
);
