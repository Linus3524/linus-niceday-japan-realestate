import { ArrowRight } from "lucide-react";
import { criteriaToFindHomeDraft } from "../../lib/findHome/calculatorBridge";
import { FIND_HOME_DRAFT_KEY } from "../../lib/findHome/draft";
import type { RentSearchCriteria } from "../../lib/rentAnalysis";
import { trackAction } from "../../lib/trackView";

/**
 * 費用試算結果下方：「把這些條件交給 Linus」。
 * 條件寫成找房問卷的草稿（存在客人自己的瀏覽器），打開問卷就已經填好，客人只要補其他題目和聯絡方式。
 */
export function FindHomeHandoffCta({ criteria }: { criteria: RentSearchCriteria }) {
  const handoff = () => {
    trackAction("find-home-open");
    try {
      localStorage.setItem(FIND_HOME_DRAFT_KEY, JSON.stringify(criteriaToFindHomeDraft(criteria)));
    } catch {
      /* 存不進去（無痕模式等）就直接開空白問卷 */
    }
    window.location.assign("/find-home?from=calculator");
  };
  return (
    <section className="mt-4 border-2 border-[#00A174] bg-white p-4" aria-labelledby="calc-find-home-cta">
      <h4 id="calc-find-home-cta" className="text-sm font-bold text-[#1A2A22]">還在找房？把這些條件交給 Linus</h4>
      <p className="mt-1 text-xs leading-relaxed text-[#66736C]">剛才選的地區、預算、格局和設備會自動帶進找房問卷，補上入住時間和聯絡方式就能送出，Linus 會主動聯絡你。</p>
      <button
        type="button"
        onClick={handoff}
        className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 bg-[#00A174] px-4 text-sm font-bold text-white transition-colors hover:bg-[#008F67]"
      >
        帶著這些條件填找房需求<ArrowRight className="h-4 w-4" />
      </button>
    </section>
  );
}
