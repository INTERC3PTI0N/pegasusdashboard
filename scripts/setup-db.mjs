// Applies db/schema.sql and, if an email is given, creates (or resets the password of) an owner admin.
// Usage: node --env-file=.env.local scripts/setup-db.mjs [<admin email> <password> [name]]
import { readFileSync } from 'node:fs';
import { randomBytes, scryptSync } from 'node:crypto';
import postgres from 'postgres';

const [email, password, name = 'Pegasus Admin'] = process.argv.slice(2);
if (email && (!password || password.length < 8)) {
  console.error('Usage: node --env-file=.env.local scripts/setup-db.mjs <admin email> <password (8+ chars)> [name]');
  process.exit(1);
}
const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
const sql = postgres(url, { prepare: false, ssl: local ? false : 'require', max: 1, onnotice: () => {} });

await sql.unsafe(readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8'));
console.log('Schema applied.');
if (!email) {
  await sql.end();
  process.exit(0);
}

// Same format as lib/password.ts
const salt = randomBytes(16);
const passwordHash = `scrypt$${salt.toString('hex')}$${scryptSync(password, salt, 64).toString('hex')}`;

const [row] = await sql`
  insert into users (name, email, salon, role, admin_role, password_hash)
  values (${name}, ${email.toLowerCase()}, 'Pegasus Academy HQ', 'admin', 'owner', ${passwordHash})
  on conflict (email) do update set role = 'admin', admin_role = 'owner', name = excluded.name,
    password_hash = excluded.password_hash, suspended_at = null, must_change_password = false,
    session_version = users.session_version + 1
  returning (xmax = 0) as created`;
console.log(row.created ? `Created admin ${email}` : `Updated ${email} (now admin, password reset)`);
await sql.end();
