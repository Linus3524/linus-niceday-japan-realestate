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
    pattern: /タンクレストイレ|タンクレス/i,
    category: "衛浴水洗",
    nameZh: "無水箱時尚免治馬桶",
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
    pattern: /追い焚き機能|追い焚き|追焚|追焚き|オートバス/i,
    category: "衛浴水洗",
    nameZh: "自動追焚保溫浴缸",
    highlight: true,
    note: "熱水自動加熱循環",
  },
  {
    pattern: /ミストサウナ/i,
    category: "衛浴水洗",
    nameZh: "微霧蒸氣桑拿浴室",
    highlight: true,
  },
  {
    pattern: /ユニットバス(?:新規)?交換|システムバス(?:新規)?交換|ユニットバス|UB交換|UB/i,
    category: "衛浴水洗",
    nameZh: "整體衛浴設備更新",
    highlight: true,
  },
  {
    pattern: /水回(?:り)?(?:新規)?(?:交換|リフォーム|一新)/i,
    category: "衛浴水洗",
    nameZh: "衛浴廚房管線翻新",
    highlight: true,
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
  {
    pattern: /ガス給湯器|給湯器(?:新規)?交換|給湯器|給湯|エコジョーズ/i,
    category: "衛浴水洗",
    nameZh: "瓦斯熱水器",
  },
  {
    pattern: /エコキュート/i,
    category: "衛浴水洗",
    nameZh: "電熱水器（EcoCute）",
  },
  {
    pattern: /パウダールーム/i,
    category: "衛浴水洗",
    nameZh: "化妝盥洗室",
  },

  // 2. 廚房烹飪
  {
    pattern: /対面(?:式)?(?:システム)?キッチン|カウンターキッチン|オープンキッチン|アイランドキッチン|ペニンシュラキッチン/i,
    category: "廚房烹飪",
    nameZh: "開放式中島／吧檯廚房",
    highlight: true,
    note: "視野通透開闊的中島吧檯式廚房設計",
  },
  {
    pattern: /食器洗い乾燥機|食器洗浄乾燥機|食器洗浄機|食洗機/i,
    category: "廚房烹飪",
    nameZh: "自動洗碗機",
    highlight: true,
    note: "省時節水內建洗碗機",
  },
  {
    pattern: /ディスポーザー/i,
    category: "廚房烹飪",
    nameZh: "廚下生鮮鐵胃粉碎機",
    highlight: true,
  },
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
    pattern: /キッチン(?:新規)?(?:交換|リフォーム)|システムキッチン(?:新規)?交換/i,
    category: "廚房烹飪",
    nameZh: "系統廚具整套換新",
    highlight: true,
  },
  {
    pattern: /システムキッチン/i,
    category: "廚房烹飪",
    nameZh: "系統廚房",
  },
  {
    pattern: /ガスコンロ|ガスキッチン/i,
    category: "廚房烹飪",
    nameZh: "瓦斯爐具",
  },
  {
    pattern: /グリル付|グリル|魚焼き/i,
    category: "廚房烹飪",
    nameZh: "附設烤魚爐",
  },
  {
    pattern: /浄水器|ビルトイン浄水器|浄水機能/i,
    category: "廚房烹飪",
    nameZh: "內建淨水器",
  },
  {
    pattern: /パントリー|食品庫/i,
    category: "廚房烹飪",
    nameZh: "廚房儲藏空間（Pantry）",
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
    pattern: /24時間(?:セキュリティ|警備)/i,
    category: "門禁安全",
    nameZh: "24 小時安全警備系統",
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
    pattern: /免震(?:構造)?/i,
    category: "大樓公設",
    nameZh: "頂級免震結構",
    highlight: true,
    note: "高規格減震橡膠基礎，耐震度最佳",
  },
  {
    pattern: /制震(?:構造)?/i,
    category: "大樓公設",
    nameZh: "制震耐震結構",
    highlight: true,
  },
  {
    pattern: /新耐震(?:基準|構造|結構)?/i,
    category: "大樓公設",
    nameZh: "新耐震結構",
    highlight: true,
  },
  { pattern: /(?<!新)耐震構造/i, category: "大樓公設", nameZh: "耐震結構" },
  { pattern: /耐火構造/i, category: "大樓公設", nameZh: "耐火結構" },
  {
    pattern: /大規模修繕(?:工事)?(?:実施|済|完了)?/i,
    category: "大樓公設",
    nameZh: "已完成大樓大規模修繕",
    highlight: true,
    note: "外牆磁磚與公共管線已定期維護更新",
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
    pattern: /車寄せ/i,
    category: "大樓公設",
    nameZh: "大樓迎賓車道",
  },
  {
    pattern: /EV充電(?:設備)?|電気自動車充電/i,
    category: "大樓公設",
    nameZh: "電動車 EV 充電車位",
    highlight: true,
  },
  {
    pattern: /防災(?:備蓄)?倉庫|防災倉庫/i,
    category: "大樓公設",
    nameZh: "大樓防災備蓄設施",
  },
  {
    pattern: /集会所|集会室/i,
    category: "大樓公設",
    nameZh: "住戶集會室",
  },
  {
    pattern: /風除室/i,
    category: "大樓公設",
    nameZh: "玄關風除室防風門",
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
    pattern: /(?:専用)?トランク(?:・?ルーム)?|専用倉庫|物置/i,
    category: "大樓公設",
    nameZh: "個人儲藏室",
    highlight: true,
    note: "住戶專用的大樓倉庫空間",
  },
  {
    pattern: /駐輪場|駐輪スペース/i,
    category: "大樓公設",
    nameZh: "自行車停放處",
  },
  {
    pattern: /(?:駐輪場|バイク置場).*有|屋根付き駐輪場/i,
    category: "大樓公設",
    nameZh: "有頂自行車停放處",
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

  // 5. 室內舒適與結構
  {
    pattern: /二重天井/i,
    category: "室內舒適",
    nameZh: "雙層降噪天花板",
    highlight: true,
    note: "中空隔音樓板結構，利於降噪與配管檢修",
  },
  {
    pattern: /二重床/i,
    category: "室內舒適",
    nameZh: "雙層防音架高地板",
    highlight: true,
    note: "高規格防震隔音樓板結構",
  },
  {
    pattern: /ダウンライト(?:設置)?|LEDダウンライト/i,
    category: "室內舒適",
    nameZh: "天花板嵌燈",
    note: "嵌入式天花板柔和照明設計",
  },
  {
    pattern: /人感センサー(?:付(?:照明)?)?/i,
    category: "室內舒適",
    nameZh: "玄關自動感應照明",
  },
  {
    pattern: /二重(?:サッシ|窓)|複層ガラス|ペアガラス|Low-E/i,
    category: "室內舒適",
    nameZh: "雙層隔音氣密窗",
    highlight: true,
  },
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
    pattern: /バルコニー洗置|バルコニー洗濯機置場/i,
    category: "室內舒適",
    nameZh: "陽台洗衣機置場",
  },
  {
    pattern: /ルーフバルコニー/i,
    category: "室內舒適",
    nameZh: "頂樓景觀露台",
    highlight: true,
  },
  {
    pattern: /専用庭/i,
    category: "室內舒適",
    nameZh: "私人戶外花園庭院",
    highlight: true,
  },
  {
    pattern: /エアコン(?:\s*[（(]?\s*(\d+)基)?/i,
    category: "室內舒適",
    nameZh: "冷暖空調",
  },
  {
    pattern: /床暖房|TES温水式床暖房/i,
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
    pattern: /居室床材フローリング|フローリング(?:張替|貼替)?/i,
    category: "室內舒適",
    nameZh: "木質地板",
  },
  {
    pattern: /壁[、\s]*天井クロス(?:貼替|張替)|クロス(?:貼替|張替)|壁紙(?:貼替|張替)/i,
    category: "室內舒適",
    nameZh: "壁紙天花板更新",
  },
  {
    pattern: /建具(?:交換|新調)|室内ドア交換/i,
    category: "室內舒適",
    nameZh: "室內房門建具更新",
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
    pattern: /リネン庫|リネン棚|リネン収納/i,
    category: "室內舒適",
    nameZh: "衛浴毛巾備品收納櫃",
  },
  {
    pattern: /クローゼット|収納/i,
    category: "室內舒適",
    nameZh: "收納衣櫃",
  },
  {
    pattern: /床下収納/i,
    category: "室內舒適",
    nameZh: "地板下收納",
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
  {
    pattern: /洋室\s*[（(]?\s*\d+(?:\.\d+)?\s*畳/i,
    category: "室內舒適",
    nameZh: "西式房間",
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

  // 7. 其他綜合
  {
    pattern: /ペット(?:可|相談|飼育可)/i,
    category: "其他設備",
    nameZh: "可飼養寵物",
    highlight: true,
    note: "仍須確認管理規約的品種與體型限制",
  },
  {
    pattern: /リフォーム済|リノベーション済|full renovation|全面改装/i,
    category: "其他設備",
    nameZh: "已整體翻新",
    highlight: true,
  },
  // 図面／間取圖常見的英文與未收錄日文標記
  {
    pattern: /parking\s*space|car\s*space|駐車スペース|カースペース/i,
    category: "大樓公設",
    nameZh: "停車空間",
  },
  {
    pattern: /サービスルーム|納戸|S\s*ルーム/i,
    category: "室內舒適",
    nameZh: "多功能室（納戸）",
    note: "建築法規上採光未達居室標準，圖面以「S」或「納戸」標示",
  },
  {
    pattern: /ロフト|loft/i,
    category: "室內舒適",
    nameZh: "夾層閣樓",
  },
  {
    pattern: /太陽光発電|ソーラーパネル|solar/i,
    category: "大樓公設",
    nameZh: "太陽能發電",
    highlight: true,
    note: "自家發電可降低電費，並常搭配蓄電系統",
  },
  {
    pattern: /エネファーム|家庭用燃料電池/i,
    category: "大樓公設",
    nameZh: "家用燃料電池",
    highlight: true,
    note: "エネファーム：以瓦斯發電並回收廢熱供應熱水",
  },
  {
    pattern: /エコワン|ECO\s*ONE|ハイブリッド給湯/i,
    category: "衛浴水洗",
    nameZh: "瓦斯電力混合熱水系統",
    highlight: true,
  },
  {
    pattern: /蓄電池|storage\s*battery/i,
    category: "大樓公設",
    nameZh: "家用蓄電池",
    highlight: true,
  },
  {
    pattern: /24\s*時間換気|24時間換気システム/i,
    category: "室內舒適",
    nameZh: "24 小時換氣系統",
  },
  {
    pattern: /ビルトインガレージ|インナーガレージ/i,
    category: "大樓公設",
    nameZh: "內建車庫",
    highlight: true,
  },
  {
    pattern: /(?:月額)?基本使用料無料|インターネット無料|ネット無料/i,
    category: "通訊網路",
    nameZh: "網路月費免費",
    highlight: true,
  },
  {
    pattern: /電動シャッター|電動シヤッター|electric\s*shutter|シャッターゲート/i,
    category: "大樓公設",
    nameZh: "電動鐵捲門",
  },
  {
    pattern: /電動自転車|電動アシスト/i,
    category: "大樓公設",
    nameZh: "電動自行車充電位",
  },
  {
    pattern: /アクセントクロス|アクセントウォール|accent\s*(?:cloth|wall)/i,
    category: "室內舒適",
    nameZh: "特色壁紙牆面",
  },
  {
    pattern: /シューズインクローク|シューズクローク|SIC/i,
    category: "室內舒適",
    nameZh: "玄關收納間",
    highlight: true,
  },
  {
    pattern: /パントリー|pantry/i,
    category: "廚房烹飪",
    nameZh: "廚房儲藏室",
  },
  {
    pattern: /床下点検口|小屋裏収納/i,
    category: "室內舒適",
    nameZh: "閣樓／地板下收納",
  },
];

/**
 * 萬能日文設備詞素退行中文化轉換器
 * 確保若有任何罕見或複合型日文設備詞彙未被主要規則完全涵蓋，絕不直接洩漏日文片假名／平假名至使用者畫面
 */
function translateJapaneseEquipmentFallback(raw: string): {
  nameZh: string;
  category: ParsedEquipmentItem["category"];
  highlight?: boolean;
} {
  let translated = raw;
  const dictionary: Array<[RegExp, string]> = [
    [/対面(?:式)?(?:システム)?キッチン|カウンターキッチン|アイランドキッチン|オープンキッチン/gi, "開放式中島／吧檯廚房"],
    [/ダウンライト(?:設置)?|LEDダウンライト/gi, "天花板嵌燈"],
    [/二重天井/gi, "雙層降噪天花板"],
    [/二重床/gi, "雙層防音地板"],
    [/二重(?:サッシ|窓)|複層ガラス|ペアガラス/gi, "雙層隔音氣密窗"],
    [/食器洗い乾燥機|食器洗浄乾燥機|食器洗浄機|食洗機/gi, "自動洗碗機"],
    [/ディスポーザー/gi, "廚下生鮮鐵胃粉碎機"],
    [/システムキッチン/gi, "系統廚房"],
    [/ユニットバス(?:新規)?(?:交換)?|システムバス/gi, "整體衛浴設備更新"],
    [/給湯器(?:新規)?(?:交換)?/gi, "瓦斯熱水器更新"],
    [/給湯(?:設備)?/gi, "熱水設備"],
    [/追い焚き(?:機能)?|追焚き?/gi, "自動追焚保溫浴缸"],
    [/浴室換気乾燥機|浴室乾燥機?/gi, "浴室暖風乾燥機"],
    [/温水洗浄便座|ウォシュレット|シャワートイレ/gi, "免治馬桶"],
    [/独立洗面台|洗面化粧台/gi, "獨立洗面化妝台"],
    [/室内洗濯機置場|洗濯機置場/gi, "室內洗衣機置場"],
    [/フローリング(?:張替|貼替)?/gi, "木質地板"],
    [/壁[、\s]*天井クロス(?:貼替|張替)|クロス(?:貼替|張替)|壁紙(?:貼替|張替)/gi, "壁紙天花板更新"],
    [/建具(?:交換|新調)|室内ドア交換/gi, "室內房門建具更新"],
    [/クローゼット/gi, "收納衣櫃"],
    [/シューズボックス|下駄箱|SIC/gi, "收納鞋櫃"],
    [/ウォークインクローゼット|WIC/gi, "步入式衣帽間"],
    [/トランクルーム/gi, "個人儲藏室"],
    [/オートロック/gi, "防盜自動門鎖"],
    [/エレベータ[ー]?|EV/gi, "大樓電梯"],
    [/宅配ボックス|宅配BOX|宅配ロッカー/gi, "宅配箱"],
    [/エアコン(?:設置|新規設置)?/gi, "冷暖空調"],
    [/インターホン/gi, "室內對講機"],
    [/防犯カメラ/gi, "防盜監視攝影機"],
    [/バルコニー/gi, "專用陽台"],
    [/駐輪場/gi, "自行車停放處"],
    [/駐車場/gi, "汽車停車場"],
    [/バイク置場/gi, "機車停放處"],
    [/都市ガス/gi, "天然都市瓦斯"],
    [/プロパンガス|LPガス/gi, "LP 桶裝瓦斯"],
    [/床暖房/gi, "地暖設備"],
    [/大規模修繕(?:工事)?(?:実施|済)?/gi, "已完成大樓大規模修繕"],
    [/免震(?:構造)?/gi, "頂級免震結構"],
    [/制震(?:構造)?/gi, "制震結構"],
    [/新耐震(?:基準|構造|結構)?/gi, "新耐震結構"],
    [/(?<!新)耐震(?:構造|結構)/gi, "耐震結構"],
    [/耐火構造/gi, "耐火結構"],
    [/パントリー|食品庫/gi, "廚房儲藏空間（Pantry）"],
    [/リネン庫|リネン棚/gi, "衛浴毛巾備品收納櫃"],
    [/ルーフバルコニー/gi, "頂樓景觀露台"],
    [/専用庭/gi, "私人戶外花園庭院"],
    [/テラス/gi, "私人休閒露台"],
    [/人感センサー(?:付(?:照明)?)?/gi, "玄關自動感應照明"],
    [/EV充電(?:設備)?/gi, "電動車 EV 充電設備"],
    [/車寄せ/gi, "大樓迎賓車道"],
    [/防災(?:備蓄)?倉庫/gi, "大樓防災備蓄倉庫"],
    [/24時間(?:セキュリティ|警備)/gi, "24 小時安全警備系統"],
    [/24時間ゴミ出し/gi, "24H 垃圾集中場"],
    [/タイル/gi, "飾面磁磚"],
    [/サッシ/gi, "氣密窗"],
    [/ガラス/gi, "玻璃"],
    [/シャワー/gi, "淋浴花灑"],
    [/サウナ/gi, "桑拿浴室"],
    [/貼替|張替/gi, "換新"],
    [/交換/gi, "更新"],
    [/設置|新設/gi, "裝設"],
    [/済|済み/gi, "已完成"],
    [/完備|付き|付/gi, "配備"],
];

  for (const [pattern, replacement] of dictionary) {
    translated = translated.replace(pattern, replacement);
  }

  // 乾淨剔除日文假名殘留
  translated = translated.replace(/[（(].*?[）)]/g, "").replace(/[\u3040-\u30ff]/g, "").trim();

  const isHighlight = /分離|免治|暖風|追焚|電梯|宅配|防盜|門禁|衣帽間|中島|洗碗|地暖|免震|制震|大規模修繕|雙層降噪天花板/i.test(translated);

  const category: ParsedEquipmentItem["category"] =
    /廚|瓦斯|爐|洗碗|中島|吧檯|粉碎/i.test(translated) ? "廚房烹飪"
    : /浴|便座|馬桶|水|洗面|衛|熱水/i.test(translated) ? "衛浴水洗"
    : /鎖|門禁|監控|防盜|保全|對講/i.test(translated) ? "門禁安全"
    : /電梯|梯|公設|車|垃圾|大樓|修繕|防災/i.test(translated) ? "大樓公設"
    : /空調|冷氣|地暖|地板|天花板|採光|衣櫃|收納|露台|庭|窗|嵌燈|門/i.test(translated) ? "室內舒適"
    : "其他設備";

  return {
    nameZh: translated || raw,
    category,
    highlight: isHighlight,
  };
}

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
      // 這些詞單獨出現時只是修飾語，不是設備本身（實測圖面切出過孤立的「電動」）。
      if (/^(?:バス有|風呂有|トイレ有|エアコン有|有|完備|付)$/i.test(token)) {
        continue;
      }
      if (/^(?:電動|自動|新規|交換|更新|設置|新設|無料|専用|付き|あり|済|込|式|型|中|各|全)$/i.test(token)) {
        continue;
      }
      const fallback = translateJapaneseEquipmentFallback(token);
      if (!seenKeys.has(fallback.nameZh)) {
        seenKeys.add(fallback.nameZh);
        results.push({
          key: fallback.nameZh,
          category: fallback.category,
          nameZh: fallback.nameZh,
          rawJa: token,
          highlight: fallback.highlight,
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

/**
 * 將日本不動產圖紙上的裝修/翻新內容（リフォーム／リノベーション履歷）翻譯為繁體中文
 */
export function translateRenovationDetails(raw: unknown): string {
  if (typeof raw !== "string" || !raw.trim()) return "";
  let text = raw.trim();

  // 1. 日式和曆轉換為西元（或附註西元）
  text = text.replace(/令和\s*(\d+)年/g, (_, p1) => {
    const western = 2018 + parseInt(p1, 10);
    return `${western}年（令和${p1}年）`;
  });
  text = text.replace(/平成\s*(\d+)年/g, (_, p1) => {
    const western = 1988 + parseInt(p1, 10);
    return `${western}年（平成${p1}年）`;
  });
  text = text.replace(/昭和\s*(\d+)年/g, (_, p1) => {
    const western = 1925 + parseInt(p1, 10);
    return `${western}年（昭和${p1}年）`;
  });

  // 2. 裝修與工程名詞替換對照表（長詞在前，短詞在後）
  const dict: Array<[RegExp, string]> = [
    [/リフォーム内容|リノベーション内容/gi, "翻新內容"],
    [/フルリノベーション|フルリフォーム/gi, "全室整體翻新"],
    [/リフォーム|リノベーション/gi, "室內裝修翻新"],
    [/フローリング(?:張替|貼替)/gi, "更換木質地板"],
    [/フローリング/gi, "木質地板"],
    [/壁[・、\s]*天井クロス(?:貼替|張替)/gi, "壁紙與天花板壁紙更新"],
    [/クロス(?:貼替|張替)/gi, "壁紙更新"],
    [/ユニットバス(?:新規)?(?:交換)?|システムバス(?:新規)?(?:交換)?/gi, "整體衛浴設備更新"],
    [/システムキッチン(?:新規)?(?:交換)?|キッチン(?:新規)?(?:交換)?/gi, "系統廚房更換"],
    [/洗面化粧台(?:新規)?(?:交換)?|洗面台(?:新規)?(?:交換)?/gi, "獨立化妝盥洗台更新"],
    [/給湯器(?:新規)?(?:交換)?/gi, "瓦斯熱水器更換"],
    [/ダウンライト(?:新規)?(?:設置|取付)?/gi, "天花板嵌燈裝設"],
    [/エアコン(?:新規)?(?:設置|取付)?/gi, "冷暖空調安裝"],
    [/温水洗浄便座(?:新規)?(?:交換)?|ウォシュレット(?:新規)?(?:交換)?|トイレ(?:新規)?(?:交換)?/gi, "免治馬桶衛浴更新"],
    [/建具(?:新規)?(?:交換|新調)/gi, "室內門扇更換"],
    [/給排水管(?:新規)?(?:交換|更新)/gi, "更換給排水管路"],
    [/ガスコンロ(?:新規)?(?:交換)?|コンロ(?:新規)?(?:交換)?/gi, "瓦斯爐更換"],
    [/食器洗い乾燥機(?:新規)?(?:設置|交換)?|食洗機(?:新規)?(?:設置|交換)?/gi, "自動洗碗機裝設"],
    [/浴室換気乾燥暖房機(?:新規)?(?:設置|交換)?|浴室乾燥機(?:新規)?(?:設置|交換)?/gi, "浴室暖風乾燥機安裝"],
    [/ハウスクリーニング(?:実施)?|ルームクリーニング(?:実施)?/gi, "室內專業深度清潔"],
    [/畳(?:表替|張替)/gi, "榻榻米更換席面"],
    [/障子(?:貼替|張替)|襖(?:張替|貼替)/gi, "日式拉門紙張更新"],
    [/網戸(?:張替|貼替)/gi, "更換紗窗紗網"],
    [/大規模修繕工事(?:実施)?/gi, "大樓大規模修繕工程實施"],
    [/(?<!大樓)大規模修繕(?!工程)/gi, "大樓大規模修繕"],
    [/外壁塗装/gi, "外牆塗裝防水工程"],
    [/屋上防水/gi, "頂樓防水工程"],
    [/鉄部塗装/gi, "鐵件防鏽塗裝"],
    [/新規交換/gi, "全新更換"],
    [/新規設置|新規取付/gi, "全新裝設"],
    [/新規/gi, "全新"],
    [/交換/gi, "更換"],
    [/張替|貼替/gi, "更換更新"],
    [/設置/gi, "裝設"],
    [/実施/gi, "實施"],
    [/完了/gi, "完工"],
    [/済/gi, "完成"],
    [/工事/gi, "工程"],
  ];

  for (const [re, rep] of dict) {
    text = text.replace(re, rep);
  }

  // 清除殘留日文假名（若有孤立假名）
  text = text.replace(/[\u3040-\u30ff]+/g, "");

  return text;
}

/**
 * 將日本不動產圖紙現況（引渡條件）翻譯為繁體中文
 */
export function translateOccupancyStatus(raw: unknown): string {
  if (typeof raw !== "string" || !raw.trim()) return "";
  const s = raw.trim();
  if (/居住中.*(?:相談|引渡)/.test(s) || /相談.*居住中/.test(s)) return "現有屋主居住中（交屋期需協商）";
  if (/居住中/.test(s)) return "現有屋主居住中";
  if (/賃貸中|オーナーチェンジ/.test(s)) return "出租中（帶租約買賣）";
  if (/空室|空家|空き家/.test(s)) return "現況空室（可即刻交屋）";
  if (/即時|即時引渡|即入居/.test(s)) return "可即刻交屋入住";
  if (/相談|引渡相談|期日相談/.test(s)) return "交屋期需協商";
  return s;
}
