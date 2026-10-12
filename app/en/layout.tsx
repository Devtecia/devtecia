import '@fontsource-variable/manrope';
import '../globals.css';
import { rootMetadata } from '../i18n';

export const metadata = rootMetadata('en');

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
