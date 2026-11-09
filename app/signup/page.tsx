import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { SignupForm } from './signup-form';
import { LanguageSwitcher } from '@/components/language-switcher';
import { OAuthButtons } from '@/components/oauth-buttons';
import { getPendingCode } from '@/lib/registration';
import { peekKitKey } from '@/lib/store';
import { KITS } from '@/lib/kits';

export const dynamic = 'force-dynamic';

/** Step 4, "Create Account" — only after a kit code has been entered on /start. */
export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const setupPending = (await searchParams).error === 'oauth_setup';
  const code = await getPendingCode();
  const check = code ? await peekKitKey(code) : null;
  if (!check?.ok) redirect('/start');
  const kit = KITS[check.kit];
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
          <h1 className="editorial-text text-4xl mb-2">Create your account</h1>
          <p className="mono-tag mb-3 text-[10px] text-muted-foreground">Step 4 of 5 · Create account</p>
          <p className="mb-6 flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 text-sm" role="status">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              <strong>{kit.name}</strong> code accepted. Create your account to unlock the tutorials and access the course.{' '}
              <Link href="/start" className="text-primary hover:underline">Change code</Link>
            </span>
          </p>
          <div className="mb-6">
            {setupPending && (
              <p className="mb-3 text-sm text-destructive" role="alert">
                Google and Meta linking are being set up. Please create your account with email for now.
              </p>
            )}
            <OAuthButtons mode="link" from="/signup" />
          </div>
          <SignupForm />
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
      </div>
    </div>
  );
}
