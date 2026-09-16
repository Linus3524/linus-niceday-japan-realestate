/** Map observations, never a crime score. Thresholds are product heuristics (v1). */
export interface ActivityElement {
  id?: number;
  type?: string;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
}

/**
 * 國土交通省「都市計畫決定 GIS 資料（用途地域）」XKT002 的官方地目。
 * 這是法定土地使用分區，不是地圖志工標記，所以能在 OSM 收錄不足的地區獨立佐證街區性質。
 */
export interface LandUseZone {
  /** 用途地域名，例如「第一種中高層住居専用地域」「準工業地域」。 */
  zone: string;
  /** 官方分類碼 youto_id；缺值時為 null。 */
  zoneId: number | null;
  /** 容積率，例如 "200%"。 */
  floorAreaRatio: string;
  /** 建蔽率，例如 "60%"。 */
  buildingCoverageRatio: string;
  /** 住居系用途地域（第一種低層住居專用～準住居）為 true。 */
  residentialZone: boolean;
  /** 商業系（近隣商業・商業）為 true。 */
  commercialZone: boolean;
  /** 工業系（準工業・工業・工業專用）為 true。 */
  industrialZone: boolean;
  city: string;
}

/** 官方人口統計：DID 人口集中地區與 250m 網格推計人口。 */
export interface NeighborhoodPopulation {
  /** 是否位於國勢調查「人口集中地區（DID）」內。 */
  denselyInhabited: boolean;
  /** DID 人口密度（人／km²）；非 DID 或缺值時為 null。 */
  densityPerSquareKm: number | null;
  /** 所在 250m 網格的推計總人口；缺值時為 null。 */
  meshPopulation: number | null;
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
  /** 官方用途地域；未取得時為 null。 */
  landUse?: LandUseZone | null;
  /** 官方人口統計；未取得時為 null。 */
  population?: NeighborhoodPopulation | null;
  /** 周邊 1.2km 內的保育園・幼稚園與福祉設施件數（國土數值情報）。 */
  careFacilities?: number;
  fetchedAt: string;
}

export const ACTIVITY_LABELS = ["活動較少", "住宅為主", "住商混合", "熱鬧商圈", "娛樂集中"] as const;

/** 住居系用途地域：住宅環境受法規保護，商業與工業設施設置受限。 */
const RESIDENTIAL_ZONE = /住居/;
/** 商業系用途地域：店鋪、飲食店可自由設置，白天人流集中。 */
const COMMERCIAL_ZONE = /商業/;
/** 工業系用途地域：準工業地域在日本多為住工混合的既成市街地。 */
const INDUSTRIAL_ZONE = /工業/;

/** 以官方用途地域名稱判斷系別；名稱同時含「住居」與「商業」時以前者為準（如「準住居地域」）。 */
export function classifyLandUse(zone: string): Pick<LandUseZone, "residentialZone" | "commercialZone" | "industrialZone"> {
  return {
    residentialZone: RESIDENTIAL_ZONE.test(zone),
    commercialZone: !RESIDENTIAL_ZONE.test(zone) && COMMERCIAL_ZONE.test(zone),
    industrialZone: !RESIDENTIAL_ZONE.test(zone) && INDUSTRIAL_ZONE.test(zone),
  };
}

/** 一看就不是住家的建物用途；其餘（含 building=yes）都視為住宅建物密度的證據。 */
const NON_RESIDENTIAL_BUILDING = /^(retail|commercial|industrial|office|warehouse|school|university|college|hospital|hotel|church|temple|shrine|public|civic|government|train_station|transportation|parking|garage|garages|shed|roof|greenhouse|barn|farm_auxiliary|service|kiosk|supermarket|stadium|sports_hall|grandstand|construction|ruins|no)$/;

function distance(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const rad = Math.PI / 180;
  const x = (b.lon - a.lon) * rad * Math.cos((a.lat + b.lat) * rad / 2);
  const y = (b.lat - a.lat) * rad;
  return Math.hypot(x, y) * 6371000;
}

/** 官方資料補充：用途地域、人口統計與生活照護設施件數。全部可選，缺任一項都不影響既有流程。 */
export interface OfficialContext {
  landUse?: LandUseZone | null;
  population?: NeighborhoodPopulation | null;
  careFacilities?: number;
}

export function analyzeNeighborhood(
  elements: ActivityElement[] | null,
  origin: { lat: number; lon: number },
  precise: boolean,
  fetchedAt = new Date().toISOString(),
  official: OfficialContext = {},
): NeighborhoodActivity {
  const landUse = official.landUse ?? null;
  const population = official.population ?? null;
  const careFacilities = official.careFacilities ?? 0;
  const result: NeighborhoodActivity = { level: null, status: "sparse", commercial: 0,
    entertainment: 0, residential: 0, aroundTheClock: 0, hoursKnown: 0, nearbyCommercial: 0,
    landUse, population, careFacilities, fetchedAt };
  // 定位只到街區、或圖資請求失敗時，官方用途地域與人口仍是有效資訊，照樣回傳給使用者閱讀，
  // 但不據以推估活動等級——等級的空間精度依賴完整門牌。
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
    // 日本的 OSM 建物絕大多數是國土地理院匯入的 building=yes，不會細分 house／apartments。
    // 實測川口市中青木 250m 內 705 棟，699 棟是 yes——只認 house／apartments 會數出 0 棟，
    // 整張卡變「待確認」。改成「有建物、且不是明確非住宅用途」就算住宅建物。
    if (t.building && !NON_RESIDENTIAL_BUILDING.test(t.building) && meters <= 250) result.residential++;
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

  // 官方資料後援：OSM 圖資在地方都市的建物與店家收錄率參差，上面的門檻可能全部落空。
  // 用途地域是法定分區、DID 是國勢調查結果，兩者都不依賴志工標記，可在圖資不足時支撐判斷。
  // 只補「住宅為主」「住商混合」；熱鬧商圈與娛樂集中牽涉夜間人流，仍要求實際場所件數佐證。
  if (!result.level && landUse) {
    const denselyInhabited = population?.denselyInhabited === true;
    // 住居系用途地域＝法規保障的住宅環境。再有 DID 或網格人口佐證確實有人居住，即可判住宅為主。
    const populatedResidentialZone = landUse.residentialZone
      && (denselyInhabited || (population?.meshPopulation ?? 0) >= 100);
    if (populatedResidentialZone) {
      // 住居系地域本來就容許一定規模的店鋪；已收錄到足量商業場所時如實呈現住商混合。
      result.level = result.commercial >= 8 ? 3 : 2;
    } else if ((landUse.commercialZone || landUse.industrialZone) && denselyInhabited && result.commercial >= 3) {
      // 近隣商業與準工業地域在日本多為住工商混合的既成市街地，且位於人口集中地區。
      result.level = 3;
    }
  }
  if (result.level) result.status = "estimated";
  return result;
}
