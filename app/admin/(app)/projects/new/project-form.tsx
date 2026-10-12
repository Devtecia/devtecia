'use client';

import { useActionState, useState } from 'react';
import { PROJECT_COLORS, suggestProjectKey } from '../../../../../lib/admin/project-input';
import type { ProjectFormState } from '../actions';

type ProjectFormProps = { action: (state: ProjectFormState, formData: FormData) => Promise<ProjectFormState> };

export default function ProjectForm({ action }: ProjectFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const [name, setName] = useState(state.values?.name ?? '');
  const [key, setKey] = useState(state.values?.key ?? '');
  const [keyTouched, setKeyTouched] = useState(false);
  const errors = state.errors ?? {};
  const selectedColor = state.values?.color || PROJECT_COLORS[0];

  return (
    <form className="panel form-grid" action={formAction} noValidate>
      <div className="field">
        <label htmlFor="project-name">Nombre</label>
        <input id="project-name" name="name" required maxLength={120} value={name} placeholder="Sitio web Ensama"
          aria-invalid={errors.name ? true : undefined} aria-describedby={errors.name ? 'project-name-error' : undefined}
          onChange={event => {
            setName(event.target.value);
            if (!keyTouched) setKey(suggestProjectKey(event.target.value));
          }} />
        {errors.name ? <p className="field-error" id="project-name-error">{errors.name}</p> : null}
      </div>
      <div className="field">
        <label htmlFor="project-key">Clave</label>
        <input id="project-key" name="key" required maxLength={8} value={key} placeholder="WEB" className="input-key"
          aria-invalid={errors.key ? true : undefined} aria-describedby="project-key-hint"
          onChange={event => { setKeyTouched(true); setKey(event.target.value.toUpperCase()); }} />
        <p className="field-hint" id="project-key-hint">{errors.key ?? 'Prefijo de las tareas, por ejemplo WEB 12.'}</p>
      </div>
      <div className="field">
        <label htmlFor="project-client">Cliente</label>
        <input id="project-client" name="client" maxLength={120} defaultValue={state.values?.client} placeholder="Opcional"
          aria-invalid={errors.client ? true : undefined} />
        {errors.client ? <p className="field-error">{errors.client}</p> : null}
      </div>
      <fieldset className="field color-field">
        <legend>Color</legend>
        <div className="swatches">
          {PROJECT_COLORS.map(color => (
            <label className="swatch" key={color} style={{ background: color }}>
              <input type="radio" name="color" value={color} defaultChecked={color === selectedColor} />
              <span className="visually-hidden">{color}</span>
            </label>
          ))}
        </div>
        {errors.color ? <p className="field-error">{errors.color}</p> : null}
      </fieldset>
      {state.message ? <p role="alert" className="form-message form-message--error">{state.message}</p> : null}
      <div className="form-actions">
        <a className="button" href="/admin">Cancelar</a>
        <button className="button button--primary" type="submit" disabled={pending} aria-busy={pending}>
          {pending ? 'Creando…' : 'Crear proyecto'}
        </button>
      </div>
    </form>
  );
}
