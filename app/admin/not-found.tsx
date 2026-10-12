export default function AdminNotFound() {
  return (
    <main className="login">
      <section className="empty-state" aria-labelledby="admin-404-title">
        <p className="micro-label">Error 404</p>
        <h1 id="admin-404-title">No encontramos esta página</h1>
        <p>Puede que el proyecto se haya archivado o que la dirección esté mal escrita.</p>
        <a className="button button--primary" href="/admin">Volver al panel</a>
      </section>
    </main>
  );
}
