import { requireAdmin } from '@/lib/access';
import { listMedia, mediaPath } from '@/lib/site/store';
import { MediaLibrary } from './media-library';

export const dynamic = 'force-dynamic';

export default async function MediaPage() {
  await requireAdmin('site');
  const items = await listMedia();

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <p className="mono-tag text-[10px] text-primary mb-2">Website</p>
        <h1 className="editorial-text text-4xl">Media library</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
          Images and videos for the website. Upload here or straight from any image field in the
          site editor. Images and MP4/WebM videos up to 4 MB each — compress large files first.
        </p>
      </div>
      <MediaLibrary
        items={items.map((m) => ({
          id: m.id,
          path: mediaPath(m.id),
          filename: m.filename,
          contentType: m.contentType,
          size: m.size,
          createdAt: m.createdAt.toISOString(),
          uploadedBy: m.uploadedBy,
        }))}
      />
    </div>
  );
}
