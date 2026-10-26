# Tracking consent banner

## Objective
Load Meta Pixel and GA4 only after the visitor explicitly accepts measurement cookies.

## Problem
`app/components/tracking.tsx` injects Meta Pixel and GA4 as soon as `NEXT_PUBLIC_META_PIXEL_ID` / `NEXT_PUBLIC_GA_ID` are set, with no notice or choice.

## Why
Conservative reading of Colombian Ley 1581 (prior, explicit authorization). Reference model: AITT landing `medicion.js` (opt-in banner, equal-weight Accept/Reject, reopen link in footer). Legal interpretation pending validation by whoever owns legal.

## Scope
- Banner renders only when at least one tracking ID is configured.
- Accept and Reject buttons with equal visual weight; choice persisted in `localStorage` (try/catch, fails closed = no tracking).
- Scripts are injected client-side only after acceptance; no tracking markup in the server HTML.
- Footer "Cookies" control reopens the banner; rejecting after accepting stops future loads (reload required to unload already-loaded scripts).
- ES/EN copy in i18n; link to `NEXT_PUBLIC_PRIVACY_URL` when set.
- `trackLead` / `trackWhatsApp` stay no-ops without consent (they already no-op when `fbq`/`gtag` are absent).

## Constraints
- Do not change the 4 form options or their texts; do not promise response times (existing tests).
- Do not commit `AGENTS.md` / `CLAUDE.md` created by `next dev`.

## Tasks
- [x] T1 — Consent-gated tracking + banner + footer reopen + i18n + tests + README (route: delegated writer; trigger: 2+ non-trivial files)

## Checks
- `npx tsx --test tests/*.test.ts`
- `node --test tests/contact.test.mjs`
- `npx tsc --noEmit`
- `npm run build`

## Progress
- Base: branch `claude/landing-campanas`, patch applied as `e19af40`; 134/134 + 11/11 tests, tsc and build green.
- T1 implemented (delegated writer): `lib/consent.ts` (pure consent logic + idempotent `injectTracking`), client `Tracking` banner fed copy by the layouts, footer `ConsentSettingsButton`, `consent` i18n block (ES/EN), banner CSS, README note, `tests/consent.test.ts`; `tests/campaign.test.ts` now asserts no tracking markup in server HTML. Checks: 140/140 tsx tests, 11/11 contact tests, tsc clean, build clean. Work-unit commit pending (parent).
