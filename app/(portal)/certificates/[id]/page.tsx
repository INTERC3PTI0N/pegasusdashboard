import Link from 'next/link';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import QRCode from 'qrcode';
import { ArrowLeft, BadgeCheck } from 'lucide-react';
import { requireUser } from '@/lib/access';
import { findCertificate } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { PrintButton } from './print-button';

export const dynamic = 'force-dynamic';

export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const cert = findCertificate(id);
  // Certificates are private to their owner inside the portal;
  // third parties verify via the public /verify/[id] QR link instead.
  if (!cert || cert.userId !== user.id) notFound();

  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const verifyUrl = `${proto}://${host}/verify/${cert.id}`;

  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 240,
    margin: 1,
    color: { dark: '#101014', light: '#ffffff' },
  });

  const issued = new Date(cert.issuedAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/certificates"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" /> All certificates
        </Link>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/verify/${cert.id}`} target="_blank">
              Open verification page
            </Link>
          </Button>
          <PrintButton />
        </div>
      </div>

      {/* The certificate itself */}
      <div className="certificate-print lux-card relative overflow-hidden rounded-xl border bg-white p-8 md:p-14">
        {/* Decorative frame */}
        <div className="pointer-events-none absolute inset-4 rounded-lg border border-ink/10" />
        <div className="pointer-events-none absolute inset-5 rounded-md border border-primary/25" />

        <div className="relative text-center space-y-6">
          <div className="space-y-2">
            <img
              src="/images/pegasus-logo.png"
              alt="Pegasus"
              className="mx-auto h-9 w-auto"
            />
            <p className="mono-tag text-[9px] text-muted-foreground">
              Pegasus Academy · Engineering Since 1961
            </p>
          </div>

          <div className="space-y-1">
            <p className="mono-tag text-[10px] text-primary">Certificate of Mastery</p>
            <h1 className="editorial-text text-3xl md:text-4xl">{cert.productName}</h1>
          </div>

          <div className="space-y-1.5">
            <p className="text-sm text-muted-foreground">This certifies that</p>
            <p className="editorial-text text-4xl md:text-5xl italic">{cert.userName}</p>
            <p className="text-sm text-muted-foreground">{cert.salon}</p>
          </div>

          <p className="mx-auto max-w-md text-sm leading-relaxed text-foreground/75">
            has completed every tutorial and technical guide of the {cert.productName} programme
            and demonstrates full command of its professional techniques and care standards.
          </p>

          <div className="flex flex-col items-center gap-6 pt-2 md:flex-row md:justify-center md:gap-14">
            <div className="text-center md:text-right">
              <p className="mono-tag text-[9px] text-muted-foreground mb-1">Issued</p>
              <p className="text-sm font-medium">{issued}</p>
              <p className="mono-tag text-[9px] text-muted-foreground mt-3 mb-1">Certificate ID</p>
              <p className="font-mono text-sm tracking-wider">{cert.id}</p>
            </div>

            <div className="flex flex-col items-center gap-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt={`QR code verifying certificate ${cert.id}`} className="size-28 rounded-md border p-1.5" />
              <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <BadgeCheck className="size-3 text-primary" /> Scan to verify holder
              </p>
            </div>

            <div className="text-center md:text-left">
              <p className="editorial-text text-2xl italic text-ink/80">Pegasus</p>
              <div className="mt-1 h-px w-36 bg-ink/20" />
              <p className="mono-tag mt-1 text-[9px] text-muted-foreground">Director of Education</p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground print:hidden">
        Anyone scanning the QR code sees the public verification page confirming this
        certificate is assigned to {cert.userName} — no sign-in required.
      </p>
    </div>
  );
}
