const prisma = require('../config/db');
const { verifyAccessToken } = require('../utils/jwt');
const { ApiError } = require('../utils/apiResponse');

/**
 * authenticate — verifies the access token cookie and loads the full
 * server-side context for the request. Per the architecture doc §5.3/§15:
 * institutionId, setId, departmentId, role etc. are NEVER trusted from the
 * client — they are always re-derived here from the database.
 */
async function authenticate(req, res, next) {
  try {
    const token = req.cookies?.accessToken;
    if (!token) throw new ApiError('Not authenticated', 401);

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw new ApiError('Invalid or expired session', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        student: {
          include: { privacy: true },
        },
        institutionStaff: true,
      },
    });

    if (!user) throw new ApiError('Not authenticated', 401);
    if (user.accountStatus === 'SUSPENDED') throw new ApiError('Account suspended', 403);
    if (user.accountStatus === 'BANNED') throw new ApiError('Account banned', 403);

    // req.context is the single source of truth for the rest of the
    // request pipeline — controllers/services must read from here, never
    // from req.body for anything identity- or permission-related.
    req.context = {
      userId: user.id,
      role: user.role,
      accountStatus: user.accountStatus,
      studentId: user.student?.id ?? null,
      staffId: user.institutionStaff?.id ?? null,
      institutionId: user.student?.institutionId ?? user.institutionStaff?.institutionId ?? null,
      setId: user.student?.setId ?? null,
      departmentId: user.student?.departmentId ?? null,
      facultyId: user.student?.facultyId ?? null,
      privacy: user.student?.privacy ?? null,
    };

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * requireRole — restricts a route to one or more roles.
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.context || !roles.includes(req.context.role)) {
      return next(new ApiError('Insufficient permissions', 403));
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
