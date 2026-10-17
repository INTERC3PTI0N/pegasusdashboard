import { requireAdmin } from '@/lib/access';
import { getLeads, audit } from '@/lib/site/store';
import { toCsv, csvResponse } from '@/lib/csv';

export async function GET(request: Request) {
  const admin = await requireAdmin('enquiries');
  const p = new URL(request.url).searchParams;
  const kind = p.get('kind');
  const status = p.get('status');
  const q = p.get('q')?.trim().toLowerCase();
  const leads = (await getLeads()).filter(
    (l) =>
      (!kind || l.kind === kind) &&
      (!status || l.status === status) &&
      (!q || [l.name, l.email, l.company, l.country, l.message].some((x) => x.toLowerCase().includes(q)))
  );

  const csv = toCsv([
    ['Date', 'Type', 'Status', 'Name', 'Email', 'Company', 'Country', 'Role', 'Catalogue', 'Marketing consent', 'Message', 'Notes'],
    ...leads.map((l) => [
      l.createdAt, l.kind, l.status, l.name, l.email, l.company, l.country, l.role, l.interest,
      l.marketingConsent ? 'yes' : 'no', l.message, l.notes,
    ]),
  ]);
  await audit(admin, 'lead.export', `${leads.length} enquiries`);
  return csvResponse(csv, 'pegasus-enquiries');
}
