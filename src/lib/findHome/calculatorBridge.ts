import { normalizeRentPrefecture } from "../rentLocations.js";
import { rentRates } from "../../data/housingMarket.js";
import type { RentSearchCriteria, RoomType } from "../rentAnalysis.js";
import { toJapanesePlaceName } from "../transit.js";
import { emptyFindHomeForm, newIdempotencyKey, type FindHomeDraft } from "./draft.js";
import { CALCULATOR_HANDOFF_KEY, CALCULATOR_HANDOFF_TTL_MS, type RawCalculatorHandoff } from "./handoff.js";
import { requirementPrompt } from "./lead.js";
import { AGE_OPTIONS, VISA_TYPE_OPTIONS, WALK_OPTIONS, type MustHave, type Requirement } from "./schema.js";

/**
 * 費用試算 ↔ 找房問卷 的條件互轉。
 *   - 費用試算 → 問卷：客人算完行情按「把這些條件交給 Linus」，條件寫成問卷草稿，打開問卷就已填好。
 *   - 後台 → 費用試算：用客人的問卷條件打開費用試算，立刻看這個預算合不合理。
 *
 * 兩邊的簽證代號共用 src/lib/visaOptions.ts，設備項目也對齊，所以大部分可以一對一轉換；
 * 問卷的「地區」是自由文字，轉進費用試算時盡量辨識成行政區、路線與車站，認不出的就略過。
 */

export { CALCULATOR_HANDOFF_KEY } from "./handoff.js";

export interface CalculatorHandoff {
  /** 費用試算條件（結構化表單用）。 */
  criteria: RentSearchCriteria;
  /** 有問卷需求時，寫成一段描述帶進「描述需求」。 */
  prompt?: string;
  label: string;
}

/** 讀出並刪除交接資料（問卷格式會在這裡轉成費用試算條件）；過期或格式不對回 null。peek = true 時只看不刪。 */
export function takeCalculatorHandoff(peek = false): CalculatorHandoff | null {
  try {
    const raw = localStorage.getItem(CALCULATOR_HANDOFF_KEY);
    if (!raw) return null;
    const handoff = JSON.parse(raw) as RawCalculatorHandoff;
    const fresh = (handoff?.criteria || handoff?.requirement) && Date.now() - Number(handoff.createdAt) < CALCULATOR_HANDOFF_TTL_MS;
    if (!peek || !fresh) localStorage.removeItem(CALCULATOR_HANDOFF_KEY);
    if (!fresh) return null;
    const criteria = handoff.criteria
      ? (handoff.criteria as RentSearchCriteria)
      : requirementToCriteria(handoff.requirement as Requirement);
    return { criteria, prompt: handoff.requirement ? requirementPrompt(handoff.requirement) : undefined, label: handoff.label };
  } catch {
    return null;
  }
}

const ROOM_TO_LAYOUT: Record<RoomType, string> = { r1: "1R", k1: "1K", ldk1: "1LDK", ldk2: "2LDK+", ldk3: "2LDK+" };
const LAYOUT_TO_ROOM: Record<string, RoomType> = { "1R": "r1", "1K": "k1", "1DK": "k1", "1LDK": "ldk1", "2K+": "ldk1", "2LDK+": "ldk2" };

/** 問卷條件 ↔ 費用試算條件旗標。 */
const FLAG_MAP: { id: MustHave; read: (c: RentSearchCriteria) => boolean; write: (c: RentSearchCriteria) => void }[] = [
  { id: "second-floor", read: c => (c.floorMin ?? 0) >= 2, write: c => { c.floorMin = 2; } },
  { id: "pets", read: c => Boolean(c.petsAllowed), write: c => { c.petsAllowed = true; } },
  { id: "washbasin", read: c => Boolean(c.washbasin), write: c => { c.washbasin = true; } },
  { id: "bidet", read: c => Boolean(c.bidet), write: c => { c.bidet = true; } },
  { id: "autolock", read: c => Boolean(c.autoLock), write: c => { c.autoLock = true; } },
  { id: "elevator", read: c => Boolean(c.elevator), write: c => { c.elevator = true; } },
  { id: "separate-bath", read: c => Boolean(c.separateBath), write: c => { c.separateBath = true; } },
  { id: "furnished", read: c => Boolean(c.furnished), write: c => { c.furnished = true; } },
  { id: "no-key-money", read: c => Boolean(c.noKeyMoney), write: c => { c.noKeyMoney = true; } },
  { id: "no-deposit", read: c => Boolean(c.noDeposit), write: c => { c.noDeposit = true; } },
  { id: "free-internet", read: c => Boolean(c.freeInternet), write: c => { c.freeInternet = true; } },
  { id: "balcony", read: c => Boolean(c.balcony), write: c => { c.balcony = true; } },
  { id: "two-burner", read: c => (c.gasBurnersMin ?? 0) >= 2, write: c => { c.gasBurnersMin = 2; } },
  { id: "city-gas", read: c => Boolean(c.cityGasRequired), write: c => { c.cityGasRequired = true; } },
];

/** 取不小於 value 的最近選項（例如徒步 8 分 → 10 分內）。 */
function ceilOption(options: readonly { id: string }[], value: number | null | undefined): string | undefined {
  if (!value || value <= 0) return undefined;
  const numbers = options.map(option => Number(option.id)).filter(n => n > 0).sort((a, b) => a - b);
  const hit = numbers.find(n => n >= value);
  return hit ? String(hit) : undefined;
}

const toMan = (yen: number | null | undefined) => (yen && yen > 0 ? String(Math.round((yen / 10000) * 10) / 10) : "");

/** 費用試算的分析條件 → 問卷草稿。 */
export function criteriaToFindHomeDraft(criteria: RentSearchCriteria, now = Date.now()): FindHomeDraft {
  const form = emptyFindHomeForm();
  const req = form.requirement;
  const districts = [...(criteria.districts || []), criteria.district].filter(Boolean) as string[];
  const stations = [...(criteria.stations || []), criteria.station].filter(Boolean) as string[];
  const lines = [...(criteria.lines || []), criteria.line].filter(Boolean) as string[];
  req.areas = [...new Set([...districts.map(d => toJapanesePlaceName(d)), ...stations, ...lines])].join("、").slice(0, 120);
  req.commuteTarget = criteria.commuteStation || criteria.commuteStations?.[0] || "";
  req.occupants = criteria.householdSize && criteria.householdSize > 0 ? Math.min(8, criteria.householdSize) : 1;
  if (criteria.roomType && ROOM_TO_LAYOUT[criteria.roomType]) req.layouts = [ROOM_TO_LAYOUT[criteria.roomType]];
  if (criteria.areaMin) req.minAreaSqm = String(Math.round(criteria.areaMin));
  req.rentMaxMan = toMan(criteria.maxBudget);
  req.rentIdealMan = toMan(criteria.minBudget) || req.rentMaxMan;
  req.initialCostMaxMan = toMan(criteria.initialCostBudget);
  req.walkMaxMin = ceilOption(WALK_OPTIONS, criteria.walkMinutes);
  req.ageMaxYears = ceilOption(AGE_OPTIONS, criteria.buildingAgeMax);
  const structure = criteria.structure || "";
  req.structure = /RC|SRC|鋼筋/i.test(structure) ? "rc" : /鐵骨|鉄骨|S造/i.test(structure) ? "non-wood" : undefined;
  req.mustHaves = FLAG_MAP.filter(flag => flag.read(criteria)).map(flag => flag.id);
  if (criteria.applicationChannel === "overseas") req.residence = "overseas";
  else if (criteria.applicationChannel === "domestic") req.residence = "japan";
  if (criteria.visaType && VISA_TYPE_OPTIONS.some(option => option.id === criteria.visaType)) req.visaType = criteria.visaType;
  return { form, step: 1, idempotencyKey: newIdempotencyKey(), startedAt: now, prefilledFrom: "calculator" };
}

const normalizeDistrict = (value: string) => value.replace(/區/g, "区").trim();
const DISTRICT_NAMES = new Map(rentRates.map(rate => [normalizeDistrict(rate.district), rate.district] as const));

/** 問卷的自由文字地區 → 行政區／路線／車站（認不出的略過，由費用試算自己再比對一次）。 */
export function parseAreas(areas: string): { districts: string[]; lines: string[]; stations: string[] } {
  const tokens = areas.split(/[、,，\s/／・;；]+/).map(token => token.trim()).filter(Boolean);
  const districts: string[] = [];
  const lines: string[] = [];
  const stations: string[] = [];
  for (const token of tokens) {
    const prefecture = normalizeRentPrefecture(token);
    if (prefecture) { districts.push(prefecture); continue; }
    const jp = toJapanesePlaceName(token);
    const candidates = [token, jp, `${token}区`, `${jp}区`, `${token}市`, `${jp}市`].map(normalizeDistrict);
    const district = candidates.map(candidate => DISTRICT_NAMES.get(candidate)).find(Boolean);
    if (district) districts.push(district);
    else if (/線(沿線)?$/.test(token)) lines.push(token.replace(/沿線$/, ""));
    else stations.push(token.replace(/[駅站]$/, ""));
  }
  return { districts: [...new Set(districts)].slice(0, 4), lines: [...new Set(lines)].slice(0, 4), stations: [...new Set(stations)].slice(0, 6) };
}

/** 問卷需求 → 費用試算條件。 */
export function requirementToCriteria(req: Requirement): RentSearchCriteria {
  const layout = req.layouts.find(item => LAYOUT_TO_ROOM[item]);
  const { districts, lines, stations } = parseAreas(req.areas || "");
  const criteria: RentSearchCriteria = {
    roomType: layout ? LAYOUT_TO_ROOM[layout] : "k1",
    areaMin: req.minAreaSqm || null,
    minBudget: req.rentIdealMan ? Math.round(req.rentIdealMan * 10000) : null,
    maxBudget: req.rentMaxMan ? Math.round(req.rentMaxMan * 10000) : null,
    budgetIncludesFees: true,
    districts,
    district: districts[0] || null,
    lines,
    stations,
    walkMinutes: req.walkMaxMin || null,
    buildingAgeMax: req.ageMaxYears || null,
    structure: req.structure === "rc" ? "RC造" : req.structure === "non-wood" ? "鐵骨造" : null,
    commuteStation: req.commuteTarget || null,
    householdSize: req.occupants || null,
    initialCostBudget: req.initialCostMaxMan ? Math.round(req.initialCostMaxMan * 10000) : null,
    applicationChannel: req.residence === "overseas" ? "overseas" : "domestic",
    visaType: req.visaType && req.visaType !== "other" ? req.visaType : null,
  };
  for (const flag of FLAG_MAP) if (req.mustHaves.includes(flag.id)) flag.write(criteria);
  return criteria;
}
