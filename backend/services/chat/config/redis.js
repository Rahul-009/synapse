import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
});

let available = false;
redis.on("ready", () => {
  available = true;
  console.log("Redis connected");
});
redis.on("error", () => {
  // Cache is best-effort: services keep working without Redis
  if (available) console.warn("Redis connection lost — caching disabled");
  available = false;
});

export const cacheGet = async (key) => {
  if (!available) return null;
  try {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

export const cacheSet = async (key, value, ttlSeconds = 300) => {
  if (!available) return;
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    /* best-effort */
  }
};

export const cacheDel = async (...keys) => {
  if (!available || keys.length === 0) return;
  try {
    await redis.del(...keys);
  } catch {
    /* best-effort */
  }
};

export default redis;
