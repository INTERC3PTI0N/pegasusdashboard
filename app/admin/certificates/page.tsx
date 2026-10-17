import Link from 'next/link';
import { Download } from 'lucide-react';
import { requireAdmin } from '@/lib/access';
import { getAllCertificates } from '@/lib/store';
import { getProducts } from '@/lib/courses';
import { Card, CardContent } from '@/components/ui/card';
import { CertificateRow } from '../customers/[id]/panels';

export const dynamic = 'force-dynamic';

export default async function CertificateRegistryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; product?: string; q?: string }>;
}) {
  await requireAdmin('certificates');
  const { status = '', product = '', q = '' } = await searchParams;
  const [all, products] = await Promise.all([getAllCertificates(), getProducts()]);
  const needle = q.trim().toLowerCase();
  const certificates = all.filter(
    (c) =>
      (!status || (status === 'revoked' ? c.revokedAt : !c.revokedAt)) &&
      (!product || c.productSlug === product) &&
      (!needle || [c.id, c.userName, c.salon].some((x) => x.toLowerCase().includes(needle)))
  );
  const revoked = all.filter((c) => c.revokedAt).length;

  const href = (next: Record<string, string>) => {
    const p = new URLSearchParams({ status, product, q, ...next });
    for (const [k, v] of [...p]) if (!v) p.delete(k);
    return `?${p}`;
  };
  const chip = (active: boolean) =>
    `rounded-full border px-2.5 py-0.5 ${active ? 'border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mono-tag text-[10px] text-primary mb-2">Registry</p>
          <h1 className="editorial-text text-4xl">Certificates</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Every certificate ever issued. Each ID resolves on the public verification page; revoked ones show as
            invalid with the reason. Issue certificates manually from a customer’s page.
          </p>
        </div>
        <a href={`/admin/certificates/export${href({})}`} className="inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm hover:bg-secondary">
          <Download className="size-4" /> Export CSV
        </a>
      </div>

      <Card className="gap-0 py-0">
        <CardContent className="space-y-3 px-0 py-3">
          <div className="flex flex-wrap items-center gap-2 px-5 text-xs">
            {([
              ['', `All ${all.length}`],
              ['active', `Active ${all.length - revoked}`],
              ['revoked', `Revoked ${revoked}`],
            ] as const).map(([v, label]) => (
              <Link key={v || 'all'} href={href({ status: v })} className={chip(status === v)}>{label}</Link>
            ))}
            <form className="ml-auto flex gap-2" action="/admin/certificates">
              {status && <input type="hidden" name="status" value={status} />}
              <select name="product" defaultValue={product} className="h-8 rounded-md border bg-transparent px-2 text-xs">
                <option value="">All courses</option>
                {products.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
              </select>
              <input name="q" defaultValue={q} placeholder="ID, holder or salon" className="h-8 w-48 rounded-md border bg-transparent px-2 text-xs" />
              <button className="h-8 rounded-md border px-3 text-xs hover:bg-secondary">Filter</button>
            </form>
          </div>
          <div className="divide-y border-t">
            {certificates.map((c) => (
              <div key={c.id}>
                <p className="px-6 pt-3 text-sm">
                  <Link href={`/admin/customers/${c.userId}`} className="font-medium hover:text-primary">{c.userName}</Link>
                  {c.salon && <span className="text-muted-foreground"> · {c.salon}</span>}
                </p>
                <CertificateRow
                  cert={{
                    id: c.id,
                    productName: c.productName,
                    issuedAt: c.issuedAt.toISOString(),
                    revokedAt: c.revokedAt?.toISOString() ?? null,
                    revokedReason: c.revokedReason,
                    revokedBy: c.revokedBy,
                  }}
                />
              </div>
            ))}
            {certificates.length === 0 && <p className="px-6 py-10 text-center text-sm text-muted-foreground">No certificates match.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
