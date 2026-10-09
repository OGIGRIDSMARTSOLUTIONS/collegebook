const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { eventSchema } = require('../validators/event.validators');
const { listEvents, listAdminEvents, createEvent, updateEvent, deleteEvent } = require('../controllers/event.controller');

const router = express.Router();
router.get('/', authenticate, listEvents);
router.get('/admin', authenticate, requireRole('INSTITUTION_ADMIN', 'INSTITUTION_MODERATOR'), listAdminEvents);
router.post('/', authenticate, requireRole('INSTITUTION_ADMIN', 'INSTITUTION_MODERATOR'), validate(eventSchema), createEvent);
router.patch('/:id', authenticate, requireRole('INSTITUTION_ADMIN', 'INSTITUTION_MODERATOR'), validate(eventSchema.partial()), updateEvent);
router.delete('/:id', authenticate, requireRole('INSTITUTION_ADMIN', 'INSTITUTION_MODERATOR'), deleteEvent);
module.exports = router;
