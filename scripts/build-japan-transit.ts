import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface EdgeDef {
  to: string;
  lineName: string;
  lineShortName: string;
  lineColor: string;
  lineTextColor: string;
  operator: string;
  sourceId: string;
  region: string;
  durationMinutes: number;
  fromCode: string | null;
  toCode: string | null;
  headsign: string | null;
  schedule?: Array<[number, number]>;
}

const stations: Record<string, EdgeDef[]> = {};

function addEdge(
  from: string,
  to: string,
  lineName: string,
  lineShortName: string,
  lineColor: string,
  lineTextColor: string,
  operator: string,
  region: string,
  durationMinutes: number,
  fromCode: string | null,
  toCode: string | null,
  headsign: string | null,
  intervalMinutes = 4
) {
  // 產生 08:20 ~ 09:40 早晨通勤時刻表 (基準 8:30 前後 40 分鐘)
  const schedule: Array<[number, number]> = [];
  for (let m = 500; m <= 580; m += intervalMinutes) {
    schedule.push([m, durationMinutes]);
  }

  const edge: EdgeDef = {
    to,
    lineName,
    lineShortName,
    lineColor,
    lineTextColor,
    operator,
    sourceId: "regional",
    region,
    durationMinutes,
    fromCode,
    toCode,
    headsign,
    schedule,
  };

  stations[from] = stations[from] || [];
  const existing = stations[from].find(
    (e) => e.to === to && e.lineName === lineName
  );
  if (!existing) {
    stations[from].push(edge);
  }
}

function addBidirectionalLine(
  stationList: Array<{ name: string; code: string; durationToNext?: number }>,
  lineName: string,
  lineShortName: string,
  lineColor: string,
  lineTextColor: string,
  operator: string,
  region: string,
  defaultDuration = 2,
  intervalMinutes = 4
) {
  for (let i = 0; i < stationList.length - 1; i++) {
    const curr = stationList[i];
    const next = stationList[i + 1];
    const dur = curr.durationToNext || defaultDuration;

    // 順行
    addEdge(
      curr.name,
      next.name,
      lineName,
      lineShortName,
      lineColor,
      lineTextColor,
      operator,
      region,
      dur,
      curr.code,
      next.code,
      stationList.at(-1)?.name || null,
      intervalMinutes
    );

    // 逆行
    addEdge(
      next.name,
      curr.name,
      lineName,
      lineShortName,
      lineColor,
      lineTextColor,
      operator,
      region,
      dur,
      next.code,
      curr.code,
      stationList[0]?.name || null,
      intervalMinutes
    );
  }
}

function addTransferLink(stationA: string, stationB: string, walkMinutes: number, name = "連絡通路", region = "kansai") {
  addEdge(stationA, stationB, name, "", "#8A9590", "#FFFFFF", "徒歩", region, walkMinutes, null, null, stationB, 1);
  addEdge(stationB, stationA, name, "", "#8A9590", "#FFFFFF", "徒歩", region, walkMinutes, null, null, stationA, 1);
}

// ============================================================================
// 一、關西都會圈 (KANSAI: 大阪・京都・神戶・奈良・滋賀)
// ============================================================================

// 1. Osaka Metro 8 條路線 + 北大阪急行
const osakaMidosuji = [
  { name: "箕面萱野", code: "M06", durationToNext: 2 },
  { name: "箕面船場阪大前", code: "M07", durationToNext: 3 },
  { name: "千里中央", code: "M08", durationToNext: 5 },
  { name: "桃山台", code: "M09", durationToNext: 3 },
  { name: "緑地公園", code: "M10", durationToNext: 3 },
  { name: "江坂", code: "M11", durationToNext: 2 },
  { name: "東三国", code: "M12", durationToNext: 2 },
  { name: "新大阪", code: "M13", durationToNext: 2 },
  { name: "西中島南方", code: "M14", durationToNext: 3 },
  { name: "中津", code: "M15", durationToNext: 2 },
  { name: "梅田", code: "M16", durationToNext: 2 },
  { name: "淀屋橋", code: "M17", durationToNext: 2 },
  { name: "本町", code: "M18", durationToNext: 2 },
  { name: "心斎橋", code: "M19", durationToNext: 2 },
  { name: "なんば", code: "M20", durationToNext: 2 },
  { name: "大国町", code: "M21", durationToNext: 2 },
  { name: "動物園前", code: "M22", durationToNext: 2 },
  { name: "天王寺", code: "M23", durationToNext: 2 },
  { name: "昭和町", code: "M24", durationToNext: 2 },
  { name: "西田辺", code: "M25", durationToNext: 2 },
  { name: "長居", code: "M26", durationToNext: 2 },
  { name: "あびこ", code: "M27", durationToNext: 3 },
  { name: "北花田", code: "M28", durationToNext: 2 },
  { name: "新金岡", code: "M29", durationToNext: 3 },
  { name: "なかもず", code: "M30" },
];
addBidirectionalLine(osakaMidosuji, "Osaka Metro御堂筋線", "M", "#E5171F", "#FFFFFF", "Osaka Metro", "kansai", 2, 3);

const osakaTanimachi = [
  { name: "大日", code: "T11", durationToNext: 2 },
  { name: "守口", code: "T12", durationToNext: 3 },
  { name: "太子橋今市", code: "T13", durationToNext: 2 },
  { name: "千林大宮", code: "T14", durationToNext: 2 },
  { name: "関目高殿", code: "T15", durationToNext: 2 },
  { name: "野江内代", code: "T16", durationToNext: 2 },
  { name: "都島", code: "T17", durationToNext: 3 },
  { name: "天神橋筋六丁目", code: "T18", durationToNext: 2 },
  { name: "中崎町", code: "T19", durationToNext: 2 },
  { name: "東梅田", code: "T20", durationToNext: 2 },
  { name: "南森町", code: "T21", durationToNext: 3 },
  { name: "天満橋", code: "T22", durationToNext: 2 },
  { name: "谷町四丁目", code: "T23", durationToNext: 2 },
  { name: "谷町六丁目", code: "T24", durationToNext: 2 },
  { name: "谷町九丁目", code: "T25", durationToNext: 2 },
  { name: "四天王寺前夕陽ヶ丘", code: "T26", durationToNext: 2 },
  { name: "天王寺", code: "T27", durationToNext: 2 },
  { name: "阿倍野", code: "T28", durationToNext: 2 },
  { name: "文の里", code: "T29", durationToNext: 2 },
  { name: "田辺", code: "T30", durationToNext: 2 },
  { name: "駒川中野", code: "T31", durationToNext: 2 },
  { name: "平野", code: "T32", durationToNext: 2 },
  { name: "喜連瓜破", code: "T33", durationToNext: 2 },
  { name: "出戸", code: "T34", durationToNext: 2 },
  { name: "長原", code: "T35", durationToNext: 2 },
  { name: "八尾南", code: "T36" },
];
addBidirectionalLine(osakaTanimachi, "Osaka Metro谷町線", "T", "#522886", "#FFFFFF", "Osaka Metro", "kansai", 2, 4);

const osakaYotsubashi = [
  { name: "西梅田", code: "Y11", durationToNext: 2 },
  { name: "肥後橋", code: "Y12", durationToNext: 2 },
  { name: "本町", code: "Y13", durationToNext: 2 },
  { name: "四ツ橋", code: "Y14", durationToNext: 2 },
  { name: "なんば", code: "Y15", durationToNext: 2 },
  { name: "大国町", code: "Y16", durationToNext: 2 },
  { name: "花園町", code: "Y17", durationToNext: 2 },
  { name: "岸里", code: "Y18", durationToNext: 2 },
  { name: "玉出", code: "Y19", durationToNext: 2 },
  { name: "北加賀屋", code: "Y20", durationToNext: 3 },
  { name: "住之江公園", code: "Y21" },
];
addBidirectionalLine(osakaYotsubashi, "Osaka Metro四つ橋線", "Y", "#0078BA", "#FFFFFF", "Osaka Metro", "kansai", 2, 4);

const osakaChuo = [
  { name: "コスモスクエア", code: "C10", durationToNext: 3 },
  { name: "大阪港", code: "C11", durationToNext: 3 },
  { name: "朝潮橋", code: "C12", durationToNext: 3 },
  { name: "弁天町", code: "C13", durationToNext: 2 },
  { name: "九条", code: "C14", durationToNext: 2 },
  { name: "阿波座", code: "C15", durationToNext: 2 },
  { name: "本町", code: "C16", durationToNext: 2 },
  { name: "堺筋本町", code: "C17", durationToNext: 2 },
  { name: "谷町四丁目", code: "C18", durationToNext: 2 },
  { name: "森ノ宮", code: "C19", durationToNext: 2 },
  { name: "緑橋", code: "C20", durationToNext: 2 },
  { name: "深江橋", code: "C21", durationToNext: 3 },
  { name: "高井田", code: "C22", durationToNext: 2 },
  { name: "長田", code: "C23" },
];
addBidirectionalLine(osakaChuo, "Osaka Metro中央線", "C", "#019A66", "#FFFFFF", "Osaka Metro", "kansai", 2, 4);

const osakaSennichimae = [
  { name: "野田阪神", code: "S11", durationToNext: 2 },
  { name: "玉川", code: "S12", durationToNext: 2 },
  { name: "阿波座", code: "S13", durationToNext: 2 },
  { name: "西長堀", code: "S14", durationToNext: 2 },
  { name: "桜川", code: "S15", durationToNext: 2 },
  { name: "なんば", code: "S16", durationToNext: 2 },
  { name: "日本橋", code: "S17", durationToNext: 2 },
  { name: "谷町九丁目", code: "S18", durationToNext: 2 },
  { name: "鶴橋", code: "S19", durationToNext: 2 },
  { name: "今里", code: "S20", durationToNext: 2 },
  { name: "新深江", code: "S21", durationToNext: 2 },
  { name: "小路", code: "S22", durationToNext: 2 },
  { name: "北巽", code: "S23", durationToNext: 2 },
  { name: "南巽", code: "S24" },
];
addBidirectionalLine(osakaSennichimae, "Osaka Metro千日前線", "S", "#E44D93", "#FFFFFF", "Osaka Metro", "kansai", 2, 4);

const osakaSakaisuji = [
  { name: "天神橋筋六丁目", code: "K11", durationToNext: 2 },
  { name: "扇町", code: "K12", durationToNext: 2 },
  { name: "南森町", code: "K13", durationToNext: 2 },
  { name: "北浜", code: "K14", durationToNext: 2 },
  { name: "堺筋本町", code: "K15", durationToNext: 2 },
  { name: "長堀橋", code: "K16", durationToNext: 2 },
  { name: "日本橋", code: "K17", durationToNext: 2 },
  { name: "恵美須町", code: "K18", durationToNext: 2 },
  { name: "動物園前", code: "K19", durationToNext: 2 },
  { name: "天下茶屋", code: "K20" },
];
addBidirectionalLine(osakaSakaisuji, "Osaka Metro堺筋線", "K", "#81472C", "#FFFFFF", "Osaka Metro", "kansai", 2, 4);

const osakaNagahori = [
  { name: "大正", code: "N11", durationToNext: 2 },
  { name: "ドーム前千代崎", code: "N12", durationToNext: 2 },
  { name: "西長堀", code: "N13", durationToNext: 2 },
  { name: "西大橋", code: "N14", durationToNext: 2 },
  { name: "心斎橋", code: "N15", durationToNext: 1 },
  { name: "長堀橋", code: "N16", durationToNext: 2 },
  { name: "松屋町", code: "N17", durationToNext: 2 },
  { name: "谷町六丁目", code: "N18", durationToNext: 2 },
  { name: "玉造", code: "N19", durationToNext: 2 },
  { name: "森ノ宮", code: "N20", durationToNext: 2 },
  { name: "大阪ビジネスパーク", code: "N21", durationToNext: 2 },
  { name: "京橋", code: "N22", durationToNext: 3 },
  { name: "蒲生四丁目", code: "N23", durationToNext: 2 },
  { name: "今福鶴見", code: "N24", durationToNext: 2 },
  { name: "横堤", code: "N25", durationToNext: 2 },
  { name: "鶴見緑地", code: "N26", durationToNext: 3 },
  { name: "門真南", code: "N27" },
];
addBidirectionalLine(osakaNagahori, "Osaka Metro長堀鶴見緑地線", "N", "#A9CC51", "#FFFFFF", "Osaka Metro", "kansai", 2, 4);

const osakaImazatosuji = [
  { name: "井高野", code: "I11", durationToNext: 2 },
  { name: "瑞光四丁目", code: "I12", durationToNext: 2 },
  { name: "だいどう豊里", code: "I13", durationToNext: 3 },
  { name: "太子橋今市", code: "I14", durationToNext: 2 },
  { name: "清水", code: "I15", durationToNext: 2 },
  { name: "新森古市", code: "I16", durationToNext: 2 },
  { name: "関目成育", code: "I17", durationToNext: 2 },
  { name: "蒲生四丁目", code: "I18", durationToNext: 2 },
  { name: "鴫野", code: "I19", durationToNext: 3 },
  { name: "緑橋", code: "I20", durationToNext: 2 },
  { name: "今里", code: "I21" },
];
addBidirectionalLine(osakaImazatosuji, "Osaka Metro今里筋線", "I", "#EE7B1A", "#FFFFFF", "Osaka Metro", "kansai", 2, 5);

// 2. JR 西日本 關西路網
const jrOsakaLoop = [
  { name: "大阪", code: "JR-O11", durationToNext: 2 },
  { name: "天満", code: "JR-O12", durationToNext: 2 },
  { name: "桜ノ宮", code: "JR-O13", durationToNext: 2 },
  { name: "京橋", code: "JR-O14", durationToNext: 2 },
  { name: "大阪城公園", code: "JR-O15", durationToNext: 2 },
  { name: "森ノ宮", code: "JR-O16", durationToNext: 2 },
  { name: "玉造", code: "JR-O17", durationToNext: 2 },
  { name: "鶴橋", code: "JR-O18", durationToNext: 2 },
  { name: "桃谷", code: "JR-O19", durationToNext: 2 },
  { name: "寺田町", code: "JR-O20", durationToNext: 2 },
  { name: "天王寺", code: "JR-O01", durationToNext: 2 },
  { name: "新今宮", code: "JR-O19", durationToNext: 2 },
  { name: "今宮", code: "JR-O18", durationToNext: 2 },
  { name: "芦原橋", code: "JR-O17", durationToNext: 2 },
  { name: "大正", code: "JR-O16", durationToNext: 2 },
  { name: "弁天町", code: "JR-O15", durationToNext: 3 },
  { name: "西九条", code: "JR-O14", durationToNext: 2 },
  { name: "野田", code: "JR-O13", durationToNext: 2 },
  { name: "福島", code: "JR-O12", durationToNext: 2 },
];
addBidirectionalLine(jrOsakaLoop, "JR大阪環状線", "O", "#E60012", "#FFFFFF", "JR西日本", "kansai", 2, 3);
addEdge("福島", "大阪", "JR大阪環状線", "O", "#E60012", "#FFFFFF", "JR西日本", "kansai", 2, "JR-O12", "JR-O11", "大阪", 3);
addEdge("大阪", "福島", "JR大阪環状線", "O", "#E60012", "#FFFFFF", "JR西日本", "kansai", 2, "JR-O11", "JR-O12", "弁天町", 3);

const jrKyotoKobe = [
  { name: "高槻", code: "JR-A38", durationToNext: 4 },
  { name: "茨木", code: "JR-A41", durationToNext: 3 },
  { name: "千里丘", code: "JR-A42", durationToNext: 2 },
  { name: "岸辺", code: "JR-A43", durationToNext: 3 },
  { name: "吹田", code: "JR-A44", durationToNext: 3 },
  { name: "東淀川", code: "JR-A45", durationToNext: 2 },
  { name: "新大阪", code: "JR-A46", durationToNext: 4 },
  { name: "大阪", code: "JR-A47", durationToNext: 4 },
  { name: "塚本", code: "JR-A48", durationToNext: 3 },
  { name: "尼崎", code: "JR-A49", durationToNext: 5 },
  { name: "西宮", code: "JR-A52", durationToNext: 3 },
  { name: "芦屋", code: "JR-A54", durationToNext: 3 },
  { name: "住吉", code: "JR-A57", durationToNext: 2 },
  { name: "六甲道", code: "JR-A58", durationToNext: 4 },
  { name: "三ノ宮", code: "JR-A61", durationToNext: 2 },
  { name: "元町", code: "JR-A62", durationToNext: 2 },
  { name: "神戸", code: "JR-A63", durationToNext: 2 },
  { name: "兵庫", code: "JR-A64", durationToNext: 3 },
  { name: "新長田", code: "JR-A65", durationToNext: 4 },
  { name: "須磨", code: "JR-A68", durationToNext: 4 },
  { name: "垂水", code: "JR-A70", durationToNext: 4 },
  { name: "明石", code: "JR-A73" },
];
addBidirectionalLine(jrKyotoKobe, "JR京都線・神戸線", "A", "#0072BC", "#FFFFFF", "JR西日本", "kansai", 3, 3);

// 3. 京都市營地下鐵 (烏丸線 & 東西線)
const kyotoKarasuma = [
  { name: "国際会館", code: "K01", durationToNext: 2 },
  { name: "松ヶ崎", code: "K02", durationToNext: 3 },
  { name: "北山", code: "K03", durationToNext: 2 },
  { name: "北大路", code: "K04", durationToNext: 2 },
  { name: "鞍馬口", code: "K05", durationToNext: 2 },
  { name: "今出川", code: "K06", durationToNext: 2 },
  { name: "丸太町", code: "K07", durationToNext: 2 },
  { name: "烏丸御池", code: "K08", durationToNext: 2 },
  { name: "四条", code: "K09", durationToNext: 2 },
  { name: "五条", code: "K10", durationToNext: 2 },
  { name: "京都", code: "K11", durationToNext: 2 },
  { name: "九条", code: "K12", durationToNext: 2 },
  { name: "十条", code: "K13", durationToNext: 2 },
  { name: "くいな橋", code: "K14", durationToNext: 2 },
  { name: "竹田", code: "K15" },
];
addBidirectionalLine(kyotoKarasuma, "京都市営地下鉄烏丸線", "K", "#008000", "#FFFFFF", "京都市交通局", "kansai", 2, 4);

const kyotoTozai = [
  { name: "太秦天神川", code: "T17", durationToNext: 2 },
  { name: "西大路御池", code: "T16", durationToNext: 2 },
  { name: "二条", code: "T15", durationToNext: 2 },
  { name: "二条城前", code: "T14", durationToNext: 2 },
  { name: "烏丸御池", code: "T13", durationToNext: 2 },
  { name: "京都市役所前", code: "T12", durationToNext: 2 },
  { name: "三条京阪", code: "T11", durationToNext: 2 },
  { name: "東山", code: "T10", durationToNext: 2 },
  { name: "蹴上", code: "T09", durationToNext: 3 },
  { name: "御陵", code: "T08", durationToNext: 3 },
  { name: "山科", code: "T07", durationToNext: 3 },
  { name: "東野", code: "T06", durationToNext: 2 },
  { name: "椥辻", code: "T05", durationToNext: 2 },
  { name: "小野", code: "T04", durationToNext: 2 },
  { name: "醍醐", code: "T03", durationToNext: 2 },
  { name: "石田", code: "T02", durationToNext: 2 },
  { name: "六地蔵", code: "T01" },
];
addBidirectionalLine(kyotoTozai, "京都市営地下鉄東西線", "T", "#E50012", "#FFFFFF", "京都市交通局", "kansai", 2, 5);

// 4. 神戶市營地下鐵 (西神・山手線 & 海岸線)
const kobeSeishinYamate = [
  { name: "谷上", code: "S01", durationToNext: 10 },
  { name: "新神戸", code: "S02", durationToNext: 2 },
  { name: "三宮", code: "S03", durationToNext: 2 },
  { name: "県庁前", code: "S04", durationToNext: 2 },
  { name: "大倉山", code: "S05", durationToNext: 2 },
  { name: "湊川公園", code: "S06", durationToNext: 2 },
  { name: "上沢", code: "S07", durationToNext: 2 },
  { name: "長田", code: "S08", durationToNext: 2 },
  { name: "新長田", code: "S09", durationToNext: 2 },
  { name: "板宿", code: "S10", durationToNext: 3 },
  { name: "妙法寺", code: "S11", durationToNext: 3 },
  { name: "名谷", code: "S12", durationToNext: 4 },
  { name: "学園都市", code: "S14", durationToNext: 3 },
  { name: "西神中央", code: "S17" },
];
addBidirectionalLine(kobeSeishinYamate, "神戸市営地下鉄西神・山手線", "S", "#008000", "#FFFFFF", "神戸市交通局", "kansai", 2, 4);

const kobeKaigan = [
  { name: "三宮・花時計前", code: "K01", durationToNext: 2 },
  { name: "旧居留地・大丸前", code: "K02", durationToNext: 2 },
  { name: "みなと元町", code: "K03", durationToNext: 2 },
  { name: "ハーバーランド", code: "K04", durationToNext: 2 },
  { name: "中央市場前", code: "K05", durationToNext: 2 },
  { name: "和田岬", code: "K06", durationToNext: 3 },
  { name: "御崎公園", code: "K07", durationToNext: 2 },
  { name: "苅藻", code: "K08", durationToNext: 2 },
  { name: "駒ヶ林", code: "K09", durationToNext: 2 },
  { name: "新長田", code: "K10" },
];
addBidirectionalLine(kobeKaigan, "神戸市営地下鉄海岸線", "K", "#0055A5", "#FFFFFF", "神戸市交通局", "kansai", 2, 6);

// 5. 關西私鐵 (阪急、京阪、近鐵、南海)
const hankyuTakarazuka = [
  { name: "大阪梅田", code: "HK01", durationToNext: 2 },
  { name: "中津(阪急)", code: "HK02", durationToNext: 2 },
  { name: "十三", code: "HK03", durationToNext: 3 },
  { name: "三国", code: "HK41", durationToNext: 2 },
  { name: "庄内", code: "HK42", durationToNext: 2 },
  { name: "服部天神", code: "HK43", durationToNext: 2 },
  { name: "曽根", code: "HK44", durationToNext: 2 },
  { name: "岡町", code: "HK45", durationToNext: 2 },
  { name: "豊中", code: "HK46", durationToNext: 3 },
  { name: "蛍池", code: "HK47", durationToNext: 3 },
  { name: "石橋阪大前", code: "HK48", durationToNext: 3 },
  { name: "箕面", code: "HK59" },
];
addBidirectionalLine(hankyuTakarazuka, "阪急宝塚線", "HK", "#68212F", "#FFFFFF", "阪急電鉄", "kansai", 3, 4);

const hankyuKobe = [
  { name: "大阪梅田", code: "HK01", durationToNext: 2 },
  { name: "中津(阪急)", code: "HK02", durationToNext: 2 },
  { name: "十三", code: "HK03", durationToNext: 4 },
  { name: "神崎川", code: "HK04", durationToNext: 3 },
  { name: "塚口", code: "HK06", durationToNext: 4 },
  { name: "西宮北口", code: "HK08", durationToNext: 5 },
  { name: "夙川", code: "HK09", durationToNext: 4 },
  { name: "芦屋川", code: "HK10", durationToNext: 4 },
  { name: "岡本", code: "HK11", durationToNext: 5 },
  { name: "神戸三宮", code: "HK16" },
];
addBidirectionalLine(hankyuKobe, "阪急神戸線", "HK", "#68212F", "#FFFFFF", "阪急電鉄", "kansai", 4, 4);

const hankyuKyoto = [
  { name: "大阪梅田", code: "HK01", durationToNext: 3 },
  { name: "十三", code: "HK03", durationToNext: 4 },
  { name: "南方", code: "HK61", durationToNext: 3 },
  { name: "淡路", code: "HK63", durationToNext: 4 },
  { name: "上新庄", code: "HK64", durationToNext: 4 },
  { name: "南茨木", code: "HK68", durationToNext: 3 },
  { name: "茨木市", code: "HK69", durationToNext: 4 },
  { name: "高槻市", code: "HK72", durationToNext: 9 },
  { name: "桂", code: "HK81", durationToNext: 4 },
  { name: "烏丸", code: "HK85", durationToNext: 2 },
  { name: "京都河原町", code: "HK86" },
];
addBidirectionalLine(hankyuKyoto, "阪急京都線", "HK", "#68212F", "#FFFFFF", "阪急電鉄", "kansai", 4, 4);

const hankyuSenri = [
  { name: "天神橋筋六丁目", code: "HK01", durationToNext: 4 },
  { name: "淡路", code: "HK63", durationToNext: 3 },
  { name: "下新庄", code: "HK64", durationToNext: 3 },
  { name: "吹田", code: "HK65", durationToNext: 2 },
  { name: "豊津", code: "HK66", durationToNext: 2 },
  { name: "関大前", code: "HK67", durationToNext: 2 },
  { name: "千里山", code: "HK68", durationToNext: 2 },
  { name: "南千里", code: "HK69", durationToNext: 3 },
  { name: "山田", code: "HK70", durationToNext: 3 },
  { name: "北千里", code: "HK71" },
];
addBidirectionalLine(hankyuSenri, "阪急千里線", "HK", "#68212F", "#FFFFFF", "阪急電鉄", "kansai", 3, 5);

const keihanMain = [
  { name: "淀屋橋", code: "KH01", durationToNext: 2 },
  { name: "北浜", code: "KH02", durationToNext: 2 },
  { name: "天満橋", code: "KH03", durationToNext: 3 },
  { name: "京橋", code: "KH04", durationToNext: 4 },
  { name: "守口市", code: "KH11", durationToNext: 5 },
  { name: "寝屋川市", code: "KH17", durationToNext: 4 },
  { name: "香里園", code: "KH18", durationToNext: 4 },
  { name: "枚方市", code: "KH21", durationToNext: 5 },
  { name: "樟葉", code: "KH24", durationToNext: 8 },
  { name: "中書島", code: "KH28", durationToNext: 2 },
  { name: "丹波橋", code: "KH30", durationToNext: 7 },
  { name: "七条", code: "KH37", durationToNext: 2 },
  { name: "清水五条", code: "KH38", durationToNext: 2 },
  { name: "祇園四条", code: "KH39", durationToNext: 2 },
  { name: "三条", code: "KH40", durationToNext: 3 },
  { name: "出町柳", code: "KH42" },
];
addBidirectionalLine(keihanMain, "京阪本線", "KH", "#004526", "#FFFFFF", "京阪電鉄", "kansai", 4, 4);

const kintetsuNara = [
  { name: "大阪難波", code: "A01", durationToNext: 2 },
  { name: "近鉄日本橋", code: "A02", durationToNext: 2 },
  { name: "大阪上本町", code: "A03", durationToNext: 2 },
  { name: "鶴橋", code: "A04", durationToNext: 4 },
  { name: "布施", code: "A06", durationToNext: 4 },
  { name: "八戸ノ里", code: "A09", durationToNext: 4 },
  { name: "東花園", code: "A12", durationToNext: 6 },
  { name: "生駒", code: "A17", durationToNext: 5 },
  { name: "学園前", code: "A20", durationToNext: 3 },
  { name: "大和西大寺", code: "A26", durationToNext: 5 },
  { name: "近鉄奈良", code: "A28" },
];
addBidirectionalLine(kintetsuNara, "近鉄奈良線", "A", "#E84518", "#FFFFFF", "近畿日本鉄道", "kansai", 3, 4);

const nankaiMain = [
  { name: "なんば", code: "NK01", durationToNext: 2 },
  { name: "新今宮", code: "NK03", durationToNext: 2 },
  { name: "天下茶屋", code: "NK05", durationToNext: 4 },
  { name: "堺", code: "NK11", durationToNext: 8 },
  { name: "泉大津", code: "NK20", durationToNext: 5 },
  { name: "岸和田", code: "NK24", durationToNext: 12 },
  { name: "泉佐野", code: "NK30", durationToNext: 9 },
  { name: "関西空港", code: "NK32" },
];
addBidirectionalLine(nankaiMain, "南海本線", "NK", "#0055A5", "#FFFFFF", "南海電気鉄道", "kansai", 3, 5);

// 關西關鍵轉乘通道
addTransferLink("大阪", "梅田", 2, "地下街連絡通路", "kansai");
addTransferLink("梅田", "東梅田", 3, "ホワイティうめだ連絡通路", "kansai");
addTransferLink("梅田", "西梅田", 3, "ドージマ地下センター連絡通路", "kansai");
addTransferLink("東梅田", "西梅田", 4, "地下街連絡通路", "kansai");
addTransferLink("大阪", "北新地", 4, "地下街連絡通路", "kansai");
addTransferLink("西梅田", "北新地", 3, "地下街連絡通路", "kansai");
addTransferLink("大阪梅田", "梅田", 2, "地下街連絡通路", "kansai");
addTransferLink("大阪梅田", "大阪", 2, "歩道橋・連絡通路", "kansai");
addTransferLink("大阪梅田", "東梅田", 3, "ホワイティうめだ連絡通路", "kansai");
addTransferLink("なんば", "大阪難波", 2, "站內連絡通路", "kansai");
addTransferLink("大阪難波", "近鉄日本橋", 5, "なんばウォーク地下道", "kansai");
addTransferLink("日本橋", "近鉄日本橋", 1, "站內連絡通路", "kansai");
addTransferLink("心斎橋", "四ツ橋", 2, "クリスタ長堀地下連絡通路", "kansai");
addTransferLink("谷町九丁目", "大阪上本町", 2, "地下連絡通路", "kansai");
addTransferLink("天王寺", "大阪阿部野橋", 2, "地下・歩道橋連絡通路", "kansai");
addTransferLink("西中島南方", "南方", 1, "連絡通路", "kansai");
addTransferLink("四条", "烏丸", 2, "地下連絡通路", "kansai");
addTransferLink("三条", "三条京阪", 1, "站內連絡通路", "kansai");
addTransferLink("三ノ宮", "三宮", 2, "站內・地下街連絡通路", "kansai");
addTransferLink("神戸三宮", "三ノ宮", 2, "連絡通路", "kansai");
addTransferLink("神戸", "ハーバーランド", 2, "地下街デュオこうべ連絡通路", "kansai");
addTransferLink("元町", "みなと元町", 3, "連絡通路", "kansai");

// ============================================================================
// 二、中部都會圈 (CHUBU: 名古屋・愛知・岐阜・三重)
// ============================================================================

// 1. 名古屋市營地下鐵
const nagoyaHigashiyama = [
  { name: "高畑", code: "H01", durationToNext: 2 },
  { name: "八田", code: "H02", durationToNext: 2 },
  { name: "岩塚", code: "H03", durationToNext: 2 },
  { name: "中村公園", code: "H04", durationToNext: 2 },
  { name: "中村日赤", code: "H05", durationToNext: 1 },
  { name: "本陣", code: "H06", durationToNext: 2 },
  { name: "亀島", code: "H07", durationToNext: 2 },
  { name: "名古屋", code: "H08", durationToNext: 2 },
  { name: "伏見", code: "H09", durationToNext: 2 },
  { name: "栄", code: "H10", durationToNext: 2 },
  { name: "新栄町", code: "H11", durationToNext: 1 },
  { name: "千種", code: "H12", durationToNext: 2 },
  { name: "今池", code: "H13", durationToNext: 2 },
  { name: "池下", code: "H14", durationToNext: 1 },
  { name: "覚王山", code: "H15", durationToNext: 2 },
  { name: "本山", code: "H16", durationToNext: 2 },
  { name: "東山公園", code: "H17", durationToNext: 2 },
  { name: "星ヶ丘", code: "H18", durationToNext: 2 },
  { name: "一社", code: "H19", durationToNext: 2 },
  { name: "上社", code: "H20", durationToNext: 2 },
  { name: "本郷", code: "H21", durationToNext: 2 },
  { name: "藤が丘", code: "H22" },
];
addBidirectionalLine(nagoyaHigashiyama, "名古屋市営地下鉄東山線", "H", "#F8B500", "#FFFFFF", "名古屋市交通局", "chubu", 2, 3);

const nagoyaMeijo = [
  { name: "金山", code: "M01", durationToNext: 2 },
  { name: "東別院", code: "M02", durationToNext: 2 },
  { name: "上前津", code: "M03", durationToNext: 1 },
  { name: "矢場町", code: "M04", durationToNext: 2 },
  { name: "栄", code: "M05", durationToNext: 1 },
  { name: "久屋大通", code: "M06", durationToNext: 2 },
  { name: "市役所", code: "M07", durationToNext: 2 },
  { name: "名城公園", code: "M08", durationToNext: 2 },
  { name: "黒川", code: "M09", durationToNext: 2 },
  { name: "志賀本通", code: "M10", durationToNext: 2 },
  { name: "平安通", code: "M11", durationToNext: 1 },
  { name: "大曽根", code: "M12", durationToNext: 2 },
  { name: "ナゴヤドーム前矢田", code: "M13", durationToNext: 2 },
  { name: "砂田橋", code: "M14", durationToNext: 2 },
  { name: "茶屋ヶ坂", code: "M15", durationToNext: 2 },
  { name: "自由ヶ丘", code: "M16", durationToNext: 2 },
  { name: "本山", code: "M17", durationToNext: 2 },
  { name: "名古屋大学", code: "M18", durationToNext: 2 },
  { name: "八事日赤", code: "M19", durationToNext: 2 },
  { name: "八事", code: "M20", durationToNext: 2 },
  { name: "総合リハビリセンター", code: "M21", durationToNext: 2 },
  { name: "瑞穂運動場東", code: "M22", durationToNext: 2 },
  { name: "新瑞橋", code: "M23", durationToNext: 2 },
  { name: "妙音通", code: "M24", durationToNext: 2 },
  { name: "堀田", code: "M25", durationToNext: 2 },
  { name: "熱田神宮伝馬町", code: "M26", durationToNext: 2 },
  { name: "熱田神宮西", code: "M27", durationToNext: 2 },
  { name: "日比野", code: "M28", durationToNext: 2 },
  { name: "西高蔵", code: "M29", durationToNext: 2 },
];
addBidirectionalLine(nagoyaMeijo, "名古屋市営地下鉄名城線", "M", "#A056A0", "#FFFFFF", "名古屋市交通局", "chubu", 2, 4);
addEdge("西高蔵", "金山", "名古屋市営地下鉄名城線", "M", "#A056A0", "#FFFFFF", "名古屋市交通局", "chubu", 2, "M29", "M01", "栄", 4);
addEdge("金山", "西高蔵", "名古屋市営地下鉄名城線", "M", "#A056A0", "#FFFFFF", "名古屋市交通局", "chubu", 2, "M01", "M29", "八事", 4);

const nagoyaSakuradori = [
  { name: "太閤通", code: "S01", durationToNext: 2 },
  { name: "名古屋", code: "S02", durationToNext: 2 },
  { name: "国際センター", code: "S03", durationToNext: 2 },
  { name: "丸の内", code: "S04", durationToNext: 2 },
  { name: "久屋大通", code: "S05", durationToNext: 2 },
  { name: "高岳", code: "S06", durationToNext: 2 },
  { name: "車道", code: "S07", durationToNext: 2 },
  { name: "今池", code: "S08", durationToNext: 2 },
  { name: "吹上", code: "S09", durationToNext: 2 },
  { name: "御器所", code: "S10", durationToNext: 2 },
  { name: "桜山", code: "S11", durationToNext: 2 },
  { name: "瑞穂区役所", code: "S12", durationToNext: 2 },
  { name: "瑞穂運動場西", code: "S13", durationToNext: 2 },
  { name: "新瑞橋", code: "S14", durationToNext: 2 },
  { name: "桜本町", code: "S15", durationToNext: 2 },
  { name: "鶴里", code: "S16", durationToNext: 2 },
  { name: "野並", code: "S17", durationToNext: 2 },
  { name: "徳重", code: "S21" },
];
addBidirectionalLine(nagoyaSakuradori, "名古屋市営地下鉄桜通線", "S", "#E50012", "#FFFFFF", "名古屋市交通局", "chubu", 2, 4);

const nagoyaTsurumai = [
  { name: "上小田井", code: "T01", durationToNext: 3 },
  { name: "庄内通", code: "T03", durationToNext: 2 },
  { name: "浄心", code: "T04", durationToNext: 2 },
  { name: "浅間町", code: "T05", durationToNext: 2 },
  { name: "丸の内", code: "T06", durationToNext: 2 },
  { name: "伏見", code: "T07", durationToNext: 2 },
  { name: "大須観音", code: "T08", durationToNext: 2 },
  { name: "上前津", code: "T09", durationToNext: 2 },
  { name: "鶴舞", code: "T10", durationToNext: 2 },
  { name: "荒畑", code: "T11", durationToNext: 2 },
  { name: "御器所", code: "T12", durationToNext: 2 },
  { name: "川名", code: "T13", durationToNext: 2 },
  { name: "いりなか", code: "T14", durationToNext: 2 },
  { name: "八事", code: "T15", durationToNext: 2 },
  { name: "塩釜口", code: "T16", durationToNext: 2 },
  { name: "植田", code: "T17", durationToNext: 2 },
  { name: "原", code: "T18", durationToNext: 2 },
  { name: "平針", code: "T19", durationToNext: 2 },
  { name: "赤池", code: "T20" },
];
addBidirectionalLine(nagoyaTsurumai, "名古屋市営地下鉄鶴舞線", "T", "#00A3E0", "#FFFFFF", "名古屋市交通局", "chubu", 2, 4);

// 2. JR 東海 & 名鐵
const jrTokaidoChubu = [
  { name: "岐阜", code: "CA74", durationToNext: 8 },
  { name: "尾張一宮", code: "CA66", durationToNext: 11 },
  { name: "名古屋", code: "CA68", durationToNext: 4 },
  { name: "金山", code: "CA66", durationToNext: 3 },
  { name: "熱田", code: "CA65", durationToNext: 4 },
  { name: "笠寺", code: "CA64", durationToNext: 7 },
  { name: "大府", code: "CA60", durationToNext: 5 },
  { name: "刈谷", code: "CA58", durationToNext: 5 },
  { name: "安城", code: "CA54", durationToNext: 8 },
  { name: "岡崎", code: "CA52", durationToNext: 15 },
  { name: "豊橋", code: "CA42" },
];
addBidirectionalLine(jrTokaidoChubu, "JR東海道本線(名古屋)", "CA", "#F77321", "#FFFFFF", "JR東海", "chubu", 5, 4);

const jrChuoChubu = [
  { name: "名古屋", code: "CF01", durationToNext: 4 },
  { name: "金山", code: "CF02", durationToNext: 2 },
  { name: "鶴舞", code: "CF03", durationToNext: 2 },
  { name: "千種", code: "CF04", durationToNext: 3 },
  { name: "大曽根", code: "CF05", durationToNext: 3 },
  { name: "勝川", code: "CF06", durationToNext: 4 },
  { name: "春日井", code: "CF07", durationToNext: 5 },
  { name: "高蔵寺", code: "CF09", durationToNext: 8 },
  { name: "多治見", code: "CF12" },
];
addBidirectionalLine(jrChuoChubu, "JR中央本線(名古屋)", "CF", "#0072BC", "#FFFFFF", "JR東海", "chubu", 3, 5);

const meitetsuMain = [
  { name: "名鉄一宮", code: "NH50", durationToNext: 12 },
  { name: "名鉄名古屋", code: "NH36", durationToNext: 4 },
  { name: "金山", code: "NH34", durationToNext: 2 },
  { name: "神宮前", code: "NH33", durationToNext: 5 },
  { name: "鳴海", code: "NH27", durationToNext: 8 },
  { name: "知立", code: "NH19", durationToNext: 4 },
  { name: "新安城", code: "NH17", durationToNext: 7 },
  { name: "東岡崎", code: "NH13", durationToNext: 15 },
  { name: "豊橋", code: "NH01" },
];
addBidirectionalLine(meitetsuMain, "名鉄名古屋本線", "NH", "#E60012", "#FFFFFF", "名古屋鉄道", "chubu", 4, 4);

addTransferLink("名古屋", "名鉄名古屋", 3, "地下連絡通路", "chubu");
addTransferLink("栄", "久屋大通", 4, "セントラルパーク地下街通路", "chubu");

// ============================================================================
// 三、九州都會圈與沖繩 (KYUSHU & OKINAWA: 福岡・北九州・沖繩)
// ============================================================================

// 1. 福岡市地下鐵
const fukuokaKuko = [
  { name: "姪浜", code: "K01", durationToNext: 2 },
  { name: "室見", code: "K02", durationToNext: 2 },
  { name: "藤崎", code: "K03", durationToNext: 2 },
  { name: "西新", code: "K04", durationToNext: 2 },
  { name: "唐人町", code: "K05", durationToNext: 2 },
  { name: "大濠公園", code: "K06", durationToNext: 2 },
  { name: "赤坂", code: "K07", durationToNext: 2 },
  { name: "天神", code: "K08", durationToNext: 2 },
  { name: "中洲川端", code: "K09", durationToNext: 2 },
  { name: "祇園", code: "K10", durationToNext: 2 },
  { name: "博多", code: "K11", durationToNext: 3 },
  { name: "東比恵", code: "K12", durationToNext: 3 },
  { name: "福岡空港", code: "K13" },
];
addBidirectionalLine(fukuokaKuko, "福岡市地下鉄空港線", "K", "#FF8C00", "#FFFFFF", "福岡市交通局", "kyushu", 2, 3);

const fukuokaNanakuma = [
  { name: "橋本", code: "N01", durationToNext: 2 },
  { name: "次郎丸", code: "N02", durationToNext: 2 },
  { name: "賀茂", code: "N03", durationToNext: 2 },
  { name: "野芥", code: "N04", durationToNext: 2 },
  { name: "梅林", code: "N05", durationToNext: 2 },
  { name: "福大前", code: "N06", durationToNext: 2 },
  { name: "七隈", code: "N07", durationToNext: 2 },
  { name: "金山", code: "N08", durationToNext: 2 },
  { name: "茶山", code: "N09", durationToNext: 2 },
  { name: "別府", code: "N10", durationToNext: 2 },
  { name: "六本松", code: "N11", durationToNext: 2 },
  { name: "桜坂", code: "N12", durationToNext: 2 },
  { name: "薬院大通", code: "N13", durationToNext: 2 },
  { name: "薬院", code: "N14", durationToNext: 2 },
  { name: "渡辺通", code: "N15", durationToNext: 2 },
  { name: "天神南", code: "N16", durationToNext: 2 },
  { name: "櫛田神社前", code: "N17", durationToNext: 2 },
  { name: "博多", code: "N18" },
];
addBidirectionalLine(fukuokaNanakuma, "福岡市地下鉄七隈線", "N", "#008000", "#FFFFFF", "福岡市交通局", "kyushu", 2, 4);

const fukuokaHakozaki = [
  { name: "中洲川端", code: "H01", durationToNext: 2 },
  { name: "呉服町", code: "H02", durationToNext: 2 },
  { name: "千代県庁口", code: "H03", durationToNext: 2 },
  { name: "馬出九大病院前", code: "H04", durationToNext: 2 },
  { name: "箱崎宮前", code: "H05", durationToNext: 2 },
  { name: "箱崎九大前", code: "H06", durationToNext: 2 },
  { name: "貝塚", code: "H07" },
];
addBidirectionalLine(fukuokaHakozaki, "福岡市地下鉄箱崎線", "H", "#0055A5", "#FFFFFF", "福岡市交通局", "kyushu", 2, 5);

// 2. JR 九州 鹿兒島本線 & 西鐵
const jrKagoshimaFukuoka = [
  { name: "福間", code: "JA11", durationToNext: 5 },
  { name: "古賀", code: "JA09", durationToNext: 6 },
  { name: "香椎", code: "JA04", durationToNext: 4 },
  { name: "千早", code: "JA03", durationToNext: 4 },
  { name: "吉塚", code: "JA01", durationToNext: 3 },
  { name: "博多", code: "00", durationToNext: 3 },
  { name: "竹下", code: "JB01", durationToNext: 3 },
  { name: "笹原", code: "JB02", durationToNext: 2 },
  { name: "南福岡", code: "JB03", durationToNext: 2 },
  { name: "春日", code: "JB04", durationToNext: 2 },
  { name: "大野城", code: "JB05", durationToNext: 4 },
  { name: "二日市", code: "JB08", durationToNext: 8 },
  { name: "鳥栖", code: "JB15", durationToNext: 8 },
  { name: "久留米", code: "JB17" },
];
addBidirectionalLine(jrKagoshimaFukuoka, "JR鹿児島本線(福岡)", "JA", "#EE1C25", "#FFFFFF", "JR九州", "kyushu", 3, 4);

const nishitetsuTenjinOmuta = [
  { name: "西鉄福岡(天神)", code: "T01", durationToNext: 2 },
  { name: "薬院", code: "T02", durationToNext: 2 },
  { name: "西鉄平尾", code: "T03", durationToNext: 2 },
  { name: "高宮", code: "T04", durationToNext: 2 },
  { name: "大橋", code: "T05", durationToNext: 3 },
  { name: "井尻", code: "T06", durationToNext: 3 },
  { name: "春日原", code: "T09", durationToNext: 3 },
  { name: "下大利", code: "T11", durationToNext: 4 },
  { name: "西鉄二日市", code: "T13" },
];
addBidirectionalLine(nishitetsuTenjinOmuta, "西鉄天神大牟田線", "T", "#0055A5", "#FFFFFF", "西日本鉄道", "kyushu", 2, 4);

// 3. 沖繩都市單軌電車 (ゆいレール)
const okinawaYuiRail = [
  { name: "那覇空港", code: "1", durationToNext: 3 },
  { name: "赤嶺", code: "2", durationToNext: 2 },
  { name: "小禄", code: "3", durationToNext: 2 },
  { name: "奥武山公園", code: "4", durationToNext: 2 },
  { name: "壺川", code: "5", durationToNext: 2 },
  { name: "旭橋", code: "6", durationToNext: 2 },
  { name: "県庁前", code: "7", durationToNext: 2 },
  { name: "美栄橋", code: "8", durationToNext: 2 },
  { name: "牧志", code: "9", durationToNext: 2 },
  { name: "安里", code: "10", durationToNext: 2 },
  { name: "おもろまち", code: "11", durationToNext: 2 },
  { name: "古島", code: "12", durationToNext: 2 },
  { name: "市立病院前", code: "13", durationToNext: 2 },
  { name: "儀保", code: "14", durationToNext: 2 },
  { name: "首里", code: "15", durationToNext: 2 },
  { name: "石嶺", code: "16", durationToNext: 2 },
  { name: "経塚", code: "17", durationToNext: 2 },
  { name: "浦添前田", code: "18", durationToNext: 2 },
  { name: "てだこ浦西", code: "19" },
];
addBidirectionalLine(okinawaYuiRail, "ゆいレール", "1", "#C8102E", "#FFFFFF", "沖縄都市モノレール", "kyushu", 2, 5);

addTransferLink("天神", "西鉄福岡(天神)", 3, "天神地下街連絡通路", "kyushu");
addTransferLink("天神", "天神南", 4, "天神地下街連絡通路", "kyushu");

// ============================================================================
// 四、北海道都會圈 (HOKKAIDO: 札幌)
// ============================================================================

// 1. 札幌市營地下鐵
const sapporoNamboku = [
  { name: "麻生", code: "N01", durationToNext: 2 },
  { name: "北34条", code: "N02", durationToNext: 2 },
  { name: "北24条", code: "N03", durationToNext: 2 },
  { name: "北18条", code: "N04", durationToNext: 2 },
  { name: "北12条", code: "N05", durationToNext: 2 },
  { name: "さっぽろ", code: "N06", durationToNext: 2 },
  { name: "大通", code: "N07", durationToNext: 1 },
  { name: "すすきの", code: "N08", durationToNext: 2 },
  { name: "中島公園", code: "N09", durationToNext: 2 },
  { name: "幌平橋", code: "N10", durationToNext: 2 },
  { name: "中の島", code: "N11", durationToNext: 2 },
  { name: "平岸", code: "N12", durationToNext: 2 },
  { name: "南平岸", code: "N13", durationToNext: 2 },
  { name: "澄川", code: "N14", durationToNext: 2 },
  { name: "自衛隊前", code: "N15", durationToNext: 2 },
  { name: "真駒内", code: "N16" },
];
addBidirectionalLine(sapporoNamboku, "札幌市営地下鉄南北線", "N", "#008000", "#FFFFFF", "札幌市交通局", "hokkaido", 2, 4);

const sapporoTozai = [
  { name: "宮の沢", code: "T01", durationToNext: 2 },
  { name: "発寒南", code: "T02", durationToNext: 2 },
  { name: "琴似", code: "T03", durationToNext: 2 },
  { name: "二十四軒", code: "T04", durationToNext: 2 },
  { name: "西28丁目", code: "T05", durationToNext: 2 },
  { name: "円山公園", code: "T06", durationToNext: 2 },
  { name: "西18丁目", code: "T07", durationToNext: 2 },
  { name: "西11丁目", code: "T08", durationToNext: 2 },
  { name: "大通", code: "T09", durationToNext: 2 },
  { name: "バスセンター前", code: "T10", durationToNext: 2 },
  { name: "菊水", code: "T11", durationToNext: 2 },
  { name: "東札幌", code: "T12", durationToNext: 2 },
  { name: "白石", code: "T13", durationToNext: 2 },
  { name: "南郷7丁目", code: "T14", durationToNext: 2 },
  { name: "南郷13丁目", code: "T15", durationToNext: 2 },
  { name: "南郷18丁目", code: "T16", durationToNext: 2 },
  { name: "大谷地", code: "T17", durationToNext: 2 },
  { name: "ひばりが丘", code: "T18", durationToNext: 2 },
  { name: "新さっぽろ", code: "T19" },
];
addBidirectionalLine(sapporoTozai, "札幌市営地下鉄東西線", "T", "#FF8C00", "#FFFFFF", "札幌市交通局", "hokkaido", 2, 4);

const sapporoToho = [
  { name: "栄町", code: "H01", durationToNext: 2 },
  { name: "新道東", code: "H02", durationToNext: 2 },
  { name: "元町", code: "H03", durationToNext: 2 },
  { name: "環状通東", code: "H04", durationToNext: 2 },
  { name: "東区役所前", code: "H05", durationToNext: 2 },
  { name: "北13条東", code: "H06", durationToNext: 2 },
  { name: "さっぽろ", code: "H07", durationToNext: 2 },
  { name: "大通", code: "H08", durationToNext: 2 },
  { name: "豊水すすきの", code: "H09", durationToNext: 2 },
  { name: "学園前", code: "H10", durationToNext: 2 },
  { name: "豊平公園", code: "H11", durationToNext: 2 },
  { name: "美園", code: "H12", durationToNext: 2 },
  { name: "月寒中央", code: "H13", durationToNext: 2 },
  { name: "福住", code: "H14" },
];
addBidirectionalLine(sapporoToho, "札幌市営地下鉄東豊線", "H", "#0072BC", "#FFFFFF", "札幌市交通局", "hokkaido", 2, 5);

// 2. JR 北海道 核心幹線
const jrSapporoChitose = [
  { name: "手稲", code: "S07", durationToNext: 5 },
  { name: "琴似", code: "S03", durationToNext: 5 },
  { name: "札幌", code: "01", durationToNext: 3 },
  { name: "苗穂", code: "H02", durationToNext: 3 },
  { name: "白石", code: "H03", durationToNext: 6 },
  { name: "新札幌", code: "H05", durationToNext: 8 },
  { name: "北広島", code: "H07", durationToNext: 15 },
  { name: "千歳", code: "H13", durationToNext: 3 },
  { name: "南千歳", code: "H14", durationToNext: 4 },
  { name: "新千歳空港", code: "AP15" },
];
addBidirectionalLine(jrSapporoChitose, "JR函館本線・千歳線", "JR", "#008000", "#FFFFFF", "JR北海道", "hokkaido", 4, 4);

addTransferLink("札幌", "さっぽろ", 2, "札幌駅地下歩道チカホ", "hokkaido");
addTransferLink("新札幌", "新さっぽろ", 2, "連絡通路", "hokkaido");

// ============================================================================
// 五、東北都會圈 (TOHOKU: 仙台)
// ============================================================================

const sendaiNamboku = [
  { name: "泉中央", code: "N01", durationToNext: 2 },
  { name: "八乙女", code: "N02", durationToNext: 2 },
  { name: "黒松", code: "N03", durationToNext: 2 },
  { name: "旭ヶ丘", code: "N04", durationToNext: 2 },
  { name: "台原", code: "N05", durationToNext: 2 },
  { name: "北仙台", code: "N06", durationToNext: 2 },
  { name: "北四番丁", code: "N07", durationToNext: 2 },
  { name: "勾当台公園", code: "N08", durationToNext: 1 },
  { name: "広瀬通", code: "N09", durationToNext: 2 },
  { name: "仙台", code: "N10", durationToNext: 1 },
  { name: "五橋", code: "N11", durationToNext: 2 },
  { name: "愛宕橋", code: "N12", durationToNext: 2 },
  { name: "河原町", code: "N13", durationToNext: 2 },
  { name: "長町一丁目", code: "N14", durationToNext: 2 },
  { name: "長町", code: "N15", durationToNext: 2 },
  { name: "長町南", code: "N16", durationToNext: 2 },
  { name: "富沢", code: "N17" },
];
addBidirectionalLine(sendaiNamboku, "仙台市地下鉄南北線", "N", "#008000", "#FFFFFF", "仙台市交通局", "tohoku", 2, 4);

const sendaiTozai = [
  { name: "八木山動物公園", code: "T01", durationToNext: 2 },
  { name: "青葉山", code: "T02", durationToNext: 2 },
  { name: "川内", code: "T03", durationToNext: 2 },
  { name: "国際センター", code: "T04", durationToNext: 2 },
  { name: "大町西公園", code: "T05", durationToNext: 2 },
  { name: "青葉通一番町", code: "T06", durationToNext: 2 },
  { name: "仙台", code: "T07", durationToNext: 2 },
  { name: "宮城野通", code: "T08", durationToNext: 2 },
  { name: "連坊", code: "T09", durationToNext: 2 },
  { name: "薬師堂", code: "T10", durationToNext: 2 },
  { name: "卸町", code: "T11", durationToNext: 2 },
  { name: "六丁の目", code: "T12", durationToNext: 2 },
  { name: "荒井", code: "T13" },
];
addBidirectionalLine(sendaiTozai, "仙台市地下鉄東西線", "T", "#00A3E0", "#FFFFFF", "仙台市交通局", "tohoku", 2, 5);

const jrTohokuSendai = [
  { name: "岩沼", code: "JR", durationToNext: 5 },
  { name: "名取", code: "JR", durationToNext: 4 },
  { name: "南仙台", code: "JR", durationToNext: 3 },
  { name: "太子堂", code: "JR", durationToNext: 2 },
  { name: "長町", code: "JR", durationToNext: 5 },
  { name: "仙台", code: "JR", durationToNext: 4 },
  { name: "東仙台", code: "JR", durationToNext: 4 },
  { name: "岩切", code: "JR" },
];
addBidirectionalLine(jrTohokuSendai, "JR東北本線(仙台)", "JR", "#008000", "#FFFFFF", "JR東日本", "tohoku", 4, 5);

addTransferLink("仙台", "あおば通", 3, "仙石線地下通路", "tohoku");

// ============================================================================
// 六、中國都會圈 (CHUGOKU: 廣島・岡山)
// ============================================================================

const hiroshimaAstram = [
  { name: "本通", code: "01", durationToNext: 1 },
  { name: "県庁前", code: "02", durationToNext: 2 },
  { name: "城北", code: "03", durationToNext: 2 },
  { name: "新白島", code: "04", durationToNext: 2 },
  { name: "白島", code: "05", durationToNext: 2 },
  { name: "牛田", code: "06", durationToNext: 2 },
  { name: "不動院前", code: "07", durationToNext: 2 },
  { name: "祇園新橋北", code: "08", durationToNext: 2 },
  { name: "西原", code: "09", durationToNext: 2 },
  { name: "中筋", code: "10", durationToNext: 2 },
  { name: "古市", code: "11", durationToNext: 2 },
  { name: "大町", code: "12", durationToNext: 3 },
  { name: "安東", code: "14", durationToNext: 2 },
  { name: "上安", code: "15", durationToNext: 10 },
  { name: "広域公園前", code: "21" },
];
addBidirectionalLine(hiroshimaAstram, "アストラムライン", "AL", "#FF8C00", "#FFFFFF", "広島高速交通", "chugoku", 2, 4);

const jrSanyoHiroshima = [
  { name: "海田市", code: "JR-G04", durationToNext: 3 },
  { name: "向洋", code: "JR-G02", durationToNext: 3 },
  { name: "天神川", code: "JR-G01", durationToNext: 3 },
  { name: "広島", code: "JR-G00", durationToNext: 3 },
  { name: "新白島", code: "JR-R01", durationToNext: 2 },
  { name: "横川", code: "JR-R02", durationToNext: 3 },
  { name: "西広島", code: "JR-R03", durationToNext: 3 },
  { name: "新井口", code: "JR-R04", durationToNext: 3 },
  { name: "五日市", code: "JR-R05", durationToNext: 5 },
  { name: "廿日市", code: "JR-R07", durationToNext: 5 },
  { name: "宮島口", code: "JR-R10" },
];
addBidirectionalLine(jrSanyoHiroshima, "JR山陽本線(広島)", "R", "#E60012", "#FFFFFF", "JR西日本", "chugoku", 3, 4);

const jrOkayamaKurashiki = [
  { name: "岡山", code: "JR-W01", durationToNext: 4 },
  { name: "北長瀬", code: "JR-W02", durationToNext: 3 },
  { name: "庭瀬", code: "JR-W03", durationToNext: 5 },
  { name: "中庄", code: "JR-W04", durationToNext: 5 },
  { name: "倉敷", code: "JR-W05" },
];
addBidirectionalLine(jrOkayamaKurashiki, "JR山陽本線(岡山)", "W", "#F77321", "#FFFFFF", "JR西日本", "chugoku", 4, 4);

addTransferLink("広島", "広島駅(広電)", 2, "駅前連絡通路", "chugoku");
addTransferLink("本通", "紙屋町東", 2, "シャレオ地下街連絡通路", "chugoku");
addTransferLink("本通", "紙屋町西", 2, "シャレオ地下街連絡通路", "chugoku");

// ============================================================================
// 輸出全日本主要都會路網圖資
// ============================================================================

const outputPath = resolve(__dirname, "../src/data/japanRegionalTransitGraph.json");

const totalStations = Object.keys(stations).length;
let totalEdges = 0;
for (const edgeList of Object.values(stations)) {
  totalEdges += edgeList.length;
}

const graph = {
  generatedAt: new Date().toISOString(),
  sourceUpdatedAt: new Date().toISOString(),
  attribution: "Japan Nationwide Metropolitan Rapid Transit Network © Linus-NiceDay",
  sourceUrl: "https://linus-niceday-japan-realestate.vercel.app/",
  sources: [
    { id: "kansai", label: "Osaka Metro, JR西日本, 阪急, 京阪, 近鉄, 南海, 京都市営, 神戸市営", sourceUrl: "https://www.osakametro.co.jp/" },
    { id: "chubu", label: "名古屋市営地下鉄, JR東海, 名古屋鉄道, 近鉄", sourceUrl: "https://www.kotsu.city.nagoya.jp/" },
    { id: "kyushu", label: "福岡市地下鉄, JR九州, 西日本鉄道, 沖縄都市モノレール", sourceUrl: "https://subway.city.fukuoka.lg.jp/" },
    { id: "hokkaido", label: "札幌市営地下鉄, JR北海道", sourceUrl: "https://www.city.sapporo.jp/st/" },
    { id: "tohoku", label: "仙台市地下鉄, JR東日本", sourceUrl: "https://www.kotsu.city.sendai.jp/" },
    { id: "chugoku", label: "アストラムライン, 広島電鉄, JR西日本", sourceUrl: "https://astramline.co.jp/" },
  ],
  stations,
};

writeFileSync(outputPath, JSON.stringify(graph), "utf-8");
console.log(`Successfully generated ${totalStations} nationwide stations (${totalEdges} edges) to ${outputPath}`);
