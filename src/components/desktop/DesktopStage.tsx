import { useEffect, useState, type ReactNode } from "react";
import type { AppTab } from "../../lib/uiTypes";

// 桌機（≥1024px）首屏：場景插畫鋪滿畫面，左右是可收合的毛玻璃面板，
// 底部是細的場景播放列。手機與平板仍走 App.tsx 原本的首圖，不受影響。

export interface StageScene {
  key: string;
  bg: string;
  character: string;
  slogan: string[];
}

// 右側時鐘可以在東京與台北之間切換：大鐘、日期、天氣跟著切換的城市
const CITIES = {
  tokyo: { label: "東京", en: "Tokyo", tz: "Asia/Tokyo", lat: 35.6895, lon: 139.6917 },
  taipei: { label: "台北", en: "Taipei", tz: "Asia/Taipei", lat: 25.033, lon: 121.5654 },
} as const;
type CityKey = keyof typeof CITIES;

function makeFormatters(tz: string) {
  return {
    era: new Intl.DateTimeFormat("ja-JP-u-ca-japanese", { era: "long", year: "numeric", timeZone: tz }),
    parts: new Intl.DateTimeFormat("en-GB", {
      timeZone: tz, year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric", hour12: false,
    }),
    weekday: new Intl.DateTimeFormat("ja-JP", { weekday: "short", timeZone: tz }),
    enMonth: new Intl.DateTimeFormat("en-US", { month: "short", timeZone: tz }),
    enWeekday: new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: tz }),
  };
}
const FORMATTERS: Record<CityKey, ReturnType<typeof makeFormatters>> = {
  tokyo: makeFormatters(CITIES.tokyo.tz),
  taipei: makeFormatters(CITIES.taipei.tz),
};

// Open-Meteo WMO 天氣代碼 → 日文描述（與 HeaderInfoBar 同一套）
const WMO: Record<number, string> = {
  0: "快晴", 1: "晴れ", 2: "晴れ時々曇り", 3: "曇り", 45: "霧", 48: "霧氷",
  51: "霧雨", 53: "霧雨", 55: "霧雨", 61: "小雨", 63: "雨", 65: "大雨",
  71: "小雪", 73: "雪", 75: "大雪", 80: "にわか雨", 81: "にわか雨", 82: "激しいにわか雨",
  95: "雷雨", 96: "雷雨(雹)", 99: "激しい雷雨",
};

const MENU: Array<{ id: AppTab; label: string; en: string }> = [
  { id: "cards", label: "租屋指南", en: "Rent" },
  { id: "buyHouse", label: "買房置產", en: "Buy" },
  { id: "calculator", label: "費用試算", en: "Calculate" },
  { id: "chat", label: "AI 顧問", en: "Ask AI" },
  { id: "contact", label: "聯絡諮詢", en: "Contact" },
];

const PANEL_STORAGE_KEY = "linus-stage-panels";

/** 桌機單頁應用目前顯示的頁面：首頁場景、各分頁，或 Threads 精選 */
export type StagePage = "home" | "threads" | "quiz" | AppTab;

function readPanels(): { left: boolean; right: boolean } {
  try {
    const raw = localStorage.getItem(PANEL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { left: parsed.left !== false, right: parsed.right !== false };
    }
  } catch {
    // 無痕模式等情況讀不到，就預設兩邊都展開
  }
  return { left: true, right: true };
}

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

function cityTime(now: Date, city: CityKey) {
  const f = FORMATTERS[city];
  const parts = Object.fromEntries(f.parts.formatToParts(now).map(p => [p.type, p.value]));
  return {
    era: f.era.format(now),
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    weekday: f.weekday.format(now),
    enMonth: f.enMonth.format(now),
    enWeekday: f.enWeekday.format(now).toUpperCase(),
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

function useCityWeather(city: CityKey) {
  const [weather, setWeather] = useState<{ temp: number; desc: string } | null>(null);
  useEffect(() => {
    let cancelled = false;
    const { lat, lon, tz } = CITIES[city];
    setWeather(null);
    const load = async () => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=${encodeURIComponent(tz)}`
        );
        const data = await res.json();
        if (!cancelled && data?.current_weather) {
          setWeather({ temp: Math.round(data.current_weather.temperature), desc: WMO[data.current_weather.weathercode] ?? "—" });
        }
      } catch {
        // 天氣只是點綴，抓不到就不顯示
      }
    };
    load();
    const id = window.setInterval(load, 10 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [city]);
  return weather;
}

/** 方形錶框指針時鐘。offsetHours 用來算其他城市（台北 = -1）。 */
function SquareClock({ hour, minute, second, offsetHours = 0, size, showSeconds = true, label }: {
  hour: number; minute: number; second: number; offsetHours?: number; size: "lg" | "sm"; showSeconds?: boolean; label: string;
}) {
  const h = (((hour + offsetHours) % 12) + 12) % 12;
  const hourDeg = h * 30 + minute * 0.5;
  const minuteDeg = minute * 6 + second * 0.1;
  const secondDeg = second * 6;
  const hh = String(((hour + offsetHours) % 24 + 24) % 24).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return (
    <div className={`stage-clock stage-clock--${size}`} role="img" aria-label={`${label} ${hh}:${mm}`}>
      {Array.from({ length: 12 }, (_, i) => (
        <span key={i} className={`stage-clock-tick ${i % 3 === 0 ? "is-major" : ""}`} style={{ transform: `rotate(${i * 30}deg)` }} />
      ))}
      <span className="stage-clock-hand stage-clock-hand--hour" style={{ transform: `rotate(${hourDeg}deg)` }} />
      <span className="stage-clock-hand stage-clock-hand--minute" style={{ transform: `rotate(${minuteDeg}deg)` }} />
      {showSeconds && <span className="stage-clock-hand stage-clock-hand--second" style={{ transform: `rotate(${secondDeg}deg)` }} />}
      <span className="stage-clock-pin" />
    </div>
  );
}

/** 面板內側那條細邊：點一下收合／展開。收合後只剩這條細邊貼在畫面邊緣。 */
function EdgeToggle({ side, open, onToggle, label }: { side: "left" | "right"; open: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      className={`stage-edge stage-edge--${side}`}
      onClick={onToggle}
      aria-expanded={open}
      aria-label={`${open ? "收合" : "展開"}${label}`}
      title={`${open ? "收合" : "展開"}${label}`}
    >
      <span className="stage-edge-line" aria-hidden="true" />
    </button>
  );
}

export function DesktopStage({
  scenes, current, paused, rotateMs, booting, visitorDisplay, page,
  onSelectScene, onTogglePause, onNavigate, onHome, onShowThreads, onShowQuiz, below,
}: {
  scenes: StageScene[];
  current: number;
  paused: boolean;
  rotateMs: number;
  booting: boolean;
  visitorDisplay: string;
  page: StagePage;
  onSelectScene: (index: number) => void;
  onTogglePause: () => void;
  onNavigate: (tab: AppTab) => void;
  onHome: () => void;
  onShowThreads: () => void;
  onShowQuiz: () => void;
  /** 首頁往下捲的介紹區塊（首屏之後接著顯示） */
  below?: ReactNode;
}) {
  const [panels, setPanels] = useState(readPanels);
  const [city, setCity] = useState<CityKey>("tokyo");
  const otherCity: CityKey = city === "tokyo" ? "taipei" : "tokyo";
  const nowDate = useNow();
  const now = cityTime(nowDate, city);
  const other = cityTime(nowDate, otherCity);
  const weather = useCityWeather(city);
  const scene = scenes[current];
  const count = scenes.length;

  // 中間內容面板（App.tsx 的 desk-sheet）要跟著左右面板的收合調整寬度，
  // 它不在這個元件裡，所以把狀態寫在 <html> 上給 CSS 讀
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.stageLeft = panels.left ? "open" : "collapsed";
    root.dataset.stageRight = panels.right ? "open" : "collapsed";
    root.dataset.stagePage = page;
    return () => {
      delete root.dataset.stageLeft;
      delete root.dataset.stageRight;
      delete root.dataset.stagePage;
    };
  }, [panels, page]);

  const togglePanel = (side: "left" | "right") => {
    setPanels(prev => {
      const next = { ...prev, [side]: !prev[side] };
      try {
        localStorage.setItem(PANEL_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // 存不了就只在這次瀏覽有效
      }
      return next;
    });
  };

  return (
    <section
      className={`desktop-stage hero-scene--${scene.key} ${panels.left ? "" : "is-left-collapsed"} ${panels.right ? "" : "is-right-collapsed"} ${page === "home" ? "is-home" : "is-subpage"}`}
      aria-label="LINUS 住好日首頁主視覺"
    >
      {/* 首屏：場景插畫、標語與文案。首頁往下捲會接著介紹區塊，左右面板與播放列固定不動 */}
      <div className="stage-hero">
      {/* 場景插畫：背景與人物各一層，四組疊放靠 is-active 淡入淡出 */}
      <div className={`stage-media ${booting ? "is-booting" : ""}`} aria-hidden="true">
        {scenes.map((s, i) => (
          <img
            key={`bg-${s.key}`}
            src={s.bg}
            alt=""
            className={`stage-bg ${i === current ? "is-active" : ""}`}
            fetchPriority={i === 0 ? "high" : undefined}
            loading={i === 0 ? undefined : "lazy"}
            decoding="async"
          />
        ))}
        <div className="stage-veil" />
        {scenes.map((s, i) => (
          <img
            key={`ch-${s.key}`}
            src={s.character}
            alt=""
            className={`stage-character stage-character--${s.key} ${i === current ? "is-active" : ""}`}
            loading={i === 0 ? undefined : "lazy"}
            decoding="async"
          />
        ))}
      </div>

      {/* 四組場景的日文標語：和手機版一樣直書，放在人物左上方 */}
      <div className="stage-slogans" aria-hidden="true">
        {scenes.map((s, i) => (
          <p key={`sl-${s.key}`} className={`stage-vslogan stage-vslogan--${s.key} ${i === current ? "is-active" : ""}`}>
            <span>{s.slogan[0]}</span>
            <br />
            <span>　　{s.slogan[1]}</span>
          </p>
        ))}
      </div>

      {/* 中央文案 */}
      <div className="stage-copy">
        <p className="stage-eyebrow">
          <span className="stage-eyebrow-dash" aria-hidden="true" />
          Have a nice day in Japan
        </p>
        <h1 className="stage-title">
          日本での暮らしを、
          <br />
          <span className="stage-title-accent">好日へ。</span>
        </h1>
        {/* 副標與自介沿用原本首圖的文案 */}
        <div className="stage-readable">
        <h2 className="stage-subtitle">台灣人仲介帶你看懂日本租屋、買房與置產。</h2>
        <div className="stage-intro">
          <p>我是 Linus，在東京從事不動產仲介，也是一名來自台灣的平面設計師。</p>
          <p>分享日本租屋、買房、貸款規劃與在日生活的經驗實務，並提供 24 小時 AI 顧問與線上諮詢。</p>
          <p>從找房到安居，希望成為你在日本最值得信賴的夥伴。</p>
          <p>Linus 住好日，一起在日本住好日！</p>
        </div>
        {/* 沿用原本首圖的標示列：分隔線寬度跟著這一行 */}
        <div className="stage-meta">
          <span>Since 2024</span>
          <span aria-hidden="true">•</span>
          <span>Real Estate Guide</span>
          <span aria-hidden="true">•</span>
          <span>Tokyo</span>
          <span aria-hidden="true">•</span>
          <span className="stage-meta-visitors">
            Visitors <span className="stage-mono" aria-live="polite">{visitorDisplay}</span>
          </span>
        </div>
        </div>
      </div>
      </div>

      {page === "home" && below && <div className="stage-below">{below}</div>}

      {/* 左側選單面板 */}
      <aside className="stage-panel stage-panel--left" aria-label="主選單">
        <div className="stage-panel-body">
          <nav className="stage-menu">
            {MENU.map((item, i) => (
              // 再點一次目前所在的分頁 = 關掉分頁回首頁
              <button key={item.id} type="button" className={`stage-menu-item ${page === item.id ? "is-active" : ""}`} aria-current={page === item.id ? "page" : undefined} onClick={() => (page === item.id ? onHome() : onNavigate(item.id))}>
                <span className="stage-menu-num">{String(i + 1).padStart(2, "0")}</span>
                <span className="stage-menu-label">{item.label}</span>
                <span className="stage-menu-en">{item.en}</span>
              </button>
            ))}
            {/* 測驗直接在內容面板裡開，不跳出網站 */}
            <button type="button" className={`stage-menu-item ${page === "quiz" ? "is-active" : ""}`} aria-current={page === "quiz" ? "page" : undefined} onClick={page === "quiz" ? onHome : onShowQuiz}>
              <span className="stage-menu-num">{String(MENU.length + 1).padStart(2, "0")}</span>
              <span className="stage-menu-label">居住人格診斷</span>
              <span className="stage-menu-en">Quiz</span>
            </button>
          </nav>
        </div>
        <EdgeToggle side="left" open={panels.left} onToggle={() => togglePanel("left")} label="選單" />
      </aside>

      {/* 右側時鐘面板 */}
      <aside className="stage-panel stage-panel--right" aria-label="東京時間與天氣">
        <EdgeToggle side="right" open={panels.right} onToggle={() => togglePanel("right")} label="時鐘" />
        <div className="stage-panel-body">
          {/* 日期：雜誌刊頭式排法 —— 斜體英文月份（場景色）／細長大字日期＋星期方框／細線上的西元與年號 */}
          <div key={`date-${city}`} className="stage-date stage-swap-in" aria-label={`${now.year}年${now.month}月${now.day}日（${now.weekday}）`}>
            <div className="stage-date-row">
              <span className="stage-date-month">{now.enMonth}.</span>
              <span className="stage-date-enweek">{now.enWeekday}</span>
            </div>
            <div className="stage-date-row stage-date-row--main">
              <span className="stage-date-day">{String(now.day).padStart(2, "0")}</span>
              <span className="stage-date-week">{now.weekday}</span>
            </div>
            <div className="stage-date-foot">
              <span>{now.year}</span>
              <span className="stage-date-rule" aria-hidden="true" />
              <span>{now.era}</span>
            </div>
          </div>
          <div key={`big-${city}`} className="stage-clock-group stage-swap-grow">
            <SquareClock size="lg" label={CITIES[city].label} hour={now.hour} minute={now.minute} second={now.second} />
            <span className="stage-clock-label">{CITIES[city].label}</span>
          </div>
          {/* 點小鐘就跟大鐘交換城市（東京⇄台北），日期與天氣一起切換 */}
          <button
            type="button"
            className="stage-clock-group stage-clock-group--sub stage-clock-switch"
            onClick={() => setCity(otherCity)}
            aria-label={`切換成${CITIES[otherCity].label}的時間與天氣`}
            title={`切換成${CITIES[otherCity].label}`}
          >
            <SquareClock key={`small-${otherCity}`} size="sm" label={CITIES[otherCity].label} hour={other.hour} minute={other.minute} second={other.second} showSeconds={false} />
            <span className="stage-clock-label">{CITIES[otherCity].label}</span>
          </button>
          <div key={`wx-${city}`} className="stage-weather stage-swap-in">
            <span className="stage-weather-place">{CITIES[city].en}</span>
            <span>{weather ? `${weather.temp}℃ ${weather.desc}` : "--℃"}</span>
          </div>
        </div>
      </aside>

      {/* 底部細播放列 */}
      <div className="stage-bar">
        <div className="stage-tags">
          <button type="button" onClick={() => onNavigate("cards")}>#租屋</button>
          <button type="button" onClick={() => onNavigate("buyHouse")}>#買房</button>
          <button type="button" className={page === "threads" ? "is-active" : ""} onClick={page === "threads" ? onHome : onShowThreads}>#Threads精選</button>
        </div>
        <div className="stage-player">
          <div className="stage-progress" aria-hidden="true">
            {scenes.map((s, i) => (
              <span key={s.key} className={`stage-progress-seg ${i === current ? "is-active" : ""} ${i < current ? "is-done" : ""}`}>
                {i === current && (
                  <span
                    key={`${current}-fill`}
                    className={`stage-progress-fill ${paused ? "is-paused" : ""}`}
                    style={{ animationDuration: `${rotateMs}ms` }}
                  />
                )}
              </span>
            ))}
          </div>
          <span className="stage-count stage-mono">{String(current + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</span>
          <div className="stage-controls">
            {/* 用 SVG 圖示而不是文字符號：文字會落在字型基線上，在方框裡永遠偏一邊 */}
            <button type="button" aria-label="上一個場景" onClick={() => onSelectScene((current - 1 + count) % count)}>
              <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M7.5 2.5 4 6l3.5 3.5" /></svg>
            </button>
            <button type="button" aria-label={paused ? "播放場景輪播" : "暫停場景輪播"} aria-pressed={paused} onClick={onTogglePause}>
              {paused
                ? <svg viewBox="0 0 12 12" aria-hidden="true"><path className="is-fill" d="M4 2.5v7l5.5-3.5z" /></svg>
                : <svg viewBox="0 0 12 12" aria-hidden="true"><path className="is-fill" d="M3.5 2.5h1.8v7H3.5zM6.7 2.5h1.8v7H6.7z" /></svg>}
            </button>
            <button type="button" aria-label="下一個場景" onClick={() => onSelectScene((current + 1) % count)}>
              <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M4.5 2.5 8 6l-3.5 3.5" /></svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
