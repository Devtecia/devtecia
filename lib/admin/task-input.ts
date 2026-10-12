export const TASK_PRIORITIES = { low: 'Baja', medium: 'Media', high: 'Alta', urgent: 'Urgente' } as const;
export type TaskPriority = keyof typeof TASK_PRIORITIES;
export type TaskFields = {
  title: string; description: string; status: string; priority: TaskPriority;
  assignee_id: string | null; due_date: string | null; estimate: number | null; labels: string[];
};
export type TaskErrors = Partial<Record<keyof TaskFields, string>>;
export const isUuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};

export function parseTaskInput(raw: unknown): { ok: true; value: TaskFields } | { ok: false; errors: TaskErrors } {
  const source = object(raw);
  const title = text(source.title);
  const description = text(source.description);
  const status = text(source.status);
  const priority = text(source.priority) as TaskPriority;
  const assignee_id = text(source.assignee_id) || null;
  const due_date = text(source.due_date) || null;
  const estimateText = source.estimate == null ? '' : String(source.estimate).trim();
  const estimate = estimateText === '' ? null : Number(estimateText);
  const labelSource = Array.isArray(source.labels) ? source.labels : text(source.labels).split(',');
  const labels: string[] = [];
  for (const item of labelSource) {
    const label = text(item);
    if (label && !labels.some(existing => existing.toLocaleLowerCase() === label.toLocaleLowerCase())) labels.push(label);
  }
  const errors: TaskErrors = {};
  if (!title || title.length > 200) errors.title = 'Escribe un título de 1 a 200 caracteres.';
  if (description.length > 20000) errors.description = 'La descripción admite hasta 20000 caracteres.';
  if (!status || status.length > 120) errors.status = 'Elige un estado válido.';
  if (!Object.hasOwn(TASK_PRIORITIES, priority)) errors.priority = 'Elige una prioridad válida.';
  if (assignee_id !== null && !isUuid(assignee_id)) errors.assignee_id = 'Elige una persona del equipo.';
  if (due_date && (!/^\d{4}-\d{2}-\d{2}$/.test(due_date) || !Number.isFinite(Date.parse(due_date)) || new Date(due_date).toISOString().slice(0, 10) !== due_date)) errors.due_date = 'Elige una fecha válida.';
  if (estimate !== null && (!/^\d+$/.test(estimateText) || !Number.isInteger(estimate) || estimate < 0 || estimate > 1000)) errors.estimate = 'Usa una estimación entera de 0 a 1000.';
  if (labels.length > 20 || labels.some(label => label.length > 40)) errors.labels = 'Usa hasta 20 etiquetas de máximo 40 caracteres.';
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value: { title, description, status, priority, assignee_id, due_date, estimate, labels } };
}

export type TaskMutation =
  | { kind: 'create'; projectId: string; fields: TaskFields }
  | { kind: 'update'; projectId: string; taskId: string; version: number; fields: TaskFields }
  | { kind: 'move'; projectId: string; taskId: string; version: number; status: string; beforeTaskId: string | null };
export function parseTaskMutation(raw: unknown): { ok: true; value: TaskMutation } | { ok: false; errors?: TaskErrors } {
  const source = object(raw);
  if (!isUuid(source.projectId) || !['create', 'update', 'move'].includes(String(source.kind))) return { ok: false };
  if (source.kind !== 'create' && (!isUuid(source.taskId) || !Number.isInteger(source.version) || Number(source.version) < 1 || Number(source.version) > 2147483647)) return { ok: false };
  if (source.kind === 'move') {
    const beforeTaskId = source.beforeTaskId ?? null;
    const status = text(source.status);
    if (!status || status.length > 120 || (beforeTaskId !== null && (!isUuid(beforeTaskId) || beforeTaskId === source.taskId))) return { ok: false };
    return { ok: true, value: { kind: 'move', projectId: source.projectId, taskId: source.taskId as string, version: source.version as number, status, beforeTaskId } };
  }
  const fields = parseTaskInput(source.fields);
  if (!fields.ok) return fields;
  return source.kind === 'create'
    ? { ok: true, value: { kind: 'create', projectId: source.projectId, fields: fields.value } }
    : { ok: true, value: { kind: 'update', projectId: source.projectId, taskId: source.taskId as string, version: source.version as number, fields: fields.value } };
}
