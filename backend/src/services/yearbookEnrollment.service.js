const prisma = require('../config/db');

/**
 * YearBook enrolment — the single place that decides which YearBook(s) a
 * student appears in, so every path (CSV import, single add, class change,
 * registration, YearBook creation, publish) behaves the same way.
 *
 * Rule: a student is listed in every non-archived YearBook edition linked
 * to their academic class. Enrolment is idempotent (skipDuplicates on the
 * yearBookId + studentId unique key), so running it twice is harmless.
 *
 * Every function accepts a Prisma client or transaction client, so callers
 * can enrol inside the same transaction that creates the student.
 */

const BATCH = 1000;

async function createEntries(client, yearBookIds, institutionId, studentIds) {
  let added = 0;
  for (const yearBookId of yearBookIds) {
    for (let i = 0; i < studentIds.length; i += BATCH) {
      const result = await client.yearBookStudent.createMany({
        data: studentIds.slice(i, i + BATCH).map((studentId) => ({ yearBookId, institutionId, studentId })),
        skipDuplicates: true,
      });
      added += result?.count ?? 0;
    }
  }
  return added;
}

/**
 * The calendar year in a YearBook label: "year 2026" → 2026, "year 2026a"
 * → 2026. null when the label has no year in it.
 */
function labelYear(label) {
  const match = String(label ?? '').match(/(19|20)\d{2}/);
  return match ? Number(match[0]) : null;
}

/**
 * A YearBook may only hold the class of its own year: "year 2025" ↔
 * Class of 2025. Labels without a year can't be checked, so they pass.
 */
function yearBookMatchesClass(yearBook, academicSet) {
  const year = labelYear(yearBook?.year);
  return year === null || !academicSet || Number(academicSet.startYear) === year;
}

/** The institution-wide class for a calendar year (Class of YYYY). */
async function findClassForYear(client, institutionId, year) {
  return client.academicSet.findFirst({
    where: { institutionId, startYear: year, departmentId: null },
    orderBy: [{ createdAt: 'desc' }],
    select: { id: true, name: true, startYear: true },
  });
}

/** Put the given students of one class into all of that class's active YearBooks. */
async function enrollStudentsInClassYearBooks(client, { institutionId, setId, studentIds }) {
  if (!setId || !studentIds?.length) return 0;
  const yearBooks = await client.yearBook.findMany({
    where: { institutionId, setId, status: { not: 'ARCHIVED' } },
    select: { id: true, year: true, academicSet: { select: { startYear: true } } },
  });
  // Belt and braces: never enrol into a YearBook whose year doesn't match
  // the class, even if it was linked wrongly in the past.
  const eligible = yearBooks.filter((yb) => yearBookMatchesClass(yb, yb.academicSet));
  if (!eligible.length) return 0;
  return createEntries(client, eligible.map((y) => y.id), institutionId, studentIds);
}

/** Add every student of the YearBook's class who isn't listed yet. */
async function syncYearBookRoster(client, yearBook) {
  if (!yearBook?.setId || yearBook.status === 'ARCHIVED') return 0;
  const students = await client.student.findMany({
    where: { institutionId: yearBook.institutionId, setId: yearBook.setId },
    select: { id: true },
  });
  return createEntries(client, [yearBook.id], yearBook.institutionId, students.map((s) => s.id));
}

/**
 * Bring one YearBook's roster in line with its class: add every student of
 * the class who is missing, and remove anyone who isn't in the class (for
 * example entries left over from an earlier wrong link). Returns counts.
 */
async function reconcileYearBookRoster(client, yearBook) {
  if (!yearBook?.setId || yearBook.status === 'ARCHIVED') return { added: 0, removed: 0 };
  const removed = await client.yearBookStudent.deleteMany({
    where: { yearBookId: yearBook.id, student: { setId: { not: yearBook.setId } } },
  });
  const added = await syncYearBookRoster(client, yearBook);
  return { added, removed: removed?.count ?? 0 };
}

/** The class new students join: newest ACTIVE institution-wide set. */
async function getCurrentClass(institutionId, client = prisma) {
  return client.academicSet.findFirst({
    where: { institutionId, status: 'ACTIVE', departmentId: null },
    orderBy: [{ startYear: 'desc' }, { createdAt: 'desc' }],
    select: { id: true, name: true },
  });
}

module.exports = {
  enrollStudentsInClassYearBooks,
  syncYearBookRoster,
  reconcileYearBookRoster,
  getCurrentClass,
  labelYear,
  yearBookMatchesClass,
  findClassForYear,
};
