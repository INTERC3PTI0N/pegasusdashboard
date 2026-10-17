import Link from 'next/link';
import { Download } from 'lucide-react';
import { requireAdmin } from '@/lib/access';
import { getLeads } from '@/lib/site/store';
import { Card, CardContent } from '@/components/ui/card';
import { LeadRow } from './lead-row';

export const dynamic = 'force-dynamic';

const KINDS = [
  ['', 'All'],
  ['brochure', 'Brochure requests'],
  ['dealer', 'Dealer'],
  ['business', 'Business'],
] as const;
const STATUSES = [
  ['', 'Any status'],
  ['new', 'New'],
  ['contacted', 'Contacted'],
  ['closed', 'Closed'],
] as const;

export default async function EnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; status?: string; q?: string }>;
}) {
  await requireAdmin('enquiries');
  const { kind = '', status = '', q = '' } = await searchParams;
  const all = await getLeads();
  const needle = q.trim().toLowerCase();
  const leads = all.filter(
    (l) =>
      (!kind || l.kind === kind) &&
      (!status || l.status === status) &&
      (!needle || [l.name, l.email, l.company, l.country, l.message].some((x) => x.toLowerCase().includes(needle)))
  );
  const newCount = all.filter((l) => l.status === 'new').length;

  const href = (next: Record<string, string>) => {
    const p = new URLSearchParams({ kind, status, q, ...next });
    for (const [k, v] of [...p]) if (!v) p.delete(k);
    return `/admin/enquiries${p.size ? `?${p}` : ''}`;
  };
  const chip = (active: boolean) =>
    `rounded-full border px-2.5 py-0.5 ${active ? 'border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mono-tag text-[10px] text-primary mb-2">Website</p>
          <h1 className="editorial-text text-4xl">Enquiries</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Brochure requests and dealer / business enquiries from the website · {all.length} total, {newCount} new
          </p>
        </div>
        <a
          href={`/admin/enquiries/export${href({}).replace('/admin/enquiries', '')}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm hover:bg-secondary"
        >
          <Download className="size-4" /> Export CSV
        </a>
      </div>

      <Card className="py-0">
        <CardContent className="space-y-3 px-3 py-3">
          <div className="flex flex-wrap items-center gap-2 px-2 pt-1 text-xs">
            {KINDS.map(([v, label]) => (
              <Link key={label} href={href({ kind: v })} className={chip(kind === v)}>{label}</Link>
            ))}
            <span className="mx-1 h-4 w-px bg-border" />
            {STATUSES.map(([v, label]) => (
              <Link key={label} href={href({ status: v })} className={chip(status === v)}>{label}</Link>
            ))}
            <form className="ml-auto" action="/admin/enquiries">
              {kind && <input type="hidden" name="kind" value={kind} />}
              {status && <input type="hidden" name="status" value={status} />}
              <input
                name="q"
                defaultValue={q}
                placeholder="Search name, email, company…"
                className="h-8 w-60 rounded-md border bg-transparent px-2.5 text-xs"
              />
            </form>
          </div>

          <div className="divide-y rounded-md border">
            {leads.map((l) => (
              <LeadRow
                key={l.id}
                lead={{ ...l, createdAt: l.createdAt.toISOString() }}
              />
            ))}
            {leads.length === 0 && (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                {all.length === 0 ? 'No enquiries yet. Submissions from the website forms appear here.' : 'No enquiries match.'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
