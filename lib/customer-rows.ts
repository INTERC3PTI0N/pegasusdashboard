import 'server-only';
import { getCustomers, type User } from './users';
import { getEveryonesProgress, getAllCertificates } from './store';
import { getProducts } from './courses';
import type { Product } from './catalog';

export interface CustomerRow {
  user: User;
  owned: Product[];
  done: number;
  total: number;
  percent: number;
  certificates: number;
}

export interface CustomerFilter {
  q?: string;
  product?: string;
  status?: string; // active | suspended | unregistered | completed
  sort?: string; // joined | seen | progress | name
}

/** Customers joined with progress + certificates, filtered and sorted for the admin list and CSV. */
export async function customerRows(f: CustomerFilter = {}): Promise<{ rows: CustomerRow[]; products: Product[] }> {
  const [customers, progress, certs, products] = await Promise.all([
    getCustomers(),
    getEveryonesProgress(),
    getAllCertificates(),
    getProducts(),
  ]);

  let rows = customers.map((user) => {
    const owned = products.filter((p) => user.entitlements.includes(p.slug));
    const total = owned.reduce((s, p) => s + p.lessons.length, 0);
    const done = owned.reduce(
      (s, p) => s + (progress[user.id]?.[p.slug] ?? []).filter((id) => p.lessons.some((l) => l.id === id)).length,
      0
    );
    return {
      user,
      owned,
      done,
      total,
      percent: total ? Math.round((done / total) * 100) : 0,
      certificates: certs.filter((c) => c.userId === user.id && !c.revokedAt).length,
    };
  });

  const q = f.q?.trim().toLowerCase();
  if (q) {
    rows = rows.filter(({ user: u }) =>
      [u.name, u.email, u.salon, u.country, u.phone].some((x) => x.toLowerCase().includes(q))
    );
  }
  if (f.product) rows = rows.filter((r) => r.user.entitlements.includes(f.product!));
  if (f.status === 'active') rows = rows.filter((r) => !r.user.suspendedAt);
  if (f.status === 'suspended') rows = rows.filter((r) => r.user.suspendedAt);
  if (f.status === 'unregistered') rows = rows.filter((r) => r.owned.length === 0);
  if (f.status === 'completed') rows = rows.filter((r) => r.total > 0 && r.done === r.total);

  const time = (d: Date | null) => d?.getTime() ?? 0;
  const sorters: Record<string, (a: CustomerRow, b: CustomerRow) => number> = {
    joined: (a, b) => time(b.user.createdAt) - time(a.user.createdAt),
    seen: (a, b) => time(b.user.lastSeenAt) - time(a.user.lastSeenAt),
    progress: (a, b) => b.percent - a.percent,
    name: (a, b) => a.user.name.localeCompare(b.user.name),
  };
  rows.sort(sorters[f.sort ?? 'joined'] ?? sorters.joined);
  return { rows, products };
}

export function relativeTime(d: Date | null): string {
  if (!d) return 'Never';
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 5) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
