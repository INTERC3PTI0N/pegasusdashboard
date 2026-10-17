import 'server-only';
import { createHmac, timingSafeEqual } from 'crypto';

/**
 * The public site and this app share SITE_SECRET. The site sends it to read drafts and to
 * submit enquiries; this app sends it to tell the site to refresh after a publish.
 */
export function hasSiteSecret(request: Request): boolean {
  const expected = process.env.SITE_SECRET;
  const given = request.headers.get('x-site-secret');
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const siteUrl = () => process.env.SITE_URL?.replace(/\/$/, '') || null;

/** Asks the public site to drop its cached content. Returns whether the site confirmed. */
export async function revalidateSite(): Promise<boolean> {
  const url = siteUrl();
  if (!url || !process.env.SITE_SECRET) return false;
  try {
    const res = await fetch(`${url}/api/revalidate`, {
      method: 'POST',
      headers: { 'x-site-secret': process.env.SITE_SECRET },
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Link that turns on draft preview on the public site, then opens `path`. It carries a token
 * that expires in an hour (HMAC of the expiry), never the shared secret itself.
 */
export function previewUrl(path: string): string | null {
  const url = siteUrl();
  const secret = process.env.SITE_SECRET;
  if (!url || !secret) return null;
  const exp = String(Date.now() + 60 * 60 * 1000);
  const token = `${exp}.${createHmac('sha256', secret).update(`preview:${exp}`).digest('base64url')}`;
  return `${url}/api/preview?token=${token}&path=${encodeURIComponent(path)}`;
}
