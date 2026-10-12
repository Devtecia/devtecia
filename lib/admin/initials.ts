/** Mirrors `public.initials_from` in the migration: two letters from a name, or from the email local part. */
export function initialsFrom(name?: string | null, email?: string | null): string {
  const source = name?.trim() || email?.split('@')[0]?.trim() || '';
  const words = source.split(/[\s._-]+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}
