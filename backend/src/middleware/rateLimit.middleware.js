const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { createClient, isRedisEnabled } = require('../config/redis');

/**
 * §39 Application Security: rate limiting, tighter on auth and broadcast
 * endpoints. Redis-backed when REDIS_URL is set — required for the limit
 * to actually hold once there's more than one backend instance behind a
 * load balancer (an in-memory store would let each instance count
 * separately, silently multiplying the real limit by instance count).
 * Falls back to express-rate-limit's built-in in-memory store otherwise,
 * which is fine for local dev / a single instance.
 *
 * IMPORTANT: this uses its OWN Redis client, deliberately NOT the shared
 * one from config/redis.js that's tuned for BullMQ (maxRetriesPerRequest:
 * null there — correct for a job queue, wrong here). With that setting, a
 * command on an unreachable Redis retries forever and never
 * resolves/rejects — so a rate-limit check would hang the request
 * indefinitely rather than fail fast. This client uses a small bounded
 * maxRetriesPerRequest and a short connectTimeout instead, so a genuinely
 * broken connection fails in a few seconds rather than forever.
 *
 * Left at ioredis's DEFAULT enableOfflineQueue (true) deliberately —
 * disabling it looked like an obvious way to "fail fast," but it also
 * breaks the completely normal case: ioredis's initial TCP handshake
 * takes a few milliseconds, and with offline queueing off, any command
 * sent during that window throws immediately instead of just waiting for
 * it. Verified this the hard way — with it disabled, requests fired right
 * after server startup against a real, working Redis failed exactly like
 * an outage would. The bounded retry count above is what actually
 * distinguishes "briefly not ready yet" from "genuinely unreachable."
 */
const rateLimitRedis = isRedisEnabled()
  ? createClient({
      maxRetriesPerRequest: 2,
      connectTimeout: 2000,
      label: 'rate-limit',
    })
  : null;

function buildLimiter({ windowMs, max, prefix, ...options }) {
  const limiter = rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    store: rateLimitRedis
      ? new RedisStore({
          sendCommand: (...args) => rateLimitRedis.call(...args),
          prefix: `rl:${prefix}:`,
        })
      : undefined,
    message: { success: false, message: 'Too many requests, please try again later' },
    ...options, // per-limiter overrides (key, message, skip rules) win over the defaults
  });

  if (!rateLimitRedis) return limiter;

  // Fail OPEN: express-rate-limit is itself just (req, res, next) =>
  // ... and calls next(err) when its store errors (e.g. Redis
  // unreachable) rather than throwing synchronously. Intercepting that
  // here means a Redis outage degrades to "requests go through
  // unlimited" instead of every rate-limited route 500ing — a rate
  // limiter's own failure should never be what takes the API down.
  return (req, res, next) => {
    limiter(req, res, (err) => {
      if (err) {
        // eslint-disable-next-line no-console
        console.warn(`[rate-limit:${prefix}] store error, failing open: ${err.message}`);
        return next();
      }
      next();
    });
  };
}

const authLimiter = buildLimiter({ windowMs: 15 * 60 * 1000, max: 20, prefix: 'auth' });
const broadcastLimiter = buildLimiter({ windowMs: 60 * 60 * 1000, max: 30, prefix: 'broadcast' });
const generalLimiter = buildLimiter({ windowMs: 60 * 1000, max: 120, prefix: 'general' });

/**
 * Registration verifies a student with matric number + department (or
 * phone). Departments come from a short dropdown, so without this anyone
 * who knows a classmate's matric number could simply try every option.
 * Counts only FAILED attempts, per matriculation number (not per IP, so
 * switching networks doesn't help): after 5 misses that record is locked
 * for 30 minutes. A successful registration is never counted.
 */
function matricKey(req) {
  const matric = String(req.body?.matriculationNumber ?? '').trim().replace(/\s+/g, '').toUpperCase();
  return matric ? `matric:${matric}` : `ip:${req.ip}`;
}
const registerVerificationLimiter = buildLimiter({
  windowMs: 30 * 60 * 1000,
  max: 5,
  prefix: 'register-verify',
  keyGenerator: matricKey,
  skipSuccessfulRequests: true,
  validate: { keyGeneratorIpFallback: false },
  message: {
    success: false,
    message: 'Too many unsuccessful verification attempts for this matriculation number. Please wait 30 minutes, or contact your school.',
  },
});

module.exports = { authLimiter, broadcastLimiter, generalLimiter, registerVerificationLimiter };

