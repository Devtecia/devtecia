import { MAX_IMAGE_BYTES, MAX_IMAGE_EDGE } from './task-images';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type Image = { bytes: Uint8Array; width: number; height: number; byteSize: number };
type Reservation = { id: string; objectKey: string };
export type AttachmentPort = {
  authorize(taskId: string): Promise<{ userId: string; projectId: string } | null>;
  process(bytes: Uint8Array): Promise<Image>;
  reserve(taskId: string, userId: string): Promise<Reservation>;
  upload(key: string, bytes: Uint8Array): Promise<void>;
  complete(id: string, userId: string, image: Image): Promise<void>;
  abort(id: string, userId: string): Promise<boolean>;
  remove(key: string): Promise<void>;
  cancel(id: string, userId: string): Promise<void>;
};
export type AttachmentResult = { ok: boolean; message?: string };
export async function uploadTaskAttachment(taskId: string, bytes: Uint8Array, port: AttachmentPort): Promise<AttachmentResult> {
  if (!uuid.test(taskId)) return { ok: false, message: 'La tarea no es válida.' };
  let reservation: Reservation | undefined;
  let userId = '';
  try {
    const context = await port.authorize(taskId);
    if (!context) return { ok: false, message: 'Tu sesión o esta tarea ya no están disponibles.' };
    userId = context.userId;
    const image = await port.process(bytes);
    if (image.byteSize !== image.bytes.length || image.byteSize > MAX_IMAGE_BYTES || image.width > MAX_IMAGE_EDGE || image.height > MAX_IMAGE_EDGE) throw new Error('Invalid processed image.');
    reservation = await port.reserve(taskId, userId);
    await port.upload(reservation.objectKey, image.bytes);
    await port.complete(reservation.id, userId, image);
    return { ok: true };
  } catch {
    if (reservation) {
      try {
        // Serialize abort against completion; never delete a successfully committed image.
        if (!await port.abort(reservation.id, userId)) return { ok: true };
        // Always try removal, including ambiguous network failures during upload.
        await port.remove(reservation.objectKey);
        await port.cancel(reservation.id, userId);
      } catch { /* Keep the slot reserved if cleanup is uncertain; never release an orphan. */ }
    }
    return { ok: false, message: 'La tarea está guardada, pero no pudimos subir la imagen. Usa JPEG, PNG o WebP sin animación. Máximo 5 imágenes por tarea; vuelve a intentar.' };
  }
}
