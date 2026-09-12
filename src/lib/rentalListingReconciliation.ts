import { reconcileListingLayout } from "./listingLayoutReconciliation.js";

type RentalListingFields = {
  dealType?: string;
  buildingName?: string;
  roomNumber?: string;
  station?: string;
  walkTime?: string;
  transitAccess?: string;
  layout?: string;
  rent?: string;
  managementFee?: string;
  keyMoney?: string;
  deposit?: string;
  leaseTerms?: string;
  rentalConditions?: string;
  age?: string;
  floor?: string;
  address?: string;
  area?: string;
  structure?: string;
  guaranteeFee?: string;
  lockReplacementFee?: string;
  cleaningFee?: string;
  insuranceFee?: string;
  supportFee?: string;
  cancellationPenalty?: string;
  renewalFee?: string;
  facilities?: string;
  optionalFacilities?: string;
  occupancyStatus?: string;
  totalUnits?: string;
  buildingFloors?: string;
  specialNotes?: string;
};

function compactText(value: string) {
  return value.normalize("NFKC").replace(/[\s\u3000]+/gu, "");
}

function isWeak(value: unknown) {
  const text = String(value || "").trim();
  return !text || /^(?:未載明|なし|不明|待確認|費用がかかります)$/u.test(text);
}

function fill<T extends RentalListingFields, K extends keyof T>(target: T, key: K, value: T[K] | undefined) {
  if (value !== undefined && value !== "" && isWeak(target[key])) target[key] = value;
}

function capture(text: string, pattern: RegExp, group = 1) {
  return text.match(pattern)?.[group]?.trim();
}

/**
 * PDF 版面文字可正確保留表格標籤，但模型偶爾只回傳備考中的一小段。
 * 此層只回補圖紙明載的租賃事實，不推測未載費用，也不讀取仲介內部欄位。
 */
export function reconcileRentalListingText<T extends RentalListingFields>(original: T, layoutText?: string | null): T & RentalListingFields {
  if (!layoutText?.trim()) return original;
  const normalized = layoutText.normalize("NFKC");
  const compact = compactText(normalized);
  const looksRental = original.dealType === "rent" || /(?:賃料|LEASECONDITION|契約期間|敷金)/iu.test(compact);
  if (!looksRental) return original;

  const result: T & RentalListingFields = { ...original };
  const buildingName = capture(normalized, /^[ \t]+(\S.{0,60}?)[ \t]{10,}[^\n]*徒歩\s*\d+分[ \t]*$/mu);
  const roomNumber = capture(compact, /(\d{2,5})号室/u);
  const rent = capture(compact, /賃料([\d,]+円)/u);
  const managementFee = capture(compact, /管理費([\d,]+円)/u);
  const deposit = capture(compact, /敷金(\d+(?:\.\d+)?ヶ月)/u);
  const keyMoney = capture(compact, /礼金(\d+(?:\.\d+)?ヶ月)/u);
  const layout = capture(compact, /間取り([1-9][A-Z]{0,4})タイプ/iu);
  const rawArea = capture(compact, /専有面積([\d.]+(?:㎡|m2))/iu);
  const area = rawArea?.replace(/m2$/iu, "㎡");
  const address = capture(compact, /所在地(東京都[^■]+?)(?:構造|竣工日|駐車場)/u);
  const structure = capture(compact, /構造([^■]+?)規模/u);
  const buildingFloors = capture(compact, /規模(\d+)階建/u);
  const floor = capture(compact, /規模\d+階建(\d+)階/u);
  const age = capture(compact, /竣工日(\d{4}年\d{1,2}月)/u);
  const totalUnits = capture(compact, /総戸数(\d+戸)/u);

  result.dealType = "rent";
  fill(result, "buildingName", buildingName as T["buildingName"]);
  fill(result, "roomNumber", roomNumber ? `${roomNumber}号室` as T["roomNumber"] : undefined);
  fill(result, "rent", rent as T["rent"]);
  fill(result, "managementFee", managementFee as T["managementFee"]);
  fill(result, "deposit", deposit as T["deposit"]);
  fill(result, "keyMoney", keyMoney as T["keyMoney"]);
  fill(result, "leaseTerms", deposit && keyMoney ? `敷金${deposit} 礼金${keyMoney}` as T["leaseTerms"] : undefined);
  fill(result, "layout", layout as T["layout"]);
  fill(result, "area", area as T["area"]);
  fill(result, "address", address as T["address"]);
  fill(result, "structure", structure as T["structure"]);
  fill(result, "buildingFloors", buildingFloors as T["buildingFloors"]);
  fill(result, "floor", floor ? `${floor}階` as T["floor"] : undefined);
  fill(result, "age", age as T["age"]);
  fill(result, "totalUnits", totalUnits as T["totalUnits"]);

  const transitMatches = [...normalized.matchAll(/([^\s\n]{2,20}線)\s+([^\s\n]+?)(?:駅)?(?=\s*徒歩)\s*徒歩\s*(\d{1,3})分/gu)];
  if (transitMatches.length) {
    const transit = transitMatches.map(([, line, station, minutes]) => `${line} ${station.replace(/駅$/u, "")}駅 徒歩${minutes}分`);
    fill(result, "transitAccess", transit.join("\n") as T["transitAccess"]);
    fill(result, "station", transitMatches.map((match) => match[2].replace(/駅$/u, "")).join(",") as T["station"]);
    fill(result, "walkTime", transitMatches.map((match) => match[3]).join(",") as T["walkTime"]);
  }

  const conditions: string[] = [];
  const add = (condition: string | undefined) => {
    if (condition && !conditions.includes(condition)) conditions.push(condition);
  };
  const leaseYears = capture(compact, /契約期間(\d+)年/u);
  const renewalMonths = capture(compact, /更新料新賃料(\d+(?:\.\d+)?)ヶ月/u);
  const noticeMonths = capture(compact, /解約予告(\d+)ヶ月前/u);
  const lockFee = capture(compact, /鍵交換代([\d,]+円)(?:\(税込\))?/u);
  const disinfectionFee = capture(compact, /消毒代([\d,]+円)(?:\(税込\))?/u);
  const cleaningFee = capture(compact, /定額ルームクリーニング代([\d,]+円)(?:\(税込\))?/u);
  const clubFee = capture(compact, /「木下の賃貸」友の会費([\d,]+円)(?:\(税込\))?\/月額/u);
  const guaranteeInitial = capture(compact, /初回保証料(\d+%)/u);
  const guaranteeMonthly = capture(compact, /利用手数料月額([\d,]+円)(?:\(税込\))?/u);
  const guaranteeRenewal = compact.match(/継続保証委託料([\d,]+円)\(?([\d]+)年毎\)?/u);

  add(leaseYears ? `契約期間${leaseYears}年` : undefined);
  add(renewalMonths ? `更新料 新賃料${renewalMonths}ヶ月` : undefined);
  add(noticeMonths ? `解約予告${noticeMonths}ヶ月前` : undefined);
  add(/入居日即内見可/u.test(compact) ? "入居日：即、内見可" : undefined);
  add(/ペット飼育不可/u.test(compact) ? "ペット飼育不可" : undefined);
  add(guaranteeInitial ? `木下グループ保証：初回保証料${guaranteeInitial}${guaranteeMonthly ? `、利用手数料月額${guaranteeMonthly}` : ""}${guaranteeRenewal ? `、継続保証委託料${guaranteeRenewal[1]}（${guaranteeRenewal[2]}年毎）` : ""}` : undefined);
  add(clubFee ? `木下の賃貸友の会加入必須。友の会費${clubFee}（税込）/月額。入居者補償制度（火災保険）、緊急サポートを含む` : undefined);
  add(lockFee ? `鍵交換代${lockFee}（税込）` : undefined);
  add(disinfectionFee ? `消毒代${disinfectionFee}（税込）` : undefined);
  add(cleaningFee ? `定額ルームクリーニング代${cleaningFee}（税込、契約時支払）` : undefined);
  add(/12ヵ月未満の解約時、?賃料1ヵ月分の違約金/u.test(compact) ? "12ヵ月未満の解約時、賃料1ヵ月分の違約金" : undefined);

  if (conditions.length && (isWeak(result.rentalConditions) || String(result.rentalConditions || "").length < conditions.join("。").length / 2)) {
    result.rentalConditions = conditions.join("。");
  }
  fill(result, "renewalFee", renewalMonths ? `新賃料${renewalMonths}ヶ月` as T["renewalFee"] : undefined);
  fill(result, "cancellationPenalty", /12ヵ月未満の解約時/u.test(compact) ? "12ヵ月未満の解約時、賃料1ヵ月分" as T["cancellationPenalty"] : undefined);
  fill(result, "lockReplacementFee", lockFee as T["lockReplacementFee"]);
  fill(result, "cleaningFee", cleaningFee as T["cleaningFee"]);
  fill(result, "supportFee", clubFee ? `木下の賃貸友の会費${clubFee}（税込）/月額` as T["supportFee"] : undefined);
  fill(result, "insuranceFee", clubFee ? "木下の賃貸友の会費に入居者補償制度（火災保険）を含む（金額内訳待確認）" as T["insuranceFee"] : undefined);
  fill(result, "guaranteeFee", guaranteeInitial ? `木下グループ保証：初回${guaranteeInitial}${guaranteeMonthly ? `、月額利用手数料${guaranteeMonthly}` : ""}${guaranteeRenewal ? `、継続保証委託料${guaranteeRenewal[1]}（${guaranteeRenewal[2]}年毎）` : ""}` as T["guaranteeFee"] : undefined);
  fill(result, "occupancyStatus", /入居日即/u.test(compact) ? "即入居可・内見可" as T["occupancyStatus"] : undefined);

  const optional: string[] = [];
  if (/駐車場施設無空き無/u.test(compact)) optional.push("駐車場：施設なし・空きなし");
  if (/駐輪場施設無空き無/u.test(compact)) optional.push("駐輪場：施設なし・空きなし");
  if (optional.length && isWeak(result.optionalFacilities)) result.optionalFacilities = optional.join("、");

  const facilities: string[] = [];
  if (/インターネット月額基本使用料無料/u.test(compact)) facilities.push("インターネット月額基本使用料無料（iのぞみネット）");
  for (const equipment of ["オートロック", "洗濯機置場", "浴室乾燥機", "TVモニター付きインターフォン", "洗浄機能付暖房便座", "宅配ボックス", "追い焚き", "居室床材フローリング", "エアコン", "独立洗面台"]) {
    if (new RegExp(`${equipment}○`, "u").test(compact)) facilities.push(equipment);
  }
  if (facilities.length && isWeak(result.facilities)) result.facilities = facilities.join("、");

  const specialNotes: string[] = [];
  if (/CATV、?BS・CS110°、?インターネット等.*別途契約、?費用/u.test(compact)) {
    specialNotes.push("CATV・BS・CS・インターネットは利用可否確認のうえ別途契約・費用");
  }
  if (/実入居者様が61歳以上.*見守りサービス.*加入が必須/u.test(compact)) {
    specialNotes.push("実入居者が61歳以上の場合、指定見守りサービス加入必須（費用要確認）");
  }
  if (specialNotes.length && (isWeak(result.specialNotes) || String(result.specialNotes || "").length < 40)) {
    result.specialNotes = specialNotes.join("。");
  }

  return reconcileListingLayout(result, layoutText);
}
