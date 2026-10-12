import { handleContact } from '../../../lib/contact.mjs';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  return handleContact(request, {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    CONTACT_FROM_EMAIL: process.env.CONTACT_FROM_EMAIL,
  });
}
