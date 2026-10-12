import type { TaskFields, TaskPriority } from './task-input';
export type BoardTask = TaskFields & {
  id: string; project_id: string; number: number; position: number; version: number; created_at: string;
};
export type TaskAssignee = { id: string; name: string; initials: string; color: string };
export function columnTasks(tasks: BoardTask[], status: string) {
  return tasks.filter(task => task.status === status).sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
}
const searchable = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
export function filterTasks(tasks: BoardTask[], query: string, priority: TaskPriority | 'all', key: string) {
  const needle = searchable(query.trim());
  return tasks.filter(task => (priority === 'all' || task.priority === priority) && searchable([task.title, task.description, `${key} ${task.number}`, ...task.labels].join(' ')).includes(needle));
}
/** Returns the RPC anchor from the full, unfiltered column. Undefined means no move. */
export function reorderTarget(column: BoardTask[], taskId: string, direction: 'up' | 'down'): string | null | undefined {
  const index = column.findIndex(task => task.id === taskId);
  if (index < 0 || (direction === 'up' && index === 0) || (direction === 'down' && index === column.length - 1)) return undefined;
  return direction === 'up' ? column[index - 1].id : column[index + 2]?.id ?? null;
}
