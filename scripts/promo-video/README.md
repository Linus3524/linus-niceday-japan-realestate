# 網站介紹影片（直式 Reels 版）

產出一支 **1080×1920、30fps、約 48 秒** 的網站介紹影片，可直接上 IG Reels／限時動態／YouTube Shorts。
畫面全部是網站本身的截圖與 `public/` 裡的品牌素材，風格沿用網站：品牌綠、明體標題、Jost 英文小標、方格底紋、直角框線。

## 流程

```
capture.py  →  shots/*.png        從正式站截圖（電腦版 1920×1080、手機版 390×844 @2x）
storyboard.html                   動畫分鏡：每一格的畫面由 render(t) 依秒數決定
render.py   →  frames/*.jpg       用無頭瀏覽器逐格呼叫 render(t) 並截圖
encode.swift → *.mp4              用 macOS 內建 AVFoundation 合成 H.264 MP4（不需要 ffmpeg）
```

## 需要的環境

- Python 3.10 以上，並安裝 Playwright：`pip install playwright && playwright install chromium`
- macOS（`encode.swift` 用系統內建的 AVFoundation；`swiftc` 隨 Xcode Command Line Tools 附帶）

## 步驟

```bash
cd scripts/promo-video

# 1. 從正式站截圖（約 2～3 分鐘）
python capture.py

# 2. 先輸出幾個關鍵秒數的預覽圖到 preview/，確認版面
python render.py preview 1.6,7.2,13,20,25,31,38,46

# 3. 輸出整支影片的所有影格到 frames/（48 秒 × 30fps = 1440 格，約 3～5 分鐘）
python render.py full 48

# 4. 合成 MP4
swiftc -O encode.swift -o encode
./encode frames linus-niceday-intro.mp4
```

`render.py` 會自己從專案根目錄啟動一個本機伺服器（127.0.0.1:8765），因為 logo 遮罩圖不能用 `file://` 載入。

輸出的 `shots/`、`frames/`、`preview/`、編譯好的 `encode` 與 `*.mp4` 都在 `.gitignore` 裡，不進版控。

### 傳到手機或社群的壓縮版

完整畫質（12 Mbps）約 50MB。要傳 LINE、或檔案上限 30MB 的地方，把 `encode.swift` 裡的
`AVVideoAverageBitRateKey: 12_000_000` 改成 `4_400_000` 另外編一次，約 23MB。

## 分鏡（storyboard.html）

| 時間 | 場景 | 主要字幕 |
|---|---|---|
| 0–4.6s | 開場（綠底） | 在日本找房、買房，先看懂再出發 |
| 4.6–9.4s | 我是誰 | 台灣人仲介 Linus 帶你看懂日本的房子 |
| 9.4–16.2s | 電腦版首頁 | 一頁式場景首頁（四季場景輪播） |
| 16.2–22.8s | 租屋・買房知識 | 章節左右翻頁 |
| 22.8–34.4s | 免費工具 | 圖紙分析／預算試算／AI 顧問／居住人格診斷 |
| 34.4–41.4s | 手機版 | 手機版，滑著看 |
| 41.4–48s | 收尾（綠底） | 日本的生活，從住好日開始＋聯絡方式 |

### 怎麼改

- **改字**：直接改 `storyboard.html` 裡的文字。每個 `data-a` 是進場動畫（`up` 逐行浮出、`rise` 浮上、`pop` 彈出、`char` 角色跳出、`line` 線條延伸、`fade` 淡入），`data-d` 是在該場景開始後第幾秒出現。
- **改時長**：調整每個 `<section class="scene">` 的 `data-start`／`data-end`，並同步修改 `TOTAL` 與 `render.py full` 的秒數。
- **換截圖**：電腦框、手機框裡的 `<img data-t0="…">` 是在場景開始後第幾秒切換到那張；`data-zoom`／`data-origin` 可以把鏡頭推近到截圖中有內容的區塊。
- **轉場**：場景交界的綠色掃場在 `render()` 最後，前後各 0.35 秒。

## 注意

- 影片沒有配樂。上傳時用 IG／Threads 內建音樂庫，授權由平台處理。
- 截圖會帶到截圖當下的時鐘與日期；網站改版後重跑一次 `capture.py` 即可更新畫面。
