import assert from "node:assert/strict";
import type { Redis } from "@upstash/redis";
import { getQuizSummary, mergeQuizFields, quizFields, quizRetainedMonths, recordQuizEvent } from "../src/lib/quizMetrics";

// In-memory store exercises production recording and reads without touching Redis.
const hashes = new Map<string, Record<string, number>>();
const strings = new Map<string, string>();
const expirations = new Set<string>();
const fake = {
  hlen: async (key: string) => Object.keys(hashes.get(key) ?? {}).length,
  hgetall: async (key: string) => hashes.get(key) ?? null,
  get: async (key: string) => strings.get(key) ?? null,
  pipeline() {
    const ops: (() => unknown)[] = [];
    const pipe = {
      hincrby(key: string, field: string, n: number) {
        ops.push(() => { const row = hashes.get(key) ?? {}; row[field] = (row[field] ?? 0) + n; hashes.set(key, row); return row[field]; }); return pipe;
      },
      expire(key: string) { ops.push(() => { expirations.add(key); return 1; }); return pipe; },
      set(key: string, value: string, options: { nx?: boolean }) {
        ops.push(() => { if (!options.nx || !strings.has(key)) strings.set(key, value); return "OK"; }); return pipe;
      },
      hgetall(key: string) { ops.push(() => hashes.get(key) ?? null); return pipe; },
      exec: async () => ops.map(op => op()),
    };
    return pipe;
  },
} as unknown as Redis;

assert(quizFields({ e: "finish", top1: "machida", sr: "2026-10-12-machida-t2-f4" }).fields.includes("srr:2026-10-12-machida-t2-f4:machida"));
assert(quizFields({ e: "rate", top1: "machida", v: 2, sr: "2026-10-11b" }).fields.includes("srate:2026-10-11b:machida:2"));
assert(!quizFields({ e: "finish", sr: "2026-10-12:<unsafe>" }).fields.some(f => f.startsWith("sr:")));
assert.deepEqual(mergeQuizFields([{ "f:finish": 2, "r:koto": 1 }, null, { "f:finish": 3, "r:koto": 2 }]), { "f:finish": 5, "r:koto": 3 });
assert.deepEqual(quizRetainedMonths(new Date("2026-09-30T15:00:00Z")), ["2026-08", "2026-09", "2026-10"]);
assert.equal(quizRetainedMonths(new Date("2030-10-01T00:00:00Z")).length, 25);

hashes.set("linus:quiz:2026-09", { "f:start": 10, "f:finish": 8, "r:sumida": 8 });
hashes.set("linus:quiz:zh:2026-09", { "f:start": 4, "f:finish": 3, "r:sumida": 3 });
const beforeMidnight = new Date("2026-10-12T14:59:59Z");
const afterMidnight = new Date("2026-10-12T15:00:00Z");
await recordQuizEvent({ e: "start", lang: "zh" }, fake, beforeMidnight);
await recordQuizEvent({ e: "finish", lang: "zh", top1: "machida", code: "abcdabcdabcd", fq: 11, fv: "direction", sr: "2026-10-12-machida-t2-f4" }, fake, beforeMidnight);
await recordQuizEvent({ e: "start", lang: "ja" }, fake, afterMidnight);
await recordQuizEvent({ e: "finish", lang: "ja", top1: "koto", code: "abcdabcdabcd" }, fake, afterMidnight);
await recordQuizEvent({ e: "finish", top1: "koto" }, fake, afterMidnight); // Untagged language belongs to all only.
await recordQuizEvent({ e: "rate", lang: "zh", top1: "machida", v: 2, sr: "2026-10-12-machida-t2-f4" }, fake, afterMidnight);
await recordQuizEvent({ e: "invalid", top1: "koto" }, fake, afterMidnight);
assert.equal(hashes.get("linus:quiz:day:2026-10-12")?.["f:finish"], 1);
assert.equal(hashes.get("linus:quiz:day:2026-10-13")?.["f:finish"], 2);
assert.equal(hashes.get("linus:quiz:day:zh:2026-10-13")?.["f:finish"], undefined);
assert.equal(strings.get("linus:quiz:daily-since"), "2026-10-12");
assert(expirations.has("linus:quiz:day:2026-10-12"));
assert(expirations.has("linus:quiz:zh:2026-10"));

const summary = await getQuizSummary("2026-10", fake, afterMidnight);
assert.equal(summary.funnel.finish, 3);
assert.equal(summary.distinctCodes, 1); // Monthly distinct code, not sum of days.
assert.equal(summary.cumulative?.funnel.finish, 11);
assert.equal(summary.cumulative?.results.sumida, 8);
assert.equal(summary.byLang?.zh?.cumulative?.funnel.finish, 4);
assert.equal(summary.byLang?.ja?.cumulative?.funnel.finish, 1);
assert.equal(summary.daily?.["2026-10-13"].funnel.finish, 2);
assert.equal(summary.byLang?.ja?.daily?.["2026-10-13"].results.koto, 1);
assert.equal(summary.byLang?.zh?.daily?.["2026-10-13"].scoring["2026-10-12-machida-t2-f4"].ratings.machida["2"], 1);
assert(!summary.daily?.["2026-10-11"], "Unrecorded historic day must not look like zero.");
assert(!summary.daily?.["2026-10-14"], "No future dates.");
const september = await getQuizSummary("2026-09", fake, afterMidnight);
assert.deepEqual(september.daily, {});
assert.equal(september.funnel.finish, 8);
assert.equal(september.cumulative?.funnel.finish, 11, "Cumulative scope is independent of selected month.");
const later = await getQuizSummary("2026-10", fake, new Date("2026-10-14T15:00:00Z"));
assert.deepEqual(later.daily?.["2026-10-14"].funnel, {}, "Recorded coverage includes legitimate zero days.");
const expired = await getQuizSummary("2026-10", fake, new Date("2030-10-01T00:00:00Z"));
assert.deepEqual(expired.daily, {}, "Expired daily coverage must not look like zero activity.");
console.log("quiz metrics tests passed: Tokyo midnight, daily coverage, language scopes, cumulative totals, version tags");
