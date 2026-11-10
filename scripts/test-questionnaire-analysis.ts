/** 固定亂數種子的問卷 → 文字 → 條件／AI 整合測試。加 --live=8 可驗證真實 AI。 */
import assert from 'node:assert/strict';
import { requirementPrompt } from '../src/lib/findHome/lead.js';
import { requirementToCriteria } from '../src/lib/findHome/calculatorBridge.js';
import { MUST_HAVE_OPTIONS, type Requirement } from '../src/lib/findHome/schema.js';
import { enrichRentCriteriaFromPrompt, resolveVisaCategory, type RentSearchCriteria } from '../src/lib/rentAnalysis.js';
import { resolveSearchScope, buildAxisVerdicts } from '../src/lib/requirementVerdict.js';

let seed = 20261110;
function random() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }
const pick = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)];
const cases: Requirement[] = Array.from({length: 160}, (_, i) => {
  const rentMaxMan = pick([8, 9.5, 12, 15, 20, 25, 35]);
  return {
    moveIn: pick(['1m', '2m', '3m', 'flexible', 'date'] as const), moveInDate: '2027-03-15',
    reasons: ['commute'], residence: pick(['japan', 'overseas'] as const), entryDate: '2027-02-20',
    visaType: pick(['日本籍', '留學', '技術・人文知識・國際業務', '永住者', '打工度假'] as const),
    areas: pick(['中野 高圓寺 山手線 池袋 秋葉原', '目黑區／世田谷區', '高円寺、池袋', '中野、東中野', '元住吉、日吉', '新宿區、澀谷區']),
    commuteTarget: pick(['新宿', '目黑', '惠比壽', '池袋']), occupants: pick([1, 2, 3]),
    layouts: i % 9 === 0 ? ['1R', '1K', '1LDK', '1DK'] : pick([['1R'], ['1K'], ['1LDK'], ['1K', '1DK'], ['1DK'], ['2K+', '2LDK+']] as Requirement['layouts'][]),
    minAreaSqm: pick([undefined, 20, 25, 30, 40]),
    walkMaxMin: pick([0, 5, 10, 15]), ageMaxYears: pick([0, 5, 10, 20, 30]),
    structure: pick(['any', 'non-wood', 'rc'] as const), rentMaxMan,
    rentIdealMan: pick([rentMaxMan, Math.round(rentMaxMan * 0.6 * 10) / 10]),
    initialCostMaxMan: pick([undefined, 30, 50, 100, 150]),
    mustHaves: MUST_HAVE_OPTIONS.filter(() => random() < .3).map(o => o.id), top3: [], adjustable: ['budget'],
  };
});
// 加入使用者回報案例及邊界案例，與亂數案例共用同一條端到端流程。
cases[0] = { ...cases[0], visaType: '日本籍', areas: '中野 高圓寺 山手線 池袋 秋葉原',
  commuteTarget: '目黑', layouts: ['1R','1K','1LDK','1DK'], rentIdealMan: 15, rentMaxMan: 25,
  initialCostMaxMan: 100, mustHaves: MUST_HAVE_OPTIONS.map(o=>o.id), moveIn:'1m' };
cases[1] = { ...cases[1], layouts: ['1DK'], mustHaves: [], minAreaSqm: undefined,
  walkMaxMin: 0, ageMaxYears: 0, structure: 'any', initialCostMaxMan: undefined, occupants: 1 };
const failures: {case: number; field: string; expected: unknown; actual: unknown}[] = [];
function check(index: number, field: string, actual: unknown, expected: unknown) {
  try { assert.deepEqual(actual, expected); } catch { failures.push({case: index, field, expected, actual}); }
}
for (const [i, req] of cases.entries()) {
  const prompt = requirementPrompt(req);
  const source = requirementToCriteria(req);
  const criteria = enrichRentCriteriaFromPrompt(source, prompt);
  check(i, 'monthly budget', criteria.maxBudget, req.rentMaxMan * 10000);
  check(i, 'ideal budget', criteria.minBudget, Math.round(req.rentIdealMan * 10000));
  check(i, 'application channel', criteria.applicationChannel, req.residence === 'overseas' ? 'overseas' : 'domestic');
  check(i, 'initial cost', criteria.initialCostBudget ?? null, req.initialCostMaxMan ? req.initialCostMaxMan * 10000 : null);
  check(i, 'unresolved areas', resolveSearchScope(criteria).unresolvedLocations, []);
  check(i, 'false 山手 station', criteria.stations?.includes('山手'), false);
  check(i, 'prompt placeholder', prompt.includes('—'), false);
  check(i, 'prompt newlines', prompt.includes('\n'), true);
}
console.log(`Seed 20261110: ${cases.length} questionnaire round trips, ${failures.length} failures.`);
const liveCount = Number(process.argv.find(arg => arg.startsWith('--live='))?.split('=')[1] || 0);
if (liveCount) {
  const {config} = await import('dotenv'); config({path: '.env.local', quiet: true});
  const {default: handler} = await import('../api/rent-analysis.js');
  const flagFields = { 'autolock': 'autoLock', 'separate-bath': 'separateBath', 'elevator': 'elevator', 'pets': 'petsAllowed', 'washbasin': 'washbasin', 'bidet': 'bidet', 'free-internet': 'freeInternet', 'furnished': 'furnished', 'no-key-money': 'noKeyMoney', 'no-deposit': 'noDeposit', 'city-gas': 'cityGasRequired', 'balcony': 'balcony' } as const;
  for (let i=0; i<Math.min(liveCount,cases.length); i++) {
    const req = cases[i]; let data: any; let status = 200;
    const res = {setHeader(){},status(code: number){status=code;return this},json(value: any){data=value;return this}};
    await handler({method:'POST',headers:{},body:{prompt:requirementPrompt(req)}},res);
    if (status !== 200 || !data?.criteria) { check(i,'API success', data?.error, 'success'); continue; }
    const c: RentSearchCriteria = data.criteria;
    check(i,'AI monthly budget',c.maxBudget,Math.round(req.rentMaxMan*10000));
    if (req.rentIdealMan !== req.rentMaxMan) check(i,'AI ideal budget',c.minBudget,Math.round(req.rentIdealMan*10000));
    check(i,'AI initial cost',c.initialCostBudget ?? null, req.initialCostMaxMan ? req.initialCostMaxMan*10000 : null);
    check(i,'AI visa',resolveVisaCategory(c.visaType),resolveVisaCategory(req.visaType));
    check(i,'AI unresolved areas',resolveSearchScope(c).unresolvedLocations,[]);
    check(i,'AI false 山手 station',c.stations?.includes('山手'),false);
    check(i,'AI geographic scope',[...resolveSearchScope(c).districts].sort(),[...resolveSearchScope(requirementToCriteria(req)).districts].sort());
    check(i,'AI walk',c.walkMinutes ?? null,req.walkMaxMin || null);
    check(i,'AI age',c.buildingAgeMax ?? null,req.ageMaxYears || null);
    check(i,'AI area',c.areaMin ?? null,req.minAreaSqm || null);
    check(i,'AI occupants',c.householdSize,req.occupants);
    check(i,'AI application channel',c.applicationChannel,req.residence === 'overseas' ? 'overseas' : 'domestic');
    if (req.structure==='rc') check(i,'AI RC structure',/RC|SRC|鋼筋|钢筋/i.test(c.structure || ''),true);
    if (req.structure==='non-wood') check(i,'AI non-wood structure',/非木造|鐵骨|鉄骨|RC|SRC|S造/i.test(c.structure || ''),true);
    if (req.moveIn === 'date') check(i,'AI move-in date',c.moveInTiming?.includes(req.moveInDate!),true);
    else if (req.moveIn !== 'flexible') check(i,'AI move-in period',c.moveInTiming?.replace(/\s/g,''),req.moveIn[0]+'個月內');
    check(i,'AI room',c.roomType,requirementToCriteria({...req, layouts: [...req.layouts].sort((a,b)=> ['1R','1K','1DK','2K+','1LDK','2LDK+'].indexOf(b)-['1R','1K','1DK','2K+','1LDK','2LDK+'].indexOf(a))}).roomType);
    for (const [id,field] of Object.entries(flagFields)) check(i,`AI flag ${id}`,Boolean(c[field as keyof RentSearchCriteria]),req.mustHaves.includes(id as any));
    for (const [id,pattern] of [['indoor-washer',/室[內内]洗衣[機机]|室内洗濯機/],['south-facing',/朝南|南向/]] as const) {
      if(req.mustHaves.includes(id)) check(i,`AI need ${id}`,pattern.test(JSON.stringify([c.otherNeeds,c.unverifiedConditions])),true);
    }
    if (req.mustHaves.includes('second-floor')) check(i,'AI floor',c.floorMin,2);
    if (req.mustHaves.includes('two-burner')) check(i,'AI burners',c.gasBurnersMin,2);
    if (req.initialCostMaxMan) {
      const axis=buildAxisVerdicts(c,data.recommendations).find(a=>a.key==='initialCost');
      if (req.initialCostMaxMan/req.rentMaxMan<4.5) check(i,'AI initial ratio',axis?.headline.includes(`${(req.initialCostMaxMan/req.rentMaxMan).toFixed(1)} 倍`),true);
    }
    console.log(`Live ${i+1}/${liveCount}: ${JSON.stringify({budget:c.maxBudget,initial:c.initialCostBudget,room:c.roomType,areas:c.districts,failures:failures.filter(f=>f.case===i)})}`);
  }
}
if(failures.length){ console.log(JSON.stringify(failures,null,2)); process.exitCode=1; }
else console.log('All questionnaire analysis invariants passed.');
