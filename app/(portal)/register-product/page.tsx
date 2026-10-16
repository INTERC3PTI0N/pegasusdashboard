import Image from 'next/image';
import { requireCustomer } from '@/lib/access';
import { products } from '@/lib/catalog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RedeemForm } from './redeem-form';

export const dynamic = 'force-dynamic';

export default async function RegisterProductPage() {
  const user = await requireCustomer();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="mono-tag text-[10px] text-primary mb-2">Product registration</p>
        <h1 className="editorial-text text-4xl">Register a product</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-xl">
          Every Pegasus tool comes with a one-time product key. Enter it below to unlock that
          product&apos;s tutorials, guides and certification. Each key can only be used once.
        </p>
      </div>

      <Card>
        <CardContent>
          <RedeemForm />
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        {products.map((p) => {
          const owned = user.entitlements.includes(p.slug);
          return (
            <div key={p.slug} className="flex items-center gap-3 rounded-lg border p-3">
              <div className="relative size-10 shrink-0 overflow-hidden rounded-md">
                <Image src={p.image} alt="" fill className="object-cover" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{p.name}</p>
                {owned ? (
                  <Badge variant="success" className="text-[10px]">Registered</Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">Not registered</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
