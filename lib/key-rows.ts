import 'server-only';
import { getProductKeys, type ProductKey } from './store';

export type KeyStatus = 'available' | 'used' | 'voided';

export const keyStatus = (k: ProductKey): KeyStatus => (k.usedBy ? 'used' : k.voidedAt ? 'voided' : 'available');

export interface KeyFilter {
  status?: string; // available | used | voided ('unused' is accepted for old links)
  product?: string;
  batch?: string;
  q?: string;
}

/** Product keys filtered for the admin table and its CSV export. */
export async function keyRows(f: KeyFilter) {
  const all = await getProductKeys();
  const status = f.status === 'unused' ? 'available' : f.status;
  const q = f.q?.trim().toUpperCase();
  const keys = all.filter(
    (k) =>
      (!f.product || k.productSlug === f.product) &&
      (!status || keyStatus(k) === status) &&
      (!f.batch || k.batch === f.batch) &&
      (!q || k.code.includes(q) || (k.usedByEmail ?? '').toUpperCase().includes(q))
  );
  const batches = [...new Set(all.map((k) => k.batch).filter(Boolean))].sort();
  const counts = {
    all: all.length,
    available: all.filter((k) => keyStatus(k) === 'available').length,
    used: all.filter((k) => keyStatus(k) === 'used').length,
    voided: all.filter((k) => keyStatus(k) === 'voided').length,
  };
  return { keys, batches, counts, status: status ?? '' };
}
