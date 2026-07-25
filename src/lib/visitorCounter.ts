import { Redis } from "@upstash/redis";

const VISITOR_COUNT_KEY = "linus:visitors:total";
const VISITOR_KEY_PREFIX = "linus:visitors:id:";
const VISITOR_TTL_SECONDS = 60 * 60 * 24 * 400;

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

export function visitorCounterConfigured() {
  return redis !== null;
}

export async function getVisitorCount() {
  if (!redis) throw new Error("Visitor counter storage is not configured.");
  return (await redis.get<number>(VISITOR_COUNT_KEY)) ?? 0;
}

export async function recordUniqueVisitor(visitorId: string) {
  if (!redis) throw new Error("Visitor counter storage is not configured.");

  const added = await redis.set(`${VISITOR_KEY_PREFIX}${visitorId}`, "1", {
    nx: true,
    ex: VISITOR_TTL_SECONDS,
  });

  if (added) {
    await redis.incr(VISITOR_COUNT_KEY);
  }

  return {
    count: await getVisitorCount(),
    isNewVisitor: Boolean(added),
  };
}
