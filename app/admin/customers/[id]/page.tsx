import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, Mail, Phone, MapPin, Award, CalendarClock, Euro } from 'lucide-react';
import { requireAdmin } from '@/lib/access';
import { findUserById } from '@/lib/users';
import { products } from '@/lib/catalog';
import { getAllProgress, getCertificates } from '@/lib/store';
import { getCrmRecord, statusMeta } from '@/lib/crm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { NotesPanel } from './notes-panel';

export const dynamic = 'force-dynamic';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const customer = findUserById(id);
  if (!customer || customer.role !== 'customer') notFound();

  const crm = getCrmRecord(customer.id);
  const progress = getAllProgress(customer.id);
  const certificates = getCertificates(customer.id);

  const owned = products.filter((p) => customer.entitlements.includes(p.slug));
  const courseRows = owned.map((p) => {
    const done = progress[p.slug]?.length ?? 0;
    const percent = Math.round((done / p.lessons.length) * 100);
    const cert = certificates.find((c) => c.productSlug === p.slug);
    return { product: p, done, percent, cert };
  });

  const initials = customer.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" /> All customers
      </Link>

      {/* Profile header */}
      <Card className="py-6">
        <CardContent className="flex flex-wrap items-center gap-5">
          <Avatar className="size-16">
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="editorial-text text-3xl">{customer.name}</h1>
              {crm && (
                <Badge className={statusMeta[crm.status].className}>
                  {statusMeta[crm.status].label}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{customer.salon}</p>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="size-3.5" /> {customer.email}
              </span>
              {crm && (
                <>
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="size-3.5" /> {crm.phone}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5" /> {crm.country}
                  </span>
                </>
              )}
            </div>
          </div>
          {crm && (
            <div className="flex gap-8 text-sm">
              <div>
                <p className="mono-tag text-[9px] text-muted-foreground mb-1 flex items-center gap-1">
                  <CalendarClock className="size-3" /> Customer since
                </p>
                <p className="font-medium">{fmtDate(crm.customerSince)}</p>
              </div>
              <div>
                <p className="mono-tag text-[9px] text-muted-foreground mb-1 flex items-center gap-1">
                  <Euro className="size-3" /> Lifetime value
                </p>
                <p className="font-medium tabular-nums">€{crm.lifetimeValue.toLocaleString('en-GB')}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left — learning progress */}
        <div className="space-y-6 min-w-0">
          <Card className="py-0 gap-0">
            <CardHeader className="border-b !py-5">
              <CardTitle>Academy progress</CardTitle>
              <CardDescription>Per-course tutorial completion</CardDescription>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {courseRows.map(({ product, done, percent, cert }) => (
                <div key={product.slug} className="flex items-center gap-4 px-6 py-4">
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-md">
                    <Image src={product.image} alt={product.name} fill className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium leading-none">{product.name}</p>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {done}/{product.lessons.length} lessons · {percent}%
                      </span>
                    </div>
                    <Progress value={percent} className="h-1.5" />
                  </div>
                  {cert ? (
                    <Badge variant="success" className="gap-1 shrink-0">
                      <Award className="size-3" /> Certified
                    </Badge>
                  ) : percent === 100 ? (
                    <Badge variant="secondary" className="shrink-0">Cert unclaimed</Badge>
                  ) : null}
                </div>
              ))}
              {courseRows.length === 0 && (
                <p className="px-6 py-8 text-sm text-muted-foreground">No registered products.</p>
              )}
            </CardContent>
          </Card>

          {/* Certificates */}
          <Card className="py-0 gap-0">
            <CardHeader className="border-b !py-5">
              <CardTitle>Certificates</CardTitle>
              <CardDescription>Issued to this customer — verifiable by QR</CardDescription>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {certificates.map((cert) => (
                <div key={cert.id} className="flex flex-wrap items-center gap-3 px-6 py-4">
                  <Award className="size-4 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-tight">{cert.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-mono tracking-wider">{cert.id}</span> · issued {fmtDate(cert.issuedAt)}
                    </p>
                  </div>
                  <Link
                    href={`/verify/${cert.id}`}
                    target="_blank"
                    className="text-sm text-primary hover:underline"
                  >
                    Verification page →
                  </Link>
                </div>
              ))}
              {certificates.length === 0 && (
                <p className="px-6 py-8 text-sm text-muted-foreground">No certificates earned yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right — CRM panel */}
        <div className="space-y-6">
          {crm && (
            <Card className="py-5 gap-3">
              <CardContent className="space-y-4">
                <p className="mono-tag text-[10px] text-muted-foreground">Relationship</p>
                <div className="flex flex-wrap gap-1.5">
                  {crm.tags.map((t) => (
                    <Badge key={t} variant="outline">{t}</Badge>
                  ))}
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Last contact</p>
                    <p className="font-medium">{fmtDate(crm.lastContact)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Products owned</p>
                    <p className="font-medium tabular-nums">{owned.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <NotesPanel
            seedNotes={crm?.notes ?? []}
            adminName="Elena Weiss"
          />
        </div>
      </div>
    </div>
  );
}
