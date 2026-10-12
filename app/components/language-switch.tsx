import { getDictionary, localePath, locales, type Locale, type PageKey } from '../i18n';

// Each option is named in its own language so speakers of either can find it.
const names: Record<Locale, string> = { es: 'Español', en: 'English' };

export default function LanguageSwitch({ locale = 'es', page = 'home', onNavigate }: { locale?: Locale; page?: PageKey; onNavigate?: () => void }) {
  return (
    <nav className="language-switch" aria-label={getDictionary(locale).languageLabel}>
      {locales.map(option => (
        <a key={option} href={localePath(option, page)} hrefLang={option} lang={option} aria-current={option === locale ? 'true' : undefined} aria-label={names[option]} onClick={onNavigate}>{option.toUpperCase()}</a>
      ))}
    </nav>
  );
}
