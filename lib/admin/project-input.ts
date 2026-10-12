export type ProjectInput = { name: string; key: string; client: string; color: string };
export type ProjectInputErrors = Partial<Record<keyof ProjectInput, string>>;
export type ProjectInputResult = { ok: true; value: ProjectInput } | { ok: false; errors: ProjectInputErrors };

export const PROJECT_KEY_PATTERN = /^[A-Z][A-Z0-9_-]{1,7}$/;
export const PROJECT_COLORS = ['#B8F23D', '#7CCBFF', '#F4C95D', '#FF8066', '#C7A6FF', '#E4E5DE'] as const;

const strip = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Builds a short key from the initials of each word, or the first letters of a single word. */
export function suggestProjectKey(name: string): string {
  const words = strip(name).toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean);
  if (words.length === 0) return '';
  const key = words.length === 1 ? words[0].slice(0, 4) : words.map(word => word[0]).join('').slice(0, 6);
  return /^[A-Z]/.test(key) ? key : `P${key}`.slice(0, 8);
}

export function parseProjectInput(raw: Record<string, unknown>): ProjectInputResult {
  const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
  const value: ProjectInput = {
    name: text(raw.name),
    key: text(raw.key).toUpperCase(),
    client: text(raw.client),
    color: text(raw.color).toUpperCase(),
  };
  const errors: ProjectInputErrors = {};
  if (!value.name) errors.name = 'Escribe el nombre del proyecto.';
  else if (value.name.length > 120) errors.name = 'Usa un nombre de máximo 120 caracteres.';
  if (!PROJECT_KEY_PATTERN.test(value.key)) errors.key = 'La clave empieza con una letra y lleva de 2 a 8 letras, números o guiones bajos.';
  if (value.client.length > 120) errors.client = 'Usa un cliente de máximo 120 caracteres.';
  if (!/^#[0-9A-F]{6}$/.test(value.color)) errors.color = 'Elige un color de la lista.';
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value };
}
