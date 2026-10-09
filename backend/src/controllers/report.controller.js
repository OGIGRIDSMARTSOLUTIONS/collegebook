const reportService = require('../services/report.service');
const { ok, created } = require('../utils/apiResponse');

async function submitHandler(req, res, next) {
  try {
    const report = await reportService.submitReport(req.context, req.body);
    return created(res, report);
  } catch (err) {
    next(err);
  }
}

async function listHandler(req, res, next) {
  try {
    const reports = await reportService.listForInstitution(req.context, req.query.status);
    return ok(res, reports);
  } catch (err) {
    next(err);
  }
}

async function reviewHandler(req, res, next) {
  try {
    const report = await reportService.reviewReport(req.context, req.params.id, req.body.action);
    return ok(res, report);
  } catch (err) {
    next(err);
  }
}

module.exports = { submitHandler, listHandler, reviewHandler };
