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

## Verification

```sh
node --test tests/contact.test.mjs
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
