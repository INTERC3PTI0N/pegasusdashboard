import { open, stat } from 'fs/promises';
import path from 'path';
import { verifyMediaToken } from '@/lib/auth';
import { getMediaRange } from '@/lib/site/store';

// ponytail: 4 MB ranges stay under Vercel's 4.5 MB response limit. For long, high-bitrate
// courses move videos to a streaming host (Mux / Bunny / Cloudflare Stream) with DRM.
const CHUNK = 4 * 1024 * 1024;
const TYPES: Record<string, string> = { '.mp4': 'video/mp4', '.webm': 'video/webm' };

/**
 * Gated video stream. The lesson page checks the customer's kit and mints a short-lived signed
 * link (?t=) for exactly one source; this route only verifies that signature against the session
 * cookie, so each range costs no database round trip. Bytes go out only as small ranges and only
 * for in-page playback.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const cookie = /(?:^|;\s*)pegasus_session=([^;]+)/.exec(request.headers.get('cookie') ?? '')?.[1];
  const source = verifyMediaToken(url.searchParams.get('t'), cookie && decodeURIComponent(cookie));
  if (!source) return new Response('Not found', { status: 404 });
  // Browsers label <video> requests "video". Opening the URL in a tab ("document") or
  // fetch() from the console ("empty") is not playback.
  const dest = request.headers.get('sec-fetch-dest');
  if (dest && dest !== 'video') return new Response('Forbidden', { status: 403 });

  const m = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('range') ?? '');
  const range = (size: number) => {
    let start = 0;
    let end = size - 1;
    if (m?.[1]) {
      start = Number(m[1]);
      if (m[2]) end = Number(m[2]);
    } else if (m?.[2]) {
      start = Math.max(0, size - Number(m[2])); // suffix range: last N bytes
    }
    return { start, end: Math.min(end, start + CHUNK - 1, size - 1) };
  };

  // The source was signed by the lesson page from the catalog, never taken from the request:
  // either a media-library upload (stored in the database) or a file bundled in /media.
  let size: number;
  let contentType: string;
  let start: number;
  let end: number;
  let buf: Buffer;
  if (source.startsWith('/cms-media/')) {
    const id = source.slice('/cms-media/'.length);
    const wantStart = m?.[1] ? Number(m[1]) : null;
    // A plain "start-" range is answered in one query; a suffix range needs the size first.
    const head = await getMediaRange(id, wantStart ?? 0, wantStart === null ? 0 : CHUNK);
    if (!head) return new Response('Not found', { status: 404 });
    size = head.size;
    contentType = head.contentType;
    ({ start, end } = range(size));
    if (start >= size || start > end) return unsatisfiable(size);
    buf = wantStart === start && head.chunk.length >= end - start + 1
      ? head.chunk.subarray(0, end - start + 1)
      : (await getMediaRange(id, start, end - start + 1))!.chunk;
  } else {
    const file = path.join(process.cwd(), 'media', path.basename(source));
    size = (await stat(file)).size;
    contentType = TYPES[path.extname(file)] ?? 'application/octet-stream';
    ({ start, end } = range(size));
    if (start >= size || start > end) return unsatisfiable(size);
    buf = Buffer.alloc(end - start + 1);
    const fh = await open(file);
    try {
      await fh.read(buf, 0, buf.length, start);
    } finally {
      await fh.close();
    }
  }

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

const unsatisfiable = (size: number) => new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
