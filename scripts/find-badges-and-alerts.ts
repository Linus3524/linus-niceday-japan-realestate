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

interface BadgeAlertFinding {
  file: string;
  line: number;
  snippet: string;
  border?: string;
  bg?: string;
  text?: string;
}

const findings: BadgeAlertFinding[] = [];

// Regex to capture border-[#...] bg-[#...] text-[#...] or Tailwind classes
const comboRegex = /(?:class(?:Name)?=["'\`])([^"'\`]*(?:bg-|border-|text-)[^"'\`]*)(?:["'\`])/g;

for (const file of files) {
  if (file.includes("data/stationData") || file.includes("analyze-colors")) continue;
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split("\n");

  lines.forEach((line, idx) => {
    let match;
    while ((match = comboRegex.exec(line)) !== null) {
      const cls = match[1];
      const hasBg = /bg-\[?(#[0-9a-fA-F]+|[a-z]+-[0-9]+|white|transparent)\]?/.test(cls);
      const hasBorder = /border(?:-[trblxy])?-\[?(#[0-9a-fA-F]+|[a-z]+-[0-9]+)\]?/.test(cls) || cls.includes("border ");
      const hasText = /text-\[?(#[0-9a-fA-F]+|[a-z]+-[0-9]+)\]?/.test(cls);

      if ((hasBg && hasBorder) || (hasBg && hasText) || cls.includes("statusBadge") || cls.includes("criteriaTag")) {
        findings.push({
          file: path.relative(process.cwd(), file),
          line: idx + 1,
          snippet: cls.trim(),
        });
      }
    }
  });
}

console.log(`Total badge/alert/card class patterns found: ${findings.length}\n`);

// Group by potential color clashes or muddy colors
const muddyHexes = [
  "#d7a64a", "#b45309", "#dcc8a1", "#fff9ed", "#7a5a1f", "#eab879", "#fffdf5", 
  "#854d0e", "#76511f", "#66583d", "#fde68a", "#fef9c3", "#fef08a", "#fef3c7", 
  "#fffbeb", "#f4e8cb", "#f1d59b", "#f0e0be", "#d7c447", "#c1a470", "#9c5e31", 
  "#b87333", "#b76e00", "#8b4513", "#75571e", "#78350f", "#8a4329", "#fed7aa", "#ffedd5", "#fb923c", "#9a3412"
];

const muddyFindings = findings.filter(f => 
  muddyHexes.some(hex => f.snippet.toLowerCase().includes(hex)) ||
  /amber|yellow|orange/.test(f.snippet)
);

console.log(`=== MUDDY / YELLOW / AMBER PATTERNS (${muddyFindings.length}) ===`);
muddyFindings.slice(0, 40).forEach(f => {
  console.log(`[${f.file}:${f.line}]`);
  console.log(`    ${f.snippet}`);
});
