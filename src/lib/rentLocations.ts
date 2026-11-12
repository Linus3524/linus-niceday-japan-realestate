import { districtStations, rentRates } from "../data/housingMarket.js";
import { toJapanesePlaceName, toJapaneseStationName } from "./transit.js";
import type { RentSearchCriteria } from "./rentAnalysis.js";

const placeKey = (value: string) => toJapanesePlaceName(value).replace(/\s/g, "");
const stationKey = (value: string) => placeKey(toJapaneseStationName(value));
const districtNames = new Map(rentRates.map(rate => [placeKey(rate.district), rate.district]));
const stationLocations = new Map<string, { name: string; districts: Set<string> }>();
const lineKey = (value: string) => placeKey(value).replace(/^JR/i, "").replace(/沿線$/, "");
const lineNames = new Map(Object.values(districtStations).flatMap(stations => stations.flatMap(station =>
  station.lines.map(line => [lineKey(line), line] as const))));
for (const [district, stations] of Object.entries(districtStations)) {
  for (const station of stations) {
    const key = stationKey(station.name);
    const location = stationLocations.get(key) || { name: station.name, districts: new Set<string>() };
    location.districts.add(district);
    stationLocations.set(key, location);
  }
}

/** 都道府縣範圍不能被當成同名車站或市區，例如「東京、千葉皆可」。 */
const prefectures = [...new Set(rentRates.map(rate => rate.region))];
export function normalizeRentPrefecture(input: string): string | null {
  const key = placeKey(input).replace(/(?:皆可|均可|都可|都可以|都行|全域|全境|不限|一帶|一帯|周邊|周辺)$/g, "");
  return prefectures.find(region => {
    const name = placeKey(region);
    return key === name || key === name.replace(/[都府県縣]$/, "") || key.replace(/[県縣]$/, "") === name;
  }) || null;
}

/** 修正模型把車站放入行政區、合併多地點或使用日文漢字的情形；未知地點仍保留待確認。 */
export function normalizeRentLocations(criteria: RentSearchCriteria): RentSearchCriteria {
  const districts = new Set<string>();
  const stations = new Set<string>();
  const lines = new Set<string>([...(criteria.lines || []), criteria.line].filter((value): value is string => Boolean(value)));
  const tokens = (values: (string | null | undefined)[]) => values
    .filter((value): value is string => typeof value === "string")
    .flatMap(value => stationLocations.has(stationKey(value)) ? [value.trim()] : value.split(/[、,，/／|\s]+/).map(part => part.trim()).filter(part => Boolean(part) && !/^(?:皆可|均可|都可|都可以|不限)$/.test(part)));
  const addLine = (input: string) => {
    const line = lineNames.get(lineKey(input));
    if (!line) return false;
    lines.add(line);
    return true;
  };
  const addStation = (input: string) => {
    const location = stationLocations.get(stationKey(input));
    if (!location) return false;
    stations.add(location.name);
    location.districts.forEach(district => districts.add(district));
    return true;
  };
  for (const input of tokens([...(criteria.districts || []), criteria.district])) {
    const region = normalizeRentPrefecture(input);
    if (region) { districts.add(region); continue; }
    const key = placeKey(input);
    const district = districtNames.get(key) || districtNames.get(`${key}区`) || districtNames.get(`${key}市`);
    if (district) districts.add(district);
    else if (!addLine(input) && !addStation(input)) districts.add(input);
  }
  for (const input of tokens([...(criteria.stations || []), criteria.station])) {
    if (!addLine(input) && !addStation(input)) stations.add(input);
  }
  return {
    ...criteria,
    district: [...districts][0] || null,
    districts: [...districts],
    station: criteria.station ? [...stations][0] || null : null,
    stations: [...stations],
    lines: [...lines],
  };
}
