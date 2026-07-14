import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { renderFormattedText } from "../lib/format";

interface TermModalProps {
  selectedFee: any | null;
  setSelectedFee: (fee: any | null) => void;
  handleTabChange: (tab: any) => void;
  handleSendMessage: (e?: any, customMsg?: string) => void;
}

export function TermModal(props: TermModalProps) {
  const { selectedFee, setSelectedFee, handleTabChange, handleSendMessage } = props;
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
              className="bg-white border-2 border-[#1A2A22] w-full max-w-lg p-6 relative rounded-none shadow-[8px_8px_0px_0px_rgba(26, 42, 34,1)]"
              id="term-modal-content"
            >
              <button 
                onClick={() => setSelectedFee(null)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-[#1A2A22] cursor-pointer"
                id="term-modal-close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-200 pb-2.5">
                  <h4 className="text-xl font-bold text-[#1A2A22]">{selectedFee.name}</h4>
                  {selectedFee.jpName && (
                    <span className="text-xs bg-[#0F8F6D] text-white px-1.5 py-0.5 font-sans">{selectedFee.jpName}</span>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="text-sm text-zinc-800 leading-relaxed text-justify">{renderFormattedText(selectedFee.description)}</div>

                  {selectedFee.warning && (
                    <div className="bg-red-50 border-l-4 border-[#0F8F6D] p-3 text-xs text-[#0F8F6D] leading-relaxed font-sans">
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
                          <span className="text-[#0F8F6D] font-bold">•</span>
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-zinc-100 flex justify-end gap-3 font-sans">
                  <button
                    onClick={() => {
                      const textToAsk = `想深入了解關於 ${selectedFee.name} 的內容與實務細節`;
                      setSelectedFee(null);
                      handleTabChange("chat");
                      handleSendMessage(undefined, textToAsk);
                    }}
                    className="px-4 py-2 border border-[#1A2A22] text-zinc-800 hover:bg-[#F5F8F6] text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
                  >
                    向 AI 問答助理諮詢此費用
                  </button>
                  <button
                    onClick={() => setSelectedFee(null)}
                    className="px-4 py-2 bg-[#1A2A22] text-white hover:bg-[#0F8F6D] text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
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
