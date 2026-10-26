const MAX_BYTES = 16_384;
const emailPattern = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;
// Interest keys come from the form chips; labels stay in Spanish because the internal email is Spanish.
const interests = { operations: 'Ordenar mi operación', automation: 'Automatizar tareas repetitivas', integrations: 'Integrar mis herramientas o IA', other: 'Otra necesidad' };
const controlChars = /[\r\n\x00-\x1f\x7f]/;
// A phone is optional. Shape only, not a numbering plan: 7 to 15 digits with the usual separators.
const phonePattern = /^\+?[\d\s().-]{6,30}$/;
const validPhone = value => value === '' || (phonePattern.test(value) && !controlChars.test(value) && (value.match(/\d/g) ?? []).length >= 7 && (value.match(/\d/g) ?? []).length <= 15);
// Campaign attribution: only these keys, only strings. Losing a lead over tracking data is worse than losing the tracking data.
const attributionKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid', 'angle', 'landing', 'referrer'];
const cleanAttribution = value => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  return attributionKeys.flatMap(key => {
    const raw = value[key];
    if (typeof raw !== 'string') return [];
    const clean = raw.replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0, 200);
    return clean === '' ? [] : [`${key}: ${clean}`];
  });
};
const respond = (status, message) => Response.json({ message }, { status, headers: { 'Cache-Control': 'no-store' } });
const messages = {
  es: {
    origin: 'Envía el formulario desde este sitio.',
    format: 'Formato de solicitud no compatible.',
    tooLong: 'El mensaje es demasiado largo.',
    empty: 'Completa el formulario.',
    unreadable: 'No pudimos leer la solicitud. Revisa los campos.',
    invalid: 'Revisa los campos.',
    fields: 'Revisa los campos: nombre, email válido y, si escribes un mensaje, de 10 a 4000 caracteres.',
    unavailable: 'El formulario no está disponible. Escríbenos a info@devtecia.com.',
    accepted: 'Tu consulta fue aceptada para envío. Gracias por contactar a Devtecia.',
    timeout: 'No pudimos confirmar el envío a tiempo. Antes de reintentar, puedes escribirnos por email.',
    failed: 'No pudimos confirmar el envío. Conservamos tus campos para que puedas reintentar.',
  },
  en: {
    origin: 'Submit the form from this site.',
    format: 'Unsupported request format.',
    tooLong: 'The message is too long.',
    empty: 'Complete the form.',
    unreadable: 'We could not read the request. Check the fields.',
    invalid: 'Check the fields.',
    fields: 'Check the fields: name, a valid email and, if you write a message, between 10 and 4000 characters.',
    unavailable: 'The form is not available. Write to us at info@devtecia.com.',
    accepted: 'Your inquiry was accepted for delivery. Thank you for contacting Devtecia.',
    timeout: 'We could not confirm delivery in time. Before trying again, you can email us.',
    failed: 'We could not confirm delivery. Your fields are kept so you can try again.',
  },
};

export async function handleContact(request, env, transport = fetch, timeoutMs = 8000) {
  // Only user facing replies are localized; the internal email to Devtecia stays in Spanish.
  const locale = new URL(request.url).searchParams.get('lang') === 'en' ? 'en' : 'es';
  const reply = (status, key) => respond(status, messages[locale][key]);
  if (request.headers.get('origin') !== new URL(request.url).origin) {
    return reply(403, 'origin');
  }
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return reply(415, 'format');
  }
  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (!Number.isFinite(declaredLength) || declaredLength < 0 || declaredLength > MAX_BYTES) {
    return reply(413, 'tooLong');
  }
  let input;
  try {
    // Count streamed bytes too: Content-Length is optional and untrusted.
    const reader = request.body?.getReader();
    if (!reader) return reply(400, 'empty');
    const chunks = [];
    let length = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BYTES) {
        await reader.cancel();
        return reply(413, 'tooLong');
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    input = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    return reply(400, 'unreadable');
  }
  if (!input || typeof input !== 'object' || Array.isArray(input)) return reply(400, 'invalid');
  // The message is optional: a short form converts better, and the interest chip already qualifies the lead.
  const { name, email, message = '', company = '', website = '', phone = '', interest, attribution } = input;
  if (![name, email, message, company, website, phone].every(value => typeof value === 'string') ||
      (interest !== undefined && !Object.hasOwn(interests, interest)) ||
      name.trim().length < 2 || name.length > 100 || /[\r\n\x00-\x1f\x7f]/.test(name) ||
      email.length > 254 || !emailPattern.test(email) || /[\r\n\x00-\x1f\x7f]/.test(email) ||
      company.length > 150 || /[\r\n\x00-\x1f\x7f]/.test(company) ||
      (message.trim() !== '' && message.trim().length < 10) || message.length > 4000 || !validPhone(phone) || website !== '') {
    return reply(400, 'fields');
  }
  const from = env.CONTACT_FROM_EMAIL;
  const senderAddress = typeof from === 'string' ? (from.match(/<([^<>]+)>$/)?.[1] ?? from) : '';
  if (!env.RESEND_API_KEY || !emailPattern.test(senderAddress) || /[\r\n\x00-\x1f\x7f]/.test(from)) {
    return reply(503, 'unavailable');
  }
  const origin = cleanAttribution(attribution);
  const controller = new AbortController();
  let timer;
  try {
    const operation = (async () => {
      const result = await transport('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          from, to: ['info@devtecia.com'], reply_to: email,
          subject: 'Nueva consulta desde Devtecia',
          text: `Nombre: ${name.trim()}\nEmail: ${email}\nWhatsApp o teléfono: ${phone.trim() || 'No indicado'}\nEmpresa: ${company.trim() || 'No indicada'}\nInterés: ${interest === undefined ? 'No indicado' : interests[interest]}${locale === 'en' ? '\nIdioma: inglés' : ''}\n\n${message.trim() || '(sin mensaje)'}${origin.length ? `\n\nOrigen:\n${origin.join('\n')}` : ''}`,
        }),
      });
      if (!result.ok) throw new Error('provider');
      const body = await result.json();
      if (typeof body?.id !== 'string' || body.id.trim().length === 0) throw new Error('provider');
    })();
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => { controller.abort(); reject(new Error('timeout')); }, timeoutMs);
    });
    await Promise.race([operation, timeout]);
    return reply(202, 'accepted');
  } catch {
    return controller.signal.aborted
      ? reply(504, 'timeout')
      : reply(502, 'failed');
  } finally {
    clearTimeout(timer);
  }
}
