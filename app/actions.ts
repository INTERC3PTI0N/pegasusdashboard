'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { findUserByEmail } from '@/lib/users';
import { setSession, clearSession, getCurrentUser } from '@/lib/auth';
import { ownsProduct } from '@/lib/access';
import { getProduct } from '@/lib/catalog';
import {
  setLessonComplete,
  getCompletedLessons,
  issueCertificate,
  findCertificateFor,
} from '@/lib/store';

export async function login(_prev: { error?: string } | undefined, formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const user = findUserByEmail(email);
  if (!user || user.password !== password) {
    return { error: 'Invalid email or password.' };
  }
  await setSession(user.id);
  redirect(user.role === 'admin' ? '/admin' : '/dashboard');
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
  setLessonComplete(user.id, productSlug, lessonId, complete);
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
  const done = new Set(getCompletedLessons(user.id, productSlug));
  const allComplete = product.lessons.every((l) => done.has(l.id));
  if (!allComplete) return;

  const existing = findCertificateFor(user.id, productSlug);
  const cert =
    existing ??
    issueCertificate({
      userId: user.id,
      userName: user.name,
      salon: user.salon,
      productSlug: product.slug,
      productName: product.name,
    });

  revalidatePath('/certificates');
  redirect(`/certificates/${cert.id}`);
}
