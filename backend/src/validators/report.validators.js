const { z } = require('zod');

// V1 scope: POST/COMMENT reporting only — the Report model has no columns
// to reference a reported profile or message yet (ReportTargetType lists
// PROFILE/MESSAGE, but reportedStudentId/messageId fields don't exist).
// Flagged as a schema follow-up rather than half-implemented here.
const createReportSchema = z
  .object({
    targetType: z.enum(['POST', 'COMMENT']),
    postId: z.string().optional(),
    commentId: z.string().optional(),
    reason: z.string().min(1).max(500),
  })
  .refine((data) => (data.targetType === 'POST' ? !!data.postId : !!data.commentId), {
    message: 'postId is required for targetType POST, commentId for targetType COMMENT',
  });

const reviewReportSchema = z.object({
  action: z.enum(['DISMISS', 'ACTION']),
});

module.exports = { createReportSchema, reviewReportSchema };
