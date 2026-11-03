import Link from 'next/link';
import Image from 'next/image';
import { Award, ArrowRight, Lock } from 'lucide-react';
import { requireCustomer, accessFor } from '@/lib/access';
import { courseView } from '@/lib/course-view';
import { getProducts } from '@/lib/courses';
import { getAllProgress, getCertificates } from '@/lib/store';
import { generateCertificate } from '@/app/actions';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function CertificatesPage() {
  const user = await requireCustomer();
  const [products, progress, certificates] = await Promise.all([getProducts(), getAllProgress(user.id), getCertificates(user.id)]);
  const access = accessFor(user);
  const owned = access.anyKit ? products : [];
  const total = products.reduce((s, p) => s + p.lessons.length, 0);

  const rows = owned.map((p) => {
    // Certificate progress counts every lesson — the certificate needs the Mastery Kit.
    const view = courseView(p, { ...access, mastery: true, essential: true }, progress[p.slug]);
    const cert = certificates.find((c) => c.productSlug === p.slug && !c.revokedAt);
    const revoked = !cert && certificates.some((c) => c.productSlug === p.slug && c.revokedAt);
    return { product: p, view, cert, revoked };
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <p className="mono-tag text-[10px] text-primary mb-2">Certification</p>
        <h1 className="editorial-text text-4xl">Certificate</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
          Complete all {total} lessons to earn your PEGASUS® Masterclass certificate. Each certificate includes a
          unique ID and QR code, allowing clients and employers to verify its authenticity and confirm it was issued to you.
        </p>
      </div>

      <div className="grid max-w-xl gap-5">
        {rows.map(({ product, view, cert, revoked }) => (
          <Card key={product.slug} className="overflow-hidden py-0 gap-0">
            <div className="relative aspect-video">
              <Image src={product.image} alt={product.name} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-ink/10" />
              <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                <p className="mono-tag text-[9px] text-white/80">{product.line}</p>
                {cert && <Badge className="gap-1"><Award className="size-3" /> Earned</Badge>}
              </div>
            </div>
            <CardContent className="p-5 space-y-4">
              <div>
                <h3 className="font-semibold uppercase">{product.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {cert
                    ? `Certificate ${cert.id} · issued ${new Date(cert.issuedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
                    : 'PEGASUS® Masterclass certificate'}
                </p>
              </div>

              {cert ? (
                <Button asChild className="w-full">
                  <Link href={`/certificates/${cert.id}`}>
                    View certificate <ArrowRight />
                  </Link>
                </Button>
              ) : revoked ? (
                <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  This certificate was revoked. Please contact Pegasus Masterclass support.
                </p>
              ) : !access.mastery ? (
                <div className="space-y-2 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
                  <p className="flex items-center gap-1.5 font-medium"><Lock className="size-3.5" /> Included with the Mastery Kit</p>
                  <p className="text-muted-foreground">Buy the Mastery Kit to unlock all {view.total} lessons and earn this certificate.</p>
                  <Button asChild size="sm" className="w-full">
                    <Link href="/register-kit">Register Mastery Kit</Link>
                  </Button>
                </div>
              ) : view.complete ? (
                <form action={generateCertificate.bind(null, product.slug)}>
                  <Button type="submit" variant="ink" className="w-full">
                    <Award /> Claim your certificate
                  </Button>
                </form>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Lock className="size-3" /> {view.done} of {view.total} lessons complete
                    </span>
                    <span className="tabular-nums">{view.percent}%</span>
                  </div>
                  <Progress value={view.percent} className="h-1.5" />
                  <Button asChild variant="outline" size="sm" className="w-full mt-1">
                    <Link href={`/courses/${product.slug}`}>Continue learning</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {owned.length === 0 && (
        <Card className="py-12 text-center">
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Register your Pegasus kit to start your training.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
