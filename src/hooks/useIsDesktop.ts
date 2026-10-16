import { useEffect, useState } from "react";

// 與 index.css 桌機改版的斷點一致（≥1024px 才走新版首屏與章節翻頁）
// 平板（觸控、沒有滑鼠）沿用改版前的版面，只有接滑鼠／觸控板的寬螢幕才走新版
const QUERY = "(min-width: 1024px) and (hover: hover) and (pointer: fine)";

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" && window.matchMedia(QUERY).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const onChange = () => setIsDesktop(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return isDesktop;
}
