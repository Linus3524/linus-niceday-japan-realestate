import { rentRates as legacyRentRates, RentRate } from "./rentGuideData";
import { districtStations as legacyDistrictStations, StationInfo } from "./stationData";

export type DataConfidence = "high" | "medium" | "limited";
export type DataVerificationStatus = "verified_source" | "modeled_unverified" | "researched_limited";
export type LayoutCode = "r1" | "k1" | "ldk1" | "ldk2";

export interface PrefectureRecord {
  id: string;
  name: string;
  areaGroup: string;
}

export interface MunicipalityRecord {
  id: string;
  prefectureId: string;
  name: string;
  level: "ward" | "city" | "city_average";
}

export interface StationRecord {
  id: string;
  municipalityId: string;
  name: string;
  marketTier: StationInfo["type"];
}

export interface RailwayLineRecord {
  id: string;
  name: string;
  operator: string | null;
}

export interface StationLineRecord {
  stationId: string;
  railwayLineId: string;
}

export interface RentSnapshotRecord {
  id: string;
  municipalityId: string;
  layout: LayoutCode;
  monthlyRentYen: number;
  includesManagementFee: boolean | null;
  effectiveDate: string;
  sourceLabel: string;
  sourceUrl: string | null;
  confidence: DataConfidence;
  verificationStatus: DataVerificationStatus;
  sampleSize: number | null;
}

const AREA_BY_PREFECTURE: Record<string, string> = {
  "北海道": "北海道", "宮城": "東北",
  "東京都": "關東", "神奈川": "關東", "埼玉": "關東", "千葉": "關東",
  "愛知": "中部", "京都": "關西", "大阪": "關西", "兵庫": "關西",
  "廣島": "中國", "福岡": "九州"
};

const AT_HOME_2026_URL = "https://www.athome.co.jp/corporate/wp-content/themes/news/pdf/chintai-yachin-202603/chintai-yachin-202603.pdf";
const stableId = (...parts: string[]) => parts.map(part => encodeURIComponent(part.trim())).join(":");
const municipalityLevel = (name: string): MunicipalityRecord["level"] =>
  name.includes("（市平均）") ? "city_average" : name.endsWith("區") ? "ward" : "city";

// Ward estimates are anchored to At Home's verified city-wide March 2026 averages.
// Multipliers express intra-city location premiums only; they are not represented as ward-level survey observations.
const wardProfiles: Array<{ region: string; cityAverage: string; wards: Array<[string, number]> }> = [
  { region: "北海道", cityAverage: "札幌市（市平均）", wards: [["札幌市中央區",1.18],["札幌市北區",1.00],["札幌市東區",0.96],["札幌市白石區",0.94],["札幌市豐平區",1.00],["札幌市南區",0.84],["札幌市西區",0.95],["札幌市厚別區",0.91],["札幌市手稻區",0.82],["札幌市清田區",0.85]] },
  { region: "宮城", cityAverage: "仙台市（市平均）", wards: [["仙台市青葉區",1.15],["仙台市宮城野區",1.02],["仙台市若林區",1.00],["仙台市太白區",0.92],["仙台市泉區",0.94]] },
  { region: "愛知", cityAverage: "名古屋市（市平均）", wards: [["名古屋市千種區",1.12],["名古屋市東區",1.18],["名古屋市北區",0.90],["名古屋市西區",0.96],["名古屋市中村區",1.08],["名古屋市中區",1.24],["名古屋市昭和區",1.06],["名古屋市瑞穗區",1.02],["名古屋市熱田區",0.98],["名古屋市中川區",0.88],["名古屋市港區",0.82],["名古屋市南區",0.86],["名古屋市守山區",0.84],["名古屋市綠區",0.88],["名古屋市名東區",1.00],["名古屋市天白區",0.94]] },
  { region: "京都", cityAverage: "京都市（市平均）", wards: [["京都市北區",0.98],["京都市上京區",1.10],["京都市左京區",1.04],["京都市中京區",1.24],["京都市東山區",1.16],["京都市下京區",1.20],["京都市南區",0.94],["京都市右京區",0.90],["京都市伏見區",0.84],["京都市山科區",0.82],["京都市西京區",0.86]] },
  { region: "兵庫", cityAverage: "神戶市（市平均）", wards: [["神戶市東灘區",1.10],["神戶市灘區",1.08],["神戶市兵庫區",0.98],["神戶市長田區",0.82],["神戶市須磨區",0.88],["神戶市垂水區",0.86],["神戶市北區",0.76],["神戶市中央區",1.22],["神戶市西區",0.80]] },
  { region: "廣島", cityAverage: "廣島市（市平均）", wards: [["廣島市中區",1.20],["廣島市東區",0.98],["廣島市南區",1.10],["廣島市西區",1.02],["廣島市安佐南區",0.90],["廣島市安佐北區",0.76],["廣島市安藝區",0.82],["廣島市佐伯區",0.86]] },
  { region: "福岡", cityAverage: "福岡市（市平均）", wards: [["福岡市東區",0.90],["福岡市博多區",1.10],["福岡市中央區",1.24],["福岡市南區",0.96],["福岡市城南區",0.92],["福岡市早良區",1.00],["福岡市西區",0.88]] }
];

const derivedWardRates: RentRate[] = wardProfiles.flatMap(profile => {
  const base = legacyRentRates.find(rate => rate.region === profile.region && rate.district === profile.cityAverage);
  if (!base) return [];
  return profile.wards.map(([district, multiplier]) => ({
    region: profile.region,
    district,
    r1: (parseFloat(base.r1) * multiplier).toFixed(1),
    k1: (parseFloat(base.k1) * multiplier).toFixed(1),
    ldk1: (parseFloat(base.ldk1) * multiplier).toFixed(1),
    ldk2: (parseFloat(base.ldk2) * multiplier).toFixed(1),
    areaGroup: base.areaGroup,
    sourceDate: base.sourceDate,
    confidence: "medium",
    sourceNote: "At Home 市平均 × 區域相對係數推估（非區級募集統計）"
  }));
});

interface SecondStageMarketSpec {
  region: string;
  district: string;
  areaGroup: NonNullable<RentRate["areaGroup"]>;
  referenceDistrict: string;
  multiplier: number;
  station: string;
  lines: string[];
  tier?: StationInfo["type"];
}

// Phase two coverage: prefectural capitals, missing ordinance-designated cities,
// major transport nodes and industrial cities. These are explicitly low-confidence
// reference estimates until a city-level listing sample is available.
const secondStageMarketSpecs: SecondStageMarketSpec[] = [
  { region:"青森",district:"青森市",areaGroup:"東北",referenceDistrict:"仙台市（市平均）",multiplier:.78,station:"青森",lines:["奧羽本線","青森鐵道線"] },
  { region:"岩手",district:"盛岡市",areaGroup:"東北",referenceDistrict:"仙台市（市平均）",multiplier:.82,station:"盛岡",lines:["東北新幹線","東北本線"] },
  { region:"秋田",district:"秋田市",areaGroup:"東北",referenceDistrict:"仙台市（市平均）",multiplier:.75,station:"秋田",lines:["秋田新幹線","奧羽本線"] },
  { region:"山形",district:"山形市",areaGroup:"東北",referenceDistrict:"仙台市（市平均）",multiplier:.80,station:"山形",lines:["山形新幹線","奧羽本線"] },
  { region:"福島",district:"福島市",areaGroup:"東北",referenceDistrict:"仙台市（市平均）",multiplier:.84,station:"福島",lines:["東北新幹線","東北本線"] },
  { region:"福島",district:"郡山市",areaGroup:"東北",referenceDistrict:"仙台市（市平均）",multiplier:.86,station:"郡山",lines:["東北新幹線","東北本線"],tier:"major" },
  { region:"福島",district:"磐城市",areaGroup:"東北",referenceDistrict:"仙台市（市平均）",multiplier:.78,station:"磐城",lines:["常磐線"] },
  { region:"茨城",district:"水戶市",areaGroup:"關東",referenceDistrict:"千葉市中央區",multiplier:.80,station:"水戶",lines:["常磐線","水郡線"] },
  { region:"茨城",district:"筑波市",areaGroup:"關東",referenceDistrict:"千葉市中央區",multiplier:.92,station:"筑波",lines:["筑波快線"],tier:"major" },
  { region:"栃木",district:"宇都宮市",areaGroup:"關東",referenceDistrict:"千葉市中央區",multiplier:.84,station:"宇都宮",lines:["東北新幹線","宇都宮線"] },
  { region:"群馬",district:"前橋市",areaGroup:"關東",referenceDistrict:"千葉市中央區",multiplier:.74,station:"前橋",lines:["兩毛線"] },
  { region:"群馬",district:"高崎市",areaGroup:"關東",referenceDistrict:"千葉市中央區",multiplier:.82,station:"高崎",lines:["上越新幹線","高崎線"],tier:"major" },
  { region:"群馬",district:"太田市",areaGroup:"關東",referenceDistrict:"千葉市中央區",multiplier:.76,station:"太田",lines:["東武伊勢崎線"] },
  { region:"神奈川",district:"相模原市",areaGroup:"關東",referenceDistrict:"橫濱市戶塚區",multiplier:.86,station:"相模原",lines:["橫濱線"] },
  { region:"新潟",district:"新潟市",areaGroup:"中部",referenceDistrict:"仙台市（市平均）",multiplier:.88,station:"新潟",lines:["上越新幹線","信越本線"] },
  { region:"富山",district:"富山市",areaGroup:"中部",referenceDistrict:"名古屋市（市平均）",multiplier:.72,station:"富山",lines:["北陸新幹線","高山本線"] },
  { region:"石川",district:"金澤市",areaGroup:"中部",referenceDistrict:"名古屋市（市平均）",multiplier:.84,station:"金澤",lines:["北陸新幹線","IR石川鐵道線"],tier:"major" },
  { region:"福井",district:"福井市",areaGroup:"中部",referenceDistrict:"名古屋市（市平均）",multiplier:.72,station:"福井",lines:["北陸新幹線","Hapi-line福井線"] },
  { region:"山梨",district:"甲府市",areaGroup:"中部",referenceDistrict:"八王子市",multiplier:.88,station:"甲府",lines:["中央本線"] },
  { region:"長野",district:"長野市",areaGroup:"中部",referenceDistrict:"名古屋市（市平均）",multiplier:.74,station:"長野",lines:["北陸新幹線","信越本線"] },
  { region:"長野",district:"松本市",areaGroup:"中部",referenceDistrict:"名古屋市（市平均）",multiplier:.76,station:"松本",lines:["篠之井線","大糸線"] },
  { region:"岐阜",district:"岐阜市",areaGroup:"中部",referenceDistrict:"名古屋市（市平均）",multiplier:.76,station:"岐阜",lines:["東海道本線","高山本線"] },
  { region:"靜岡",district:"靜岡市",areaGroup:"中部",referenceDistrict:"名古屋市（市平均）",multiplier:.86,station:"靜岡",lines:["東海道新幹線","東海道本線"] },
  { region:"靜岡",district:"濱松市",areaGroup:"中部",referenceDistrict:"名古屋市（市平均）",multiplier:.82,station:"濱松",lines:["東海道新幹線","東海道本線"] },
  { region:"愛知",district:"豐田市",areaGroup:"中部",referenceDistrict:"名古屋市（市平均）",multiplier:.84,station:"豐田市",lines:["名鐵三河線","愛知環狀鐵道線"] },
  { region:"愛知",district:"刈谷市",areaGroup:"中部",referenceDistrict:"名古屋市（市平均）",multiplier:.86,station:"刈谷",lines:["東海道本線","名鐵三河線"] },
  { region:"三重",district:"津市",areaGroup:"中部",referenceDistrict:"名古屋市（市平均）",multiplier:.70,station:"津",lines:["近鐵名古屋線","紀勢本線"] },
  { region:"三重",district:"四日市市",areaGroup:"中部",referenceDistrict:"名古屋市（市平均）",multiplier:.76,station:"近鐵四日市",lines:["近鐵名古屋線","湯之山線"] },
  { region:"滋賀",district:"大津市",areaGroup:"關西",referenceDistrict:"京都市（市平均）",multiplier:.84,station:"大津",lines:["琵琶湖線","京阪石山坂本線"] },
  { region:"奈良",district:"奈良市",areaGroup:"關西",referenceDistrict:"大阪市淀川區",multiplier:.78,station:"近鐵奈良",lines:["近鐵奈良線"] },
  { region:"和歌山",district:"和歌山市",areaGroup:"關西",referenceDistrict:"大阪市淀川區",multiplier:.68,station:"和歌山",lines:["阪和線","紀勢本線"] },
  { region:"兵庫",district:"姬路市",areaGroup:"關西",referenceDistrict:"神戶市（市平均）",multiplier:.78,station:"姬路",lines:["山陽新幹線","山陽本線"] },
  { region:"鳥取",district:"鳥取市",areaGroup:"中國",referenceDistrict:"廣島市（市平均）",multiplier:.68,station:"鳥取",lines:["山陰本線","因美線"] },
  { region:"島根",district:"松江市",areaGroup:"中國",referenceDistrict:"廣島市（市平均）",multiplier:.72,station:"松江",lines:["山陰本線"] },
  { region:"岡山",district:"岡山市",areaGroup:"中國",referenceDistrict:"廣島市（市平均）",multiplier:.90,station:"岡山",lines:["山陽新幹線","山陽本線"],tier:"major" },
  { region:"岡山",district:"倉敷市",areaGroup:"中國",referenceDistrict:"廣島市（市平均）",multiplier:.78,station:"倉敷",lines:["山陽本線","伯備線"] },
  { region:"廣島",district:"福山市",areaGroup:"中國",referenceDistrict:"廣島市（市平均）",multiplier:.80,station:"福山",lines:["山陽新幹線","山陽本線"] },
  { region:"山口",district:"山口市",areaGroup:"中國",referenceDistrict:"廣島市（市平均）",multiplier:.70,station:"新山口",lines:["山陽新幹線","山陽本線"] },
  { region:"德島",district:"德島市",areaGroup:"中國",referenceDistrict:"神戶市（市平均）",multiplier:.66,station:"德島",lines:["高德線","牟岐線"] },
  { region:"香川",district:"高松市",areaGroup:"中國",referenceDistrict:"廣島市（市平均）",multiplier:.78,station:"高松",lines:["予讚線","高德線"] },
  { region:"愛媛",district:"松山市",areaGroup:"中國",referenceDistrict:"廣島市（市平均）",multiplier:.76,station:"松山",lines:["予讚線","伊予鐵道市內線"] },
  { region:"高知",district:"高知市",areaGroup:"中國",referenceDistrict:"廣島市（市平均）",multiplier:.70,station:"高知",lines:["土讚線","土佐電交通"] },
  { region:"福岡",district:"北九州市",areaGroup:"九州",referenceDistrict:"福岡市（市平均）",multiplier:.78,station:"小倉",lines:["山陽新幹線","鹿兒島本線"],tier:"major" },
  { region:"佐賀",district:"佐賀市",areaGroup:"九州",referenceDistrict:"福岡市（市平均）",multiplier:.68,station:"佐賀",lines:["長崎本線"] },
  { region:"長崎",district:"長崎市",areaGroup:"九州",referenceDistrict:"福岡市（市平均）",multiplier:.78,station:"長崎",lines:["西九州新幹線","長崎本線"] },
  { region:"熊本",district:"熊本市",areaGroup:"九州",referenceDistrict:"福岡市（市平均）",multiplier:.82,station:"熊本",lines:["九州新幹線","鹿兒島本線"] },
  { region:"大分",district:"大分市",areaGroup:"九州",referenceDistrict:"福岡市（市平均）",multiplier:.74,station:"大分",lines:["日豐本線","久大本線"] },
  { region:"宮崎",district:"宮崎市",areaGroup:"九州",referenceDistrict:"福岡市（市平均）",multiplier:.70,station:"宮崎",lines:["日豐本線"] },
  { region:"鹿兒島",district:"鹿兒島市",areaGroup:"九州",referenceDistrict:"福岡市（市平均）",multiplier:.76,station:"鹿兒島中央",lines:["九州新幹線","鹿兒島本線"] },
  { region:"沖繩",district:"那霸市",areaGroup:"九州",referenceDistrict:"福岡市（市平均）",multiplier:.92,station:"縣廳前",lines:["沖繩都市單軌電車"],tier:"major" }
];

const secondStageRates: RentRate[] = secondStageMarketSpecs.flatMap(spec => {
  const reference = legacyRentRates.find(rate => rate.district === spec.referenceDistrict);
  if (!reference) return [];
  return [{
    region: spec.region,
    district: spec.district,
    r1: (parseFloat(reference.r1) * spec.multiplier).toFixed(1),
    k1: (parseFloat(reference.k1) * spec.multiplier).toFixed(1),
    ldk1: (parseFloat(reference.ldk1) * spec.multiplier).toFixed(1),
    ldk2: (parseFloat(reference.ldk2) * spec.multiplier).toFixed(1),
    areaGroup: spec.areaGroup,
    sourceDate: "2026-03",
    confidence: "limited",
    verificationStatus: "modeled_unverified",
    sourceNote: `尚未完成當地行情查證，暫以${spec.referenceDistrict.replace("（市平均）", "")}行情建立模型參考`
  }];
});

const marketSeedRates = [...legacyRentRates, ...derivedWardRates, ...secondStageRates];

export const prefectures: PrefectureRecord[] = Array.from(new Set(marketSeedRates.map(rate => rate.region))).map(name => ({
  id: stableId("pref", name),
  name,
  areaGroup: marketSeedRates.find(rate => rate.region === name)?.areaGroup || AREA_BY_PREFECTURE[name] || "其他"
}));

export const municipalities: MunicipalityRecord[] = marketSeedRates.map(rate => ({
  id: stableId("mun", rate.region, rate.district),
  prefectureId: stableId("pref", rate.region),
  name: rate.district,
  level: municipalityLevel(rate.district)
}));

export const rentSnapshots: RentSnapshotRecord[] = marketSeedRates.flatMap(rate => {
  const municipalityId = stableId("mun", rate.region, rate.district);
  const effectiveDate = rate.sourceDate ? `${rate.sourceDate}-01` : "2026-01-01";
  const isAtHomeCityAverage = Boolean(rate.sourceDate) && rate.confidence !== "limited";
  const layouts: LayoutCode[] = ["r1", "k1", "ldk1", "ldk2"];
  return layouts.map(layout => ({
    id: stableId("rent", municipalityId, layout, effectiveDate),
    municipalityId,
    layout,
    monthlyRentYen: Math.round(parseFloat(rate[layout]) * 10000),
    includesManagementFee: isAtHomeCityAverage ? true : null,
    effectiveDate,
    sourceLabel: rate.sourceNote || "Linus 租金行情整理",
    sourceUrl: isAtHomeCityAverage ? AT_HOME_2026_URL : null,
    confidence: rate.confidence || "medium",
    verificationStatus: rate.verificationStatus || "verified_source",
    sampleSize: null
  }));
});

const lineMap = new Map<string, RailwayLineRecord>();
const stationRows: StationRecord[] = [];
const stationLineRows: StationLineRecord[] = [];

for (const municipality of municipalities) {
  for (const station of legacyDistrictStations[municipality.name] || []) {
    const stationId = stableId("station", municipality.id, station.name);
    stationRows.push({ id: stationId, municipalityId: municipality.id, name: station.name, marketTier: station.type });
    for (const lineName of station.lines) {
      const lineId = stableId("line", lineName);
      if (!lineMap.has(lineId)) lineMap.set(lineId, { id: lineId, name: lineName, operator: null });
      stationLineRows.push({ stationId, railwayLineId: lineId });
    }
  }
}

for (const spec of secondStageMarketSpecs) {
  const municipality = municipalities.find(item => item.name === spec.district && item.prefectureId === stableId("pref", spec.region));
  if (!municipality) continue;
  const stationId = stableId("station", municipality.id, spec.station);
  if (!stationRows.some(item => item.id === stationId)) {
    stationRows.push({ id: stationId, municipalityId: municipality.id, name: spec.station, marketTier: spec.tier || "regular" });
  }
  for (const lineName of spec.lines) {
    const lineId = stableId("line", lineName);
    if (!lineMap.has(lineId)) lineMap.set(lineId, { id: lineId, name: lineName, operator: null });
    if (!stationLineRows.some(item => item.stationId === stationId && item.railwayLineId === lineId)) {
      stationLineRows.push({ stationId, railwayLineId: lineId });
    }
  }
}

export const stations = stationRows;
export const railwayLines = Array.from(lineMap.values());
export const stationLines = stationLineRows;

const prefectureById = new Map(prefectures.map(item => [item.id, item]));
const municipalityById = new Map(municipalities.map(item => [item.id, item]));
const lineById = new Map(railwayLines.map(item => [item.id, item]));
const stationLinesByStation = new Map<string, StationLineRecord[]>();
for (const row of stationLines) stationLinesByStation.set(row.stationId, [...(stationLinesByStation.get(row.stationId) || []), row]);

export function getCurrentRentRates(): RentRate[] {
  return municipalities.map(municipality => {
    const prefecture = prefectureById.get(municipality.prefectureId)!;
    const current = (layout: LayoutCode) => rentSnapshots
      .filter(snapshot => snapshot.municipalityId === municipality.id && snapshot.layout === layout)
      .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate))[0];
    const reference = current("k1");
    return {
      region: prefecture.name,
      district: municipality.name,
      r1: (current("r1").monthlyRentYen / 10000).toFixed(1),
      k1: (reference.monthlyRentYen / 10000).toFixed(1),
      ldk1: (current("ldk1").monthlyRentYen / 10000).toFixed(1),
      ldk2: (current("ldk2").monthlyRentYen / 10000).toFixed(1),
      areaGroup: prefecture.areaGroup as RentRate["areaGroup"],
      sourceDate: reference.effectiveDate.slice(0, 7),
      confidence: reference.confidence,
      verificationStatus: reference.verificationStatus,
      sourceNote: reference.sourceLabel
    };
  });
}

export function getDistrictStations(): Record<string, StationInfo[]> {
  const result: Record<string, StationInfo[]> = {};
  for (const station of stations) {
    const municipality = municipalityById.get(station.municipalityId)!;
    const lineNames = (stationLinesByStation.get(station.id) || []).map(row => lineById.get(row.railwayLineId)!.name);
    result[municipality.name] = [...(result[municipality.name] || []), { name: station.name, type: station.marketTier, lines: lineNames }];
  }
  return result;
}

// Compatibility projections used by the current UI while all consumers migrate to repository queries.
export const rentRates = getCurrentRentRates();
export const districtStations = getDistrictStations();

export function getMarketDataStats() {
  return {
    prefectures: prefectures.length,
    municipalities: municipalities.length,
    stations: stations.length,
    railwayLines: railwayLines.length,
    stationLineLinks: stationLines.length,
    rentSnapshots: rentSnapshots.length,
    latestUpdate: rentSnapshots.reduce((latest, row) => row.effectiveDate > latest ? row.effectiveDate : latest, "")
  };
}
