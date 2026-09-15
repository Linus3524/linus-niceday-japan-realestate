import { StyleSheet, Font } from "@react-pdf/renderer";
import * as path from "path";

const fontsDir = path.resolve("public/fonts");
Font.register({
  family: "NotoSansTC",
  fonts: [
    { src: path.join(fontsDir, "NotoSansTC-Regular.ttf"), fontWeight: 400 },
    { src: path.join(fontsDir, "NotoSansTC-Bold.ttf"), fontWeight: 700 },
  ],
});
Font.register({
  family: "NotoSansJPSupplement",
  fonts: [
    { src: path.join(fontsDir, "NotoSansJP-Supplement-Regular.ttf"), fontWeight: 400 },
    { src: path.join(fontsDir, "NotoSansJP-Supplement-Bold.ttf"), fontWeight: 700 },
  ],
});

const VISIBLE_HYPHEN = "\uE000";
const CJK_OR_OTHER = /[\u3000-\u30FF\u3400-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF]|[^\u3000-\u30FF\u3400-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF]+/g;
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

export const COLOR = {
  BRAND_GREEN: "#007D5A",
  BRAND_GREEN_LIGHT: "#00A174",
  INK: "#1A2A22",
  INK_SECONDARY: "#3F5147",
  INK_MUTED: "#66736C",
  BORDER_LINE: "#DDE3DF",
  BORDER_DARK: "#1A2A22",
  BG_CANVAS: "#FAF9F6",
  BG_MUTED: "#F5F8F6",
  BG_WHITE: "#FFFFFF",
  
  // Tonal Scale Tokens (50 -> 100 -> 200 -> 400 -> 600 -> 800)
  // 1. Emerald Green (Positive / Brand)
  GREEN_50: "#E6F6F1",
  GREEN_100: "#DCFCE7",
  GREEN_200: "#9EE2CF",
  GREEN_400: "#00A174",
  GREEN_600: "#007D5A",
  GREEN_800: "#004D36",

  // 2. Sunny Yellow (Notice / Layout / Budget)
  YELLOW_50: "#FEFCE8",
  YELLOW_100: "#FEF9C3",
  YELLOW_200: "#FDE047",
  YELLOW_400: "#FACC15",
  YELLOW_600: "#CA8A04",
  YELLOW_800: "#854D0E",

  // 3. Amber Orange (Caution / Special)
  ORANGE_50: "#FFFBEB",
  ORANGE_100: "#FFF7ED",
  ORANGE_200: "#FDBA74",
  ORANGE_400: "#FB923C",
  ORANGE_600: "#EA580C",
  ORANGE_800: "#D97706",

  // 4. Terra Red (Negative / Severe)
  RED_50: "#FEF2F2",
  RED_100: "#FEE2E2",
  RED_200: "#FCA5A5",
  RED_400: "#F87171",
  RED_600: "#DC2626",
  RED_800: "#B13818",

  // 5. Sky Blue / Azure (Info / Location / Transit)
  BLUE_50: "#F0F9FF",
  BLUE_100: "#E0F2FE",
  BLUE_200: "#7DD3FC",
  BLUE_400: "#38BDF8",
  BLUE_600: "#0284C7",
  BLUE_800: "#0369A1",

  // 6. Violet (AI Assistant / WeChat Channel)
  VIOLET_50: "#FAF5FF",
  VIOLET_100: "#F3E8FF",
  VIOLET_200: "#D8B4FE",
  VIOLET_400: "#C084FC",
  VIOLET_600: "#9333EA",
  VIOLET_800: "#7E22CE",

  // 7. Slate / Neutral (Structure & Scope)
  SLATE_50: "#FAF9F6",
  SLATE_100: "#F5F8F6",
  SLATE_200: "#DDE3DF",
  SLATE_400: "#8A9590",
  SLATE_700: "#3F5147",
  SLATE_900: "#1A2A22",
  
  // UI Functional Mappings:
  // Positive (Emerald Green)
  POS_BG: "#E6F6F1",
  POS_BORDER: "#9EE2CF",
  POS_TEXT: "#007D5A",
  
  // Notice / Layout / Budget (Sunny Yellow)
  NOTICE_BG: "#FEF9C3",
  NOTICE_BORDER: "#FDE047",
  NOTICE_TEXT: "#854D0E",
  
  // Caution / Special (Amber Orange)
  CAUT_BG: "#FFF7ED",
  CAUT_BORDER: "#FDBA74",
  CAUT_TEXT: "#D97706",
  
  // Negative / Severe (Terra Red)
  NEG_BG: "#FEF2F2",
  NEG_BORDER: "#FCA5A5",
  NEG_TEXT: "#B13818",
  
  // Info / Location / Transport (Sky Blue)
  INFO_BG: "#E0F2FE",
  INFO_BORDER: "#7DD3FC",
  INFO_TEXT: "#0284C7",
  INFO_BAR: "#0284C7",
  
  // Neutral / Scope / Area Tags (Ice Azure & Slate Gray)
  TAG_AREA_BG: "#F5F8F6",
  TAG_AREA_BORDER: "#DDE3DF",
  TAG_AREA_TEXT: "#8A9590",
  TAG_RECOMMEND_BG: "#F2F8FA",
  TAG_RECOMMEND_BORDER: "#D6EAF0",
  TAG_RECOMMEND_TEXT: "#3F626D",
  
  // AI Channel (Specialized Assistant)
  AI_BG: "#FAF5FF",
  AI_BORDER: "#D8B4FE",
  AI_TEXT: "#7E22CE",
  AI_BAR: "#9333EA",
  
  // Heatmap Tiers
  HEAT_TIER1_BG: "#DCFCE7",
  HEAT_TIER1_BORDER: "#86EFAC",
  HEAT_TIER1_TEXT: "#15803D",
  HEAT_TIER2_BG: "#FEF9C3",
  HEAT_TIER2_BORDER: "#FDE047",
  HEAT_TIER2_TEXT: "#854D0E",
  HEAT_TIER3_BG: "#FFF7ED",
  HEAT_TIER3_BORDER: "#FDBA74",
  HEAT_TIER3_TEXT: "#D97706",
  HEAT_TIER4_BG: "#FEF2F2",
  HEAT_TIER4_BORDER: "#FCA5A5",
  HEAT_TIER4_TEXT: "#B13818",
  HEAT_TIER5_BG: "#FEF2F2",
  HEAT_TIER5_BORDER: "#FCA5A5",
  HEAT_TIER5_TEXT: "#B13818",
  
  // Search Criteria Tags (5-Tone Pure Spectrum: 紅橙黃綠藍, No Purple, No Pink)
  CAT_LAYOUT_BG: "#FEF9C3",
  CAT_LAYOUT_BORDER: "#FDE047",
  CAT_LAYOUT_TEXT: "#854D0E",
  CAT_BUDGET_BG: "#FEF9C3",
  CAT_BUDGET_BORDER: "#FDE047",
  CAT_BUDGET_TEXT: "#854D0E",
  CAT_EQUIP_BG: "#DCFCE7",
  CAT_EQUIP_BORDER: "#86EFAC",
  CAT_EQUIP_TEXT: "#166534",
  CAT_TRANS_BG: "#E0F2FE",
  CAT_TRANS_BORDER: "#7DD3FC",
  CAT_TRANS_TEXT: "#0284C7",
  CAT_SPEC_BG: "#FFF7ED",
  CAT_SPEC_BORDER: "#FDBA74",
  CAT_SPEC_TEXT: "#D97706",
};

export const s = StyleSheet.create({
  page: {
    fontFamily: ["NotoSansTC", "NotoSansJPSupplement"],
    fontSize: 8,
    color: COLOR.INK,
    backgroundColor: COLOR.BG_CANVAS,
    paddingTop: 36,
    paddingBottom: 38,
    paddingHorizontal: 36,
  },
  topBar: { position: "absolute", top: 0, left: 0, right: 0, height: 4, backgroundColor: COLOR.BRAND_GREEN },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", borderBottomWidth: 1, borderBottomColor: COLOR.BORDER_LINE, paddingBottom: 5, marginBottom: 10 },
  headerBrand: { fontSize: 10, fontWeight: 700, color: COLOR.BRAND_GREEN, letterSpacing: 0.5 },
  headerDocTitle: { fontSize: 7.5, fontWeight: 400, color: COLOR.INK_MUTED },
  footerRow: { position: "absolute", bottom: 15, left: 36, right: 36, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: COLOR.BORDER_LINE, paddingTop: 4 },
  footerText: { fontSize: 6.5, color: COLOR.INK_MUTED },
  heroTitle: { fontSize: 16, fontWeight: 700, color: COLOR.INK, lineHeight: 1.25, marginBottom: 3 },
  heroSubtitle: { fontSize: 8.5, color: COLOR.INK_SECONDARY, lineHeight: 1.35, marginBottom: 8 },
  sectionHeading: { fontSize: 9.5, fontWeight: 700, color: COLOR.INK, borderLeftWidth: 3, borderLeftColor: COLOR.BRAND_GREEN, paddingLeft: 5, marginBottom: 5, marginTop: 4 },
  subHeading: { fontSize: 8, fontWeight: 700, color: COLOR.INK_SECONDARY, marginBottom: 3, marginTop: 3 },
  card: { borderWidth: 1, borderColor: COLOR.BORDER_LINE, backgroundColor: COLOR.BG_WHITE, padding: 6, marginBottom: 5 },
  cardDarkBorder: { borderWidth: 1, borderColor: COLOR.BORDER_DARK, backgroundColor: COLOR.BG_WHITE, padding: 7, marginBottom: 6 },
  grid2: { flexDirection: "row", gap: 7, marginBottom: 5 },
  grid3: { flexDirection: "row", gap: 5, marginBottom: 5 },
  grid4: { flexDirection: "row", gap: 5, marginBottom: 5 },
  grid5: { flexDirection: "row", gap: 4, marginBottom: 5 },
  grid6: { flexDirection: "row", gap: 3.5, marginBottom: 5 },
  col: { flex: 1 },
  table: { borderWidth: 1, borderColor: COLOR.BORDER_LINE, backgroundColor: COLOR.BG_WHITE, marginBottom: 5 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: COLOR.BORDER_LINE, paddingVertical: 3.5, paddingHorizontal: 5, alignItems: "center" },
  tableRowHeader: { backgroundColor: COLOR.BG_MUTED, borderBottomWidth: 1, borderBottomColor: COLOR.BORDER_LINE, paddingVertical: 4, paddingHorizontal: 5 },
  tableHeaderText: { fontSize: 6.8, fontWeight: 700, color: COLOR.INK_SECONDARY },
  tableCell: { fontSize: 6.5, color: COLOR.INK },
  tableCellMuted: { fontSize: 6.2, color: COLOR.INK_MUTED },
  badge: { borderWidth: 1, paddingVertical: 2, paddingHorizontal: 4, alignSelf: "flex-start", marginBottom: 2 },
  badgeText: { fontSize: 6.5, fontWeight: 700 },
  badgeDesc: { fontSize: 6.2, color: COLOR.INK_SECONDARY, marginTop: 1 },
  alertBox: { borderWidth: 1, padding: 6, marginBottom: 5 },
  alertTitle: { fontSize: 7.2, fontWeight: 700, marginBottom: 2 },
  alertText: { fontSize: 6.5, color: COLOR.INK, lineHeight: 1.3 },
  swatchBox: { borderWidth: 1, borderColor: COLOR.BORDER_LINE, backgroundColor: COLOR.BG_WHITE, padding: 5, flex: 1 },
  swatchColorBar: { height: 14, borderWidth: 1, borderColor: "rgba(0,0,0,0.06)", marginBottom: 3 },
  swatchHex: { fontSize: 6.2, fontWeight: 700, color: COLOR.INK },
  swatchName: { fontSize: 5.8, color: COLOR.INK_SECONDARY },
  swatchUsage: { fontSize: 5.2, color: COLOR.INK_MUTED, marginTop: 1, lineHeight: 1.1 },

  // Multi-step Ramp Styles
  rampCard: { borderWidth: 1, borderColor: COLOR.BORDER_LINE, backgroundColor: COLOR.BG_WHITE, padding: 4.5, flex: 1 },
  rampBarRow: { flexDirection: "row", height: 11, borderWidth: 1, borderColor: "rgba(0,0,0,0.08)", marginBottom: 3 },
  rampBarSegment: { flex: 1, height: "100%" },
  rampTitle: { fontSize: 6.8, fontWeight: 700, color: COLOR.INK, marginBottom: 1 },
  rampSubtitle: { fontSize: 5.2, color: COLOR.INK_MUTED, marginBottom: 2 },
  rampStepText: { fontSize: 4.8, color: COLOR.INK_SECONDARY, lineHeight: 1.2 },

  // Interactive Button Styles
  btnSolid: { backgroundColor: COLOR.BRAND_GREEN, paddingVertical: 3.5, paddingHorizontal: 7, alignSelf: "flex-start" },
  btnSolidText: { color: "#FFFFFF", fontSize: 6.2, fontWeight: 700 },
});
