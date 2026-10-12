'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAdminSession } from '../../../../lib/admin/session';
import { isMarketingRecordId, parseBrandInput, parseClientInput } from '../../../../lib/admin/marketing/inputs';
import { createClient } from '../../../../lib/supabase/server';
import type { MarketingFormState } from './marketing-forms';

const fields = ['name', 'website', 'summary'] as const;
const valuesFrom = (formData: FormData) => Object.fromEntries(fields.map(field => [field, String(formData.get(field) ?? '')]));

async function activeSupabase() {
  const session = await getAdminSession();
  if (session.status !== 'active') redirect('/admin/login');
  return createClient();
}

export async function createMarketingClient(_previous: MarketingFormState, formData: FormData): Promise<MarketingFormState> {
  const raw = valuesFrom(formData);
  const parsed = parseClientInput(raw);
  if (!parsed.ok) return { errors: parsed.errors, values: raw };

  const supabase = await activeSupabase();
  const { data, error } = await supabase.from('marketing_clients').insert(parsed.value).select('id').single<{ id: string }>();
  if (error || !data) return { message: 'No pudimos crear el cliente. Intenta de nuevo.', values: raw };
  revalidatePath('/admin/marketing');
  redirect(`/admin/marketing/clients/${data.id}`);
}

export async function updateMarketingClient(_previous: MarketingFormState, formData: FormData): Promise<MarketingFormState> {
  const raw = valuesFrom(formData);
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
  const raw = valuesFrom(formData);
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
  const raw = valuesFrom(formData);
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
