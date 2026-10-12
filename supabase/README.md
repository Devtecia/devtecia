# Supabase

Database schema for the internal admin at `/admin`.

## Apply the migration

Option 1, SQL editor (no CLI needed):

1. Open the Supabase dashboard, then **SQL Editor**, then **New query**.
2. Paste the full contents of `migrations/0001_admin_kanban.sql` and run it.

Option 2, Supabase CLI:

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

The migration is safe to run again: tables use `if not exists`, functions are replaced, and policies and triggers are recreated.

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
