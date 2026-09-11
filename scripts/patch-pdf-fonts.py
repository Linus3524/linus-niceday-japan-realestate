"""
為 PDF 用字型做兩個小手術，讓中日文可以逐字換行而不出現連字號。

背景：@react-pdf/renderer 的排版引擎（textkit）把每個「可斷字的音節邊界」當成
hyphenation 點，只要在那裡換行就一定插入一個 U+002D 連字號。中日文沒有空白，
逐字拆開後每個字的邊界都是這種斷點，結果每一行行尾都多一個「-」（實測「比-／較」）。
它只在「真正的空白」處才會無連字號換行，但 K&P 演算法在有伸縮空間時又偏好
斷在能多塞 5pt 連字號、把行填得更滿的 penalty 點——所以光靠插零寬空白救不了。

解法是從字型下手，把「自動插入的連字號」變成看不見的：
  1. 把原本 U+002D 的字形完整複製一份到私用區 U+E000（外觀與寬度都不變）。
  2. 把 U+002D 改指到一個新增的零寬空字形。
排版時 ListingReportPdf.tsx 的 hyphenation callback 會把內容裡的真實「-」換成
U+E000，所以「-21.0%」「2025-Q2」照常顯示；引擎自動插入的 U+002D 則什麼都不畫、
不占寬度。

用法（一次性，改完的字型直接進版控；重新下載原始字型後要再跑一次）：
  python3 -m venv /tmp/ftenv && /tmp/ftenv/bin/pip install fonttools
  /tmp/ftenv/bin/python scripts/patch-pdf-fonts.py public/fonts/NotoSansTC-Regular.ttf public/fonts/NotoSansTC-Bold.ttf
"""
import copy
import sys
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._g_l_y_f import Glyph

INVISIBLE_GLYPH = "linusInvisibleHyphen"
VISIBLE_HYPHEN_GLYPH = "linusVisibleHyphen"
HYPHEN_MINUS = 0x002D
VISIBLE_HYPHEN_CODEPOINT = 0xE000  # 私用區，不會跟任何真實文字衝突


def add_glyph(font, name, glyph, metrics):
    order = font.getGlyphOrder()
    if name in order:
        return
    order = order + [name]
    glyf = font["glyf"]
    glyf.glyphs[name] = glyph
    # glyf 表自己保有一份 glyphOrder，不跟 font.setGlyphOrder 同步；兩邊都要更新，
    # 否則 compile 時 len(glyphOrder) != len(glyphs) 會 assert 失敗。
    glyf.glyphOrder = order
    font.setGlyphOrder(order)
    font["hmtx"].metrics[name] = metrics
    if "hhea" in font:
        font["hhea"].numberOfHMetrics = len(order)
    font["maxp"].numGlyphs = len(order)


for path in sys.argv[1:]:
    font = TTFont(path)
    cmap_tables = [t for t in font["cmap"].tables if t.isUnicode()]
    original_hyphen_name = cmap_tables[0].cmap.get(HYPHEN_MINUS)
    if not original_hyphen_name:
        # 補字用的子集字型（NotoSansJP-Supplement）本來就不含 U+002D，連字號由主字型處理。
        print(f"{path}: 沒有 U+002D，略過（補字字型不需要處理）")
        continue

    if original_hyphen_name == INVISIBLE_GLYPH:
        print(f"{path}: 已處理過，略過")
        continue

    # 1. 複製原本的連字號到私用區
    add_glyph(
        font,
        VISIBLE_HYPHEN_GLYPH,
        copy.deepcopy(font["glyf"].glyphs[original_hyphen_name]),
        font["hmtx"].metrics[original_hyphen_name],
    )
    # 2. 新增零寬空字形
    empty = Glyph()
    empty.numberOfContours = 0
    add_glyph(font, INVISIBLE_GLYPH, empty, (0, 0))

    for table in cmap_tables:
        table.cmap[VISIBLE_HYPHEN_CODEPOINT] = VISIBLE_HYPHEN_GLYPH
        table.cmap[HYPHEN_MINUS] = INVISIBLE_GLYPH

    font.save(path)
    print(f"{path}: U+002D → 零寬；原連字號複製到 U+E000")
