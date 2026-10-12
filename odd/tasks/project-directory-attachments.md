# Project directory and optimized task attachments

Replace the growing project sidebar with a searchable card directory. Let active team members attach small, private WebP images to tasks without storing original uploads.

## Scope and authorization
Local development only on `admin`. No remote SQL, uploads, deployment, push, or external API calls. Existing Spanish interface and Devtecia styles remain. Attachment deletion, project settings, and archived projects are out of scope.

## Delivery
Three cohesive work units; delegated direct because this feature requires multiple files and new authorization and image-processing logic. Forecast: about 1,200 authored changed lines. Cached strategy: stacked-to-main; no PR creation authorized now. Size is advisory, never a reason to omit tests or clarity. RDD off.

## Tasks
- [x] DIR1: Single Projects navigation, bounded directory query with search/client filters, name/newest order and 24-card pages; preserve existing board and other navigation.
- [x] IMG2: Add migration 0005, private bucket and metadata, concurrency-safe five-image limit, active session/task authorization, trusted Sharp normalization and saved task IDs.
- [x] IMG3: Compress images before transport, task gallery and upload controls, precise partial failure and retry behavior without duplicate task creation.

## Acceptance and checks
Directory never loads all projects in the shell. Images accepted only as JPEG/PNG/WebP, original at most 20 MiB and bounded pixels; stored WebP at most 1600 pixels on each side and 400 KiB, no retained metadata or animation. Storage and metadata writes are server-only. Signed URLs short-lived and generated after authorization. Task image retry targets the previously saved task.

Runnable deterministic tests follow observed RED → GREEN. Focused tests per unit; full admin tests, TypeScript, build, and diff check at closure. SQL source assertions do not prove live RLS. Remote migration 0005 and live upload remain pending.

## Progress
DIR1: observed missing-module RED; directory/navigation/Marketing fixtures 12/12 GREEN; build and TypeScript build checks passed; diff check passed. Runtime authenticated directory remains untested. Rollback: directory routes, shell navigation and associated tests only. DIR1 committed 7ab65b3. IMG2: missing-module RED observed for processor and attachment ports; 15/15 image/attachment/workflow tests GREEN, build passed. Sharp explicitly pinned 0.35.3 and deduped with Next; actual normalization tests passed, no install-script policy bypass. Read-only npm audit flags Next 16.3.1 critical, Sharp 0.35.3 high (libheif/librsvg), and source-map-js high. Sharp was already baseline transitive and is now explicitly pinned; processing rejects SVG and HEIF. Patched dependency updates require separate parent decision; no broad remediation performed. Reservation locks cap concurrent pending and completed images at five. Abort locks serialize cleanup against ambiguous completion, retaining uncertain slots. Migration 0005 is not remotely applied; live RLS/upload untested. Rollback IMG2: additive image migration/pipeline and saved-task-ID result only.

IMG2 committed 6f16995. IMG3 committed a56fafe. IMG3: browser-header test observed RED (missing dimension helper), then image/attachment tests 13/13 GREEN. Full admin suite 83/83 passed; standalone TypeScript, production build, and diff check passed. Browser source dimensions reject over 40 megapixels before bitmap allocation; generated files only are sent. Editor uploads after task save and preserves saved task ID, retrying only unsuccessful images. Existing gallery loads through user-bound server actions and short-lived URLs. Missing saved task IDs disable further saves to prevent duplicate creation. Rollback IMG3: browser compressor and attachment editor controls only.

Running authored count before this bookkeeping commit: 805 lines excluding generated package-lock. Boundaries: DIR1 7ab65b3, IMG2 6f16995, IMG3 a56fafe. No PRs opened.

## Next step
Independent parent audit; authenticated browser compression, real Storage upload, and SQL/RLS integration remain untested. Apply migration 0005 only after explicit remote authorization. No push or deployment performed.
