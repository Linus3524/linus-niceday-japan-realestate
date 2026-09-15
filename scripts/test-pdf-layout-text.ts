import assert from "node:assert/strict";
import { extractPdfLayoutText } from "../src/lib/listing/browser/pdfRendering.js";

/**
 * PDF 版面還原的迴歸測試。
 *
 * 這些案例都來自實際踩過的圖紙問題，改動 extractPdfLayoutText 時務必保持通過。
 */

type Item = { str: string; width: number; height: number; x: number; y: number };

/** 以文字項座標偽造 PDFDocumentProxy，只需滿足 extractPdfLayoutText 用到的介面。 */
function fakePdf(items: Item[]) {
  return {
    getPage: async () => ({
      getTextContent: async () => ({
        items: items.map(item => ({
          str: item.str,
          width: item.width,
          transform: [1, 0, 0, item.height, item.x, item.y],
        })),
      }),
    }),
  } as unknown as Parameters<typeof extractPdfLayoutText>[0];
}

/** 逐字拆開的文字項：間距決定黏合或斷開。 */
function runOfChars(text: string, startX: number, y: number, size = 8): Item[] {
  return [...text].map((char, index) => ({
    str: char, width: size, height: size, x: startX + index * size, y,
  }));
}

// 1. 欄位邊界：相鄰字黏合，跨欄插入分隔，不可全部糊在一起。
{
  const layout = await extractPdfLayoutText(fakePdf([
    ...runOfChars("液晶テレビ", 0, 200),
    // 距離上一欄約 3 個字寬，屬於不同欄位。
    ...runOfChars("住所", 64, 200),
    ...runOfChars("千葉県柏市高田", 90, 200),
  ]));
  assert.ok(!layout.includes("液晶テレビ住所"), `欄位之間必須有邊界，實得：${layout}`);
  assert.ok(layout.includes("液晶テレビ"), `同欄位的字必須黏合，實得：${layout}`);
  assert.ok(/住所[\s\u3000]+千葉県柏市高田/u.test(layout), `標籤與值之間應有分隔，實得：${layout}`);
}

// 2. 列合併不得滾雪球：列距小於容忍度時，列中心若隨新項目漂移，
//    會把後續各列逐一吸進同一列（レオパレス 實測 92 個文字項跨 13pt 併成一列）。
//    錨點固定後，每列最多只吸收落在自己容忍範圍內的項目。
{
  const rows = [300, 297, 294, 291, 288, 285, 282];
  const layout = await extractPdfLayoutText(fakePdf(
    rows.flatMap((y, index) => runOfChars(`第${index}列`, 0, y)),
  ));
  const lineCount = layout.split("\n").length;
  assert.ok(lineCount >= 3, `列中心漂移導致過度合併（僅剩 ${lineCount} 列）：\n${layout}`);
  assert.ok(!/第0列.*第4列/su.test(layout.split("\n")[0]), `首列不應吸併到遠處的列：\n${layout}`);
}

// 3. 直向表格：標題與正下方對齊的值要配對輸出。
//    標題與值相隔甚遠且中間夾著其他基線，只能靠 x 對齊判斷。
{
  const layout = await extractPdfLayoutText(fakePdf([
    { str: "礼金", width: 16, height: 8, x: 164, y: 174 },
    ...runOfChars("設備欄位的說明文字", 260, 174),
    ...runOfChars("中間夾雜的其他內容", 0, 158),
    { str: "105", width: 14, height: 8, x: 40, y: 135 },
    { str: "1", width: 5, height: 8, x: 169, y: 135 },
  ]));
  assert.ok(layout.includes("［欄位垂直對位］"), `應輸出垂直對位區塊，實得：\n${layout}`);
  assert.ok(/礼金：1(?!\d)/u.test(layout), `礼金應對位到正下方的 1，實得：\n${layout}`);
}

// 4. 橫向表格不得產生錯誤對位：標題右方緊鄰就有值時，不可再往下抓不相干的值。
{
  const layout = await extractPdfLayoutText(fakePdf([
    { str: "敷金", width: 16, height: 8, x: 100, y: 300 },
    { str: "無", width: 8, height: 8, x: 120, y: 300 },
    { str: "礼金", width: 16, height: 8, x: 160, y: 300 },
    { str: "1ヶ月", width: 24, height: 8, x: 180, y: 300 },
    { str: "間取り", width: 24, height: 8, x: 100, y: 285 },
    { str: "1K", width: 12, height: 8, x: 160, y: 285 },
  ]));
  assert.ok(!layout.includes("礼金：1K"), `橫向表格不得誤把下一列的值對位過來，實得：\n${layout}`);
  assert.ok(!layout.includes("敷金：間取り"), `標籤不得對位到另一個標籤，實得：\n${layout}`);
}

// 5. 沒有文字層（純掃描 PDF）時回空字串，讓上游走送圖的路徑。
{
  assert.equal(await extractPdfLayoutText(fakePdf([])), "");
}

console.log("PDF layout text: column boundaries, row snowball guard, vertical pairing and horizontal safety passed.");
