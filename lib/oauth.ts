import 'server-only';
import type { OAuthProfile, OAuthProvider } from './users';

/**
 * "Continue with Google / Facebook" (OAuth 2.0 authorization-code flow, server side). Each provider is
 * on only when its keys are set:
 *   GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET   — Google Cloud → APIs & Services → Credentials
 *   FACEBOOK_APP_ID / FACEBOOK_APP_SECRET     — Meta for Developers → app with Facebook Login
 * Redirect URI to register with each: <site>/api/auth/google/callback, <site>/api/auth/facebook/callback
 */
const FB = 'https://graph.facebook.com/v21.0';

const PROVIDERS = {
  google: {
    label: 'Google',
    clientId: () => process.env.GOOGLE_CLIENT_ID,
    secret: () => process.env.GOOGLE_CLIENT_SECRET,
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    scope: 'openid email profile',
    async profile(code: string, redirectUri: string): Promise<OAuthProfile | null> {
      const token = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        body: new URLSearchParams({
          code,
          client_id: this.clientId()!,
          client_secret: this.secret()!,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      }).then((r) => r.json());
      if (!token.access_token) return null;
      const me = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
        headers: { Authorization: `Bearer ${token.access_token}` },
      }).then((r) => r.json());
      // Only a verified email may be matched to an existing account.
      if (!me.sub || !me.email || me.email_verified !== true) return null;
      return { id: String(me.sub), email: me.email, name: me.name || me.email.split('@')[0] };
    },
  },
  facebook: {
    label: 'Facebook',
    clientId: () => process.env.FACEBOOK_APP_ID,
    secret: () => process.env.FACEBOOK_APP_SECRET,
    authorizeUrl: 'https://www.facebook.com/v21.0/dialog/oauth',
    scope: 'email,public_profile',
    async profile(code: string, redirectUri: string): Promise<OAuthProfile | null> {
      const q = new URLSearchParams({ client_id: this.clientId()!, client_secret: this.secret()!, redirect_uri: redirectUri, code });
      const token = await fetch(`${FB}/oauth/access_token?${q}`).then((r) => r.json());
      if (!token.access_token) return null;
      const me = await fetch(`${FB}/me?fields=id,name,email&access_token=${encodeURIComponent(token.access_token)}`).then((r) => r.json());
      // Facebook only returns confirmed emails; accounts registered by phone have none.
      if (!me.id || !me.email) return null;
      return { id: String(me.id), email: me.email, name: me.name || me.email.split('@')[0] };
    },
  },
} as const;

export const isProvider = (p: string): p is OAuthProvider => p in PROVIDERS;

/** Providers with keys configured, for the sign-in / sign-up buttons. */
export function enabledProviders(): OAuthProvider[] {
  return (Object.keys(PROVIDERS) as OAuthProvider[]).filter((p) => PROVIDERS[p].clientId() && PROVIDERS[p].secret());
}

export const redirectUri = (origin: string, provider: OAuthProvider) => `${origin}/api/auth/${provider}/callback`;

export function authorizeUrl(provider: OAuthProvider, origin: string, state: string): string {
  const p = PROVIDERS[provider];
  const q = new URLSearchParams({
    client_id: p.clientId()!,
    redirect_uri: redirectUri(origin, provider),
    response_type: 'code',
    scope: p.scope,
    state,
  });
  if (provider === 'google') q.set('prompt', 'select_account');
  return `${p.authorizeUrl}?${q}`;
}

export function fetchProfile(provider: OAuthProvider, code: string, origin: string) {
  return PROVIDERS[provider].profile(code, redirectUri(origin, provider));
}
