export function handleContact(
  request: Request,
  env: { RESEND_API_KEY?: string; CONTACT_FROM_EMAIL?: string },
  transport?: typeof fetch,
  timeoutMs?: number,
): Promise<Response>;
