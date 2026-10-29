import 'server-only';
import { randomBytes } from 'crypto';
import { db } from './db';
import { hashPassword } from './password';
import type { AdminRole } from './permissions';
import { KITS, type KitId, type UserKit } from './kits';

export type Role = 'customer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  salon: string;
  phone: string;
  country: string;
  role: Role;
  /** Staff permission level; only set for admins. */
  adminRole: AdminRole | null;
  /** Registered kits (Essential / Mastery) with their dates. Course access is derived from these only. */
  kits: UserKit[];
  createdAt: Date;
  lastSeenAt: Date | null;
  suspendedAt: Date | null;
  sessionVersion: number;
  mustChangePassword: boolean;
}

type KitJson = { kit: KitId; registeredAt: string; expiresAt: string | null };
type UserRow = Omit<User, 'kits'> & { passwordHash: string; entitlements?: string[]; kits: KitJson[] | null };

// The user's kits, as a JSON column alongside the user row (one round trip).
const kitsColumn = () => db()`(
  select coalesce(json_agg(json_build_object('kit', k.kit, 'registeredAt', k.registered_at, 'expiresAt', k.expires_at)), '[]')
  from user_kits k where k.user_id = users.id
) as kits`;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const toUser = ({ passwordHash, entitlements, kits, ...user }: UserRow): User => ({
  ...user,
  kits: (kits ?? []).map((k) => ({
    kit: k.kit,
    registeredAt: new Date(k.registeredAt),
    expiresAt: k.expiresAt ? new Date(k.expiresAt) : null,
  })),
});

export async function findUserById(id: string): Promise<User | null> {
  const [row] = await db()<UserRow[]>`select *, ${kitsColumn()} from users where id = ${id}`;
  return row ? toUser(row) : null;
}

/** The user plus their password hash — for login only. */
export async function findUserForLogin(email: string) {
  const [row] = await db()<UserRow[]>`select *, ${kitsColumn()} from users where email = ${email.toLowerCase()}`;
  return row ? { user: toUser(row), passwordHash: row.passwordHash } : null;
}

export async function getCustomers(): Promise<User[]> {
  const rows = await db()<UserRow[]>`select *, ${kitsColumn()} from users where role = 'customer' order by created_at desc`;
  return rows.map(toUser);
}

export async function getStaff(): Promise<User[]> {
  const rows = await db()<UserRow[]>`select *, ${kitsColumn()} from users where role = 'admin' order by created_at`;
  return rows.map(toUser);
}

/** Creates a customer account. Returns null if the email is already registered. */
export async function createCustomer(input: { name: string; email: string; salon: string; password: string }) {
  const [row] = await db()<UserRow[]>`
    insert into users (name, email, salon, password_hash)
    values (${input.name}, ${input.email.toLowerCase()}, ${input.salon}, ${hashPassword(input.password)})
    on conflict (email) do nothing
    returning *, ${kitsColumn()}`;
  return row ? toUser(row) : null;
}

/** A readable one-time password for admin resets / new staff (shown once, must be changed). */
export function temporaryPassword(): string {
  const words = randomBytes(9).toString('base64url').replace(/[-_]/g, 'x');
  return `${words.slice(0, 4)}-${words.slice(4, 8)}-${words.slice(8, 12)}`;
}

/** Creates a staff account with a temporary password. Returns null if the email is taken. */
export async function createStaff(input: { name: string; email: string; adminRole: AdminRole }, password: string) {
  const [row] = await db()<UserRow[]>`
    insert into users (name, email, salon, role, admin_role, password_hash, must_change_password)
    values (${input.name}, ${input.email.toLowerCase()}, 'Pegasus Academy HQ', 'admin', ${input.adminRole},
            ${hashPassword(password)}, true)
    on conflict (email) do nothing
    returning *, ${kitsColumn()}`;
  return row ? toUser(row) : null;
}

export async function setStaffRole(id: string, adminRole: AdminRole) {
  await db()`update users set admin_role = ${adminRole} where id = ${id} and role = 'admin'`;
}

export async function countOwners(): Promise<number> {
  const [r] = await db()<{ n: number }[]>`
    select count(*)::int as n from users where role = 'admin' and admin_role = 'owner' and suspended_at is null`;
  return r.n;
}

/** Loads the session's user and refreshes last-seen (at most every 5 minutes) in one round trip. */
export async function findUserForSession(id: string): Promise<User | null> {
  const [row] = await db()<UserRow[]>`
    update users set last_seen_at = case
        when last_seen_at is null or last_seen_at < now() - interval '5 minutes' then now() else last_seen_at end
    where id = ${id}
    returning *, ${kitsColumn()}`;
  return row ? toUser(row) : null;
}

export async function updateProfile(
  id: string,
  p: { name: string; salon: string; email: string; phone: string; country: string }
): Promise<'ok' | 'email_taken'> {
  try {
    await db()`
      update users set name = ${p.name}, salon = ${p.salon}, email = ${p.email.toLowerCase()},
        phone = ${p.phone}, country = ${p.country}
      where id = ${id}`;
    return 'ok';
  } catch (e) {
    if ((e as { code?: string }).code === '23505') return 'email_taken';
    throw e;
  }
}

/** Sets a new password and signs the user out everywhere else. */
export async function setPassword(id: string, password: string, mustChange: boolean) {
  await db()`
    update users set password_hash = ${hashPassword(password)}, must_change_password = ${mustChange},
      session_version = session_version + 1
    where id = ${id}`;
}

export async function setSuspended(id: string, suspended: boolean) {
  await db()`
    update users set suspended_at = ${suspended ? new Date() : null},
      session_version = session_version + ${suspended ? 1 : 0}
    where id = ${id}`;
}

export async function signOutEverywhere(id: string) {
  await db()`update users set session_version = session_version + 1 where id = ${id}`;
}

export async function deleteUser(id: string) {
  await db()`delete from users where id = ${id}`;
}

/**
 * Gives a customer a kit. Essential lasts KITS.essential.months from now — or, if they already
 * have time left, that much longer (a second Essential key or admin extension adds a year).
 */
export async function grantKit(userId: string, kit: KitId, opts: { keyCode?: string; grantedBy?: string } = {}) {
  const months = KITS[kit].months;
  await db()`
    insert into user_kits (user_id, kit, registered_at, expires_at, key_code, granted_by)
    values (${userId}, ${kit}, now(),
            ${months === null ? null : db()`now() + ${months}::int * interval '1 month'`},
            ${opts.keyCode ?? null}, ${opts.grantedBy ?? null})
    on conflict (user_id, kit) do update set
      expires_at = case when excluded.expires_at is null then null
                        else greatest(coalesce(user_kits.expires_at, now()), now()) + ${months ?? 0}::int * interval '1 month' end,
      key_code = coalesce(excluded.key_code, user_kits.key_code),
      granted_by = coalesce(excluded.granted_by, user_kits.granted_by)`;
}

export async function revokeKit(userId: string, kit: KitId) {
  await db()`delete from user_kits where user_id = ${userId} and kit = ${kit}`;
}

/** Admin: set an exact Essential expiry date (or null for no expiry). */
export async function setKitExpiry(userId: string, kit: KitId, expiresAt: Date | null) {
  await db()`update user_kits set expires_at = ${expiresAt} where user_id = ${userId} and kit = ${kit}`;
}

// ── CRM notes ───────────────────────────────────────────────────────────────

export interface CustomerNote {
  id: string;
  author: string;
  body: string;
  createdAt: Date;
}

export async function getNotes(userId: string): Promise<CustomerNote[]> {
  return db()<CustomerNote[]>`
    select id, author, body, created_at from customer_notes where user_id = ${userId} order by created_at desc`;
}

export async function addNote(userId: string, author: string, body: string) {
  await db()`insert into customer_notes (user_id, author, body) values (${userId}, ${author}, ${body})`;
}

export async function deleteNote(userId: string, noteId: string) {
  await db()`delete from customer_notes where id = ${noteId}::bigint and user_id = ${userId}`;
}
