import { timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { fetchProfile, isProvider } from '@/lib/oauth';
import { createOAuthCustomer, findOAuthUser } from '@/lib/users';
import { setSession } from '@/lib/auth';
import { finishRegistration, registerWithPendingCode } from '@/lib/registration';

/**
 * Back from Google / Facebook. An existing account (linked, or with the same email) is signed in, and
 * a kit code waiting from /start is added to it. A new account is only created with a kit code, which
 * is redeemed on it in the same step — nobody registers without one.
 */
export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const url = new URL(request.url);
  const to = (path: string) => NextResponse.redirect(new URL(path, url.origin));
  const jar = await cookies();
  const expected = jar.get('pegasus_oauth_state')?.value ?? '';
  jar.delete({ name: 'pegasus_oauth_state', path: '/api/auth' });

  const got = `${provider}:${url.searchParams.get('state') ?? ''}`;
  const stateOk = expected.length === got.length && timingSafeEqual(Buffer.from(expected), Buffer.from(got));
  const code = url.searchParams.get('code');
  if (!isProvider(provider) || !stateOk) return to('/login?error=oauth');
  if (!code) return to('/login'); // cancelled on the provider's screen

  const profile = await fetchProfile(provider, code, url.origin).catch(() => null);
  if (!profile) return to(`/login?error=${provider === 'facebook' ? 'oauth_email' : 'oauth'}`);

  const user = await findOAuthUser(provider, profile);
  if (!user) {
    const reg = await registerWithPendingCode(() => createOAuthCustomer(provider, profile));
    if (!reg.ok) {
      if (reg.error === 'taken') return to('/login?error=oauth');
      return to(`/start?error=${reg.error === 'no_code' ? 'no_account' : reg.error}`);
    }
    await setSession(reg.user);
    return to(`/dashboard?registered=${reg.kit}`);
  }
  // Staff sign in with their password (and its forced-change flow), never via a social account.
  if (user.role !== 'customer') return to('/login?error=oauth_staff');
  if (user.suspendedAt) return to('/login?error=suspended');

  await setSession(user);
  return to(await finishRegistration(user));
}
