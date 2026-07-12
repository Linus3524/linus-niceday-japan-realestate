const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Fix the double getModifierPrice
content = content.replace(/getModifierPrice\(getModifierPrice\(mod\.price\)\)/g, 'getModifierPrice(mod.price)');

// Replace the mapping loop body for plus modifiers
const plusMapTarget = `return (
                              <label 
                                key={originalIdx} 
                                className={\`p-2.5 border flex items-start gap-2.5 cursor-pointer transition-all \${
                                  isSelected ? "border-[#b8241d] bg-[#fdfaf9]" : "border-zinc-200 hover:border-zinc-300 bg-white"
                                }\`}
                              >
                                <input 
                                  type="checkbox" 
                                  checked={isSelected}
                                  onChange={() => toggleModifier(originalIdx)}
                                  className="mt-0.5 accent-[#b8241d] cursor-pointer"
                                />
                                <div className="flex-grow">
                                  <div className="font-semibold text-zinc-900 leading-tight">{mod.text}</div>
                                  <div className="text-[10px] text-zinc-500 mt-0.5 font-mono">+ {getModifierPrice(mod.price).toLocaleString()} 円 / 月</div>
                                </div>
                              </label>
                            );`;

const plusMapReplacement = `const isApplicable = !mod.applicableLayouts || mod.applicableLayouts.includes(calcRoomType);
                            const disabledClass = isApplicable ? "" : "opacity-40 grayscale cursor-not-allowed";
                            return (
                              <label 
                                key={originalIdx} 
                                title={isApplicable ? "" : "此條件不適用於目前選擇的房型"}
                                className={\`p-2.5 border flex items-start gap-2.5 transition-all \${
                                  isSelected && isApplicable ? "border-[#b8241d] bg-[#fdfaf9]" : "border-zinc-200 bg-white"
                                } \${disabledClass} \${isApplicable ? "hover:border-zinc-300 cursor-pointer" : ""}\`}
                              >
                                <input 
                                  type="checkbox" 
                                  checked={isSelected && isApplicable}
                                  onChange={() => { if(isApplicable) toggleModifier(originalIdx); }}
                                  disabled={!isApplicable}
                                  className="mt-0.5 accent-[#b8241d] cursor-pointer disabled:cursor-not-allowed"
                                />
                                <div className="flex-grow">
                                  <div className="font-semibold text-zinc-900 leading-tight">{mod.text}</div>
                                  <div className="text-[10px] text-zinc-500 mt-0.5 font-mono">+ {getModifierPrice(mod.price).toLocaleString()} 円 / 月</div>
                                </div>
                              </label>
                            );`;

content = content.replace(plusMapTarget, plusMapReplacement);

const minusMapTarget = `return (
                              <label 
                                key={originalIdx} 
                                className={\`p-2.5 border flex items-start gap-2.5 cursor-pointer transition-all \${
                                  isSelected ? "border-zinc-800 bg-zinc-50" : "border-zinc-200 hover:border-zinc-300 bg-white"
                                }\`}
                              >
                                <input 
                                  type="checkbox" 
                                  checked={isSelected}
                                  onChange={() => toggleModifier(originalIdx)}
                                  className="mt-0.5 accent-zinc-800 cursor-pointer"
                                />
                                <div className="flex-grow">
                                  <div className="font-semibold text-zinc-900 leading-tight">{mod.text}</div>
                                  <div className="text-[10px] text-green-700 mt-0.5 font-mono">− {Math.abs(getModifierPrice(mod.price)).toLocaleString()} 円 / 月</div>
                                </div>
                              </label>
                            );`;

const minusMapReplacement = `const isApplicable = !mod.applicableLayouts || mod.applicableLayouts.includes(calcRoomType);
                            const disabledClass = isApplicable ? "" : "opacity-40 grayscale cursor-not-allowed";
                            return (
                              <label 
                                key={originalIdx} 
                                title={isApplicable ? "" : "此條件不適用於目前選擇的房型"}
                                className={\`p-2.5 border flex items-start gap-2.5 transition-all \${
                                  isSelected && isApplicable ? "border-zinc-800 bg-zinc-50" : "border-zinc-200 bg-white"
                                } \${disabledClass} \${isApplicable ? "hover:border-zinc-300 cursor-pointer" : ""}\`}
                              >
                                <input 
                                  type="checkbox" 
                                  checked={isSelected && isApplicable}
                                  onChange={() => { if(isApplicable) toggleModifier(originalIdx); }}
                                  disabled={!isApplicable}
                                  className="mt-0.5 accent-zinc-800 cursor-pointer disabled:cursor-not-allowed"
                                />
                                <div className="flex-grow">
                                  <div className="font-semibold text-zinc-900 leading-tight">{mod.text}</div>
                                  <div className="text-[10px] text-green-700 mt-0.5 font-mono">− {Math.abs(getModifierPrice(mod.price)).toLocaleString()} 円 / 月</div>
                                </div>
                              </label>
                            );`;

content = content.replace(minusMapTarget, minusMapReplacement);

fs.writeFileSync('src/App.tsx', content);
