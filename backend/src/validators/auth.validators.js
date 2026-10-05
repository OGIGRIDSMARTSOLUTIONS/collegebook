const { z } = require('zod');

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  matriculationNumber: z.string().min(1, 'Matriculation number is required').max(80),
  // departmentId comes from the registration dropdown (which only lists
  // the departments of the school holding this matric number). The
  // free-text department is still accepted for older app versions.
  departmentId: z.string().min(1).max(60).optional(),
  department: z.string().max(160).optional(),
  phoneNumber: z.string().min(7, 'Enter a valid phone number').max(25).optional(),
}).refine((data) => Boolean(data.departmentId || data.department?.trim() || data.phoneNumber?.trim()), {
  message: 'Provide either your department or phone number',
  path: ['department'],
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const googleLoginSchema = z.object({
  credential: z.string().min(1), // the raw Google ID token (JWT) from Google Identity Services
});

const registrationDepartmentsSchema = z.object({
  matriculationNumber: z.string().trim().min(1, 'Matriculation number is required').max(80),
});

module.exports = { registerSchema, loginSchema, googleLoginSchema, registrationDepartmentsSchema };
