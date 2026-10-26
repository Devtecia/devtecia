# Mobile sticky CTA

## Objective
On phones, keep a call to action always reachable that takes the visitor to the inline contact form.

## Problem
Campaign traffic arrives mostly on mobile; once the visitor scrolls past the hero CTA, the form is far away.

## Why
Reference model: AITT landing (`landing-c1.js:331-338`, `landing-c1.css:1234-1261`). Bar fixed at the bottom on narrow screens, shown only when neither the hero nor the form is visible, and hidden while the cookie banner is open.

## Scope
- Bottom-fixed CTA bar only at mobile widths; links to the existing contact form anchor.
- Hidden while the hero CTA or the contact form is in view, and while the consent banner is open (the banner takes priority).
- Reserves its height at the bottom of the page while visible so it never covers the last content or the form submit.
- Click tracked as a CTA event if the existing analytics module already has a fitting event; otherwise no new event.
- ES/EN copy reuses existing CTA wording where possible.

## Constraints
- Do not change the 4 form options or their texts; do not promise response times.
- Do not commit `AGENTS.md` / `CLAUDE.md` created by `next dev`.

## Tasks
- [x] T1 — Sticky CTA component + visibility logic + CSS + i18n + tests (route: delegated writer; trigger: 2+ non-trivial files) — implemented and checked; commit pending

## Checks
- `npx tsx --test tests/*.test.ts`
- `node --test tests/contact.test.mjs`
- `npx tsc --noEmit`
- `npm run build`
- Real browser check at 390px width.

## Progress
- Base: `claude/landing-campanas` == `origin/main` at `b2755ca`.
- T1 implemented (uncommitted): `lib/sticky-cta.ts` (pure `showStickyCta`, selectors, `--sticky-offset`), `app/components/sticky-cta.tsx` (IntersectionObserver on `.hero .hero-actions` and `#hablemos`, MutationObserver on `<html data-consent-open>`), `lib/consent.ts` adds `CONSENT_OPEN_ATTR`, `tracking.tsx` sets/removes it with the offset, `globals.css` combines offsets with `max()` and shows the bar only at <=600px with safe-area padding, `home-page.tsx` renders it for ES and EN. Copy reuses `hero.cta` (no new i18n keys). No click event: analytics.ts has no fitting CTA event.
- Test-first: `tests/sticky-cta.test.ts` observed failing (module missing) before implementation, then 4/4 passing.
- Checks: `npx tsx --test tests/*.test.ts` 144/144; `node --test tests/contact.test.mjs` 11/11; `npx tsc --noEmit` OK; `npm run build` OK. Real browser check at 390px (iframe in Chrome, test IDs): bar hidden at hero, at form and while consent banner open; shown mid-page (77px, offset reserved); footer clear at page end; link scrolls to #hablemos.
- Next: browser check at 390px, then work-unit commit.
