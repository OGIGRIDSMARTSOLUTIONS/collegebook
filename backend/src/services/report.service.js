const prisma = require('../config/db');
const { ApiError } = require('../utils/apiResponse');
const { isInstitutionStaff } = require('./permission.service');
const auditService = require('./audit.service');

async function submitReport(reporterContext, { targetType, postId, commentId, reason }) {
  if (targetType === 'POST') {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.deletedAt) throw new ApiError('Post not found', 404);
  } else {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment || comment.deletedAt) throw new ApiError('Comment not found', 404);
  }

  return prisma.report.create({
    data: {
      reporterId: reporterContext.studentId,
      targetType,
      postId: targetType === 'POST' ? postId : undefined,
      commentId: targetType === 'COMMENT' ? commentId : undefined,
      reason,
    },
  });
}

/**
 * listForInstitution — Report has no institutionId column (it's owned by
 * the reporter, not a tenant), so institution scoping is done via the
 * reported content's own institution — nested relation filters, not a
 * direct column. Same intent as everywhere else: an admin only ever sees
 * reports that resolve back to their own institution's content.
 */
async function listForInstitution(actorContext, status) {
  if (!isInstitutionStaff(actorContext.role) && actorContext.role !== 'SUPER_ADMIN') {
    throw new ApiError('Insufficient permissions', 403);
  }

  return prisma.report.findMany({
    where: {
      ...(status ? { status } : {}),
      OR: [
        { post: { institutionId: actorContext.institutionId } },
        { comment: { post: { institutionId: actorContext.institutionId } } },
      ],
    },
    include: {
      post: true,
      comment: { include: { post: true } },
      reporter: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function reviewReport(actorContext, reportId, action) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { post: true, comment: { include: { post: true } } },
  });
  if (!report) throw new ApiError('Report not found', 404);

  const targetInstitutionId = report.post?.institutionId ?? report.comment?.post?.institutionId;
  const isStaffOfInstitution =
    isInstitutionStaff(actorContext.role) && actorContext.institutionId === targetInstitutionId;
  if (actorContext.role !== 'SUPER_ADMIN' && !isStaffOfInstitution) {
    throw new ApiError('Report not found', 404); // don't confirm cross-institution report contents exist
  }

  if (action === 'ACTION') {
    if (report.postId) {
      await prisma.post.update({ where: { id: report.postId }, data: { deletedAt: new Date() } });
    } else if (report.commentId) {
      await prisma.comment.update({ where: { id: report.commentId }, data: { deletedAt: new Date() } });
    }
  }

  const updated = await prisma.report.update({
    where: { id: reportId },
    data: { status: action === 'ACTION' ? 'ACTIONED' : 'DISMISSED' },
  });

  await auditService.record({
    institutionId: targetInstitutionId,
    actorUserId: actorContext.userId,
    action: action === 'ACTION' ? 'ACTION_REPORT' : 'DISMISS_REPORT',
    targetType: report.targetType,
    targetId: report.postId || report.commentId,
    metadata: { reportId },
  });

  return updated;
}

module.exports = { submitReport, listForInstitution, reviewReport };
