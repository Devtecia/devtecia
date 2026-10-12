# AI integrations

## Objective and scope
Make Devtecia's AI integration offering explicit and show the deployed receipt-reading bot capability without disclosing a private customer. Preserve the compact portfolio, hero and brands. Allowed files: home-sections.tsx, globals.css, tests/ai-integrations.test.ts and this document.

## Constraints and acceptance
Spanish site copy; no invented channel, vendor, accuracy, savings or implementation details. The illustration is code-native, clearly labeled illustrative with fictitious data, not a client screenshot. Semantic figure, mobile stacked flow, no new dependency or animation. Forecast under 400 authored lines; delivery ask-on-risk. Existing dirty work must remain uncommitted.

## Tasks
- [x] AI01: Add explicit service offering and compact confidential example. Route: delegated; preparation and multiple non-trivial files. Checks: meaningful SSR RED then GREEN, confidentiality and truthful labeling.
- [x] AI02: Verify focused regressions, contact, types and build. Route: delegated execution. Record exact results and limitations.

## Verification and delivery
Observed RED: two SSR assertions failed for missing AI offering and illustration. GREEN: focused tsx suite 10/10 passed; contact node suite 6/6 passed; npx tsc --noEmit passed; npm run build passed (9 routes); git diff --check passed. Initial sandbox tsx IPC EPERM resolved with authorized elevated runner. Browser desktop/mobile visual inspection pending. RDD mode on; existing review pending, no new lifecycle started by this worker. No commit or publishing authorized in this dirty shared worktree.

## Next step
Parent structural spot check and browser visual inspection. Source edits are limited to service/benefit copy, a compact illustrative receipt flow and its CSS; no commit created due to preexisting dirty shared worktree.

## Iteration 2026-10-11: receipt flow redesign and placement
- [x] Move the AI example inside service 02 so the proof sits beside the claim it supports (landing skill A4). Route: inline.
- [x] Redesign the graphic as a client component (`app/components/ai-receipt-flow.tsx`): realistic receipt, numbered highlights mapped 1:1 to extracted fields, reader node, scan and staggered output reveal via IntersectionObserver; static and fully visible without JS or with reduced motion.
Evidence: RED 2 new SSR tests failed (placement, field mapping); GREEN all suites 12/12, `tsc --noEmit` OK, `git diff --check` OK. Browser check desktop 1440 and narrow width: no horizontal overflow, animation triggers on scroll. Build not rerun (dev server active). No commit: shared dirty worktree.

## Iteration 2026-10-11: looping motion graphic
- [x] Remove "Recreación ilustrativa · Datos ficticios" caption (user request); honesty stays in the copy paragraph. Figure labelled via aria-label.
- [x] Looping choreography (~9.3s): receipt drops in → scan frame + beam → fields highlighted → chips fly receipt → IA node (orbit + glow) → output rows (skeletons until landing) → "Listo" → reset. Phase timeline above. Runs only while in view; static final state without JS or with reduced motion.
Evidence: RED 2 tests failed (caption, timeline/chips); GREEN 13/13, tsc OK, diff check OK. Browser: phase log intro→scan→detect→extract→done→reset→intro; frozen frame confirms chip paths on desktop and narrow (no horizontal overflow). No commit.
