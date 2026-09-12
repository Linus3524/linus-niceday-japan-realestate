import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { SpecialTermItem } from "../../data/rentGuideData";
import {
domesticScreeningDocuments,
domesticScreeningNotice,
hasMinimumKnowledgeSearchLength,
overseasScreeningDocuments,
screeningDocumentDisclaimer
} from "../../data/rentStaticSearchData";
import { renderFormattedText } from "../../lib/format";
import { JapaneseRuby } from "../JapaneseRuby";
import { TermDetailList } from "../TermDetailList";


export const availabilityStyle = {
  "多": "bg-[#e6f6f1] text-[#007d5a] border-[#9ee2cf]",
  "一般": "bg-[#FFF9ED] text-[#7A5A1F] border-[#DCC8A1]",
  "最少": "bg-[#FBDFD2] text-[#B13818] border-[#E94E2B]",
  "不一定": "bg-[#F2F8FA] text-[#3F626D] border-[#D6EAF0]"
};

export function renderDocumentLabel(document: string) {
  const match = document.match(/^(.*?)\*(\d+)$/);
  if (!match) return document;
  const [, text, noteNum] = match;
  return (
    <>
      {text}
      <sup className="ml-0.5 text-[10px] font-bold text-[#007d5a]">※{noteNum}</sup>
    </>
  );
}

export function VisaDocumentMatrix({ searchQuery = "" }: { searchQuery?: string }) {
  const [screeningMode, setScreeningMode] = useState<"overseas" | "domestic">("overseas");
  useEffect(() => {
    if (!hasMinimumKnowledgeSearchLength(searchQuery)) return;
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
    const overseasText = overseasScreeningDocuments.flatMap(profile => [profile.profile, ...profile.documents, ...(profile.notes ?? [])]).join(" ").toLocaleLowerCase();
    const domesticText = [domesticScreeningNotice, ...domesticScreeningDocuments.flatMap(profile => [profile.profile, ...profile.documents, ...(profile.notes ?? [])])].join(" ").toLocaleLowerCase();
    if (domesticText.includes(normalizedQuery) && !overseasText.includes(normalizedQuery)) {
      setScreeningMode("domestic");
    } else if (overseasText.includes(normalizedQuery)) {
      setScreeningMode("overseas");
    }
  }, [searchQuery]);
  const profiles = screeningMode === "overseas" ? overseasScreeningDocuments : domesticScreeningDocuments;
  return (
    <div className="space-y-5 font-sans">
      <div className="grid grid-cols-2 border border-[#1A2A22] bg-white p-1">
        <button onClick={() => setScreeningMode("overseas")} className={`min-h-12 px-4 py-3 text-sm font-bold ${screeningMode === "overseas" ? "bg-[#1A2A22] text-white" : "text-[#3F5147] hover:bg-[#F5F8F6]"}`}>✈ 海外審査</button>
        <button onClick={() => setScreeningMode("domestic")} className={`min-h-12 px-4 py-3 text-sm font-bold ${screeningMode === "domestic" ? "bg-[#00a174] text-white" : "text-[#3F5147] hover:bg-[#F5F8F6]"}`}>🇯🇵 日本境內審査</button>
      </div>
      {screeningMode === "domestic" && (
        <div className="border-l-4 border-[#00a174] bg-[#e6f6f1] p-4 text-sm leading-7 text-[#3F5147]">{domesticScreeningNotice}</div>
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {profiles.map(profile => (
          <article key={profile.profile} className="flex h-full flex-col border border-[#DDE3DF] bg-white p-5 md:p-6">
            <div className="flex items-start justify-between gap-3 border-b border-[#DDE3DF] pb-3">
              <h6 className="text-base font-bold leading-6 text-[#1A2A22]">{profile.profile}</h6>
              <span className={`shrink-0 border px-2.5 py-1 text-[11px] font-bold ${availabilityStyle[profile.availability]}`}>房源量：{profile.availability}</span>
            </div>
            <p className="mt-4 text-xs font-bold tracking-wider text-[#66736C]">申請時建議先準備</p>
            <ul className="mt-3 space-y-2.5 flex-1">
              {profile.documents.map(document => {
                const isOptional = document.includes("非必備");
                return (
                  <li key={document} className="flex items-start gap-2.5 text-sm leading-6 text-[#3F5147]">
                    <span className={`mt-0.5 inline-flex h-5 w-4 shrink-0 items-center justify-center font-bold ${isOptional ? "text-[#b87333]" : "text-[#00a174]"}`}>
                      {isOptional ? "＋" : "✓"}
                    </span>
                    <span className="flex-1">{renderDocumentLabel(document)}</span>
                  </li>
                );
              })}
            </ul>
            {profile.notes && profile.notes.length > 0 && (
              <div className="mt-4 space-y-1.5 border-t border-dashed border-[#DDE3DF] pt-3 text-xs leading-5 text-[#66736C]">
                {profile.notes.map((noteItem, idx) => (
                  <p key={idx}>{noteItem}</p>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
      <div className="border border-[#DCC8A1] bg-[#FFF9ED] p-4 text-xs leading-6 text-[#66583D] md:text-sm">{screeningDocumentDisclaimer}</div>
    </div>
  );
}

// 這類術語卡的內容本來就完整攤在卡片上，再開一層 TermModal 只會看到更少的東西，
// 所以改成就地收合：長清單露出前幾條，其餘由使用者自己決定要不要展開。
export const TERM_DETAIL_PREVIEW = 5;
// 只藏一兩條反而多一次點擊，不划算；要藏得夠多才值得收合（例如 4 條的「建物種別」就整份攤開）。
export const TERM_DETAIL_MIN_HIDDEN = 3;

export function SpecialTermCard({ term, onAskAI }: { key?: string | number; term: SpecialTermItem; onAskAI: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const isFloorPlanTerm = term.name === "間取り";
  const isBuildingStructureTerm = term.name === "建築構造";
  const details = term.details ?? [];
  const isCollapsible = !isFloorPlanTerm && !isBuildingStructureTerm && details.length >= TERM_DETAIL_PREVIEW + TERM_DETAIL_MIN_HIDDEN;
  const visibleDetails = isCollapsible && !expanded ? details.slice(0, TERM_DETAIL_PREVIEW) : details;
  const hiddenCount = details.length - TERM_DETAIL_PREVIEW;

  return (
    <div className="border border-[#DDE3DF] bg-white p-6 transition-all duration-300 relative">
      <div className="flex justify-between items-start gap-2 mb-3">
        <h4 className="font-bold text-base leading-[1.8] text-[#1A2A22]">
          <JapaneseRuby text={term.name} />
        </h4>
        {term.jpName && (
          <span className="shrink-0 text-xs bg-[#F5F8F6] px-1.5 py-0.5 border border-zinc-200 text-zinc-600 font-sans font-medium">
            {term.jpName}
          </span>
        )}
      </div>
      <div className="text-sm text-zinc-700 leading-relaxed mb-4">{renderFormattedText(term.description)}</div>

      {details.length > 0 && (
        <div className={isFloorPlanTerm ? "" : "bg-[#F5F8F6] p-4 border border-zinc-200 space-y-2.5"}>
          <TermDetailList termName={term.name} details={visibleDetails} allDetails={details} />
          {isCollapsible && (
            <button
              type="button"
              onClick={() => setExpanded(prev => !prev)}
              aria-expanded={expanded}
              className="flex w-full items-center justify-center gap-1 border-t border-zinc-200 pt-2.5 font-sans text-xs font-bold text-[#007d5a] hover:text-[#00a174] cursor-pointer"
            >
              {expanded ? "收合" : `展開其餘 ${hiddenCount} 項`}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-xs text-zinc-400 font-sans border-t border-zinc-100 pt-2.5">
        <span>房屋／設備</span>
        <button
          type="button"
          onClick={onAskAI}
          className="text-zinc-600 flex items-center gap-0.5 hover:text-[#00a174] cursor-pointer"
        >
          向 AI 顧問諮詢 →
        </button>
      </div>
    </div>
  );
}
