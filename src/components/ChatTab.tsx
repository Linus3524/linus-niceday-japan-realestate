import { motion } from "motion/react";
import { Send, Bot } from "lucide-react";
import { formatMessageText } from "../lib/format";
import { linusContact } from "../data/rentGuideData";

interface ChatTabProps {
  chatMessages: Array<{ role: "user" | "model"; text: string }>;
  chatInput: string;
  setChatInput: (v: string) => void;
  chatLoading: boolean;
  chatError: string | null;
  handleSendMessage: (e?: any, customMsg?: string) => void;
}

export function ChatTab(props: ChatTabProps) {
  const { chatMessages, chatInput, setChatInput, chatLoading, chatError, handleSendMessage } = props;

  return (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
              id="pane-chat"
            >
              <div className="border border-[#1A2A22] bg-white p-6 relative" id="chat-header-card">
                <div className="absolute top-0 right-8 bg-[#0F8F6D] text-white px-3 py-1 text-xs tracking-widest font-sans">
                  找房顧問
                </div>
                <h3 className="text-lg font-bold border-b border-[#1A2A22] pb-3 mb-3 text-[#1A2A22] flex items-center gap-2">
                  <Bot className="w-5 h-5 text-[#0F8F6D]" />
                  <span>Linus ╳ 24小時 AI 找房顧問</span>
                </h3>
                <p className="text-xs md:text-sm text-zinc-600 leading-relaxed font-sans">
                  AI 找房顧問整合了本站的租屋與買房知識：從敷金、審查與找房預算，到購屋流程、貸款、帶租約投資房與民泊規則，都可以直接提問。無論你正在找租屋、規劃自住買房或評估日本不動產投資，都可以先從這裡開始。
                </p>
              </div>

              {/* Chat Dialog Grid Container */}
              <div className="border border-[#1A2A22] bg-white h-[600px] flex flex-col justify-between overflow-hidden" id="chat-box-interface">
                {/* Message list area */}
                <div className="flex-grow overflow-y-auto p-4 md:p-6 bg-[#fafcfb] space-y-6" id="chat-messages-scroll-area">
                  {chatMessages.map((msg, index) => (
                    <div 
                      key={index} 
                      className={`flex gap-3.5 max-w-[85%] ${
                        msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                      }`}
                    >
                      {/* Avatar placeholder */}
                      <div className={`w-8 h-8 flex items-center justify-center shrink-0 font-sans text-xs border ${
                        msg.role === "user" 
                          ? "bg-zinc-800 text-[#F5F8F6] border-zinc-800" 
                          : "bg-[#0F8F6D] text-white border-[#0F8F6D]"
                      }`}>
                        {msg.role === "user" ? "客" : "L"}
                      </div>
                      
                      <div className="space-y-1.5">
                        {/* Meta sender info */}
                        <div className={`text-[10px] text-zinc-400 font-sans ${
                          msg.role === "user" ? "text-right" : "text-left"
                        }`}>
                          {msg.role === "user" ? "您的提問" : "Linus"}
                        </div>
                        
                        {/* Message content text */}
                        <div className={`p-4 text-xs md:text-sm leading-relaxed text-justify whitespace-pre-wrap border ${
                          msg.role === "user" 
                            ? "bg-white border-zinc-400 text-zinc-800" 
                            : "bg-[#fffdfa] border-[#1A2A22] text-zinc-900 shadow-[2px_2px_0px_0px_rgba(26, 42, 34,1)]"
                        }`}>
                          {formatMessageText(msg.text)}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* AI Loading indicator */}
                  {chatLoading && (
                    <div className="flex gap-3.5 max-w-[80%] mr-auto">
                      <div className="w-8 h-8 flex items-center justify-center bg-[#0F8F6D] text-white border border-[#0F8F6D] font-sans text-xs shrink-0 animate-pulse">
                        L
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] text-zinc-400 font-sans">Linus 正在調閱日本不動產知識庫...</div>
                        <div className="p-3 bg-[#fffdfa] border border-[#1A2A22] text-xs text-zinc-500 font-sans italic animate-pulse">
                          正在整理租屋與買房資訊，請稍候片刻...
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error Notification */}
                  {chatError && (
                    <div className="p-4 border border-amber-200 bg-amber-50 text-amber-950 text-xs font-sans leading-relaxed" role="alert">
                      <span>AI 顧問目前暫時無法回覆，請稍後再試，或</span>
                      <a
                        href={`https://line.me/ti/p/~${linusContact.lineId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1 inline-flex items-center font-bold text-[#087154] underline underline-offset-2 hover:text-[#05A847]"
                      >
                        透過 LINE 聯絡 Linus
                      </a>
                      <span>。</span>
                    </div>
                  )}
                </div>

                {/* Quick Recommended Prompt Suggests */}
                <div className="bg-[#F5F8F6] border-t border-zinc-200 p-3 flex flex-wrap items-center gap-1.5 select-none" id="chat-quick-suggestions">
                  <span className="text-[10px] text-zinc-500 font-bold self-center mr-1 font-sans">熱門諮詢：</span>
                  {[
                    "打工度假存款需要準備多少？",
                    "什麼是敷金跟禮金？",
                    "租房如何預約開通水電瓦斯？",
                    "可以跟朋友一起合租公寓嗎？",
                    "海外審查需要哪些文件？",
                    "外國人買房需要日本簽證嗎？",
                    "日本買房的貸款條件有哪些？",
                    "買房後可以經營民泊嗎？"
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(undefined, p)}
                      className="bg-white hover:bg-[#fffdfb] border border-zinc-300 hover:border-[#0F8F6D] text-[11px] text-zinc-700 hover:text-[#0F8F6D] px-2.5 py-1 transition-colors cursor-pointer font-sans"
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {/* Input box form panel */}
                <form 
                  onSubmit={handleSendMessage}
                  className="border-t border-[#1A2A22] bg-white p-3 flex gap-2 font-sans"
                  id="chat-send-form"
                >
                  <input
                    type="text"
                    placeholder="向 Linus 提問日本租屋／買房知識（例如：租屋審查、房貸、民泊）..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={chatLoading}
                    className="flex-grow px-4 py-2 text-sm bg-white border border-[#1A2A22] focus:outline-none focus:ring-1 focus:ring-[#0F8F6D] disabled:bg-zinc-100 disabled:text-zinc-400"
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="bg-[#1A2A22] hover:bg-[#0F8F6D] text-white px-5 py-2 text-xs font-bold uppercase tracking-wider transition-colors disabled:bg-zinc-300 disabled:text-zinc-500 flex items-center gap-1 cursor-pointer shrink-0"
                    id="chat-submit-btn"
                  >
                    <span>發送</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </motion.div>
  );
}
