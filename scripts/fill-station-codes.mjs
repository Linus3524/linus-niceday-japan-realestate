/**
 * 用 Google Search grounding 補齊 GTFS feed 沒有填 stop_code 的駅ナンバリング。
 *
 * 這是建置期腳本，不在請求路徑上執行：車站編號是模型最容易憑空生成的欄位，
 * 所以查回來的每一筆都要通過前綴一致性與既有 GTFS 代碼的交叉檢查才會寫入。
 *
 *   node scripts/fill-station-codes.mjs             # 補所有還沒查過的路線
 *   node scripts/fill-station-codes.mjs --line JR高崎線 --force
 *   node scripts/fill-station-codes.mjs --limit 5 --dry-run
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { GoogleGenAI } from "@google/genai";
import { config as loadEnv } from "dotenv";

loadEnv({ path: new URL("../.env.local", import.meta.url) });
loadEnv();

const GRAPH_PATH = new URL("../src/data/tokyoTransitGraph.json", import.meta.url);
const OUTPUT_PATH = new URL("../src/data/stationCodeOverrides.json", import.meta.url);
// 大多數駅ナンバリング是「字母前綴+數字」，但單一路線系統（例如新開通的路面電車／LRT）
// 有時官方就是用純數字編號，沒有字母前綴。兩種都接受，交給前綴一致性檢查去把真正錯亂的資料擋下來。
const CODE_PATTERN = /^[A-Z]{0,3}[0-9]{1,2}$/;

const args = process.argv.slice(2);
const flag = name => {
  const index = args.indexOf(name);
  return index === -1 ? null : args[index + 1];
};
const onlyLine = flag("--line");
const limit = Number(flag("--limit")) || Infinity;
const force = args.includes("--force");
const dryRun = args.includes("--dry-run");

const normalize = value => String(value || "").normalize("NFKC").replace(/駅$/, "").replace(/[〈（(].*$/, "").replace(/[\s・･]/g, "");
const prefixOf = code => code.match(/^[A-Z]{1,3}/)?.[0] || "";

/** 每條路線缺代碼的車站，以及 GTFS 已經給了代碼的車站（拿來當交叉檢查的基準）。 */
function collectGaps() {
  const graph = JSON.parse(readFileSync(GRAPH_PATH, "utf8"));
  const lines = new Map();
  for (const [name, edges] of Object.entries(graph.stations)) {
    for (const edge of edges) {
      const line = lines.get(edge.lineName) || { lineName: edge.lineName, operator: edge.operator, missing: new Set(), known: new Map() };
      if (edge.fromCode) line.known.set(name, edge.fromCode); else line.missing.add(name);
      if (edge.toCode) line.known.set(edge.to, edge.toCode); else line.missing.add(edge.to);
      lines.set(edge.lineName, line);
    }
  }
  for (const line of lines.values()) for (const name of line.known.keys()) line.missing.delete(name);
  return [...lines.values()].filter(line => line.missing.size).sort((left, right) => right.missing.size - left.missing.size);
}

// 兩段式查詢，仿照 src/lib/transitRouteApi.ts 的 searchRoutes：
// 第一段是自由格式、要求引用來源的搜尋，讓模型真的呼叫 Google Search 而不是憑訓練資料直接回答
// （實測發現：一旦同一次呼叫又要求嚴格 JSON 又掛搜尋工具，模型常會偷懶跳過搜尋，直接生成格式正確
// 但完全沒有 grounding 的答案）；第二段才用另一次「不掛搜尋工具」的呼叫，把第一段已查證的文字
// 整理成結構化 JSON，這一步不允許補充或更改數字。
function buildSearchPrompt(line) {
  const stations = [...line.missing].join("、");
  const known = [...line.known].slice(0, 6).map(([name, code]) => `${name}=${code}`).join("、");
  return `你必須實際使用 Google Search 工具搜尋網頁，不可以只依內部知識回答。

請查出日本鐵路「${line.lineName}」（營運公司：${line.operator}）的官方駅ナンバリング（車站編號）。
需要下列車站的編號：${stations}
${known ? `\n這條路線已知的正確編號（請確認你查到的編號體系與這些一致）：${known}` : ""}

規則：
1. 先確認這條路線「是否有」官方車站編號制度。很多地方交通線與路面電車根本沒有編號，這種情況必須誠實說沒有，不可以自行編造或推算。
2. 只回報你在鐵路公司官方網站、車站案內圖或維基百科等來源實際查到的編號，並註明來源。查不到的車站就明確標示查不到，不要用推算的方式填補。
3. 逐站列出「車站名：編號」，編號格式為英文字母加數字，例如 JU07、JJ10、U15。`;
}

function buildExtractPrompt(line, searchText) {
  const stations = [...line.missing].join("、");
  return `以下是已使用 Google Search 查證過的「${line.lineName}」駅ナンバリング研究。只能整理原文已經查到的資料，不可以補充、推測或更改任何編號；原文說查不到或這條路線沒有編號制度的車站，不要放進結果。

待補清單：${stations}

原文：
${searchText}

只輸出 JSON，不要有其他文字：
{"hasNumbering": true 或 false, "codes": {"車站名": "編號"}}`;
}

function validate(line, parsed) {
  if (!parsed || typeof parsed !== "object") return { ok: false, reason: "回應不是 JSON" };
  if (parsed.hasNumbering === false) return { ok: true, hasNumbering: false, codes: {} };

  const wanted = new Map([...line.missing].map(name => [normalize(name), name]));
  const alreadyKnown = new Set([...line.known.keys()].map(normalize));
  const knownPrefixes = new Set([...line.known.values()].map(prefixOf).filter(Boolean));
  const accepted = {};
  const rejected = [];

  for (const [rawName, rawCode] of Object.entries(parsed.codes || {})) {
    const code = String(rawCode || "").toUpperCase().normalize("NFKC").trim();
    const name = wanted.get(normalize(rawName));
    if (!name) {
      // 模型常會順便回覆已知車站的代碼來自我核對；那不是新資料，靜靜跳過即可。
      if (!alreadyKnown.has(normalize(rawName))) rejected.push(`${rawName}（不在待補清單）`);
      continue;
    }
    if (!CODE_PATTERN.test(code)) { rejected.push(`${rawName}=${rawCode}（格式不符）`); continue; }
    accepted[name] = code;
  }

  // 同一條路線的字母前綴必須一致；GTFS 已有代碼時，前綴還必須與 GTFS 相同。
  const counts = new Map();
  for (const code of Object.values(accepted)) counts.set(prefixOf(code), (counts.get(prefixOf(code)) || 0) + 1);
  if (!counts.size) {
    // 沒有任何新代碼——若不是因為格式/清單錯誤才被剔除，就只是模型沒查到新資料，不算失敗。
    if (!rejected.length) return { ok: true, hasNumbering: true, codes: {}, prefix: null, noNewData: true };
    return { ok: false, reason: `沒有任何可用編號（${rejected.join("、")}）` };
  }
  // 前綴可能是空字串（純數字編號，例如單一路線的 LRT/路面電車），所以不能用 falsy 判斷。
  const modal = [...counts].sort((left, right) => right[1] - left[1])[0][0];
  if (knownPrefixes.size && !knownPrefixes.has(modal)) {
    return { ok: false, reason: `前綴 ${modal} 與 GTFS 既有的 ${[...knownPrefixes].join("/")} 不符，整條捨棄` };
  }
  for (const [name, code] of Object.entries(accepted)) {
    if (prefixOf(code) !== modal) { rejected.push(`${name}=${code}（前綴不一致）`); delete accepted[name]; }
  }

  const seen = new Map();
  for (const [name, code] of Object.entries(accepted)) {
    if (seen.has(code)) { rejected.push(`${name}=${code}（與 ${seen.get(code)} 重複）`); delete accepted[name]; continue; }
    seen.set(code, name);
  }
  for (const [name, code] of line.known) {
    const clash = seen.get(code);
    if (clash && normalize(clash) !== normalize(name)) { rejected.push(`${clash}=${code}（與 GTFS 的 ${name} 衝突）`); delete accepted[clash]; }
  }

  if (!Object.keys(accepted).length) return { ok: false, reason: `全部被剔除（${rejected.join("、")}）` };
  return { ok: true, hasNumbering: true, codes: accepted, prefix: modal, rejected };
}

function sourceLinks(response) {
  const chunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const unique = new Map();
  for (const chunk of chunks) {
    const url = chunk?.web?.uri;
    if (typeof url === "string" && /^https?:\/\//.test(url)) unique.set(url, { title: String(chunk?.web?.title || "駅ナンバリング來源"), url });
  }
  return [...unique.values()].slice(0, 4);
}

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("缺少 GEMINI_API_KEY。請放進 .env.local 或用 `vercel env pull .env.local` 取得後再跑。");
  process.exit(1);
}

const output = existsSync(OUTPUT_PATH)
  ? JSON.parse(readFileSync(OUTPUT_PATH, "utf8"))
  : { generatedAt: null, note: "由 scripts/fill-station-codes.mjs 以 Google Search grounding 補齊，僅收錄通過交叉檢查的車站編號。", lines: {}, linesWithoutNumbering: [], sources: {} };

const ai = new GoogleGenAI({ apiKey });
const gaps = collectGaps().filter(line => (onlyLine ? line.lineName === onlyLine : true));
let processed = 0;

/**
 * 單次嘗試：搜尋 → 整理成 JSON → 驗證。回傳 { retry: true } 代表這次失敗的原因
 * 只是「搜尋工具這次沒被觸發」（google search 的觸發本身不是完全確定的，同一個
 * prompt 偶爾會直接跳過搜尋用內部知識回答），值得換一次呼叫再試；其他失敗原因
 * 直接回報、不重試。
 */
async function attemptLine(line) {
  let searchResponse;
  try {
    searchResponse = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [{ role: "user", parts: [{ text: buildSearchPrompt(line) }] }],
      config: { temperature: 0, tools: [{ googleSearch: {} }] }
    });
  } catch (error) {
    return { retry: false, reason: `搜尋失敗 ${String(error)}` };
  }

  const links = sourceLinks(searchResponse);
  if (!searchResponse.text) return { retry: true, reason: "搜尋沒有回應" };

  let parsed = null;
  try {
    const extractResponse = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [{ role: "user", parts: [{ text: buildExtractPrompt(line, searchResponse.text) }] }],
      config: { temperature: 0 }
    });
    parsed = JSON.parse(String(extractResponse.text || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""));
  } catch (error) {
    return { retry: false, reason: `整理成 JSON 失敗 ${String(error)}` };
  }

  // 只要模型有回報「待補清單裡的車站」有編號，就要有 grounding 引用才採信——
  // 車站代碼是模型最容易憑空生成的欄位。若模型只是重複已知代碼或誠實說沒有編號
  // （新資訊為零），不需要引用，最差就是這條線維持現狀，不會有誤植風險。
  const missingNormalized = new Set([...line.missing].map(normalize));
  const offersNewData = Object.keys(parsed?.codes || {}).some(name => missingNormalized.has(normalize(name)));
  if (offersNewData && !links.length) return { retry: true, reason: "回應沒有 grounding 引用" };

  const result = validate(line, parsed);
  if (!result.ok) return { retry: false, reason: result.reason };
  return { retry: false, ok: true, result, links };
}

for (const line of gaps) {
  if (processed >= limit) break;
  const done = output.lines[line.lineName] || output.linesWithoutNumbering.includes(line.lineName);
  if (done && !force) { console.log(`跳過 ${line.lineName}（已查過，加 --force 可重查）`); continue; }
  processed++;

  let outcome;
  for (let attempt = 1; attempt <= 3; attempt++) {
    outcome = await attemptLine(line);
    if (!outcome.retry) break;
    console.log(`… ${line.lineName}：第 ${attempt} 次嘗試沒有 grounding（${outcome.reason}），重試`);
  }

  if (!outcome.ok) { console.warn(`✗ ${line.lineName}：${outcome.reason}`); continue; }
  const { result, links } = outcome;
  if (result.noNewData) { console.log(`… ${line.lineName}：沒有查到待補清單裡的新代碼，維持現狀`); continue; }
  if (!result.hasNumbering) {
    console.log(`— ${line.lineName}：查證為無車站編號制度`);
    if (!output.linesWithoutNumbering.includes(line.lineName)) output.linesWithoutNumbering.push(line.lineName);
    delete output.lines[line.lineName];
    continue;
  }

  const filled = Object.keys(result.codes).length;
  console.log(`✓ ${line.lineName}：補上 ${filled}/${line.missing.size} 站（前綴 ${result.prefix}）${result.rejected?.length ? ` 剔除：${result.rejected.join("、")}` : ""}`);
  output.lines[line.lineName] = result.codes;
  output.sources[line.lineName] = links;
  output.linesWithoutNumbering = output.linesWithoutNumbering.filter(name => name !== line.lineName);
}

if (dryRun) {
  console.log("\n--dry-run：未寫入檔案");
} else if (processed) {
  output.generatedAt = new Date().toISOString();
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`);
  const total = Object.values(output.lines).reduce((sum, codes) => sum + Object.keys(codes).length, 0);
  console.log(`\n已寫入 ${OUTPUT_PATH.pathname}：${Object.keys(output.lines).length} 條路線、${total} 個車站編號。`);
}
