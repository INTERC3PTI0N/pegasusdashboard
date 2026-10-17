import Link from 'next/link';
import { Users, Activity, KeyRound, Award, Inbox, ShieldAlert, ArrowRight } from 'lucide-react';
import { requireAdmin } from '@/lib/access';
import { getAnalytics } from '@/lib/analytics';
import { getAuditLog } from '@/lib/site/store';
import { can } from '@/lib/permissions';
import { relativeTime } from '@/lib/customer-rows';
import { ACTIONS } from '@/lib/audit-labels';
import { DailyBars } from '@/components/admin/daily-bars';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const dynamic = 'force-dynamic';

const PERIODS = [7, 30, 90];

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; forbidden?: string }>;
}) {
  const admin = await requireAdmin();
  const { days: d, forbidden } = await searchParams;
  const days = PERIODS.includes(Number(d)) ? Number(d) : 30;
  const [a, activity] = await Promise.all([getAnalytics(days), can(admin.adminRole, 'audit') ? getAuditLog(8) : []]);
  const k = a.kpis;
  const trend = k.newCustomers - k.prevCustomers;

  const tiles = [
    {
      label: 'Customers',
      value: k.customers,
      icon: Users,
      note: `${k.newCustomers} new in ${days} days (${trend >= 0 ? '+' : ''}${trend} vs previous ${days})`,
      href: can(admin.adminRole, 'customers') ? '/admin/customers?sort=joined' : null,
    },
    { label: `Active (${days} days)`, value: k.active, icon: Activity, note: `${k.suspended} suspended`, href: null },
    {
      label: 'Keys available',
      value: k.keysAvailable,
      icon: KeyRound,
      note: `${k.keysUsed} redeemed · ${k.keysVoided} voided`,
      href: can(admin.adminRole, 'keys') ? '/admin/keys?status=unused' : null,
    },
    {
      label: 'Certificates',
      value: k.certsActive,
      icon: Award,
      note: `${k.certsRevoked} revoked`,
      href: can(admin.adminRole, 'certificates') ? '/admin/certificates' : null,
    },
    {
      label: 'New enquiries',
      value: k.newEnquiries,
      icon: Inbox,
      note: 'from the website',
      href: can(admin.adminRole, 'enquiries') ? '/admin/enquiries?status=new' : null,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {forbidden && (
        <p className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <ShieldAlert className="size-4" /> Your role doesn’t include that section. Ask an owner if you need access.
        </p>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mono-tag text-[10px] text-primary mb-2">Admin Console</p>
          <h1 className="editorial-text text-4xl md:text-5xl">Overview</h1>
          <p className="mt-2 text-sm text-muted-foreground">Academy growth, engagement and certification</p>
        </div>
        <div className="flex gap-1 rounded-md border p-1 text-sm" role="group" aria-label="Period">
          {PERIODS.map((p) => (
            <Link
              key={p}
              href={p === 30 ? '/admin' : `/admin?days=${p}`}
              className={`rounded px-3 py-1 ${p === days ? 'bg-secondary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {p} days
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {tiles.map((t) => {
          const body = (
            <Card className="h-full gap-1 py-5 transition-colors hover:border-primary/40">
              <CardHeader className="pb-0">
                <CardDescription>{t.label}</CardDescription>
                <CardAction><t.icon className="size-4 text-primary" /></CardAction>
                <CardTitle className="text-3xl tabular-nums">{t.value}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">{t.note}</CardContent>
            </Card>
          );
          return t.href ? <Link key={t.label} href={t.href}>{body}</Link> : <div key={t.label}>{body}</div>;
        })}
      </div>

      <Card>
        <CardContent className="grid gap-8 md:grid-cols-3">
          <DailyBars title="New customers" data={a.signups} />
          <DailyBars title="Keys redeemed" data={a.redemptions} />
          <DailyBars title="Certificates issued" data={a.certificates} />
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b !py-5">
          <CardTitle>Course funnel</CardTitle>
          <CardDescription>All time: customers who own each course, started it, finished every lesson, and hold a certificate.</CardDescription>
        </CardHeader>
        <CardContent className="px-3 pb-3 pt-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead className="text-right">Owners</TableHead>
                <TableHead className="text-right">Started</TableHead>
                <TableHead className="text-right">Finished</TableHead>
                <TableHead className="text-right">Certified</TableHead>
                <TableHead className="w-48">Average progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {a.funnel.map((f) => {
                const pct = (n: number) => (f.owners ? ` (${Math.round((n / f.owners) * 100)}%)` : '');
                return (
                  <TableRow key={f.slug}>
                    <TableCell>
                      <span className="font-medium">{f.name}</span>
                      <span className="block text-xs text-muted-foreground">{f.lessons} lessons</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{f.owners}</TableCell>
                    <TableCell className="text-right tabular-nums">{f.started}<span className="text-muted-foreground">{pct(f.started)}</span></TableCell>
                    <TableCell className="text-right tabular-nums">{f.completed}<span className="text-muted-foreground">{pct(f.completed)}</span></TableCell>
                    <TableCell className="text-right tabular-nums">{f.certified}<span className="text-muted-foreground">{pct(f.certified)}</span></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={f.avgProgress} className="h-1.5" />
                        <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{f.avgProgress}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {activity.length > 0 && (
        <Card className="gap-0 py-0">
          <CardHeader className="border-b !py-5">
            <CardTitle>Recent admin activity</CardTitle>
            <CardAction>
              <Link href="/admin/audit" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                Full audit log <ArrowRight className="size-3.5" />
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent className="divide-y p-0">
            {activity.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-4 px-6 py-3 text-sm">
                <span className="min-w-0 truncate">
                  <span className="font-medium">{e.actorEmail}</span>{' '}
                  <span className="text-muted-foreground">{(ACTIONS[e.action] ?? e.action).toLowerCase()}</span> {e.target}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{relativeTime(e.at)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
