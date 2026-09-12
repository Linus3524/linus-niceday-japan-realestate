import {
LoaderCircle,
Sparkles
} from "lucide-react";
import type { CalculatorViewModel } from "../../hooks/useCalculatorController";
import { RequirementAssessment } from "../RequirementAssessment";

type Props = Pick<CalculatorViewModel, "aiPrompt" | "setAiPrompt" | "analyzeNaturalLanguageRent" | "aiInputLoading" | "aiResult" | "aiInputError">;
export function GuidedNaturalLanguageFields({ aiPrompt, setAiPrompt, analyzeNaturalLanguageRent, aiInputLoading, aiResult, aiInputError }: Props) {
  return (<><div role="tabpanel">
        <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#00a174] font-sans">
          <Sparkles className="h-4 w-4" /> AI Market Reality Check
        </div>
        <h3 className="mb-3 text-xl font-bold leading-snug text-[#1A2A22] md:text-2xl">
          說出理想生活，找到真住得起的選擇
        </h3>
        <div className="mb-5 space-y-3 text-sm leading-relaxed text-[#3F5147] font-sans">
          <p>告訴我們您的預算、通勤地點與理想條件，我們會整理適合的地區與車站，並估算合理的租金範圍。</p>
          <p>當條件與預算出現落差，也會清楚指出可以調整的方向，協助您在理想、通勤與負擔能力之間，找到最適合自己的平衡。</p>
        </div>
        <textarea
          value={aiPrompt}
          onChange={event => setAiPrompt(event.target.value)}
          maxLength={1000}
          rows={6}
          placeholder="例如：預算含管理費 10 萬円，想住東急東橫線，1K 25㎡以上，要獨立洗面台、電梯，走路 10 分鐘內。"
          className="w-full resize-y border border-[#1A2A22] bg-white p-4 text-sm text-[#1A2A22] placeholder:text-[#8A9590] focus:outline-none focus:ring-2 focus:ring-[#00a174]/30 font-sans"
        />
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={analyzeNaturalLanguageRent}
            disabled={!aiPrompt.trim() || aiInputLoading}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 bg-[#18181B] px-5 text-sm font-bold text-white transition-colors hover:bg-[#303033] disabled:cursor-not-allowed disabled:opacity-45 font-sans"
          >
            {aiInputLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {aiInputLoading ? "正在對標市場與計算路線…" : aiResult ? "依目前條件重新分析" : "AI 分析可行性與推薦車站"}
          </button>
          <button
            type="button"
            onClick={() => setAiPrompt("簽證種類：技人國簽證，5年\n期望預算：¥20萬以下（含管理費）\n期望地區：目黑區／世田谷區、超市 10 分鐘內\n期望車站：東急東橫線沿線 (武蔵小杉、元住吉、日吉)、車站徒步 10 分鐘內\n房型設備：1LDK，RC/SRC造、25平米以上、一樓自動門、獨立洗面台、溫水清淨便器\n通勤地點：惠比壽車站\n其他條件：2 樓以上、陽台、瓦斯爐2個以上、可養貓")}
            className="min-h-12 border border-[#1A2A22] bg-white px-4 text-xs font-bold text-[#1A2A22] hover:bg-[#F5F8F6] font-sans"
          >
            套用範例
          </button>
        </div>
        <p className="mt-2 text-[9px] text-[#66736C] font-sans">為保護分析服務額度，同一使用者每 3 分鐘最多分析 3 次。</p>
        {aiInputError && <p className="mt-3 bg-[#FBDFD2] p-3 text-xs text-[#B13818] font-sans">{aiInputError}</p>}
        {aiResult && <RequirementAssessment criteria={aiResult.criteria} recommendations={aiResult.recommendations} />}
      </div></>);
}
