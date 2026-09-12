import { districtStations, rentRates } from '../../data/housingMarket.js';
export const districtAreaGroup = (district: string) =>
  rentRates.find(rate => rate.district === district)?.areaGroup || null;


export const stationAreaGroups = (stationName: string) => {
  const normalized = stationName.trim().replace(/[駅站\s]/g, "").toLowerCase();
  if (!normalized) return new Set<string>();
  const groups = new Set<string>();
  for (const [district, stations] of Object.entries(districtStations)) {
    if (stations.some(station => station.name.trim().replace(/[駅站\s]/g, "").toLowerCase() === normalized)) {
      const group = districtAreaGroup(district);
      if (group) groups.add(group);
    }
  }
  return groups;
};
