import type { Metadata } from 'next';
import en from './en';
import es, { type Dictionary } from './es';

export type Locale = 'es' | 'en';
export type PageKey = 'home' | 'contact' | 'thanks';
export type { Dictionary };

export const locales: Locale[] = ['es', 'en'];
export const siteUrl = 'https://www.devtecia.com';

const dictionaries: Record<Locale, Dictionary> = { es, en };
const paths: Record<PageKey, Record<Locale, string>> = {
  home: { es: '/', en: '/en' },
  contact: { es: '/hablemos', en: '/en/hablemos' },
  thanks: { es: '/gracias', en: '/en/thanks' },
};

export function getDictionary(locale: Locale = 'es') {
  return dictionaries[locale];
}

export function localePath(locale: Locale, page: PageKey) {
  return paths[page][locale];
}

export function languageAlternates(page: PageKey) {
  return { es: paths[page].es, en: paths[page].en, 'x-default': paths[page].es };
}

export function rootMetadata(locale: Locale): Metadata {
  const { meta } = getDictionary(locale);
  return {
    metadataBase: new URL(siteUrl),
    title: meta.siteTitle,
    description: meta.siteDescription,
    openGraph: { title: meta.ogTitle, description: meta.ogDescription, type: 'website', locale: meta.ogLocale, alternateLocale: locale === 'es' ? 'en_US' : 'es_CO', siteName: 'Devtecia' },
    twitter: { card: 'summary_large_image', title: meta.ogTitle, description: meta.twitterDescription },
  };
}

export function pageMetadata(locale: Locale, page: PageKey): Metadata {
  const { meta } = getDictionary(locale);
  const copy: Record<PageKey, [string, string]> = {
    home: [meta.homeTitle, meta.homeDescription],
    contact: [meta.contactTitle, meta.contactDescription],
    thanks: [meta.thanksTitle, meta.thanksDescription],
  };
  const [title, description] = copy[page];
  // Open Graph and Twitter come from the locale root layout; redefining them here would replace them wholesale.
  const metadata: Metadata = { title, description, alternates: { canonical: localePath(locale, page), languages: languageAlternates(page) } };
  // The thanks page only makes sense right after a submission: never a search result.
  if (page === 'thanks') metadata.robots = { index: false, follow: true };
  return metadata;
}
