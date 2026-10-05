const express = require('express');
const multer = require('multer');
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { uploadRequestSchema } = require('../validators/upload.validators');
const { uploadHandler } = require('../controllers/upload.controller');

const router = express.Router();

// Memory storage, not disk — the file only ever needs to exist as a
// buffer long enough for sharp to process it and hand the result to
// Supabase; it's never written to this server's own disk. 10MB covers a
// typical phone photo before compression with real headroom.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Any authenticated student can upload a profile/cover/post image (the
// destination path is always their own — see resolvePath in
// upload.service.js). YearBook uploads are staff-only since only staff
// manage YearBook assets. multer runs BEFORE validate() because it's what
// parses the multipart body in the first place — validate() checking
// req.body.purpose only works once multer has populated it.
router.post(
  '/',
  authenticate,
  upload.single('file'),
  validate(uploadRequestSchema),
  (req, res, next) => {
    if (['yearbook', 'institution-logo'].includes(req.body.purpose)) {
      return requireRole('SUPER_ADMIN', 'INSTITUTION_ADMIN', 'YEARBOOK_ADMIN')(req, res, next);
    }
    next();
  },
  uploadHandler
);

module.exports = router;
