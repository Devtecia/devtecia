import ThanksPage from '../../components/thanks-page';
import { pageMetadata } from '../../i18n';

export const metadata = pageMetadata('en', 'thanks');

export default function Thanks() {
  return <ThanksPage locale="en" />;
}
