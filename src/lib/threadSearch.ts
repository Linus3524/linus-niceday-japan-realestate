import { threadCategories, type FeaturedThread } from "../data/featuredThreads";
import { threadsSearchIndex } from "../data/threadsSearchIndex";
import { threadImageIndex } from "../data/threadImageIndex";
import { expandToken, extractKnownSearchTokens, tokenizeQuery } from "./search";

export type ThreadSearchContext = "all" | "rent" | "buy";

export interface RelatedThread {
  id: string;
  url: string;
  category: string;
  title: string;
  excerpt: string;
  score: number;
  imageUrl?: string;
}

export interface ThreadSearchResults {
  results: RelatedThread[];
  total: number;
}

interface ThreadDocument {
  thread: FeaturedThread;
  id: string;
  category: string;
  text: string;
  title: string;
  excerpt: string;
  titleText: string;
  leadingText: string;
  keywordText: string;
}

const SEARCH_RESULT_MIN_SCORE = 52;
const AI_RECOMMENDATION_MIN_SCORE = 78;
const TITLE_MAX_LENGTH = 46;
const EXCERPT_MAX_LENGTH = 150;
const GENERIC_AI_CONCEPTS = new Set(["物件", "房源", "房子", "房屋"]);
const BUY_INTENT = /買房|買日本房|購屋|置產|購入|房貸|住宅ローン|民泊|airbnb|一戶建|一戸建|修繕積立金|修繕基金|買付|固定資產稅|不動產取得稅|司法書士|殺價|砍價|議價/iu;
const RENT_INTENT = /租屋|租房|租約|退租|退房|解約|敷金|禮金|礼金|房租|家賃|租金|入住|審查|審査|保證公司|保証会社|合租|室友|水電瓦斯|更新料|先行契約|先行申請|看得到租不到|suumo/iu;

const TITLE_BOILERPLATE = /^(linus\s*住好日|日本租房|日本買房|日本生活|日本不動產|租賃知識系列|買賣知識系列|在日生活知識系列)$/i;

function threadPostId(url: string) {
  const match = url.match(/\/post\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : url;
}

function cleanLines(text: string) {
  return text
    .split(/\n+/)
    .map(line => line.replace(/^[-•▪️⚠️⭕❌\s]+/, "").trim())
    .filter(line => line.length > 1 && !/^(閱讀全文|linus3524)$/i.test(line));
}

function truncate(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).replace(/[，、；：\s]+$/, "")}…`;
}

function displayCopy(text: string) {
  const lines = cleanLines(text);
  const meaningfulLines = lines.filter(line => !TITLE_BOILERPLATE.test(line));
  const titleSource = meaningfulLines[0] || lines[0] || "Linus 的日本不動產實務分享";
  const title = truncate(titleSource, TITLE_MAX_LENGTH);
  const titleIndex = lines.indexOf(titleSource);
  const excerptParts = lines.filter((line, index) => index !== titleIndex && !TITLE_BOILERPLATE.test(line));
  const excerpt = truncate(excerptParts.join(" ") || titleSource, EXCERPT_MAX_LENGTH);
  return { title, excerpt };
}

const documents: ThreadDocument[] = threadCategories.flatMap(category =>
  category.threads.map(thread => {
    const id = threadPostId(thread.url);
    const text = threadsSearchIndex[id] ?? "";
    const { title, excerpt } = displayCopy(text);
    return {
      thread,
      id,
      category: category.label,
      text,
      title,
      excerpt,
      titleText: title.toLocaleLowerCase(),
      leadingText: text.slice(0, 220).toLocaleLowerCase(),
      keywordText: (thread.keywords ?? []).join(" ").toLocaleLowerCase(),
    };
  })
);

function isContextMatch(document: ThreadDocument, context: ThreadSearchContext) {
  if (context === "all") return true;
  if (context === "buy") {
    return document.category === "日本買房" || document.category === "日本租屋買房生活知識系列";
  }
  return document.category !== "日本買房";
}

function occurrenceCount(text: string, aliases: string[]) {
  return aliases.reduce((count, alias) => {
    if (!alias) return count;
    return count + Math.min(text.split(alias).length - 1, 3);
  }, 0);
}

function scoreDocument(document: ThreadDocument, tokens: string[], rawQuery: string, requireAllTokens: boolean) {
  const bodyText = document.text.toLocaleLowerCase();
  let matchedTokens = 0;
  let score = 0;

  for (const token of tokens) {
    const aliases = expandToken(token);
    // 長首句常是內文第一段而非真正標題；概念出現在前 28 字才算標題主題，
    // 避免「從入住到退房都由管理公司處理」排在退房專文前面。
    const inTitle = aliases.some(alias => {
      const index = document.titleText.indexOf(alias);
      return index >= 0 && index < 28;
    });
    const inKeywords = aliases.some(alias => document.keywordText.includes(alias));
    const inLeading = aliases.some(alias => document.leadingText.includes(alias));
    const inBody = aliases.some(alias => bodyText.includes(alias));
    if (!inTitle && !inKeywords && !inLeading && !inBody) continue;

    matchedTokens += 1;
    if (inTitle) score += 42;
    else if (inKeywords) score += 28;
    else if (inLeading) score += 20;
    else score += 15;
    const occurrences = occurrenceCount(bodyText, aliases);
    score += Math.min(occurrences * 2, 6);
    if (occurrences >= 3) score += 8;
    if (!inTitle && inLeading && occurrences >= 2) score += 14;
  }

  if (matchedTokens === 0 || (requireAllTokens && matchedTokens !== tokens.length)) return 0;

  const coverage = matchedTokens / tokens.length;
  score += coverage * 30;

  const normalizedQuery = rawQuery.trim().toLocaleLowerCase();
  if (normalizedQuery.length >= 2) {
    if (document.titleText.indexOf(normalizedQuery) >= 0 && document.titleText.indexOf(normalizedQuery) < 28) score += 24;
    else if (document.leadingText.includes(normalizedQuery)) score += 14;
    else if (bodyText.includes(normalizedQuery)) score += 5;
  }

  // 排序保留超過 100 的原始差距，回傳給畫面時才壓到 0～100。
  return Math.round(score);
}

function rankedResults(
  rawQuery: string,
  tokens: string[],
  context: ThreadSearchContext,
  requireAllTokens: boolean,
  minScore: number,
) {
  if (tokens.length === 0) return [];

  return documents
    .filter(document => isContextMatch(document, context))
    .map(document => ({
      document,
      score: scoreDocument(document, tokens, rawQuery, requireAllTokens),
    }))
    .filter(entry => entry.score >= minScore)
    .sort((a, b) => b.score - a.score || a.document.id.localeCompare(b.document.id))
    .map(({ document, score }) => ({
      id: document.id,
      url: document.thread.url,
      category: document.category,
      title: document.title,
      excerpt: document.excerpt,
      score: Math.min(100, score),
      imageUrl: threadImageIndex[document.id],
    }));
}

/** 搜尋框使用：每個輸入關鍵字都必須命中，避免回傳只擦邊提到的文章。 */
export function searchThreads(
  query: string,
  options: { context?: ThreadSearchContext; limit?: number; minScore?: number } = {},
): ThreadSearchResults {
  // 前端雖有限制輸入，但共用函式仍自行限長、限詞數，避免異常長字串拖慢整份索引。
  const safeQuery = typeof query === "string" ? query.slice(0, 200) : "";
  const tokens = tokenizeQuery(safeQuery).slice(0, 8);
  const matches = rankedResults(
    safeQuery,
    tokens,
    options.context ?? "all",
    true,
    options.minScore ?? SEARCH_RESULT_MIN_SCORE,
  );
  return {
    results: matches.slice(0, options.limit ?? 3),
    total: matches.length,
  };
}

function inferSearchContext(text: string): ThreadSearchContext {
  const hasBuyIntent = BUY_INTENT.test(text);
  const hasRentIntent = RENT_INTENT.test(text);
  if (hasBuyIntent && !hasRentIntent) return "buy";
  if (hasRentIntent && !hasBuyIntent) return "rent";
  return "all";
}

function removeGenericAiConcepts(tokens: string[]) {
  return tokens.filter(token => !expandToken(token).some(alias => GENERIC_AI_CONCEPTS.has(alias)));
}

function extractExplicitTopic(text: string) {
  // 租屋／買房知識卡的「向 AI 詢問」按鈕會用這個固定句型帶入名詞。
  // 直接抓出引號內主題，未列在同義詞表的新名詞也能搜尋 Threads 正文。
  const match = text.match(/關於\s*[「『"]([^」』"]{2,60})[」』"]/u);
  return match?.[1].trim().toLocaleLowerCase() || "";
}

/**
 * AI 顧問使用：先從完整問句辨識站內已知概念；若問句沒有明確術語，才從回答中
 * 補抓概念。只回傳高分結果，沒有合適文章時寧可不推薦。
 */
export function recommendThreadsForAnswer(
  question: string,
  answer: string,
  options: { limit?: number; minScore?: number } = {},
) {
  const safeQuestion = typeof question === "string" ? question.slice(0, 500) : "";
  const safeAnswer = typeof answer === "string" ? answer.slice(0, 2000) : "";
  const explicitTopic = extractExplicitTopic(safeQuestion);
  const questionTokens = explicitTopic
    ? [explicitTopic]
    : removeGenericAiConcepts(extractKnownSearchTokens(safeQuestion)).slice(0, 6);
  const tokens = questionTokens.length > 0
    ? questionTokens
    : removeGenericAiConcepts(extractKnownSearchTokens(safeAnswer)).slice(0, 4);
  const sourceText = explicitTopic || (questionTokens.length > 0 ? safeQuestion : safeAnswer);
  const contextFromQuestion = inferSearchContext(safeQuestion);
  const context = contextFromQuestion === "all" ? inferSearchContext(safeAnswer) : contextFromQuestion;
  let matches = rankedResults(
    sourceText,
    tokens,
    context,
    false,
    options.minScore ?? AI_RECOMMENDATION_MIN_SCORE,
  );

  // 問句只包含一個明確專有概念時，允許一篇「正文直接命中」的保守備援。
  // 例如更新料文章的主標題沒寫更新料，但內文有完整費用說明，不應因此完全漏掉。
  if (matches.length === 0 && questionTokens.length === 1 && options.minScore === undefined) {
    matches = rankedResults(sourceText, tokens, context, false, SEARCH_RESULT_MIN_SCORE);
  }
  return matches.slice(0, options.limit ?? 2);
}

/** 僅接受本站 API 所需的 Threads 卡片欄位與官方網址，避免異常回應影響畫面。 */
export function sanitizeRelatedThreads(value: unknown, limit = 2): RelatedThread[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const safeResults: RelatedThread[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const candidate = item as Record<string, unknown>;
    if (
      typeof candidate.id !== "string" ||
      typeof candidate.url !== "string" ||
      typeof candidate.category !== "string" ||
      typeof candidate.title !== "string" ||
      typeof candidate.excerpt !== "string" ||
      typeof candidate.score !== "number" ||
      !Number.isFinite(candidate.score) ||
      !/^https:\/\/(?:www\.)?threads\.(?:com|net)\//i.test(candidate.url) ||
      seen.has(candidate.id)
    ) continue;

    seen.add(candidate.id);
    safeResults.push({
      id: candidate.id.slice(0, 100),
      url: candidate.url,
      category: candidate.category.slice(0, 60),
      title: candidate.title.slice(0, 100),
      excerpt: candidate.excerpt.slice(0, 300),
      score: Math.max(0, Math.min(100, candidate.score)),
      imageUrl: typeof candidate.imageUrl === "string" && /^\/thread-images\/[A-Za-z0-9_-]+\.jpg$/.test(candidate.imageUrl)
        ? candidate.imageUrl
        : undefined,
    });
    if (safeResults.length >= Math.max(0, Math.min(limit, 5))) break;
  }
  return safeResults;
}
