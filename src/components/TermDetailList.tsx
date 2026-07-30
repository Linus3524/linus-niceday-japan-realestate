import type { ReactNode } from "react";
import { parseTermDetail, usesCodeTags } from "../lib/termDetail";
import { InteractiveFloorPlan } from "./InteractiveFloorPlan";

// 把「標題：」開頭的片段加粗，維持條列原本的閱讀節奏。
function renderInlineLabels(detail: string) {
  const nodes: ReactNode[] = [];
  const labelPattern = /(^|\|\s*)([^|：:]+[：:])/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = labelPattern.exec(detail)) !== null) {
    if (match.index > lastIndex) nodes.push(detail.slice(lastIndex, match.index));
    nodes.push(match[1]);
    nodes.push(<strong key={`${match[2]}-${index++}`} className="font-semibold text-[#1A2A22]">{match[2]}</strong>);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < detail.length) nodes.push(detail.slice(lastIndex));
  return nodes;
}

/**
 * 術語條列。對照表型的卡片（間取り／建築構造／建物種別）會把代號抽成左欄標籤，
 * 讓使用者能照著圖紙上的 RC造、LDK 直接往下掃；其餘卡片維持原本的 ✦ 條列。
 */
export function TermDetailList({
  termName,
  details,
  allDetails
}: {
  termName: string;
  details: string[];
  /** 收合時傳入完整清單，代號欄才能一律以展開後的最長代號決定寬度。 */
  allDetails?: string[];
}) {
  if (termName === "間取り") {
    return <InteractiveFloorPlan />;
  }

  if (!usesCodeTags(termName)) {
    return (
      <div className="space-y-2.5">
        {details.map((detail, idx) => (
          <div key={idx} className="text-xs text-zinc-800 leading-relaxed flex items-start gap-2 font-sans">
            <span className="text-[#00a174] font-bold shrink-0">✦</span>
            <span className="text-justify">{renderInlineLabels(detail)}</span>
          </div>
        ))}
      </div>
    );
  }

  // 代號欄用 max-content：每張卡各自依自己最長的代號決定寬度，
  // 「間取り」的單字母不會被「建築構造」的長代號撐開。
  // 但 max-content 只看得到當下渲染的列，收合時會少算被藏起來的代號，
  // 所以額外放一列零高度的「撐寬用」代號，讓欄寬永遠等於全部展開時的寬度。
  const widestCode = (allDetails ?? details)
    .map(detail => parseTermDetail(detail).code ?? "")
    .reduce((longest, code) => (code.length > longest.length ? code : longest), "");

  return (
    <div className="-mt-2.5 grid grid-cols-[max-content_minmax(0,1fr)] gap-x-3 gap-y-2.5 font-sans">
      <span aria-hidden="true" className="invisible h-0 overflow-hidden">
        <span className="block whitespace-nowrap border px-1.5 py-0.5 text-center font-mono text-[11px] leading-tight">
          {widestCode}
        </span>
      </span>
      <span aria-hidden="true" className="h-0" />
      {details.map((detail, idx) => {
        const { code, label, body } = parseTermDetail(detail);
        return (
          <div key={idx} className="contents">
            <span className="pt-px">
              {code && (
                <span className="block whitespace-nowrap border border-[#9ee2cf] bg-[#e6f6f1] px-1.5 py-0.5 text-center font-mono text-[11px] leading-tight text-[#007d5a]">
                  {code}
                </span>
              )}
            </span>
            <span className="text-xs leading-relaxed text-zinc-800 text-justify">
              {label && <strong className="mr-1.5 font-semibold text-[#1A2A22]">{label}</strong>}
              {body}
            </span>
          </div>
        );
      })}
    </div>
  );
}
