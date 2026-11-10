import { ArrowRight, ClipboardList } from "lucide-react";
import { trackAction } from "../lib/trackView";

/**
 * 「填寫找房需求」入口卡。聯絡頁（手機、桌機）與圖紙分析結果底部共用。
 * 連到獨立的 /find-home 問卷頁，網址帶來源標記，後台分得出客人從哪裡進來。
 */
export function FindHomeCta({ from, compact }: { from: string; compact?: boolean }) {
  return (
    <section className={`border-2 border-[#00A174] bg-white ${compact ? "p-4" : "p-5"}`} aria-labelledby={`find-home-cta-${from}`}>
      <p className="text-[11px] font-bold tracking-widest text-[#00A174]">讓 LINUS 聯絡你</p>
      <h3 id={`find-home-cta-${from}`} className={`mt-1 flex items-center gap-2 font-bold ${compact ? "text-[15px]" : "text-lg"}`}>
        <ClipboardList className="h-5 w-5 shrink-0 text-[#00A174]" />告訴我你的日本找房需求
      </h3>
      <p className="mt-1.5 text-xs leading-relaxed text-[#66736C]">約 3 分鐘、用綽號也可以。選擇租房或買房，填好地區、預算與計畫，Linus 會主動聯絡你。</p>
      <a
        href={`/find-home?from=${from}`}
        onClick={() => trackAction("find-home-open")}
        className="mt-3 flex min-h-11 items-center justify-center gap-2 bg-[#00A174] px-5 text-sm font-bold text-white transition-colors hover:bg-[#008F67]"
      >
        開始填寫找房需求<ArrowRight className="h-4 w-4" />
      </a>
    </section>
  );
}
