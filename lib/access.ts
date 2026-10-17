import 'server-only';
import { redirect } from 'next/navigation';
import { getCurrentUser } from './auth';
import { getProduct } from './courses';
import type { Product } from './catalog';
import type { User } from './users';
import { can, type Permission } from './permissions';

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

export function ownsProduct(user: User, productSlug: string): boolean {
  return user.entitlements.includes(productSlug);
}

/**
 * Entitlement gate: the content of a product is only reachable by that
 * product's purchasers. Anyone else gets a 404-style denial (redirect to
 * dashboard) — the content is never rendered for them.
 */
export async function requireProductAccess(productSlug: string): Promise<{ user: User; product: Product }> {
  const user = await requireCustomer();
  const product = await getProduct(productSlug);
  if (!product || !ownsProduct(user, product.slug)) {
    redirect('/dashboard?denied=1');
  }
  return { user, product };
}
