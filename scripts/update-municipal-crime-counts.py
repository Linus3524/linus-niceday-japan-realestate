#!/usr/bin/env python3
"""Build current municipality crime snapshots from prefectural-police tables.

Each prefecture needs an explicit parser because the National Police Agency does
not publish a current nationwide municipality table. The output schema is shared,
so newly supported prefectures automatically use the same UI and fallback rules.
"""

from __future__ import annotations

import json
import sys
import urllib.request
from pathlib import Path

import pdfplumber

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "src/data/municipalCrimeCounts.json"
CHIBA_URL = "https://www.police.pref.chiba.jp/content/common/000071144.pdf"
SOURCES = {
    "北海道": "https://www.police.pref.hokkaido.lg.jp/statis/hanzai/shityouson-betu/r03-r07.pdf",
    "青森県": "https://www.police.pref.aomori.jp/keijibu/soubun/toukei_siryo/toukei2025/C4-2.pdf",
    "宮城県": "https://www.police.pref.miyagi.jp/sousashien/pdf/keihou%20kakuteichi2.pdf",
    "福島県": "https://www.police.pref.fukushima.jp/07.anzen/-hanzaitoukei/r7kakuteichi.pdf",
    "茨城県": "https://www.pref.ibaraki.jp/kenkei/a01_safety/statistics/documents/r07-12_number-of-reported-rrimes.pdf",
    "栃木県": "https://www.pref.tochigi.lg.jp/keisatu/n18/anzenanshin/documents/20260212111659.pdf",
    "埼玉県": "https://www.police.pref.saitama.lg.jp/documents/27624/r7keihoukansityouson.pdf",
    "千葉県": CHIBA_URL,
    "山形県": "https://www.pref.yamagata.jp/documents/5698/hp_r07.pdf",
    "神奈川県": "https://www.police.pref.kanagawa.jp/assets/entry/c0030_67.pdf",
    "大阪府": "https://www.police.pref.osaka.lg.jp/material/files/group/2/hanzaitokei09_r07.xlsx",
    # 愛知只在年度「犯罪統計書」放市區町村別，令和 7 年版尚未出版，先用令和 6 年。
    "愛知県": "https://www.pref.aichi.jp/police/anzen/hassei/keiji-s/images/Aichi-HanzaiTokei2024.pdf",
    "兵庫県": "https://www.police.pref.hyogo.lg.jp/seikatu/gaitou/statis/data/R07.pdf",
    "京都府": "https://www.pref.kyoto.jp/fukei/anzen/toke/documents/28-r7-10.pdf",
    "福岡県": "https://www.police.pref.fukuoka.jp/data/open/cnt/3/183/1/R07kakuteiCIty.pdf",
    "静岡県": "https://www.pref.shizuoka.jp/police/_res/projects/project_police/_page_/002/001/146/r7zyoukyouhyou.pdf",
    "新潟県": "https://www.pref.niigata.lg.jp/uploaded/attachment/503121.pdf",
    "長野県": "https://www.pref.nagano.lg.jp/police/toukei/documents/r7toukei-chichouson.pdf",
    "岐阜県": "https://www.pref.gifu.lg.jp/uploaded/attachment/485367.pdf",
    "三重県": "https://www.police.pref.mie.jp/pdf/07_ninchi_kenkyo.pdf",
    "滋賀県": "https://www.pref.shiga.lg.jp/documents/333/5592613_1.pdf",
    "奈良県": "https://www.police.pref.nara.jp/cmsfiles/contents/0000000/452/R7.pdf",
    # 和歌山令和 7 年只出了警察署別，市町村別犯罪率表最新是令和 6 年。
    "和歌山県": "https://www.police.pref.wakayama.lg.jp/04_toukei/documents/r6/hanzairitsur6.pdf",
    "岡山県": "https://www.pref.okayama.jp/uploaded/attachment/405322.pdf",
    "広島県": "https://www.pref.hiroshima.lg.jp/soshiki_file/police/hantour7.pdf",
}
# 各縣的資料年度；沒列的都是 2025（令和 7 年）。
SOURCE_YEARS = {"愛知県": 2024, "和歌山県": 2024}
POPULATION_API = "https://dashboard.e-stat.go.jp/api/1.0/Json/getData?Lang=JP&IndicatorCode=0201010000000010000&RegionalRank=4&Cycle=3&IsSeasonalAdjustment=1&MetaGetFlg=Y"

GROUPS = [
    ("A", "凶惡犯罪", 3, [(4, "殺人"), (5, "強盜"), (7, "縱火"), (8, "不同意性交等")]),
    ("B", "粗暴犯罪", 9, [(10, "攜械聚集"), (11, "暴行"), (12, "傷害"), (13, "脅迫"), (14, "恐嚇")]),
    ("C", "竊盜犯罪", 15, [(16, "住宅空巢竊盜"), (17, "住宅夜間潛入"), (18, "辦公室侵入竊盜"), (19, "店鋪侵入竊盜"), (20, "其他侵入竊盜"), (21, "汽車竊盜"), (22, "機車竊盜"), (23, "自行車竊盜"), (24, "車內物品竊盜"), (25, "搶奪"), (26, "零件竊盜"), (27, "自動販賣機竊盜"), (28, "其他非侵入竊盜")]),
    ("D", "詐欺等知能犯罪", 29, [(30, "詐欺"), (31, "侵占"), (32, "其他知能犯罪")]),
    ("E", "風俗犯罪", 33, []),
    ("F", "其他刑法犯罪", 39, [(40, "侵入住居"), (41, "侵占遺失物等"), (42, "其他")]),
]


def number(value: str | None) -> int:
    normalized = str(value if value is not None else "0").replace(",", "").strip()
    return 0 if normalized in {"", "-", "－", "None"} else int(float(normalized))


def fetch_json(url: str) -> dict:
    with urllib.request.urlopen(url) as response:
        return json.load(response)


def population_by_prefecture() -> dict[str, dict[str, int]]:
    data = fetch_json(POPULATION_API)["GET_STATS"]["STATISTICAL_DATA"]
    names = next(item["CLASS"] for item in data["CLASS_INF"]["CLASS_OBJ"] if item["@id"] == "regionCode")
    region_names = {item["@code"]: item["@name"] for item in names}
    by_prefecture: dict[str, dict[str, int]] = {}
    for item in data["DATA_INF"]["DATA_OBJ"]:
        value = item["VALUE"]
        if value["@time"] != "2025CY00" or value["@regionCode"] not in region_names:
            continue
        code = value["@regionCode"]
        by_prefecture.setdefault(code[:2], {})[region_names[code]] = int(float(value["$"]))
    return by_prefecture


PREFECTURE_CODES = {
    "北海道": "01", "青森県": "02", "宮城県": "04", "山形県": "06",
    "福島県": "07", "茨城県": "08", "栃木県": "09", "埼玉県": "11", "千葉県": "12",
    "神奈川県": "14", "大阪府": "27", "愛知県": "23", "兵庫県": "28", "京都府": "26", "福岡県": "40", "静岡県": "22", "新潟県": "15", "長野県": "20", "岐阜県": "21", "三重県": "24", "滋賀県": "25", "奈良県": "29", "和歌山県": "30", "岡山県": "33", "広島県": "34",
}


def compact(value: str | None) -> str:
    return (value or "").replace(" ", "").replace("\n", "").replace("ヶ", "ケ")


def population_for(prefecture: str, name: str, populations: dict[str, dict[str, int]]) -> int | None:
    expected = compact(name)
    rows = populations[PREFECTURE_CODES[prefecture]]
    exact = next((population for label, population in rows.items() if compact(label) == expected), None)
    if exact is not None:
        return exact
    suffixes = sorted(((label, population) for label, population in rows.items() if expected.endswith(compact(label))), key=lambda item: len(compact(item[0])), reverse=True)
    return suffixes[0][1] if suffixes else None


def broad_groups(values: list[int]) -> list[dict]:
    labels = [("A", "凶惡犯罪"), ("B", "粗暴犯罪"), ("C", "竊盜犯罪"),
              ("D", "詐欺等知能犯罪"), ("E", "風俗犯罪"), ("F", "其他刑法犯罪")]
    return [{"code": code, "label": label, "count": count, "items": []}
            for (code, label), count in zip(labels, values)]


# 縣警表沿用舊名、統計儀表板用現名的市町村。
NAME_ALIASES = {
    "篠山市": "丹波篠山市",   # 2019 年改名，兵庫縣警的表還是舊名
}


def record(prefecture: str, name: str, total: int, populations: dict[str, dict[str, int]], groups=None) -> dict | None:
    name = NAME_ALIASES.get(compact(name), name)
    population = population_for(prefecture, name, populations)
    if population is None:
        return None
    rows = populations[PREFECTURE_CODES[prefecture]]
    canonical = next((label for label in rows if compact(label) == compact(name)), None)
    if canonical is None:
        labels = sorted((label for label in rows if compact(name).endswith(compact(label))), key=lambda label: len(compact(label)), reverse=True)
        if not labels:
            return None
        canonical = labels[0]
    return {"municipality": canonical,
            "population": population, "total": total, "groups": groups or []}


def parse_chiba(path: Path, populations: dict[str, dict[str, int]]) -> list[dict]:
    rows: list[list[str | None]] = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            rows.extend(page.extract_tables()[0][2:])
    records = []
    for row in rows:
        # Page two omits the empty spacer column after the municipality name.
        if len(row) == 42:
            row.insert(1, None)
        # The six Chiba-city wards are printed under a merged "千葉市" cell,
        # so pdfplumber exposes the ward name in the spacer column.
        name = row[0] or row[1]
        if name in {"中央区", "花見川区", "稲毛区", "若葉区", "緑区", "美浜区"}:
            name = f"千葉市{name}"
        # Police and Statistics Dashboard use different glyphs for the same city.
        if name == "袖ヶ浦市":
            name = "袖ケ浦市"
        if not name or name in {"総数", "千葉市", "県外", "国外"}:
            continue
        total = number(row[2])
        groups = []
        for code, label, total_index, items in GROUPS:
            groups.append({
                "code": code,
                "label": label,
                "count": number(row[total_index]),
                "items": [
                    {"code": f"{code}-{index}", "label": item_label, "original": item_label, "count": number(row[index])}
                    for index, item_label in items
                ],
            })
        parsed = record("千葉県", name, total, populations, groups)
        if parsed:
            records.append(parsed)
    record_total = sum(item["total"] for item in records)
    if len(records) != 59 or record_total != 39728:
        raise RuntimeError(
            "Unexpected Chiba municipality table; refusing to publish a partial snapshot "
            f"(areas={len(records)}, total={record_total})"
        )
    return records


def first_number(value: str | None) -> int:
    token = (value or "").replace(",", "").split()
    return int(token[0]) if token and token[0] not in {"-", "－"} else 0


def parse_hokkaido(path: Path, populations: dict[str, dict[str, int]]) -> list[dict]:
    records = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages[1:]:
            current_name = ""
            for row in page.extract_tables()[0][3:]:
                if compact(row[0]):
                    current_name = compact(row[0])
                if row[1] != "令和７年":
                    continue
                name = current_name
                if name.endswith("区") and "市" not in name:
                    name = f"札幌市{name}"
                if not name or name in {"札幌市", "不明", "合計"}:
                    continue
                parsed = record("北海道", name, number(row[2]), populations,
                                broad_groups([number(row[i]) for i in (4, 6, 8, 10, 12, 14)]))
                if parsed:
                    records.append(parsed)
    return records


def parse_simple_broad(path: Path, prefecture: str, header_rows: int, indexes: tuple[int, ...],
                       ward_city: dict[str, str] | None = None, pages: list[int] | None = None) -> list[dict]:
    """單欄名稱＋六大分類的表。ward_city 給「區名→市名」對照，
    給那些把政令市的區直接印成「門司区」不冠市名的縣用。"""
    populations = POPULATIONS
    records = []
    with pdfplumber.open(path) as pdf:
        for page in (pdf.pages if pages is None else [pdf.pages[i] for i in pages]):
            for row in page.extract_tables()[0][header_rows:]:
                name = compact(row[0])
                if not name or any(word in name for word in ("総数", "合計", "不明", "国外", "県外", "その他")):
                    continue
                if ward_city and name in ward_city:
                    name = f"{ward_city[name]}{name}"
                total = number(row[indexes[0]])
                groups = broad_groups([number(row[i]) for i in indexes[1:]])
                parsed = record(prefecture, name, total, populations, groups)
                if parsed:
                    records.append(parsed)
    return records


def parse_miyagi(path: Path, populations: dict[str, dict[str, int]]) -> list[dict]:
    records = []
    with pdfplumber.open(path) as pdf:
        for row in pdf.pages[0].extract_tables()[0][2:]:
            name = compact(row[1] or row[0])
            if name == "仙台市" or not name or "総数" in name:
                continue
            if name.endswith("区"):
                name = f"仙台市{name}"
            parsed = record("宮城県", name, number(row[2]), populations,
                            broad_groups([first_number(row[i]) for i in (4, 5, 6, 7, 8, 9)]))
            if parsed:
                records.append(parsed)
    return records


def parse_total_rows(path: Path, prefecture: str, pages: list[int], name_indexes: tuple[int, ...], total_index: int, skip: int) -> list[dict]:
    records = []
    with pdfplumber.open(path) as pdf:
        for page_index in pages:
            for row in pdf.pages[page_index].extract_tables()[0][skip:]:
                # 郡小計列會把底下的町名一起塞進同一格（"海草郡の計\n紀美野町"），只看第一行，
                # 帶「計」的就是小計列直接跳過。
                name = next((compact((row[i] or "").split("\n")[0]) for i in name_indexes if i < len(row) and compact(row[i])), "")
                if not name or any(word in name for word in ("総数", "合計", "の計", "不明", "国外", "県外", "その他")):
                    continue
                # 和歌山把件數印成「2,117 (52.12%)」，只取第一個數
                parsed = record(prefecture, name, first_number(row[total_index]), POPULATIONS)
                if parsed:
                    records.append(parsed)
    return records


def items_from(row: list, spec: list[tuple[int, str]], code: str) -> list[dict]:
    return [{"code": f"{code}-{index}", "label": label, "original": label, "count": number(row[index])}
            for index, label in spec]


def rows_from_pdf(path: Path, pages: list[int], skip: int) -> list[list]:
    with pdfplumber.open(path) as pdf:
        return [row for page_index in pages for row in pdf.pages[page_index].extract_tables()[0][skip:]]


def rows_from_xlsx(path: Path, min_row: int, sheet: int = 0) -> list[list]:
    import openpyxl
    workbook = openpyxl.load_workbook(path, data_only=True)
    return [[None if cell is None else str(cell) for cell in row]
            for row in workbook.worksheets[sheet].iter_rows(min_row=min_row, values_only=True)]


def parse_city_ward_table(rows: list[list], prefecture: str,
                          total_index: int, group_indexes: tuple[int, ...],
                          group_items: dict[str, list[tuple[int, str]]] | None = None,
                          city_index: int = 1, sub_index: int = 2,
                          exclude: tuple[str, ...] = ("総数", "合計", "不明", "国外", "県外", "府外", "他府県", "他県")) -> list[dict]:
    """政令市的區與郡下的町村印在第二欄、上一列是市／郡的小計。

    小計列一律跳過（政令市用區、郡不是行政單位），只收最細的那一層；
    單獨成列的一般市直接收。「大阪市計」這種帶「計」的小計名也視為父列。"""
    labels = [("A", "凶惡犯罪"), ("B", "粗暴犯罪"), ("C", "竊盜犯罪"),
              ("D", "詐欺等知能犯罪"), ("E", "風俗犯罪"), ("F", "其他刑法犯罪")]
    # (name, parent, row)；parent 只在「第二欄的子列」上有值
    entries: list[tuple[str, str, list]] = []
    parent = ""
    for row in rows:
        # 兵庫的「神戸市」小計列把第一個區名一起塞進同一格（"神戸市\n東灘区"），只取第一行
        city = compact((row[city_index] or "").split("\n")[0]).removesuffix("計")
        sub = compact(row[sub_index]).removeprefix("うち")
        if city:
            parent = city
            if sub:
                entries.append((f"{city}{sub}", city, row))
            elif not city.endswith("郡"):
                entries.append((city, "", row))
        elif sub:
            # 郡下的町村本身就是行政單位，不冠郡名；政令市的區要冠市名
            entries.append((f"{parent}{sub}" if parent.endswith("市") else sub, parent, row))
    # 政令市那一列是它底下各區的小計，有子列的市一律不收，只收區。
    parents_with_children = {parent for _, parent, _ in entries if parent}
    records = []
    for name, _, row in entries:
        if name in parents_with_children or any(word in name for word in exclude):
            continue
        groups = [{"code": code, "label": label, "count": number(row[index]),
                   "items": items_from(row, (group_items or {}).get(code, []), code)}
                  for (code, label), index in zip(labels, group_indexes)]
        parsed = record(prefecture, name, number(row[total_index]), POPULATIONS, groups)
        if parsed:
            records.append(parsed)
    return records


def parse_grid_pages(path: Path, pages: list[int], name_column: int = 1) -> dict[str, list[int]]:
    """愛知犯罪統計書那種表：pdfplumber 的表格偵測只抓到上半部（有框線的部分），
    下半部一般市的列會漏掉；而且數字中間被塞了空白（"1 ,169"），純文字也切不準。
    改用表格的欄位 x 邊界把整頁的文字逐字塞回欄位，再依 y 座標分列，
    就能同時吃到有框線與沒框線的列。政令市的區會冠上市名。"""
    result: dict[str, list[int]] = {}
    with pdfplumber.open(path) as pdf:
        for page_index in pages:
            page = pdf.pages[page_index]
            table = page.find_tables()[0]
            edges: list[float] = []
            for x in sorted({round(c[0]) for c in table.cells} | {round(c[2]) for c in table.cells}):
                if not edges or x - edges[-1] > 3:
                    edges.append(x)
            lines: list[list[dict]] = []
            for word in sorted(page.extract_words(x_tolerance=1.5, y_tolerance=2), key=lambda w: w["top"]):
                if lines and abs(word["top"] - lines[-1][0]["top"]) <= 3:
                    lines[-1].append(word)
                else:
                    lines.append([word])
            parent = ""
            for line in lines:
                cells = [""] * (len(edges) - 1)
                for word in sorted(line, key=lambda w: w["x0"]):
                    center = (word["x0"] + word["x1"]) / 2
                    for i in range(len(edges) - 1):
                        if edges[i] <= center < edges[i + 1]:
                            cells[i] += word["text"]
                            break
                # 第一頁多一個 8pt 的空白間隔欄、第二頁沒有，名稱欄位置逐列判斷
                name_index = next((i for i, cell in enumerate(cells) if cell and not cell.replace(",", "").replace("-", "").isdigit()), None)
                if name_index is None or name_index > name_column:
                    continue
                name = compact(cells[name_index])
                values = cells[name_index + 1:]
                if not name or not values[0] or not all(v == "-" or v.replace(",", "").isdigit() for v in values if v):
                    continue
                if name.endswith("市") and values[0]:
                    parent = name
                if name.endswith("区"):
                    name = f"{parent}{name}"
                result[name] = [number(v) for v in values]
    return result


def parse_aichi(path: Path) -> list[dict]:
    """愛知：犯罪統計書「12 市区町村別 罪種別 認知件数」共 4 頁，前兩頁是總數與
    凶悪・粗暴・窃盗，後兩頁是知能・風俗・その他，用市區町村名把兩邊接起來。"""
    left = parse_grid_pages(path, [49, 50])
    right = parse_grid_pages(path, [51, 52])
    # 名古屋市那一列是 16 個區的小計，只收區
    parents = {name.removesuffix(sub) for name in left for sub in [name[name.rfind("市") + 1:]] if sub.endswith("区")}
    records = []
    for name, l in left.items():
        if any(word in name for word in ("総数", "不明", "国外", "県外")) or name.endswith("郡") or name in parents:
            continue
        r = right.get(name)
        if r is None:
            continue
        groups = [
            {"code": "A", "label": "凶惡犯罪", "count": l[1], "items": items_from_values([(l[2], "殺人"), (l[3], "強盜"), (l[4], "縱火"), (l[5], "不同意性交等")], "A")},
            {"code": "B", "label": "粗暴犯罪", "count": l[6], "items": items_from_values([(l[8], "暴行"), (l[9], "傷害"), (l[10], "脅迫"), (l[11], "恐嚇")], "B")},
            {"code": "C", "label": "竊盜犯罪", "count": l[12], "items": items_from_values([(l[13], "侵入竊盜"), (l[21], "交通工具竊盜"), (r[0], "非侵入竊盜")], "C")},
            {"code": "D", "label": "詐欺等知能犯罪", "count": r[12], "items": items_from_values([(r[13], "詐欺")], "D")},
            {"code": "E", "label": "風俗犯罪", "count": r[15], "items": []},
            {"code": "F", "label": "其他刑法犯罪", "count": r[20], "items": items_from_values([(r[21], "侵占遺失物"), (r[22], "器物損壞"), (r[23], "侵入住居")], "F")},
        ]
        parsed = record("愛知県", name, l[0], POPULATIONS, groups)
        if parsed:
            records.append(parsed)
    return records


def items_from_values(pairs: list[tuple[int, str]], code: str) -> list[dict]:
    return [{"code": f"{code}-{i}", "label": label, "original": label, "count": count}
            for i, (count, label) in enumerate(pairs)]


def merge_split_groups(left: list[dict], right: list[dict]) -> list[dict]:
    """有些縣把六大分類拆成左右兩張表（(1) 凶悪・粗暴・窃盗、(2) 知能・風俗・その他），
    兩邊各自解析後用市區町村名接起來；右表的 A～C 佔位資料丟掉、換成右表的 D～F。"""
    by_name = {item["municipality"]: item for item in right}
    merged = []
    for item in left:
        other = by_name.get(item["municipality"])
        if other is None:
            continue
        groups = item["groups"][:3] + other["groups"][3:]
        merged.append({**item, "groups": groups})
    return merged


def parse_multitable_first_line(path: Path, prefecture: str, total_index: int, group_indexes: tuple[int, ...],
                                exclude: tuple[str, ...]) -> list[dict]:
    """滋賀那種每個市町佔三列（R7／R6／増減）、而且一頁被切成好幾張小表的格式。
    只看有名稱的那一列（R7），儲存格裡若有兩行也只取第一行。"""
    labels = [("A", "凶惡犯罪"), ("B", "粗暴犯罪"), ("C", "竊盜犯罪"),
              ("D", "詐欺等知能犯罪"), ("E", "風俗犯罪"), ("F", "其他刑法犯罪")]
    first = lambda cell: number((cell or "").split("\n")[0])
    records = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            for table in page.extract_tables():
                for row in table:
                    name = compact(row[0])
                    if not name or any(word in name for word in exclude) or not (row[total_index] or "").strip():
                        continue
                    if not (row[total_index] or "").split("\n")[0].replace(",", "").strip().isdigit():
                        continue
                    groups = [{"code": code, "label": label, "count": first(row[index]), "items": []}
                              for (code, label), index in zip(labels, group_indexes)]
                    parsed = record(prefecture, name, first(row[total_index]), POPULATIONS, groups)
                    if parsed:
                        records.append(parsed)
    return records


def merge_group_parts(parts: list[tuple[list[dict], str]]) -> list[dict]:
    """岡山那種每頁兩個分類、六大分類分散在四頁的表：每個 part 是
    (parse_city_ward_table 的結果, 這一頁提供的分類代碼字串如 "AB")，
    以第一個 part 的市區町村與總數為準，各分類各取自己那一頁。"""
    base, _ = parts[0]
    lookup = [({item["municipality"]: item for item in records}, codes) for records, codes in parts]
    merged = []
    for item in base:
        groups = []
        for code_index, code in enumerate("ABCDEF"):
            source = next((records[item["municipality"]] for records, codes in lookup
                           if code in codes and item["municipality"] in records), None)
            if source is None:
                groups = []
                break
            groups.append(source["groups"][code_index])
        merged.append({**item, "groups": groups})
    return merged


def parse_hiroshima(path: Path, page_index: int = 101) -> list[dict]:
    """広島犯罪統計書「12 市区町別 包括罪種別 認知件数」：pdfplumber 的表格偵測把名稱和數字
    黏在同一格，改用文字座標：x<150 的字是名稱，數字依右緣對到七個欄位。"""
    right_edges = [192, 241, 289, 337, 385, 433, 481]   # 総数 凶悪 粗暴 窃盗 知能 風俗 その他
    labels = [("A", "凶惡犯罪"), ("B", "粗暴犯罪"), ("C", "竊盜犯罪"),
              ("D", "詐欺等知能犯罪"), ("E", "風俗犯罪"), ("F", "其他刑法犯罪")]
    records = []
    with pdfplumber.open(path) as pdf:
        page = pdf.pages[page_index]
        lines: list[list[dict]] = []
        for word in sorted(page.extract_words(x_tolerance=1.5, y_tolerance=2), key=lambda w: w["top"]):
            if lines and abs(word["top"] - lines[-1][0]["top"]) <= 3:
                lines[-1].append(word)
            else:
                lines.append([word])
        parent = ""
        for line in lines:
            words = sorted(line, key=lambda w: w["x0"])
            name = compact("".join(w["text"] for w in words if w["x1"] <= 150))
            values = [0] * 7
            seen = False
            for w in words:
                if w["x0"] <= 150 or not w["text"].replace(",", "").isdigit():
                    continue
                index = min(range(7), key=lambda i: abs(right_edges[i] - w["x1"]))
                values[index] = number(w["text"]); seen = True
            if not name or not seen or any(k in name for k in ("総数", "計", "不詳", "その他")) or name.endswith("郡"):
                continue
            if name.endswith("市"):
                parent = name
            if name.endswith("区"):
                name = f"{parent}{name}"
            groups = [{"code": code, "label": label, "count": values[i + 1], "items": []}
                      for i, (code, label) in enumerate(labels)]
            records.append((name, values[0], groups))
    # 広島市那一列是各區小計，只收區
    parents = {n[: n.index("市") + 1] for n, _, _ in records if n.endswith("区")}
    return [parsed for name, total, groups in records if name not in parents
            for parsed in [record("広島県", name, total, POPULATIONS, groups)] if parsed]


def parse_saitama(path: Path, populations: dict[str, dict[str, int]]) -> list[dict]:
    records = []
    with pdfplumber.open(path) as pdf:
        for row in pdf.pages[0].extract_tables()[0][3:]:
            first, second = compact(row[0]), compact(row[1])
            name = f"さいたま市{second}" if second and (first == "さいたま市" or second.endswith("区")) else first
            if not name or name in {"県外", "国外", "合計"}:
                continue
            parsed = record("埼玉県", name, number(row[2]), populations)
            if parsed:
                records.append(parsed)
    return records


POPULATIONS: dict[str, dict[str, int]] = {}


def main() -> None:
    global POPULATIONS
    work = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("/tmp/municipal-crime")
    work.mkdir(parents=True, exist_ok=True)
    POPULATIONS = population_by_prefecture()
    paths = {}
    for prefecture, url in SOURCES.items():
        suffix = ".xlsx" if url.lower().endswith((".xlsx", ".xls")) else ".pdf"
        pdf = work / f"{PREFECTURE_CODES[prefecture]}-2025{suffix}"
        if not pdf.exists():
            urllib.request.urlretrieve(url, pdf)
        paths[prefecture] = pdf
    prefectures = {
        "北海道": {"year": 2025, "sourceUrl": SOURCES["北海道"], "records": parse_hokkaido(paths["北海道"], POPULATIONS)},
        "青森県": {"year": 2025, "sourceUrl": SOURCES["青森県"], "records": parse_simple_broad(paths["青森県"], "青森県", 2, (1, 3, 5, 7, 9, 11, 13))},
        "宮城県": {"year": 2025, "sourceUrl": SOURCES["宮城県"], "records": parse_miyagi(paths["宮城県"], POPULATIONS)},
        "山形県": {"year": 2025, "sourceUrl": SOURCES["山形県"], "records": parse_total_rows(paths["山形県"], "山形県", [3], (1, 0), 3, 3)},
        "福島県": {"year": 2025, "sourceUrl": SOURCES["福島県"], "records": parse_total_rows(paths["福島県"], "福島県", [1, 2], (1, 0), 2, 3)},
        "茨城県": {"year": 2025, "sourceUrl": SOURCES["茨城県"], "records": parse_total_rows(paths["茨城県"], "茨城県", [0], (2, 0), 3, 3)},
        "栃木県": {"year": 2025, "sourceUrl": SOURCES["栃木県"], "records": parse_simple_broad(paths["栃木県"], "栃木県", 4, (1, 4, 6, 8, 10, 12, 14))},
        "埼玉県": {"year": 2025, "sourceUrl": SOURCES["埼玉県"], "records": parse_saitama(paths["埼玉県"], POPULATIONS)},
        "千葉県": {"year": 2025, "sourceUrl": CHIBA_URL, "records": parse_chiba(paths["千葉県"], POPULATIONS)},
        # 神奈川：第 0～1 頁是罪名別（含六大分類與部分細項），第 2～3 頁是竊盜手口別，這裡只取前兩頁。
        "神奈川県": {"year": 2025, "sourceUrl": SOURCES["神奈川県"], "records": parse_city_ward_table(
            rows_from_pdf(paths["神奈川県"], [0, 1], 3), "神奈川県", 3, (4, 8, 13, 14, 17, 20),
            {"A": [(5, "強盜"), (6, "縱火"), (7, "其他")], "B": [(9, "暴行"), (10, "傷害"), (11, "恐嚇"), (12, "其他")],
             "D": [(15, "詐欺"), (16, "其他")], "E": [(18, "不同意猥褻"), (19, "其他")],
             "F": [(21, "侵入住居"), (22, "器物損壞"), (23, "其他")]},
            exclude=("総数", "合計", "不明", "国外", "県外", "発生地"))},
        # 大阪：府警直接給 Excel，第 10 列起是資料列；大阪市計／堺市計底下接各區。
        "大阪府": {"year": 2025, "sourceUrl": SOURCES["大阪府"], "records": parse_city_ward_table(
            rows_from_xlsx(paths["大阪府"], 10), "大阪府", 3, (4, 8, 13, 31, 33, 35),
            {"A": [(5, "強盜"), (7, "縱火")], "B": [(9, "暴行"), (10, "傷害"), (11, "脅迫"), (12, "恐嚇")],
             "C": [(14, "侵入竊盜"), (21, "汽車竊盜"), (22, "機車竊盜"), (23, "自行車竊盜"), (24, "搶奪"), (27, "車內物品竊盜"), (30, "順手牽羊")],
             "D": [(32, "詐欺")], "E": [(34, "公然猥褻")],
             "F": [(36, "侵占遺失物"), (37, "妨害公務"), (38, "侵入住居"), (39, "器物損壞")]},
            exclude=("総数", "合計", "不明", "国外", "府内", "他府県", "発生地"))},
        "愛知県": {"year": SOURCE_YEARS["愛知県"], "sourceUrl": SOURCES["愛知県"], "records": parse_aichi(paths["愛知県"])},
        # 兵庫：縣警只給總數與幾種主要罪種，沒有六大分類；分類由 UI 退回縣級。
        "兵庫県": {"year": 2025, "sourceUrl": SOURCES["兵庫県"], "records": parse_city_ward_table(
            rows_from_pdf(paths["兵庫県"], [0], 3), "兵庫県", 3, (), city_index=0, sub_index=1,
            exclude=("県下", "不明", "県外"))},
        "京都府": {"year": 2025, "sourceUrl": SOURCES["京都府"], "records": parse_simple_broad(paths["京都府"], "京都府", 2, (1, 2, 3, 4, 8, 9, 10))},
        # 福岡：政令市的區不冠市名（門司区、東区…），用對照表補回。
        "福岡県": {"year": 2025, "sourceUrl": SOURCES["福岡県"], "records": parse_simple_broad(
            paths["福岡県"], "福岡県", 1, (1, 2, 3, 4, 5, 6, 7),
            ward_city={**{w: "北九州市" for w in ("門司区", "若松区", "戸畑区", "小倉北区", "小倉南区", "八幡東区", "八幡西区")},
                       **{w: "福岡市" for w in ("東区", "博多区", "中央区", "南区", "西区", "城南区", "早良区")}})},
        "静岡県": {"year": 2025, "sourceUrl": SOURCES["静岡県"], "records": parse_simple_broad(paths["静岡県"], "静岡県", 3, (1, 2, 3, 6, 39, 40, 41))},
        # 新潟：市部／郡部 → 市 → 區三層，只有總數與幾種手口，分類退回縣級。
        "新潟県": {"year": 2025, "sourceUrl": SOURCES["新潟県"], "records": parse_city_ward_table(
            rows_from_pdf(paths["新潟県"], [0], 2), "新潟県", 3, (), city_index=1, sub_index=2,
            exclude=("合計", "その他", "不明", "県外"))},
        # 長野：第 0 欄是警察署、第 1 欄是市町村，Ｒ７ 總數在第 3 欄；只有總數。
        "長野県": {"year": 2025, "sourceUrl": SOURCES["長野県"], "records": parse_total_rows(paths["長野県"], "長野県", [0], (1,), 3, 2)},
        # 岐阜：六大分類拆成 (1)(2) 兩張表各兩頁，各欄都是 R7／R6／増減 三格，取 R7。
        "岐阜県": {"year": 2025, "sourceUrl": SOURCES["岐阜県"], "records": merge_split_groups(
            parse_city_ward_table(rows_from_pdf(paths["岐阜県"], [0, 2], 3), "岐阜県", 2, (5, 8, 17, 2, 2, 2),
                                  {"B": [(11, "暴行"), (14, "傷害")], "C": [(20, "侵入竊盜")]},
                                  city_index=0, sub_index=1, exclude=("総数", "計", "不明", "県外")),
            parse_city_ward_table(rows_from_pdf(paths["岐阜県"], [1, 3], 3), "岐阜県", 2, (2, 2, 2, 2, 8, 14),
                                  {"D": [(5, "詐欺")], "E": [(11, "不同意猥褻")], "F": [(17, "侵占遺失物"), (20, "侵入住居"), (23, "器物損壞")]},
                                  city_index=0, sub_index=1, exclude=("総数", "計", "不明", "県外")))},
        # 三重：認知・検挙状況資料的別添資料３（第 5 頁），各欄 令和７／令和６／増減 三格。
        "三重県": {"year": 2025, "sourceUrl": SOURCES["三重県"], "records": parse_simple_broad(paths["三重県"], "三重県", 2, (1, 4, 7, 10, 13, 16, 19), pages=[5])},
        "滋賀県": {"year": 2025, "sourceUrl": SOURCES["滋賀県"], "records": parse_multitable_first_line(
            paths["滋賀県"], "滋賀県", 1, (2, 7, 13, 17, 20, 24), exclude=("総数", "地域", "不明", "市町"))},
        # 奈良：只有總數與主要罪種，第 2 欄是 R7 12 月末累計。
        "奈良県": {"year": 2025, "sourceUrl": SOURCES["奈良県"], "records": parse_total_rows(paths["奈良県"], "奈良県", [0], (0,), 2, 4)},
        "和歌山県": {"year": SOURCE_YEARS["和歌山県"], "sourceUrl": SOURCES["和歌山県"], "records": parse_total_rows(paths["和歌山県"], "和歌山県", [0], (1, 2), 4, 3)},
        # 岡山：四頁，每頁兩個分類（各佔 9 欄：認知 3、検挙 3、検挙率 3），總數在第 0 頁第 2 欄。
        "岡山県": {"year": 2025, "sourceUrl": SOURCES["岡山県"], "records": merge_group_parts([
            (parse_city_ward_table(rows_from_pdf(paths["岡山県"], [0], 3), "岡山県", 2, (11, 2, 2, 2, 2, 2), city_index=0, sub_index=1, exclude=("総数", "不明", "県外")), "A"),
            (parse_city_ward_table(rows_from_pdf(paths["岡山県"], [1], 3), "岡山県", 2, (2, 2, 11, 2, 2, 2), city_index=0, sub_index=1, exclude=("総数", "不明", "県外")), "BC"),
            (parse_city_ward_table(rows_from_pdf(paths["岡山県"], [2], 3), "岡山県", 2, (2, 2, 2, 2, 11, 2), city_index=0, sub_index=1, exclude=("総数", "不明", "県外")), "DE"),
            (parse_city_ward_table(rows_from_pdf(paths["岡山県"], [3], 3), "岡山県", 2, (2, 2, 2, 2, 2, 2), city_index=0, sub_index=1, exclude=("総数", "不明", "県外")), "F"),
        ])},
        "広島県": {"year": 2025, "sourceUrl": SOURCES["広島県"], "records": parse_hiroshima(paths["広島県"])},
    }
    for prefecture, data in prefectures.items():
        if not data["records"]:
            raise RuntimeError(f"No municipality records parsed for {prefecture}")
    snapshot = {
        "generatedAt": "2026-09-13",
        "populationYear": 2025,
        "prefectures": prefectures,
    }
    OUTPUT.write_text(json.dumps(snapshot, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(f"Wrote {OUTPUT} with {sum(len(data['records']) for data in prefectures.values())} areas across {len(prefectures)} prefectures")


if __name__ == "__main__":
    main()
