const { z } = require('zod');

const uploadRequestSchema = z.object({
  purpose: z.enum(['profile', 'cover', 'post', 'yearbook', 'institution-logo']),
});

module.exports = { uploadRequestSchema };
