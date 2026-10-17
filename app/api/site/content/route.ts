import { getSiteContent } from '@/lib/site/store';
import { hasSiteSecret } from '@/lib/site/remote';

/** Published website content (public). `?draft=1` with the site secret returns drafts for preview. */
export async function GET(request: Request) {
  const wantsDraft = new URL(request.url).searchParams.get('draft') === '1';
  if (wantsDraft && !hasSiteSecret(request)) return new Response('Forbidden', { status: 403 });
  return Response.json(await getSiteContent(wantsDraft), { headers: { 'Cache-Control': 'no-store' } });
}
