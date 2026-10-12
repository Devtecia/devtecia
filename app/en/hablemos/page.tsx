import ContactPage from '../../components/contact-page';
import { pageMetadata } from '../../i18n';

export const metadata = pageMetadata('en', 'contact');

export default function Contact() {
  return <ContactPage locale="en" />;
}
