# 網頁字型策略

## 總覽

| 字型 | 來源 | 檔案／設定 |
| --- | --- | --- |
| Material Symbols Rounded（圖示） | 自架 | `public/fonts/material-symbols-rounded-subset.woff2`（16KB，只含 4 個圖示） |
| Jost（英文標題／標籤） | 自架 | `public/fonts/jost-latin.woff2`（26KB）、`jost-latin-ext.woff2`（17KB） |
| JetBrains Mono（LINE ID／數字） | 自架 | `public/fonts/jetbrains-mono-latin.woff2`（31KB） |
| Noto Sans TC / Noto Sans JP / Noto Serif TC / Noto Serif JP（中日文） | Google Fonts | `index.html` 的 `<link rel="stylesheet">` |

`@font-face` 宣告集中在 `src/index.css` 最上方，載入標籤集中在 `index.html` `<head>`。

## 為什麼這樣分

**圖示字型一定要自架。** 圖示是用 ligature 寫的（`<span>smart_toy</span>`），
字型還沒到，瀏覽器就會把「smart_toy」這幾個英文字**照字面畫在畫面上**。
自架 + `preload` + `font-display: block` 之後不可能再發生。

**英數字型自架很划算。** Jost 與 JetBrains Mono 都是可變字型，
latin 分片只有 20–30KB，preload 之後幾乎都能在首次繪製前就位。

**中日文不要自架。** Google 會把中日文字型切成上百個 unicode-range 分片，
使用者只下載頁面實際出現的那幾百個字。自架的話：整包丟出去是好幾 MB；
靜態 subset 又會漏字（**AI 顧問會輸出任意中文字，漏字會變成 □**），風險太高。

## 中日文思源同系列（Source Han / Noto）整合

為解決中日文字體混排時字重不一致、字形割裂問題，全站繁體中文與日文一律採用同系列的開源思源字型（Google / Adobe 出品）：
- **思源明體系列**：`Noto Serif TC`（繁中）+ `Noto Serif JP`（日文）
- **思源黑體系列**：`Noto Sans TC`（繁中）+ `Noto Sans JP`（日文）

在相同的 `font-weight`（Serif 400-900 / Sans 400-700）下，中日文筆劃粗細、骨架完全一致。
標題（`h1-h6`）與 `.font-serif` 明體容器內的日文標記（`:lang(ja)` / `[lang="ja"]` / `.font-jp-serif`），自動套用 `Noto Serif JP` 原生日文字型，呈現純正 JIS 漢字與明體假名；內文黑體則自動套用 `Noto Sans JP`。

目前請求的字重：

- Noto Serif TC — 400 / 500 / 600 / 700 / 900
- Noto Serif JP — 400 / 500 / 600 / 700 / 900
- Noto Sans TC — 400 / 500 / 700
- Noto Sans JP — 400 / 500 / 700

驗證某個字重有沒有被實際使用，可在瀏覽器 console 執行：

```js
[...new Set([...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight))]
```

## 不要改回 `@import`

字型載入標籤必須留在 `index.html` `<head>`。寫成 `src/index.css` 的 `@import`
會讓瀏覽器**先下載完整支 CSS 才發現字型**，起跑晚一整輪，
使用者就會先看到系統字型再跳字。

## 圖示字型：新增圖示時要重新 subset

字型是 subset 過的，**沒被列進去的圖示不會顯示**。

目前包含：

| 圖示名稱 | 使用位置 |
| --- | --- |
| `calculate` | 租屋指南預算卡片、費用試算頁標題 |
| `key` | 租屋指南前言標題 |
| `real_estate_agent` | 買房置產前言標題 |
| `smart_toy` | AI 顧問頁標題、租屋／買房頁的 AI 導引卡 |

新增步驟：

1. 到 https://fonts.google.com/icons 找到圖示名稱（例如 `home`）。
2. 把**所有**要用的圖示名稱（含既有的）用逗號串起來，取得字型網址：

```bash
curl -s "https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=calculate,key,real_estate_agent,smart_toy&display=block"
```

3. 輸出裡有一行 `src: url(https://fonts.gstatic.com/l/font?kit=...)`，下載它覆蓋原檔：

```bash
curl -sL -o public/fonts/material-symbols-rounded-subset.woff2 "<上一步的 url>"
```

4. 更新上面的圖示表格。

用法：

```jsx
<span className="material-symbols-rounded" aria-hidden="true">home</span>
```

## 英數字型：要換版本或加字重時

Jost 與 JetBrains Mono 的檔案是從 Google 下載的 latin 分片。要更新時：

```bash
curl -s -H "User-Agent: Mozilla/5.0" "https://fonts.googleapis.com/css2?family=Jost:wght@300..700&family=JetBrains+Mono:wght@400;500&display=swap"
```

從輸出中找 `/* latin */` 與 `/* latin-ext */` 區塊的 woff2 網址，下載覆蓋
`public/fonts/` 對應檔案即可（`src/index.css` 的 `unicode-range` 也是從這份輸出抄的）。

## 備註

- 介面上大部分圖示其實是 `lucide-react`（隨 JS 打包，本來就不受網路影響），
  只有上表那幾個是 Material Symbols。
- `.font-jp` 搭配 `lang="ja"` 專門套用日本正式地名、車站與線路；
  一般繁體中文內容不可整段改用日文字體。
- 中日文字型在極慢網路下仍可能先顯示系統字型（字型檔本身就有幾百 KB）。
  若要完全不跳字，只能改用 `font-display: optional`（第一次載不到就整趟都用系統字型），
  那是另一種取捨，目前沒有採用。
