import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

/**
 * 圖紙分析結果的 PDF 版型。
 *
 * 版面規則：
 * - 每一張卡片都是 wrap={false} 的 View，保證不會被切到兩頁；一頁塞不下就整張換頁。
 * - 可以跨很多頁，但同一張卡片永遠完整。
 * - 配色、字型與網站一致（品牌綠 #00A174／#007D5A、墨色 #1A2A22、線 #DDE3DF、淺底 #F5F8F6）。
 *
 * 字型只在建立 PDF 時才註冊與下載（見 ListingHealthCheck 的下載流程），
 * 主字型兩個檔各約 7MB、補字型各 0.9MB，不放進主 bundle，瀏覽器會快取。
 */

let fontsRegistered = false;

/**
 * 註冊 PDF 用字型。由呼叫端在產生 PDF 前呼叫一次，而不是在模組載入時做：
 * 瀏覽器要的是 /fonts/… 的網址，Node 端測試要的是檔案絕對路徑，
 * 寫死在模組頂層就沒辦法在不同環境切換。
 */
export function registerPdfFonts(baseUrl = "/fonts") {
  if (fontsRegistered) return;
  fontsRegistered = true;
  // 繁體中文為主、日文補字：Google Fonts 的 Noto Sans TC 缺 26 個日文新字體
  // （歩・区・横・浅・価…，圖紙原文一定有），Noto Sans JP 又缺繁體的「值」「查」。
  // TC 當主字型讓漢字用台灣讀者習慣的字形（與網站 CSS 的順序一致），
  // JP 只裁出 TC 沒有的 2,773 個字做補字（各 0.9MB），不整套載入。
  Font.register({
    family: "NotoSansTC",
    fonts: [
      { src: `${baseUrl}/NotoSansTC-Regular.ttf`, fontWeight: 400 },
      { src: `${baseUrl}/NotoSansTC-Bold.ttf`, fontWeight: 700 },
    ],
  });
  Font.register({
    family: "NotoSansJPSupplement",
    fonts: [
      { src: `${baseUrl}/NotoSansJP-Supplement-Regular.ttf`, fontWeight: 400 },
      { src: `${baseUrl}/NotoSansJP-Supplement-Bold.ttf`, fontWeight: 700 },
    ],
  });
  // 中日文沒有空白可以斷行，這裡把 CJK 逐字拆成音節，讓引擎可以在任何字之間換行。
  // 引擎在音節邊界換行時一定會插入一個 U+002D 連字號；這件事靠排版選項擋不掉
  // （K&P 在有伸縮空間時反而偏好斷在能多塞連字號的點）。所以改從字型下手：
  // 字型檔已用 scripts/patch-pdf-fonts.py 把 U+002D 改成零寬空字形、把原本的連字號
  // 複製到 U+E000。這裡再把內容裡的真實「-」換成 U+E000，使用者看到的減號與
  // 日期範圍一如原樣，引擎自動塞的那個則什麼都不畫。
  // 英數字維持整個單字不拆，"PDF" 不會變成 P-D-F。
  const VISIBLE_HYPHEN = "\uE000";
  const CJK_OR_OTHER = /[\u3000-\u30FF\u3400-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF]|[^\u3000-\u30FF\u3400-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF]+/g;
  // 禁則處理：句讀與右括號不能出現在行首、左括號不能落在行尾。把這類標點黏進
  // 相鄰的字一起當一個音節，引擎就不會在它們前後斷行。
  const CLOSING = /^[、。，．：；！？）」』】〕〉》］｝,.!?:;)\]}]$/;
  const OPENING = /^[（「『【〔〈《［｛(\[{]$/;
  Font.registerHyphenationCallback(word => {
    const safe = word.replace(/-/g, VISIBLE_HYPHEN);
    const tokens = safe.match(CJK_OR_OTHER) ?? [safe];
    const merged: string[] = [];
    for (const token of tokens) {
      const last = merged[merged.length - 1];
      if (last !== undefined && (CLOSING.test(token) || OPENING.test(last))) {
        merged[merged.length - 1] = last + token;
      } else {
        merged.push(token);
      }
    }
    return merged;
  });
}

const INK = "#1A2A22";
const INK_SOFT = "#3F5147";
const INK_MUTE = "#66736C";
const LINE = "#DDE3DF";
const SOFT_BG = "#F5F8F6";
const GREEN = "#00A174";
const GREEN_DEEP = "#007D5A";
const GREEN_SOFT = "#E6F6F1";
const AMBER_DEEP = "#7A5A1F";
const AMBER_SOFT = "#FFF9ED";
const AMBER_LINE = "#DCC8A1";
const ORANGE_DEEP = "#B13818";
const ORANGE_SOFT = "#FBDFD2";

const styles = StyleSheet.create({
  page: {
    fontFamily: ["NotoSansTC", "NotoSansJPSupplement"],
    fontSize: 9,
    color: INK,
    paddingTop: 44,
    paddingBottom: 52,
    paddingHorizontal: 40,
    // lineHeight 不放這裡：react-pdf 的 render prop（頁碼）Text 只要繼承到任何
    // lineHeight 就不會渲染（實測）。內容的預設行高改設在 body 上，頁尾維持乾淨。
  },
  body: { lineHeight: 1.5 },
  headerBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: GREEN,
  },
  titleBlock: { marginBottom: 14 },
  eyebrow: { fontSize: 7.5, color: GREEN_DEEP, fontWeight: 700, letterSpacing: 1.5, marginBottom: 4 },
  title: { fontSize: 17, fontWeight: 700, lineHeight: 1.3 },
  subtitle: { fontSize: 8.5, color: INK_SOFT, marginTop: 4 },
  meta: { fontSize: 7.5, color: INK_MUTE, marginTop: 6 },

  card: {
    borderWidth: 1,
    borderColor: LINE,
    marginBottom: 10,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: SOFT_BG,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  cardTitle: { fontSize: 9.5, fontWeight: 700 },
  cardTag: { fontSize: 7, color: INK_MUTE },
  cardBody: { paddingVertical: 8, paddingHorizontal: 10 },

  grid: { flexDirection: "row", flexWrap: "wrap" },
  gridCell: { width: "33.33%", paddingRight: 8, marginBottom: 6 },
  gridCellWide: { width: "100%", marginBottom: 6 },
  label: { fontSize: 7, color: INK_MUTE, marginBottom: 1 },
  value: { fontSize: 9.5, fontWeight: 700 },

  verdictBox: { borderWidth: 1, padding: 8, marginBottom: 6 },
  verdictStatus: { fontSize: 7, fontWeight: 700, letterSpacing: 1, marginBottom: 3 },
  verdictHeadline: { fontSize: 10, fontWeight: 700, lineHeight: 1.45 },
  verdictDetail: { fontSize: 8, marginTop: 4, lineHeight: 1.55 },

  // 行高不能靠繼承：react-pdf 把 page 的 lineHeight 1.5 算成 13.5pt 後往下傳，
  // 20pt 的數字會被壓在 13.5pt 的行裡、跟下一個區塊重疊。每個大字都自己設。
  bigNumberRow: { flexDirection: "row", alignItems: "flex-end", flexWrap: "wrap", marginBottom: 8 },
  bigNumber: { fontSize: 20, fontWeight: 700, lineHeight: 1.25 },
  bigNumberNote: { fontSize: 8, color: INK_SOFT, marginLeft: 8, marginBottom: 3, lineHeight: 1.4 },

  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F0",
    paddingVertical: 4,
  },
  tableRowLast: { borderBottomWidth: 0 },
  tdName: { width: "34%", fontSize: 8.5, fontWeight: 700, paddingRight: 6 },
  tdAmount: { width: "18%", fontSize: 8.5, fontWeight: 700, textAlign: "right", paddingRight: 8 },
  tdNote: { width: "48%", fontSize: 7.5, color: INK_SOFT, lineHeight: 1.45 },
  tdUnknown: { color: INK_MUTE, fontWeight: 400 },

  bullet: { flexDirection: "row", marginBottom: 3 },
  bulletDot: { width: 10, fontSize: 8, color: GREEN_DEEP },
  bulletText: { flex: 1, fontSize: 8, lineHeight: 1.5 },

  stepLabel: { fontSize: 7, fontWeight: 700, color: INK_MUTE, letterSpacing: 1, marginBottom: 2 },
  stepText: { fontSize: 8.5, lineHeight: 1.5 },
  stepBlock: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#EEF2F0" },
  stepBlockLast: { borderBottomWidth: 0 },
  mono: { fontSize: 8.5 },

  // 頁尾拆成三個各自 fixed 的直接子元素（分隔線、左文字、右頁碼）：
  // 包在一個 View 裡再 fixed，實測 render prop 的頁碼不會出現。
  footerRule: { position: "absolute", bottom: 34, left: 40, right: 40, borderTopWidth: 1, borderTopColor: LINE },
  // 不能有 lineHeight，否則右側用 render prop 的頁碼不會出現（見 page 樣式的說明）。
  footerText: { fontSize: 6.5, color: INK_MUTE },
  footerLeft: { position: "absolute", bottom: 22, left: 40 },
  footerRight: { position: "absolute", bottom: 22, right: 40 },
  disclaimer: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: SOFT_BG,
    padding: 8,
  },
  disclaimerText: { fontSize: 7, color: INK_SOFT, lineHeight: 1.5 },
});

const VERDICT_STYLE: Record<string, { bg: string; border: string; color: string }> = {
  "超值": { bg: GREEN_SOFT, border: "#9EE2CF", color: GREEN_DEEP },
  "合理": { bg: GREEN_SOFT, border: "#9EE2CF", color: GREEN_DEEP },
  "符合": { bg: GREEN_SOFT, border: "#9EE2CF", color: GREEN_DEEP },
  "部分符合": { bg: GREEN_SOFT, border: "#9EE2CF", color: GREEN_DEEP },
  "條件反映": { bg: AMBER_SOFT, border: AMBER_LINE, color: AMBER_DEEP },
  "需調整": { bg: AMBER_SOFT, border: AMBER_LINE, color: AMBER_DEEP },
  "偏高": { bg: ORANGE_SOFT, border: "#E94E2B", color: ORANGE_DEEP },
  "難度高": { bg: ORANGE_SOFT, border: "#E94E2B", color: ORANGE_DEEP },
  "待確認": { bg: "#F2F8FA", border: "#D6EAF0", color: "#3F626D" },
};
const SALE_VERDICT_STYLE: Record<string, { bg: string; border: string; color: string }> = {
  bargain: VERDICT_STYLE["超值"],
  fair: VERDICT_STYLE["合理"],
  premium: VERDICT_STYLE["需調整"],
};

const yen = (v: number | null | undefined) =>
  typeof v === "number" && Number.isFinite(v) ? `¥${Math.round(v).toLocaleString("ja-JP")}` : "—";
const man = (v: number | null | undefined) =>
  typeof v === "number" && Number.isFinite(v) ? `${Math.round(v).toLocaleString("ja-JP")} 萬円` : "—";
const pct = (v: number | null | undefined) =>
  typeof v === "number" && Number.isFinite(v) ? `${v >= 0 ? "+" : ""}${v.toFixed(1)}%` : "—";

export interface ListingReportPdfProps {
  /** 直接吃 /api/analyze-listing 的回傳物件；型別放寬，避免與前端型別耦合太緊 */
  result: any;
  title: string;
  generatedAt: Date;
  shareUrl?: string | null;
  /** 步行與周邊機能（若前端已載入） */
  locationContext?: {
    matchedAddress?: string;
    stationWalks?: Array<{ station: string; advertisedMinutes: number | null; normalMinutes: number; fastMinutes: number; slowMinutes: number }>;
    amenities?: Array<{ category: string; label: string; name: string; distanceMeters: number }>;
  } | null;
}

function Card({ title, tag, children }: { title: string; tag?: string; children: any }) {
  return (
    <View style={styles.card} wrap={false}>
      <View style={styles.cardHead}>
        <Text style={styles.cardTitle}>{title}</Text>
        {tag ? <Text style={styles.cardTag}>{tag}</Text> : null}
      </View>
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

function Cell({ label, value, wide }: { label: string; value: string | null | undefined; wide?: boolean }) {
  if (!value) return null;
  return (
    <View style={wide ? styles.gridCellWide : styles.gridCell}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <View>
      {items.map((item, i) => (
        <View key={i} style={styles.bullet}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export function ListingReportPdf({ result, title, generatedAt, shareUrl, locationContext }: ListingReportPdfProps) {
  const e = result?.extracted ?? {};
  const isSale = result?.dealType === "sale" || Boolean(result?.saleAnalysis);
  const stations: string[] = String(e.station || "").split(/[,，]/).map((s: string) => s.trim()).filter(Boolean);
  const walks: string[] = String(e.walkTime || "").split(/[,，]/).map((s: string) => s.trim()).filter(Boolean);
  const stationText = stations.map((s, i) => `${s}${walks[i] ? ` 徒步 ${walks[i]} 分` : ""}`).join("／");
  const dateText = generatedAt.toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric" });

  const buildingLine = [e.buildingName, e.roomNumber].filter(Boolean).join(" ");
  const headline = title || buildingLine || (isSale ? "買賣物件圖紙分析" : "租賃物件圖紙分析");

  return (
    <Document title={headline} author="LINUS 住好日" subject="物件圖紙分析結果">
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBar} fixed />
        {/* fixed 元素要放在會換頁的內容「之前」：放在最後面時，分頁流程會把它跟著
            最後一張卡片一起處理，實測整個頁尾消失。頁碼的 Text 也要自己標 fixed，
            render prop 才會在每一頁重新求值。 */}
        <View style={styles.footerRule} fixed />
        <Text style={[styles.footerText, styles.footerLeft]} fixed>
          LINUS 住好日｜日本租屋・買房知識與物件健檢　linus-niceday.com
        </Text>
        <Text style={[styles.footerText, styles.footerRight]} fixed render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />

        <View style={styles.body}>
        {/* 標題區：不需要 wrap={false}，它一定在第一頁最上面 */}
        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow}>PROPERTY LISTING DIAGNOSTICS</Text>
          <Text style={styles.title}>{headline}</Text>
          {buildingLine && buildingLine !== headline ? <Text style={styles.subtitle}>{buildingLine}</Text> : null}
          {e.address ? <Text style={styles.subtitle}>{e.address}</Text> : null}
          <Text style={styles.meta}>
            {isSale ? "買賣物件" : "租賃物件"}・分析日期 {dateText}
            {shareUrl ? `・線上版本 ${shareUrl}` : ""}
          </Text>
        </View>

        {/* 卡片 1：物件摘要 */}
        <Card title="物件摘要" tag="依圖紙讀取">
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
                <Cell label="管理費（月）" value={e.managementFee} />
                <Cell label="修繕積立金（月）" value={e.repairReserve} />
              </>
            ) : (
              <>
                <Cell label="賃料" value={e.rent} />
                <Cell label="管理費" value={e.managementFee} />
                <Cell label="敷金／礼金" value={[e.deposit || "—", e.keyMoney || "—"].join(" ／ ")} />
              </>
            )}
            <Cell label="交通" value={stationText || e.transitAccess} wide />
          </View>
        </Card>

        {isSale ? <SaleSections result={result} /> : <RentSections result={result} />}

        {/* 步行與周邊機能：只有前端已經查到才放 */}
        {locationContext && ((locationContext.stationWalks?.length ?? 0) > 0 || (locationContext.amenities?.length ?? 0) > 0) ? (
          <Card title="步行時間與周邊生活機能" tag="依圖紙地址即時查詢">
            {locationContext.matchedAddress ? (
              <Text style={{ fontSize: 7.5, color: INK_MUTE, marginBottom: 6 }}>定位地址：{locationContext.matchedAddress}</Text>
            ) : null}
            {(locationContext.stationWalks ?? []).map((w, i) => (
              <View key={i} style={[styles.tableRow, i === (locationContext.stationWalks!.length - 1) && !(locationContext.amenities?.length) ? styles.tableRowLast : {}]}>
                <Text style={styles.tdName}>{w.station}駅</Text>
                <Text style={[styles.tdAmount, { width: "22%" }]}>
                  {w.advertisedMinutes != null ? `圖紙 ${w.advertisedMinutes} 分` : ""}
                </Text>
                <Text style={[styles.tdNote, { width: "44%" }]}>
                  實際路徑：快走 {w.fastMinutes} 分・一般 {w.normalMinutes} 分・慢走 {w.slowMinutes} 分
                </Text>
              </View>
            ))}
            {(locationContext.amenities?.length ?? 0) > 0 ? (
              <View style={{ marginTop: 6 }}>
                <Text style={styles.label}>1.2 公里內最近的生活機能</Text>
                <Text style={{ fontSize: 8, lineHeight: 1.55 }}>
                  {nearestByCategory(locationContext.amenities!).map(a => `${a.label} ${Math.round(a.distanceMeters)}m`).join("・")}
                </Text>
              </View>
            ) : null}
          </Card>
        ) : null}

        {/* 免責：放最後一張卡，同樣不切頁 */}
        <View style={styles.disclaimer} wrap={false}>
          <Text style={styles.disclaimerText}>
            本報告由 LINUS 住好日依上傳圖紙自動產生，行情資料來自國土交通省「不動産情報ライブラリ」成約實價與各公開統計，僅供參考，不構成投資或契約建議。
            實際金額以正式契約、報價文件與仲介說明為準；圖紙與現況不符時以現況為準。
          </Text>
        </View>
        </View>
      </Page>
    </Document>
  );
}

function nearestByCategory(list: Array<{ category: string; label: string; distanceMeters: number }>) {
  const order = ["convenience", "supermarket", "pharmacy", "medical", "school", "park"];
  const nearest = new Map<string, { label: string; distanceMeters: number }>();
  for (const a of list) {
    const cur = nearest.get(a.category);
    if (!cur || a.distanceMeters < cur.distanceMeters) nearest.set(a.category, a);
  }
  return order.filter(k => nearest.has(k)).map(k => nearest.get(k)!);
}

/* ───────────── 租賃 ───────────── */

function RentSections({ result }: { result: any }) {
  const verdict = result?.verdict;
  const range = result?.range;
  const cost = result?.initialCostEstimate;
  const parsed = result?.parsed ?? {};
  const monthly = (parsed.rent ?? 0) + (parsed.managementFee ?? 0);
  const vs = verdict ? VERDICT_STYLE[verdict.status] ?? VERDICT_STYLE["待確認"] : null;

  return (
    <>
      {verdict ? (
        <Card title="租金行情判定" tag={range ? `同區同房型行情 ${yen(range.low)}～${yen(range.high)}` : undefined}>
          <View style={styles.bigNumberRow}>
            <Text style={styles.bigNumber}>{yen(monthly)}</Text>
            <Text style={styles.bigNumberNote}>／月（租金＋管理費）</Text>
          </View>
          <View style={[styles.verdictBox, { backgroundColor: vs!.bg, borderColor: vs!.border }]}>
            <Text style={[styles.verdictStatus, { color: vs!.color }]}>{verdict.status}</Text>
            <Text style={[styles.verdictHeadline, { color: vs!.color }]}>{verdict.headline}</Text>
            {verdict.detail ? <Text style={[styles.verdictDetail, { color: INK_SOFT }]}>{verdict.detail}</Text> : null}
          </View>
        </Card>
      ) : null}

      {cost ? (
        <Card title="簽約入住預估總費用" tag={cost.levelText}>
          <View style={styles.bigNumberRow}>
            <Text style={styles.bigNumber}>
              {yen(cost.totalMin)}{cost.totalMax !== cost.totalMin ? ` ～ ${yen(cost.totalMax)}` : ""}
            </Text>
            <Text style={styles.bigNumberNote}>約相當於月總租金的 {cost.monthsMultipleMin}～{cost.monthsMultipleMax} 倍</Text>
          </View>
          {(cost.items ?? []).map((it: any, i: number, arr: any[]) => (
            <View key={it.id ?? i} style={[styles.tableRow, i === arr.length - 1 ? styles.tableRowLast : {}]}>
              <Text style={styles.tdName}>{it.name}</Text>
              <Text style={[styles.tdAmount, it.isUnknown ? styles.tdUnknown : {}]}>{it.isUnknown ? "待確認" : yen(it.amount)}</Text>
              <Text style={styles.tdNote}>{it.note}</Text>
            </View>
          ))}
        </Card>
      ) : null}

      {cost?.tips?.length ? (
        <Card title="注意事項與建議">
          <Bullets items={cost.tips} />
        </Card>
      ) : null}
    </>
  );
}

/* ───────────── 買賣 ───────────── */

function SaleSections({ result }: { result: any }) {
  const s = result?.saleAnalysis;
  if (!s) return null;
  const m = s.mlitComparison;
  const vs = m ? SALE_VERDICT_STYLE[m.verdict] ?? VERDICT_STYLE["待確認"] : null;
  const holding = s.monthlyHoldingCosts;
  const health = s.buildingHealth;
  const init = s.initialCosts;
  const factors: any[] = m?.priceFactors ?? [];
  const referenceFactors = factors.filter(f => f.applied === false && f.label !== "屋齡");

  return (
    <>
      <Card title="價格定位" tag={m ? `${m.region ?? ""}${m.district ?? ""}・${m.layout ?? ""}` : "無對應行情分桶"}>
        <View style={styles.bigNumberRow}>
          <Text style={styles.bigNumber}>{man(s.salePriceMan)}</Text>
          {s.tsuboAndSqm?.sqmPriceMan ? (
            <Text style={styles.bigNumberNote}>{s.tsuboAndSqm.sqmPriceMan} 萬円/㎡・{s.tsuboAndSqm.tsuboPriceMan} 萬円/坪</Text>
          ) : null}
        </View>
        {m && vs ? (
          <View style={[styles.verdictBox, { backgroundColor: vs.bg, borderColor: vs.border }]}>
            <Text style={[styles.verdictStatus, { color: vs.color }]}>{m.verdictText}</Text>
            <Text style={[styles.verdictHeadline, { color: vs.color }]}>
              預期價約 {man(m.expectedPriceMan)}（合理區間 {man(m.fairLowMan)}～{man(m.fairHighMan)}），本案開價 {pct(m.diffPercent)}
            </Text>
            {m.typicalListingPriceMan ? (
              <Text style={[styles.verdictDetail, { color: INK_SOFT }]}>
                對照 {m.listingBenchmarkSourceLabel ?? "公開刊登平均"}：{man(m.typicalListingPriceMan)}，本案 {pct(m.listingDiffPercent)}
              </Text>
            ) : null}
          </View>
        ) : (
          <Text style={{ fontSize: 8, color: INK_MUTE }}>此房型或地區缺少可比對的成交資料，未給出價格判定。</Text>
        )}
      </Card>

      {m ? (
        <Card title="這個判斷是根據什麼" tag="可自行驗算">
          <View style={styles.stepBlock}>
            <Text style={styles.stepLabel}>① 比較對象</Text>
            <Text style={styles.stepText}>
              {m.region ?? ""}{m.district ?? ""}・{m.layout ?? ""}{m.marketAgeBand ? `・${ageBandLabel(m.marketAgeBand)}` : ""}
              {typeof m.sampleCount === "number" ? `　國土交通省實際成交 ${m.sampleCount} 筆` : ""}
              {m.periodStart && m.periodEnd ? `（${m.periodStart}～${m.periodEnd}）` : ""}
            </Text>
            {typeof m.medianSqmPriceYen === "number" ? (
              <Text style={styles.stepText}>成交㎡單價中位數 {(m.medianSqmPriceYen / 10000).toFixed(1)} 萬円/㎡</Text>
            ) : null}
          </View>
          {typeof m.medianSqmPriceYen === "number" && s.areaSqm ? (
            <View style={styles.stepBlock}>
              <Text style={styles.stepLabel}>② 換算本案</Text>
              <Text style={styles.mono}>
                {(m.medianSqmPriceYen / 10000).toFixed(1)} 萬/㎡ × {s.areaSqm}㎡ = {man(m.expectedPriceMan)}　→　本案開價 {pct(m.diffPercent)}
              </Text>
            </View>
          ) : null}
          {m.typicalListingPriceMan ? (
            <View style={styles.stepBlock}>
              <Text style={styles.stepLabel}>③ 另一個來源交叉驗證</Text>
              <Text style={styles.stepText}>
                {m.listingBenchmarkSourceLabel ?? "公開刊登平均"}{m.listingBenchmarkScopeLabel ? `（${m.listingBenchmarkScopeLabel}）` : ""} {man(m.typicalListingPriceMan)}，本案 {pct(m.listingDiffPercent)}。
                這是「開價對開價」的同口徑比較，與成交價比較彼此獨立。
              </Text>
            </View>
          ) : null}
          <View style={[styles.stepBlock, styles.stepBlockLast]}>
            <Text style={styles.stepLabel}>④ 可以解釋價差的條件（未計入試算）</Text>
            {referenceFactors.length ? (
              <Bullets items={referenceFactors.map(f => `${f.label}：${f.note}`)} />
            ) : (
              <Text style={{ fontSize: 8, color: INK_MUTE }}>圖紙未讀到可補充的條件。</Text>
            )}
            <Text style={{ fontSize: 7, color: INK_MUTE, marginTop: 3 }}>
              國交省成交資料不含徒步、樓層與周邊機能欄位，無法量化，因此不列入試算；這些是價差出現時最該向仲介確認的地方。
            </Text>
          </View>
        </Card>
      ) : null}

      {holding ? (
        <Card title="每月持有成本" tag={`合計 ${yen(holding.totalMonthlyHoldingCost)}／月`}>
          {(holding.items ?? []).map((it: any, i: number, arr: any[]) => (
            <View key={i} style={[styles.tableRow, i === arr.length - 1 ? styles.tableRowLast : {}]}>
              <Text style={styles.tdName}>{it.name}</Text>
              <Text style={styles.tdAmount}>{yen(it.amount)}</Text>
              <Text style={styles.tdNote}>{it.note}</Text>
            </View>
          ))}
          {health?.reserveHealthText ? (
            <Text style={{ fontSize: 8, marginTop: 6, color: INK_SOFT }}>
              修繕積立金體質：{health.reserveHealthText}{health.reserveHealthNote ? `。${health.reserveHealthNote}` : ""}
            </Text>
          ) : null}
        </Card>
      ) : null}

      {init?.items?.length ? (
        <Card title="購入初期費用（預估）" tag={`合計約 ${yen(init.total)}${init.percentageOfPrice ? `・約房價 ${init.percentageOfPrice}%` : ""}`}>
          {init.items.map((it: any, i: number, arr: any[]) => (
            <View key={it.id ?? i} style={[styles.tableRow, i === arr.length - 1 ? styles.tableRowLast : {}]}>
              <Text style={styles.tdName}>{it.name}</Text>
              <Text style={styles.tdAmount}>{yen(it.amount)}</Text>
              <Text style={styles.tdNote}>{it.note}</Text>
            </View>
          ))}
        </Card>
      ) : null}

      {(m?.priceCautions?.length || health?.specialCautions?.length || health?.specialStrengths?.length) ? (
        <Card title="注意事項與亮點">
          {health?.specialStrengths?.length ? (
            <View style={{ marginBottom: 4 }}>
              <Text style={styles.label}>亮點</Text>
              <Bullets items={health.specialStrengths} />
            </View>
          ) : null}
          {(m?.priceCautions?.length || health?.specialCautions?.length) ? (
            <View>
              <Text style={styles.label}>注意</Text>
              <Bullets items={[...(m?.priceCautions ?? []), ...(health?.specialCautions ?? [])]} />
            </View>
          ) : null}
        </Card>
      ) : null}
    </>
  );
}

function ageBandLabel(band: string): string {
  const m = band.match(/^age_(\d+)_(\d+|plus)$/);
  if (!m) return band;
  return m[2] === "plus" ? `築 ${m[1]} 年以上` : `築 ${m[1]}～${m[2]} 年`;
}
