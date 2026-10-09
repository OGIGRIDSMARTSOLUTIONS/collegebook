const crypto = require('crypto');
const sharp = require('sharp');
const { supabase, isSupabaseConfigured, bucket } = require('../config/supabase');
const { ApiError } = require('../utils/apiResponse');

// Longest-side cap per purpose, in pixels — the actual space-saving lever
// here. A typical phone photo (3000-4000px, several MB) shrinks to well
// under 500KB at these sizes with no visible quality loss for how these
// images are actually displayed (avatars, cover strips, feed images).
const MAX_DIMENSION = {
  profile: 800,
  cover: 1600,
  post: 1600,
  yearbook: 1600,
  'institution-logo': 1000,
};

/**
 * resolvePath — same tenant-safety principle as the old Cloudinary
 * resolveFolder: the DESTINATION is decided here, server-side, from the
 * authenticated actor's own context — never from anything the client
 * could set. A student can never write into another student's, or
 * another institution's, path, regardless of what purpose/filename they
 * send.
 */
function resolvePath(actorContext, purpose) {
  const unique = `${Date.now()}-${crypto.randomUUID()}`;
  switch (purpose) {
    case 'profile':
    case 'cover':
      return `students/${actorContext.studentId}/${purpose}-${unique}.webp`;
    case 'post':
      return `posts/${actorContext.studentId}/${unique}.webp`;
    case 'institution-logo':
      return `institutions/${actorContext.institutionId}/logo-${unique}.webp`;
    case 'yearbook':
      // Only institution staff reach this purpose — enforced by the
      // route's requireRole, not re-checked here — but the path is still
      // always the ACTOR'S OWN institution, never client-supplied.
      return `yearbooks/${actorContext.institutionId}/${unique}.webp`;
    default:
      throw new ApiError('Unknown upload purpose', 400);
  }
}

async function processAndUploadImage(actorContext, { purpose, buffer }) {
  if (!isSupabaseConfigured()) {
    throw new ApiError('File uploads are not configured on this server', 503);
  }

  const maxDimension = MAX_DIMENSION[purpose];
  if (!maxDimension) {
    throw new ApiError('Unknown upload purpose', 400);
  }

  let processed;
  try {
    processed = await sharp(buffer)
      .resize(maxDimension, maxDimension, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new ApiError('That file could not be read as an image', 422);
  }

  const path = resolvePath(actorContext, purpose);

  const { error: uploadError } = await supabase.storage.from(bucket()).upload(path, processed, {
    contentType: 'image/webp',
    upsert: false,
  });
  if (uploadError) {
    throw new ApiError(`Upload failed: ${uploadError.message}`, 502);
  }

  const { data } = supabase.storage.from(bucket()).getPublicUrl(path);
  return { url: data.publicUrl };
}

module.exports = { processAndUploadImage };
