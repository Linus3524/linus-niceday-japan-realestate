/** Map observations, never a crime score. Thresholds are product heuristics (v1). */
export interface ActivityElement {
  id?: number;
  type?: string;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
}

export interface NeighborhoodActivity {
  level: 1 | 2 | 3 | 4 | 5 | null;
  status: "estimated" | "sparse" | "unavailable" | "imprecise";
  commercial: number;
  entertainment: number;
  residential: number;
  aroundTheClock: number;
  hoursKnown: number;
  nearbyCommercial: number;
  fetchedAt: string;
}

export const ACTIVITY_LABELS = ["活動較少", "住宅為主", "住商混合", "熱鬧商圈", "娛樂集中"] as const;

function distance(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const rad = Math.PI / 180;
  const x = (b.lon - a.lon) * rad * Math.cos((a.lat + b.lat) * rad / 2);
  const y = (b.lat - a.lat) * rad;
  return Math.hypot(x, y) * 6371000;
}

export function analyzeNeighborhood(
  elements: ActivityElement[] | null,
  origin: { lat: number; lon: number },
  precise: boolean,
  fetchedAt = new Date().toISOString(),
): NeighborhoodActivity {
  const result: NeighborhoodActivity = { level: null, status: "sparse", commercial: 0,
    entertainment: 0, residential: 0, aroundTheClock: 0, hoursKnown: 0, nearbyCommercial: 0, fetchedAt };
  if (!precise) return { ...result, status: "imprecise" };
  if (!elements) return { ...result, status: "unavailable" };
  const seen = new Set<string>();
  const venues: Array<{ name: string; category: string; lat: number; lon: number }> = [];
  for (const item of elements) {
    const key = `${item.type}/${item.id}`;
    if (item.id !== undefined && seen.has(key)) continue;
    seen.add(key);
    const t = item.tags || {};
    const lat = item.lat ?? item.center?.lat;
    const lon = item.lon ?? item.center?.lon;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const point = { lat: lat!, lon: lon! };
    const meters = distance(origin, point);
    if (meters > 500) continue;
    if (/^(house|apartments|residential|detached|terrace)$/.test(t.building || "") && meters <= 250) result.residential++;
    const entertainment = /^(bar|pub|nightclub|karaoke)$/.test(t.amenity || "") || /^(adult_gaming_centre|amusement_arcade)$/.test(t.leisure || "");
    const commercial = (Boolean(t.shop) && !/^(no|vacant|disused)$/.test(t.shop)) || entertainment || /^(restaurant|cafe|fast_food|food_court|cinema)$/.test(t.amenity || "");
    if (!commercial || t.disused === "yes" || t.abandoned === "yes") continue;
    const name = (t.name || "").trim();
    const category = t.shop || t.amenity || t.leisure || "";
    // A shop is often tagged on both its building and its entrance.
    if (name && venues.some(v => v.name === name && v.category === category && distance(v, point) < 30)) continue;
    venues.push({ name, category, ...point });
    result.commercial++;
    if (meters <= 150) result.nearbyCommercial++;
    if (entertainment) result.entertainment++;
    if (t.opening_hours) result.hoursKnown++;
    // Do not guess complicated schedules or infer late hours from venue type.
    if (t.opening_hours?.trim() === "24/7") result.aroundTheClock++;
  }
  // Positive evidence only: sparse/empty maps cannot establish quietness.
  // Level 1 is reserved for verified local observations; map counts cannot prove quiet.
  if (result.entertainment >= 8 && result.commercial >= 20) result.level = 5;
  else if (result.commercial >= 35) result.level = 4;
  else if (result.residential >= 5 && result.commercial >= 8) result.level = 3;
  else if (result.residential >= 20 && result.commercial < 8) result.level = 2;
  if (result.level) result.status = "estimated";
  return result;
}
