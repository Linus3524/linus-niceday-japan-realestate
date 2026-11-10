# 找房問卷與客戶需求後台

- 共用入口：`https://linusniceday.com/find-home`，先選租房或買房。
- 直接租房：`https://linusniceday.com/find-home?type=rent`；直接買房：`https://linusniceday.com/find-home?type=buy`。
- 分享時加來源，例如買房 IG 連結 `https://linusniceday.com/find-home?type=buy&from=instagram`。兩邊草稿分開保留。
- 後台：`https://linusniceday.com/#admin/leads`（上方切換「網站統計／客戶需求」）
- 企劃書：https://claude.ai/artifact/4pQTr3EH76npM6uZeZzjrc

## 個資規則（2026-11-10 定案）

- 只收稱呼（綽號可）＋一種聯絡方式（LINE／WeChat／Email）＋找房需求。不收真名、電話、證件、收入。
- **聯絡上就刪聯絡方式**：個案頁按「已聯絡上，刪除聯絡方式」。送出滿 30 天沒聯絡上，每天的排程也會自動刪除。
- 稱呼與需求保留；之後在 LINE 對話裡用參考碼（FH-XXXX）對應。
- 通知信、CSV 匯出、伺服器日誌都不含聯絡方式。
- 隱私權政策（`#privacy`「找房需求問卷」段）以 Linus 個人名義負責。條文改了要同步改 `src/lib/findHome/schema.ts` 的 `PRIVACY_POLICY_VERSION`。
- 客人要求刪除全部資料：個案頁最下方輸入參考碼後刪除。

## 每天怎麼用

1. 收到通知信（只有參考碼和連結）→ 點連結進後台。
2. 用個案頁上的聯絡方式聯絡客人 → 聯絡上就按「已聯絡上」。
3. 改狀態、標市場可行性、設下次追蹤日。條件變了就按「修改需求」，系統會自動記下前後差異。
4. 列表上方的「今天要追蹤」「還沒聯絡上」「通知未寄出」用來每天掃一遍。

買房與租房在後台有各自的標記及篩選；同一個人可以同時保留兩筆不同類型的需求，不會互相覆蓋。買房預算是購屋總價，並記錄是否含購屋費用。

個案頁的「複製需求」和通知信中間那段，都可以直接貼到 LINE 跟客人確認條件。

**和費用試算互通**
- 個案頁「用這些條件開費用試算」：用客人的條件開新分頁的費用試算（地區只帶入認得出的行政區、路線、車站），確認後按分析看行情。
- 客人在費用試算看完結果，按「帶著這些條件填找房需求」，問卷會自動帶入地區、預算、格局、設備、簽證，來源記為「費用試算」。
- 兩邊的簽證清單共用 `src/lib/visaOptions.ts`；條件轉換在 `src/lib/findHome/calculatorBridge.ts`。

急迫／準備／彈性是系統依問卷給的提醒，不是成交機率，可以直接點選修改；A–D 標籤由你自己標。

## 架構

| 部分 | 檔案 |
|---|---|
| 問卷頁（獨立入口，單獨打包） | `find-home.html`、`src/findHome/` |
| 欄位、選項、驗證（前後端共用） | `src/lib/findHome/schema.ts` |
| 狀態、維度規則、變更比對 | `src/lib/findHome/lead.ts` |
| 儲存（Upstash；本機沒設定 `LEADS_REDIS_*` 時用記憶體，不會寫到正式資料庫） | `src/lib/leadStore.ts` |
| 通知信（Resend） | `src/lib/leadNotify.ts` |
| 送出 API（公開） | `api/find-home.ts` |
| 後台 API（`x-admin-token`） | `api/leads.ts` |
| 後台畫面（延遲載入） | `src/components/admin/AdminShell.tsx`、`LeadsAdmin.tsx` |
| 入口卡 | `src/components/FindHomeCta.tsx`（聯絡頁）、`ListingContactCta.tsx`（圖紙分析） |
| 測試 | `npm run test:find-home`、`npm run test:buy-find-home`、`npm run test:find-home-browser` |

防灌水：honeypot、8 秒內送出視為機器人、每 IP 每小時 5 次、全站每小時 60 次（限流用統計那個 Redis）。
同一次填寫重送不會產生兩筆；同一聯絡方式 30 天內再填會併入同一筆並記下變更。

## 環境變數（Vercel → Settings → Environment Variables）

目前設定：**只需要另外加 `RESEND_API_KEY` 與 `LEADS_NOTIFY_TO`**，其他都沿用既有設定。

| 變數 | 用途 | 沒設定時 |
|---|---|---|
| `RESEND_API_KEY`／`LEADS_NOTIFY_TO` | 新客通知信；收件人必須是註冊 Resend 的信箱 | 不寄信，後台顯示「通知未寄出」 |
| `LEADS_REDIS_REST_URL`／`LEADS_REDIS_REST_TOKEN`（選填） | 客戶資料庫 | 線上沿用統計的 `UPSTASH_REDIS_REST_*`（Upstash 免費版只能有一個資料庫；鍵名 `lead:` 與統計的 `linus:` 不衝突）。升級後想分開，只要設這兩個 |
| `LEADS_ADMIN_TOKEN`（選填） | 後台「客戶需求」密碼 | 沿用統計後台的 `ANALYTICS_TOKEN`，同一組密碼 |
| `CRON_SECRET`（選填） | 每日刪除過期聯絡方式的排程驗證 | 只接受 Vercel Cron 的請求，且每小時最多執行一次 |

改完環境變數要 Redeploy 才生效。

本機開發：`.env.local` 不要設 `LEADS_REDIS_*`，本機會用記憶體（重開伺服器資料就消失），不會沿用統計資料庫，測試資料不會寫進正式站。本機需要 `LEADS_ADMIN_TOKEN` 才進得了客戶需求後台。

## 買房問卷

依官網原本的 7 題複製問卷整理，另保留性別、年齡層與簽證種類：

1. 個人資訊與購屋計畫：性別、年齡、居住地、簽證、現金／貸款、貸款準備進度、自有資金（選填）、實地／線上看房、來日時程、購買時間。
2. 購屋預算與物件條件：理想／最高總價、是否含費用、自住／投資、物件類型、地區／站距、屋齡、大小、樓層等要求。
3. 看房進度：找到物件時的打算、找不到時怎麼調整、其他仲介與補充需求。
4. 聯絡方式與隱私同意。

買房的簽證選項為「日本籍、工作簽證、永住、經營管理簽證、留學簽證、其他」。沒有日本簽證可選「其他」並註明，不要求先有租屋簽證或確定的入境日期。看房時間與目標購買時間分開保存；不蒐集收入或金融帳戶資料。

買房資料有獨立欄位與通知文字，不會當成租金條件送進租屋分析。後台可編輯買房需求、複製內容、查看變更、匯出買房欄位；原有聯絡方式刪除與 30 天保留規則相同。
