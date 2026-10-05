const groupService = require('../services/group.service');
const postService = require('../services/post.service');
const { ok, created } = require('../utils/apiResponse');

async function createHandler(req, res, next) {
  try {
    const group = await groupService.createGroup(req.context, req.body);
    return created(res, group);
  } catch (err) {
    next(err);
  }
}

async function getHandler(req, res, next) {
  try {
    const group = await groupService.getGroupOrThrow(req.params.id, req.context);
    return ok(res, group);
  } catch (err) {
    next(err);
  }
}

async function listHandler(req, res, next) {
  try {
    const groups = await groupService.listDiscoverable(req.context);
    return ok(res, groups);
  } catch (err) {
    next(err);
  }
}

async function joinHandler(req, res, next) {
  try {
    const membership = await groupService.join(req.params.id, req.context.studentId);
    return created(res, membership);
  } catch (err) {
    next(err);
  }
}

async function leaveHandler(req, res, next) {
  try {
    const result = await groupService.leave(req.params.id, req.context.studentId);
    return ok(res, result);
  } catch (err) {
    next(err);
  }
}

async function addMemberHandler(req, res, next) {
  try {
    const membership = await groupService.addMember(req.context, req.params.id, req.params.studentId);
    return created(res, membership);
  } catch (err) {
    next(err);
  }
}

async function removeMemberHandler(req, res, next) {
  try {
    const result = await groupService.removeMember(req.context, req.params.id, req.params.studentId);
    return ok(res, result);
  } catch (err) {
    next(err);
  }
}

async function updateMemberRoleHandler(req, res, next) {
  try {
    const membership = await groupService.updateMemberRole(
      req.context,
      req.params.id,
      req.params.studentId,
      req.body.role
    );
    return ok(res, membership);
  } catch (err) {
    next(err);
  }
}

async function listMembersHandler(req, res, next) {
  try {
    const members = await groupService.listMembers(req.params.id, req.context);
    return ok(res, members);
  } catch (err) {
    next(err);
  }
}

async function createGroupPostHandler(req, res, next) {
  try {
    // Convenience alias so POST /groups/:id/posts mirrors the GET listing
    // route — internally reuses the same postService.createPost the
    // general POST /api/posts endpoint uses, with groupId taken from the
    // URL param rather than requiring the client to pass it in the body.
    const post = await postService.createPost(req.context, { ...req.body, groupId: req.params.id });
    return created(res, post);
  } catch (err) {
    next(err);
  }
}

async function listGroupPostsHandler(req, res, next) {
  try {
    const posts = await postService.listGroupPosts(req.params.id, req.context);
    return ok(res, posts);
  } catch (err) {
    next(err);
  }
}

module.exports = {
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
};
