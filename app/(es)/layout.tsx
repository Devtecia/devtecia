import '@fontsource-variable/manrope';
import '../globals.css';
import Tracking from '../components/tracking';
import { getDictionary, rootMetadata } from '../i18n';

export const metadata = rootMetadata('es');

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}<Tracking copy={getDictionary('es').consent} /></body></html>;
}
