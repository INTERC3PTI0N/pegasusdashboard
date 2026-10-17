import Link from 'next/link';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import QRCode from 'qrcode';
import { ArrowLeft } from 'lucide-react';
import { requireUser } from '@/lib/access';
import { findCertificate } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { PrintButton } from './print-button';

export const dynamic = 'force-dynamic';

export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const cert = await findCertificate(id);
  // Certificates are private to their owner inside the portal;
  // third parties verify via the public /verify/[id] QR link instead.
  if (!cert || cert.userId !== user.id || cert.revokedAt) notFound();

  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const verifyUrl = `${proto}://${host}/verify/${cert.id}`;

  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 240,
    margin: 1,
    color: { dark: '#101014', light: '#ffffff' },
  });

  const issued = new Date(cert.issuedAt).toLocaleDateString('it-IT', {
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

      {/* The certificate itself: the PDF artwork with the placeholders stripped,
          live fields overlaid at the same positions (percent of the page). */}
      <div
        className="certificate-print relative aspect-[859/612] overflow-hidden rounded-xl text-[#f9f9f6] shadow-lg"
        style={{ containerType: 'inline-size', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/certificate-bg.jpg" alt="" className="absolute inset-0 size-full" />
        <p className="absolute inset-x-0 top-[45.2%] text-center uppercase" style={{ fontSize: '3.33cqw' }}>
          {cert.userName}
        </p>
        <div className="absolute left-[72.9%] top-[75.6%] -translate-x-1/2 space-y-[3cqw] whitespace-nowrap text-center" style={{ fontSize: '1.55cqw' }}>
          <p>Certificato n. {cert.id}</p>
          <p>Rilasciato il {issued}</p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          alt={`QR code verifying certificate ${cert.id}`}
          className="absolute left-[90%] top-[73.5%] w-[7%] rounded-[0.5cqw]"
        />
      </div>

      <p className="text-center text-xs text-muted-foreground print:hidden">
        Anyone scanning the QR code sees the public verification page confirming this
        certificate is assigned to {cert.userName} — no sign-in required.
      </p>
    </div>
  );
}
