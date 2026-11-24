import type { FormValues } from "../lib/moushikomi/schema";

/**
 * 預覽模式（/moushikomi#preview）：給 Linus 看畫面用，每一頁都先填好假資料，
 * 可以直接跳頁、切換身份；上傳與送出只在畫面上模擬，不會呼叫伺服器。
 */

export const PREVIEW_TOKEN = "preview";

const common: FormValues = {
  where: "japan", property: "中野 1K（範例物件）",
  NameEn: "WANG XIAOMING", NameKanji: "王小明", Kana: "オウ ショウメイ", Birthday: "1998-06-01", Gender: "m", nationality: "台灣",
  Phone: "+81 90-1234-5678", Email: "xiaoming@example.com",
  AddressRegion: "jp", AddressZip: "1640001", AddressPref: "東京都", AddressCity: "中野区", AddressTown: "中野 3-4-5", AddressBldg: "中野ハイツ 201",
  housing: "rent", currentRent: "68,000 円", yearsAtAddress: "1 年 2 個月", yearsInJapan: "2 年",
  jpNameEn: "SATO HANAKO", jpNationality: "日本", jpNameKanji: "佐藤花子", jpKana: "サトウ ハナコ", jpBirthday: "1996-03-15", jpGender: "f", jpRelation: "friend",
  jpPhone: "+81 80-2222-3333", jpEmail: "hanako@example.com",
  jpAddressRegion: "jp", jpAddressZip: "1600023", jpAddressPref: "東京都", jpAddressCity: "新宿区", jpAddressTown: "西新宿 1-2-3", jpAddressBldg: "西新宿ハウス 302",
  jpOrgName: "株式会社サンプル", jpOrgAddressRegion: "jp", jpOrgAddressZip: "1000005", jpOrgAddressPref: "東京都", jpOrgAddressCity: "千代田区", jpOrgAddressTown: "丸の内 1-1-1", jpOrgAddressBldg: "丸の内ビル 10F", jpOrgPhone: "03-1111-2222",
  homeNameEn: "WANG DAMING", homeNationality: "台灣", homeKana: "オウ ダイメイ", homeBirthday: "1968-09-20", homeGender: "m", homeRelation: "father",
  homePhone: "+886 912-345-678", homeEmail: "daming@example.com", homeAddressRegion: "overseas", homeAddressOverseas: "台北市大安區忠孝東路四段 1 號 5 樓",
  cohab: "alone",
};

export const PREVIEW_PRESETS: { id: string; label: string; values: FormValues; unknown?: Record<string, boolean> }[] = [
  {
    id: "student", label: "留學簽證・日本境內",
    values: { ...common, identity: "student", rent: "85000", income: "每月 15 萬円", schoolType: "lang", orgName: "東京日本語学校",
      orgAddressRegion: "jp", orgAddressZip: "1690075", orgAddressPref: "東京都", orgAddressCity: "新宿区", orgAddressTown: "高田馬場 1-2-3", orgAddressBldg: "高田馬場ビル 3F", orgPhone: "03-3333-4444" },
  },
  {
    id: "wh", label: "打工度假／J-Find・海外審查",
    values: { ...common, identity: "wh", whJob: "no", where: "overseas", rent: "70000", income: "每月 10 萬円",
      AddressRegion: "overseas", AddressOverseas: "台中市西屯區台灣大道三段 99 號", yearsInJapan: "" },
  },
  {
    id: "whSchool", label: "打工度假／J-Find・在上學",
    values: { ...common, identity: "wh", whJob: "school", where: "japan", rent: "70000", income: "每月 12 萬円", schoolType: "lang", orgName: "東京日本語学校",
      orgAddressRegion: "jp", orgAddressZip: "1690075", orgAddressPref: "東京都", orgAddressCity: "新宿区", orgAddressTown: "高田馬場 1-2-3", orgPhone: "03-3333-4444" },
  },
  {
    id: "worker", label: "入職三個月以上・與伴侶同住",
    values: { ...common, identity: "worker", workerStatus: "over3", income: "32 萬円",
      orgName: "株式会社テックサンプル", orgAddressRegion: "jp", orgAddressZip: "1066108", orgAddressPref: "東京都", orgAddressCity: "港区", orgAddressTown: "六本木 6-10-1", orgAddressBldg: "六本木ヒルズ森タワー 20F",
      orgPhone: "03-5555-6666", capital: "5,000 萬円", industry: "IT", employment: "full", dept: "開發部", jobDesc: "軟體工程師", jobYears: "2 年 4 個月",
      cohab: "partner", coNameEn: "LIN MEIHUA", coNationality: "台灣", coNameKanji: "林美華", coKana: "リン ビカ", coBirthday: "1999-11-11", coGender: "f",
      coPhone: "+81 90-7777-8888", coEmail: "", coAddressRegion: "jp", coAddressZip: "1640001", coAddressPref: "東京都", coAddressCity: "中野区", coAddressTown: "中野 3-4-5", coAddressBldg: "中野ハイツ 201",
      coHousing: "rent", coRent: "68,000 円", coYearsAt: "1 年", coYearsJp: "1 年", coCompany: "株式会社サンプル商事", coIncome: "25 萬円" },
  },
  {
    id: "offer", label: "工作簽證・海外審查",
    values: { ...common, identity: "worker", workerStatus: "offer", where: "overseas", income: "28 萬円",
      AddressRegion: "overseas", AddressOverseas: "高雄市苓雅區四維三路 2 號", yearsInJapan: "",
      orgName: "株式会社ネクスト", orgAddressRegion: "jp", orgAddressZip: "5300001", orgAddressPref: "大阪府", orgAddressCity: "大阪市北区", orgAddressTown: "梅田 2-2-2", orgAddressBldg: "梅田センタービル 8F",
      orgPhone: "06-1234-5678", capital: "", industry: "貿易", employment: "full", jobDesc: "業務", startDate: "2027-04-01" },
    unknown: { capital: true },
  },
  {
    id: "corporate", label: "法人契約・日本境內",
    values: { ...common, identity: "corporate", income: "40 萬円",
      orgName: "株式会社コーポサンプル", orgAddressRegion: "jp", orgAddressZip: "1500002", orgAddressPref: "東京都", orgAddressCity: "渋谷区", orgAddressTown: "渋谷 2-21-1", orgAddressBldg: "渋谷ヒカリエ 15F",
      orgPhone: "03-9999-0000", capital: "1 億円", industry: "顧問", employment: "full", jobDesc: "專案經理", jobYears: "3 年",
      guNameEn: "TANAKA ICHIRO", guNameKanji: "田中一郎", guKana: "タナカ イチロウ", guBirthday: "1975-04-10", guGender: "m", guNationality: "日本", guRelation: "boss",
      guPhone: "+81 90-5555-1234", guEmail: "tanaka@example.com",
      guAddressRegion: "jp", guAddressZip: "1530064", guAddressPref: "東京都", guAddressCity: "目黒区", guAddressTown: "下目黒 1-2-3", guAddressBldg: "一戶建",
      guHousing: "own", guYearsAt: "12 年", guYearsJp: "", guIncome: "80 萬円" },
  },
];

/** 預覽用的假檔案（看上傳後的樣子）。 */
export const PREVIEW_FILES = [{ docId: "passport", name: "護照照片頁.jpg", driveFileId: "preview-1", size: 512000 }];
