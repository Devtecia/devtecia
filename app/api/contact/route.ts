import { after } from 'next/server';
import { handleContact } from '../../../lib/contact.mjs';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  // `after` sends the Meta Conversions API event once the response is out, so it never delays the visitor.
  return handleContact(request, {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    CONTACT_FROM_EMAIL: process.env.CONTACT_FROM_EMAIL,
    NEXT_PUBLIC_META_PIXEL_ID: process.env.NEXT_PUBLIC_META_PIXEL_ID,
    META_CAPI_TOKEN: process.env.META_CAPI_TOKEN,
    META_TEST_EVENT_CODE: process.env.META_TEST_EVENT_CODE,
    META_GRAPH_VERSION: process.env.META_GRAPH_VERSION,
  }, fetch, 8000, after);
}
