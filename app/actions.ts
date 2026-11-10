'use server';

import { randomBytes } from 'crypto';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { findUserForLogin, createCustomer } from '@/lib/users';
import { verifyPassword } from '@/lib/password';
import { setSession, clearSession, getCurrentUser } from '@/lib/auth';
import { accessFor, requireAdmin, requireCustomer } from '@/lib/access';
import { canOpenLesson, isKitId } from '@/lib/kits';
import { getProduct } from '@/lib/courses';
import { audit } from '@/lib/site/store';
import {
  setLessonComplete,
  getCompletedLessons,
  issueCertificate,
  findCertificateFor,
  hasRevokedCertificate,
  addProductKeys,
  redeemKitKey,
  peekKitKey,
} from '@/lib/store';
import {
  KEY_RE,
  REDEEM_ERRORS,
  finishRegistration,
  normalizeKey,
  registerWithPendingCode,
  setPendingCode,
} from '@/lib/registration';

type FormState = { error?: string } | undefined;

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const found = await findUserForLogin(email);
  if (!found || !verifyPassword(password, found.passwordHash)) {
    return { error: 'Invalid email or password.' };
  }
  if (found.user.suspendedAt) {
    return { error: 'This account has been suspended. Please contact Pegasus support.' };
  }
  await setSession(found.user);
  // Straight to the password page after a temporary password (a second redirect hop from the
  // destination page can leave the client on a blank screen).
  if (found.user.mustChangePassword) redirect('/change-password');
  // A customer who entered a kit code before signing in gets it redeemed now.
  redirect(await finishRegistration(found.user));
}

type SignupState = { error: string; values: { name: string; salon: string; email: string } } | undefined;

export async function signup(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const name = String(formData.get('name') ?? '').trim();
  const salon = String(formData.get('salon') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const fail = (error: string) => ({ error, values: { name, salon, email } });

  if (!name || name.length > 100) return fail('Enter your full name.');
  if (salon.length > 120) return fail('Salon name is too long.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return fail('Enter a valid email address.');
  if (password.length < 8 || password.length > 200) return fail('Password must be at least 8 characters.');

  // No account without a kit code: created and redeemed together (see /start).
  const reg = await registerWithPendingCode(() => createCustomer({ name, salon, email, password }));
  if (!reg.ok) {
    if (reg.error === 'no_code') redirect('/start');
    return fail(
      reg.error === 'taken'
        ? 'An account with this email already exists. Sign in instead — your kit code will be added to it.'
        : REDEEM_ERRORS[reg.error]
    );
  }
  await setSession(reg.user);
  revalidatePath('/', 'layout');
  redirect(`/dashboard?registered=${reg.kit}`);
}

/**
 * The "Enter code" step (/start). Signed-in customers redeem straight away; everyone else has the code
 * checked (not spent) and kept for the "Create account" step.
 */
export async function startWithCode(_prev: FormState, formData: FormData): Promise<FormState> {
  const code = normalizeKey(String(formData.get('key') ?? '').trim());
  if (!KEY_RE.test(code)) return { error: 'Kit codes are 16 letters and numbers, like AB12CD34EF56GH78.' };

  const user = await getCurrentUser();
  if (user?.role === 'customer') {
    const result = await redeemKitKey(user, code);
    if (!result.ok) return { error: REDEEM_ERRORS[result.error] };
    revalidatePath('/', 'layout');
    redirect(`/dashboard?registered=${result.kit}`);
  }

  const check = await peekKitKey(code);
  if (!check.ok) return { error: REDEEM_ERRORS[check.error] };
  await setPendingCode(code);
  redirect(`/signup?kit=${check.kit}`);
}

export async function logout() {
  await clearSession();
  redirect('/login');
}

export async function toggleLessonComplete(productSlug: string, lessonId: string, complete: boolean) {
  const user = await getCurrentUser();
  if (!user) return;
  const lesson = (await getProduct(productSlug))?.lessons.find((l) => l.id === lessonId);
  // Kit gate on mutation too: only lessons the customer's kit opens can be ticked.
  if (!lesson || !canOpenLesson(accessFor(user), lesson.tier)) return;
  await setLessonComplete(user.id, productSlug, lessonId, complete);
  revalidatePath('/dashboard');
  revalidatePath(`/courses/${productSlug}`, 'layout');
  revalidatePath('/certificates');
}

export async function generateCertificate(productSlug: string) {
  const user = await getCurrentUser();
  // The Mastery Certificate comes with the Mastery Kit only.
  if (!user || !accessFor(user).mastery) return;
  const product = await getProduct(productSlug);
  if (!product) return;

  // Only issue when every lesson is complete
  const done = new Set(await getCompletedLessons(user.id, productSlug));
  if (!product.lessons.every((l) => done.has(l.id))) return;
  // A revoked certificate is only replaced by an admin reissue, never by self-claiming.
  if (!(await findCertificateFor(user.id, productSlug)) && (await hasRevokedCertificate(user.id, productSlug))) return;

  const cert =
    (await findCertificateFor(user.id, productSlug)) ??
    (await issueCertificate({
      userId: user.id,
      userName: user.name,
      salon: user.salon,
      productSlug: product.slug,
      productName: product.name,
    }));

  revalidatePath('/certificates');
  redirect(`/certificates/${cert.id}`);
}

// ── Kit keys ────────────────────────────────────────────────────────────────

const CODE_RE = KEY_RE;

export async function redeemKey(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireCustomer();
  const code = normalizeKey(String(formData.get('key') ?? '').trim());
  if (!CODE_RE.test(code)) return { error: 'Kit codes are 16 letters and numbers, like AB12CD34EF56GH78.' };

  const result = await redeemKitKey(user, code);
  if (!result.ok) return { error: REDEEM_ERRORS[result.error] };
  revalidatePath('/', 'layout');
  redirect(`/dashboard?registered=${result.kit}`);
}

export type UploadResult = {
  added: number;
  duplicates: number;
  invalid: string[];
  generated?: string[];
  error?: string;
};

// Same style as the kit cards (AB12CD34EF56GH78), without I/O/0/1 so printed keys can't be misread.
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '23456789';

function generateKeys(count: number): string[] {
  return Array.from({ length: count }, () => {
    return Array.from(randomBytes(16), (b, i) => (i % 4 < 2 ? LETTERS[b % LETTERS.length] : DIGITS[b % DIGITS.length])).join('');
  });
}

export async function uploadProductKeys(_prev: UploadResult | undefined, formData: FormData): Promise<UploadResult> {
  const admin = await requireAdmin('keys');
  const productSlug = String(formData.get('product') ?? ''); // the kit this batch unlocks
  const batch = String(formData.get('batch') ?? '').trim().slice(0, 80);
  if (!isKitId(productSlug)) return { added: 0, duplicates: 0, invalid: [], error: 'Pick a kit.' };

  if (formData.get('intent') === 'generate') {
    const count = Math.floor(Number(formData.get('count')));
    if (!(count >= 1 && count <= 1000)) return { added: 0, duplicates: 0, invalid: [], error: 'Generate between 1 and 1000 keys.' };
    const codes = generateKeys(count);
    const added = await addProductKeys(codes, productSlug, batch);
    await audit(admin, 'keys.generate', productSlug, { count: added, batch });
    revalidatePath('/admin/keys');
    return { added, duplicates: codes.length - added, invalid: [], generated: codes };
  }

  const file = formData.get('file');
  const text = `${formData.get('codes') ?? ''}\n${file instanceof File ? await file.text() : ''}`;
  const tokens = text.split(/[\s,;]+/).map((t) => normalizeKey(t.trim())).filter(Boolean);
  const valid = tokens.filter((t) => CODE_RE.test(t));
  const invalid = tokens.filter((t) => !CODE_RE.test(t));
  if (valid.length === 0) return { added: 0, duplicates: 0, invalid, error: 'No valid codes found.' };

  const added = await addProductKeys(valid, productSlug, batch);
  await audit(admin, 'keys.upload', productSlug, { count: added, batch });
  revalidatePath('/admin/keys');
  return { added, duplicates: valid.length - added, invalid };
}
