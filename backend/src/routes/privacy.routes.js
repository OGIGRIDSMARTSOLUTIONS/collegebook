const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { updatePrivacySchema } = require('../validators/privacy.validators');
const { getMyPrivacyHandler, updateMyPrivacyHandler } = require('../controllers/privacy.controller');

const router = express.Router();

router.get('/me', authenticate, getMyPrivacyHandler);
router.patch('/me', authenticate, validate(updatePrivacySchema), updateMyPrivacyHandler);

module.exports = router;
