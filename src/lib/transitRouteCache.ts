import { Redis } from "@upstash/redis";
import type { CommuteRouteDetails } from "./rentAnalysis";

const TTL_SECONDS = 60 * 60 * 24 * 30;
const memory = new Map<string, { expiresAt: number; value: CommuteRouteDetails }>();
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN ? Redis.fromEnv() : null;

function key(origin: string, destination: string) {
  // v4 includes the recommendation's geographic context in `origin` and
  // invalidates the earlier ambiguous-line cache entries; this
  // prevents homonymous stations such as 大通 from sharing a route across cities.
  return `linus:transit:v4:${encodeURIComponent(origin)}:${encodeURIComponent(destination)}`;
}

export async function readTransitRoute(origin: string, destination: string) {
  const cacheKey = key(origin, destination);
  const local = memory.get(cacheKey);
  if (local && local.expiresAt > Date.now()) return { ...local.value, source: "verified_cache" as const, referenceLabel: `已驗證快取・${local.value.referenceLabel}` };
  if (!redis) return null;
  try {
    const stored = await redis.get<CommuteRouteDetails>(cacheKey);
    if (!stored) return null;
    memory.set(cacheKey, { expiresAt: Date.now() + TTL_SECONDS * 1000, value: stored });
    return { ...stored, source: "verified_cache" as const, referenceLabel: `已驗證快取・${stored.referenceLabel}` };
  } catch (error) {
    console.warn("Transit cache read failed:", String(error));
    return null;
  }
}

export async function writeTransitRoute(origin: string, destination: string, route: CommuteRouteDetails) {
  const cacheKey = key(origin, destination);
  memory.set(cacheKey, { expiresAt: Date.now() + TTL_SECONDS * 1000, value: route });
  if (!redis) return;
  try {
    await redis.set(cacheKey, route, { ex: TTL_SECONDS });
  } catch (error) {
    console.warn("Transit cache write failed:", String(error));
  }
}
