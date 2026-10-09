const studentService = require('../services/student.service');
const { ok, created } = require('../utils/apiResponse');

async function getMeHandler(req, res, next) {
  try {
    const student = await studentService.getStudentById(req.context.studentId, req.context);
    return ok(res, student);
  } catch (err) {
    next(err);
  }
}

async function updateMeHandler(req, res, next) {
  try {
    const student = await studentService.updateOwnProfile(req.context.studentId, req.body);
    return ok(res, student);
  } catch (err) {
    next(err);
  }
}

async function getStudentHandler(req, res, next) {
  try {
    const student = await studentService.getStudentById(req.params.id, req.context);
    return ok(res, student);
  } catch (err) {
    next(err);
  }
}

async function searchStudentsHandler(req, res, next) {
  try {
    const result = await studentService.searchStudents(req.context, req.query);
    return ok(res, result);
  } catch (err) {
    next(err);
  }
}

async function adminSearchStudentsHandler(req, res, next) {
  try {
    const result = await studentService.adminSearchStudents(req.context.institutionId, req.query);
    return ok(res, result);
  } catch (err) {
    next(err);
  }
}

async function adminCreateStudentHandler(req, res, next) {
  try {
    const student = await studentService.adminCreateStudent(req.context.institutionId, req.body);
    return created(res, student);
  } catch (err) {
    next(err);
  }
}

async function adminAnalyzeCsvHandler(req, res, next) {
  try { return ok(res, await studentService.analyzeStudentCsv(req.context.institutionId, req.body.csv, { setId: req.body.setId })); } catch (err) { next(err); }
}

async function adminBulkImportHandler(req, res, next) {
  try { return created(res, await studentService.bulkCreateStudents(req.context.institutionId, req.body.csv, { setId: req.body.setId })); } catch (err) { next(err); }
}

async function adminUpdateStudentHandler(req, res, next) {
  try {
    const student = await studentService.adminUpdateStudent(
      req.context.institutionId,
      req.params.id,
      req.body
    );
    return ok(res, student);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMeHandler,
  updateMeHandler,
  getStudentHandler,
  searchStudentsHandler,
  adminSearchStudentsHandler,
  adminCreateStudentHandler,
  adminUpdateStudentHandler,
  adminAnalyzeCsvHandler,
  adminBulkImportHandler,
};
