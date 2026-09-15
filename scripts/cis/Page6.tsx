import React from "react";
import { Page, Text, View } from "@react-pdf/renderer";
import { COLOR, s } from "./styles";

export const Page6: React.FC = () => (
  <Page size="A4" style={s.page}>
    <View style={s.topBar} />
    <View style={s.headerRow}>
      <Text style={s.headerBrand}>LINUS 好日不動產</Text>
      <Text style={s.headerDocTitle}>品牌 CIS 規範與 UI 視覺系統手冊 v2.0 ｜ 第 6 頁 / 共 6 頁</Text>
    </View>

    <Text style={s.heroTitle}>六、標籤與警示方塊實例（紅橙黃綠藍 5 音體系）</Text>
    <Text style={s.heroSubtitle}>
      推薦清單與通勤標籤（圖 1）・搜尋條件分類標籤矩陣（圖 2，無粉無紫）・四大警示橫幅
    </Text>

    {/* 1. 推薦清單與通勤標籤實例 (Image 1) */}
    <Text style={s.sectionHeading}>1. 推薦卡片與通勤標籤實例 (Recommendation / Commute Badges)</Text>
    <View style={[s.card, { padding: 4, marginBottom: 3 }]}>
      <Text style={{ fontSize: 6, fontWeight: 700, color: COLOR.INK_SECONDARY, marginBottom: 1.5 }}>
        ✦ 第一張圖實例規範（區域推薦清單頭部標籤組）
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 2.5, alignItems: "center" }}>
        <View style={[s.badge, { backgroundColor: COLOR.TAG_AREA_BG, borderColor: COLOR.TAG_AREA_BORDER }]}>
          <Text style={[s.badgeText, { color: COLOR.TAG_AREA_TEXT, fontSize: 5.5 }]}>AREA 01</Text>
        </View>
        <View style={[s.badge, { backgroundColor: COLOR.TAG_RECOMMEND_BG, borderColor: COLOR.TAG_RECOMMEND_BORDER }]}>
          <Text style={[s.badgeText, { color: COLOR.TAG_RECOMMEND_TEXT, fontSize: 5.5 }]}>指定車站</Text>
        </View>
        <View style={[s.badge, { backgroundColor: COLOR.TAG_RECOMMEND_BG, borderColor: COLOR.TAG_RECOMMEND_BORDER }]}>
          <Text style={[s.badgeText, { color: COLOR.TAG_RECOMMEND_TEXT, fontSize: 5.5 }]}>指定範圍</Text>
        </View>
        <View style={[s.badge, { backgroundColor: COLOR.POS_BG, borderColor: COLOR.POS_BORDER }]}>
          <Text style={[s.badgeText, { color: COLOR.POS_TEXT, fontSize: 5.5 }]}>預算內</Text>
        </View>
        <View style={[s.badge, { backgroundColor: COLOR.TAG_RECOMMEND_BG, borderColor: COLOR.TAG_RECOMMEND_BORDER }]}>
          <Text style={[s.badgeText, { color: COLOR.TAG_RECOMMEND_TEXT, fontSize: 5.5 }]}>接近預算</Text>
        </View>
        <View style={[s.badge, { backgroundColor: COLOR.NEG_BG, borderColor: COLOR.NEG_BORDER }]}>
          <Text style={[s.badgeText, { color: COLOR.NEG_TEXT, fontSize: 5.5 }]}>需調整</Text>
        </View>
        <View style={[s.badge, { backgroundColor: COLOR.POS_BG, borderColor: COLOR.POS_BORDER }]}>
          <Text style={[s.badgeText, { color: COLOR.POS_TEXT, fontSize: 5.5 }]}>直達線路</Text>
        </View>
        <View style={[s.badge, { backgroundColor: COLOR.NOTICE_BG, borderColor: COLOR.NOTICE_BORDER }]}>
          <Text style={[s.badgeText, { color: COLOR.NOTICE_TEXT, fontSize: 5.5 }]}>需轉乘</Text>
        </View>
        <View style={[s.badge, { backgroundColor: COLOR.POS_BG, borderColor: COLOR.POS_BORDER }]}>
          <Text style={[s.badgeText, { color: COLOR.POS_TEXT, fontSize: 5.5 }]}>5 分・轉乘 0 次</Text>
        </View>
        <View style={[s.badge, { backgroundColor: COLOR.TAG_RECOMMEND_BG, borderColor: COLOR.TAG_RECOMMEND_BORDER }]}>
          <Text style={[s.badgeText, { color: COLOR.TAG_RECOMMEND_TEXT, fontSize: 5.5 }]}>11 分・轉乘 1 次</Text>
        </View>
      </View>
    </View>

    {/* 2. 搜尋條件分類標籤矩陣 (Image 2) */}
    <Text style={s.sectionHeading}>2. 搜尋條件分類標籤矩陣 (Search Criteria Tags - 5 音標準，無粉無紫)</Text>
    <View style={[s.card, { padding: 4, marginBottom: 3 }]}>
      <Text style={{ fontSize: 6, fontWeight: 700, color: COLOR.INK_SECONDARY, marginBottom: 1.5 }}>
        ✦ 第二張圖實例規範（房型與預算收斂為金黃，嚴格紅・橙・黃・綠・藍 5 音）
      </Text>
      
      {/* 房型與預算 (黃) */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 1.5 }}>
        <Text style={{ fontSize: 5.5, fontWeight: 700, color: COLOR.NOTICE_TEXT, width: 44 }}>房型/預算(黃):</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 2 }}>
          <View style={[s.badge, { backgroundColor: COLOR.CAT_LAYOUT_BG, borderColor: COLOR.CAT_LAYOUT_BORDER }]}>
            <Text style={[s.badgeText, { color: COLOR.CAT_LAYOUT_TEXT, fontSize: 5.2 }]}>1LDK</Text>
          </View>
          <View style={[s.badge, { backgroundColor: COLOR.CAT_LAYOUT_BG, borderColor: COLOR.CAT_LAYOUT_BORDER }]}>
            <Text style={[s.badgeText, { color: COLOR.CAT_LAYOUT_TEXT, fontSize: 5.2 }]}>25㎡以上</Text>
          </View>
          <View style={[s.badge, { backgroundColor: COLOR.CAT_LAYOUT_BG, borderColor: COLOR.CAT_LAYOUT_BORDER }]}>
            <Text style={[s.badgeText, { color: COLOR.CAT_LAYOUT_TEXT, fontSize: 5.2 }]}>RC/SRC</Text>
          </View>
          <View style={[s.badge, { backgroundColor: COLOR.CAT_BUDGET_BG, borderColor: COLOR.CAT_BUDGET_BORDER }]}>
            <Text style={[s.badgeText, { color: COLOR.CAT_BUDGET_TEXT, fontSize: 5.2 }]}>月租 20 萬円內</Text>
          </View>
        </View>
      </View>

      {/* 地點與交通 (藍) */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 1.5 }}>
        <Text style={{ fontSize: 5.5, fontWeight: 700, color: COLOR.INFO_TEXT, width: 44 }}>地點/交通(藍):</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 2 }}>
          <View style={[s.badge, { backgroundColor: COLOR.CAT_TRANS_BG, borderColor: COLOR.CAT_TRANS_BORDER }]}>
            <Text style={[s.badgeText, { color: COLOR.CAT_TRANS_TEXT, fontSize: 5.2 }]}>目黑區・世田谷區</Text>
          </View>
          <View style={[s.badge, { backgroundColor: COLOR.CAT_TRANS_BG, borderColor: COLOR.CAT_TRANS_BORDER }]}>
            <Text style={[s.badgeText, { color: COLOR.CAT_TRANS_TEXT, fontSize: 5.2 }]}>通勤至惠比壽</Text>
          </View>
          <View style={[s.badge, { backgroundColor: COLOR.CAT_TRANS_BG, borderColor: COLOR.CAT_TRANS_BORDER }]}>
            <Text style={[s.badgeText, { color: COLOR.CAT_TRANS_TEXT, fontSize: 5.2 }]}>東急東橫線</Text>
          </View>
          <View style={[s.badge, { backgroundColor: COLOR.CAT_TRANS_BG, borderColor: COLOR.CAT_TRANS_BORDER }]}>
            <Text style={[s.badgeText, { color: COLOR.CAT_TRANS_TEXT, fontSize: 5.2 }]}>武藏小杉站</Text>
          </View>
          <View style={[s.badge, { backgroundColor: COLOR.CAT_TRANS_BG, borderColor: COLOR.CAT_TRANS_BORDER }]}>
            <Text style={[s.badgeText, { color: COLOR.CAT_TRANS_TEXT, fontSize: 5.2 }]}>步行 10 分內</Text>
          </View>
        </View>
      </View>

      {/* 設備與建物 (綠) */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 1.5 }}>
        <Text style={{ fontSize: 5.5, fontWeight: 700, color: COLOR.CAT_EQUIP_TEXT, width: 44 }}>設備/建物(綠):</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 2 }}>
          <View style={[s.badge, { backgroundColor: COLOR.CAT_EQUIP_BG, borderColor: COLOR.CAT_EQUIP_BORDER }]}>
            <Text style={[s.badgeText, { color: COLOR.CAT_EQUIP_TEXT, fontSize: 5.2 }]}>2 樓以上</Text>
          </View>
          <View style={[s.badge, { backgroundColor: COLOR.CAT_EQUIP_BG, borderColor: COLOR.CAT_EQUIP_BORDER }]}>
            <Text style={[s.badgeText, { color: COLOR.CAT_EQUIP_TEXT, fontSize: 5.2 }]}>獨立洗面台</Text>
          </View>
          <View style={[s.badge, { backgroundColor: COLOR.CAT_EQUIP_BG, borderColor: COLOR.CAT_EQUIP_BORDER }]}>
            <Text style={[s.badgeText, { color: COLOR.CAT_EQUIP_TEXT, fontSize: 5.2 }]}>免治馬桶</Text>
          </View>
          <View style={[s.badge, { backgroundColor: COLOR.CAT_EQUIP_BG, borderColor: COLOR.CAT_EQUIP_BORDER }]}>
            <Text style={[s.badgeText, { color: COLOR.CAT_EQUIP_TEXT, fontSize: 5.2 }]}>自動門</Text>
          </View>
          <View style={[s.badge, { backgroundColor: COLOR.CAT_EQUIP_BG, borderColor: COLOR.CAT_EQUIP_BORDER }]}>
            <Text style={[s.badgeText, { color: COLOR.CAT_EQUIP_TEXT, fontSize: 5.2 }]}>陽台</Text>
          </View>
          <View style={[s.badge, { backgroundColor: COLOR.CAT_EQUIP_BG, borderColor: COLOR.CAT_EQUIP_BORDER }]}>
            <Text style={[s.badgeText, { color: COLOR.CAT_EQUIP_TEXT, fontSize: 5.2 }]}>爐具 2 口以上</Text>
          </View>
        </View>
      </View>

      {/* 特殊條件 (橘) */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
        <Text style={{ fontSize: 5.5, fontWeight: 700, color: COLOR.CAUT_TEXT, width: 44 }}>特殊條件(橘):</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 2 }}>
          <View style={[s.badge, { backgroundColor: COLOR.CAT_SPEC_BG, borderColor: COLOR.CAT_SPEC_BORDER }]}>
            <Text style={[s.badgeText, { color: COLOR.CAT_SPEC_TEXT, fontSize: 5.2 }]}>可養貓</Text>
          </View>
          <View style={[s.badge, { backgroundColor: COLOR.CAT_SPEC_BG, borderColor: COLOR.CAT_SPEC_BORDER }]}>
            <Text style={[s.badgeText, { color: COLOR.CAT_SPEC_TEXT, fontSize: 5.2 }]}>免禮金</Text>
          </View>
          <View style={[s.badge, { backgroundColor: COLOR.CAT_SPEC_BG, borderColor: COLOR.CAT_SPEC_BORDER }]}>
            <Text style={[s.badgeText, { color: COLOR.CAT_SPEC_TEXT, fontSize: 5.2 }]}>免押金</Text>
          </View>
        </View>
      </View>
    </View>

    <Text style={s.sectionHeading}>3. 警示與通知橫幅範例 (Alert / Notice Boxes)</Text>
    <View style={[s.alertBox, { backgroundColor: COLOR.NEG_BG, borderColor: COLOR.NEG_BORDER }]}>
      <Text style={[s.alertTitle, { color: COLOR.NEG_TEXT }]}>
        ✕ 嚴重風險警示：建築耐震基準不適合／高額解約條款 (Severe Alert)
      </Text>
      <Text style={s.alertText}>
        本案經查屬舊耐震且未完成補強判定，短期解約違約金達 2 個月租金，建議由專業建築士評估並進行重大議價。
      </Text>
    </View>

    <View style={[s.alertBox, { backgroundColor: COLOR.CAUT_BG, borderColor: COLOR.CAUT_BORDER }]}>
      <Text style={[s.alertTitle, { color: COLOR.CAUT_TEXT }]}>
        ⚠ 注意事項：重要條款解讀與開價偏離提醒 (Caution Alert)
      </Text>
      <Text style={s.alertText}>
        本案開價超出同區基準約 16.7%，賣方有測試水溫傾向。管委會大規模修繕計畫未定，需確認修繕積立金總額。
      </Text>
    </View>

    <View style={[s.alertBox, { backgroundColor: COLOR.NOTICE_BG, borderColor: COLOR.NOTICE_BORDER }]}>
      <Text style={[s.alertTitle, { color: COLOR.NOTICE_TEXT }]}>
        ✦ 提示公告：法規條例備註與審查應備文件 (Notice / Tip)
      </Text>
      <Text style={s.alertText}>
        住宅宿泊事業法規定每年營業上限為 180 天；在日申請需備妥登錄地址之在留卡、保險證及個人住民票。
      </Text>
    </View>

    <View style={[s.alertBox, { backgroundColor: COLOR.POS_BG, borderColor: COLOR.POS_BORDER }]}>
      <Text style={[s.alertTitle, { color: COLOR.POS_TEXT }]}>
        ✓ 驗證通過：官方加減價因子與市場行情高度吻合 (Positive Box)
      </Text>
      <Text style={s.alertText}>
        經由國交省 92 筆實價登錄比對，本案翻新溢價（+20%）與角部屋採光加成客觀有據，開價落點合理。
      </Text>
    </View>

    <Text style={s.sectionHeading}>4. 全站元件落地應用位置索引 (Component Index)</Text>
    <View style={s.table}>
      <View style={[s.tableRow, s.tableRowHeader]}>
        <Text style={[s.tableHeaderText, { width: "24%" }]}>模組分類</Text>
        <Text style={[s.tableHeaderText, { width: "36%" }]}>核心檔案路徑</Text>
        <Text style={[s.tableHeaderText, { width: "40%" }]}>應用之視覺規範</Text>
      </View>
      <View style={s.tableRow}>
        <Text style={[s.tableCell, { width: "24%", fontWeight: 700 }]}>通用樣式庫</Text>
        <Text style={[s.tableCellMuted, { width: "36%" }]}>src/lib/ui/statusStyles.ts 等</Text>
        <Text style={[s.tableCell, { width: "40%" }]}>6 大語義色階、0px 直角、硬投影</Text>
      </View>
      <View style={s.tableRow}>
        <Text style={[s.tableCell, { width: "24%", fontWeight: 700 }]}>前端計算機</Text>
        <Text style={[s.tableCellMuted, { width: "36%" }]}>src/components/calculator/*</Text>
        <Text style={[s.tableCell, { width: "40%" }]}>需求評估 4 級、進度條、交通標籤</Text>
      </View>
      <View style={s.tableRow}>
        <Text style={[s.tableCell, { width: "24%", fontWeight: 700 }]}>行情熱力圖</Text>
        <Text style={[s.tableCellMuted, { width: "36%" }]}>src/components/RentMap.tsx</Text>
        <Text style={[s.tableCell, { width: "40%" }]}>5 級熱力色階、屋齡遞減軸</Text>
      </View>
      <View style={s.tableRow}>
        <Text style={[s.tableCell, { width: "24%", fontWeight: 700 }]}>後台儀表板</Text>
        <Text style={[s.tableCellMuted, { width: "36%" }]}>src/components/UsageDashboard.tsx</Text>
        <Text style={[s.tableCell, { width: "40%" }]}>三大業務通道、管道標籤、漏斗階梯</Text>
      </View>
    </View>

    <View style={s.footerRow}>
      <Text style={s.footerText}>Linus 好日不動產 ｜ CIS / UI Design System</Text>
      <Text style={s.footerText}>第 6 頁 / 共 6 頁</Text>
    </View>
  </Page>
);