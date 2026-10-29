import { requireCustomer } from '@/lib/access';
import { Card, CardContent } from '@/components/ui/card';
import { RedeemForm } from './redeem-form';

export const dynamic = 'force-dynamic';

export default async function RegisterKitPage() {
  await requireCustomer();

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

      <Card>
        <CardContent>
          <RedeemForm />
        </CardContent>
      </Card>
    </div>
  );
}
