const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createGroupSchema, updateMemberRoleSchema } = require('../validators/group.validators');
const { createPostSchema } = require('../validators/post.validators');
const {
  createHandler,
  getHandler,
  listHandler,
  joinHandler,
  leaveHandler,
  addMemberHandler,
  removeMemberHandler,
  updateMemberRoleHandler,
  listMembersHandler,
  listGroupPostsHandler,
  createGroupPostHandler,
} = require('../controllers/group.controller');

const router = express.Router();

router.get('/', authenticate, listHandler);
router.post('/', authenticate, validate(createGroupSchema), createHandler);

router.get('/:id', authenticate, getHandler);
router.get('/:id/members', authenticate, listMembersHandler);
router.get('/:id/posts', authenticate, listGroupPostsHandler);
router.post('/:id/posts', authenticate, validate(createPostSchema), createGroupPostHandler);

router.post('/:id/join', authenticate, joinHandler);
router.post('/:id/leave', authenticate, leaveHandler);

router.post('/:id/members/:studentId', authenticate, addMemberHandler);
router.delete('/:id/members/:studentId', authenticate, removeMemberHandler);
router.patch('/:id/members/:studentId', authenticate, validate(updateMemberRoleSchema), updateMemberRoleHandler);

module.exports = router;
