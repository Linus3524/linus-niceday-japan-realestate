# 瀏覽器使用規範 (Browser Preference)

## 本機環境說明
- 本台 macOS 電腦**未安裝 Google Chrome**。
- 使用者預設且主要使用的瀏覽器為 **Brave Browser**。
- Brave 應用程式路徑：`/Applications/Brave Browser.app`
- Brave 執行檔路徑：`/Applications/Brave Browser.app/Contents/MacOS/Brave Browser`

## 瀏覽器操作指引
1. **開啟網頁給使用者查看**：
   請一律使用 `open -a "Brave Browser" "<url>"`。
2. **自動化測試與截圖 (Playwright / Puppeteer)**：
   啟動 Chromium 時必須明確指定 `executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"`。
   切勿調用預期 Chrome 存在的預設邏輯或工具。
3. **頁面載入等待**：
   在 Vite 開發環境下，`page.goto()` 請使用 `{ waitUntil: "domcontentloaded" }`，避免因 HMR WebSocket 導致 `networkidle` 等待逾時。
