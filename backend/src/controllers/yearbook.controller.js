const yearbookService = require('../services/yearbook.service');
const { ok, created } = require('../utils/apiResponse');

async function createHandler(req, res, next) {
  try {
    const yearBook = await yearbookService.createYearBook(req.context, req.body);
    return created(res, yearBook);
  } catch (err) {
    next(err);
  }
}

async function syncStudentsHandler(req, res, next) {
  try {
    return ok(res, await yearbookService.syncYearBookStudents(req.context, req.params.id, req.body || {}));
  } catch (err) {
    next(err);
  }
}

async function getHandler(req, res, next) {
  try {
    const yearBook = await yearbookService.getYearBookOrThrow(req.params.id, req.context);
    return ok(res, yearBook);
  } catch (err) {
    next(err);
  }
}

async function listMineHandler(req, res, next) {
  try {
    const yearBooks = await yearbookService.listPublishedForMyInstitution(req.context);
    return ok(res, yearBooks);
  } catch (err) {
    next(err);
  }
}

async function listAdminHandler(req, res, next) {
  try {
    const yearBooks = await yearbookService.listForAdmin(req.context);
    return ok(res, yearBooks);
  } catch (err) {
    next(err);
  }
}

async function publishHandler(req, res, next) {
  try {
    const yearBook = await yearbookService.setStatus(req.context, req.params.id, 'PUBLISHED');
    return ok(res, yearBook);
  } catch (err) {
    next(err);
  }
}

async function archiveHandler(req, res, next) {
  try {
    const yearBook = await yearbookService.setStatus(req.context, req.params.id, 'ARCHIVED');
    return ok(res, yearBook);
  } catch (err) {
    next(err);
  }
}

async function addSectionHandler(req, res, next) {
  try {
    const section = await yearbookService.addSection(req.context, req.params.id, req.body);
    return created(res, section);
  } catch (err) {
    next(err);
  }
}

async function addStudentEntryHandler(req, res, next) {
  try {
    const entry = await yearbookService.addStudentEntry(req.context, req.params.id, req.body);
    return created(res, entry);
  } catch (err) {
    next(err);
  }
}

async function addPhotoHandler(req, res, next) {
  try {
    const photo = await yearbookService.addPhoto(req.context, req.params.id, req.body);
    return created(res, photo);
  } catch (err) {
    next(err);
  }
}

async function addContentHandler(req, res, next) {
  try {
    const content = await yearbookService.addContent(req.context, req.params.sectionId, req.body);
    return created(res, content);
  } catch (err) {
    next(err);
  }
}

async function listStudentsHandler(req, res, next) {
  try {
    const students = await yearbookService.listYearBookStudents(req.params.id, req.context);
    return ok(res, students);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createHandler,
  syncStudentsHandler,
  getHandler,
  listMineHandler,
  listAdminHandler,
  publishHandler,
  archiveHandler,
  addSectionHandler,
  addStudentEntryHandler,
  addPhotoHandler,
  addContentHandler,
  listStudentsHandler,
};
