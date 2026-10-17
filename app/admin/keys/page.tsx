import Link from 'next/link';
import { Download } from 'lucide-react';
import { requireAdmin } from '@/lib/access';
import { getProducts } from '@/lib/courses';
import { keyRows, keyStatus } from '@/lib/key-rows';
import { Card, CardContent } from '@/components/ui/card';
import { UploadForm } from './upload-form';
import { KeyTable } from './key-table';

export const dynamic = 'force-dynamic';

export default async function ProductKeysPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; product?: string; batch?: string; q?: string }>;
}) {
  await requireAdmin('keys');
  const params = await searchParams;
  const { product = '', batch = '', q = '' } = params;
  const [products, { keys, batches, counts, status }] = await Promise.all([getProducts(), keyRows(params)]);

  const href = (next: Record<string, string>) => {
    const p = new URLSearchParams({ status, product, batch, q, ...next });
    for (const [k, v] of [...p]) if (!v) p.delete(k);
    return `?${p}`;
  };
  const chip = (active: boolean) =>
    `rounded-full border px-2.5 py-0.5 ${active ? 'border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mono-tag text-[10px] text-primary mb-2">Products</p>
          <h1 className="editorial-text text-4xl">Product keys</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            One-time keys in the format XXXX-XXXX-XXXX. A customer redeems a key once to unlock that course;
            then it is spent. Void lost or leaked keys so they can never be used. Export a batch as CSV to
            print on product cards.
          </p>
        </div>
        <a href={`/admin/keys/export${href({})}`} className="inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm hover:bg-secondary">
          <Download className="size-4" /> Export CSV ({keys.length})
        </a>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <Card className="self-start">
          <CardContent>
            <UploadForm products={products.map(({ slug, name }) => ({ slug, name }))} />
          </CardContent>
        </Card>

        <Card className="min-w-0 py-0">
          <CardContent className="space-y-3 px-3 py-3">
            <div className="flex flex-wrap items-center gap-2 px-2 pt-1 text-xs">
              {([
                ['', `All ${counts.all}`],
                ['available', `Available ${counts.available}`],
                ['used', `Used ${counts.used}`],
                ['voided', `Voided ${counts.voided}`],
              ] as const).map(([v, label]) => (
                <Link key={v || 'all'} href={href({ status: v })} className={chip(status === v)}>{label}</Link>
              ))}
            </div>
            <form className="flex flex-wrap items-center gap-2 px-2" action="/admin/keys">
              {status && <input type="hidden" name="status" value={status} />}
              <select name="product" defaultValue={product} className="h-8 rounded-md border bg-transparent px-2 text-xs">
                <option value="">All courses</option>
                {products.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
              </select>
              <select name="batch" defaultValue={batch} className="h-8 rounded-md border bg-transparent px-2 text-xs">
                <option value="">All batches</option>
                {batches.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              <input name="q" defaultValue={q} placeholder="Key or customer email" className="h-8 w-48 rounded-md border bg-transparent px-2 text-xs" />
              <button className="h-8 rounded-md border px-3 text-xs hover:bg-secondary">Filter</button>
            </form>
            <KeyTable
              keys={keys.slice(0, 1000).map((k) => ({
                code: k.code,
                product: products.find((p) => p.slug === k.productSlug)?.name ?? k.productSlug,
                batch: k.batch,
                status: keyStatus(k),
                usedBy: k.usedBy,
                usedByEmail: k.usedByEmail,
                usedAt: k.usedAt?.toISOString() ?? null,
                addedAt: k.addedAt.toISOString(),
              }))}
            />
            {keys.length > 1000 && (
              <p className="px-2 text-xs text-muted-foreground">Showing the first 1,000 of {keys.length}. Narrow the filters or export CSV for all.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
