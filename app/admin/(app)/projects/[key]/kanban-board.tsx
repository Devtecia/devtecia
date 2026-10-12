'use client';

import { useEffect, useRef, useState, useTransition, type CSSProperties, type DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import { columnTasks, filterTasks, reorderTarget, type BoardTask, type TaskAssignee } from '../../../../../lib/admin/task-board';
import { TASK_PRIORITIES, type TaskPriority } from '../../../../../lib/admin/task-input';
import type { ProjectStatus } from '../../../../../lib/admin/session-types';
import { mutateTask } from '../task-actions';
import TaskForm from './task-form';

type Props = { projectId: string; projectKey: string; statuses: ProjectStatus[]; tasks: BoardTask[]; assignees: TaskAssignee[]; query: string };
type Editor = { task?: BoardTask; status: string };
export default function KanbanBoard({ projectId, projectKey, statuses, tasks, assignees, query }: Props) {
  const router = useRouter();
  const [priority, setPriority] = useState<TaskPriority | 'all'>('all');
  const [editor, setEditor] = useState<Editor | null>(null);
  const [formPending, setFormPending] = useState(false);
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const moving = useRef(false);
  const busy = pending || formPending;
  const visible = filterTasks(tasks, query, priority, projectKey);
  useEffect(() => {
    if (!editor) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const modal = dialog.current;
    modal?.showModal();
    return () => { modal?.close(); if (opener?.isConnected) opener.focus(); };
  }, [editor]);
  function open(status: string, task?: BoardTask) {
    if (busy) return;
    setError('');
    setEditor({ status, task });
  }
  function close() { if (!formPending) setEditor(null); }
  function move(task: BoardTask, status: string, beforeTaskId: string | null = null) {
    if (busy || moving.current || beforeTaskId === task.id) return;
    moving.current = true;
    setError('');
    setNotice('');
    startTransition(async () => {
      try {
        const result = await mutateTask({ kind: 'move', projectId, taskId: task.id, version: task.version, status, beforeTaskId });
        if (result.ok) { setNotice('Tarea movida.'); router.refresh(); }
        else setError(result.message ?? 'No pudimos mover la tarea.');
      } catch {
        setError('No pudimos mover la tarea. Revisa tu conexión e intenta de nuevo.');
      } finally { moving.current = false; }
    });
  }
  function drop(event: DragEvent, status: string, beforeTaskId: string | null = null) {
    event.preventDefault();
    event.stopPropagation();
    const task = tasks.find(item => item.id === dragId && event.dataTransfer.getData('text/plain') === item.id);
    setDragId(null);
    if (task) move(task, status, beforeTaskId);
  }
  function reorder(task: BoardTask, direction: 'up' | 'down') {
    const target = reorderTarget(columnTasks(tasks, task.status), task.id, direction);
    if (target !== undefined) move(task, task.status, target);
  }
  return (
    <>
      <div className="board-toolbar">
        <div className="field">
          <label htmlFor="board-priority">Prioridad</label>
          <select id="board-priority" value={priority} onChange={event => setPriority(event.target.value as TaskPriority | 'all')}>
            <option value="all">Todas</option>
            {Object.entries(TASK_PRIORITIES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </div>
        <p className="project-meta">{visible.length} de {tasks.length} tareas</p>
        <button className="button button--primary" disabled={busy} onClick={() => open(statuses[0].key)}>Crear tarea</button>
      </div>
      <p className="visually-hidden" role="status" aria-live="polite">{pending ? 'Guardando movimiento…' : notice}</p>
      {error ? <div className="form-message form-message--error" role="alert"><p>{error}</p><button className="button" disabled={busy} onClick={() => router.refresh()}>Recargar tablero</button></div> : null}
      {!tasks.length ? <p className="board-start">Crea la primera tarea para organizar el trabajo del equipo.</p> : null}
      {tasks.length > 0 && !visible.length ? <p className="board-start">No hay tareas que coincidan con los filtros.</p> : null}
      <section className="board-preview kanban-board" aria-label="Tablero de tareas" aria-busy={pending}>
        {statuses.map(status => {
          const all = columnTasks(tasks, status.key);
          const shown = all.filter(task => visible.some(item => item.id === task.id));
          return (
            <section className="board-column" key={status.key} style={{ '--status-color': status.color } as CSSProperties}
              aria-label={status.label} onDragOver={event => { if (dragId && !busy) event.preventDefault(); }} onDrop={event => drop(event, status.key)}>
              <h2 className="board-column-title"><span className="status-dot" aria-hidden="true" />{status.label}<span className="board-column-count">{shown.length}{shown.length !== all.length ? ` / ${all.length}` : ''}</span></h2>
              {shown.map(task => {
                const index = all.findIndex(item => item.id === task.id);
                const assignee = assignees.find(person => person.id === task.assignee_id);
                return (
                  <article className="task-card" key={task.id} draggable={!busy} data-dragging={dragId === task.id}
                    onDragStart={event => { setDragId(task.id); event.dataTransfer.setData('text/plain', task.id); event.dataTransfer.effectAllowed = 'move'; }}
                    onDragEnd={() => setDragId(null)} onDragOver={event => { if (dragId && !busy) event.preventDefault(); }} onDrop={event => drop(event, status.key, task.id)}>
                    <p className="task-code">{projectKey} {task.number}<span className={`task-priority task-priority--${task.priority}`}>{TASK_PRIORITIES[task.priority]}</span></p>
                    <button className="task-title" disabled={busy} onClick={() => open(status.key, task)}>{task.title}</button>
                    {task.labels.length ? <ul className="task-labels" aria-label="Etiquetas">{task.labels.map(label => <li key={label}>{label}</li>)}</ul> : null}
                    <div className="task-meta">
                      <span>{assignee?.name || (task.assignee_id ? 'Persona inactiva' : 'Sin asignar')}</span>
                      {task.due_date ? <time dateTime={task.due_date}>{task.due_date.split('-').reverse().join('/')}</time> : null}
                      {task.estimate !== null ? <span>Estimación: {task.estimate}</span> : null}
                    </div>
                    <div className="task-moves">
                      <label className="visually-hidden" htmlFor={`move-${task.id}`}>Mover {projectKey} {task.number} a</label>
                      <select id={`move-${task.id}`} value={task.status} disabled={busy} onChange={event => move(task, event.target.value)}>
                        {statuses.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
                      </select>
                      <button type="button" className="button" disabled={busy || index === 0} aria-label={`Subir ${projectKey} ${task.number}`} onClick={() => reorder(task, 'up')}>↑</button>
                      <button type="button" className="button" disabled={busy || index === all.length - 1} aria-label={`Bajar ${projectKey} ${task.number}`} onClick={() => reorder(task, 'down')}>↓</button>
                    </div>
                  </article>
                );
              })}
              {!shown.length ? <p className="board-column-empty">{all.length ? 'Sin coincidencias' : 'Sin tareas'}</p> : null}
              <button className="button board-add" disabled={busy} onClick={() => open(status.key)}>Agregar tarea</button>
            </section>
          );
        })}
      </section>
      <dialog ref={dialog} className="task-dialog" aria-labelledby="task-dialog-title" onCancel={event => { event.preventDefault(); close(); }}>
        <header className="task-dialog-head">
          <h2 id="task-dialog-title">{editor?.task ? `Editar ${projectKey} ${editor.task.number}` : 'Crear tarea'}</h2>
          <button className="button" disabled={formPending} onClick={close} aria-label="Cerrar tarea">Cerrar</button>
        </header>
        {editor ? <TaskForm projectId={projectId} statuses={statuses} assignees={assignees} task={editor.task} initialStatus={editor.status}
          onPending={setFormPending} onSaved={() => { setEditor(null); setNotice('Tarea guardada.'); router.refresh(); }} /> : null}
      </dialog>
    </>
  );
}
