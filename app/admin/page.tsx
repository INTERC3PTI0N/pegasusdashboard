import Link from 'next/link';
import { Users, GraduationCap, Award, TrendingUp, ArrowRight } from 'lucide-react';
import { requireAdmin } from '@/lib/access';
import { getCustomers } from '@/lib/users';
import { products } from '@/lib/catalog';
import { getEveryonesProgress, getAllCertificates } from '@/lib/store';
import { getCrmRecord, statusMeta } from '@/lib/crm';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const dynamic = 'force-dynamic';

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

export default async function AdminOverviewPage() {
  await requireAdmin();

  const customers = await getCustomers();
  const progressMap = await getEveryonesProgress();
  const certificates = await getAllCertificates();

  const rows = customers.map((c) => {
    const owned = products.filter((p) => c.entitlements.includes(p.slug));
    const total = owned.reduce((s, p) => s + p.lessons.length, 0);
    const done = owned.reduce((s, p) => s + (progressMap[c.id]?.[p.slug]?.length ?? 0), 0);
    const percent = total ? Math.round((done / total) * 100) : 0;
    const certs = certificates.filter((x) => x.userId === c.id).length;
    const crm = getCrmRecord(c.id);
    return { customer: c, owned, total, done, percent, certs, crm };
  });

  const enrollments = rows.reduce((s, r) => s + r.owned.length, 0);
  const avgProgress = rows.length
    ? Math.round(rows.reduce((s, r) => s + r.percent, 0) / rows.length)
    : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <p className="mono-tag text-[10px] text-primary mb-2">Admin Console</p>
        <h1 className="editorial-text text-4xl md:text-5xl">Academy overview</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Customer learning progress and certification across all Pegasus product lines
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="gap-2 py-5">
          <CardHeader className="pb-0">
            <CardDescription>Customers</CardDescription>
            <CardAction><Users className="size-4 text-primary" /></CardAction>
            <CardTitle className="text-3xl tabular-nums">{customers.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">registered portal accounts</CardContent>
        </Card>
        <Card className="gap-2 py-5">
          <CardHeader className="pb-0">
            <CardDescription>Course enrolments</CardDescription>
            <CardAction><GraduationCap className="size-4 text-primary" /></CardAction>
            <CardTitle className="text-3xl tabular-nums">{enrollments}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">product purchases with academy access</CardContent>
        </Card>
        <Card className="gap-2 py-5">
          <CardHeader className="pb-0">
            <CardDescription>Average progress</CardDescription>
            <CardAction><TrendingUp className="size-4 text-primary" /></CardAction>
            <CardTitle className="text-3xl tabular-nums">{avgProgress}%</CardTitle>
          </CardHeader>
          <CardContent><Progress value={avgProgress} className="h-1.5" /></CardContent>
        </Card>
        <Card className="gap-2 py-5">
          <CardHeader className="pb-0">
            <CardDescription>Certificates issued</CardDescription>
            <CardAction><Award className="size-4 text-primary" /></CardAction>
            <CardTitle className="text-3xl tabular-nums">{certificates.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            <Link href="/admin/certificates" className="text-primary hover:underline">View registry →</Link>
          </CardContent>
        </Card>
      </div>

      {/* Customer progress table */}
      <Card className="py-0 gap-0">
        <CardHeader className="border-b !py-5">
          <CardTitle>Customer progress</CardTitle>
          <CardDescription>Live tutorial completion per customer</CardDescription>
          <CardAction>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/customers">Open CRM <ArrowRight /></Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="px-3 pb-3 pt-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Products</TableHead>
                <TableHead className="w-52">Overall progress</TableHead>
                <TableHead className="text-right">Lessons</TableHead>
                <TableHead className="text-right">Certificates</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ customer, owned, total, done, percent, certs, crm }) => (
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
                        <span className="text-xs text-muted-foreground">{customer.salon}</span>
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
                    <div className="flex flex-wrap gap-1">
                      {owned.map((p) => (
                        <Badge key={p.slug} variant="secondary" className="text-[10px]">
                          {p.line.replace(' Series', '')}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={percent} className="h-1.5" />
                      <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
                        {percent}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {done}/{total}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{certs}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
