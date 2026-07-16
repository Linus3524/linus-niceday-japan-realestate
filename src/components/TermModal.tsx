import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { renderFormattedText } from "../lib/format";
import { JapaneseRuby } from "./JapaneseRuby";

interface TermModalProps {
  selectedFee: any | null;
  setSelectedFee: (fee: any | null) => void;
  handleTabChange: (tab: any) => void;
  handleSendMessage: (e?: any, customMsg?: string) => void;
}

// 依項目類型動態決定按鈕文字與帶入 AI 的問句，避免「圖紙用語」也被稱為「費用」的錯置狀況
function getItemTypeLabel(item: any): string {
  if (!item) return "名詞";
  if (item.category === "drawing") return "圖紙用語";
  if (item.category === "fee") return "費用";
  if (item.duration !== undefined) return "流程步驟";
  if (item.warning !== undefined || item.keyPoints !== undefined) return "費用";
  return "名詞";
}

function splitTermName(name: string) {
  const match = name.match(/^(.*?)(（[^（）]*[\u3400-\u9FFF][^（）]*）)$/);
  return match ? { japanese: match[1], translation: match[2] } : { japanese: name, translation: undefined };
}

function shouldMoveTranslation(translation?: string) {
  return translation ? Array.from(translation.replace(/[（）]/g, "")).length >= 10 : false;
}

function splitReading(reading: string) {
  return reading.split(/([・／/])/).reduce<string[]>((chunks, part) => {
    if (!part) return chunks;
    if (/^[・／/]$/.test(part) && chunks.length > 0) chunks[chunks.length - 1] += part;
    else chunks.push(part);
    return chunks;
  }, []);
}

function shouldStackHeader(name: string) {
  // 手機上保留短詞的左右節奏；只有長名稱才讓日文標籤另起一行，避免和關閉鈕互相擠壓。
  return Array.from(name.replace(/[（）・／/\s]/g, "")).length >= 10;
}

export function TermModal(props: TermModalProps) {
  const { selectedFee, setSelectedFee, handleTabChange, handleSendMessage } = props;
  const itemTypeLabel = getItemTypeLabel(selectedFee);
  const stackHeader = selectedFee ? shouldStackHeader(selectedFee.name) : false;
  return (
    <AnimatePresence>
      {selectedFee && (
          <div 
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs select-text font-serif"
            id="term-modal-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedFee(null);
            }}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-[#DDE3DF] hover:border-[#00a174] w-full max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto p-5 sm:p-6 relative rounded-none shadow-colored-soft transition-all duration-300"
              id="term-modal-content"
            >
              <button 
                onClick={() => setSelectedFee(null)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-[#00a174] cursor-pointer"
                id="term-modal-close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-4">
                <div className={`${stackHeader ? "flex flex-col items-stretch gap-2" : "flex items-start justify-between gap-3"} pr-9 sm:flex-row sm:items-start sm:justify-between sm:gap-3 sm:pr-10 border-b border-zinc-200 pb-3`}>
                  <h4 className={`min-w-0 ${stackHeader ? "w-full" : "flex-1"} flex flex-wrap items-baseline gap-x-0 gap-y-1 text-[clamp(1.1rem,5vw,1.25rem)] leading-[1.45] font-bold text-[#1A2A22]`}>
                    {(() => {
                      const term = splitTermName(selectedFee.name);
                      return <>
                        <span className="min-w-0 break-keep"><JapaneseRuby text={term.japanese} /></span>
                        {term.translation && (
                          <span className={shouldMoveTranslation(term.translation) ? "basis-full break-keep" : "break-keep"}>
                            {term.translation}
                          </span>
                        )}
                      </>;
                    })()}
                  </h4>
                  {selectedFee.jpName && (
                    <span className={`${stackHeader ? "self-end" : "self-auto"} shrink-0 bg-[#00a174] text-white px-2 py-1 font-sans text-xs leading-snug sm:self-auto`}>
                      <span className="flex flex-col items-end gap-y-0">
                        {splitReading(selectedFee.jpName).map((word, index) => <span key={`${word}-${index}`} className="whitespace-nowrap">{word}</span>)}
                      </span>
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="text-sm text-zinc-800 leading-relaxed text-justify">{renderFormattedText(selectedFee.description)}</div>

                  {selectedFee.warning && (
                    <div className="bg-red-50 border-l-4 border-[#00a174] p-3 text-xs text-[#00a174] leading-relaxed font-sans">
                      <strong>⚠️ 注意及風險提醒：</strong>
                      <br />
                      {renderFormattedText(selectedFee.warning)}
                    </div>
                  )}

                  {selectedFee.keyPoints && selectedFee.keyPoints.length > 0 && (
                    <div className="bg-[#F5F8F6] p-4 border border-zinc-200 space-y-2">
                      <span className="font-bold text-xs text-zinc-800 block font-sans">🔍 實務精要細節：</span>
                      {selectedFee.keyPoints.map((point, pIdx) => (
                        <div key={pIdx} className="text-xs text-zinc-700 leading-relaxed flex items-start gap-1.5 font-sans">
                          <span className="text-[#00a174] font-bold">•</span>
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-zinc-100 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3 font-sans">
                  <button
                    onClick={() => {
                      const textToAsk = `想深入了解關於「${selectedFee.name}」這個${itemTypeLabel}的內容與實務細節`;
                      setSelectedFee(null);
                      handleTabChange("chat");
                      handleSendMessage(undefined, textToAsk);
                    }}
                    className="w-full px-4 py-2 border border-[#DDE3DF] hover:border-[#00a174] text-zinc-800 hover:bg-[#F5F8F6] text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors sm:w-auto"
                  >
                    向 AI 顧問諮詢此{itemTypeLabel}
                  </button>
                  <button
                    onClick={() => setSelectedFee(null)}
                    className="w-full px-4 py-2 bg-[#00a174] hover:bg-[#007d5a] text-white text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors sm:w-auto"
                  >
                    關閉視窗
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
      )}
    </AnimatePresence>
  );
}
