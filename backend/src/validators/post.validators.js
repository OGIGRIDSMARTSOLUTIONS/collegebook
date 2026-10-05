const { z } = require('zod');

const createPostSchema = z.object({
  body: z.string().max(5000).optional(),
  images: z.array(z.string().url()).max(10).optional(),
  linkUrl: z.string().url().optional(),
  visibility: z.enum(['PUBLIC', 'INSTITUTION', 'SET', 'CONNECTIONS']).default('INSTITUTION'),
  groupId: z.string().optional(),
  mentions: z.array(z.string()).max(20).optional(),
}).refine((data) => data.body || (data.images && data.images.length) || data.linkUrl, {
  message: 'Post must have a body, at least one image, or a link',
});

const createCommentSchema = z.object({
  body: z.string().min(1).max(2000),
  parentCommentId: z.string().optional(),
  mentions: z.array(z.string()).max(20).optional(),
});

const reactionSchema = z.object({
  type: z.enum(['LIKE', 'LOVE', 'CELEBRATE', 'SUPPORT']).default('LIKE'),
});

const feedQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

module.exports = { createPostSchema, createCommentSchema, reactionSchema, feedQuerySchema };
