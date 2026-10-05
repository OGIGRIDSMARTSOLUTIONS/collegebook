const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { validate, validateQuery } = require('../middleware/validate.middleware');
const { sendMessageSchema, messageListQuerySchema } = require('../validators/message.validators');
const {
  startConversationHandler,
  listConversationsHandler,
  sendMessageHandler,
  listMessagesHandler,
  markReadHandler,
} = require('../controllers/message.controller');

const router = express.Router();

router.get('/conversations', authenticate, listConversationsHandler);
router.post('/conversations/:studentId', authenticate, startConversationHandler);

router.get('/conversations/:id/messages', authenticate, validateQuery(messageListQuerySchema), listMessagesHandler);
router.post('/conversations/:id/messages', authenticate, validate(sendMessageSchema), sendMessageHandler);
router.post('/conversations/:id/read', authenticate, markReadHandler);

module.exports = router;
