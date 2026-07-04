import 'server-only';
import { redirect } from 'next/navigation';
import { getCurrentUser } from './auth';
import { getProduct, type Product } from './catalog';
import type { User } from './users';

/** Require a signed-in user or bounce to /login. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

/** Require a signed-in customer; admins are sent to their own console. */
export async function requireCustomer(): Promise<User> {
  const user = await requireUser();
  if (user.role === 'admin') redirect('/admin');
  return user;
}

/** Require an admin; customers are bounced back to their dashboard. */
export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== 'admin') redirect('/dashboard');
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
  const product = getProduct(productSlug);
  if (!product || !ownsProduct(user, product.slug)) {
    redirect('/dashboard?denied=1');
  }
  return { user, product };
}
