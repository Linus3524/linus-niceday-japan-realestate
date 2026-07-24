import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { threadCategories, type FeaturedThread } from "../data/featuredThreads";
import { threadsSearchIndex } from "../data/threadsSearchIndex";

const THREADS_SCRIPT_SRC = "https://www.threads.com/embed.js";

// 搜尋框下方的熱門關鍵字快捷鈕
const PRESET_KEYWORDS = ["水電", "瓦斯", "打工", "留學", "內見", "初期"];

function threadPostId(url: string) {
  const match = url.match(/\/post\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : url;
}

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
            <div class="threads-drag-shield" data-thread-url="${url}" aria-hidden="true">
              <span class="threads-shield-hint threads-hint-pointer">點一下可滑動圖片</span>
              <span class="threads-shield-hint threads-hint-touch">點一下用 Threads 開啟 ↗</span>
            </div>
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
  const dragStateRef = useRef({ active: false, pointerId: -1, startX: 0, startScrollLeft: 0, moved: 0 });
  const unlockedShieldRef = useRef<HTMLElement | null>(null);
  const pressedShieldRef = useRef<HTMLElement | null>(null);
  const pressedPointerTypeRef = useRef("mouse");
  const [activeCategory, setActiveCategory] = useState(0);
  const [activeSlide, setActiveSlide] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const currentCategory = threadCategories[activeCategory];

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const isSearching = normalizedQuery.length > 0;

  // 搜尋：只比對貼文「內文」（不含分類名稱，否則整個分類會因名字含關鍵字而全中），
  // 並依相關性給分後排序——標題附近命中、出現次數多的排前面，順帶提一次的排後面。
  const searchResults = useMemo(() => {
    if (!isSearching) return [] as FeaturedThread[];
    const scored: { thread: FeaturedThread; score: number }[] = [];
    for (const category of threadCategories) {
      for (const thread of category.threads) {
        const text = (threadsSearchIndex[threadPostId(thread.url)] ?? "").toLowerCase();
        const firstIndex = text.indexOf(normalizedQuery);
        if (firstIndex === -1) continue;
        const occurrences = text.split(normalizedQuery).length - 1;
        // 出現在前 60 字（約略是系列標籤＋標題範圍）視為「主題命中」，大幅加權
        const headlineBonus = firstIndex < 60 ? 100 : 0;
        const score = headlineBonus + occurrences * 10 - Math.min(firstIndex, 600) * 0.05;
        scored.push({ thread, score });
      }
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.map((entry) => entry.thread);
  }, [normalizedQuery, isSearching]);

  // currentThreads = 目前實際顯示的清單（搜尋結果或所選分類），
  // 下方拖曳／輪播／批次載入邏輯全部沿用這個清單，不需改動。
  const currentThreads = isSearching ? searchResults : (currentCategory?.threads ?? []);

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
    unlockedShieldRef.current = null;
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
  }, [activeCategory, normalizedQuery]);

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
  }, [activeCategory, normalizedQuery]);

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
    // 先記住按在哪張卡的遮罩上：一旦 track 取得 pointer capture，之後的 click 會被
    // 重新指向 track，屆時 event.target 不再是遮罩，因此不能等到 click 才判斷。
    pressedShieldRef.current = (event.target as HTMLElement).closest<HTMLElement>(".threads-drag-shield");
    pressedPointerTypeRef.current = event.pointerType;
    if (event.pointerType !== "mouse" || event.button !== 0) {
      // 觸控不走自訂拖曳（交給原生捲動），moved 歸零避免沿用上一次滑鼠拖曳的殘值。
      dragStateRef.current.moved = 0;
      return;
    }

    dragStateRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: event.currentTarget.scrollLeft,
      moved: 0,
    };
  };

  const dragCarousel = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    drag.moved = Math.max(drag.moved, Math.abs(event.clientX - drag.startX));
    // 超過門檻才真正進入拖曳並捕獲指標，單純點擊就不會被重新指向而吃掉 click。
    if (drag.moved > 4 && !event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.classList.add("is-dragging");
    }
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

  const relockCards = () => {
    const shield = unlockedShieldRef.current;
    if (!shield) return;
    shield.classList.remove("is-unlocked");
    unlockedShieldRef.current = null;
  };

  // 點一下卡片 → 解除該張的拖曳遮罩，把控制權交還 Threads，使用者就能滑貼文內的圖片。
  // 有實際拖動過（位移超過 6px）視為滑動，不解鎖。一次只開放一張。
  const unlockCardInteraction = () => {
    const shield = pressedShieldRef.current;
    pressedShieldRef.current = null;
    if (!shield || dragStateRef.current.moved > 6) return;

    // 觸控裝置直接開啟 Threads：手機上 App 的閱讀體驗遠優於卡片內的小視窗，
    // 且沒有 hover 可表達「已解鎖」狀態，兩段式操作只會造成困惑。
    if (pressedPointerTypeRef.current !== "mouse") {
      const url = shield.dataset.threadUrl;
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    relockCards();
    shield.classList.add("is-unlocked");
    unlockedShieldRef.current = shield;
  };

  const scrollWithHorizontalWheel = (event: WheelEvent) => {
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

  // React 的 onWheel 會以 passive 方式註冊，preventDefault 無效（觸控板／妙控滑鼠的
  // 橫向手勢會被瀏覽器接管）。改用原生 non-passive 監聽確保攔得到。
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.addEventListener("wheel", scrollWithHorizontalWheel, { passive: false });
    return () => track.removeEventListener("wheel", scrollWithHorizontalWheel);
  }, [activeCategory]);

  // 解鎖後自動歸位：游標移出該卡片（桌機）或在別處按下（手機）就把遮罩裝回去，
  // 讓輪播恢復可拖曳。註：游標停在 iframe 上時 document 收不到 pointermove，
  // 因此收得到事件本身就代表已離開 iframe，判斷才成立。
  useEffect(() => {
    const isOutsideUnlockedSlide = (clientX: number, clientY: number) => {
      const slide = unlockedShieldRef.current?.closest<HTMLElement>(".threads-slide");
      if (!slide) return false;
      const rect = slide.getBoundingClientRect();
      return clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom;
    };

    const handleMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      if (isOutsideUnlockedSlide(event.clientX, event.clientY)) relockCards();
    };
    const handleDown = (event: PointerEvent) => {
      if (isOutsideUnlockedSlide(event.clientX, event.clientY)) relockCards();
    };

    // 保險：手勢若被瀏覽器接管（手機捲動很常見），pointerup／cancel 可能不會回到
    // track，isUserInteractingRef 就會卡在 true 讓自動輪播永久停住。改由 document
    // 層級補一次解除。
    const releaseInteraction = () => {
      isUserInteractingRef.current = false;
    };

    document.addEventListener("pointermove", handleMove, { passive: true });
    document.addEventListener("pointerdown", handleDown, { passive: true });
    document.addEventListener("pointerup", releaseInteraction, { passive: true });
    document.addEventListener("pointercancel", releaseInteraction, { passive: true });
    return () => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerdown", handleDown);
      document.removeEventListener("pointerup", releaseInteraction);
      document.removeEventListener("pointercancel", releaseInteraction);
    };
  }, []);

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
  }, [activeCategory, normalizedQuery]);

  const selectCategory = (index: number, button: HTMLButtonElement) => {
    setSearchQuery("");
    setActiveCategory(index);
    button.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  };

  // 只有完全沒有分類資料時才整塊不顯示；搜尋 0 筆時仍要保留搜尋框與提示。
  if (threadCategories.length === 0) return null;

  return (
    <section className="border-y border-[#DDE3DF] bg-[#F5F8F6]" id="threads-featured" aria-label="LINUS 精選 Threads 文章">
      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 sm:py-10">
        {/* 標題列：標題 + 搜尋框 + 追蹤 + 輪播箭頭。搜尋框放在追蹤左側，
            熱門關鍵字改成聚焦搜尋框時才落下的下拉，平時不佔版面。 */}
        <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 className="font-serif text-xl font-bold leading-snug text-[#1A2A22] sm:text-2xl">
              在 Threads，繼續住好日
            </h2>
            <p className="mt-1 font-sans text-xs leading-relaxed text-zinc-500 sm:text-sm">
              日本租屋、買房與生活實務，從第一線經驗說給你聽。
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="relative flex-1 sm:w-60 sm:flex-none">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="搜尋貼文關鍵字"
                aria-label="搜尋 Threads 貼文"
                className="h-9 w-full border border-[#C9D8D1] bg-white pl-9 pr-9 font-sans text-sm text-[#1A2A22] placeholder:text-zinc-400 focus:border-[#00a174] focus:outline-none focus:ring-1 focus:ring-[#00a174] [&::-webkit-search-cancel-button]:hidden"
              />
              {isSearching && (
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => setSearchQuery("")}
                  aria-label="清除搜尋"
                  className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-zinc-400 hover:text-[#00a174]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {/* 聚焦時落下的熱門關鍵字下拉 */}
              {searchFocused && (
                <div className="absolute left-0 right-0 top-full z-30 mt-1 border border-[#C9D8D1] bg-white p-2.5 shadow-[0_8px_24px_-12px_rgba(15,143,109,0.35)]">
                  <div className="mb-2 px-0.5 font-jost text-[10px] font-semibold tracking-[0.14em] text-zinc-400">
                    熱門關鍵字
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_KEYWORDS.map((keyword) => (
                      <button
                        key={keyword}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setSearchQuery(keyword);
                          setSearchFocused(false);
                        }}
                        className="shrink-0 border border-[#C9D8D1] bg-white px-2.5 py-1 font-sans text-xs text-[#3F5147] transition-colors hover:border-[#00a174] hover:bg-[#e6f6f1] hover:text-[#007d5a]"
                      >
                        {keyword}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <a
              href="https://www.threads.com/@linus3524"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 shrink-0 items-center gap-1.5 border border-[#00a174] bg-white px-3.5 font-sans text-xs font-bold text-[#007d5a] transition-colors hover:bg-[#00a174] hover:text-white"
            >
              追蹤 <span className="hidden sm:inline">@linus3524</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              disabled={currentThreads.length <= 1}
              aria-label="上一則"
              className="hidden h-9 w-9 cursor-pointer items-center justify-center border border-[#C9D8D1] bg-white text-[#1A2A22] transition-colors hover:border-[#00a174] hover:text-[#00a174] disabled:cursor-not-allowed disabled:opacity-30 sm:flex"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              disabled={currentThreads.length <= 1}
              aria-label="下一則"
              className="hidden h-9 w-9 cursor-pointer items-center justify-center border border-[#C9D8D1] bg-white text-[#1A2A22] transition-colors hover:border-[#00a174] hover:text-[#00a174] disabled:cursor-not-allowed disabled:opacity-30 sm:flex"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 搜尋中：顯示結果摘要；否則顯示分類標籤 */}
        {isSearching ? (
          <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 sm:mb-5">
            <span className="font-sans text-sm text-[#1A2A22]">
              「<span className="font-bold text-[#007d5a]">{searchQuery.trim()}</span>」找到{" "}
              <span className="font-bold">{currentThreads.length}</span> 篇
            </span>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="font-sans text-xs text-zinc-500 underline underline-offset-2 hover:text-[#00a174]"
            >
              清除，回到分類瀏覽
            </button>
          </div>
        ) : (
          <div
            className="threads-category-tabs mb-4 flex gap-2 overflow-x-auto pb-0 sm:mb-5"
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
                  className={`shrink-0 border px-3 py-1.5 font-sans text-xs font-bold transition-colors ${
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
        )}

        {isSearching && currentThreads.length === 0 ? (
          <div className="flex flex-col items-center gap-2 border border-dashed border-[#C9D8D1] bg-white px-6 py-14 text-center">
            <p className="font-sans text-sm text-[#1A2A22]">
              找不到符合「<span className="font-bold text-[#007d5a]">{searchQuery.trim()}</span>」的貼文
            </p>
            <p className="font-sans text-xs text-zinc-500">換個關鍵字，或試試上方的熱門標籤。</p>
          </div>
        ) : (
          <>
            <div
              id="threads-category-panel"
              role="tabpanel"
              aria-label={isSearching ? "搜尋結果 Threads 貼文，可左右滑動" : `${currentCategory.label} Threads 貼文，可左右滑動`}
              ref={trackRef}
              tabIndex={0}
              onPointerDown={startDragging}
              onPointerMove={dragCarousel}
              onPointerUp={stopDragging}
              onPointerCancel={stopDragging}
              onClick={unlockCardInteraction}
              onKeyDown={(event) => {
                if (event.key === "ArrowLeft") scrollByCard(-1);
                if (event.key === "ArrowRight") scrollByCard(1);
              }}
              className="threads-track flex gap-4 overflow-x-auto overscroll-x-contain touch-auto px-0.5 pb-4 pt-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00a174] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            />
            <div className="mt-4 h-px overflow-hidden bg-[#DDE3DF]" aria-hidden="true">
              <div
                className="h-full bg-[#00a174] transition-[width] duration-300"
                style={{ width: `${currentThreads.length ? (activeSlide / currentThreads.length) * 100 : 0}%` }}
              />
            </div>
          </>
        )}
      </div>
    </section>
  );
}
