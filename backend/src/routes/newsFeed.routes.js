const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const {
  listCategories,
  listFeeds,
  listNigeria,
  readArticle,
} = require('../controllers/newsFeed.controller');

const router = express.Router();

router.get('/categories', authenticate, listCategories);
router.get('/nigeria', authenticate, listNigeria);
router.get('/reader', authenticate, readArticle);
router.get('/', authenticate, listFeeds);

module.exports = router;
