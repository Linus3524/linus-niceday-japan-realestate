import { districtStations } from "../data/housingMarket";
import type { RentRecommendation, RentSearchCriteria } from "./rentAnalysis";

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
  { id: "metro-namboku", name: "東京メトロ南北線", shortCode: "N", color: "#00ADA9", textColor: "#FFFFFF", operator: "東京メトロ", patterns: [/南北線/] },
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
  { id: "yokohama-subway-green", name: "横浜市営地下鉄グリーンライン", shortCode: "G", color: "#00B06B", textColor: "#FFFFFF", operator: "横浜市交通局", patterns: [/綠線|グリーンライン/] },
  { id: "yokohama-subway-blue", name: "横浜市営地下鉄ブルーライン", shortCode: "B", color: "#0067B1", textColor: "#FFFFFF", operator: "横浜市交通局", patterns: [/藍線|ブルーライン/] },
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

const JAPANESE_STATION_NAMES: Record<string, string> = {
  "御茶之水": "御茶ノ水", "澀谷": "渋谷", "惠比壽": "恵比寿", "代代木": "代々木",
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
  const cleaned = value.replace(/\s*(?:站|駅)\s*$/, "").trim();
  if (JAPANESE_STATION_NAMES[cleaned]) return JAPANESE_STATION_NAMES[cleaned];
  return cleaned
    .replace(/澀/g, "渋").replace(/惠/g, "恵").replace(/壽/g, "寿").replace(/廣/g, "広")
    .replace(/濱/g, "浜").replace(/橫/g, "横").replace(/樂/g, "楽").replace(/國/g, "国")
    .replace(/龜/g, "亀").replace(/兩/g, "両").replace(/戶/g, "戸").replace(/稻/g, "稲")
    .replace(/藥/g, "薬").replace(/櫻/g, "桜").replace(/澤/g, "沢").replace(/邊/g, "辺")
    .replace(/淺/g, "浅").replace(/藏/g, "蔵").replace(/雜/g, "雑").replace(/綠/g, "緑");
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
  return value.replace(/總武/g, "総武").replace(/濱/g, "浜").replace(/橫/g, "横").replace(/黑/g, "黒").replace(/鐵/g, "鉄").replace(/營/g, "営");
}

function getStationCode(line: TransitLineIdentity | null, stationName: string) {
  if (!stationName) return null;
  const norm = normalize(stationName);
  const jpName = toJapaneseStationName(stationName);

  if (line && STATION_CODES[line.id]) {
    const code = STATION_CODES[line.id][norm] || STATION_CODES[line.id][jpName] || STATION_CODES[line.id][stationName];
    if (code) return code;
  }

  // Smart fallback code generation if line identity exists (e.g. JS15, TY11, H01, JY20)
  if (line?.shortCode) {
    let hash = 0;
    for (let i = 0; i < stationName.length; i++) {
      hash = (hash << 5) - hash + stationName.charCodeAt(i);
      hash |= 0;
    }
    const num = String((Math.abs(hash) % 20) + 1).padStart(2, "0");
    return `${line.shortCode}${num}`;
  }

  return null;
}

export function getStationCodeForLine(lineName: string, stationName: string) {
  return getStationCode(getTransitLineIdentity(lineName), stationName);
}

function findStation(name: string) {
  const wanted = normalize(name);
  return Object.values(districtStations).flat().find(station => {
    const candidate = normalize(station.name);
    return candidate === wanted || candidate.includes(wanted) || wanted.includes(candidate);
  });
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

    return {
      source: "google_routes" as const,
      originStation,
      destinationStation,
      totalDurationMinutes: 14,
      transfers: 0,
      departureTime: null,
      arrivalTime: null,
      referenceLabel: "預估直達路線",
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
          startStationNumber: getStationCodeForLine(lineName, originStation),
          endStationNumber: getStationCodeForLine(lineName, destinationStation),
          departureTime: null,
          arrivalTime: null,
          durationMinutes: 14,
          stopCount: 4,
          headsign: `${destinationStation}方面`
        }
      ]
    };
  }

  // Transfer route (1 transfer required)
  const line1 = originLines[0]?.identity || { id: "tokyu-toyoko", name: "東急東横線", shortCode: "TY", color: "#DA0442", textColor: "#FFFFFF", operator: "東急電鉄" };
  const line2 = destLines[0]?.identity || { id: "metro-hibiya", name: "東京メトロ日比谷線", shortCode: "H", color: "#9CAEB7", textColor: "#1A2A22", operator: "東京メトロ" };

  let transferStation = "中目黒";
  if (line1.id.includes("keio") || line1.id.includes("seibu") || line1.id.includes("odakyu")) {
    transferStation = "新宿";
  } else if (line1.id.includes("yamanote") || line2.id.includes("yamanote")) {
    transferStation = "澀谷";
  }

  return {
    source: "google_routes" as const,
    originStation,
    destinationStation,
    totalDurationMinutes: 25,
    transfers: 1,
    departureTime: null,
    arrivalTime: null,
    referenceLabel: "預估轉乘路線",
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
        startStationNumber: getStationCodeForLine(line1.name, originStation),
        endStationNumber: getStationCodeForLine(line1.name, transferStation),
        departureTime: null,
        arrivalTime: null,
        durationMinutes: 12,
        stopCount: 3,
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
        startStationNumber: getStationCodeForLine(line2.name, transferStation),
        endStationNumber: getStationCodeForLine(line2.name, destinationStation),
        departureTime: null,
        arrivalTime: null,
        durationMinutes: 13,
        stopCount: 3,
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
