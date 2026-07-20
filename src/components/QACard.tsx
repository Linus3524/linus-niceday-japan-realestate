import { ChevronDown, Lightbulb } from "lucide-react";
import { renderFormattedText } from "../lib/format";

interface QACardProps {
  key?: string | number;
  question: string;
  answer: string;
  number: number;
  sources?: Array<{ label: string; url: string }>;
  table?: {
    caption: string;
    cornerLabel?: string;
    columns: string[];
    rows: Array<{ label: string; cells: string[] }>;
    notes?: string[];
  };
}

const getSummary = (answer: string) => {
  const firstParagraph = answer.split(/\n\s*\n/).find(part => part.trim())?.trim() || answer.trim();
  const plain = firstParagraph.replace(/^\d+\.\s*/, "");
  return plain.length > 115 ? `${plain.slice(0, 115)}…` : plain;
};

const AnswerBlock = ({ text }: { text: string; key?: string | number }) => {
  const trimmed = text.trim();
  const standaloneHeading = trimmed.match(/^【(.+)】$/);
  if (standaloneHeading) return <div className="mt-4 mb-2 font-bold text-zinc-800">{renderFormattedText(standaloneHeading[1])}</div>;

  const lines = trimmed.split("\n").map(line => line.trim()).filter(Boolean);

  return (
    <div className="mt-3 space-y-2 text-zinc-700 leading-relaxed">
      {lines.map((line, index) => {
        const heading = line.match(/^【(.+)】$/);
        if (heading) {
          return <div key={index} className="pt-2 font-bold text-zinc-800">{renderFormattedText(heading[1])}</div>;
        }

        const orderedItem = line.match(/^(\d+)[.、]\s*(.+)$/);
        if (orderedItem) {
          return (
            <div key={index} className="grid grid-cols-[1.5rem_1fr] items-start gap-1">
              <span className="text-zinc-700">{orderedItem[1]}.</span>
              <div>{renderFormattedText(orderedItem[2])}</div>
            </div>
          );
        }

        const bulletItem = line.match(/^[•・\-●▪︎]\s*(.+)$/);
        if (bulletItem) {
          return (
            <div key={index} className="grid grid-cols-[1rem_1fr] items-start gap-1">
              <span className="text-zinc-700">•</span>
              <div>{renderFormattedText(bulletItem[1])}</div>
            </div>
          );
        }

        return <div key={index}>{renderFormattedText(line)}</div>;
      })}
    </div>
  );
};

export function QACard({ question, answer, number, sources, table }: QACardProps) {
  const blocks = answer.split(/\n\s*\n/).filter(Boolean);
  const isLong = answer.length > 260 || blocks.length > 1;

  return (
    <article className="border border-[#DDE3DF] hover:border-[#00a174] bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-colored-soft">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-start gap-3 p-4 marker:hidden md:p-5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-[#00a174] text-xs font-bold text-white font-jost">Q{number}</span>
          <div className="min-w-0 flex-1">
            <h4 className="pr-4 text-sm font-bold leading-relaxed text-[#1A2A22] md:text-base">{question}</h4>
            {isLong && <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{getSummary(answer)}</p>}
          </div>
          <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-[#00a174] transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-dashed border-zinc-200 bg-[#F5F8F6] px-4 pb-5 pt-4 md:px-5">
          <div className="mb-4 flex">
            <span className="inline-flex items-center gap-1 font-serif text-[11px] font-medium tracking-wide bg-[#e6f6f1] border border-[#9ee2cf] text-[#007d5a] px-2.5 py-0.5 select-none">
              <Lightbulb className="h-3.5 w-3.5 shrink-0" /> LINUS 實務說明
            </span>
          </div>
          <div className="font-sans text-xs text-justify md:text-sm">
            {blocks.map((block, index) => <AnswerBlock key={index} text={block} />)}
          </div>
          {table && (
            <div className="mt-5 font-sans">
              <h5 className="mb-2 font-bold text-zinc-800">{table.caption}</h5>
              <div className="overflow-x-auto border border-[#DDE3DF] bg-white">
                <table className="min-w-[900px] w-full table-fixed border-collapse text-left text-[11px] leading-relaxed">
                  <thead>
                    <tr className="bg-[#E6F6F1] text-[#1A2A22]">
                      <th className="w-[180px] whitespace-normal break-words border-b border-r border-[#BFD8CF] px-3 py-2.5">{table.cornerLabel || "項目"}</th>
                      {table.columns.map(column => (
                        <th key={column} className="whitespace-normal break-words border-b border-r border-[#BFD8CF] px-3 py-2.5 last:border-r-0">{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row, rowIndex) => (
                      <tr key={row.label} className={rowIndex % 2 === 0 ? "bg-white" : "bg-[#F7FAF8]"}>
                        <th className="whitespace-normal break-words border-b border-r border-[#DDE3DF] px-3 py-2.5 font-bold text-zinc-800">{row.label}</th>
                        {row.cells.map((cell, cellIndex) => {
                          const limited = cell.startsWith("僅");
                          const worldwide = cell.startsWith("國內外全部財產");
                          return (
                            <td
                              key={`${row.label}-${cellIndex}`}
                              className={`whitespace-normal break-words border-b border-r border-[#DDE3DF] px-3 py-2.5 last:border-r-0 ${
                                limited
                                  ? "bg-[#F4F5F5] text-zinc-600"
                                  : worldwide
                                    ? "bg-[#DDF4EB] font-bold text-[#006B4E]"
                                    : "text-zinc-700"
                              }`}
                            >
                              {cell}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-2 space-y-1 text-[10px] leading-relaxed text-zinc-500">
                {table.notes?.map(note => <p key={note}>• {note}</p>)}
              </div>
            </div>
          )}
          {sources && sources.length > 0 && (
            <div className="mt-5 border-t border-zinc-200 pt-3 font-sans">
              <p className="text-[10px] font-bold tracking-wide text-zinc-500">官方依據</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {sources.map(source => (
                  <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="border border-[#9ee2cf] bg-white px-2.5 py-1.5 text-[10px] font-bold text-[#007d5a] underline-offset-2 hover:underline">
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
