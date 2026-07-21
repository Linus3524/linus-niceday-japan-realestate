# 首圖素材放置區

把「原始高畫質檔」放這裡，網頁用的壓縮版本由這裡產生後輸出到 `public/`。

## 請放入這兩個檔案（檔名請固定）

| 檔名 | 內容 | 要求 |
|---|---|---|
| `hero-bg.png` | 背景圖（東京街景） | 不含人物，橫式 |
| `hero-character.png` | 人物＋柴犬 | **必須去背（透明背景）**，不要含白底 |

也可以是 `.jpg` / `.webp`，但人物圖一定要是支援透明的格式（PNG 或 WebP）。

## 放好之後

由 `cwebp` 轉成 `public/hero-bg.webp` 與 `public/hero-character.webp` 供網頁使用。
原始檔請保留在這裡，之後要調整裁切或重壓才有得用。

參考規格見 `docs/HERO_BACKGROUND_GUIDE.md`。
