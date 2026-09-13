import { useEffect, type ChangeEvent, type DragEvent } from "react";
import { renderPdfPreview } from '../lib/listing/browser/pdfRendering';
import type { ListingState } from './useListingState';

type Context = Pick<ListingState,
  "requests" |
  "showFullPreview"
  | "setShowFullPreview"
  | "previewUrl"
  | "previewImageUrl"
  | "setError"
  | "setResult"
  | "setLocationContext"
  | "setCommute"
  | "setCrimeData"
  | "setPrefectureSafety"
  | "setFile"
  | "setPreviewUrl"
  | "setPreviewImageUrl"
  | "setPreviewAspect"
  | "setPreviewState"
  | "setIsDragging"> & { resetReport: () => void };

/** 選檔、拖放、預覽與 object URL 清理；保留原生命週期行為。 */
export function useListingPreview(context: Context) {
  const {
    requests,
    resetReport,
    showFullPreview,
    setShowFullPreview,
    previewUrl,
    previewImageUrl,
    setError,
    setResult,
    setLocationContext,
    setCommute,
    setCrimeData,
    setPrefectureSafety,
    setFile,
    setPreviewUrl,
    setPreviewImageUrl,
    setPreviewAspect,
    setPreviewState,
    setIsDragging,
  } = context;

  // 全螢幕檢視時支援 Esc 關閉
  useEffect(() => {
    if (!showFullPreview) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowFullPreview(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showFullPreview]);

  // 原檔與縮圖各自管理生命週期；縮圖完成不可釋放仍供 PDF 檢視器使用的原檔。
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => () => {
    if (previewImageUrl) URL.revokeObjectURL(previewImageUrl);
  }, [previewImageUrl]);

  const selectSingleFile = (selectedFile: File) => {
    requests.invalidateAll();
    resetReport();
    const task = requests.begin("preview");
    setError(null);
    setResult(null);
    setLocationContext(null);
    setCommute(null);
    setCrimeData(null);
    setPrefectureSafety(null);

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (previewImageUrl && previewImageUrl !== previewUrl) URL.revokeObjectURL(previewImageUrl);

    setFile(selectedFile);
    setShowFullPreview(false);

    const isPdf = selectedFile.type === "application/pdf";
    const isImg = selectedFile.type.startsWith("image/");

    if (isImg) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      setPreviewImageUrl(url);
      setPreviewAspect(null);
      setPreviewState("ready");
      const img = new Image();
      img.onload = () => {
        if (task.current() && img.naturalHeight > 0) {
          setPreviewAspect(img.naturalWidth / img.naturalHeight);
        }
      };
      img.src = url;
    } else if (isPdf) {
      const rawUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(rawUrl);
      setPreviewImageUrl(null);
      setPreviewAspect(null);

      // 單次解析：先回報長寬比讓版面立刻貼合，再背景轉出圖片預覽
      //（消除瀏覽器原生 PDF 檢視器的黑色空底與控制列）。
      setPreviewState("rendering");
      void renderPdfPreview(selectedFile, (aspect) => {
        if (task.current()) setPreviewAspect(aspect);
      }).then((rendered) => {
        if (!task.current()) {
          if (rendered) URL.revokeObjectURL(rendered.blobUrl);
          return;
        }
        if (rendered) {
          setPreviewImageUrl(rendered.blobUrl);
          setPreviewAspect(rendered.aspect);
          setPreviewState("ready");
        } else {
          // 轉圖失敗時要明確結束載入狀態，否則縮圖會永遠停在轉圈。
          // previewUrl 仍是原始 PDF，改用瀏覽器原生預覽當縮圖即可。
          setPreviewState("failed");
        }
      }).catch(() => {
        if (task.current()) setPreviewState("failed");
      });
    } else {
      setPreviewUrl(null);
      setPreviewImageUrl(null);
      setPreviewAspect(null);
      setPreviewState("idle");
    }
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];
    if (picked) selectSingleFile(picked);
    event.target.value = "";
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) selectSingleFile(dropped);
  };

  const removeFile = () => {
    requests.invalidateAll();
    resetReport();
    setShowFullPreview(false);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (previewImageUrl && previewImageUrl !== previewUrl) URL.revokeObjectURL(previewImageUrl);
    setFile(null);
    setPreviewUrl(null);
    setPreviewImageUrl(null);
    setPreviewAspect(null);
    setPreviewState("idle");
    setResult(null);
    setLocationContext(null);
    setCommute(null);
    setCrimeData(null);
    setPrefectureSafety(null);
    setError(null);
  };
  return {
    handleFileSelect,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    removeFile,
  };
}
