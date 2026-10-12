import sharp from 'sharp';
import { animatedImage, imageSignature, MAX_IMAGE_BYTES, MAX_IMAGE_EDGE, MAX_ORIGINAL_BYTES, MAX_SERVER_INPUT_PIXELS } from './task-images';

/** Trusted server normalization. Never write or retain the untrusted original. */
export async function processTaskImage(bytes: Uint8Array) {
  if (!bytes.length || bytes.length > MAX_ORIGINAL_BYTES) throw new Error('La imagen supera el límite de 20 MiB.');
  const format = imageSignature(bytes);
  if (!format || animatedImage(bytes, format)) throw new Error('Usa una imagen JPEG, PNG o WebP sin animación.');
  const input = sharp(bytes, { limitInputPixels: MAX_SERVER_INPUT_PIXELS, failOn: 'warning', animated: true });
  const metadata = await input.metadata();
  if (metadata.format !== format || !metadata.width || !metadata.height || (metadata.pages ?? 1) > 1 || metadata.width * metadata.height > MAX_SERVER_INPUT_PIXELS) throw new Error('No pudimos leer una imagen estática válida.');
  for (const edge of [MAX_IMAGE_EDGE, 1280, 960, 640]) {
    for (const quality of [80, 65, 45]) {
      const { data, info } = await input.clone().rotate().resize({ width: edge, height: edge, fit: 'inside', withoutEnlargement: true }).webp({ quality, effort: 4 }).toBuffer({ resolveWithObject: true });
      if (data.length <= MAX_IMAGE_BYTES) return { bytes: data, width: info.width, height: info.height, byteSize: data.length };
    }
  }
  throw new Error('No pudimos reducir esta imagen a 400 KiB. Elige otra imagen.');
}
