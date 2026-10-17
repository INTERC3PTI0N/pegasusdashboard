import { addLead, type LeadKind } from '@/lib/site/store';
import { hasSiteSecret } from '@/lib/site/remote';

const KINDS: LeadKind[] = ['brochure', 'dealer', 'business'];
const str = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

/** Enquiry forms on the public site post here (server-to-server, with the site secret). */
export async function POST(request: Request) {
  if (!hasSiteSecret(request)) return new Response('Forbidden', { status: 403 });
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: 'Invalid request' }, { status: 400 });

  const kind = body.kind as LeadKind;
  const email = str(body.email, 200);
  if (!KINDS.includes(kind)) return Response.json({ error: 'Invalid enquiry type' }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: 'Enter a valid email address.' }, { status: 400 });

  await addLead({
    kind,
    email,
    name: str(body.name, 120),
    company: str(body.company, 160),
    country: str(body.country, 80),
    role: str(body.role, 80),
    interest: str(body.interest, 80),
    message: str(body.message, 4000),
    marketingConsent: body.marketingConsent === true,
  });
  return Response.json({ ok: true });
}
