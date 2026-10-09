const { z } = require('zod');

const messageMentionSchema = z.object({
  studentId: z.string().min(1),
  startOffset: z.number().int().min(0),
  endOffset: z.number().int().min(1),
});

const sendMessageSchema = z
  .object({
    body: z.string().max(4000).optional(),
    attachmentUrl: z.string().url().optional(),
    mentions: z.array(messageMentionSchema).max(20).optional(),
  })
  .refine((data) => data.body || data.attachmentUrl, {
    message: 'Message must have a body or an attachment',
  });

const messageListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(30),
});

module.exports = { sendMessageSchema, messageListQuerySchema };
