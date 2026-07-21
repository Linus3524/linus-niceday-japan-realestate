import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { threadCategories, type FeaturedThread } from "../data/featuredThreads";

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

function buildSlidesHtml(threads: FeaturedThread[], startIndex: number, total: number) {
  return threads
    .map(({ url, theme }, index) => {
      const absoluteIndex = startIndex + index;
      const themeAttr = theme ? ` data-theme="${theme}"` : "";
      return `
        <article class="threads-slide" data-thread-index="${absoluteIndex}" aria-label="精選貼文 ${absoluteIndex + 1}／${total}">
          <span class="threads-card-number">${String(absoluteIndex + 1).padStart(2, "0")}</span>
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
  const renderedCountRef = useRef(0);
  const isPointerInsideRef = useRef(false);
  const isUserInteractingRef = useRef(false);
  const manualPauseUntilRef = useRef(0);
  const dragStateRef = useRef({ active: false, pointerId: -1, startX: 0, startScrollLeft: 0 });
  const [activeCategory, setActiveCategory] = useState(0);
  const [activeSlide, setActiveSlide] = useState(1);
  const currentCategory = threadCategories[activeCategory];
  const currentThreads = currentCategory?.threads ?? [];

  // 一次性把 blockquote 注入容器（避免 React 與嵌入腳本爭搶同一組 DOM 節點而崩潰），
  // 再載入官方腳本並觸發渲染。
  useEffect(() => {
    const track = trackRef.current;
    if (!track || currentThreads.length === 0) return;

    const initialCount = Math.min(currentThreads.length, window.innerWidth >= 1024 ? 6 : 3);
    const initialSlides = buildSlidesHtml(currentThreads.slice(0, initialCount), 0, currentThreads.length);
    const needsDesktopLoopBuffer = window.innerWidth >= 1024 && currentThreads.length <= 3;
    track.innerHTML = needsDesktopLoopBuffer ? initialSlides + initialSlides : initialSlides;
    renderedCountRef.current = initialCount;
    track.scrollLeft = 0;
    setActiveSlide(1);

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
  }, [activeCategory]);

  const updateArrows = () => {
    const track = trackRef.current;
    if (!track) return;
    const viewportStart = track.scrollLeft + 4;
    const slides = track.querySelectorAll<HTMLElement>(".threads-slide");
    let visibleSlide: HTMLElement | null = null;
    for (let index = 0; index < slides.length; index += 1) {
      const slide = slides.item(index);
      if (slide.offsetLeft + slide.offsetWidth > viewportStart) {
        visibleSlide = slide;
        break;
      }
    }
    if (visibleSlide) {
      const originalIndex = Number(visibleSlide.dataset.threadIndex ?? 0);
      setActiveSlide(originalIndex + 1);
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
  }, [activeCategory]);

  const appendNextBatch = () => {
    const track = trackRef.current;
    const start = renderedCountRef.current;
    if (!track || start >= currentThreads.length) return false;

    const end = Math.min(start + 3, currentThreads.length);
    track.insertAdjacentHTML(
      "beforeend",
      buildSlidesHtml(currentThreads.slice(start, end), start, currentThreads.length),
    );
    renderedCountRef.current = end;
    processEmbeds();
    return true;
  };

  const scrollByCard = (dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    manualPauseUntilRef.current = performance.now() + 900;
    const firstSlide = track.querySelector<HTMLElement>(".threads-slide");
    const step = firstSlide ? firstSlide.offsetWidth + 16 : track.clientWidth * 0.8;

    if (dir === 1) {
      const reachedRenderedEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;
      if (reachedRenderedEnd || activeSlide >= renderedCountRef.current - 2) {
        appendNextBatch();
      }
    } else if (renderedCountRef.current >= currentThreads.length && track.scrollLeft < step) {
      const firstSlideElement = track.querySelector<HTMLElement>(".threads-slide");
      const slides = track.querySelectorAll<HTMLElement>(".threads-slide");
      const lastSlideElement = slides.item(slides.length - 1);
      if (firstSlideElement && lastSlideElement) {
        track.insertBefore(lastSlideElement, firstSlideElement);
        track.scrollLeft += step;
      }
    }

    requestAnimationFrame(() => track.scrollBy({ left: dir * step, behavior: "smooth" }));
  };

  const startDragging = (event: ReactPointerEvent<HTMLDivElement>) => {
    isUserInteractingRef.current = true;
    if (event.pointerType !== "mouse" || event.button !== 0) return;

    dragStateRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: event.currentTarget.scrollLeft,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.classList.add("is-dragging");
  };

  const dragCarousel = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.currentTarget.scrollLeft = drag.startScrollLeft + (drag.startX - event.clientX);

    const firstSlide = event.currentTarget.querySelector<HTMLElement>(".threads-slide");
    const cardStep = firstSlide ? firstSlide.offsetWidth + 16 : 0;
    if (
      renderedCountRef.current < currentThreads.length &&
      event.currentTarget.scrollLeft + event.currentTarget.clientWidth >= event.currentTarget.scrollWidth - cardStep * 1.5
    ) {
      appendNextBatch();
    }
  };

  const stopDragging = (event: ReactPointerEvent<HTMLDivElement>) => {
    isUserInteractingRef.current = false;
    manualPauseUntilRef.current = performance.now() + 1000;
    if (document.activeElement === event.currentTarget) {
      event.currentTarget.blur();
    }
    if (dragStateRef.current.active && dragStateRef.current.pointerId === event.pointerId) {
      dragStateRef.current.active = false;
      event.currentTarget.classList.remove("is-dragging");
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    }
  };

  const scrollWithHorizontalWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    const horizontalDelta = event.deltaX;
    if (Math.abs(horizontalDelta) < 2 || Math.abs(horizontalDelta) <= Math.abs(event.deltaY) * 0.65) return;

    event.preventDefault();
    const track = trackRef.current;
    if (!track) return;
    const firstSlide = track.querySelector<HTMLElement>(".threads-slide");
    const cardStep = firstSlide ? firstSlide.offsetWidth + 16 : 0;
    if (!cardStep) return;

    isUserInteractingRef.current = true;
    manualPauseUntilRef.current = performance.now() + 700;

    if (horizontalDelta > 0) {
      if (
        renderedCountRef.current < currentThreads.length &&
        track.scrollLeft + track.clientWidth >= track.scrollWidth - cardStep * 1.5
      ) {
        appendNextBatch();
      }
      track.scrollLeft += horizontalDelta * 1.35;

      if (renderedCountRef.current >= currentThreads.length && track.scrollLeft >= cardStep) {
        const outgoingSlide = track.querySelector<HTMLElement>(".threads-slide");
        if (outgoingSlide) {
          track.appendChild(outgoingSlide);
          track.scrollLeft -= cardStep;
        }
      }
    } else {
      if (renderedCountRef.current >= currentThreads.length && track.scrollLeft + horizontalDelta * 1.35 < 0) {
        const slides = track.querySelectorAll<HTMLElement>(".threads-slide");
        const first = slides.item(0);
        const last = slides.item(slides.length - 1);
        if (first && last) {
          track.insertBefore(last, first);
          track.scrollLeft += cardStep;
        }
      }
      track.scrollLeft += horizontalDelta * 1.35;
    }

    window.setTimeout(() => {
      isUserInteractingRef.current = false;
    }, 120);
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track || currentThreads.length <= 1) return;

    let animationFrame = 0;
    let previousTime = 0;
    const pixelsPerMillisecond = 0.032;
    const updatePointerPosition = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const bounds = track.getBoundingClientRect();
      isPointerInsideRef.current =
        event.clientX >= bounds.left &&
        event.clientX <= bounds.right &&
        event.clientY >= bounds.top &&
        event.clientY <= bounds.bottom;
    };

    const animate = (time: number) => {
      if (!previousTime) previousTime = time;
      const elapsed = Math.min(time - previousTime, 64);
      previousTime = time;

      const isKeyboardReading = track.contains(document.activeElement);
      if (
        !isPointerInsideRef.current &&
        !isUserInteractingRef.current &&
        !isKeyboardReading &&
        time >= manualPauseUntilRef.current &&
        !document.hidden
      ) {
        const firstSlide = track.querySelector<HTMLElement>(".threads-slide");
        const cardStep = firstSlide ? firstSlide.offsetWidth + 16 : 0;

        if (
          renderedCountRef.current < currentThreads.length &&
          track.scrollLeft + track.clientWidth >= track.scrollWidth - cardStep * 1.5
        ) {
          appendNextBatch();
        }

        track.scrollLeft += elapsed * pixelsPerMillisecond;

        if (cardStep > 0 && renderedCountRef.current >= currentThreads.length && track.scrollLeft >= cardStep) {
          track.appendChild(firstSlide);
          track.scrollLeft -= cardStep;
        }
      }

      animationFrame = window.requestAnimationFrame(animate);
    };

    document.addEventListener("pointermove", updatePointerPosition, { passive: true });
    animationFrame = window.requestAnimationFrame(animate);
    return () => {
      document.removeEventListener("pointermove", updatePointerPosition);
      window.cancelAnimationFrame(animationFrame);
    };
  }, [activeCategory]);

  const selectCategory = (index: number, button: HTMLButtonElement) => {
    setActiveCategory(index);
    button.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  };

  if (threadCategories.length === 0 || currentThreads.length === 0) return null;

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
                {String(activeSlide).padStart(2, "0")} / {String(currentThreads.length).padStart(2, "0")}
              </span>
              <button
                type="button"
                onClick={() => scrollByCard(-1)}
                disabled={currentThreads.length <= 1}
                aria-label="上一則"
                className="flex h-9 w-9 cursor-pointer items-center justify-center border border-[#C9D8D1] bg-white text-[#1A2A22] transition-colors hover:border-[#00a174] hover:text-[#00a174] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollByCard(1)}
                disabled={currentThreads.length <= 1}
                aria-label="下一則"
                className="flex h-9 w-9 cursor-pointer items-center justify-center border border-[#C9D8D1] bg-white text-[#1A2A22] transition-colors hover:border-[#00a174] hover:text-[#00a174] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div
          className="threads-category-tabs mb-5 flex gap-2 overflow-x-auto pb-2 sm:mb-6"
          role="tablist"
          aria-label="Threads 文章分類"
        >
          {threadCategories.map((category, index) => {
            const isActive = index === activeCategory;
            return (
              <button
                key={category.label}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls="threads-category-panel"
                onClick={(event) => selectCategory(index, event.currentTarget)}
                className={`shrink-0 border px-3.5 py-2 font-sans text-xs font-bold transition-colors ${
                  isActive
                    ? "border-[#00a174] bg-[#00a174] text-white"
                    : "border-[#C9D8D1] bg-white text-[#3F5147] hover:border-[#00a174] hover:text-[#007d5a]"
                }`}
              >
                {category.label}
                <span className={`ml-1.5 font-jost text-[10px] ${isActive ? "text-white/75" : "text-zinc-400"}`}>
                  {category.threads.length}
                </span>
              </button>
            );
          })}
        </div>

        <div
          id="threads-category-panel"
          role="tabpanel"
          aria-label={`${currentCategory.label} Threads 貼文，可左右滑動`}
          ref={trackRef}
          tabIndex={0}
          onPointerDown={startDragging}
          onPointerMove={dragCarousel}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
          onWheel={scrollWithHorizontalWheel}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") scrollByCard(-1);
            if (event.key === "ArrowRight") scrollByCard(1);
          }}
          className="threads-track flex gap-4 overflow-x-auto overscroll-x-contain touch-auto px-0.5 pb-4 pt-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00a174] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        />
        <div className="mt-4 h-px overflow-hidden bg-[#DDE3DF]" aria-hidden="true">
          <div
            className="h-full bg-[#00a174] transition-[width] duration-300"
            style={{ width: `${(activeSlide / currentThreads.length) * 100}%` }}
          />
        </div>
      </div>
    </section>
  );
}
