import { useState } from "react";
import { ArrowRight, Check, Copy, Facebook, Instagram, Mail, QrCode } from "lucide-react";
import { linusContact } from "../data/rentGuideData";
import { trackAction } from "../lib/trackView";

/**
 * 圖紙分析結果底部的聯絡 CTA。
 *
 * 分析看完就是最想問問題的時候——分享頁的收件人尤其如此，他們可能根本沒逛過網站，
 * 這一塊是他們唯一會看到的聯絡入口。所以放在結果最後、分享頁與一般模式都顯示。
 *
 * 簡約日系質感排版，主聯絡方式（LINE、微信）清晰突出，社群與牌照資訊優雅襯托。
 */

const THREADS_ICON = (
  <svg viewBox="0 0 192 192" className="h-4 w-4" fill="currentColor" aria-hidden="true">
    <path d="M141.54,88.99c-.83-.4-1.67-.78-2.52-1.14-1.48-27.31-16.4-42.94-41.46-43.1-.11,0-.23,0-.34,0-14.99,0-27.45,6.4-35.12,18.04l13.78,9.45c5.73-8.69,14.72-10.55,21.35-10.55.08,0,.15,0,.23,0,8.25.05,14.47,2.45,18.5,7.13,2.93,3.41,4.89,8.11,5.86,14.05-7.31-1.24-15.22-1.63-23.68-1.14-23.82,1.37-39.13,15.26-38.11,34.57.52,9.79,5.4,18.22,13.74,23.72,7.05,4.65,16.12,6.93,25.56,6.41,12.46-.68,22.23-5.44,29.05-14.13,5.18-6.6,8.45-15.15,9.9-25.93,5.94,3.58,10.34,8.3,12.77,13.97,4.13,9.63,4.37,25.47-8.55,38.38-11.32,11.31-24.93,16.2-45.49,16.35-22.81-.17-40.06-7.48-51.28-21.74-10.5-13.35-15.93-32.64-16.13-57.32.2-24.68,5.63-43.97,16.13-57.32,11.22-14.26,28.47-21.57,51.28-21.74,22.97.17,40.53,7.52,52.17,21.85,5.71,7.03,10.01,15.86,12.85,26.16l16.15-4.31c-3.44-12.68-8.85-23.61-16.22-32.67C147.04,9.61,125.2.2,97.07,0h-.11c-28.08.19-49.66,9.64-64.17,28.08-12.91,16.41-19.56,39.24-19.79,67.85v.07s0,.07,0,.07c.22,28.62,6.88,51.45,19.79,67.85,14.5,18.44,36.09,27.88,64.17,28.08h.11c24.96-.17,42.55-6.71,57.05-21.19,18.96-18.95,18.39-42.69,12.14-57.27-4.48-10.45-13.03-18.94-24.72-24.55ZM98.44,129.51c-10.44.59-21.29-4.1-21.82-14.14-.4-7.44,5.3-15.75,22.46-16.74,1.97-.11,3.89-.17,5.79-.17,6.24,0,12.07.61,17.37,1.76-1.98,24.7-13.58,28.71-23.8,29.27Z" />
  </svg>
);

const LINE_ICON = (
  <svg viewBox="0 0 213.38 203.31" className="h-6 w-6" fill="currentColor" aria-hidden="true">
    <path d="M213.38,86.58C213.38,38.84,165.52,0,106.69,0S0,38.84,0,86.58c0,42.8,37.96,78.64,89.23,85.42,3.47.75,8.2,2.29,9.4,5.26,1.08,2.7.7,6.92.35,9.65,0,0-1.25,7.53-1.52,9.13-.47,2.7-2.14,10.55,9.24,5.75,11.39-4.8,61.44-36.18,83.82-61.94h0c15.46-16.96,22.87-34.16,22.87-53.27ZM69.05,112.11c0,1.13-.91,2.04-2.04,2.04h-29.97c-1.13,0-2.04-.91-2.04-2.04v-.03h0v-46.53c0-1.13.91-2.04,2.04-2.04h7.57c1.12,0,2.04.92,2.04,2.04v36.96h20.37c1.12,0,2.04.92,2.04,2.04v7.57ZM87.09,112.11c0,1.12-.91,2.04-2.04,2.04h-7.57c-1.12,0-2.04-.91-2.04-2.04v-46.56c0-1.12.91-2.04,2.04-2.04h7.57c1.13,0,2.04.91,2.04,2.04v46.56ZM138.6,112.11c0,1.12-.91,2.04-2.04,2.04h-7.52c-.18,0-.36-.03-.53-.07l-.17-.06-.16-.08-.15-.1c-.2-.14-.38-.31-.53-.51l-21.33-28.81v27.65c0,1.12-.91,2.04-2.04,2.04h-7.57c-1.12,0-2.04-.91-2.04-2.04v-46.56c0-1.12.91-2.04,2.04-2.04h7.52c.4,0,.78.13,1.1.36l.17.14c.06.06.11.12.16.19l21.3,28.77v-27.66c0-1.12.91-2.04,2.04-2.04h7.57c1.12,0,2.04.91,2.04,2.04v46.56ZM179.92,73.11c0,1.13-.91,2.04-2.04,2.04h-20.37v7.86h20.37c1.12,0,2.04.92,2.04,2.04v7.57c0,1.13-.91,2.04-2.04,2.04h-20.37v7.86h20.37c1.12,0,2.04.92,2.04,2.04v7.57c0,1.13-.91,2.04-2.04,2.04h-29.97c-1.13,0-2.04-.91-2.04-2.04v-46.56c0-1.13.91-2.04,2.04-2.04h29.97c1.12,0,2.04.92,2.04,2.04v7.57Z" />
  </svg>
);

export function ListingContactCta() {
  const [copiedWechat, setCopiedWechat] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [showWechatQr, setShowWechatQr] = useState(false);

  const copyWechat = async () => {
    try {
      await navigator.clipboard.writeText(linusContact.wechatId);
      trackAction("wechat-copy");
      setCopiedWechat(true);
      window.setTimeout(() => setCopiedWechat(false), 2000);
    } catch {
      setShowWechatQr(true);
    }
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(linusContact.email);
      trackAction("email-copy");
      setCopiedEmail(true);
      window.setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <section className="border border-[#DDE3DF] bg-white overflow-hidden shadow-xs" aria-label="聯絡 Linus">
      {/* ── 1. 頂部抬頭區 ── */}
      {/* 桌面與平板版 (sm:)：左上貼齊人物插畫 + 中間標題說明 + 右上貼齊日系文案背景 */}
      <div className="hidden sm:flex items-stretch justify-between border-b border-[#ECEFEC] bg-white relative overflow-hidden">
        {/* 左側：貼齊左上邊角，高度隨容器自動 100% 貼齊 */}
        <div className="shrink-0 flex items-start self-stretch select-none pointer-events-none">
          <img
            src="/cta-left.webp"
            alt={linusContact.name}
            className="h-full w-auto object-contain object-left-top max-w-[125px] sm:max-w-[145px] md:max-w-[160px] lg:max-w-[175px]"
          />
        </div>

        {/* 中間：標題與說明（字體微幅加大、右側間距收斂，使右側插圖更貼近） */}
        <div className="flex-1 flex flex-col justify-center py-2.5 sm:py-3.5 md:py-3.5 pl-3 sm:pl-4 md:pl-5 pr-1 sm:pr-2 md:pr-3 space-y-1 sm:space-y-1.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-block bg-[#E6F6F1] px-2 py-0.5 font-sans text-[9.5px] sm:text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#00A174] border border-[#9EE2CF]">
              TALK TO LINUS
            </span>
          </div>
          <h3 className="text-[15px] sm:text-[17px] md:text-lg lg:text-[19px] font-bold text-[#1A2A22] tracking-tight leading-snug">
            看完分析有疑問？直接找 Linus 聊聊
          </h3>
          <p className="text-xs sm:text-[13px] md:text-[13.5px] lg:text-[14px] leading-relaxed text-[#526359] max-w-2xl">
            想確認物件細節、安排實地看房，或需要日本買房與租屋的全程諮詢，用你最習慣的方式聯繫即可。全程中文溝通、日本現地專業服務。
          </p>
        </div>

        {/* 右側：貼齊右上邊角，高度隨容器自動 100% 貼齊 */}
        <div className="shrink-0 flex items-start self-stretch select-none pointer-events-none">
          <img
            src="/cta-right.webp"
            alt="在日本，也有家的可能"
            className="h-full w-auto object-contain object-right-top max-w-[145px] sm:max-w-[165px] md:max-w-[190px] lg:max-w-[210px]"
          />
        </div>
      </div>

      {/* 手機版 (< sm)：左上貼齊插畫 + 標題與說明 */}
      <div className="sm:hidden flex items-stretch border-b border-[#ECEFEC] bg-white relative overflow-hidden">
        <div className="shrink-0 flex items-start self-stretch select-none pointer-events-none">
          <img
            src="/cta-left.webp"
            alt={linusContact.name}
            className="h-full w-auto object-contain object-left-top max-w-[95px]"
          />
        </div>
        <div className="flex-1 py-2.5 pr-2.5 pl-1.5 flex flex-col justify-center space-y-0.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-block bg-[#E6F6F1] px-1.5 py-0.5 font-sans text-[9.5px] font-bold uppercase tracking-[0.18em] text-[#00A174] border border-[#9EE2CF]">
              TALK TO LINUS
            </span>
          </div>
          <h3 className="text-[14.5px] font-bold text-[#1A2A22] tracking-tight leading-snug">
            看完分析有疑問？直接找 Linus 聊聊
          </h3>
          <p className="text-[11.5px] leading-relaxed text-[#526359] line-clamp-2">
            想確認物件細節、安排實地看房，或需要日本買房與租屋諮詢，用習慣方式聯繫即可。
          </p>
        </div>
      </div>

      {/* ── 2. 主內容區域 ── */}
      <div className="p-4 sm:p-6 space-y-5">
        {/* ── 2.1 三張主聯絡方式卡片（LINE、WeChat ID 複製、WeChat QR） ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
        {/* 卡片 1：加 LINE 好友（LINE 官方綠底） */}
        <a
          href={`https://line.me/ti/p/~${linusContact.lineId}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackAction("line-add")}
          className="group flex items-center justify-between border border-[#06C755] bg-[#06C755] hover:bg-[#05b34c] p-3.5 sm:p-4 text-white transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="shrink-0 text-white">{LINE_ICON}</span>
            <div className="min-w-0">
              <p className="font-bold text-sm sm:text-base leading-tight">加 LINE 好友</p>
              <p className="mt-0.5 text-xs text-white/90 truncate">用 LINE 快速聯繫我</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-white/80 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
        </a>

        {/* 卡片 2：複製 WeChat ID（白底卡片） */}
        <button
          type="button"
          onClick={copyWechat}
          className="group flex items-center justify-between border border-[#DDE3DF] bg-white hover:border-[#07C160] hover:bg-[#FAFCFB] p-3.5 sm:p-4 text-[#1A2A22] transition-all cursor-pointer text-left shadow-xs"
        >
          <div className="flex items-center gap-3 min-w-0">
            <img src="/wechat-icon.png" alt="WeChat" className="h-6 w-6 shrink-0 object-contain" />
            <div className="min-w-0">
              <p className="font-bold text-sm sm:text-base leading-tight text-[#1A2A22]">
                {copiedWechat ? "已複製 WeChat ID" : "複製 WeChat ID"}
              </p>
              <p className="mt-0.5 text-xs text-[#66736C] truncate">
                {copiedWechat ? `ID: ${linusContact.wechatId}` : "一鍵複製，立即加我"}
              </p>
            </div>
          </div>
          {copiedWechat ? (
            <Check className="h-5 w-5 text-[#07C160]" />
          ) : (
            <ArrowRight className="h-5 w-5 text-[#66736C] group-hover:text-[#07C160] group-hover:translate-x-1 transition-all shrink-0 ml-2" />
          )}
        </button>

        {/* 卡片 3：展開 / 收合 WeChat QR（白底卡片） */}
        <button
          type="button"
          onClick={() => {
            setShowWechatQr(prev => {
              const next = !prev;
              if (next) trackAction("wechat-qr");
              return next;
            });
          }}
          className={`group flex items-center justify-between border ${
            showWechatQr ? "border-[#07C160] bg-[#E6F6F1] text-[#07C160]" : "border-[#DDE3DF] bg-white hover:border-[#07C160] hover:bg-[#FAFCFB]"
          } p-3.5 sm:p-4 text-[#1A2A22] transition-all cursor-pointer text-left shadow-xs`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <QrCode className="h-6 w-6 shrink-0 text-[#07C160]" />
            <div className="min-w-0">
              <p className="font-bold text-sm sm:text-base leading-tight text-[#1A2A22]">
                {showWechatQr ? "收合 WeChat QR" : "展開 WeChat QR"}
              </p>
              <p className="mt-0.5 text-xs text-[#66736C] truncate">顯示 / 隱藏 QR Code</p>
            </div>
          </div>
          <ArrowRight
            className={`h-5 w-5 ${
              showWechatQr ? "text-[#07C160] rotate-90" : "text-[#66736C] group-hover:text-[#07C160] group-hover:translate-x-1"
            } transition-all shrink-0 ml-2`}
          />
        </button>
      </div>

      {/* ── 3. 展開 WeChat QR 區塊 ── */}
      {showWechatQr && (
        <div className="border border-[#9EE2CF] bg-[#F5F8F6] p-5 sm:p-6 transition-all duration-200 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* QR Code */}
            <div className="md:col-span-3 flex items-center justify-center">
              <div className="rounded-lg border border-[#DDE3DF] bg-white p-2.5 shadow-xs">
                <img
                  src="/wechat-add-friend-qr-branded.svg"
                  alt="WeChat 加好友 QR code"
                  className="h-28 w-28 object-contain"
                />
              </div>
            </div>

            {/* 中間說明與 ID 複製按鈕 */}
            <div className="md:col-span-5 space-y-2.5 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start">
                <span className="rounded-xs bg-[#07C160] px-2 py-0.5 font-sans text-[10px] font-bold tracking-wider text-white">
                  WECHAT
                </span>
              </div>
              <h4 className="text-base font-bold text-[#1A2A22]">WeChat「掃一掃」加好友</h4>
              <p className="text-xs text-[#526359] leading-relaxed">
                打開 WeChat 掃描左側 QR Code，或直接搜尋 ID 加我。
              </p>
              <div className="mt-2 flex items-center justify-center md:justify-start gap-2 border border-[#DDE3DF] bg-white p-1.5 max-w-sm">
                <span className="px-1 text-[11px] font-medium text-[#66736C]">WeChat ID</span>
                <span className="flex-1 font-mono text-xs font-bold text-[#1A2A22]">{linusContact.wechatId}</span>
                <button
                  type="button"
                  onClick={copyWechat}
                  className="inline-flex items-center gap-1 bg-[#07C160] hover:bg-[#06ad56] px-2.5 py-1 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  {copiedWechat ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedWechat ? "已複製" : "複製"}</span>
                </button>
              </div>
            </div>

            {/* 右側安心保證與 Linus 簽名 */}
            <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-[#DDE3DF] pt-4 md:pt-0 md:pl-6 space-y-3">
              <ul className="space-y-2 text-xs text-[#3F5147]">
                <li className="flex items-center gap-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#07C160] text-white shadow-xs">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </span>
                  <span className="font-medium text-[#1A2A22]">即時回覆，諮詢更方便</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#07C160] text-white shadow-xs">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </span>
                  <span className="font-medium text-[#1A2A22]">中文溝通，無語言障礙</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#07C160] text-white shadow-xs">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </span>
                  <span className="font-medium text-[#1A2A22]">日本在地專業服務</span>
                </li>
              </ul>
              <div className="pt-2 border-t border-dashed border-[#DDE3DF] flex items-baseline justify-between">
                <span className="text-xs text-[#66736C]">有問題，隨時找我！</span>
                <span className="font-serif italic font-bold text-[#07C160] text-sm tracking-wide">Linus</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. 底部其他管道與品牌標語 ── */}
      <div className="pt-4 border-t border-[#ECEFEC] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* 左側標題 */}
        <div className="shrink-0">
          <p className="text-xs font-bold text-[#1A2A22]">其他聯絡管道</p>
          <p className="text-[11px] text-[#66736C]">也歡迎透過以下平台找到我</p>
        </div>

        {/* 中間 4 欄按鈕 */}
        <div className="flex flex-wrap items-center gap-2 flex-1 lg:max-w-2xl">
          <a
            href={linusContact.threads}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center justify-center gap-1.5 border border-[#DDE3DF] bg-white px-2.5 py-1.5 text-xs text-[#3F5147] transition-all hover:border-[#1A2A22] hover:bg-[#FAFCFB] hover:text-[#1A2A22] whitespace-nowrap"
          >
            {THREADS_ICON}
            <span className="font-medium">Threads</span>
          </a>
          <a
            href="https://www.instagram.com/linus3524"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center justify-center gap-1.5 border border-[#DDE3DF] bg-white px-2.5 py-1.5 text-xs text-[#3F5147] transition-all hover:border-[#E1306C] hover:bg-[#FAFCFB] hover:text-[#E1306C] whitespace-nowrap"
          >
            <Instagram className="h-3.5 w-3.5 text-[#E1306C]" />
            <span className="font-medium">Instagram</span>
          </a>
          <a
            href={linusContact.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center justify-center gap-1.5 border border-[#DDE3DF] bg-white px-2.5 py-1.5 text-xs text-[#3F5147] transition-all hover:border-[#1877F2] hover:bg-[#FAFCFB] hover:text-[#1877F2] whitespace-nowrap"
          >
            <Facebook className="h-3.5 w-3.5 text-[#1877F2]" />
            <span className="font-medium">Facebook</span>
          </a>
          <button
            type="button"
            onClick={copyEmail}
            className="group inline-flex items-center justify-center gap-1.5 border border-[#DDE3DF] bg-white px-2.5 py-1.5 text-xs text-[#3F5147] transition-all hover:border-[#00A174] hover:bg-[#FAFCFB] hover:text-[#00A174] cursor-pointer whitespace-nowrap"
            title="點擊複製 Email"
          >
            {copiedEmail ? <Check className="h-3.5 w-3.5 text-[#00A174]" /> : <Mail className="h-3.5 w-3.5 text-[#3F5147] group-hover:text-[#00A174]" />}
            <span className="font-medium">{copiedEmail ? "已複製 Email" : (linusContact.email || "Email 諮詢")}</span>
          </button>
        </div>

        {/* 右側品牌標語印記 */}
        <div className="hidden lg:flex flex-col items-end text-right shrink-0 font-sans tracking-widest text-[9px] uppercase font-bold text-[#8A9590] leading-tight border-r-2 border-[#00A174] pr-2.5">
          <span>HAVE</span>
          <span className="text-[#00A174]">A NICE DAY</span>
          <span>IN JAPAN</span>
        </div>
      </div>
    </div>
  </section>
);
}
