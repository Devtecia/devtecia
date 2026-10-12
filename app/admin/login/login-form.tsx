'use client';

import { useActionState } from 'react';
import { noticeMessages, type LoginNotice, type LoginState } from '../../../lib/admin/auth-messages';

type LoginFormProps = {
  action: (state: LoginState, formData: FormData) => Promise<LoginState>;
  next: string;
  notice?: LoginNotice;
  setupPassword?: boolean;
};

export default function LoginForm({ action, next, notice, setupPassword = false }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const error = state.error ?? (notice === 'inactive' || notice === 'invite-error' ? noticeMessages[notice] : undefined);
  const info = !state.error && notice === 'signed-out' ? noticeMessages['signed-out'] : undefined;

  return (
    <main className="login">
      <section className="login-card" aria-labelledby="login-title">
        <img className="login-logo" src="/brand/devtecia-logo-grafito.svg" alt="Devtecia" width={160} height={32} />
        <p className="micro-label">Panel interno</p>
        <h1 id="login-title">{setupPassword ? 'Configura tu contraseña' : 'Ingresa a tu espacio de trabajo'}</h1>
        <form className="login-form" action={formAction}>
          {setupPassword ? <>
            <p>Elige una contraseña para completar tu acceso al equipo.</p>
            <input type="hidden" name="intent" value="invite-setup" />
            <div className="field">
              <label htmlFor="admin-password">Nueva contraseña</label>
              <input id="admin-password" name="password" type="password" autoComplete="new-password" minLength={8} required aria-invalid={error ? true : undefined} aria-describedby={error ? 'login-message' : undefined} />
            </div>
            <div className="field">
              <label htmlFor="admin-password-confirmation">Confirma la contraseña</label>
              <input id="admin-password-confirmation" name="password-confirmation" type="password" autoComplete="new-password" minLength={8} required aria-invalid={error ? true : undefined} aria-describedby={error ? 'login-message' : undefined} />
            </div>
          </> : <>
            <input type="hidden" name="next" value={next} />
            <div className="field">
              <label htmlFor="admin-email">Correo</label>
              <input
                id="admin-email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                defaultValue={state.email}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'login-message' : undefined}
              />
            </div>
            <div className="field">
              <label htmlFor="admin-password">Contraseña</label>
              <input id="admin-password" name="password" type="password" autoComplete="current-password" required aria-invalid={error ? true : undefined} aria-describedby={error ? 'login-message' : undefined} />
            </div>
          </>}
          {error ? <p role="alert" id="login-message" className="form-message form-message--error">{error}</p> : null}
          {info ? <p role="status" id="login-message" className="form-message">{info}</p> : null}
          <button className="button button--primary" type="submit" disabled={pending} aria-busy={pending}>
            {pending ? (setupPassword ? 'Guardando…' : 'Ingresando…') : (setupPassword ? 'Guardar contraseña' : 'Ingresar')}
          </button>
        </form>
      </section>
      <a className="login-back" href="/">Volver a devtecia.com</a>
    </main>
  );
}
