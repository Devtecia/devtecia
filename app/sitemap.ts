import type { MetadataRoute } from 'next';
import { languageAlternates, locales, localePath, siteUrl, type PageKey } from './i18n';

const pages: { page: PageKey; priority: number }[] = [{ page: 'home', priority: 1 }, { page: 'contact', priority: 0.7 }];
const absolute = (path: string) => (path === '/' ? siteUrl : `${siteUrl}${path}`);

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.flatMap(locale => pages.map(({ page, priority }) => ({
    url: absolute(localePath(locale, page)),
    changeFrequency: 'monthly' as const,
    priority,
    alternates: { languages: Object.fromEntries(Object.entries(languageAlternates(page)).map(([lang, path]) => [lang, absolute(path)])) },
  })));
}
