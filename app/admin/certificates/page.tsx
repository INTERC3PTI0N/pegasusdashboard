import Link from 'next/link';
import { Award } from 'lucide-react';
import { requireAdmin } from '@/lib/access';
import { getAllCertificates } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const dynamic = 'force-dynamic';

export default async function CertificateRegistryPage() {
  await requireAdmin();
  const certificates = await getAllCertificates(); // newest first

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <p className="mono-tag text-[10px] text-primary mb-2">Registry</p>
        <h1 className="editorial-text text-4xl">Certificates issued</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Every certificate in circulation. Each ID resolves on the public verification page
          the QR code links to.
        </p>
      </div>

      <Card className="py-0">
        <CardContent className="px-3 py-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Certificate ID</TableHead>
                <TableHead>Holder</TableHead>
                <TableHead>Salon / Studio</TableHead>
                <TableHead>Programme</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {certificates.map((cert) => (
                <TableRow key={cert.id}>
                  <TableCell className="font-mono text-xs tracking-wider">{cert.id}</TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/customers/${cert.userId}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {cert.userName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{cert.salon}</TableCell>
                  <TableCell>{cert.productName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(cert.issuedAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/verify/${cert.id}`}
                      target="_blank"
                      className="text-sm text-primary hover:underline"
                    >
                      Verify →
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {certificates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    <Award className="mx-auto mb-2 size-5" />
                    No certificates issued yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
