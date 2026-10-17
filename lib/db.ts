import 'server-only';
import postgres from 'postgres';

// One pool per module instance. Deliberately NOT kept on globalThis across dev hot reloads: a pool
// that outlives a reload stops making progress (requests hang for minutes). A pool left behind by a
// reload closes itself once its connections sit idle (idle_timeout). Tables come from db/schema.sql.
let pool: postgres.Sql | undefined;

export function db(): postgres.Sql {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set — see README.');
    const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
    pool = postgres(url, {
      prepare: false, // required by Supabase's transaction pooler
      ssl: local ? false : 'require',
      transform: postgres.camel, // snake_case columns <-> camelCase fields
      // Poolers and NATs silently drop idle connections; a query on a dead socket then hangs
      // for minutes. Retire idle connections early and recycle long-lived ones.
      idle_timeout: 20,
      max_lifetime: 60 * 5,
      connect_timeout: 10,
      // Supabase's transaction pooler can hand pipelined queries to different backends, leaving
      // one waiting forever for the rest of a message. One query in flight per connection.
      // @ts-expect-error -- supported by postgres@3.4 at runtime, missing from its type definitions
      max_pipeline: 1,
    });
  }
  return pool;
}
