import ContactPage from '../../components/contact-page';
import { pageMetadata } from '../../i18n';

export const metadata = pageMetadata('es', 'contact');

export default function Contact() {
  return <ContactPage locale="es" />;
}
