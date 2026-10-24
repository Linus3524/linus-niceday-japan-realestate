// 電腦版聯絡頁。手機版維持 ContactTab 原本的直排卡片；這裡只在 1280px 以上、滑鼠操作時顯示。
// 電腦前的人最順的聯絡方式是「拿手機掃 QR」，所以 LINE／WeChat QR 直接攤開放第一屏，
// 加好友連結（電腦多半沒裝 LINE）退為備用；問卷提供一鍵複製，方便貼到 LINE 傳給 Linus。
import { useRef, useState } from "react";
import type * as React from "react";
import { AlertCircle, AtSign, BadgeCheck, Building, Building2, CalendarX, Check, ClipboardList, Clock, Copy, ExternalLink, Facebook, Home, Instagram, Mail, MapPin, Phone, ShieldCheck, Train, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { trackAction } from "../lib/trackView";
import { linusContact } from "../data/rentGuideData";
import { OfficeStationMap, parseOfficeStations } from "./OfficeStationMap";

// 模組層級解析一次，參考不變，地圖才不會每次重繪
const OFFICE_STATIONS = parseOfficeStations(linusContact.stations);

export const RENT_QUESTIONNAIRE = `1. 期望入住日期：
2. 入境日期（機票時間）或目前在日本何處：
3. 在留資格種類（是否已領工作/留學COE、打工簽證貼紙，或預計何時）：
4. 每月租屋預算範圍：
5. 通勤目的地／可接受交通時間（學校或公司名稱、靠近的車站）：
6. 是否為自己住／有無同居人（代問或代找請表明）：
7. 其他對房子的核心條件（如：獨立洗面台、屋齡限制等）：`;

export const BUY_QUESTIONNAIRE = `1. 全款現金或貸款：
2. 在日本有簽證／無簽證在台灣的話，有預計什麼時候來日本看房，或是線上看直接決定：
3. 目標什麼時候買房：
4. 預算範圍：
5. 投資或自住：
6. 地區／車站距離：
7. 其他房子的要求／屋齡／大小／樓層：`;

export function BuyLoanNotice() {
  return (
    <div className="border border-[#FDE047] bg-[#FEF9C3] p-3 text-[11px] leading-relaxed space-y-1.5 text-[#854D0E]">
      <span className="font-bold flex items-center gap-1.5">
        <AlertCircle className="w-3.5 h-3.5 text-[#854D0E] shrink-0" />
        <span>貸款注意事項</span>
      </span>
      <p className="text-justify">在日本貸款實務上條件比較嚴格，請先幫我確認以下問卷是否有達到：</p>
      <ul className="list-disc pl-4 space-y-1.5">
        <li>在日本是否有工作簽證，且同一份工作超過 3 年、年薪 300 萬日圓以上？或來日一年以上、年收 400 萬日圓以上，任職公司在日本登記超過 5 年。</li>
        <li>如果沒有簽證，在台灣目前有沒有任何貸款？淨資產有無 3000 萬日圓以上？或去年年收入有沒有超過 1000 萬日圓？</li>
      </ul>
      <p className="text-justify">如果這兩者條件都沒有，依目前實際台日系銀行的審查條件，貸款難度很高。建議採取在台灣完成增貸的方式，以現金購買日本房產，會是比較方便、容易的選擇。</p>
    </div>
  );
}

const SELLING_POINTS = [
  "誠實仲介、專業把關，介紹物件最放心",
  "熟悉打工度假與外國人租屋審查，協助生活服務開通",
  "買房貸款協助、資料準備與總價議價完整支援",
];

const SOCIALS = [
  { href: "https://www.facebook.com/r352410/", label: "Facebook", Icon: Facebook },
  { href: "https://www.instagram.com/linus3524?igsh=ODVuNjRwMmtpdjJq&utm_source=qr", label: "Instagram", Icon: Instagram },
  { href: "https://www.threads.com/@linus3524", label: "Threads", Icon: AtSign },
];

// 名片與公司資料兩張表共用同一種列：固定 100px 標題欄（圖示＋文字），兩張卡片上下的標題與內容才會對齊。
function InfoRow({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[100px_minmax(0,1fr)] items-start gap-3 border-b border-[#ECEFEC] py-2.5 last:border-b-0">
      <dt className="flex items-center gap-1.5 text-[#66736C]"><Icon className="h-4 w-4 shrink-0 text-[#00A174]" />{label}</dt>
      <dd className="min-w-0 font-semibold leading-relaxed">{children}</dd>
    </div>
  );
}

interface QrCardProps {
  app: "LINE" | "WeChat";
  qrSrc: string;
  scanHint: string;
  id: string;
  copied: boolean;
  onCopy: () => void;
  mobileLink?: string;
}

function QrCard({ app, qrSrc, scanHint, id, copied, onCopy, mobileLink }: QrCardProps) {
  return (
    <div className="flex flex-col items-center border border-[#DDE3DF] bg-white px-5 pb-5 pt-4">
      <p className="self-stretch text-center text-sm font-bold text-[#1A2A22]">{app}</p>
      <img src={qrSrc} alt={`${app} 加好友 QR Code`} className="mt-3 h-44 w-44" />
      <p className="mt-2 text-[11px] text-[#66736C]">{scanHint}</p>
      <div className="mt-4 flex w-full items-stretch border border-[#DDE3DF]">
        <span className="flex flex-1 items-center justify-center px-3 py-2 text-[13px] font-semibold tracking-wide text-[#1A2A22]">{id}</span>
        <button
          type="button"
          onClick={onCopy}
          className="flex shrink-0 items-center gap-1 border-l border-[#DDE3DF] px-3 text-[11px] font-bold text-[#3F5147] transition-colors hover:bg-[#F0FAF6] hover:text-[#00A174]"
          aria-label={`複製 ${app} ID`}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-[#00A174]" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "已複製" : "複製"}
        </button>
      </div>
      {mobileLink && (
        <a
          href={mobileLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackAction("line-add")}
          className="mt-2.5 flex items-center gap-1 text-[11px] font-bold text-[#00A174] hover:underline"
        >
          已在電腦安裝 LINE？點此直接加好友 <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}

interface ContactDeskProps {
  contactFormType: "rent" | "buy";
  setContactFormType: (t: "rent" | "buy") => void;
  copiedLine: boolean;
  handleCopyLine: () => void;
  copiedWechat: boolean;
  handleCopyWechat: () => void;
}

export function ContactDesk({ contactFormType, setContactFormType, copiedLine, handleCopyLine, copiedWechat, handleCopyWechat }: ContactDeskProps) {
  // copied：已寫入剪貼簿；manual：瀏覽器擋下剪貼簿權限，改成幫使用者選取全文、請他自己按複製。
  const [activeStation, setActiveStation] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "manual">("idle");
  const questionnaireRef = useRef<HTMLDivElement>(null);
  const questionnaire = contactFormType === "rent" ? RENT_QUESTIONNAIRE : BUY_QUESTIONNAIRE;
  const showCopyState = (state: "copied" | "manual") => {
    setCopyState(state);
    setTimeout(() => setCopyState("idle"), state === "copied" ? 2000 : 4000);
  };
  const copyQuestionnaire = () => {
    const selectForManualCopy = () => {
      const node = questionnaireRef.current;
      const selection = window.getSelection();
      if (node && selection) {
        const range = document.createRange();
        range.selectNodeContents(node);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      showCopyState("manual");
    };
    if (!navigator.clipboard) return selectForManualCopy();
    navigator.clipboard.writeText(questionnaire).then(() => showCopyState("copied"), selectForManualCopy);
  };

  const companyRows: [LucideIcon, string, string | string[]][] = [
    [Building2, "商号", linusContact.companyName],
    [BadgeCheck, "免許番号", linusContact.licenseNo],
    [Phone, "電話／FAX", `${linusContact.companyPhone}／${linusContact.fax}`],
    [Users, "所属団体", linusContact.memberships],
    [ShieldCheck, "保証協會", linusContact.guaranteeAssociation],
  ];

  return (
    // 照原本的 5／7 骨架：左欄放「行動」（掃碼、問卷），右欄放資訊量大的名片與公司資料。
    // 兩欄各自往下排、不互相拉成同高，避免短內容（問卷）被長內容（地圖）撐出大片空白。
    <div className="contact-desk grid grid-cols-12 items-start gap-6 font-sans text-[#1A2A22]">
      <div className="col-span-5 space-y-6">
        <section className="border border-t-2 border-[#DDE3DF] border-t-[#00A174] bg-[linear-gradient(to_bottom,#F2FBF7,#fff_55%)] p-5" aria-labelledby="contact-desk-scan-title">
          <h3 id="contact-desk-scan-title" className="text-lg font-bold">用手機掃碼，直接加 Linus 好友</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-[#66736C]">打開 LINE 或微信的「掃描 QR Code」對準下方圖案即可，全程中文一對一回覆。</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <QrCard
              app="LINE"
              qrSrc="/line-add-friend-qr-branded.svg"
              scanHint="LINE → 主頁右上角「掃描」"
              id={linusContact.lineId}
              copied={copiedLine}
              onCopy={handleCopyLine}
              mobileLink={`https://line.me/ti/p/~${linusContact.lineId}`}
            />
            <QrCard
              app="WeChat"
              qrSrc="/wechat-add-friend-qr-branded.svg"
              scanHint="微信 →「＋」→「掃一掃」"
              id={linusContact.wechatId}
              copied={copiedWechat}
              onCopy={handleCopyWechat}
            />
          </div>
        </section>

        <section className="border border-[#DDE3DF] bg-white p-5" aria-labelledby="contact-desk-form-title">
          <h3 id="contact-desk-form-title" className="flex items-center gap-2 text-lg font-bold"><ClipboardList className="h-5 w-5 text-[#00A174]" />諮詢前先填好這幾題</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-[#66736C]">複製問卷、填好後貼到 LINE 傳給我，就能更快幫您篩選房源、確認審查與貸款條件。</p>
          <div className="mt-4 grid grid-cols-2 border border-[#DDE3DF] bg-white" role="tablist" aria-label="問卷類型">
            {([["rent", Home, "租屋"], ["buy", Building, "買房"]] as const).map(([type, Icon, label], index) => (
              <button
                key={type}
                type="button"
                role="tab"
                aria-selected={contactFormType === type}
                onClick={() => setContactFormType(type)}
                className={`flex min-h-10 items-center justify-center gap-1.5 px-4 font-serif text-xs font-bold transition-colors ${index > 0 ? "border-l border-[#DDE3DF]" : ""} ${contactFormType === type ? "bg-[#F0FAF6] text-[#00A174]" : "text-[#3F5147] hover:bg-[#F5F8F6]"}`}
              >
                <Icon className="h-3.5 w-3.5" />{label}問卷
              </button>
            ))}
          </div>
          <div ref={questionnaireRef} className="mt-3 border border-[#DDE3DF] bg-[#FAFCFB] p-4 text-[13px] leading-7 whitespace-pre-line text-[#1A2A22] select-all">{questionnaire}</div>
          <button
            type="button"
            onClick={copyQuestionnaire}
            className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 bg-[#00A174] px-5 font-sans text-sm font-bold text-white transition-colors hover:bg-[#008F67]"
          >
            {copyState === "copied" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copyState === "copied" ? "已複製，貼到 LINE 傳給 Linus" : copyState === "manual" ? "已選取全文，請按 ⌘C／Ctrl+C 複製" : "複製問卷"}
          </button>
          <p className="mt-2 text-center text-[11px] text-[#8A9590]">代問或代找也歡迎，請在第 6 題註明。</p>
          {contactFormType === "buy" && <div className="mt-4"><BuyLoanNotice /></div>}
        </section>
      </div>

      <div className="col-span-7 space-y-6">
        <section className="border border-[#DDE3DF] bg-white p-6" aria-label="Linus 聯絡資訊">
          <p className="text-xs tracking-widest text-[#66736C]">株式会社世嘉 Seika</p>
          <div className="mt-1 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold">{linusContact.name}</h3>
            <span className="text-sm font-bold text-[#00A174]">營業係長</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-6 border-t border-[#DDE3DF] pt-4">
            <dl className="text-[13px]">
              <InfoRow icon={Mail} label="Email"><a href={`mailto:${linusContact.email}`} className="hover:text-[#00A174]">{linusContact.email}</a></InfoRow>
              <InfoRow icon={Phone} label="電話"><a href={`tel:${linusContact.phone.replace(/-/g, "")}`} className="hover:text-[#00A174]">{linusContact.phone}</a></InfoRow>
              <InfoRow icon={Clock} label="營業時間">{linusContact.workingHours}</InfoRow>
              <InfoRow icon={CalendarX} label="定休日">{linusContact.closedDays}</InfoRow>
            </dl>
            <div className="flex flex-col">
              <p className="text-[13px] font-bold text-[#00A174]">在日台灣人仲介・租屋買房一條龍</p>
              <ul className="mt-2 space-y-2 text-[13px] leading-relaxed text-[#3F5147]">
                {SELLING_POINTS.map(point => (
                  <li key={point} className="flex items-start gap-2"><Check className="mt-1 h-3.5 w-3.5 shrink-0 text-[#00A174]" />{point}</li>
                ))}
              </ul>
              <div className="mt-auto flex items-center gap-1 pt-3">
                {SOCIALS.map(({ href, label, Icon }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" title={label} aria-label={label} className="p-1.5 text-[#3F5147] transition-colors hover:text-[#00A174]">
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border border-[#DDE3DF] bg-white p-6" aria-label="公司資料與地址">
          <h3 className="text-lg font-bold">公司資料</h3>
          <dl className="mt-3 border-t border-[#DDE3DF] text-[13px]">
            {companyRows.map(([icon, label, value]) => (
              <InfoRow key={label} icon={icon} label={label}>{Array.isArray(value) ? value.map(v => <p key={v}>{v}</p>) : value}</InfoRow>
            ))}
          </dl>
          <div className="mt-5 grid grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)] gap-5">
            <div>
              <p className="flex items-start gap-1.5 text-[13px] leading-relaxed text-[#3F5147]"><MapPin className="mt-1 h-3.5 w-3.5 shrink-0 text-[#00A174]" />{linusContact.address}</p>
              <div className="mt-3"><OfficeStationMap stations={OFFICE_STATIONS} activeKey={activeStation} /></div>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-[13px] font-bold"><Train className="h-4 w-4 text-[#00A174]" />周邊車站步行時間</p>
              <ul className="mt-2 divide-y divide-[#ECEFEC] text-xs text-[#3F5147]">
                {linusContact.stations.map(station => (
                  <li key={station} lang="ja" onMouseEnter={() => setActiveStation(station)} onMouseLeave={() => setActiveStation(null)} className={`font-jp cursor-default py-1.5 transition-colors ${activeStation === station ? "text-[#00A174]" : ""}`}>{station}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
