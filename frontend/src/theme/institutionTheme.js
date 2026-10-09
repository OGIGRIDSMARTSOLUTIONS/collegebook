const DEFAULT_PRIMARY = '#2f855a';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let rp = 0, gp = 0, bp = 0;
  if (h < 60) [rp, gp, bp] = [c, x, 0];
  else if (h < 120) [rp, gp, bp] = [x, c, 0];
  else if (h < 180) [rp, gp, bp] = [0, c, x];
  else if (h < 240) [rp, gp, bp] = [0, x, c];
  else if (h < 300) [rp, gp, bp] = [x, 0, c];
  else [rp, gp, bp] = [c, 0, x];
  return rgbToHex((rp + m) * 255, (gp + m) * 255, (bp + m) * 255);
}

export function createInstitutionPalette(primary = DEFAULT_PRIMARY) {
  const match = /^#([0-9a-f]{6})$/i.exec(primary) || /^#([0-9a-f]{6})$/i.exec(DEFAULT_PRIMARY);
  const n = parseInt(match[1], 16);
  const [h, rawS] = rgbToHsl((n >> 16) & 255, (n >> 8) & 255, n & 255);
  const s = clamp(rawS, 38, 72);
  return {
    primary: hslToHex(h, s, 36),
    hover: hslToHex(h, s, 28),
    soft: hslToHex(h, clamp(s - 12, 24, 55), 95),
    muted: hslToHex(h, clamp(s - 18, 18, 45), 90),
    border: hslToHex(h, clamp(s - 20, 15, 40), 82),
    text: hslToHex(h, clamp(s - 8, 30, 62), 20),
  };
}

export async function extractThemeFromLogo(file) {
  if (!file?.type?.startsWith('image/')) return createInstitutionPalette();
  const bitmap = await createImageBitmap(file);
  const max = 120;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const buckets = new Map();

  for (let i = 0; i < data.length; i += 16) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a < 180) continue;
    const [h, s, l] = rgbToHsl(r, g, b);
    if (l > 91 || l < 9 || s < 18) continue;
    const qr = Math.round(r / 24) * 24;
    const qg = Math.round(g / 24) * 24;
    const qb = Math.round(b / 24) * 24;
    const key = `${clamp(qr,0,255)},${clamp(qg,0,255)},${clamp(qb,0,255)}`;
    const score = 1 + s / 100 + (l > 20 && l < 70 ? 0.4 : 0);
    buckets.set(key, (buckets.get(key) || 0) + score);
  }
  bitmap.close?.();

  const best = [...buckets.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!best) return null;
  const [r, g, b] = best[0].split(',').map(Number);
  return createInstitutionPalette(rgbToHex(r, g, b));
}

export async function extractThemeFromLogoUrl(url) {
  if (!url) return null;

  try {
    const response = await fetch(url, { mode: 'cors', cache: 'force-cache' });
    if (!response.ok) return null;
    const blob = await response.blob();
    if (!blob.type?.startsWith('image/')) return null;
    return await extractThemeFromLogo(blob);
  } catch {
    return null;
  }
}

export function applyInstitutionPalette(palette) {
  const p = palette?.primary ? palette : createInstitutionPalette();
  const root = document.documentElement;
  root.style.setProperty('--color-brand', p.primary);
  root.style.setProperty('--color-brand-hover', p.hover);
  root.style.setProperty('--color-brand-soft', p.soft);
  root.style.setProperty('--color-border', p.border);
  root.style.setProperty('--color-bg', p.soft);
  root.style.setProperty('--color-yearbook', p.primary);
  root.style.setProperty('--color-yearbook-soft', p.soft);
  root.style.setProperty('--color-yearbook-ink', p.text);
  root.style.setProperty('--institution-muted', p.muted);
  root.style.setProperty('--institution-text', p.text);
}

export const DEFAULT_INSTITUTION_PALETTE = createInstitutionPalette();
