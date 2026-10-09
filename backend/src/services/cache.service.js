const { redis } = require('../config/redis');

// Small L1 cache keeps a single instance fast. Redis becomes the shared L2
// automatically when REDIS_URL is configured, so multiple instances see the
// same hot data without making Redis mandatory for local development.
const memory = new Map();
const MAX_MEMORY_ENTRIES = 1000;

function now() { return Date.now(); }
function memoryGet(key) {
  const item = memory.get(key);
  if (!item) return null;
  if (item.expiresAt <= now()) { memory.delete(key); return null; }
  return item.value;
}
function memorySet(key, value, ttlSeconds) {
  if (memory.size >= MAX_MEMORY_ENTRIES) memory.delete(memory.keys().next().value);
  memory.set(key, { value, expiresAt: now() + ttlSeconds * 1000 });
}
async function get(key) {
  const local = memoryGet(key);
  if (local !== null) return local;
  if (!redis) return null;
  try {
    const raw = await redis.get(key);
    if (!raw) return null;
    const value = JSON.parse(raw);
    memorySet(key, value, 5); // tiny L1 avoids repeated Redis round trips
    return value;
  } catch { return null; }
}
async function set(key, value, ttlSeconds = 30) {
  memorySet(key, value, ttlSeconds);
  if (redis) {
    try { await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds); } catch {}
  }
  return value;
}
async function del(...keys) {
  keys.flat().filter(Boolean).forEach((key) => memory.delete(key));
  if (redis && keys.flat().filter(Boolean).length) {
    try { await redis.del(...keys.flat().filter(Boolean)); } catch {}
  }
}
async function remember(key, ttlSeconds, loader) {
  const cached = await get(key);
  if (cached !== null) return cached;
  const value = await loader();
  await set(key, value, ttlSeconds);
  return value;
}
module.exports = { get, set, del, remember };
