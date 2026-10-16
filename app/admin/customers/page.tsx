import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { requireAdmin } from '@/lib/access';
import { getCustomers } from '@/lib/users';
import { products } from '@/lib/catalog';
import { getEveryonesProgress } from '@/lib/store';
import { getCrmRecord, statusMeta } from '@/lib/crm';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const dynamic = 'force-dynamic';

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default async function CustomersPage() {
  await requireAdmin();

  const customers = await getCustomers();
  const progressMap = await getEveryonesProgress();

  const rows = customers.map((c) => {
    const crm = getCrmRecord(c.id);
    const owned = products.filter((p) => c.entitlements.includes(p.slug));
    const total = owned.reduce((s, p) => s + p.lessons.length, 0);
    const done = owned.reduce((s, p) => s + (progressMap[c.id]?.[p.slug]?.length ?? 0), 0);
    const percent = total ? Math.round((done / total) * 100) : 0;
    return { customer: c, crm, owned, percent };
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <p className="mono-tag text-[10px] text-primary mb-2">CRM</p>
        <h1 className="editorial-text text-4xl">Customers</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Relationship records, purchases and academy engagement in one place
        </p>
      </div>

      <Card className="py-0">
        <CardContent className="px-3 py-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Country</TableHead>
                <TableHead className="w-44">Progress</TableHead>
                <TableHead className="text-right">Lifetime value</TableHead>
                <TableHead>Last contact</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ customer, crm, percent }) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="flex items-center gap-3 hover:text-primary transition-colors"
                    >
                      <Avatar>
                        <AvatarFallback>{initials(customer.name)}</AvatarFallback>
                      </Avatar>
                      <span className="flex flex-col">
                        <span className="font-medium">{customer.name}</span>
                        <span className="text-xs text-muted-foreground">{customer.email}</span>
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    {crm && (
                      <Badge className={statusMeta[crm.status].className}>
                        {statusMeta[crm.status].label}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex max-w-44 flex-wrap gap-1">
                      {crm?.tags.slice(0, 2).map((t) => (
                        <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                      ))}
                      {crm && crm.tags.length > 2 && (
                        <Badge variant="outline" className="text-[10px]">+{crm.tags.length - 2}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{crm?.country}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={percent} className="h-1.5" />
                      <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
                        {percent}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    €{crm?.lifetimeValue.toLocaleString('en-GB')}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {crm ? fmtDate(crm.lastContact) : '—'}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      Open <ArrowRight className="size-3.5" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
