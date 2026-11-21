import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { MoushikomiApp } from "./MoushikomiApp";
import "../index.css";
import "../findHome/findHome.css";

// 這頁是客人的私人申請資料，不載入網站分析（Vercel Analytics 會記錄網址）。
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary fallbackTitle="申請資料頁載入遇到暫時性問題" fallbackMessage="請重新載入；也可以直接用 LINE 把資料傳給 Linus。">
      <MoushikomiApp />
    </ErrorBoundary>
  </StrictMode>,
);
