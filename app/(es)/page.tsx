import HomePage from '../components/home-page';
import { pageMetadata } from '../i18n';

export const metadata = pageMetadata('es', 'home');

export default function Home() {
  return <HomePage locale="es" />;
}
