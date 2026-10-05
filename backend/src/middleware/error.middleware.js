const { ApiError } = require('../utils/apiResponse');

function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: 'Route not found' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
      details: err.details,
    });
  }

  // Prisma known-error codes worth surfacing cleanly
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: `A record with this ${err.meta?.target?.join(', ') || 'value'} already exists`,
    });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Record not found' });
  }

  // eslint-disable-next-line no-console
  console.error(err);
  return res.status(500).json({ success: false, message: 'Internal server error' });
}

module.exports = { notFoundHandler, errorHandler };
