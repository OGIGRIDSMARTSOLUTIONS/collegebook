const { z } = require('zod');

const eventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  eventDate: z.string().datetime(),
  endDate: z.string().datetime().optional().nullable(),
  location: z.string().max(300).optional().nullable(),
  category: z.string().min(1).max(50).default('GENERAL'),
  isPublished: z.boolean().optional(),
});

module.exports = { eventSchema };
