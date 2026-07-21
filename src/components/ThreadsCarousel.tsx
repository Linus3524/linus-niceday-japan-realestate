import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { featuredThreads } from "../data/featuredThreads";

const THREADS_SCRIPT_SRC = "https://www.threads.com/embed.js";

// 觸發 Threads / Instagram 共用嵌入 SDK 重新掃描頁面上的 blockquote 並轉成 iframe。
// SDK 尚未載入時做短暫重試，載入後即會渲染。
function processEmbeds(attempt = 0) {
  const sdk = (window as any).instgrm;
  if (sdk?.Embeds?.process) {
    sdk.Embeds.process();
  } else if (attempt < 20) {
    setTimeout(() => processEmbeds(attempt + 1), 300);
  }
}

function buildSlidesHtml() {
  return featuredThreads
    .map(({ url, theme }, index) => {
      const themeAttr = theme ? ` data-theme="${theme}"` : "";
      return `
        <article class="threads-slide" aria-label="精選貼文 ${index + 1}／${featuredThreads.length}">
          <span class="threads-card-number">${String(index + 1).padStart(2, "0")}</span>
          <div class="threads-post-frame" tabindex="0" role="region" aria-label="可上下捲動閱讀貼文內容">
            <div class="threads-content-box">
            <blockquote
              class="text-post-media"
              data-text-post-permalink="${url}"
              data-text-post-version="0"${themeAttr}>
              <a href="${url}" target="_blank" rel="noopener noreferrer" class="threads-fallback-btn">
                在 Threads 查看這篇精選貼文 ↗
              </a>
            </blockquote>
            </div>
          </div>
          <a href="${url}" target="_blank" rel="noopener noreferrer" class="threads-read-more">
            <span>閱讀完整貼文</span><span aria-hidden="true">↗</span>
          </a>
        </article>`;
    })
    .join("");
}

export function ThreadsCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [activeSlide, setActiveSlide] = useState(1);

  // 一次性把 blockquote 注入容器（避免 React 與嵌入腳本爭搶同一組 DOM 節點而崩潰），
  // 再載入官方腳本並觸發渲染。
  useEffect(() => {
    const track = trackRef.current;
    if (!track || featuredThreads.length === 0) return;

    track.innerHTML = buildSlidesHtml();

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${THREADS_SCRIPT_SRC}"]`);
    if (existing) {
      processEmbeds();
    } else {
      const script = document.createElement("script");
      script.src = THREADS_SCRIPT_SRC;
      script.async = true;
      script.onload = () => processEmbeds();
      document.body.appendChild(script);
    }
  }, []);

  const updateArrows = () => {
    const track = trackRef.current;
    if (!track) return;
    const { scrollLeft, scrollWidth, clientWidth } = track;
    setCanPrev(scrollLeft > 8);
    setCanNext(scrollLeft + clientWidth < scrollWidth - 8);
    const firstSlide = track.querySelector<HTMLElement>(".threads-slide");
    if (firstSlide) {
      const step = firstSlide.offsetWidth + 16;
      setActiveSlide(Math.min(featuredThreads.length, Math.max(1, Math.round(scrollLeft / step) + 1)));
    }
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    updateArrows();
    track.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    // 嵌入 iframe 載入後高度／寬度會變動，延遲再校正一次箭頭狀態
    const t = setTimeout(updateArrows, 1500);
    return () => {
      track.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
      clearTimeout(t);
    };
  }, []);

  const scrollByCard = (dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const firstSlide = track.querySelector<HTMLElement>(".threads-slide");
    const step = firstSlide ? firstSlide.offsetWidth + 16 : track.clientWidth * 0.8;
    track.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  if (featuredThreads.length === 0) return null;

  return (
    <section className="border-y border-[#DDE3DF] bg-[#F5F8F6]" id="threads-featured" aria-label="LINUS 精選 Threads 文章">
      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-5 grid gap-5 border-b border-[#C9D8D1] pb-5 sm:mb-6 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="min-w-0 max-w-2xl">
            <p className="mb-1.5 font-jost text-[10px] font-semibold tracking-[0.22em] text-[#00a174] sm:text-[11px]">
              LINUS SOCIAL JOURNAL
            </p>
            <h2 className="font-serif text-xl font-bold leading-snug text-[#1A2A22] sm:text-2xl">
              在 Threads 繼續讀
            </h2>
            <p className="mt-2 max-w-xl font-sans text-xs leading-relaxed text-zinc-600 sm:text-sm">
              精選日本租屋、買房與生活實務短文。滑動瀏覽摘要，點入 Threads 閱讀完整內容。
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
            <a
              href="https://www.threads.com/@linus3524"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 border border-[#00a174] bg-white px-3.5 font-sans text-xs font-bold text-[#007d5a] transition-colors hover:bg-[#00a174] hover:text-white"
            >
              追蹤 @linus3524 <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
            <div className="flex items-center gap-2">
              <span className="min-w-[3.25rem] text-center font-jost text-[11px] tracking-[0.12em] text-zinc-500">
                {String(activeSlide).padStart(2, "0")} / {String(featuredThreads.length).padStart(2, "0")}
              </span>
              <button
                type="button"
                onClick={() => scrollByCard(-1)}
                disabled={!canPrev}
                aria-label="上一則"
                className="flex h-9 w-9 cursor-pointer items-center justify-center border border-[#C9D8D1] bg-white text-[#1A2A22] transition-colors hover:border-[#00a174] hover:text-[#00a174] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollByCard(1)}
                disabled={!canNext}
                aria-label="下一則"
                className="flex h-9 w-9 cursor-pointer items-center justify-center border border-[#C9D8D1] bg-white text-[#1A2A22] transition-colors hover:border-[#00a174] hover:text-[#00a174] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={trackRef}
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") scrollByCard(-1);
            if (event.key === "ArrowRight") scrollByCard(1);
          }}
          aria-label="精選 Threads 貼文，可左右滑動"
          className="threads-track flex gap-4 overflow-x-auto overscroll-x-contain touch-pan-x snap-x snap-mandatory px-0.5 pb-4 pt-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00a174] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        />
        <div className="mt-4 h-px overflow-hidden bg-[#DDE3DF]" aria-hidden="true">
          <div
            className="h-full bg-[#00a174] transition-[width] duration-300"
            style={{ width: `${(activeSlide / featuredThreads.length) * 100}%` }}
          />
        </div>
      </div>
    </section>
  );
}
