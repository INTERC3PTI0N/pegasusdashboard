import Link from 'next/link';
import { Download, Search } from 'lucide-react';
import { requireAdmin } from '@/lib/access';
import { customerRows, relativeTime } from '@/lib/customer-rows';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

const STATUSES = [
  ['', 'All'],
  ['active', 'Active'],
  ['suspended', 'Suspended'],
  ['unregistered', 'No products yet'],
  ['completed', 'Completed everything'],
] as const;
const SORTS = [
  ['joined', 'Newest'],
  ['seen', 'Last seen'],
  ['progress', 'Progress'],
  ['name', 'Name'],
] as const;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; product?: string; status?: string; sort?: string; page?: string; deleted?: string }>;
}) {
  await requireAdmin('customers');
  const params = await searchParams;
  const { q = '', product = '', status = '', sort = 'joined', deleted } = params;
  const page = Math.max(1, Number(params.page) || 1);
  const { rows, products } = await customerRows({ q, product, status, sort });
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  const href = (next: Record<string, string>) => {
    const p = new URLSearchParams({ q, product, status, sort, ...next });
    for (const [k, v] of [...p]) if (!v || (k === 'sort' && v === 'joined')) p.delete(k);
    return `?${p}`;
  };
  const chip = (active: boolean) =>
    `rounded-full border px-2.5 py-0.5 ${active ? 'border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mono-tag text-[10px] text-primary mb-2">CRM</p>
          <h1 className="editorial-text text-4xl">Customers</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {rows.length} {rows.length === 1 ? 'customer' : 'customers'}
            {(q || product || status) && ' match these filters'}
          </p>
        </div>
        <a
          href={`/admin/customers/export${href({ page: '' })}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm hover:bg-secondary"
        >
          <Download className="size-4" /> Export CSV
        </a>
      </div>

      {deleted && <p className="rounded-lg border px-4 py-3 text-sm" role="status">Customer deleted.</p>}

      <Card className="py-0">
        <CardContent className="space-y-3 px-3 py-3">
          <form className="flex flex-wrap items-center gap-2 px-2 pt-1" action="/admin/customers">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Name, email, salon, country, phone…"
                className="h-9 w-72 rounded-md border bg-transparent pl-8 pr-3 text-sm"
              />
            </div>
            <select name="product" defaultValue={product} className="h-9 rounded-md border bg-transparent px-2 text-sm">
              <option value="">Any course</option>
              {products.map((p) => (
                <option key={p.slug} value={p.slug}>{p.name}</option>
              ))}
            </select>
            {status && <input type="hidden" name="status" value={status} />}
            {sort !== 'joined' && <input type="hidden" name="sort" value={sort} />}
            <button className="h-9 rounded-md border px-3 text-sm hover:bg-secondary">Search</button>
          </form>
          <div className="flex flex-wrap items-center gap-2 px-2 text-xs">
            {STATUSES.map(([v, label]) => (
              <Link key={label} href={href({ status: v, page: '' })} className={chip(status === v)}>{label}</Link>
            ))}
            <span className="ml-auto text-muted-foreground">Sort:</span>
            {SORTS.map(([v, label]) => (
              <Link key={v} href={href({ sort: v, page: '' })} className={chip(sort === v)}>{label}</Link>
            ))}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Courses</TableHead>
                <TableHead className="w-40">Progress</TableHead>
                <TableHead className="text-right">Certs</TableHead>
                <TableHead>Last seen</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map(({ user, owned, percent, certificates }) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Link href={`/admin/customers/${user.id}`} className="flex items-center gap-3 hover:text-primary">
                      <Avatar>
                        <AvatarFallback>{initials(user.name)}</AvatarFallback>
                      </Avatar>
                      <span className="flex min-w-0 flex-col">
                        <span className="flex items-center gap-2 font-medium">
                          {user.name}
                          {user.suspendedAt && <Badge variant="destructive" className="text-[10px]">Suspended</Badge>}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {user.email}{user.salon && ` · ${user.salon}`}
                        </span>
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex max-w-48 flex-wrap gap-1">
                      {owned.map((p) => (
                        <Badge key={p.slug} variant="secondary" className="text-[10px]">{p.name.split(' · ')[0]}</Badge>
                      ))}
                      {owned.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {owned.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Progress value={percent} className="h-1.5" />
                        <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{percent}%</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{certificates}</TableCell>
                  <TableCell className="text-muted-foreground">{relativeTime(user.lastSeenAt)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </TableCell>
                </TableRow>
              ))}
              {pageRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No customers match.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {pages > 1 && (
            <div className="flex items-center justify-between px-2 pb-1 text-sm">
              <span className="text-muted-foreground">Page {page} of {pages}</span>
              <div className="flex gap-2">
                {page > 1 && <Link href={href({ page: String(page - 1) })} className="rounded-md border px-3 py-1 hover:bg-secondary">Previous</Link>}
                {page < pages && <Link href={href({ page: String(page + 1) })} className="rounded-md border px-3 py-1 hover:bg-secondary">Next</Link>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
