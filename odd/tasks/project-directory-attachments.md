# Project directory and optimized task attachments

Replace the growing project sidebar with a searchable card directory. Let active team members attach small, private WebP images to tasks without storing original uploads.

## Scope and authorization
Local development only on `admin`. No remote SQL, uploads, deployment, push, or external API calls. Existing Spanish interface and Devtecia styles remain. Attachment deletion, project settings, and archived projects are out of scope.

## Delivery
Three cohesive work units; delegated direct because this feature requires multiple files and new authorization and image-processing logic. Forecast: about 1,200 authored changed lines. Cached strategy: stacked-to-main; no PR creation authorized now. Size is advisory, never a reason to omit tests or clarity. RDD off.

## Tasks
- [x] DIR1: Single Projects navigation, bounded directory query with search/client filters, name/newest order and 24-card pages; preserve existing board and other navigation.
- [ ] IMG2: Add migration 0005, private bucket and metadata, concurrency-safe five-image limit, active session/task authorization, trusted Sharp normalization and saved task IDs.
- [ ] IMG3: Compress images before transport, task gallery and upload controls, precise partial failure and retry behavior without duplicate task creation.

## Acceptance and checks
Directory never loads all projects in the shell. Images accepted only as JPEG/PNG/WebP, original at most 20 MiB and bounded pixels; stored WebP at most 1600 pixels on each side and 400 KiB, no retained metadata or animation. Storage and metadata writes are server-only. Signed URLs short-lived and generated after authorization. Task image retry targets the previously saved task.

Runnable deterministic tests follow observed RED → GREEN. Focused tests per unit; full admin tests, TypeScript, build, and diff check at closure. SQL source assertions do not prove live RLS. Remote migration 0005 and live upload remain pending.

## Progress
DIR1: observed missing-module RED; directory/navigation/Marketing fixtures 12/12 GREEN; build and TypeScript build checks passed; diff check passed. Runtime authenticated directory remains untested. Rollback: directory routes, shell navigation and associated tests only. IMG2 dependency preparation temporarily pinned older Sharp; reconcile to original 0.35.3 before IMG2 closure.

## Next step
Implement trusted image attachment pipeline and migration 0005.
