import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { FindHomeApp } from "./FindHomeApp";
import "../index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary fallbackTitle="問卷載入遇到暫時性問題" fallbackMessage="請重新載入；也可以直接加 Linus 的 LINE 聯絡。">
      <FindHomeApp />
    </ErrorBoundary>
    <Analytics />
  </StrictMode>,
);
