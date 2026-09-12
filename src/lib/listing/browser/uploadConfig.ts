
/**
 * 物件圖紙分析：上傳仲介提供的物件概要書／図面（單張圖紙或 PDF），
 * 支援「租賃圖紙」與「買賣圖紙」，深度萃取金額與特約條款，
 * 進行行情比對、每坪單價、持有負擔與大樓修繕基金合理性診斷、
 * 初期費用預測試算、實際步行與周邊機能檢驗。
 */

// 改為單張圖紙上傳：日本不動產物件概要書（マイソク / Maisoku）絕大多數均為單頁橫式（A4/B4），
// 單張上傳能避免順序錯亂、縮短辨識等待時間，並大幅簡化使用者操作體驗。
export const MAX_FILES = 1;

export const MAX_TOTAL_IMAGE_BYTES = 3 * 1024 * 1024;

export const ACCEPTED_MIME_TYPES = "image/*,application/pdf";

export const MAX_UPLOAD_DIMENSION = 2000;

export const JPEG_QUALITY = 0.8;

// Gemini 直接讀取掃描型 PDF 時，可能先以較低解析度將整頁光柵化，導致細字誤讀。
// 先在瀏覽器將單頁圖紙轉成約 180 DPI（A4 橫式長邊約 2,100px）的 JPEG，
// 能保留小字，同時控制上傳量與圖片 token。
export const MAX_PDF_RENDER_DIMENSION = 2200;

export const PDF_JPEG_QUALITY = 0.88;

// 部分 PDF（常見於特定不動產軟體輸出的內嵌日文字型）會讓 pdf.js 的
// page.render() 永遠不 resolve、也不 reject——不是「渲染很慢」，是真的卡死。
// 這種情況 try/catch 完全攔不到，使用者會看到分析永遠轉圈。
// 用逾時把它視同渲染失敗，走既有的「改送原始 PDF」備援路徑。
export const PDF_RENDER_TIMEOUT_MS = 10000;

// 這張預覽圖不只餵 84px 的小縮圖，也是整寬「原始圖紙對照」區的主體。
// 那一區在桌機可達約 1,900 CSS px、Retina 再乘 2，先前用 900px 等於放大四倍，
// 使用者要核對的正是敷金／礼金這種小格子，糊掉就失去對照的意義。
// 與送審那份同解析度（約 180 DPI），代價是多一次同等級的渲染。
export const PDF_PREVIEW_MAX_DIMENSION = MAX_PDF_RENDER_DIMENSION;

// 縮圖轉不出來就退回原生 PDF 預覽，等太久只是讓使用者對著轉圈發呆。
// 逾時與送審那份一致：兩者現在是同一個解析度，沒理由給不同的耐心。
export const PDF_PREVIEW_TIMEOUT_MS = PDF_RENDER_TIMEOUT_MS;

// 還原後的版面文字長度上限，避免異常大的圖紙把請求撐爆。
export const MAX_LAYOUT_TEXT_CHARS = 6000;
