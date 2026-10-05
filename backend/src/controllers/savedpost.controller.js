const savedPostService = require('../services/savedpost.service');
const { ok, created } = require('../utils/apiResponse');

async function saveHandler(req, res, next) {
  try {
    const saved = await savedPostService.savePost(req.context, req.params.id);
    return created(res, saved);
  } catch (err) {
    next(err);
  }
}

async function unsaveHandler(req, res, next) {
  try {
    const result = await savedPostService.unsavePost(req.context.studentId, req.params.id);
    return ok(res, result);
  } catch (err) {
    next(err);
  }
}

async function listHandler(req, res, next) {
  try {
    const posts = await savedPostService.listSavedPosts(req.context.studentId);
    return ok(res, posts);
  } catch (err) {
    next(err);
  }
}

module.exports = { saveHandler, unsaveHandler, listHandler };
