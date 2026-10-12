# Ensama portfolio case

## Objective
Replace the Megaservices concept with verified public Ensama storefront evidence while keeping Devtecia primary and both case cards compact.

## Scope and constraints
Allowed: home-sections.tsx, scoped globals.css selectors, public/images/ensama-store.png, tests/ensama-case.test.ts, tests/ventex-evidence.test.ts and this document. Public browsing and screenshots only; no cart, checkout, authentication or remote publishing. Preserve existing unrelated work. No commit while the prior intended-untracked inventory remains unresolved.

## Plan
- [x] E1 Verify Ensama public content and capture a representative real screenshot.
- [x] E2 Replace the case and hero proof reference; preserve compact peer hierarchy.
- [x] E3 Run focused tests, contact tests, TypeScript, build and structural/visual checks.
- [x] E4 Apply supplied official ENSAMA logo without increasing portfolio prominence.

## Routing and acceptance
Delegated direct: reading prepares source edits across component, CSS and test files. Acceptance: real verified image, correct public link and meaningful alt; no active Megaservices references; Ventex stays compact and unchanged. Test first with SSR assertions, observed RED then GREEN.

## Forecast and delivery
Forecast: approximately 100 authored changed lines, generated screenshot excluded. Strategy: ask-on-risk. No publishing. Commit pending to avoid mixing existing work.

## Progress and evidence
Skills loaded from exact injected paths. Public Ensama homepage/catalog verified: furniture categories include bathroom, shelving, mirrors and organization. Catalog contains placeholder images and unconfirmed contact fields; used the complete featured grid rather than incomplete catalog rows. Captured actual Chrome content via DevTools Capture screenshot, copied only newly-created www.ensama.store_.png to public/images/ensama-store.png; viewed image confirms content-only 2560×2018 screenshot.

Component replaced concept with compact lazy-loaded next/image, full-size image access, meaningful alt, neutral verified copy and actual Ensama link. Hero proof updated. Removed unused concept CSS; Ventex component remained unchanged. Parent authorized updating obsolete Megaservices test assertions in tests/ventex-evidence.test.ts.

Observed RED: focused new SSR tests failed 2/2 on missing Ensama case and hero reference. Initial sandbox runner IPC EPERM resolved with approved escalation. GREEN: Ensama/Ventex/hero 8/8; contact 6/6; npx tsc --noEmit exit 0; npm run build exit 0; git diff --check exit 0. Screenshot visually verified. Local desktop/mobile rendered check pending because Chrome reported user activity again; stopped rather than interfere.

RDD: no lifecycle/toggle per parent scope. Commit pending due pre-existing intended-untracked inventory; no remote publishing.

## Next step
Parent structural readback and independent checking if applicable; rendered desktop/mobile check when Chrome is available. Resolve existing work inventory before commit.

## Official brand followup
E4 delegated direct: component, scoped CSS and SSR test update. Loaded landing-page-design from the injected exact path and inspected supplied LEEME.txt, SVG and preview. Used ensama-logo-sin-lema.svg (800×416, viewBox -10 10 400 208): outlined symbol and lettering, terracotta #8C6246 and charcoal #20201E, no font dependency. Omitted tagline for small-size readability, preserved original aspect at 128px wide. Screenshot height rules now target only screenshot-link images, not brand artwork. No recoloring or global typography changes.

Observed RED: new SSR logo assertion failed before implementation. GREEN: Ensama/Ventex/hero suite 8/8 after sandbox IPC EPERM required approved escalation; npx tsc --noEmit exit 0; npm run build exit 0; git diff --check exit 0. Supplied logo preview inspected; rendered desktop/mobile visual check remains pending. No commit or remote operation; existing dirty baseline preserved.
