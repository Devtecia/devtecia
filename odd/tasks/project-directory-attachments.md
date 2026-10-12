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
- [x] SEC4: Audit hardening before remote apply (edit 0005 in place; not applied remotely). Stale unfinished reservations (>15 min) stop counting toward the five-image limit and a service-only sweep releases them; storage read policy also requires unarchived task and project; the server checks the slot limit before Sharp work and lowers server input pixels to fit the browser output. Route: delegated direct (migration + server action + processor + tests). Known gap kept: deleted tasks/projects orphan storage objects.

## Acceptance and checks
Directory never loads all projects in the shell. Images accepted only as JPEG/PNG/WebP, original at most 20 MiB and bounded pixels; stored WebP at most 1600 pixels on each side and 400 KiB, no retained metadata or animation. Storage and metadata writes are server-only. Signed URLs short-lived and generated after authorization. Task image retry targets the previously saved task.

Runnable deterministic tests follow observed RED → GREEN. Focused tests per unit; full admin tests, TypeScript, build, and diff check at closure. SQL source assertions do not prove live RLS. Remote migration 0005 and live upload remain pending.

## Progress
DIR1: observed missing-module RED; directory/navigation/Marketing fixtures 12/12 GREEN; build and TypeScript build checks passed; diff check passed. Runtime authenticated directory remains untested. Rollback: directory routes, shell navigation and associated tests only. DIR1 committed 7ab65b3. IMG2: missing-module RED observed for processor and attachment ports; 15/15 image/attachment/workflow tests GREEN, build passed. Sharp explicitly pinned 0.35.3 and deduped with Next; actual normalization tests passed, no install-script policy bypass. Read-only npm audit flags Next 16.3.1 critical, Sharp 0.35.3 high (libheif/librsvg), and source-map-js high. Sharp was already baseline transitive and is now explicitly pinned; processing rejects SVG and HEIF. Patched dependency updates require separate parent decision; no broad remediation performed. Reservation locks cap concurrent pending and completed images at five. Abort locks serialize cleanup against ambiguous completion, retaining uncertain slots. Migration 0005 is not remotely applied; live RLS/upload untested. Rollback IMG2: additive image migration/pipeline and saved-task-ID result only.

IMG2 committed 6f16995. IMG3 committed a56fafe. IMG3: browser-header test observed RED (missing dimension helper), then image/attachment tests 13/13 GREEN. Full admin suite 83/83 passed; standalone TypeScript, production build, and diff check passed. Browser source dimensions reject over 40 megapixels before bitmap allocation; generated files only are sent. Editor uploads after task save and preserves saved task ID, retrying only unsuccessful images. Existing gallery loads through user-bound server actions and short-lived URLs. Missing saved task IDs disable further saves to prevent duplicate creation. Rollback IMG3: browser compressor and attachment editor controls only.

Running authored count before this bookkeeping commit: 805 lines excluding generated package-lock. Boundaries: DIR1 7ab65b3, IMG2 6f16995, IMG3 a56fafe. No PRs opened.

## Audit (2026-10-12)
Read-only audit of 6f16995/a56fafe: no critical/high. Medium: permanent stale reservations. Low: archived storage read, orphaned objects on delete, Sharp before slot check with 40 MP input, 20 MiB only browser-enforced, 300 s signed URLs. Pre-existing: team-wide `is_active_member()` authorization; Next 16.3.1 critical advisory. User authorized SEC4.

## SEC4 progress
- RED: `npx tsx --test tests/admin-task-attachments.test.ts tests/admin-task-images.test.ts` 10 pass / 8 fail before implementation (missing `hasSlot` port step, sweep function, storage policy archive checks, `MAX_SERVER_INPUT_PIXELS`). GREEN: same command 18/18.
- Change: `reserve_task_image` counts only `ready or (not abandoned and created_at >= now() - 15 min)` under the existing task `for update`; `complete_task_image` refuses reservations older than 15 minutes so an uncounted row can never become ready. New service-only `release_stale_task_images(uuid)` (security definer, empty search_path, revoked from public/anon/authenticated, granted to service_role) marks expired non-ready rows abandoned, deletes abandoned non-ready rows whose object is gone, and returns keys of remaining objects; the server removes them best-effort and the next sweep deletes their rows. Ready rows are never touched. Storage read policy now joins task and project and requires both unarchived. Server action sweeps then counts `ready or not abandoned` before Sharp; full task returns without processing; `reserve` still enforces the limit. Sharp `limitInputPixels` lowered from 40 MP to 1600*1600*4 (10.24 MP, 4x headroom over browser output); browser preflight keeps 40 MP originals.
- Checks: `npx tsx --test tests/*.test.ts` 116/116; `npx tsc --noEmit` exit 0; `npm run build` exit 0; `git diff --check` clean. Live SQL/RLS and storage sweep behavior untested (no local database runner; source assertions only).
- Residual: an upload still in flight past 15 minutes can leave an orphan object after its row is swept. Known gap: orphaned objects on task/project delete.
- Rollback: 0005 is unapplied; revert this commit to restore the previous migration text.

## Next step
Independent parent audit; authenticated browser compression, real Storage upload, and SQL/RLS integration remain untested. Apply migration 0005 only after explicit remote authorization. No push or deployment performed.
