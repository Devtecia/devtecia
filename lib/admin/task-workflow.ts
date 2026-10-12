import { parseTaskMutation, type TaskErrors } from './task-input';

type Project = { id: string; key: string; statuses: { key: string }[] };
type Task = { id: string; project_id: string; status: string; version: number };
export type TaskMutationPort = {
  active(): Promise<boolean>;
  project(id: string): Promise<Project | null>;
  task(id: string): Promise<Task | null>;
  assignee(id: string): Promise<boolean>;
  rpc(name: string, args: Record<string, unknown>): Promise<{ error: { code?: string } | null; data?: { id: string } | null }>;
};
export type TaskMutationResult = { ok: boolean; message?: string; errors?: TaskErrors; projectKey?: string; taskId?: string };
const conflict = 'Esta tarea fue actualizada por otra persona. Recarga el tablero antes de volver a intentarlo.';
function databaseMessage(code?: string) {
  if (code === '40001') return conflict;
  if (code === '42501') return 'Tu sesión no permite modificar tareas. Vuelve a ingresar.';
  if (code === 'P0002') return 'La tarea o el proyecto ya no están disponibles. Recarga el tablero.';
  if (code === '22023' || code === '23514' || code === '23503') return 'Los datos ya no son válidos. Revisa el estado y la persona asignada.';
  return 'No pudimos guardar la tarea. Intenta de nuevo.';
}

/** All lookups and RPCs must run with the requesting user's Supabase session. */
export async function executeTaskMutation(raw: unknown, port: TaskMutationPort): Promise<TaskMutationResult> {
  const parsed = parseTaskMutation(raw);
  if (!parsed.ok) return { ok: false, errors: parsed.errors, message: 'Revisa los datos de la tarea.' };
  const input = parsed.value;
  try {
    if (!await port.active()) return { ok: false, message: 'Tu sesión venció. Vuelve a ingresar.' };
    const project = await port.project(input.projectId);
    if (!project) return { ok: false, message: databaseMessage('P0002') };
    const status = input.kind === 'move' ? input.status : input.fields.status;
    if (!project.statuses.some(item => item.key === status)) return { ok: false, message: 'Ese estado ya no está disponible. Recarga el tablero.' };
    if (input.kind !== 'move' && input.fields.assignee_id && !await port.assignee(input.fields.assignee_id)) return { ok: false, errors: { assignee_id: 'Esta persona ya no está activa.' } };
    if (input.kind !== 'create') {
      const task = await port.task(input.taskId);
      if (!task || task.project_id !== project.id) return { ok: false, message: databaseMessage('P0002') };
      if (task.version !== input.version) return { ok: false, message: conflict };
      if (input.kind === 'move' && input.beforeTaskId) {
        const before = await port.task(input.beforeTaskId);
        if (!before || before.project_id !== project.id || before.status !== status) return { ok: false, message: 'La posición cambió. Recarga el tablero.' };
      }
    }
    let name: string;
    let args: Record<string, unknown>;
    if (input.kind === 'create') {
      name = 'create_task';
      args = { p_project_id: project.id, ...Object.fromEntries(Object.entries(input.fields).map(([key, value]) => [`p_${key}`, value])) };
    } else if (input.kind === 'update') {
      name = 'update_task';
      args = { p_task_id: input.taskId, p_version: input.version, p_fields: input.fields };
    } else {
      name = 'move_task';
      args = { p_task_id: input.taskId, p_version: input.version, p_status: input.status, p_before_task_id: input.beforeTaskId };
    }
    const { error, data } = await port.rpc(name, args);
    return error ? { ok: false, message: databaseMessage(error.code) } : { ok: true, projectKey: project.key, taskId: data?.id ?? (input.kind !== 'create' ? input.taskId : undefined) };
  } catch {
    return { ok: false, message: 'No pudimos conectar con el tablero. Intenta de nuevo.' };
  }
}
