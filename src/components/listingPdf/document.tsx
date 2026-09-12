import { Document, Link, Page, Text, View } from "@react-pdf/renderer";
import { parseEquipmentList } from "../../lib/equipmentParser";
import type { AnalyzeListingResult } from "../../lib/listing/types";
import { splitList } from './formatters.js';
import { LocationCard } from './location.js';
import { ContactPage, PageChrome } from './pageChrome.js';
import { Card, Cell, EquipmentCard, SpecialNotesCard } from './primitives.js';
import { RentKpis, RentSections } from './rental.js';
import { SaleKpis, SaleSections } from './sale.js';
import { styles } from './styles.js';
import type { ListingReportPdfProps } from './types.js';


/* ───────────── 主文件 ───────────── */
export function ListingReportPdf({ result, title, generatedAt, shareUrl, assetBase = "", locationContext, commute }: ListingReportPdfProps) {
  const e: Partial<AnalyzeListingResult["extracted"]> = result?.extracted ?? {};
  const isSale = result?.dealType === "sale" || Boolean(result?.saleAnalysis);
  const stations = splitList(e.station);
  const walks = splitList(e.walkTime);
  const stationText = stations.map((s, i) => `${s}${walks[i] ? ` 徒步 ${walks[i]} 分` : ""}`).join("／");
  const dateText = generatedAt.toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric" });
  const buildingLine = [e.buildingName, e.roomNumber].filter(Boolean).join(" ");
  const headline = title || buildingLine || (isSale ? "買賣物件圖紙分析" : "租賃物件圖紙分析");
  const equipment = parseEquipmentList(e.facilities || e.specialNotes, e.facilityTranslations);

  return (
    <Document title={headline} author="LINUS 住好日" subject="物件圖紙分析結果">
      <Page size="A4" style={styles.page}>
        {/* fixed 元素要放在會換頁的內容「之前」，且各自當 Page 直接子元素：
            放在最後或包在 View 裡，實測頁尾會消失或頁碼不出現。 */}
        <PageChrome dateText={dateText} />

        <View style={styles.body}>
          {/* 標題區 */}
          <View style={styles.titleBlock} wrap={false}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.eyebrow}>PROPERTY LISTING DIAGNOSTICS</Text>
                <Text style={styles.title}>{headline}</Text>
                {buildingLine && buildingLine !== headline ? <Text style={styles.subtitle}>{buildingLine}</Text> : null}
                {e.address ? <Text style={styles.subtitle}>{e.address}</Text> : null}
              </View>
              {shareUrl ? (
                <Link src={shareUrl} style={styles.onlineLinkBtn}>
                  <Text style={styles.onlineLinkText}>線上版本 ↗</Text>
                </Link>
              ) : null}
            </View>
            <View style={styles.chipRow}>
              <Text style={[styles.chip, styles.chipAccent]}>{isSale ? "買賣物件" : "租賃物件"}</Text>
              {e.layout ? <Text style={styles.chip}>{e.layout}</Text> : null}
              {e.area ? <Text style={styles.chip}>{e.area}</Text> : null}
              {e.age ? <Text style={styles.chip}>築 {e.age}</Text> : null}
            </View>
          </View>

          {isSale ? <SaleKpis result={result} /> : <RentKpis result={result} />}

          {/* 物件摘要 */}
          <Card title="物件基本規格・交通" tag="依圖紙讀取">
            <View style={styles.grid}>
              <Cell label="格局" value={e.layout} />
              <Cell label="專有面積" value={e.area} />
              <Cell label="築年" value={e.age} />
              <Cell label="所在樓層" value={e.floor ? `${e.floor}${e.buildingFloors ? `／共 ${e.buildingFloors} 層` : ""}` : null} />
              <Cell label="構造" value={e.structure} />
              <Cell label="向き" value={e.direction} />
              {isSale ? (
                <>
                  <Cell label="販売価格" value={e.salePrice} />
                  <Cell label="總戸数" value={e.totalUnits} />
                  <Cell label="土地権利" value={e.landRights} />
                  <Cell label="用途地域" value={e.zoning} />
                  <Cell label="管理会社" value={e.managementCompany} />
                  <Cell label="管理形態" value={e.managementStyle} />
                </>
              ) : (
                <>
                  <Cell label="賃料" value={e.rent} />
                  <Cell label="管理費" value={e.managementFee} />
                  <Cell label="敷金／礼金" value={[e.deposit || "—", e.keyMoney || "—"].join(" ／ ")} />
                  <Cell label="更新料" value={e.renewalFee} />
                  <Cell label="保證會社" value={e.guaranteeFee} />
                  <Cell label="損害保險" value={e.insuranceFee} />
                </>
              )}
              <Cell label="交通" value={stationText || e.transitAccess} wide />
            </View>
          </Card>

          {isSale ? <SaleSections result={result} /> : <RentSections result={result} />}

          <EquipmentCard items={equipment} />
          {isSale ? <SpecialNotesCard notes={e.specialNotes} /> : null}
          <LocationCard locationContext={locationContext} commute={commute} />

          <View style={styles.disclaimer} wrap={false}>
            <Text style={styles.disclaimerText}>
              本報告由 LINUS 住好日依上傳圖紙自動產生，行情資料來自國土交通省「不動産情報ライブラリ」成約實價與各公開統計，僅供參考，不構成投資或契約建議。
              實際金額以正式契約、報價文件與仲介說明為準；圖紙與現況不符時以現況為準。
            </Text>
          </View>

        </View>
      </Page>

      {/* 聯絡頁獨立成一個 Page：用 break 的話，前一頁剛好被免責聲明推到新頁時就不會再換頁，
          聯絡區塊會跟免責聲明擠在同一頁。 */}
      <Page size="A4" style={styles.page}>
        <PageChrome dateText={dateText} />
        <View style={styles.body}>
          <ContactPage assetBase={assetBase} />
        </View>
      </Page>
    </Document>
  );
}
