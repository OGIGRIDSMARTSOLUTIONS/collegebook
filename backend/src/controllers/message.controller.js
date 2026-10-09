const messageService = require('../services/message.service');
const { getIO } = require('../websocket/socket');
const { ok, created } = require('../utils/apiResponse');

async function startConversationHandler(req, res, next) {
  try {
    const conversation = await messageService.startOrGetPrivateConversation(
      req.context,
      req.params.studentId
    );
    return created(res, conversation);
  } catch (err) {
    next(err);
  }
}

async function listConversationsHandler(req, res, next) {
  try {
    const conversations = await messageService.listConversations(req.context.studentId);
    return ok(res, conversations);
  } catch (err) {
    next(err);
  }
}

async function sendMessageHandler(req, res, next) {
  try {
    const message = await messageService.sendMessage(req.context, req.params.id, req.body);

    // Real-time fan-out. If Socket.IO hasn't been initialized (e.g. this
    // route is hit outside the normal server bootstrap, such as in a
    // test), getIO() returns null and we just skip the emit rather than
    // fail the request — the message is already persisted either way.
    const io = getIO();
    if (io) io.to(`conversation:${req.params.id}`).emit('message:received', message);

    return created(res, message);
  } catch (err) {
    next(err);
  }
}

async function listMessagesHandler(req, res, next) {
  try {
    const messages = await messageService.listMessages(req.params.id, req.context.studentId, req.query);
    return ok(res, messages);
  } catch (err) {
    next(err);
  }
}

async function markReadHandler(req, res, next) {
  try {
    const result = await messageService.markRead(req.params.id, req.context.studentId);
    const io = getIO();
    if (io) {
      io.to(`conversation:${req.params.id}`).emit('message:read', {
        conversationId: req.params.id,
        studentId: req.context.studentId,
      });
    }
    return ok(res, result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  startConversationHandler,
  listConversationsHandler,
  sendMessageHandler,
  listMessagesHandler,
  markReadHandler,
};
