'use client';

import { useState, type FormEvent } from 'react';
import { TASK_PRIORITIES, type TaskErrors } from '../../../../../lib/admin/task-input';
import type { BoardTask, TaskAssignee } from '../../../../../lib/admin/task-board';
import type { ProjectStatus } from '../../../../../lib/admin/session-types';
import { mutateTask } from '../task-actions';

type Props = {
  projectId: string; statuses: ProjectStatus[]; assignees: TaskAssignee[];
  task?: BoardTask; initialStatus: string;
  onSaved(): void; onPending(pending: boolean): void;
};
export default function TaskForm({ projectId, statuses, assignees, task, initialStatus, onSaved, onPending }: Props) {
  const [errors, setErrors] = useState<TaskErrors>({});
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const hint = (field: keyof TaskErrors) => errors[field] ? <p className="field-error" id={`task-${field}-error`}>{errors[field]}</p> : null;
  const invalid = (field: keyof TaskErrors) => ({ 'aria-invalid': errors[field] ? true as const : undefined, 'aria-describedby': errors[field] ? `task-${field}-error` : undefined });
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    setPending(true);
    onPending(true);
    setErrors({});
    setMessage('');
    try {
      const result = await mutateTask(task
        ? { kind: 'update', projectId, taskId: task.id, version: task.version, fields }
        : { kind: 'create', projectId, fields });
      if (result.ok) onSaved();
      else {
        setErrors(result.errors ?? {});
        setMessage(result.message ?? 'Revisa los campos indicados.');
      }
    } catch {
      setMessage('No pudimos guardar la tarea. Revisa tu conexión e intenta de nuevo.');
    } finally {
      setPending(false);
      onPending(false);
    }
  }
  return (
    <form className="form-grid task-form" onSubmit={submit} noValidate aria-busy={pending}>
      <fieldset disabled={pending} className="task-fields">
        <div className="field">
          <label htmlFor="task-title">Título</label>
          <input id="task-title" name="title" required maxLength={200} defaultValue={task?.title} autoFocus {...invalid('title')} />
          {hint('title')}
        </div>
        <div className="field">
          <label htmlFor="task-description">Descripción</label>
          <textarea id="task-description" name="description" maxLength={20000} defaultValue={task?.description} {...invalid('description')} />
          {hint('description')}
        </div>
        <div className="task-field-pair">
          <div className="field">
            <label htmlFor="task-status">Estado</label>
            <select id="task-status" name="status" defaultValue={task?.status ?? initialStatus} {...invalid('status')}>
              {statuses.map(status => <option key={status.key} value={status.key}>{status.label}</option>)}
            </select>
            {hint('status')}
          </div>
          <div className="field">
            <label htmlFor="task-priority">Prioridad</label>
            <select id="task-priority" name="priority" defaultValue={task?.priority ?? 'medium'} {...invalid('priority')}>
              {Object.entries(TASK_PRIORITIES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
            {hint('priority')}
          </div>
        </div>
        <div className="field">
          <label htmlFor="task-assignee_id">Persona asignada</label>
          <select id="task-assignee_id" name="assignee_id" defaultValue={task?.assignee_id ?? ''} {...invalid('assignee_id')}>
            <option value="">Sin asignar</option>
            {task?.assignee_id && !assignees.some(person => person.id === task.assignee_id) ? <option value={task.assignee_id} disabled>Persona inactiva · cambia la asignación</option> : null}
            {assignees.map(person => <option key={person.id} value={person.id}>{person.name || person.initials}</option>)}
          </select>
          {hint('assignee_id')}
        </div>
        <div className="task-field-pair">
          <div className="field">
            <label htmlFor="task-due_date">Fecha límite</label>
            <input id="task-due_date" name="due_date" type="date" defaultValue={task?.due_date ?? ''} {...invalid('due_date')} />
            {hint('due_date')}
          </div>
          <div className="field">
            <label htmlFor="task-estimate">Estimación</label>
            <input id="task-estimate" name="estimate" type="number" min="0" max="1000" step="1" defaultValue={task?.estimate ?? ''} {...invalid('estimate')} />
            {hint('estimate')}
          </div>
        </div>
        <div className="field">
          <label htmlFor="task-labels">Etiquetas</label>
          <input id="task-labels" name="labels" defaultValue={task?.labels.join(', ')} {...invalid('labels')} aria-describedby={errors.labels ? 'task-labels-error' : 'task-labels-hint'} />
          <p id="task-labels-hint" className="field-hint">Sepáralas con comas. Máximo 20 etiquetas.</p>
          {hint('labels')}
        </div>
      </fieldset>
      {message ? <p role="alert" className="form-message form-message--error">{message}</p> : null}
      <div className="form-actions">
        <button className="button button--primary" type="submit" disabled={pending}>{pending ? 'Guardando…' : task ? 'Guardar cambios' : 'Crear tarea'}</button>
      </div>
    </form>
  );
}
