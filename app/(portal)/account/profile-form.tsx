'use client';

import { useActionState } from 'react';
import { updateOwnProfile } from '@/app/account-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const FIELDS = [
  ['name', 'Full name', 'name'],
  ['email', 'Email', 'email'],
  ['salon', 'Salon / studio', 'organization'],
  ['phone', 'Phone', 'tel'],
  ['country', 'Country', 'country-name'],
] as const;

export function ProfileForm({ profile }: { profile: Record<(typeof FIELDS)[number][0], string> }) {
  const [state, action, pending] = useActionState(updateOwnProfile, undefined);
  return (
    <form action={action} className="space-y-4">
      {FIELDS.map(([name, label, auto]) => (
        <div key={name} className="space-y-1.5">
          <Label htmlFor={name}>{label}</Label>
          <Input id={name} name={name} defaultValue={profile[name]} type={name === 'email' ? 'email' : 'text'} autoComplete={auto} />
        </div>
      ))}
      <Button disabled={pending}>{pending ? 'Saving…' : 'Save changes'}</Button>
      {state?.message && (
        <p role="status" className={`text-sm ${state.ok ? '' : 'text-destructive'}`}>{state.message}</p>
      )}
    </form>
  );
}
