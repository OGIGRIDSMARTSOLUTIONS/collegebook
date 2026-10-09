const { z } = require('zod');

// Browser <input type="date"> controls submit YYYY-MM-DD. Keep the API
// contract in that format and let the service convert it to Prisma DateTime.
const optionalDateOfBirth = z
  .union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format'),
    z.literal(''),
    z.null(),
  ])
  .optional();

const optionalPhoneNumber = z
  .union([
    z.string().trim().regex(/^\d{7,11}$/, 'Phone number must contain 7 to 11 digits'),
    z.literal(''),
    z.null(),
  ])
  .optional();

const updateOwnProfileSchema = z.object({
  username: z
    .union([
      z.string().trim().regex(/^[a-zA-Z0-9_]{3,30}$/, 'Username must be 3 to 30 characters using letters, numbers, or underscores'),
      z.literal(''),
      z.null(),
    ])
    .optional(),
  bio: z.union([z.string().max(500), z.null()]).optional(),
  location: z.union([z.string().max(120), z.null()]).optional(),
  gender: z.union([z.string().max(30), z.null()]).optional(),
  phoneNumber: optionalPhoneNumber,
  dateOfBirth: optionalDateOfBirth,
  profilePhotoUrl: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
  coverPhotoUrl: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
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
  phoneNumber: z.string().trim().regex(/^\d{7,11}$/, 'Phone number must contain 7 to 11 digits'),
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
  phoneNumber: optionalPhoneNumber,
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  dateOfBirth: optionalDateOfBirth,
});

module.exports = {
  updateOwnProfileSchema,
  searchStudentsSchema,
  adminSearchStudentsSchema,
  adminCreateStudentSchema,
  adminUpdateStudentSchema,
  adminBulkCsvSchema,
};
