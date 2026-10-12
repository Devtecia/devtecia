import { ogSize, renderOgImage } from '../components/og-image';
import en from '../i18n/en';

export const alt = en.meta.ogImageAlt;
export const size = ogSize;
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return renderOgImage('en');
}
