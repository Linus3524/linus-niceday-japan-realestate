import { motion } from "motion/react";
import { ExternalLink, Smile, Instagram, Facebook, AtSign, MousePointerClick } from "lucide-react";
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
              <div className="border border-[#DDE3DF] hover:border-[#00a174] bg-white p-6 transition-all duration-300 hover:shadow-colored-soft" id="contact-intro">
                <h3 className="text-lg font-bold border-b border-[#DDE3DF] pb-3 mb-3 text-[#007d5a] flex items-center gap-2">
                  <Smile className="w-5 h-5 text-[#00a174]" />
                  <span>專業台灣仲介 Linus，陪您安心找到日本的家</span>
                </h3>
                <p className="text-xs md:text-sm text-zinc-700 leading-relaxed text-justify font-sans">
                  無論您正準備赴日工作、留學或長期定居，想租屋、買房置產，或已看中特定物件，都歡迎直接與 Linus 聯繫。我會以台灣人的溝通方式，協助整理需求、配對公開及未公開房源、確認外國人審査條件，並陪同處理內見、申請與簽約。全程提供中文一對一服務，讓您在日本找房更透明、更順利，也更安心。
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start" id="contact-business-layout">
                {/* Business Card (Left 5 Columns) */}
                <div className="md:col-span-5 space-y-4">
                  {/* Elegant Business Card Front */}
                  <div className="border border-[#DDE3DF] hover:border-[#00a174] bg-white p-6 relative transition-all duration-300 hover:shadow-colored-soft" id="meishi-card">
                    {/* Double linear inner accent border */}
                    <div className="absolute inset-1.5 border border-dashed border-zinc-200 pointer-events-none" />

                    <div className="space-y-5 mt-2 relative z-10">
                      <div className="space-y-1">
                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-sans">株式会社世嘉 Seika</div>
                        <div className="flex items-baseline gap-2">
                          <h4 className="text-xl font-bold tracking-tight text-[#1A2A22]">{linusContact.name}</h4>
                          <span className="text-xs font-bold text-[#00a174] font-sans">營業係長</span>
                        </div>
                      </div>

                      <div className="space-y-3.5 text-xs text-zinc-700 font-sans border-t border-zinc-200 pt-4">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#007d5a] w-20 shrink-0 tracking-wider">LINE ID</span>
                          <span className="font-mono bg-zinc-100 px-2 py-0.5 border border-zinc-200 font-semibold">{linusContact.lineId}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#007d5a] w-20 shrink-0 tracking-wider">WECHAT</span>
                          <span className="font-mono bg-zinc-100 px-2 py-0.5 border border-zinc-200 font-semibold">{linusContact.wechatId}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#007d5a] w-20 shrink-0 tracking-wider">EMAIL</span>
                          <span className="font-mono text-zinc-600">{linusContact.email}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#007d5a] w-20 shrink-0 tracking-wider">PHONE</span>
                          <span className="font-mono text-zinc-600">{linusContact.phone}</span>
                        </div>
                        
                        {/* Wireframe Social Icons */}
                        <div className="flex items-center gap-3 pt-3.5 border-t border-dashed border-zinc-300">
                          <span className="font-bold text-[#007d5a] w-20 shrink-0 tracking-wider">SOCIALS</span>
                          <div className="flex items-center gap-4">
                            <a 
                              href="https://www.facebook.com/r352410/" 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-zinc-600 hover:text-[#00a174] hover:scale-110 transition-transform p-1"
                              title="Facebook"
                            >
                              <Facebook className="w-5 h-5" />
                            </a>
                            <a 
                              href="https://www.instagram.com/linus3524?igsh=ODVuNjRwMmtpdjJq&utm_source=qr" 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-zinc-600 hover:text-[#00a174] hover:scale-110 transition-transform p-1"
                              title="Instagram"
                            >
                              <Instagram className="w-5 h-5" />
                            </a>
                            <a 
                              href="https://www.threads.com/@linus3524" 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-zinc-600 hover:text-[#00a174] hover:scale-110 transition-transform p-1"
                              title="Threads"
                            >
                              <AtSign className="w-5 h-5" />
                            </a>
                          </div>
                        </div>
                      </div>

                      <div className="text-[10px] text-zinc-600 font-sans pt-3 border-t border-dashed border-[#DDE3DF] leading-relaxed mt-4 space-y-1">
                        <div className="font-bold text-[#00a174] mb-1">
                          在日台灣人仲介 ╳ 租屋買房一條龍 🇹🇼
                        </div>
                        <div className="flex items-start gap-1">
                          <span className="text-[#00a174] shrink-0">✔️</span>
                          <span>誠實仲介 ╳ 專業把關，找我介紹物件最放心！</span>
                        </div>
                        <div className="flex items-start gap-1">
                          <span className="text-[#00a174] shrink-0">✔️</span>
                          <span>熟悉打工度假與外國人租屋審査／協助生活服務開通！</span>
                        </div>
                        <div className="flex items-start gap-1">
                          <span className="text-[#00a174] shrink-0">✔️</span>
                          <span>買房貸款協助、資料準備與總價議價完整支援！</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Copy Line block */}
                  <div className="border border-[#DDE3DF] hover:border-[#00a174] bg-white p-4 space-y-3 font-sans text-xs transition-all duration-300 hover:shadow-colored-soft">
                    <span className="font-bold text-zinc-800 block">直接添加 LINE 諮詢：</span>
                    <a
                      href={`https://line.me/ti/p/~${linusContact.lineId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-[#00a174] hover:bg-[#007d5a] text-white px-4 py-2.5 font-bold cursor-pointer transition-colors"
                      id="add-line-btn-contact"
                    >
                      點我加 LINE 好友
                      <MousePointerClick className="h-4 w-4 shrink-0" aria-hidden="true" />
                    </a>
                    <div className="flex items-stretch font-sans text-xs">
                      <input
                        type="text"
                        readOnly
                        value={linusContact.lineId}
                        className="flex-1 bg-white border border-[#DDE3DF] px-3 py-2 font-mono text-zinc-700 focus:outline-none text-[12px] text-center"
                        aria-label="LINE ID"
                      />
                      <button
                        onClick={handleCopyLine}
                        className="bg-[#F5F8F6] border border-l-0 border-[#DDE3DF] hover:bg-[#e6f6f1] text-zinc-700 text-[11px] px-4 py-2 cursor-pointer font-bold transition-colors select-none shrink-0"
                        id="copy-line-btn-contact"
                      >
                        {copiedLine ? "已複製" : "複製"}
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-relaxed text-justify">
                      💡 手機點擊上方綠色按鈕可直接開啟 LINE 添加好友；或複製 Line ID 後在 LINE 中搜尋添加。
                    </p>
                  </div>

                  {/* Copy WeChat block */}
                  <div className="border border-[#DDE3DF] hover:border-[#00a174] bg-white p-4 space-y-3 font-sans text-xs transition-all duration-300 hover:shadow-colored-soft">
                    <span className="font-bold text-zinc-800 block">直接添加 WeChat 諮詢：</span>
                    <div className="flex items-stretch font-sans text-xs">
                      <input
                        type="text"
                        readOnly
                        value={linusContact.wechatId}
                        className="flex-1 bg-white border border-[#DDE3DF] px-3 py-2 font-mono text-zinc-700 focus:outline-none text-[12px] text-center"
                        aria-label="WeChat ID"
                      />
                      <button
                        onClick={handleCopyWechat}
                        className="bg-[#F5F8F6] border border-l-0 border-[#DDE3DF] hover:bg-[#e6f6f1] text-zinc-700 text-[11px] px-4 py-2 cursor-pointer font-bold transition-colors select-none shrink-0"
                        id="copy-wechat-btn-contact"
                      >
                        {copiedWechat ? "已複製" : "複製"}
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-relaxed text-justify">
                      💡 複製 WeChat ID 之後，可以在您的手機 微信 軟體中搜尋並添加 Linus 為好友。
                    </p>
                  </div>

                  {/* Submission Info Checklist Table with Toggle Switch */}
                  <div className="border border-[#DDE3DF] hover:border-[#00a174] bg-white p-4 font-sans text-xs space-y-4 transition-all duration-300 hover:shadow-colored-soft">
                    {/* Toggle Selector */}
                    <div className="flex border border-[#DDE3DF] bg-[#F5F8F6] p-1 gap-1 text-[11px] font-bold">
                      <button
                        onClick={() => setContactFormType("rent")}
                        className={`flex-1 py-2 cursor-pointer transition-colors text-center ${
                          contactFormType === "rent"
                            ? "bg-[#00a174] text-white"
                            : "bg-transparent text-zinc-700 hover:bg-zinc-200"
                        }`}
                      >
                        🏠 租屋諮詢問卷
                      </button>
                      <button
                        onClick={() => setContactFormType("buy")}
                        className={`flex-1 py-2 cursor-pointer transition-colors text-center ${
                          contactFormType === "buy"
                            ? "bg-[#00a174] text-white"
                            : "bg-transparent text-zinc-700 hover:bg-zinc-200"
                        }`}
                      >
                        🏢 買房諮詢問卷
                      </button>
                    </div>

                    {contactFormType === "rent" ? (
                      <div className="space-y-2">
                        <span className="font-bold text-[#00a174] block">📋 諮詢租屋時建議先準備好以下資料：</span>
                        <p className="text-zinc-600 leading-normal text-justify">
                          為了讓 Linus 能更快速地協助您媒合合適房源並向管理公司諮詢，歡迎直接複製並填寫以下諮詢表傳送給 Linus 喔！
                        </p>
                        
                        <div className="bg-[#F5F8F6] text-zinc-800 p-4 text-[11px] leading-relaxed select-all border border-[#DDE3DF] font-mono whitespace-pre-line">
                          {`1. 期望入住日期：
2. 入境日期（機票時間）或目前在日本何處：
3. 在留資格種類（是否已領工作/留學COE、打工簽證貼紙，或預計何時）：
4. 每月租屋預算範圍：
5. 通勤目的地 and 可接受交通時間（學校或公司名稱、靠近的車站）：
6. 是否為自己住／有無同居人（代問或代找請表明）：
7. 其他對房子的核心條件（如：獨立洗面台、屋齡限制等）：`}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <span className="font-bold text-[#00a174] block">📋 諮詢買房時建議先準備好以下資料：</span>
                        <p className="text-zinc-600 leading-normal text-justify">
                          很高興為您服務，請先幫我填寫以下買房條件。
                        </p>
                        
                        <div className="bg-[#F5F8F6] text-zinc-800 p-4 text-[11px] leading-relaxed select-all border border-[#DDE3DF] font-mono whitespace-pre-line">
                          {`1. 全款現金或貸款：
2. 在日本有簽證／無簽證在台灣的話，有預計什麼時候來日本看房，或是線上看直接決定：
3. 目標什麼時候買房：
4. 預算範圍：
5. 投資或自住：
6. 地區／車站距離：
7. 其他房子的要求／屋齡／大小／樓層：`}
                        </div>

                        <div className="bg-red-50 p-3 border-l-2 border-[#00a174] space-y-1.5 text-[11px] leading-relaxed">
                          <span className="font-bold text-[#00a174] block">貸款注意事項⚠️</span>
                          <p className="text-zinc-700 text-justify">
                            在日本貸款實務上條件比較嚴格，請先幫我確認以下問卷是否有達到：
                          </p>
                          <ul className="list-disc pl-4 space-y-1.5 text-zinc-600">
                            <li>在日本是否有工作簽證，且同一份工作超過 3 年、年薪 300 萬日圓以上？或來日一年以上、年收 400 萬日圓以上，任職公司在日本登記超過 5 年。</li>
                            <li>如果沒有簽證，在台灣目前有沒有任何貸款？淨資產有無 3000 萬日圓以上？或去年年收入有沒有超過 1000 萬日圓？</li>
                          </ul>
                          <p className="text-zinc-700 text-justify">
                            如果這兩者條件都沒有，依目前實際台日系銀行的審查條件，貸款難度很高。建議採取在台灣完成增貸的方式，以現金購買日本房產，會是比較方便、容易的選擇。
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Company Details (Right 7 Columns) */}
                <div className="md:col-span-7 border border-[#DDE3DF] hover:border-[#00a174] bg-white p-6 space-y-6 transition-all duration-300 hover:shadow-colored-soft">
                  <div>
                    <h4 className="mb-4 border-b border-[#DDE3DF] pb-2 text-base font-bold text-[#007d5a]">
                      🎌 不動產會社基本資料
                    </h4>

                    <div className="overflow-hidden border border-zinc-300 font-sans text-xs leading-relaxed text-zinc-700">
                      <div className="grid grid-cols-[88px_1fr] border-b border-zinc-200 md:grid-cols-[120px_1fr]">
                        <span className="bg-[#F1F6F3] px-3 py-3 font-bold tracking-wide text-[#315E50]">商号</span>
                        <strong className="px-4 py-3 text-sm text-zinc-900">{linusContact.companyName}</strong>
                      </div>
                      <div className="grid grid-cols-[88px_1fr] border-b border-zinc-200 md:grid-cols-[120px_1fr]">
                        <span className="bg-[#F7F9F8] px-3 py-3 font-bold tracking-wide text-zinc-600">免許番号</span>
                        <strong className="px-4 py-3 text-zinc-900">{linusContact.licenseNo}</strong>
                      </div>
                      <div className="grid grid-cols-[88px_1fr] border-b border-zinc-200 md:grid-cols-[120px_1fr]">
                        <span className="bg-[#F1F6F3] px-3 py-3 font-bold text-[#315E50]">営業時間</span>
                        <strong className="px-4 py-3 text-zinc-900">{linusContact.workingHours}</strong>
                      </div>
                      <div className="grid grid-cols-[88px_1fr] border-b border-zinc-200 md:grid-cols-[120px_1fr]">
                        <span className="bg-[#F7F9F8] px-3 py-3 font-bold text-zinc-600">定休日</span>
                        <strong className="px-4 py-3 text-zinc-900">{linusContact.closedDays}</strong>
                      </div>
                      <div className="grid grid-cols-[88px_1fr] border-b border-zinc-200 md:grid-cols-[120px_1fr]">
                        <span className="bg-[#F1F6F3] px-3 py-3 font-bold text-[#315E50]">電話／FAX</span>
                        <strong className="px-4 py-3 font-mono text-zinc-900">{linusContact.companyPhone}／{linusContact.fax}</strong>
                      </div>
                      <div className="grid grid-cols-[88px_1fr] border-b border-zinc-200 md:grid-cols-[120px_1fr]">
                        <span className="bg-[#F7F9F8] px-3 py-3 font-bold text-zinc-600">所属団体</span>
                        <div className="space-y-1 px-4 py-3 font-semibold text-zinc-800">
                          {linusContact.memberships.map((membership) => <p key={membership}>{membership}</p>)}
                        </div>
                      </div>
                      <div className="grid grid-cols-[88px_1fr] md:grid-cols-[120px_1fr]">
                        <span className="bg-[#F1F6F3] px-3 py-3 font-bold text-[#315E50]">保証協會</span>
                        <strong className="px-4 py-3 text-zinc-900">{linusContact.guaranteeAssociation}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-zinc-200 pt-4 space-y-4">
                    <div>
                      <h4 className="font-bold text-sm text-[#007d5a] mb-2 font-sans uppercase tracking-wider">
                        📍 公司所在地及交涉站點：
                      </h4>
                      <p className="text-xs text-zinc-600 mb-3 font-sans">
                        {linusContact.address}
                      </p>
                    </div>

                    {/* Google Maps Embed Iframe */}
                    <div className="border border-[#DDE3DF] bg-[#F5F8F6] p-2 relative">
                      <iframe 
                        title="Seika Office Google Map"
                        src="https://www.google.com/maps?q=%E6%9D%B1%E4%BA%AC%E9%83%BD%E5%8D%83%E4%BB%A3%E7%94%B0%E5%8C%BA%E6%9D%B1%E7%A5%9E%E7%94%B02-6-2&t=&z=15&ie=UTF8&iwloc=&output=embed"
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
                        <span className="text-[10px] text-zinc-500">📍 株式會社世嘉 Seika・タカラビル 9 階</span>
                        <a 
                          href="https://maps.app.goo.gl/g8nHrYEdikTvvCLWA" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[#00a174] hover:text-[#1A2A22] font-bold flex items-center gap-1 hover:underline transition-colors py-1 px-2 border border-zinc-200 bg-white"
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
                            <span className="text-[#00a174] font-bold">●</span>
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
