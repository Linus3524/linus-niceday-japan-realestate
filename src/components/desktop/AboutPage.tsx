import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bot, Calculator, Clock, FileSearch, House, KeyRound, Languages, PenTool, ScanText, Sparkles, TrendingUp, UsersRound, type LucideIcon } from "lucide-react";
import { linusContact } from "../../data/rentGuideData";
import { trackAction } from "../../lib/trackView";
import type { AppTab } from "../../lib/uiTypes";
import { QUIZ_URL, openQuizInline } from "../../lib/quizUrl";

// 桌機首頁往下捲的「關於 Linus」介紹：接在首屏之後，各段直接往下排。
// 文案來源見 docs/HOMEPAGE_CONTENT_DRAFT.md；標【待確認】的資料在確認前不上線。

// 只有「合作流程」有先後順序才用編號；其他區塊改用圖示區分，避免整頁都是 01–04。
const SERVICES: Array<{ no: string; en: string; icon: LucideIcon; title: string; who: string; what: string; tab: AppTab }> = [
  {
    no: "01", icon: KeyRound, en: "Rent", title: "日本租屋", tab: "cards",
    who: "留學、打工度假、工作簽，或人還在台灣、尚未入境的你",
    what: "整理需求、配對公開與未公開房源、確認外國人審查條件，陪同內見、申請到簽約入住。",
  },
  {
    no: "02", icon: House, en: "Buy", title: "買房自住", tab: "buyHouse",
    who: "長期在日本工作、打算定居的你",
    what: "比較區域與物件、圖紙健檢、試算貸款與持有成本，陪你從看房一路到交屋。",
  },
  {
    no: "03", icon: TrendingUp, en: "Invest", title: "投資置產", tab: "buyHouse",
    who: "人在台灣、想在日本配置資產的你",
    what: "行情與投報率分析、出租管理規劃，稅務與持有成本一次說清楚。",
  },
  {
    no: "04", icon: FileSearch, en: "Check", title: "圖紙健檢", tab: "calculator",
    who: "已經看中物件、想知道條件合不合理的你",
    what: "上傳圖紙，先由工具看租金行情、初期費用、通勤與治安，再由我補上實務意見。",
  },
];

const REASONS: Array<{ icon: LucideIcon; title: string; body: string }> = [
  { icon: Languages, title: "中文一對一，條件不漏聽", body: "從需求整理、和管理公司溝通到簽約內容，全程中文說明，日文契約的細節一條一條講清楚。" },
  { icon: PenTool, title: "設計師的眼睛，幫你看懂圖紙", body: "四年多的平面設計經驗，讓我習慣把資訊整理清楚：格局、動線、採光與隱藏費用，重點都會標出來。" },
  { icon: UsersRound, title: "台灣人最懂台灣人", body: "我也是從台灣留學生開始在日本生活，知道第一次租房的不安，也知道台灣人在日本租屋買房的優勢。" },
  { icon: Clock, title: "24 小時工具先幫你查", body: "這個網站是我自己設計打造的：預算試算、圖紙分析、AI 顧問，半夜想到問題也能先查。" },
];

const STEPS = [
  { title: "加 LINE／WeChat 聊聊", body: "先說說你的入住時間、預算與身分。" },
  { title: "填寫需求問卷", body: "在留資格、地區、格局與預算，一次整理好。" },
  { title: "配對與審查確認", body: "篩選物件，同時確認外國人是否能申請。" },
  { title: "內見與申請", body: "可以實際看房，也能視訊或代看後再申請。" },
  { title: "簽約到入住／交屋", body: "契約與費用逐項說明，入住後的手續也會提醒。" },
];

// 左欄名片：頭像點一下翻面成 LINE QR，下方加好友、複製 ID（與首屏聯絡卡同一套互動），最後是兩個數字。
function AboutProfile({ visitorDisplay }: { visitorDisplay: string }) {
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);
  const avatarRef = useRef<HTMLButtonElement>(null);
  const qrTouchedRef = useRef(false);

  // 新版頭像獨立記錄，避免隱藏的舊版聯絡卡先消耗示範次數。
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const storageKey = "linus-about-qr-demo-shown";
    try {
      if (sessionStorage.getItem(storageKey)) return;
    } catch { /* 儲存停用時仍可在本次掛載示範一次。 */ }
    const avatar = avatarRef.current;
    if (!avatar) return;
    let startTimer = 0;
    let holdTimer = 0;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= 0.5)) return;
      observer.disconnect();
      startTimer = window.setTimeout(() => {
        if (qrTouchedRef.current) return;
        try { sessionStorage.setItem(storageKey, "1"); } catch { /* 不影響翻面。 */ }
        setShowQr(true);
        holdTimer = window.setTimeout(() => {
          if (!qrTouchedRef.current) setShowQr(false);
        }, 1200);
      }, 600);
    }, { threshold: 0.5 });
    observer.observe(avatar);
    return () => {
      observer.disconnect();
      window.clearTimeout(startTimer);
      window.clearTimeout(holdTimer);
    };
  }, []);
  return (
    <aside className="about-profile">
      <button
        ref={avatarRef}
        type="button"
        onClick={() => { qrTouchedRef.current = true; const next = !showQr; setShowQr(next); if (next) trackAction("line-qr"); }}
        aria-pressed={showQr}
        aria-label={showQr ? "收起 QR Code，顯示頭像" : "顯示 LINE 加好友 QR Code"}
        className={`contact-flip about-profile-avatar ${showQr ? "is-flipped" : ""}`}
      >
        <span className="contact-flip-inner">
          <span className="contact-flip-face"><img src="/logo.png" alt="LINUS 住好日" /></span>
          <span className="contact-flip-face contact-flip-back"><img src="/line-add-friend-qr-branded.svg" alt="LINE 加好友 QR Code" /></span>
        </span>
      </button>
      <p className="about-profile-name">Linus</p>
      <p className="about-profile-role">東京 不動產仲介・Since 2024</p>
      <a
        className="about-profile-line"
        href={`https://line.me/ti/p/~${linusContact.lineId}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackAction("line-add")}
      >加 LINE 好友 →</a>
      <button
        type="button"
        className="about-profile-copy"
        onClick={() => {
          navigator.clipboard.writeText(linusContact.lineId);
          trackAction("line-copy");
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >{copied ? "已複製 LINE ID" : `LINE ID ${linusContact.lineId}・複製`}</button>
      <div className="about-numbers">
        <span><strong>{visitorDisplay}</strong>網站累計訪客</span>
        <span><strong>4,500+</strong>Threads 追蹤</span>
      </div>
    </aside>
  );
}

function Section({ id, en, title, children }: { id?: string; en: string; title: string; children: ReactNode }) {
  return (
    <section className="about-section" id={id}>
      <header className="about-section-head">
        <p className="about-section-en">{en}</p>
        <h2 className="about-section-title">{title}</h2>
      </header>
      {children}
    </section>
  );
}

export function AboutPage({ onNavigate, visitorDisplay }: { onNavigate: (tab: AppTab) => void; visitorDisplay: string }) {
  return (
    <div className="about-page" id="about-linus" aria-label="關於 Linus">
      {/* 標題放進右欄，左欄名片上緣與標題對齊 */}
      <section className="about-section about-section--me">
        <div className="about-grid">
          <AboutProfile visitorDisplay={visitorDisplay} />
          <div className="about-story">
            <header className="about-section-head">
              <p className="about-section-en">About me</p>
              <h2 className="about-section-title">我是 Linus，一個在東京當不動產仲介的台灣設計師。</h2>
            </header>
            <p>
              彰化人，商業設計出身。<br />
              以前的生活在格線與色票裡打轉，後來打包行李來到東京，日常也變成了穿梭在車站、月台與不同公寓之間。<br />
              這座城市很大，但每個人需要的，或許只是一扇通風良好、夕陽能剛好照進來的窗戶。
            </p>
            <p>我喜歡觀察東京的住宅、街區文化與城市變化，也習慣用設計師的思維，把繁雜的日文契約、不動產制度與市場資訊，整理成清楚易懂的文字與圖表，讓人在陌生的地名裡，也能看懂自己即將落腳的地方。</p>
            <p className="about-motto">用設計的眼光觀察城市，用房仲的視角記錄生活。</p>
            <dl className="about-facts">
              <div><dt>出身</dt><dd>台灣 彰化縣</dd></div>
              <div><dt>學歷</dt><dd>銘傳大學 商業設計學系</dd></div>
              <div><dt>服務</dt><dd>租屋仲介／買房置產／包租代管</dd></div>
              <div><dt>興趣</dt><dd>弓道／旅遊／玩具收藏</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <Section en="What I can do" title="我能幫你什麼">
        <div className="about-services">
          {SERVICES.map(s => (
            <article key={s.no} className="about-card">
              <p className="about-card-head"><s.icon className="about-card-icon" aria-hidden="true" /><span>{s.en}</span></p>
              <h3 className="about-card-title">{s.title}</h3>
              <p className="about-card-label">適合誰</p>
              <p className="about-card-text">{s.who}</p>
              <p className="about-card-label">我會幫你做什麼</p>
              <p className="about-card-text">{s.what}</p>
              <button type="button" className="about-card-link" onClick={() => onNavigate(s.tab)}>看相關內容 →</button>
            </article>
          ))}
        </div>
      </Section>

      <Section en="Why Linus" title="為什麼找 Linus">
        <ul className="about-reasons">
          {REASONS.map(r => (
            <li key={r.title}>
              <r.icon className="about-reason-icon" aria-hidden="true" />
              <div>
                <h3>{r.title}</h3>
                <p>{r.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section en="How we work" title="合作流程">
        <ol className="about-steps">
          {STEPS.map((step, i) => (
            <li key={step.title}>
              <span className="about-step-no">Step <strong>{String(i + 1).padStart(2, "0")}</strong></span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section en="Free tools" title="免費工具">
        <ul className="about-tools">
          <li>
            <ScanText className="about-tool-icon" aria-hidden="true" />
            <div><h3>圖紙分析</h3><p>上傳圖紙，看租金行情、初期費用、通勤與治安。</p></div>
            <button type="button" className="about-tool-link" onClick={() => onNavigate("calculator")}>開始分析 →</button>
          </li>
          <li>
            <Calculator className="about-tool-icon" aria-hidden="true" />
            <div><h3>預算試算</h3><p>輸入條件，估算合理的房租與初期費用。</p></div>
            <button type="button" className="about-tool-link" onClick={() => onNavigate("calculator")}>前往試算 →</button>
          </li>
          <li>
            <Bot className="about-tool-icon" aria-hidden="true" />
            <div><h3>AI 顧問</h3><p>24 小時回答日本租屋與買房的問題。</p></div>
            <button type="button" className="about-tool-link" onClick={() => onNavigate("chat")}>開始提問 →</button>
          </li>
          <li>
            <Sparkles className="about-tool-icon" aria-hidden="true" />
            <div><h3>東京居住人格診斷</h3><p>12 題測出最適合你的東京生活圈。</p></div>
            <a className="about-tool-link" href={QUIZ_URL} onClick={openQuizInline}>開始測驗 →</a>
          </li>
        </ul>
      </Section>

      <section className="about-contact">
        <p className="about-section-en">Let&apos;s talk</p>
        <h2 className="about-section-title">在日本找房、買房，先聊聊吧</h2>
        <button type="button" className="about-contact-btn" onClick={() => onNavigate("contact")}>聯絡 Linus →</button>
      </section>
    </div>
  );
}
