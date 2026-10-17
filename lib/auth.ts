import 'server-only';
import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';
import { cache } from 'react';
import { findUserForSession, type User } from './users';

const SESSION_COOKIE = 'pegasus_session';
const SECRET = process.env.SESSION_SECRET ?? 'pegasus-dev-secret-change-in-production';
if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET must be set in production.');
}

function sign(value: string): string {
  return createHmac('sha256', SECRET).update(value).digest('base64url');
}

/** Token = `<userId>.<sessionVersion>.<hmac>`. Bumping the user's version kills all their sessions. */
export function createSessionToken(userId: string, version: number): string {
  return `${userId}.${version}.${sign(`${userId}.${version}`)}`;
}

export function verifySessionToken(token: string | undefined): { userId: string; version: number } | null {
  if (!token) return null;
  const dot = token.lastIndexOf('.');
  if (dot === -1) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(payload));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const [userId, version] = payload.split('.');
  return userId && version ? { userId, version: Number(version) } : null;
}

/** The signed-in user, once per request (layout + page share it), with last-seen refreshed in the same query. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const jar = await cookies();
  const session = verifySessionToken(jar.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const user = await findUserForSession(session.userId);
  // Suspended, signed out everywhere, or password reset since this cookie was issued.
  if (!user || user.suspendedAt || user.sessionVersion !== session.version) return null;
  return user;
});

export async function setSession(user: Pick<User, 'id' | 'sessionVersion'>) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, createSessionToken(user.id, user.sessionVersion), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export { SESSION_COOKIE };
