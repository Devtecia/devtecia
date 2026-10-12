export type ClientInput = { name: string; website: string; summary: string };
export type BrandInput = { name: string; website: string; summary: string };
export type MarketingInputErrors = Partial<Record<keyof ClientInput, string>>;
export type MarketingInputResult<T> = { ok: true; value: T } | { ok: false; errors: MarketingInputErrors };

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

function normalizeWebsite(raw: unknown, errors: MarketingInputErrors): string {
  const website = text(raw);
  if (!website) return '';
  if (website.length > 2048) {
    errors.website = 'Usa una dirección web de máximo 2048 caracteres.';
    return website;
  }
  try {
    const url = new URL(website);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) {
      errors.website = 'Escribe una dirección web válida que empiece con http:// o https://.';
      return website;
    }
    return url.toString();
  } catch {
    errors.website = 'Escribe una dirección web válida que empiece con http:// o https://.';
    return website;
  }
}

function parseMarketingInput(raw: Record<string, unknown>): MarketingInputResult<ClientInput> {
  const value: ClientInput = {
    name: text(raw.name),
    website: '',
    summary: text(raw.summary),
  };
  const errors: MarketingInputErrors = {};
  if (!value.name) errors.name = 'Escribe el nombre.';
  else if (value.name.length > 120) errors.name = 'Usa un nombre de máximo 120 caracteres.';
  value.website = normalizeWebsite(raw.website, errors);
  if (value.summary.length > 1200) errors.summary = 'Usa una descripción de máximo 1200 caracteres.';
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value };
}

export function parseClientInput(raw: Record<string, unknown>): MarketingInputResult<ClientInput> {
  return parseMarketingInput(raw);
}

export function parseBrandInput(raw: Record<string, unknown>): MarketingInputResult<BrandInput> {
  return parseMarketingInput(raw);
}

export function isMarketingRecordId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
