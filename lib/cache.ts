import Redis from "ioredis";
import logger from "@/lib/logger";

const redisUrl = process.env.REDIS_URL;

let redisClient: Redis | null = null;

const inMemoryCache = new Map<string, { value: string; expiresAt: number }>();
const inMemoryVersions = new Map<string, number>();

const now = () => Date.now();

const getRedisClient = () => {
  if (!redisUrl) return null;
  if (!redisClient) {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    redisClient.on("error", (error) => {
      logger.error("redis_error", { message: error.message });
    });
  }
  return redisClient;
};

const getFromMemory = (key: string) => {
  const entry = inMemoryCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < now()) {
    inMemoryCache.delete(key);
    return null;
  }
  return entry.value;
};

const setInMemory = (key: string, value: string, ttlSeconds: number) => {
  inMemoryCache.set(key, { value, expiresAt: now() + ttlSeconds * 1000 });
};

const versionKey = (namespace: string) => `cache:version:${namespace}`;

export const cache = {
  async getJSON<T>(key: string): Promise<T | null> {
    const redis = getRedisClient();
    if (redis) {
      const value = await redis.get(key);
      return value ? (JSON.parse(value) as T) : null;
    }

    const value = getFromMemory(key);
    return value ? (JSON.parse(value) as T) : null;
  },

  async setJSON<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const redis = getRedisClient();
    const payload = JSON.stringify(value);

    if (redis) {
      await redis.set(key, payload, "EX", ttlSeconds);
      return;
    }

    setInMemory(key, payload, ttlSeconds);
  },

  async del(key: string): Promise<void> {
    const redis = getRedisClient();
    if (redis) {
      await redis.del(key);
      return;
    }

    inMemoryCache.delete(key);
  },

  async delByPrefix(prefix: string): Promise<void> {
    const redis = getRedisClient();
    if (redis) {
      let cursor = "0";
      do {
        const [nextCursor, keys] = await redis.scan(cursor, "MATCH", `${prefix}*`, "COUNT", "100");
        cursor = nextCursor;
        if (keys.length) {
          await redis.del(keys);
        }
      } while (cursor !== "0");
      return;
    }

    for (const key of inMemoryCache.keys()) {
      if (key.startsWith(prefix)) {
        inMemoryCache.delete(key);
      }
    }
  },

  async ping(): Promise<boolean> {
    const redis = getRedisClient();
    if (!redis) return false;
    try {
      await redis.ping();
      return true;
    } catch {
      return false;
    }
  },

  async getNamespaceVersion(namespace: string): Promise<number> {
    const redis = getRedisClient();
    if (redis) {
      const key = versionKey(namespace);
      const current = await redis.get(key);
      if (current) {
        return Math.max(1, parseInt(current, 10) || 1);
      }

      await redis.set(key, "1");
      return 1;
    }

    const current = inMemoryVersions.get(namespace);
    if (current) return current;
    inMemoryVersions.set(namespace, 1);
    return 1;
  },

  async bumpNamespaceVersion(namespace: string): Promise<number> {
    const redis = getRedisClient();
    if (redis) {
      const key = versionKey(namespace);
      const next = await redis.incr(key);
      return Math.max(1, next);
    }

    const next = (inMemoryVersions.get(namespace) || 1) + 1;
    inMemoryVersions.set(namespace, next);
    return next;
  },
};

export const cacheKeys = {
  globalStats: "stats:global",
  userStats: (userId: string | number) => `stats:user:${userId}`,
  cardsByType: (type: string, page: number, limit: number, version: number = 1) =>
    `cards:v:${version}:${type}:page:${page}:limit:${limit}`,
  search: (query: string, page: number, limit: number, version: number = 1) =>
    `search:v:${version}:${encodeURIComponent(query)}:page:${page}:limit:${limit}`,
};
