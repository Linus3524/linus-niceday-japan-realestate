import { useEffect, useState } from "react";

// 左上資訊列:令和年號 + 年月日(星期) + 即時時鐘 + 東京天氣氣溫(全部以東京 JST 為準)
const TZ = "Asia/Tokyo";

// 日本曆 (ja-JP-u-ca-japanese) 會自動輸出「令和8年」這種年號
const eraFmt = new Intl.DateTimeFormat("ja-JP-u-ca-japanese", {
  era: "long",
  year: "numeric",
  timeZone: TZ,
});
const mdFmt = new Intl.DateTimeFormat("ja-JP", {
  month: "long",
  day: "numeric",
  weekday: "short",
  timeZone: TZ,
});
const timeFmt = new Intl.DateTimeFormat("ja-JP", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: TZ,
});

// Open-Meteo WMO 天氣代碼 → 日文描述
const WMO: Record<number, string> = {
  0: "快晴", 1: "晴れ", 2: "晴れ時々曇り", 3: "曇り",
  45: "霧", 48: "霧氷", 51: "霧雨", 53: "霧雨", 55: "霧雨",
  56: "着氷性の霧雨", 57: "着氷性の霧雨",
  61: "小雨", 63: "雨", 65: "大雨", 66: "着氷性の雨", 67: "着氷性の雨",
  71: "小雪", 73: "雪", 75: "大雪", 77: "霧雪",
  80: "にわか雨", 81: "にわか雨", 82: "激しいにわか雨",
  85: "にわか雪", 86: "にわか雪",
  95: "雷雨", 96: "雷雨(雹)", 99: "激しい雷雨",
};

export default function HeaderInfoBar() {
  const [dateTime, setDateTime] = useState(() => {
    const now = new Date();
    return `${eraFmt.format(now)} ${mdFmt.format(now)} ${timeFmt.format(now)}`;
  });
  const [weather, setWeather] = useState("東京 · --℃");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setDateTime(`${eraFmt.format(now)} ${mdFmt.format(now)} ${timeFmt.format(now)}`);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=35.6895&longitude=139.6917&current_weather=true&timezone=Asia%2FTokyo"
        );
        const data = await res.json();
        if (!cancelled && data?.current_weather) {
          const temp = Math.round(data.current_weather.temperature);
          const desc = WMO[data.current_weather.weathercode] ?? "—";
          setWeather(`東京 · ${temp}℃ ${desc}`);
        }
      } catch {
        if (!cancelled) setWeather("東京 · --℃");
      }
    };
    fetchWeather();
    // 每 10 分鐘更新一次天氣
    const timer = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="hidden sm:flex font-sans text-[11px] tracking-[0.08em] text-zinc-500 items-center gap-3 tabular-nums">
      <span>{dateTime}</span>
      <span className="text-zinc-300">|</span>
      <span>{weather}</span>
    </div>
  );
}
