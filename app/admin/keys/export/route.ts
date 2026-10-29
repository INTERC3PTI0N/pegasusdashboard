import { requireAdmin } from '@/lib/access';
import { keyRows, keyStatus } from '@/lib/key-rows';
import { KITS, isKitId } from '@/lib/kits';
import { audit } from '@/lib/site/store';
import { toCsv, csvResponse } from '@/lib/csv';

/** Keys matching the current filters — e.g. one batch of available keys for printing on cards. */
export async function GET(request: Request) {
  const admin = await requireAdmin('keys');
  const p = new URL(request.url).searchParams;
  const filter = { status: p.get('status') ?? '', product: p.get('product') ?? '', batch: p.get('batch') ?? '', q: p.get('q') ?? '' };
  const { keys } = await keyRows(filter);
  const csv = toCsv([
    ['Key', 'Kit', 'Kit ID', 'Batch', 'Status', 'Redeemed by', 'Redeemed at', 'Added'],
    ...keys.map((k) => [
      k.code,
      isKitId(k.productSlug) ? KITS[k.productSlug].name : `${k.productSlug} (retired)`,
      k.productSlug,
      k.batch,
      keyStatus(k),
      k.usedByEmail ?? '',
      k.usedAt ?? '',
      k.addedAt,
    ]),
  ]);
  await audit(admin, 'keys.export', `${keys.length} key${keys.length === 1 ? '' : 's'}`, filter);
  return csvResponse(csv, 'pegasus-kit-keys');
}
