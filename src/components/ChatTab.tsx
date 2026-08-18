import { useEffect, useMemo, useRef } from "react";
import { motion } from "motion/react";
import { Send, ExternalLink } from "lucide-react";
import { formatMessageText } from "../lib/format";
import { linusContact } from "../data/rentGuideData";
import { trackAction } from "../lib/trackView";

interface ChatTabProps {
  chatMessages: Array<{ role: "user" | "model"; text: string }>;
  chatInput: string;
  setChatInput: (v: string) => void;
  chatLoading: boolean;
  chatError: string | null;
  handleSendMessage: (e?: any, customMsg?: string) => void;
}

// 使用者問到第幾個問題之後，主動顯示一次加 LINE 的邀請
const AUTO_CTA_AFTER_QUESTIONS = 3;

export function ChatTab(props: ChatTabProps) {
  const { chatMessages, chatInput, setChatInput, chatLoading, chatError, handleSendMessage } = props;
  const lineFriendUrl = `https://line.me/ti/p/~${linusContact.lineId}`;

  // 什麼時候在回覆下方顯示「一鍵加好友」按鈕，兩種情況：
  // 1. AI 自己在回覆裡寫出 LINE ID（系統提示會在個案諮詢、知識庫查無資料時這樣做）
  // 2. 使用者問到第 3 個問題之後，主動出現一次
  // 兩者都只認「第一次」，之後的回覆不再重複出現，避免整串對話都在推銷。
  const ctaTargets = useMemo(() => {
    const byAiText = new Set<number>();
    const byQuestionCount = new Set<number>();
    let questionCount = 0;
    let alreadyShown = false;

    chatMessages.forEach((msg, index) => {
      if (msg.role === "user") {
        questionCount += 1;
        return;
      }
      if (/line/i.test(msg.text) && msg.text.includes(linusContact.lineId)) {
        byAiText.add(index);
        alreadyShown = true;
        return;
      }
      if (!alreadyShown && questionCount >= AUTO_CTA_AFTER_QUESTIONS) {
        byQuestionCount.add(index);
        alreadyShown = true;
      }
    });

    return { byAiText, byQuestionCount };
  }, [chatMessages]);

  // 對話視窗自動跟著新訊息捲動：按下「熱門諮詢」後，AI 已經在回答，
  // 但畫面停在原地，使用者要自己往下滑才發現有回覆。
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const lastMessage = chatMessages[chatMessages.length - 1];

  useEffect(() => {
    const area = scrollAreaRef.current;
    if (!area) return;

    // 剛送出提問／AI 思考中：捲到最底，讓「正在調閱知識庫」的提示露出來。
    if (chatLoading || lastMessage?.role === "user") {
      area.scrollTo({ top: area.scrollHeight, behavior: "smooth" });
      return;
    }

    // AI 回覆通常很長，捲到「該則訊息的開頭」而不是最底，
    // 使用者才能從第一行讀起，不會被丟到答案的結尾。
    const node = lastMessageRef.current;
    if (node) {
      area.scrollTo({ top: Math.max(0, node.offsetTop - 12), behavior: "smooth" });
    }
  }, [chatMessages.length, chatLoading, lastMessage?.role]);

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
              <div className="border border-[#DDE3DF] hover:border-[#00a174] bg-white p-6 relative transition-all duration-300 hover:shadow-colored-soft" id="chat-header-card">
                <div className="absolute top-0 right-8 bg-[#00a174] text-white px-3 py-1 text-xs tracking-widest font-sans">
                  AI 顧問
                </div>
                <h3 className="text-lg font-bold border-b border-[#DDE3DF] pb-3 mb-3 text-[#007d5a] flex items-center gap-2">
                  <span className="material-symbols-rounded shrink-0 select-none text-[21px] leading-none text-[#00a174]" aria-hidden="true">smart_toy</span>
                  <span>Linus ╳ 24 小時 AI 顧問</span>
                </h3>
                <p className="text-xs md:text-sm text-zinc-600 leading-relaxed font-sans">
                  AI 顧問整合了本站的租屋與買房知識：從敷金、審査與找房預算，到買房流程、貸款、帶租約投資房與民泊規則，都可以直接提問。無論你正在找租屋、規劃自住買房或評估日本不動產投資，都可以先從這裡開始。
                </p>
              </div>

              {/* Chat Dialog Grid Container */}
              <div className="border border-[#DDE3DF] bg-white h-[600px] flex flex-col justify-between overflow-hidden shadow-colored-soft" id="chat-box-interface">
                {/* Message list area */}
                {/* relative：讓下方訊息的 offsetTop 以這個捲動容器為基準，自動捲動才算得準 */}
                <div ref={scrollAreaRef} className="relative flex-grow overflow-y-auto p-4 md:p-6 bg-[#fafcfb] space-y-6" id="chat-messages-scroll-area">
                  {chatMessages.map((msg, index) => (
                    <div
                      key={index}
                      ref={index === chatMessages.length - 1 ? lastMessageRef : undefined}
                      className={`flex gap-3.5 max-w-[85%] ${
                        msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                      }`}
                    >
                      {/* Avatar placeholder */}
                      <div className={`w-8 h-8 flex items-center justify-center shrink-0 font-sans text-xs border ${
                        msg.role === "user" 
                          ? "bg-zinc-800 text-[#F5F8F6] border-zinc-800" 
                          : "bg-[#00a174] text-white border-[#00a174]"
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
                            ? "bg-white border-zinc-300 text-zinc-800" 
                            : "bg-[#fffdfa] border-[#DDE3DF] text-zinc-900 shadow-sm transition-colors"
                        }`}>
                          {formatMessageText(msg.text)}
                          {(ctaTargets.byAiText.has(index) || ctaTargets.byQuestionCount.has(index)) && (
                            <>
                              {/* 由問題數觸發的邀請，AI 的回覆本身沒提到 LINE，
                                  所以補一句話說明，不然按鈕會很突兀 */}
                              {ctaTargets.byQuestionCount.has(index) && (
                                <p className="mt-4 border-t border-dashed border-[#DDE3DF] pt-3 font-sans text-xs text-zinc-600">
                                  想更貼近您的狀況給建議嗎？加 LINE 由 Linus 本人為您解答，房源配對與個案諮詢都可以聊 ❀
                                </p>
                              )}
                              <a
                                href={lineFriendUrl}
                              onClick={() => trackAction("line-add")}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 flex w-fit items-center gap-2 border border-[#00a174] bg-[#00a174] px-3.5 py-2.5 font-sans text-xs font-bold text-white transition-colors hover:bg-[#087154]"
                                aria-label={`開啟 LINE 並加入 ${linusContact.name} 為好友`}
                              >
                                <span>LINE：{linusContact.lineId}・一鍵加好友</span>
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* AI Loading indicator */}
                  {chatLoading && (
                    <div className="flex gap-3.5 max-w-[80%] mr-auto">
                      <div className="w-8 h-8 flex items-center justify-center bg-[#00a174] text-white border border-[#00a174] font-sans text-xs shrink-0 animate-pulse">
                        L
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] text-zinc-400 font-sans">Linus 正在調閱日本不動產知識庫...</div>
                        <div className="p-3 bg-white border border-[#DDE3DF] text-xs text-zinc-500 font-sans italic animate-pulse">
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
                        href={lineFriendUrl}
                              onClick={() => trackAction("line-add")}
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
                    "租屋如何預約開通水電瓦斯？",
                    "可以跟朋友一起合租公寓嗎？",
                    "海外審査需要哪些文件？",
                    "外國人買房需要日本簽證嗎？",
                    "日本買房的貸款條件有哪些？",
                    "買房後可以經營民泊嗎？"
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(undefined, p)}
                      className="bg-white hover:bg-[#fffdfb] border border-zinc-300 hover:border-[#00a174] text-[11px] text-zinc-700 hover:text-[#00a174] px-2.5 py-1 transition-colors cursor-pointer font-sans"
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {/* Input box form panel */}
                <form 
                  onSubmit={handleSendMessage}
                  className="border-t border-[#DDE3DF] bg-white p-3 flex gap-2 font-sans"
                  id="chat-send-form"
                >
                  <input
                    type="text"
                    placeholder="向 Linus 提問日本租屋／買房知識（例如：租屋審査、房貸、民泊）..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={chatLoading}
                    className="flex-grow px-4 py-2 text-sm bg-white border border-[#DDE3DF] focus:outline-none focus:border-[#00a174] disabled:bg-zinc-100 disabled:text-zinc-400"
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="bg-[#00a174] hover:bg-[#007d5a] text-white px-5 py-2 text-xs font-bold uppercase tracking-wider transition-colors disabled:bg-zinc-300 disabled:text-zinc-500 flex items-center gap-1 cursor-pointer shrink-0"
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
