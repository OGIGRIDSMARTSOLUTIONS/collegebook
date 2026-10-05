const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createReportSchema, reviewReportSchema } = require('../validators/report.validators');
const { submitHandler, listHandler, reviewHandler } = require('../controllers/report.controller');

const router = express.Router();

const MODERATORS = ['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'INSTITUTION_MODERATOR'];

router.post('/', authenticate, validate(createReportSchema), submitHandler);
router.get('/', authenticate, requireRole(...MODERATORS), listHandler);
router.post('/:id/review', authenticate, requireRole(...MODERATORS), validate(reviewReportSchema), reviewHandler);

module.exports = router;
