/**
 * 全國都道府県治安快照（e-Stat 社会生活統計指標）。
 *
 * 此檔由 `npm run data:update:crime` 產生，請勿手動編輯。
 *
 * 為什麼是都道府県級：全罪種的町丁目級統計只有東京都提供（且按月更新），
 * 其餘 46 道府県的開放資料僅涵蓋窃盗 7 手口且各縣格式不一；
 * e-Stat 的市区町村級全罪種表停在 2009 年度，過舊不宜使用。
 * 因此非東京物件以都道府県級對照全國基準，並在 UI 明確標示精度差異。
 */

export interface CrimePrefectureRow {
  /** e-Stat 地區代碼，例如 "13000"。 */
  code: string;
  prefecture: string;
  /** 人口千人あたり刑法犯認知件数。 */
  crimeRatePerThousand: number;
  clearanceRatePercent: number | null;
  felonySharePercent: number | null;
  violentSharePercent: number | null;
  theftSharePercent: number | null;
  /** 相對全国平均的倍率，1 為與全国相同。 */
  vsNational: number;
  /** 1 = 全國最安全（每千人犯罪率最低）。 */
  safetyRank: number;
}

export const crimePrefectureMeta = {
  generatedAt: "2026-09-11",
  fiscalYear: "2023年度",
  nationalRatePerThousand: 5.66,
  prefectureCount: 47,
  statsDataId: "0000010211",
  sourceName: "総務省「社会生活統計指標（都道府県データ）Ｋ 安全」（e-Stat）",
  sourceUrl: "https://www.e-stat.go.jp/dbview?sid=0000010211",
};

export const crimePrefectureRows: CrimePrefectureRow[] = [
  {
    "code": "01000",
    "prefecture": "北海道",
    "crimeRatePerThousand": 4.37,
    "clearanceRatePercent": 49.3,
    "felonySharePercent": 1.03,
    "violentSharePercent": 15.6,
    "theftSharePercent": 62.74,
    "vsNational": 0.772,
    "safetyRank": 19
  },
  {
    "code": "02000",
    "prefecture": "青森県",
    "crimeRatePerThousand": 4.07,
    "clearanceRatePercent": 52.9,
    "felonySharePercent": 1.02,
    "violentSharePercent": 8.93,
    "theftSharePercent": 61.68,
    "vsNational": 0.719,
    "safetyRank": 14
  },
  {
    "code": "03000",
    "prefecture": "岩手県",
    "crimeRatePerThousand": 2.46,
    "clearanceRatePercent": 53.7,
    "felonySharePercent": 1.68,
    "violentSharePercent": 7.7,
    "theftSharePercent": 68.91,
    "vsNational": 0.435,
    "safetyRank": 1
  },
  {
    "code": "04000",
    "prefecture": "宮城県",
    "crimeRatePerThousand": 5.12,
    "clearanceRatePercent": 41.3,
    "felonySharePercent": 1.1,
    "violentSharePercent": 7.31,
    "theftSharePercent": 66.3,
    "vsNational": 0.905,
    "safetyRank": 30
  },
  {
    "code": "05000",
    "prefecture": "秋田県",
    "crimeRatePerThousand": 2.63,
    "clearanceRatePercent": 67.9,
    "felonySharePercent": 0.75,
    "violentSharePercent": 5.53,
    "theftSharePercent": 66.54,
    "vsNational": 0.465,
    "safetyRank": 2
  },
  {
    "code": "06000",
    "prefecture": "山形県",
    "crimeRatePerThousand": 2.9,
    "clearanceRatePercent": 65,
    "felonySharePercent": 0.77,
    "violentSharePercent": 16.31,
    "theftSharePercent": 65.1,
    "vsNational": 0.512,
    "safetyRank": 4
  },
  {
    "code": "07000",
    "prefecture": "福島県",
    "crimeRatePerThousand": 4.53,
    "clearanceRatePercent": 40.8,
    "felonySharePercent": 0.5,
    "violentSharePercent": 6.93,
    "theftSharePercent": 70.91,
    "vsNational": 0.8,
    "safetyRank": 24
  },
  {
    "code": "08000",
    "prefecture": "茨城県",
    "crimeRatePerThousand": 7,
    "clearanceRatePercent": 30.1,
    "felonySharePercent": 0.62,
    "violentSharePercent": 6.85,
    "theftSharePercent": 74.82,
    "vsNational": 1.237,
    "safetyRank": 45
  },
  {
    "code": "09000",
    "prefecture": "栃木県",
    "crimeRatePerThousand": 6.29,
    "clearanceRatePercent": 29,
    "felonySharePercent": 0.59,
    "violentSharePercent": 5.03,
    "theftSharePercent": 78.19,
    "vsNational": 1.111,
    "safetyRank": 40
  },
  {
    "code": "10000",
    "prefecture": "群馬県",
    "crimeRatePerThousand": 7.01,
    "clearanceRatePercent": 40.1,
    "felonySharePercent": 0.47,
    "violentSharePercent": 7.95,
    "theftSharePercent": 74.38,
    "vsNational": 1.239,
    "safetyRank": 46
  },
  {
    "code": "11000",
    "prefecture": "埼玉県",
    "crimeRatePerThousand": 6.77,
    "clearanceRatePercent": 31.8,
    "felonySharePercent": 0.83,
    "violentSharePercent": 6.74,
    "theftSharePercent": 73.21,
    "vsNational": 1.196,
    "safetyRank": 43
  },
  {
    "code": "12000",
    "prefecture": "千葉県",
    "crimeRatePerThousand": 6,
    "clearanceRatePercent": 31.5,
    "felonySharePercent": 0.71,
    "violentSharePercent": 5.9,
    "theftSharePercent": 75.36,
    "vsNational": 1.06,
    "safetyRank": 35
  },
  {
    "code": "13000",
    "prefecture": "東京都",
    "crimeRatePerThousand": 6.33,
    "clearanceRatePercent": 35,
    "felonySharePercent": 0.86,
    "violentSharePercent": 8.27,
    "theftSharePercent": 67.22,
    "vsNational": 1.118,
    "safetyRank": 41
  },
  {
    "code": "14000",
    "prefecture": "神奈川県",
    "crimeRatePerThousand": 4.75,
    "clearanceRatePercent": 38.6,
    "felonySharePercent": 0.87,
    "violentSharePercent": 6.99,
    "theftSharePercent": 73.28,
    "vsNational": 0.839,
    "safetyRank": 27
  },
  {
    "code": "15000",
    "prefecture": "新潟県",
    "crimeRatePerThousand": 4.08,
    "clearanceRatePercent": 49.1,
    "felonySharePercent": 0.71,
    "violentSharePercent": 9.41,
    "theftSharePercent": 66.64,
    "vsNational": 0.721,
    "safetyRank": 15
  },
  {
    "code": "16000",
    "prefecture": "富山県",
    "crimeRatePerThousand": 4.47,
    "clearanceRatePercent": 56.1,
    "felonySharePercent": 0.67,
    "violentSharePercent": 13.51,
    "theftSharePercent": 65.12,
    "vsNational": 0.79,
    "safetyRank": 21
  },
  {
    "code": "17000",
    "prefecture": "石川県",
    "crimeRatePerThousand": 4.31,
    "clearanceRatePercent": 55.2,
    "felonySharePercent": 0.69,
    "violentSharePercent": 9.99,
    "theftSharePercent": 70.97,
    "vsNational": 0.761,
    "safetyRank": 17
  },
  {
    "code": "18000",
    "prefecture": "福井県",
    "crimeRatePerThousand": 3.82,
    "clearanceRatePercent": 57.4,
    "felonySharePercent": 0.74,
    "violentSharePercent": 11.76,
    "theftSharePercent": 69.54,
    "vsNational": 0.675,
    "safetyRank": 9
  },
  {
    "code": "19000",
    "prefecture": "山梨県",
    "crimeRatePerThousand": 4.23,
    "clearanceRatePercent": 46.1,
    "felonySharePercent": 0.77,
    "violentSharePercent": 5.17,
    "theftSharePercent": 74.12,
    "vsNational": 0.747,
    "safetyRank": 16
  },
  {
    "code": "20000",
    "prefecture": "長野県",
    "crimeRatePerThousand": 3.88,
    "clearanceRatePercent": 46.4,
    "felonySharePercent": 0.77,
    "violentSharePercent": 7.29,
    "theftSharePercent": 68.99,
    "vsNational": 0.686,
    "safetyRank": 11
  },
  {
    "code": "21000",
    "prefecture": "岐阜県",
    "crimeRatePerThousand": 6.17,
    "clearanceRatePercent": 39.7,
    "felonySharePercent": 0.44,
    "violentSharePercent": 8.62,
    "theftSharePercent": 66.27,
    "vsNational": 1.09,
    "safetyRank": 36
  },
  {
    "code": "22000",
    "prefecture": "静岡県",
    "crimeRatePerThousand": 4.39,
    "clearanceRatePercent": 47.7,
    "felonySharePercent": 1.13,
    "violentSharePercent": 12.36,
    "theftSharePercent": 64.98,
    "vsNational": 0.776,
    "safetyRank": 20
  },
  {
    "code": "23000",
    "prefecture": "愛知県",
    "crimeRatePerThousand": 6.26,
    "clearanceRatePercent": 33.3,
    "felonySharePercent": 0.79,
    "violentSharePercent": 8.18,
    "theftSharePercent": 67.23,
    "vsNational": 1.106,
    "safetyRank": 39
  },
  {
    "code": "24000",
    "prefecture": "三重県",
    "crimeRatePerThousand": 5.76,
    "clearanceRatePercent": 38.3,
    "felonySharePercent": 0.55,
    "violentSharePercent": 6.65,
    "theftSharePercent": 69.4,
    "vsNational": 1.018,
    "safetyRank": 34
  },
  {
    "code": "25000",
    "prefecture": "滋賀県",
    "crimeRatePerThousand": 5.52,
    "clearanceRatePercent": 47.2,
    "felonySharePercent": 0.82,
    "violentSharePercent": 9.23,
    "theftSharePercent": 62.64,
    "vsNational": 0.975,
    "safetyRank": 33
  },
  {
    "code": "26000",
    "prefecture": "京都府",
    "crimeRatePerThousand": 4.69,
    "clearanceRatePercent": 46.8,
    "felonySharePercent": 0.86,
    "violentSharePercent": 8.23,
    "theftSharePercent": 69.8,
    "vsNational": 0.829,
    "safetyRank": 25
  },
  {
    "code": "27000",
    "prefecture": "大阪府",
    "crimeRatePerThousand": 9.15,
    "clearanceRatePercent": 26.7,
    "felonySharePercent": 0.92,
    "violentSharePercent": 6.03,
    "theftSharePercent": 72.75,
    "vsNational": 1.617,
    "safetyRank": 47
  },
  {
    "code": "28000",
    "prefecture": "兵庫県",
    "crimeRatePerThousand": 6.94,
    "clearanceRatePercent": 38.7,
    "felonySharePercent": 0.8,
    "violentSharePercent": 11.4,
    "theftSharePercent": 61.03,
    "vsNational": 1.226,
    "safetyRank": 44
  },
  {
    "code": "29000",
    "prefecture": "奈良県",
    "crimeRatePerThousand": 4.52,
    "clearanceRatePercent": 60.5,
    "felonySharePercent": 0.38,
    "violentSharePercent": 9.84,
    "theftSharePercent": 63.23,
    "vsNational": 0.799,
    "safetyRank": 22
  },
  {
    "code": "30000",
    "prefecture": "和歌山県",
    "crimeRatePerThousand": 4.52,
    "clearanceRatePercent": 60,
    "felonySharePercent": 0.62,
    "violentSharePercent": 12.02,
    "theftSharePercent": 60.75,
    "vsNational": 0.799,
    "safetyRank": 23
  },
  {
    "code": "31000",
    "prefecture": "鳥取県",
    "crimeRatePerThousand": 3.91,
    "clearanceRatePercent": 67.6,
    "felonySharePercent": 0.67,
    "violentSharePercent": 9.9,
    "theftSharePercent": 69.1,
    "vsNational": 0.691,
    "safetyRank": 12
  },
  {
    "code": "32000",
    "prefecture": "島根県",
    "crimeRatePerThousand": 3.01,
    "clearanceRatePercent": 72.7,
    "felonySharePercent": 0.87,
    "violentSharePercent": 8.23,
    "theftSharePercent": 60.69,
    "vsNational": 0.532,
    "safetyRank": 6
  },
  {
    "code": "33000",
    "prefecture": "岡山県",
    "crimeRatePerThousand": 5,
    "clearanceRatePercent": 43.7,
    "felonySharePercent": 0.87,
    "violentSharePercent": 9.57,
    "theftSharePercent": 70.44,
    "vsNational": 0.883,
    "safetyRank": 29
  },
  {
    "code": "34000",
    "prefecture": "広島県",
    "crimeRatePerThousand": 5.18,
    "clearanceRatePercent": 41.6,
    "felonySharePercent": 0.75,
    "violentSharePercent": 8.37,
    "theftSharePercent": 63.46,
    "vsNational": 0.915,
    "safetyRank": 31
  },
  {
    "code": "35000",
    "prefecture": "山口県",
    "crimeRatePerThousand": 3.22,
    "clearanceRatePercent": 55.1,
    "felonySharePercent": 0.72,
    "violentSharePercent": 8.5,
    "theftSharePercent": 62.76,
    "vsNational": 0.569,
    "safetyRank": 7
  },
  {
    "code": "36000",
    "prefecture": "徳島県",
    "crimeRatePerThousand": 3.85,
    "clearanceRatePercent": 43,
    "felonySharePercent": 0.6,
    "violentSharePercent": 5.16,
    "theftSharePercent": 67.98,
    "vsNational": 0.68,
    "safetyRank": 10
  },
  {
    "code": "37000",
    "prefecture": "香川県",
    "crimeRatePerThousand": 6.22,
    "clearanceRatePercent": 46.6,
    "felonySharePercent": 0.57,
    "violentSharePercent": 8.57,
    "theftSharePercent": 56.64,
    "vsNational": 1.099,
    "safetyRank": 37
  },
  {
    "code": "38000",
    "prefecture": "愛媛県",
    "crimeRatePerThousand": 5.27,
    "clearanceRatePercent": 49.4,
    "felonySharePercent": 0.78,
    "violentSharePercent": 6.46,
    "theftSharePercent": 65.9,
    "vsNational": 0.931,
    "safetyRank": 32
  },
  {
    "code": "39000",
    "prefecture": "高知県",
    "crimeRatePerThousand": 4.77,
    "clearanceRatePercent": 48.9,
    "felonySharePercent": 0.91,
    "violentSharePercent": 7.17,
    "theftSharePercent": 73.2,
    "vsNational": 0.843,
    "safetyRank": 28
  },
  {
    "code": "40000",
    "prefecture": "福岡県",
    "crimeRatePerThousand": 6.52,
    "clearanceRatePercent": 36.5,
    "felonySharePercent": 0.65,
    "violentSharePercent": 10.03,
    "theftSharePercent": 66.4,
    "vsNational": 1.152,
    "safetyRank": 42
  },
  {
    "code": "41000",
    "prefecture": "佐賀県",
    "crimeRatePerThousand": 4.72,
    "clearanceRatePercent": 49.4,
    "felonySharePercent": 1.07,
    "violentSharePercent": 8.64,
    "theftSharePercent": 64.37,
    "vsNational": 0.834,
    "safetyRank": 26
  },
  {
    "code": "42000",
    "prefecture": "長崎県",
    "crimeRatePerThousand": 2.99,
    "clearanceRatePercent": 57.7,
    "felonySharePercent": 1.24,
    "violentSharePercent": 10.7,
    "theftSharePercent": 56.23,
    "vsNational": 0.528,
    "safetyRank": 5
  },
  {
    "code": "43000",
    "prefecture": "熊本県",
    "crimeRatePerThousand": 3.61,
    "clearanceRatePercent": 52.7,
    "felonySharePercent": 1.2,
    "violentSharePercent": 12.05,
    "theftSharePercent": 65.37,
    "vsNational": 0.638,
    "safetyRank": 8
  },
  {
    "code": "44000",
    "prefecture": "大分県",
    "crimeRatePerThousand": 2.73,
    "clearanceRatePercent": 50.6,
    "felonySharePercent": 1.04,
    "violentSharePercent": 8.39,
    "theftSharePercent": 64.55,
    "vsNational": 0.482,
    "safetyRank": 3
  },
  {
    "code": "45000",
    "prefecture": "宮崎県",
    "crimeRatePerThousand": 4.04,
    "clearanceRatePercent": 48.2,
    "felonySharePercent": 1.33,
    "violentSharePercent": 7.85,
    "theftSharePercent": 70.91,
    "vsNational": 0.714,
    "safetyRank": 13
  },
  {
    "code": "46000",
    "prefecture": "鹿児島県",
    "crimeRatePerThousand": 4.34,
    "clearanceRatePercent": 40.7,
    "felonySharePercent": 1.21,
    "violentSharePercent": 8.42,
    "theftSharePercent": 63.23,
    "vsNational": 0.767,
    "safetyRank": 18
  },
  {
    "code": "47000",
    "prefecture": "沖縄県",
    "crimeRatePerThousand": 6.22,
    "clearanceRatePercent": 44.7,
    "felonySharePercent": 0.78,
    "violentSharePercent": 11,
    "theftSharePercent": 65.6,
    "vsNational": 1.099,
    "safetyRank": 38
  }
];

const byPrefecture = new Map(crimePrefectureRows.map(row => [row.prefecture, row]));

/** 以都道府県名稱查詢，找不到回傳 null。 */
export function findCrimePrefecture(name: string): CrimePrefectureRow | null {
  return byPrefecture.get(name) ?? null;
}
