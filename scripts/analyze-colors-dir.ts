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
const hexRegex = /#([0-9a-fA-F]{3,8})\b/g;

const dirStats: Record<string, { totalMatches: number; colors: Set<string> }> = {};
const componentColors: Record<string, { count: number; files: Set<string> }> = {};

for (const file of files) {
  const topDir = file.split("/")[1] || "root";
  const subDir = file.split("/").slice(0, 3).join("/");
  if (!dirStats[subDir]) dirStats[subDir] = { totalMatches: 0, colors: new Set() };
  
  const content = fs.readFileSync(file, "utf8");
  let match;
  while ((match = hexRegex.exec(content)) !== null) {
    const hex = ("#" + match[1]).toLowerCase();
    dirStats[subDir].totalMatches++;
    dirStats[subDir].colors.add(hex);

    if (file.startsWith("src/components") || file.startsWith("src/lib/ui") || file === "src/App.tsx") {
      if (!componentColors[hex]) componentColors[hex] = { count: 0, files: new Set() };
      componentColors[hex].count++;
      componentColors[hex].files.add(file);
    }
  }
}

console.log("=== COLOR USAGE BY DIRECTORY ===");
for (const [dir, stats] of Object.entries(dirStats)) {
  console.log(`${dir.padEnd(25)} | matches: ${String(stats.totalMatches).padStart(5)} | unique colors: ${stats.colors.size}`);
}

console.log("\n=== COMPONENT & UI ONLY COLORS (Sorted by count) ===");
const compSorted = Object.entries(componentColors).sort((a, b) => b[1].count - a[1].count);
console.log(`Unique colors in UI components: ${compSorted.length}`);
for (const [hex, data] of compSorted.slice(0, 60)) {
  const fileNames = Array.from(data.files).map(f => path.basename(f)).slice(0, 3).join(", ");
  console.log(`${hex.padEnd(9)} | count: ${String(data.count).padStart(4)} | files: ${String(data.files.size).padStart(2)} | in: ${fileNames}`);
}
