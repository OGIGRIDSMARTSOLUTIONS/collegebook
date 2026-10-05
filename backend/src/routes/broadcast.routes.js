const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { validate, validateQuery } = require('../middleware/validate.middleware');
const { broadcastLimiter } = require('../middleware/rateLimit.middleware');
const { createBroadcastSchema, broadcastQuerySchema } = require('../validators/broadcast.validators');
const {
  createBroadcastHandler,
  listSentHandler,
  listMineHandler,
  markReadHandler,
} = require('../controllers/broadcast.controller');

const router = express.Router();

// Institution-admin scoped — always targets the acting admin's OWN
// institution (req.context.institutionId), never a client-supplied one.
router.post(
  '/',
  authenticate,
  requireRole('INSTITUTION_ADMIN', 'INSTITUTION_MODERATOR'),
  broadcastLimiter,
  validate(createBroadcastSchema),
  createBroadcastHandler
);
router.get(
  '/sent',
  authenticate,
  requireRole('INSTITUTION_ADMIN', 'INSTITUTION_MODERATOR'),
  validateQuery(broadcastQuerySchema),
  listSentHandler
);

// Student-facing
router.get('/me', authenticate, validateQuery(broadcastQuerySchema), listMineHandler);
router.post('/:id/read', authenticate, markReadHandler);

module.exports = router;
