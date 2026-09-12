import { base64Bytes, fileToBase64 } from './fileUtils.js';
import { renderPdfForUpload } from './pdfRendering.js';
import { JPEG_QUALITY, MAX_TOTAL_IMAGE_BYTES, MAX_UPLOAD_DIMENSION } from './uploadConfig.js';
/**
 * PDF 一律以原始檔為底稿送出，能成功轉出的高解析度圖再額外附上。
 *
 * 原因：pdf.js 對某些不動產軟體輸出的 PDF 會卡死或畫出空白，而原始 PDF 交給
 * 後端模型判讀反而穩定（同兩份問題檔案各測三次皆正確讀出欄位）。反過來，
 * 掃描型 PDF 又需要前端高解析度轉圖才能保住小字。兩份一起送就能同時覆蓋
 * 這兩種情況，任一份可讀就不會再出現「無法讀出物件資訊」。
 */
export async function encodeForUpload(file: File): Promise<{ files: Array<{ mimeType: string; data: string }>; layoutText: string }> {
  if (file.type === "application/pdf") {
    const raw = { mimeType: file.type, data: await fileToBase64(file) };
    try {
      const { rendered, layoutText } = await renderPdfForUpload(file);
      if (!rendered) return { files: [raw], layoutText };
      const combinedBytes = base64Bytes(raw.data) + base64Bytes(rendered.data);
      // 超過上傳上限時保留轉出的圖、捨棄原始 PDF。
      // 先前是反過來留 PDF，但實測純掃描 PDF（沒有文字層）只送 PDF 時，Gemini 對它
      // 內部點陣化的解析度不夠，敷金／礼金這種小格子五次裡有四次讀錯；同一頁轉成
      // 2200px JPEG 再送則五次全對。文字層的資訊已由 layoutText 另外帶上，
      // 原始 PDF 在這條路徑上沒有 JPEG 給不了的東西。
      if (combinedBytes > MAX_TOTAL_IMAGE_BYTES) {
        console.warn("PDF 轉圖後總量超過上限，只送轉出的圖與版面文字。");
        return { files: [rendered], layoutText };
      }
      return { files: [rendered, raw], layoutText };
    } catch (error) {
      console.warn("PDF 前處理失敗，只送原始 PDF。", error);
      return { files: [raw], layoutText: "" };
    }
  }
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_UPLOAD_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("canvas 2d context unavailable");
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const data = canvas.toDataURL("image/jpeg", JPEG_QUALITY).split(",")[1] ?? "";
    if (!data) throw new Error("canvas encode failed");
    return { files: [{ mimeType: "image/jpeg", data }], layoutText: "" };
  } catch {
    return { files: [{ mimeType: file.type, data: await fileToBase64(file) }], layoutText: "" };
  }
}
