---
name: add-threads-post
description: 把 Linus 的 Threads 貼文網址（含 /share/ 短連結）收錄進網站精選文章。解析永久網址、歸類、設定搜尋關鍵字與同義詞、同步全文索引與封面圖，並跑回歸測試。當使用者貼出 threads.com 網址並要求「補到網站」「加到某分類」「設定關鍵字」時使用。
---

# 收錄 Threads 貼文到網站精選文章

## 這件事影響哪些地方

`src/data/featuredThreads.ts` 是**唯一來源**，以下四處全部共用，改一次即全站生效：

| 位置 | 進入點 | 用途 |
| --- | --- | --- |
| 精選文章頁／首頁輪播 | `ThreadsCarousel.tsx` → `searchThreads(context: "all")` | 分類瀏覽與站內搜尋 |
| 租屋指南搜尋 | `RentGuideTab.tsx` → `searchThreads(context: "rent")` | 搜尋結果下方最多 3 篇 |
| 買房置產搜尋 | `BuyGuideTab.tsx` → `searchThreads(context: "buy")` | 同上 |
| AI 顧問 | `api/chat.ts` → `recommendThreadsForAnswer()` | 高相關度時最多 2 篇 |

**不會自動連動 Threads。** 全文索引 `threadsSearchIndex.ts` 與封面圖都是**靜態快照**，
Linus 在 Threads 發新文或編輯舊文，網站不會自己更新，必須跑本流程。

---

## 執行步驟

### 1. 解析永久網址

`/share/XXXX/` 短連結是 JS 渲染的，`curl` 抓不到，**必須**用 Playwright 解析。
在專案根目錄建立暫存腳本（放 `tmp/`，已在 `.gitignore`；不可放 `/tmp`，會找不到 playwright 套件）：

```ts
// tmp/resolve-share.ts
import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const page = await browser.newContext({ locale: "zh-TW" }).then(c => c.newPage());
await page.goto("<分享網址>", { waitUntil: "networkidle", timeout: 40000 });
await page.waitForTimeout(2500);
console.log(await page.evaluate(() => document.querySelector('link[rel="canonical"]')?.href));
await browser.close();
```

取 `canonical`，並**移除 `?xmt=` 等追蹤參數**（檔頭註解明定只保留永久連結）。
同時讀取貼文全文，作為歸類與關鍵字的依據。

### 2. 決定分類

依貼文主旨放進既有分類，順序接在該分類末尾。現有分類：
日本租屋買房生活知識系列、日本賃貸完全解析、文化迷思、仲介趣事、租屋提醒、租屋行情、
東京寶藏地、租屋文化、租屋審查、打工度假、日本買房。

注意 `isContextMatch()` 的規則：`日本買房` 只出現在買房情境；
`日本租屋買房生活知識系列` 兩邊都會出現；其餘皆視為租屋。**分類直接決定曝光面**。

### 3. 設定關鍵字

```ts
{
  url: "https://www.threads.com/@linus3524/post/XXXX",
  keywords: ["分類名", "日文原詞", "台灣慣用語", "具體情境詞"],
},
```

關鍵字命中得 28 分（標題 42、開頭 20、內文 15），是**人工加權**，用來補內文沒明講的搜法。

**⚠️ 必檢查關鍵字是否誤踩其他主題的同義詞群組。**
實例：`續約條件` 裡的「續約」屬於 `更新料` 群組，會讓一篇立ち退き個案文
搶走「更新租約要付多少錢」的排名。改用 `契約條件變更` 才正確。
下手前先在 `src/lib/search.ts` 搜一遍該詞是否已屬別的群組。

### 4. 補同義詞（視需要）

貼文若出現站內還沒有的專有名詞，在 `src/lib/search.ts` 的 `SYNONYM_GROUPS` 補一組，
讓使用者用中文也搜得到日文制度用語。遵守 `docs/SEARCH.md` 原則：
只放「講的是同一件事」的詞，不要加「費用」「日本」這類過於通用的詞。

### 5. 同步索引與封面圖

```bash
npm run threads:sync
```

- 文字索引**有快取**，只抓新貼文；要重抓全部才加 `--force`。
- 圖片**沒有快取**，每次都重抓全部並用 `sips` 重新壓縮，
  因此 `git status` 常會出現**不相干貼文的 .jpg 被改動**。這屬正常，
  但要主動告知使用者哪些檔案被動到，讓他決定是否一併提交。

### 6. 驗證

```bash
npm run test:threads-search   # 相關度回歸（⚠️ 未納入 CI，本地必跑）
npm run lint
npm run build
```

再實測新貼文的關鍵字搜不搜得到、既有主題有沒有被洗掉：

```ts
// tmp/verify.ts
import { searchThreads, recommendThreadsForAnswer } from "../src/lib/threadSearch";
for (const q of ["新關鍵字A", "新關鍵字B"]) console.log(q, searchThreads(q, { context: "rent", limit: 3 }).results.map(r => `${r.id}(${r.score})`));
```

### 7. 收尾

- 刪除 `tmp/` 暫存腳本。
- 在 `docs/CONTENT_CHANGELOG.md` 補一筆（日期、貼文 ID、分類、同義詞異動、資料性質）。
- **不要自行 commit／push**，除非使用者明講。

---

## 相關度排序：測試失敗代表真的有問題

`npm run test:threads-search` 鎖定了多組人工確認過的排序。
新貼文害它失敗時，**先查是不是新文搶走了別人的主題**，不要為了讓測試過而放寬斷言。

已知的評分陷阱（2026-09-12 已修）：`occurrenceCount()` 把**不同同義詞**的次數加總，
所以一篇順帶提到「續約」「續租」「再契約」各一次的文章，
分數會贏過真正把「更新料」寫了 7 次的解說專文。
現在靠 `maxSingleAliasOccurrences()` 在標題／關鍵字／開頭都沒命中時補 22 分修正。
**調整評分權重前，務必先寫腳本掃過全部貼文**，確認影響範圍只限目標文章——
過寬的調整會翻動「退房 原狀回復」「看得到租不到」等既有排序。

## 資料性質

Threads 貼文是**仲介實務經驗與個案分享，不是官方法令解釋**。
依 `docs/CONTENT_UPDATE_GUIDE.md` 的治理原則，changelog 要註明此性質，
不可在站內文案把個案條件寫成通則。
