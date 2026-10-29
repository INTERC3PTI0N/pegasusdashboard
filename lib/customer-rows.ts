import 'server-only';
import { getCustomers, type User } from './users';
import { getEveryonesProgress, getAllCertificates } from './store';
import { getProducts } from './courses';
import type { Product } from './catalog';
import { kitAccess, type Access } from './kits';
import { courseView } from './course-view';

export interface CustomerRow {
  user: User;
  access: Access;
  /** 'Mastery' | 'Essential' | 'Essential (expired)' | '' */
  kitLabel: string;
  owned: Product[];
  done: number;
  total: number;
  percent: number;
  certificates: number;
}

export interface CustomerFilter {
  q?: string;
  kit?: string; // mastery | essential (active, without mastery) | expired | none
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
    const access = kitAccess(user.kits);
    const owned = access.anyKit ? products : [];
    // Progress over the modules their kit opens.
    const views = owned.map((p) => courseView(p, access, progress[user.id]?.[p.slug]));
    const total = views.reduce((s, v) => s + v.open, 0);
    const done = views.reduce((s, v) => s + v.done, 0);
    const kitLabel = access.mastery ? 'Mastery' : access.essential ? 'Essential' : access.essentialExpired ? 'Essential (expired)' : '';
    return {
      user,
      access,
      kitLabel,
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
  if (f.kit === 'mastery') rows = rows.filter((r) => r.access.mastery);
  if (f.kit === 'essential') rows = rows.filter((r) => r.access.essential && !r.access.mastery);
  if (f.kit === 'expired') rows = rows.filter((r) => r.access.essentialExpired && !r.access.mastery);
  if (f.kit === 'none') rows = rows.filter((r) => !r.access.anyKit);
  if (f.status === 'active') rows = rows.filter((r) => !r.user.suspendedAt);
  if (f.status === 'suspended') rows = rows.filter((r) => r.user.suspendedAt);
  if (f.status === 'unregistered') rows = rows.filter((r) => !r.access.anyKit);
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
