import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { authorizeUrl, enabledProviders, isProvider } from '@/lib/oauth';

/** Starts "Continue with Google / Facebook": a one-time state cookie, then off to the provider. */
export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const origin = new URL(request.url).origin;
  const from = new URL(request.url).searchParams.get('from') === '/signup' ? '/signup' : '/login';
  if (!isProvider(provider)) return NextResponse.redirect(new URL(from, origin));
  // Keys not configured yet (see .env.example): back to the page with a "being set up" note.
  if (!enabledProviders().includes(provider)) return NextResponse.redirect(new URL(`${from}?error=oauth_setup`, origin));
  const state = randomBytes(24).toString('base64url');
  const res = NextResponse.redirect(authorizeUrl(provider, origin, state));
  res.cookies.set('pegasus_oauth_state', `${provider}:${state}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/api/auth',
    maxAge: 600,
  });
  return res;
}
