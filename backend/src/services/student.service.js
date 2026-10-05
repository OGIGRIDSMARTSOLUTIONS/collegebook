const prisma = require('../config/db');
const { enrollStudentsInClassYearBooks } = require('./yearbookEnrollment.service');
const { ApiError } = require('../utils/apiResponse');
const emailService = require('./email.service');
const { canViewProfile } = require('./permission.service');

const PUBLIC_STUDENT_SELECT = {
  id: true,
  code: true,
  user: { select: { username: true } },
  firstName: true,
  lastName: true,
  otherNames: true,
  profilePhotoUrl: true,
  coverPhotoUrl: true,
  bio: true,
  location: true,
  verificationStatus: true,
  institution: { select: { id: true, name: true, shortName: true, logoUrl: true, institutionCode: true } },
  academicSet: { select: { id: true, name: true, code: true } },
  department: { select: { id: true, name: true } },
  faculty: { select: { id: true, name: true } },
};

/**
 * getStudentById — §7/§9 StudentPrivacy.whoCanViewProfile enforcement.
 * `viewerContext` is req.context (or null for a genuinely public request);
 * only the id/institutionId/setId fields are needed for the permission
 * check, so no extra Student lookup for the viewer is required — they're
 * already on req.context from the auth middleware.
 */
async function getStudentById(studentId, viewerContext) {
  // phoneNumber is deliberately included in the select ONLY when the
  // viewer IS the student being fetched — never for a general public
  // profile view. Unlike search (which has its own separate function
  // for exactly this reason), this one function serves both "my own
  // profile" and "someone else's profile," so the field-level
  // differentiation has to happen right here, not via a separate route.
  const isOwnProfile = viewerContext?.studentId === studentId;

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      ...PUBLIC_STUDENT_SELECT,
      institutionId: true,
      setId: true,
      ...(isOwnProfile ? { phoneNumber: true, dateOfBirth: true } : {}),
    },
  });
  if (!student) throw new ApiError('Student not found', 404);

  const viewer = viewerContext?.studentId
    ? { id: viewerContext.studentId, institutionId: viewerContext.institutionId, setId: viewerContext.setId }
    : null;

  const allowed = await canViewProfile(viewer, student);
  if (!allowed) throw new ApiError('This profile is private', 403);

  // Strip the scalar ids back out — they were only needed for the check above.
  const { institutionId, setId, ...publicView } = student;
  return publicView;
}

async function updateOwnProfile(studentId, data) {
  const normalized = { ...data };
  if (normalized.dateOfBirth !== undefined) normalized.dateOfBirth = normalized.dateOfBirth ? new Date(normalized.dateOfBirth) : null;
  const username = normalized.username === undefined ? undefined : normalized.username.toLowerCase();
  delete normalized.username;
  try {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.student.update({
        where: { id: studentId },
        data: normalized,
        select: { ...PUBLIC_STUDENT_SELECT, phoneNumber: true, dateOfBirth: true },
      });
      if (username !== undefined) {
        await tx.user.update({ where: { id: (await tx.student.findUnique({ where: { id: studentId }, select: { userId: true } })).userId }, data: { username } });
      }
      return username === undefined ? updated : { ...updated, user: { username } };
    });
  } catch (err) {
    if (err?.code === 'P2002') throw new ApiError('That @mention username is already taken', 409);
    throw err;
  }
}

/**
 * searchStudents — §14 of the architecture doc. Note this does NOT apply
 * profile-visibility privacy filtering per-result yet (that's Phase 2,
 * once StudentPrivacy.whoCanViewProfile is wired into a visibility
 * predicate) — it currently restricts results to the searcher's own
 * institution unless the target institution's cross-institution policy is
 * not OFF, which is enough to prevent isolated institutions leaking into
 * global search.
 */
async function searchStudents(searcherContext, { q, institutionCode, departmentId, setId, page, pageSize }) {
  const where = {
    AND: [
      q
        ? {
            OR: [
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
              { code: { contains: q, mode: 'insensitive' } },
            { studentNumber: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {},
      departmentId ? { departmentId } : {},
      setId ? { setId } : {},
      // CollegeBook is institution-local: students can discover and interact
      // with students in the same institution, including other departments,
      // but never with students from another institution.
      { institutionId: searcherContext.institutionId },
    ],
  };

  const [items, total] = await prisma.$transaction([
    prisma.student.findMany({
      where,
      select: PUBLIC_STUDENT_SELECT,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { firstName: 'asc' },
    }),
    prisma.student.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

/**
 * adminSearchStudents — deliberately NOT the same function students use
 * to search each other (searchStudents, above). That one is reachable by
 * any authenticated student with no role check, and its results use
 * PUBLIC_STUDENT_SELECT — adding email/phone there would leak every
 * student's contact details to anyone who searches for them in Network.
 * This one is reached only via a route gated to INSTITUTION_ADMIN (see
 * student.routes.js), and institutionId always comes from the admin's
 * own req.context — never a client-supplied param — so an admin can
 * never reach into another institution's contact details either.
 */
async function adminSearchStudents(institutionId, { q, setId, page, pageSize }) {
  const where = {
    institutionId,
    ...(setId ? { setId } : {}),
    ...(q
      ? {
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { code: { contains: q, mode: 'insensitive' } },
            { studentNumber: { contains: q, mode: 'insensitive' } },
            { phoneNumber: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.student.findMany({
      where,
      select: {
        ...PUBLIC_STUDENT_SELECT,
        studentNumber: true,
        phoneNumber: true,
        dateOfBirth: true,
        user: { select: { email: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { firstName: 'asc' },
    }),
    prisma.student.count({ where }),
  ]);

  // Flatten user.email onto the student object — simpler for the admin
  // UI than reaching through a nested relation for every row.
  const studentIds = items.map((student) => student.id);
  const yearBookEntries = studentIds.length
    ? await prisma.yearBookStudent.findMany({
        where: {
          institutionId,
          studentId: { in: studentIds },
          yearBook: { status: { not: 'ARCHIVED' } },
        },
        select: { studentId: true },
        distinct: ['studentId'],
      })
    : [];
  const attachedStudentIds = new Set(yearBookEntries.map((entry) => entry.studentId));

  return {
    items: items.map(({ user, ...rest }) => ({
      ...rest,
      email: user?.email ?? null,
      yearBookAttached: attachedStudentIds.has(rest.id),
    })),
    total,
    page,
    pageSize,
  };
}

function splitAdminName(name) {
  const parts = String(name ?? '').trim().replace(/\s+/g, ' ').split(' ').filter(Boolean);
  if (parts.length < 2) return { firstName: parts[0] || 'Student', lastName: 'User' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function normalizeMatriculation(value) {
  return String(value ?? '').trim().replace(/\s+/g, '').toUpperCase();
}

function normalizePhone(value) {
  return String(value ?? '').replace(/\D/g, '');
}

async function adminCreateStudent(institutionId, { name, matriculationNumber, departmentId, phoneNumber, setId }) {
  const department = await prisma.department.findFirst({
    where: { id: departmentId, institutionId },
    select: { id: true, facultyId: true, name: true },
  });
  if (!department) throw new ApiError('Department not found in this institution', 404);

  // Students never choose their class; the administrator does. The chosen
  // class is used, or the newest active institution-wide class by default.
  const academicSet = await getImportAcademicSet(institutionId, setId);
  if (!academicSet) {
    throw new ApiError(setId
      ? 'That class is not available. Choose an institution class that is not archived.'
      : 'Create the institution academic year first (for example, Class of 2026).', 400);
  }

  const studentNumber = normalizeMatriculation(matriculationNumber);
  const normalizedPhone = normalizePhone(phoneNumber);
  if (!/^\d{7,11}$/.test(normalizedPhone)) throw new ApiError('Phone number must contain 7 to 11 digits', 400);
  const existing = await prisma.student.findFirst({
    where: { institutionId, studentNumber },
    select: { id: true, userId: true },
  });
  if (existing) throw new ApiError('A student with this matriculation number already exists in this institution', 409);

  const { firstName, lastName } = splitAdminName(name);

  return prisma.$transaction(async (tx) => {
    const student = await tx.student.create({
      data: {
        code: require('../utils/publicCode').generateCode('STU'),
        userId: null,
        institutionId,
        setId: academicSet.id,
        departmentId,
        facultyId: department.facultyId,
        studentNumber,
        firstName,
        lastName,
        phoneNumber: normalizedPhone,
        verificationStatus: 'VERIFIED',
        privacy: { create: {} },
      },
      select: {
        ...PUBLIC_STUDENT_SELECT,
        studentNumber: true,
        phoneNumber: true,
        user: { select: { email: true } },
      },
    });

    await enrollStudentsInClassYearBooks(tx, { institutionId, setId: academicSet.id, studentIds: [student.id] });

    return student;
  });
}

/**
 * adminUpdateStudent — institution admin editing a student record.
 * Tenant scope is enforced by requireInstitutionScope in the route layer;
 * this function additionally re-verifies as defense in depth.
 */
async function adminUpdateStudent(institutionId, studentId, data) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: { select: { email: true } }, institution: { select: { name: true } } },
  });
  if (!student || student.institutionId !== institutionId) {
    throw new ApiError('Student not found in this institution', 404);
  }

  const previousStatus = student.verificationStatus;
  const previousSetId = student.setId;

  const normalized = { ...data };
  if (normalized.dateOfBirth !== undefined) normalized.dateOfBirth = normalized.dateOfBirth ? new Date(normalized.dateOfBirth) : null;

  const normalizedStudentNumber = normalized.studentNumber !== undefined ? normalizeMatriculation(normalized.studentNumber) : undefined;
  if (normalizedStudentNumber) normalized.studentNumber = normalizedStudentNumber;
  if (normalized.phoneNumber !== undefined) {
    normalized.phoneNumber = normalized.phoneNumber ? normalizePhone(normalized.phoneNumber) : null;
    if (normalized.phoneNumber && !/^\d{7,11}$/.test(normalized.phoneNumber)) throw new ApiError('Phone number must contain 7 to 11 digits', 400);
  }

  if (normalized.departmentId) {
    const department = await prisma.department.findFirst({
      where: { id: normalized.departmentId, institutionId },
      select: { id: true, facultyId: true },
    });
    if (!department) throw new ApiError('Department not found in this institution', 404);
    normalized.facultyId = department.facultyId;
  }

  if (normalized.setId) {
    const academicSet = await prisma.academicSet.findFirst({
      where: { id: normalized.setId, institutionId },
      select: { id: true, departmentId: true },
    });
    if (!academicSet) throw new ApiError('Academic set not found in this institution', 404);
    const targetDepartmentId = normalized.departmentId ?? student.departmentId;
    if (academicSet.departmentId && targetDepartmentId && academicSet.departmentId !== targetDepartmentId) {
      throw new ApiError('The selected academic set belongs to a different department', 400);
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const nextStudent = await tx.student.update({
      where: { id: studentId },
      data: normalized,
      select: PUBLIC_STUDENT_SELECT,
    });

    if (normalized.setId && normalized.setId !== previousSetId) {
      // Leave the old class's active YearBooks (archived editions keep
      // their history), then join every active YearBook of the new class.
      await tx.yearBookStudent.deleteMany({ where: { studentId, institutionId, yearBook: { status: { not: 'ARCHIVED' } } } });
      await enrollStudentsInClassYearBooks(tx, { institutionId, setId: normalized.setId, studentIds: [studentId] });
    }

    return nextStudent;
  });

  // Best-effort, deliberately isolated from the update itself — a failed
  // email (misconfigured Resend, a bounced address, whatever) must never
  // turn an already-successful status change into an error for the admin
  // who made it. Same pattern as post.controller.js's feed:new-post
  // notification.
  if (normalized.verificationStatus && normalized.verificationStatus !== previousStatus) {
    try {
      await emailService.sendVerificationStatusEmail({
        to: student.user.email,
        firstName: updated.firstName,
        status: normalized.verificationStatus,
        institutionName: student.institution.name,
      });
    } catch (err) {
      console.warn('Verification status email failed (status change was still applied):', err.message);
    }
  }

  return updated;
}


/* =========================================================
   CSV BULK IMPORT
   Handles the files real admins produce: Excel exports with
   trailing empty columns, semicolon or tab delimiters, phones
   with +234 or a stripped leading zero, and department names
   with stray spaces or capitalisation.
   ========================================================= */

const CSV_MAX_ROWS = 2000;
const CSV_CHUNK_SIZE = 200;

function detectDelimiter(text) {
  // Look at the header line only, ignoring anything inside quotes.
  let quoted = false;
  const counts = { ',': 0, ';': 0, '\t': 0 };
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '"') quoted = !quoted;
    else if (!quoted && ch === '\n') break;
    else if (!quoted && ch in counts) counts[ch] += 1;
  }
  const [best, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return n > 0 ? best : ',';
}

function parseCsvText(csvText) {
  const text = String(csvText ?? '').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  // Excel's "sep=;" hint line.
  let body = text;
  let delimiter = null;
  const sepHint = body.match(/^sep=(.)\n/i);
  if (sepHint) { delimiter = sepHint[1]; body = body.slice(sepHint[0].length); }
  delimiter = delimiter || detectDelimiter(body);

  const rows = [];
  let row = [], field = '', quoted = false;
  const pushRow = () => { row.push(field); field = ''; if (row.some((v) => String(v).trim() !== '')) rows.push(row); row = []; };
  for (let i = 0; i < body.length; i += 1) {
    const ch = body[i];
    if (quoted) {
      if (ch === '"' && body[i + 1] === '"') { field += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delimiter) { row.push(field); field = ''; }
    else if (ch === '\n') pushRow();
    else field += ch;
  }
  if (quoted) throw new ApiError('The CSV contains an unclosed quotation mark.', 400);
  if (field !== '' || row.length) pushRow();
  if (rows.length < 2) throw new ApiError('The CSV must contain a header row and at least one student row.', 400);
  return rows;
}

function normalizeHeader(value) {
  return String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

const CSV_HEADER_ALIASES = {
  firstname: 'firstName', first: 'firstName', givenname: 'firstName', forename: 'firstName',
  lastname: 'lastName', surname: 'lastName', familyname: 'lastName',
  othernames: 'otherNames', othername: 'otherNames', middlename: 'otherNames', middlenames: 'otherNames',
  matriculationnumber: 'matriculationNumber', matriculationno: 'matriculationNumber', matricnumber: 'matriculationNumber',
  matricno: 'matriculationNumber', matric: 'matriculationNumber', studentnumber: 'matriculationNumber', studentno: 'matriculationNumber',
  regno: 'matriculationNumber', registrationnumber: 'matriculationNumber', registrationno: 'matriculationNumber',
  phonenumber: 'phoneNumber', phone: 'phoneNumber', phoneno: 'phoneNumber', mobile: 'phoneNumber',
  mobilenumber: 'phoneNumber', telephone: 'phoneNumber', gsm: 'phoneNumber', gsmnumber: 'phoneNumber',
  department: 'department', departmentname: 'department', dept: 'department',
};
const CSV_REQUIRED = ['firstName', 'lastName', 'matriculationNumber', 'phoneNumber', 'department'];
const CSV_LABELS = {
  firstName: 'First Name', lastName: 'Last Name', matriculationNumber: 'Matriculation Number',
  phoneNumber: 'Phone Number', department: 'Department', otherNames: 'Other Names',
};

function csvRowsToObjects(rows) {
  // Blank header cells (Excel's trailing empty columns) and unknown
  // columns are ignored rather than rejecting the whole file.
  const canonical = rows[0].map((h) => CSV_HEADER_ALIASES[normalizeHeader(h)] || null);
  const missing = CSV_REQUIRED.filter((key) => !canonical.includes(key));
  if (missing.length) {
    throw new ApiError(`Missing required CSV column(s): ${missing.map((k) => CSV_LABELS[k]).join(', ')}. Use the template headers.`, 400);
  }
  const seen = new Set();
  const duplicates = canonical.filter((h) => { if (!h) return false; if (seen.has(h)) return true; seen.add(h); return false; });
  if (duplicates.length) {
    throw new ApiError(`The CSV has more than one column for: ${[...new Set(duplicates)].map((k) => CSV_LABELS[k]).join(', ')}`, 400);
  }
  return rows.slice(1).map((values, index) => {
    const obj = { _row: index + 2 };
    canonical.forEach((key, i) => { if (key) obj[key] = String(values[i] ?? '').trim(); });
    return obj;
  });
}

/** Phone as entered in a spreadsheet → digits in local 0-prefixed form where recognisable. */
function normalizeImportPhone(raw) {
  const value = String(raw ?? '').trim();
  if (/^\d+(\.\d+)?e\+?\d+$/i.test(value)) return { phone: '', excelMangled: true };
  let digits = value.replace(/\D/g, '');
  if (digits.length === 13 && digits.startsWith('234')) digits = `0${digits.slice(3)}`;
  else if (digits.length === 10 && /^[789]/.test(digits)) digits = `0${digits}`; // Excel dropped the leading 0
  return { phone: digits, excelMangled: false };
}

function departmentKey(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/^\s*(the\s+)?(department|dept\.?)\s+of\s+/, '')
    .replace(/[^a-z0-9]+/g, '');
}

/**
 * The class students are added to. An admin can pick any institution-wide
 * class (for example a late Class of 2025 student after Class of 2026 is
 * created). Without a choice, the newest active class is used. Archived
 * classes and department cohorts are never valid targets.
 */
async function getImportAcademicSet(institutionId, setId) {
  if (setId) {
    return prisma.academicSet.findFirst({
      where: { id: setId, institutionId, departmentId: null, status: { not: 'ARCHIVED' } },
      select: { id: true, name: true, startYear: true },
    });
  }
  return prisma.academicSet.findFirst({
    where: { institutionId, status: 'ACTIVE', departmentId: null },
    orderBy: [{ startYear: 'desc' }, { createdAt: 'desc' }],
    select: { id: true, name: true, startYear: true },
  });
}

async function analyzeStudentCsv(institutionId, csvText, { setId } = {}) {
  const rows = csvRowsToObjects(parseCsvText(csvText));
  if (rows.length > CSV_MAX_ROWS) throw new ApiError(`A single CSV upload can contain at most ${CSV_MAX_ROWS.toLocaleString()} students. Split the file and upload in parts.`, 400);

  const [departments, existing, academicSet] = await Promise.all([
    prisma.department.findMany({ where: { institutionId }, select: { id: true, name: true, code: true, facultyId: true } }),
    prisma.student.findMany({ where: { institutionId }, select: { studentNumber: true } }),
    getImportAcademicSet(institutionId, setId),
  ]);

  const deptMap = new Map();
  departments.forEach((d) => {
    deptMap.set(departmentKey(d.name), d);
    if (d.code) deptMap.set(departmentKey(d.code), d);
  });
  const existingNumbers = new Set(existing.map((s) => normalizeMatriculation(s.studentNumber)).filter(Boolean));
  const seenNumbers = new Set();

  const results = rows.map((row) => {
    const errors = [];
    const firstName = row.firstName;
    const lastName = row.lastName;
    const matriculationNumber = normalizeMatriculation(row.matriculationNumber);
    const { phone: phoneNumber, excelMangled } = normalizeImportPhone(row.phoneNumber);
    const department = deptMap.get(departmentKey(row.department));
    if (!firstName) errors.push('First name is required');
    if (!lastName) errors.push('Last name is required');
    if (!matriculationNumber) errors.push('Matriculation number is required');
    if (excelMangled) errors.push('Excel changed this phone number into a number like 8.03E+09. Format the Phone Number column as Text and re-type it');
    else if (!/^\d{7,11}$/.test(phoneNumber)) errors.push('Phone number must contain 7 to 11 digits');
    if (!department) errors.push(`Department not found: ${row.department || '(blank)'}`);
    if (matriculationNumber && existingNumbers.has(matriculationNumber)) errors.push('Matriculation number already exists');
    if (matriculationNumber && seenNumbers.has(matriculationNumber)) errors.push('Duplicate matriculation number in this CSV');
    if (matriculationNumber) seenNumbers.add(matriculationNumber);
    return {
      row: row._row,
      firstName, lastName, otherNames: row.otherNames || '',
      matriculationNumber, phoneNumber,
      department: department?.name || row.department || '', departmentId: department?.id || null,
      facultyId: department?.facultyId || null,
      valid: errors.length === 0, errors,
    };
  });

  const blockers = [];
  if (!departments.length) blockers.push('No departments exist yet. Add your faculties and departments under Academic Setup first.');
  if (!academicSet) {
    blockers.push(setId
      ? 'The chosen class is not available. Choose an institution class that is not archived.'
      : 'No institution-wide class exists yet. Department cohorts are not used for new students. Create the institution class (for example, Class of 2026) to continue.');
  }

  return {
    totalRows: results.length,
    validRows: results.filter((r) => r.valid).length,
    invalidRows: results.filter((r) => !r.valid).length,
    academicSet: academicSet ? { id: academicSet.id, name: academicSet.name } : null,
    blockers,
    departments: departments.map(({ id, name }) => ({ id, name })),
    rows: results,
  };
}

/** Student codes are unique platform-wide; pick ones not already taken. */
async function allocateStudentCodes(client, count) {
  const { generateCode } = require('../utils/publicCode');
  const codes = new Set();
  for (let attempt = 0; attempt < 10 && codes.size < count; attempt += 1) {
    const candidates = new Set();
    const wanted = (count - codes.size) * 2;
    for (let guard = 0; candidates.size < wanted && guard < wanted * 20; guard += 1) {
      const c = generateCode('STU');
      if (!codes.has(c)) candidates.add(c);
    }
    const taken = await client.student.findMany({ where: { code: { in: [...candidates] } }, select: { code: true } });
    const takenSet = new Set(taken.map((t) => t.code));
    for (const c of candidates) {
      if (codes.size >= count) break;
      if (!takenSet.has(c)) codes.add(c);
    }
  }
  if (codes.size < count) throw new ApiError('Could not allocate student codes. Please try again.', 500);
  return [...codes];
}

function isCodeCollision(err) {
  const target = err?.meta?.target;
  return err?.code === 'P2002' && (Array.isArray(target) ? target.includes('code') : String(target || '').includes('code'));
}

async function importStudentRow(institutionId, academicSet, row) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        const duplicate = await tx.student.findFirst({ where: { institutionId, studentNumber: row.matriculationNumber }, select: { id: true } });
        if (duplicate) return null;
        const [code] = await allocateStudentCodes(tx, 1);
        const created = await tx.student.create({ data: {
          code, userId: null, institutionId,
          setId: academicSet.id, departmentId: row.departmentId, facultyId: row.facultyId,
          studentNumber: row.matriculationNumber, firstName: row.firstName, lastName: row.lastName,
          otherNames: row.otherNames || null, phoneNumber: row.phoneNumber, verificationStatus: 'VERIFIED', privacy: { create: {} },
        }, select: { id: true } });
        await enrollStudentsInClassYearBooks(tx, { institutionId, setId: academicSet.id, studentIds: [created.id] });
        return created;
      });
    } catch (err) {
      if (isCodeCollision(err) && attempt < 4) continue;
      throw err;
    }
  }
  return null;
}

async function bulkCreateStudents(institutionId, csvText, { setId } = {}) {
  const analysis = await analyzeStudentCsv(institutionId, csvText, { setId });
  if (analysis.blockers.length) throw new ApiError(analysis.blockers.join(' '), 400);
  const validRows = analysis.rows.filter((r) => r.valid);
  if (!validRows.length) return { ...analysis, imported: 0, skipped: analysis.totalRows, importedRows: [] };

  const academicSet = await getImportAcademicSet(institutionId, setId);
  if (!academicSet) throw new ApiError('Create the institution academic year first (for example, Class of 2026).', 400);
  const yearBooks = await prisma.yearBook.findMany({
    where: { institutionId, setId: academicSet.id, status: { not: 'ARCHIVED' } },
    select: { year: true },
    orderBy: [{ year: 'desc' }],
  });

  const importedSet = new Set();
  const leftovers = [];

  // Fast path: a few hundred students per transaction instead of one
  // transaction per student, so large files finish well inside hosting
  // request timeouts.
  for (let i = 0; i < validRows.length; i += CSV_CHUNK_SIZE) {
    const chunk = validRows.slice(i, i + CSV_CHUNK_SIZE);
    try {
      const createdNumbers = await prisma.$transaction(async (tx) => {
        const codes = await allocateStudentCodes(tx, chunk.length);
        const created = await tx.student.createManyAndReturn({
          data: chunk.map((row, idx) => ({
            code: codes[idx], userId: null, institutionId,
            setId: academicSet.id, departmentId: row.departmentId, facultyId: row.facultyId,
            studentNumber: row.matriculationNumber, firstName: row.firstName, lastName: row.lastName,
            otherNames: row.otherNames || null, phoneNumber: row.phoneNumber, verificationStatus: 'VERIFIED',
          })),
          skipDuplicates: true,
          select: { id: true, studentNumber: true },
        });
        if (created.length) {
          await tx.studentPrivacy.createMany({ data: created.map((s) => ({ studentId: s.id })), skipDuplicates: true });
          await enrollStudentsInClassYearBooks(tx, { institutionId, setId: academicSet.id, studentIds: created.map((st) => st.id) });
        }
        return created.map((s) => s.studentNumber);
      }, { timeout: 60_000, maxWait: 10_000 });
      const createdSet = new Set(createdNumbers);
      chunk.forEach((row) => (createdSet.has(row.matriculationNumber) ? importedSet.add(row.row) : leftovers.push(row)));
    } catch (err) {
      // Anything unexpected in a chunk falls back to row-by-row below,
      // so one bad record never cancels the rest of the upload.
      leftovers.push(...chunk);
    }
  }

  for (const row of leftovers) {
    try {
      const student = await importStudentRow(institutionId, academicSet, row);
      if (student) importedSet.add(row.row);
      else { row.valid = false; row.errors = [...row.errors, 'Matriculation number already exists']; }
    } catch (err) {
      row.valid = false;
      row.errors = [...row.errors, err.code === 'P2002' ? 'Matriculation number already exists' : 'Could not import this row'];
    }
  }

  const imported = importedSet.size;
  return {
    ...analysis,
    validRows: analysis.rows.filter((r) => r.valid).length,
    invalidRows: analysis.rows.filter((r) => !r.valid).length,
    imported,
    skipped: analysis.totalRows - imported,
    importedRows: [...importedSet],
    yearBooks: yearBooks.map((y) => y.year),
  };
}

async function getStudentInstitutionId(studentId) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { institutionId: true },
  });
  return student?.institutionId ?? null;
}

module.exports = {
  getStudentById,
  updateOwnProfile,
  searchStudents,
  adminSearchStudents,
  adminCreateStudent,
  adminUpdateStudent,
  analyzeStudentCsv,
  bulkCreateStudents,
  getStudentInstitutionId,
};
