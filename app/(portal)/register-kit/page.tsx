import { AlertCircle } from 'lucide-react';
import { requireCustomer } from '@/lib/access';
import { REDEEM_ERRORS } from '@/lib/registration';
import { Card, CardContent } from '@/components/ui/card';
import { RedeemForm } from './redeem-form';

export const dynamic = 'force-dynamic';

export default async function RegisterKitPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireCustomer();
  // A code entered on /start that couldn't be redeemed once the account existed.
  const { error } = await searchParams;
  const message = error && error in REDEEM_ERRORS ? REDEEM_ERRORS[error as keyof typeof REDEEM_ERRORS] : null;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="mono-tag text-[10px] text-primary mb-2">Kit registration</p>
        <h1 className="editorial-text text-4xl">Register your Kit</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-xl">
          Every PEGASUS® kit includes an activation card with a unique code. Enter your code below to unlock your
          tutorials and course access. Each code can be used only once.
        </p>
      </div>

      {message && (
        <p className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
          <AlertCircle className="size-4 shrink-0" /> {message}
        </p>
      )}

      <Card>
        <CardContent>
          <RedeemForm />
        </CardContent>
      </Card>
    </div>
  );
}
