import { requireAdmin } from '@/lib/access';
import { keyRows, keyStatus } from '@/lib/key-rows';
import { getProducts } from '@/lib/courses';
import { audit } from '@/lib/site/store';
import { toCsv, csvResponse } from '@/lib/csv';

/** Keys matching the current filters — e.g. one batch of available keys for printing on cards. */
export async function GET(request: Request) {
  const admin = await requireAdmin('keys');
  const p = new URL(request.url).searchParams;
  const filter = { status: p.get('status') ?? '', product: p.get('product') ?? '', batch: p.get('batch') ?? '', q: p.get('q') ?? '' };
  const [{ keys }, products] = await Promise.all([keyRows(filter), getProducts()]);
  const csv = toCsv([
    ['Key', 'Course', 'Course ID', 'Batch', 'Status', 'Redeemed by', 'Redeemed at', 'Added'],
    ...keys.map((k) => [
      k.code,
      products.find((x) => x.slug === k.productSlug)?.name ?? k.productSlug,
      k.productSlug,
      k.batch,
      keyStatus(k),
      k.usedByEmail ?? '',
      k.usedAt ?? '',
      k.addedAt,
    ]),
  ]);
  await audit(admin, 'keys.export', `${keys.length} key${keys.length === 1 ? '' : 's'}`, filter);
  return csvResponse(csv, 'pegasus-product-keys');
}
