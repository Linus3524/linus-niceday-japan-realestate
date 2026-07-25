# 首圖素材放置區

把「原始高畫質檔」放這裡，網頁用的 WebP 壓縮版本由這裡產生後輸出到 `public/`。

## 素材對應與輸出檔名

| 場景 / 角色 | 原始素材檔 (assets/hero/) | 輸出 WebP 檔 (public/) |
|---|---|---|
| 橘子男 (東京鐵塔) | `橘子男-東京鐵塔背景.png`<br>`住好日網站-橘子男-柴犬.png` | `hero-bg.webp`<br>`hero-character.webp` |
| 檸檬男 (富士山) | `檸檬男-富士山背景.png`<br>`住好日網站-檸檬男-傑克羅素.png` | `hero-fuji.webp`<br>`hero-character-lemon.webp` |
| 葡萄男 (六本木) | `葡萄男-六本木背景.png`<br>`住好日網站-葡萄男-杜賓.png` | `hero-roppongi.webp`<br>`hero-character-grape.webp` |
| 蘋果男 (昭和公園) | `蘋果男-昭和公園草原背景.png`<br>`住好日網站-蘋果男-黃金獵犬.png` | `hero-showa.webp`<br>`hero-character-apple.webp` |

## 轉檔指令範例

```bash
# 背景轉 WebP (q=82)
cwebp -q 82 "assets/hero/橘子男-東京鐵塔背景.png" -o "public/hero-bg.webp"
cwebp -q 82 "assets/hero/檸檬男-富士山背景.png" -o "public/hero-fuji.webp"
cwebp -q 82 "assets/hero/葡萄男-六本木背景.png" -o "public/hero-roppongi.webp"
cwebp -q 82 "assets/hero/蘋果男-昭和公園草原背景.png" -o "public/hero-showa.webp"

# 人物去背圖轉 WebP (q=90)
cwebp -q 90 "assets/hero/住好日網站-橘子男-柴犬.png" -o "public/hero-character.webp"
cwebp -q 90 "assets/hero/住好日網站-檸檬男-傑克羅素.png" -o "public/hero-character-lemon.webp"
cwebp -q 90 "assets/hero/住好日網站-葡萄男-杜賓.png" -o "public/hero-character-grape.webp"
cwebp -q 90 "assets/hero/住好日網站-蘋果男-黃金獵犬.png" -o "public/hero-character-apple.webp"
```

