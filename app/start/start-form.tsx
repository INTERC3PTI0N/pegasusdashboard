'use client';

import { useActionState } from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { startWithCode } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function StartForm({ initialCode, notice }: { initialCode: string; notice?: string }) {
  const [state, action, pending] = useActionState(startWithCode, undefined);
  const error = state?.error ?? notice;

  return (
    <form action={action} className="space-y-3">
      <Label htmlFor="key">Kit code</Label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          id="key"
          name="key"
          required
          defaultValue={initialCode}
          autoComplete="off"
          spellCheck={false}
          placeholder="AB12CD34EF56GH78"
          maxLength={24}
          className="font-mono uppercase tracking-widest"
          autoFocus={!initialCode}
        />
        <Button type="submit" disabled={pending} className="sm:w-44">
          {pending ? 'Checking…' : 'Continue'} <ArrowRight />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Each code can be used only once.</p>
      {error && (
        <p className="flex items-center gap-2 text-sm text-destructive" role="alert">
          <AlertCircle className="size-4 shrink-0" /> {error}
        </p>
      )}
    </form>
  );
}
