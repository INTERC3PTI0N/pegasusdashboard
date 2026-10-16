import Link from 'next/link';
import { requireAdmin } from '@/lib/access';
import { products, getProduct } from '@/lib/catalog';
import { getProductKeys } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UploadForm } from './upload-form';

export const dynamic = 'force-dynamic';

function fmt(d: Date) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default async function ProductKeysPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; product?: string }>;
}) {
  await requireAdmin();
  const { status, product } = await searchParams;
  const all = await getProductKeys();
  const keys = all.filter(
    (k) =>
      (!product || k.productSlug === product) &&
      (status === 'used' ? k.usedBy : status === 'unused' ? !k.usedBy : true)
  );
  const usedCount = all.filter((k) => k.usedBy).length;

  const filterHref = (next: { status?: string; product?: string }) => {
    const q = new URLSearchParams({ ...(status && { status }), ...(product && { product }), ...next });
    for (const [k, v] of [...q]) if (!v) q.delete(k);
    return `/admin/keys${q.size ? `?${q}` : ''}`;
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <p className="mono-tag text-[10px] text-primary mb-2">Products</p>
        <h1 className="editorial-text text-4xl">Product keys</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Bulk upload one-time product keys in the format XXXX-XXXX-XXXX (letters and digits).
          A customer redeems a key once to unlock that product&apos;s course; after that it is
          spent. Separate keys with new lines, commas or spaces. Duplicates are skipped.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card className="self-start">
          <CardContent>
            <UploadForm products={products.map(({ slug, name }) => ({ slug, name }))} />
          </CardContent>
        </Card>

        <Card className="py-0 min-w-0">
          <CardContent className="px-3 py-3 space-y-2">
            <div className="flex flex-wrap items-center gap-2 px-2 py-1 text-xs">
              <span className="text-muted-foreground mr-2">
                {all.length} keys · {usedCount} used · {all.length - usedCount} available
              </span>
              {[
                ['', 'All'],
                ['unused', 'Available'],
                ['used', 'Used'],
              ].map(([value, label]) => (
                <Link
                  key={label}
                  href={filterHref({ status: value })}
                  className={`rounded-full border px-2.5 py-0.5 ${(status ?? '') === value ? 'border-primary text-primary' : 'text-muted-foreground'}`}
                >
                  {label}
                </Link>
              ))}
              <span className="mx-1 h-4 w-px bg-border" />
              {[{ slug: '', name: 'All products' }, ...products].map((p) => (
                <Link
                  key={p.slug || 'all'}
                  href={filterHref({ product: p.slug })}
                  className={`rounded-full border px-2.5 py-0.5 ${(product ?? '') === p.slug ? 'border-primary text-primary' : 'text-muted-foreground'}`}
                >
                  {p.name.split(' · ')[0]}
                </Link>
              ))}
            </div>
            <div className="max-h-[560px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Redeemed by</TableHead>
                    <TableHead>Added</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.map((k) => (
                    <TableRow key={k.code}>
                      <TableCell className="font-mono text-xs tracking-wider">{k.code}</TableCell>
                      <TableCell>{getProduct(k.productSlug)?.name ?? k.productSlug}</TableCell>
                      <TableCell>
                        {k.usedBy ? (
                          <Badge variant="secondary">Used {k.usedAt && fmt(k.usedAt)}</Badge>
                        ) : (
                          <Badge variant="success">Available</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {k.usedBy ? (
                          <Link href={`/admin/customers/${k.usedBy}`} className="hover:text-primary">
                            {k.usedByEmail}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{fmt(k.addedAt)}</TableCell>
                    </TableRow>
                  ))}
                  {keys.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                        No product keys match.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
