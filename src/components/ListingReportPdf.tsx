import { Document, Font, Image, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { linusContact } from "../data/rentGuideData";
import { buildRentalConditionSections } from "../lib/rentalConditionDisplay";
import { formatShikibiki } from "../lib/listingExtraction";
import { parseAndExplainSpecialNotes } from "../lib/specialNotesParser";
import { parseEquipmentList, type ParsedEquipmentItem } from "../lib/equipmentParser";

/**
 * 圖紙分析結果的 PDF 版型。
 *
 * 內容對齊網站分享頁的每一個區塊，資料整理直接重用網站的 lib（租賃條件分組、
 * 特約解讀、設備解析），不另寫一套會各自飄移的邏輯。
 *
 * 版面規則：
 * - 每一張卡片都是 wrap={false} 的 View，保證不會被切到兩頁；一頁塞不下就整張換頁。
 * - 最後一頁固定是聯絡頁（LINE／WeChat QR、社群與 email）。
 * - 配色、字型與網站一致（品牌綠 #00A174／#007D5A、墨色 #1A2A22、線 #DDE3DF、淺底 #F5F8F6）。
 *
 * 字型只在建立 PDF 時才註冊與下載（見 ListingHealthCheck 的下載流程），
 * 主字型兩個檔各約 7MB、補字型各 0.9MB，不放進主 bundle，瀏覽器會快取。
 */

export const SITE_URL = "https://linus-niceday-japan-realestate.vercel.app";
const SITE_HOST = "linus-niceday-japan-realestate.vercel.app";

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

/* ───────────── 色票（與網站一致） ───────────── */
const INK = "#1A2A22";
const INK_SOFT = "#3F5147";
const INK_MUTE = "#66736C";
const LINE = "#DDE3DF";
const LINE_SOFT = "#EEF2F0";
const SOFT_BG = "#F5F8F6";
const GREEN = "#00A174";
const GREEN_DEEP = "#007D5A";
const GREEN_SOFT = "#E6F6F1";
const GREEN_LINE = "#9EE2CF";
const AMBER_DEEP = "#7A5A1F";
const AMBER_SOFT = "#FFF9ED";
const AMBER_LINE = "#DCC8A1";
const ORANGE = "#E94E2B";
const ORANGE_DEEP = "#B13818";
const ORANGE_SOFT = "#FBDFD2";
const BLUE_SOFT = "#F2F8FA";
const BLUE_LINE = "#D6EAF0";
const BLUE_DEEP = "#3F626D";
const LINE_GREEN = "#06C755";
const WECHAT_GREEN = "#07C160";

const styles = StyleSheet.create({
  page: {
    fontFamily: ["NotoSansTC", "NotoSansJPSupplement"],
    fontSize: 9,
    color: INK,
    paddingTop: 52,
    paddingBottom: 54,
    paddingHorizontal: 40,
    // lineHeight 不放這裡：react-pdf 的 render prop（頁碼）Text 只要繼承到任何
    // lineHeight 就不會渲染（實測）。內容的預設行高改設在 body 上，頁尾維持乾淨。
  },
  body: { lineHeight: 1.5 },

  /* 固定頁首／頁尾 */
  headerBar: { position: "absolute", top: 0, left: 0, right: 0, height: 5, backgroundColor: GREEN },
  headerLeft: { position: "absolute", top: 16, left: 40, fontSize: 8, fontWeight: 700, color: INK },
  headerRight: { position: "absolute", top: 16, right: 40, fontSize: 7.5, color: INK_MUTE },
  headerRule: { position: "absolute", top: 34, left: 40, right: 40, borderTopWidth: 1, borderTopColor: LINE },
  footerRule: { position: "absolute", bottom: 34, left: 40, right: 40, borderTopWidth: 1, borderTopColor: LINE },
  // 不能有 lineHeight，否則右側用 render prop 的頁碼不會出現（見 page 樣式的說明）。
  footerText: { fontSize: 6.5, color: INK_MUTE },
  footerLeft: { position: "absolute", bottom: 22, left: 40 },
  footerRight: { position: "absolute", bottom: 22, right: 40 },

  /* 標題區 */
  titleBlock: { marginBottom: 12 },
  eyebrow: { fontSize: 7.5, color: GREEN_DEEP, fontWeight: 700, letterSpacing: 1.5, marginBottom: 4 },
  title: { fontSize: 18, fontWeight: 700, lineHeight: 1.3 },
  subtitle: { fontSize: 8.5, color: INK_SOFT, marginTop: 3 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 6 },
  chip: { borderWidth: 1, borderColor: LINE, backgroundColor: SOFT_BG, paddingHorizontal: 6, paddingVertical: 2, marginRight: 4, marginBottom: 4, fontSize: 7, color: INK_SOFT },
  chipAccent: { borderColor: GREEN_LINE, backgroundColor: GREEN_SOFT, color: GREEN_DEEP, fontWeight: 700 },

  /* KPI 列 */
  kpiRow: { flexDirection: "row", marginBottom: 12 },
  kpi: { flex: 1, borderWidth: 1, borderColor: LINE, backgroundColor: "#FFFFFF", padding: 8, marginRight: 6 },
  kpiLast: { marginRight: 0 },
  kpiLabel: { fontSize: 6.5, color: INK_MUTE, letterSpacing: 0.5, marginBottom: 2 },
  kpiValue: { fontSize: 14, fontWeight: 700, lineHeight: 1.25 },
  kpiNote: { fontSize: 6.5, color: INK_MUTE, marginTop: 2 },

  /* 卡片 */
  card: { borderWidth: 1, borderColor: LINE, marginBottom: 10 },
  cardHead: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: SOFT_BG, borderBottomWidth: 1, borderBottomColor: LINE,
    paddingVertical: 6, paddingHorizontal: 10,
  },
  cardTitleRow: { flexDirection: "row", alignItems: "center" },
  cardAccent: { width: 3, height: 11, backgroundColor: GREEN, marginRight: 6 },
  cardTitle: { fontSize: 9.5, fontWeight: 700 },
  cardTag: { fontSize: 7, color: INK_MUTE },
  cardBody: { paddingVertical: 8, paddingHorizontal: 10 },

  sectionLabel: { fontSize: 7, fontWeight: 700, color: INK_MUTE, letterSpacing: 1, marginBottom: 3 },
  subBlock: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: LINE_SOFT },
  subBlockLast: { borderBottomWidth: 0 },

  grid: { flexDirection: "row", flexWrap: "wrap" },
  gridCell: { width: "33.33%", paddingRight: 8, marginBottom: 6 },
  gridCellHalf: { width: "50%", paddingRight: 8, marginBottom: 6 },
  gridCellWide: { width: "100%", marginBottom: 6 },
  label: { fontSize: 7, color: INK_MUTE, marginBottom: 1 },
  value: { fontSize: 9.5, fontWeight: 700 },
  valueSmall: { fontSize: 8.5 },

  verdictBox: { borderWidth: 1, padding: 8, marginBottom: 6 },
  verdictStatus: { fontSize: 7, fontWeight: 700, letterSpacing: 1, marginBottom: 3 },
  verdictHeadline: { fontSize: 10, fontWeight: 700, lineHeight: 1.45 },
  verdictDetail: { fontSize: 8, marginTop: 4, lineHeight: 1.55, color: INK_SOFT },

  // 行高不能靠繼承：react-pdf 把 page 的 lineHeight 1.5 算成 13.5pt 後往下傳，
  // 20pt 的數字會被壓在 13.5pt 的行裡、跟下一個區塊重疊。每個大字都自己設。
  bigNumberRow: { flexDirection: "row", alignItems: "flex-end", flexWrap: "wrap", marginBottom: 8 },
  bigNumber: { fontSize: 20, fontWeight: 700, lineHeight: 1.25 },
  bigNumberNote: { fontSize: 8, color: INK_SOFT, marginLeft: 8, marginBottom: 3, lineHeight: 1.4 },

  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: LINE_SOFT, paddingVertical: 4 },
  tableRowLast: { borderBottomWidth: 0 },
  tdName: { width: "34%", fontSize: 8.5, fontWeight: 700, paddingRight: 6 },
  tdAmount: { width: "18%", fontSize: 8.5, fontWeight: 700, textAlign: "right", paddingRight: 8 },
  tdNote: { width: "48%", fontSize: 7.5, color: INK_SOFT, lineHeight: 1.45 },
  tdUnknown: { color: INK_MUTE, fontWeight: 400 },

  /* 因素表（含小長條） */
  factorRow: { flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: LINE_SOFT, paddingVertical: 4 },
  factorLabel: { width: "24%", fontSize: 8.5, fontWeight: 700, paddingRight: 6, lineHeight: 1.3, justifyContent: "center" },
  factorNote: { width: "48%", fontSize: 7.5, color: INK_SOFT, lineHeight: 1.45, paddingRight: 6 },
  factorBarWrap: { width: "16%", paddingRight: 6 },
  factorBarTrack: { height: 5, backgroundColor: LINE_SOFT, flexDirection: "row" },
  factorPct: { width: "12%", fontSize: 8.5, fontWeight: 700, textAlign: "right" },
  factorRef: { fontSize: 6.5, color: INK_MUTE, fontWeight: 400 },

  bullet: { flexDirection: "row", marginBottom: 3 },
  bulletDot: { width: 10, fontSize: 8, color: GREEN_DEEP },
  bulletText: { flex: 1, fontSize: 8, lineHeight: 1.5 },

  /* 設備 */
  tagWrap: { flexDirection: "row", flexWrap: "wrap" },
  tag: { borderWidth: 1, borderColor: LINE, paddingHorizontal: 5, paddingVertical: 2, marginRight: 4, marginBottom: 4, fontSize: 7, color: INK_SOFT },
  tagHighlight: { borderColor: GREEN_LINE, backgroundColor: GREEN_SOFT, color: GREEN_DEEP, fontWeight: 700 },

  /* 特約 */
  condRow: { flexDirection: "row", paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: LINE_SOFT },
  condRowTitle: { width: "22%", fontSize: 8, fontWeight: 700, paddingRight: 6, paddingTop: 1 },
  condRowBody: { flex: 1 },
  noteItem: { flexDirection: "row", paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: LINE_SOFT },
  noteBadge: { width: 46, fontSize: 6.5, color: INK_MUTE, paddingTop: 1 },
  noteBody: { flex: 1 },
  noteTitle: { fontSize: 8.5, fontWeight: 700 },
  noteText: { fontSize: 7.5, color: INK_SOFT, lineHeight: 1.45, marginTop: 1 },

  disclaimer: { marginTop: 4, borderWidth: 1, borderColor: LINE, backgroundColor: SOFT_BG, padding: 8 },
  disclaimerText: { fontSize: 7, color: INK_SOFT, lineHeight: 1.5 },

  /* 聯絡頁 */
  contactHero: { borderWidth: 1, borderColor: GREEN_LINE, backgroundColor: GREEN_SOFT, padding: 14, flexDirection: "row", alignItems: "center", marginBottom: 12 },
  contactLogo: { width: 64, height: 64, marginRight: 14 },
  contactTitle: { fontSize: 15, fontWeight: 700, color: GREEN_DEEP, lineHeight: 1.3 },
  contactLead: { fontSize: 8.5, color: INK_SOFT, marginTop: 4, lineHeight: 1.55 },
  qrRow: { flexDirection: "row", marginBottom: 12 },
  qrCard: { flex: 1, borderWidth: 1, borderColor: LINE, padding: 12, alignItems: "center", marginRight: 10 },
  qrCardLast: { marginRight: 0 },
  qrBrand: { fontSize: 9, fontWeight: 700, color: "#FFFFFF", paddingHorizontal: 10, paddingVertical: 3, marginBottom: 8 },
  qrImage: { width: 128, height: 128, marginBottom: 8 },
  qrId: { fontSize: 11, fontWeight: 700, letterSpacing: 0.5 },
  qrHint: { fontSize: 7, color: INK_MUTE, marginTop: 3, textAlign: "center", lineHeight: 1.45 },
  channelRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 10 },
  channel: { width: "50%", paddingRight: 8, marginBottom: 8 },
  channelName: { fontSize: 7, color: INK_MUTE, letterSpacing: 0.5 },
  channelValue: { fontSize: 9, fontWeight: 700, color: GREEN_DEEP, textDecoration: "none" },
  companyBox: { borderTopWidth: 1, borderTopColor: LINE, paddingTop: 8 },
  companyText: { fontSize: 7.5, color: INK_SOFT, lineHeight: 1.55 },
});

/* ───────────── 判定配色 ───────────── */
type Tone = { bg: string; border: string; color: string };
const TONE_GREEN: Tone = { bg: GREEN_SOFT, border: GREEN_LINE, color: GREEN_DEEP };
const TONE_AMBER: Tone = { bg: AMBER_SOFT, border: AMBER_LINE, color: AMBER_DEEP };
const TONE_ORANGE: Tone = { bg: ORANGE_SOFT, border: ORANGE, color: ORANGE_DEEP };
const TONE_BLUE: Tone = { bg: BLUE_SOFT, border: BLUE_LINE, color: BLUE_DEEP };
const VERDICT_TONE: Record<string, Tone> = {
  "超值": TONE_GREEN, "合理": TONE_GREEN, "符合": TONE_GREEN, "部分符合": TONE_GREEN,
  "條件反映": TONE_AMBER, "需調整": TONE_AMBER,
  "偏高": TONE_ORANGE, "難度高": TONE_ORANGE,
  "待確認": TONE_BLUE,
};
const SALE_TONE: Record<string, Tone> = { bargain: TONE_GREEN, fair: TONE_GREEN, premium: TONE_AMBER };

/* ───────────── 格式化 ───────────── */
const yen = (v: number | null | undefined) =>
  typeof v === "number" && Number.isFinite(v) ? `¥${Math.round(v).toLocaleString("ja-JP")}` : "—";
const man = (v: number | null | undefined) =>
  typeof v === "number" && Number.isFinite(v) ? `${Math.round(v).toLocaleString("ja-JP")} 萬円` : "—";
const pct = (v: number | null | undefined, digits = 1) =>
  typeof v === "number" && Number.isFinite(v) ? `${v >= 0 ? "+" : ""}${v.toFixed(digits)}%` : "—";
const splitList = (s: unknown) => String(s || "").split(/[,，]/).map(v => v.trim()).filter(Boolean);

function ageBandLabel(band: string): string {
  const m = band.match(/^age_(\d+)_(\d+|plus)$/);
  if (!m) return band;
  return m[2] === "plus" ? `築 ${m[1]} 年以上` : `築 ${m[1]}～${m[2]} 年`;
}

/* ───────────── Props ───────────── */
export interface ListingReportPdfProps {
  /** 直接吃 /api/analyze-listing 的回傳物件；型別放寬，避免與前端型別耦合太緊 */
  result: any;
  title: string;
  generatedAt: Date;
  shareUrl?: string | null;
  /** 圖片素材的根路徑：瀏覽器用 ""（相對站根），Node 端測試用檔案絕對路徑 */
  assetBase?: string;
  /** 步行與周邊機能（若前端已載入） */
  locationContext?: {
    matchedAddress?: string;
    stationWalks?: Array<{ station: string; advertisedMinutes: number | null; normalMinutes: number; fastMinutes: number; slowMinutes: number; needsAttention?: boolean }>;
    amenities?: Array<{ category: string; label: string; name: string; distanceMeters: number }>;
  } | null;
  /** 使用者輸入的通勤試算（若有） */
  commute?: {
    destination?: string;
    totalMinutes?: number | null;
    transfers?: number | null;
    summary?: string;
  } | null;
}

/* ───────────── 共用小元件 ───────────── */
function Card({ title, tag, children }: { title: string; tag?: string; children: any }) {
  return (
    <View style={styles.card} wrap={false}>
      <View style={styles.cardHead}>
        <View style={styles.cardTitleRow}>
          <View style={styles.cardAccent} />
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
        {tag ? <Text style={styles.cardTag}>{tag}</Text> : null}
      </View>
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

function Cell({ label, value, wide, half }: { label: string; value: string | null | undefined; wide?: boolean; half?: boolean }) {
  if (!value) return null;
  return (
    <View style={wide ? styles.gridCellWide : half ? styles.gridCellHalf : styles.gridCell}>
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

function VerdictBox({ tone, status, headline, detail }: { tone: Tone; status: string; headline: string; detail?: string | null }) {
  return (
    <View style={[styles.verdictBox, { backgroundColor: tone.bg, borderColor: tone.border }]}>
      <Text style={[styles.verdictStatus, { color: tone.color }]}>{status}</Text>
      <Text style={[styles.verdictHeadline, { color: tone.color }]}>{headline}</Text>
      {detail ? <Text style={styles.verdictDetail}>{detail}</Text> : null}
    </View>
  );
}

/** 影響價格的因素表：與網站同樣用小長條表示強度，滿格 ±15%。 */
function FactorTable({ factors, scale = 15 }: { factors: Array<{ label: string; ratePercent: number; note: string; applied?: boolean }>; scale?: number }) {
  return (
    <View>
      {factors.map((f, i) => {
        const reference = f.applied === false;
        const width = Math.min(100, (Math.abs(f.ratePercent) / scale) * 100);
        const color = reference ? "#B6BFBA" : f.ratePercent > 0 ? "#D97706" : f.ratePercent < 0 ? GREEN_DEEP : "#8A9590";
        return (
          <View key={i} style={[styles.factorRow, i === factors.length - 1 ? styles.tableRowLast : {}]}>
            <View style={styles.factorLabel}>
              <Text>{f.label}</Text>
              {reference ? <Text style={styles.factorRef}>參考・未計入</Text> : null}
            </View>
            <Text style={styles.factorNote}>{f.note}</Text>
            <View style={styles.factorBarWrap}>
              <View style={styles.factorBarTrack}>
                <View style={{ width: `${width}%`, height: 5, backgroundColor: color }} />
              </View>
            </View>
            <Text style={[styles.factorPct, { color }]}>{reference ? `(${pct(f.ratePercent)})` : pct(f.ratePercent)}</Text>
          </View>
        );
      })}
    </View>
  );
}

function EquipmentCard({ items }: { items: ParsedEquipmentItem[] }) {
  if (!items.length) return null;
  const categories = [...new Set(items.map(i => i.category))];
  return (
    <Card title="設備與規格" tag={`共 ${items.length} 項・綠底為高價值設備`}>
      {categories.map((category, ci) => (
        <View key={category} style={[styles.subBlock, ci === categories.length - 1 ? styles.subBlockLast : {}]}>
          <Text style={styles.sectionLabel}>{category}</Text>
          <View style={styles.tagWrap}>
            {items.filter(i => i.category === category).map((item, i) => (
              <Text key={i} style={[styles.tag, item.highlight ? styles.tagHighlight : {}]}>{item.nameZh}</Text>
            ))}
          </View>
        </View>
      ))}
    </Card>
  );
}

function SpecialNotesCard({ notes }: { notes: unknown }) {
  const items = parseAndExplainSpecialNotes(typeof notes === "string" ? notes : "");
  if (!items.length) return null;
  return (
    <Card title="重要特約與法務事項" tag="依圖紙備考與特約整理">
      {items.map((item, i) => (
        <View key={i} style={[styles.noteItem, i === items.length - 1 ? styles.tableRowLast : {}]}>
          <Text style={styles.noteBadge}>{item.category}</Text>
          <View style={styles.noteBody}>
            <Text style={styles.noteTitle}>{item.title}</Text>
            <Text style={styles.noteText}>{item.explanation}</Text>
          </View>
        </View>
      ))}
    </Card>
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

function LocationCard({ locationContext, commute }: Pick<ListingReportPdfProps, "locationContext" | "commute">) {
  const walks = locationContext?.stationWalks ?? [];
  const amenities = locationContext?.amenities ?? [];
  if (!walks.length && !amenities.length && !commute) return null;
  return (
    <Card title="位置與生活機能" tag="依圖紙地址即時查詢">
      {locationContext?.matchedAddress ? (
        <Text style={{ fontSize: 7.5, color: INK_MUTE, marginBottom: 6 }}>定位地址：{locationContext.matchedAddress}</Text>
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
          <Text style={{ fontSize: 8, lineHeight: 1.6 }}>
            {nearestByCategory(amenities).map(a => `${a.label} ${Math.round(a.distanceMeters)}m`).join("　・　")}
          </Text>
        </View>
      ) : null}
      {commute ? (
        <View style={[styles.subBlock, styles.subBlockLast]}>
          <Text style={styles.sectionLabel}>我的實際通勤試算</Text>
          <Text style={{ fontSize: 8.5 }}>
            {commute.destination ? `到「${commute.destination}」` : ""}
            {typeof commute.totalMinutes === "number" ? `約 ${commute.totalMinutes} 分鐘` : ""}
            {typeof commute.transfers === "number" ? `・轉乘 ${commute.transfers} 次` : ""}
          </Text>
          {commute.summary ? <Text style={{ fontSize: 7.5, color: INK_SOFT, marginTop: 2 }}>{commute.summary}</Text> : null}
        </View>
      ) : null}
    </Card>
  );
}

/* ───────────── 主文件 ───────────── */
export function ListingReportPdf({ result, title, generatedAt, shareUrl, assetBase = "", locationContext, commute }: ListingReportPdfProps) {
  const e = result?.extracted ?? {};
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
          <View style={styles.titleBlock}>
            <Text style={styles.eyebrow}>PROPERTY LISTING DIAGNOSTICS</Text>
            <Text style={styles.title}>{headline}</Text>
            {buildingLine && buildingLine !== headline ? <Text style={styles.subtitle}>{buildingLine}</Text> : null}
            {e.address ? <Text style={styles.subtitle}>{e.address}</Text> : null}
            <View style={styles.chipRow}>
              <Text style={[styles.chip, styles.chipAccent]}>{isSale ? "買賣物件" : "租賃物件"}</Text>
              {e.layout ? <Text style={styles.chip}>{e.layout}</Text> : null}
              {e.area ? <Text style={styles.chip}>{e.area}</Text> : null}
              {e.age ? <Text style={styles.chip}>築 {e.age}</Text> : null}
              {shareUrl ? <Text style={styles.chip}>線上版本 {shareUrl}</Text> : null}
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

/* ───────────── KPI 列 ───────────── */
function RentKpis({ result }: { result: any }) {
  const parsed = result?.parsed ?? {};
  const monthly = (parsed.rent ?? 0) + (parsed.managementFee ?? 0);
  const cost = result?.initialCostEstimate;
  const verdict = result?.verdict;
  const tone = verdict ? VERDICT_TONE[verdict.status] ?? TONE_BLUE : TONE_BLUE;
  return (
    <View style={styles.kpiRow}>
      <View style={styles.kpi}>
        <Text style={styles.kpiLabel}>每月總負擔</Text>
        <Text style={styles.kpiValue}>{yen(monthly)}</Text>
        <Text style={styles.kpiNote}>租金 {yen(parsed.rent)}＋管理費 {yen(parsed.managementFee)}</Text>
      </View>
      <View style={styles.kpi}>
        <Text style={styles.kpiLabel}>簽約入住預估總費用</Text>
        <Text style={styles.kpiValue}>{cost ? yen(cost.totalMax) : "—"}</Text>
        <Text style={styles.kpiNote}>{cost ? `約 ${cost.monthsMultipleMin}～${cost.monthsMultipleMax} 個月租金` : "圖紙資訊不足"}</Text>
      </View>
      <View style={[styles.kpi, styles.kpiLast, { backgroundColor: tone.bg, borderColor: tone.border }]}>
        <Text style={[styles.kpiLabel, { color: tone.color }]}>租金行情判定</Text>
        <Text style={[styles.kpiValue, { color: tone.color }]}>{verdict?.status ?? "待確認"}</Text>
        <Text style={[styles.kpiNote, { color: tone.color }]}>{result?.range ? `同區行情 ${yen(result.range.low)}～${yen(result.range.high)}` : "無可比對行情"}</Text>
      </View>
    </View>
  );
}

function SaleKpis({ result }: { result: any }) {
  const s = result?.saleAnalysis;
  const m = s?.mlitComparison;
  const tone = m ? SALE_TONE[m.verdict] ?? TONE_BLUE : TONE_BLUE;
  return (
    <View style={styles.kpiRow}>
      <View style={styles.kpi}>
        <Text style={styles.kpiLabel}>開價</Text>
        <Text style={styles.kpiValue}>{man(s?.salePriceMan)}</Text>
        <Text style={styles.kpiNote}>{s?.tsuboAndSqm?.sqmPriceMan ? `${s.tsuboAndSqm.sqmPriceMan} 萬円/㎡・${s.tsuboAndSqm.tsuboPriceMan} 萬円/坪` : ""}</Text>
      </View>
      <View style={styles.kpi}>
        <Text style={styles.kpiLabel}>每月持有成本</Text>
        <Text style={styles.kpiValue}>{yen(s?.monthlyHoldingCosts?.totalMonthlyHoldingCost)}</Text>
        <Text style={styles.kpiNote}>管理費＋修繕積立金等</Text>
      </View>
      <View style={[styles.kpi, styles.kpiLast, { backgroundColor: tone.bg, borderColor: tone.border }]}>
        <Text style={[styles.kpiLabel, { color: tone.color }]}>價格定位</Text>
        <Text style={[styles.kpiValue, { color: tone.color }]}>{m ? pct(m.diffPercent) : "—"}</Text>
        <Text style={[styles.kpiNote, { color: tone.color }]}>{m ? `相對預期價 ${man(m.expectedPriceMan)}` : "無可比對成交資料"}</Text>
      </View>
    </View>
  );
}

/* ───────────── 租賃 ───────────── */
function RentSections({ result }: { result: any }) {
  const e = result?.extracted ?? {};
  const verdict = result?.verdict;
  const range = result?.range;
  const cost = result?.initialCostEstimate;
  const parsed = result?.parsed ?? {};
  const monthly = (parsed.rent ?? 0) + (parsed.managementFee ?? 0);
  const tone = verdict ? VERDICT_TONE[verdict.status] ?? TONE_BLUE : TONE_BLUE;
  const factors: any[] = verdict?.factors ?? [];
  const shikibikiPattern = /(?:解約時)?(?:敷金)?(?:償却|敷引)\s*(\d+(?:\.\d+)?(?:ヶ月|ヵ月|カ月|個月)?)/;
  const rawShikibiki = e.shikibiki || e.deposit?.match(shikibikiPattern)?.[0] || e.specialNotes?.match(shikibikiPattern)?.[0] || "";
  const sections = buildRentalConditionSections({
    rentalConditions: e.rentalConditions,
    optionalFacilities: e.optionalFacilities,
    specialNotes: e.specialNotes,
    shikibiki: formatShikibiki(rawShikibiki),
  });

  return (
    <>
      {verdict ? (
        <Card title="租金行情診斷" tag={range ? `同區同房型行情 ${yen(range.low)}～${yen(range.high)}（中位 ${yen(range.median)}）` : undefined}>
          <View style={styles.bigNumberRow}>
            <Text style={styles.bigNumber}>{yen(monthly)}</Text>
            <Text style={styles.bigNumberNote}>／月（租金＋管理費）</Text>
          </View>
          <VerdictBox tone={tone} status={verdict.status} headline={verdict.headline} detail={verdict.detail} />
          {factors.length ? (
            <View>
              <Text style={styles.sectionLabel}>影響價格的主要因素與評估依據（長條滿格 ±15%）</Text>
              <FactorTable factors={factors} />
            </View>
          ) : null}
          {range?.sourceLabel ? (
            <Text style={{ fontSize: 6.5, color: INK_MUTE, marginTop: 4 }}>行情來源：{range.sourceLabel}{range.sourceDate ? `（${range.sourceDate}）` : ""}</Text>
          ) : null}
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
        <Card title="簽約與初期費用提醒">
          <Bullets items={cost.tips} />
        </Card>
      ) : null}

      {/* 與網站「重要特約與法務事項」同一份資料：每個小區塊各自不斷頁，一頁放不下就整塊換頁。 */}
      {sections.map((section, si) => (
        <Card
          key={section.title}
          title={`重要特約與法務事項｜${section.title}`}
          tag={si === 0 ? "彙整圖紙刊載之重點特約與條款，簽約前請詳閱重要事項說明" : undefined}
        >
          {section.rows.map((row, ri) => (
            <View key={row.title} style={[styles.condRow, ri === section.rows.length - 1 ? styles.tableRowLast : {}]}>
              <Text style={styles.condRowTitle}>{row.title}</Text>
              <View style={styles.condRowBody}>
                <Bullets items={row.items} />
              </View>
            </View>
          ))}
        </Card>
      ))}
    </>
  );
}

/* ───────────── 買賣 ───────────── */
function SaleSections({ result }: { result: any }) {
  const s = result?.saleAnalysis;
  if (!s) return null;
  const m = s.mlitComparison;
  const tone = m ? SALE_TONE[m.verdict] ?? TONE_BLUE : TONE_BLUE;
  const holding = s.monthlyHoldingCosts;
  const health = s.buildingHealth;
  const occ = s.occupancyAssessment;
  const init = s.initialCosts;
  const factors: any[] = m?.priceFactors ?? [];
  const applied = factors.filter(f => f.applied !== false);
  const reference = factors.filter(f => f.applied === false && f.label !== "屋齡");

  return (
    <>
      <Card title="價格定位" tag={m ? `${m.region ?? ""}${m.district ?? ""}・${m.layout ?? ""}` : "無對應行情分桶"}>
        <View style={styles.bigNumberRow}>
          <Text style={styles.bigNumber}>{man(s.salePriceMan)}</Text>
          {s.tsuboAndSqm?.sqmPriceMan ? (
            <Text style={styles.bigNumberNote}>{s.tsuboAndSqm.sqmPriceMan} 萬円/㎡・{s.tsuboAndSqm.tsuboPriceMan} 萬円/坪</Text>
          ) : null}
        </View>
        {m ? (
          <VerdictBox
            tone={tone}
            status={m.verdictText}
            headline={`預期價約 ${man(m.expectedPriceMan)}（合理區間 ${man(m.fairLowMan)}～${man(m.fairHighMan)}），本案開價 ${pct(m.diffPercent)}`}
            detail={m.typicalListingPriceMan ? `對照 ${m.listingBenchmarkSourceLabel ?? "公開刊登平均"}：${man(m.typicalListingPriceMan)}，本案 ${pct(m.listingDiffPercent)}。` : null}
          />
        ) : (
          <Text style={{ fontSize: 8, color: INK_MUTE }}>此房型或地區缺少可比對的成交資料，未給出價格判定。</Text>
        )}
        {m?.baselineNote ? <Text style={{ fontSize: 7.5, color: GREEN_DEEP, marginBottom: 4 }}>{m.baselineNote}</Text> : null}
        {applied.length || reference.length ? (
          <View>
            <Text style={styles.sectionLabel}>影響價格的主要因素與評估依據（標示「參考」者為業界經驗值，未計入試算）</Text>
            <FactorTable factors={[...applied, ...reference]} />
          </View>
        ) : null}
      </Card>

      {m ? (
        <Card title="這個判斷是根據什麼" tag="可自行驗算">
          <View style={styles.subBlock}>
            <Text style={styles.sectionLabel}>① 比較對象</Text>
            <Text style={styles.valueSmall}>
              {m.region ?? ""}{m.district ?? ""}・{m.layout ?? ""}{m.marketAgeBand ? `・${ageBandLabel(m.marketAgeBand)}` : ""}
              {typeof m.sampleCount === "number" ? `　國土交通省實際成交 ${m.sampleCount} 筆` : ""}
              {m.periodStart && m.periodEnd ? `（${m.periodStart}～${m.periodEnd}）` : ""}
            </Text>
            {typeof m.medianSqmPriceYen === "number" ? (
              <Text style={styles.valueSmall}>成交㎡單價中位數 {(m.medianSqmPriceYen / 10000).toFixed(1)} 萬円/㎡</Text>
            ) : null}
          </View>
          {typeof m.medianSqmPriceYen === "number" && s.areaSqm ? (
            <View style={styles.subBlock}>
              <Text style={styles.sectionLabel}>② 換算本案</Text>
              <Text style={styles.valueSmall}>
                {(m.medianSqmPriceYen / 10000).toFixed(1)} 萬/㎡ × {s.areaSqm}㎡ = {man(m.expectedPriceMan)}　→　本案開價 {pct(m.diffPercent)}
              </Text>
            </View>
          ) : null}
          {m.typicalListingPriceMan ? (
            <View style={styles.subBlock}>
              <Text style={styles.sectionLabel}>③ 另一個來源交叉驗證</Text>
              <Text style={styles.valueSmall}>
                {m.listingBenchmarkSourceLabel ?? "公開刊登平均"}{m.listingBenchmarkScopeLabel ? `（${m.listingBenchmarkScopeLabel}）` : ""} {man(m.typicalListingPriceMan)}，本案 {pct(m.listingDiffPercent)}。
                這是「開價對開價」的同口徑比較，與成交價比較彼此獨立。
              </Text>
            </View>
          ) : null}
          <View style={[styles.subBlock, styles.subBlockLast]}>
            <Text style={styles.sectionLabel}>④ 可以解釋價差的條件（未計入試算）</Text>
            {reference.length ? <Bullets items={reference.map(f => `${f.label}：${f.note}`)} /> : <Text style={{ fontSize: 8, color: INK_MUTE }}>圖紙未讀到可補充的條件。</Text>}
            <Text style={{ fontSize: 7, color: INK_MUTE, marginTop: 3 }}>
              國交省成交資料不含徒步、樓層與周邊機能欄位，無法量化，因此不列入試算；這些是價差出現時最該向仲介確認的地方。
            </Text>
          </View>
        </Card>
      ) : null}

      {holding ? (
        <Card title="持有成本與建物狀態" tag={`每月合計 ${yen(holding.totalMonthlyHoldingCost)}`}>
          {(holding.items ?? []).map((it: any, i: number, arr: any[]) => (
            <View key={i} style={[styles.tableRow, i === arr.length - 1 ? styles.tableRowLast : {}]}>
              <Text style={styles.tdName}>{it.name}</Text>
              <Text style={styles.tdAmount}>{yen(it.amount)}</Text>
              <Text style={styles.tdNote}>{it.note}</Text>
            </View>
          ))}
          {health ? (
            <View style={{ marginTop: 6 }}>
              <View style={styles.grid}>
                <Cell label="修繕積立金體質" value={health.reserveHealthText} half />
                <Cell label="每㎡月提撥" value={health.reservePerSqm ? `¥${Number(health.reservePerSqm).toLocaleString("ja-JP")} / ㎡` : null} half />
                <Cell label="社區規模" value={health.scaleRiskText} half />
                <Cell label="總戸数／屋齡" value={[health.totalUnits ? `${health.totalUnits} 戸` : null, typeof health.ageYears === "number" ? `築 ${health.ageYears} 年` : null].filter(Boolean).join("・") || null} half />
              </View>
              {health.reserveHealthNote ? <Text style={{ fontSize: 7.5, color: INK_SOFT, lineHeight: 1.5 }}>{health.reserveHealthNote}</Text> : null}
              {health.scaleRiskNote ? <Text style={{ fontSize: 7.5, color: INK_SOFT, lineHeight: 1.5 }}>{health.scaleRiskNote}</Text> : null}
            </View>
          ) : null}
        </Card>
      ) : null}

      {occ ? (
        <Card title="物件現況・投資回報率與自住法務要點">
          <View style={styles.grid}>
            <Cell label="現況" value={occ.statusText} wide />
            {occ.investmentYield ? (
              <>
                <Cell label="現行月租" value={yen(occ.investmentYield.monthlyRentYen)} />
                <Cell label="表面利回り" value={typeof occ.investmentYield.grossYield === "number" ? `${occ.investmentYield.grossYield.toFixed(2)}%` : null} />
                <Cell label="實質利回り（估）" value={typeof occ.investmentYield.netYieldEstimated === "number" ? `${occ.investmentYield.netYieldEstimated.toFixed(2)}%` : null} />
              </>
            ) : null}
          </View>
          {occ.mortgageTaxNote ? (
            <View style={[styles.verdictBox, { backgroundColor: occ.mortgageTaxEligible ? GREEN_SOFT : AMBER_SOFT, borderColor: occ.mortgageTaxEligible ? GREEN_LINE : AMBER_LINE, marginBottom: 0 }]}>
              <Text style={[styles.verdictStatus, { color: occ.mortgageTaxEligible ? GREEN_DEEP : AMBER_DEEP }]}>住宅ローン減税</Text>
              <Text style={{ fontSize: 8, lineHeight: 1.5, color: INK_SOFT }}>{occ.mortgageTaxNote}</Text>
            </View>
          ) : null}
          {occ.renovationNote ? <Text style={{ fontSize: 7.5, color: INK_SOFT, marginTop: 6, lineHeight: 1.5 }}>翻新履歷：{occ.renovationNote}</Text> : null}
        </Card>
      ) : null}

      {init?.items?.length ? (
        <Card title="買方交屋諸費用試算" tag={`合計約 ${yen(init.total)}${init.percentageOfPrice ? `・約房價 ${init.percentageOfPrice}%` : ""}`}>
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
              <Text style={styles.sectionLabel}>亮點</Text>
              <Bullets items={health.specialStrengths} />
            </View>
          ) : null}
          {(m?.priceCautions?.length || health?.specialCautions?.length) ? (
            <View>
              <Text style={styles.sectionLabel}>注意</Text>
              <Bullets items={[...(m?.priceCautions ?? []), ...(health?.specialCautions ?? [])]} />
            </View>
          ) : null}
        </Card>
      ) : null}
    </>
  );
}

/* ───────────── 聯絡頁（固定在最後一頁） ───────────── */
/** 每頁共用的頁首／頁尾。fixed 元素必須是 Page 直接子元素且放在內容之前，否則頁碼不出現。 */
function PageChrome({ dateText }: { dateText: string }) {
  return (
    <>
      <View style={styles.headerBar} fixed />
      <Text style={styles.headerLeft} fixed>LINUS 住好日</Text>
      <Text style={styles.headerRight} fixed>物件圖紙分析報告・{dateText}</Text>
      <View style={styles.headerRule} fixed />
      <View style={styles.footerRule} fixed />
      <Text style={[styles.footerText, styles.footerLeft]} fixed>
        {SITE_HOST}　｜　本報告由 LINUS 住好日自動產生，僅供參考
      </Text>
      <Text style={[styles.footerText, styles.footerRight]} fixed render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </>
  );
}

function ContactPage({ assetBase }: { assetBase: string }) {
  const src = (p: string) => `${assetBase}${p}`;
  return (
    <View>
      <View style={styles.contactHero}>
        <Image src={src("/logo.png")} style={styles.contactLogo} />
        <View style={{ flex: 1 }}>
          <Text style={styles.contactTitle}>有問題？直接找 Linus 聊聊</Text>
          <Text style={styles.contactLead}>
            看完這份分析，想確認物件細節、安排看房，或需要日本租屋・買房的全程協助，
            掃 QR code 或用下方任何一種方式聯絡都可以。中文溝通、日本現地服務。
          </Text>
        </View>
      </View>

      <View style={styles.qrRow}>
        <View style={styles.qrCard}>
          <Text style={[styles.qrBrand, { backgroundColor: LINE_GREEN }]}>LINE</Text>
          <Image src={src("/pdf/line-qr.png")} style={styles.qrImage} />
          <Text style={styles.qrId}>ID：{linusContact.lineId}</Text>
          <Text style={styles.qrHint}>LINE 掃描加好友，或搜尋 ID 後直接傳訊息</Text>
        </View>
        <View style={[styles.qrCard, styles.qrCardLast]}>
          <Text style={[styles.qrBrand, { backgroundColor: WECHAT_GREEN }]}>WeChat 微信</Text>
          <Image src={src("/pdf/wechat-qr.png")} style={styles.qrImage} />
          <Text style={styles.qrId}>ID：{linusContact.wechatId}</Text>
          <Text style={styles.qrHint}>微信「掃一掃」加好友，或搜尋 ID</Text>
        </View>
      </View>

      <View style={styles.channelRow}>
        <View style={styles.channel}>
          <Text style={styles.channelName}>EMAIL</Text>
          <Link src={`mailto:${linusContact.email}`} style={styles.channelValue}>{linusContact.email}</Link>
        </View>
        <View style={styles.channel}>
          <Text style={styles.channelName}>THREADS</Text>
          <Link src={linusContact.threads} style={styles.channelValue}>@linus3524</Link>
        </View>
        <View style={styles.channel}>
          <Text style={styles.channelName}>INSTAGRAM</Text>
          <Link src="https://www.instagram.com/linus3524" style={styles.channelValue}>@linus3524</Link>
        </View>
        <View style={styles.channel}>
          <Text style={styles.channelName}>FACEBOOK</Text>
          <Link src={linusContact.facebook} style={styles.channelValue}>facebook.com/r352410</Link>
        </View>
        <View style={styles.channel}>
          <Text style={styles.channelName}>網站</Text>
          <Link src={SITE_URL} style={styles.channelValue}>{SITE_HOST}</Link>
        </View>
        <View style={styles.channel}>
          <Text style={styles.channelName}>電話</Text>
          <Text style={styles.channelValue}>{linusContact.phone}</Text>
        </View>
      </View>

      <View style={styles.companyBox}>
        <Text style={styles.companyText}>{linusContact.name}｜{linusContact.title}</Text>
        <Text style={styles.companyText}>{linusContact.companyName}・{linusContact.licenseNo}</Text>
        <Text style={styles.companyText}>{linusContact.address}　營業時間 {linusContact.workingHours}（{linusContact.closedDays}休）</Text>
      </View>
    </View>
  );
}
