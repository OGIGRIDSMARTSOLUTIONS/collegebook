const { z } = require('zod');

const updateOwnProfileSchema = z.object({
  username: z.string().trim().regex(/^[a-zA-Z0-9_]{3,30}$/, 'Username must be 3 to 30 characters using letters, numbers, or underscores').optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(120).optional(),
  gender: z.string().max(30).optional(),
  phoneNumber: z.string().regex(/^\d{7,11}$/, 'Phone number must contain 7 to 11 digits').optional(),
  dateOfBirth: z.string().datetime().optional(),
  profilePhotoUrl: z.string().url().optional(),
  coverPhotoUrl: z.string().url().optional(),
});

const searchStudentsSchema = z.object({
  q: z.string().optional(),
  institutionCode: z.string().optional(),
  departmentId: z.string().optional(),
  setId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

// No institutionCode here — deliberately. This is the admin-only search
// (see student.routes.js's /admin-search), and institution scope always
// comes from the acting admin's own req.context, never a query param.
const adminSearchStudentsSchema = z.object({
  q: z.string().optional(),
  setId: z.string().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

const adminCreateStudentSchema = z.object({
  name: z.string().min(2).max(160),
  matriculationNumber: z.string().min(1).max(80),
  departmentId: z.string().min(1),
  phoneNumber: z.string().regex(/^\d{7,11}$/, 'Phone number must contain 7 to 11 digits'),
  setId: z.string().min(1).optional(), // class to add to; newest class if omitted
});

const adminBulkCsvSchema = z.object({
  csv: z.string().min(10).max(5_000_000),
  setId: z.string().min(1).optional(), // class to import into; newest class if omitted
});

const adminUpdateStudentSchema = z.object({
  verificationStatus: z.enum(['PENDING', 'VERIFIED', 'SUSPENDED', 'GRADUATED', 'ALUMNI']).optional(),
  setId: z.string().optional(),
  departmentId: z.string().optional(),
  facultyId: z.string().optional(),
  studentNumber: z.string().min(1).max(80).optional(),
  phoneNumber: z.string().regex(/^\d{7,11}$/, 'Phone number must contain 7 to 11 digits').optional(),
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  dateOfBirth: z.string().datetime().nullable().optional(),
});

module.exports = { updateOwnProfileSchema, searchStudentsSchema, adminSearchStudentsSchema, adminCreateStudentSchema, adminUpdateStudentSchema, adminBulkCsvSchema };
