const { z } = require('zod');

const createYearBookSchema = z.object({
  year: z.string().trim().min(4).max(30),
  setId: z.string().optional(),
  coverImageUrl: z.string().url().optional(),
  welcomeMessage: z.string().max(2000).optional(),
});

const syncYearBookStudentsSchema = z.object({
  setId: z.string().min(1).optional(),
});

const addSectionSchema = z.object({
  kind: z.enum(['FACULTY', 'DEPARTMENT', 'EVENTS', 'ACHIEVEMENTS', 'MEMORIES']),
  title: z.string().min(1).max(200),
  order: z.number().int().min(0).default(0),
});

const addStudentEntrySchema = z.object({
  studentId: z.string().min(1),
  photoUrl: z.string().url().optional(),
  quote: z.string().max(500).optional(),
});

const addPhotoSchema = z.object({
  sectionId: z.string().optional(),
  url: z.string().url(),
  caption: z.string().max(300).optional(),
});

const addContentSchema = z.object({
  body: z.string().min(1).max(5000),
});

module.exports = {
  createYearBookSchema,
  syncYearBookStudentsSchema,
  addSectionSchema,
  addStudentEntrySchema,
  addPhotoSchema,
  addContentSchema,
};
