import { open, stat } from 'fs/promises';
import path from 'path';
import { getCurrentUser } from '@/lib/auth';
import { ownsProduct } from '@/lib/access';
import { getLesson } from '@/lib/courses';
import { getMediaFile } from '@/lib/site/store';

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
  const found = await getLesson(slug, lessonId);
  if (!user || !found?.lesson.videoFile || !ownsProduct(user, slug)) {
    return new Response('Not found', { status: 404 });
  }
  // Browsers label <video> requests "video". Opening the URL in a tab ("document") or
  // fetch() from the console ("empty") is not playback.
  const dest = request.headers.get('sec-fetch-dest');
  if (dest && dest !== 'video') {
    return new Response('Forbidden', { status: 403 });
  }

  // The source comes from the catalog, never from the request: either a media-library upload
  // (stored in the database) or a file bundled in /media.
  const source = found.lesson.videoFile;
  let size: number;
  let contentType: string;
  let read: (start: number, end: number) => Promise<Buffer>;
  if (source.startsWith('/cms-media/')) {
    const media = await getMediaFile(source.slice('/cms-media/'.length));
    if (!media) return new Response('Not found', { status: 404 });
    size = media.data.length;
    contentType = media.contentType;
    read = async (start, end) => media.data.subarray(start, end + 1);
  } else {
    const file = path.join(process.cwd(), 'media', path.basename(source));
    size = (await stat(file)).size;
    contentType = TYPES[path.extname(file)] ?? 'application/octet-stream';
    read = async (start, end) => {
      const buf = Buffer.alloc(end - start + 1);
      const fh = await open(file);
      try {
        await fh.read(buf, 0, buf.length, start);
      } finally {
        await fh.close();
      }
      return buf;
    };
  }

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

  const buf = await read(start, end);

  return new Response(new Uint8Array(buf), {
    status: 206,
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(buf.length),
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Accept-Ranges': 'bytes',
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
