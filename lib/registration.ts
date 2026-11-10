import 'server-only';
import { cookies } from 'next/headers';
import { peekKitKey, redeemKitKey } from './store';
import { deleteUser, type User } from './users';
import type { KitId } from './kits';

/**
 * Registration runs code-first: scratch card → scan QR (/start?code=…) → enter code → create account →
 * begin training. A checked code waits in this cookie while the customer creates an account or signs in
 * (password, Google or Facebook), then is redeemed straight away. Redemption re-checks the code in a
 * locked transaction, so the cookie only remembers it; it grants nothing by itself.
 */
const PENDING_COOKIE = 'pegasus_kit_code';

/** Kit card codes: 16 letters/digits (AB12CD34EF56GH78), or the original XXXX-XXXX-XXXX keys. */
export const KEY_RE = /^([A-Z0-9]{16}|[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4})$/;

/** Accepts any case, spaces or dashes: 16 characters → "AB12CD34EF56GH78", 12 → "ABCD-EFGH-IJKL" (otherwise the raw input). */
export function normalizeKey(raw: string): string {
  const chars = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (chars.length === 16) return chars;
  return chars.length === 12 ? `${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8)}` : raw.toUpperCase();
}

export async function getPendingCode(): Promise<string | null> {
  const code = (await cookies()).get(PENDING_COOKIE)?.value;
  return code && KEY_RE.test(code) ? code : null;
}

export async function setPendingCode(code: string) {
  (await cookies()).set(PENDING_COOKIE, code, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60,
  });
}

export const REDEEM_ERRORS = {
  invalid: 'That kit code is not valid. Check it against the card in your kit.',
  used: 'That kit code has already been used.',
  owned: 'You already have the Mastery Kit, which includes everything — the code was not used.',
} as const;

export type RegisterResult =
  | { ok: true; user: User; kit: KitId }
  | { ok: false; error: 'no_code' | 'taken' | 'invalid' | 'used' };

/**
 * New accounts only come with a kit: the account is created and the waiting code redeemed on it, or —
 * if the code was used meanwhile — the account is removed again. Email sign-up and Google / Facebook
 * sign-up both go through here.
 */
export async function registerWithPendingCode(create: () => Promise<User | null>): Promise<RegisterResult> {
  const code = await getPendingCode();
  if (!code) return { ok: false, error: 'no_code' };
  const check = await peekKitKey(code);
  if (!check.ok) return { ok: false, error: check.error };
  const user = await create();
  if (!user) return { ok: false, error: 'taken' };
  const result = await redeemKitKey(user, code);
  if (!result.ok) {
    await deleteUser(user.id);
    return { ok: false, error: result.error === 'used' ? 'used' : 'invalid' };
  }
  (await cookies()).delete(PENDING_COOKIE);
  return { ok: true, user, kit: result.kit };
}

/** After sign-in: redeem the waiting code, if any, and return where the customer goes next. */
export async function finishRegistration(user: User): Promise<string> {
  const code = await getPendingCode();
  if (!code || user.role !== 'customer') return user.role === 'admin' ? '/admin' : '/dashboard';
  (await cookies()).delete(PENDING_COOKIE);
  const result = await redeemKitKey(user, code);
  return result.ok ? `/dashboard?registered=${result.kit}` : `/register-kit?error=${result.error}`;
}
