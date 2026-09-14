import { Text, View } from "@react-pdf/renderer";
import type { CrimeSafetyResult, PrefectureSafetyResult, SafetyGrade } from "../../lib/crimeSafety";
import { Card } from './primitives.js';
import { GREEN_DEEP, INK, INK_MUTE, INK_SOFT, LINE, LINE_SOFT, ORANGE_DEEP, SOFT_BG, styles } from './styles.js';
import type { ListingReportPdfProps } from './types.js';


/* 用語與網站卡片一致（CrimeSafetyCard／PrefectureSafetyCard），不另起一套說法。 */
const RESIDENTIAL_LABEL: Record<SafetyGrade, string> = {
  "A+": "全年無紀錄", A: "全年無紀錄", "B+": "低於平均", B: "接近平均", C: "高於平均", D: "明顯偏高",
};
const PREFECTURE_LABEL: Record<SafetyGrade, string> = {
  "A+": "遠低於全國平均", A: "低於全國平均", "B+": "略優於全國平均", B: "接近全國平均", C: "高於全國平均", D: "明顯高於全國平均",
};
const MUNICIPAL_LABEL: Record<SafetyGrade, string> = {
  "A+": "遠低於縣內平均", A: "低於縣內平均", "B+": "略優於縣內平均", B: "接近縣內平均", C: "高於縣內平均", D: "明顯高於縣內平均",
};

const gradeColor = (grade: SafetyGrade) => (grade === "C" || grade === "D" ? ORANGE_DEEP : GREEN_DEEP);

function GradeBadge({ grade, label }: { grade: SafetyGrade; label: string }) {
  const color = gradeColor(grade);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 3 }}>
      <Text style={{ fontSize: 13, fontWeight: 700, color, marginRight: 6 }}>{grade}</Text>
      <Text style={{ fontSize: 7.5, fontWeight: 700, color }}>{label}</Text>
    </View>
  );
}

function StatCell({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <View style={{ flex: 1, borderWidth: 1, borderColor: LINE, backgroundColor: "#FFFFFF", paddingVertical: 3.5, paddingHorizontal: 5, marginRight: 4 }}>
      <Text style={{ fontSize: 6, color: INK_MUTE, marginBottom: 1 }}>{label}</Text>
      <Text style={{ fontSize: 9, fontWeight: 700, color: INK }}>{value}</Text>
      {note ? <Text style={{ fontSize: 5.5, color: INK_MUTE, marginTop: 1, lineHeight: 1.25 }}>{note}</Text> : null}
    </View>
  );
}

function ChomeSafety({ crime }: { crime: CrimeSafetyResult }) {
  const rate = typeof crime.burglaryRate === "string" ? null : crime.burglaryRate;
  const ctx = crime.tokyoContext;
  const top = [...crime.breakdown].filter(item => item.count > 0).sort((a, b) => b.count - a.count).slice(0, 6);
  return (
    <>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 }}>
        <View>
          <Text style={{ fontSize: 7, color: INK_MUTE }}>統計單位：{crime.chocho}（町丁目級）・{crime.periodLabel}</Text>
        </View>
      </View>
      <GradeBadge grade={crime.residentialGrade} label={`住宅治安：${RESIDENTIAL_LABEL[crime.residentialGrade]}`} />
      <View style={{ flexDirection: "row", marginBottom: 4 }}>
        <StatCell
          label="住家侵入竊盜"
          value={rate ? `${rate.count} 件` : `${crime.breakdown.filter(item => item.group === "residential").reduce((sum, item) => sum + item.count, 0)} 件`}
          note={rate ? `每千戶 ${rate.per1000} 件（${rate.households.toLocaleString()} 戶）` : "住戶數不足，無法換算發生率"}
        />
        <StatCell
          label="對照全東京町丁目"
          value={rate ? `優於 ${rate.saferThanPercent}%` : ctx ? `優於 ${ctx.residentialSaferThanPercent}%` : "—"}
          note={ctx ? `共 ${ctx.chomeCount.toLocaleString()} 個町丁目` : undefined}
        />
        <StatCell label="全年刑法犯合計" value={`${crime.totalCrimes} 件`} note="含街頭、財產與其他案件" />
        {crime.burglaryTrend ? (
          <StatCell
            label="住家侵入年對年"
            value={`${crime.burglaryTrend.previous} → ${crime.burglaryTrend.current} 件`}
            note={`${crime.burglaryTrend.previousLabel} → ${crime.burglaryTrend.currentLabel}`}
          />
        ) : null}
      </View>
      {top.length ? (
        <View style={styles.subBlock}>
          <Text style={styles.sectionLabel}>案件組成（件數由多到少）</Text>
          <Text style={{ fontSize: 7, color: INK_SOFT, lineHeight: 1.4 }}>
            {top.map(item => `${item.label} ${item.count} 件`).join("　・　")}
          </Text>
        </View>
      ) : null}
      {crime.pedestrianRisks.length ? (
        <View style={styles.subBlock}>
          <Text style={styles.sectionLabel}>對行人的直接危害事件</Text>
          <Text style={{ fontSize: 7, color: INK_SOFT, lineHeight: 1.4 }}>
            {crime.pedestrianRisks.map(item => `${item.label} ${item.count} 件`).join("　・　")}
          </Text>
        </View>
      ) : null}
      <View style={[styles.subBlock, styles.subBlockLast]}>
        <Text style={{ fontSize: 7, color: INK_SOFT, lineHeight: 1.4 }}>{crime.summary}</Text>
        <Text style={{ fontSize: 5.5, color: INK_MUTE, marginTop: 2 }}>{crime.credit}</Text>
      </View>
    </>
  );
}

function PrefectureSafety({ prefecture }: { prefecture: PrefectureSafetyResult }) {
  const local = prefecture.municipal ?? null;
  const breakdown = prefecture.breakdown ?? null;
  const grade = local ? local.grade : prefecture.grade;
  const label = local ? MUNICIPAL_LABEL[local.grade] : PREFECTURE_LABEL[prefecture.grade];
  return (
    <>
      <Text style={{ fontSize: 7, color: INK_MUTE, marginBottom: 3 }}>
        統計單位：{local ? `${local.municipality}（市區町村級・${local.year} 年）` : `${prefecture.prefecture}（都道府縣級・${prefecture.fiscalYear}）`}
        ；非物件所在町丁目，廣域統計不等於物件周邊風險。
      </Text>
      <GradeBadge grade={grade} label={`刑法犯認知率：${label}`} />
      <View style={{ flexDirection: "row", marginBottom: 4 }}>
        {local ? (
          <>
            <StatCell label="每千人刑法犯認知件數" value={`${local.crimeRatePerThousand} 件`} note={`${local.municipality}全年 ${local.total.toLocaleString()} 件／人口 ${local.population.toLocaleString()}`} />
            <StatCell label={`${prefecture.prefecture}平均`} value={`${local.prefectureAverageRate} 件`} note={`本區為縣均的 ${local.vsPrefecture.toFixed(2)} 倍`} />
            <StatCell label="縣內名次" value={`第 ${local.rank} 名／${local.totalAreas}`} note="第 1 名＝每千人案件最少；同值同名次" />
            <StatCell label="全國平均" value={`${prefecture.nationalRatePerThousand} 件`} note={`${prefecture.prefecture}整體 ${prefecture.crimeRatePerThousand} 件，全國第 ${prefecture.safetyRank} 安全`} />
          </>
        ) : (
          <>
            <StatCell label="每千人刑法犯認知件數" value={`${prefecture.crimeRatePerThousand} 件`} note={`全國平均 ${prefecture.nationalRatePerThousand} 件`} />
            <StatCell label="全國排名" value={`第 ${prefecture.safetyRank} 名／${prefecture.totalPrefectures}`} note="第 1 名＝最安全" />
            <StatCell label="相對全國" value={`${prefecture.vsNational.toFixed(2)} 倍`} />
            {prefecture.clearanceRatePercent !== null ? <StatCell label="刑案破獲率" value={`${prefecture.clearanceRatePercent}%`} /> : null}
          </>
        )}
      </View>
      {breakdown && breakdown.groups.length ? (
        <View style={styles.subBlock}>
          <Text style={styles.sectionLabel}>
            六大分類（{breakdown.scopeKind === "municipality" ? breakdown.scopeLabel || local?.municipality : `${prefecture.prefecture}全縣`}・{breakdown.year} 年・共 {breakdown.total.toLocaleString()} 件）
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {breakdown.groups.map(group => (
              <View key={group.code} style={{ width: "33.33%", paddingRight: 6, paddingVertical: 1.5, flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 7, color: INK }}>{group.label}</Text>
                <Text style={{ fontSize: 7, color: INK_SOFT }}>{group.count.toLocaleString()} 件・{group.percent.toFixed(1)}%</Text>
              </View>
            ))}
          </View>
          {local && breakdown.scopeKind !== "municipality" ? (
            <Text style={{ fontSize: 5.5, color: INK_MUTE, marginTop: 2, backgroundColor: SOFT_BG, padding: 2 }}>
              該縣官方表只提供市區町村總數，分類比例採縣級資料。
            </Text>
          ) : null}
        </View>
      ) : null}
      <View style={[styles.subBlock, styles.subBlockLast, { borderTopWidth: breakdown ? 0 : 1, borderTopColor: LINE_SOFT }]}>
        <Text style={{ fontSize: 7, color: INK_SOFT, lineHeight: 1.4 }}>
          {local
            ? `${local.municipality}全年共 ${local.total.toLocaleString()} 件，每千人 ${local.crimeRatePerThousand} 件；在${prefecture.prefecture} ${local.totalAreas} 個可比較市區町村中排第 ${local.rank} 名。`
            : prefecture.summary}
        </Text>
        <Text style={{ fontSize: 5.5, color: INK_MUTE, marginTop: 2 }}>
          {local && breakdown?.sourceLabel ? `${breakdown.sourceLabel}（${local.year} 年）｜` : ""}{prefecture.credit}
        </Text>
      </View>
    </>
  );
}

export function SafetyCard({ safety }: Pick<ListingReportPdfProps, "safety">) {
  if (!safety) return null;
  return (
    <Card title="周邊治安" tag={safety.precision === "chome" ? "警視庁町丁目統計" : "各縣警・総務省統計"} wrap>
      {safety.precision === "chome" ? <ChomeSafety crime={safety.chome} /> : <PrefectureSafety prefecture={safety.prefecture} />}
    </Card>
  );
}
