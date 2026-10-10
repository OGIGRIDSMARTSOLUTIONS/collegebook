const express = require('express');
const { z } = require('zod');
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
  adminSetAccountStatusHandler,
  adminCreateStudentHandler,
  adminUpdateStudentHandler,
  adminAnalyzeCsvHandler,
  adminBulkImportHandler,
} = require('../controllers/student.controller');
const { getStudentInstitutionId } = require('../services/student.service');

const automation = require('../services/studentAccessAutomation.service');
const { ok } = require('../utils/apiResponse');
const router = express.Router();

router.patch('/:id/registry-approval', authenticate, requireRole('INSTITUTION_ADMIN'),
  requireInstitutionScope((req) => getStudentInstitutionId(req.params.id)),
  validate(z.object({
    approved: z.boolean(),
    reason: z.string().trim().max(500).optional(),
  })), async (req, res, next) => {
    try { return ok(res, await automation.updateApproval(req.context.institutionId, req.params.id, req.body, req.context.userId)); }
    catch (error) { next(error); }
  });

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

router.patch(
  '/:id/account-status',
  authenticate,
  requireRole('INSTITUTION_ADMIN'),
  requireInstitutionScope((req) => getStudentInstitutionId(req.params.id)),
  validate(z.object({
    status: z.enum(['ACTIVE', 'SUSPENDED']),
    reason: z.string().trim().max(500).optional(),
  })),
  adminSetAccountStatusHandler
);

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
