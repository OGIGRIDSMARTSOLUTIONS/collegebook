const prisma = require('../config/db');

/**
 * record — §11 of the architecture doc: admin-privileged actions are
 * logged, append-only, never updated or deleted. Called explicitly at the
 * point of action rather than via a generic middleware, so the metadata
 * captured is meaningful per action rather than a raw request dump.
 */
async function record({ institutionId, actorUserId, action, targetType, targetId, metadata, ip }) {
  return prisma.auditLog.create({
    data: { institutionId, actorUserId, action, targetType, targetId, metadata, ip },
  });
}

module.exports = { record };
