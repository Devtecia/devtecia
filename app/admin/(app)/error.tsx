'use client';

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="page page--center">
      <section className="empty-state" aria-labelledby="admin-error-title">
        <p className="micro-label">Sin conexión con los datos</p>
        <h1 id="admin-error-title">No pudimos cargar esta sección</h1>
        <p>Revisa tu conexión y vuelve a intentarlo. Si sigue fallando, avisa al equipo técnico.</p>
        <button className="button button--primary" type="button" onClick={reset}>Reintentar</button>
      </section>
    </main>
  );
}
