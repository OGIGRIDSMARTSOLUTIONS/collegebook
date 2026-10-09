const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const prisma = require('../config/db');
const { verifyAccessToken } = require('../utils/jwt');
const { parseCookieHeader } = require('../utils/cookies');
const { assertParticipant } = require('../services/message.service');
const { createClient, isRedisEnabled } = require('../config/redis');

let io = null;
let presenceRedis = null; // separate client from the shared one — presence uses SADD/SCARD, not pub/sub

// In-memory fallback, used only when REDIS_URL isn't set (local dev,
// single instance). Once multiple backend instances run behind a load
// balancer, this in-memory Map would be wrong — each instance would only
// know about its own sockets, so "is student X online" and cross-instance
// message delivery would silently break. Redis fixes both: presence
// becomes a shared set, and @socket.io/redis-adapter makes `io.to(room)`
// broadcast across every instance via Redis pub/sub, not just the local one.
const localOnlineStudents = new Map(); // studentId -> Set of socket ids

async function markOnline(studentId, socketId) {
  if (presenceRedis) {
    await presenceRedis.sadd(`presence:${studentId}`, socketId);
    return;
  }
  if (!localOnlineStudents.has(studentId)) localOnlineStudents.set(studentId, new Set());
  localOnlineStudents.get(studentId).add(socketId);
}

async function markOffline(studentId, socketId) {
  if (presenceRedis) {
    await presenceRedis.srem(`presence:${studentId}`, socketId);
    return;
  }
  const sockets = localOnlineStudents.get(studentId);
  if (!sockets) return;
  sockets.delete(socketId);
  if (sockets.size === 0) localOnlineStudents.delete(studentId);
}

async function isOnline(studentId) {
  if (presenceRedis) {
    const count = await presenceRedis.scard(`presence:${studentId}`);
    return count > 0;
  }
  return localOnlineStudents.has(studentId);
}

/**
 * initSocket — reuses the same httpOnly accessToken cookie as the REST
 * API, so there's no separate auth mechanism to keep in sync. A socket
 * whose cookie doesn't verify is rejected at handshake.
 */
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  if (isRedisEnabled()) {
    const pubClient = createClient();
    const subClient = pubClient.duplicate();
    // .duplicate() creates a NEW connection that does NOT inherit
    // pubClient's listeners — it needs its own 'error' handler for the
    // same reason createClient() attaches one, or ioredis warns
    // "missing 'error' handler on this Redis client" and risks the same
    // unhandled-event crash this whole file exists to prevent. Throttled
    // the same way as config/redis.js's handler, for the same reason —
    // an unreachable Redis retries forever, and without throttling this
    // would print on every single retry for the life of the process.
    let lastLoggedAt = 0;
    subClient.on('error', (err) => {
      const now = Date.now();
      if (now - lastLoggedAt < 30_000) return;
      lastLoggedAt = now;
      // eslint-disable-next-line no-console
      console.warn(`[redis:socket-sub] connection error (retrying quietly): ${err.message}`);
    });
    io.adapter(createAdapter(pubClient, subClient));
    presenceRedis = createClient();
  }

  io.use(async (socket, next) => {
    try {
      const cookies = parseCookieHeader(socket.handshake.headers.cookie);
      const token = cookies.accessToken;
      if (!token) return next(new Error('Not authenticated'));

      const payload = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          student: { select: { id: true, institutionId: true } },
        },
      });
      if (!user || !user.student) return next(new Error('Not authenticated'));

      socket.data.studentId = user.student.id;
      socket.data.institutionId = user.student.institutionId;
      next();
    } catch {
      next(new Error('Not authenticated'));
    }
  });

  io.on('connection', (socket) => {
    const { studentId, institutionId } = socket.data;
    markOnline(studentId, socket.id);
    socket.broadcast.emit('user:online', { studentId });

    // Auto-joined on connect, not on demand — both are cheap, stable
    // memberships known entirely from the handshake, unlike conversation
    // rooms (which need a per-conversation participant check). This is
    // what lets post creation (see post.controller.js) notify "everyone
    // in this institution" or "this specific student" without having to
    // track membership separately from Socket.IO's own room mechanism.
    socket.join(`institution:${institutionId}`);
    socket.join(`student:${studentId}`);

    socket.on('conversation:join', async (conversationId, callback) => {
      try {
        await assertParticipant(conversationId, studentId);
        socket.join(`conversation:${conversationId}`);
        if (callback) callback({ ok: true });
      } catch (err) {
        if (callback) callback({ ok: false, error: err.message });
      }
    });

    socket.on('typing:start', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:start', { studentId, conversationId });
    });

    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:stop', { studentId, conversationId });
    });

    socket.on('disconnect', async () => {
      await markOffline(studentId, socket.id);
      if (!(await isOnline(studentId))) {
        socket.broadcast.emit('user:offline', { studentId });
      }
    });
  });

  return io;
}

function getIO() {
  return io;
}

module.exports = { initSocket, getIO, isOnline };
