const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { requireInstitutionScope } = require('../middleware/tenant.middleware');
const { validate, validateQuery } = require('../middleware/validate.middleware');
const {
  updateOwnProfileSchema,
  searchStudentsSchema,
  adminSearchStudentsSchema,
  adminCreateStudentSchema,
  adminUpdateStudentSchema,
  adminBulkCsvSchema,
} = require('../validators/student.validators');
const {
  getMeHandler,
  updateMeHandler,
  getStudentHandler,
  searchStudentsHandler,
  adminSearchStudentsHandler,
  adminCreateStudentHandler,
  adminUpdateStudentHandler,
  adminAnalyzeCsvHandler,
  adminBulkImportHandler,
} = require('../controllers/student.controller');
const { getStudentInstitutionId } = require('../services/student.service');

const router = express.Router();

router.get('/me', authenticate, getMeHandler);
router.patch('/me', authenticate, validate(updateOwnProfileSchema), updateMeHandler);

router.get('/search', authenticate, validateQuery(searchStudentsSchema), searchStudentsHandler);

// Admin-only contact-detail search (name, email, phone) — must be
// registered before '/:id' below, or Express would match "admin-search"
// as an :id value instead of reaching this route at all.
router.get(
  '/admin-search',
  authenticate,
  requireRole('INSTITUTION_ADMIN'),
  validateQuery(adminSearchStudentsSchema),
  adminSearchStudentsHandler
);

router.post(
  '/admin',
  authenticate,
  requireRole('INSTITUTION_ADMIN'),
  validate(adminCreateStudentSchema),
  adminCreateStudentHandler
);

router.post('/admin/bulk-analyze', authenticate, requireRole('INSTITUTION_ADMIN'), validate(adminBulkCsvSchema), adminAnalyzeCsvHandler);
router.post('/admin/bulk-import', authenticate, requireRole('INSTITUTION_ADMIN'), validate(adminBulkCsvSchema), adminBulkImportHandler);

router.get('/:id', authenticate, getStudentHandler);

// Admin editing a student — requireInstitutionScope re-derives the
// student's REAL institutionId from the DB and compares it against the
// acting admin's own institutionId. A malicious :id belonging to another
// institution is rejected here, before adminUpdateStudent even runs.
router.patch(
  '/:id',
  authenticate,
  requireRole('INSTITUTION_ADMIN'),
  requireInstitutionScope((req) => getStudentInstitutionId(req.params.id)),
  validate(adminUpdateStudentSchema),
  adminUpdateStudentHandler
);

module.exports = router;
