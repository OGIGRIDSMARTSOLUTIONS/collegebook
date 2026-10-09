const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  createInstitutionSchema,
  createInstitutionAdminSchema,
  createFacultySchema,
  updateFacultySchema,
  createDepartmentSchema,
  updateDepartmentSchema,
  createAcademicSetSchema,
  updateInstitutionBrandingSchema,
} = require('../validators/institution.validators');
const {
  createInstitutionHandler,
  createInstitutionAdminHandler,
  listInstitutionsHandler,
  getInstitutionHandler,
  createFacultyHandler,
  updateFacultyHandler,
  createDepartmentHandler,
  updateDepartmentHandler,
  createAcademicSetHandler,
  getDashboardHandler,
  listFacultiesHandler,
  listDepartmentsHandler,
  listAcademicSetsHandler,
  updateInstitutionBrandingHandler,
} = require('../controllers/institution.controller');

const router = express.Router();

// Public — used by the registration screen to resolve an institution code.
router.get('/:institutionCode', getInstitutionHandler);

// Platform-level — onboarding a new school (SUPER_ADMIN only).
router.post(
  '/',
  authenticate,
  requireRole('SUPER_ADMIN'),
  validate(createInstitutionSchema),
  createInstitutionHandler
);


router.post(
  '/:id/admin',
  authenticate,
  requireRole('SUPER_ADMIN'),
  validate(createInstitutionAdminSchema),
  createInstitutionAdminHandler
);

// Platform-level — every institution on CollegeBook (SUPER_ADMIN only).
router.get('/', authenticate, requireRole('SUPER_ADMIN'), listInstitutionsHandler);

// Institution-admin scoped — always acts on the admin's OWN institution,
// derived from req.context, never from a client-supplied institutionId.
router.post(
  '/me/faculties',
  authenticate,
  requireRole('INSTITUTION_ADMIN'),
  validate(createFacultySchema),
  createFacultyHandler
);

router.patch(
  '/me/faculties/:id',
  authenticate,
  requireRole('INSTITUTION_ADMIN'),
  validate(updateFacultySchema),
  updateFacultyHandler
);

router.post(
  '/me/departments',
  authenticate,
  requireRole('INSTITUTION_ADMIN'),
  validate(createDepartmentSchema),
  createDepartmentHandler
);

router.patch(
  '/me/departments/:id',
  authenticate,
  requireRole('INSTITUTION_ADMIN'),
  validate(updateDepartmentSchema),
  updateDepartmentHandler
);

router.post(
  '/me/academic-sets',
  authenticate,
  requireRole('INSTITUTION_ADMIN'),
  validate(createAcademicSetSchema),
  createAcademicSetHandler
);

router.get(
  '/me/dashboard',
  authenticate,
  requireRole('INSTITUTION_ADMIN', 'INSTITUTION_MODERATOR'),
  getDashboardHandler
);


router.patch(
  '/me/branding',
  authenticate,
  requireRole('INSTITUTION_ADMIN'),
  validate(updateInstitutionBrandingSchema),
  updateInstitutionBrandingHandler
);

// Listing endpoints — needed by the admin UI to populate dropdowns
// (e.g. picking a faculty when creating a department) without which
// admins would have no way to reference existing structure by anything
// but an opaque id. Same tenant scoping as everything else: always the
// acting admin's own institution, from req.context.
router.get(
  '/me/faculties',
  authenticate,
  requireRole('INSTITUTION_ADMIN', 'INSTITUTION_MODERATOR', 'YEARBOOK_ADMIN'),
  listFacultiesHandler
);

router.get(
  '/me/departments',
  authenticate,
  requireRole('INSTITUTION_ADMIN', 'INSTITUTION_MODERATOR', 'YEARBOOK_ADMIN'),
  listDepartmentsHandler
);

router.get(
  '/me/academic-sets',
  authenticate,
  requireRole('INSTITUTION_ADMIN', 'INSTITUTION_MODERATOR', 'YEARBOOK_ADMIN'),
  listAcademicSetsHandler
);

module.exports = router;
