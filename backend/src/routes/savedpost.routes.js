const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { saveHandler, unsaveHandler, listHandler } = require('../controllers/savedpost.controller');

const router = express.Router();

router.get('/', authenticate, listHandler);
router.post('/:id', authenticate, saveHandler);
router.delete('/:id', authenticate, unsaveHandler);

module.exports = router;
