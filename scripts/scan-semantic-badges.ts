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
    } else if (/\.(tsx?)$/.test(file)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const files = walk("src");

// Scan all status/badge/alert/notice definitions
interface SemanticUsage {
  file: string;
  category: string;
  details: string;
}

const semanticList: SemanticUsage[] = [];

for (const file of files) {
  if (file.includes("stationData") || file.includes("analyze-")) continue;
  const content = fs.readFileSync(file, "utf8");
  const relFile = path.relative(process.cwd(), file);

  // Search for statusBadgeStyle, criteriaTagStyle, STATUS_STYLE, caution, notice, warning, error, badge
  const lines = content.split("\n");
  lines.forEach((line, idx) => {
    if (/statusBadgeStyle|criteriaTagStyle|STATUS_STYLE|badge|caution|notice|alert|warning|tagStyle/i.test(line)) {
      if (line.includes("border") || line.includes("bg-") || line.includes("text-") || line.includes("export const") || line.includes("RECORD") || line.includes("Record")) {
        semanticList.push({
          file: relFile,
          category: "Status / Badge / Alert",
          details: `L${idx + 1}: ${line.trim()}`
        });
      }
    }
  });
}

console.log(`Found ${semanticList.length} semantic lines across components.\n`);
semanticList.forEach(s => {
  console.log(`[${s.file}] ${s.details}`);
});
