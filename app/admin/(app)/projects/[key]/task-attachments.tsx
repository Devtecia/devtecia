'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { compressTaskImage, uploadImageQueue, type ImageQueueItem } from '../../../../../lib/admin/task-image-client';
import { MAX_TASK_IMAGES, type TaskAttachment } from '../../../../../lib/admin/task-images';
import { addTaskImage, getTaskImages } from '../attachment-actions';

function ImagePreview({ file, name }: { file: File; name: string }) {
  const [url, setUrl] = useState('');
  useEffect(() => { const next = URL.createObjectURL(file); setUrl(next); return () => URL.revokeObjectURL(next); }, [file]);
  return url ? <img src={url} alt={`Vista previa de ${name}`} width={160} height={120} /> : null;
}

export function useTaskImageUploads(taskId?: string) {
  const [images, setImages] = useState<TaskAttachment[]>([]);
  const [queue, setQueue] = useState<ImageQueueItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(Boolean(taskId));
  const [loadError, setLoadError] = useState('');
  const [selectionError, setSelectionError] = useState('');
  const gate = useRef(false);
  useEffect(() => {
    let canceled = false;
    if (!taskId) { setLoading(false); return; }
    setLoading(true);
    getTaskImages(taskId).then(result => {
      if (!canceled) { setImages(result.images); setLoadError(result.ok ? '' : 'No pudimos cargar las imágenes. Vuelve a abrir la tarea para intentar de nuevo.'); }
    }).catch(() => { if (!canceled) setLoadError('No pudimos cargar las imágenes. Vuelve a abrir la tarea.'); }).finally(() => { if (!canceled) setLoading(false); });
    return () => { canceled = true; };
  }, [taskId]);
  async function select(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (gate.current) return;
    gate.current = true;
    setProcessing(true);
    setSelectionError('');
    try {
      const remaining = MAX_TASK_IMAGES - images.length - queue.length;
      if (files.length > remaining) { setSelectionError(`Puedes agregar ${Math.max(0, remaining)} imágenes más. Máximo 5 por tarea.`); return; }
      const next: ImageQueueItem[] = [];
      const failures: string[] = [];
      for (const file of files) {
        try { next.push({ id: crypto.randomUUID(), name: file.name, file: await compressTaskImage(file) }); }
        catch (error) { failures.push(`${file.name}: ${error instanceof Error ? error.message : 'No pudimos optimizar esta imagen.'}`); }
      }
      setQueue(current => [...current, ...next]);
      setSelectionError(failures.join(' '));
    } finally { gate.current = false; setProcessing(false); }
  }
  async function upload(id: string) {
    const failed = await uploadImageQueue(id, queue, async (savedId, file) => {
      const form = new FormData(); form.set('image', file);
      return addTaskImage(savedId, form);
    });
    setQueue(failed);
    if (queue.length > failed.length) {
      try { const result = await getTaskImages(id); if (result.ok) { setImages(result.images); setLoadError(''); } } catch { /* Saved uploads remain saved; gallery can be refreshed later. */ }
    }
    return failed.length === 0;
  }
  return { processing, loading, queue, images, loadError, selectionError, select, upload, remove: (id: string) => setQueue(current => current.filter(item => item.id !== id)) };
}
export default function TaskAttachments({ state, disabled }: { state: ReturnType<typeof useTaskImageUploads>; disabled: boolean }) {
  return <section className="task-images" aria-label="Imágenes de la tarea" aria-busy={state.processing || state.loading}>
    <div className="field"><label htmlFor="task-images">Imágenes</label><p className="field-hint" id="task-images-hint">Máximo 5 imágenes. JPEG, PNG o WebP hasta 20 MiB. Se guardan como WebP de hasta 1600 px y 400 KiB.</p>
      <input id="task-images" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={state.select} disabled={disabled || state.processing || state.loading || state.images.length + state.queue.length >= MAX_TASK_IMAGES} aria-describedby="task-images-hint" />
    </div>
    {state.loading ? <div className="task-image-skeleton" role="status">Cargando imágenes…</div> : null}
    {state.processing ? <p role="status">Optimizando imágenes antes de subirlas…</p> : null}
    {state.loadError ? <p className="field-error" role="alert">{state.loadError}</p> : null}
    {state.selectionError ? <p className="field-error" role="alert">{state.selectionError}</p> : null}
    {!state.images.length && !state.queue.length && !state.loading ? <p className="field-hint">Agrega una captura o referencia visual para el equipo.</p> : null}
    <ul className="task-image-gallery">
      {state.images.map(image => <li key={image.id}><a href={image.url} target="_blank" rel="noopener noreferrer"><img src={image.url} width={image.width} height={image.height} alt="Imagen adjunta a la tarea" /></a><span>{Math.ceil(image.byte_size / 1024)} KiB · Guardada</span></li>)}
      {state.queue.map(item => <li key={item.id}><ImagePreview file={item.file} name={item.name} /><span>{item.name} · {Math.ceil(item.file.size / 1024)} KiB</span>{item.error ? <p className="field-error" role="alert">{item.error}</p> : <span>Lista para subir al guardar</span>}<button className="button" type="button" disabled={disabled || state.processing} onClick={() => state.remove(item.id)}>Quitar selección</button></li>)}
    </ul>
  </section>;
}
