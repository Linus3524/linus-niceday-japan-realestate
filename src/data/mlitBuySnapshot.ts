import type { LayoutCode } from "./housingMarket.js";
import type { MlitBuyAgeBand } from "./buyMarket.js";

export interface MlitBuyAgeBandSnapshot {
  medianSqmPriceYen: number;
  sampleCount: number;
}

export interface MlitBuySnapshotRow {
  region: string;
  district: string;
  layout: LayoutCode;
  medianTradePriceYen: number;
  medianSqmPriceYen: number;
  medianAreaSqm: number;
  ageBands: Partial<Record<MlitBuyAgeBand, MlitBuyAgeBandSnapshot>>;
  buildingYearSampleCount: number;
  structureCounts: Record<string, number>;
  sampleCount: number;
  windowQuarters: 4 | 8;
  periodStart: string;
  periodEnd: string;
  sourceUrl: string;
}

export const mlitBuySnapshotMeta = {
  generatedAt: "2026-09-05" as string | null,
  latestPeriod: "2026-Q1",
  sourceId: "mlit-reinfolib" as const,
  status: "ready" as "pending_api_approval" | "ready",
  methodology: "全47都道府県の中古マンション等を市区町村・間取り別に集計。面積がある場合は㎡単価、築年が5件以上ある場合は同築年帯㎡単価を優先し、不足時は同区同間取りへ回退。近4四半期優先・不足時近8四半期",
  prefectureCount: 47,
  municipalityCount: 506,
  sourceFieldCoverage: { buildingYear: true, structure: true, timeToNearestStation: false, unitPriceDerivedWhenMissing: true },
  sourceUrl: "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
};

export const mlitBuySnapshots: MlitBuySnapshotRow[] = [
  {
    "region": "愛知",
    "district": "あま市",
    "layout": "ldk3",
    "medianTradePriceYen": 12000000,
    "medianSqmPriceYen": 150000,
    "medianAreaSqm": 75,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 2
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "みよし市",
    "layout": "ldk3",
    "medianTradePriceYen": 16000000,
    "medianSqmPriceYen": 246000,
    "medianAreaSqm": 80,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "愛知郡東郷町",
    "layout": "ldk3",
    "medianTradePriceYen": 16000000,
    "medianSqmPriceYen": 160000,
    "medianAreaSqm": 75,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "安城市",
    "layout": "ldk2",
    "medianTradePriceYen": 17500000,
    "medianSqmPriceYen": 250000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 2
    },
    "sampleCount": 8,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "安城市",
    "layout": "ldk3",
    "medianTradePriceYen": 23000000,
    "medianSqmPriceYen": 280000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 376000,
        "sampleCount": 5
      },
      "age_21_30": {
        "medianSqmPriceYen": 307000,
        "sampleCount": 9
      },
      "age_31_40": {
        "medianSqmPriceYen": 246000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 26,
    "structureCounts": {
      "ＲＣ": 6,
      "ＳＲＣ": 3
    },
    "sampleCount": 28,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "一宮市",
    "layout": "ldk2",
    "medianTradePriceYen": 9800000,
    "medianSqmPriceYen": 139000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 3
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "一宮市",
    "layout": "ldk3",
    "medianTradePriceYen": 15000000,
    "medianSqmPriceYen": 188000,
    "medianAreaSqm": 73,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 282000,
        "sampleCount": 5
      },
      "age_21_30": {
        "medianSqmPriceYen": 173000,
        "sampleCount": 22
      },
      "age_31_40": {
        "medianSqmPriceYen": 165000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 36,
    "structureCounts": {
      "ＲＣ": 23,
      "ＳＲＣ": 13
    },
    "sampleCount": 36,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "稲沢市",
    "layout": "ldk3",
    "medianTradePriceYen": 14500000,
    "medianSqmPriceYen": 188000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 360000,
        "sampleCount": 5
      },
      "age_21_30": {
        "medianSqmPriceYen": 163000,
        "sampleCount": 7
      },
      "age_31_40": {
        "medianSqmPriceYen": 138000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 20,
    "structureCounts": {
      "ＲＣ": 15,
      "ＳＲＣ": 4
    },
    "sampleCount": 20,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "岡崎市",
    "layout": "ldk2",
    "medianTradePriceYen": 13000000,
    "medianSqmPriceYen": 236000,
    "medianAreaSqm": 60,
    "ageBands": {},
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 5
    },
    "sampleCount": 9,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q2",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "岡崎市",
    "layout": "ldk3",
    "medianTradePriceYen": 16000000,
    "medianSqmPriceYen": 213000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 427000,
        "sampleCount": 7
      },
      "age_11_20": {
        "medianSqmPriceYen": 331000,
        "sampleCount": 6
      },
      "age_21_30": {
        "medianSqmPriceYen": 238000,
        "sampleCount": 15
      },
      "age_31_40": {
        "medianSqmPriceYen": 172000,
        "sampleCount": 16
      }
    },
    "buildingYearSampleCount": 47,
    "structureCounts": {
      "ＳＲＣ": 18,
      "ＲＣ": 30
    },
    "sampleCount": 52,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "海部郡蟹江町",
    "layout": "ldk3",
    "medianTradePriceYen": 17500000,
    "medianSqmPriceYen": 233000,
    "medianAreaSqm": 75,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 6
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "刈谷市",
    "layout": "ldk3",
    "medianTradePriceYen": 19000000,
    "medianSqmPriceYen": 243000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 350000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 12,
    "structureCounts": {
      "ＲＣ": 7,
      "ＳＲＣ": 6
    },
    "sampleCount": 13,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "岩倉市",
    "layout": "ldk3",
    "medianTradePriceYen": 17000000,
    "medianSqmPriceYen": 189000,
    "medianAreaSqm": 85,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 176000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＲＣ": 6,
      "ＳＲＣ": 5
    },
    "sampleCount": 11,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "犬山市",
    "layout": "ldk3",
    "medianTradePriceYen": 15000000,
    "medianSqmPriceYen": 200000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 259000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＲＣ": 6,
      "ＳＲＣ": 5
    },
    "sampleCount": 11,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "江南市",
    "layout": "ldk2",
    "medianTradePriceYen": 12000000,
    "medianSqmPriceYen": 200000,
    "medianAreaSqm": 60,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 3,
      "ＳＲＣ": 2
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q4",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "江南市",
    "layout": "ldk3",
    "medianTradePriceYen": 9700000,
    "medianSqmPriceYen": 135000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 118000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＲＣ": 3,
      "ＳＲＣ": 6
    },
    "sampleCount": 9,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "春日井市",
    "layout": "ldk2",
    "medianTradePriceYen": 14500000,
    "medianSqmPriceYen": 233000,
    "medianAreaSqm": 63,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 6,
      "ＳＲＣ": 1
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "春日井市",
    "layout": "ldk3",
    "medianTradePriceYen": 17000000,
    "medianSqmPriceYen": 224000,
    "medianAreaSqm": 78,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 231000,
        "sampleCount": 14
      },
      "age_31_40": {
        "medianSqmPriceYen": 186000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 29,
    "structureCounts": {
      "ＳＲＣ": 12,
      "ＲＣ": 16,
      "木造": 1
    },
    "sampleCount": 30,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "小牧市",
    "layout": "ldk2",
    "medianTradePriceYen": 11000000,
    "medianSqmPriceYen": 157000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 2
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q2",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "小牧市",
    "layout": "ldk3",
    "medianTradePriceYen": 14000000,
    "medianSqmPriceYen": 165000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 188000,
        "sampleCount": 11
      }
    },
    "buildingYearSampleCount": 17,
    "structureCounts": {
      "ＲＣ": 11,
      "ＳＲＣ": 6
    },
    "sampleCount": 17,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "瀬戸市",
    "layout": "ldk2",
    "medianTradePriceYen": 6500000,
    "medianSqmPriceYen": 118000,
    "medianAreaSqm": 60,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 3
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "瀬戸市",
    "layout": "ldk3",
    "medianTradePriceYen": 13000000,
    "medianSqmPriceYen": 169000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 157000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＲＣ": 7,
      "ＳＲＣ": 6
    },
    "sampleCount": 13,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "清須市",
    "layout": "ldk3",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 243000,
    "medianAreaSqm": 75,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 5
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "西尾市",
    "layout": "ldk3",
    "medianTradePriceYen": 12000000,
    "medianSqmPriceYen": 165000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 143000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 4
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "大府市",
    "layout": "ldk3",
    "medianTradePriceYen": 18000000,
    "medianSqmPriceYen": 191000,
    "medianAreaSqm": 88,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 2
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "知多郡東浦町",
    "layout": "ldk3",
    "medianTradePriceYen": 18500000,
    "medianSqmPriceYen": 240000,
    "medianAreaSqm": 75,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 1
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "知多郡南知多町",
    "layout": "ldk1",
    "medianTradePriceYen": 6500000,
    "medianSqmPriceYen": 144000,
    "medianAreaSqm": 45,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 144000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＳＲＣ": 6,
      "ＲＣ": 1
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "知多郡南知多町",
    "layout": "ldk2",
    "medianTradePriceYen": 8300000,
    "medianSqmPriceYen": 125000,
    "medianAreaSqm": 65,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 121000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＲＣ": 3,
      "ＳＲＣ": 5
    },
    "sampleCount": 8,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "知多市",
    "layout": "ldk2",
    "medianTradePriceYen": 2000000,
    "medianSqmPriceYen": 44000,
    "medianAreaSqm": 45,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 44000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "知多市",
    "layout": "ldk3",
    "medianTradePriceYen": 9300000,
    "medianSqmPriceYen": 128000,
    "medianAreaSqm": 73,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 4
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "知立市",
    "layout": "ldk3",
    "medianTradePriceYen": 22000000,
    "medianSqmPriceYen": 288000,
    "medianAreaSqm": 75,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ、鉄骨造": 1,
      "ＲＣ": 3,
      "ＳＲＣ": 1
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "長久手市",
    "layout": "ldk2",
    "medianTradePriceYen": 25000000,
    "medianSqmPriceYen": 417000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 467000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 4
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "長久手市",
    "layout": "ldk3",
    "medianTradePriceYen": 33000000,
    "medianSqmPriceYen": 414000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 449000,
        "sampleCount": 6
      },
      "age_11_20": {
        "medianSqmPriceYen": 414000,
        "sampleCount": 11
      },
      "age_21_30": {
        "medianSqmPriceYen": 288000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 25,
    "structureCounts": {
      "ＲＣ": 19,
      "ＳＲＣ": 6
    },
    "sampleCount": 25,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "津島市",
    "layout": "ldk3",
    "medianTradePriceYen": 14000000,
    "medianSqmPriceYen": 169000,
    "medianAreaSqm": 80,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＳＲＣ": 3,
      "ＲＣ": 3
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "東海市",
    "layout": "ldk3",
    "medianTradePriceYen": 25500000,
    "medianSqmPriceYen": 300000,
    "medianAreaSqm": 80,
    "ageBands": {},
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＲＣ": 8,
      "ＳＲＣ": 2
    },
    "sampleCount": 10,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "日進市",
    "layout": "ldk3",
    "medianTradePriceYen": 23000000,
    "medianSqmPriceYen": 306000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 306000,
        "sampleCount": 11
      }
    },
    "buildingYearSampleCount": 21,
    "structureCounts": {
      "ＲＣ": 11,
      "ＳＲＣ": 10
    },
    "sampleCount": 21,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "半田市",
    "layout": "ldk3",
    "medianTradePriceYen": 14000000,
    "medianSqmPriceYen": 186000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 175000,
        "sampleCount": 7
      },
      "age_31_40": {
        "medianSqmPriceYen": 94000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 17,
    "structureCounts": {
      "ＳＲＣ": 5,
      "ＲＣ": 12
    },
    "sampleCount": 17,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "尾張旭市",
    "layout": "ldk2",
    "medianTradePriceYen": 5600000,
    "medianSqmPriceYen": 105000,
    "medianAreaSqm": 50,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 1
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "尾張旭市",
    "layout": "ldk3",
    "medianTradePriceYen": 13000000,
    "medianSqmPriceYen": 176000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 133000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 14,
    "structureCounts": {
      "ＳＲＣ": 9,
      "ＲＣ": 5
    },
    "sampleCount": 14,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "豊橋市",
    "layout": "ldk2",
    "medianTradePriceYen": 28000000,
    "medianSqmPriceYen": 414000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 4,
    "structureCounts": {
      "ＲＣ": 4
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "豊橋市",
    "layout": "ldk3",
    "medianTradePriceYen": 14000000,
    "medianSqmPriceYen": 175000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 222000,
        "sampleCount": 5
      },
      "age_21_30": {
        "medianSqmPriceYen": 178000,
        "sampleCount": 7
      },
      "age_31_40": {
        "medianSqmPriceYen": 131000,
        "sampleCount": 14
      }
    },
    "buildingYearSampleCount": 31,
    "structureCounts": {
      "ＲＣ": 23,
      "ＳＲＣ": 9
    },
    "sampleCount": 32,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "豊川市",
    "layout": "ldk3",
    "medianTradePriceYen": 12000000,
    "medianSqmPriceYen": 150000,
    "medianAreaSqm": 80,
    "ageBands": {},
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＲＣ": 8
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "豊明市",
    "layout": "ldk2",
    "medianTradePriceYen": 4800000,
    "medianSqmPriceYen": 107000,
    "medianAreaSqm": 55,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "豊明市",
    "layout": "ldk3",
    "medianTradePriceYen": 8800000,
    "medianSqmPriceYen": 126000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {},
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q4",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "北名古屋市",
    "layout": "ldk2",
    "medianTradePriceYen": 14000000,
    "medianSqmPriceYen": 187000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 1
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q4",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "北名古屋市",
    "layout": "ldk3",
    "medianTradePriceYen": 12000000,
    "medianSqmPriceYen": 160000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 103000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＳＲＣ": 7,
      "ＲＣ": 2
    },
    "sampleCount": 11,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市（市平均）",
    "layout": "k1",
    "medianTradePriceYen": 19000000,
    "medianSqmPriceYen": 850000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 920000,
        "sampleCount": 193
      },
      "age_11_20": {
        "medianSqmPriceYen": 800000,
        "sampleCount": 75
      },
      "age_21_30": {
        "medianSqmPriceYen": 680000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 243000,
        "sampleCount": 22
      },
      "age_41_plus": {
        "medianSqmPriceYen": 210000,
        "sampleCount": 18
      }
    },
    "buildingYearSampleCount": 313,
    "structureCounts": {
      "ＳＲＣ": 40,
      "ＲＣ": 272,
      "鉄骨造": 1
    },
    "sampleCount": 317,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市（市平均）",
    "layout": "ldk1",
    "medianTradePriceYen": 25000000,
    "medianSqmPriceYen": 733000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 825000,
        "sampleCount": 47
      },
      "age_11_20": {
        "medianSqmPriceYen": 733000,
        "sampleCount": 6
      },
      "age_31_40": {
        "medianSqmPriceYen": 267000,
        "sampleCount": 14
      },
      "age_41_plus": {
        "medianSqmPriceYen": 211000,
        "sampleCount": 17
      }
    },
    "buildingYearSampleCount": 85,
    "structureCounts": {
      "ＳＲＣ": 23,
      "ＲＣ": 62
    },
    "sampleCount": 85,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市（市平均）",
    "layout": "ldk2",
    "medianTradePriceYen": 26500000,
    "medianSqmPriceYen": 416000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 717000,
        "sampleCount": 67
      },
      "age_11_20": {
        "medianSqmPriceYen": 616000,
        "sampleCount": 24
      },
      "age_21_30": {
        "medianSqmPriceYen": 414000,
        "sampleCount": 31
      },
      "age_31_40": {
        "medianSqmPriceYen": 246000,
        "sampleCount": 40
      },
      "age_41_plus": {
        "medianSqmPriceYen": 200000,
        "sampleCount": 52
      }
    },
    "buildingYearSampleCount": 214,
    "structureCounts": {
      "ＲＣ": 143,
      "ＳＲＣ": 65
    },
    "sampleCount": 216,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市（市平均）",
    "layout": "ldk3",
    "medianTradePriceYen": 29000000,
    "medianSqmPriceYen": 385000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 703000,
        "sampleCount": 112
      },
      "age_11_20": {
        "medianSqmPriceYen": 514000,
        "sampleCount": 116
      },
      "age_21_30": {
        "medianSqmPriceYen": 360000,
        "sampleCount": 232
      },
      "age_31_40": {
        "medianSqmPriceYen": 258000,
        "sampleCount": 110
      },
      "age_41_plus": {
        "medianSqmPriceYen": 173000,
        "sampleCount": 62
      }
    },
    "buildingYearSampleCount": 632,
    "structureCounts": {
      "ＳＲＣ": 173,
      "ＲＣ": 447
    },
    "sampleCount": 644,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市（市平均）",
    "layout": "r1",
    "medianTradePriceYen": 2300000,
    "medianSqmPriceYen": 147000,
    "medianAreaSqm": 15,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 147000,
        "sampleCount": 57
      }
    },
    "buildingYearSampleCount": 62,
    "structureCounts": {
      "ＲＣ": 52,
      "ＳＲＣ": 10
    },
    "sampleCount": 62,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市港區",
    "layout": "ldk2",
    "medianTradePriceYen": 11000000,
    "medianSqmPriceYen": 183000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 2,
      "ＳＲＣ": 3
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市港區",
    "layout": "ldk3",
    "medianTradePriceYen": 15500000,
    "medianSqmPriceYen": 212000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 272000,
        "sampleCount": 6
      },
      "age_21_30": {
        "medianSqmPriceYen": 210000,
        "sampleCount": 21
      },
      "age_31_40": {
        "medianSqmPriceYen": 173000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 36,
    "structureCounts": {
      "ＳＲＣ": 20,
      "ＲＣ": 16
    },
    "sampleCount": 36,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市守山區",
    "layout": "ldk2",
    "medianTradePriceYen": 6000000,
    "medianSqmPriceYen": 100000,
    "medianAreaSqm": 60,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 3
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市守山區",
    "layout": "ldk3",
    "medianTradePriceYen": 17500000,
    "medianSqmPriceYen": 254000,
    "medianAreaSqm": 73,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 258000,
        "sampleCount": 10
      },
      "age_31_40": {
        "medianSqmPriceYen": 207000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 26,
    "structureCounts": {
      "ＲＣ": 23,
      "ＳＲＣ": 4
    },
    "sampleCount": 28,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市昭和區",
    "layout": "k1",
    "medianTradePriceYen": 11000000,
    "medianSqmPriceYen": 440000,
    "medianAreaSqm": 20,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 3
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市昭和區",
    "layout": "ldk1",
    "medianTradePriceYen": 13000000,
    "medianSqmPriceYen": 308000,
    "medianAreaSqm": 43,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 3,
      "ＳＲＣ": 3
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市昭和區",
    "layout": "ldk2",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 333000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 258000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 17,
    "structureCounts": {
      "ＲＣ": 10,
      "ＳＲＣ": 7
    },
    "sampleCount": 17,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市昭和區",
    "layout": "ldk3",
    "medianTradePriceYen": 37000000,
    "medianSqmPriceYen": 460000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 667000,
        "sampleCount": 7
      },
      "age_11_20": {
        "medianSqmPriceYen": 620000,
        "sampleCount": 12
      },
      "age_21_30": {
        "medianSqmPriceYen": 459000,
        "sampleCount": 17
      },
      "age_31_40": {
        "medianSqmPriceYen": 295000,
        "sampleCount": 9
      },
      "age_41_plus": {
        "medianSqmPriceYen": 257000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 51,
    "structureCounts": {
      "ＳＲＣ": 17,
      "ＲＣ": 33
    },
    "sampleCount": 51,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市昭和區",
    "layout": "r1",
    "medianTradePriceYen": 2300000,
    "medianSqmPriceYen": 153000,
    "medianAreaSqm": 15,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 153000,
        "sampleCount": 19
      }
    },
    "buildingYearSampleCount": 19,
    "structureCounts": {
      "ＲＣ": 19
    },
    "sampleCount": 19,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市瑞穗區",
    "layout": "ldk2",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 267000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 3,
      "ＲＣ": 2
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市瑞穗區",
    "layout": "ldk3",
    "medianTradePriceYen": 35000000,
    "medianSqmPriceYen": 436000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 488000,
        "sampleCount": 9
      },
      "age_21_30": {
        "medianSqmPriceYen": 387000,
        "sampleCount": 15
      }
    },
    "buildingYearSampleCount": 32,
    "structureCounts": {
      "ＲＣ": 23,
      "ＳＲＣ": 8
    },
    "sampleCount": 35,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市瑞穗區",
    "layout": "r1",
    "medianTradePriceYen": 2200000,
    "medianSqmPriceYen": 140000,
    "medianAreaSqm": 15,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 140000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 6
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市西區",
    "layout": "k1",
    "medianTradePriceYen": 19000000,
    "medianSqmPriceYen": 825000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 975000,
        "sampleCount": 12
      },
      "age_11_20": {
        "medianSqmPriceYen": 758000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 22,
    "structureCounts": {
      "ＲＣ": 21,
      "ＳＲＣ": 1
    },
    "sampleCount": 22,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市西區",
    "layout": "ldk1",
    "medianTradePriceYen": 25000000,
    "medianSqmPriceYen": 807000,
    "medianAreaSqm": 35,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 6
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市西區",
    "layout": "ldk2",
    "medianTradePriceYen": 34000000,
    "medianSqmPriceYen": 571000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 933000,
        "sampleCount": 9
      },
      "age_21_30": {
        "medianSqmPriceYen": 364000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 16,
    "structureCounts": {
      "ＲＣ": 12,
      "ＳＲＣ": 4
    },
    "sampleCount": 16,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市西區",
    "layout": "ldk3",
    "medianTradePriceYen": 28000000,
    "medianSqmPriceYen": 371000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 769000,
        "sampleCount": 10
      },
      "age_11_20": {
        "medianSqmPriceYen": 443000,
        "sampleCount": 11
      },
      "age_21_30": {
        "medianSqmPriceYen": 357000,
        "sampleCount": 21
      },
      "age_31_40": {
        "medianSqmPriceYen": 286000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 52,
    "structureCounts": {
      "ＲＣ": 39,
      "ＳＲＣ": 14
    },
    "sampleCount": 53,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市西區",
    "layout": "r1",
    "medianTradePriceYen": 3100000,
    "medianSqmPriceYen": 180000,
    "medianAreaSqm": 15,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 147000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＳＲＣ": 4,
      "ＲＣ": 4
    },
    "sampleCount": 8,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市千種區",
    "layout": "k1",
    "medianTradePriceYen": 19000000,
    "medianSqmPriceYen": 763000,
    "medianAreaSqm": 23,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 767000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 16,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 14
    },
    "sampleCount": 16,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市千種區",
    "layout": "ldk1",
    "medianTradePriceYen": 12500000,
    "medianSqmPriceYen": 278000,
    "medianAreaSqm": 45,
    "ageBands": {},
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＳＲＣ": 3,
      "ＲＣ": 5
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市千種區",
    "layout": "ldk2",
    "medianTradePriceYen": 33000000,
    "medianSqmPriceYen": 583000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 675000,
        "sampleCount": 8
      },
      "age_41_plus": {
        "medianSqmPriceYen": 255000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 21,
    "structureCounts": {
      "ＲＣ": 13,
      "ＳＲＣ": 8
    },
    "sampleCount": 21,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市千種區",
    "layout": "ldk3",
    "medianTradePriceYen": 37000000,
    "medianSqmPriceYen": 463000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 876000,
        "sampleCount": 12
      },
      "age_11_20": {
        "medianSqmPriceYen": 600000,
        "sampleCount": 20
      },
      "age_21_30": {
        "medianSqmPriceYen": 433000,
        "sampleCount": 33
      },
      "age_31_40": {
        "medianSqmPriceYen": 386000,
        "sampleCount": 12
      },
      "age_41_plus": {
        "medianSqmPriceYen": 215000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 82,
    "structureCounts": {
      "ＳＲＣ": 15,
      "ＲＣ": 68
    },
    "sampleCount": 83,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市千種區",
    "layout": "r1",
    "medianTradePriceYen": 2400000,
    "medianSqmPriceYen": 157000,
    "medianAreaSqm": 15,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 157000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 6
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市中川區",
    "layout": "k1",
    "medianTradePriceYen": 25000000,
    "medianSqmPriceYen": 1000000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1000000,
        "sampleCount": 14
      }
    },
    "buildingYearSampleCount": 14,
    "structureCounts": {
      "ＲＣ": 14
    },
    "sampleCount": 14,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市中川區",
    "layout": "ldk1",
    "medianTradePriceYen": 22500000,
    "medianSqmPriceYen": 733000,
    "medianAreaSqm": 33,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 733000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＳＲＣ": 1,
      "ＲＣ": 7
    },
    "sampleCount": 8,
    "windowQuarters": 8,
    "periodStart": "2024-Q4",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市中川區",
    "layout": "ldk2",
    "medianTradePriceYen": 10300000,
    "medianSqmPriceYen": 152000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＲＣ": 7,
      "ＳＲＣ": 3
    },
    "sampleCount": 10,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市中川區",
    "layout": "ldk3",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 277000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 380000,
        "sampleCount": 6
      },
      "age_31_40": {
        "medianSqmPriceYen": 176000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 19,
    "structureCounts": {
      "ＲＣ": 16,
      "ＳＲＣ": 3
    },
    "sampleCount": 19,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市中村區",
    "layout": "k1",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 920000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1000000,
        "sampleCount": 31
      },
      "age_11_20": {
        "medianSqmPriceYen": 750000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 40,
    "structureCounts": {
      "ＲＣ": 38,
      "ＳＲＣ": 3
    },
    "sampleCount": 41,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市中村區",
    "layout": "ldk1",
    "medianTradePriceYen": 22500000,
    "medianSqmPriceYen": 690000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 732000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＲＣ": 7,
      "ＳＲＣ": 3
    },
    "sampleCount": 10,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市中村區",
    "layout": "ldk2",
    "medianTradePriceYen": 31000000,
    "medianSqmPriceYen": 564000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 745000,
        "sampleCount": 7
      },
      "age_31_40": {
        "medianSqmPriceYen": 273000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 15,
    "structureCounts": {
      "ＲＣ": 12,
      "ＳＲＣ": 3
    },
    "sampleCount": 15,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市中村區",
    "layout": "ldk3",
    "medianTradePriceYen": 29000000,
    "medianSqmPriceYen": 387000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 684000,
        "sampleCount": 8
      },
      "age_21_30": {
        "medianSqmPriceYen": 373000,
        "sampleCount": 13
      }
    },
    "buildingYearSampleCount": 28,
    "structureCounts": {
      "ＳＲＣ": 10,
      "ＲＣ": 18
    },
    "sampleCount": 28,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市中區",
    "layout": "k1",
    "medianTradePriceYen": 19000000,
    "medianSqmPriceYen": 850000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 900000,
        "sampleCount": 96
      },
      "age_11_20": {
        "medianSqmPriceYen": 850000,
        "sampleCount": 45
      },
      "age_31_40": {
        "medianSqmPriceYen": 255000,
        "sampleCount": 9
      },
      "age_41_plus": {
        "medianSqmPriceYen": 216000,
        "sampleCount": 11
      }
    },
    "buildingYearSampleCount": 163,
    "structureCounts": {
      "ＲＣ": 140,
      "ＳＲＣ": 21
    },
    "sampleCount": 163,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市中區",
    "layout": "ldk1",
    "medianTradePriceYen": 28000000,
    "medianSqmPriceYen": 827000,
    "medianAreaSqm": 38,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 862000,
        "sampleCount": 32
      },
      "age_41_plus": {
        "medianSqmPriceYen": 311000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 42,
    "structureCounts": {
      "ＲＣ": 33,
      "ＳＲＣ": 9
    },
    "sampleCount": 42,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市中區",
    "layout": "ldk2",
    "medianTradePriceYen": 37000000,
    "medianSqmPriceYen": 673000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 808000,
        "sampleCount": 26
      },
      "age_21_30": {
        "medianSqmPriceYen": 417000,
        "sampleCount": 5
      },
      "age_41_plus": {
        "medianSqmPriceYen": 255000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 41,
    "structureCounts": {
      "ＳＲＣ": 12,
      "ＲＣ": 29
    },
    "sampleCount": 41,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市中區",
    "layout": "ldk3",
    "medianTradePriceYen": 39500000,
    "medianSqmPriceYen": 480000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1053000,
        "sampleCount": 11
      },
      "age_11_20": {
        "medianSqmPriceYen": 588000,
        "sampleCount": 5
      },
      "age_21_30": {
        "medianSqmPriceYen": 434000,
        "sampleCount": 18
      },
      "age_41_plus": {
        "medianSqmPriceYen": 260000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 44,
    "structureCounts": {
      "ＲＣ": 21,
      "ＳＲＣ": 23
    },
    "sampleCount": 44,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市中區",
    "layout": "r1",
    "medianTradePriceYen": 2900000,
    "medianSqmPriceYen": 180000,
    "medianAreaSqm": 15,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 180000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＳＲＣ": 6,
      "ＲＣ": 5
    },
    "sampleCount": 11,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市天白區",
    "layout": "ldk2",
    "medianTradePriceYen": 11000000,
    "medianSqmPriceYen": 157000,
    "medianAreaSqm": 68,
    "ageBands": {},
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 2
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市天白區",
    "layout": "ldk3",
    "medianTradePriceYen": 30500000,
    "medianSqmPriceYen": 400000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 485000,
        "sampleCount": 12
      },
      "age_21_30": {
        "medianSqmPriceYen": 400000,
        "sampleCount": 7
      },
      "age_31_40": {
        "medianSqmPriceYen": 206000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 30,
    "structureCounts": {
      "ＲＣ": 24,
      "ＳＲＣ": 5
    },
    "sampleCount": 30,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市天白區",
    "layout": "r1",
    "medianTradePriceYen": 2100000,
    "medianSqmPriceYen": 140000,
    "medianAreaSqm": 15,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 140000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市東區",
    "layout": "k1",
    "medianTradePriceYen": 18000000,
    "medianSqmPriceYen": 760000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 880000,
        "sampleCount": 18
      },
      "age_11_20": {
        "medianSqmPriceYen": 725000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 33,
    "structureCounts": {
      "ＳＲＣ": 10,
      "ＲＣ": 22,
      "鉄骨造": 1
    },
    "sampleCount": 35,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市東區",
    "layout": "ldk1",
    "medianTradePriceYen": 22000000,
    "medianSqmPriceYen": 552000,
    "medianAreaSqm": 43,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 800000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 12,
    "structureCounts": {
      "ＳＲＣ": 6,
      "ＲＣ": 6
    },
    "sampleCount": 12,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市東區",
    "layout": "ldk2",
    "medianTradePriceYen": 35000000,
    "medianSqmPriceYen": 560000,
    "medianAreaSqm": 65,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 750000,
        "sampleCount": 5
      },
      "age_21_30": {
        "medianSqmPriceYen": 520000,
        "sampleCount": 7
      },
      "age_31_40": {
        "medianSqmPriceYen": 371000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 24,
    "structureCounts": {
      "ＳＲＣ": 13,
      "ＲＣ": 11
    },
    "sampleCount": 24,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市東區",
    "layout": "ldk3",
    "medianTradePriceYen": 42000000,
    "medianSqmPriceYen": 565000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 819000,
        "sampleCount": 20
      },
      "age_11_20": {
        "medianSqmPriceYen": 667000,
        "sampleCount": 9
      },
      "age_21_30": {
        "medianSqmPriceYen": 458000,
        "sampleCount": 14
      },
      "age_41_plus": {
        "medianSqmPriceYen": 181000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 54,
    "structureCounts": {
      "ＲＣ": 34,
      "ＳＲＣ": 21
    },
    "sampleCount": 57,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市東區",
    "layout": "r1",
    "medianTradePriceYen": 3800000,
    "medianSqmPriceYen": 190000,
    "medianAreaSqm": 15,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 5
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市南區",
    "layout": "ldk2",
    "medianTradePriceYen": 5400000,
    "medianSqmPriceYen": 104000,
    "medianAreaSqm": 58,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 82000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＲＣ": 6,
      "ＳＲＣ": 2
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市南區",
    "layout": "ldk3",
    "medianTradePriceYen": 18000000,
    "medianSqmPriceYen": 253000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 413000,
        "sampleCount": 5
      },
      "age_21_30": {
        "medianSqmPriceYen": 272000,
        "sampleCount": 10
      },
      "age_31_40": {
        "medianSqmPriceYen": 123000,
        "sampleCount": 7
      },
      "age_41_plus": {
        "medianSqmPriceYen": 107000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 31,
    "structureCounts": {
      "ＳＲＣ": 10,
      "ＲＣ": 21
    },
    "sampleCount": 31,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市熱田區",
    "layout": "k1",
    "medianTradePriceYen": 18000000,
    "medianSqmPriceYen": 900000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 900000,
        "sampleCount": 14
      }
    },
    "buildingYearSampleCount": 18,
    "structureCounts": {
      "ＲＣ": 18
    },
    "sampleCount": 18,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市熱田區",
    "layout": "ldk1",
    "medianTradePriceYen": 26000000,
    "medianSqmPriceYen": 743000,
    "medianAreaSqm": 38,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 750000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 6
    },
    "sampleCount": 8,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市熱田區",
    "layout": "ldk2",
    "medianTradePriceYen": 29000000,
    "medianSqmPriceYen": 429000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＲＣ": 6,
      "ＳＲＣ": 3
    },
    "sampleCount": 9,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市熱田區",
    "layout": "ldk3",
    "medianTradePriceYen": 26000000,
    "medianSqmPriceYen": 343000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 365000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＲＣ": 9,
      "ＳＲＣ": 4
    },
    "sampleCount": 13,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市熱田區",
    "layout": "r1",
    "medianTradePriceYen": 2200000,
    "medianSqmPriceYen": 147000,
    "medianAreaSqm": 15,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 147000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 3
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市北區",
    "layout": "k1",
    "medianTradePriceYen": 17000000,
    "medianSqmPriceYen": 760000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 840000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 12,
    "structureCounts": {
      "ＲＣ": 12,
      "ＳＲＣ": 1
    },
    "sampleCount": 13,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市北區",
    "layout": "ldk1",
    "medianTradePriceYen": 25000000,
    "medianSqmPriceYen": 833000,
    "medianAreaSqm": 30,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 833000,
        "sampleCount": 15
      }
    },
    "buildingYearSampleCount": 16,
    "structureCounts": {
      "ＲＣ": 16,
      "鉄骨造": 1
    },
    "sampleCount": 17,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q2",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市北區",
    "layout": "ldk2",
    "medianTradePriceYen": 29000000,
    "medianSqmPriceYen": 465000,
    "medianAreaSqm": 63,
    "ageBands": {},
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＲＣ": 10
    },
    "sampleCount": 10,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市北區",
    "layout": "ldk3",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 292000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 338000,
        "sampleCount": 9
      },
      "age_31_40": {
        "medianSqmPriceYen": 271000,
        "sampleCount": 10
      },
      "age_41_plus": {
        "medianSqmPriceYen": 123000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 29,
    "structureCounts": {
      "ＲＣ": 20,
      "ＳＲＣ": 11
    },
    "sampleCount": 31,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市名東區",
    "layout": "k1",
    "medianTradePriceYen": 23000000,
    "medianSqmPriceYen": 920000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 920000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＳＲＣ": 2,
      "鉄骨造": 1,
      "ＲＣ": 6
    },
    "sampleCount": 9,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市名東區",
    "layout": "ldk2",
    "medianTradePriceYen": 13500000,
    "medianSqmPriceYen": 230000,
    "medianAreaSqm": 65,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 200000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 14,
    "structureCounts": {
      "ＲＣ": 13,
      "ＳＲＣ": 1
    },
    "sampleCount": 14,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市名東區",
    "layout": "ldk3",
    "medianTradePriceYen": 31000000,
    "medianSqmPriceYen": 400000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 710000,
        "sampleCount": 12
      },
      "age_11_20": {
        "medianSqmPriceYen": 500000,
        "sampleCount": 10
      },
      "age_21_30": {
        "medianSqmPriceYen": 400000,
        "sampleCount": 18
      },
      "age_31_40": {
        "medianSqmPriceYen": 252000,
        "sampleCount": 8
      },
      "age_41_plus": {
        "medianSqmPriceYen": 161000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 56,
    "structureCounts": {
      "ＲＣ": 49,
      "ＳＲＣ": 6
    },
    "sampleCount": 56,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市名東區",
    "layout": "r1",
    "medianTradePriceYen": 2000000,
    "medianSqmPriceYen": 120000,
    "medianAreaSqm": 15,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 120000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 7
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市綠區",
    "layout": "ldk2",
    "medianTradePriceYen": 7600000,
    "medianSqmPriceYen": 130000,
    "medianAreaSqm": 58,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 46000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＲＣ": 7,
      "ＳＲＣ": 1
    },
    "sampleCount": 12,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "名古屋市綠區",
    "layout": "ldk3",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 232000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 540000,
        "sampleCount": 10
      },
      "age_11_20": {
        "medianSqmPriceYen": 400000,
        "sampleCount": 5
      },
      "age_21_30": {
        "medianSqmPriceYen": 230000,
        "sampleCount": 16
      },
      "age_31_40": {
        "medianSqmPriceYen": 229000,
        "sampleCount": 11
      },
      "age_41_plus": {
        "medianSqmPriceYen": 122000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 49,
    "structureCounts": {
      "ＲＣ": 33,
      "ＳＲＣ": 2
    },
    "sampleCount": 49,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "豐田市",
    "layout": "ldk2",
    "medianTradePriceYen": 20500000,
    "medianSqmPriceYen": 273000,
    "medianAreaSqm": 68,
    "ageBands": {},
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 8
    },
    "sampleCount": 10,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛知",
    "district": "豐田市",
    "layout": "ldk3",
    "medianTradePriceYen": 22000000,
    "medianSqmPriceYen": 273000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 480000,
        "sampleCount": 6
      },
      "age_11_20": {
        "medianSqmPriceYen": 291000,
        "sampleCount": 10
      },
      "age_21_30": {
        "medianSqmPriceYen": 231000,
        "sampleCount": 9
      },
      "age_31_40": {
        "medianSqmPriceYen": 235000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 36,
    "structureCounts": {
      "ＲＣ": 28,
      "ＳＲＣ": 6
    },
    "sampleCount": 38,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛媛",
    "district": "今治市",
    "layout": "ldk3",
    "medianTradePriceYen": 15000000,
    "medianSqmPriceYen": 231000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＲＣ": 7,
      "ＳＲＣ": 1
    },
    "sampleCount": 9,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛媛",
    "district": "松山市",
    "layout": "k1",
    "medianTradePriceYen": 2700000,
    "medianSqmPriceYen": 106000,
    "medianAreaSqm": 23,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 107000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 12,
    "structureCounts": {
      "ＳＲＣ": 4,
      "ＲＣ": 6
    },
    "sampleCount": 12,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛媛",
    "district": "松山市",
    "layout": "ldk1",
    "medianTradePriceYen": 12000000,
    "medianSqmPriceYen": 280000,
    "medianAreaSqm": 45,
    "ageBands": {},
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＳＲＣ": 4,
      "ＲＣ": 5
    },
    "sampleCount": 11,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛媛",
    "district": "松山市",
    "layout": "ldk2",
    "medianTradePriceYen": 16000000,
    "medianSqmPriceYen": 264000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 12,
    "structureCounts": {
      "ＳＲＣ": 5,
      "ＲＣ": 6
    },
    "sampleCount": 14,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛媛",
    "district": "松山市",
    "layout": "ldk3",
    "medianTradePriceYen": 19000000,
    "medianSqmPriceYen": 257000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 536000,
        "sampleCount": 10
      },
      "age_11_20": {
        "medianSqmPriceYen": 337000,
        "sampleCount": 12
      },
      "age_21_30": {
        "medianSqmPriceYen": 262000,
        "sampleCount": 23
      },
      "age_31_40": {
        "medianSqmPriceYen": 136000,
        "sampleCount": 22
      }
    },
    "buildingYearSampleCount": 68,
    "structureCounts": {
      "ＳＲＣ": 28,
      "ＲＣ": 31,
      "鉄骨造": 1
    },
    "sampleCount": 81,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛媛",
    "district": "新居浜市",
    "layout": "ldk3",
    "medianTradePriceYen": 13200000,
    "medianSqmPriceYen": 165000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 2
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "愛媛",
    "district": "西条市",
    "layout": "ldk3",
    "medianTradePriceYen": 14000000,
    "medianSqmPriceYen": 200000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 5
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "茨城",
    "district": "つくばみらい市",
    "layout": "ldk3",
    "medianTradePriceYen": 25000000,
    "medianSqmPriceYen": 333000,
    "medianAreaSqm": 75,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "茨城",
    "district": "ひたちなか市",
    "layout": "ldk3",
    "medianTradePriceYen": 24000000,
    "medianSqmPriceYen": 320000,
    "medianAreaSqm": 75,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 6,
      "ＳＲＣ": 1
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "茨城",
    "district": "牛久市",
    "layout": "ldk2",
    "medianTradePriceYen": 22000000,
    "medianSqmPriceYen": 338000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 2
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "茨城",
    "district": "牛久市",
    "layout": "ldk3",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 275000,
    "medianAreaSqm": 80,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 9,
      "ＳＲＣ": 2
    },
    "sampleCount": 15,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "茨城",
    "district": "取手市",
    "layout": "ldk2",
    "medianTradePriceYen": 5900000,
    "medianSqmPriceYen": 98000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 38000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＲＣ": 8,
      "ＳＲＣ": 3
    },
    "sampleCount": 11,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "茨城",
    "district": "取手市",
    "layout": "ldk3",
    "medianTradePriceYen": 16000000,
    "medianSqmPriceYen": 229000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 14,
    "structureCounts": {
      "ＲＣ": 11,
      "鉄骨造": 3,
      "ＳＲＣ": 1
    },
    "sampleCount": 15,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "茨城",
    "district": "守谷市",
    "layout": "ldk3",
    "medianTradePriceYen": 38000000,
    "medianSqmPriceYen": 480000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 476000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＲＣ": 10
    },
    "sampleCount": 10,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "茨城",
    "district": "水戶市",
    "layout": "ldk1",
    "medianTradePriceYen": 6900000,
    "medianSqmPriceYen": 173000,
    "medianAreaSqm": 40,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 1,
      "ＲＣ": 4
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q2",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "茨城",
    "district": "水戶市",
    "layout": "ldk2",
    "medianTradePriceYen": 16000000,
    "medianSqmPriceYen": 246000,
    "medianAreaSqm": 65,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 276000,
        "sampleCount": 6
      },
      "age_21_30": {
        "medianSqmPriceYen": 246000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＲＣ": 7,
      "ＳＲＣ": 5
    },
    "sampleCount": 13,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "茨城",
    "district": "水戶市",
    "layout": "ldk3",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 247000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 247000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 14,
    "structureCounts": {
      "ＲＣ": 13,
      "ＳＲＣ": 2
    },
    "sampleCount": 15,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "茨城",
    "district": "筑波市",
    "layout": "ldk2",
    "medianTradePriceYen": 28000000,
    "medianSqmPriceYen": 419000,
    "medianAreaSqm": 68,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 354000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＲＣ": 7,
      "ＳＲＣ": 1
    },
    "sampleCount": 8,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "茨城",
    "district": "筑波市",
    "layout": "ldk3",
    "medianTradePriceYen": 44000000,
    "medianSqmPriceYen": 525000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 643000,
        "sampleCount": 15
      },
      "age_11_20": {
        "medianSqmPriceYen": 467000,
        "sampleCount": 13
      }
    },
    "buildingYearSampleCount": 33,
    "structureCounts": {
      "ＲＣ": 32,
      "ＳＲＣ": 1
    },
    "sampleCount": 33,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "茨城",
    "district": "土浦市",
    "layout": "ldk2",
    "medianTradePriceYen": 14500000,
    "medianSqmPriceYen": 233000,
    "medianAreaSqm": 60,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 6
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "茨城",
    "district": "土浦市",
    "layout": "ldk3",
    "medianTradePriceYen": 17500000,
    "medianSqmPriceYen": 228000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 325000,
        "sampleCount": 7
      },
      "age_21_30": {
        "medianSqmPriceYen": 253000,
        "sampleCount": 7
      },
      "age_31_40": {
        "medianSqmPriceYen": 99000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 22,
    "structureCounts": {
      "ＳＲＣ": 6,
      "ＲＣ": 16
    },
    "sampleCount": 22,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "茨城",
    "district": "竜ケ崎市",
    "layout": "ldk3",
    "medianTradePriceYen": 8500000,
    "medianSqmPriceYen": 121000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 118000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＲＣ": 9,
      "ＳＲＣ": 2
    },
    "sampleCount": 11,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "岡山",
    "district": "岡山市",
    "layout": "k1",
    "medianTradePriceYen": 2400000,
    "medianSqmPriceYen": 120000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 120000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 3
    },
    "sampleCount": 9,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "岡山",
    "district": "岡山市",
    "layout": "ldk1",
    "medianTradePriceYen": 19000000,
    "medianSqmPriceYen": 380000,
    "medianAreaSqm": 40,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 2
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "岡山",
    "district": "岡山市",
    "layout": "ldk2",
    "medianTradePriceYen": 17000000,
    "medianSqmPriceYen": 262000,
    "medianAreaSqm": 65,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 323000,
        "sampleCount": 7
      },
      "age_31_40": {
        "medianSqmPriceYen": 165000,
        "sampleCount": 12
      }
    },
    "buildingYearSampleCount": 28,
    "structureCounts": {
      "ＲＣ": 17,
      "ＳＲＣ": 10
    },
    "sampleCount": 29,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "岡山",
    "district": "岡山市",
    "layout": "ldk3",
    "medianTradePriceYen": 25000000,
    "medianSqmPriceYen": 338000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 482000,
        "sampleCount": 15
      },
      "age_11_20": {
        "medianSqmPriceYen": 400000,
        "sampleCount": 15
      },
      "age_21_30": {
        "medianSqmPriceYen": 297000,
        "sampleCount": 24
      },
      "age_31_40": {
        "medianSqmPriceYen": 231000,
        "sampleCount": 11
      }
    },
    "buildingYearSampleCount": 69,
    "structureCounts": {
      "ＲＣ": 53,
      "ＳＲＣ": 13,
      "ＲＣ、鉄骨造": 1
    },
    "sampleCount": 75,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "岡山",
    "district": "岡山市中区",
    "layout": "ldk2",
    "medianTradePriceYen": 17000000,
    "medianSqmPriceYen": 262000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 2,
    "structureCounts": {
      "ＲＣ": 2
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q4",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "岡山",
    "district": "岡山市中区",
    "layout": "ldk3",
    "medianTradePriceYen": 16000000,
    "medianSqmPriceYen": 230000,
    "medianAreaSqm": 75,
    "ageBands": {},
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＲＣ": 8
    },
    "sampleCount": 22,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q2",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "岡山",
    "district": "岡山市南区",
    "layout": "ldk3",
    "medianTradePriceYen": 19000000,
    "medianSqmPriceYen": 240000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 253000,
        "sampleCount": 7
      },
      "age_21_30": {
        "medianSqmPriceYen": 227000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 19,
    "structureCounts": {
      "ＲＣ": 17,
      "ＳＲＣ": 2
    },
    "sampleCount": 21,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "岡山",
    "district": "岡山市北区",
    "layout": "k1",
    "medianTradePriceYen": 2400000,
    "medianSqmPriceYen": 120000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 120000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 3
    },
    "sampleCount": 9,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "岡山",
    "district": "岡山市北区",
    "layout": "ldk1",
    "medianTradePriceYen": 19000000,
    "medianSqmPriceYen": 380000,
    "medianAreaSqm": 40,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 2
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "岡山",
    "district": "岡山市北区",
    "layout": "ldk2",
    "medianTradePriceYen": 16000000,
    "medianSqmPriceYen": 256000,
    "medianAreaSqm": 63,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 323000,
        "sampleCount": 7
      },
      "age_31_40": {
        "medianSqmPriceYen": 155000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 24,
    "structureCounts": {
      "ＲＣ": 13,
      "ＳＲＣ": 10
    },
    "sampleCount": 24,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "岡山",
    "district": "岡山市北区",
    "layout": "ldk3",
    "medianTradePriceYen": 26000000,
    "medianSqmPriceYen": 353000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 508000,
        "sampleCount": 14
      },
      "age_11_20": {
        "medianSqmPriceYen": 407000,
        "sampleCount": 14
      },
      "age_21_30": {
        "medianSqmPriceYen": 297000,
        "sampleCount": 24
      },
      "age_31_40": {
        "medianSqmPriceYen": 240000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 65,
    "structureCounts": {
      "ＲＣ": 49,
      "ＳＲＣ": 13,
      "ＲＣ、鉄骨造": 1
    },
    "sampleCount": 67,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "岡山",
    "district": "倉敷市",
    "layout": "ldk1",
    "medianTradePriceYen": 9000000,
    "medianSqmPriceYen": 200000,
    "medianAreaSqm": 45,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 2,
      "ＳＲＣ": 2
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "岡山",
    "district": "倉敷市",
    "layout": "ldk2",
    "medianTradePriceYen": 13500000,
    "medianSqmPriceYen": 235000,
    "medianAreaSqm": 60,
    "ageBands": {},
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＳＲＣ": 4,
      "ＲＣ": 4
    },
    "sampleCount": 10,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "岡山",
    "district": "倉敷市",
    "layout": "ldk3",
    "medianTradePriceYen": 25000000,
    "medianSqmPriceYen": 320000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 413000,
        "sampleCount": 5
      },
      "age_11_20": {
        "medianSqmPriceYen": 316000,
        "sampleCount": 5
      },
      "age_21_30": {
        "medianSqmPriceYen": 313000,
        "sampleCount": 11
      }
    },
    "buildingYearSampleCount": 25,
    "structureCounts": {
      "ＲＣ": 15,
      "ＳＲＣ": 8
    },
    "sampleCount": 27,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "沖繩",
    "district": "浦添市",
    "layout": "ldk2",
    "medianTradePriceYen": 33000000,
    "medianSqmPriceYen": 550000,
    "medianAreaSqm": 60,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 7
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "沖繩",
    "district": "浦添市",
    "layout": "ldk3",
    "medianTradePriceYen": 38500000,
    "medianSqmPriceYen": 526000,
    "medianAreaSqm": 73,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 615000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 12,
    "structureCounts": {
      "ＲＣ": 11,
      "ＳＲＣ": 1
    },
    "sampleCount": 12,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "沖繩",
    "district": "沖縄市",
    "layout": "ldk2",
    "medianTradePriceYen": 28000000,
    "medianSqmPriceYen": 455000,
    "medianAreaSqm": 60,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "沖繩",
    "district": "沖縄市",
    "layout": "ldk3",
    "medianTradePriceYen": 24500000,
    "medianSqmPriceYen": 352000,
    "medianAreaSqm": 75,
    "ageBands": {},
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＲＣ": 9,
      "ＳＲＣ": 1
    },
    "sampleCount": 10,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "沖繩",
    "district": "那霸市",
    "layout": "k1",
    "medianTradePriceYen": 9500000,
    "medianSqmPriceYen": 475000,
    "medianAreaSqm": 30,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＳＲＣ": 1,
      "ＲＣ": 5
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "沖繩",
    "district": "那霸市",
    "layout": "ldk1",
    "medianTradePriceYen": 16000000,
    "medianSqmPriceYen": 356000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 356000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＲＣ": 10,
      "ＳＲＣ": 1
    },
    "sampleCount": 11,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "沖繩",
    "district": "那霸市",
    "layout": "ldk2",
    "medianTradePriceYen": 30000000,
    "medianSqmPriceYen": 443000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 815000,
        "sampleCount": 7
      },
      "age_31_40": {
        "medianSqmPriceYen": 364000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 23,
    "structureCounts": {
      "ＲＣ": 20,
      "ＳＲＣ": 3
    },
    "sampleCount": 23,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "沖繩",
    "district": "那霸市",
    "layout": "ldk3",
    "medianTradePriceYen": 43000000,
    "medianSqmPriceYen": 564000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 703000,
        "sampleCount": 18
      },
      "age_11_20": {
        "medianSqmPriceYen": 556000,
        "sampleCount": 8
      },
      "age_21_30": {
        "medianSqmPriceYen": 440000,
        "sampleCount": 10
      },
      "age_31_40": {
        "medianSqmPriceYen": 329000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 42,
    "structureCounts": {
      "ＲＣ": 38,
      "ＳＲＣ": 3
    },
    "sampleCount": 42,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "岩手",
    "district": "盛岡市",
    "layout": "k1",
    "medianTradePriceYen": 2500000,
    "medianSqmPriceYen": 98000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 115000,
        "sampleCount": 11
      },
      "age_41_plus": {
        "medianSqmPriceYen": 50000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 16,
    "structureCounts": {
      "ＳＲＣ": 13,
      "ＲＣ": 4
    },
    "sampleCount": 18,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "岩手",
    "district": "盛岡市",
    "layout": "ldk1",
    "medianTradePriceYen": 6900000,
    "medianSqmPriceYen": 170000,
    "medianAreaSqm": 45,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 173000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＳＲＣ": 6
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "岩手",
    "district": "盛岡市",
    "layout": "ldk2",
    "medianTradePriceYen": 16000000,
    "medianSqmPriceYen": 297000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 142000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 19,
    "structureCounts": {
      "ＳＲＣ": 9,
      "ＲＣ": 10
    },
    "sampleCount": 20,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "岩手",
    "district": "盛岡市",
    "layout": "ldk3",
    "medianTradePriceYen": 22000000,
    "medianSqmPriceYen": 300000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 325000,
        "sampleCount": 5
      },
      "age_21_30": {
        "medianSqmPriceYen": 314000,
        "sampleCount": 11
      }
    },
    "buildingYearSampleCount": 25,
    "structureCounts": {
      "ＳＲＣ": 16,
      "ＲＣ": 10
    },
    "sampleCount": 31,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "岐阜",
    "district": "各務原市",
    "layout": "ldk2",
    "medianTradePriceYen": 9300000,
    "medianSqmPriceYen": 155000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 3,
    "structureCounts": {
      "ＲＣ": 3
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q4",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "岐阜",
    "district": "各務原市",
    "layout": "ldk3",
    "medianTradePriceYen": 13000000,
    "medianSqmPriceYen": 186000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 3,
      "ＳＲＣ": 2
    },
    "sampleCount": 9,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "岐阜",
    "district": "岐阜市",
    "layout": "k1",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 700000,
    "medianAreaSqm": 30,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 1,
      "ＲＣ": 4
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "岐阜",
    "district": "岐阜市",
    "layout": "ldk2",
    "medianTradePriceYen": 24000000,
    "medianSqmPriceYen": 369000,
    "medianAreaSqm": 65,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 387000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 15,
    "structureCounts": {
      "ＲＣ": 9,
      "ＳＲＣ": 3
    },
    "sampleCount": 17,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "岐阜",
    "district": "岐阜市",
    "layout": "ldk3",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 262000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 453000,
        "sampleCount": 12
      },
      "age_11_20": {
        "medianSqmPriceYen": 295000,
        "sampleCount": 13
      },
      "age_21_30": {
        "medianSqmPriceYen": 239000,
        "sampleCount": 14
      },
      "age_41_plus": {
        "medianSqmPriceYen": 65000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 50,
    "structureCounts": {
      "ＳＲＣ": 14,
      "ＲＣ": 29
    },
    "sampleCount": 52,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "岐阜",
    "district": "多治見市",
    "layout": "ldk3",
    "medianTradePriceYen": 29000000,
    "medianSqmPriceYen": 387000,
    "medianAreaSqm": 75,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 1
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "岐阜",
    "district": "大垣市",
    "layout": "ldk2",
    "medianTradePriceYen": 9300000,
    "medianSqmPriceYen": 169000,
    "medianAreaSqm": 55,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 2,
      "ＳＲＣ": 3
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q2",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "岐阜",
    "district": "大垣市",
    "layout": "ldk3",
    "medianTradePriceYen": 18500000,
    "medianSqmPriceYen": 225000,
    "medianAreaSqm": 80,
    "ageBands": {},
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＲＣ": 7,
      "ＳＲＣ": 4
    },
    "sampleCount": 12,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "宮崎",
    "district": "延岡市",
    "layout": "ldk3",
    "medianTradePriceYen": 23000000,
    "medianSqmPriceYen": 311000,
    "medianAreaSqm": 80,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 4
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "宮崎",
    "district": "宮崎市",
    "layout": "k1",
    "medianTradePriceYen": 2000000,
    "medianSqmPriceYen": 100000,
    "medianAreaSqm": 20,
    "ageBands": {},
    "buildingYearSampleCount": 4,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "宮崎",
    "district": "宮崎市",
    "layout": "ldk1",
    "medianTradePriceYen": 2300000,
    "medianSqmPriceYen": 56000,
    "medianAreaSqm": 45,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 4,
      "鉄骨造": 1
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "宮崎",
    "district": "宮崎市",
    "layout": "ldk2",
    "medianTradePriceYen": 11000000,
    "medianSqmPriceYen": 200000,
    "medianAreaSqm": 60,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＳＲＣ": 3,
      "ＲＣ": 4
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "宮崎",
    "district": "宮崎市",
    "layout": "ldk3",
    "medianTradePriceYen": 18000000,
    "medianSqmPriceYen": 257000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 431000,
        "sampleCount": 5
      },
      "age_11_20": {
        "medianSqmPriceYen": 311000,
        "sampleCount": 11
      },
      "age_21_30": {
        "medianSqmPriceYen": 200000,
        "sampleCount": 10
      },
      "age_31_40": {
        "medianSqmPriceYen": 164000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 37,
    "structureCounts": {
      "ＳＲＣ": 8,
      "ＲＣ": 25
    },
    "sampleCount": 39,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "宮城",
    "district": "石巻市",
    "layout": "ldk3",
    "medianTradePriceYen": 9200000,
    "medianSqmPriceYen": 129000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 2
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "宮城",
    "district": "仙台市（市平均）",
    "layout": "k1",
    "medianTradePriceYen": 5100000,
    "medianSqmPriceYen": 208000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 335000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 195000,
        "sampleCount": 25
      },
      "age_41_plus": {
        "medianSqmPriceYen": 208000,
        "sampleCount": 14
      }
    },
    "buildingYearSampleCount": 46,
    "structureCounts": {
      "ＳＲＣ": 28,
      "ＲＣ": 18,
      "鉄骨造": 1
    },
    "sampleCount": 50,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "宮城",
    "district": "仙台市（市平均）",
    "layout": "ldk1",
    "medianTradePriceYen": 12000000,
    "medianSqmPriceYen": 282000,
    "medianAreaSqm": 38,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 275000,
        "sampleCount": 5
      },
      "age_41_plus": {
        "medianSqmPriceYen": 230000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 22,
    "structureCounts": {
      "ＳＲＣ": 16,
      "ＲＣ": 6
    },
    "sampleCount": 26,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "宮城",
    "district": "仙台市（市平均）",
    "layout": "ldk2",
    "medianTradePriceYen": 19500000,
    "medianSqmPriceYen": 350000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 761000,
        "sampleCount": 12
      },
      "age_11_20": {
        "medianSqmPriceYen": 550000,
        "sampleCount": 10
      },
      "age_21_30": {
        "medianSqmPriceYen": 422000,
        "sampleCount": 32
      },
      "age_31_40": {
        "medianSqmPriceYen": 266000,
        "sampleCount": 36
      },
      "age_41_plus": {
        "medianSqmPriceYen": 200000,
        "sampleCount": 20
      }
    },
    "buildingYearSampleCount": 110,
    "structureCounts": {
      "ＳＲＣ": 50,
      "ＲＣ": 57,
      "ＳＲＣ、ＲＣ": 1,
      "鉄骨造": 1
    },
    "sampleCount": 122,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "宮城",
    "district": "仙台市（市平均）",
    "layout": "ldk3",
    "medianTradePriceYen": 25000000,
    "medianSqmPriceYen": 338000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 663000,
        "sampleCount": 35
      },
      "age_11_20": {
        "medianSqmPriceYen": 467000,
        "sampleCount": 47
      },
      "age_21_30": {
        "medianSqmPriceYen": 318000,
        "sampleCount": 123
      },
      "age_31_40": {
        "medianSqmPriceYen": 243000,
        "sampleCount": 54
      },
      "age_41_plus": {
        "medianSqmPriceYen": 186000,
        "sampleCount": 25
      }
    },
    "buildingYearSampleCount": 284,
    "structureCounts": {
      "ＳＲＣ": 86,
      "ＲＣ": 196,
      "ＳＲＣ、ＲＣ": 4
    },
    "sampleCount": 310,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "宮城",
    "district": "仙台市（市平均）",
    "layout": "r1",
    "medianTradePriceYen": 2000000,
    "medianSqmPriceYen": 133000,
    "medianAreaSqm": 15,
    "ageBands": {},
    "buildingYearSampleCount": 4,
    "structureCounts": {
      "ＳＲＣ": 1,
      "ＲＣ": 3
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "宮城",
    "district": "仙台市宮城野區",
    "layout": "k1",
    "medianTradePriceYen": 4200000,
    "medianSqmPriceYen": 155000,
    "medianAreaSqm": 28,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 3,
      "ＳＲＣ": 5
    },
    "sampleCount": 8,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "宮城",
    "district": "仙台市宮城野區",
    "layout": "ldk1",
    "medianTradePriceYen": 9900000,
    "medianSqmPriceYen": 283000,
    "medianAreaSqm": 35,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＳＲＣ": 5,
      "ＲＣ": 2
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "宮城",
    "district": "仙台市宮城野區",
    "layout": "ldk2",
    "medianTradePriceYen": 20500000,
    "medianSqmPriceYen": 347000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 400000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 244000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 16,
    "structureCounts": {
      "ＳＲＣ": 11,
      "ＲＣ": 5
    },
    "sampleCount": 18,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "宮城",
    "district": "仙台市宮城野區",
    "layout": "ldk3",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 319000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 371000,
        "sampleCount": 5
      },
      "age_21_30": {
        "medianSqmPriceYen": 310000,
        "sampleCount": 12
      },
      "age_31_40": {
        "medianSqmPriceYen": 271000,
        "sampleCount": 7
      },
      "age_41_plus": {
        "medianSqmPriceYen": 260000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 34,
    "structureCounts": {
      "ＲＣ": 20,
      "ＳＲＣ": 16
    },
    "sampleCount": 36,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "宮城",
    "district": "仙台市若林區",
    "layout": "k1",
    "medianTradePriceYen": 3800000,
    "medianSqmPriceYen": 148000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 200000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＳＲＣ": 9,
      "ＲＣ": 4
    },
    "sampleCount": 14,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "宮城",
    "district": "仙台市若林區",
    "layout": "ldk1",
    "medianTradePriceYen": 7500000,
    "medianSqmPriceYen": 189000,
    "medianAreaSqm": 43,
    "ageBands": {},
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＳＲＣ": 5,
      "ＲＣ": 3
    },
    "sampleCount": 8,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "宮城",
    "district": "仙台市若林區",
    "layout": "ldk2",
    "medianTradePriceYen": 15000000,
    "medianSqmPriceYen": 262000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 450000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 300000,
        "sampleCount": 9
      },
      "age_41_plus": {
        "medianSqmPriceYen": 155000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 21,
    "structureCounts": {
      "ＳＲＣ": 14,
      "ＲＣ": 7
    },
    "sampleCount": 21,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "宮城",
    "district": "仙台市若林區",
    "layout": "ldk3",
    "medianTradePriceYen": 30000000,
    "medianSqmPriceYen": 407000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 529000,
        "sampleCount": 5
      },
      "age_11_20": {
        "medianSqmPriceYen": 520000,
        "sampleCount": 5
      },
      "age_21_30": {
        "medianSqmPriceYen": 420000,
        "sampleCount": 16
      }
    },
    "buildingYearSampleCount": 34,
    "structureCounts": {
      "ＲＣ": 19,
      "ＳＲＣ": 13,
      "ＳＲＣ、ＲＣ": 1
    },
    "sampleCount": 34,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "宮城",
    "district": "仙台市青葉區",
    "layout": "k1",
    "medianTradePriceYen": 6100000,
    "medianSqmPriceYen": 230000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 335000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 208000,
        "sampleCount": 16
      },
      "age_41_plus": {
        "medianSqmPriceYen": 230000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 33,
    "structureCounts": {
      "ＳＲＣ": 22,
      "ＲＣ": 11
    },
    "sampleCount": 36,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "宮城",
    "district": "仙台市青葉區",
    "layout": "ldk1",
    "medianTradePriceYen": 14000000,
    "medianSqmPriceYen": 311000,
    "medianAreaSqm": 35,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 289000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＳＲＣ": 9,
      "ＲＣ": 4
    },
    "sampleCount": 17,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "宮城",
    "district": "仙台市青葉區",
    "layout": "ldk2",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 400000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 761000,
        "sampleCount": 8
      },
      "age_11_20": {
        "medianSqmPriceYen": 653000,
        "sampleCount": 5
      },
      "age_21_30": {
        "medianSqmPriceYen": 470000,
        "sampleCount": 14
      },
      "age_31_40": {
        "medianSqmPriceYen": 214000,
        "sampleCount": 15
      },
      "age_41_plus": {
        "medianSqmPriceYen": 267000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 52,
    "structureCounts": {
      "ＳＲＣ": 22,
      "ＲＣ": 30
    },
    "sampleCount": 62,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "宮城",
    "district": "仙台市青葉區",
    "layout": "ldk3",
    "medianTradePriceYen": 26000000,
    "medianSqmPriceYen": 347000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 807000,
        "sampleCount": 14
      },
      "age_11_20": {
        "medianSqmPriceYen": 571000,
        "sampleCount": 17
      },
      "age_21_30": {
        "medianSqmPriceYen": 343000,
        "sampleCount": 48
      },
      "age_31_40": {
        "medianSqmPriceYen": 300000,
        "sampleCount": 13
      },
      "age_41_plus": {
        "medianSqmPriceYen": 227000,
        "sampleCount": 11
      }
    },
    "buildingYearSampleCount": 103,
    "structureCounts": {
      "ＳＲＣ": 31,
      "ＲＣ": 72
    },
    "sampleCount": 123,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "宮城",
    "district": "仙台市青葉區",
    "layout": "r1",
    "medianTradePriceYen": 2700000,
    "medianSqmPriceYen": 180000,
    "medianAreaSqm": 15,
    "ageBands": {},
    "buildingYearSampleCount": 3,
    "structureCounts": {
      "ＲＣ": 2,
      "ＳＲＣ": 1
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q4",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "宮城",
    "district": "仙台市泉區",
    "layout": "k1",
    "medianTradePriceYen": 3000000,
    "medianSqmPriceYen": 140000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 140000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "鉄骨造": 1,
      "ＲＣ": 5
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "宮城",
    "district": "仙台市泉區",
    "layout": "ldk2",
    "medianTradePriceYen": 19000000,
    "medianSqmPriceYen": 317000,
    "medianAreaSqm": 60,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 6,
      "ＳＲＣ": 1
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "宮城",
    "district": "仙台市泉區",
    "layout": "ldk3",
    "medianTradePriceYen": 22500000,
    "medianSqmPriceYen": 313000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 365000,
        "sampleCount": 7
      },
      "age_21_30": {
        "medianSqmPriceYen": 277000,
        "sampleCount": 29
      },
      "age_31_40": {
        "medianSqmPriceYen": 243000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 46,
    "structureCounts": {
      "ＲＣ": 38,
      "ＳＲＣ": 9,
      "ＳＲＣ、ＲＣ": 1
    },
    "sampleCount": 48,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "宮城",
    "district": "仙台市太白區",
    "layout": "ldk2",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 360000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 360000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 14,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 9,
      "ＳＲＣ、ＲＣ": 1,
      "鉄骨造": 1
    },
    "sampleCount": 14,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "宮城",
    "district": "仙台市太白區",
    "layout": "ldk3",
    "medianTradePriceYen": 22000000,
    "medianSqmPriceYen": 314000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 640000,
        "sampleCount": 9
      },
      "age_11_20": {
        "medianSqmPriceYen": 471000,
        "sampleCount": 13
      },
      "age_21_30": {
        "medianSqmPriceYen": 304000,
        "sampleCount": 18
      },
      "age_31_40": {
        "medianSqmPriceYen": 200000,
        "sampleCount": 23
      }
    },
    "buildingYearSampleCount": 67,
    "structureCounts": {
      "ＲＣ": 47,
      "ＳＲＣ": 17,
      "ＳＲＣ、ＲＣ": 2
    },
    "sampleCount": 69,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "宮城",
    "district": "大崎市",
    "layout": "ldk3",
    "medianTradePriceYen": 15000000,
    "medianSqmPriceYen": 190000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 1
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "宇治市",
    "layout": "ldk2",
    "medianTradePriceYen": 15000000,
    "medianSqmPriceYen": 231000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 231000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＲＣ": 11,
      "ＳＲＣ": 2
    },
    "sampleCount": 13,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "宇治市",
    "layout": "ldk3",
    "medianTradePriceYen": 23500000,
    "medianSqmPriceYen": 313000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 429000,
        "sampleCount": 6
      },
      "age_21_30": {
        "medianSqmPriceYen": 303000,
        "sampleCount": 12
      },
      "age_31_40": {
        "medianSqmPriceYen": 277000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 30,
    "structureCounts": {
      "ＲＣ": 28,
      "ＳＲＣ": 2
    },
    "sampleCount": 30,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京田辺市",
    "layout": "ldk3",
    "medianTradePriceYen": 22000000,
    "medianSqmPriceYen": 259000,
    "medianAreaSqm": 75,
    "ageBands": {},
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＲＣ": 7,
      "ＳＲＣ": 2
    },
    "sampleCount": 9,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京都市（市平均）",
    "layout": "k1",
    "medianTradePriceYen": 19000000,
    "medianSqmPriceYen": 800000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 900000,
        "sampleCount": 107
      },
      "age_11_20": {
        "medianSqmPriceYen": 800000,
        "sampleCount": 54
      },
      "age_21_30": {
        "medianSqmPriceYen": 700000,
        "sampleCount": 33
      },
      "age_31_40": {
        "medianSqmPriceYen": 405000,
        "sampleCount": 40
      },
      "age_41_plus": {
        "medianSqmPriceYen": 366000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 240,
    "structureCounts": {
      "ＲＣ": 208,
      "ＳＲＣ": 31
    },
    "sampleCount": 242,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京都市（市平均）",
    "layout": "ldk1",
    "medianTradePriceYen": 26000000,
    "medianSqmPriceYen": 775000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 893000,
        "sampleCount": 48
      },
      "age_11_20": {
        "medianSqmPriceYen": 833000,
        "sampleCount": 13
      },
      "age_21_30": {
        "medianSqmPriceYen": 867000,
        "sampleCount": 6
      },
      "age_31_40": {
        "medianSqmPriceYen": 526000,
        "sampleCount": 10
      },
      "age_41_plus": {
        "medianSqmPriceYen": 296000,
        "sampleCount": 22
      }
    },
    "buildingYearSampleCount": 99,
    "structureCounts": {
      "ＳＲＣ": 20,
      "ＲＣ": 75,
      "鉄骨造": 2,
      "ＳＲＣ、ＲＣ": 1
    },
    "sampleCount": 101,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京都市（市平均）",
    "layout": "ldk2",
    "medianTradePriceYen": 26000000,
    "medianSqmPriceYen": 445000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1007000,
        "sampleCount": 22
      },
      "age_11_20": {
        "medianSqmPriceYen": 778000,
        "sampleCount": 29
      },
      "age_21_30": {
        "medianSqmPriceYen": 545000,
        "sampleCount": 36
      },
      "age_31_40": {
        "medianSqmPriceYen": 345000,
        "sampleCount": 29
      },
      "age_41_plus": {
        "medianSqmPriceYen": 283000,
        "sampleCount": 69
      }
    },
    "buildingYearSampleCount": 185,
    "structureCounts": {
      "ＲＣ": 138,
      "ＳＲＣ": 46,
      "鉄骨造": 1
    },
    "sampleCount": 188,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京都市（市平均）",
    "layout": "ldk3",
    "medianTradePriceYen": 36000000,
    "medianSqmPriceYen": 492000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 677000,
        "sampleCount": 41
      },
      "age_11_20": {
        "medianSqmPriceYen": 590000,
        "sampleCount": 45
      },
      "age_21_30": {
        "medianSqmPriceYen": 492000,
        "sampleCount": 81
      },
      "age_31_40": {
        "medianSqmPriceYen": 314000,
        "sampleCount": 23
      },
      "age_41_plus": {
        "medianSqmPriceYen": 238000,
        "sampleCount": 34
      }
    },
    "buildingYearSampleCount": 224,
    "structureCounts": {
      "ＲＣ": 177,
      "ＳＲＣ": 46
    },
    "sampleCount": 225,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京都市（市平均）",
    "layout": "r1",
    "medianTradePriceYen": 4800000,
    "medianSqmPriceYen": 317000,
    "medianAreaSqm": 15,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 320000,
        "sampleCount": 15
      }
    },
    "buildingYearSampleCount": 18,
    "structureCounts": {
      "鉄骨造": 1,
      "ＲＣ": 15,
      "ＳＲＣ": 2
    },
    "sampleCount": 18,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京都市右京區",
    "layout": "k1",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 880000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 890000,
        "sampleCount": 14
      }
    },
    "buildingYearSampleCount": 17,
    "structureCounts": {
      "ＲＣ": 15
    },
    "sampleCount": 17,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京都市右京區",
    "layout": "ldk1",
    "medianTradePriceYen": 22500000,
    "medianSqmPriceYen": 698000,
    "medianAreaSqm": 33,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 933000,
        "sampleCount": 7
      },
      "age_41_plus": {
        "medianSqmPriceYen": 208000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＲＣ": 12
    },
    "sampleCount": 14,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京都市右京區",
    "layout": "ldk2",
    "medianTradePriceYen": 18000000,
    "medianSqmPriceYen": 320000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 400000,
        "sampleCount": 7
      },
      "age_41_plus": {
        "medianSqmPriceYen": 283000,
        "sampleCount": 23
      }
    },
    "buildingYearSampleCount": 37,
    "structureCounts": {
      "ＲＣ": 32,
      "ＳＲＣ": 5,
      "鉄骨造": 1
    },
    "sampleCount": 39,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京都市右京區",
    "layout": "ldk3",
    "medianTradePriceYen": 38000000,
    "medianSqmPriceYen": 563000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 686000,
        "sampleCount": 9
      },
      "age_11_20": {
        "medianSqmPriceYen": 566000,
        "sampleCount": 12
      }
    },
    "buildingYearSampleCount": 32,
    "structureCounts": {
      "ＲＣ": 28,
      "ＳＲＣ": 3
    },
    "sampleCount": 32,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京都市下京區",
    "layout": "k1",
    "medianTradePriceYen": 18000000,
    "medianSqmPriceYen": 800000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 920000,
        "sampleCount": 15
      },
      "age_11_20": {
        "medianSqmPriceYen": 800000,
        "sampleCount": 23
      },
      "age_21_30": {
        "medianSqmPriceYen": 680000,
        "sampleCount": 11
      },
      "age_31_40": {
        "medianSqmPriceYen": 489000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 59,
    "structureCounts": {
      "ＲＣ": 44,
      "ＳＲＣ": 15
    },
    "sampleCount": 59,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京都市下京區",
    "layout": "ldk1",
    "medianTradePriceYen": 36000000,
    "medianSqmPriceYen": 952000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1085000,
        "sampleCount": 12
      },
      "age_11_20": {
        "medianSqmPriceYen": 864000,
        "sampleCount": 6
      },
      "age_21_30": {
        "medianSqmPriceYen": 833000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 24,
    "structureCounts": {
      "ＲＣ": 17,
      "ＳＲＣ": 7
    },
    "sampleCount": 24,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京都市下京區",
    "layout": "ldk2",
    "medianTradePriceYen": 45000000,
    "medianSqmPriceYen": 815000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 933000,
        "sampleCount": 5
      },
      "age_21_30": {
        "medianSqmPriceYen": 673000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 20,
    "structureCounts": {
      "ＲＣ": 13,
      "ＳＲＣ": 7
    },
    "sampleCount": 20,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京都市下京區",
    "layout": "ldk3",
    "medianTradePriceYen": 51000000,
    "medianSqmPriceYen": 785000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 1108000,
        "sampleCount": 7
      },
      "age_21_30": {
        "medianSqmPriceYen": 785000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 22,
    "structureCounts": {
      "ＲＣ": 14,
      "ＳＲＣ": 8
    },
    "sampleCount": 22,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京都市左京區",
    "layout": "k1",
    "medianTradePriceYen": 15500000,
    "medianSqmPriceYen": 640000,
    "medianAreaSqm": 20,
    "ageBands": {},
    "buildingYearSampleCount": 12,
    "structureCounts": {
      "ＲＣ": 12
    },
    "sampleCount": 12,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京都市左京區",
    "layout": "ldk1",
    "medianTradePriceYen": 17000000,
    "medianSqmPriceYen": 378000,
    "medianAreaSqm": 40,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 3,
      "ＳＲＣ": 1,
      "鉄骨造": 1
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京都市左京區",
    "layout": "ldk2",
    "medianTradePriceYen": 38500000,
    "medianSqmPriceYen": 667000,
    "medianAreaSqm": 60,
    "ageBands": {},
    "buildingYearSampleCount": 12,
    "structureCounts": {
      "ＲＣ": 12
    },
    "sampleCount": 12,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京都市左京區",
    "layout": "ldk3",
    "medianTradePriceYen": 47500000,
    "medianSqmPriceYen": 608000,
    "medianAreaSqm": 78,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 589000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 18,
    "structureCounts": {
      "ＲＣ": 17,
      "ＳＲＣ": 1
    },
    "sampleCount": 18,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京都市山科區",
    "layout": "ldk1",
    "medianTradePriceYen": 14500000,
    "medianSqmPriceYen": 333000,
    "medianAreaSqm": 45,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 356000,
        "sampleCount": 6
      },
      "age_41_plus": {
        "medianSqmPriceYen": 196000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 14,
    "structureCounts": {
      "ＲＣ": 12,
      "ＳＲＣ": 2
    },
    "sampleCount": 14,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京都市山科區",
    "layout": "ldk2",
    "medianTradePriceYen": 16500000,
    "medianSqmPriceYen": 315000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 267000,
        "sampleCount": 5
      },
      "age_41_plus": {
        "medianSqmPriceYen": 176000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 24,
    "structureCounts": {
      "ＲＣ": 19,
      "ＳＲＣ": 5
    },
    "sampleCount": 24,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京都市山科區",
    "layout": "ldk3",
    "medianTradePriceYen": 32000000,
    "medianSqmPriceYen": 433000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 453000,
        "sampleCount": 11
      },
      "age_31_40": {
        "medianSqmPriceYen": 229000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 27,
    "structureCounts": {
      "ＲＣ": 24,
      "ＳＲＣ": 3
    },
    "sampleCount": 27,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京都市上京區",
    "layout": "k1",
    "medianTradePriceYen": 15000000,
    "medianSqmPriceYen": 625000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 800000,
        "sampleCount": 6
      },
      "age_11_20": {
        "medianSqmPriceYen": 697000,
        "sampleCount": 8
      },
      "age_21_30": {
        "medianSqmPriceYen": 625000,
        "sampleCount": 6
      },
      "age_31_40": {
        "medianSqmPriceYen": 310000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 32,
    "structureCounts": {
      "ＲＣ": 24,
      "ＳＲＣ": 7
    },
    "sampleCount": 32,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京都市上京區",
    "layout": "ldk1",
    "medianTradePriceYen": 31000000,
    "medianSqmPriceYen": 733000,
    "medianAreaSqm": 45,
    "ageBands": {},
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＳＲＣ": 5,
      "ＲＣ": 8
    },
    "sampleCount": 13,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京都市上京區",
    "layout": "ldk2",
    "medianTradePriceYen": 32500000,
    "medianSqmPriceYen": 609000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 523000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 16,
    "structureCounts": {
      "ＳＲＣ": 8,
      "ＲＣ": 8
    },
    "sampleCount": 16,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京都市上京區",
    "layout": "ldk3",
    "medianTradePriceYen": 45000000,
    "medianSqmPriceYen": 604000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 489000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 16,
    "structureCounts": {
      "ＲＣ": 10,
      "ＳＲＣ": 6
    },
    "sampleCount": 16,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京都市上京區",
    "layout": "r1",
    "medianTradePriceYen": 4800000,
    "medianSqmPriceYen": 320000,
    "medianAreaSqm": 15,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 320000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "鉄骨造": 1,
      "ＲＣ": 5,
      "ＳＲＣ": 2
    },
    "sampleCount": 8,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京都市西京區",
    "layout": "ldk3",
    "medianTradePriceYen": 27500000,
    "medianSqmPriceYen": 393000,
    "medianAreaSqm": 75,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 6
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京都市中京區",
    "layout": "k1",
    "medianTradePriceYen": 19000000,
    "medianSqmPriceYen": 742000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 840000,
        "sampleCount": 10
      },
      "age_11_20": {
        "medianSqmPriceYen": 780000,
        "sampleCount": 6
      },
      "age_21_30": {
        "medianSqmPriceYen": 760000,
        "sampleCount": 13
      },
      "age_31_40": {
        "medianSqmPriceYen": 533000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 42,
    "structureCounts": {
      "ＲＣ": 37,
      "ＳＲＣ": 7
    },
    "sampleCount": 44,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京都市中京區",
    "layout": "ldk1",
    "medianTradePriceYen": 33000000,
    "medianSqmPriceYen": 757000,
    "medianAreaSqm": 45,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 371000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 16,
    "structureCounts": {
      "ＲＣ": 9,
      "ＳＲＣ": 7
    },
    "sampleCount": 16,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京都市中京區",
    "layout": "ldk2",
    "medianTradePriceYen": 57000000,
    "medianSqmPriceYen": 911000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 1255000,
        "sampleCount": 7
      },
      "age_21_30": {
        "medianSqmPriceYen": 900000,
        "sampleCount": 7
      },
      "age_41_plus": {
        "medianSqmPriceYen": 760000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 27,
    "structureCounts": {
      "ＳＲＣ": 10,
      "ＲＣ": 17
    },
    "sampleCount": 27,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京都市中京區",
    "layout": "ldk3",
    "medianTradePriceYen": 64000000,
    "medianSqmPriceYen": 846000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 846000,
        "sampleCount": 17
      }
    },
    "buildingYearSampleCount": 27,
    "structureCounts": {
      "ＲＣ": 20,
      "ＳＲＣ": 7
    },
    "sampleCount": 27,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京都市東山區",
    "layout": "k1",
    "medianTradePriceYen": 19000000,
    "medianSqmPriceYen": 775000,
    "medianAreaSqm": 25,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 6
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京都市東山區",
    "layout": "ldk2",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 323000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 3,
      "ＲＣ": 2
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2025-Q2",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京都市南區",
    "layout": "k1",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 867000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 900000,
        "sampleCount": 49
      },
      "age_11_20": {
        "medianSqmPriceYen": 800000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 57,
    "structureCounts": {
      "ＲＣ": 57
    },
    "sampleCount": 57,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京都市南區",
    "layout": "ldk1",
    "medianTradePriceYen": 25000000,
    "medianSqmPriceYen": 800000,
    "medianAreaSqm": 30,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 833000,
        "sampleCount": 24
      },
      "age_41_plus": {
        "medianSqmPriceYen": 204000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 31,
    "structureCounts": {
      "ＲＣ": 28,
      "鉄骨造": 1,
      "ＳＲＣ": 2
    },
    "sampleCount": 31,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京都市南區",
    "layout": "ldk2",
    "medianTradePriceYen": 23000000,
    "medianSqmPriceYen": 438000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 105000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 14,
    "structureCounts": {
      "ＲＣ": 12,
      "ＳＲＣ": 2
    },
    "sampleCount": 14,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京都市南區",
    "layout": "ldk3",
    "medianTradePriceYen": 28000000,
    "medianSqmPriceYen": 373000,
    "medianAreaSqm": 65,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 400000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 15,
    "structureCounts": {
      "ＳＲＣ": 3,
      "ＲＣ": 12
    },
    "sampleCount": 15,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京都市伏見區",
    "layout": "k1",
    "medianTradePriceYen": 22000000,
    "medianSqmPriceYen": 880000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 920000,
        "sampleCount": 11
      }
    },
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＲＣ": 13
    },
    "sampleCount": 13,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京都市伏見區",
    "layout": "ldk1",
    "medianTradePriceYen": 13500000,
    "medianSqmPriceYen": 305000,
    "medianAreaSqm": 43,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 2,
      "ＳＲＣ、ＲＣ": 1
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京都市伏見區",
    "layout": "ldk2",
    "medianTradePriceYen": 17000000,
    "medianSqmPriceYen": 321000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 269000,
        "sampleCount": 6
      },
      "age_41_plus": {
        "medianSqmPriceYen": 309000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 22,
    "structureCounts": {
      "ＳＲＣ": 8,
      "ＲＣ": 13
    },
    "sampleCount": 22,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京都市伏見區",
    "layout": "ldk3",
    "medianTradePriceYen": 28500000,
    "medianSqmPriceYen": 382000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 592000,
        "sampleCount": 12
      },
      "age_11_20": {
        "medianSqmPriceYen": 415000,
        "sampleCount": 8
      },
      "age_21_30": {
        "medianSqmPriceYen": 388000,
        "sampleCount": 18
      },
      "age_31_40": {
        "medianSqmPriceYen": 170000,
        "sampleCount": 6
      },
      "age_41_plus": {
        "medianSqmPriceYen": 199000,
        "sampleCount": 12
      }
    },
    "buildingYearSampleCount": 56,
    "structureCounts": {
      "ＲＣ": 41,
      "ＳＲＣ": 14
    },
    "sampleCount": 56,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京都市北區",
    "layout": "ldk2",
    "medianTradePriceYen": 17000000,
    "medianSqmPriceYen": 283000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 246000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＲＣ": 10
    },
    "sampleCount": 11,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "京都市北區",
    "layout": "ldk3",
    "medianTradePriceYen": 33000000,
    "medianSqmPriceYen": 492000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "向日市",
    "layout": "ldk2",
    "medianTradePriceYen": 43000000,
    "medianSqmPriceYen": 662000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 1
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "向日市",
    "layout": "ldk3",
    "medianTradePriceYen": 36000000,
    "medianSqmPriceYen": 514000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "城陽市",
    "layout": "ldk3",
    "medianTradePriceYen": 33000000,
    "medianSqmPriceYen": 425000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 3
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "相楽郡精華町",
    "layout": "ldk3",
    "medianTradePriceYen": 17000000,
    "medianSqmPriceYen": 213000,
    "medianAreaSqm": 80,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q4",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "長岡京市",
    "layout": "ldk2",
    "medianTradePriceYen": 18000000,
    "medianSqmPriceYen": 292000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 6
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "長岡京市",
    "layout": "ldk3",
    "medianTradePriceYen": 39000000,
    "medianSqmPriceYen": 520000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＲＣ": 9
    },
    "sampleCount": 9,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "八幡市",
    "layout": "ldk2",
    "medianTradePriceYen": 3800000,
    "medianSqmPriceYen": 68000,
    "medianAreaSqm": 55,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 6
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "八幡市",
    "layout": "ldk3",
    "medianTradePriceYen": 22500000,
    "medianSqmPriceYen": 291000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 263000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＲＣ": 10,
      "ＳＲＣ": 2
    },
    "sampleCount": 12,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "木津川市",
    "layout": "ldk2",
    "medianTradePriceYen": 15000000,
    "medianSqmPriceYen": 200000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 1
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2025-Q1",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "京都",
    "district": "木津川市",
    "layout": "ldk3",
    "medianTradePriceYen": 14000000,
    "medianSqmPriceYen": 187000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 187000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＲＣ": 9,
      "ＳＲＣ": 1
    },
    "sampleCount": 11,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "熊本",
    "district": "熊本市",
    "layout": "k1",
    "medianTradePriceYen": 2300000,
    "medianSqmPriceYen": 110000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 110000,
        "sampleCount": 11
      }
    },
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＲＣ": 6,
      "ＳＲＣ": 2
    },
    "sampleCount": 13,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "熊本",
    "district": "熊本市",
    "layout": "ldk1",
    "medianTradePriceYen": 8500000,
    "medianSqmPriceYen": 178000,
    "medianAreaSqm": 40,
    "ageBands": {},
    "buildingYearSampleCount": 4,
    "structureCounts": {
      "ＳＲＣ": 1,
      "ＲＣ": 3
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "熊本",
    "district": "熊本市",
    "layout": "ldk2",
    "medianTradePriceYen": 17500000,
    "medianSqmPriceYen": 295000,
    "medianAreaSqm": 58,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 345000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 178000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 20,
    "structureCounts": {
      "ＲＣ": 10,
      "ＳＲＣ": 7
    },
    "sampleCount": 26,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "熊本",
    "district": "熊本市",
    "layout": "ldk3",
    "medianTradePriceYen": 25000000,
    "medianSqmPriceYen": 324000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 450000,
        "sampleCount": 19
      },
      "age_11_20": {
        "medianSqmPriceYen": 385000,
        "sampleCount": 14
      },
      "age_21_30": {
        "medianSqmPriceYen": 277000,
        "sampleCount": 15
      },
      "age_31_40": {
        "medianSqmPriceYen": 180000,
        "sampleCount": 18
      }
    },
    "buildingYearSampleCount": 68,
    "structureCounts": {
      "ＳＲＣ": 18,
      "ＲＣ": 39
    },
    "sampleCount": 90,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "熊本",
    "district": "熊本市西区",
    "layout": "ldk2",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 300000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 4,
    "structureCounts": {
      "ＲＣ": 2,
      "ＳＲＣ": 1
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "熊本",
    "district": "熊本市西区",
    "layout": "ldk3",
    "medianTradePriceYen": 31000000,
    "medianSqmPriceYen": 440000,
    "medianAreaSqm": 73,
    "ageBands": {},
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＲＣ": 7,
      "ＳＲＣ": 1
    },
    "sampleCount": 10,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "熊本",
    "district": "熊本市中央区",
    "layout": "k1",
    "medianTradePriceYen": 2400000,
    "medianSqmPriceYen": 120000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 128000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＲＣ": 3,
      "ＳＲＣ": 2
    },
    "sampleCount": 10,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "熊本",
    "district": "熊本市中央区",
    "layout": "ldk1",
    "medianTradePriceYen": 7300000,
    "medianSqmPriceYen": 161000,
    "medianAreaSqm": 43,
    "ageBands": {},
    "buildingYearSampleCount": 2,
    "structureCounts": {
      "ＳＲＣ": 1,
      "ＲＣ": 1
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "熊本",
    "district": "熊本市中央区",
    "layout": "ldk2",
    "medianTradePriceYen": 13000000,
    "medianSqmPriceYen": 216000,
    "medianAreaSqm": 58,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 138000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 14,
    "structureCounts": {
      "ＲＣ": 6,
      "ＳＲＣ": 6
    },
    "sampleCount": 20,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "熊本",
    "district": "熊本市中央区",
    "layout": "ldk3",
    "medianTradePriceYen": 25000000,
    "medianSqmPriceYen": 307000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 440000,
        "sampleCount": 11
      },
      "age_11_20": {
        "medianSqmPriceYen": 413000,
        "sampleCount": 7
      },
      "age_21_30": {
        "medianSqmPriceYen": 292000,
        "sampleCount": 10
      },
      "age_31_40": {
        "medianSqmPriceYen": 229000,
        "sampleCount": 12
      }
    },
    "buildingYearSampleCount": 42,
    "structureCounts": {
      "ＳＲＣ": 13,
      "ＲＣ": 17
    },
    "sampleCount": 55,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "熊本",
    "district": "熊本市東区",
    "layout": "k1",
    "medianTradePriceYen": 2200000,
    "medianSqmPriceYen": 88000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 88000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 6
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "熊本",
    "district": "熊本市東区",
    "layout": "ldk2",
    "medianTradePriceYen": 16000000,
    "medianSqmPriceYen": 280000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 176000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＲＣ": 7
    },
    "sampleCount": 10,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "熊本",
    "district": "熊本市東区",
    "layout": "ldk3",
    "medianTradePriceYen": 26000000,
    "medianSqmPriceYen": 338000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＲＣ": 10,
      "ＳＲＣ": 2
    },
    "sampleCount": 15,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "熊本",
    "district": "熊本市南区",
    "layout": "ldk3",
    "medianTradePriceYen": 35000000,
    "medianSqmPriceYen": 438000,
    "medianAreaSqm": 80,
    "ageBands": {},
    "buildingYearSampleCount": 4,
    "structureCounts": {
      "ＳＲＣ": 1,
      "ＲＣ": 2
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "熊本",
    "district": "熊本市北区",
    "layout": "ldk3",
    "medianTradePriceYen": 9200000,
    "medianSqmPriceYen": 123000,
    "medianAreaSqm": 75,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 3,
      "ＳＲＣ": 1
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "群馬",
    "district": "高崎市",
    "layout": "ldk1",
    "medianTradePriceYen": 4500000,
    "medianSqmPriceYen": 107000,
    "medianAreaSqm": 45,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 4,
      "ＲＣ": 1
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "群馬",
    "district": "高崎市",
    "layout": "ldk2",
    "medianTradePriceYen": 14500000,
    "medianSqmPriceYen": 239000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 208000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 16,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 12
    },
    "sampleCount": 16,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "群馬",
    "district": "高崎市",
    "layout": "ldk3",
    "medianTradePriceYen": 32000000,
    "medianSqmPriceYen": 421000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 637000,
        "sampleCount": 8
      },
      "age_11_20": {
        "medianSqmPriceYen": 442000,
        "sampleCount": 12
      },
      "age_21_30": {
        "medianSqmPriceYen": 200000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 214000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 30,
    "structureCounts": {
      "ＲＣ": 26,
      "ＳＲＣ": 4
    },
    "sampleCount": 30,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "群馬",
    "district": "前橋市",
    "layout": "k1",
    "medianTradePriceYen": 2900000,
    "medianSqmPriceYen": 129000,
    "medianAreaSqm": 23,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 129000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 3,
      "ＳＲＣ": 2,
      "ＳＲＣ、ＲＣ": 1
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "群馬",
    "district": "前橋市",
    "layout": "ldk2",
    "medianTradePriceYen": 17000000,
    "medianSqmPriceYen": 263000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 1
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "群馬",
    "district": "前橋市",
    "layout": "ldk3",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 276000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 333000,
        "sampleCount": 7
      },
      "age_21_30": {
        "medianSqmPriceYen": 214000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 16,
    "structureCounts": {
      "ＳＲＣ": 4,
      "ＲＣ": 11,
      "ＳＲＣ、ＲＣ": 1
    },
    "sampleCount": 16,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "群馬",
    "district": "太田市",
    "layout": "ldk3",
    "medianTradePriceYen": 17500000,
    "medianSqmPriceYen": 259000,
    "medianAreaSqm": 68,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 1
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "香川",
    "district": "丸亀市",
    "layout": "ldk2",
    "medianTradePriceYen": 10000000,
    "medianSqmPriceYen": 143000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 0,
    "structureCounts": {},
    "sampleCount": 11,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "香川",
    "district": "丸亀市",
    "layout": "ldk3",
    "medianTradePriceYen": 16000000,
    "medianSqmPriceYen": 213000,
    "medianAreaSqm": 75,
    "ageBands": {},
    "buildingYearSampleCount": 0,
    "structureCounts": {},
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "香川",
    "district": "高松市",
    "layout": "k1",
    "medianTradePriceYen": 2300000,
    "medianSqmPriceYen": 84000,
    "medianAreaSqm": 28,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 88000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＳＲＣ": 6,
      "ＲＣ": 2
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "香川",
    "district": "高松市",
    "layout": "ldk2",
    "medianTradePriceYen": 15000000,
    "medianSqmPriceYen": 233000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 12,
    "structureCounts": {
      "ＲＣ": 12,
      "ＳＲＣ": 5
    },
    "sampleCount": 18,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "香川",
    "district": "高松市",
    "layout": "ldk3",
    "medianTradePriceYen": 18000000,
    "medianSqmPriceYen": 257000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 374000,
        "sampleCount": 10
      },
      "age_11_20": {
        "medianSqmPriceYen": 282000,
        "sampleCount": 13
      },
      "age_21_30": {
        "medianSqmPriceYen": 187000,
        "sampleCount": 21
      },
      "age_41_plus": {
        "medianSqmPriceYen": 61000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 54,
    "structureCounts": {
      "ＲＣ": 39,
      "ＳＲＣ": 19
    },
    "sampleCount": 61,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "高知",
    "district": "高知市",
    "layout": "ldk2",
    "medianTradePriceYen": 13000000,
    "medianSqmPriceYen": 200000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 2,
      "ＳＲＣ": 5
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "高知",
    "district": "高知市",
    "layout": "ldk3",
    "medianTradePriceYen": 18000000,
    "medianSqmPriceYen": 240000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 471000,
        "sampleCount": 5
      },
      "age_21_30": {
        "medianSqmPriceYen": 238000,
        "sampleCount": 5
      },
      "age_41_plus": {
        "medianSqmPriceYen": 77000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 20,
    "structureCounts": {
      "ＲＣ": 11,
      "ＳＲＣ": 9
    },
    "sampleCount": 21,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "佐賀",
    "district": "佐賀市",
    "layout": "ldk2",
    "medianTradePriceYen": 13000000,
    "medianSqmPriceYen": 229000,
    "medianAreaSqm": 65,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 167000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＳＲＣ": 6,
      "ＲＣ": 4
    },
    "sampleCount": 11,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "佐賀",
    "district": "佐賀市",
    "layout": "ldk3",
    "medianTradePriceYen": 22000000,
    "medianSqmPriceYen": 250000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 412000,
        "sampleCount": 9
      },
      "age_11_20": {
        "medianSqmPriceYen": 337000,
        "sampleCount": 6
      },
      "age_21_30": {
        "medianSqmPriceYen": 199000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 27,
    "structureCounts": {
      "ＲＣ": 18,
      "ＳＲＣ": 2
    },
    "sampleCount": 29,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "佐賀",
    "district": "唐津市",
    "layout": "ldk2",
    "medianTradePriceYen": 14000000,
    "medianSqmPriceYen": 187000,
    "medianAreaSqm": 75,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 2,
      "ＳＲＣ": 2
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "佐賀",
    "district": "唐津市",
    "layout": "ldk3",
    "medianTradePriceYen": 19500000,
    "medianSqmPriceYen": 289000,
    "medianAreaSqm": 75,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "さいたま市岩槻区",
    "layout": "ldk2",
    "medianTradePriceYen": 8900000,
    "medianSqmPriceYen": 162000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 100000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＲＣ": 6,
      "ＳＲＣ": 3
    },
    "sampleCount": 9,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "さいたま市岩槻区",
    "layout": "ldk3",
    "medianTradePriceYen": 24000000,
    "medianSqmPriceYen": 369000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＲＣ": 8,
      "ＳＲＣ": 5
    },
    "sampleCount": 13,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "さいたま市見沼区",
    "layout": "ldk2",
    "medianTradePriceYen": 18000000,
    "medianSqmPriceYen": 301000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 215000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 12,
    "structureCounts": {
      "ＲＣ": 9,
      "ＳＲＣ": 3
    },
    "sampleCount": 12,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "さいたま市見沼区",
    "layout": "ldk3",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 286000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 286000,
        "sampleCount": 7
      },
      "age_31_40": {
        "medianSqmPriceYen": 333000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 17,
    "structureCounts": {
      "ＲＣ": 13,
      "ＳＲＣ": 3
    },
    "sampleCount": 17,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "さいたま市桜区",
    "layout": "ldk2",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 354000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 409000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＳＲＣ": 4,
      "ＲＣ": 9
    },
    "sampleCount": 13,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "さいたま市桜区",
    "layout": "ldk3",
    "medianTradePriceYen": 23500000,
    "medianSqmPriceYen": 354000,
    "medianAreaSqm": 65,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 508000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 12,
    "structureCounts": {
      "ＲＣ": 8,
      "ＳＲＣ": 4
    },
    "sampleCount": 12,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "さいたま市西区",
    "layout": "ldk1",
    "medianTradePriceYen": 3300000,
    "medianSqmPriceYen": 66000,
    "medianAreaSqm": 45,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "さいたま市西区",
    "layout": "ldk2",
    "medianTradePriceYen": 4100000,
    "medianSqmPriceYen": 86000,
    "medianAreaSqm": 50,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 74000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＲＣ": 9,
      "ＳＲＣ": 1
    },
    "sampleCount": 10,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "さいたま市西区",
    "layout": "ldk3",
    "medianTradePriceYen": 37500000,
    "medianSqmPriceYen": 526000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 6
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "さいたま市南区",
    "layout": "k1",
    "medianTradePriceYen": 19000000,
    "medianSqmPriceYen": 950000,
    "medianAreaSqm": 20,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 7
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "さいたま市南区",
    "layout": "ldk1",
    "medianTradePriceYen": 33000000,
    "medianSqmPriceYen": 1100000,
    "medianAreaSqm": 30,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 3
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "さいたま市南区",
    "layout": "ldk2",
    "medianTradePriceYen": 33000000,
    "medianSqmPriceYen": 514000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 557000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 18,
    "structureCounts": {
      "ＲＣ": 17,
      "ＳＲＣ": 2
    },
    "sampleCount": 19,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "さいたま市南区",
    "layout": "ldk3",
    "medianTradePriceYen": 38000000,
    "medianSqmPriceYen": 543000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 792000,
        "sampleCount": 10
      },
      "age_21_30": {
        "medianSqmPriceYen": 586000,
        "sampleCount": 24
      },
      "age_31_40": {
        "medianSqmPriceYen": 369000,
        "sampleCount": 17
      },
      "age_41_plus": {
        "medianSqmPriceYen": 374000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 60,
    "structureCounts": {
      "ＲＣ": 47,
      "ＳＲＣ": 14
    },
    "sampleCount": 61,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "さいたま市北区",
    "layout": "ldk1",
    "medianTradePriceYen": 38000000,
    "medianSqmPriceYen": 844000,
    "medianAreaSqm": 45,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 889000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＲＣ": 9,
      "鉄骨造": 1
    },
    "sampleCount": 10,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "さいたま市北区",
    "layout": "ldk2",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 383000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 333000,
        "sampleCount": 11
      }
    },
    "buildingYearSampleCount": 19,
    "structureCounts": {
      "ＲＣ": 15,
      "ＳＲＣ": 4
    },
    "sampleCount": 19,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "さいたま市北区",
    "layout": "ldk3",
    "medianTradePriceYen": 31500000,
    "medianSqmPriceYen": 459000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 743000,
        "sampleCount": 5
      },
      "age_11_20": {
        "medianSqmPriceYen": 545000,
        "sampleCount": 14
      },
      "age_21_30": {
        "medianSqmPriceYen": 429000,
        "sampleCount": 14
      },
      "age_31_40": {
        "medianSqmPriceYen": 386000,
        "sampleCount": 11
      }
    },
    "buildingYearSampleCount": 46,
    "structureCounts": {
      "ＳＲＣ": 8,
      "ＲＣ": 38
    },
    "sampleCount": 46,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "さいたま市緑区",
    "layout": "ldk2",
    "medianTradePriceYen": 19000000,
    "medianSqmPriceYen": 323000,
    "medianAreaSqm": 55,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 5
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "さいたま市緑区",
    "layout": "ldk3",
    "medianTradePriceYen": 27000000,
    "medianSqmPriceYen": 415000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 292000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 17,
    "structureCounts": {
      "ＳＲＣ": 4,
      "ＲＣ": 11
    },
    "sampleCount": 20,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "ふじみ野市",
    "layout": "ldk2",
    "medianTradePriceYen": 22500000,
    "medianSqmPriceYen": 419000,
    "medianAreaSqm": 58,
    "ageBands": {},
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＲＣ": 6,
      "ＳＲＣ": 3
    },
    "sampleCount": 10,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "ふじみ野市",
    "layout": "ldk3",
    "medianTradePriceYen": 31000000,
    "medianSqmPriceYen": 411000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 463000,
        "sampleCount": 7
      },
      "age_21_30": {
        "medianSqmPriceYen": 350000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 187000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 19,
    "structureCounts": {
      "ＲＣ": 16,
      "ＳＲＣ": 1,
      "ＲＣ、鉄骨造": 1
    },
    "sampleCount": 19,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "越谷市",
    "layout": "ldk1",
    "medianTradePriceYen": 18000000,
    "medianSqmPriceYen": 400000,
    "medianAreaSqm": 50,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 3,
      "ＲＣ": 2
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "越谷市",
    "layout": "ldk2",
    "medianTradePriceYen": 17000000,
    "medianSqmPriceYen": 333000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 200000,
        "sampleCount": 9
      },
      "age_41_plus": {
        "medianSqmPriceYen": 257000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 21,
    "structureCounts": {
      "ＲＣ": 16,
      "ＳＲＣ": 5
    },
    "sampleCount": 21,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "越谷市",
    "layout": "ldk3",
    "medianTradePriceYen": 30000000,
    "medianSqmPriceYen": 422000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 657000,
        "sampleCount": 19
      },
      "age_11_20": {
        "medianSqmPriceYen": 565000,
        "sampleCount": 28
      },
      "age_21_30": {
        "medianSqmPriceYen": 386000,
        "sampleCount": 33
      },
      "age_31_40": {
        "medianSqmPriceYen": 300000,
        "sampleCount": 17
      },
      "age_41_plus": {
        "medianSqmPriceYen": 229000,
        "sampleCount": 16
      }
    },
    "buildingYearSampleCount": 113,
    "structureCounts": {
      "ＲＣ": 92,
      "ＳＲＣ": 19
    },
    "sampleCount": 114,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "桶川市",
    "layout": "ldk3",
    "medianTradePriceYen": 15000000,
    "medianSqmPriceYen": 209000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＳＲＣ": 1,
      "ＲＣ": 9
    },
    "sampleCount": 10,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "加須市",
    "layout": "ldk2",
    "medianTradePriceYen": 9900000,
    "medianSqmPriceYen": 133000,
    "medianAreaSqm": 65,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 133000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 3,
      "ＲＣ": 2
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q4",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "吉川市",
    "layout": "ldk2",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 300000,
    "medianAreaSqm": 60,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 7
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "吉川市",
    "layout": "ldk3",
    "medianTradePriceYen": 32000000,
    "medianSqmPriceYen": 457000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＲＣ": 8,
      "ＳＲＣ": 3
    },
    "sampleCount": 11,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "久喜市",
    "layout": "ldk2",
    "medianTradePriceYen": 7000000,
    "medianSqmPriceYen": 127000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 127000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 6,
      "ＳＲＣ": 1
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "久喜市",
    "layout": "ldk3",
    "medianTradePriceYen": 18000000,
    "medianSqmPriceYen": 257000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 163000,
        "sampleCount": 5
      },
      "age_41_plus": {
        "medianSqmPriceYen": 158000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 17,
    "structureCounts": {
      "ＳＲＣ": 5,
      "ＲＣ": 12
    },
    "sampleCount": 17,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "狭山市",
    "layout": "ldk1",
    "medianTradePriceYen": 3400000,
    "medianSqmPriceYen": 72000,
    "medianAreaSqm": 45,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 6
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "狭山市",
    "layout": "ldk2",
    "medianTradePriceYen": 4500000,
    "medianSqmPriceYen": 100000,
    "medianAreaSqm": 50,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 100000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "狭山市",
    "layout": "ldk3",
    "medianTradePriceYen": 11500000,
    "medianSqmPriceYen": 159000,
    "medianAreaSqm": 73,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 6
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "熊谷市",
    "layout": "ldk1",
    "medianTradePriceYen": 5300000,
    "medianSqmPriceYen": 136000,
    "medianAreaSqm": 40,
    "ageBands": {},
    "buildingYearSampleCount": 4,
    "structureCounts": {
      "ＳＲＣ": 5
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "熊谷市",
    "layout": "ldk2",
    "medianTradePriceYen": 6800000,
    "medianSqmPriceYen": 136000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 124000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 12,
    "structureCounts": {
      "ＲＣ": 11,
      "ＳＲＣ": 1
    },
    "sampleCount": 12,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "熊谷市",
    "layout": "ldk3",
    "medianTradePriceYen": 23000000,
    "medianSqmPriceYen": 317000,
    "medianAreaSqm": 68,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 325000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 14,
    "structureCounts": {
      "ＲＣ": 11,
      "ＳＲＣ": 3
    },
    "sampleCount": 14,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "鴻巣市",
    "layout": "ldk2",
    "medianTradePriceYen": 13500000,
    "medianSqmPriceYen": 247000,
    "medianAreaSqm": 60,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 3,
      "ＳＲＣ": 3
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "鴻巣市",
    "layout": "ldk3",
    "medianTradePriceYen": 17000000,
    "medianSqmPriceYen": 229000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＳＲＣ": 1,
      "ＲＣ": 7
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "坂戸市",
    "layout": "ldk2",
    "medianTradePriceYen": 3800000,
    "medianSqmPriceYen": 73000,
    "medianAreaSqm": 58,
    "ageBands": {},
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 6
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "坂戸市",
    "layout": "ldk3",
    "medianTradePriceYen": 23500000,
    "medianSqmPriceYen": 286000,
    "medianAreaSqm": 73,
    "ageBands": {},
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 4
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "埼玉市浦和區",
    "layout": "k1",
    "medianTradePriceYen": 18500000,
    "medianSqmPriceYen": 717000,
    "medianAreaSqm": 25,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 7,
      "ＳＲＣ": 1
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "埼玉市浦和區",
    "layout": "ldk1",
    "medianTradePriceYen": 25000000,
    "medianSqmPriceYen": 670000,
    "medianAreaSqm": 33,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 6
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "埼玉市浦和區",
    "layout": "ldk2",
    "medianTradePriceYen": 42000000,
    "medianSqmPriceYen": 764000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 1000000,
        "sampleCount": 8
      },
      "age_21_30": {
        "medianSqmPriceYen": 733000,
        "sampleCount": 7
      },
      "age_31_40": {
        "medianSqmPriceYen": 600000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 27,
    "structureCounts": {
      "ＲＣ": 22,
      "ＳＲＣ": 4,
      "鉄骨造": 1
    },
    "sampleCount": 27,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "埼玉市浦和區",
    "layout": "ldk3",
    "medianTradePriceYen": 62000000,
    "medianSqmPriceYen": 896000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1077000,
        "sampleCount": 15
      },
      "age_11_20": {
        "medianSqmPriceYen": 936000,
        "sampleCount": 26
      },
      "age_21_30": {
        "medianSqmPriceYen": 753000,
        "sampleCount": 21
      },
      "age_31_40": {
        "medianSqmPriceYen": 486000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 72,
    "structureCounts": {
      "ＲＣ": 61,
      "ＳＲＣ": 11
    },
    "sampleCount": 72,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "埼玉市大宮區",
    "layout": "k1",
    "medianTradePriceYen": 18500000,
    "medianSqmPriceYen": 925000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 850000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＳＲＣ": 3,
      "ＲＣ": 7
    },
    "sampleCount": 12,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "埼玉市大宮區",
    "layout": "ldk1",
    "medianTradePriceYen": 23000000,
    "medianSqmPriceYen": 657000,
    "medianAreaSqm": 35,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 6,
      "ＳＲＣ": 2
    },
    "sampleCount": 8,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "埼玉市大宮區",
    "layout": "ldk2",
    "medianTradePriceYen": 37000000,
    "medianSqmPriceYen": 599000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 1062000,
        "sampleCount": 8
      },
      "age_21_30": {
        "medianSqmPriceYen": 575000,
        "sampleCount": 8
      },
      "age_31_40": {
        "medianSqmPriceYen": 392000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 26,
    "structureCounts": {
      "ＲＣ": 21,
      "ＳＲＣ": 5
    },
    "sampleCount": 26,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "埼玉市大宮區",
    "layout": "ldk3",
    "medianTradePriceYen": 60500000,
    "medianSqmPriceYen": 846000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1105000,
        "sampleCount": 8
      },
      "age_11_20": {
        "medianSqmPriceYen": 1054000,
        "sampleCount": 12
      },
      "age_21_30": {
        "medianSqmPriceYen": 743000,
        "sampleCount": 13
      },
      "age_31_40": {
        "medianSqmPriceYen": 419000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 44,
    "structureCounts": {
      "ＲＣ": 34,
      "ＳＲＣ": 10
    },
    "sampleCount": 44,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "埼玉市中央區",
    "layout": "ldk1",
    "medianTradePriceYen": 26000000,
    "medianSqmPriceYen": 650000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 650000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 3,
      "ＳＲＣ": 3
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q4",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "埼玉市中央區",
    "layout": "ldk2",
    "medianTradePriceYen": 31000000,
    "medianSqmPriceYen": 620000,
    "medianAreaSqm": 65,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 461000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＲＣ": 11
    },
    "sampleCount": 11,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "埼玉市中央區",
    "layout": "ldk3",
    "medianTradePriceYen": 48500000,
    "medianSqmPriceYen": 600000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 829000,
        "sampleCount": 7
      },
      "age_21_30": {
        "medianSqmPriceYen": 677000,
        "sampleCount": 15
      },
      "age_31_40": {
        "medianSqmPriceYen": 470000,
        "sampleCount": 12
      }
    },
    "buildingYearSampleCount": 38,
    "structureCounts": {
      "ＳＲＣ": 11,
      "ＲＣ": 26,
      "鉄骨造": 1
    },
    "sampleCount": 38,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "三鄉市",
    "layout": "ldk2",
    "medianTradePriceYen": 12000000,
    "medianSqmPriceYen": 209000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 218000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 12,
    "structureCounts": {
      "ＲＣ": 11,
      "ＳＲＣ": 1
    },
    "sampleCount": 12,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "三鄉市",
    "layout": "ldk3",
    "medianTradePriceYen": 26500000,
    "medianSqmPriceYen": 313000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 554000,
        "sampleCount": 7
      },
      "age_11_20": {
        "medianSqmPriceYen": 720000,
        "sampleCount": 7
      },
      "age_21_30": {
        "medianSqmPriceYen": 271000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 225000,
        "sampleCount": 15
      }
    },
    "buildingYearSampleCount": 34,
    "structureCounts": {
      "ＲＣ": 29,
      "ＳＲＣ": 5
    },
    "sampleCount": 34,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "志木市",
    "layout": "ldk2",
    "medianTradePriceYen": 26000000,
    "medianSqmPriceYen": 473000,
    "medianAreaSqm": 55,
    "ageBands": {},
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 11
    },
    "sampleCount": 13,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "志木市",
    "layout": "ldk3",
    "medianTradePriceYen": 24000000,
    "medianSqmPriceYen": 343000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 414000,
        "sampleCount": 13
      },
      "age_21_30": {
        "medianSqmPriceYen": 412000,
        "sampleCount": 6
      },
      "age_41_plus": {
        "medianSqmPriceYen": 223000,
        "sampleCount": 22
      }
    },
    "buildingYearSampleCount": 45,
    "structureCounts": {
      "ＳＲＣ": 5,
      "ＲＣ": 40
    },
    "sampleCount": 45,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "春日部市",
    "layout": "ldk2",
    "medianTradePriceYen": 8900000,
    "medianSqmPriceYen": 161000,
    "medianAreaSqm": 53,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 161000,
        "sampleCount": 6
      },
      "age_41_plus": {
        "medianSqmPriceYen": 95000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 18,
    "structureCounts": {
      "ＲＣ": 17,
      "ＳＲＣ": 1
    },
    "sampleCount": 18,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "春日部市",
    "layout": "ldk3",
    "medianTradePriceYen": 15000000,
    "medianSqmPriceYen": 213000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 285000,
        "sampleCount": 8
      },
      "age_31_40": {
        "medianSqmPriceYen": 186000,
        "sampleCount": 9
      },
      "age_41_plus": {
        "medianSqmPriceYen": 114000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 24,
    "structureCounts": {
      "ＲＣ": 20,
      "ＳＲＣ": 4
    },
    "sampleCount": 24,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "所澤市",
    "layout": "k1",
    "medianTradePriceYen": 10200000,
    "medianSqmPriceYen": 418000,
    "medianAreaSqm": 20,
    "ageBands": {},
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＲＣ": 8
    },
    "sampleCount": 8,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "所澤市",
    "layout": "ldk1",
    "medianTradePriceYen": 26000000,
    "medianSqmPriceYen": 700000,
    "medianAreaSqm": 35,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "鉄骨造": 1,
      "ＲＣ": 4
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "所澤市",
    "layout": "ldk2",
    "medianTradePriceYen": 18000000,
    "medianSqmPriceYen": 327000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 414000,
        "sampleCount": 7
      },
      "age_31_40": {
        "medianSqmPriceYen": 267000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 19,
    "structureCounts": {
      "ＲＣ": 15,
      "ＳＲＣ": 3,
      "鉄骨造": 1
    },
    "sampleCount": 19,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "所澤市",
    "layout": "ldk3",
    "medianTradePriceYen": 26500000,
    "medianSqmPriceYen": 365000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 800000,
        "sampleCount": 7
      },
      "age_11_20": {
        "medianSqmPriceYen": 498000,
        "sampleCount": 14
      },
      "age_21_30": {
        "medianSqmPriceYen": 368000,
        "sampleCount": 18
      },
      "age_31_40": {
        "medianSqmPriceYen": 354000,
        "sampleCount": 7
      },
      "age_41_plus": {
        "medianSqmPriceYen": 254000,
        "sampleCount": 16
      }
    },
    "buildingYearSampleCount": 62,
    "structureCounts": {
      "ＲＣ": 51,
      "ＳＲＣ": 13
    },
    "sampleCount": 64,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "上尾市",
    "layout": "ldk2",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 323000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 446000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 4
    },
    "sampleCount": 9,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "上尾市",
    "layout": "ldk3",
    "medianTradePriceYen": 31000000,
    "medianSqmPriceYen": 440000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 407000,
        "sampleCount": 6
      },
      "age_21_30": {
        "medianSqmPriceYen": 470000,
        "sampleCount": 6
      },
      "age_31_40": {
        "medianSqmPriceYen": 369000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 23,
    "structureCounts": {
      "ＲＣ": 16,
      "ＳＲＣ": 7
    },
    "sampleCount": 23,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "新座市",
    "layout": "ldk2",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 400000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 349000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 15,
    "structureCounts": {
      "ＲＣ": 14,
      "ＳＲＣ": 1
    },
    "sampleCount": 15,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "新座市",
    "layout": "ldk3",
    "medianTradePriceYen": 25000000,
    "medianSqmPriceYen": 357000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 482000,
        "sampleCount": 6
      },
      "age_31_40": {
        "medianSqmPriceYen": 294000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 23,
    "structureCounts": {
      "ＲＣ": 21,
      "ＳＲＣ": 2
    },
    "sampleCount": 23,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "深谷市",
    "layout": "ldk2",
    "medianTradePriceYen": 6300000,
    "medianSqmPriceYen": 113000,
    "medianAreaSqm": 58,
    "ageBands": {},
    "buildingYearSampleCount": 3,
    "structureCounts": {
      "ＲＣ": 3
    },
    "sampleCount": 8,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q2",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "深谷市",
    "layout": "ldk3",
    "medianTradePriceYen": 7000000,
    "medianSqmPriceYen": 108000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 4
    },
    "sampleCount": 9,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "川越市",
    "layout": "ldk1",
    "medianTradePriceYen": 6200000,
    "medianSqmPriceYen": 177000,
    "medianAreaSqm": 35,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "川越市",
    "layout": "ldk2",
    "medianTradePriceYen": 17000000,
    "medianSqmPriceYen": 311000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 273000,
        "sampleCount": 11
      },
      "age_41_plus": {
        "medianSqmPriceYen": 133000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 29,
    "structureCounts": {
      "ＲＣ": 19,
      "ＳＲＣ": 9
    },
    "sampleCount": 29,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "川越市",
    "layout": "ldk3",
    "medianTradePriceYen": 23000000,
    "medianSqmPriceYen": 288000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 477000,
        "sampleCount": 7
      },
      "age_21_30": {
        "medianSqmPriceYen": 299000,
        "sampleCount": 14
      },
      "age_31_40": {
        "medianSqmPriceYen": 215000,
        "sampleCount": 9
      },
      "age_41_plus": {
        "medianSqmPriceYen": 262000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 41,
    "structureCounts": {
      "ＳＲＣ": 11,
      "ＲＣ": 29
    },
    "sampleCount": 41,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "川口市",
    "layout": "k1",
    "medianTradePriceYen": 27000000,
    "medianSqmPriceYen": 1245000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1300000,
        "sampleCount": 78
      },
      "age_11_20": {
        "medianSqmPriceYen": 925000,
        "sampleCount": 14
      }
    },
    "buildingYearSampleCount": 100,
    "structureCounts": {
      "ＲＣ": 96,
      "ＳＲＣ": 2
    },
    "sampleCount": 100,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "川口市",
    "layout": "ldk1",
    "medianTradePriceYen": 13500000,
    "medianSqmPriceYen": 321000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 280000,
        "sampleCount": 11
      },
      "age_41_plus": {
        "medianSqmPriceYen": 260000,
        "sampleCount": 17
      }
    },
    "buildingYearSampleCount": 37,
    "structureCounts": {
      "ＲＣ": 22,
      "ＳＲＣ": 13,
      "ＳＲＣ、ＲＣ": 1
    },
    "sampleCount": 38,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "川口市",
    "layout": "ldk2",
    "medianTradePriceYen": 30000000,
    "medianSqmPriceYen": 508000,
    "medianAreaSqm": 58,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 667000,
        "sampleCount": 17
      },
      "age_21_30": {
        "medianSqmPriceYen": 582000,
        "sampleCount": 19
      },
      "age_31_40": {
        "medianSqmPriceYen": 485000,
        "sampleCount": 18
      },
      "age_41_plus": {
        "medianSqmPriceYen": 308000,
        "sampleCount": 18
      }
    },
    "buildingYearSampleCount": 76,
    "structureCounts": {
      "ＲＣ": 52,
      "ＲＣ、鉄骨造": 3,
      "ＳＲＣ": 20
    },
    "sampleCount": 76,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "川口市",
    "layout": "ldk3",
    "medianTradePriceYen": 38000000,
    "medianSqmPriceYen": 528000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 708000,
        "sampleCount": 7
      },
      "age_11_20": {
        "medianSqmPriceYen": 608000,
        "sampleCount": 46
      },
      "age_21_30": {
        "medianSqmPriceYen": 533000,
        "sampleCount": 55
      },
      "age_31_40": {
        "medianSqmPriceYen": 350000,
        "sampleCount": 24
      },
      "age_41_plus": {
        "medianSqmPriceYen": 215000,
        "sampleCount": 13
      }
    },
    "buildingYearSampleCount": 145,
    "structureCounts": {
      "ＲＣ": 103,
      "ＳＲＣ": 37,
      "ＳＲＣ、ＲＣ": 1,
      "ＲＣ、鉄骨造": 2
    },
    "sampleCount": 146,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "川口市",
    "layout": "r1",
    "medianTradePriceYen": 8800000,
    "medianSqmPriceYen": 583000,
    "medianAreaSqm": 15,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 4
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "草加市",
    "layout": "ldk1",
    "medianTradePriceYen": 24000000,
    "medianSqmPriceYen": 533000,
    "medianAreaSqm": 45,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 3
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "草加市",
    "layout": "ldk2",
    "medianTradePriceYen": 16000000,
    "medianSqmPriceYen": 291000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 433000,
        "sampleCount": 7
      },
      "age_31_40": {
        "medianSqmPriceYen": 200000,
        "sampleCount": 7
      },
      "age_41_plus": {
        "medianSqmPriceYen": 155000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 25,
    "structureCounts": {
      "ＲＣ": 20,
      "ＳＲＣ": 6
    },
    "sampleCount": 27,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "草加市",
    "layout": "ldk3",
    "medianTradePriceYen": 33000000,
    "medianSqmPriceYen": 431000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 600000,
        "sampleCount": 10
      },
      "age_11_20": {
        "medianSqmPriceYen": 446000,
        "sampleCount": 6
      },
      "age_21_30": {
        "medianSqmPriceYen": 431000,
        "sampleCount": 27
      },
      "age_31_40": {
        "medianSqmPriceYen": 302000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 57,
    "structureCounts": {
      "ＳＲＣ": 16,
      "ＲＣ": 42
    },
    "sampleCount": 59,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "朝霞市",
    "layout": "ldk1",
    "medianTradePriceYen": 21500000,
    "medianSqmPriceYen": 532000,
    "medianAreaSqm": 45,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 3,
      "ＳＲＣ": 3
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "朝霞市",
    "layout": "ldk2",
    "medianTradePriceYen": 23000000,
    "medianSqmPriceYen": 383000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 517000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 338000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 18,
    "structureCounts": {
      "ＲＣ": 11,
      "ＳＲＣ": 7
    },
    "sampleCount": 18,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "朝霞市",
    "layout": "ldk3",
    "medianTradePriceYen": 40000000,
    "medianSqmPriceYen": 565000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 599000,
        "sampleCount": 8
      },
      "age_11_20": {
        "medianSqmPriceYen": 629000,
        "sampleCount": 9
      },
      "age_21_30": {
        "medianSqmPriceYen": 565000,
        "sampleCount": 23
      },
      "age_31_40": {
        "medianSqmPriceYen": 462000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 49,
    "structureCounts": {
      "ＲＣ": 42,
      "ＳＲＣ": 7
    },
    "sampleCount": 49,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "鶴ケ島市",
    "layout": "ldk2",
    "medianTradePriceYen": 12000000,
    "medianSqmPriceYen": 218000,
    "medianAreaSqm": 55,
    "ageBands": {},
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＲＣ": 8,
      "ＳＲＣ": 3
    },
    "sampleCount": 11,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "鶴ケ島市",
    "layout": "ldk3",
    "medianTradePriceYen": 22000000,
    "medianSqmPriceYen": 338000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 400000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＲＣ": 13
    },
    "sampleCount": 13,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "東松山市",
    "layout": "ldk2",
    "medianTradePriceYen": 6800000,
    "medianSqmPriceYen": 124000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 95000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 6,
      "ＳＲＣ": 1
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "東松山市",
    "layout": "ldk3",
    "medianTradePriceYen": 6700000,
    "medianSqmPriceYen": 83000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 40000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＲＣ": 10,
      "ＳＲＣ": 1
    },
    "sampleCount": 13,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "入間郡三芳町",
    "layout": "ldk3",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 280000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 75000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 17,
    "structureCounts": {
      "ＲＣ": 12,
      "ＳＲＣ": 5
    },
    "sampleCount": 17,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "入間市",
    "layout": "ldk2",
    "medianTradePriceYen": 10300000,
    "medianSqmPriceYen": 171000,
    "medianAreaSqm": 55,
    "ageBands": {},
    "buildingYearSampleCount": 12,
    "structureCounts": {
      "ＲＣ": 10,
      "ＳＲＣ": 1
    },
    "sampleCount": 12,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "入間市",
    "layout": "ldk3",
    "medianTradePriceYen": 12000000,
    "medianSqmPriceYen": 157000,
    "medianAreaSqm": 68,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 323000,
        "sampleCount": 7
      },
      "age_31_40": {
        "medianSqmPriceYen": 160000,
        "sampleCount": 11
      },
      "age_41_plus": {
        "medianSqmPriceYen": 65000,
        "sampleCount": 12
      }
    },
    "buildingYearSampleCount": 30,
    "structureCounts": {
      "ＳＲＣ": 8,
      "ＲＣ": 15
    },
    "sampleCount": 30,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "白岡市",
    "layout": "ldk3",
    "medianTradePriceYen": 19000000,
    "medianSqmPriceYen": 271000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 288000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＲＣ": 6,
      "ＳＲＣ": 7
    },
    "sampleCount": 13,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "八潮市",
    "layout": "ldk2",
    "medianTradePriceYen": 13000000,
    "medianSqmPriceYen": 236000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 152000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 15,
    "structureCounts": {
      "ＲＣ": 8,
      "ＳＲＣ": 7
    },
    "sampleCount": 15,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "八潮市",
    "layout": "ldk3",
    "medianTradePriceYen": 38500000,
    "medianSqmPriceYen": 569000,
    "medianAreaSqm": 65,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 738000,
        "sampleCount": 7
      },
      "age_11_20": {
        "medianSqmPriceYen": 394000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 18,
    "structureCounts": {
      "ＲＣ": 15,
      "ＳＲＣ": 3
    },
    "sampleCount": 18,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "飯能市",
    "layout": "ldk2",
    "medianTradePriceYen": 9000000,
    "medianSqmPriceYen": 189000,
    "medianAreaSqm": 50,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 180000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＳＲＣ": 1,
      "ＲＣ": 6
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "飯能市",
    "layout": "ldk3",
    "medianTradePriceYen": 15000000,
    "medianSqmPriceYen": 200000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "富士見市",
    "layout": "ldk2",
    "medianTradePriceYen": 26000000,
    "medianSqmPriceYen": 433000,
    "medianAreaSqm": 60,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 3
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "富士見市",
    "layout": "ldk3",
    "medianTradePriceYen": 28000000,
    "medianSqmPriceYen": 400000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 492000,
        "sampleCount": 7
      },
      "age_21_30": {
        "medianSqmPriceYen": 400000,
        "sampleCount": 8
      },
      "age_41_plus": {
        "medianSqmPriceYen": 262000,
        "sampleCount": 13
      }
    },
    "buildingYearSampleCount": 29,
    "structureCounts": {
      "ＳＲＣ": 12,
      "ＲＣ": 17
    },
    "sampleCount": 29,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "北葛飾郡杉戸町",
    "layout": "ldk3",
    "medianTradePriceYen": 9800000,
    "medianSqmPriceYen": 119000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 98000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＲＣ": 10
    },
    "sampleCount": 10,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "蓮田市",
    "layout": "ldk3",
    "medianTradePriceYen": 23000000,
    "medianSqmPriceYen": 256000,
    "medianAreaSqm": 85,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 3,
      "ＲＣ": 2
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q4",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "和光市",
    "layout": "ldk1",
    "medianTradePriceYen": 17000000,
    "medianSqmPriceYen": 380000,
    "medianAreaSqm": 45,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 400000,
        "sampleCount": 5
      },
      "age_41_plus": {
        "medianSqmPriceYen": 289000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＲＣ": 9,
      "ＳＲＣ": 1
    },
    "sampleCount": 10,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "和光市",
    "layout": "ldk2",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 382000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 355000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 14,
    "structureCounts": {
      "ＲＣ": 9,
      "ＳＲＣ": 5
    },
    "sampleCount": 14,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "和光市",
    "layout": "ldk3",
    "medianTradePriceYen": 40000000,
    "medianSqmPriceYen": 548000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 600000,
        "sampleCount": 9
      },
      "age_21_30": {
        "medianSqmPriceYen": 524000,
        "sampleCount": 12
      },
      "age_41_plus": {
        "medianSqmPriceYen": 579000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 34,
    "structureCounts": {
      "ＲＣ": 21,
      "ＳＲＣ": 13
    },
    "sampleCount": 34,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "蕨市",
    "layout": "k1",
    "medianTradePriceYen": 22000000,
    "medianSqmPriceYen": 867000,
    "medianAreaSqm": 25,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "軽量鉄骨造": 1,
      "ＲＣ": 4,
      "ＳＲＣ": 2
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "蕨市",
    "layout": "ldk1",
    "medianTradePriceYen": 31000000,
    "medianSqmPriceYen": 1033000,
    "medianAreaSqm": 30,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 6
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "蕨市",
    "layout": "ldk2",
    "medianTradePriceYen": 30000000,
    "medianSqmPriceYen": 506000,
    "medianAreaSqm": 55,
    "ageBands": {},
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＲＣ": 7,
      "ＳＲＣ": 1
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "蕨市",
    "layout": "ldk3",
    "medianTradePriceYen": 31000000,
    "medianSqmPriceYen": 443000,
    "medianAreaSqm": 65,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 431000,
        "sampleCount": 11
      }
    },
    "buildingYearSampleCount": 19,
    "structureCounts": {
      "ＲＣ": 12,
      "ＳＲＣ": 7
    },
    "sampleCount": 19,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "戶田市",
    "layout": "ldk2",
    "medianTradePriceYen": 33000000,
    "medianSqmPriceYen": 567000,
    "medianAreaSqm": 60,
    "ageBands": {},
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＲＣ": 8,
      "ＳＲＣ": 1
    },
    "sampleCount": 10,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "埼玉",
    "district": "戶田市",
    "layout": "ldk3",
    "medianTradePriceYen": 41500000,
    "medianSqmPriceYen": 564000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 673000,
        "sampleCount": 18
      },
      "age_21_30": {
        "medianSqmPriceYen": 508000,
        "sampleCount": 17
      },
      "age_31_40": {
        "medianSqmPriceYen": 400000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 45,
    "structureCounts": {
      "ＳＲＣ": 9,
      "ＲＣ": 37
    },
    "sampleCount": 46,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "三重",
    "district": "伊勢市",
    "layout": "ldk3",
    "medianTradePriceYen": 39000000,
    "medianSqmPriceYen": 471000,
    "medianAreaSqm": 78,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 4
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "三重",
    "district": "桑名市",
    "layout": "ldk3",
    "medianTradePriceYen": 18000000,
    "medianSqmPriceYen": 259000,
    "medianAreaSqm": 75,
    "ageBands": {},
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＳＲＣ": 6,
      "ＲＣ": 5
    },
    "sampleCount": 14,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "三重",
    "district": "四日市市",
    "layout": "ldk2",
    "medianTradePriceYen": 13000000,
    "medianSqmPriceYen": 200000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 4,
      "ＲＣ": 1
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "三重",
    "district": "四日市市",
    "layout": "ldk3",
    "medianTradePriceYen": 22000000,
    "medianSqmPriceYen": 300000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 357000,
        "sampleCount": 9
      },
      "age_21_30": {
        "medianSqmPriceYen": 263000,
        "sampleCount": 9
      },
      "age_31_40": {
        "medianSqmPriceYen": 223000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 28,
    "structureCounts": {
      "ＲＣ": 13,
      "ＳＲＣ": 15
    },
    "sampleCount": 29,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "三重",
    "district": "松阪市",
    "layout": "ldk3",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 211000,
    "medianAreaSqm": 90,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 2
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "三重",
    "district": "津市",
    "layout": "ldk2",
    "medianTradePriceYen": 12000000,
    "medianSqmPriceYen": 169000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "三重",
    "district": "津市",
    "layout": "ldk3",
    "medianTradePriceYen": 22000000,
    "medianSqmPriceYen": 259000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 270000,
        "sampleCount": 5
      },
      "age_21_30": {
        "medianSqmPriceYen": 250000,
        "sampleCount": 13
      }
    },
    "buildingYearSampleCount": 19,
    "structureCounts": {
      "ＲＣ": 16,
      "ＳＲＣ": 3
    },
    "sampleCount": 19,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "三重",
    "district": "鈴鹿市",
    "layout": "ldk2",
    "medianTradePriceYen": 12000000,
    "medianSqmPriceYen": 171000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 1
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q4",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "三重",
    "district": "鈴鹿市",
    "layout": "ldk3",
    "medianTradePriceYen": 14000000,
    "medianSqmPriceYen": 173000,
    "medianAreaSqm": 85,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 200000,
        "sampleCount": 7
      },
      "age_31_40": {
        "medianSqmPriceYen": 119000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 18,
    "structureCounts": {
      "ＳＲＣ": 7,
      "ＲＣ": 11
    },
    "sampleCount": 18,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "山形",
    "district": "山形市",
    "layout": "ldk1",
    "medianTradePriceYen": 5800000,
    "medianSqmPriceYen": 133000,
    "medianAreaSqm": 50,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 1
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2025-Q1",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "山形",
    "district": "山形市",
    "layout": "ldk2",
    "medianTradePriceYen": 9800000,
    "medianSqmPriceYen": 173000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＲＣ": 8,
      "ＳＲＣ": 3
    },
    "sampleCount": 11,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "山形",
    "district": "山形市",
    "layout": "ldk3",
    "medianTradePriceYen": 19000000,
    "medianSqmPriceYen": 253000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 538000,
        "sampleCount": 7
      },
      "age_11_20": {
        "medianSqmPriceYen": 240000,
        "sampleCount": 6
      },
      "age_21_30": {
        "medianSqmPriceYen": 238000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 25,
    "structureCounts": {
      "ＲＣ": 21,
      "ＳＲＣ": 4
    },
    "sampleCount": 25,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "山形",
    "district": "鶴岡市",
    "layout": "ldk3",
    "medianTradePriceYen": 26500000,
    "medianSqmPriceYen": 379000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 1
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2025-Q1",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "山口",
    "district": "宇部市",
    "layout": "ldk3",
    "medianTradePriceYen": 16000000,
    "medianSqmPriceYen": 213000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 150000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＳＲＣ": 5,
      "ＲＣ": 8
    },
    "sampleCount": 13,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "山口",
    "district": "下関市",
    "layout": "ldk2",
    "medianTradePriceYen": 10000000,
    "medianSqmPriceYen": 167000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 3,
      "ＲＣ": 2
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "山口",
    "district": "下関市",
    "layout": "ldk3",
    "medianTradePriceYen": 14500000,
    "medianSqmPriceYen": 181000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 168000,
        "sampleCount": 15
      },
      "age_31_40": {
        "medianSqmPriceYen": 132000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 31,
    "structureCounts": {
      "ＳＲＣ": 20,
      "ＲＣ": 16
    },
    "sampleCount": 36,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "山口",
    "district": "岩国市",
    "layout": "ldk3",
    "medianTradePriceYen": 15000000,
    "medianSqmPriceYen": 230000,
    "medianAreaSqm": 65,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 185000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 12,
    "structureCounts": {
      "ＳＲＣ": 10,
      "ＲＣ": 1
    },
    "sampleCount": 12,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "山口",
    "district": "山口市",
    "layout": "ldk2",
    "medianTradePriceYen": 15000000,
    "medianSqmPriceYen": 273000,
    "medianAreaSqm": 55,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 3
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "山口",
    "district": "山口市",
    "layout": "ldk3",
    "medianTradePriceYen": 18000000,
    "medianSqmPriceYen": 200000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 329000,
        "sampleCount": 5
      },
      "age_21_30": {
        "medianSqmPriceYen": 189000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 122000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 19,
    "structureCounts": {
      "ＳＲＣ": 11,
      "ＲＣ": 10
    },
    "sampleCount": 21,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "山口",
    "district": "周南市",
    "layout": "ldk2",
    "medianTradePriceYen": 11000000,
    "medianSqmPriceYen": 169000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 4,
    "structureCounts": {
      "ＳＲＣ": 4
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "山口",
    "district": "周南市",
    "layout": "ldk3",
    "medianTradePriceYen": 16000000,
    "medianSqmPriceYen": 213000,
    "medianAreaSqm": 75,
    "ageBands": {},
    "buildingYearSampleCount": 4,
    "structureCounts": {
      "ＲＣ": 2,
      "ＳＲＣ": 2
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "山口",
    "district": "防府市",
    "layout": "ldk3",
    "medianTradePriceYen": 17000000,
    "medianSqmPriceYen": 211000,
    "medianAreaSqm": 75,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 4,
      "ＲＣ": 1
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "山梨",
    "district": "甲府市",
    "layout": "ldk1",
    "medianTradePriceYen": 4800000,
    "medianSqmPriceYen": 120000,
    "medianAreaSqm": 45,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "鉄骨造": 1,
      "ＲＣ": 2,
      "ＳＲＣ": 2
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q4",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "山梨",
    "district": "甲府市",
    "layout": "ldk2",
    "medianTradePriceYen": 7500000,
    "medianSqmPriceYen": 143000,
    "medianAreaSqm": 55,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 6,
      "ＳＲＣ": 1
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "山梨",
    "district": "甲府市",
    "layout": "ldk3",
    "medianTradePriceYen": 25000000,
    "medianSqmPriceYen": 351000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 500000,
        "sampleCount": 9
      },
      "age_11_20": {
        "medianSqmPriceYen": 307000,
        "sampleCount": 6
      },
      "age_21_30": {
        "medianSqmPriceYen": 329000,
        "sampleCount": 6
      },
      "age_31_40": {
        "medianSqmPriceYen": 143000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 26,
    "structureCounts": {
      "ＳＲＣ": 5,
      "ＲＣ": 23
    },
    "sampleCount": 28,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "滋賀",
    "district": "草津市",
    "layout": "ldk2",
    "medianTradePriceYen": 24000000,
    "medianSqmPriceYen": 385000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＳＲＣ": 4,
      "ＲＣ": 6
    },
    "sampleCount": 11,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "滋賀",
    "district": "草津市",
    "layout": "ldk3",
    "medianTradePriceYen": 33000000,
    "medianSqmPriceYen": 440000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 585000,
        "sampleCount": 7
      },
      "age_21_30": {
        "medianSqmPriceYen": 407000,
        "sampleCount": 24
      },
      "age_31_40": {
        "medianSqmPriceYen": 373000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 39,
    "structureCounts": {
      "ＳＲＣ": 15,
      "ＳＲＣ、ＲＣ、鉄骨造": 2,
      "ＲＣ": 18,
      "ＲＣ、鉄骨造": 4
    },
    "sampleCount": 51,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "滋賀",
    "district": "大津市",
    "layout": "ldk1",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 480000,
    "medianAreaSqm": 45,
    "ageBands": {},
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＲＣ": 7,
      "ＳＲＣ": 2
    },
    "sampleCount": 9,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "滋賀",
    "district": "大津市",
    "layout": "ldk2",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 371000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 425000,
        "sampleCount": 8
      },
      "age_21_30": {
        "medianSqmPriceYen": 267000,
        "sampleCount": 8
      },
      "age_31_40": {
        "medianSqmPriceYen": 208000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 25,
    "structureCounts": {
      "ＲＣ": 18,
      "ＳＲＣ": 6
    },
    "sampleCount": 31,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "滋賀",
    "district": "大津市",
    "layout": "ldk3",
    "medianTradePriceYen": 24500000,
    "medianSqmPriceYen": 338000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 514000,
        "sampleCount": 5
      },
      "age_11_20": {
        "medianSqmPriceYen": 430000,
        "sampleCount": 34
      },
      "age_21_30": {
        "medianSqmPriceYen": 343000,
        "sampleCount": 29
      },
      "age_31_40": {
        "medianSqmPriceYen": 193000,
        "sampleCount": 28
      }
    },
    "buildingYearSampleCount": 99,
    "structureCounts": {
      "ＳＲＣ": 21,
      "ＲＣ": 77
    },
    "sampleCount": 114,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "滋賀",
    "district": "長浜市",
    "layout": "ldk3",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 267000,
    "medianAreaSqm": 75,
    "ageBands": {},
    "buildingYearSampleCount": 2,
    "structureCounts": {
      "ＳＲＣ": 5,
      "ＲＣ": 2
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "滋賀",
    "district": "彦根市",
    "layout": "ldk2",
    "medianTradePriceYen": 8900000,
    "medianSqmPriceYen": 148000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 138000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 1
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "滋賀",
    "district": "彦根市",
    "layout": "ldk3",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 280000,
    "medianAreaSqm": 75,
    "ageBands": {},
    "buildingYearSampleCount": 2,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 1
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "鹿兒島",
    "district": "薩摩川内市",
    "layout": "ldk3",
    "medianTradePriceYen": 22000000,
    "medianSqmPriceYen": 296000,
    "medianAreaSqm": 75,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 6
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q2",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "鹿兒島",
    "district": "鹿兒島市",
    "layout": "k1",
    "medianTradePriceYen": 2900000,
    "medianSqmPriceYen": 145000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 140000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＳＲＣ": 6,
      "ＲＣ": 4
    },
    "sampleCount": 10,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "鹿兒島",
    "district": "鹿兒島市",
    "layout": "ldk1",
    "medianTradePriceYen": 3500000,
    "medianSqmPriceYen": 102000,
    "medianAreaSqm": 38,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 6
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q4",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "鹿兒島",
    "district": "鹿兒島市",
    "layout": "ldk2",
    "medianTradePriceYen": 27000000,
    "medianSqmPriceYen": 455000,
    "medianAreaSqm": 65,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 643000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 12,
    "structureCounts": {
      "ＳＲＣ": 6,
      "ＲＣ": 6
    },
    "sampleCount": 13,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "鹿兒島",
    "district": "鹿兒島市",
    "layout": "ldk3",
    "medianTradePriceYen": 26000000,
    "medianSqmPriceYen": 351000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 400000,
        "sampleCount": 7
      },
      "age_11_20": {
        "medianSqmPriceYen": 400000,
        "sampleCount": 20
      },
      "age_21_30": {
        "medianSqmPriceYen": 317000,
        "sampleCount": 30
      },
      "age_31_40": {
        "medianSqmPriceYen": 200000,
        "sampleCount": 5
      },
      "age_41_plus": {
        "medianSqmPriceYen": 141000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 69,
    "structureCounts": {
      "ＳＲＣ": 26,
      "ＲＣ": 42
    },
    "sampleCount": 72,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "鹿兒島",
    "district": "霧島市",
    "layout": "ldk2",
    "medianTradePriceYen": 18000000,
    "medianSqmPriceYen": 257000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 3,
      "ＳＲＣ": 1
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "鹿兒島",
    "district": "霧島市",
    "layout": "ldk3",
    "medianTradePriceYen": 24000000,
    "medianSqmPriceYen": 300000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 279000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＲＣ": 8,
      "ＳＲＣ": 3
    },
    "sampleCount": 11,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "秋田",
    "district": "秋田市",
    "layout": "ldk1",
    "medianTradePriceYen": 5300000,
    "medianSqmPriceYen": 131000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 138000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＳＲＣ": 6
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "秋田",
    "district": "秋田市",
    "layout": "ldk2",
    "medianTradePriceYen": 7500000,
    "medianSqmPriceYen": 142000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 138000,
        "sampleCount": 11
      }
    },
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 8
    },
    "sampleCount": 13,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "秋田",
    "district": "秋田市",
    "layout": "ldk3",
    "medianTradePriceYen": 17000000,
    "medianSqmPriceYen": 223000,
    "medianAreaSqm": 78,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 229000,
        "sampleCount": 16
      }
    },
    "buildingYearSampleCount": 26,
    "structureCounts": {
      "ＳＲＣ": 16,
      "ＲＣ": 10
    },
    "sampleCount": 26,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "秋田",
    "district": "秋田市",
    "layout": "r1",
    "medianTradePriceYen": 2100000,
    "medianSqmPriceYen": 105000,
    "medianAreaSqm": 20,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 5
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "新潟",
    "district": "新潟市",
    "layout": "k1",
    "medianTradePriceYen": 3400000,
    "medianSqmPriceYen": 130000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 112000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 14,
    "structureCounts": {
      "ＳＲＣ": 12,
      "ＲＣ": 1
    },
    "sampleCount": 18,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "新潟",
    "district": "新潟市",
    "layout": "ldk1",
    "medianTradePriceYen": 6700000,
    "medianSqmPriceYen": 157000,
    "medianAreaSqm": 45,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 54000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 17,
    "structureCounts": {
      "ＲＣ": 8,
      "ＳＲＣ": 8
    },
    "sampleCount": 18,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "新潟",
    "district": "新潟市",
    "layout": "ldk2",
    "medianTradePriceYen": 19000000,
    "medianSqmPriceYen": 317000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 523000,
        "sampleCount": 5
      },
      "age_11_20": {
        "medianSqmPriceYen": 362000,
        "sampleCount": 12
      },
      "age_21_30": {
        "medianSqmPriceYen": 245000,
        "sampleCount": 10
      },
      "age_31_40": {
        "medianSqmPriceYen": 199000,
        "sampleCount": 6
      },
      "age_41_plus": {
        "medianSqmPriceYen": 255000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 40,
    "structureCounts": {
      "ＲＣ": 19,
      "ＳＲＣ": 15
    },
    "sampleCount": 51,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "新潟",
    "district": "新潟市",
    "layout": "ldk3",
    "medianTradePriceYen": 22000000,
    "medianSqmPriceYen": 278000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 543000,
        "sampleCount": 7
      },
      "age_11_20": {
        "medianSqmPriceYen": 378000,
        "sampleCount": 15
      },
      "age_21_30": {
        "medianSqmPriceYen": 257000,
        "sampleCount": 21
      },
      "age_31_40": {
        "medianSqmPriceYen": 213000,
        "sampleCount": 9
      },
      "age_41_plus": {
        "medianSqmPriceYen": 132000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 58,
    "structureCounts": {
      "ＳＲＣ": 22,
      "ＲＣ": 32
    },
    "sampleCount": 83,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "新潟",
    "district": "新潟市西区",
    "layout": "ldk2",
    "medianTradePriceYen": 15000000,
    "medianSqmPriceYen": 231000,
    "medianAreaSqm": 60,
    "ageBands": {},
    "buildingYearSampleCount": 1,
    "structureCounts": {
      "ＲＣ": 1
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "新潟",
    "district": "新潟市西区",
    "layout": "ldk3",
    "medianTradePriceYen": 18500000,
    "medianSqmPriceYen": 247000,
    "medianAreaSqm": 73,
    "ageBands": {},
    "buildingYearSampleCount": 2,
    "structureCounts": {
      "ＲＣ": 1,
      "ＳＲＣ": 1
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "新潟",
    "district": "新潟市中央区",
    "layout": "k1",
    "medianTradePriceYen": 3500000,
    "medianSqmPriceYen": 130000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 112000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＳＲＣ": 12
    },
    "sampleCount": 17,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "新潟",
    "district": "新潟市中央区",
    "layout": "ldk1",
    "medianTradePriceYen": 7000000,
    "medianSqmPriceYen": 158000,
    "medianAreaSqm": 45,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 80000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 16,
    "structureCounts": {
      "ＲＣ": 7,
      "ＳＲＣ": 8
    },
    "sampleCount": 17,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "新潟",
    "district": "新潟市中央区",
    "layout": "ldk2",
    "medianTradePriceYen": 19000000,
    "medianSqmPriceYen": 323000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 523000,
        "sampleCount": 5
      },
      "age_11_20": {
        "medianSqmPriceYen": 367000,
        "sampleCount": 11
      },
      "age_21_30": {
        "medianSqmPriceYen": 245000,
        "sampleCount": 10
      },
      "age_31_40": {
        "medianSqmPriceYen": 182000,
        "sampleCount": 5
      },
      "age_41_plus": {
        "medianSqmPriceYen": 255000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 38,
    "structureCounts": {
      "ＲＣ": 18,
      "ＳＲＣ": 14
    },
    "sampleCount": 47,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "新潟",
    "district": "新潟市中央区",
    "layout": "ldk3",
    "medianTradePriceYen": 22000000,
    "medianSqmPriceYen": 294000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 543000,
        "sampleCount": 7
      },
      "age_11_20": {
        "medianSqmPriceYen": 389000,
        "sampleCount": 14
      },
      "age_21_30": {
        "medianSqmPriceYen": 259000,
        "sampleCount": 20
      },
      "age_31_40": {
        "medianSqmPriceYen": 213000,
        "sampleCount": 9
      },
      "age_41_plus": {
        "medianSqmPriceYen": 100000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 55,
    "structureCounts": {
      "ＳＲＣ": 20,
      "ＲＣ": 31
    },
    "sampleCount": 75,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "新潟",
    "district": "新潟市東区",
    "layout": "ldk2",
    "medianTradePriceYen": 11000000,
    "medianSqmPriceYen": 169000,
    "medianAreaSqm": 60,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 1
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q4",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "新潟",
    "district": "新潟市東区",
    "layout": "ldk3",
    "medianTradePriceYen": 16500000,
    "medianSqmPriceYen": 199000,
    "medianAreaSqm": 78,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＳＲＣ": 4,
      "ＲＣ": 2
    },
    "sampleCount": 8,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "新潟",
    "district": "長岡市",
    "layout": "k1",
    "medianTradePriceYen": 2600000,
    "medianSqmPriceYen": 104000,
    "medianAreaSqm": 20,
    "ageBands": {},
    "buildingYearSampleCount": 4,
    "structureCounts": {
      "ＳＲＣ": 4,
      "ＲＣ": 2
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "新潟",
    "district": "長岡市",
    "layout": "ldk1",
    "medianTradePriceYen": 3100000,
    "medianSqmPriceYen": 62000,
    "medianAreaSqm": 40,
    "ageBands": {},
    "buildingYearSampleCount": 3,
    "structureCounts": {
      "ＳＲＣ": 2
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "新潟",
    "district": "長岡市",
    "layout": "ldk2",
    "medianTradePriceYen": 14000000,
    "medianSqmPriceYen": 231000,
    "medianAreaSqm": 60,
    "ageBands": {},
    "buildingYearSampleCount": 3,
    "structureCounts": {
      "ＳＲＣ": 4,
      "ＳＲＣ、ＲＣ": 1,
      "ＲＣ": 1
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "新潟",
    "district": "長岡市",
    "layout": "ldk3",
    "medianTradePriceYen": 24000000,
    "medianSqmPriceYen": 322000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 475000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 14,
    "structureCounts": {
      "ＲＣ": 11,
      "ＳＲＣ": 1,
      "ＲＣ、鉄骨造": 1
    },
    "sampleCount": 14,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "綾瀬市",
    "layout": "ldk2",
    "medianTradePriceYen": 8200000,
    "medianSqmPriceYen": 159000,
    "medianAreaSqm": 55,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 6
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "綾瀬市",
    "layout": "ldk3",
    "medianTradePriceYen": 9500000,
    "medianSqmPriceYen": 112000,
    "medianAreaSqm": 75,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 7
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "伊勢原市",
    "layout": "ldk1",
    "medianTradePriceYen": 4900000,
    "medianSqmPriceYen": 103000,
    "medianAreaSqm": 50,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 74000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＲＣ": 8
    },
    "sampleCount": 8,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "伊勢原市",
    "layout": "ldk2",
    "medianTradePriceYen": 8100000,
    "medianSqmPriceYen": 148000,
    "medianAreaSqm": 50,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 83000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＲＣ": 13
    },
    "sampleCount": 13,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "伊勢原市",
    "layout": "ldk3",
    "medianTradePriceYen": 30000000,
    "medianSqmPriceYen": 462000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＲＣ": 9
    },
    "sampleCount": 9,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横須賀市",
    "layout": "k1",
    "medianTradePriceYen": 5000000,
    "medianSqmPriceYen": 205000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 205000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＳＲＣ": 3,
      "ＲＣ": 7
    },
    "sampleCount": 11,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横須賀市",
    "layout": "ldk1",
    "medianTradePriceYen": 10500000,
    "medianSqmPriceYen": 232000,
    "medianAreaSqm": 43,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 2
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横須賀市",
    "layout": "ldk2",
    "medianTradePriceYen": 18500000,
    "medianSqmPriceYen": 340000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 422000,
        "sampleCount": 6
      },
      "age_21_30": {
        "medianSqmPriceYen": 493000,
        "sampleCount": 13
      },
      "age_31_40": {
        "medianSqmPriceYen": 289000,
        "sampleCount": 17
      },
      "age_41_plus": {
        "medianSqmPriceYen": 267000,
        "sampleCount": 13
      }
    },
    "buildingYearSampleCount": 50,
    "structureCounts": {
      "ＳＲＣ": 20,
      "ＲＣ": 24
    },
    "sampleCount": 50,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横須賀市",
    "layout": "ldk3",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 283000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 443000,
        "sampleCount": 13
      },
      "age_21_30": {
        "medianSqmPriceYen": 346000,
        "sampleCount": 32
      },
      "age_31_40": {
        "medianSqmPriceYen": 212000,
        "sampleCount": 19
      },
      "age_41_plus": {
        "medianSqmPriceYen": 187000,
        "sampleCount": 15
      }
    },
    "buildingYearSampleCount": 82,
    "structureCounts": {
      "ＲＣ": 54,
      "ＳＲＣ": 15
    },
    "sampleCount": 82,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横須賀市",
    "layout": "r1",
    "medianTradePriceYen": 4300000,
    "medianSqmPriceYen": 287000,
    "medianAreaSqm": 15,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 287000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 2,
      "ＳＲＣ": 3
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2025-Q2",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横浜市旭区",
    "layout": "ldk1",
    "medianTradePriceYen": 10300000,
    "medianSqmPriceYen": 231000,
    "medianAreaSqm": 45,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 134000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 12,
    "structureCounts": {
      "ＲＣ": 9,
      "鉄骨造": 3
    },
    "sampleCount": 12,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横浜市旭区",
    "layout": "ldk2",
    "medianTradePriceYen": 9900000,
    "medianSqmPriceYen": 214000,
    "medianAreaSqm": 48,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 333000,
        "sampleCount": 8
      },
      "age_41_plus": {
        "medianSqmPriceYen": 207000,
        "sampleCount": 27
      }
    },
    "buildingYearSampleCount": 36,
    "structureCounts": {
      "ＲＣ": 32,
      "鉄骨造": 3,
      "ＳＲＣ": 2
    },
    "sampleCount": 38,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横浜市旭区",
    "layout": "ldk3",
    "medianTradePriceYen": 22000000,
    "medianSqmPriceYen": 307000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 646000,
        "sampleCount": 5
      },
      "age_21_30": {
        "medianSqmPriceYen": 464000,
        "sampleCount": 16
      },
      "age_31_40": {
        "medianSqmPriceYen": 308000,
        "sampleCount": 13
      },
      "age_41_plus": {
        "medianSqmPriceYen": 225000,
        "sampleCount": 31
      }
    },
    "buildingYearSampleCount": 68,
    "structureCounts": {
      "ＲＣ": 32,
      "ＳＲＣ": 36
    },
    "sampleCount": 68,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横浜市磯子区",
    "layout": "k1",
    "medianTradePriceYen": 11000000,
    "medianSqmPriceYen": 500000,
    "medianAreaSqm": 25,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 1,
      "ＲＣ": 4
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横浜市磯子区",
    "layout": "ldk1",
    "medianTradePriceYen": 18500000,
    "medianSqmPriceYen": 471000,
    "medianAreaSqm": 40,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 6,
      "ＳＲＣ": 2
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横浜市磯子区",
    "layout": "ldk2",
    "medianTradePriceYen": 19000000,
    "medianSqmPriceYen": 340000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 714000,
        "sampleCount": 6
      },
      "age_21_30": {
        "medianSqmPriceYen": 364000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 292000,
        "sampleCount": 10
      },
      "age_41_plus": {
        "medianSqmPriceYen": 301000,
        "sampleCount": 24
      }
    },
    "buildingYearSampleCount": 48,
    "structureCounts": {
      "ＲＣ": 34,
      "ＳＲＣ": 11
    },
    "sampleCount": 48,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横浜市磯子区",
    "layout": "ldk3",
    "medianTradePriceYen": 35000000,
    "medianSqmPriceYen": 445000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 668000,
        "sampleCount": 12
      },
      "age_21_30": {
        "medianSqmPriceYen": 538000,
        "sampleCount": 9
      },
      "age_31_40": {
        "medianSqmPriceYen": 369000,
        "sampleCount": 10
      },
      "age_41_plus": {
        "medianSqmPriceYen": 286000,
        "sampleCount": 11
      }
    },
    "buildingYearSampleCount": 46,
    "structureCounts": {
      "ＲＣ": 37,
      "ＳＲＣ": 7
    },
    "sampleCount": 46,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横浜市栄区",
    "layout": "ldk2",
    "medianTradePriceYen": 10000000,
    "medianSqmPriceYen": 167000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 167000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 6
    },
    "sampleCount": 9,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横浜市栄区",
    "layout": "ldk3",
    "medianTradePriceYen": 30000000,
    "medianSqmPriceYen": 388000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 695000,
        "sampleCount": 19
      },
      "age_41_plus": {
        "medianSqmPriceYen": 234000,
        "sampleCount": 12
      }
    },
    "buildingYearSampleCount": 40,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 36
    },
    "sampleCount": 40,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横浜市金沢区",
    "layout": "k1",
    "medianTradePriceYen": 6000000,
    "medianSqmPriceYen": 298000,
    "medianAreaSqm": 20,
    "ageBands": {},
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＲＣ": 8
    },
    "sampleCount": 8,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横浜市金沢区",
    "layout": "ldk1",
    "medianTradePriceYen": 7000000,
    "medianSqmPriceYen": 175000,
    "medianAreaSqm": 45,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 4,
      "鉄骨造": 1
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横浜市金沢区",
    "layout": "ldk2",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 311000,
    "medianAreaSqm": 58,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 278000,
        "sampleCount": 6
      },
      "age_31_40": {
        "medianSqmPriceYen": 333000,
        "sampleCount": 13
      },
      "age_41_plus": {
        "medianSqmPriceYen": 311000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 30,
    "structureCounts": {
      "ＳＲＣ": 4,
      "ＲＣ": 26
    },
    "sampleCount": 30,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横浜市金沢区",
    "layout": "ldk3",
    "medianTradePriceYen": 29000000,
    "medianSqmPriceYen": 386000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 423000,
        "sampleCount": 6
      },
      "age_21_30": {
        "medianSqmPriceYen": 415000,
        "sampleCount": 30
      },
      "age_31_40": {
        "medianSqmPriceYen": 356000,
        "sampleCount": 36
      },
      "age_41_plus": {
        "medianSqmPriceYen": 286000,
        "sampleCount": 13
      }
    },
    "buildingYearSampleCount": 88,
    "structureCounts": {
      "ＲＣ": 76,
      "ＳＲＣ": 12
    },
    "sampleCount": 89,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横浜市瀬谷区",
    "layout": "ldk1",
    "medianTradePriceYen": 3600000,
    "medianSqmPriceYen": 90000,
    "medianAreaSqm": 40,
    "ageBands": {},
    "buildingYearSampleCount": 4,
    "structureCounts": {
      "ＲＣ": 3,
      "ＳＲＣ": 1
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横浜市瀬谷区",
    "layout": "ldk2",
    "medianTradePriceYen": 22000000,
    "medianSqmPriceYen": 417000,
    "medianAreaSqm": 60,
    "ageBands": {},
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 3
    },
    "sampleCount": 9,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横浜市瀬谷区",
    "layout": "ldk3",
    "medianTradePriceYen": 34500000,
    "medianSqmPriceYen": 460000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 435000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横浜市泉区",
    "layout": "ldk2",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 360000,
    "medianAreaSqm": 60,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 8
    },
    "sampleCount": 9,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横浜市泉区",
    "layout": "ldk3",
    "medianTradePriceYen": 25000000,
    "medianSqmPriceYen": 347000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 457000,
        "sampleCount": 5
      },
      "age_41_plus": {
        "medianSqmPriceYen": 227000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 19,
    "structureCounts": {
      "ＲＣ": 16
    },
    "sampleCount": 20,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横浜市鶴見区",
    "layout": "k1",
    "medianTradePriceYen": 14000000,
    "medianSqmPriceYen": 700000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1450000,
        "sampleCount": 16
      },
      "age_31_40": {
        "medianSqmPriceYen": 625000,
        "sampleCount": 20
      },
      "age_41_plus": {
        "medianSqmPriceYen": 480000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 48,
    "structureCounts": {
      "ＲＣ": 26,
      "ＳＲＣ": 21
    },
    "sampleCount": 48,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横浜市鶴見区",
    "layout": "ldk1",
    "medianTradePriceYen": 19000000,
    "medianSqmPriceYen": 444000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 425000,
        "sampleCount": 7
      },
      "age_41_plus": {
        "medianSqmPriceYen": 500000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＳＲＣ": 5,
      "ＲＣ": 7,
      "ＳＲＣ、ＲＣ": 1
    },
    "sampleCount": 13,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横浜市鶴見区",
    "layout": "ldk2",
    "medianTradePriceYen": 30000000,
    "medianSqmPriceYen": 509000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 814000,
        "sampleCount": 10
      },
      "age_21_30": {
        "medianSqmPriceYen": 567000,
        "sampleCount": 17
      },
      "age_31_40": {
        "medianSqmPriceYen": 440000,
        "sampleCount": 15
      },
      "age_41_plus": {
        "medianSqmPriceYen": 420000,
        "sampleCount": 21
      }
    },
    "buildingYearSampleCount": 65,
    "structureCounts": {
      "ＲＣ": 52,
      "ＳＲＣ": 10,
      "ＳＲＣ、ＲＣ、鉄骨造": 2
    },
    "sampleCount": 65,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横浜市鶴見区",
    "layout": "ldk3",
    "medianTradePriceYen": 42000000,
    "medianSqmPriceYen": 569000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 985000,
        "sampleCount": 6
      },
      "age_11_20": {
        "medianSqmPriceYen": 738000,
        "sampleCount": 22
      },
      "age_21_30": {
        "medianSqmPriceYen": 560000,
        "sampleCount": 42
      },
      "age_31_40": {
        "medianSqmPriceYen": 400000,
        "sampleCount": 21
      },
      "age_41_plus": {
        "medianSqmPriceYen": 271000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 100,
    "structureCounts": {
      "ＲＣ": 90,
      "ＳＲＣ": 9
    },
    "sampleCount": 100,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横浜市鶴見区",
    "layout": "r1",
    "medianTradePriceYen": 10400000,
    "medianSqmPriceYen": 618000,
    "medianAreaSqm": 15,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 618000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＳＲＣ": 4,
      "ＲＣ": 2
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横浜市都筑区",
    "layout": "ldk1",
    "medianTradePriceYen": 33000000,
    "medianSqmPriceYen": 880000,
    "medianAreaSqm": 40,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 8,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横浜市都筑区",
    "layout": "ldk2",
    "medianTradePriceYen": 49000000,
    "medianSqmPriceYen": 771000,
    "medianAreaSqm": 65,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 800000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 14,
    "structureCounts": {
      "ＲＣ": 11,
      "ＳＲＣ、ＲＣ": 1,
      "ＳＲＣ": 1
    },
    "sampleCount": 15,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横浜市都筑区",
    "layout": "ldk3",
    "medianTradePriceYen": 50000000,
    "medianSqmPriceYen": 676000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 879000,
        "sampleCount": 6
      },
      "age_11_20": {
        "medianSqmPriceYen": 790000,
        "sampleCount": 20
      },
      "age_21_30": {
        "medianSqmPriceYen": 667000,
        "sampleCount": 39
      },
      "age_31_40": {
        "medianSqmPriceYen": 542000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 77,
    "structureCounts": {
      "ＳＲＣ": 8,
      "ＲＣ": 57,
      "ＳＲＣ、ＲＣ": 1
    },
    "sampleCount": 90,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横浜市南区",
    "layout": "k1",
    "medianTradePriceYen": 24000000,
    "medianSqmPriceYen": 1150000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1250000,
        "sampleCount": 88
      },
      "age_11_20": {
        "medianSqmPriceYen": 1100000,
        "sampleCount": 25
      },
      "age_31_40": {
        "medianSqmPriceYen": 438000,
        "sampleCount": 14
      },
      "age_41_plus": {
        "medianSqmPriceYen": 292000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 133,
    "structureCounts": {
      "ＲＣ": 124,
      "ＳＲＣ": 11
    },
    "sampleCount": 135,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横浜市南区",
    "layout": "ldk1",
    "medianTradePriceYen": 26000000,
    "medianSqmPriceYen": 694000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 700000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 538000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 26,
    "structureCounts": {
      "ＳＲＣ": 8,
      "ＲＣ": 18
    },
    "sampleCount": 26,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横浜市南区",
    "layout": "ldk2",
    "medianTradePriceYen": 23000000,
    "medianSqmPriceYen": 428000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 571000,
        "sampleCount": 12
      },
      "age_31_40": {
        "medianSqmPriceYen": 430000,
        "sampleCount": 18
      },
      "age_41_plus": {
        "medianSqmPriceYen": 307000,
        "sampleCount": 13
      }
    },
    "buildingYearSampleCount": 45,
    "structureCounts": {
      "ＲＣ": 32,
      "ＳＲＣ": 14
    },
    "sampleCount": 46,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横浜市南区",
    "layout": "ldk3",
    "medianTradePriceYen": 39000000,
    "medianSqmPriceYen": 514000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 577000,
        "sampleCount": 22
      },
      "age_31_40": {
        "medianSqmPriceYen": 338000,
        "sampleCount": 9
      },
      "age_41_plus": {
        "medianSqmPriceYen": 254000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 49,
    "structureCounts": {
      "ＲＣ": 42,
      "ＳＲＣ": 8
    },
    "sampleCount": 50,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横浜市南区",
    "layout": "r1",
    "medianTradePriceYen": 7700000,
    "medianSqmPriceYen": 467000,
    "medianAreaSqm": 15,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 427000,
        "sampleCount": 11
      }
    },
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＳＲＣ": 4,
      "ＲＣ": 9
    },
    "sampleCount": 13,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横浜市保土ケ谷区",
    "layout": "k1",
    "medianTradePriceYen": 8000000,
    "medianSqmPriceYen": 400000,
    "medianAreaSqm": 25,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 1
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横浜市保土ケ谷区",
    "layout": "ldk1",
    "medianTradePriceYen": 18500000,
    "medianSqmPriceYen": 413000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 400000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＲＣ": 10
    },
    "sampleCount": 10,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横浜市保土ケ谷区",
    "layout": "ldk2",
    "medianTradePriceYen": 21500000,
    "medianSqmPriceYen": 408000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 776000,
        "sampleCount": 8
      },
      "age_21_30": {
        "medianSqmPriceYen": 483000,
        "sampleCount": 7
      },
      "age_31_40": {
        "medianSqmPriceYen": 382000,
        "sampleCount": 15
      },
      "age_41_plus": {
        "medianSqmPriceYen": 222000,
        "sampleCount": 18
      }
    },
    "buildingYearSampleCount": 50,
    "structureCounts": {
      "ＲＣ": 36,
      "ＳＲＣ": 11
    },
    "sampleCount": 50,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横浜市保土ケ谷区",
    "layout": "ldk3",
    "medianTradePriceYen": 26500000,
    "medianSqmPriceYen": 362000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 429000,
        "sampleCount": 13
      },
      "age_31_40": {
        "medianSqmPriceYen": 267000,
        "sampleCount": 17
      },
      "age_41_plus": {
        "medianSqmPriceYen": 333000,
        "sampleCount": 11
      }
    },
    "buildingYearSampleCount": 46,
    "structureCounts": {
      "ＳＲＣ": 9,
      "ＲＣ": 35
    },
    "sampleCount": 46,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横浜市保土ケ谷区",
    "layout": "r1",
    "medianTradePriceYen": 4900000,
    "medianSqmPriceYen": 327000,
    "medianAreaSqm": 15,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 327000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＳＲＣ": 1,
      "ＲＣ": 6
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横浜市緑区",
    "layout": "ldk1",
    "medianTradePriceYen": 29000000,
    "medianSqmPriceYen": 800000,
    "medianAreaSqm": 35,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 896000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＲＣ": 8,
      "ＳＲＣ": 1
    },
    "sampleCount": 9,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横浜市緑区",
    "layout": "ldk2",
    "medianTradePriceYen": 8500000,
    "medianSqmPriceYen": 155000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 144000,
        "sampleCount": 26
      }
    },
    "buildingYearSampleCount": 32,
    "structureCounts": {
      "ＲＣ": 32,
      "ＳＲＣ": 1
    },
    "sampleCount": 33,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "横浜市緑区",
    "layout": "ldk3",
    "medianTradePriceYen": 38500000,
    "medianSqmPriceYen": 531000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 800000,
        "sampleCount": 9
      },
      "age_21_30": {
        "medianSqmPriceYen": 549000,
        "sampleCount": 22
      },
      "age_31_40": {
        "medianSqmPriceYen": 350000,
        "sampleCount": 12
      }
    },
    "buildingYearSampleCount": 51,
    "structureCounts": {
      "ＲＣ": 49,
      "ＳＲＣ": 3
    },
    "sampleCount": 54,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "海老名市",
    "layout": "k1",
    "medianTradePriceYen": 7000000,
    "medianSqmPriceYen": 350000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 350000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 2,
      "ＳＲＣ": 1
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "海老名市",
    "layout": "ldk1",
    "medianTradePriceYen": 27500000,
    "medianSqmPriceYen": 862000,
    "medianAreaSqm": 40,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 2
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "海老名市",
    "layout": "ldk2",
    "medianTradePriceYen": 18000000,
    "medianSqmPriceYen": 293000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 293000,
        "sampleCount": 5
      },
      "age_41_plus": {
        "medianSqmPriceYen": 122000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 21,
    "structureCounts": {
      "ＲＣ": 15,
      "ＳＲＣ": 6
    },
    "sampleCount": 21,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "海老名市",
    "layout": "ldk3",
    "medianTradePriceYen": 38000000,
    "medianSqmPriceYen": 486000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 846000,
        "sampleCount": 9
      },
      "age_11_20": {
        "medianSqmPriceYen": 543000,
        "sampleCount": 7
      },
      "age_21_30": {
        "medianSqmPriceYen": 507000,
        "sampleCount": 13
      },
      "age_31_40": {
        "medianSqmPriceYen": 347000,
        "sampleCount": 7
      },
      "age_41_plus": {
        "medianSqmPriceYen": 286000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 43,
    "structureCounts": {
      "ＲＣ": 35,
      "ＳＲＣ": 8
    },
    "sampleCount": 43,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "鎌倉市",
    "layout": "ldk1",
    "medianTradePriceYen": 25000000,
    "medianSqmPriceYen": 556000,
    "medianAreaSqm": 45,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q2",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "鎌倉市",
    "layout": "ldk2",
    "medianTradePriceYen": 50000000,
    "medianSqmPriceYen": 818000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＲＣ": 13
    },
    "sampleCount": 13,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "鎌倉市",
    "layout": "ldk3",
    "medianTradePriceYen": 36000000,
    "medianSqmPriceYen": 431000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 686000,
        "sampleCount": 10
      },
      "age_21_30": {
        "medianSqmPriceYen": 459000,
        "sampleCount": 19
      },
      "age_31_40": {
        "medianSqmPriceYen": 327000,
        "sampleCount": 6
      },
      "age_41_plus": {
        "medianSqmPriceYen": 279000,
        "sampleCount": 14
      }
    },
    "buildingYearSampleCount": 50,
    "structureCounts": {
      "ＲＣ": 40,
      "ＳＲＣ": 10
    },
    "sampleCount": 51,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "茅ヶ崎市",
    "layout": "ldk2",
    "medianTradePriceYen": 27500000,
    "medianSqmPriceYen": 426000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＲＣ": 8,
      "ＳＲＣ": 1
    },
    "sampleCount": 10,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "茅ヶ崎市",
    "layout": "ldk3",
    "medianTradePriceYen": 34000000,
    "medianSqmPriceYen": 431000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 892000,
        "sampleCount": 7
      },
      "age_11_20": {
        "medianSqmPriceYen": 612000,
        "sampleCount": 12
      },
      "age_21_30": {
        "medianSqmPriceYen": 471000,
        "sampleCount": 33
      },
      "age_31_40": {
        "medianSqmPriceYen": 375000,
        "sampleCount": 21
      }
    },
    "buildingYearSampleCount": 75,
    "structureCounts": {
      "ＳＲＣ": 9,
      "ＲＣ": 59
    },
    "sampleCount": 75,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "厚木市",
    "layout": "ldk1",
    "medianTradePriceYen": 18000000,
    "medianSqmPriceYen": 380000,
    "medianAreaSqm": 45,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "厚木市",
    "layout": "ldk2",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 300000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 490000,
        "sampleCount": 6
      },
      "age_21_30": {
        "medianSqmPriceYen": 483000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 19,
    "structureCounts": {
      "ＲＣ": 9,
      "ＳＲＣ": 9
    },
    "sampleCount": 19,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "厚木市",
    "layout": "ldk3",
    "medianTradePriceYen": 22000000,
    "medianSqmPriceYen": 294000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 708000,
        "sampleCount": 5
      },
      "age_11_20": {
        "medianSqmPriceYen": 475000,
        "sampleCount": 7
      },
      "age_21_30": {
        "medianSqmPriceYen": 464000,
        "sampleCount": 14
      },
      "age_41_plus": {
        "medianSqmPriceYen": 119000,
        "sampleCount": 15
      }
    },
    "buildingYearSampleCount": 45,
    "structureCounts": {
      "ＲＣ": 23,
      "ＳＲＣ": 15
    },
    "sampleCount": 46,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "高座郡寒川町",
    "layout": "ldk3",
    "medianTradePriceYen": 7300000,
    "medianSqmPriceYen": 112000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 4
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "座間市",
    "layout": "ldk1",
    "medianTradePriceYen": 14000000,
    "medianSqmPriceYen": 325000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 300000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 3,
      "ＳＲＣ": 1
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "座間市",
    "layout": "ldk2",
    "medianTradePriceYen": 14000000,
    "medianSqmPriceYen": 246000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 240000,
        "sampleCount": 7
      },
      "age_41_plus": {
        "medianSqmPriceYen": 236000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 17,
    "structureCounts": {
      "ＲＣ": 12,
      "ＳＲＣ": 5
    },
    "sampleCount": 17,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "座間市",
    "layout": "ldk3",
    "medianTradePriceYen": 24000000,
    "medianSqmPriceYen": 300000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 533000,
        "sampleCount": 6
      },
      "age_21_30": {
        "medianSqmPriceYen": 324000,
        "sampleCount": 14
      },
      "age_31_40": {
        "medianSqmPriceYen": 241000,
        "sampleCount": 6
      },
      "age_41_plus": {
        "medianSqmPriceYen": 200000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 36,
    "structureCounts": {
      "ＲＣ": 21,
      "ＳＲＣ": 13,
      "ＲＣ、鉄骨造": 2
    },
    "sampleCount": 37,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "三浦郡葉山町",
    "layout": "ldk3",
    "medianTradePriceYen": 42000000,
    "medianSqmPriceYen": 550000,
    "medianAreaSqm": 80,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 7
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "三浦市",
    "layout": "ldk2",
    "medianTradePriceYen": 17500000,
    "medianSqmPriceYen": 305000,
    "medianAreaSqm": 60,
    "ageBands": {},
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 2
    },
    "sampleCount": 8,
    "windowQuarters": 8,
    "periodStart": "2024-Q4",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "三浦市",
    "layout": "ldk3",
    "medianTradePriceYen": 30000000,
    "medianSqmPriceYen": 343000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 365000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＲＣ": 9
    },
    "sampleCount": 11,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "小田原市",
    "layout": "ldk2",
    "medianTradePriceYen": 24000000,
    "medianSqmPriceYen": 357000,
    "medianAreaSqm": 63,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 357000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＲＣ": 13,
      "ＳＲＣ": 1
    },
    "sampleCount": 14,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "小田原市",
    "layout": "ldk3",
    "medianTradePriceYen": 22500000,
    "medianSqmPriceYen": 321000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 8
    },
    "sampleCount": 10,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "秦野市",
    "layout": "ldk1",
    "medianTradePriceYen": 8300000,
    "medianSqmPriceYen": 183000,
    "medianAreaSqm": 45,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 122000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 3,
      "ＳＲＣ": 3
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "秦野市",
    "layout": "ldk2",
    "medianTradePriceYen": 19000000,
    "medianSqmPriceYen": 308000,
    "medianAreaSqm": 60,
    "ageBands": {},
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＲＣ": 7,
      "ＳＲＣ": 2
    },
    "sampleCount": 9,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "秦野市",
    "layout": "ldk3",
    "medianTradePriceYen": 12000000,
    "medianSqmPriceYen": 167000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 160000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 16,
    "structureCounts": {
      "ＳＲＣ": 5,
      "ＲＣ": 12
    },
    "sampleCount": 17,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "逗子市",
    "layout": "ldk2",
    "medianTradePriceYen": 24000000,
    "medianSqmPriceYen": 369000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 336000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＲＣ": 12,
      "ＳＲＣ": 1
    },
    "sampleCount": 13,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "逗子市",
    "layout": "ldk3",
    "medianTradePriceYen": 39500000,
    "medianSqmPriceYen": 511000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 600000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 12,
    "structureCounts": {
      "ＲＣ": 12
    },
    "sampleCount": 12,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "川崎市宮前区",
    "layout": "k1",
    "medianTradePriceYen": 19000000,
    "medianSqmPriceYen": 950000,
    "medianAreaSqm": 20,
    "ageBands": {},
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＲＣ": 8,
      "ＳＲＣ": 3
    },
    "sampleCount": 13,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "川崎市宮前区",
    "layout": "ldk1",
    "medianTradePriceYen": 26000000,
    "medianSqmPriceYen": 578000,
    "medianAreaSqm": 45,
    "ageBands": {},
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＲＣ": 8
    },
    "sampleCount": 9,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "川崎市宮前区",
    "layout": "ldk2",
    "medianTradePriceYen": 27500000,
    "medianSqmPriceYen": 512000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 661000,
        "sampleCount": 6
      },
      "age_21_30": {
        "medianSqmPriceYen": 556000,
        "sampleCount": 8
      },
      "age_31_40": {
        "medianSqmPriceYen": 537000,
        "sampleCount": 8
      },
      "age_41_plus": {
        "medianSqmPriceYen": 300000,
        "sampleCount": 18
      }
    },
    "buildingYearSampleCount": 42,
    "structureCounts": {
      "ＲＣ": 35,
      "ＳＲＣ": 1
    },
    "sampleCount": 42,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "川崎市宮前区",
    "layout": "ldk3",
    "medianTradePriceYen": 43500000,
    "medianSqmPriceYen": 606000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1007000,
        "sampleCount": 10
      },
      "age_11_20": {
        "medianSqmPriceYen": 750000,
        "sampleCount": 23
      },
      "age_21_30": {
        "medianSqmPriceYen": 747000,
        "sampleCount": 31
      },
      "age_31_40": {
        "medianSqmPriceYen": 388000,
        "sampleCount": 19
      },
      "age_41_plus": {
        "medianSqmPriceYen": 271000,
        "sampleCount": 15
      }
    },
    "buildingYearSampleCount": 98,
    "structureCounts": {
      "ＲＣ": 80,
      "ＳＲＣ": 1
    },
    "sampleCount": 98,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "川崎市幸区",
    "layout": "k1",
    "medianTradePriceYen": 24000000,
    "medianSqmPriceYen": 1200000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1250000,
        "sampleCount": 39
      },
      "age_11_20": {
        "medianSqmPriceYen": 1200000,
        "sampleCount": 11
      }
    },
    "buildingYearSampleCount": 54,
    "structureCounts": {
      "ＲＣ": 44,
      "ＳＲＣ": 4
    },
    "sampleCount": 55,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "川崎市幸区",
    "layout": "ldk1",
    "medianTradePriceYen": 51000000,
    "medianSqmPriceYen": 1267000,
    "medianAreaSqm": 45,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 1280000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＲＣ": 9,
      "ＳＲＣ": 1
    },
    "sampleCount": 11,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "川崎市幸区",
    "layout": "ldk2",
    "medianTradePriceYen": 42500000,
    "medianSqmPriceYen": 712000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 1412000,
        "sampleCount": 8
      },
      "age_21_30": {
        "medianSqmPriceYen": 748000,
        "sampleCount": 10
      },
      "age_31_40": {
        "medianSqmPriceYen": 681000,
        "sampleCount": 8
      },
      "age_41_plus": {
        "medianSqmPriceYen": 337000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 32,
    "structureCounts": {
      "ＲＣ": 17,
      "ＳＲＣ": 11
    },
    "sampleCount": 34,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "川崎市幸区",
    "layout": "ldk3",
    "medianTradePriceYen": 57000000,
    "medianSqmPriceYen": 831000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 971000,
        "sampleCount": 9
      },
      "age_11_20": {
        "medianSqmPriceYen": 877000,
        "sampleCount": 19
      },
      "age_21_30": {
        "medianSqmPriceYen": 829000,
        "sampleCount": 25
      },
      "age_31_40": {
        "medianSqmPriceYen": 607000,
        "sampleCount": 12
      }
    },
    "buildingYearSampleCount": 69,
    "structureCounts": {
      "ＲＣ": 49,
      "ＳＲＣ": 12
    },
    "sampleCount": 69,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "川崎市高津區",
    "layout": "k1",
    "medianTradePriceYen": 23000000,
    "medianSqmPriceYen": 1050000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1100000,
        "sampleCount": 18
      },
      "age_11_20": {
        "medianSqmPriceYen": 1065000,
        "sampleCount": 16
      },
      "age_31_40": {
        "medianSqmPriceYen": 560000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 42,
    "structureCounts": {
      "ＲＣ": 41,
      "ＳＲＣ": 1
    },
    "sampleCount": 42,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "川崎市高津區",
    "layout": "ldk1",
    "medianTradePriceYen": 27500000,
    "medianSqmPriceYen": 640000,
    "medianAreaSqm": 40,
    "ageBands": {},
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＲＣ": 6,
      "ＳＲＣ": 1
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "川崎市高津區",
    "layout": "ldk2",
    "medianTradePriceYen": 35000000,
    "medianSqmPriceYen": 636000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 891000,
        "sampleCount": 5
      },
      "age_21_30": {
        "medianSqmPriceYen": 636000,
        "sampleCount": 13
      },
      "age_31_40": {
        "medianSqmPriceYen": 571000,
        "sampleCount": 8
      },
      "age_41_plus": {
        "medianSqmPriceYen": 560000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 37,
    "structureCounts": {
      "ＲＣ": 26,
      "ＳＲＣ": 5,
      "鉄骨造": 1
    },
    "sampleCount": 37,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "川崎市高津區",
    "layout": "ldk3",
    "medianTradePriceYen": 58000000,
    "medianSqmPriceYen": 750000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1070000,
        "sampleCount": 6
      },
      "age_11_20": {
        "medianSqmPriceYen": 894000,
        "sampleCount": 19
      },
      "age_21_30": {
        "medianSqmPriceYen": 700000,
        "sampleCount": 25
      },
      "age_31_40": {
        "medianSqmPriceYen": 523000,
        "sampleCount": 7
      },
      "age_41_plus": {
        "medianSqmPriceYen": 573000,
        "sampleCount": 13
      }
    },
    "buildingYearSampleCount": 70,
    "structureCounts": {
      "ＲＣ": 56,
      "ＳＲＣ": 13
    },
    "sampleCount": 71,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "川崎市川崎區",
    "layout": "k1",
    "medianTradePriceYen": 26000000,
    "medianSqmPriceYen": 1245000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1250000,
        "sampleCount": 131
      },
      "age_11_20": {
        "medianSqmPriceYen": 1200000,
        "sampleCount": 25
      },
      "age_31_40": {
        "medianSqmPriceYen": 445000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 169,
    "structureCounts": {
      "ＲＣ": 149,
      "ＳＲＣ": 8
    },
    "sampleCount": 170,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "川崎市川崎區",
    "layout": "ldk1",
    "medianTradePriceYen": 23500000,
    "medianSqmPriceYen": 621000,
    "medianAreaSqm": 38,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 429000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 12,
    "structureCounts": {
      "ＲＣ": 3,
      "ＳＲＣ": 7
    },
    "sampleCount": 12,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "川崎市川崎區",
    "layout": "ldk2",
    "medianTradePriceYen": 42000000,
    "medianSqmPriceYen": 730000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1029000,
        "sampleCount": 7
      },
      "age_11_20": {
        "medianSqmPriceYen": 773000,
        "sampleCount": 12
      },
      "age_21_30": {
        "medianSqmPriceYen": 727000,
        "sampleCount": 12
      }
    },
    "buildingYearSampleCount": 38,
    "structureCounts": {
      "ＲＣ": 31,
      "ＳＲＣ": 5,
      "鉄骨造": 2
    },
    "sampleCount": 38,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "川崎市川崎區",
    "layout": "ldk3",
    "medianTradePriceYen": 42000000,
    "medianSqmPriceYen": 600000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 813000,
        "sampleCount": 9
      },
      "age_11_20": {
        "medianSqmPriceYen": 724000,
        "sampleCount": 24
      },
      "age_21_30": {
        "medianSqmPriceYen": 557000,
        "sampleCount": 25
      },
      "age_31_40": {
        "medianSqmPriceYen": 508000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 68,
    "structureCounts": {
      "ＳＲＣ": 15,
      "ＲＣ": 53
    },
    "sampleCount": 69,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "川崎市川崎區",
    "layout": "r1",
    "medianTradePriceYen": 8800000,
    "medianSqmPriceYen": 587000,
    "medianAreaSqm": 15,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 560000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 5
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "川崎市多摩区",
    "layout": "k1",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 1025000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1100000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 14,
    "structureCounts": {
      "ＲＣ": 12,
      "ＳＲＣ": 1
    },
    "sampleCount": 14,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "川崎市多摩区",
    "layout": "ldk1",
    "medianTradePriceYen": 17000000,
    "medianSqmPriceYen": 429000,
    "medianAreaSqm": 35,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 1
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "川崎市多摩区",
    "layout": "ldk2",
    "medianTradePriceYen": 31000000,
    "medianSqmPriceYen": 545000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 580000,
        "sampleCount": 11
      },
      "age_41_plus": {
        "medianSqmPriceYen": 345000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 28,
    "structureCounts": {
      "ＲＣ": 23,
      "ＳＲＣ": 2
    },
    "sampleCount": 29,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "川崎市多摩区",
    "layout": "ldk3",
    "medianTradePriceYen": 40000000,
    "medianSqmPriceYen": 569000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 954000,
        "sampleCount": 6
      },
      "age_11_20": {
        "medianSqmPriceYen": 520000,
        "sampleCount": 11
      },
      "age_21_30": {
        "medianSqmPriceYen": 615000,
        "sampleCount": 13
      },
      "age_31_40": {
        "medianSqmPriceYen": 385000,
        "sampleCount": 15
      },
      "age_41_plus": {
        "medianSqmPriceYen": 200000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 52,
    "structureCounts": {
      "ＲＣ": 40,
      "ＳＲＣ": 1
    },
    "sampleCount": 53,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "川崎市多摩区",
    "layout": "r1",
    "medianTradePriceYen": 6100000,
    "medianSqmPriceYen": 403000,
    "medianAreaSqm": 15,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 403000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 6
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "川崎市中原區",
    "layout": "k1",
    "medianTradePriceYen": 24000000,
    "medianSqmPriceYen": 1150000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1360000,
        "sampleCount": 73
      },
      "age_11_20": {
        "medianSqmPriceYen": 1050000,
        "sampleCount": 30
      },
      "age_31_40": {
        "medianSqmPriceYen": 625000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 112,
    "structureCounts": {
      "ＲＣ": 102,
      "ＳＲＣ": 3
    },
    "sampleCount": 114,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "川崎市中原區",
    "layout": "ldk1",
    "medianTradePriceYen": 49000000,
    "medianSqmPriceYen": 1060000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1833000,
        "sampleCount": 7
      },
      "age_41_plus": {
        "medianSqmPriceYen": 422000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 20,
    "structureCounts": {
      "ＳＲＣ": 4,
      "ＲＣ": 13
    },
    "sampleCount": 21,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "川崎市中原區",
    "layout": "ldk2",
    "medianTradePriceYen": 63000000,
    "medianSqmPriceYen": 997000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1540000,
        "sampleCount": 8
      },
      "age_11_20": {
        "medianSqmPriceYen": 1467000,
        "sampleCount": 15
      },
      "age_21_30": {
        "medianSqmPriceYen": 894000,
        "sampleCount": 6
      },
      "age_31_40": {
        "medianSqmPriceYen": 934000,
        "sampleCount": 6
      },
      "age_41_plus": {
        "medianSqmPriceYen": 530000,
        "sampleCount": 12
      }
    },
    "buildingYearSampleCount": 47,
    "structureCounts": {
      "ＲＣ": 33,
      "ＳＲＣ": 9
    },
    "sampleCount": 48,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "川崎市中原區",
    "layout": "ldk3",
    "medianTradePriceYen": 72000000,
    "medianSqmPriceYen": 1029000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1790000,
        "sampleCount": 12
      },
      "age_11_20": {
        "medianSqmPriceYen": 1133000,
        "sampleCount": 34
      },
      "age_21_30": {
        "medianSqmPriceYen": 829000,
        "sampleCount": 23
      },
      "age_41_plus": {
        "medianSqmPriceYen": 846000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 77,
    "structureCounts": {
      "ＲＣ": 61,
      "ＳＲＣ": 15
    },
    "sampleCount": 78,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "川崎市中原區",
    "layout": "r1",
    "medianTradePriceYen": 8500000,
    "medianSqmPriceYen": 567000,
    "medianAreaSqm": 15,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 533000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 3
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "川崎市麻生区",
    "layout": "k1",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 1000000,
    "medianAreaSqm": 20,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 6
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "川崎市麻生区",
    "layout": "ldk2",
    "medianTradePriceYen": 24000000,
    "medianSqmPriceYen": 401000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 228000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 18,
    "structureCounts": {
      "ＲＣ": 14,
      "ＳＲＣ": 1
    },
    "sampleCount": 18,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "川崎市麻生区",
    "layout": "ldk3",
    "medianTradePriceYen": 34000000,
    "medianSqmPriceYen": 457000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 654000,
        "sampleCount": 16
      },
      "age_21_30": {
        "medianSqmPriceYen": 500000,
        "sampleCount": 25
      },
      "age_31_40": {
        "medianSqmPriceYen": 366000,
        "sampleCount": 12
      },
      "age_41_plus": {
        "medianSqmPriceYen": 275000,
        "sampleCount": 17
      }
    },
    "buildingYearSampleCount": 74,
    "structureCounts": {
      "ＲＣ": 41,
      "ＳＲＣ": 18
    },
    "sampleCount": 74,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "相模原市",
    "layout": "k1",
    "medianTradePriceYen": 3700000,
    "medianSqmPriceYen": 185000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 185000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 4
    },
    "sampleCount": 9,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "相模原市",
    "layout": "ldk1",
    "medianTradePriceYen": 12000000,
    "medianSqmPriceYen": 280000,
    "medianAreaSqm": 45,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 249000,
        "sampleCount": 8
      },
      "age_41_plus": {
        "medianSqmPriceYen": 169000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 21,
    "structureCounts": {
      "ＲＣ": 16,
      "ＳＲＣ": 2
    },
    "sampleCount": 21,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "相模原市",
    "layout": "ldk2",
    "medianTradePriceYen": 20500000,
    "medianSqmPriceYen": 382000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 691000,
        "sampleCount": 7
      },
      "age_11_20": {
        "medianSqmPriceYen": 771000,
        "sampleCount": 10
      },
      "age_21_30": {
        "medianSqmPriceYen": 564000,
        "sampleCount": 17
      },
      "age_31_40": {
        "medianSqmPriceYen": 311000,
        "sampleCount": 25
      },
      "age_41_plus": {
        "medianSqmPriceYen": 218000,
        "sampleCount": 31
      }
    },
    "buildingYearSampleCount": 90,
    "structureCounts": {
      "ＲＣ": 68,
      "ＳＲＣ": 20
    },
    "sampleCount": 96,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "相模原市",
    "layout": "ldk3",
    "medianTradePriceYen": 30000000,
    "medianSqmPriceYen": 445000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 615000,
        "sampleCount": 15
      },
      "age_11_20": {
        "medianSqmPriceYen": 582000,
        "sampleCount": 30
      },
      "age_21_30": {
        "medianSqmPriceYen": 424000,
        "sampleCount": 57
      },
      "age_31_40": {
        "medianSqmPriceYen": 308000,
        "sampleCount": 19
      },
      "age_41_plus": {
        "medianSqmPriceYen": 277000,
        "sampleCount": 17
      }
    },
    "buildingYearSampleCount": 138,
    "structureCounts": {
      "ＲＣ": 97,
      "ＳＲＣ": 21,
      "鉄骨造": 2
    },
    "sampleCount": 140,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "相模原市",
    "layout": "r1",
    "medianTradePriceYen": 3000000,
    "medianSqmPriceYen": 200000,
    "medianAreaSqm": 15,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 200000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 3,
      "ＳＲＣ": 4
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "相模原市中央区",
    "layout": "k1",
    "medianTradePriceYen": 5300000,
    "medianSqmPriceYen": 224000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 224000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 3,
      "ＳＲＣ": 3
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "相模原市中央区",
    "layout": "ldk1",
    "medianTradePriceYen": 11500000,
    "medianSqmPriceYen": 275000,
    "medianAreaSqm": 45,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 216000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 14,
    "structureCounts": {
      "ＲＣ": 13
    },
    "sampleCount": 14,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "相模原市中央区",
    "layout": "ldk2",
    "medianTradePriceYen": 23000000,
    "medianSqmPriceYen": 417000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 392000,
        "sampleCount": 8
      },
      "age_31_40": {
        "medianSqmPriceYen": 400000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 30,
    "structureCounts": {
      "ＲＣ": 22,
      "ＳＲＣ": 6
    },
    "sampleCount": 33,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "相模原市中央区",
    "layout": "ldk3",
    "medianTradePriceYen": 28000000,
    "medianSqmPriceYen": 400000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 601000,
        "sampleCount": 8
      },
      "age_11_20": {
        "medianSqmPriceYen": 538000,
        "sampleCount": 12
      },
      "age_21_30": {
        "medianSqmPriceYen": 343000,
        "sampleCount": 23
      },
      "age_31_40": {
        "medianSqmPriceYen": 231000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 52,
    "structureCounts": {
      "ＳＲＣ": 10,
      "ＲＣ": 31,
      "鉄骨造": 2
    },
    "sampleCount": 52,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "相模原市中央区",
    "layout": "r1",
    "medianTradePriceYen": 3200000,
    "medianSqmPriceYen": 210000,
    "medianAreaSqm": 15,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 210000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＳＲＣ": 4,
      "ＲＣ": 2
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q4",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "相模原市南区",
    "layout": "k1",
    "medianTradePriceYen": 5000000,
    "medianSqmPriceYen": 250000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 250000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 3,
      "ＳＲＣ": 2
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q4",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "相模原市南区",
    "layout": "ldk1",
    "medianTradePriceYen": 14000000,
    "medianSqmPriceYen": 337000,
    "medianAreaSqm": 48,
    "ageBands": {},
    "buildingYearSampleCount": 14,
    "structureCounts": {
      "ＲＣ": 11,
      "ＳＲＣ": 2
    },
    "sampleCount": 14,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "相模原市南区",
    "layout": "ldk2",
    "medianTradePriceYen": 14000000,
    "medianSqmPriceYen": 276000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 937000,
        "sampleCount": 6
      },
      "age_31_40": {
        "medianSqmPriceYen": 286000,
        "sampleCount": 8
      },
      "age_41_plus": {
        "medianSqmPriceYen": 197000,
        "sampleCount": 24
      }
    },
    "buildingYearSampleCount": 45,
    "structureCounts": {
      "ＲＣ": 36,
      "ＳＲＣ": 9
    },
    "sampleCount": 48,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "相模原市南区",
    "layout": "ldk3",
    "medianTradePriceYen": 30500000,
    "medianSqmPriceYen": 452000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 650000,
        "sampleCount": 5
      },
      "age_11_20": {
        "medianSqmPriceYen": 614000,
        "sampleCount": 15
      },
      "age_21_30": {
        "medianSqmPriceYen": 443000,
        "sampleCount": 23
      },
      "age_31_40": {
        "medianSqmPriceYen": 510000,
        "sampleCount": 10
      },
      "age_41_plus": {
        "medianSqmPriceYen": 280000,
        "sampleCount": 15
      }
    },
    "buildingYearSampleCount": 68,
    "structureCounts": {
      "ＲＣ": 51,
      "ＳＲＣ": 10
    },
    "sampleCount": 70,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "相模原市緑区",
    "layout": "ldk1",
    "medianTradePriceYen": 8200000,
    "medianSqmPriceYen": 190000,
    "medianAreaSqm": 45,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 6
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "相模原市緑区",
    "layout": "ldk2",
    "medianTradePriceYen": 14000000,
    "medianSqmPriceYen": 311000,
    "medianAreaSqm": 50,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 636000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 311000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 15,
    "structureCounts": {
      "ＲＣ": 10,
      "ＳＲＣ": 5
    },
    "sampleCount": 15,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "相模原市緑区",
    "layout": "ldk3",
    "medianTradePriceYen": 38000000,
    "medianSqmPriceYen": 581000,
    "medianAreaSqm": 65,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 543000,
        "sampleCount": 11
      }
    },
    "buildingYearSampleCount": 18,
    "structureCounts": {
      "ＲＣ": 15,
      "ＳＲＣ": 1
    },
    "sampleCount": 18,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "足柄上郡開成町",
    "layout": "ldk3",
    "medianTradePriceYen": 32000000,
    "medianSqmPriceYen": 350000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 342000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＲＣ": 9
    },
    "sampleCount": 9,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "大和市",
    "layout": "k1",
    "medianTradePriceYen": 6300000,
    "medianSqmPriceYen": 273000,
    "medianAreaSqm": 20,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 1
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "大和市",
    "layout": "ldk1",
    "medianTradePriceYen": 8400000,
    "medianSqmPriceYen": 207000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 177000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "鉄骨造": 1,
      "ＲＣ": 3,
      "ＳＲＣ": 4
    },
    "sampleCount": 10,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "大和市",
    "layout": "ldk2",
    "medianTradePriceYen": 27000000,
    "medianSqmPriceYen": 500000,
    "medianAreaSqm": 58,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 615000,
        "sampleCount": 5
      },
      "age_21_30": {
        "medianSqmPriceYen": 500000,
        "sampleCount": 8
      },
      "age_31_40": {
        "medianSqmPriceYen": 289000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 28,
    "structureCounts": {
      "ＲＣ": 22,
      "ＳＲＣ": 5
    },
    "sampleCount": 28,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "大和市",
    "layout": "ldk3",
    "medianTradePriceYen": 30000000,
    "medianSqmPriceYen": 429000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 686000,
        "sampleCount": 8
      },
      "age_11_20": {
        "medianSqmPriceYen": 446000,
        "sampleCount": 11
      },
      "age_21_30": {
        "medianSqmPriceYen": 415000,
        "sampleCount": 18
      },
      "age_31_40": {
        "medianSqmPriceYen": 357000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 46,
    "structureCounts": {
      "ＲＣ": 40,
      "ＳＲＣ": 5
    },
    "sampleCount": 47,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "大和市",
    "layout": "r1",
    "medianTradePriceYen": 4100000,
    "medianSqmPriceYen": 270000,
    "medianAreaSqm": 15,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 270000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 2
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2024-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "中郡大磯町",
    "layout": "ldk3",
    "medianTradePriceYen": 43000000,
    "medianSqmPriceYen": 462000,
    "medianAreaSqm": 100,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 7
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "藤澤市",
    "layout": "k1",
    "medianTradePriceYen": 27000000,
    "medianSqmPriceYen": 838000,
    "medianAreaSqm": 30,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＳＲＣ": 1,
      "ＲＣ": 5
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "藤澤市",
    "layout": "ldk1",
    "medianTradePriceYen": 32500000,
    "medianSqmPriceYen": 1083000,
    "medianAreaSqm": 30,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1200000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 16,
    "structureCounts": {
      "ＳＲＣ": 5,
      "ＲＣ": 11
    },
    "sampleCount": 16,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "藤澤市",
    "layout": "ldk2",
    "medianTradePriceYen": 37000000,
    "medianSqmPriceYen": 700000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1071000,
        "sampleCount": 11
      },
      "age_11_20": {
        "medianSqmPriceYen": 914000,
        "sampleCount": 11
      },
      "age_21_30": {
        "medianSqmPriceYen": 637000,
        "sampleCount": 14
      },
      "age_31_40": {
        "medianSqmPriceYen": 447000,
        "sampleCount": 10
      },
      "age_41_plus": {
        "medianSqmPriceYen": 291000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 53,
    "structureCounts": {
      "ＲＣ": 41,
      "ＳＲＣ": 8,
      "ＲＣ、鉄骨造": 1
    },
    "sampleCount": 53,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "藤澤市",
    "layout": "ldk3",
    "medianTradePriceYen": 42000000,
    "medianSqmPriceYen": 561000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1000000,
        "sampleCount": 21
      },
      "age_11_20": {
        "medianSqmPriceYen": 565000,
        "sampleCount": 30
      },
      "age_21_30": {
        "medianSqmPriceYen": 560000,
        "sampleCount": 47
      },
      "age_31_40": {
        "medianSqmPriceYen": 348000,
        "sampleCount": 16
      },
      "age_41_plus": {
        "medianSqmPriceYen": 200000,
        "sampleCount": 11
      }
    },
    "buildingYearSampleCount": 125,
    "structureCounts": {
      "ＲＣ": 102,
      "ＳＲＣ": 21,
      "鉄骨造": 1
    },
    "sampleCount": 126,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "平塚市",
    "layout": "k1",
    "medianTradePriceYen": 4900000,
    "medianSqmPriceYen": 163000,
    "medianAreaSqm": 30,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＳＲＣ": 4,
      "ＲＣ": 2
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "平塚市",
    "layout": "ldk1",
    "medianTradePriceYen": 14500000,
    "medianSqmPriceYen": 353000,
    "medianAreaSqm": 40,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＳＲＣ": 1,
      "ＲＣ": 5
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "平塚市",
    "layout": "ldk2",
    "medianTradePriceYen": 15000000,
    "medianSqmPriceYen": 267000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 273000,
        "sampleCount": 11
      },
      "age_41_plus": {
        "medianSqmPriceYen": 246000,
        "sampleCount": 11
      }
    },
    "buildingYearSampleCount": 29,
    "structureCounts": {
      "ＳＲＣ": 14,
      "ＲＣ": 14
    },
    "sampleCount": 29,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "平塚市",
    "layout": "ldk3",
    "medianTradePriceYen": 27000000,
    "medianSqmPriceYen": 386000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 625000,
        "sampleCount": 5
      },
      "age_11_20": {
        "medianSqmPriceYen": 487000,
        "sampleCount": 8
      },
      "age_21_30": {
        "medianSqmPriceYen": 360000,
        "sampleCount": 11
      },
      "age_31_40": {
        "medianSqmPriceYen": 244000,
        "sampleCount": 6
      },
      "age_41_plus": {
        "medianSqmPriceYen": 131000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 37,
    "structureCounts": {
      "ＲＣ": 29,
      "ＳＲＣ": 8
    },
    "sampleCount": 39,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "橫濱市港南區",
    "layout": "ldk1",
    "medianTradePriceYen": 12500000,
    "medianSqmPriceYen": 297000,
    "medianAreaSqm": 45,
    "ageBands": {},
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＲＣ": 8,
      "ＳＲＣ": 2
    },
    "sampleCount": 10,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "橫濱市港南區",
    "layout": "ldk2",
    "medianTradePriceYen": 17500000,
    "medianSqmPriceYen": 325000,
    "medianAreaSqm": 50,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 364000,
        "sampleCount": 7
      },
      "age_41_plus": {
        "medianSqmPriceYen": 231000,
        "sampleCount": 20
      }
    },
    "buildingYearSampleCount": 36,
    "structureCounts": {
      "ＲＣ": 28,
      "ＳＲＣ": 7
    },
    "sampleCount": 38,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "橫濱市港南區",
    "layout": "ldk3",
    "medianTradePriceYen": 33000000,
    "medianSqmPriceYen": 433000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 907000,
        "sampleCount": 8
      },
      "age_11_20": {
        "medianSqmPriceYen": 788000,
        "sampleCount": 11
      },
      "age_21_30": {
        "medianSqmPriceYen": 463000,
        "sampleCount": 27
      },
      "age_31_40": {
        "medianSqmPriceYen": 315000,
        "sampleCount": 14
      },
      "age_41_plus": {
        "medianSqmPriceYen": 308000,
        "sampleCount": 17
      }
    },
    "buildingYearSampleCount": 77,
    "structureCounts": {
      "ＲＣ": 72,
      "ＳＲＣ": 4
    },
    "sampleCount": 78,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "橫濱市港北區",
    "layout": "k1",
    "medianTradePriceYen": 27000000,
    "medianSqmPriceYen": 1269000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1500000,
        "sampleCount": 35
      },
      "age_11_20": {
        "medianSqmPriceYen": 1050000,
        "sampleCount": 23
      },
      "age_21_30": {
        "medianSqmPriceYen": 1000000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 72,
    "structureCounts": {
      "ＲＣ": 64,
      "ＳＲＣ": 7,
      "鉄骨造": 1
    },
    "sampleCount": 86,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "橫濱市港北區",
    "layout": "ldk1",
    "medianTradePriceYen": 29000000,
    "medianSqmPriceYen": 707000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1167000,
        "sampleCount": 7
      },
      "age_11_20": {
        "medianSqmPriceYen": 838000,
        "sampleCount": 8
      },
      "age_31_40": {
        "medianSqmPriceYen": 580000,
        "sampleCount": 5
      },
      "age_41_plus": {
        "medianSqmPriceYen": 289000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 32,
    "structureCounts": {
      "ＲＣ": 28,
      "鉄骨造": 2,
      "ＳＲＣ": 2
    },
    "sampleCount": 32,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "橫濱市港北區",
    "layout": "ldk2",
    "medianTradePriceYen": 35000000,
    "medianSqmPriceYen": 617000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 873000,
        "sampleCount": 13
      },
      "age_21_30": {
        "medianSqmPriceYen": 615000,
        "sampleCount": 9
      },
      "age_31_40": {
        "medianSqmPriceYen": 562000,
        "sampleCount": 18
      },
      "age_41_plus": {
        "medianSqmPriceYen": 439000,
        "sampleCount": 14
      }
    },
    "buildingYearSampleCount": 58,
    "structureCounts": {
      "ＲＣ": 47,
      "鉄骨造": 5,
      "ＳＲＣ": 2
    },
    "sampleCount": 59,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "橫濱市港北區",
    "layout": "ldk3",
    "medianTradePriceYen": 52000000,
    "medianSqmPriceYen": 705000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1286000,
        "sampleCount": 21
      },
      "age_11_20": {
        "medianSqmPriceYen": 779000,
        "sampleCount": 18
      },
      "age_21_30": {
        "medianSqmPriceYen": 730000,
        "sampleCount": 42
      },
      "age_31_40": {
        "medianSqmPriceYen": 571000,
        "sampleCount": 25
      },
      "age_41_plus": {
        "medianSqmPriceYen": 425000,
        "sampleCount": 11
      }
    },
    "buildingYearSampleCount": 117,
    "structureCounts": {
      "ＲＣ": 103,
      "ＳＲＣ": 11
    },
    "sampleCount": 121,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "橫濱市港北區",
    "layout": "r1",
    "medianTradePriceYen": 7900000,
    "medianSqmPriceYen": 527000,
    "medianAreaSqm": 15,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 527000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 1,
      "ＲＣ": 4
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "橫濱市神奈川區",
    "layout": "k1",
    "medianTradePriceYen": 24000000,
    "medianSqmPriceYen": 1150000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1300000,
        "sampleCount": 45
      },
      "age_11_20": {
        "medianSqmPriceYen": 1090000,
        "sampleCount": 22
      },
      "age_31_40": {
        "medianSqmPriceYen": 560000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 82,
    "structureCounts": {
      "ＲＣ": 64,
      "ＳＲＣ": 16,
      "鉄骨造": 1
    },
    "sampleCount": 82,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "橫濱市神奈川區",
    "layout": "ldk1",
    "medianTradePriceYen": 21500000,
    "medianSqmPriceYen": 556000,
    "medianAreaSqm": 38,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1121000,
        "sampleCount": 8
      },
      "age_31_40": {
        "medianSqmPriceYen": 511000,
        "sampleCount": 7
      },
      "age_41_plus": {
        "medianSqmPriceYen": 333000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 27,
    "structureCounts": {
      "ＲＣ": 20,
      "ＳＲＣ": 6,
      "鉄骨造": 2
    },
    "sampleCount": 28,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "橫濱市神奈川區",
    "layout": "ldk2",
    "medianTradePriceYen": 36000000,
    "medianSqmPriceYen": 691000,
    "medianAreaSqm": 50,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 2128000,
        "sampleCount": 14
      },
      "age_11_20": {
        "medianSqmPriceYen": 923000,
        "sampleCount": 10
      },
      "age_21_30": {
        "medianSqmPriceYen": 814000,
        "sampleCount": 13
      },
      "age_31_40": {
        "medianSqmPriceYen": 418000,
        "sampleCount": 11
      },
      "age_41_plus": {
        "medianSqmPriceYen": 262000,
        "sampleCount": 21
      }
    },
    "buildingYearSampleCount": 69,
    "structureCounts": {
      "ＳＲＣ": 8,
      "ＲＣ": 51,
      "ＳＲＣ、鉄骨造": 6,
      "ＲＣ、鉄骨造": 4
    },
    "sampleCount": 69,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "橫濱市神奈川區",
    "layout": "ldk3",
    "medianTradePriceYen": 59500000,
    "medianSqmPriceYen": 838000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1000000,
        "sampleCount": 10
      },
      "age_11_20": {
        "medianSqmPriceYen": 920000,
        "sampleCount": 19
      },
      "age_21_30": {
        "medianSqmPriceYen": 769000,
        "sampleCount": 19
      },
      "age_41_plus": {
        "medianSqmPriceYen": 221000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 58,
    "structureCounts": {
      "ＲＣ": 45,
      "ＲＣ、鉄骨造": 3,
      "ＳＲＣ": 9,
      "ＳＲＣ、鉄骨造": 1
    },
    "sampleCount": 58,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "橫濱市神奈川區",
    "layout": "r1",
    "medianTradePriceYen": 5300000,
    "medianSqmPriceYen": 353000,
    "medianAreaSqm": 15,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 353000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 4,
      "鉄骨造": 1,
      "ＳＲＣ": 2
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "橫濱市西區",
    "layout": "k1",
    "medianTradePriceYen": 23000000,
    "medianSqmPriceYen": 1100000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1300000,
        "sampleCount": 59
      },
      "age_11_20": {
        "medianSqmPriceYen": 1050000,
        "sampleCount": 45
      },
      "age_21_30": {
        "medianSqmPriceYen": 950000,
        "sampleCount": 16
      },
      "age_31_40": {
        "medianSqmPriceYen": 600000,
        "sampleCount": 17
      },
      "age_41_plus": {
        "medianSqmPriceYen": 391000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 147,
    "structureCounts": {
      "ＲＣ": 107,
      "ＳＲＣ": 40
    },
    "sampleCount": 147,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "橫濱市西區",
    "layout": "ldk1",
    "medianTradePriceYen": 39000000,
    "medianSqmPriceYen": 1000000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1533000,
        "sampleCount": 5
      },
      "age_11_20": {
        "medianSqmPriceYen": 1133000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 17,
    "structureCounts": {
      "ＲＣ": 13,
      "ＳＲＣ": 4
    },
    "sampleCount": 17,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "橫濱市西區",
    "layout": "ldk2",
    "medianTradePriceYen": 68000000,
    "medianSqmPriceYen": 1200000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1169000,
        "sampleCount": 7
      },
      "age_11_20": {
        "medianSqmPriceYen": 1818000,
        "sampleCount": 15
      },
      "age_21_30": {
        "medianSqmPriceYen": 1028000,
        "sampleCount": 14
      },
      "age_41_plus": {
        "medianSqmPriceYen": 588000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 45,
    "structureCounts": {
      "ＲＣ": 31,
      "ＳＲＣ": 9,
      "ＳＲＣ、ＲＣ、鉄骨造": 4,
      "ＳＲＣ、ＲＣ": 1
    },
    "sampleCount": 45,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "橫濱市西區",
    "layout": "ldk3",
    "medianTradePriceYen": 88000000,
    "medianSqmPriceYen": 1231000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1385000,
        "sampleCount": 11
      },
      "age_11_20": {
        "medianSqmPriceYen": 1600000,
        "sampleCount": 9
      },
      "age_21_30": {
        "medianSqmPriceYen": 976000,
        "sampleCount": 12
      }
    },
    "buildingYearSampleCount": 37,
    "structureCounts": {
      "ＳＲＣ、ＲＣ、鉄骨造": 4,
      "ＲＣ": 30,
      "ＳＲＣ": 3
    },
    "sampleCount": 37,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "橫濱市西區",
    "layout": "r1",
    "medianTradePriceYen": 11500000,
    "medianSqmPriceYen": 700000,
    "medianAreaSqm": 15,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 650000,
        "sampleCount": 13
      }
    },
    "buildingYearSampleCount": 20,
    "structureCounts": {
      "ＳＲＣ": 9,
      "ＲＣ": 10
    },
    "sampleCount": 20,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "橫濱市青葉區",
    "layout": "k1",
    "medianTradePriceYen": 24000000,
    "medianSqmPriceYen": 1200000,
    "medianAreaSqm": 20,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 4
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "橫濱市青葉區",
    "layout": "ldk1",
    "medianTradePriceYen": 11000000,
    "medianSqmPriceYen": 258000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 231000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＲＣ": 8
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "橫濱市青葉區",
    "layout": "ldk2",
    "medianTradePriceYen": 34000000,
    "medianSqmPriceYen": 538000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 654000,
        "sampleCount": 6
      },
      "age_41_plus": {
        "medianSqmPriceYen": 400000,
        "sampleCount": 11
      }
    },
    "buildingYearSampleCount": 21,
    "structureCounts": {
      "ＲＣ": 15,
      "鉄骨造": 3,
      "ＳＲＣ": 1
    },
    "sampleCount": 27,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "橫濱市青葉區",
    "layout": "ldk3",
    "medianTradePriceYen": 49000000,
    "medianSqmPriceYen": 671000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1031000,
        "sampleCount": 7
      },
      "age_11_20": {
        "medianSqmPriceYen": 886000,
        "sampleCount": 19
      },
      "age_21_30": {
        "medianSqmPriceYen": 640000,
        "sampleCount": 29
      },
      "age_31_40": {
        "medianSqmPriceYen": 441000,
        "sampleCount": 6
      },
      "age_41_plus": {
        "medianSqmPriceYen": 363000,
        "sampleCount": 13
      }
    },
    "buildingYearSampleCount": 74,
    "structureCounts": {
      "ＲＣ": 67,
      "ＳＲＣ": 3
    },
    "sampleCount": 91,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "橫濱市中區",
    "layout": "k1",
    "medianTradePriceYen": 24000000,
    "medianSqmPriceYen": 1200000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1265000,
        "sampleCount": 42
      },
      "age_11_20": {
        "medianSqmPriceYen": 1200000,
        "sampleCount": 44
      },
      "age_21_30": {
        "medianSqmPriceYen": 975000,
        "sampleCount": 14
      },
      "age_31_40": {
        "medianSqmPriceYen": 473000,
        "sampleCount": 12
      },
      "age_41_plus": {
        "medianSqmPriceYen": 467000,
        "sampleCount": 15
      }
    },
    "buildingYearSampleCount": 127,
    "structureCounts": {
      "ＲＣ": 97,
      "ＳＲＣ": 26,
      "ＲＣ、鉄骨造": 3,
      "ＳＲＣ、ＲＣ": 1
    },
    "sampleCount": 127,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "橫濱市中區",
    "layout": "ldk1",
    "medianTradePriceYen": 38000000,
    "medianSqmPriceYen": 1086000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1250000,
        "sampleCount": 11
      },
      "age_11_20": {
        "medianSqmPriceYen": 1100000,
        "sampleCount": 9
      },
      "age_21_30": {
        "medianSqmPriceYen": 844000,
        "sampleCount": 5
      },
      "age_41_plus": {
        "medianSqmPriceYen": 400000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 32,
    "structureCounts": {
      "ＲＣ": 24,
      "ＲＣ、鉄骨造": 1,
      "ＳＲＣ": 6,
      "鉄骨造": 1
    },
    "sampleCount": 32,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "橫濱市中區",
    "layout": "ldk2",
    "medianTradePriceYen": 45000000,
    "medianSqmPriceYen": 766000,
    "medianAreaSqm": 58,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1036000,
        "sampleCount": 6
      },
      "age_11_20": {
        "medianSqmPriceYen": 1060000,
        "sampleCount": 12
      },
      "age_21_30": {
        "medianSqmPriceYen": 997000,
        "sampleCount": 18
      },
      "age_31_40": {
        "medianSqmPriceYen": 600000,
        "sampleCount": 11
      },
      "age_41_plus": {
        "medianSqmPriceYen": 462000,
        "sampleCount": 15
      }
    },
    "buildingYearSampleCount": 62,
    "structureCounts": {
      "ＲＣ": 38,
      "ＲＣ、鉄骨造": 2,
      "ＳＲＣ": 22
    },
    "sampleCount": 62,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "橫濱市中區",
    "layout": "ldk3",
    "medianTradePriceYen": 62000000,
    "medianSqmPriceYen": 794000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 853000,
        "sampleCount": 9
      },
      "age_11_20": {
        "medianSqmPriceYen": 788000,
        "sampleCount": 11
      },
      "age_21_30": {
        "medianSqmPriceYen": 837000,
        "sampleCount": 26
      },
      "age_31_40": {
        "medianSqmPriceYen": 738000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 56,
    "structureCounts": {
      "ＲＣ": 38,
      "ＳＲＣ": 14,
      "ＲＣ、鉄骨造": 2
    },
    "sampleCount": 56,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "橫濱市中區",
    "layout": "r1",
    "medianTradePriceYen": 9400000,
    "medianSqmPriceYen": 510000,
    "medianAreaSqm": 15,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 507000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 5,
      "ＳＲＣ、ＲＣ": 1
    },
    "sampleCount": 10,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "橫濱市戶塚區",
    "layout": "ldk1",
    "medianTradePriceYen": 13000000,
    "medianSqmPriceYen": 260000,
    "medianAreaSqm": 50,
    "ageBands": {},
    "buildingYearSampleCount": 4,
    "structureCounts": {
      "ＲＣ": 3
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "橫濱市戶塚區",
    "layout": "ldk2",
    "medianTradePriceYen": 13000000,
    "medianSqmPriceYen": 246000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 509000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 290000,
        "sampleCount": 10
      },
      "age_41_plus": {
        "medianSqmPriceYen": 178000,
        "sampleCount": 21
      }
    },
    "buildingYearSampleCount": 37,
    "structureCounts": {
      "ＲＣ": 23,
      "ＳＲＣ": 7
    },
    "sampleCount": 39,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "神奈川",
    "district": "橫濱市戶塚區",
    "layout": "ldk3",
    "medianTradePriceYen": 38000000,
    "medianSqmPriceYen": 529000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 710000,
        "sampleCount": 12
      },
      "age_11_20": {
        "medianSqmPriceYen": 627000,
        "sampleCount": 29
      },
      "age_21_30": {
        "medianSqmPriceYen": 510000,
        "sampleCount": 24
      },
      "age_31_40": {
        "medianSqmPriceYen": 464000,
        "sampleCount": 18
      },
      "age_41_plus": {
        "medianSqmPriceYen": 271000,
        "sampleCount": 24
      }
    },
    "buildingYearSampleCount": 107,
    "structureCounts": {
      "ＲＣ": 84,
      "ＳＲＣ": 20
    },
    "sampleCount": 109,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "青森",
    "district": "弘前市",
    "layout": "k1",
    "medianTradePriceYen": 1800000,
    "medianSqmPriceYen": 83000,
    "medianAreaSqm": 20,
    "ageBands": {},
    "buildingYearSampleCount": 3,
    "structureCounts": {
      "ＳＲＣ": 3
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q4",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "青森",
    "district": "弘前市",
    "layout": "ldk2",
    "medianTradePriceYen": 16500000,
    "medianSqmPriceYen": 253000,
    "medianAreaSqm": 63,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 1
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "青森",
    "district": "弘前市",
    "layout": "ldk3",
    "medianTradePriceYen": 8500000,
    "medianSqmPriceYen": 113000,
    "medianAreaSqm": 75,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 1,
      "ＳＲＣ": 4
    },
    "sampleCount": 10,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "青森",
    "district": "青森市",
    "layout": "ldk1",
    "medianTradePriceYen": 14000000,
    "medianSqmPriceYen": 311000,
    "medianAreaSqm": 45,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 3,
      "ＳＲＣ": 3
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "青森",
    "district": "青森市",
    "layout": "ldk2",
    "medianTradePriceYen": 10400000,
    "medianSqmPriceYen": 159000,
    "medianAreaSqm": 63,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 2
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "青森",
    "district": "青森市",
    "layout": "ldk3",
    "medianTradePriceYen": 27000000,
    "medianSqmPriceYen": 338000,
    "medianAreaSqm": 75,
    "ageBands": {},
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＳＲＣ": 6,
      "ＲＣ": 3
    },
    "sampleCount": 9,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "石川",
    "district": "金澤市",
    "layout": "k1",
    "medianTradePriceYen": 2800000,
    "medianSqmPriceYen": 107000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 98000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＲＣ": 9,
      "ＳＲＣ": 2
    },
    "sampleCount": 11,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "石川",
    "district": "金澤市",
    "layout": "ldk1",
    "medianTradePriceYen": 9800000,
    "medianSqmPriceYen": 245000,
    "medianAreaSqm": 45,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 245000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 5
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "石川",
    "district": "金澤市",
    "layout": "ldk2",
    "medianTradePriceYen": 16000000,
    "medianSqmPriceYen": 267000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 583000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 202000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 18,
    "structureCounts": {
      "ＳＲＣ": 5,
      "ＲＣ": 14
    },
    "sampleCount": 19,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "石川",
    "district": "金澤市",
    "layout": "ldk3",
    "medianTradePriceYen": 23000000,
    "medianSqmPriceYen": 308000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 384000,
        "sampleCount": 12
      },
      "age_21_30": {
        "medianSqmPriceYen": 271000,
        "sampleCount": 16
      },
      "age_31_40": {
        "medianSqmPriceYen": 200000,
        "sampleCount": 13
      }
    },
    "buildingYearSampleCount": 44,
    "structureCounts": {
      "ＲＣ": 31,
      "ＳＲＣ": 19
    },
    "sampleCount": 51,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "石川",
    "district": "小松市",
    "layout": "k1",
    "medianTradePriceYen": 2200000,
    "medianSqmPriceYen": 104000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 104000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "石川",
    "district": "小松市",
    "layout": "ldk3",
    "medianTradePriceYen": 9000000,
    "medianSqmPriceYen": 113000,
    "medianAreaSqm": 80,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 1
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "印西市",
    "layout": "ldk2",
    "medianTradePriceYen": 22000000,
    "medianSqmPriceYen": 293000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 4
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "印西市",
    "layout": "ldk3",
    "medianTradePriceYen": 23000000,
    "medianSqmPriceYen": 253000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 380000,
        "sampleCount": 9
      },
      "age_21_30": {
        "medianSqmPriceYen": 257000,
        "sampleCount": 7
      },
      "age_31_40": {
        "medianSqmPriceYen": 158000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 24,
    "structureCounts": {
      "ＲＣ": 11,
      "ＳＲＣ": 1
    },
    "sampleCount": 47,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "浦安市",
    "layout": "k1",
    "medianTradePriceYen": 27000000,
    "medianSqmPriceYen": 1275000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1275000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 6
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "浦安市",
    "layout": "ldk2",
    "medianTradePriceYen": 34000000,
    "medianSqmPriceYen": 545000,
    "medianAreaSqm": 65,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 485000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 14,
    "structureCounts": {
      "ＳＲＣ": 7,
      "ＲＣ": 7
    },
    "sampleCount": 15,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "浦安市",
    "layout": "ldk3",
    "medianTradePriceYen": 54000000,
    "medianSqmPriceYen": 635000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 920000,
        "sampleCount": 9
      },
      "age_11_20": {
        "medianSqmPriceYen": 676000,
        "sampleCount": 19
      },
      "age_21_30": {
        "medianSqmPriceYen": 635000,
        "sampleCount": 21
      },
      "age_31_40": {
        "medianSqmPriceYen": 800000,
        "sampleCount": 11
      },
      "age_41_plus": {
        "medianSqmPriceYen": 469000,
        "sampleCount": 22
      }
    },
    "buildingYearSampleCount": 82,
    "structureCounts": {
      "ＲＣ": 49,
      "ＳＲＣ": 31
    },
    "sampleCount": 85,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "我孫子市",
    "layout": "ldk2",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 267000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 2
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "我孫子市",
    "layout": "ldk3",
    "medianTradePriceYen": 23000000,
    "medianSqmPriceYen": 308000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 389000,
        "sampleCount": 14
      },
      "age_31_40": {
        "medianSqmPriceYen": 292000,
        "sampleCount": 6
      },
      "age_41_plus": {
        "medianSqmPriceYen": 149000,
        "sampleCount": 14
      }
    },
    "buildingYearSampleCount": 38,
    "structureCounts": {
      "ＳＲＣ": 4,
      "ＲＣ": 30
    },
    "sampleCount": 39,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "鎌ケ谷市",
    "layout": "ldk2",
    "medianTradePriceYen": 9900000,
    "medianSqmPriceYen": 143000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 81000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＲＣ": 7,
      "ＳＲＣ": 1
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "鎌ケ谷市",
    "layout": "ldk3",
    "medianTradePriceYen": 18000000,
    "medianSqmPriceYen": 250000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 369000,
        "sampleCount": 5
      },
      "age_41_plus": {
        "medianSqmPriceYen": 92000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 19,
    "structureCounts": {
      "ＲＣ": 16,
      "ＳＲＣ": 2
    },
    "sampleCount": 19,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "佐倉市",
    "layout": "ldk2",
    "medianTradePriceYen": 28500000,
    "medianSqmPriceYen": 408000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 4
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "佐倉市",
    "layout": "ldk3",
    "medianTradePriceYen": 22500000,
    "medianSqmPriceYen": 280000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 393000,
        "sampleCount": 12
      },
      "age_21_30": {
        "medianSqmPriceYen": 243000,
        "sampleCount": 20
      },
      "age_31_40": {
        "medianSqmPriceYen": 257000,
        "sampleCount": 9
      },
      "age_41_plus": {
        "medianSqmPriceYen": 81000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 46,
    "structureCounts": {
      "ＳＲＣ": 8,
      "ＲＣ": 30
    },
    "sampleCount": 52,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "四街道市",
    "layout": "ldk2",
    "medianTradePriceYen": 14500000,
    "medianSqmPriceYen": 253000,
    "medianAreaSqm": 55,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 1
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "四街道市",
    "layout": "ldk3",
    "medianTradePriceYen": 24000000,
    "medianSqmPriceYen": 301000,
    "medianAreaSqm": 73,
    "ageBands": {},
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＲＣ": 8
    },
    "sampleCount": 10,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "市原市",
    "layout": "ldk1",
    "medianTradePriceYen": 14000000,
    "medianSqmPriceYen": 350000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 375000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＲＣ": 9
    },
    "sampleCount": 9,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "市原市",
    "layout": "ldk2",
    "medianTradePriceYen": 11000000,
    "medianSqmPriceYen": 200000,
    "medianAreaSqm": 55,
    "ageBands": {},
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 3,
      "鉄骨造": 1
    },
    "sampleCount": 9,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "市原市",
    "layout": "ldk3",
    "medianTradePriceYen": 17000000,
    "medianSqmPriceYen": 243000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 243000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 12,
    "structureCounts": {
      "ＲＣ": 10,
      "ＳＲＣ": 1
    },
    "sampleCount": 13,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "市川市",
    "layout": "k1",
    "medianTradePriceYen": 5900000,
    "medianSqmPriceYen": 226000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 220000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 1
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "市川市",
    "layout": "ldk1",
    "medianTradePriceYen": 16000000,
    "medianSqmPriceYen": 400000,
    "medianAreaSqm": 35,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 386000,
        "sampleCount": 14
      }
    },
    "buildingYearSampleCount": 15,
    "structureCounts": {
      "ＳＲＣ": 5,
      "ＲＣ": 10
    },
    "sampleCount": 17,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "市川市",
    "layout": "ldk2",
    "medianTradePriceYen": 27000000,
    "medianSqmPriceYen": 460000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 960000,
        "sampleCount": 8
      },
      "age_21_30": {
        "medianSqmPriceYen": 676000,
        "sampleCount": 16
      },
      "age_31_40": {
        "medianSqmPriceYen": 472000,
        "sampleCount": 6
      },
      "age_41_plus": {
        "medianSqmPriceYen": 408000,
        "sampleCount": 38
      }
    },
    "buildingYearSampleCount": 70,
    "structureCounts": {
      "ＳＲＣ": 19,
      "ＲＣ": 48,
      "鉄骨造": 1
    },
    "sampleCount": 71,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "市川市",
    "layout": "ldk3",
    "medianTradePriceYen": 41000000,
    "medianSqmPriceYen": 585000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 738000,
        "sampleCount": 9
      },
      "age_11_20": {
        "medianSqmPriceYen": 696000,
        "sampleCount": 20
      },
      "age_21_30": {
        "medianSqmPriceYen": 600000,
        "sampleCount": 41
      },
      "age_31_40": {
        "medianSqmPriceYen": 493000,
        "sampleCount": 15
      },
      "age_41_plus": {
        "medianSqmPriceYen": 329000,
        "sampleCount": 21
      }
    },
    "buildingYearSampleCount": 106,
    "structureCounts": {
      "ＲＣ": 80,
      "ＳＲＣ": 23,
      "木造": 1
    },
    "sampleCount": 109,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "習志野市",
    "layout": "ldk1",
    "medianTradePriceYen": 14000000,
    "medianSqmPriceYen": 396000,
    "medianAreaSqm": 38,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "習志野市",
    "layout": "ldk2",
    "medianTradePriceYen": 24500000,
    "medianSqmPriceYen": 407000,
    "medianAreaSqm": 58,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 714000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 340000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 20,
    "structureCounts": {
      "ＲＣ": 20,
      "ＳＲＣ": 1
    },
    "sampleCount": 22,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "習志野市",
    "layout": "ldk3",
    "medianTradePriceYen": 30500000,
    "medianSqmPriceYen": 387000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1052000,
        "sampleCount": 16
      },
      "age_11_20": {
        "medianSqmPriceYen": 529000,
        "sampleCount": 11
      },
      "age_21_30": {
        "medianSqmPriceYen": 431000,
        "sampleCount": 13
      },
      "age_31_40": {
        "medianSqmPriceYen": 333000,
        "sampleCount": 12
      },
      "age_41_plus": {
        "medianSqmPriceYen": 212000,
        "sampleCount": 15
      }
    },
    "buildingYearSampleCount": 67,
    "structureCounts": {
      "ＲＣ": 50,
      "ＳＲＣ": 12
    },
    "sampleCount": 76,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "松戶市",
    "layout": "k1",
    "medianTradePriceYen": 9900000,
    "medianSqmPriceYen": 495000,
    "medianAreaSqm": 20,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 6,
      "ＳＲＣ": 1
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "松戶市",
    "layout": "ldk1",
    "medianTradePriceYen": 9000000,
    "medianSqmPriceYen": 212000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 211000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＲＣ": 7,
      "鉄骨造": 1,
      "ＳＲＣ": 2
    },
    "sampleCount": 10,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "松戶市",
    "layout": "ldk2",
    "medianTradePriceYen": 16000000,
    "medianSqmPriceYen": 267000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 415000,
        "sampleCount": 7
      },
      "age_31_40": {
        "medianSqmPriceYen": 309000,
        "sampleCount": 13
      },
      "age_41_plus": {
        "medianSqmPriceYen": 167000,
        "sampleCount": 23
      }
    },
    "buildingYearSampleCount": 50,
    "structureCounts": {
      "ＳＲＣ": 12,
      "ＲＣ": 38
    },
    "sampleCount": 54,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "松戶市",
    "layout": "ldk3",
    "medianTradePriceYen": 25000000,
    "medianSqmPriceYen": 353000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 827000,
        "sampleCount": 9
      },
      "age_11_20": {
        "medianSqmPriceYen": 463000,
        "sampleCount": 17
      },
      "age_21_30": {
        "medianSqmPriceYen": 385000,
        "sampleCount": 32
      },
      "age_31_40": {
        "medianSqmPriceYen": 292000,
        "sampleCount": 17
      },
      "age_41_plus": {
        "medianSqmPriceYen": 254000,
        "sampleCount": 32
      }
    },
    "buildingYearSampleCount": 107,
    "structureCounts": {
      "ＲＣ": 57,
      "ＳＲＣ": 37,
      "木造": 1
    },
    "sampleCount": 109,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "成田市",
    "layout": "ldk2",
    "medianTradePriceYen": 6200000,
    "medianSqmPriceYen": 138000,
    "medianAreaSqm": 50,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 102000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＲＣ": 9,
      "ＳＲＣ": 2
    },
    "sampleCount": 11,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "成田市",
    "layout": "ldk3",
    "medianTradePriceYen": 19000000,
    "medianSqmPriceYen": 225000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 295000,
        "sampleCount": 9
      },
      "age_31_40": {
        "medianSqmPriceYen": 114000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 21,
    "structureCounts": {
      "ＳＲＣ": 4,
      "ＲＣ": 17
    },
    "sampleCount": 21,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "千葉市稲毛区",
    "layout": "k1",
    "medianTradePriceYen": 4500000,
    "medianSqmPriceYen": 150000,
    "medianAreaSqm": 30,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 150000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 1
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "千葉市稲毛区",
    "layout": "ldk1",
    "medianTradePriceYen": 8900000,
    "medianSqmPriceYen": 198000,
    "medianAreaSqm": 45,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 6,
      "ＳＲＣ": 1
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "千葉市稲毛区",
    "layout": "ldk2",
    "medianTradePriceYen": 16000000,
    "medianSqmPriceYen": 238000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 200000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 17,
    "structureCounts": {
      "ＳＲＣ": 5,
      "ＲＣ": 12
    },
    "sampleCount": 18,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "千葉市稲毛区",
    "layout": "ldk3",
    "medianTradePriceYen": 22000000,
    "medianSqmPriceYen": 271000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 692000,
        "sampleCount": 6
      },
      "age_11_20": {
        "medianSqmPriceYen": 400000,
        "sampleCount": 17
      },
      "age_21_30": {
        "medianSqmPriceYen": 421000,
        "sampleCount": 20
      },
      "age_31_40": {
        "medianSqmPriceYen": 210000,
        "sampleCount": 13
      },
      "age_41_plus": {
        "medianSqmPriceYen": 194000,
        "sampleCount": 20
      }
    },
    "buildingYearSampleCount": 76,
    "structureCounts": {
      "ＲＣ": 58,
      "ＳＲＣ": 20
    },
    "sampleCount": 81,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "千葉市花見川區",
    "layout": "ldk1",
    "medianTradePriceYen": 4400000,
    "medianSqmPriceYen": 102000,
    "medianAreaSqm": 45,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 90000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 12,
    "structureCounts": {
      "ＲＣ": 10,
      "鉄骨造": 1
    },
    "sampleCount": 12,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "千葉市花見川區",
    "layout": "ldk2",
    "medianTradePriceYen": 4700000,
    "medianSqmPriceYen": 93000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 78000,
        "sampleCount": 19
      }
    },
    "buildingYearSampleCount": 27,
    "structureCounts": {
      "ＲＣ": 24,
      "ＳＲＣ": 1
    },
    "sampleCount": 28,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "千葉市花見川區",
    "layout": "ldk3",
    "medianTradePriceYen": 26500000,
    "medianSqmPriceYen": 342000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 386000,
        "sampleCount": 17
      },
      "age_41_plus": {
        "medianSqmPriceYen": 200000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 31,
    "structureCounts": {
      "ＲＣ": 18,
      "ＳＲＣ": 12
    },
    "sampleCount": 34,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "千葉市若葉区",
    "layout": "ldk2",
    "medianTradePriceYen": 7300000,
    "medianSqmPriceYen": 112000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 95000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＳＲＣ": 1,
      "ＲＣ": 9
    },
    "sampleCount": 12,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "千葉市若葉区",
    "layout": "ldk3",
    "medianTradePriceYen": 16000000,
    "medianSqmPriceYen": 214000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 214000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 15,
    "structureCounts": {
      "ＲＣ": 10,
      "ＳＲＣ": 5
    },
    "sampleCount": 15,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "千葉市中央區",
    "layout": "k1",
    "medianTradePriceYen": 28500000,
    "medianSqmPriceYen": 943000,
    "medianAreaSqm": 30,
    "ageBands": {},
    "buildingYearSampleCount": 3,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "千葉市中央區",
    "layout": "ldk1",
    "medianTradePriceYen": 30000000,
    "medianSqmPriceYen": 929000,
    "medianAreaSqm": 35,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1067000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 14,
    "structureCounts": {
      "ＲＣ": 10,
      "ＳＲＣ": 3
    },
    "sampleCount": 22,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "千葉市中央區",
    "layout": "ldk2",
    "medianTradePriceYen": 26000000,
    "medianSqmPriceYen": 433000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 600000,
        "sampleCount": 9
      },
      "age_21_30": {
        "medianSqmPriceYen": 492000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 162000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 21,
    "structureCounts": {
      "ＳＲＣ": 9,
      "ＲＣ": 12
    },
    "sampleCount": 29,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "千葉市中央區",
    "layout": "ldk3",
    "medianTradePriceYen": 35000000,
    "medianSqmPriceYen": 448000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 600000,
        "sampleCount": 7
      },
      "age_11_20": {
        "medianSqmPriceYen": 450000,
        "sampleCount": 15
      },
      "age_21_30": {
        "medianSqmPriceYen": 347000,
        "sampleCount": 17
      },
      "age_31_40": {
        "medianSqmPriceYen": 257000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 45,
    "structureCounts": {
      "ＲＣ": 31,
      "ＳＲＣ": 12
    },
    "sampleCount": 62,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "千葉市美濱區",
    "layout": "ldk1",
    "medianTradePriceYen": 8800000,
    "medianSqmPriceYen": 185000,
    "medianAreaSqm": 45,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 174000,
        "sampleCount": 15
      }
    },
    "buildingYearSampleCount": 16,
    "structureCounts": {
      "ＲＣ": 13,
      "ＳＲＣ": 3
    },
    "sampleCount": 16,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "千葉市美濱區",
    "layout": "ldk2",
    "medianTradePriceYen": 8900000,
    "medianSqmPriceYen": 157000,
    "medianAreaSqm": 50,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 127000,
        "sampleCount": 42
      }
    },
    "buildingYearSampleCount": 53,
    "structureCounts": {
      "ＲＣ": 46,
      "ＳＲＣ": 8
    },
    "sampleCount": 58,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "千葉市美濱區",
    "layout": "ldk3",
    "medianTradePriceYen": 27000000,
    "medianSqmPriceYen": 363000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 700000,
        "sampleCount": 22
      },
      "age_11_20": {
        "medianSqmPriceYen": 455000,
        "sampleCount": 14
      },
      "age_21_30": {
        "medianSqmPriceYen": 470000,
        "sampleCount": 23
      },
      "age_31_40": {
        "medianSqmPriceYen": 353000,
        "sampleCount": 5
      },
      "age_41_plus": {
        "medianSqmPriceYen": 213000,
        "sampleCount": 47
      }
    },
    "buildingYearSampleCount": 111,
    "structureCounts": {
      "ＲＣ": 75,
      "ＳＲＣ": 40
    },
    "sampleCount": 119,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "千葉市緑区",
    "layout": "ldk3",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 262000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 308000,
        "sampleCount": 15
      },
      "age_31_40": {
        "medianSqmPriceYen": 213000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 22,
    "structureCounts": {
      "ＲＣ": 16,
      "ＳＲＣ": 6
    },
    "sampleCount": 23,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "船橋市",
    "layout": "k1",
    "medianTradePriceYen": 8200000,
    "medianSqmPriceYen": 410000,
    "medianAreaSqm": 20,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 1
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "船橋市",
    "layout": "ldk1",
    "medianTradePriceYen": 10500000,
    "medianSqmPriceYen": 244000,
    "medianAreaSqm": 45,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 167000,
        "sampleCount": 13
      }
    },
    "buildingYearSampleCount": 18,
    "structureCounts": {
      "ＲＣ": 12,
      "ＳＲＣ": 4
    },
    "sampleCount": 26,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "船橋市",
    "layout": "ldk2",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 338000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 799000,
        "sampleCount": 8
      },
      "age_11_20": {
        "medianSqmPriceYen": 585000,
        "sampleCount": 7
      },
      "age_21_30": {
        "medianSqmPriceYen": 600000,
        "sampleCount": 9
      },
      "age_31_40": {
        "medianSqmPriceYen": 283000,
        "sampleCount": 9
      },
      "age_41_plus": {
        "medianSqmPriceYen": 243000,
        "sampleCount": 24
      }
    },
    "buildingYearSampleCount": 57,
    "structureCounts": {
      "ＲＣ": 36,
      "ＳＲＣ": 12
    },
    "sampleCount": 69,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "船橋市",
    "layout": "ldk3",
    "medianTradePriceYen": 29000000,
    "medianSqmPriceYen": 400000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 747000,
        "sampleCount": 20
      },
      "age_11_20": {
        "medianSqmPriceYen": 480000,
        "sampleCount": 43
      },
      "age_21_30": {
        "medianSqmPriceYen": 429000,
        "sampleCount": 47
      },
      "age_31_40": {
        "medianSqmPriceYen": 267000,
        "sampleCount": 21
      },
      "age_41_plus": {
        "medianSqmPriceYen": 220000,
        "sampleCount": 42
      }
    },
    "buildingYearSampleCount": 173,
    "structureCounts": {
      "ＲＣ": 137,
      "ＳＲＣ": 28
    },
    "sampleCount": 208,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "袖ケ浦市",
    "layout": "ldk2",
    "medianTradePriceYen": 5000000,
    "medianSqmPriceYen": 91000,
    "medianAreaSqm": 50,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 2
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q2",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "柏市",
    "layout": "ldk1",
    "medianTradePriceYen": 8000000,
    "medianSqmPriceYen": 160000,
    "medianAreaSqm": 45,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 2,
      "ＳＲＣ": 1
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "柏市",
    "layout": "ldk2",
    "medianTradePriceYen": 23000000,
    "medianSqmPriceYen": 371000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 662000,
        "sampleCount": 5
      },
      "age_41_plus": {
        "medianSqmPriceYen": 91000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 16,
    "structureCounts": {
      "ＳＲＣ": 3,
      "ＲＣ": 11
    },
    "sampleCount": 17,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "柏市",
    "layout": "ldk3",
    "medianTradePriceYen": 24500000,
    "medianSqmPriceYen": 333000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 786000,
        "sampleCount": 21
      },
      "age_11_20": {
        "medianSqmPriceYen": 429000,
        "sampleCount": 33
      },
      "age_21_30": {
        "medianSqmPriceYen": 411000,
        "sampleCount": 24
      },
      "age_31_40": {
        "medianSqmPriceYen": 247000,
        "sampleCount": 27
      },
      "age_41_plus": {
        "medianSqmPriceYen": 156000,
        "sampleCount": 25
      }
    },
    "buildingYearSampleCount": 130,
    "structureCounts": {
      "ＲＣ": 102,
      "ＳＲＣ": 29
    },
    "sampleCount": 136,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "白井市",
    "layout": "ldk2",
    "medianTradePriceYen": 6400000,
    "medianSqmPriceYen": 116000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 103000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＲＣ": 10
    },
    "sampleCount": 12,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "白井市",
    "layout": "ldk3",
    "medianTradePriceYen": 14000000,
    "medianSqmPriceYen": 135000,
    "medianAreaSqm": 95,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 105000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 16,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 20,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "八千代市",
    "layout": "ldk1",
    "medianTradePriceYen": 7200000,
    "medianSqmPriceYen": 144000,
    "medianAreaSqm": 50,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 4
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "八千代市",
    "layout": "ldk2",
    "medianTradePriceYen": 3900000,
    "medianSqmPriceYen": 81000,
    "medianAreaSqm": 50,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 73000,
        "sampleCount": 19
      }
    },
    "buildingYearSampleCount": 22,
    "structureCounts": {
      "ＲＣ": 13,
      "ＳＲＣ": 2
    },
    "sampleCount": 24,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "八千代市",
    "layout": "ldk3",
    "medianTradePriceYen": 25000000,
    "medianSqmPriceYen": 308000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 334000,
        "sampleCount": 8
      },
      "age_21_30": {
        "medianSqmPriceYen": 365000,
        "sampleCount": 17
      },
      "age_31_40": {
        "medianSqmPriceYen": 185000,
        "sampleCount": 9
      },
      "age_41_plus": {
        "medianSqmPriceYen": 266000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 46,
    "structureCounts": {
      "ＲＣ": 23,
      "ＳＲＣ": 12
    },
    "sampleCount": 49,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "富里市",
    "layout": "ldk3",
    "medianTradePriceYen": 13000000,
    "medianSqmPriceYen": 173000,
    "medianAreaSqm": 80,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 3,
      "ＲＣ": 2
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2024-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "野田市",
    "layout": "ldk3",
    "medianTradePriceYen": 9800000,
    "medianSqmPriceYen": 141000,
    "medianAreaSqm": 73,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 6
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "流山市",
    "layout": "ldk2",
    "medianTradePriceYen": 23000000,
    "medianSqmPriceYen": 418000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "千葉",
    "district": "流山市",
    "layout": "ldk3",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 286000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 600000,
        "sampleCount": 11
      },
      "age_21_30": {
        "medianSqmPriceYen": 320000,
        "sampleCount": 9
      },
      "age_31_40": {
        "medianSqmPriceYen": 240000,
        "sampleCount": 11
      },
      "age_41_plus": {
        "medianSqmPriceYen": 163000,
        "sampleCount": 13
      }
    },
    "buildingYearSampleCount": 48,
    "structureCounts": {
      "ＲＣ": 36,
      "ＳＲＣ": 9
    },
    "sampleCount": 51,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "茨木市",
    "layout": "k1",
    "medianTradePriceYen": 9300000,
    "medianSqmPriceYen": 440000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 440000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 3,
      "ＳＲＣ": 1
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "茨木市",
    "layout": "ldk1",
    "medianTradePriceYen": 14000000,
    "medianSqmPriceYen": 311000,
    "medianAreaSqm": 45,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 267000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 3,
      "鉄骨造": 1,
      "ＳＲＣ": 3
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "茨木市",
    "layout": "ldk2",
    "medianTradePriceYen": 18500000,
    "medianSqmPriceYen": 300000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 290000,
        "sampleCount": 14
      }
    },
    "buildingYearSampleCount": 18,
    "structureCounts": {
      "ＳＲＣ": 5,
      "ＲＣ": 10
    },
    "sampleCount": 18,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "茨木市",
    "layout": "ldk3",
    "medianTradePriceYen": 33000000,
    "medianSqmPriceYen": 382000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 729000,
        "sampleCount": 11
      },
      "age_11_20": {
        "medianSqmPriceYen": 543000,
        "sampleCount": 13
      },
      "age_21_30": {
        "medianSqmPriceYen": 447000,
        "sampleCount": 25
      },
      "age_41_plus": {
        "medianSqmPriceYen": 171000,
        "sampleCount": 28
      }
    },
    "buildingYearSampleCount": 81,
    "structureCounts": {
      "ＲＣ": 48,
      "ＳＲＣ": 20
    },
    "sampleCount": 82,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "羽曳野市",
    "layout": "ldk3",
    "medianTradePriceYen": 18000000,
    "medianSqmPriceYen": 200000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 160000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 15,
    "structureCounts": {
      "ＲＣ": 11,
      "ＳＲＣ": 4
    },
    "sampleCount": 15,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "河内長野市",
    "layout": "ldk3",
    "medianTradePriceYen": 7700000,
    "medianSqmPriceYen": 105000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 141000,
        "sampleCount": 9
      },
      "age_31_40": {
        "medianSqmPriceYen": 72000,
        "sampleCount": 12
      }
    },
    "buildingYearSampleCount": 22,
    "structureCounts": {
      "ＳＲＣ": 7,
      "ＲＣ": 15
    },
    "sampleCount": 22,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "貝塚市",
    "layout": "ldk2",
    "medianTradePriceYen": 6400000,
    "medianSqmPriceYen": 103000,
    "medianAreaSqm": 63,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 1
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "貝塚市",
    "layout": "ldk3",
    "medianTradePriceYen": 8500000,
    "medianSqmPriceYen": 98000,
    "medianAreaSqm": 78,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 129000,
        "sampleCount": 7
      },
      "age_31_40": {
        "medianSqmPriceYen": 84000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 16,
    "structureCounts": {
      "ＲＣ": 8,
      "ＳＲＣ": 8
    },
    "sampleCount": 16,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "岸和田市",
    "layout": "ldk2",
    "medianTradePriceYen": 15000000,
    "medianSqmPriceYen": 231000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 3,
      "ＳＲＣ": 1
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "岸和田市",
    "layout": "ldk3",
    "medianTradePriceYen": 16000000,
    "medianSqmPriceYen": 213000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 246000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 17,
    "structureCounts": {
      "ＳＲＣ": 9,
      "ＲＣ": 8
    },
    "sampleCount": 19,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "交野市",
    "layout": "ldk3",
    "medianTradePriceYen": 15000000,
    "medianSqmPriceYen": 188000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 188000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 204000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＲＣ": 13
    },
    "sampleCount": 13,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "高石市",
    "layout": "ldk2",
    "medianTradePriceYen": 15000000,
    "medianSqmPriceYen": 250000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 2
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "高石市",
    "layout": "ldk3",
    "medianTradePriceYen": 16000000,
    "medianSqmPriceYen": 221000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 229000,
        "sampleCount": 9
      },
      "age_41_plus": {
        "medianSqmPriceYen": 143000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 18,
    "structureCounts": {
      "ＲＣ": 11,
      "ＳＲＣ": 7
    },
    "sampleCount": 18,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "高槻市",
    "layout": "ldk1",
    "medianTradePriceYen": 12500000,
    "medianSqmPriceYen": 313000,
    "medianAreaSqm": 43,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "鉄骨造": 3,
      "ＲＣ": 3
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q4",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "高槻市",
    "layout": "ldk2",
    "medianTradePriceYen": 19000000,
    "medianSqmPriceYen": 338000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 291000,
        "sampleCount": 17
      }
    },
    "buildingYearSampleCount": 25,
    "structureCounts": {
      "ＲＣ": 23,
      "ＳＲＣ": 2
    },
    "sampleCount": 25,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "高槻市",
    "layout": "ldk3",
    "medianTradePriceYen": 32000000,
    "medianSqmPriceYen": 414000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 771000,
        "sampleCount": 7
      },
      "age_11_20": {
        "medianSqmPriceYen": 669000,
        "sampleCount": 12
      },
      "age_21_30": {
        "medianSqmPriceYen": 513000,
        "sampleCount": 22
      },
      "age_31_40": {
        "medianSqmPriceYen": 250000,
        "sampleCount": 9
      },
      "age_41_plus": {
        "medianSqmPriceYen": 229000,
        "sampleCount": 15
      }
    },
    "buildingYearSampleCount": 65,
    "structureCounts": {
      "ＲＣ": 57,
      "ＳＲＣ": 8
    },
    "sampleCount": 65,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "阪南市",
    "layout": "ldk3",
    "medianTradePriceYen": 13000000,
    "medianSqmPriceYen": 185000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 185000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＳＲＣ": 3,
      "ＲＣ": 6
    },
    "sampleCount": 9,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "堺市堺區",
    "layout": "k1",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 1000000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1000000,
        "sampleCount": 13
      }
    },
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＲＣ": 13
    },
    "sampleCount": 13,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "堺市堺區",
    "layout": "ldk1",
    "medianTradePriceYen": 11000000,
    "medianSqmPriceYen": 291000,
    "medianAreaSqm": 40,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 6
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "堺市堺區",
    "layout": "ldk2",
    "medianTradePriceYen": 25000000,
    "medianSqmPriceYen": 371000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 986000,
        "sampleCount": 5
      },
      "age_21_30": {
        "medianSqmPriceYen": 415000,
        "sampleCount": 9
      },
      "age_41_plus": {
        "medianSqmPriceYen": 147000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 27,
    "structureCounts": {
      "ＳＲＣ": 11,
      "ＲＣ": 16
    },
    "sampleCount": 27,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "堺市堺區",
    "layout": "ldk3",
    "medianTradePriceYen": 27000000,
    "medianSqmPriceYen": 338000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 633000,
        "sampleCount": 12
      },
      "age_11_20": {
        "medianSqmPriceYen": 472000,
        "sampleCount": 10
      },
      "age_21_30": {
        "medianSqmPriceYen": 335000,
        "sampleCount": 20
      },
      "age_31_40": {
        "medianSqmPriceYen": 227000,
        "sampleCount": 13
      }
    },
    "buildingYearSampleCount": 59,
    "structureCounts": {
      "ＲＣ": 41,
      "ＳＲＣ": 15,
      "ＳＲＣ、ＲＣ": 3
    },
    "sampleCount": 59,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "堺市西区",
    "layout": "ldk2",
    "medianTradePriceYen": 22000000,
    "medianSqmPriceYen": 338000,
    "medianAreaSqm": 60,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 1
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "堺市西区",
    "layout": "ldk3",
    "medianTradePriceYen": 23000000,
    "medianSqmPriceYen": 297000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 430000,
        "sampleCount": 8
      },
      "age_21_30": {
        "medianSqmPriceYen": 288000,
        "sampleCount": 13
      },
      "age_31_40": {
        "medianSqmPriceYen": 229000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 28,
    "structureCounts": {
      "ＲＣ": 20,
      "ＳＲＣ": 7,
      "鉄骨造": 1
    },
    "sampleCount": 28,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "堺市中区",
    "layout": "ldk2",
    "medianTradePriceYen": 6500000,
    "medianSqmPriceYen": 100000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 2,
      "ＳＲＣ": 3
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "堺市中区",
    "layout": "ldk3",
    "medianTradePriceYen": 19000000,
    "medianSqmPriceYen": 238000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 315000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＳＲＣ": 5,
      "ＲＣ": 4
    },
    "sampleCount": 9,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "堺市東区",
    "layout": "ldk2",
    "medianTradePriceYen": 11000000,
    "medianSqmPriceYen": 184000,
    "medianAreaSqm": 63,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 185000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＳＲＣ": 3,
      "ＲＣ": 3
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "堺市東区",
    "layout": "ldk3",
    "medianTradePriceYen": 15500000,
    "medianSqmPriceYen": 207000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 3
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "堺市南区",
    "layout": "ldk1",
    "medianTradePriceYen": 4500000,
    "medianSqmPriceYen": 100000,
    "medianAreaSqm": 45,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 84000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "鉄骨造": 4,
      "ＲＣ": 3
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q2",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "堺市南区",
    "layout": "ldk2",
    "medianTradePriceYen": 17000000,
    "medianSqmPriceYen": 262000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 104000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 18,
    "structureCounts": {
      "ＳＲＣ": 5,
      "ＲＣ": 13
    },
    "sampleCount": 18,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "堺市南区",
    "layout": "ldk3",
    "medianTradePriceYen": 22000000,
    "medianSqmPriceYen": 286000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 384000,
        "sampleCount": 8
      },
      "age_21_30": {
        "medianSqmPriceYen": 318000,
        "sampleCount": 19
      },
      "age_31_40": {
        "medianSqmPriceYen": 167000,
        "sampleCount": 6
      },
      "age_41_plus": {
        "medianSqmPriceYen": 105000,
        "sampleCount": 12
      }
    },
    "buildingYearSampleCount": 46,
    "structureCounts": {
      "ＲＣ": 32,
      "ＳＲＣ": 13
    },
    "sampleCount": 47,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "堺市北区",
    "layout": "ldk2",
    "medianTradePriceYen": 10000000,
    "medianSqmPriceYen": 220000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 196000,
        "sampleCount": 15
      }
    },
    "buildingYearSampleCount": 20,
    "structureCounts": {
      "ＲＣ": 19,
      "ＳＲＣ": 4
    },
    "sampleCount": 23,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "堺市北区",
    "layout": "ldk3",
    "medianTradePriceYen": 29000000,
    "medianSqmPriceYen": 414000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 437000,
        "sampleCount": 6
      },
      "age_21_30": {
        "medianSqmPriceYen": 414000,
        "sampleCount": 27
      }
    },
    "buildingYearSampleCount": 41,
    "structureCounts": {
      "ＲＣ": 31,
      "ＳＲＣ": 7,
      "ＳＲＣ、ＲＣ": 3
    },
    "sampleCount": 41,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "三島郡島本町",
    "layout": "ldk2",
    "medianTradePriceYen": 5300000,
    "medianSqmPriceYen": 88000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 88000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＲＣ": 9
    },
    "sampleCount": 9,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "三島郡島本町",
    "layout": "ldk3",
    "medianTradePriceYen": 32000000,
    "medianSqmPriceYen": 457000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 586000,
        "sampleCount": 6
      },
      "age_11_20": {
        "medianSqmPriceYen": 480000,
        "sampleCount": 7
      },
      "age_41_plus": {
        "medianSqmPriceYen": 265000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 22,
    "structureCounts": {
      "ＲＣ": 21,
      "ＳＲＣ": 2
    },
    "sampleCount": 23,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "四條畷市",
    "layout": "ldk3",
    "medianTradePriceYen": 6000000,
    "medianSqmPriceYen": 71000,
    "medianAreaSqm": 75,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "守口市",
    "layout": "ldk2",
    "medianTradePriceYen": 17500000,
    "medianSqmPriceYen": 335000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 267000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 16,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 12
    },
    "sampleCount": 16,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "守口市",
    "layout": "ldk3",
    "medianTradePriceYen": 29000000,
    "medianSqmPriceYen": 414000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 668000,
        "sampleCount": 6
      },
      "age_21_30": {
        "medianSqmPriceYen": 408000,
        "sampleCount": 12
      },
      "age_31_40": {
        "medianSqmPriceYen": 297000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 30,
    "structureCounts": {
      "ＲＣ": 17,
      "ＳＲＣ": 11,
      "木造": 1
    },
    "sampleCount": 30,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "松原市",
    "layout": "ldk2",
    "medianTradePriceYen": 13000000,
    "medianSqmPriceYen": 236000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＲＣ": 9,
      "ＳＲＣ": 2
    },
    "sampleCount": 11,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "松原市",
    "layout": "ldk3",
    "medianTradePriceYen": 16500000,
    "medianSqmPriceYen": 246000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 414000,
        "sampleCount": 6
      },
      "age_41_plus": {
        "medianSqmPriceYen": 95000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 16,
    "structureCounts": {
      "ＲＣ": 12,
      "ＳＲＣ": 4
    },
    "sampleCount": 16,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "寝屋川市",
    "layout": "ldk2",
    "medianTradePriceYen": 14000000,
    "medianSqmPriceYen": 240000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 238000,
        "sampleCount": 6
      },
      "age_41_plus": {
        "medianSqmPriceYen": 177000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 15,
    "structureCounts": {
      "ＲＣ": 10,
      "ＳＲＣ": 4,
      "鉄骨造": 1
    },
    "sampleCount": 15,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "寝屋川市",
    "layout": "ldk3",
    "medianTradePriceYen": 22000000,
    "medianSqmPriceYen": 288000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 451000,
        "sampleCount": 22
      },
      "age_21_30": {
        "medianSqmPriceYen": 337000,
        "sampleCount": 6
      },
      "age_31_40": {
        "medianSqmPriceYen": 199000,
        "sampleCount": 14
      },
      "age_41_plus": {
        "medianSqmPriceYen": 134000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 49,
    "structureCounts": {
      "ＲＣ": 28,
      "ＳＲＣ": 22
    },
    "sampleCount": 50,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "吹田市",
    "layout": "k1",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 933000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1000000,
        "sampleCount": 26
      },
      "age_11_20": {
        "medianSqmPriceYen": 775000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 33,
    "structureCounts": {
      "ＲＣ": 30,
      "鉄骨造": 1
    },
    "sampleCount": 33,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "吹田市",
    "layout": "ldk1",
    "medianTradePriceYen": 23500000,
    "medianSqmPriceYen": 590000,
    "medianAreaSqm": 38,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 786000,
        "sampleCount": 12
      },
      "age_41_plus": {
        "medianSqmPriceYen": 133000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 20,
    "structureCounts": {
      "鉄骨造": 5,
      "ＲＣ": 14,
      "ＳＲＣ": 1
    },
    "sampleCount": 20,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "吹田市",
    "layout": "ldk2",
    "medianTradePriceYen": 25000000,
    "medianSqmPriceYen": 432000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 762000,
        "sampleCount": 10
      },
      "age_11_20": {
        "medianSqmPriceYen": 648000,
        "sampleCount": 6
      },
      "age_21_30": {
        "medianSqmPriceYen": 577000,
        "sampleCount": 14
      },
      "age_41_plus": {
        "medianSqmPriceYen": 283000,
        "sampleCount": 31
      }
    },
    "buildingYearSampleCount": 62,
    "structureCounts": {
      "ＲＣ": 35,
      "ＳＲＣ": 25,
      "鉄骨造": 2
    },
    "sampleCount": 62,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "吹田市",
    "layout": "ldk3",
    "medianTradePriceYen": 37500000,
    "medianSqmPriceYen": 497000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 771000,
        "sampleCount": 50
      },
      "age_11_20": {
        "medianSqmPriceYen": 643000,
        "sampleCount": 41
      },
      "age_21_30": {
        "medianSqmPriceYen": 514000,
        "sampleCount": 77
      },
      "age_31_40": {
        "medianSqmPriceYen": 363000,
        "sampleCount": 13
      },
      "age_41_plus": {
        "medianSqmPriceYen": 282000,
        "sampleCount": 71
      }
    },
    "buildingYearSampleCount": 252,
    "structureCounts": {
      "ＲＣ": 178,
      "ＳＲＣ": 72,
      "ＳＲＣ、ＲＣ": 1
    },
    "sampleCount": 252,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "摂津市",
    "layout": "ldk1",
    "medianTradePriceYen": 17000000,
    "medianSqmPriceYen": 340000,
    "medianAreaSqm": 50,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 340000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "摂津市",
    "layout": "ldk2",
    "medianTradePriceYen": 14000000,
    "medianSqmPriceYen": 280000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 5
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "摂津市",
    "layout": "ldk3",
    "medianTradePriceYen": 40000000,
    "medianSqmPriceYen": 538000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 694000,
        "sampleCount": 6
      },
      "age_41_plus": {
        "medianSqmPriceYen": 187000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 19,
    "structureCounts": {
      "ＳＲＣ": 5,
      "ＲＣ": 14
    },
    "sampleCount": 19,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "泉佐野市",
    "layout": "ldk2",
    "medianTradePriceYen": 14000000,
    "medianSqmPriceYen": 224000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＳＲＣ": 5,
      "ＲＣ": 3
    },
    "sampleCount": 8,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "泉佐野市",
    "layout": "ldk3",
    "medianTradePriceYen": 10000000,
    "medianSqmPriceYen": 146000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 300000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 7
    },
    "sampleCount": 11,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "泉大津市",
    "layout": "ldk2",
    "medianTradePriceYen": 14000000,
    "medianSqmPriceYen": 215000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 3
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "泉大津市",
    "layout": "ldk3",
    "medianTradePriceYen": 16000000,
    "medianSqmPriceYen": 200000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 213000,
        "sampleCount": 6
      },
      "age_31_40": {
        "medianSqmPriceYen": 187000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 2
    },
    "sampleCount": 11,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "泉南郡熊取町",
    "layout": "ldk2",
    "medianTradePriceYen": 9500000,
    "medianSqmPriceYen": 154000,
    "medianAreaSqm": 55,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 6,
      "ＳＲＣ": 1
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "泉南郡熊取町",
    "layout": "ldk3",
    "medianTradePriceYen": 10100000,
    "medianSqmPriceYen": 140000,
    "medianAreaSqm": 73,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 186000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 3
    },
    "sampleCount": 8,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "泉南市",
    "layout": "ldk3",
    "medianTradePriceYen": 3800000,
    "medianSqmPriceYen": 58000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＳＲＣ": 4,
      "ＲＣ": 3
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2024-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "泉北郡忠岡町",
    "layout": "ldk3",
    "medianTradePriceYen": 8000000,
    "medianSqmPriceYen": 112000,
    "medianAreaSqm": 65,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 112000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 6
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪狭山市",
    "layout": "ldk1",
    "medianTradePriceYen": 2500000,
    "medianSqmPriceYen": 56000,
    "medianAreaSqm": 45,
    "ageBands": {},
    "buildingYearSampleCount": 4,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2025-Q2",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪狭山市",
    "layout": "ldk2",
    "medianTradePriceYen": 2500000,
    "medianSqmPriceYen": 49000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 47000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＲＣ": 7,
      "ＳＲＣ": 4
    },
    "sampleCount": 11,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪狭山市",
    "layout": "ldk3",
    "medianTradePriceYen": 11500000,
    "medianSqmPriceYen": 164000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 171000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 14,
    "structureCounts": {
      "ＲＣ": 8,
      "ＳＲＣ": 6
    },
    "sampleCount": 14,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市阿倍野区",
    "layout": "k1",
    "medianTradePriceYen": 17000000,
    "medianSqmPriceYen": 750000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 700000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＲＣ": 9,
      "ＳＲＣ": 3
    },
    "sampleCount": 12,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市阿倍野区",
    "layout": "ldk1",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 467000,
    "medianAreaSqm": 45,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "鉄骨造": 1,
      "ＲＣ": 3,
      "ＳＲＣ": 1
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市阿倍野区",
    "layout": "ldk2",
    "medianTradePriceYen": 38000000,
    "medianSqmPriceYen": 600000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 733000,
        "sampleCount": 9
      },
      "age_21_30": {
        "medianSqmPriceYen": 607000,
        "sampleCount": 10
      },
      "age_31_40": {
        "medianSqmPriceYen": 383000,
        "sampleCount": 7
      },
      "age_41_plus": {
        "medianSqmPriceYen": 420000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 36,
    "structureCounts": {
      "ＳＲＣ": 14,
      "ＲＣ": 22
    },
    "sampleCount": 36,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市阿倍野区",
    "layout": "ldk3",
    "medianTradePriceYen": 45000000,
    "medianSqmPriceYen": 613000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 714000,
        "sampleCount": 5
      },
      "age_11_20": {
        "medianSqmPriceYen": 738000,
        "sampleCount": 12
      },
      "age_21_30": {
        "medianSqmPriceYen": 586000,
        "sampleCount": 22
      },
      "age_31_40": {
        "medianSqmPriceYen": 506000,
        "sampleCount": 11
      }
    },
    "buildingYearSampleCount": 52,
    "structureCounts": {
      "ＲＣ": 24,
      "鉄骨造": 1,
      "ＳＲＣ": 29
    },
    "sampleCount": 57,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市旭区",
    "layout": "k1",
    "medianTradePriceYen": 19000000,
    "medianSqmPriceYen": 875000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1000000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＲＣ": 6,
      "鉄骨造": 2
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市旭区",
    "layout": "ldk1",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 667000,
    "medianAreaSqm": 30,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 1,
      "鉄骨造": 2
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市旭区",
    "layout": "ldk2",
    "medianTradePriceYen": 18000000,
    "medianSqmPriceYen": 320000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 415000,
        "sampleCount": 5
      },
      "age_41_plus": {
        "medianSqmPriceYen": 291000,
        "sampleCount": 18
      }
    },
    "buildingYearSampleCount": 25,
    "structureCounts": {
      "ＳＲＣ": 21,
      "ＲＣ": 4
    },
    "sampleCount": 25,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市旭区",
    "layout": "ldk3",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 277000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 248000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 15,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 10
    },
    "sampleCount": 15,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市港区",
    "layout": "k1",
    "medianTradePriceYen": 18000000,
    "medianSqmPriceYen": 900000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 950000,
        "sampleCount": 48
      },
      "age_11_20": {
        "medianSqmPriceYen": 750000,
        "sampleCount": 23
      }
    },
    "buildingYearSampleCount": 71,
    "structureCounts": {
      "ＲＣ": 71
    },
    "sampleCount": 71,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市港区",
    "layout": "ldk1",
    "medianTradePriceYen": 10000000,
    "medianSqmPriceYen": 286000,
    "medianAreaSqm": 35,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 6,
      "ＳＲＣ": 1
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市港区",
    "layout": "ldk2",
    "medianTradePriceYen": 25500000,
    "medianSqmPriceYen": 452000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 562000,
        "sampleCount": 10
      },
      "age_41_plus": {
        "medianSqmPriceYen": 246000,
        "sampleCount": 11
      }
    },
    "buildingYearSampleCount": 28,
    "structureCounts": {
      "ＳＲＣ": 7,
      "ＲＣ": 18,
      "ＳＲＣ、ＲＣ": 3
    },
    "sampleCount": 28,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市港区",
    "layout": "ldk3",
    "medianTradePriceYen": 33000000,
    "medianSqmPriceYen": 485000,
    "medianAreaSqm": 73,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 619000,
        "sampleCount": 14
      },
      "age_31_40": {
        "medianSqmPriceYen": 338000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 30,
    "structureCounts": {
      "ＳＲＣ": 11,
      "ＲＣ": 13,
      "ＳＲＣ、ＲＣ": 4,
      "ＲＣ、鉄骨造": 2
    },
    "sampleCount": 30,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市此花区",
    "layout": "k1",
    "medianTradePriceYen": 19500000,
    "medianSqmPriceYen": 975000,
    "medianAreaSqm": 20,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 6
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市此花区",
    "layout": "ldk2",
    "medianTradePriceYen": 16500000,
    "medianSqmPriceYen": 311000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 467000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 220000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 18,
    "structureCounts": {
      "ＳＲＣ": 8,
      "ＲＣ": 10
    },
    "sampleCount": 18,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市此花区",
    "layout": "ldk3",
    "medianTradePriceYen": 36000000,
    "medianSqmPriceYen": 458000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 471000,
        "sampleCount": 11
      }
    },
    "buildingYearSampleCount": 20,
    "structureCounts": {
      "ＲＣ": 17,
      "ＳＲＣ": 3
    },
    "sampleCount": 20,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市住吉区",
    "layout": "k1",
    "medianTradePriceYen": 8400000,
    "medianSqmPriceYen": 285000,
    "medianAreaSqm": 25,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 8,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市住吉区",
    "layout": "ldk1",
    "medianTradePriceYen": 10900000,
    "medianSqmPriceYen": 229000,
    "medianAreaSqm": 45,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市住吉区",
    "layout": "ldk2",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 345000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 467000,
        "sampleCount": 6
      },
      "age_31_40": {
        "medianSqmPriceYen": 350000,
        "sampleCount": 6
      },
      "age_41_plus": {
        "medianSqmPriceYen": 250000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 22,
    "structureCounts": {
      "ＲＣ": 18,
      "ＳＲＣ": 3
    },
    "sampleCount": 23,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市住吉区",
    "layout": "ldk3",
    "medianTradePriceYen": 35000000,
    "medianSqmPriceYen": 510000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 600000,
        "sampleCount": 8
      },
      "age_21_30": {
        "medianSqmPriceYen": 440000,
        "sampleCount": 11
      }
    },
    "buildingYearSampleCount": 25,
    "structureCounts": {
      "ＲＣ": 16,
      "ＳＲＣ": 3
    },
    "sampleCount": 26,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市住之江区",
    "layout": "ldk1",
    "medianTradePriceYen": 7000000,
    "medianSqmPriceYen": 163000,
    "medianAreaSqm": 43,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＳＲＣ": 5
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q4",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市住之江区",
    "layout": "ldk2",
    "medianTradePriceYen": 15000000,
    "medianSqmPriceYen": 260000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 262000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 209000,
        "sampleCount": 6
      },
      "age_41_plus": {
        "medianSqmPriceYen": 200000,
        "sampleCount": 13
      }
    },
    "buildingYearSampleCount": 27,
    "structureCounts": {
      "ＲＣ": 9,
      "ＳＲＣ": 10
    },
    "sampleCount": 27,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市住之江区",
    "layout": "ldk3",
    "medianTradePriceYen": 23000000,
    "medianSqmPriceYen": 313000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 686000,
        "sampleCount": 11
      },
      "age_11_20": {
        "medianSqmPriceYen": 431000,
        "sampleCount": 7
      },
      "age_21_30": {
        "medianSqmPriceYen": 362000,
        "sampleCount": 12
      },
      "age_31_40": {
        "medianSqmPriceYen": 253000,
        "sampleCount": 6
      },
      "age_41_plus": {
        "medianSqmPriceYen": 201000,
        "sampleCount": 22
      }
    },
    "buildingYearSampleCount": 58,
    "structureCounts": {
      "ＲＣ": 19,
      "ＳＲＣ": 30,
      "ＲＣ、鉄骨造": 2,
      "ＳＲＣ、ＲＣ": 1
    },
    "sampleCount": 59,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市城東区",
    "layout": "k1",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 900000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 920000,
        "sampleCount": 27
      }
    },
    "buildingYearSampleCount": 31,
    "structureCounts": {
      "ＲＣ": 30,
      "ＳＲＣ、ＲＣ": 1
    },
    "sampleCount": 31,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市城東区",
    "layout": "ldk1",
    "medianTradePriceYen": 11500000,
    "medianSqmPriceYen": 272000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 200000,
        "sampleCount": 11
      }
    },
    "buildingYearSampleCount": 14,
    "structureCounts": {
      "ＲＣ": 13,
      "ＳＲＣ、鉄骨造": 1
    },
    "sampleCount": 14,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市城東区",
    "layout": "ldk2",
    "medianTradePriceYen": 22000000,
    "medianSqmPriceYen": 382000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 650000,
        "sampleCount": 6
      },
      "age_21_30": {
        "medianSqmPriceYen": 492000,
        "sampleCount": 19
      },
      "age_31_40": {
        "medianSqmPriceYen": 380000,
        "sampleCount": 7
      },
      "age_41_plus": {
        "medianSqmPriceYen": 283000,
        "sampleCount": 43
      }
    },
    "buildingYearSampleCount": 79,
    "structureCounts": {
      "ＳＲＣ": 42,
      "ＲＣ": 27,
      "ＳＲＣ、ＲＣ": 6,
      "ＳＲＣ、鉄骨造": 1,
      "ＲＣ、鉄骨造": 2
    },
    "sampleCount": 79,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市城東区",
    "layout": "ldk3",
    "medianTradePriceYen": 35000000,
    "medianSqmPriceYen": 506000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 581000,
        "sampleCount": 12
      },
      "age_21_30": {
        "medianSqmPriceYen": 538000,
        "sampleCount": 29
      },
      "age_41_plus": {
        "medianSqmPriceYen": 357000,
        "sampleCount": 21
      }
    },
    "buildingYearSampleCount": 68,
    "structureCounts": {
      "ＳＲＣ": 31,
      "ＲＣ": 33,
      "ＳＲＣ、ＲＣ": 3,
      "ＲＣ、鉄骨造": 1
    },
    "sampleCount": 68,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市生野区",
    "layout": "k1",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 1000000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1000000,
        "sampleCount": 19
      }
    },
    "buildingYearSampleCount": 21,
    "structureCounts": {
      "ＲＣ": 18,
      "ＳＲＣ": 2,
      "鉄骨造": 2
    },
    "sampleCount": 22,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市生野区",
    "layout": "ldk2",
    "medianTradePriceYen": 17500000,
    "medianSqmPriceYen": 314000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 327000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＳＲＣ": 6,
      "ＲＣ": 4
    },
    "sampleCount": 10,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市生野区",
    "layout": "ldk3",
    "medianTradePriceYen": 29500000,
    "medianSqmPriceYen": 445000,
    "medianAreaSqm": 68,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＳＲＣ": 5,
      "ＲＣ": 1
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市西成区",
    "layout": "k1",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 800000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 920000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＳＲＣ": 1,
      "ＲＣ": 6
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q2",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市西成区",
    "layout": "ldk2",
    "medianTradePriceYen": 16000000,
    "medianSqmPriceYen": 291000,
    "medianAreaSqm": 60,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 5
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市西成区",
    "layout": "ldk3",
    "medianTradePriceYen": 23000000,
    "medianSqmPriceYen": 317000,
    "medianAreaSqm": 68,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 1
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市西淀川区",
    "layout": "k1",
    "medianTradePriceYen": 17000000,
    "medianSqmPriceYen": 800000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 850000,
        "sampleCount": 25
      },
      "age_11_20": {
        "medianSqmPriceYen": 750000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 40,
    "structureCounts": {
      "ＲＣ": 30
    },
    "sampleCount": 40,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市西淀川区",
    "layout": "ldk1",
    "medianTradePriceYen": 12000000,
    "medianSqmPriceYen": 271000,
    "medianAreaSqm": 40,
    "ageBands": {},
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＳＲＣ": 5,
      "ＳＲＣ、ＲＣ": 1,
      "ＲＣ": 2
    },
    "sampleCount": 8,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市西淀川区",
    "layout": "ldk2",
    "medianTradePriceYen": 17000000,
    "medianSqmPriceYen": 283000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 417000,
        "sampleCount": 10
      },
      "age_31_40": {
        "medianSqmPriceYen": 266000,
        "sampleCount": 10
      },
      "age_41_plus": {
        "medianSqmPriceYen": 217000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 29,
    "structureCounts": {
      "ＳＲＣ、ＲＣ": 2,
      "ＲＣ": 15,
      "ＳＲＣ": 5
    },
    "sampleCount": 29,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市西淀川区",
    "layout": "ldk3",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 308000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 433000,
        "sampleCount": 7
      },
      "age_31_40": {
        "medianSqmPriceYen": 231000,
        "sampleCount": 8
      },
      "age_41_plus": {
        "medianSqmPriceYen": 215000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 25,
    "structureCounts": {
      "ＲＣ": 10,
      "ＳＲＣ、ＲＣ": 4,
      "ＳＲＣ": 8
    },
    "sampleCount": 25,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市西區",
    "layout": "k1",
    "medianTradePriceYen": 19000000,
    "medianSqmPriceYen": 900000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 950000,
        "sampleCount": 159
      },
      "age_11_20": {
        "medianSqmPriceYen": 840000,
        "sampleCount": 42
      },
      "age_21_30": {
        "medianSqmPriceYen": 750000,
        "sampleCount": 11
      },
      "age_41_plus": {
        "medianSqmPriceYen": 410000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 220,
    "structureCounts": {
      "ＳＲＣ": 14,
      "ＲＣ": 207
    },
    "sampleCount": 222,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市西區",
    "layout": "ldk1",
    "medianTradePriceYen": 31000000,
    "medianSqmPriceYen": 800000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 978000,
        "sampleCount": 19
      },
      "age_11_20": {
        "medianSqmPriceYen": 800000,
        "sampleCount": 23
      },
      "age_21_30": {
        "medianSqmPriceYen": 620000,
        "sampleCount": 5
      },
      "age_41_plus": {
        "medianSqmPriceYen": 411000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 59,
    "structureCounts": {
      "ＲＣ": 43,
      "ＳＲＣ": 17
    },
    "sampleCount": 60,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市西區",
    "layout": "ldk2",
    "medianTradePriceYen": 40000000,
    "medianSqmPriceYen": 646000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1309000,
        "sampleCount": 21
      },
      "age_11_20": {
        "medianSqmPriceYen": 840000,
        "sampleCount": 17
      },
      "age_21_30": {
        "medianSqmPriceYen": 657000,
        "sampleCount": 19
      },
      "age_31_40": {
        "medianSqmPriceYen": 480000,
        "sampleCount": 9
      },
      "age_41_plus": {
        "medianSqmPriceYen": 455000,
        "sampleCount": 27
      }
    },
    "buildingYearSampleCount": 93,
    "structureCounts": {
      "ＳＲＣ": 51,
      "ＲＣ": 42
    },
    "sampleCount": 93,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市西區",
    "layout": "ldk3",
    "medianTradePriceYen": 57000000,
    "medianSqmPriceYen": 762000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1211000,
        "sampleCount": 22
      },
      "age_11_20": {
        "medianSqmPriceYen": 843000,
        "sampleCount": 13
      },
      "age_21_30": {
        "medianSqmPriceYen": 647000,
        "sampleCount": 19
      },
      "age_41_plus": {
        "medianSqmPriceYen": 407000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 68,
    "structureCounts": {
      "ＳＲＣ": 26,
      "ＲＣ": 42
    },
    "sampleCount": 68,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市大正区",
    "layout": "k1",
    "medianTradePriceYen": 18500000,
    "medianSqmPriceYen": 900000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 925000,
        "sampleCount": 18
      }
    },
    "buildingYearSampleCount": 20,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 18
    },
    "sampleCount": 20,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市大正区",
    "layout": "ldk1",
    "medianTradePriceYen": 27000000,
    "medianSqmPriceYen": 900000,
    "medianAreaSqm": 30,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 900000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＲＣ": 7,
      "ＳＲＣ": 2
    },
    "sampleCount": 9,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市大正区",
    "layout": "ldk2",
    "medianTradePriceYen": 22000000,
    "medianSqmPriceYen": 400000,
    "medianAreaSqm": 60,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 3,
      "ＳＲＣ": 4
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市大正区",
    "layout": "ldk3",
    "medianTradePriceYen": 25500000,
    "medianSqmPriceYen": 377000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＳＲＣ": 5,
      "ＲＣ": 3
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市中央區",
    "layout": "k1",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 880000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 983000,
        "sampleCount": 122
      },
      "age_11_20": {
        "medianSqmPriceYen": 880000,
        "sampleCount": 95
      },
      "age_21_30": {
        "medianSqmPriceYen": 700000,
        "sampleCount": 28
      },
      "age_41_plus": {
        "medianSqmPriceYen": 453000,
        "sampleCount": 24
      }
    },
    "buildingYearSampleCount": 270,
    "structureCounts": {
      "ＲＣ": 236,
      "ＳＲＣ": 33,
      "ＳＲＣ、ＲＣ": 1
    },
    "sampleCount": 270,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市中央區",
    "layout": "ldk1",
    "medianTradePriceYen": 33000000,
    "medianSqmPriceYen": 886000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1111000,
        "sampleCount": 32
      },
      "age_11_20": {
        "medianSqmPriceYen": 893000,
        "sampleCount": 30
      },
      "age_21_30": {
        "medianSqmPriceYen": 667000,
        "sampleCount": 7
      },
      "age_31_40": {
        "medianSqmPriceYen": 400000,
        "sampleCount": 6
      },
      "age_41_plus": {
        "medianSqmPriceYen": 429000,
        "sampleCount": 13
      }
    },
    "buildingYearSampleCount": 88,
    "structureCounts": {
      "ＲＣ": 68,
      "ＳＲＣ": 18,
      "ＳＲＣ、ＲＣ": 1
    },
    "sampleCount": 88,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市中央區",
    "layout": "ldk2",
    "medianTradePriceYen": 47000000,
    "medianSqmPriceYen": 817000,
    "medianAreaSqm": 58,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1383000,
        "sampleCount": 26
      },
      "age_11_20": {
        "medianSqmPriceYen": 976000,
        "sampleCount": 32
      },
      "age_21_30": {
        "medianSqmPriceYen": 727000,
        "sampleCount": 28
      },
      "age_31_40": {
        "medianSqmPriceYen": 524000,
        "sampleCount": 14
      },
      "age_41_plus": {
        "medianSqmPriceYen": 417000,
        "sampleCount": 13
      }
    },
    "buildingYearSampleCount": 113,
    "structureCounts": {
      "ＲＣ": 61,
      "ＳＲＣ": 49,
      "鉄骨造": 3
    },
    "sampleCount": 114,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市中央區",
    "layout": "ldk3",
    "medianTradePriceYen": 66000000,
    "medianSqmPriceYen": 900000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1467000,
        "sampleCount": 20
      },
      "age_11_20": {
        "medianSqmPriceYen": 1043000,
        "sampleCount": 21
      },
      "age_21_30": {
        "medianSqmPriceYen": 787000,
        "sampleCount": 21
      },
      "age_41_plus": {
        "medianSqmPriceYen": 505000,
        "sampleCount": 11
      }
    },
    "buildingYearSampleCount": 76,
    "structureCounts": {
      "ＳＲＣ": 31,
      "ＲＣ": 45
    },
    "sampleCount": 77,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市鶴見区",
    "layout": "ldk2",
    "medianTradePriceYen": 25000000,
    "medianSqmPriceYen": 433000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 278000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 16,
    "structureCounts": {
      "ＲＣ": 7,
      "ＳＲＣ": 9
    },
    "sampleCount": 16,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市鶴見区",
    "layout": "ldk3",
    "medianTradePriceYen": 38000000,
    "medianSqmPriceYen": 494000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 612000,
        "sampleCount": 11
      },
      "age_21_30": {
        "medianSqmPriceYen": 486000,
        "sampleCount": 9
      },
      "age_31_40": {
        "medianSqmPriceYen": 455000,
        "sampleCount": 12
      },
      "age_41_plus": {
        "medianSqmPriceYen": 414000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 40,
    "structureCounts": {
      "ＳＲＣ、ＲＣ": 2,
      "ＲＣ": 25,
      "ＳＲＣ": 14
    },
    "sampleCount": 41,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市天王寺區",
    "layout": "k1",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 950000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 955000,
        "sampleCount": 52
      },
      "age_11_20": {
        "medianSqmPriceYen": 935000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 66,
    "structureCounts": {
      "ＲＣ": 65,
      "ＳＲＣ": 2
    },
    "sampleCount": 70,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市天王寺區",
    "layout": "ldk1",
    "medianTradePriceYen": 23000000,
    "medianSqmPriceYen": 550000,
    "medianAreaSqm": 45,
    "ageBands": {},
    "buildingYearSampleCount": 15,
    "structureCounts": {
      "ＳＲＣ": 4,
      "ＲＣ": 11
    },
    "sampleCount": 15,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市天王寺區",
    "layout": "ldk2",
    "medianTradePriceYen": 35000000,
    "medianSqmPriceYen": 636000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1223000,
        "sampleCount": 8
      },
      "age_11_20": {
        "medianSqmPriceYen": 941000,
        "sampleCount": 8
      },
      "age_21_30": {
        "medianSqmPriceYen": 620000,
        "sampleCount": 10
      },
      "age_31_40": {
        "medianSqmPriceYen": 470000,
        "sampleCount": 10
      },
      "age_41_plus": {
        "medianSqmPriceYen": 537000,
        "sampleCount": 12
      }
    },
    "buildingYearSampleCount": 48,
    "structureCounts": {
      "ＳＲＣ": 18,
      "ＲＣ": 29
    },
    "sampleCount": 49,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市天王寺區",
    "layout": "ldk3",
    "medianTradePriceYen": 65000000,
    "medianSqmPriceYen": 867000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1118000,
        "sampleCount": 10
      },
      "age_11_20": {
        "medianSqmPriceYen": 971000,
        "sampleCount": 25
      },
      "age_21_30": {
        "medianSqmPriceYen": 677000,
        "sampleCount": 8
      },
      "age_31_40": {
        "medianSqmPriceYen": 566000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 53,
    "structureCounts": {
      "ＲＣ": 42,
      "ＳＲＣ": 11
    },
    "sampleCount": 55,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市都島區",
    "layout": "k1",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 950000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1000000,
        "sampleCount": 72
      },
      "age_11_20": {
        "medianSqmPriceYen": 825000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 87,
    "structureCounts": {
      "ＲＣ": 83,
      "ＳＲＣ": 4
    },
    "sampleCount": 87,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市都島區",
    "layout": "ldk1",
    "medianTradePriceYen": 28500000,
    "medianSqmPriceYen": 656000,
    "medianAreaSqm": 45,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 711000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 12,
    "structureCounts": {
      "ＲＣ": 12
    },
    "sampleCount": 12,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市都島區",
    "layout": "ldk2",
    "medianTradePriceYen": 29500000,
    "medianSqmPriceYen": 457000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 533000,
        "sampleCount": 6
      },
      "age_41_plus": {
        "medianSqmPriceYen": 300000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 26,
    "structureCounts": {
      "ＳＲＣ": 13,
      "ＲＣ": 12,
      "ＳＲＣ、ＲＣ": 1
    },
    "sampleCount": 26,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市都島區",
    "layout": "ldk3",
    "medianTradePriceYen": 40000000,
    "medianSqmPriceYen": 521000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 800000,
        "sampleCount": 5
      },
      "age_11_20": {
        "medianSqmPriceYen": 718000,
        "sampleCount": 11
      },
      "age_21_30": {
        "medianSqmPriceYen": 611000,
        "sampleCount": 17
      },
      "age_31_40": {
        "medianSqmPriceYen": 466000,
        "sampleCount": 20
      },
      "age_41_plus": {
        "medianSqmPriceYen": 277000,
        "sampleCount": 21
      }
    },
    "buildingYearSampleCount": 74,
    "structureCounts": {
      "ＳＲＣ": 38,
      "ＲＣ": 36
    },
    "sampleCount": 74,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市東住吉区",
    "layout": "k1",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 1050000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1050000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市東住吉区",
    "layout": "ldk1",
    "medianTradePriceYen": 14000000,
    "medianSqmPriceYen": 289000,
    "medianAreaSqm": 45,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 3,
      "ＳＲＣ": 1,
      "鉄骨造": 1
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市東住吉区",
    "layout": "ldk2",
    "medianTradePriceYen": 24000000,
    "medianSqmPriceYen": 400000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 400000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 358000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 19,
    "structureCounts": {
      "ＲＣ": 14,
      "ＳＲＣ": 2
    },
    "sampleCount": 22,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市東住吉区",
    "layout": "ldk3",
    "medianTradePriceYen": 33000000,
    "medianSqmPriceYen": 446000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 400000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 400000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 15,
    "structureCounts": {
      "ＲＣ": 9,
      "ＳＲＣ": 4
    },
    "sampleCount": 15,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市東成区",
    "layout": "k1",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 950000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 950000,
        "sampleCount": 82
      },
      "age_11_20": {
        "medianSqmPriceYen": 800000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 88,
    "structureCounts": {
      "ＲＣ": 87,
      "ＳＲＣ": 1
    },
    "sampleCount": 88,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市東成区",
    "layout": "ldk1",
    "medianTradePriceYen": 30000000,
    "medianSqmPriceYen": 1000000,
    "medianAreaSqm": 30,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1000000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＲＣ": 9
    },
    "sampleCount": 9,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市東成区",
    "layout": "ldk2",
    "medianTradePriceYen": 22000000,
    "medianSqmPriceYen": 400000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 263000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 15,
    "structureCounts": {
      "ＲＣ": 8,
      "ＳＲＣ": 6,
      "ＳＲＣ、ＲＣ": 1
    },
    "sampleCount": 15,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市東成区",
    "layout": "ldk3",
    "medianTradePriceYen": 38000000,
    "medianSqmPriceYen": 543000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 547000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＲＣ": 6,
      "ＳＲＣ": 3
    },
    "sampleCount": 9,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市東淀川区",
    "layout": "k1",
    "medianTradePriceYen": 18000000,
    "medianSqmPriceYen": 850000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 950000,
        "sampleCount": 46
      },
      "age_11_20": {
        "medianSqmPriceYen": 800000,
        "sampleCount": 16
      },
      "age_41_plus": {
        "medianSqmPriceYen": 283000,
        "sampleCount": 14
      }
    },
    "buildingYearSampleCount": 79,
    "structureCounts": {
      "ＲＣ": 66,
      "ＳＲＣ、ＲＣ": 4,
      "ＳＲＣ": 8,
      "ＳＲＣ、鉄骨造": 2
    },
    "sampleCount": 80,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市東淀川区",
    "layout": "ldk1",
    "medianTradePriceYen": 26000000,
    "medianSqmPriceYen": 867000,
    "medianAreaSqm": 30,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 983000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＲＣ": 11,
      "ＳＲＣ、ＲＣ": 2
    },
    "sampleCount": 13,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市東淀川区",
    "layout": "ldk2",
    "medianTradePriceYen": 16500000,
    "medianSqmPriceYen": 306000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 222000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 18,
    "structureCounts": {
      "ＲＣ": 9,
      "ＳＲＣ": 6,
      "ＳＲＣ、鉄骨造": 2,
      "ＳＲＣ、ＲＣ": 1
    },
    "sampleCount": 18,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市東淀川区",
    "layout": "ldk3",
    "medianTradePriceYen": 26000000,
    "medianSqmPriceYen": 385000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 257000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 18,
    "structureCounts": {
      "ＳＲＣ": 4,
      "ＲＣ": 11,
      "ＳＲＣ、鉄骨造": 4
    },
    "sampleCount": 19,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市東淀川区",
    "layout": "r1",
    "medianTradePriceYen": 6300000,
    "medianSqmPriceYen": 367000,
    "medianAreaSqm": 15,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 367000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＳＲＣ": 6
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市福島區",
    "layout": "k1",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 950000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1000000,
        "sampleCount": 55
      },
      "age_11_20": {
        "medianSqmPriceYen": 800000,
        "sampleCount": 27
      }
    },
    "buildingYearSampleCount": 86,
    "structureCounts": {
      "ＲＣ": 81,
      "ＳＲＣ": 4,
      "鉄骨造": 1
    },
    "sampleCount": 86,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市福島區",
    "layout": "ldk1",
    "medianTradePriceYen": 27000000,
    "medianSqmPriceYen": 714000,
    "medianAreaSqm": 45,
    "ageBands": {},
    "buildingYearSampleCount": 12,
    "structureCounts": {
      "ＲＣ": 9,
      "ＳＲＣ": 3
    },
    "sampleCount": 12,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市福島區",
    "layout": "ldk2",
    "medianTradePriceYen": 41000000,
    "medianSqmPriceYen": 667000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 992000,
        "sampleCount": 6
      },
      "age_11_20": {
        "medianSqmPriceYen": 1130000,
        "sampleCount": 10
      },
      "age_21_30": {
        "medianSqmPriceYen": 627000,
        "sampleCount": 11
      },
      "age_31_40": {
        "medianSqmPriceYen": 534000,
        "sampleCount": 6
      },
      "age_41_plus": {
        "medianSqmPriceYen": 415000,
        "sampleCount": 12
      }
    },
    "buildingYearSampleCount": 45,
    "structureCounts": {
      "ＳＲＣ": 25,
      "ＲＣ": 20
    },
    "sampleCount": 45,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市福島區",
    "layout": "ldk3",
    "medianTradePriceYen": 65000000,
    "medianSqmPriceYen": 900000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1100000,
        "sampleCount": 11
      },
      "age_11_20": {
        "medianSqmPriceYen": 954000,
        "sampleCount": 17
      },
      "age_21_30": {
        "medianSqmPriceYen": 758000,
        "sampleCount": 12
      }
    },
    "buildingYearSampleCount": 45,
    "structureCounts": {
      "ＳＲＣ": 12,
      "ＲＣ": 33
    },
    "sampleCount": 45,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市福島區",
    "layout": "r1",
    "medianTradePriceYen": 7300000,
    "medianSqmPriceYen": 430000,
    "medianAreaSqm": 18,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "鉄骨造": 2,
      "ＲＣ": 3,
      "ＳＲＣ": 1
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市平野区",
    "layout": "ldk1",
    "medianTradePriceYen": 9300000,
    "medianSqmPriceYen": 231000,
    "medianAreaSqm": 40,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 6
    },
    "sampleCount": 8,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市平野区",
    "layout": "ldk2",
    "medianTradePriceYen": 19000000,
    "medianSqmPriceYen": 354000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 226000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 23,
    "structureCounts": {
      "ＲＣ": 8,
      "ＳＲＣ": 10,
      "ＳＲＣ、ＲＣ": 2
    },
    "sampleCount": 23,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市平野区",
    "layout": "ldk3",
    "medianTradePriceYen": 26000000,
    "medianSqmPriceYen": 369000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 429000,
        "sampleCount": 12
      }
    },
    "buildingYearSampleCount": 23,
    "structureCounts": {
      "ＳＲＣ": 7,
      "ＲＣ": 13
    },
    "sampleCount": 23,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市北區",
    "layout": "k1",
    "medianTradePriceYen": 19000000,
    "medianSqmPriceYen": 900000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1000000,
        "sampleCount": 45
      },
      "age_11_20": {
        "medianSqmPriceYen": 900000,
        "sampleCount": 44
      },
      "age_21_30": {
        "medianSqmPriceYen": 800000,
        "sampleCount": 24
      },
      "age_41_plus": {
        "medianSqmPriceYen": 543000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 121,
    "structureCounts": {
      "ＲＣ": 106,
      "ＳＲＣ": 15,
      "ＳＲＣ、ＲＣ": 1
    },
    "sampleCount": 122,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市北區",
    "layout": "ldk1",
    "medianTradePriceYen": 30000000,
    "medianSqmPriceYen": 746000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1217000,
        "sampleCount": 10
      },
      "age_11_20": {
        "medianSqmPriceYen": 850000,
        "sampleCount": 14
      },
      "age_41_plus": {
        "medianSqmPriceYen": 367000,
        "sampleCount": 13
      }
    },
    "buildingYearSampleCount": 43,
    "structureCounts": {
      "ＳＲＣ、ＲＣ": 6,
      "ＲＣ": 28,
      "ＳＲＣ": 8,
      "ＳＲＣ、鉄骨造": 1,
      "ＲＣ、鉄骨造": 1
    },
    "sampleCount": 44,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市北區",
    "layout": "ldk2",
    "medianTradePriceYen": 48000000,
    "medianSqmPriceYen": 815000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1427000,
        "sampleCount": 20
      },
      "age_11_20": {
        "medianSqmPriceYen": 1000000,
        "sampleCount": 18
      },
      "age_21_30": {
        "medianSqmPriceYen": 675000,
        "sampleCount": 20
      },
      "age_41_plus": {
        "medianSqmPriceYen": 416000,
        "sampleCount": 18
      }
    },
    "buildingYearSampleCount": 79,
    "structureCounts": {
      "ＳＲＣ": 26,
      "ＳＲＣ、ＲＣ": 5,
      "ＲＣ": 46,
      "ＲＣ、鉄骨造": 1,
      "鉄骨造": 1
    },
    "sampleCount": 79,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市北區",
    "layout": "ldk3",
    "medianTradePriceYen": 67000000,
    "medianSqmPriceYen": 830000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1882000,
        "sampleCount": 14
      },
      "age_11_20": {
        "medianSqmPriceYen": 1188000,
        "sampleCount": 12
      },
      "age_21_30": {
        "medianSqmPriceYen": 771000,
        "sampleCount": 11
      },
      "age_31_40": {
        "medianSqmPriceYen": 643000,
        "sampleCount": 5
      },
      "age_41_plus": {
        "medianSqmPriceYen": 538000,
        "sampleCount": 17
      }
    },
    "buildingYearSampleCount": 59,
    "structureCounts": {
      "ＲＣ": 34,
      "ＳＲＣ": 21,
      "ＳＲＣ、ＲＣ": 1,
      "ＳＲＣ、鉄骨造": 1,
      "ＲＣ、鉄骨造": 2
    },
    "sampleCount": 59,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市淀川區",
    "layout": "k1",
    "medianTradePriceYen": 17000000,
    "medianSqmPriceYen": 800000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 850000,
        "sampleCount": 96
      },
      "age_11_20": {
        "medianSqmPriceYen": 800000,
        "sampleCount": 48
      },
      "age_21_30": {
        "medianSqmPriceYen": 733000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 263000,
        "sampleCount": 8
      },
      "age_41_plus": {
        "medianSqmPriceYen": 261000,
        "sampleCount": 28
      }
    },
    "buildingYearSampleCount": 185,
    "structureCounts": {
      "ＲＣ": 151,
      "ＳＲＣ": 34
    },
    "sampleCount": 185,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市淀川區",
    "layout": "ldk1",
    "medianTradePriceYen": 15000000,
    "medianSqmPriceYen": 378000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 943000,
        "sampleCount": 9
      },
      "age_11_20": {
        "medianSqmPriceYen": 753000,
        "sampleCount": 6
      },
      "age_41_plus": {
        "medianSqmPriceYen": 275000,
        "sampleCount": 21
      }
    },
    "buildingYearSampleCount": 39,
    "structureCounts": {
      "ＲＣ": 26,
      "ＳＲＣ": 12,
      "鉄骨造": 1
    },
    "sampleCount": 39,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市淀川區",
    "layout": "ldk2",
    "medianTradePriceYen": 22000000,
    "medianSqmPriceYen": 383000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 750000,
        "sampleCount": 7
      },
      "age_11_20": {
        "medianSqmPriceYen": 629000,
        "sampleCount": 12
      },
      "age_21_30": {
        "medianSqmPriceYen": 499000,
        "sampleCount": 10
      },
      "age_31_40": {
        "medianSqmPriceYen": 391000,
        "sampleCount": 18
      },
      "age_41_plus": {
        "medianSqmPriceYen": 277000,
        "sampleCount": 42
      }
    },
    "buildingYearSampleCount": 89,
    "structureCounts": {
      "ＲＣ": 33,
      "ＳＲＣ": 56
    },
    "sampleCount": 89,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市淀川區",
    "layout": "ldk3",
    "medianTradePriceYen": 35000000,
    "medianSqmPriceYen": 463000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 677000,
        "sampleCount": 7
      },
      "age_11_20": {
        "medianSqmPriceYen": 609000,
        "sampleCount": 14
      },
      "age_21_30": {
        "medianSqmPriceYen": 500000,
        "sampleCount": 19
      },
      "age_31_40": {
        "medianSqmPriceYen": 388000,
        "sampleCount": 13
      },
      "age_41_plus": {
        "medianSqmPriceYen": 339000,
        "sampleCount": 27
      }
    },
    "buildingYearSampleCount": 80,
    "structureCounts": {
      "ＳＲＣ": 47,
      "ＲＣ": 35
    },
    "sampleCount": 82,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市淀川區",
    "layout": "r1",
    "medianTradePriceYen": 6200000,
    "medianSqmPriceYen": 363000,
    "medianAreaSqm": 15,
    "ageBands": {},
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "鉄骨造": 2,
      "ＳＲＣ": 3,
      "ＲＣ": 5
    },
    "sampleCount": 10,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市浪速區",
    "layout": "k1",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 950000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1000000,
        "sampleCount": 161
      },
      "age_11_20": {
        "medianSqmPriceYen": 850000,
        "sampleCount": 61
      },
      "age_21_30": {
        "medianSqmPriceYen": 680000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 230,
    "structureCounts": {
      "ＲＣ": 225,
      "鉄骨造": 1,
      "ＳＲＣ": 7
    },
    "sampleCount": 233,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市浪速區",
    "layout": "ldk1",
    "medianTradePriceYen": 30000000,
    "medianSqmPriceYen": 850000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 854000,
        "sampleCount": 10
      },
      "age_11_20": {
        "medianSqmPriceYen": 893000,
        "sampleCount": 12
      }
    },
    "buildingYearSampleCount": 25,
    "structureCounts": {
      "ＲＣ": 23,
      "ＳＲＣ": 2
    },
    "sampleCount": 25,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市浪速區",
    "layout": "ldk2",
    "medianTradePriceYen": 47000000,
    "medianSqmPriceYen": 783000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 15,
    "structureCounts": {
      "ＲＣ": 11,
      "ＳＲＣ": 4
    },
    "sampleCount": 15,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大阪市浪速區",
    "layout": "ldk3",
    "medianTradePriceYen": 84500000,
    "medianSqmPriceYen": 940000,
    "medianAreaSqm": 85,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 1
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大東市",
    "layout": "ldk2",
    "medianTradePriceYen": 16500000,
    "medianSqmPriceYen": 269000,
    "medianAreaSqm": 60,
    "ageBands": {},
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＲＣ": 7,
      "ＳＲＣ": 1
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "大東市",
    "layout": "ldk3",
    "medianTradePriceYen": 24000000,
    "medianSqmPriceYen": 343000,
    "medianAreaSqm": 75,
    "ageBands": {},
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＲＣ": 8,
      "ＳＲＣ": 3
    },
    "sampleCount": 11,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "池田市",
    "layout": "ldk2",
    "medianTradePriceYen": 17500000,
    "medianSqmPriceYen": 306000,
    "medianAreaSqm": 63,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 6
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "池田市",
    "layout": "ldk3",
    "medianTradePriceYen": 28000000,
    "medianSqmPriceYen": 385000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 594000,
        "sampleCount": 6
      },
      "age_21_30": {
        "medianSqmPriceYen": 413000,
        "sampleCount": 8
      },
      "age_31_40": {
        "medianSqmPriceYen": 122000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 32,
    "structureCounts": {
      "ＲＣ": 30,
      "ＳＲＣ": 3
    },
    "sampleCount": 33,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "東大阪市",
    "layout": "k1",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 980000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1000000,
        "sampleCount": 37
      }
    },
    "buildingYearSampleCount": 38,
    "structureCounts": {
      "ＲＣ": 37
    },
    "sampleCount": 38,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "東大阪市",
    "layout": "ldk1",
    "medianTradePriceYen": 18500000,
    "medianSqmPriceYen": 463000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 829000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＲＣ": 8,
      "ＳＲＣ": 2
    },
    "sampleCount": 10,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "東大阪市",
    "layout": "ldk2",
    "medianTradePriceYen": 17500000,
    "medianSqmPriceYen": 296000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 388000,
        "sampleCount": 6
      },
      "age_21_30": {
        "medianSqmPriceYen": 328000,
        "sampleCount": 10
      },
      "age_31_40": {
        "medianSqmPriceYen": 192000,
        "sampleCount": 12
      },
      "age_41_plus": {
        "medianSqmPriceYen": 192000,
        "sampleCount": 16
      }
    },
    "buildingYearSampleCount": 48,
    "structureCounts": {
      "ＳＲＣ": 24,
      "ＲＣ": 24
    },
    "sampleCount": 48,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "東大阪市",
    "layout": "ldk3",
    "medianTradePriceYen": 25000000,
    "medianSqmPriceYen": 338000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 623000,
        "sampleCount": 6
      },
      "age_11_20": {
        "medianSqmPriceYen": 427000,
        "sampleCount": 11
      },
      "age_21_30": {
        "medianSqmPriceYen": 371000,
        "sampleCount": 24
      },
      "age_31_40": {
        "medianSqmPriceYen": 200000,
        "sampleCount": 11
      },
      "age_41_plus": {
        "medianSqmPriceYen": 185000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 61,
    "structureCounts": {
      "ＲＣ": 41,
      "ＳＲＣ": 20
    },
    "sampleCount": 61,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "藤井寺市",
    "layout": "ldk2",
    "medianTradePriceYen": 22500000,
    "medianSqmPriceYen": 388000,
    "medianAreaSqm": 55,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 6
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "藤井寺市",
    "layout": "ldk3",
    "medianTradePriceYen": 38000000,
    "medianSqmPriceYen": 525000,
    "medianAreaSqm": 75,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 1
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "柏原市",
    "layout": "ldk3",
    "medianTradePriceYen": 15500000,
    "medianSqmPriceYen": 211000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 3,
      "ＳＲＣ、ＲＣ": 1
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "八尾市",
    "layout": "ldk1",
    "medianTradePriceYen": 6900000,
    "medianSqmPriceYen": 146000,
    "medianAreaSqm": 45,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 136000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 2
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q4",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "八尾市",
    "layout": "ldk2",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 350000,
    "medianAreaSqm": 65,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 448000,
        "sampleCount": 6
      },
      "age_41_plus": {
        "medianSqmPriceYen": 93000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 19,
    "structureCounts": {
      "ＳＲＣ": 7,
      "ＲＣ": 12
    },
    "sampleCount": 19,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "八尾市",
    "layout": "ldk3",
    "medianTradePriceYen": 32000000,
    "medianSqmPriceYen": 419000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 680000,
        "sampleCount": 5
      },
      "age_11_20": {
        "medianSqmPriceYen": 629000,
        "sampleCount": 9
      },
      "age_21_30": {
        "medianSqmPriceYen": 356000,
        "sampleCount": 8
      },
      "age_31_40": {
        "medianSqmPriceYen": 253000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 32,
    "structureCounts": {
      "ＲＣ": 22,
      "ＳＲＣ": 10
    },
    "sampleCount": 32,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "富田林市",
    "layout": "ldk2",
    "medianTradePriceYen": 11500000,
    "medianSqmPriceYen": 178000,
    "medianAreaSqm": 60,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 4
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "富田林市",
    "layout": "ldk3",
    "medianTradePriceYen": 12500000,
    "medianSqmPriceYen": 153000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 154000,
        "sampleCount": 7
      },
      "age_31_40": {
        "medianSqmPriceYen": 153000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 16,
    "structureCounts": {
      "ＲＣ": 15,
      "ＳＲＣ": 2
    },
    "sampleCount": 18,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "枚方市",
    "layout": "ldk1",
    "medianTradePriceYen": 6500000,
    "medianSqmPriceYen": 130000,
    "medianAreaSqm": 45,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 1
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "枚方市",
    "layout": "ldk2",
    "medianTradePriceYen": 15000000,
    "medianSqmPriceYen": 231000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 317000,
        "sampleCount": 9
      },
      "age_41_plus": {
        "medianSqmPriceYen": 98000,
        "sampleCount": 13
      }
    },
    "buildingYearSampleCount": 25,
    "structureCounts": {
      "ＲＣ": 23,
      "ＳＲＣ": 2
    },
    "sampleCount": 25,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "枚方市",
    "layout": "ldk3",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 293000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 415000,
        "sampleCount": 19
      },
      "age_21_30": {
        "medianSqmPriceYen": 329000,
        "sampleCount": 47
      },
      "age_31_40": {
        "medianSqmPriceYen": 232000,
        "sampleCount": 9
      },
      "age_41_plus": {
        "medianSqmPriceYen": 131000,
        "sampleCount": 29
      }
    },
    "buildingYearSampleCount": 108,
    "structureCounts": {
      "ＲＣ": 91,
      "ＳＲＣ": 18
    },
    "sampleCount": 109,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "箕面市",
    "layout": "ldk2",
    "medianTradePriceYen": 5000000,
    "medianSqmPriceYen": 95000,
    "medianAreaSqm": 50,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 95000,
        "sampleCount": 14
      }
    },
    "buildingYearSampleCount": 14,
    "structureCounts": {
      "ＲＣ": 14
    },
    "sampleCount": 14,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "箕面市",
    "layout": "ldk3",
    "medianTradePriceYen": 33000000,
    "medianSqmPriceYen": 400000,
    "medianAreaSqm": 85,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 493000,
        "sampleCount": 11
      },
      "age_21_30": {
        "medianSqmPriceYen": 420000,
        "sampleCount": 7
      },
      "age_31_40": {
        "medianSqmPriceYen": 281000,
        "sampleCount": 8
      },
      "age_41_plus": {
        "medianSqmPriceYen": 400000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 37,
    "structureCounts": {
      "ＲＣ": 34,
      "ＳＲＣ": 3
    },
    "sampleCount": 37,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "門真市",
    "layout": "ldk2",
    "medianTradePriceYen": 20500000,
    "medianSqmPriceYen": 315000,
    "medianAreaSqm": 63,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 1
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "門真市",
    "layout": "ldk3",
    "medianTradePriceYen": 22000000,
    "medianSqmPriceYen": 338000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 7
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "和泉市",
    "layout": "ldk1",
    "medianTradePriceYen": 3000000,
    "medianSqmPriceYen": 67000,
    "medianAreaSqm": 40,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 1,
      "ＳＲＣ": 4
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "和泉市",
    "layout": "ldk2",
    "medianTradePriceYen": 14000000,
    "medianSqmPriceYen": 215000,
    "medianAreaSqm": 65,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 265000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 15,
    "structureCounts": {
      "ＲＣ": 9,
      "ＳＲＣ": 6
    },
    "sampleCount": 15,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "和泉市",
    "layout": "ldk3",
    "medianTradePriceYen": 15000000,
    "medianSqmPriceYen": 215000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 338000,
        "sampleCount": 8
      },
      "age_21_30": {
        "medianSqmPriceYen": 221000,
        "sampleCount": 26
      },
      "age_31_40": {
        "medianSqmPriceYen": 151000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 47,
    "structureCounts": {
      "ＲＣ": 27,
      "ＳＲＣ": 23
    },
    "sampleCount": 51,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "豐中市",
    "layout": "k1",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 1000000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1000000,
        "sampleCount": 15
      }
    },
    "buildingYearSampleCount": 19,
    "structureCounts": {
      "ＲＣ": 17,
      "ＳＲＣ": 2
    },
    "sampleCount": 19,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "豐中市",
    "layout": "ldk1",
    "medianTradePriceYen": 9200000,
    "medianSqmPriceYen": 193000,
    "medianAreaSqm": 45,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 186000,
        "sampleCount": 12
      }
    },
    "buildingYearSampleCount": 14,
    "structureCounts": {
      "鉄骨造": 2,
      "ＲＣ": 10,
      "ＳＲＣ": 2
    },
    "sampleCount": 14,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "豐中市",
    "layout": "ldk2",
    "medianTradePriceYen": 23000000,
    "medianSqmPriceYen": 374000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 882000,
        "sampleCount": 6
      },
      "age_21_30": {
        "medianSqmPriceYen": 436000,
        "sampleCount": 15
      },
      "age_31_40": {
        "medianSqmPriceYen": 329000,
        "sampleCount": 9
      },
      "age_41_plus": {
        "medianSqmPriceYen": 292000,
        "sampleCount": 17
      }
    },
    "buildingYearSampleCount": 50,
    "structureCounts": {
      "ＲＣ": 39,
      "ＳＲＣ": 10,
      "鉄骨造": 1
    },
    "sampleCount": 50,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大阪",
    "district": "豐中市",
    "layout": "ldk3",
    "medianTradePriceYen": 34000000,
    "medianSqmPriceYen": 443000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 713000,
        "sampleCount": 16
      },
      "age_11_20": {
        "medianSqmPriceYen": 714000,
        "sampleCount": 47
      },
      "age_21_30": {
        "medianSqmPriceYen": 452000,
        "sampleCount": 64
      },
      "age_31_40": {
        "medianSqmPriceYen": 354000,
        "sampleCount": 20
      },
      "age_41_plus": {
        "medianSqmPriceYen": 277000,
        "sampleCount": 55
      }
    },
    "buildingYearSampleCount": 202,
    "structureCounts": {
      "ＲＣ": 157,
      "ＳＲＣ": 44
    },
    "sampleCount": 203,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大分",
    "district": "大分市",
    "layout": "k1",
    "medianTradePriceYen": 1800000,
    "medianSqmPriceYen": 85000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 85000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＲＣ": 7,
      "ＳＲＣ": 3
    },
    "sampleCount": 11,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大分",
    "district": "大分市",
    "layout": "ldk1",
    "medianTradePriceYen": 3500000,
    "medianSqmPriceYen": 100000,
    "medianAreaSqm": 35,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 7,
      "ＳＲＣ": 1
    },
    "sampleCount": 9,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大分",
    "district": "大分市",
    "layout": "ldk2",
    "medianTradePriceYen": 18500000,
    "medianSqmPriceYen": 267000,
    "medianAreaSqm": 68,
    "ageBands": {},
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 6
    },
    "sampleCount": 10,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大分",
    "district": "大分市",
    "layout": "ldk3",
    "medianTradePriceYen": 19500000,
    "medianSqmPriceYen": 235000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 475000,
        "sampleCount": 11
      },
      "age_11_20": {
        "medianSqmPriceYen": 322000,
        "sampleCount": 19
      },
      "age_21_30": {
        "medianSqmPriceYen": 167000,
        "sampleCount": 21
      },
      "age_31_40": {
        "medianSqmPriceYen": 181000,
        "sampleCount": 14
      }
    },
    "buildingYearSampleCount": 69,
    "structureCounts": {
      "ＳＲＣ": 24,
      "ＲＣ": 46,
      "鉄骨造": 1
    },
    "sampleCount": 74,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大分",
    "district": "別府市",
    "layout": "k1",
    "medianTradePriceYen": 4400000,
    "medianSqmPriceYen": 138000,
    "medianAreaSqm": 30,
    "ageBands": {},
    "buildingYearSampleCount": 1,
    "structureCounts": {
      "ＲＣ": 2,
      "ＳＲＣ": 4
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大分",
    "district": "別府市",
    "layout": "ldk1",
    "medianTradePriceYen": 5800000,
    "medianSqmPriceYen": 153000,
    "medianAreaSqm": 38,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 1,
      "ＳＲＣ": 4
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2025-Q1",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大分",
    "district": "別府市",
    "layout": "ldk2",
    "medianTradePriceYen": 4900000,
    "medianSqmPriceYen": 89000,
    "medianAreaSqm": 55,
    "ageBands": {},
    "buildingYearSampleCount": 4,
    "structureCounts": {
      "ＳＲＣ": 3,
      "ＲＣ": 1
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "大分",
    "district": "別府市",
    "layout": "ldk3",
    "medianTradePriceYen": 27000000,
    "medianSqmPriceYen": 372000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 406000,
        "sampleCount": 10
      },
      "age_21_30": {
        "medianSqmPriceYen": 213000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 22,
    "structureCounts": {
      "ＲＣ": 15,
      "ＳＲＣ": 7
    },
    "sampleCount": 22,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "長崎",
    "district": "佐世保市",
    "layout": "ldk2",
    "medianTradePriceYen": 24000000,
    "medianSqmPriceYen": 369000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 3,
      "ＲＣ": 2
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "長崎",
    "district": "佐世保市",
    "layout": "ldk3",
    "medianTradePriceYen": 24000000,
    "medianSqmPriceYen": 275000,
    "medianAreaSqm": 83,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 356000,
        "sampleCount": 5
      },
      "age_21_30": {
        "medianSqmPriceYen": 241000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＳＲＣ": 6,
      "ＲＣ": 6
    },
    "sampleCount": 18,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "長崎",
    "district": "長崎市",
    "layout": "k1",
    "medianTradePriceYen": 4500000,
    "medianSqmPriceYen": 225000,
    "medianAreaSqm": 20,
    "ageBands": {},
    "buildingYearSampleCount": 4,
    "structureCounts": {
      "ＲＣ": 1,
      "ＳＲＣ": 3
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2025-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "長崎",
    "district": "長崎市",
    "layout": "ldk1",
    "medianTradePriceYen": 26000000,
    "medianSqmPriceYen": 650000,
    "medianAreaSqm": 40,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＳＲＣ": 1,
      "ＲＣ": 7
    },
    "sampleCount": 11,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "長崎",
    "district": "長崎市",
    "layout": "ldk2",
    "medianTradePriceYen": 25500000,
    "medianSqmPriceYen": 464000,
    "medianAreaSqm": 60,
    "ageBands": {},
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＲＣ": 10,
      "ＳＲＣ": 4
    },
    "sampleCount": 16,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "長崎",
    "district": "長崎市",
    "layout": "ldk3",
    "medianTradePriceYen": 28000000,
    "medianSqmPriceYen": 372000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 427000,
        "sampleCount": 13
      },
      "age_21_30": {
        "medianSqmPriceYen": 256000,
        "sampleCount": 21
      },
      "age_31_40": {
        "medianSqmPriceYen": 240000,
        "sampleCount": 11
      }
    },
    "buildingYearSampleCount": 50,
    "structureCounts": {
      "ＳＲＣ": 25,
      "ＲＣ": 36
    },
    "sampleCount": 78,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "長崎",
    "district": "諫早市",
    "layout": "ldk3",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 224000,
    "medianAreaSqm": 85,
    "ageBands": {},
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 3
    },
    "sampleCount": 10,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "長野",
    "district": "佐久市",
    "layout": "ldk3",
    "medianTradePriceYen": 30000000,
    "medianSqmPriceYen": 400000,
    "medianAreaSqm": 75,
    "ageBands": {},
    "buildingYearSampleCount": 2,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2025-Q1",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "長野",
    "district": "松本市",
    "layout": "ldk2",
    "medianTradePriceYen": 30000000,
    "medianSqmPriceYen": 427000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 4,
    "structureCounts": {
      "ＲＣ": 3,
      "ＳＲＣ": 2
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "長野",
    "district": "松本市",
    "layout": "ldk3",
    "medianTradePriceYen": 27000000,
    "medianSqmPriceYen": 388000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 554000,
        "sampleCount": 8
      },
      "age_11_20": {
        "medianSqmPriceYen": 413000,
        "sampleCount": 5
      },
      "age_21_30": {
        "medianSqmPriceYen": 338000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 243000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 23,
    "structureCounts": {
      "ＳＲＣ": 5,
      "ＲＣ": 20
    },
    "sampleCount": 25,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "長野",
    "district": "上田市",
    "layout": "ldk3",
    "medianTradePriceYen": 24000000,
    "medianSqmPriceYen": 343000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 360000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＲＣ": 8,
      "ＳＲＣ": 1
    },
    "sampleCount": 11,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "長野",
    "district": "長野市",
    "layout": "k1",
    "medianTradePriceYen": 2800000,
    "medianSqmPriceYen": 140000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 140000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 4,
      "ＲＣ": 1
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "長野",
    "district": "長野市",
    "layout": "ldk1",
    "medianTradePriceYen": 8500000,
    "medianSqmPriceYen": 213000,
    "medianAreaSqm": 40,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "鉄骨造": 1,
      "ＲＣ": 2,
      "ＳＲＣ": 2
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "長野",
    "district": "長野市",
    "layout": "ldk2",
    "medianTradePriceYen": 20500000,
    "medianSqmPriceYen": 354000,
    "medianAreaSqm": 60,
    "ageBands": {},
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＲＣ": 3,
      "ＳＲＣ": 4
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "長野",
    "district": "長野市",
    "layout": "ldk3",
    "medianTradePriceYen": 24000000,
    "medianSqmPriceYen": 323000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 400000,
        "sampleCount": 7
      },
      "age_21_30": {
        "medianSqmPriceYen": 308000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 23,
    "structureCounts": {
      "ＳＲＣ": 7,
      "ＲＣ": 14
    },
    "sampleCount": 23,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "鳥取",
    "district": "鳥取市",
    "layout": "ldk2",
    "medianTradePriceYen": 22500000,
    "medianSqmPriceYen": 360000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 1,
      "ＲＣ": 4
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "鳥取",
    "district": "鳥取市",
    "layout": "ldk3",
    "medianTradePriceYen": 17500000,
    "medianSqmPriceYen": 236000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 227000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＲＣ": 7,
      "ＳＲＣ": 3
    },
    "sampleCount": 10,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "鳥取",
    "district": "米子市",
    "layout": "ldk2",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 306000,
    "medianAreaSqm": 68,
    "ageBands": {},
    "buildingYearSampleCount": 3,
    "structureCounts": {
      "ＲＣ": 3
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "鳥取",
    "district": "米子市",
    "layout": "ldk3",
    "medianTradePriceYen": 18500000,
    "medianSqmPriceYen": 245000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 529000,
        "sampleCount": 5
      },
      "age_21_30": {
        "medianSqmPriceYen": 193000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 12,
    "structureCounts": {
      "ＲＣ": 11,
      "ＳＲＣ": 2
    },
    "sampleCount": 14,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "島根",
    "district": "出雲市",
    "layout": "ldk3",
    "medianTradePriceYen": 29000000,
    "medianSqmPriceYen": 343000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 1
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "島根",
    "district": "松江市",
    "layout": "ldk2",
    "medianTradePriceYen": 18000000,
    "medianSqmPriceYen": 257000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 7
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "島根",
    "district": "松江市",
    "layout": "ldk3",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 271000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 400000,
        "sampleCount": 7
      },
      "age_21_30": {
        "medianSqmPriceYen": 240000,
        "sampleCount": 13
      }
    },
    "buildingYearSampleCount": 25,
    "structureCounts": {
      "ＲＣ": 21,
      "ＳＲＣ": 4
    },
    "sampleCount": 25,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "稲城市",
    "layout": "ldk1",
    "medianTradePriceYen": 29000000,
    "medianSqmPriceYen": 580000,
    "medianAreaSqm": 40,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 4,
      "鉄骨造": 1
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "稲城市",
    "layout": "ldk2",
    "medianTradePriceYen": 19000000,
    "medianSqmPriceYen": 292000,
    "medianAreaSqm": 50,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 292000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 12,
    "structureCounts": {
      "ＳＲＣ": 3,
      "ＲＣ": 9
    },
    "sampleCount": 13,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "稲城市",
    "layout": "ldk3",
    "medianTradePriceYen": 45000000,
    "medianSqmPriceYen": 571000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 514000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 15,
    "structureCounts": {
      "ＲＣ": 12,
      "ＳＲＣ": 3
    },
    "sampleCount": 15,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "羽村市",
    "layout": "ldk2",
    "medianTradePriceYen": 11500000,
    "medianSqmPriceYen": 220000,
    "medianAreaSqm": 55,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 1
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "羽村市",
    "layout": "ldk3",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 277000,
    "medianAreaSqm": 75,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 6
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "葛飾區",
    "layout": "k1",
    "medianTradePriceYen": 27000000,
    "medianSqmPriceYen": 1245000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1360000,
        "sampleCount": 81
      },
      "age_11_20": {
        "medianSqmPriceYen": 900000,
        "sampleCount": 6
      },
      "age_31_40": {
        "medianSqmPriceYen": 495000,
        "sampleCount": 15
      }
    },
    "buildingYearSampleCount": 105,
    "structureCounts": {
      "ＲＣ": 98,
      "ＳＲＣ": 6,
      "鉄骨造": 1
    },
    "sampleCount": 110,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "葛飾區",
    "layout": "ldk1",
    "medianTradePriceYen": 22000000,
    "medianSqmPriceYen": 525000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 578000,
        "sampleCount": 13
      },
      "age_41_plus": {
        "medianSqmPriceYen": 375000,
        "sampleCount": 13
      }
    },
    "buildingYearSampleCount": 28,
    "structureCounts": {
      "ＳＲＣ": 11,
      "ＲＣ": 17
    },
    "sampleCount": 29,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "葛飾區",
    "layout": "ldk2",
    "medianTradePriceYen": 30000000,
    "medianSqmPriceYen": 600000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 827000,
        "sampleCount": 6
      },
      "age_11_20": {
        "medianSqmPriceYen": 831000,
        "sampleCount": 7
      },
      "age_21_30": {
        "medianSqmPriceYen": 685000,
        "sampleCount": 14
      },
      "age_31_40": {
        "medianSqmPriceYen": 506000,
        "sampleCount": 14
      },
      "age_41_plus": {
        "medianSqmPriceYen": 450000,
        "sampleCount": 13
      }
    },
    "buildingYearSampleCount": 54,
    "structureCounts": {
      "ＲＣ": 41,
      "ＳＲＣ": 15
    },
    "sampleCount": 57,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "葛飾區",
    "layout": "ldk3",
    "medianTradePriceYen": 50000000,
    "medianSqmPriceYen": 714000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1000000,
        "sampleCount": 17
      },
      "age_11_20": {
        "medianSqmPriceYen": 787000,
        "sampleCount": 26
      },
      "age_21_30": {
        "medianSqmPriceYen": 643000,
        "sampleCount": 17
      },
      "age_31_40": {
        "medianSqmPriceYen": 533000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 69,
    "structureCounts": {
      "ＲＣ": 63,
      "ＳＲＣ": 7
    },
    "sampleCount": 71,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "葛飾區",
    "layout": "r1",
    "medianTradePriceYen": 6900000,
    "medianSqmPriceYen": 460000,
    "medianAreaSqm": 15,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 460000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "江東區",
    "layout": "k1",
    "medianTradePriceYen": 29000000,
    "medianSqmPriceYen": 1200000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1280000,
        "sampleCount": 177
      },
      "age_11_20": {
        "medianSqmPriceYen": 1200000,
        "sampleCount": 177
      },
      "age_21_30": {
        "medianSqmPriceYen": 1225000,
        "sampleCount": 6
      },
      "age_31_40": {
        "medianSqmPriceYen": 790000,
        "sampleCount": 10
      },
      "age_41_plus": {
        "medianSqmPriceYen": 550000,
        "sampleCount": 14
      }
    },
    "buildingYearSampleCount": 384,
    "structureCounts": {
      "ＲＣ": 356,
      "ＳＲＣ": 29
    },
    "sampleCount": 385,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "江東區",
    "layout": "ldk1",
    "medianTradePriceYen": 44000000,
    "medianSqmPriceYen": 1114000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 2025000,
        "sampleCount": 13
      },
      "age_11_20": {
        "medianSqmPriceYen": 1567000,
        "sampleCount": 18
      },
      "age_21_30": {
        "medianSqmPriceYen": 1293000,
        "sampleCount": 8
      },
      "age_31_40": {
        "medianSqmPriceYen": 978000,
        "sampleCount": 9
      },
      "age_41_plus": {
        "medianSqmPriceYen": 650000,
        "sampleCount": 17
      }
    },
    "buildingYearSampleCount": 65,
    "structureCounts": {
      "ＲＣ": 40,
      "ＳＲＣ": 24,
      "鉄骨造": 1
    },
    "sampleCount": 65,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "江東區",
    "layout": "ldk2",
    "medianTradePriceYen": 65000000,
    "medianSqmPriceYen": 1083000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 2000000,
        "sampleCount": 23
      },
      "age_11_20": {
        "medianSqmPriceYen": 1700000,
        "sampleCount": 50
      },
      "age_21_30": {
        "medianSqmPriceYen": 1083000,
        "sampleCount": 43
      },
      "age_31_40": {
        "medianSqmPriceYen": 802000,
        "sampleCount": 10
      },
      "age_41_plus": {
        "medianSqmPriceYen": 676000,
        "sampleCount": 50
      }
    },
    "buildingYearSampleCount": 176,
    "structureCounts": {
      "ＳＲＣ": 74,
      "ＲＣ": 98,
      "ＳＲＣ、ＲＣ": 1,
      "鉄骨造": 3
    },
    "sampleCount": 176,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "江東區",
    "layout": "ldk3",
    "medianTradePriceYen": 86000000,
    "medianSqmPriceYen": 1154000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1714000,
        "sampleCount": 32
      },
      "age_11_20": {
        "medianSqmPriceYen": 1500000,
        "sampleCount": 80
      },
      "age_21_30": {
        "medianSqmPriceYen": 1058000,
        "sampleCount": 74
      },
      "age_31_40": {
        "medianSqmPriceYen": 856000,
        "sampleCount": 21
      },
      "age_41_plus": {
        "medianSqmPriceYen": 700000,
        "sampleCount": 33
      }
    },
    "buildingYearSampleCount": 240,
    "structureCounts": {
      "ＲＣ": 149,
      "ＳＲＣ": 91,
      "鉄骨造": 1
    },
    "sampleCount": 241,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "江東區",
    "layout": "r1",
    "medianTradePriceYen": 9600000,
    "medianSqmPriceYen": 545000,
    "medianAreaSqm": 15,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 733000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 4
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "江戶川區",
    "layout": "k1",
    "medianTradePriceYen": 19000000,
    "medianSqmPriceYen": 760000,
    "medianAreaSqm": 25,
    "ageBands": {},
    "buildingYearSampleCount": 14,
    "structureCounts": {
      "ＳＲＣ": 8,
      "ＲＣ": 7
    },
    "sampleCount": 15,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "江戶川區",
    "layout": "ldk1",
    "medianTradePriceYen": 32000000,
    "medianSqmPriceYen": 800000,
    "medianAreaSqm": 45,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1072000,
        "sampleCount": 6
      },
      "age_41_plus": {
        "medianSqmPriceYen": 333000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 14,
    "structureCounts": {
      "ＳＲＣ": 7,
      "ＲＣ": 7
    },
    "sampleCount": 15,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "江戶川區",
    "layout": "ldk2",
    "medianTradePriceYen": 40000000,
    "medianSqmPriceYen": 704000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 960000,
        "sampleCount": 7
      },
      "age_11_20": {
        "medianSqmPriceYen": 835000,
        "sampleCount": 12
      },
      "age_21_30": {
        "medianSqmPriceYen": 800000,
        "sampleCount": 19
      },
      "age_31_40": {
        "medianSqmPriceYen": 636000,
        "sampleCount": 8
      },
      "age_41_plus": {
        "medianSqmPriceYen": 582000,
        "sampleCount": 20
      }
    },
    "buildingYearSampleCount": 66,
    "structureCounts": {
      "ＳＲＣ": 31,
      "ＲＣ": 35
    },
    "sampleCount": 66,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "江戶川區",
    "layout": "ldk3",
    "medianTradePriceYen": 50000000,
    "medianSqmPriceYen": 729000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 986000,
        "sampleCount": 33
      },
      "age_11_20": {
        "medianSqmPriceYen": 771000,
        "sampleCount": 32
      },
      "age_21_30": {
        "medianSqmPriceYen": 671000,
        "sampleCount": 75
      },
      "age_31_40": {
        "medianSqmPriceYen": 631000,
        "sampleCount": 17
      },
      "age_41_plus": {
        "medianSqmPriceYen": 600000,
        "sampleCount": 15
      }
    },
    "buildingYearSampleCount": 172,
    "structureCounts": {
      "ＲＣ": 105,
      "ＳＲＣ": 63,
      "ＲＣ、鉄骨造": 1,
      "ＳＲＣ、ＲＣ": 3
    },
    "sampleCount": 174,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "港區",
    "layout": "k1",
    "medianTradePriceYen": 34000000,
    "medianSqmPriceYen": 1560000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1800000,
        "sampleCount": 32
      },
      "age_11_20": {
        "medianSqmPriceYen": 1580000,
        "sampleCount": 40
      },
      "age_21_30": {
        "medianSqmPriceYen": 1500000,
        "sampleCount": 59
      },
      "age_41_plus": {
        "medianSqmPriceYen": 1130000,
        "sampleCount": 24
      }
    },
    "buildingYearSampleCount": 155,
    "structureCounts": {
      "ＲＣ": 102,
      "ＳＲＣ": 54
    },
    "sampleCount": 157,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "港區",
    "layout": "ldk1",
    "medianTradePriceYen": 81000000,
    "medianSqmPriceYen": 1949000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 2889000,
        "sampleCount": 13
      },
      "age_11_20": {
        "medianSqmPriceYen": 2400000,
        "sampleCount": 28
      },
      "age_21_30": {
        "medianSqmPriceYen": 1975000,
        "sampleCount": 25
      },
      "age_41_plus": {
        "medianSqmPriceYen": 1380000,
        "sampleCount": 27
      }
    },
    "buildingYearSampleCount": 94,
    "structureCounts": {
      "ＲＣ": 60,
      "ＳＲＣ": 35
    },
    "sampleCount": 96,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "港區",
    "layout": "ldk2",
    "medianTradePriceYen": 155000000,
    "medianSqmPriceYen": 2545000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 3636000,
        "sampleCount": 28
      },
      "age_11_20": {
        "medianSqmPriceYen": 2573000,
        "sampleCount": 42
      },
      "age_21_30": {
        "medianSqmPriceYen": 2000000,
        "sampleCount": 29
      },
      "age_41_plus": {
        "medianSqmPriceYen": 1467000,
        "sampleCount": 13
      }
    },
    "buildingYearSampleCount": 112,
    "structureCounts": {
      "ＲＣ": 85,
      "ＳＲＣ": 24,
      "鉄骨造": 3
    },
    "sampleCount": 112,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "港區",
    "layout": "ldk3",
    "medianTradePriceYen": 250000000,
    "medianSqmPriceYen": 3000000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 4182000,
        "sampleCount": 21
      },
      "age_11_20": {
        "medianSqmPriceYen": 2778000,
        "sampleCount": 28
      },
      "age_21_30": {
        "medianSqmPriceYen": 3143000,
        "sampleCount": 15
      },
      "age_41_plus": {
        "medianSqmPriceYen": 1571000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 76,
    "structureCounts": {
      "ＲＣ": 59,
      "ＳＲＣ": 17,
      "鉄骨造": 1
    },
    "sampleCount": 77,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "港區",
    "layout": "r1",
    "medianTradePriceYen": 19500000,
    "medianSqmPriceYen": 1275000,
    "medianAreaSqm": 15,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 1000000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＳＲＣ": 6,
      "ＲＣ": 4
    },
    "sampleCount": 10,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "荒川區",
    "layout": "k1",
    "medianTradePriceYen": 26000000,
    "medianSqmPriceYen": 1065000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1200000,
        "sampleCount": 20
      },
      "age_11_20": {
        "medianSqmPriceYen": 1000000,
        "sampleCount": 22
      }
    },
    "buildingYearSampleCount": 52,
    "structureCounts": {
      "ＲＣ": 47,
      "ＳＲＣ": 5
    },
    "sampleCount": 52,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "荒川區",
    "layout": "ldk1",
    "medianTradePriceYen": 34000000,
    "medianSqmPriceYen": 770000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 1040000,
        "sampleCount": 7
      },
      "age_41_plus": {
        "medianSqmPriceYen": 470000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 24,
    "structureCounts": {
      "ＲＣ": 16,
      "ＳＲＣ": 8
    },
    "sampleCount": 24,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "荒川區",
    "layout": "ldk2",
    "medianTradePriceYen": 51000000,
    "medianSqmPriceYen": 960000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1082000,
        "sampleCount": 22
      },
      "age_11_20": {
        "medianSqmPriceYen": 1073000,
        "sampleCount": 17
      },
      "age_21_30": {
        "medianSqmPriceYen": 799000,
        "sampleCount": 16
      },
      "age_31_40": {
        "medianSqmPriceYen": 740000,
        "sampleCount": 5
      },
      "age_41_plus": {
        "medianSqmPriceYen": 523000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 68,
    "structureCounts": {
      "ＲＣ": 47,
      "ＳＲＣ": 21
    },
    "sampleCount": 69,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "荒川區",
    "layout": "ldk3",
    "medianTradePriceYen": 63500000,
    "medianSqmPriceYen": 806000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1218000,
        "sampleCount": 8
      },
      "age_11_20": {
        "medianSqmPriceYen": 877000,
        "sampleCount": 18
      },
      "age_21_30": {
        "medianSqmPriceYen": 766000,
        "sampleCount": 24
      },
      "age_31_40": {
        "medianSqmPriceYen": 789000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 61,
    "structureCounts": {
      "ＲＣ": 33,
      "ＳＲＣ": 27,
      "ＲＣ、鉄骨造": 1
    },
    "sampleCount": 62,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "国分寺市",
    "layout": "k1",
    "medianTradePriceYen": 22500000,
    "medianSqmPriceYen": 995000,
    "medianAreaSqm": 25,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 6
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "国分寺市",
    "layout": "ldk1",
    "medianTradePriceYen": 28000000,
    "medianSqmPriceYen": 622000,
    "medianAreaSqm": 45,
    "ageBands": {},
    "buildingYearSampleCount": 3,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 1
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "国分寺市",
    "layout": "ldk2",
    "medianTradePriceYen": 45000000,
    "medianSqmPriceYen": 883000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 983000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＲＣ": 10,
      "ＲＣ、鉄骨造": 3
    },
    "sampleCount": 13,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "国分寺市",
    "layout": "ldk3",
    "medianTradePriceYen": 59000000,
    "medianSqmPriceYen": 845000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1043000,
        "sampleCount": 10
      },
      "age_11_20": {
        "medianSqmPriceYen": 823000,
        "sampleCount": 8
      },
      "age_21_30": {
        "medianSqmPriceYen": 843000,
        "sampleCount": 12
      }
    },
    "buildingYearSampleCount": 36,
    "structureCounts": {
      "ＲＣ": 33,
      "ＳＲＣ": 5
    },
    "sampleCount": 38,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "国立市",
    "layout": "ldk1",
    "medianTradePriceYen": 28000000,
    "medianSqmPriceYen": 700000,
    "medianAreaSqm": 45,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 6
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "国立市",
    "layout": "ldk2",
    "medianTradePriceYen": 42500000,
    "medianSqmPriceYen": 765000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 850000,
        "sampleCount": 5
      },
      "age_21_30": {
        "medianSqmPriceYen": 805000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 16,
    "structureCounts": {
      "ＲＣ": 14,
      "ＳＲＣ": 2
    },
    "sampleCount": 16,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "国立市",
    "layout": "ldk3",
    "medianTradePriceYen": 49000000,
    "medianSqmPriceYen": 653000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 724000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＲＣ": 11,
      "ＳＲＣ": 2
    },
    "sampleCount": 13,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "狛江市",
    "layout": "k1",
    "medianTradePriceYen": 23500000,
    "medianSqmPriceYen": 1125000,
    "medianAreaSqm": 23,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 6
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "狛江市",
    "layout": "ldk1",
    "medianTradePriceYen": 28000000,
    "medianSqmPriceYen": 733000,
    "medianAreaSqm": 35,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "鉄骨造": 2,
      "ＲＣ": 3,
      "ＳＲＣ": 1
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "狛江市",
    "layout": "ldk2",
    "medianTradePriceYen": 25500000,
    "medianSqmPriceYen": 506000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 477000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＳＲＣ": 4,
      "ＲＣ": 5,
      "鉄骨造": 3
    },
    "sampleCount": 12,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "狛江市",
    "layout": "ldk3",
    "medianTradePriceYen": 54000000,
    "medianSqmPriceYen": 802000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 729000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 754000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 17,
    "structureCounts": {
      "ＳＲＣ": 6,
      "ＲＣ": 8
    },
    "sampleCount": 18,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "三鷹市",
    "layout": "k1",
    "medianTradePriceYen": 30000000,
    "medianSqmPriceYen": 1300000,
    "medianAreaSqm": 30,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 1,
      "鉄骨造": 1
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "三鷹市",
    "layout": "ldk1",
    "medianTradePriceYen": 51500000,
    "medianSqmPriceYen": 1400000,
    "medianAreaSqm": 33,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1400000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＲＣ": 9
    },
    "sampleCount": 10,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "三鷹市",
    "layout": "ldk2",
    "medianTradePriceYen": 55000000,
    "medianSqmPriceYen": 1000000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 1123000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＲＣ": 13,
      "ＳＲＣ": 4
    },
    "sampleCount": 17,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "三鷹市",
    "layout": "ldk3",
    "medianTradePriceYen": 64000000,
    "medianSqmPriceYen": 857000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1243000,
        "sampleCount": 5
      },
      "age_11_20": {
        "medianSqmPriceYen": 846000,
        "sampleCount": 9
      },
      "age_21_30": {
        "medianSqmPriceYen": 846000,
        "sampleCount": 11
      }
    },
    "buildingYearSampleCount": 27,
    "structureCounts": {
      "ＲＣ": 21,
      "ＳＲＣ": 5
    },
    "sampleCount": 29,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "小金井市",
    "layout": "k1",
    "medianTradePriceYen": 21500000,
    "medianSqmPriceYen": 946000,
    "medianAreaSqm": 25,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 6
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "小金井市",
    "layout": "ldk1",
    "medianTradePriceYen": 13000000,
    "medianSqmPriceYen": 371000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 357000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 4,
      "鉄骨造": 1
    },
    "sampleCount": 9,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "小金井市",
    "layout": "ldk2",
    "medianTradePriceYen": 50000000,
    "medianSqmPriceYen": 917000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 917000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＳＲＣ": 4,
      "ＲＣ": 7
    },
    "sampleCount": 11,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "小金井市",
    "layout": "ldk3",
    "medianTradePriceYen": 68000000,
    "medianSqmPriceYen": 971000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 971000,
        "sampleCount": 5
      },
      "age_21_30": {
        "medianSqmPriceYen": 1062000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 15,
    "structureCounts": {
      "ＲＣ": 12,
      "ＳＲＣ": 3
    },
    "sampleCount": 15,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "小平市",
    "layout": "ldk2",
    "medianTradePriceYen": 29000000,
    "medianSqmPriceYen": 522000,
    "medianAreaSqm": 55,
    "ageBands": {},
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＲＣ": 8,
      "鉄骨造": 1
    },
    "sampleCount": 10,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "小平市",
    "layout": "ldk3",
    "medianTradePriceYen": 39000000,
    "medianSqmPriceYen": 533000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 785000,
        "sampleCount": 6
      },
      "age_11_20": {
        "medianSqmPriceYen": 563000,
        "sampleCount": 14
      },
      "age_21_30": {
        "medianSqmPriceYen": 497000,
        "sampleCount": 10
      },
      "age_31_40": {
        "medianSqmPriceYen": 445000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 38,
    "structureCounts": {
      "ＲＣ": 29,
      "ＳＲＣ": 8
    },
    "sampleCount": 39,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "昭島市",
    "layout": "ldk2",
    "medianTradePriceYen": 29000000,
    "medianSqmPriceYen": 615000,
    "medianAreaSqm": 50,
    "ageBands": {},
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＲＣ": 8,
      "ＳＲＣ": 1
    },
    "sampleCount": 9,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "昭島市",
    "layout": "ldk3",
    "medianTradePriceYen": 32000000,
    "medianSqmPriceYen": 421000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 600000,
        "sampleCount": 7
      },
      "age_11_20": {
        "medianSqmPriceYen": 466000,
        "sampleCount": 6
      },
      "age_21_30": {
        "medianSqmPriceYen": 421000,
        "sampleCount": 12
      },
      "age_41_plus": {
        "medianSqmPriceYen": 243000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 36,
    "structureCounts": {
      "ＳＲＣ": 17,
      "ＲＣ": 17
    },
    "sampleCount": 38,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "新宿區",
    "layout": "k1",
    "medianTradePriceYen": 29000000,
    "medianSqmPriceYen": 1320000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1720000,
        "sampleCount": 54
      },
      "age_11_20": {
        "medianSqmPriceYen": 1320000,
        "sampleCount": 109
      },
      "age_21_30": {
        "medianSqmPriceYen": 1250000,
        "sampleCount": 81
      },
      "age_31_40": {
        "medianSqmPriceYen": 942000,
        "sampleCount": 12
      },
      "age_41_plus": {
        "medianSqmPriceYen": 1054000,
        "sampleCount": 26
      }
    },
    "buildingYearSampleCount": 282,
    "structureCounts": {
      "ＲＣ": 214,
      "ＳＲＣ": 71
    },
    "sampleCount": 297,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "新宿區",
    "layout": "ldk1",
    "medianTradePriceYen": 58000000,
    "medianSqmPriceYen": 1500000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 2029000,
        "sampleCount": 33
      },
      "age_11_20": {
        "medianSqmPriceYen": 1650000,
        "sampleCount": 37
      },
      "age_21_30": {
        "medianSqmPriceYen": 1413000,
        "sampleCount": 26
      },
      "age_31_40": {
        "medianSqmPriceYen": 1343000,
        "sampleCount": 7
      },
      "age_41_plus": {
        "medianSqmPriceYen": 989000,
        "sampleCount": 28
      }
    },
    "buildingYearSampleCount": 131,
    "structureCounts": {
      "ＲＣ": 94,
      "ＳＲＣ": 39
    },
    "sampleCount": 135,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "新宿區",
    "layout": "ldk2",
    "medianTradePriceYen": 93000000,
    "medianSqmPriceYen": 1652000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 2182000,
        "sampleCount": 20
      },
      "age_11_20": {
        "medianSqmPriceYen": 2000000,
        "sampleCount": 23
      },
      "age_21_30": {
        "medianSqmPriceYen": 1520000,
        "sampleCount": 33
      },
      "age_31_40": {
        "medianSqmPriceYen": 1250000,
        "sampleCount": 9
      },
      "age_41_plus": {
        "medianSqmPriceYen": 1039000,
        "sampleCount": 24
      }
    },
    "buildingYearSampleCount": 109,
    "structureCounts": {
      "ＲＣ": 75,
      "ＳＲＣ": 37
    },
    "sampleCount": 116,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "新宿區",
    "layout": "ldk3",
    "medianTradePriceYen": 150000000,
    "medianSqmPriceYen": 2000000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 2615000,
        "sampleCount": 25
      },
      "age_11_20": {
        "medianSqmPriceYen": 2148000,
        "sampleCount": 8
      },
      "age_21_30": {
        "medianSqmPriceYen": 1571000,
        "sampleCount": 21
      }
    },
    "buildingYearSampleCount": 59,
    "structureCounts": {
      "ＲＣ": 53,
      "ＳＲＣ": 6
    },
    "sampleCount": 67,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "新宿區",
    "layout": "r1",
    "medianTradePriceYen": 14000000,
    "medianSqmPriceYen": 933000,
    "medianAreaSqm": 15,
    "ageBands": {},
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＳＲＣ": 8,
      "ＲＣ": 1
    },
    "sampleCount": 9,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "杉並區",
    "layout": "k1",
    "medianTradePriceYen": 25000000,
    "medianSqmPriceYen": 1100000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1355000,
        "sampleCount": 24
      },
      "age_11_20": {
        "medianSqmPriceYen": 1150000,
        "sampleCount": 60
      },
      "age_21_30": {
        "medianSqmPriceYen": 1050000,
        "sampleCount": 45
      },
      "age_31_40": {
        "medianSqmPriceYen": 920000,
        "sampleCount": 11
      },
      "age_41_plus": {
        "medianSqmPriceYen": 629000,
        "sampleCount": 15
      }
    },
    "buildingYearSampleCount": 155,
    "structureCounts": {
      "ＲＣ": 133,
      "ＳＲＣ": 21,
      "ＲＣ、鉄骨造": 1
    },
    "sampleCount": 155,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "杉並區",
    "layout": "ldk1",
    "medianTradePriceYen": 39000000,
    "medianSqmPriceYen": 1057000,
    "medianAreaSqm": 35,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1648000,
        "sampleCount": 14
      },
      "age_11_20": {
        "medianSqmPriceYen": 1075000,
        "sampleCount": 19
      },
      "age_21_30": {
        "medianSqmPriceYen": 1000000,
        "sampleCount": 19
      },
      "age_31_40": {
        "medianSqmPriceYen": 1040000,
        "sampleCount": 11
      },
      "age_41_plus": {
        "medianSqmPriceYen": 841000,
        "sampleCount": 20
      }
    },
    "buildingYearSampleCount": 83,
    "structureCounts": {
      "ＲＣ": 62,
      "ＳＲＣ": 19,
      "ＳＲＣ、ＲＣ": 1,
      "鉄骨造": 1
    },
    "sampleCount": 83,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "杉並區",
    "layout": "ldk2",
    "medianTradePriceYen": 68000000,
    "medianSqmPriceYen": 1182000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1600000,
        "sampleCount": 13
      },
      "age_11_20": {
        "medianSqmPriceYen": 1273000,
        "sampleCount": 13
      },
      "age_21_30": {
        "medianSqmPriceYen": 1173000,
        "sampleCount": 24
      },
      "age_31_40": {
        "medianSqmPriceYen": 1180000,
        "sampleCount": 12
      },
      "age_41_plus": {
        "medianSqmPriceYen": 760000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 71,
    "structureCounts": {
      "軽量鉄骨造": 2,
      "ＲＣ": 59,
      "ＳＲＣ": 9,
      "鉄骨造": 1
    },
    "sampleCount": 71,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "杉並區",
    "layout": "ldk3",
    "medianTradePriceYen": 80000000,
    "medianSqmPriceYen": 1129000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1441000,
        "sampleCount": 18
      },
      "age_11_20": {
        "medianSqmPriceYen": 1141000,
        "sampleCount": 20
      },
      "age_21_30": {
        "medianSqmPriceYen": 1088000,
        "sampleCount": 36
      },
      "age_31_40": {
        "medianSqmPriceYen": 919000,
        "sampleCount": 6
      },
      "age_41_plus": {
        "medianSqmPriceYen": 667000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 85,
    "structureCounts": {
      "ＲＣ": 79,
      "ＳＲＣ": 5,
      "ＲＣ、鉄骨造": 1,
      "鉄骨造": 1,
      "軽量鉄骨造": 1
    },
    "sampleCount": 87,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "杉並區",
    "layout": "r1",
    "medianTradePriceYen": 10000000,
    "medianSqmPriceYen": 667000,
    "medianAreaSqm": 15,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 633000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＲＣ": 11
    },
    "sampleCount": 11,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "世田谷區",
    "layout": "k1",
    "medianTradePriceYen": 29000000,
    "medianSqmPriceYen": 1200000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1440000,
        "sampleCount": 41
      },
      "age_11_20": {
        "medianSqmPriceYen": 1200000,
        "sampleCount": 46
      },
      "age_21_30": {
        "medianSqmPriceYen": 1100000,
        "sampleCount": 26
      },
      "age_31_40": {
        "medianSqmPriceYen": 833000,
        "sampleCount": 5
      },
      "age_41_plus": {
        "medianSqmPriceYen": 911000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 124,
    "structureCounts": {
      "ＲＣ": 112,
      "ＳＲＣ": 13
    },
    "sampleCount": 126,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "世田谷區",
    "layout": "ldk1",
    "medianTradePriceYen": 42000000,
    "medianSqmPriceYen": 989000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1946000,
        "sampleCount": 6
      },
      "age_11_20": {
        "medianSqmPriceYen": 1361000,
        "sampleCount": 12
      },
      "age_21_30": {
        "medianSqmPriceYen": 1325000,
        "sampleCount": 18
      },
      "age_31_40": {
        "medianSqmPriceYen": 900000,
        "sampleCount": 11
      },
      "age_41_plus": {
        "medianSqmPriceYen": 767000,
        "sampleCount": 33
      }
    },
    "buildingYearSampleCount": 80,
    "structureCounts": {
      "ＲＣ": 57,
      "ＳＲＣ": 20,
      "鉄骨造": 3
    },
    "sampleCount": 80,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "世田谷區",
    "layout": "ldk2",
    "medianTradePriceYen": 67000000,
    "medianSqmPriceYen": 1200000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1929000,
        "sampleCount": 14
      },
      "age_11_20": {
        "medianSqmPriceYen": 1461000,
        "sampleCount": 28
      },
      "age_21_30": {
        "medianSqmPriceYen": 1218000,
        "sampleCount": 33
      },
      "age_31_40": {
        "medianSqmPriceYen": 1145000,
        "sampleCount": 11
      },
      "age_41_plus": {
        "medianSqmPriceYen": 820000,
        "sampleCount": 33
      }
    },
    "buildingYearSampleCount": 119,
    "structureCounts": {
      "ＲＣ": 94,
      "ＳＲＣ": 25,
      "鉄骨造": 1
    },
    "sampleCount": 121,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "世田谷區",
    "layout": "ldk3",
    "medianTradePriceYen": 93000000,
    "medianSqmPriceYen": 1227000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1429000,
        "sampleCount": 37
      },
      "age_11_20": {
        "medianSqmPriceYen": 1205000,
        "sampleCount": 48
      },
      "age_21_30": {
        "medianSqmPriceYen": 1141000,
        "sampleCount": 45
      },
      "age_31_40": {
        "medianSqmPriceYen": 878000,
        "sampleCount": 13
      },
      "age_41_plus": {
        "medianSqmPriceYen": 978000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 150,
    "structureCounts": {
      "ＲＣ": 139,
      "ＳＲＣ": 9,
      "軽量鉄骨造": 2,
      "ＲＣ、鉄骨造": 1
    },
    "sampleCount": 153,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "世田谷區",
    "layout": "r1",
    "medianTradePriceYen": 12500000,
    "medianSqmPriceYen": 800000,
    "medianAreaSqm": 15,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 733000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 2
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "清瀬市",
    "layout": "ldk2",
    "medianTradePriceYen": 30000000,
    "medianSqmPriceYen": 545000,
    "medianAreaSqm": 55,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 3,
      "ＳＲＣ": 2
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "清瀬市",
    "layout": "ldk3",
    "medianTradePriceYen": 42000000,
    "medianSqmPriceYen": 571000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 3,
      "ＳＲＣ": 1
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "西東京市",
    "layout": "k1",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 840000,
    "medianAreaSqm": 25,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 5
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "西東京市",
    "layout": "ldk1",
    "medianTradePriceYen": 16000000,
    "medianSqmPriceYen": 400000,
    "medianAreaSqm": 40,
    "ageBands": {},
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＲＣ": 6,
      "ＳＲＣ": 1,
      "鉄骨造": 1
    },
    "sampleCount": 9,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "西東京市",
    "layout": "ldk2",
    "medianTradePriceYen": 35500000,
    "medianSqmPriceYen": 609000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 677000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 17,
    "structureCounts": {
      "ＲＣ": 10,
      "ＳＲＣ": 6
    },
    "sampleCount": 20,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "西東京市",
    "layout": "ldk3",
    "medianTradePriceYen": 45000000,
    "medianSqmPriceYen": 615000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 708000,
        "sampleCount": 10
      },
      "age_11_20": {
        "medianSqmPriceYen": 640000,
        "sampleCount": 13
      },
      "age_21_30": {
        "medianSqmPriceYen": 659000,
        "sampleCount": 18
      },
      "age_41_plus": {
        "medianSqmPriceYen": 268000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 51,
    "structureCounts": {
      "ＲＣ": 41,
      "ＳＲＣ": 8,
      "ＳＲＣ、ＲＣ": 3
    },
    "sampleCount": 55,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "青梅市",
    "layout": "ldk1",
    "medianTradePriceYen": 5800000,
    "medianSqmPriceYen": 145000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 167000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 6,
      "ＳＲＣ": 2
    },
    "sampleCount": 9,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "青梅市",
    "layout": "ldk2",
    "medianTradePriceYen": 11000000,
    "medianSqmPriceYen": 200000,
    "medianAreaSqm": 53,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 288000,
        "sampleCount": 6
      },
      "age_31_40": {
        "medianSqmPriceYen": 186000,
        "sampleCount": 17
      }
    },
    "buildingYearSampleCount": 26,
    "structureCounts": {
      "ＲＣ": 21,
      "ＳＲＣ": 4,
      "鉄骨造": 1
    },
    "sampleCount": 26,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "青梅市",
    "layout": "ldk3",
    "medianTradePriceYen": 20500000,
    "medianSqmPriceYen": 287000,
    "medianAreaSqm": 65,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 282000,
        "sampleCount": 5
      },
      "age_21_30": {
        "medianSqmPriceYen": 292000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 12,
    "structureCounts": {
      "ＲＣ": 11,
      "ＳＲＣ": 1
    },
    "sampleCount": 12,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "千代田區",
    "layout": "k1",
    "medianTradePriceYen": 33000000,
    "medianSqmPriceYen": 1400000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 2057000,
        "sampleCount": 6
      },
      "age_11_20": {
        "medianSqmPriceYen": 1400000,
        "sampleCount": 31
      },
      "age_21_30": {
        "medianSqmPriceYen": 1417000,
        "sampleCount": 30
      },
      "age_41_plus": {
        "medianSqmPriceYen": 1220000,
        "sampleCount": 12
      }
    },
    "buildingYearSampleCount": 80,
    "structureCounts": {
      "ＲＣ": 45,
      "ＳＲＣ": 36
    },
    "sampleCount": 85,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "千代田區",
    "layout": "ldk1",
    "medianTradePriceYen": 70000000,
    "medianSqmPriceYen": 1886000,
    "medianAreaSqm": 35,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 2300000,
        "sampleCount": 7
      },
      "age_11_20": {
        "medianSqmPriceYen": 1857000,
        "sampleCount": 19
      },
      "age_21_30": {
        "medianSqmPriceYen": 1968000,
        "sampleCount": 8
      },
      "age_41_plus": {
        "medianSqmPriceYen": 1629000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 40,
    "structureCounts": {
      "ＲＣ": 31,
      "ＳＲＣ": 9
    },
    "sampleCount": 43,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "千代田區",
    "layout": "ldk2",
    "medianTradePriceYen": 150000000,
    "medianSqmPriceYen": 2600000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 2600000,
        "sampleCount": 5
      },
      "age_11_20": {
        "medianSqmPriceYen": 3833000,
        "sampleCount": 6
      },
      "age_21_30": {
        "medianSqmPriceYen": 2718000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 24,
    "structureCounts": {
      "ＳＲＣ": 9,
      "ＲＣ": 15
    },
    "sampleCount": 25,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "千代田區",
    "layout": "ldk3",
    "medianTradePriceYen": 270000000,
    "medianSqmPriceYen": 3273000,
    "medianAreaSqm": 85,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 3536000,
        "sampleCount": 12
      }
    },
    "buildingYearSampleCount": 20,
    "structureCounts": {
      "ＲＣ": 16,
      "ＳＲＣ": 4,
      "鉄骨造": 1
    },
    "sampleCount": 23,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "千代田區",
    "layout": "r1",
    "medianTradePriceYen": 17000000,
    "medianSqmPriceYen": 1133000,
    "medianAreaSqm": 15,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 1133000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＳＲＣ": 6,
      "ＲＣ": 1
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "足立區",
    "layout": "k1",
    "medianTradePriceYen": 26000000,
    "medianSqmPriceYen": 1150000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1200000,
        "sampleCount": 94
      },
      "age_11_20": {
        "medianSqmPriceYen": 1150000,
        "sampleCount": 17
      },
      "age_31_40": {
        "medianSqmPriceYen": 343000,
        "sampleCount": 12
      }
    },
    "buildingYearSampleCount": 127,
    "structureCounts": {
      "ＲＣ": 121,
      "鉄骨造": 1,
      "ＳＲＣ": 4
    },
    "sampleCount": 127,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "足立區",
    "layout": "ldk1",
    "medianTradePriceYen": 29000000,
    "medianSqmPriceYen": 720000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 886000,
        "sampleCount": 21
      },
      "age_31_40": {
        "medianSqmPriceYen": 523000,
        "sampleCount": 6
      },
      "age_41_plus": {
        "medianSqmPriceYen": 325000,
        "sampleCount": 13
      }
    },
    "buildingYearSampleCount": 45,
    "structureCounts": {
      "ＲＣ": 32,
      "ＳＲＣ": 12,
      "ＳＲＣ、ＲＣ": 1
    },
    "sampleCount": 45,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "足立區",
    "layout": "ldk2",
    "medianTradePriceYen": 28000000,
    "medianSqmPriceYen": 492000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 870000,
        "sampleCount": 12
      },
      "age_11_20": {
        "medianSqmPriceYen": 675000,
        "sampleCount": 12
      },
      "age_21_30": {
        "medianSqmPriceYen": 513000,
        "sampleCount": 30
      },
      "age_31_40": {
        "medianSqmPriceYen": 463000,
        "sampleCount": 26
      },
      "age_41_plus": {
        "medianSqmPriceYen": 325000,
        "sampleCount": 22
      }
    },
    "buildingYearSampleCount": 102,
    "structureCounts": {
      "ＳＲＣ": 28,
      "ＲＣ": 72,
      "鉄骨造": 1,
      "ＳＲＣ、ＲＣ": 1
    },
    "sampleCount": 102,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "足立區",
    "layout": "ldk3",
    "medianTradePriceYen": 44000000,
    "medianSqmPriceYen": 614000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 873000,
        "sampleCount": 18
      },
      "age_11_20": {
        "medianSqmPriceYen": 737000,
        "sampleCount": 49
      },
      "age_21_30": {
        "medianSqmPriceYen": 582000,
        "sampleCount": 52
      },
      "age_31_40": {
        "medianSqmPriceYen": 414000,
        "sampleCount": 14
      },
      "age_41_plus": {
        "medianSqmPriceYen": 338000,
        "sampleCount": 15
      }
    },
    "buildingYearSampleCount": 148,
    "structureCounts": {
      "ＲＣ": 106,
      "ＳＲＣ": 37,
      "ＲＣ、鉄骨造": 1,
      "ＳＲＣ、ＲＣ": 2
    },
    "sampleCount": 148,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "足立區",
    "layout": "r1",
    "medianTradePriceYen": 7800000,
    "medianSqmPriceYen": 517000,
    "medianAreaSqm": 15,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 6
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "多摩市",
    "layout": "k1",
    "medianTradePriceYen": 30000000,
    "medianSqmPriceYen": 1200000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1200000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 6
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "多摩市",
    "layout": "ldk1",
    "medianTradePriceYen": 14500000,
    "medianSqmPriceYen": 421000,
    "medianAreaSqm": 40,
    "ageBands": {},
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＲＣ": 10
    },
    "sampleCount": 10,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q2",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "多摩市",
    "layout": "ldk2",
    "medianTradePriceYen": 29000000,
    "medianSqmPriceYen": 580000,
    "medianAreaSqm": 50,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 1
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "多摩市",
    "layout": "ldk3",
    "medianTradePriceYen": 36000000,
    "medianSqmPriceYen": 467000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 613000,
        "sampleCount": 8
      },
      "age_21_30": {
        "medianSqmPriceYen": 483000,
        "sampleCount": 6
      },
      "age_31_40": {
        "medianSqmPriceYen": 322000,
        "sampleCount": 5
      },
      "age_41_plus": {
        "medianSqmPriceYen": 275000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 30,
    "structureCounts": {
      "ＲＣ": 26,
      "ＳＲＣ": 2,
      "ＳＲＣ、ＲＣ": 1
    },
    "sampleCount": 31,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "台東區",
    "layout": "k1",
    "medianTradePriceYen": 30000000,
    "medianSqmPriceYen": 1200000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1320000,
        "sampleCount": 67
      },
      "age_11_20": {
        "medianSqmPriceYen": 1160000,
        "sampleCount": 84
      },
      "age_21_30": {
        "medianSqmPriceYen": 1183000,
        "sampleCount": 12
      },
      "age_31_40": {
        "medianSqmPriceYen": 750000,
        "sampleCount": 11
      },
      "age_41_plus": {
        "medianSqmPriceYen": 850000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 183,
    "structureCounts": {
      "ＲＣ": 151,
      "ＳＲＣ": 28,
      "鉄骨造": 2
    },
    "sampleCount": 184,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "台東區",
    "layout": "ldk1",
    "medianTradePriceYen": 47000000,
    "medianSqmPriceYen": 1229000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1429000,
        "sampleCount": 40
      },
      "age_11_20": {
        "medianSqmPriceYen": 1178000,
        "sampleCount": 37
      },
      "age_21_30": {
        "medianSqmPriceYen": 1143000,
        "sampleCount": 9
      },
      "age_31_40": {
        "medianSqmPriceYen": 1052000,
        "sampleCount": 8
      },
      "age_41_plus": {
        "medianSqmPriceYen": 800000,
        "sampleCount": 11
      }
    },
    "buildingYearSampleCount": 105,
    "structureCounts": {
      "ＳＲＣ": 27,
      "ＲＣ": 78
    },
    "sampleCount": 105,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "台東區",
    "layout": "ldk2",
    "medianTradePriceYen": 71000000,
    "medianSqmPriceYen": 1300000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1560000,
        "sampleCount": 21
      },
      "age_11_20": {
        "medianSqmPriceYen": 1300000,
        "sampleCount": 21
      },
      "age_21_30": {
        "medianSqmPriceYen": 1224000,
        "sampleCount": 30
      },
      "age_41_plus": {
        "medianSqmPriceYen": 945000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 82,
    "structureCounts": {
      "ＲＣ": 46,
      "ＳＲＣ": 36
    },
    "sampleCount": 82,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "台東區",
    "layout": "ldk3",
    "medianTradePriceYen": 85000000,
    "medianSqmPriceYen": 1240000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 1598000,
        "sampleCount": 12
      },
      "age_21_30": {
        "medianSqmPriceYen": 1200000,
        "sampleCount": 16
      }
    },
    "buildingYearSampleCount": 33,
    "structureCounts": {
      "ＳＲＣ": 14,
      "ＲＣ": 19
    },
    "sampleCount": 33,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "台東區",
    "layout": "r1",
    "medianTradePriceYen": 13500000,
    "medianSqmPriceYen": 833000,
    "medianAreaSqm": 15,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 800000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＳＲＣ": 5,
      "ＲＣ": 1
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "大田區",
    "layout": "k1",
    "medianTradePriceYen": 25000000,
    "medianSqmPriceYen": 1150000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1200000,
        "sampleCount": 136
      },
      "age_11_20": {
        "medianSqmPriceYen": 1150000,
        "sampleCount": 203
      },
      "age_21_30": {
        "medianSqmPriceYen": 1100000,
        "sampleCount": 47
      },
      "age_31_40": {
        "medianSqmPriceYen": 700000,
        "sampleCount": 17
      },
      "age_41_plus": {
        "medianSqmPriceYen": 667000,
        "sampleCount": 13
      }
    },
    "buildingYearSampleCount": 416,
    "structureCounts": {
      "ＲＣ": 376,
      "ＳＲＣ": 29,
      "鉄骨造": 1
    },
    "sampleCount": 417,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "大田區",
    "layout": "ldk1",
    "medianTradePriceYen": 37000000,
    "medianSqmPriceYen": 975000,
    "medianAreaSqm": 35,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1262000,
        "sampleCount": 32
      },
      "age_11_20": {
        "medianSqmPriceYen": 1120000,
        "sampleCount": 28
      },
      "age_21_30": {
        "medianSqmPriceYen": 733000,
        "sampleCount": 9
      },
      "age_31_40": {
        "medianSqmPriceYen": 932000,
        "sampleCount": 6
      },
      "age_41_plus": {
        "medianSqmPriceYen": 667000,
        "sampleCount": 33
      }
    },
    "buildingYearSampleCount": 108,
    "structureCounts": {
      "ＲＣ": 84,
      "ＳＲＣ": 19,
      "鉄骨造": 1
    },
    "sampleCount": 109,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "大田區",
    "layout": "ldk2",
    "medianTradePriceYen": 50000000,
    "medianSqmPriceYen": 900000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1280000,
        "sampleCount": 16
      },
      "age_11_20": {
        "medianSqmPriceYen": 1130000,
        "sampleCount": 18
      },
      "age_21_30": {
        "medianSqmPriceYen": 983000,
        "sampleCount": 33
      },
      "age_31_40": {
        "medianSqmPriceYen": 880000,
        "sampleCount": 21
      },
      "age_41_plus": {
        "medianSqmPriceYen": 660000,
        "sampleCount": 31
      }
    },
    "buildingYearSampleCount": 119,
    "structureCounts": {
      "ＳＲＣ": 43,
      "ＲＣ": 78
    },
    "sampleCount": 123,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "大田區",
    "layout": "ldk3",
    "medianTradePriceYen": 69000000,
    "medianSqmPriceYen": 957000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1062000,
        "sampleCount": 12
      },
      "age_11_20": {
        "medianSqmPriceYen": 1100000,
        "sampleCount": 31
      },
      "age_21_30": {
        "medianSqmPriceYen": 949000,
        "sampleCount": 60
      },
      "age_31_40": {
        "medianSqmPriceYen": 824000,
        "sampleCount": 18
      },
      "age_41_plus": {
        "medianSqmPriceYen": 714000,
        "sampleCount": 15
      }
    },
    "buildingYearSampleCount": 136,
    "structureCounts": {
      "ＳＲＣ": 43,
      "ＲＣ": 95,
      "鉄骨造": 1
    },
    "sampleCount": 139,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "大田區",
    "layout": "r1",
    "medianTradePriceYen": 13000000,
    "medianSqmPriceYen": 867000,
    "medianAreaSqm": 15,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 567000,
        "sampleCount": 12
      }
    },
    "buildingYearSampleCount": 18,
    "structureCounts": {
      "ＳＲＣ": 6,
      "ＲＣ": 12
    },
    "sampleCount": 18,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "中央區",
    "layout": "k1",
    "medianTradePriceYen": 29000000,
    "medianSqmPriceYen": 1360000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1680000,
        "sampleCount": 13
      },
      "age_11_20": {
        "medianSqmPriceYen": 1500000,
        "sampleCount": 30
      },
      "age_21_30": {
        "medianSqmPriceYen": 1350000,
        "sampleCount": 100
      },
      "age_41_plus": {
        "medianSqmPriceYen": 850000,
        "sampleCount": 21
      }
    },
    "buildingYearSampleCount": 166,
    "structureCounts": {
      "ＳＲＣ": 108,
      "ＲＣ": 57,
      "鉄骨造": 1
    },
    "sampleCount": 174,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "中央區",
    "layout": "ldk1",
    "medianTradePriceYen": 74000000,
    "medianSqmPriceYen": 1867000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 2120000,
        "sampleCount": 28
      },
      "age_11_20": {
        "medianSqmPriceYen": 1771000,
        "sampleCount": 37
      },
      "age_21_30": {
        "medianSqmPriceYen": 1815000,
        "sampleCount": 14
      },
      "age_41_plus": {
        "medianSqmPriceYen": 825000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 85,
    "structureCounts": {
      "ＳＲＣ": 19,
      "ＲＣ": 65,
      "鉄骨造": 1
    },
    "sampleCount": 89,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "中央區",
    "layout": "ldk2",
    "medianTradePriceYen": 120000000,
    "medianSqmPriceYen": 2000000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 2286000,
        "sampleCount": 41
      },
      "age_11_20": {
        "medianSqmPriceYen": 1833000,
        "sampleCount": 29
      },
      "age_21_30": {
        "medianSqmPriceYen": 1740000,
        "sampleCount": 29
      }
    },
    "buildingYearSampleCount": 101,
    "structureCounts": {
      "ＲＣ": 79,
      "ＳＲＣ": 22
    },
    "sampleCount": 106,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "中央區",
    "layout": "ldk3",
    "medianTradePriceYen": 160000000,
    "medianSqmPriceYen": 2129000,
    "medianAreaSqm": 73,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 2286000,
        "sampleCount": 35
      },
      "age_11_20": {
        "medianSqmPriceYen": 2063000,
        "sampleCount": 12
      },
      "age_21_30": {
        "medianSqmPriceYen": 1778000,
        "sampleCount": 26
      }
    },
    "buildingYearSampleCount": 77,
    "structureCounts": {
      "ＲＣ": 54,
      "ＳＲＣ": 13,
      "鉄骨造": 10
    },
    "sampleCount": 78,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "中央區",
    "layout": "r1",
    "medianTradePriceYen": 19000000,
    "medianSqmPriceYen": 950000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 917000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 12,
    "structureCounts": {
      "ＳＲＣ": 9,
      "ＲＣ": 3
    },
    "sampleCount": 13,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "中野區",
    "layout": "k1",
    "medianTradePriceYen": 25000000,
    "medianSqmPriceYen": 1160000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1417000,
        "sampleCount": 44
      },
      "age_11_20": {
        "medianSqmPriceYen": 1150000,
        "sampleCount": 57
      },
      "age_21_30": {
        "medianSqmPriceYen": 1150000,
        "sampleCount": 30
      },
      "age_31_40": {
        "medianSqmPriceYen": 700000,
        "sampleCount": 9
      },
      "age_41_plus": {
        "medianSqmPriceYen": 708000,
        "sampleCount": 14
      }
    },
    "buildingYearSampleCount": 154,
    "structureCounts": {
      "ＲＣ": 135,
      "ＳＲＣ": 17
    },
    "sampleCount": 154,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "中野區",
    "layout": "ldk1",
    "medianTradePriceYen": 38000000,
    "medianSqmPriceYen": 1086000,
    "medianAreaSqm": 35,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1371000,
        "sampleCount": 9
      },
      "age_11_20": {
        "medianSqmPriceYen": 1125000,
        "sampleCount": 18
      },
      "age_21_30": {
        "medianSqmPriceYen": 1133000,
        "sampleCount": 9
      },
      "age_31_40": {
        "medianSqmPriceYen": 1095000,
        "sampleCount": 6
      },
      "age_41_plus": {
        "medianSqmPriceYen": 728000,
        "sampleCount": 18
      }
    },
    "buildingYearSampleCount": 60,
    "structureCounts": {
      "ＲＣ": 47,
      "ＳＲＣ": 13
    },
    "sampleCount": 63,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "中野區",
    "layout": "ldk2",
    "medianTradePriceYen": 67000000,
    "medianSqmPriceYen": 1236000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1527000,
        "sampleCount": 14
      },
      "age_11_20": {
        "medianSqmPriceYen": 1700000,
        "sampleCount": 17
      },
      "age_21_30": {
        "medianSqmPriceYen": 1180000,
        "sampleCount": 13
      },
      "age_31_40": {
        "medianSqmPriceYen": 860000,
        "sampleCount": 9
      },
      "age_41_plus": {
        "medianSqmPriceYen": 655000,
        "sampleCount": 11
      }
    },
    "buildingYearSampleCount": 64,
    "structureCounts": {
      "ＲＣ": 51,
      "ＳＲＣ": 12,
      "鉄骨造": 1
    },
    "sampleCount": 65,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "中野區",
    "layout": "ldk3",
    "medianTradePriceYen": 89000000,
    "medianSqmPriceYen": 1214000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1371000,
        "sampleCount": 11
      },
      "age_11_20": {
        "medianSqmPriceYen": 1343000,
        "sampleCount": 15
      },
      "age_21_30": {
        "medianSqmPriceYen": 1015000,
        "sampleCount": 21
      }
    },
    "buildingYearSampleCount": 50,
    "structureCounts": {
      "ＲＣ": 44,
      "ＳＲＣ": 6
    },
    "sampleCount": 51,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "中野區",
    "layout": "r1",
    "medianTradePriceYen": 11000000,
    "medianSqmPriceYen": 640000,
    "medianAreaSqm": 15,
    "ageBands": {},
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＲＣ": 8,
      "ＳＲＣ": 1
    },
    "sampleCount": 9,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "町田市",
    "layout": "k1",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 920000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 780000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 12,
    "structureCounts": {
      "ＲＣ": 11,
      "ＳＲＣ": 1
    },
    "sampleCount": 13,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "町田市",
    "layout": "ldk1",
    "medianTradePriceYen": 13500000,
    "medianSqmPriceYen": 419000,
    "medianAreaSqm": 45,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 111000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＳＲＣ": 1,
      "ＲＣ": 15
    },
    "sampleCount": 20,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "町田市",
    "layout": "ldk2",
    "medianTradePriceYen": 12500000,
    "medianSqmPriceYen": 210000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 170000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＲＣ": 9
    },
    "sampleCount": 16,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "町田市",
    "layout": "ldk3",
    "medianTradePriceYen": 39000000,
    "medianSqmPriceYen": 520000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 720000,
        "sampleCount": 7
      },
      "age_11_20": {
        "medianSqmPriceYen": 446000,
        "sampleCount": 6
      },
      "age_21_30": {
        "medianSqmPriceYen": 536000,
        "sampleCount": 16
      },
      "age_31_40": {
        "medianSqmPriceYen": 211000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 36,
    "structureCounts": {
      "ＲＣ": 27,
      "ＳＲＣ": 8
    },
    "sampleCount": 39,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "調布市",
    "layout": "k1",
    "medianTradePriceYen": 28000000,
    "medianSqmPriceYen": 1120000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1240000,
        "sampleCount": 9
      },
      "age_11_20": {
        "medianSqmPriceYen": 800000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 17,
    "structureCounts": {
      "ＲＣ": 15,
      "ＳＲＣ": 1
    },
    "sampleCount": 17,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "調布市",
    "layout": "ldk1",
    "medianTradePriceYen": 25500000,
    "medianSqmPriceYen": 638000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 925000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＳＲＣ": 3,
      "ＲＣ": 5,
      "鉄骨造": 1
    },
    "sampleCount": 10,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "調布市",
    "layout": "ldk2",
    "medianTradePriceYen": 45000000,
    "medianSqmPriceYen": 783000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1240000,
        "sampleCount": 9
      },
      "age_11_20": {
        "medianSqmPriceYen": 923000,
        "sampleCount": 7
      },
      "age_21_30": {
        "medianSqmPriceYen": 698000,
        "sampleCount": 8
      },
      "age_41_plus": {
        "medianSqmPriceYen": 490000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 34,
    "structureCounts": {
      "ＲＣ": 27,
      "鉄骨造": 3,
      "ＳＲＣ": 3
    },
    "sampleCount": 37,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "調布市",
    "layout": "ldk3",
    "medianTradePriceYen": 55000000,
    "medianSqmPriceYen": 769000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1154000,
        "sampleCount": 15
      },
      "age_11_20": {
        "medianSqmPriceYen": 720000,
        "sampleCount": 13
      },
      "age_21_30": {
        "medianSqmPriceYen": 786000,
        "sampleCount": 17
      },
      "age_31_40": {
        "medianSqmPriceYen": 621000,
        "sampleCount": 6
      },
      "age_41_plus": {
        "medianSqmPriceYen": 414000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 56,
    "structureCounts": {
      "ＲＣ": 47,
      "ＲＣ、鉄骨造": 1,
      "ＳＲＣ": 8
    },
    "sampleCount": 57,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "東久留米市",
    "layout": "ldk2",
    "medianTradePriceYen": 14000000,
    "medianSqmPriceYen": 289000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 204000,
        "sampleCount": 12
      }
    },
    "buildingYearSampleCount": 17,
    "structureCounts": {
      "ＲＣ": 14,
      "ＳＲＣ": 1,
      "ＳＲＣ、ＲＣ": 1
    },
    "sampleCount": 17,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "東久留米市",
    "layout": "ldk3",
    "medianTradePriceYen": 12000000,
    "medianSqmPriceYen": 161000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 147000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＲＣ": 11,
      "ＳＲＣ": 1
    },
    "sampleCount": 14,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "東村山市",
    "layout": "k1",
    "medianTradePriceYen": 6900000,
    "medianSqmPriceYen": 275000,
    "medianAreaSqm": 20,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "東村山市",
    "layout": "ldk1",
    "medianTradePriceYen": 11000000,
    "medianSqmPriceYen": 314000,
    "medianAreaSqm": 35,
    "ageBands": {},
    "buildingYearSampleCount": 4,
    "structureCounts": {
      "ＲＣ": 3,
      "ＳＲＣ": 1
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "東村山市",
    "layout": "ldk2",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 381000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 508000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 327000,
        "sampleCount": 7
      },
      "age_41_plus": {
        "medianSqmPriceYen": 364000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 19,
    "structureCounts": {
      "ＲＣ": 14,
      "ＳＲＣ": 5
    },
    "sampleCount": 20,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "東村山市",
    "layout": "ldk3",
    "medianTradePriceYen": 35000000,
    "medianSqmPriceYen": 500000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 627000,
        "sampleCount": 8
      },
      "age_11_20": {
        "medianSqmPriceYen": 512000,
        "sampleCount": 8
      },
      "age_21_30": {
        "medianSqmPriceYen": 445000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 30,
    "structureCounts": {
      "ＲＣ": 25,
      "ＳＲＣ": 5
    },
    "sampleCount": 31,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "東大和市",
    "layout": "ldk3",
    "medianTradePriceYen": 35000000,
    "medianSqmPriceYen": 467000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 490000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＲＣ": 11,
      "ＳＲＣ": 2
    },
    "sampleCount": 13,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "日野市",
    "layout": "ldk1",
    "medianTradePriceYen": 19000000,
    "medianSqmPriceYen": 380000,
    "medianAreaSqm": 45,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 600000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "鉄骨造": 2,
      "ＲＣ": 6,
      "ＳＲＣ": 1
    },
    "sampleCount": 9,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "日野市",
    "layout": "ldk2",
    "medianTradePriceYen": 15000000,
    "medianSqmPriceYen": 333000,
    "medianAreaSqm": 50,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 155000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 15,
    "structureCounts": {
      "ＲＣ": 13,
      "鉄骨造": 2,
      "ＳＲＣ": 2
    },
    "sampleCount": 17,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "日野市",
    "layout": "ldk3",
    "medianTradePriceYen": 33000000,
    "medianSqmPriceYen": 445000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 514000,
        "sampleCount": 6
      },
      "age_21_30": {
        "medianSqmPriceYen": 450000,
        "sampleCount": 17
      },
      "age_41_plus": {
        "medianSqmPriceYen": 200000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 30,
    "structureCounts": {
      "ＲＣ": 29,
      "ＳＲＣ": 1
    },
    "sampleCount": 30,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "八王子市",
    "layout": "k1",
    "medianTradePriceYen": 18000000,
    "medianSqmPriceYen": 867000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1100000,
        "sampleCount": 12
      },
      "age_11_20": {
        "medianSqmPriceYen": 800000,
        "sampleCount": 15
      }
    },
    "buildingYearSampleCount": 32,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 31
    },
    "sampleCount": 33,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "八王子市",
    "layout": "ldk1",
    "medianTradePriceYen": 17500000,
    "medianSqmPriceYen": 389000,
    "medianAreaSqm": 43,
    "ageBands": {},
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＲＣ": 6,
      "ＳＲＣ": 6
    },
    "sampleCount": 12,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "八王子市",
    "layout": "ldk2",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 339000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 738000,
        "sampleCount": 11
      },
      "age_11_20": {
        "medianSqmPriceYen": 558000,
        "sampleCount": 6
      },
      "age_21_30": {
        "medianSqmPriceYen": 327000,
        "sampleCount": 11
      },
      "age_41_plus": {
        "medianSqmPriceYen": 217000,
        "sampleCount": 15
      }
    },
    "buildingYearSampleCount": 45,
    "structureCounts": {
      "ＲＣ": 30,
      "ＳＲＣ": 15,
      "鉄骨造": 1,
      "ＲＣ、鉄骨造": 1
    },
    "sampleCount": 50,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "八王子市",
    "layout": "ldk3",
    "medianTradePriceYen": 31000000,
    "medianSqmPriceYen": 414000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 674000,
        "sampleCount": 14
      },
      "age_11_20": {
        "medianSqmPriceYen": 503000,
        "sampleCount": 34
      },
      "age_21_30": {
        "medianSqmPriceYen": 415000,
        "sampleCount": 56
      },
      "age_31_40": {
        "medianSqmPriceYen": 295000,
        "sampleCount": 13
      },
      "age_41_plus": {
        "medianSqmPriceYen": 231000,
        "sampleCount": 19
      }
    },
    "buildingYearSampleCount": 136,
    "structureCounts": {
      "ＲＣ": 101,
      "ＳＲＣ": 33
    },
    "sampleCount": 145,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "八王子市",
    "layout": "r1",
    "medianTradePriceYen": 3700000,
    "medianSqmPriceYen": 247000,
    "medianAreaSqm": 15,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 4
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "板橋區",
    "layout": "k1",
    "medianTradePriceYen": 25000000,
    "medianSqmPriceYen": 1050000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1080000,
        "sampleCount": 139
      },
      "age_11_20": {
        "medianSqmPriceYen": 1000000,
        "sampleCount": 126
      },
      "age_21_30": {
        "medianSqmPriceYen": 967000,
        "sampleCount": 12
      },
      "age_31_40": {
        "medianSqmPriceYen": 820000,
        "sampleCount": 10
      },
      "age_41_plus": {
        "medianSqmPriceYen": 550000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 293,
    "structureCounts": {
      "ＲＣ": 282,
      "ＳＲＣ": 13
    },
    "sampleCount": 309,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "板橋區",
    "layout": "ldk1",
    "medianTradePriceYen": 28000000,
    "medianSqmPriceYen": 675000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1175000,
        "sampleCount": 8
      },
      "age_11_20": {
        "medianSqmPriceYen": 981000,
        "sampleCount": 8
      },
      "age_31_40": {
        "medianSqmPriceYen": 600000,
        "sampleCount": 11
      },
      "age_41_plus": {
        "medianSqmPriceYen": 425000,
        "sampleCount": 21
      }
    },
    "buildingYearSampleCount": 51,
    "structureCounts": {
      "ＳＲＣ": 22,
      "ＲＣ": 27,
      "鉄骨造": 1
    },
    "sampleCount": 53,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "板橋區",
    "layout": "ldk2",
    "medianTradePriceYen": 40000000,
    "medianSqmPriceYen": 705000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1400000,
        "sampleCount": 5
      },
      "age_11_20": {
        "medianSqmPriceYen": 967000,
        "sampleCount": 21
      },
      "age_21_30": {
        "medianSqmPriceYen": 855000,
        "sampleCount": 25
      },
      "age_31_40": {
        "medianSqmPriceYen": 600000,
        "sampleCount": 25
      },
      "age_41_plus": {
        "medianSqmPriceYen": 500000,
        "sampleCount": 35
      }
    },
    "buildingYearSampleCount": 111,
    "structureCounts": {
      "ＲＣ": 81,
      "ＳＲＣ": 31
    },
    "sampleCount": 112,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "板橋區",
    "layout": "ldk3",
    "medianTradePriceYen": 56000000,
    "medianSqmPriceYen": 800000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1231000,
        "sampleCount": 13
      },
      "age_11_20": {
        "medianSqmPriceYen": 943000,
        "sampleCount": 36
      },
      "age_21_30": {
        "medianSqmPriceYen": 786000,
        "sampleCount": 35
      },
      "age_31_40": {
        "medianSqmPriceYen": 675000,
        "sampleCount": 13
      },
      "age_41_plus": {
        "medianSqmPriceYen": 455000,
        "sampleCount": 30
      }
    },
    "buildingYearSampleCount": 127,
    "structureCounts": {
      "ＲＣ": 90,
      "ＳＲＣ": 39
    },
    "sampleCount": 131,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "板橋區",
    "layout": "r1",
    "medianTradePriceYen": 9900000,
    "medianSqmPriceYen": 495000,
    "medianAreaSqm": 15,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 480000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＲＣ": 8,
      "ＳＲＣ": 1
    },
    "sampleCount": 9,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "品川區",
    "layout": "k1",
    "medianTradePriceYen": 28000000,
    "medianSqmPriceYen": 1350000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1625000,
        "sampleCount": 82
      },
      "age_11_20": {
        "medianSqmPriceYen": 1332000,
        "sampleCount": 108
      },
      "age_21_30": {
        "medianSqmPriceYen": 1200000,
        "sampleCount": 57
      },
      "age_31_40": {
        "medianSqmPriceYen": 1000000,
        "sampleCount": 14
      },
      "age_41_plus": {
        "medianSqmPriceYen": 700000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 271,
    "structureCounts": {
      "ＲＣ": 222,
      "ＳＲＣ": 50
    },
    "sampleCount": 272,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "品川區",
    "layout": "ldk1",
    "medianTradePriceYen": 44500000,
    "medianSqmPriceYen": 1173000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1929000,
        "sampleCount": 12
      },
      "age_11_20": {
        "medianSqmPriceYen": 1900000,
        "sampleCount": 19
      },
      "age_21_30": {
        "medianSqmPriceYen": 1421000,
        "sampleCount": 14
      },
      "age_31_40": {
        "medianSqmPriceYen": 914000,
        "sampleCount": 5
      },
      "age_41_plus": {
        "medianSqmPriceYen": 800000,
        "sampleCount": 34
      }
    },
    "buildingYearSampleCount": 84,
    "structureCounts": {
      "ＲＣ": 50,
      "ＳＲＣ": 35,
      "鉄骨造": 1
    },
    "sampleCount": 86,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "品川區",
    "layout": "ldk2",
    "medianTradePriceYen": 79500000,
    "medianSqmPriceYen": 1513000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 2244000,
        "sampleCount": 20
      },
      "age_11_20": {
        "medianSqmPriceYen": 2077000,
        "sampleCount": 34
      },
      "age_21_30": {
        "medianSqmPriceYen": 1452000,
        "sampleCount": 40
      },
      "age_31_40": {
        "medianSqmPriceYen": 940000,
        "sampleCount": 5
      },
      "age_41_plus": {
        "medianSqmPriceYen": 850000,
        "sampleCount": 20
      }
    },
    "buildingYearSampleCount": 119,
    "structureCounts": {
      "ＳＲＣ": 34,
      "ＲＣ": 88
    },
    "sampleCount": 122,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "品川區",
    "layout": "ldk3",
    "medianTradePriceYen": 120000000,
    "medianSqmPriceYen": 1692000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1846000,
        "sampleCount": 24
      },
      "age_11_20": {
        "medianSqmPriceYen": 2143000,
        "sampleCount": 21
      },
      "age_21_30": {
        "medianSqmPriceYen": 1386000,
        "sampleCount": 29
      },
      "age_41_plus": {
        "medianSqmPriceYen": 700000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 81,
    "structureCounts": {
      "ＲＣ": 67,
      "ＳＲＣ": 16
    },
    "sampleCount": 85,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "品川區",
    "layout": "r1",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 1267000,
    "medianAreaSqm": 15,
    "ageBands": {},
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＲＣ": 9,
      "ＳＲＣ": 4
    },
    "sampleCount": 13,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "府中市",
    "layout": "k1",
    "medianTradePriceYen": 23000000,
    "medianSqmPriceYen": 960000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1000000,
        "sampleCount": 7
      },
      "age_11_20": {
        "medianSqmPriceYen": 920000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 19,
    "structureCounts": {
      "ＲＣ": 18,
      "ＳＲＣ": 1
    },
    "sampleCount": 20,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "府中市",
    "layout": "ldk1",
    "medianTradePriceYen": 29000000,
    "medianSqmPriceYen": 607000,
    "medianAreaSqm": 45,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 1,
      "鉄骨造": 1
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "府中市",
    "layout": "ldk2",
    "medianTradePriceYen": 35000000,
    "medianSqmPriceYen": 640000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 720000,
        "sampleCount": 9
      },
      "age_21_30": {
        "medianSqmPriceYen": 700000,
        "sampleCount": 9
      },
      "age_31_40": {
        "medianSqmPriceYen": 535000,
        "sampleCount": 10
      },
      "age_41_plus": {
        "medianSqmPriceYen": 444000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 35,
    "structureCounts": {
      "ＳＲＣ": 10,
      "ＲＣ": 23
    },
    "sampleCount": 35,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "府中市",
    "layout": "ldk3",
    "medianTradePriceYen": 47000000,
    "medianSqmPriceYen": 676000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 857000,
        "sampleCount": 7
      },
      "age_11_20": {
        "medianSqmPriceYen": 769000,
        "sampleCount": 21
      },
      "age_21_30": {
        "medianSqmPriceYen": 646000,
        "sampleCount": 32
      },
      "age_31_40": {
        "medianSqmPriceYen": 458000,
        "sampleCount": 8
      },
      "age_41_plus": {
        "medianSqmPriceYen": 400000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 77,
    "structureCounts": {
      "ＲＣ": 59,
      "ＳＲＣ": 14
    },
    "sampleCount": 80,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "武蔵村山市",
    "layout": "ldk2",
    "medianTradePriceYen": 11500000,
    "medianSqmPriceYen": 228000,
    "medianAreaSqm": 53,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 220000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 6
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "武藏野市",
    "layout": "k1",
    "medianTradePriceYen": 26000000,
    "medianSqmPriceYen": 1225000,
    "medianAreaSqm": 25,
    "ageBands": {},
    "buildingYearSampleCount": 12,
    "structureCounts": {
      "ＳＲＣ": 5,
      "ＲＣ": 7
    },
    "sampleCount": 12,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "武藏野市",
    "layout": "ldk1",
    "medianTradePriceYen": 36000000,
    "medianSqmPriceYen": 800000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 578000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 7
    },
    "sampleCount": 9,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "武藏野市",
    "layout": "ldk2",
    "medianTradePriceYen": 65000000,
    "medianSqmPriceYen": 1182000,
    "medianAreaSqm": 55,
    "ageBands": {},
    "buildingYearSampleCount": 16,
    "structureCounts": {
      "ＳＲＣ": 7,
      "ＲＣ": 10
    },
    "sampleCount": 17,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "武藏野市",
    "layout": "ldk3",
    "medianTradePriceYen": 89000000,
    "medianSqmPriceYen": 1176000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1354000,
        "sampleCount": 5
      },
      "age_11_20": {
        "medianSqmPriceYen": 1222000,
        "sampleCount": 16
      },
      "age_21_30": {
        "medianSqmPriceYen": 1029000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 31,
    "structureCounts": {
      "ＲＣ": 29,
      "ＳＲＣ": 2
    },
    "sampleCount": 31,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "福生市",
    "layout": "ldk1",
    "medianTradePriceYen": 7000000,
    "medianSqmPriceYen": 148000,
    "medianAreaSqm": 45,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 144000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＲＣ": 8
    },
    "sampleCount": 8,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "福生市",
    "layout": "ldk2",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 359000,
    "medianAreaSqm": 53,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 1
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "福生市",
    "layout": "ldk3",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 311000,
    "medianAreaSqm": 65,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 338000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＳＲＣ": 3,
      "ＲＣ": 5
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "文京區",
    "layout": "k1",
    "medianTradePriceYen": 25000000,
    "medianSqmPriceYen": 1200000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1520000,
        "sampleCount": 7
      },
      "age_11_20": {
        "medianSqmPriceYen": 1290000,
        "sampleCount": 44
      },
      "age_21_30": {
        "medianSqmPriceYen": 1200000,
        "sampleCount": 62
      },
      "age_31_40": {
        "medianSqmPriceYen": 925000,
        "sampleCount": 8
      },
      "age_41_plus": {
        "medianSqmPriceYen": 1000000,
        "sampleCount": 11
      }
    },
    "buildingYearSampleCount": 132,
    "structureCounts": {
      "ＳＲＣ": 45,
      "ＲＣ": 89
    },
    "sampleCount": 134,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "文京區",
    "layout": "ldk1",
    "medianTradePriceYen": 53000000,
    "medianSqmPriceYen": 1325000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1776000,
        "sampleCount": 14
      },
      "age_11_20": {
        "medianSqmPriceYen": 1454000,
        "sampleCount": 26
      },
      "age_21_30": {
        "medianSqmPriceYen": 1200000,
        "sampleCount": 11
      },
      "age_31_40": {
        "medianSqmPriceYen": 1100000,
        "sampleCount": 11
      },
      "age_41_plus": {
        "medianSqmPriceYen": 1017000,
        "sampleCount": 20
      }
    },
    "buildingYearSampleCount": 82,
    "structureCounts": {
      "ＳＲＣ": 34,
      "ＲＣ": 48
    },
    "sampleCount": 83,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "文京區",
    "layout": "ldk2",
    "medianTradePriceYen": 92000000,
    "medianSqmPriceYen": 1660000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 2182000,
        "sampleCount": 18
      },
      "age_11_20": {
        "medianSqmPriceYen": 2000000,
        "sampleCount": 15
      },
      "age_21_30": {
        "medianSqmPriceYen": 1622000,
        "sampleCount": 29
      },
      "age_31_40": {
        "medianSqmPriceYen": 1340000,
        "sampleCount": 8
      },
      "age_41_plus": {
        "medianSqmPriceYen": 1100000,
        "sampleCount": 11
      }
    },
    "buildingYearSampleCount": 81,
    "structureCounts": {
      "ＲＣ": 50,
      "ＳＲＣ": 31
    },
    "sampleCount": 81,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "文京區",
    "layout": "ldk3",
    "medianTradePriceYen": 130000000,
    "medianSqmPriceYen": 1724000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 2571000,
        "sampleCount": 11
      },
      "age_11_20": {
        "medianSqmPriceYen": 2267000,
        "sampleCount": 15
      },
      "age_21_30": {
        "medianSqmPriceYen": 1538000,
        "sampleCount": 21
      },
      "age_31_40": {
        "medianSqmPriceYen": 1467000,
        "sampleCount": 9
      },
      "age_41_plus": {
        "medianSqmPriceYen": 1126000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 64,
    "structureCounts": {
      "ＲＣ": 39,
      "ＳＲＣ": 25
    },
    "sampleCount": 64,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "文京區",
    "layout": "r1",
    "medianTradePriceYen": 17500000,
    "medianSqmPriceYen": 1167000,
    "medianAreaSqm": 15,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 1267000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＲＣ": 7,
      "ＳＲＣ": 3
    },
    "sampleCount": 10,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "北區",
    "layout": "k1",
    "medianTradePriceYen": 27000000,
    "medianSqmPriceYen": 1100000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1166000,
        "sampleCount": 68
      },
      "age_11_20": {
        "medianSqmPriceYen": 1050000,
        "sampleCount": 71
      },
      "age_31_40": {
        "medianSqmPriceYen": 850000,
        "sampleCount": 5
      },
      "age_41_plus": {
        "medianSqmPriceYen": 600000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 151,
    "structureCounts": {
      "ＲＣ": 140,
      "ＳＲＣ": 12
    },
    "sampleCount": 152,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "北區",
    "layout": "ldk1",
    "medianTradePriceYen": 42000000,
    "medianSqmPriceYen": 1075000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1355000,
        "sampleCount": 18
      },
      "age_31_40": {
        "medianSqmPriceYen": 900000,
        "sampleCount": 7
      },
      "age_41_plus": {
        "medianSqmPriceYen": 611000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 43,
    "structureCounts": {
      "ＳＲＣ": 17,
      "ＲＣ": 26
    },
    "sampleCount": 43,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "北區",
    "layout": "ldk2",
    "medianTradePriceYen": 50000000,
    "medianSqmPriceYen": 920000,
    "medianAreaSqm": 50,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1083000,
        "sampleCount": 21
      },
      "age_11_20": {
        "medianSqmPriceYen": 927000,
        "sampleCount": 15
      },
      "age_21_30": {
        "medianSqmPriceYen": 980000,
        "sampleCount": 15
      },
      "age_31_40": {
        "medianSqmPriceYen": 886000,
        "sampleCount": 7
      },
      "age_41_plus": {
        "medianSqmPriceYen": 700000,
        "sampleCount": 17
      }
    },
    "buildingYearSampleCount": 75,
    "structureCounts": {
      "ＳＲＣ": 34,
      "ＲＣ": 41
    },
    "sampleCount": 76,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "北區",
    "layout": "ldk3",
    "medianTradePriceYen": 68000000,
    "medianSqmPriceYen": 933000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1163000,
        "sampleCount": 14
      },
      "age_11_20": {
        "medianSqmPriceYen": 1029000,
        "sampleCount": 8
      },
      "age_21_30": {
        "medianSqmPriceYen": 914000,
        "sampleCount": 26
      },
      "age_31_40": {
        "medianSqmPriceYen": 760000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 57,
    "structureCounts": {
      "ＲＣ": 33,
      "ＳＲＣ": 24
    },
    "sampleCount": 57,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "北區",
    "layout": "r1",
    "medianTradePriceYen": 13000000,
    "medianSqmPriceYen": 858000,
    "medianAreaSqm": 18,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 2
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "墨田區",
    "layout": "k1",
    "medianTradePriceYen": 27000000,
    "medianSqmPriceYen": 1200000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1200000,
        "sampleCount": 121
      },
      "age_11_20": {
        "medianSqmPriceYen": 1160000,
        "sampleCount": 133
      },
      "age_21_30": {
        "medianSqmPriceYen": 1200000,
        "sampleCount": 12
      },
      "age_31_40": {
        "medianSqmPriceYen": 750000,
        "sampleCount": 5
      },
      "age_41_plus": {
        "medianSqmPriceYen": 640000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 276,
    "structureCounts": {
      "ＲＣ": 253,
      "ＳＲＣ": 24
    },
    "sampleCount": 277,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "墨田區",
    "layout": "ldk1",
    "medianTradePriceYen": 44000000,
    "medianSqmPriceYen": 1120000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1289000,
        "sampleCount": 41
      },
      "age_11_20": {
        "medianSqmPriceYen": 1111000,
        "sampleCount": 23
      },
      "age_21_30": {
        "medianSqmPriceYen": 1125000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 975000,
        "sampleCount": 9
      },
      "age_41_plus": {
        "medianSqmPriceYen": 713000,
        "sampleCount": 16
      }
    },
    "buildingYearSampleCount": 94,
    "structureCounts": {
      "ＲＣ": 69,
      "ＳＲＣ": 19,
      "ＲＣ、鉄骨造": 4,
      "ＳＲＣ、ＲＣ": 3
    },
    "sampleCount": 95,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "墨田區",
    "layout": "ldk2",
    "medianTradePriceYen": 51000000,
    "medianSqmPriceYen": 1000000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1122000,
        "sampleCount": 10
      },
      "age_11_20": {
        "medianSqmPriceYen": 1145000,
        "sampleCount": 21
      },
      "age_21_30": {
        "medianSqmPriceYen": 1054000,
        "sampleCount": 24
      },
      "age_31_40": {
        "medianSqmPriceYen": 680000,
        "sampleCount": 12
      },
      "age_41_plus": {
        "medianSqmPriceYen": 736000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 77,
    "structureCounts": {
      "ＲＣ": 40,
      "ＳＲＣ、ＲＣ": 3,
      "ＳＲＣ": 31,
      "ＲＣ、鉄骨造": 1,
      "鉄骨造": 2
    },
    "sampleCount": 77,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "墨田區",
    "layout": "ldk3",
    "medianTradePriceYen": 62000000,
    "medianSqmPriceYen": 893000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 954000,
        "sampleCount": 18
      },
      "age_21_30": {
        "medianSqmPriceYen": 924000,
        "sampleCount": 19
      },
      "age_31_40": {
        "medianSqmPriceYen": 663000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 45,
    "structureCounts": {
      "ＳＲＣ": 13,
      "ＲＣ": 30,
      "ＲＣ、鉄骨造": 1,
      "ＳＲＣ、ＲＣ": 1
    },
    "sampleCount": 45,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "墨田區",
    "layout": "r1",
    "medianTradePriceYen": 9600000,
    "medianSqmPriceYen": 637000,
    "medianAreaSqm": 15,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 633000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 1
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "目黑區",
    "layout": "k1",
    "medianTradePriceYen": 33000000,
    "medianSqmPriceYen": 1400000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1600000,
        "sampleCount": 13
      },
      "age_11_20": {
        "medianSqmPriceYen": 1575000,
        "sampleCount": 14
      },
      "age_21_30": {
        "medianSqmPriceYen": 1250000,
        "sampleCount": 17
      },
      "age_41_plus": {
        "medianSqmPriceYen": 880000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 55,
    "structureCounts": {
      "ＳＲＣ": 20,
      "ＲＣ": 35
    },
    "sampleCount": 55,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "目黑區",
    "layout": "ldk1",
    "medianTradePriceYen": 53000000,
    "medianSqmPriceYen": 1427000,
    "medianAreaSqm": 35,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 2167000,
        "sampleCount": 9
      },
      "age_11_20": {
        "medianSqmPriceYen": 1867000,
        "sampleCount": 7
      },
      "age_21_30": {
        "medianSqmPriceYen": 1467000,
        "sampleCount": 13
      },
      "age_41_plus": {
        "medianSqmPriceYen": 1000000,
        "sampleCount": 25
      }
    },
    "buildingYearSampleCount": 58,
    "structureCounts": {
      "ＳＲＣ": 18,
      "ＲＣ": 38,
      "鉄骨造": 1
    },
    "sampleCount": 58,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "目黑區",
    "layout": "ldk2",
    "medianTradePriceYen": 90500000,
    "medianSqmPriceYen": 1663000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 2000000,
        "sampleCount": 8
      },
      "age_11_20": {
        "medianSqmPriceYen": 2160000,
        "sampleCount": 14
      },
      "age_21_30": {
        "medianSqmPriceYen": 1667000,
        "sampleCount": 17
      },
      "age_41_plus": {
        "medianSqmPriceYen": 960000,
        "sampleCount": 13
      }
    },
    "buildingYearSampleCount": 53,
    "structureCounts": {
      "ＲＣ": 39,
      "ＳＲＣ": 13,
      "鉄骨造": 2
    },
    "sampleCount": 54,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "目黑區",
    "layout": "ldk3",
    "medianTradePriceYen": 130000000,
    "medianSqmPriceYen": 1733000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 2000000,
        "sampleCount": 7
      },
      "age_21_30": {
        "medianSqmPriceYen": 1696000,
        "sampleCount": 16
      },
      "age_41_plus": {
        "medianSqmPriceYen": 1067000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 38,
    "structureCounts": {
      "ＲＣ": 30,
      "ＳＲＣ": 6,
      "鉄骨造": 2
    },
    "sampleCount": 40,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "目黑區",
    "layout": "r1",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 1000000,
    "medianAreaSqm": 15,
    "ageBands": {},
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＳＲＣ": 3,
      "ＲＣ": 6
    },
    "sampleCount": 9,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "立川市",
    "layout": "k1",
    "medianTradePriceYen": 23000000,
    "medianSqmPriceYen": 1150000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1150000,
        "sampleCount": 27
      }
    },
    "buildingYearSampleCount": 33,
    "structureCounts": {
      "ＲＣ": 31,
      "ＳＲＣ": 2
    },
    "sampleCount": 33,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "立川市",
    "layout": "ldk1",
    "medianTradePriceYen": 22500000,
    "medianSqmPriceYen": 586000,
    "medianAreaSqm": 35,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1429000,
        "sampleCount": 9
      },
      "age_41_plus": {
        "medianSqmPriceYen": 207000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 20,
    "structureCounts": {
      "ＲＣ": 21,
      "ＳＲＣ": 1
    },
    "sampleCount": 22,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "立川市",
    "layout": "ldk2",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 390000,
    "medianAreaSqm": 50,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 677000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 400000,
        "sampleCount": 9
      },
      "age_41_plus": {
        "medianSqmPriceYen": 289000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 24,
    "structureCounts": {
      "ＲＣ": 19,
      "ＳＲＣ": 5
    },
    "sampleCount": 24,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "立川市",
    "layout": "ldk3",
    "medianTradePriceYen": 52000000,
    "medianSqmPriceYen": 707000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 922000,
        "sampleCount": 5
      },
      "age_11_20": {
        "medianSqmPriceYen": 743000,
        "sampleCount": 5
      },
      "age_21_30": {
        "medianSqmPriceYen": 515000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 23,
    "structureCounts": {
      "ＲＣ": 21,
      "ＳＲＣ": 2
    },
    "sampleCount": 23,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "練馬區",
    "layout": "k1",
    "medianTradePriceYen": 23000000,
    "medianSqmPriceYen": 1050000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1120000,
        "sampleCount": 91
      },
      "age_11_20": {
        "medianSqmPriceYen": 1050000,
        "sampleCount": 120
      },
      "age_21_30": {
        "medianSqmPriceYen": 1000000,
        "sampleCount": 15
      },
      "age_31_40": {
        "medianSqmPriceYen": 650000,
        "sampleCount": 14
      },
      "age_41_plus": {
        "medianSqmPriceYen": 560000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 247,
    "structureCounts": {
      "ＲＣ": 234,
      "ＳＲＣ、ＲＣ": 3,
      "ＳＲＣ": 10
    },
    "sampleCount": 247,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "練馬區",
    "layout": "ldk1",
    "medianTradePriceYen": 28000000,
    "medianSqmPriceYen": 757000,
    "medianAreaSqm": 35,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1205000,
        "sampleCount": 14
      },
      "age_11_20": {
        "medianSqmPriceYen": 850000,
        "sampleCount": 5
      },
      "age_21_30": {
        "medianSqmPriceYen": 767000,
        "sampleCount": 6
      },
      "age_31_40": {
        "medianSqmPriceYen": 700000,
        "sampleCount": 5
      },
      "age_41_plus": {
        "medianSqmPriceYen": 544000,
        "sampleCount": 22
      }
    },
    "buildingYearSampleCount": 52,
    "structureCounts": {
      "ＲＣ": 32,
      "ＳＲＣ": 20
    },
    "sampleCount": 52,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "練馬區",
    "layout": "ldk2",
    "medianTradePriceYen": 40500000,
    "medianSqmPriceYen": 766000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 945000,
        "sampleCount": 7
      },
      "age_11_20": {
        "medianSqmPriceYen": 915000,
        "sampleCount": 10
      },
      "age_21_30": {
        "medianSqmPriceYen": 813000,
        "sampleCount": 18
      },
      "age_31_40": {
        "medianSqmPriceYen": 769000,
        "sampleCount": 23
      },
      "age_41_plus": {
        "medianSqmPriceYen": 574000,
        "sampleCount": 24
      }
    },
    "buildingYearSampleCount": 82,
    "structureCounts": {
      "ＲＣ": 59,
      "ＳＲＣ": 24,
      "ＲＣ、鉄骨造": 1
    },
    "sampleCount": 84,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "練馬區",
    "layout": "ldk3",
    "medianTradePriceYen": 61000000,
    "medianSqmPriceYen": 833000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1138000,
        "sampleCount": 9
      },
      "age_11_20": {
        "medianSqmPriceYen": 929000,
        "sampleCount": 29
      },
      "age_21_30": {
        "medianSqmPriceYen": 831000,
        "sampleCount": 51
      },
      "age_31_40": {
        "medianSqmPriceYen": 758000,
        "sampleCount": 18
      },
      "age_41_plus": {
        "medianSqmPriceYen": 563000,
        "sampleCount": 12
      }
    },
    "buildingYearSampleCount": 119,
    "structureCounts": {
      "ＳＲＣ": 18,
      "ＳＲＣ、ＲＣ": 1,
      "ＲＣ": 100
    },
    "sampleCount": 119,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "練馬區",
    "layout": "r1",
    "medianTradePriceYen": 8200000,
    "medianSqmPriceYen": 547000,
    "medianAreaSqm": 15,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 487000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 6
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "澀谷區",
    "layout": "k1",
    "medianTradePriceYen": 28500000,
    "medianSqmPriceYen": 1293000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1683000,
        "sampleCount": 14
      },
      "age_11_20": {
        "medianSqmPriceYen": 1525000,
        "sampleCount": 22
      },
      "age_21_30": {
        "medianSqmPriceYen": 1265000,
        "sampleCount": 46
      },
      "age_41_plus": {
        "medianSqmPriceYen": 1000000,
        "sampleCount": 19
      }
    },
    "buildingYearSampleCount": 105,
    "structureCounts": {
      "ＲＣ": 66,
      "ＳＲＣ": 41
    },
    "sampleCount": 112,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "澀谷區",
    "layout": "ldk1",
    "medianTradePriceYen": 63000000,
    "medianSqmPriceYen": 1733000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 2588000,
        "sampleCount": 14
      },
      "age_11_20": {
        "medianSqmPriceYen": 2200000,
        "sampleCount": 14
      },
      "age_21_30": {
        "medianSqmPriceYen": 1540000,
        "sampleCount": 25
      },
      "age_31_40": {
        "medianSqmPriceYen": 1833000,
        "sampleCount": 5
      },
      "age_41_plus": {
        "medianSqmPriceYen": 1140000,
        "sampleCount": 24
      }
    },
    "buildingYearSampleCount": 82,
    "structureCounts": {
      "ＲＣ": 61,
      "ＳＲＣ": 22
    },
    "sampleCount": 87,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "澀谷區",
    "layout": "ldk2",
    "medianTradePriceYen": 110000000,
    "medianSqmPriceYen": 2091000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 2748000,
        "sampleCount": 18
      },
      "age_11_20": {
        "medianSqmPriceYen": 2600000,
        "sampleCount": 11
      },
      "age_21_30": {
        "medianSqmPriceYen": 1833000,
        "sampleCount": 29
      },
      "age_41_plus": {
        "medianSqmPriceYen": 1271000,
        "sampleCount": 16
      }
    },
    "buildingYearSampleCount": 74,
    "structureCounts": {
      "ＲＣ": 51,
      "ＳＲＣ": 24
    },
    "sampleCount": 78,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "澀谷區",
    "layout": "ldk3",
    "medianTradePriceYen": 200000000,
    "medianSqmPriceYen": 2450000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 2951000,
        "sampleCount": 14
      },
      "age_11_20": {
        "medianSqmPriceYen": 2778000,
        "sampleCount": 5
      },
      "age_21_30": {
        "medianSqmPriceYen": 2067000,
        "sampleCount": 18
      },
      "age_31_40": {
        "medianSqmPriceYen": 1417000,
        "sampleCount": 5
      },
      "age_41_plus": {
        "medianSqmPriceYen": 1500000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 47,
    "structureCounts": {
      "ＳＲＣ": 14,
      "ＲＣ": 35
    },
    "sampleCount": 50,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "澀谷區",
    "layout": "r1",
    "medianTradePriceYen": 16000000,
    "medianSqmPriceYen": 1050000,
    "medianAreaSqm": 15,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 867000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＲＣ": 8,
      "ＳＲＣ": 3
    },
    "sampleCount": 11,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "豐島區",
    "layout": "k1",
    "medianTradePriceYen": 27000000,
    "medianSqmPriceYen": 1280000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1520000,
        "sampleCount": 49
      },
      "age_11_20": {
        "medianSqmPriceYen": 1300000,
        "sampleCount": 85
      },
      "age_21_30": {
        "medianSqmPriceYen": 1100000,
        "sampleCount": 31
      },
      "age_41_plus": {
        "medianSqmPriceYen": 735000,
        "sampleCount": 14
      }
    },
    "buildingYearSampleCount": 182,
    "structureCounts": {
      "ＳＲＣ": 26,
      "ＲＣ": 156,
      "鉄骨造": 1
    },
    "sampleCount": 183,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "豐島區",
    "layout": "ldk1",
    "medianTradePriceYen": 45500000,
    "medianSqmPriceYen": 1233000,
    "medianAreaSqm": 35,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1500000,
        "sampleCount": 10
      },
      "age_11_20": {
        "medianSqmPriceYen": 1343000,
        "sampleCount": 15
      },
      "age_21_30": {
        "medianSqmPriceYen": 1500000,
        "sampleCount": 7
      },
      "age_41_plus": {
        "medianSqmPriceYen": 825000,
        "sampleCount": 11
      }
    },
    "buildingYearSampleCount": 47,
    "structureCounts": {
      "ＲＣ": 30,
      "ＳＲＣ": 18
    },
    "sampleCount": 48,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "豐島區",
    "layout": "ldk2",
    "medianTradePriceYen": 71000000,
    "medianSqmPriceYen": 1289000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 2000000,
        "sampleCount": 11
      },
      "age_11_20": {
        "medianSqmPriceYen": 1529000,
        "sampleCount": 18
      },
      "age_21_30": {
        "medianSqmPriceYen": 1273000,
        "sampleCount": 19
      },
      "age_31_40": {
        "medianSqmPriceYen": 1073000,
        "sampleCount": 8
      },
      "age_41_plus": {
        "medianSqmPriceYen": 873000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 65,
    "structureCounts": {
      "ＳＲＣ": 20,
      "ＲＣ": 45,
      "鉄骨造": 1
    },
    "sampleCount": 67,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "豐島區",
    "layout": "ldk3",
    "medianTradePriceYen": 110000000,
    "medianSqmPriceYen": 1487000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 2375000,
        "sampleCount": 7
      },
      "age_11_20": {
        "medianSqmPriceYen": 1784000,
        "sampleCount": 20
      },
      "age_21_30": {
        "medianSqmPriceYen": 1281000,
        "sampleCount": 14
      }
    },
    "buildingYearSampleCount": 44,
    "structureCounts": {
      "ＳＲＣ": 9,
      "ＲＣ": 34,
      "軽量鉄骨造": 1
    },
    "sampleCount": 44,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "東京都",
    "district": "豐島區",
    "layout": "r1",
    "medianTradePriceYen": 12500000,
    "medianSqmPriceYen": 725000,
    "medianAreaSqm": 15,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＳＲＣ": 1,
      "ＲＣ": 5
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "栃木",
    "district": "宇都宮市",
    "layout": "k1",
    "medianTradePriceYen": 2200000,
    "medianSqmPriceYen": 108000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 108000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＳＲＣ": 7,
      "ＲＣ": 1
    },
    "sampleCount": 8,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "栃木",
    "district": "宇都宮市",
    "layout": "ldk1",
    "medianTradePriceYen": 6400000,
    "medianSqmPriceYen": 142000,
    "medianAreaSqm": 45,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 124000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＲＣ": 6,
      "ＳＲＣ": 4
    },
    "sampleCount": 10,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "栃木",
    "district": "宇都宮市",
    "layout": "ldk2",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 329000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 415000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 14,
    "structureCounts": {
      "ＲＣ": 8,
      "ＳＲＣ": 6
    },
    "sampleCount": 15,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "栃木",
    "district": "宇都宮市",
    "layout": "ldk3",
    "medianTradePriceYen": 24000000,
    "medianSqmPriceYen": 329000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 517000,
        "sampleCount": 8
      },
      "age_11_20": {
        "medianSqmPriceYen": 357000,
        "sampleCount": 9
      },
      "age_21_30": {
        "medianSqmPriceYen": 246000,
        "sampleCount": 12
      },
      "age_31_40": {
        "medianSqmPriceYen": 185000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 34,
    "structureCounts": {
      "ＳＲＣ": 12,
      "ＲＣ": 23
    },
    "sampleCount": 37,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "栃木",
    "district": "小山市",
    "layout": "ldk2",
    "medianTradePriceYen": 12000000,
    "medianSqmPriceYen": 185000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 167000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 2
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "栃木",
    "district": "小山市",
    "layout": "ldk3",
    "medianTradePriceYen": 23500000,
    "medianSqmPriceYen": 308000,
    "medianAreaSqm": 75,
    "ageBands": {},
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＲＣ": 7,
      "ＳＲＣ": 2
    },
    "sampleCount": 10,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "栃木",
    "district": "足利市",
    "layout": "ldk2",
    "medianTradePriceYen": 7500000,
    "medianSqmPriceYen": 117000,
    "medianAreaSqm": 55,
    "ageBands": {},
    "buildingYearSampleCount": 2,
    "structureCounts": {
      "ＲＣ、木造": 1,
      "ＳＲＣ": 1
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "栃木",
    "district": "那須塩原市",
    "layout": "k1",
    "medianTradePriceYen": 2000000,
    "medianSqmPriceYen": 65000,
    "medianAreaSqm": 30,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 40000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＳＲＣ": 5,
      "ＲＣ": 3
    },
    "sampleCount": 8,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "栃木",
    "district": "那須塩原市",
    "layout": "ldk1",
    "medianTradePriceYen": 3500000,
    "medianSqmPriceYen": 79000,
    "medianAreaSqm": 45,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 82000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 2
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "奈良",
    "district": "橿原市",
    "layout": "ldk2",
    "medianTradePriceYen": 13500000,
    "medianSqmPriceYen": 218000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＳＲＣ": 3,
      "ＲＣ": 7
    },
    "sampleCount": 10,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "奈良",
    "district": "橿原市",
    "layout": "ldk3",
    "medianTradePriceYen": 16000000,
    "medianSqmPriceYen": 191000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 252000,
        "sampleCount": 10
      },
      "age_31_40": {
        "medianSqmPriceYen": 143000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 27,
    "structureCounts": {
      "ＲＣ": 24,
      "ＳＲＣ": 3
    },
    "sampleCount": 27,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "奈良",
    "district": "葛城市",
    "layout": "ldk3",
    "medianTradePriceYen": 16000000,
    "medianSqmPriceYen": 229000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 2
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "奈良",
    "district": "香芝市",
    "layout": "ldk3",
    "medianTradePriceYen": 24000000,
    "medianSqmPriceYen": 313000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 313000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＲＣ": 7
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "奈良",
    "district": "桜井市",
    "layout": "ldk3",
    "medianTradePriceYen": 7900000,
    "medianSqmPriceYen": 118000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 6
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "奈良",
    "district": "生駒市",
    "layout": "ldk1",
    "medianTradePriceYen": 17000000,
    "medianSqmPriceYen": 378000,
    "medianAreaSqm": 45,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "奈良",
    "district": "生駒市",
    "layout": "ldk2",
    "medianTradePriceYen": 11000000,
    "medianSqmPriceYen": 158000,
    "medianAreaSqm": 60,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 7
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "奈良",
    "district": "生駒市",
    "layout": "ldk3",
    "medianTradePriceYen": 26000000,
    "medianSqmPriceYen": 356000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 482000,
        "sampleCount": 9
      },
      "age_21_30": {
        "medianSqmPriceYen": 300000,
        "sampleCount": 13
      }
    },
    "buildingYearSampleCount": 31,
    "structureCounts": {
      "ＲＣ": 32
    },
    "sampleCount": 32,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "奈良",
    "district": "大和郡山市",
    "layout": "ldk3",
    "medianTradePriceYen": 17000000,
    "medianSqmPriceYen": 259000,
    "medianAreaSqm": 75,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 7
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "奈良",
    "district": "大和高田市",
    "layout": "ldk2",
    "medianTradePriceYen": 14000000,
    "medianSqmPriceYen": 236000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 1
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q2",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "奈良",
    "district": "大和高田市",
    "layout": "ldk3",
    "medianTradePriceYen": 14500000,
    "medianSqmPriceYen": 202000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 286000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 15,
    "structureCounts": {
      "ＲＣ": 11,
      "ＳＲＣ": 1
    },
    "sampleCount": 16,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "奈良",
    "district": "天理市",
    "layout": "ldk3",
    "medianTradePriceYen": 15000000,
    "medianSqmPriceYen": 213000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q4",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "奈良",
    "district": "奈良市",
    "layout": "ldk1",
    "medianTradePriceYen": 14000000,
    "medianSqmPriceYen": 350000,
    "medianAreaSqm": 40,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "奈良",
    "district": "奈良市",
    "layout": "ldk2",
    "medianTradePriceYen": 17000000,
    "medianSqmPriceYen": 274000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 380000,
        "sampleCount": 9
      },
      "age_21_30": {
        "medianSqmPriceYen": 277000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 160000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 24,
    "structureCounts": {
      "ＲＣ": 23,
      "ＳＲＣ": 1
    },
    "sampleCount": 24,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "奈良",
    "district": "奈良市",
    "layout": "ldk3",
    "medianTradePriceYen": 24000000,
    "medianSqmPriceYen": 322000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 579000,
        "sampleCount": 8
      },
      "age_11_20": {
        "medianSqmPriceYen": 557000,
        "sampleCount": 25
      },
      "age_21_30": {
        "medianSqmPriceYen": 288000,
        "sampleCount": 39
      },
      "age_31_40": {
        "medianSqmPriceYen": 167000,
        "sampleCount": 15
      },
      "age_41_plus": {
        "medianSqmPriceYen": 171000,
        "sampleCount": 13
      }
    },
    "buildingYearSampleCount": 100,
    "structureCounts": {
      "ＲＣ": 94,
      "ＳＲＣ": 7
    },
    "sampleCount": 101,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "奈良",
    "district": "北葛城郡王寺町",
    "layout": "ldk3",
    "medianTradePriceYen": 20500000,
    "medianSqmPriceYen": 293000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＲＣ": 8
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "富山",
    "district": "高岡市",
    "layout": "ldk3",
    "medianTradePriceYen": 23500000,
    "medianSqmPriceYen": 288000,
    "medianAreaSqm": 85,
    "ageBands": {},
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＲＣ": 7
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "富山",
    "district": "富山市",
    "layout": "k1",
    "medianTradePriceYen": 6200000,
    "medianSqmPriceYen": 224000,
    "medianAreaSqm": 25,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 6
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "富山",
    "district": "富山市",
    "layout": "ldk2",
    "medianTradePriceYen": 12000000,
    "medianSqmPriceYen": 192000,
    "medianAreaSqm": 63,
    "ageBands": {},
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＳＲＣ": 4,
      "ＲＣ": 6
    },
    "sampleCount": 10,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "富山",
    "district": "富山市",
    "layout": "ldk3",
    "medianTradePriceYen": 33000000,
    "medianSqmPriceYen": 438000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 576000,
        "sampleCount": 15
      },
      "age_11_20": {
        "medianSqmPriceYen": 413000,
        "sampleCount": 10
      },
      "age_21_30": {
        "medianSqmPriceYen": 279000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 37,
    "structureCounts": {
      "ＲＣ": 27,
      "ＳＲＣ": 7,
      "鉄骨造": 3
    },
    "sampleCount": 37,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福井",
    "district": "福井市",
    "layout": "k1",
    "medianTradePriceYen": 4400000,
    "medianSqmPriceYen": 185000,
    "medianAreaSqm": 25,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福井",
    "district": "福井市",
    "layout": "ldk2",
    "medianTradePriceYen": 11000000,
    "medianSqmPriceYen": 183000,
    "medianAreaSqm": 60,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 3,
      "ＳＲＣ": 1
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福井",
    "district": "福井市",
    "layout": "ldk3",
    "medianTradePriceYen": 23000000,
    "medianSqmPriceYen": 257000,
    "medianAreaSqm": 85,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 230000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＳＲＣ": 1,
      "ＲＣ": 9,
      "ＳＲＣ、ＲＣ": 1
    },
    "sampleCount": 11,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "久留米市",
    "layout": "k1",
    "medianTradePriceYen": 2700000,
    "medianSqmPriceYen": 119000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 119000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＲＣ": 2,
      "ＳＲＣ": 8
    },
    "sampleCount": 10,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "久留米市",
    "layout": "ldk1",
    "medianTradePriceYen": 5800000,
    "medianSqmPriceYen": 137000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 138000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 12,
    "structureCounts": {
      "ＳＲＣ": 10,
      "ＲＣ": 2
    },
    "sampleCount": 12,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "久留米市",
    "layout": "ldk2",
    "medianTradePriceYen": 13000000,
    "medianSqmPriceYen": 217000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 193000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 7
    },
    "sampleCount": 11,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "久留米市",
    "layout": "ldk3",
    "medianTradePriceYen": 23000000,
    "medianSqmPriceYen": 274000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 500000,
        "sampleCount": 7
      },
      "age_11_20": {
        "medianSqmPriceYen": 356000,
        "sampleCount": 9
      },
      "age_21_30": {
        "medianSqmPriceYen": 214000,
        "sampleCount": 11
      },
      "age_31_40": {
        "medianSqmPriceYen": 151000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 37,
    "structureCounts": {
      "ＳＲＣ": 17,
      "ＲＣ": 21
    },
    "sampleCount": 38,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "春日市",
    "layout": "ldk2",
    "medianTradePriceYen": 16000000,
    "medianSqmPriceYen": 257000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 233000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＲＣ": 7,
      "ＳＲＣ": 1
    },
    "sampleCount": 9,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "春日市",
    "layout": "ldk3",
    "medianTradePriceYen": 22000000,
    "medianSqmPriceYen": 288000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 340000,
        "sampleCount": 12
      },
      "age_31_40": {
        "medianSqmPriceYen": 254000,
        "sampleCount": 18
      },
      "age_41_plus": {
        "medianSqmPriceYen": 227000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 40,
    "structureCounts": {
      "ＲＣ": 25,
      "ＳＲＣ": 9
    },
    "sampleCount": 43,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "大牟田市",
    "layout": "ldk3",
    "medianTradePriceYen": 9800000,
    "medianSqmPriceYen": 133000,
    "medianAreaSqm": 78,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 158000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 60000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＳＲＣ": 6,
      "ＲＣ": 7
    },
    "sampleCount": 14,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "飯塚市",
    "layout": "ldk2",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 333000,
    "medianAreaSqm": 60,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "飯塚市",
    "layout": "ldk3",
    "medianTradePriceYen": 16000000,
    "medianSqmPriceYen": 213000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 2
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "福岡市（市平均）",
    "layout": "k1",
    "medianTradePriceYen": 14000000,
    "medianSqmPriceYen": 600000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 800000,
        "sampleCount": 80
      },
      "age_11_20": {
        "medianSqmPriceYen": 680000,
        "sampleCount": 147
      },
      "age_21_30": {
        "medianSqmPriceYen": 550000,
        "sampleCount": 150
      },
      "age_31_40": {
        "medianSqmPriceYen": 303000,
        "sampleCount": 82
      },
      "age_41_plus": {
        "medianSqmPriceYen": 308000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 465,
    "structureCounts": {
      "ＳＲＣ": 143,
      "ＲＣ": 320,
      "鉄骨造": 1
    },
    "sampleCount": 470,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "福岡市（市平均）",
    "layout": "ldk1",
    "medianTradePriceYen": 22000000,
    "medianSqmPriceYen": 633000,
    "medianAreaSqm": 30,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 771000,
        "sampleCount": 71
      },
      "age_11_20": {
        "medianSqmPriceYen": 667000,
        "sampleCount": 47
      },
      "age_21_30": {
        "medianSqmPriceYen": 500000,
        "sampleCount": 7
      },
      "age_31_40": {
        "medianSqmPriceYen": 375000,
        "sampleCount": 33
      },
      "age_41_plus": {
        "medianSqmPriceYen": 211000,
        "sampleCount": 22
      }
    },
    "buildingYearSampleCount": 180,
    "structureCounts": {
      "ＲＣ": 137,
      "ＳＲＣ": 42
    },
    "sampleCount": 180,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "福岡市（市平均）",
    "layout": "ldk2",
    "medianTradePriceYen": 23000000,
    "medianSqmPriceYen": 400000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 740000,
        "sampleCount": 29
      },
      "age_11_20": {
        "medianSqmPriceYen": 600000,
        "sampleCount": 25
      },
      "age_21_30": {
        "medianSqmPriceYen": 571000,
        "sampleCount": 24
      },
      "age_31_40": {
        "medianSqmPriceYen": 307000,
        "sampleCount": 70
      },
      "age_41_plus": {
        "medianSqmPriceYen": 282000,
        "sampleCount": 46
      }
    },
    "buildingYearSampleCount": 194,
    "structureCounts": {
      "ＳＲＣ": 56,
      "ＲＣ": 134
    },
    "sampleCount": 199,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "福岡市（市平均）",
    "layout": "ldk3",
    "medianTradePriceYen": 35000000,
    "medianSqmPriceYen": 453000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 624000,
        "sampleCount": 75
      },
      "age_11_20": {
        "medianSqmPriceYen": 529000,
        "sampleCount": 102
      },
      "age_21_30": {
        "medianSqmPriceYen": 463000,
        "sampleCount": 209
      },
      "age_31_40": {
        "medianSqmPriceYen": 314000,
        "sampleCount": 126
      },
      "age_41_plus": {
        "medianSqmPriceYen": 220000,
        "sampleCount": 48
      }
    },
    "buildingYearSampleCount": 560,
    "structureCounts": {
      "ＲＣ": 410,
      "ＳＲＣ": 139,
      "ＳＲＣ、ＲＣ": 1
    },
    "sampleCount": 574,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "福岡市（市平均）",
    "layout": "r1",
    "medianTradePriceYen": 5000000,
    "medianSqmPriceYen": 333000,
    "medianAreaSqm": 15,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 247000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＲＣ": 6,
      "ＳＲＣ": 7
    },
    "sampleCount": 13,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "福岡市城南區",
    "layout": "k1",
    "medianTradePriceYen": 6500000,
    "medianSqmPriceYen": 325000,
    "medianAreaSqm": 20,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 6,
      "ＳＲＣ": 2
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "福岡市城南區",
    "layout": "ldk1",
    "medianTradePriceYen": 9600000,
    "medianSqmPriceYen": 204000,
    "medianAreaSqm": 45,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 1
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "福岡市城南區",
    "layout": "ldk2",
    "medianTradePriceYen": 9300000,
    "medianSqmPriceYen": 185000,
    "medianAreaSqm": 50,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 182000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＲＣ": 11,
      "ＳＲＣ": 3
    },
    "sampleCount": 14,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "福岡市城南區",
    "layout": "ldk3",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 300000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 576000,
        "sampleCount": 5
      },
      "age_21_30": {
        "medianSqmPriceYen": 478000,
        "sampleCount": 11
      },
      "age_31_40": {
        "medianSqmPriceYen": 213000,
        "sampleCount": 15
      }
    },
    "buildingYearSampleCount": 36,
    "structureCounts": {
      "ＲＣ": 30,
      "ＳＲＣ": 6
    },
    "sampleCount": 37,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "福岡市西區",
    "layout": "k1",
    "medianTradePriceYen": 5800000,
    "medianSqmPriceYen": 272000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 210000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＲＣ": 12,
      "ＳＲＣ": 1
    },
    "sampleCount": 13,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "福岡市西區",
    "layout": "ldk1",
    "medianTradePriceYen": 9100000,
    "medianSqmPriceYen": 228000,
    "medianAreaSqm": 45,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 6,
      "ＳＲＣ": 1
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "福岡市西區",
    "layout": "ldk2",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 333000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 293000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＲＣ": 10,
      "ＳＲＣ": 3
    },
    "sampleCount": 13,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "福岡市西區",
    "layout": "ldk3",
    "medianTradePriceYen": 27500000,
    "medianSqmPriceYen": 367000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 567000,
        "sampleCount": 12
      },
      "age_21_30": {
        "medianSqmPriceYen": 382000,
        "sampleCount": 29
      },
      "age_31_40": {
        "medianSqmPriceYen": 296000,
        "sampleCount": 20
      }
    },
    "buildingYearSampleCount": 68,
    "structureCounts": {
      "ＲＣ": 55,
      "ＳＲＣ": 13
    },
    "sampleCount": 68,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "福岡市早良區",
    "layout": "k1",
    "medianTradePriceYen": 7000000,
    "medianSqmPriceYen": 280000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 259000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＳＲＣ": 5,
      "ＲＣ": 4
    },
    "sampleCount": 9,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "福岡市早良區",
    "layout": "ldk1",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 572000,
    "medianAreaSqm": 43,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 2
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "福岡市早良區",
    "layout": "ldk2",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 345000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 473000,
        "sampleCount": 5
      },
      "age_41_plus": {
        "medianSqmPriceYen": 148000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 15,
    "structureCounts": {
      "ＲＣ": 11,
      "ＳＲＣ": 4
    },
    "sampleCount": 15,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "福岡市早良區",
    "layout": "ldk3",
    "medianTradePriceYen": 43000000,
    "medianSqmPriceYen": 526000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 846000,
        "sampleCount": 7
      },
      "age_11_20": {
        "medianSqmPriceYen": 681000,
        "sampleCount": 10
      },
      "age_21_30": {
        "medianSqmPriceYen": 600000,
        "sampleCount": 30
      },
      "age_31_40": {
        "medianSqmPriceYen": 443000,
        "sampleCount": 13
      }
    },
    "buildingYearSampleCount": 64,
    "structureCounts": {
      "ＲＣ": 52,
      "ＳＲＣ": 10
    },
    "sampleCount": 65,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "福岡市中央區",
    "layout": "k1",
    "medianTradePriceYen": 14000000,
    "medianSqmPriceYen": 637000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 840000,
        "sampleCount": 27
      },
      "age_11_20": {
        "medianSqmPriceYen": 680000,
        "sampleCount": 55
      },
      "age_21_30": {
        "medianSqmPriceYen": 600000,
        "sampleCount": 80
      },
      "age_31_40": {
        "medianSqmPriceYen": 360000,
        "sampleCount": 32
      }
    },
    "buildingYearSampleCount": 196,
    "structureCounts": {
      "ＲＣ": 128,
      "ＳＲＣ": 67
    },
    "sampleCount": 196,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "福岡市中央區",
    "layout": "ldk1",
    "medianTradePriceYen": 23000000,
    "medianSqmPriceYen": 657000,
    "medianAreaSqm": 35,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 900000,
        "sampleCount": 23
      },
      "age_11_20": {
        "medianSqmPriceYen": 767000,
        "sampleCount": 11
      },
      "age_31_40": {
        "medianSqmPriceYen": 480000,
        "sampleCount": 13
      },
      "age_41_plus": {
        "medianSqmPriceYen": 400000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 59,
    "structureCounts": {
      "ＲＣ": 42,
      "ＳＲＣ": 17
    },
    "sampleCount": 59,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "福岡市中央區",
    "layout": "ldk2",
    "medianTradePriceYen": 33000000,
    "medianSqmPriceYen": 583000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1182000,
        "sampleCount": 10
      },
      "age_11_20": {
        "medianSqmPriceYen": 800000,
        "sampleCount": 5
      },
      "age_21_30": {
        "medianSqmPriceYen": 754000,
        "sampleCount": 7
      },
      "age_31_40": {
        "medianSqmPriceYen": 550000,
        "sampleCount": 9
      },
      "age_41_plus": {
        "medianSqmPriceYen": 340000,
        "sampleCount": 19
      }
    },
    "buildingYearSampleCount": 50,
    "structureCounts": {
      "ＲＣ": 29,
      "ＳＲＣ": 22
    },
    "sampleCount": 51,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "福岡市中央區",
    "layout": "ldk3",
    "medianTradePriceYen": 47000000,
    "medianSqmPriceYen": 653000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 937000,
        "sampleCount": 17
      },
      "age_11_20": {
        "medianSqmPriceYen": 739000,
        "sampleCount": 12
      },
      "age_21_30": {
        "medianSqmPriceYen": 629000,
        "sampleCount": 56
      },
      "age_31_40": {
        "medianSqmPriceYen": 493000,
        "sampleCount": 18
      },
      "age_41_plus": {
        "medianSqmPriceYen": 352000,
        "sampleCount": 12
      }
    },
    "buildingYearSampleCount": 115,
    "structureCounts": {
      "ＲＣ": 63,
      "ＳＲＣ": 51,
      "ＳＲＣ、ＲＣ": 1
    },
    "sampleCount": 115,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "福岡市中央區",
    "layout": "r1",
    "medianTradePriceYen": 13000000,
    "medianSqmPriceYen": 650000,
    "medianAreaSqm": 20,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 3
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "福岡市東區",
    "layout": "k1",
    "medianTradePriceYen": 15000000,
    "medianSqmPriceYen": 700000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 800000,
        "sampleCount": 20
      },
      "age_11_20": {
        "medianSqmPriceYen": 650000,
        "sampleCount": 13
      },
      "age_21_30": {
        "medianSqmPriceYen": 195000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 160000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 46,
    "structureCounts": {
      "ＳＲＣ": 7,
      "ＲＣ": 40
    },
    "sampleCount": 47,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "福岡市東區",
    "layout": "ldk1",
    "medianTradePriceYen": 19500000,
    "medianSqmPriceYen": 633000,
    "medianAreaSqm": 30,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 633000,
        "sampleCount": 7
      },
      "age_11_20": {
        "medianSqmPriceYen": 633000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 16,
    "structureCounts": {
      "ＲＣ": 15,
      "ＳＲＣ": 1
    },
    "sampleCount": 16,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "福岡市東區",
    "layout": "ldk2",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 303000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 634000,
        "sampleCount": 6
      },
      "age_11_20": {
        "medianSqmPriceYen": 450000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 200000,
        "sampleCount": 16
      }
    },
    "buildingYearSampleCount": 33,
    "structureCounts": {
      "ＳＲＣ": 8,
      "ＲＣ": 27
    },
    "sampleCount": 36,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "福岡市東區",
    "layout": "ldk3",
    "medianTradePriceYen": 30000000,
    "medianSqmPriceYen": 394000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 588000,
        "sampleCount": 26
      },
      "age_11_20": {
        "medianSqmPriceYen": 471000,
        "sampleCount": 24
      },
      "age_21_30": {
        "medianSqmPriceYen": 347000,
        "sampleCount": 36
      },
      "age_31_40": {
        "medianSqmPriceYen": 319000,
        "sampleCount": 26
      },
      "age_41_plus": {
        "medianSqmPriceYen": 88000,
        "sampleCount": 11
      }
    },
    "buildingYearSampleCount": 123,
    "structureCounts": {
      "ＲＣ": 94,
      "ＳＲＣ": 32
    },
    "sampleCount": 128,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "福岡市東區",
    "layout": "r1",
    "medianTradePriceYen": 2700000,
    "medianSqmPriceYen": 177000,
    "medianAreaSqm": 15,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 173000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＳＲＣ": 4,
      "ＲＣ": 2
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "福岡市南區",
    "layout": "k1",
    "medianTradePriceYen": 8300000,
    "medianSqmPriceYen": 350000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 440000,
        "sampleCount": 9
      },
      "age_31_40": {
        "medianSqmPriceYen": 275000,
        "sampleCount": 11
      }
    },
    "buildingYearSampleCount": 27,
    "structureCounts": {
      "ＲＣ": 18,
      "ＳＲＣ": 5
    },
    "sampleCount": 27,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "福岡市南區",
    "layout": "ldk1",
    "medianTradePriceYen": 13000000,
    "medianSqmPriceYen": 325000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 196000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 15,
    "structureCounts": {
      "ＳＲＣ": 6,
      "ＲＣ": 8
    },
    "sampleCount": 15,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "福岡市南區",
    "layout": "ldk2",
    "medianTradePriceYen": 17000000,
    "medianSqmPriceYen": 320000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 260000,
        "sampleCount": 15
      },
      "age_41_plus": {
        "medianSqmPriceYen": 176000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 27,
    "structureCounts": {
      "ＲＣ": 15,
      "ＳＲＣ": 4
    },
    "sampleCount": 27,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "福岡市南區",
    "layout": "ldk3",
    "medianTradePriceYen": 32000000,
    "medianSqmPriceYen": 415000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 523000,
        "sampleCount": 15
      },
      "age_11_20": {
        "medianSqmPriceYen": 467000,
        "sampleCount": 21
      },
      "age_21_30": {
        "medianSqmPriceYen": 405000,
        "sampleCount": 20
      },
      "age_31_40": {
        "medianSqmPriceYen": 304000,
        "sampleCount": 24
      },
      "age_41_plus": {
        "medianSqmPriceYen": 160000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 88,
    "structureCounts": {
      "ＲＣ": 63,
      "ＳＲＣ": 13
    },
    "sampleCount": 94,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "福岡市南區",
    "layout": "r1",
    "medianTradePriceYen": 2800000,
    "medianSqmPriceYen": 187000,
    "medianAreaSqm": 15,
    "ageBands": {},
    "buildingYearSampleCount": 4,
    "structureCounts": {
      "ＳＲＣ": 3,
      "ＲＣ": 1
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "福岡市博多區",
    "layout": "k1",
    "medianTradePriceYen": 15000000,
    "medianSqmPriceYen": 650000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 800000,
        "sampleCount": 32
      },
      "age_11_20": {
        "medianSqmPriceYen": 683000,
        "sampleCount": 70
      },
      "age_21_30": {
        "medianSqmPriceYen": 600000,
        "sampleCount": 50
      },
      "age_31_40": {
        "medianSqmPriceYen": 305000,
        "sampleCount": 22
      }
    },
    "buildingYearSampleCount": 176,
    "structureCounts": {
      "ＲＣ": 120,
      "ＳＲＣ": 57,
      "鉄骨造": 1
    },
    "sampleCount": 179,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "福岡市博多區",
    "layout": "ldk1",
    "medianTradePriceYen": 22000000,
    "medianSqmPriceYen": 683000,
    "medianAreaSqm": 30,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 767000,
        "sampleCount": 35
      },
      "age_11_20": {
        "medianSqmPriceYen": 667000,
        "sampleCount": 27
      },
      "age_31_40": {
        "medianSqmPriceYen": 333000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 78,
    "structureCounts": {
      "ＲＣ": 63,
      "ＳＲＣ": 15
    },
    "sampleCount": 78,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "福岡市博多區",
    "layout": "ldk2",
    "medianTradePriceYen": 27000000,
    "medianSqmPriceYen": 523000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 613000,
        "sampleCount": 8
      },
      "age_11_20": {
        "medianSqmPriceYen": 622000,
        "sampleCount": 13
      },
      "age_21_30": {
        "medianSqmPriceYen": 650000,
        "sampleCount": 6
      },
      "age_31_40": {
        "medianSqmPriceYen": 319000,
        "sampleCount": 10
      },
      "age_41_plus": {
        "medianSqmPriceYen": 331000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 43,
    "structureCounts": {
      "ＲＣ": 31,
      "ＳＲＣ": 12
    },
    "sampleCount": 43,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "福岡市博多區",
    "layout": "ldk3",
    "medianTradePriceYen": 32000000,
    "medianSqmPriceYen": 443000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 522000,
        "sampleCount": 6
      },
      "age_11_20": {
        "medianSqmPriceYen": 500000,
        "sampleCount": 18
      },
      "age_21_30": {
        "medianSqmPriceYen": 438000,
        "sampleCount": 27
      },
      "age_31_40": {
        "medianSqmPriceYen": 248000,
        "sampleCount": 10
      },
      "age_41_plus": {
        "medianSqmPriceYen": 300000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 66,
    "structureCounts": {
      "ＲＣ": 53,
      "ＳＲＣ": 14
    },
    "sampleCount": 67,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "福岡市博多區",
    "layout": "r1",
    "medianTradePriceYen": 6300000,
    "medianSqmPriceYen": 353000,
    "medianAreaSqm": 18,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 324000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＳＲＣ": 5,
      "ＲＣ": 4,
      "鉄骨造": 1
    },
    "sampleCount": 10,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "北九州市",
    "layout": "k1",
    "medianTradePriceYen": 2400000,
    "medianSqmPriceYen": 104000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 96000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 4
    },
    "sampleCount": 10,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "北九州市",
    "layout": "ldk1",
    "medianTradePriceYen": 4300000,
    "medianSqmPriceYen": 101000,
    "medianAreaSqm": 45,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 56000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＲＣ": 3,
      "ＳＲＣ": 6
    },
    "sampleCount": 10,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "北九州市",
    "layout": "ldk2",
    "medianTradePriceYen": 11000000,
    "medianSqmPriceYen": 176000,
    "medianAreaSqm": 65,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 271000,
        "sampleCount": 6
      },
      "age_21_30": {
        "medianSqmPriceYen": 207000,
        "sampleCount": 8
      },
      "age_31_40": {
        "medianSqmPriceYen": 144000,
        "sampleCount": 22
      },
      "age_41_plus": {
        "medianSqmPriceYen": 100000,
        "sampleCount": 14
      }
    },
    "buildingYearSampleCount": 54,
    "structureCounts": {
      "ＲＣ": 25,
      "ＳＲＣ": 27
    },
    "sampleCount": 56,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "北九州市",
    "layout": "ldk3",
    "medianTradePriceYen": 16000000,
    "medianSqmPriceYen": 214000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 388000,
        "sampleCount": 27
      },
      "age_11_20": {
        "medianSqmPriceYen": 284000,
        "sampleCount": 58
      },
      "age_21_30": {
        "medianSqmPriceYen": 200000,
        "sampleCount": 73
      },
      "age_31_40": {
        "medianSqmPriceYen": 132000,
        "sampleCount": 57
      },
      "age_41_plus": {
        "medianSqmPriceYen": 95000,
        "sampleCount": 23
      }
    },
    "buildingYearSampleCount": 238,
    "structureCounts": {
      "ＳＲＣ": 81,
      "ＲＣ": 157,
      "鉄骨造": 1
    },
    "sampleCount": 246,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "北九州市戸畑区",
    "layout": "ldk2",
    "medianTradePriceYen": 6900000,
    "medianSqmPriceYen": 92000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 1
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "北九州市戸畑区",
    "layout": "ldk3",
    "medianTradePriceYen": 19000000,
    "medianSqmPriceYen": 257000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 308000,
        "sampleCount": 8
      },
      "age_21_30": {
        "medianSqmPriceYen": 185000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 20,
    "structureCounts": {
      "ＳＲＣ": 5,
      "ＲＣ": 15,
      "鉄骨造": 1
    },
    "sampleCount": 21,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "北九州市若松区",
    "layout": "ldk3",
    "medianTradePriceYen": 10500000,
    "medianSqmPriceYen": 149000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＳＲＣ": 6,
      "ＲＣ": 4
    },
    "sampleCount": 10,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "北九州市小倉南区",
    "layout": "ldk2",
    "medianTradePriceYen": 9500000,
    "medianSqmPriceYen": 146000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 2,
      "ＳＲＣ": 3
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "北九州市小倉南区",
    "layout": "ldk3",
    "medianTradePriceYen": 12000000,
    "medianSqmPriceYen": 171000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 224000,
        "sampleCount": 5
      },
      "age_21_30": {
        "medianSqmPriceYen": 172000,
        "sampleCount": 14
      },
      "age_31_40": {
        "medianSqmPriceYen": 157000,
        "sampleCount": 11
      }
    },
    "buildingYearSampleCount": 35,
    "structureCounts": {
      "ＳＲＣ": 6,
      "ＲＣ": 30
    },
    "sampleCount": 37,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "北九州市小倉北区",
    "layout": "k1",
    "medianTradePriceYen": 2600000,
    "medianSqmPriceYen": 112000,
    "medianAreaSqm": 20,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 3
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "北九州市小倉北区",
    "layout": "ldk1",
    "medianTradePriceYen": 4300000,
    "medianSqmPriceYen": 101000,
    "medianAreaSqm": 45,
    "ageBands": {},
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＲＣ": 1,
      "ＳＲＣ": 6
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "北九州市小倉北区",
    "layout": "ldk2",
    "medianTradePriceYen": 12000000,
    "medianSqmPriceYen": 185000,
    "medianAreaSqm": 65,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 163000,
        "sampleCount": 10
      },
      "age_41_plus": {
        "medianSqmPriceYen": 145000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 25,
    "structureCounts": {
      "ＳＲＣ": 16,
      "ＲＣ": 7
    },
    "sampleCount": 27,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "北九州市小倉北区",
    "layout": "ldk3",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 249000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 431000,
        "sampleCount": 9
      },
      "age_11_20": {
        "medianSqmPriceYen": 300000,
        "sampleCount": 17
      },
      "age_21_30": {
        "medianSqmPriceYen": 247000,
        "sampleCount": 14
      },
      "age_31_40": {
        "medianSqmPriceYen": 183000,
        "sampleCount": 14
      },
      "age_41_plus": {
        "medianSqmPriceYen": 163000,
        "sampleCount": 12
      }
    },
    "buildingYearSampleCount": 66,
    "structureCounts": {
      "ＲＣ": 37,
      "ＳＲＣ": 29
    },
    "sampleCount": 70,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "北九州市八幡西区",
    "layout": "k1",
    "medianTradePriceYen": 2400000,
    "medianSqmPriceYen": 120000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 120000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 3
    },
    "sampleCount": 8,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "北九州市八幡西区",
    "layout": "ldk2",
    "medianTradePriceYen": 9200000,
    "medianSqmPriceYen": 144000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 12,
    "structureCounts": {
      "ＳＲＣ": 7,
      "ＲＣ": 5
    },
    "sampleCount": 12,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "北九州市八幡西区",
    "layout": "ldk3",
    "medianTradePriceYen": 13000000,
    "medianSqmPriceYen": 200000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 372000,
        "sampleCount": 6
      },
      "age_11_20": {
        "medianSqmPriceYen": 275000,
        "sampleCount": 14
      },
      "age_21_30": {
        "medianSqmPriceYen": 200000,
        "sampleCount": 20
      },
      "age_31_40": {
        "medianSqmPriceYen": 105000,
        "sampleCount": 18
      },
      "age_41_plus": {
        "medianSqmPriceYen": 47000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 63,
    "structureCounts": {
      "ＳＲＣ": 17,
      "ＲＣ": 45
    },
    "sampleCount": 63,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "北九州市八幡東区",
    "layout": "ldk3",
    "medianTradePriceYen": 16000000,
    "medianSqmPriceYen": 220000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 353000,
        "sampleCount": 5
      },
      "age_11_20": {
        "medianSqmPriceYen": 238000,
        "sampleCount": 5
      },
      "age_21_30": {
        "medianSqmPriceYen": 211000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 123000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 23,
    "structureCounts": {
      "ＳＲＣ": 12,
      "ＲＣ": 11
    },
    "sampleCount": 24,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "北九州市門司区",
    "layout": "ldk2",
    "medianTradePriceYen": 10000000,
    "medianSqmPriceYen": 143000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福岡",
    "district": "北九州市門司区",
    "layout": "ldk3",
    "medianTradePriceYen": 18000000,
    "medianSqmPriceYen": 253000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 276000,
        "sampleCount": 6
      },
      "age_21_30": {
        "medianSqmPriceYen": 151000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 21,
    "structureCounts": {
      "ＳＲＣ": 6,
      "ＲＣ": 15
    },
    "sampleCount": 21,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福島",
    "district": "郡山市",
    "layout": "ldk2",
    "medianTradePriceYen": 11800000,
    "medianSqmPriceYen": 186000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＲＣ": 3,
      "ＳＲＣ": 5
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福島",
    "district": "郡山市",
    "layout": "ldk3",
    "medianTradePriceYen": 17000000,
    "medianSqmPriceYen": 243000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 313000,
        "sampleCount": 5
      },
      "age_21_30": {
        "medianSqmPriceYen": 215000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 118000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 17,
    "structureCounts": {
      "ＲＣ": 10,
      "ＳＲＣ": 6
    },
    "sampleCount": 17,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福島",
    "district": "磐城市",
    "layout": "ldk2",
    "medianTradePriceYen": 30000000,
    "medianSqmPriceYen": 545000,
    "medianAreaSqm": 60,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 1,
      "ＲＣ": 4
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福島",
    "district": "磐城市",
    "layout": "ldk3",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 280000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 347000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 13,
    "structureCounts": {
      "ＳＲＣ": 4,
      "ＲＣ": 12
    },
    "sampleCount": 16,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福島",
    "district": "福島市",
    "layout": "k1",
    "medianTradePriceYen": 3100000,
    "medianSqmPriceYen": 111000,
    "medianAreaSqm": 25,
    "ageBands": {},
    "buildingYearSampleCount": 3,
    "structureCounts": {
      "ＳＲＣ": 3,
      "ＲＣ": 1
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福島",
    "district": "福島市",
    "layout": "ldk1",
    "medianTradePriceYen": 7800000,
    "medianSqmPriceYen": 176000,
    "medianAreaSqm": 45,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 176000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＳＲＣ": 5,
      "ＲＣ": 3
    },
    "sampleCount": 8,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福島",
    "district": "福島市",
    "layout": "ldk2",
    "medianTradePriceYen": 9000000,
    "medianSqmPriceYen": 156000,
    "medianAreaSqm": 60,
    "ageBands": {},
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＳＲＣ": 5,
      "ＲＣ": 3
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "福島",
    "district": "福島市",
    "layout": "ldk3",
    "medianTradePriceYen": 17000000,
    "medianSqmPriceYen": 243000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 267000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 101000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 15,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 10
    },
    "sampleCount": 15,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "芦屋市",
    "layout": "ldk1",
    "medianTradePriceYen": 19000000,
    "medianSqmPriceYen": 430000,
    "medianAreaSqm": 43,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 525000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 5
    },
    "sampleCount": 10,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "芦屋市",
    "layout": "ldk2",
    "medianTradePriceYen": 28000000,
    "medianSqmPriceYen": 500000,
    "medianAreaSqm": 65,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 707000,
        "sampleCount": 5
      },
      "age_21_30": {
        "medianSqmPriceYen": 560000,
        "sampleCount": 7
      },
      "age_31_40": {
        "medianSqmPriceYen": 424000,
        "sampleCount": 10
      },
      "age_41_plus": {
        "medianSqmPriceYen": 138000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 29,
    "structureCounts": {
      "ＲＣ": 23,
      "ＳＲＣ": 6
    },
    "sampleCount": 29,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "芦屋市",
    "layout": "ldk3",
    "medianTradePriceYen": 35500000,
    "medianSqmPriceYen": 444000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 882000,
        "sampleCount": 9
      },
      "age_11_20": {
        "medianSqmPriceYen": 585000,
        "sampleCount": 10
      },
      "age_21_30": {
        "medianSqmPriceYen": 462000,
        "sampleCount": 36
      },
      "age_31_40": {
        "medianSqmPriceYen": 373000,
        "sampleCount": 13
      },
      "age_41_plus": {
        "medianSqmPriceYen": 238000,
        "sampleCount": 15
      }
    },
    "buildingYearSampleCount": 83,
    "structureCounts": {
      "ＲＣ": 76,
      "ＳＲＣ": 8
    },
    "sampleCount": 84,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "伊丹市",
    "layout": "ldk1",
    "medianTradePriceYen": 5000000,
    "medianSqmPriceYen": 125000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 113000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 7
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "伊丹市",
    "layout": "ldk2",
    "medianTradePriceYen": 15500000,
    "medianSqmPriceYen": 267000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 317000,
        "sampleCount": 7
      },
      "age_31_40": {
        "medianSqmPriceYen": 200000,
        "sampleCount": 11
      }
    },
    "buildingYearSampleCount": 26,
    "structureCounts": {
      "ＲＣ": 22,
      "ＳＲＣ": 3
    },
    "sampleCount": 26,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "伊丹市",
    "layout": "ldk3",
    "medianTradePriceYen": 27500000,
    "medianSqmPriceYen": 373000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 686000,
        "sampleCount": 5
      },
      "age_11_20": {
        "medianSqmPriceYen": 483000,
        "sampleCount": 6
      },
      "age_21_30": {
        "medianSqmPriceYen": 375000,
        "sampleCount": 21
      },
      "age_31_40": {
        "medianSqmPriceYen": 296000,
        "sampleCount": 10
      },
      "age_41_plus": {
        "medianSqmPriceYen": 212000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 49,
    "structureCounts": {
      "ＲＣ": 33,
      "ＳＲＣ": 16
    },
    "sampleCount": 50,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "加古川市",
    "layout": "ldk2",
    "medianTradePriceYen": 10000000,
    "medianSqmPriceYen": 167000,
    "medianAreaSqm": 60,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 3
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "加古川市",
    "layout": "ldk3",
    "medianTradePriceYen": 11500000,
    "medianSqmPriceYen": 171000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 275000,
        "sampleCount": 9
      },
      "age_31_40": {
        "medianSqmPriceYen": 120000,
        "sampleCount": 17
      },
      "age_41_plus": {
        "medianSqmPriceYen": 34000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 40,
    "structureCounts": {
      "ＳＲＣ": 12,
      "ＲＣ": 31
    },
    "sampleCount": 44,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "三田市",
    "layout": "ldk2",
    "medianTradePriceYen": 14000000,
    "medianSqmPriceYen": 215000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 215000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＳＲＣ": 7,
      "ＲＣ": 4
    },
    "sampleCount": 11,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "三田市",
    "layout": "ldk3",
    "medianTradePriceYen": 16000000,
    "medianSqmPriceYen": 189000,
    "medianAreaSqm": 85,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 258000,
        "sampleCount": 10
      },
      "age_31_40": {
        "medianSqmPriceYen": 165000,
        "sampleCount": 25
      }
    },
    "buildingYearSampleCount": 38,
    "structureCounts": {
      "ＳＲＣ": 25,
      "ＲＣ": 15,
      "鉄骨造": 1
    },
    "sampleCount": 41,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "神戶市（市平均）",
    "layout": "k1",
    "medianTradePriceYen": 19000000,
    "medianSqmPriceYen": 900000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 950000,
        "sampleCount": 199
      },
      "age_11_20": {
        "medianSqmPriceYen": 800000,
        "sampleCount": 80
      },
      "age_21_30": {
        "medianSqmPriceYen": 600000,
        "sampleCount": 20
      },
      "age_31_40": {
        "medianSqmPriceYen": 250000,
        "sampleCount": 17
      },
      "age_41_plus": {
        "medianSqmPriceYen": 236000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 321,
    "structureCounts": {
      "ＲＣ": 302,
      "鉄骨造": 1,
      "ＳＲＣ": 21
    },
    "sampleCount": 325,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "神戶市（市平均）",
    "layout": "ldk1",
    "medianTradePriceYen": 27000000,
    "medianSqmPriceYen": 671000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 859000,
        "sampleCount": 34
      },
      "age_11_20": {
        "medianSqmPriceYen": 740000,
        "sampleCount": 21
      },
      "age_21_30": {
        "medianSqmPriceYen": 571000,
        "sampleCount": 18
      },
      "age_31_40": {
        "medianSqmPriceYen": 250000,
        "sampleCount": 17
      },
      "age_41_plus": {
        "medianSqmPriceYen": 247000,
        "sampleCount": 12
      }
    },
    "buildingYearSampleCount": 102,
    "structureCounts": {
      "ＳＲＣ": 19,
      "ＲＣ": 77,
      "鉄骨造": 4
    },
    "sampleCount": 104,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "神戶市（市平均）",
    "layout": "ldk2",
    "medianTradePriceYen": 23000000,
    "medianSqmPriceYen": 400000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 836000,
        "sampleCount": 41
      },
      "age_11_20": {
        "medianSqmPriceYen": 619000,
        "sampleCount": 38
      },
      "age_21_30": {
        "medianSqmPriceYen": 478000,
        "sampleCount": 86
      },
      "age_31_40": {
        "medianSqmPriceYen": 252000,
        "sampleCount": 72
      },
      "age_41_plus": {
        "medianSqmPriceYen": 108000,
        "sampleCount": 43
      }
    },
    "buildingYearSampleCount": 280,
    "structureCounts": {
      "ＲＣ": 192,
      "ＳＲＣ": 69,
      "鉄骨造": 1
    },
    "sampleCount": 284,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "神戶市（市平均）",
    "layout": "ldk3",
    "medianTradePriceYen": 30000000,
    "medianSqmPriceYen": 400000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 827000,
        "sampleCount": 52
      },
      "age_11_20": {
        "medianSqmPriceYen": 554000,
        "sampleCount": 112
      },
      "age_21_30": {
        "medianSqmPriceYen": 427000,
        "sampleCount": 174
      },
      "age_31_40": {
        "medianSqmPriceYen": 236000,
        "sampleCount": 136
      },
      "age_41_plus": {
        "medianSqmPriceYen": 103000,
        "sampleCount": 73
      }
    },
    "buildingYearSampleCount": 547,
    "structureCounts": {
      "ＳＲＣ": 159,
      "ＲＣ": 370,
      "鉄骨造": 1
    },
    "sampleCount": 563,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "神戶市（市平均）",
    "layout": "r1",
    "medianTradePriceYen": 5100000,
    "medianSqmPriceYen": 340000,
    "medianAreaSqm": 20,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 4,
      "鉄骨造": 1
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "神戶市須磨區",
    "layout": "ldk2",
    "medianTradePriceYen": 11000000,
    "medianSqmPriceYen": 220000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 258000,
        "sampleCount": 6
      },
      "age_31_40": {
        "medianSqmPriceYen": 220000,
        "sampleCount": 5
      },
      "age_41_plus": {
        "medianSqmPriceYen": 71000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 25,
    "structureCounts": {
      "ＲＣ": 23,
      "ＳＲＣ": 2
    },
    "sampleCount": 27,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "神戶市須磨區",
    "layout": "ldk3",
    "medianTradePriceYen": 15000000,
    "medianSqmPriceYen": 189000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 600000,
        "sampleCount": 7
      },
      "age_11_20": {
        "medianSqmPriceYen": 594000,
        "sampleCount": 8
      },
      "age_31_40": {
        "medianSqmPriceYen": 211000,
        "sampleCount": 11
      },
      "age_41_plus": {
        "medianSqmPriceYen": 71000,
        "sampleCount": 30
      }
    },
    "buildingYearSampleCount": 60,
    "structureCounts": {
      "ＲＣ": 44,
      "ＳＲＣ": 15
    },
    "sampleCount": 63,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "神戶市垂水區",
    "layout": "ldk1",
    "medianTradePriceYen": 6700000,
    "medianSqmPriceYen": 138000,
    "medianAreaSqm": 50,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 2
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "神戶市垂水區",
    "layout": "ldk2",
    "medianTradePriceYen": 21500000,
    "medianSqmPriceYen": 287000,
    "medianAreaSqm": 65,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 850000,
        "sampleCount": 15
      },
      "age_31_40": {
        "medianSqmPriceYen": 218000,
        "sampleCount": 8
      },
      "age_41_plus": {
        "medianSqmPriceYen": 68000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 35,
    "structureCounts": {
      "ＲＣ": 17,
      "ＳＲＣ": 4
    },
    "sampleCount": 36,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "神戶市垂水區",
    "layout": "ldk3",
    "medianTradePriceYen": 18000000,
    "medianSqmPriceYen": 240000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 475000,
        "sampleCount": 15
      },
      "age_21_30": {
        "medianSqmPriceYen": 290000,
        "sampleCount": 18
      },
      "age_31_40": {
        "medianSqmPriceYen": 200000,
        "sampleCount": 23
      },
      "age_41_plus": {
        "medianSqmPriceYen": 45000,
        "sampleCount": 12
      }
    },
    "buildingYearSampleCount": 70,
    "structureCounts": {
      "ＲＣ": 47,
      "ＳＲＣ": 12
    },
    "sampleCount": 71,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "神戶市西區",
    "layout": "ldk2",
    "medianTradePriceYen": 14000000,
    "medianSqmPriceYen": 224000,
    "medianAreaSqm": 63,
    "ageBands": {},
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＳＲＣ": 4,
      "ＲＣ": 4
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "神戶市西區",
    "layout": "ldk3",
    "medianTradePriceYen": 22500000,
    "medianSqmPriceYen": 253000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 373000,
        "sampleCount": 15
      },
      "age_21_30": {
        "medianSqmPriceYen": 281000,
        "sampleCount": 14
      },
      "age_31_40": {
        "medianSqmPriceYen": 218000,
        "sampleCount": 34
      }
    },
    "buildingYearSampleCount": 68,
    "structureCounts": {
      "ＳＲＣ": 25,
      "ＲＣ": 35
    },
    "sampleCount": 72,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "神戶市中央區",
    "layout": "k1",
    "medianTradePriceYen": 19000000,
    "medianSqmPriceYen": 880000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 950000,
        "sampleCount": 97
      },
      "age_11_20": {
        "medianSqmPriceYen": 829000,
        "sampleCount": 57
      },
      "age_21_30": {
        "medianSqmPriceYen": 629000,
        "sampleCount": 17
      }
    },
    "buildingYearSampleCount": 178,
    "structureCounts": {
      "ＲＣ": 162,
      "ＳＲＣ": 17
    },
    "sampleCount": 179,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "神戶市中央區",
    "layout": "ldk1",
    "medianTradePriceYen": 28500000,
    "medianSqmPriceYen": 755000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 876000,
        "sampleCount": 10
      },
      "age_11_20": {
        "medianSqmPriceYen": 778000,
        "sampleCount": 15
      },
      "age_21_30": {
        "medianSqmPriceYen": 575000,
        "sampleCount": 11
      },
      "age_31_40": {
        "medianSqmPriceYen": 250000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 44,
    "structureCounts": {
      "ＲＣ": 35,
      "ＳＲＣ": 11
    },
    "sampleCount": 46,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "神戶市中央區",
    "layout": "ldk2",
    "medianTradePriceYen": 39500000,
    "medianSqmPriceYen": 687000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 918000,
        "sampleCount": 18
      },
      "age_11_20": {
        "medianSqmPriceYen": 767000,
        "sampleCount": 19
      },
      "age_21_30": {
        "medianSqmPriceYen": 550000,
        "sampleCount": 29
      },
      "age_31_40": {
        "medianSqmPriceYen": 408000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 74,
    "structureCounts": {
      "ＳＲＣ": 23,
      "ＲＣ": 49,
      "鉄骨造": 1
    },
    "sampleCount": 74,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "神戶市中央區",
    "layout": "ldk3",
    "medianTradePriceYen": 50000000,
    "medianSqmPriceYen": 682000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1020000,
        "sampleCount": 22
      },
      "age_11_20": {
        "medianSqmPriceYen": 824000,
        "sampleCount": 20
      },
      "age_21_30": {
        "medianSqmPriceYen": 571000,
        "sampleCount": 21
      },
      "age_31_40": {
        "medianSqmPriceYen": 404000,
        "sampleCount": 8
      },
      "age_41_plus": {
        "medianSqmPriceYen": 286000,
        "sampleCount": 13
      }
    },
    "buildingYearSampleCount": 84,
    "structureCounts": {
      "ＲＣ": 57,
      "ＳＲＣ": 26,
      "鉄骨造": 1
    },
    "sampleCount": 85,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "神戶市中央區",
    "layout": "r1",
    "medianTradePriceYen": 4800000,
    "medianSqmPriceYen": 320000,
    "medianAreaSqm": 15,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 1,
      "鉄骨造": 1
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "神戶市長田區",
    "layout": "k1",
    "medianTradePriceYen": 18000000,
    "medianSqmPriceYen": 900000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 900000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＲＣ": 8,
      "ＳＲＣ": 2
    },
    "sampleCount": 10,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "神戶市長田區",
    "layout": "ldk1",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 425000,
    "medianAreaSqm": 45,
    "ageBands": {},
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＲＣ": 6,
      "鉄骨造": 3
    },
    "sampleCount": 9,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "神戶市長田區",
    "layout": "ldk2",
    "medianTradePriceYen": 9100000,
    "medianSqmPriceYen": 173000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 214000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 125000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 14,
    "structureCounts": {
      "ＲＣ": 10,
      "ＳＲＣ": 4
    },
    "sampleCount": 14,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "神戶市長田區",
    "layout": "ldk3",
    "medianTradePriceYen": 29000000,
    "medianSqmPriceYen": 400000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 505000,
        "sampleCount": 5
      },
      "age_21_30": {
        "medianSqmPriceYen": 377000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 17,
    "structureCounts": {
      "ＳＲＣ": 9,
      "ＲＣ": 8
    },
    "sampleCount": 17,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "神戶市東灘區",
    "layout": "k1",
    "medianTradePriceYen": 9500000,
    "medianSqmPriceYen": 378000,
    "medianAreaSqm": 25,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 6
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "神戶市東灘區",
    "layout": "ldk1",
    "medianTradePriceYen": 15000000,
    "medianSqmPriceYen": 378000,
    "medianAreaSqm": 40,
    "ageBands": {},
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 7
    },
    "sampleCount": 9,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "神戶市東灘區",
    "layout": "ldk2",
    "medianTradePriceYen": 23500000,
    "medianSqmPriceYen": 385000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 539000,
        "sampleCount": 18
      },
      "age_31_40": {
        "medianSqmPriceYen": 367000,
        "sampleCount": 27
      },
      "age_41_plus": {
        "medianSqmPriceYen": 235000,
        "sampleCount": 16
      }
    },
    "buildingYearSampleCount": 66,
    "structureCounts": {
      "ＲＣ": 45,
      "ＳＲＣ": 20
    },
    "sampleCount": 66,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "神戶市東灘區",
    "layout": "ldk3",
    "medianTradePriceYen": 38500000,
    "medianSqmPriceYen": 471000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 853000,
        "sampleCount": 13
      },
      "age_11_20": {
        "medianSqmPriceYen": 693000,
        "sampleCount": 23
      },
      "age_21_30": {
        "medianSqmPriceYen": 483000,
        "sampleCount": 68
      },
      "age_31_40": {
        "medianSqmPriceYen": 378000,
        "sampleCount": 34
      },
      "age_41_plus": {
        "medianSqmPriceYen": 357000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 144,
    "structureCounts": {
      "ＳＲＣ": 35,
      "ＲＣ": 110
    },
    "sampleCount": 146,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "神戶市灘區",
    "layout": "k1",
    "medianTradePriceYen": 12500000,
    "medianSqmPriceYen": 437000,
    "medianAreaSqm": 25,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 1
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "神戶市灘區",
    "layout": "ldk1",
    "medianTradePriceYen": 17000000,
    "medianSqmPriceYen": 493000,
    "medianAreaSqm": 35,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＳＲＣ": 3,
      "ＲＣ": 2,
      "鉄骨造": 1
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "神戶市灘區",
    "layout": "ldk2",
    "medianTradePriceYen": 22500000,
    "medianSqmPriceYen": 409000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 490000,
        "sampleCount": 10
      },
      "age_41_plus": {
        "medianSqmPriceYen": 111000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 26,
    "structureCounts": {
      "ＲＣ": 20,
      "ＳＲＣ": 3
    },
    "sampleCount": 26,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "神戶市灘區",
    "layout": "ldk3",
    "medianTradePriceYen": 45500000,
    "medianSqmPriceYen": 613000,
    "medianAreaSqm": 73,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 680000,
        "sampleCount": 16
      },
      "age_21_30": {
        "medianSqmPriceYen": 563000,
        "sampleCount": 16
      },
      "age_31_40": {
        "medianSqmPriceYen": 514000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 44,
    "structureCounts": {
      "ＲＣ": 30,
      "ＳＲＣ": 15
    },
    "sampleCount": 48,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "神戶市兵庫區",
    "layout": "k1",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 950000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 1000000,
        "sampleCount": 95
      },
      "age_11_20": {
        "medianSqmPriceYen": 760000,
        "sampleCount": 19
      },
      "age_31_40": {
        "medianSqmPriceYen": 250000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 120,
    "structureCounts": {
      "ＲＣ": 119,
      "鉄骨造": 1,
      "ＳＲＣ": 2
    },
    "sampleCount": 122,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "神戶市兵庫區",
    "layout": "ldk1",
    "medianTradePriceYen": 30000000,
    "medianSqmPriceYen": 857000,
    "medianAreaSqm": 35,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 857000,
        "sampleCount": 18
      }
    },
    "buildingYearSampleCount": 26,
    "structureCounts": {
      "ＲＣ": 24,
      "ＳＲＣ": 2
    },
    "sampleCount": 26,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "神戶市兵庫區",
    "layout": "ldk2",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 385000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 393000,
        "sampleCount": 10
      },
      "age_31_40": {
        "medianSqmPriceYen": 291000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 21,
    "structureCounts": {
      "ＲＣ": 13,
      "ＳＲＣ": 8
    },
    "sampleCount": 21,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "神戶市兵庫區",
    "layout": "ldk3",
    "medianTradePriceYen": 31000000,
    "medianSqmPriceYen": 477000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 477000,
        "sampleCount": 9
      },
      "age_21_30": {
        "medianSqmPriceYen": 453000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 18,
    "structureCounts": {
      "ＲＣ": 13,
      "ＳＲＣ": 5
    },
    "sampleCount": 18,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "神戶市北區",
    "layout": "ldk1",
    "medianTradePriceYen": 4900000,
    "medianSqmPriceYen": 113000,
    "medianAreaSqm": 45,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 5
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "神戶市北區",
    "layout": "ldk2",
    "medianTradePriceYen": 6400000,
    "medianSqmPriceYen": 109000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 153000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＲＣ": 11,
      "ＳＲＣ": 1
    },
    "sampleCount": 12,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "神戶市北區",
    "layout": "ldk3",
    "medianTradePriceYen": 13000000,
    "medianSqmPriceYen": 171000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 213000,
        "sampleCount": 17
      },
      "age_31_40": {
        "medianSqmPriceYen": 120000,
        "sampleCount": 16
      },
      "age_41_plus": {
        "medianSqmPriceYen": 75000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 42,
    "structureCounts": {
      "ＳＲＣ": 17,
      "ＲＣ": 26
    },
    "sampleCount": 43,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "西宮市",
    "layout": "k1",
    "medianTradePriceYen": 16000000,
    "medianSqmPriceYen": 700000,
    "medianAreaSqm": 20,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 6,
      "ＳＲＣ": 1
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "西宮市",
    "layout": "ldk1",
    "medianTradePriceYen": 16500000,
    "medianSqmPriceYen": 370000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 257000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 12,
    "structureCounts": {
      "ＲＣ": 6,
      "鉄骨造": 4,
      "ＳＲＣ": 2
    },
    "sampleCount": 12,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "西宮市",
    "layout": "ldk2",
    "medianTradePriceYen": 27000000,
    "medianSqmPriceYen": 429000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 652000,
        "sampleCount": 8
      },
      "age_21_30": {
        "medianSqmPriceYen": 477000,
        "sampleCount": 25
      },
      "age_31_40": {
        "medianSqmPriceYen": 286000,
        "sampleCount": 8
      },
      "age_41_plus": {
        "medianSqmPriceYen": 240000,
        "sampleCount": 12
      }
    },
    "buildingYearSampleCount": 55,
    "structureCounts": {
      "ＲＣ": 41,
      "ＳＲＣ": 13,
      "鉄骨造": 1
    },
    "sampleCount": 55,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "西宮市",
    "layout": "ldk3",
    "medianTradePriceYen": 36000000,
    "medianSqmPriceYen": 467000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 741000,
        "sampleCount": 25
      },
      "age_11_20": {
        "medianSqmPriceYen": 703000,
        "sampleCount": 42
      },
      "age_21_30": {
        "medianSqmPriceYen": 467000,
        "sampleCount": 105
      },
      "age_31_40": {
        "medianSqmPriceYen": 354000,
        "sampleCount": 35
      },
      "age_41_plus": {
        "medianSqmPriceYen": 214000,
        "sampleCount": 38
      }
    },
    "buildingYearSampleCount": 245,
    "structureCounts": {
      "ＲＣ": 196,
      "ＳＲＣ": 50,
      "ＲＣ、鉄骨造": 1
    },
    "sampleCount": 248,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "川西市",
    "layout": "ldk2",
    "medianTradePriceYen": 17000000,
    "medianSqmPriceYen": 311000,
    "medianAreaSqm": 65,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 331000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＲＣ": 8,
      "ＳＲＣ": 3
    },
    "sampleCount": 11,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "川西市",
    "layout": "ldk3",
    "medianTradePriceYen": 19000000,
    "medianSqmPriceYen": 229000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 246000,
        "sampleCount": 22
      },
      "age_31_40": {
        "medianSqmPriceYen": 135000,
        "sampleCount": 12
      }
    },
    "buildingYearSampleCount": 40,
    "structureCounts": {
      "ＳＲＣ": 14,
      "ＲＣ": 27
    },
    "sampleCount": 41,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "川辺郡猪名川町",
    "layout": "ldk3",
    "medianTradePriceYen": 12000000,
    "medianSqmPriceYen": 155000,
    "medianAreaSqm": 73,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 155000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＳＲＣ": 3,
      "ＲＣ": 3
    },
    "sampleCount": 8,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "尼崎市",
    "layout": "k1",
    "medianTradePriceYen": 19000000,
    "medianSqmPriceYen": 900000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 833000,
        "sampleCount": 13
      },
      "age_11_20": {
        "medianSqmPriceYen": 950000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 26,
    "structureCounts": {
      "ＲＣ": 22,
      "ＳＲＣ": 4
    },
    "sampleCount": 26,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "尼崎市",
    "layout": "ldk1",
    "medianTradePriceYen": 8200000,
    "medianSqmPriceYen": 233000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 205000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 5
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "尼崎市",
    "layout": "ldk2",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 369000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 740000,
        "sampleCount": 9
      },
      "age_11_20": {
        "medianSqmPriceYen": 574000,
        "sampleCount": 10
      },
      "age_21_30": {
        "medianSqmPriceYen": 455000,
        "sampleCount": 27
      },
      "age_31_40": {
        "medianSqmPriceYen": 255000,
        "sampleCount": 17
      },
      "age_41_plus": {
        "medianSqmPriceYen": 143000,
        "sampleCount": 19
      }
    },
    "buildingYearSampleCount": 82,
    "structureCounts": {
      "ＲＣ": 62,
      "ＳＲＣ": 21
    },
    "sampleCount": 83,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "尼崎市",
    "layout": "ldk3",
    "medianTradePriceYen": 36000000,
    "medianSqmPriceYen": 478000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 700000,
        "sampleCount": 11
      },
      "age_11_20": {
        "medianSqmPriceYen": 467000,
        "sampleCount": 25
      },
      "age_21_30": {
        "medianSqmPriceYen": 492000,
        "sampleCount": 41
      },
      "age_31_40": {
        "medianSqmPriceYen": 286000,
        "sampleCount": 15
      },
      "age_41_plus": {
        "medianSqmPriceYen": 200000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 100,
    "structureCounts": {
      "ＲＣ": 82,
      "ＳＲＣ": 18
    },
    "sampleCount": 100,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "尼崎市",
    "layout": "r1",
    "medianTradePriceYen": 4400000,
    "medianSqmPriceYen": 280000,
    "medianAreaSqm": 15,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "宝塚市",
    "layout": "ldk1",
    "medianTradePriceYen": 19000000,
    "medianSqmPriceYen": 518000,
    "medianAreaSqm": 43,
    "ageBands": {},
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＳＲＣ": 4,
      "ＲＣ": 4
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "宝塚市",
    "layout": "ldk2",
    "medianTradePriceYen": 16500000,
    "medianSqmPriceYen": 262000,
    "medianAreaSqm": 63,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 331000,
        "sampleCount": 6
      },
      "age_31_40": {
        "medianSqmPriceYen": 184000,
        "sampleCount": 10
      },
      "age_41_plus": {
        "medianSqmPriceYen": 183000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 32,
    "structureCounts": {
      "ＲＣ": 25,
      "ＳＲＣ": 7
    },
    "sampleCount": 32,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "宝塚市",
    "layout": "ldk3",
    "medianTradePriceYen": 22500000,
    "medianSqmPriceYen": 291000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 614000,
        "sampleCount": 9
      },
      "age_11_20": {
        "medianSqmPriceYen": 524000,
        "sampleCount": 18
      },
      "age_21_30": {
        "medianSqmPriceYen": 360000,
        "sampleCount": 39
      },
      "age_31_40": {
        "medianSqmPriceYen": 188000,
        "sampleCount": 31
      },
      "age_41_plus": {
        "medianSqmPriceYen": 201000,
        "sampleCount": 22
      }
    },
    "buildingYearSampleCount": 119,
    "structureCounts": {
      "ＲＣ": 70,
      "ＳＲＣ": 50
    },
    "sampleCount": 122,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "明石市",
    "layout": "ldk1",
    "medianTradePriceYen": 25000000,
    "medianSqmPriceYen": 500000,
    "medianAreaSqm": 45,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "明石市",
    "layout": "ldk2",
    "medianTradePriceYen": 14000000,
    "medianSqmPriceYen": 236000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 281000,
        "sampleCount": 16
      },
      "age_31_40": {
        "medianSqmPriceYen": 128000,
        "sampleCount": 7
      },
      "age_41_plus": {
        "medianSqmPriceYen": 179000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 38,
    "structureCounts": {
      "ＳＲＣ": 16,
      "ＲＣ": 17
    },
    "sampleCount": 39,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "明石市",
    "layout": "ldk3",
    "medianTradePriceYen": 20000000,
    "medianSqmPriceYen": 257000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 593000,
        "sampleCount": 6
      },
      "age_11_20": {
        "medianSqmPriceYen": 457000,
        "sampleCount": 11
      },
      "age_21_30": {
        "medianSqmPriceYen": 293000,
        "sampleCount": 22
      },
      "age_31_40": {
        "medianSqmPriceYen": 193000,
        "sampleCount": 18
      },
      "age_41_plus": {
        "medianSqmPriceYen": 154000,
        "sampleCount": 17
      }
    },
    "buildingYearSampleCount": 74,
    "structureCounts": {
      "ＳＲＣ": 23,
      "ＲＣ": 42
    },
    "sampleCount": 75,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "姬路市",
    "layout": "k1",
    "medianTradePriceYen": 4700000,
    "medianSqmPriceYen": 157000,
    "medianAreaSqm": 25,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 3,
      "ＳＲＣ": 2
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "姬路市",
    "layout": "ldk1",
    "medianTradePriceYen": 7500000,
    "medianSqmPriceYen": 167000,
    "medianAreaSqm": 45,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 138000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＲＣ": 7,
      "鉄骨造": 1,
      "ＳＲＣ": 1
    },
    "sampleCount": 9,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "姬路市",
    "layout": "ldk2",
    "medianTradePriceYen": 10500000,
    "medianSqmPriceYen": 178000,
    "medianAreaSqm": 63,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 533000,
        "sampleCount": 7
      },
      "age_21_30": {
        "medianSqmPriceYen": 173000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 126000,
        "sampleCount": 11
      }
    },
    "buildingYearSampleCount": 25,
    "structureCounts": {
      "ＲＣ": 22,
      "ＳＲＣ": 6
    },
    "sampleCount": 28,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "兵庫",
    "district": "姬路市",
    "layout": "ldk3",
    "medianTradePriceYen": 14000000,
    "medianSqmPriceYen": 200000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 486000,
        "sampleCount": 13
      },
      "age_11_20": {
        "medianSqmPriceYen": 340000,
        "sampleCount": 12
      },
      "age_21_30": {
        "medianSqmPriceYen": 214000,
        "sampleCount": 15
      },
      "age_31_40": {
        "medianSqmPriceYen": 97000,
        "sampleCount": 25
      },
      "age_41_plus": {
        "medianSqmPriceYen": 72000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 71,
    "structureCounts": {
      "ＲＣ": 57,
      "ＳＲＣ": 14
    },
    "sampleCount": 71,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "旭川市",
    "layout": "ldk2",
    "medianTradePriceYen": 13000000,
    "medianSqmPriceYen": 200000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 2
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "旭川市",
    "layout": "ldk3",
    "medianTradePriceYen": 9800000,
    "medianSqmPriceYen": 129000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 137000,
        "sampleCount": 6
      },
      "age_31_40": {
        "medianSqmPriceYen": 89000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 14,
    "structureCounts": {
      "ＲＣ": 13,
      "ＳＲＣ": 2
    },
    "sampleCount": 17,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "釧路市",
    "layout": "ldk3",
    "medianTradePriceYen": 7600000,
    "medianSqmPriceYen": 107000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 107000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＳＲＣ": 3,
      "ＲＣ": 8
    },
    "sampleCount": 11,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2025-Q2",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "江別市",
    "layout": "ldk3",
    "medianTradePriceYen": 10500000,
    "medianSqmPriceYen": 127000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 123000,
        "sampleCount": 20
      }
    },
    "buildingYearSampleCount": 24,
    "structureCounts": {
      "ＲＣ": 18,
      "ＳＲＣ": 4
    },
    "sampleCount": 26,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "札幌市（市平均）",
    "layout": "k1",
    "medianTradePriceYen": 3200000,
    "medianSqmPriceYen": 150000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 170000,
        "sampleCount": 25
      },
      "age_41_plus": {
        "medianSqmPriceYen": 105000,
        "sampleCount": 27
      }
    },
    "buildingYearSampleCount": 55,
    "structureCounts": {
      "ＳＲＣ": 22,
      "ＲＣ": 29,
      "鉄骨造": 1
    },
    "sampleCount": 56,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "札幌市（市平均）",
    "layout": "ldk1",
    "medianTradePriceYen": 8100000,
    "medianSqmPriceYen": 198000,
    "medianAreaSqm": 45,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 720000,
        "sampleCount": 21
      },
      "age_31_40": {
        "medianSqmPriceYen": 156000,
        "sampleCount": 29
      },
      "age_41_plus": {
        "medianSqmPriceYen": 110000,
        "sampleCount": 32
      }
    },
    "buildingYearSampleCount": 88,
    "structureCounts": {
      "ＲＣ": 47,
      "ＳＲＣ": 36,
      "鉄骨造": 1
    },
    "sampleCount": 88,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "札幌市（市平均）",
    "layout": "ldk2",
    "medianTradePriceYen": 17000000,
    "medianSqmPriceYen": 291000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 745000,
        "sampleCount": 41
      },
      "age_11_20": {
        "medianSqmPriceYen": 555000,
        "sampleCount": 20
      },
      "age_21_30": {
        "medianSqmPriceYen": 371000,
        "sampleCount": 32
      },
      "age_31_40": {
        "medianSqmPriceYen": 236000,
        "sampleCount": 71
      },
      "age_41_plus": {
        "medianSqmPriceYen": 214000,
        "sampleCount": 71
      }
    },
    "buildingYearSampleCount": 235,
    "structureCounts": {
      "ＲＣ": 153,
      "ＳＲＣ": 69,
      "鉄骨造": 1
    },
    "sampleCount": 237,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "札幌市（市平均）",
    "layout": "ldk3",
    "medianTradePriceYen": 24000000,
    "medianSqmPriceYen": 300000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 667000,
        "sampleCount": 64
      },
      "age_11_20": {
        "medianSqmPriceYen": 440000,
        "sampleCount": 105
      },
      "age_21_30": {
        "medianSqmPriceYen": 329000,
        "sampleCount": 302
      },
      "age_31_40": {
        "medianSqmPriceYen": 214000,
        "sampleCount": 250
      },
      "age_41_plus": {
        "medianSqmPriceYen": 135000,
        "sampleCount": 80
      }
    },
    "buildingYearSampleCount": 801,
    "structureCounts": {
      "ＲＣ": 567,
      "ＳＲＣ": 191,
      "鉄骨造": 1
    },
    "sampleCount": 815,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "札幌市（市平均）",
    "layout": "r1",
    "medianTradePriceYen": 3200000,
    "medianSqmPriceYen": 181000,
    "medianAreaSqm": 15,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 206000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＲＣ": 7,
      "ＳＲＣ": 4,
      "鉄骨造": 1
    },
    "sampleCount": 12,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "札幌市厚別區",
    "layout": "ldk2",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 307000,
    "medianAreaSqm": 68,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 307000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 5
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "札幌市厚別區",
    "layout": "ldk3",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 286000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 391000,
        "sampleCount": 6
      },
      "age_21_30": {
        "medianSqmPriceYen": 323000,
        "sampleCount": 21
      },
      "age_31_40": {
        "medianSqmPriceYen": 219000,
        "sampleCount": 34
      },
      "age_41_plus": {
        "medianSqmPriceYen": 271000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 71,
    "structureCounts": {
      "ＲＣ": 52,
      "ＳＲＣ": 19
    },
    "sampleCount": 73,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "札幌市手稻區",
    "layout": "ldk3",
    "medianTradePriceYen": 14000000,
    "medianSqmPriceYen": 188000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 176000,
        "sampleCount": 8
      },
      "age_31_40": {
        "medianSqmPriceYen": 188000,
        "sampleCount": 21
      }
    },
    "buildingYearSampleCount": 31,
    "structureCounts": {
      "ＲＣ": 28,
      "ＳＲＣ": 3
    },
    "sampleCount": 33,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "札幌市清田區",
    "layout": "ldk3",
    "medianTradePriceYen": 15000000,
    "medianSqmPriceYen": 188000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 224000,
        "sampleCount": 9
      },
      "age_31_40": {
        "medianSqmPriceYen": 179000,
        "sampleCount": 12
      }
    },
    "buildingYearSampleCount": 21,
    "structureCounts": {
      "ＳＲＣ": 6,
      "ＲＣ": 15
    },
    "sampleCount": 21,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "札幌市西區",
    "layout": "k1",
    "medianTradePriceYen": 2900000,
    "medianSqmPriceYen": 128000,
    "medianAreaSqm": 20,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＳＲＣ": 4,
      "ＲＣ": 2
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q2",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "札幌市西區",
    "layout": "ldk1",
    "medianTradePriceYen": 7500000,
    "medianSqmPriceYen": 203000,
    "medianAreaSqm": 45,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 378000,
        "sampleCount": 5
      },
      "age_41_plus": {
        "medianSqmPriceYen": 129000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 14,
    "structureCounts": {
      "ＲＣ": 8,
      "ＳＲＣ": 6
    },
    "sampleCount": 14,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "札幌市西區",
    "layout": "ldk2",
    "medianTradePriceYen": 18500000,
    "medianSqmPriceYen": 312000,
    "medianAreaSqm": 63,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 677000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 308000,
        "sampleCount": 9
      },
      "age_41_plus": {
        "medianSqmPriceYen": 254000,
        "sampleCount": 14
      }
    },
    "buildingYearSampleCount": 30,
    "structureCounts": {
      "ＲＣ": 22,
      "ＳＲＣ": 8
    },
    "sampleCount": 30,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "札幌市西區",
    "layout": "ldk3",
    "medianTradePriceYen": 23000000,
    "medianSqmPriceYen": 297000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 667000,
        "sampleCount": 11
      },
      "age_11_20": {
        "medianSqmPriceYen": 444000,
        "sampleCount": 9
      },
      "age_21_30": {
        "medianSqmPriceYen": 327000,
        "sampleCount": 40
      },
      "age_31_40": {
        "medianSqmPriceYen": 227000,
        "sampleCount": 28
      },
      "age_41_plus": {
        "medianSqmPriceYen": 186000,
        "sampleCount": 15
      }
    },
    "buildingYearSampleCount": 103,
    "structureCounts": {
      "ＲＣ": 73,
      "ＳＲＣ": 23
    },
    "sampleCount": 106,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "札幌市中央區",
    "layout": "k1",
    "medianTradePriceYen": 3900000,
    "medianSqmPriceYen": 171000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 211000,
        "sampleCount": 8
      },
      "age_41_plus": {
        "medianSqmPriceYen": 135000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 15,
    "structureCounts": {
      "ＳＲＣ": 8,
      "ＲＣ": 7
    },
    "sampleCount": 15,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "札幌市中央區",
    "layout": "ldk1",
    "medianTradePriceYen": 12000000,
    "medianSqmPriceYen": 293000,
    "medianAreaSqm": 40,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 750000,
        "sampleCount": 13
      },
      "age_31_40": {
        "medianSqmPriceYen": 231000,
        "sampleCount": 10
      },
      "age_41_plus": {
        "medianSqmPriceYen": 140000,
        "sampleCount": 12
      }
    },
    "buildingYearSampleCount": 38,
    "structureCounts": {
      "ＲＣ": 21,
      "ＳＲＣ": 15,
      "鉄骨造": 1
    },
    "sampleCount": 38,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "札幌市中央區",
    "layout": "ldk2",
    "medianTradePriceYen": 27000000,
    "medianSqmPriceYen": 400000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 768000,
        "sampleCount": 22
      },
      "age_11_20": {
        "medianSqmPriceYen": 642000,
        "sampleCount": 8
      },
      "age_21_30": {
        "medianSqmPriceYen": 508000,
        "sampleCount": 11
      },
      "age_31_40": {
        "medianSqmPriceYen": 238000,
        "sampleCount": 18
      },
      "age_41_plus": {
        "medianSqmPriceYen": 215000,
        "sampleCount": 21
      }
    },
    "buildingYearSampleCount": 80,
    "structureCounts": {
      "ＲＣ": 49,
      "ＳＲＣ": 31
    },
    "sampleCount": 81,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "札幌市中央區",
    "layout": "ldk3",
    "medianTradePriceYen": 35000000,
    "medianSqmPriceYen": 400000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 729000,
        "sampleCount": 30
      },
      "age_11_20": {
        "medianSqmPriceYen": 505000,
        "sampleCount": 43
      },
      "age_21_30": {
        "medianSqmPriceYen": 388000,
        "sampleCount": 74
      },
      "age_31_40": {
        "medianSqmPriceYen": 243000,
        "sampleCount": 39
      },
      "age_41_plus": {
        "medianSqmPriceYen": 173000,
        "sampleCount": 15
      }
    },
    "buildingYearSampleCount": 201,
    "structureCounts": {
      "ＲＣ": 136,
      "ＳＲＣ": 64
    },
    "sampleCount": 203,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "札幌市中央區",
    "layout": "r1",
    "medianTradePriceYen": 3500000,
    "medianSqmPriceYen": 175000,
    "medianAreaSqm": 15,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 1
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "札幌市東區",
    "layout": "k1",
    "medianTradePriceYen": 3900000,
    "medianSqmPriceYen": 170000,
    "medianAreaSqm": 25,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 190000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 12,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 7
    },
    "sampleCount": 12,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "札幌市東區",
    "layout": "ldk1",
    "medianTradePriceYen": 11000000,
    "medianSqmPriceYen": 267000,
    "medianAreaSqm": 35,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 2
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "札幌市東區",
    "layout": "ldk2",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 382000,
    "medianAreaSqm": 55,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 800000,
        "sampleCount": 7
      },
      "age_31_40": {
        "medianSqmPriceYen": 200000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 19,
    "structureCounts": {
      "ＲＣ": 16,
      "ＳＲＣ": 3
    },
    "sampleCount": 20,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "札幌市東區",
    "layout": "ldk3",
    "medianTradePriceYen": 25000000,
    "medianSqmPriceYen": 320000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 671000,
        "sampleCount": 11
      },
      "age_11_20": {
        "medianSqmPriceYen": 351000,
        "sampleCount": 12
      },
      "age_21_30": {
        "medianSqmPriceYen": 306000,
        "sampleCount": 29
      },
      "age_31_40": {
        "medianSqmPriceYen": 224000,
        "sampleCount": 17
      }
    },
    "buildingYearSampleCount": 73,
    "structureCounts": {
      "ＲＣ": 59,
      "ＳＲＣ": 14
    },
    "sampleCount": 75,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "札幌市南區",
    "layout": "ldk1",
    "medianTradePriceYen": 15300000,
    "medianSqmPriceYen": 368000,
    "medianAreaSqm": 40,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 4
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "札幌市南區",
    "layout": "ldk2",
    "medianTradePriceYen": 7700000,
    "medianSqmPriceYen": 139000,
    "medianAreaSqm": 60,
    "ageBands": {},
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＳＲＣ": 1,
      "ＲＣ": 8
    },
    "sampleCount": 10,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "札幌市南區",
    "layout": "ldk3",
    "medianTradePriceYen": 9400000,
    "medianSqmPriceYen": 121000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 200000,
        "sampleCount": 11
      },
      "age_31_40": {
        "medianSqmPriceYen": 101000,
        "sampleCount": 10
      },
      "age_41_plus": {
        "medianSqmPriceYen": 74000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 35,
    "structureCounts": {
      "ＲＣ": 32,
      "ＳＲＣ": 3
    },
    "sampleCount": 35,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "札幌市白石區",
    "layout": "k1",
    "medianTradePriceYen": 3100000,
    "medianSqmPriceYen": 124000,
    "medianAreaSqm": 25,
    "ageBands": {},
    "buildingYearSampleCount": 4,
    "structureCounts": {
      "ＲＣ": 2,
      "鉄骨造": 1,
      "ＳＲＣ": 1
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "札幌市白石區",
    "layout": "ldk1",
    "medianTradePriceYen": 7200000,
    "medianSqmPriceYen": 160000,
    "medianAreaSqm": 40,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 4
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "札幌市白石區",
    "layout": "ldk2",
    "medianTradePriceYen": 16000000,
    "medianSqmPriceYen": 259000,
    "medianAreaSqm": 58,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 259000,
        "sampleCount": 10
      },
      "age_41_plus": {
        "medianSqmPriceYen": 182000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 20,
    "structureCounts": {
      "ＳＲＣ": 7,
      "ＲＣ": 13
    },
    "sampleCount": 20,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "札幌市白石區",
    "layout": "ldk3",
    "medianTradePriceYen": 23000000,
    "medianSqmPriceYen": 300000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 440000,
        "sampleCount": 9
      },
      "age_21_30": {
        "medianSqmPriceYen": 289000,
        "sampleCount": 21
      },
      "age_31_40": {
        "medianSqmPriceYen": 234000,
        "sampleCount": 24
      }
    },
    "buildingYearSampleCount": 59,
    "structureCounts": {
      "ＲＣ": 46,
      "ＳＲＣ": 15
    },
    "sampleCount": 61,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "札幌市北區",
    "layout": "k1",
    "medianTradePriceYen": 3200000,
    "medianSqmPriceYen": 160000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 160000,
        "sampleCount": 9
      },
      "age_41_plus": {
        "medianSqmPriceYen": 150000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 19,
    "structureCounts": {
      "ＲＣ": 11,
      "ＳＲＣ": 8
    },
    "sampleCount": 19,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "札幌市北區",
    "layout": "ldk1",
    "medianTradePriceYen": 1500000,
    "medianSqmPriceYen": 30000,
    "medianAreaSqm": 50,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 20000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 12,
    "structureCounts": {
      "ＳＲＣ": 8,
      "ＲＣ": 4
    },
    "sampleCount": 12,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "札幌市北區",
    "layout": "ldk2",
    "medianTradePriceYen": 13000000,
    "medianSqmPriceYen": 214000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 562000,
        "sampleCount": 6
      },
      "age_21_30": {
        "medianSqmPriceYen": 186000,
        "sampleCount": 7
      },
      "age_31_40": {
        "medianSqmPriceYen": 50000,
        "sampleCount": 7
      },
      "age_41_plus": {
        "medianSqmPriceYen": 182000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 27,
    "structureCounts": {
      "ＲＣ": 18,
      "ＳＲＣ": 9
    },
    "sampleCount": 27,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "札幌市北區",
    "layout": "ldk3",
    "medianTradePriceYen": 18000000,
    "medianSqmPriceYen": 215000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 453000,
        "sampleCount": 8
      },
      "age_21_30": {
        "medianSqmPriceYen": 276000,
        "sampleCount": 22
      },
      "age_31_40": {
        "medianSqmPriceYen": 157000,
        "sampleCount": 27
      },
      "age_41_plus": {
        "medianSqmPriceYen": 107000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 67,
    "structureCounts": {
      "ＲＣ": 48,
      "ＳＲＣ": 14
    },
    "sampleCount": 67,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "札幌市豐平區",
    "layout": "k1",
    "medianTradePriceYen": 2200000,
    "medianSqmPriceYen": 105000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 105000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 1
    },
    "sampleCount": 10,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "札幌市豐平區",
    "layout": "ldk1",
    "medianTradePriceYen": 4500000,
    "medianSqmPriceYen": 100000,
    "medianAreaSqm": 50,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 88000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＲＣ": 6,
      "ＳＲＣ": 2
    },
    "sampleCount": 11,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "札幌市豐平區",
    "layout": "ldk2",
    "medianTradePriceYen": 13000000,
    "medianSqmPriceYen": 229000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 236000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 202000,
        "sampleCount": 8
      },
      "age_41_plus": {
        "medianSqmPriceYen": 198000,
        "sampleCount": 18
      }
    },
    "buildingYearSampleCount": 39,
    "structureCounts": {
      "ＳＲＣ": 7,
      "ＲＣ": 21,
      "鉄骨造": 1
    },
    "sampleCount": 39,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "札幌市豐平區",
    "layout": "ldk3",
    "medianTradePriceYen": 24000000,
    "medianSqmPriceYen": 300000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 494000,
        "sampleCount": 5
      },
      "age_11_20": {
        "medianSqmPriceYen": 388000,
        "sampleCount": 15
      },
      "age_21_30": {
        "medianSqmPriceYen": 326000,
        "sampleCount": 67
      },
      "age_31_40": {
        "medianSqmPriceYen": 214000,
        "sampleCount": 38
      },
      "age_41_plus": {
        "medianSqmPriceYen": 110000,
        "sampleCount": 15
      }
    },
    "buildingYearSampleCount": 140,
    "structureCounts": {
      "ＲＣ": 78,
      "ＳＲＣ": 30,
      "鉄骨造": 1
    },
    "sampleCount": 141,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "小樽市",
    "layout": "ldk2",
    "medianTradePriceYen": 15500000,
    "medianSqmPriceYen": 249000,
    "medianAreaSqm": 63,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 3,
      "ＳＲＣ": 3
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "小樽市",
    "layout": "ldk3",
    "medianTradePriceYen": 6500000,
    "medianSqmPriceYen": 78000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 238000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 39000,
        "sampleCount": 12
      }
    },
    "buildingYearSampleCount": 17,
    "structureCounts": {
      "ＲＣ": 6,
      "ＳＲＣ": 11
    },
    "sampleCount": 17,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "帯広市",
    "layout": "ldk3",
    "medianTradePriceYen": 22000000,
    "medianSqmPriceYen": 259000,
    "medianAreaSqm": 80,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 7,
      "ＳＲＣ": 1
    },
    "sampleCount": 9,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "苫小牧市",
    "layout": "ldk3",
    "medianTradePriceYen": 8800000,
    "medianSqmPriceYen": 120000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 78000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＲＣ": 14,
      "ＳＲＣ": 2
    },
    "sampleCount": 25,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "函館市",
    "layout": "k1",
    "medianTradePriceYen": 1900000,
    "medianSqmPriceYen": 93000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 93000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＳＲＣ": 4,
      "ＲＣ": 2
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q2",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "函館市",
    "layout": "ldk1",
    "medianTradePriceYen": 6000000,
    "medianSqmPriceYen": 133000,
    "medianAreaSqm": 45,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 133000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 1,
      "ＳＲＣ": 3
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "函館市",
    "layout": "ldk2",
    "medianTradePriceYen": 10500000,
    "medianSqmPriceYen": 179000,
    "medianAreaSqm": 68,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 142000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 12,
    "structureCounts": {
      "ＳＲＣ": 5,
      "ＲＣ": 7
    },
    "sampleCount": 12,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "函館市",
    "layout": "ldk3",
    "medianTradePriceYen": 9900000,
    "medianSqmPriceYen": 129000,
    "medianAreaSqm": 80,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 120000,
        "sampleCount": 23
      }
    },
    "buildingYearSampleCount": 27,
    "structureCounts": {
      "ＲＣ": 14,
      "ＳＲＣ": 7
    },
    "sampleCount": 28,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "北海道",
    "district": "北見市",
    "layout": "ldk3",
    "medianTradePriceYen": 17000000,
    "medianSqmPriceYen": 178000,
    "medianAreaSqm": 100,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 1
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "和歌山",
    "district": "和歌山市",
    "layout": "ldk2",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 323000,
    "medianAreaSqm": 65,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 341000,
        "sampleCount": 6
      },
      "age_21_30": {
        "medianSqmPriceYen": 292000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 19,
    "structureCounts": {
      "ＳＲＣ": 7,
      "ＲＣ": 11
    },
    "sampleCount": 19,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "和歌山",
    "district": "和歌山市",
    "layout": "ldk3",
    "medianTradePriceYen": 18000000,
    "medianSqmPriceYen": 259000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 259000,
        "sampleCount": 7
      },
      "age_31_40": {
        "medianSqmPriceYen": 85000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 23,
    "structureCounts": {
      "ＲＣ": 17,
      "ＳＲＣ": 10
    },
    "sampleCount": 29,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "廣島",
    "district": "呉市",
    "layout": "ldk3",
    "medianTradePriceYen": 15000000,
    "medianSqmPriceYen": 200000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 200000,
        "sampleCount": 15
      }
    },
    "buildingYearSampleCount": 25,
    "structureCounts": {
      "ＳＲＣ": 13,
      "ＲＣ": 12
    },
    "sampleCount": 25,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "廣島",
    "district": "三原市",
    "layout": "ldk3",
    "medianTradePriceYen": 17500000,
    "medianSqmPriceYen": 222000,
    "medianAreaSqm": 73,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 2
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "廣島",
    "district": "東広島市",
    "layout": "ldk3",
    "medianTradePriceYen": 26000000,
    "medianSqmPriceYen": 318000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 250000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 12,
    "structureCounts": {
      "ＳＲＣ": 5,
      "ＲＣ": 7
    },
    "sampleCount": 12,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "廣島",
    "district": "廿日市市",
    "layout": "ldk2",
    "medianTradePriceYen": 17100000,
    "medianSqmPriceYen": 275000,
    "medianAreaSqm": 63,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 3
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "廣島",
    "district": "廿日市市",
    "layout": "ldk3",
    "medianTradePriceYen": 27000000,
    "medianSqmPriceYen": 400000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 414000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＳＲＣ": 3,
      "ＲＣ": 6
    },
    "sampleCount": 9,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "廣島",
    "district": "尾道市",
    "layout": "ldk3",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 300000,
    "medianAreaSqm": 75,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 3
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "廣島",
    "district": "福山市",
    "layout": "ldk2",
    "medianTradePriceYen": 23500000,
    "medianSqmPriceYen": 408000,
    "medianAreaSqm": 63,
    "ageBands": {},
    "buildingYearSampleCount": 4,
    "structureCounts": {
      "ＲＣ": 4
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "廣島",
    "district": "福山市",
    "layout": "ldk3",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 286000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 371000,
        "sampleCount": 9
      },
      "age_21_30": {
        "medianSqmPriceYen": 214000,
        "sampleCount": 9
      },
      "age_31_40": {
        "medianSqmPriceYen": 169000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 26,
    "structureCounts": {
      "ＲＣ": 18,
      "ＳＲＣ": 3
    },
    "sampleCount": 33,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "廣島",
    "district": "廣島市（市平均）",
    "layout": "k1",
    "medianTradePriceYen": 4000000,
    "medianSqmPriceYen": 175000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 240000,
        "sampleCount": 5
      },
      "age_41_plus": {
        "medianSqmPriceYen": 133000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 6
    },
    "sampleCount": 11,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "廣島",
    "district": "廣島市（市平均）",
    "layout": "ldk1",
    "medianTradePriceYen": 15000000,
    "medianSqmPriceYen": 333000,
    "medianAreaSqm": 45,
    "ageBands": {},
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 4
    },
    "sampleCount": 9,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "廣島",
    "district": "廣島市（市平均）",
    "layout": "ldk2",
    "medianTradePriceYen": 25000000,
    "medianSqmPriceYen": 386000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 791000,
        "sampleCount": 10
      },
      "age_21_30": {
        "medianSqmPriceYen": 390000,
        "sampleCount": 14
      },
      "age_31_40": {
        "medianSqmPriceYen": 360000,
        "sampleCount": 9
      },
      "age_41_plus": {
        "medianSqmPriceYen": 242000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 47,
    "structureCounts": {
      "ＳＲＣ": 20,
      "ＲＣ": 26
    },
    "sampleCount": 49,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "廣島",
    "district": "廣島市（市平均）",
    "layout": "ldk3",
    "medianTradePriceYen": 28000000,
    "medianSqmPriceYen": 350000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 571000,
        "sampleCount": 23
      },
      "age_11_20": {
        "medianSqmPriceYen": 429000,
        "sampleCount": 28
      },
      "age_21_30": {
        "medianSqmPriceYen": 368000,
        "sampleCount": 41
      },
      "age_31_40": {
        "medianSqmPriceYen": 271000,
        "sampleCount": 25
      },
      "age_41_plus": {
        "medianSqmPriceYen": 230000,
        "sampleCount": 16
      }
    },
    "buildingYearSampleCount": 133,
    "structureCounts": {
      "ＲＣ": 87,
      "ＳＲＣ": 42
    },
    "sampleCount": 139,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "廣島",
    "district": "廣島市安佐南區",
    "layout": "ldk2",
    "medianTradePriceYen": 24000000,
    "medianSqmPriceYen": 343000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 4
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "廣島",
    "district": "廣島市安佐南區",
    "layout": "ldk3",
    "medianTradePriceYen": 30500000,
    "medianSqmPriceYen": 433000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 507000,
        "sampleCount": 6
      },
      "age_21_30": {
        "medianSqmPriceYen": 415000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 14,
    "structureCounts": {
      "ＲＣ": 10,
      "ＳＲＣ": 3
    },
    "sampleCount": 14,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "廣島",
    "district": "廣島市安佐北區",
    "layout": "ldk3",
    "medianTradePriceYen": 17000000,
    "medianSqmPriceYen": 206000,
    "medianAreaSqm": 75,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 6
    },
    "sampleCount": 12,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "廣島",
    "district": "廣島市安藝區",
    "layout": "ldk3",
    "medianTradePriceYen": 14500000,
    "medianSqmPriceYen": 180000,
    "medianAreaSqm": 78,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 2
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "廣島",
    "district": "廣島市佐伯區",
    "layout": "ldk2",
    "medianTradePriceYen": 21000000,
    "medianSqmPriceYen": 369000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＳＲＣ": 5,
      "ＲＣ": 2
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "廣島",
    "district": "廣島市佐伯區",
    "layout": "ldk3",
    "medianTradePriceYen": 28000000,
    "medianSqmPriceYen": 341000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 341000,
        "sampleCount": 7
      },
      "age_21_30": {
        "medianSqmPriceYen": 385000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 235000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 21,
    "structureCounts": {
      "ＲＣ": 15,
      "ＳＲＣ": 6
    },
    "sampleCount": 21,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "廣島",
    "district": "廣島市西區",
    "layout": "ldk2",
    "medianTradePriceYen": 25000000,
    "medianSqmPriceYen": 455000,
    "medianAreaSqm": 60,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 3
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "廣島",
    "district": "廣島市西區",
    "layout": "ldk3",
    "medianTradePriceYen": 28000000,
    "medianSqmPriceYen": 342000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 600000,
        "sampleCount": 5
      },
      "age_21_30": {
        "medianSqmPriceYen": 342000,
        "sampleCount": 10
      },
      "age_31_40": {
        "medianSqmPriceYen": 271000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 28,
    "structureCounts": {
      "ＲＣ": 22,
      "ＳＲＣ": 6
    },
    "sampleCount": 28,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "廣島",
    "district": "廣島市中區",
    "layout": "k1",
    "medianTradePriceYen": 3800000,
    "medianSqmPriceYen": 178000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 133000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＲＣ": 5,
      "ＳＲＣ": 3
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "廣島",
    "district": "廣島市中區",
    "layout": "ldk1",
    "medianTradePriceYen": 18000000,
    "medianSqmPriceYen": 517000,
    "medianAreaSqm": 48,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 2
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "廣島",
    "district": "廣島市中區",
    "layout": "ldk2",
    "medianTradePriceYen": 31000000,
    "medianSqmPriceYen": 477000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 817000,
        "sampleCount": 5
      },
      "age_21_30": {
        "medianSqmPriceYen": 424000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 18,
    "structureCounts": {
      "ＳＲＣ": 11,
      "ＲＣ": 7
    },
    "sampleCount": 18,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "廣島",
    "district": "廣島市中區",
    "layout": "ldk3",
    "medianTradePriceYen": 25000000,
    "medianSqmPriceYen": 333000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 360000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 292000,
        "sampleCount": 5
      },
      "age_41_plus": {
        "medianSqmPriceYen": 232000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 21,
    "structureCounts": {
      "ＲＣ": 9,
      "ＳＲＣ": 12
    },
    "sampleCount": 21,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "廣島",
    "district": "廣島市東區",
    "layout": "ldk2",
    "medianTradePriceYen": 22000000,
    "medianSqmPriceYen": 293000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 5
    },
    "sampleCount": 9,
    "windowQuarters": 8,
    "periodStart": "2024-Q4",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "廣島",
    "district": "廣島市東區",
    "layout": "ldk3",
    "medianTradePriceYen": 28000000,
    "medianSqmPriceYen": 368000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 377000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＲＣ": 6,
      "ＳＲＣ": 2
    },
    "sampleCount": 15,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "廣島",
    "district": "廣島市南區",
    "layout": "ldk2",
    "medianTradePriceYen": 25000000,
    "medianSqmPriceYen": 357000,
    "medianAreaSqm": 65,
    "ageBands": {
      "age_41_plus": {
        "medianSqmPriceYen": 280000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 11,
    "structureCounts": {
      "ＲＣ": 6,
      "ＳＲＣ": 5
    },
    "sampleCount": 11,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "廣島",
    "district": "廣島市南區",
    "layout": "ldk3",
    "medianTradePriceYen": 30000000,
    "medianSqmPriceYen": 400000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 586000,
        "sampleCount": 6
      },
      "age_11_20": {
        "medianSqmPriceYen": 414000,
        "sampleCount": 7
      },
      "age_21_30": {
        "medianSqmPriceYen": 413000,
        "sampleCount": 7
      },
      "age_41_plus": {
        "medianSqmPriceYen": 227000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 30,
    "structureCounts": {
      "ＲＣ": 18,
      "ＳＲＣ": 11
    },
    "sampleCount": 30,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "靜岡",
    "district": "掛川市",
    "layout": "ldk3",
    "medianTradePriceYen": 27000000,
    "medianSqmPriceYen": 338000,
    "medianAreaSqm": 75,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 1
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "靜岡",
    "district": "三島市",
    "layout": "ldk2",
    "medianTradePriceYen": 15000000,
    "medianSqmPriceYen": 218000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＲＣ": 7
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "靜岡",
    "district": "三島市",
    "layout": "ldk3",
    "medianTradePriceYen": 19000000,
    "medianSqmPriceYen": 260000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 214000,
        "sampleCount": 11
      }
    },
    "buildingYearSampleCount": 18,
    "structureCounts": {
      "ＲＣ": 15,
      "ＳＲＣ": 3
    },
    "sampleCount": 18,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "靜岡",
    "district": "沼津市",
    "layout": "ldk2",
    "medianTradePriceYen": 16000000,
    "medianSqmPriceYen": 237000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 9,
    "structureCounts": {
      "ＳＲＣ": 3,
      "ＲＣ": 5
    },
    "sampleCount": 10,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "靜岡",
    "district": "沼津市",
    "layout": "ldk3",
    "medianTradePriceYen": 17000000,
    "medianSqmPriceYen": 238000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 240000,
        "sampleCount": 7
      },
      "age_21_30": {
        "medianSqmPriceYen": 260000,
        "sampleCount": 12
      },
      "age_31_40": {
        "medianSqmPriceYen": 128000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 29,
    "structureCounts": {
      "ＲＣ": 18,
      "ＳＲＣ": 14,
      "ＳＲＣ、ＲＣ": 1
    },
    "sampleCount": 37,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "靜岡",
    "district": "焼津市",
    "layout": "ldk3",
    "medianTradePriceYen": 11000000,
    "medianSqmPriceYen": 157000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 4,
    "structureCounts": {
      "ＲＣ": 2
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "靜岡",
    "district": "静岡市葵区",
    "layout": "k1",
    "medianTradePriceYen": 4200000,
    "medianSqmPriceYen": 167000,
    "medianAreaSqm": 20,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 1
    },
    "sampleCount": 5,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "靜岡",
    "district": "静岡市葵区",
    "layout": "ldk1",
    "medianTradePriceYen": 9000000,
    "medianSqmPriceYen": 196000,
    "medianAreaSqm": 50,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 2
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q3",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "靜岡",
    "district": "静岡市葵区",
    "layout": "ldk2",
    "medianTradePriceYen": 23500000,
    "medianSqmPriceYen": 396000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_21_30": {
        "medianSqmPriceYen": 371000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 10,
    "structureCounts": {
      "ＳＲＣ": 4,
      "ＲＣ": 8
    },
    "sampleCount": 12,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "靜岡",
    "district": "静岡市葵区",
    "layout": "ldk3",
    "medianTradePriceYen": 25000000,
    "medianSqmPriceYen": 327000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 542000,
        "sampleCount": 6
      },
      "age_11_20": {
        "medianSqmPriceYen": 533000,
        "sampleCount": 5
      },
      "age_21_30": {
        "medianSqmPriceYen": 292000,
        "sampleCount": 15
      }
    },
    "buildingYearSampleCount": 31,
    "structureCounts": {
      "ＲＣ": 24,
      "ＳＲＣ": 5
    },
    "sampleCount": 32,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "靜岡",
    "district": "静岡市駿河区",
    "layout": "ldk2",
    "medianTradePriceYen": 28500000,
    "medianSqmPriceYen": 427000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 12,
    "structureCounts": {
      "ＲＣ": 9,
      "ＳＲＣ": 2
    },
    "sampleCount": 12,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "靜岡",
    "district": "静岡市駿河区",
    "layout": "ldk3",
    "medianTradePriceYen": 24500000,
    "medianSqmPriceYen": 325000,
    "medianAreaSqm": 73,
    "ageBands": {
      "age_11_20": {
        "medianSqmPriceYen": 447000,
        "sampleCount": 6
      },
      "age_21_30": {
        "medianSqmPriceYen": 325000,
        "sampleCount": 18
      },
      "age_31_40": {
        "medianSqmPriceYen": 187000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 33,
    "structureCounts": {
      "ＲＣ": 24,
      "ＳＲＣ": 2
    },
    "sampleCount": 34,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "靜岡",
    "district": "静岡市清水区",
    "layout": "ldk2",
    "medianTradePriceYen": 26000000,
    "medianSqmPriceYen": 386000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 4,
    "structureCounts": {
      "ＲＣ": 2
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "靜岡",
    "district": "静岡市清水区",
    "layout": "ldk3",
    "medianTradePriceYen": 23000000,
    "medianSqmPriceYen": 283000,
    "medianAreaSqm": 73,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 400000,
        "sampleCount": 5
      },
      "age_11_20": {
        "medianSqmPriceYen": 318000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 17,
    "structureCounts": {
      "ＳＲＣ": 1,
      "ＲＣ": 14
    },
    "sampleCount": 18,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "靜岡",
    "district": "藤枝市",
    "layout": "ldk3",
    "medianTradePriceYen": 27000000,
    "medianSqmPriceYen": 343000,
    "medianAreaSqm": 73,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 482000,
        "sampleCount": 5
      },
      "age_11_20": {
        "medianSqmPriceYen": 429000,
        "sampleCount": 5
      },
      "age_21_30": {
        "medianSqmPriceYen": 222000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 16,
    "structureCounts": {
      "ＲＣ": 14,
      "ＳＲＣ": 2
    },
    "sampleCount": 16,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "靜岡",
    "district": "磐田市",
    "layout": "ldk2",
    "medianTradePriceYen": 19500000,
    "medianSqmPriceYen": 325000,
    "medianAreaSqm": 60,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＲＣ": 1,
      "ＳＲＣ": 2
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q3",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "靜岡",
    "district": "磐田市",
    "layout": "ldk3",
    "medianTradePriceYen": 18000000,
    "medianSqmPriceYen": 262000,
    "medianAreaSqm": 75,
    "ageBands": {},
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 3
    },
    "sampleCount": 9,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "靜岡",
    "district": "浜松市中央区",
    "layout": "k1",
    "medianTradePriceYen": 3400000,
    "medianSqmPriceYen": 144000,
    "medianAreaSqm": 23,
    "ageBands": {},
    "buildingYearSampleCount": 4,
    "structureCounts": {
      "ＳＲＣ": 3,
      "ＲＣ": 1
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "靜岡",
    "district": "浜松市中央区",
    "layout": "ldk1",
    "medianTradePriceYen": 6000000,
    "medianSqmPriceYen": 133000,
    "medianAreaSqm": 45,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 1,
      "ＲＣ": 1
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "靜岡",
    "district": "浜松市中央区",
    "layout": "ldk2",
    "medianTradePriceYen": 13500000,
    "medianSqmPriceYen": 224000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 564000,
        "sampleCount": 7
      },
      "age_21_30": {
        "medianSqmPriceYen": 218000,
        "sampleCount": 13
      },
      "age_31_40": {
        "medianSqmPriceYen": 116000,
        "sampleCount": 6
      },
      "age_41_plus": {
        "medianSqmPriceYen": 114000,
        "sampleCount": 9
      }
    },
    "buildingYearSampleCount": 39,
    "structureCounts": {
      "ＳＲＣ": 8,
      "ＲＣ": 25
    },
    "sampleCount": 40,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "靜岡",
    "district": "浜松市中央区",
    "layout": "ldk3",
    "medianTradePriceYen": 18000000,
    "medianSqmPriceYen": 238000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 533000,
        "sampleCount": 14
      },
      "age_11_20": {
        "medianSqmPriceYen": 320000,
        "sampleCount": 14
      },
      "age_21_30": {
        "medianSqmPriceYen": 236000,
        "sampleCount": 40
      },
      "age_31_40": {
        "medianSqmPriceYen": 144000,
        "sampleCount": 13
      },
      "age_41_plus": {
        "medianSqmPriceYen": 85000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 91,
    "structureCounts": {
      "ＲＣ": 48,
      "ＳＲＣ": 20
    },
    "sampleCount": 93,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "靜岡",
    "district": "浜松市浜名区",
    "layout": "ldk1",
    "medianTradePriceYen": 1800000,
    "medianSqmPriceYen": 39000,
    "medianAreaSqm": 45,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 39000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＳＲＣ": 2
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "靜岡",
    "district": "浜松市浜名区",
    "layout": "ldk2",
    "medianTradePriceYen": 5400000,
    "medianSqmPriceYen": 87000,
    "medianAreaSqm": 63,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 87000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＳＲＣ": 3,
      "ＲＣ": 2
    },
    "sampleCount": 8,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "靜岡",
    "district": "富士宮市",
    "layout": "ldk3",
    "medianTradePriceYen": 13000000,
    "medianSqmPriceYen": 186000,
    "medianAreaSqm": 70,
    "ageBands": {},
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＳＲＣ": 1,
      "ＲＣ": 6
    },
    "sampleCount": 7,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "靜岡",
    "district": "富士市",
    "layout": "ldk2",
    "medianTradePriceYen": 8100000,
    "medianSqmPriceYen": 124000,
    "medianAreaSqm": 65,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 3
    },
    "sampleCount": 6,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "靜岡",
    "district": "富士市",
    "layout": "ldk3",
    "medianTradePriceYen": 17000000,
    "medianSqmPriceYen": 234000,
    "medianAreaSqm": 70,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 386000,
        "sampleCount": 5
      },
      "age_21_30": {
        "medianSqmPriceYen": 174000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 18,
    "structureCounts": {
      "ＳＲＣ": 3,
      "ＲＣ": 14
    },
    "sampleCount": 20,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "靜岡",
    "district": "濱松市",
    "layout": "k1",
    "medianTradePriceYen": 3700000,
    "medianSqmPriceYen": 145000,
    "medianAreaSqm": 25,
    "ageBands": {},
    "buildingYearSampleCount": 4,
    "structureCounts": {
      "ＳＲＣ": 3,
      "ＲＣ": 2
    },
    "sampleCount": 7,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "靜岡",
    "district": "濱松市",
    "layout": "ldk1",
    "medianTradePriceYen": 6000000,
    "medianSqmPriceYen": 133000,
    "medianAreaSqm": 45,
    "ageBands": {},
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 1,
      "ＲＣ": 1
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "靜岡",
    "district": "濱松市",
    "layout": "ldk2",
    "medianTradePriceYen": 13000000,
    "medianSqmPriceYen": 219000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 564000,
        "sampleCount": 8
      },
      "age_21_30": {
        "medianSqmPriceYen": 218000,
        "sampleCount": 13
      },
      "age_31_40": {
        "medianSqmPriceYen": 108000,
        "sampleCount": 8
      },
      "age_41_plus": {
        "medianSqmPriceYen": 85000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 43,
    "structureCounts": {
      "ＳＲＣ": 8,
      "ＲＣ": 27
    },
    "sampleCount": 44,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "靜岡",
    "district": "濱松市",
    "layout": "ldk3",
    "medianTradePriceYen": 18000000,
    "medianSqmPriceYen": 237000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 533000,
        "sampleCount": 14
      },
      "age_11_20": {
        "medianSqmPriceYen": 320000,
        "sampleCount": 14
      },
      "age_21_30": {
        "medianSqmPriceYen": 236000,
        "sampleCount": 40
      },
      "age_31_40": {
        "medianSqmPriceYen": 144000,
        "sampleCount": 13
      },
      "age_41_plus": {
        "medianSqmPriceYen": 85000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 91,
    "structureCounts": {
      "ＲＣ": 49,
      "ＳＲＣ": 20
    },
    "sampleCount": 94,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "靜岡",
    "district": "靜岡市",
    "layout": "k1",
    "medianTradePriceYen": 4300000,
    "medianSqmPriceYen": 188000,
    "medianAreaSqm": 20,
    "ageBands": {},
    "buildingYearSampleCount": 6,
    "structureCounts": {
      "ＲＣ": 4,
      "ＳＲＣ": 1
    },
    "sampleCount": 6,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q4",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "靜岡",
    "district": "靜岡市",
    "layout": "ldk1",
    "medianTradePriceYen": 8400000,
    "medianSqmPriceYen": 196000,
    "medianAreaSqm": 50,
    "ageBands": {},
    "buildingYearSampleCount": 8,
    "structureCounts": {
      "ＳＲＣ": 3,
      "ＲＣ": 4
    },
    "sampleCount": 8,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "靜岡",
    "district": "靜岡市",
    "layout": "ldk2",
    "medianTradePriceYen": 26000000,
    "medianSqmPriceYen": 414000,
    "medianAreaSqm": 65,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 700000,
        "sampleCount": 5
      },
      "age_11_20": {
        "medianSqmPriceYen": 460000,
        "sampleCount": 8
      },
      "age_21_30": {
        "medianSqmPriceYen": 357000,
        "sampleCount": 8
      }
    },
    "buildingYearSampleCount": 26,
    "structureCounts": {
      "ＳＲＣ": 6,
      "ＲＣ": 19
    },
    "sampleCount": 29,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "靜岡",
    "district": "靜岡市",
    "layout": "ldk3",
    "medianTradePriceYen": 24000000,
    "medianSqmPriceYen": 316000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 529000,
        "sampleCount": 13
      },
      "age_11_20": {
        "medianSqmPriceYen": 412000,
        "sampleCount": 17
      },
      "age_21_30": {
        "medianSqmPriceYen": 267000,
        "sampleCount": 37
      },
      "age_31_40": {
        "medianSqmPriceYen": 145000,
        "sampleCount": 10
      }
    },
    "buildingYearSampleCount": 81,
    "structureCounts": {
      "ＲＣ": 62,
      "ＳＲＣ": 8
    },
    "sampleCount": 84,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "德島",
    "district": "德島市",
    "layout": "k1",
    "medianTradePriceYen": 2500000,
    "medianSqmPriceYen": 125000,
    "medianAreaSqm": 20,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 125000,
        "sampleCount": 5
      }
    },
    "buildingYearSampleCount": 5,
    "structureCounts": {
      "ＳＲＣ": 3,
      "ＲＣ": 2
    },
    "sampleCount": 5,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "德島",
    "district": "德島市",
    "layout": "ldk1",
    "medianTradePriceYen": 7500000,
    "medianSqmPriceYen": 150000,
    "medianAreaSqm": 48,
    "ageBands": {
      "age_31_40": {
        "medianSqmPriceYen": 133000,
        "sampleCount": 6
      }
    },
    "buildingYearSampleCount": 7,
    "structureCounts": {
      "ＳＲＣ": 2,
      "ＲＣ": 5
    },
    "sampleCount": 8,
    "windowQuarters": 8,
    "periodStart": "2024-Q2",
    "periodEnd": "2025-Q3",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "德島",
    "district": "德島市",
    "layout": "ldk2",
    "medianTradePriceYen": 10300000,
    "medianSqmPriceYen": 174000,
    "medianAreaSqm": 60,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 333000,
        "sampleCount": 5
      },
      "age_31_40": {
        "medianSqmPriceYen": 120000,
        "sampleCount": 7
      }
    },
    "buildingYearSampleCount": 14,
    "structureCounts": {
      "ＲＣ": 9,
      "ＳＲＣ": 5
    },
    "sampleCount": 14,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  },
  {
    "region": "德島",
    "district": "德島市",
    "layout": "ldk3",
    "medianTradePriceYen": 16000000,
    "medianSqmPriceYen": 227000,
    "medianAreaSqm": 75,
    "ageBands": {
      "age_0_10": {
        "medianSqmPriceYen": 381000,
        "sampleCount": 6
      },
      "age_11_20": {
        "medianSqmPriceYen": 333000,
        "sampleCount": 11
      },
      "age_21_30": {
        "medianSqmPriceYen": 173000,
        "sampleCount": 12
      },
      "age_31_40": {
        "medianSqmPriceYen": 86000,
        "sampleCount": 14
      }
    },
    "buildingYearSampleCount": 44,
    "structureCounts": {
      "ＲＣ": 30,
      "ＳＲＣ": 14
    },
    "sampleCount": 44,
    "windowQuarters": 4,
    "periodStart": "2025-Q2",
    "periodEnd": "2026-Q1",
    "sourceUrl": "https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/"
  }
];
