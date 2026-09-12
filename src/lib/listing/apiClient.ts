import type { AnalyzeListingResult } from './types.js';

export interface EncodedListingFile { mimeType: string; data: string; }
export interface AnalyzeListingRequest {
  files: EncodedListingFile[];
  mode: 'auto' | 'rent' | 'sale';
  layoutText: string;
}
export type ListingLocationRequest =
  | { mode: 'context'; address: string; stations: string[]; advertisedWalkMinutes: Array<number | null> }
  | { mode: 'crime'; address: string }
  | { mode: 'commute'; originStation: string; originWalkMinutes: number | undefined; originAdvertisedMinutes: number | null | undefined; addressContext: string; destination: string };

// Keep response parsing and each workflow's different failure policy at the caller.
export function readListingShare(sharedId: string): Promise<Response> {
  return fetch(`/api/listing-share?id=${encodeURIComponent(sharedId)}`);
}
export function createListingShare(payload: { title: string; result: AnalyzeListingResult }): Promise<Response> {
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
