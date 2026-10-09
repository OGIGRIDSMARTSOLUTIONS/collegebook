const notificationService = require('../services/notification.service');
const { ok } = require('../utils/apiResponse');

async function listHandler(req, res, next) {
  try {
    const result = await notificationService.listNotifications(req.context.studentId, req.query);
    return ok(res, result);
  } catch (err) {
    next(err);
  }
}

async function unreadCountHandler(req, res, next) {
  try {
    const result = await notificationService.getUnreadCount(req.context.studentId);
    return ok(res, result);
  } catch (err) {
    next(err);
  }
}

async function markReadHandler(req, res, next) {
  try {
    const notification = await notificationService.markAsRead(req.context.studentId, req.params.id);
    return ok(res, notification);
  } catch (err) {
    next(err);
  }
}

async function markAllReadHandler(req, res, next) {
  try {
    const result = await notificationService.markAllAsRead(req.context.studentId);
    return ok(res, result);
  } catch (err) {
    next(err);
  }
}

module.exports = { listHandler, unreadCountHandler, markReadHandler, markAllReadHandler };
