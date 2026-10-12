# Supabase

Database schema for the internal admin at `/admin`.

## Production status

Devtecia production (`izquyzflamarupavwrds`) has migrations `0001`–`0004` applied. Their CLI history was reconciled on 2026-10-12 after verifying the existing baseline and Marketing schema. Do not replay these files or reset production.

## CLI quick path

The installed CLI is `2.119.0`. Authentication is local to your machine; never commit tokens, database passwords, or `.temp/` files.

```bash
supabase login --no-browser --agent no --output-format text
supabase link --project-ref izquyzflamarupavwrds
supabase migration list --linked
supabase db push --linked --dry-run --skip-vault
```

Complete CLI login in the intended Supabase browser account. Enter credentials only in the provider's authorization flow, never in chat or shell arguments. `config.toml` configures local development; initialization does not push it to production.

## Future migrations

1. Create a new migration with `supabase migration new <name>`; do not edit applied migrations.
2. Review and test its SQL locally before deployment.
3. Check `migration list` and `db push --linked --dry-run --skip-vault` against the intended project.
4. Apply pending SQL only after explicit production deployment authorization. A dry-run is not authorization to push.

If SQL was applied manually, verify the actual schema before using `migration repair <version> --status applied --linked`. Repair changes history only; it does not execute or validate migration SQL. Never mark an unverified migration applied to silence a pending diff.

References: [CLI login](https://supabase.com/docs/reference/cli/supabase-login), [migration repair](https://supabase.com/docs/reference/cli/supabase-migration-repair).

## Create the first admin

Public sign ups stay disabled. Create or promote an admin from your machine with the service role key in `.env.local`:

```bash
node scripts/create-admin.mjs ana@devtecia.com "Ana Ruiz"
```

The script asks for the password without echoing it. Set `ADMIN_PASSWORD` to skip the prompt. For an existing user it only promotes the account to admin; add `--reset-password` to also set a new password.

## Error codes from the task functions

| Code | Meaning |
|---|---|
| `40001` | Stale `version`: someone changed the task first. Reload and retry. |
| `P0002` | Project, task or status not found. |
| `22023` | Invalid input, such as an unknown status or removing the last column. |
