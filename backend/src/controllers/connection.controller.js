const connectionService = require('../services/connection.service');
const { ok, created } = require('../utils/apiResponse');

async function sendRequestHandler(req, res, next) {
  try {
    const connection = await connectionService.sendRequest(req.context.studentId, req.params.studentId);
    return created(res, connection);
  } catch (err) {
    next(err);
  }
}

async function acceptHandler(req, res, next) {
  try {
    const connection = await connectionService.respondToRequest(
      req.context.studentId,
      req.params.studentId,
      'accept'
    );
    return ok(res, connection);
  } catch (err) {
    next(err);
  }
}

async function rejectHandler(req, res, next) {
  try {
    const connection = await connectionService.respondToRequest(
      req.context.studentId,
      req.params.studentId,
      'reject'
    );
    return ok(res, connection);
  } catch (err) {
    next(err);
  }
}

async function removeHandler(req, res, next) {
  try {
    const result = await connectionService.cancelOrRemove(req.context.studentId, req.params.studentId);
    return ok(res, result);
  } catch (err) {
    next(err);
  }
}

async function blockHandler(req, res, next) {
  try {
    const connection = await connectionService.block(req.context.studentId, req.params.studentId);
    return ok(res, connection);
  } catch (err) {
    next(err);
  }
}

async function listConnectionsHandler(req, res, next) {
  try {
    const connections = await connectionService.listConnections(req.context.studentId);
    return ok(res, connections);
  } catch (err) {
    next(err);
  }
}

async function listPendingHandler(req, res, next) {
  try {
    const pending = await connectionService.listPendingReceived(req.context.studentId);
    return ok(res, pending);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  sendRequestHandler,
  acceptHandler,
  rejectHandler,
  removeHandler,
  blockHandler,
  listConnectionsHandler,
  listPendingHandler,
};
