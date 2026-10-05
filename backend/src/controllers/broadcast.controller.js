const broadcastService = require('../services/broadcast.service');
const { ok, created } = require('../utils/apiResponse');

async function createBroadcastHandler(req, res, next) {
  try {
    const broadcast = await broadcastService.createBroadcast(req.context, req.body, req.ip);
    return created(res, broadcast);
  } catch (err) {
    next(err);
  }
}

async function listSentHandler(req, res, next) {
  try {
    const result = await broadcastService.listSentBroadcasts(req.context.institutionId, req.query);
    return ok(res, result);
  } catch (err) {
    next(err);
  }
}

async function listMineHandler(req, res, next) {
  try {
    const result = await broadcastService.listMyBroadcasts(req.context.studentId, req.query);
    return ok(res, result);
  } catch (err) {
    next(err);
  }
}

async function markReadHandler(req, res, next) {
  try {
    const receipt = await broadcastService.markBroadcastRead(req.context.studentId, req.params.id);
    return ok(res, receipt);
  } catch (err) {
    next(err);
  }
}

module.exports = { createBroadcastHandler, listSentHandler, listMineHandler, markReadHandler };
