const prisma = require('../config/db');
const { enrollStudentsInClassYearBooks } = require('./yearbookEnrollment.service');
const { OAuth2Client } = require('google-auth-library');
const { hashPassword, comparePassword } = require('../utils/password');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { ApiError } = require('../utils/apiResponse');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * register — creates a User + Student together. The client supplies
 * institutionCode / setCode (human-readable, e.g. "UNILAG" / a set's public
 * code), which are resolved to real internal IDs here. This is what
 * §5.3 means by never trusting client-supplied institutionId directly:
 * the client never gets to say "put me in institution X" by ID — only by
 * a public code that's looked up and validated server-side.
 */
function normalizeIdentity(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function normalizeMatriculation(value) {
  return String(value ?? '').trim().replace(/\s+/g, '').toUpperCase();
}

function normalizePhone(value) {
  return String(value ?? '').replace(/[^0-9+]/g, '');
}

function normalizeDepartment(value) {
  return normalizeIdentity(value);
}

function splitName(name) {
  const parts = String(name ?? '').trim().replace(/\s+/g, ' ').split(' ').filter(Boolean);
  if (!parts.length) return { firstName: 'Student', lastName: 'User' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

/**
 * register — the student registry is now the institutional source of truth.
 * Matriculation is mandatory. At least one of department or phone must also
 * be supplied. No institution/set/department codes are exposed to students.
 *
 * Matching rule:
 *   - matriculation MUST match
 *   - department OR phone MUST match
 *   - when both are supplied, any 2 of the 3 fields may match
 *   - an ambiguous match is never auto-assigned
 */
function matriculationVariantsOf(matriculationNumber) {
  const input = String(matriculationNumber ?? '').trim();
  return [...new Set([normalizeMatriculation(input), input, input.toUpperCase(), input.replace(/\s+/g, '')].filter(Boolean))];
}

/**
 * registrationDepartments — the registration dropdown. Given only a
 * matriculation number, returns the departments of the school(s) that
 * hold an UNCLAIMED record with that number. No institution name, code or
 * count is ever returned, so a student never learns which other schools
 * use CollegeBook. Read live, so newly added departments appear at once.
 */
async function registrationDepartments({ matriculationNumber }) {
  const records = await prisma.student.findMany({
    where: {
      studentNumber: { in: matriculationVariantsOf(matriculationNumber) },
      userId: null,
      institution: { status: 'ACTIVE' },
    },
    select: { institutionId: true },
  });
  const institutionIds = [...new Set(records.map((r) => r.institutionId))];
  if (!institutionIds.length) {
    throw new ApiError('We could not find an unregistered student record for that matriculation number. Check it, or contact your school.', 404);
  }

  const departments = await prisma.department.findMany({
    where: { institutionId: { in: institutionIds } },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, faculty: { select: { name: true } } },
  });
  return departments.map((d) => ({ id: d.id, name: d.name, facultyName: d.faculty?.name ?? null }));
}

async function register({ email, password, matriculationNumber, departmentId, department, phoneNumber }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError('An account with this email already exists', 409);

  const matriculationInput = String(matriculationNumber ?? '').trim();
  const matric = normalizeMatriculation(matriculationInput);
  const suppliedDepartment = department ? normalizeDepartment(department) : null;
  const suppliedPhone = phoneNumber ? normalizePhone(phoneNumber) : null;

  if (!matric) throw new ApiError('Matriculation number is required', 400);
  if (!departmentId && !suppliedDepartment && !suppliedPhone) {
    throw new ApiError('Provide either your department or phone number for verification', 400);
  }

  const matriculationVariants = matriculationVariantsOf(matriculationInput);

  const candidates = await prisma.student.findMany({
    where: { studentNumber: { in: matriculationVariants } },
    include: {
      department: { select: { id: true, name: true, code: true, facultyId: true } },
      academicSet: { select: { id: true, name: true, institutionId: true } },
      institution: { select: { id: true, name: true, status: true } },
    },
  });

  if (!candidates.length) {
    throw new ApiError('We could not find an institutional student record for that matriculation number', 404);
  }

  const scored = candidates.map((student) => {
    // Picked from the dropdown: compare ids exactly. Typed text (older app
    // versions) still falls back to the name/code comparison.
    const departmentMatch = departmentId
      ? student.departmentId === departmentId
      : Boolean(
        suppliedDepartment && student.department &&
        [student.department.name, student.department.code]
          .map(normalizeDepartment)
          .includes(suppliedDepartment)
      );
    const phoneMatch = Boolean(suppliedPhone && student.phoneNumber && normalizePhone(student.phoneNumber) === suppliedPhone);
    const score = 1 + (departmentMatch ? 1 : 0) + (phoneMatch ? 1 : 0);
    return { student, departmentMatch, phoneMatch, score };
  });

  const matches = scored.filter((item) => item.score >= 2 && item.student.institution.status === 'ACTIVE');
  if (!matches.length) {
    throw new ApiError('Your matriculation number was found, but the department/phone information did not verify the student record', 409);
  }
  if (matches.length > 1) {
    throw new ApiError('More than one student record matched. Please contact your institution administrator for verification', 409);
  }

  const match = matches[0].student;
  if (match.userId) {
    throw new ApiError('This institutional student record already has a CollegeBook account', 409);
  }

  const passwordHash = await hashPassword(password);
  const { firstName, lastName } = splitName([match.firstName, match.lastName, match.otherNames].filter(Boolean).join(' '));

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        email,
        passwordHash,
        role: 'STUDENT',
        accountStatus: 'ACTIVE',
      },
    });

    await tx.student.update({
      where: { id: match.id },
      data: {
        userId: createdUser.id,
        verificationStatus: 'VERIFIED',
      },
    });

    // Automatically place the newly claimed student into every active
    // YearBook of their academic class (no-op if they are already listed).
    await enrollStudentsInClassYearBooks(tx, { institutionId: match.institutionId, setId: match.setId, studentIds: [match.id] });

    return createdUser;
  });

  return { ...user, firstName, lastName, institutionId: match.institutionId, studentId: match.id };
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError('Invalid email or password', 401);

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) throw new ApiError('Invalid email or password', 401);

  if (user.accountStatus === 'SUSPENDED') throw new ApiError('Account suspended', 403);
  if (user.accountStatus === 'BANNED') throw new ApiError('Account banned', 403);

  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return { user, accessToken, refreshToken };
}

/**
 * loginWithGoogle — deliberately scoped to LOGIN, not sign-up. A Google ID
 * token proves ownership of an email address; it says nothing about which
 * institution or academic set someone belongs to, and per §5.3 that
 * information can only ever come from institutionCode/setCode resolved
 * server-side (see register() above) — Google can't supply it, so we
 * don't try to auto-create an account here. If no CollegeBook account
 * exists for the verified email, this fails with a clear message rather
 * than silently fabricating a Student record with no institution.
 *
 * Verification (not just decoding) matters: verifyIdToken checks the
 * token's signature against Google's public keys and its `aud` claim
 * against our own GOOGLE_CLIENT_ID, so a client can't forge an arbitrary
 * email by just sending a JSON blob shaped like a Google token.
 */
async function loginWithGoogle(idToken) {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new ApiError('Google sign-in is not configured on this server', 501);
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    throw new ApiError('Invalid Google sign-in token', 401);
  }

  if (!payload?.email_verified) {
    throw new ApiError('Google account email is not verified', 401);
  }

  const user = await prisma.user.findUnique({ where: { email: payload.email } });
  if (!user) {
    throw new ApiError('No CollegeBook account found for this Google email. Register first.', 404);
  }

  if (user.accountStatus === 'SUSPENDED') throw new ApiError('Account suspended', 403);
  if (user.accountStatus === 'BANNED') throw new ApiError('Account banned', 403);

  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return { user, accessToken, refreshToken };
}

async function refresh(refreshToken) {
  if (!refreshToken) throw new ApiError('Not authenticated', 401);

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError('Invalid or expired session', 401);
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw new ApiError('Not authenticated', 401);

  const accessToken = signAccessToken(user.id);
  return { accessToken, user };
}

module.exports = { register, registrationDepartments, login, loginWithGoogle, refresh };
