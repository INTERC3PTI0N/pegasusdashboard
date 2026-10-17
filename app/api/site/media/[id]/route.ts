import { getMediaFile } from '@/lib/site/store';

/** Uploaded website images/videos (public). Files never change once uploaded, so cache forever. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response('Not found', { status: 404 });
  const file = await getMediaFile(id);
  if (!file) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(file.data), {
    headers: {
      'Content-Type': file.contentType,
      'Content-Length': String(file.data.length),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
