const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { validate, validateQuery } = require('../middleware/validate.middleware');
const {
  createPostSchema,
  createCommentSchema,
  reactionSchema,
  feedQuerySchema,
} = require('../validators/post.validators');
const {
  createPostHandler,
  getPostHandler,
  deletePostHandler,
  getFeedHandler,
  listStudentPostsHandler,
  createCommentHandler,
  listCommentsHandler,
  reactToPostHandler,
  reactToCommentHandler,
} = require('../controllers/post.controller');

const router = express.Router();

router.get('/feed', authenticate, validateQuery(feedQuerySchema), getFeedHandler);

router.post('/', authenticate, validate(createPostSchema), createPostHandler);
router.get('/:id', authenticate, getPostHandler);
router.delete('/:id', authenticate, deletePostHandler);

router.get('/student/:id', authenticate, validateQuery(feedQuerySchema), listStudentPostsHandler);

router.post('/:id/comments', authenticate, validate(createCommentSchema), createCommentHandler);
router.get('/:id/comments', authenticate, listCommentsHandler);

router.post('/:id/reactions', authenticate, validate(reactionSchema), reactToPostHandler);
router.post('/comments/:id/reactions', authenticate, validate(reactionSchema), reactToCommentHandler);

module.exports = router;
