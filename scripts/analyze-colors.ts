import * as fs from "fs";
import * as path from "path";

function walk(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== "node_modules" && file !== ".git" && file !== "dist" && file !== ".vercel") {
        walk(filePath, fileList);
      }
    } else if (/\.(tsx?|css)$/.test(file)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const files = walk("src");
const colorUsage: Record<string, { count: number; files: Set<string>; examples: string[] }> = {};
const hexRegex = /#([0-9a-fA-F]{3,8})\b/g;

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split("\n");
  lines.forEach((line, idx) => {
    let match;
    while ((match = hexRegex.exec(line)) !== null) {
      const hex = ("#" + match[1]).toLowerCase();
      if (!colorUsage[hex]) colorUsage[hex] = { count: 0, files: new Set(), examples: [] };
      colorUsage[hex].count++;
      colorUsage[hex].files.add(file);
      if (colorUsage[hex].examples.length < 3) {
        colorUsage[hex].examples.push(`${path.basename(file)}:${idx + 1}: ${line.trim().slice(0, 100)}`);
      }
    }
  });
}

const sorted = Object.entries(colorUsage).sort((a, b) => b[1].count - a[1].count);

console.log(`TOTAL UNIQUE HEX COLORS: ${sorted.length}\n`);

console.log("=== TOP 100 HEX COLORS BY USAGE FREQUENCY ===");
for (const [hex, data] of sorted.slice(0, 100)) {
  const fileNames = Array.from(data.files).map(f => path.basename(f)).slice(0, 3).join(", ");
  console.log(`${hex.padEnd(9)} | count: ${String(data.count).padStart(4)} | files: ${String(data.files.size).padStart(2)} | in: ${fileNames}`);
}

console.log("\n=== SPECIFIC COLOR FAMILIES ===");

function analyzeFamily(name: string, filterFn: (hex: string) => boolean) {
  console.log(`\n--- FAMILY: ${name} ---`);
  const family = sorted.filter(([hex]) => filterFn(hex));
  family.forEach(([hex, data]) => {
    console.log(`${hex.padEnd(9)} | count: ${String(data.count).padStart(4)} | files: ${String(data.files.size).padStart(2)}`);
    data.examples.slice(0, 2).forEach(ex => console.log(`    ↳ ${ex}`));
  });
}

// Check earthy yellow / brown / amber
analyzeFamily("Earthy Yellow / Muddy Amber / Brown", hex => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return false;
  // Yellowish/brownish/warm khaki: r > b, g > b, or specific list
  const list = ["#d7a64a", "#b45309", "#dcc8a1", "#fff9ed", "#7a5a1f", "#eab879", "#fffdf5", "#854d0e", "#76511f", "#66583d", "#fde68a", "#fef9c3", "#fef08a", "#fef3c7", "#fffbeb", "#f4e8cb", "#f1d59b", "#f0e0be", "#d7c447", "#c1a470", "#9c5e31", "#b87333", "#b76e00", "#8b4513", "#75571e", "#78350f", "#854d0e"];
  return list.includes(hex) || (r > 150 && g > 120 && b < 100 && r > g);
});

// Check greens
analyzeFamily("Greens (Emerald / Mint / Forest)", hex => {
  const list = ["#007d5a", "#00a174", "#e6f6f1", "#9ee2cf", "#1a2a22", "#3f5147", "#52635a", "#66736c", "#8a9590", "#dde3df", "#f5f8f6", "#00895d", "#ebf8f4", "#b4e6d5", "#e8f9f0", "#166534", "#dcfce7", "#86efac", "#bbf7d0", "#05b34c", "#05a847", "#00ba6e", "#07c160", "#06c755"];
  return list.includes(hex);
});

// Check blues / cyans / indigos
analyzeFamily("Blues & Indigos", hex => {
  const list = ["#0284c7", "#0369a1", "#075985", "#bae6fd", "#e0f2fe", "#f0f9ff", "#6366f1", "#4338ca", "#c7d2fe", "#eef2ff", "#1e65b8", "#7dd3fc", "#38257d", "#8f76d6"];
  return list.includes(hex);
});

// Check reds / oranges / warm alerts
analyzeFamily("Reds / Oranges / Salmon", hex => {
  const list = ["#b13818", "#e94e2b", "#fbdfd2", "#fff8f6", "#c81e1e", "#f28c28", "#ff5c1e", "#ff8c27", "#f07b00", "#f5a400", "#991b1b", "#fee2e2", "#f87171", "#fca5a5", "#fb923c", "#ffedd5", "#9a3412", "#c2410c", "#d4380d", "#d64022"];
  return list.includes(hex);
});
