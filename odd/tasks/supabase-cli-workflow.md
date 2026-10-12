# Supabase CLI migration workflow

## Objective and scope
Authenticate the installed CLI with the user-approved Supabase account, link Devtecia production (`izquyzflamarupavwrds`), and reconcile history for already-applied migrations without replaying schema SQL.

## Constraints
- No schema/data changes, actual `db push`, reset, credential disclosure, or automatic credential creation.
- User completes credential/token authorization and password entry.
- Verify baseline `0001` before marking it applied; `0002–0004` were applied and checked through SQL Editor.
- RDD is off. Do not commit until parent review.
- Structural CLI checks replace TDD because this is operational configuration, not behavior code.
- Forecast: fewer than 250 authored lines; delivery strategy: ask-on-risk.

## Tasks
- [x] CLI-1 (delegated): Inspect installed CLI/help and official docs. Observed version `2.119.0`; sandbox telemetry write failed, escalated help succeeded. No credentials inspected.
- [x] CLI-2 (delegated): User explicitly authorized verification-code submission; login, init, and link to exact production project succeeded. No database password prompt or secret disclosure.
- [x] CLI-3 (delegated): Verified all eleven baseline function bodies/security/volatility/search paths, four tables' columns/defaults/constraints/RLS, five policies, two triggers, three indexes, profile grants, and backfill completeness. Repaired only versions `0001`–`0004` as applied. `migration list` matches all four local/remote versions. `db push --linked --dry-run --skip-vault` returned `Remote database is up to date.` No schema replay occurred.
- [x] CLI-4 (delegated): Documented production status, CLI authentication, safe dry-run, and future migration/history-repair boundaries. `git diff --check` passed. Parent review/commit remains pending.

## Progress
All operational tasks verified. CLI `2.119.0` is authenticated and linked. Local config and ignore rules were generated; README updated. Remote changes were limited to requested CLI credential creation and migration-history reconciliation; no schema/data SQL was replayed. The documented interactive login command is `supabase login --no-browser --agent no --output-format text`; agent-default JSON mode cannot prompt. Parent review and commit are next; no commit was created in this worker.

## Evidence and recovery
- Existing Marketing task locator: `odd/tasks/admin-marketing-workspace.md` (historical remote-status text is stale; later SQL application recorded in Engram).
- Existing `supabase/.temp/` was untracked at task start; preserve it.
- Scope rollback: local CLI config/docs only; history mutations require separate reconciliation, not schema rollback.
- Engram mirror: `odd/supabase-cli-workflow/tasks`; updated with current task contents.
