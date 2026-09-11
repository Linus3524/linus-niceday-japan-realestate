import { useState } from "react";
import { Check, Facebook, Instagram, Mail, MessageCircle, QrCode } from "lucide-react";
import { linusContact } from "../data/rentGuideData";
import { trackAction } from "../lib/trackView";

/**
 * 圖紙分析結果底部的聯絡 CTA。
 *
 * 分析看完就是最想問問題的時候——分享頁的收件人尤其如此，他們可能根本沒逛過網站，
 * 這一塊是他們唯一會看到的聯絡入口。所以放在結果最後、分享頁與一般模式都顯示。
 *
 * 聯絡方式與埋點事件沿用站內既有的（linusContact、line-add／wechat-copy／wechat-qr），
 * 不另外維護一份會跑掉的清單。
 */

const THREADS_ICON = (
  <svg viewBox="0 0 192 192" className="h-4 w-4" fill="currentColor" aria-hidden="true">
    <path d="M141.54,88.99c-.83-.4-1.67-.78-2.52-1.14-1.48-27.31-16.4-42.94-41.46-43.1-.11,0-.23,0-.34,0-14.99,0-27.45,6.4-35.12,18.04l13.78,9.45c5.73-8.69,14.72-10.55,21.35-10.55.08,0,.15,0,.23,0,8.25.05,14.47,2.45,18.5,7.13,2.93,3.41,4.89,8.11,5.86,14.05-7.31-1.24-15.22-1.63-23.68-1.14-23.82,1.37-39.13,15.26-38.11,34.57.52,9.79,5.4,18.22,13.74,23.72,7.05,4.65,16.12,6.93,25.56,6.41,12.46-.68,22.23-5.44,29.05-14.13,5.18-6.6,8.45-15.15,9.9-25.93,5.94,3.58,10.34,8.3,12.77,13.97,4.13,9.63,4.37,25.47-8.55,38.38-11.32,11.31-24.93,16.2-45.49,16.35-22.81-.17-40.06-7.48-51.28-21.74-10.5-13.35-15.93-32.64-16.13-57.32.2-24.68,5.63-43.97,16.13-57.32,11.22-14.26,28.47-21.57,51.28-21.74,22.97.17,40.53,7.52,52.17,21.85,5.71,7.03,10.01,15.86,12.85,26.16l16.15-4.31c-3.44-12.68-8.85-23.61-16.22-32.67C147.04,9.61,125.2.2,97.07,0h-.11c-28.08.19-49.66,9.64-64.17,28.08-12.91,16.41-19.56,39.24-19.79,67.85v.07s0,.07,0,.07c.22,28.62,6.88,51.45,19.79,67.85,14.5,18.44,36.09,27.88,64.17,28.08h.11c24.96-.17,42.55-6.71,57.05-21.19,18.96-18.95,18.39-42.69,12.14-57.27-4.48-10.45-13.03-18.94-24.72-24.55ZM98.44,129.51c-10.44.59-21.29-4.1-21.82-14.14-.4-7.44,5.3-15.75,22.46-16.74,1.97-.11,3.89-.17,5.79-.17,6.24,0,12.07.61,17.37,1.76-1.98,24.7-13.58,28.71-23.8,29.27Z" />
  </svg>
);

const LINE_ICON = (
  <svg viewBox="0 0 213.38 203.31" className="h-4 w-4" fill="currentColor" aria-hidden="true">
    <path d="M213.38,86.58C213.38,38.84,165.52,0,106.69,0S0,38.84,0,86.58c0,42.8,37.96,78.64,89.23,85.42,3.47.75,8.2,2.29,9.4,5.26,1.08,2.7.7,6.92.35,9.65,0,0-1.25,7.53-1.52,9.13-.47,2.7-2.14,10.55,9.24,5.75,11.39-4.8,61.44-36.18,83.82-61.94h0c15.46-16.96,22.87-34.16,22.87-53.27ZM69.05,112.11c0,1.13-.91,2.04-2.04,2.04h-29.97c-1.13,0-2.04-.91-2.04-2.04v-.03h0v-46.53c0-1.13.91-2.04,2.04-2.04h7.57c1.12,0,2.04.92,2.04,2.04v36.96h20.37c1.12,0,2.04.92,2.04,2.04v7.57ZM87.09,112.11c0,1.12-.91,2.04-2.04,2.04h-7.57c-1.12,0-2.04-.91-2.04-2.04v-46.56c0-1.12.91-2.04,2.04-2.04h7.57c1.13,0,2.04.91,2.04,2.04v46.56ZM138.6,112.11c0,1.12-.91,2.04-2.04,2.04h-7.52c-.18,0-.36-.03-.53-.07l-.17-.06-.16-.08-.15-.1c-.2-.14-.38-.31-.53-.51l-21.33-28.81v27.65c0,1.12-.91,2.04-2.04,2.04h-7.57c-1.12,0-2.04-.91-2.04-2.04v-46.56c0-1.12.91-2.04,2.04-2.04h7.52c.4,0,.78.13,1.1.36l.17.14c.06.06.11.12.16.19l21.3,28.77v-27.66c0-1.12.91-2.04,2.04-2.04h7.57c1.12,0,2.04.91,2.04,2.04v46.56ZM179.92,73.11c0,1.13-.91,2.04-2.04,2.04h-20.37v7.86h20.37c1.12,0,2.04.92,2.04,2.04v7.57c0,1.13-.91,2.04-2.04,2.04h-20.37v7.86h20.37c1.12,0,2.04.92,2.04,2.04v7.57c0,1.13-.91,2.04-2.04,2.04h-29.97c-1.13,0-2.04-.91-2.04-2.04v-46.56c0-1.13.91-2.04,2.04-2.04h29.97c1.12,0,2.04.92,2.04,2.04v7.57Z" />
  </svg>
);

export function ListingContactCta() {
  const [copiedWechat, setCopiedWechat] = useState(false);
  const [showWechatQr, setShowWechatQr] = useState(false);

  const copyWechat = async () => {
    try {
      await navigator.clipboard.writeText(linusContact.wechatId);
      trackAction("wechat-copy");
      setCopiedWechat(true);
      window.setTimeout(() => setCopiedWechat(false), 2000);
    } catch {
      // 剪貼簿被擋就顯示 QR 讓使用者掃
      setShowWechatQr(true);
    }
  };

  return (
    <section className="border border-[#9ee2cf] bg-[#f2faf7] p-5 md:p-7" aria-label="聯絡 Linus">
      <div className="flex flex-col gap-5 md:flex-row md:items-start">
        <img src="/logo.png" alt="" aria-hidden="true" className="h-16 w-16 shrink-0 md:h-20 md:w-20" />
        <div className="min-w-0 flex-1">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#007D5A]">Talk to Linus</div>
          <h3 className="text-lg font-bold leading-snug text-[#1A2A22] md:text-xl">看完分析有問題？直接找 Linus 聊聊</h3>
          <p className="mt-2 text-sm leading-relaxed text-[#3F5147]">
            想確認物件細節、安排看房，或需要日本租屋・買房的全程協助，用你最習慣的方式聯絡就好。中文溝通、日本現地服務。
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <a
              href={`https://line.me/ti/p/~${linusContact.lineId}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackAction("line-add")}
              className="flex min-h-11 items-center justify-center gap-2 bg-[#06C755] px-3 text-sm font-bold text-white transition-colors hover:bg-[#05b34c]"
            >
              {LINE_ICON} 加 LINE 好友
            </a>
            <button
              type="button"
              onClick={copyWechat}
              className="flex min-h-11 items-center justify-center gap-2 bg-[#07C160] px-3 text-sm font-bold text-white transition-colors hover:bg-[#06ad55]"
            >
              {copiedWechat ? <Check className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
              {copiedWechat ? "已複製微信 ID" : "複製微信 ID"}
            </button>
            <button
              type="button"
              onClick={() => { setShowWechatQr(v => !v); if (!showWechatQr) trackAction("wechat-qr"); }}
              className="flex min-h-11 items-center justify-center gap-2 border border-[#07C160] bg-white px-3 text-sm font-bold text-[#07C160] transition-colors hover:bg-[#f0fbf4]"
            >
              <QrCode className="h-4 w-4" /> 微信 QR
            </button>
            <a
              href={linusContact.threads}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center justify-center gap-2 bg-[#1A2A22] px-3 text-sm font-bold text-white transition-colors hover:bg-[#303033]"
            >
              {THREADS_ICON} Threads
            </a>
            <a
              href="https://www.instagram.com/linus3524"
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center justify-center gap-2 bg-[#E1306C] px-3 text-sm font-bold text-white transition-colors hover:bg-[#c92a5f]"
            >
              <Instagram className="h-4 w-4" /> Instagram
            </a>
            <a
              href={linusContact.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center justify-center gap-2 bg-[#1877F2] px-3 text-sm font-bold text-white transition-colors hover:bg-[#166fe5]"
            >
              <Facebook className="h-4 w-4" /> Facebook
            </a>
          </div>

          {showWechatQr && (
            <div className="mt-3 flex items-center gap-4 border border-[#DDE3DF] bg-white p-3">
              <img src="/wechat-add-friend-qr-branded.svg" alt="微信加好友 QR code" className="h-28 w-28 shrink-0" />
              <div className="text-xs leading-relaxed text-[#3F5147]">
                <p className="font-bold text-[#1A2A22]">微信「掃一掃」加好友</p>
                <p className="mt-1">或搜尋 ID：<span className="font-mono font-bold">{linusContact.wechatId}</span></p>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-[#DDE3DF] pt-3 text-xs text-[#3F5147]">
            <a href={`mailto:${linusContact.email}`} className="flex items-center gap-1.5 hover:text-[#007D5A]">
              <Mail className="h-3.5 w-3.5" /> {linusContact.email}
            </a>
            <span>LINE ID <span className="font-mono font-bold">{linusContact.lineId}</span></span>
            <span>微信 ID <span className="font-mono font-bold">{linusContact.wechatId}</span></span>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-[#66736C]">
            {linusContact.name}｜{linusContact.companyName}・{linusContact.licenseNo}
          </p>
        </div>
      </div>
    </section>
  );
}
