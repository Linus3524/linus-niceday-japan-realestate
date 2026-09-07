/**
 * 日本不動產圖紙備考特約與限制事項解析器
 * 將日文特約、生活規約、解約違約金、退租清潔費等事項，
 * 自動轉換為繁體中文分類卡片與條理化解說。
 */

export interface ParsedSpecialNoteItem {
  category: "合約特約" | "費用約定" | "生活規範" | "使用限制" | "入住條件" | "設施設備" | "買賣特約" | "其他備考";
  title: string;
  explanation: string;
  rawJapanese?: string;
  badgeTone?: "amber" | "emerald" | "blue" | "neutral";
}

interface SpecialNoteRule {
  pattern: RegExp;
  category: ParsedSpecialNoteItem["category"];
  title: string;
  explanation: string | ((rawMatched: string) => string);
  badgeTone?: ParsedSpecialNoteItem["badgeTone"];
}

const RULES: SpecialNoteRule[] = [
  // 1. 寵物相關
  {
    pattern: /ペット不可|ペット飼育不可|ペット飼育禁止/i,
    category: "生活規範",
    title: "全面禁止飼養寵物",
    explanation: "本大樓及室內嚴禁飼養任何寵物（包含犬、貓、鳥類與爬蟲類等），違者可能面臨立即終止契約與高額違約金。",
    badgeTone: "amber",
  },
  {
    pattern: /ペット相談|ペット飼育可|ペット可|ペット可物件|小型犬可|猫可/i,
    category: "生活規範",
    title: "可商量飼養寵物",
    explanation: "允許飼養特定種類寵物（多限小型犬或貓 1 隻），簽約時通常需額外積增 1 個月押金或支付退租消臭消毒費。",
    badgeTone: "emerald",
  },
  {
    pattern: /ペット(?:飼育時)?敷金\s*(?:[\d.]+(?:ヶ月|ヵ月|カ月|個月)|[+＋]\s*\d+)/i,
    category: "費用約定",
    title: "寵物加收押金約定",
    explanation: (text) => `若有飼養寵物，簽約初期需依約額外加收押金（${text}），退租時通常全額扣抵作為消臭與原狀恢復費用。`,
    badgeTone: "amber",
  },

  // 2. 商業/事務所/用途
  {
    pattern: /事務所不可|事務所使用不可|住居専用|SOHO不可/i,
    category: "使用限制",
    title: "限純住宅用途",
    explanation: "本物件僅供個人純住家居住使用，禁止作為商業辦公室、店舖、美容沙龍或向政府登記設立公司行號。",
    badgeTone: "amber",
  },
  {
    pattern: /事務所可|事務所相談|SOHO可|SOHO相談/i,
    category: "使用限制",
    title: "可商量工作室／SOHO",
    explanation: "允許作為個人工作室或不常有外部訪客之事務所使用；若作為營業登記，租金及管理費依日本稅法通常需外加 10% 消費稅。",
    badgeTone: "blue",
  },

  // 3. 樂器使用
  {
    pattern: /楽器(?:等)?の使用不可|楽器不可|楽器使用禁止|ピアノ不可/i,
    category: "生活規範",
    title: "禁止彈奏或使用樂器",
    explanation: "為維護大樓安寧並避免音量影響鄰居，室內全面禁止彈奏鋼琴、管弦樂、電吉他等各類樂器。",
    badgeTone: "amber",
  },
  {
    pattern: /楽器相談|楽器可|24時間楽器可|ピアノ可/i,
    category: "生活規範",
    title: "可商量彈奏樂器",
    explanation: "具備隔音條件或在指定時段內允許彈奏樂器，具體規範需依管理規約為準。",
    badgeTone: "emerald",
  },

  // 4. 吸菸與用火
  {
    pattern: /完全禁煙|室内禁煙|バルコニー禁煙|敷地内禁煙|禁煙/i,
    category: "生活規範",
    title: "室內與共用部全面禁煙",
    explanation: "包含加熱菸與電子菸在內，室內及陽台均全面禁煙；若退租時殘留煙味或壁紙變色，須全額自費換新。",
    badgeTone: "amber",
  },
  {
    pattern: /民泊不可|転貸禁止|又貸し禁止/i,
    category: "使用限制",
    title: "禁止轉租與民泊",
    explanation: "嚴禁將房屋轉租第三人或作為短期民宿經營，違者將立即終止租約並追究違約賠償責任。",
    badgeTone: "amber",
  },

  // 5. 入住人數與資格
  {
    pattern: /単身可|単身者限定|1人入居限定|単身者専用/i,
    category: "入住條件",
    title: "限單身一人居住",
    explanation: "本戶別格局與契約限制僅限 1 人獨住，不得與親友合住，亦不可擅自增加居住人口。",
    badgeTone: "neutral",
  },
  {
    pattern: /二人入居不可|2人入居不可/i,
    category: "入住條件",
    title: "禁止兩人同住",
    explanation: "本戶型空間僅供單人居住，不接受兩人或家庭承租。",
    badgeTone: "amber",
  },
  {
    pattern: /二人入居可|2人入居可|二人入居相談/i,
    category: "入住條件",
    title: "可兩人同住",
    explanation: "允許夫妻、伴侶或親屬兩人共同入住（申請時需檢附同住人身分證明資料以供審查）。",
    badgeTone: "emerald",
  },
  {
    pattern: /ルームシェア不可|ルームシェア禁止/i,
    category: "入住條件",
    title: "禁止友人合租",
    explanation: "日本多數集合住宅為避免繳租責任不清與生活糾紛，通常不接受非親屬朋友共同合租。",
    badgeTone: "amber",
  },
  {
    pattern: /ルームシェア可|ルームシェア相談/i,
    category: "入住條件",
    title: "可商量友人合租",
    explanation: "接受非親屬朋友共同承租，所有合租者均需共同簽約或分別通過保證公司審查。",
    badgeTone: "blue",
  },
  {
    pattern: /高齢者入居[：:]|高齢者(?:相談|可|入居)|みまもり/i,
    category: "入住條件",
    title: "高齡者入住特別約定",
    explanation: (text) => {
      if (/みまもり|月額\s*\d+/i.test(text)) {
        return `高齡長者承租時，需配合加入安危監護守護服務（如${text.replace(/^.*?[:：]/, "")}），以確保日常生活安全。`;
      }
      return "高齡租客承租設有特定條件（如指定緊急聯絡人或綁定安危監護服務），具體審查流程需事先諮詢。";
    },
    badgeTone: "blue",
  },
  {
    pattern: /外国籍(?:可|相談|入居可能|歓迎)|外国人(?:可|相談)/i,
    category: "入住條件",
    title: "歡迎外籍人士申請",
    explanation: "管理公司接受持有效在留資格之外國籍租客申請，通常需配合指定之外國人租金保證公司。",
    badgeTone: "emerald",
  },
  {
    pattern: /女性限定|女性専用/i,
    category: "入住條件",
    title: "女性限定物件",
    explanation: "整棟或本樓層為女性專用，環境單純安全；男性訪客過夜通常受到嚴格限制。",
    badgeTone: "blue",
  },
  {
    pattern: /学生限定|学生専用/i,
    category: "入住條件",
    title: "學生限定物件",
    explanation: "僅供在學學生申請承租，簽約時需出示學生證或入學許可證明。",
    badgeTone: "blue",
  },
  {
    pattern: /子供不可|乳幼児不可/i,
    category: "入住條件",
    title: "不接受孩童入住",
    explanation: "為保持集合住宅居住安寧，本戶型僅接受成人入住。",
    badgeTone: "amber",
  },

  // 6. 合約特約與解約違約金
  {
    pattern: /短期解約違約金[：:]?|違約金/i,
    category: "合約特約",
    title: "短期解約違約金約定",
    explanation: (text) => {
      const match = text.match(/(\d+)\s*(?:ヶ月|年)未満.*?(\d+(?:ヶ月|分)?)/);
      if (match) {
        return `入住未滿約定期間（${match[1]}）提前解約搬離時，需支付違約金（約 ${match[2]} 租金）。`;
      }
      return `載有短期解約違約金約定：「${text}」，租期未滿提前退租需支付違約金。`;
    },
    badgeTone: "amber",
  },
  {
    pattern: /定期借家|定期借家契約|定借/i,
    category: "合約特約",
    title: "定期租賃契約（定期借家）",
    explanation: "本約定為「定期借家契約」，合約期滿後自動終止；除非雙方協議再簽署新合約，否則租客無一般普通租賃的法定續約保障。",
    badgeTone: "amber",
  },
  {
    pattern: /先行申込|先行契約/i,
    category: "合約特約",
    title: "接受尚未看屋前先行送件／簽約",
    explanation: "物件目前可能仍有人居住或正在整修，接受租客先遞交申請資料或先完成簽約手續以鎖定承租順位。",
    badgeTone: "blue",
  },
  {
    pattern: /現状有姿|現状優先|図面と現状が異なる場合/i,
    category: "合約特約",
    title: "以現場點交實際現況為準",
    explanation: "若圖紙記載或格局繪製與現場有些微出入，交屋驗收時一律以現場實際現況為準。",
    badgeTone: "neutral",
  },

  // 7. 費用特約
  {
    pattern: /退去時(?:の)?(?:ハウス)?クリーニング|清掃費|クリーニング代/i,
    category: "費用約定",
    title: "退租清潔費由租客負擔",
    explanation: (text) => {
      const fee = text.match(/[\d,]+円|\d+万(?:円)?/)?.[0];
      return fee
        ? `退租時之專業室內清掃費由租客負擔（圖紙約定：${fee}）。`
        : `退租時需由租客負擔專業室內全面清掃費用。`;
    },
    badgeTone: "amber",
  },
  {
    pattern: /エアコンクリーニング|エアコン内部洗浄/i,
    category: "費用約定",
    title: "冷氣空調拆洗費約定",
    explanation: "退租時租客需負擔室內分離式冷氣空調內部深度分解清洗殺菌費用。",
    badgeTone: "neutral",
  },
  {
    pattern: /鍵交換代|シリンダー交換/i,
    category: "費用約定",
    title: "換鎖費用約定",
    explanation: (text) => {
      const fee = text.match(/[\d,]+円|\d+万(?:円)?/)?.[0];
      return fee
        ? `交屋前由借主負擔更換全新鎖芯費用（約定：${fee}），保障前房客無留存備份鑰匙。`
        : "交屋前由借主負擔更換全新鎖芯費用，以保障居住安全。";
    },
    badgeTone: "neutral",
  },

  // 8. 設施設備與生活便利
  {
    pattern: /インターネット無料|ネット無料|Wi-Fi無料/i,
    category: "設施設備",
    title: "免費提供高速網路／Wi-Fi",
    explanation: "租金內已包含高速光纖或無線網路，入住後可立即上網，每月可節省約 4,000～5,000 円網路費用。",
    badgeTone: "emerald",
  },
  {
    pattern: /24時間ゴミ出し可|敷地内ゴミ置場/i,
    category: "設施設備",
    title: "24 小時隨時可丟垃圾",
    explanation: "大樓內設有專屬封閉式垃圾集中場，不受地區指定清運日限制，日常倒垃圾非常便利。",
    badgeTone: "emerald",
  },
  {
    pattern: /駐輪場/i,
    category: "設施設備",
    title: "自行車停車場約定",
    explanation: (text) => {
      if (/無/i.test(text)) return "本棟未規劃自行車停放空間，請勿私自停放於共用部。";
      return "設有自行車停放區，實際是否有空位及是否需登記貼紙費用需事先向管理公司確認。";
    },
    badgeTone: "neutral",
  },
  {
    pattern: /バイク置場|バイク置き場/i,
    category: "設施設備",
    title: "機車停車位約定",
    explanation: "機車停車位通常數量有限且有限制排氣量與車型尺寸，申請前需向管理公司確認空位與月租金。",
    badgeTone: "neutral",
  },

  // 9. 買賣特約
  {
    pattern: /司法書士売主指定|司法書士は売主指定/i,
    category: "買賣特約",
    title: "產權登記由賣方指定司法書士辦理",
    explanation: "依日本不動產買賣慣例，產權所有權移轉登記手續由賣方指定信任之合格司法書士統籌辦理。",
    badgeTone: "neutral",
  },
  {
    pattern: /公募売買|公募取引|公募面積/i,
    category: "買賣特約",
    title: "以登記簿公募面積交易",
    explanation: "以地政事務所登記簿所載公募面積為買賣依據；未來若經實際測量發現微幅面積差異，雙方互不追繳或退還價金。",
    badgeTone: "neutral",
  },
  {
    pattern: /契約不適合責任免責|瑕疵担保免責/i,
    category: "買賣特約",
    title: "免除契約不適合責任（現況交屋）",
    explanation: "中古成屋常見特約，賣方對於交屋後顯現之隱蔽性瑕疵不負修繕或損害賠償責任，簽約前宜仔細確認屋況履歷。",
    badgeTone: "amber",
  },

  // 10. 事務手續費與生活支援服務
  {
    pattern: /更新事務手数料[：:]?|更新事務手数料/i,
    category: "費用約定",
    title: "契約更新事務手續費",
    explanation: (text) => {
      const fee = text.match(/[\d,]+円|\d+(?:\.\d+)?万(?:円)?/)?.[0];
      return fee
        ? `每 2 年續約時，除固定更新料外，管理公司另收續約作業行政手續費（${fee}）。`
        : "每 2 年續約時，管理公司另收續約作業行政手續費。";
    },
    badgeTone: "neutral",
  },
  {
    pattern: /契約事務手数料[：:]?|契約事務手数料/i,
    category: "費用約定",
    title: "初期契約事務手續費",
    explanation: (text) => {
      const fee = text.match(/[\d,]+円|\d+(?:\.\d+)?万(?:円)?/)?.[0];
      return fee
        ? `起租簽約時由管理公司收取之行政手續費（${fee}），計入初期起租交屋總額。`
        : "起租簽約時由管理公司收取之行政手續費，計入初期起租交屋總額。";
    },
    badgeTone: "neutral",
  },
  {
    pattern: /Concierge24|安心サポート|くらしーど|24時間サポート|ライフサポート|安心入居/i,
    category: "設施設備",
    title: "24 小時安心生活管家服務",
    explanation: (text) => {
      const fee = text.match(/月額\s*[\d,]+(?:円|千円)?/)?.[0];
      return fee
        ? `大樓配合之 24 小時生活急難救助與客服支援系統（如開鎖、通水管等，${fee}），屬必須加入之月額附加項目。`
        : "大樓配合之 24 小時生活急難救助與客服支援系統，屬必須加入之月額附加項目。";
    },
    badgeTone: "blue",
  },
];

/**
 * 判斷是否為同業仲介與管理公司之間的內部業務／分帳／交易型態備註（非租客端生活特約）
 * 依房仲專業指引，此類同業內部資訊（如取引態樣、客付／元付、業務指引、內見手續等）不向終端消費者／租客列出
 */
export function isBrokerInternalClause(token: string): boolean {
  return /取引態様|取引形態|仲介会社様|客付会社|業者様へ|客付|元付|手数料負担|手数料割合|広告料|AD\s*\d+|内見依頼|物確|名刺|鍵預かり|スマート内覧|内見方法/i.test(token);
}

/**
 * 將日文備考特約字串分割為多個邏輯語句
 */
function tokenizeSpecialNotes(raw: string): string[] {
  if (!raw || typeof raw !== "string") return [];

  // 1. 先處理換行與全形空格
  let workingText = raw
    .replace(/[\r\n]+/g, "\n")
    .replace(/　/g, " ")
    .trim();

  // 2. 徹底濾除同業仲介專用備註塊（例如 ■仲介会社様へ：...），不向租客端輸出
  const brokerRegex = /[■●【]?\s*(?:仲介会社様へ|客付会社様|業者様へ)[^\n]+/g;
  workingText = workingText.replace(brokerRegex, "").trim();

  // 3. 其餘文字按段落錨點切分（換行、句號、分號、符號清單）
  const rawSegments = workingText
    .split(/(?=[■●【◆・])|[\n。；;]+/g)
    .map(s => s.trim())
    .filter(Boolean);

  const finalTokens: string[] = [];

  for (const segment of rawSegments) {
    // 依頓號與逗號細分子句（保護金額千分位如 11,000円、以及「〜の場合、」「〜のとき、」等條件句）
    const subClauses = segment
      .split(/(?:、|(?<!\d),(?!\d))(?<!(?:の場合|のとき|時)[、,])/g)
      .map(s => s.trim())
      .filter(Boolean);

    for (const clause of subClauses) {
      if (isBrokerInternalClause(clause)) continue;

      // 若該子句內部仍有多個以空格分開的短限制詞（如「ペット不可 事務所不可 楽器等の使用不可 単身可」）
      const spaceSubtokens = clause.split(/[ \t]+/).filter(Boolean);
      if (spaceSubtokens.length > 1 && spaceSubtokens.some(t => /(?:不可|限定|専用|可|相談|禁煙|不要|必須)$/.test(t))) {
        for (const st of spaceSubtokens) {
          if (!isBrokerInternalClause(st)) {
            finalTokens.push(st);
          }
        }
      } else {
        finalTokens.push(clause);
      }
    }
  }

  return finalTokens;
}

/**
 * 將整段 specialNotes 轉換為格式化、條列、附翻譯說明的卡片資料
 */
export function parseAndExplainSpecialNotes(rawNotes?: string | null): ParsedSpecialNoteItem[] {
  if (!rawNotes || typeof rawNotes !== "string") return [];
  const trimmed = rawNotes.trim();
  if (!trimmed || /^(?:なし|無|0|-|ー|特になし)$/i.test(trimmed)) {
    return [];
  }

  const tokens = tokenizeSpecialNotes(trimmed);
  const results: ParsedSpecialNoteItem[] = [];
  const seenTitles = new Set<string>();

  for (const token of tokens) {
    if (!token || token.length < 2 || isBrokerInternalClause(token)) continue;

    // 比對預設規則字典
    let matched = false;
    for (const rule of RULES) {
      if (rule.pattern.test(token)) {
        if (!seenTitles.has(rule.title)) {
          seenTitles.add(rule.title);
          results.push({
            category: rule.category,
            title: rule.title,
            explanation: typeof rule.explanation === "function"
              ? rule.explanation(token)
              : rule.explanation,
            rawJapanese: token,
            badgeTone: rule.badgeTone || "neutral",
          });
        }
        matched = true;
        break;
      }
    }

    // 若未精確匹配字典，啟動通用繁中語意轉換引擎
    if (!matched) {
      const fallbackItem = generateFallbackExplanation(token);
      if (fallbackItem && !seenTitles.has(fallbackItem.title)) {
        seenTitles.add(fallbackItem.title);
        results.push(fallbackItem);
      }
    }
  }

  return results;
}

/**
 * 萬用備用解析器：針對未命中規則表的日文字句進行基礎斷詞與繁中說明整理
 */
function generateFallbackExplanation(token: string): ParsedSpecialNoteItem | null {
  const clean = token.replace(/^[■●・\-\*]\s*/, "").trim();
  if (!clean || clean.length <= 1) return null;

  // 1. 禁止類（不可 / 禁止）
  if (/不可|禁止|厳禁/.test(clean)) {
    return {
      category: "生活規範",
      title: `使用規範限制（${clean}）`,
      explanation: `圖紙載有生活與使用限制約定：「${clean}」，承租期間須予以配合遵守。`,
      rawJapanese: clean,
      badgeTone: "amber",
    };
  }

  // 2. 相談 / 可
  if (/相談|可/.test(clean) && clean.length < 25) {
    return {
      category: "入住條件",
      title: `承租條件約定（${clean}）`,
      explanation: `圖紙標示「${clean}」，相關承租資格或設備使用可於申請前向房東或管理會社進一步洽詢確認。`,
      rawJapanese: clean,
      badgeTone: "blue",
    };
  }

  // 3. 費用類（円、代、費）
  if (/[\d,]+円|費用|代金|手數料|手数料/.test(clean)) {
    return {
      category: "費用約定",
      title: "圖紙約定費用項目",
      explanation: `載明相關費用規範：「${clean}」，簽約或退租時將作為計費依據。`,
      rawJapanese: clean,
      badgeTone: "neutral",
    };
  }

  // 4. 一般備註
  return {
    category: "其他備考",
    title: "圖紙記載事項",
    explanation: `圖面記載：「${clean}」，建議簽約前與房仲核對細節。`,
    rawJapanese: clean,
    badgeTone: "neutral",
  };
}
