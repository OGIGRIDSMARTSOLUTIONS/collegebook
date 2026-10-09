/**
 * Optimise a feed photo before upload.
 * 5 x 7 inches at 200 PPI = 1000 x 1400 pixels. Landscape uses 1400 x 1000.
 */
const SHORT_EDGE = 1000;
const LONG_EDGE = 1400;
const TARGET_BYTES = 1.2 * 1024 * 1024;
const MIN_QUALITY = 0.58;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That picture could not be read.'));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Picture optimisation failed.'))),
      'image/webp',
      quality
    );
  });
}

export async function optimizePostImage(file) {
  if (!file?.type?.startsWith('image/')) throw new Error('Please choose an image file.');

  const image = await loadImage(file);
  const portrait = image.naturalHeight >= image.naturalWidth;
  const maxWidth = portrait ? SHORT_EDGE : LONG_EDGE;
  const maxHeight = portrait ? LONG_EDGE : SHORT_EDGE;
  const scale = Math.min(1, maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { alpha: false });
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, width, height);

  let quality = 0.82;
  let blob = await canvasToBlob(canvas, quality);
  while (blob.size > TARGET_BYTES && quality > MIN_QUALITY) {
    quality = Math.max(MIN_QUALITY, quality - 0.08);
    blob = await canvasToBlob(canvas, quality);
  }

  const baseName = (file.name || 'collegebook-photo').replace(/\.[^.]+$/, '');
  return new File([blob], `${baseName}.webp`, { type: 'image/webp', lastModified: Date.now() });
}
