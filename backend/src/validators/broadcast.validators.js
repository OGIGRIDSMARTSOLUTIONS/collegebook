const { z } = require('zod');

const createBroadcastSchema = z
  .object({
    title: z.string().min(1).max(200),
    body: z.string().min(1).max(5000),
    scope: z.enum(['ALL', 'SET', 'DEPARTMENT', 'FACULTY', 'CUSTOM']).default('ALL'),
    scopeIds: z.array(z.string()).optional(),
  })
  .refine((data) => data.scope === 'ALL' || (data.scopeIds && data.scopeIds.length > 0), {
    message: 'scopeIds is required for anything other than scope "ALL"',
    path: ['scopeIds'],
  });

const broadcastQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

module.exports = { createBroadcastSchema, broadcastQuerySchema };
