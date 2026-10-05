const uploadService = require('../services/upload.service');
const { ApiError } = require('../utils/apiResponse');
const { ok } = require('../utils/apiResponse');

async function uploadHandler(req, res, next) {
  try {
    if (!req.file) {
      throw new ApiError('No file uploaded', 400);
    }
    const result = await uploadService.processAndUploadImage(req.context, {
      purpose: req.body.purpose,
      buffer: req.file.buffer,
    });
    return ok(res, result);
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadHandler };
