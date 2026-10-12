'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAdminSession } from '../../../../lib/admin/session';
import { isMarketingRecordId, parseAudienceInput, parseBrandInput, parseCampaignBriefInput, parseClientInput } from '../../../../lib/admin/marketing/inputs';
import { createClient } from '../../../../lib/supabase/server';
import type { MarketingFormState } from './marketing-forms';

const valuesFrom = (formData: FormData, fields: readonly string[]) => Object.fromEntries(fields.map(field => [field, String(formData.get(field) ?? '')]));
const clientFields = ['name', 'website', 'summary'] as const;
const audienceFields = ['segmentName', 'geography', 'pains', 'objections', 'hypotheses'] as const;
const briefFields = ['objective', 'timeframe', 'valueProposition', 'budgetMin', 'budgetMax', 'currency', 'missingInformation'] as const;

async function activeSupabase() {
  const session = await getAdminSession();
  if (session.status !== 'active') redirect('/admin/login');
  return createClient();
}

export async function createMarketingClient(_previous: MarketingFormState, formData: FormData): Promise<MarketingFormState> {
  const raw = valuesFrom(formData, clientFields);
  const parsed = parseClientInput(raw);
  if (!parsed.ok) return { errors: parsed.errors, values: raw };

  const supabase = await activeSupabase();
  const { data, error } = await supabase.from('marketing_clients').insert(parsed.value).select('id').single<{ id: string }>();
  if (error || !data) return { message: 'No pudimos crear el cliente. Intenta de nuevo.', values: raw };
  revalidatePath('/admin/marketing');
  redirect(`/admin/marketing/clients/${data.id}`);
}

export async function updateMarketingClient(_previous: MarketingFormState, formData: FormData): Promise<MarketingFormState> {
  const raw = valuesFrom(formData, clientFields);
  const id = formData.get('id');
  const parsed = parseClientInput(raw);
  if (!isMarketingRecordId(id)) return { message: 'No encontramos este cliente.', values: raw };
  if (!parsed.ok) return { errors: parsed.errors, values: raw };

  const supabase = await activeSupabase();
  const { data, error } = await supabase.from('marketing_clients')
    .update({ ...parsed.value, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id')
    .maybeSingle<{ id: string }>();
  if (error || !data) return { message: 'No pudimos guardar los cambios del cliente. Intenta de nuevo.', values: raw };
  revalidatePath('/admin/marketing');
  revalidatePath(`/admin/marketing/clients/${id}`);
  return {};
}

export async function createMarketingBrand(_previous: MarketingFormState, formData: FormData): Promise<MarketingFormState> {
  const raw = valuesFrom(formData, clientFields);
  const clientId = formData.get('client_id');
  const parsed = parseBrandInput(raw);
  if (!isMarketingRecordId(clientId)) return { message: 'No encontramos este cliente.', values: raw };
  if (!parsed.ok) return { errors: parsed.errors, values: raw };

  const supabase = await activeSupabase();
  const { error } = await supabase.from('marketing_brands').insert({ ...parsed.value, client_id: clientId });
  if (error) return { message: 'No pudimos crear la marca. Intenta de nuevo.', values: raw };
  revalidatePath(`/admin/marketing/clients/${clientId}`);
  return {};
}

export async function updateMarketingBrand(_previous: MarketingFormState, formData: FormData): Promise<MarketingFormState> {
  const raw = valuesFrom(formData, clientFields);
  const id = formData.get('id');
  const clientId = formData.get('client_id');
  const parsed = parseBrandInput(raw);
  if (!isMarketingRecordId(id) || !isMarketingRecordId(clientId)) return { message: 'No encontramos esta marca.', values: raw };
  if (!parsed.ok) return { errors: parsed.errors, values: raw };

  const supabase = await activeSupabase();
  const { data, error } = await supabase.from('marketing_brands')
    .update({ ...parsed.value, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('client_id', clientId)
    .select('id')
    .maybeSingle<{ id: string }>();
  if (error || !data) return { message: 'No pudimos guardar los cambios de la marca. Intenta de nuevo.', values: raw };
  revalidatePath(`/admin/marketing/clients/${clientId}`);
  return {};
}

export async function createMarketingAudience(_previous: MarketingFormState, formData: FormData): Promise<MarketingFormState> {
  const raw = valuesFrom(formData, audienceFields);
  const clientId = formData.get('client_id');
  const brandId = formData.get('brand_id');
  const parsed = parseAudienceInput(raw);
  if (!isMarketingRecordId(clientId) || !isMarketingRecordId(brandId)) return { message: 'No encontramos esta marca.', values: raw };
  if (!parsed.ok) return { errors: parsed.errors, values: raw };

  const supabase = await activeSupabase();
  const { data: brand, error: brandError } = await supabase.from('marketing_brands').select('id').eq('id', brandId).eq('client_id', clientId).maybeSingle();
  if (brandError || !brand) return { message: 'La marca no pertenece a este cliente.', values: raw };
  const { error } = await supabase.from('marketing_audiences').insert({
    client_id: clientId,
    brand_id: brandId,
    segment_name: parsed.value.segmentName,
    geography: parsed.value.geography,
    pains: parsed.value.pains,
    objections: parsed.value.objections,
    hypotheses: parsed.value.hypotheses,
  });
  if (error) return { message: 'No pudimos crear el público. Intenta de nuevo.', values: raw };
  revalidatePath(`/admin/marketing/clients/${clientId}`);
  return {};
}

export async function updateMarketingAudience(_previous: MarketingFormState, formData: FormData): Promise<MarketingFormState> {
  const raw = valuesFrom(formData, audienceFields);
  const id = formData.get('id');
  const clientId = formData.get('client_id');
  const brandId = formData.get('brand_id');
  const parsed = parseAudienceInput(raw);
  if (!isMarketingRecordId(id) || !isMarketingRecordId(clientId) || !isMarketingRecordId(brandId)) return { message: 'No encontramos este público.', values: raw };
  if (!parsed.ok) return { errors: parsed.errors, values: raw };

  const supabase = await activeSupabase();
  const { data, error } = await supabase.from('marketing_audiences')
    .update({
      segment_name: parsed.value.segmentName,
      geography: parsed.value.geography,
      pains: parsed.value.pains,
      objections: parsed.value.objections,
      hypotheses: parsed.value.hypotheses,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('client_id', clientId)
    .eq('brand_id', brandId)
    .select('id')
    .maybeSingle();
  if (error || !data) return { message: 'No pudimos guardar los cambios del público. Intenta de nuevo.', values: raw };
  revalidatePath(`/admin/marketing/clients/${clientId}`);
  return {};
}

export async function createMarketingCampaignBrief(_previous: MarketingFormState, formData: FormData): Promise<MarketingFormState> {
  const raw = valuesFrom(formData, briefFields);
  const clientId = formData.get('client_id');
  const brandId = formData.get('brand_id');
  const audienceId = formData.get('audience_id');
  const parsed = parseCampaignBriefInput(raw);
  if (!isMarketingRecordId(clientId) || !isMarketingRecordId(brandId) || !isMarketingRecordId(audienceId)) return { message: 'No encontramos este público.', values: raw };
  if (!parsed.ok) return { errors: parsed.errors, values: raw };

  const supabase = await activeSupabase();
  const { data: audience, error: audienceError } = await supabase.from('marketing_audiences').select('id').eq('id', audienceId).eq('client_id', clientId).eq('brand_id', brandId).maybeSingle();
  if (audienceError || !audience) return { message: 'El público no pertenece a esta marca y cliente.', values: raw };
  const { error } = await supabase.from('marketing_campaign_briefs').insert({
    objective: parsed.value.objective,
    timeframe: parsed.value.timeframe,
    value_proposition: parsed.value.valueProposition,
    budget_range: parsed.value.budgetRange,
    missing_information: parsed.value.missingInformation,
    client_id: clientId,
    brand_id: brandId,
    audience_id: audienceId,
  });
  if (error) return { message: 'No pudimos crear el brief. Intenta de nuevo.', values: raw };
  revalidatePath(`/admin/marketing/clients/${clientId}`);
  return {};
}

export async function updateMarketingCampaignBrief(_previous: MarketingFormState, formData: FormData): Promise<MarketingFormState> {
  const raw = valuesFrom(formData, briefFields);
  const id = formData.get('id');
  const clientId = formData.get('client_id');
  const brandId = formData.get('brand_id');
  const audienceId = formData.get('audience_id');
  const parsed = parseCampaignBriefInput(raw);
  if (!isMarketingRecordId(id) || !isMarketingRecordId(clientId) || !isMarketingRecordId(brandId) || !isMarketingRecordId(audienceId)) return { message: 'No encontramos este brief.', values: raw };
  if (!parsed.ok) return { errors: parsed.errors, values: raw };

  const supabase = await activeSupabase();
  const { data, error } = await supabase.from('marketing_campaign_briefs')
    .update({
      objective: parsed.value.objective,
      timeframe: parsed.value.timeframe,
      value_proposition: parsed.value.valueProposition,
      budget_range: parsed.value.budgetRange,
      missing_information: parsed.value.missingInformation,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('audience_id', audienceId)
    .eq('client_id', clientId)
    .eq('brand_id', brandId)
    .select('id')
    .maybeSingle();
  if (error || !data) return { message: 'No pudimos guardar los cambios del brief. Intenta de nuevo.', values: raw };
  revalidatePath(`/admin/marketing/clients/${clientId}`);
  return {};
}
