# 找房問卷與客戶需求後台

- 問卷：`https://linusniceday.com/find-home`（分享時加來源，例如 `?from=line`、`?from=instagram`、`?from=threads`）
- 後台：`https://linusniceday.com/#admin/leads`（上方切換「網站統計／客戶需求」）
- 企劃書：https://claude.ai/artifact/4pQTr3EH76npM6uZeZzjrc

## 個資規則（2026-11-10 定案）

- 只收稱呼（綽號可）＋一種聯絡方式（LINE／WeChat／Email／WhatsApp）＋找房需求。不收真名、電話、證件、收入。
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

急迫／準備／彈性是系統依問卷給的提醒，不是成交機率，可以直接點選修改；A–D 標籤由你自己標。

## 架構

| 部分 | 檔案 |
|---|---|
| 問卷頁（獨立入口，單獨打包） | `find-home.html`、`src/findHome/` |
| 欄位、選項、驗證（前後端共用） | `src/lib/findHome/schema.ts` |
| 狀態、維度規則、變更比對 | `src/lib/findHome/lead.ts` |
| 儲存（獨立 Upstash 資料庫；本機沒設定時用記憶體） | `src/lib/leadStore.ts` |
| 通知信（Resend） | `src/lib/leadNotify.ts` |
| 送出 API（公開） | `api/find-home.ts` |
| 後台 API（`x-admin-token`） | `api/leads.ts` |
| 後台畫面（延遲載入） | `src/components/admin/AdminShell.tsx`、`LeadsAdmin.tsx` |
| 入口卡 | `src/components/FindHomeCta.tsx`（聯絡頁）、`ListingContactCta.tsx`（圖紙分析） |
| 測試 | `npm run test:find-home` |

防灌水：honeypot、8 秒內送出視為機器人、每 IP 每小時 5 次、全站每小時 60 次（限流用統計那個 Redis）。
同一次填寫重送不會產生兩筆；同一聯絡方式 30 天內再填會併入同一筆並記下變更。

## 環境變數（Vercel → Settings → Environment Variables）

| 變數 | 用途 | 沒設定會怎樣 |
|---|---|---|
| `LEADS_REDIS_REST_URL`／`LEADS_REDIS_REST_TOKEN` | 客戶資料庫（**另一個** Upstash 資料庫） | 問卷送出回「系統暫時無法收件」，畫面提供複製內容改用 LINE |
| `LEADS_ADMIN_TOKEN` | 後台「客戶需求」密碼（和 `ANALYTICS_TOKEN` 分開） | 客戶需求後台進不去 |
| `RESEND_API_KEY`／`LEADS_NOTIFY_TO` | 新客通知信；收件人必須是註冊 Resend 的信箱 | 不寄信，後台顯示「通知未寄出」 |
| `CRON_SECRET` | 每日刪除過期聯絡方式的排程驗證 | 排程被拒；後台開列表時仍會補做 |

改完環境變數要 Redeploy 才生效。本機開發把同樣的變數放 `.env.local`（`LEADS_REDIS_*` 不設就用記憶體，重開伺服器資料會消失）。
