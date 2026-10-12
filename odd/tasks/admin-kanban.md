# Admin kanban

## Objective
Team administration module at `/admin` (same in Spanish and English): a kanban work board with its own WordPress-like login, adapted from the reference "Orbit Work OS" (github.com/jcamilodev1/canva-clickup).

## Problem and why
The team needs an internal place to organize projects and tasks. The reference repo has the product and design but no authentication and a separate Python backend, so it must be rebuilt inside this Next.js app.

## Decisions
- Route `/admin`, not localized (single Spanish UI, as the reference). Branch `admin`.
- Data and auth: Supabase (user choice 2026-10-11). Email and password via Supabase Auth, public sign up disabled; admins create users from `/admin` (WordPress-like). Session cookies with `@supabase/ssr`; Next proxy guards `/admin/*` except `/admin/login`.
- Row level security on every table; privileged actions (create users) only server side with the service role key, never exposed to the client.
- Business rules from the reference `services.py` move into SQL functions (atomic task move and reorder, per project task numbers, optimistic locking with `version`, status removal remaps tasks).
- Design taken from the reference (dark ink sidebar, lime accent, paper background, offset shadow buttons), scoped under the admin layout so it does not collide with the landing styles. Admin pages are `noindex` and excluded from the sitemap.

## Scope
MVP:
- Login, logout, session guard; profiles with role admin or member; admin user management (invite or create, deactivate).
- Projects: create, edit (name, key, client, color, description, members), archive.
- Board: columns per project (statuses editor: rename, color, reorder, add, delete with remap), drag and drop between and within columns, cards with priority, assignee, due date, labels.
- Task drawer: title, description, status, assignee, priority, due date, estimate, labels; archive and delete.
- Search and priority filter.
Later: my work view, reports and focus score, checklist, subtasks, dependencies, comments and activity.

## Constraints
- Landing and contact pages must stay unchanged.
- No secrets in the repo or chat; keys only in `.env.local` and Vercel env vars.
- Copy rules from the landing skill apply to new UI copy.

## Tasks
- [x] T0 Supabase project created by the user; env vars set (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`). Done 2026-10-11; URL corrected by the parent and connectivity verified (signups disabled).
- [x] T1 Schema and SQL migrations: profiles, projects, project_members, tasks, RLS policies, SQL functions (create task with number, move task, update with version check, remove status). Route: delegated writer. Commit 465f3bc. Applied remotely 2026-10-11; all four tables verified.
- [x] T2 Auth: Supabase SSR clients, proxy guard, `/admin/login` page, logout, first admin bootstrap. Route: delegated writer. Commit 6dd1662. Existing user promoted to active admin; live sign-in not yet verified.
- [x] T3 Admin shell: layout, sidebar with projects, topbar with search, design tokens scoped to admin. Route: delegated writer. Commit ce7f6d4. Includes a minimal create project form (not assigned to any other task). Visual check of the signed in shell pending.
- [x] T4 Board: columns, cards, drag and drop, priority filter, create task.
- [ ] T5 Task drawer and project settings with statuses editor.
- [ ] T6 User management for admins.
- [ ] T7 Tests, checks, browser verification, review.

## Acceptance criteria
- Visiting `/admin` without session redirects to `/admin/login`; wrong password shows an inline error; logout clears the session.
- A member can manage projects and tasks; only admins manage users.
- Board drag and drop persists order and status; concurrent stale edits get a clear conflict message.
- Tests, `tsc --noEmit`, `npm run build` pass; landing unchanged.

## Progress
- 2026-10-11: branch `admin` created from main 8d42920; reference repo mapped; Supabase chosen.
- 2026-10-11 T1 to T3 (delegated writer):
  - RED observed first: `Cannot find module` for `lib/admin/redirect`, `lib/admin/initials`, `app/admin/login/login-form`, `app/admin/(app)/admin-sidebar`, `lib/admin/project-input`, and ENOENT for the migration file.
  - SQL verified locally in PGlite with a stubbed `auth` schema (not real Supabase): migration runs twice cleanly; numbering 1..3; label normalization; move before, between and to end; stale version raises 40001; unknown field and invalid status raise 22023 and roll back `next_number`; `remove_status` remaps to the first column and refuses the last; members cannot change their role (42501) or other profiles; inactive users see nothing; anon has no table access.
  - Checks: `npx tsx --test tests/*.test.ts` 52/52; `node --test tests/contact.test.mjs` 8/8; `npx tsc --noEmit` exit 0; `git diff --check` clean; `npm run build` ok (admin routes dynamic, Proxy listed).
  - Dev server: `/admin`, `/admin/users`, `/admin/projects/new` 307 to `/admin/login` (with `next` for deep links); `/admin/login` 200 with noindex and title "Ingresar | Devtecia Admin"; `/`, `/en`, `/hablemos` 200; landing CSS has no admin rules.
  - Service role key referenced only in `lib/supabase/admin.ts`, `scripts/create-admin.mjs` and `.env.example` (empty).
  - Initially pending: remote migration and admin profile; completed in the follow-up entry below. Remaining: live login and shell checks at 360px and desktop.
- 2026-10-11 remote migration follow-up: user ran `supabase/migrations/0001_admin_kanban.sql` in the configured Supabase SQL Editor. Verified the `profiles`, `projects`, `project_members`, and `tasks` tables are available. Existing Auth user was present with an active member profile; ran `node scripts/create-admin.mjs ...` without `--reset-password`, which upserts the profile only and does not modify Auth credentials. Read-after-write confirmed role `admin`, active `true`. Password unchanged. Live login and shell verification remain pending.
- Next step: user signs in at `/admin/login`; verify live login/shell, then continue T4 board.

## Functional board continuation (2026-10-12)
Authorized scope: T4 and the editable task drawer portion of T5 only. No project settings, status editor, task archive/delete, remote database changes, or deployment in this unit.

Delivery strategy: stacked-to-main (cached user choice), no push or PR in this unit. Forecast: approximately 900 authored changed lines; cohesive slices are task validation/workflow with tests, then board/forms with tests. The 400 line heuristic is advisory, not a reason to compress code or omit checks.

- [x] T4a Validate task fields and authorize create/update/move against the user-bound database; preserve optimistic locking and map safe errors. Route: delegated direct (multi-file logic and write preparation).
- [x] T4b Render persisted cards, search/priority filter, native drag/drop and keyboard/touch move/reorder using full column ordering. Route: delegated direct (multi-file UI).
- [x] T5a Accessible create/edit task dialog for all fields, pending and error states, refresh layout counts after success. Route: delegated direct (multi-file UI).
- [x] T7a Focused RED then GREEN tests, admin regression, typecheck, build, diff checks; independent verification and parent focused-test spot check passed. Local commits recorded below; authenticated browser checks remain pending.

Acceptance checks: malformed ids/versions/fields rejected server side; active session/project/status/assignee checked before RPC; stale versions friendly; no silently empty database failures; filtered reorder uses all column tasks; focus/escape/restore and touch controls; actual persistence only through existing RPCs. No network in tests.
Verification commands: cached tsx runner for tests/admin-task-input.test.ts, tests/admin-task-workflow.test.ts, tests/admin-kanban-board.test.ts; admin-*.test.ts regression; npx tsc --noEmit; npm run build; git diff --check. RDD off, no native review.
Remaining original scope: project/status settings, archive/delete, remaining T6 user-management scope, authenticated browser verification. Existing invitations were implemented separately; T6 is not reclassified complete here.

### Functional board verification
- RED: focused runner initially failed all 3 test modules with missing task-input/task-workflow/task-board before implementation. Sandbox IPC EPERM required approved escalated local runner; not counted as behavioral RED.
- GREEN: focused tests 11/11; admin regression 68/68; npx tsc --noEmit exit 0; npm run build exit 0 (dynamic /admin/projects/[key]); git diff --check clean.
- Existing RPCs now receive validated user-bound create/update/move calls. Task fields, inactive-assignee rejection, full-column reorder anchors, stale versions, friendly database and transport errors covered by fake-port tests. Native dialog/controls covered structurally, not browser interaction tests.
- Full task pagination prevents database row limits from silently truncating column reorder anchors; label length capped at SQL's 40 characters to avoid silent truncation.
- Runtime harness: no authenticated browser or hosted database mutation performed; those checks remain pending with parent. No new schema or dependencies, landing unchanged. RDD off.
- Work-unit commit identities: domain validation/workflow and tests `2820038`; functional board integration committed next, SHA recorded by follow-up evidence. Automated T7a is complete; original T7 remains partial until authenticated browser verification.
- Rollback: remove task-action/workflow/input/board/form modules and tests, restore project page/data loading and appended task CSS only; unrelated admin, Marketing and Supabase configuration unchanged.
- Next step: authenticated browser verification and explicit remote delivery authorization; project/status settings and archive/delete remain T5 scope.

### Domain work-unit checkpoint
- Task input/workflow and their tests are the first coherent work unit. UI integration is implemented in the working tree and reserved for the next work-unit commit; T4b/T5a checkboxes close with that commit.
- Independent audit reported no supported severe/blocking findings and focused 11/11 passing; parent spot check reran focused 11/11 passing. These checks cover the complete working-tree implementation.
- Native risk assessment was high/unassessable due to untracked inventory; independent audit completed. RDD is off, so no native review was started.
- Actual complete feature diff before commit evidence: 644 authored changed lines. No PR or remote delivery is created by these local work units.

### Integrated board work-unit checkpoint
- T4 is complete locally: persisted rendering/create, drag/drop and accessible reorder, search/priority filtering. T5 is partial: task fields edit is complete; project/status settings and archive/delete remain pending.
- T6 remains partial: invitations exist separately, but remaining user-management scope has not been validated complete. Original T7 remains partial: automated tests/checks and independent audit passed, browser persistence checks pending.
- Domain boundary: `2820038`, 233 additions, 0 deletions (validation/workflow, deterministic tests and task evidence).
- UI boundary: board/forms/action/data loader and scoped CSS with board tests; kept cohesive rather than artificially splitting the interactive integration to meet the advisory 400 line heuristic.
- No source normalization or behavioral edits after the successful verification; only task evidence/checkpoint documentation updated.

### Local commit evidence
- `2820038` — `feat(kanban): validate task mutations with optimistic locking` — 5 files, 233 additions, 0 deletions.
- `3aeff76` — `feat(kanban): connect interactive board and task editor` — 9 files, 407 additions, 27 deletions (434 authored lines including task evidence). This cohesive integration is 34 lines over the advisory target; no PR created, and a future PR slice needs a maintainer size exception rather than cosmetic shrinking.
- Verification of these exact source bytes: focused 11/11, admin 68/68, typecheck/build/diff checks passed; independent audit and parent focused spot check passed. Source files were unchanged after verification.
- Running work-unit total before this evidence-only commit: 667 authored lines (includes checkpoint/evidence updates), versus initial 644-line working-tree snapshot. Push and deployment are not performed.
