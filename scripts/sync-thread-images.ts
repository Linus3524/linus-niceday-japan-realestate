import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { threadCategories } from "../src/data/featuredThreads";

const OUTPUT_DIRECTORY = path.resolve("public/thread-images");
const INDEX_FILE = path.resolve("src/data/threadImageIndex.ts");
// Threads embed 目前只在這個精簡 UA 回傳公開貼文媒體；完整 Chrome UA 反而會拿到 App 殼頁。
const USER_AGENT = "Mozilla/5.0";
const CONCURRENCY = 4;
const execFileAsync = promisify(execFile);

function postId(url: string) {
  return url.match(/\/post\/([A-Za-z0-9_-]+)/)?.[1] ?? "";
}

function findFirstPostImage(html: string) {
  const candidates = html.match(/https:\/\/[^"'\s<>]+?\.(?:jpe?g|png|webp)[^"'\s<>]*/gi) ?? [];
  return candidates
    .map(url => url.replaceAll("&amp;", "&").replaceAll("\\/", "/"))
    // Threads 個人頭像使用 t51.82787-19；貼文圖片使用 t51.82787-15。
    .find(url => /\/t51\.82787-15\//.test(url));
}

async function downloadPostImage(url: string) {
  const id = postId(url);
  if (!id) return null;

  try {
    // Threads 對 Node fetch 偶爾只回傳精簡殼頁；curl 的一般瀏覽器請求才包含公開 embed 媒體。
    const embedUrl = `${url.replace("www.threads.com", "www.threads.net")}/embed`;
    const { stdout: html } = await execFileAsync("curl", [
      "-L", "--max-time", "20", "-A", USER_AGENT, "-sS", embedUrl,
    ], { maxBuffer: 12 * 1024 * 1024 });
    const imageUrl = findFirstPostImage(html);
    if (!imageUrl) return null;

    const imageResponse = await fetch(imageUrl, { headers: { "User-Agent": USER_AGENT } });
    if (!imageResponse.ok) throw new Error(`image HTTP ${imageResponse.status}`);
    const contentType = imageResponse.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) throw new Error(`unexpected content type ${contentType}`);

    const image = new Uint8Array(await imageResponse.arrayBuffer());
    if (image.byteLength < 1_000) throw new Error("image response was too small");
    const destination = path.join(OUTPUT_DIRECTORY, `${id}.jpg`);
    await writeFile(destination, image);
    try {
      // 卡片只需要封面縮圖；限制長邊可避免把 Threads 1440px 原圖全部送給手機。
      await execFileAsync("sips", ["-Z", "960", "-s", "formatOptions", "76", destination]);
    } catch {
      // 非 macOS 環境沒有 sips 時仍保留原圖，不讓同步流程失敗。
    }
    return id;
  } catch (error) {
    console.warn(`[skip] ${id}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

async function main() {
  await mkdir(OUTPUT_DIRECTORY, { recursive: true });
  const urls = threadCategories.flatMap(category => category.threads.map(thread => thread.url));
  let cursor = 0;

  async function worker() {
    while (cursor < urls.length) {
      const url = urls[cursor++];
      const id = await downloadPostImage(url);
      if (id) console.log(`[image] ${id}`);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  const downloadedIds = (await readdir(OUTPUT_DIRECTORY))
    .filter(filename => filename.endsWith(".jpg"))
    .map(filename => filename.slice(0, -4))
    .sort();
  const entries = downloadedIds.map(id => `  ${JSON.stringify(id)}: ${JSON.stringify(`/thread-images/${id}.jpg`)},`).join("\n");
  const source = `// 由 npm run threads:sync-images 從公開 Threads 貼文產生；請勿手動編輯。\nexport const threadImageIndex: Record<string, string> = {\n${entries}\n};\n`;
  await writeFile(INDEX_FILE, source);
  console.log(`Downloaded ${downloadedIds.length}/${urls.length} Threads cover images.`);
}

await main();
