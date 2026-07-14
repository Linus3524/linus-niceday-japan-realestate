import { motion } from "motion/react";
import { ExternalLink, Smile, Instagram, Facebook, AtSign } from "lucide-react";
import { linusContact } from "../data/rentGuideData";

interface ContactTabProps {
  contactFormType: "rent" | "buy";
  setContactFormType: (t: "rent" | "buy") => void;
  copiedLine: boolean;
  handleCopyLine: () => void;
  copiedWechat: boolean;
  handleCopyWechat: () => void;
}

export function ContactTab(props: ContactTabProps) {
  const { contactFormType, setContactFormType, copiedLine, handleCopyLine, copiedWechat, handleCopyWechat } = props;

  return (
            <motion.div
              key="contact"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-8"
              id="pane-contact"
            >
              {/* Preface section */}
              <div className="border border-[#1A2A22] bg-white p-6" id="contact-intro">
                <h3 className="text-lg font-bold border-b border-[#1A2A22] pb-3 mb-3 text-[#1A2A22] flex items-center gap-2">
                  <Smile className="w-5 h-5 text-[#0F8F6D]" />
                  <span>世嘉 專業台灣仲介為您服務</span>
                </h3>
                <p className="text-xs md:text-sm text-zinc-700 leading-relaxed text-justify font-sans">
                  租屋與買房知識只是起點。若您已經準備好來日本體驗生活，或者對特定的東京都房源感到好奇、想進行詳細內見(看房)，歡迎直接聯繫 Linus。我們擁有第一手未公開物件、不問國籍審查物件，並提供「全中文、台灣仲介」一對一完整服務。
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start" id="contact-business-layout">
                {/* Business Card (Left 5 Columns) */}
                <div className="md:col-span-5 space-y-4">
                  {/* Elegant Business Card Front */}
                  <div className="border-2 border-[#1A2A22] bg-white p-6 relative shadow-[6px_6px_0px_0px_rgba(26, 42, 34,1)]" id="meishi-card">
                    {/* Double linear inner accent border */}
                    <div className="absolute inset-1.5 border border-dashed border-zinc-200 pointer-events-none" />

                    <div className="space-y-5 mt-2 relative z-10">
                      <div className="space-y-1">
                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-sans">株式会社世嘉 Seika</div>
                        <div className="flex items-baseline gap-2">
                          <h4 className="text-xl font-bold tracking-tight text-[#1A2A22]">{linusContact.name}</h4>
                          <span className="text-xs font-bold text-[#0F8F6D] font-sans">營業係長</span>
                        </div>
                      </div>

                      <div className="space-y-3.5 text-xs text-zinc-700 font-sans border-t border-zinc-200 pt-4">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#1A2A22] w-20 shrink-0 tracking-wider">LINE ID</span>
                          <span className="font-mono bg-zinc-100 px-2 py-0.5 border border-zinc-200 font-semibold">{linusContact.lineId}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#1A2A22] w-20 shrink-0 tracking-wider">WECHAT</span>
                          <span className="font-mono bg-zinc-100 px-2 py-0.5 border border-zinc-200 font-semibold">{linusContact.wechatId}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#1A2A22] w-20 shrink-0 tracking-wider">EMAIL</span>
                          <span className="font-mono text-zinc-600">{linusContact.email}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#1A2A22] w-20 shrink-0 tracking-wider">PHONE</span>
                          <span className="font-mono text-zinc-600">{linusContact.phone}</span>
                        </div>
                        
                        {/* Wireframe Social Icons */}
                        <div className="flex items-center gap-3 pt-3.5 border-t border-dashed border-zinc-300">
                          <span className="font-bold text-[#1A2A22] w-20 shrink-0 tracking-wider">SOCIALS</span>
                          <div className="flex items-center gap-4">
                            <a 
                              href="https://www.facebook.com/r352410/" 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-zinc-600 hover:text-[#0F8F6D] hover:scale-110 transition-transform p-1"
                              title="Facebook"
                            >
                              <Facebook className="w-5 h-5" />
                            </a>
                            <a 
                              href="https://www.instagram.com/linus3524?igsh=ODVuNjRwMmtpdjJq&utm_source=qr" 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-zinc-600 hover:text-[#0F8F6D] hover:scale-110 transition-transform p-1"
                              title="Instagram"
                            >
                              <Instagram className="w-5 h-5" />
                            </a>
                            <a 
                              href="https://www.threads.com/@linus3524" 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-zinc-600 hover:text-[#0F8F6D] hover:scale-110 transition-transform p-1"
                              title="Threads"
                            >
                              <AtSign className="w-5 h-5" />
                            </a>
                          </div>
                        </div>
                      </div>

                      <div className="text-[10px] text-zinc-600 font-sans pt-3 border-t border-dashed border-[#1A2A22]/20 leading-relaxed mt-4 space-y-1">
                        <div className="font-bold text-[#0F8F6D] mb-1">
                          在日台灣人仲介 ╳ 租屋買房一條龍 🇹🇼
                        </div>
                        <div className="flex items-start gap-1">
                          <span className="text-[#0F8F6D] shrink-0">✔️</span>
                          <span>誠實仲介 ╳ 專業把關，找我介紹物件最放心！</span>
                        </div>
                        <div className="flex items-start gap-1">
                          <span className="text-[#0F8F6D] shrink-0">✔️</span>
                          <span>熟悉打工度假與外國人租屋審查／協助生活服務開通</span>
                        </div>
                        <div className="flex items-start gap-1">
                          <span className="text-[#0F8F6D] shrink-0">✔️</span>
                          <span>買房貸款協助、資料準備與總價議價完整支援</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Copy Line block */}
                  <div className="border border-[#1A2A22] bg-white p-4 space-y-3 font-sans text-xs">
                    <span className="font-bold text-[#1A2A22] block">直接添加 LINE 諮詢：</span>
                    <a
                      href={`https://line.me/ti/p/~${linusContact.lineId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-[#06C755] hover:bg-[#05A847] text-white px-4 py-2.5 font-bold cursor-pointer transition-colors"
                      id="add-line-btn-contact"
                    >
                      ＋ 一鍵加 Linus 為 LINE 好友
                    </a>
                    <div className="flex gap-2">
                      <div className="bg-zinc-100 flex-grow px-3 py-2 border border-zinc-300 font-mono font-bold text-center select-all">
                        {linusContact.lineId}
                      </div>
                      <button
                        onClick={handleCopyLine}
                        className="bg-[#0F8F6D] hover:bg-[#0A6D52] text-white px-4 py-2 font-bold cursor-pointer transition-colors shrink-0"
                        id="copy-line-btn-contact"
                      >
                        {copiedLine ? "已複製" : "複製 ID"}
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-relaxed text-justify">
                      💡 手機點擊上方綠色按鈕可直接開啟 LINE 添加好友；或複製 Line ID 後在 LINE 中搜尋添加。
                    </p>
                  </div>

                  {/* Copy WeChat block */}
                  <div className="border border-[#1A2A22] bg-white p-4 space-y-3 font-sans text-xs">
                    <span className="font-bold text-[#1A2A22] block">直接添加 WeChat 諮詢：</span>
                    <div className="flex gap-2">
                      <div className="bg-zinc-100 flex-grow px-3 py-2 border border-zinc-300 font-mono font-bold text-center select-all">
                        {linusContact.wechatId}
                      </div>
                      <button
                        onClick={handleCopyWechat}
                        className="bg-[#0F8F6D] hover:bg-[#0A6D52] text-white px-4 py-2 font-bold cursor-pointer transition-colors shrink-0"
                        id="copy-wechat-btn-contact"
                      >
                        {copiedWechat ? "已複製" : "複製 ID"}
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-relaxed text-justify">
                      💡 複製 WeChat ID 之後，可以在您的手機 微信 軟體中搜尋並添加 Linus 為好友。
                    </p>
                  </div>

                  {/* Submission Info Checklist Table with Toggle Switch */}
                  <div className="border border-[#1A2A22] bg-white p-4 font-sans text-xs space-y-4">
                    {/* Toggle Selector */}
                    <div className="flex border border-[#1A2A22] text-[11px] font-bold">
                      <button
                        onClick={() => setContactFormType("rent")}
                        className={`flex-1 py-2 cursor-pointer transition-colors text-center ${
                          contactFormType === "rent"
                            ? "bg-[#1A2A22] text-white"
                            : "bg-white text-zinc-700 hover:bg-[#F5F8F6]"
                        }`}
                      >
                        🏠 租房諮詢問卷
                      </button>
                      <button
                        onClick={() => setContactFormType("buy")}
                        className={`flex-1 py-2 cursor-pointer transition-colors text-center ${
                          contactFormType === "buy"
                            ? "bg-[#1A2A22] text-white"
                            : "bg-white text-zinc-700 hover:bg-[#F5F8F6]"
                        }`}
                      >
                        🏢 買房諮詢問卷
                      </button>
                    </div>

                    {contactFormType === "rent" ? (
                      <div className="space-y-2">
                        <span className="font-bold text-[#0F8F6D] block">📋 諮詢租房時建議先準備好以下資料：</span>
                        <p className="text-zinc-600 leading-normal text-justify">
                          為了讓 Linus 能更快速地協助您媒合合適房源並向管理公司諮詢，歡迎直接複製並填寫以下諮詢表傳送給 Linus 喔！
                        </p>
                        
                        <div className="bg-[#1A2A22] text-white p-4 text-[11px] leading-relaxed select-all border border-[#1A2A22] font-mono whitespace-pre-line">
                          {`1. 期望入住日期：
2. 入境日期（機票時間）或目前在日本何處：
3. 在留資格種類（是否已領工作/留學COE、打工簽證貼紙，或預計何時）：
4. 每月租房預算範圍：
5. 通勤目的地和可接受交通時間（學校或公司名稱、靠近的車站）：
6. 是否為自己住／有無同居人：
7. 其他對房子的核心條件（如：獨立洗面台、屋齡限制等）：`}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <span className="font-bold text-[#0F8F6D] block">📋 諮詢買房時建議先準備好以下資料：</span>
                        <p className="text-zinc-600 leading-normal text-justify">
                          為了讓 Linus 協助媒合合適物件並進行情境試算，歡迎填寫以下買房條件。貸款結果仍以金融機構正式審查為準。
                        </p>
                        
                        <div className="bg-[#1A2A22] text-white p-4 text-[11px] leading-relaxed select-all border border-[#1A2A22] font-mono whitespace-pre-line">
                          {`【買房條件問卷】
1. 全款現金或貸款：
2. 在日本有簽證／無簽證在台灣（有預計什麼時候來日本看房，或是線上看直接決定）：
3. 目標什麼時候買房：
4. 預算範圍：
5. 投資或自住：
6. 地區／車站距離：
7. 其他房子的要求（屋齡／大小／樓層）：`}
                        </div>

                        <div className="bg-red-50 p-3 border-l-2 border-[#0F8F6D] space-y-1.5 text-[11px] leading-relaxed">
                          <span className="font-bold text-[#0F8F6D] block">貸款注意事項⚠️</span>
                          <p className="text-zinc-700 text-justify">
                            日本房貸依申請人、居留身分、收入、資產與物件個別審查。以下問題僅供初步分流，不代表核貸門檻或保證條件：
                          </p>
                          <ul className="list-disc pl-4 space-y-1.5 text-zinc-600">
                            <li><strong>在日居民：</strong>在日本是否有工作簽證，且同一份工作超過 3 年且年薪 300 萬日圓以上？或來日一年以上年收 400 萬以上，且任職公司在日本登記超過 5 年。</li>
                            <li><strong>非在日居民 (純海外買方)：</strong>若無簽證在台灣，在台灣現在有沒有任何貸款？淨資產有無 3000 萬日圓（約新台幣 640 萬元）以上？且年收入有無達 1000 萬日圓（約新台幣 215 萬元）以上？</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Company Details (Right 7 Columns) */}
                <div className="md:col-span-7 border border-[#1A2A22] bg-white p-6 space-y-6">
                  <div>
                    <h4 className="font-bold text-base text-[#1A2A22] border-b border-[#1A2A22] pb-2 mb-4">
                      🎌 不動產會社基本資料
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-xs leading-relaxed text-zinc-700">
                      <div className="space-y-1">
                        <span className="text-zinc-400 block uppercase">公司名稱</span>
                        <strong className="text-zinc-900">{linusContact.companyName}</strong>
                      </div>
                      <div className="space-y-1">
                        <span className="text-zinc-400 block uppercase">東京都知事免許編號</span>
                        <strong className="text-zinc-900">{linusContact.licenseNo}</strong>
                      </div>
                      <div className="space-y-1">
                        <span className="text-zinc-400 block uppercase">營業時間與定休日</span>
                        <strong className="text-zinc-900">{linusContact.workingHours}</strong>
                      </div>
                      <div className="space-y-1">
                        <span className="text-zinc-400 block uppercase">公司官方電話</span>
                        <strong className="text-zinc-900">{linusContact.phone}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-zinc-200 pt-4 space-y-4">
                    <div>
                      <h4 className="font-bold text-sm text-[#1A2A22] mb-2 font-sans uppercase tracking-wider">
                        📍 公司所在地及交涉站點：
                      </h4>
                      <p className="text-xs text-zinc-600 mb-3 font-sans">
                        {linusContact.address}
                      </p>
                    </div>

                    {/* Google Maps Embed Iframe */}
                    <div className="border border-[#1A2A22] bg-[#F5F8F6] p-2 relative">
                      <iframe 
                        title="Seika Office Google Map"
                        src="https://maps.google.com/maps?q=東京都千代田区東神田2-6-2&t=&z=15&ie=UTF8&iwloc=&output=embed"
                        width="100%" 
                        height="260" 
                        style={{ border: 0 }} 
                        allowFullScreen={true} 
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        className="grayscale-20 brightness-95 contrast-100 border border-zinc-200"
                        id="office-google-map"
                      ></iframe>
                      <div className="mt-2 flex justify-between items-center text-xs font-sans">
                        <span className="text-[10px] text-zinc-500">📍 株式會社世嘉 Seika 本部大樓 9 樓</span>
                        <a 
                          href="https://maps.app.goo.gl/g8nHrYEdikTvvCLWA" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[#0F8F6D] hover:text-[#1A2A22] font-bold flex items-center gap-1 hover:underline transition-colors py-1 px-2 border border-zinc-200 bg-white"
                          id="open-google-map-btn"
                        >
                          <span>在 Google Maps 開啟</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                    
                    <div className="bg-[#F5F8F6] p-4 border border-zinc-200 space-y-2">
                      <span className="font-bold text-xs text-zinc-800 block font-sans">🚇 步行前往地鐵站時程：</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5 font-sans text-[11px] text-zinc-600">
                        {linusContact.stations.map((station, sIdx) => (
                          <div key={sIdx} className="flex items-center gap-1.5">
                            <span className="text-[#0F8F6D] font-bold">●</span>
                            <span>{station}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
  );
}
