const fs = require('fs');
let content = fs.readFileSync('src/components/RentMap.tsx', 'utf8');

const targetStats = `<div className="grid grid-cols-3 gap-1 text-center font-mono">
                    <div className="bg-white p-1 border border-zinc-200">
                      <div className="text-[9px] text-zinc-500 font-sans">1R (套房)</div>
                      <div className="text-xs font-bold text-zinc-800">{activeWard.r1} 萬円</div>
                    </div>
                    <div className="bg-white p-1 border border-zinc-200 ring-1 ring-[#b8241d]/10">
                      <div className="text-[9px] text-[#b8241d] font-sans font-bold">1K (主力單人)</div>
                      <div className="text-xs font-bold text-[#b8241d]">{activeWard.k1} 萬円</div>
                    </div>
                    <div className="bg-white p-1 border border-zinc-200">
                      <div className="text-[9px] text-zinc-500 font-sans">1LDK (客貨兩廳)</div>
                      <div className="text-xs font-bold text-zinc-800">{activeWard.ldk1} 萬円</div>
                    </div>
                  </div>`;

const replacementStats = `<div className="grid grid-cols-4 gap-1 text-center font-mono">
                    <div className="bg-white p-1 border border-zinc-200">
                      <div className="text-[9px] text-zinc-500 font-sans">1R (套房)</div>
                      <div className="text-xs font-bold text-zinc-800">{activeWard.r1} 萬円</div>
                    </div>
                    <div className="bg-white p-1 border border-zinc-200 ring-1 ring-[#b8241d]/10">
                      <div className="text-[9px] text-[#b8241d] font-sans font-bold">1K/1DK</div>
                      <div className="text-xs font-bold text-[#b8241d]">{activeWard.k1} 萬円</div>
                    </div>
                    <div className="bg-white p-1 border border-zinc-200">
                      <div className="text-[9px] text-zinc-500 font-sans">1LDK</div>
                      <div className="text-xs font-bold text-zinc-800">{activeWard.ldk1} 萬円</div>
                    </div>
                    <div className="bg-white p-1 border border-zinc-200">
                      <div className="text-[9px] text-zinc-500 font-sans">2LDK</div>
                      <div className="text-xs font-bold text-zinc-800">{activeWard.ldk2} 萬円</div>
                    </div>
                  </div>`;

content = content.replace(targetStats, replacementStats);

// Update title inside RentMap
content = content.replace('東京 23 區行情地圖', '2026 東京 23 區行情地圖');
content = content.replace('2026年 官方家賃相場', '2026年 官方家賃相場');

fs.writeFileSync('src/components/RentMap.tsx', content);
