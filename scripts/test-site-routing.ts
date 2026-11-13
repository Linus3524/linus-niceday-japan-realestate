import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { compile, pathToRegexp, type Key } from "path-to-regexp";

const config = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
// Vercel matches redirects before rewrites. Exercise the parameter grammar,
// host conditions and destination interpolation, rather than a hand-written regex.
function redirect(raw: string): string | null {
  const url = new URL(raw);
  for (const rule of config.redirects) {
    if (rule.has?.some((h: { type: string; value: string }) => h.type === "host" && h.value !== url.hostname)) continue;
    const keys: Key[] = [];
    const match = pathToRegexp(rule.source, keys).exec(url.pathname);
    if (!match) continue;
    const params = Object.fromEntries(keys.map((key, i) => [key.name, match[i + 1]]));
    const target = new URL(rule.destination);
    target.pathname = compile(target.pathname, { validate: false })(params);
    target.search = url.search;
    target.hash = url.hash; // Browsers retain the original fragment when Location has none.
    return target.href;
  }
  return null;
}

for (const host of ["linusniceday.com", "linus-niceday-japan-realestate.vercel.app"]) {
  for (const path of ["/quiz", "/quiz/", "/quiz/ja/", "/quiz/app/app.mjs"]) {
    const suffix = path.replace(/^\/quiz\/?/, "");
    assert.equal(redirect(`https://${host}${path}?from=threads#s=abcdabcdabcd`),
      `https://quiz.linusniceday.com/${suffix}?from=threads#s=abcdabcdabcd`);
  }
  for (const path of ["/quiz/api", "/quiz/api/", "/quiz/api/quiz?op=public&lang=zh", "/quiz/api/quiz/"]) {
    assert.equal(redirect(`https://${host}${path}`), null, `${path} must not become cross-origin`);
  }
  for (const path of ["/api/visitor-count", "/api/track-view", "/api/listing-share?id=example", "/assets/example.js"]) {
    assert.equal(redirect(`https://${host}${path}`), null);
  }
  assert.equal(redirect(`https://${host}/quiz-recover.html?lang=zh`), null, "Recovery must run on the original storage origin");
}
for (const path of ["/", "/find-home?from=threads", "/?from=share#listing=example", "/robots.txt"]) {
  assert.equal(redirect(`https://linus-niceday-japan-realestate.vercel.app${path}`), `https://linusniceday.com${path}`);
  assert.equal(redirect(`https://linusniceday.com${path}`), null);
}
const rewrite = config.rewrites.find((rule: { source: string }) => rule.source === "/quiz/api/:path*");
assert.equal(rewrite?.destination, "https://tokyo-living-persona.vercel.app/api/:path*");
console.log("Site routing passed: legacy roots, nested paths, Japanese entry, queries, share fragments, API and asset exclusions.");
