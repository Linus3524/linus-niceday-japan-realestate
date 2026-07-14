import { ChevronDown, Lightbulb, ShieldAlert } from "lucide-react";
import { renderFormattedText } from "../lib/format";

interface QACardProps {
  key?: string | number;
  question: string;
  answer: string;
  number: number;
}

const getSummary = (answer: string) => {
  const firstParagraph = answer.split(/\n\s*\n/).find(part => part.trim())?.trim() || answer.trim();
  const plain = firstParagraph.replace(/^\d+\.\s*/, "");
  return plain.length > 115 ? `${plain.slice(0, 115)}…` : plain;
};

const AnswerBlock = ({ text }: { text: string; key?: string | number }) => {
  const trimmed = text.trim();
  if (/^【.+】$/.test(trimmed)) return <h5 className="mt-5 mb-2 text-xs font-bold text-[#0F8F6D]">{trimmed}</h5>;

  if (/^(⚠|★)/.test(trimmed)) {
    return (
      <div className="mt-4 flex gap-2 border-l-2 border-amber-500 bg-amber-50 px-3 py-2.5 text-amber-950">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <div>{renderFormattedText(trimmed)}</div>
      </div>
    );
  }

  return <div className="mt-3 text-zinc-700 leading-relaxed">{renderFormattedText(trimmed)}</div>;
};

export function QACard({ question, answer, number }: QACardProps) {
  const blocks = answer.split(/\n\s*\n/).filter(Boolean);
  const isLong = answer.length > 260 || blocks.length > 1;

  return (
    <article className="border border-[#1A2A22] bg-white transition-shadow hover:shadow-[3px_3px_0px_0px_rgba(26,42,34,1)]">
      <details className="group" open={!isLong}>
        <summary className="flex cursor-pointer list-none items-start gap-3 p-4 marker:hidden md:p-5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-[#0F8F6D] text-xs font-bold text-white">Q{number}</span>
          <div className="min-w-0 flex-1">
            <h4 className="pr-4 text-sm font-bold leading-relaxed text-[#1A2A22] md:text-base">{question}</h4>
            {isLong && <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{getSummary(answer)}</p>}
          </div>
          <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-[#0F8F6D] transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-dashed border-zinc-300 bg-[#F9FBFA] px-4 pb-5 pt-4 md:px-5">
          <div className="mb-3 flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-[#0F8F6D]">
            <Lightbulb className="h-3.5 w-3.5" /> LINUS 實務整理
          </div>
          <div className="font-sans text-xs text-justify md:text-sm">
            {blocks.map((block, index) => <AnswerBlock key={index} text={block} />)}
          </div>
        </div>
      </details>
    </article>
  );
}
