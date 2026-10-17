import 'server-only';
import { db } from './db';
import { getProducts } from './courses';

export interface DailyPoint {
  day: string; // YYYY-MM-DD
  count: number;
}

/** Per-day counts for the last `days` days (zero-filled), for one event column. */
async function daily(sqlFrom: 'signups' | 'redemptions' | 'certificates', days: number): Promise<DailyPoint[]> {
  const sql = db();
  const source =
    sqlFrom === 'signups'
      ? sql`select created_at as at from users where role = 'customer'`
      : sqlFrom === 'redemptions'
        ? sql`select used_at as at from product_keys where used_at is not null`
        : sql`select issued_at as at from certificates`;
  const rows = await sql<{ day: string; count: number }[]>`
    with d as (
      select generate_series(current_date - ${days - 1}::int, current_date, interval '1 day')::date as day
    ), e as (${source})
    select to_char(d.day, 'YYYY-MM-DD') as day, count(e.at)::int as count
    from d left join e on e.at::date = d.day
    group by d.day order by d.day`;
  return rows;
}

export async function getAnalytics(days = 30) {
  const sql = db();
  const [signups, redemptions, certificates, [k], products, owners, progressRows, certRows] = await Promise.all([
    daily('signups', days),
    daily('redemptions', days),
    daily('certificates', days),
    sql<
      {
        customers: number;
        newCustomers: number;
        prevCustomers: number;
        active: number;
        suspended: number;
        keysAvailable: number;
        keysUsed: number;
        keysVoided: number;
        certsActive: number;
        certsRevoked: number;
        newEnquiries: number;
      }[]
    >`
      select
        (select count(*)::int from users where role = 'customer') as customers,
        (select count(*)::int from users where role = 'customer' and created_at >= now() - ${days}::int * interval '1 day') as new_customers,
        (select count(*)::int from users where role = 'customer'
           and created_at >= now() - ${days * 2}::int * interval '1 day' and created_at < now() - ${days}::int * interval '1 day') as prev_customers,
        (select count(*)::int from users where role = 'customer' and last_seen_at >= now() - ${days}::int * interval '1 day') as active,
        (select count(*)::int from users where role = 'customer' and suspended_at is not null) as suspended,
        (select count(*)::int from product_keys where used_by is null and voided_at is null) as keys_available,
        (select count(*)::int from product_keys where used_by is not null) as keys_used,
        (select count(*)::int from product_keys where voided_at is not null and used_by is null) as keys_voided,
        (select count(*)::int from certificates where revoked_at is null) as certs_active,
        (select count(*)::int from certificates where revoked_at is not null) as certs_revoked,
        (select count(*)::int from leads where status = 'new') as new_enquiries`,
    getProducts(),
    sql<{ slug: string; n: number }[]>`
      select unnest(entitlements) as slug, count(*)::int as n from users where role = 'customer' group by 1`,
    sql<{ userId: string; productSlug: string; lessons: string[] }[]>`
      select p.user_id, p.product_slug, p.lessons from progress p
      join users u on u.id = p.user_id and p.product_slug = any(u.entitlements)`,
    sql<{ productSlug: string; n: number }[]>`
      select product_slug, count(*)::int as n from certificates where revoked_at is null group by 1`,
  ]);

  // Course funnel: owners → started → finished every lesson → certified.
  const funnel = products.map((p) => {
    const ids = new Set(p.lessons.map((l) => l.id));
    const rows = progressRows.filter((r) => r.productSlug === p.slug);
    const doneCounts = rows.map((r) => r.lessons.filter((l) => ids.has(l)).length);
    return {
      slug: p.slug,
      name: p.name,
      lessons: p.lessons.length,
      owners: owners.find((o) => o.slug === p.slug)?.n ?? 0,
      started: doneCounts.filter((n) => n > 0).length,
      completed: ids.size ? doneCounts.filter((n) => n >= ids.size).length : 0,
      certified: certRows.find((c) => c.productSlug === p.slug)?.n ?? 0,
      avgProgress: rows.length && ids.size ? Math.round((doneCounts.reduce((s, n) => s + n, 0) / (rows.length * ids.size)) * 100) : 0,
    };
  });

  return { days, kpis: k, signups, redemptions, certificates, funnel };
}
