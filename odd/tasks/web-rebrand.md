# Feature: web-rebrand

## Objective
Relaunch devtecia.com with the new brand (Sept 2026 manual) to win custom-software clients and showcase Devtecia's SaaS products.

## Inputs
- Brand: `public/brand/` — Grafito #25292D, Acero #526677, Gris texto #59626A, Niebla #EDF0F2, Blanco #FAFAFA. Inter (SemiBold/Bold titles, Regular body). Logo SVGs (grafito on light, blanco on dark), symbol for favicon.
- Brand voice: clear, close, precise, resolute. Tagline: "Claridad para crear. Tecnología para avanzar." No guaranteed results, no unauthorized testimonials, don't present conceptual images as the team.
- Design reference (refero, Apple ES style): white-space-heavy, alternating #FAFAFA / Niebla bands, no shadows, 28px card radius, pill buttons, 17px body, tight-tracked 700 headlines, single accent reserved for CTAs (use Acero/Grafito instead of Apple blue), product imagery provides color.

## Original baseline
- Next 16 + React 19, single `app/page.tsx` (353 lines, client component) + `app/globals.css` (1148 lines).
- Uses old CSS brand mark, Manrope font, dark photo hero, marquee, orbit manifesto.
- Cases: Ventex (SaaS, ventex.app), Megaservices (ecommerce). CTA only via mailto.

## Proposed information architecture
1. Nav: logo SVG, Servicios, Productos, Casos, Proceso, CTA pill "Hablemos de tu proyecto".
2. Hero: "Software a la medida de tu operación." + sub + 2 CTAs (primary: project enquiry at `/hablemos`; secondary: ver productos). No free offer or scheduled call implied.
3. Problema/solución: dolores (Excel, sistemas que no se hablan, procesos manuales).
4. Servicios (3 cards): Software a medida, Productos SaaS, UX/UI y estrategia.
5. Productos SaaS: Ventex card (finish-colored band, real UI mock).
6. Casos: Megaservices + Ventex with concrete scope, no invented metrics.
7. Proceso: Diagnóstico → Diseño → Construcción → Evolución.
8. FAQ (tiempos, costos, propiedad del código, soporte) — objection handling + SEO.
9. CTA final links to existing `/hablemos`; direct email fallback. Resend activation deferred until the general redesign is ready.
10. Footer.

## Tasks
- [ ] T8 Apply user-supplied Ventex modular identity to its product and case presentation. Route: delegated (brand reading prepares edits in two non-trivial files). Scope: `app/components/home-sections.tsx`, Ventex-specific rules in `app/globals.css`; preserve new source assets and other brands. Acceptance: official new logos, scoped identity colors and supported positioning, accessible responsive layouts; no treating mockups as real product captures. Forecast: 150–300 authored changed lines. Checks: contact regression tests, TypeScript, production build, structural/logo paths check; visual QA where available. Resend deferred.
- [ ] T1 Design tokens + globals.css rewrite (brand palette, Inter only, Apple-style spacing/radii). Route: delegated writer.
- [ ] T2 Split page into section components (server components; client only for nav menu). Route: delegated writer.
- [ ] T3 Copywriting pass (Spanish, neutral-professional per brand voice).
- [ ] T4 Brand assets: logo SVG in nav/footer, favicon from symbol, metadata/OG update, remove Manrope.
- [ ] T5 SEO: metadata, JSON-LD Organization, sitemap/robots.
- [ ] T6 Verify: `npm run build`, visual check desktop/mobile.

## Open decisions
- Contact resolved: `/hablemos` lead form, Resend, destination `info@devtecia.com`. CTA: "Contanos tu proyecto". No promise of a free diagnosis.
- Other SaaS products besides Ventex?

## Progress
- 2026-10-11: Exploration done (repo, brand manual, design reference). No source changes yet.
- 2026-10-11: User prioritizes general website redesign now; Resend configuration and real delivery deferred to the end. T1–T5 execute as one coherent local UI/SEO work unit, with T6 verification. Route: delegated (multiple non-trivial files and reading-to-write). Forecast: approximately 2,000 authored changed lines including replacement of legacy CSS; no artificial line compression. Chain strategy still pending before commit, no publication authorized.
- Website acceptance: new supplied brand logos/palette/Inter; responsive spacious light design inspired by Refero; software enquiries primary and Ventex secondary; concrete services/cases/process/FAQ; no invented metrics, policies or screenshots; working accessible mobile menu and anchor links; local build/type checks and browser QA where available.

## Lead capture work unit
- [ ] T7 Implement `/hablemos`, validated server-side Resend delivery, honest failure states, tests, and setup instructions. Route: delegated; new server logic and multiple non-trivial files require a bounded writer.
- Authorized scope: local code only. No account creation, DNS changes, deployment or live email sends.
- Acceptance: accessible brief form; server validation and bounded request; fixed recipient; no client-exposed secrets; missing configuration/provider failure must not show success.
- Checks: test-first deterministic validation/transport tests; TypeScript; production build; browser QA if available. Real delivery pending verified sender and API key.
- Forecast: approximately 565 authored changed lines for T7; entire rebrand exceeds 400. Delivery strategy: ask-on-risk; chain strategy pending user decision before any work-unit commit. No PR/push authorized.
- Native RDD: on (global); assess completed candidate and follow provider-owned consent/continuations before claiming review completion.
- Next step: complete general redesign browser QA and checking; defer Resend activation until the website is ready.

### T7 implementation evidence (2026-10-11)
- Local implementation ready: `/hablemos`, accessible brief form, `/api/contact`, mocked Resend transport tests and `.env.example`/README setup. Four homepage contact CTAs now link to the form. T1–T6 remain unchanged.
- Test-first RED: `node --test tests/contact.test.mjs` failed with `ERR_MODULE_NOT_FOUND` before the server module existed. GREEN: same command passed all 6 tests after implementation (validation/header injection, missing configuration, provider acceptance/errors, timeout, origin/content-type/body bounds).
- `./node_modules/.bin/tsc --noEmit`: exit 0. `npm run build`: exit 0; static `/hablemos` and dynamic `/api/contact` generated. `git diff --check`: exit 0.
- No dependencies installed. Plain Node tests exercise the server module directly; `.d.mts` keeps TypeScript integration without changing `allowJs: false`. Provider HTTP contract checked against official Resend documentation.
- Forecast approximately 565 authored changed lines; actual implementation 312 additions / 6 deletions, excluding this pre-existing task document and user brand assets (final parent snapshot pending).
- Pending: parent review/spot check, browser desktop/mobile/accessibility QA, chain-strategy decision and work-unit commit. Native review not run by writer. No deployment, DNS/account changes or live email sends performed.
- Production prerequisites: API key, verified sender, edge rate-limiting/abuse control, review of hosting/provider data retention and authorized delivery test. Provider acceptance does not establish inbox delivery; timeout retries can duplicate messages.
- T7 stays unchecked until closure and delivery decisions are resolved.

### General redesign implementation brief
- Strategy: businesses whose operations have outgrown disconnected tools; primary action is a project enquiry, secondary exploration is the existing Ventex product. Conversion is a visit to `/hablemos`, not a guaranteed sale or free consultation.
- Layout: classic hero with an explanatory code-native visual, followed by operational benefits, services, a separate brand tagline moment, Ventex, scoped case studies, process, six practical FAQs and the repeated project CTA.
- Hero: “Software a la medida de tu operación.” Explain custom software and connected processes rather than promise measured savings. Proof signal: existing Ventex and Megaservices projects, linked to their cases.
- Apply the installed `landing-page-design` skill with explicit brand/reference overrides for Inter, brand palette, 28px cards and generous rhythm. No invented testimonials, metrics, guarantees or legal policies. Reduced motion and no-JavaScript readability take precedence over mandatory motion.
- SEO: index the evergreen homepage; canonical belongs on the homepage only, not inherited by the contact route. Organization data uses only the existing name, domain, logo and email.
- Static layout/copy has no meaningful deterministic runnable RED; verify structure, TypeScript/build and unchanged contact tests, then parent browser QA.

### General redesign implementation evidence (2026-10-11)
- T1–T5 implemented locally as one coherent UI/SEO work unit: replaced the legacy photo/marquee/orbit homepage with spacious brand-led sections, Inter, original SVG logos, operational diagram, services, Ventex, scoped cases, four-step process, six FAQs, conversion CTA and footer.
- Homepage and section rendering are server components. Only mobile header disclosure and progressive per-word tagline reveal are client components. Header supports Escape, visible focus and close-on-link. Tagline text is visible without JavaScript; reduced motion disables the enhancement.
- SEO: homepage-only canonical, verified-facts Organization JSON-LD, branded SVG favicon, generated Open Graph image, sitemap without invented modification dates and robots API exclusion. The existing contact page does not inherit the homepage canonical.
- Skill applied: project `landing-page-design`, plus work-unit commits, cognitive document design and Sites presentation guidance. Brand/Refero requirements override generic font/radius restrictions; no fabricated numbers, testimonials, guarantees, privacy policies or cookie dialog were added.
- Test-first exception: static layout, copy and CSS have no meaningful runnable deterministic RED. Regression command `node --test tests/contact.test.mjs` passed all 6 tests after final normalization.
- Final command chain: `node --test tests/contact.test.mjs && ./node_modules/.bin/tsc --noEmit && npm run build && git diff --check` exited 0. Build generated homepage, contact, API, icon, Open Graph, robots and sitemap routes.
- Forecast approximately 2,000 authored changed lines; actual redesign source 790 additions / 1,511 deletions (2,301 total), excluding this task document and prior lead capture files. Legacy CSS replacement accounts for most deletions; no artificial line-budget compression.
- Copy facts retained from the existing repo: Ventex product areas and audience; Megaservices ecommerce scope and URLs. Illustrations are visibly conceptual, not product screenshots or measured customer results. Process and FAQ express an intended working approach, with price, timeline, ownership and support subject to the project proposal.
- Pending T6: parent browser desktop/mobile/accessibility QA and spot check; native checking as applicable. Real Ventex screenshot remains a useful user-supplied upgrade, not a blocker.
- T1–T7 checkboxes stay open until the corresponding acceptance and work-unit closure evidence is complete. Chain-strategy decision precedes any commit. No branch, commit, push, PR, deployment, dependency install or Resend activation performed.

### T8 Ventex identity implementation evidence (2026-10-11)
- Applied the supplied modular identity only to Ventex product/case surfaces. Devtecia and Megaservices styling, source assets and lead capture remain unchanged.
- Authoritative evidence: `public/Ventex-Branding-Modular/Ventex-identidad.md:3–13` defines adaptive management positioning and “Tu negocio, a tu manera.”; `:18–27` provides sector messages and distinguishes positioning from verified functionality; `:29–35` specifies the modular symbol, colors and typography. `tokens.css:2–8` supplies the scoped color/font values.
- Replaced all active `/ventex-logo.svg` references and the fabricated V case mark with official outlined SVGs. Full logo variants have `viewBox="0 0 299 74"`; symbol has `viewBox="0 0 84 74"`. Intrinsic dimensions match those ratios; CSS scales without changing source geometry. Principal violet/graphite logo is used on light, official white logo on violet.
- Product copy now leads with the approved signature and shared management platform, not POS as the product definition. The diagram uses the supplied restaurant, carwash and professional-services contexts without adding specific operational features. Caption explicitly identifies conceptual positioning, not a screenshot or feature catalogue. No mockups were integrated; supplied mockups are conceptual per identity `:45` and are unnecessary for this focused brand update.
- Tokens are scoped under `.ventex-brand`. Violet CTA against brand paper measures 6.46:1 contrast. DejaVu Sans is requested locally with the existing Inter as fallback; no font binary was supplied or installed, while SVG outlined wordmarks preserve exact logo typography.
- Static presentation has no meaningful runnable deterministic RED. Final `node --test tests/contact.test.mjs && ./node_modules/.bin/tsc --noEmit && npm run build && git diff --check` exited 0; 6/6 contact tests passed. All three new logo paths exist; structural checks found zero legacy logo references, old Ventex surface colors or `.case-orbit` rules in active UI.
- T8 delta from pre-task snapshot: `app/components/home-sections.tsx` +32/−23; `app/globals.css` +43/−20, total 118 authored changed lines excluding this evidence. Forecast 150–300 was advisory; no padding or size-driven compression applied.
- Pending: parent visual/keyboard spot check, native checking (currently blocked on intended-untracked schema), delivery strategy and work-unit commit. T8 stays unchecked. No commits, publication, dependencies, source asset edits or Resend changes performed.
