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
- [x] T1 Schema and SQL migrations: profiles, projects, project_members, tasks, RLS policies, SQL functions (create task with number, move task, update with version check, remove status). Route: delegated writer. Commit 465f3bc. Remote apply pending (parent coordinates).
- [x] T2 Auth: Supabase SSR clients, proxy guard, `/admin/login` page, logout, first admin bootstrap. Route: delegated writer. Commit 6dd1662. Live sign in pending migration and first admin.
- [x] T3 Admin shell: layout, sidebar with projects, topbar with search, design tokens scoped to admin. Route: delegated writer. Commit ce7f6d4. Includes a minimal create project form (not assigned to any other task). Visual check of the signed in shell pending.
- [ ] T4 Board: columns, cards, drag and drop, priority filter, create task.
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
  - Pending: apply migration remotely, run `node scripts/create-admin.mjs`, then live login and shell checks at 360px and desktop.
- Next step: apply the migration, create the first admin, then T4 board.
