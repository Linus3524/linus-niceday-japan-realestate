# 程式碼分類與邏輯抽取紀錄

基準：`78ea857`。分支：`codex/refactor-architecture-audit`。

本輪整理計算、型別、資料請求、瀏覽器工具，以及保留既有畫面的子元件拆分。圓角、字型、圖示與色彩差異依使用者指示另行處理；JSX 搬移到子元件，沒有調整原有 DOM 標籤、屬性、文字、樣式表或響應式版型。

| 原入口 | 基準行數 | 整理後行數 |
| --- | ---: | ---: |
| `src/components/ListingHealthCheck.tsx` | 5,030 | 620 |
| `src/components/CalculatorTab.tsx` | 2,717 | 259 |
| `api/analyze-listing.ts` | 1,805 | 969 |
| `src/components/UsageDashboard.tsx` | 1,018 | 965 |

共抽取 27 個邏輯／資料／工具模組、2 個 controller hook、15 個呈現子元件及 2 個原樣式設定模組。行數差異包含匯入與呼叫邊界的排版，不能視為刪除的功能數量。

## 模組分工

| 路徑（相對於 `src/lib/`） | 責任 |
| --- | --- |
| `listing/types.ts` | 前端圖紙結果、買賣診斷、租賃費用及通勤型別 |
| `listing/clientInitialCost.ts` | 缺少 API 初期費用資料時的原前端備援 |
| `listing/clientSaleAnalysis.ts` | 缺少 API 買賣診斷時的原前端備援 |
| `listing/reportModel.ts` | 報告資料組裝、審核閘門、標題／房號解析、特殊買賣比對與稅費組裝 |
| `listing/rentalMarketPresentation.ts` | 租金因子備援、折溢價加總及結論文字 |
| `listing/saleMarketPresentation.ts` | 買賣價格座標、標籤避讓、屋齡帶刻度及比較顯示值 |
| `listing/formatters.ts` | 金額、房齡帶、管理方式、稅額依據與檔案大小格式 |
| `listing/apiClient.ts` | 圖紙分析、位置／治安／通勤、分享的原 HTTP 請求契約 |
| `listing/browser/uploadConfig.ts` | 原有上傳大小、尺寸、品質、PDF 逾時及文字上限 |
| `listing/browser/fileUtils.ts` | Base64、FileReader、逾時及空白畫布判斷 |
| `listing/browser/pdfRendering.ts` | PDF 文字層、上傳轉圖、預覽、取消及資源清理 |
| `listing/browser/uploadEncoding.ts` | 圖片編碼、PDF＋JPEG 組合、超限及失敗備援 |
| `calculator/types.ts` | 原 Calculator Props 與篩選條件型別 |
| `calculator/options.ts` | 預算／簽證／條件選項、結構與路線正規化 |
| `calculator/locationSelection.ts` | 行政區及車站生活圈查詢 |
| `calculator/rentEstimate.ts` | 區域倍率、條件調價、車站調價及最低租金 |
| `calculator/availability.ts` | 供給、競爭程度、限制因素排序與提示 |
| `calculator/buyBudget.ts` | 買價、月付、購屋負擔能力與費用比例 |
| `calculator/criteriaMapping.ts` | 結構化表單轉成原 API criteria |
| `calculator/upfrontBudget.ts` | 租金乘 4／5／6 的快速初期準備金與缺口 |
| `calculator/formatters.ts` | 萬円格式 |
| `calculator/apiClient.ts` | 自然語言／結構化租屋分析請求 |
| `analytics/usageSummary.ts` | 月份範圍選項、每日及每月統計 |
| `server/listing/types.ts` | 原後端辨識欄位與租賃費用型別 |
| `server/listing/rentalInitialCost.ts` | 原後端逐項租賃初期費用計算 |
| `server/listing/marketLocation.ts` | 全國行情地區、地址及車站比對 |
| `server/listing/saleAnalysis.ts` | 原後端買賣行情、修繕、收益、稅費組裝 |

## 元件與狀態協調

- `hooks/useListingHealthCheckController.tsx`：原圖紙選檔、預覽、分析、定位、治安、通勤、分享及 PDF 匯出狀態，連同原本的 effect 清理集中管理。
- `hooks/useCalculatorController.tsx`：原計算器表單狀態、條件互斥、AI 回填、推薦套用及分析流程。32 個圖紙 state 與 35 個 Calculator state 的初始值及呼叫順序維持原狀。
- `components/listing/`：買賣價格定位、摘要、物件規格、持有與修繕、投資與法務、買賣費用、租賃摘要、租金診斷、租賃費用、位置治安、分享匯出，共 11 個呈現元件。
- `components/calculator/`：`GuidedRentForm`、`BuyBudgetPanel`、`AdvancedCalculatorInputs`、`AdvancedCalculatorResults`，共 4 個呈現元件。
- 子元件以 `Pick<ControllerModel, ...>` 明列可讀取的資料與 callback，由原入口直接傳入 model；沒有新增全域 store、隱性 context 或新的 DOM 包裝容器。
- 原語意狀態色及表單 class 函式搬至 `listing/statusTheme.ts`、`calculator/fieldStyles.ts`，字串保持原樣，包括待獨立處理的既有設計差異。

## 保留的邊界

- 前端備援與後端完整計算分開存放，沒有將不同缺值條件、預設值或公式合併。快速預算比例也沒有取代圖紙逐項費用計算。
- Calculator 的原閉包函式改由每次 render 的明確上下文建立。原函式名稱、呼叫參數、運算內容及回傳行為保留，沒有引入 memoization 或全域狀態。
- 請求 client 回傳原始 `Promise<Response>`。JSON 解析、通知、API 失敗時的本地推薦、定位失敗仍查治安、loading 與取消狀態由 controller hook 延續原流程，沒有新增重試、逾時或快取。
- `api/analyze-listing.ts` 保留原 handler、OCR、限流、CORS 與配額邏輯。服務抽取到 `api/` 之外，沒有新增 serverless 路由。
- `ListingHealthCheck`、`UsageDashboard` 及 `api/analyze-listing` 原本匯出的型別／函式保留相容轉出，既有呼叫者不必同步搬移。
- `listingExtraction`、`requirementVerdict`、治安、路線 provider、快取及市場快照演算法本輪未修改。
- 部分計算依賴當前年份／日期。測試固定於 2026-09-12；正式程式仍採用原本的時間行為。

## 驗證證據

1. TypeScript：`npx tsc --noEmit` 通過。
2. 全部登錄的 21 個 `test:*` 腳本通過（原有 18 個，累計新增 3 個）；controller 續作完成後已全數重跑。
3. 額外執行 `test-user-flyers.ts`、`test-flyers-valuation-support.ts`、`test-visa-combinations.ts`，皆成功結束。
4. `npm run build` 通過，包括 PDF.js assets、前端及伺服器 bundle；Vite 仍提示大型 chunk，本輪沒有進行 bundle 最佳化。
5. 以 TypeScript AST printer 忽略註解與程式格式差異後，比對 504 個搬移函式本體／變數初始化式，全部與基準一致。子元件拆分後，圖紙的 2,132 個與 Calculator 的 1,302 個 JSX 標籤／文字片段維持一致，32／35 個 state 初始化式順序一致；API handler 本體一致。
6. `git diff --check` 通過。
7. Playwright Chromium 比對基準 commit 與重構版本，1440px 桌機、390px 手機各 7 個場景，共 14 組文字與截圖 PNG hash 完全一致，且沒有未捕捉的頁面錯誤。場景包括預設租屋表單、結構化條件、進階明細、修改購屋現金、選檔分析、租賃分享報告及買賣分享報告；另驗證租／買切換後保留表單模式。詳見 `refactor-visual-checks-2026-09-12.json`。

新增 `test:refactor-contracts` 使用從基準 commit 的原函式擷取的 11 組圖紙與 20 組 Calculator 結果，保存於 `scripts/fixtures/refactor-baseline.json`，比對完整費用項目、提示、診斷及數值。另驗證標題備援、審核閘門、明示零值、需求組裝、HTTP 契約、圖軸重疊及瀏覽器工具邊界。

新增 `test:listing-upload` 以受控 PDF.js provider 與瀏覽器 API 替身執行實際上傳／預覽模組，涵蓋 PDF＋JPEG 順序、3 MB 超限保圖、文字層排序、空白／逾時／載入失敗備援、render cancel、PDF destroy、CMap、圖片縮放及原檔回退。

沒有呼叫正式 OCR 或外部付費服務。瀏覽器比對固定時鐘、mock API，並一致阻擋外部資源；因此像素一致的結論限於上述受控場景，不代表已驗證正式外部服務可用性或所有裝置。

## Controller 職責拆分（續作）

| Controller | 拆分前行數 | 本次整理後行數 |
| --- | ---: | ---: |
| `useListingHealthCheckController.tsx` | 521 | 274 |
| `useCalculatorController.tsx` | 780 | 357 |

新增 13 個支援模組，兩個 controller 改為組合以下職責；前述 27 個 lib 模組與 15 個呈現元件維持原狀。

| 路徑（相對於 `src/hooks/`） | 責任 |
| --- | --- |
| `useListingState.ts`、`useCalculatorState.ts` | 原 state 初始值、setter 與 input ref |
| `useSharedListing.ts` | 分享 ID 讀取、取消旗標與 effect cleanup |
| `useListingPreview.ts` | 選檔、拖放、PDF 預覽、Esc 與 object URL 清理 |
| `createListingAnalysisActions.ts` | 編碼、大小檢查、分析請求與狀態回寫 |
| `createListingLocationActions.ts` | 定位、治安備援及通勤 |
| `createListingShareActions.tsx` | 分享連結、剪貼簿及延遲載入 PDF 匯出 |
| `createCalculatorFormActions.ts` | 組合表單操作、建立原 criteria |
| `createCalculatorCriteriaSync.ts` | AI 回填與推薦套用 |
| `createCalculatorModifierActions.ts` | 設備、面積、屋齡、樓層的條件互斥與同步 |
| `createCalculatorLocationActions.ts` | 地區、線路、車站及生活圈檢查 |
| `createRentAnalysisActions.ts` | 自然語言／結構化請求及本地推薦 fallback |
| `calculatorFormContext.ts` | 明列表單流程使用的 state 與原 Props 型別 |

各 action factory 每次 render 取得當次 state 快照，不新增 ref 鎖、取消策略、memoization 或 store。Context 透過 `Pick` 明列依賴；state 型別由原 state hook 推導，沒有增加正式程式的 `any`。原有 `any` 留待獨立型別整理。

本次額外驗證：

- 161 個原函式本體／變數初始化式經 AST 比對完全一致；32／35 個 state 與 input ref 呼叫順序、原 effect 本體及依賴保持一致。
- 兩個 controller 的公開 model 欄位完全一致，TypeScript 型別可雙向賦值。
- 新增 `npm run test:controller-flows`：在 Chromium 中使用真實 React render／act，控制外部 provider 回應時機，比對 33 個 state／請求／事件檢查點。基準來自本次拆分前的 controller 原檔，保存其 SHA-256 於 `scripts/fixtures/controller-flows-baseline.json`。
- 覆蓋切檔／移除、PDF 預覽 fallback、Esc、loading 防重複、超限／編碼失敗、JSON 錯誤、定位失敗後原地址治安查詢、通勤、分享 ID cleanup、剪貼簿、PDF 成功／失敗、表單互斥、AI 回填及兩種分析交錯完成。
- `npx tsc --noEmit`、21 個登錄測試、`npm run build` 與 `git diff --check` 全數通過。build 仍有原本的大型 chunk 提示。

前述 14 組像素比對是前一輪 UI 拆分的驗證紀錄。本次沒有更動呈現元件，也沒有重跑那些截圖；本次新增的是上述 33 個流程檢查點。

瀏覽器測試需安裝 Playwright Chromium；可用 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` 指定既有執行檔。測試 helper 僅進入測試 bundle，正式入口沒有引用它。外部 API、PDF provider 及上傳編碼由測試控制；實際編碼／PDF.js 備援另由 `test:listing-upload` 覆蓋。

### 分類整理時確認的非同步行為（歷史紀錄）

1. 先選 A.pdf 再選 B.pdf，若 A 最後完成，A 的預覽會覆蓋 B；移除檔案後，未完成的預覽仍可能寫回。
2. 分析 A.png 期間切換 B.png，A 的分析結果仍可寫回，並繼續定位／治安請求。
3. 自然語言與結構化分析使用各自的 loading，兩者可以同時進行，共用結果採實際回應完成順序寫入。

以上由拆分前程式重現，並非分類整理新增。前兩項已依使用者後續要求修正，見下節；第三項計算器兩種分析交錯完成的行為不在此次檔案競態修正範圍。

## 檔案切換／移除的競態修正

使用者確認修正後，新增 `useListingRequests.ts`，以同一圖紙的世代與各流程 token 判斷回應是否仍有效。切檔、移除與 unmount 使舊世代失效；重新分析使舊報告及其下游查詢失效，但保留目前檔案的預覽工作。位置查詢重試也會使舊定位及其下游治安／通勤工作失效。

- 編碼、API JSON 解析及 PDF 產生等非同步步驟完成後，先檢查 token。過期流程不能回寫結果、錯誤或 loading，也不能啟動後續定位／治安請求。
- 切檔或移除即清除舊報告、錯誤、分享連結與各流程 loading；新檔可立即開始分析。舊請求的 finally 不會關掉新請求的讀取狀態。
- PDF 的早期長寬比 callback、最終圖片 URL，以及圖片 onload 都受檔案 token 保護；過期 PDF 產生的 blob URL 立即釋放。
- 分享與 PDF 匯出同樣不能將旧報告的連結／錯誤寫回新檔，過期 PDF 不會觸發下載。剪貼簿完成與延遲提示也會檢查有效性。
- 分析、通勤、分享與 PDF 以同步 pending 記錄防止同一 render 內重複提交。

這是回應有效性控制，不改動已送出請求的 HTTP 契約，也不假設能取消伺服器端已開始的工作。計算公式、payload、headers、快取、有效定位失敗時的治安 fallback 與現有 UI 樣式維持原樣。

`test:controller-flows` 保留歷史 fixture 不覆寫：未受影響的流程繼續比對原有結果，已修正的競態改用明確的新行為斷言。另新增 `scripts/helpers/listing-race-cases.ts`，以真實 React 與受控 provider 驗證 36 個競態案例，包括編碼／分析／定位／治安／通勤的成功與失敗，在切檔、移除與 unmount 後完成，以及重試、分享 ID 切換、預覽資源釋放和過期分享／PDF 匯出。

## 後續獨立工作

既有圓角、字型與圖示差異尚未處理。後續已完成表單／價格因子、租買指南、PDF 報告及 `requirementVerdict.ts` 的進一步拆分，並補強相關型別；詳見 [領域與 UI 整理紀錄](refactor-domain-ui-2026-09-12.md)。完整 strict 尚未啟用，目前已開啟其中三項可通過的檢查。
