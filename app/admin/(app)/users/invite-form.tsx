'use client';

import { useActionState } from 'react';
import type { InviteState } from '../../../../lib/admin/invitations';

export type TeamMember = { id: string; name: string; email: string; role: 'admin' | 'member'; status: 'active' | 'pending' | 'inactive' };

export default function InviteForm({
  action,
  members,
  listError,
}: {
  action: (state: InviteState, formData: FormData) => Promise<InviteState>;
  members: TeamMember[];
  listError?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const message = state.error ?? state.success;

  return (
    <div className="users-layout">
      <section className="panel users-invite" aria-labelledby="invite-title">
        <div className="page-head">
          <p className="micro-label">Equipo</p>
          <h1 id="invite-title">Invitar a una persona</h1>
          <p>Enviaremos un enlace para que configure su contraseña. El acceso nuevo tendrá el rol de miembro.</p>
        </div>
        <form className="form-grid" action={formAction}>
          <div className="field">
            <label htmlFor="invite-email">Correo</label>
            <input
              id="invite-email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              maxLength={254}
              required
              defaultValue={state.email}
              aria-invalid={state.error ? true : undefined}
              aria-describedby={message ? 'invite-message' : 'invite-hint'}
            />
            <span id="invite-hint" className="field-hint">La invitación vence según la configuración de autenticación.</span>
          </div>
          {state.error ? <p role="alert" id="invite-message" className="form-message form-message--error">{state.error}</p> : null}
          {state.success ? <p role="status" id="invite-message" className="form-message">{state.success}</p> : null}
          <div className="form-actions">
            <button className="button button--primary" type="submit" disabled={pending} aria-busy={pending}>
              {pending ? 'Enviando…' : 'Enviar invitación'}
            </button>
          </div>
        </form>
      </section>

      <section className="panel users-team" aria-labelledby="team-title">
        <div className="page-head">
          <p className="micro-label">Accesos</p>
          <h2 id="team-title">Equipo</h2>
          <p>Personas con acceso al panel y su estado actual.</p>
        </div>
        {listError ? <p role="status" className="form-message">{listError}</p> : null}
        {!listError && members.length === 0 ? <p className="users-empty">Todavía no hay integrantes para mostrar.</p> : null}
        {members.length > 0 ? (
          <div className="users-table-wrap">
            <table className="users-table">
              <thead><tr><th scope="col">Persona</th><th scope="col">Rol</th><th scope="col">Estado</th></tr></thead>
              <tbody>{members.map(member => (
                <tr key={member.id}>
                  <td><strong>{member.name || member.email}</strong>{member.name ? <span>{member.email}</span> : null}</td>
                  <td>{member.role === 'admin' ? 'Administrador' : 'Miembro'}</td>
                  <td><span className={`member-status${member.status === 'active' ? ' member-status--active' : ''}`}>{member.status === 'active' ? 'Activo' : member.status === 'pending' ? 'Invitación pendiente' : 'Desactivado'}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
