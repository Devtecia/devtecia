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

/** Header dimensions let browsers reject decompression-sized inputs before allocation. */
export function sourceImageDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  const format = imageSignature(bytes);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (format === 'png' && bytes.length >= 24) return { width: view.getUint32(16), height: view.getUint32(20) };
  if (format === 'jpeg') {
    let offset = 2;
    while (offset + 4 <= bytes.length) {
      if (bytes[offset++] !== 0xff) return null;
      while (bytes[offset] === 0xff) offset++;
      const marker = bytes[offset++];
      if (marker === 0xda || marker === 0xd9) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > bytes.length) break;
      const length = view.getUint16(offset);
      if (length < 2 || offset + length > bytes.length) return null;
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker) && length >= 7) return { width: view.getUint16(offset + 5), height: view.getUint16(offset + 3) };
      offset += length;
    }
  }
  if (format === 'webp') {
    for (let offset = 12; offset + 8 <= bytes.length;) {
      const type = String.fromCharCode(...bytes.slice(offset, offset + 4));
      const length = view.getUint32(offset + 4, true);
      const data = offset + 8;
      if (length > bytes.length - data) return null;
      if (type === 'VP8X' && length >= 10) return { width: 1 + bytes[data + 4] + (bytes[data + 5] << 8) + (bytes[data + 6] << 16), height: 1 + bytes[data + 7] + (bytes[data + 8] << 8) + (bytes[data + 9] << 16) };
      if (type === 'VP8 ' && length >= 10 && bytes[data + 3] === 0x9d && bytes[data + 4] === 0x01 && bytes[data + 5] === 0x2a) return { width: view.getUint16(data + 6, true) & 0x3fff, height: view.getUint16(data + 8, true) & 0x3fff };
      if (type === 'VP8L' && length >= 5 && bytes[data] === 0x2f) return { width: 1 + ((bytes[data + 1] | (bytes[data + 2] << 8)) & 0x3fff), height: 1 + (((bytes[data + 2] >> 6) | (bytes[data + 3] << 2) | (bytes[data + 4] << 10)) & 0x3fff) };
      offset += 8 + length + (length % 2);
    }
  }
  return null;
}
