import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Mail, Phone, MapPin, CalendarClock, Eye, KeyRound } from 'lucide-react';
import { requireAdmin } from '@/lib/access';
import { findUserById, getNotes } from '@/lib/users';
import { getProducts } from '@/lib/courses';
import { getAllProgress, getCertificates, getLastActivity, keysUsedBy } from '@/lib/store';
import { relativeTime } from '@/lib/customer-rows';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ProfileCard, AccountActions, CourseCard, CertificateRow, NotesPanel } from './panels';

export const dynamic = 'force-dynamic';

const iso = (d: Date | null) => d?.toISOString() ?? null;

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin('customers');
  const { id } = await params;
  const customer = await findUserById(id);
  if (!customer || customer.role !== 'customer') notFound();

  const [products, progress, certificates, lastActivity, keys, notes] = await Promise.all([
    getProducts(),
    getAllProgress(id),
    getCertificates(id),
    getLastActivity(id),
    keysUsedBy(id),
    getNotes(id),
  ]);

  // Owned courses first, then the rest (so support can grant access from here).
  const courses = [...products]
    .sort((a, b) => Number(customer.entitlements.includes(b.slug)) - Number(customer.entitlements.includes(a.slug)))
    .map((p) => {
      const active = certificates.find((c) => c.productSlug === p.slug && !c.revokedAt);
      return {
        slug: p.slug,
        name: p.name,
        image: p.image,
        lessons: p.lessons.map((l) => ({ id: l.id, title: l.title, type: l.type })),
        owned: customer.entitlements.includes(p.slug),
        completed: progress[p.slug] ?? [],
        lastActivity: iso(lastActivity[p.slug] ?? null),
        certificate: active ? { id: active.id, issuedAt: active.issuedAt.toISOString() } : null,
        hasRevoked: certificates.some((c) => c.productSlug === p.slug && c.revokedAt),
      };
    });

  const initials = customer.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link href="/admin/customers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All customers
      </Link>

      <Card className="py-6">
        <CardContent className="flex flex-wrap items-center gap-5">
          <Avatar className="size-16">
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="editorial-text text-3xl">{customer.name}</h1>
              {customer.suspendedAt ? <Badge variant="destructive">Suspended</Badge> : <Badge variant="success">Active</Badge>}
              {customer.mustChangePassword && <Badge variant="outline">Temporary password</Badge>}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">{customer.salon}</p>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
              <a href={`mailto:${customer.email}`} className="inline-flex items-center gap-1.5 hover:text-foreground"><Mail className="size-3.5" /> {customer.email}</a>
              {customer.phone && <span className="inline-flex items-center gap-1.5"><Phone className="size-3.5" /> {customer.phone}</span>}
              {customer.country && <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" /> {customer.country}</span>}
            </div>
          </div>
          <div className="flex gap-8 text-sm">
            <div>
              <p className="mono-tag mb-1 flex items-center gap-1 text-[9px] text-muted-foreground"><CalendarClock className="size-3" /> Joined</p>
              <p className="font-medium">{customer.createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div>
              <p className="mono-tag mb-1 flex items-center gap-1 text-[9px] text-muted-foreground"><Eye className="size-3" /> Last seen</p>
              <p className="font-medium">{relativeTime(customer.lastSeenAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <Card className="gap-0 py-0">
            <CardHeader className="border-b !py-5">
              <CardTitle>Courses & progress</CardTitle>
              <CardDescription>Grant or remove access, override lesson progress, issue certificates.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {courses.map((c) => (
                <CourseCard key={c.slug} customerId={customer.id} course={c} />
              ))}
            </CardContent>
          </Card>

          <Card className="gap-0 py-0">
            <CardHeader className="border-b !py-5">
              <CardTitle>Certificates</CardTitle>
              <CardDescription>Revoked certificates show as invalid on the public verification page.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {certificates.map((c) => (
                <CertificateRow
                  key={c.id}
                  cert={{
                    id: c.id,
                    productName: c.productName,
                    issuedAt: c.issuedAt.toISOString(),
                    revokedAt: iso(c.revokedAt),
                    revokedReason: c.revokedReason,
                    revokedBy: c.revokedBy,
                  }}
                />
              ))}
              {certificates.length === 0 && <p className="px-6 py-8 text-sm text-muted-foreground">No certificates yet.</p>}
            </CardContent>
          </Card>

          <Card className="gap-0 py-0">
            <CardHeader className="border-b !py-5">
              <CardTitle className="flex items-center gap-2"><KeyRound className="size-4" /> Product keys used</CardTitle>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {keys.map((k) => (
                <div key={k.code} className="flex items-center justify-between px-6 py-3 text-sm">
                  <span className="font-mono tracking-wider">{k.code}</span>
                  <span className="text-muted-foreground">
                    {products.find((p) => p.slug === k.productSlug)?.name ?? k.productSlug} ·{' '}
                    {k.usedAt?.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              ))}
              {keys.length === 0 && <p className="px-6 py-6 text-sm text-muted-foreground">No keys redeemed.</p>}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <ProfileCard
            id={customer.id}
            profile={{ name: customer.name, email: customer.email, salon: customer.salon, phone: customer.phone, country: customer.country }}
          />
          <AccountActions id={customer.id} email={customer.email} suspended={!!customer.suspendedAt} />
          <NotesPanel
            customerId={customer.id}
            notes={notes.map((n) => ({ id: n.id, author: n.author, body: n.body, createdAt: n.createdAt.toISOString() }))}
          />
        </div>
      </div>
    </div>
  );
}
