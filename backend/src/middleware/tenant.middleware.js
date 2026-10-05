const { ApiError } = require('../utils/apiResponse');

/**
 * requireInstitutionScope — the enforcement point for §5.3/§25 of the
 * architecture doc ("Never trust institution ... information supplied by
 * the frontend" / "Institution A's administrative authority must never
 * cross into Institution B").
 *
 * Usage: place on any admin-scoped route where the target resource's
 * institutionId must match the acting admin's own institutionId.
 * `getTargetInstitutionId` receives (req) and must return the resource's
 * real institutionId as loaded from the database — never from req.body.
 */
function requireInstitutionScope(getTargetInstitutionId) {
  return async (req, res, next) => {
    try {
      const { role, institutionId } = req.context;

      // SUPER_ADMIN is a platform-level role and is the only role allowed
      // to cross institution boundaries (support/ops tooling only).
      if (role === 'SUPER_ADMIN') return next();

      const isInstitutionStaff = ['INSTITUTION_ADMIN', 'INSTITUTION_MODERATOR', 'YEARBOOK_ADMIN'].includes(
        role
      );
      if (!isInstitutionStaff) {
        throw new ApiError('Insufficient permissions', 403);
      }

      const targetInstitutionId = await getTargetInstitutionId(req);

      if (!targetInstitutionId || targetInstitutionId !== institutionId) {
        throw new ApiError('Cross-institution access denied', 403);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { requireInstitutionScope };
