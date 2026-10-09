const prisma = require('../config/db');
const { ApiError } = require('../utils/apiResponse');
const { canBroadcast } = require('./permission.service');
const auditService = require('./audit.service');
const { enqueueBroadcastFanout, isQueueEnabled } = require('../queues/broadcast.queue');

/**
 * resolveRecipients — §25 Broadcast Security, enforced at the query
 * level, not just via a route middleware: EVERY branch below includes
 * `institutionId` in its WHERE clause, keyed to the ADMIN'S OWN
 * institution (from actorContext, never from the request body). Even the
 * CUSTOM branch — where the admin supplies explicit student ids — is
 * still intersected with their own institution, so an admin cannot smuggle
 * a student from another school into scopeIds and reach them.
 */
async function resolveRecipients(institutionId, scope, scopeIds) {
  const baseWhere = { institutionId };

  switch (scope) {
    case 'ALL':
      return prisma.student.findMany({ where: baseWhere, select: { id: true } });
    case 'SET':
      return prisma.student.findMany({ where: { ...baseWhere, setId: { in: scopeIds } }, select: { id: true } });
    case 'DEPARTMENT':
      return prisma.student.findMany({
        where: { ...baseWhere, departmentId: { in: scopeIds } },
        select: { id: true },
      });
    case 'FACULTY':
      return prisma.student.findMany({
        where: { ...baseWhere, facultyId: { in: scopeIds } },
        select: { id: true },
      });
    case 'CUSTOM':
      return prisma.student.findMany({
        where: { ...baseWhere, id: { in: scopeIds } }, // institutionId filter still applies here
        select: { id: true },
      });
    default:
      throw new ApiError('Unknown broadcast scope', 400);
  }
}

/**
 * createBroadcast — §51 Background Jobs. When Redis/BullMQ is configured
 * (REDIS_URL set), fan-out (BroadcastRecipient + Notification rows) is
 * enqueued and handled by a separate worker process (`npm run worker`),
 * so this request returns immediately regardless of institution size —
 * "Broadcast to 50,000 students should not make the administrator wait."
 * Without Redis (local dev), falls back to the original synchronous
 * createMany, same as before — correct, just not what you'd want at real
 * scale.
 */
async function createBroadcast(actorContext, { title, body, scope, scopeIds }, ip) {
  const allowed = canBroadcast(actorContext, actorContext.institutionId);
  if (!allowed) throw new ApiError('Insufficient permissions', 403);

  const recipients = await resolveRecipients(actorContext.institutionId, scope, scopeIds);
  if (recipients.length === 0) throw new ApiError('No students match this broadcast scope', 400);

  const broadcast = await prisma.broadcast.create({
    data: {
      institutionId: actorContext.institutionId,
      authorUserId: actorContext.userId,
      title,
      body,
      scope,
      scopeIds: scope === 'ALL' ? undefined : scopeIds,
    },
  });

  const recipientIds = recipients.map((r) => r.id);
  let fanoutMode;

  if (isQueueEnabled()) {
    await enqueueBroadcastFanout(broadcast.id, recipientIds, title);
    fanoutMode = 'queued';
  } else {
    await prisma.$transaction([
      prisma.broadcastRecipient.createMany({
        data: recipientIds.map((id) => ({ broadcastId: broadcast.id, studentId: id })),
      }),
      prisma.notification.createMany({
        data: recipientIds.map((id) => ({
          recipientId: id,
          type: 'INSTITUTION_BROADCAST',
          payload: { broadcastId: broadcast.id, title },
        })),
      }),
    ]);
    fanoutMode = 'synchronous';
  }

  await auditService.record({
    institutionId: actorContext.institutionId,
    actorUserId: actorContext.userId,
    action: 'CREATE_BROADCAST',
    targetType: 'Broadcast',
    targetId: broadcast.id,
    metadata: { scope, recipientCount: recipients.length, fanoutMode },
    ip,
  });

  return { ...broadcast, recipientCount: recipients.length, fanoutMode };
}

async function listSentBroadcasts(institutionId, { page, pageSize }) {
  const [items, total] = await prisma.$transaction([
    prisma.broadcast.findMany({
      where: { institutionId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.broadcast.count({ where: { institutionId } }),
  ]);
  return { items, total, page, pageSize };
}

async function listMyBroadcasts(studentId, { page, pageSize }) {
  const [items, total] = await prisma.$transaction([
    prisma.broadcastRecipient.findMany({
      where: { studentId },
      include: { broadcast: true },
      orderBy: { broadcast: { createdAt: 'desc' } },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.broadcastRecipient.count({ where: { studentId } }),
  ]);
  return { items, total, page, pageSize };
}

async function markBroadcastRead(studentId, broadcastId) {
  const receipt = await prisma.broadcastRecipient.findUnique({
    where: { broadcastId_studentId: { broadcastId, studentId } },
  });
  if (!receipt) throw new ApiError('Broadcast not found', 404);

  return prisma.broadcastRecipient.update({
    where: { id: receipt.id },
    data: { readAt: new Date() },
  });
}

module.exports = { createBroadcast, listSentBroadcasts, listMyBroadcasts, markBroadcastRead, resolveRecipients };
