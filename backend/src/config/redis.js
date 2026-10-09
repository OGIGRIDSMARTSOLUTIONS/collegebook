const Redis = require('ioredis');

/**
 * Redis is optional at the application level: everything that uses it
 * (rate limiting, Socket.IO presence/cross-instance broadcast, the
 * broadcast job queue) degrades to a single-instance-only mode rather
 * than crashing the app if REDIS_URL isn't set — matching how the doc
 * frames Redis as a Phase 8 scaling addition, not a hard V1 dependency.
 * Once REDIS_URL is set (locally or via a managed Redis on Render), these
 * features activate automatically with no other code changes.
 *
 * IMPORTANT: ioredis emits an 'error' event on every connection failure
 * (wrong host, Redis not started yet, network blip). Node's default
 * behavior for an EventEmitter is to THROW on an unhandled 'error' event
 * — so without an explicit listener here, setting REDIS_URL to something
 * unreachable crashes the entire process on startup, not just the Redis
 * feature. This handler is what actually makes "degrades gracefully" true
 * rather than just a comment.
 *
 * Reconnection itself is deliberately left set to keep retrying forever
 * (so the app self-heals if Redis comes back later without a restart) —
 * but that means an unreachable Redis would otherwise print a warning on
 * every single retry, forever, for as long as the process runs. The
 * logging below is throttled per client (one line, then at most once per
 * 30s) so a genuinely down Redis is visible without turning the terminal
 * into a wall of repeating text.
 */
const REDIS_URL = process.env.REDIS_URL || null;
const LOG_THROTTLE_MS = 30_000;

function attachErrorHandler(client, label) {
  let lastLoggedAt = 0;
  client.on('error', (err) => {
    const now = Date.now();
    if (now - lastLoggedAt < LOG_THROTTLE_MS) return;
    lastLoggedAt = now;
    // eslint-disable-next-line no-console
    console.warn(
      `[redis:${label}] connection error (features using this client will be degraded, retrying quietly): ${err.message}`
    );
  });
  return client;
}

function createClient(extraOptions = {}) {
  if (!REDIS_URL) return null;
  const { label, ...redisOptions } = extraOptions;
  const client = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    retryStrategy: (times) => Math.min(times * 500, 10_000), // capped backoff, keeps trying
    ...redisOptions,
  });
  return attachErrorHandler(client, label || 'client');
}

// BullMQ requires maxRetriesPerRequest: null on the connection it's given.
const redis = createClient();

module.exports = { redis, createClient, isRedisEnabled: () => !!REDIS_URL };

