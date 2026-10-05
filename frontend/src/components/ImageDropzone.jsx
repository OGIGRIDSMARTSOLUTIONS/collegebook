import { useRef, useState } from 'react';
import { useImageUpload } from '../hooks/useImageUpload';
import { Spinner } from './loading/Spinner';

/**
 * ImageDropzone — drag-and-drop (with click-to-browse as a fallback for
 * anyone who'd rather not drag) that uploads straight to Cloudinary via
 * useImageUpload and hands back the resulting URL. This is the thing
 * standing in for the "paste a URL" text fields that existed as an
 * honest placeholder — see ProfilePage's EditProfileForm and FeedPage's
 * composer for where it's actually used.
 */
export function ImageDropzone({ purpose, currentUrl, onUploaded, shape = 'square', className = '' }) {
  const [isDragging, setIsDragging] = useState(false);
  const { upload, isUploading, error } = useImageUpload(purpose);
  const inputRef = useRef(null);

  async function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const url = await upload(file);
      onUploaded(url);
    } catch {
      // error state is already surfaced via the hook's `error` below
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  }

  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-lg';

  return (
    <div className={className}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex h-full w-full cursor-pointer items-center justify-center overflow-hidden border-2 border-dashed bg-bg transition-colors ${shapeClass} ${
          isDragging ? 'border-brand bg-brand-soft' : 'border-border hover:border-brand'
        }`}
      >
        {currentUrl ? (
          <img src={currentUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 p-4 text-center">
            <UploadIcon className="h-5 w-5 text-text-secondary" />
            <span className="text-xs text-text-secondary">Drag a photo here, or click to browse</span>
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/80 text-sm text-text">
            Uploading…
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

function UploadIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path d="M12 16V4M12 4l-4 4M12 4l4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
