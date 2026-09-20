import type { TextItem } from "pdfjs-dist/types/src/display/api";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { canvasHasContent, withTimeout } from './fileUtils.js';
import {
  MAX_LAYOUT_TEXT_CHARS,
  MAX_PDF_RENDER_DIMENSION,
  PDF_JPEG_QUALITY,
  PDF_PREVIEW_MAX_DIMENSION,
  PDF_PREVIEW_TIMEOUT_MS,
  PDF_RENDER_TIMEOUT_MS,
} from './uploadConfig.js';
/**
 * 依座標把 PDF 文字層還原成「一行＝圖紙上的一列」的文字。
 *
 * 這類圖紙的費用表在畫面上是整齊的格線，但 PDF 內部的文字順序是散的，
 * 標籤與數值不相鄰，AI 只能猜哪個值屬於哪一列——實測會把敷引讀成「-」、
 * 把礼金讀成「1ヶ月」。還原成正確列序後再交給 AI，對位就穩定正確。
 *
 * 這一步只讀文字層、不需要 canvas 繪製，因此就算渲染失敗也拿得到。
 */
type LayoutItem = { x: number; y: number; width: number; height: number; text: string };
type LayoutRow = { anchorY: number; items: LayoutItem[] };
/** 由字高集合取中位數，作為間距判斷的基準單位；空集合時回退到常見的 8pt 內文。 */
function medianHeight(items: LayoutItem[]): number {
  const heights = items.map(item => item.height).filter(height => height > 0).sort((a, b) => a - b);
  return heights.length ? heights[Math.floor(heights.length / 2)] : 8;
}

/**
 * 依 y 座標把文字項歸列。
 *
 * 容忍度以中位字高推導（夾在 1.5～4pt）：固定 4pt 對小字圖紙太寬鬆，
 * レオパレス 版型實測會把跨 13pt 的 92 個文字項併成一列。
 *
 * 錨點 anchorY 一經建立就不再變動。先前寫成 (row.y + item.y) / 2，列中心會隨
 * 新加入的項目往下漂，於是「剛好差 4pt」的下一列被吸進來、中心再往下移，
 * 滾雪球般把整個表格串成一列。
 */
function groupIntoRows(items: LayoutItem[], unit: number): LayoutRow[] {
  const tolerance = Math.min(4, Math.max(1.5, unit * 0.5));
  const rows: LayoutRow[] = [];
  for (const item of [...items].sort((a, b) => b.y - a.y)) {
    const row = rows.find(candidate => Math.abs(candidate.anchorY - item.y) <= tolerance);
    if (row) row.items.push(item);
    else rows.push({ anchorY: item.y, items: [item] });
  }
  for (const row of rows) row.items.sort((a, b) => a.x - b.x);
  return rows;
}

/**
 * 把一列的文字項接成字串，分隔符依實際 x 間距決定。
 *
 * 先前一律用全形空格連接，但部分圖紙（レオパレス）每個字都是獨立文字項，
 * 結果「■32型液晶テレビ」與「住所：」之間毫無邊界，地址整段黏死無法擷取。
 * 改以間距還原：跨欄插全形雙空格、詞間插半形空格、緊鄰則直接相接。
 */
function renderRow(row: LayoutRow, unit: number): string {
  let line = "";
  row.items.forEach((item, index) => {
    if (index > 0) {
      const previous = row.items[index - 1];
      const gap = item.x - (previous.x + previous.width);
      if (gap > unit * 1.2) line += "　　";
      else if (gap > unit * 0.35) line += " ";
    }
    line += item.text;
  });
  return line;
}

const VERTICAL_LABEL_PATTERN = /^(礼金|礼⾦|敷金|敷⾦|家賃|賃料|共益費|管理費|保証金|保証⾦|償却|敷引|更新料)/u;

/** 把一列切成「以較大間距分隔」的欄位區塊，讓標題與值能以 x 範圍比對。 */
function splitIntoBlocks(row: LayoutRow, unit: number) {
  const blocks: Array<{ text: string; left: number; right: number }> = [];
  for (const item of row.items) {
    const last = blocks[blocks.length - 1];
    if (last && item.x - last.right <= unit * 1.2) {
      last.text += item.text;
      last.right = item.x + item.width;
    } else {
      blocks.push({ text: item.text, left: item.x, right: item.x + item.width });
    }
  }
  return blocks;
}

/**
 * 直向表格的欄位對位：標題列在上、資料列在下，靠 x 範圍重疊配對。
 *
 * レオパレス 版型的「礼金」標題在 y=174.5，值「1」在 y=135，相隔 39pt，
 * 中間還隔著其他基線——任何列合併門檻都併不到一起，唯一線索是 x 座標對齊。
 * 而該圖紙只有「礼金」二字在文字層（其餘標題都是背景圖），所以也無法靠
 * 整列文字推斷。這裡把明確配對出來的結果附在版面文字末尾供 AI 參考。
 *
 * 橫向表格（敷金｜值｜礼金｜值）不受影響：標題右方緊接著就有值，
 * 迴圈只在同列找不到值時才往下找，不會產生錯誤配對。
 */
function buildVerticalPairs(rows: LayoutRow[], unit: number): string[] {
  const rowBlocks = rows.map(row => ({ y: row.anchorY, blocks: splitIntoBlocks(row, unit) }));
  const pairs: string[] = [];
  for (let i = 0; i < rowBlocks.length; i += 1) {
    for (const label of rowBlocks[i].blocks) {
      const labelText = label.text.replace(/\s/gu, "");
      if (!VERTICAL_LABEL_PATTERN.test(labelText)) continue;
      // 標題右側「緊鄰」有值才算橫向表格，交給既有的逐列文字即可。
      // 必須限定距離：レオパレス 版型的「礼金」右方雖然也有文字，但那是隔了
      // 大半頁的設備欄（■TVモニター付インターホン），不是這一格的值。
      if (rowBlocks[i].blocks.some(block =>
        block.left > label.right && block.left - label.right <= unit * 4 && block.text.trim())) continue;
      for (let j = i + 1; j < rowBlocks.length; j += 1) {
        if (rowBlocks[i].y - rowBlocks[j].y > unit * 8) break;
        const hit = rowBlocks[j].blocks.find(block =>
          Math.min(label.right, block.right) - Math.max(label.left, block.left) > -unit * 0.5);
        if (!hit || !hit.text.trim()) continue;
        if (VERTICAL_LABEL_PATTERN.test(hit.text.replace(/\s/gu, ""))) break;
        pairs.push(`${labelText}：${hit.text}`);
        break;
      }
    }
  }
  return [...new Set(pairs)];
}

export async function extractPdfLayoutText(pdf: PDFDocumentProxy): Promise<string> {
  const page = await pdf.getPage(1);
  const content = await page.getTextContent();
  // getTextContent() defaults to includeMarkedContent: false.
  const items: LayoutItem[] = (content.items as TextItem[])
    .map((item) => ({
      x: item.transform[4],
      y: item.transform[5],
      width: item.width ?? 0,
      height: Math.abs(item.transform[3]) || 0,
      text: String(item.str || "").trim(),
    }))
    .filter((item) => item.text);
  if (!items.length) return "";

  const unit = medianHeight(items);
  const rows = groupIntoRows(items, unit);
  const layout = rows.map(row => renderRow(row, unit)).join("\n");
  const pairs = buildVerticalPairs(rows, unit);
  const supplement = pairs.length ? `\n\n［欄位垂直對位］\n${pairs.join("\n")}` : "";
  return (layout + supplement).slice(0, MAX_LAYOUT_TEXT_CHARS);
}


/**
 * 讀 PDF 首頁並產生介面預覽縮圖。多頁 PDF 的完整內容仍由原始 PDF 交給模型；
 * 預覽與額外高解析轉圖只取首頁，避免多頁圖紙倍增瀏覽器記憶體與上傳量。
 *
 * 舊版把「讀長寬比」與「轉縮圖」拆成兩個函式，各自 getDocument 同一個檔案並同時啟動；
 * pdf.js 只有一條 worker，兩份解析互相搶資源，實測レグノ・セレーノ這種滿版日文図面
 * 光是解析就吃掉大半預算，縮圖必然撞上逾時。這裡合併成單次解析：先把長寬比回報出去
 * 讓版面立刻貼合，再接著渲染，省掉一整份重複的解析成本。
 */
export async function renderPdfPreview(
  file: File,
  onAspect?: (aspect: number) => void,
): Promise<{ blobUrl: string; aspect: number } | null> {
  let pdf: Awaited<ReturnType<typeof import("pdfjs-dist")["getDocument"]>["promise"]> | null = null;
  try {
    const [pdfjs, workerModule] = await Promise.all([
      import("pdfjs-dist"),
      import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
    ]);
    pdfjs.GlobalWorkerOptions.workerSrc = workerModule.default;

    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(await file.arrayBuffer()),
      cMapUrl: "/pdfjs/cmaps/",
      cMapPacked: true,
      standardFontDataUrl: "/pdfjs/standard_fonts/",
    });
    pdf = await loadingTask.promise;

    const page = await pdf.getPage(1);
    const baseViewport = page.getViewport({ scale: 1 });
    const aspect = baseViewport.height > 0 ? baseViewport.width / baseViewport.height : 1.414;
    // 長寬比先回報：卡片與對照區可以立刻用正確比例撐開，不必等渲染完成。
    onAspect?.(aspect);

    // 解析度跟送審那份相同（見 PDF_PREVIEW_MAX_DIMENSION 的說明）。
    // 不再用 Math.min(2, …) 封頂：A4 的 PDF 座標長邊約 842pt，scale 2 只有 1,684px，
    // 會讓上面設定的上限形同虛設。
    const scale = PDF_PREVIEW_MAX_DIMENSION / Math.max(baseViewport.width, baseViewport.height);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    const renderTask = page.render({ canvas, viewport, background: "rgb(255,255,255)" });
    try {
      await withTimeout(renderTask.promise, PDF_PREVIEW_TIMEOUT_MS, "PDF 預覽轉圖");
    } catch (error) {
      // 逾時卻不取消，這份渲染會繼續佔著同一條 worker，
      // 接著把送審用的高解析度轉圖一起拖垮。必須主動中止。
      renderTask.cancel();
      throw error;
    }
    page.cleanup();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (!blob) return null;
    return { blobUrl: URL.createObjectURL(blob), aspect };
  } catch (error) {
    console.warn("PDF 預覽轉圖失敗，降級為原生預覽", error);
    return null;
  } finally {
    await pdf?.destroy();
  }
}


export async function renderPdfForUpload(file: File): Promise<{ rendered: { mimeType: string; data: string } | null; layoutText: string }> {
  const [pdfjs, workerModule] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = workerModule.default;

  // 日本圖紙用 CID 編碼的日文字型，少了 CMap 與標準字型會整頁渲染成空白或亂碼。
  // 資源由 scripts/copy-pdfjs-assets.mjs 在 build 前複製到 public/pdfjs/。
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    cMapUrl: "/pdfjs/cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "/pdfjs/standard_fonts/",
  });
  const pdf = await loadingTask.promise;
  // 版面文字先取：它不依賴 canvas，就算後面渲染失敗也要保住這份對位資訊。
  let layoutText = "";
  try {
    layoutText = await extractPdfLayoutText(pdf);
  } catch (error) {
    console.warn("PDF 版面文字還原失敗，僅送圖與原檔。", error);
  }
  try {
    const page = await pdf.getPage(1);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = MAX_PDF_RENDER_DIMENSION / Math.max(baseViewport.width, baseViewport.height);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    const renderTask = page.render({ canvas, viewport, background: "rgb(255,255,255)" });
    try {
      await withTimeout(renderTask.promise, PDF_RENDER_TIMEOUT_MS, "PDF 渲染");
    } catch (error) {
      renderTask.cancel();
      throw error;
    }
    page.cleanup();

    // render() 有可能「成功回傳」卻畫出一張全白的圖：內嵌字型載入失敗時，
    // 部分瀏覽器不是卡死而是靜靜地什麼都不畫。這種空白 JPEG 送到後端，
    // AI 自然讀不出任何欄位，使用者只會看到「無法從這張圖片讀出物件資訊」。
    // 這裡實際檢查畫布內容，空白就視同渲染失敗，改送原始 PDF。
    if (!canvasHasContent(canvas)) {
      throw new Error("PDF 渲染結果為空白畫面");
    }

    const data = canvas.toDataURL("image/jpeg", PDF_JPEG_QUALITY).split(",")[1] ?? "";
    if (!data) throw new Error("PDF canvas encode failed");
    return { rendered: { mimeType: "image/jpeg", data }, layoutText };
  } catch (error) {
    // 渲染失敗不影響已取得的版面文字，照樣回傳給後端當對位依據。
    console.warn("PDF 高解析度轉圖失敗，改以原始 PDF 與版面文字分析。", error);
    return { rendered: null, layoutText };
  } finally {
    await pdf.destroy();
  }
}
