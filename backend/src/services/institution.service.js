const prisma = require('../config/db');
const { generateCode } = require('../utils/publicCode');
const { ApiError } = require('../utils/apiResponse');
const { hashPassword } = require('../utils/password');

// Only SUPER_ADMIN creates institutions in V1 (onboarding a new school
// onto the platform is a platform-level action, not self-service).
async function createInstitution(data) {
  const existing = await prisma.institution.findUnique({
    where: { institutionCode: data.institutionCode },
  });
  if (existing) throw new ApiError('Institution code already in use', 409);

  return prisma.institution.create({
    data: {
      ...data,
      code: generateCode('INST'),
    },
  });
}

/**
 * listAllInstitutions — platform-wide view, SUPER_ADMIN only (see the
 * route's requireRole). Every OTHER institution query in this service
 * scopes to one institutionId derived from the caller's own context;
 * this is deliberately the one exception, since a super admin operates
 * above any single institution by definition.
 */
async function listAllInstitutions() {
  return prisma.institution.findMany({
    select: {
      id: true,
      institutionCode: true,
      name: true,
      shortName: true,
      status: true,
      createdAt: true,
      _count: { select: { students: true, staff: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}


async function createInstitutionAdmin(institutionId, data) {
  const institution = await prisma.institution.findUnique({
    where: { id: institutionId },
    select: { id: true, name: true, status: true },
  });
  if (!institution) throw new ApiError('Institution not found', 404);
  if (institution.status !== 'ACTIVE') throw new ApiError('Cannot create an admin for a suspended institution', 409);

  const email = String(data.email ?? '').trim().toLowerCase();
  const firstName = String(data.firstName ?? '').trim();
  const lastName = String(data.lastName ?? '').trim();
  if (!email || !firstName || !lastName) throw new ApiError('First name, last name and email are required', 400);

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new ApiError('An account with this email already exists', 409);

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        email,
        passwordHash,
        role: 'INSTITUTION_ADMIN',
        accountStatus: 'ACTIVE',
      },
    });

    await tx.institutionStaff.create({
      data: {
        userId: createdUser.id,
        institutionId,
        firstName,
        lastName,
      },
    });

    return createdUser;
  });

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    accountStatus: user.accountStatus,
    firstName,
    lastName,
    institutionId,
  };
}

async function getInstitutionPublic(institutionCode) {
  const institution = await prisma.institution.findUnique({
    where: { institutionCode },
    select: {
      id: true,
      code: true,
      institutionCode: true,
      name: true,
      shortName: true,
      logoUrl: true,
      coverImageUrl: true,
      colours: true,
      location: true,
      status: true,
    },
  });
  if (!institution) throw new ApiError('Institution not found', 404);
  return institution;
}


async function updateInstitutionBranding(institutionId, data) {
  return prisma.institution.update({
    where: { id: institutionId },
    data: {
      ...(data.logoUrl !== undefined ? { logoUrl: data.logoUrl } : {}),
      ...(data.coverImageUrl !== undefined ? { coverImageUrl: data.coverImageUrl } : {}),
      ...(data.colours !== undefined ? { colours: data.colours } : {}),
    },
    select: {
      id: true,
      institutionCode: true,
      name: true,
      shortName: true,
      logoUrl: true,
      coverImageUrl: true,
      colours: true,
      location: true,
      website: true,
    },
  });
}

async function createFaculty(institutionId, data) {
  const name = String(data.name ?? '').trim();
  if (!name) throw new ApiError('Faculty name is required', 400);
  return prisma.faculty.create({
    data: { name, code: generateCode('FAC'), institutionId },
  });
}

async function updateFaculty(institutionId, facultyId, data) {
  const faculty = await prisma.faculty.findFirst({ where: { id: facultyId, institutionId } });
  if (!faculty) throw new ApiError('Faculty not found in this institution', 404);
  const name = String(data.name ?? '').trim();
  if (!name) throw new ApiError('Faculty name is required', 400);
  return prisma.faculty.update({ where: { id: facultyId }, data: { name } });
}

async function createDepartment(institutionId, data) {
  const faculty = await prisma.faculty.findFirst({
    where: { id: data.facultyId, institutionId },
  });
  if (!faculty) throw new ApiError('Faculty not found in this institution', 404);

  const name = String(data.name ?? '').trim();
  if (!name) throw new ApiError('Department name is required', 400);
  return prisma.department.create({
    data: { name, code: generateCode('DEPT'), facultyId: data.facultyId, institutionId },
  });
}

async function updateDepartment(institutionId, departmentId, data) {
  const department = await prisma.department.findFirst({ where: { id: departmentId, institutionId } });
  if (!department) throw new ApiError('Department not found in this institution', 404);
  const name = String(data.name ?? '').trim();
  if (!name) throw new ApiError('Department name is required', 400);
  return prisma.department.update({ where: { id: departmentId }, data: { name }, include: { faculty: { select: { id: true, name: true } } } });
}

async function createAcademicSet(institutionId, data) {
  const startYear = Number(data.startYear);
  const name = String(data.name ?? `Class of ${startYear}`).trim();

  const existing = await prisma.academicSet.findFirst({
    where: { institutionId, startYear, departmentId: null },
    select: { id: true, name: true, startYear: true, status: true },
  });
  if (existing) throw new ApiError(`Class of ${startYear} already exists`, 409);

  return prisma.academicSet.create({
    data: {
      name,
      kind: 'CLASS',
      departmentId: null,
      startYear,
      institutionId,
      code: generateCode('SET'),
    },
  });
}

async function getInstitutionDashboard(institutionId) {
  const [studentCount, activeStudentCount, setCount, departmentCount, broadcastCount, yearBookCount] =
    await prisma.$transaction([
      prisma.student.count({ where: { institutionId } }),
      prisma.student.count({ where: { institutionId, verificationStatus: 'VERIFIED' } }),
      prisma.academicSet.count({ where: { institutionId } }),
      prisma.department.count({ where: { institutionId } }),
      prisma.broadcast.count({ where: { institutionId } }),
      prisma.yearBook.count({ where: { institutionId } }),
    ]);

  return {
    students: studentCount,
    activeStudents: activeStudentCount,
    sets: setCount,
    departments: departmentCount,
    broadcasts: broadcastCount,
    yearBooks: yearBookCount,
  };
}

async function listFaculties(institutionId) {
  return prisma.faculty.findMany({ where: { institutionId }, orderBy: { name: 'asc' } });
}

async function listDepartments(institutionId) {
  return prisma.department.findMany({
    where: { institutionId },
    include: { faculty: { select: { id: true, name: true } } },
    orderBy: { name: 'asc' },
  });
}

async function listAcademicSets(institutionId) {
  return prisma.academicSet.findMany({
    where: { institutionId },
    include: { department: { select: { id: true, name: true } } },
    orderBy: [{ startYear: 'desc' }, { createdAt: 'desc' }],
  });
}

module.exports = {
  createInstitution,
  listAllInstitutions,
  createInstitutionAdmin,
  getInstitutionPublic,
  createFaculty,
  updateFaculty,
  createDepartment,
  updateDepartment,
  createAcademicSet,
  getInstitutionDashboard,
  listFaculties,
  listDepartments,
  listAcademicSets,
  updateInstitutionBranding,
};
