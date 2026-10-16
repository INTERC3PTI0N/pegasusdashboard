'use client';

import { useActionState } from 'react';
import { AlertCircle, KeyRound } from 'lucide-react';
import { redeemKey } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function RedeemForm() {
  const [state, action, pending] = useActionState(redeemKey, undefined);

  return (
    <form action={action} className="space-y-3">
      <Label htmlFor="key">Product key</Label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          id="key"
          name="key"
          required
          autoComplete="off"
          spellCheck={false}
          placeholder="XXXX-XXXX-XXXX"
          maxLength={20}
          className="font-mono uppercase tracking-widest"
        />
        <Button type="submit" disabled={pending} className="sm:w-44">
          <KeyRound /> {pending ? 'Checking…' : 'Unlock product'}
        </Button>
      </div>
      {state?.error && (
        <p className="flex items-center gap-2 text-sm text-destructive" role="alert">
          <AlertCircle className="size-4 shrink-0" /> {state.error}
        </p>
      )}
    </form>
  );
}
