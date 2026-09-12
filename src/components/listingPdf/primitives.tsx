import { Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import { type ParsedEquipmentItem } from "../../lib/equipmentParser";
import { parseAndExplainSpecialNotes } from "../../lib/specialNotesParser";
import { pct } from './formatters.js';
import type { Tone } from './styles.js';
import { GREEN_DEEP, ORANGE_DEEP, styles } from './styles.js';


/* ───────────── 共用小元件 ───────────── */
export function Card({ title, tag, children, wrap = false }: { title: string; tag?: string; children: ReactNode; wrap?: boolean }) {
  return (
    <View style={styles.card} wrap={wrap}>
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

export function Cell({ label, value, wide, half }: { label: string; value: string | null | undefined; wide?: boolean; half?: boolean }) {
  if (!value) return null;
  return (
    <View style={wide ? styles.gridCellWide : half ? styles.gridCellHalf : styles.gridCell}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export function Bullets({ items }: { items: string[] }) {
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

export function VerdictBox({ tone, status, headline, detail }: { tone: Tone; status: string; headline: string; detail?: string | null }) {
  return (
    <View style={[styles.verdictBox, { backgroundColor: tone.bg, borderColor: tone.border }]}>
      <Text style={[styles.verdictStatus, { color: tone.color }]}>{status}</Text>
      <Text style={[styles.verdictHeadline, { color: tone.color }]}>{headline}</Text>
      {detail ? <Text style={styles.verdictDetail}>{detail}</Text> : null}
    </View>
  );
}

/** 影響價格的因素表：與網站同樣用小長條表示強度，滿格 ±15%。加項為綠、減項為紅。 */
export function FactorTable({ factors, scale = 15 }: { factors: Array<{ label: string; ratePercent: number; note: string; applied?: boolean }>; scale?: number }) {
  return (
    <View>
      {factors.map((f, i) => {
        const reference = f.applied === false;
        const width = Math.min(100, (Math.abs(f.ratePercent) / scale) * 100);
        const isUp = f.ratePercent > 0;
        const isDown = f.ratePercent < 0;
        const color = isUp ? GREEN_DEEP : isDown ? ORANGE_DEEP : "#8A9590";
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

export function EquipmentCard({ items }: { items: ParsedEquipmentItem[] }) {
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

export function SpecialNotesCard({ notes }: { notes: unknown }) {
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
