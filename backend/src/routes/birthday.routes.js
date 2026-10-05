const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { listUpcomingBirthdaysHandler } = require('../controllers/birthday.controller');

const router = express.Router();
router.get('/', authenticate, listUpcomingBirthdaysHandler);
module.exports = router;
