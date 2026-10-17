import { requireAdmin } from '@/lib/access';
import { getAllCertificates } from '@/lib/store';
import { audit } from '@/lib/site/store';
import { toCsv, csvResponse } from '@/lib/csv';

export async function GET(request: Request) {
  const admin = await requireAdmin('certificates');
  const p = new URL(request.url).searchParams;
  const status = p.get('status');
  const product = p.get('product');
  const q = p.get('q')?.trim().toLowerCase();
  const certs = (await getAllCertificates()).filter(
    (c) =>
      (!status || (status === 'revoked' ? c.revokedAt : !c.revokedAt)) &&
      (!product || c.productSlug === product) &&
      (!q || [c.id, c.userName, c.salon].some((x) => x.toLowerCase().includes(q)))
  );
  const origin = new URL(request.url).origin;
  const csv = toCsv([
    ['Certificate ID', 'Holder', 'Salon', 'Course', 'Issued', 'Status', 'Revoked at', 'Revoked by', 'Reason', 'Verification URL'],
    ...certs.map((c) => [
      c.id, c.userName, c.salon, c.productName, c.issuedAt, c.revokedAt ? 'revoked' : 'active',
      c.revokedAt ?? '', c.revokedBy ?? '', c.revokedReason ?? '', `${origin}/verify/${c.id}`,
    ]),
  ]);
  await audit(admin, 'certificate.export', `${certs.length} certificates`);
  return csvResponse(csv, 'pegasus-certificates');
}
