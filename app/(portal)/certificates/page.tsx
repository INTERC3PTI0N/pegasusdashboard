import Link from 'next/link';
import Image from 'next/image';
import { Award, ArrowRight, Lock } from 'lucide-react';
import { requireUser } from '@/lib/access';
import { products } from '@/lib/catalog';
import { getAllProgress, getCertificates } from '@/lib/store';
import { generateCertificate } from '@/app/actions';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function CertificatesPage() {
  const user = await requireUser();
  const progress = getAllProgress(user.id);
  const certificates = getCertificates(user.id);

  const owned = products.filter((p) => user.entitlements.includes(p.slug));

  const rows = owned.map((p) => {
    const done = progress[p.slug]?.length ?? 0;
    const percent = Math.round((done / p.lessons.length) * 100);
    const cert = certificates.find((c) => c.productSlug === p.slug);
    return { product: p, percent, cert };
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <p className="mono-tag text-[10px] text-primary mb-2">Certification</p>
        <h1 className="editorial-text text-4xl">Certificates</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
          Complete every lesson in a course to earn its Pegasus Academy certificate. Each
          certificate carries a unique ID and QR code so clients and employers can verify it
          is genuinely assigned to you.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {rows.map(({ product, percent, cert }) => (
          <Card key={product.slug} className="overflow-hidden py-0 gap-0">
            <div className="relative h-32">
              <Image src={product.image} alt={product.name} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-ink/10" />
              <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                <p className="mono-tag text-[9px] text-white/80">{product.line}</p>
                {cert && <Badge className="gap-1"><Award className="size-3" /> Earned</Badge>}
              </div>
            </div>
            <CardContent className="p-5 space-y-4">
              <div>
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {cert
                    ? `Certificate ${cert.id} · issued ${new Date(cert.issuedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
                    : 'Mastery Certification'}
                </p>
              </div>

              {cert ? (
                <Button asChild className="w-full">
                  <Link href={`/certificates/${cert.id}`}>
                    View certificate <ArrowRight />
                  </Link>
                </Button>
              ) : percent === 100 ? (
                <form action={generateCertificate.bind(null, product.slug)}>
                  <Button type="submit" variant="ink" className="w-full">
                    <Award /> Claim your certificate
                  </Button>
                </form>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Lock className="size-3" /> Complete the course to unlock
                    </span>
                    <span className="tabular-nums">{percent}%</span>
                  </div>
                  <Progress value={percent} className="h-1.5" />
                  <Button asChild variant="outline" size="sm" className="w-full mt-1">
                    <Link href={`/products/${product.slug}`}>Continue course</Link>
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
              Register a Pegasus product to start working toward certification.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
