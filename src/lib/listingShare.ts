import { Redis } from "@upstash/redis";
import { randomBytes } from "crypto";

/**
 * 圖紙分析結果的分享連結。
 *
 * 只存「分析結果的 JSON」，不存上傳的圖紙：站內對上傳圖片的承諾是不落地儲存，
 * 分享頁改用結果裡的地址重新查一次步行與周邊機能就好，圖紙本來就是收件人自己
 * 也拿得到的東西。
 *
 * 短 ID 用 8 碼、去掉容易看錯的字元（0/O、1/I/l）：連結會被貼進 LINE 或
 * 口頭轉述，8 碼在 32 個字元的字母表下約 1.1e12 種組合，撞到與被猜到都夠難。
 */

const SHARE_PREFIX = "linus:listing-share:";
export const SHARE_TTL_SECONDS = 60 * 60 * 24 * 14;
export const SHARE_ID_LENGTH = 8;
// 分析結果 JSON 實測約 20～60KB；設上限擋掉異常的巨大 payload，不擋正常使用。
export const SHARE_MAX_BYTES = 256 * 1024;

const ID_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const ID_PATTERN = new RegExp(`^[${ID_ALPHABET}]{${SHARE_ID_LENGTH}}$`);

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

const devMemoryStore = new Map<string, { share: StoredListingShare; expiresAt: string }>();

export function listingShareConfigured() {
  return redis !== null || process.env.NODE_ENV !== "production";
}

export function isValidShareId(value: unknown): value is string {
  return typeof value === "string" && ID_PATTERN.test(value);
}

function generateShareId(): string {
  // 用 rejection sampling 而不是 byte % 32：32 剛好整除 256，其實不會偏，
  // 但寫成通用的形式，之後改字母表長度也不會悄悄引入偏差。
  const bytes = randomBytes(SHARE_ID_LENGTH * 2);
  let id = "";
  for (let i = 0; i < bytes.length && id.length < SHARE_ID_LENGTH; i++) {
    const value = bytes[i];
    if (value < 256 - (256 % ID_ALPHABET.length)) {
      id += ID_ALPHABET[value % ID_ALPHABET.length];
    }
  }
  return id.length === SHARE_ID_LENGTH ? id : generateShareId();
}

export interface StoredListingShare {
  version: 1;
  createdAt: string;
  title: string;
  dealType: "sale" | "rent" | null;
  result: unknown;
}

export async function createListingShare(input: {
  title: string;
  dealType: "sale" | "rent" | null;
  result: unknown;
}): Promise<{ id: string; expiresAt: string }> {
  const stored: StoredListingShare = {
    version: 1,
    createdAt: new Date().toISOString(),
    title: input.title,
    dealType: input.dealType,
    result: input.result,
  };

  if (!redis) {
    if (process.env.NODE_ENV !== "production") {
      const id = generateShareId();
      const expiresAt = new Date(Date.now() + SHARE_TTL_SECONDS * 1000).toISOString();
      devMemoryStore.set(id, { share: stored, expiresAt });
      return { id, expiresAt };
    }
    throw new Error("Listing share storage is not configured.");
  }

  // NX 確保不覆蓋既有連結；撞到的機率極低，但撞到就重抽，不能讓別人的分享被蓋掉。
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = generateShareId();
    const set = await redis.set(`${SHARE_PREFIX}${id}`, stored, { nx: true, ex: SHARE_TTL_SECONDS });
    if (set) {
      return { id, expiresAt: new Date(Date.now() + SHARE_TTL_SECONDS * 1000).toISOString() };
    }
  }
  throw new Error("Unable to allocate a unique share id.");
}

export async function getListingShare(id: string): Promise<(StoredListingShare & { expiresAt: string | null }) | null> {
  if (!isValidShareId(id)) return null;

  if (!redis) {
    if (process.env.NODE_ENV !== "production") {
      const entry = devMemoryStore.get(id);
      if (!entry) return null;
      return {
        ...entry.share,
        expiresAt: entry.expiresAt,
      };
    }
    throw new Error("Listing share storage is not configured.");
  }

  const key = `${SHARE_PREFIX}${id}`;
  const [stored, ttl] = await Promise.all([redis.get<StoredListingShare>(key), redis.ttl(key)]);
  if (!stored) return null;
  return {
    ...stored,
    expiresAt: ttl > 0 ? new Date(Date.now() + ttl * 1000).toISOString() : null,
  };
}
