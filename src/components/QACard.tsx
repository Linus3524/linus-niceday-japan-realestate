import { ChevronDown, Lightbulb, ShieldAlert } from "lucide-react";
import { renderFormattedText } from "../lib/format";

interface QACardProps {
  key?: string | number;
  question: string;
  answer: string;
  number: number;
  sources?: Array<{ label: string; url: string }>;
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

export function QACard({ question, answer, number, sources }: QACardProps) {
  const blocks = answer.split(/\n\s*\n/).filter(Boolean);
  const isLong = answer.length > 260 || blocks.length > 1;

  return (
    <article className="border border-[#DDE3DF] hover:border-[#0F8F6D] bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-colored-soft">
      <details className="group" open={!isLong}>
        <summary className="flex cursor-pointer list-none items-start gap-3 p-4 marker:hidden md:p-5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-[#0F8F6D] text-xs font-bold text-white font-jost">Q{number}</span>
          <div className="min-w-0 flex-1">
            <h4 className="pr-4 text-sm font-bold leading-relaxed text-[#1A2A22] md:text-base">{question}</h4>
            {isLong && <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{getSummary(answer)}</p>}
          </div>
          <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-[#0F8F6D] transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-dashed border-zinc-200 bg-[#F5F8F6] px-4 pb-5 pt-4 md:px-5">
          <div className="mb-4 flex">
            <span className="inline-flex items-center gap-1 font-serif text-[11px] font-medium tracking-wide bg-[#A8D5C2] border border-[#0F8F6D] text-[#0A6D52] px-2.5 py-0.5 select-none">
              <Lightbulb className="h-3.5 w-3.5 shrink-0" /> LINUS 實務說明
            </span>
          </div>
          <div className="font-sans text-xs text-justify md:text-sm">
            {blocks.map((block, index) => <AnswerBlock key={index} text={block} />)}
          </div>
          {sources && sources.length > 0 && (
            <div className="mt-5 border-t border-zinc-200 pt-3 font-sans">
              <p className="text-[10px] font-bold tracking-wide text-zinc-500">官方依據</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {sources.map(source => (
                  <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="border border-[#A8D5C2] bg-white px-2.5 py-1.5 text-[10px] font-bold text-[#0A6D52] underline-offset-2 hover:underline">
                    {source.label} ↗
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </details>
    </article>
  );
}
