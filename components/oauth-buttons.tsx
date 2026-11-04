import { Button } from '@/components/ui/button';

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

function FacebookMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#0866FF"
        d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"
      />
    </svg>
  );
}

/**
 * Google / Meta (Facebook Login) buttons. `signin` on the sign-in page; `link` on "Create Account",
 * where the customer links the kit to their Google or Meta account. Always shown — until a provider's
 * keys are set, its route sends the customer back with a "being set up" message.
 */
export function OAuthButtons({ mode = 'signin', from }: { mode?: 'signin' | 'link'; from: '/login' | '/signup' }) {
  return (
    <div className="space-y-3">
      {mode === 'link' && (
        <div>
          <p className="text-sm font-medium">Link your Google or Meta account</p>
          <p className="text-xs text-muted-foreground">
            Your kit is added to the account you choose — or a new account is created with it.
          </p>
        </div>
      )}
      <div className="grid gap-2">
        {(['google', 'facebook'] as const).map((p) => (
          <Button key={p} asChild variant="outline" className="w-full gap-2.5">
            {/* Plain link: the route redirects off-site to the provider. */}
            <a href={`/api/auth/${p}?from=${from}`}>
              {p === 'google' ? <GoogleMark /> : <FacebookMark />}
              Continue with {p === 'google' ? 'Google' : 'Meta (Facebook)'}
            </a>
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        {mode === 'link' ? 'or create an account with email' : 'or with email'}
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
