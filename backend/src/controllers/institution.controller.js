const institutionService = require('../services/institution.service');
const { ok, created } = require('../utils/apiResponse');

async function createInstitutionHandler(req, res, next) {
  try {
    const institution = await institutionService.createInstitution(req.body);
    return created(res, institution);
  } catch (err) {
    next(err);
  }
}

async function listInstitutionsHandler(req, res, next) {
  try {
    const institutions = await institutionService.listAllInstitutions();
    return ok(res, institutions);
  } catch (err) {
    next(err);
  }
}


async function createInstitutionAdminHandler(req, res, next) {
  try {
    const admin = await institutionService.createInstitutionAdmin(req.params.id, req.body);
    return created(res, admin);
  } catch (err) {
    next(err);
  }
}

async function getInstitutionHandler(req, res, next) {
  try {
    const institution = await institutionService.getInstitutionPublic(req.params.institutionCode);
    return ok(res, institution);
  } catch (err) {
    next(err);
  }
}


async function updateInstitutionBrandingHandler(req, res, next) {
  try {
    const institution = await institutionService.updateInstitutionBranding(
      req.context.institutionId,
      req.body
    );
    return ok(res, institution);
  } catch (err) {
    next(err);
  }
}

async function createFacultyHandler(req, res, next) {
  try {
    const faculty = await institutionService.createFaculty(req.context.institutionId, req.body);
    return created(res, faculty);
  } catch (err) {
    next(err);
  }
}

async function updateFacultyHandler(req, res, next) {
  try {
    const faculty = await institutionService.updateFaculty(req.context.institutionId, req.params.id, req.body);
    return ok(res, faculty);
  } catch (err) { next(err); }
}

async function createDepartmentHandler(req, res, next) {
  try {
    const department = await institutionService.createDepartment(req.context.institutionId, req.body);
    return created(res, department);
  } catch (err) {
    next(err);
  }
}

async function updateDepartmentHandler(req, res, next) {
  try {
    const department = await institutionService.updateDepartment(req.context.institutionId, req.params.id, req.body);
    return ok(res, department);
  } catch (err) { next(err); }
}

async function createAcademicSetHandler(req, res, next) {
  try {
    const set = await institutionService.createAcademicSet(req.context.institutionId, req.body);
    return created(res, set);
  } catch (err) {
    next(err);
  }
}

async function getDashboardHandler(req, res, next) {
  try {
    const dashboard = await institutionService.getInstitutionDashboard(req.context.institutionId);
    return ok(res, dashboard);
  } catch (err) {
    next(err);
  }
}

async function listFacultiesHandler(req, res, next) {
  try {
    const faculties = await institutionService.listFaculties(req.context.institutionId);
    return ok(res, faculties);
  } catch (err) {
    next(err);
  }
}

async function listDepartmentsHandler(req, res, next) {
  try {
    const departments = await institutionService.listDepartments(req.context.institutionId);
    return ok(res, departments);
  } catch (err) {
    next(err);
  }
}

async function listAcademicSetsHandler(req, res, next) {
  try {
    const sets = await institutionService.listAcademicSets(req.context.institutionId);
    return ok(res, sets);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createInstitutionHandler,
  listInstitutionsHandler,
  createInstitutionAdminHandler,
  getInstitutionHandler,
  createFacultyHandler,
  updateFacultyHandler,
  createDepartmentHandler,
  updateDepartmentHandler,
  createAcademicSetHandler,
  getDashboardHandler,
  listFacultiesHandler,
  listDepartmentsHandler,
  listAcademicSetsHandler,
  updateInstitutionBrandingHandler,
};
