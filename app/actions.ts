'use server';

import { randomBytes } from 'crypto';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { findUserForLogin, createCustomer } from '@/lib/users';
import { verifyPassword } from '@/lib/password';
import { setSession, clearSession, getCurrentUser } from '@/lib/auth';
import { ownsProduct, requireAdmin, requireCustomer } from '@/lib/access';
import { getProduct } from '@/lib/catalog';
import {
  setLessonComplete,
  getCompletedLessons,
  issueCertificate,
  findCertificateFor,
  addProductKeys,
  redeemProductKey,
} from '@/lib/store';

type FormState = { error?: string } | undefined;

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const found = await findUserForLogin(email);
  if (!found || !verifyPassword(password, found.passwordHash)) {
    return { error: 'Invalid email or password.' };
  }
  await setSession(found.user.id);
  redirect(found.user.role === 'admin' ? '/admin' : '/dashboard');
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

  const user = await createCustomer({ name, salon, email, password });
  if (!user) return fail('An account with this email already exists. Sign in instead.');
  await setSession(user.id);
  redirect('/register-product');
}

export async function logout() {
  await clearSession();
  redirect('/login');
}

export async function toggleLessonComplete(productSlug: string, lessonId: string, complete: boolean) {
  const user = await getCurrentUser();
  if (!user || !ownsProduct(user, productSlug)) return; // entitlement gate on mutation too
  const product = getProduct(productSlug);
  if (!product || !product.lessons.some((l) => l.id === lessonId)) return;
  await setLessonComplete(user.id, productSlug, lessonId, complete);
  revalidatePath('/dashboard');
  revalidatePath(`/products/${productSlug}`);
  revalidatePath(`/products/${productSlug}/lessons/${lessonId}`);
  revalidatePath('/certificates');
}

export async function generateCertificate(productSlug: string) {
  const user = await getCurrentUser();
  if (!user || !ownsProduct(user, productSlug)) return;
  const product = getProduct(productSlug);
  if (!product) return;

  // Only issue when every lesson is complete
  const done = new Set(await getCompletedLessons(user.id, productSlug));
  if (!product.lessons.every((l) => done.has(l.id))) return;

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

// ── Product keys ────────────────────────────────────────────────────────────

const CODE_RE = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

/** Accepts "abcd efgh ijkl", "ABCDEFGHIJKL" etc. and returns "ABCD-EFGH-IJKL" (or the raw input if not 12 chars). */
function normalizeKey(raw: string): string {
  const chars = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return chars.length === 12 ? `${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8)}` : raw.toUpperCase();
}

export async function redeemKey(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireCustomer();
  const code = normalizeKey(String(formData.get('key') ?? '').trim());
  if (!CODE_RE.test(code)) return { error: 'Product keys look like XXXX-XXXX-XXXX.' };

  const result = await redeemProductKey(user, code);
  if (!result.ok) {
    return {
      error: {
        invalid: 'That product key is not valid. Check it against your product card.',
        used: 'That product key has already been used.',
        owned: 'You already have this product unlocked — the key was not used.',
      }[result.error],
    };
  }
  revalidatePath('/', 'layout');
  redirect(`/products/${result.productSlug}?welcome=1`);
}

export type UploadResult = {
  added: number;
  duplicates: number;
  invalid: string[];
  generated?: string[];
  error?: string;
};

// No 0/O/1/I so printed keys can't be misread.
const KEY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateKeys(count: number): string[] {
  return Array.from({ length: count }, () => {
    const chars = Array.from(randomBytes(12), (b) => KEY_ALPHABET[b % KEY_ALPHABET.length]).join('');
    return `${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8)}`;
  });
}

export async function uploadProductKeys(_prev: UploadResult | undefined, formData: FormData): Promise<UploadResult> {
  await requireAdmin();
  const productSlug = String(formData.get('product') ?? '');
  if (!getProduct(productSlug)) return { added: 0, duplicates: 0, invalid: [], error: 'Pick a product.' };

  if (formData.get('intent') === 'generate') {
    const count = Math.floor(Number(formData.get('count')));
    if (!(count >= 1 && count <= 1000)) return { added: 0, duplicates: 0, invalid: [], error: 'Generate between 1 and 1000 keys.' };
    const codes = generateKeys(count);
    const added = await addProductKeys(codes, productSlug);
    revalidatePath('/admin/keys');
    return { added, duplicates: codes.length - added, invalid: [], generated: codes };
  }

  const file = formData.get('file');
  const text = `${formData.get('codes') ?? ''}\n${file instanceof File ? await file.text() : ''}`;
  const tokens = text.split(/[\s,;]+/).map((t) => t.trim().toUpperCase()).filter(Boolean);
  const valid = tokens.filter((t) => CODE_RE.test(t));
  const invalid = tokens.filter((t) => !CODE_RE.test(t));
  if (valid.length === 0) return { added: 0, duplicates: 0, invalid, error: 'No valid codes found.' };

  const added = await addProductKeys(valid, productSlug);
  revalidatePath('/admin/keys');
  return { added, duplicates: valid.length - added, invalid };
}
