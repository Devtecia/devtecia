import '@fontsource-variable/manrope';
import './admin.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: { default: 'Devtecia Admin', template: '%s | Devtecia Admin' },
  description: 'Panel interno de proyectos y tareas de Devtecia.',
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export const viewport: Viewport = { themeColor: '#151715' };

export default function AdminRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="admin">{children}</body>
    </html>
  );
}
