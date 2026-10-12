#!/usr/bin/env node
// Creates or promotes a Devtecia admin.
// Usage: node scripts/create-admin.mjs <email> "<full name>" [--reset-password]
// The password comes from ADMIN_PASSWORD or a hidden prompt. Secrets are never printed.
import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const MIN_PASSWORD = 10;

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    let value = match[2];
    if (/^(['"]).*\1$/.test(value)) value = value.slice(1, -1);
    else value = value.replace(/\s+#.*$/, '');
    process.env[match[1]] = value;
  }
}

function initialsFrom(name, email) {
  const source = name?.trim() || email?.split('@')[0]?.trim() || '';
  const words = source.split(/[\s._-]+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function promptHidden(question) {
  return new Promise((resolvePrompt, reject) => {
    const { stdin, stdout } = process;
    if (!stdin.isTTY) return reject(new Error('No terminal available. Set ADMIN_PASSWORD instead.'));
    stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    let value = '';
    const onData = chunk => {
      for (const char of chunk) {
        if (char === '\u0003') { stdout.write('\n'); process.exit(130); }
        if (char === '\r' || char === '\n') {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off('data', onData);
          stdout.write('\n');
          return resolvePrompt(value);
        }
        if (char === '\u007f' || char === '\b') value = value.slice(0, -1);
        else value += char;
      }
    };
    stdin.on('data', onData);
  });
}

async function readPassword() {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  const password = await promptHidden('Password: ');
  const repeat = await promptHidden('Repeat password: ');
  if (password !== repeat) throw new Error('Passwords do not match.');
  return password;
}

async function findUserByEmail(admin, email) {
  for (let page = 1; page < 100; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`Could not list users: ${error.message}`);
    const found = data.users.find(user => user.email?.toLowerCase() === email);
    if (found) return found;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function main() {
  const args = process.argv.slice(2);
  const resetPassword = args.includes('--reset-password');
  const [rawEmail, ...nameParts] = args.filter(arg => !arg.startsWith('--'));
  const email = rawEmail?.trim().toLowerCase();
  const name = nameParts.join(' ').trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name) {
    console.error('Usage: node scripts/create-admin.mjs <email> "<full name>" [--reset-password]');
    process.exit(1);
  }

  loadEnvFile(resolve(process.cwd(), '.env.local'));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local.');

  const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const initials = initialsFrom(name, email);
  let user = await findUserByEmail(supabase, email);

  if (!user || resetPassword) {
    const password = await readPassword();
    if (password.length < MIN_PASSWORD) throw new Error(`Use a password with at least ${MIN_PASSWORD} characters.`);
    if (user) {
      const { error } = await supabase.auth.admin.updateUserById(user.id, { password, user_metadata: { name, initials } });
      if (error) throw new Error(`Could not update the password: ${error.message}`);
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, initials },
      });
      if (error || !data.user) throw new Error(`Could not create the user: ${error?.message ?? 'unknown error'}`);
      user = data.user;
    }
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ id: user.id, email, name, initials, role: 'admin', active: true }, { onConflict: 'id' });
  if (profileError) throw new Error(`Could not save the admin profile (is the migration applied?): ${profileError.message}`);

  console.log(`Admin ready: ${email} (${name}). Sign in at /admin/login.`);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : 'Unexpected error.');
  process.exit(1);
});
