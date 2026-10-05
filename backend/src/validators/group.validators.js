const { z } = require('zod');

const createGroupSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().max(1000).optional(),
  kind: z.enum(['PUBLIC', 'PRIVATE']).default('PUBLIC'),
});

const updateMemberRoleSchema = z.object({
  role: z.enum(['MEMBER', 'MODERATOR', 'ADMIN']),
});

module.exports = { createGroupSchema, updateMemberRoleSchema };
