import Image from 'next/image';
import Link from 'next/link';
import { StartSteps } from '@/components/start-steps';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Card, CardContent } from '@/components/ui/card';
import { StartForm } from './start-form';
import { REDEEM_ERRORS } from '@/lib/registration';

const NOTICES: Record<string, string> = {
  no_account: 'No account was found for that sign-in. Enter your kit code first to create one.',
  used: REDEEM_ERRORS.used,
  invalid: REDEEM_ERRORS.invalid,
};

export const metadata = { title: 'How to start — Pegasus Masterclass' };

/** Step 3, "Enter Code". The QR code on the scratch card opens /start?code=XXXX-XXXX-XXXX. */
export default async function StartPage({ searchParams }: { searchParams: Promise<{ code?: string; error?: string }> }) {
  const { code = '', error } = await searchParams;

  return (
    <div className="relative min-h-svh px-4 py-10 md:py-14">
      <LanguageSwitcher className="absolute right-4 top-4" />
      <div className="mx-auto max-w-3xl space-y-8">
        <Image src="/images/pegasus-logo.png" alt="Pegasus" width={150} height={70} className="h-14 w-auto" priority />
        <div>
          <p className="mono-tag text-[10px] text-primary mb-3">PEGASUS Masterclass</p>
          <h1 className="editorial-text text-4xl md:text-5xl">How to start</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Scratch the card inside your PEGASUS® kit and type the code below. Then create your account and begin your training.
          </p>
        </div>

        <StartSteps active="code" />

        <Card>
          <CardContent>
            <StartForm initialCode={code.slice(0, 20)} notice={NOTICES[error ?? '']} />
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
