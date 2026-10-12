# Admin Marketing workspace

## Objective
Integrate the shared authenticated Marketing strategy workflow from `market-sell` into Devtecia `/admin`, preserving Devtecia's existing UI system.

## Problem and scope
The dashboard currently has no Marketing route or navigation item. The reference workspace supports clients and brands, audience definition, campaign briefs, generated proposal versions, review decisions, and results. The first implementation will provide a usable shared workspace for the small Devtecia team, not a visual-only sidebar stub.

## Decisions and constraints
- All current team members are admins; every active team account may view, create, edit, generate, and review Marketing records. Marketing data is shared rather than client-isolated.
- Use additive Supabase migrations and active-profile checks; do not copy the reference's owner-rooted RLS.
- Preserve Devtecia admin styles and Spanish copy. Do not import market-sell's design system.
- Proposal generation follows the reference's Gemini provider using optional `GEMINI_API_KEY` and `GEMINI_MODEL`; if no API key exists, present a clear unavailable state and do not fabricate generated output. Never make external API calls in tests.
- Existing reference seeds client/brand data; determine a safe initial empty-state/onboarding path within the first slice.
- Delivery strategy: stacked-to-main, per user direction that all work is sent to main. Forecast: approximately 1,100–1,700 authored changed lines, excluding generated files; split into coherent work-unit commits targeting main.

## Tasks
- [x] MKT-1 (delegated): Build shared Marketing data foundation and client/brand workspace with RLS, admin navigation, validation, and tests. Acceptance: active team users can list/create/edit clients and brands; inactive users cannot access Marketing data; empty state leads into client setup. Checks: `npx tsx --test tests/admin-marketing*.test.ts` (6 passed), `npx tsx --test tests/admin-*.test.ts` (40 passed), `npm run build` (passed), `git diff --check` (passed). Migration was validated by deterministic source tests only; it was not applied to Supabase. Commit: `1a5cefd`.
- [x] MKT-2 (delegated): Add audience and campaign brief editing with validation, persistence, and tests. Acceptance: each brand can maintain its audience and brief; all active team users share updates; malformed and cross-brand requests are rejected. Checks: `npx tsx --test tests/admin-marketing*.test.ts` (11 passed), `npx tsx --test tests/admin-*.test.ts` (45 passed), `npm run build` (passed), `git diff --check` (passed). Migration was validated by deterministic source tests only; it was not applied to Supabase. Commit: `a83e54f`.
- [ ] MKT-3 (delegated): Add Gemini proposal generation, version history, draft/submitted/approved/revision/archive transitions, and review history. Acceptance: generation is schema-validated and unavailable without configured credentials; transitions are persisted and auditable; tests use a fake provider. Checks: focused tests, full admin tests, build. Commit: pending.

## Progress and next step
MKT-1 (`1a5cefd`) and MKT-2 (`a83e54f`) implementation and local checks are complete; active-profile policies and parent-child scope constraints are covered by source-level tests, and no Supabase mutation was performed. MKT-2 adds editable shared audience segments and one campaign brief per audience. Receipt-driven development is off globally, so no native review assessment was run for this work unit. User selected stacked-to-main; keep work-unit commits on this feature branch targeting main. MKT-3 remains next.
