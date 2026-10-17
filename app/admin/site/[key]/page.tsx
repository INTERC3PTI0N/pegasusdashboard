import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireAdmin } from '@/lib/access';
import { getDocDef } from '@/lib/site/schema';
import { getDocState, getVersions } from '@/lib/site/store';
import { previewUrl, siteUrl } from '@/lib/site/remote';
import { Editor } from './editor';

export const dynamic = 'force-dynamic';

export default async function EditDocPage({ params }: { params: Promise<{ key: string }> }) {
  await requireAdmin('site');
  const { key } = await params;
  const def = getDocDef(decodeURIComponent(key));
  if (!def) notFound();

  const [state, versions] = await Promise.all([getDocState(def.key), getVersions(def.key)]);
  const site = siteUrl();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Link
          href="/admin/site"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Site content
        </Link>
        <p className="mono-tag mt-4 text-[10px] text-primary">{def.group}</p>
        <h1 className="editorial-text text-4xl">{def.label}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{def.description}</p>
      </div>

      <Editor
        docKey={def.key}
        fields={def.fields}
        initial={state.content}
        status={{
          hasDraft: state.hasDraft,
          isPublished: state.isPublished,
          updatedAt: state.updatedAt?.toISOString() ?? null,
          updatedBy: state.updatedBy,
          publishedAt: state.publishedAt?.toISOString() ?? null,
          publishedBy: state.publishedBy,
        }}
        versions={versions.map((v) => ({ id: v.id, publishedAt: v.publishedAt.toISOString(), publishedBy: v.publishedBy }))}
        liveUrl={site ? site + def.path : null}
        previewUrl={previewUrl(def.path)}
        siteUrl={site}
      />
    </div>
  );
}
