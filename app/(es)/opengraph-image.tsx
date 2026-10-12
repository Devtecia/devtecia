import { ogSize, renderOgImage } from '../components/og-image';
import es from '../i18n/es';

export const alt = es.meta.ogImageAlt;
export const size = ogSize;
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return renderOgImage('es');
}
