export const MAX_IMAGE_BYTES = 400 * 1024;
export const MAX_ORIGINAL_BYTES = 20 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 40_000_000;
export const MAX_IMAGE_EDGE = 1600;
export const MAX_TASK_IMAGES = 5;
export const TASK_IMAGE_BUCKET = 'task-images';
export type TaskAttachment = { id: string; task_id: string; width: number; height: number; byte_size: number; created_at: string; url: string };
export function imageSignature(bytes: Uint8Array): 'jpeg' | 'png' | 'webp' | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg';
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)) return 'png';
  if (String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return 'webp';
  return null;
}
/** Animation must be rejected before browser decoding discards additional frames. */
export function animatedImage(bytes: Uint8Array, format: string) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (format === 'png') {
    for (let offset = 8; offset + 12 <= bytes.length;) {
      const length = view.getUint32(offset);
      const type = String.fromCharCode(...bytes.slice(offset + 4, offset + 8));
      if (type === 'acTL') return true;
      if (length > bytes.length - offset - 12) break;
      offset += 12 + length;
    }
  }
  if (format === 'webp') {
    for (let offset = 12; offset + 8 <= bytes.length;) {
      const type = String.fromCharCode(...bytes.slice(offset, offset + 4));
      const length = view.getUint32(offset + 4, true);
      if (type === 'ANIM' || type === 'ANMF' || (type === 'VP8X' && Boolean(bytes[offset + 8] & 2))) return true;
      if (length > bytes.length - offset - 8) break;
      offset += 8 + length + (length % 2);
    }
  }
  return false;
}
