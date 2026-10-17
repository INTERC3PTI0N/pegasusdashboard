import { requireAdmin } from '@/lib/access';
import { customerRows } from '@/lib/customer-rows';
import { audit } from '@/lib/site/store';
import { toCsv, csvResponse } from '@/lib/csv';

export async function GET(request: Request) {
  const admin = await requireAdmin('customers');
  const p = new URL(request.url).searchParams;
  const { rows } = await customerRows({
    q: p.get('q') ?? '',
    product: p.get('product') ?? '',
    status: p.get('status') ?? '',
    sort: p.get('sort') ?? 'joined',
  });
  const csv = toCsv([
    ['Name', 'Email', 'Salon', 'Phone', 'Country', 'Courses', 'Lessons done', 'Lessons total', 'Progress %', 'Certificates', 'Status', 'Joined', 'Last seen'],
    ...rows.map(({ user: u, owned, done, total, percent, certificates }) => [
      u.name, u.email, u.salon, u.phone, u.country, owned.map((o) => o.name).join('; '), done, total, percent,
      certificates, u.suspendedAt ? 'suspended' : 'active', u.createdAt, u.lastSeenAt ?? '',
    ]),
  ]);
  await audit(admin, 'customer.export', `${rows.length} customers`);
  return csvResponse(csv, 'pegasus-customers');
}
