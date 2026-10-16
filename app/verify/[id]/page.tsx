import Image from 'next/image';
import { BadgeCheck, ShieldX } from 'lucide-react';
import { findCertificate } from '@/lib/store';
import { getProduct } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

/**
 * Public certificate verification — this is the page the QR code opens.
 * No authentication: anyone can confirm who a certificate is assigned to,
 * but it exposes nothing beyond the certificate facts themselves.
 */
export default async function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cert = await findCertificate(id);
  const product = cert ? getProduct(cert.productSlug) : undefined;

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-mist px-4 py-12">
      <Image
        src="/images/pegasus-logo.png"
        alt="Pegasus"
        width={130}
        height={36}
        className="h-8 w-auto mb-8"
        priority
      />

      {cert ? (
        <div className="lux-card w-full max-w-md rounded-xl p-8 text-center space-y-5">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10">
            <BadgeCheck className="size-7 text-primary" />
          </div>
          <div>
            <p className="mono-tag text-[10px] text-primary mb-1">Certificate verified</p>
            <h1 className="editorial-text text-2xl">This certificate is authentic</h1>
          </div>

          <div className="rounded-lg border bg-mist/60 p-5 text-left space-y-3">
            <Row label="Assigned to" value={cert.userName} strong />
            <Row label="Salon / Studio" value={cert.salon} />
            <Row label="Programme" value={cert.productName} />
            {product && <Row label="Series" value={product.line} />}
            <Row
              label="Issued"
              value={new Date(cert.issuedAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            />
            <Row label="Certificate ID" value={cert.id} mono />
          </div>

          <p className="text-xs text-muted-foreground">
            Issued by Pegasus Academy upon full completion of the programme&apos;s tutorials
            and technical guides. If the name above does not match the certificate holder,
            treat the document as invalid.
          </p>
        </div>
      ) : (
        <div className="lux-card w-full max-w-md rounded-xl p-8 text-center space-y-5">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10">
            <ShieldX className="size-7 text-destructive" />
          </div>
          <div>
            <p className="mono-tag text-[10px] text-destructive mb-1">Not found</p>
            <h1 className="editorial-text text-2xl">Certificate could not be verified</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            No certificate with ID <span className="font-mono">{id}</span> exists in the
            Pegasus Academy registry. It may have been mistyped, revoked, or forged.
          </p>
        </div>
      )}

      <p className="mono-tag mt-8 text-[9px] text-muted-foreground/60">
        Pegasus Hair Tools · Certificate Registry
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
  mono,
}: {
  label: string;
  value: string;
  strong?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="mono-tag text-[9px] text-muted-foreground shrink-0">{label}</span>
      <span
        className={`text-right text-sm ${strong ? 'font-semibold text-base' : ''} ${mono ? 'font-mono tracking-wider' : ''}`}
      >
        {value}
      </span>
    </div>
  );
}
