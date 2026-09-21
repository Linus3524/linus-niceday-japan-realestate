/**
 * 格局圖標註的中文化與結構化。
 *
 * AI 擷取階段（api/analyze-listing.ts 的 floorPlanDetails）刻意要求「以精簡日文原文摘要輸出」——
 * 這是對的，擷取層要忠於圖面、不做詮釋，才不會在辨識階段就把資訊翻錯或翻丟。
 * 但那份原文直接顯示給使用者，畫面上就只剩一串頓號分隔的日文：
 *
 *   洋室、キッチン、シャワールーム、トイレ、洗面、収納、ハンガーパイプ、棚、テラス、玄関
 *
 * 看得懂日文的人不需要這段，看不懂的人得不到任何資訊。這個模組負責「呈現層」的翻譯與
 * 分組，把原文轉成有意義的分類清單，同時保留日文原文供對照圖面。
 *
 * ## 為什麼不直接用 equipmentParser
 *
 * 那支是為「設備規格」設計的，詞彙表與分類都以設備為前提，套在格局上會出錯（實測）：
 *   - 「洋室」「玄関」不在設備字典裡，會原封不動輸出日文
 *   - 「ユニットバス」被譯為「整體衛浴設備更新」——圖上只寫了浴室型式，沒說要更新
 *   - 「洋室 9.37㎡／5.7J」被拆成兩項，房間與尺寸脫節
 *   - 分類會變成「衛浴水洗／廚房烹飪」這種設備視角，而非「居室／水區／收納」的空間視角
 *
 * 格局講的是「空間」，設備講的是「配備」，兩者的詞彙與分類邏輯不同，因此分開處理。
 */

/** 空間分類。順序即為畫面顯示順序：先居室、再水區、再收納、最後戶外與其他。 */
export type FloorPlanCategory = "居室空間" | "水區設備" | "收納空間" | "戶外空間" | "其他標註";

export const FLOOR_PLAN_CATEGORY_ORDER: readonly FloorPlanCategory[] = [
  "居室空間",
  "水區設備",
  "收納空間",
  "戶外空間",
  "其他標註",
];

export interface FloorPlanItem {
  /** 去重用的鍵（同一空間在圖上可能標多次） */
  key: string;
  category: FloorPlanCategory;
  /** 繁體中文名稱 */
  nameZh: string;
  /** 圖面日文原文，供對照圖紙 */
  rawJa: string;
  /** 面積／畳數等尺寸標註，例如 "9.37㎡／5.7帖" */
  size?: string;
  /** 樓層標註，例如 "1F"、"2F"（獨棟或有閣樓的物件才會出現） */
  floor?: string;
  /** 補充說明：中文名稱本身講不清楚的才寫 */
  note?: string;
}

/**
 * 站內日本不動產格局英文縮寫知識庫。
 * 嚴格對標：
 * 1. src/components/InteractiveFloorPlan.tsx (FLOOR_PLAN_ITEMS)
 * 2. src/data/rentGuideData.ts (日本住宅格局圖常見英文代號知識)
 */
export interface AbbreviationKnowledge {
  code: string;
  nameZh: string;
  nameEn: string;
  category: FloorPlanCategory;
  explanation: string;
}

export const FLOOR_PLAN_ABBREVIATIONS: Record<string, AbbreviationKnowledge> = {
  // ── 居室空間 ──
  LDK: { code: "LDK", nameZh: "客餐廳連廚房", nameEn: "Living Dining Kitchen", category: "居室空間", explanation: "客廳、餐廳與廚房連通之起居空間（LDK）" },
  DK: { code: "DK", nameZh: "餐廳連廚房", nameEn: "Dining Kitchen", category: "居室空間", explanation: "用餐區與廚房相連空間（DK）" },
  L: { code: "L", nameZh: "客廳", nameEn: "Living Room", category: "居室空間", explanation: "主要起居客廳（Living Room）" },
  D: { code: "D", nameZh: "餐廳", nameEn: "Dining Room", category: "居室空間", explanation: "用餐區域（Dining Room）" },
  S: { code: "S", nameZh: "納戶（服務室）", nameEn: "Service Room", category: "居室空間", explanation: "採光通風未達居室標準之多功能儲藏室（Service Room）" },
  DEN: { code: "DEN", nameZh: "書房工作室", nameEn: "Den / Study", category: "居室空間", explanation: "小型多功能書房或半開放工作區（Den）" },
  LOFT: { code: "LOFT", nameZh: "夾層閣樓", nameEn: "Loft", category: "居室空間", explanation: "挑高夾層閣樓空間（Loft）" },
  RF: { code: "RF", nameZh: "夾層閣樓", nameEn: "Roof / Loft", category: "居室空間", explanation: "挑高夾層閣樓空間（Roof / Loft）" },

  // ── 水區設備 ──
  K: { code: "K", nameZh: "廚房", nameEn: "Kitchen", category: "水區設備", explanation: "廚房料理區（Kitchen）" },
  WC: { code: "WC", nameZh: "廁所", nameEn: "Water Closet", category: "水區設備", explanation: "獨立廁所空間（Water Closet）" },
  UB: { code: "UB", nameZh: "整體衛浴", nameEn: "Unit Bath", category: "水區設備", explanation: "一體化成型防水衛浴（Unit Bath）" },
  W: { code: "W", nameZh: "洗衣機置放處", nameEn: "Washing Machine Space", category: "水區設備", explanation: "室內洗衣機專用放置位（Washing Machine Space）" },
  WP: { code: "WP", nameZh: "洗衣機防水盤", nameEn: "Waterproof Pan", category: "水區設備", explanation: "室內洗衣機專用防水盤（Waterproof Pan）" },
  R: { code: "R", nameZh: "冰箱置放處", nameEn: "Refrigerator Space", category: "水區設備", explanation: "廚房冰箱預留放置位（Refrigerator Space）" },

  // ── 收納空間 ──
  CL: { code: "CL", nameZh: "衣櫥", nameEn: "Closet", category: "收納空間", explanation: "房間壁櫥／衣櫥（Closet）" },
  WIC: { code: "WIC", nameZh: "步入式衣帽間", nameEn: "Walk-in Closet", category: "收納空間", explanation: "可走入式大型更衣室／衣帽間（Walk-in Closet）" },
  SC: { code: "SC", nameZh: "鞋物櫃", nameEn: "Shoes Cloak", category: "收納空間", explanation: "玄關鞋物收納櫃（Shoes Cloak）" },
  SIC: { code: "SIC", nameZh: "步入式鞋物間", nameEn: "Shoes-in Closet", category: "收納空間", explanation: "可直接走入式大型鞋物衣帽間（Shoes-in Closet）" },
  SB: { code: "SB", nameZh: "鞋櫃", nameEn: "Shoes Box", category: "收納空間", explanation: "玄關鞋櫃／下駄箱（Shoes Box）" },
  TR: { code: "TR", nameZh: "儲藏室", nameEn: "Trunk Room", category: "收納空間", explanation: "專屬獨立儲藏室（Trunk Room）" },
  ST: { code: "ST", nameZh: "收納櫃", nameEn: "Storage", category: "收納空間", explanation: "收納儲物空間（Storage）" },
  PAN: { code: "PAN", nameZh: "食品儲藏櫃", nameEn: "Pantry", category: "收納空間", explanation: "廚房乾貨食品儲藏櫃（Pantry）" },

  // ── 戶外空間 ──
  BAL: { code: "BAL", nameZh: "陽台", nameEn: "Balcony", category: "戶外空間", explanation: "專用陽台（Balcony）" },
  TER: { code: "TER", nameZh: "露台", nameEn: "Terrace", category: "戶外空間", explanation: "室外露台平台（Terrace）" },

  // ── 其他標註 ──
  ENT: { code: "ENT", nameZh: "玄關", nameEn: "Entrance", category: "其他標註", explanation: "住宅入口玄關（Entrance）" },
  MB: { code: "MB", nameZh: "水電儀表箱", nameEn: "Meter Box", category: "其他標註", explanation: "水電瓦斯儀表箱（Meter Box）" },
  PS: { code: "PS", nameZh: "管道間", nameEn: "Pipe Space", category: "其他標註", explanation: "建築給排水與管線管道間（Pipe Space）" },
  EPS: { code: "EPS", nameZh: "電氣管道間", nameEn: "Electric Pipe Space", category: "其他標註", explanation: "電氣與弱電專用管道間（Electric Pipe Space）" },
  DS: { code: "DS", nameZh: "排氣管道間", nameEn: "Duct Space", category: "其他標註", explanation: "空調與排煙通風管道間（Duct Space）" },
  AC: { code: "AC", nameZh: "冷氣設置位", nameEn: "Air Conditioner", category: "其他標註", explanation: "冷氣設備或冷媒管預留位（Air Conditioner）" },
};

interface FloorPlanRule {
  pattern: RegExp;
  category: FloorPlanCategory;
  nameZh: string;
  note?: string;
}

/**
 * 格局術語對照表。
 *
 * 排序有意義：先比中先贏，因此**較長、較具體的詞必須排在前面**。
 * 例如「ウォークインクローゼット」要在「クローゼット」之前，
 * 「シャワールーム」要在「浴室」之前，否則會被較短或較泛的規則先吃掉。
 */
const FLOOR_PLAN_RULES: FloorPlanRule[] = [
  // ── 居室空間 ──
  { pattern: /LDK/i, category: "居室空間", nameZh: "客餐廳連廚房", note: "起居、用餐與廚房為同一開放空間" },
  { pattern: /DK(?![A-Za-z])/i, category: "居室空間", nameZh: "餐廳連廚房", note: "用餐區與廚房相連" },
  { pattern: /リビング|居間/, category: "居室空間", nameZh: "客廳" },
  { pattern: /ダイニング|食事室/, category: "居室空間", nameZh: "餐廳" },
  { pattern: /洋室|洋間/, category: "居室空間", nameZh: "西式房間", note: "鋪設木地板或地毯的房間" },
  { pattern: /和室|畳室/, category: "居室空間", nameZh: "和室", note: "鋪設榻榻米的房間" },
  { pattern: /納戸|サービスルーム/, category: "居室空間", nameZh: "納戶（儲藏室）", note: "採光通風未達居室標準，通常不計入房數" },
  { pattern: /ロフト|小屋裏/, category: "居室空間", nameZh: "夾層閣樓", note: "天花高度多未滿 1.4m，常作收納用" },
  { pattern: /書斎|ワークスペース/, category: "居室空間", nameZh: "書房／工作區" },

  // ── 水區設備（長詞、具體詞優先） ──
  { pattern: /シャワールーム/, category: "水區設備", nameZh: "淋浴間" },
  { pattern: /ユニットバス/, category: "水區設備", nameZh: "整體衛浴" },
  { pattern: /浴室|バスルーム|風呂/, category: "水區設備", nameZh: "浴室" },
  { pattern: /洗面脱衣室|脱衣室/, category: "水區設備", nameZh: "盥洗更衣室" },
  { pattern: /洗面化粧台|洗面所|洗面/, category: "水區設備", nameZh: "洗面台" },
  { pattern: /トイレ|便所|WC/i, category: "水區設備", nameZh: "廁所" },
  { pattern: /洗濯機置場|洗濯機置き場|洗濯機|室内洗置|洗置/, category: "水區設備", nameZh: "洗衣機置放處" },
  { pattern: /キッチン|台所|流し台/, category: "水區設備", nameZh: "廚房" },
  { pattern: /冷蔵庫置場|冷蔵庫置き場|冷蔵庫/, category: "水區設備", nameZh: "冰箱置放處" },

  // ── 收納空間（長詞優先） ──
  { pattern: /ウォークインクローゼット|WIC/i, category: "收納空間", nameZh: "步入式衣帽間" },
  { pattern: /シューズインクローゼット|SIC/i, category: "收納空間", nameZh: "步入式鞋物間" },
  { pattern: /シューズボックス|下駄箱/, category: "收納空間", nameZh: "鞋櫃" },
  { pattern: /クローゼット/, category: "收納空間", nameZh: "衣櫃" },
  { pattern: /押入/, category: "收納空間", nameZh: "壁櫥", note: "和室的傳統收納空間" },
  { pattern: /床下収納/, category: "收納空間", nameZh: "地板下收納" },
  { pattern: /パントリー/, category: "收納空間", nameZh: "食品儲藏櫃" },
  { pattern: /トランクルーム/, category: "收納空間", nameZh: "儲藏室" },
  { pattern: /ハンガーパイプ|ハンガーラック/, category: "收納空間", nameZh: "吊衣桿" },
  { pattern: /吊戸棚|飾り棚|棚/, category: "收納空間", nameZh: "置物層板" },
  { pattern: /収納|物入/, category: "收納空間", nameZh: "收納櫃" },

  // ── 戶外空間 ──
  { pattern: /ルーフバルコニー/, category: "戶外空間", nameZh: "屋頂陽台" },
  { pattern: /バルコニー|ベランダ/, category: "戶外空間", nameZh: "陽台" },
  { pattern: /テラス/, category: "戶外空間", nameZh: "露台", note: "與地面層相連的戶外空間" },
  { pattern: /専用庭|庭/, category: "戶外空間", nameZh: "專用庭院" },
  { pattern: /駐車場|カーポート/, category: "戶外空間", nameZh: "停車位" },
  { pattern: /駐輪場|自転車置場/, category: "戶外空間", nameZh: "自行車停放處" },

  // ── 其他標註 ──
  { pattern: /玄関ホール/, category: "其他標註", nameZh: "玄關門廳" },
  { pattern: /玄関/, category: "其他標註", nameZh: "玄關" },
  { pattern: /廊下/, category: "其他標註", nameZh: "走廊" },
  { pattern: /階段/, category: "其他標註", nameZh: "樓梯" },
  { pattern: /エントランス/, category: "其他標註", nameZh: "大樓出入口" },
  { pattern: /メーターボックス/, category: "其他標註", nameZh: "電錶／管線箱" },
  { pattern: /パイプスペース/, category: "其他標註", nameZh: "管道間" },
  { pattern: /エアコン/, category: "其他標註", nameZh: "空調設置位" },
];

const normalizeToken = (value: string) => value.normalize("NFKC").replace(/[\s　]+/g, " ").trim();

/**
 * 從標註中抽出尺寸（面積／畳數），並過濾工程用模組雜訊。
 *
 * 1. 模組規格過濾：日本ユニットバス等模組常標有「(1116)」「1216」「1616」等
 *    工法尺寸代碼（長寬 110cm×160cm），對購屋租屋者毫無閱讀意義，予以剔除。
 * 2. 尺寸統一：畳數寫法「畳」「帖」「J」統一成「帖」；面積統一成「㎡」。
 * 3. 乾淨名抽取：抽出尺寸後回傳剩餘名稱，供中文比對與日文對照顯示，避免括號內再度重複尺寸。
 */
function extractSize(token: string): { size?: string; rest: string } {
  const parts: string[] = [];
  let rest = token;

  // 剔除對使用者毫無意義的日本工法設備模組代碼（例如浴室 1116、1216、1014、1616、1620 等）
  rest = rest.replace(/[（(]?\s*(?:1[0-9]|2[0-9])(?:1[0-9]|2[0-9])\s*[)）]?/g, " ");

  const areaMatch = rest.match(/(\d+(?:\.\d+)?)\s*(?:㎡|m2|m²|平米|平方メートル)/i);
  if (areaMatch) {
    parts.push(`${areaMatch[1]}㎡`);
    rest = rest.replace(areaMatch[0], " ");
  }

  const tatamiMatch = rest.match(/(?:約\s*)?(\d+(?:\.\d+)?)\s*(?:畳|帖|J(?![a-z]))/i);
  if (tatamiMatch) {
    parts.push(`${tatamiMatch[1]}帖`);
    rest = rest.replace(tatamiMatch[0], " ");
  }

  return {
    size: parts.length ? parts.join("／") : undefined,
    rest: rest.replace(/[／/（）()約]/g, " ").replace(/\s+/g, " ").trim(),
  };
}

/** 抽出樓層標註（1F、2階、B1 等），多見於獨棟或含閣樓的物件 */
function extractFloor(token: string): { floor?: string; rest: string } {
  const m = token.match(/^\s*(B?\d+)\s*(?:F|階)\s*[:：]\s*/i);
  if (!m) return { rest: token };
  return { floor: `${m[1].toUpperCase()}F`, rest: token.slice(m[0].length).trim() };
}

/** 查詢或比對英文格局縮寫代號 */
function resolveAbbreviation(token: string): AbbreviationKnowledge | undefined {
  const upper = token.toUpperCase().trim();
  // 1. 完全相符（K, CL, SC, WIC, MB, PS 等）
  if (FLOOR_PLAN_ABBREVIATIONS[upper]) {
    return FLOOR_PLAN_ABBREVIATIONS[upper];
  }
  // 2. 括號複合相符（例如 K(キッチン), CL(クローゼット), SC(下駄箱) 等）
  const leadingWord = upper.match(/^([A-Z]{1,4})\b/)?.[1];
  if (leadingWord && FLOOR_PLAN_ABBREVIATIONS[leadingWord]) {
    return FLOOR_PLAN_ABBREVIATIONS[leadingWord];
  }
  return undefined;
}

/**
 * 把 floorPlanDetails 的日文原文摘要，解析成分類後的中文清單。
 *
 * 對照表沒收錄的標註不會被丟棄——會歸入「其他標註」並保留日文原文，
 * 讓使用者至少能對照圖面，而不是悄悄消失。
 */
export function parseFloorPlanDetails(raw?: string | null): FloorPlanItem[] {
  if (!raw || typeof raw !== "string") return [];

  const clean = raw
    .normalize("NFKC")
    // 換行在多樓層描述裡是有意義的分隔，和頓號一起轉成統一分隔符
    .replace(/[\r\n]+/g, ",")
    .replace(/[、，;；]/g, ",")
    .trim();

  if (!clean || /^(?:なし|無|不明|-|ー|―)$/i.test(clean)) return [];

  const items: FloorPlanItem[] = [];
  const seen = new Set<string>();
  // 樓層標註（「1F：」）通常只寫一次，後續項目沿用，直到出現新的樓層
  let currentFloor: string | undefined;

  for (const rawToken of clean.split(",")) {
    const token = normalizeToken(rawToken);
    if (!token) continue;

    const { floor, rest: afterFloor } = extractFloor(token);
    if (floor) currentFloor = floor;
    if (!afterFloor) continue;

    const { size, rest } = extractSize(afterFloor);
    // 尺寸拿掉後什麼都不剩（例如單獨的「約20㎡」），就沒有可命名的空間
    if (!rest) continue;

    const abbr = resolveAbbreviation(rest);

    let category: FloorPlanCategory;
    let nameZh: string;
    let displayJa: string;
    let note: string | undefined;

    if (abbr) {
      category = abbr.category;
      nameZh = abbr.nameZh;
      displayJa = `${abbr.code} / ${abbr.nameEn}`;
      note = abbr.explanation;
    } else {
      const matched = FLOOR_PLAN_RULES.find(rule => rule.pattern.test(rest));
      category = matched?.category ?? "其他標註";
      nameZh = matched?.nameZh ?? rest;
      // 避免原文括號內重複顯示剛抽出的面積／帖數與模組編號
      displayJa = rest;
      note = matched?.note;
    }

    // 居室空間（臥室、和室、客餐廳等）每一間都是獨立的實體房間（如 2LDK/3LDK 常有兩間 6帖 洋室），
    // 絕不可因同尺寸或無尺寸而將第二間臥室吃掉；非居室標註（如重複標註的「収納、収納」）才做去重。
    let dedupeKey: string;
    if (category === "居室空間") {
      let counter = 1;
      while (seen.has(`${nameZh}|${size ?? ""}|${currentFloor ?? ""}|#${counter}`)) {
        counter++;
      }
      dedupeKey = `${nameZh}|${size ?? ""}|${currentFloor ?? ""}|#${counter}`;
    } else {
      dedupeKey = `${nameZh}|${size ?? ""}|${currentFloor ?? ""}`;
      if (seen.has(dedupeKey)) continue;
    }
    seen.add(dedupeKey);

    items.push({
      key: dedupeKey,
      category,
      nameZh,
      rawJa: displayJa,
      size,
      floor: currentFloor,
      note,
    });
  }

  return items;
}

/** 依 FLOOR_PLAN_CATEGORY_ORDER 分組，空分類不回傳 */
export function groupFloorPlanItems(
  items: FloorPlanItem[]
): Array<{ category: FloorPlanCategory; items: FloorPlanItem[] }> {
  return FLOOR_PLAN_CATEGORY_ORDER
    .map(category => ({ category, items: items.filter(i => i.category === category) }))
    .filter(group => group.items.length > 0);
}
