import { open, stat } from 'fs/promises';
import path from 'path';
import { getCurrentUser } from '@/lib/auth';
import { ownsProduct } from '@/lib/access';
import { getLesson } from '@/lib/catalog';

// ponytail: 1 MB ranges keep each response far under serverless body limits. For long,
// high-bitrate courses move videos to a streaming host (Mux / Bunny / Cloudflare Stream) with DRM.
const CHUNK = 1024 * 1024;
const TYPES: Record<string, string> = { '.mp4': 'video/mp4', '.webm': 'video/webm' };

/**
 * Gated video stream. Only a signed-in owner of the product gets bytes, only as small
 * ranges (no single full-file response to save), and only for in-page playback.
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string; lessonId: string }> }) {
  const { slug, lessonId } = await params;
  const user = await getCurrentUser();
  const found = getLesson(slug, lessonId);
  if (!user || !found?.lesson.videoFile || !ownsProduct(user, slug)) {
    return new Response('Not found', { status: 404 });
  }
  // Browsers label <video> requests "video". Opening the URL in a tab ("document") or
  // fetch() from the console ("empty") is not playback.
  const dest = request.headers.get('sec-fetch-dest');
  if (dest && dest !== 'video') {
    return new Response('Forbidden', { status: 403 });
  }

  // File name comes from the catalog, never from the request.
  const file = path.join(process.cwd(), 'media', found.lesson.videoFile);
  const { size } = await stat(file);

  const m = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('range') ?? '');
  let start = 0;
  let end = size - 1;
  if (m?.[1]) {
    start = Number(m[1]);
    if (m[2]) end = Number(m[2]);
  } else if (m?.[2]) {
    start = Math.max(0, size - Number(m[2])); // suffix range: last N bytes
  }
  if (start >= size || start > end) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
  }
  end = Math.min(end, start + CHUNK - 1, size - 1);

  const buf = Buffer.alloc(end - start + 1);
  const fh = await open(file);
  try {
    await fh.read(buf, 0, buf.length, start);
  } finally {
    await fh.close();
  }

  return new Response(buf, {
    status: 206,
    headers: {
      'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream',
      'Content-Length': String(buf.length),
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Accept-Ranges': 'bytes',
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
