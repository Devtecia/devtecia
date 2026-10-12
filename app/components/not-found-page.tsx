import type { Metadata } from 'next';
import Image from 'next/image';

export const notFoundMetadata: Metadata = {
  title: '404 | Devtecia',
  description: 'La página que buscas no existe o cambió de lugar.',
};

// The route line ends before reaching its destination: the visual metaphor for a missing page.
const route = 'M16 64 H148 C188 64 196 28 236 28 H316';

export default function NotFoundPage() {
  return (
    <html lang="es">
      <body className="not-found-body">
        <main className="not-found container">
          <a className="site-logo" href="/" aria-label="Devtecia, volver al inicio">
            <Image src="/brand/devtecia-logo-grafito.svg" alt="Devtecia" width={160} height={32} priority />
          </a>
          <div className="not-found-stage">
            <svg className="not-found-route" aria-hidden="true" viewBox="0 0 400 96">
              <path className="not-found-track" d={route} />
              <circle className="not-found-start" cx="16" cy="64" r="6" />
              <circle className="not-found-end" cx="372" cy="28" r="14" />
              <text className="not-found-mark" x="372" y="33">?</text>
              <circle className="not-found-dot" r="6" style={{ offsetPath: `path('${route}')` }} />
            </svg>
            <p className="eyebrow">Error 404</p>
            <h1 className="not-found-title">Esta ruta<br />no lleva a ningún lado.</h1>
            <p className="not-found-copy">La página que buscas no existe o cambió de lugar. Volvamos a un punto conocido.</p>
            <div className="not-found-actions">
              <a className="button" href="/">Volver al inicio <span aria-hidden="true">↗</span></a>
              <a className="text-link" href="/hablemos">Hablemos de tu proyecto <span aria-hidden="true">↗</span></a>
            </div>
            <p className="not-found-en" lang="en">Page not found. <a href="/en" hrefLang="en">Go to the English site <span aria-hidden="true">↗</span></a></p>
          </div>
        </main>
      </body>
    </html>
  );
}
