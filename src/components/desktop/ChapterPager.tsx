import { useRef, type ReactNode } from "react";

// 桌機知識頁的「章節左右翻頁」版型，整頁剛好填滿內容面板的高度：
//   左欄：指南名稱、章節目錄（含一句說明）、搜尋框
//   右欄：章節標題列 → 內容（只有這塊會捲動）→ 底部上一章／下一章（固定在面板底部）
// 第一章（前言）右側放各指南自己的推薦內容（prefaceAside），不重複左欄的目錄。

export interface Chapter {
  id: string;
  label: string;
  en: string;
  /** 一句話說明，顯示在目錄與前言的總覽 */
  desc?: string;
}

export function ChapterPager({
  guideEn, guideLabel, guideIcon, chapters, active, onChange, search, prefaceAside, children,
}: {
  guideEn: string;
  guideLabel: string;
  /** 指南的圖示（沿用原本頁面介紹卡的 icon） */
  guideIcon?: ReactNode;
  chapters: Chapter[];
  active: string;
  onChange: (id: string) => void;
  /** 放在左欄底部的搜尋框 */
  search?: ReactNode;
  /** 前言章節右側的推薦區塊 */
  prefaceAside?: ReactNode;
  children: ReactNode;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const index = Math.max(0, chapters.findIndex(c => c.id === active));
  const current = chapters[index];
  const prev = index > 0 ? chapters[index - 1] : null;
  const next = index < chapters.length - 1 ? chapters[index + 1] : null;
  const num = (i: number) => String(i + 1).padStart(2, "0");
  const isPreface = index === 0;

  const go = (id: string) => {
    onChange(id);
    bodyRef.current?.scrollTo({ top: 0 });
  };

  return (
    <div className="chapter-layout">
      <aside className="chapter-rail" aria-label={`${guideLabel}章節`}>
        <p className="chapter-rail-en">{guideEn}</p>
        <p className="chapter-rail-title">{guideIcon && <span className="chapter-rail-icon" aria-hidden="true">{guideIcon}</span>}{guideLabel}</p>
        <ol className="chapter-rail-list">
          {chapters.map((c, i) => (
            <li key={c.id}>
              <button
                type="button"
                className={`chapter-rail-item ${c.id === current.id ? "is-active" : ""}`}
                aria-current={c.id === current.id ? "step" : undefined}
                onClick={() => go(c.id)}
              >
                <span className="chapter-rail-num">{num(i)}</span>
                <span className="chapter-rail-label">{c.label}</span>
              </button>
            </li>
          ))}
        </ol>
        {search && <div className="chapter-rail-search">{search}</div>}
      </aside>

      <div className="chapter-main">
        <header className="chapter-head">
          <span className="chapter-ghost" aria-hidden="true">{guideEn}</span>
          <span className="chapter-kicker">Chapter {num(index)}</span>
          <h2 className="chapter-title">{current.label}</h2>
          <span className="chapter-en">{current.en}</span>
        </header>

        <div className="chapter-body" ref={bodyRef} key={current.id}>
          {isPreface ? (
            <div className="chapter-preface">
              <div className="chapter-preface-main">{children}</div>
              {prefaceAside && <aside className="chapter-preface-aside">{prefaceAside}</aside>}
            </div>
          ) : children}
        </div>

        <nav className="chapter-foot" aria-label="章節切換">
          {prev ? (
            <button type="button" className="chapter-foot-btn" onClick={() => go(prev.id)} title={prev.label} aria-label={`上一章：${num(index - 1)} ${prev.label}`}>
              <span aria-hidden="true">←</span> {num(index - 1)}
            </button>
          ) : <span />}
          <div className="chapter-progress" aria-hidden="true">
            <div className="chapter-progress-segs">
              {chapters.map((c, i) => <span key={c.id} className={i === index ? "is-active" : i < index ? "is-done" : ""} />)}
            </div>
            <span className="chapter-progress-count">{index + 1} / {chapters.length}</span>
          </div>
          {next ? (
            <button type="button" className="chapter-foot-btn chapter-foot-btn--next" onClick={() => go(next.id)} title={next.label} aria-label={`下一章：${num(index + 1)} ${next.label}`}>
              {num(index + 1)} <span aria-hidden="true">→</span>
            </button>
          ) : <span />}
        </nav>
      </div>
    </div>
  );
}
