import { RateLimiterMemory, RateLimiterRedis } from "rate-limiter-flexible";
import type { NextRequest } from "next/server";
import Redis from "ioredis";
import logger from "@/lib/logger";

const redisUrl = process.env.REDIS_URL;
let redisClient: Redis | null = null;

const getRedisClient = () => {
  if (!redisUrl) return null;
  if (!redisClient) {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    redisClient.on("error", (error) => {
      logger.error("rate_limit_redis_error", { message: error.message });
    });
  }
  return redisClient;
};

export class RateLimitError extends Error {
  status: number;
  retryAfter: number;

  constructor(message: string, retryAfter: number) {
    super(message);
    this.status = 429;
    this.retryAfter = retryAfter;
  }
}

const limiterCache = new Map<string, RateLimiterMemory | RateLimiterRedis>();

const getLimiter = (keyPrefix: string, points: number, duration: number) => {
  const cacheKey = `${keyPrefix}:${points}:${duration}`;
  const cached = limiterCache.get(cacheKey);
  if (cached) return cached;

  const redis = getRedisClient();
  const limiter = redis
    ? new RateLimiterRedis({
        storeClient: redis,
        keyPrefix,
        points,
        duration,
      })
    : new RateLimiterMemory({
        keyPrefix,
        points,
        duration,
      });

  limiterCache.set(cacheKey, limiter);
  return limiter;
};

const getRequesterKey = (request: NextRequest, userId?: string | number) => {
  if (userId) return `user:${userId}`;
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return `ip:${ip}`;
};

export const rateLimitOrThrow = async (options: {
  request: NextRequest;
  keyPrefix: string;
  points: number;
  duration: number;
  userId?: string | number;
}) => {
  const limiter = getLimiter(options.keyPrefix, options.points, options.duration);
  const key = getRequesterKey(options.request, options.userId);

  try {
    await limiter.consume(key);
  } catch (error: unknown) {
    const retryAfter =
      typeof error === "object" && error && "msBeforeNext" in error
        ? Math.ceil(((error as { msBeforeNext?: number }).msBeforeNext || 1000) / 1000)
        : 1;
    throw new RateLimitError("Too many requests", retryAfter);
  }
};
