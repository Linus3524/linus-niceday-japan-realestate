import { Text, View } from "@react-pdf/renderer";
import type { AnalyzeListingResult } from "../../lib/listing/types";
import { formatShikibiki } from "../../lib/listingExtraction";
import { buildRentalConditionSections } from "../../lib/rentalConditionDisplay";
import { yen } from './formatters.js';
import { Bullets, Card, FactorTable, VerdictBox } from './primitives.js';
import { INK_MUTE, styles, TONE_BLUE, VERDICT_TONE } from './styles.js';


/* ───────────── KPI 列 ───────────── */
export function RentKpis({ result }: { result: AnalyzeListingResult }) {
  const parsed: Partial<AnalyzeListingResult["parsed"]> = result?.parsed ?? {};
  const monthly = (parsed.rent ?? 0) + (parsed.managementFee ?? 0);
  const cost = result?.initialCostEstimate;
  const verdict = result?.verdict;
  const tone = verdict ? VERDICT_TONE[verdict.status] ?? TONE_BLUE : TONE_BLUE;
  return (
    <View style={styles.kpiRow} wrap={false}>
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

/* ───────────── 租賃 ───────────── */
export function RentSections({ result }: { result: AnalyzeListingResult }) {
  const e: Partial<AnalyzeListingResult["extracted"]> = result?.extracted ?? {};
  const verdict = result?.verdict;
  const range = result?.range;
  const cost = result?.initialCostEstimate;
  const parsed: Partial<AnalyzeListingResult["parsed"]> = result?.parsed ?? {};
  const monthly = (parsed.rent ?? 0) + (parsed.managementFee ?? 0);
  const tone = verdict ? VERDICT_TONE[verdict.status] ?? TONE_BLUE : TONE_BLUE;
  const factors = verdict?.factors ?? [];
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
          {(cost.items ?? []).map((it, i, arr) => (
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

      {/* 與網站「重要特約與法務事項」同一份資料 */}
      {sections.length ? (
        <Card
          title="重要特約與法務事項"
          tag="彙整圖紙刊載之重點特約與條款，簽約前請詳閱重要事項說明"
        >
          {sections.map((section, si) => (
            <View key={section.title} style={[styles.subBlock, si === sections.length - 1 ? styles.subBlockLast : {}]}>
              <Text style={styles.sectionLabel}>{section.title}</Text>
              {section.rows.map((row, ri) => (
                <View key={row.title} style={[styles.condRow, ri === section.rows.length - 1 ? styles.tableRowLast : {}]}>
                  <Text style={styles.condRowTitle}>{row.title}</Text>
                  <View style={styles.condRowBody}>
                    <Bullets items={row.items} />
                  </View>
                </View>
              ))}
            </View>
          ))}
        </Card>
      ) : null}
    </>
  );
}
