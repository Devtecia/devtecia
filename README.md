# Devtecia website

Next.js website with a contact form at `/hablemos`.

## Local setup

1. Install the project dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and configure the server-only values.
3. Run `npm run dev` and visit `/hablemos`.

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Resend API credential; never expose it to the browser. |
| `CONTACT_FROM_EMAIL` | Sender address on a domain verified in Resend, optionally `Devtecia <address@domain>`. |

The recipient is fixed server-side to `info@devtecia.com`. The visitor's email is the reply-to address. Missing configuration returns an unavailable error, not success. Restart the server after changing environment variables.

## Campañas de redes sociales

La home incluye el formulario justo después de "El punto de partida" (`#hablemos`); `/hablemos` sigue existiendo para enlaces directos. Todos los botones de la home suben a ese formulario.

**Un anuncio por ángulo.** Las tres tarjetas de "El punto de partida" son tres ángulos. Cada anuncio apunta a su URL y la página llega con esa opción elegida y esa tarjeta resaltada:

| Ángulo | Opción preseleccionada | URL del anuncio |
| --- | --- | --- |
| `excel` (si todo vive en Excel) | Ordenar mi operación | `https://www.devtecia.com/?a=excel&utm_source=meta&utm_medium=paid_social&utm_campaign=NOMBRE&utm_content=ANUNCIO` |
| `tareas` (si repites tareas cada día) | Automatizar tareas repetitivas | `...?a=tareas&...` |
| `medida` (si el software te obliga a adaptarte) | Otra necesidad | `...?a=medida&...` |

Convención de UTM: `utm_source` = `meta` / `google` / `linkedin`; `utm_medium` = `paid_social` / `cpc`; `utm_campaign` = nombre de la campaña; `utm_content` = identificador del anuncio. El origen (UTM, `fbclid`/`gclid`, ángulo, referrer y página de llegada) se guarda en la pestaña del visitante y llega en el email de cada consulta, bajo "Origen".

**Medición.** Meta Pixel y GA4 solo se instalan si configuras `NEXT_PUBLIC_META_PIXEL_ID` / `NEXT_PUBLIC_GA_ID` (ver `.env.example`; hay que volver a desplegar). El evento `Lead` (Meta) y `generate_lead` (GA4) se dispara **solo cuando el servidor acepta el envío**, nunca al hacer clic. El botón de WhatsApp (`NEXT_PUBLIC_WHATSAPP_NUMBER`) dispara `Contact` y `whatsapp_click`. Antes de pautar: publicar la política de tratamiento de datos y poner su URL en `NEXT_PUBLIC_PRIVACY_URL`.

El mensaje del formulario es opcional (nombre y email bastan); si se escribe, mínimo 10 caracteres. No se promete tiempo de respuesta en ninguna parte: un test lo vigila.

## Verification

```sh
node --test tests/contact.test.mjs
npx tsx --test tests/*.test.ts
./node_modules/.bin/tsc --noEmit
npm run build
```

Tests use a mocked transport: they do not contact Resend or send email. The `.mjs` server module has a colocated `.d.mts` declaration for TypeScript callers without enabling JavaScript project-wide.

## Before production

- Configure Resend account credentials and a verified sending domain outside this repository; DNS and deployment changes require authorization.
- Put `/api/contact` behind a production rate-limiting/abuse-control gate at the hosting edge. This implementation does not claim distributed rate limiting. Origin checks and a honeypot are defense-in-depth, not authentication or bot protection.
- Verify the hosting proxy preserves the public request URL origin. The endpoint rejects absent or mismatched Origin headers.
- Run an authorized end-to-end email check and browser accessibility/mobile QA. No live email delivery has been verified locally.

An accepted response means Resend returned an email ID; it does not guarantee inbox delivery. Timeouts have an uncertain delivery outcome, and manually retrying may create duplicates. There is no automatic retry. No lead database or sensitive application logging is added; Resend and hosting retention must be reviewed for production data handling. Submitted details are used to respond to the inquiry, not to enroll visitors in marketing.

API reference: https://resend.com/docs/api-reference/emails/send-email
