// Prepares the profile photo: tight crop on face and shoulders (hides most of the background),
// 2× Lanczos upscale, light denoise and sharpening. No retouching of the face itself.
// Usage: node scripts/prepare-photo.mjs "<source image>"   → src/assets/ramiro.png
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const src = process.argv[2];
if (!src) throw new Error('Pass the source image path');
const out = fileURLToPath(new URL('../src/assets/ramiro.png', import.meta.url));

const crop = { left: 36, top: 4, width: 200, height: 200 }; // square around head and shoulders
await sharp(src)
  .flatten({ background: '#ffffff' })
  .extract(crop)
  .median(1)                                        // soften JPEG-style block noise from the low-res source
  .resize(crop.width * 2, crop.height * 2, { kernel: 'lanczos3' })
  .sharpen({ sigma: 0.8, m1: 0.6, m2: 1.2 })        // restore edge definition after upscaling
  .modulate({ saturation: 0.95 })
  .png({ compressionLevel: 9 })
  .toFile(out);
console.log('ok', out);

// Tighter face-only crop for very small sizes (header logo).
const face = { left: 50, top: 12, width: 158, height: 158 };
const outFace = fileURLToPath(new URL('../src/assets/ramiro-face.png', import.meta.url));
await sharp(src)
  .flatten({ background: '#ffffff' })
  .extract(face)
  .median(1)
  .resize(face.width * 2, face.height * 2, { kernel: 'lanczos3' })
  .sharpen({ sigma: 0.8, m1: 0.6, m2: 1.2 })
  .modulate({ saturation: 0.95 })
  .png({ compressionLevel: 9 })
  .toFile(outFace);
console.log('ok', outFace);
