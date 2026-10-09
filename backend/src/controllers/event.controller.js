const eventService = require('../services/event.service');
const { ok, created } = require('../utils/apiResponse');

async function listEvents(req, res, next) { try { return ok(res, await eventService.listPublished(req.context.institutionId, { upcoming: req.query.upcoming !== 'false' })); } catch (e) { next(e); } }
async function listAdminEvents(req, res, next) { try { return ok(res, await eventService.listAdmin(req.context.institutionId)); } catch (e) { next(e); } }
async function createEvent(req, res, next) { try { return created(res, await eventService.create(req.context.institutionId, req.context.userId, req.body)); } catch (e) { next(e); } }
async function updateEvent(req, res, next) { try { return ok(res, await eventService.update(req.context.institutionId, req.params.id, req.body)); } catch (e) { next(e); } }
async function deleteEvent(req, res, next) { try { return ok(res, await eventService.remove(req.context.institutionId, req.params.id)); } catch (e) { next(e); } }
module.exports = { listEvents, listAdminEvents, createEvent, updateEvent, deleteEvent };
