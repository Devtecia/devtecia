# Ventex real evidence

## Objective and scope
Replace conceptual Ventex presentation with authorized real inventory, calendar and dashboard screenshots. All data is user-confirmed test data. Preserve hero and Megaservices.

## Constraints
Spanish UI, scoped Ventex branding, next/image with actual dimensions and responsive sizes, lazy below-fold assets. No invented outcomes, remote operations or unrelated changes.

## Delivery
Route: delegated direct, preparation and multiple non-trivial files. Forecast: under 400 authored lines. Strategy: ask-on-risk. Existing branch feat/hero-video has extensive preexisting untracked redesign; commits pending a safe baseline, never sweep unrelated changes. Native review awaiting parent-owned intended-untracked selection.

## Tasks
- [ ] T1 Integrate real screenshot evidence and regression tests. Route delegated: TSX and CSS changes require analysis. Revised acceptance: Devtecia remains protagonist. Compact split product with bounded inventory image, equal Ventex/Megaservices case cards, small supporting calendar/dashboard thumbnails, accessible full-image links and honest demo labels.
- [ ] T2 Verify focused SSR tests, hero regression, contact tests, TypeScript, production build and whitespace. Route delegated: execution checks. Parent browser QA pending.

## Checks and progress
Observe failing screenshot SSR assertions before implementation. Commands: tsx --test tests/ventex-evidence.test.ts tests/hero-media.test.ts; node --test tests/contact.test.mjs; npx tsc --noEmit; npm run build; git diff --check.

## Next step
Parent browser QA and independent verification, then safe work-unit closure.

## Implementation evidence
T1 revised implementation: compact split product copy and bounded inventory image replace conceptual diagram. Equal peer case cards retain Ventex and Megaservices; calendar/dashboard are supporting thumbnails capped at 128px image height with native full-image links, factual alt text, actual 2560×2018 dimensions and lazy responsive images. Official logo and scoped violet retained; Megaservices and hero preserved. Obsolete Ventex conceptual selectors removed only after reference readback found no remaining consumers.

## Verification evidence
RED: new inventory and case assertions both failed against conceptual markup, while 3 hero tests passed. Initial sandbox tsx IPC refusal was rerun with approval. GREEN: focused screenshot/hero suite 5/5; contact suite 6/6. TypeScript and production build succeeded; all 9 static pages generated. Whitespace check passed. No source-mutating formatter configured or run. Browser QA, independent parent check, native review and safe-baseline commits pending. Tasks remain unchecked until closure; no unrelated changes committed.

## Accepted scope revision
User explicitly requested smaller Ventex images and Devtecia prominence. Previous full-width editorial case superseded. T1 reopened for compact evidence and peer portfolio hierarchy; tests/checks rerun before handoff.

## Revised verification evidence
Hierarchy regression observed RED against dominant editorial layout, then GREEN with all 6 focused screenshot/hero tests. Final npx tsc --noEmit exit 0; npm run build exit 0, 9 static pages; git diff --check exit 0. Previous contact 6/6 remains valid; contact code untouched. No browser validation claimed. User revision preserves Devtecia prominence and contains violet within Ventex surfaces.
