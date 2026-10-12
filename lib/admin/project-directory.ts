export const PROJECT_PAGE_SIZE = 24;
export type DirectoryQuery = { q: string; client: string; sort: 'name' | 'newest'; page: number; offset: number };
export function parseProjectDirectory(raw: Record<string, string | string[] | undefined>): DirectoryQuery {
  const text = (value: unknown) => typeof value === 'string' ? value.trim().slice(0, 100) : '';
  const candidate = typeof raw.page === 'string' && /^\d{1,5}$/.test(raw.page) ? Number(raw.page) : 1;
  const page = Math.max(1, candidate);
  return { q: text(raw.q), client: text(raw.client), sort: raw.sort === 'newest' ? 'newest' : 'name', page, offset: (page - 1) * PROJECT_PAGE_SIZE };
}
/** Escape LIKE wildcards so filters remain literal text, not query syntax. */
export function directoryPattern(value: string) { return `%${value.replace(/[\\%_]/g, '\\$&')}%`; }
export function directoryHref(query: DirectoryQuery, page: number) {
  const params = new URLSearchParams({ q: query.q, client: query.client, sort: query.sort, page: String(page) });
  return `/admin/projects?${params}`;
}
