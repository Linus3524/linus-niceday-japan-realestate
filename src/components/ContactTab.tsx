import { useState } from "react";
import { motion } from "motion/react";
import { trackAction } from "../lib/trackView";
import { CalendarX, Check, Smile, ClipboardList, Clock, Copy, Building, Home, Mail, MapPin, MessageCircle, MousePointerClick, Phone, QrCode, Train } from "lucide-react";
import { linusContact } from "../data/rentGuideData";
import { PageIntroCard } from "./PageIntroCard";
import { BUY_QUESTIONNAIRE, BuyLoanNotice, COMPANY_ROWS, ContactDesk, InfoRow, OFFICE_STATIONS, RENT_QUESTIONNAIRE, SELLING_POINTS, SOCIALS } from "./ContactDesk";
import { OfficeStationMap } from "./OfficeStationMap";

interface ContactTabProps {
  contactFormType: "rent" | "buy";
  setContactFormType: (t: "rent" | "buy") => void;
  copiedLine: boolean;
  handleCopyLine: () => void;
  copiedWechat: boolean;
  handleCopyWechat: () => void;
}

// ID＋複製按鈕：跟電腦版 QR 卡同一種細框樣式
function IdCopyRow({ app, id, copied, onCopy, buttonId }: { app: string; id: string; copied: boolean; onCopy: () => void; buttonId: string }) {
  return (
    <div className="flex items-stretch border border-[#DDE3DF]">
      <span className="flex min-w-0 flex-1 items-center justify-center px-3 py-2 text-[13px] font-semibold" aria-label={`${app} ID`}>{id}</span>
      <button
        type="button"
        onClick={onCopy}
        className="flex shrink-0 items-center gap-1 whitespace-nowrap border-l border-[#DDE3DF] px-3.5 text-[11px] font-bold text-[#3F5147] transition-colors hover:bg-[#F0FAF6] hover:text-[#00A174]"
        id={buttonId}
      >
        {copied ? <Check className="h-3.5 w-3.5 text-[#00A174]" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "已複製" : "複製"}
      </button>
    </div>
  );
}

export function ContactTab(props: ContactTabProps) {
  const { contactFormType, setContactFormType, copiedLine, handleCopyLine, copiedWechat, handleCopyWechat } = props;
  // 掃碼是第三條聯絡路徑：有些客人用連結加不到好友，只能掃 QR。
  const [showLineQr, setShowLineQr] = useState(false);
  const [showWechatQr, setShowWechatQr] = useState(false);

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
              <PageIntroCard
                id="contact-intro"
                icon={Smile}
                title="專業台灣仲介 Linus，陪您安心找到日本的家"
              >
                <p>
                  無論您正準備赴日工作、留學或長期定居，想租屋、買房置產，或已看中特定物件，都歡迎直接與 Linus 聯繫。我會以台灣人的溝通方式，協助整理需求、配對公開及未公開房源、確認外國人審查條件，並陪同處理內見、申請與簽約。全程提供中文一對一服務，讓您在日本找房更透明、更順利，也更安心。
                </p>
              </PageIntroCard>

              <ContactDesk
                contactFormType={contactFormType}
                setContactFormType={setContactFormType}
                copiedLine={copiedLine}
                handleCopyLine={handleCopyLine}
                copiedWechat={copiedWechat}
                handleCopyWechat={handleCopyWechat}
              />

              {/* 手機版（<768px）：上下順序照原本（名片 → LINE → WeChat → 問卷 → 公司資料與地圖），
                  加好友仍是「按鈕＋展開 QR」；外觀改成跟電腦版同一套輕量樣式（直角、細框、白底、不做 hover 浮起）。 */}
              <div className="contact-mobile space-y-4 font-sans text-[#1A2A22]" id="contact-business-layout">
                <section className="border border-[#DDE3DF] bg-white p-4" id="meishi-card" aria-label="Linus 聯絡資訊">
                  <p className="text-[11px] tracking-widest text-[#66736C]">株式会社世嘉 Seika</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <h4 className="text-xl font-bold">{linusContact.name}</h4>
                    <span className="text-xs font-bold text-[#00A174]">營業係長</span>
                  </div>
                  <dl className="mt-3 border-t border-[#DDE3DF] text-[13px]">
                    <InfoRow icon={MessageCircle} label="LINE ID">{linusContact.lineId}</InfoRow>
                    <InfoRow icon={MessageCircle} label="WeChat">{linusContact.wechatId}</InfoRow>
                    <InfoRow icon={Mail} label="Email"><a href={`mailto:${linusContact.email}`} className="break-all hover:text-[#00A174]">{linusContact.email}</a></InfoRow>
                    <InfoRow icon={Phone} label="電話"><a href={`tel:${linusContact.phone.replace(/-/g, "")}`} className="hover:text-[#00A174]">{linusContact.phone}</a></InfoRow>
                  </dl>
                  <div className="mt-3 border-t border-[#DDE3DF] pt-3">
                    <p className="text-[13px] font-bold text-[#00A174]">在日台灣人仲介・租屋買房一條龍</p>
                    <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-[#3F5147]">
                      {SELLING_POINTS.map(point => (
                        <li key={point} className="flex items-start gap-2"><Check className="mt-1 h-3.5 w-3.5 shrink-0 text-[#00A174]" />{point}</li>
                      ))}
                    </ul>
                    <div className="mt-2 flex items-center gap-1">
                      {SOCIALS.map(({ href, label, Icon }) => (
                        <a key={label} href={href} target="_blank" rel="noopener noreferrer" title={label} aria-label={label} className="p-1.5 text-[#3F5147] transition-colors hover:text-[#00A174]">
                          <Icon className="h-5 w-5" />
                        </a>
                      ))}
                    </div>
                  </div>
                </section>

                {/* LINE：主按鈕開 LINE 加好友，右側 QR 圖示展開掃碼（有些客人用連結加不到好友） */}
                <section className="space-y-2.5 border border-[#DDE3DF] bg-white p-4 text-xs">
                  <h4 className="text-[15px] font-bold">直接添加 LINE 諮詢</h4>
                  {/* 文字要對「整條按鈕」置中：主連結左邊補一段與 QR 鈕同寬的間距 */}
                  <div className="flex items-stretch">
                    <a
                      href={`https://line.me/ti/p/~${linusContact.lineId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-1 items-center justify-center gap-2 bg-[#00A174] py-2.5 pl-[46px] pr-4 text-[13px] font-bold text-white transition-colors hover:bg-[#008F67]"
                      id="add-line-btn-contact"
                      onClick={() => trackAction("line-add")}
                    >
                      點我加 LINE 好友
                      <MousePointerClick className="h-4 w-4 shrink-0" aria-hidden="true" />
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !showLineQr;
                        setShowLineQr(next);
                        // 只在展開時記一次；收合不是聯絡意圖。
                        if (next) trackAction("line-qr");
                      }}
                      aria-expanded={showLineQr}
                      aria-controls="line-qr-panel"
                      aria-label={showLineQr ? "收合 LINE QR Code" : "展開 LINE QR Code 掃碼加好友"}
                      className="relative flex shrink-0 items-center justify-center bg-[#00A174] px-3.5 text-white transition-colors hover:bg-[#008F67] before:absolute before:left-0 before:top-1/2 before:h-1/2 before:w-px before:-translate-y-1/2 before:bg-white/50 before:content-['']"
                    >
                      <QrCode className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                  {showLineQr && (
                    <div id="line-qr-panel" className="qr-panel flex flex-col items-center gap-2 border border-[#DDE3DF] p-3">
                      <img src="/line-add-friend-qr-branded.svg" alt="LINE 加好友 QR Code" className="h-40 w-40" />
                      <span className="text-[11px] text-[#66736C]">用 LINE 掃描這個 QR Code 加好友</span>
                    </div>
                  )}
                  <IdCopyRow app="LINE" id={linusContact.lineId} copied={copiedLine} onCopy={handleCopyLine} buttonId="copy-line-btn-contact" />
                  <p className="text-[11px] leading-relaxed text-[#66736C]">手機點綠色按鈕可直接開啟 LINE 加好友；或複製 LINE ID 後在 LINE 搜尋。加不到好友時，點按鈕右側的 QR 圖示展開掃碼。</p>
                </section>

                {/* WeChat 沒有等同 LINE 的加好友連結，只能掃碼或搜尋 ID，所以整條按鈕就是展開 QR */}
                <section className="space-y-2.5 border border-[#DDE3DF] bg-white p-4 text-xs">
                  <h4 className="text-[15px] font-bold">直接添加 WeChat 諮詢</h4>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !showWechatQr;
                      setShowWechatQr(next);
                      if (next) trackAction("wechat-qr");
                    }}
                    aria-expanded={showWechatQr}
                    aria-controls="wechat-qr-panel"
                    className="flex w-full items-center justify-center gap-2 bg-[#00A174] px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-[#008F67]"
                    id="wechat-qr-btn-contact"
                  >
                    <QrCode className="h-4 w-4 shrink-0" aria-hidden="true" />
                    點我掃碼加好友
                  </button>
                  {showWechatQr && (
                    <div id="wechat-qr-panel" className="qr-panel flex flex-col items-center gap-2 border border-[#DDE3DF] p-3">
                      <img src="/wechat-add-friend-qr-branded.svg" alt="WeChat 加好友 QR Code" className="h-40 w-40" />
                      <span className="text-[11px] text-[#66736C]">用微信掃描這個 QR Code 加好友</span>
                    </div>
                  )}
                  <IdCopyRow app="WeChat" id={linusContact.wechatId} copied={copiedWechat} onCopy={handleCopyWechat} buttonId="copy-wechat-btn-contact" />
                  <p className="text-[11px] leading-relaxed text-[#66736C]">點綠色按鈕展開 QR Code 用微信掃碼；或複製 WeChat ID 後在微信搜尋並添加 Linus。</p>
                </section>

                <section className="border border-[#DDE3DF] bg-white p-4 text-xs">
                  <h4 className="flex items-center gap-2 text-[15px] font-bold"><ClipboardList className="h-4 w-4 text-[#00A174]" />諮詢前先填好這幾題</h4>
                  <p className="mt-1.5 leading-relaxed text-[#66736C]">
                    {contactFormType === "rent"
                      ? "為了更快幫您篩選房源並確認管理公司審查條件，歡迎複製以下租屋問卷，填好後傳給我。"
                      : "為了精準篩選房源並評估貸款與購屋規劃，歡迎複製以下買房問卷，填好後傳給我。"}
                  </p>
                  <div className="mt-3 grid grid-cols-2 border border-[#DDE3DF]" role="tablist" aria-label="問卷類型">
                    {([["rent", Home, "租屋"], ["buy", Building, "買房"]] as const).map(([type, Icon, label], index) => (
                      <button
                        key={type}
                        type="button"
                        role="tab"
                        aria-selected={contactFormType === type}
                        onClick={() => setContactFormType(type)}
                        className={`flex min-h-10 items-center justify-center gap-1.5 text-xs font-bold transition-colors ${index > 0 ? "border-l border-[#DDE3DF]" : ""} ${contactFormType === type ? "bg-[#F0FAF6] text-[#00A174]" : "text-[#3F5147]"}`}
                      >
                        <Icon className="h-3.5 w-3.5" />{label}問卷
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 select-all whitespace-pre-line border border-[#DDE3DF] bg-[#FAFCFB] p-3.5 text-[13px] leading-7">
                    {contactFormType === "rent" ? RENT_QUESTIONNAIRE : BUY_QUESTIONNAIRE}
                  </div>
                  {contactFormType === "rent" && <p className="mt-2 text-center text-[11px] text-[#8A9590]">代問或代找也歡迎，請在第 6 題註明。</p>}
                  {contactFormType === "buy" && <div className="mt-3"><BuyLoanNotice /></div>}
                </section>

                <section className="contact-company-card border border-[#DDE3DF] bg-white p-4" aria-label="公司資料與地址">
                  <h4 className="text-[15px] font-bold">公司資料</h4>
                  <dl className="mt-2 border-t border-[#DDE3DF] text-[13px]">
                    {COMPANY_ROWS.map(([icon, label, value]) => (
                      <InfoRow key={label} icon={icon} label={label}>{Array.isArray(value) ? value.map(v => <p key={v}>{v}</p>) : value}</InfoRow>
                    ))}
                    <InfoRow icon={Clock} label="營業時間">{linusContact.workingHours}</InfoRow>
                    <InfoRow icon={CalendarX} label="定休日">{linusContact.closedDays}</InfoRow>
                    <InfoRow icon={MapPin} label="所在地">{linusContact.address}</InfoRow>
                  </dl>
                  <div className="mt-4 flex flex-col">
                    <OfficeStationMap stations={OFFICE_STATIONS} activeKey={null} />
                  </div>
                  <p className="mt-4 flex items-center gap-1.5 text-[13px] font-bold"><Train className="h-4 w-4 text-[#00A174]" />周邊車站步行時間</p>
                  <ul className="mt-1 divide-y divide-[#ECEFEC] text-[13px] leading-relaxed text-[#3F5147]">
                    {linusContact.stations.map(station => (
                      <li key={station} lang="ja" className="font-jp py-2">{station}</li>
                    ))}
                  </ul>
                </section>
              </div>
            </motion.div>
  );
}
