const { ApiError } = require('../utils/apiResponse');

/**
 * validate(schema) — validates req.body against a zod schema and replaces
 * req.body with the parsed (and thus type-coerced/stripped) result.
 */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(new ApiError('Validation failed', 422, result.error.flatten()));
    }
    req.body = result.data;
    next();
  };
}

/**
 * validateQuery(schema) — same idea as validate(), but for req.query
 * (used by search/list endpoints where filters arrive as query params).
 */
function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(new ApiError('Validation failed', 422, result.error.flatten()));
    }
    req.query = result.data;
    next();
  };
}

module.exports = { validate, validateQuery };
