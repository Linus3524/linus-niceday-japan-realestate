import React from "react";
import { Page, Text, View } from "@react-pdf/renderer";
import { COLOR, s } from "./styles";

export const Page2: React.FC = () => (
  <Page size="A4" style={s.page}>
    <View style={s.topBar} />
    <View style={s.headerRow}>
      <Text style={s.headerBrand}>LINUS 好日不動產</Text>
      <Text style={s.headerDocTitle}>品牌 CIS 規範與 UI 視覺系統手冊 v2.0 ｜ 第 2 頁 / 共 6 頁</Text>
    </View>

    <Text style={s.heroTitle}>二、開源標準濃淡色階功能定位與語義色彩矩陣</Text>
    <Text style={s.heroSubtitle}>
      依循開源 UI 系統標準分工：極淺底色・淺線邊框・懸停交互・實心主色・深色文字・極深墨黑
    </Text>

    {/* 開源 UI 手冊標準 6 階濃淡分工 */}
    <Text style={s.sectionHeading}>1. 開源 UI 手冊標準 6 階濃淡角色定位 (The 6-Step Tonal Roles)</Text>
    <View style={s.table}>
      <View style={[s.tableRow, s.tableRowHeader]}>
        <Text style={[s.tableHeaderText, { width: "15%" }]}>濃淡階梯</Text>
        <Text style={[s.tableHeaderText, { width: "21%" }]}>功能角色定位</Text>
        <Text style={[s.tableHeaderText, { width: "26%" }]}>CSS Token / Tailwind 對應</Text>
        <Text style={[s.tableHeaderText, { width: "38%" }]}>UI 元件標準應用場景</Text>
      </View>

      <View style={s.tableRow}>
        <Text style={[s.tableCell, { width: "15%", fontWeight: 700 }]}>Level 1 (50)</Text>
        <Text style={[s.tableCell, { width: "21%" }]}>極淺底色 (Subtle BG)</Text>
        <Text style={[s.tableCellMuted, { width: "26%" }]}>bg-*-50 (0.05~0.10 強度)</Text>
        <Text style={[s.tableCell, { width: "38%" }]}>標籤底色、警示橫幅微底、卡片淺底、表格斑馬紋</Text>
      </View>

      <View style={s.tableRow}>
        <Text style={[s.tableCell, { width: "15%", fontWeight: 700 }]}>Level 2 (200)</Text>
        <Text style={[s.tableCell, { width: "21%" }]}>淺線邊框 (Subtle Border)</Text>
        <Text style={[s.tableCellMuted, { width: "26%" }]}>border-*-200 (1px 結構線)</Text>
        <Text style={[s.tableCell, { width: "38%" }]}>標籤 1px 外框、警示方塊邊框、卡片分割線 (同色系自然收邊)</Text>
      </View>

      <View style={s.tableRow}>
        <Text style={[s.tableCell, { width: "15%", fontWeight: 700 }]}>Level 3 (400)</Text>
        <Text style={[s.tableCell, { width: "21%" }]}>懸停交互 (Hover State)</Text>
        <Text style={[s.tableCellMuted, { width: "26%" }]}>hover:bg-*-400 / text-*-400</Text>
        <Text style={[s.tableCell, { width: "38%" }]}>次級圖示、互動組件 Hover 懸停底色、微光暈輔助線</Text>
      </View>

      <View style={s.tableRow}>
        <Text style={[s.tableCell, { width: "15%", fontWeight: 700 }]}>Level 4 (600)</Text>
        <Text style={[s.tableCell, { width: "21%" }]}>實心主色 (Solid CTA)</Text>
        <Text style={[s.tableCellMuted, { width: "26%" }]}>bg-*-600 (搭配 #FFFFFF 字)</Text>
        <Text style={[s.tableCell, { width: "38%" }]}>實心 CTA 按鈕、進度條填色、圖表主柱、2px 焦點外框</Text>
      </View>

      <View style={s.tableRow}>
        <Text style={[s.tableCell, { width: "15%", fontWeight: 700 }]}>Level 5 (800)</Text>
        <Text style={[s.tableCell, { width: "21%" }]}>深色文字 (High-Contrast)</Text>
        <Text style={[s.tableCellMuted, { width: "26%" }]}>text-*-800 (WCAG AAA 7:1+)</Text>
        <Text style={[s.tableCell, { width: "38%" }]}>淺底標籤深色字、警示大標題、狀態結論 (超清晰易讀)</Text>
      </View>

      <View style={s.tableRow}>
        <Text style={[s.tableCell, { width: "15%", fontWeight: 700 }]}>Level 6 (900)</Text>
        <Text style={[s.tableCell, { width: "21%" }]}>極深墨黑 (Deep Ink)</Text>
        <Text style={[s.tableCellMuted, { width: "26%" }]}>#1A2A22 / #3F5147</Text>
        <Text style={[s.tableCell, { width: "38%" }]}>頁面大標題、長篇內文、2px 硬邊投影 [2px_2px_0px_#1A2A22]</Text>
      </View>
    </View>

    {/* 七大標準語義濃淡色階表 */}
    <Text style={s.sectionHeading}>2. 七大標準語義濃淡色階矩陣 (Semantic Color Ramp Matrix)</Text>
    <View style={s.table}>
      <View style={[s.tableRow, s.tableRowHeader]}>
        <Text style={[s.tableHeaderText, { width: "18%" }]}>語義角色與色系</Text>
        <Text style={[s.tableHeaderText, { width: "15%" }]}>50 極淺底 (BG)</Text>
        <Text style={[s.tableHeaderText, { width: "15%" }]}>200 邊框 (Border)</Text>
        <Text style={[s.tableHeaderText, { width: "15%" }]}>600 實心 (Solid)</Text>
        <Text style={[s.tableHeaderText, { width: "37%" }]}>800 深色字 (Text AAA)</Text>
      </View>

      <View style={s.tableRow}>
        <Text style={[s.tableCell, { width: "18%", fontWeight: 700, color: COLOR.POS_TEXT }]}>Positive (翡翠綠)</Text>
        <Text style={[s.tableCellMuted, { width: "15%" }]}>#E6F6F1</Text>
        <Text style={[s.tableCellMuted, { width: "15%" }]}>#9EE2CF</Text>
        <Text style={[s.tableCellMuted, { width: "15%" }]}>#007D5A</Text>
        <Text style={[s.tableCell, { width: "37%", color: "#004D36", fontWeight: 700 }]}>#004D36 (合理、超值、直達、設備)</Text>
      </View>

      <View style={s.tableRow}>
        <Text style={[s.tableCell, { width: "18%", fontWeight: 700, color: COLOR.NOTICE_TEXT }]}>Notice (陽光金黃)</Text>
        <Text style={[s.tableCellMuted, { width: "15%" }]}>#FEF9C3</Text>
        <Text style={[s.tableCellMuted, { width: "15%" }]}>#FDE047</Text>
        <Text style={[s.tableCellMuted, { width: "15%" }]}>#CA8A04</Text>
        <Text style={[s.tableCell, { width: "37%", color: COLOR.NOTICE_TEXT, fontWeight: 700 }]}>#854D0E (格局、預算、需轉乘、提示)</Text>
      </View>

      <View style={s.tableRow}>
        <Text style={[s.tableCell, { width: "18%", fontWeight: 700, color: COLOR.CAUT_TEXT }]}>Caution (暖琥珀橘)</Text>
        <Text style={[s.tableCellMuted, { width: "15%" }]}>#FFF7ED</Text>
        <Text style={[s.tableCellMuted, { width: "15%" }]}>#FDBA74</Text>
        <Text style={[s.tableCellMuted, { width: "15%" }]}>#EA580C</Text>
        <Text style={[s.tableCell, { width: "37%", color: COLOR.CAUT_TEXT, fontWeight: 700 }]}>#D97706 (特殊條件、取捨、注意提醒)</Text>
      </View>

      <View style={s.tableRow}>
        <Text style={[s.tableCell, { width: "18%", fontWeight: 700, color: COLOR.NEG_TEXT }]}>Negative (典雅赤紅)</Text>
        <Text style={[s.tableCellMuted, { width: "15%" }]}>#FEF2F2</Text>
        <Text style={[s.tableCellMuted, { width: "15%" }]}>#FCA5A5</Text>
        <Text style={[s.tableCellMuted, { width: "15%" }]}>#DC2626</Text>
        <Text style={[s.tableCell, { width: "37%", color: COLOR.NEG_TEXT, fontWeight: 700 }]}>#B13818 (偏高、難度高、需調整、風險)</Text>
      </View>

      <View style={s.tableRow}>
        <Text style={[s.tableCell, { width: "18%", fontWeight: 700, color: COLOR.INFO_TEXT }]}>Info (澄澈晴空藍)</Text>
        <Text style={[s.tableCellMuted, { width: "15%" }]}>#E0F2FE</Text>
        <Text style={[s.tableCellMuted, { width: "15%" }]}>#7DD3FC</Text>
        <Text style={[s.tableCellMuted, { width: "15%" }]}>#0284C7</Text>
        <Text style={[s.tableCell, { width: "37%", color: COLOR.INFO_TEXT, fontWeight: 700 }]}>#0369A1 (地點、交通線路、通勤時間)</Text>
      </View>

      <View style={s.tableRow}>
        <Text style={[s.tableCell, { width: "18%", fontWeight: 700, color: COLOR.TAG_RECOMMEND_TEXT }]}>Scope (冰藍灰)</Text>
        <Text style={[s.tableCellMuted, { width: "15%" }]}>#F2F8FA</Text>
        <Text style={[s.tableCellMuted, { width: "15%" }]}>#D6EAF0</Text>
        <Text style={[s.tableCellMuted, { width: "15%" }]}>#3F626D</Text>
        <Text style={[s.tableCell, { width: "37%", color: COLOR.TAG_RECOMMEND_TEXT, fontWeight: 700 }]}>#3F626D (指定車站、指定範圍、接近預算)</Text>
      </View>

      <View style={s.tableRow}>
        <Text style={[s.tableCell, { width: "18%", fontWeight: 700, color: COLOR.AI_TEXT }]}>AI Channel (魅紫羅蘭)</Text>
        <Text style={[s.tableCellMuted, { width: "15%" }]}>#FAF5FF</Text>
        <Text style={[s.tableCellMuted, { width: "15%" }]}>#D8B4FE</Text>
        <Text style={[s.tableCellMuted, { width: "15%" }]}>#9333EA</Text>
        <Text style={[s.tableCell, { width: "37%", color: COLOR.AI_TEXT, fontWeight: 700 }]}>#7E22CE (AI 顧問推薦、微信客服管道)</Text>
      </View>
    </View>

    {/* 淘汰色票前後對照表 */}
    <Text style={s.sectionHeading}>3. 淘汰色票前後對照表 (Deprecation / Replacement)</Text>
    <View style={s.table}>
      <View style={[s.tableRow, s.tableRowHeader]}>
        <Text style={[s.tableHeaderText, { width: "22%" }]}>舊版淘汰色 (混濁/雜亂)</Text>
        <Text style={[s.tableHeaderText, { width: "24%" }]}>新版收斂標準色</Text>
        <Text style={[s.tableHeaderText, { width: "54%" }]}>淘汰原因與升級效益</Text>
      </View>

      <View style={s.tableRow}>
        <Text style={[s.tableCell, { width: "22%", color: "#BE185D" }]}>#FDF2F8 / #BE185D (粉色)</Text>
        <Text style={[s.tableCell, { width: "24%", fontWeight: 700, color: COLOR.NOTICE_TEXT }]}>#FEF9C3 (陽光金黃)</Text>
        <Text style={[s.tableCell, { width: "54%" }]}>淘汰條件標籤粉色，預算與房型歸併為陽光金黃，純化為紅橙黃綠藍 5 音</Text>
      </View>

      <View style={s.tableRow}>
        <Text style={[s.tableCell, { width: "22%", color: "#7A5A1F" }]}>#FFF9ED / #7A5A1F (泥黃褐)</Text>
        <Text style={[s.tableCell, { width: "24%", fontWeight: 700, color: COLOR.CAUT_TEXT }]}>#FFF7ED / #D97706 (暖琥珀)</Text>
        <Text style={[s.tableCell, { width: "54%" }]}>去除泛黃髒感，轉為明亮清透暖橘，與紅色警告徹底拉開色相差</Text>
      </View>

      <View style={s.tableRow}>
        <Text style={[s.tableCell, { width: "22%", color: "#DC2626" }]}>#DC2626 (刺眼螢光赤紅)</Text>
        <Text style={[s.tableCell, { width: "24%", fontWeight: 700, color: COLOR.NEG_TEXT }]}>#B13818 (建築典雅赤紅)</Text>
        <Text style={[s.tableCell, { width: "54%" }]}>杜絕刺眼螢光感，具備專業地產雜誌質感與清晰高對比度</Text>
      </View>
    </View>

    <View style={s.footerRow}>
      <Text style={s.footerText}>Linus 好日不動產 ｜ CIS / UI Design System</Text>
      <Text style={s.footerText}>第 2 頁 / 共 6 頁</Text>
    </View>
  </Page>
);

