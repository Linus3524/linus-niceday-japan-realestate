import { districtStations } from "../data/housingMarket.js";
import stationCodeOverrides from "../data/stationCodeOverrides.json" with { type: "json" };
import railLineColors from "../data/railLineColors.json" with { type: "json" };
import type { RentRecommendation, RentSearchCriteria } from "./rentAnalysis.js";
import * as OpenCC from "opencc-js";

const openccConverter = typeof OpenCC?.Converter === "function"
  ? OpenCC.Converter({ from: "cn", to: "jp" })
  : null;

/** 駅ナンバリング的補充資料：由 scripts/fill-station-codes.mjs 以 Google Search 查證後產生，
 * 涵蓋 GTFS feed 沒有填 stop_code、但實際有官方編號的車站。索引鍵是 GTFS 原始路線名稱，
 * 涵蓋許多在 TRANSIT_LINES 沒有對應識別的地方線，所以獨立於 line identity 查表。 */
const STATION_CODE_OVERRIDES = (stationCodeOverrides as { lines?: Record<string, Record<string, string>> }).lines || {};

/** 全日本路線色（Wikidata P465，CC0）：由 scripts/build-line-colors.ts 產生。
 *  lines 以圖資原始路線名為鍵；catalog 以 normalizeLineKey 正規化後的鍵涵蓋全日本。 */
type LineColorEntry = { color: string; textColor: string };
const RAIL_LINE_COLORS = railLineColors as {
  lines?: Record<string, LineColorEntry>;
  catalog?: Record<string, LineColorEntry>;
};

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
  { id: "metro-tozai", name: "東京メトロ東西線", shortCode: "T", color: "#00A7DB", textColor: "#FFFFFF", operator: "東京メトロ", patterns: [/東京メトロ東西線|東京地下鉄東西線|^東西線$/] },
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
  { id: "jr-chuo-sobu", name: "JR 中央・総武線", shortCode: "JB", color: "#FFD400", textColor: "#1A2A22", operator: "JR 東日本", patterns: [/JR?(?:中央)?[・]?[總総]武(?:緩行)?線|JR中央[總総]武線/] },
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
  { id: "tsukuba-express", name: "つくばエクスプレス", shortCode: "TX", color: "#0017C4", textColor: "#FFFFFF", operator: "首都圏新都市鉄道", patterns: [/筑波快線/] },
  // ── 關西都會圈核心路網（Osaka Metro / JR西日本 / 阪急 / 京阪 / 近鐵 / 南海） ──
  { id: "osaka-midosuji", name: "Osaka Metro御堂筋線", shortCode: "M", color: "#E5171F", textColor: "#FFFFFF", operator: "Osaka Metro", patterns: [/御堂筋線|北大阪急行/] },
  { id: "osaka-tanimachi", name: "Osaka Metro谷町線", shortCode: "T", color: "#522886", textColor: "#FFFFFF", operator: "Osaka Metro", patterns: [/谷町線/] },
  { id: "osaka-yotsubashi", name: "Osaka Metro四つ橋線", shortCode: "Y", color: "#0078BA", textColor: "#FFFFFF", operator: "Osaka Metro", patterns: [/四つ橋線|四ツ橋線|四橋線/] },
  { id: "osaka-chuo", name: "Osaka Metro中央線", shortCode: "C", color: "#019A66", textColor: "#FFFFFF", operator: "Osaka Metro", patterns: [/中央線(?:\(大阪\)|（大阪）)?/] },
  { id: "osaka-sennichimae", name: "Osaka Metro千日前線", shortCode: "S", color: "#E44D93", textColor: "#FFFFFF", operator: "Osaka Metro", patterns: [/千日前線/] },
  { id: "osaka-sakaisuji", name: "Osaka Metro堺筋線", shortCode: "K", color: "#81472C", textColor: "#FFFFFF", operator: "Osaka Metro", patterns: [/堺筋線/] },
  { id: "osaka-nagahori", name: "Osaka Metro長堀鶴見緑地線", shortCode: "N", color: "#A9CC51", textColor: "#FFFFFF", operator: "Osaka Metro", patterns: [/長堀鶴見[緑綠]地線|長堀線/] },
  { id: "osaka-imazatosuji", name: "Osaka Metro今里筋線", shortCode: "I", color: "#EE7B1A", textColor: "#FFFFFF", operator: "Osaka Metro", patterns: [/今里筋線/] },
  { id: "jr-osaka-loop", name: "JR大阪環状線", shortCode: "O", color: "#E60012", textColor: "#FFFFFF", operator: "JR西日本", patterns: [/大阪環[狀状]線/] },
  // 「東海道本線」橫跨東京～神戶，各 JR 公司對同一條線的營業通稱不同：
  // 關西段叫「JR京都線・神戸線」，名古屋段（JR東海）則就叫「JR東海道本線(名古屋)」。
  // 這裡若無條件吃下「東海道本線」，會先於下方的 jr-tokaido-chubu 命中，
  // 讓名古屋的路線在畫面上顯示成關西線名（實測 金山 → 名古屋 就被標成「JR京都線・神戸線」）。
  // 因此排除帶有名古屋標記的寫法，交給中部的定義處理。
  { id: "jr-kyoto-kobe", name: "JR京都線・神戸線", shortCode: "A", color: "#0072BC", textColor: "#FFFFFF", operator: "JR西日本", patterns: [/JR京都線|JR神[戸戶]線|^(?!.*名古屋).*東海道本線/] },
  { id: "jr-tozai", name: "JR東西線", shortCode: "H", color: "#E8398D", textColor: "#FFFFFF", operator: "JR西日本", patterns: [/JR東西線/] },
  { id: "jr-yamatoji", name: "JR大和路線", shortCode: "Q", color: "#82BD27", textColor: "#FFFFFF", operator: "JR西日本", patterns: [/大和路線|關西本線|関西本線/] },
  // 「神戸」是兩個字，寫成字元類 [神戸] 只會匹配「阪急神線」「阪急戸線」這種不存在的寫法，
  // 真正的「阪急神戸線」反而匹配不到（實測 getTransitLineIdentity 回傳 null，線路顏色因此失效）。
  // 繁體「神戶」與日文「神戸」的戶字不同，兩種都要收。
  { id: "hankyu-kobe", name: "阪急神戸線", shortCode: "HK", color: "#68212F", textColor: "#FFFFFF", operator: "阪急電鉄", patterns: [/阪急神[戸戶]線/] },
  { id: "hankyu-takarazuka", name: "阪急宝塚線", shortCode: "HK", color: "#68212F", textColor: "#FFFFFF", operator: "阪急電鉄", patterns: [/阪急[寶宝]塚線/] },
  { id: "hankyu-kyoto", name: "阪急京都線", shortCode: "HK", color: "#68212F", textColor: "#FFFFFF", operator: "阪急電鉄", patterns: [/阪急京都線/] },
  { id: "hankyu-senri", name: "阪急千里線", shortCode: "HK", color: "#68212F", textColor: "#FFFFFF", operator: "阪急電鉄", patterns: [/阪急千里線/] },
  { id: "keihan-main", name: "京阪本線", shortCode: "KH", color: "#004526", textColor: "#FFFFFF", operator: "京阪電鉄", patterns: [/京阪本線|京阪線/] },
  { id: "kintetsu-nara", name: "近鉄奈良線", shortCode: "A", color: "#E84518", textColor: "#FFFFFF", operator: "近畿日本鉄道", patterns: [/近[鐵鉄]奈良線/] },
  { id: "kintetsu-osaka", name: "近鉄大阪線", shortCode: "D", color: "#0054A6", textColor: "#FFFFFF", operator: "近畿日本鉄道", patterns: [/近[鐵鉄]大阪線/] },
  { id: "nankai-main", name: "南海本線", shortCode: "NK", color: "#0055A5", textColor: "#FFFFFF", operator: "南海電気鉄道", patterns: [/南海本線/] },
  { id: "nankai-koya", name: "南海高野線", shortCode: "NK", color: "#008080", textColor: "#FFFFFF", operator: "南海電気鉄道", patterns: [/南海高野線/] },
  // ── 京都市營地下鐵 ──
  { id: "kyoto-karasuma", name: "京都市営地下鉄烏丸線", shortCode: "K", color: "#008000", textColor: "#FFFFFF", operator: "京都市交通局", patterns: [/烏丸線/] },
  { id: "kyoto-tozai", name: "京都市営地下鉄東西線", shortCode: "T", color: "#E50012", textColor: "#FFFFFF", operator: "京都市交通局", patterns: [/京都(?:市營|市営)?(?:地下鐵|地下鉄)?東西線|東西線京都/] },
  // ── 神戶市營地下鐵 ──
  { id: "kobe-seishin", name: "神戸市営地下鉄西神・山手線", shortCode: "S", color: "#008000", textColor: "#FFFFFF", operator: "神戸市交通局", patterns: [/西神[・･]?山手線/] },
  { id: "kobe-kaigan", name: "神戸市営地下鉄海岸線", shortCode: "K", color: "#0055A5", textColor: "#FFFFFF", operator: "神戸市交通局", patterns: [/海岸線|夢かもめ/] },
  // ── 名古屋都會圈（名古屋市營地下鐵 / JR東海 / 名鐵） ──
  { id: "nagoya-higashiyama", name: "名古屋市営地下鉄東山線", shortCode: "H", color: "#F8B500", textColor: "#FFFFFF", operator: "名古屋市交通局", patterns: [/東山線/] },
  { id: "nagoya-meijo", name: "名古屋市営地下鉄名城線", shortCode: "M", color: "#A056A0", textColor: "#FFFFFF", operator: "名古屋市交通局", patterns: [/名城線/] },
  { id: "nagoya-sakuradori", name: "名古屋市営地下鉄桜通線", shortCode: "S", color: "#E50012", textColor: "#FFFFFF", operator: "名古屋市交通局", patterns: [/桜通線|櫻通線/] },
  { id: "nagoya-tsurumai", name: "名古屋市営地下鉄鶴舞線", shortCode: "T", color: "#00A3E0", textColor: "#FFFFFF", operator: "名古屋市交通局", patterns: [/鶴舞線/] },
  { id: "jr-tokaido-chubu", name: "JR東海道本線(名古屋)", shortCode: "CA", color: "#F77321", textColor: "#FFFFFF", operator: "JR東海", patterns: [/JR?東海道本線(?:名古屋)?/] },
  { id: "jr-chuo-chubu", name: "JR中央本線(名古屋)", shortCode: "CF", color: "#0072BC", textColor: "#FFFFFF", operator: "JR東海", patterns: [/JR?中央本線(?:名古屋)?/] },
  { id: "meitetsu-main", name: "名鉄名古屋本線", shortCode: "NH", color: "#E60012", textColor: "#FFFFFF", operator: "名古屋鉄道", patterns: [/名[鐵鉄](?:名古屋)?本線/] },
  // ── 九州與沖繩（福岡市地下鐵 / JR九州 / 西鐵 / ゆいレール） ──
  { id: "fukuoka-kuko", name: "福岡市地下鉄空港線", shortCode: "K", color: "#FF8C00", textColor: "#FFFFFF", operator: "福岡市交通局", patterns: [/空港線|機場線/] },
  { id: "fukuoka-nanakuma", name: "福岡市地下鉄七隈線", shortCode: "N", color: "#008000", textColor: "#FFFFFF", operator: "福岡市交通局", patterns: [/七隈線/] },
  { id: "fukuoka-hakozaki", name: "福岡市地下鉄箱崎線", shortCode: "H", color: "#0055A5", textColor: "#FFFFFF", operator: "福岡市交通局", patterns: [/箱崎線/] },
  { id: "jr-kagoshima-fukuoka", name: "JR鹿児島本線(福岡)", shortCode: "JA", color: "#EE1C25", textColor: "#FFFFFF", operator: "JR九州", patterns: [/鹿[兒児]島本線/] },
  { id: "nishitetsu-tenjin", name: "西鉄天神大牟田線", shortCode: "T", color: "#0055A5", textColor: "#FFFFFF", operator: "西日本鉄道", patterns: [/西[鐵鉄]天神大牟田線|西[鐵鉄]大牟田線/] },
  { id: "okinawa-yui", name: "ゆいレール", shortCode: "1", color: "#C8102E", textColor: "#FFFFFF", operator: "沖縄都市モノレール", patterns: [/ゆいレール|沖[繩縄]都市モノレール|沖[繩縄]單軌/] },
  // ── 北海道（札幌市營地下鐵 / JR北海道） ──
  { id: "sapporo-namboku", name: "札幌市営地下鉄南北線", shortCode: "N", color: "#008000", textColor: "#FFFFFF", operator: "札幌市交通局", patterns: [/札幌(?:市營|市営)?(?:地下鐵|地下鉄)?南北線|南北線札幌/] },
  { id: "sapporo-tozai", name: "札幌市営地下鉄東西線", shortCode: "T", color: "#FF8C00", textColor: "#FFFFFF", operator: "札幌市交通局", patterns: [/札幌(?:市營|市営)?(?:地下鐵|地下鉄)?東西線|東西線札幌/] },
  { id: "sapporo-toho", name: "札幌市営地下鉄東豊線", shortCode: "H", color: "#0072BC", textColor: "#FFFFFF", operator: "札幌市交通局", patterns: [/東[豐豊]線/] },
  { id: "jr-sapporo-chitose", name: "JR函館本線・千歳線", shortCode: "JR", color: "#008000", textColor: "#FFFFFF", operator: "JR北海道", patterns: [/函館本線|千[歲歳]線/] },
  // ── 東北（仙台市地下鐵 / JR東日本） ──
  { id: "sendai-namboku", name: "仙台市地下鉄南北線", shortCode: "N", color: "#008000", textColor: "#FFFFFF", operator: "仙台市交通局", patterns: [/仙台(?:市)?(?:地下鐵|地下鉄)?南北線|南北線仙台/] },
  { id: "sendai-tozai", name: "仙台市地下鉄東西線", shortCode: "T", color: "#00A3E0", textColor: "#FFFFFF", operator: "仙台市交通局", patterns: [/仙台(?:市)?(?:地下鐵|地下鉄)?東西線|東西線仙台/] },
  { id: "jr-tohoku-sendai", name: "JR東北本線(仙台)", shortCode: "JR", color: "#008000", textColor: "#FFFFFF", operator: "JR東日本", patterns: [/JR?東北本線(?:仙台)?/] },
  // ── 中國（廣島 / 岡山） ──
  { id: "hiroshima-astram", name: "アストラムライン", shortCode: "AL", color: "#FF8C00", textColor: "#FFFFFF", operator: "広島高速交通", patterns: [/アストラムライン|AstramLine/] },
  { id: "jr-sanyo-hiroshima", name: "JR山陽本線(広島)", shortCode: "R", color: "#E60012", textColor: "#FFFFFF", operator: "JR西日本", patterns: [/JR?山陽本線(?:廣島|広島)?/] },
  { id: "jr-sanyo-okayama", name: "JR山陽本線(岡山)", shortCode: "W", color: "#F77321", textColor: "#FFFFFF", operator: "JR西日本", patterns: [/JR?山陽本線(?:岡山)?/] }
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
  "metro-tozai": {
    "中野": "T01", "落合": "T02", "高田馬場": "T03", "早稲田": "T04", "早稻田": "T04",
    "神樂坂": "T05", "神楽坂": "T05", "飯田橋": "T06", "九段下": "T07", "竹橋": "T08",
    "大手町": "T09", "日本橋": "T10", "茅場町": "T11", "門前仲町": "T12", "木場": "T13",
    "東陽町": "T14", "南砂町": "T15", "西葛西": "T16", "葛西": "T17", "浦安": "T18",
    "南行德": "T19", "南行徳": "T19", "行德": "T20", "行徳": "T20", "妙典": "T21",
    "原木中山": "T22", "西船橋": "T23"
  },
  "tokyu-toyoko": { "澀谷": "TY01", "渋谷": "TY01", "代官山": "TY02", "中目黑": "TY03", "中目黒": "TY03", "祐天寺": "TY04", "學藝大學": "TY05", "学芸大学": "TY05", "都立大學": "TY06", "都立大学": "TY06", "自由之丘": "TY07", "自由が丘": "TY07", "田園調布": "TY08", "多摩川": "TY09", "新丸子": "TY10", "武藏小杉": "TY11", "武蔵小杉": "TY11", "元住吉": "TY12", "日吉": "TY13" },
  "tokyu-denentoshi": { "澀谷": "DT01", "渋谷": "DT01", "池尻大橋": "DT02", "三軒茶屋": "DT03", "櫻新町": "DT05", "二子玉川": "DT07" },
  // ── 關西車站編號 ──
  "osaka-midosuji": {
    "箕面萱野": "M06", "箕面船場阪大前": "M07", "千里中央": "M08", "江坂": "M11",
    "東三国": "M12", "東三國": "M12", "新大阪": "M13", "西中島南方": "M14", "中津": "M15",
    "梅田": "M16", "淀屋橋": "M17", "本町": "M18", "心斎橋": "M19", "心齋橋": "M19", "心斋桥": "M19",
    "なんば": "M20", "難波": "M20", "难波": "M20", "大国町": "M21", "大國町": "M21",
    "動物園前": "M22", "天王寺": "M23", "なかもず": "M30"
  },
  "osaka-tanimachi": {
    "大日": "T11", "東梅田": "T20", "南森町": "T21", "天満橋": "T22", "天滿橋": "T22",
    "谷町四丁目": "T23", "谷町六丁目": "T24", "谷町九丁目": "T25", "天王寺": "T27", "八尾南": "T36"
  },
  "osaka-yotsubashi": {
    "西梅田": "Y11", "肥後橋": "Y12", "本町": "Y13", "四ツ橋": "Y14", "四橋": "Y14",
    "なんば": "Y15", "難波": "Y15", "难波": "Y15", "大国町": "Y16", "大國町": "Y16", "住之江公園": "Y21"
  },
  "osaka-chuo": {
    "コスモスクエア": "C10", "大阪港": "C11", "弁天町": "C13", "阿波座": "C15",
    "本町": "C16", "堺筋本町": "C17", "谷町四丁目": "C18", "森ノ宮": "C19", "森之宮": "C19", "長田": "C23"
  },
  "osaka-sennichimae": {
    "野田阪神": "S11", "阿波座": "S13", "西長堀": "S14", "なんば": "S16", "難波": "S16",
    "日本橋": "S17", "谷町九丁目": "S18", "鶴橋": "S19", "今里": "S20", "南巽": "S24"
  },
  "osaka-sakaisuji": {
    "天神橋筋六丁目": "K11", "南森町": "K13", "北浜": "K14", "堺筋本町": "K15",
    "長堀橋": "K16", "日本橋": "K17", "動物園前": "K19", "天下茶屋": "K20"
  },
  "osaka-nagahori": {
    "大正": "N11", "心斎橋": "N15", "心齋橋": "N15", "長堀橋": "N16",
    "谷町六丁目": "N18", "森ノ宮": "N20", "森之宮": "N20", "京橋": "N22"
  },
  "jr-osaka-loop": {
    "大阪": "O11", "天満": "O12", "天滿": "O12", "桜ノ宮": "O13", "櫻之宮": "O13", "京橋": "O14", "大阪城公園": "O15",
    "森ノ宮": "O16", "森之宮": "O16", "玉造": "O17", "鶴橋": "O18", "天王寺": "O01",
    "新今宮": "O18", "芦原橋": "O16", "大正": "O15", "弁天町": "O14", "西九条": "O13", "西九條": "O13", "野田": "O12", "福島": "O11"
  }
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
  // ── 關西知名地標與繁簡對照 ──
  "心齋橋": "心斎橋", "心斋桥": "心斎橋",
  "難波": "なんば", "难波": "なんば", "難波站": "なんば", "难波站": "なんば",
  "大國町": "大国町", "大国町": "大国町",
  "森之宮": "森ノ宮", "森之宫": "森ノ宮",
  "櫻之宮": "桜ノ宮", "桜之宮": "桜ノ宮",
  "天滿": "天満", "天满": "天満", "天滿橋": "天満橋", "天满桥": "天満橋",
  "四橋": "四ツ橋", "四ツ橋": "四ツ橋",
  "東三國": "東三国", "東三国": "東三国",
  "三國": "三国", "三国": "三国",
  "三之宮": "三ノ宮", "三ノ宮": "三ノ宮", "神戶三宮": "神戸三宮", "神户三宫": "神戸三宮",
  "西九條": "西九条", "西九条": "西九条",
  "九條": "九条", "九条": "九条",
  "四天王寺前夕陽之丘": "四天王寺前夕陽ヶ丘",
  "箕面船場阪大前": "箕面船場阪大前",
  "大阪城公園": "大阪城公園",
  "日本橋 (大阪)": "日本橋",
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
const CJK_RADICAL_FOLD: Record<string, string> = {
  "⻄": "西", "⺟": "母", "⻑": "長", "⻘": "青", "⻩": "黄",
  "⻢": "馬", "⻱": "亀", "⺠": "民", "⻝": "食", "⻤": "鬼",
};

export function toJapanesePlaceName(value: string) {
  const folded = (value || "").replace(/[\u2E80-\u2EFF]/gu, char => CJK_RADICAL_FOLD[char] ?? char);
  const base = openccConverter ? openccConverter(folded) : folded;
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

/**
 * 路線名查表鍵：吸收「同一條線的不同寫法」後再比對。
 *
 * 圖資寫「都営三田線」、Wikidata 主標籤是「三田線」、AI 會回「東京都交通局三田線」，
 * 三者指同一條線。業者前綴、JR 的空白、全半形、中黑點都不影響身分，先一律去掉。
 * 這支同時給建表腳本與執行期使用，兩邊必須用同一套規則，否則表建得出來也查不到。
 */
const LINE_KEY_OPERATORS = /^(JR東日本|JR東海|JR西日本|JR九州|JR北海道|JR四国|JR|東京メトロ|東京地下鉄|都営地下鉄|都営|東京都交通局|横浜市営地下鉄|横浜市営|大阪市高速電気軌道|Osaka Metro|名古屋市営地下鉄|名古屋市営|札幌市営地下鉄|札幌市営|仙台市地下鉄|京都市営地下鉄|京都市営|神戸市営地下鉄|神戸市営|福岡市地下鉄)/;

/** 種別（各駅停車・快速・急行…）不影響路線身分，查色前先整段拿掉。
 *  必須在 normalize() 之前處理：normalize 會先吃掉「駅」，把「各駅停車」
 *  變成「各停車」，再跑一次又變成「車」——同一個字串正規化兩次結果不同，
 *  建表時與查表時就會對不起來。 */
const LINE_SERVICE_WORDS = /各駅停車|各停|普通列車|普通|通勤快速|快速急行|区間急行|準急|通勤準急|快速|急行|特急|通勤/g;

export function normalizeLineKey(value: string) {
  let key = value
    .replace(/[（(].*?[）)]/g, "")
    .replace(LINE_SERVICE_WORDS, "");
  key = normalize(key).replace(/[\s　・･]/g, "");
  // 業者前綴可能疊兩層（「都営地下鉄三田線」），所以要重複剝離。
  let previous = "";
  while (previous !== key) {
    previous = key;
    key = key.replace(LINE_KEY_OPERATORS, "");
  }
  return key;
}

/**
 * 依 WCAG 相對亮度挑可讀的文字色。
 *
 * 不能相信上游的 text_color：GTFS 圖資把 171 條路線的 lineTextColor 全部填成
 * #FFFFFF，於是山手線（#9ACD32）、総武線（#FFD400）這類淺底色配白字，路線名
 * 在畫面上完全看不見——使用者回報的「路線名稱不見了」就是這個。底色是已知的，
 * 對比色算得出來，就不該依賴一個已知會錯的欄位。
 */
const DARK_TEXT = "#1A2A22";

function relativeLuminance(hex: string) {
  const channel = (offset: number) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}

export function readableTextColor(backgroundColor: string): "#FFFFFF" | "#1A2A22" {
  const hex = backgroundColor.replace(/^#/, "");
  if (!/^[0-9A-Fa-f]{6}$/.test(hex)) return "#FFFFFF";
  const luminance = relativeLuminance(hex);
  // 對白字的對比 = 1.05 / (L + 0.05)；對深字 = (L + 0.05) / 0.05。
  // 交叉點約在 L = 0.179，低於此用白字、高於此用深字。
  return luminance > 0.179 ? DARK_TEXT : "#FFFFFF";
}

/**
 * 可讀性底線：對比低於 3:1 就改用另一個文字色。
 *
 * TRANSIT_LINES 的 textColor 是照各業者官方標示填的，但官方標示是給大型月台
 * 看板用的；同樣配色縮到畫面上 11px 的徽章就不夠看。實測埼京線（#00AC9A 配
 * 白字）只有 2.8:1，低於 WCAG 對粗體大字的 3:1 下限。底色保持官方色不動，
 * 只在必要時翻轉文字色，是唯一能同時保住品牌識別與可讀性的做法。
 */
function enforceContrast(backgroundColor: string, preferred: string): "#FFFFFF" | "#1A2A22" {
  const hex = backgroundColor.replace(/^#/, "");
  if (!/^[0-9A-Fa-f]{6}$/.test(hex)) return "#FFFFFF";
  const background = relativeLuminance(hex);
  const text = preferred === "#FFFFFF" ? 1 : relativeLuminance(DARK_TEXT.slice(1));
  const [lighter, darker] = background > text ? [background, text] : [text, background];
  const ratio = (lighter + 0.05) / (darker + 0.05);
  if (ratio >= 3) return preferred === "#FFFFFF" ? "#FFFFFF" : DARK_TEXT;
  return readableTextColor(backgroundColor);
}

export function getTransitLineIdentity(lineName: string): TransitLineIdentity | null {
  const normalized = normalize(lineName);
  const found = TRANSIT_LINES.find(line => line.patterns.some(pattern => pattern.test(normalized)));
  if (!found) return null;
  const { patterns: _patterns, ...identity } = found;
  return identity;
}

/**
 * 路線的顯示配色。查表順序是刻意的：
 *   1. TRANSIT_LINES：人工查證過的首都圈主要路線，最準，也帶 shortCode。
 *   2. railLineColors.lines：圖資路線名 → Wikidata 官方色的直接對照。
 *   3. railLineColors.catalog：正規化鍵查全日本 1600+ 條路線，接住 Transitous
 *      與 AI 回傳的圖資以外路線名。
 *   4. 呼叫端傳入的 GTFS 色：只當最後手段，且文字色一律重算不沿用。
 */
export function getLineColors(lineName: string, fallbackColor?: string | null): { color: string; textColor: "#FFFFFF" | "#1A2A22" } {
  const identity = getTransitLineIdentity(lineName);
  if (identity) return { color: identity.color, textColor: enforceContrast(identity.color, identity.textColor) };

  const direct = RAIL_LINE_COLORS.lines?.[lineName];
  if (direct) return { color: direct.color, textColor: readableTextColor(direct.color) };

  const viaCatalog = RAIL_LINE_COLORS.catalog?.[normalizeLineKey(lineName)];
  if (viaCatalog) return { color: viaCatalog.color, textColor: readableTextColor(viaCatalog.color) };

  const color = fallbackColor && /^#[0-9A-Fa-f]{6}$/.test(fallbackColor) ? fallbackColor : "#3F626D";
  return { color, textColor: readableTextColor(color) };
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
