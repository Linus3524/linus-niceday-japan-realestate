---
name: update-crime-data
description: 更新治安資料（東京町丁目級、其餘道府縣市區町村級、都道府縣級備援）。每年 4～5 月主更新、9 月補跑晚公布的縣；也用於接入新的縣或修某縣解析壞掉。當使用者說「更新治安資料」「治安資料換新年度」「把某縣治安接進來」時使用。
---

# 更新治安資料

完整手冊在 [docs/MUNICIPAL_CRIME_UPDATE.md](../../../docs/MUNICIPAL_CRIME_UPDATE.md)，這裡只列操作順序。做之前先把手冊讀一遍，特別是「隔年更新時最常壞的地方」與各縣索引頁。

## 三條線各自更新

| 線 | 腳本 | 來源 |
| --- | --- | --- |
| 東京町丁目級 | `npm run data:update:tokyo-crime` | 警視庁開放資料 |
| 市區町村級（40 縣） | `/opt/homebrew/anaconda3/bin/python3 scripts/update-municipal-crime-counts.py /tmp/municipal-crime` | 各縣警官方表 |
| 都道府縣級備援 | `npm run data:update:crime` | e-Stat |

市區町村級要用 anaconda 的 python3，pdfplumber 只裝在那裡。

## 年度主更新（4～5 月）

1. 先確認新年度確定値已公布：隨機開三個縣的索引頁看有沒有「令和 N 年 確定値」。
2. 腳本裡把預設年度、`SOURCE_YEARS`、`populationYear` 換成新年度；`SOURCES` 逐縣換成新附件 URL（ID 每年都變，從手冊的索引頁找）。
3. 跑腳本。腳本會自己擋四件事：筆數 ≠ `EXPECTED_AREAS`、市區町村重複、六大分類加總 ≠ 總數、縣總數變動 > 40%。擋下來就是解析壞了，去修解析器，不要加 `--allow-drift` 硬推。
4. 手動核對腳本做不到的一項：每縣「市區町村加總 ＝ 縣警公布縣總數 −発生地不明」。
5. `npm run test:municipal-crime`、`npm run lint`，看 `git diff --stat` 增減合理再 commit。
6. 用一張東京以外的圖紙跑一次完整分析，確認治安卡出現市區町村口徑、年度標示正確。

## 9 月補跑

`--only=愛知県,和歌山県,群馬県,大分県` 只重跑晚公布的縣，其餘沿用既有快照。愛知網站有 Incapsula，curl 會 403：用瀏覽器開一次該站取得 `incap_ses_*` cookie 帶進 curl，或手動下載後放到快取目錄（檔名 `23-<年度>.pdf`）。

## 接入新的縣

照手冊「加一個新縣的步驟」：看表格形狀 → 挑現成解析器 → `--only=該縣` 跑 → 三項核對 → 補 `EXPECTED_AREAS` 與手冊索引頁。未接入的 6 縣與原因在手冊末段，先看那裡確認來源有沒有變。

## 不要做的事

- 不要用「刊登租金 ÷ 成交價」之類跨來源的東西去補治安資料，這裡只收縣警官方表。
- 不要把警察署別的數字當市町村用（警察署管區跨市町村）。
- 不要為了讓筆數對上而把政令市本身和它的區同時收進去，也不要收郡的小計。
