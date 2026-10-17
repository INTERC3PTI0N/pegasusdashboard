'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireUser, requireCustomer } from '@/lib/access';
import { setSession } from '@/lib/auth';
import { findUserById, findUserForLogin, setPassword, updateProfile } from '@/lib/users';
import { verifyPassword } from '@/lib/password';

type State = { ok?: boolean; message?: string } | undefined;

export async function changePassword(_prev: State, form: FormData): Promise<State> {
  const user = await requireUser({ allowPasswordChange: true });
  const current = String(form.get('current') ?? '');
  const next = String(form.get('password') ?? '');
  const confirm = String(form.get('confirm') ?? '');

  // A forced change (after a temporary password) doesn't ask for the temporary one again.
  if (!user.mustChangePassword) {
    const found = await findUserForLogin(user.email);
    if (!found || !verifyPassword(current, found.passwordHash)) return { message: 'Your current password is incorrect.' };
  }
  if (next.length < 8 || next.length > 200) return { message: 'Choose a password of at least 8 characters.' };
  if (next !== confirm) return { message: 'The two new passwords don’t match.' };

  await setPassword(user.id, next, false); // also signs out every other device
  const fresh = await findUserById(user.id);
  if (fresh) await setSession(fresh); // keep this device signed in with the new session version
  redirect(user.role === 'admin' ? '/admin' : '/dashboard?password=changed');
}

export async function updateOwnProfile(_prev: State, form: FormData): Promise<State> {
  const user = await requireCustomer();
  const p = {
    name: String(form.get('name') ?? '').trim().slice(0, 100),
    salon: String(form.get('salon') ?? '').trim().slice(0, 120),
    email: String(form.get('email') ?? '').trim().slice(0, 200),
    phone: String(form.get('phone') ?? '').trim().slice(0, 40),
    country: String(form.get('country') ?? '').trim().slice(0, 80),
  };
  if (!p.name) return { message: 'Enter your name.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) return { message: 'Enter a valid email address.' };
  if ((await updateProfile(user.id, p)) === 'email_taken') return { message: 'Another account already uses that email.' };
  revalidatePath('/', 'layout');
  return { ok: true, message: 'Saved. New certificates will use your updated name.' };
}
