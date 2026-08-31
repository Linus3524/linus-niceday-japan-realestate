import type { LayoutCode } from "./housingMarket.js";

export interface MlitBuySnapshotRow {
  region: string;
  district: string;
  layout: LayoutCode;
  medianTradePriceYen: number;
  sampleCount: number;
  periodStart: string;
  periodEnd: string;
  sourceUrl: string;
}

// This file is intentionally empty until the API application is approved and
// scripts/update-mlit-buy-data.ts is run with a server-side API key.
export const mlitBuySnapshotMeta = {
  generatedAt: null as string | null,
  sourceId: "mlit-reinfolib" as const,
  status: "pending_api_approval" as "pending_api_approval" | "ready",
  methodology: "中古マンション等の成約・取引価格を行政区・間取り別に集計した中央値",
  sourceUrl: "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
};

export const mlitBuySnapshots: MlitBuySnapshotRow[] = [];
