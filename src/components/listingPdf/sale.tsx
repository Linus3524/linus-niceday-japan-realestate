import { Text, View } from "@react-pdf/renderer";
import type { AnalyzeListingResult } from "../../lib/listing/types";
import { ageBandLabel, man, pct, yen } from './formatters.js';
import { ReasonablenessCard } from './priceReasonableness.js';
import { Bullets, Card, Cell, FactorTable, VerdictBox } from './primitives.js';
import { AMBER_DEEP, AMBER_LINE, AMBER_SOFT, GREEN_DEEP, GREEN_LINE, GREEN_SOFT, INK_MUTE, INK_SOFT, ORANGE_DEEP, SALE_TONE, styles, TONE_BLUE, TONE_ORANGE } from './styles.js';


export function SaleKpis({ result }: { result: AnalyzeListingResult }) {
  const s = result?.saleAnalysis;
  const m = s?.mlitComparison;
  const tone = m ? SALE_TONE[m.verdict] ?? (m.diffPercent > 15 ? TONE_ORANGE : TONE_BLUE) : TONE_BLUE;
  const officialMan = m?.areaBaselineMan ?? m?.expectedPriceMan;
  const listingMan = m?.typicalListingPriceMan;
  return (
    <View style={styles.kpiRow} wrap={false}>
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
        <Text style={[styles.kpiNote, { color: tone.color }]}>
          {m
            ? `實價登錄 ${man(officialMan)}${listingMan ? `・在售 ${man(listingMan)}` : ""}`
            : "無可比對成交資料"}
        </Text>
      </View>
    </View>
  );
}

/* ───────────── 買賣 ───────────── */
export function SaleSections({ result }: { result: AnalyzeListingResult }) {
  const s = result?.saleAnalysis;
  if (!s) return null;
  const m = s.mlitComparison;
  const tone = m ? SALE_TONE[m.verdict] ?? TONE_BLUE : TONE_BLUE;
  const holding = s.monthlyHoldingCosts;
  const health = s.buildingHealth;
  const occ = s.occupancyAssessment;
  const init = s.initialCosts;
  const factors = m?.priceFactors ?? [];
  const applied = factors.filter(f => f.applied !== false);
  const reference = factors.filter(f => f.applied === false && f.label !== "屋齡");

  const officialMan = m?.areaBaselineMan ?? m?.expectedPriceMan;
  const officialLow = m?.fairLowMan;
  const officialHigh = m?.fairHighMan;
  const officialDiff = m?.diffPercent;

  const listingMan = m?.typicalListingPriceMan;
  const listingLow = m?.typicalListingPriceLowMan;
  const listingHigh = m?.typicalListingPriceHighMan;
  const listingDiff = m?.listingDiffPercent;

  return (
    <>
      <Card title="價格定位與行情對照" tag={m ? `${m.region ?? ""}${m.district ?? ""}・${m.layout ?? ""}` : "無對應行情分桶"}>
        {officialMan != null ? (
          <View style={styles.benchmarkGrid}>
            {/* ① 本案開價 */}
            <View style={[styles.benchmarkCard, { borderLeftColor: GREEN_DEEP }]}>
              <View style={styles.benchmarkHeaderRow}>
                <Text style={styles.benchmarkCardTitle}>本案開價</Text>
                <Text style={[styles.chip, styles.chipAccent, { fontSize: 6, paddingVertical: 1, paddingHorizontal: 3 }]}>
                  中古公寓
                </Text>
              </View>
              <Text style={[styles.benchmarkCardPrice, { color: GREEN_DEEP }]}>{man(s.salePriceMan)}</Text>
              <View style={styles.benchmarkMeta}>
                {s.tsuboAndSqm?.sqmPriceMan ? (
                  <Text style={styles.benchmarkMetaText}>
                    每㎡ {s.tsuboAndSqm.sqmPriceMan} 萬円・{s.tsuboAndSqm.tsuboPriceMan} 萬円/坪
                  </Text>
                ) : null}
                {s.areaSqm ? (
                  <Text style={styles.benchmarkMetaSub}>專有面積 {s.areaSqm} ㎡</Text>
                ) : null}
              </View>
            </View>

            {/* ② 實價登錄平均 */}
            <View style={[styles.benchmarkCard, listingMan == null ? styles.benchmarkCardLast : {}, { borderLeftColor: "#0284C7" }]}>
              <View style={styles.benchmarkHeaderRow}>
                <Text style={styles.benchmarkCardTitle}>實價登錄平均</Text>
                <Text style={[styles.chip, { fontSize: 6, paddingVertical: 1, paddingHorizontal: 3, borderColor: "#BAE6FD", backgroundColor: "#F0F9FF", color: "#0284C7" }]}>
                  國交省成約
                </Text>
              </View>
              <Text style={[styles.benchmarkCardPrice, { color: "#0284C7" }]}>{man(officialMan)}</Text>
              <View style={styles.benchmarkMeta}>
                {officialLow != null && officialHigh != null ? (
                  <Text style={styles.benchmarkMetaText}>
                    區間 {man(officialLow)} 〜 {man(officialHigh)}
                  </Text>
                ) : null}
                {officialDiff != null ? (
                  <Text style={[styles.benchmarkDiffText, { color: officialDiff > 0 ? ORANGE_DEEP : officialDiff < 0 ? GREEN_DEEP : "#8A9590" }]}>
                    {officialDiff > 0 ? `▲ 溢價 ${officialDiff.toFixed(1)}%` : officialDiff < 0 ? `▼ 折讓 ${Math.abs(officialDiff).toFixed(1)}%` : "等同基準"}
                  </Text>
                ) : null}
                <Text style={styles.benchmarkMetaSub}>
                  國土交通省成約{m?.sampleCount ? ` ${m.sampleCount} 筆` : ""}均價
                </Text>
              </View>
            </View>

            {/* ③ 市場同規模在售行情 */}
            {listingMan != null ? (
              <View style={[styles.benchmarkCard, styles.benchmarkCardLast, { borderLeftColor: AMBER_DEEP }]}>
                <View style={styles.benchmarkHeaderRow}>
                  <Text style={styles.benchmarkCardTitle}>市場同規模在售</Text>
                  <Text style={[styles.chip, { fontSize: 6, paddingVertical: 1, paddingHorizontal: 3, borderColor: AMBER_LINE, backgroundColor: AMBER_SOFT, color: AMBER_DEEP }]}>
                    同規模校準
                  </Text>
                </View>
                <Text style={[styles.benchmarkCardPrice, { color: AMBER_DEEP }]}>{man(listingMan)}</Text>
                <View style={styles.benchmarkMeta}>
                  {listingLow != null && listingHigh != null ? (
                    <Text style={styles.benchmarkMetaText}>
                      區間 {man(listingLow)} 〜 {man(listingHigh)}
                    </Text>
                  ) : null}
                  {listingDiff != null ? (
                    <Text style={[styles.benchmarkDiffText, { color: listingDiff > 0 ? ORANGE_DEEP : listingDiff < 0 ? GREEN_DEEP : "#8A9590" }]}>
                      {listingDiff > 0 ? `▲ 溢價 ${listingDiff.toFixed(1)}%` : listingDiff < 0 ? `▼ 折讓 ${Math.abs(listingDiff).toFixed(1)}%` : "等同基準"}
                    </Text>
                  ) : null}
                  <Text style={styles.benchmarkMetaSub}>
                    {m?.listingBenchmarkSourceLabel ?? "公開刊登平均（賣方開價）"}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.bigNumberRow}>
            <Text style={styles.bigNumber}>{man(s.salePriceMan)}</Text>
            {s.tsuboAndSqm?.sqmPriceMan ? (
              <Text style={styles.bigNumberNote}>{s.tsuboAndSqm.sqmPriceMan} 萬円/㎡・{s.tsuboAndSqm.tsuboPriceMan} 萬円/坪</Text>
            ) : null}
          </View>
        )}

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
          <View style={{ marginTop: 3 }}>
            <Text style={styles.sectionLabel}>影響價格的主要因素與評估依據（標示「參考」者為業界經驗值，未計入試算）</Text>
            <FactorTable factors={[...applied, ...reference]} />
          </View>
        ) : null}
      </Card>

      {m ? <ReasonablenessCard mlit={m} salePriceMan={s.salePriceMan} /> : null}

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
          {(holding.items ?? []).map((it, i, arr) => (
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
          {init.items.map((it, i, arr) => (
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
