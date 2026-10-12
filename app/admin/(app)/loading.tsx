export default function AdminLoading() {
  return (
    <div className="skeleton-page" aria-busy="true" aria-label="Cargando">
      <div className="topbar"><span className="skeleton skeleton--crumb" /></div>
      <div className="project-head">
        <span className="skeleton skeleton--label" />
        <span className="skeleton skeleton--title" />
      </div>
      <div className="board-preview">
        {[0, 1, 2, 3].map(column => (
          <div className="board-column" key={column}>
            <span className="skeleton skeleton--label" />
            <span className="skeleton skeleton--card" />
            <span className="skeleton skeleton--card" />
          </div>
        ))}
      </div>
    </div>
  );
}
