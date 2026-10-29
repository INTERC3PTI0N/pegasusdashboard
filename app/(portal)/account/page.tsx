import Link from 'next/link';
import { KeyRound } from 'lucide-react';
import { requireCustomer } from '@/lib/access';
import { Card, CardContent } from '@/components/ui/card';
import { ProfileForm } from './profile-form';

export const dynamic = 'force-dynamic';

/** "14th OCTOBER 2026" */
function memberSince(d: Date) {
  const day = d.getDate();
  const suffix = day % 10 === 1 && day !== 11 ? 'st' : day % 10 === 2 && day !== 12 ? 'nd' : day % 10 === 3 && day !== 13 ? 'rd' : 'th';
  return `${day}${suffix} ${d.toLocaleDateString('en-GB', { month: 'long' }).toUpperCase()} ${d.getFullYear()}`;
}

export default async function AccountPage() {
  const user = await requireCustomer();
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <p className="mono-tag text-[10px] text-primary mb-2">Account</p>
        <h1 className="editorial-text text-4xl">My account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Member since {memberSince(user.createdAt)}
        </p>
      </div>
      <Card>
        <CardContent>
          <ProfileForm profile={{ name: user.name, email: user.email, salon: user.salon, phone: user.phone, country: user.country }} />
        </CardContent>
      </Card>
      <Link href="/change-password" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
        <KeyRound className="size-4" /> Change password
      </Link>
    </div>
  );
}
