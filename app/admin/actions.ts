'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/access';
import {
  findUserById,
  updateProfile,
  setPassword,
  setSuspended,
  signOutEverywhere,
  deleteUser,
  grantEntitlement,
  revokeEntitlement,
  addNote,
  deleteNote,
  temporaryPassword,
  createStaff,
  setStaffRole,
  countOwners,
} from '@/lib/users';
import {
  setCourseProgress,
  issueCertificate,
  findCertificateFor,
  findCertificate,
  revokeCertificate,
  voidKeys,
  unvoidKey,
} from '@/lib/store';
import {
  getProduct,
  saveCourse,
  createCourse,
  moveCourse,
  courseUsage,
  deleteCourse,
} from '@/lib/courses';
import { audit } from '@/lib/site/store';
import { sanitize } from '@/lib/site/schema';
import { courseFields } from '@/lib/course-schema';
import type { Product } from '@/lib/catalog';
import type { AdminRole } from '@/lib/permissions';

export type Result = { ok: boolean; message: string; secret?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function customerOr404(id: string) {
  const user = await findUserById(id);
  if (!user || user.role !== 'customer') throw new Error('Customer not found');
  return user;
}

const refreshCustomer = (id: string) => {
  revalidatePath(`/admin/customers/${id}`);
  revalidatePath('/admin/customers');
  revalidatePath('/admin');
};

// ── Customer profile & account ──────────────────────────────────────────────

export async function updateCustomerProfile(id: string, form: FormData): Promise<Result> {
  const admin = await requireAdmin('customers');
  await customerOr404(id);
  const p = {
    name: String(form.get('name') ?? '').trim().slice(0, 100),
    salon: String(form.get('salon') ?? '').trim().slice(0, 120),
    email: String(form.get('email') ?? '').trim().slice(0, 200),
    phone: String(form.get('phone') ?? '').trim().slice(0, 40),
    country: String(form.get('country') ?? '').trim().slice(0, 80),
  };
  if (!p.name) return { ok: false, message: 'Name is required.' };
  if (!EMAIL.test(p.email)) return { ok: false, message: 'Enter a valid email address.' };
  if ((await updateProfile(id, p)) === 'email_taken') return { ok: false, message: 'Another account already uses that email.' };
  await audit(admin, 'customer.update_profile', p.email, { id });
  refreshCustomer(id);
  return { ok: true, message: 'Profile saved.' };
}

export async function resetCustomerPassword(id: string): Promise<Result> {
  const admin = await requireAdmin('customers');
  const user = await customerOr404(id);
  const temp = temporaryPassword();
  await setPassword(id, temp, true);
  await audit(admin, 'customer.reset_password', user.email, { id });
  refreshCustomer(id);
  return {
    ok: true,
    message: 'Temporary password created. Give it to the customer — they must choose a new one when they sign in. It is not shown again.',
    secret: temp,
  };
}

export async function setCustomerSuspended(id: string, suspended: boolean): Promise<Result> {
  const admin = await requireAdmin('customers');
  const user = await customerOr404(id);
  await setSuspended(id, suspended);
  await audit(admin, suspended ? 'customer.suspend' : 'customer.unsuspend', user.email, { id });
  refreshCustomer(id);
  return { ok: true, message: suspended ? 'Account suspended and signed out everywhere.' : 'Account re-activated.' };
}

export async function signCustomerOutEverywhere(id: string): Promise<Result> {
  const admin = await requireAdmin('customers');
  const user = await customerOr404(id);
  await signOutEverywhere(id);
  await audit(admin, 'customer.sign_out_everywhere', user.email, { id });
  return { ok: true, message: 'Signed out of every device.' };
}

export async function deleteCustomer(id: string, confirmEmail: string): Promise<Result> {
  const admin = await requireAdmin('customers');
  const user = await customerOr404(id);
  if (confirmEmail.trim().toLowerCase() !== user.email) return { ok: false, message: 'Type the customer’s email exactly to confirm.' };
  await deleteUser(id);
  await audit(admin, 'customer.delete', user.email, { id, entitlements: user.entitlements });
  revalidatePath('/admin/customers');
  redirect('/admin/customers?deleted=1');
}

// ── Products & progress ─────────────────────────────────────────────────────

export async function setCustomerProduct(id: string, slug: string, owned: boolean): Promise<Result> {
  const admin = await requireAdmin('customers');
  const user = await customerOr404(id);
  const product = await getProduct(slug);
  if (!product) return { ok: false, message: 'Unknown course.' };
  if (owned) await grantEntitlement(id, slug);
  else await revokeEntitlement(id, slug);
  await audit(admin, owned ? 'customer.grant_product' : 'customer.revoke_product', user.email, { id, product: slug });
  refreshCustomer(id);
  return { ok: true, message: owned ? `${product.name} unlocked.` : `${product.name} access removed (progress kept).` };
}

/** Override a customer's progress: 'complete' = every lesson done, 'reset' = none, or a lesson list. */
export async function overrideProgress(id: string, slug: string, lessons: 'complete' | 'reset' | string[]): Promise<Result> {
  const admin = await requireAdmin('customers');
  const user = await customerOr404(id);
  const product = await getProduct(slug);
  if (!product) return { ok: false, message: 'Unknown course.' };
  const valid = new Set(product.lessons.map((l) => l.id));
  const list = lessons === 'complete' ? [...valid] : lessons === 'reset' ? [] : lessons.filter((l) => valid.has(l));
  await setCourseProgress(id, slug, list);
  await audit(admin, 'customer.override_progress', user.email, { id, product: slug, completed: list.length, of: valid.size });
  refreshCustomer(id);
  return { ok: true, message: `Progress set to ${list.length}/${valid.size} lessons.` };
}

// ── Notes ───────────────────────────────────────────────────────────────────

export async function addCustomerNote(id: string, body: string): Promise<Result> {
  const admin = await requireAdmin('customers');
  await customerOr404(id);
  const text = body.trim().slice(0, 4000);
  if (!text) return { ok: false, message: 'Write a note first.' };
  await addNote(id, admin.name, text);
  refreshCustomer(id);
  return { ok: true, message: 'Note added.' };
}

export async function deleteCustomerNote(id: string, noteId: string): Promise<Result> {
  await requireAdmin('customers');
  if (!/^\d+$/.test(noteId)) return { ok: false, message: 'Unknown note.' };
  await deleteNote(id, noteId);
  refreshCustomer(id);
  return { ok: true, message: 'Note deleted.' };
}

// ── Certificates ────────────────────────────────────────────────────────────

/** Manually issue (or reissue after revocation) a customer's certificate, regardless of progress. */
export async function issueCertificateFor(id: string, slug: string): Promise<Result> {
  const admin = await requireAdmin('certificates');
  const user = await customerOr404(id);
  const product = await getProduct(slug);
  if (!product) return { ok: false, message: 'Unknown course.' };
  if (await findCertificateFor(id, slug)) return { ok: false, message: 'They already have an active certificate for this course.' };
  const cert = await issueCertificate({ userId: id, userName: user.name, salon: user.salon, productSlug: slug, productName: product.name });
  await audit(admin, 'certificate.issue', cert.id, { customer: user.email, product: slug });
  refreshCustomer(id);
  revalidatePath('/admin/certificates');
  return { ok: true, message: `Certificate ${cert.id} issued.` };
}

export async function revokeCertificateAction(certId: string, reason: string): Promise<Result> {
  const admin = await requireAdmin('certificates');
  const why = reason.trim().slice(0, 500);
  if (!why) return { ok: false, message: 'Give a reason — it is shown on the public verification page.' };
  const cert = await revokeCertificate(certId, why, admin.email);
  if (!cert) return { ok: false, message: 'Certificate not found or already revoked.' };
  await audit(admin, 'certificate.revoke', certId, { reason: why });
  refreshCustomer(cert.userId);
  revalidatePath('/admin/certificates');
  return { ok: true, message: `Certificate ${certId} revoked.` };
}

export async function reissueCertificateAction(certId: string): Promise<Result> {
  await requireAdmin('certificates');
  const old = await findCertificate(certId);
  if (!old || !old.revokedAt) return { ok: false, message: 'Only revoked certificates can be reissued.' };
  return issueCertificateFor(old.userId, old.productSlug);
}

// ── Product keys ────────────────────────────────────────────────────────────

export async function voidKeysAction(codes: string[]): Promise<Result> {
  const admin = await requireAdmin('keys');
  const list = codes.filter((c) => /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(c)).slice(0, 5000);
  const n = await voidKeys(list);
  await audit(admin, 'keys.void', `${n} key${n === 1 ? '' : 's'}`, { codes: list.slice(0, 50) });
  revalidatePath('/admin/keys');
  return { ok: true, message: n ? `Voided ${n} key${n === 1 ? '' : 's'}. Used keys are never voided.` : 'Nothing to void — those keys are used or already void.' };
}

export async function unvoidKeyAction(code: string): Promise<Result> {
  const admin = await requireAdmin('keys');
  if (!(await unvoidKey(code))) return { ok: false, message: 'Key not found.' };
  await audit(admin, 'keys.unvoid', code);
  revalidatePath('/admin/keys');
  return { ok: true, message: `${code} is redeemable again.` };
}

// ── Courses ─────────────────────────────────────────────────────────────────

export async function saveCourseAction(slug: string, data: unknown): Promise<Result> {
  const admin = await requireAdmin('courses');
  if (!(await getProduct(slug))) return { ok: false, message: 'Unknown course.' };
  const clean = sanitize(courseFields, data) as unknown as Omit<Product, 'slug'>;
  if (!clean.name) return { ok: false, message: 'The course needs a name.' };
  // Lesson IDs key customers' progress: fill missing ones, keep them unique.
  const seen = new Set<string>();
  clean.lessons = clean.lessons.map((l, i) => {
    let id = (l.id || l.title || `lesson-${i + 1}`).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || `lesson-${i + 1}`;
    while (seen.has(id)) id = `${id}-${i + 1}`;
    seen.add(id);
    return { ...l, id, ...(l.type === 'video' ? { guide: undefined } : { videoFile: undefined }) };
  });
  await saveCourse(slug, clean, admin.email);
  await audit(admin, 'course.save', slug, { lessons: clean.lessons.length });
  revalidatePath('/', 'layout');
  return { ok: true, message: 'Course saved — live for customers now.' };
}

export async function createCourseAction(form: FormData): Promise<Result> {
  const admin = await requireAdmin('courses');
  const name = String(form.get('name') ?? '').trim().slice(0, 100);
  const slug = String(form.get('slug') ?? '').trim().toLowerCase();
  if (!name) return { ok: false, message: 'Give the course a name.' };
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 40) {
    return { ok: false, message: 'The URL name may only use lowercase letters, numbers and dashes.' };
  }
  if (!(await createCourse(slug, name, admin.email))) return { ok: false, message: 'A course with that URL name already exists.' };
  await audit(admin, 'course.create', slug);
  revalidatePath('/', 'layout');
  redirect(`/admin/courses/${slug}`);
}

export async function moveCourseAction(slug: string, direction: -1 | 1): Promise<Result> {
  const admin = await requireAdmin('courses');
  await moveCourse(slug, direction);
  await audit(admin, 'course.reorder', slug);
  revalidatePath('/', 'layout');
  return { ok: true, message: 'Order saved.' };
}

export async function deleteCourseAction(slug: string): Promise<Result> {
  const admin = await requireAdmin('courses');
  const usage = await courseUsage(slug);
  if (usage.owners || usage.keys || usage.certificates) {
    return {
      ok: false,
      message: `Can't delete: ${usage.owners} customers own it, ${usage.keys} keys and ${usage.certificates} certificates reference it.`,
    };
  }
  await deleteCourse(slug);
  await audit(admin, 'course.delete', slug);
  revalidatePath('/', 'layout');
  redirect('/admin/courses');
}

// ── Staff ───────────────────────────────────────────────────────────────────

const ROLES: AdminRole[] = ['owner', 'editor', 'support'];

export async function addStaffAction(form: FormData): Promise<Result> {
  const admin = await requireAdmin('staff');
  const name = String(form.get('name') ?? '').trim().slice(0, 100);
  const email = String(form.get('email') ?? '').trim().toLowerCase().slice(0, 200);
  const adminRole = String(form.get('role')) as AdminRole;
  if (!name) return { ok: false, message: 'Enter their name.' };
  if (!EMAIL.test(email)) return { ok: false, message: 'Enter a valid email address.' };
  if (!ROLES.includes(adminRole)) return { ok: false, message: 'Pick a role.' };
  const temp = temporaryPassword();
  const user = await createStaff({ name, email, adminRole }, temp);
  if (!user) return { ok: false, message: 'An account with that email already exists.' };
  await audit(admin, 'staff.add', email, { role: adminRole });
  revalidatePath('/admin/staff');
  return {
    ok: true,
    message: `${name} added as ${adminRole}. Send them this temporary password — they choose their own when they first sign in. It is not shown again.`,
    secret: temp,
  };
}

async function staffOr404(id: string) {
  const user = await findUserById(id);
  if (!user || user.role !== 'admin') throw new Error('Staff member not found');
  return user;
}

/** Refuses changes that would leave nobody able to manage staff. */
async function wouldRemoveLastOwner(target: { adminRole: AdminRole | null; suspendedAt: Date | null }) {
  return target.adminRole === 'owner' && !target.suspendedAt && (await countOwners()) <= 1;
}

export async function setStaffRoleAction(id: string, role: AdminRole): Promise<Result> {
  const admin = await requireAdmin('staff');
  const user = await staffOr404(id);
  if (!ROLES.includes(role)) return { ok: false, message: 'Pick a role.' };
  if (role !== 'owner' && (await wouldRemoveLastOwner(user))) return { ok: false, message: 'There must always be at least one owner.' };
  await setStaffRole(id, role);
  await signOutEverywhere(id); // new permissions apply from their next sign-in
  await audit(admin, 'staff.set_role', user.email, { role });
  revalidatePath('/admin/staff');
  return { ok: true, message: `${user.name} is now ${role}.` };
}

export async function resetStaffPassword(id: string): Promise<Result> {
  const admin = await requireAdmin('staff');
  const user = await staffOr404(id);
  const temp = temporaryPassword();
  await setPassword(id, temp, true);
  await audit(admin, 'staff.reset_password', user.email);
  revalidatePath('/admin/staff');
  return { ok: true, message: `Temporary password for ${user.name} (shown once):`, secret: temp };
}

export async function setStaffSuspended(id: string, suspended: boolean): Promise<Result> {
  const admin = await requireAdmin('staff');
  const user = await staffOr404(id);
  if (id === admin.id) return { ok: false, message: 'You can’t suspend yourself.' };
  if (suspended && (await wouldRemoveLastOwner(user))) return { ok: false, message: 'There must always be at least one active owner.' };
  await setSuspended(id, suspended);
  await audit(admin, suspended ? 'staff.suspend' : 'staff.unsuspend', user.email);
  revalidatePath('/admin/staff');
  return { ok: true, message: suspended ? `${user.name} suspended.` : `${user.name} re-activated.` };
}

export async function removeStaff(id: string): Promise<Result> {
  const admin = await requireAdmin('staff');
  const user = await staffOr404(id);
  if (id === admin.id) return { ok: false, message: 'You can’t remove yourself.' };
  if (await wouldRemoveLastOwner(user)) return { ok: false, message: 'There must always be at least one owner.' };
  await deleteUser(id);
  await audit(admin, 'staff.remove', user.email);
  revalidatePath('/admin/staff');
  return { ok: true, message: `${user.name}'s admin account was deleted.` };
}
