# 市區町村級治安資料：更新手冊

建置日期：2026-09-14  
腳本：`scripts/update-municipal-crime-counts.py`　輸出：`src/data/municipalCrimeCounts.json`  
測試：`npm run test:municipal-crime`

東京都另走町丁目級（`scripts/update-tokyo-crime-data.ts`），本手冊只講東京以外的 46 道府縣。

## 三層架構（不要改）

| 層 | 資料 | 誰用 |
| --- | --- | --- |
| 町丁目級 | 警視庁開放資料 | 東京都 |
| 市區町村級 | 各縣警「市區町村別刑法犯認知件數」＋ e-Stat 住民基本台帳人口 | 本手冊，40 縣 |
| 都道府縣級 | 総務省社会生活統計指標 | 沒接入的縣、地址對不到市區町村時的備援 |

市區町村級再分兩種口徑：**有六大分類**（凶悪・粗暴・窃盗・知能・風俗・その他）的縣，六大分類卡用市區町村；**只有總數**的縣，左卡用市區町村、六大分類退回縣級並標示範圍。哪一縣是哪一種見腳本裡各縣的註解。

## 什麼時候更新

| 時間 | 做什麼 |
| --- | --- |
| **每年 4～5 月** | 主更新。多數縣警在 2 月初公布前一年「確定値」，4 月時幾乎都齊了。 |
| **每年 9 月** | 補跑晚公布的縣：愛知（犯罪統計書，通常夏天）、和歌山（市町村別犯罪率表）、群馬、大分。 |
| 隨時 | 使用者反映某縣資料怪，或 6 個未接入縣的來源有變化。 |

人口用 e-Stat 儀表板 API 的最新年度，腳本自動抓；`populationYear` 目前寫死 2025，隔年要改。

## 怎麼跑

```bash
# 需要 pdfplumber（本機只裝在 anaconda 的 python3）
/opt/homebrew/anaconda3/bin/python3 scripts/update-municipal-crime-counts.py /tmp/municipal-crime

# 只重跑幾個縣，其餘沿用既有快照（逐縣補資料時用）
... --only=愛知県,和歌山県

# 忽略快取重新下載；某縣總數變動超過 40% 但確認是真的時放行
... --refresh --allow-drift
```

快取檔名帶資料年度（`23-2024.pdf`），隔年更新時要先改 `SOURCE_YEARS`／預設年度，否則會拿去年的快取。

跑完做三件事：`npm run test:municipal-crime`、`npm run lint`、看 `git diff --stat src/data/municipalCrimeCounts.json` 的增減是否合理，再 commit。

## 腳本自帶的驗證（對不上就不寫檔）

1. 每縣市區町村筆數 ＝ `EXPECTED_AREAS`（政令市算區不算市、郡只算町村）。市町村合併時才需要改這張表。
2. 市區町村名不重複。
3. 有六大分類的縣：六大分類加總 ＝ 總數，逐一市區町村檢查。
4. 每縣年度總數相對上一版快照變動不超過 40%。

另外要手動核對一項腳本做不到的：**市區町村加總 ＝ 縣警公布的縣總數 −「発生地不明」**。每縣的 PDF 都有這兩個數字，對不上就是漏列或多收了小計列。

## 隔年更新時最常壞的地方

| 症狀 | 原因 | 處理 |
| --- | --- | --- |
| 下載 404 | 附件 URL 每年換（`attachment/692417.pdf` 這種 ID 是流水號） | 回到 `SOURCE_PAGES` 列的索引頁找新連結，更新 `SOURCES` |
| 愛知下載 403 | 縣網站有 Incapsula 擋爬蟲 | 用瀏覽器開一次該站，把 `incap_ses_*` cookie 帶進 curl，或手動下載後放進快取目錄 |
| 筆數少一截 | 表格換版：多了一頁、欄位順序變、政令市改用「うち○○区」寫法 | 用 `pdfplumber` 印出 `extract_tables()` 前幾列，對照該縣解析器的欄位索引 |
| 六大分類加總 ≠ 總數 | 認知／検挙成對的表其中一格空白，被讀成另一格 | 改用 `parse_by_reference_row`（座標對欄），宮城、秋田就是這樣修的 |
| 某町對不到人口 | 市町村改名或合併 | 加到 `NAME_ALIASES`（例：篠山市→丹波篠山市） |

## 各縣來源索引頁

附件 URL 會變，索引頁很少變。找不到檔案時從這裡進。

| 縣 | 索引頁 | 檔案名稱關鍵字 |
| --- | --- | --- |
| 北海道 | police.pref.hokkaido.lg.jp/statis/hanzai/shityouson-betu/ | 市町村別 |
| 青森 | police.pref.aomori.jp/keijibu/soubun/toukei_siryo/ | C4-2 |
| 宮城 | police.pref.miyagi.jp/sousashien/ | 刑法犯確定値 |
| 秋田 | police.pref.akita.lg.jp/kenkei/statistics/crime-past/ | HP02＿刑法・罪種・市町村 |
| 山形 | pref.yamagata.jp/documents/5698/ | hp_r0X |
| 福島 | police.pref.fukushima.jp/07.anzen/-hanzaitoukei/ | rXkakuteichi |
| 茨城 | pref.ibaraki.jp/kenkei/a01_safety/statistics/ | number-of-reported-crimes |
| 栃木 | pref.tochigi.lg.jp/keisatu/n18/anzenanshin/ | 市町村別 |
| 埼玉 | police.pref.saitama.lg.jp/c0011/keihouhan.html | keihoukansityouson |
| 千葉 | police.pref.chiba.jp/seisoka/ | 市区町村別 |
| 神奈川 | police.pref.kanagawa.jp/tokei/hanzai_tokei/mesc0030.html | 罪名別市区町村別 |
| 新潟 | pref.niigata.lg.jp/site/kenkei/anzen-ansin-shityousonXX.html | 市町村別犯罪発生状況 |
| 富山 | police.pref.toyama.jp/6108/toukei/hanzaijousei/ | 市町村別犯罪発生状況（網頁表格） |
| 石川 | www2.police.pref.ishikawa.lg.jp/information/information05/ | 刑法犯罪種別・市町別 |
| 福井 | pref.fukui.lg.jp/kenkei/doc/kenkei/naka9naka300.html | RX_5_toukei_opendate.csv |
| 山梨 | pref.yamanashi.jp/police/p_keiki/p_keiki/indextoukei.html | 概況・その3 |
| 長野 | pref.nagano.lg.jp/police/toukei/ | 市町村別刑法犯認知件数一覧表 |
| 岐阜 | pref.gifu.lg.jp/site/police/7840.html | 市町村別刑法犯包括罪種別 |
| 静岡 | pref.shizuoka.jp/police/kurashi/hanzai/nenkan/shikumachibetsu.html | zyoukyouhyou |
| 愛知 | pref.aichi.jp/police/anzen/hassei/keiji-s/kenkyo.html | 犯罪統計書（第 49～52 頁） |
| 三重 | police.pref.mie.jp/stat/haizai_tokei.html | 認知・検挙状況（別添資料３） |
| 滋賀 | pref.shiga.lg.jp/ippan/kurashi/bouhankoutsu/300733.html | 市町別の刑法犯認知件数 |
| 京都 | pref.kyoto.jp/fukei/anzen/toke/tokei.html | 市区町村別認知件数 |
| 大阪 | police.pref.osaka.lg.jp/seikatsu/hanzai/（令和X年中の犯罪統計） | hanzaitokei09（Excel） |
| 兵庫 | police.pref.hyogo.lg.jp/seikatu/gaitou/statis/ | R0X.pdf |
| 奈良 | police.pref.nara.jp/0000000452.html | RX.pdf |
| 和歌山 | police.pref.wakayama.lg.jp/04_toukei/ | hanzairitsu |
| 鳥取 | pref.tottori.lg.jp/127652.htm | RX_toukei（第 5 頁） |
| 島根 | pref.shimane.lg.jp/police/01_safety_of_life/incident_statistics/ | R0XK_02 |
| 岡山 | pref.okayama.jp/page/958558.html | 包括罪種別 市区町村別 |
| 広島 | pref.hiroshima.lg.jp/site/police/020-toukei-index.html | 犯罪統計書（第 101 頁） |
| 山口 | pref.yamaguchi.lg.jp/site/police/135326.html | 市町別 刑法犯 |
| 香川 | pref.kagawa.lg.jp/police/kskocho/kenkei/toukei/kfvn.html | 数字でみるさぬきの安全（第 52 頁） |
| 高知 | police.pref.kochi.lg.jp/docs/2023111300409/ | 刑法犯の概況（第 3 頁） |
| 福岡 | police.pref.fukuoka.jp/keiji/keiso/004.html | RXkakuteiCIty |
| 佐賀 | police.pref.saga.jp/tokeijoho/_2708.html | 市町別 刑法犯認知件数 |
| 長崎 | police.pref.nagasaki.jp/police/kurashi/kurashi-tokei/hanzai-tokei/ | 犯罪統計（確定値，第 3 頁） |
| 熊本 | pref.kumamoto.jp/site/police/list19-74.html | 市町村別主な犯罪の認知件数 |
| 宮崎 | pref.miyazaki.lg.jp/police/hanzaitokei/ | 市町村別犯罪率 |
| 鹿児島 | pref.kagoshima.jp/ja07/police/toukei/hanzai/ | 市町村別の犯罪発生実態 |

## 未接入的 6 縣

| 縣 | 原因 | 再檢查時看什麼 |
| --- | --- | --- |
| 岩手 | 只有縣總數與罪種別；市町村只在地圖上 | pref.iwate.jp/kenkei/koho/keihouhan/ 有沒有新增市町村別表 |
| 群馬 | 令和 7 年 12 月末市町村別附件已刪除 | police.pref.gunma.jp/28749.html 是否補上年度版 |
| 徳島 | 市町村別認知件數是 PNG 圖 | 同頁是否改為表格或 PDF |
| 愛媛 | 犯罪統計書字型為 CID 編碼，抽不出文字 | 新年度統計書字型是否正常 |
| 大分 | 犯罪概況的市町村別是無標籤圖表 | 是否另出市町村別表 |
| 沖縄 | 確定値只有縣總數 | 犯罪統計資料頁是否新增市町村別 |

徳島、愛媛、大分要接的話得走 OCR，先評估值不值得。

## 加一個新縣的步驟

1. 找到官方表，用 `pdfplumber` 看 `extract_tables()` 的形狀，挑一個現成解析器：
   - 單欄名稱＋分類欄：`parse_simple_broad`
   - 市在第 1 欄、區／町村在第 2 欄：`parse_city_ward_table`（政令市只收區、郡只收町村）
   - 分類拆成兩張表：`merge_split_groups`；拆成多頁：`merge_group_parts`
   - 表格偵測漏欄、數字被塞空白、認知／検挙成對：`parse_by_reference_row` 或 `parse_grid_pages`
   - Excel：`rows_from_xlsx`；網頁：`rows_from_html`；CSV：照 `parse_fukui`
2. `SOURCES`、`PREFECTURE_CODES`、（非 2025 時）`SOURCE_YEARS` 各加一行。
3. 跑 `--only=該縣`，核對筆數、市區町村加總 ＝ 縣總數 − 不明、分類加總 ＝ 總數。
4. 把筆數加進 `EXPECTED_AREAS`，補上本手冊的索引頁。
