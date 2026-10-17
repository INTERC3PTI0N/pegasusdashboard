'use client';

import { useActionState } from 'react';
import { AlertCircle } from 'lucide-react';
import { changePassword } from '@/app/account-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ChangePasswordForm({ forced }: { forced: boolean }) {
  const [state, action, pending] = useActionState(changePassword, undefined);
  return (
    <form action={action} className="space-y-4">
      {!forced && (
        <div className="space-y-2">
          <Label htmlFor="current">Current password</Label>
          <Input id="current" name="current" type="password" required autoComplete="current-password" />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
        <p className="text-xs text-muted-foreground">At least 8 characters.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Repeat new password</Label>
        <Input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" />
      </div>
      {state?.message && (
        <p className="flex items-center gap-2 text-sm text-destructive" role="alert">
          <AlertCircle className="size-4 shrink-0" /> {state.message}
        </p>
      )}
      <Button className="w-full" disabled={pending}>{pending ? 'Saving…' : 'Save password'}</Button>
    </form>
  );
}
