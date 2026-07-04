'use client';

import { useActionState } from 'react';
import { login } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertCircle } from 'lucide-react';

const demoAccounts = [
  { email: 'sofia@atelier-laurent.com', label: 'Sofia — owns Hard Rubber + Cellulose' },
  { email: 'marco@studio-rossi.it', label: 'Marco — owns Ecowood only' },
  { email: 'ava@chenhairlab.com', label: 'Ava — owns all three lines' },
  { email: 'admin@pegasus.com', label: 'Admin — customer tracking & CRM console' },
];

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@yoursalon.com"
            required
            autoComplete="email"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </div>
        {state?.error && (
          <p className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="size-4" /> {state.error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <div className="relative">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 mono-tag text-[9px] text-muted-foreground">
          Demo accounts
        </span>
      </div>

      <div className="space-y-2">
        {demoAccounts.map((acc) => (
          <form key={acc.email} action={formAction}>
            <input type="hidden" name="email" value={acc.email} />
            <input type="hidden" name="password" value="pegasus" />
            <Button
              type="submit"
              variant="outline"
              className="w-full justify-start text-left font-normal text-xs"
              disabled={pending}
            >
              {acc.label}
            </Button>
          </form>
        ))}
        <p className="text-[11px] text-muted-foreground pt-1">
          All demo accounts use the password <code className="font-mono">pegasus</code>.
        </p>
      </div>
    </div>
  );
}
