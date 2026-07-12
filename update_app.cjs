const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Replace import
content = content.replace('tokyoRentRates,', 'rentRates,');

// 2. Update calcRoomType
content = content.replace(
  'const [calcRoomType, setCalcRoomType] = useState<"r1" | "k1" | "ldk1">("k1");',
  'const [calcRoomType, setCalcRoomType] = useState<"r1" | "k1" | "ldk1" | "ldk2">("k1");'
);

// 3. Update getCalcBaseRent
content = content.replace(
  /const getCalcBaseRent = \(\) => {[\s\S]*?};/,
  `const getCalcBaseRent = () => {
    const rate = rentRates.find(d => d.district === calcDistrict) || rentRates.find(d => d.district === "新宿區");
    if (!rate) return 0;
    const valueStr = rate[calcRoomType];
    return parseFloat(valueStr) * 10000;
  };

  const getDistrictScale = () => {
    const rate = rentRates.find(d => d.district === calcDistrict) || rentRates.find(d => d.district === "新宿區");
    if (!rate) return 1.0;
    // Scale modifier prices based on the district's average 1K rent compared to overall avg ~9.0
    // Keep it between 0.5 and 1.5
    return Math.max(0.5, Math.min(1.5, parseFloat(rate.k1) / 9.0));
  };
  
  const getModifierPrice = (modPrice: number) => {
    const scale = getDistrictScale();
    // Round to nearest 1000
    return Math.round((modPrice * scale) / 1000) * 1000;
  };`
);

// 4. Grouped select for districts
// The old code had:
// <select 
//   value={calcDistrict}
//   onChange={(e) => setCalcDistrict(e.target.value)}
//   className="w-full bg-white border border-[#1a1a18] py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#b8241d] rounded-none cursor-pointer"
// >
//   {tokyoRentRates.map(item => (
//     <option key={item.district} value={item.district}>
//       {item.district} (1K均價: {item.k1}萬円)
//     </option>
//   ))}
// </select>

const selectReplacement = `<select 
                          value={calcDistrict}
                          onChange={(e) => {
                            setCalcDistrict(e.target.value);
                            setCalcModifiers([]); // reset modifiers when region changes
                          }}
                          className="w-full bg-white border border-[#1a1a18] py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#b8241d] rounded-none cursor-pointer"
                        >
                          {Array.from(new Set(rentRates.map(r => r.region))).map(region => (
                            <optgroup key={region} label={region}>
                              {rentRates.filter(r => r.region === region).map(item => (
                                <option key={item.district} value={item.district}>
                                  {item.district} (1K均價: {item.k1}萬円)
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>`;

content = content.replace(/<select[\s\S]*?<\/select>/, selectReplacement);

// 5. Replace room types grid
const roomGridOriginal = `<div className="grid grid-cols-3 border border-[#1a1a18]">
                          {[
                            { id: "r1", label: "1R (套房)" },
                            { id: "k1", label: "1K/1DK" },
                            { id: "ldk1", label: "1LDK" }
                          ].map(type => (`;

const roomGridReplacement = `<div className="grid grid-cols-2 md:grid-cols-4 border border-[#1a1a18]">
                          {[
                            { id: "r1", label: "1R" },
                            { id: "k1", label: "1K/1DK" },
                            { id: "ldk1", label: "1LDK" },
                            { id: "ldk2", label: "2LDK" }
                          ].map(type => (`;

content = content.replace(roomGridOriginal, roomGridReplacement);

// Fix title '東京23區' to dynamic
content = content.replace(
  '<label className="text-xs font-bold text-zinc-700">選擇希望區域 (東京23區)：</label>',
  '<label className="text-xs font-bold text-zinc-700">選擇希望區域：</label>'
);
content = content.replace(
  '<h3 className="font-bold text-[#1a1a18]">東京 23 區行情估算</h3>',
  '<h3 className="font-bold text-[#1a1a18]">關西/關東地區 行情估算</h3>'
);

// 6 & 7. Calculate modifier prices & disable conditionally
// Replace checkbox rendering to use disabled state and calculated price
// It has 5 categories: "equipment", "building", "location", "subtraction", "others"
// Inside the map we use `mod.price.toLocaleString()`
// We also need to add a title for disabled items and lock them

content = content.replace(/mod\.price\.toLocaleString\(\)/g, 'getModifierPrice(mod.price).toLocaleString()');
content = content.replace(/mod\.price/g, 'getModifierPrice(mod.price)');

// Add disabled property logic in map loops.
// There are multiple maps:
// budgetModifiers.filter(m => m.category === "equipment").map((mod) => { ... })
// We'll replace the label and checkbox logic

const cbRegex = /<input\s+type="checkbox"\s+className="w-4 h-4 text-\[#b8241d\] border-zinc-300 rounded-none focus:ring-\[#b8241d\] cursor-pointer"[\s\S]*?onChange=\{[\s\S]*?\}[\s\S]*?\/>/g;

// To make this easier, let's parse and replace using a script that iterates over all checkboxes

fs.writeFileSync('src/App.tsx', content);
