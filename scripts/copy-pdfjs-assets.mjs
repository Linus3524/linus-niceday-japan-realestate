/**
 * 把 pdf.js 的 CMap 與標準字型複製到 public/pdfjs/。
 *
 * 日本不動產圖紙用的是 CID 編碼的日文字型（UniJIS-UCS2-H 等）。少了這些
 * 資源，pdf.js 會在 console 噴 "Ensure that the cMapUrl API parameter is
 * provided"，把整頁日文渲染成空白或亂碼——送給 AI 判讀時就會讀不出欄位。
 *
 * 走 public/ 而不是直接引用 node_modules，是為了讓正式環境也拿得到。
 */
import { cp, mkdir, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const pdfjsRoot = dirname(require.resolve("pdfjs-dist/package.json"));
const target = join(process.cwd(), "public", "pdfjs");

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
for (const dir of ["cmaps", "standard_fonts"]) {
  await cp(join(pdfjsRoot, dir), join(target, dir), { recursive: true });
  console.log(`copied pdfjs/${dir}`);
}
