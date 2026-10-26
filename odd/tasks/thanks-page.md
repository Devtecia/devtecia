# Thanks page

## Objective
After a successful contact form submission, send the visitor to a dedicated thanks page (`/gracias`, `/en/thanks`) and count the lead there exactly once.

## Problem
Today the form swaps to an inline success panel (`app/components/contact-form.tsx`) and fires `trackLead` in place. There is no URL that marks a conversion, which ad platforms and analytics use for URL-based goals, and no room for next steps.

## Why
Reference model: AITT landing `gracias.html` + `gracias.js`. The lead is flagged in `sessionStorage` on a real submission and consumed once on the thanks page, so reloads or direct visits never count a lead.

## Scope
- New pages `/gracias` (ES) and `/en/thanks` (EN), not indexed (`robots: noindex`), excluded from the sitemap if one exists.
- On HTTP 202 from `/api/contact`, store a one-shot lead marker (angle, interest) in `sessionStorage` and navigate to the locale's thanks page, preserving UTM/attribution query params.
- Thanks page consumes the marker once and fires `trackLead` (respecting consent: no-op without loaded trackers; must wait for consent-gated scripts to be injected first when consent is already granted).
- Direct visit or reload: page renders normally, no lead fired.
- Page content: heading focused for screen readers, short copy, link home, optional WhatsApp link if configured. No response-time promise.
- Fallback: if navigation is impossible (sessionStorage blocked), still navigate; the lead is simply not tracked.
- Inline success panel removed or kept only as a no-JS fallback (writer decides with evidence).

## Constraints
- Do not change the 4 form options or their texts; do not promise response times.
- Do not commit `AGENTS.md` / `CLAUDE.md` created by `next dev`.

## Tasks
- [x] T1 — Thanks pages + one-shot lead marker + redirect + i18n + tests (route: delegated writer; trigger: 2+ non-trivial files) — implemented and checked; browser check done

## Checks
- `npx tsx --test tests/*.test.ts`
- `node --test tests/contact.test.mjs`
- `npx tsc --noEmit`
- `npm run build`
- Real browser check: submit (mocked API) → thanks page, lead fired once; reload → no lead.

## Progress
- Base: `claude/landing-campanas` == `origin/main` at `b401bba`.
- T1 implemented (uncommitted). Pure logic in `lib/lead.ts` (marker encode/decode with 30 min TTL and allowlisted angle/interest, `markLead`, `consumeLead`, `settleLead`, `thanksUrl`). Routes `app/(es)/gracias`, `app/en/thanks` with `robots: { index: false, follow: true }`; not in the sitemap; not disallowed in robots.txt (crawlers must be able to read noindex). `PageKey` gains `thanks`; minimal header + compact footer.
- Form: on 202 it marks the lead and `location.assign`s the thanks URL with the current query; stays pending while navigating; a `pageshow` (bfcache) restore unlocks it. Inline success panel removed: the form already requires JS (no `action`), so it was never a no-JS fallback; its send/check animation moved to the thanks page.
- Thanks page: `ThanksLead` focuses the h1, always spends the marker, and with granted consent calls the idempotent `injectTracking` before `trackLead` (its effect runs before the layout's Tracking effect).
- Test-first: `tests/lead.test.ts` and `tests/thanks-page.test.ts` written first and observed failing (modules missing), then green.
- Checks: `npx tsx --test tests/*.test.ts` 155/155; `node --test tests/contact.test.mjs` 11/11; `npx tsc --noEmit` exit 0; `npm run build` exit 0 with `/gracias` and `/en/thanks` static.
- Browser check (Chrome, test IDs, mocked /api/contact 202): /hablemos?utm_source=meta&a=excel → /gracias with query kept; h1 focused; robots noindex; marker consumed; Meta hits PageView+Lead once, GA generate_lead once; reload → PageView only, no Lead; consent denied → no scripts, marker still consumed.
