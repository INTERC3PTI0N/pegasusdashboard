import Image from 'next/image';
import Link from 'next/link';
import { requireUser } from '@/lib/access';
import { ChangePasswordForm } from './form';

export const dynamic = 'force-dynamic';

export default async function ChangePasswordPage() {
  const user = await requireUser({ allowPasswordChange: true });
  const forced = user.mustChangePassword;

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-mist px-4 py-12">
      <Image src="/images/pegasus-logo.png" alt="Pegasus" width={130} height={36} className="mb-8 h-8 w-auto" priority />
      <div className="lux-card w-full max-w-sm space-y-6 rounded-xl p-8">
        <div>
          <p className="mono-tag mb-1 text-[10px] text-primary">{forced ? 'Welcome' : 'Account'}</p>
          <h1 className="editorial-text text-2xl">{forced ? 'Choose your password' : 'Change password'}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {forced
              ? `Signed in as ${user.email} with a temporary password. Set your own to continue.`
              : 'You will stay signed in here and be signed out on other devices.'}
          </p>
        </div>
        <ChangePasswordForm forced={forced} />
        {!forced && (
          <Link href={user.role === 'admin' ? '/admin' : '/dashboard'} className="block text-center text-sm text-muted-foreground hover:text-foreground">
            Cancel
          </Link>
        )}
      </div>
    </div>
  );
}
