const prisma = require('../config/db');
const { ApiError } = require('../utils/apiResponse');
const { canViewYearBook, canEditYearBook, isInstitutionStaff } = require('./permission.service');
const auditService = require('./audit.service');
const {
  syncYearBookRoster,
  reconcileYearBookRoster,
  getCurrentClass,
  labelYear,
  findClassForYear,
} = require('./yearbookEnrollment.service');

const STUDENT_ENTRY_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  profilePhotoUrl: true,
  academicSet: { select: { name: true } },
};

function assertStaffRole(role) {
  if (role !== 'SUPER_ADMIN' && !isInstitutionStaff(role)) {
    throw new ApiError('Insufficient permissions', 403);
  }
}

/** Picks the one class a YearBook is filled from (see the rule inside). */
async function resolveClassForYearBook(institutionId, setId, label) {
  // The label's year decides the class: "year 2025" can only be Class of
  // 2025, so one year's students never appear in another year's YearBook.
  // Only a label with no year in it falls back to the current class.
  const year = labelYear(label);
  if (setId) {
    const set = await prisma.academicSet.findFirst({
      where: { id: setId, institutionId },
      select: { id: true, name: true, startYear: true, departmentId: true },
    });
    if (!set) throw new ApiError('Academic set not found in this institution', 404);
    if (year !== null && Number(set.startYear) !== year) {
      throw new ApiError(`A "${label}" YearBook can only be filled from Class of ${year}, not ${set.name}.`, 400);
    }
    return set;
  }
  if (year !== null) {
    const set = await findClassForYear(prisma, institutionId, year);
    if (!set) {
      throw new ApiError(`Create Class of ${year} under Academic Setup first, then create the "${label}" YearBook.`, 400);
    }
    return set;
  }
  const current = await getCurrentClass(institutionId);
  if (!current) {
    throw new ApiError('Create the institution class (for example, Class of 2026) under Academic Setup before creating a YearBook.', 400);
  }
  return current;
}

/**
 * createYearBook — institutionId is ALWAYS the acting admin's own
 * (actorContext.institutionId), never accepted from the request body.
 * The YearBook is linked to an academic class and every student already
 * in that class is listed in it straight away.
 */
async function createYearBook(actorContext, { year, setId, coverImageUrl, welcomeMessage }) {
  assertStaffRole(actorContext.role);
  const institutionId = actorContext.institutionId;
  const academicSet = await resolveClassForYearBook(institutionId, setId, year);

  const duplicate = await prisma.yearBook.findFirst({
    where: { institutionId, year, setId: academicSet.id },
    select: { id: true },
  });
  if (duplicate) throw new ApiError(`A YearBook "${year}" already exists for ${academicSet.name}. Use a label like "${year}a" for another edition.`, 409);

  return prisma.$transaction(async (tx) => {
    const yearBook = await tx.yearBook.create({
      data: { institutionId, setId: academicSet.id, year, coverImageUrl, welcomeMessage, status: 'DRAFT' },
    });
    const enrolled = await syncYearBookRoster(tx, yearBook);
    return { ...yearBook, academicSet, enrolled };
  }, { timeout: 60_000, maxWait: 10_000 });
}

/**
 * syncYearBookStudents — adds every student of the YearBook's class who
 * isn't listed yet. A YearBook created before classes were linked can be
 * linked here (setId, or the current class by default) in the same step.
 */
async function syncYearBookStudents(actorContext, yearBookId, { setId } = {}) {
  const yearBook = await prisma.yearBook.findUnique({
    where: { id: yearBookId },
    include: { academicSet: { select: { id: true, startYear: true } } },
  });
  if (!yearBook || !canEditYearBook(actorContext, yearBook)) throw new ApiError('YearBook not found', 404);
  if (yearBook.status === 'ARCHIVED') throw new ApiError('Archived YearBooks are kept as they are and cannot be synced.', 400);

  // Relink when never linked, when another class is requested, or when the
  // current link is to the wrong year (left over from an earlier version).
  const year = labelYear(yearBook.year);
  const wrongYear = Boolean(yearBook.academicSet && year !== null && Number(yearBook.academicSet.startYear) !== year);
  let target = yearBook;
  if (!yearBook.setId || wrongYear || (setId && setId !== yearBook.setId)) {
    const academicSet = await resolveClassForYearBook(yearBook.institutionId, setId, yearBook.year);
    const clash = await prisma.yearBook.findFirst({
      where: { institutionId: yearBook.institutionId, year: yearBook.year, setId: academicSet.id, id: { not: yearBook.id } },
      select: { id: true },
    });
    if (clash) throw new ApiError(`Another YearBook "${yearBook.year}" is already linked to ${academicSet.name}.`, 409);
    target = await prisma.yearBook.update({ where: { id: yearBook.id }, data: { setId: academicSet.id } });
  }

  const { added, removed } = await prisma.$transaction((tx) => reconcileYearBookRoster(tx, target), { timeout: 60_000, maxWait: 10_000 });
  const total = await prisma.yearBookStudent.count({ where: { yearBookId: target.id } });
  return { yearBookId: target.id, setId: target.setId, added, removed, total };
}

/**
 * getYearBookOrThrow — the central enforcement point for §5.4/§53.
 * Staff of the owning institution can see a YearBook in any status
 * (DRAFT included, since they're the ones building it). Everyone else —
 * students, alumni — can ONLY see it if canViewYearBook() passes (their
 * own institutionId matches, full stop, connections are irrelevant) AND
 * it's PUBLISHED. A cross-institution connection changes nothing here.
 */
async function getYearBookOrThrow(yearBookId, viewerContext) {
  const yearBook = await prisma.yearBook.findUnique({
    where: { id: yearBookId },
    include: {
      sections: { orderBy: { order: 'asc' } },
      photos: true,
      academicSet: { select: { id: true, name: true, code: true } },
    },
  });
  if (!yearBook) throw new ApiError('YearBook not found', 404);

  const isStaff = viewerContext.role === 'SUPER_ADMIN' || isInstitutionStaff(viewerContext.role);
  if (isStaff) {
    if (!canEditYearBook(viewerContext, yearBook)) {
      throw new ApiError('YearBook not found', 404); // don't leak existence across institutions
    }
    return yearBook;
  }

  const viewerAsStudent = { institutionId: viewerContext.institutionId };
  const sameInstitution = canViewYearBook(viewerAsStudent, yearBook);
  if (!sameInstitution || yearBook.status !== 'PUBLISHED') {
    throw new ApiError('YearBook not found', 404);
  }
  return yearBook;
}

/**
 * listPublishedForMyInstitution — §53 made concrete: filtered by the
 * VIEWER'S OWN institutionId only. Nothing about connections, cross-
 * institution policy, or anything else in the permission engine ever
 * enters this query.
 */
async function listPublishedForMyInstitution(viewerContext) {
  return prisma.yearBook.findMany({
    where: { institutionId: viewerContext.institutionId, status: 'PUBLISHED' },
    orderBy: { year: 'desc' },
  });
}

async function listForAdmin(actorContext) {
  assertStaffRole(actorContext.role);
  return prisma.yearBook.findMany({
    where: { institutionId: actorContext.institutionId },
    orderBy: { createdAt: 'desc' },
    include: {
      academicSet: { select: { id: true, name: true } },
      _count: { select: { students: true } },
    },
  });
}

async function setStatus(actorContext, yearBookId, status) {
  const yearBook = await prisma.yearBook.findUnique({ where: { id: yearBookId } });
  if (!yearBook) throw new ApiError('YearBook not found', 404);
  if (!canEditYearBook(actorContext, yearBook)) throw new ApiError('YearBook not found', 404);

  const updated = await prisma.yearBook.update({ where: { id: yearBookId }, data: { status } });

  // Publishing is a natural checkpoint: make sure nobody in the class is
  // missing from the edition everyone is about to see.
  if (status === 'PUBLISHED') {
    await prisma.$transaction((tx) => reconcileYearBookRoster(tx, updated), { timeout: 60_000, maxWait: 10_000 });
  }

  await auditService.record({
    institutionId: actorContext.institutionId,
    actorUserId: actorContext.userId,
    action: status === 'PUBLISHED' ? 'PUBLISH_YEARBOOK' : 'ARCHIVE_YEARBOOK',
    targetType: 'YearBook',
    targetId: yearBookId,
  });

  return updated;
}

async function addSection(actorContext, yearBookId, { kind, title, order }) {
  const yearBook = await prisma.yearBook.findUnique({ where: { id: yearBookId } });
  if (!yearBook || !canEditYearBook(actorContext, yearBook)) {
    throw new ApiError('YearBook not found', 404);
  }
  return prisma.yearBookSection.create({ data: { yearBookId, kind, title, order } });
}

/**
 * addStudentEntry — the check that matters most in this file. Passing
 * canEditYearBook (admin editing their OWN institution's YearBook) is
 * necessary but not sufficient: we independently re-verify the TARGET
 * student actually belongs to that same institution, per §29 ("YearBook
 * queries must always contain institutionId"). Without this second check,
 * an admin (by mistake or otherwise) could add a student ID from a
 * different institution into their own YearBook.
 */
async function addStudentEntry(actorContext, yearBookId, { studentId, photoUrl, quote }) {
  const yearBook = await prisma.yearBook.findUnique({ where: { id: yearBookId } });
  if (!yearBook || !canEditYearBook(actorContext, yearBook)) {
    throw new ApiError('YearBook not found', 404);
  }

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student || student.institutionId !== yearBook.institutionId) {
    throw new ApiError('This student does not belong to this institution', 400);
  }
  // Each YearBook holds only its own class, so one year's students never
  // show up in another year's book.
  if (yearBook.setId && student.setId !== yearBook.setId) {
    throw new ApiError("This student isn't in this YearBook's class, so they can't be added to it.", 400);
  }

  return prisma.yearBookStudent.create({
    data: {
      yearBookId,
      institutionId: yearBook.institutionId,
      studentId,
      photoUrl,
      quote,
    },
  });
}

async function addPhoto(actorContext, yearBookId, { sectionId, url, caption }) {
  const yearBook = await prisma.yearBook.findUnique({ where: { id: yearBookId } });
  if (!yearBook || !canEditYearBook(actorContext, yearBook)) {
    throw new ApiError('YearBook not found', 404);
  }

  if (sectionId) {
    const section = await prisma.yearBookSection.findUnique({ where: { id: sectionId } });
    if (!section || section.yearBookId !== yearBookId) {
      throw new ApiError('Section not found in this YearBook', 404);
    }
  }

  return prisma.yearBookPhoto.create({
    data: { yearBookId, sectionId, url, caption, uploadedByUserId: actorContext.userId },
  });
}

async function addContent(actorContext, sectionId, { body }) {
  const section = await prisma.yearBookSection.findUnique({ where: { id: sectionId } });
  if (!section) throw new ApiError('Section not found', 404);

  const yearBook = await prisma.yearBook.findUnique({ where: { id: section.yearBookId } });
  if (!yearBook || !canEditYearBook(actorContext, yearBook)) {
    throw new ApiError('YearBook not found', 404);
  }

  return prisma.yearBookContent.create({
    data: { yearBookId: section.yearBookId, sectionId, body },
  });
}

async function listYearBookStudents(yearBookId, viewerContext) {
  await getYearBookOrThrow(yearBookId, viewerContext); // enforces visibility first

  return prisma.yearBookStudent.findMany({
    where: { yearBookId },
    include: { student: { select: STUDENT_ENTRY_SELECT } },
  });
}

module.exports = {
  createYearBook,
  syncYearBookStudents,
  getYearBookOrThrow,
  listPublishedForMyInstitution,
  listForAdmin,
  setStatus,
  addSection,
  addStudentEntry,
  addPhoto,
  addContent,
  listYearBookStudents,
};
