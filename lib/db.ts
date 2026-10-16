import 'server-only';
import postgres from 'postgres';

// One pool per process; reused across hot reloads in dev. Tables come from db/schema.sql.
const g = globalThis as unknown as { _sql?: postgres.Sql };

export function db(): postgres.Sql {
  if (!g._sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set — see README.');
    const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
    g._sql = postgres(url, {
      prepare: false, // required by Supabase's transaction pooler
      ssl: local ? false : 'require',
      transform: postgres.camel, // snake_case columns <-> camelCase fields
    });
  }
  return g._sql;
}
