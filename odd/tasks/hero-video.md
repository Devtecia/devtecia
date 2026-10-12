# Feature: hero-video

## Objective and scope
Integrate the supplied metallic hero animation, replacing the conceptual diagram without redesigning other sections. Preserve Spanish UI, existing user changes and deferred Resend activation.

## Authorized surfaces
`app/components/home-sections.tsx`, `app/components/hero-media.tsx`, `app/globals.css`, `app/layout.tsx`, `public/videos/devtecia-hero-poster.jpg`, `tests/hero-media.test.ts`, this document.

## Acceptance
Responsive editorial hero; headline/subheadline at most 680px; installed skill type scale, text gradient, entrance ease and reduced motion. Manrope replaces Inter. Media has a stable poster, pause control, guarded playback and no video source before motion preference permits it. Failure remains readable.

## Tasks
- [ ] T1 Integrate media and scoped hero corrections. Route: delegated (reading prepares multiple nontrivial writes). Static visual changes have no meaningful deterministic RED; media policy tests will observe RED where runnable. Commit pending parent approval because current files contain unrelated uncommitted work.
- [ ] T2 Verify focused media/contact tests, TypeScript, production build and structural readback. Route: delegated (execution checks). Browser QA is parent-owned. Commit pending parent approval.

## Delivery
Forecast 250–350 authored lines. Strategy: ask-on-risk. Branch: feat/hero-video. No publication authorized. RDD on, global; parent owns native lifecycle. No work-unit commit until exact staging strategy protects existing changes.

## Progress
Initial document created before source writes. Checks pending. Next: media tests and implementation.

### Implementation and checks
- T1 implemented: server hero now uses isolated client media; real frame extracted at 3 seconds; no initial SSR video sources, preference-gated sources, guarded play promises, pause/resume and error poster. Reduced-motion change pauses and unloads video. Stable 16:9 desktop / 4:5 mobile crop; high-contrast flat caption surfaces. Scoped 680px headline, 72/60/48px sizes with matching line heights, gradient and reduced-motion entrance override; installed Manrope import replaces Inter without dependency changes.
- Test-first RED: focused tsx command failed `MODULE_NOT_FOUND` for absent hero-media; GREEN: 3/3 policy/SSR tests pass. Initial sandbox socket failure was rerun with approval. These tests do not prove browser playback.
- `node --test tests/contact.test.mjs`: 6/6 pass. `npx tsc --noEmit`: exit 0. `npm run build`: exit 0, all 9 static pages generated. `git diff --check`: exit 0. Final reduced-motion cleanup refinement awaits rerun below.
- RDD on (global). Assessment returned high/unassessable because preexisting untracked files need an explicit inventory declaration; no review started and mode unchanged. Parent retains canonical continuation.
- T1/T2 stay unchecked until parent browser QA, spot check and work-unit closure. No commits made because the baseline includes extensive unrelated dirty and untracked work.
- Final rerun after reduced-motion unload refinement: focused tests 3/3, TypeScript, production build and diff whitespace check all pass (exit 0). Poster visually inspected; actual supplied image is steel/copper on a light background, with caption surfaces maintaining contrast. Browser QA remains pending.
