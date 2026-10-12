# Contact page redesign

## Objective
Make `/hablemos` and `/en/hablemos` feel part of the same site and convert better: visual consistency with the home, a left column that builds confidence, a lighter form, and restrained motion.

## Problem and why
Parent review (2026-10-11, landing-page-design skill): the page uses Inter (banned) rendering as a generic fallback while the site uses Manrope; plain text header without logo, site nav or footer; half the viewport empty under the email; heavy dark input borders and off-scale font sizes (15px); success state is a single line of text. A conversion page needs confidence signals next to the form, not decorative noise.

## Scope
- Reuse the real `SiteHeader` (with ES/EN selector) and the site footer; Manrope; tokens from `globals.css`.
- Left column: "what happens next" in 3 steps with a subtle looping progress line, compact Ventex and ENSAMA proof, direct email.
- Form: interest chips (custom software, integrations and AI, Ventex, other) sent to the API, softer focus states, inline validation, designed success state with a send animation.
- Both locales.

## Constraints
- User decision 2026-10-11: no Ventex or ENSAMA content on the contact page (no proof logos; interest chip "Producto SaaS" instead of "Ventex").
- User decision 2026-10-11: the contact page shows only what serves the visitor; client centric copy and interest chips framed as needs (operations, automation, integrations, other); compact footer without portfolio mentions on this page.
- User decision: never show a response time; the copy only suggests we will be in touch soon.
- Motion must not compete with the form: subtle loop on steps; the expressive animation only on success. Reduced motion and no JS show static final states.
- Existing contact tests keep passing; no commit (shared dirty worktree).

## Tasks
- [ ] T4 (user request) Looping "building a platform" animation in the left column (one looping animation on the page) and a back arrow to home, both locales. Route: same writer via message.
- [x] T1 Layout and consistency: header, footer, Manrope, tokens, left column with back link, platform build animation, static steps and direct email. Route: delegated writer.
- [x] T2 Form: interest chips (API + email), focus, inline validation, success state animation. Route: same writer.
- [ ] T3 Tests, checks, parent browser check desktop and mobile in both locales. Writer checks done; parent browser check pending.

## Acceptance criteria
- Both contact pages share header, footer and typography with the home; no response time anywhere.
- Interest selection reaches the email; validation is inline and localized.
- Tests, `tsc --noEmit`, `git diff --check`, `npm run build` pass.

## Progress
- 2026-10-11: document created; user confirmed no response time.
- 2026-10-11 scope changes from the user (relayed by parent): (1) looping platform build graphic plus a back link home; (2) nothing about Ventex or ENSAMA on the contact page; (3) visitor first copy, need based interest chips, compact footer without portfolio links.
- 2026-10-11 T1 and T2 implemented by the delegated writer (no commit).
  - Styles moved from `contact.module.css` (deleted) into `globals.css` with `contact-` and `pb-` prefixes: `tsx --test` cannot import CSS modules, and the rest of the site already uses global classes. Inter is gone; the page inherits Manrope.
  - `SiteHeader` takes `page`; on the contact page nav links point to `/#…` or `/en#…`, the ES/EN selector targets the other contact page, and the CTA carries `aria-current="page"`. Footer extracted to `site-footer.tsx` (home markup unchanged); contact uses `variant="compact"` (logo, email, copyright, back to top). No privacy or terms pages exist, so no legal links were added.
  - `platform-build.tsx` is the only looping animation (design, build, connect, launch, about 9.5 s), IntersectionObserver start and stop with a cycle token, KPI count up, static fully built state without JS or with reduced motion. The steps are static.
  - Form: radio chips (`operations`, `automation`, `integrations`, `other`) whitelisted in `lib/contact.mjs` and included in the email (`Interés: …` or `No indicado`); `noValidate` with inline localized errors on blur and submit (`aria-invalid`, `aria-describedby`, focus on first invalid); success view with card fold and fly, drawn check and a link home.
  - RED: `tests/contact-page.test.ts` failed to load (CSS module import), tsx 19 pass 1 fail; new interest test failed, contact 7 pass 1 fail. Later additions (back link, platform phases) failed 2 of 7 before implementation.
  - GREEN: `npx tsx --test tests/*.test.ts` 27/27; `node --test tests/contact.test.mjs` 8/8; `npx tsc --noEmit` exit 0; `git diff --check` clean (untracked files checked for trailing whitespace: none); `npm run build` ok; dev server `/hablemos`, `/en/hablemos`, `/`, `/en` all 200; `/api/contact?lang=en` with `interest: "ventex"` returns 400.
- Next step: parent browser check desktop and 390 px in both locales (overflow, chip focus, success animation, platform loop).
- 2026-10-11 parent browser check: desktop /hablemos uses Manrope, header + selector, back link, platform loop cycles design→build→connect→launch→reset, inline validation focuses first invalid field with localized messages. 390px iframe check for /hablemos and /en/hablemos: no horizontal overflow, sidebar hidden, no Ventex/ENSAMA text. Parent tweaks: KPI "Entregas a tiempo" 47,2% → 94,7% (reads poorly in a demo); intro 500→300ms and reset 700→600ms to shorten the empty frame. Success animation not exercised in browser (would hit the real contact API). T3 done. No commit.
- 2026-10-11 user request: header on the contact page hides Productos and Casos (filtered in site-header.tsx for page="contact"; home unchanged). RED 7/1 → GREEN tsx 27/27, tsc OK; curl /hablemos and /en/hablemos show only servicios and proceso anchors. No commit.
- 2026-10-11 user request (supersedes the filtered nav): contact page header shows only the back link and the ES/EN selector (`site-header-minimal`), no logo, nav, CTA or menu toggle; back link removed from the left column to avoid duplication. RED 6/1 → GREEN tsx 26/26 (one obsolete #servicios assertion replaced), tsc OK, diff check OK. Browser: desktop aligned to container, 390px no overflow, 44px tap targets. No commit.
