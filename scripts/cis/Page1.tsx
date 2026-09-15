import React from "react";
import { Page, Text, View } from "@react-pdf/renderer";
import { COLOR, s } from "./styles";

export const Page1: React.FC = () => (
  <Page size="A4" style={s.page}>
    <View style={s.topBar} />
    <View style={s.headerRow}>
      <Text style={s.headerBrand}>LINUS 好日不動產</Text>
      <Text style={s.headerDocTitle}>品牌 CIS 規範與 UI 視覺系統手冊 v2.0 ｜ 第 1 頁 / 共 6 頁</Text>
    </View>

    <Text style={s.heroTitle}>品牌視覺識別 (CIS) 與全站 UI 系統設計規範</Text>
    <Text style={s.heroSubtitle}>
      現代日式建築紙質美學・直角硬朗幾何・開源規範級多階濃淡色彩系統（涵蓋全站前端與後台）
    </Text>

    <View style={s.cardDarkBorder}>
      <Text style={{ fontSize: 8, fontWeight: 700, color: COLOR.BRAND_GREEN, marginBottom: 2 }}>
        ✦ 品牌定位與產品架構 (Brand Architecture)
      </Text>
      <Text style={{ fontSize: 6.5, color: COLOR.INK, lineHeight: 1.3, marginBottom: 2 }}>
        Linus 好日不動產是專注日本不動產（東京23區、武藏野、橫濱川崎、關西）的智慧諮詢平台。涵蓋四大前端核心功能（①買賣／租賃物件圖紙 AI 健檢 ②預算通勤推薦計算機 ③行情熱力地圖 ④不動產指南）與後台數據儀表板（Admin Usage Dashboard）。
      </Text>
      <Text style={{ fontSize: 6, color: COLOR.INK_MUTED, lineHeight: 1.25 }}>
        視覺哲學：融合日本建築圖面（建築図面）的嚴謹結構與現代科技產品的高效易讀性，建立專業、透明、俐落的品牌形象。
      </Text>
    </View>

    <Text style={s.sectionHeading}>一、全站 UI 設計四大黃金原則 (Core Principles)</Text>
    
    <View style={s.grid2}>
      <View style={[s.col, s.card]}>
        <Text style={{ fontSize: 7.2, fontWeight: 700, color: COLOR.BRAND_GREEN, marginBottom: 1.5 }}>
          1. 全面銳利直角化 (Zero Radius / 0px)
        </Text>
        <Text style={{ fontSize: 6.2, color: COLOR.INK, lineHeight: 1.25, marginBottom: 1 }}>
          全站所有按鈕、卡片、標籤、輸入框、柱狀條與 Tooltip 一律採用 0px 方角（rounded-none）。
        </Text>
        <Text style={{ fontSize: 5.5, color: COLOR.INK_MUTED }}>
          ↳ 體現日本建築製圖、榻榻米模矩與格線紙的美學，杜絕圓弧隨意感。
        </Text>
      </View>

      <View style={[s.col, s.card]}>
        <Text style={{ fontSize: 7.2, fontWeight: 700, color: COLOR.BRAND_GREEN, marginBottom: 1.5 }}>
          2. 零混濁色調淘汰 (Zero Muddy Tones)
        </Text>
        <Text style={{ fontSize: 6.2, color: COLOR.INK, lineHeight: 1.25, marginBottom: 1 }}>
          全面淘汰土黃（#D7A64A）、暗褐（#7A5A1F）、泥黃紙底（#FFF9ED）等髒色。
        </Text>
        <Text style={{ fontSize: 5.5, color: COLOR.INK_MUTED }}>
          ↳ Caution 回歸清亮飽滿「亮琥珀橘」，Negative 採用鮮明「警戒赤紅」，告別暗濁雜質。
        </Text>
      </View>
    </View>

    <View style={s.grid2}>
      <View style={[s.col, s.card]}>
        <Text style={{ fontSize: 7.2, fontWeight: 700, color: COLOR.BRAND_GREEN, marginBottom: 1.5 }}>
          3. 濃淡階梯語義分工 (Tonal Shade Hierarchy)
        </Text>
        <Text style={{ fontSize: 6.2, color: COLOR.INK, lineHeight: 1.25, marginBottom: 1 }}>
          比照開源 Design System 嚴格分工：50 極淺底、200 邊框線、600 實心主色、800 深色文字。
        </Text>
        <Text style={{ fontSize: 5.5, color: COLOR.INK_MUTED }}>
          ↳ 杜絕「深色大面積塗抹」或「淺字看不清」，嚴格確保 WCAG AAA 7:1+ 對比度。
        </Text>
      </View>

      <View style={[s.col, s.card]}>
        <Text style={{ fontSize: 7.2, fontWeight: 700, color: COLOR.BRAND_GREEN, marginBottom: 1.5 }}>
          4. 紅・橙・黃・綠・藍五音光譜 (5-Tone Pure Spectrum)
        </Text>
        <Text style={{ fontSize: 6.2, color: COLOR.INK, lineHeight: 1.25, marginBottom: 1 }}>
          正面綠、提示黃、注意橘、風險紅、交通藍。UI 標籤全面採用純淨 5 音色階。
        </Text>
        <Text style={{ fontSize: 5.5, color: COLOR.INK_MUTED }}>
          ↳ 淘汰粉色與紫色混用，條件標籤色相純淨分明，紫色專用於 AI 助理通道。
        </Text>
      </View>
    </View>

    <Text style={s.subHeading}>✦ 全光譜六大核心色系「濃淡多階色票」視覺導覽 (Tonal Shade Palette Preview)</Text>
    
    <View style={s.grid6}>
      {/* 1. Emerald */}
      <View style={s.rampCard}>
        <Text style={s.rampTitle}>翡翠綠 Positive</Text>
        <Text style={s.rampSubtitle}>主品牌 / 合理 / 設備</Text>
        <View style={s.rampBarRow}>
          <View style={[s.rampBarSegment, { backgroundColor: COLOR.GREEN_50 }]} />
          <View style={[s.rampBarSegment, { backgroundColor: COLOR.GREEN_100 }]} />
          <View style={[s.rampBarSegment, { backgroundColor: COLOR.GREEN_200 }]} />
          <View style={[s.rampBarSegment, { backgroundColor: COLOR.GREEN_400 }]} />
          <View style={[s.rampBarSegment, { backgroundColor: COLOR.GREEN_600 }]} />
          <View style={[s.rampBarSegment, { backgroundColor: COLOR.GREEN_800 }]} />
        </View>
        <Text style={s.rampStepText}>50: #E6F6F1 (底)</Text>
        <Text style={s.rampStepText}>200: #9EE2CF (框)</Text>
        <Text style={s.rampStepText}>600: #007D5A (主)</Text>
        <Text style={s.rampStepText}>800: #004D36 (字)</Text>
      </View>

      {/* 2. Yellow */}
      <View style={s.rampCard}>
        <Text style={s.rampTitle}>陽光金黃 Notice</Text>
        <Text style={s.rampSubtitle}>格局預算 / 提示公告</Text>
        <View style={s.rampBarRow}>
          <View style={[s.rampBarSegment, { backgroundColor: COLOR.YELLOW_50 }]} />
          <View style={[s.rampBarSegment, { backgroundColor: COLOR.YELLOW_100 }]} />
          <View style={[s.rampBarSegment, { backgroundColor: COLOR.YELLOW_200 }]} />
          <View style={[s.rampBarSegment, { backgroundColor: COLOR.YELLOW_400 }]} />
          <View style={[s.rampBarSegment, { backgroundColor: COLOR.YELLOW_600 }]} />
          <View style={[s.rampBarSegment, { backgroundColor: COLOR.YELLOW_800 }]} />
        </View>
        <Text style={s.rampStepText}>50: #FEFCE8 (底)</Text>
        <Text style={s.rampStepText}>200: #FDE047 (框)</Text>
        <Text style={s.rampStepText}>600: #CA8A04 (主)</Text>
        <Text style={s.rampStepText}>800: #854D0E (字)</Text>
      </View>

      {/* 3. Orange */}
      <View style={s.rampCard}>
        <Text style={s.rampTitle}>暖琥珀橘 Caution</Text>
        <Text style={s.rampSubtitle}>特殊條件 / 條件反映</Text>
        <View style={s.rampBarRow}>
          <View style={[s.rampBarSegment, { backgroundColor: COLOR.ORANGE_50 }]} />
          <View style={[s.rampBarSegment, { backgroundColor: COLOR.ORANGE_100 }]} />
          <View style={[s.rampBarSegment, { backgroundColor: COLOR.ORANGE_200 }]} />
          <View style={[s.rampBarSegment, { backgroundColor: COLOR.ORANGE_400 }]} />
          <View style={[s.rampBarSegment, { backgroundColor: COLOR.ORANGE_600 }]} />
          <View style={[s.rampBarSegment, { backgroundColor: COLOR.ORANGE_800 }]} />
        </View>
        <Text style={s.rampStepText}>50: #FFFBEB (底)</Text>
        <Text style={s.rampStepText}>200: #FDBA74 (框)</Text>
        <Text style={s.rampStepText}>600: #EA580C (主)</Text>
        <Text style={s.rampStepText}>800: #D97706 (字)</Text>
      </View>

      {/* 4. Red */}
      <View style={s.rampCard}>
        <Text style={s.rampTitle}>典雅赤紅 Negative</Text>
        <Text style={s.rampSubtitle}>開價偏高 / 嚴重警示</Text>
        <View style={s.rampBarRow}>
          <View style={[s.rampBarSegment, { backgroundColor: COLOR.RED_50 }]} />
          <View style={[s.rampBarSegment, { backgroundColor: COLOR.RED_100 }]} />
          <View style={[s.rampBarSegment, { backgroundColor: COLOR.RED_200 }]} />
          <View style={[s.rampBarSegment, { backgroundColor: COLOR.RED_400 }]} />
          <View style={[s.rampBarSegment, { backgroundColor: COLOR.RED_600 }]} />
          <View style={[s.rampBarSegment, { backgroundColor: COLOR.RED_800 }]} />
        </View>
        <Text style={s.rampStepText}>50: #FEF2F2 (底)</Text>
        <Text style={s.rampStepText}>200: #FCA5A5 (框)</Text>
        <Text style={s.rampStepText}>600: #DC2626 (主)</Text>
        <Text style={s.rampStepText}>800: #B13818 (字)</Text>
      </View>

      {/* 5. Blue */}
      <View style={s.rampCard}>
        <Text style={s.rampTitle}>澄澈晴空藍 Info</Text>
        <Text style={s.rampSubtitle}>地點交通 / 實價資料</Text>
        <View style={s.rampBarRow}>
          <View style={[s.rampBarSegment, { backgroundColor: COLOR.BLUE_50 }]} />
          <View style={[s.rampBarSegment, { backgroundColor: COLOR.BLUE_100 }]} />
          <View style={[s.rampBarSegment, { backgroundColor: COLOR.BLUE_200 }]} />
          <View style={[s.rampBarSegment, { backgroundColor: COLOR.BLUE_400 }]} />
          <View style={[s.rampBarSegment, { backgroundColor: COLOR.BLUE_600 }]} />
          <View style={[s.rampBarSegment, { backgroundColor: COLOR.BLUE_800 }]} />
        </View>
        <Text style={s.rampStepText}>50: #F0F9FF (底)</Text>
        <Text style={s.rampStepText}>200: #7DD3FC (框)</Text>
        <Text style={s.rampStepText}>600: #0284C7 (主)</Text>
        <Text style={s.rampStepText}>800: #0369A1 (字)</Text>
      </View>

      {/* 6. Violet */}
      <View style={s.rampCard}>
        <Text style={s.rampTitle}>魅紫羅蘭 AI</Text>
        <Text style={s.rampSubtitle}>AI 顧問 / 微信管道</Text>
        <View style={s.rampBarRow}>
          <View style={[s.rampBarSegment, { backgroundColor: COLOR.VIOLET_50 }]} />
          <View style={[s.rampBarSegment, { backgroundColor: COLOR.VIOLET_100 }]} />
          <View style={[s.rampBarSegment, { backgroundColor: COLOR.VIOLET_200 }]} />
          <View style={[s.rampBarSegment, { backgroundColor: COLOR.VIOLET_400 }]} />
          <View style={[s.rampBarSegment, { backgroundColor: COLOR.VIOLET_600 }]} />
          <View style={[s.rampBarSegment, { backgroundColor: COLOR.VIOLET_800 }]} />
        </View>
        <Text style={s.rampStepText}>50: #FAF5FF (底)</Text>
        <Text style={s.rampStepText}>200: #D8B4FE (框)</Text>
        <Text style={s.rampStepText}>600: #9333EA (主)</Text>
        <Text style={s.rampStepText}>800: #7E22CE (字)</Text>
      </View>
    </View>

    <View style={s.footerRow}>
      <Text style={s.footerText}>Linus 好日不動產 ｜ CIS / UI Design System</Text>
      <Text style={s.footerText}>第 1 頁 / 共 6 頁</Text>
    </View>
  </Page>
);


