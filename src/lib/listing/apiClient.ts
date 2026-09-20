import type { AnalyzeListingResult, ListingCommuteResult } from './types.js';

export interface EncodedListingFile { mimeType: string; data: string; }
export interface AnalyzeListingRequest {
  files: EncodedListingFile[];
  mode: 'auto' | 'rent' | 'sale';
  layoutText: string;
}
export type ListingLocationRequest =
  | { mode: 'context'; address: string; stations: string[]; advertisedWalkMinutes: Array<number | null>; stationLines?: string[] }
  | { mode: 'crime'; address: string }
  | { mode: 'commute'; originStation: string; originWalkMinutes: number | undefined; originAdvertisedMinutes: number | null | undefined; originBusMinutes?: number; originBusStop?: string | null; addressContext: string; destination: string };

// Keep response parsing and each workflow's different failure policy at the caller.
export function readListingShare(sharedId: string): Promise<Response> {
  return fetch(`/api/listing-share?id=${encodeURIComponent(sharedId)}`);
}
// 通勤試算跟著分析結果一起送：收件人打開連結時才能看到同一份門到門試算，
// 不必自己再輸入一次目的地。沒試算過就不帶這兩個欄位。
export function createListingShare(payload: {
  title: string;
  result: AnalyzeListingResult;
  commute?: ListingCommuteResult | null;
  commuteDestination?: string;
}): Promise<Response> {
  return fetch('/api/listing-share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
export function requestListingAnalysis(payload: AnalyzeListingRequest): Promise<Response> {
  return fetch('/api/analyze-listing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
export function requestListingLocation(payload: ListingLocationRequest): Promise<Response> {
  return fetch('/api/listing-location', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
