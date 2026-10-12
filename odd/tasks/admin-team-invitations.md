# Admin team invitations

## Objective
Allow an active administrator to invite a teammate by email from the existing Users page without creating or revealing a temporary password.

## Problem and scope
The Users page is a placeholder. Supabase Auth and an automatic member profile trigger already exist. This feature adds an admin-only invite workflow and a visible team list while preserving the current admin design. Marketing workspace integration is a separate, unresolved product scope and is not included here.

## Constraints
- Use Supabase's server-side `inviteUserByEmail`; never expose the service-role key to the browser.
- Default new teammates to the existing `member` role. Do not send real invitations during automated tests.
- Preserve the current admin visual language and professional Spanish UI copy.
- Email delivery depends on hosted Supabase SMTP configuration, which local code cannot verify.
- Delivery strategy: ask-on-risk. Forecast: approximately 250–400 authored changed lines, excluding generated files.

## Tasks
- [x] INV-1 (delegated direct): Replace the Users placeholder with an admin-only invitation form and team list; add a guarded server action, invite callback/password setup, and deterministic tests. Acceptance observed: valid invitation calls `inviteUserByEmail` once with `member` metadata; unauthorized and malformed input do not create the service-role client; provider errors are safe; team rows show active, pending, or deactivated status. Checks: focused tests (8/8), full admin tests (32/32), build (passed). Work-unit commit: `cad200a` (`feat(admin): invite teammates by email`).
- [x] INV-2 (delegated direct): Revalidate `/admin/users` after a successful invite, and paginate Auth users before deriving pending/confirmed status. Acceptance observed: only successful invitations revalidate the users route; Auth pagination continues until a partial page, and an Auth lookup error fails the list safely rather than misclassifying users. Checks: focused tests (10/10), full admin tests (34/34), build (passed). Work-unit commit: pending.

## Progress and next step
INV-1 and INV-2 implementation and local checks are complete. Follow-up fixes refresh the users route after a successful invitation and paginate Auth user lookups before deriving confirmed/pending statuses. The invite route uses the SSR callback (`token_hash`/`invite` or PKCE `code`) to establish cookies, then lets the teammate choose a password from the login page. The profile trigger defaults new Auth users to the database `member` role. The team page checks Auth email confirmation to distinguish a pending invitation from an active profile.

Operational prerequisites remain: set `NEXT_PUBLIC_SITE_URL` (or ensure the deployment `VERCEL_URL` is configured and allow-listed), allow the resulting `/auth/callback` redirect in Supabase, customize the Supabase Invite User template to send `token_hash` and `type=invite` to this SSR callback, and configure hosted SMTP for external delivery. Local code and tests did not send real emails or change Supabase settings. No Marketing files were changed. Global RDD was explicitly off for INV-2; no review lifecycle was invoked.
