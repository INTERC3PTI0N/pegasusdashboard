import 'server-only';
import { randomBytes } from 'crypto';
import { db } from './db';
import type { User } from './users';

export interface Certificate {
  id: string;
  userId: string;
  userName: string;
  salon: string;
  productSlug: string;
  productName: string;
  issuedAt: Date;
  revokedAt: Date | null;
  revokedReason: string | null;
  revokedBy: string | null;
}

export interface ProductKey {
  code: string; // XXXX-XXXX-XXXX
  productSlug: string;
  addedAt: Date;
  usedBy: string | null; // user id
  usedByEmail: string | null;
  usedAt: Date | null;
  batch: string;
  voidedAt: Date | null;
}

// ── Progress ────────────────────────────────────────────────────────────────

export async function getCompletedLessons(userId: string, productSlug: string): Promise<string[]> {
  const [row] = await db()<{ lessons: string[] }[]>`
    select lessons from progress where user_id = ${userId} and product_slug = ${productSlug}`;
  return row?.lessons ?? [];
}

export async function getAllProgress(userId: string): Promise<Record<string, string[]>> {
  const rows = await db()<{ productSlug: string; lessons: string[] }[]>`
    select product_slug, lessons from progress where user_id = ${userId}`;
  return Object.fromEntries(rows.map((r) => [r.productSlug, r.lessons]));
}

/** Admin: userId -> productSlug -> completed lesson ids. */
export async function getEveryonesProgress(): Promise<Record<string, Record<string, string[]>>> {
  const rows = await db()<{ userId: string; productSlug: string; lessons: string[] }[]>`select * from progress`;
  const out: Record<string, Record<string, string[]>> = {};
  for (const r of rows) (out[r.userId] ??= {})[r.productSlug] = r.lessons;
  return out;
}

export async function setLessonComplete(userId: string, productSlug: string, lessonId: string, complete: boolean) {
  if (complete) {
    await db()`
      insert into progress (user_id, product_slug, lessons)
      values (${userId}, ${productSlug}, array[${lessonId}::text])
      on conflict (user_id, product_slug) do update
        set updated_at = now(),
            lessons = case when ${lessonId}::text = any(progress.lessons) then progress.lessons
                           else array_append(progress.lessons, ${lessonId}::text) end`;
  } else {
    await db()`
      update progress set lessons = array_remove(lessons, ${lessonId}::text), updated_at = now()
      where user_id = ${userId} and product_slug = ${productSlug}`;
  }
}

/** Admin override: set a course's completed lessons outright (e.g. mark all done, or reset). */
export async function setCourseProgress(userId: string, productSlug: string, lessons: string[]) {
  await db()`
    insert into progress (user_id, product_slug, lessons) values (${userId}, ${productSlug}, ${lessons}::text[])
    on conflict (user_id, product_slug) do update set lessons = excluded.lessons, updated_at = now()`;
}

/** Last time the user ticked or unticked a lesson, per course. */
export async function getLastActivity(userId: string): Promise<Record<string, Date>> {
  const rows = await db()<{ productSlug: string; updatedAt: Date }[]>`
    select product_slug, updated_at from progress where user_id = ${userId}`;
  return Object.fromEntries(rows.map((r) => [r.productSlug, r.updatedAt]));
}

// ── Certificates ────────────────────────────────────────────────────────────

export async function getAllCertificates(): Promise<Certificate[]> {
  return db()<Certificate[]>`select * from certificates order by issued_at desc`;
}

export async function getCertificates(userId: string): Promise<Certificate[]> {
  return db()<Certificate[]>`select * from certificates where user_id = ${userId} order by issued_at`;
}

export async function findCertificate(id: string): Promise<Certificate | null> {
  const [row] = await db()<Certificate[]>`select * from certificates where id = ${id}`;
  return row ?? null;
}

/** The user's active (not revoked) certificate for a course. */
export async function findCertificateFor(userId: string, productSlug: string): Promise<Certificate | null> {
  const [row] = await db()<Certificate[]>`
    select * from certificates where user_id = ${userId} and product_slug = ${productSlug} and revoked_at is null`;
  return row ?? null;
}

export async function hasRevokedCertificate(userId: string, productSlug: string): Promise<boolean> {
  const rows = await db()`
    select 1 from certificates where user_id = ${userId} and product_slug = ${productSlug} and revoked_at is not null limit 1`;
  return rows.length > 0;
}

export async function revokeCertificate(id: string, reason: string, actor: string): Promise<Certificate | null> {
  const [row] = await db()<Certificate[]>`
    update certificates set revoked_at = now(), revoked_reason = ${reason}, revoked_by = ${actor}
    where id = ${id} and revoked_at is null
    returning *`;
  return row ?? null;
}

export async function issueCertificate(
  cert: Pick<Certificate, 'userId' | 'userName' | 'salon' | 'productSlug' | 'productName'>
): Promise<Certificate> {
  const id = `PGS-${randomBytes(4).toString('hex')}-${randomBytes(4).toString('hex')}`.toUpperCase();
  const [row] = await db()<Certificate[]>`
    insert into certificates (id, user_id, user_name, salon, product_slug, product_name)
    values (${id}, ${cert.userId}, ${cert.userName}, ${cert.salon}, ${cert.productSlug}, ${cert.productName})
    on conflict (user_id, product_slug) where revoked_at is null do nothing
    returning *`;
  // No row: a double submit already issued it.
  return row ?? (await findCertificateFor(cert.userId, cert.productSlug))!;
}

// ── Product keys ────────────────────────────────────────────────────────────

export async function getProductKeys(): Promise<ProductKey[]> {
  return db()<ProductKey[]>`select * from product_keys order by added_at desc, code`;
}

/** Adds new keys, leaving any already on file untouched. Returns how many were added. */
export async function addProductKeys(codes: string[], productSlug: string, batch = ''): Promise<number> {
  const unique = [...new Set(codes)];
  if (unique.length === 0) return 0;
  const rows = await db()`
    insert into product_keys (code, product_slug, batch)
    select unnest(${unique}::text[]), ${productSlug}, ${batch}
    on conflict (code) do nothing
    returning code`;
  return rows.length;
}

/** Voids unused keys so they can never be redeemed. Returns how many were voided. */
export async function voidKeys(codes: string[]): Promise<number> {
  const rows = await db()`
    update product_keys set voided_at = now()
    where code = any(${codes}::text[]) and used_by is null and voided_at is null
    returning code`;
  return rows.length;
}

export async function unvoidKey(code: string): Promise<boolean> {
  const rows = await db()`update product_keys set voided_at = null where code = ${code} returning code`;
  return rows.length === 1;
}

export async function keysUsedBy(userId: string): Promise<ProductKey[]> {
  return db()<ProductKey[]>`select * from product_keys where used_by = ${userId} order by used_at desc`;
}

export type RedeemResult =
  | { ok: true; productSlug: string }
  | { ok: false; error: 'invalid' | 'used' | 'owned' };

/**
 * One-time redemption. The key row is locked for the transaction, so two accounts
 * redeeming the same key at once are serialized and only the first succeeds; spending
 * the key and unlocking the product commit together or not at all.
 */
export async function redeemProductKey(user: User, code: string): Promise<RedeemResult> {
  return db().begin(async (tx) => {
    const [key] = await tx<{ productSlug: string; usedBy: string | null; voidedAt: Date | null }[]>`
      select product_slug, used_by, voided_at from product_keys where code = ${code} for update`;
    if (!key || key.voidedAt) return { ok: false, error: 'invalid' } as const;
    if (key.usedBy) return { ok: false, error: 'used' } as const;

    // Already owns the product: refuse without spending the key, so it can go to someone else.
    const granted = await tx`
      update users set entitlements = array_append(entitlements, ${key.productSlug}::text)
      where id = ${user.id} and not (${key.productSlug}::text = any(entitlements))
      returning id`;
    if (granted.length === 0) return { ok: false, error: 'owned' } as const;

    await tx`
      update product_keys set used_by = ${user.id}, used_by_email = ${user.email}, used_at = now()
      where code = ${code}`;
    return { ok: true, productSlug: key.productSlug } as const;
  });
}
