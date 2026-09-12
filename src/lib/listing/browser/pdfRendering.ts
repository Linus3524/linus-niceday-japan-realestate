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
export async function extractPdfLayoutText(pdf: PDFDocumentProxy): Promise<string> {
  const page = await pdf.getPage(1);
  const content = await page.getTextContent();
  // getTextContent() defaults to includeMarkedContent: false.
  const items = (content.items as TextItem[])
    .map((item) => ({ x: item.transform[4], y: item.transform[5], text: String(item.str || "").trim() }))
    .filter((item: { text: string }) => item.text);

  const rows: Array<{ y: number; items: Array<{ x: number; text: string }> }> = [];
  for (const item of items.sort((a, b) => b.y - a.y)) {
    // 同一列的字有輕微高低差（例如 586.2 與 584.5），4pt 內視為同列；
    // 相鄰兩列間距約 7pt 以上，不會誤併。
    const row = rows.find(candidate => Math.abs(candidate.y - item.y) <= 4);
    if (row) {
      row.items.push(item);
      row.y = (row.y + item.y) / 2;
    } else {
      rows.push({ y: item.y, items: [item] });
    }
  }
  return rows
    .map(row => row.items.sort((a, b) => a.x - b.x).map(item => item.text).join("　"))
    .join("\n")
    .slice(0, MAX_LAYOUT_TEXT_CHARS);
}


/**
 * 讀 PDF 首頁並產生介面預覽縮圖。
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
