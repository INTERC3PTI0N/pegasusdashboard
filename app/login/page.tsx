import Image from 'next/image';
import { AlertCircle } from 'lucide-react';
import { LoginForm } from './login-form';
import { OAuthButtons } from '@/components/oauth-buttons';
import { LanguageSwitcher } from '@/components/language-switcher';

const ERRORS: Record<string, string> = {
  oauth: 'That sign-in didn’t complete. Please try again.',
  oauth_email: 'Facebook didn’t share an email address. Please use Google or your email and password.',
  oauth_staff: 'Staff accounts sign in with email and password.',
  oauth_setup: 'Google and Meta sign-in are being set up. Please use your email and password for now.',
  suspended: 'This account has been suspended. Please contact Pegasus support.',
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const error = ERRORS[(await searchParams).error ?? ''];
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left — form */}
      <div className="relative flex flex-col justify-center px-6 py-12 lg:px-20">
        <LanguageSwitcher className="absolute right-4 top-4" />
        <div className="mx-auto w-full max-w-sm">
          <Image
            src="/images/pegasus-logo.png"
            alt="Pegasus"
            width={150}
            height={70}
            className="h-14 w-auto mb-10"
            priority
          />
          <p className="mono-tag text-[10px] text-primary mb-3">PEGASUS Masterclass</p>
          <h1 className="editorial-text text-4xl mb-2">Welcome back</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Sign in to access the tutorials, guides and certification for your Pegasus tools.
            Content is exclusive to verified purchasers.
          </p>
          {error && (
            <p className="mb-6 flex items-center gap-2 text-sm text-destructive" role="alert">
              <AlertCircle className="size-4 shrink-0" /> {error}
            </p>
          )}
          <div className="mb-6">
            <OAuthButtons from="/login" />
          </div>
          <LoginForm />
        </div>
      </div>

      {/* Right — brand visual */}
      <div className="relative hidden lg:block">
        <Image
          src="/images/andrea-salon.webp"
          alt="Andrea Bozzano cutting hair with Pegasus tools"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <p className="mono-tag text-[10px] text-white/70 mb-4">Since 1961</p>
          <p className="editorial-text text-3xl leading-snug">
            “Every Pegasus tool ships with a lifetime of technique. This is where you collect it.”
          </p>
        </div>
      </div>
    </div>
  );
}
