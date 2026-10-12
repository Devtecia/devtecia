import { animatedImage, imageSignature, sourceImageDimensions, MAX_IMAGE_BYTES, MAX_IMAGE_EDGE, MAX_IMAGE_PIXELS, MAX_ORIGINAL_BYTES } from './task-images';

/** Originals stay in the browser. The server still independently validates every byte. */
export async function compressTaskImage(file: File): Promise<File> {
  if (!file.size || file.size > MAX_ORIGINAL_BYTES) throw new Error('El archivo debe pesar como máximo 20 MiB.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const format = imageSignature(bytes);
  const dimensions = sourceImageDimensions(bytes);
  if (!format || animatedImage(bytes, format)) throw new Error('Usa JPEG, PNG o WebP sin animación.');
  if (!dimensions || !dimensions.width || !dimensions.height || dimensions.width * dimensions.height > MAX_IMAGE_PIXELS) throw new Error('La imagen supera los 40 megapíxeles o no es válida.');
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > MAX_IMAGE_PIXELS) throw new Error('La imagen es demasiado grande.');
    const canvas = document.createElement('canvas');
    try {
      for (const edge of [MAX_IMAGE_EDGE, 1280, 960, 640]) {
        const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Este navegador no permite optimizar imágenes.');
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        for (const quality of [0.8, 0.65, 0.45]) {
          const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', quality));
          if (blob?.type === 'image/webp' && blob.size <= MAX_IMAGE_BYTES) return new File([blob], 'task-image.webp', { type: 'image/webp' });
        }
      }
    } finally { canvas.width = 0; canvas.height = 0; }
    throw new Error('No pudimos reducir la imagen a 400 KiB. Prueba otra.');
  } finally { bitmap.close(); }
}

export type ImageQueueItem = { id: string; file: File; name: string; error?: string };
/** Return only failed items, so retries never resend successfully uploaded images. */
export async function uploadImageQueue(taskId: string, items: ImageQueueItem[], send: (taskId: string, file: File) => Promise<{ ok: boolean; message?: string }>) {
  const failed: ImageQueueItem[] = [];
  for (const item of items) {
    try {
      const result = await send(taskId, item.file);
      if (!result.ok) failed.push({ ...item, error: result.message ?? 'No pudimos subir esta imagen.' });
    } catch { failed.push({ ...item, error: 'La conexión falló. Vuelve a intentar.' }); }
  }
  return failed;
}
