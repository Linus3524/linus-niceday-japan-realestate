import type { RentSearchCriteria } from '../rentAnalysis.js';
export type RentAnalysisRequest = { criteria: RentSearchCriteria } | { prompt: string };

// Structured requests retain their local recommendation fallback at the caller.
export function requestRentAnalysis(payload: RentAnalysisRequest): Promise<Response> {
  return fetch('/api/rent-analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
