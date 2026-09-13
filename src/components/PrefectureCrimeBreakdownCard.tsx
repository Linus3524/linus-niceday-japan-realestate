import { SAFETY_PALETTE } from "../lib/safetyPalette";
import { ChevronDown, ListOrdered, PieChart } from "lucide-react";
import type { PrefectureCrimeBreakdown } from "../lib/prefectureCrimeBreakdown";

const COLORS: Record<string, string> = { C: SAFETY_PALETTE.green, B: SAFETY_PALETTE.orange, A: SAFETY_PALETTE.red, D: SAFETY_PALETTE.blue, E: SAFETY_PALETTE.purple, F: SAFETY_PALETTE.gray };

export function PrefectureCrimeBreakdownCard({ data, prefecture }: { data: PrefectureCrimeBreakdown; prefecture: string }) {
  return <div className="space-y-3 border border-[#DDE3DF] bg-[#FAFCFB] p-3.5">
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-[#1A2A22]">
      <span className="flex items-center gap-1.5"><PieChart className="h-4 w-4 text-[#007D5A]" />犯罪類型與認知件數</span>
      <span>{prefecture}・{data.year} 年・共 {data.total.toLocaleString()} 件</span>
    </div>
    <div className="flex h-2 overflow-hidden bg-[#DDE3DF]" aria-label="六大犯罪分類佔比">
      {data.groups.map(group => <div key={group.code} title={`${group.label} ${group.percent.toFixed(2)}%`} style={{ width: `${group.percent}%`, backgroundColor: COLORS[group.code] }} />)}
    </div>
    <div className="divide-y divide-[#DDE3DF]">
      {data.groups.map(group => <details key={group.code} className="group py-2">
        <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 text-[11px] text-[#1A2A22] [&::-webkit-details-marker]:hidden">
          <span className="h-2 w-2 shrink-0" style={{ backgroundColor: COLORS[group.code] }} />
          <span className="min-w-0 flex-1 font-bold">{group.label}</span>
          <span className="font-bold tabular-nums">{group.count.toLocaleString()} 件</span>
          <span className="w-14 text-right tabular-nums text-[#66736C]">{group.percent.toFixed(2)}%</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-3 grid grid-cols-1 gap-x-5 gap-y-1.5 border-t border-dashed border-[#DDE3DF] pt-2 sm:grid-cols-2">
          {group.items.map(item => <div key={item.code} className="flex items-baseline justify-between gap-3 text-[11px] leading-relaxed text-[#55635B]">
            <span className="min-w-0 break-words" title={`官方分類：${item.original}`}>{item.label}</span>
            <span className="shrink-0 font-bold tabular-nums">{item.count.toLocaleString()} 件</span>
          </div>)}
        </div>
      </details>)}
    </div>
    <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-[#66736C]"><ListOrdered className="mt-0.5 h-3 w-3 shrink-0" />點開各類可查看全部明細，含零件數。六類件數合計等於總數；百分比四捨五入可能有尾差。部分細項保留官方日文名稱。</p>
    <p className="text-[10px] leading-relaxed text-[#66736C]">來源：<a href={data.sourceUrl} target="_blank" rel="noreferrer" className="underline">警察廳「令和5年的犯罪」第3、5表</a>。範圍為全都道府縣，非物件所在町丁目；「風俗犯罪」是官方刑法分類，不代表風俗店數量。</p>
  </div>;
}
