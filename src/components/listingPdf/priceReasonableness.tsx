import { Text, View } from "@react-pdf/renderer";
import type { AnalyzeListingResult } from "../../lib/listing/types";
import { Card } from './primitives.js';
import { BLUE_DEEP, BLUE_LINE, BLUE_SOFT, GREEN_DEEP, GREEN_LINE, GREEN_SOFT, INK_MUTE, INK_SOFT, ORANGE, ORANGE_DEEP, ORANGE_SOFT, styles } from './styles.js';


export function ReasonablenessCard({ mlit, salePriceMan }: { mlit: NonNullable<NonNullable<AnalyzeListingResult["saleAnalysis"]>["mlitComparison"]>; salePriceMan?: number }) {
  if (!mlit) return null;
  const factors = mlit.priceFactors ?? [];
  let calculatedPos = 0;
  for (const f of factors) {
    if (f.ratePercent > 0) calculatedPos += f.ratePercent;
  }
  const posSum = mlit.positiveFactorsSumPercent ?? Math.round(calculatedPos * 10) / 10;
  const askDiff = mlit.diffPercent ?? 0;
  const baselineMan = mlit.areaBaselineMan ?? mlit.expectedPriceMan ?? mlit.medianPriceMan;
  const diffAmountMan = baselineMan && salePriceMan ? salePriceMan - baselineMan : null;
  const isOverpriced = askDiff > posSum + 15;
  const isWellSupported = askDiff > 0 && askDiff <= posSum + 5;
  const isDiscounted = askDiff < 0;
  const hasReno = factors.some(
    (f) => (f.label === "翻新" || f.label?.includes("翻新") || f.label?.includes("改裝")) && f.ratePercent > 0
  );
  const positiveCount = factors.filter((f) => f.ratePercent > 0).length;

  const analysisTitle = isWellSupported
    ? "✓ 開價有充分條件支撐"
    : isOverpriced
      ? "⚠ 超出條件支撐（超額溢價）"
      : isDiscounted
        ? (hasReno ? "↓ 翻新讓利／具價格優勢" : "↓ 屋況折讓／保留翻新預算")
        : "開價落在合理範圍";

  const analysisToneColor = isWellSupported ? GREEN_DEEP : isOverpriced ? ORANGE_DEEP : BLUE_DEEP;
  const analysisBg = isWellSupported ? GREEN_SOFT : isOverpriced ? ORANGE_SOFT : BLUE_SOFT;
  const analysisBorder = isWellSupported ? GREEN_LINE : isOverpriced ? ORANGE : BLUE_LINE;

  const analysisDetail = isWellSupported
    ? `各項規格累計（+${posSum.toFixed(1)}%）充分支撐賣方開價（溢價 ${askDiff.toFixed(1)}%），屬高規格正常開盤。`
    : isOverpriced
      ? `即使計入各項優勢，開價仍高於客觀支撐約 ${(askDiff - posSum).toFixed(1)}%，建議保留議價空間。`
      : isDiscounted
        ? (hasReno
            ? `開價低於基準 ${Math.abs(askDiff).toFixed(1)}%，且已完成室內翻新（規格加成 +${posSum.toFixed(1)}%），具價格競爭力與讓利優勢。`
            : `開價低於基準 ${Math.abs(askDiff).toFixed(1)}%，主要反映未整體翻新之屋況折讓，留出預算空間供買方自行裝修。`)
        : "開價與條件加權後之行情落點相符。";

  return (
    <Card title="優勢條件累計與開價合理性對照" tag="官方査定教科書 ＋ 東京カンテイ大數據統計">
      <View style={styles.benchmarkGrid}>
        {/* ① 本案優勢條件加總 */}
        <View style={[styles.benchmarkCard, { borderLeftColor: GREEN_DEEP }]}>
          <View style={styles.benchmarkHeaderRow}>
            <Text style={styles.benchmarkCardTitle}>本案優勢條件加總</Text>
            <Text style={[styles.chip, styles.chipAccent, { fontSize: 6, paddingVertical: 1, paddingHorizontal: 3 }]}>規格加成</Text>
          </View>
          <Text style={[styles.benchmarkCardPrice, { color: GREEN_DEEP }]}>
            {posSum > 0 ? `+${posSum.toFixed(1)}%` : "0.0%"}
          </Text>
          <View style={styles.benchmarkMeta}>
            <Text style={styles.benchmarkMetaText}>{positiveCount} 項正向規格加成</Text>
          </View>
        </View>

        {/* ② 賣方開價落點 */}
        <View style={[styles.benchmarkCard, { borderLeftColor: askDiff > 0 ? ORANGE_DEEP : askDiff < 0 ? GREEN_DEEP : "#8A9590" }]}>
          <View style={styles.benchmarkHeaderRow}>
            <Text style={styles.benchmarkCardTitle}>賣方開價落點</Text>
            <Text style={[
              styles.chip,
              askDiff > 0 ? { borderColor: ORANGE, backgroundColor: ORANGE_SOFT, color: ORANGE_DEEP }
                : askDiff < 0 ? styles.chipAccent
                : {},
              { fontSize: 6, paddingVertical: 1, paddingHorizontal: 3 }
            ]}>
              {askDiff > 0 ? "溢價開盤" : askDiff < 0 ? "讓利開盤" : "符合市價"}
            </Text>
          </View>
          <Text style={[styles.benchmarkCardPrice, { color: askDiff > 0 ? ORANGE_DEEP : askDiff < 0 ? GREEN_DEEP : "#8A9590" }]}>
            {askDiff > 0 ? `▲ 溢價 ${askDiff.toFixed(1)}%` : askDiff < 0 ? `▼ 折讓 ${Math.abs(askDiff).toFixed(1)}%` : "符合市場基準"}
          </Text>
          <View style={styles.benchmarkMeta}>
            <Text style={styles.benchmarkMetaText}>
              相對同區同屋齡成交基準{diffAmountMan !== null ? `（${diffAmountMan > 0 ? "高出約 " : "折讓約 "}${Math.abs(Math.round(diffAmountMan)).toLocaleString()} 萬円）` : ""}
            </Text>
          </View>
        </View>

        {/* ③ 開價合理性剖析 */}
        <View style={[styles.benchmarkCard, styles.benchmarkCardLast, { backgroundColor: analysisBg, borderColor: analysisBorder, borderLeftColor: analysisToneColor }]}>
          <View style={styles.benchmarkHeaderRow}>
            <Text style={styles.benchmarkCardTitle}>開價合理性剖析</Text>
          </View>
          <Text style={{ fontSize: 8.5, fontWeight: 700, color: analysisToneColor, marginTop: 1, lineHeight: 1.2 }}>
            {analysisTitle}
          </Text>
          <View style={styles.benchmarkMeta}>
            <Text style={[styles.benchmarkMetaText, { color: INK_SOFT, lineHeight: 1.3 }]}>
              {analysisDetail}
            </Text>
          </View>
        </View>
      </View>
      <Text style={{ fontSize: 6, color: INK_MUTE, marginTop: 2 }}>
        ※ 査定依據來源：公益財團法人 不動產流通推進中心《中古マンション価格査定マニュアル》官方標準，以及日本東京カンテイ（Tokyo Kantei）實證大數據統計。
      </Text>
    </Card>
  );
}
