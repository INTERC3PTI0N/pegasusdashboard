import 'server-only';
import { redirect } from 'next/navigation';
import { getCurrentUser } from './auth';
import { getProduct } from './courses';
import type { Product } from './catalog';
import type { User } from './users';
import { can, type Permission } from './permissions';
import { kitAccess, type Access } from './kits';

/** Require a signed-in user or bounce to /login. Enforces a pending password change. */
export async function requireUser({ allowPasswordChange = false } = {}): Promise<User> {
  const user = await getCurrentUser();
  // A stale cookie (deleted/suspended account, rotated secret) would loop with the middleware's
  // /login -> /dashboard redirect, so clear it via /logout instead.
  if (!user) redirect('/logout');
  if (user.mustChangePassword && !allowPasswordChange) redirect('/change-password');
  return user;
}

/** Require a signed-in customer; admins are sent to their own console. */
export async function requireCustomer(): Promise<User> {
  const user = await requireUser();
  if (user.role === 'admin') redirect('/admin');
  return user;
}

/**
 * Require an admin; customers are bounced back to their dashboard. With a permission,
 * staff whose role lacks it are sent to the admin overview instead.
 */
export async function requireAdmin(permission?: Permission): Promise<User> {
  const user = await requireUser();
  if (user.role !== 'admin') redirect('/dashboard');
  if (permission && !can(user.adminRole, permission)) redirect('/admin?forbidden=1');
  return user;
}

export function accessFor(user: User): Access {
  return kitAccess(user.kits);
}

/**
 * Course gate: any registered kit (even an expired Essential) may open the course page and see
 * what is locked; each lesson is then checked with canOpenLesson(). Customers with no kit are
 * sent to register one — course content is never rendered for them.
 */
export async function requireCourse(slug: string): Promise<{ user: User; product: Product; access: Access }> {
  const user = await requireCustomer();
  const product = await getProduct(slug);
  const access = accessFor(user);
  if (!product || !access.anyKit) redirect('/register-kit');
  return { user, product, access };
}
