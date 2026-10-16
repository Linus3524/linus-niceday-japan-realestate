import type { ReactNode } from "react";
import type { AppTab } from "../../lib/uiTypes";
import { QUIZ_URL, openQuizInline } from "../../lib/quizUrl";

// 桌機首頁往下捲的「關於 Linus」介紹：接在首屏之後，各段直接往下排。
// 文案來源見 docs/HOMEPAGE_CONTENT_DRAFT.md；標【待確認】的資料在確認前不上線。

const SERVICES: Array<{ no: string; en: string; title: string; who: string; what: string; tab: AppTab }> = [
  {
    no: "01", en: "Rent", title: "日本租屋", tab: "cards",
    who: "留學、打工度假、工作簽，或人還在台灣、尚未入境的你",
    what: "整理需求、配對公開與未公開房源、確認外國人審查條件，陪同內見、申請到簽約入住。",
  },
  {
    no: "02", en: "Buy", title: "買房自住", tab: "buyHouse",
    who: "長期在日本工作、打算定居的你",
    what: "比較區域與物件、圖紙健檢、試算貸款與持有成本，陪你從看房一路到交屋。",
  },
  {
    no: "03", en: "Invest", title: "投資置產", tab: "buyHouse",
    who: "人在台灣、想在日本配置資產的你",
    what: "行情與投報率分析、出租管理規劃，稅務與持有成本一次說清楚。",
  },
  {
    no: "04", en: "Check", title: "圖紙健檢", tab: "calculator",
    who: "已經看中物件、想知道條件合不合理的你",
    what: "上傳圖紙，先由工具看租金行情、初期費用、通勤與治安，再由我補上實務意見。",
  },
];

const REASONS = [
  { title: "中文一對一，條件不漏聽", body: "從需求整理、和管理公司溝通到簽約內容，全程中文說明，日文契約的細節一條一條講清楚。" },
  { title: "設計師的眼睛，幫你看懂圖紙", body: "四年多的平面設計經驗，讓我習慣把資訊整理清楚：格局、動線、採光與隱藏費用，重點都會標出來。" },
  { title: "台灣人最懂台灣人", body: "我也是從台灣留學生開始在日本生活，知道第一次租房的不安，也知道台灣人在日本租屋買房的優勢。" },
  { title: "24 小時工具先幫你查", body: "這個網站是我自己設計打造的：預算試算、圖紙分析、AI 顧問，半夜想到問題也能先查。" },
];

const STEPS = [
  { title: "加 LINE／WeChat 聊聊", body: "先說說你的入住時間、預算與身分。" },
  { title: "填寫需求問卷", body: "在留資格、地區、格局與預算，一次整理好。" },
  { title: "配對與審查確認", body: "篩選物件，同時確認外國人是否能申請。" },
  { title: "內見與申請", body: "可以實際看房，也能視訊或代看後再申請。" },
  { title: "簽約到入住／交屋", body: "契約與費用逐項說明，入住後的手續也會提醒。" },
];

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
      <Section en="About me" title="我是 Linus">
        <div className="about-grid">
          <div className="about-story">
            <p className="about-lead">在東京當不動產仲介的台灣設計師。</p>
            <p>我是 Linus（張津維），來自台灣，銘傳大學商業設計學系畢業。在台灣做了四年多的平面設計，接過台北捷運、台大醫院、教育部體育署等公部門與企業的案子，習慣把複雜的資訊整理成一眼就看得懂的畫面。</p>
            <p>後來以留學生的身分來到日本，從台灣留學生轉做不動產仲介。現在用設計師整理資訊的方式，陪你把日本的租屋、買房與置產看懂。</p>
            <p>透明、專業、客觀，是我做這份工作的原則。</p>
          </div>
          <dl className="about-facts">
            <div><dt>出身</dt><dd>台灣</dd></div>
            <div><dt>學歷</dt><dd>銘傳大學 商業設計學系</dd></div>
            <div><dt>現職</dt><dd>東京 不動產仲介（Since 2024）</dd></div>
            <div><dt>服務</dt><dd>租屋仲介／買房置產／包租代管</dd></div>
            <div><dt>興趣</dt><dd>弓道</dd></div>
            <div className="about-numbers">
              <span><strong>{visitorDisplay}</strong>網站累計訪客</span>
              <span><strong>4,500+</strong>Threads 追蹤</span>
            </div>
          </dl>
        </div>
      </Section>

      <Section en="What I can do" title="我能幫你什麼">
        <div className="about-services">
          {SERVICES.map(s => (
            <article key={s.no} className="about-card">
              <p className="about-card-no"><span>{s.no}</span> / {s.en}</p>
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
        <ol className="about-reasons">
          {REASONS.map((r, i) => (
            <li key={r.title}>
              <span className="about-reason-no">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3>{r.title}</h3>
                <p>{r.body}</p>
              </div>
            </li>
          ))}
        </ol>
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
        <div className="about-services">
          <article className="about-card">
            <p className="about-card-no"><span>01</span> / Listing check</p>
            <h3 className="about-card-title">圖紙分析</h3>
            <p className="about-card-text">上傳圖紙，看租金行情、初期費用、通勤與治安。</p>
            <button type="button" className="about-card-link" onClick={() => onNavigate("calculator")}>開始分析 →</button>
          </article>
          <article className="about-card">
            <p className="about-card-no"><span>02</span> / Budget</p>
            <h3 className="about-card-title">預算試算</h3>
            <p className="about-card-text">輸入條件，估算合理的房租與初期費用。</p>
            <button type="button" className="about-card-link" onClick={() => onNavigate("calculator")}>前往試算 →</button>
          </article>
          <article className="about-card">
            <p className="about-card-no"><span>03</span> / Ask AI</p>
            <h3 className="about-card-title">AI 顧問</h3>
            <p className="about-card-text">24 小時回答日本租屋與買房的問題。</p>
            <button type="button" className="about-card-link" onClick={() => onNavigate("chat")}>開始提問 →</button>
          </article>
          <article className="about-card">
            <p className="about-card-no"><span>04</span> / Quiz</p>
            <h3 className="about-card-title">東京居住人格診斷</h3>
            <p className="about-card-text">12 題測出最適合你的東京生活圈。</p>
            <a className="about-card-link" href={QUIZ_URL} onClick={openQuizInline}>開始測驗 →</a>
          </article>
        </div>
      </Section>

      <section className="about-contact">
        <p className="about-section-en">Let&apos;s talk</p>
        <h2 className="about-section-title">在日本找房、買房，先聊聊吧</h2>
        <button type="button" className="about-contact-btn" onClick={() => onNavigate("contact")}>聯絡 Linus →</button>
      </section>
    </div>
  );
}
