const birthdayService = require('../services/birthday.service');
const { ok } = require('../utils/apiResponse');

async function listUpcomingBirthdaysHandler(req, res, next) {
  try {
    const days = Math.min(Math.max(Number(req.query.days) || 14, 1), 90);
    return ok(res, await birthdayService.listUpcomingBirthdays(req.context.institutionId, days));
  } catch (err) {
    next(err);
  }
}

module.exports = { listUpcomingBirthdaysHandler };
