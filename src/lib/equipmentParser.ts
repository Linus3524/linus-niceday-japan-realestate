/**
 * 日本不動產圖紙設備規格解析與中文化模組
 * 將圖紙中提取的日文設備清單（無論是條列式或表格打圈勾選式），
 * 轉換為結構化、分類清晰、附繁體中文說明的設備標籤。
 */

export interface ParsedEquipmentItem {
  key: string;
  category: "衛浴水洗" | "廚房烹飪" | "門禁安全" | "大樓公設" | "室內舒適" | "通訊網路" | "其他設備";
  nameZh: string;
  rawJa: string;
  highlight?: boolean; // 高價值關鍵設備（如衛浴分離、獨立洗面台、自動門、免治馬桶等）
  note?: string;
}

interface EquipmentRule {
  pattern: RegExp;
  category: ParsedEquipmentItem["category"];
  nameZh: string;
  highlight?: boolean;
  note?: string;
}

const EQUIPMENT_RULES: EquipmentRule[] = [
  // 1. 衛浴水洗
  {
    pattern: /バス・トイレ別|バストイレ別|BT別|B・T別|セパレート/i,
    category: "衛浴水洗",
    nameZh: "乾濕分離",
    highlight: true,
    note: "浴室與廁所各自獨立",
  },
  {
    pattern: /独立洗面台|洗面所独立|シャンプードレッサー|洗面化粧台|洗面台/i,
    category: "衛浴水洗",
    nameZh: "獨立洗面化妝台",
    highlight: true,
  },
  {
    pattern: /温水洗浄便座|ウォシュレット|洗浄機能付暖房便座|暖房便座|シャワートイレ/i,
    category: "衛浴水洗",
    nameZh: "免治馬桶",
    highlight: true,
  },
  {
    pattern: /浴室乾燥機|浴室暖房乾燥機|浴室換気乾燥機|浴室乾燥/i,
    category: "衛浴水洗",
    nameZh: "浴室暖風乾燥機",
    highlight: true,
    note: "雨天乾衣、冬天預熱必備",
  },
  {
    pattern: /追い焚き|追焚|追焚き|オートバス/i,
    category: "衛浴水洗",
    nameZh: "自動追焚保溫浴缸",
    highlight: true,
    note: "熱水自動加熱循環",
  },
  {
    pattern: /室内洗濯機置場|洗濯機置場|洗濯機置き場|洗濯置場/i,
    category: "衛浴水洗",
    nameZh: "室內洗衣機專用置場",
  },
  {
    pattern: /(?:専用)?バス(?:有)?|風呂(?:有)?/i,
    category: "衛浴水洗",
    nameZh: "獨立浴室",
  },
  {
    pattern: /(?:専用)?トイレ(?:有)?/i,
    category: "衛浴水洗",
    nameZh: "專用衛生間",
  },

  // 2. 廚房烹飪
  {
    pattern: /3口(?:ガス)?コンロ|3口キッチン|3口グリル/i,
    category: "廚房烹飪",
    nameZh: "3 口烹飪爐",
    highlight: true,
  },
  {
    pattern: /2口(?:ガス)?コンロ|2口キッチン/i,
    category: "廚房烹飪",
    nameZh: "2 口瓦斯爐",
    highlight: true,
  },
  {
    pattern: /1口(?:ガス)?コンロ|1口キッチン|ガスコンロ\s*[（(]?\s*1口/i,
    category: "廚房烹飪",
    nameZh: "1 口瓦斯爐",
  },
  {
    pattern: /IHクッキングヒーター|IHコンロ|IHキッチン|IH/i,
    category: "廚房烹飪",
    nameZh: "IH 電磁烹飪爐",
  },
  {
    pattern: /ガスコンロ|ガスキッチン/i,
    category: "廚房烹飪",
    nameZh: "瓦斯爐具",
  },
  {
    pattern: /システムキッチン/i,
    category: "廚房烹飪",
    nameZh: "系統廚房",
  },
  {
    pattern: /グリル付|グリル|魚焼き/i,
    category: "廚房烹飪",
    nameZh: "附設烤魚爐",
  },
  {
    pattern: /都市ガス/i,
    category: "廚房烹飪",
    nameZh: "天然都市瓦斯",
    note: "瓦斯費用較 LP 瓦斯低廉",
  },
  {
    pattern: /プロパンガス|LPガス/i,
    category: "廚房烹飪",
    nameZh: "LP 桶裝瓦斯",
  },
  {
    pattern: /ディスポーザー/i,
    category: "廚房烹飪",
    nameZh: "廚下生鮮鐵胃粉碎機",
    highlight: true,
  },

  // 3. 門禁安全
  {
    pattern: /モニタ付オートロック|TVモニター付(?:オートロック|インターホン)|モニター付インターホン|カラーモニター/i,
    category: "門禁安全",
    nameZh: "彩色螢幕對講機",
    highlight: true,
  },
  {
    pattern: /オートロック|防盗自動門鎖|防盜自動門鎖/i,
    category: "門禁安全",
    nameZh: "防盜自動門鎖",
    highlight: true,
  },
  {
    pattern: /防犯カメラ/i,
    category: "門禁安全",
    nameZh: "防盜監視攝影機",
    highlight: true,
  },
  {
    pattern: /ディンプルキー|ダブルロック/i,
    category: "門禁安全",
    nameZh: "高防盜鑰匙／雙重鎖",
    highlight: true,
  },
  {
    pattern: /24時間緊急通報システム|緊急通報システム/i,
    category: "門禁安全",
    nameZh: "24 小時緊急通報系統",
    highlight: true,
  },
  {
    pattern: /多重セキュリティシステム|セキュリティシステム/i,
    category: "門禁安全",
    nameZh: "多重門禁保全系統",
    highlight: true,
  },
  {
    pattern: /インターホン/i,
    category: "門禁安全",
    nameZh: "室內對講機",
  },

  // 4. 大樓公設與便利
  {
    pattern: /宅配ボックス|宅配BOX|宅配ロッカー/i,
    category: "大樓公設",
    nameZh: "宅配箱",
    highlight: true,
  },
  {
    pattern: /エレベーター|エレベータ|EV/i,
    category: "大樓公設",
    nameZh: "大樓電梯",
    highlight: true,
  },
  {
    pattern: /24時間ゴミ出し(?:可)?/i,
    category: "大樓公設",
    nameZh: "24H 垃圾集中場",
    highlight: true,
    note: "免配合清運時間，隨時可丟",
  },
  {
    pattern: /敷地内ゴミ置[き]?場|ゴミ置[き]?場|ゴミステーション/i,
    category: "大樓公設",
    nameZh: "社區專屬垃圾集中場",
    highlight: true,
    note: "專屬分類集中處",
  },
  {
    pattern: /風除室/i,
    category: "大樓公設",
    nameZh: "玄關風除室防風門",
  },
  {
    pattern: /耐震構造|耐火構造/i,
    category: "大樓公設",
    nameZh: "新耐震結構",
    highlight: true,
  },
  {
    pattern: /外壁タイル張り|外壁タイル/i,
    category: "大樓公設",
    nameZh: "外牆磁磚飾面",
  },
  {
    pattern: /駅まで平坦/i,
    category: "大樓公設",
    nameZh: "鄰近車站道路平坦",
  },
  {
    pattern: /駐輪場|駐輪スペース/i,
    category: "大樓公設",
    nameZh: "自行車停放處",
  },
  {
    pattern: /バイク置場|バイク置き場/i,
    category: "大樓公設",
    nameZh: "機車停放處",
  },
  {
    pattern: /駐車場/i,
    category: "大樓公設",
    nameZh: "汽車停車場",
  },

  // 5. 室內舒適與格局
  {
    pattern: /ポーチ|玄関ポーチ/i,
    category: "室內舒適",
    nameZh: "玄關門廊",
  },
  {
    pattern: /2面採光|二面採光|二方向採光/i,
    category: "室內舒適",
    nameZh: "雙面採光",
  },
  {
    pattern: /バルコニー洗置|バルコニー洗濯機置場/i,
    category: "室內舒適",
    nameZh: "陽台洗衣機置場",
  },
  {
    pattern: /パウダールーム/i,
    category: "衛浴水洗",
    nameZh: "化妝盥洗室",
  },
  {
    pattern: /エアコン(?:\s*[（(]?\s*(\d+)基)?/i,
    category: "室內舒適",
    nameZh: "冷暖空調",
  },
  {
    pattern: /床暖房/i,
    category: "室內舒適",
    nameZh: "地暖設備",
    highlight: true,
  },
  {
    pattern: /全居室フローリング/i,
    category: "室內舒適",
    nameZh: "全室木質地板",
  },
  {
    pattern: /居室床材フローリング|フローリング/i,
    category: "室內舒適",
    nameZh: "木質地板",
  },
  {
    pattern: /(?:専用|專用)?(?:バルコニー|ベランダ|陽台)/i,
    category: "室內舒適",
    nameZh: "專用陽台",
  },
  {
    pattern: /ウォークインクローゼット|WIC/i,
    category: "室內舒適",
    nameZh: "步入式衣帽間",
    highlight: true,
  },
  {
    pattern: /シューズインクローゼット|シューズボックス|下駄箱|SIC/i,
    category: "室內舒適",
    nameZh: "收納鞋櫃",
  },
  {
    pattern: /クローゼット|収納/i,
    category: "室內舒適",
    nameZh: "收納衣櫃",
  },
  {
    pattern: /分譲タイプ/i,
    category: "室內舒適",
    nameZh: "分售住宅規格",
    highlight: true,
    note: "防音與建材規格較佳",
  },
  {
    pattern: /2階以上|2F以上/i,
    category: "室內舒適",
    nameZh: "2F 以上",
  },

  // 6. 通訊與網路
  {
    pattern: /BBM-NET|インターネット無料|ネット無料|Wi-Fi無料|インターネット光/i,
    category: "通訊網路",
    nameZh: "免費高速光纖網路",
    highlight: true,
    note: "月省約 4,000～5,000 円",
  },
  {
    pattern: /光ファイバー|光回線/i,
    category: "通訊網路",
    nameZh: "光纖網路",
  },
  {
    pattern: /BSアンテナ|BS|CSアンテナ|CS/i,
    category: "通訊網路",
    nameZh: "BS／CS 衛星電視支援",
  },
  {
    pattern: /CATV/i,
    category: "通訊網路",
    nameZh: "CATV 有線電視設備",
  },
  // ── 買賣図面常見、原本沒收錄而直接落回日文原文的項目 ──
  {
    pattern: /(?:専用)?トランク(?:・?ルーム)?|専用倉庫|物置/i,
    category: "大樓公設",
    nameZh: "個人儲藏室",
    highlight: true,
    note: "住戶專用的大樓倉庫空間",
  },
  {
    pattern: /ガス給湯器|給湯器|給湯|エコジョーズ/i,
    category: "衛浴水洗",
    nameZh: "瓦斯熱水器",
  },
  {
    pattern: /エコキュート/i,
    category: "衛浴水洗",
    nameZh: "電熱水器（EcoCute）",
  },
  {
    pattern: /内廊下|内廊下設計|ホテルライク/i,
    category: "大樓公設",
    nameZh: "飯店式內廊道",
    highlight: true,
    note: "走廊在建物內部，隱私與防風雨較佳",
  },
  {
    pattern: /外廊下/i,
    category: "大樓公設",
    nameZh: "外廊道設計",
  },
  {
    pattern: /トレーニング(?:室|ルーム)|フィットネス|ジム/i,
    category: "大樓公設",
    nameZh: "住戶專用健身房",
    highlight: true,
  },
  {
    pattern: /ラウンジ|コミュニティルーム|パーティールーム/i,
    category: "大樓公設",
    nameZh: "住戶交誼廳",
  },
  {
    pattern: /ゲストルーム/i,
    category: "大樓公設",
    nameZh: "訪客住宿套房",
  },
  {
    pattern: /コンシェルジュ|フロントサービス/i,
    category: "大樓公設",
    nameZh: "大樓管家服務",
    highlight: true,
  },
  {
    pattern: /24時間有人管理/i,
    category: "大樓公設",
    nameZh: "24 小時人員駐點管理",
    highlight: true,
  },
  {
    pattern: /管理人(?:常駐|日勤|巡回)|管理員常駐/i,
    category: "大樓公設",
    nameZh: "管理員駐點",
  },
  {
    pattern: /オートロック付.*エントランス|エントランスホール/i,
    category: "大樓公設",
    nameZh: "大廳門廳",
  },
  {
    pattern: /ペット(?:可|相談|飼育可)/i,
    category: "其他設備",
    nameZh: "可飼養寵物",
    highlight: true,
    note: "仍須確認管理規約的品種與體型限制",
  },
  {
    pattern: /角部屋|角住戸/i,
    category: "室內舒適",
    nameZh: "邊間住戶",
    highlight: true,
    note: "採光與通風面較多",
  },
  {
    pattern: /南向き|南向|南面採光/i,
    category: "室內舒適",
    nameZh: "南向採光",
    highlight: true,
  },
  {
    pattern: /二重(?:サッシ|窓)|複層ガラス|ペアガラス/i,
    category: "室內舒適",
    nameZh: "雙層隔音氣密窗",
    highlight: true,
  },
  {
    pattern: /床下収納/i,
    category: "室內舒適",
    nameZh: "地板下收納",
  },
  {
    pattern: /リフォーム済|リノベーション済|full renovation|全面改装/i,
    category: "其他設備",
    nameZh: "已整體翻新",
    highlight: true,
  },
  {
    pattern: /集会所|集会室/i,
    category: "大樓公設",
    nameZh: "住戶集會室",
  },
  {
    pattern: /洋室\s*[（(]?\s*\d+(?:\.\d+)?\s*畳/i,
    category: "室內舒適",
    nameZh: "西式房間",
  },
  {
    pattern: /(?:駐輪場|バイク置場).*有|屋根付き駐輪場/i,
    category: "大樓公設",
    nameZh: "有頂自行車停放處",
  },
];

/**
 * 將圖紙提取出的設備字串或陣列，解析為結構化的中文分類設備清單
 */
export function parseEquipmentList(rawFacilities?: string | string[] | null): ParsedEquipmentItem[] {
  if (!rawFacilities) return [];

  const rawString = Array.isArray(rawFacilities)
    ? rawFacilities.join(", ")
    : String(rawFacilities);

  const clean = rawString
    .normalize("NFKC")
    .replace(/[\r\n]+/g, ",")
    .replace(/[、，|/]/g, ",")
    .trim();

  if (!clean || /^(?:なし|無|0|-|ー|―)$/i.test(clean)) return [];

  const tokens = clean
    .split(",")
    .map(t => t.trim())
    .filter(Boolean);

  const results: ParsedEquipmentItem[] = [];
  const seenKeys = new Set<string>();

  for (const token of tokens) {
    let matched = false;
    for (const rule of EQUIPMENT_RULES) {
      if (rule.pattern.test(token)) {
        if (!seenKeys.has(rule.nameZh)) {
          seenKeys.add(rule.nameZh);
          // 特別抓取冷氣數量（例如「エアコン2基」）
          let nameZh = rule.nameZh;
          const airConCount = token.match(/エアコン\s*[（(]?\s*(\d+)基/i);
          if (airConCount) {
            nameZh = `冷暖變頻空調（${airConCount[1]} 台）`;
          }
          const westernRoomSize = token.match(/洋室\s*[（(]?\s*(\d+(?:\.\d+)?)\s*畳/i);
          if (westernRoomSize) {
            nameZh = `西式房間（${westernRoomSize[1]} 帖）`;
          }
          results.push({
            key: rule.nameZh,
            category: rule.category,
            nameZh,
            rawJa: token,
            highlight: rule.highlight,
            note: rule.note,
          });
        }
        matched = true;
        break;
      }
    }

    if (!matched && token.length >= 2 && !/^(?:有|○|◯|●|✔|レ|可)$/.test(token)) {
      // 濾除無意義的日文殘留字詞或常見標記
      if (/^(?:バス有|風呂有|トイレ有|エアコン有|有|完備|付)$/i.test(token)) {
        continue;
      }
      if (!seenKeys.has(token)) {
        seenKeys.add(token);
        results.push({
          key: token,
          category: "其他設備",
          nameZh: token,
          rawJa: token,
        });
      }
    }
  }

  // 智慧去重與層級精簡
  const hasSeparatedBath = results.some(r => r.nameZh === "乾濕分離");
  const hasSpecificStove = results.some(r => /2\s*口|3\s*口|IH/i.test(r.nameZh));
  const has24hTrash = results.some(r => r.nameZh === "24H 垃圾集中場");

  return results.filter(item => {
    // 1. 若已有「乾濕分離」，移除次級浴室/廁所殘留標籤
    if (hasSeparatedBath && (
      item.nameZh === "獨立浴室" ||
      item.nameZh === "專用衛生間" ||
      /^(?:専用)?バス(?:有)?$|^風呂(?:有)?$/i.test(item.rawJa)
    )) {
      return false;
    }
    // 2. 若已有具體瓦斯爐規格（如 2 口瓦斯爐），移除籠統的「瓦斯爐具」或「系統廚房」
    if (hasSpecificStove && (item.nameZh === "瓦斯爐具" || item.nameZh === "系統廚房")) {
      return false;
    }
    // 3. 若已有 24H 垃圾場，移除次級「社區專屬垃圾集中場」
    if (has24hTrash && item.nameZh === "社區專屬垃圾集中場") {
      return false;
    }
    return true;
  });
}
