import { StyleSheet } from "@react-pdf/renderer";


/* ───────────── 色票（與網站一致） ───────────── */
export const INK = "#1A2A22";
export const INK_SOFT = "#3F5147";
export const INK_MUTE = "#66736C";
export const LINE = "#DDE3DF";
export const LINE_SOFT = "#EEF2F0";
export const SOFT_BG = "#F5F8F6";
export const GREEN = "#00A174";
export const GREEN_DEEP = "#007D5A";
export const GREEN_SOFT = "#E6F6F1";
export const GREEN_LINE = "#9EE2CF";
export const AMBER_DEEP = "#7A5A1F";
export const AMBER_SOFT = "#FFF9ED";
export const AMBER_LINE = "#DCC8A1";
export const ORANGE = "#E94E2B";
export const ORANGE_DEEP = "#B13818";
export const ORANGE_SOFT = "#FBDFD2";
export const BLUE_SOFT = "#F2F8FA";
export const BLUE_LINE = "#D6EAF0";
export const BLUE_DEEP = "#3F626D";
export const LINE_GREEN = "#06C755";
export const WECHAT_GREEN = "#07C160";

export const styles = StyleSheet.create({
  page: {
    fontFamily: ["NotoSansTC", "NotoSansJPSupplement"],
    fontSize: 8.5,
    color: INK,
    paddingTop: 44,
    paddingBottom: 46,
    paddingHorizontal: 36,
  },
  body: {},

  /* 固定頁首／頁尾 */
  headerBar: { position: "absolute", top: 0, left: 0, right: 0, height: 5, backgroundColor: GREEN },
  headerLeft: { position: "absolute", top: 14, left: 36, fontSize: 8, fontWeight: 700, color: INK },
  headerRight: { position: "absolute", top: 14, right: 36, fontSize: 7, color: INK_MUTE },
  headerRule: { position: "absolute", top: 30, left: 36, right: 36, borderTopWidth: 1, borderTopColor: LINE },
  footerRule: { position: "absolute", bottom: 30, left: 36, right: 36, borderTopWidth: 1, borderTopColor: LINE },
  footerText: { fontSize: 6, color: INK_MUTE },
  footerLeft: { position: "absolute", bottom: 18, left: 36 },
  footerRight: { position: "absolute", bottom: 18, right: 36 },

  /* 標題區 */
  titleBlock: { marginBottom: 8 },
  eyebrow: { fontSize: 6.5, color: GREEN_DEEP, fontWeight: 700, letterSpacing: 1.2, marginBottom: 2 },
  title: { fontSize: 15, fontWeight: 700, lineHeight: 1.25 },
  subtitle: { fontSize: 7.5, color: INK_SOFT, marginTop: 2 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
  chip: { borderWidth: 1, borderColor: LINE, backgroundColor: SOFT_BG, paddingHorizontal: 4, paddingVertical: 1.5, marginRight: 3, marginBottom: 3, fontSize: 6.5, color: INK_SOFT },
  chipAccent: { borderColor: GREEN_LINE, backgroundColor: GREEN_SOFT, color: GREEN_DEEP, fontWeight: 700 },

  /* 線上版本導外按鈕（PDF 右上方嵌入） */
  onlineLinkBtn: {
    borderWidth: 1,
    borderColor: GREEN_LINE,
    backgroundColor: GREEN_SOFT,
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    textDecoration: "none",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  onlineLinkText: {
    fontSize: 7,
    fontWeight: 700,
    color: GREEN_DEEP,
    textDecoration: "none",
  },

  /* 行情對照三方卡片（本案開價 vs 實價登錄 vs 市場在售） */
  benchmarkGrid: {
    flexDirection: "row",
    marginBottom: 6,
  },
  benchmarkCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: LINE,
    borderLeftWidth: 3,
    backgroundColor: "#FFFFFF",
    paddingVertical: 5,
    paddingHorizontal: 6,
    marginRight: 5,
  },
  benchmarkCardLast: {
    marginRight: 0,
  },
  benchmarkHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  benchmarkCardTitle: {
    fontSize: 7,
    fontWeight: 700,
    color: INK,
  },
  benchmarkCardPrice: {
    fontSize: 12.5,
    fontWeight: 700,
    color: INK,
    lineHeight: 1.15,
  },
  benchmarkMeta: {
    marginTop: 2,
  },
  benchmarkMetaText: {
    fontSize: 6,
    color: INK_MUTE,
    lineHeight: 1.25,
  },
  benchmarkDiffText: {
    fontSize: 6.5,
    fontWeight: 700,
    marginTop: 1.5,
  },
  benchmarkMetaSub: {
    fontSize: 5.5,
    color: INK_MUTE,
    marginTop: 1,
    lineHeight: 1.2,
  },

  /* KPI 列 */
  kpiRow: { flexDirection: "row", marginBottom: 8 },
  kpi: { flex: 1, borderWidth: 1, borderColor: LINE, backgroundColor: "#FFFFFF", paddingVertical: 5, paddingHorizontal: 6, marginRight: 5 },
  kpiLast: { marginRight: 0 },
  kpiLabel: { fontSize: 6, color: INK_MUTE, letterSpacing: 0.5, marginBottom: 1 },
  kpiValue: { fontSize: 12, fontWeight: 700, lineHeight: 1.2 },
  kpiNote: { fontSize: 6, color: INK_MUTE, marginTop: 1, lineHeight: 1.2 },

  /* 卡片 */
  card: { borderWidth: 1, borderColor: LINE, marginBottom: 6 },
  cardHead: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: SOFT_BG, borderBottomWidth: 1, borderBottomColor: LINE,
    paddingVertical: 3.5, paddingHorizontal: 7,
  },
  cardTitleRow: { flexDirection: "row", alignItems: "center" },
  cardAccent: { width: 2.5, height: 9, backgroundColor: GREEN, marginRight: 5 },
  cardTitle: { fontSize: 8, fontWeight: 700 },
  cardTag: { fontSize: 6.5, color: INK_MUTE },
  cardBody: { paddingVertical: 4.5, paddingHorizontal: 7 },

  sectionLabel: { fontSize: 6.5, fontWeight: 700, color: INK_MUTE, letterSpacing: 0.8, marginBottom: 2 },
  subBlock: { paddingVertical: 3.5, borderBottomWidth: 1, borderBottomColor: LINE_SOFT },
  subBlockLast: { borderBottomWidth: 0 },

  grid: { flexDirection: "row", flexWrap: "wrap" },
  gridCell: { width: "33.33%", paddingRight: 6, marginBottom: 4 },
  gridCellHalf: { width: "50%", paddingRight: 6, marginBottom: 4 },
  gridCellWide: { width: "100%", marginBottom: 4 },
  label: { fontSize: 6.5, color: INK_MUTE, marginBottom: 1 },
  value: { fontSize: 8.5, fontWeight: 700 },
  valueSmall: { fontSize: 7.5 },

  verdictBox: { borderWidth: 1, paddingVertical: 4.5, paddingHorizontal: 7, marginBottom: 4 },
  verdictStatus: { fontSize: 6.5, fontWeight: 700, letterSpacing: 0.8, marginBottom: 1.5 },
  verdictHeadline: { fontSize: 8.5, fontWeight: 700, lineHeight: 1.25 },
  verdictDetail: { fontSize: 7, marginTop: 2, lineHeight: 1.35, color: INK_SOFT },

  // 行高不能靠繼承：react-pdf 把 page 的 lineHeight 1.5 算成 13.5pt 後往下傳，
  // 20pt 的數字會被壓在 13.5pt 的行裡、跟下一個區塊重疊。每個大字都自己設。
  bigNumberRow: { flexDirection: "row", alignItems: "flex-end", flexWrap: "wrap", marginBottom: 4 },
  bigNumber: { fontSize: 16, fontWeight: 700, lineHeight: 1.2 },
  bigNumberNote: { fontSize: 7.5, color: INK_SOFT, marginLeft: 6, marginBottom: 1.5, lineHeight: 1.25 },

  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: LINE_SOFT, paddingVertical: 2.5 },
  tableRowLast: { borderBottomWidth: 0 },
  tdName: { width: "34%", fontSize: 7.5, fontWeight: 700, paddingRight: 4 },
  tdAmount: { width: "18%", fontSize: 7.5, fontWeight: 700, textAlign: "right", paddingRight: 6 },
  tdNote: { width: "48%", fontSize: 7, color: INK_SOFT, lineHeight: 1.3 },
  tdUnknown: { color: INK_MUTE, fontWeight: 400 },

  /* 因素表（含小長條） */
  factorRow: { flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: LINE_SOFT, paddingVertical: 2.5 },
  factorLabel: { width: "24%", fontSize: 7.5, fontWeight: 700, paddingRight: 4, lineHeight: 1.2, justifyContent: "center" },
  factorNote: { width: "48%", fontSize: 7, color: INK_SOFT, lineHeight: 1.3, paddingRight: 4 },
  factorBarWrap: { width: "16%", paddingRight: 4 },
  factorBarTrack: { height: 4, backgroundColor: LINE_SOFT, flexDirection: "row" },
  factorPct: { width: "12%", fontSize: 7.5, fontWeight: 700, textAlign: "right" },
  factorRef: { fontSize: 6, color: INK_MUTE, fontWeight: 400 },

  bullet: { flexDirection: "row", marginBottom: 2 },
  bulletDot: { width: 8, fontSize: 7.5, color: GREEN_DEEP },
  bulletText: { flex: 1, fontSize: 7.5, lineHeight: 1.35 },

  /* 設備 */
  tagWrap: { flexDirection: "row", flexWrap: "wrap" },
  tag: { borderWidth: 1, borderColor: LINE, backgroundColor: "#FFFFFF", paddingHorizontal: 4, paddingVertical: 1.5, marginRight: 3, marginBottom: 3, fontSize: 6.5, color: INK_SOFT },
  tagHighlight: { borderColor: GREEN_LINE, backgroundColor: GREEN_SOFT, color: GREEN_DEEP, fontWeight: 700 },

  /* 特約 */
  condRow: { flexDirection: "row", paddingVertical: 3.5, borderBottomWidth: 1, borderBottomColor: LINE_SOFT },
  condRowTitle: { width: "22%", fontSize: 7.5, fontWeight: 700, paddingRight: 5, paddingTop: 1 },
  condRowBody: { flex: 1 },
  noteItem: { flexDirection: "row", paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: LINE_SOFT },
  noteBadge: { width: 42, fontSize: 6, color: INK_MUTE, paddingTop: 1 },
  noteBody: { flex: 1 },
  noteTitle: { fontSize: 8, fontWeight: 700 },
  noteText: { fontSize: 7, color: INK_SOFT, lineHeight: 1.35, marginTop: 1 },

  disclaimer: { marginTop: 4, borderWidth: 1, borderColor: LINE, backgroundColor: SOFT_BG, padding: 6 },
  disclaimerText: { fontSize: 6.5, color: INK_SOFT, lineHeight: 1.4 },

  /* 聯絡頁 */
  contactHero: { borderWidth: 1, borderColor: GREEN_LINE, backgroundColor: GREEN_SOFT, padding: 8, flexDirection: "row", alignItems: "center", marginBottom: 8 },
  contactLogo: { width: 44, height: 44, marginRight: 10 },
  contactTitle: { fontSize: 13, fontWeight: 700, color: GREEN_DEEP, lineHeight: 1.25 },
  contactLead: { fontSize: 7.5, color: INK_SOFT, marginTop: 2.5, lineHeight: 1.35 },
  qrRow: { flexDirection: "row", marginBottom: 8 },
  qrCard: { flex: 1, borderWidth: 1, borderColor: LINE, padding: 8, alignItems: "center", marginRight: 8 },
  qrCardLast: { marginRight: 0 },
  qrBrand: { fontSize: 8, fontWeight: 700, color: "#FFFFFF", paddingHorizontal: 8, paddingVertical: 2, marginBottom: 5 },
  qrImage: { width: 100, height: 100, marginBottom: 5 },
  qrId: { fontSize: 9.5, fontWeight: 700, letterSpacing: 0.5 },
  qrHint: { fontSize: 6.5, color: INK_MUTE, marginTop: 2, textAlign: "center", lineHeight: 1.3 },
  channelRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 8 },
  channel: { width: "50%", paddingRight: 6, marginBottom: 5 },
  channelName: { fontSize: 6.5, color: INK_MUTE, letterSpacing: 0.5 },
  channelValue: { fontSize: 8, fontWeight: 700, color: GREEN_DEEP, textDecoration: "none" },
  companyBox: { borderTopWidth: 1, borderTopColor: LINE, paddingTop: 6 },
  companyText: { fontSize: 7, color: INK_SOFT, lineHeight: 1.35 },
});

/* ───────────── 判定配色 ───────────── */
export type Tone = { bg: string; border: string; color: string };
export const TONE_GREEN: Tone = { bg: GREEN_SOFT, border: GREEN_LINE, color: GREEN_DEEP };
export const TONE_AMBER: Tone = { bg: AMBER_SOFT, border: AMBER_LINE, color: AMBER_DEEP };
export const TONE_ORANGE: Tone = { bg: ORANGE_SOFT, border: ORANGE, color: ORANGE_DEEP };
export const TONE_BLUE: Tone = { bg: BLUE_SOFT, border: BLUE_LINE, color: BLUE_DEEP };
export const VERDICT_TONE: Record<string, Tone> = {
  "超值": TONE_GREEN, "合理": TONE_GREEN, "符合": TONE_GREEN, "部分符合": TONE_GREEN,
  "條件反映": TONE_AMBER, "需調整": TONE_AMBER,
  "偏高": TONE_ORANGE, "難度高": TONE_ORANGE,
  "待確認": TONE_BLUE,
};
export const SALE_TONE: Record<string, Tone> = { bargain: TONE_GREEN, fair: TONE_GREEN, premium: TONE_AMBER };
