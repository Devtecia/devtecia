# Marketing tracking (Meta + Google Ads)

## Objective
Agency-grade conversion tracking for paid campaigns on Meta (Facebook/Instagram) and Google Ads, on top of the existing consent-gated GA4 + Meta Pixel.

## Problem
- Meta only sees leads through the browser Pixel; ad blockers, iOS and browser restrictions drop a significant share, which weakens campaign optimization.
- Google Ads has no conversion tag, so it cannot attribute or optimize for leads.
- The funnel has no intermediate steps (form start, CTA clicks), so drop-off is invisible.
- No written setup checklist for the accounts side (GA4 key events, Ads linking, Meta domain verification, UTM convention).

## Why
User runs ads on Meta and Google Ads (decision 2026-10-26). Existing base: consent banner (`lib/consent.ts`), one-shot lead marker + `/gracias` (`lib/lead.ts`), attribution with UTM/gclid/fbclid in the lead email (`lib/campaign.ts`, `lib/contact.mjs`).

## Decisions
- Consent applies to server-side events too: Meta CAPI is sent only when the visitor granted measurement consent. CAPI recovers browser losses (blockers, iOS), not visitors who rejected.
- Pixel and CAPI share one `event_id` per lead so Meta deduplicates them; Google Ads uses the same id as `transaction_id`.
- Personal data sent to ad platforms is SHA-256 hashed after normalization; raw email/phone never leave the server, and never stored unhashed in browser storage.
- Server-side sends never delay or break the form response.

## Tasks
- [x] T1 — Meta Conversions API: server Lead with shared `event_id`, fbp/fbc, hashed email/phone, consent flag, test event code, env vars (route: delegated writer; trigger: 2+ non-trivial files)
- [ ] T2 — Google Ads conversion tag + enhanced conversions on `/gracias`, `transaction_id` = `event_id`, optional WhatsApp secondary conversion (route: delegated writer)
- [ ] T3 — Funnel micro-events in GA4: `form_start`, `cta_click` with location (hero, header, sticky, closing) (route: delegated writer)
- [ ] T4 — Setup checklist doc: env vars, GA4 key events, GA4↔Ads link, Meta domain verification, UTM convention, how to verify (Test Events, DebugView, Tag Assistant) (route: inline or writer)

## Checks
- `npx tsx --test tests/*.test.ts`
- `node --test tests/contact.test.mjs`
- `npx tsc --noEmit`
- `npm run build`
- Browser check with test IDs and mocked network.

## Progress
- Base: `origin/main` at `2176e2b`.
- T1 (delegated writer, partial): CAPI implemented in `lib/meta-capi.mjs`, wired in `lib/contact.mjs` (sent only after the email is accepted; via Next `after` in the route, else awaited with a 2 s cap), client sends `eventId`/`consent`/`fbp`/`fbc`/`pageUrl`, marker carries `eventId`, Pixel Lead passes `{ eventID }`. Graph API default `v26.0` (Meta changelog, released 2026-07-29), overridable via `META_GRAPH_VERSION`. RED observed (6 contact + 4 tsx failures), then GREEN: tsx 159/159, contact 19/19. Blocked: `npx tsc --noEmit` fails (`route.ts` passes 5 args) until `lib/contact.d.mts` (outside the allowed surface) gains the `schedule` param and Meta env keys. Build not run yet. Commit pending.
- Decision taken in T1: a body without a valid `eventId` sends no CAPI event (dedup with the Pixel would be impossible).
- T1 completed by parent: `lib/contact.d.mts` gained the `schedule` param and Meta env keys (mechanical, outside writer surface). Checks: tsx 159/159, contact 19/19, tsc clean, build clean. Browser (Chrome, test IDs, mocked /api/contact): body carried eventId, consent=granted, fbc built from fbclid, pageUrl without hash; on /gracias Meta Lead hit carried eid == eventId and GA generate_lead event_id == eventId (dedup ready). Server CAPI payload covered by unit tests only (no real token).
