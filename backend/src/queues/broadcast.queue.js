const { Queue } = require('bullmq');
const { createClient, isRedisEnabled } = require('../config/redis');

/**
 * §51 Background Jobs: "Broadcast to 50,000 students should not make the
 * administrator wait for all notifications to be inserted." Phase 5
 * shipped the synchronous version of this with an explicit note that it
 * needed to move to a queue once institution size made it a real latency
 * problem. This is that move — when Redis is configured, broadcast
 * fan-out (BroadcastRecipient + Notification rows) is enqueued and
 * handled by a separate worker process (`npm run worker`) instead of
 * blocking the admin's request.
 *
 * When Redis isn't configured (local dev without it), broadcastQueue is
 * null and the caller (broadcast.service.js) falls back to the original
 * synchronous createMany — same graceful-degradation pattern as rate
 * limiting and Socket.IO presence.
 */
const broadcastQueue = isRedisEnabled() ? new Queue('broadcast-fanout', { connection: createClient() }) : null;

async function enqueueBroadcastFanout(broadcastId, recipientStudentIds, title) {
  if (!broadcastQueue) return null;
  return broadcastQueue.add('fanout', { broadcastId, recipientStudentIds, title });
}

module.exports = { enqueueBroadcastFanout, isQueueEnabled: () => !!broadcastQueue };
