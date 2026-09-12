import { useListingRequests } from "./useListingRequests";
import { useRef, useState } from "react";
import type { CrimeSafetyResult, PrefectureSafetyResult } from "../lib/crimeSafety";
import type { AnalyzeListingResult, ListingCommuteResult } from '../lib/listing/types';
import type { ListingLocationContext } from "../lib/listingLocation";

/** 圖紙流程共用 state；保留原初始值與 hook 呼叫順序。 */
export function useListingState() {

  const [sharedTitle, setSharedTitle] = useState<string | null>(null);
  const [sharedExpiresAt, setSharedExpiresAt] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [previewAspect, setPreviewAspect] = useState<number | null>(null);
  // "idle"｜"rendering"（轉縮圖中）｜"ready"｜"failed"（轉圖失敗，改用原生 PDF 預覽）
  const [previewState, setPreviewState] = useState<"idle" | "rendering" | "ready" | "failed">("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeListingResult | null>(null);
  const [analysisMode, setAnalysisMode] = useState<"auto" | "rent" | "sale">("auto");
  const [locationContext, setLocationContext] = useState<ListingLocationContext | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [commuteDestination, setCommuteDestination] = useState("");
  const [commuteLoading, setCommuteLoading] = useState(false);
  const [commuteError, setCommuteError] = useState<string | null>(null);
  const [commute, setCommute] = useState<ListingCommuteResult | null>(null);
  const [shareTitle, setShareTitle] = useState("");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [showInitialCostDetails, setShowInitialCostDetails] = useState(true);
  const [showSaleCostsDetails, setShowSaleCostsDetails] = useState(true);
  const [crimeData, setCrimeData] = useState<CrimeSafetyResult | null>(null);
  const [prefectureSafety, setPrefectureSafety] = useState<PrefectureSafetyResult | null>(null);
  const [crimeLoading, setCrimeLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const requests = useListingRequests();
  return {
    requests,
    sharedTitle,
    setSharedTitle,
    sharedExpiresAt,
    setSharedExpiresAt,
    file,
    setFile,
    previewUrl,
    setPreviewUrl,
    previewImageUrl,
    setPreviewImageUrl,
    showFullPreview,
    setShowFullPreview,
    previewAspect,
    setPreviewAspect,
    previewState,
    setPreviewState,
    isDragging,
    setIsDragging,
    loading,
    setLoading,
    error,
    setError,
    result,
    setResult,
    analysisMode,
    setAnalysisMode,
    locationContext,
    setLocationContext,
    locationLoading,
    setLocationLoading,
    locationError,
    setLocationError,
    commuteDestination,
    setCommuteDestination,
    commuteLoading,
    setCommuteLoading,
    commuteError,
    setCommuteError,
    commute,
    setCommute,
    shareTitle,
    setShareTitle,
    shareUrl,
    setShareUrl,
    shareLoading,
    setShareLoading,
    shareError,
    setShareError,
    shareCopied,
    setShareCopied,
    pdfLoading,
    setPdfLoading,
    pdfError,
    setPdfError,
    showInitialCostDetails,
    setShowInitialCostDetails,
    showSaleCostsDetails,
    setShowSaleCostsDetails,
    crimeData,
    setCrimeData,
    prefectureSafety,
    setPrefectureSafety,
    crimeLoading,
    setCrimeLoading,
    inputRef,
  };
}
export type ListingState = ReturnType<typeof useListingState>;
