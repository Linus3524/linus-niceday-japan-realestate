import { normalizeMonthUnit, parseGuaranteeFeeBreakdown } from "./listingExtraction";
import { parseAndExplainSpecialNotes } from "./specialNotesParser";
import type { RentalConditionItem, SpecialNoteItem } from "./rentalConditions";

export interface RentalConditionGroup {
  id: string;
  title: string;
  items: string[];
}

export interface RentalConditionSection {
  title: string;
  rows: Array<{ title: string; items: string[] }>;
}

/**
 * 語意去重與分類標籤產生器
 * 依據條款核心語意分配唯一 canonicalKey 與標準所屬卡片/列，防止不同來源或句式重複出現。
 */
export function getSemanticKey(text: string): { key: string; canonicalCategory: "lease" | "moveIn" | "extraContract" | "guarantee" | "fees" | "moveOut" | "optional" | "other" } {
  const norm = text.replace(/[\s\(\)（）:：,，。、]+/g, "").toLowerCase();

  // 1. 24小時生活管家/支援服務（Concierge24、24Hサポート等） -> 歸入 fees
  if (/concierge24|安心サポート|くらしーど|24時間サポート|ライフサポート|安心入居|生活支援|生活急難/i.test(norm)) {
    return { key: "fee:concierge_or_support", canonicalCategory: "fees" };
  }
  // 2. 友之會 / 會員月費 -> 歸入 fees
  if (/友の会|友之會|リブクラブ|livclub/i.test(norm)) {
    return { key: "fee:membership", canonicalCategory: "fees" };
  }
  // 3. 換鎖費 -> 歸入 fees
  if (/鍵交換|換鎖/i.test(norm)) {
    return { key: "fee:lock_replacement", canonicalCategory: "fees" };
  }
  // 4. 簽約事務手續費（非更新/再契約手續費） -> 歸入 fees
  if (/(?:契約事務|事務)(?:手数料|手續費)|事務費/i.test(norm) && !/更新|再契約|再簽約/i.test(norm)) {
    return { key: "fee:admin_fee", canonicalCategory: "fees" };
  }
  // 5. 消毒/抗菌 -> 歸入 fees
  if (/消毒|抗菌/i.test(norm)) {
    return { key: "fee:disinfection", canonicalCategory: "fees" };
  }
  // 6. 家具家電撤除費 -> 歸入 fees
  if (/家具家電撤除/i.test(norm)) {
    return { key: "fee:furniture_removal", canonicalCategory: "fees" };
  }

  // 7. 長者守護服務 / 高齡者條件 (みまもりS等) -> 歸入 extraContract
  if (/みまもり|見守り|高齢者|長者守護|安危監護/i.test(norm)) {
    return { key: "contract:elderly_mimamori", canonicalCategory: "extraContract" };
  }
  // 8. 外國籍 / 海外審查 -> 歸入 extraContract
  if (/外国籍|外國籍|海外審査|gtn/i.test(norm)) {
    return { key: "contract:foreigner", canonicalCategory: "extraContract" };
  }
  // 9. 辦公室/事務所/SOHO限制 -> 歸入 extraContract
  if (/事務所|soho|辦公室/i.test(norm)) {
    return { key: "contract:office_use", canonicalCategory: "extraContract" };
  }
  // 10. 樂器使用限制 -> 歸入 extraContract
  if (/楽器|樂器|鋼琴|ピアノ/i.test(norm)) {
    return { key: "contract:instrument", canonicalCategory: "extraContract" };
  }
  // 11. 單身限定 / 入住人數 -> 歸入 extraContract
  if (/単身|一人入居|二人入居|兩人|單身|合租|ルームシェア/i.test(norm)) {
    return { key: "contract:occupancy_count", canonicalCategory: "extraContract" };
  }
  // 12. 禁煙 -> 歸入 extraContract
  if (/禁煙|吸煙|吸菸/i.test(norm)) {
    return { key: "contract:smoking", canonicalCategory: "extraContract" };
  }
  // 13. 民泊/轉租 -> 歸入 extraContract
  if (/民泊|轉租|转租|民宿/i.test(norm)) {
    return { key: "contract:minpaku", canonicalCategory: "extraContract" };
  }
  // 14. 先行契約 -> 歸入 extraContract
  if (/先行契約/i.test(norm)) {
    return { key: "contract:advance_signing", canonicalCategory: "extraContract" };
  }

  // 15. 寵物相關 -> 歸入 moveIn (寵物條件)
  if (/ペット|寵物|小型犬|猫|飼育/i.test(norm)) {
    return { key: "pet:condition", canonicalCategory: "moveIn" };
  }
  // 16. 入住時期 / 可入住日 -> 歸入 moveIn
  if (/入居時期|入居日|起租|即時|立即入住|可看房|可看屋|内見/i.test(norm)) {
    return { key: "moveIn:timing", canonicalCategory: "moveIn" };
  }
  // 17. 敷金禮金優惠 / 免租期 -> 歸入 moveIn
  if (/キャンペーン|フリーレント|免租期|免押金.*免禮金|零押金/i.test(norm)) {
    return { key: "moveIn:campaign", canonicalCategory: "moveIn" };
  }

  // 18. 短期解約違約金 -> 歸入 moveOut
  if (/短期解約|解約違約金|違約金/i.test(norm)) {
    return { key: "moveOut:cancellation_penalty", canonicalCategory: "moveOut" };
  }
  // 19. 解約預告 -> 歸入 moveOut
  if (/解約予告|退租須於/i.test(norm)) {
    return { key: "moveOut:notice_period", canonicalCategory: "moveOut" };
  }
  // 20. 退租清潔費 / クリーンコート代 / 清潔費支付時點 -> 歸入 moveOut
  if (/ハウスクリーニング|ルームクリーニング|清掃|清潔費|クリーンコート|退去時支払/i.test(norm)) {
    if (/退去時支払|變更為退租時支付|退租時支付/.test(norm)) {
      return { key: "moveOut:cleaning_timing", canonicalCategory: "moveOut" };
    }
    return { key: "moveOut:cleaning_fee", canonicalCategory: "moveOut" };
  }
  // 21. 退租結算手續費 -> 歸入 moveOut
  if (/退去時精算|退租結算/i.test(norm)) {
    return { key: "moveOut:settlement_fee", canonicalCategory: "moveOut" };
  }

  // 22. 保證公司 / 保證料 -> 歸入 guarantee
  if (/保証会社|保證公司|初回保証|月次保証|エポス|epos|gtn|casa|保証料/i.test(norm)) {
    return { key: "guarantee:company", canonicalCategory: "guarantee" };
  }
  // 23. 火災保險 / 損害保險 -> 歸入 guarantee
  if (/火災保険|損害保険|火災保險|家財保険|家財保險/i.test(norm)) {
    return { key: "guarantee:insurance", canonicalCategory: "guarantee" };
  }

  // 24. 更新事務手續費 -> 歸入 lease
  if (/更新事務手数料|更新手續費/i.test(norm)) {
    return { key: "lease:renewal_admin", canonicalCategory: "lease" };
  }
  // 25. 更新料 / 再契約料 / 再契約特約 -> 歸入 lease
  if (/更新料|再契約料|契約更新費|再契約|再簽約/i.test(norm)) {
    return { key: "lease:renewal_fee", canonicalCategory: "lease" };
  }
  // 26. 租金調整 / 法人普通借相談 -> 歸入 lease
  if (/賃料改定|租金調整|普通借相談/i.test(norm)) {
    return { key: "lease:rent_revision", canonicalCategory: "lease" };
  }
  // 27. 租賃契約期間 / 租期 -> 歸入 lease
  if (/普通賃貸借|定期借家|契約期間|租賃契約期間|租期\s*\d+年/i.test(norm)) {
    return { key: "lease:term", canonicalCategory: "lease" };
  }

  // 28. 停車場 / 駐輪場 / 機車 -> 歸入 optional
  if (/駐車場|駐輪場|バイク|停車場|自行車|機車|選配/i.test(norm)) {
    return { key: "optional:parking_bike", canonicalCategory: "optional" };
  }

  return { key: `other:${norm.slice(0, 20)}`, canonicalCategory: "other" };
}

/**
 * 「重要特約與法務事項」四大區塊的資料整理：租賃條件分組＋圖紙備考特約合併去重。
 * 網站的 RentalConditionSummary 與 PDF 版型共用，兩邊看到的條款一定一致。
 */
export function buildRentalConditionSections({
  rentalConditions,
  rentalConditionItems,
  optionalFacilities,
  specialNotes,
  specialNoteItems,
  shikibiki,
  guaranteeFee,
  insuranceFee,
  renewalFee,
  totalMonthlyCost,
}: {
  rentalConditions?: string | null;
  rentalConditionItems?: RentalConditionItem[] | null;
  optionalFacilities?: string | null;
  specialNotes?: string | null;
  specialNoteItems?: SpecialNoteItem[] | null;
  shikibiki?: string | null;
  guaranteeFee?: string | null;
  insuranceFee?: string | null;
  renewalFee?: string | null;
  totalMonthlyCost?: number | null;
}): RentalConditionSection[] {
  const groups = rentalConditionGroups(rentalConditions, optionalFacilities, rentalConditionItems);
  const extraNotes = parseAndExplainSpecialNotes(specialNotes, specialNoteItems);

  if (!groups.length && !extraNotes.length && !guaranteeFee && !insuranceFee && !renewalFee) return [];

  const pool = new Map<string, { text: string; category: string }>();

  const addItem = (text: string, defaultCategory: string) => {
    const cleaned = stripOrphanedBrackets(text.trim());
    if (!cleaned || cleaned.includes("圖紙另有個別日文特約")) return;
    const { key, canonicalCategory } = getSemanticKey(cleaned);
    const targetCategory = canonicalCategory === "other" ? defaultCategory : canonicalCategory;

    const existing = pool.get(key);
    if (!existing) {
      pool.set(key, { text: cleaned, category: targetCategory });
    } else {
      // 擇優保留：若新條目更完整、字數更豐富或具備更精確說明，予以覆蓋
      if (cleaned.length > existing.text.length) {
        pool.set(key, { text: cleaned, category: targetCategory });
      }
    }
  };

  // 1. 登記由 rentalConditionGroups 輸出的分組項目
  for (const group of groups) {
    for (const item of group.items) {
      addItem(item, group.id);
    }
  }

  // 2. 登記額外費用與保證保險（若尚未涵蓋）
  if (renewalFee && renewalFee.trim()) {
    const { key } = getSemanticKey(renewalFee);
    if (!pool.has(key) && !pool.has("lease:renewal_fee")) {
      addItem(formatRenewalItem(renewalFee), "lease");
    }
  }
  if (guaranteeFee && guaranteeFee.trim()) {
    const { key } = getSemanticKey(guaranteeFee);
    if (!pool.has(key) && !pool.has("guarantee:company")) {
      addItem(formatGuaranteeItem(guaranteeFee, totalMonthlyCost), "guarantee");
    }
  }
  if (insuranceFee && insuranceFee.trim()) {
    const { key } = getSemanticKey(insuranceFee);
    if (!pool.has(key) && !pool.has("guarantee:insurance")) {
      addItem(formatInsuranceItem(insuranceFee), "guarantee");
    }
  }

  // 3. 登記 specialNotes 與 specialNoteItems
  for (const note of extraNotes) {
    const defaultCat = ["契約特約", "合約特約", "入住條件", "使用限制", "生活規範"].includes(note.category)
      ? "extraContract"
      : note.category === "費用約定"
        ? "fees"
        : "other";
    addItem(`${note.title}：${note.explanation}`, defaultCat);
  }

  // 4. 停車與選配設施片段清理：若已有包含多項設施的完整合成句子，清理孤立片段標籤
  const optionalTexts = Array.from(pool.values()).filter(i => i.category === "optional").map(i => i.text);
  const hasCombinedOptional = optionalTexts.some(t => t.includes("停車場") && (t.includes("自行車") || t.includes("機車") || t.includes("駐輪")));
  if (hasCombinedOptional) {
    for (const [key, val] of pool.entries()) {
      if (val.category === "optional" && /^駐輪場$|^機車停車位$|^另有選配設施|^自行車停車場$/.test(val.text.trim())) {
        pool.delete(key);
      }
    }
  }

  const getItemsByCat = (cat: string) => Array.from(pool.values()).filter(i => i.category === cat).map(i => i.text);

  const leaseItems = getItemsByCat("lease");
  const lease = leaseItems.length ? leaseItems : ["圖紙未載明租期與契約更新條件，待核對正式契約。"];

  const moveInItems = getItemsByCat("moveIn");
  const moveIn = moveInItems.length ? moveInItems : ["圖紙未載明入住日或優惠條件。"];

  const extraContract = getItemsByCat("extraContract");

  const guaranteeItems = getItemsByCat("guarantee");
  const guarantee = guaranteeItems.length ? guaranteeItems : ["圖紙未載明保證公司方案與火災保險費用。"];

  const feeItems = getItemsByCat("fees");
  const fees = feeItems.length ? feeItems : ["圖紙未載明其他一次性或年度費用。"];

  const moveOutItems = getItemsByCat("moveOut");
  const moveOut = moveOutItems.length ? moveOutItems : ["圖紙未載明退租清潔費或房屋個別提醒。"];

  const optionalItems = getItemsByCat("optional");
  const otherItems = getItemsByCat("other");
  const combinedOptional = [...optionalItems, ...otherItems];

  return [
    {
      title: "契約與入住",
      rows: [
        { title: "租期與契約更新", items: lease },
        { title: "入住與優惠", items: moveIn },
        ...(extraContract.length ? [{ title: "其他入住與契約條件", items: extraContract }] : []),
      ],
    },
    {
      title: "保證、保險與附加費用",
      rows: [
        { title: "保證料與火災保險", items: guarantee },
        { title: "附加費用與服務", items: fees },
      ],
    },
    {
      title: "退租與違約",
      rows: [
        {
          title: "敷引約定",
          items: [shikibiki
            ? `圖紙載明 ${shikibiki}，退租時依約扣抵。`
            : "圖紙未載明敷引；押金扣除承租人修繕責任後，餘額依契約返還。"],
        },
        { title: "退租與提前解約", items: moveOut },
      ],
    },
    {
      title: "附加條件與備考",
      rows: [{ title: "停車、駐輪與其他條件", items: combinedOptional.length ? combinedOptional : ["另有選配設施，費用與使用條件待核對。"] }],
    },
  ];
}

function formatGuaranteeItem(text: string, totalMonthlyCost?: number | null): string {
  let s = text
    .replace(/^保証会社\s*[：:]?\s*/gu, "")
    .replace(/家賃総額より/gu, "月租總額 ")
    .replace(/総賃料/gu, "月租總額 ")
    .replace(/必須/gu, "須加入，")
    .replace(/[～~]+$/g, " 起")
    .replace(/\s+/gu, " ")
    .trim();
  // 保證料要分初回／月額／年額。只有初回計入初期費用試算——
  // 月額（GTN、Casa 常見的「月額1%」）按月支付、年額續約時支付，
  // 若一律標成「已計入上方初期費用試算」等於對客人說了不實的話。
  const breakdown = parseGuaranteeFeeBreakdown(text, totalMonthlyCost ?? 0);
  const notes: string[] = [];
  if (totalMonthlyCost && totalMonthlyCost > 0) {
    if (breakdown.initial !== null) {
      notes.push(`初回約 ${breakdown.initial.toLocaleString()}円，已計入上方初期費用試算`);
    }
    if (breakdown.monthly !== null) {
      notes.push(`月額約 ${breakdown.monthly.toLocaleString()}円／月，按月支付、未計入初期費用`);
    }
    if (breakdown.annual !== null) {
      notes.push(`年度約 ${breakdown.annual.toLocaleString()}円／年，續約時支付、未計入初期費用`);
    }
  }
  const base = /保證|保証/u.test(s) ? s : `保證公司（初回保證料）：${s}`;
  return notes.length ? `${base}（${notes.join("；")}）` : base;
}

function formatInsuranceItem(text: string): string {
  let s = text
    .replace(/^(?:損害保険|火災保険|家財保険)\s*[：:]?\s*/gu, "")
    .replace(/^有\s*/gu, "")
    .replace(/(\d+)ヶ月/gu, "$1 個月")
    .trim();
  const isYen = /[\d,]+円/.test(s);
  return isYen
    ? `火災保險：須投保，${s}（已計入上方初期費用試算）`
    : `火災保險：${s}`;
}

function formatRenewalItem(text: string): string {
  const trimmed = text.trim();
  if (/^なし$|^無$/u.test(trimmed)) {
    return "契約更新費：免收（圖紙載明無更新料）";
  }
  if (/^[-－—/／]$/.test(trimmed)) {
    return "契約更新費：圖紙未明確載明金額（標示 -），簽約前請向管理公司確認是否免收或有更新手續費";
  }
  const isTeishaku = /再契約/.test(trimmed);
  const translated = translateRentalClause(trimmed, isTeishaku);
  if (/^圖紙另有個別日文特約/.test(translated)) {
    if (isTeishaku) {
      return `再簽約費（定期租約期滿續住）：${trimmed.replace(/^再契約(?:料|手数料)?\s*[:：]?\s*/gu, "")}`;
    }
    return `契約更新費：${trimmed.replace(/^(?:更新料|更新手数料)?\s*[:：]?\s*/gu, "")}`;
  }
  return translated.includes("契約更新費") || translated.includes("再簽約費")
    ? translated
    : isTeishaku
      ? `再簽約費（定期租約期滿續住）：${translated}`
      : `契約更新費：${translated}`;
}

export function stripOrphanedBrackets(str: string): string {
  if (!str) return "";
  let s = str.trim();

  // 若整句被成對括號包覆，例如 "(退去時請求)" 或 "（退去時請求）"，拆除最外層括號
  const wrappedMatch = s.match(/^[\(（\[【「『]([^\(\)（）\[\]【】「』]+)[\)）\]】」』]$/);
  if (wrappedMatch) {
    s = wrappedMatch[1].trim();
  }

  // 移除首部孤立的開括號（字串內無任何閉括號時）
  while (/^[\(（\[【「『]/.test(s) && !/[\)）\]】」』]/.test(s)) {
    s = s.slice(1).trim();
  }
  // 移除尾部孤立的閉括號（字串內無任何開括號時，如「退去時請求)」）
  while (/[\)）\]】」』]$/.test(s) && !/[\(（\[【「『]/.test(s)) {
    s = s.slice(0, -1).trim();
  }

  // 檢查圓括號平衡度，若閉括號多於開括號且結尾是閉括號，移除結尾多餘閉括號
  const openCount = (s.match(/[\(（]/g) || []).length;
  const closeCount = (s.match(/[\)）]/g) || []).length;
  if (closeCount > openCount && /[\)）]$/.test(s)) {
    s = s.replace(/[\)）]+$/, "").trim();
  }

  // 檢查方括號平衡度
  const openSquare = (s.match(/[\[【]/g) || []).length;
  const closeSquare = (s.match(/[\]】]/g) || []).length;
  if (closeSquare > openSquare && /[\]】]$/.test(s)) {
    s = s.replace(/[\]】]+$/, "").trim();
  }

  return s;
}

const groupOrder = [
  ["lease", "租期與契約更新"],
  ["moveIn", "入住與優惠"],
  ["pet", "寵物條件"],
  ["guarantee", "保證料與火災保險"],
  ["fees", "附加費用與服務"],
  ["moveOut", "退租與房屋提醒"],
  ["optional", "選配設施"],
] as const;

export function rentalConditionGroups(
  raw?: string | null,
  optionalFacilities?: string | null,
  conditionItems?: RentalConditionItem[] | null,
): RentalConditionGroup[] {
  const grouped = new Map<string, string[]>();

  if (Array.isArray(conditionItems) && conditionItems.length > 0) {
    for (const item of conditionItems) {
      if (!item || !item.zh || !item.category) continue;
      const id = item.category;
      const text = stripOrphanedBrackets(item.zh.trim());
      if (!text) continue;
      const items = grouped.get(id) || [];
      if (!items.includes(text)) items.push(text);
      grouped.set(id, items);
    }
  } else {
    const isTeishaku = /定期借家|定借/u.test(raw || "");
    // normalizeMonthUnit：契約條件常寫成「更新料1ケ月」（正常大小的ケ），
    // 先統一成「ヶ月」，下面的翻譯規則才不會整條漏配而留著日文原文。
    const rawClauses = normalizeMonthUnit((raw || "").normalize("NFKC"))
      .replace(/[,、・]\s*(?=(?:普通賃貸借|定期借家|2年定借|契約期間|解約予告|★?キャンペーン|入居日|入居時期|更新料|再契約料|再契約手数料|ペット|保証会社|M保証|木下グループ保証|木下の賃貸|損害保険|火災保険|24Hサポート|鍵交換|消毒代|定額ルーム|室内抗菌|事務手数料|当社指定|12ヶ月|CATV|実入居者|Concierge24|みまもり))/gu, "。")
      .replace(/[,、]\s*(?=※?退去時)/gu, "。")
      .replace(/[■◆●▲☆★]+/gu, "。")
      .split(/[。\n]+/u)
      .map((clause) => stripOrphanedBrackets(clause.trim()))
      .filter(Boolean);

    // 若單一子句內部有多個空格分開的短條目（如「ペット不可 事務所不可 楽器等の使用不可 単身可」）
    const clauses: string[] = [];
    for (const c of rawClauses) {
      const spaceSubtokens = c.split(/[ \t]+/).filter(Boolean);
      if (spaceSubtokens.length > 1 && spaceSubtokens.some((t) => /(?:不可|限定|専用|可|相談|禁煙|不要|必須)$/.test(t))) {
        clauses.push(...spaceSubtokens);
      } else {
        clauses.push(c);
      }
    }

    for (const clause of clauses) {
      const translated = stripOrphanedBrackets(translateRentalClause(clause, isTeishaku));
      const { canonicalCategory } = getSemanticKey(translated);
      const id = canonicalCategory === "other" ? classifyClause(clause) : canonicalCategory === "extraContract" ? "lease" : canonicalCategory;
      const items = grouped.get(id) || [];
      if (!items.includes(translated)) items.push(translated);
      grouped.set(id, items);
    }
  }

  if (optionalFacilities?.trim()) {
    const items = optionalFacilities
      .normalize("NFKC")
      .split(/[、，\n]+|(?<!\d),(?!\d)/u)
      .map((item) => stripOrphanedBrackets(item.trim()))
      .filter(Boolean)
      .map(translateOptionalFacility)
      .map(stripOrphanedBrackets);
    if (items.length) {
      const existing = grouped.get("optional") || [];
      grouped.set("optional", [...new Set([...existing, ...items])]);
    }
  }

  return groupOrder.flatMap(([id, title]) => {
    const items = grouped.get(id);
    return items?.length ? [{ id, title, items }] : [];
  });
}

function classifyClause(clause: string) {
  if (/退去|清掃|クリーニング|解約予告|違約金|地平面|見守りサービス/.test(clause)) return "moveOut";
  if (/敷金|礼金|キャンペーン|入居日|入居時期/.test(clause)) return "moveIn";
  if (/ペット|小型犬|猫\d*匹/.test(clause)) return "pet";
  if (/保証|保険/.test(clause)) return "guarantee";
  if (/家具家電撤去|鍵交換|消毒|サポート|事務手数料|Wi-Fi|wifi/i.test(clause)) return "fees";
  // 「再契約」已被「契約」涵蓋，列出僅為表明定期借家的續住費用同屬契約類。
  if (/賃貸借|契約|更新|再契約|賃料改定|定借/.test(clause)) return "lease";
  return "fees";
}

function translateRentalClause(source: string, isTeishaku = false) {
  let text = stripOrphanedBrackets(source.replace(/^[※■●◆\s]+/u, "").trim());

  if (/更新料\s*[:：]?\s*[-－—/／]/.test(text)) {
    return isTeishaku
      ? "定期借家契約期滿確定終止，無自動更新；若期滿雙方合意辦理「再契約」，手續費待向管理公司確認（圖紙標示 -）"
      : "契約更新費：圖紙未明確載明金額（標示 -），簽約前請向管理公司確認是否免收或有更新手續費";
  }
  if (/更新料\s*[:：]?\s*(?:無|なし|0円?)(?!\d)/.test(text)) {
    return isTeishaku
      ? "定期借家契約期滿確定終止，無自動更新；若期滿雙方合意辦理「再契約」，手續費待向管理公司確認（圖紙標示無更新料）"
      : "契約更新費：免收（圖紙載明無更新料）";
  }

  text = text
    .replace(/^契約条件\s*[：:]\s*/gu, "")
    .replace(/定期借家契約\s*(\d+)年/gu, "定期借家契約 $1 年")
    .replace(/(\d+)年定借/gu, "定期借家契約 $1 年")
    .replace(/ペット可\s*[：:]\s*小型犬[・、]猫1匹迄敷金2ヶ月預かり/gu, "可養寵物：小型犬或貓限 1 隻，另收 2 個月押金")
    .replace(/敷金\s*0(?:\.0+)?\s*(?:ヶ月|ヵ月|カ月|個月)?\s*[・、]?\s*礼金\s*0(?:\.0+)?\s*(?:ヶ月|ヵ月|カ月|個月)?(?:キャンペーン中)?/gu, "免押金、免禮金優惠中")
    .replace(/敷金\s*0(?:\.0+)?\s*(?:ヶ月|ヵ月|カ月|個月)?/gu, "免押金")
    .replace(/礼金\s*0(?:\.0+)?\s*(?:ヶ月|ヵ月|カ月|個月)?/gu, "免禮金")
    .replace(/敷金\s*(\d+)ヶ月\s*礼金\s*(\d+)ヶ月/gu, "押金 $1 個月、禮金 $2 個月")
    // 必須排在下面那條泛用「敷金N ヶ月」之前：否則「敷金1ヶ月」會先被換成
    // 「押金 1 個月」，本條的前提（法人且未加保證公司）就再也配不到，
    // 整句因殘留假名而退化成「另有個別日文特約」，條件消失。
    .replace(/法人で保証会社加入無しの場合[、,]\s*敷金(\d+(?:\.\d+)?)ヶ月/gu, "法人承租且不加入保證公司時，須付 $1 個月押金")
    .replace(/敷金\s*(\d+)ヶ月/gu, "押金 $1 個月")
    .replace(/礼金\s*(\d+)ヶ月/gu, "禮金 $1 個月")
    .replace(/普通賃貸借\s*(\d+)年契約\s*[（(]更新型[）)]/gu, "普通租賃契約，租期 $1 年（可更新契約）")
    .replace(/契約期間\s*(\d+)年/gu, "普通租賃契約，租期 $1 年")
    // 「の」是可選的：図面兩種寫法都很常見（「更新料 新賃料1ヶ月」與
    // 「更新料 新賃料の1ヶ月分相当額」）。少了它整條會配不到而退化成
    // 「圖紙另有個別日文特約」，客人根本看不到續約要付一個月租金。
    // 數字與「ヶ月」之間也要容許空白：木下系図面的表格欄位被還原成
    // 「更新料 新賃料 1.25 ヶ月」（值與單位分屬不同儲存格）。
    .replace(/更新料\s*(?:[:：]\s*)?新賃料\s*の?\s*(\d+(?:\.\d+)?)\s*ヶ月(?:分)?(?:相当額)?/gu, "契約更新費：新租金 $1 個月")
    .replace(/更新料\s*([\d,]+円)/gu, "契約更新費：$1")
    // 定期借家的「再契約料」是同一筆「想繼續住就要付」的錢，只是法律上
    // 期滿屬重新簽約而非更新。不翻的話同樣只會顯示那句等於沒說的提示。
    .replace(/再契約(?:料|手数料)\s*(?:[:：]\s*)?新賃料\s*の?\s*(\d+(?:\.\d+)?)\s*ヶ月(?:分)?(?:相当額)?/gu, "再簽約費（定期租約期滿續住）：新租金 $1 個月")
    .replace(/再契約(?:料|手数料)\s*(?:[:：]\s*)?([\d,]+円)/gu, "再簽約費（定期租約期滿續住）：$1")
    .replace(/解約予告\s*(\d+)\s*日前(?:に当社宛に通知)?/gu, "退租須於 $1 日前通知")
    .replace(/解約予告\s*(\d+)\s*(?:ヶ月|ヵ月|カ月)前(?:に当社宛に通知)?/gu, "退租須於 $1 個月前通知")
    .replace(/1、2回目の更新時\s*(\d+(?:\.\d+)?)%の賃料改定あり/gu, "第 1、2 次契約更新時，租金調整 $1%")
    .replace(/更新料は1回のみ/gu, "契約更新費僅收取 1 次")
    .replace(/2回目以降の更新料は無い為、安心して永くお住まいいただけます/gu, "第 2 次起不再收取契約更新費")
    .replace(/入居時期\s*[：:]\s*/gu, "預定入住時期：")
    .replace(/入居時期\s*(\d{4}年\d{1,2}月[^\s。、]+)/gu, "預定入住時期：$1")
    .replace(/入居日\s*[：:]\s*/gu, "可入住日：")
    .replace(/可入住日：即[、,]?内見可/gu, "可立即入住，且可安排看房")
    .replace(/敷金0[・\s]*礼金0キャンペーン中/gu, "零押金、零禮金優惠中")
    .replace(/[（(]キャンペーンは(\d+)月末日迄の成約となります[）)]/gu, "（須於 $1 月底前完成簽約）")
    .replace(/★?キャンペーンは(\d+)月末日迄の成約となります/gu, "優惠期限：須於 $1 月底前完成簽約")
    .replace(/保証会社\s*(?:必須)?\s*(?:家賃総額より|総賃料)?\s*(\d+%)[～~]?/gu, "保證公司（初回保證料）：須加入，月租總額 $1 起")
    .replace(/損害保険\s*(?:有)?\s*([\d,]+円)\s*(\d+ヶ月)?/gu, "火災保險：須投保，$1（$2）")
    .replace(/M保証システム利用料\s*[（(]家賃総額の(\d+)%[〜~～][）)]/gu, "M 保證系統初回費：租金總額 $1% 起")
    .replace(/木下グループ保証\s*[：:]\s*初回保証料(\d+)%[、,]?利用手数料月額([\d,]+円)[、,]?継続保証委託料([\d,]+円)[（(](\d+)年毎[）)]/gu, "木下集團保證：初回費為月租總額 $1%；月額手續費 $2；持續保證委託費 $3（每 $4 年）")
    .replace(/木下の賃貸友の会加入必須[。]?友の会費([\d,]+円)[（(]税込[）)]\s*[/／]月額[。]?入居者補償制度[（(]火災保険[）)]、緊急サポートを含む/gu, "須加入木下租賃友之會：月費 $1（含稅），包含租客補償制度（火災保險）與緊急支援")
    .replace(/木下の賃貸友の会加入必須/gu, "須加入木下租賃友之會")
    .replace(/友の会費([\d,]+円)[（(]税込[）)]\s*[/／]月額/gu, "木下租賃友之會月費：$1（含稅）")
    .replace(/入居者補償制度[（(]火災保険[）)]、緊急サポートを含む/gu, "包含租客補償制度（火災保險）與緊急支援")
    .replace(/[↑→]?エポス保証にて成約となった場合、年次保証料(\d+)万円/gu, "；若使用 Epos 保證簽約，年度保證費 $1 萬円")
    .replace(/24Hサポート料\s*([\d,]+円)\s*[/／]\s*1年/gu, "24 小時生活支援費：$1／年")
    .replace(/鍵交換代\s*([\d,]+円)/gu, "換鎖費：$1")
    .replace(/消毒代\s*([\d,]+円)/gu, "室內消毒費：$1")
    .replace(/定額ルームクリーニング代\s*([\d,]+円)[^。]*/gu, "定額室內清潔費：$1（簽約時支付）")
    .replace(/室内抗菌処理代\s*([\d,]+円)/gu, "室內抗菌處理費：$1")
    .replace(/事務手数料\s*([\d,]+円)/gu, "簽約事務手續費：$1")
    .replace(/当社指定賃貸入居者総合保険加入の事\s*[（(]別途費用[）)]/gu, "須加入指定租客綜合保險，費用另計")
    .replace(/退去時清掃費用、更新時更新費用等がございます/gu, "另有退租清潔費及契約更新相關費用，金額待確認")
    .replace(/地平面より下がる住居が一部ございます/gu, "部分住宅空間低於地面，須確認本戶位置、採光與通風")
    // 月數單位在上游已由 normalizeMonthUnit 統一成「ヶ」，此處比對 ヶ 即可涵蓋 ケ／ヵ／カ。
    .replace(/12ヶ月未満の解約時、?賃料1ヶ月分の違約金/gu, "租期未滿 12 個月解約時，須支付 1 個月租金作為違約金")
    .replace(/CATV[・、]?BS・CS110°[・、]?インターネットは利用可否確認のうえ別途契約・費用/gu, "CATV、BS／CS 與網路須先確認能否使用，並另行簽約付費")
    .replace(/実入居者が61歳以上の場合、指定見守りサービス加入必須[（(]費用要確認[）)]/gu, "實際入住者年滿 61 歲時，須加入指定守護服務，費用待確認")
    .replace(/ペット飼育不可/gu, "不可飼養寵物")
    // 以下為家具家電付き／短期解約系圖紙（リブマックス 等）的常見條目。
    // 未翻譯的句子會整條被換成「另有個別日文特約」，等於把費用資訊丟掉，
    // 因此凡是金額明確、對承租人有實質影響的條目都必須逐條譯出。
    .replace(/(?:退去時)?クリーンコート(?:代|費用)?\s*([\d,]+円)/gu, "退租時鍍膜清潔費：$1")
    .replace(/退去時精算手数料\s*([\d,]+円)\s*[（(]?最終請求時[）)]?/gu, "退租結算手續費：$1（隨最後一期帳單請款）")
    .replace(/退去時精算手数料\s*([\d,]+円)/gu, "退租結算手續費：$1")
    .replace(/短期解約違約金\s*[：:]\s*賃料(\d+(?:\.\d+)?)ヶ月分\s*[（(](\d+)年未満[）)]/gu, "短期解約違約金：未滿 $2 年解約時，須支付 $1 個月租金")
    .replace(/家具家電撤去費用\s*([\d,]+円)\s*[（(]家具家電無し契約を希望の場合[）)]/gu, "家具家電撤除費：$1（希望簽訂不含家具家電之契約時）")
    .replace(/賃料等引き落とし料\s*([\d,]+円)\s*[/／]\s*月/gu, "租金自動扣款手續費：$1／月")
    .replace(/リブクラブ\s*([\d,]+円)\s*[/／]\s*月/gu, "LIV CLUB 會員費：$1／月（須加入）")
    .replace(/SBI少額短期保険\s*([\d,]+円)\s*[/／]\s*月/gu, "SBI 少額短期保險：$1／月（須投保）")
    .replace(/指定賃貸保証加入\s*[（(]総賃料\s*(\d+)%[）)]/gu, "須加入指定租賃保證公司：保證費為租金總額 $1%")
    .replace(/モバイルwifi\s*[（(]?(\d+GB)[）)]?\s*付/giu, "附行動 Wi-Fi（$1）")
    .replace(/民泊[・、]?簡易宿泊による利用及びそれに伴う広告等は一切禁止/gu, "禁止作為民宿或簡易住宿使用，亦禁止相關刊登行為")
    .replace(/法人契約の場合[、,]\s*普通借(?:家)?相談可(?:能)?/gu, "法人承租時，可洽談改採普通租賃契約")
    .replace(/海外審査相談可/gu, "可洽談海外審查（人在海外亦可申請）")
    .replace(/全物件先行契約になります/gu, "全部物件皆採先行簽約（須先簽約再入住）")
    .replace(/事務所[・、]?SOHO利用禁止|事務所不可|事務所使用不可/gu, "不可作為辦公室／事務所使用")
    .replace(/楽器(?:等)?の使用不可|楽器不可|楽器使用禁止/gu, "不可彈奏或使用樂器")
    .replace(/単身可|単身者限定|1人入居限定/gu, "允許單身入住")
    .replace(/Concierge24加入必須\s*[（(]?月額\s*([\d,]+円)[）)]?/giu, "租客必須加入 Concierge24 支援服務，費用為每月 $1")
    .replace(/Concierge24\s*[:：]\s*([\d,]+円)/giu, "每月生活支援服務 Concierge24：$1")
    .replace(/高齢者入居\s*[：:]\s*みまもりS加入等条件有\s*[（(]?月額\s*([^）)]+)[）)]?/gu, "高齡者入住需加入「みまもりS」長者守護服務（月額 $1）等附加條件")
    .replace(/敷金なしの場合はハウスクリーニング代を退去時支払いに変更することができます[。]?/gu, "若無收取押金，退租清潔費可變更為退租時支付")
    .replace(/ハウスクリーニング代\s*[：:]\s*([\d,]+円)/gu, "退租清潔費：$1")
    .replace(/鍵交換費\s*[：:]\s*([\d,]+円)/gu, "換鎖費：$1")
    .replace(/契約事務手数料\s*[：:]\s*([\d,]+円|[\d\.]+万円)/gu, "簽約事務手續費：$1")
    .replace(/更新事務手数料\s*[：:]\s*([\d,]+円|[\d\.]+万円)/gu, "更新手續費：$1")
    .replace(/外国籍の方\s*[：:]\s*GTN加入要\s*[（(]海外審査OK[）)]/gu, "外國籍租客：須加入 GTN 保證（可接受海外審查）")
    .replace(/初回保証料\s*[：:]\s*賃料総額\s*(\d+)%/gu, "初回保證費：租金總額 $1%")
    .replace(/月次手数料\s*([\d,]+円)\s*[（(]税込[）)]/gu, "月付手續費：$1（含稅）")
    .replace(/(\d+)ヶ月/gu, "$1 個月")
    .replace(/(\d+)万円/gu, "$1 萬円")
    .replace(/賃料/gu, "租金")
    .replace(/更新料/gu, "契約更新費")
    .replace(/保証料/gu, "保證費")
    .replace(/別途費用/gu, "費用另計")
    .replace(/税込/gu, "含稅")
    .replace(/[※★]/gu, "")
    .replace(/）(?=第)/gu, "）；")
    .replace(/予定/gu, "預定")
    .replace(/\s+/gu, " ")
    .trim();

  text = stripOrphanedBrackets(text);

  return /[\u3040-\u30ff]/u.test(text)
    ? "圖紙另有個別日文特約，簽約前請向仲介或宅建士確認重要事項說明。"
    : text;
}

function translateOptionalFacility(source: string) {
  const text = source
    .replace(/バイク置き場/gu, "機車停車位")
    .replace(/地下駐輪場/gu, "地下自行車停車場")
    .replace(/登録料/gu, "登錄費")
    .replace(/要確認/gu, "需確認")
    .replace(/サイズ制限有/gu, "有尺寸限制")
    .replace(/駐車場\s*[：:]\s*施設なし[・、]空きなし/gu, "無停車場，且無空位")
    .replace(/駐輪場\s*[：:]\s*施設なし[・、]空きなし/gu, "無自行車停車場，且無空位")
    .replace(/ペット飼育不可/gu, "不可飼養寵物")
    .replace(/([\d,]+円)\s*[/／]\s*月/gu, "$1／月")
    .replace(/機車停車位\s*[（(]([^）)]+)[）)]\s*※?需確認/gu, "機車停車位：$1（需確認）")
    .replace(/\s*:\s*/gu, "：")
    .replace(/登錄費(?=\d)/gu, "登錄費 ")
    .replace(/\(([^)]+)\)/gu, "（$1）")
    .replace(/\s+/gu, " ")
    .trim();
  return /[\u3040-\u30ff]/u.test(text)
    ? "另有選配設施，費用與使用條件待核對。"
    : text;
}
