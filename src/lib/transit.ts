import { districtStations } from "../data/housingMarket.js";
import stationCodeOverrides from "../data/stationCodeOverrides.json" with { type: "json" };
import type { RentRecommendation, RentSearchCriteria } from "./rentAnalysis.js";
import * as OpenCC from "opencc-js";

const openccConverter = typeof OpenCC?.Converter === "function"
  ? OpenCC.Converter({ from: "cn", to: "jp" })
  : null;

/** 駅ナンバリング的補充資料：由 scripts/fill-station-codes.mjs 以 Google Search 查證後產生，
 * 涵蓋 GTFS feed 沒有填 stop_code、但實際有官方編號的車站。索引鍵是 GTFS 原始路線名稱，
 * 涵蓋許多在 TRANSIT_LINES 沒有對應識別的地方線，所以獨立於 line identity 查表。 */
const STATION_CODE_OVERRIDES = (stationCodeOverrides as { lines?: Record<string, Record<string, string>> }).lines || {};

export interface TransitLineIdentity {
  id: string;
  name: string;
  shortCode: string;
  color: string;
  textColor: "#FFFFFF" | "#1A2A22";
  operator: string;
}

export interface CommuteDiagramData {
  originStation: string;
  destinationStation: string;
  direct: boolean;
  line: TransitLineIdentity | null;
  originStationCode: string | null;
  destinationStationCode: string | null;
  estimatedDurationMinutes: number;
}

// Railway operator identity colors. Unknown lines intentionally stay neutral in the UI
// instead of receiving an invented color.
const TRANSIT_LINES: Array<TransitLineIdentity & { patterns: RegExp[] }> = [
  { id: "keio-inokashira", name: "京王井の頭線", shortCode: "IN", color: "#000088", textColor: "#FFFFFF", operator: "京王電鉄", patterns: [/京王?井[之の]頭線/] },
  { id: "keio", name: "京王線", shortCode: "KO", color: "#DD0077", textColor: "#FFFFFF", operator: "京王電鉄", patterns: [/京王(?:新線|線)/] },
  { id: "metro-ginza", name: "東京メトロ銀座線", shortCode: "G", color: "#F39700", textColor: "#1A2A22", operator: "東京メトロ", patterns: [/銀座線/] },
  { id: "metro-marunouchi", name: "東京メトロ丸ノ内線", shortCode: "M", color: "#E60012", textColor: "#FFFFFF", operator: "東京メトロ", patterns: [/丸(?:之內|ノ内)線/] },
  { id: "metro-hibiya", name: "東京メトロ日比谷線", shortCode: "H", color: "#9CAEB7", textColor: "#1A2A22", operator: "東京メトロ", patterns: [/日比谷線/] },
  { id: "metro-tozai", name: "東京メトロ東西線", shortCode: "T", color: "#00A7DB", textColor: "#FFFFFF", operator: "東京メトロ", patterns: [/東西線/] },
  { id: "metro-chiyoda", name: "東京メトロ千代田線", shortCode: "C", color: "#009944", textColor: "#FFFFFF", operator: "東京メトロ", patterns: [/千代田線/] },
  { id: "metro-yurakucho", name: "東京メトロ有楽町線", shortCode: "Y", color: "#D7C447", textColor: "#1A2A22", operator: "東京メトロ", patterns: [/有[樂楽]町線/] },
  { id: "metro-hanzomon", name: "東京メトロ半蔵門線", shortCode: "Z", color: "#9B7CB6", textColor: "#FFFFFF", operator: "東京メトロ", patterns: [/半[藏蔵]門線/] },
  { id: "sapporo-subway-namboku", name: "札幌市営地下鉄南北線", shortCode: "N", color: "#008F68", textColor: "#FFFFFF", operator: "札幌市交通局", patterns: [/札幌(?:市営)?(?:地下鉄)?南北線/] },
  { id: "sendai-subway-namboku", name: "仙台市地下鉄南北線", shortCode: "N", color: "#00A651", textColor: "#FFFFFF", operator: "仙台市交通局", patterns: [/仙台(?:市)?(?:地下鉄)?南北線/] },
  { id: "metro-namboku", name: "東京メトロ南北線", shortCode: "N", color: "#00ADA9", textColor: "#FFFFFF", operator: "東京メトロ", patterns: [/東京メトロ南北線|東京地下鉄南北線|^南北線$/] },
  { id: "metro-fukutoshin", name: "東京メトロ副都心線", shortCode: "F", color: "#BB641D", textColor: "#FFFFFF", operator: "東京メトロ", patterns: [/副都心線/] },
  { id: "toei-asakusa", name: "都営浅草線", shortCode: "A", color: "#E85298", textColor: "#FFFFFF", operator: "東京都交通局", patterns: [/[淺浅]草線/] },
  { id: "toei-mita", name: "都営三田線", shortCode: "I", color: "#0079C2", textColor: "#FFFFFF", operator: "東京都交通局", patterns: [/三田線/] },
  { id: "toei-shinjuku", name: "都営新宿線", shortCode: "S", color: "#6CBB5A", textColor: "#1A2A22", operator: "東京都交通局", patterns: [/都[營営]新宿線|^新宿線$/] },
  { id: "toei-oedo", name: "都営大江戸線", shortCode: "E", color: "#B6007A", textColor: "#FFFFFF", operator: "東京都交通局", patterns: [/大江[戶戸]線/] },
  { id: "jr-shonan-shinjuku", name: "JR 湘南新宿ライン", shortCode: "JS", color: "#E60012", textColor: "#FFFFFF", operator: "JR 東日本", patterns: [/JR?湘南新宿/]} ,
  { id: "jr-yamanote", name: "JR 山手線", shortCode: "JY", color: "#9ACD32", textColor: "#1A2A22", operator: "JR 東日本", patterns: [/JR?山手線/] },
  { id: "jr-chuo-rapid", name: "JR 中央線快速", shortCode: "JC", color: "#F15A22", textColor: "#FFFFFF", operator: "JR 東日本", patterns: [/JR?中央線(?!.*總武)/] },
  { id: "jr-chuo-sobu", name: "JR 中央・総武線", shortCode: "JB", color: "#FFD400", textColor: "#1A2A22", operator: "JR 東日本", patterns: [/JR?(?:中央)?[總総]武線|JR中央[總総]武線/] },
  { id: "jr-keihin", name: "JR 京浜東北線", shortCode: "JK", color: "#00B2E5", textColor: "#1A2A22", operator: "JR 東日本", patterns: [/JR?京[濱浜]東北線/] },
  { id: "jr-yokosuka", name: "JR 横須賀線", shortCode: "JO", color: "#0072BC", textColor: "#FFFFFF", operator: "JR 東日本", patterns: [/JR?橫須賀線|JR?横須賀線/] },
  { id: "jr-nambu", name: "JR 南武線", shortCode: "JN", color: "#FFD400", textColor: "#1A2A22", operator: "JR 東日本", patterns: [/JR?南武線/] },
  { id: "jr-yokohama", name: "JR 横浜線", shortCode: "JH", color: "#00A84D", textColor: "#FFFFFF", operator: "JR 東日本", patterns: [/JR?[橫橫]濱線|JR?横浜線/] },
  { id: "jr-saikyo", name: "JR 埼京線", shortCode: "JA", color: "#00AC9A", textColor: "#FFFFFF", operator: "JR 東日本", patterns: [/JR?埼京線/] },
  { id: "jr-keiyo", name: "JR 京葉線", shortCode: "JE", color: "#C9242F", textColor: "#FFFFFF", operator: "JR 東日本", patterns: [/JR?京葉線/] },
  { id: "tokyu-toyoko", name: "東急東横線", shortCode: "TY", color: "#DA0442", textColor: "#FFFFFF", operator: "東急電鉄", patterns: [/東急東[橫横]線/] },
  { id: "tokyu-denentoshi", name: "東急田園都市線", shortCode: "DT", color: "#00A84D", textColor: "#FFFFFF", operator: "東急電鉄", patterns: [/東急田園都市線/] },
  { id: "tokyu-meguro", name: "東急目黒線", shortCode: "MG", color: "#009CD2", textColor: "#FFFFFF", operator: "東急電鉄", patterns: [/東急目[黑黒]線/] },
  { id: "tokyu-oimachi", name: "東急大井町線", shortCode: "OM", color: "#F18C43", textColor: "#1A2A22", operator: "東急電鉄", patterns: [/東急大井町線/] },
  { id: "tokyu-shin-yokohama", name: "東急新横浜線", shortCode: "SH", color: "#5D639E", textColor: "#FFFFFF", operator: "東急電鉄", patterns: [/東急新[橫横]濱線|東急新横浜線/] },
  { id: "minatomirai", name: "みなとみらい線", shortCode: "MM", color: "#006BB6", textColor: "#FFFFFF", operator: "横浜高速鉄道", patterns: [/港未來線|みなとみらい線/] },
  { id: "yokohama-subway-green", name: "横浜市営地下鉄グリーンライン", shortCode: "G", color: "#00B06B", textColor: "#FFFFFF", operator: "横浜市交通局", patterns: [/綠線|グリーンライン/] },
  { id: "yokohama-subway-blue", name: "横浜市営地下鉄ブルーライン", shortCode: "B", color: "#0067B1", textColor: "#FFFFFF", operator: "横浜市交通局", patterns: [/藍線|ブルーライン/] },
  { id: "yokohama-subway", name: "横浜市営地下鉄", shortCode: "", color: "#0067B1", textColor: "#FFFFFF", operator: "横浜市交通局", patterns: [/[橫横][濱浜](?:市營|市営)?地(?:下)?[鐵鉄]/] },
  { id: "sotetsu", name: "相鉄線", shortCode: "SO", color: "#0066B3", textColor: "#FFFFFF", operator: "相模鉄道", patterns: [/相[鐵鉄]線/] },
  { id: "odakyu-odawara", name: "小田急小田原線", shortCode: "OH", color: "#2288CC", textColor: "#FFFFFF", operator: "小田急電鉄", patterns: [/小田急(?:小田原線)?/] },
  { id: "seibu-shinjuku", name: "西武新宿線", shortCode: "SS", color: "#00A6BF", textColor: "#FFFFFF", operator: "西武鉄道", patterns: [/西武新宿線/] },
  { id: "seibu-ikebukuro", name: "西武池袋線", shortCode: "SI", color: "#F58220", textColor: "#1A2A22", operator: "西武鉄道", patterns: [/西武池袋線/] },
  { id: "keikyu", name: "京急本線", shortCode: "KK", color: "#00BFFF", textColor: "#1A2A22", operator: "京浜急行電鉄", patterns: [/京急(?:本線|線)/] },
  { id: "rinkai", name: "りんかい線", shortCode: "R", color: "#00A7E3", textColor: "#FFFFFF", operator: "東京臨海高速鉄道", patterns: [/臨海線/] },
  { id: "tsukuba-express", name: "つくばエクスプレス", shortCode: "TX", color: "#0017C4", textColor: "#FFFFFF", operator: "首都圏新都市鉄道", patterns: [/筑波快線/] }
];

const INOKASHIRA_STATION_CODES: Record<string, string> = {
  "澀谷": "IN01", "神泉": "IN02", "駒場東大前": "IN03", "池之上": "IN04",
  "下北澤": "IN05", "新代田": "IN06", "東松原": "IN07", "明大前": "IN08",
  "永福町": "IN09", "西永福": "IN10", "濱田山": "IN11", "高井戶": "IN12",
  "富士見丘": "IN13", "久我山": "IN14", "三鷹台": "IN15", "井之頭公園": "IN16",
  "吉祥寺": "IN17"
};

const STATION_CODES: Record<string, Record<string, string>> = {
  "keio-inokashira": { ...INOKASHIRA_STATION_CODES, "澀谷": "IN01", "渋谷": "IN01", "下北澤": "IN05", "下北沢": "IN05", "吉祥寺": "IN17" },
  "jr-shonan-shinjuku": { "武藏小杉": "JS15", "武蔵小杉": "JS15", "大崎": "JS17", "惠比壽": "JS18", "恵比寿": "JS18", "澀谷": "JS19", "渋谷": "JS19", "新宿": "JS20", "池袋": "JS21" },
  "jr-yamanote": { "東京": "JY01", "秋葉原": "JY03", "上野": "JY05", "日暮里": "JY07", "田端": "JY09", "池袋": "JY13", "新宿": "JY17", "代代木": "JY18", "原宿": "JY19", "澀谷": "JY20", "渋谷": "JY20", "惠比壽": "JY21", "恵比寿": "JY21", "目黑": "JY22", "目黒": "JY22", "五反田": "JY23", "大崎": "JY24", "品川": "JY25", "田町": "JY27", "濱松町": "JY28", "新橋": "JY29", "有樂町": "JY30" },
  "metro-ginza": { "澀谷": "G01", "渋谷": "G01", "表參道": "G02", "青山一丁目": "G04", "赤坂見附": "G05", "銀座": "G09", "新橋": "G08", "日本橋": "G11", "神田": "G13", "上野": "G16", "淺草": "G19" },
  "metro-hibiya": { "中目黑": "H01", "中目黒": "H01", "惠比壽": "H02", "恵比寿": "H02", "廣尾": "H03", "広尾": "H03", "六本木": "H04", "神谷町": "H05", "虎之門": "H06", "霞關": "H07", "日比谷": "H08", "銀座": "H09", "秋葉原": "H16", "上野": "H18", "北千住": "H22" },
  "metro-hanzomon": { "澀谷": "Z01", "渋谷": "Z01", "表參道": "Z02", "青山一丁目": "Z03", "永田町": "Z04", "半藏門": "Z05", "九段下": "Z06", "神保町": "Z07", "大手町": "Z08", "清澄白河": "Z11", "錦糸町": "Z13", "押上": "Z14" },
  "metro-fukutoshin": { "澀谷": "F16", "渋谷": "F16", "明治神宮前": "F15", "北參道": "F14", "新宿三丁目": "F13", "池袋": "F09", "要町": "F08", "千川": "F07" },
  "tokyu-toyoko": { "澀谷": "TY01", "渋谷": "TY01", "代官山": "TY02", "中目黑": "TY03", "中目黒": "TY03", "祐天寺": "TY04", "學藝大學": "TY05", "学芸大学": "TY05", "都立大學": "TY06", "都立大学": "TY06", "自由之丘": "TY07", "自由が丘": "TY07", "田園調布": "TY08", "多摩川": "TY09", "新丸子": "TY10", "武藏小杉": "TY11", "武蔵小杉": "TY11", "元住吉": "TY12", "日吉": "TY13" },
  "tokyu-denentoshi": { "澀谷": "DT01", "渋谷": "DT01", "池尻大橋": "DT02", "三軒茶屋": "DT03", "櫻新町": "DT05", "二子玉川": "DT07" }
};

export const JAPANESE_STATION_NAMES: Record<string, string> = {
  "市谷": "市ケ谷", "四谷": "四ツ谷", "勝鬨": "勝どき", "虎之門之丘": "虎ノ門ヒルズ",
  "日出": "日の出", "寶町": "宝町", "幡谷": "幡ヶ谷", "參宮橋": "参宮橋",
  "押上 (晴空塔前)": "押上", "東京晴空塔": "とうきょうスカイツリー", "东京晴空塔": "とうきょうスカイツリー",
  "晴空塔": "とうきょうスカイツリー", "天空树": "とうきょうスカイツリー", "スカイツリー": "とうきょうスカイツリー",
  "東京鐵塔": "赤羽橋", "东京铁塔": "赤羽橋",
  "六本木之丘": "六本木", "六本木新城": "六本木", "六本木ヒルズ": "六本木", "六本木Hills": "六本木",
  "環球影城": "ユニバーサルシティ", "环球影城": "ユニバーサルシティ", "日本環球影城": "ユニバーサルシティ",
  "迪士尼": "舞浜", "迪士尼樂園": "舞浜", "迪士尼乐园": "舞浜",
  "台場": "お台場海浜公園", "台场": "お台場海浜公園",
  "羽田機場": "羽田空港第1・第2ターミナル", "羽田机场": "羽田空港第1・第2ターミナル",
  "羽田機場第1・第2航廈": "羽田空港第1・第2ターミナル", "羽田机场第1・第2航站楼": "羽田空港第1・第2ターミナル",
  "成田機場": "成田空港", "成田机场": "成田空港",
  "關西機場": "関西空港", "关西机场": "関西空港",
  "豪德寺": "豪徳寺",
  "千歲烏山": "千歳烏山", "宮之坂": "宮の坂", "鷺之宮": "鷺ノ宮",
  "三鷹 (北口)": "三鷹", "三鷹 (南口)": "三鷹", "多摩中心": "多摩センター",
  "港未來": "みなとみらい", "日本大通": "日本大通り", "市尾": "市が尾",
  "藤之丘": "藤が丘", "兒童之國": "こどもの国", "片瀨江之島": "片瀬江ノ島",
  "柏之葉校園": "柏の葉キャンパス", "流山大鷹之森": "流山おおたかの森",
  "越谷Laketown": "越谷レイクタウン", "鐵道博物館": "鉄道博物館",
  "表參道": "表参道", "北參道": "北参道", "天王洲島": "天王洲アイル",
  "西巢鴨": "西巣鴨", "阿佐谷": "阿佐ケ谷", "光丘": "光が丘",
  "竹之塚": "竹ノ塚", "舍人公園": "舎人公園", "四木": "四ツ木",
  "杜鵑丘": "つつじヶ丘", "鷹之台": "鷹の台", "聖蹟櫻丘": "聖蹟桜ヶ丘",
  "三澤上町": "三ツ沢上町", "溝之口": "溝の口", "武藏溝之口": "武蔵溝ノ口",
  "梶谷": "梶が谷", "六會日大前": "六会日大前", "由比濱": "由比ヶ浜",
  "八千代綠丘": "八千代緑が丘", "鰭崎": "鰭ヶ崎",
  "吹田 (JR)": "吹田", "八尾 (JR)": "八尾", "勾當台公園": "勾当台公園",
  "榮": "栄", "四條": "四条", "二條": "二条", "姪濱": "姪浜",
  "御茶之水": "御茶ノ水", "澀谷": "渋谷", "涉谷": "渋谷", "橫濱": "横浜", "惠比壽": "恵比寿", "代代木": "代々木",
  "代代木上原": "代々木上原", "代代木八幡": "代々木八幡", "千駄谷": "千駄ケ谷",
  "廣尾": "広尾", "自由之丘": "自由が丘", "綠丘": "緑が丘", "井之頭公園": "井の頭公園",
  "池之上": "池ノ上", "下北澤": "下北沢", "濱田山": "浜田山", "富士見丘": "富士見ヶ丘",
  "高井戶": "高井戸", "蘆花公園": "芦花公園", "櫻新町": "桜新町", "經堂": "経堂",
  "有樂町": "有楽町", "櫻田門": "桜田門", "麴町": "麹町", "霞關": "霞ケ関",
  "神樂坂": "神楽坂", "牛込神樂坂": "牛込神楽坂", "後樂園": "後楽園", "本鄉三丁目": "本郷三丁目",
  "淺草": "浅草", "淺草橋": "浅草橋", "藏前": "蔵前", "三之輪": "三ノ輪", "稻荷町": "稲荷町",
  "龜戶": "亀戸", "兩國": "両国", "鐘淵": "鐘ヶ淵", "八廣": "八広", "戶越": "戸越",
  "戶越銀座": "戸越銀座", "青物橫丁": "青物横丁", "雜色": "雑色", "雪谷大塚": "雪が谷大塚",
  "御徒町": "御徒町", "鶯谷": "鶯谷", "町屋": "町屋", "巢鴨": "巣鴨", "駒込": "駒込"
};

const normalize = (value: string) => value
  .replace(/涉谷|渋谷/g, "澀谷")
  .replace(/井の頭/g, "井之頭")
  .replace(/浜/g, "濱")
  .replace(/恵/g, "惠")
  .replace(/蔵/g, "藏")
  .replace(/黒/g, "黑")
  .replace(/沢/g, "澤")
  .replace(/広/g, "廣")
  .replace(/駅|站|各停|快速|急行|特急|通勤/g, "")
  .replace(/[\s・･（）()\-/／]/g, "");

export function toJapaneseStationName(value: string) {
  const cleaned = value
    .replace(/[『』「」《》〈〉【】]/g, "")
    .replace(/\s*(?:車站|车站|站|駅)\s*$/, "")
    .trim();
  if (JAPANESE_STATION_NAMES[cleaned]) return JAPANESE_STATION_NAMES[cleaned];
  const converted = toJapanesePlaceName(cleaned);
  if (JAPANESE_STATION_NAMES[converted]) return JAPANESE_STATION_NAMES[converted];
  return converted;
}

/**
 * 將中文地名、站名、門牌（全面支援繁體字、簡體字）轉換為日本官方地圖與鐵道所使用的日文漢字（新字體）。
 * 涵蓋全日本 47 都道府縣、1,700+ 市町村與所有鐵道線路常用之偏旁部首與異體字。
 */
export function toJapanesePlaceName(value: string) {
  const base = openccConverter ? openccConverter(value) : value;
  return base
    .replace(/[澀涉涩渉]/g, "渋")
    // 車部、車字旁
    .replace(/[車车]/g, "車").replace(/[軒轩]/g, "軒").replace(/[軽轻]/g, "軽")
    .replace(/[輪轮]/g, "輪").replace(/[輛辆]/g, "両").replace(/[軸轴]/g, "軸")
    .replace(/[載载]/g, "載").replace(/[輻辐]/g, "輻").replace(/[輸输]/g, "輸")
    // 金部、金字旁
    .replace(/[鐵铁]/g, "鉄").replace(/[銀银]/g, "銀").replace(/[鋼钢]/g, "鋼")
    .replace(/[錦锦]/g, "錦").replace(/[釧钏]/g, "釧").replace(/[銭钱]/g, "銭")
    .replace(/[鈴铃]/g, "鈴").replace(/[銅铜]/g, "銅").replace(/[鋁铝]/g, "鋁")
    .replace(/[鉛铅]/g, "鉛").replace(/[鍋锅]/g, "鍋").replace(/[鎖锁]/g, "鎖")
    .replace(/[鍵钥]/g, "鍵").replace(/[錨锚]/g, "錨").replace(/[鏡镜]/g, "鏡")
    .replace(/[鐘钟]/g, "鐘").replace(/[鋳铸]/g, "鋳").replace(/[針针]/g, "針")
    .replace(/[釘钉]/g, "釘").replace(/[釣钓]/g, "釣").replace(/[鈍钝]/g, "鈍")
    .replace(/[鋒锋]/g, "鋒").replace(/[鎮镇]/g, "鎮").replace(/[鉤钩]/g, "鉤")
    .replace(/[鎌镰]/g, "鎌").replace(/[錯错]/g, "錯").replace(/[鍛锻]/g, "鍛")
    // 糸部、絞絲旁
    .replace(/[線线]/g, "線").replace(/[経经]/g, "経").replace(/[縄绳]/g, "縄")
    .replace(/[緑绿]/g, "緑").replace(/[網纲]/g, "綱").replace(/[綾绫]/g, "綾")
    .replace(/[編编]/g, "編").replace(/[続续]/g, "続").replace(/[織织]/g, "織")
    .replace(/[総总]/g, "総").replace(/[統统]/g, "統").replace(/[練练]/g, "練")
    .replace(/[縮缩]/g, "縮").replace(/[縦纵]/g, "縦").replace(/[緒绪]/g, "緒")
    .replace(/[継继]/g, "継").replace(/[績绩]/g, "績").replace(/[緩缓]/g, "緩")
    .replace(/[締缔]/g, "締").replace(/[縁缘]/g, "縁").replace(/[縛缚]/g, "縛")
    .replace(/[縫缝]/g, "縫").replace(/[純纯]/g, "純").replace(/[納纳]/g, "納")
    .replace(/[級级]/g, "級").replace(/[紀纪]/g, "紀").replace(/[紅红]/g, "紅")
    .replace(/[紐纽]/g, "紐").replace(/[結结]/g, "結").replace(/[給给]/g, "給")
    .replace(/[絶绝]/g, "絶").replace(/[維维]/g, "維").replace(/[綿绵]/g, "綿")
    // 門部、門字旁
    .replace(/[門门]/g, "門").replace(/[間间]/g, "間").replace(/[開开]/g, "開")
    .replace(/[関關关]/g, "関").replace(/[閉闭]/g, "閉").replace(/[問问]/g, "問")
    .replace(/[閑闲]/g, "閑").replace(/[閘闸]/g, "閘").replace(/[閣阁]/g, "閣")
    .replace(/[閲阅]/g, "閲").replace(/[闊阔]/g, "闊").replace(/[閃闪]/g, "閃")
    // 鳥部、鳥字旁
    .replace(/[鳥鸟]/g, "鳥").replace(/[鷹鹰]/g, "鷹").replace(/[鶴鹤]/g, "鶴")
    .replace(/[鴨鸭]/g, "鴨").replace(/[鴻鸿]/g, "鴻").replace(/[鳩鸠]/g, "鳩")
    .replace(/[鵠鹄]/g, "鵠").replace(/[鶯莺]/g, "鶯").replace(/[鷺鹭]/g, "鷺")
    .replace(/[鷲鹫]/g, "鷲").replace(/[鳴鸣]/g, "鳴").replace(/[鴎鷗鸥]/g, "鴎")
    .replace(/[烏乌]/g, "烏").replace(/[鳶鸢]/g, "鳶").replace(/[鶏鸡]/g, "鶏")
    .replace(/[鵜鹈]/g, "鵜")
    // 頁部、頁字旁
    .replace(/[須须]/g, "須").replace(/[頂顶]/g, "頂").replace(/[順顺]/g, "順")
    .replace(/[領领]/g, "領").replace(/[頭头]/g, "頭").replace(/[額额]/g, "額")
    .replace(/[顔颜]/g, "顔").replace(/[題题]/g, "題").replace(/[顯显]/g, "顕")
    .replace(/[類类]/g, "類").replace(/[顧顾]/g, "顧").replace(/[預预]/g, "預")
    .replace(/[項项]/g, "項").replace(/[頼赖]/g, "頼").replace(/[頗颇]/g, "頗")
    // 地理・水・山・火・土・木
    .replace(/[澀涉涩]/g, "渋").replace(/[橫横]/g, "横").replace(/[濱滨]/g, "浜")
    .replace(/[澤泽沢]/g, "沢").replace(/[瀨瀬濑]/g, "瀬").replace(/[島岛]/g, "島")
    .replace(/[瀧滝泷]/g, "滝").replace(/[灘滩]/g, "灘").replace(/[磯矶]/g, "磯")
    .replace(/[灣湾]/g, "湾").replace(/[淺浅]/g, "浅").replace(/[淵渊]/g, "淵")
    .replace(/[湯汤]/g, "湯").replace(/[塩盐]/g, "塩").replace(/[溫温]/g, "温")
    .replace(/[熱热]/g, "熱").replace(/[窪洼]/g, "窪").replace(/[岡冈]/g, "岡")
    .replace(/[嶺岭]/g, "嶺").replace(/[峽峡]/g, "峡").replace(/[岩岩]/g, "岩")
    .replace(/[橋桥]/g, "橋").replace(/[葉叶]/g, "葉").replace(/[櫻樱桜]/g, "桜")
    .replace(/[松松]/g, "松").replace(/[柏柏]/g, "柏").replace(/[桐桐]/g, "桐")
    .replace(/[楓枫]/g, "楓").replace(/[柳柳]/g, "柳").replace(/[桂桂]/g, "桂")
    .replace(/[稻稲]/g, "稲").replace(/[蘆芦]/g, "芦").replace(/[莊庄]/g, "庄")
    .replace(/[樓楼]/g, "楼").replace(/[層层]/g, "層").replace(/[園园]/g, "園")
    // 建築・設施・行政
    .replace(/[縣県县]/g, "県").replace(/[區区]/g, "区").replace(/[廳庁厅]/g, "庁")
    .replace(/[處处]/g, "処").replace(/[館馆]/g, "館").replace(/[舖铺]/g, "舗")
    .replace(/[庫库]/g, "庫").replace(/[倉仓]/g, "倉").replace(/[場场]/g, "場")
    .replace(/[署署]/g, "署").replace(/[學学]/g, "学").replace(/[藝艺芸]/g, "芸")
    .replace(/[體体]/g, "体").replace(/[醫医]/g, "医").replace(/[檢检]/g, "検")
    .replace(/[郵邮]/g, "郵").replace(/[電电]/g, "電").replace(/[聯联]/g, "連")
    .replace(/[會会]/g, "会").replace(/[社社]/g, "社").replace(/[驛駅站]/g, "駅")
    .replace(/[國国]/g, "国").replace(/[內内]/g, "内").replace(/[市市]/g, "市")
    .replace(/[町町]/g, "町").replace(/[村村]/g, "村").replace(/[都都]/g, "都")
    .replace(/[府府]/g, "府").replace(/[街街]/g, "街").replace(/[道道]/g, "道")
    .replace(/[路路]/g, "路").replace(/[巷巷]/g, "巷").replace(/[弄弄]/g, "弄")
    // 方位・數目・狀態・人事
    .replace(/[東东]/g, "東").replace(/[西西]/g, "西").replace(/[南南]/g, "南")
    .replace(/[北北]/g, "北").replace(/[中中]/g, "中").replace(/[上上]/g, "上")
    .replace(/[下下]/g, "下").replace(/[陽阳]/g, "陽").replace(/[陰阴]/g, "陰")
    .replace(/[萬万]/g, "万").replace(/[兩两両]/g, "両").replace(/[圓圆円]/g, "円")
    .replace(/[雙双]/g, "双").replace(/[號号]/g, "号").replace(/[臺台]/g, "台")
    .replace(/[條条]/g, "条").replace(/[狀状]/g, "状").replace(/[壓压]/g, "圧")
    .replace(/[衛卫]/g, "衛").replace(/[興兴]/g, "興").replace(/[嚴严]/g, "厳")
    .replace(/[禮礼]/g, "礼").replace(/[實实]/g, "実").replace(/[寶宝]/g, "宝")
    .replace(/[氣气]/g, "気").replace(/[譽誉]/g, "誉").replace(/[穗穂]/g, "穂")
    .replace(/[營营]/g, "営").replace(/[權权]/g, "権").replace(/[觀观]/g, "観")
    .replace(/[機机]/g, "機").replace(/[飛飞]/g, "飛").replace(/[飯饭]/g, "飯")
    .replace(/[沖冲]/g, "沖").replace(/[愛爱]/g, "愛").replace(/[賀贺]/g, "賀")
    .replace(/[惠恵]/g, "恵").replace(/[壽寿]/g, "寿").replace(/[樂乐]/g, "楽")
    .replace(/[勝胜]/g, "勝").replace(/[馬马]/g, "馬").replace(/[龍龙竜]/g, "竜")
    .replace(/[龜龟亀]/g, "亀").replace(/[貝贝]/g, "貝").replace(/[魚鱼]/g, "魚")
    .replace(/[齒齿]/g, "歯").replace(/[齡龄]/g, "齢").replace(/[麥麦]/g, "麦")
    .replace(/[黃黄]/g, "黄").replace(/[齊齐]/g, "斉").replace(/[黑黒]/g, "黒")
    .replace(/[藥药]/g, "薬").replace(/[邊边]/g, "辺").replace(/[藏蔵]/g, "蔵")
    .replace(/[雜杂]/g, "雑").replace(/[德徳]/g, "徳").replace(/[豐丰]/g, "豊")
    .replace(/[靜静]/g, "静").replace(/[兒儿]/g, "児").replace(/[榮荣]/g, "栄")
    .replace(/[鄉乡]/g, "郷").replace(/[螢萤]/g, "蛍").replace(/[攝摄]/g, "摂")
    .replace(/[宮宫]/g, "宮").replace(/[塚冢]/g, "塚").replace(/[巣巢窝]/g, "巣")
    .replace(/[薩萨]/g, "薩").replace(/[霸霸]/g, "覇").replace(/[諫谏]/g, "諫")
    .replace(/[護护]/g, "護").replace(/[霧雾]/g, "霧").replace(/[脇胁]/g, "脇")
    .replace(/[戶户]/g, "戸").replace(/[埼琦]/g, "埼").replace(/[栃枥]/g, "栃")
    .replace(/[麴麯]/g, "麹").replace(/[別别]/g, "別");
}

export function toJapanesePrefectureName(value: string) {
  const name = toJapanesePlaceName(value);
  if (name === "東京都" || name === "北海道") return name;
  if (name === "大阪" || name === "京都") return `${name}府`;
  return /[都道府県]$/.test(name) ? name : `${name}県`;
}

export function getTransitLineIdentity(lineName: string): TransitLineIdentity | null {
  const normalized = normalize(lineName);
  const found = TRANSIT_LINES.find(line => line.patterns.some(pattern => pattern.test(normalized)));
  if (!found) return null;
  const { patterns: _patterns, ...identity } = found;
  return identity;
}

export function toJapaneseLineName(value: string) {
  const identity = getTransitLineIdentity(value);
  if (identity) return identity.name;
  return toJapanesePlaceName(value);
}

function getStationCode(line: TransitLineIdentity | null, stationName: string, rawLineName?: string) {
  if (!stationName) return null;
  const norm = normalize(stationName);
  const jpName = toJapaneseStationName(stationName);

  if (line && STATION_CODES[line.id]) {
    const code = STATION_CODES[line.id][norm] || STATION_CODES[line.id][jpName] || STATION_CODES[line.id][stationName];
    if (code) return code;
  }

  // 許多地方線（相鉄直通線、富山地方鉄道各線等）在 TRANSIT_LINES 沒有對應的 identity，
  // 只能直接用 GTFS 原始路線名稱去查外部補充表。
  if (rawLineName && STATION_CODE_OVERRIDES[rawLineName]) {
    const overrides = STATION_CODE_OVERRIDES[rawLineName];
    const code = overrides[stationName] || overrides[jpName] || overrides[norm];
    if (code) return code;
  }

  return null;
}

export function getStationCodeForLine(lineName: string, stationName: string) {
  return getStationCode(getTransitLineIdentity(lineName), stationName, lineName);
}

function findStation(name: string) {
  const wanted = normalize(name);
  return Object.values(districtStations).flat().find(station => {
    const candidate = normalize(station.name);
    return candidate === wanted || candidate.includes(wanted) || wanted.includes(candidate);
  });
}

const MINUTES_PER_STOP: Record<string, number> = {
  "jr-yamanote": 2.2,
  "jr-shonan-shinjuku": 3.8,
  "metro-ginza": 2,
  "metro-hibiya": 2.1,
  "metro-hanzomon": 2.1,
  "metro-fukutoshin": 2.2,
  "tokyu-toyoko": 2.3,
  "tokyu-denentoshi": 2.4,
  "keio-inokashira": 2.2
};

function stationNumber(code: string | null) {
  const value = code?.match(/(\d+)$/)?.[1];
  return value ? Number(value) : null;
}

function standardSegmentEstimate(line: TransitLineIdentity, from: string, to: string) {
  const fromCode = getStationCode(line, from);
  const toCode = getStationCode(line, to);
  const fromNumber = stationNumber(fromCode);
  const toNumber = stationNumber(toCode);
  let stopCount = fromNumber !== null && toNumber !== null ? Math.abs(fromNumber - toNumber) : null;
  if (line.id === "jr-yamanote" && stopCount !== null) stopCount = Math.min(stopCount, 30 - stopCount);
  const durationMinutes = stopCount !== null
    ? Math.max(3, Math.round(stopCount * (MINUTES_PER_STOP[line.id] || 2.3) + 1))
    : 12;
  return { durationMinutes, stopCount, fromCode, toCode };
}

function interchangeFor(originLines: TransitLineIdentity[], destinationLines: TransitLineIdentity[]) {
  const stations = Object.values(districtStations).flat();
  for (const originLine of originLines) {
    for (const destinationLine of destinationLines) {
      const interchange = stations.find(station => {
        const ids = station.lines.map(line => getTransitLineIdentity(line)?.id).filter(Boolean);
        return ids.includes(originLine.id) && ids.includes(destinationLine.id);
      });
      if (interchange) return { originLine, destinationLine, station: interchange.name };
    }
  }
  return null;
}

export function buildCommuteFallbackRoute(item: RentRecommendation, criteria: RentSearchCriteria) {
  if (!item.station || !criteria.commuteStation) return null;
  const destinationName = criteria.commuteStation.split(/[、,，/／或|・]/).map(value => value.trim()).find(Boolean);
  if (!destinationName) return null;
  const destination = findStation(destinationName);

  const originStation = toJapaneseStationName(item.station);
  const destinationStation = toJapaneseStationName(destination?.name || destinationName);

  const originLines = item.lines.map(line => ({ raw: line, identity: getTransitLineIdentity(line) }));
  const destLines = (destination?.lines || []).map(line => ({ raw: line, identity: getTransitLineIdentity(line) }));

  const common = originLines.find(line => line.identity && destLines.some(d => d.identity?.id === line.identity?.id));

  if (common && common.identity) {
    // Direct route (0 transfers)
    const lineName = common.identity.name;
    const lineColor = common.identity.color;
    const lineTextColor = common.identity.textColor;

    const estimate = standardSegmentEstimate(common.identity, originStation, destinationStation);
    return {
      source: "static_reference" as const,
      originStation,
      destinationStation,
      totalDurationMinutes: estimate.durationMinutes,
      transfers: 0,
      departureTime: null,
      arrivalTime: null,
      referenceLabel: "靜態標準車程・非即時班次",
      segments: [
        {
          type: "train" as const,
          lineName,
          lineShortName: common.identity.shortCode,
          lineColor,
          lineTextColor,
          operator: common.identity.operator,
          departureStop: originStation,
          arrivalStop: destinationStation,
          startStationNumber: estimate.fromCode,
          endStationNumber: estimate.toCode,
          departureTime: null,
          arrivalTime: null,
          durationMinutes: estimate.durationMinutes,
          stopCount: estimate.stopCount,
          headsign: `${destinationStation}方面`
        }
      ]
    };
  }

  const transfer = interchangeFor(originLines.map(item => item.identity).filter(Boolean) as TransitLineIdentity[], destLines.map(item => item.identity).filter(Boolean) as TransitLineIdentity[]);
  if (!transfer) return null;
  const line1 = transfer.originLine;
  const line2 = transfer.destinationLine;
  const transferStation = toJapaneseStationName(transfer.station);
  const firstEstimate = standardSegmentEstimate(line1, originStation, transferStation);
  const secondEstimate = standardSegmentEstimate(line2, transferStation, destinationStation);
  const transferMinutes = 5;

  return {
    source: "static_reference" as const,
    originStation,
    destinationStation,
    totalDurationMinutes: firstEstimate.durationMinutes + secondEstimate.durationMinutes + transferMinutes,
    transfers: 1,
    departureTime: null,
    arrivalTime: null,
    referenceLabel: "靜態標準車程・含 5 分鐘轉乘緩衝",
    segments: [
      {
        type: "train" as const,
        lineName: line1.name,
        lineShortName: line1.shortCode,
        lineColor: line1.color,
        lineTextColor: line1.textColor,
        operator: line1.operator,
        departureStop: originStation,
        arrivalStop: transferStation,
        startStationNumber: firstEstimate.fromCode,
        endStationNumber: firstEstimate.toCode,
        departureTime: null,
        arrivalTime: null,
        durationMinutes: firstEstimate.durationMinutes,
        stopCount: firstEstimate.stopCount,
        headsign: `${transferStation}方面`
      },
      {
        type: "train" as const,
        lineName: line2.name,
        lineShortName: line2.shortCode,
        lineColor: line2.color,
        lineTextColor: line2.textColor,
        operator: line2.operator,
        departureStop: transferStation,
        arrivalStop: destinationStation,
        startStationNumber: secondEstimate.fromCode,
        endStationNumber: secondEstimate.toCode,
        departureTime: null,
        arrivalTime: null,
        durationMinutes: secondEstimate.durationMinutes + transferMinutes,
        stopCount: secondEstimate.stopCount,
        headsign: `${destinationStation}方面`
      }
    ]
  };
}

export function buildCommuteDiagram(item: RentRecommendation, criteria: RentSearchCriteria): CommuteDiagramData | null {
  if (!item.station || !criteria.commuteStation) return null;
  const destinationName = criteria.commuteStation.split(/[、,，/／或|・]/).map(value => value.trim()).find(Boolean);
  if (!destinationName) return null;
  const destination = findStation(destinationName);
  const originLines = item.lines.map(line => ({ raw: line, identity: getTransitLineIdentity(line) }));
  const destinationLineIds = new Set((destination?.lines || []).map(line => getTransitLineIdentity(line)?.id).filter(Boolean));
  const common = originLines.find(line => line.identity && destinationLineIds.has(line.identity.id));
  const line = common?.identity || originLines.find(entry => entry.identity)?.identity || null;
  const direct = Boolean(common);
  const estimatedDurationMinutes = direct ? 14 : 25;
  return {
    originStation: toJapaneseStationName(item.station),
    destinationStation: toJapaneseStationName(destination?.name || destinationName),
    direct,
    line,
    originStationCode: getStationCode(line, item.station),
    destinationStationCode: direct ? getStationCode(line, destination?.name || destinationName) : null,
    estimatedDurationMinutes
  };
}
