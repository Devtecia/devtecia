export type ClientInput = { name: string; website: string; summary: string };
export type BrandInput = { name: string; website: string; summary: string };
export type AudienceInput = {
  segmentName: string;
  geography: string;
  pains: string[];
  objections: string[];
  hypotheses: string[];
};
export type CampaignBudgetRange = { min: number; max: number; currency: string };
export type CampaignBriefInput = {
  objective: string;
  timeframe: string;
  valueProposition: string;
  budgetRange: CampaignBudgetRange | null;
  missingInformation: string[];
};
export type MarketingInputErrors = Record<string, string>;
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

function parseTextList(raw: unknown, field: string, label: string, errors: MarketingInputErrors, limit: number): string[] {
  const items = text(raw).split(/\r?\n/).map(item => item.trim()).filter(Boolean);
  if (items.length > limit) errors[field] = `Usa máximo ${limit} elementos en ${label.toLowerCase()}.`;
  else if (items.some(item => item.length > 300)) errors[field] = `Cada elemento de ${label.toLowerCase()} debe tener máximo 300 caracteres.`;
  return items;
}

export function parseAudienceInput(raw: Record<string, unknown>): MarketingInputResult<AudienceInput> {
  const value: AudienceInput = {
    segmentName: text(raw.segmentName),
    geography: text(raw.geography),
    pains: [],
    objections: [],
    hypotheses: [],
  };
  const errors: MarketingInputErrors = {};
  if (!value.segmentName) errors.segmentName = 'Escribe el nombre del público.';
  else if (value.segmentName.length > 120) errors.segmentName = 'Usa un nombre de máximo 120 caracteres.';
  if (!value.geography) errors.geography = 'Escribe la ubicación del público.';
  else if (value.geography.length > 180) errors.geography = 'Usa una ubicación de máximo 180 caracteres.';
  value.pains = parseTextList(raw.pains, 'pains', 'Necesidades', errors, 12);
  value.objections = parseTextList(raw.objections, 'objections', 'Objeciones', errors, 12);
  value.hypotheses = parseTextList(raw.hypotheses, 'hypotheses', 'Hipótesis', errors, 12);
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value };
}

function requiredBriefText(raw: unknown, field: string, label: string, errors: MarketingInputErrors): string {
  const value = text(raw);
  if (!value) errors[field] = `Escribe ${label.toLowerCase()}.`;
  else if (value.length > 2000) errors[field] = `${label} debe tener máximo 2000 caracteres.`;
  return value;
}

export function parseCampaignBriefInput(raw: Record<string, unknown>): MarketingInputResult<CampaignBriefInput> {
  const errors: MarketingInputErrors = {};
  const value: CampaignBriefInput = {
    objective: requiredBriefText(raw.objective, 'objective', 'el objetivo de campaña', errors),
    timeframe: requiredBriefText(raw.timeframe, 'timeframe', 'el periodo de campaña', errors),
    valueProposition: requiredBriefText(raw.valueProposition, 'valueProposition', 'la propuesta de valor', errors),
    budgetRange: null,
    missingInformation: [],
  };
  value.missingInformation = parseTextList(raw.missingInformation, 'missingInformation', 'Información pendiente', errors, 10);
  const minRaw = text(raw.budgetMin);
  const maxRaw = text(raw.budgetMax);
  const currency = text(raw.currency).toUpperCase();
  const hasAnyBudgetValue = Boolean(minRaw || maxRaw || currency);
  if (hasAnyBudgetValue) {
    const min = /^\d+$/.test(minRaw) ? Number(minRaw) : Number.NaN;
    const max = /^\d+$/.test(maxRaw) ? Number(maxRaw) : Number.NaN;
    if (!Number.isSafeInteger(min) || min <= 0 || min > 1_000_000_000) errors.budgetMin = 'Escribe un mínimo entero entre 1 y 1.000.000.000.';
    if (!Number.isSafeInteger(max) || max <= 0 || max > 1_000_000_000) errors.budgetMax = 'Escribe un máximo entero entre 1 y 1.000.000.000.';
    else if (Number.isSafeInteger(min) && max < min) errors.budgetMax = 'El máximo debe ser igual o mayor que el mínimo.';
    if (!/^[A-Z]{3}$/.test(currency)) errors.currency = 'Usa el código de moneda de tres letras, por ejemplo COP.';
    if (!errors.budgetMin && !errors.budgetMax && !errors.currency) value.budgetRange = { min, max, currency };
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value };
}

export function isMarketingRecordId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
