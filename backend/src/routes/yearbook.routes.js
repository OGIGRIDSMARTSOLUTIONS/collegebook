const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  createYearBookSchema,
  syncYearBookStudentsSchema,
  addSectionSchema,
  addStudentEntrySchema,
  addPhotoSchema,
  addContentSchema,
} = require('../validators/yearbook.validators');
const {
  createHandler,
  syncStudentsHandler,
  getHandler,
  listMineHandler,
  listAdminHandler,
  publishHandler,
  archiveHandler,
  addSectionHandler,
  addStudentEntryHandler,
  addPhotoHandler,
  addContentHandler,
  listStudentsHandler,
} = require('../controllers/yearbook.controller');

const router = express.Router();

const STAFF = ['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'YEARBOOK_ADMIN'];

// Student-facing — own institution's PUBLISHED yearbooks only (§53).
router.get('/me', authenticate, listMineHandler);

// Staff-facing admin list — own institution, all statuses.
router.get('/admin', authenticate, requireRole(...STAFF), listAdminHandler);

router.post('/', authenticate, requireRole(...STAFF), validate(createYearBookSchema), createHandler);

// Single YearBook — visibility branches internally by role/status (see service).
router.get('/:id', authenticate, getHandler);
router.get('/:id/students', authenticate, listStudentsHandler);

router.post('/:id/publish', authenticate, requireRole(...STAFF), publishHandler);
router.post('/:id/archive', authenticate, requireRole(...STAFF), archiveHandler);
// Adds every student of the YearBook's class who isn't listed yet (and links
// an older, class-less YearBook to a class first).
router.post('/:id/sync-students', authenticate, requireRole(...STAFF), validate(syncYearBookStudentsSchema), syncStudentsHandler);

router.post('/:id/sections', authenticate, requireRole(...STAFF), validate(addSectionSchema), addSectionHandler);
router.post(
  '/:id/students',
  authenticate,
  requireRole(...STAFF),
  validate(addStudentEntrySchema),
  addStudentEntryHandler
);
router.post('/:id/photos', authenticate, requireRole(...STAFF), validate(addPhotoSchema), addPhotoHandler);

router.post(
  '/sections/:sectionId/contents',
  authenticate,
  requireRole(...STAFF),
  validate(addContentSchema),
  addContentHandler
);

module.exports = router;
