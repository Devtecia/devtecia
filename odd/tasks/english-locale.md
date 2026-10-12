# English locale

## Objective
Add an English version of the site with a visible language selector, served at `/en` routes so both languages are indexable and shareable.

## Problem and why
The site is Spanish only. International prospects need an English version; the user chose route based locales (`/` and `/en`) over a client toggle for SEO (hreflang, per locale metadata) and shareable links.

## Scope
- Spanish stays at `/` and `/hablemos`; English at `/en` and `/en/hablemos`.
- Typed dictionaries for every visible string (home sections, header, footer, hero media, tagline, AI receipt flow, contact page and form, metadata, OG image).
- Language selector (ES / EN) in the header, desktop and mobile menu, linking to the equivalent page; current locale indicated.
- `<html lang>` per locale, `alternates.languages` (hreflang) on every page, sitemap with both locales.

## Constraints
- Spanish output must stay identical; existing tests keep passing (components default to `es`).
- English copy follows the landing-page-design skill: sentence case, no hyphens in copy, no AI cliches, specific language.
- No commit: shared dirty worktree on `feat/hero-video` with unrelated uncommitted work; user has not asked to commit.

## Tasks
- [x] T1 Locale infrastructure: dictionaries, `Locale` type, per locale root layouts with `lang`, `/en` and `/en/hablemos` routes, metadata alternates, sitemap. Route: delegated (2+ non-trivial files).
- [x] T2 Localize all components and the contact form; language selector in the header. Route: delegated, same writer.
- [x] T3 Tests for English rendering, selector links, hreflang and sitemap; full checks and browser check. Route: delegated writer + parent browser spot check. Parent browser check done.

## Acceptance criteria
- `/en` renders fully in English, `/` unchanged in Spanish; selector switches to the equivalent page.
- `html lang` is `en` on English pages; hreflang alternates present; sitemap lists both locales.
- Tests, `tsc --noEmit`, `git diff --check` and `npm run build` pass.

## Progress
- 2026-10-11: document created; delivery strategy ask-on-risk (forecast above 400 lines due to dictionaries, single cohesive feature, no commit authorized).
- 2026-10-11: T1 and T2 implemented by the delegated writer (no commit, per constraints).
  - Root layout approach: multiple root layouts. `app/(es)/layout.tsx` (lang es) wraps `/` and `/hablemos`; `app/en/layout.tsx` (lang en) wraps `/en` and `/en/hablemos`; no `app/layout.tsx`. Evidence: Next.js route groups docs (multiple root layouts, home route must live inside a group) via context7 `/vercel/next.js`.
  - Spanish OG image moved to `app/(es)/opengraph-image.tsx` (served at `/opengraph-image-35z9gd`; a root level image is not attached once no root layout exists). English OG at `app/en/opengraph-image.tsx`. `icon.svg`, `robots.ts`, `sitemap.ts`, `api/contact` stay at the app root.
  - Contact form and CSS module moved to `app/components/`; shared `home-page.tsx` and `contact-page.tsx` views take `locale`. Dictionaries in `app/i18n/{es,en,index}.ts`, English typed against the Spanish shape. `lib/contact.mjs` localizes replies via `?lang=en`.
  - RED: `tests/i18n.test.ts` failed with `Cannot find module '../app/en/page'`; new contact locale test failed (6 pass, 1 fail).
  - GREEN: `npx tsx --test tests/*.test.ts` 19/19 pass; `node --test tests/contact.test.mjs` 7/7 pass; `npx tsc --noEmit` exit 0; `git diff --check` clean; `npm run build` ok (routes /, /hablemos, /en, /en/hablemos, both OG images, sitemap, robots, icon).
  - Spanish component markup compared before and after with renderToStaticMarkup: identical for every section, hero media and tagline; header differs only by the added language selector.
  - Dev server curl: all four pages 200; `<html lang>` es/es/en/en; canonical plus hreflang es, en, x-default on each; og:locale es_CO / en_US; `/api/contact?lang=en` returns English validation message.
- Next step: parent browser check (selector desktop and mobile menu, focus states, `/en` visual pass), then decide on commit.
- 2026-10-11 parent browser check: `/en` desktop renders English header, selector (EN current) and hero; mobile menu shows selector with ES→`/`, EN→`/en` (aria-current), `html lang="en"`, no horizontal overflow. Observation (pre-existing, not i18n): the open mobile menu does not fully cover page content beneath the CTA.
- Open: custom 404 needs `experimental.globalNotFound` in next.config.mjs (outside writer scope). No commit.
