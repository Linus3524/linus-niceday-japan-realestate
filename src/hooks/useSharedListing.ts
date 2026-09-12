import { useEffect } from "react";
import {
  readListingShare
} from '../lib/listing/apiClient';
import type { AnalyzeListingResult, ListingHealthCheckProps } from '../lib/listing/types';
import { trackAction } from "../lib/trackView";
import type { ListingState } from './useListingState';

type Context = Pick<ListingState,
  "requests" |
  "setLoading"
  | "setError"
  | "setSharedTitle"
  | "setSharedExpiresAt"
  | "setResult"> & Pick<ListingHealthCheckProps,
    "sharedId"> & {
      resetReport: () => void;
      loadLocationContext: (analysis: AnalyzeListingResult) => Promise<void>;
    };

/** 分享資料讀取與 effect 清理；維持原 sharedId 依賴。 */
export function useSharedListing(context: Context) {
  const { requests, resetReport, sharedId, setLoading, setError, setSharedTitle, setSharedExpiresAt, setResult, loadLocationContext } = context;

  // 分享頁：掛載時讀取已存的分析結果。只讀一次，ID 不會在頁面存活期間改變。
  useEffect(() => {
    if (!sharedId) return;
    resetReport();
    const task = requests.begin("analysis");
    let cancelled = false;
    setLoading(true);
    setError(null);
    readListingShare(sharedId)
      .then(async response => {
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.error || `讀取分享連結失敗（HTTP ${response.status}）。`);
        return body;
      })
      .then(body => {
        if (cancelled || !task.current()) return;
        const analysis = body?.result as AnalyzeListingResult;
        setSharedTitle(typeof body?.title === "string" ? body.title : null);
        setSharedExpiresAt(typeof body?.expiresAt === "string" ? body.expiresAt : null);
        setResult(analysis);
        void loadLocationContext(analysis);
        trackAction("listing-share-view");
      })
      .catch(err => {
        if (!cancelled && task.current()) setError(err?.message || "讀取分享連結失敗。");
      })
      .finally(() => {
        if (!cancelled && task.current()) setLoading(false);
        task.finish();
      });
    return () => {
      cancelled = true;
      requests.invalidateAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedId]);
  return {};
}
