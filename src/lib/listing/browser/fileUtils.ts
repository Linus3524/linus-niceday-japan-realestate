
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(reader.error);
  });
}


export function base64Bytes(base64: string): number {
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}


export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} 逾時（${ms}ms）`)), ms);
    promise.then(
      value => { clearTimeout(timer); resolve(value); },
      error => { clearTimeout(timer); reject(error); }
    );
  });
}


/**
 * 判斷畫布是不是一片空白。取樣間隔取質數，避免剛好與規律的表格線對齊而誤判。
 * 實際的物件概要書滿版都是文字、表格與照片，非白像素遠高於門檻；
 * 渲染失敗的空白頁則趨近於 0。
 */
export function canvasHasContent(canvas: HTMLCanvasElement): boolean {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return false;
  let pixels: Uint8ClampedArray;
  try {
    pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  } catch {
    // 讀不到像素時不要因此擋掉正常流程，交給後續步驟判斷。
    return true;
  }
  let sampled = 0;
  let inked = 0;
  for (let i = 0; i < pixels.length; i += 4 * 17) {
    sampled++;
    if (pixels[i] < 245 || pixels[i + 1] < 245 || pixels[i + 2] < 245) inked++;
  }
  return sampled > 0 && inked / sampled > 0.005;
}
