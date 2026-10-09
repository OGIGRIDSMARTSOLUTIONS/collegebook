const privacyService = require('../services/privacy.service');
const { ok } = require('../utils/apiResponse');

async function getMyPrivacyHandler(req, res, next) {
  try {
    const privacy = await privacyService.getOwnPrivacy(req.context.studentId);
    return ok(res, privacy);
  } catch (err) {
    next(err);
  }
}

async function updateMyPrivacyHandler(req, res, next) {
  try {
    const privacy = await privacyService.updateOwnPrivacy(req.context.studentId, req.body);
    return ok(res, privacy);
  } catch (err) {
    next(err);
  }
}

module.exports = { getMyPrivacyHandler, updateMyPrivacyHandler };
