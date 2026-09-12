# 領域模組、型別與呈現區塊整理

本次延續既有重構分支。UI 設計差異仍留待獨立處理；未調整原有版型、文字、配色、圓角或響應式 class。

## 領域分工

`src/lib/requirementVerdict.ts` 從 2,681 行改為 23 行相容入口，原公開函式與型別仍可從原路徑匯入。實作放在 `src/lib/requirementVerdicts/`：

| 模組 | 責任 |
| --- | --- |
| `types.ts` | 各軸、租金及買賣診斷型別 |
| `shared.ts` | 金額格式、名稱正規化、通勤車站辨識及共同常數 |
| `criteria.ts` | 原需求清理、數值範圍與預算上限 |
| `rentScope.ts` | 搜尋範圍解析與指定條件租金估算 |
| `rentalPrice.ts` | 圖紙租金判讀 |
| `salePrice.ts` | 買賣價格判讀、修正因子與提示 |
| `axes.ts` | 預算、通勤、格局、設備、時程、初期費用、寵物、簽證等個別評估 |
| `assessment.ts` | 組裝個別評估與整體可行性結論 |

模組間不經相容入口反向匯入；新模組的內部依賴無循環。最大模組約 880 行，是單一買賣判讀函式及其匯入，沒有為縮短行數拆開其運算次序。

## 呈現拆分

| 原入口 | 拆分前 | 整理後 | 實作位置 |
| --- | ---: | ---: | --- |
| `ListingReportPdf.tsx` | 1,230 | 5 | `components/listingPdf/` 的 11 個模組 |
| `SaleMarketSection.tsx` | 850 | 203 | 價格定位、因子、屋齡比較、資料來源 4 個子元件 |
| `GuidedRentForm.tsx` | 677 | 276 | 預算、申請方式、地區、線路車站、通勤、建物、設備、自然語言 8 個子元件 |
| `BuyGuideTab.tsx` | 1,120 | 399 | 搜尋、用語、流程、貸款、民泊 5 個子元件及純參考資料模組 |
| `RentGuideTab.tsx` | 753 | 284 | 搜尋、流程及原文件／名詞卡片模組 |

PDF 分成字型註冊、樣式、格式化、型別、共用卡片、位置、租賃、買賣、價格合理性、頁首頁尾／聯絡頁與文件組裝。原入口繼續匯出 `SITE_URL`、`registerPdfFonts`、`ListingReportPdf`、`ListingReportPdfProps`；字型仍在原時機註冊，匯出流程的動態載入不變。

子元件沒有新增 state 或 DOM 包裝。原事件處理仍由原入口持有，透過型別化 props 傳遞；引導表單子元件使用 `Pick<CalculatorViewModel, ...>`，避免另抄一套會漂移的 state／callback 型別。

買房的純參考資料與標籤解析放在 `src/lib/guides/buyReference.ts`，保留原文案與正規表達式。

## 型別補強與 strict 評估

- PDF 結果改用 `AnalyzeListingResult`，市場比較沿用其 `mlitComparison` 型別；children 使用 `ReactNode`，費用與因子迭代不再使用 `any`。
- PDF.js 使用 `PDFDocumentProxy` 與 `TextItem`。原本無參數的 `getTextContent()` 預設不包含 marked content，因此以文字項目型別表達既有契約，未改請求參數或解析流程。
- 新增 `src/lib/uiTypes.ts`，統一分頁、指南分類、聊天 callback 及詞條彈窗資料型別。移除 Calculator、租買指南、ChatTab、TermModal 的相關 `any`，並收斂 App 的選取詞條 state。
- 價格呈現 helper 的输入契約明確要求已存在的市場比較資料；呼叫端本來就在資料存在時才執行，沒有新增執行期分支。
- 已啟用 `strictFunctionTypes`、`strictBindCallApply`、`noImplicitThis`，一般 `npx tsc --noEmit` 為 0 錯誤。
- 完整 `--strict` 的診斷由本次開始時 163 項降至 78 項。完整 strict 尚未啟用：剩餘主要涉及報告元件的空值契約、解析結果可缺值與 API 刪除必要欄位。沒有用大量非空斷言或更改預設值來掩蓋問題。
- `docs/strict-readiness-2026-09-12.txt` 保存本次完整 strict 試跑結果。它是尚未啟用之模式的健檢紀錄，不是目前建置設定的錯誤。

部分外部 provider 與例外處理中的既有 `any` 尚存；本次完成的是 PDF、上述 callback 與資料邊界的型別補強，未宣稱全站完全沒有 `any`。

## 驗證

1. 領域模組 33 個與 PDF 模組 54 個執行宣告經 TypeScript 去型別後比對，與拆分前一致。
2. 租買指南各分類與搜尋、自然語言／結構化引導表單、一般買賣／獨棟價格呈現，共 28 個場景的 HTML 完全一致。
3. 租賃、買賣及獨棟三種 PDF 範例，原版與新版各產生一份，以實際字型及本機素材渲染。共 8 頁逐頁 PNG 雜湊相同，並已檢視全部頁面。
4. 全部 21 個 `test:*` 腳本通過，包括先前的 36 個檔案競態案例。
5. 一般 `npx tsc --noEmit`、`npm run build` 與 `git diff --check` 通過。build 仍有既有的大型 bundle 提示。

雜湊與場景清單見 `docs/refactor-domain-ui-checks-2026-09-12.json`。驗證使用受控資料與本機 PDF 素材，不代表已驗證正式外部 API 可用性。
