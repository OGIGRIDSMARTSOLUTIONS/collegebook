const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { validateQuery } = require('../middleware/validate.middleware');
const { notificationQuerySchema } = require('../validators/notification.validators');
const {
  listHandler,
  unreadCountHandler,
  markReadHandler,
  markAllReadHandler,
} = require('../controllers/notification.controller');

const router = express.Router();

router.get('/', authenticate, validateQuery(notificationQuerySchema), listHandler);
router.get('/unread-count', authenticate, unreadCountHandler);
router.post('/:id/read', authenticate, markReadHandler);
router.post('/read-all', authenticate, markAllReadHandler);

module.exports = router;
