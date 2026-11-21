/**
 * 手機照片上傳前先縮小：長邊 2400px、JPEG 品質 0.85，通常 0.5–1.5MB，文字仍清楚。
 * PDF 與已經夠小的圖檔原樣上傳；瀏覽器解不開的格式（例如部分 HEIC）也原樣上傳，交給伺服器判斷大小。
 */

const MAX_EDGE = 2400;
const KEEP_BELOW_BYTES = 1.5 * 1024 * 1024;

export async function prepareUpload(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) return file;
  if (file.size <= KEEP_BELOW_BYTES && (file.type === "image/jpeg" || file.type === "image/png")) return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", 0.85));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

export function uploadName(file: File, prepared: Blob) {
  if (prepared === file) return file.name;
  return file.name.replace(/\.[^.]+$/, "") + ".jpg";
}
