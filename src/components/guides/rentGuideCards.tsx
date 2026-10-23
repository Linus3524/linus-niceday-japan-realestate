import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { SpecialTermItem } from "../../data/rentGuideData";
import {
domesticScreeningDocuments,
domesticScreeningNotice,
hasMinimumKnowledgeSearchLength,
overseasScreeningDocuments,
screeningDocumentDisclaimer,
type ScreeningDocumentProfile
} from "../../data/rentStaticSearchData";
import { renderFormattedText } from "../../lib/format";
import { JapaneseRuby } from "../JapaneseRuby";
import { TermDetailList } from "../TermDetailList";
import { useIsDesktop } from "../../hooks/useIsDesktop";


export const availabilityStyle = {
  "多": "bg-[#e6f6f1] text-[#00a174] border-[#9ee2cf]",
  "一般": "bg-[#FEF9C3] text-[#854D0E] border-[#FDE047]",
  "最少": "bg-[#FEE2E2] text-[#B13818] border-[#FCA5A5]",
  "不一定": "bg-[#F2F8FA] text-[#3F626D] border-[#D6EAF0]"
};

export function renderDocumentLabel(document: string) {
  const match = document.match(/^(.*?)\*(\d+)$/);
  if (!match) return document;
  const [, text, noteNum] = match;
  return (
    <>
      {text}
      <sup className="ml-0.5 text-[10px] font-bold text-[#00a174]">※{noteNum}</sup>
    </>
  );
}

// 對照表的橫列：各身份的文件名稱去掉 ※ 註記編號與（非必備）（視個案）後合併成同一列
type DocumentCell = { kind: "req" | "opt" | "case"; note?: string };
function buildDocumentRows(profiles: ScreeningDocumentProfile[]) {
  const rows: { label: string; cells: (DocumentCell | null)[] }[] = [];
  profiles.forEach((profile, col) => {
    profile.documents.forEach(document => {
      const note = document.match(/\*(\d+)$/)?.[1];
      let label = document.replace(/\*\d+$/, "");
      let kind: DocumentCell["kind"] = "req";
      if (label.includes("（非必備）")) { kind = "opt"; label = label.replace("（非必備）", ""); }
      else if (label.includes("（視個案）")) { kind = "case"; label = label.replace("（視個案）", ""); }
      let row = rows.find(r => r.label === label);
      if (!row) { row = { label, cells: profiles.map(() => null) }; rows.push(row); }
      row.cells[col] = { kind, note };
    });
  });
  return rows;
}

export function VisaDocumentMatrix({ searchQuery = "" }: { searchQuery?: string }) {
  const isDesktop = useIsDesktop();
  const [screeningMode, setScreeningMode] = useState<"overseas" | "domestic">("overseas");
  // 電腦版：對照表，橫列是文件、直欄是身份；點欄位標題看該身份的補充說明
  const [selected, setSelected] = useState(0);
  const profiles = screeningMode === "overseas" ? overseasScreeningDocuments : domesticScreeningDocuments;
  useEffect(() => { setSelected(0); }, [screeningMode]);
  useEffect(() => {
    if (!hasMinimumKnowledgeSearchLength(searchQuery)) return;
    const q = searchQuery.trim().toLocaleLowerCase();
    const hit = profiles.findIndex(p => [p.profile, ...p.documents, ...(p.notes ?? [])].join(" ").toLocaleLowerCase().includes(q));
    if (hit >= 0) setSelected(hit);
  }, [searchQuery, profiles]);

  if (isDesktop) {
    // 法人契約的文件和個人身份完全不同，放在表格右側獨立一欄，表格只比較個人身份
    const personal = profiles.filter(p => !p.profile.startsWith("法人"));
    const corporate = profiles.find(p => p.profile.startsWith("法人"));
    const rows = buildDocumentRows(personal);
    const active = profiles[Math.min(selected, profiles.length - 1)];
    const select = (profile: ScreeningDocumentProfile) => setSelected(profiles.indexOf(profile));
    return (
      <div className="rent-routes doc-matrix border border-[#DDE3DF] bg-white p-6 font-sans">
        <div className="mb-4 flex flex-col gap-1 border-b border-[#DDE3DF] pb-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h4 className="text-base font-bold text-[#1A2A22]">依身份準備的文件</h4>
            <p className="mt-1 text-xs leading-relaxed text-[#3F5147] font-sans">先選審查地點，再對照自己的身份那一欄；點身份名稱可看補充說明。</p>
          </div>
          <div className="doc-matrix-modes" role="tablist" aria-label="審查地點">
            <button type="button" role="tab" aria-selected={screeningMode === "overseas"} className={screeningMode === "overseas" ? "is-active" : ""} onClick={() => setScreeningMode("overseas")}>海外審查</button>
            <button type="button" role="tab" aria-selected={screeningMode === "domestic"} className={screeningMode === "domestic" ? "is-active" : ""} onClick={() => setScreeningMode("domestic")}>日本境內審查</button>
          </div>
        </div>

        {screeningMode === "domestic" && <p className="doc-matrix-notice"><span>共同必備</span>{domesticScreeningNotice.replace(/^境內申請前必須準備：/, "")}</p>}

        <div className={`doc-matrix-layout ${corporate ? "has-aside" : ""}`} key={screeningMode}>
          <table className="doc-matrix-table">
            <thead>
              <tr>
                <th scope="col" className="doc-matrix-corner">文件</th>
                {personal.map(profile => (
                  <th key={profile.profile} scope="col" className={profile === active ? "is-active" : ""}>
                    <button type="button" aria-pressed={profile === active} onClick={() => select(profile)}>
                      <span className="doc-matrix-name">{profile.profile}</span>
                      <span className={`doc-matrix-badge ${availabilityStyle[profile.availability]}`}>房源量：{profile.availability}</span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  {row.cells.map((cell, col) => (
                    <td key={personal[col].profile} className={personal[col] === active ? "is-active" : ""}>
                      {cell && (
                        <span className={`doc-matrix-mark is-${cell.kind}`} title={{ req: "需準備", opt: "非必備", case: "視個案" }[cell.kind]}>
                          {{ req: "✓", opt: "＋", case: "視個案" }[cell.kind]}
                          {cell.note && <sup>※{cell.note}</sup>}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {corporate && (
            <button type="button" className={`doc-matrix-aside ${corporate === active ? "is-active" : ""}`} aria-pressed={corporate === active} onClick={() => select(corporate)}>
              <span className="doc-matrix-aside-head">
                <span className="doc-matrix-name">{corporate.profile}</span>
                <span className={`doc-matrix-badge ${availabilityStyle[corporate.availability]}`}>房源量：{corporate.availability}</span>
              </span>
              <span className="doc-matrix-aside-list">
                {corporate.documents.map(document => (
                  <span key={document} className={document.includes("非必備") ? "is-optional" : ""}>{renderDocumentLabel(document)}</span>
                ))}
              </span>
            </button>
          )}
        </div>

        <div className="doc-matrix-foot">
          <p className="doc-matrix-legend"><span className="doc-matrix-mark is-req">✓</span>需準備<span className="doc-matrix-mark is-opt">＋</span>非必備，有的話可附上</p>
          <div className="doc-matrix-notes" aria-live="polite">
            <p className="doc-matrix-notes-title">{active.profile}的補充說明</p>
            {active.notes && active.notes.length > 0
              ? active.notes.map(noteItem => <p key={noteItem}>{noteItem}</p>)
              : <p>沒有額外補充。</p>}
          </div>
        </div>

        <p className="doc-matrix-disclaimer">{screeningDocumentDisclaimer}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 font-sans">
      <div className="grid grid-cols-2 border border-[#1A2A22] bg-white p-1">
        <button onClick={() => setScreeningMode("overseas")} className={`min-h-12 px-4 py-3 text-sm font-bold ${screeningMode === "overseas" ? "bg-[#1A2A22] text-white" : "text-[#3F5147] hover:bg-[#F5F8F6]"}`}>✈ 海外審查</button>
        <button onClick={() => setScreeningMode("domestic")} className={`min-h-12 px-4 py-3 text-sm font-bold ${screeningMode === "domestic" ? "bg-[#00a174] text-white" : "text-[#3F5147] hover:bg-[#F5F8F6]"}`}>🇯🇵 日本境內審查</button>
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
      <div className="border border-[#FDE047] bg-[#FEF9C3] p-4 text-xs leading-6 text-[#854D0E] md:text-sm">{screeningDocumentDisclaimer}</div>
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
          <span className="shrink-0 text-xs bg-[#F5F8F6] px-1.5 py-0.5 border border-[#DDE3DF] text-[#3F5147] font-sans font-medium">
            {term.jpName}
          </span>
        )}
      </div>
      <div className="text-sm text-[#3F5147] leading-relaxed mb-4">{renderFormattedText(term.description)}</div>

      {details.length > 0 && (
        <div className={isFloorPlanTerm ? "" : "bg-[#F5F8F6] p-4 border border-[#DDE3DF] space-y-2.5"}>
          <TermDetailList termName={term.name} details={visibleDetails} allDetails={details} />
          {isCollapsible && (
            <button
              type="button"
              onClick={() => setExpanded(prev => !prev)}
              aria-expanded={expanded}
              className="flex w-full items-center justify-center gap-1 border-t border-[#DDE3DF] pt-2.5 font-sans text-xs font-bold text-[#00a174] hover:underline cursor-pointer"
            >
              {expanded ? "收合" : `展開其餘 ${hiddenCount} 項`}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-xs text-[#8A9590] font-sans border-t border-[#ECEFEC] pt-2.5">
        <span>格局／設備</span>
        <button
          type="button"
          onClick={onAskAI}
          className="text-[#3F5147] flex items-center gap-0.5 hover:text-[#00a174] cursor-pointer"
        >
          向 AI 顧問諮詢 →
        </button>
      </div>
    </div>
  );
}
