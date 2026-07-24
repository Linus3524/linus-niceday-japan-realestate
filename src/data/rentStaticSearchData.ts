export type RentStaticSectionId = "sop" | "documents" | "routes" | "reminders";

export interface ScreeningDocumentProfile {
  profile: string;
  documents: string[];
  availability: "多" | "一般" | "最少" | "不一定";
}

export const overseasScreeningDocuments: ScreeningDocumentProfile[] = [
  { profile: "工作簽證", documents: ["護照照片頁", "在留資格認定書（COE）", "僱傭契約書"], availability: "一般" },
  { profile: "留學簽證", documents: ["護照照片頁", "在留資格認定書（COE）", "入學通知書"], availability: "一般" },
  { profile: "打工度假簽證", documents: ["護照照片頁", "日本簽證貼紙", "銀行財力或餘額證明"], availability: "最少" }
];

export const domesticScreeningDocuments: ScreeningDocumentProfile[] = [
  { profile: "尚未入職", documents: ["護照照片頁", "在留卡正反面", "僱傭契約書"], availability: "多" },
  { profile: "入職未滿三個月", documents: ["在留卡正反面", "護照照片頁", "日本保險證正反面", "已有的薪資明細", "僱傭條件通知書"], availability: "多" },
  { profile: "入職三個月以上", documents: ["在留卡正反面", "護照照片頁", "日本保險證正反面", "現有公司源泉票", "三個月薪資明細", "僱傭條件通知書"], availability: "多" },
  { profile: "轉職中", documents: ["在留卡正反面", "護照照片頁", "新公司內定通知書", "新公司僱傭條件通知書", "舊公司三個月薪資明細（視個案）"], availability: "多" },
  { profile: "留學簽證", documents: ["護照照片頁", "在留卡正反面", "學生證", "銀行財力或餘額證明"], availability: "一般" },
  { profile: "打工度假簽證", documents: ["護照照片頁", "在留卡正反面", "銀行財力或餘額證明"], availability: "最少" },
  { profile: "法人契約（社員入住）", documents: ["公司登記簿謄本", "公司決算書影本", "公司印鑑證明書", "代表者印鑑證明書", "入住者在留卡與護照", "社員證或在職證明", "公司簡介或業務資料"], availability: "不一定" }
];

export const domesticScreeningNotice =
  "境內申請前通常還需準備：已登錄地址的在留卡、日本保險證、本人日本電話、姓名一致的印章、母國及在日緊急聯絡人資料，以及不記載個人編號的住民票。";

export const screeningDocumentDisclaimer =
  "以上為 Linus 的申請準備對照，不是所有物件一律要求的固定清單。管理公司、保證公司、簽證狀態與個別案件可能追加、減少或改用其他文件，送件前請以該物件最新書面要求為準。";

export const overseasSop = {
  badge: "海外審査",
  title: "飛日前提前申請流程",
  description:
    "適合已取得《在留資格認定證明書》(COE) 或打工度假貼紙，人尚未入境日本的人。能省去入境後的租屋等待期，好處是落地即入住！",
  steps: [
    "領取在留資格認定書／打工渡假簽證貼紙",
    "開始找房",
    "遞交個人資料",
    "申請房子",
    "審査",
    "繳交初期費用",
    "入境日本（在海關那邊領取在留卡）",
    "簽約",
    "等入居日簽收鑰匙",
    "區役所登入地址",
    "辦日本門號",
    "申請日本郵局銀行帳戶",
    "綁定自動扣款"
  ]
};

export const domesticSop = {
  badge: "入境審査",
  title: "抵達日本境內申請流程",
  description:
    "適合人已在日本，擁有登記過原臨時地址在留卡、日本電話與個人印章的人。可安排實體內見看房，能挑選的房源物件範圍是最多的。",
  steps: [
    "入境領取在留卡",
    "區役所登錄地址並申請住民票＆辦保險證",
    "辦日本門號",
    "開始找房",
    "遞交個人資料",
    "申請房子",
    "審査",
    "繳交初期費用",
    "簽約",
    "等入居日簽收鑰匙",
    "轉出轉入新地址",
    "申請郵局銀行帳戶",
    "綁定自動扣款"
  ]
};

export const applicationRoutes = [
  {
    title: "一般申請",
    condition: "已退房・已內見",
    body: "看過屋況後送件，走標準審查與契約流程，通常不需要簽未內見同意書。",
    note: "最能掌握實際屋況"
  },
  {
    title: "先行申請",
    condition: "未退房・未內見",
    body: "少數管理公司可先送審；通過後待退房再內見，確認屋況後才決定是否繼續契約流程。",
    note: "內見後仍有決定空間"
  },
  {
    title: "先行契約",
    condition: "未退房・未內見",
    body: "多數管理公司優先採用。審查通過後即進入簽約，通常須簽未內見同意書，入住前未必能再看房。",
    note: "簽約前務必確認可承擔風險"
  }
];

export const processReminders = [
  "不內見找房建議於預計入住日前約 1.5 個月開始；若需要內見，建議確定入住日期後，於入住前 1 個月內開始找房即可。因為日本房源基本上是無法付訂金保留的，熱門物件一上架便會很快被租走。",
  "若在留卡首次登錄的地址只是暫時住所，建議等入住正式租屋處並完成住址變更後，再辦理郵局或銀行帳戶，可避免後續因地址變更而需重新辦理相關手續。",
  "審查期間收到水電、瓦斯或網路代辦業者的電話、簡訊或 Email，通常是管理公司合作的生活服務代辦，和仲介未必有關；不需要時可直接婉拒，但指定供應商仍應以物件條件為準。",
  "初期精算書是依當下條件製作的參考；保證公司初期費、月額費與火災保險的付款方式，可能在審查或最終契約條件確定後調整，請以正式文件為準。",
  "第一次房租自動扣款若來不及扣到，可能改由保證公司通知匯款，或寄送帳單至住處超商繳費；收到通知後請在期限內處理。"
];

function joinProfiles(profiles: ScreeningDocumentProfile[]) {
  return profiles.flatMap(profile => [profile.profile, profile.availability, ...profile.documents]);
}

const staticSearchSections: Array<{ id: RentStaticSectionId; text: string }> = [
  {
    id: "sop",
    text: [
      "日本租屋正式申請與引渡流程 SOP",
      overseasSop.badge,
      overseasSop.title,
      overseasSop.description,
      ...overseasSop.steps,
      domesticSop.badge,
      domesticSop.title,
      domesticSop.description,
      ...domesticSop.steps
    ].join(" ")
  },
  {
    id: "documents",
    text: [
      "審査所需資料與準備文件對照",
      "依海外 日本境內審査與目前身份 查看建議先準備的文件",
      ...joinProfiles(overseasScreeningDocuments),
      ...joinProfiles(domesticScreeningDocuments),
      domesticScreeningNotice,
      screeningDocumentDisclaimer
    ].join(" ")
  },
  {
    id: "routes",
    text: [
      "申請前 先確認是哪一種流程",
      "是否已退房 能否內見 會直接影響申請後還有沒有改變決定的空間",
      "三種申請方式",
      ...applicationRoutes.flatMap(route => [route.title, route.condition, route.body, route.note])
    ].join(" ")
  },
  {
    id: "reminders",
    text: ["Linus 實務小提醒", ...processReminders].join(" ")
  }
];

export function hasMinimumKnowledgeSearchLength(query: string) {
  return Array.from(query.trim()).length >= 2;
}

export function getRentStaticMatches(query: string, category: string): RentStaticSectionId[] {
  if (!hasMinimumKnowledgeSearchLength(query) || (category !== "all" && category !== "steps")) return [];
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return staticSearchSections
    .filter(section => section.text.toLocaleLowerCase().includes(normalizedQuery))
    .map(section => section.id);
}
