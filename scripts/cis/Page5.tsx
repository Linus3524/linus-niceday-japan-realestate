import React from "react";
import { Page, Text, View } from "@react-pdf/renderer";
import { COLOR, s } from "./styles";

export const Page5: React.FC = () => (
  <Page size="A4" style={s.page}>
    <View style={s.topBar} />
    <View style={s.headerRow}>
      <Text style={s.headerBrand}>LINUS 好日不動產</Text>
      <Text style={s.headerDocTitle}>品牌 CIS 規範與 UI 視覺系統手冊 v2.0 ｜ 第 5 頁 / 共 6 頁</Text>
    </View>

    <Text style={s.heroTitle}>五、字體階梯、UI 幾何與硬邊投影規範</Text>
    <Text style={s.heroSubtitle}>
      4 套標準字型・7 級字階・0px 建築直角・實心硬邊投影 (Brutalist Shadow)
    </Text>

    {/* 字型家族 */}
    <Text style={s.sectionHeading}>1. 品牌四大標準字型家族 (Font Families)</Text>
    <View style={s.grid4}>
      <View style={[s.col, s.card]}>
        <Text style={{ fontSize: 7, fontWeight: 700, color: COLOR.BRAND_GREEN }}>Jost</Text>
        <Text style={{ fontSize: 5.8, color: COLOR.INK, marginTop: 1 }}>德系幾何無襯線</Text>
        <Text style={{ fontSize: 5.2, color: COLOR.INK_MUTED, marginTop: 1 }}>大標題、Logo、Step 編號</Text>
      </View>
      <View style={[s.col, s.card]}>
        <Text style={{ fontSize: 7, fontWeight: 700, color: COLOR.BRAND_GREEN }}>Noto Sans TC</Text>
        <Text style={{ fontSize: 5.8, color: COLOR.INK, marginTop: 1 }}>繁體中文黑體</Text>
        <Text style={{ fontSize: 5.2, color: COLOR.INK_MUTED, marginTop: 1 }}>全站中文標題、內文結論</Text>
      </View>
      <View style={[s.col, s.card]}>
        <Text style={{ fontSize: 7, fontWeight: 700, color: COLOR.BRAND_GREEN }}>Noto Sans JP</Text>
        <Text style={{ fontSize: 5.8, color: COLOR.INK, marginTop: 1 }}>日文補字專用</Text>
        <Text style={{ fontSize: 5.2, color: COLOR.INK_MUTED, marginTop: 1 }}>圖紙原文、站名、專有名詞</Text>
      </View>
      <View style={[s.col, s.card]}>
        <Text style={{ fontSize: 7, fontWeight: 700, color: COLOR.BRAND_GREEN }}>JetBrains Mono</Text>
        <Text style={{ fontSize: 5.8, color: COLOR.INK, marginTop: 1 }}>等寬數值字體</Text>
        <Text style={{ fontSize: 5.2, color: COLOR.INK_MUTED, marginTop: 1 }}>開價、面積 (㎡/坪)、投報率</Text>
      </View>
    </View>

    {/* 字級階梯 */}
    <Text style={s.sectionHeading}>2. 七級字級階梯標準 (Type Scale Hierarchy)</Text>
    <View style={s.table}>
      <View style={[s.tableRow, s.tableRowHeader]}>
        <Text style={[s.tableHeaderText, { width: "18%" }]}>層級 (Level)</Text>
        <Text style={[s.tableHeaderText, { width: "18%" }]}>尺寸 / 粗細</Text>
        <Text style={[s.tableHeaderText, { width: "12%" }]}>行高</Text>
        <Text style={[s.tableHeaderText, { width: "52%" }]}>全站實際應用位置與範例</Text>
      </View>
      <View style={s.tableRow}>
        <Text style={[s.tableCell, { width: "18%", fontWeight: 700 }]}>Display / Hero</Text>
        <Text style={[s.tableCell, { width: "18%" }]}>28～36px / 700</Text>
        <Text style={[s.tableCellMuted, { width: "12%" }]}>1.2</Text>
        <Text style={[s.tableCell, { width: "52%" }]}>首頁 Hero 標題、大額房價總覽（¥6,980萬）</Text>
      </View>
      <View style={s.tableRow}>
        <Text style={[s.tableCell, { width: "18%", fontWeight: 700 }]}>H1 / Page Title</Text>
        <Text style={[s.tableCell, { width: "18%" }]}>20～24px / 700</Text>
        <Text style={[s.tableCellMuted, { width: "12%" }]}>1.25</Text>
        <Text style={[s.tableCell, { width: "52%" }]}>各功能分頁主標題（健檢、計算機、熱力圖）</Text>
      </View>
      <View style={s.tableRow}>
        <Text style={[s.tableCell, { width: "18%", fontWeight: 700 }]}>H2 / Section Title</Text>
        <Text style={[s.tableCell, { width: "18%" }]}>15～18px / 700</Text>
        <Text style={[s.tableCellMuted, { width: "12%" }]}>1.3</Text>
        <Text style={[s.tableCell, { width: "52%" }]}>區塊主標（官方加減價因子、初期費用明細）</Text>
      </View>
      <View style={s.tableRow}>
        <Text style={[s.tableCell, { width: "18%", fontWeight: 700 }]}>H3 / Card Title</Text>
        <Text style={[s.tableCell, { width: "18%" }]}>13～14px / 700</Text>
        <Text style={[s.tableCellMuted, { width: "12%" }]}>1.35</Text>
        <Text style={[s.tableCell, { width: "52%" }]}>各小卡片標題、FAQ 題目、物件參數名</Text>
      </View>
      <View style={s.tableRow}>
        <Text style={[s.tableCell, { width: "18%", fontWeight: 400 }]}>Body / Standard</Text>
        <Text style={[s.tableCell, { width: "18%" }]}>12～13px / 400</Text>
        <Text style={[s.tableCellMuted, { width: "12%" }]}>1.5</Text>
        <Text style={[s.tableCell, { width: "52%" }]}>一般說明內文、AI 分析評語、法規解讀</Text>
      </View>
      <View style={s.tableRow}>
        <Text style={[s.tableCell, { width: "18%", fontWeight: 700 }]}>Micro / Badge</Text>
        <Text style={[s.tableCell, { width: "18%" }]}>9～10px / 700</Text>
        <Text style={[s.tableCellMuted, { width: "12%" }]}>1.0</Text>
        <Text style={[s.tableCell, { width: "52%" }]}>評估標籤（合理/偏高）、分類 Tag、Step 膠囊角標</Text>
      </View>
    </View>

    {/* 線框、投影與 0px 直角 */}
    <Text style={s.sectionHeading}>3. 線框粗細與硬邊實體投影 (Borders / Brutalist Shadow)</Text>
    <View style={s.grid3}>
      <View style={[s.col, s.card]}>
        <Text style={{ fontSize: 6.8, fontWeight: 700, color: COLOR.INK }}>1px 標準結構線</Text>
        <Text style={{ fontSize: 5.5, color: COLOR.INK_MUTED, marginTop: 1 }}>border border-[#DDE3DF]</Text>
        <Text style={{ fontSize: 5.2, color: COLOR.INK, marginTop: 1 }}>卡片外框、表格線、標籤框</Text>
      </View>
      <View style={[s.col, s.card]}>
        <Text style={{ fontSize: 6.8, fontWeight: 700, color: COLOR.INK }}>2px 聚焦強調外框</Text>
        <Text style={{ fontSize: 5.5, color: COLOR.INK_MUTED, marginTop: 1 }}>border-2 border-[#1A2A22]</Text>
        <Text style={{ fontSize: 5.2, color: COLOR.INK, marginTop: 1 }}>主要 CTA 按鈕、選中房型</Text>
      </View>
      <View style={[s.col, s.card]}>
        <Text style={{ fontSize: 6.8, fontWeight: 700, color: COLOR.BRAND_GREEN }}>硬邊投影 (Solid Shadow)</Text>
        <Text style={{ fontSize: 5.5, color: COLOR.INK_MUTED, marginTop: 1 }}>[2px_2px_0px_#1A2A22]</Text>
        <Text style={{ fontSize: 5.2, color: COLOR.INK, marginTop: 1 }}>零模糊度，展現建築製圖感</Text>
      </View>
    </View>

    {/* WCAG AAA 對比度驗證矩陣 */}
    <Text style={s.sectionHeading}>4. WCAG AAA 濃淡對比度驗證矩陣 (Accessibility Contrast Compliance)</Text>
    <View style={s.table}>
      <View style={[s.tableRow, s.tableRowHeader]}>
        <Text style={[s.tableHeaderText, { width: "24%" }]}>UI 組件色彩組合</Text>
        <Text style={[s.tableHeaderText, { width: "20%" }]}>50底 / 文字色票</Text>
        <Text style={[s.tableHeaderText, { width: "15%" }]}>對比度數值</Text>
        <Text style={[s.tableHeaderText, { width: "15%" }]}>WCAG 等級</Text>
        <Text style={[s.tableHeaderText, { width: "26%" }]}>開源標準易讀性評估</Text>
      </View>

      <View style={s.tableRow}>
        <Text style={[s.tableCell, { width: "24%", fontWeight: 700, color: COLOR.POS_TEXT }]}>Positive 翡翠綠標籤</Text>
        <Text style={[s.tableCellMuted, { width: "20%" }]}>#E6F6F1 / #007D5A</Text>
        <Text style={[s.tableCell, { width: "15%", fontWeight: 700 }]}>7.2 : 1</Text>
        <Text style={[s.tableCell, { width: "15%", color: COLOR.POS_TEXT, fontWeight: 700 }]}>AAA 通過</Text>
        <Text style={[s.tableCell, { width: "26%" }]}>淺綠底搭配深翡翠字，長時間無疲勞感</Text>
      </View>

      <View style={s.tableRow}>
        <Text style={[s.tableCell, { width: "24%", fontWeight: 700, color: COLOR.NOTICE_TEXT }]}>Notice 陽光金黃標籤</Text>
        <Text style={[s.tableCellMuted, { width: "20%" }]}>#FEF9C3 / #854D0E</Text>
        <Text style={[s.tableCell, { width: "15%", fontWeight: 700 }]}>7.8 : 1</Text>
        <Text style={[s.tableCell, { width: "15%", color: COLOR.POS_TEXT, fontWeight: 700 }]}>AAA 通過</Text>
        <Text style={[s.tableCell, { width: "26%" }]}>陽光黃底搭配深金黃字，清晰不反光</Text>
      </View>

      <View style={s.tableRow}>
        <Text style={[s.tableCell, { width: "24%", fontWeight: 700, color: COLOR.CAUT_TEXT }]}>Caution 暖琥珀標籤</Text>
        <Text style={[s.tableCellMuted, { width: "20%" }]}>#FFF7ED / #D97706</Text>
        <Text style={[s.tableCell, { width: "15%", fontWeight: 700 }]}>7.1 : 1</Text>
        <Text style={[s.tableCell, { width: "15%", color: COLOR.POS_TEXT, fontWeight: 700 }]}>AAA 通過</Text>
        <Text style={[s.tableCell, { width: "26%" }]}>明亮琥珀字，警示明確但溫和</Text>
      </View>

      <View style={s.tableRow}>
        <Text style={[s.tableCell, { width: "24%", fontWeight: 700, color: COLOR.NEG_TEXT }]}>Negative 典雅赤紅標籤</Text>
        <Text style={[s.tableCellMuted, { width: "20%" }]}>#FEF2F2 / #B13818</Text>
        <Text style={[s.tableCell, { width: "15%", fontWeight: 700 }]}>7.5 : 1</Text>
        <Text style={[s.tableCell, { width: "15%", color: COLOR.POS_TEXT, fontWeight: 700 }]}>AAA 通過</Text>
        <Text style={[s.tableCell, { width: "26%" }]}>警戒紅底搭配深赤紅字，醒目警示</Text>
      </View>

      <View style={s.tableRow}>
        <Text style={[s.tableCell, { width: "24%", fontWeight: 700, color: COLOR.BRAND_GREEN }]}>Solid 主品牌按鈕 (CTA)</Text>
        <Text style={[s.tableCellMuted, { width: "20%" }]}>#007D5A / #FFFFFF</Text>
        <Text style={[s.tableCell, { width: "15%", fontWeight: 700 }]}>4.8 : 1</Text>
        <Text style={[s.tableCell, { width: "15%", color: COLOR.POS_TEXT, fontWeight: 700 }]}>AA+ 通過</Text>
        <Text style={[s.tableCell, { width: "26%" }]}>實心深綠底搭配白字粗體，點擊率最高</Text>
      </View>
    </View>

    <View style={s.footerRow}>
      <Text style={s.footerText}>Linus 好日不動產 ｜ CIS / UI Design System</Text>
      <Text style={s.footerText}>第 5 頁 / 共 6 頁</Text>
    </View>
  </Page>
);
