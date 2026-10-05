import { useState } from 'react';
import { uploadService } from '../services/upload.service';

/**
 * useImageUpload — the file goes to OUR OWN backend (via the same `api`
 * axios instance everything else uses, cookies included), which resizes
 * and compresses it with sharp before storing it in Supabase Storage —
 * see backend/src/services/upload.service.js. This is a deliberate
 * architecture choice: the bytes pass through our server (unlike the
 * earlier direct-to-Cloudinary approach) specifically so sharp can touch
 * them before they're stored.
 */
export function useImageUpload(purpose) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  async function upload(file) {
    setIsUploading(true);
    setError(null);
    try {
      const { url } = await uploadService.upload(file, purpose);
      return url;
    } catch (err) {
      setError(err.message || 'Upload failed');
      throw err;
    } finally {
      setIsUploading(false);
    }
  }

  return { upload, isUploading, error };
}
